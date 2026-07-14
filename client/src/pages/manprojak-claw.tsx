import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  BarChart3, ChevronDown, ChevronUp, ClipboardList, DollarSign,
  FileText, HardHat, Package, Wrench, TrendingUp,
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
  "MP-MANPRO":   { icon: <BarChart3 className="h-3 w-3" />,     label: "MANPRO",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30",    desc: "Manajer Proyek" },
  "MP-LAPANGAN": { icon: <HardHat className="h-3 w-3" />,       label: "LAPANGAN", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",  desc: "Manajer Lapangan" },
  "MP-MUTU":     { icon: <ClipboardList className="h-3 w-3" />, label: "MUTU",     color: "bg-green-500/20 text-green-300 border-green-500/30",  desc: "Quality Control" },
  "MP-ESTIMASI": { icon: <DollarSign className="h-3 w-3" />,    label: "ESTIMASI", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", desc: "Estimator & QS" },
  "MP-KONTRAK":  { icon: <FileText className="h-3 w-3" />,      label: "KONTRAK",  color: "bg-purple-500/20 text-purple-300 border-purple-500/30", desc: "Kontrak Konstruksi" },
  "MP-KEUANGAN": { icon: <TrendingUp className="h-3 w-3" />,    label: "KEUANGAN", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "Keuangan Proyek" },
  "MP-LOGISTIK": { icon: <Package className="h-3 w-3" />,       label: "LOGISTIK", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "Material & Alat" },
};

const AGENT_ROLES = ["MP-MANPRO","MP-LAPANGAN","MP-MUTU","MP-ESTIMASI","MP-KONTRAK","MP-KEUANGAN","MP-LOGISTIK"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <Wrench className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis Manajemen Proyek" };
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
    <div className="mt-2 rounded-lg border border-indigo-800/40 bg-indigo-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-indigo-400 shrink-0" />
        <span className="text-indigo-300 font-medium">{running > 0 ? `Menganalisis ${running} spesialis…` : `${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-indigo-400":a.status==="running"?"bg-blue-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-indigo-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-indigo-950/60 border border-indigo-800/30 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏗️</div>
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
  { icon: "📊", text: "Proyek konstruksi gedung: BAC Rp 50 miliar. EV = Rp 30 miliar, PV = Rp 35 miliar, AC = Rp 33 miliar. Hitung SPI, CPI, SV, CV, dan EAC. Apa artinya untuk proyek ini?" },
  { icon: "🏗️", text: "Buat method statement lengkap untuk pekerjaan pengecoran kolom beton bertulang K-300 di lantai 8, termasuk urutan pekerjaan, alat yang dibutuhkan, dan aspek K3." },
  { icon: "✅", text: "Buatkan ITP (Inspection & Test Plan) untuk pekerjaan pondasi bore pile diameter 600 mm, mulai dari pengeboran hingga pengujian pile integrity test (PIT)." },
  { icon: "💰", text: "Hitung AHSP (Analisa Harga Satuan Pekerjaan) untuk 1 m³ beton ready mix fc'25 MPa termasuk biaya pengecoran, pemadatan, dan curing berdasarkan PermenPUPR No. 1/2022." },
  { icon: "📋", text: "Jelaskan prosedur klaim perpanjangan waktu (EOT) berdasarkan FIDIC Clause 20 step-by-step, dari kejadian awal hingga keputusan Engineer." },
  { icon: "📈", text: "Kontrak jasa konstruksi Rp 10 miliar (belum PPN). Berapakah PPN, PPh Pasal 4(2) yang dipotong, dan netto yang diterima kontraktor? Jelaskan dasar hukumnya." },
];

const SPEC_CARDS = [
  { role: "MP-MANPRO",   icon: "📊", label: "Manajer Proyek", desc: "WBS · EVM · FIDIC",   color: "border-blue-600/30 bg-blue-950/20" },
  { role: "MP-LAPANGAN", icon: "🏗️", label: "Lapangan",       desc: "Metode · Daily Report", color: "border-amber-600/30 bg-amber-950/20" },
  { role: "MP-MUTU",     icon: "✅", label: "QC",             desc: "ITP · NCR · Uji Lab", color: "border-green-600/30 bg-green-950/20" },
  { role: "MP-ESTIMASI", icon: "💰", label: "Estimator",      desc: "BoQ · AHSP · RAB",    color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "MP-KONTRAK",  icon: "📋", label: "Kontrak",        desc: "SSUK · FIDIC · Klaim", color: "border-purple-600/30 bg-purple-950/20" },
  { role: "MP-KEUANGAN", icon: "📈", label: "Keuangan",       desc: "PSAK 34 · Cashflow",  color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "MP-LOGISTIK", icon: "🏭", label: "Logistik",       desc: "Material · Alat Berat", color: "border-orange-600/30 bg-orange-950/20" },
];

export default function ManprojakClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/manprojak-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/manprojak-claw/orchestrator");
      if (!res.ok) throw new Error("ManprojakClaw not found");
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
    <div className="flex flex-col h-screen bg-[#04060f] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#080c1a]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-lg">🏗️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">ManprojakClaw — AI Konsultan Manajemen Proyek & Jabatan Kerja SKK</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-indigo-400" />
            <span>7 Spesialis SKK: Manajer Proyek · Lapangan · QC · Estimator · Kontrak · Keuangan · Logistik</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-indigo-600/40 text-indigo-300 hidden sm:flex">ManprojakClaw · 7 Spesialis SKK</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#080c1a]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Jabatan SKK:</span>
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
            <div className="text-5xl">🏗️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">
                ManprojakClaw — AI Manajemen Proyek & Jabatan Kerja SKK
              </div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Diskusi manajemen proyek teknis mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — EVM & FIDIC, metode pelaksanaan lapangan, Quality Control & NCR, AHSP & BoQ, kontrak konstruksi & klaim, PSAK 34 & cashflow, serta manajemen material & peralatan. Relevan untuk <span className="text-indigo-300">pembekalan uji kompetensi SKK</span>, referensi kerja, dan pembelajaran akademik.
              </p>
              <div className="text-xs text-white/25 mt-2">PMBOK · FIDIC · SSUK/SSKK · PermenPUPR 1/2022 (AHSP) · PSAK 34 · SNI · Perpres 16/2018</div>
            </div>

            {/* Specialist cards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c => (
                <button key={c.role}
                  onClick={() => sendMessage(`Jelaskan ruang lingkup jabatan kerja ${c.label} dalam proyek konstruksi — kompetensi utama yang harus dikuasai, regulasi/standar yang berlaku, dan contoh penerapan teknisnya.`)}
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-indigo-600/40 hover:bg-indigo-950/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Konten berbasis <span className="text-indigo-300">PMBOK, FIDIC, SSUK/SSKK, PermenPUPR, PSAK 34, dan SNI</span>. Relevan untuk persiapan uji kompetensi SKK Manajemen Pelaksanaan. Untuk keputusan kontraktual/hukum yang spesifik, konsultasikan ke konsultan hukum atau MK berpengalaman.
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
        placeholder={ready ? "Tanya: EVM, ITP/NCR, AHSP, klaim FIDIC, PSAK 34, metode pelaksanaan, alat berat…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
