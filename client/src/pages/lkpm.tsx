import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Building2, FileText,
  Globe, ShieldCheck, AlertTriangle, CalendarCheck,
  BarChart3, Zap, TrendingUp,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20OSS%2C%20NIB%2C%20dan%20LKPM";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const PAIN_POINTS = [
  {
    icon: <Globe className="h-5 w-5 text-red-500" />,
    title: "OSS-RBA Membingungkan",
    desc: "Sistem OSS terus berubah — KBLI, persyaratan berbasis risiko, dan perizinan berusaha yang berbeda per sektor membuat pengusaha bingung harus mulai dari mana.",
  },
  {
    icon: <FileText className="h-5 w-5 text-red-500" />,
    title: "LKPM Sering Terlambat atau Salah",
    desc: "Laporan Kegiatan Penanaman Modal (LKPM) wajib dilaporkan setiap triwulan. Banyak pelaku usaha terlambat atau salah mengisi karena tidak memahami format dan kewajiban per kategori investasi.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    title: "Risiko Sanksi & Pencabutan Izin",
    desc: "Tidak lapor LKPM atau terlambat berisiko sanksi dari BKPM. Pelaku usaha sering tidak tahu bahwa kewajiban pelaporan sudah dimulai sejak terbit NIB.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-red-500" />,
    title: "Perubahan Regulasi Tidak Terpantau",
    desc: "UU Cipta Kerja dan turunannya terus diperbarui. Persyaratan KBLI, tingkat risiko, dan dokumen perizinan berubah tanpa pemberitahuan yang memadai ke pelaku usaha.",
  },
];

