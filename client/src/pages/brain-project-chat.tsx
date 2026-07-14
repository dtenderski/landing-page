import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  HardHat, ClipboardList, ShieldCheck, Brain, ChevronDown, ChevronUp,
  BarChart2, FileSearch, Leaf, Scale, Building2, Target,
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

// ─── Agent Metadata ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "BRAIN-PROXIMA": {
    icon: <Building2 className="h-3 w-3" />,
    label: "PROXIMA",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    code: "BR-PROX",
  },
  "BRAIN-EVM": {
    icon: <BarChart2 className="h-3 w-3" />,
    label: "EVM",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "BR-EVM",
  },
  "BRAIN-MUTU": {
    icon: <FileSearch className="h-3 w-3" />,
    label: "MUTU",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    code: "BR-MUT",
  },
  "BRAIN-SAFIRA": {
    icon: <ShieldCheck className="h-3 w-3" />,
    label: "SAFIRA",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    code: "BR-SAF",
  },
  "BRAIN-ENVIRA": {
    icon: <Leaf className="h-3 w-3" />,
    label: "ENVIRA",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    code: "BR-ENV",
  },
  "BRAIN-KONTRAK": {
    icon: <Scale className="h-3 w-3" />,
    label: "KONTRAK",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    code: "BR-KON",
  },
};

const AGENT_LEGEND = [
  "BRAIN-PROXIMA", "BRAIN-EVM", "BRAIN-MUTU",
  "BRAIN-SAFIRA", "BRAIN-ENVIRA", "BRAIN-KONTRAK",
];

function getRoleMeta(role: string) {
  for (const key of Object.keys(ROLE_META)) {
    if (role.includes(key)) return ROLE_META[key];
  }
  return { icon: <Brain className="h-3 w-3" />, label: role, color: "bg-white/10 text-white/60 border-white/20", code: "BR" };
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
    <div className="mt-2 rounded-lg border border-indigo-800/40 bg-indigo-950/40 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <Brain className="h-3 w-3 text-indigo-400 shrink-0" />
        <span className="text-indigo-300 font-medium">
          {running > 0 ? `${running} spesialis aktif…` : `${done}/${agents.length} spesialis selesai`}
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
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700/40 flex items-center justify-center text-base shrink-0 mt-0.5">
        🧠
      </div>
      <div className="flex-1 min-w-0">
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} />
        )}
        <div className="mt-2" style={{ wordBreak: "break-word" }}>
          {msg.isStreaming && !msg.content
            ? <span className="animate-pulse text-white/60">▋</span>
            : <MessageContent text={cleanContent} className="text-sm text-white/90 leading-relaxed" />}
        </div>
        <BrainChip fields={brainFields} />
        {!isUser && msg.orchestrationMs && msg.subAgents && msg.subAgents.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/30 px-1 mt-1">
            <Zap className="h-2.5 w-2.5" />
            <span>
              {msg.subAgents.length} spesialis paralel · {(msg.orchestrationMs / 1000).toFixed(1)}s
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
    icon: "📋",
    text: "Review LHP proyek gedung 5 lantai Bekasi: deviasi kurva-S −7%, beton kolom L3 = 24 MPa (target fc'=30), hujan 4 hari, near miss harness, VO kumulatif 8%",
  },
  {
    icon: "📊",
    text: "Hitung EVM: BAC Rp 28 M | PV Rp 10,92 M | EV Rp 8,96 M | AC Rp 10,2 M. Proyeksikan EAC dan berikan rekomendasi corrective action",
  },
  {
    icon: "⛑️",
    text: "Near miss: pekerja hampir jatuh dari scaffold L4, harness terlepas dari anchor. Ini ke-2 kalinya. Buat investigasi 5-Why + Bowtie + CAPA",
  },
  {
    icon: "🔍",
    text: "Uji beton 3 silinder: 22, 24, 26 MPa (target fc'=30 MPa), volume 12 m³. Apa status NCR dan langkah selanjutnya?",
  },
  {
    icon: "📜",
    text: "Cuaca ekstrem 4 hari (2026-05-04 s/d 07). Kontrak FIDIC Red Book 1999. Draft surat klaim EOT lengkap + TIA",
  },
  {
    icon: "🌿",
    text: "Ditemukan 12 drum oli bekas di stockyard 60 hari tanpa manifest B3. Apa pelanggaran regulasi dan langkah penanganan?",
  },
];

