import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SharedHeader } from "@/components/shared-header";
import {
  Check, X, ArrowRight, Phone, Mail, Star, Rocket,
  MessageSquare, BookOpen, Blocks, PlaySquare, FileText,
  Mic, Users, GraduationCap, Briefcase, Building2, Sparkles,
  Zap, Crown, Bot, Globe, Shield, Clock, TrendingUp, Headphones,
  ChevronRight, BrainCircuit, Lightbulb, Target, BarChart3, Flame,
  Package, CheckCircle2, Layers, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING } from "@/data/pricing";
import { trackLead } from "@/lib/meta-pixel";

/* Lisensi sekali bayar (sumbu Produk): gratis bila ambil Starter Kit, atau lisensi penuh tanpa Starter Kit */
const LICENSE_ONETIME = `Starter Kit ${PRICING.starterKit.price} → lisensi Rp 0`;

/* ─── FEATURES ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: MessageSquare,
    name: "AI Chatbot",
    tagline: "Asisten Cerdas 24/7",
    desc: "Chatbot AI berbasis LLM yang mampu menjawab pertanyaan, memberi panduan belajar, konsultasi informasi, hingga simulasi diskusi — tersedia kapanpun, dimanapun.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: ["Percakapan natural berbasis AI", "Konteks domain spesifik", "Riwayat percakapan tersimpan", "Integrasi Knowledge Base"],
  },
  {
    icon: BookOpen,
    name: "Modul Pembelajaran",
    tagline: "Belajar Terstruktur & Interaktif",
    desc: "Modul pembelajaran digital yang terstruktur dengan navigasi hierarki — dari topik besar hingga sesi spesifik. Cocok untuk kurikulum, pelatihan, dan pengembangan kompetensi.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: ["Hierarki topik fleksibel", "Progress tracking otomatis", "Konten multimedia", "Akses chatbot per modul"],
  },
  {
    icon: Blocks,
    name: "Mini Apps",
    tagline: "Tools Produktivitas Siap Pakai",
    desc: "33+ tipe mini apps bawaan yang bisa diaktifkan dalam chatbot: rubrik penilaian, risk register, intake form, work mode selector, studio kompetensi, dan banyak lagi.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: ["33+ tipe mini app", "Rubrik & scoring", "Form intake cerdas", "Output PDF/export"],
  },
  {
    icon: PlaySquare,
    name: "E-Course",
    tagline: "Kursus Digital yang Bisa Dijual",
    desc: "Buat dan monetisasi kursus online Anda sendiri. Dilengkapi sistem akses berbasis token, video/modul terkunci, dan integrasi pembayaran.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    items: ["Video + modul teks", "Akses berbasis langganan", "Sertifikat penyelesaian", "Integrasi pembayaran terintegrasi"],
  },
  {
    icon: FileText,
    name: "Document Generator",
    tagline: "Otomatisasi Pembuatan Dokumen",
    desc: "Buat dokumen profesional (proposal, laporan, kontrak, surat) secara otomatis dengan bantuan AI. Input data minimal, output dokumen siap kirim.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    items: ["Template dokumen profesional", "AI-assisted content filling", "Export ke PDF / Word", "Kustomisasi branding"],
  },
  {
    icon: Mic,
    name: "Podcast",
    tagline: "Konten Audio yang Berpengaruh",
    desc: "Kelola dan distribusikan konten podcast Anda dalam platform yang sama. Pengguna bisa belajar sambil mendengarkan — format yang terbukti meningkatkan retensi.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    items: ["Upload & stream audio", "Episode management", "Integrasi materi belajar", "Embed ke website"],
  },
];

/* ─── PACKAGES ──────────────────────────────────────────────── */
const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Mulai ekosistem digitalmu",
    icon: Bot,
    color: "text-blue-500",
    colorBg: "bg-blue-500/10",
    colorBorder: "border-blue-500/30",
    licenseFee: LICENSE_ONETIME,
    monthlyFee: PRICING.subscription.starter.label,
    popular: false,
    features: [
      { text: "1 Seri / Domain Konten", included: true },
      { text: "Chatbot AI (10 agent)", included: true },
      { text: "Modul Pembelajaran (basic)", included: true },
      { text: "5 Tipe Mini App", included: true },
      { text: "1.000 pesan AI / bulan", included: true },
      { text: "Starter Kit (paket perkenalan, add-on lintas-tier) — Panduan Gustafta", included: true },
      { text: "E-Course (kursus online)", included: false },
      { text: "Document Generator", included: false },
      { text: "Podcast Management", included: false },
      { text: "Custom Domain", included: false },
      { text: "Akses API Custom", included: false },
    ],
    cta: "Mulai dengan Starter",
    ctaVariant: "outline" as const,
  },
  {
    id: "profesional",
    name: "Profesional",
    tagline: "Ekosistem lengkap untuk kreator",
    icon: Zap,
    color: "text-primary",
    colorBg: "bg-primary/10",
    colorBorder: "border-primary/50",
    licenseFee: LICENSE_ONETIME,
    monthlyFee: PRICING.subscription.profesional.label,
    popular: true,
    features: [
      { text: "3 Seri / Domain Konten", included: true },
      { text: "Chatbot AI (50 agent)", included: true },
      { text: "Modul Pembelajaran (full)", included: true },
      { text: "15 Tipe Mini App", included: true },
      { text: "5.000 pesan AI / bulan", included: true },
      { text: "Starter Kit (paket perkenalan, add-on lintas-tier) — Panduan Gustafta", included: true },
      { text: "E-Course (kursus online)", included: true },
      { text: "Document Generator (10 template)", included: true },
      { text: "Podcast Management", included: false },
      { text: "1 Custom Domain", included: true },
      { text: "Akses API Custom", included: false },
    ],
    cta: "Pilih Profesional",
    ctaVariant: "default" as const,
  },
  {
    id: "bisnis",
    name: "Bisnis",
    tagline: "Tim 2 akun + 100 slot shared",
    icon: Building2,
    color: "text-violet-500",
    colorBg: "bg-violet-500/10",
    colorBorder: "border-violet-500/30",
    licenseFee: LICENSE_ONETIME,
    monthlyFee: PRICING.subscription.bisnis.label,
    popular: false,
    features: [
      { text: "10 Seri / Domain Konten", included: true },
      { text: "Chatbot AI (100 slot, 2 sub-akun tim)", included: true },
      { text: "Modul Pembelajaran (full)", included: true },
      { text: "45 Tipe Mini App", included: true },
      { text: "20.000 pesan AI / bulan", included: true },
      { text: "Starter Kit (paket perkenalan, add-on lintas-tier) — Panduan Gustafta", included: true },
      { text: "E-Course tak terbatas", included: true },
      { text: "Document Generator (semua template)", included: true },
      { text: "Podcast Management", included: true },
      { text: "3 Custom Domain + Subdomain Khusus", included: true },
      { text: "Priority Support via WhatsApp", included: true },
    ],
    cta: "Pilih Bisnis",
    ctaVariant: "outline" as const,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Solusi skala korporat & institusi besar",
    icon: Crown,
    color: "text-amber-500",
    colorBg: "bg-amber-500/10",
    colorBorder: "border-amber-500/30",
    licenseFee: "Negosiasi",
    monthlyFee: "Custom",
    popular: false,
    features: [
      { text: "Seri & Agent tak terbatas", included: true },
      { text: "Semua 6 modul platform penuh", included: true },
      { text: "Integrasi ERP / LMS / sistem internal", included: true },
      { text: "Custom Mini App & Document Template", included: true },
      { text: "Pesan AI tak terbatas", included: true },
      { text: "E-Course + Sertifikasi custom", included: true },
      { text: "Document Generator (kustom)", included: true },
      { text: "Podcast + Video Streaming", included: true },
      { text: "Domain tak terbatas + Dedicated Server", included: true },
      { text: "Dedicated Account Manager + SLA 24/7", included: true },
    ],
    cta: "Hubungi Tim Kami",
    ctaVariant: "outline" as const,
  },
];

