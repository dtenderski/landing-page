import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, ArrowRight, MessageCircle, HardHat, Scale, GraduationCap,
  Heart, Building2, Leaf, Sparkles, Zap, XCircle, TrendingUp,
  Clock, Users, ChevronRight,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tahu%20solusi%20AI%20untuk%20industri%20saya";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const VERTICALS = [
  {
    icon: <HardHat className="h-8 w-8 text-amber-600" />,
    color: "amber",
    title: "K3 & Konstruksi",
    slug: "k3",
    tagline: "Pakar Keselamatan Kerja 24/7",
    pain: "Prosedur K3 ada di buku tebal yang tidak pernah dibaca. Insiden terjadi bukan karena tidak ada aturan, tapi karena tidak mudah diakses.",
    solution: "Chatbot AI yang memahami SMK3, CSMS, ISO 45001, SBU/SKK konstruksi — menjawab pertanyaan lapangan, bantu dokumen, pantau kepatuhan secara instan.",
    usecases: [
      "Konsultasi persyaratan SBU & SKK",
      "Panduan CSMS Contractor Safety",
      "Checklist inspeksi K3 digital",
      "Tanya-jawab regulasi PUPR & Kemnaker",
    ],
    tools: ["SBUClaw", "SMK3Claw", "SafiraClaw", "K3ManClaw"],
    stat: "Akses prosedur K3 & regulasi kapan saja, 24/7",
  },
  {
    icon: <Scale className="h-8 w-8 text-violet-600" />,
    color: "violet",
    title: "Hukum & Legal",
    slug: "legal",
    tagline: "Konsultan Hukum Pintu Depan",
    pain: "Pertanyaan hukum dasar dari calon klien menghabiskan waktu yang lebih baik digunakan untuk kasus bernilai tinggi.",
    solution: "Chatbot AI untuk firma hukum dan konsultan legal — pra-screening klien, ringkasan regulasi, dan draft awal dokumen sebelum pertemuan pertama.",
    usecases: [
      "Pra-konsultasi klien otomatis 24/7",
      "Ringkasan peraturan & putusan terbaru",
      "Draft awal kontrak & MoU",
      "FAQ regulasi bisnis & perizinan",
    ],
    tools: ["LexCom Legal AI", "OSSClaw", "KontrakClaw", "KorporasiClaw"],
    stat: "Pra-screening klien otomatis sebelum pertemuan pertama",
  },
  {
    icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
    color: "blue",
    title: "Pendidikan & Pelatihan",
    slug: "edukasi",
    tagline: "Tutor AI yang Tidak Pernah Lelah",
    pain: "Peserta hanya bisa bertanya saat sesi berlangsung. Di luar itu, mereka bingung sendiri dan kemajuan belajar stagnan.",
    solution: "Chatbot AI tutor 24/7 untuk lembaga pendidikan dan trainer — menjawab pertanyaan, memberikan latihan soal, dan memantau kemajuan antar sesi.",
    usecases: [
      "Tutor materi kursus kapanpun",
      "Generator soal latihan otomatis",
      "Panduan sertifikasi kompetensi",
      "Onboarding peserta pelatihan batch baru",
    ],
    tools: ["EducounselClaw", "IBTUClaw", "ETLOAcademyClaw", "TutorTeknikClaw"],
    stat: "Tutor & latihan soal tersedia di luar jam sesi",
  },
  {
    icon: <Heart className="h-8 w-8 text-rose-600" />,
    color: "rose",
    title: "Kesehatan & Klinik",
    slug: "kesehatan",
    tagline: "Asisten Administratif Klinik",
    pain: "Staf klinik menghabiskan waktu menjawab pertanyaan jadwal, tarif, dan prosedur yang sama berulang-ulang — setiap hari.",
    solution: "Chatbot AI yang menangani pertanyaan administratif pasien, jadwal konsultasi, dan edukasi kesehatan preventif — membebaskan staf untuk pelayanan medis yang bermakna.",
    usecases: [
      "FAQ layanan, tarif & jadwal klinik",
      "Edukasi kesehatan preventif pasien",
      "Pre-screening keluhan pasien",
      "Pengingat obat & follow-up pasca konsultasi",
    ],
    tools: ["Gustafta Builder", "HACCPClaw", "Custom AI"],
    stat: "Tangani FAQ administratif pasien tanpa antre",
  },
  {
    icon: <Building2 className="h-8 w-8 text-sky-600" />,
    color: "sky",
    title: "Properti & Real Estate",
    slug: "properti",
    tagline: "Agen Properti Digital",
    pain: "Agen properti kehilangan prospek karena tidak bisa respond cepat di luar jam kerja atau sedang showroom unit lain.",
    solution: "Chatbot AI yang melakukan pra-kualifikasi calon pembeli, memberikan info unit dan harga, serta simulasi KPR — setiap saat, tanpa henti.",
    usecases: [
      "Pra-kualifikasi calon pembeli otomatis",
      "Info unit, harga & ketersediaan real-time",
      "Simulasi KPR & cicilan",
      "Follow-up prospek 24/7 tanpa miss",
    ],
    tools: ["DevPropertiClaw", "EstateCareClaw", "KorporasiClaw"],
    stat: "Respon & kualifikasi prospek 24/7 tanpa miss",
  },
  {
    icon: <Leaf className="h-8 w-8 text-emerald-600" />,
    color: "emerald",
    title: "ESG & Keberlanjutan",
    slug: "esg",
    tagline: "Panduan Keberlanjutan Bisnis",
    pain: "Pelaporan ESG membutuhkan pemahaman mendalam regulasi KLHK, GRI, TCFD, dan PROPER — yang berubah setiap tahun.",
    solution: "Chatbot AI yang memandu tim Anda melalui pelaporan ESG, compliance lingkungan, dan edukasi karyawan — sesuai standar terbaru.",
    usecases: [
      "Panduan PROPER & ISO 14001 terbaru",
      "Kalkulator estimasi emisi karbon",
      "Laporan ESG terstruktur otomatis",
      "Edukasi karyawan tentang lingkungan",
    ],
    tools: ["ESGClaw", "LingkunganClaw", "ISOClaw 14001", "TataLingkunganClaw"],
    stat: "Panduan PROPER, ISO 14001 & GRI sesuai standar terbaru",
  },
];

