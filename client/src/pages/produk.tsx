/**
 * Gustafta Builder — Halaman Produk
 * 3 jalur produk: Paket Bisnis, Paket Modul, Paket Chatbot
 */
import { Link, useLocation } from "wouter";
import { trackLead } from "@/lib/meta-pixel";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Bot, Blocks, Package, Building2, ChevronRight, Check, Zap,
  MessageSquare, Globe, Shield, Headphones, Users, Star,
  ArrowRight, Sparkles, Crown, Wrench, BookOpen, BarChart3,
  HardHat, Target, Award, Pencil, Layers,
  Phone, ExternalLink, Plus, CreditCard, FileText, GraduationCap,
  Mic, PenLine, Calculator, Megaphone, ScrollText, LayoutGrid,
  AlertTriangle, TrendingUp, Lightbulb, ClipboardList, BadgePlus,
} from "lucide-react";
import { CREDIT_PACKS as KREDIT_EKSTRA, PRICING, LICENSE_INFO, SERVICE_TIERS } from "@/data/pricing";

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface BisnisPlan {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  price: string;
  priceNote: string;
  lisensiInfo?: string;
  popular?: boolean;
  color: string;
  borderColor: string;
  bgColor: string;
  headerBg: string;
  icon: typeof Bot;
  tagline: string;
  limits: { label: string; value: string }[];
  features: string[];
  chatbots: { name: string; icon: typeof Bot; tag: string }[];
  cta: string;
  planKey: string;
}

const ENTERPRISE_PLAN = {
  id: "enterprise",
  name: "Enterprise",
  badge: "ENTERPRISE",
  badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  price: "Custom",
  priceNote: "hubungi tim",
  lisensiInfo: "Negosiasi — termasuk aktivasi, onboarding penuh, dan SLA dedicated",
  color: "text-purple-500",
  borderColor: "border-purple-300 dark:border-purple-700",
  bgColor: "bg-purple-50/50 dark:bg-purple-950/20",
  headerBg: "bg-purple-100/50 dark:bg-purple-900/30",
  icon: Crown,
  tagline: "Solusi skala penuh — unlimited, dedicated manager",
  limits: [
    { label: "Pesan/bulan", value: "Unlimited" },
    { label: "Chatbot", value: "Unlimited slot" },
    { label: "Sub-akun", value: "5 akun tim" },
    { label: "Knowledge Base", value: "Unlimited dokumen" },
  ],
  features: [
    "Semua fitur Bisnis",
    "5 sub-akun (multi-operator)",
    "Unlimited chatbot slot",
    "API akses penuh",
    "Custom domain unlimited",
    "Dedicated Account Manager",
    "SLA prioritas & onboarding tim",
    "Laporan performa bulanan",
  ],
  chatbots: [
    { name: "Semua bot Bisnis", icon: Crown, tag: "Termasuk" },
    { name: "+ Bot Custom Enterprise", icon: Building2, tag: "Sesuai kebutuhan" },
  ],
  cta: "Hubungi Tim",
  planKey: "enterprise",
};