/* ─── SEGMENTS ──────────────────────────────────────────────── */
const SEGMENTS = [
  {
    icon: GraduationCap,
    title: "Mahasiswa & Pelajar",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    problems: ["Materi kuliah sulit dipahami mandiri", "Referensi tersebar di banyak sumber", "Skripsi / tugas akhir tanpa bimbingan 24 jam"],
    solutions: ["Chatbot dosen virtual & asisten belajar AI", "Modul pembelajaran terstruktur per mata kuliah", "Document generator untuk skripsi & laporan"],
  },
  {
    icon: Briefcase,
    title: "Profesional & Konsultan",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    problems: ["Dokumen berulang yang menyita waktu", "Klien butuh jawaban cepat di luar jam kerja", "Pengembangan skill yang tidak terstruktur"],
    solutions: ["Document generator proposal, kontrak & laporan", "Chatbot konsultasi 24/7 untuk klien", "E-course monetisasi keahlian Anda"],
  },
  {
    icon: Building2,
    title: "Pelaku Usaha & Institusi",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    problems: ["Training karyawan yang mahal & tidak efisien", "Customer service terbatas jam operasional", "Tools kerja yang tidak terintegrasi"],
    solutions: ["Platform pelatihan internal + modul SOP", "Chatbot CS aktif 24/7 tanpa biaya tambahan", "Ekosistem tools produktivitas dalam satu platform"],
  },
];

