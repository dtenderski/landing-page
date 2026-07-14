import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, ClipboardList, CheckCircle2,
  Users, HardHat, ShieldCheck, Award, Building2,
} from "lucide-react";
import { Link } from "wouter";

interface Message { role: "user" | "assistant"; content: string; isStreaming?: boolean; }

const QUICK_QUESTIONS = [
  { icon: "📊", text: "Apa ruang lingkup pekerjaan Ahli Madya Manajemen Proyek (Jenjang 8)?" },
  { icon: "🏗️", text: "Manajer Lapangan Pelaksanaan Pekerjaan Gedung — apa yang bisa ia pimpin?" },
  { icon: "👷", text: "Bedanya Pelaksana Lapangan Gedung Jenjang 4 dan Jenjang 5 itu apa?" },
  { icon: "🛣️", text: "Manajer Pelaksana Pekerjaan Jalan bisa menjabat posisi apa di proyek?" },
  { icon: "⛑️", text: "Ahli Muda K3 Konstruksi — apa saja yang menjadi tanggung jawabnya?" },
  { icon: "✅", text: "Ahli Madya Sistem Manajemen Mutu — apa lingkup kerjanya di BUJK?" },
];

const TOPIC_CHIPS = [
  { icon: <Award className="h-3 w-3" />, label: "Manajemen Proyek" },
  { icon: <Building2 className="h-3 w-3" />, label: "Pelaksana Gedung" },
  { icon: <Users className="h-3 w-3" />, label: "Pengawas Gedung" },
  { icon: <HardHat className="h-3 w-3" />, label: "Pelaksana Jalan" },
  { icon: <ShieldCheck className="h-3 w-3" />, label: "K3 Konstruksi" },
  { icon: <ClipboardList className="h-3 w-3" />, label: "Manajemen Mutu" },
];

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-indigo-950/70 border border-indigo-800/30 text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-indigo-800/50 border border-indigo-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">📋</div>
      <div className="flex-1 min-w-0 bg-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/8">
        {msg.isStreaming && !msg.content
          ? <span className="animate-pulse text-white/50 text-sm">▋</span>
          : <MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed" />}
      </div>
    </div>
  );
}

export default function ScopeManpelChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/scope-manpel/agent"],
    queryFn: async () => {
      const res = await fetch("/api/scope-manpel/agent");
      if (!res.ok) throw new Error("ScopeManpel agent not found");
      return res.json();
    },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming || !agentId) return;
    setInput("");
    setStreaming(true);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: text, conversationHistory: history }),
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
                const u = [...prev]; const l = u[u.length - 1];
                if (l.role === "assistant") u[u.length - 1] = { ...l, content: fullContent };
                return u;
              });
            } else if (evt.type === "complete" && evt.message?.content) fullContent = evt.message.content;
          } catch {}
        }
      }
      setMessages(prev => {
        const u = [...prev]; const l = u[u.length - 1];
        if (l.role === "assistant") u[u.length - 1] = { ...l, isStreaming: false };
        return u;
      });
    } catch {
      setMessages(prev => {
        const u = [...prev]; const l = u[u.length - 1];
        if (l.role === "assistant") u[u.length - 1] = { ...l, content: "Maaf, terjadi kesalahan. Silakan coba lagi.", isStreaming: false };
        return u;
      });
    } finally { setStreaming(false); inputRef.current?.focus(); }
  }

  const ready = !isLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#080614] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0a0820]/80 backdrop-blur">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-full bg-indigo-800/50 border border-indigo-600/40 flex items-center justify-center text-lg">📋</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">ScopeManpel — Ruang Lingkup SKK Manajemen Pelaksanaan</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <ClipboardList className="h-2.5 w-2.5 text-indigo-400" />
            <span>PM · Pelaksana · Pengawas · K3 · Mutu · SK Dirjen 114/2024</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-indigo-600/40 text-indigo-300 hidden sm:flex">ScopeManpel</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          {ready && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 text-center px-4">
            <div className="text-5xl">📋</div>
            <div>
              <div className="font-semibold text-xl mb-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                ScopeManpel — Ruang Lingkup SKK Manajemen Pelaksanaan
              </div>
              <p className="text-sm text-white/50 max-w-lg leading-relaxed">
                Tanya tentang APA YANG BISA DIKERJAKAN setiap jabatan kerja SKK Manajemen Pelaksanaan — PM, Pelaksana, Pengawas, K3, hingga Manajemen Mutu, per jenjang kualifikasi.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TOPIC_CHIPS.map((t, i) => (
                <button key={i} onClick={() => sendMessage(`Jelaskan jabatan kerja dan ruang lingkup di subklasifikasi: ${t.label}`)}
                  disabled={!ready || streaming}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-indigo-800/50 bg-indigo-950/30 hover:border-indigo-500/60 hover:bg-indigo-900/30 transition-all disabled:opacity-40 text-indigo-300/80"
                  data-testid={`chip-${i}`}>
                  {t.icon}<span>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="w-full max-w-lg flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/25">atau pilih pertanyaan</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q.text)} disabled={!ready || streaming}
                  className="text-left text-xs px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-indigo-600/40 hover:bg-indigo-950/20 transition-all disabled:opacity-40 text-white/70 flex items-start gap-2"
                  data-testid={`prompt-${i}`}>
                  <span className="text-base leading-none mt-0.5">{q.icon}</span>
                  <span className="leading-relaxed">{q.text}</span>
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Jawaban berdasarkan <span className="text-indigo-300">SK Dirjen Bina Konstruksi No. 114/KPTS/Dk/2024</span> dan SKKNI per jabatan kerja. Fokus pada ruang lingkup & kewenangan — bukan syarat sertifikasi.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          </div>
        )}
      </ScrollArea>

      <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-[#0a0820]/80">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={ready ? "Tanya ruang lingkup jabatan SKK Manajemen Pelaksanaan…" : "Menghubungkan…"}
            disabled={!ready || streaming}
            className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-indigo-500/40 text-sm h-10"
            data-testid="input-message" />
          <Button onClick={() => sendMessage(input)} disabled={!ready || streaming || !input.trim()}
            className="bg-indigo-800 hover:bg-indigo-700 text-white h-10 px-4 shrink-0" data-testid="button-send">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-center mt-2 text-xs text-white/20">
          ScopeManpel · Ruang lingkup jabatan kerja SKK Manajemen Pelaksanaan · SK Dirjen 114/2024
        </p>
      </div>
    </div>
  );
}
