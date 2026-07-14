import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, ChevronDown, ChevronUp, BookOpen, FileText,
  Search, AlertTriangle, MessageSquare, Mic, ClipboardCheck, Map as MapIcon,
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
  "AGENT-EDU": {
    icon: <BookOpen className="h-3 w-3" />,
    label: "Edukasi",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "EDU",
  },
  "AGENT-GAP": {
    icon: <Search className="h-3 w-3" />,
    label: "Gap Analysis",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    code: "GAP",
  },
  "AGENT-POLICY": {
    icon: <FileText className="h-3 w-3" />,
    label: "Kebijakan",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    code: "POL",
  },
  "AGENT-DUEDIL": {
    icon: <MapIcon className="h-3 w-3" />,
    label: "Due Diligence",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    code: "DDL",
  },
  "AGENT-RISK": {
    icon: <AlertTriangle className="h-3 w-3" />,
    label: "Risk Register",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    code: "RISK",
  },
  "AGENT-CASE": {
    icon: <MessageSquare className="h-3 w-3" />,
    label: "Konsultasi",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    code: "CASE",
  },
  "AGENT-WHISTLE": {
    icon: <Mic className="h-3 w-3" />,
    label: "Whistleblow",
    color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    code: "WB",
  },
  "AGENT-AUDIT": {
    icon: <ClipboardCheck className="h-3 w-3" />,
    label: "Audit",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    code: "AUD",
  },
};

const AGENT_LEGEND = [
  "AGENT-EDU", "AGENT-GAP", "AGENT-POLICY", "AGENT-DUEDIL",
  "AGENT-RISK", "AGENT-CASE", "AGENT-WHISTLE", "AGENT-AUDIT",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role.toUpperCase().includes(key.replace("AGENT-", ""))) return ROLE_META[key];
  }
  return { icon: <ShieldCheck className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
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
    <div className="mt-2 rounded-lg border border-emerald-800/40 bg-emerald-950/30 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
        <span className="text-emerald-300 font-medium">
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
        <div className="border-t border-emerald-800/30 px-3 py-2 space-y-1.5">
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
                {a.preview && (
                  <span className="text-white/30 text-xs italic ml-1 truncate max-w-[200px]">{a.preview}</span>
                )}
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
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-800/70 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">
        🛡️
      </div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} />
        )}
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
  { icon: "📋", text: "Apa itu ISO 37001 dan mengapa BUJK perlu menerapkan SMAP? Apa kewajiban regulasinya?" },
  { icon: "🔍", text: "Lakukan gap analysis SMAP kami. Kami belum punya kebijakan anti-penyuapan formal dan belum ada FKAP." },
  { icon: "📄", text: "Bantu saya draft Kebijakan Anti-Penyuapan dan SK pengangkatan FKAP untuk BUJK kontraktor." },
  { icon: "⚠️", text: "Vendor kami menawarkan 'uang terima kasih' setelah kontrak ditandatangani. Apa langkah yang harus saya ambil?" },
  { icon: "📊", text: "Buat Bribery Risk Register untuk proyek konstruksi pemerintah nilai Rp 50 M — identifikasi P1-P10." },
  { icon: "✅", text: "Bagaimana cara mempersiapkan audit internal SMAP sebelum sertifikasi ISO 37001? Checklist klausul 9-10." },
];

// ─── KPI Strip ────────────────────────────────────────────────────────────────

const COMPLIANCE_ITEMS = [
  { icon: "📜", label: "ISO 37001" },
  { icon: "⚖️", label: "UU 31/1999 Tipikor" },
  { icon: "🏛️", label: "Perma 13/2016" },
  { icon: "🌐", label: "JAGA.id KPK" },
  { icon: "📋", label: "FKAP Klausul 8" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmapClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/smap-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/smap-claw/orchestrator");
      if (!res.ok) throw new Error("SMAPClaw orchestrator not found");
      return res.json();
    },
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
              const s = subAgentMap.get(evt.agentId);
              if (s) { s.status = "running"; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "sub_agent_done") {
              const s = subAgentMap.get(evt.agentId);
              if (s) { s.status = "done"; s.elapsed = evt.elapsed; s.preview = evt.preview; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, content: fullContent, subAgents: Array.from(subAgentMap.values()) }; return u; });
            } else if (evt.type === "aggregating") {
              setMessages(prev => { const u = [...prev]; const l = u[u.length - 1]; if (l.role === "assistant") u[u.length - 1] = { ...l, subAgents: Array.from(subAgentMap.values()) }; return u; });
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
    <div className="flex flex-col h-screen bg-[#060e08] text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#081009]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-lg">
          🛡️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">SMAPClaw — Anti-Penyuapan AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-emerald-400" />
            <span>8 Spesialis Paralel · ISO 37001:2016 · OpenClaw · FKAP · Bribery Risk</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pancek-claw">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-400/70 hover:text-red-300 hover:bg-red-900/30 hidden sm:flex gap-1" data-testid="button-nav-pancek">
              <ShieldCheck className="h-3 w-3" />
              PanCEKClaw
            </Button>
          </Link>
          <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-300 hidden sm:flex">SMAPClaw v1</Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">ISO 37001</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 8-Agent Legend Strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#070e08]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
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
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">Klausul 4-10 · FKAP · Bribery Risk P1-P10 · Whistleblowing</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🛡️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                SMAPClaw — Sistem Manajemen Anti Penyuapan
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                8 spesialis bekerja paralel: <span className="text-emerald-300">EDU</span> (edukasi ISO 37001) ·{" "}
                <span className="text-teal-300">GAP</span> (gap analysis klausul 4-10) ·{" "}
                <span className="text-cyan-300">POLICY</span> (kebijakan & dokumen) ·{" "}
                <span className="text-sky-300">DUEDIL</span> (due diligence mitra) ·{" "}
                <span className="text-amber-300">RISK</span> (bribery risk register) ·{" "}
                <span className="text-orange-300">CASE</span> (konsultasi kasus) ·{" "}
                <span className="text-rose-300">WB</span> (whistleblowing) ·{" "}
                <span className="text-violet-300">AUDIT</span> (audit & sertifikasi)
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Referensi: ISO 37001:2016 · UU 31/1999 jo. 20/2001 Tipikor · Perma 13/2016 · JAGA.id KPK
              </div>
            </div>

            {/* Compliance tags */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {COMPLIANCE_ITEMS.map(c => (
                <span key={c.label} className="px-2 py-1 rounded border border-emerald-800/40 bg-emerald-950/30 text-emerald-300/70">
                  {c.icon} {c.label}
                </span>
              ))}
            </div>

            {/* Sample prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.text)}
                  disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-emerald-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                SMAPClaw orchestrator belum ditemukan. Restart server diperlukan.
              </div>
            )}
          </div>
        ) : (
          <div>
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
        placeholder={ready ? "Tanya tentang SMAP, gap analysis, kebijakan anti-penyuapan, kasus gratifikasi…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />

    </div>
  );
}