/* ─── FAQS ──────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "Apa perbedaan Gustafta Apps dengan platform e-learning biasa?",
    a: "Gustafta Apps bukan sekadar platform e-learning. Ini adalah ekosistem digital terintegrasi yang menggabungkan chatbot AI, modul pembelajaran, mini apps, e-course, document generator, dan podcast dalam satu sistem. Pengguna tidak hanya belajar, tetapi juga memiliki tools produktivitas yang langsung bisa diterapkan dalam pekerjaan sehari-hari.",
  },
  {
    q: "Apakah saya perlu kemampuan teknis untuk menggunakan platform ini?",
    a: "Tidak sama sekali. Gustafta Apps dirancang sepenuhnya no-code. Semua konfigurasi chatbot, pembuatan modul, upload podcast, penerbitan e-course, hingga pembuatan dokumen dilakukan melalui antarmuka visual yang intuitif.",
  },
  {
    q: "Apa perbedaan Lisensi dan Biaya Bulanan?",
    a: `Lisensi adalah biaya sekali bayar untuk hak pakai platform — gratis bila Anda mengambil Starter Kit (${PRICING.starterKit.price}), atau ${PRICING.license.price} bila tanpa Starter Kit. Biaya Bulanan adalah biaya langganan rutin untuk penggunaan platform, hosting, API AI, dan akses support. Berlangganan platform tidak memungut biaya setup terpisah.`,
  },
  {
    q: "Berapa lama proses hingga platform aktif?",
    a: "Aktivasi langganan langsung begitu pembayaran terkonfirmasi — Anda bisa mulai memakai platform di hari yang sama. Bila Anda mengambil Layanan Jasa (tim rakit) terpisah, jadwal pengerjaannya menyesuaikan scope dan dijelaskan saat konsultasi.",
  },
  {
    q: "Bisakah saya menjual kursus atau konten dari platform ini?",
    a: "Ya! Paket Profesional ke atas sudah dilengkapi fitur E-Course dengan sistem pembayaran terintegrasi. Anda bisa membuat, mempublish, dan menjual kursus digital langsung dari platform Gustafta Apps.",
  },
  {
    q: "Apakah ada uji coba gratis?",
    a: "Kami menyediakan demo session gratis selama 1 jam untuk menunjukkan kemampuan platform sesuai kebutuhan bisnis Anda. Hubungi tim kami via WhatsApp untuk jadwalkan demo.",
  },
  {
    q: "Bagaimana sistem pembayaran?",
    a: "Lisensi (sekali bayar) dibayar di awal via transfer bank atau QRIS saat aktivasi. Biaya bulanan dikonfirmasi setiap awal bulan via WhatsApp (transfer bank, QRIS). Invoice resmi tersedia untuk kebutuhan korporat.",
  },
];

/* ─── RESEARCH (Menurut Data) ───────────────────────────────── */
const RESEARCH = [
  {
    value: "USD 2,4 Miliar",
    label: "Estimasi nilai pasar AI di Indonesia pada 2024",
    source: "Statista Market Insights",
    icon: TrendingUp,
  },
  {
    value: "+127%",
    label: "Pertumbuhan pendapatan aplikasi berbasis AI (H1 2024→H1 2025) — tertinggi di Asia Tenggara",
    source: "SEA e-Conomy 2025 (Google, Temasek, Bain)",
    icon: Flame,
  },
  {
    value: "~1,3 juta",
    label: "Perkiraan jumlah pengguna tools AI di Indonesia pada 2024",
    source: "Statista",
    icon: Users,
  },
];

