import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, TrendingUp, FileText,
  Target, BarChart3, Shield, Zap, Search, Award,
  ClipboardList, DollarSign, AlertTriangle, XCircle, Clock,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20tender%20dan%20pengadaan%20proyek";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const PAIN_POINTS = [
  { icon: <Target className="h-6 w-6 text-red-500" />, title: "Win Rate Tender di Bawah 20%", desc: "Ikut banyak tender tapi yang menang sedikit. Tidak ada sistem untuk menghitung peluang menang secara objektif sebelum memutuskan bid." },
  { icon: <FileText className="h-6 w-6 text-red-500" />, title: "Dokumen Penawaran Tidak Optimal", desc: "Dokumen teknis dan administrasi sering kurang lengkap, tidak sesuai format RKS, atau melewatkan persyaratan wajib — gugur di tahap evaluasi." },
  { icon: <Search className="h-6 w-6 text-red-500" />, title: "Monitoring Tender Lambat & Manual", desc: "Informasi tender baru di SIRUP dan LPSE terlambat diketahui. Banyak peluang proyek terlewat karena tidak ada sistem monitoring real-time." },
  { icon: <AlertTriangle className="h-6 w-6 text-red-500" />, title: "Risiko Kontrak Tidak Teridentifikasi", desc: "Klausul kontrak FIDIC atau Perpres yang merugikan tidak terdeteksi sebelum penandatanganan. Klaim dan sengketa muncul di tengah proyek." },
];