const TOOLS = [
  {
    id: "oss",
    color: "emerald",
    icon: <Globe className="h-6 w-6 text-emerald-600" />,
    name: "OSSClaw",
    title: "OSS-RBA, NIB & Perizinan Berusaha",
    desc: "Orchestrator 8 sub-agen konsultan OSS Indonesia — panduan lengkap dari permohonan NIB, perizinan berbasis risiko, hingga penerbitan izin usaha per sektor.",
    agents: [
      "NIB-GUIDE: Panduan permohonan Nomor Induk Berusaha per bentuk usaha",
      "KBLI-ADVISOR: Identifikasi KBLI yang tepat untuk kegiatan usaha Anda",
      "RISK-CHECKER: Cek tingkat risiko (rendah/menengah/tinggi/sangat tinggi) per KBLI",
      "IZIN-TRACKER: Persyaratan perizinan berusaha per risiko & sektor",
      "COMPLIANCE: Panduan pemenuhan standar & kewajiban pasca NIB terbit",
      "UPDATE-RADAR: Perubahan regulasi OSS & KBLI terbaru",
    ],
    usecases: [
      "Panduan permohonan NIB baru per jenis badan usaha",
      "Identifikasi KBLI yang tepat untuk kegiatan bisnis Anda",
      "Checklist persyaratan izin usaha berbasis risiko",
      "Panduan pengurusan Sertifikat Standar & Izin",
      "Troubleshoot masalah di sistem OSS-RBA",
    ],
  },
  {
    id: "lkpm",
    color: "blue",
    icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
    name: "LKPMClaw",
    title: "LKPM & Pelaporan Penanaman Modal",
    desc: "Orchestrator 7 sub-agen konsultan LKPM BKPM — panduan pelaporan investasi triwulan, koreksi data, dan compliance dengan ketentuan BKPM/BKPMD.",
    agents: [
      "LKPM-KEWAJIBAN: Siapa wajib lapor, kapan, dan melalui sistem apa",
      "LKPM-FORMAT: Format laporan per kategori investasi & periode",
      "LKPM-DATA: Panduan pengisian realisasi investasi, tenaga kerja, produksi",
      "LKPM-SUBMIT: Prosedur submit melalui OSS dan konfirmasi penerimaan",
      "LKPM-KOREKSI: Panduan koreksi dan revisi laporan yang sudah disubmit",
      "LKPM-SANKSI: Ketentuan sanksi & prosedur pemulihan status",
    ],
    usecases: [
      "Panduan pengisian LKPM triwulan step-by-step",
      "Checklist data yang harus disiapkan sebelum lapor",
      "Interpretasi kewajiban LKPM per kategori PMDN/PMA",
      "Panduan koreksi LKPM yang salah atau terlambat",
      "Pemahaman ketentuan sanksi dan cara menghindarinya",
    ],
  },
  {
    id: "korporasi",
    color: "indigo",
    icon: <Building2 className="h-6 w-6 text-indigo-600" />,
    name: "KorporasiClaw",
    title: "Aspek Korporasi & Perubahan Usaha",
    desc: "AI konsultan korporasi & bisnis untuk aspek legalitas perusahaan yang berkaitan dengan perizinan dan pelaporan investasi.",
    agents: [
      "Panduan perubahan data badan usaha di OSS (alamat, pengurus, dll)",
      "Aspek hukum peningkatan modal & penambahan KBLI",
      "Ketentuan PMDN vs PMA dalam pelaporan LKPM",
      "Kewajiban laporan untuk perusahaan joint venture",
    ],
    usecases: [
      "Panduan pembaruan data perusahaan di sistem OSS",
      "Perubahan kegiatan usaha & penambahan KBLI baru",
      "Kewajiban khusus untuk PMA dalam LKPM",
      "Merger & akuisisi: implikasi terhadap NIB & LKPM",
    ],
  },
  {
    id: "esimpan",
    color: "teal",
    icon: <FileText className="h-6 w-6 text-teal-600" />,
    name: "ESIMPANClaw (untuk BUJK)",
    title: "E-SIMPAN & Sinkronisasi Data BUJK",
    desc: "Khusus untuk BUJK — panduan sinkronisasi data antara OSS, E-SIMPAN LPJK, dan SIKI untuk memastikan konsistensi data perizinan dan sertifikasi.",
    agents: [
      "Sinkronisasi NIB-OSS dengan data di E-SIMPAN LPJK",
      "Panduan update data perusahaan pasca perubahan akta",
      "Verifikasi konsistensi data BUJK di berbagai sistem",
      "Troubleshoot ketidaksesuaian data antar platform",
    ],
    usecases: [
      "Sinkronisasi data badan usaha antara OSS dan E-SIMPAN",
      "Panduan update NIB setelah perubahan akta perusahaan",
      "Verifikasi data BUJK yang digunakan untuk SBU & LKUT",
      "Troubleshoot error dan ketidaksesuaian data sistem",
    ],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/30", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", icon: "bg-blue-100 dark:bg-blue-900/30", tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800", icon: "bg-indigo-100 dark:bg-indigo-900/30", tag: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  teal: { bg: "bg-teal-50 dark:bg-teal-900/10", border: "border-teal-200 dark:border-teal-800", icon: "bg-teal-100 dark:bg-teal-900/30", tag: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
};

export default function LkpmPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-lkpm">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Globe className="h-3.5 w-3.5" />
                AI untuk OSS-RBA, NIB, dan Pelaporan LKPM
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Izin Usaha Beres,<br />
                <span className="text-emerald-200">LKPM Tepat Waktu</span>
              </h1>
              <p className="text-base md:text-lg text-emerald-100 mb-8 leading-relaxed">
                OSS-RBA, NIB, perizinan berbasis risiko, hingga laporan LKPM ke BKPM —
                AI Gustafta memandu seluruh proses perizinan dan pelaporan investasi
                agar bisnis Anda tetap compliant tanpa harus menjadi ahli hukum.
              </p>
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
                { num: "8+", label: "Sub-Agen OSSClaw", sub: "NIB, KBLI, Risiko, Izin" },
                { num: "7", label: "Sub-Agen LKPMClaw", sub: "Format, data, submit, koreksi" },
                { num: "Triwulan", label: "Frekuensi LKPM", sub: "Jan·Apr·Jul·Okt deadline" },
                { num: "0", label: "Risiko Sanksi BKPM", sub: "Panduan lengkap kepatuhan" },
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

      {/* ── INFO OSS & LKPM ── */}
      <section className="py-14 px-4 bg-emerald-50 dark:bg-emerald-900/10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-card rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-600" /> Apa itu OSS-RBA?
            </h3>
            <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mb-3">
              <strong>Online Single Submission Risk Based Approach (OSS-RBA)</strong> adalah sistem perizinan berusaha
              terintegrasi berbasis risiko yang dikelola BKPM. Semua izin usaha di Indonesia diproses melalui OSS —
              mulai dari NIB, Sertifikat Standar, hingga Izin per sektor.
            </p>
            <div className="space-y-2">
              {[
                { label: "Dasar Hukum", val: "PP 5/2021, UU 11/2020 Cipta Kerja" },
                { label: "Portal", val: "oss.go.id (dikelola BKPM/BKPMD)" },
                { label: "Penting", val: "NIB wajib untuk semua pelaku usaha" },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">{item.label}:</span>
                  <span className="text-gray-600 dark:text-muted-foreground">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl border border-blue-200 dark:border-blue-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Apa itu LKPM?
            </h3>
            <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mb-3">
              <strong>Laporan Kegiatan Penanaman Modal (LKPM)</strong> adalah laporan berkala yang wajib
              disampaikan setiap pelaku usaha yang memiliki NIB kepada BKPM/BKPMD, berisi realisasi
              investasi dan informasi ketenagakerjaan setiap triwulan.
            </p>
            <div className="space-y-2">
              {[
                { label: "Frekuensi", val: "Triwulan: 31 Jan · 30 Apr · 31 Jul · 31 Okt" },
                { label: "Dasar Hukum", val: "Perka BKPM No. 5/2021, PP 5/2021" },
                { label: "Sanksi", val: "Peringatan → Pembekuan → Pencabutan izin" },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="font-bold text-blue-700 dark:text-blue-400 flex-shrink-0">{item.label}:</span>
                  <span className="text-gray-600 dark:text-muted-foreground">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-2">Tantangan Umum</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Mengapa OSS & LKPM Sering Bermasalah?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 dark:bg-muted/20 rounded-2xl p-5 border border-gray-100 dark:border-border">
                <div className="p-2.5 bg-white dark:bg-background rounded-xl border border-gray-100 dark:border-border flex-shrink-0">{p.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">Solusi Gustafta</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">4 AI Tools untuk OSS & LKPM</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {TOOLS.map((tool) => {
              const c = colorStyles[tool.color];
              return (
                <div key={tool.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-tool-${tool.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{tool.icon}</div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{tool.name}</span>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mt-1">{tool.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{tool.desc}</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Kemampuan AI</p>
                      <ul className="space-y-1">
                        {tool.agents.map((a, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-muted-foreground">
                            <Zap className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Use Cases</p>
                      <ul className="space-y-1">
                        {tool.usecases.map((uc, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
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

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">Untuk Siapa</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Wajib Paham OSS & LKPM?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Building2 className="h-5 w-5 text-emerald-500" />, title: "Pelaku Usaha", points: ["Startup & UKM baru daftar NIB", "Perusahaan wajib lapor LKPM", "BUJK & kontraktor semua kualifikasi", "Perusahaan PMA yang beroperasi di Indonesia"] },
              { icon: <FileText className="h-5 w-5 text-blue-500" />, title: "Staf Legal & Compliance", points: ["Legal officer perusahaan", "Staf perizinan & BKPM", "Konsultan perizinan bisnis", "Notaris & PPAT untuk aspek OSS"] },
              { icon: <TrendingUp className="h-5 w-5 text-indigo-500" />, title: "Konsultan & Advokat", points: ["Konsultan investasi & BKPM", "Law firm yang tangani perizinan", "Konsultan manajemen bisnis", "Accountant & pajak (aspek modal)"] },
            ].map((group, i) => (
              <div key={i} className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
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
      <section className="py-16 px-4 bg-emerald-50 dark:bg-emerald-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Skala Penanaman Modal di Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "Rp1.714,2 T", label: "Realisasi investasi nasional sepanjang 2024 (tumbuh 20,8% YoY)", source: "Kementerian Investasi/BKPM 2024", icon: <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
              { value: "103,9%", label: "Capaian realisasi terhadap target pemerintah Rp1.650 triliun", source: "Kementerian Investasi/BKPM 2024", icon: <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
              { value: "2,46 juta", label: "Tenaga kerja yang terserap dari realisasi investasi 2024", source: "Kementerian Investasi/BKPM 2024", icon: <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-emerald-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Bisnis yang Compliant adalah Bisnis yang Aman Tumbuh</h2>
          <p className="text-emerald-100 mb-8 leading-relaxed">
            Jangan biarkan kerumitan OSS dan LKPM menghambat bisnis Anda. AI Gustafta siap memandu.
          </p>
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
            <Link href="/lkut"><span className="underline font-semibold cursor-pointer">LKUT BUJK →</span></Link>
            {" · "}
            <Link href="/konstruksi"><span className="underline font-semibold cursor-pointer">AI Konstruksi →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/lkut"><span className="hover:text-white cursor-pointer">LKUT BUJK</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
