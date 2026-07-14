import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { MessageContent } from "@/lib/format-message";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, Map as MapIcon, FileText, Shield,
  DollarSign, ClipboardList, Search, Globe, Scale, Lock, Star, Database,
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
  dataMasterInjected?: boolean;
  attachments?: ChatAttachment[];
}

// ─── Agent Metadata ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "MAPPER": {
    icon: <MapIcon className="h-3 w-3" />,
    label: "Mapping",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    code: "MAP",
  },
  "QUALIFY": {
    icon: <Star className="h-3 w-3" />,
    label: "Kualifikasi",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    code: "QLFY",
  },
  "DOCS": {
    icon: <FileText className="h-3 w-3" />,
    label: "Dokumen",
    color: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    code: "DOCS",
  },
  "SKKMATCH": {
    icon: <Search className="h-3 w-3" />,
    label: "SKK Match",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "SKK",
  },
  "LETTERGEN": {
    icon: <ClipboardList className="h-3 w-3" />,
    label: "Surat",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    code: "LTR",
  },
  "COST": {
    icon: <DollarSign className="h-3 w-3" />,
    label: "Biaya",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    code: "COST",
  },
  "ASSESS": {
    icon: <Shield className="h-3 w-3" />,
    label: "Asesmen",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    code: "ASMT",
  },
  "OSS": {
    icon: <Globe className="h-3 w-3" />,
    label: "OSS-RBA",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    code: "OSS",
  },
  "COMPLY": {
    icon: <Scale className="h-3 w-3" />,
    label: "Regulasi",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    code: "REG",
  },
  "INTEGRITY": {
    icon: <Lock className="h-3 w-3" />,
    label: "Integritas",
    color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    code: "INT",
  },
};

