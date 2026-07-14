import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  Building2, ChevronDown, ChevronUp, Home, Layers, Briefcase,
  ShoppingBag, Factory, Heart, GraduationCap, Hotel, Grid3x3,
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
  "AGENT-BG001": { icon: <Home className="h-3 w-3" />,         label: "BG001",  color: "bg-orange-500/20 text-orange-300 border-orange-500/30",   code: "BG001", desc: "Hunian Tunggal & Kopel" },
  "AGENT-BG002": { icon: <Layers className="h-3 w-3" />,       label: "BG002",  color: "bg-amber-500/20 text-amber-300 border-amber-500/30",      code: "BG002", desc: "Multi Hunian & Apartemen" },
  "AGENT-BG003": { icon: <Briefcase className="h-3 w-3" />,    label: "BG003",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",         code: "BG003", desc: "Gedung Perkantoran" },
  "AGENT-BG004": { icon: <ShoppingBag className="h-3 w-3" />,  label: "BG004",  color: "bg-pink-500/20 text-pink-300 border-pink-500/30",         code: "BG004", desc: "Perbelanjaan & Komersial" },
  "AGENT-BG005": { icon: <Factory className="h-3 w-3" />,      label: "BG005",  color: "bg-slate-500/20 text-slate-300 border-slate-500/30",      code: "BG005", desc: "Industri & Pergudangan" },
  "AGENT-BG006": { icon: <Heart className="h-3 w-3" />,        label: "BG006",  color: "bg-red-500/20 text-red-300 border-red-500/30",            code: "BG006", desc: "Gedung Kesehatan" },
  "AGENT-BG007": { icon: <GraduationCap className="h-3 w-3" />,label: "BG007",  color: "bg-green-500/20 text-green-300 border-green-500/30",      code: "BG007", desc: "Gedung Pendidikan" },
  "AGENT-BG008": { icon: <Hotel className="h-3 w-3" />,        label: "BG008",  color: "bg-purple-500/20 text-purple-300 border-purple-500/30",   code: "BG008", desc: "Hotel, Akomodasi & Pariwisata" },
  "AGENT-BG009": { icon: <Grid3x3 className="h-3 w-3" />,      label: "BG009",  color: "bg-teal-500/20 text-teal-300 border-teal-500/30",         code: "BG009", desc: "Bangunan Gedung Lainnya" },
};

const AGENT_LEGEND = ["AGENT-BG001","AGENT-BG002","AGENT-BG003","AGENT-BG004","AGENT-BG005","AGENT-BG006","AGENT-BG007","AGENT-BG008","AGENT-BG009"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <Building2 className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "BG", desc: "Subklasifikasi BG" };
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
    <div className="mt-2 rounded-lg border border-stone-700/50 bg-stone-900/30 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Building2 className="h-3 w-3 text-stone-400 shrink-0" />
        <span className="text-stone-300 font-medium">{running > 0 ? `Menganalisis ${running} subklasifikasi…` : `${done}/${agents.length} subklasifikasi dianalisis`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => {
            const m = getRoleMeta(a.role);
            return <div key={i} title={m.desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />;
          })}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-stone-700/40 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-stone-700/80 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-stone-800/80 border border-stone-600/50 flex items-center justify-center text-base shrink-0 mt-0.5">🏗️</div>
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
  { icon: "🏠", text: "Saya punya SBU BG001. Bolehkah saya membangun rumah kos 20 kamar di atas satu kavling? Atau harus BG002?" },
  { icon: "🏢", text: "Proyek kami adalah gedung mixed-use: lantai 1-3 ruko (toko), lantai 4-8 apartemen. SBU BG apa yang harus saya punya? Cukup satu atau perlu dua?" },
  { icon: "🏭", text: "Saya kontraktor BG005. Apakah saya bisa mengerjakan pembangunan cold storage / gudang beku untuk industri makanan? Pekerjaan teknis apa saja yang tercakup?" },
  { icon: "🏥", text: "Tender pembangunan klinik pratama 2 lantai dengan ruang tindakan minor. Apakah ini BG006? Apa persyaratan teknis khusus yang berbeda dari gedung biasa?" },
  { icon: "🕌", text: "Saya BG009. Proyek masjid kampus vs masjid berdiri sendiri di pemukiman — keduanya masuk BG009 atau ada bedanya dengan BG007 untuk yang di kampus?" },
  { icon: "🏨", text: "Perbedaan konstruksi apartemen (BG002) vs apartemen-hotel/apatel (BG008). Dari sisi bangunan fisiknya, apa yang berbeda? Bisakah satu SBU mengerjakan keduanya?" },
];

