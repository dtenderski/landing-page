import { useState, useRef, useEffect } from "react";
import { MessageContent } from "@/lib/format-message";
import { Send, X, ChevronRight, Sparkles, BookOpen, Star, Zap, Mic, MicOff, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING = `Halo! Saya Dialog Gustafta — Teman Berpikir kamu. 🌟

Saya hadir bukan untuk menjawab, tapi untuk *menggali* — karena saya yakin kamu punya potensi dan pengalaman yang luar biasa yang belum sempat diartikulasikan.

Ceritakan padaku — kamu bekerja di bidang apa, atau ada tantangan apa yang ingin kamu selesaikan?`;

const PROMO_SHOWN_THRESHOLD = 5;

export function DialogGustaftaWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendRef = useRef<() => void>(() => {});
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) textareaRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (userMessageCount >= PROMO_SHOWN_THRESHOLD && !promoDismissed) {
      setShowPromo(true);
    }
  }, [userMessageCount, promoDismissed]);

  // ── Speech API ──────────────────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSpeechSupported(true);
    const recognition = new SR();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;
    let final = "";
    recognition.onstart = () => { setIsListening(true); final = ""; };
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setInput(final + interim);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (final.trim()) setTimeout(() => sendRef.current(), 50);
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); }
    else { setInput(""); recognitionRef.current.start(); }
  };

  // ── File upload ─────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
        if (!r.ok) continue;
        const data = await r.json();
        // Auto-transcribe audio
        if (data.category === "audio") {
          try {
            const tf = new FormData(); tf.append("file", file);
            const tr = await fetch("/api/chat/transcribe", { method: "POST", body: tf });
            if (tr.ok) {
              const td = await tr.json();
              if (td.transcript) setInput(prev => prev ? `${prev}\n\n${td.transcript}` : td.transcript);
            }
          } catch { /* optional */ }
        } else {
          setInput(prev => prev ? `${prev}\n[File: ${data.fileName}]` : `[File: ${data.fileName}]`);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  sendRef.current = async () => {
    if (!input.trim() || loading) return;
    await sendMessageCore(input.trim());
  };

  const sendMessageCore = async (text: string) => {
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    try {
      const newUserCount = newMessages.filter((m) => m.role === "user").length;
      const res = await fetch("/api/dialog-gustafta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userMessageCount: newUserCount }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "Maaf, ada gangguan sebentar." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Koneksi terganggu, coba lagi ya!" }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    try {
      const newUserCount = newMessages.filter((m) => m.role === "user").length;
      const res = await fetch("/api/dialog-gustafta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userMessageCount: newUserCount }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "Maaf, ada gangguan sebentar." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Koneksi terganggu, coba lagi ya!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Promo Card — muncul saat dialog sudah dalam */}
      {isOpen && showPromo && !promoDismissed && (
        <div className="fixed bottom-24 left-4 z-50 w-[300px] max-w-[calc(100vw-2rem)]">
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-4">
              <button
                onClick={() => { setShowPromo(false); setPromoDismissed(true); }}
                className="absolute top-3 right-3 text-white/50 hover:text-white/80"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Starter Kit</div>
                  <div className="text-sm font-bold text-white">Starter Kit Gustafta</div>
                </div>
              </div>
              <ul className="space-y-1.5 mb-3">
                {[
                  { icon: BookOpen, text: "3 Panduan Digital Trilogi Gustafta" },
                  { icon: Star, text: "Lisensi platform seumur hidup" },
                  { icon: Zap, text: "7 hari trial Starter gratis" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-xs text-white/80">
                    <Icon className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-3 py-1.5 mb-3 text-center">
                <span className="text-emerald-300 text-xs font-bold">🎁 Starter Kit — Rp 245.000</span>
              </div>
              <a
                href="/konsultasi"
                className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
              >
                Buka Dialog Penuh <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main widget */}
      <div className="fixed bottom-4 left-4 z-50">
        {/* Chat Window */}
        <div
          className={cn(
            "absolute bottom-16 left-0 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-left",
            isOpen
              ? "scale-100 opacity-100 pointer-events-auto"
              : "scale-95 opacity-0 pointer-events-none"
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <img src="/logo-gustafta.png" alt="Gustafta" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">DIALOG GUSTAFTA</h3>
                <p className="text-xs text-white/70">Teman Berpikir — Gali Potensimu</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="h-[400px] max-h-[60vh] overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "w-7 h-7 rounded-full shrink-0 flex items-center justify-center",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-700"
                      : "bg-secondary"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <img src="/logo-gustafta.png" alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <span className="text-[10px] text-foreground font-bold">U</span>
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
                    msg.role === "assistant"
                      ? "bg-muted rounded-tl-sm"
                      : "bg-gradient-to-br from-cyan-500 to-blue-700 text-white rounded-tr-sm whitespace-pre-wrap"
                  )}
                >
                  {msg.role === "assistant"
                    ? <MessageContent text={msg.content} className="text-sm" />
                    : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shrink-0">
                  <img src="/logo-gustafta.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.12s" }} />
                    <span className="w-2 h-2 bg-blue-800 rounded-full animate-bounce" style={{ animationDelay: "0.24s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inline mini promo strip — setelah threshold, sebelum dismiss */}
          {!promoDismissed && userMessageCount >= 3 && userMessageCount < PROMO_SHOWN_THRESHOLD && (
            <div className="mx-4 mb-2">
              <a
                href="/konsultasi"
                className="flex items-center justify-between gap-2 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-white/80 hover:text-white transition-colors"
              >
                <span>✨ Mau blueprint lengkap? Buka <strong className="text-cyan-300">Dialog Penuh</strong></span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-background/60">
            {isListening && (
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs text-red-400 font-medium">Mendengarkan…</span>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isUploading || isListening}
                className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                title="Lampirkan file"
                data-testid="button-attach-file-dialog"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.mp3,.wav,.webm,.ogg,.m4a,.mp4,.mov"
                onChange={handleFileSelect} />
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Mendengarkan suara Anda…" : "Ceritakan sesuatu tentang dirimu..."}
                className="min-h-[44px] max-h-[100px] resize-none text-sm rounded-xl"
                rows={1}
                disabled={isListening}
              />
              {speechSupported && (
                <button
                  onClick={toggleMic}
                  disabled={loading}
                  className={`shrink-0 p-2.5 rounded-xl transition-all ${isListening ? "bg-red-500/20 text-red-500" : "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"}`}
                  title={isListening ? "Berhenti" : "Rekam suara"}
                  data-testid="button-mic-dialog"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading || isListening}
                className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-600 hover:to-blue-800 border-0"
                data-testid="button-send-dialog"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-60">
              Dialog Gustafta · Teman Berpikir · trilogi.gustafta.my.id
            </p>
          </div>
        </div>

        {/* Floating Button */}
        <div className="relative">
          {!isOpen && (
            <span className="absolute inset-0 w-14 h-14 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" style={{ animationDuration: "3s" }} />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{ background: "linear-gradient(145deg, #0c2340 0%, #0e3a6e 40%, #0a2550 100%)" }}
            className={cn(
              "relative w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center",
              "ring-1 ring-cyan-500/30",
              "hover:scale-105 hover:ring-cyan-400/60 active:scale-95"
            )}
            title="Dialog Gustafta — Teman Berpikir"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-cyan-300" />
            ) : (
              <img src="/logo-gustafta-nobg.png" alt="Dialog Gustafta" className="w-11 h-11 object-contain drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
            )}
          </button>

          {/* Label */}
          {!isOpen && (
            <div className="absolute bottom-1 left-16 bg-[#0e3a6e]/90 border border-cyan-500/30 text-cyan-200 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg pointer-events-none backdrop-blur-sm">
              Dialog Gustafta
            </div>
          )}
        </div>
      </div>
    </>
  );
}
