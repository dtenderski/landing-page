import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, ChevronDown, ChevronUp, Search, ClipboardList,
  HardHat, BarChart2, FileText, Layers, Activity,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, ChatAttachment } from "@/components/chat-input-bar";

interface SubAgentStatus {
  agentId: number;
  role: string;
  status: "waiting" | "running" | "done" | "error";
  elapsed?: number;
  preview?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  subAgents?: SubAgentStatus[];
  orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "AGENT-GAPIIMS": { icon: <Search className="h-3 w-3" />, label: "Gap IMS", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", code: "GAP" },
  "AGENT-AUDIT":   { icon: <ClipboardList className="h-3 w-3" />, label: "Audit IMS", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", code: "AUD" },
  "AGENT-SMK3":    { icon: <Layers className="h-3 w-3" />, label: "SMK3", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", code: "SMK" },
  "AGENT-ASSESS":  { icon: <Activity className="h-3 w-3" />, label: "Self-Assess", color: "bg-red-500/20 text-red-300 border-red-500/30", code: "ASS" },
  "AGENT-RKK":     { icon: <FileText className="h-3 w-3" />, label: "RKK & P2K3", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", code: "RKK" },
  "AGENT-CSMS":    { icon: <ShieldCheck className="h-3 w-3" />, label: "CSMS Pre-Qual", color: "bg-pink-500/20 text-pink-300 border-pink-500/30", code: "CSM" },
  "AGENT-STATK3":  { icon: <BarChart2 className="h-3 w-3" />, label: "Statistik K3", color: "bg-purple-500/20 text-purple-300 border-purple-500/30", code: "STK" },
};

const AGENT_LEGEND = ["AGENT-GAPIIMS","AGENT-AUDIT","AGENT-SMK3","AGENT-ASSESS","AGENT-RKK","AGENT-CSMS","AGENT-STATK3"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <HardHat className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
}

function statusIcon(s: SubAgentStatus["status"]) {
  if (s === "running") return <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />;
  if (s === "done")    return <CheckCircle2 className="h-3 w-3 text-green-400" />;
  if (s === "error")   return <AlertCircle className="h-3 w-3 text-red-400" />;
  return <Clock className="h-3 w-3 text-white/30" />;
}

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-orange-800/40 bg-orange-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <HardHat className="h-3 w-3 text-orange-400 shrink-0" />
        <span className="text-orange-300 font-medium">{running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}</span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
      </button>
      {expanded && (
        <div className="border-t border-orange-800/30 px-3 py-2 space-y-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            return (
              <div key={i} className="flex items-start gap-2">
                {statusIcon(a.status)}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}>
                  {meta.icon}<span className="font-mono">{meta.code}</span><span className="text-white/40">·</span><span>{meta.label}</span>
                </div>
                {a.elapsed && <span className="text-white/30 ml-auto">{(a.elapsed/1000).toFixed(1)}s</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-orange-900/70 text-white text-sm">{msg.content}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-orange-900/60 border border-orange-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">🦺</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && <SubAgentPanel agents={msg.subAgents} />}
        <div className="mt-2" style={{ wordBreak: "break-word" }}>
          {msg.isStreaming && !msg.content ? <span className="animate-pulse text-white/60">▋</span> : <MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed" />}
        </div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs && msg.subAgents && msg.subAgents.length > 0 && !msg.isStreaming && (
          <div className="flex items-center gap-1 text-xs text-white/30 px-1 mt-1"><Zap className="h-2.5 w-2.5" /><span>{msg.subAgents.length} agen paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span></div>
        )}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "🔍", text: "Lakukan gap analysis IMS terintegrasi (SMK3 + ISO 45001 + ISO 14001) untuk perusahaan konstruksi kami yang belum memiliki SML maupun SMK3 tersertifikasi." },
  { icon: "📊", text: "Bantu saya self-assessment SMK3 PP 50/2012: berikan checklist 166 kriteria dan identifikasi mana yang kritikal untuk audit." },
  { icon: "📄", text: "Buat Rencana K3 Kontrak (RKK) dan Program P2K3 untuk proyek gedung 12 lantai dengan nilai kontrak Rp 50 miliar." },
  { icon: "✅", text: "Rencanakan audit internal IMS kami — jadwal, checklist per klausul ISO 45001 + 14001, dan format temuan/CAPA." },
  { icon: "🏭", text: "Buatkan paket dokumen CSMS Pre-Qualification untuk tender minyak dan gas. Kami kontraktor konstruksi skala menengah." },
  { icon: "📈", text: "Hitung dan analisis statistik K3 kami: TRIR, LTIR, severity rate, dan frequency rate dari data kecelakaan 2024." },
];

const SMK3_TAGS = [
  { label: "PP 50/2012 SMK3" }, { label: "ISO 45001:2018" }, { label: "RKK & P2K3" },
  { label: "CSMS Pre-Qual" }, { label: "IMS Terintegrasi" }, { label: "Statistik K3" },
  { label: "Audit Internal" }, { label: "166 Kriteria" },
];

export default function Smk3ClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/smk3-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/smk3-claw/orchestrator");
      if (!res.ok) throw new Error("SMK3Claw orchestrator not found");
      return res.json();
    },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if ((!text.trim() && files.length === 0) || streaming || !agentId) return; setStreaming(true);
    const userMsg: Message = { role: "user", content: text, attachments: files.length ? files : undefined };
    setMessages(prev => [...prev, userMsg]);
    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true, subAgents: [] };
    setMessages(prev => [...prev, assistantMsg]);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const orchStart = Date.now();
    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history }, ...(files.length ? { attachments: files } : {})),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullContent = "";
      const subAgentMap = new Map<number, SubAgentStatus>();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "orchestrating_start") {
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((sa: any) => ({ agentId: sa.agentId, role: sa.role, status: "waiting" as const }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "sub_agent_start") {
              const s = subAgentMap.get(evt.agentId); if(s){s.status="running";subAgentMap.set(evt.agentId,{...s});}
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "sub_agent_done") {
              const s = subAgentMap.get(evt.agentId); if(s){s.status="done";s.elapsed=evt.elapsed;s.preview=evt.preview;subAgentMap.set(evt.agentId,{...s});}
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,content:fullContent,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "complete") {
              if (evt.message?.content) fullContent = evt.message.content;
            }
          } catch {}
        }
      }
      const orchMs = Date.now() - orchStart;
      setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs}; return u; });
    } catch {
      setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false}; return u; });
    } finally { setStreaming(false);  }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#0d0800] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0e0901]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-orange-900/60 border border-orange-700/40 flex items-center justify-center text-lg">🦺</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">SMK3Claw — IMS & SMK3 Terintegrasi AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-orange-400" />
            <span>7 Spesialis Paralel · PP 50/2012 · ISO 45001 · CSMS · RKK · P2K3 · Statistik K3</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-300 hidden sm:flex">SMK3Claw</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#0e0901]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
              {meta.icon}
              <span className="font-mono text-[10px]">{meta.code}</span>
              <span className="hidden sm:inline text-[10px]">· {meta.label}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">SMK3 · IMS · CSMS · ISO 45001 · 166 Kriteria · RKK · P2K3 · Statistik K3</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🦺</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">SMK3Claw — IMS & K3 Konstruksi Terintegrasi</div>
              <div className="text-sm text-white/50 max-w-lg">
                7 spesialis paralel: <span className="text-orange-300">GAP</span> (gap analysis IMS) · <span className="text-amber-300">AUD</span> (audit internal) · <span className="text-yellow-300">SMK</span> (SMK3 PP 50/2012) · <span className="text-red-300">ASS</span> (self-assessment 166 kriteria) · <span className="text-rose-300">RKK</span> (RKK & P2K3) · <span className="text-pink-300">CSM</span> (CSMS pre-qual) · <span className="text-purple-300">STK</span> (statistik K3)
              </div>
              <div className="text-xs text-white/30 mt-2">Referensi: PP 50/2012 SMK3 · ISO 45001:2018 · ISO 14001:2015 · PermenLHK · SKK K3 Konstruksi</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {SMK3_TAGS.map(c => <span key={c.label} className="px-2 py-0.5 rounded border border-orange-800/40 bg-orange-950/20 text-orange-300/70">{c.label}</span>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-orange-500/40 hover:bg-orange-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>{messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}</div>
        )}
      </ScrollArea>

      <ChatInputBar
        lastAIMessage={[...messages].reverse().find((m) => m.role === "assistant")?.content}
        onSend={sendMessage}
        disabled={!ready || streaming}
        streaming={streaming}
        placeholder={ready ? "Tanya tentang SMK3, IMS, CSMS, RKK, gap analysis, statistik K3…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
