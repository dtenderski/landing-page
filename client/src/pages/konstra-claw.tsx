import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, HardHat, Wrench, FileText, ShieldAlert,
  BarChart2, Truck, DollarSign, Leaf, ClipboardCheck, Building2,
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
  "AGENT-PROXIMA":  { icon: <Building2 className="h-3 w-3" />,     label: "Project Manager",   color: "bg-slate-500/20 text-slate-300 border-slate-500/30",   code: "PM" },
  "AGENT-TEKNIK":   { icon: <Wrench className="h-3 w-3" />,        label: "Engineering",        color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",      code: "TEK" },
  "AGENT-KONTRAK":  { icon: <FileText className="h-3 w-3" />,      label: "Kontrak/FIDIC",      color: "bg-stone-500/20 text-stone-300 border-stone-500/30",   code: "KON" },
  "AGENT-SAFIRA":   { icon: <HardHat className="h-3 w-3" />,       label: "K3 & SMK3",          color: "bg-red-500/20 text-red-300 border-red-500/30",         code: "K3" },
  "AGENT-MUTU":     { icon: <ClipboardCheck className="h-3 w-3" />, label: "Mutu/ISO 9001",     color: "bg-blue-500/20 text-blue-300 border-blue-500/30",      code: "QC" },
  "AGENT-ENVIRA":   { icon: <Leaf className="h-3 w-3" />,          label: "LH/ISO 14001",       color: "bg-green-500/20 text-green-300 border-green-500/30",   code: "ENV" },
  "AGENT-EQUIPRA":  { icon: <Truck className="h-3 w-3" />,         label: "Peralatan/OEE",      color: "bg-orange-500/20 text-orange-300 border-orange-500/30",code: "EQP" },
  "AGENT-LOGIS":    { icon: <BarChart2 className="h-3 w-3" />,     label: "Supply Chain",       color: "bg-purple-500/20 text-purple-300 border-purple-500/30",code: "LOG" },
  "AGENT-FINTAX":   { icon: <DollarSign className="h-3 w-3" />,    label: "Keuangan/PSAK34",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", code: "FIN" },
};

const AGENT_LEGEND = ["AGENT-PROXIMA","AGENT-TEKNIK","AGENT-KONTRAK","AGENT-SAFIRA","AGENT-MUTU","AGENT-ENVIRA","AGENT-EQUIPRA","AGENT-LOGIS","AGENT-FINTAX"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <ShieldAlert className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
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
    <div className="mt-2 rounded-lg border border-slate-700/40 bg-slate-900/30 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-slate-300 font-medium">{running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}</span>
        <div className="flex gap-1 ml-auto flex-wrap">
          {agents.map((a, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />)}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-slate-700/30 px-3 py-2 grid grid-cols-2 gap-1.5">
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
  if (msg.role === "user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-slate-800/70 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏗️</div>
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
  { icon: "📅", text: "Buat WBS dan jadwal proyek gedung 10 lantai senilai Rp 150M. Identifikasi jalur kritis, milestone utama, dan early warning delay." },
  { icon: "⚖️", text: "Kontraktor kami mengajukan klaim EOT 30 hari akibat hujan ekstrem dan VO tambahan 15% dari nilai kontrak FIDIC Red Book. Bagaimana prosedur dan posisi negosiasi yang tepat?" },
  { icon: "🦺", text: "Susun JSA dan rencana K3 untuk pekerjaan galian dalam 8 meter + confined space entry. Matriks risiko 5×5 dan pengendalian risiko hierarki." },
  { icon: "📋", text: "Buat ITP (Inspection & Test Plan) untuk pekerjaan struktur beton bertulang: kolom, balok, dan pelat. Sertakan checklist NCR dan format berita acara serah terima." },
  { icon: "🚛", text: "Hitung OEE excavator PC200 kami: downtime 12%, speed loss 8%, rework 3%. Buat maintenance schedule preventif dan KPI alat berat proyek." },
  { icon: "💰", text: "Analisis cashflow proyek 12 bulan: progress billing Rp 80M vs actual cost Rp 95M. Hitung EVM (SPI, CPI, EAC, TCPI) dan berikan rekomendasi recovery plan." },
];

const KONSTRA_TAGS = [
  { label: "WBS & CPM Schedule" }, { label: "Klaim & EOT FIDIC" }, { label: "JSA & Rencana K3" },
  { label: "ITP & NCR Mutu" }, { label: "OEE Alat Berat" }, { label: "EVM & Cashflow" },
  { label: "Pengadaan & Subkon" }, { label: "PSAK 34 & PPh Konstruksi" },
];

export default function KonstraClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/konstra-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/konstra-claw/orchestrator");
      if (!res.ok) throw new Error("KonstraClaw not found");
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
    <div className="flex flex-col h-screen bg-[#090b0d] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0a0c0f]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-600/40 flex items-center justify-center text-lg">🏗️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">KonstraClaw — Manajemen Proyek Konstruksi AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-slate-400" /><span>9 Spesialis Paralel · PM · Teknik · FIDIC · K3 · Mutu · LH · Alat · Logistik · Keuangan</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-slate-500/40 text-slate-300 hidden sm:flex">KonstraClaw · 9 Agen</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0a0c0f]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">9 Spesialis:</span>
        {AGENT_LEGEND.map(role => { const meta = getRoleMeta(role); return (
          <div key={role} className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`}>
            {meta.icon}<span className="font-mono text-[10px]">{meta.code}</span>
          </div>
        ); })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden lg:inline">PM · TEK · KON · K3 · QC · ENV · EQP · LOG · FIN</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏗️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-slate-300 to-zinc-300 bg-clip-text text-transparent">KonstraClaw — Manajemen Proyek Konstruksi</div>
              <div className="text-sm text-white/50 max-w-2xl">
                <span className="text-slate-300">PM</span> (penjadwalan & WBS) · <span className="text-zinc-300">TEK</span> (engineering & shop drawing) · <span className="text-stone-300">KON</span> (kontrak FIDIC & klaim) · <span className="text-red-300">K3</span> (SMK3 & JSA) · <span className="text-blue-300">QC</span> (mutu & ITP) · <span className="text-green-300">ENV</span> (lingkungan & AMDAL) · <span className="text-orange-300">EQP</span> (alat berat & OEE) · <span className="text-purple-300">LOG</span> (supply chain & subkon) · <span className="text-emerald-300">FIN</span> (cashflow & PSAK34)
              </div>
              <div className="text-xs text-white/30 mt-2">Referensi: UU 2/2017 · PP 14/2021 · FIDIC Red/Yellow/Silver · ISO 9001 · ISO 14001 · SMK3 PP 50/2012 · PSAK 34 · PPh Pasal 23/4(2)</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {KONSTRA_TAGS.map(c => <span key={c.label} className="px-2 py-0.5 rounded border border-slate-700/40 bg-slate-900/20 text-slate-300/70">{c.label}</span>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-slate-500/40 hover:bg-slate-900/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
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
        placeholder={ready ? "Tanya tentang jadwal proyek, klaim FIDIC, K3, mutu, OEE alat, cashflow, PSAK34…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
