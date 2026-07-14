import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  Leaf, ChevronDown, ChevronUp, Search, Map as MapIcon, FileText,
  ClipboardCheck, BarChart2, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, MessageActions, AttachmentRow, ChatAttachment } from "@/components/chat-input-bar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubAgentStatus {
  agentId: number;
  role: string;
  status: "waiting" | "running" | "done" | "error";
  elapsed?: number;
  preview?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  subAgents?: SubAgentStatus[];
  orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

// ─── Agent Metadata ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "AGENT-READINESS": {
    icon: <Search className="h-3 w-3" />,
    label: "Readiness",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    code: "RDY",
  },
  "AGENT-ASPDAMP": {
    icon: <MapIcon className="h-3 w-3" />,
    label: "Aspek/Dampak",
    color: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    code: "A/D",
  },
  "AGENT-DOCS": {
    icon: <FileText className="h-3 w-3" />,
    label: "Dok Lingkungan",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "DOC",
  },
  "AGENT-AUDIT": {
    icon: <ClipboardCheck className="h-3 w-3" />,
    label: "Audit Internal",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    code: "AUD",
  },
  "AGENT-KPI": {
    icon: <BarChart2 className="h-3 w-3" />,
    label: "Env KPI",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    code: "KPI",
  },
  "AGENT-SURVEILLANCE": {
    icon: <RefreshCw className="h-3 w-3" />,
    label: "Surveillance",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    code: "SRV",
  },
};

const AGENT_LEGEND = [
  "AGENT-READINESS", "AGENT-ASPDAMP", "AGENT-DOCS",
  "AGENT-AUDIT", "AGENT-KPI", "AGENT-SURVEILLANCE",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role.toUpperCase().includes(key.replace("AGENT-", ""))) return ROLE_META[key];
  }
  return { icon: <Leaf className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
}

function statusIcon(status: SubAgentStatus["status"]) {
  if (status === "running") return <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />;
  if (status === "done") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
  if (status === "error") return <AlertCircle className="h-3 w-3 text-red-400" />;
  return <Clock className="h-3 w-3 text-white/30" />;
}

