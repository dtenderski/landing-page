import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, ArrowLeft, Share2, Mic, MicOff, Volume2, VolumeX, Paperclip, X, FileText, Image as ImageIcon, Music, Video, File, Copy, Check, ThumbsUp, ThumbsDown, Download, Trash2, Globe, Code, MessageCircle, PlayCircle, Sparkles, Zap, Languages, Shield, Smartphone, ClipboardList, Target, Phone, Calendar, ExternalLink, CheckCircle, Calculator, ListChecks, Wand2, ChevronUp, FileOutput, Hash, Pencil, CornerDownLeft, Link2, FileDown, FileCode2, Bookmark, BookmarkCheck, Search, SearchX, ChevronDown, ChevronUp as ChevronUpIcon, Database } from "lucide-react";
import { SiWhatsapp, SiTelegram, SiDiscord, SiSlackware } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useParams } from "wouter";
import { cn } from "@/lib/utils";
import { MessageContent as SharedMessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { parseActionSuggestions, ActionChips } from "@/lib/action-utils";
import { getChatStyle } from "@/lib/chat-styles";
import { usePartnerBranding } from "@/hooks/use-partner-branding";

interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  category: string;
  mimeType: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: UploadedFile[];
  feedback?: "up" | "down" | null;
}

interface ChannelInfo {
  type: string;
  name: string;
}

interface ContextQuestion {
  id: string;
  label: string;
  type: "text" | "select";
  options?: string[];
  required?: boolean;
}

interface AgentConfig {
  agentId: string;
  name: string;
  avatar: string;
  description: string;
  tagline: string;
  greetingMessage: string;
  welcomeMessage: string;
  conversationStarters: string[];
  personality: string;
  philosophy: string;
  category: string;
  subcategory: string;
  color: string;
  isActive: boolean;
  isPublic: boolean;
  channels: ChannelInfo[];
  requireRegistration: boolean;
  monthlyPrice: number;
  trialEnabled: boolean;
  trialDays: number;
  messageQuotaDaily: number;
  messageQuotaMonthly: number;
  guestMessageLimit: number;
  communicationStyle: string;
  toneOfVoice: string;
  responseStyle: string;
  language: string;
  chatStyle?: string;
  contextQuestions?: ContextQuestion[];
  metaPixelId?: string;
  paymentUrl?: string;
}

function injectMetaPixel(pixelId: string) {
  const sanitized = pixelId.replace(/[^0-9]/g, "");
  if (!sanitized || document.getElementById("meta-pixel-script")) return;
  const loader = document.createElement("script");
  loader.id = "meta-pixel-script";
  loader.async = true;
  loader.src = "https://connect.facebook.net/en_US/fbevents.js";
  loader.onload = () => {
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("init", sanitized);
      (window as any).fbq("track", "PageView");
    }
  };
  const w = window as any;
  if (!w.fbq) {
    const n: any = (w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
  }
  document.head.appendChild(loader);
}

function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof (window as any).fbq === "function") {
    (window as any).fbq("track", eventName, params);
  }
}

// ── Slash Commands (Notion AI / gpai.app style) ─────────────────────────────
const SLASH_COMMANDS = [
  // 🔢 Teknis
  { group: "Teknis", cmd: "/hitung", emoji: "🔢", label: "Hitung Langkah", desc: "Kalkulasi teknik step-by-step dengan rumus", prefix: "Selesaikan perhitungan teknik berikut secara langkah demi langkah:\n\n**Diketahui:** (sebutkan data)\n**Ditanya:** (sebutkan yang dicari)\n**Penyelesaian:** (uraikan langkah dengan rumus)\n**Hasil:** (nyatakan hasil dengan satuan dan verifikasi)\n\nSoal:\n" },
  { group: "Teknis", cmd: "/rab", emoji: "💰", label: "Buat RAB", desc: "Rencana Anggaran Biaya detail", prefix: "Buat Rencana Anggaran Biaya (RAB) yang detail dan lengkap, termasuk volume, satuan, harga satuan, dan total untuk:\n\n" },
  { group: "Teknis", cmd: "/spek", emoji: "📐", label: "Spesifikasi Teknis", desc: "Spek teknis / method statement", prefix: "Buat spesifikasi teknis lengkap dan method statement untuk:\n\n" },
  { group: "Teknis", cmd: "/k3", emoji: "⚠️", label: "Analisis K3", desc: "Hazard identification & risk assessment", prefix: "Lakukan Hazard Identification and Risk Assessment (HIRA) untuk:\n\n**Aktivitas:** \n**Identifikasi Bahaya:** \n**Penilaian Risiko (Likelihood × Severity):** \n**Pengendalian Risiko (Hierarchy of Control):** \n\nAktivitas yang dianalisis:\n" },
  { group: "Teknis", cmd: "/ahsp", emoji: "💹", label: "Harga Satuan", desc: "Analisis Harga Satuan Pekerjaan", prefix: "Buat Analisis Harga Satuan Pekerjaan (AHSP) yang detail untuk:\n\nPekerjaan:\n" },
  { group: "Teknis", cmd: "/risiko", emoji: "🎯", label: "Register Risiko", desc: "Risk register proyek", prefix: "Buat Risk Register lengkap dalam format tabel dengan kolom: ID Risiko | Deskripsi | Kategori | Likelihood (1-5) | Impact (1-5) | Risk Score | Status | Mitigasi | PIC untuk:\n\nProyek/Kegiatan:\n" },
  // 📝 Dokumen
  { group: "Dokumen", cmd: "/laporan", emoji: "📄", label: "Buat Laporan", desc: "Laporan teknis formal", prefix: "Buat laporan teknis formal yang komprehensif, terstruktur, dan siap pakai untuk:\n\n" },
  { group: "Dokumen", cmd: "/surat", emoji: "✉️", label: "Buat Surat", desc: "Surat / memo formal profesional", prefix: "Buat surat/memo formal yang profesional untuk:\n\n" },
  { group: "Dokumen", cmd: "/kontrak", emoji: "📑", label: "Draf Kontrak", desc: "Kontrak / SPK / perjanjian", prefix: "Draf kontrak/SPK/perjanjian yang lengkap dan profesional untuk:\n\nPara Pihak: \nRuang Lingkup Pekerjaan: \nNilai Kontrak: \nJangka Waktu: \n\nJenis dokumen yang diminta:\n" },
  { group: "Dokumen", cmd: "/berita", emoji: "📋", label: "Berita Acara", desc: "Berita acara formal", prefix: "Buat berita acara formal yang lengkap dan sah untuk:\n\nJenis Berita Acara: \nTanggal: \nLokasi: \nPara Pihak: \n\nKejadian/kegiatan yang didokumentasikan:\n" },
  { group: "Dokumen", cmd: "/notulensi", emoji: "🗒️", label: "Notulensi Rapat", desc: "Notulensi rapat resmi", prefix: "Buat notulensi rapat yang lengkap dan terstruktur untuk:\n\nNama Rapat: \nTanggal & Waktu: \nPeserta: \nAgenda: \n\nPoin-poin pembahasan:\n" },
  { group: "Dokumen", cmd: "/tender", emoji: "🏗️", label: "Dokumen Tender", desc: "Dokumen penawaran tender", prefix: "Bantu siapkan dokumen penawaran tender yang kompetitif dan lengkap untuk:\n\nNama Paket: \nPemilik Proyek: \nNilai HPS: \n\nKomponen yang dibutuhkan:\n" },
  // 💡 Analisis
  { group: "Analisis", cmd: "/analisis", emoji: "🔍", label: "Analisis", desc: "Analisis mendalam & komprehensif", prefix: "Lakukan analisis mendalam dan komprehensif untuk:\n\n" },
  { group: "Analisis", cmd: "/ringkas", emoji: "📋", label: "Ringkas", desc: "Ringkasan poin utama", prefix: "Ringkas berikut dalam 5 poin utama yang paling penting:\n\n" },
  { group: "Analisis", cmd: "/tabel", emoji: "📊", label: "Buat Tabel", desc: "Data dalam format tabel", prefix: "Sajikan data berikut dalam format tabel yang lengkap dan informatif:\n\n" },
  { group: "Analisis", cmd: "/bandingkan", emoji: "⚖️", label: "Bandingkan", desc: "Perbandingan dua atau lebih opsi", prefix: "Buat perbandingan detail antara opsi-opsi berikut dalam format tabel:\n\n" },
  { group: "Analisis", cmd: "/simulasi", emoji: "🔮", label: "Simulasi Skenario", desc: "Analisis skenario what-if", prefix: "Lakukan simulasi dan analisis skenario what-if untuk:\n\n**Skenario Optimis:** \n**Skenario Moderat:** \n**Skenario Pesimis:** \n\nKonteks/situasi:\n" },
  // ✅ Aksi
  { group: "Aksi", cmd: "/checklist", emoji: "✅", label: "Buat Checklist", desc: "Daftar periksa sistematis", prefix: "Buat checklist lengkap dan sistematis untuk:\n\n" },
  // 🖼️ Gambar Teknis
  { group: "Gambar Teknis", cmd: "/gambar-teknis", emoji: "🖼️", label: "Analisis Gambar Teknis", desc: "Analisis menyeluruh gambar konstruksi/keteknikan", prefix: "Analisis gambar teknis yang saya kirim secara menyeluruh. Identifikasi jenis gambar, baca semua elemen, dimensi, material, dan berikan temuan teknis lengkap:\n\n/gambar-teknis\n" },
  { group: "Gambar Teknis", cmd: "/denah", emoji: "🏠", label: "Analisis Denah", desc: "Baca & analisis denah / floor plan", prefix: "Analisis denah/floor plan berikut. Identifikasi layout ruang, dimensi, sirkulasi, struktur tampak, dan bukaan:\n\n/denah\n" },
  { group: "Gambar Teknis", cmd: "/struktur", emoji: "🏗️", label: "Analisis Struktur", desc: "Baca gambar struktur: kolom, balok, pondasi", prefix: "Analisis gambar struktur berikut. Identifikasi sistem struktur, dimensi elemen, tulangan, sambungan, dan mutu material:\n\n/struktur\n" },
  { group: "Gambar Teknis", cmd: "/mep", emoji: "⚙️", label: "Analisis MEP", desc: "Baca gambar Mekanikal/Elektrikal/Plumbing", prefix: "Analisis gambar MEP (Mekanikal/Elektrikal/Plumbing) berikut. Identifikasi sistem, jalur, ukuran, dan spesifikasi:\n\n/mep\n" },
  { group: "Gambar Teknis", cmd: "/shopdrw", emoji: "📐", label: "Review Shop Drawing", desc: "Review shop drawing siap fabrikasi", prefix: "Review shop drawing berikut untuk kelengkapan dokumen, kebenaran teknis, dan kesiapan fabrikasi/konstruksi:\n\n/shopdrw\n" },
  { group: "Gambar Teknis", cmd: "/as-built", emoji: "📍", label: "Analisis As-Built", desc: "Baca gambar kondisi terbangun (as-built)", prefix: "Analisis as-built drawing berikut. Identifikasi kondisi aktual, perubahan dari rencana awal, dan kelengkapan dokumentasi:\n\n/as-built\n" },
  // 🎨 Generate Gambar AI
  { group: "Buat Gambar", cmd: "/gambar", emoji: "🎨", label: "Generate Gambar (DALL-E)", desc: "Buat gambar AI dari deskripsi teks", prefix: "/gambar " },
];

