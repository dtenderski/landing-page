import { useState, useRef, useEffect } from "react";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { MessageContent } from "@/lib/format-message";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, ShieldAlert, User, BarChart2,
  FlaskConical, CalendarCheck, Brain, MapPin, Globe, MessageSquare,
  FileText, Star,
} from "lucide-react";
import { Link } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
}

// ─── Agent Metadata ─────────────────────────────────────────────────────────

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "SAFETY": {
    icon: <ShieldAlert className="h-3 w-3" />,
    label: "Safety Gate",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    code: "SAFE",
  },
  "PROFIL": {
    icon: <User className="h-3 w-3" />,
    label: "Profil Siswa",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    code: "PROF",
  },
  "AKADEMIK": {
    icon: <BarChart2 className="h-3 w-3" />,
    label: "Akademik",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    code: "AKAD",
  },
  "DIAGNOSTIK": {
    icon: <FlaskConical className="h-3 w-3" />,
    label: "Diagnostik",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "DIAG",
  },
  "INTERVENSI": {
    icon: <CalendarCheck className="h-3 w-3" />,
    label: "Intervensi",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    code: "INTV",
  },
  "HABIT": {
    icon: <Brain className="h-3 w-3" />,
    label: "Habit Coach",
    color: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    code: "HBIT",
  },
  "PATHWAY-DN": {
    icon: <MapPin className="h-3 w-3" />,
    label: "Studi DN",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    code: "P-DN",
  },
  "PATHWAY-LN": {
    icon: <Globe className="h-3 w-3" />,
    label: "Studi LN",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    code: "P-LN",
  },
  "ORTU": {
    icon: <MessageSquare className="h-3 w-3" />,
    label: "Kom. Ortu",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    code: "ORTU",
  },
  "DOK": {
    icon: <FileText className="h-3 w-3" />,
    label: "Dok. BK",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    code: "DOKM",
  },
  "ESKUL": {
    icon: <Star className="h-3 w-3" />,
    label: "Eskul",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    code: "ESKL",
  },
};

const AGENT_LEGEND = [
  "SAFETY", "PROFIL", "AKADEMIK", "DIAGNOSTIK", "INTERVENSI",
  "HABIT", "PATHWAY-DN", "PATHWAY-LN", "ORTU", "DOK", "ESKUL",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role.toUpperCase().includes(key.replace("-", "").replace("_", ""))) return ROLE_META[key];
    if (role.toUpperCase().includes(key)) return ROLE_META[key];
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

