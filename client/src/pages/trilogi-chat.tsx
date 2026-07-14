import { useState, useRef, useEffect } from "react";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { MessageContent } from "@/lib/format-message";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  Bot, ChevronDown, ChevronUp, Users, Mic, MicOff, Phone, PhoneOff, BookText, Headphones,
  MessageSquare, Search, Edit3, Calendar, FileText, Scissors,
  Globe, Radio, Archive, Eye, Shield, Heart, ClipboardList,
  BarChart2, Target, BookOpen, Scale, Sparkles,
} from "lucide-react";
import { Link } from "wouter";

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
}

interface SubAgentLink {
  agentId: number;
  role: string;
  description?: string;
  tags?: string[];
}

interface AgentConfig {
  id: number;
  name: string;
  tagline?: string;
  tags?: string[];
  agenticSubAgents?: SubAgentLink[];
  greetingMessage?: string;
}

// ─── Dynamic Role → Icon mapping ──────────────────────────────────────────────

const ROLE_ICONS: Array<{ match: string[]; icon: React.ReactNode; color: string; code: string }> = [
  { match: ["peneliti", "riset", "research", "arsip", "archive"], icon: <Search className="h-3 w-3" />, color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", code: "RST" },
  { match: ["narator", "script", "naskah", "storytelling", "sparring", "drafting"], icon: <Mic className="h-3 w-3" />, color: "bg-violet-500/20 text-violet-300 border-violet-500/30", code: "NAR" },
  { match: ["editor", "editorial", "qc", "quality"], icon: <Edit3 className="h-3 w-3" />, color: "bg-purple-500/20 text-purple-300 border-purple-500/30", code: "EDT" },
  { match: ["penjadwal", "calendar", "jadwal"], icon: <Calendar className="h-3 w-3" />, color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30", code: "JDW" },
  { match: ["transkripsi", "transkrip", "penanda"], icon: <FileText className="h-3 w-3" />, color: "bg-amber-500/20 text-amber-300 border-amber-500/30", code: "TRN" },
  { match: ["audio", "mixing", "cut", "scissors"], icon: <Scissors className="h-3 w-3" />, color: "bg-orange-500/20 text-orange-300 border-orange-500/30", code: "AUD" },
  { match: ["shownotes", "distribusi", "platform", "caption"], icon: <Globe className="h-3 w-3" />, color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", code: "SHW" },
  { match: ["snippet", "klip", "reel", "shorts", "radio"], icon: <Radio className="h-3 w-3" />, color: "bg-red-500/20 text-red-300 border-red-500/30", code: "SNP" },
  { match: ["visual", "layout", "desain", "kover"], icon: <Eye className="h-3 w-3" />, color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", code: "VIS" },
  { match: ["penyambut", "onboarding", "sambut", "welcome"], icon: <Heart className="h-3 w-3" />, color: "bg-rose-500/20 text-rose-300 border-rose-500/30", code: "SMB" },
  { match: ["faq", "penjawab", "tanya"], icon: <MessageSquare className="h-3 w-3" />, color: "bg-sky-500/20 text-sky-300 border-sky-500/30", code: "FAQ" },
  { match: ["kurator", "monitor", "pemantau", "destilasi"], icon: <Eye className="h-3 w-3" />, color: "bg-teal-500/20 text-teal-300 border-teal-500/30", code: "KUR" },
  { match: ["kohort", "program", "operasional", "asisten"], icon: <ClipboardList className="h-3 w-3" />, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", code: "KOH" },
  { match: ["penjaga", "krisis", "eskalasi", "guardian"], icon: <Shield className="h-3 w-3" />, color: "bg-red-500/20 text-red-300 border-red-500/30", code: "PJG" },
  { match: ["analitik", "analytics", "performa", "data"], icon: <BarChart2 className="h-3 w-3" />, color: "bg-green-500/20 text-green-300 border-green-500/30", code: "ANL" },
  { match: ["pelanggan", "customer", "layanan"], icon: <Users className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-300 border-blue-500/30", code: "PLG" },
  { match: ["strategi", "domain", "profesional", "kurator"], icon: <Target className="h-3 w-3" />, color: "bg-orange-500/20 text-orange-300 border-orange-500/30", code: "STR" },
  { match: ["buku", "ebook", "panduan", "penerbitan", "penerbit"], icon: <BookText className="h-3 w-3" />, color: "bg-lime-500/20 text-lime-300 border-lime-500/30", code: "BKU" },
];

function getRoleMeta(role: string) {
  const lower = role.toLowerCase();
  for (const entry of ROLE_ICONS) {
    if (entry.match.some(m => lower.includes(m))) return entry;
  }
  return {
    icon: <Bot className="h-3 w-3" />,
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

// ─── Blueprint theme from tags ─────────────────────────────────────────────────

function getBlueprintTheme(tags?: string[]) {
  if (!tags) return { bg: "#0d0d14", header: "#0f0f1a", accent: "violet", label: "Trilogi" };
  if (tags.includes("studio-audio")) return { bg: "#0d0900", header: "#130e00", accent: "amber", label: "Studio Audio Mikro" };
  if (tags.includes("penerbit-mikro")) return { bg: "#031210", header: "#041a18", accent: "teal", label: "Penerbit Mikro" };
  if (tags.includes("komunitas-builder")) return { bg: "#0d0718", header: "#110a1f", accent: "violet", label: "Komunitas Builder" };
  if (tags.includes("pipeline-konten")) return { bg: "#100613", header: "#160819", accent: "rose", label: "Pipeline Konten" };
  if (tags.includes("domain-profesional")) return { bg: "#030c18", header: "#041020", accent: "blue", label: "Domain Profesional" };
  if (tags.includes("tim-rapat")) return { bg: "#031210", header: "#041a18", accent: "emerald", label: "Tim Rapat Hybrid" };
  if (tags.includes("umkm-stack")) return { bg: "#0d0a03", header: "#14100a", accent: "orange", label: "UMKM Stack" };
  if (tags.includes("tutor-sokratik")) return { bg: "#030918", header: "#04102a", accent: "blue", label: "Tutor Sokratik" };
  return { bg: "#0d0d14", header: "#0f0f1a", accent: "violet", label: "Tim Agen Trilogi" };
}

function accentClasses(accent: string) {
  const map: Record<string, { ring: string; border: string; text: string; btn: string; dot: string }> = {
    amber: { ring: "focus-visible:ring-amber-500/40", border: "border-amber-500/40", text: "text-amber-300", btn: "bg-amber-700 hover:bg-amber-600", dot: "bg-amber-400" },
    teal: { ring: "focus-visible:ring-teal-500/40", border: "border-teal-500/40", text: "text-teal-300", btn: "bg-teal-700 hover:bg-teal-600", dot: "bg-teal-400" },
    violet: { ring: "focus-visible:ring-violet-500/40", border: "border-violet-500/40", text: "text-violet-300", btn: "bg-violet-700 hover:bg-violet-600", dot: "bg-violet-400" },
    rose: { ring: "focus-visible:ring-rose-500/40", border: "border-rose-500/40", text: "text-rose-300", btn: "bg-rose-700 hover:bg-rose-600", dot: "bg-rose-400" },
    blue: { ring: "focus-visible:ring-blue-500/40", border: "border-blue-500/40", text: "text-blue-300", btn: "bg-blue-700 hover:bg-blue-600", dot: "bg-blue-400" },
    emerald: { ring: "focus-visible:ring-emerald-500/40", border: "border-emerald-500/40", text: "text-emerald-300", btn: "bg-emerald-700 hover:bg-emerald-600", dot: "bg-emerald-400" },
    orange: { ring: "focus-visible:ring-orange-500/40", border: "border-orange-500/40", text: "text-orange-300", btn: "bg-orange-700 hover:bg-orange-600", dot: "bg-orange-400" },
  };
  return map[accent] ?? map.violet;
}

// ─── Sub-Agent Panel ───────────────────────────────────────────────────────────

function SubAgentPanel({ agents, accent }: { agents: SubAgentStatus[]; accent: string }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  const cls = accentClasses(accent);

  return (
    <div className={`mt-2 rounded-lg border bg-white/5 text-xs overflow-hidden ${cls.border}`}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <Zap className={`h-3 w-3 shrink-0 ${cls.text}`} />
        <span className={`font-medium ${cls.text}`}>
          {running > 0 ? `${running} agen aktif…` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status === "done" ? "bg-green-400" :
              a.status === "running" ? `${cls.dot} animate-pulse` :
              a.status === "error" ? "bg-red-400" : "bg-white/20"
            }`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
      </button>
      {expanded && (
        <div className="border-t border-white/10 px-3 py-2 space-y-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            return (
              <div key={i} className="flex items-start gap-2">
                {statusIcon(a.status)}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}>
                  {meta.icon}
                  <span className="font-mono">{meta.code}</span>
                  <span className="text-white/40">·</span>
                  <span>{a.role}</span>
                </div>
                {a.elapsed && <span className="text-white/30 ml-auto">{(a.elapsed / 1000).toFixed(1)}s</span>}
                {a.preview && (
                  <span className="text-white/30 text-xs italic ml-1 truncate max-w-[180px]">{a.preview}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Message Renderer ──────────────────────────────────────────────────────────

function ChatMessage({ msg, agentName, accent }: { msg: Message; agentName: string; accent: string }) {
  const isUser = msg.role === "user";
  const cls = accentClasses(accent);
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(msg.content)
    : { fields: [], cleanContent: msg.content };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-white text-sm ${cls.btn.split(" ")[0]}/70`}
          style={{ background: "rgba(255,255,255,0.12)" }}>
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
              <span className="text-xs">Mengkoordinasikan {agentName}…</span>
            </span>
          ) : <MessageContent text={cleanContent || ""} className="text-sm text-white/90" />}
        </div>
        <BrainChip fields={brainFields} />
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} accent={accent} />
        )}
        {!msg.isStreaming && msg.content.trim().length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-white/30 px-1" data-testid="label-ai-transparency">
            <Bot className="h-2.5 w-2.5" />
            <span>Disiapkan oleh asisten AI — periksa hal penting sebelum dipakai</span>
          </div>
        )}
        {msg.orchestrationMs && !msg.isStreaming && (
          <div className="text-[10px] text-white/20 px-1">
            {(msg.orchestrationMs / 1000).toFixed(1)}s · OpenClaw L4 · MultiClaw ABD-7
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Blueprint icon helper ─────────────────────────────────────────────────────

function getBlueprintIcon(tags?: string[]) {
  if (!tags) return <Sparkles className="h-5 w-5" />;
  if (tags.includes("studio-audio")) return <Headphones className="h-5 w-5" />;
  if (tags.includes("penerbit-mikro")) return <BookText className="h-5 w-5" />;
  if (tags.includes("komunitas-builder")) return <Users className="h-5 w-5" />;
  if (tags.includes("pipeline-konten")) return <Mic className="h-5 w-5" />;
  if (tags.includes("tim-rapat")) return <MessageSquare className="h-5 w-5" />;
  return <Sparkles className="h-5 w-5" />;
}

// ─── Sample prompts per blueprint ─────────────────────────────────────────────

function getSamplePrompts(tags?: string[]) {
  if (!tags) return [];
  if (tags.includes("studio-audio")) return [
    { icon: "🎙️", text: "Bantu saya buat transkrip episode ini dan tandai momen terkuatnya." },
    { icon: "✂️", text: "Di mana titik cut terbaik untuk versi 30 menit dari episode 90 menit ini?" },
    { icon: "📝", text: "Siapkan shownotes lengkap dengan timestamp dan caption untuk semua platform." },
    { icon: "📱", text: "Rekomendasikan 3 klip terbaik untuk TikTok dan Instagram Reels dari episode ini." },
  ];
  if (tags.includes("penerbit-mikro")) return [
    { icon: "📚", text: "Saya macet di Bab 5 — bantu saya menemukan arah untuk melanjutkan." },
    { icon: "🗂️", text: "Indekskan catatan wawancara ini dan carikan data yang paling relevan untuk Bab 3." },
    { icon: "✏️", text: "Review Bab 7 ini — periksa inkonsistensi karakter dan masalah timeline." },
    { icon: "📦", text: "Siapkan brief kover dan panduan layout untuk buku non-fiksi ini." },
  ];
  if (tags.includes("komunitas-builder")) return [
    { icon: "👋", text: "Siapkan pesan sambutan personal untuk anggota baru yang baru saja bergabung." },
    { icon: "📊", text: "Destilasikan diskusi 3 hari terakhir — apa 5 tema utama yang perlu saya perhatikan?" },
    { icon: "❓", text: "Anggota banyak yang bertanya soal jadwal kelas — siapkan jawaban FAQ-nya." },
    { icon: "🚨", text: "Ada anggota yang sepertinya dalam kondisi berat — bagaimana saya merespons?" },
  ];
  if (tags.includes("pipeline-konten")) return [
    { icon: "🔍", text: "Risetkan 5 angle unik untuk konten tentang topik ini yang belum banyak dibahas." },
    { icon: "📝", text: "Ubah riset ini menjadi script YouTube yang compelling untuk durasi 10 menit." },
    { icon: "📅", text: "Buat kalender konten realistis untuk bulan depan berdasarkan 3 tema utama ini." },
    { icon: "✅", text: "Review draft ini — cek akurasi, brand voice, dan konsistensi pesan." },
  ];
  return [
    { icon: "🚀", text: "Mulai percakapan dengan tim agen Anda — apa yang ingin Anda kerjakan hari ini?" },
    { icon: "💡", text: "Jelaskan konteks proyek Anda dan saya koordinasikan agen yang tepat." },
    { icon: "🎯", text: "Apa tantangan terbesar yang ingin Anda selesaikan sekarang?" },
  ];
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TrilogiChat() {
  const params = useParams<{ orchestratorId: string }>();
  const orchestratorId = parseInt(params.orchestratorId ?? "0", 10);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendRef = useRef<(text: string) => void>(() => {});
  const voice = useVoiceMode((transcript) => { setInput(transcript); setTimeout(() => sendRef.current(transcript), 50); });

  const { data: agentConfig, isLoading } = useQuery<AgentConfig>({
    queryKey: ["/api/chat/config", orchestratorId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/config/${orchestratorId}`);
      if (!res.ok) throw new Error("Agent not found");
      return res.json();
    },
    enabled: !!orchestratorId,
    retry: 2,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const theme = getBlueprintTheme(agentConfig?.tags ?? []);
  const cls = accentClasses(theme.accent);
  const subAgentLinks = agentConfig?.agenticSubAgents ?? [];
  const samplePrompts = getSamplePrompts(agentConfig?.tags);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming || !orchestratorId) return;
    setInput("");
    setStreaming(true);

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true, subAgents: [] };
    setMessages(prev => [...prev, assistantMsg]);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const orchStart = Date.now();

    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: String(orchestratorId),
          role: "user",
          content: text,
          conversationHistory: history,
        }),
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
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((sa: any) => ({
                agentId: sa.agentId,
                role: sa.role,
                status: "waiting" as const,
              }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "sub_agent_start") {
              const s = subAgentMap.get(evt.agentId);
              if (s) { s.status = "running"; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "sub_agent_done") {
              const s = subAgentMap.get(evt.agentId);
              if (s) { s.status = "done"; s.elapsed = evt.elapsed; s.preview = evt.preview; subAgentMap.set(evt.agentId, { ...s }); }
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, content: fullContent, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "aggregating") {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
                return updated;
              });
            } else if (evt.type === "complete" && evt.message?.content) {
              fullContent = evt.message.content;
            }
          } catch {}
        }
      }

      const orchMs = Date.now() - orchStart;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, isStreaming: false, subAgents: Array.from(subAgentMap.values()), orchestrationMs: orchMs };
        }
        return updated;
      });
      voice.speak(fullContent);
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: "Maaf, terjadi kesalahan. Silakan coba lagi.", isStreaming: false };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }
  sendRef.current = sendMessage;

  const ready = !isLoading && !!orchestratorId;
  const agentName = agentConfig?.name ?? "Tim Agen Trilogi";
  const specCount = subAgentLinks.length;

  return (
    <div className="flex flex-col h-screen text-white" style={{ background: theme.bg }}>

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 backdrop-blur"
        style={{ background: theme.header + "cc" }}>
        <Link href="/tutor-builder">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${cls.border}`}
          style={{ background: "rgba(255,255,255,0.08)" }}>
          {getBlueprintIcon(agentConfig?.tags)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{agentName}</div>
          <div className={`text-xs flex items-center gap-1 ${cls.text}`} style={{ opacity: 0.7 }}>
            <Zap className="h-2.5 w-2.5" />
            <span>{specCount} Agen Spesialis · OpenClaw L4 · ABD v1.1 · Rakit Tim Agen Trilogi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs hidden sm:flex ${cls.border} ${cls.text}`}>
            {theme.label}
          </Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            ABD v1.1
          </Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className={`w-2 h-2 rounded-full animate-pulse ${cls.dot}`} />}
        </div>
      </div>

      {/* Agent legend strip */}
      {subAgentLinks.length > 0 && (
        <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto"
          style={{ background: theme.header + "99" }}>
          <span className="text-xs text-white/30 shrink-0 mr-1">{specCount} Agen:</span>
          {subAgentLinks.map(sa => {
            const meta = getRoleMeta(sa.role);
            return (
              <div key={sa.agentId} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
                {meta.icon}
                <span className="font-mono text-[10px]">{meta.code}</span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="hidden sm:inline text-[11px]">{sa.role}</span>
              </div>
            );
          })}
          <span className="text-xs text-white/20 ml-2 shrink-0 hidden lg:inline">
            MultiClaw Orchestration · Paralel Dispatch · State Machine v2.0
          </span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              {getBlueprintIcon(agentConfig?.tags)}
            </div>
            <div>
              <div className={`font-semibold text-xl mb-2 ${cls.text}`}>
                {agentName}
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                {specCount > 0 ? (
                  <>
                    <span className={cls.text}>{specCount} agen spesialis</span> siap bekerja paralel untuk Anda.
                    Saat Anda mengirim pesan, orchestrator akan mendispatc agen yang paling relevan secara otomatis.
                  </>
                ) : agentConfig?.tagline ?? "Tim agen Trilogi siap membantu Anda berkarya."}
              </div>
              {specCount > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {subAgentLinks.slice(0, 6).map(sa => {
                    const meta = getRoleMeta(sa.role);
                    return (
                      <span key={sa.agentId} className={`px-2 py-0.5 rounded border text-xs ${meta.color}`}>
                        {sa.role}
                      </span>
                    );
                  })}
                  {subAgentLinks.length > 6 && (
                    <span className="px-2 py-0.5 rounded border border-white/10 text-xs text-white/30">
                      +{subAgentLinks.length - 6} lagi
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sample prompts */}
            {samplePrompts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text)}
                    disabled={!ready || streaming}
                    className={`text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 transition-all disabled:opacity-40 text-white/70 hover:border-white/20 hover:bg-white/8`}
                    data-testid={`prompt-${i}`}
                  >
                    <span className="mr-1">{p.icon}</span>
                    {p.text}
                  </button>
                ))}
              </div>
            )}

            <div className="text-xs text-white/25 max-w-md text-center">
              ABD-7: Confidence Score · [ASUMSI:] eksplisit · Gap analisis · Next Step · Referensi · Risiko · Alternatif · Eskalasi
            </div>

            {!ready && !isLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                Orchestrator tidak ditemukan. Pastikan ID tim valid.
              </div>
            )}
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} agentName={agentName} accent={theme.accent} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3" style={{ background: theme.header + "cc" }}>
        {voice.isListening && (
          <div className="flex items-center gap-2 mb-2 max-w-3xl mx-auto px-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs text-red-400 font-medium">Mendengarkan… bicara sekarang</span>
          </div>
        )}
        {voice.aiSpeaking && (
          <div className="flex items-center gap-2 mb-2 max-w-3xl mx-auto px-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-green-400 font-medium">AI sedang berbicara…</span>
          </div>
        )}
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={
              voice.isListening ? "Mendengarkan suara Anda…" :
              ready
                ? `Kirim pesan ke ${agentName}…`
                : "Menghubungkan ke orchestrator…"
            }
            disabled={!ready || streaming || voice.isListening}
            className={`flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm h-10 ${cls.ring}`}
            data-testid="input-message"
          />
          {voice.speechSupported && (
            <Button
              type="button"
              variant="outline"
              onClick={voice.togglePhoneMode}
              disabled={!ready}
              className={`h-10 w-10 p-0 shrink-0 border-white/20 ${voice.phoneMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "text-white/50"}`}
              title={voice.phoneMode ? "Matikan Mode Telpon" : "Mode Telpon"}
              data-testid="button-phone-mode"
            >
              {voice.phoneMode ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            </Button>
          )}
          {voice.speechSupported && (
            <Button
              type="button"
              variant="outline"
              onClick={voice.toggleMic}
              disabled={!ready}
              className={`h-10 w-10 p-0 shrink-0 border-white/20 ${voice.isListening ? "bg-red-500/20 text-red-400 border-red-500/40" : "text-white/50"}`}
              title={voice.isListening ? "Berhenti mendengarkan" : "Rekam suara"}
              data-testid="button-mic"
            >
              {voice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button
            onClick={() => sendMessage(input)}
            disabled={!ready || streaming || !input.trim()}
            className={`text-white h-10 px-4 shrink-0 ${cls.btn}`}
            data-testid="button-send"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-center mt-2 text-xs text-white/20">
          {agentName} · {specCount} Agen Spesialis · OpenClaw L4 · POLA KERJA v2.0 · Rakit Tim Agen Trilogi
        </div>
      </div>

    </div>
  );
}
