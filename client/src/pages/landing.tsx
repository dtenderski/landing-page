import { Link } from "wouter";
import { trackLead } from "@/lib/meta-pixel";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { SharedHeader } from "@/components/shared-header";
import explainerVideo from "@assets/generated_videos/gustafta_promo_24s_web.mp4";
import explainerPoster from "@assets/generated_videos/gustafta_promo_24s_poster.jpg";
import overviewVideo from "@assets/generated_videos/gustafta_explainer.mp4";
import overviewPoster from "@assets/generated_videos/gustafta_explainer_poster.jpg";
import {
  Rocket, ArrowRight, Check, BookOpen, Wrench, Zap, Lightbulb, TrendingUp,
  MessageCircle, ShieldCheck, Store, Bot, FileText,
  GraduationCap, Smartphone, Users, Building2, Briefcase, User,
  Send, Loader2, Sparkles, X, ChevronDown, Lock, ShoppingBag, FileDown,
  Mic, MicOff, Paperclip, Bell, Clock, Target, Mail, Stethoscope, CalendarDays,
} from "lucide-react";

const GUSTAFTA_AGENT_ID = "1";
type LandingMsg = { role: "user" | "assistant"; content: string; gate?: string };
type SocraticGate = "GATE1" | "GATE2" | "GATE3" | "BLUEPRINT";

interface Blueprint {
  namaAI: string;
  domain: string;
  persona: string;
  sasaranPengguna: string;
  fiturUtama: string[];
  systemPromptHint: string;
  langkahSelanjutnya: string[];
}

const GATE_LABELS: Record<SocraticGate, { label: string; color: string; step: number }> = {
  GATE1: { label: "Menggali Potensi", color: "bg-blue-500", step: 1 },
  GATE2: { label: "Melihat Visi", color: "bg-violet-500", step: 2 },
  GATE3: { label: "Merancang Blueprint", color: "bg-amber-500", step: 3 },
  BLUEPRINT: { label: "Blueprint Siap!", color: "bg-green-500", step: 4 },
};

function buildSystemContext(gate: SocraticGate, userMsg: string, history: LandingMsg[]): string {
  const historyText = history
    .filter(m => m.role === "user")
    .map(m => `- ${m.content}`)
    .join("\n");

  if (gate === "GATE1") {
    return `[INSTRUKSI SISTEM — JANGAN TAMPILKAN KE USER]
Kamu adalah Gustafta, AI-coach Socratik yang membantu orang menemukan potensi mereka untuk diubah menjadi AI.
FASE: GATE 1 — Menggali Potensi
Tugasmu: Gali latar belakang, keahlian, dan pengalaman user dengan pertanyaan Socratik yang hangat dan penasaran.
- Jangan langsung menawarkan produk.
- Ajukan 1 pertanyaan mendalam yang membuat user merenung.
- Fokus pada: siapa mereka, apa yang mereka kuasai, siapa yang mereka bantu.
Pesan user: ${userMsg}`;
  }

  if (gate === "GATE2") {
    return `[INSTRUKSI SISTEM — JANGAN TAMPILKAN KE USER]
Kamu adalah Gustafta, AI-coach Socratik.
FASE: GATE 2 — Membuka Visi
Apa yang sudah user bagikan:
${historyText}

Tugasmu: Buat user merasakan kekuatan platform ini secara konkret.
- Gambarkan secara vivid bagaimana pengetahuan/keahlian mereka bisa menjadi sebuah AI yang bekerja 24/7.
- Gunakan framing "bayangkan jika..." dan berikan contoh spesifik berdasarkan latar belakang mereka.
- Akhiri dengan 1 pertanyaan yang menggali use case spesifik mereka lebih dalam.
- Nada: excited, memancing rasa ingin tahu, bukan menjual.
Pesan user: ${userMsg}`;
  }

  if (gate === "GATE3") {
    return `[INSTRUKSI SISTEM — JANGAN TAMPILKAN KE USER]
Kamu adalah Gustafta, AI-coach Socratik.
FASE: GATE 3 — Merancang Blueprint
Yang sudah diketahui tentang user:
${historyText}

Tugasmu: Ajukan 2 pertanyaan kunci terakhir yang akan membuat Blueprint mereka semakin tajam:
1. Siapa 3 tipe pengguna utama chatbot mereka?
2. Apa 1 pertanyaan yang PALING SERING ditanyakan kepada mereka?
Setelah user menjawab, katakan bahwa kamu siap membuat Blueprint mereka.
Nada: antusias, memberi rasa bahwa ini adalah langkah konkret.
Pesan user: ${userMsg}`;
  }

  return "";
}

function buildBlueprintPrompt(history: LandingMsg[]): string {
  const allUserMsgs = history
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" | ");

  return `[BUAT BLUEPRINT]
Berdasarkan seluruh percakapan Socratik ini:
${allUserMsgs}

Buat Blueprint Konfigurasi AI dalam format JSON yang valid SAJA (tanpa markdown, tanpa penjelasan):
{
  "namaAI": "nama chatbot yang menarik dan relevan",
  "domain": "domain keahlian utama",
  "persona": "deskripsi singkat karakter AI (1 kalimat)",
  "sasaranPengguna": "siapa yang dilayani",
  "fiturUtama": ["fitur 1", "fitur 2", "fitur 3", "fitur 4"],
  "systemPromptHint": "opening system prompt singkat untuk chatbot ini (2-3 kalimat)",
  "langkahSelanjutnya": ["langkah 1", "langkah 2", "langkah 3"]
}`;
}

const BLUEPRINT_STORAGE_KEY = "gustafta_blueprint_pending";

const STARTER_KIT_URL = "https://dialog.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";

