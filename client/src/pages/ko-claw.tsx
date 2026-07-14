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
  ChevronDown, ChevronUp, Drill, Layers, Hammer, PaintBucket,
  Droplets, Construction, Wrench, HardHat, Mountain,
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

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string; desc: string }> = {
  "AGENT-KO001": { icon: <Mountain className="h-3 w-3" />,      label: "KO001", color: "bg-stone-500/20 text-stone-300 border-stone-500/30",    code: "KO001", desc: "Penyiapan Lahan & Pembongkaran" },
  "AGENT-KO002": { icon: <Drill className="h-3 w-3" />,         label: "KO002", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",    code: "KO002", desc: "Pondasi Dalam & Geoteknik Khusus" },
  "AGENT-KO003": { icon: <Layers className="h-3 w-3" />,        label: "KO003", color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       code: "KO003", desc: "Konstruksi Baja & Struktur Baja" },
  "AGENT-KO004": { icon: <PaintBucket className="h-3 w-3" />,   label: "KO004", color: "bg-pink-500/20 text-pink-300 border-pink-500/30",       code: "KO004", desc: "Finishing & Penyelesaian Bangunan" },
  "AGENT-KO005": { icon: <Droplets className="h-3 w-3" />,      label: "KO005", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",       code: "KO005", desc: "Kedap Air & Proteksi Bangunan" },
  "AGENT-KO006": { icon: <Construction className="h-3 w-3" />,  label: "KO006", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",code: "KO006", desc: "Pengeboran & Sumur Air" },
  "AGENT-KO007": { icon: <Hammer className="h-3 w-3" />,        label: "KO007", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", code: "KO007", desc: "Pengaspalan & Perkerasan Khusus" },
  "AGENT-KO008": { icon: <Wrench className="h-3 w-3" />,        label: "KO008", color: "bg-violet-500/20 text-violet-300 border-violet-500/30", code: "KO008", desc: "Konstruksi Khusus Lainnya" },
};

const AGENT_LEGEND = ["AGENT-KO001","AGENT-KO002","AGENT-KO003","AGENT-KO004","AGENT-KO005","AGENT-KO006","AGENT-KO007","AGENT-KO008"];

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { icon: <HardHat className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "KO", desc: "Subklasifikasi KO" };
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
    <div className="mt-2 rounded-lg border border-violet-800/40 bg-violet-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <HardHat className="h-3 w-3 text-violet-400 shrink-0" />
        <span className="text-violet-200 font-medium">{running > 0 ? `Menganalisis ${running} subklasifikasi KO…` : `${done}/${agents.length} subklasifikasi dianalisis`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} title={getRoleMeta(a.role).desc}
              className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-violet-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-violet-900/50 text-white text-sm">{msg.content}</div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-violet-900/60 border border-violet-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">🔩</div>
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
  { icon: "🔩", text: "Saya kontraktor KO002 (pondasi dalam). Apakah saya bisa mengerjakan bore pile Ø800mm untuk gedung 20 lantai? Apa perbedaan metode wet boring vs dry boring, dan kapan masing-masing digunakan?" },
  { icon: "🏗️", text: "Proyek fabrikasi dan erection rangka baja gudang cold storage 5.000 m². Ini masuk KO003? Apa yang tercakup — fabrikasi di workshop, delivery, erection, dan pengecatan anti-korosi?" },
  { icon: "💧", text: "Sistem waterproofing basement 3 lantai di bawah muka air tanah. Masuk KO005? Apa metode yang direkomendasikan — crystalline, membrane eksterior, atau kombinasi? Apa irisan dengan KO002?" },
  { icon: "🎨", text: "Proyek interior fit-out gedung perkantoran: partisi gypsum, plafon akustik, keramik homogeneous, cat, dan curtain wall kaca. Semuanya masuk KO004? Ada yang masuk KO lain?" },
  { icon: "🛢️", text: "Kontraktor KO003 diminta mengerjakan tangki BBM 2.000 kL (API 650) termasuk fabrikasi bottom plate, shell, dan floating roof. Ini masuk KO003? Apa standar teknis yang berlaku?" },
  { icon: "⛏️", text: "Perbedaan KO001 (penyiapan lahan) dan KO002 (pondasi). Kalau pekerjaan galian pondasi (excavation for foundation) menggunakan alat berat, ini masuk subklasifikasi yang mana?" },
];

const KO_CARDS = [
  { code: "KO001", desc: "Penyiapan Lahan & Demolisi", icon: "⛏️", color: "border-stone-500/30 bg-stone-900/30" },
  { code: "KO002", desc: "Pondasi Dalam & Geoteknik", icon: "🔩", color: "border-amber-600/30 bg-amber-950/20" },
  { code: "KO003", desc: "Konstruksi Baja", icon: "🏗️", color: "border-blue-600/30 bg-blue-950/20" },
  { code: "KO004", desc: "Finishing Bangunan", icon: "🎨", color: "border-pink-600/30 bg-pink-950/20" },
  { code: "KO005", desc: "Kedap Air & Proteksi", icon: "💧", color: "border-cyan-600/30 bg-cyan-950/20" },
  { code: "KO006", desc: "Pengeboran & Sumur", icon: "🕳️", color: "border-emerald-600/30 bg-emerald-950/20" },
  { code: "KO007", desc: "Pengaspalan Khusus", icon: "🛣️", color: "border-yellow-600/30 bg-yellow-950/20" },
  { code: "KO008", desc: "Konstruksi Khusus Lainnya", icon: "🔧", color: "border-violet-600/30 bg-violet-950/20" },
];

export default function KoClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/ko-claw/orchestrator"],
    queryFn: async () => { const res = await fetch("/api/ko-claw/orchestrator"); if (!res.ok) throw new Error("KOClaw not found"); return res.json(); },
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
      const res = await fetch("/api/messages/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history }, ...(files.length ? { attachments: files } : {})) });
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
            } else if (evt.type === "complete") { if(evt.message?.content) fullContent=evt.message.content; }
          } catch {}
        }
      }
      const orchMs = Date.now()-orchStart;
      setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs}; return u; });
    } catch {
      setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l.role==="assistant") u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false}; return u; });
    } finally { setStreaming(false); inputRef.current?.focus(); }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0613] text-white">
      <div className="shrink-0 border-b border-violet-900/40 px-4 py-3 flex items-center gap-3 bg-[#0c0715]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-violet-900/60 border border-violet-700/40 flex items-center justify-center text-lg">🔩</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">KOClaw — Navigator Ruang Lingkup Pekerjaan Konstruksi Spesialis</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-violet-400" />
            <span>8 Subklasifikasi KO001–KO008 · Permen PU 6/2025 · KBLI 2020 · Konstruksi Khusus & Spesialis</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-violet-700/40 text-violet-300 hidden sm:flex">KOClaw · KO001–KO008</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0c0715]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Subklasifikasi:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}>
              {meta.icon}<span className="font-mono font-bold text-[10px]">{meta.code}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden xl:inline">Lahan · Pondasi · Baja · Finishing · Waterproofing · Sumur · Aspal · Khusus</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🔩</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">KOClaw — Ruang Lingkup Pekerjaan Konstruksi Spesialis</div>
              <div className="text-sm text-white/50 max-w-2xl">Navigator AI untuk kontraktor spesialis yang ingin memahami <strong className="text-white/70">apa yang boleh dikerjakan</strong> dalam setiap subklasifikasi KO — dari penyiapan lahan, pondasi dalam, baja, finishing, waterproofing, pengeboran, pengaspalan, hingga konstruksi khusus lainnya.</div>
              <div className="text-xs text-white/30 mt-2">Referensi: Permen PU No. 6 Tahun 2025 · KBLI 2020 (Kelompok 43xxx) · UU 2/2017 · PP 14/2021</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-2xl">
              {KO_CARDS.map(c => (
                <button key={c.code} onClick={() => sendMessage(`Jelaskan ruang lingkup pekerjaan subklasifikasi ${c.code} (${c.desc}) secara lengkap — jenis pekerjaan yang bisa dikerjakan, metode teknis, dan batasannya.`)}
                  disabled={!ready || streaming}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`}
                  data-testid={`card-${c.code.toLowerCase()}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono font-bold text-xs text-white/80">{c.code}</span>
                  <span className="text-[9px] text-white/50 leading-tight">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-700/40 hover:bg-violet-950/30 transition-all disabled:opacity-40 text-white/70"
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

      <div className="shrink-0 border-t border-violet-900/30 px-4 py-3 bg-[#0c0715]/80">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input);} }}
            placeholder={ready ? "Tanya: apakah pekerjaan X masuk KO saya? Ruang lingkup KO002 vs KO001? Metode teknis apa yang tersedia?…" : "Menghubungkan ke KOClaw…"}
            disabled={!ready || streaming}
            className="flex-1 bg-violet-950/30 border-violet-800/40 text-white placeholder:text-white/30 focus-visible:ring-violet-600/40 text-sm h-10"
            data-testid="input-message" />
          <Button onClick={() => sendMessage(input)} disabled={!ready || streaming || !input.trim()}
            className="bg-violet-800 hover:bg-violet-700 text-white h-10 px-4 shrink-0" data-testid="button-send">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-center mt-2 text-xs text-white/20">KOClaw v1 · KO001–KO008 · Permen PU 6/2025 · KBLI 2020 · Ruang Lingkup Konstruksi Spesialis</div>
      </div>
    </div>
  );
}