// ─── Sub-Agent Panel ──────────────────────────────────────────────────────────

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;

  return (
    <div className="mt-2 rounded-lg border border-green-800/40 bg-green-950/20 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <Leaf className="h-3 w-3 text-green-400 shrink-0" />
        <span className="text-green-300 font-medium">
          {running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status === "done" ? "bg-green-400" :
              a.status === "running" ? "bg-yellow-400 animate-pulse" :
              a.status === "error" ? "bg-red-400" : "bg-white/20"
            }`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
      </button>
      {expanded && (
        <div className="border-t border-green-800/30 px-3 py-2 space-y-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            return (
              <div key={i} className="flex items-start gap-2">
                {statusIcon(a.status)}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}>
                  {meta.icon}
                  <span className="font-mono">{meta.code}</span>
                  <span className="text-white/40">·</span>
                  <span>{meta.label}</span>
                </div>
                {a.elapsed && <span className="text-white/30 ml-auto">{(a.elapsed / 1000).toFixed(1)}s</span>}
                {a.preview && <span className="text-white/30 text-xs italic ml-1 truncate max-w-[200px]">{a.preview}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Message Renderer ─────────────────────────────────────────────────────────

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-green-900/70 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">🌿</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && <SubAgentPanel agents={msg.subAgents} />}
        <div className="mt-2" style={{ wordBreak: "break-word" }}>
          {msg.isStreaming && !msg.content
            ? <span className="animate-pulse text-white/60">▋</span>
            : <MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed" />}
        </div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs && msg.subAgents && msg.subAgents.length > 0 && !msg.isStreaming && (
          <div className="flex items-center gap-1 text-xs text-white/30 px-1 mt-1">
            <Zap className="h-2.5 w-2.5" />
            <span>{msg.subAgents.length} agen paralel · {(msg.orchestrationMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sample Prompts ───────────────────────────────────────────────────────────

const SAMPLE_PROMPTS = [
  { icon: "🔍", text: "Lakukan gap analysis ISO 14001:2015 untuk kontraktor gedung kami. Kami belum memiliki daftar aspek dan dampak lingkungan formal." },
  { icon: "🌍", text: "Identifikasi aspek dan dampak lingkungan signifikan dari proyek konstruksi gedung 10 lantai di area perkotaan." },
  { icon: "📄", text: "Bantu draft Kebijakan Lingkungan, Sasaran Lingkungan, dan prosedur pengelolaan limbah B3 konstruksi." },
  { icon: "✅", text: "Rencanakan audit internal ISO 14001 klausul 4-10. Buat jadwal, checklist, dan format laporan temuan." },
  { icon: "📊", text: "Rancang KPI lingkungan untuk proyek konstruksi: indikator emisi, limbah, konsumsi energi, dan air. Format monitoring bulanan." },
  { icon: "🔄", text: "Kami akan surveillance ISO 14001 3 bulan lagi. Berikan checklist persiapan dan dokumen yang perlu diupdate." },
];

const ENV_TAGS = [
  { label: "🏗️ Debu & Partikel" }, { label: "🔊 Kebisingan" },
  { label: "⚗️ Limbah B3" }, { label: "💧 Run-off & Air" },
  { label: "⚡ Energi" }, { label: "♻️ Daur Ulang" },
  { label: "🌡️ GRK & Emisi" }, { label: "📋 UKL-UPL" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IsoClaw14001Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/iso-claw/14001/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/iso-claw/14001/orchestrator");
      if (!res.ok) throw new Error("ISOClaw 14001 orchestrator not found");
      return res.json();
    },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if ((!text.trim() && files.length === 0) || streaming || !agentId) return;
    setStreaming(true);
    const userMsg: Message = { role: "user", content: text, attachments: files.length ? files : undefined };
    setMessages(prev => [...prev, userMsg]);
    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true, subAgents: [] };
    setMessages(prev => [...prev, assistantMsg]);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const orchStart = Date.now();
    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history , ...(files.length ? { attachments: files } : {})}),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      const subAgentMap = new Map<number, SubAgentStatus>();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "orchestrating_start") {
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((sa: any) => ({ agentId: sa.agentId, role: sa.role, status: "waiting" as const }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "sub_agent_start") {
              const s = subAgentMap.get(evt.agentId); if (s) { s.status = "running"; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "sub_agent_done") {
              const s = subAgentMap.get(evt.agentId); if (s) { s.status = "done"; s.elapsed = evt.elapsed; s.preview = evt.preview; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, content: fullContent, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "complete") {
              if (evt.message?.content) fullContent = evt.message.content;
            }
          } catch {}
        }
      }
      const orchMs = Date.now() - orchStart;
      setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, isStreaming: false, subAgents: Array.from(subAgentMap.values()), orchestrationMs: orchMs }; return u; });
    } catch {
      setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, content: "Maaf, terjadi kesalahan. Silakan coba lagi.", isStreaming: false }; return u; });
    } finally {
      setStreaming(false);
      // input focus handled by ChatInputBar
    }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#050d07] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#060e08]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center text-lg">🌿</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">ISOClaw 14001 — Sistem Manajemen Lingkungan AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-green-400" />
            <span>6 Spesialis Paralel · ISO 14001:2015 · PP 22/2021 · Aspek/Dampak · B3 · UKL-UPL</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/iso-claw-9001">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-400/70 hover:text-blue-300 hover:bg-blue-900/30 hidden sm:flex gap-1" data-testid="button-nav-9001">
              ✅ ISO 9001
            </Button>
          </Link>
          <Badge variant="outline" className="text-xs border-green-500/40 text-green-300 hidden sm:flex">ISOClaw 14001</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 6-Agent Legend Strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#060e08]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">6 Spesialis:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
              {meta.icon}
              <span className="font-mono text-[10px]">{meta.code}</span>
              <span className="hidden sm:inline text-[10px]">· {meta.label}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">Klausul 4-10 · Aspek/Dampak · B3 · UKL-UPL · Monitoring · Surveillance</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🌿</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-green-300 to-lime-300 bg-clip-text text-transparent">
                ISOClaw 14001 — Sistem Manajemen Lingkungan Konstruksi
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                6 spesialis bekerja paralel: <span className="text-green-300">RDY</span> (readiness assessment) ·{" "}
                <span className="text-lime-300">A/D</span> (aspek & dampak lingkungan) ·{" "}
                <span className="text-emerald-300">DOC</span> (kebijakan & dokumen lingkungan) ·{" "}
                <span className="text-teal-300">AUD</span> (audit internal) ·{" "}
                <span className="text-cyan-300">KPI</span> (env KPI & monitoring) ·{" "}
                <span className="text-sky-300">SRV</span> (surveillance & re-sertifikasi)
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Referensi: ISO 14001:2015 · PP 22/2021 PPLH · PP 74/2001 B3 · PermenLHK · UKL-UPL
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {ENV_TAGS.map(c => (
                <span key={c.label} className="px-2 py-0.5 rounded border border-green-800/40 bg-green-950/20 text-green-300/70">{c.label}</span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-green-500/40 hover:bg-green-900/20 transition-all disabled:opacity-40 text-white/70"
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
        placeholder={ready ? "Tanya tentang ISO 14001, aspek/dampak, B3, UKL-UPL, audit internal, surveillance…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