/* ─── STATS ─────────────────────────────────────────────────── */
const STATS = [
  { value: "6", label: "Modul Platform Terintegrasi" },
  { value: "33+", label: "Tipe Mini App Bawaan" },
  { value: "900+", label: "Agent AI Siap Pakai" },
  { value: "24/7", label: "Aktif Menghasilkan — Tanpa Batas" },
];

/* ─── INCOME STREAMS ────────────────────────────────────────── */
const INCOME_STREAMS = [
  {
    icon: PlaySquare,
    title: "Jual E-Course",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    desc: "Monetisasi keahlian Anda. Buat kursus online, tentukan harga, dan platform mengelola pembayaran otomatis.",
    example: "Contoh: Kursus Sertifikasi K3 @ Rp 299.000 × 50 peserta = Rp 14.950.000/bulan",
  },
  {
    icon: Bot,
    title: "Jual Jasa Chatbot",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    desc: "Setup chatbot untuk klien dari platform Anda sendiri. Tawarkan sebagai layanan managed chatbot bulanan.",
    example: "Contoh: 10 klien × Rp 1.500.000/bulan = Rp 15.000.000 MRR",
  },
  {
    icon: FileText,
    title: "Otomatisasi Dokumen",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    desc: "Tawarkan layanan pembuatan dokumen profesional (proposal, kontrak, laporan) yang dibantu AI dalam hitungan menit.",
    example: "Contoh: 20 dokumen/bulan × Rp 250.000 = Rp 5.000.000 pendapatan jasa",
  },
];

