import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Wind, Droplets, Flame, Wifi, Sun,
  Factory, ArrowUpDown, Plug, Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, MessageActions, AttachmentRow, ChatAttachment } from "@/components/chat-input-bar";

interface SubAgentStatus {
  agentId: number; role: string;
  status: "waiting" | "running" | "done" | "error";
  elapsed?: number;
}
interface Message {
  role: "user" | "assistant"; content: string;
  isStreaming?: boolean; subAgents?: SubAgentStatus[]; orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string; desc: string }> = {
  "AGENT-IM001": { icon: <Plug className="h-3 w-3" />,       label: "IM001", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",   code: "IM001", desc: "Instalasi Listrik Gedung & Industri" },
  "AGENT-IM002": { icon: <Wind className="h-3 w-3" />,       label: "IM002", color: "bg-sky-500/20 text-sky-300 border-sky-500/30",            code: "IM002", desc: "Tata Udara & Pendingin (HVAC)" },
  "AGENT-IM003": { icon: <Droplets className="h-3 w-3" />,   label: "IM003", color: "bg-blue-500/20 text-blue-300 border-blue-500/30",         code: "IM003", desc: "Plambing, Sanitasi & Pipa Gedung" },
  "AGENT-IM004": { icon: <Flame className="h-3 w-3" />,      label: "IM004", color: "bg-red-500/20 text-red-300 border-red-500/30",            code: "IM004", desc: "Proteksi Kebakaran (Sprinkler/Alarm)" },
  "AGENT-IM005": { icon: <ArrowUpDown className="h-3 w-3" />,label: "IM005", color: "bg-violet-500/20 text-violet-300 border-violet-500/30",   code: "IM005", desc: "Lift, Eskalator & Moving Walk" },
  "AGENT-IM006": { icon: <Zap className="h-3 w-3" />,        label: "IM006", color: "bg-orange-500/20 text-orange-300 border-orange-500/30",   code: "IM006", desc: "Gas Medis, LPG & Gas Industri" },
  "AGENT-IM007": { icon: <Wifi className="h-3 w-3" />,       label: "IM007", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",         code: "IM007", desc: "Telekomunikasi, IT, CCTV & Keamanan" },
  "AGENT-IM008": { icon: <Factory className="h-3 w-3" />,    label: "IM008", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",      code: "IM008", desc: "Mekanikal Pabrik & Kilang (Piping Proses)" },
  "AGENT-IM009": { icon: <Sun className="h-3 w-3" />,        label: "IM009", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",code: "IM009", desc: "Panel Surya & Energi Terbarukan" },
};

const AGENT_LEGEND = ["AGENT-IM001","AGENT-IM002","AGENT-IM003","AGENT-IM004","AGENT-IM005","AGENT-IM006","AGENT-IM007","AGENT-IM008","AGENT-IM009"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <Wrench className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "IM", desc: "Subklasifikasi IM" };
}
function statusDot(s: SubAgentStatus["status"]) {
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
    <div className="mt-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Wrench className="h-3 w-3 text-emerald-400 shrink-0" />
        <span className="text-emerald-200 font-medium">{running > 0 ? `Menganalisis ${running} subklasifikasi IM…` : `${done}/${agents.length} subklasifikasi dianalisis`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc}
              className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-emerald-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            return (
              <div key={i} className="flex items-center gap-1.5">
                {statusDot(a.status)}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}>
                  {meta.icon}<span className="font-mono font-bold text-[10px]">{meta.code}</span>
                </div>
                <span className="text-white/50 text-[10px] truncate">{meta.desc}</span>
                {a.elapsed && <span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-900/50 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">⚙️</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && <SubAgentPanel agents={msg.subAgents} />}
        <div className="mt-2" style={{ wordBreak: "break-word" }}>
          {msg.isStreaming && !msg.content ? <span className="animate-pulse text-white/60">▋</span>
            : <MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed" />}
        </div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs && msg.subAgents && msg.subAgents.length > 0 && !msg.isStreaming && (
          <div className="flex items-center gap-1 text-xs text-white/25 mt-1">
            <Zap className="h-2.5 w-2.5" /><span>{msg.subAgents.length} subklasifikasi dianalisis paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "⚡", text: "Saya kontraktor IM001. Apakah saya bisa mengerjakan panel MDP 2000A, trafo distribusi 630 kVA, dan instalasi genset 500 kVA? Apa sertifikasi operator yang diperlukan?" },
  { icon: "❄️", text: "Proyek HVAC gedung 20 lantai dengan sistem chilled water. Pekerjaan apa saja yang masuk IM002 — chiller, cooling tower, AHU, FCU, ducting, komisioning? Mana yang bukan?" },
  { icon: "🔥", text: "Tender gedung RS — sistem proteksi kebakaran. Apakah IM004 mencakup sprinkler, hydrant, FACP, dan sistem gas suppression FM200 untuk ruang server? Atau ada subklasifikasi lain?" },
  { icon: "🔧", text: "Kami kontraktor mekanikal pabrik (IM008). Apakah pekerjaan instalasi heat exchanger shell-and-tube, pompa sentrifugal proses, dan piping ASME B31.3 masuk ruang lingkup IM008?" },
  { icon: "☀️", text: "PLTS rooftop 500 kWp di gedung perkantoran. Pekerjaan apa yang masuk IM009 (modul, inverter, BESS, wiring DC/AC) dan apa yang masuk IM001 (koneksi ke panel MDP)? Ada irisan?" },
  { icon: "📡", text: "Proyek smart building — CCTV 200 titik, access control, jaringan LAN 1000 port, BMS, dan PA system. Semua masuk IM007? Atau ada yang masuk subklasifikasi lain?" },
];

const IM_CARDS = [
  { code: "IM001", desc: "Instalasi Listrik", icon: "⚡", color: "border-yellow-600/30 bg-yellow-950/20" },
  { code: "IM002", desc: "Tata Udara (HVAC)", icon: "❄️", color: "border-sky-600/30 bg-sky-950/20" },
  { code: "IM003", desc: "Plambing & Sanitasi", icon: "💧", color: "border-blue-600/30 bg-blue-950/20" },
  { code: "IM004", desc: "Proteksi Kebakaran", icon: "🔥", color: "border-red-600/30 bg-red-950/20" },
  { code: "IM005", desc: "Lift & Eskalator", icon: "🛗", color: "border-violet-600/30 bg-violet-950/20" },
  { code: "IM006", desc: "Gas Medis & LPG", icon: "⛽", color: "border-orange-600/30 bg-orange-950/20" },
  { code: "IM007", desc: "Telekomukasi & IT", icon: "📡", color: "border-cyan-600/30 bg-cyan-950/20" },
  { code: "IM008", desc: "Mekanikal Pabrik", icon: "🔧", color: "border-amber-600/30 bg-amber-950/20" },
  { code: "IM009", desc: "Panel Surya & EBT", icon: "☀️", color: "border-emerald-600/30 bg-emerald-950/20" },
];

export default function ImClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/im-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/im-claw/orchestrator");
      if (!res.ok) throw new Error("IMClaw not found");
      return res.json();
    },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if ((!text.trim() && files.length === 0) || streaming || !agentId) return;
    setInput(""); setStreaming(true);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true, subAgents: [] }]);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const orchStart = Date.now();
    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history })
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
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((sa: any) => ({ agentId: Number(sa.agentId), role: sa.role, status: "waiting" as const }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "sub_agent_start") {
              const s=subAgentMap.get(Number(evt.agentId)); if(s){s.status="running";subAgentMap.set(Number(evt.agentId),{...s});}
              setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())}; return u; });
            } else if (evt.type === "sub_agent_done") {
              const s=subAgentMap.get(Number(evt.agentId)); if(s){s.status="done";s.elapsed=evt.elapsed;subAgentMap.set(Number(evt.agentId),{...s});}
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
    } finally {
      setStreaming(false); // input focus handled by ChatInputBar
    }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#061210] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-emerald-900/40 px-4 py-3 flex items-center gap-3 bg-[#071412]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-lg">⚙️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">IMClaw — Navigator Ruang Lingkup Pekerjaan Instalasi Mekanikal-Elektrikal</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-emerald-400" />
            <span>9 Subklasifikasi IM001–IM009 · Permen PU 6/2025 · KBLI 2020 · Ruang Lingkup MEP & Utiliti Gedung</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-700/40 text-emerald-300 hidden sm:flex">IMClaw · IM001–IM009</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#071412]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">9 Subklasifikasi:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}>
              {meta.icon}<span className="font-mono font-bold text-[10px]">{meta.code}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden xl:inline">Listrik · HVAC · Plambing · Fire · Lift · Gas · IT/CCTV · Mekanikal Pabrik · Panel Surya</span>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">⚙️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                IMClaw — Ruang Lingkup Pekerjaan Instalasi Mekanikal-Elektrikal
              </div>
              <div className="text-sm text-white/50 max-w-2xl">
                Navigator AI untuk kontraktor MEP yang ingin memahami <strong className="text-white/70">apa yang boleh dikerjakan</strong> dalam setiap subklasifikasi IM — dari listrik, HVAC, plambing, fire protection, lift, gas, IT/CCTV, mekanikal pabrik, hingga panel surya.
              </div>
              <div className="text-xs text-white/30 mt-2">Referensi: Permen PU No. 6 Tahun 2025 · KBLI 2020 (Kelompok 43xxx) · UU 2/2017 · PP 14/2021 · PUIL 2011 · ASME · SNI</div>
            </div>

            {/* IM subklasifikasi cards */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 w-full max-w-2xl">
              {IM_CARDS.map(c => (
                <button key={c.code} onClick={() => sendMessage(`Jelaskan ruang lingkup pekerjaan subklasifikasi ${c.code} (${c.desc}) secara lengkap — jenis instalasi yang bisa dikerjakan, pekerjaan teknis yang tercakup, dan batasannya.`)}
                  disabled={!ready || streaming}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`}
                  data-testid={`card-${c.code.toLowerCase()}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono font-bold text-xs text-white/80">{c.code}</span>
                  <span className="text-[9px] text-white/50 leading-tight">{c.desc}</span>
                </button>
              ))}
            </div>

            {/* Sample prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-700/40 hover:bg-emerald-950/30 transition-all disabled:opacity-40 text-white/70"
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

      {/* Input */}
      <div className="shrink-0 border-t border-emerald-900/30 px-4 py-3 bg-[#071412]/80">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input);} }}
            placeholder={ready ? "Tanya: apakah pekerjaan X masuk IM saya? Ruang lingkup IM001 vs IM007? Perbedaan teknis antar subklasifikasi MEP?…" : "Menghubungkan ke IMClaw…"}
            disabled={!ready || streaming}
            className="flex-1 bg-emerald-950/30 border-emerald-800/40 text-white placeholder:text-white/30 focus-visible:ring-emerald-600/40 text-sm h-10"
            data-testid="input-message"
          />
          <Button onClick={() => sendMessage(input)} disabled={!ready || streaming || !input.trim()}
            className="bg-emerald-800 hover:bg-emerald-700 text-white h-10 px-4 shrink-0" data-testid="button-send">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-center mt-2 text-xs text-white/20">
          IMClaw v1 · IM001–IM009 · Permen PU 6/2025 · KBLI 2020 · Ruang Lingkup Instalasi Mekanikal-Elektrikal
        </div>
      </div>
    </div>
  );
}
