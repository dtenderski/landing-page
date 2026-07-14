import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp,
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

const ROLE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  "SP-GEODESI":     { icon: "🌐", label: "GEODESI",     color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     desc: "Geodesi & Pengukuran" },
  "SP-TOPOGRAFI":   { icon: "🗺️", label: "TOPOGRAFI",   color: "bg-teal-500/20 text-teal-300 border-teal-500/30",     desc: "Topografi & Pemetaan" },
  "SP-KADASTER":    { icon: "📋", label: "KADASTER",    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",   desc: "Pemetaan Kadastral" },
  "SP-GIS":         { icon: "🖥️", label: "GIS",         color: "bg-green-500/20 text-green-300 border-green-500/30",   desc: "GIS & Analisis Spasial" },
  "SP-HIDROGRAFI":  { icon: "🌊", label: "HIDRO",       color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",      desc: "Survei Hidrografi" },
  "SP-KONSTRUKSI":  { icon: "⚙️", label: "KONSTRUKSI",  color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "Survei Konstruksi" },
  "SP-DRONE":       { icon: "🚁", label: "DRONE",       color: "bg-purple-500/20 text-purple-300 border-purple-500/30", desc: "UAV/Drone & Fotogrametri" },
};

const AGENT_ROLES = ["SP-GEODESI","SP-TOPOGRAFI","SP-KADASTER","SP-GIS","SP-HIDROGRAFI","SP-KONSTRUKSI","SP-DRONE"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: "🌐", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis Survei & Pemetaan" };
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
    <div className="mt-2 rounded-lg border border-teal-800/40 bg-teal-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-teal-400 shrink-0" />
        <span className="text-teal-300 font-medium">{running > 0 ? `Menganalisis ${running} spesialis…` : `${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-teal-400":a.status==="running"?"bg-blue-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-teal-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            return (
              <div key={i} className="flex items-center gap-1.5">
                {statusDot(a.status)}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}>
                  <span>{meta.icon}</span><span className="font-mono font-bold text-[10px]">{meta.label}</span>
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-teal-950/60 border border-teal-800/30 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🌐</div>
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
  { icon: "🌐", text: "Jelaskan perbedaan datum WGS84 vs SRGI2013, mengapa Indonesia beralih ke SRGI2013, dan bagaimana cara konversi koordinat antara kedua sistem tersebut di lapangan." },
  { icon: "🗺️", text: "Peta topografi skala 1:50.000 dengan CI 25 meter. Jelaskan cara membaca garis kontur untuk mengidentifikasi: punggungan, lembah, tebing terjal, dan cekungan (depression)." },
  { icon: "📋", text: "Jelaskan prosedur lengkap pengukuran batas tanah untuk penerbitan SHM (Sertifikat Hak Milik) dari tahap penunjukan batas oleh pemilik hingga penerbitan sertifikat oleh BPN." },
  { icon: "🖥️", text: "Bagaimana cara melakukan analisis kesesuaian lahan untuk pembangunan perumahan menggunakan GIS dengan kriteria: slope < 15%, jauh dari sungai > 100m, dan akses jalan < 500m?" },
  { icon: "🌊", text: "Hitung debit sungai dengan rumus Manning dari data: lebar 8 m, kedalaman rata-rata 1.5 m, kemiringan dasar sungai 0.002, koefisien Manning n = 0.035 (saluran batu)." },
  { icon: "🚁", text: "Desain misi drone fotogrametri untuk area 50 ha: tentukan tinggi terbang optimal, overlap front & side, jumlah GCP minimum, GSD yang dicapai, dan estimasi waktu penerbangan." },
];

const SPEC_CARDS = [
  { role: "SP-GEODESI",    icon: "🌐", label: "Geodesi",    desc: "GNSS · Traverse",    color: "border-blue-600/30 bg-blue-950/20" },
  { role: "SP-TOPOGRAFI",  icon: "🗺️", label: "Topografi",  desc: "DEM · Kontur",        color: "border-teal-600/30 bg-teal-950/20" },
  { role: "SP-KADASTER",   icon: "📋", label: "Kadaster",   desc: "SHM · BPN",           color: "border-amber-600/30 bg-amber-950/20" },
  { role: "SP-GIS",        icon: "🖥️", label: "GIS",        desc: "ArcGIS · Satelit",   color: "border-green-600/30 bg-green-950/20" },
  { role: "SP-HIDROGRAFI", icon: "🌊", label: "Hidrografi", desc: "Batimetri · Debit",   color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "SP-KONSTRUKSI", icon: "⚙️", label: "Konstruksi", desc: "Setting Out · Volume", color: "border-orange-600/30 bg-orange-950/20" },
  { role: "SP-DRONE",      icon: "🚁", label: "Drone/UAV",  desc: "Ortho · LiDAR",       color: "border-purple-600/30 bg-purple-950/20" },
];

export default function SurveiPemetaanClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/surveipemetaan-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/surveipemetaan-claw/orchestrator");
      if (!res.ok) throw new Error("SurveiPemetaanClaw not found");
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
    <div className="flex flex-col h-screen bg-[#030a0e] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#060f14]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-lg">🌐</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">SurveiPemetaanClaw — AI Konsultan Survei & Pemetaan</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-teal-400" />
            <span>7 Spesialis SKK: Geodesi · Topografi · Kadaster · GIS · Hidrografi · Konstruksi · Drone/UAV</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-600/40 text-teal-300 hidden sm:flex">SurveiPemetaanClaw · 7 Spesialis SKK</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#060f14]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis SKK:</span>
        {AGENT_ROLES.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}>
              <span>{meta.icon}</span><span className="font-mono font-bold text-[10px]">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Chat */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🌐</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                SurveiPemetaanClaw — AI Survei & Pemetaan, Jabatan Kerja SKK
              </div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Diskusi survei dan pemetaan teknis mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — geodesi & GNSS, topografi & peta rupabumi, kadastral & BPN, GIS & analisis spasial, survei hidrografi & batimetri, survei konstruksi (setting out, volume cut & fill), dan drone/UAV fotogrametri & LiDAR. Relevan untuk <span className="text-teal-300">pembekalan uji kompetensi SKK</span> Klasifikasi Survei & Pemetaan, referensi kerja, dan pembelajaran akademik.
              </p>
              <div className="text-xs text-white/25 mt-2">PerBIG 15/2013 (SRGI2013) · PP 24/1997 (Pendaftaran Tanah) · IHO S-44 · ASPRS LAS · Permenhub PM 37/2020 (UAV)</div>
            </div>

            {/* Specialist cards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c => (
                <button key={c.role}
                  onClick={() => sendMessage(`Jelaskan ruang lingkup jabatan kerja ${c.label} dalam survei dan pemetaan — kompetensi utama, regulasi/standar yang berlaku, alat yang digunakan, dan contoh pekerjaan di lapangan untuk persiapan uji kompetensi SKK.`)}
                  disabled={!ready || streaming}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`}
                  data-testid={`card-${c.role.toLowerCase().replace(/-/g,"")}`}>
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-teal-600/40 hover:bg-teal-950/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-teal-950/20 border border-teal-800/30">
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Konten berbasis <span className="text-teal-300">standar BIG, BPN/ATR, Permenhub UAV, IHO S-44, ASPRS LAS, SNI geodesi</span>. Relevan untuk persiapan uji kompetensi SKK Klasifikasi Survei & Pemetaan. Untuk keputusan hukum pertanahan, konfirmasi ke Kantor Pertanahan setempat.
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
        placeholder={ready ? "Tanya: traverse, koordinat UTM, batas tanah BPN, analisis GIS, Manning, setting out, drone misi, LiDAR..." : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