const BISNIS_PLANS: BisnisPlan[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "STARTER",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    price: PRICING.subscription.starter.label,
    priceNote: "/bulan",
    lisensiInfo: LICENSE_INFO,
    color: "text-blue-500",
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    headerBg: "bg-blue-100/50 dark:bg-blue-900/30",
    icon: Zap,
    tagline: "Mulai bisnis chatbot + dapat Starter Kit — Panduan Gustafta",
    limits: [
      { label: "Pesan/bulan", value: "2.000 pesan" },
      { label: "Chatbot buat sendiri", value: "10 bot" },
      { label: "Knowledge Base", value: "20 dokumen" },
    ],
    features: [
      "Builder chatbot penuh",
      "Mini Apps 5 tipe",
      "Modul pembelajaran",
      "Web widget no-branding",
      "Email support",
      "Starter Kit (paket perkenalan, add-on lintas-tier) — Panduan Gustafta",
    ],
    chatbots: [
      { name: "Sample Bot 1 & 2", icon: Bot, tag: "2 contoh konfigurasi" },
      { name: "EduCounsel AI", icon: BookOpen, tag: "Konseling akademik" },
      { name: "AI Tutor Adaptif", icon: Award, tag: "Tutor 8 agen" },
    ],
    cta: "Pilih Starter",
    planKey: "starter",
  },
  {
    id: "profesional",
    name: "Profesional",
    badge: "PRO",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    price: PRICING.subscription.profesional.label,
    priceNote: "/bulan",
    lisensiInfo: LICENSE_INFO,
    popular: true,
    color: "text-indigo-500",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    bgColor: "bg-indigo-50/50 dark:bg-indigo-950/20",
    headerBg: "bg-indigo-100/50 dark:bg-indigo-900/30",
    icon: Crown,
    tagline: "Ekosistem lengkap + 80 MultiClaw AI Tools",
    limits: [
      { label: "Pesan/bulan", value: "3.000 pesan" },
      { label: "Chatbot buat sendiri", value: "50 bot" },
      { label: "Knowledge Base", value: "30 dokumen" },
    ],
    features: [
      "Semua fitur Starter",
      "Advanced AI Tools (80+ MultiClaw)",
      "Mini Apps 15 tipe",
      "E-Course & Document Generator",
      "Custom Domain (1)",
      "Priority email support",
      "Starter Kit (paket perkenalan, add-on lintas-tier) — Panduan Gustafta",
    ],
    chatbots: [
      { name: "Semua bot Starter", icon: Zap, tag: "Termasuk" },
      { name: "TenderBot", icon: Target, tag: "AI Tender BUJK" },
      { name: "SertifikasiBot", icon: Award, tag: "SBU & SKK" },
      { name: "PerijinanBot", icon: Globe, tag: "OSS-RBA & NIB" },
      { name: "KontraktorBot", icon: HardHat, tag: "QS & RAB" },
    ],
    cta: "Pilih Profesional",
    planKey: "profesional",
  },
  {
    id: "bisnis",
    name: "Bisnis",
    badge: "BISNIS",
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    price: PRICING.subscription.bisnis.label,
    priceNote: "/bulan",
    lisensiInfo: LICENSE_INFO,
    color: "text-violet-500",
    borderColor: "border-violet-200 dark:border-violet-800",
    bgColor: "bg-violet-50/50 dark:bg-violet-950/20",
    headerBg: "bg-violet-100/50 dark:bg-violet-900/30",
    icon: Building2,
    tagline: "Tim 2 akun + 100 slot shared + suite lengkap",
    limits: [
      { label: "Pesan/bulan", value: "5.000 pesan" },
      { label: "Chatbot buat sendiri", value: "100 slot (shared 2 akun)" },
      { label: "Knowledge Base", value: "50 dokumen" },
    ],
    features: [
      "Semua fitur Profesional",
      "2 sub-akun (owner + 1 operator)",
      "100 slot shared antar tim",
      "Custom Domain (3)",
      "Priority Support & Dedicated Manager",
      "Semua Mini Apps (45 tipe)",
      "Priority WhatsApp support",
      "Starter Kit (paket perkenalan, add-on lintas-tier) — Panduan Gustafta",
    ],
    chatbots: [
      { name: "Semua bot Profesional", icon: Crown, tag: "Termasuk" },
      { name: "ProyekBot", icon: Layers, tag: "Manajemen Proyek" },
      { name: "OwnerBot", icon: Building2, tag: "Developer & Owner" },
      { name: "KonsultanBot", icon: Pencil, tag: "DED & MK" },
      { name: "BoheerBot", icon: Wrench, tag: "Subkontraktor" },
      { name: "SupplierBot", icon: Package, tag: "Material & Logistik" },
    ],
    cta: "Pilih Bisnis",
    planKey: "bisnis",
  },
];


