import { useState, useRef, useEffect } from "react";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { MessageContent } from "@/lib/format-message";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, Brain, Target, Swords,
  Trophy, Heart, PenLine, Users, Star,
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
  "TheoryAgent": {
    icon: <Brain className="h-3 w-3" />,
    label: "Theory",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    code: "THEORY",
  },
  "DiagnosticAgent": {
    icon: <Target className="h-3 w-3" />,
    label: "Diagnostic",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    code: "DIAG",
  },
  "DrillAgent": {
    icon: <Swords className="h-3 w-3" />,
    label: "Drill",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    code: "DRILL",
  },
  "TryoutAgent": {
    icon: <Star className="h-3 w-3" />,
    label: "Tryout",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    code: "TRYOUT",
  },
  "GamificationAgent": {
    icon: <Trophy className="h-3 w-3" />,
    label: "Gamify",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    code: "GAMIFY",
  },
  "MentorAgent": {
    icon: <Heart className="h-3 w-3" />,
    label: "Mentor",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    code: "MENTOR",
  },
  "LiteracyAgent": {
    icon: <PenLine className="h-3 w-3" />,
    label: "Literacy",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "LITER",
  },
  "ParentDashboardAgent": {
    icon: <Users className="h-3 w-3" />,
    label: "Parent",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    code: "PARENT",
  },
};

