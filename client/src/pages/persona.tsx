import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, ArrowRight, MessageCircle, Award, Briefcase, Users,
  GraduationCap, HardHat, Scale, Zap, Star, Clock,
  TrendingUp, XCircle, ChevronRight,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20sesuai%20profesi%20saya";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const PERSONAS = [
  {
    id: "asesor",
    icon: <Award className="h-8 w-8 text-amber-600" />,
    color: "amber",
    title: "Asesor Kompetensi",
    subtitle: "LSP · BNSP · SKK · SKKNI",
    hero: "Asesor yang Lebih Efisien, Bukan Lebih Sibuk",
    pain: "Anda menghabiskan 2–3 jam/hari menjawab pertanyaan yang sama dari asesi — soal persyaratan, regulasi, dan prosedur sertifikasi. Padahal waktu Anda lebih berharga untuk asesmen yang bermakna.",
    solution: "Chatbot AI yang memahami skema SKK, SKKNI, dan regulasi BNSP — siap menjawab pertanyaan asesi 24/7. Sesi asesmen Anda menjadi lebih fokus dan produktif.",
    win: "Hemat 2–3 jam/hari dari pertanyaan teknis berulang",
    usecases: [
      "FAQ persyaratan sertifikasi otomatis",
      "Panduan persiapan portofolio asesi",
      "Informasi skema SKK per jabatan",
      "Follow-up jadwal & dokumen pendaftaran",
    ],
    tools: ["PanduanASKOM", "ManprojakClaw", "ArsitekturClaw", "IBTUClaw"],
    cta: CHECKOUT_URL,
  },
  {
    id: "konsultan",
    icon: <Briefcase className="h-8 w-8 text-blue-600" />,
    color: "blue",
    title: "Konsultan Independen",
    subtitle: "Konsultan · Advisor · Freelancer Profesional",
    hero: "Skalakan Layanan Konsultasi Tanpa Tambah Tim",
    pain: "Waktu Anda terbatas, klien terus bertambah. Pertanyaan berulang menguras energi yang harusnya untuk pekerjaan strategis bernilai tinggi. Anda tidak bisa tumbuh tanpa menambah jam kerja.",
    solution: "Chatbot AI yang merepresentasikan keahlian Anda — menjawab pertanyaan klien, melakukan pre-screening, dan mengumpulkan brief awal secara otomatis, bahkan saat Anda tidur.",
    win: "Handle 3× lebih banyak klien tanpa tambah jam kerja",
    usecases: [
      "Pre-screening klien baru otomatis 24/7",
      "FAQ layanan & pricing Anda",
      "Pengumpulan brief proyek terstruktur",
      "Follow-up proposal & onboarding",
    ],
    tools: ["Gustafta Builder", "KontrakClaw", "KorporasiClaw", "KeuanganClaw"],
    cta: CHECKOUT_BASIC,
  },
  {
    id: "trainer",
    icon: <GraduationCap className="h-8 w-8 text-violet-600" />,
    color: "violet",
    title: "Trainer & Coach",
    subtitle: "Pelatih · Fasilitator · Learning Consultant",
    hero: "Buat Peserta Belajar Kapan Saja, Bukan Hanya Saat Sesi",
    pain: "Materi pelatihan Anda berharga, tapi peserta hanya bisa mengaksesnya saat sesi berlangsung. Di luar itu mereka bingung sendiri — dan tingkat penyelesaian modul rendah.",
    solution: "Chatbot AI tutor 24/7 untuk peserta Anda — menjawab pertanyaan, memberikan latihan soal, dan memantau pemahaman antar sesi. Nilai Anda sebagai trainer menjadi jauh lebih terasa.",
    win: "Tingkat penyelesaian modul naik rata-rata 30%",
    usecases: [
      "Tutor materi kursus antar sesi",
      "Generator soal latihan otomatis",
      "Reminder assignment & deadline",
      "Onboarding peserta batch baru",
    ],
    tools: ["EducounselClaw", "IBTUClaw", "ETLOAcademyClaw", "TutorTeknikClaw"],
    cta: CHECKOUT_BASIC,
  },
  {
    id: "k3",
    icon: <HardHat className="h-8 w-8 text-orange-600" />,
    color: "orange",
    title: "Spesialis K3",
    subtitle: "HSE Officer · Ahli K3 · Safety Manager",
    hero: "Jadikan Standar K3 Mudah Diakses Seluruh Tim",
    pain: "Prosedur K3 ada di dokumen tebal yang tidak pernah dibaca tim lapangan. Insiden terjadi bukan karena tidak ada aturan, tapi karena aturan tidak mudah diakses saat dibutuhkan.",
    solution: "Chatbot AI K3 yang bisa diakses dari HP di lapangan — menjawab pertanyaan prosedur, checklist inspeksi, dan panduan regulasi K3 secara instan, kapanpun dibutuhkan.",
    win: "Kepatuhan prosedur K3 meningkat signifikan",
    usecases: [
      "Panduan prosedur K3 lapangan instan",
      "Checklist inspeksi digital",
      "FAQ regulasi Kemnaker & SMK3",
      "Laporan temuan K3 otomatis",
    ],
    tools: ["CSMSClaw", "SMK3Claw", "SafiraClaw", "K3ManClaw"],
    cta: CHECKOUT_URL,
  },
  {
    id: "legal",
    icon: <Scale className="h-8 w-8 text-indigo-600" />,
    color: "indigo",
    title: "Konsultan Hukum",
    subtitle: "Pengacara · Paralegal · Legal Advisor",
    hero: "Tangani Lebih Banyak Klien Tanpa Lebih Banyak Jam Kerja",
    pain: "Pertanyaan hukum dasar dari calon klien menghabiskan 1–2 jam sehari — waktu yang lebih baik digunakan untuk kasus kompleks dan bernilai tinggi.",
    solution: "Chatbot AI legal yang melakukan pre-screening calon klien, menjawab FAQ hukum dasar, dan menyiapkan brief awal sebelum konsultasi pertama. Klien datang sudah siap.",
    win: "Kurangi 60% waktu konsultasi awal yang tidak produktif",
    usecases: [
      "Pre-screening calon klien otomatis",
      "FAQ regulasi bisnis & perizinan",
      "Informasi prosedur hukum dasar",
      "Pengumpulan brief kasus awal",
    ],
    tools: ["LexCom Legal AI", "KontrakClaw", "KorporasiClaw", "OSSClaw"],
    cta: CHECKOUT_URL,
  },
  {
    id: "akademisi",
    icon: <Users className="h-8 w-8 text-teal-600" />,
    color: "teal",
    title: "Akademisi & Peneliti",
    subtitle: "Dosen · Peneliti · Mahasiswa S2/S3",
    hero: "Asisten Riset yang Tidak Pernah Istirahat",
    pain: "Mahasiswa bimbingan terus bertanya hal yang sama. Anda ingin membimbing secara bermakna, tapi waktu habis untuk pertanyaan teknis berulang tentang metodologi dan prosedur.",
    solution: "Chatbot AI akademik yang menjawab pertanyaan metodologi, membantu review literatur, dan membimbing penulisan ilmiah — sehingga sesi bimbingan fokus pada hal substantif.",
    win: "Waktu bimbingan lebih fokus, mahasiswa lebih mandiri",
    usecases: [
      "Panduan metodologi penelitian",
      "Review literatur & panduan sitasi",
      "Panduan penulisan ilmiah",
      "FAQ prosedur sidang & wisuda",
    ],
    tools: ["RisetSkripsiClaw", "TutorTeknikClaw", "EducounselClaw", "BrainClaw"],
    cta: CHECKOUT_BASIC,
  },
];

