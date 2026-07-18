import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import { PRICING, TRILOGI } from "@/data/pricing";
import {
  Check, ArrowRight, MessageCircle, HardHat, Building2,
  ShieldCheck, FileText, TrendingUp, Zap,
  Wrench, Award, BarChart3, ChevronRight, Cpu, Users,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20konstruksi%20dan%20keteknikan";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const PAIN_POINTS = [
  {
    icon: <FileText className="h-6 w-6 text-red-500" />,
    title: "Dokumen SBU & SKK Menggunung",
    desc: "Persyaratan sertifikasi BUJK berubah terus. Tim Anda habis waktu membaca Permen, circular letter, dan surat edaran yang saling bertentangan.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-red-500" />,
    title: "Kalah Tender Berulang Kali",
    desc: "Win probability tidak terhitung secara sistematis. Dokumen penawaran tidak optimal. Bid/no-bid decision masih jalan berdasarkan 'feeling'.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-red-500" />,
    title: "K3 & Compliance Jadi Beban",
    desc: "Laporan SMK3, CSMS, dan audit K3 menguras tenaga HSE Officer. Pekerja lapangan tidak bisa akses prosedur dengan cepat saat dibutuhkan.",
  },
  {
    icon: <Wrench className="h-6 w-6 text-red-500" />,
    title: "Koordinasi Proyek Terfragmentasi",
    desc: "Informasi proyek tersebar di WhatsApp, email, dan spreadsheet. Tidak ada single source of truth. Keputusan lapangan lambat karena koordinasi manual.",
  },
];

