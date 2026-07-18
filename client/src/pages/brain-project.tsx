import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Brain, BarChart3,
  Target, Zap, TrendingUp, AlertTriangle,
  ClipboardList, Activity, XCircle, Clock, DollarSign,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20Brain%20Project";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const SUB_AGENTS = [
  { role: "INTELLIGENCE-CORE", color: "cyan", desc: "Sintesis data proyek menjadi intelligence yang actionable untuk pengambilan keputusan strategis" },
  { role: "RISK-RADAR", color: "red", desc: "Deteksi dini risiko proyek: biaya, jadwal, mutu, safety — sebelum menjadi masalah nyata" },
  { role: "PERFORMANCE-ANALYST", color: "blue", desc: "Analisis Earned Value (EVM): CPI, SPI, EAC, VAC, dan tren performa proyek real-time" },
  { role: "DECISION-ARCHITECT", color: "violet", desc: "Strukturisasi keputusan kompleks dengan decision tree, AHP, dan analisis multi-kriteria" },
  { role: "STAKEHOLDER-INTEL", color: "emerald", desc: "Pemetaan kepentingan stakeholder, strategi komunikasi, dan manajemen ekspektasi" },
  { role: "FORECAST-ENGINE", color: "amber", desc: "Proyeksi penyelesaian proyek (EAC, ETC, TCPI) berbasis data aktual dan tren terkini" },
];

