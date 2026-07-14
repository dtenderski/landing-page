import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, ArrowRight, MessageCircle, Sparkles, Brain,
  BookOpen, Users, Star, Heart, Shield, Infinity,
  GraduationCap, Briefcase, Building2, User, ChevronRight,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tahu%20tentang%20Gustafta%20Legacy%20%E2%80%94%20membangun%20AI%20Twin";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}


// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_LEGACY = [
  {
    icon: Briefcase,
    value: "US$31,5 Miliar",
    label: "Perusahaan Fortune 500 diperkirakan kehilangan ~US$31,5 miliar per tahun karena pengetahuan tidak dibagikan dan tidak terwariskan.",
    source: "IDC",
  },
  {
    icon: BookOpen,
    value: "US$47 Juta",
    label: "Rata-rata perusahaan besar kehilangan ~US$47 juta produktivitas per tahun akibat berbagi pengetahuan yang tidak efisien.",
    source: "Panopto & YouGov, 2018",
  },
  {
    icon: Users,
    value: "±20%",
    label: "Porsi penduduk Indonesia berusia 60+ diproyeksikan mencapai sekitar 20% (±63 juta orang) pada 2045 — gelombang pensiun para ahli senior.",
    source: "BPS & Bappenas",
  },
];

export default function LegacyPage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-legacy">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-violet-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
            <Infinity className="h-3.5 w-3.5" />
            Gustafta Legacy
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Suatu Hari Anda<br />Tidak Lagi Hadir.
          </h1>
          <p className="text-lg md:text-xl text-violet-200 mb-3 font-semibold">
            Apakah pengalaman 20 tahun Anda ikut hilang? Atau tetap hidup dan membantu orang lain?
          </p>
          <p className="text-sm md:text-base text-violet-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Gustafta Legacy membantu Anda merekam cara berpikir, mengajar, dan mengambil keputusan
            menjadi AI Twin yang terus bekerja — 24/7, tanpa lelah, tanpa pensiun.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={builderUrl}>
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-bangun-legacy">
                <Sparkles className="h-5 w-5" /> Bangun Legacy Saya
              </Button>
            </Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-tanya-legacy">
                <MessageCircle className="h-4 w-4" /> Pelajari Lebih Lanjut
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-violet-200 mt-8 justify-center">
            {["AI Twin aktif 24/7", "Warisan pengetahuan abadi", "Tanpa coding"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-violet-300" />{s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MASALAH ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
              Realita yang Sering Terabaikan
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Setiap Hari, Pengetahuan Berharga Hilang
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: "👴", title: "Saat Senior Pensiun", desc: "20 tahun pengalaman ikut pergi. Cara berpikir tidak terwariskan. Generasi berikutnya harus mulai dari nol." },
              { icon: "📚", title: "Saat Dosen Berhenti", desc: "Metode mengajar yang unik hilang. Insight dari puluhan tahun riset terkubur. Mahasiswa kehilangan mentor." },
              { icon: "🏢", title: "Saat Konsultan Mundur", desc: "Klien kehilangan penasihat terpercaya. Knowledge base perusahaan tidak terdokumentasi. Tim mulai ulang." },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border bg-white dark:bg-card p-5 flex flex-col gap-3 text-center">
                <span className="text-3xl">{p.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 italic">
            "Ini bukan sekadar kehilangan data. Ini kehilangan kearifan. Dan ini terjadi setiap hari."
          </p>
        </div>
      </section>

      {/* ── RISET ── */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-muted/20 dark:to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800">
              Menurut Data
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Pengetahuan yang Hilang Itu Mahal — dan Bisa Dicegah
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Data lembaga riset menunjukkan betapa besar nilai yang lenyap ketika kearifan tidak
              terdokumentasi — terlebih saat gelombang pensiun semakin dekat.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {STATS_LEGACY.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border bg-white dark:bg-card p-6 text-center" data-testid={`stat-legacy-${i}`}>
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <SIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{s.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{s.label}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">Sumber: {s.source}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[11px] text-gray-400 max-w-2xl mx-auto">
            Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.
          </p>
        </div>
      </section>

      {/* ── SOLUSI: AI TWIN ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800">
                Solusi
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Warisan Anda<br />
                <span className="text-violet-600 dark:text-violet-400">Tidak Harus Ikut Pergi</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Gustafta Legacy membantu Anda menciptakan AI Twin — sistem yang memahami nilai, cara berpikir,
                cara mengambil keputusan, dan cara Anda berkomunikasi.
              </p>
              <div className="space-y-3">
                {[
                  "AI menjawab dengan cara berpikir Anda",
                  "Tersedia 24/7 tanpa perlu kehadiran Anda",
                  "Terus belajar dan berkembang dari interaksi",
                  "Dapat diakses oleh siapa saja yang Anda izinkan",
                  "Warisan yang bertahan melampaui karier Anda",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* AI Twin visual */}
            <div className="rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-950/20 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-violet-200 dark:border-violet-500/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">AI Twin Anda</div>
                  <div className="text-[10px] text-violet-500 dark:text-violet-400">Aktif 24/7 · Berbasis pengetahuan Anda</div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </div>
              </div>
              {[
                { q: "Bagaimana Anda menangani konflik di proyek?", a: "Saya selalu mulai dengan memahami akar masalahnya. Dari pengalaman saya, 80% konflik proyek berasal dari ekspektasi yang tidak dikomunikasikan sejak awal..." },
                { q: "Metode analisis apa yang paling efektif?", a: "Tergantung konteksnya. Untuk konstruksi K3, saya lebih suka pendekatan risk-based yang saya kembangkan selama 15 tahun di lapangan..." },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-violet-500 text-white rounded-xl rounded-tr-sm px-3 py-2 text-xs max-w-[85%]">{item.q}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 shrink-0 mt-0.5" />
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-[85%]">{item.a}</div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-violet-200 dark:border-violet-500/20 flex items-center justify-between text-[10px] text-gray-400">
                <span>📚 Basis: 20+ tahun pengalaman</span>
                <span>🔒 Akses terkontrol</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Legacy Ini Untuk Anda</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: GraduationCap, emoji: "👨‍🏫", label: "Dosen & Pendidik", desc: "Metode mengajar Anda tetap hidup. Mahasiswa bisa belajar dari kearifan Anda selamanya — bahkan setelah pensiun.", output: "AI mengajar 24/7, bimbing skripsi, wariskan metode pengajaran" },
              { icon: Briefcase, emoji: "👨‍💼", label: "Konsultan Senior", desc: "Klien tetap bisa konsultasi. Pengetahuan Anda tetap berguna untuk industri jauh setelah Anda tidak aktif.", output: "AI Twin konsultasi 24/7, jawab pertanyaan spesifik industri" },
              { icon: Users, emoji: "🎓", label: "Instruktur & Trainer", desc: "Kurikulum dan cara mengajar Anda terus berjalan. Peserta belajar dari AI yang memahami konteks training Anda.", output: "AI modul training, simulasi soal, feedback otomatis" },
              { icon: Building2, emoji: "🏛️", label: "Pemimpin Organisasi", desc: "Nilai dan cara pengambilan keputusan Anda menjadi fondasi budaya organisasi yang abadi.", output: "AI panduan kebijakan, referensi keputusan strategis" },
              { icon: User, emoji: "👴", label: "Profesional Senior", desc: "20-30 tahun pengalaman lapangan yang Anda miliki terlalu berharga untuk hilang begitu saja.", output: "AI expert industri, mentoring generasi berikutnya" },
              { icon: Brain, emoji: "🔬", label: "Peneliti & Akademisi", desc: "Metodologi riset dan insight bertahun-tahun Anda tetap hidup dan bisa diakses komunitas ilmiah.", output: "AI referensi riset, panduan metodologi, arsip insight" },
            ].map((p) => (
              <div key={p.label} className="rounded-2xl border bg-white dark:bg-card p-5 flex flex-col gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.label}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                <div className="text-[10px] text-violet-600 dark:text-violet-400 font-medium border-t border-violet-100 dark:border-violet-500/20 pt-2">
                  → {p.output}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROSES MEMBANGUN ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Cara Membangun AI Twin Anda
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Proses guided — tidak perlu keahlian teknis apapun.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { step: "01", icon: "💬", title: "Dialog & Rekam Pengetahuan", desc: "Mulai dengan Dialog Gustafta — AI menggali pengetahuan, pengalaman, dan cara berpikir Anda melalui percakapan mendalam selama beberapa sesi." },
              { step: "02", icon: "📚", title: "Susun Knowledge Base", desc: "Upload PDF, rekaman, catatan, atau artikel yang mencerminkan keahlian Anda. AI mengindeks dan memahami konteks setiap konten." },
              { step: "03", icon: "🤖", title: "Konfigurasi Persona AI", desc: "Tentukan karakter, nada bicara, batasan, dan domain keahlian AI Twin Anda. AI akan merespons sesuai cara Anda seharusnya merespons." },
              { step: "04", icon: "🌐", title: "Deploy & Bagikan", desc: "AI Twin aktif via web widget, WhatsApp, atau API. Bagikan ke mahasiswa, kolega, klien, atau publik sesuai setting yang Anda tentukan." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border bg-white dark:bg-card p-6 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-700 to-indigo-800 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🏛️</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Warisan Anda Dimulai Hari Ini
          </h2>
          <p className="text-violet-100 text-sm mb-2 leading-relaxed">
            Setiap hari yang berlalu tanpa mendokumentasikan pengetahuan Anda adalah kehilangan yang tidak bisa dikembalikan.
          </p>
          <p className="text-violet-200 text-sm mb-8">
            Mulai sekarang — bahkan 30 menit pertama sudah menghasilkan fondasi AI Twin Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={builderUrl}>
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-final-legacy">
                <Sparkles className="h-5 w-5" /> Bangun AI Twin Saya
              </Button>
            </Link>
            <Link href="/konsultasi">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-cta-dialog-legacy">
                Mulai dengan Dialog Dulu <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-gray-50 dark:bg-muted/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">GUSTAFTA LEGACY</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Warisan pengetahuan yang abadi melalui AI.</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-violet-600">Beranda</Link>
            <Link href="/konsultasi" className="hover:text-violet-600">Dialog Gustafta</Link>
            <Link href="/produk" className="hover:text-violet-600">Produk</Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-violet-600 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
