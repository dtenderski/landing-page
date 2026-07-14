import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, GraduationCap, Heart,
  BookOpen, Users, Lightbulb, Target, Award,
  BarChart3, Shield, Brain, Layers,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20konseling%20akademik";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";
const CHECKOUT_BASIC = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";

const SERVICES = [
  {
    id: "educounsel",
    color: "teal",
    icon: <Heart className="h-6 w-6 text-teal-600" />,
    name: "EducounselClaw",
    sub: "Konseling Akademik — 11 sub-agen",
    title: "Konseling Akademik Komprehensif",
    desc: "Orchestrator 11 sub-agen yang mencakup seluruh aspek perjalanan akademik: pilihan jurusan, strategi belajar, manajemen stres, hingga perencanaan karir.",
    agents: [
      "MAJOR-ADVISOR: Panduan pemilihan jurusan & kampus sesuai minat & potensi",
      "STUDY-COACH: Strategi belajar efektif & teknik manajemen waktu akademik",
      "MENTAL-HEALTH: Dukungan awal untuk stres akademik & academic burnout",
      "CAREER-PLANNER: Pemetaan jalur karir dari jurusan yang dipilih",
      "SCHOLARSHIP-ADVISOR: Panduan beasiswa dalam & luar negeri",
      "OVERSEAS-STUDY: Panduan studi ke luar negeri & persiapan application",
    ],
  },
  {
    id: "ibtuclaw",
    color: "indigo",
    icon: <Target className="h-6 w-6 text-indigo-600" />,
    name: "IBTUClaw",
    sub: "IB Testing Unit AI — 7 sub-agen",
    title: "Persiapan Tes & Ujian Akademik",
    desc: "AI khusus persiapan ujian masuk perguruan tinggi, tes kemampuan bahasa, dan ujian sertifikasi akademik internasional.",
    agents: [
      "SNBT-PREP: Strategi & latihan soal Seleksi Nasional Berbasis Tes (UTBK-SNBT)",
      "ENGLISH-TEST: Persiapan IELTS, TOEFL iBT, TOEIC untuk studi & kerja",
      "APTITUDE-TEST: Latihan tes bakat & kemampuan umum (TPA, GRE, GMAT)",
      "INTERVIEW-PREP: Simulasi wawancara beasiswa & seleksi kampus",
      "STUDY-PLAN: Jadwal intensif persiapan ujian per target waktu",
    ],
  },
  {
    id: "riset",
    color: "violet",
    icon: <BookOpen className="h-6 w-6 text-violet-600" />,
    name: "RisetSkripsiClaw",
    sub: "AI Konsultan Riset & Skripsi — 8 sub-agen",
    title: "Bimbingan Riset & Penulisan Akademik",
    desc: "Pendampingan lengkap untuk penelitian akademik: dari perumusan masalah, metodologi, penulisan, hingga persiapan sidang.",
    agents: [
      "TOPIC-FINDER: Identifikasi topik penelitian & research gap",
      "LIT-REVIEW: Panduan systematic literature review yang komprehensif",
      "METHODOLOGY: Desain penelitian kuantitatif, kualitatif & mixed methods",
      "WRITING-COACH: Panduan penulisan akademik & struktur bab skripsi",
      "DEFENSE-PREP: Simulasi pertanyaan penguji & persiapan sidang",
    ],
  },
  {
    id: "tutor",
    color: "emerald",
    icon: <Lightbulb className="h-6 w-6 text-emerald-600" />,
    name: "TutorTeknikClaw",
    sub: "AI Tutor Teknik — 8 sub-agen spesialis",
    title: "Tutoring Mata Kuliah Teknik",
    desc: "Tutor personal untuk mata kuliah teknik yang sulit — dari matematika, fisika, hingga mata kuliah spesialisasi bidang teknik.",
    agents: [
      "MATH-TUTOR: Kalkulus, aljabar linear, statistika, & numerik untuk teknik",
      "PHYSICS-TUTOR: Fisika dasar, mekanika, termodinamika, & elektromagnetik",
      "STRUCTURES: Mekanika teknik, analisis struktur, & desain beton/baja",
      "PROGRAMMING: Python, MATLAB, C++ untuk komputasi teknik & simulasi",
      "EXAM-PREP: Persiapan ujian tengah & akhir semester dengan latihan soal",
    ],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  teal: { bg: "bg-teal-50 dark:bg-teal-900/10", border: "border-teal-200 dark:border-teal-800", icon: "bg-teal-100 dark:bg-teal-900/30", tag: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800", icon: "bg-indigo-100 dark:bg-indigo-900/30", tag: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/30", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/30", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export default function AcademicCounselorPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-academic-counselor">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-cyan-700 to-indigo-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <GraduationCap className="h-3.5 w-3.5" />
                AI Konselor Akademik untuk Siswa, Mahasiswa & Institusi Pendidikan
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Pendampingan Akademik<br />
                <span className="text-teal-200">yang Selalu Ada Saat Dibutuhkan</span>
              </h1>
              <p className="text-base md:text-lg text-teal-100 mb-8 leading-relaxed">
                Dari pemilihan jurusan, persiapan SNBT & IELTS, strategi belajar efektif,
                bimbingan riset & skripsi, tutoring mata kuliah sulit, hingga perencanaan karir
                pasca kampus — AI Gustafta hadir sebagai konselor akademik yang sabar dan
                selalu tersedia 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-teal-800 hover:bg-teal-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "11", label: "Sub-Agen EducounselClaw", sub: "Konseling holistik & komprehensif" },
                { num: "4", label: "AI Tools Akademik", sub: "Counsel · Test · Riset · Tutor" },
                { num: "24/7", label: "Konselor AI Online", sub: "Tidak perlu antri janji temu" },
                { num: "S1→S3", label: "Semua Jenjang", sub: "SMA, D3, S1, S2, S3" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-teal-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LAYANAN ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">4 Layanan Utama</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Ekosistem AI Konseling Akademik Lengkap
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {SERVICES.map((svc) => {
              const c = colorStyles[svc.color];
              return (
                <div key={svc.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-service-${svc.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{svc.icon}</div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{svc.name}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{svc.sub}</p>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mt-1">{svc.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{svc.desc}</p>
                  <ul className="space-y-1.5">
                    {svc.agents.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── JOURNEY ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Perjalanan Akademik</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            AI Mendampingi dari SMA hingga Wisuda
          </h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-teal-200 dark:bg-teal-800" />
            <div className="space-y-6">
              {[
                { phase: "SMA / Persiapan Kuliah", icon: "🏫", desc: "Pilihan jurusan & kampus, persiapan SNBT/SBMPTN, persiapan tes bahasa (TOEFL/IELTS), dan panduan beasiswa S1.", tools: "EducounselClaw + IBTUClaw" },
                { phase: "Mahasiswa S1 Awal", icon: "📖", desc: "Adaptasi dunia perkuliahan, strategi belajar efektif, manajemen waktu antara kuliah & organisasi, dan pemilihan minat studi.", tools: "EducounselClaw + TutorTeknikClaw" },
                { phase: "Mahasiswa S1 Akhir", icon: "📝", desc: "Perumusan topik skripsi, systematic literature review, metodologi penelitian, penulisan bab, dan persiapan sidang.", tools: "RisetSkripsiClaw + IBTUClaw" },
                { phase: "Pasca S1 / Magister", icon: "🎓", desc: "Panduan beasiswa S2 dalam & luar negeri, persiapan GRE/GMAT/IELTS, proposal riset S2, dan perencanaan karir akademik.", tools: "EducounselClaw + RisetSkripsiClaw" },
                { phase: "Karir & Profesional", icon: "💼", desc: "Peta karir dari jurusan yang dipilih, persiapan wawancara kerja, pengembangan profil LinkedIn, dan sertifikasi profesional.", tools: "EducounselClaw + IBTUClaw" },
              ].map((phase, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-teal-600 text-xl flex items-center justify-center flex-shrink-0 z-10 border-4 border-white dark:border-background">{phase.icon}</div>
                  <div className="flex-1 bg-teal-50 dark:bg-teal-900/10 rounded-2xl p-4 border border-teal-100 dark:border-teal-800/30">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{phase.phase}</h3>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mb-2">{phase.desc}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">{phase.tools}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── UNTUK INSTITUSI ── */}
      <section className="py-16 px-4 bg-teal-50 dark:bg-teal-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Untuk Institusi</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">AI Konseling untuk Sekolah & Universitas</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: <Shield className="h-5 w-5 text-teal-600" />,
                title: "Bimbingan & Konseling Sekolah (BK)",
                desc: "Chatbot AI konselor yang membantu staf BK menangani lebih banyak siswa — panduan pilihan jurusan, persiapan kuliah, dan dukungan awal kesehatan mental akademik.",
                points: ["Chatbot BK 24/7 untuk siswa", "Panduan pilihan jurusan otomatis", "Tracking progres siswa per semester", "Referral ke konselor manusia jika perlu"],
              },
              {
                icon: <GraduationCap className="h-5 w-5 text-indigo-600" />,
                title: "Unit Layanan Mahasiswa (UPT BK / SAC)",
                desc: "Skalakan layanan konseling akademik kampus tanpa harus menambah staf — AI menangani pertanyaan umum, pembuatan jadwal, dan panduan akademik standar.",
                points: ["Integrasi dengan sistem akademik kampus", "Chatbot panduan kurikulum & syarat kelulusan", "Pengingat deadline akademik & administrasi", "Eskalasi ke konselor senior untuk kasus kompleks"],
              },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-6 border border-teal-100 dark:border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teal-50 dark:bg-muted rounded-lg">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
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
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Realita Pendidikan Tinggi Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "32,00%", label: "APK pendidikan tinggi Indonesia 2024 — salah satu terendah di ASEAN", source: "BPS 2024", icon: <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" /> },
              { value: "11,28%", label: "Porsi sarjana dari total pengangguran terbuka (Agustus 2024)", source: "BPS 2024", icon: <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" /> },
              { value: "17,44 poin", label: "Selisih APK PT perkotaan (38,6%) vs perdesaan (21,2%)", source: "BPS 2024", icon: <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-teal-50 dark:bg-teal-900/10 rounded-2xl p-5 border border-teal-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">{s.icon}</div>
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
      <section className="py-16 px-4 bg-gradient-to-br from-teal-700 via-cyan-700 to-indigo-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Setiap Perjalanan Akademik Layak Mendapat Bimbingan Terbaik</h2>
          <p className="text-teal-100 mb-8 leading-relaxed">
            Akses konselor akademik AI yang sabar, selalu tersedia, dan memahami konteks pendidikan Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-teal-800 hover:bg-teal-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-teal-200 mt-5">
            Lihat juga:{" "}
            <Link href="/riset-skripsi"><span className="underline font-semibold cursor-pointer">Riset & Skripsi →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/riset-skripsi"><span className="hover:text-white cursor-pointer">Riset & Skripsi</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
