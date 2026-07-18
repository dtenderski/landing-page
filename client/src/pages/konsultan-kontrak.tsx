import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, FileText, Scale,
  AlertTriangle, Gavel, Shield, ClipboardList,
  TrendingUp, Building2, XCircle, DollarSign, Clock,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20Konsultan%20Kontrak%20Proyek";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const SUB_AGENTS = [
  { role: "CONTRACT-REVIEWER", color: "red", desc: "Analisis klausul kontrak FIDIC, Perpres 46/2025, & kontrak komersial — identifikasi risiko tersembunyi sebelum penandatanganan" },
  { role: "CLAIM-STRATEGIST", color: "orange", desc: "Panduan klaim Extension of Time (EoT), Additional Payment, & Variation Order — dari dasar hukum hingga kalkulasi nilai klaim" },
  { role: "DISPUTE-RESOLVER", color: "rose", desc: "Strategi penyelesaian sengketa: negosiasi, mediasi, DAB/DRBF, arbitrase BANI/ICC, & litigasi — analisis probabilitas keberhasilan" },
  { role: "NOTICE-DRAFTER", color: "amber", desc: "Template & panduan penulisan notice: surat teguran, warning letter, notice of delay, force majeure declaration, & termination notice" },
  { role: "VARIATION-MANAGER", color: "blue", desc: "Panduan pengelolaan Variation Order: identifikasi, valuasi, negosiasi, & dokumentasi perubahan lingkup kerja" },
  { role: "RISK-ALLOCATOR", color: "violet", desc: "Analisis alokasi risiko kontrak — identifikasi klausul yang unfair dan strategi negosiasi ulang sebelum proyek berjalan" },
  { role: "FINAL-ACCOUNT", color: "emerald", desc: "Panduan penyusunan Final Account proyek: rekonsiliasi klaim, VO, eskalasi harga, dan penutupan kontrak" },
];

const agentColors: Record<string, string> = {
  red:    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  rose:   "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  amber:  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  blue:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  emerald:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};

const CONTRACT_TYPES = [
  { type: "FIDIC", variants: ["Red Book (Konstruksi)", "Yellow Book (Rancang Bangun)", "Silver Book (EPC/Turnkey)", "Gold Book (DBO)"] },
  { type: "Perpres 46/2025", variants: ["SSKK & SSUK pengadaan pemerintah", "Kontrak Lump Sum & Harga Satuan", "Kontrak Payung & Multi-Years", "Kontrak Terima Jadi (Turnkey)"] },
  { type: "Komersial & B2B", variants: ["Kontrak konstruksi swasta", "Perjanjian subkontraktor", "Kontrak sewa alat & material", "MOU & perjanjian KSO/JV"] },
];

// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_KONTRAK = [
  {
    icon: Gavel,
    value: "£27 Juta+",
    label: "Rata-rata nilai sengketa konstruksi global kini melampaui £27 juta, dengan durasi penyelesaian ~14,4 bulan.",
    source: "Arcadis, Global Construction Disputes Report 2024",
  },
  {
    icon: DollarSign,
    value: "9,2%",
    label: "Organisasi rata-rata kehilangan ~9,2% pendapatan tahunan akibat manajemen kontrak yang buruk: tenggat terlewat, klausul terabaikan, perpanjangan merugikan.",
    source: "World Commerce & Contracting",
  },
  {
    icon: TrendingUp,
    value: "80%",
    label: "Proyek besar lintas sektor biasanya selesai 20% lebih lama dari jadwal dan membengkak hingga 80% di atas anggaran — pemicu utama klaim & sengketa.",
    source: "McKinsey Global Institute, Reinventing Construction 2017",
  },
];

