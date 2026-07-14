import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, Shield, FileText, Users,
  Award, Briefcase, GraduationCap, ClipboardList,
} from "lucide-react";
import { Link } from "wouter";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { ChatInputBar, MessageActions, AttachmentRow, ChatAttachment } from "@/components/chat-input-bar";

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

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; code: string }> = {
  "REGULASI": {
    icon: <BookOpen className="h-3 w-3" />,
    label: "Regulasi",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    code: "REG",
  },
  "METODOLOGI": {
    icon: <ClipboardList className="h-3 w-3" />,
    label: "Metodologi",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    code: "MET",
  },
  "MUK": {
    icon: <FileText className="h-3 w-3" />,
    label: "MUK & FR",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    code: "MUK",
  },
  "ETIKA": {
    icon: <Shield className="h-3 w-3" />,
    label: "Etika & RCC",
    color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    code: "ETIK",
  },
  "KARIER": {
    icon: <Briefcase className="h-3 w-3" />,
    label: "Karier",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    code: "KAR",
  },
  "PORTOFOLIO": {
    icon: <Award className="h-3 w-3" />,
    label: "Portofolio",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    code: "PORT",
  },
  "RPL": {
    icon: <GraduationCap className="h-3 w-3" />,
    label: "RPL",
    color: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    code: "RPL",
  },
  "PELATIHAN": {
    icon: <Users className="h-3 w-3" />,
    label: "Pelatihan",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    code: "PLAT",
  },
};

const AGENT_LEGEND = ["REGULASI", "METODOLOGI", "MUK", "ETIKA", "KARIER", "PORTOFOLIO", "RPL", "PELATIHAN"];

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

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;

  return (
    <div className="mt-2 rounded-lg border border-blue-800/40 bg-blue-950/30 text-xs overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-expand-subagents"
      >
        <Shield className="h-3 w-3 text-blue-400 shrink-0" />
        <span className="text-blue-300 font-medium">
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
        <div className="border-t border-blue-800/30 px-3 py-2 space-y-1.5">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(msg.content)
    : { fields: [], cleanContent: msg.content };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-blue-800/70 text-white text-sm">
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
              <span className="text-xs">Mengkoordinasikan 8 agen ASKOM…</span>
            </span>
          ) : <MessageContent text={cleanContent} className="text-sm" />}
        </div>
        <BrainChip fields={brainFields} />
        {msg.subAgents && msg.subAgents.length > 0 && (
          <SubAgentPanel agents={msg.subAgents} />
        )}
        {msg.orchestrationMs && !msg.isStreaming && (
          <div className="text-[10px] text-white/20 px-1">
            {(msg.orchestrationMs / 1000).toFixed(1)}s · OpenClaw L4 ASKOM
          </div>
        )}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "🧑‍⚖️", text: "Apa itu ASKOM dan apa saja persyaratan menjadi Asesor Konstruksi?" },
  { icon: "📋", text: "Jelaskan alur kerja asesmen SKK dengan metode VRFA dan CASR." },
  { icon: "📁", text: "Dokumen MUK apa saja yang harus disiapkan untuk asesmen SKK?" },
  { icon: "⚖️", text: "Apa kode etik ASKOM dan apa sanksi pelanggaran etika asesor?" },
  { icon: "🎓", text: "Bagaimana jalur karier menjadi ASKOM Senior dari ASKOM Junior?" },
  { icon: "📊", text: "Apa beda evaluasi portofolio dan RPL dalam asesmen kompetensi konstruksi?" },
];