const AGENT_LEGEND = [
  "MAPPER", "QUALIFY", "DOCS", "SKKMATCH", "LETTERGEN",
  "COST", "ASSESS", "OSS", "COMPLY", "INTEGRITY",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
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

// ─── Sub-Agent Panel ──────────────────────────────────────────────────────────

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;

  return (
    <div className="mt-2 rounded-lg border border-amber-800/40 bg-amber-950/30 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <BookOpen className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-amber-300 font-medium">
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
        <div className="border-t border-amber-800/30 px-3 py-2 space-y-1.5">
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-amber-700/70 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 group">
      <div className="max-w-[90%] space-y-1">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/8 border border-white/10 text-sm text-white/90 leading-relaxed">
          {msg.isStreaming && !msg.content ? (
            <span className="inline-flex items-center gap-1.5 text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Mengkoordinasikan 10 agen SBUClaw…</span>
            </span>
          ) : <MessageContent text={cleanContent || ""} className="text-sm text-white/90" />}
        </div>
        <AiTransparencyLabel msg={msg} />
        <BrainChip fields={brainFields} />
        {msg.dataMasterInjected && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 px-1 mt-0.5">
            <Database className="h-2.5 w-2.5" />
            <span>Data Nyata BUJK &amp; Harga Material digunakan</span>
          </div>
        )}
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} />
        )}
        {msg.orchestrationMs && !msg.isStreaming && (
          <div className="text-[10px] text-white/20 px-1">
            {(msg.orchestrationMs / 1000).toFixed(1)}s · OpenClaw L4
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sample Prompts ───────────────────────────────────────────────────────────

const SAMPLE_PROMPTS = [
  { icon: "🆕", text: "Saya mau buat SBU untuk pertama kali. Mulai dari mana?" },
  { icon: "🛣️", text: "Perusahaan kami mengerjakan jalan dan jembatan. Subklasifikasi SBU apa yang cocok?" },
  { icon: "📈", text: "Kami kualifikasi K, mau naik ke M1. Apa gap yang harus kami tutup?" },
  { icon: "💰", text: "Berapa estimasi biaya dan waktu buat SBU kualifikasi M2, 2 subklasifikasi?" },
  { icon: "📄", text: "Dokumen apa yang perlu disiapkan untuk perpanjangan SBU B1?" },
  { icon: "🌐", text: "Panduan step-by-step daftar SBU di portal LPJK dan OSS-RBA." },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SbuClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    id: number;
    name: string;
    tagline?: string;
  }>({
    queryKey: ["/api/sbuclaw/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/sbuclaw/orchestrator");
      if (!res.ok) throw new Error("SBUClaw Orchestrator not found");
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
            } else if (evt.type === "router_decision") {
              // Router selected subset of agents — update display to fade out non-selected
              const selectedIds: Set<number> = new Set(evt.selected ?? []);
              subAgentMap.forEach((s, id) => {
                if (selectedIds.size > 0 && !selectedIds.has(id)) {
                  subAgentMap.set(id, { ...s, status: "waiting" });
                }
              });
            } else if (evt.type === "data_master_injected") {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, dataMasterInjected: true };
                return updated;
              });
            } else if (evt.type === "critic_result") {
              // Critic gate result — no specific display update needed for SBUClaw
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
    <div className="flex flex-col h-screen bg-[#0c0800] text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#130e00]/80 backdrop-blur">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-amber-900/60 border border-amber-600/40 flex items-center justify-center text-lg">
          🏗️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{agentData?.name ?? "SBUClaw — Agentic AI SBU Konstruksi"}</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-amber-400" />
            <span>10 Agen Spesialis · Permen PU 6/2025 · OpenClaw L4 ABD-7</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-300 hidden sm:flex">
            SBUClaw v1
          </Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            ABD v1.1
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 10-Agent legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#0f0a00]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">10 Agen:</span>
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
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">Permen PU 6/2025 · BS·BG·IL·IM·KO · OSS-RBA + LPJK</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏗️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                SBUClaw — Agentic AI Pembuatan SBU Konstruksi
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                10 agen spesialis bekerja paralel untuk pembuatan SBU Pekerjaan Konstruksi end-to-end:{" "}
                <span className="text-amber-300">Mapping</span> (subklas BS·BG·IL·IM·KO) ·{" "}
                <span className="text-yellow-300">Kualifikasi</span> (K/M/B gap) ·{" "}
                <span className="text-lime-300">Dokumen</span> (A–F checklist) ·{" "}
                <span className="text-emerald-300">SKK Match</span> ·{" "}
                <span className="text-teal-300">Surat</span> (5 jenis) ·{" "}
                <span className="text-cyan-300">Biaya</span> (LSBU estimate) ·{" "}
                <span className="text-blue-300">Asesmen</span> (8 dimensi) ·{" "}
                <span className="text-violet-300">OSS</span> (RBA+LPJK) ·{" "}
                <span className="text-purple-300">Regulasi</span> ·{" "}
                <span className="text-rose-300">Integritas</span>
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Regulasi: <span className="text-amber-400">Permen PU No. 6 Tahun 2025</span> (acuan utama) · ABD v1.1 · OpenClaw L4
              </div>
            </div>

            {/* Mode chips */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                { icon: "🗺️", label: "Smart Mapping" },
                { icon: "📊", label: "Gap Kualifikasi" },
                { icon: "📄", label: "Checklist Dokumen" },
                { icon: "🎓", label: "SKK Personel" },
                { icon: "✉️", label: "Draft Surat" },
                { icon: "💰", label: "Estimasi Biaya" },
                { icon: "🧪", label: "Asesmen 8 Dimensi" },
                { icon: "🌐", label: "OSS-RBA & LPJK" },
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
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-amber-500/40 hover:bg-amber-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>

            <div className="text-xs text-white/25 max-w-md text-center">
              Output ABD-7: Confidence Score · [ASUMSI:] eksplisit · Gap/Ketidakpastian · Next Step · Referensi Regulasi · Risiko · Alternatif · Eskalasi
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                SBUClaw Orchestrator belum diinisialisasi. Pastikan seed script sudah dijalankan.
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
