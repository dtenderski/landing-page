import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  Settings2, ChevronDown, ChevronUp,
  Wind, Droplets, Bolt, Flame, ArrowUpDown, Radio, BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, ChatAttachment } from "@/components/chat-input-bar";

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

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; desc: string }> = {
  "MEP-HVAC":     { icon: <Wind className="h-3 w-3" />,       label: "HVAC",     color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",      desc: "Tata Udara & HVAC" },
  "MEP-PLUMB":    { icon: <Droplets className="h-3 w-3" />,   label: "PLUMB",    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",      desc: "Plumbing & Sanitasi" },
  "MEP-LISTRIK":  { icon: <Bolt className="h-3 w-3" />,       label: "LISTRIK",  color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",desc: "Instalasi Listrik" },
  "MEP-FIRE":     { icon: <Flame className="h-3 w-3" />,      label: "FIRE",     color: "bg-red-500/20 text-red-300 border-red-500/30",         desc: "Proteksi Kebakaran" },
  "MEP-LIFT":     { icon: <ArrowUpDown className="h-3 w-3" />,label: "LIFT",     color: "bg-purple-500/20 text-purple-300 border-purple-500/30",desc: "Transportasi Vertikal" },
  "MEP-ELV":      { icon: <Radio className="h-3 w-3" />,      label: "ELV",      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "ELV & ICT" },
  "MEP-ESTIMASI": { icon: <BarChart3 className="h-3 w-3" />,  label: "ESTIMASI", color: "bg-orange-500/20 text-orange-300 border-orange-500/30",desc: "Estimasi & Spesifikasi" },
};

const AGENT_ROLES = ["MEP-HVAC","MEP-PLUMB","MEP-LISTRIK","MEP-FIRE","MEP-LIFT","MEP-ELV","MEP-ESTIMASI"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <Settings2 className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis MEP" };
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
        <Settings2 className="h-3 w-3 text-emerald-400 shrink-0" />
        <span className="text-emerald-300 font-medium">{running > 0 ? `Menganalisis ${running} spesialis…` : `${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
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
                  {meta.icon}<span className="font-mono font-bold text-[10px]">{meta.label}</span>
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-950/70 border border-emerald-800/30 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">⚙️</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && <SubAgentPanel agents={msg.subAgents} />}
        <div className="mt-2" style={{ wordBreak: "break-word" }}>
          {msg.isStreaming && !msg.content
            ? <span className="animate-pulse text-white/60">▋</span>
            : <MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed" />}
        </div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs && msg.subAgents && msg.subAgents.length > 0 && !msg.isStreaming && (
          <div className="flex items-center gap-1 text-xs text-white/25 mt-1">
            <Zap className="h-2.5 w-2.5" /><span>{msg.subAgents.length} spesialis paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "❄️", text: "Hitung kebutuhan AC untuk ruang kantor open plan 500 m², lantai 5, dinding kaca barat. Tentukan kapasitas (TR), tipe sistem, dan konfigurasi yang disarankan." },
  { icon: "🚿", text: "Desain sistem air bersih untuk gedung apartemen 20 lantai, 200 unit hunian. Tentukan kapasitas ground tank, roof tank, dan sizing pompa transfer & booster." },
  { icon: "⚡", text: "Sizing genset untuk pusat perbelanjaan dengan daya kontrak PLN 1.650 kVA. Sistem apa saja yang harus dilayani genset? Berapa kapasitas yang dibutuhkan?" },
  { icon: "🔥", text: "Berapa jumlah sprinkler head yang dibutuhkan untuk gudang logistik 2.000 m² dengan klasifikasi bahaya sedang kelompok II (Ordinary Hazard Group II)?" },
  { icon: "🛗", text: "Traffic analysis lift untuk gedung perkantoran 25 lantai, 2.000 pengguna. Berapa jumlah lift yang dibutuhkan? Kapasitas dan kecepatan apa yang disarankan?" },
  { icon: "📊", text: "Berikan struktur BOQ dan estimasi RAB sistem MEP untuk gedung kantor 8 lantai, luas 6.000 m². Breakdown per sistem: HVAC, plumbing, listrik, fire, dan ELV." },
];

const SPEC_CARDS = [
  { role: "MEP-HVAC",     icon: "❄️", label: "HVAC",     desc: "AC · Chiller · AHU · VRF", color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "MEP-PLUMB",    icon: "🚿", label: "Plumbing",  desc: "Air Bersih · Kotor · STP",  color: "border-blue-600/30 bg-blue-950/20" },
  { role: "MEP-LISTRIK",  icon: "⚡", label: "Listrik",   desc: "Trafo · Genset · Panel",    color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "MEP-FIRE",     icon: "🔥", label: "Fire",      desc: "Sprinkler · Hydrant · FACP",color: "border-red-600/30 bg-red-950/20" },
  { role: "MEP-LIFT",     icon: "🛗", label: "Lift",      desc: "Traffic · Eskalator",        color: "border-purple-600/30 bg-purple-950/20" },
  { role: "MEP-ELV",      icon: "📡", label: "ELV/ICT",   desc: "CCTV · BMS · Jaringan",     color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "MEP-ESTIMASI", icon: "📊", label: "Estimasi",  desc: "BOQ · RAB · VE",            color: "border-orange-600/30 bg-orange-950/20" },
];

export default function MepClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/mep-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/mep-claw/orchestrator");
      if (!res.ok) throw new Error("MEPClaw not found");
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
    } finally { setStreaming(false);  }
  }

  const ready = !isLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#050d0a] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#060f0b]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-lg">⚙️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">MEPClaw — AI Konsultan Mekanikal-Elektrikal-Plumbing</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-emerald-400" />
            <span>7 Spesialis Paralel: HVAC · Plumbing · Listrik · Fire · Lift · ELV · Estimasi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-300 hidden sm:flex">MEPClaw · 7 Spesialis</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#060f0b]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis:</span>
        {AGENT_ROLES.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}>
              {meta.icon}<span className="font-mono font-bold text-[10px]">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Chat */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">⚙️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                MEPClaw — AI Konsultan MEP
              </div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Konsultasi teknis mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — dari sizing AC, pompa, panel listrik, sprinkler, lift, CCTV/BMS, hingga BOQ & RAB MEP. Standar: <strong className="text-white/70">PUIL, ASHRAE, NFPA, SNI, EN 81</strong>.
              </p>
              <div className="text-xs text-white/25 mt-2">PUIL 2011 · ASHRAE · NFPA 13/14/20/72 · SNI · EN 81 · TIA-568 · IEC</div>
            </div>

            {/* Specialist cards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c => (
                <button key={c.role}
                  onClick={() => sendMessage(`Jelaskan bidang keahlian ${c.label} dalam MEP gedung — ruang lingkup, topik utama, standar yang digunakan, dan contoh pertanyaan teknis yang bisa kamu bantu.`)}
                  disabled={!ready || streaming}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`}
                  data-testid={`card-${c.role.toLowerCase()}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span>
                  <span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>

            {/* Sample prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-600/40 hover:bg-emerald-950/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Jawaban berbasis standar teknis (<span className="text-emerald-300">PUIL, ASHRAE, NFPA, SNI, EN 81, IEC</span>). Untuk keputusan desain final, konfirmasi ke engineer MEP ber-izin.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInputBar
        lastAIMessage={[...messages].reverse().find((m) => m.role === "assistant")?.content}
        onSend={sendMessage}
        disabled={!ready || streaming}
        streaming={streaming}
        placeholder={ready ? "Tanya MEP: sizing AC, pompa, genset, sprinkler, lift, CCTV, BOQ/RAB…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
