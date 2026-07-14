import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Brain, TrendingUp, ShieldAlert, Leaf,
  FileText, BarChart2, Activity,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, ChatAttachment } from "@/components/chat-input-bar";

interface SubAgentStatus {
  agentId: number; role: string;
  status: "waiting" | "running" | "done" | "error";
  elapsed?: number; preview?: string;
}
interface Message {
  role: "user" | "assistant"; content: string;
  isStreaming?: boolean; subAgents?: SubAgentStatus[]; orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "BRAIN-PROXIMA": { icon: <Brain className="h-3 w-3" />,      label: "Project Manager",     color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",       code: "PM" },
  "BRAIN-EVM":     { icon: <TrendingUp className="h-3 w-3" />, label: "Earned Value",         color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       code: "EVM" },
  "BRAIN-MUTU":    { icon: <BarChart2 className="h-3 w-3" />,  label: "Mutu Proyek",          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", code: "QC" },
  "BRAIN-SAFIRA":  { icon: <ShieldAlert className="h-3 w-3" />,label: "K3 Lapangan",          color: "bg-red-500/20 text-red-300 border-red-500/30",          code: "K3" },
  "BRAIN-ENVIRA":  { icon: <Leaf className="h-3 w-3" />,       label: "Lingkungan",           color: "bg-green-500/20 text-green-300 border-green-500/30",    code: "ENV" },
  "BRAIN-KONTRAK": { icon: <FileText className="h-3 w-3" />,   label: "Kontrak & Klaim",      color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", code: "KLM" },
};

const AGENT_LEGEND = ["BRAIN-PROXIMA","BRAIN-EVM","BRAIN-MUTU","BRAIN-SAFIRA","BRAIN-ENVIRA","BRAIN-KONTRAK"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <Activity className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
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
    <div className="mt-2 rounded-lg border border-cyan-800/40 bg-cyan-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Brain className="h-3 w-3 text-cyan-400 shrink-0" />
        <span className="text-cyan-300 font-medium">{running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}</span>
        <div className="flex gap-1 ml-auto flex-wrap">
          {agents.map((a, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />)}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-cyan-800/30 px-3 py-2 grid grid-cols-2 gap-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            return (
              <div key={i} className="flex items-center gap-1.5">
                {statusIcon(a.status)}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}>{meta.icon}<span className="font-mono text-[10px]">{meta.code}</span></div>
                <span className="text-white/40 text-[10px] truncate">{meta.label}</span>
                {a.elapsed && <span className="text-white/25 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-cyan-950/70 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-cyan-900/60 border border-cyan-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">🧠</div>
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
  { icon: "📊", text: "Analisis EVM proyek kami: nilai kontrak Rp 200M, progress fisik 45%, actual cost Rp 95M. Hitung SPI, CPI, EAC, TCPI, dan berikan rekomendasi recovery plan." },
  { icon: "📈", text: "Review progress proyek bulan ini: struktur 80%, MEP 40%, finishing 10%. Identifikasi risiko delay terbesar dan rencana mitigasi dengan impact-probability matrix." },
  { icon: "📝", text: "Buat laporan proyek bulanan lengkap untuk owner — ringkasan fisik, keuangan, K3, mutu, isu kontrak, dan rekomendasi tindakan strategis." },
  { icon: "⚖️", text: "Kontraktor mengajukan klaim Rp 15M untuk pekerjaan tambah yang tidak tercantum dalam kontrak. Evaluasi validitas klaim dan susun posisi negosiasi kami." },
  { icon: "🗺️", text: "Susun Project Execution Plan (PEP) untuk proyek jalan tol 25 km: jadwal, organisasi, sistem mutu, K3, manajemen lingkungan, dan rencana keuangan." },
  { icon: "⚡", text: "Proyek kami SPI 0.87 dan CPI 0.93, BAC Rp 500M. Berikan early warning dashboard, proyeksi penyelesaian, dan action plan pemulihan 90 hari." },
];

const BRAIN_TAGS = [
  { label: "EVM: SPI · CPI · EAC · TCPI" }, { label: "Laporan Proyek Terpadu" },
  { label: "Early Warning & Recovery" }, { label: "Analisis Klaim Kontrak" },
  { label: "Project Execution Plan" }, { label: "Risk Dashboard" },
];

export default function BrainClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/brain-project/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/brain-project/orchestrator");
      if (!res.ok) throw new Error("BrainClaw not found");
      return res.json();
    },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if ((!text.trim() && files.length === 0) || streaming || !agentId) return; setStreaming(true);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true, subAgents: [] }]);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const orchStart = Date.now();
    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history }, ...(files.length ? { attachments: files } : {})),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      let buffer = "", fullContent = "";
      const subAgentMap = new Map<number, SubAgentStatus>();
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6); if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "orchestrating_start") {
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((sa: any) => ({ agentId: sa.agentId, role: sa.role, status: "waiting" as const }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "sub_agent_start") {
              const s=subAgentMap.get(evt.agentId); if(s){s.status="running";subAgentMap.set(evt.agentId,{...s});}
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "sub_agent_done") {
              const s=subAgentMap.get(evt.agentId); if(s){s.status="done";s.elapsed=evt.elapsed;s.preview=evt.preview;subAgentMap.set(evt.agentId,{...s});}
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "chunk") {
              fullContent+=evt.content??"";
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,content:fullContent,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "complete") {
              if(evt.message?.content) fullContent=evt.message.content;
            }
          } catch {}
        }
      }
      const orchMs = Date.now()-orchStart;
      setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs}; return u; });
    } catch {
      setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false}; return u; });
    } finally { setStreaming(false);  }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#020d0e] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#030f10]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="w-9 h-9 rounded-full bg-cyan-900/60 border border-cyan-700/40 flex items-center justify-center text-lg">🧠</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">BrainClaw — Project Intelligence AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-cyan-400" /><span>6 Spesialis Paralel · PM · EVM · Mutu · K3 · Lingkungan · Kontrak</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-300 hidden sm:flex">BrainClaw · 6 Agen</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#030f10]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">6 Spesialis:</span>
        {AGENT_LEGEND.map(role => { const meta = getRoleMeta(role); return (
          <div key={role} className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`}>
            {meta.icon}<span className="font-mono text-[10px]">{meta.code}</span>
          </div>
        ); })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden lg:inline">PM · EVM · QC · K3 · ENV · KLM</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🧠</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">BrainClaw — Project Intelligence</div>
              <div className="text-sm text-white/50 max-w-2xl">
                <span className="text-cyan-300">PM</span> (project control & WBS) · <span className="text-teal-300">EVM</span> (SPI, CPI, EAC, TCPI) · <span className="text-emerald-300">QC</span> (mutu & inspeksi) · <span className="text-red-300">K3</span> (keselamatan lapangan) · <span className="text-green-300">ENV</span> (lingkungan & kepatuhan) · <span className="text-indigo-300">KLM</span> (klaim & negosiasi kontrak)
              </div>
              <div className="text-xs text-white/30 mt-2">Referensi: PMBOK 7 · FIDIC 2017 · ISO 9001 · SMK3 PP 50/2012 · ISO 14001 · PSAK 34</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {BRAIN_TAGS.map(c => <span key={c.label} className="px-2 py-0.5 rounded border border-cyan-800/40 bg-cyan-950/20 text-cyan-300/70">{c.label}</span>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
          </div>
        ) : <div>{messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}</div>}
      </ScrollArea>

      <ChatInputBar
        lastAIMessage={[...messages].reverse().find((m) => m.role === "assistant")?.content}
        onSend={sendMessage}
        disabled={!ready || streaming}
        streaming={streaming}
        placeholder={ready ? "Tanya tentang EVM, progress proyek, klaim kontrak, early warning, laporan bulanan…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
