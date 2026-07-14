import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import {
  GraduationCap, BookOpen, Users, Award, Briefcase, HardHat,
  Check, ArrowRight, MessageCircle, Zap, Star, Clock, Sparkles,
  Brain, CheckCircle2, Phone, Crown, Lock, TrendingUp, Shield,
  ClipboardCheck, Scale
} from "lucide-react";

const WA = "6282299417818";
const waLink = (msg: string) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

const segments = [
  {
    id: "pelajar",
    icon: GraduationCap,
    color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800",
    headerBg: "bg-blue-100 dark:bg-blue-950/50",
    title: "Pelajar SMA / SMK",
    badge: "Bimbel Model Baru",
    badgeColor: "bg-blue-600 text-white",
    tagline: "AI Tutor 24/7 — Lebih Pintar, Lebih Hemat dari Bimbel Konvensional",
    desc: "Bukan sekadar video tutorial — AI aktif menjawab pertanyaanmu, menjelaskan konsep yang tidak dipahami, dan membuat latihan soal sesuai kelemahanmu. Tersedia kapan pun, bahkan tengah malam sebelum ujian.",
    packs: [
      { name: "Paket SMA IPA", agents: 7, subjects: ["Matematika", "Fisika", "Kimia", "Biologi", "B. Indonesia", "B. Inggris", "UTBK TPS"], price: "Rp 99rb/bln" },
      { name: "Paket SMA IPS", agents: 7, subjects: ["Ekonomi", "Sosiologi", "Geografi", "Sejarah", "B. Indonesia", "B. Inggris", "UTBK TPS"], price: "Rp 99rb/bln" },
      { name: "Paket SMK Vokasi", agents: 5, subjects: ["Matematika Vokasi", "B. Indonesia", "B. Inggris", "Kompetensi Kejuruan", "Etika Profesi"], price: "Rp 79rb/bln" },
      { name: "Paket UTBK & Kedinasan Saintek", agents: 5, subjects: ["TPS Penalaran", "Matematika UTBK", "Fisika", "Kimia / Biologi", "TWK / TIU / TKP Kedinasan"], price: "Rp 79rb/bln", popular: true },
      { name: "Paket Sekolah Kedinasan", agents: 5, subjects: ["SKD: TWK, TIU, TKP", "Psikotes & Tes Karakteristik Pribadi", "Wawasan Kebangsaan", "Tes Fisik & Kesehatan", "Simulasi seleksi per instansi (STAN, IPDN, STIS, dll)"], price: "Rp 89rb/bln" },
    ],
    usps: ["Jawab soal + penjelasan langkah per langkah", "Bank soal adaptif berdasarkan kelemahanmu", "Simulasi ujian UTBK & Kedinasan mode waktu", "Tidak terikat jadwal — belajar kapan saja"],
  },
  {
    id: "mahasiswa",
    icon: BookOpen,
    color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800",
    headerBg: "bg-violet-100 dark:bg-violet-950/50",
    title: "Mahasiswa",
    badge: "Asisten Kuliah AI",
    badgeColor: "bg-violet-600 text-white",
    tagline: "Tutor Mata Kuliah, Asisten TA & Skripsi, Pemahaman Jurnal",
    desc: "AI yang paham silabus kampus, bisa menjelaskan konsep teknis dengan bahasa sederhana, membantu analisis jurnal penelitian, dan menemani proses TA dari awal hingga sidang.",
    packs: [
      { name: "Paket Mahasiswa Teknik Sipil", agents: 6, subjects: ["Mekanika Bahan", "Struktur Bangunan", "Manajemen Konstruksi", "RAB & Estimasi", "Regulasi Konstruksi", "Asisten Skripsi"], price: "Rp 149rb/bln", popular: true },
      { name: "Paket Mahasiswa Arsitektur", agents: 5, subjects: ["Teori Arsitektur", "Konstruksi & Material", "Regulasi Bangunan", "Desain Konsep AI", "Asisten TA"], price: "Rp 149rb/bln" },
      { name: "Paket Mahasiswa Hukum", agents: 5, subjects: ["Hukum Perdata", "Hukum Pidana", "Hukum Konstruksi", "Legal Drafting", "Asisten Skripsi"], price: "Rp 149rb/bln" },
      { name: "Paket Asisten Skripsi AI", agents: 3, subjects: ["Analisis Masalah & Judul", "Tinjauan Pustaka & Jurnal", "Metodologi Penelitian"], price: "Rp 99rb/bln" },
    ],
    usps: ["Penjelasan konsep dari silabus nyata", "Bantu analisis jurnal internasional", "Asisten TA: brainstorm judul, kerangka teori, metodologi", "Latihan soal UTS/UAS per mata kuliah"],
  },
  {
    id: "guru",
    icon: Users,
    color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-emerald-100 dark:bg-emerald-950/50",
    title: "Guru & Dosen",
    badge: "Ruang Belajar Digital",
    badgeColor: "bg-emerald-600 text-white",
    tagline: "Buat AI Tutor dari Materi Anda — Siswa Belajar Mandiri 24/7",
    desc: "Upload silabus, materi, dan soal Anda — AI akan menjadi tutor digital yang menjawab pertanyaan siswa/mahasiswa kapan pun. Anda fokus ke diskusi mendalam, bukan pertanyaan berulang.",
    packs: [
      { name: "Paket Guru Digital Starter", agents: 3, subjects: ["AI Tutor dari materi Anda", "Bank soal otomatis", "Dashboard progress siswa"], price: "Rp 199rb/bln" },
      { name: "Paket Dosen Perguruan Tinggi", agents: 5, subjects: ["AI Tutor per mata kuliah", "Asisten TA mahasiswa", "Evaluasi pemahaman otomatis", "Silabus & RPS digital", "Distribusi ke semua mahasiswa"], price: "Rp 299rb/bln", popular: true },
      { name: "Paket Kelas Online", agents: 4, subjects: ["Chatbot dari materi kursus", "Kuis & evaluasi interaktif", "Sertifikat otomatis", "Branding kelas sendiri"], price: "Rp 249rb/bln" },
    ],
    usps: ["AI tahu isi materi Anda — bukan generic", "Siswa tanya kapan saja, AI yang jawab", "Pantau pertanyaan paling sering siswa", "Kurangi beban mengajar hal berulang"],
  },
  {
    id: "instruktur",
    icon: Award,
    color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800",
    headerBg: "bg-orange-100 dark:bg-orange-950/50",
    title: "Instruktur & Pelatih",
    badge: "AI Coach",
    badgeColor: "bg-orange-600 text-white",
    tagline: "Peserta Latihan Mandiri via AI — Anda Fokus ke Mentoring Mendalam",
    desc: "Peserta pelatihan bisa berlatih, bertanya, dan simulasi ujian via AI yang tahu materi kursus Anda. Kurangi sesi repetitif, perbanyak diskusi nilai tambah.",
    packs: [
      { name: "Paket Instruktur BNSP / SKK", agents: 5, subjects: ["Simulasi ujian SKK per unit kompetensi", "Coach materi SKKNI", "Tanya-jawab regulasi BNSP", "Rekap pemahaman peserta", "Strategi lolos assessor"], price: "Rp 249rb/bln", popular: true },
      { name: "Paket Instruktur K3", agents: 4, subjects: ["Prosedur K3 & APD", "Regulasi SMK3 & ISO 45001", "Simulasi insiden & HIRARC", "Kuis evaluasi K3"], price: "Rp 199rb/bln" },
      { name: "Paket Pelatihan Korporat", agents: 5, subjects: ["Materi pelatihan dari modul Anda", "Evaluasi pre & post training", "Dashboard progress peserta", "Sertifikat digital", "WhatsApp broadcast otomatis"], price: "Rp 299rb/bln" },
    ],
    usps: ["AI coach aktif 24/7 untuk peserta", "Simulasi ujian sertifikasi realistis", "Rekap pertanyaan tersering peserta", "Peserta bisa ulang materi kapan saja"],
  },
  {
    id: "hrd",
    icon: Briefcase,
    color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200 dark:border-teal-800",
    headerBg: "bg-teal-100 dark:bg-teal-950/50",
    title: "HRD & Perusahaan",
    badge: "Portal Training Karyawan",
    badgeColor: "bg-teal-600 text-white",
    tagline: "Onboarding, SOP, Knowledge Base — Semua dalam Satu AI",
    desc: "Karyawan baru onboarding mandiri, karyawan lama update SOP, semua dari satu chatbot AI yang tahu seluruh knowledge base perusahaan. Lebih efisien dari manual training berulang.",
    packs: [
      { name: "Paket HRD Starter", agents: 3, subjects: ["Onboarding karyawan baru", "FAQ kebijakan & SOP", "Knowledge base perusahaan"], price: "Rp 199rb/bln" },
      { name: "Paket Training Korporat", agents: 6, subjects: ["Onboarding + SOP AI", "Pelatihan kompetensi per divisi", "Kuis & evaluasi otomatis", "Sertifikat digital", "Integrasi WhatsApp", "Dashboard progress karyawan"], price: "Rp 399rb/bln", popular: true },
    ],
    usps: ["Onboarding karyawan tanpa butuh HR manual", "SOP & kebijakan selalu up-to-date", "Evaluasi pemahaman otomatis", "Hemat biaya training berulang"],
  },
  {
    id: "konstruksi",
    icon: HardHat,
    color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800",
    headerBg: "bg-amber-100 dark:bg-amber-950/50",
    title: "Teknik & Konstruksi",
    badge: "971+ Agent Spesialis",
    badgeColor: "bg-amber-600 text-white",
    tagline: "Platform Terdalam untuk Industri Jasa Konstruksi Indonesia",
    desc: "Mahasiswa teknik sipil, instruktur BNSP, dosen vokasi, dan praktisi konstruksi — 971+ agent AI spesialis regulasi, K3, perizinan, tender, dan sertifikasi sudah siap pakai.",
    packs: [
      { name: "Paket Mahasiswa Teknik Konstruksi", agents: 8, subjects: ["Regulasi & Perpres 46/2025", "Manajemen Kontrak FIDIC", "K3 & SMK3", "Sertifikasi SKK/SBU", "Tender LPSE", "ISO 9001/14001", "Perizinan Usaha", "Asisten TA/Skripsi"], price: "Rp 199rb/bln", popular: true },
      { name: "Paket Dosen & Instruktur Vokasi", agents: 6, subjects: ["Regulasi konstruksi terkini", "AI dari silabus vokasi Anda", "Simulasi ujian SKK per skema", "Modul K3 interaktif", "Distribusi ke semua siswa", "Dashboard progress"], price: "Rp 299rb/bln" },
    ],
    usps: ["131 hub orchestrator siap pakai", "SCORECARD + Win Probability", "Regulasi real-time (Perpres 46/2025)", "Dikembangkan khusus industri Indonesia"],
  },
  {
    id: "uji-kompetensi",
    icon: ClipboardCheck,
    color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800",
    headerBg: "bg-indigo-100 dark:bg-indigo-950/50",
    title: "Tes Siap Uji Kompetensi",
    badge: "SKK / SKKNI / BNSP",
    badgeColor: "bg-indigo-600 text-white",
    tagline: "Simulasi Asesmen Kompetensi — Latihan Tanya-Jawab Gaya Assessor BNSP",
    desc: "AI mensimulasikan sesi asesmen nyata per unit kompetensi SKKNI: tanya-jawab gaya assessor, uji pemahaman regulasi, demonstrasi prosedur, dan rekap kesiapan sebelum hari H. Tersedia untuk semua skema jabatan kerja konstruksi.",
    packs: [
      { name: "Paket SKK Pelaksana Konstruksi", agents: 6, subjects: ["Simulasi asesmen per unit kompetensi", "Tanya-jawab gaya assessor BNSP", "Regulasi & SKKNI jabatan kerja", "Prosedur K3 & SMK3 praktis", "Dokumen portofolio & APL", "Rekap kesiapan & gap area"], price: "Rp 149rb/bln", popular: true },
      { name: "Paket SKK Tenaga Ahli Madya/Utama", agents: 5, subjects: ["Kompetensi manajerial & teknis", "Etika profesi & hukum konstruksi", "Simulasi wawancara assessor", "SKKNI multi-jabatan", "Strategi lolos sidang asesmen"], price: "Rp 199rb/bln" },
      { name: "Paket Persiapan BNSP Multi-Skema", agents: 4, subjects: ["Pemetaan skema per jabatan", "Unit kompetensi wajib & pilihan", "Simulasi portofolio & bukti kerja", "Latihan soal tulis asesmen"], price: "Rp 129rb/bln" },
    ],
    usps: [
      "Simulasi tanya-jawab persis gaya assessor BNSP",
      "Latihan per unit kompetensi SKKNI — tidak generik",
      "Rekap kesiapan: unit lulus, unit perlu diperkuat",
      "Panduan dokumen portofolio & APL",
    ],
  },
  {
    id: "uji-lisensi",
    icon: Scale,
    color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800",
    headerBg: "bg-rose-100 dark:bg-rose-950/50",
    title: "Tes Siap Uji Lisensi Praktek Kerja",
    badge: "SIPp / STRP / IUJK",
    badgeColor: "bg-rose-600 text-white",
    tagline: "Persiapan Ujian Lisensi Profesional — SIPp, STRP, IUJK & Izin Praktek Lainnya",
    desc: "Simulasi ujian lisensi praktek kerja yang sesungguhnya: soal regulasi Jasa Konstruksi, prosedur perizinan IUJK, standar kompetensi SIPp Perencana, STRP Teknik — dikerjakan bersama AI yang tahu aturan terkini.",
    packs: [
      { name: "Paket Siap Ujian SIPp Perencana", agents: 5, subjects: ["Regulasi perencanaan & tata bangunan", "Simulasi soal ujian SIPp", "Standar kompetensi perencana profesional", "Prosedur permohonan & perpanjangan", "Etika profesi Arsitek / Sipil"], price: "Rp 149rb/bln", popular: true },
      { name: "Paket Siap IUJK & Perizinan Usaha", agents: 5, subjects: ["Prosedur IUJK & OSS-RBA", "Regulasi Perpres 46/2025", "Simulasi soal ujian perizinan", "Klasifikasi & kualifikasi SBU", "Sanksi & kepatuhan hukum konstruksi"], price: "Rp 149rb/bln" },
      { name: "Paket Siap Ujian STRP Teknik", agents: 4, subjects: ["Regulasi teknik & standar SNI", "Simulasi soal ujian STRP", "Tanggung jawab profesional teknik", "Prosedur permohonan STRP"], price: "Rp 129rb/bln" },
    ],
    usps: [
      "Simulasi soal ujian lisensi — mirip ujian nyata",
      "Materi regulasi selalu diupdate (Perpres 46/2025)",
      "Panduan prosedur permohonan SIPp, STRP, IUJK",
      "Latihan etika profesi & tanggung jawab hukum",
    ],
  },
];

