import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, GraduationCap, Award,
  BookOpen, Target, Users, TrendingUp,
  CalendarCheck, ShieldCheck, BarChart3, XCircle, AlertTriangle, Clock,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20PKB%20Konstruksi";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const SKK_TRACKS = [
  { label: "Manajemen Konstruksi", claw: "ManprojakClaw", color: "indigo", jobs: ["Manajer Proyek", "Site Manager", "Manajer Konstruksi", "Pengawas Lapangan"] },
  { label: "Arsitektur", claw: "ArsitekturClaw", color: "rose", jobs: ["Arsitek Muda/Madya/Utama", "Desainer Interior", "Urban Planner"] },
  { label: "Teknik Sipil – Jalan & Jembatan", claw: "JalanJembatanClaw", color: "yellow", jobs: ["Ahli Jalan Muda/Madya/Utama", "Ahli Jembatan", "Pemeliharaan Jalan"] },
  { label: "Teknik Sipil – Geoteknik", claw: "GeoteknikClaw", color: "stone", jobs: ["Ahli Geoteknik Muda/Madya", "Inspektur Pondasi", "Ahli Mekanika Tanah"] },
  { label: "Tata Lingkungan", claw: "TataLingkunganClaw", color: "green", jobs: ["Ahli Lingkungan Muda/Madya", "Pengawas Lingkungan", "Sanitasi & Drainase"] },
  { label: "Elektrikal", claw: "ElektrikalClaw", color: "blue", jobs: ["Ahli Elektrikal Muda/Madya", "Ahli K3 Listrik", "Tenaga Teknik Ketenagalistrikan"] },
  { label: "K3 Konstruksi", claw: "SafiraClaw", color: "red", jobs: ["Ahli K3 Muda/Madya/Utama", "Petugas K3 Konstruksi", "Safety Officer"] },
  { label: "Pengawasan", claw: "PengawasClaw", color: "orange", jobs: ["Pengawas Bangunan Gedung", "Pengawas Jalan & Jembatan", "Pengawas MEP"] },
];