function BlueprintLockedCard({ bp, onClose }: { bp: Blueprint; onClose: () => void }) {
  const waText = encodeURIComponent(
    `Halo Gustafta! Blueprint AI saya sudah siap dari sesi Dialog. Nama AI: ${bp.namaAI} | Domain: ${bp.domain}. Saya ingin beli Starter Kit untuk mengakses Blueprint lengkapnya.`
  );

  return (
    <div className="mx-3 mb-3 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-white" />
        <span className="text-white text-xs font-bold tracking-wide">BLUEPRINT AI ANDA — SIAP! 🎉</span>
        <Lock className="h-3 w-3 text-white/80 ml-auto" />
      </div>

      <div className="p-3 space-y-2.5">
        {/* Nama AI */}
        <div className="text-center py-1">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider mb-0.5">AI yang akan Anda miliki</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">"{bp.namaAI}"</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Bidang: {bp.domain}</p>
        </div>

        {/* Blurred preview */}
        <div className="relative rounded-lg overflow-hidden">
          <div className="p-2.5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 space-y-1.5 select-none">
            <div className="flex flex-wrap gap-1">
              {(bp.fiturUtama ?? []).map((_, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-zinc-600 text-transparent">████████</span>
              ))}
            </div>
            <p className="text-[10px] text-transparent bg-gray-200 dark:bg-zinc-600 rounded leading-relaxed">████████████ ████ ██████ ████████████ ████</p>
          </div>
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center gap-1">
            <Lock className="h-4 w-4 text-amber-500" />
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold text-center">Persona · Fitur · System Prompt tersembunyi</p>
          </div>
        </div>

        {/* Manfaat — ringkas */}
        <div className="space-y-1">
          {[
            "Blueprint langsung bisa diimport ke Builder",
            "Trial platform 7 hari — coba semua fitur",
            "3 panduan digital Trilogi Gustafta",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-green-500 shrink-0" />
              <span className="text-[11px] text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>

        {/* SATU CTA utama */}
        <a href={STARTER_KIT_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-10 text-sm font-bold gap-2 shadow-md">
            <ShoppingBag className="h-4 w-4" />
            Beli Starter Kit — Rp 245.000
          </Button>
        </a>
        <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 -mt-1">
          Sekali bayar · Termasuk lisensi + trial 7 hari
        </p>

        {/* Tautan sekunder kecil */}
        <div className="flex items-center justify-center gap-3 pt-0.5">
          <a
            href={`https://wa.me/6282299417818?text=${waText}`} onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-green-600 transition-colors"
          >
            <MessageCircle className="h-3 w-3" /> Tanya dulu via WA
          </a>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <Link href="/blueprint-saya" onClick={onClose}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-600 transition-colors"
          >
            <FileDown className="h-3 w-3" /> Simpan Blueprint
          </Link>
        </div>
      </div>
    </div>
  );
}

function GustaftaFloatingChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<LandingMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [gate, setGate] = useState<SocraticGate>("GATE1");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [generatingBP, setGeneratingBP] = useState(false);
  const [sessionId] = useState(() => `socratic_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (isOpen && !initialized.current) {
      initialized.current = true;
      setMessages([{
        role: "assistant",
        gate: "GATE1",
        content: "Halo! Saya Gustafta 🙏\n\nSebelum saya ceritakan tentang platform ini — saya lebih ingin mengenal Anda dulu.\n\nCeritakan sedikit: apa keahlian atau pengalaman terbesar yang Anda miliki sekarang?",
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, blueprint]);

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
          setInput(prev => prev ? `${prev} [File: ${data.fileName}]` : `[File: ${data.fileName}]`);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentGate = (): SocraticGate => {
    if (userMsgCount < 2) return "GATE1";
    if (userMsgCount < 4) return "GATE2";
    return "GATE3";
  };

  const generateBlueprint = async (history: LandingMsg[]) => {
    setGeneratingBP(true);
    setGate("BLUEPRINT");
    try {
      const prompt = buildBlueprintPrompt(history);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: GUSTAFTA_AGENT_ID, sessionId, role: "user", content: prompt }),
      });
      const data = await res.json();
      const raw = data.aiMessage?.content ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Blueprint;
        localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify({
          ...parsed,
          createdAt: new Date().toISOString(),
          status: "pending_payment",
        }));
        setBlueprint(parsed);
        setMessages(prev => [...prev, {
          role: "assistant",
          gate: "BLUEPRINT",
          content: `🎉 Blueprint AI Anda sudah selesai dibuat!\n\nBlueprint berisi: nama AI, persona, fitur utama, system prompt, dan langkah perakitan — semuanya dirancang khusus berdasarkan keahlian Anda.\n\nBlueprint akan otomatis tersedia di Gustafta Builder setelah Anda mengaktifkan paket. Tinggal klik "Import Blueprint" dan chatbot Anda langsung terkonfigurasi!`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          gate: "BLUEPRINT",
          content: "Blueprint Anda sudah disiapkan. Lanjutkan ke pemilihan paket untuk mengaksesnya di Builder! 🚀",
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Blueprint hampir siap — hubungi kami via WhatsApp untuk melanjutkan!",
      }]);
    } finally {
      setGeneratingBP(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading || generatingBP || gate === "BLUEPRINT") return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    const newCount = userMsgCount + 1;
    setUserMsgCount(newCount);

    const newHistory = [...messages, { role: "user" as const, content: msg }];
    setMessages(newHistory);

    const activeGate = currentGate();
    const nextGate: SocraticGate = newCount >= 2 && newCount < 4 ? "GATE2" : newCount >= 4 ? "GATE3" : "GATE1";
    setGate(nextGate);

    try {
      const contextualMsg = buildSystemContext(activeGate, msg, newHistory);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: GUSTAFTA_AGENT_ID, sessionId, role: "user", content: contextualMsg }),
      });
      const data = await res.json();
      const aiContent = data.aiMessage?.content ?? "Maaf, tidak ada respons.";
      const updatedHistory = [...newHistory, { role: "assistant" as const, content: aiContent, gate: nextGate }];
      setMessages(updatedHistory);

      if (newCount >= 5) {
        setTimeout(() => generateBlueprint(updatedHistory), 800);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi gangguan. Coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  sendRef.current = () => {
    if (input.trim() && !loading && !generatingBP && gate !== "BLUEPRINT") send();
  };

  if (!isOpen) return null;

  const gateInfo = GATE_LABELS[gate];
  const isDone = gate === "BLUEPRINT";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
    <div className="w-full max-w-lg rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden bg-card" style={{ maxHeight: "min(680px, 90vh)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Gustafta Socratic Dialog</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${gateInfo.color}`} />
              <p className="text-white/80 text-[10px]">{gateInfo.label} · Langkah {gateInfo.step}/4</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          data-testid="button-gustafta-chat-close"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Gate progress bar */}
      <div className="flex h-1 w-full bg-gray-200 dark:bg-zinc-700">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 transition-all duration-500 ${s <= gateInfo.step ? "bg-gradient-to-r from-blue-500 to-violet-500" : ""}`} />
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-zinc-900" style={{ minHeight: 200 }}>
        {messages.map((m, i) => (
          <div key={i}>
            {m.gate && m.gate !== messages[i - 1]?.gate && m.role === "assistant" && m.gate !== "GATE1" && (
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${GATE_LABELS[m.gate as SocraticGate]?.color ?? "bg-gray-400"}`}>
                  {GATE_LABELS[m.gate as SocraticGate]?.label ?? m.gate}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
              </div>
            )}
            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-zinc-700 rounded-tl-sm shadow-sm"
              }`}>
                {m.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              </div>
            </div>
          </div>
        ))}

        {(loading || generatingBP) && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mr-2 shrink-0 mt-0.5">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1">
                {generatingBP && <Sparkles className="h-2.5 w-2.5 text-amber-400 mr-1 animate-pulse" />}
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              {generatingBP && <p className="text-[10px] text-amber-600 mt-1">Menyusun Blueprint Anda…</p>}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Blueprint Card */}
      {blueprint && <BlueprintLockedCard bp={blueprint} onClose={onClose} />}

      {/* Input */}
      {!isDone && (
        <div className="px-3 py-2.5 border-t bg-white dark:bg-zinc-900">
          {isListening && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] text-red-500 font-medium">Mendengarkan…</span>
            </div>
          )}
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || generatingBP || isUploading || isListening}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors p-1"
              title="Lampirkan file"
              data-testid="button-attach-landing"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.mp3,.wav,.webm,.ogg,.m4a,.mp4,.mov"
              onChange={handleFileSelect} />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={isListening ? "Mendengarkan suara Anda…" : userMsgCount === 0 ? "Ceritakan keahlian Anda…" : userMsgCount < 4 ? "Jawab pertanyaan di atas…" : "Satu jawaban lagi untuk Blueprint Anda…"}
              disabled={loading || generatingBP || isListening}
              className="flex-1 text-xs h-8"
              data-testid="input-gustafta-chat"
            />
            {speechSupported && (
              <button
                onClick={toggleMic}
                disabled={loading || generatingBP}
                className={`shrink-0 p-1.5 rounded-lg transition-all ${isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"}`}
                title={isListening ? "Berhenti" : "Rekam suara"}
                data-testid="button-mic-landing"
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
            )}
            <Button onClick={send} disabled={loading || generatingBP || !input.trim() || isListening} size="sm"
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white h-8 px-2.5"
              data-testid="button-gustafta-send">
              {(loading || generatingBP) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {userMsgCount === 0 ? "Sesi Socratic gratis — menuju Blueprint AI Anda" : `Langkah ${userMsgCount + 1} dari 5 menuju Blueprint`}
          </p>
        </div>
      )}
    </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";
  const waUrl = "https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Gustafta";

  return (
    <div className="min-h-screen bg-background" data-testid="page-landing">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.3),transparent_60%)]" />

        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-6 backdrop-blur-sm">
            <Wrench className="h-3.5 w-3.5" />
            Platform Penyelesaian Masalah
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight" data-testid="text-hero-title">
            Punya Masalah yang Berulang Setiap Hari?
            <br />
            <span className="text-yellow-300">Dari Masalah, Menjadi Hasil Nyata.</span>
          </h1>

          <p className="text-base md:text-lg text-blue-100 mb-2 font-semibold tracking-wide">
            Dialog · Blueprint · Kolaborasi · Workroom · Hasil
          </p>

          <p className="text-sm md:text-base text-blue-200 mb-8 leading-relaxed max-w-2xl mx-auto">
            Pekerjaan yang menumpuk, pertanyaan yang berulang, SOP yang tak sempat dibaca — semua itu masalah nyata. Gustafta bukan cuma menjawab lalu selesai: kami mengubah pengetahuan, pengalaman, dan SOP Anda menjadi{" "}
            <strong className="text-white">Cetak Biru AI (Blueprint)</strong>, lalu mengawal Anda mengerjakannya di{" "}
            <strong className="text-white">Workroom</strong> — sendiri atau bersama satu tim AI — sampai dokumen, proposal, atau produk benar-benar selesai. Tanpa harus bisa coding.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link href="/persona">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 font-bold gap-2 px-6 h-12" data-testid="button-hero-starterkit">
                <BookOpen className="w-4 h-4" />
                Mulai dengan Starter Kit
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 gap-2 px-6 h-12"
              onClick={() => {
                const el = document.getElementById("trilogi");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              data-testid="button-hero-dialog"
            >
              <Bot className="w-4 h-4" />
              Tanya Gustafta Dulu
            </Button>
          </div>

          <div className="mb-8">
            <Link href="/organization-builder">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-300 hover:text-yellow-200 cursor-pointer" data-testid="link-hero-rakit-tim">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-300/20 text-[10px] font-bold uppercase tracking-wider">Baru</span>
                Rakit satu tim AI — bukan cuma satu chatbot
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-blue-200 justify-center mb-10">
            {["No-Code · Tanpa Coding", "30+ Sektor Industri", "1350+ Template Siap Pakai"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-400" />{s}
              </span>
            ))}
          </div>

          <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-2xl bg-black/30 backdrop-blur-sm">
            <video
              src={explainerVideo}
              poster={explainerPoster}
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full aspect-video"
              data-testid="video-hero-explainer"
            />
          </div>
        </div>
      </section>

      {/* ── DUA DUNIA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Dari Mana Pun Anda Berasal</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Anda Mungkin Berasal dari Dua Dunia yang Berbeda…
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Dunia 1 */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-7">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Anda sudah belajar AI…</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-5">
                {[
                  "Sudah mencoba ChatGPT",
                  "Sudah mengikuti kursus AI",
                  "Sudah mengenal AI Agent, Agentic AI, Multi-Agent, Prompt Engineering",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/70 dark:bg-white/5 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-1">Tetapi… Anda masih bertanya:</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  "Bagaimana cara membuat AI yang benar-benar bekerja?"
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Bagaimana membangun AI Agent? Bagaimana mengubah semua pengetahuan itu menjadi produk nyata?</p>
              </div>
            </div>

            {/* Dunia 2 */}
            <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-7">
              <div className="text-3xl mb-3">👷</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Anda sudah menjadi seorang profesional…</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-5">
                {[
                  "Anda memiliki pengalaman dan kompetensi",
                  "Anda memiliki SOP, regulasi, modul pelatihan",
                  "Anda memiliki metode kerja yang terbukti",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/70 dark:bg-white/5 border border-violet-200 dark:border-violet-700 rounded-xl p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-1">Tetapi… Anda masih bertanya:</p>
                <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                  "Bagaimana cara mengubah semua pengalaman itu menjadi AI?"
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Bagaimana AI membantu pekerjaan saya? Bagaimana AI menjadi aset bisnis saya?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRIDGE ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-violet-700 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-4">Apa Pun Titik Awal Anda…</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tujuan Kita Sama.<br />
            <span className="text-yellow-300">Menjadi Perakit AI.</span>
          </h2>
          <p className="text-blue-100 text-base leading-relaxed mb-6 max-w-2xl mx-auto">
            GUSTAFTA hadir untuk menjembatani keduanya. Bukan sekadar mengajari AI. Bukan sekadar membuat chatbot. Tetapi membantu Anda mengubah pengetahuan menjadi AI yang benar-benar bekerja.
          </p>
          <div className="inline-block bg-white/15 border border-white/30 rounded-2xl px-8 py-4">
            <div className="flex flex-wrap gap-4 justify-center text-sm font-bold">
              {["📚 Belajar", "🛠 Merakit", "⚡ Menggunakan", "💡 Menghasilkan", "🚀 Berkembang"].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRILOGI GUSTAFTA — ALUR PIKIR ── */}
      <section className="py-20 px-4 bg-gray-950 text-white overflow-hidden relative" id="trilogi">
        {/* subtle grid bg */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="max-w-4xl mx-auto relative">
          {/* Label */}
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">Alur Pikir Gustafta</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Semua Dimulai<br className="sm:hidden" /> dari <span className="text-teal-400">Satu Dialog.</span>
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
              Sebelum ada AI, sebelum ada chatbot — ada sebuah percakapan sederhana yang mengubah segalanya.
              Inilah alur pikir di balik Gustafta.
            </p>
          </div>

          {/* 4 tahap */}
          <div className="grid gap-0 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute left-[calc(50%-1px)] top-12 bottom-12 w-0.5 bg-gradient-to-b from-gray-700 via-teal-600/40 to-gray-700" />

            {[
              {
                num: "01",
                label: "Monolog",
                color: "text-gray-400",
                border: "border-gray-700",
                bg: "bg-gray-800/50",
                dot: "bg-gray-500",
                desc: "Pengetahuan Anda hanya ada di dalam kepala. Anda yang berpikir, Anda yang memutuskan, Anda yang tahu — tetapi tidak ada yang mendengar, tidak ada yang bertanya. Pengetahuan itu diam.",
                side: "right",
              },
              {
                num: "02",
                label: "Dialog",
                color: "text-teal-400",
                border: "border-teal-600/50",
                bg: "bg-teal-950/40",
                dot: "bg-teal-500",
                desc: "Ketika pengetahuan itu dikeluarkan — lewat percakapan — ia mulai bergerak. Dipertanyakan. Diperjelas. Diuji. Dialog bukan sekadar tanya-jawab: ia adalah proses membuat pengetahuan Anda menjadi nyata dan berguna.",
                side: "left",
                highlight: true,
              },
              {
                num: "03",
                label: "Kolaborasi",
                color: "text-violet-400",
                border: "border-violet-600/40",
                bg: "bg-violet-950/30",
                dot: "bg-violet-500",
                desc: "Dialog yang berulang melahirkan ritme. Dua pihak tidak lagi bergantian — mereka mulai bergerak bersama. AI bukan alat yang Anda perintah; ia menjadi mitra yang membantu Anda berpikir dan bekerja lebih jauh dari yang bisa Anda lakukan sendiri.",
                side: "right",
              },
              {
                num: "04",
                label: "Kreasi",
                color: "text-amber-400",
                border: "border-amber-600/40",
                bg: "bg-amber-950/20",
                dot: "bg-amber-500",
                desc: "Dari kolaborasi yang konsisten, muncul sesuatu yang baru — produk, layanan, solusi — yang tidak bisa lahir dari monolog sendirian. Inilah titik di mana pengetahuan Anda berubah menjadi nilai yang dirasakan orang lain.",
                side: "left",
              },
            ].map((tahap, i) => (
              <div key={tahap.num} className={`flex items-center gap-6 md:gap-10 py-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col md:flex-row`}>
                {/* Card */}
                <div className={`flex-1 rounded-2xl border ${tahap.border} ${tahap.bg} p-6 backdrop-blur-sm ${tahap.highlight ? "ring-1 ring-teal-500/30" : ""}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-black ${tahap.color} opacity-60`}>{tahap.num}</span>
                    <span className={`text-lg font-bold ${tahap.color}`}>{tahap.label}</span>
                    {tahap.highlight && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">Titik Awal</span>}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{tahap.desc}</p>
                </div>

                {/* Center dot */}
                <div className={`w-4 h-4 rounded-full ${tahap.dot} shrink-0 ring-4 ring-gray-950 relative z-10 hidden md:block`} />

                {/* Spacer for opposite side */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>

          {/* Insight */}
          <div className="mt-10 mb-10 text-center">
            <div className="inline-block rounded-2xl border border-teal-500/20 bg-teal-950/20 px-6 py-5 max-w-2xl">
              <p className="text-sm text-teal-300 leading-relaxed">
                <span className="font-bold text-white">Gustafta percaya:</span> transformasi terbesar dalam karier profesional tidak dimulai dari membeli tool atau belajar coding —{" "}
                <span className="font-semibold text-teal-400">melainkan dari satu dialog yang jujur tentang siapa Anda dan apa yang Anda tahu.</span>
              </p>
            </div>
          </div>

          {/* CTA — bukan floating chatbot */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Rasakan langsung alurnya — AI akan memandu Anda dari Dialog menuju Blueprint chatbot Anda sendiri.</p>
            <button
              onClick={() => setShowDialog(true)}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-base transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5"
              data-testid="button-trilogi-cta"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Mulai Dialog Sekarang
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <p className="text-xs text-gray-600 mt-3">Gratis · Tanpa daftar · Blueprint tersimpan otomatis</p>
          </div>
        </div>
      </section>

      {/* ── VIDEO EXPLAINER (SELINGAN TENGAH) ── */}
      <section className="py-16 px-4 bg-white dark:bg-background" data-testid="section-video-explainer">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Kenali Lebih Dekat</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Bagaimana Gustafta Bekerja
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Tonton sebentar — bagaimana pengetahuan Anda dirakit menjadi AI yang benar-benar bekerja.
          </p>
          <div className="relative rounded-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-2xl bg-black/5 dark:bg-black/30">
            <video
              src={overviewVideo}
              poster={overviewPoster}
              className="w-full aspect-video"
              controls
              muted
              loop
              playsInline
              preload="metadata"
              data-testid="video-overview-explainer"
            />
          </div>
        </div>
      </section>

      {/* ── DARI PENGETAHUAN MENJADI AI ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Kekayaan Pengetahuan Anda</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Dari Pengetahuan Menjadi Aset AI
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Setiap orang memiliki sesuatu yang sangat berharga. Selama ini semua itu hanya tersimpan di kepala atau di folder komputer. Dengan GUSTAFTA, semuanya dapat dirakit menjadi AI.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 items-start">
            {/* Input: Pengetahuan */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Pengetahuan yang Anda miliki</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Pengalaman kerja", "Kompetensi profesi", "Dokumen & SOP",
                  "Prosedur standar", "Regulasi & kebijakan", "Modul pelatihan",
                  "Metode kerja", "Ide & inovasi",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-muted/30 rounded-lg px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Output: AI */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-6">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">AI yang mampu bekerja untuk Anda</p>
              <div className="space-y-2">
                {[
                  { icon: "💬", text: "Menjawab pertanyaan" },
                  { icon: "🤝", text: "Membantu pekerjaan" },
                  { icon: "📄", text: "Menghasilkan dokumen" },
                  { icon: "👤", text: "Menjadi asisten digital" },
                  { icon: "🎓", text: "Membimbing pelanggan & peserta" },
                  { icon: "📦", text: "Menjadi produk digital" },
                  { icon: "💰", text: "Menciptakan nilai bagi bisnis" },
                  { icon: "👥", text: "Mendukung tim" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{item.icon} {item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5-STAGE JOURNEY ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Perjalanan Menjadi Perakit AI</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Satu Platform. Lima Perjalanan.
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Dari pengetahuan yang Anda miliki hingga menjadi bisnis AI — lima tahap yang saling terhubung. Ketuk tiap tahap untuk melihat detailnya.
            </p>
          </div>

          <Accordion type="single" collapsible defaultValue="stage-0" className="space-y-3">
            {[
              {
                emoji: "📚", num: "01", label: "BELAJAR",
                color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
                badge: "bg-blue-600",
                title: "Mulailah dari Starter Kit GUSTAFTA",
                desc: "Pelajari cara berpikir sebagai Perakit AI. Bukan sekadar teori — tetapi langkah demi langkah membangun AI yang benar. Starter Kit berisi panduan praktis, blueprint, contoh implementasi, prompt, framework, hingga akses menuju workshop dan academy.",
                items: ["Trilogi GUSTAFTA (Panduan + Playbook + Prompt)", "GUSTAFTA Framework™", "Panduan Onboarding step-by-step", "Akses Komunitas Perakit AI", "Akses Builder 7 hari"],
                cta: "Ambil Starter Kit", href: "/persona",
              },
              {
                emoji: "🛠", num: "02", label: "MERAKIT",
                color: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20",
                badge: "bg-violet-600",
                title: "Bangun AI Anda Sendiri di GUSTAFTA Builder",
                desc: "Dengan GUSTAFTA Builder Anda dapat merakit AI Assistant, Chatbot AI, AI Agent, Multi-Agent, Knowledge Base, Mini Apps, Workflow AI, dan OpenClaw Configuration — semuanya secara visual tanpa coding. Teknologi AI terbaru sudah tersedia.",
                items: ["AI Assistant & Chatbot AI", "AI Agent & Multi-Agent", "Knowledge Base & Mini Apps", "Blueprint Builder — rancang lewat dialog", "Rakit Tim AI — satu misi jadi tim agen", "Kolaborasi & berbagi chatbot dengan tim", "Workflow AI & OpenClaw", "Tanpa coding · Semua via form"],
                cta: "Masuk ke Builder", href: builderUrl,
              },
              {
                emoji: "⚡", num: "03", label: "MENGGUNAKAN",
                color: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20",
                badge: "bg-emerald-600",
                title: "AI yang Anda Rakit Mulai Bekerja",
                desc: "Gunakan AI untuk membantu pelanggan, menyusun laporan, membuat proposal, menghasilkan dokumen, membuat SOP, menghitung RAB, membuat kontrak, menyusun materi pelatihan. Atau gunakan chatbot siap pakai dari GUSTAFTA Store.",
                items: ["Bantu pelanggan 24/7", "Generate dokumen & kontrak", "Hitung RAB & estimasi biaya", "Susun materi pelatihan", "Pendamping proses sertifikasi", "Chatbot bersertifikat & tepercaya"],
                cta: "Lihat Chatbot Store", href: "/store",
              },
              {
                emoji: "💡", num: "04", label: "MENGHASILKAN NILAI",
                color: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20",
                badge: "bg-amber-600",
                title: "AI adalah Aset — Bukan Sekadar Alat",
                desc: "\"Nilai\" bukan hanya uang. Bisa berupa waktu, produktivitas, reputasi, kompetensi, atau penghasilan nyata. Jual hasil rakitan Anda melalui Creator Marketplace — atau gunakan AI untuk membuka layanan baru bagi klien.",
                items: ["Jual chatbot di Creator Marketplace", "Revenue sharing 80/20 untuk creator", "Layanan konsultasi berbasis AI", "Penghasilan dari kompetensi yang Anda miliki"],
                cta: "Lihat Program Affiliate & Creator", href: "/affiliate",
              },
              {
                emoji: "🚀", num: "05", label: "BERKEMBANG",
                color: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20",
                badge: "bg-orange-600",
                title: "Dari Perakit AI — Menjadi Pelaku Bisnis AI.",
                desc: "Ini bukan lagi tentang memakai AI. Ini tentang membangun bisnis, organisasi, atau ekosistem berbasis AI. Dua jalur tersedia: naik level sebagai Perakit AI Profesional, atau bangun ekosistem AI untuk tim & perusahaan Anda.",
                items: ["Naik level: Pemula → Profesional → Creator → Enterprise", "Sertifikasi Perakit AI (Certified AI Assembler)", "Buka jasa konsultasi AI sendiri", "AI Studio — tim Gustafta rakitkan untuk Anda", "Kemitraan Bisnis AI", "Corporate Training & AI Organization"],
                cta: "Mulai Berkembang", href: "/packs",
              },
            ].map((stage, idx) => (
              <AccordionItem
                key={stage.num}
                value={`stage-${idx}`}
                className={`rounded-2xl border ${stage.color} px-5 overflow-hidden`}
                data-testid={`accordion-stage-${stage.label.toLowerCase()}`}
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl ${stage.badge} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                      {stage.num}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${stage.badge} w-fit`}>
                        {stage.emoji} {stage.label}
                      </span>
                      <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{stage.title}</h3>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{stage.desc}</p>
                  {stage.items && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
                      {stage.items.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />{item}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href={stage.href}>
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" data-testid={`btn-stage-${stage.label.toLowerCase()}`}>
                      {stage.cta} <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── BARU DI GUSTAFTA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">✨ Baru di Gustafta</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Kini Anda Merakit Tim AI, Bukan Sekadar Satu Chatbot
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Susun satu tim agen AI yang saling bekerja sama, rancang lewat dialog, kerja bareng rekan, dan bangun kepercayaan lewat chatbot bersertifikat — semuanya dalam satu platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                emoji: "🧩",
                accent: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20",
                title: "Rakit Tim AI",
                desc: "Cukup ceritakan satu misi — Gustafta menyusunkan satu tim agen AI lengkap yang saling bekerja sama, bukan hanya satu chatbot.",
                cta: "Coba Rakit Tim AI", href: "/organization-builder",
              },
              {
                emoji: "💬",
                accent: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
                title: "Blueprint Builder",
                desc: "Rancang chatbot Anda lewat dialog terpandu. Jawab beberapa pertanyaan, dan konfigurasi siap pakai langsung terbentuk — tanpa teknis.",
                cta: "Mulai Blueprint", href: "/blueprint-builder",
              },
              {
                emoji: "🤝",
                accent: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20",
                title: "Kolaborasi Tim",
                desc: "Bagikan chatbot ke rekan lewat email dan atur perannya. Undangan otomatis aktif saat mereka mendaftar, lengkap dengan notifikasi di dalam aplikasi.",
                cta: "Kelola di Dashboard", href: builderUrl,
              },
              {
                emoji: "✅",
                accent: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20",
                title: "Chatbot Bersertifikat",
                desc: "Chatbot tepercaya di GUSTAFTA Store kini punya badge \"Bersertifikat\" — jaminan kualitas agar pembeli lebih yakin memilih.",
                cta: "Lihat di Store", href: "/store",
              },
              {
                emoji: "🐾",
                accent: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20",
                title: "MultiClaw Suite",
                desc: "80 chatbot AI premium siap pakai lintas bidang — tiap \"claw\" menurunkan beberapa spesialis paralel untuk analisis, desain, dan perhitungan.",
                cta: "Jelajahi MultiClaw", href: "/multiclaw",
              },
              {
                emoji: "🛠️",
                accent: "border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/20",
                title: "AI Tools Hub",
                desc: "Kumpulan alat AI siap pakai — Kalkulator RAB, Inspektor K3 Vision, Generator Proposal, dan lainnya — langsung pakai tanpa merakit.",
                cta: "Buka AI Tools", href: "/ai-tools",
              },
              {
                emoji: "🏗️",
                accent: "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20",
                title: "Workroom",
                desc: "Bukan cuma jawaban di layar — kerjakan masalah Anda bertahap per bidang lewat Ruang Tender, Ruang Perizinan, Ruang Sertifikasi SKK, Ruang K3, dst sampai gerbang persetujuan ◆ dan hasil nyata.",
                cta: "Buka Workroom", href: "/workroom",
              },
            ].map((f) => (
              <div key={f.title} className={`rounded-2xl border ${f.accent} p-6 flex flex-col`}>
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1">{f.desc}</p>
                <Link href={f.href}>
                  <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" data-testid={`btn-baru-${f.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {f.cta} <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            <span>🔎</span>
            <span>Transparan &amp; jujur: setiap jawaban AI diberi label agar Anda tahu mana yang perlu diperiksa sebelum dipakai.</span>
          </div>
        </div>
      </section>

      {/* ── TENDER ALERT PROMO ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: pitch */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                    <Bell className="w-3 h-3" /> Fitur Berbayar
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Untuk Pelaku Usaha
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                  Jangan Sampai Kelewatan Tender Lagi
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Tender Alert memantau pengumuman tender pemerintah (SIRUP LKPP) dan mengirimkan
                  notifikasi harian yang sudah dicocokkan dengan bidang usaha Anda — langsung ke
                  WhatsApp dan email. Anda cukup fokus menyiapkan penawaran.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="btn-tender-alert-activate">
                    <Link href="/tender-alert">
                      Aktifkan Tender Alert <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="gap-1.5" data-testid="btn-tender-monitor-view">
                    <Link href="/tender-monitor">
                      Lihat Monitor Tender
                    </Link>
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4">
                  Tersedia mulai paket Starter. Butuh dulu? <Link href="/pricing" className="underline hover:text-emerald-600" data-testid="link-tender-pricing">Lihat paket langganan</Link>.
                </p>
              </div>

              {/* Right: benefit list */}
              <div className="bg-white/60 dark:bg-background/40 border-t md:border-t-0 md:border-l border-emerald-100 dark:border-emerald-900 p-8 md:p-10 flex flex-col justify-center gap-5">
                {[
                  { icon: Target, title: "Dicocokkan otomatis", desc: "Hanya tender yang relevan dengan bidang & lokasi usaha Anda." },
                  { icon: Clock, title: "Notifikasi harian 08:00 WIB", desc: "Rangkuman tender baru setiap pagi, tepat waktu." },
                  { icon: Mail, title: "WhatsApp + Email", desc: "Terima peringatan lewat dua saluran sekaligus." },
                  { icon: FileText, title: "Data resmi SIRUP LKPP", desc: "Sumber pengadaan pemerintah, bukan tebakan." },
                ].map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <b.icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{b.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KLINIK KONSULTASI ── */}
      <section className="py-16 px-4 bg-white dark:bg-background" data-testid="section-klinik-konsultasi">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> Dikerjakan AI
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Klinik Konsultasi
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Pilih loket sesuai kebutuhan Anda, lalu biarkan AI langsung mengerjakannya kapan saja — operator manusia hanya untuk kasus khusus. Tersedia loket untuk badan usaha maupun individu profesional, lintas bidang.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {[
              {
                title: "Untuk Badan Usaha & Perizinan",
                partners: "ASPEKINDO · LSBU · PUB",
                accent: "text-rose-600 dark:text-rose-400",
                border: "border-rose-200 dark:border-rose-800",
                items: ["Loket SBU", "Loket Perizinan (OSS)", "Loket Tender", "Loket Kontraktor", "Loket Konsultan", "Loket PUB (LKUT)"],
              },
              {
                title: "Untuk Individu Profesional",
                partners: "ASDAMKINDO · LSP · BNSP · KAN",
                accent: "text-teal-600 dark:text-teal-400",
                border: "border-teal-200 dark:border-teal-800",
                items: ["Loket SKK", "Loket SKK K3", "Loket PKB", "Loket ASKOM", "Loket Lisensi BNSP", "Loket Akreditasi KAN"],
              },
            ].map((g) => (
              <div key={g.title} className={`rounded-2xl border ${g.border} bg-gray-50 dark:bg-muted/20 p-6`}>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{g.title}</h3>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-4 ${g.accent}`}>{g.partners}</p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((it) => (
                    <span key={it} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white dark:bg-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300" data-testid={`chip-loket-${it}`}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" data-testid="btn-ruang-kerja">
              <Link href="/klinik-konsultasi">
                Masuk Klinik Konsultasi <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── EVENT: INDOBUILDTECH 2026 ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20" data-testid="section-indobuildtech">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-background p-8 md:p-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-600 text-white">
                <CalendarDays className="w-3 h-3" /> Event
              </span>
              <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                ASDAMKINDO × Gustafta
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              Seminar Nasional Indobuildtech 2026
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 max-w-2xl">
              Tema "Perkuatan Bangunan Miring". Kunjungi booth kami dan lihat langsung cara merakit chatbot AI konstruksi — plus bonus eksklusif untuk peserta seminar.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-6">
              <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Kamis, 9 Juli 2026 · 13.00–17.30 WIB
            </p>
            <div>
              <Button asChild size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700 text-white" data-testid="btn-indobuildtech">
                <Link href="/indobuildtech">
                  Lihat Detail Event <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── APA YANG INGIN DIRAKIT ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Apa yang Ingin Anda Rakit?</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Jika Anda Memiliki Pengetahuan…<br />
              Anda Dapat Merakitnya Menjadi AI.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
            {[
              { icon: "👤", label: "Mentor AI" },
              { icon: "📚", label: "Tutor AI" },
              { icon: "🏢", label: "AI Perusahaan" },
              { icon: "⚖", label: "AI Regulasi" },
              { icon: "🏗", label: "AI Konstruksi" },
              { icon: "⚡", label: "AI Energi" },
              { icon: "⛏", label: "AI Pertambangan" },
              { icon: "🌱", label: "AI Lingkungan" },
              { icon: "📄", label: "AI Dokumen" },
              { icon: "🎓", label: "AI Sertifikasi" },
              { icon: "💼", label: "AI Konsultan" },
              { icon: "📊", label: "AI Bisnis" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 flex items-center gap-2.5 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden border shadow-lg">
            <img
              src="/images/g07.png"
              alt="Contoh ekosistem digital yang dirakit di Gustafta Builder"
              className="w-full object-cover"
              loading="lazy"
              data-testid="img-output-showcase"
            />
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            Contoh chatbot dan ekosistem AI yang sudah dirakit oleh pengguna Gustafta.
          </p>
        </div>
      </section>

      {/* ── PILIH CARA MEMULAI ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Pilih Cara Memulai</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Empat Jalur Masuk ke Ekosistem Gustafta
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                emoji: "📚", label: "Belajar Merakit AI",
                desc: "Mulailah dengan Starter Kit, Workshop, dan Academy. Belajar secara bertahap hingga siap menjadi Perakit AI.",
                cta: "Ambil Starter Kit", href: "/persona",
                color: "border-blue-200 dark:border-blue-800 hover:border-blue-400",
                badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
              },
              {
                emoji: "🛠", label: "Merakit AI Sendiri",
                desc: "Gunakan GUSTAFTA Builder untuk membangun AI sesuai bidang Anda. Semua via form, tanpa coding.",
                cta: "Buka Builder", href: builderUrl,
                color: "border-violet-200 dark:border-violet-800 hover:border-violet-400",
                badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
              },
              {
                emoji: "⚡", label: "Menggunakan AI",
                desc: "Pilih chatbot siap pakai dari GUSTAFTA Store. Langsung aktif, langsung bekerja.",
                cta: "Lihat Store", href: "/store",
                color: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400",
                badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
              },
              {
                emoji: "🤝", label: "Kami Rakitkan",
                desc: "Tidak punya waktu? Tim GUSTAFTA siap membantu merancang, membangun, dan mengimplementasikan AI sesuai kebutuhan Anda.",
                cta: "Konsultasi WA", href: waUrl, external: true,
                color: "border-amber-200 dark:border-amber-800 hover:border-amber-400",
                badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
              },
            ].map((jalur) => (
              <div key={jalur.label} className={`rounded-2xl border bg-gray-50 dark:bg-muted/20 ${jalur.color} p-5 flex flex-col gap-3 transition-colors`}
                data-testid={`card-jalur-${jalur.label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="text-3xl">{jalur.emoji}</div>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${jalur.badge}`}>{jalur.label}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{jalur.desc}</p>
                {jalur.external ? (
                  <a href={jalur.href} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1">
                      {jalur.cta} <ArrowRight className="w-3 h-3" />
                    </Button>
                  </a>
                ) : (
                  <Link href={jalur.href}>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1">
                      {jalur.cta} <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO PLATFORM ── */}
      <section className="py-16 px-4 bg-blue-50 dark:bg-blue-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Platform Bekerja</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Dari Pengetahuan Menjadi AI — Tanpa Coding
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Lihat bagaimana Gustafta Builder mengubah pengetahuan Anda menjadi ekosistem AI yang hidup dan bekerja 24/7.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border shadow-lg bg-black/5 dark:bg-white/5">
            <video
              src="/videos/gustafta-monolog-to-dialog.mp4"
              className="w-full"
              controls
              playsInline
              preload="metadata"
              data-testid="video-platform"
            />
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            Lihat bagaimana pengetahuan satu arah berubah menjadi dialog yang hidup.
          </p>
        </div>
      </section>

      {/* ── CREATOR PERSONAS ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Untuk Siapa</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Siapa Pun yang Punya Pengetahuan — Bisa Menjadi Perakit AI
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji: "🎓", label: "Instruktur & Trainer", desc: "Rakit modul pelatihan, panduan digital, dan chatbot pendamping untuk peserta Anda." },
              { emoji: "🏛️", label: "Asosiasi Profesi & Badan Usaha", desc: "Bangun ekosistem kompetensi anggota — dari sertifikasi hingga pembelajaran berkelanjutan." },
              { emoji: "📜", label: "Lembaga Sertifikasi (LSP)", desc: "Sediakan simulasi asesmen, bank soal, dan panduan kompetensi yang bisa diakses 24/7." },
              { emoji: "🏫", label: "Universitas & Lembaga Pendidikan", desc: "Digitalisasi materi dosen menjadi ekosistem belajar yang skalabel." },
              { emoji: "💼", label: "Konsultan Independen", desc: "Kemas keahlian Anda menjadi produk digital — chatbot konsultasi, document generator, mini apps." },
              { emoji: "👤", label: "Individu Profesional", desc: "Wariskan pengalaman 10–20 tahun menjadi AI Twin yang terus bekerja untuk Anda." },
            ].map((p) => (
              <div key={p.label} className="rounded-2xl border bg-gray-50 dark:bg-muted/20 p-5 flex flex-col gap-3"
                data-testid={`card-persona-${p.label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{p.label}</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILOSOFI PENUTUP ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-900 to-slate-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6">🧠</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            AI Tidak Menggantikan Keahlian Anda.
          </h2>
          <h3 className="text-xl md:text-2xl font-bold text-yellow-300 mb-6">
            AI Memperkuat Keahlian Anda.
          </h3>
          <p className="text-gray-300 leading-relaxed text-base mb-2">
            Karena yang paling berharga bukan teknologinya.
          </p>
          <p className="text-gray-300 leading-relaxed text-base mb-8">
            Tetapi <strong className="text-white">pengetahuan yang Anda miliki.</strong>
          </p>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            GUSTAFTA membantu Anda mengubahnya menjadi AI yang mampu bekerja untuk diri Anda, tim, organisasi, maupun pelanggan.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-violet-700 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-4">GUSTAFTA — Platform Penyelesaian Masalah</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ubah Masalah Anda Menjadi<br />
            <span className="text-yellow-300">Hasil Nyata.</span>
          </h2>
          <p className="text-blue-200 text-sm mb-8">
            Dialog · Blueprint · Kolaborasi · Workroom · Hasil
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/persona">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-final-starter">
                <BookOpen className="h-5 w-5" />
                Mulai dengan Starter Kit
              </Button>
            </Link>
            <Link href={builderUrl}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-cta-final-builder">
                <Wrench className="h-5 w-5" />
                Mulai Merakit AI Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Pertanyaan yang Sering Muncul</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: "Apakah saya perlu kemampuan coding?",
                a: "Tidak sama sekali. Semua konfigurasi di Gustafta Builder dilakukan lewat form. Tidak ada satu baris kode pun yang perlu Anda tulis.",
              },
              {
                q: "Apa bedanya Gustafta dengan ChatGPT atau platform chatbot lain?",
                a: "ChatGPT menjawab pertanyaan lalu selesai di situ. Gustafta mengawal seluruh alurnya: masalah Anda → Dialog (memahami) → Blueprint (cetak biru solusi) → Workroom (dikerjakan bertahap per bidang, dengan gerbang persetujuan ◆) → hasil nyata berupa dokumen, proposal, atau produk — bukan cuma jawaban di layar.",
              },
              {
                q: "Saya sudah profesional tapi tidak tahu AI — bisa pakai Gustafta?",
                a: "Justru inilah target utama Gustafta. Pengetahuan dan pengalaman Anda adalah modal utamanya. Starter Kit akan memandu Anda langkah demi langkah dari nol hingga memiliki AI pertama Anda.",
              },
              {
                q: "Apa yang saya miliki setelah merakit?",
                a: "Ekosistem digital penuh — Anda pemilik data, konten, dan monetisasinya. Gustafta tidak mengunci ekosistem Anda. Bisa digunakan untuk diri sendiri, tim, atau dijual ke orang lain.",
              },
              {
                q: "Bisakah saya menghasilkan uang dari Gustafta?",
                a: "Bisa. Lewat Creator Marketplace dengan revenue sharing 80/20, atau langsung ke klien Anda sendiri lewat layanan yang Anda atur. Pengetahuan Anda adalah aset — Gustafta membantu mengubahnya menjadi produk.",
              },
              {
                q: "Apakah Gustafta hanya untuk sektor konstruksi?",
                a: "Tidak. 30+ sektor industri sudah didukung — konstruksi, energi, HR, pendidikan, keuangan, hukum, dan lainnya. Konstruksi hanya yang paling dalam saat ini.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 dark:text-white text-left hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-gray-50 dark:bg-muted/10 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white">GUSTAFTA</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Platform Penyelesaian Masalah Berbasis AI
              </p>
              <p className="text-xs text-gray-400 mt-2 italic">Dialog · Blueprint · Kolaborasi · Workroom · Hasil</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Platform</p>
              <ul className="space-y-2">
                {[
                  { label: "Gustafta Builder", href: builderUrl },
                  { label: "MultiClaw Suite", href: "/ai-tools" },
                  { label: "Chatbot Store", href: "/store" },
                  { label: "Layanan Jasa", href: "/packs" },
                ].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Perakit AI</p>
              <ul className="space-y-2">
                {[
                  { label: "Starter Kit", href: "/persona" },
                  { label: "Workshop", href: "/workshop" },
                  { label: "Panduan & Belajar", href: "/trilogi" },
                  { label: "Profil GAIA", href: "/profil" },
                ].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Kontak</p>
              <ul className="space-y-2">
                <li className="text-xs text-gray-500 dark:text-gray-400">📞 0812-8794-1900</li>
                <li>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© 2026 Gustafta. Platform Penyelesaian Masalah Berbasis AI.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link href="/syarat-ketentuan" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" data-testid="link-syarat-ketentuan">Syarat &amp; Ketentuan</Link>
              <Link href="/kebijakan-privasi" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" data-testid="link-kebijakan-privasi">Kebijakan Privasi</Link>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <ShieldCheck className="h-3 w-3" />
                Pembayaran aman via Scalev.id
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialog panel — dipanggil dari section Trilogi */}
      <GustaftaFloatingChat isOpen={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
