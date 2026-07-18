import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, BookOpen, FlaskConical,
  Search, FileText, Lightbulb, BarChart3, Users,
  GraduationCap, Target, Layers,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20riset%20dan%20skripsi";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const STAGES = [
  {
    id: "topik",
    icon: <Lightbulb className="h-6 w-6 text-violet-600" />,
    title: "Menemukan Topik & Rumusan Masalah",
    desc: "Banyak mahasiswa terjebak di tahap awal karena tidak tahu cara mengidentifikasi gap penelitian yang layak.",
    tools: [
      { name: "RisetSkripsiClaw", role: "TOPIC-FINDER", detail: "Panduan identifikasi gap literatur, formulasi research question, dan kebaruan penelitian" },
      { name: "TutorTeknikClaw", role: "SUBJECT-TUTOR", detail: "Pendalaman konsep dasar bidang teknik/sains yang jadi fondasi topik skripsi" },
    ],
    features: [
      "Brainstorming topik berbasis minat & tren riset terkini",
      "Identifikasi research gap dari literatur yang ada",
      "Formulasi rumusan masalah yang tajam & terukur",
      "Cek kebaruan topik dan potensi kontribusi ilmiah",
    ],
  },
  {
    id: "literatur",
    icon: <Search className="h-6 w-6 text-blue-600" />,
    title: "Tinjauan Pustaka & Kajian Literatur",
    desc: "Literature review yang lemah membuat landasan teori skripsi rapuh dan mudah diserang penguji.",
    tools: [
      { name: "RisetSkripsiClaw", role: "LIT-REVIEW", detail: "Panduan systematic literature review, pemetaan teori, dan sintesis temuan penelitian sebelumnya" },
      { name: "IBTUClaw", role: "ACADEMIC-RESEARCH", detail: "Validasi referensi akademik dan interpretasi metodologi penelitian" },
    ],
    features: [
      "Panduan pencarian literatur di Google Scholar, Scopus, dll",
      "Template matriks literatur untuk pemetaan penelitian terdahulu",
      "Sintesis teori dan kerangka konseptual penelitian",
      "Panduan penulisan bab tinjauan pustaka yang sistematis",
    ],
  },
  {
    id: "metodologi",
    icon: <FlaskConical className="h-6 w-6 text-emerald-600" />,
    title: "Metodologi Penelitian",
    desc: "Pemilihan metode yang tidak tepat, desain instrumen yang lemah, dan ukuran sampel yang salah adalah penyebab utama skripsi ditolak.",
    tools: [
      { name: "RisetSkripsiClaw", role: "METHODOLOGY", detail: "Panduan desain penelitian: kuantitatif, kualitatif, mixed methods, experimental, survei" },
      { name: "TutorTeknikClaw", role: "STATS-TUTOR", detail: "Tutorial analisis statistik: uji normalitas, regresi, ANOVA, SEM, dan interpretasi output" },
    ],
    features: [
      "Pemilihan pendekatan & desain penelitian yang tepat",
      "Panduan penyusunan instrumen: kuesioner, panduan wawancara",
      "Kalkulasi ukuran sampel & teknik sampling",
      "Tutorial analisis data: SPSS, R, Python untuk skripsi",
    ],
  },
  {
    id: "penulisan",
    icon: <FileText className="h-6 w-6 text-amber-600" />,
    title: "Penulisan & Penyusunan Skripsi",
    desc: "Struktur argumen yang lemah, alur yang tidak logis, dan penulisan akademik yang buruk membuat skripsi sulit dibaca dan dipertahankan.",
    tools: [
      { name: "RisetSkripsiClaw", role: "WRITING-COACH", detail: "Panduan penulisan akademik: struktur bab, alur argumen, penggunaan bahasa ilmiah" },
      { name: "EducounselClaw", role: "ACADEMIC-WRITING", detail: "Coaching menulis: clarity, coherence, dan persuasive academic writing" },
    ],
    features: [
      "Template struktur tiap bab skripsi (I–V atau I–VI)",
      "Panduan penulisan abstrak, pendahuluan, & kesimpulan",
      "Review alur argumen dan koherensi antar bab",
      "Panduan sitasi & referensi (APA, IEEE, Chicago)",
    ],
  },
  {
    id: "sidang",
    icon: <Target className="h-6 w-6 text-red-600" />,
    title: "Persiapan Sidang & Presentasi",
    desc: "Mahasiswa yang tidak siap menghadapi pertanyaan penguji sering gagal bukan karena risetnya buruk, tapi karena tidak bisa menjelaskan risetnya.",
    tools: [
      { name: "RisetSkripsiClaw", role: "DEFENSE-PREP", detail: "Simulasi pertanyaan penguji, panduan penyusunan slide, dan strategi menjawab pertanyaan kritis" },
      { name: "IBTUClaw", role: "PRESENTATION-COACH", detail: "Latihan presentasi akademik dan teknik komunikasi ilmiah yang efektif" },
    ],
    features: [
      "Simulasi 50+ pertanyaan penguji per bidang studi",
      "Panduan penyusunan slide presentasi yang efektif",
      "Strategi menjawab pertanyaan kritis & follow-up",
      "Checklist persiapan dokumen sidang skripsi",
    ],
  },
];