const colorTag: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  rose:   "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  stone:  "bg-stone-100 text-stone-700 dark:bg-stone-800/30 dark:text-stone-400",
  green:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  red:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function PkbPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-pkb">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <GraduationCap className="h-3.5 w-3.5" />
                AI untuk PKB & Sertifikasi Kompetensi Konstruksi
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                SKK Anda 5 Tahun Dibangun,<br />
                <span className="text-violet-200">Kedaluwarsa karena Salah Persiapan PKB</span>
              </h1>
              <p className="text-base text-violet-100 mb-4 leading-relaxed">
                Banyak tenaga ahli konstruksi kehilangan SKK bukan karena tidak kompeten —
                tapi karena poin PKB tidak terpenuhi, dokumen portofolio tidak optimal,
                atau salah memilih skema asesmen di LSP.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-violet-100">
                AI Gustafta memandu perencanaan PKB, simulasi asesmen SKK per jabatan & jenjang, dan roadmap karir konstruksi yang terarah.
              </div>
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
                { num: "8+", label: "Jalur SKK Didukung", sub: "Sipil, Arsitektur, K3, Elektrikal…" },
                { num: "7", label: "Sub-Agen per Claw", sub: "Analisis kompetensi mendalam" },
                { num: "SKKNI", label: "Basis Kompetensi", sub: "Terstandar Kemnaker & BNSP" },
                { num: "24/7", label: "Tutor SKK Online", sub: "Simulasi asesmen kapan saja" },
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

      {/* ── I: INTEREST — Risiko SKK kedaluwarsa ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Risiko yang Sering Diremehkan</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Apa yang Terjadi Jika SKK Anda Kedaluwarsa?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <AlertTriangle className="h-5 w-5 text-red-400" />, title: "Tidak Bisa Ditugaskan di Proyek", value: "Langsung berlaku", desc: "SKK kedaluwarsa membuat Anda tidak bisa menjadi personel manajerial di proyek yang memerlukan SKK aktif — karir terhenti tiba-tiba." },
              { icon: <Clock className="h-5 w-5 text-amber-400" />, title: "Proses Perpanjangan Bisa Gagal", value: "Poin PKB kurang", desc: "Jika poin Satuan Kredit Kompetensi (SKK) dari kegiatan PKB tidak terpenuhi, perpanjangan SKK tidak bisa diproses meski Anda ahli di bidangnya." },
              { icon: <XCircle className="h-5 w-5 text-red-400" />, title: "BUJK Kehilangan Personel Kunci", value: "Dampak ke SBU", desc: "Personel SKK yang tidak aktif bisa membuat BUJK tidak memenuhi persyaratan personel untuk SBU — berisiko ke kualifikasi perusahaan." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.title}</span></div>
                <div className="text-xl font-extrabold text-violet-300 mb-2">{item.value}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-5 text-center">
            <p className="text-violet-100 font-semibold mb-1">PKB bukan formalitas — ini adalah jalur satu-satunya untuk mempertahankan kompetensi yang sudah Anda bangun bertahun-tahun.</p>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">AI Gustafta membantu Anda merencanakan PKB secara sistematis, memilih kegiatan yang tepat, dan mempersiapkan asesmen perpanjangan dengan simulasi pertanyaan berbasis SKKNI.</p>
          </div>
        </div>
      </section>

      {/* PKB Explanation */}
      <section className="py-12 px-4 bg-violet-50 dark:bg-violet-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl border border-violet-200 dark:border-violet-800 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-600" /> Apa itu PKB Konstruksi?
            </h2>
            <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed mb-4">
              <strong>Pengembangan Keprofesian Berkelanjutan (PKB)</strong> adalah proses pengembangan kompetensi wajib bagi pemegang SKK untuk mempertahankan dan meningkatkan kompetensinya. Meliputi pendidikan, pelatihan, seminar, karya tulis, dan pekerjaan profesional yang terakumulasi dalam poin Satuan Kredit Kompetensi (SKK) tahunan.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: <CalendarCheck className="h-4 w-4 text-violet-600" />, label: "Siklus PKB", val: "Setiap 5 tahun untuk mempertahankan SKK (perpanjangan)" },
                { icon: <BarChart3 className="h-4 w-4 text-violet-600" />, label: "Poin SKK", val: "Akumulasi poin dari kegiatan PKB yang diakui LPJK/BNSP" },
                { icon: <ShieldCheck className="h-4 w-4 text-violet-600" />, label: "Dasar Hukum", val: "PP 14/2021, Permen PUPR No. 8/2022, SE LPJK" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
                  <div className="p-1.5 bg-white dark:bg-background rounded-lg flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs text-gray-700 dark:text-muted-foreground mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — AI Tools + SKK Tracks ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Layanan AI</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">AI Tools untuk Perjalanan PKB Anda</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Dari tanya jawab SKK hingga simulasi asesmen per jabatan — semua tersedia 24/7.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: <Target className="h-6 w-6 text-violet-600" />,
                title: "PanduanASKOM — Tanya Jawab SKK",
                masalah: "Pertanyaan tentang persyaratan SKK membutuhkan riset panjang di dokumen SKKNI dan regulasi LPJK",
                solusi: "PanduanASKOM menjawab semua pertanyaan SKK secara instan — persyaratan, dokumen, dan alur asesmen",
                features: ["Persyaratan SKK per jabatan & jenjang", "Alur proses asesmen di LSP/BNSP", "Panduan penyusunan portofolio", "Skema SKK per bidang pekerjaan"],
              },
              {
                icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
                title: "ManprojakClaw — SKK Manajemen Konstruksi",
                masalah: "Persiapan asesmen SKK Manajemen Pelaksanaan memerlukan pemahaman mendalam SKKNI yang kompleks",
                solusi: "ManprojakClaw mensimulasikan pertanyaan asesmen dan memandu persiapan portofolio Manajer Proyek & Site Manager",
                features: ["Simulasi pertanyaan asesmen SKK", "Pemetaan unit kompetensi per jabatan", "Panduan portofolio manajemen proyek", "Roadmap karir manajer konstruksi"],
              },
              {
                icon: <Award className="h-6 w-6 text-rose-600" />,
                title: "Claw per Spesialisasi (8 Bidang)",
                masalah: "Setiap bidang SKK memiliki SKKNI dan unit kompetensi yang berbeda — sulit dipelajari tanpa panduan khusus",
                solusi: "ArsitekturClaw, SipilClaw, GeoteknikClaw, JalanJembatanClaw, dan 4 Claw lainnya — masing-masing spesialis di bidangnya",
                features: ["7 sub-agen per Claw spesialisasi", "Materi uji kompetensi berbasis SKKNI", "Simulasi studi kasus per jabatan", "Update regulasi & persyaratan terbaru"],
              },
              {
                icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
                title: "TerasLPJK#1 — Sharing Knowledge SKK",
                masalah: "Pengalaman praktis tentang proses asesmen SKK sulit ditemukan — banyak info tidak resmi dan tidak akurat",
                solusi: "TerasLPJK#1 mengumpulkan pengetahuan praktisi berpengalaman: tips lolos asesmen dan update regulasi terbaru dari LPJK",
                features: ["5 sub-agen pengetahuan sertifikasi", "Tips & trik lolos asesmen SKK", "Update regulasi LPJK terbaru", "Q&A berbasis pengalaman praktisi"],
              },
            ].map((item, i) => (
              <div key={i} className="bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-800/30 p-6" data-testid={`card-service-${i}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-xl">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{item.title}</h3>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-3 py-2 mb-2">
                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-0.5">Masalah:</p>
                  <p className="text-xs text-red-700 dark:text-red-300">{item.masalah}</p>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 px-3 py-2 mb-4">
                  <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mb-0.5">Solusi:</p>
                  <p className="text-xs text-green-700 dark:text-green-300">{item.solusi}</p>
                </div>
                <ul className="space-y-1.5">
                  {item.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Jalur SKK */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Jalur SKK</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">8 Jalur SKK yang Didukung Penuh</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SKK_TRACKS.map((track, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4" data-testid={`card-track-${i}`}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorTag[track.color]}`}>{track.claw}</span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs mt-2 mb-2">{track.label}</h3>
                <ul className="space-y-1">
                  {track.jobs.map((job, j) => (
                    <li key={j} className="text-[11px] text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />{job}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Untuk Siapa + Menurut Data */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Untuk Siapa</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Siapa yang Paling Diuntungkan?</h2>
              <div className="space-y-3">
                {[
                  { icon: <Users className="h-4 w-4 text-violet-500" />, title: "Tenaga Ahli Konstruksi", points: ["Pemegang SKK yang akan perpanjang", "Tenaga ahli muda yang baru lulus", "Profesional yang ingin naik jenjang"] },
                  { icon: <GraduationCap className="h-4 w-4 text-blue-500" />, title: "Asesor & Trainer", points: ["Asesor LSP yang ingin update materi", "Trainer sertifikasi SKK", "Fasilitator pelatihan konstruksi"] },
                  { icon: <Award className="h-4 w-4 text-amber-500" />, title: "BUJK & Asosiasi", points: ["HR Manager yang urus SKK karyawan", "GAPENSI, INKINDO, HAKI member", "Staf asosiasi yang urus PKB member"] },
                ].map((group, i) => (
                  <div key={i} className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {group.points.map((pt, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                          <Check className="h-3 w-3 text-violet-500 flex-shrink-0" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Menurut Data</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sertifikasi Kompetensi Konstruksi</h2>
              <div className="space-y-4">
                {[
                  { value: "±8,76 juta", label: "Tenaga kerja di sektor konstruksi Indonesia", source: "BPS, Sakernas 2024", icon: <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" /> },
                  { value: "548.977", label: "Sertifikat Kompetensi Kerja (SKK) konstruksi yang telah terbit", source: "LPJK / Kementerian PUPR", icon: <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" /> },
                  { value: "4,86%", label: "Tenaga kerja konstruksi yang telah bersertifikat kompetensi", source: "LPJK / BPS Sakernas", icon: <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" /> },
                ].map((s, i) => (
                  <div key={i} className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-100 dark:border-border flex items-start gap-3" data-testid={`card-research-${i}`}>
                    <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">{s.icon}</div>
                    <div>
                      <div className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">{s.value}</div>
                      <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mt-0.5">{s.label}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Sumber: {s.source}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">SKK Anda Terlalu Berharga untuk Kedaluwarsa</h2>
          <p className="text-violet-100 mb-2">Mulai rencanakan PKB sekarang — jangan tunggu 3 bulan sebelum deadline perpanjangan.</p>
          <p className="text-violet-200 text-sm mb-8">Simulasi asesmen 24/7 · Panduan portofolio per jabatan · Update regulasi LPJK terbaru</p>
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
            <Link href="/lkut"><span className="underline font-semibold cursor-pointer">LKUT BUJK →</span></Link>
            {" · "}
            <Link href="/konstruksi"><span className="underline font-semibold cursor-pointer">AI Konstruksi Lengkap →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <Link href="/lkut"><span className="hover:text-white cursor-pointer">LKUT BUJK</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