// ── Quick Actions (Notion AI style) ─────────────────────────────────────────
const QUICK_ACTIONS = [
  { key: "ringkas",       emoji: "📋", label: "Ringkas",            prompt: "Ringkas jawaban di atas dalam 3-5 poin kunci yang paling penting, dalam format bullet point yang jelas." },
  { key: "dokumen",       emoji: "📄", label: "Buat Dokumen",       prompt: "Konversi jawaban di atas menjadi dokumen/laporan formal siap pakai dengan heading, sub-heading, dan format profesional yang rapi." },
  { key: "aksi",          emoji: "✅", label: "Rencana Aksi",       prompt: "Ekstrak semua rencana aksi (action items) dan langkah konkret yang perlu dilakukan dari jawaban di atas. Format sebagai checklist bernomor yang actionable." },
  { key: "hitung",        emoji: "🔢", label: "Uraikan Perhitungan", prompt: "Tampilkan semua perhitungan dari jawaban di atas langkah demi langkah dengan format:\n1. Data yang diketahui (dengan satuan)\n2. Rumus yang digunakan\n3. Substitusi nilai\n4. Hasil lengkap dengan satuan\n5. Verifikasi kewajaran hasil" },
  { key: "tabel",         emoji: "📊", label: "Buat Tabel",         prompt: "Konversi informasi utama dari jawaban di atas menjadi tabel yang terstruktur dan mudah dibaca." },
  { key: "perluas",       emoji: "⬆️", label: "Perluas",            prompt: "Perluas dan elaborasi jawaban di atas dengan lebih banyak detail teknis, contoh konkret, referensi standar/regulasi terkait, dan rekomendasi praktis." },
  { key: "persingkat",    emoji: "✂️", label: "Persingkat",         prompt: "Persingkat jawaban di atas menjadi 2-3 kalimat inti yang paling penting dan berdampak." },
  { key: "terjemah",      emoji: "🌐", label: "Terjemahkan EN",     prompt: "Terjemahkan jawaban di atas ke Bahasa Inggris teknis yang formal dan profesional." },
  // Gambar Teknis
  { key: "rab-gambar",    emoji: "💰", label: "Estimasi RAB",       prompt: "Berdasarkan gambar teknis yang telah dianalisis di atas, buat estimasi Rencana Anggaran Biaya (RAB) untuk pekerjaan yang teridentifikasi. Gunakan format tabel: No | Uraian Pekerjaan | Volume | Satuan | Harga Satuan (Rp) | Jumlah (Rp). Sertakan asumsi harga berdasarkan HSPK daerah rata-rata Indonesia 2024–2025." },
  { key: "k3-gambar",     emoji: "⚠️", label: "Identifikasi K3",    prompt: "Berdasarkan gambar teknis yang telah dianalisis di atas, lakukan Hazard Identification & Risk Assessment (HIRA) untuk pelaksanaan konstruksinya. Format: tabel Potensi Bahaya | Lokasi/Elemen | Likelihood | Severity | Pengendalian (Hierarchy of Control)." },
  { key: "skk-gambar",    emoji: "🎓", label: "Relevansi SKK/SBU",  prompt: "Berdasarkan gambar teknis di atas, identifikasi: (1) Sub-klasifikasi SBU yang relevan, (2) Jabatan kerja SKK yang dibutuhkan untuk melaksanakan pekerjaan ini, (3) Referensi SKKNI yang berlaku, (4) Sertifikasi kompetensi apa yang harus dimiliki pelaksana lapangan." },
  { key: "shopdrw-check", emoji: "📐", label: "Checklist Shop Drw", prompt: "Buat checklist review shop drawing berdasarkan gambar yang dianalisis di atas. Format: tabel No | Item Pemeriksaan | Status (OK/NG/NA) | Catatan. Kelompokkan: (A) Kelengkapan Dokumen, (B) Kebenaran Dimensi, (C) Spesifikasi Material, (D) Kesesuaian Standar." },
];

// Context-aware Quick Action scoring — promote relevant actions based on last AI message content
function getContextualQuickActions(lastContent: string) {
  if (!lastContent) return QUICK_ACTIONS;
  const c = lastContent;
  const scores: Record<string, number> = {};

  // Technical drawing analysis detected — promote gambar teknis actions
  const isTechVision = /IDENTIFIKASI GAMBAR|Jenis Gambar|Elemen Utama|DENAH|STRUKTUR|MEP|Shop Drawing|As-Built|Skala.*1:/i.test(c)
    || /📐|🔎|🏗️|⚙️/.test(c)
    || c.includes("PERLU KLARIFIKASI")
    || /denah|floor plan|potongan|tampak|kolom.*balok|pelat lantai|pondasi|MEP|shop drawing/i.test(c);
  if (isTechVision) {
    scores["rab-gambar"]    = 12;
    scores["k3-gambar"]     = 10;
    scores["skk-gambar"]    = 9;
    scores["shopdrw-check"] = 8;
    scores["tabel"]         = 7;
    scores["dokumen"]       = 6;
  }

  // Math / engineering calculation detected
  if (/\d[\s]*[×÷=]\s*\d|kN|MPa|m²|m³|kg\/|N\/m|kPa|\$\$|\\frac|σ|τ|ε|Δ/.test(c) || c.includes("**Diketahui") || c.includes("**Penyelesaian")) {
    scores["hitung"] = (scores["hitung"] || 0) + 10;
  }
  // Very long response → prioritize summarize
  if (c.length > 800) scores["ringkas"] = (scores["ringkas"] || 0) + 8;
  // Has a markdown table → promote Buat Tabel (expand it) or Buat Dokumen
  if (c.split("\n").filter(l => l.includes("|")).length >= 3) {
    scores["dokumen"] = (scores["dokumen"] || 0) + 5;
  }
  // Contains action items / steps / checklist
  if (/langkah|step|checklist|\[ \]|☐|①|②|③|^\d+\./m.test(c)) {
    scores["aksi"] = (scores["aksi"] || 0) + 7;
  }
  // Comparison / multiple options
  if (/dibandingkan|versus|vs\.|perbandingan|opsi|alternatif|pilihan/i.test(c)) {
    scores["tabel"] = (scores["tabel"] || 0) + 6;
  }
  // Short response → promote expand
  if (c.length < 300) scores["perluas"] = (scores["perluas"] || 0) + 5;

  return [...QUICK_ACTIONS].sort((a, b) => (scores[b.key] || 0) - (scores[a.key] || 0));
}

// Renderer markdown chat dipindah ke @/lib/format-message (impor di atas).
function formatMessageContent(text: string) {
  return <SharedMessageContent text={text} className="text-sm" />;
}

