import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  HardHat, ChevronDown, ChevronUp, ClipboardList, ShieldAlert,
  FlameKindling, Microscope, Search, Activity, Zap as ZapIcon,
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
  "K3-JSA":         { icon: <ClipboardList className="h-3 w-3" />, label: "JSA",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30",  desc: "JSA & Permit to Work" },
  "K3-HIRAC":       { icon: <ShieldAlert className="h-3 w-3" />,   label: "HIRAC",       color: "bg-red-500/20 text-red-300 border-red-500/30",           desc: "Risk Assessment & Control" },
  "K3-LISTRIK":     { icon: <ZapIcon className="h-3 w-3" />,       label: "LISTRIK",     color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",  desc: "K3 Kelistrikan & LOTO" },
  "K3-KIMIA":       { icon: <Microscope className="h-3 w-3" />,    label: "KIMIA",       color: "bg-purple-500/20 text-purple-300 border-purple-500/30",  desc: "K3 Bahan Kimia & GHS" },
  "K3-KEBAKARAN":   { icon: <FlameKindling className="h-3 w-3" />, label: "KEBAKARAN",   color: "bg-rose-500/20 text-rose-300 border-rose-500/30",        desc: "Fire Safety & APAR" },
  "K3-INVESTIGASI": { icon: <Search className="h-3 w-3" />,        label: "INVESTIGASI", color: "bg-blue-500/20 text-blue-300 border-blue-500/30",        desc: "Investigasi & RCA" },
  "K3-ERGONOMI":    { icon: <Activity className="h-3 w-3" />,      label: "ERGONOMI",    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",        desc: "Ergonomi & Higiene" },
};

const AGENT_ROLES = ["K3-JSA","K3-HIRAC","K3-LISTRIK","K3-KIMIA","K3-KEBAKARAN","K3-INVESTIGASI","K3-ERGONOMI"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <HardHat className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis K3" };
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
    <div className="mt-2 rounded-lg border border-orange-800/40 bg-orange-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-orange-400 shrink-0" />
        <span className="text-orange-300 font-medium">{running > 0 ? `Menganalisis ${running} spesialis K3…` : `${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-orange-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-orange-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-orange-950/60 border border-orange-800/30 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-orange-900/60 border border-orange-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🦺</div>
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
  { icon: "📋", text: "Buatkan template JSA untuk pekerjaan pengelasan (hot work) di area tangki bahan bakar dengan risiko gas LPG. Sertakan identifikasi bahaya dan pengendalian per langkah kerja." },
  { icon: "⚠️", text: "Buat HIRARC untuk pekerjaan di ketinggian menggunakan scaffolding setinggi 8 meter. Gunakan matriks risiko 5x5 dan tentukan pengendalian hierarki." },
  { icon: "⚡", text: "Jelaskan prosedur LOTO (Lockout/Tagout) lengkap untuk panel listrik 380V sebelum pekerjaan maintenance, sesuai OSHA 29 CFR 1910.147." },
  { icon: "🧪", text: "Ada tumpahan asam sulfat 98% sebanyak 20 liter di area gudang kimia. Apa langkah-langkah respons darurat yang harus dilakukan? Sebutkan PPE yang diperlukan." },
  { icon: "🔍", text: "Seorang pekerja jatuh dari scaffolding setinggi 4 meter dan mengalami patah tulang. Jelaskan prosedur investigasi kecelakaan dengan metode ICAM dan pelaporan ke Disnaker." },
  { icon: "🏃", text: "Hasil pengukuran kebisingan di area mesin produksi menunjukkan 92 dB(A) selama 8 jam. Apa tindakan pengendalian yang diperlukan sesuai Permenaker No. 5/2018?" },
];

const SPEC_CARDS = [
  { role: "K3-JSA",         icon: "📋", label: "JSA & PTW",    desc: "Analisis Bahaya · Izin Kerja",    color: "border-orange-600/30 bg-orange-950/20" },
  { role: "K3-HIRAC",       icon: "⚠️", label: "HIRARC",       desc: "Matriks Risiko · Bow-Tie",        color: "border-red-600/30 bg-red-950/20" },
  { role: "K3-LISTRIK",     icon: "⚡", label: "K3 Listrik",   desc: "Arc Flash · LOTO · ATEX",         color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "K3-KIMIA",       icon: "🧪", label: "K3 Kimia",     desc: "GHS · SDS · NAB · Spill",         color: "border-purple-600/30 bg-purple-950/20" },
  { role: "K3-KEBAKARAN",   icon: "🔥", label: "Fire Safety",  desc: "APAR · Evakuasi · Hot Work",      color: "border-rose-600/30 bg-rose-950/20" },
  { role: "K3-INVESTIGASI", icon: "🔍", label: "Investigasi",  desc: "5 Why · ICAM · CAPA",             color: "border-blue-600/30 bg-blue-950/20" },
  { role: "K3-ERGONOMI",    icon: "🏃", label: "Ergonomi",     desc: "NAB Fisika · Bising · Panas",     color: "border-teal-600/30 bg-teal-950/20" },
];

export default function K3ClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/k3-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/k3-claw/orchestrator");
      if (!res.ok) throw new Error("K3Claw not found");
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
    <div className="flex flex-col h-screen bg-[#0c0804] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#140a04]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-orange-900/60 border border-orange-600/40 flex items-center justify-center text-lg">🦺</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">K3Claw — AI Konsultan K3 Teknis Lapangan</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-orange-400" />
            <span>7 Spesialis: JSA · HIRAC · Listrik · Kimia · Kebakaran · Investigasi · Ergonomi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-orange-600/40 text-orange-300 hidden sm:flex">K3Claw · 7 Spesialis</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#140a04]/60">
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
            <div className="text-5xl">🦺</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">
                K3Claw — AI Konsultan K3 Teknis Lapangan
              </div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Diskusi K3 teknis mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — dari JSA & PTW, HIRARC, K3 kelistrikan, bahan kimia berbahaya, fire safety, investigasi insiden, hingga ergonomi & higiene industri. Bukan tentang SKK sertifikasi — ini tentang <strong className="text-white/70">implementasi K3 di lapangan</strong>.
              </p>
              <div className="text-xs text-white/25 mt-2">UU 1/1970 · PP 50/2012 (SMK3) · Permenaker · ISO 45001 · OSHA · NFPA</div>
            </div>

            {/* Specialist cards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c => (
                <button key={c.role}
                  onClick={() => sendMessage(`Jelaskan bidang keahlian ${c.label} dalam K3 — ruang lingkup, topik utama, regulasi yang berlaku, dan contoh penerapan di lapangan.`)}
                  disabled={!ready || streaming}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`}
                  data-testid={`card-${c.role.toLowerCase().replace("-","")}`}>
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-orange-600/40 hover:bg-orange-950/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-orange-950/20 border border-orange-800/30">
              <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Jawaban berbasis regulasi K3 Indonesia (<span className="text-orange-300">UU 1/1970, PP 50/2012, Permenaker</span>) dan standar internasional (OSHA, ISO 45001, NFPA). Untuk keputusan K3 kritis, konfirmasi ke Ahli K3 bersertifikat atau Disnaker setempat.
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
        placeholder={ready ? "Tanya K3: JSA, HIRARC, LOTO, GHS, APAR, investigasi insiden, ergonomi…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
