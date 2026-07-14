import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  trackLead, trackViewContent, trackContact,
  trackInitiateCheckout, trackCustomEvent, withMetaAttribution,
} from "@/hooks/use-meta-pixel";
import {
  Flame, Check, Star, Lightbulb, Users, Zap, Target, BadgeCheck,
  BookOpen, Brain, GraduationCap, Briefcase, ChevronRight,
} from "lucide-react";
import { TRILOGI } from "@/data/pricing";
import coverFlat from "@assets/Monolog-_cover_1781287565935.jpg";
import cover3D from "@assets/Buku_3D_1781288556255.png";
import mockupDevices from "@assets/1781288755_1781288818548.jpg";

const SCALEV_BUNDLE = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";
const SCALEV_BUKU1  = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";
const WA_URL        = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20mau%20tanya%20tentang%20Trilogi%20Dari%20Monolog%20ke%20Dialog";

// Data riset/lembaga resmi (konteks umum, bukan janji hasil produk). Diverifikasi via sumber publik.
const STATS_TRILOGI = [
  {
    icon: Briefcase,
    value: "±49%",
    label: "Estimasi penghasilan pensiun rata-rata pekerja Indonesia dibanding gaji terakhir — turun lebih dari separuh.",
    source: "OECD, Pensions at a Glance Asia/Pacific 2024",
  },
  {
    icon: BookOpen,
    value: "65,43%",
    label: "Indeks literasi keuangan nasional 2024 — sebagian besar penduduk belum sepenuhnya siap kelola keuangan jangka panjang.",
    source: "OJK & BPS, SNLIK 2024",
  },
  {
    icon: Brain,
    value: "+14%",
    label: "Rata-rata kenaikan produktivitas pekerja yang dibantu AI generatif.",
    source: "Brynjolfsson, Li & Raymond, NBER w31161 / QJE, 2023",
  },
];