export default function AskomChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    id: number;
    name: string;
    tagline?: string;
  }>({
    queryKey: ["/api/askom/orchestrator"],
    queryFn: async () => {
      const res = await fetch("/api/askom/orchestrator");
      if (!res.ok) throw new Error("ASKOM Hub not found");
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
                agentId: sa.agentId, role: sa.role, status: "waiting" as const,
              }));
              subs.forEach(s => subAgentMap.set(s.agentId, s));
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, subAgents: Array.from(subAgentMap.values()) };
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
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, content: fullContent, subAgents: Array.from(subAgentMap.values()) };
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
    <div className="flex flex-col h-screen bg-[#030510] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#040618]/80 backdrop-blur">
        <Link href="/askom">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-lg">
          🧑‍⚖️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{agentData?.name ?? "ASKOM AI — Asesor & Lisensi LSP Konstruksi"}</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-blue-400" />
            <span>8 Agen Spesialis · BNSP Pedoman 201/301 · SNI ISO/IEC 17024 · OpenClaw L4</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-300 hidden sm:flex">
            ASKOM v1
          </Badge>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            ABD v1.1
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#030510]/60">
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
        <span className="text-xs text-white/20 ml-2 shrink-0 hidden md:inline">BNSP 201/202/301/303 · SKKNI 333/2020 · SNI ISO/IEC 17024 · KAN</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🧑‍⚖️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                ASKOM AI — Panduan Asesor & Lisensi LSP Konstruksi
              </div>
              <div className="text-sm text-white/50 max-w-lg">
                8 agen spesialis memandu seluruh aspek ASKOM & LSP:{" "}
                <span className="text-blue-300">Regulasi</span> (BNSP & SKKNI) ·{" "}
                <span className="text-violet-300">Metodologi</span> (VRFA, CASR, 5 Dimensi) ·{" "}
                <span className="text-amber-300">MUK & FR-Series</span> ·{" "}
                <span className="text-rose-300">Etika & RCC</span> ·{" "}
                <span className="text-cyan-300">Karier</span> (ASKOM vs ABU) ·{" "}
                <span className="text-emerald-300">Portofolio</span> ·{" "}
                <span className="text-lime-300">RPL</span> ·{" "}
                <span className="text-orange-300">Pelatihan</span>
              </div>
              <div className="text-xs text-white/30 mt-2 max-w-md mx-auto">
                Regulasi: <span className="text-blue-400">BNSP Pedoman 201/202/301/303</span> · SKKNI 333/2020 · SNI ISO/IEC 17024:2012 · ABD v1.1
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                { icon: "📋", label: "Proses Menjadi ASKOM" },
                { icon: "📁", label: "MUK & FR-Series" },
                { icon: "⚖️", label: "Kode Etik Asesor" },
                { icon: "🎓", label: "RPL Assessment" },
                { icon: "📊", label: "Evaluasi Portofolio" },
                { icon: "🏛️", label: "Lisensi LSP & KAN" },
              ].map(c => (
                <span key={c.label} className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/60">
                  {c.icon} {c.label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.text)}
                  disabled={!ready || streaming}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/40 hover:bg-blue-900/20 transition-all disabled:opacity-40 text-white/70"
                  data-testid={`prompt-${i}`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.text}
                </button>
              ))}
            </div>

            <div className="text-xs text-white/25 max-w-md text-center">
              Output ABD-7: Confidence Score · [ASUMSI:] eksplisit · FR-APL-01 sebagai titik masuk standar · Guardrail anti-manipulasi MUK
            </div>

            {!ready && !agentLoading && (
              <div className="text-xs text-red-300/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2">
                ASKOM Hub belum terhubung. Periksa koneksi server.
              </div>
            )}
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          </div>
        )}
      </ScrollArea>
      <ChatInputBar
        lastAIMessage={[...messages].reverse().find((m) => m.role === "assistant")?.content}
        onSend={sendMessage}
        disabled={!ready || streaming}
        streaming={streaming}
        placeholder={ready ? "Tanya tentang ASKOM, MUK, FR-Series, etika asesor, atau lisensi LSP…" : "Memuat…"}
        footerText="ASKOM AI · BNSP Pedoman 201/301 · ABD v1.1 · OpenClaw L4"
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
