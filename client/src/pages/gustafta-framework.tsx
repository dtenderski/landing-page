import { SharedHeader } from "@/components/shared-header";
import { Link } from "wouter";
import { ChevronRight, Printer, Lock, ShoppingCart, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function FrameworkLocked() {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SharedHeader />

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/"><span className="hover:text-foreground cursor-pointer">Beranda</span></Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/panduan"><span className="hover:text-foreground cursor-pointer">Belajar</span></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">GUSTAFTA Framework™</span>
        </nav>
      </div>

      {/* Teaser cover */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-br from-blue-600 to-violet-700 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            GUSTAFTA Framework™
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
            Metode Konversi Pengetahuan<br />
            <span className="text-blue-600">Menjadi Aset AI</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            Kerangka berpikir khas GUSTAFTA — bagaimana mengubah pengetahuan yang Anda miliki
            menjadi AI yang benar-benar bekerja, tanpa coding.
          </p>
        </div>

        {/* Teaser — 7 bagian blurred */}
        <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Preview tipis yang terlihat */}
          <div className="p-6 bg-white dark:bg-card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Dokumen ini berisi 7 bagian:</p>
            <div className="space-y-2">
              {[
                "01 · Prinsip Dasar — 3 fondasi berpikir Perakit AI",
                "02 · Dua Dunia — AI Enthusiast vs Profesional",
                "03 · Lima Tahap Perjalanan + Alur Transformasi",
                "04 · Model Konversi: Pengetahuan → Builder → Teman Berpikir Digital",
                "05 · Identitas Bertingkat: Pemula → Profesional → Creator → Enterprise",
                "06 · Ekosistem 6 Pilar GUSTAFTA",
                "07 · Bahasa Merek Khas GUSTAFTA",
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 ${i < 2 ? "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-muted/20" : "text-gray-300 dark:text-gray-600"}`}>
                  <span className={`text-base ${i < 2 ? "" : "grayscale opacity-30"}`}>
                    {["🔑","🌐","🗺","⚙️","🏅","🏗","💬"][i]}
                  </span>
                  <span className={i >= 2 ? "blur-[3px] select-none" : ""}>{item}</span>
                  {i >= 2 && <Lock className="h-3 w-3 ml-auto text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Overlay kunci */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white/95 dark:from-background/95 via-white/60 dark:via-background/60 to-transparent pt-20">
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl text-center max-w-sm mx-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Dokumen Eksklusif Starter Kit
              </h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mb-6 leading-relaxed">
                GUSTAFTA Framework™ adalah bagian dari <strong className="text-gray-700 dark:text-gray-300">Starter Kit</strong>.
                Login atau dapatkan akses dengan memiliki Starter Kit.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="/api/login"
                  className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold py-2.5 px-5 rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  <LogIn className="h-4 w-4" /> Masuk ke Akun Saya
                </a>
                <Link href="/starter-kit">
                  <div className="inline-flex items-center justify-center gap-2 w-full border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer">
                    <ShoppingCart className="h-4 w-4" /> Tanya Info Pembayaran via WA
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Nilai yang didapat */}
        <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
          {[
            { emoji: "🔑", label: "Hanya untuk pembeli", desc: "Eksklusif bagian dari Starter Kit GUSTAFTA" },
            { emoji: "🖨", label: "Cetak & Simpan PDF", desc: "Dokumen siap cetak, simpan selamanya" },
            { emoji: "🔄", label: "Update gratis", desc: "Framework diperbarui, akses Anda tetap aktif" },
          ].map((v) => (
            <div key={v.label} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{v.emoji}</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{v.label}</div>
              <div className="text-xs text-gray-400">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GustaFtaFrameworkPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FrameworkLocked />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SharedHeader />

      {/* Print button - hanya tampil di screen */}
      <div className="no-print max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/"><span className="hover:text-foreground cursor-pointer">Beranda</span></Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/panduan"><span className="hover:text-foreground cursor-pointer">Belajar</span></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">GUSTAFTA Framework™</span>
        </nav>
        <button
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* ── DOKUMEN FRAMEWORK ── */}
      <main className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">

        {/* COVER */}
        <section className="mb-12 text-center border-b pb-10">
          <div className="inline-block bg-gradient-to-br from-blue-600 to-violet-700 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            GUSTAFTA Framework™
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
            Metode Konversi Pengetahuan<br />
            <span className="text-blue-600">Menjadi Aset AI</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            Kerangka berpikir dan pendekatan khas GUSTAFTA dalam membantu siapa pun
            mengubah pengetahuan yang mereka miliki menjadi AI yang benar-benar bekerja —
            tanpa harus bisa coding.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-gray-400">
            <span>© 2026 GUSTAFTA · Platform untuk Para Perakit AI</span>
            <span>·</span>
            <span>Dokumen ini bagian dari Starter Kit GUSTAFTA</span>
          </div>
        </section>

        {/* BAGIAN 1: PRINSIP DASAR */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prinsip Dasar</h2>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 mb-6 text-center">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              Semua Orang Punya Pengetahuan.<br />
              <span className="text-blue-600">Kini Saatnya Merakitnya Menjadi AI.</span>
            </p>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              GUSTAFTA bukan sekadar chatbot builder. GUSTAFTA adalah platform konversi pengetahuan
              menjadi aset AI yang menciptakan nilai — bagi diri sendiri, tim, organisasi, dan pelanggan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "Pengetahuan adalah Modal",
                desc: "Pengalaman kerja, kompetensi profesi, SOP, regulasi, metode, dan keahlian yang Anda miliki adalah bahan baku AI. Bukan coding. Bukan gelar IT.",
              },
              {
                num: "02",
                title: "AI Memperkuat, Bukan Menggantikan",
                desc: "AI tidak menggantikan keahlian Anda. AI membuat keahlian Anda menjangkau lebih banyak orang, bekerja 24/7, dan menghasilkan nilai yang berkelipat.",
              },
              {
                num: "03",
                title: "Merakit, Bukan Membuat dari Nol",
                desc: "Seperti IKEA — Anda tidak membuat furnitur dari kayu. Anda merakit dari komponen yang sudah tersedia. Gustafta menyediakan semua komponennya.",
              },
            ].map((item) => (
              <div key={item.num} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="text-xs font-bold text-blue-600 mb-2">{item.num}</div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BAGIAN 2: DUA DUNIA */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dua Titik Awal, Satu Tujuan</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-6">
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Dunia Pertama — AI Enthusiast</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                "Saya sudah belajar AI, tapi belum bisa membuat AI yang benar-benar bekerja."
              </p>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Sudah kenal ChatGPT, AI Agent, Prompt Engineering</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Butuh eksekusi nyata, bukan teori lagi</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span> Ingin hasil: produk AI yang bisa dipakai atau dijual</li>
              </ul>
            </div>
            <div className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 rounded-xl p-6">
              <div className="text-2xl mb-2">👷</div>
              <div className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Dunia Kedua — Profesional & Bisnis</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                "Saya ahli di bidang saya, tapi tidak tahu cara mengubah keahlian itu menjadi AI."
              </p>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">→</span> Punya pengalaman, SOP, regulasi, metode kerja</li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">→</span> Butuh konversi pengetahuan, bukan coding</li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">→</span> Ingin hasil: AI yang membantu tim dan pelanggan</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl p-5 text-white text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Titik Temu</p>
            <p className="text-lg font-bold">Apa pun titik awal Anda… Tujuan kita sama.</p>
            <p className="text-yellow-300 text-xl font-bold">Menjadi Perakit AI.</p>
          </div>
        </section>

        {/* BAGIAN 3: 5-STAGE JOURNEY */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lima Tahap Perjalanan Perakit AI</h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
            Framework ini bukan hanya menu navigasi — ini adalah <strong className="text-gray-700 dark:text-gray-300">value ladder transformasi</strong>.
            Setiap tahap membangun fondasi untuk tahap berikutnya.
          </p>

          <div className="space-y-3">
            {[
              {
                num: "01", emoji: "📚", label: "BELAJAR",
                tagline: "Saya ingin memahami AI.",
                color: "border-l-green-500 bg-green-50 dark:bg-green-950/20",
                badge: "bg-green-600",
                product: "Entry Product: Starter Kit",
                desc: "Pahami cara berpikir sebagai Perakit AI. Bukan sekadar teori — tapi mindset shift dari konsumen AI menjadi pembuat AI.",
                output: "Siap merakit chatbot pertama",
              },
              {
                num: "02", emoji: "🛠", label: "MERAKIT AI",
                tagline: "Saya ingin membuat AI.",
                color: "border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
                badge: "bg-indigo-600",
                product: "Core Product: GUSTAFTA Builder",
                desc: "Rakit AI Assistant, Chatbot AI, AI Agent, Multi-Agent, Knowledge Base, dan Mini Apps — semua secara visual tanpa coding.",
                output: "AI yang bekerja untuk Anda",
              },
              {
                num: "03", emoji: "⚡", label: "MENGGUNAKAN AI",
                tagline: "Saya ingin AI membantu pekerjaan saya.",
                color: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
                badge: "bg-blue-600",
                product: "Distribution: Produk AI & Store Gustafta",
                desc: "Gunakan AI untuk membantu pelanggan, menghasilkan dokumen, mendukung tim, dan menyelesaikan pekerjaan sehari-hari.",
                output: "Produktivitas & efisiensi nyata",
              },
              {
                num: "04", emoji: "💡", label: "MENGHASILKAN NILAI",
                tagline: "Saya ingin AI menjadi sumber nilai.",
                color: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
                badge: "bg-amber-600",
                product: "Platform Kompetensi & Kemitraan",
                desc: "Nilai bukan hanya uang — bisa berupa reputasi, produktivitas, kompetensi, layanan baru, atau penghasilan dari hasil rakitan.",
                output: "AI sebagai aset menghasilkan",
              },
              {
                num: "05", emoji: "🚀", label: "BERKEMBANG",
                tagline: "Saya ingin membangun bisnis AI.",
                color: "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20",
                badge: "bg-orange-600",
                product: "Premium: AI Studio + Kemitraan",
                desc: "Dari Perakit menjadi pelaku bisnis AI. Dua jalur: naik level jadi Konsultan/Creator, atau bangun ekosistem AI untuk organisasi.",
                output: "Bisnis & ekosistem AI",
              },
            ].map((stage, i) => (
              <div key={stage.num} className={`border-l-4 ${stage.color} rounded-r-xl p-5`}>
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex items-center gap-3 md:w-48 shrink-0">
                    <div className={`w-7 h-7 rounded-lg ${stage.badge} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                      {stage.num}
                    </div>
                    <div>
                      <span className="text-base mr-1.5">{stage.emoji}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${stage.badge}`}>{stage.label}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 italic mb-1">"{stage.tagline}"</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{stage.desc}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-gray-400">{stage.product}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Output: {stage.output}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual journey arrow */}
          <div className="mt-6 bg-gray-50 dark:bg-muted/20 rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-4">Alur Transformasi</p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
              {[
                { label: "Pengetahuan", color: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" },
                { arrow: true },
                { label: "Belajar", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
                { arrow: true },
                { label: "Merakit AI", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
                { arrow: true },
                { label: "Menggunakan", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
                { arrow: true },
                { label: "Menghasilkan", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
                { arrow: true },
                { label: "Berkembang", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
                { arrow: true },
                { label: "Bisnis AI", color: "bg-gray-900 text-white dark:bg-white dark:text-gray-900" },
              ].map((item, i) =>
                item.arrow ? (
                  <span key={i} className="text-gray-400">→</span>
                ) : (
                  <span key={i} className={`px-2.5 py-1 rounded-full ${item.color}`}>{item.label}</span>
                )
              )}
            </div>
          </div>
        </section>

        {/* BAGIAN 4: KONVERSI PENGETAHUAN */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">4</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Konversi Pengetahuan → AI</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {/* Input */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Input — Pengetahuan Anda</p>
              <div className="space-y-2">
                {[
                  "Pengalaman kerja bertahun-tahun",
                  "Kompetensi & sertifikasi profesi",
                  "SOP & prosedur standar",
                  "Regulasi & kebijakan domain",
                  "Modul pelatihan & materi ajar",
                  "Metode kerja yang terbukti",
                  "Ide & inovasi bisnis",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Proses */}
            <div className="border-2 border-blue-400 dark:border-blue-600 rounded-xl p-5 bg-blue-50 dark:bg-blue-950/20">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 text-center">Proses — GUSTAFTA Builder</p>
              <div className="space-y-3">
                {[
                  { step: "1", label: "Definisi Persona AI", desc: "Karakter, keahlian, dan gaya bicara" },
                  { step: "2", label: "Strukturisasi Knowledge", desc: "Upload dokumen, regulasi, SOP" },
                  { step: "3", label: "Konfigurasi Kemampuan", desc: "Mini Apps, Agentic AI, dokumen generator" },
                  { step: "4", label: "Deploy & Integrasikan", desc: "Widget, WhatsApp, link publik" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-100">{s.label}</div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-300">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Output — Teman Berpikir Digital</p>
              <div className="space-y-2">
                {[
                  "Menjawab pertanyaan 24/7",
                  "Membantu tim & pelanggan",
                  "Menghasilkan dokumen & laporan",
                  "Melakukan asesmen & evaluasi",
                  "Menghitung & menganalisis data",
                  "Menjadi produk digital yang dijual",
                  "Mendukung proses sertifikasi",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BAGIAN 5: IDENTITAS PERAKIT AI */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">5</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Identitas Bertingkat — Perakit AI</h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
            GUSTAFTA Framework™ mendefinisikan level pertumbuhan pengguna sebagai identitas, bukan hanya tier langganan.
            Setiap level memiliki kemampuan, produk, dan peran yang berbeda dalam ekosistem.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                emoji: "🌱", level: "Perakit Pemula", cert: "Certified AI Assembler Lvl 1",
                color: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20",
                badge: "text-green-700 dark:text-green-300",
                ciri: ["Punya chatbot pertama", "Paham persona & knowledge base", "Bisa demo ke orang lain"],
              },
              {
                emoji: "🛠", level: "Perakit Profesional", cert: "Certified AI Assembler Lvl 2",
                color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
                badge: "text-blue-700 dark:text-blue-300",
                ciri: ["Multi-agent & Agentic AI", "Knowledge base terstruktur", "Chatbot untuk klien/tim"],
              },
              {
                emoji: "🚀", level: "Perakit Lanjutan", cert: "Certified AI Assembler Pro",
                color: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20",
                badge: "text-violet-700 dark:text-violet-300",
                ciri: ["Bangun tim AI multi-agen", "Deploy untuk klien & organisasi", "Jadi referensi komunitas"],
              },
              {
                emoji: "🏢", level: "Perakit Enterprise", cert: "Master AI Assembler",
                color: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20",
                badge: "text-orange-700 dark:text-orange-300",
                ciri: ["Kelola ekosistem AI organisasi", "Trainer & mentor resmi", "Partner Program"],
              },
            ].map((lvl) => (
              <div key={lvl.level} className={`border ${lvl.color} rounded-xl p-5`}>
                <div className="text-2xl mb-2">{lvl.emoji}</div>
                <div className={`text-xs font-bold ${lvl.badge} mb-1`}>{lvl.level}</div>
                <div className="text-[10px] text-gray-400 italic mb-3">{lvl.cert}</div>
                <ul className="space-y-1">
                  {lvl.ciri.map((c) => (
                    <li key={c} className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">·</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* BAGIAN 6: EKOSISTEM 6 PILAR */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center font-bold text-sm shrink-0">6</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ekosistem GUSTAFTA — 6 Pilar</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: "⚙️", num: "P1", label: "AI Platform",
                sub: "Operating System Ekosistem",
                desc: "Builder, Knowledge Base, Persona, Agentic AI, Multi-Agent, Mini Apps, Widget, Analytics, Broadcast.",
                color: "border-blue-200 dark:border-blue-800",
              },
              {
                icon: "🤖", num: "P2", label: "AI Solutions",
                sub: "AI Siap Pakai per Industri",
                desc: "AI Konstruksi, AI Hukum, AI Pendidikan, AI HR, AI Energi, AI Pertambangan, AI Properti, dan 30+ sektor lainnya.",
                color: "border-emerald-200 dark:border-emerald-800",
              },
              {
                icon: "🎓", num: "P3", label: "AI Academy",
                sub: "Belajar Menjadi Perakit AI",
                desc: "Starter Kit, Workshop, Mentoring, Sertifikasi, Creator Program, Learning Path, Assessment, Badge, PKB.",
                color: "border-violet-200 dark:border-violet-800",
              },
              {
                icon: "🏗️", num: "P4", label: "AI Studio",
                sub: "Consulting Division — Kami Rakitkan",
                desc: "Custom AI, Knowledge Engineering, Onboarding, Prompt Engineering, Corporate Training.",
                color: "border-amber-200 dark:border-amber-800",
              },
              {
                icon: "🏪", num: "P5", label: "AI Marketplace",
                sub: "Creator Economy",
                desc: "Jual chatbot, prompt, knowledge pack, mini apps, template, workflow, persona, blueprint, plugin.",
                color: "border-rose-200 dark:border-rose-800",
              },
              {
                icon: "🤝", num: "P6", label: "AI Network",
                sub: "Komunitas & Ekosistem Manusia",
                desc: "Creator, Affiliate, Partner, Reseller, Trainer, Konsultan, Mentor, LSP, Universitas, Asosiasi.",
                color: "border-slate-200 dark:border-slate-700",
              },
            ].map((p) => (
              <div key={p.num} className={`border ${p.color} rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400">{p.num}</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{p.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{p.sub}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BAGIAN 7: BRAND LANGUAGE */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0">7</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bahasa Merek — Istilah Khas GUSTAFTA</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Istilah</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Makna</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Posisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  ["Merakit AI", "Aktivitas utama pengguna", "Kata kerja / aktivitas"],
                  ["Perakit AI", "Identitas pengguna Gustafta", "Identitas / profesi"],
                  ["Hasil Rakitan AI", "Chatbot / AI Agent / AI Assistant", "Output produk"],
                  ["Bengkel AI GUSTAFTA", "Area Builder — tempat konfigurasi", "Nama area platform"],
                  ["Toolkit Perakit AI", "Starter Kit, template, prompt, playbook", "Nama paket produk"],
                  ["Teman Berpikir Digital", "Output akhir — AI yang membantu", "Nama hasil rakitan"],
                  ["GUSTAFTA Framework™", "Metode membangun AI dari pengetahuan", "Nama metodologi"],
                ].map(([term, meaning, pos]) => (
                  <tr key={term} className="hover:bg-gray-50 dark:hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-xs">{term}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{meaning}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-xs italic">{pos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-xs font-bold text-red-600 mb-2">❌ Yang Tidak Boleh Digunakan:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "\"ebook\" sebagai nama produk utama",
                "\"chatbot builder\" sebagai satu-satunya deskripsi",
                "Build/Buy/Learn/Services (bahasa Inggris) sebagai menu",
              ].map((item) => (
                <span key={item} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">{item}</span>
              ))}
            </div>
          </div>
        </section>

        {/* PENUTUP */}
        <section className="border-t pt-10 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-2xl p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">Closing Statement</p>
            <h2 className="text-2xl font-bold mb-3">
              AI Tidak Menggantikan Keahlian Anda.
            </h2>
            <p className="text-xl font-bold text-yellow-300 mb-4">
              AI Memperkuat Keahlian Anda.
            </p>
            <p className="text-blue-100 text-sm max-w-lg mx-auto leading-relaxed">
              Karena yang paling berharga bukan teknologinya.<br />
              Tetapi <strong className="text-white">pengetahuan yang Anda miliki.</strong><br />
              GUSTAFTA hadir untuk membantu Anda mengubahnya menjadi AI yang bekerja.
            </p>
            <div className="mt-6 text-xs text-blue-200">
              GUSTAFTA · Platform untuk Para Perakit AI · gustafta.com
            </div>
          </div>
        </section>

      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