const SOLUTIONS = [
  {
    id: "intel", color: "indigo",
    icon: <Search className="h-6 w-6 text-indigo-600" />,
    title: "Intelijen Tender & Scouting",
    desc: "Identifikasi peluang tender yang sesuai profil BUJK sebelum kompetitor tahu.",
    tools: [
      { name: "TenderaClaw", desc: "Orchestrator 10 sub-agen: scouting, eligibility, WP score, strategi penawaran" },
      { name: "KonstraTenderClaw", desc: "Monitor tender SIRUP & LPSE — 4 sub-agen: monitor, analisis, alerting, reporting" },
    ],
    features: ["Long-list 5–15 paket tender potensial per query", "Fit Score per paket berdasarkan profil BUJK", "Analisis HPS, kompetitor historis, & metode evaluasi", "Alert tender baru sesuai kualifikasi & SBU"],
  },
  {
    id: "eligibility", color: "blue",
    icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
    title: "Eligibility Check & Bid Decision",
    desc: "Pastikan BUJK Anda eligible sebelum buang waktu & biaya dokumen penawaran.",
    tools: [
      { name: "TenderaClaw (ELIGIBILITY)", desc: "Cek kelayakan GO/CONDITIONAL/NO-GO: kualifikasi, SBU, personel SKK, pengalaman" },
      { name: "SBUClaw", desc: "Verifikasi sub-klasifikasi SBU yang dipersyaratkan per paket tender" },
      { name: "PJBUClaw", desc: "Cek persyaratan personel manajerial per nilai & kualifikasi paket" },
    ],
    features: ["Verdict GO/CONDITIONAL/NO-GO per paket", "Identifikasi gap persyaratan yang bisa disiasati", "Rekomendasi KSO jika tidak eligible sendiri", "Checklist kelengkapan dokumen administrasi"],
  },
  {
    id: "winprob", color: "violet",
    icon: <BarChart3 className="h-6 w-6 text-violet-600" />,
    title: "Win Probability Score",
    desc: "Hitung peluang menang secara sistematis dengan 4 dimensi objektif — bukan feeling.",
    tools: [
      { name: "TenderaClaw (WIN-PROB)", desc: "Scorecard 4 dimensi: Eligibility · Pricing · Technical · Track Record" },
      { name: "KeuanganClaw", desc: "Analisis keuangan BUJK untuk dukungan bank & kemampuan keuangan" },
    ],
    features: ["Skor WP 0–100 dengan breakdown per dimensi", "Threshold: <40 NO-BID · 40–65 CONDITIONAL · >65 GO", "Simulasi sensitivitas harga penawaran vs WP", "Benchmark vs kompetitor historis paket sejenis"],
  },
  {
    id: "dokumen", color: "emerald",
    icon: <FileText className="h-6 w-6 text-emerald-600" />,
    title: "Optimasi Dokumen Penawaran",
    desc: "Dokumen teknis dan administrasi yang optimal meningkatkan skor evaluasi.",
    tools: [
      { name: "TenderaClaw (DOC-OPT)", desc: "Review & rekomendasi dokumen teknis, metodologi, & K3" },
      { name: "KontraClaw", desc: "Manajemen proyek & perencanaan untuk metode pelaksanaan yang kredibel" },
      { name: "QSClaw", desc: "Review analisa harga satuan & RAB untuk penawaran kompetitif" },
    ],
    features: ["Checklist dokumen per metode evaluasi", "Review metodologi pelaksanaan proyek", "Optimasi komposisi HSP agar kompetitif", "Template dokumen teknis per jenis pekerjaan"],
  },
  {
    id: "kontrak", color: "red",
    icon: <Shield className="h-6 w-6 text-red-600" />,
    title: "Manajemen Kontrak & Klaim",
    desc: "Identifikasi risiko kontrak sebelum tanda tangan, kelola klaim selama proyek.",
    tools: [
      { name: "KontrakClaw", desc: "Manajemen kontrak FIDIC/Perpres & klaim konstruksi — 7 sub-agen" },
      { name: "KorporasiClaw", desc: "Aspek korporasi & bisnis dalam kontrak pengadaan pemerintah" },
    ],
    features: ["Identifikasi klausul berisiko di kontrak FIDIC/Perpres", "Panduan klaim Extension of Time (EoT)", "Prosedur sengketa & arbitrase kontrak", "Review perubahan kontrak (addendum & CCO)"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800", icon: "bg-indigo-100 dark:bg-indigo-900/30", tag: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/10",     border: "border-blue-200 dark:border-blue-800",     icon: "bg-blue-100 dark:bg-blue-900/30",     tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/30", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-900/10",border:"border-emerald-200 dark:border-emerald-800",icon: "bg-emerald-100 dark:bg-emerald-900/30",tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  red:    { bg: "bg-red-50 dark:bg-red-900/10",       border: "border-red-200 dark:border-red-800",       icon: "bg-red-100 dark:bg-red-900/30",       tag: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function TenderPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-tender">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-violet-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <TrendingUp className="h-3.5 w-3.5" />
                AI Khusus Tender & Pengadaan Proyek
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Win Rate Tender Anda Rendah<br />
                <span className="text-indigo-200">karena Kompetitor Sudah Pakai Data. Anda Masih Pakai Feeling.</span>
              </h1>
              <p className="text-base text-indigo-100 mb-4 leading-relaxed">
                Dari scouting peluang, eligibility check, kalkulasi win probability,
                optimasi dokumen, hingga manajemen kontrak & klaim — seluruh siklus tender
                Anda didukung AI spesialis yang memahami Perpres 46/2025 dan FIDIC.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-indigo-100">
                <span className="font-bold text-white">80% BUJK</span> kalah tender bukan karena harga — tapi karena dokumen tidak optimal dan eligibility yang tidak dicek lebih awal.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-indigo-800 hover:bg-indigo-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "10+", label: "Sub-Agen TenderaClaw", sub: "Scout, Eligibility, WP, Dokumen" },
                { num: "4", label: "Dimensi Win Probability", sub: "Eligibility · Pricing · Tech · Track" },
                { num: "WP>65", label: "Threshold GO", sub: "Sistematis, bukan feeling" },
                { num: "24/7", label: "Monitor SIRUP/LPSE", sub: "Alert tender baru otomatis" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-indigo-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Realita proses tender ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Biaya Tersembunyi Tender</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Berapa yang Anda Buang Tiap Tender yang Gagal?</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Banyak BUJK hitung biaya tender hanya dari cetak dokumen. Padahal ada yang jauh lebih besar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <Clock className="h-5 w-5 text-red-400" />, label: "Waktu Tim BD & Estimator", value: "40–120 jam", desc: "Per paket tender, dari scouting hingga submit. Kalau kalah, semuanya hangus." },
              { icon: <DollarSign className="h-5 w-5 text-red-400" />, label: "Biaya Dokumen & Administrasi", value: "Rp 5–50 juta", desc: "Termasuk jaminan penawaran, legalisasi, dan konsultan dokumen per paket besar." },
              { icon: <XCircle className="h-5 w-5 text-red-400" />, label: "Opportunity Cost", value: "Tak terbatas", desc: "Proyek yang bisa Anda menangkan tapi tidak sempat diikuti karena fokus di tender yang salah." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.label}</span></div>
                <div className="text-2xl font-extrabold text-red-300 mb-2">{item.value}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5 text-center">
            <p className="text-indigo-200 font-semibold mb-1">Solusinya bukan ikut lebih banyak tender.</p>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Solusinya adalah ikut tender yang <span className="text-white font-semibold">Win Probability-nya sudah di atas threshold</span> — dan optimasi dokumen sebelum submit. TenderaClaw melakukan itu secara sistematis.</p>
          </div>
        </div>
      </section>

      {/* ── PAIN SECTION ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-2">Masalah yang Anda Hadapi</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Mengapa Win Rate Tender Anda Rendah?</h2>
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

      {/* ── D: DESIRE — Siklus tender ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Siklus Lengkap</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">AI untuk Setiap Tahap Siklus Tender</h2>
          <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-lg mx-auto">5 tahap, 10+ sub-agen spesialis, bekerja paralel untuk analisis paling komprehensif.</p>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["1. Scouting", "2. Eligibility", "3. Win Probability", "4. Dokumen", "5. Kontrak"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">{step}</span>
                {i < 4 && <ArrowRight className="h-3.5 w-3.5 text-gray-300" />}
              </div>
            ))}
          </div>
          <div className="space-y-5">
            {SOLUTIONS.map((sol) => {
              const c = colorStyles[sol.color];
              return (
                <div key={sol.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-solution-${sol.id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${c.icon}`}>{sol.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{sol.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">{sol.desc}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Tools</p>
                      <div className="space-y-2.5">
                        {sol.tools.map((tool, j) => (
                          <div key={j}>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{tool.name}</span>
                            <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Fitur Utama</p>
                      <ul className="space-y-1.5">
                        {sol.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{f}
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

      {/* ── Menurut Data ── */}
      <section className="py-16 px-4 bg-indigo-50 dark:bg-indigo-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Skala Pengadaan Pemerintah Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "Rp1.213 T", label: "Total pagu belanja pengadaan barang/jasa pemerintah 2024", source: "LKPP 2024", icon: <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> },
              { value: "Rp1.043 T", label: "Nilai RUP yang diumumkan di SIRUP (per 1 April 2024)", source: "LKPP / SIRUP 2024", icon: <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> },
              { value: "Rp595 T", label: "Realisasi belanja PBJ s.d. Triwulan III 2024", source: "LKPP 2024", icon: <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-indigo-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* Untuk Siapa */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center mb-2">Untuk Siapa</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Paling Diuntungkan?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Award className="h-5 w-5 text-indigo-500" />, title: "BUJK & Kontraktor", points: ["Tim Business Development", "Estimator & Quantity Surveyor", "Manajer tender & kontrak", "Direktur operasional"] },
              { icon: <DollarSign className="h-5 w-5 text-emerald-500" />, title: "Konsultan Pengadaan", points: ["Konsultan procurement", "Legal advisor kontrak FIDIC", "Konsultan claim & dispute", "QS independen"] },
              { icon: <ClipboardList className="h-5 w-5 text-violet-500" />, title: "Instansi Pemerintah", points: ["PPK & Pokja ULP/UKPBJ", "Inspektorat & audit pengadaan", "Konsultan pendamping tender", "Peneliti kebijakan pengadaan"] },
            ].map((group, i) => (
              <div key={i} className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-700 via-blue-700 to-violet-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Naikkan Win Rate Tender Anda</h2>
          <p className="text-indigo-100 mb-2 leading-relaxed">Kompetitor Anda sudah mulai menggunakan data. Setiap tender yang Anda kalahkan karena "feeling" adalah peluang yang seharusnya bisa Anda menangkan.</p>
          <p className="text-indigo-200 text-sm mb-8">Setup kurang dari 1 jam · Langsung bisa dipakai untuk tender berikutnya</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-indigo-800 hover:bg-indigo-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-indigo-200 mt-5">
            Lihat juga: <Link href="/konstruksi"><span className="underline font-semibold cursor-pointer">AI untuk Konstruksi →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