export default function PlatformSalesPage() {
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [activeFeature, setActiveFeature] = useState(0);

  const formatYearly = (monthly: string) => {
    const num = parseInt(monthly.replace(/[^0-9]/g, ""));
    const yearly = Math.round((num * 12 * 0.83) / 1000) * 1000;
    return `Rp ${yearly.toLocaleString("id-ID")}`;
  };

  const WA_BASE = "https://wa.me/6282299417818";
  const waLink = (msg: string) => {
    trackLead({ content_name: "WhatsApp CTA" });
    return `${WA_BASE}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SharedHeader />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-0 md:pt-20">
        {/* background blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 items-end max-w-7xl mx-auto">
            {/* Left text */}
            <div className="text-center lg:text-left pb-12 md:pb-16 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Paket Bisnis AI — Ekosistem digital siap hasilkan</span>
                <Sparkles className="h-4 w-4" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 leading-tight" data-testid="text-apps-hero-title">
                <span className="text-primary">Gustafta</span>{" "}
                <span className="bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">Apps</span>
              </h1>
              <p className="text-xl sm:text-2xl font-semibold text-muted-foreground mb-5 italic">
                "Satu Paket. Ekosistem Lengkap. Langsung Menghasilkan."
              </p>

              <p className="text-base md:text-lg text-muted-foreground mb-7 max-w-xl lg:mx-0 mx-auto leading-relaxed">
                <strong>Paket Bisnis AI</strong> adalah paket platform lengkap yang sudah mencakup semua yang Anda butuhkan untuk membangun dan menjalankan bisnis digital: Chatbot AI, Modul Pembelajaran, E-Course berbayar, Document Generator, Mini Apps, dan Podcast — terintegrasi dalam satu sistem, aktif dari hari pertama.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-7">
                {[
                  { icon: Shield, text: "Tanpa Coding" },
                  { icon: Clock, text: "Aktif dalam 7–14 Hari" },
                  { icon: BrainCircuit, text: "AI-Powered" },
                  { icon: TrendingUp, text: "Langsung Bisa Menghasilkan" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground border">
                    <b.icon className="h-3.5 w-3.5 text-primary" />
                    {b.text}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="#paket">
                  <Button size="lg" className="w-full sm:w-auto gap-2 px-7 py-5 text-base" data-testid="button-lihat-paket">
                    <Package className="h-5 w-5" />
                    Lihat Paket Berlangganan
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href={waLink("Halo, saya tertarik dengan Gustafta Apps. Boleh minta jadwal demo gratis?")} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 px-7 py-5 text-base border-primary/30" data-testid="button-demo">
                    <Phone className="h-5 w-5" />
                    Demo Gratis
                  </Button>
                </a>
              </div>
            </div>

            {/* Right illustration */}
            <div className="flex items-end justify-center order-1 lg:order-2 relative">
              <img
                src="/gustafta-apps-hero.png"
                alt="Gustafta Apps — The Future of Learning & Productivity"
                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full animate-float drop-shadow-2xl"
                data-testid="img-apps-hero"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="py-10 bg-muted/50 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label} data-testid={`stat-apps-${s.label}`}>
                <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Mengapa Paket Bisnis AI?</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Satu Paket. Semua yang Anda Butuhkan untuk Mulai Menghasilkan.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Banyak bisnis terhambat karena harus merakit banyak tools terpisah, proses yang manual, dan ekosistem yang tidak terhubung. Paket Bisnis AI Gustafta hadir sebagai solusi tunggal yang sudah siap.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: X,
                title: "Masalah Saat Ini",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
                items: [
                  "Platform belajar & tools kerja terpisah",
                  "Tidak ada chatbot AI yang bisa dikustomisasi",
                  "Pembuatan dokumen yang memakan waktu",
                  "Kursus online sulit dimonetisasi",
                  "Tidak ada ekosistem yang saling terhubung",
                ],
              },
              {
                icon: ArrowRight,
                title: "Gustafta Apps",
                color: "text-primary",
                bg: "bg-primary/10",
                items: ["Integrasi 6 modul dalam 1 platform", "AI Chatbot yang dikustomisasi per domain", "Document generator otomatis berbasis AI", "E-Course + sistem pembayaran built-in", "Semua modul saling terhubung & terintegrasi"],
              },
              {
                icon: Check,
                title: "Hasil yang Anda Dapat",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                items: [
                  "Efisiensi kerja meningkat hingga 60%",
                  "Belajar 24/7 tanpa ketergantungan jadwal",
                  "Dokumen profesional dalam 20 menit",
                  "Sumber pendapatan baru dari konten digital",
                  "Ekosistem kompetensi yang berkelanjutan",
                ],
              },
            ].map((col) => (
              <Card key={col.title} className="border">
                <CardContent className="p-5">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", col.bg)}>
                    <col.icon className={cn("h-5 w-5", col.color)} />
                  </div>
                  <h3 className={cn("font-bold mb-3", col.color)}>{col.title}</h3>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                        <col.icon className={cn("h-4 w-4 shrink-0 mt-0.5", col.color)} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 FEATURES ────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">6 Modul Utama</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ekosistem Lengkap dalam Satu Platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bukan sekadar kumpulan fitur — melainkan ekosistem yang saling terhubung. Setiap modul memperkuat modul lainnya.
            </p>
          </div>

          {/* Feature illustration + detail */}
          <div className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto mb-10">
            <div className="flex justify-center">
              <img
                src="/gustafta-apps-features.png"
                alt="Gustafta Apps 6 Modul Utama"
                className="w-full max-w-sm md:max-w-md drop-shadow-xl rounded-2xl"
                data-testid="img-apps-features"
              />
            </div>
            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setActiveFeature(i)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    activeFeature === i
                      ? `${f.bg} ${f.border} shadow-sm`
                      : "bg-background border-border hover:bg-muted/50"
                  )}
                  data-testid={`button-feature-${f.name}`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", f.bg)}>
                      <f.icon className={cn("h-4 w-4", f.color)} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">{f.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">— {f.tagline}</span>
                    </div>
                  </div>
                  {activeFeature === i && (
                    <div className="mt-2 ml-11">
                      <p className="text-sm text-muted-foreground mb-2">{f.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {f.items.map((item) => (
                          <span key={item} className={cn("text-xs px-2 py-0.5 rounded-full border", f.bg, f.border, f.color)}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR WHOM ──────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Untuk Siapa?</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Dirancang untuk Kebutuhan Nyata</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gustafta Apps menjawab masalah spesifik yang dihadapi tiga segmen utama pengguna.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {SEGMENTS.map((seg) => (
              <Card key={seg.title} className="border" data-testid={`card-segment-${seg.title}`}>
                <CardContent className="p-6">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", seg.bg)}>
                    <seg.icon className={cn("h-6 w-6", seg.color)} />
                  </div>
                  <h3 className="font-bold text-lg mb-4">{seg.title}</h3>

                  <div className="space-y-3 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tantangan</p>
                    {seg.problems.map((p) => (
                      <div key={p} className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{p}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solusi Gustafta Apps</p>
                    {seg.solutions.map((s) => (
                      <div key={s} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PELUANG MENGHASILKAN ──────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-violet-500/3 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Potensi Penghasilan</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform yang Bisa Balik Modal Sendiri</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gustafta Apps bukan pengeluaran — ini <strong>investasi yang bisa menghasilkan</strong>. Berikut 4 cara nyata platform ini bekerja untuk Anda.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {INCOME_STREAMS.map((stream) => (
              <div
                key={stream.title}
                className={`rounded-2xl border ${stream.border} bg-background p-5 flex flex-col gap-3`}
                data-testid={`card-income-${stream.title}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stream.bg}`}>
                  <stream.icon className={`h-5 w-5 ${stream.color}`} />
                </div>
                <h3 className={`font-bold text-base ${stream.color}`}>{stream.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{stream.desc}</p>
                <div className={`text-xs font-medium rounded-lg p-3 ${stream.bg} border ${stream.border}`}>
                  <TrendingUp className={`h-3.5 w-3.5 inline mr-1.5 ${stream.color}`} />
                  {stream.example}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Simulasi: Paket Bisnis (Rp 999.000/bulan) + 5 klien chatbot managed</p>
            <p className="text-2xl font-bold text-primary mb-1">Rp 15.000.000 / bulan pendapatan berulang</p>
            <p className="text-xs text-muted-foreground">Modal platform Rp 999.000 · Gross margin ~93% · ROI bulan pertama</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Proses Aktivasi</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Dari Konsultasi hingga Ekosistem Aktif</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-border" />
            {[
              { step: "01", icon: Phone, title: "Konsultasi Gratis", desc: "Diskusi kebutuhan & tentukan paket paling sesuai" },
              { step: "02", icon: CheckCircle2, title: "Aktivasi & Mulai", desc: "Konfirmasi paket, invoice dikirim, akun langsung diaktifkan" },
              { step: "03", icon: Cpu, title: "Bangun Platform", desc: "Tim kami konfigurasi & isi konten awal bersama Anda" },
              { step: "04", icon: Target, title: "Uji & Sempurnakan", desc: "Uji coba bersama, revisi hingga sempurna" },
              { step: "05", icon: Rocket, title: "Aktif & Hasilkan", desc: "Platform live — mulai layani pengguna & hasilkan pendapatan" },
            ].map((s, i) => (
              <div key={s.step} className="text-center relative z-10" data-testid={`step-${s.step}`}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 relative">
                  <s.icon className="h-7 w-7 text-primary" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                </div>
                <p className="font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="paket" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Paket Berlangganan</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Paket Bisnis AI — Transparan, Tanpa Biaya Tersembunyi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
              Setiap paket terdiri dari dua komponen: <strong>Lisensi</strong> (sekali bayar — gratis bila ambil Starter Kit {PRICING.starterKit.price}, atau lisensi {PRICING.license.price} tanpa Starter Kit) dan <strong>Biaya Berlangganan Bulanan</strong> (akses platform). Tidak ada biaya setup tersembunyi.
            </p>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/60 border text-sm text-muted-foreground mb-6">
              <span>💡 Catatan: <strong>Paket Series Modul</strong> juga memiliki Setup & Instalasi tersendiri — lihat detail di halaman <a href="/packs" className="text-primary underline underline-offset-2">Paket Series Modul</a></span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto -mt-2">
              Catatan: <strong>Starter Kit</strong> bukan salah satu tier — ini paket perkenalan sekali bayar (lisensi + panduan + 7 hari trial) yang bisa dipakai sebagai pintu masuk ke tier mana pun.
            </p>
          </div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border">
              <button
                onClick={() => setActiveTab("monthly")}
                className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all", activeTab === "monthly" ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                data-testid="button-tab-monthly"
              >Bulanan</button>
              <button
                onClick={() => setActiveTab("yearly")}
                className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5", activeTab === "yearly" ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                data-testid="button-tab-yearly"
              >
                Tahunan
                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Hemat 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start max-w-7xl mx-auto">
            {PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={cn("relative border-2 transition-all", pkg.popular ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]" : pkg.colorBorder)}
                data-testid={`card-package-${pkg.id}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 text-xs font-semibold">
                      <Star className="h-3 w-3 mr-1" /> Paling Populer
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5 pt-7 space-y-4">
                  <div>
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", pkg.colorBg)}>
                      <pkg.icon className={cn("h-5 w-5", pkg.color)} />
                    </div>
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    <p className="text-xs text-muted-foreground">{pkg.tagline}</p>
                  </div>

                  {/* Lisensi (sekali bayar) */}
                  <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lisensi (sekali bayar)</div>
                    <div className={cn("text-sm font-bold", pkg.color)}>{pkg.licenseFee}</div>
                    {pkg.id !== "enterprise" && (
                      <div className="text-[10px] text-muted-foreground mt-1">Tanpa Starter Kit: lisensi {PRICING.license.price} (sekali)</div>
                    )}
                  </div>

                  {/* Monthly */}
                  <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Biaya Bulanan</div>
                    <div className={cn("text-lg font-bold", pkg.color)}>
                      {pkg.id === "enterprise" ? pkg.monthlyFee
                        : activeTab === "yearly" ? formatYearly(pkg.monthlyFee) + "/thn"
                        : pkg.monthlyFee}
                    </div>
                    {activeTab === "yearly" && pkg.id !== "enterprise" && (
                      <div className="text-xs text-green-600 dark:text-green-400">dibayar tahunan · hemat 17%</div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {pkg.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-xs">
                        {f.included
                          ? <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          : <X className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />}
                        <span className={f.included ? "" : "text-muted-foreground/50 line-through"}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={pkg.id === "enterprise"
                      ? waLink("Halo, saya tertarik paket Enterprise Gustafta Apps. Bisa konsultasi?")
                      : waLink(`Halo, saya tertarik paket ${pkg.name} Gustafta Apps (Lisensi: ${pkg.licenseFee}, Bulanan ${pkg.monthlyFee}). Bagaimana cara mulainya?`)}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <Button
                      variant={pkg.ctaVariant}
                      className={cn("w-full", pkg.popular && "bg-primary text-primary-foreground hover:bg-primary/90")}
                      data-testid={`button-cta-${pkg.id}`}
                    >
                      {pkg.cta}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Harga belum termasuk PPN 11%. Invoice resmi tersedia. Pembayaran via transfer bank, QRIS, atau e-wallet.
          </p>
        </div>
      </section>

      {/* ── Menurut Data ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Menurut Data</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Momentum AI di Indonesia</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {RESEARCH.map((s, i) => (
              <Card key={i} className="border" data-testid={`card-research-${i}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-extrabold">{s.value}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/70">Sumber: {s.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground/70 mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan Umum</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-5" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Mulai Bangun Bisnis Digital Anda Hari Ini
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Konsultasi gratis, tanpa komitmen. Kami bantu pilih paket yang paling cepat menghasilkan untuk bisnis Anda — respons dalam 1×24 jam.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={waLink("Halo, saya tertarik dengan Gustafta Apps. Bisa konsultasi & minta demo gratis?")} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto gap-2 px-8 py-6 text-lg" data-testid="button-final-wa">
                  <Phone className="h-5 w-5" />
                  Hubungi via WhatsApp
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <a href="mailto:hello@gustafta.com?subject=Pertanyaan tentang Gustafta Apps">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 px-8 py-6 text-lg border-primary/30" data-testid="button-final-email">
                  <Mail className="h-5 w-5" />
                  Kirim Email
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              {["Konsultasi Gratis", "Onboarding Dibimbing", "Support Aktif", "No-Code", "Langsung Bisa Menghasilkan"].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER MINI ───────────────────────────────────── */}
      <footer className="py-8 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Gustafta Apps</span>
              <span className="italic">— The Future of Learning & Productivity</span>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/" className="hover:text-foreground transition-colors">Beranda</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Paket Berlangganan</Link>
              <Link href="/store" className="hover:text-foreground transition-colors">Store</Link>
              <Link href="/packs" className="hover:text-foreground transition-colors">Paket Series Modul</Link>
              <Link href="/documentation" className="hover:text-foreground transition-colors">Dokumentasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