const FITUR_LANJUTAN = [
  {
    icon: LayoutGrid,
    title: "Mini Apps (45 tipe)",
    color: "text-violet-500",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50/40 dark:bg-violet-950/20",
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    desc: "Tools produktivitas AI yang tertanam di dalam chatbot Anda. Satu klik → output siap pakai.",
    groups: [
      { hub: "🟣 Kreator", items: ["Editorial Calendar", "Script YouTube/Podcast", "Proposal Brand Deal", "Laporan Performa Konten"] },
      { hub: "🟢 Bekerja", items: ["AI Notulis Rapat", "Drafter Kontrak/SPK/NDA", "RAB & Estimasi Biaya", "Laporan KPI Tim"] },
      { hub: "🟠 Berusaha", items: ["AI Copywriter Medsos", "Sales Script & Objection Handling", "Laporan Cashflow", "NPS & Survey Kepuasan"] },
      { hub: "🎓 Kompetensi PKB", items: ["Executive Summary PKB (25 poin SKP)", "Penulis Cerdas — dokumen bab per bab", "Input: E-SIMPAN + YouTube + lapangan", "Studio Kompetensi & Rubrik 0–3"] },
    ],
  },
  {
    icon: FileText,
    title: "Generator Dokumen",
    color: "text-blue-500",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/40 dark:bg-blue-950/20",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    desc: "AI menghasilkan dokumen profesional dari knowledge base & data proyek — bukan template kosong.",
    groups: [
      { hub: "📘 eBook & eCourse", items: ["Buku panduan kompetensi dari KB", "eCourse microlearning + kuis", "Sertifikat digital (PDF)", "Ekspor HTML/PDF siap cetak"] },
      { hub: "📄 Dokumen Tender/Proyek", items: ["HSE Plan & PQP Tender", "Compliance Matrix & Audit", "Metode Pelaksanaan", "Executive Summary Penawaran"] },
      { hub: "🎓 Ekosistem Kompetensi PKB", items: ["Executive Summary PKB 25 poin SKP", "Input: proyek E-SIMPAN + pelatihan + YouTube", "Penulis Cerdas: dokumen bab per bab", "Klaim SKP ke LPJK"] },
      { hub: "✍️ Dokumen Legal & Bisnis", items: ["Drafter Kontrak/SPK/NDA/MoU", "Laporan kinerja & KPI tim", "Proposal & media kit", "Surat resmi industri Indonesia"] },
    ],
  },
  {
    icon: GraduationCap,
    title: "E-Course & LMS",
    color: "text-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    desc: "Ubah chatbot Anda menjadi platform belajar interaktif — termasuk kuis, sertifikat, dan progress peserta.",
    groups: [
      { hub: "📚 Modul Belajar", items: ["Konten dari KB chatbot", "Urutan materi otomatis", "Multi-topik per chatbot", "Progress peserta real-time"] },
      { hub: "📝 Evaluasi", items: ["Kuis otomatis per modul", "Skor & leaderboard", "Sertifikat digital PDF", "Rekap nilai peserta"] },
      { hub: "👨‍🏫 Tutor Adaptif", items: ["AI Tutor 8 agen spesialis", "Mode: Teori/Latihan/Tryout", "Gamifikasi & poin", "Dashboard orang tua"] },
      { hub: "🏫 Admin LMS", items: ["Kelola kelas & peserta", "Absensi & jadwal", "Laporan progress kelas", "Notifikasi otomatis"] },
    ],
  },
  {
    icon: Mic,
    title: "Studio Podcast & Audio",
    color: "text-rose-500",
    border: "border-rose-200 dark:border-rose-800",
    bg: "bg-rose-50/40 dark:bg-rose-950/20",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    desc: "Produksi konten audio profesional dengan bantuan AI — dari rekaman ke distribusi.",
    groups: [
      { hub: "🎙️ Produksi", items: ["Transkrip otomatis", "Clean-up & cut points", "Show notes lengkap", "Snippet medsos"] },
      { hub: "📝 Konten", items: ["Script YouTube/Podcast AI", "Hook 5 detik (3 variasi)", "Narasi & storytelling", "CTA & outro"] },
      { hub: "📢 Distribusi", items: ["Konten ke semua platform", "Jadwal posting otomatis", "Analytics performa", "Media kit kreator"] },
      { hub: "🤖 Studio AI", items: ["Orchestrator 4 agen pasca-rekaman", "AI Narator & Pencerita", "Tone of voice adaptif", "A/B testing hook"] },
    ],
  },
];



