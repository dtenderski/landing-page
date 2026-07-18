import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Scale, Shield,
  FileText, AlertTriangle, Users, Gavel,
  Building2, ShieldCheck, Clock, TrendingUp, XCircle, DollarSign,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20konsultan%20hukum";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const TOOLS = [
  {
    id: "kontrak", color: "red",
    icon: <FileText className="h-6 w-6 text-red-600" />,
    name: "KontrakClaw", sub: "Manajemen Kontrak & Klaim — 7 sub-agen",
    title: "Hukum Kontrak & Klaim",
    desc: "AI spesialis hukum kontrak komersial, konstruksi, dan pengadaan — dari review kontrak, identifikasi risiko, hingga strategi klaim dan penyelesaian sengketa.",
    features: ["Review klausul kontrak FIDIC, Perpres, & komersial", "Identifikasi klausul berisiko sebelum penandatanganan", "Panduan klaim Extension of Time (EoT) & variasi", "Strategi sengketa: DAB, arbitrase, & litigasi", "Template surat teguran, notice, & somasi"],
  },
  {
    id: "korporasi", color: "indigo",
    icon: <Building2 className="h-6 w-6 text-indigo-600" />,
    name: "KorporasiClaw", sub: "AI Konsultan Korporasi & Bisnis — 8 sub-agen",
    title: "Hukum Korporasi & Bisnis",
    desc: "Aspek hukum korporasi dari pendirian badan usaha, perubahan anggaran dasar, hingga compliance regulasi bisnis Indonesia.",
    features: ["Panduan pendirian PT, CV, Firma, & Koperasi", "Persyaratan hukum merger, akuisisi, & konsolidasi", "Compliance UU PT, UU Cipta Kerja, & peraturan OJK", "Panduan RUPS, perubahan direksi, & pemindahan saham", "Review dokumen korporasi & due diligence checklist"],
  },
  {
    id: "smap", color: "teal",
    icon: <ShieldCheck className="h-6 w-6 text-teal-600" />,
    name: "SMAPClaw + PancekClaw", sub: "ISO 37001 Anti-Penyuapan & KPK — 8+5 sub-agen",
    title: "Hukum Anti-Korupsi & Compliance",
    desc: "Panduan implementasi SMAP ISO 37001, kepatuhan regulasi anti-korupsi KPK, dan compliance gratifikasi untuk korporasi dan BUMN.",
    features: ["Gap analysis implementasi ISO 37001:2016", "Panduan kebijakan anti-penyuapan & anti-gratifikasi", "Pelaporan gratifikasi ke KPK & prosedur review", "Due diligence mitra bisnis untuk risiko korupsi", "Pelatihan awareness anti-korupsi berbasis AI"],
  },
  {
    id: "pengadaan", color: "emerald",
    icon: <Gavel className="h-6 w-6 text-emerald-600" />,
    name: "TenderaClaw + KontrakClaw", sub: "Hukum Pengadaan Pemerintah",
    title: "Hukum Pengadaan & Regulasi",
    desc: "Interpretasi regulasi pengadaan pemerintah, hak & kewajiban peserta tender, dan penyelesaian sengketa pengadaan.",
    features: ["Interpretasi Perpres 46/2025 (Pengadaan Barang/Jasa Pemerintah)", "Hak peserta tender & mekanisme sanggah", "Panduan blacklist & cara mengajukan keberatan", "Hukum kontrak pengadaan pemerintah (SSKK/SSUK)", "Panduan audit BPK atas kontrak pengadaan"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  red:    { bg: "bg-red-50 dark:bg-red-900/10",       border: "border-red-200 dark:border-red-800",       icon: "bg-red-100 dark:bg-red-900/30",       tag: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800", icon: "bg-indigo-100 dark:bg-indigo-900/30", tag: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  teal:   { bg: "bg-teal-50 dark:bg-teal-900/10",     border: "border-teal-200 dark:border-teal-800",     icon: "bg-teal-100 dark:bg-teal-900/30",     tag: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-900/10",border:"border-emerald-200 dark:border-emerald-800",icon:"bg-emerald-100 dark:bg-emerald-900/30", tag:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_HUKUM = [
  {
    icon: Gavel,
    value: "£27 Juta+",
    label: "Rata-rata nilai sengketa konstruksi global kini melampaui £27 juta, dengan durasi penyelesaian ~14,4 bulan — risiko kontrak yang mahal.",
    source: "Arcadis, Global Construction Disputes Report 2024",
  },
  {
    icon: DollarSign,
    value: "9,2%",
    label: "Organisasi rata-rata kehilangan ~9,2% pendapatan tahunan akibat manajemen kontrak yang buruk: tenggat terlewat, klausul terabaikan, perpanjangan merugikan.",
    source: "World Commerce & Contracting",
  },
  {
    icon: ShieldCheck,
    value: "37/100",
    label: "Skor Indeks Persepsi Korupsi Indonesia 2024 (peringkat 99 dari 180) — compliance anti-suap (ISO 37001) makin krusial bagi korporasi & BUMN.",
    source: "Transparency International, CPI 2024",
  },
];

export default function KonsultanHukumPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-hukum">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Scale className="h-3.5 w-3.5" />
                AI untuk Konsultan Hukum & Law Firm Indonesia
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Pertanyaan Hukum Dasar<br />
                <span className="text-slate-300">Menghabiskan 2 Jam Sehari dari Pekerjaan yang Bernilai Jutaan</span>
              </h1>
              <p className="text-base text-slate-300 mb-4 leading-relaxed">
                Firma hukum dan konsultan legal Indonesia menghabiskan terlalu banyak waktu
                untuk pertanyaan rutin yang bisa dijawab AI — sementara kasus strategis
                bernilai tinggi tertunda.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-slate-200">
                AI hukum Gustafta memahami <span className="font-bold text-white">regulasi Indonesia</span> — bukan sekadar search engine. Riset yang dulu butuh jam, kini menit.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "4+", label: "AI Tools Hukum", sub: "Kontrak, Korporasi, Anti-Korupsi" },
                { num: "7+", label: "Sub-Agen per Claw", sub: "Analisis hukum paralel" },
                { num: "FIDIC", label: "Standar Kontrak", sub: "Perpres, FIDIC, ICC, UNCITRAL" },
                { num: "24/7", label: "Asisten Riset Hukum", sub: "Tidak perlu tunggu paralegal" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Realita beban kerja hukum ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Realita Kerja Konsultan Hukum</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Waktu Anda Terlalu Mahal untuk Ini</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6">
              <h3 className="font-bold text-red-300 mb-4 flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Tanpa AI Hukum
              </h3>
              <ul className="space-y-3">
                {[
                  "2–4 jam/hari untuk riset regulasi dasar yang berulang",
                  "Paralegal menghabiskan waktu untuk FAQ yang sama dari calon klien",
                  "Review kontrak manual — klausul berisiko sering terlewat",
                  "Update regulasi (PMK, SE, Permen) sering terlambat diketahui",
                  "Kapasitas terbatas: hanya bisa handle N klien per bulan",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-200">
                    <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-6">
              <h3 className="font-bold text-emerald-300 mb-4 flex items-center gap-2">
                <Check className="h-4 w-4" /> Dengan AI Hukum Gustafta
              </h3>
              <ul className="space-y-3">
                {[
                  "Riset regulasi Indonesia diselesaikan dalam menit, bukan jam",
                  "Pre-screening calon klien otomatis 24/7 — Anda terima klien yang sudah siap",
                  "Review kontrak sistematis dengan AI — identifikasi risiko sebelum tanda tangan",
                  "Knowledge base regulasi selalu update: UU, PP, Permen, SE terbaru",
                  "Handle 2–3× lebih banyak klien tanpa tambah paralegal",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-200">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <p className="text-white font-semibold mb-1">AI tidak menggantikan advokat. AI menggantikan pekerjaan paralegal berulang yang menguras waktu Anda.</p>
            <p className="text-gray-400 text-sm">Sehingga Anda bisa fokus pada pekerjaan yang benar-benar membutuhkan keahlian hukum strategis Anda.</p>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — 4 Area tools ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">Solusi AI Hukum</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">4 Area Hukum yang Didukung</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Setiap area memiliki sub-agen spesialis yang bekerja paralel — bukan satu model generik untuk semua pertanyaan hukum.</p>
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
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{tool.desc}</p>
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

      {/* Untuk siapa + Riset */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Untuk Siapa</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Siapa yang Paling Diuntungkan?</h2>
              <div className="space-y-4">
                {[
                  { icon: <Scale className="h-5 w-5 text-slate-600" />, title: "Law Firm & Advokat", points: ["Riset hukum lebih cepat & mendalam", "Review kontrak klien korporasi", "Paralegal assistant 24/7"] },
                  { icon: <Building2 className="h-5 w-5 text-indigo-500" />, title: "Legal In-House Korporasi", points: ["Tim legal perusahaan & BUMN", "Compliance officer & GRC", "Anti-corruption compliance team"] },
                  { icon: <Gavel className="h-5 w-5 text-emerald-500" />, title: "Konsultan & Akademisi", points: ["Konsultan hukum bisnis independen", "Dosen & peneliti hukum", "Mediator & arbiter komersial"] },
                ].map((group, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/10 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {group.points.map((pt, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Menurut Data</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Kenapa Ini Penting</h2>
              <div className="space-y-4">
                {STATS_HUKUM.map((s, i) => {
                  const SIcon = s.icon;
                  return (
                    <div key={i} className="bg-slate-50 dark:bg-muted/20 rounded-xl p-4 border border-slate-100 dark:border-border" data-testid={`stat-hukum-${i}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <SIcon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
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
      <section className="py-16 px-4 bg-slate-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Scale className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Riset Hukum yang Dulu Butuh Jam, Kini Menit</h2>
          <p className="text-slate-300 mb-2">AI hukum yang memahami regulasi Indonesia — bukan sekadar search engine.</p>
          <p className="text-slate-400 text-sm mb-8">Pre-screening klien 24/7 · Review kontrak sistematis · Knowledge base selalu update</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-5">
            Lihat juga:{" "}
            <Link href="/konsultan-pajak"><span className="underline font-semibold cursor-pointer">Konsultan Pajak →</span></Link>
            {" · "}
            <Link href="/konsultan-keuangan"><span className="underline font-semibold cursor-pointer">Konsultan Keuangan →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-pajak"><span className="hover:text-white cursor-pointer">Konsultan Pajak</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
