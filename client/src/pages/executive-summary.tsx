import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Brain, FileText,
  Layers, Target, BarChart3, Star, Users, Zap,
  GraduationCap, Building2, BookOpen, ClipboardList,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20penyusunan%20executive%20summary";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const USE_CASES = [
  {
    id: "belajar",
    color: "violet",
    icon: <GraduationCap className="h-6 w-6 text-violet-600" />,
    title: "Executive Summary Hasil Belajar",
    audience: "Peserta pelatihan, diklat, workshop, & sertifikasi",
    desc: "Rangkuman hasil belajar yang terstruktur, ringkas, dan komunikatif untuk dilaporkan kepada atasan, sponsor, atau institusi.",
    outputs: [
      "Ringkasan materi kunci yang dipelajari per sesi/modul",
      "Key takeaways dan insight baru yang diperoleh",
      "Rencana implementasi pengetahuan di tempat kerja",
      "Gap kompetensi sebelum vs sesudah pelatihan",
      "Rekomendasi pelatihan lanjutan yang relevan",
    ],
    tools: ["EducounselClaw", "IBTUClaw", "RisetSkripsiClaw"],
  },
  {
    id: "penugasan",
    color: "blue",
    icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
    title: "Executive Summary Hasil Penugasan",
    audience: "Profesional, manajer, konsultan, & staf teknis",
    desc: "Laporan ringkas hasil penugasan, studi banding, benchmarking, atau penugasan khusus untuk manajemen senior atau klien.",
    outputs: [
      "Latar belakang & tujuan penugasan secara ringkas",
      "Temuan utama & analisis kritis hasil penugasan",
      "Rekomendasi actionable yang terukur dan feasible",
      "Risiko & mitigasi yang perlu diperhatikan",
      "Langkah selanjutnya & rencana tindak lanjut",
    ],
    tools: ["BrainClaw", "KonstraClaw", "KontrakClaw"],
  },
  {
    id: "proyek",
    color: "emerald",
    icon: <Building2 className="h-6 w-6 text-emerald-600" />,
    title: "Executive Summary Pelaksanaan Proyek",
    audience: "Project Manager, Owner, Kontraktor, & Konsultan Proyek",
    desc: "Laporan status proyek yang komprehensif namun ringkas untuk steering committee, board, atau klien — mencakup progres, biaya, risiko, dan forecast.",
    outputs: [
      "Status progres vs jadwal (S-curve & milestone)",
      "Realisasi biaya vs anggaran (EVM: CPI & SPI)",
      "Isu & risiko aktif beserta mitigasinya",
      "Keputusan eskalasi yang diperlukan manajemen",
      "Forecast penyelesaian & proyeksi biaya akhir proyek",
    ],
    tools: ["KonstraClaw", "BrainClaw", "QSClaw"],
  },
  {
    id: "riset",
    color: "amber",
    icon: <BookOpen className="h-6 w-6 text-amber-600" />,
    title: "Executive Summary Riset & Kajian",
    audience: "Peneliti, akademisi, konsultan kebijakan, & think tank",
    desc: "Ringkasan eksekutif dari laporan riset, kajian akademik, atau policy paper yang menyampaikan esensi untuk pembaca non-teknis.",
    outputs: [
      "Problem statement & tujuan riset secara ringkas",
      "Metodologi & scope penelitian dalam 2–3 kalimat",
      "Temuan utama dengan data & bukti pendukung",
      "Implikasi kebijakan atau praktis yang konkret",
      "Batasan penelitian & arah riset selanjutnya",
    ],
    tools: ["RisetSkripsiClaw", "BrainClaw", "EducounselClaw"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string; dot: string }> = {
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/30", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-500" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", icon: "bg-blue-100 dark:bg-blue-900/30", tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/30", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/30", tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
};

export default function ExecutiveSummaryPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-executive-summary">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-blue-700 to-indigo-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Brain className="h-3.5 w-3.5" />
                AI Penyusunan Executive Summary Profesional
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Ringkasan Eksekutif<br />
                <span className="text-cyan-200">yang Menggerakkan Keputusan</span>
              </h1>
              <p className="text-base md:text-lg text-cyan-100 mb-8 leading-relaxed">
                Executive Summary yang baik bukan sekadar merangkum — ia mengkomunikasikan
                insight terpenting kepada pengambil keputusan dalam waktu singkat.
                AI Gustafta membantu menyusun executive summary dari hasil belajar,
                penugasan, maupun pelaksanaan proyek secara cepat dan terstruktur.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "4", label: "Tipe Executive Summary", sub: "Belajar · Penugasan · Proyek · Riset" },
                { num: "5", label: "AI Tools Pendukung", sub: "BrainClaw, KonstraClaw, dll" },
                { num: "1–2", label: "Halaman Ideal", sub: "Ringkas, padat, & high-impact" },
                { num: "C-Suite", label: "Target Pembaca", sub: "Board, manajemen, & klien senior" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Anatomy */}
      <section className="py-14 px-4 bg-blue-50 dark:bg-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" /> Anatomi Executive Summary yang Efektif
            </h2>
            <div className="grid md:grid-cols-5 gap-2">
              {[
                { num: "①", label: "Context", desc: "Latar belakang & tujuan (1–2 kalimat)" },
                { num: "②", label: "Findings", desc: "Temuan utama berbasis data" },
                { num: "③", label: "Insights", desc: "Analisis & interpretasi kritis" },
                { num: "④", label: "Recommendations", desc: "Aksi konkret & terukur" },
                { num: "⑤", label: "Next Steps", desc: "Timeline & penanggung jawab" },
              ].map((item, i) => (
                <div key={i} className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                  <div className="text-xl font-extrabold text-blue-600 mb-1">{item.num}</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{item.label}</div>
                  <div className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest text-center mb-2">4 Tipe Executive Summary</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Untuk Setiap Kebutuhan Pelaporan</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {USE_CASES.map((uc) => {
              const c = colorStyles[uc.color];
              return (
                <div key={uc.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-${uc.id}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{uc.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{uc.title}</h3>
                      <p className="text-[10px] text-gray-400">{uc.audience}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-3 leading-relaxed">{uc.desc}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Yang Dihasilkan AI</p>
                  <ul className="space-y-1.5 mb-3">
                    {uc.outputs.map((o, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{o}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5">
                    {uc.tools.map((t, j) => (
                      <span key={j} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Untuk Siapa */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest text-center mb-2">Untuk Siapa</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Paling Membutuhkan?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🏛️", title: "ASN & BUMN", points: ["Laporan pasca diklat & sertifikasi", "Laporan penugasan ke luar negeri", "Notulensi rapat pimpinan"] },
              { icon: "🏗️", title: "Kontraktor & PM", points: ["Monthly progress report", "Laporan steering committee", "Project closure report"] },
              { icon: "📚", title: "Akademisi & Peneliti", points: ["Abstrak & executive summary riset", "Policy brief dari hasil kajian", "Ringkasan disertasi untuk publik"] },
              { icon: "💼", title: "Konsultan & Manager", points: ["Deliverable klien consulting", "Management report berkala", "Board presentation materials"] },
            ].map((group, i) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30">
                <div className="text-2xl mb-2">{group.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{group.title}</h3>
                <ul className="space-y-1">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-br from-cyan-700 via-blue-700 to-indigo-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Executive Summary yang Menggerakkan Keputusan</h2>
          <p className="text-cyan-100 mb-8">Ubah tumpukan data & laporan panjang menjadi ringkasan eksekutif yang memukau dalam hitungan menit.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/riset-skripsi"><span className="hover:text-white cursor-pointer">Riset & Skripsi</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
