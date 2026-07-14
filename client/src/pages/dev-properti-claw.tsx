import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Building2, MapPin, Home, FileText,
  CreditCard, Shield, Camera, Key, Handshake, HelpCircle,
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
  "INF":     { icon: <MapPin className="h-3 w-3" />,     label: "Info Proyek",      color: "bg-violet-500/20 text-violet-300 border-violet-500/30",  code: "INF" },
  "UNIT":    { icon: <Home className="h-3 w-3" />,       label: "Tipe Unit",        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",  code: "UNIT" },
  "HARGA":   { icon: <CreditCard className="h-3 w-3" />, label: "Harga & Promo",    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",  code: "HARGA" },
  "BOOKING": { icon: <FileText className="h-3 w-3" />,   label: "Booking & PPJB",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30",        code: "BOOK" },
  "KPR":     { icon: <Building2 className="h-3 w-3" />, label: "KPR & Pembiayaan", color: "bg-sky-500/20 text-sky-300 border-sky-500/30",           code: "KPR" },
  "LEGAL":   { icon: <Shield className="h-3 w-3" />,    label: "Legalitas",        color: "bg-slate-500/20 text-slate-300 border-slate-500/30",     code: "LEGAL" },
  "VISIT":   { icon: <Camera className="h-3 w-3" />,    label: "Site Visit",       color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",code: "VISIT" },
  "SERAH":   { icon: <Key className="h-3 w-3" />,       label: "Serah Terima",     color: "bg-pink-500/20 text-pink-300 border-pink-500/30",         code: "SERAH" },
  "AGEN":    { icon: <Handshake className="h-3 w-3" />, label: "Kerja Sama Agen",  color: "bg-rose-500/20 text-rose-300 border-rose-500/30",         code: "AGEN" },
  "FAQ":     { icon: <HelpCircle className="h-3 w-3" />,label: "FAQ & Due Diligence",color:"bg-amber-500/20 text-amber-300 border-amber-500/30",     code: "FAQ" },
};

const AGENT_LEGEND = ["INF","UNIT","HARGA","BOOKING","KPR","LEGAL","VISIT","SERAH","AGEN","FAQ"];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role === key || role.toUpperCase().includes(key)) return ROLE_META[key];
  }
  return { icon: <Building2 className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
}
function statusIcon(s: SubAgentStatus["status"]) {
  if (s === "running") return <Loader2 className="h-3 w-3 animate-spin text-violet-400" />;
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
        <Building2 className="h-3 w-3 text-violet-400 shrink-0" />
        <span className="text-violet-300 font-medium">{running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}</span>
        <div className="flex gap-1 ml-auto flex-wrap">
          {agents.map((a, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-violet-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />)}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-violet-800/30 px-3 py-2 grid grid-cols-2 gap-1.5">
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
  if (msg.role === "user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-violet-950/60 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-violet-900/60 border border-violet-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏠</div>
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
  { icon: "🏡", text: "Kami developer yang baru meluncurkan perumahan cluster 200 unit di Bekasi. Tolong bantu saya siapkan materi pemasaran lengkap: USP proyek, skema pembayaran kompetitif, dan skrip sales untuk tim lapangan." },
  { icon: "📋", text: "Calon pembeli bertanya apakah SHM atau HGB lebih baik untuk perumahan baru. Jelaskan perbedaan, proses balik nama, biaya BPHTB dan PPh, dan risiko masing-masing dari perspektif developer." },
  { icon: "🏦", text: "Kami ingin menawarkan KPR dengan bank rekanan. Simulasikan cicilan untuk unit Rp 800 juta dengan DP 20%, tenor 20 tahun. Juga jelaskan proses pengajuan dan syarat dokumen untuk calon pembeli." },
  { icon: "📝", text: "Pelanggan kami mengeluhkan kualitas bangunan setelah serah terima — retak rambut di dinding dan kebocoran atap. Bagaimana prosedur garansi developer yang benar sesuai UU Perlindungan Konsumen?" },
  { icon: "🤝", text: "Kami ingin merekrut agen properti freelance untuk bantu penjualan. Buatkan struktur komisi, perjanjian kerja sama agen, dan materi onboarding untuk 50 agen baru." },
  { icon: "📍", text: "Calon pembeli ingin site visit minggu depan. Buatkan rundown acara site visit profesional, talking points untuk presenter, dan checklist yang harus dipersiapkan tim di lokasi." },
];

const DEV_TAGS = [
  { label: "Master Plan & Fasilitas Kawasan" }, { label: "Skema Pembayaran & KPR" },
  { label: "Legalitas SHM/HGB/PBG" }, { label: "Proses PPJB & AJB" },
  { label: "Aftersales & Garansi Bangunan" }, { label: "Program Agen & Co-Marketing" },
];

export default function DevPropertiClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/dev-properti-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/dev-properti-claw/orchestrator");
      if (!res.ok) throw new Error("DevPropertiClaw not found");
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
    <div className="flex flex-col h-screen bg-[#07050e] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#090612]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="w-9 h-9 rounded-full bg-violet-900/60 border border-violet-700/40 flex items-center justify-center text-lg">🏠</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">DevPropertiClaw — AI Developer Real Estate</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-violet-400" /><span>10 Spesialis Paralel · Info · Unit · Harga · KPR · Legal · Booking · Visit · Serah · Agen · FAQ</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-violet-500/40 text-violet-300 hidden sm:flex">DevProperti · 10 Agen</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#090612]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">10 Spesialis:</span>
        {AGENT_LEGEND.map(role => { const meta = getRoleMeta(role); return (
          <div key={role} className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`}>
            {meta.icon}<span className="font-mono text-[10px]">{meta.code}</span>
          </div>
        ); })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden lg:inline">INF · UNIT · HARGA · BOOK · KPR · LEGAL · VISIT · SERAH · AGEN · FAQ</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏠</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">DevPropertiClaw — AI Asisten Developer Real Estate</div>
              <div className="text-sm text-white/50 max-w-2xl">
                <span className="text-violet-300">INF</span> (info & master plan) · <span className="text-purple-300">UNIT</span> (tipe & spesifikasi) · <span className="text-indigo-300">HARGA</span> (pricing & promo) · <span className="text-blue-300">BOOK</span> (booking & PPJB) · <span className="text-sky-300">KPR</span> (simulasi KPR) · <span className="text-slate-300">LEGAL</span> (SHM/HGB/PBG) · <span className="text-fuchsia-300">VISIT</span> (site visit) · <span className="text-pink-300">SERAH</span> (serah terima & garansi) · <span className="text-rose-300">AGEN</span> (program agen) · <span className="text-amber-300">FAQ</span> (due diligence & FAQ)
              </div>
              <div className="text-xs text-white/30 mt-2">Untuk developer, marketing properti, dan tim sales perumahan</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {DEV_TAGS.map(c => <span key={c.label} className="px-2 py-0.5 rounded border border-violet-800/40 bg-violet-950/20 text-violet-300/70">{c.label}</span>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
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
        placeholder={ready ? "Tanya tentang proyek properti, KPR, legalitas, booking, site visit, program agen…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
