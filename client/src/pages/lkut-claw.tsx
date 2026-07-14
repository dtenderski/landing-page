import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  FileText, ChevronDown, ChevronUp, HardHat, BarChart2, Building2, TrendingUp,
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
  "AGENT-KONTRAKTOR": { icon: <Building2 className="h-3 w-3" />, label: "LKUT Kontraktor", color: "bg-teal-500/20 text-teal-300 border-teal-500/30", code: "KTR" },
  "AGENT-KONSULTAN":  { icon: <FileText className="h-3 w-3" />, label: "LKUT Konsultan", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", code: "KSL" },
  "AGENT-PENYUSUN":   { icon: <HardHat className="h-3 w-3" />, label: "Penyusunan LKUT", color: "bg-sky-500/20 text-sky-300 border-sky-500/30", code: "SUS" },
  "AGENT-ANALISIS":   { icon: <TrendingUp className="h-3 w-3" />, label: "Analisis Keuangan", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", code: "ANL" },
};

const AGENT_LEGEND = ["AGENT-KONTRAKTOR","AGENT-KONSULTAN","AGENT-PENYUSUN","AGENT-ANALISIS"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <BarChart2 className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
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
    <div className="mt-2 rounded-lg border border-teal-800/40 bg-teal-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <FileText className="h-3 w-3 text-teal-400 shrink-0" />
        <span className="text-teal-300 font-medium">{running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}</span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
      </button>
      {expanded && (
        <div className="border-t border-teal-800/30 px-3 py-2 space-y-1.5">
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-teal-900/70 text-white text-sm">{msg.content}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">📊</div>
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
  { icon: "📋", text: "Jelaskan kewajiban pelaporan LKUT untuk BUJK kontraktor — kapan harus diserahkan, ke mana, dan apa sanksinya jika terlambat?" },
  { icon: "🏗️", text: "Bantu saya menyusun LKUT untuk perusahaan kontraktor jasa konstruksi: apa saja data yang harus dikumpulkan dan bagaimana formatnya?" },
  { icon: "🏢", text: "Kami perusahaan konsultan perencana. Apa perbedaan format LKUT konsultan vs kontraktor? Data apa yang berbeda?" },
  { icon: "📊", text: "Analisis rasio keuangan BUJK kami — berikan template laporan keuangan dan indikator yang relevan untuk pelaporan LKUT." },
  { icon: "🔍", text: "Apa saja kesalahan umum dalam pengisian LKUT yang sering menyebabkan penolakan di OSS/LPJK? Bagaimana cara menghindarinya?" },
  { icon: "📅", text: "Buatkan timeline lengkap persiapan dan penyampaian LKUT tahunan — dari rekap data proyek sampai submit akhir." },
];

const LKUT_TAGS = [
  { label: "UU 2/2017 JK" }, { label: "PP 14/2021" }, { label: "LKUT Kontraktor" },
  { label: "LKUT Konsultan" }, { label: "OSS-RBA" }, { label: "LPJK" },
  { label: "Rasio Keuangan" }, { label: "Laporan Tahunan" },
];

export default function LkutClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/lkut-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/lkut-claw/orchestrator");
      if (!res.ok) throw new Error("LKUTClaw orchestrator not found");
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
    <div className="flex flex-col h-screen bg-[#030d0c] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#040e0d]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-700/40 flex items-center justify-center text-lg">📊</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">LKUTClaw — Laporan Kegiatan Usaha Tahunan BUJK AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-teal-400" />
            <span>4 Spesialis Paralel · LKUT Kontraktor · LKUT Konsultan · Penyusunan · Analisis Keuangan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-500/40 text-teal-300 hidden sm:flex">LKUTClaw</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#040e0d]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">4 Spesialis:</span>
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
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">LKUT · PP 14/2021 · UU 2/2017 · OSS-RBA · LPJK · Laporan Tahunan BUJK</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">📊</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">LKUTClaw — Laporan Kegiatan Usaha Tahunan BUJK</div>
              <div className="text-sm text-white/50 max-w-lg">
                4 spesialis paralel: <span className="text-teal-300">KTR</span> (LKUT kontraktor) · <span className="text-cyan-300">KSL</span> (LKUT konsultan) · <span className="text-sky-300">SUS</span> (penyusunan & format LKUT) · <span className="text-indigo-300">ANL</span> (analisis keuangan & rasio BUJK)
              </div>
              <div className="text-xs text-white/30 mt-2">Referensi: UU 2/2017 JK · PP 14/2021 · Permen PU 6/2025 · OSS-RBA · LPJK</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {LKUT_TAGS.map(c => <span key={c.label} className="px-2 py-0.5 rounded border border-teal-800/40 bg-teal-950/20 text-teal-300/70">{c.label}</span>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-teal-500/40 hover:bg-teal-900/20 transition-all disabled:opacity-40 text-white/70"
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
        placeholder={ready ? "Tanya tentang LKUT, penyusunan laporan, format kontraktor/konsultan, rasio keuangan…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
