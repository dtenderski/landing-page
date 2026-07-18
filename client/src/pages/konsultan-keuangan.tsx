import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, TrendingUp, BarChart3,
  DollarSign, Shield, FileText, Building2,
  Calculator, XCircle, Clock, AlertTriangle,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20akuntan%20dan%20konsultan%20keuangan";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const TOOLS = [
  {
    id: "keuangan", color: "emerald",
    icon: <BarChart3 className="h-6 w-6 text-emerald-600" />,
    name: "KeuanganClaw", sub: "Keuangan BUJK & Analisis Finansial — 4 sub-agen",
    title: "Analisis Keuangan & Pelaporan",
    masalah: "Analisis rasio keuangan manual memakan waktu berjam-jam dan rawan human error",
    solusi: "KeuanganClaw menganalisis laporan keuangan secara paralel — rasio, proyeksi, dan sensitivitas dalam menit",
    features: ["Analisis laporan keuangan: rasio likuiditas, solvabilitas, profitabilitas", "Interpretasi PSAK & IFRS untuk pengakuan pendapatan", "Penyusunan proyeksi keuangan & analisis sensitivitas", "Review kemampuan keuangan untuk dukungan bank tender", "Analisis modal kerja, cash flow, & kebutuhan pendanaan"],
  },
  {
    id: "pajak", color: "amber",
    icon: <Calculator className="h-6 w-6 text-amber-600" />,
    name: "PajakClaw", sub: "AI Advisor Pajak Indonesia — 8 sub-agen",
    title: "Perencanaan & Optimasi Pajak",
    masalah: "Rekonsiliasi fiskal membutuhkan pemahaman mendalam yang sering berubah seiring update regulasi DJP",
    solusi: "PajakClaw menangani seluruh rekonsiliasi fiskal dan tax planning dengan 8 sub-agen spesialis pajak",
    features: ["Tax planning yang legal untuk efisiensi beban pajak", "Rekonsiliasi fiskal laporan keuangan komersial vs fiskal", "Panduan deductible & non-deductible expense (Pasal 6 & 9)", "Optimasi penyusutan aset fiskal & amortisasi", "Review koreksi positif & negatif dalam SPT Badan"],
  },
  {
    id: "esg", color: "green",
    icon: <TrendingUp className="h-6 w-6 text-green-600" />,
    name: "ESGClaw", sub: "ESG & Keberlanjutan — 8 sub-agen",
    title: "Pelaporan ESG & Keberlanjutan",
    masalah: "Pelaporan ESG yang semakin diwajibkan investor & regulator membutuhkan expertise baru yang banyak akuntan belum kuasai",
    solusi: "ESGClaw memandu penyusunan laporan keberlanjutan GRI, kalkulasi emisi karbon, dan TCFD dari nol",
    features: ["Penyusunan laporan keberlanjutan GRI Standards", "Kalkulasi emisi karbon Scope 1, 2, 3 untuk pelaporan", "Panduan green bond & sustainability-linked financing", "Analisis risiko iklim berbasis TCFD untuk investor", "Integrasi laporan keuangan & non-keuangan (integrated reporting)"],
  },
  {
    id: "korporasi", color: "blue",
    icon: <Building2 className="h-6 w-6 text-blue-600" />,
    name: "KorporasiClaw", sub: "AI Konsultan Korporasi & Bisnis — 8 sub-agen",
    title: "Corporate Finance & Valuasi",
    masalah: "Due diligence dan valuasi bisnis untuk M&A membutuhkan waktu berminggu-minggu dan biaya konsultan besar",
    solusi: "KorporasiClaw mengakselerasi due diligence keuangan dan valuasi bisnis dengan analisis DCF, multiple, dan NPV otomatis",
    features: ["Analisis valuasi bisnis: DCF, market multiple, asset-based", "Due diligence keuangan untuk M&A & investasi", "Panduan struktur modal & optimasi leverage", "Analisis kelayakan proyek: NPV, IRR, payback period", "Panduan IPO & persiapan reporting keuangan publik"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/30", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/10",    border: "border-amber-200 dark:border-amber-800",   icon: "bg-amber-100 dark:bg-amber-900/30",   tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  green:  { bg: "bg-green-50 dark:bg-green-900/10",    border: "border-green-200 dark:border-green-800",   icon: "bg-green-100 dark:bg-green-900/30",   tag: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/10",      border: "border-blue-200 dark:border-blue-800",     icon: "bg-blue-100 dark:bg-blue-900/30",     tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_KEUANGAN = [
  {
    icon: Calculator,
    value: "~40%",
    label: "Sekitar 40% aktivitas fungsi keuangan dapat diotomasi sepenuhnya dengan teknologi yang sudah ada — waktu untuk pekerjaan rutin bisa dialihkan ke analisis.",
    source: "McKinsey, The Future of the Finance Function",
  },
  {
    icon: FileText,
    value: "30+",
    label: "Standar pelaporan keberlanjutan IFRS S1 & S2 (efektif 1 Jan 2024) telah diadopsi atau dikomitmenkan di 30+ yurisdiksi — permintaan pelaporan ESG melonjak.",
    source: "IFRS Foundation / ISSB",
  },
  {
    icon: BarChart3,
    value: "65,43%",
    label: "Indeks literasi keuangan Indonesia 2024 (inklusi 75,02%) — kebutuhan advisory & edukasi keuangan yang jelas masih sangat besar.",
    source: "OJK & BPS, SNLIK 2024",
  },
];

export default function KonsultanKeuanganPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-keuangan">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <TrendingUp className="h-3.5 w-3.5" />
                AI untuk Akuntan & Konsultan Keuangan Indonesia
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Klien Bayar Anda untuk Insight,<br />
                <span className="text-emerald-200">Bukan untuk Jam-Jam Mengumpulkan Data</span>
              </h1>
              <p className="text-base text-emerald-100 mb-4 leading-relaxed">
                Konsultan keuangan dan akuntan terbaik menghabiskan terlalu banyak waktu
                untuk pekerjaan berulang — rekonsiliasi, analisis rasio, pelaporan ESG —
                yang seharusnya bisa diselesaikan AI dalam menit.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-100">
                AI Gustafta memahami <span className="font-bold text-white">PSAK, IFRS, regulasi OJK, dan konteks keuangan Indonesia</span> — bukan sekadar kalkulator spreadsheet.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "4+", label: "AI Tools Keuangan", sub: "Analisis, Pajak, ESG, Korporasi" },
                { num: "PSAK", label: "Standar Akuntansi", sub: "PSAK, IFRS, SAK ETAP, SAK EP" },
                { num: "GRI", label: "Pelaporan ESG", sub: "GRI, TCFD, SASB, SFDR" },
                { num: "DCF+IRR", label: "Metode Valuasi", sub: "NPV, IRR, Multiple, Asset-based" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-emerald-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Waktu vs nilai ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Realita Pekerjaan Keuangan</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Berapa Persen Waktu Anda Benar-Benar Dipakai untuk Analisis?</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Survei konsultan keuangan menunjukkan distribusi waktu yang mengejutkan.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <Clock className="h-5 w-5 text-red-400" />, pct: "60%", label: "Pengumpulan & Rekonsiliasi Data", desc: "Mayoritas waktu habis untuk mengumpulkan, membersihkan, dan merekonsiliasi data dari berbagai sumber — bukan menganalisisnya." },
              { icon: <AlertTriangle className="h-5 w-5 text-amber-400" />, pct: "25%", label: "Penyusunan Laporan Rutin", desc: "Laporan bulanan, triwulanan, dan tahunan yang formatnya berulang memakan waktu yang tidak sebanding dengan nilai yang diberikan." },
              { icon: <BarChart3 className="h-5 w-5 text-emerald-400" />, pct: "15%", label: "Analisis & Insight Strategis", desc: "Hanya sebagian kecil waktu yang tersisa untuk pekerjaan yang benar-benar bernilai tinggi dan tidak bisa digantikan oleh siapapun." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.label}</span></div>
                <div className="text-3xl font-extrabold text-white mb-2">{item.pct}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-5">
              <h3 className="font-bold text-red-300 mb-3 flex items-center gap-2"><XCircle className="h-4 w-4" /> Tanpa AI Keuangan</h3>
              <ul className="space-y-2">
                {["Analisis rasio keuangan manual 4–6 jam per klien", "Rekonsiliasi fiskal rawan human error dan makan hari", "Pelaporan ESG dari nol butuh expertise baru yang mahal", "Due diligence M&A berlangsung berminggu-minggu", "Proyeksi keuangan hanya bisa pakai skenario terbatas"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-200"><XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5">
              <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2"><Check className="h-4 w-4" /> Dengan AI Keuangan Gustafta</h3>
              <ul className="space-y-2">
                {["Analisis rasio keuangan komprehensif dalam menit", "Rekonsiliasi fiskal terstruktur dengan checklist otomatis", "Laporan ESG GRI Standards dipandu langkah demi langkah", "Due diligence keuangan terakselerasi dengan template AI", "Simulasi proyeksi multi-skenario dalam satu sesi"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-emerald-200"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — 4 tools dengan Masalah→Solusi ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">4 Area Layanan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">AI untuk Setiap Aspek Keuangan</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Setiap AI tools dirancang untuk masalah keuangan spesifik — bukan satu chatbot generik untuk semua pertanyaan.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {TOOLS.map((tool) => {
              const c = colorStyles[tool.color];
              return (
                <div key={tool.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-${tool.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{tool.icon}</div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{tool.name}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{tool.sub}</p>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mt-1">{tool.title}</h3>
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-3 py-2 mb-2">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-0.5">Masalah:</p>
                    <p className="text-xs text-red-700 dark:text-red-300">{tool.masalah}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 px-3 py-2 mb-4">
                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mb-0.5">Solusi:</p>
                    <p className="text-xs text-green-700 dark:text-green-300">{tool.solusi}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {tool.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Untuk Siapa + Menurut Data */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Untuk Siapa</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profesi yang Paling Diuntungkan</h2>
              <div className="space-y-3">
                {[
                  { icon: <BarChart3 className="h-4 w-4 text-emerald-500" />, title: "Akuntan & KAP", points: ["Partner & senior akuntan publik", "Auditor eksternal & internal", "Konsultan PSAK & IFRS"] },
                  { icon: <TrendingUp className="h-4 w-4 text-blue-500" />, title: "Analis & Perencana", points: ["Financial analyst & planner", "Corporate finance specialist", "Treasury & cash management"] },
                  { icon: <Shield className="h-4 w-4 text-amber-500" />, title: "Konsultan & Advisor", points: ["Konsultan keuangan independen", "M&A advisor & due diligence", "CFO & FD perusahaan"] },
                ].map((group, i) => (
                  <div key={i} className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {group.points.map((pt, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                          <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Menurut Data</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Kenapa Ini Penting</h2>
              <div className="space-y-4">
                {STATS_KEUANGAN.map((s, i) => {
                  const SIcon = s.icon;
                  return (
                    <div key={i} className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-border" data-testid={`stat-keuangan-${i}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <SIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-1.5">{s.label}</p>
                      <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 leading-snug">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Data Keuangan Anda + Analisis AI = Lebih Banyak Klien, Lebih Sedikit Jam Kerja</h2>
          <p className="text-emerald-100 mb-2">PSAK, IFRS, regulasi OJK, dan konteks keuangan Indonesia — AI yang benar-benar paham.</p>
          <p className="text-emerald-200 text-sm mb-8">Analisis lebih cepat · Laporan lebih komprehensif · Klien lebih puas</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-emerald-200 mt-5">
            Lihat juga:{" "}
            <Link href="/konsultan-pajak"><span className="underline font-semibold cursor-pointer">Konsultan Pajak →</span></Link>
            {" · "}
            <Link href="/konsultan-hukum"><span className="underline font-semibold cursor-pointer">Konsultan Hukum →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-pajak"><span className="hover:text-white cursor-pointer">Konsultan Pajak</span></Link>
          <Link href="/konsultan-hukum"><span className="hover:text-white cursor-pointer">Konsultan Hukum</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