const SOLUTIONS = [
  {
    category: "SBU & Perizinan BUJK",
    color: "amber",
    icon: <Award className="h-6 w-6 text-amber-600" />,
    tools: [
      { name: "SBUClaw", desc: "Konsultasi lengkap persyaratan SBU 10 sub-klasifikasi konstruksi" },
      { name: "LKUTClaw", desc: "Panduan pengisian dan validasi LKUT BUJK" },
      { name: "PJBUClaw", desc: "Persyaratan personel manajerial per kualifikasi" },
      { name: "ABUClaw", desc: "Konsultan ABU & akreditasi LSBU" },
      { name: "SkemaClaw", desc: "Sertifikasi BUJK sesuai Permen PU 6/2025" },
      { name: "ESIMPANClaw", desc: "Panduan input pengalaman di sistem E-SIMPAN" },
    ],
    usecases: [
      "Verifikasi kelengkapan dokumen SBU per sub-klasifikasi",
      "Panduan upgrade kualifikasi K/M/B",
      "Checklist perpanjangan SBU yang akan berakhir",
      "Interpretasi perubahan regulasi PUPR terbaru",
    ],
  },
  {
    category: "SKK & Kompetensi Tenaga Kerja",
    color: "blue",
    icon: <Users className="h-6 w-6 text-blue-600" />,
    tools: [
      { name: "ManprojakClaw", desc: "SKK Manajemen Pelaksanaan Konstruksi" },
      { name: "ArsitekturClaw", desc: "SKK Klasifikasi Arsitektur" },
      { name: "SipilClaw", desc: "Konsultan teknik sipil & SKK" },
      { name: "GeoteknikClaw", desc: "SKK Sipil — Geoteknik" },
      { name: "JalanJembatanClaw", desc: "SKK Sipil — Jalan & Jembatan" },
      { name: "PengawasClaw", desc: "Pengawas konstruksi & persyaratan SKK" },
    ],
    usecases: [
      "Pemetaan kebutuhan SKK per proyek",
      "Panduan persiapan uji kompetensi",
      "Simulasi pertanyaan asesmen SKK",
      "Roadmap karir per jabatan teknis",
    ],
  },
  {
    category: "K3 & Safety Management",
    color: "red",
    icon: <ShieldCheck className="h-6 w-6 text-red-600" />,
    tools: [
      { name: "CSMSClaw", desc: "Contractor Safety Management System 12 sub-agen" },
      { name: "SMK3Claw", desc: "IMS & SMK3 terintegrasi ISO 45001" },
      { name: "SafiraClaw", desc: "SKK K3 Konstruksi spesialis" },
      { name: "K3ManClaw", desc: "Manajemen K3 Konstruksi end-to-end" },
      { name: "SMAPClaw", desc: "ISO 37001 Anti-Penyuapan" },
    ],
    usecases: [
      "Checklist inspeksi K3 lapangan real-time",
      "Panduan audit CSMS pra-kontrak",
      "Simulasi penerapan Hierarchy of Control",
      "Laporan temuan K3 terstruktur otomatis",
    ],
  },
  {
    category: "Tender & Business Development",
    color: "indigo",
    icon: <TrendingUp className="h-6 w-6 text-indigo-600" />,
    tools: [
      { name: "TenderaClaw", desc: "AI Tender BUJK — 10 sub-agen analisis" },
      { name: "KonstraTenderClaw", desc: "Monitor tender SIRUP & LPSE" },
      { name: "PanduanSBU", desc: "Tanya jawab SBU instant" },
      { name: "KeuanganClaw", desc: "Analisis keuangan BUJK untuk tender" },
      { name: "KontrakClaw", desc: "Manajemen kontrak & klaim FIDIC/Perpres" },
    ],
    usecases: [
      "Analisis win probability 4 dimensi",
      "Rekomendasi bid/no-bid berdasarkan profil BUJK",
      "Review kelengkapan dokumen penawaran",
      "Analisis klaim dan sengketa kontrak",
    ],
  },
  {
    category: "Manajemen Proyek & Lapangan",
    color: "emerald",
    icon: <Building2 className="h-6 w-6 text-emerald-600" />,
    tools: [
      { name: "KonstraClaw", desc: "Manajemen proyek konstruksi end-to-end" },
      { name: "SiteOpsClaw", desc: "Operasional lapangan & site management" },
      { name: "BIMClaw", desc: "BIM & konstruksi digital" },
      { name: "QSClaw", desc: "Quantity Surveying & estimasi biaya" },
      { name: "BrainClaw", desc: "Project Intelligence AI — analisis risiko" },
    ],
    usecases: [
      "Penjadwalan proyek & identifikasi critical path",
      "Estimasi biaya dan validasi RAB",
      "Manajemen risiko proyek terstruktur",
      "Laporan progress mingguan otomatis",
    ],
  },
  {
    category: "Standar & Sertifikasi ISO",
    color: "teal",
    icon: <BarChart3 className="h-6 w-6 text-teal-600" />,
    tools: [
      { name: "ISOClaw 9001", desc: "SMM ISO 9001 untuk jasa konstruksi" },
      { name: "ISOClaw 14001", desc: "SML ISO 14001 lingkungan" },
      { name: "LingkunganClaw", desc: "Konsultan lingkungan hidup & AMDAL" },
      { name: "TataLingkunganClaw", desc: "SKK Tata Lingkungan" },
      { name: "ESGClaw", desc: "ESG & keberlanjutan di sektor konstruksi" },
    ],
    usecases: [
      "Gap analysis kesiapan ISO 9001/14001",
      "Panduan dokumentasi SMM",
      "Simulasi audit internal sistem manajemen",
      "Pelaporan ESG untuk proyek infrastruktur",
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/10",
    border: "border-amber-200 dark:border-amber-800",
    icon: "bg-amber-100 dark:bg-amber-900/30",
    tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    border: "border-blue-200 dark:border-blue-800",
    icon: "bg-blue-100 dark:bg-blue-900/30",
    tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/10",
    border: "border-red-200 dark:border-red-800",
    icon: "bg-red-100 dark:bg-red-900/30",
    tag: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/10",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: "bg-indigo-100 dark:bg-indigo-900/30",
    tag: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-100 dark:bg-emerald-900/30",
    tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-900/10",
    border: "border-teal-200 dark:border-teal-800",
    icon: "bg-teal-100 dark:bg-teal-900/30",
    tag: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
};

export default function KonstruksiPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konstruksi">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-700 via-orange-700 to-red-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <HardHat className="h-3.5 w-3.5" />
                AI Khusus Konstruksi & Keteknikan
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                30+ AI Spesialis<br />
                <span className="text-amber-200">untuk Industri Konstruksi</span>
              </h1>
              <p className="text-base md:text-lg text-amber-100 mb-8 leading-relaxed">
                Dari SBU & SKK, K3 & CSMS, manajemen tender, hingga proyek lapangan —
                Gustafta menghadirkan tim AI multi-agen yang memahami regulasi PUPR,
                Kemnaker, dan standar teknis Indonesia secara mendalam.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <Link href={builderUrl}>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-mulai">
                    Coba Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "30+", label: "AI Tools Konstruksi", sub: "SBU, K3, Tender, Proyek" },
                { num: "6", label: "Kategori Solusi", sub: "End-to-end coverage" },
                { num: "130+", label: "Regulasi Dipahami", sub: "Permen, SNI, SKKNI" },
                { num: "10+", label: "Sub-Agen per Claw", sub: "Analisis paralel mendalam" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-amber-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-2">Tantangan yang Anda Hadapi</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Masalah yang Familiar di Industri Konstruksi
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-gray-100 dark:border-border flex items-start gap-4">
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl flex-shrink-0">{p.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">{p.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">Solusi Gustafta</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            30+ AI Spesialis dalam 6 Kategori
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground mb-10 text-sm max-w-2xl mx-auto">
            Setiap "Claw" adalah orchestrator AI yang mengoordinasi 5–12 sub-agen spesialis secara paralel —
            menghasilkan analisis mendalam yang biasanya membutuhkan tim konsultan bertahun-tahun pengalaman.
          </p>
          <div className="space-y-6">
            {SOLUTIONS.map((sol, i) => {
              const c = colorMap[sol.color];
              return (
                <div key={i} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-solution-${i}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{sol.icon}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{sol.category}</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Tools */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Tools Tersedia</p>
                      <div className="space-y-2">
                        {sol.tools.map((tool, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${c.tag}`}>
                              {tool.name}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-muted-foreground">{tool.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Use cases */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Apa yang Bisa Dilakukan</p>
                      <ul className="space-y-2">
                        {sol.usecases.map((uc, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            {uc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOR WHOM ── */}
      <section className="py-16 px-4 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">Untuk Siapa</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Siapa yang Mendapat Manfaat Terbesar?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <Building2 className="h-6 w-6 text-amber-600" />,
                title: "BUJK & Kontraktor",
                points: ["Tim BD & estimasi tender", "Manajemen SBU & perpanjangan", "HSE & compliance CSMS", "PM & site manager lapangan"],
              },
              {
                icon: <Award className="h-6 w-6 text-blue-600" />,
                title: "Konsultan Konstruksi",
                points: ["Konsultan manajemen proyek", "QS & cost engineer", "Perencana & pengawas", "Konsultan K3 & lingkungan"],
              },
              {
                icon: <Users className="h-6 w-6 text-emerald-600" />,
                title: "Asosiasi & LSP",
                points: ["Asesor kompetensi SKK", "Staf asosiasi (GAPENSI, INKINDO)", "Pelatih & trainer konstruksi", "Peneliti & akademisi teknik"],
              },
            ].map((group, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-amber-100 dark:border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 dark:bg-muted rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{group.title}</h3>
                </div>
                <ul className="space-y-2">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menurut Data ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Konteks Sektor Konstruksi Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "4,86%", label: "Tenaga kerja konstruksi yang sudah bersertifikat SKK (Des 2024)", source: "LPJK 2024", icon: <HardHat className="h-5 w-5 text-amber-600 dark:text-amber-400" /> },
              { value: "±8,76 juta", label: "Tenaga kerja sektor konstruksi nasional (Agustus 2024)", source: "Sakernas BPS 2024", icon: <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" /> },
              { value: "548.977", label: "Total SKK terbit jenjang 1–9 hingga Desember 2024", source: "LPJK 2024", icon: <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── HOW TO START ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Cara Mulai</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10">Dari Nol ke AI Konstruksi Aktif</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Pelajari Dasarnya",
                desc: "Starter Kit: Buku I + Panduan Builder. Fondasi membangun chatbot AI pertama Anda tanpa coding.",
                cta: "Tanya Info Pembayaran",
                href: CHECKOUT_BASIC,
                variant: "outline" as const,
              },
              {
                step: "2",
                title: "Bangun Chatbot Konstruksi",
                desc: "Bundle Trilogi: 3 buku + prompt pack + template 6-agen AI + 1 bulan Builder gratis.",
                cta: "Tanya Info Pembayaran",
                href: CHECKOUT_URL,
                variant: "default" as const,
              },
              {
                step: "3",
                title: "Akses MultiClaw Suite",
                desc: "Upgrade ke paket Profesional untuk akses penuh 30+ AI tools konstruksi & keteknikan.",
                cta: "Lihat Paket Profesional",
                href: builderUrl,
                variant: "outline" as const,
              },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-6 border border-gray-100 dark:border-border text-left">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 font-extrabold flex items-center justify-center mb-4 text-sm">{s.step}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{s.desc}</p>
                <a href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  <Button className={`w-full text-xs font-bold h-9 ${s.variant === "default" ? "bg-amber-600 hover:bg-amber-500 text-white" : ""}`} variant={s.variant} data-testid={`btn-step-${i}`}>
                    {s.cta} →
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-700 via-orange-700 to-red-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <HardHat className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Industri Konstruksi Butuh AI yang Memahaminya
          </h2>
          <p className="text-amber-100 mb-8 leading-relaxed">
            Bukan chatbot generik — AI yang tahu perbedaan SBU BG009 dan BG004,
            yang paham CSMS Level 1 vs Level 3, yang bisa hitung win probability tender
            berbasis data, bukan perasaan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WhatsApp
              </Button>
            </a>
          </div>
          <p className="text-xs text-amber-200 mt-5">
            Mau lihat semua tools?{" "}
            <Link href="/multiclaw-suite">
              <span className="underline font-semibold cursor-pointer">Buka Katalog MultiClaw Suite →</span>
            </Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <Link href="/starter-kit"><span className="hover:text-white cursor-pointer">Starter Kit</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
