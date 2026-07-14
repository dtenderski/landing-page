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
  "ARS-DESAIN":   { icon: "🏛️", label: "DESAIN",   color: "bg-rose-500/20 text-rose-300 border-rose-500/30",     desc: "Desain Arsitektur" },
  "ARS-STRUKTUR": { icon: "🏗️", label: "STRUKTUR", color: "bg-stone-500/20 text-stone-300 border-stone-500/30",  desc: "Sistem Struktur" },
  "ARS-INTERIOR": { icon: "🛋️", label: "INTERIOR", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",  desc: "Desain Interior" },
  "ARS-LANSEKAP": { icon: "🌿", label: "LANSEKAP", color: "bg-green-500/20 text-green-300 border-green-500/30",  desc: "Arsitektur Lansekap" },
  "ARS-REGULASI": { icon: "📐", label: "REGULASI", color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     desc: "Regulasi Bangunan" },
  "ARS-TEKNIS":   { icon: "📏", label: "TEKNIS",   color: "bg-purple-500/20 text-purple-300 border-purple-500/30", desc: "Gambar Teknis & BIM" },
  "ARS-URBAN":    { icon: "🏙️", label: "URBAN",    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", desc: "Urban Design" },
};

const AGENT_ROLES = ["ARS-DESAIN","ARS-STRUKTUR","ARS-INTERIOR","ARS-LANSEKAP","ARS-REGULASI","ARS-TEKNIS","ARS-URBAN"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: "🏛️", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis Arsitektur" };
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
    <div className="mt-2 rounded-lg border border-rose-800/40 bg-rose-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-rose-400 shrink-0" />
        <span className="text-rose-300 font-medium">{running > 0 ? `Menganalisis ${running} spesialis…` : `${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-rose-400":a.status==="running"?"bg-amber-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-rose-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-rose-950/60 border border-rose-800/30 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-rose-900/60 border border-rose-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏛️</div>
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
  { icon: "📐", text: "Kavling 800 m² di Surabaya, RDTR: KDB 60%, KLB 3.0, KDH 15%, GSB 6 m. Hitung luas lantai dasar maksimal, total luas lantai, jumlah lantai yang bisa dibangun, dan area hijau minimum." },
  { icon: "🏛️", text: "Kami merancang gedung kantor 8 lantai di Jakarta. Jelaskan strategi desain bioklimatik yang tepat untuk iklim Jakarta — orientasi, shading, ventilasi, material fasade, dan target konsumsi energi." },
  { icon: "🛋️", text: "Ruang kantor open plan 400 m². Hitung jumlah downlight LED yang dibutuhkan untuk target 400 lux, pilih color temperature dan CRI yang tepat, dan jelaskan zona pencahayaan yang direkomendasikan." },
  { icon: "🌿", text: "Taman dengan luas 2000 m² di iklim tropis, kondisi full sun, akses air terbatas. Rekomendasikan tanaman (strata kanopi, sub-kanopi, semak, groundcover) beserta jarak tanam dan estimasi jumlah tanaman." },
  { icon: "📏", text: "Jelaskan apa itu BIM LOD 300 vs LOD 400, dan bagaimana clash detection di Navisworks membantu koordinasi antara model arsitektur, struktur, dan MEP sebelum pelaksanaan konstruksi." },
  { icon: "🏙️", text: "Jelaskan konsep Transit-Oriented Development (TOD) dalam konteks Indonesia, regulasi yang berlaku, prinsip 3D (Density-Diversity-Design), radius layanan, dan contoh proyek TOD di Indonesia." },
];

const SPEC_CARDS = [
  { role: "ARS-DESAIN",   icon: "🏛️", label: "Desain",   desc: "Program Ruang · Massa",  color: "border-rose-600/30 bg-rose-950/20" },
  { role: "ARS-STRUKTUR", icon: "🏗️", label: "Struktur", desc: "Grid · Atap · Facade",    color: "border-stone-600/30 bg-stone-950/20" },
  { role: "ARS-INTERIOR", icon: "🛋️", label: "Interior", desc: "Finish · Lux · Akustik",  color: "border-amber-600/30 bg-amber-950/20" },
  { role: "ARS-LANSEKAP", icon: "🌿", label: "Lansekap", desc: "Tanaman · RTH · Drain",   color: "border-green-600/30 bg-green-950/20" },
  { role: "ARS-REGULASI", icon: "📐", label: "Regulasi", desc: "PBG · KDB · RDTR",        color: "border-blue-600/30 bg-blue-950/20" },
  { role: "ARS-TEKNIS",   icon: "📏", label: "BIM",      desc: "Revit · RKS · Detail",    color: "border-purple-600/30 bg-purple-950/20" },
  { role: "ARS-URBAN",    icon: "🏙️", label: "Urban",    desc: "TOD · Heritage · Master", color: "border-indigo-600/30 bg-indigo-950/20" },
];

export default function ArsitekturClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/arsitektur-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/arsitektur-claw/orchestrator");
      if (!res.ok) throw new Error("ArsitekturClaw not found");
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
    <div className="flex flex-col h-screen bg-[#0a0408] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#140810]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-rose-900/60 border border-rose-600/40 flex items-center justify-center text-lg">🏛️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">ArsitekturClaw — AI Konsultan Arsitektur & Jabatan Kerja SKK</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-rose-400" />
            <span>7 Spesialis SKK: Desain · Struktur · Interior · Lansekap · Regulasi · BIM · Urban Design</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-rose-600/40 text-rose-300 hidden sm:flex">ArsitekturClaw · 7 Spesialis SKK</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#140810]/60">
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
            <div className="text-5xl">🏛️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-rose-300 to-pink-300 bg-clip-text text-transparent">
                ArsitekturClaw — AI Arsitektur & Jabatan Kerja SKK
              </div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Diskusi arsitektur teknis mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — desain bioklimatik & program ruang, koordinasi sistem struktur, desain interior & pencahayaan, lansekap & RTH, regulasi PBG/KDB/KLB, BIM Revit & RKS, hingga urban design & TOD. Relevan untuk <span className="text-rose-300">pembekalan uji kompetensi SKK</span> Klasifikasi Arsitektur, referensi kerja studio, dan pembelajaran akademik.
              </p>
              <div className="text-xs text-white/25 mt-2">UU BG 28/2002 · PP 16/2021 · PermenPUPR 22/2018 · Neufert · Greenship GBCI · ISO 19650 BIM · UU Penataan Ruang 26/2007</div>
            </div>

            {/* Specialist cards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c => (
                <button key={c.role}
                  onClick={() => sendMessage(`Jelaskan ruang lingkup jabatan kerja ${c.label} dalam proyek arsitektur — kompetensi utama yang harus dikuasai, regulasi/standar yang berlaku, dan contoh penerapan teknisnya untuk persiapan uji kompetensi SKK.`)}
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-rose-600/40 hover:bg-rose-950/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-rose-950/20 border border-rose-800/30">
              <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Konten berbasis <span className="text-rose-300">UU Bangunan Gedung, PP 16/2021, PermenPUPR, Neufert, Greenship GBCI, ISO 19650 BIM, dan UU Penataan Ruang</span>. Relevan untuk persiapan uji kompetensi SKK Klasifikasi Arsitektur. Untuk keputusan perizinan yang spesifik, konfirmasi ke Dinas setempat.
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
        placeholder={ready ? "Tanya: desain bioklimatik, KDB/KLB, lux perhitungan, tanaman lansekap, BIM Revit, TOD, RKS material…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