function AgentAvatar({ config, size = "md", color }: { config: AgentConfig; size?: "sm" | "md" | "lg" | "xl"; color: string }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };
  const textClasses = {
    sm: "text-xs",
    md: "text-sm font-semibold",
    lg: "text-2xl font-bold",
    xl: "text-4xl font-bold",
  };

  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0 border-2")} style={{ borderColor: `${color}40` }}>
      {config.avatar ? (
        <AvatarImage src={config.avatar} alt={config.name} className="object-cover" />
      ) : null}
      <AvatarFallback
        className={textClasses[size]}
        style={{ backgroundColor: `${color}15`, color }}
      >
        {config.name.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

const channelMeta: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  whatsapp: { icon: SiWhatsapp, label: "WhatsApp", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-500/10" },
  telegram: { icon: SiTelegram, label: "Telegram", color: "text-blue-500 dark:text-blue-400", bgColor: "bg-blue-500/10" },
  discord: { icon: SiDiscord, label: "Discord", color: "text-indigo-500 dark:text-indigo-400", bgColor: "bg-indigo-500/10" },
  slack: { icon: SiSlackware, label: "Slack", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10" },
  web: { icon: Globe, label: "Web Widget", color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-500/10" },
  api: { icon: Code, label: "REST API", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500/10" },
};

const styleLabels: Record<string, string> = {
  friendly: "Ramah",
  professional: "Profesional",
  casual: "Santai",
  formal: "Formal",
  technical: "Teknikal",
  creative: "Kreatif",
  educational: "Edukatif",
  enthusiastic: "Antusias",
  caring: "Peduli",
  inspiring: "Inspiratif",
};

const langLabels: Record<string, string> = {
  id: "Indonesia",
  en: "English",
  ms: "Melayu",
  jv: "Jawa",
  su: "Sunda",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};

function InstallBanner({ color, agentName }: { color: string; agentName: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => window.__pwaInstallPrompt || null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(() => window.__pwaInstalled || false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    if (window.__pwaInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (installed) return null;
  if (window.matchMedia("(display-mode: standalone)").matches) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        window.__pwaInstalled = true;
      }
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = undefined;
    } else if (isIOS) {
      setShowIOSGuide(!showIOSGuide);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
        style={{ backgroundColor: color }}
       
      >
        <Smartphone className="w-4 h-4" />
        Install {agentName} di HP Anda
      </button>
      {showIOSGuide && isIOS && (
        <div className="mt-2 p-3 bg-muted rounded-xl text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Cara install di iPhone/iPad:</p>
          <p>1. Tap tombol Share di Safari (kotak dengan panah ke atas)</p>
          <p>2. Scroll ke bawah, pilih "Add to Home Screen"</p>
          <p>3. Tap "Add" di pojok kanan atas</p>
        </div>
      )}
    </div>
  );
}

export default function AgentChat() {
  const params = useParams<{ agentId: string }>();
  const { partner: partnerBranding } = usePartnerBranding();
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stableSessionId] = useState(() => {
    const storageKey = `gustafta_session_${params.agentId}`;
    let sid = localStorage.getItem(storageKey);
    if (!sid) {
      sid = `chat_${params.agentId}_${Date.now()}`;
      localStorage.setItem(storageKey, sid);
    }
    return sid;
  });
  const sessionIdRef = useRef<string>(stableSessionId);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuIdx, setSlashMenuIdx] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  // Bookmark / pin
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  // In-chat search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{ name: string; email: string; plan: string } | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ dailyUsed: number; dailyLimit: number; monthlyUsed: number; monthlyLimit: number } | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [dataMasterInjected, setDataMasterInjected] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // Per-chatbot trial tracking (localStorage)
  const getTrialKey = useCallback(() => `gustafta_trial_${params.agentId}`, [params.agentId]);
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [trialState, setTrialState] = useState<{
    firstVisitDate: string;
    dailyCounts: Record<string, number>;
  } | null>(null);

  const trialDayNumber = trialState
    ? Math.floor((Date.now() - new Date(trialState.firstVisitDate).getTime()) / 86400000) + 1
    : 1;
  const todayUsed = trialState?.dailyCounts[getTodayStr()] ?? 0;

  const incrementTrialCount = useCallback(() => {
    const key = getTrialKey();
    const today = getTodayStr();
    setTrialState((prev) => {
      if (!prev) return prev;
      const newCounts = { ...prev.dailyCounts, [today]: (prev.dailyCounts[today] ?? 0) + 1 };
      const next = { ...prev, dailyCounts: newCounts };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [getTrialKey]);
  const [orchestrationState, setOrchestrationState] = useState<{
    active: boolean;
    phase: "dispatching" | "routing" | "aggregating" | "critic" | "done";
    total: number;
    cap?: number;
    criticEnabled?: boolean;
    subAgents: { agentId: number; role: string; status: "pending" | "done"; elapsed?: number; chars?: number; confidence?: number; jsonMode?: boolean }[];
    totalMs?: number;
    routerDecision?: { selected: number[]; fromTotal: number; parseOk: boolean; reason?: string };
    criticDecision?: { pass: boolean; confidence: number; missingCount: number; conflictsCount: number };
  } | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showClaimAccess, setShowClaimAccess] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("claim") === "1";
  });
  const [claimEmail, setClaimEmail] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [projectContext, setProjectContext] = useState<Record<string, string>>({});
  const [showContextForm, setShowContextForm] = useState(false);
  const [contextCompleted, setContextCompleted] = useState(false);
  const [conversionConfig, setConversionConfig] = useState<any>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showCtaCard, setShowCtaCard] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadFormData, setLeadFormData] = useState<Record<string, string>>({});

  const getStorageKey = useCallback(() => `gustafta_chat_${params.agentId}`, [params.agentId]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${params.agentId}/session/${sessionIdRef.current}`);
        if (res.ok) {
          const dbMessages = await res.json();
          if (Array.isArray(dbMessages) && dbMessages.length > 0) {
            setMessages(dbMessages.map((m: any) => ({
              id: String(m.id),
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt || m.timestamp),
            })));
            return;
          }
        }
      } catch {}
      try {
        const key = getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
          }
        }
      } catch {}
    };
    loadMessages();
  }, [params.agentId, getStorageKey]);

  useEffect(() => {
    try {
      const key = getStorageKey();
      if (messages.length > 0) {
        localStorage.setItem(key, JSON.stringify(messages.slice(-100)));
      } else {
        localStorage.removeItem(key);
      }
    } catch {}
  }, [messages, getStorageKey]);

  // Load pinned message IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gustafta_pins_${params.agentId}`);
      if (saved) setPinnedIds(new Set(JSON.parse(saved)));
    } catch {}
  }, [params.agentId]);

  // Persist pinned IDs whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`gustafta_pins_${params.agentId}`, JSON.stringify(Array.from(pinnedIds)));
    } catch {}
  }, [pinnedIds, params.agentId]);

  const togglePin = (messageId: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const shareToWhatsApp = (text: string) => {
    const maxLen = 1200;
    const truncated = text.length > maxLen ? text.slice(0, maxLen) + "\n...(diperpendek)" : text;
    window.open(`https://wa.me/?text=${encodeURIComponent(truncated)}`, "_blank");
  };

  const exportPinnedMessages = () => {
    const pinned = messages.filter(m => pinnedIds.has(m.id));
    if (!pinned.length) return;
    const header = `Pesan Tersimpan — Chat dengan ${config?.name || "AI"}\n${"=".repeat(44)}\n${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;
    const lines = pinned.map(m => {
      const time = m.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const sender = m.role === "user" ? "Anda" : (config?.name || "AI");
      return `[${time}] ${sender}:\n${m.content}\n`;
    });
    const blob = new Blob([header + lines.join("\n---\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pinned-${config?.name || "ai"}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Smart slash suggestion based on attached file type
  const getFileSuggestion = (files: UploadedFile[]): { cmd: string; label: string; emoji: string; secondary?: { cmd: string; label: string; emoji: string } } | null => {
    if (!files.length) return null;
    const f = files[0];
    const ext = f.fileName.split(".").pop()?.toLowerCase() || "";
    const cat = f.category;
    if (cat === "image") return {
      cmd: "/gambar-teknis",
      emoji: "🖼️",
      label: "Analisis Gambar Teknis",
      secondary: { cmd: "/analisis", emoji: "🔍", label: "Analisis Umum" },
    };
    if (["xlsx", "xls", "csv"].includes(ext)) return { cmd: "/tabel", emoji: "📊", label: "Buat Tabel dari File" };
    if (["pdf", "doc", "docx"].includes(ext)) return { cmd: "/analisis", emoji: "🔍", label: "Analisis Dokumen" };
    if (["ppt", "pptx"].includes(ext)) return { cmd: "/ringkas", emoji: "📋", label: "Ringkas Presentasi" };
    return null;
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const setFeedback = (messageId: string, feedback: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, feedback: m.feedback === feedback ? null : feedback }
          : m
      )
    );
  };

  const [chatCopied, setChatCopied] = useState(false);

  const buildChatText = (format: "txt" | "md" = "txt") => {
    const header = format === "md"
      ? `# Chat dengan ${config?.name || "AI"}\n*${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}*\n\n---\n\n`
      : `Chat dengan ${config?.name || "AI"}\n${"=".repeat(40)}\n${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;
    const lines = messages.map((m) => {
      const time = m.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const sender = m.role === "user" ? "Anda" : (config?.name || "AI");
      if (format === "md") {
        return `### ${m.role === "user" ? "👤" : "🤖"} ${sender} — ${time}\n\n${m.content}\n`;
      }
      return `[${time}] ${sender}:\n${m.content}\n`;
    });
    return header + lines.join("\n---\n\n");
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const text = buildChatText("txt");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${config?.name || "ai"}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportChatMarkdown = () => {
    if (messages.length === 0) return;
    const text = buildChatText("md");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${config?.name || "ai"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportChatPdf = async () => {
    if (messages.length === 0) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxW = pageW - margin * 2;
      let y = 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Percakapan: ${config?.name || "AI Assistant"}`, margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Diekspor: ${new Date().toLocaleString("id-ID")}`, margin, y);
      y += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      for (const m of messages) {
        const sender = m.role === "user" ? "Anda" : (config?.name || "AI");
        const time = m.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const isUser = m.role === "user";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(isUser ? 30 : 79, isUser ? 30 : 70, isUser ? 30 : 229);
        doc.text(`${isUser ? "👤" : "🤖"} ${sender} — ${time}`, margin, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        const cleanText = m.content
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/#{1,6}\s/g, "")
          .replace(/!\[.*?\]\(.*?\)/g, "[gambar]")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

        const lines = doc.splitTextToSize(cleanText, maxW);
        for (const line of lines) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += 5;
        }
        y += 4;
        doc.setDrawColor(235, 235, 235);
        doc.line(margin, y - 2, pageW - margin, y - 2);
        y += 3;
        if (y > 270) { doc.addPage(); y = 20; }
      }

      doc.save(`chat-${config?.name || "ai"}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  const copyFullChat = async () => {
    if (messages.length === 0) return;
    const text = buildChatText("txt");
    await navigator.clipboard.writeText(text);
    setChatCopied(true);
    setTimeout(() => setChatCopied(false), 2500);
  };

  const clearChat = () => {
    setMessages([]);
    setFollowUpSuggestions([]);
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(`gustafta_context_${params.agentId}`);
    const newSessionId = `chat_${params.agentId}_${Date.now()}`;
    sessionIdRef.current = newSessionId;
    localStorage.setItem(`gustafta_session_${params.agentId}`, newSessionId);
    setProjectContext({});
    setContextCompleted(false);
    if (config?.contextQuestions && config.contextQuestions.length > 0) {
      setShowContextForm(true);
    }
  };

  const handleClientRegister = async () => {
    if (!regName || !regEmail) return;
    setRegistering(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get("ref") || undefined;
      const selectedPlan = config?.trialEnabled ? "trial" : (config?.monthlyPrice && config.monthlyPrice > 0 ? "monthly" : "trial");
      const res = await fetch(`/api/products/${params.agentId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: regName,
          customerEmail: regEmail,
          customerPhone: regPhone,
          plan: selectedPlan,
          referralCode,
        }),
      });
      const data = await res.json();
      if (data.subscription) {
        const token = data.accessToken || data.subscription.accessToken;
        setClientToken(token);
        setClientInfo({ name: regName, email: regEmail, plan: data.subscription.plan });
        localStorage.setItem(`gustafta_client_${params.agentId}`, token);
        setShowRegistration(false);
        if (data.paymentUrl) {
          window.open(data.paymentUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Registration failed:", err);
    }
    setRegistering(false);
  };

  const handleClaimAccessByEmail = async () => {
    if (!claimEmail.trim()) return;
    setClaimLoading(true);
    setClaimError(null);
    try {
      const res = await fetch(`/api/products/${params.agentId}/token-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: claimEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        setClientToken(data.accessToken);
        setClientInfo({ name: data.customerName, email: claimEmail.trim().toLowerCase(), plan: data.plan });
        localStorage.setItem(`gustafta_client_${params.agentId}`, data.accessToken);
        setShowUpgradeWall(false);
        setShowClaimAccess(false);
        setClaimEmail("");
      } else {
        setClaimError(data.error || "Gagal mengambil akses.");
      }
    } catch {
      setClaimError("Gagal menghubungi server. Coba lagi.");
    }
    setClaimLoading(false);
  };

  const handleVoucherRedeem = async () => {
    if (!voucherCode.trim()) return;
    if (!clientToken) {
      setVoucherMessage({ type: "error", text: "Silakan daftar terlebih dahulu sebelum menggunakan voucher." });
      return;
    }
    setVoucherLoading(true);
    setVoucherMessage(null);
    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCode.trim().toUpperCase(),
          accessToken: clientToken,
          agentId: params.agentId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVoucherMessage({ type: "success", text: data.message });
        setVoucherCode("");
        setTimeout(() => {
          setShowUpgradeWall(false);
          setVoucherMessage(null);
        }, 2000);
      } else {
        setVoucherMessage({ type: "error", text: data.error || "Gagal menggunakan voucher" });
      }
    } catch {
      setVoucherMessage({ type: "error", text: "Gagal menggunakan voucher" });
    }
    setVoucherLoading(false);
  };

  const extractFollowUps = useCallback((content: string) => {
    const suggestions: string[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 80 && trimmed.endsWith("?")) {
        suggestions.push(trimmed.replace(/^[-*\d.)\s]+/, "").trim());
      }
    }
    if (suggestions.length === 0 && content.length > 50) {
      const topics = content.match(/\b(tentang|mengenai|soal|terkait)\s+([^,.!?]+)/gi);
      if (topics && topics.length > 0) {
        suggestions.push(`Bisa jelaskan lebih detail ${topics[0]}?`);
      }
    }
    return suggestions.slice(0, 3);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploaded: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data);

          // Auto-transcribe audio files
          if (data.category === "audio") {
            try {
              const tFormData = new FormData();
              tFormData.append("file", file);
              const tRes = await fetch("/api/chat/transcribe", { method: "POST", body: tFormData });
              if (tRes.ok) {
                const tData = await tRes.json();
                if (tData.transcript) {
                  setInput(prev => prev ? `${prev}\n\n${tData.transcript}` : tData.transcript);
                }
              }
            } catch {
              // transcription optional — continue silently
            }
          }
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    setPendingFiles((prev) => [...prev, ...uploaded]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "audio": return <Music className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "document": return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    if (params.agentId) {
      fetch(`/api/chat/config/${params.agentId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Agent not found");
          return res.json();
        })
        .then((data) => {
          setConfig(data);
          setLoading(false);

          // Redirect to slug-based URL if currently using numeric ID
          if (data.slug && /^\d+$/.test(params.agentId || "")) {
            window.history.replaceState(null, "", `/bot/${data.slug}`);
          }

          // Init per-chatbot trial state
          if (data.trialEnabled) {
            const trialKey = `gustafta_trial_${params.agentId}`;
            const today = new Date().toISOString().split("T")[0];
            let ts = null;
            try { ts = JSON.parse(localStorage.getItem(trialKey) || "null"); } catch {}
            if (!ts) {
              ts = { firstVisitDate: today, dailyCounts: {} };
              localStorage.setItem(trialKey, JSON.stringify(ts));
            }
            setTrialState(ts);
          }

          document.title = partnerBranding
            ? `${data.name}${partnerBranding.brandName ? ` - ${partnerBranding.brandName}` : ""}`
            : `${data.name} - Gustafta AI`;

          const metaTheme = document.querySelector('meta[name="theme-color"]');
          if (metaTheme) metaTheme.setAttribute("content", data.color || "#6366f1");

          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute("content", data.description || data.tagline || `Chat with ${data.name}`);

          const manifestLink = document.querySelector('link[rel="manifest"]');
          if (manifestLink) manifestLink.setAttribute("href", `/api/manifest/${params.agentId}`);

          const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
          if (appleTouchIcon && data.avatar) {
            appleTouchIcon.setAttribute("href", data.avatar);
          }

          const favicon = document.querySelector('link[rel="icon"]');
          if (favicon && data.avatar) {
            favicon.setAttribute("href", data.avatar);
          }

          const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
          if (appleTitle) appleTitle.setAttribute("content", data.name);

          if (data.metaPixelId) {
            injectMetaPixel(data.metaPixelId);
          }

          fetch(`/api/conversion-config/${params.agentId}`).then(r => r.json()).then(convData => {
            setConversionConfig(convData);
          }).catch(() => {});
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [params.agentId]);

  useEffect(() => {
    const savedToken = localStorage.getItem(`gustafta_client_${params.agentId}`);
    if (savedToken) {
      setClientToken(savedToken);
      fetch("/api/client/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: savedToken, agentId: params.agentId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setClientInfo({ name: data.subscription.customerName, email: data.subscription.customerEmail, plan: data.subscription.plan });
            if (data.subscription.endDate) {
              const daysLeft = Math.ceil((new Date(data.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 2 && daysLeft > 0 && data.subscription.plan === "trial") {
                setQuotaError(`Trial berakhir dalam ${daysLeft} hari. Upgrade untuk akses penuh.`);
              }
            }
          } else {
            if (data.error === "Subscription expired") {
              setUpgradeReason("expired");
              setShowUpgradeWall(true);
            }
            localStorage.removeItem(`gustafta_client_${params.agentId}`);
            setClientToken(null);
          }
        })
        .catch(() => {});
    }
  }, [params.agentId]);

  useEffect(() => {
    if (config && (config as any).requireRegistration && !clientToken) {
      setShowRegistration(true);
    } else {
      setShowRegistration(false);
    }
  }, [config, clientToken]);

  useEffect(() => {
    if (config && config.contextQuestions && config.contextQuestions.length > 0 && !contextCompleted && messages.length === 0) {
      const savedContext = localStorage.getItem(`gustafta_context_${params.agentId}`);
      if (savedContext) {
        try {
          const parsed = JSON.parse(savedContext);
          setProjectContext(parsed);
          setContextCompleted(true);
        } catch {}
      } else {
        setShowContextForm(true);
      }
    }
  }, [config, contextCompleted, messages.length, params.agentId]);

  useEffect(() => {
    if (!conversionConfig?.conversionEnabled || showCtaCard || leadSubmitted) return;
    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (userMsgCount >= (conversionConfig.ctaTriggerAfterMessages || 5)) {
      setShowCtaCard(true);
      return;
    }
    if (conversionConfig.scoringEnabled && conversionConfig.ctaTriggerOnScore > 0) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
      if (lastAssistantMsg) {
        const scoreMatch = lastAssistantMsg.content.match(/(?:skor|score|nilai)[:\s]*(\d+)/i);
        if (scoreMatch) {
          const detectedScore = parseInt(scoreMatch[1]);
          if (detectedScore <= conversionConfig.ctaTriggerOnScore) {
            setShowCtaCard(true);
          }
        }
      }
    }
  }, [messages, conversionConfig]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const needsContext = config && config.contextQuestions && config.contextQuestions.length > 0 && !contextCompleted && messages.length === 0;

  const sendMessage = async (content: string) => {
    if ((!content.trim() && pendingFiles.length === 0) || isTyping || !config) return;
    if (needsContext) return;

    if (messages.length === 0) {
      trackMetaEvent("ViewContent", { content_name: config.name });
    }

    // Check trial limits for non-registered mode
    if (config && !config.requireRegistration && !clientToken) {
      if (config.trialEnabled && trialState) {
        const maxDays = config.trialDays ?? 7;
        const dailyLimit = config.guestMessageLimit ?? 5;
        // Trial expired (past max days)
        if (trialDayNumber > maxDays) {
          setUpgradeReason("trial_expired");
          setShowUpgradeWall(true);
          return;
        }
        // Daily limit reached
        const today = getTodayStr();
        const usedToday = trialState.dailyCounts[today] ?? 0;
        if (dailyLimit > 0 && usedToday >= dailyLimit) {
          setUpgradeReason("daily_trial");
          setShowUpgradeWall(true);
          return;
        }
      } else if (!config.trialEnabled) {
        // Non-trial guest limit (total count fallback)
        const guestLimit = config.guestMessageLimit ?? 10;
        if (guestLimit > 0 && guestMessageCount >= guestLimit) {
          setUpgradeReason("guest_limit");
          setShowUpgradeWall(true);
          return;
        }
      }
    }

    if (config && clientToken) {
      try {
        const quotaRes = await fetch("/api/client/check-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: clientToken, agentId: params.agentId, sessionId: sessionIdRef.current }),
        });
        const quotaData = await quotaRes.json();
        if (!quotaData.allowed) {
          if (quotaData.reason === "daily_limit_reached") {
            setQuotaError(`Kuota harian tercapai (${quotaData.limit} pesan). Coba lagi besok.`);
          } else if (quotaData.reason === "monthly_limit_reached") {
            setUpgradeReason("monthly_limit");
            setShowUpgradeWall(true);
          } else if (quotaData.reason === "subscription_expired") {
            setUpgradeReason("expired");
            setShowUpgradeWall(true);
          } else {
            setQuotaError("Akses ditolak. Silakan registrasi ulang.");
          }
          return;
        }
        if (quotaData.dailyUsed !== undefined) {
          setQuotaInfo({ dailyUsed: quotaData.dailyUsed, dailyLimit: quotaData.dailyLimit, monthlyUsed: quotaData.monthlyUsed, monthlyLimit: quotaData.monthlyLimit });
        }
        setQuotaError(null);
      } catch (err) {
        console.error("Quota check failed:", err);
      }
    }

    const displayContent = content.trim();
    const attachments = [...pendingFiles];

    let messageContent = displayContent;
    if (attachments.length > 0 && !displayContent) {
      messageContent = attachments.map(f => `[${f.fileName}]`).join(", ");
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent || attachments.map(f => `[${f.fileName}]`).join(", "),
      timestamp: new Date(),
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingFiles([]);
    setFollowUpSuggestions([]);
    setShowQuickActions(false);
    setDataMasterInjected(false);
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // ── DALL-E image generation intercept ──────────────────────────────────────
    const gambarMatch = displayContent.match(/^\/gambar\s+(.+)/i);
    if (gambarMatch) {
      const imagePrompt = gambarMatch[1].trim();
      setIsGeneratingImage(true);
      try {
        const genRes = await fetch("/api/chat/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: imagePrompt }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error || "Gagal generate");
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `🎨 **Gambar AI berhasil dibuat!**\n\n> Prompt: ${imagePrompt}${genData.revisedPrompt && genData.revisedPrompt !== imagePrompt ? `\n> *(DALL-E revised: ${genData.revisedPrompt})*` : ""}\n\n![Generated Image](${genData.imageUrl})`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (err: any) {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `❌ Gagal membuat gambar: ${err.message}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errMsg]);
      } finally {
        setIsGeneratingImage(false);
        setIsTyping(false);
      }
      return;
    }
    // ── End DALL-E intercept ───────────────────────────────────────────────────

    try {
      const resolvedAgentId = config.agentId || params.agentId;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (clientToken) {
        headers["x-client-token"] = clientToken;
      }
      const response = await fetch("/api/messages/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({
          agentId: resolvedAgentId,
          role: "user",
          content: messageContent,
          sessionId: sessionIdRef.current,
          clientToken: clientToken || undefined,
          projectContext: Object.keys(projectContext).length > 0 ? projectContext : undefined,
          attachments: attachments.length > 0 ? attachments.map(f => ({
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            category: f.category,
            mimeType: f.mimeType,
            fileSize: f.fileSize,
          })) : undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.reason === "guest_limit_reached") {
          setUpgradeReason("guest_limit");
          setShowUpgradeWall(true);
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          setIsTyping(false);
          return;
        }
        if (errData.reason === "subscription_expired") {
          setUpgradeReason("expired");
          setShowUpgradeWall(true);
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          setIsTyping(false);
          return;
        }
        if (errData.reason === "daily_limit_reached" || errData.reason === "monthly_limit_reached") {
          setUpgradeReason(errData.reason === "daily_limit_reached" ? "daily_limit" : "monthly_limit");
          setShowUpgradeWall(true);
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          setIsTyping(false);
          return;
        }
        throw new Error(errData.error || "Failed to send message");
      }
      
      // Sync guest/trial counter
      if (!clientToken && !config.requireRegistration) {
        if (config.trialEnabled && trialState) {
          // Increment local trial daily counter
          incrementTrialCount();
        } else {
          try {
            const statusRes = await fetch("/api/client/check-quota", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agentId: params.agentId }),
            });
            const statusData = await statusRes.json();
            if (statusData.guestUsed !== undefined) {
              setGuestMessageCount(statusData.guestUsed);
            } else {
              setGuestMessageCount((prev) => prev + 1);
            }
          } catch {
            setGuestMessageCount((prev) => prev + 1);
          }
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "error") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: "Maaf, terjadi kesalahan saat memproses pesan. Silakan coba lagi nanti.",
                    };
                  }
                  return updated;
                });
                break;
              }
              if (parsed.type === "orchestrating_start") {
                setOrchestrationState({
                  active: true,
                  phase: "dispatching",
                  total: parsed.total || (parsed.subAgents || []).length,
                  cap: parsed.cap,
                  criticEnabled: parsed.criticEnabled,
                  subAgents: (parsed.subAgents || []).map((s: any) => ({ agentId: s.agentId, role: s.role, status: "pending", jsonMode: s.outputFormat === "json" })),
                });
              } else if (parsed.type === "router_decision") {
                setOrchestrationState(prev => prev ? {
                  ...prev,
                  phase: "dispatching",
                  routerDecision: { selected: parsed.selected || [], fromTotal: parsed.fromTotal || 0, parseOk: parsed.parseOk !== false, reason: parsed.reason },
                } : prev);
              } else if (parsed.type === "sub_agent_start") {
                setOrchestrationState(prev => prev ? {
                  ...prev,
                  subAgents: prev.subAgents.map(s => s.agentId === parsed.agentId ? { ...s, status: "pending", jsonMode: parsed.jsonMode } : s),
                } : prev);
              } else if (parsed.type === "sub_agent_done") {
                setOrchestrationState(prev => prev ? {
                  ...prev,
                  subAgents: prev.subAgents.map(s => s.agentId === parsed.agentId
                    ? { ...s, status: "done", elapsed: parsed.elapsed, chars: parsed.chars, confidence: parsed.confidence, jsonMode: parsed.jsonMode }
                    : s),
                } : prev);
              } else if (parsed.type === "critic_result") {
                setOrchestrationState(prev => prev ? {
                  ...prev,
                  phase: "critic",
                  criticDecision: { pass: parsed.pass, confidence: parsed.confidence ?? 0.6, missingCount: parsed.missingCount ?? 0, conflictsCount: parsed.conflictsCount ?? 0 },
                } : prev);
              } else if (parsed.type === "aggregating") {
                setOrchestrationState(prev => prev ? { ...prev, phase: "aggregating", totalMs: parsed.totalMs } : prev);
              } else if (parsed.type === "data_master_injected") {
                setDataMasterInjected(true);
              } else if (parsed.type === "complete") {
                setOrchestrationState(null);
              }
              if (parsed.content) {
                if (orchestrationState) setOrchestrationState(prev => prev ? { ...prev, active: false } : prev);
                assistantContent += parsed.content;
                const displayContent = assistantContent
                  .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*?\[\/SAVE_MEMORY\]/g, "")
                  .replace(/\[DELETE_MEMORY\][\s\S]*?\[\/DELETE_MEMORY\]/g, "")
                  .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*$/g, "")
                  .replace(/\[DELETE_MEMORY\][\s\S]*$/g, "")
                  .trim();
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: displayContent,
                    };
                  }
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
      if (voiceMode && assistantContent.trim()) {
        speakText(assistantContent, assistantMessage.id);
      }
      const followUps = extractFollowUps(assistantContent);
      setFollowUpSuggestions(followUps);
      setShowQuickActions(true);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getFilteredSlashCommands = () => {
    if (!input.startsWith("/")) return [];
    const q = input.toLowerCase();
    return SLASH_COMMANDS.filter(c => c.cmd.startsWith(q) || c.label.toLowerCase().includes(q.slice(1)));
  };

  const applySlashCommand = (cmd: typeof SLASH_COMMANDS[0]) => {
    setInput(cmd.prefix);
    setShowSlashMenu(false);
    setSlashMenuIdx(0);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const filtered = getFilteredSlashCommands();
    if (showSlashMenu && filtered.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashMenuIdx(i => (i + 1) % filtered.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashMenuIdx(i => (i - 1 + filtered.length) % filtered.length); return; }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); applySlashCommand(filtered[slashMenuIdx]); return; }
      if (e.key === "Escape") { setShowSlashMenu(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config?.name || "Chat",
          text: config?.tagline || "Chat with AI assistant",
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = true;

      let finalTranscript = "";

      recognition.onstart = () => {
        setIsListening(true);
        finalTranscript = "";
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }
        setInput(finalTranscript + interim);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (finalTranscript.trim()) {
          sendMessageRef.current(finalTranscript.trim());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingMessageIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = async (text: string, messageId?: string) => {
    const cleanText = text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/^>\s*/gm, "")
      .replace(/---+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    if (!cleanText) return;

    try {
      setIsSpeaking(true);
      speakingMessageIdRef.current = messageId || null;

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        speakingMessageIdRef.current = null;
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        speakingMessageIdRef.current = null;
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
      speakingMessageIdRef.current = null;
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    speakingMessageIdRef.current = null;
  };

  const toggleSpeech = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setVoiceMode(true);
      setInput("");
      recognitionRef.current.start();
    }
  };

  const handleLeadSubmit = async () => {
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: parseInt(params.agentId!),
          sessionId: sessionIdRef.current,
          name: leadFormData.name || "",
          email: leadFormData.email || "",
          phone: leadFormData.phone || "",
          company: leadFormData.company || "",
          source: "chat",
          metadata: { conversationLength: messages.length, contextAnswers: projectContext },
        }),
      });
      if (res.ok) {
        setLeadSubmitted(true);
        setTimeout(() => {
          setShowLeadForm(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Lead capture failed:", err);
    }
  };

  const SmartCtaCard = () => {
    if (!conversionConfig?.conversionEnabled || !showCtaCard) return null;
    const cta = conversionConfig.conversionCta || {};
    const offers = conversionConfig.conversionOffers || [];
    const whatsappCta = conversionConfig.whatsappCta;
    const calendlyUrl = conversionConfig.calendlyUrl;

    return (
      <div className="py-2" data-testid="smart-cta-card">
        <Card className="border-2" style={{ borderColor: `${color}40` }}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Target className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" data-testid="text-cta-title">
                  {cta.title || "Tertarik dengan layanan kami?"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-cta-description">
                  {cta.description || "Hubungi kami untuk konsultasi lebih lanjut"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {cta.buttonText && (
                <Button
                  size="sm"
                  className="text-xs text-white"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (cta.buttonUrl) {
                      window.open(cta.buttonUrl, "_blank");
                    } else {
                      setShowLeadForm(true);
                    }
                  }}
                  data-testid="button-cta-primary"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  {cta.buttonText}
                </Button>
              )}
              {!cta.buttonText && (
                <Button
                  size="sm"
                  className="text-xs text-white"
                  style={{ backgroundColor: color }}
                  onClick={() => setShowLeadForm(true)}
                  data-testid="button-cta-lead"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  Hubungi Kami
                </Button>
              )}
              {whatsappCta && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-green-600 border-green-200"
                  onClick={() => window.open(`https://wa.me/${whatsappCta.replace(/[^0-9]/g, "")}`, "_blank")}
                  data-testid="button-cta-whatsapp"
                >
                  <Phone className="w-3 h-3 mr-1.5" />
                  WhatsApp
                </Button>
              )}
              {calendlyUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => window.open(calendlyUrl, "_blank")}
                  data-testid="button-cta-calendly"
                >
                  <Calendar className="w-3 h-3 mr-1.5" />
                  Jadwalkan Meeting
                </Button>
              )}
            </div>

            {offers.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Penawaran untuk Anda:</p>
                {offers.map((offer: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-3 space-y-1.5"
                    style={{ borderColor: `${color}20` }}
                    data-testid={`card-offer-${idx}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium text-sm">{offer.title}</span>
                      {offer.price && (
                        <Badge variant="secondary" className="text-xs no-default-hover-elevate no-default-active-elevate" style={{ color }}>
                          {offer.price}
                        </Badge>
                      )}
                    </div>
                    {offer.features && offer.features.length > 0 && (
                      <ul className="space-y-0.5">
                        {offer.features.map((feat: string, fi: number) => (
                          <li key={fi} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 shrink-0" style={{ color }} />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    )}
                    {offer.ctaButton && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-full mt-1"
                        onClick={() => {
                          if (offer.ctaUrl) {
                            window.open(offer.ctaUrl, "_blank");
                          } else {
                            setShowLeadForm(true);
                          }
                        }}
                        data-testid={`button-offer-cta-${idx}`}
                      >
                        {offer.ctaButton}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const LeadCaptureForm = () => {
    if (!showLeadForm) return null;

    const fields = conversionConfig?.leadCaptureFields && conversionConfig.leadCaptureFields.length > 0
      ? conversionConfig.leadCaptureFields
      : [
          { name: "name", label: "Nama", type: "text", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Telepon", type: "phone", required: false },
        ];

    if (leadSubmitted) {
      return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="lead-form-success">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <CheckCircle className="w-8 h-8" style={{ color }} />
                </div>
              </div>
              <h2 className="text-xl font-semibold" data-testid="text-lead-success-title">Terima Kasih!</h2>
              <p className="text-sm text-muted-foreground">
                Data Anda telah kami terima. Tim kami akan segera menghubungi Anda.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadForm(false)}
                data-testid="button-lead-success-close"
              >
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="lead-capture-form">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Target className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" data-testid="text-lead-form-title">Hubungi Kami</h2>
                  <p className="text-xs text-muted-foreground">Isi data berikut dan kami akan menghubungi Anda</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowLeadForm(false)}
                data-testid="button-lead-form-close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field: any) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                  </label>
                  <input
                    type={field.type === "phone" ? "tel" : field.type || "text"}
                    value={leadFormData[field.name] || ""}
                    onChange={(e) => setLeadFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder || field.label}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid={`input-lead-${field.name}`}
                  />
                </div>
              ))}
            </div>

            <Button
              className="w-full text-white"
              style={{ backgroundColor: color }}
              onClick={handleLeadSubmit}
              disabled={fields.some((f: any) => f.required && !leadFormData[f.name]?.trim())}
              data-testid="button-lead-submit"
            >
              <Send className="w-4 h-4 mr-2" />
              Kirim
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Memuat chatbot...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Chatbot Tidak Ditemukan</h2>
          <p className="text-muted-foreground text-sm">
            Chatbot ini mungkin tidak aktif, tidak publik, atau link-nya tidak valid.
          </p>
          <a href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </a>
        </Card>
      </div>
    );
  }

  const color = config.color || "#6366f1";
  const hasMessages = messages.length > 0;

  const featureBadges = [
    { icon: Sparkles, label: "AI Cerdas", show: true },
    { icon: Mic, label: "Suara", show: speechSupported },
    { icon: Paperclip, label: "File & Dokumen", show: true },
    { icon: Languages, label: langLabels[config.language] || "Multi-bahasa", show: true },
    { icon: Shield, label: "Aman", show: true },
  ];

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {showRegistration && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <AgentAvatar config={config} size="lg" color={color} />
                </div>
                <h2 className="text-xl font-semibold">{config?.name}</h2>
                <p className="text-sm text-muted-foreground">Daftar untuk mulai chat</p>
                {config && (config as any).monthlyPrice > 0 && (
                  <Badge variant="secondary">
                    {(config as any).trialEnabled
                      ? `Trial ${(config as any).trialDays} hari gratis`
                      : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format((config as any).monthlyPrice) + "/bulan"}
                  </Badge>
                )}
              </div>
              {(config?.paymentUrl || showClaimAccess) && (
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => { setShowClaimAccess(s => !s); setClaimError(null); }}
                    className="w-full text-sm font-medium text-center flex items-center justify-center gap-1.5"
                    style={{ color }}
                    data-testid="button-toggle-claim-access"
                  >
                    <Check className="w-4 h-4" />
                    Sudah bayar? Ambil akses di sini
                  </button>
                  {showClaimAccess && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="email"
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder="Masukkan email yang digunakan saat bayar"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        data-testid="input-claim-email"
                      />
                      {claimError && (
                        <p className="text-xs text-destructive">{claimError}</p>
                      )}
                      <Button
                        onClick={handleClaimAccessByEmail}
                        disabled={!claimEmail.trim() || claimLoading}
                        className="w-full"
                        data-testid="button-claim-access"
                      >
                        {claimLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Ambil Akses
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Gunakan email yang sama persis saat Anda melakukan pembayaran.
                      </p>
                      <p className="text-xs text-muted-foreground text-center">atau daftar manual di bawah</p>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nama</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                   
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                   
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Telepon (opsional)</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                   
                  />
                </div>
              </div>
              <Button
                onClick={handleClientRegister}
                disabled={!regName || !regEmail || registering}
                className="w-full"
               
              >
                {registering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {registering ? "Mendaftar..." : "Mulai Chat"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showUpgradeWall && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Shield className="w-6 h-6" style={{ color }} />
                  </div>
                </div>
                <h2 className="text-xl font-semibold" data-testid="text-upgrade-title">
                  {upgradeReason === "trial_expired" ? "Masa Trial Berakhir" :
                   upgradeReason === "daily_trial" ? "Kuota Harian Trial Habis" :
                   upgradeReason === "guest_limit" ? "Batas Pesan Gratis Tercapai" :
                   upgradeReason === "expired" ? "Langganan Berakhir" :
                   upgradeReason === "daily_limit" ? "Kuota Harian Habis" :
                   upgradeReason === "monthly_limit" ? "Kuota Bulanan Habis" :
                   "Upgrade Diperlukan"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {upgradeReason === "trial_expired"
                    ? `Trial ${config?.trialDays ?? 7} hari Anda telah berakhir. Daftar sekarang untuk melanjutkan menggunakan ${config?.name ?? "chatbot"} ini.`
                    : upgradeReason === "daily_trial"
                    ? `Anda telah menggunakan ${config?.guestMessageLimit ?? 5} pertanyaan hari ini. Kembali besok untuk ${config?.guestMessageLimit ?? 5} pertanyaan baru, atau daftar untuk akses penuh.`
                    : upgradeReason === "guest_limit"
                    ? `Anda telah menggunakan ${config?.guestMessageLimit ?? 10} pesan gratis. Daftar untuk melanjutkan percakapan.`
                    : upgradeReason === "expired"
                    ? "Masa langganan Anda telah berakhir. Perpanjang untuk terus menggunakan layanan ini."
                    : upgradeReason === "daily_limit"
                    ? "Kuota pesan harian Anda sudah habis. Coba lagi besok atau upgrade paket."
                    : "Kuota pesan bulanan Anda sudah habis. Upgrade paket untuk mendapatkan lebih banyak pesan."}
                </p>
                {upgradeReason === "daily_trial" && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                      Hari ke-{Math.min(trialDayNumber, config?.trialDays ?? 7)} dari {config?.trialDays ?? 7}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                      {todayUsed}/{config?.guestMessageLimit ?? 5} pertanyaan hari ini
                    </span>
                  </div>
                )}
              </div>

              {config && config.monthlyPrice > 0 && (
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Paket Bulanan</span>
                    <span className="font-semibold" style={{ color }}>
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(config.monthlyPrice)}/bulan
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3" style={{ color }} />
                      {config.messageQuotaDaily} pesan/hari
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" style={{ color }} />
                      {config.messageQuotaMonthly} pesan/bulan
                    </li>
                  </ul>
                  {config.paymentUrl && (
                    <a href={config.paymentUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2 font-semibold" style={{ backgroundColor: color, color: "#fff" }} data-testid="button-pay-scalev">
                        <ExternalLink className="w-4 h-4" />
                        Bayar Sekarang
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {!clientToken ? (
                <div className="space-y-3">
                  {/* If paymentUrl exists, or a support link forced ?claim=1, show "Sudah bayar?" email claim first */}
                  {(config?.paymentUrl || showClaimAccess) && (
                    <div className="rounded-lg border border-dashed p-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => { setShowClaimAccess(s => !s); setClaimError(null); }}
                        className="w-full text-sm font-medium text-center flex items-center justify-center gap-1.5"
                        style={{ color }}
                        data-testid="button-toggle-claim-access"
                      >
                        <Check className="w-4 h-4" />
                        Sudah bayar? Ambil akses di sini
                      </button>
                      {showClaimAccess && (
                        <div className="space-y-2 pt-1">
                          <input
                            type="email"
                            value={claimEmail}
                            onChange={(e) => setClaimEmail(e.target.value)}
                            placeholder="Masukkan email yang digunakan saat bayar"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            data-testid="input-claim-email"
                          />
                          {claimError && (
                            <p className="text-xs text-destructive">{claimError}</p>
                          )}
                          <Button
                            onClick={handleClaimAccessByEmail}
                            disabled={!claimEmail.trim() || claimLoading}
                            className="w-full"
                            data-testid="button-claim-access"
                          >
                            {claimLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Ambil Akses
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Gunakan email yang sama persis saat Anda melakukan pembayaran.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If no paymentUrl, show regular registration form */}
                  {!config?.paymentUrl && (
                    <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      data-testid="input-upgrade-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      data-testid="input-upgrade-email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Telepon (opsional)</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      data-testid="input-upgrade-phone"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      await handleClientRegister();
                      setShowUpgradeWall(false);
                    }}
                    disabled={!regName || !regEmail || registering}
                    className="w-full"
                    data-testid="button-upgrade-register"
                  >
                    {registering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {config?.trialEnabled ? `Mulai Trial ${config.trialDays} Hari` : "Daftar & Lanjutkan"}
                  </Button>
                    </>
                  )}

                  {/* Always show trial/free registration if trial is enabled AND paymentUrl exists */}
                  {config?.paymentUrl && config?.trialEnabled && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs text-muted-foreground text-center">Belum siap berlangganan? Coba gratis dulu</p>
                      <div className="space-y-1.5">
                        <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Nama lengkap" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="input-upgrade-name" />
                      </div>
                      <div className="space-y-1.5">
                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="email@contoh.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="input-upgrade-email" />
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => { await handleClientRegister(); setShowUpgradeWall(false); }}
                        disabled={!regName || !regEmail || registering}
                        className="w-full"
                        data-testid="button-upgrade-trial"
                      >
                        {registering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Mulai Trial {config.trialDays} Hari Gratis
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Terdaftar sebagai <span className="font-medium text-foreground">{clientInfo?.name}</span>
                  </p>
                  {config && config.monthlyPrice > 0 ? (
                    <Button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/products/${params.agentId}/subscribe`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              customerName: clientInfo?.name || "",
                              customerEmail: clientInfo?.email || "",
                              plan: "monthly",
                            }),
                          });
                          const data = await res.json();
                          if (data.paymentUrl) {
                            window.open(data.paymentUrl, "_blank");
                          }
                          setShowUpgradeWall(false);
                        } catch (err) {
                          console.error("Upgrade failed:", err);
                        }
                      }}
                      className="w-full"
                      data-testid="button-upgrade-pay"
                    >
                      Upgrade Sekarang
                    </Button>
                  ) : upgradeReason === "daily_limit" ? (
                    <p className="text-sm text-center text-muted-foreground">
                      Kuota harian akan direset besok. Terima kasih sudah menggunakan layanan ini.
                    </p>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">
                      Hubungi penyedia layanan untuk informasi upgrade.
                    </p>
                  )}
                </div>
              )}

              {clientToken && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Punya kode voucher?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode voucher"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
                      data-testid="input-voucher-code"
                    />
                    <Button
                      onClick={handleVoucherRedeem}
                      disabled={!voucherCode.trim() || voucherLoading}
                      data-testid="button-voucher-redeem"
                    >
                      {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
                    </Button>
                  </div>
                  {voucherMessage && (
                    <p className={`text-xs text-center ${voucherMessage.type === "success" ? "text-green-600" : "text-destructive"}`}>
                      {voucherMessage.text}
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowUpgradeWall(false)}
                data-testid="button-upgrade-dismiss"
              >
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <LeadCaptureForm />

      {/* Header */}
      <header
        className="border-b px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-50"
        style={{ backgroundColor: color }}
       
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <a href="/">
            <Button size="icon" variant="ghost" className="text-white shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </a>
          <div className="relative shrink-0">
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-white/30">
              {config.avatar ? (
                <AvatarImage src={config.avatar} alt={config.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                {config.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: color }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-sm sm:text-base truncate">
              {config.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-white/60 text-[10px] sm:text-xs truncate max-w-[140px] sm:max-w-none">
                {config.tagline || "Online"}
              </p>
              {config.chatStyle && (() => {
                const cs = getChatStyle(config.chatStyle);
                return (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${cs.badgeBg} ${cs.badgeText} shrink-0`}>
                    <span>{cs.emoji}</span>
                    <span>{cs.label}</span>
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className={cn("text-white shrink-0 toggle-elevate", voiceMode && "toggle-elevated")}
            onClick={() => {
              setVoiceMode(!voiceMode);
              if (voiceMode) stopSpeaking();
            }}
           
          >
            {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          {/* Search toggle */}
          <Button
            size="icon"
            variant="ghost"
            className={cn("text-white shrink-0", searchOpen && "bg-white/20")}
            onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); }}
            title="Cari dalam percakapan"
          >
            {searchOpen ? <SearchX className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>
          {/* Pinned badge */}
          {pinnedIds.size > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="text-white shrink-0 relative"
              onClick={() => setShowPinnedPanel(p => !p)}
              title="Pesan yang di-pin"
            >
              <BookmarkCheck className="w-4 h-4 text-amber-300" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 text-[8px] font-bold text-white flex items-center justify-center">
                {pinnedIds.size}
              </span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white shrink-0">
                <Share2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Bagikan</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleShare}>
                <Link2 className="w-3.5 h-3.5 mr-2" />
                Bagikan Link Chatbot
              </DropdownMenuItem>
              {hasMessages && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Salin & Ekspor Percakapan</DropdownMenuLabel>
                  <DropdownMenuItem onClick={copyFullChat}>
                    {chatCopied
                      ? <><Check className="w-3.5 h-3.5 mr-2 text-green-500" /><span className="text-green-600 font-medium">Tersalin!</span></>
                      : <><Copy className="w-3.5 h-3.5 mr-2" />Salin Percakapan</>
                    }
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChat}>
                    <FileDown className="w-3.5 h-3.5 mr-2" />
                    Unduh sebagai .TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChatMarkdown}>
                    <FileCode2 className="w-3.5 h-3.5 mr-2" />
                    Unduh sebagai .MD
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChatPdf}>
                    <FileOutput className="w-3.5 h-3.5 mr-2 text-red-500" />
                    Unduh sebagai .PDF
                  </DropdownMenuItem>
                  {pinnedIds.size > 0 && (
                    <DropdownMenuItem onClick={exportPinnedMessages}>
                      <BookmarkCheck className="w-3.5 h-3.5 mr-2 text-amber-500" />
                      Unduh Pesan Tersimpan ({pinnedIds.size})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearChat} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Hapus Percakapan
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Welcome Screen - Rich Profile */}
        {!hasMessages && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center">
              {/* Hero Section with Gradient */}
              <div
                className="w-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${color} 0%, ${color}dd 40%, ${color}99 100%)`,
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
                  <div className="absolute bottom-4 right-12 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                </div>

                <div className="relative px-4 sm:px-6 pt-8 sm:pt-10 pb-16 sm:pb-20 flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white/30 shadow-lg">
                      {config.avatar ? (
                        <AvatarImage src={config.avatar} alt={config.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-white/20 text-white">
                        {config.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-3 border-white flex items-center justify-center"
                    >
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <h2 className="text-white text-2xl sm:text-3xl font-bold mb-1">
                    {config.name}
                  </h2>

                  {config.tagline && (
                    <p className="text-white/80 text-sm sm:text-base mb-3 max-w-md">
                      {config.tagline}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                    {config.category && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] sm:text-xs no-default-hover-elevate no-default-active-elevate">
                        {config.category}{config.subcategory ? ` / ${config.subcategory}` : ""}
                      </Badge>
                    )}
                    {config.communicationStyle && (
                      <Badge variant="secondary" className="bg-white/15 text-white/90 border-0 text-[10px] sm:text-xs no-default-hover-elevate no-default-active-elevate">
                        {styleLabels[config.communicationStyle] || config.communicationStyle}
                      </Badge>
                    )}
                    {config.toneOfVoice && config.toneOfVoice !== config.communicationStyle && (
                      <Badge variant="secondary" className="bg-white/15 text-white/90 border-0 text-[10px] sm:text-xs no-default-hover-elevate no-default-active-elevate">
                        {styleLabels[config.toneOfVoice] || config.toneOfVoice}
                      </Badge>
                    )}
                    {config.responseStyle && config.responseStyle !== "balanced" && (
                      <Badge variant="secondary" className="bg-white/15 text-white/90 border-0 text-[10px] sm:text-xs no-default-hover-elevate no-default-active-elevate">
                        {config.responseStyle === "creative" ? "✨ Kreatif" : config.responseStyle === "structured" ? "📋 Terstruktur" : "🎨 Kustom"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Card - overlapping hero */}
              <div className="w-full max-w-lg px-4 -mt-10 sm:-mt-12 relative z-10">
                <Card className="shadow-lg">
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    {/* Greeting */}
                    <div className="flex items-start gap-3">
                      <AgentAvatar config={config} size="sm" color={color} />
                      <div
                        className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm flex-1"
                        style={{ backgroundColor: `${color}08` }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 opacity-60" style={{ color }} />
                        {config.greetingMessage}
                      </div>
                    </div>

                    {/* Description */}
                    {config.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {config.description}
                      </p>
                    )}

                    {/* Philosophy Quote */}
                    {config.philosophy && (
                      <div className="border-l-2 pl-3 py-1" style={{ borderColor: `${color}60` }}>
                        <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
                          "{config.philosophy}"
                        </p>
                        {config.personality && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Kepribadian: {config.personality}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Feature Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {featureBadges.filter(f => f.show).map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <span
                            key={feature.label}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] sm:text-xs"
                          >
                            <Icon className="w-3 h-3" />
                            {feature.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Context Form */}
                    {showContextForm && config.contextQuestions && config.contextQuestions.length > 0 && (
                      <div className="space-y-3 p-3 rounded-lg border" style={{ borderColor: `${color}30` }}>
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" style={{ color }} />
                          <p className="text-sm font-medium">Sebelum mulai, bantu saya memahami kebutuhan Anda:</p>
                        </div>
                        {config.contextQuestions.map((q) => (
                          <div key={q.id} className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              {q.label} {q.required && <span className="text-destructive">*</span>}
                            </label>
                            {q.type === "select" && q.options && q.options.length > 0 ? (
                              <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={projectContext[q.id] || ""}
                                onChange={(e) => setProjectContext(prev => ({ ...prev, [q.id]: e.target.value }))}
                                data-testid={`select-context-${q.id}`}
                              >
                                <option value="">Pilih...</option>
                                {q.options.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="Ketik jawaban..."
                                value={projectContext[q.id] || ""}
                                onChange={(e) => setProjectContext(prev => ({ ...prev, [q.id]: e.target.value }))}
                                data-testid={`input-context-${q.id}`}
                              />
                            )}
                          </div>
                        ))}
                        <Button
                          size="sm"
                          className="w-full"
                          style={{ backgroundColor: color }}
                          disabled={config.contextQuestions.some(q => q.required && !projectContext[q.id])}
                          onClick={() => {
                            localStorage.setItem(`gustafta_context_${params.agentId}`, JSON.stringify(projectContext));
                            setContextCompleted(true);
                            setShowContextForm(false);
                          }}
                          data-testid="button-submit-context"
                        >
                          Mulai Percakapan
                        </Button>
                      </div>
                    )}

                    {/* Conversation Starters */}
                    {config.conversationStarters.length > 0 && (!showContextForm || contextCompleted) && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Mulai percakapan:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {config.conversationStarters.slice(0, 5).map((starter, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-[11px] sm:text-xs"
                              onClick={() => sendMessage(starter)}
                             
                            >
                              {starter}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Channels */}
                    {config.channels && config.channels.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs text-muted-foreground font-medium">
                          Tersedia juga di:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {config.channels.map((channel) => {
                            const meta = channelMeta[channel.type] || {
                              icon: MessageCircle,
                              label: channel.name || channel.type,
                              color: "text-muted-foreground",
                              bgColor: "bg-muted",
                            };
                            const Icon = meta.icon;
                            return (
                              <span
                                key={channel.type}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                                  meta.bgColor, meta.color
                                )}
                               
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {meta.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Install Banner */}
                <div className="flex justify-center mt-4 mb-4">
                  <InstallBanner color={color} agentName={config.name} />
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-1.5 pb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">
                    Online &middot; Siap membantu Anda
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In-chat Search Bar */}
        {searchOpen && (
          <div className="border-b bg-muted/40 px-3 sm:px-4 py-2">
            <div className="max-w-2xl mx-auto flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Cari dalam percakapan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder-muted-foreground"
              />
              {searchQuery && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} hasil
                </span>
              )}
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Pinned Messages Panel */}
        {hasMessages && showPinnedPanel && pinnedIds.size > 0 && (
          <div className="border-b bg-amber-50 dark:bg-amber-950/20">
            <button
              onClick={() => setShowPinnedPanel(false)}
              className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-left"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">{pinnedIds.size} Pesan Tersimpan</span>
              <ChevronUpIcon className="w-3 h-3 text-amber-500 ml-auto" />
            </button>
            <div className="px-3 sm:px-4 pb-3 space-y-2 max-h-56 overflow-y-auto max-w-2xl mx-auto">
              {messages.filter(m => pinnedIds.has(m.id) && m.role === "assistant").map(m => (
                <div key={m.id} className="bg-white dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 p-2.5">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                    <span>{m.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>·</span>
                    <button onClick={() => togglePin(m.id)} className="text-amber-500 hover:text-amber-700 font-medium">Lepas pin</button>
                    <button onClick={() => copyToClipboard(m.content, m.id)} className="ml-auto text-muted-foreground hover:text-foreground">
                      {copiedId === m.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </p>
                  <p className="text-xs line-clamp-3 text-foreground/80">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto px-3 sm:px-4" ref={scrollRef}>
            <div className="py-3 sm:py-4 space-y-3 sm:space-y-4 max-w-2xl mx-auto">
              {messages.map((message) => {
                const isSearchMatch = searchOpen && searchQuery.trim() && message.content.toLowerCase().includes(searchQuery.toLowerCase());
                const { fields: brainFields, cleanContent: brainClean } = message.role === "assistant"
                  ? parseBrainUpdates(message.content)
                  : { fields: [], cleanContent: message.content };
                const { actions: actionSuggestions, cleanContent: cleanMsgContent } = message.role === "assistant"
                  ? parseActionSuggestions(brainClean)
                  : { actions: [], cleanContent: brainClean };
                return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 sm:gap-3",
                    message.role === "user" && "flex-row-reverse",
                    isSearchMatch && "ring-2 ring-primary/40 ring-offset-2 rounded-2xl"
                  )}
                 
                >
                  {message.role === "assistant" ? (
                    <AgentAvatar config={config} size="sm" color={color} />
                  ) : (
                    <Avatar className="w-8 h-8 shrink-0">
                      {clientInfo?.name ? (
                        <AvatarFallback className="text-xs font-medium" style={{ backgroundColor: `${color}20`, color }}>
                          {clientInfo.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="text-xs bg-muted">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "flex flex-col gap-0.5 sm:gap-1 max-w-[85%] sm:max-w-[75%]",
                      message.role === "user" && "items-end"
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground px-1">
                      {message.role === "user" ? (clientInfo?.name || "Anda") : config.name}
                    </span>
                    <div
                      className={cn(
                        "rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 whitespace-pre-wrap break-words",
                        message.role === "user"
                          ? "rounded-tr-sm text-white"
                          : "bg-muted rounded-tl-sm"
                      )}
                      style={
                        message.role === "user" ? { backgroundColor: color } : {}
                      }
                    >
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {message.attachments.map((file, fIdx) => (
                            <div key={fIdx}>
                              {file.category === "image" ? (
                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={file.fileUrl}
                                    alt={file.fileName}
                                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                                   
                                  />
                                </a>
                              ) : file.category === "audio" ? (
                                <audio controls className="max-w-[250px]">
                                  <source src={file.fileUrl} type={file.mimeType} />
                                </audio>
                              ) : file.category === "video" ? (
                                <video controls className="max-w-[250px] rounded-lg">
                                  <source src={file.fileUrl} type={file.mimeType} />
                                </video>
                              ) : (
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs",
                                    message.role === "user" ? "bg-white/20 text-white" : "bg-background"
                                  )}
                                 
                                >
                                  {getFileIcon(file.category)}
                                  <span className="truncate max-w-[150px]">{file.fileName}</span>
                                  <span className="opacity-70">{formatFileSize(file.fileSize)}</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.role === "user"
                        ? <span className="text-sm">{message.content}</span>
                        : formatMessageContent(cleanMsgContent)}
                    </div>
                    {message.role === "assistant" && <BrainChip fields={brainFields} />}
                    {message.role === "assistant" && <ActionChips actions={actionSuggestions} conversationContext={message.content} messageId={message.id} />}
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.role === "assistant" && message.content && (
                        <>
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="text-muted-foreground/60 hover-elevate rounded-full p-0.5"
                           
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (isSpeaking && speakingMessageIdRef.current === message.id) {
                                stopSpeaking();
                              } else {
                                speakText(message.content, message.id);
                              }
                            }}
                            className="text-muted-foreground/60 hover-elevate rounded-full p-0.5"
                           
                          >
                            {isSpeaking && speakingMessageIdRef.current === message.id ? (
                              <VolumeX className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => setFeedback(message.id, "up")}
                            className={cn(
                              "hover-elevate rounded-full p-0.5",
                              message.feedback === "up" ? "text-green-500" : "text-muted-foreground/60"
                            )}
                           
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setFeedback(message.id, "down")}
                            className={cn(
                              "hover-elevate rounded-full p-0.5",
                              message.feedback === "down" ? "text-destructive" : "text-muted-foreground/60"
                            )}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          {/* Bookmark/Pin */}
                          <button
                            onClick={() => togglePin(message.id)}
                            title={pinnedIds.has(message.id) ? "Lepas pin" : "Pin pesan ini"}
                            className={cn(
                              "hover-elevate rounded-full p-0.5",
                              pinnedIds.has(message.id) ? "text-amber-500" : "text-muted-foreground/60"
                            )}
                          >
                            {pinnedIds.has(message.id) ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                          </button>
                          {/* WhatsApp share */}
                          <button
                            onClick={() => shareToWhatsApp(message.content)}
                            title="Kirim ke WhatsApp"
                            className="text-muted-foreground/60 hover-elevate rounded-full p-0.5 hover:text-green-600"
                          >
                            <SiWhatsapp className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}

              <SmartCtaCard />

              {/* Orchestration Indicator — MultiClaw L4 */}
              {orchestrationState && orchestrationState.active && (
                <div className="flex gap-2 sm:gap-3" data-testid="orchestration-indicator">
                  <AgentAvatar config={config} size="sm" color={color} />
                  <div className="rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2.5 sm:py-3 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 space-y-2 min-w-[230px] max-w-sm">

                    {/* Header row */}
                    <div className="flex gap-1.5 items-center justify-between">
                      <div className="flex gap-1.5 items-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                        <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                          {orchestrationState.phase === "aggregating" ? "Menyintesis laporan..."
                            : orchestrationState.phase === "critic" ? "Evaluasi Critic Gate..."
                            : orchestrationState.phase === "routing" ? "Router memilih agen..."
                            : "MultiClaw L4 — paralel agen..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-violet-500 font-mono">
                          {orchestrationState.subAgents.filter(s => s.status === "done").length}/{orchestrationState.cap ?? orchestrationState.subAgents.length}
                        </span>
                        {orchestrationState.criticEnabled && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 font-bold">CRITIC</span>
                        )}
                      </div>
                    </div>

                    {/* Router decision badge */}
                    {orchestrationState.routerDecision && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                          Router: {orchestrationState.routerDecision.selected.length}/{orchestrationState.routerDecision.fromTotal} agen dipilih
                        </span>
                        {!orchestrationState.routerDecision.parseOk && (
                          <span className="text-orange-500">⚠ fallback</span>
                        )}
                      </div>
                    )}

                    {/* Sub-agent list */}
                    <div className="space-y-1.5">
                      {orchestrationState.subAgents.map((sa) => {
                        const isSelected = !orchestrationState.routerDecision || orchestrationState.routerDecision.selected.includes(sa.agentId);
                        return (
                          <div key={sa.agentId} className={`flex items-center gap-2 text-[11px] ${!isSelected ? "opacity-40" : ""}`}>
                            {sa.status === "done" ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px] shrink-0">✓</span>
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin shrink-0" />
                            )}
                            <span className={`flex-1 truncate ${sa.status === "done" ? "text-muted-foreground" : "text-violet-700 dark:text-violet-300"}`}>
                              {sa.role || `Agen #${sa.agentId}`}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {sa.jsonMode && <span className="text-[8px] px-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">J</span>}
                              {sa.status === "done" && sa.confidence !== undefined && (
                                <span className="text-[9px] text-blue-500 font-mono">{(sa.confidence * 100).toFixed(0)}%</span>
                              )}
                              {sa.status === "done" && sa.elapsed && (
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-mono">
                                  {sa.elapsed < 1000 ? `${sa.elapsed}ms` : `${(sa.elapsed/1000).toFixed(1)}s`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Aggregating timer */}
                    {orchestrationState.phase === "aggregating" && orchestrationState.totalMs && (
                      <div className="text-[10px] text-violet-500 border-t border-violet-200 dark:border-violet-800 pt-1 font-mono">
                        Paralel selesai: {(orchestrationState.totalMs/1000).toFixed(1)}s → sintesis...
                      </div>
                    )}

                    {/* Critic result badge */}
                    {orchestrationState.criticDecision && (
                      <div className={`flex items-center gap-2 border-t border-violet-200 dark:border-violet-800 pt-1.5 text-[10px] ${orchestrationState.criticDecision.pass ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                        <span>{orchestrationState.criticDecision.pass ? "✓ Critic Pass" : "⚠ Critic: klarifikasi diperlukan"}</span>
                        <span className="font-mono opacity-70">{(orchestrationState.criticDecision.confidence * 100).toFixed(0)}%</span>
                        {!orchestrationState.criticDecision.pass && orchestrationState.criticDecision.missingCount > 0 && (
                          <span className="text-orange-500">{orchestrationState.criticDecision.missingCount} pertanyaan</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isTyping && !orchestrationState?.active && (
                <div className="flex gap-2 sm:gap-3">
                  <AgentAvatar config={config} size="sm" color={color} />
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex gap-1.5 items-center">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {messages[messages.length - 1]?.attachments?.length ? "Memproses file & mengetik..." : "Mengetik..."}
                      </span>
                      {dataMasterInjected && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                          <Database className="w-2.5 h-2.5" />
                          Data Master
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isTyping && showQuickActions && messages.some(m => m.role === "assistant") && (() => {
                const lastAI = [...messages].reverse().find(m => m.role === "assistant");
                const lastUser = [...messages].reverse().find(m => m.role === "user");
                const contextualActions = getContextualQuickActions(lastAI?.content || "");
                return (
                  <div className="pt-2 space-y-2">
                    {/* Follow-up suggestions from AI */}
                    {followUpSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {followUpSuggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-[11px] sm:text-xs"
                            onClick={() => {
                              setFollowUpSuggestions([]);
                              setShowQuickActions(false);
                              sendMessage(suggestion);
                            }}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                    {/* Quick Actions Panel (Notion AI / gpai style) */}
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2 px-0.5">
                        <Wand2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Aksi Cepat</span>
                        <div className="ml-auto flex items-center gap-1">
                          {/* Copy last response */}
                          <button
                            onClick={async () => {
                              if (lastAI?.content) {
                                await navigator.clipboard.writeText(lastAI.content);
                              }
                            }}
                            title="Salin jawaban terakhir"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            Salin
                          </button>
                          {/* Regenerate */}
                          {lastUser && (
                            <button
                              onClick={() => {
                                setShowQuickActions(false);
                                setFollowUpSuggestions([]);
                                setMessages(prev => {
                                  const lastAIIdx = [...prev].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === "assistant")?.i;
                                  return lastAIIdx !== undefined ? prev.slice(0, lastAIIdx) : prev;
                                });
                                setTimeout(() => sendMessage(lastUser.content), 50);
                              }}
                              title="Coba lagi jawaban berbeda"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <CornerDownLeft className="w-2.5 h-2.5" />
                              Ulang
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {contextualActions.map((action, idx) => (
                          <button
                            key={action.key}
                            onClick={() => {
                              setShowQuickActions(false);
                              setFollowUpSuggestions([]);
                              sendMessage(action.prompt);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors text-foreground/80 hover:text-foreground",
                              idx === 0
                                ? "bg-primary/8 border-primary/30 hover:bg-primary/15 hover:border-primary/50 font-semibold"
                                : "bg-background border-border hover:border-primary/40 hover:bg-primary/5"
                            )}
                          >
                            <span>{action.emoji}</span>
                            <span className="font-medium">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {quotaError && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center" data-testid="text-quota-error">
            {quotaError}
          </div>
        )}
        {quotaInfo && !quotaError && (
          <div className="px-4 py-1 bg-muted text-muted-foreground text-xs text-center" data-testid="text-quota-info">
            Kuota: {quotaInfo.dailyUsed}/{quotaInfo.dailyLimit} hari ini | {quotaInfo.monthlyUsed}/{quotaInfo.monthlyLimit} bulan ini
          </div>
        )}
        {!clientToken && config && !config.requireRegistration && !quotaError && config.trialEnabled && trialState && (() => {
          const dailyLimit = config.guestMessageLimit ?? 5;
          const maxDays = config.trialDays ?? 7;
          const today = getTodayStr();
          const usedToday = trialState.dailyCounts[today] ?? 0;
          const remaining = Math.max(0, dailyLimit - usedToday);
          const dayNum = Math.min(trialDayNumber, maxDays);
          const daysLeft = Math.max(0, maxDays - trialDayNumber + 1);
          const isAlmostDone = remaining <= 1 || daysLeft <= 1;
          return (
            <div className="px-4 py-1 text-xs text-center flex items-center justify-center gap-2" data-testid="text-trial-quota">
              <span className={cn(
                "inline-flex items-center gap-1",
                isAlmostDone ? "text-orange-500 font-medium" : "text-muted-foreground"
              )}>
                {remaining === 0 ? "Kuota hari ini habis" : `${remaining} pertanyaan tersisa hari ini`}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className={cn(
                "inline-flex items-center gap-1",
                daysLeft <= 1 ? "text-orange-500 font-medium" : "text-muted-foreground"
              )}>
                Hari ke-{dayNum}/{maxDays}
              </span>
              {isAlmostDone && (
                <span className="text-muted-foreground">— <button onClick={() => { setUpgradeReason("daily_trial"); setShowUpgradeWall(true); }} className="underline hover:text-foreground">Daftar akses penuh</button></span>
              )}
            </div>
          );
        })()}
        {!clientToken && config && !config.requireRegistration && !quotaError && !config.trialEnabled && (config.guestMessageLimit ?? 10) > 0 && (
          <div className="px-4 py-1 text-xs text-center" data-testid="text-guest-quota">
            <span className={cn(
              guestMessageCount >= (config.guestMessageLimit ?? 10) * 0.7 ? "text-orange-500" : "text-muted-foreground",
              guestMessageCount >= (config.guestMessageLimit ?? 10) ? "text-destructive font-medium" : ""
            )}>
              Pesan gratis: {guestMessageCount}/{config.guestMessageLimit ?? 10}
            </span>
            {guestMessageCount >= Math.floor((config.guestMessageLimit ?? 10) * 0.7) && guestMessageCount < (config.guestMessageLimit ?? 10) && (
              <span className="text-muted-foreground ml-2">
                — Daftar untuk akses penuh
              </span>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-2.5 sm:p-4 border-t bg-background safe-area-bottom">
          {isListening && (
            <div className="flex items-center justify-center gap-2 pb-2 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs text-destructive font-medium">Mendengarkan... bicara sekarang</span>
              </div>
            </div>
          )}

          {/* Smart file slash suggestion */}
          {pendingFiles.length > 0 && (() => {
            const suggestion = getFileSuggestion(pendingFiles);
            if (!suggestion || input.trim()) return null;
            return (
              <div className="max-w-2xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground/70 flex-1">Saran untuk file ini:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const sc = SLASH_COMMANDS.find(c => c.cmd === suggestion.cmd);
                      if (sc) applySlashCommand(sc);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-primary/10 hover:bg-primary/20 border border-primary/30 font-medium text-primary transition-colors"
                  >
                    <span>{suggestion.emoji}</span>
                    <span>{suggestion.label}</span>
                    <span className="font-mono text-[10px] opacity-60">{suggestion.cmd}</span>
                  </button>
                  {suggestion.secondary && (
                    <button
                      onClick={() => {
                        const sc = SLASH_COMMANDS.find(c => c.cmd === suggestion.secondary!.cmd);
                        if (sc) applySlashCommand(sc);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted hover:bg-muted/80 border border-border font-medium text-foreground/60 hover:text-foreground transition-colors"
                    >
                      <span>{suggestion.secondary.emoji}</span>
                      <span>{suggestion.secondary.label}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-2xl mx-auto mb-2">
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs"
                 
                >
                  {file.category === "image" ? (
                    <img src={file.fileUrl} alt={file.fileName} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    getFileIcon(file.category)
                  )}
                  <span className="truncate max-w-[120px]">{file.fileName}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                  <button
                    onClick={() => removePendingFile(idx)}
                    className="ml-0.5 text-muted-foreground/60 hover-elevate rounded-full"
                   
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isUploading && (
            <div className="flex items-center gap-2 max-w-2xl mx-auto mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Mengunggah file...</span>
            </div>
          )}

          {!isUploading && input && (input.match(/youtube\.com|youtu\.be/) || input.match(/drive\.google\.com|docs\.google\.com|1drv\.ms|onedrive\.live\.com|sharepoint\.com/)) && (
            <div className="flex flex-wrap gap-1.5 max-w-2xl mx-auto mb-2">
              {input.match(/youtube\.com|youtu\.be/) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-[10px] font-medium">
                  <PlayCircle className="w-3 h-3" /> YouTube terdeteksi - akan dirangkum
                </span>
              )}
              {input.match(/drive\.google\.com|docs\.google\.com/) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-medium">
                  <FileText className="w-3 h-3" /> Google Drive terdeteksi
                </span>
              )}
              {input.match(/1drv\.ms|onedrive\.live\.com|sharepoint\.com/) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-medium">
                  <FileText className="w-3 h-3" /> OneDrive terdeteksi
                </span>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.webm,.ogg,.mp4,.mov,.zip,.rar"
           
          />

          {/* Slash Command Menu */}
          {showSlashMenu && (() => {
            const filtered = getFilteredSlashCommands();
            if (!filtered.length) return null;
            const isSearching = input.length > 1;
            // Group commands by category when showing all
            const grouped = isSearching ? null : filtered.reduce((acc, cmd) => {
              const g = cmd.group || "Lainnya";
              if (!acc[g]) acc[g] = [];
              acc[g].push(cmd);
              return acc;
            }, {} as Record<string, typeof filtered>);
            const groupEmoji: Record<string, string> = { Teknis: "🔢", Dokumen: "📝", Analisis: "💡", Aksi: "✅" };
            let globalIdx = 0;
            return (
              <div className="max-w-2xl mx-auto mb-2">
                <div className="rounded-xl border border-border shadow-lg bg-popover overflow-hidden max-h-72 overflow-y-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border sticky top-0">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      {isSearching ? `${filtered.length} perintah ditemukan` : `${filtered.length} Perintah Cepat`}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">↑↓ · Enter · Esc</span>
                  </div>
                  {isSearching ? (
                    filtered.map((cmd, idx) => (
                      <button
                        key={cmd.cmd}
                        onClick={() => applySlashCommand(cmd)}
                        className={cn("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/70 transition-colors", idx === slashMenuIdx && "bg-muted/70")}
                      >
                        <span className="text-base shrink-0">{cmd.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{cmd.label}</span>
                            <code className="text-[10px] text-muted-foreground font-mono">{cmd.cmd}</code>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{cmd.desc}</p>
                        </div>
                        <CornerDownLeft className="w-3 h-3 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  ) : (
                    Object.entries(grouped!).map(([groupName, cmds]) => (
                      <div key={groupName}>
                        <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/40 flex items-center gap-1.5">
                          <span>{groupEmoji[groupName] || "📁"}</span>
                          <span>{groupName}</span>
                        </div>
                        {cmds.map((cmd) => {
                          const localIdx = globalIdx++;
                          return (
                            <button
                              key={cmd.cmd}
                              onClick={() => applySlashCommand(cmd)}
                              className={cn("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/70 transition-colors", localIdx === slashMenuIdx && "bg-muted/70")}
                            >
                              <span className="text-base shrink-0">{cmd.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">{cmd.label}</span>
                                  <code className="text-[10px] text-muted-foreground font-mono">{cmd.cmd}</code>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{cmd.desc}</p>
                              </div>
                              <CornerDownLeft className="w-3 h-3 text-muted-foreground shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex gap-2 items-end max-w-2xl mx-auto">
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isTyping || isUploading}
              className="shrink-0 rounded-xl"
              title="Lampirkan file (PDF, Excel, Word, Gambar, dll)"
             
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  const val = e.target.value;
                  setInput(val);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  const isSlash = val.startsWith("/") && !val.includes("\n");
                  setShowSlashMenu(isSlash);
                  if (isSlash) setSlashMenuIdx(0);
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSlashMenu(false), 150)}
                placeholder={isListening ? "Mendengarkan suara Anda..." : `Ketik pesan atau / untuk perintah cepat...`}
                className="resize-none text-sm rounded-xl pr-8"
                rows={1}
                disabled={isTyping || isListening || !!needsContext}
               
              />
              {!input && !isTyping && (
                <button
                  className="absolute right-2 bottom-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  title="Ketik / untuk perintah cepat"
                  onClick={() => { setInput("/"); if (textareaRef.current) textareaRef.current.focus(); setShowSlashMenu(true); }}
                >
                  <Hash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {speechSupported && (
              <Button
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleSpeech}
                disabled={isTyping}
                className="shrink-0 rounded-xl"
               
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && pendingFiles.length === 0) || isTyping || isListening || !!needsContext}
              className="shrink-0 rounded-xl"
              style={{ backgroundColor: color }}
             
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-3 mt-1.5 sm:mt-2">
            {hasMessages && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <Check className="w-2.5 h-2.5 text-green-500" />
                Percakapan tersimpan otomatis
              </span>
            )}
            {hasMessages && !partnerBranding?.hidePlatformBranding && <span className="text-muted-foreground/30 text-[10px]">·</span>}
            {!partnerBranding?.hidePlatformBranding && (
              <p className="text-[10px] text-muted-foreground">
                Powered by <a href="/" className="font-medium hover:underline">Gustafta</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
