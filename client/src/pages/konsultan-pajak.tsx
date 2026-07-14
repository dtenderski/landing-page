import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Calculator, FileText,
  BarChart3, Shield, AlertTriangle, Building2, Users,
  TrendingUp, DollarSign, ClipboardList, XCircle, Clock,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20konsultan%20pajak";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";
const CHECKOUT_BASIC = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";

const SERVICES = [
  {
    id: "pajak-bisnis", color: "amber",
    icon: <Building2 className="h-6 w-6 text-amber-600" />,
    title: "Pajak Badan & Korporasi",
    features: ["Interpretasi PPh Badan, PPN, & PPh Pasal 21/23/25/26", "Panduan penyusunan SPT Tahunan Badan", "Tax planning & optimasi beban pajak yang legal", "Analisis implikasi pajak atas transaksi korporasi", "Review aspek pajak dalam kontrak & perjanjian", "Panduan transfer pricing & dokumentasi TP"],
  },
  {
    id: "pajak-umkm", color: "emerald",
    icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
    title: "Pajak UMKM & Wajib Pajak OP",
    features: ["Panduan pajak UMKM: PP 23/2018 tarif 0,5%", "SPT Tahunan Orang Pribadi: formulir 1770/1770S/1770SS", "Interpretasi hak & kewajiban Wajib Pajak", "Panduan pemanfaatan insentif pajak UMKM", "Norma penghitungan penghasilan neto per profesi", "Panduan transisi UMKM dari PPh final ke tarif normal"],
  },
  {
    id: "kepatuhan", color: "blue",
    icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
    title: "Kepatuhan & Pelaporan Pajak",
    features: ["Kalender kewajiban pajak bulanan & tahunan", "Checklist pelaporan SPT Masa (PPN, PPh 21, 23, 25)", "Panduan pembuatan bukti potong & e-Bupot", "Prosedur pembetulan SPT & pengungkapan sukarela", "Panduan permintaan restitusi & kompensasi pajak", "Alert perubahan regulasi DJP & PMK terbaru"],
  },
  {
    id: "sengketa", color: "red",
    icon: <Shield className="h-6 w-6 text-red-600" />,
    title: "Sengketa & Pemeriksaan Pajak",
    features: ["Panduan menghadapi pemeriksaan pajak DJP", "Strategi keberatan & banding atas SKPKB", "Persiapan data & dokumen untuk klarifikasi SP2DK", "Analisis hukum atas sengketa pajak per pos", "Panduan negosiasi closing conference pemeriksaan", "Review penghitungan sanksi & bunga pajak"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/10",   border: "border-amber-200 dark:border-amber-800",   icon: "bg-amber-100 dark:bg-amber-900/30",   tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-900/10",border:"border-emerald-200 dark:border-emerald-800",icon:"bg-emerald-100 dark:bg-emerald-900/30", tag:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/10",     border: "border-blue-200 dark:border-blue-800",     icon: "bg-blue-100 dark:bg-blue-900/30",     tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  red:    { bg: "bg-red-50 dark:bg-red-900/10",       border: "border-red-200 dark:border-red-800",       icon: "bg-red-100 dark:bg-red-900/30",       tag: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_PAJAK = [
  {
    icon: BarChart3,
    value: "10,08%",
    label: "Rasio pajak Indonesia 2024 (arti luas) terhadap PDB — masih rendah, sehingga DJP terus memperketat pengawasan & kepatuhan.",
    source: "Kementerian Keuangan RI, 2024",
  },
  {
    icon: Building2,
    value: "~60%",
    label: "UMKM menyumbang sekitar 60% PDB Indonesia (±64 juta unit) — segmen besar yang butuh panduan pajak yang jelas & terjangkau.",
    source: "Kemenkop UKM / Kemenkeu, 2024",
  },
  {
    icon: Clock,
    value: "~207 jam",
    label: "Perusahaan menengah di Indonesia menghabiskan ±207 jam per tahun untuk memenuhi kewajiban perpajakan.",
    source: "World Bank & PwC, Paying Taxes",
  },
];

export default function KonsultanPajakPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-pajak">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Calculator className="h-3.5 w-3.5" />
                AI Advisor Pajak Indonesia
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Regulasi Pajak Indonesia<br />
                <span className="text-yellow-200">Berubah 200+ Kali Setahun. Siapa yang Mengikutinya untuk Anda?</span>
              </h1>
              <p className="text-base text-amber-100 mb-4 leading-relaxed">
                PMK, PER DJP, SE, dan perubahan UU pajak terus berubah. Konsultan pajak yang tidak update
                bisa memberikan advice yang sudah usang — dengan konsekuensi sanksi ke klien.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-amber-100">
                <span className="font-bold text-white">PajakClaw</span> — AI advisor pajak Indonesia dengan 8 sub-agen spesialis. Selalu update dengan regulasi terbaru DJP.
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "8", label: "Sub-Agen PajakClaw", sub: "Spesialis per jenis pajak" },
                { num: "200+", label: "Perubahan Pajak/Tahun", sub: "PMK, PER DJP, SE terbaru" },
                { num: "PPh+PPN", label: "Semua Jenis Pajak", sub: "Pusat, daerah, & internasional" },
                { num: "24/7", label: "Tax Advisor AI", sub: "Tidak perlu antri konsultasi" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-yellow-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Biaya tidak update pajak ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Risiko yang Sering Diabaikan</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Apa yang Terjadi Jika Konsultasi Pajak Anda Tidak Up-to-Date?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <AlertTriangle className="h-5 w-5 text-red-400" />, title: "Sanksi Administrasi", value: "2–50%", desc: "Denda bunga per bulan atas pajak yang kurang bayar karena interpretasi regulasi yang salah atau tidak terkini." },
              { icon: <Clock className="h-5 w-5 text-amber-400" />, title: "Waktu Sengketa", value: "1–5 tahun", desc: "Proses keberatan dan banding pajak bisa berlangsung bertahun-tahun jika tidak dipersiapkan dengan baik dari awal." },
              { icon: <XCircle className="h-5 w-5 text-red-400" />, title: "Reputasi Konsultan", value: "Permanen", desc: "Satu kesalahan advice pajak yang signifikan bisa merusak reputasi yang dibangun bertahun-tahun." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.title}</span></div>
                <div className="text-2xl font-extrabold text-amber-300 mb-2">{item.value}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center">
            <p className="text-amber-100 font-semibold mb-1">PajakClaw bukan pengganti judgment Anda sebagai konsultan.</p>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">PajakClaw adalah asisten riset yang memastikan Anda selalu tahu regulasi terbaru dan tidak melewatkan perubahan PMK atau PER DJP yang relevan untuk klien Anda.</p>
          </div>
        </div>
      </section>

      {/* PajakClaw Highlight */}
      <section className="py-12 px-4 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl border-2 border-amber-300 dark:border-amber-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calculator className="h-6 w-6 text-amber-600" />
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">PajakClaw — AI Advisor Pajak Indonesia</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">8 Sub-Agen Paralel</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4 leading-relaxed">
              Satu-satunya AI advisor pajak Indonesia yang bekerja dengan 8 sub-agen paralel — setiap sub-agen spesialis pada jenis pajak yang berbeda, analisis Anda komprehensif dan tidak ada aspek yang terlewat.
            </p>
            <div className="grid md:grid-cols-4 gap-2">
              {["PPh Badan & OP", "PPN & PPnBM", "Transfer Pricing", "Pajak Daerah", "SPT & Pelaporan", "Sengketa & Banding", "Tax Planning", "Insentif Fiskal"].map((agent, i) => (
                <div key={i} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center text-xs font-medium text-amber-800 dark:text-amber-300">{agent}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — 4 area layanan ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">4 Area Layanan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">Cakupan Konsultasi Pajak AI</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Dari PPh hingga sengketa DJP — semua aspek pajak Indonesia tercakup dalam satu platform.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {SERVICES.map((svc) => {
              const c = colorStyles[svc.color];
              return (
                <div key={svc.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-${svc.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{svc.icon}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{svc.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {svc.features.map((f, j) => (
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

      <section className="py-16 px-4 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 mb-3">Menurut Data</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Konteks Perpajakan Indonesia</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {STATS_PAJAK.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-amber-100 dark:border-border" data-testid={`stat-pajak-${i}`}>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                    <SIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                  <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                  <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-5 max-w-2xl mx-auto leading-snug">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Regulasi Pajak Berubah Terus — AI Anda Selalu Update</h2>
          <p className="text-amber-100 mb-2">PajakClaw memahami UU HPP, PMK terbaru, dan praktik DJP yang berlaku.</p>
          <p className="text-yellow-200 text-sm mb-8">Tidak ada lagi "saya perlu cek dulu" — jawaban ada di tangan Anda detik itu juga.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-yellow-200 mt-5">
            Lihat juga:{" "}
            <Link href="/konsultan-keuangan"><span className="underline font-semibold cursor-pointer">Konsultan Keuangan →</span></Link>
            {" · "}
            <Link href="/konsultan-hukum"><span className="underline font-semibold cursor-pointer">Konsultan Hukum →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-hukum"><span className="hover:text-white cursor-pointer">Konsultan Hukum</span></Link>
          <Link href="/konsultan-keuangan"><span className="hover:text-white cursor-pointer">Konsultan Keuangan</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