const BG_CARDS = [
  { code: "BG001", desc: "Hunian Tunggal & Kopel", icon: "🏠", color: "border-orange-600/30 bg-orange-950/20" },
  { code: "BG002", desc: "Multi Hunian (Apartemen/Rusun)", icon: "🏗️", color: "border-amber-600/30 bg-amber-950/20" },
  { code: "BG003", desc: "Perkantoran", icon: "🏢", color: "border-blue-600/30 bg-blue-950/20" },
  { code: "BG004", desc: "Perbelanjaan & Komersial", icon: "🛍️", color: "border-pink-600/30 bg-pink-950/20" },
  { code: "BG005", desc: "Industri & Pergudangan", icon: "🏭", color: "border-slate-600/30 bg-slate-900/30" },
  { code: "BG006", desc: "Kesehatan", icon: "🏥", color: "border-red-600/30 bg-red-950/20" },
  { code: "BG007", desc: "Pendidikan", icon: "🏫", color: "border-green-600/30 bg-green-950/20" },
  { code: "BG008", desc: "Hotel & Pariwisata", icon: "🏨", color: "border-purple-600/30 bg-purple-950/20" },
  { code: "BG009", desc: "Bangunan Gedung Lainnya", icon: "🕌", color: "border-teal-600/30 bg-teal-950/20" },
];

export default function BgClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/bg-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/bg-claw/orchestrator");
      if (!res.ok) throw new Error("BGClaw not found");
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
    <div className="flex flex-col h-screen bg-[#0c0a08] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0e0c09]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-stone-800/80 border border-stone-600/50 flex items-center justify-center text-lg">🏗️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">BGClaw — Navigator Ruang Lingkup Pekerjaan Bangunan Gedung</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-stone-400" />
            <span>9 Subklasifikasi BG001–BG009 · Permen PU 6/2025 · KBLI 2020 · Ruang Lingkup Pekerjaan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-stone-500/40 text-stone-300 hidden sm:flex">BGClaw · BG001–BG009</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* Legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0e0c09]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">9 Subklasifikasi:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}>
              {meta.icon}<span className="font-mono font-bold text-[10px]">{meta.code}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden xl:inline">Hunian · Multi-Hunian · Kantor · Komersial · Industri · Kesehatan · Pendidikan · Hotel · Lainnya</span>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏗️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-stone-300 to-amber-300 bg-clip-text text-transparent">
                BGClaw — Ruang Lingkup Pekerjaan Bangunan Gedung
              </div>
              <div className="text-sm text-white/50 max-w-2xl">
                Navigator AI untuk kontraktor yang ingin memahami <strong className="text-white/70">apa yang boleh dan bisa dikerjakan</strong> dalam setiap subklasifikasi BG — bukan tentang cara mendapatkan SBU, tapi tentang <strong className="text-white/70">ruang lingkup pekerjaan nyata</strong> di lapangan.
              </div>
              <div className="text-xs text-white/30 mt-2">Referensi: Permen PU No. 6 Tahun 2025 · KBLI 2020 · UU 2/2017 · PP 14/2021</div>
            </div>

            {/* BG subklasifikasi cards */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 w-full max-w-2xl">
              {BG_CARDS.map(c => (
                <button key={c.code} onClick={() => sendMessage(`Jelaskan ruang lingkup pekerjaan subklasifikasi ${c.code} (${c.desc}) secara lengkap — jenis bangunan yang bisa dikerjakan, pekerjaan teknis yang tercakup, dan batasannya.`)}
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-stone-500/40 hover:bg-stone-900/40 transition-all disabled:opacity-40 text-white/70"
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
      <ChatInputBar
        lastAIMessage={[...messages].reverse().find((m) => m.role === "assistant")?.content}
        onSend={sendMessage}
        disabled={!ready || streaming}
        streaming={streaming}
        placeholder={ready ? "Tanya: apakah pekerjaan X masuk BG saya? Ruang lingkup BG001 vs BG002? Perbedaan teknis antar subklasifikasi?…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