const colorMap: Record<string, { bg: string; border: string; stat: string; badge: string }> = {
  amber:   { bg: "bg-amber-50 dark:bg-amber-900/10",   border: "border-amber-200 dark:border-amber-800",   stat: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",   badge: "bg-amber-100 text-amber-700" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", stat: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300", badge: "bg-violet-100 text-violet-700" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-900/10",     border: "border-blue-200 dark:border-blue-800",     stat: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",     badge: "bg-blue-100 text-blue-700" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-900/10",     border: "border-rose-200 dark:border-rose-800",     stat: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",     badge: "bg-rose-100 text-rose-700" },
  sky:     { bg: "bg-sky-50 dark:bg-sky-900/10",       border: "border-sky-200 dark:border-sky-800",       stat: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",       badge: "bg-sky-100 text-sky-700" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10",border:"border-emerald-200 dark:border-emerald-800",stat:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",badge:"bg-emerald-100 text-emerald-700"},
};

export default function IndustriPage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-industri">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI Chatbot Spesifik Industri
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            ChatGPT Tidak Tahu Apa Itu SBU,<br />
            <span className="text-sky-300">CSMS, atau ISO 37001. Kami Tahu.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            Chatbot generik hanya bisa menjawab pertanyaan umum. Gustafta menyediakan konfigurasi AI
            yang memahami regulasi, standar teknis, dan tantangan spesifik di industri Anda —
            bukan chatbot yang perlu Anda "ajar" setiap kali.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8 text-white">
            {[["6", "Sektor Industri"], ["80+", "AI Tools Spesialis"], ["900+", "Agen AI Spesialis"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold">{num}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={builderUrl}>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold gap-2 px-8 h-12" data-testid="btn-hero-mulai">
                <Zap className="h-5 w-5" /> Mulai Gratis
              </Button>
            </Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
                <MessageCircle className="h-4 w-4" /> Konsultasi Gratis
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — AI generik vs spesifik ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">Mengapa Bukan ChatGPT Biasa?</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">AI Generik vs AI Industri-Spesifik</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Bedanya bukan di teknologinya — tapi di pengetahuan yang tertanam di dalamnya.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-red-300">AI Generik (ChatGPT biasa)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Tidak tahu regulasi spesifik Indonesia (Perpres, Permen PUPR, dll)",
                  "Jawaban umum — tidak bisa memandu proses SBU/SKK/OSS secara spesifik",
                  "Perlu 'diajari' konteks setiap sesi baru mulai dari nol",
                  "Tidak ada sub-agen spesialis — satu model untuk semua topik",
                  "Tidak bisa di-embed di website/sistem Anda sendiri",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-200">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-emerald-300">Gustafta AI Industri-Spesifik</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Ditraining dengan regulasi Indonesia: SNI, SKKNI, Permen PUPR, UU Ketenagakerjaan",
                  "Memandu proses spesifik step-by-step sesuai regulasi terbaru",
                  "Knowledge base permanen — tidak perlu diulang setiap sesi",
                  "5–12 sub-agen spesialis bekerja paralel untuk analisis mendalam",
                  "Bisa di-embed di website, WhatsApp, atau sistem existing Anda",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-200">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — 6 Verticals dengan pain → solution ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-2">Pilih Industri Anda</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
            Solusi AI untuk 6 Sektor Utama
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Setiap sektor sudah dikonfigurasi dengan knowledge base regulasi, use case nyata, dan sub-agen spesialis yang relevan.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {VERTICALS.map((v, i) => {
              const c = colorMap[v.color];
              return (
                <div key={i} className={`rounded-2xl border ${c.bg} ${c.border} p-6`} data-testid={`card-industri-${v.slug}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-white dark:bg-background rounded-xl shadow-sm flex-shrink-0">{v.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{v.title}</h3>
                      <p className="text-xs font-semibold text-gray-500">{v.tagline}</p>
                    </div>
                  </div>

                  {/* Pain → Solution */}
                  <div className="mb-4 space-y-2">
                    <div className="bg-white/60 dark:bg-background/40 rounded-lg px-4 py-2.5">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-bold text-red-500">Masalah:</span> {v.pain}
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-background/40 rounded-lg px-4 py-2.5">
                      <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">
                        <span className="font-bold text-green-600">Solusi:</span> {v.solution}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {v.usecases.map((uc, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{uc}
                      </li>
                    ))}
                  </ul>

                  {/* Stat */}
                  <div className={`rounded-lg px-3 py-2 text-xs font-semibold mb-4 flex items-center gap-2 ${c.stat}`}>
                    <TrendingUp className="h-3.5 w-3.5" />{v.stat}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {v.tools.map((tool, j) => (
                      <span key={j} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{tool}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Cara kerja ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">Cara Kerja</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Dari Nol ke Chatbot Aktif dalam 3 Langkah</h2>
          <p className="text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Tidak perlu tim IT. Tidak perlu coding. Tidak perlu pengalaman AI sebelumnya.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Pilih Template Industri", desc: "Pilih dari 80+ template AI yang sudah dikonfigurasi untuk industri Anda — tinggal pakai, tidak perlu mulai dari nol.", time: "~5 menit" },
              { step: "2", title: "Sesuaikan & Upload KB", desc: "Tambahkan nama, logo, dan knowledge base spesifik perusahaan Anda. Drag & drop, tidak perlu coding.", time: "~30 menit" },
              { step: "3", title: "Deploy & Integrasikan", desc: "Embed di website, bagikan link langsung, atau integrasikan via API ke sistem yang sudah ada.", time: "~15 menit" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 font-extrabold text-xl flex items-center justify-center mx-auto mb-3">{s.step}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed mb-2">{s.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs text-sky-600 font-semibold">
                  <Clock className="h-3 w-3" />{s.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-800 to-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Siap Bangun Chatbot untuk Industri Anda?</h2>
          <p className="text-gray-300 mb-2 leading-relaxed">
            Mulai gratis dengan template industri Anda — atau konsultasi langsung untuk solusi custom.
          </p>
          <p className="text-gray-400 text-sm mb-8">Setup kurang dari 1 jam · Tidak perlu tim IT · Support via WhatsApp</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Diskusi via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/starter-kit"><span className="hover:text-white cursor-pointer">Starter Kit</span></Link>
          <Link href="/trilogi"><span className="hover:text-white cursor-pointer">Trilogi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