// ─── Sections ─────────────────────────────────────────────────────────────────
function BisnisPaket() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <Badge className="mb-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Paket Bisnis</Badge>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Akses platform + chatbot premium per tier</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
          Setiap tier Paket Bisnis sudah termasuk chatbot premium yang berbeda — semakin tinggi tier,
          semakin banyak chatbot konstruksi canggih yang langsung bisa dipakai.
        </p>
        <p className="text-emerald-600 dark:text-emerald-400 mt-2 text-xs font-medium">
          Produk chatbot sudah jadi, tinggal pakai — cukup lisensi + langganan bulanan, tanpa biaya setup.
        </p>
        <p className="text-gray-400 dark:text-gray-500 mt-2 text-[11px] leading-relaxed">
          Catatan: <strong>Starter Kit</strong> bukan salah satu tier — ini paket perkenalan sekali bayar
          (lisensi + panduan + 7 hari trial) yang bisa dipakai sebagai pintu masuk ke tier mana pun di atas.
        </p>
      </div>

      {/* Pricing + chatbot grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {BISNIS_PLANS.map(plan => (
          <div key={plan.id}
            className={`relative rounded-2xl border ${plan.borderColor} overflow-hidden flex flex-col transition-shadow hover:shadow-xl`}>
            {plan.popular && (
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">POPULER</span>
              </div>
            )}

            {/* Header */}
            <div className={`${plan.headerBg} px-5 pt-5 pb-4`}>
              <div className="flex items-center gap-2 mb-2">
                <plan.icon className={`w-4 h-4 ${plan.color}`}/>
                <Badge className={`text-[10px] ${plan.badgeColor}`}>{plan.badge}</Badge>
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-white">{plan.name}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{plan.tagline}</div>
              <div className="mt-3">
                <span className={`text-2xl font-bold ${plan.color}`}>{plan.price}</span>
                <span className="text-xs text-gray-400 ml-1">{plan.priceNote}</span>
              </div>
              {plan.lisensiInfo && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded">Dengan Starter Kit</span>
                    <span className="text-gray-500 dark:text-gray-400">Rp 245rb → dapat lisensi + panduan + <strong className="text-emerald-600 dark:text-emerald-400">7 hari trial</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold px-1.5 py-0.5 rounded">Tanpa Starter Kit</span>
                    <span className="text-gray-500 dark:text-gray-400">aktivasi {PRICING.license.price} (sekali), tanpa trial</span>
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">Produk siap pakai — cukup aktivasi + langganan bulanan, tanpa biaya setup.</div>
                </div>
              )}
            </div>

            <div className={`flex-1 ${plan.bgColor} px-5 py-4 flex flex-col gap-4`}>
              {/* Limits */}
              <div className="space-y-1.5">
                {plan.limits.map((l, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-500">{l.label}</span>
                    <span className={`font-semibold ${plan.color}`}>{l.value}</span>
                  </div>
                ))}
              </div>

              {/* Chatbots included */}
              <div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Bot className="w-3 h-3"/> Chatbot Premium Termasuk
                </div>
                <ul className="space-y-1.5">
                  {plan.chatbots.map((bot, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${plan.headerBg} border ${plan.borderColor}`}>
                        <bot.icon className={`w-2.5 h-2.5 ${plan.color}`}/>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-800 dark:text-gray-200 leading-none">{bot.name}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{bot.tag}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Platform features */}
              <ul className="space-y-1 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                    <Check className={`w-3 h-3 shrink-0 mt-0.5 ${plan.color}`}/>
                    {f}
                  </li>
                ))}
              </ul>

              <Button size="sm"
                data-testid={`btn-pilih-${plan.id}`}
                onClick={() => navigate(user ? "/pricing" : "/auth")}
                className={`w-full text-xs h-8 ${plan.popular ? "bg-indigo-600 hover:bg-indigo-500 text-white" : ""}`}
                variant={plan.popular ? "default" : "outline"}>
                {plan.cta} <ChevronRight className="w-3.5 h-3.5 ml-1"/>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise card — full width */}
      <div className="max-w-5xl mx-auto">
        <div className={`relative rounded-2xl border ${ENTERPRISE_PLAN.borderColor} overflow-hidden flex flex-col md:flex-row transition-shadow hover:shadow-xl`}>
          <div className={`${ENTERPRISE_PLAN.headerBg} px-6 pt-6 pb-5 md:w-72 shrink-0`}>
            <div className="flex items-center gap-2 mb-2">
              <ENTERPRISE_PLAN.icon className={`w-4 h-4 ${ENTERPRISE_PLAN.color}`}/>
              <Badge className={`text-[10px] ${ENTERPRISE_PLAN.badgeColor}`}>{ENTERPRISE_PLAN.badge}</Badge>
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-white">{ENTERPRISE_PLAN.name}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{ENTERPRISE_PLAN.tagline}</div>
            <div className="mt-3">
              <span className={`text-2xl font-bold ${ENTERPRISE_PLAN.color}`}>{ENTERPRISE_PLAN.price}</span>
              <span className="text-xs text-gray-400 ml-2">{ENTERPRISE_PLAN.priceNote}</span>
            </div>
            <div className="mt-2 text-[10px] text-gray-400">{ENTERPRISE_PLAN.lisensiInfo}</div>
            <div className="mt-4 space-y-1">
              {ENTERPRISE_PLAN.limits.map((l, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-500">{l.label}</span>
                  <span className={`font-semibold ${ENTERPRISE_PLAN.color}`}>{l.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`flex-1 ${ENTERPRISE_PLAN.bgColor} px-6 py-5 flex flex-col gap-4`}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {ENTERPRISE_PLAN.features.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  <Check className={`w-3 h-3 shrink-0 mt-0.5 ${ENTERPRISE_PLAN.color}`}/>
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-2 border-t border-purple-200 dark:border-purple-800">
              <a href="https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20info%20paket%20Enterprise" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" className="w-full text-xs h-8 bg-purple-600 hover:bg-purple-500 text-white">
                  Hubungi Tim Enterprise <ChevronRight className="w-3.5 h-3.5 ml-1"/>
                </Button>
              </a>
              <div className="text-[10px] text-gray-400 self-center">Harga disesuaikan skala & kebutuhan tim Anda</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade ladder */}
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-500"/> Makin tinggi tier = makin lengkap chatbot yang didapat
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-500 flex-wrap">
          <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full text-blue-600 dark:text-blue-400">Starter: EduCounsel, AI Tutor</span>
          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0"/>
          <span className="bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full text-indigo-600 dark:text-indigo-400">Pro: + 4 bot konstruksi</span>
          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0"/>
          <span className="bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full text-violet-600 dark:text-violet-400">Bisnis: + 5 bot konstruksi (total 9)</span>
          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0"/>
          <span className="bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full text-purple-600 dark:text-purple-400">Enterprise: unlimited</span>
        </div>
      </div>

      {/* Pesan notice */}
      <div className="max-w-3xl mx-auto bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-400">
        <strong>Batas pesan:</strong> Dihitung dari total interaksi dengan AI di semua chatbot Anda per bulan.
        Kuota habis → chat dihentikan sementara hingga bulan berikutnya atau upgrade.
      </div>

      {/* ── Kredit Ekstra ─────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <BadgePlus className="w-4 h-4 text-indigo-500"/>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Kredit Pesan Ekstra</span>
          <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Top-Up</Badge>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-6">
          Kuota bulanan habis sebelum waktunya? Top-up kapan saja — kredit langsung aktif, tidak kadaluarsa.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KREDIT_EKSTRA.map((pack, i) => (
            <div key={i} className={`relative rounded-xl border ${pack.border} ${pack.bg} p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow`}>
              {pack.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow ${pack.badge === "PALING LAKU" ? "bg-indigo-600 text-white" : "bg-purple-600 text-white"}`}>
                    {pack.badge}
                  </span>
                </div>
              )}
              <div className={`text-xs font-semibold ${pack.color} mb-1`}>{pack.label}</div>
              <div className={`text-lg font-bold ${pack.color}`}>{pack.pesan}</div>
              <div className="text-base font-bold text-gray-900 dark:text-white mt-1">{pack.price}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{pack.perPesan}</div>
              <a href="https://wa.me/6281234567890?text=Halo%20Gustafta%2C%20saya%20ingin%20top-up%20kredit%20pesan" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer" className="mt-3 w-full">
                <Button size="sm" variant="outline" className={`w-full text-[11px] h-7 border-current ${pack.color}`}>
                  Beli <Plus className="w-3 h-3 ml-1"/>
                </Button>
              </a>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-gray-400 text-center">
          Kredit berlaku di semua paket (Starter, Profesional, Bisnis) · Tidak kadaluarsa · Bisa akumulasi
        </div>
      </div>

      {/* ── Bukan Sekadar Dialog ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <Badge className="mb-2 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            ✦ Keunggulan Gustafta Builder
          </Badge>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Bukan sekadar chatbot yang menjawab
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto leading-relaxed">
            Gustafta Builder punya <strong className="text-gray-800 dark:text-gray-200">Mini Apps</strong> — tools AI yang tertanam langsung di dalam chatbot Anda.
            AI tidak hanya bicara, tapi <strong className="text-gray-800 dark:text-gray-200">menghasilkan dokumen nyata, kalkulasi, laporan, dan checklist</strong> yang langsung bisa dipakai.
          </p>
        </div>

        {/* Comparison strip */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto mb-8">
          <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 text-center">
            <div className="text-2xl mb-2">💬</div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Chatbot Biasa</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Menjawab pertanyaan → selesai di teks</div>
            <div className="mt-2 text-xs text-gray-400 italic">Output: teks / percakapan</div>
          </div>
          <div className="flex items-center justify-center text-2xl font-bold text-gray-300 dark:text-gray-600 rotate-90 sm:rotate-0">→</div>
          <div className="flex-1 rounded-2xl border-2 border-violet-300 dark:border-violet-600 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4 text-center shadow-sm">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">Gustafta Builder + Mini Apps</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">Menjawab pertanyaan <strong>+ menghasilkan dokumen, laporan & kalkulasi</strong></div>
            <div className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium">Output: file siap pakai, PDF, tabel, laporan</div>
          </div>
        </div>

        {/* Mini apps showcase grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto mb-4">
          {[
            { icon: "📋", label: "Checklist & Audit", desc: "Checklist K3, compliance, go/no-go", color: "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800" },
            { icon: "🧮", label: "Kalkulator RAB", desc: "Estimasi biaya proyek otomatis", color: "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800" },
            { icon: "📄", label: "Generator Dokumen", desc: "Kontrak, SPK, NDA, MoU dalam sekejap", color: "border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800" },
            { icon: "📊", label: "Laporan KPI", desc: "Kinerja tim & dashboard manajer", color: "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-800" },
            { icon: "🎯", label: "Risk Assessment", desc: "Identifikasi & scoring risiko proyek", color: "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800" },
            { icon: "📝", label: "AI Notulis Rapat", desc: "Ringkas & distribusi notulen otomatis", color: "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" },
            { icon: "📣", label: "AI Copywriter", desc: "Konten medsos, caption, artikel", color: "border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800" },
            { icon: "🎓", label: "Ekosistem Kompetensi", desc: "Executive Summary PKB, klaim SKP ke LPJK", color: "border-teal-200 bg-teal-50 dark:bg-teal-950/20 dark:border-teal-800" },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl border p-3 ${item.color} flex flex-col gap-1.5`}>
              <div className="text-xl">{item.icon}</div>
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">{item.label}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mb-2">
          45 tipe Mini Apps tersedia · Otomatis disarankan AI sesuai domain chatbot Anda
        </p>
        <div className="text-center mb-8">
          <a href="/ai-tools" className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline underline-offset-2 font-medium">
            <LayoutGrid className="w-3.5 h-3.5" />
            Lihat semua AI Tools & Mini Apps →
          </a>
        </div>
      </div>

      {/* ── Fitur Lanjutan ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <Badge className="mb-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Platform Features</Badge>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fitur Lanjutan Platform Gustafta</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Di luar chatbot biasa — ini tools produktivitas yang terintegrasi langsung di platform Anda.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FITUR_LANJUTAN.map((fitur, i) => (
            <div key={i} className={`rounded-2xl border ${fitur.border} ${fitur.bg} p-5 flex flex-col gap-3`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${fitur.bg} border ${fitur.border}`}>
                  <fitur.icon className={`w-5 h-5 ${fitur.color}`}/>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{fitur.title}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{fitur.desc}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fitur.groups.map((group, j) => (
                  <div key={j} className="bg-white/60 dark:bg-black/10 rounded-lg p-2.5 border border-white/80 dark:border-white/5">
                    <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{group.hub}</div>
                    <ul className="space-y-0.5">
                      {group.items.map((item, k) => (
                        <li key={k} className="text-[10px] text-gray-600 dark:text-gray-400 flex items-start gap-1">
                          <Check className={`w-2.5 h-2.5 shrink-0 mt-0.5 ${fitur.color}`}/>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                <Shield className="w-3 h-3"/>
                {i === 0 ? "Tersedia mulai Starter (5 tipe) · Profesional (15 tipe) · Bisnis (45 tipe)"
                 : i === 1 ? "Generator Dokumen tersedia di Profesional ke atas"
                 : i === 2 ? "E-Course tersedia di Profesional ke atas · LMS di semua paket"
                 : "Studio Podcast tersedia di Bisnis ke atas"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────
function KomparasiTable() {
  const rows = [
    { label: "Chatbot dikelola sendiri",                    produk: true,  jasa: false, store: false },
    { label: "Bot dirakit tim ahli (kami yang kerjakan)",   produk: false, jasa: true,  store: false },
    { label: "Bot langsung aktif dari katalog",             produk: false, jasa: false, store: true  },
    { label: "Akses platform builder Gustafta penuh",       produk: true,  jasa: false, store: false },
    { label: "Biaya lisensi terpisah (sekali bayar)",       produk: true,  jasa: false, store: true  },
    { label: "Biaya berlangganan bulanan / hosting (wajib)", produk: true, jasa: true,  store: true  },
    { label: "Biaya setup/perakitan (sekali bayar)",        produk: false, jasa: true,  store: false },
    { label: "Tidak perlu konfigurasi teknis",              produk: false, jasa: true,  store: true  },
    { label: "Cocok untuk pemula non-teknis",               produk: false, jasa: true,  store: true  },
    { label: "Kontrol penuh atas konfigurasi AI",           produk: true,  jasa: false, store: false },
  ];

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="text-sm font-bold text-center text-gray-800 dark:text-white mb-1">Perbandingan: Produk vs Layanan Jasa vs Chatbot Store</div>
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-4">Semua jalur menggunakan platform Gustafta — berbeda di cara mendapatkan & mengelola chatbotnya</p>
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Fitur / Perbedaan</th>
              <th className="text-center px-3 py-3 font-semibold">
                <div className="text-indigo-500">Produk</div>
                <div className="text-[9px] font-normal text-gray-400">(Aktivasi + Langganan)</div>
              </th>
              <th className="text-center px-3 py-3 font-semibold">
                <div className="text-violet-500">Layanan Jasa</div>
                <div className="text-[9px] font-normal text-gray-400">(Kami Rakit Untukmu)</div>
              </th>
              <th className="text-center px-3 py-3 font-semibold">
                <div className="text-blue-500">Chatbot Store</div>
                <div className="text-[9px] font-normal text-gray-400">(Bot Jadi dari Kreator)</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-gray-50/60 dark:bg-slate-900/40"}>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{row.label}</td>
                {[row.produk, row.jasa, row.store].map((v, j) => (
                  <td key={j} className="text-center px-3 py-2">
                    {v
                      ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 dark:bg-green-500 mx-auto"><Check className="w-3 h-3 text-white" strokeWidth={3}/></span>
                      : <span className="text-gray-300 dark:text-gray-700 text-base leading-none">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
        Semua jalur mendapat <strong>hak lisensi (hak pakai)</strong>. Di Layanan Jasa, lisensi sudah termasuk dalam biaya setup — tidak ditagih terpisah.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center text-xs">
        <Link href="/packs"><span className="text-violet-600 dark:text-violet-400 hover:underline underline-offset-2 cursor-pointer">→ Lihat Layanan Jasa & Harga Setup</span></Link>
        <span className="hidden sm:inline text-gray-300">·</span>
        <Link href="/store"><span className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 cursor-pointer">→ Jelajahi Chatbot Store</span></Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProdukPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <SharedHeader/>

      {/* ── Journey Context: MERAKIT AI ── */}
      <section className="bg-indigo-50 dark:bg-indigo-950/20 border-b border-indigo-200 dark:border-indigo-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
            <Link href="/panduan"><span className="text-muted-foreground hover:text-foreground cursor-pointer">Belajar</span></Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-bold px-2.5 py-1 rounded-full bg-indigo-600 text-white">TAHAP 2</span>
            <span className="font-semibold text-indigo-800 dark:text-indigo-200">Merakit AI</span>
            {["Menggunakan AI", "Menghasilkan Nilai", "Berkembang"].map((s) => (
              <span key={s} className="flex items-center gap-1 text-muted-foreground">
                <ChevronRight className="h-3 w-3" />{s}
              </span>
            ))}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-1.5">
            Rakit AI-mu sendiri — dari nol sampai jadi
          </h2>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-5 max-w-3xl leading-relaxed">
            Platform no-code untuk merakit asisten AI, chatbot, dan sistem multi-agen — sesuai domain dan cara kerja Anda. Tidak perlu keahlian teknis, cukup pengetahuan domain.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
            {[
              { icon: "🔧", label: "AI Builder", sub: "No-code, visual" },
              { icon: "🧠", label: "Knowledge Base", sub: "Upload dokumen" },
              { icon: "🎭", label: "Persona AI", sub: "Karakter & gaya" },
              { icon: "⚡", label: "Agentic AI", sub: "Orkestrasi agen" },
              { icon: "🕸️", label: "Multi-Agent", sub: "OpenClaw system" },
              { icon: "📱", label: "Mini Apps", sub: "45 tipe tersedia" },
              { icon: "💬", label: "Widget", sub: "Embed di mana saja" },
              { icon: "📊", label: "Analytics", sub: "Monitor performa" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl px-2.5 py-2 flex flex-col gap-1 text-center items-center">
                <span className="text-xl leading-none">{item.icon}</span>
                <div className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-100 leading-tight">{item.label}</div>
                <div className="text-[10px] text-indigo-500 dark:text-indigo-400">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth">
              <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <Zap className="h-3.5 w-3.5" /> Mulai Merakit AI
              </button>
            </Link>
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Gustafta%20Builder" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 border border-indigo-400 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <MessageSquare className="h-3.5 w-3.5" /> Tanya via WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="pt-12 pb-8 px-4 text-center bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/20 dark:to-slate-950">
        <Badge className="mb-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs">
          Produk Gustafta
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Pilih Jalur Memiliki AI Gustafta
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
          Ada tiga cara mendapatkan AI Gustafta — sesuaikan dengan seberapa banyak Anda ingin terlibat dalam proses perakitannya.
          <br className="hidden sm:block"/>
          Semua jalur menggunakan platform yang sama: <span className="font-medium text-indigo-600 dark:text-indigo-400">Builder</span> (merakit sendiri),{" "}
          <span className="font-medium text-violet-600 dark:text-violet-400">Jasa</span> (kami yang rakit), atau{" "}
          <span className="font-medium text-blue-600 dark:text-blue-400">Store</span> (pilih dari kreator).
        </p>
        {/* 3 jalur — kartu keputusan */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto text-left">
          {/* Jalur 1 — Beli Produk Jadi (lisensi + langganan) */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 p-4 flex flex-col" data-testid="card-jalur-produk">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/></div>
              <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Beli Produk Jadi</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed flex-1">Akses chatbot premium yang sudah jadi — tinggal pakai, kelola & atur sendiri lewat Builder.</p>
            <div className="mt-2 text-xs"><span className="text-gray-400">mulai</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{PRICING.subscription.starter.perMonth}</span></div>
            <div className="text-[10px] text-gray-400 mb-3">lisensi + langganan · tanpa biaya setup</div>
            <Button asChild size="sm" variant="outline" className="mt-auto w-full text-xs h-8 border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
              <a href="#paket-langganan" data-testid="btn-jalur-produk">Lihat Paket <ChevronRight className="w-3.5 h-3.5 ml-1"/></a>
            </Button>
          </div>

          {/* Jalur 2 — Tim Kami Rakitkan (jasa) — HIGHLIGHT */}
          <div className="relative rounded-2xl border-2 border-violet-400 dark:border-violet-600 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4 flex flex-col shadow-sm" data-testid="card-jalur-jasa">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">TANPA RIBET</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0"><Wrench className="w-4 h-4 text-violet-600 dark:text-violet-400"/></div>
              <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Tim Kami Rakitkan</span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed flex-1">Tidak punya waktu atau bingung teknis? Tim ahli kami yang merakitkan chatbot Anda sampai siap pakai.</p>
            <div className="mt-2 text-xs"><span className="text-gray-400">mulai</span> <span className="font-bold text-violet-600 dark:text-violet-400">{SERVICE_TIERS[0].price}</span></div>
            <div className="text-[10px] text-gray-400 mb-3">biaya rakit sekali bayar · paling cepat jalan</div>
            <Button asChild size="sm" className="mt-auto w-full text-xs h-8 bg-violet-600 hover:bg-violet-500 text-white">
              <Link href="/packs" data-testid="btn-jalur-jasa">Layanan Jasa <ChevronRight className="w-3.5 h-3.5 ml-1"/></Link>
            </Button>
          </div>

          {/* Jalur 3 — Pilih dari Store */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 p-4 flex flex-col" data-testid="card-jalur-store">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-blue-600 dark:text-blue-400"/></div>
              <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Pilih dari Store</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed flex-1">Chatbot jadi dari kreator bersertifikat — pilih dari katalog, langsung aktif.</p>
            <div className="mt-2 text-xs"><span className="text-gray-400">lisensi</span> <span className="font-bold text-blue-600 dark:text-blue-400">sekali bayar</span> <span className="text-gray-400">+ bulanan</span></div>
            <div className="text-[10px] text-gray-400 mb-3">langsung aktif dari katalog · dikurasi tim</div>
            <Button asChild size="sm" variant="outline" className="mt-auto w-full text-xs h-8 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">
              <Link href="/store" data-testid="btn-jalur-store">Buka Store <ChevronRight className="w-3.5 h-3.5 ml-1"/></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section id="paket-langganan" className="py-10 px-4 scroll-mt-20">
        <BisnisPaket/>
        <KomparasiTable/>
      </section>

      {/* CTA bottom */}
      <section className="py-12 px-4 bg-gradient-to-b from-white to-indigo-50/60 dark:from-slate-950 dark:to-indigo-950/20 text-center">
        <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">Masih bingung pilih paket yang mana?</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Konsultasi gratis dengan tim Gustafta — kami bantu pilihkan paket terbaik untuk bisnis Anda.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20paket" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 hover:bg-green-500 text-white text-sm h-10 px-5">
              <Phone className="w-4 h-4 mr-2"/> Chat WhatsApp
            </Button>
          </a>
          <Link href="/pricing">
            <Button variant="outline" className="text-sm h-10 px-5 border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
              Lihat Pricing Lengkap <ArrowRight className="w-4 h-4 ml-2"/>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