// ─── KPI Legend ───────────────────────────────────────────────────────────────

const KPI_LEGEND = [
  { icon: "🟢", label: "CPI/SPI ≥ 0,95" },
  { icon: "🟡", label: "Watch 0,85–0,95" },
  { icon: "🔴", label: "Alert < 0,85" },
  { icon: "🚨", label: "Kritis (LTI/Fatal)" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BrainProjectChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    id: number;
    name: string;
    tagline?: string;
    avatar?: string;
  }>({
    queryKey: ["/api/brain-project/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/brain-project/orchestrator");
      if (!res.ok) throw new Error("Brain Project agent not found");
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
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history }),
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
              // MultiClaw L4 events — acknowledged, no specific UI update for brain-project
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
      inputRef.current?.focus();
    }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0b14] text-white">

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0d0e1e]/80 backdrop-blur">
        <Link href="/tender-monitor">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-lg">
          🧠
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{agentData?.name ?? "BRAIN-ORCHESTRATOR"}</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-indigo-400" />
            <span>6 Spesialis Paralel · OpenClaw · ABD-7 · Early Warning · Sitasi Regulasi Wajib</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tender-ai">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-900/30 hidden sm:flex gap-1"
              data-testid="button-nav-tender-ai"
            >
              <Target className="h-3 w-3" />
              TENDERA AI
            </Button>
          </Link>
          <Badge variant="outline" className="text-xs border-indigo-500/40 text-indigo-300 hidden sm:flex">
            Brain Project v2
          </Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            ABD v1.1
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* 6-Agent legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#0b0c1a]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">6 Spesialis:</span>
        {AGENT_LEGEND.map(role => {
          const meta = getRoleMeta(role);
          return (
            <div key={role} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
              {meta.icon}
              <span className="font-mono text-[10px]">{meta.code}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{meta.label}</span>
            </div>
          );
        })}
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">ABD-7 · Early Warning · Confidence Score</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🧠</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Brain Project — Pendamping Proyek Konstruksi
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                6 spesialis bekerja paralel: <span className="text-blue-300">PROXIMA</span> (PM lapangan) ·{" "}
                <span className="text-emerald-300">EVM</span> (biaya/jadwal) ·{" "}
                <span className="text-sky-300">MUTU</span> (NCR/ITP) ·{" "}
                <span className="text-amber-300">SAFIRA</span> (K3) ·{" "}
                <span className="text-green-300">ENVIRA</span> (lingkungan) ·{" "}
                <span className="text-violet-300">KONTRAK</span> (FIDIC/EOT/VO)
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Output selalu ABD-7: Ringkasan · Asumsi · Analisis Q-C-T+K3-S · Early Warning · Rekomendasi H/M/L · Confidence%
              </div>
            </div>

            {/* KPI Legend */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {KPI_LEGEND.map(c => (
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

            {/* Deliverables hint */}
            <div className="text-xs text-white/25 max-w-md text-center">
              26 deliverables tersedia: D-01 Review LHP · D-06 Laporan EVM · D-15 Investigasi Insiden · D-20 Klaim EOT · D-23 BA PHO/FHO
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                Brain Project agent belum diinisialisasi. Restart server diperlukan.
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
      <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-[#0d0e1e]/80">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={
              ready
                ? "Ceritakan kondisi proyek — LHP, NCR, insiden K3, EVM, klaim EOT, limbah B3…"
                : "Menghubungkan ke Brain Project…"
            }
            disabled={!ready || streaming}
            className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-indigo-500/40 text-sm h-10"
            data-testid="input-message"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!ready || streaming || !input.trim()}
            className="bg-indigo-700 hover:bg-indigo-600 text-white h-10 px-4 shrink-0"
            data-testid="button-send"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-center mt-2 text-xs text-white/20">
          Brain Project v2 · PROXIMA · EVM · MUTU · SAFIRA · ENVIRA · KONTRAK · ABD-7 · FIDIC · PP 50/2012 SMK3 · Permen PUPR 8/2023
        </div>
      </div>

    </div>
  );
}