const AGENT_LEGEND = [
  "TheoryAgent", "DiagnosticAgent", "DrillAgent", "TryoutAgent",
  "GamificationAgent", "MentorAgent", "LiteracyAgent", "ParentDashboardAgent",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role.includes(key) || role.toUpperCase().includes(key.toUpperCase())) return ROLE_META[key];
  }
  return {
    icon: <BookOpen className="h-3 w-3" />,
    label: role,
    color: "bg-white/10 text-white/60 border-white/20",
    code: "AGT",
  };
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
    <div className="mt-2 rounded-lg border border-indigo-800/40 bg-indigo-950/30 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
        <span className="text-indigo-300 font-medium">
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
        <div className="border-t border-indigo-800/30 px-3 py-2 space-y-1.5">
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
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(msg.content)
    : { fields: [], cleanContent: msg.content };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-indigo-700/70 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">
        🎓
      </div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} />
        )}
        <div
          className="mt-2 text-sm text-white/90 leading-relaxed"
          style={{ wordBreak: "break-word" }}
        >
          {msg.isStreaming && !cleanContent ? <span className="animate-pulse">▋</span> : <MessageContent text={cleanContent || ""} className="text-sm text-white/90" />}
        </div>
        <BrainChip fields={brainFields} />
        {!isUser && msg.orchestrationMs && msg.subAgents && msg.subAgents.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/30 px-1 mt-1">
            <Zap className="h-2.5 w-2.5" />
            <span>
              {msg.subAgents.length} agen paralel · {(msg.orchestrationMs / 1000).toFixed(1)}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sample Prompts ───────────────────────────────────────────────────────────

const SAMPLE_PROMPTS = [
  {
    icon: "🧠",
    text: "Jelaskan persamaan kuadrat untuk SMP kelas 9 — mulai dari yang paling sederhana",
  },
  {
    icon: "🗺️",
    text: "Aku mau tes awal Matematika SMP — diagnosa kemampuan aku dulu sebelum mulai belajar",
  },
  {
    icon: "💪",
    text: "Latihan soal Fisika kelas 10 — topik Gerak Lurus Beraturan (GLB), mulai dari soal mudah",
  },
  {
    icon: "🎯",
    text: "Mau tryout Bahasa Indonesia AKM mode Practice — literasi teks non-fiksi",
  },
  {
    icon: "📝",
    text: "Tolong kasih feedback esai aku tentang perubahan iklim — cek struktur dan argumennya",
  },
  {
    icon: "🌱",
    text: "Aku capek banget belajar, ujian minggu depan tapi gak ada semangat sama sekali",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AiTutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    id: number;
    name: string;
    tagline?: string;
  }>({
    queryKey: ["/api/ai-tutor/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/ai-tutor/orchestrator");
      if (!res.ok) throw new Error("AI Tutor Coordinator not found");
      return res.json();
    },
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (agentData?.id) setAgentId(agentData.id);
  }, [agentData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if ((!text.trim() && files.length === 0) || streaming || !agentId) return;
    setStreaming(true);

    const userMsg: Message = { role: "user", content: text, attachments: files.length ? files : undefined };
    setMessages(prev => [...prev, userMsg]);

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      isStreaming: true,
      subAgents: [],
    };
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
      const subAgentMap: Map<number, SubAgentStatus> = new Map();

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
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((sa: any) => ({
                agentId: sa.agentId,
                role: sa.role,
                status: "waiting" as const,
              }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                }
                return updated;
              });
            } else if (evt.type === "data_master_injected") {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, dataMasterInjected: true } as any;
                return updated;
              });
            } else if (evt.type === "router_decision" || evt.type === "critic_result") {
              // MultiClaw L4 events — acknowledged
            } else if (evt.type === "sub_agent_start") {
              const s = subAgentMap.get(evt.agentId);
              if (s) { s.status = "running"; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "sub_agent_done") {
              const s = subAgentMap.get(evt.agentId);
              if (s) { s.status = "done"; s.elapsed = evt.elapsed; s.preview = evt.preview; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: fullContent, subAgents: Array.from(subAgentMap.values()) };
                }
                return updated;
              });
            } else if (evt.type === "aggregating") {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                }
                return updated;
              });
            } else if (evt.type === "complete") {
              if (evt.message?.content) fullContent = evt.message.content;
            }
          } catch {}
        }
      }

      const orchMs = Date.now() - orchStart;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = { ...last, isStreaming: false, subAgents: Array.from(subAgentMap.values()), orchestrationMs: orchMs };
        }
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: "Maaf, terjadi kesalahan. Silakan coba lagi.", isStreaming: false };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
      // input focus handled by ChatInputBar
    }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#08080f] text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0c0c1a]/80 backdrop-blur">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-lg">
          🎓
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{agentData?.name ?? "AI Tutor Adaptif"}</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-indigo-400" />
            <span>8 Agen Spesialis · Kurikulum Merdeka + K13 + AKM · ABD-7</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-indigo-500/40 text-indigo-300 hidden sm:flex">
            AI Tutor v1
          </Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            ABD v1.1
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 8-Agent legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#0a0a18]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Agen:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
              {meta.icon}
              <span className="font-mono text-[10px]">{meta.code}</span>
              <span className="hidden sm:inline text-white/30">·</span>
              <span className="hidden sm:inline">{meta.label}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">ABD-7 · IRT Rasch · Merdeka + K13 + AKM</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🎓</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                AI Tutor Adaptif — Sistem Tutor Cerdas Pelajar Indonesia
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                8 agen spesialis bekerja paralel untuk pengalaman belajar adaptif:{" "}
                <span className="text-indigo-300">Theory</span> (Socratic 5-lapis) ·{" "}
                <span className="text-violet-300">Diagnostic</span> (CAT/IRT) ·{" "}
                <span className="text-orange-300">Drill</span> (mastery) ·{" "}
                <span className="text-red-300">Tryout</span> (simulasi ujian) ·{" "}
                <span className="text-yellow-300">Gamify</span> (XP/badge) ·{" "}
                <span className="text-pink-300">Mentor</span> (wellness) ·{" "}
                <span className="text-emerald-300">Literacy</span> (AKM) ·{" "}
                <span className="text-sky-300">Parent</span> (laporan ortu)
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Kurikulum: <span className="text-indigo-400">Merdeka + K13 + AKM</span> · Target: SD / SMP / SMA · Hotline distress: 119 ext 8
              </div>
            </div>

            {/* Mode chips */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                { icon: "🧠", label: "Belajar Konsep" },
                { icon: "🗺️", label: "Diagnosa Awal" },
                { icon: "💪", label: "Latihan Soal" },
                { icon: "🎯", label: "Simulasi Ujian" },
                { icon: "📝", label: "Literasi AKM" },
                { icon: "🌱", label: "Wellness Check" },
              ].map(c => (
                <span key={c.label} className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/60">
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-indigo-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>

            <div className="text-xs text-white/25 max-w-md text-center">
              Output ABD-7: Niat Terdeteksi · Asumsi · Jawaban Inti · Cek Paham · Next Step · XP/Reward
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                AI Tutor Coordinator belum diinisialisasi. Pastikan seed script sudah dijalankan.
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
        placeholder={ready ? "Ketik pesan…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />

    </div>
  );
}
