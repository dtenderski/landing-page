import { useState, useRef, useEffect } from "react";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { MessageContent } from "@/lib/format-message";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  FileSearch,
  FileCheck,
  BarChart3,
  Target,
  ChevronRight,
  Database,
  ArrowLeft,
  Shield,
  Banknote,
  HardHat,
  Scale,
  ScrollText,
  FileText,
  Brain,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, MessageActions, AttachmentRow, ChatAttachment } from "@/components/chat-input-bar";

interface SubAgentStatus {
  agentId: number;
  role: string;
  status: "waiting" | "running" | "done" | "error";
  elapsed?: number;
  preview?: string;
}

interface SirupFetch {
  count: number;
  total: number;
  keyword: string;
  kualifikasi: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  subAgents?: SubAgentStatus[];
  sirupFetch?: SirupFetch;
  orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  "AGENT-SCOUT": {
    icon: <FileSearch className="h-3 w-3" />,
    label: "Scout",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  "AGENT-ELIGIBILITY": {
    icon: <FileCheck className="h-3 w-3" />,
    label: "Eligibility",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  "AGENT-RISKSCAN": {
    icon: <Shield className="h-3 w-3" />,
    label: "Risk Scan",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  "AGENT-ADMIN": {
    icon: <FileText className="h-3 w-3" />,
    label: "Admin Docs",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  "AGENT-TEKNIS": {
    icon: <HardHat className="h-3 w-3" />,
    label: "Teknis",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  "AGENT-HPS": {
    icon: <Banknote className="h-3 w-3" />,
    label: "HPS & Bid",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  "AGENT-KONTRAK": {
    icon: <ScrollText className="h-3 w-3" />,
    label: "Kontrak",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  "AGENT-WINPROB": {
    icon: <BarChart3 className="h-3 w-3" />,
    label: "Win Prob",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  "AGENT-INTEGRITY": {
    icon: <Scale className="h-3 w-3" />,
    label: "Integrity",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  },
  "AGENT-SANGGAH": {
    icon: <Target className="h-3 w-3" />,
    label: "Sanggah",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  },
  "AGENT-FINDER": {
    icon: <FileSearch className="h-3 w-3" />,
    label: "Finder",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  "AGENT-DOKUMEN": {
    icon: <FileCheck className="h-3 w-3" />,
    label: "Dokumen",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  "AGENT-SCORER": {
    icon: <BarChart3 className="h-3 w-3" />,
    label: "Scorer",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  "AGENT-STRATEGI": {
    icon: <Target className="h-3 w-3" />,
    label: "Strategi",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
};

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? {
    icon: <Bot className="h-3 w-3" />,
    label: role.replace("AGENT-", ""),
    color: "bg-white/5 text-white/60 border-white/10",
  };
}

const AGENT_LEGEND = [
  "AGENT-SCOUT",
  "AGENT-ELIGIBILITY",
  "AGENT-RISKSCAN",
  "AGENT-ADMIN",
  "AGENT-TEKNIS",
  "AGENT-HPS",
  "AGENT-KONTRAK",
  "AGENT-WINPROB",
  "AGENT-INTEGRITY",
  "AGENT-SANGGAH",
];

const SAMPLE_PROMPTS = [
  "🔭 Carikan peluang tender gedung Rp 5–25 M di Jabodetabek bulan ini",
  "✅ Cek apakah BUJK Menengah BG009 layak ikut tender Rp 18 M",
  "📊 Hitung Win Probability paket gedung kantor HPS Rp 24 M untuk BUJK M1",
  "🛡️ Scan risiko klausul: retensi 10% + denda 1‰/hari pada kontrak lump sum",
  "💰 Susun bid price 3 skenario untuk paket Rp 15 M durasi 240 hari",
  "⚖️ Bantu susun sanggah — kami digugurkan di evaluasi administrasi",
];

function SubAgentPanel({
  agents,
  sirupFetch,
}: {
  agents: SubAgentStatus[];
  sirupFetch?: SirupFetch;
}) {
  if (agents.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 mb-3 space-y-2">
      {sirupFetch && (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 rounded px-2 py-1.5 border border-amber-500/20">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span>
            SIRUP LKPP real-time:{" "}
            <strong>{sirupFetch.count}</strong> paket ditemukan
            {sirupFetch.keyword ? ` · keyword "${sirupFetch.keyword}"` : ""}
            {sirupFetch.kualifikasi ? ` · kualifikasi ${sirupFetch.kualifikasi}` : ""}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {agents.map((agent) => {
          const meta = getRoleMeta(agent.role);
          return (
            <div
              key={agent.agentId}
              className={`flex items-center gap-1.5 rounded px-2 py-1.5 border text-xs ${meta.color}`}
            >
              {agent.status === "running" ? (
                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
              ) : agent.status === "done" ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : agent.status === "error" ? (
                <AlertCircle className="h-3 w-3 shrink-0" />
              ) : (
                <Clock className="h-3 w-3 shrink-0 opacity-50" />
              )}
              <span className="font-medium truncate">{meta.label}</span>
              {agent.elapsed && (
                <span className="ml-auto opacity-60 shrink-0">
                  {(agent.elapsed / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(msg.content)
    : { fields: [], cleanContent: msg.content };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-sm">
          🎯
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isUser && (msg.subAgents?.length ?? 0) > 0 && (
          <SubAgentPanel agents={msg.subAgents!} sirupFetch={msg.sirupFetch} />
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-900/30 text-blue-100 border border-blue-700/40 whitespace-pre-wrap"
              : "bg-white/5 text-white/90 border border-white/10"
          }`}
        >
          {isUser
            ? (cleanContent || "")
            : (msg.isStreaming && !cleanContent ? <span className="animate-pulse">▋</span> : <MessageContent text={cleanContent || ""} className="text-sm text-white/90" />)}
        </div>
        {!isUser && <BrainChip fields={brainFields} />}
        {!isUser && msg.orchestrationMs && (
          <div className="flex items-center gap-1 text-xs text-white/30 px-1">
            <Zap className="h-2.5 w-2.5" />
            <span>
              {msg.subAgents?.length ?? 0} agen paralel ·{" "}
              {(msg.orchestrationMs / 1000).toFixed(1)}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const BUJK_STORAGE_KEY = "gustafta_bujk_profile_v1";

function loadBujkProfile(): string | null {
  try {
    const stored = localStorage.getItem(BUJK_STORAGE_KEY);
    if (!stored) return null;
    const p = JSON.parse(stored);
    if (!p.nama) return null;
    const lines: string[] = [
      `[PROFIL BUJK OTOMATIS]`,
      `Nama: ${p.nama}`,
      p.npwp ? `NPWP: ${p.npwp}` : "",
      p.kualifikasi ? `Kualifikasi: ${p.kualifikasi}` : "",
      p.sbu?.length ? `SBU: ${p.sbu.join(", ")}` : "",
      p.lokasi ? `Domisili: ${p.lokasi}` : "",
      p.modal_disetor ? `Modal Disetor: Rp ${p.modal_disetor}` : "",
      p.kmk ? `KMK: Rp ${p.kmk}` : "",
      p.skk_personel?.length
        ? `SKK Personel: ${p.skk_personel.map((s: any) => `${s.nama} (${s.jabatan}, ${s.jenjang})`).join("; ")}`
        : "",
      p.pengalaman?.length
        ? `Pengalaman: ${p.pengalaman.map((e: any) => `${e.nama_paket} (${e.tahun}, Rp ${e.nilai})`).join("; ")}`
        : "",
    ].filter(Boolean);
    return lines.join("\n");
  } catch {
    return null;
  }
}

export default function TenderAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [bujkProfile, setBujkProfile] = useState<string | null>(null);
  const [profileInjected, setProfileInjected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBujkProfile(loadBujkProfile());
  }, []);

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    id: number;
    name: string;
    tagline?: string;
    avatar?: string;
  }>({
    queryKey: ["/api/tender-ai/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/tender-ai/orchestrator");
      if (!res.ok) throw new Error("Agent not found");
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
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      isStreaming: true,
      subAgents: [],
    };
    setMessages((prev) => [...prev, assistantMsg]);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const orchStart = Date.now();

    // Prepend BUJK profile to the very first message only
    let contentToSend = text;
    if (bujkProfile && !profileInjected && messages.length === 0) {
      contentToSend = `${bujkProfile}\n\n---\n\n${text}`;
      setProfileInjected(true);
    }

    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: String(agentId),
          role: "user",
          content: contentToSend,
          conversationHistory: history,
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      const subAgentMap: Map<number, SubAgentStatus> = new Map();
      let sirupFetch: SirupFetch | undefined;

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
            if (evt.type === "sirup_fetched") {
              sirupFetch = {
                count: evt.count,
                total: evt.total,
                keyword: evt.keyword,
                kualifikasi: evt.kualifikasi,
              };
            } else if (evt.type === "orchestrating_start") {
              const subs: SubAgentStatus[] = (evt.subAgents ?? []).map((s: any) => ({
                agentId: s.agentId,
                role: s.role,
                status: "waiting",
              }));
              subs.forEach((s) => subAgentMap.set(s.agentId, s));
            } else if (evt.type === "router_decision" || evt.type === "critic_result") {
              // MultiClaw L4 events — acknowledged
            } else if (evt.type === "sub_agent_start") {
              const s = subAgentMap.get(evt.agentId);
              if (s) s.status = "running";
            } else if (evt.type === "sub_agent_done") {
              const s = subAgentMap.get(evt.agentId);
              if (s) {
                s.status = "done";
                s.elapsed = evt.elapsed;
                s.preview = evt.preview;
              }
            } else if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
            } else if (evt.type === "aggregating") {
              // Sub-agents selesai, orchestrator mulai menyintesis
            } else if (evt.type === "done") {
              fullContent = evt.fullContent ?? fullContent;
            } else if (evt.type === "complete") {
              if (evt.message?.content) fullContent = evt.message.content;
            }
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: fullContent,
                  isStreaming: true,
                  subAgents: Array.from(subAgentMap.values()),
                  sirupFetch,
                };
              }
              return updated;
            });
          } catch {}
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: fullContent,
            isStreaming: false,
            subAgents: Array.from(subAgentMap.values()),
            sirupFetch,
            orchestrationMs:
              subAgentMap.size > 0 ? Date.now() - orchStart : undefined,
          };
        }
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
      // input focus handled by ChatInputBar
    }
  }

  const ready = !agentLoading && agentId !== null;
  const isTendera = agentData?.name?.includes("TENDERA");

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0d1328]/80 backdrop-blur">
        <Link href="/tender-monitor">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/60 hover:text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-blue-900/50 border border-blue-600/40 flex items-center justify-center text-lg">
          🎯
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {agentData?.name ?? "TENDERA-ORCHESTRATOR"}
          </div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-blue-400" />
            <span>
              {isTendera
                ? "10 agen MultiClaw · OpenClaw Engine · SIRUP LKPP real-time"
                : "4 sub-agen paralel · SIRUP LKPP real-time"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/brain-project">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/30 hidden sm:flex gap-1"
              data-testid="button-nav-brain-project"
            >
              <Brain className="h-3 w-3" />
              Brain Project
            </Button>
          </Link>
          <Badge
            variant="outline"
            className="text-xs border-blue-500/40 text-blue-300 hidden sm:flex"
          >
            TENDERA v1.0
          </Badge>
          <Badge
            variant="outline"
            className="text-xs border-white/20 text-white/50"
          >
            ABD v1.1
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && (
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* BUJK Profile banner */}
      {bujkProfile && (
        <div className="shrink-0 border-b border-emerald-700/30 bg-emerald-900/20 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300 flex-1 min-w-0 truncate">
            Profil BUJK aktif — akan otomatis disertakan di pesan pertama Anda
          </span>
          <Link href="/bujk-profile">
            <button className="text-xs text-emerald-400/70 hover:text-emerald-300 transition-colors shrink-0">
              Edit
            </button>
          </Link>
        </div>
      )}
      {!bujkProfile && (
        <div className="shrink-0 border-b border-yellow-700/20 bg-yellow-900/10 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500/60 shrink-0" />
          <span className="text-xs text-yellow-300/70 flex-1 min-w-0">
            Isi Profil BUJK sekali agar analisis eligibility lebih akurat
          </span>
          <Link href="/bujk-profile">
            <button className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors shrink-0">
              Isi Sekarang →
            </button>
          </Link>
        </div>
      )}

      {/* Agent legend strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#0b1020]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">10 Agen:</span>
        {AGENT_LEGEND.map((role) => {
          const meta = getRoleMeta(role);
          return (
            <div
              key={role}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border shrink-0 ${meta.color}`}
            >
              {meta.icon}
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 text-center px-4">
            <div className="text-5xl">🎯</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-blue-300 to-sky-300 bg-clip-text text-transparent">
                TENDERA — AI Tender BUJK
              </div>
              <div className="text-sm text-white/50 max-w-md">
                OpenClaw + MultiClaw: 10 agen spesialis bekerja paralel — dari scouting peluang, eligibility SBU/SKK, scan risiko klausul, hingga Win Probability 7-dimensi dan draft sanggah.
              </div>
            </div>

            {/* Win Probability legend */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                { emoji: "🟢", label: "80–100 STRONG BID" },
                { emoji: "🟡", label: "60–79 CONDITIONAL" },
                { emoji: "🟠", label: "40–59 LONG-SHOT" },
                { emoji: "🔴", label: "0–39 NO-BID" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/60"
                >
                  {c.emoji} {c.label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={!ready}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all text-white/70 hover:text-white disabled:opacity-40"
                  data-testid={`prompt-${p.slice(2, 22)}`}
                >
                  {p}
                </button>
              ))}
            </div>

            {!ready && agentLoading && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Menginisialisasi 10 agen TENDERA...</span>
              </div>
            )}
            {!ready && !agentLoading && !agentId && (
              <Card className="border-red-500/30 bg-red-500/10 max-w-sm w-full">
                <CardContent className="pt-4 text-sm text-red-300 text-center">
                  <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                  Agen AI belum diinisialisasi. Coba refresh halaman.
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {streaming &&
              messages[messages.length - 1]?.role === "assistant" &&
              messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-sm shrink-0">
                    🎯
                  </div>
                  <div className="flex items-center gap-1 text-white/40 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mendispatch agen MultiClaw paralel...</span>
                  </div>
                </div>
              )}
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
