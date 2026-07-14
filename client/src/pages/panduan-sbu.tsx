import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, BookOpen, CheckCircle2,
  HardHat, FileText, RefreshCw, ShieldCheck, Building2,
  Users, Wrench, AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, MessageActions, AttachmentRow, ChatAttachment } from "@/components/chat-input-bar";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  attachments?: ChatAttachment[];
}

const QUICK_QUESTIONS = [
  { icon: "📋", text: "Apa itu SBU dan kenapa perusahaan saya wajib punya?" },
  { icon: "📁", text: "Dokumen apa saja yang harus saya siapkan untuk daftar SBU?" },
  { icon: "⏱️", text: "Berapa lama proses pengurusan SBU dari awal sampai terbit?" },
  { icon: "🔄", text: "SBU saya masih pakai format lama. Apakah harus dikonversi dan bagaimana caranya?" },
  { icon: "💼", text: "Apa bedanya kualifikasi K1, K2, K3, Menengah, dan Besar? Perusahaan saya masuk mana?" },
  { icon: "⚠️", text: "Apa sanksinya kalau perusahaan saya tidak punya atau telat perpanjang SBU?" },
];

const TOPIC_CHIPS = [
  { icon: <FileText className="h-3 w-3" />, label: "Syarat Dokumen" },
  { icon: <Building2 className="h-3 w-3" />, label: "Kualifikasi BUJK" },
  { icon: <RefreshCw className="h-3 w-3" />, label: "Konversi SBU" },
  { icon: <Users className="h-3 w-3" />, label: "PJBU / Tenaga Ahli" },
  { icon: <Wrench className="h-3 w-3" />, label: "Peralatan Konstruksi" },
  { icon: <ShieldCheck className="h-3 w-3" />, label: "Sanksi & Kewajiban" },
  { icon: <HardHat className="h-3 w-3" />, label: "KBLI 2025" },
  { icon: <AlertCircle className="h-3 w-3" />, label: "Jadwal & Biaya" },
];

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-950/70 border border-emerald-800/30 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-emerald-800/50 border border-emerald-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">
        📖
      </div>
      <div className="flex-1 min-w-0 bg-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/8">
        {msg.isStreaming && !msg.content ? (
          <span className="animate-pulse text-white/50 text-sm">▋</span>
        ) : (
          <MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed" />
        )}
      </div>
    </div>
  );
}

export default function PanduanSBUChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading: agentLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/panduan-sbu/agent"],
    queryFn: async () => {
      const res = await fetch("/api/panduan-sbu/agent");
      if (!res.ok) throw new Error("PanduanSBU agent not found");
      return res.json();
    },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if ((!text.trim() && files.length === 0) || streaming || !agentId) return;
    setStreaming(true);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: String(agentId), role: "user", content: text,
          conversationHistory: history,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullContent = "";
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
            if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages(prev => {
                const u = [...prev];
                const l = u[u.length - 1];
                if (l.role === "assistant") u[u.length - 1] = { ...l, content: fullContent };
                return u;
              });
            } else if (evt.type === "complete" && evt.message?.content) {
              fullContent = evt.message.content;
            }
          } catch {}
        }
      }
      setMessages(prev => {
        const u = [...prev];
        const l = u[u.length - 1];
        if (l.role === "assistant") u[u.length - 1] = { ...l, isStreaming: false };
        return u;
      });
    } catch {
      setMessages(prev => {
        const u = [...prev];
        const l = u[u.length - 1];
        if (l.role === "assistant") u[u.length - 1] = { ...l, content: "Maaf, terjadi kesalahan. Silakan coba lagi.", isStreaming: false };
        return u;
      });
    } finally {
      setStreaming(false);
      // input focus handled by ChatInputBar
    }
  }

  const ready = !agentLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#060e08] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#071009]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-emerald-800/50 border border-emerald-600/40 flex items-center justify-center text-lg">
          📖
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">PanduanSBU — Tanya Jawab Sertifikasi BUJK</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <BookOpen className="h-2.5 w-2.5 text-emerald-400" />
            <span>Jawaban langsung · Bahasa sederhana · Permen PU 6/2025</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-300 hidden sm:flex">
            PanduanSBU
          </Badge>
          {agentLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 text-center px-4">
            <div className="text-5xl">📖</div>

            <div>
              <div className="font-semibold text-xl mb-2 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                PanduanSBU — Tanya Apa Saja, Dijawab Langsung
              </div>
              <p className="text-sm text-white/50 max-w-lg leading-relaxed">
                Punya pertanyaan tentang SBU, sertifikasi perusahaan konstruksi, atau aturan baru Permen PU 6/2025?
                Tanya saja — jawaban langsung, jelas, tanpa istilah rumit.
              </p>
            </div>

            {/* Topic chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {TOPIC_CHIPS.map((t, i) => (
                <button key={i}
                  onClick={() => sendMessage(`Jelaskan tentang: ${t.label}`)}
                  disabled={!ready || streaming}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-emerald-800/50 bg-emerald-950/30 hover:border-emerald-500/60 hover:bg-emerald-900/30 transition-all disabled:opacity-40 text-emerald-300/80"
                  data-testid={`chip-${i}`}>
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full max-w-lg flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/25">atau pilih pertanyaan umum</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Quick questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i}
                  onClick={() => sendMessage(q.text)}
                  disabled={!ready || streaming}
                  className="text-left text-xs px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-600/40 hover:bg-emerald-950/20 transition-all disabled:opacity-40 text-white/70 flex items-start gap-2"
                  data-testid={`prompt-${i}`}>
                  <span className="text-base leading-none mt-0.5">{q.icon}</span>
                  <span className="leading-relaxed">{q.text}</span>
                </button>
              ))}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Semua jawaban berdasarkan <span className="text-emerald-300">Permen PU No. 6 Tahun 2025</span> dan materi workshop resmi Kementerian PU, LPJK, dan LSBU. Untuk kepastian hukum, selalu konfirmasi ke LSBU atau LPJK.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
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
        placeholder={ready ? "Tanya tentang SBU, kualifikasi, konversi, dokumen, biaya…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