// ─── Sub-Agent Panel ────────────────────────────────────────────────────────

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;

  return (
    <div className="mt-2 rounded-lg border border-teal-800/40 bg-teal-950/30 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <BookOpen className="h-3 w-3 text-teal-400 shrink-0" />
        <span className="text-teal-300 font-medium">
          {running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status === "done" ? "bg-green-400" :
              a.status === "running" ? "bg-teal-400 animate-pulse" :
              a.status === "error" ? "bg-red-400" : "bg-white/20"
            }`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
      </button>
      {expanded && (
        <div className="border-t border-teal-800/30 px-3 py-2 space-y-1.5">
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

// ─── Message Renderer ───────────────────────────────────────────────────────

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(msg.content)
    : { fields: [], cleanContent: msg.content };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-teal-700/70 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[90%] space-y-1">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/8 border border-white/10 text-sm text-white/90 leading-relaxed">
          {msg.isStreaming && !msg.content ? (
            <span className="inline-flex items-center gap-1.5 text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Mengkoordinasikan 11 agen EduCounsel…</span>
            </span>
          ) : <MessageContent text={cleanContent || ""} className="text-sm text-white/90" />}
        </div>
        <BrainChip fields={brainFields} />
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} />
        )}
        {msg.orchestrationMs && !msg.isStreaming && (
          <div className="text-[10px] text-white/20 px-1">
            {(msg.orchestrationMs / 1000).toFixed(1)}s · EduCounsel AI · OpenClaw L4
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sample Prompts ─────────────────────────────────────────────────────────

const SAMPLE_PROMPTS = [
  { icon: "📉", text: "Nilai matematika saya turun dari 85 ke 62. Bagaimana cara memperbaikinya?" },
  { icon: "🎓", text: "Saya kelas 12 IPA, bingung pilih jurusan kuliah. Minat saya di sains dan teknologi." },
  { icon: "✈️", text: "Saya ingin kuliah di luar negeri dengan beasiswa. Mulai dari mana?" },
  { icon: "🏃", text: "Eskul apa yang cocok buat saya? Suka teknologi, waktu luang 3 jam/minggu." },
  { icon: "😰", text: "Saya cemas banget menghadapi SNBT 2 bulan lagi. Tolong bantu buat rencana belajar." },
  { icon: "📋", text: "Ada siswa saya yang nilainya terus turun dan terlihat tidak bersemangat. Bagaimana mendekatinya?" },
];

// ─── Mode Selector ──────────────────────────────────────────────────────────

type Mode = "siswa" | "konselor" | "ortu";

const MODE_CONFIG: Record<Mode, { label: string; desc: string; color: string }> = {
  siswa: { label: "👨‍🎓 Mode Siswa", desc: "Bahasa santai & solutif", color: "border-teal-500/50 text-teal-300" },
  konselor: { label: "🏫 Mode Konselor", desc: "Analitis & dokumentasi", color: "border-blue-500/50 text-blue-300" },
  ortu: { label: "👨‍👩‍👧 Mode Orang Tua", desc: "Empatik & kolaboratif", color: "border-green-500/50 text-green-300" },
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function EduCounselChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("siswa");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    id: number;
    name: string;
    tagline?: string;
  }>({
    queryKey: ["/api/educounsel/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/educounsel/orchestrator");
      if (!res.ok) throw new Error("EduCounsel Orchestrator not found");
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

  async function sendMessage(text: string) {
    if (!text.trim() || streaming || !agentId) return;

    const fullText = `[MODE: ${mode.toUpperCase()}] ${text}`;
    setInput("");
    setStreaming(true);

    const userMsg: Message = { role: "user", content: text };
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
        body: JSON.stringify({
          agentId: String(agentId),
          role: "user",
          content: fullText,
          conversationHistory: history,
        }),
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
          updated[updated.length - 1] = {
            ...last,
            isStreaming: false,
            subAgents: Array.from(subAgentMap.values()),
            orchestrationMs: orchMs,
          };
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
      inputRef.current?.focus();
    }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#030d0a] text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#041008]/80 backdrop-blur">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-lg">
          🎓
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{agentData?.name ?? "EduCounsel AI — Konselor Akademik Siswa"}</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-teal-400" />
            <span>11 Agen Spesialis · SD/SMP/SMA/SMK/Alumni · OpenClaw L4</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-500/40 text-teal-300 hidden sm:flex">
            EduCounsel v1
          </Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            Safety Gate
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 11-Agent legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#041008]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">11 Agen:</span>
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
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">Safety First · DAP Format · Risiko Hijau/Kuning/Merah · 21 Eskul</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🎓</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-teal-300 to-green-300 bg-clip-text text-transparent">
                EduCounsel AI — Konselor Akademik Multi-Agent
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                11 agen spesialis bekerja paralel untuk pendampingan siswa SD–Alumni:{" "}
                <span className="text-red-300">Safety Gate</span> ·{" "}
                <span className="text-sky-300">Profil Siswa</span> ·{" "}
                <span className="text-teal-300">Analisis Akademik</span> ·{" "}
                <span className="text-emerald-300">Diagnostik</span> ·{" "}
                <span className="text-green-300">Intervensi 14-Hari</span> ·{" "}
                <span className="text-lime-300">Habit Coach</span> ·{" "}
                <span className="text-yellow-300">Studi DN</span> ·{" "}
                <span className="text-amber-300">Studi LN</span> ·{" "}
                <span className="text-orange-300">Kom. Ortu</span> ·{" "}
                <span className="text-violet-300">Dok. BK DAP</span> ·{" "}
                <span className="text-pink-300">Eskul Matcher</span>
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex gap-2 flex-wrap justify-center">
              {(Object.keys(MODE_CONFIG) as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  data-testid={`mode-${m}`}
                  className={`flex flex-col items-center px-4 py-2 rounded-xl border text-xs transition-all ${
                    mode === m
                      ? `${MODE_CONFIG[m].color} bg-white/8`
                      : "border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  <span className="font-medium">{MODE_CONFIG[m].label}</span>
                  <span className="text-white/30 text-[10px]">{MODE_CONFIG[m].desc}</span>
                </button>
              ))}
            </div>

            {/* Mode chips */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                { icon: "🛡️", label: "Safety Gate Wajib" },
                { icon: "📊", label: "Risiko Akademik" },
                { icon: "🔬", label: "Mini-Test Diagnostik" },
                { icon: "📅", label: "Rencana 14 Hari" },
                { icon: "🧠", label: "Anti-Prokrastinasi" },
                { icon: "🌏", label: "Studi Luar Negeri" },
                { icon: "🎭", label: "21 Eskul + Portofolio" },
                { icon: "📋", label: "Catatan BK DAP" },
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-teal-500/40 hover:bg-teal-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>

            <div className="text-xs text-white/25 max-w-md text-center">
              Safety Gate aktif di setiap sesi · Tidak menggantikan konselor manusia · Eskalasi otomatis untuk kasus risiko ≥ sedang
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                EduCounsel Orchestrator belum siap. Coba refresh halaman.
              </div>
            )}
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-[#041008]/80">
        {/* Active mode indicator */}
        <div className="flex items-center gap-2 mb-2 max-w-3xl mx-auto">
          <span className={`text-[10px] px-2 py-0.5 rounded border ${MODE_CONFIG[mode].color}`}>
            {MODE_CONFIG[mode].label}
          </span>
          <span className="text-[10px] text-white/25">{MODE_CONFIG[mode].desc}</span>
          <button
            onClick={() => {
              const modes = Object.keys(MODE_CONFIG) as Mode[];
              const idx = modes.indexOf(mode);
              setMode(modes[(idx + 1) % modes.length]);
            }}
            className="text-[10px] text-white/30 hover:text-white/60 ml-auto transition-colors"
            data-testid="button-cycle-mode"
          >
            Ganti mode →
          </button>
        </div>
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={
              ready
                ? mode === "siswa"
                  ? "Ceritakan kondisi belajarmu…"
                  : mode === "konselor"
                  ? "Deskripsikan kondisi siswa…"
                  : "Ceritakan kondisi anak Anda…"
                : "Menghubungkan ke EduCounsel AI…"
            }
            disabled={!ready || streaming}
            className="flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-teal-500/50 text-sm"
            data-testid="input-message"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!ready || streaming || !input.trim()}
            className="bg-teal-600 hover:bg-teal-500 text-white shrink-0 disabled:opacity-40"
            data-testid="button-send"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-[10px] text-white/20 text-center mt-2">
          EduCounsel AI bukan pengganti konselor manusia · Kasus krisis akan dieskalasi otomatis
        </div>
      </div>
    </div>
  );
}