export default function KonsultanKontrakPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-kontrak">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-rose-700 to-orange-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <FileText className="h-3.5 w-3.5" />
                KontrakClaw — AI Konsultan Manajemen Kontrak & Klaim
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Satu Klausul yang Terlewat<br />
                <span className="text-rose-200">Bisa Menelan Ratusan Juta hingga Miliaran Rupiah</span>
              </h1>
              <p className="text-base text-rose-100 mb-4 leading-relaxed">
                Kontraktor dan konsultan Indonesia merugi bukan karena tidak bekerja keras —
                tapi karena kontrak yang ditandatangani tanpa review mendalam mengandung
                klausul yang merugikan yang baru terasa saat proyek sudah berjalan.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-rose-100">
                <span className="font-bold text-white">KontrakClaw</span> — 7 sub-agen spesialis kontrak konstruksi bekerja paralel. Review lebih teliti dari paralegal manapun, tersedia 24/7.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-red-800 hover:bg-red-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "7", label: "Sub-Agen KontrakClaw", sub: "Review · Klaim · Sengketa · Notice" },
                { num: "FIDIC", label: "Standar Kontrak", sub: "Red/Yellow/Silver/Gold Book" },
                { num: "EoT", label: "Klaim Konstruksi", sub: "Waktu, Biaya, & Variasi" },
                { num: "BANI", label: "Arbitrase", sub: "BANI, ICC, UNCITRAL, SIAC" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-rose-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Biaya sengketa kontrak ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Fakta Sengketa Kontrak Konstruksi</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Mengapa Review Kontrak Sebelum Tanda Tangan Lebih Murah dari Sengketa?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <DollarSign className="h-5 w-5 text-red-400" />, label: "Biaya Arbitrase BANI", value: "Rp 50–500 juta+", desc: "Biaya pendaftaran, honorarium arbiter, dan biaya perkara untuk sengketa kontrak konstruksi menengah ke atas." },
              { icon: <Clock className="h-5 w-5 text-amber-400" />, label: "Durasi Sengketa", value: "6–24 bulan", desc: "Rata-rata proses arbitrase atau litigasi kontrak konstruksi di Indonesia berlangsung lebih dari setahun." },
              { icon: <AlertTriangle className="h-5 w-5 text-red-400" />, label: "Klaim yang Tidak Terdokumentasi", value: "Hangus 100%", desc: "Klaim EoT dan Additional Payment yang tidak didukung dokumentasi dan notice yang tepat sering gugur sepenuhnya." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.label}</span></div>
                <div className="text-2xl font-extrabold text-red-300 mb-2">{item.value}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-5">
              <h3 className="font-bold text-red-300 mb-3 flex items-center gap-2"><XCircle className="h-4 w-4" /> Pola yang Sering Terjadi</h3>
              <ul className="space-y-2">
                {["Tanda tangan kontrak tanpa review mendalam karena 'kejar waktu'", "Klausul force majeure, limitation of liability, & penalty tidak dibaca detail", "Notice tidak dikirim tepat waktu saat event klaim terjadi", "VO tidak terdokumentasi dan tidak ada persetujuan tertulis", "Final Account tidak disiapkan — sengketa muncul di akhir proyek"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-200"><XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5">
              <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2"><Check className="h-4 w-4" /> Dengan KontrakClaw</h3>
              <ul className="space-y-2">
                {["Review klausul berisiko sebelum tanda tangan — dalam jam, bukan hari", "Identifikasi klausul force majeure, penalty, & termination yang merugikan", "Template notice yang tepat waktu dan sesuai persyaratan kontrak", "Panduan VO: valuasi, negosiasi, dan dokumentasi yang sah", "Panduan Final Account: rekonsiliasi klaim, eskalasi, & penutupan"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-emerald-200"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — 7 Sub-Agents ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest text-center mb-2">7 Sub-Agen Spesialis</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">KontrakClaw Bekerja Paralel untuk Anda</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Bukan satu chatbot generik — 7 spesialis kontrak bekerja bersamaan, dari review klausul hingga strategi sengketa.</p>
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

          <p className="text-xs font-bold text-red-600 uppercase tracking-widest text-center mb-2">Jenis Kontrak</p>
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-8">Kontrak yang Dipahami AI</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {CONTRACT_TYPES.map((ct, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-800/30">
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-3">{ct.type}</h3>
                <ul className="space-y-1.5">
                  {ct.variants.map((v, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />{v}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Riset: Menurut Data */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 mb-3">Menurut Data</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mengapa Manajemen Kontrak Itu Mahal Jika Salah</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {STATS_KONTRAK.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-border" data-testid={`stat-kontrak-${i}`}>
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                    <SIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
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
      <section className="py-14 px-4 bg-gradient-to-br from-red-700 via-rose-700 to-orange-700 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Jangan Tanda Tangan Kontrak Tanpa Review AI</h2>
          <p className="text-rose-100 text-sm mb-2">Satu klausul yang terlewat bisa menelan ratusan juta hingga miliaran rupiah. KontrakClaw membaca kontrak Anda lebih teliti dari paralegal manapun.</p>
          <p className="text-rose-200 text-xs mb-8">Review kontrak · Strategi klaim · Panduan sengketa — semua dalam satu platform</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-red-800 hover:bg-red-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-rose-200 mt-4">
            Lihat juga:{" "}
            <Link href="/konsultan-dokumen-proyek"><span className="underline font-semibold cursor-pointer">Dokumen Proyek →</span></Link>
            {" · "}
            <Link href="/brain-project"><span className="underline font-semibold cursor-pointer">Brain Project →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <Link href="/brain-project"><span className="hover:text-white cursor-pointer">Brain Project</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