export default function RisetSkripsiPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-riset-skripsi">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-blue-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <BookOpen className="h-3.5 w-3.5" />
                AI Konsultan Riset & Skripsi untuk Mahasiswa
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Skripsi Selesai,<br />
                <span className="text-violet-200">Sidang Lulus dengan Percaya Diri</span>
              </h1>
              <p className="text-base md:text-lg text-violet-100 mb-8 leading-relaxed">
                Dari menemukan topik, menyusun literatur, memilih metodologi, menulis bab demi bab,
                hingga mempersiapkan sidang — AI Gustafta mendampingi seluruh perjalanan skripsi Anda
                selayaknya pembimbing yang selalu tersedia 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-violet-800 hover:bg-violet-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "8", label: "Sub-Agen RisetSkripsiClaw", sub: "Topik · Literatur · Metode · Sidang" },
                { num: "5", label: "Tahap Skripsi Didukung", sub: "End-to-end dari ide ke wisuda" },
                { num: "50+", label: "Simulasi Pertanyaan Penguji", sub: "Per bidang studi & metodologi" },
                { num: "24/7", label: "Pembimbing AI Online", sub: "Tidak perlu tunggu jam konsultasi" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-violet-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 TAHAP ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">5 Tahap Skripsi</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            AI Mendampingi Setiap Tahap Perjalanan Skripsi
          </h2>
          <div className="space-y-5">
            {STAGES.map((stage, idx) => (
              <div key={stage.id} className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6" data-testid={`card-stage-${stage.id}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {stage.icon}
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{stage.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{stage.desc}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5 pl-12">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">AI Tools</p>
                    <div className="space-y-2">
                      {stage.tools.map((t, j) => (
                        <div key={j}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{t.name}</span>
                            <span className="text-[10px] text-gray-400">/ {t.role}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-0.5 leading-relaxed">{t.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Yang Bisa Dibantu AI</p>
                    <ul className="space-y-1.5">
                      {stage.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIDANG STUDI ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Bidang Studi</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Mendukung Berbagai Program Studi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "🏗️", label: "Teknik Sipil" },
              { icon: "⚡", label: "Teknik Elektro" },
              { icon: "🏛️", label: "Arsitektur" },
              { icon: "⚙️", label: "Teknik Mesin" },
              { icon: "💻", label: "Informatika & TI" },
              { icon: "🌿", label: "Teknik Lingkungan" },
              { icon: "🧪", label: "Kimia & Material" },
              { icon: "📐", label: "Teknik Industri" },
              { icon: "🌍", label: "Geografi & Geologi" },
              { icon: "💰", label: "Ekonomi & Bisnis" },
              { icon: "⚖️", label: "Hukum" },
              { icon: "🌾", label: "Pertanian & Kehutanan" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/10 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
                <span className="text-xl">{b.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-violet-50 dark:bg-violet-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Untuk Siapa</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Paling Diuntungkan?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <GraduationCap className="h-5 w-5 text-violet-500" />, title: "Mahasiswa S1", points: ["Menyusun skripsi semester akhir", "Menemukan topik yang menarik & feasible", "Menghadapi pembimbing yang sulit ditemui", "Mempersiapkan sidang dengan percaya diri"] },
              { icon: <BookOpen className="h-5 w-5 text-blue-500" />, title: "Mahasiswa S2/S3", points: ["Menyusun proposal tesis/disertasi", "Systematic literature review yang komprehensif", "Desain penelitian kuantitatif & kualitatif", "Publikasi jurnal Scopus & SINTA"] },
              { icon: <Users className="h-5 w-5 text-emerald-500" />, title: "Dosen & Pembimbing", points: ["Membantu mahasiswa bimbingan lebih efisien", "Referensi metodologi & literatur terkini", "Template rubrik penilaian & evaluasi", "Materi kuliah metodologi penelitian"] },
            ].map((group, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-violet-100 dark:border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-violet-50 dark:bg-muted rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
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
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Produktivitas Riset Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "259.849", label: "Dokumen publikasi ilmiah internasional Indonesia periode 2019–2023", source: "BRIN, IIRI 2024", icon: <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" /> },
              { value: "Peringkat 25", label: "Posisi Indonesia dari 243 negara berdasarkan jumlah publikasi terindeks Scopus (2022)", source: "Scopus / SCImago", icon: <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" /> },
              { value: "CAGR 26%", label: "Laju pertumbuhan tahunan publikasi ilmiah penulis Indonesia 2012–2022", source: "Elsevier", icon: <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-violet-50 dark:bg-violet-900/10 rounded-2xl p-5 border border-violet-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">{s.icon}</div>
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
      <section className="py-16 px-4 bg-gradient-to-br from-violet-700 via-purple-700 to-blue-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Skripsi Anda Menunggu untuk Diselesaikan</h2>
          <p className="text-violet-100 mb-8 leading-relaxed">
            Jangan biarkan kebuntuan riset menghambat kelulusan Anda. Mulai dengan AI yang tepat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-violet-800 hover:bg-violet-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-violet-200 mt-5">
            Lihat juga:{" "}
            <Link href="/academic-counselor"><span className="underline font-semibold cursor-pointer">Konseling Akademik →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/academic-counselor"><span className="hover:text-white cursor-pointer">Konseling Akademik</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