const comparison = [
  ["Jam belajar", "24/7 kapan saja", "Terjadwal, terbatas"],
  ["Biaya/bulan", "Rp 79rb – 299rb", "Rp 300rb – 1jt+"],
  ["Personalisasi", "Adaptif per pertanyaan", "Satu kurikulum semua"],
  ["Lokasi", "HP/PC di mana saja", "Harus hadir fisik"],
  ["Multi-subject", "Bundle semua sekaligus", "Bayar per mapel"],
  ["Progress tracking", "Otomatis via dashboard", "Manual / tidak ada"],
  ["Materi custom", "Upload materi sendiri", "Kurikulum baku"],
];

export default function EducationPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6">
            <GraduationCap className="h-4 w-4" />
            Bimbel Model Baru — AI Tutor Personal
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight">
            Ruang Belajar AI untuk{" "}
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-primary bg-clip-text text-transparent">
              Semua Peran
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Dari pelajar SMA yang ingin lolos UTBK & Sekolah Kedinasan, mahasiswa teknik yang butuh tutor TA, guru yang ingin buat ruang belajar digital, hingga HRD yang ingin onboarding karyawan otomatis — semua dalam satu platform AI.
          </p>

          {/* Quick persona pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {segments.map(s => (
              <a key={s.id} href={`#${s.id}`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${s.border} ${s.bg} ${s.color} text-xs font-semibold hover:shadow-sm transition-shadow`}>
                <s.icon className="h-3.5 w-3.5" />
                {s.title}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <a href={waLink("Halo, saya ingin konsultasi Ekosistem Belajar AI Gustafta. Bisa bantu?")} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2" data-testid="button-hero-wa">
                <MessageCircle className="h-5 w-5" />
                Konsultasi via WhatsApp
              </Button>
            </a>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/packs")} data-testid="button-hero-packs">
              <GraduationCap className="h-5 w-5" />
              Lihat Paket Bimbel
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y bg-muted/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-10 text-center">
            {[
              { value: "6", label: "Segmen Pengguna" },
              { value: "24/7", label: "AI Tutor Aktif" },
              { value: "Rp 79rb", label: "Mulai Dari" },
              { value: "971+", label: "Agent Spesialis" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison vs bimbel konvensional */}
      <section className="py-14 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">Kenapa AI vs Bimbel Konvensional?</Badge>
            <h2 className="text-2xl md:text-3xl font-bold">Lebih Pintar, Lebih Hemat, Lebih Fleksibel</h2>
          </div>
          <div className="rounded-2xl border overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 text-center text-xs font-bold border-b bg-muted/50">
              <div className="p-4 text-muted-foreground">Aspek</div>
              <div className="p-4 bg-primary/10 text-primary">Gustafta Belajar AI</div>
              <div className="p-4 text-muted-foreground">Bimbel Konvensional</div>
            </div>
            {comparison.map(([aspect, ai, konv], i) => (
              <div key={aspect} className={`grid grid-cols-3 text-center text-sm border-b last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                <div className="p-4 text-muted-foreground font-medium text-left pl-6">{aspect}</div>
                <div className="p-4 bg-primary/5 text-primary font-semibold">{ai}</div>
                <div className="p-4 text-muted-foreground">{konv}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-16">
          {segments.map((seg) => (
            <div key={seg.id} id={seg.id} className={`rounded-2xl border-2 ${seg.border} overflow-hidden`}>
              {/* Header */}
              <div className={`${seg.headerBg} px-6 py-5 border-b ${seg.border}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${seg.bg} border ${seg.border} flex items-center justify-center flex-shrink-0`}>
                    <seg.icon className={`h-6 w-6 ${seg.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl font-bold">{seg.title}</h2>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${seg.badgeColor}`}>{seg.badge}</span>
                    </div>
                    <p className={`text-sm font-semibold ${seg.color} mb-1`}>{seg.tagline}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{seg.desc}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* USPs */}
                <div className="grid sm:grid-cols-2 gap-2">
                  {seg.usps.map(u => (
                    <div key={u} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${seg.color}`} />
                      {u}
                    </div>
                  ))}
                </div>

                {/* Packs */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Paket Tersedia</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {seg.packs.map(pack => (
                      <div key={pack.name} className={`relative rounded-xl border ${seg.border} ${seg.bg} p-4 ${(pack as any).popular ? `ring-2 ring-offset-1` : ""}`} style={(pack as any).popular ? ({ringColor: "currentColor"} as any) : {}}>
                        {(pack as any).popular && (
                          <span className={`absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full ${seg.badgeColor}`}>POPULER</span>
                        )}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-bold text-sm">{pack.name}</p>
                          <span className={`font-bold text-sm ${seg.color} whitespace-nowrap`}>{pack.price}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2">{pack.agents} AI Agent aktif</p>
                        <div className="flex flex-wrap gap-1">
                          {pack.subjects.map(s => (
                            <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded border ${seg.border} ${seg.color} font-medium`}>{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-2 pt-1">
                  <a href={waLink(`Halo, saya tertarik dengan paket ${seg.title} di Gustafta. Bisa ceritakan lebih lanjut?`)} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="w-full gap-2" size="sm" data-testid={`button-wa-${seg.id}`}>
                      <MessageCircle className="h-3.5 w-3.5" />
                      Tanya via WhatsApp
                    </Button>
                  </a>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/store")} data-testid={`button-store-${seg.id}`}>
                    Lihat di Store <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/8 via-blue-500/5 to-transparent border-t">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Crown className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Mulai Ekosistem Belajar AI Anda</h2>
          <p className="text-muted-foreground mb-6">
            Mulai dari satu paket, tambah sesuai kebutuhan. Setup & konfigurasi oleh tim Gustafta — Anda langsung pakai.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={waLink("Halo, saya ingin mulai Ekosistem Belajar AI Gustafta. Bisa bantu proses ordernya?")} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2" data-testid="button-bottom-wa">
                <Phone className="h-5 w-5" />
                Order via WhatsApp
              </Button>
            </a>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/pricing")} data-testid="button-bottom-pricing">
              <TrendingUp className="h-4 w-4" />
              Lihat Paket Berlangganan
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Hosting mulai Rp 199rb/bln · Setup sekali bayar via Store · Tidak perlu coding
          </p>
        </div>
      </section>
    </div>
  );
}