export default function TrilogiLanding() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const DEADLINE = new Date("2026-07-01T00:00:00+07:00");
    const tick = () => {
      const diff = DEADLINE.getTime() - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    trackViewContent({ content_name: "Trilogi Ebook Landing", content_category: "Ebook" });
  }, []);

  const openCheckout = (
    e: { preventDefault: () => void },
    url: string,
    label: string,
    value: number,
  ) => {
    e.preventDefault();
    trackInitiateCheckout({ content_name: label, value, currency: "IDR" });
    trackCustomEvent("Checkout_Click", { source: "trilogi-landing", label });
    window.open(withMetaAttribution(url), "_blank", "noopener,noreferrer");
  };
  const handleBundleClick = (e: { preventDefault: () => void }) =>
    openCheckout(e, SCALEV_BUNDLE, "Trilogi Bundle", TRILOGI.bundle.amount);
  const handleBuku1Click = (e: { preventDefault: () => void }) =>
    openCheckout(e, SCALEV_BUKU1, "Trilogi Buku 1", TRILOGI.bukuSatu.amount);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans" data-testid="page-trilogi-landing">

      {/* ── NAVBAR ── */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <span className="font-extrabold text-xl text-blue-900 cursor-pointer">GUSTAFTA</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-red-600 font-bold">
              <Flame className="w-3.5 h-3.5 animate-bounce" />
              {[
                { v: countdown.days, l: "Hari" },
                { v: countdown.hours, l: "Jam" },
                { v: countdown.minutes, l: "Mnt" },
                { v: countdown.seconds, l: "Dtk" },
              ].map(({ v, l }, i) => (
                <span key={l} className="flex items-center gap-0.5">
                  {i > 0 && <span className="opacity-40">:</span>}
                  <span className="bg-red-100 px-1 py-0.5 rounded tabular-nums">{String(v).padStart(2, "0")}</span>
                  <span className="text-gray-400 text-[10px]">{l}</span>
                </span>
              ))}
            </div>
            <a href={SCALEV_BUNDLE} target="_blank" rel="noopener noreferrer" onClick={handleBundleClick}
              className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 px-5 rounded-full text-sm transition-all transform hover:scale-105 active:scale-95"
              data-testid="button-nav-earlybird">
              Ambil Early Bird
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO — PAIN HEADLINE + 3D Book Cover
      ══════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* LEFT — Teks & CTA */}
            <div>
              <span className="bg-blue-950/60 text-blue-100 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 inline-block border border-blue-400/30">
                🚀 Untuk Karyawan, Profesional &amp; Calon Pensiunan
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight" data-testid="text-trilogi-hero">
                Kerja 15 Tahun,<br />
                Tapi Tabungan Cuma Cukup{" "}
                <span className="text-orange-400 underline decoration-wavy decoration-orange-400/50">6 Bulan?</span>
              </h1>

              <p className="text-base md:text-lg text-blue-100 mb-8 leading-relaxed">
                Masalahnya <strong className="text-white">BUKAN</strong> kamu kurang pintar.
                Masalahnya, keahlianmu selama ini cuma <strong className="text-orange-300">"MONOLOG"</strong> — satu arah ke perusahaan.
                Begitu perusahaan berhenti mendengar,{" "}
                <strong className="text-white">penghasilan ikut berhenti</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <a href={SCALEV_BUNDLE} target="_blank" rel="noopener noreferrer" onClick={handleBundleClick}
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-base font-bold py-4 px-7 rounded-xl shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                  data-testid="button-hero-bundle">
                  🔥 Amankan Slot Early Bird
                </a>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackContact()}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white text-white text-base font-semibold py-4 px-7 rounded-xl transition-all hover:bg-white/10"
                  data-testid="button-hero-wa">
                  Tanya via WhatsApp
                </a>
              </div>

              <p className="text-xs text-blue-200 flex flex-wrap gap-x-3 gap-y-1">
                <span>✅ Garansi 7 Hari Uang Kembali</span>
                <span>🔒 Checkout Aman via Scalev</span>
                <span>📦 Akses Seumur Hidup</span>
              </p>
            </div>

            {/* RIGHT — 3D Book Cover */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-orange-400/20 blur-3xl rounded-full scale-110" />
                <img
                  src={cover3D}
                  alt="Ebook Dari Monolog ke Dialog — cover 3D"
                  className="relative w-64 sm:w-72 md:w-80 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
                {/* Badge early bird */}
                <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg rotate-6 border-2 border-white">
                  Early Bird 🔥
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROBLEM — Pain Points
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            Pernah Merasa Seperti Hamster di Roda Putar?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                "Gaji cuma numpang lewat. Bayar cicilan, SPP anak, biaya orang tua — langsung habis tanpa sisa.",
                "Tiap ada rumor PHK atau restrukturisasi, jantung langsung dag-dig-dug. Padahal sudah kerja puluhan tahun.",
                "Mendekati pensiun, tapi bayangan \"berhenti kerja = berhenti penghasilan\" bikin malam tak bisa tidur.",
                "Pengen punya side income, tapi mikir: \"Saya gaptek, masa harus belajar coding dari nol?\"",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <span className="text-red-500 text-xl mt-0.5 flex-shrink-0">❌</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="bg-red-600 text-white p-7 rounded-2xl shadow-xl flex flex-col justify-center">
              <p className="text-xl font-extrabold mb-3">STOP. Itu bukan salahmu.</p>
              <p className="text-red-100 leading-relaxed text-sm mb-4">
                Selama ini kamu <strong className="text-white">membangun rumah di atas pasir</strong>.
                Keahlian dan pengalamanmu hanya "berbicara" satu arah ke satu tempat kerja.
                Saat tempat itu berhenti mendengar,{" "}
                <strong className="text-white">penghasilanmu mati suri</strong>.
              </p>
              <p className="text-white font-bold text-sm">
                Saatnya beralih dari{" "}
                <span className="bg-white/20 px-1.5 py-0.5 rounded">MONOLOG</span> ke{" "}
                <span className="bg-orange-400 px-1.5 py-0.5 rounded">DIALOG</span>{" "}
                — penghasilan yang terus mengalir meski kamu sedang tidur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SOLUTION — Trilogi + META-CASE
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Solusinya</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ubah Pengalaman Kerjamu Jadi{" "}
            <span className="text-blue-700">"Mesin Uang" 24/7</span>
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-sm leading-relaxed mb-10">
            Ebook <strong className="text-gray-900">Trilogi: Dari Monolog ke Dialog</strong> memandu Anda menjadi
            seorang <em>Orchestrator</em>. Anda tidak perlu coding. Cukup{" "}
            <strong className="text-gray-900">pimpin 6 Agen AI MultiClaw</strong> — Researcher, Narrator, Designer,
            Case Builder, Futurist, Editor — untuk bekerja atas nama keahlian Anda, 24 jam sehari.
          </p>

          {/* 3 Buku */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { n: "I", title: "Belajar", sub: "Pahami cara kerja AI dan rakit chatbot spesialis dari pengalaman Anda", color: "from-blue-700 to-blue-500" },
              { n: "II", title: "Bekerja", sub: "Praktik langsung: rakit asisten AI pertama dan dapatkan klien pertama", color: "from-emerald-700 to-emerald-500" },
              { n: "III", title: "Berkarya", sub: "Skalakan: dari 1 asisten jadi ekosistem chatbot dengan penghasilan subscription", color: "from-orange-700 to-orange-500" },
            ].map((b) => (
              <div key={b.n} className={`bg-gradient-to-br ${b.color} text-white rounded-2xl p-6 shadow-lg text-left`}>
                <div className="text-xs font-bold opacity-70 mb-1">BUKU {b.n}</div>
                <div className="text-2xl font-extrabold mb-2">{b.title}</div>
                <p className="text-sm text-white/80 leading-relaxed">{b.sub}</p>
              </div>
            ))}
          </div>

          {/* Multi-device mockup */}
          <div className="max-w-2xl mx-auto mb-10">
            <img
              src={mockupDevices}
              alt="Trilogi Dari Monolog ke Dialog — tersedia di tablet, HP, dan buku fisik"
              className="w-full rounded-2xl shadow-xl"
            />
            <p className="text-xs text-gray-500 text-center mt-2">Tersedia dalam format PDF, Flipbook Interaktif, dan dapat dicetak</p>
          </div>

          {/* META-CASE */}
          <div className="bg-blue-950 text-white p-8 rounded-2xl shadow-2xl max-w-3xl mx-auto border border-blue-700/40">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <h3 className="text-lg font-extrabold">META-CASE: Bukti Nyata Metode Ini Bekerja</h3>
            </div>
            <p className="text-blue-100 leading-relaxed text-sm">
              Ebook Trilogi yang sedang Anda baca ini{" "}
              <strong className="text-white">DITULIS menggunakan metode yang sama</strong> yang diajarkan di dalamnya.
              Proses riset, narasi, pengecekan fakta, hingga desain struktur bab — semuanya dieksekusi oleh
              Tim 6-Agen AI MultiClaw, dipimpin satu <em>Orchestrator</em> (manusia).
            </p>
            <p className="text-blue-200 text-sm mt-3">
              <strong className="text-white">Jadi jika Anda bertanya: "Ini beneran works?"</strong><br />
              Jawabannya: Anda sedang memegang buktinya.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          RISET / DATA — Konteks industri & lembaga resmi (tanpa testimoni)
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 text-center">Menurut Data</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Kenapa Ini Mendesak — Bukan Sekadar Menakut-nakuti
          </h2>
          <p className="text-center text-gray-500 text-sm max-w-2xl mx-auto mb-10">
            Data lembaga resmi menunjukkan betapa rapuhnya posisi keuangan banyak pekerja saat penghasilan
            utama berhenti — dan betapa besar daya ungkit yang kini dibuka oleh AI.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 mb-6">
            {STATS_TRILOGI.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center" data-testid={`stat-trilogi-${i}`}>
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white rounded-xl border border-gray-100"><SIcon className="h-6 w-6 text-blue-600" /></div>
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900 mb-2">{s.value}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.label}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">Sumber: {s.source}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[11px] text-gray-400 max-w-2xl mx-auto">
            Angka di atas adalah temuan riset/lembaga resmi sebagai konteks umum, bukan janji hasil spesifik dari produk ini.
          </p>

          {/* Trust stats */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, value: "1350+", label: "Agent AI Spesialis" },
              { icon: Target, value: "131", label: "Hub Orchestrator" },
              { icon: Zap, value: "80+", label: "MultiClaw AI Tools" },
              { icon: BadgeCheck, value: "24/7", label: "AI Selalu Aktif" },
            ].map((s) => {
              const SIcon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <SIcon className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="text-2xl font-extrabold text-blue-700 mb-0.5">{s.value}</div>
                  <div className="text-xs text-gray-500 text-center">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="pricing" className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Investasi</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Pilih Paket Anda</h2>
          <p className="text-gray-500 mb-10 text-sm">Investasi leher ke atas untuk ketenangan finansial selamanya.</p>

          {/* Bundle Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-orange-500 overflow-visible max-w-2xl mx-auto mb-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-extrabold py-1.5 px-6 rounded-full shadow-lg whitespace-nowrap">
              PALING LARIS 🔥
            </div>
            <div className="p-8 md:p-10 pt-10">

              {/* 2-col: cover + detail */}
              <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
                {/* Cover flat */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src={coverFlat}
                    alt="Cover Ebook Dari Monolog ke Dialog"
                    className="w-36 sm:w-40 rounded-xl shadow-lg border border-gray-100"
                  />
                </div>

                {/* Title + price */}
                <div className="text-left flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-1">BUNDLE LENGKAP TRILOGI</h3>
                  <p className="text-gray-500 text-xs mb-4">Buku I + II + III · Belajar → Bekerja → Berkarya</p>
                  <div className="text-4xl font-extrabold text-orange-600 mb-1">{TRILOGI.bundle.price}</div>
                  <div className="text-gray-400 text-sm">
                    <span className="line-through">{TRILOGI.bundle.normal}</span>{" "}
                    <span className="text-orange-500 font-semibold no-underline">Hemat 47%</span>
                  </div>
                </div>
              </div>

              <ul className="text-left space-y-3 mb-8 text-sm text-gray-700">
                {[
                  "Buku I, II, III (PDF + Flipbook Interaktif)",
                  "Prompt Pack MultiClaw (50+ prompt siap pakai)",
                  "Template Tim 6-Agen AI (import 1 klik ke Gustafta)",
                  "🎁 BONUS: 1 Bulan Gustafta Builder GRATIS",
                  "🔄 Update gratis selamanya",
                  "🛡️ Garansi 7 hari uang kembali",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <a href={SCALEV_BUNDLE} target="_blank" rel="noopener noreferrer" onClick={handleBundleClick}
                className="block w-full text-center bg-orange-600 hover:bg-orange-500 text-white text-lg font-extrabold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
                data-testid="button-pricing-bundle">
                AMANKAN BUNDLE SEKARANG →
              </a>
              <p className="text-xs text-gray-400 mt-3 text-center">⏰ Harga Early Bird hanya sampai 30 Juni 2026!</p>
            </div>
          </div>

          {/* Buku 1 saja */}
          <p className="text-gray-500 text-sm mb-2">Belum siap bundle? Mulai dari yang dasar dulu:</p>
          <a href={SCALEV_BUKU1} target="_blank" rel="noopener noreferrer" onClick={handleBuku1Click}
            className="text-blue-600 hover:text-blue-500 font-semibold underline text-sm"
            data-testid="link-buku1">
            Ambil Buku I Saja (Early Bird {TRILOGI.bukuSatu.price}) →
          </a>

          {/* Platform teaser */}
          <div className="mt-10 p-6 bg-blue-50 border border-blue-200 rounded-2xl text-left max-w-xl mx-auto">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Sudah punya Ebook?</p>
            <p className="text-sm text-gray-700 mb-3">
              Langsung praktik di <strong className="text-blue-700">Gustafta Builder</strong> — platform no-code untuk membangun chatbot AI Anda.
              Bundle sudah termasuk <strong>1 bulan gratis</strong>.
            </p>
            <Link href="/packs">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-600 cursor-pointer">
                Lihat Paket Gustafta Builder <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 text-center">FAQ</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            Pertanyaan yang Sering Muncul
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: `🤔 "Saya sudah tua, masa harus belajar teknologi baru?"`,
                a: "Justru ini keunggulan Anda! Pengalaman 10–20 tahun yang Anda miliki adalah aset yang tidak dipunya generasi muda. Gustafta adalah alat no-code — tidak ada coding, tidak ada server. Jika Anda bisa isi formulir online dan kirim email, Anda sudah bisa melakukannya.",
              },
              {
                q: `🤔 "Saya terancam PHK, tidak punya banyak waktu untuk belajar hal baru"`,
                a: "Justru karena itulah ini DARURAT. Buku ini dirancang untuk orang sibuk — setiap bab bisa dibaca 15–20 menit. Total cukup 20–25 jam dalam 1–3 bulan untuk membangun fondasi 'sekoci' finansial pertama Anda.",
              },
              {
                q: `🤔 "Apa bedanya dengan belajar dari YouTube gratis?"`,
                a: "YouTube memberikan serpihan informasi. Trilogi memberikan sistem yang teruji end-to-end: dari mindset, memilih keahlian, membangun chatbot, hingga mendapatkan klien pertama dan menskalakan penghasilan subscription. Plus template dan prompt pack siap pakai.",
              },
              {
                q: `🤔 "Apakah saya perlu berlangganan Gustafta setelah aktivasi Starter Kit — Panduan Gustafta?"`,
                a: "Tidak wajib. Ebook bisa dipelajari sendiri terlebih dahulu. Bundle sudah termasuk BONUS 1 bulan Gustafta Builder gratis agar Anda bisa langsung praktik. Setelah itu, Anda bebas memilih lanjut berlangganan atau tidak.",
              },
              {
                q: `🤔 "Bagaimana jika saya tidak puas setelah beli?"`,
                a: "Coba 7 hari. Praktik minimal satu latihan dari Buku I. Jika tidak ada manfaat yang Anda rasakan, hubungi kami dan uang kembali 100%. Tanpa pertanyaan, tanpa drama.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-gray-200 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4 text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA — Urgency Close
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Dua Pilihan di Depan Anda</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-red-900/40 border border-red-500/40 rounded-xl p-5">
              <p className="font-bold text-red-300 mb-2">❌ Tidak melakukan apa-apa</p>
              <p className="text-sm text-red-200/80 leading-relaxed">
                Tetap di roda hamster. Tetap khawatir soal PHK. Tetap bergantung pada satu sumber penghasilan.
                5 tahun lagi situasinya tidak berubah.
              </p>
            </div>
            <div className="bg-green-900/40 border border-green-400/40 rounded-xl p-5">
              <p className="font-bold text-green-300 mb-2">✅ Ambil langkah hari ini</p>
              <p className="text-sm text-green-200/80 leading-relaxed">
                Mulai ubah keahlian jadi chatbot AI. 3 bulan lagi punya side income pertama.
                6 bulan lagi punya penghasilan yang tidak bergantung satu bos.
              </p>
            </div>
          </div>

          <a href={SCALEV_BUNDLE} target="_blank" rel="noopener noreferrer" onClick={handleBundleClick}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-lg font-extrabold py-5 px-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 mb-4"
            data-testid="button-final-cta">
            🔥 Ya, Saya Mau Mulai Sekarang
          </a>
          <p className="text-sm text-blue-200">✅ Garansi 7 Hari Uang Kembali &nbsp;|&nbsp; ⏰ Early Bird habis 30 Juni 2026</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-4 text-center text-sm">
        <p className="mb-1 text-gray-400">© 2026 Gustafta — WordPress-nya Ekosistem Kompetensi Indonesia.</p>
        <p className="text-xs">
          Butuh bantuan?{" "}
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackContact()}
            className="text-green-400 hover:text-green-300 underline">
            Hubungi kami via WhatsApp
          </a>
          {" "}·{" "}
          <Link href="/">
            <span className="text-blue-400 hover:text-blue-300 underline cursor-pointer">Kembali ke Gustafta Platform</span>
          </Link>
        </p>
      </footer>

      {/* ── Floating WhatsApp ── */}
      <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackContact()}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-400 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 z-50 transition-all transform hover:scale-110 active:scale-95"
        data-testid="button-floating-wa">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="font-bold text-sm hidden md:inline">Tanya via WhatsApp</span>
      </a>

      {/* ── Mobile sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-2xl">
        <a href={SCALEV_BUNDLE} target="_blank" rel="noopener noreferrer" onClick={handleBundleClick}
          className="flex-1 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3 rounded-xl text-center transition-all active:scale-95"
          data-testid="button-mobile-sticky-buy">
          🔥 Early Bird {TRILOGI.bundle.price}
        </a>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackContact()}
          className="px-4 bg-green-500 hover:bg-green-400 text-white text-sm font-bold py-3 rounded-xl transition-all active:scale-95"
          data-testid="button-mobile-sticky-wa">
          WA
        </a>
      </div>
    </div>
  );
}