const colorMap: Record<string, { bg: string; border: string; badge: string; win: string }> = {
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/10",   border: "border-amber-200 dark:border-amber-800",   badge: "bg-amber-100 text-amber-700",   win: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/10",     border: "border-blue-200 dark:border-blue-800",     badge: "bg-blue-100 text-blue-700",     win: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", badge: "bg-violet-100 text-violet-700", win: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 text-orange-700", win: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800", badge: "bg-indigo-100 text-indigo-700", win: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" },
  teal:   { bg: "bg-teal-50 dark:bg-teal-900/10",     border: "border-teal-200 dark:border-teal-800",     badge: "bg-teal-100 text-teal-700",     win: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300" },
};

export default function PersonaPage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-persona">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-6">
            <Award className="h-3.5 w-3.5" />
            AI Chatbot Sesuai Profesi Anda
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Waktu Anda Terlalu Berharga<br />
            <span className="text-gray-300">untuk Dihabiskan Menjawab Pertanyaan yang Sama</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Asesor, konsultan, trainer, spesialis K3, pengacara, akademisi — semua menghadapi
            masalah yang sama: pertanyaan berulang yang menguras waktu dari pekerjaan yang benar-benar penting.
          </p>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Gustafta menyediakan chatbot AI yang berbicara bahasa profesi Anda, memahami regulasi Anda,
            dan memecahkan masalah spesifik di bidang Anda — sehingga Anda bisa fokus pada hal yang tidak bisa digantikan mesin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
                <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
              </Button>
            </a>
            <Link href={builderUrl}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-builder">
                Coba Builder <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Universal pain yang mengikat ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Masalah yang Sama, Profesi yang Berbeda</p>
            <h2 className="text-2xl font-bold mb-3">Setiap Profesional Terampil Menghadapi Hal Ini</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <Clock className="h-5 w-5 text-red-400" />, title: "2–4 jam/hari terbuang", desc: "Rata-rata profesional Indonesia menghabiskan 2–4 jam sehari menjawab pertanyaan teknis yang berulang dari klien, peserta, atau rekan." },
              { icon: <XCircle className="h-5 w-5 text-red-400" />, title: "Klien tidak terlayani optimal", desc: "Karena waktu habis untuk pertanyaan rutin, pekerjaan strategis — yang benar-benar menghasilkan nilai — sering tertunda atau terburu-buru." },
              { icon: <TrendingUp className="h-5 w-5 text-amber-400" />, title: "Sulit tumbuh tanpa burnout", desc: "Untuk melayani lebih banyak klien, satu-satunya cara yang ada selama ini adalah tambah jam kerja. Tidak ada cara lain — sampai sekarang." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">{item.icon}<h3 className="font-bold text-sm">{item.title}</h3></div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-white font-semibold mb-2">Chatbot AI bukan untuk menggantikan Anda.</p>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">Chatbot menangani pertanyaan berulang — sehingga Anda bisa fokus pada pekerjaan yang benar-benar membutuhkan keahlian dan pengalaman unik Anda.</p>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — Persona cards dengan pain → solution ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-2">Pilih Profesi Anda</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
            Solusi Spesifik untuk 6 Profesi
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Bukan solusi generik. Setiap profesi punya konfigurasi, knowledge base, dan use case yang berbeda.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {PERSONAS.map((p) => {
              const colors = colorMap[p.color];
              return (
                <div key={p.id} className={`rounded-2xl border-2 ${colors.bg} ${colors.border} p-6`} data-testid={`card-persona-${p.id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-white dark:bg-background rounded-xl shadow-sm flex-shrink-0">{p.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{p.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">{p.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 italic">"{p.hero}"</p>

                  {/* Pain → Solution */}
                  <div className="space-y-2 mb-4">
                    <div className="bg-white/60 dark:bg-background/40 rounded-lg px-4 py-2.5">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-bold text-red-500">Masalah:</span> {p.pain}
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-background/40 rounded-lg px-4 py-2.5">
                      <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">
                        <span className="font-bold text-green-600">Solusi:</span> {p.solution}
                      </p>
                    </div>
                  </div>

                  {/* Win stat */}
                  <div className={`rounded-lg px-3 py-2 text-xs font-semibold mb-4 flex items-center gap-2 ${colors.win}`}>
                    <TrendingUp className="h-3.5 w-3.5" />{p.win}
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {p.usecases.map((uc, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{uc}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.tools.map((tool, j) => (
                      <span key={j} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{tool}</span>
                    ))}
                  </div>
                  <a href={p.cta} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full font-bold text-sm h-9" data-testid={`btn-persona-cta-${p.id}`}>
                      Mulai sebagai {p.title} →
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Profesi tidak tercantum ── */}
      <section className="py-12 px-4 bg-white dark:bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Profesi Lain?</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profesi Anda Tidak Tercantum?</h2>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-6 leading-relaxed">
            Gustafta dapat dikonfigurasi untuk hampir semua profesi dan industri.
            Hubungi tim kami untuk konsultasi gratis — kami bantu rancang solusi AI yang tepat untuk pekerjaan Anda.
          </p>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
            <Button className="font-bold gap-2" data-testid="btn-konsultasi-custom">
              <MessageCircle className="h-4 w-4" /> Konsultasi Profesi Saya →
            </Button>
          </a>
        </div>
      </section>

      {/* ── A: ACTION — Pilih paket ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Pilih Paket</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Mulai dari Mana?</h2>
          <p className="text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-md mx-auto">Tidak yakin mana yang cocok? Mulai dari yang kecil — Anda bisa upgrade kapanpun.</p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-gray-200 dark:border-border text-left">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Starter Kit</h3>
              <p className="text-xs text-gray-500 mb-4">Untuk yang ingin coba dulu sebelum komitmen lebih besar</p>
              <ul className="space-y-2 mb-5 text-xs text-gray-700 dark:text-muted-foreground">
                {["📚 Trilogi Ebook (3 ebook)", "🗂️ Trilogi Prompt Pack", "🤖 Akses Gustafta Builder 7 hari", "📋 Panduan Onboarding", "💬 Akses Grup WhatsApp", "🛡️ Garansi 7 hari"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-500" />{item}</li>
                ))}
              </ul>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Rp 245.000</p>
              <p className="text-xs text-gray-400 mb-4 line-through">Normal Rp 315.000</p>
              <a href={CHECKOUT_BASIC} target="_blank" rel="noopener noreferrer">
                <Button className="w-full" variant="outline" data-testid="btn-paket-basic">
                  Tanya Info Pembayaran via WA →
                </Button>
              </a>
            </div>
            <div className="bg-white dark:bg-card rounded-2xl p-6 border-2 border-orange-400 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">PALING LENGKAP</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Bundle Trilogi</h3>
              <p className="text-xs text-gray-500 mb-4">Untuk yang serius membangun penghasilan baru dari keahliannya</p>
              <ul className="space-y-2 mb-5 text-xs text-gray-700 dark:text-muted-foreground">
                {["3 Buku + 50+ Prompt Pack", "Template 6-agen AI siap pakai", "1 Bulan Builder Gratis", "Akses 13 claw Starter"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-500" />{item}</li>
                ))}
              </ul>
              <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold" data-testid="btn-paket-bundle">
                  Tanya Info Pembayaran via WA →
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-800 to-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">AI yang Memahami Profesi Anda</h2>
          <p className="text-gray-300 mb-2 leading-relaxed">Berhenti mengerjakan pekerjaan yang bisa dikerjakan AI. Mulai fokus pada hal yang hanya bisa dilakukan oleh Anda.</p>
          <p className="text-gray-400 text-sm mb-8">Setup kurang dari 1 jam · Tidak perlu coding · Support via WhatsApp</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Chat WhatsApp
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
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Per Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