const agentColors: Record<string, string> = {
  cyan:    "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  red:     "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  blue:    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  violet:  "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  amber:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

export default function BrainProjectPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-brain-project">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-teal-700 to-blue-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Brain className="h-3.5 w-3.5" />
                BrainClaw — Project Intelligence AI
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Proyek Bermasalah Selalu Punya<br />
                <span className="text-cyan-200">Tanda Peringatan — yang Tidak Terlihat sampai Terlambat</span>
              </h1>
              <p className="text-base text-cyan-100 mb-4 leading-relaxed">
                CPI menurun sejak bulan ke-3, tapi baru ketahuan di bulan ke-7.
                Risiko muncul di laporan, tapi tidak ada yang menghitungnya secara sistematis.
                Keputusan dibuat berdasarkan gut feeling — bukan data.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-cyan-100">
                <span className="font-bold text-white">BrainClaw</span> mengintegrasikan 6 sub-agen analisis proyek yang bekerja paralel — dari risiko, EVM, forecast, hingga stakeholder intelligence. Semua dalam satu laporan.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <Link href={builderUrl}>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-coba">
                    Coba Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "6", label: "Sub-Agen BrainClaw", sub: "Intelligence · Risk · EVM · Forecast" },
                { num: "EVM", label: "Metodologi", sub: "CPI, SPI, EAC, VAC, TCPI" },
                { num: "360°", label: "Visibilitas Proyek", sub: "Biaya, jadwal, mutu, risiko" },
                { num: "Proaktif", label: "Deteksi Risiko", sub: "Sebelum menjadi masalah nyata" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Biaya proyek bermasalah ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Fakta Proyek Konstruksi Indonesia</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Mengapa Proyek Gagal Bukan karena Tidak Ada Data — tapi karena Data Tidak Dianalisis</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <DollarSign className="h-5 w-5 text-red-400" />, stat: "60–80%", label: "Proyek Over Budget", desc: "Mayoritas proyek konstruksi Indonesia mengalami pembengkakan biaya — rata-rata 20–40% di atas baseline awal." },
              { icon: <Clock className="h-5 w-5 text-amber-400" />, stat: "70%+", label: "Proyek Terlambat", desc: "Terlambat bukan karena tidak ada jadwal — tapi karena early warning sign terlambat terdeteksi dan ditindaklanjuti." },
              { icon: <XCircle className="h-5 w-5 text-red-400" />, stat: "3–6 bulan", label: "Deteksi Terlambat", desc: "Rata-rata masalah kritis baru terdeteksi 3–6 bulan setelah pertama kali muncul dalam data — karena tidak ada sistem monitoring proaktif." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.label}</span></div>
                <div className="text-3xl font-extrabold text-cyan-300 mb-2">{item.stat}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
            <p className="text-cyan-100 font-semibold mb-1">Laporan proyek ada. Data ada. Yang kurang adalah analisis yang mengubah data menjadi keputusan.</p>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">BrainClaw memproses data lintas fungsi proyek — biaya, jadwal, risiko, stakeholder — dan menghasilkan intelligence yang langsung bisa dipakai untuk mengambil keputusan.</p>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — 6 Sub-Agents ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">6 Sub-Agen BrainClaw</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">Project Intelligence yang Bekerja Paralel</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Bukan satu model generik — 6 spesialis bekerja bersamaan dan hasilnya diintegrasikan menjadi laporan komprehensif.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {SUB_AGENTS.map((a, i) => (
              <div key={i} className={`rounded-xl border p-4 flex gap-3 ${agentColors[a.color]}`}>
                <div className="w-7 h-7 rounded-full bg-white/50 text-xs font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                <div>
                  <p className="text-xs font-bold mb-0.5">{a.role}</p>
                  <p className="text-xs opacity-80 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Use Cases */}
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">Kapan Digunakan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Kapan BrainClaw Paling Dibutuhkan?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <AlertTriangle className="h-5 w-5 text-red-500" />, title: "Proyek Bermasalah", bg: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30", points: ["CPI < 1 dan terus menurun", "Jadwal sudah telat lebih dari 2 bulan", "Klaim kontraktor membengkak", "Owner meminta laporan pemulihan"] },
              { icon: <BarChart3 className="h-5 w-5 text-cyan-500" />, title: "Monthly Reporting", bg: "bg-cyan-50 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-800/30", points: ["Persiapan laporan progress bulanan", "Presentasi ke steering committee", "Update investor & financier proyek", "KPI dashboard proyek real-time"] },
              { icon: <Target className="h-5 w-5 text-emerald-500" />, title: "Perencanaan Strategis", bg: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30", points: ["Baseline jadwal & anggaran baru", "Scenario analysis percepatan", "Resource leveling & optimasi alokasi", "Close-out review & lesson learned"] },
            ].map((g, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${g.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{g.icon}</div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{g.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {g.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />{pt}
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
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Realita Pengelolaan Proyek Konstruksi</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "48–52%", label: "Rework proyek konstruksi akibat data & komunikasi yang buruk", source: "FMI & Autodesk 2018", icon: <AlertTriangle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> },
              { value: "US$88,7 M", label: "Estimasi biaya rework konstruksi global per tahun", source: "Autodesk & FMI 2020", icon: <DollarSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> },
              { value: "±14 jam", label: "Waktu per minggu yang dihabiskan mencari data & informasi proyek", source: "FMI / PlanGrid", icon: <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl p-5 border border-cyan-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-cyan-700 via-teal-700 to-blue-800 text-white text-center">
        <div className="max-w-xl mx-auto">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Dari Data Proyek ke Intelligence yang Menggerakkan Keputusan</h2>
          <p className="text-cyan-100 text-sm mb-2">BrainClaw memproses data lintas fungsi proyek secara paralel dan menghasilkan laporan siap pakai dalam hitungan menit — bukan hari.</p>
          <p className="text-cyan-200 text-xs mb-8">Deteksi risiko lebih awal · EVM otomatis · Forecast berbasis data aktual</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-cyan-200 mt-4">
            Lihat juga:{" "}
            <Link href="/konsultan-kontrak"><span className="underline font-semibold cursor-pointer">Konsultan Kontrak →</span></Link>
            {" · "}
            <Link href="/konsultan-dokumen-proyek"><span className="underline font-semibold cursor-pointer">Dokumen Proyek →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <Link href="/konsultan-kontrak"><span className="hover:text-white cursor-pointer">Konsultan Kontrak</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
