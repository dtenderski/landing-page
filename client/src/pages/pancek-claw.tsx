import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  Shield, ChevronDown, ChevronUp, BookOpen, BarChart2,
  FileText, Swords, Network,
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
  "AGENT-PANCEK-EDU": {
    icon: <BookOpen className="h-3 w-3" />,
    label: "Edukasi Pilar",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    code: "EDU",
  },
  "AGENT-PANCEK-ASSESS": {
    icon: <BarChart2 className="h-3 w-3" />,
    label: "Self-Assessment",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    code: "ASMT",
  },
  "AGENT-PANCEK-GENERATOR": {
    icon: <FileText className="h-3 w-3" />,
    label: "Generator JAGA",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    code: "GEN",
  },
  "AGENT-CORPORATE-DEFENSE": {
    icon: <Swords className="h-3 w-3" />,
    label: "Corp Defense",
    color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    code: "DEF",
  },
  "AGENT-MAPPING": {
    icon: <Network className="h-3 w-3" />,
    label: "Triple Mapping",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    code: "MAP",
  },
};

const AGENT_LEGEND = [
  "AGENT-PANCEK-EDU", "AGENT-PANCEK-ASSESS", "AGENT-PANCEK-GENERATOR",
  "AGENT-CORPORATE-DEFENSE", "AGENT-MAPPING",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role.toUpperCase().includes(key.replace("AGENT-", "").replace("-", ""))) return ROLE_META[key];
    if (role.toUpperCase().includes("PANCEK-EDU")) return ROLE_META["AGENT-PANCEK-EDU"];
    if (role.toUpperCase().includes("PANCEK-ASSESS") || role.toUpperCase().includes("ASSESS")) return ROLE_META["AGENT-PANCEK-ASSESS"];
    if (role.toUpperCase().includes("GENERATOR") || role.toUpperCase().includes("PANCEK-GEN")) return ROLE_META["AGENT-PANCEK-GENERATOR"];
    if (role.toUpperCase().includes("DEFENSE") || role.toUpperCase().includes("CORPORATE")) return ROLE_META["AGENT-CORPORATE-DEFENSE"];
    if (role.toUpperCase().includes("MAPPING") || role.toUpperCase().includes("MAP")) return ROLE_META["AGENT-MAPPING"];
  }
  return { icon: <Shield className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT" };
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
    <div className="mt-2 rounded-lg border border-red-800/40 bg-red-950/20 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <Shield className="h-3 w-3 text-red-400 shrink-0" />
        <span className="text-red-300 font-medium">
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
        <div className="border-t border-red-800/30 px-3 py-2 space-y-1.5">
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-red-900/70 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-red-900/60 border border-red-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">
        🏛️
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
  { icon: "🏛️", text: "Jelaskan 5 Pilar PanCEK KPK dan bagaimana relevansinya dengan BUJK konstruksi saya." },
  { icon: "📊", text: "Lakukan self-assessment PanCEK untuk BUJK kami. Nilai indeks integritas korporasi (IIK) berdasarkan kondisi yang ada." },
  { icon: "🌐", text: "Bantu saya mengisi 79 indikator JAGA.id KPK untuk 6 seksi: K/P/D/C/A/R. Mulai dari seksi pertama." },
  { icon: "⚖️", text: "Perusahaan kami kena dakwaan korporasi pasal 4(2) Perma 13/2016. Bagaimana membangun corporate defense dossier?" },
  { icon: "🔗", text: "Petakan hubungan antara PanCEK KPK, ISO 37001:2016, dan UU Tipikor 31/1999 untuk BUJK konstruksi." },
  { icon: "📋", text: "Apa perbedaan SMAP ISO 37001 dengan PanCEK KPK? Mana yang lebih diutamakan untuk tender pemerintah?" },
];

// ─── Pillar Tags ──────────────────────────────────────────────────────────────

const PILLAR_TAGS = [
  { icon: "🏢", label: "Komitmen (K)" },
  { icon: "📋", label: "Prosedur (P)" },
  { icon: "🔍", label: "Due Diligence (D)" },
  { icon: "📣", label: "Komunikasi (C)" },
  { icon: "🔎", label: "Audit (A)" },
  { icon: "🔄", label: "Respons (R)" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PancekClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/pancek-claw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/pancek-claw/orchestrator");
      if (!res.ok) throw new Error("PanCEKClaw orchestrator not found");
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
    <div className="flex flex-col h-screen bg-[#0e0608] text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#100608]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-red-900/60 border border-red-700/40 flex items-center justify-center text-lg">
          🏛️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">PanCEKClaw — Cegah Korupsi AI</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-red-400" />
            <span>5 Spesialis Paralel · PanCEK KPK · 79 Indikator JAGA.id · Perma 13/2016</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/smap-claw">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-900/30 hidden sm:flex gap-1" data-testid="button-nav-smap">
              <Shield className="h-3 w-3" />
              SMAPClaw
            </Button>
          </Link>
          <Badge variant="outline" className="text-xs border-red-500/40 text-red-300 hidden sm:flex">PanCEKClaw v1</Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">KPK</Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 5-Agent Legend Strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#100607]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">5 Spesialis:</span>
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
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">5 Pilar × 45 Kriteria · IIK · JAGA.id · Perma 13/2016</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏛️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-red-300 to-rose-300 bg-clip-text text-transparent">
                PanCEKClaw — Panduan Cegah Korupsi KPK
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                5 spesialis bekerja paralel: <span className="text-red-300">EDU</span> (5 Pilar + UU Tipikor) ·{" "}
                <span className="text-orange-300">ASMT</span> (self-assessment 45 kriteria + IIK) ·{" "}
                <span className="text-amber-300">GEN</span> (generator 79 indikator JAGA.id) ·{" "}
                <span className="text-rose-300">DEF</span> (corporate defense Perma 13/2016) ·{" "}
                <span className="text-pink-300">MAP</span> (triple mapping PanCEK ↔ ISO 37001 ↔ UU Tipikor)
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Referensi: Panduan KPK PanCEK · UU 31/1999 jo. 20/2001 · Perma 13/2016 · JAGA.id · ISO 37001
              </div>
            </div>

            {/* 6 Seksi JAGA */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {PILLAR_TAGS.map(c => (
                <span key={c.label} className="px-2 py-1 rounded border border-red-800/40 bg-red-950/20 text-red-300/70">
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-red-500/40 hover:bg-red-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                PanCEKClaw orchestrator belum ditemukan. Restart server diperlukan.
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
        placeholder={ready ? "Tanya tentang PanCEK KPK, self-assessment IIK, JAGA.id, corporate defense…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />

    </div>
  );
}
