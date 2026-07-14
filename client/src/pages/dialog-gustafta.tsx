import { useState, useRef, useEffect, useCallback } from "react";
import { MessageContent } from "@/lib/format-message";
import {
  Send, X, RefreshCw, Share2, Copy, MessageCircle,
  Sparkles, ArrowRight, Check, ChevronRight, RotateCcw, Rocket, Loader2,
  Mic, MicOff, Paperclip, Phone, PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { dialogBlueprintToOrgDraft } from "@shared/proposal-to-org";
import { usePartnerBranding } from "@/hooks/use-partner-branding";
import { trackLead } from "@/lib/meta-pixel";

const ORG_PREFILL_KEY = "gustafta_org_prefill_v1";

// ── Types ────────────────────────────────────────────────────────────────────
interface Msg { role: "user" | "assistant"; content: string; }

interface ProfilAwal {
  bidang: string;
  tantangan: string;
  potensi: string;
  rekomendasiChatbot: string;
}

interface GambaranTajam {
  judul: string;
  ringkasan: string;
  kekuatan: string[];
  peluang: string;
}

interface Blueprint {
  judul: string;
  ringkasan: string;
  langkahAwal: string[];
  namaChatbot: string;
  persona: string;
  targetPengguna: string;
  estimasiDampak: string;
}

type AppStage =
  | "s1_chat"     // Stage 1 — 5 chat bebas
  | "s1_gate"     // Gate 1 — Profil Awal
  | "s2_chat"     // Stage 2 — 10–15 chat lebih dalam
  | "s2_gate"     // Gate 2 — Gambaran Tajam + tawaran lanjut
  | "s3_chat"     // Stage 3 — 25 chat pendalaman (perlu unlock)
  | "blueprint";  // Final — Blueprint lengkap

interface SavedSession {
  stage: AppStage;
  messages: Msg[];
  profil: ProfilAwal | null;
  gambaran: GambaranTajam | null;
  blueprint: Blueprint | null;
  s1Count: number;
  s2Count: number;
  s3Count: number;
  s3Unlocked: boolean;
  profesi: string;
  savedAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const LS_KEY = "gustafta_dialog_v2";
const S1_LIMIT = 5;
const S2_LIMIT = 10;
const S3_LIMIT = 20;

const greetingFor = (brand: string) => `Halo! Saya Dialog ${brand} — Teman Berpikir kamu. 🌟

Saya hadir bukan untuk menjawab, tapi untuk *menggali* — karena saya yakin kamu punya potensi dan pengalaman luar biasa yang belum sempat diartikulasikan.

Ceritakan padaku — kamu bekerja di bidang apa, atau ada tantangan apa yang ingin kamu selesaikan?`;

const GREETING = greetingFor("Gustafta");

const DEFAULT_WA = "6282299417818";

const waUrl = (text: string, phone: string = DEFAULT_WA) => {
  trackLead({ content_name: "WhatsApp CTA" });
  return `https://wa.me/${phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch { return null; }
}

function saveSession(s: SavedSession) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: new Date().toISOString() })); }
  catch { /* storage full — silent */ }
}

function clearSession() { localStorage.removeItem(LS_KEY); }

function blueprintToText(b: Blueprint, profil?: ProfilAwal | null, brand: string = "Gustafta", partnerMode = false): string {
  return `📋 BLUEPRINT EKOSISTEM AI — ${b.judul}

${b.ringkasan}

🤖 CHATBOT YANG DIREKOMENDASIKAN
Nama: ${b.namaChatbot}
Persona: ${b.persona}
Target: ${b.targetPengguna}

✅ LANGKAH PERTAMA
${b.langkahAwal.map((l, i) => `${i + 1}. ${l}`).join("\n")}

📈 ESTIMASI DAMPAK
${b.estimasiDampak}

${profil ? `👤 PROFIL AWAL\nBidang: ${profil.bidang}\nPotensi: ${profil.potensi}` : ""}

—
${partnerMode ? `Dibuat via Konsultasi ${brand}` : "Dibuat via Konsultasi Gustafta · gustafta.my.id/konsultasi"}`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DialogGustaftaPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { partner } = usePartnerBranding();

  // Whitelabel: brand & kontak ikut mitra bila diakses dari host mitra
  const brandName = partner?.brandName || "Gustafta";
  const brandLogo = partner ? (partner.logoUrl || null) : "/logo-gustafta.png";
  const waPhone = partner?.contactPhone ? partner.contactPhone : DEFAULT_WA;
  const accentColor = partner?.primaryColor || null;

  const s3UnlockWa = waUrl(
    `Halo, saya sudah menyelesaikan Stage 2 Dialog ${brandName} dan ingin lanjut ke Stage 3 — Pendalaman Blueprint. Saya siap beli Starter Kit Rp 245.000.`,
    waPhone
  );

  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [stage, setStage] = useState<AppStage>("s1_chat");
  const [profil, setProfil] = useState<ProfilAwal | null>(null);
  const [gambaran, setGambaran] = useState<GambaranTajam | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [s1Count, setS1Count] = useState(0);
  const [s2Count, setS2Count] = useState(0);
  const [s3Count, setS3Count] = useState(0);
  const [s3Unlocked, setS3Unlocked] = useState(false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false); // gate generation
  const [hasSaved, setHasSaved] = useState(false); // show resume banner
  const [showSplash, setShowSplash] = useState(true); // intro landing screen
  const [showProfesi, setShowProfesi] = useState(false); // profesi selection step
  const [profesiDipilih, setProfesiDipilih] = useState(""); // selected profession
  const [showResume, setShowResume] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);

  // Progressive Lead Capture
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const { data: trialStatus } = useQuery<{
    dialogCompleted: boolean;
    hasActiveTrial: boolean;
    trialMessagesUsed: number;
    trialMessagesQuota: number;
  }>({
    queryKey: ["/api/trial/status"],
    enabled: !!user,
    retry: 1,
  });

  // Redirect authenticated users who already have an active trial straight to dashboard
  useEffect(() => {
    if (trialStatus?.hasActiveTrial && !trialActivated) {
      navigate("/dashboard");
    }
  }, [trialStatus?.hasActiveTrial, trialActivated, navigate]);

  const activateTrialMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/subscriptions/create", { plan: "free_trial" }),
    onSuccess: () => {
      setTrialActivated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/trial/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      toast({ title: "Trial Aktif! 🎉", description: `Kamu punya 75 pesan untuk eksplorasi ${brandName} selama 7 hari.` });
    },
    onError: (err: any) => {
      const msg = (err as Error)?.message || "Gagal mengaktifkan trial.";
      if (msg.includes("dialog_required")) {
        toast({ title: "Selesaikan dialog dulu", description: "Selesaikan hingga Stage 3 (Blueprint) untuk mengaktifkan trial.", variant: "destructive" });
      } else if (msg.includes("already") || msg.includes("existing") || msg.includes("sudah")) {
        setTrialActivated(true);
        queryClient.invalidateQueries({ queryKey: ["/api/trial/status"] });
        toast({ title: "Trial sudah aktif", description: "Kamu sudah punya trial aktif. Langsung masuk dashboard!" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendRef = useRef<() => void>(() => {});
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const phoneModeRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  useEffect(() => { phoneModeRef.current = phoneMode; }, [phoneMode]);
  useEffect(() => { aiSpeakingRef.current = aiSpeaking; }, [aiSpeaking]);

  // ── Speech API ───────────────────────────────────────────────────────────
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
      if (aiSpeakingRef.current) return; // ignore anything captured while the AI is speaking
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

  // ── Mode Telpon: baca balasan AI dengan suara, lalu dengarkan lagi ─────────
  const speakReply = (text: string) => {
    const synth = (window as any).speechSynthesis;
    if (!phoneModeRef.current || !synth || !text) return;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* noop */ } }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(
      text.replace(/```[\s\S]*?```/g, " ").replace(/[*_#>~`-]{1,3}/g, " ").replace(/\s{2,}/g, " ").trim()
    );
    utter.lang = "id-ID";
    utter.onstart = () => setAiSpeaking(true);
    utter.onend = () => {
      setAiSpeaking(false);
      if (phoneModeRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already started */ }
      }
    };
    utter.onerror = () => setAiSpeaking(false);
    synth.speak(utter);
  };

  const togglePhoneMode = () => {
    const synth = (window as any).speechSynthesis;
    setPhoneMode(prev => {
      const next = !prev;
      if (!next) {
        synth?.cancel();
        setAiSpeaking(false);
        if (recognitionRef.current && isListening) recognitionRef.current.stop();
      } else if (recognitionRef.current && !isListening) {
        try { recognitionRef.current.start(); } catch { /* noop */ }
      }
      return next;
    });
  };

  // ── File upload ──────────────────────────────────────────────────────────
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
          setInput(prev => prev ? `${prev}\n[File: ${data.fileName}]` : `[File: ${data.fileName}]`);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Whitelabel greeting (hanya sebelum dialog dimulai) ──────────────────
  useEffect(() => {
    if (!partner) return;
    setMessages(prev =>
      prev.length === 1 && prev[0].role === "assistant" && prev[0].content === GREETING
        ? [{ role: "assistant", content: greetingFor(partner.brandName || partner.name) }]
        : prev
    );
  }, [partner]);

  // ── Load saved session on mount ──────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.messages.length > 1) {
      setSavedSession(saved);
      setShowResume(true);
      setShowSplash(false); // skip splash if resuming
      setHasSaved(true);
    }
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, stage, processing]);

  // ── Auto-focus input ─────────────────────────────────────────────────────
  useEffect(() => { if (!showResume) textareaRef.current?.focus(); }, [showResume]);

  // Keep sendRef in sync for the speech onend callback
  sendRef.current = () => { if (input.trim() && !loading && !processing) sendMessage(); };

  // ── Auto-save ────────────────────────────────────────────────────────────
  const persist = useCallback((overrides: Partial<SavedSession> = {}) => {
    saveSession({
      stage, messages, profil, gambaran, blueprint,
      s1Count, s2Count, s3Count, s3Unlocked,
      profesi: profesiDipilih,
      savedAt: new Date().toISOString(),
      ...overrides,
    });
  }, [stage, messages, profil, gambaran, blueprint, s1Count, s2Count, s3Count, s3Unlocked, profesiDipilih]);

  // ── Resume session ───────────────────────────────────────────────────────
  const resumeSession = () => {
    if (!savedSession) return;
    setMessages(savedSession.messages);
    setStage(savedSession.stage);
    setProfil(savedSession.profil);
    setGambaran(savedSession.gambaran);
    setBlueprint(savedSession.blueprint);
    setS1Count(savedSession.s1Count);
    setS2Count(savedSession.s2Count);
    setS3Count(savedSession.s3Count);
    setS3Unlocked(savedSession.s3Unlocked);
    if (savedSession.profesi) setProfesiDipilih(savedSession.profesi);
    setShowResume(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const startFresh = () => {
    clearSession();
    setShowResume(false);
    setHasSaved(false);
    setSavedSession(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading || processing) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    // increment counter
    const newS1 = stage === "s1_chat" ? s1Count + 1 : s1Count;
    const newS2 = stage === "s2_chat" ? s2Count + 1 : s2Count;
    const newS3 = stage === "s3_chat" ? s3Count + 1 : s3Count;
    if (stage === "s1_chat") setS1Count(newS1);
    if (stage === "s2_chat") setS2Count(newS2);
    if (stage === "s3_chat") setS3Count(newS3);

    try {
      const res = await fetch("/api/dialog-gustafta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, userMessageCount: newMsgs.filter(m => m.role === "user").length, profesi: profesiDipilih }),
      });
      const data = await res.json();
      const reply = data.reply || "Maaf, ada gangguan sebentar.";
      const updatedMsgs = [...newMsgs, { role: "assistant" as const, content: reply }];
      setMessages(updatedMsgs);
      speakReply(reply);

      const updSession = { stage, messages: updatedMsgs, profil, gambaran, blueprint, s1Count: newS1, s2Count: newS2, s3Count: newS3, s3Unlocked, savedAt: "" };

      // Gate triggers
      if (stage === "s1_chat" && newS1 >= S1_LIMIT) {
        setTimeout(() => triggerGate1(updatedMsgs, newS1, newS2, newS3), 600);
      } else if (stage === "s2_chat" && newS2 >= S2_LIMIT) {
        setTimeout(() => triggerGate2(updatedMsgs, newS1, newS2, newS3), 600);
      } else if (stage === "s3_chat" && newS3 >= S3_LIMIT) {
        setTimeout(() => triggerBlueprint(updatedMsgs, newS1, newS2, newS3), 600);
      } else {
        persist(updSession);
      }
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Koneksi terganggu, coba lagi ya!" }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Gate triggers ─────────────────────────────────────────────────────────
  const triggerGate1 = async (msgs: Msg[], c1: number, c2: number, c3: number) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/dialog-gustafta/profil", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, profesi: profesiDipilih }),
      });
      const data = await res.json();
      const p = data.profil ?? { bidang: "Bidang Anda", tantangan: "Tantangan yang dihadapi", potensi: "Potensi besar teridentifikasi", rekomendasiChatbot: "Chatbot spesialis untuk bidang Anda" };
      setProfil(p);
      setStage("s1_gate");
      persist({ stage: "s1_gate", messages: msgs, profil: p, gambaran, blueprint, s1Count: c1, s2Count: c2, s3Count: c3, s3Unlocked, savedAt: "" });
    } catch {
      setProfil({ bidang: "Bidang Anda", tantangan: "Tantangan yang dihadapi", potensi: "Potensi besar teridentifikasi", rekomendasiChatbot: "Chatbot spesialis untuk bidang Anda" });
      setStage("s1_gate");
    } finally { setProcessing(false); }
  };

  const triggerGate2 = async (msgs: Msg[], c1: number, c2: number, c3: number) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/dialog-gustafta/gambaran", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, profesi: profesiDipilih }),
      });
      const data = await res.json();
      const g = data.gambaran ?? { judul: "Gambaran Ekosistem Anda", ringkasan: "Sudah terbentuk gambaran yang menarik.", kekuatan: ["Pengetahuan mendalam", "Pengalaman nyata"], peluang: "Chatbot spesialis di bidang Anda" };
      setGambaran(g);
      setStage("s2_gate");
      persist({ stage: "s2_gate", messages: msgs, profil, gambaran: g, blueprint, s1Count: c1, s2Count: c2, s3Count: c3, s3Unlocked, savedAt: "" });
    } catch {
      setGambaran({ judul: "Gambaran Ekosistem Anda", ringkasan: "Sudah terbentuk gambaran yang menarik.", kekuatan: ["Pengetahuan mendalam", "Pengalaman nyata"], peluang: "Chatbot spesialis" });
      setStage("s2_gate");
    } finally { setProcessing(false); }
  };

  const triggerBlueprint = async (msgs: Msg[], c1: number, c2: number, c3: number) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/dialog-gustafta/blueprint", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, profesi: profesiDipilih }),
      });
      const data = await res.json();
      const bp = data.blueprint ?? { judul: "Blueprint Ekosistem AI Anda", ringkasan: "Roadmap personal berdasarkan dialog.", langkahAwal: [`Daftar di ${brandName}`, "Konfigurasi chatbot pertama", "Upload knowledge base", "Rakit tim AI & bagikan ke rekan"], namaChatbot: "Chatbot Spesialis", persona: "Konsultan yang hangat", targetPengguna: "Profesional di bidang Anda", estimasiDampak: "Melayani ratusan klien otomatis 24/7" };
      setBlueprint(bp);
      setStage("blueprint");
      persist({ stage: "blueprint", messages: msgs, profil, gambaran, blueprint: bp, s1Count: c1, s2Count: c2, s3Count: c3, s3Unlocked, savedAt: "" });
    } catch {
      setBlueprint({ judul: "Blueprint Ekosistem AI Anda", ringkasan: "Roadmap personal.", langkahAwal: [`Daftar di ${brandName}`, "Konfigurasi chatbot", "Upload knowledge base", "Rakit tim AI & kolaborasi"], namaChatbot: "Chatbot Spesialis", persona: "Konsultan hangat", targetPengguna: "Profesional Anda", estimasiDampak: "Melayani klien 24/7" });
      setStage("blueprint");
    } finally { setProcessing(false); }
  };

  // ── Share & Copy ─────────────────────────────────────────────────────────
  const shareText = blueprint ? blueprintToText(blueprint, profil, brandName, !!partner) :
    profil ? `📋 Profil Awal Dialog ${brandName}\n\nBidang: ${profil.bidang}\nTantangan: ${profil.tantangan}\nPotensi: ${profil.potensi}${partner ? "" : "\n\ngustafta.my.id/dialog-gustafta"}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      toast({ title: "Disalin!", description: "Teks blueprint berhasil disalin." });
      setShowShareOptions(false);
    });
  };

  const shareWA = () => {
    window.open(waUrl(shareText, waPhone), "_blank");
    setShowShareOptions(false);
  };

  // Jembatan Dialog → Organization Builder: bawa konsep 1 chatbot jadi benih tim.
  const handleRakitTim = () => {
    if (!blueprint) return;
    const draft = dialogBlueprintToOrgDraft(blueprint);
    const payload = { ...draft, members: draft.members.map((m) => ({ ...m, systemPrompt: "" })) };
    try { sessionStorage.setItem(ORG_PREFILL_KEY, JSON.stringify(payload)); } catch { /* storage diblokir — abaikan */ }
    navigate("/organization-builder");
  };

  // Jembatan Dialog → Blueprint Builder: bawa niat awal untuk merancang 1 chatbot.
  // Deteksi jalur bonus event dari localStorage → tandai step2 & teruskan ?journey=bonus.
  const handleRancangChatbot = () => {
    if (!blueprint) return;
    const intent = [
      blueprint.judul && `Saya ingin membuat chatbot: ${blueprint.judul}.`,
      blueprint.ringkasan,
      blueprint.persona && `Persona yang diinginkan: ${blueprint.persona}.`,
      blueprint.targetPengguna && `Target pengguna: ${blueprint.targetPengguna}.`,
      blueprint.langkahAwal?.length ? `Langkah awal: ${blueprint.langkahAwal.join("; ")}.` : "",
    ].filter(Boolean).join(" ");
    try { localStorage.setItem("gustafta_blueprint_prefill_v1", JSON.stringify({ intent })); } catch { /* abaikan */ }

    // Bila peserta sedang di jalur bonus, tandai langkah "coba Dialog" selesai.
    let isBonus = false;
    try {
      const raw = localStorage.getItem("gustafta_bonus_journey_v1");
      if (raw !== null) {
        isBonus = true;
        const j = raw ? JSON.parse(raw) : {};
        j.step2Dialog = true;
        localStorage.setItem("gustafta_bonus_journey_v1", JSON.stringify(j));
      }
    } catch { /* abaikan */ }

    navigate(isBonus ? "/blueprint-builder?journey=bonus" : "/blueprint-builder");
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    clearSession();
    setMessages([{ role: "assistant", content: GREETING }]);
    setStage("s1_chat"); setProfil(null); setGambaran(null); setBlueprint(null);
    setS1Count(0); setS2Count(0); setS3Count(0); setS3Unlocked(false);
    setShowShareOptions(false); setHasSaved(false);
    setProfesiDipilih("");
    setShowSplash(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Progress bar ─────────────────────────────────────────────────────────
  const s1Pct = Math.min(100, (s1Count / S1_LIMIT) * 100);
  const s2Pct = stage === "s1_chat" || stage === "s1_gate" ? 0 : Math.min(100, (s2Count / S2_LIMIT) * 100);
  const s3Pct = stage !== "s3_chat" && stage !== "blueprint" ? 0 : Math.min(100, (s3Count / S3_LIMIT) * 100);

  const stageLabel: Record<AppStage, string> = {
    s1_chat: "Diagnosis Awal", s1_gate: "Profil Awal Siap",
    s2_chat: "Eksplorasi Mendalam", s2_gate: "Gambaran Tajam",
    s3_chat: "Pendalaman Blueprint", blueprint: "Blueprint Lengkap",
  };

  const isInputBlocked = loading || processing ||
    stage === "s1_gate" || stage === "s2_gate" || stage === "blueprint";

  // ── Profesi selection screen ─────────────────────────────────────────────
  const PROFESI_OPTIONS = [
    { value: "Konsultan Perencana / Pengawas", emoji: "📐" },
    { value: "Kontraktor / Pelaksana Proyek", emoji: "🏗️" },
    { value: "Konsultan Hukum / Legal", emoji: "⚖️" },
    { value: "Dosen / Trainer / Pengajar", emoji: "🎓" },
    { value: "Pengusaha / Wirausaha", emoji: "💼" },
    { value: "ASN / Aparatur Sipil Negara", emoji: "🏛️" },
    { value: "Profesional Lainnya", emoji: "✨" },
  ];

  const handleProfesiPilih = (p: string) => {
    setProfesiDipilih(p);
    const greeting = `Halo, ${p}! Saya Dialog ${brandName} — Teman Berpikir kamu. 🌟\n\nSaya hadir bukan untuk menjawab, tapi untuk *menggali* — karena saya yakin kamu punya potensi dan pengalaman luar biasa yang belum sempat diartikulasikan.\n\nSebagai ${p}, ceritakan padaku — tantangan apa yang ingin kamu selesaikan, atau ada peluang yang belum sempat kamu kejar?`;
    setMessages([{ role: "assistant", content: greeting }]);
    setShowProfesi(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  if (showProfesi && !showResume) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mx-auto overflow-hidden">
              {brandLogo
                ? <img src={brandLogo} alt={brandName} className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <span className="text-white text-xl font-bold">{brandName.charAt(0)}</span>}
            </div>
            <h2 className="text-xl font-bold text-white">Sebelum kita mulai...</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Agar konsultasi lebih tepat sasaran, boleh tahu profesi kamu?
            </p>
          </div>

          {/* Profesi Grid */}
          <div className="space-y-2">
            {PROFESI_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleProfesiPilih(opt.value)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40 transition-all text-left group"
              >
                <span className="text-xl shrink-0">{opt.emoji}</span>
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{opt.value}</span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 ml-auto transition-colors" />
              </button>
            ))}
          </div>

          <button
            onClick={() => { setShowProfesi(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1"
          >
            Lewati →
          </button>
        </div>
      </div>
    );
  }

  // ── Splash / Intro Screen ────────────────────────────────────────────────
  if (showSplash && !showResume) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Brand */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mx-auto overflow-hidden">
              {brandLogo
                ? <img src={brandLogo} alt={brandName} className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <span className="text-white text-2xl font-bold">{brandName.charAt(0)}</span>}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-cyan-400/70 uppercase mb-1">Konsultasi AI</p>
              <h1 className="text-2xl font-bold text-white">Selamat Datang di {brandName}</h1>
            </div>
          </div>

          {/* Intro Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-5">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-white">Sebelum kita mulai...</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Kami tidak akan langsung menawarkan produk.
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                Kami ingin memahami tantangan yang sedang Anda hadapi.
              </p>
              <p className="text-sm text-cyan-300/80 leading-relaxed">
                Dalam waktu sekitar <strong className="text-cyan-300">3–5 menit</strong>, AI akan membantu menyusun blueprint awal berdasarkan jawaban Anda.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Yang akan Anda dapatkan:</p>
              <ul className="space-y-2">
                {[
                  "Identifikasi masalah utama",
                  "Prioritas perbaikan",
                  "Blueprint solusi awal",
                  "Rekomendasi langkah berikutnya",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-base gap-2 rounded-xl shadow-lg shadow-cyan-900/40"
            onClick={() => { setShowSplash(false); setShowProfesi(true); }}
          >
            Mulai Konsultasi <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-xs text-white/25">Gratis · Tanpa daftar · Hasil langsung</p>
        </div>
      </div>
    );
  }

  // ── Resume Banner ────────────────────────────────────────────────────────
  if (showResume && savedSession) {
    const ago = savedSession.savedAt ? new Date(savedSession.savedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "sebelumnya";
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mx-auto">
            <RotateCcw className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Ada Konsultasi yang Tersimpan</h2>
            <p className="text-sm text-white/60">Terakhir disimpan {ago}</p>
            <p className="text-sm text-cyan-300 mt-1 font-medium">{stageLabel[savedSession.stage]}</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2 h-11 font-semibold" onClick={resumeSession}>
              <RotateCcw className="w-4 h-4" /> Lanjutkan Konsultasi
            </Button>
            <Button variant="ghost" className="w-full text-white/50 hover:text-white text-sm" onClick={startFresh}>
              Mulai Konsultasi Baru
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a1628]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center overflow-hidden" style={accentColor ? { background: accentColor } : undefined}>
            {brandLogo
              ? <img src={brandLogo} alt={brandName} className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <span className="text-white text-sm font-bold">{brandName.charAt(0)}</span>}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide" data-testid="text-dialog-title">KONSULTASI {brandName.toUpperCase()}</h1>
            <p className="text-[10px] text-cyan-300/70">{stageLabel[stage]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(profil || blueprint) && (
            <div className="relative">
              <button onClick={() => setShowShareOptions(v => !v)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              {showShareOptions && (
                <div className="absolute right-0 top-10 w-48 bg-[#0e2040] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50">
                  <button onClick={shareWA} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-400" /> Kirim ke WA
                  </button>
                  <button onClick={copyToClipboard} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors">
                    <Copy className="w-4 h-4 text-cyan-400" /> Salin Teks
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={handleReset} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Mulai ulang">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* 3-stage progress bar */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          {/* S1 */}
          <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${stage === "s1_chat" ? s1Pct : 100}%` }} />
          </div>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all shrink-0",
            ["s1_gate", "s2_chat", "s2_gate", "s3_chat", "blueprint"].includes(stage)
              ? "bg-cyan-400 border-cyan-400 text-[#0a1628]" : "border-white/30 text-white/50")}>1</div>
          {/* S2 */}
          <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-violet-400 rounded-full transition-all duration-500" style={{ width: `${["s2_chat", "s2_gate", "s3_chat", "blueprint"].includes(stage) ? (stage === "s2_chat" ? s2Pct : 100) : 0}%` }} />
          </div>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all shrink-0",
            ["s2_gate", "s3_chat", "blueprint"].includes(stage)
              ? "bg-violet-400 border-violet-400 text-[#0a1628]" : "border-white/30 text-white/50")}>2</div>
          {/* S3 */}
          <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${["s3_chat", "blueprint"].includes(stage) ? (stage === "s3_chat" ? s3Pct : 100) : 0}%` }} />
          </div>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all shrink-0",
            stage === "blueprint"
              ? "bg-emerald-400 border-emerald-400 text-[#0a1628]" : "border-white/30 text-white/50")}>3</div>
        </div>
        <div className="flex justify-between text-[9px] text-white/30 mt-0.5 px-0.5">
          <span>Diagnosis</span><span className="ml-6">Eksplorasi</span><span>Blueprint</span>
        </div>
      </div>

      {/* Saved indicator */}
      {hasSaved && stage !== "blueprint" && (
        <div className="flex-shrink-0 mx-4 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Check className="w-3 h-3" /> Tersimpan otomatis
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === "user" && "flex-row-reverse")}>
            <div className={cn("w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold",
              msg.role === "assistant" ? "bg-gradient-to-br from-cyan-500 to-blue-700" : "bg-white/20 text-white")}
              style={msg.role === "assistant" && accentColor ? { background: accentColor } : undefined}>
              {msg.role === "assistant"
                ? (brandLogo
                  ? <img src={brandLogo} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : <span className="text-white">{brandName.charAt(0)}</span>)
                : "U"}
            </div>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
              msg.role === "assistant"
                ? "bg-white/10 text-white rounded-tl-sm"
                : "bg-gradient-to-br from-cyan-500 to-blue-700 text-white rounded-tr-sm whitespace-pre-wrap")}>
              {msg.role === "assistant"
                ? <MessageContent text={msg.content} className="text-sm text-white" />
                : msg.content}
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 shrink-0 flex items-center justify-center" style={accentColor ? { background: accentColor } : undefined}>
              {brandLogo
                ? <img src={brandLogo} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <span className="text-white text-[10px] font-bold">{brandName.charAt(0)}</span>}
            </div>
            <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 0.12, 0.24].map((d, i) => (
                  <span key={i} className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing gate */}
        {processing && (
          <div className="flex flex-col items-center gap-2 py-5 animate-in fade-in duration-500">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <p className="text-xs text-cyan-300">
              {stage === "s1_chat" ? "Menyusun Profil Awal..." :
                stage === "s2_chat" ? "Merumuskan Gambaran Tajam..." :
                  "Menyusun Blueprint Lengkap..."}
            </p>
          </div>
        )}

        {/* ── GATE 1: Profil Awal ── */}
        {stage === "s1_gate" && profil && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Stage 1 Selesai · Profil Awal</div>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { icon: "🎯", label: "Bidang", val: profil.bidang },
                  { icon: "⚡", label: "Tantangan", val: profil.tantangan },
                  { icon: "💡", label: "Potensi", val: profil.potensi },
                  { icon: "🤖", label: "Rekomendasi", val: profil.rekomendasiChatbot },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex gap-2">
                    <span className="shrink-0">{icon}</span>
                    <div><span className="text-white/40 text-xs">{label}:</span><br /><span className="text-white">{val}</span></div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/50 border-t border-white/10 pt-3">
                Mau kita gali lebih dalam untuk gambaran yang lebih tajam?
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2 text-sm"
                  onClick={() => {
                    setStage("s2_chat");
                    const next: Msg = { role: "assistant", content: "Bagus! Mari kita selami lebih dalam. Dari semua yang kita diskusikan, apa satu hal yang paling ingin kamu wujudkan dalam 3 bulan ke depan?" };
                    const upd = [...messages, next];
                    setMessages(upd);
                    persist({ stage: "s2_chat", messages: upd, profil, gambaran, blueprint, s1Count, s2Count, s3Count, s3Unlocked, savedAt: "" });
                    setTimeout(() => textareaRef.current?.focus(), 100);
                  }}
                  data-testid="button-gate1-lanjut"
                >
                  <ArrowRight className="w-4 h-4" /> Lanjut ke Eksplorasi
                </Button>
                <Button variant="outline" className="flex-1 border-white/20 text-white/60 hover:bg-white/10 text-sm"
                  onClick={() => {
                    setStage("s2_chat");
                    const next: Msg = { role: "assistant", content: "Tidak apa-apa! Dialog ini sudah tersimpan. Kapan pun siap, kamu bisa lanjutkan dari sini. Sampai jumpa! 🙏" };
                    setMessages(prev => [...prev, next]);
                    persist({ stage: "s2_chat", messages: [...messages, next], profil, gambaran, blueprint, s1Count, s2Count, s3Count, s3Unlocked, savedAt: "" });
                  }}
                  data-testid="button-gate1-pause"
                >Simpan &amp; Lanjutkan Nanti</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── GATE 2: Gambaran Tajam + Payment Gate ── */}
        {stage === "s2_gate" && gambaran && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/40 to-blue-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Stage 2 Selesai · {gambaran.judul}</div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed">{gambaran.ringkasan}</p>

              <div className="space-y-1">
                <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Kekuatan teridentifikasi</div>
                {gambaran.kekuatan.map((k, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" /> {k}
                  </div>
                ))}
              </div>

              <div className="bg-violet-900/30 border border-violet-500/20 rounded-xl p-3 text-sm">
                <div className="text-violet-300 font-semibold mb-1">🚀 Peluang utama:</div>
                <div className="text-white/80">{gambaran.peluang}</div>
              </div>

              {/* ── Progressive Lead Capture ── */}
              {!leadSubmitted ? (
                <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-900/30 to-orange-900/20 p-5 space-y-4 animate-in fade-in duration-500">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">📋 Blueprint Anda hampir selesai dibuat</div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Masukkan nama dan nomor WhatsApp agar blueprint dapat dipersonalisasi dan dikirimkan langsung ke Anda.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="Nama lengkap Anda"
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60"
                    />
                    <input
                      type="tel"
                      placeholder="Nomor WhatsApp (contoh: 08123456789)"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold gap-2 h-10 text-sm"
                      disabled={leadSubmitting || (!leadName.trim() && !leadPhone.trim())}
                      onClick={async () => {
                        setLeadSubmitting(true);
                        try {
                          await fetch("/api/dialog-gustafta/lead", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: leadName.trim(),
                              phone: leadPhone.trim(),
                              profesi: profesiDipilih,
                              profilBidang: profil?.bidang || "",
                              gambaranJudul: gambaran?.judul || "",
                            }),
                          });
                        } catch { /* abaikan */ }
                        setLeadSubmitted(true);
                        setLeadSubmitting(false);
                      }}
                    >
                      {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {leadSubmitting ? "Menyimpan..." : "Kirim & Lihat Langkah Selanjutnya"}
                    </Button>
                  </div>
                  <button
                    className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors"
                    onClick={() => setLeadSubmitted(true)}
                  >
                    Lewati →
                  </button>
                </div>
              ) : (
                leadName.trim() && (
                  <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-300 text-center">
                    ✅ Terima kasih, {leadName.trim().split(" ")[0]}! Blueprint Anda sedang disiapkan.
                  </div>
                )
              )}

              {/* Payment Gate */}
              <div className={`border-t border-white/10 pt-4 space-y-3 ${!leadSubmitted ? "opacity-40 pointer-events-none select-none" : ""}`}>
                {/* Free Trial CTA at Stage 2 */}
                {user && !trialStatus?.hasActiveTrial && !trialActivated && (
                  <div className="rounded-xl bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 p-3 space-y-2 text-center">
                    <div className="text-sm font-bold text-white">🚀 Aktifkan Trial 7 Hari — Gratis</div>
                    <div className="text-xs text-white/60">75 pesan gratis · lanjut ke Stage 3 untuk blueprint penuh</div>
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold gap-2 h-9 text-sm"
                      onClick={() => {
                        activateTrialMutation.mutate();
                      }}
                      disabled={activateTrialMutation.isPending}
                      data-testid="button-activate-trial-s2"
                    >
                      {activateTrialMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Mengaktifkan...</>
                      ) : (
                        <><Rocket className="w-4 h-4" /> Aktifkan Trial Gratis</>
                      )}
                    </Button>
                  </div>
                )}
                {(trialActivated || trialStatus?.hasActiveTrial) && (
                  <div className="rounded-xl bg-emerald-900/30 border border-emerald-500/30 p-3 text-center space-y-1.5">
                    <div className="text-sm font-bold text-emerald-300">✅ Trial aktif — lanjutkan ke Stage 3!</div>
                    <div className="text-xs text-white/60">Selesaikan dialog untuk dapat Blueprint penuh</div>
                  </div>
                )}
                {!user && (
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold gap-2 h-9 text-sm" data-testid="button-login-for-trial-s2">
                      <Rocket className="w-4 h-4" /> Login untuk Trial Gratis
                    </Button>
                  </Link>
                )}

                <div className="rounded-xl bg-gradient-to-r from-amber-900/40 to-orange-900/40 border border-amber-500/30 p-4 text-center space-y-1">
                  <div className="text-sm font-bold text-white">Blueprint Lengkap menanti di Stage 3</div>
                  <div className="text-xs text-white/60">25 sesi pendalaman + blueprint personalisasi penuh</div>
                  <div className="text-base font-bold text-amber-300 mt-2">Starter Kit — Rp 245.000</div>
                  <div className="text-[10px] text-white/40">Lisensi platform + 3 Panduan Digital + 7 hari trial + Blueprint</div>
                </div>
                <a href={s3UnlockWa} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold gap-2 h-11" data-testid="button-gate2-beli">
                    <MessageCircle className="w-4 h-4" /> Hubungi Kami untuk Lanjut ke Stage 3
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  className="w-full text-white/40 hover:text-white text-xs gap-1.5"
                  onClick={() => {
                    setStage("s3_chat");
                    setS3Unlocked(true);
                    const next: Msg = { role: "assistant", content: "Selamat datang di Stage 3 — Pendalaman Blueprint! 🎯\n\nDi sini kita akan menggali jauh lebih detail: pengetahuan spesifik yang kamu miliki, audiens yang ingin kamu layani, dan bagaimana chatbot kamu akan bekerja dalam praktik nyata.\n\nMulai dari ini: ceritakan satu pengalaman nyata di bidang kamu yang paling berkesan — situasi, tantangan, dan bagaimana kamu mengatasinya." };
                    const upd = [...messages, next];
                    setMessages(upd);
                    persist({ stage: "s3_chat", messages: upd, profil, gambaran, blueprint, s1Count, s2Count, s3Count, s3Unlocked: true, savedAt: "" });
                    setTimeout(() => textareaRef.current?.focus(), 100);
                  }}
                  data-testid="button-gate2-demo"
                >
                  Coba Demo Stage 3 (tanpa simpan)
                </Button>
                <Button variant="ghost" className="w-full text-white/30 hover:text-white text-xs"
                  onClick={() => {
                    const next: Msg = { role: "assistant", content: "Dialog tersimpan! Kamu bisa lanjutkan kapan saja dari browser ini. Atau hubungi kami via WA untuk aktivasi Stage 3." };
                    setMessages(prev => [...prev, next]);
                    persist({ stage: "s2_gate", messages: [...messages, next], profil, gambaran, blueprint, s1Count, s2Count, s3Count, s3Unlocked, savedAt: "" });
                  }}
                >Simpan &amp; Lanjutkan Nanti</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── FINAL: Blueprint Lengkap ── */}
        {stage === "blueprint" && blueprint && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Blueprint Lengkap Tersusun</div>
                  <div className="text-sm font-bold text-white">{blueprint.judul}</div>
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed">{blueprint.ringkasan}</p>

              <div className="bg-white/5 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="text-white/40 font-semibold uppercase tracking-wider mb-2">Chatbot yang direkomendasikan</div>
                <div><span className="text-white/50">Nama:</span> <span className="text-white font-medium">{blueprint.namaChatbot}</span></div>
                <div><span className="text-white/50">Persona:</span> <span className="text-white">{blueprint.persona}</span></div>
                <div><span className="text-white/50">Target:</span> <span className="text-white">{blueprint.targetPengguna}</span></div>
                <div><span className="text-white/50">Dampak:</span> <span className="text-emerald-300">{blueprint.estimasiDampak}</span></div>
              </div>

              <div>
                <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Langkah pertama</div>
                <ul className="space-y-1.5">
                  {blueprint.langkahAwal.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="text-emerald-400 shrink-0 font-bold mt-0.5">{i + 1}.</span> {l}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="text-xs text-white/40 font-semibold uppercase tracking-wider">Setelah chatbot pertama Anda</div>
                <ul className="space-y-1.5 text-xs text-white/80">
                  <li className="flex items-start gap-2"><span>🧩</span><span><span className="font-semibold text-white">Rakit Tim AI</span> — kembangkan dari satu chatbot menjadi satu tim agen yang saling bekerja sama.</span></li>
                  <li className="flex items-start gap-2"><span>🤝</span><span><span className="font-semibold text-white">Kolaborasi</span> — bagikan chatbot ke rekan lewat email dan kerjakan bersama tim.</span></li>
                  <li className="flex items-start gap-2"><span>✅</span><span><span className="font-semibold text-white">Sertifikasi</span> — jadikan chatbot Anda bersertifikat &amp; tepercaya di Store.</span></li>
                </ul>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                {/* Trial activation at blueprint stage — user should have activated at s2_gate */}
                {(trialActivated || trialStatus?.hasActiveTrial) && null}
                {(trialActivated || trialStatus?.hasActiveTrial) && (
                  <div className="rounded-xl bg-emerald-900/30 border border-emerald-500/30 p-3 text-center space-y-2">
                    <div className="text-sm font-bold text-emerald-300">✅ Trial sudah aktif!</div>
                    <Link href="/dashboard">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold" data-testid="button-go-dashboard">
                        <Rocket className="w-4 h-4" /> Masuk ke Dashboard
                      </Button>
                    </Link>
                  </div>
                )}
                {!user && (
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold gap-2 h-10" data-testid="button-login-for-trial">
                      <Rocket className="w-4 h-4" /> Login untuk Aktifkan Trial Gratis
                    </Button>
                  </Link>
                )}
                <div className="text-xs text-white/50 text-center">Blueprint ini adalah bagian dari Starter Kit Anda</div>
                <Button onClick={handleRancangChatbot} className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white gap-2 font-semibold" data-testid="button-blueprint-rancang-chatbot">
                  <Sparkles className="w-4 h-4" /> Rancang Chatbot Saya
                </Button>
                <Button onClick={handleRakitTim} variant="outline" className="w-full border-violet-400/40 text-violet-200 hover:bg-violet-500/10 gap-2 font-semibold" data-testid="button-blueprint-rakit-tim">
                  <Sparkles className="w-4 h-4" /> Kembangkan Jadi Tim AI
                </Button>
                <Button onClick={shareWA} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold" data-testid="button-blueprint-share-wa">
                  <MessageCircle className="w-4 h-4" /> Kirim ke WhatsApp
                </Button>
                <Button onClick={copyToClipboard} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 gap-2 text-sm">
                  <Copy className="w-4 h-4" /> Salin Teks Blueprint
                </Button>
                <Button variant="ghost" className="w-full text-white/30 hover:text-white text-xs" onClick={handleReset}>
                  Mulai dialog baru
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-white/10 bg-[#0a1628]/80 backdrop-blur">
        {!isInputBlocked && (
          <>
            {isListening && (
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs text-red-400 font-medium">Mendengarkan… bicara sekarang</span>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isUploading || isListening}
                className="shrink-0 p-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30 transition-all"
                title="Lampirkan file (PDF, Word, Excel, gambar, audio, video)"
                data-testid="button-attach-dialog"
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
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening ? "Mendengarkan suara Anda…" :
                  stage === "s1_chat" ? "Ceritakan bidang atau tantanganmu..." :
                    stage === "s2_chat" ? "Ceritakan lebih dalam..." :
                      "Gali lebih jauh — detail, pengalaman nyata..."
                }
                className="min-h-[48px] max-h-[120px] resize-none text-sm rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-cyan-500"
                rows={1}
                disabled={isListening}
              />
              {speechSupported && (
                <button
                  onClick={togglePhoneMode}
                  disabled={loading || processing}
                  className={`shrink-0 h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                    phoneMode
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      : "text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30"
                  }`}
                  title={phoneMode ? "Matikan Mode Telpon" : "Mode Telpon — bicara & dengar seperti telepon"}
                  data-testid="button-phone-mode-dialog"
                >
                  {phoneMode ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
              )}
              {speechSupported && (
                <button
                  onClick={toggleMic}
                  disabled={loading || processing}
                  className={`shrink-0 h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                    isListening
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30"
                  }`}
                  title={isListening ? "Berhenti mendengarkan" : "Rekam suara"}
                  data-testid="button-mic-dialog-full"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              {aiSpeaking && (
                <span className="text-[10px] text-emerald-400 font-medium absolute -top-5 left-0">AI sedang berbicara…</span>
              )}
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading || isListening}
                className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-600 hover:to-blue-800 border-0 disabled:opacity-40"
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-white/25">
            {stage === "s1_chat" && `${s1Count}/${S1_LIMIT} chat`}
            {stage === "s2_chat" && `${s2Count}/${S2_LIMIT} chat`}
            {stage === "s3_chat" && `${s3Count}/${S3_LIMIT} chat`}
          </p>
          <p className="text-[10px] text-white/25">
            {partner
              ? <>Dialog {brandName}</>
              : <>Dialog Gustafta · <Link href="/" className="hover:text-white/50">gustafta.my.id</Link></>}
          </p>
        </div>
      </div>
    </div>
  );
}
