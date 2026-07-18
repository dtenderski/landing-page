import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { trackLead } from "@/lib/meta-pixel";
import {
  Upload, FileSearch, CheckSquare, MessageSquare, ArrowRight,
  Zap, ShieldCheck, Clock, FileText, AlertTriangle, CheckCircle2,
  ChevronRight, Star, Sparkles, Lock, BookOpen, ListChecks,
  FileWarning, Target, TrendingDown, Lightbulb, XCircle,
} from "lucide-react";

const APP_URL = "/bedah-dokumen/app";

const DOC_TYPES = [
  {
    icon: "📋",
    color: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    label: "Dokumen Tender",
    badge: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    examples: ["RKS / Spesifikasi Teknis", "HPS & Analisa Harga", "Syarat Kualifikasi BUJK", "Dokumen Pemilihan Pengadaan"],
  },
  {
    icon: "🏗️",
    color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    label: "SKK & SBU",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    examples: ["Persyaratan SKK Jabatan Kerja", "Formulir Permohonan SBU", "Skema Sertifikasi LPJK", "Daftar Unit Kompetensi KKNI"],
  },
  {
    icon: "📜",
    color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    label: "Kontrak Konstruksi",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    examples: ["SPK & SPMK Pemerintah", "Kontrak FIDIC Silver/Red Book", "Sub-kontrak & Kontrak Jasa", "Pasal denda, klaim & risiko"],
  },
  {
    icon: "📄",
    color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    label: "Dokumen Proyek",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    examples: ["Method Statement & PCM", "Laporan Kemajuan Pekerjaan", "BAP & Berita Acara Serah Terima", "Rencana Mutu Kontrak (RMK)"],
  },
  {
    icon: "📐",
    color: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
    label: "Gambar Teknis",
    badge: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    examples: ["Denah & Floor Plan (JPG/PNG)", "Detail Konstruksi Baja & Beton", "Gambar MEP — Mekanikal/Elektrikal", "Shop Drawing & As-Built Drawing", "Gambar Kapal & Keteknikan Lainnya"],
    note: "Vision AI",
  },
];

const FEATURES = [
  {
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-primary bg-primary/10",
    title: "Ringkasan Eksekutif",
    desc: "Pahami isi dokumen 200 halaman dalam 3 paragraf. Siapa pihak yang terlibat, apa tujuannya, poin-poin kritis apa yang harus diperhatikan.",
    free: true,
  },
  {
    icon: <ListChecks className="h-5 w-5" />,
    color: "text-emerald-600 bg-emerald-500/10",
    title: "Checklist Kelengkapan",
    desc: "AI memeriksa dokumen Anda item per item: mana yang sudah ada, yang kurang, dan yang perlu diklarifikasi. Tidak ada lagi dokumen yang tertolak karena kurang lampiran.",
    free: false,
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-500 bg-red-500/10",
    title: "Deteksi Risiko",
    desc: "AI menandai pasal-pasal yang berpotensi merugikan: denda keterlambatan berlebih, klausul sepihak, syarat teknis yang sulit dipenuhi, atau potensi sengketa.",
    free: false,
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    color: "text-blue-600 bg-blue-500/10",
    title: "Chat Dokumen",
    desc: "Tanya langsung tentang isi dokumen Anda. \"Berapa nilai jaminan pelaksanaan?\", \"Apa syarat kualifikasi teknis?\", \"Kapan batas waktu penyerahan dokumen?\" — dijawab dalam detik.",
    free: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <Upload className="h-6 w-6" />,
    color: "bg-primary/10 text-primary",
    title: "Upload Dokumen atau Gambar",
    desc: "Seret atau pilih file PDF, TXT, atau gambar teknis (JPG/PNG/WEBP). Maks 50 MB. Tidak perlu konversi — upload langsung.",
  },
  {
    step: "02",
    icon: <Zap className="h-6 w-6" />,
    color: "bg-amber-500/10 text-amber-500",
    title: "AI Analisis Otomatis",
    desc: "AI membaca seluruh dokumen, mengidentifikasi jenis, menyusun ringkasan, dan membangun checklist dalam 10–30 detik.",
  },
  {
    step: "03",
    icon: <FileSearch className="h-6 w-6" />,
    color: "bg-emerald-500/10 text-emerald-600",
    title: "Baca, Cek & Tanya",
    desc: "Buka ringkasan eksekutif, review checklist kelengkapan, atau langsung tanya tentang isi dokumen. Semuanya dalam satu halaman.",
  },
];

const PAIN_POINTS = [
  { icon: <FileWarning className="h-4 w-4 text-red-500" />, text: "RKS 150–300 halaman harus dibaca sebelum deadline lelang besok" },
  { icon: <TrendingDown className="h-4 w-4 text-red-500" />, text: "Proposal ditolak karena terlewat 1 persyaratan teknis di halaman 87" },
  { icon: <Clock className="h-4 w-4 text-red-500" />, text: "Baca kontrak sendiri tapi tidak yakin apakah pasal denda itu wajar" },
  { icon: <XCircle className="h-4 w-4 text-red-500" />, text: "SKK ditolak karena kurang satu dokumen yang tidak tertulis jelas" },
];

const TESTIMONIALS = [
  {
    name: "Ridwan S.",
    role: "Staf Teknik, Kontraktor Menengah",
    quote: "Bisa hemat 3–4 jam per dokumen tender. Langsung tahu mana persyaratan yang belum kami punya tanpa baca dari awal.",
    rating: 5,
  },
  {
    name: "Dewi A.",
    role: "Konsultan Pengawas, Bandung",
    quote: "Upload kontrak klien, langsung muncul ringkasan dan pasal-pasal yang berisiko. Nggak perlu scroll 120 halaman lagi.",
    rating: 5,
  },
  {
    name: "Hendra P.",
    role: "PIC SKK, BUJK Swasta",
    quote: "Checklist-nya akurat. Saya jadi tahu persis dokumen apa yang masih kurang sebelum submit ke LPJK.",
    rating: 5,
  },
];

export default function BedahDokumenLandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-background pt-20 pb-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI Pembaca Dokumen Konstruksi — Aktif Sekarang
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Upload Dokumen.<br />
            <span className="text-primary">Pahami dalam 30 Detik.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            RKS, kontrak, syarat SKK — AI membaca seluruh isi, membuat ringkasan,
            memeriksa kelengkapan, dan siap menjawab pertanyaan Anda.
            <strong className="text-white"> Tidak perlu baca 200 halaman sendiri.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href={APP_URL} onClick={() => trackLead({ content_name: "Bedah Dokumen Hero CTA" })}>
              <Button size="lg" className="gap-2 text-base px-8 py-6 rounded-2xl font-semibold">
                <Upload className="h-5 w-5" />
                Coba Gratis — Upload Sekarang
              </Button>
            </Link>
            <Link href="#cara-kerja">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 py-6 rounded-2xl border-white/20 text-white hover:bg-white/10">
                Lihat Cara Kerja
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Gratis 1 dokumen untuk semua pengguna terdaftar · Tanpa kartu kredit
          </p>

          {/* Preview card */}
          <div className="mt-14 mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
              {/* Mock tab bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <span className="ml-3 text-xs text-slate-400">Bedah Dokumen — RKS Pekerjaan Konstruksi Jembatan</span>
              </div>
              {/* Mock content */}
              <div className="p-5 text-left space-y-4">
                {/* Status bar */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Analisis selesai dalam 18 detik
                  </div>
                  <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">📋 Dokumen Tender</Badge>
                </div>
                {/* Summary preview */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />Ringkasan Eksekutif
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dokumen RKS ini merupakan spesifikasi teknis pengadaan pekerjaan konstruksi <strong className="text-white">Jembatan Ciawi</strong> 
                    oleh Dinas PUPR Kabupaten Bogor, dengan nilai HPS <strong className="text-white">Rp 4,7 miliar</strong>. 
                    Kualifikasi minimum BUJK adalah <strong className="text-amber-400">SBU SI002 (Jembatan) grade M</strong>. 
                    Masa pelaksanaan 210 hari kalender dengan denda keterlambatan 1‰/hari maks 5%…
                  </p>
                </div>
                {/* Checklist preview */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <ListChecks className="h-3 w-3" />Checklist Kelengkapan
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { ok: true, item: "SBU SI002 Grade M aktif" },
                      { ok: true, item: "SKK Manajer Proyek Madya" },
                      { ok: false, item: "ISO 45001 SMKK (tidak disebut dalam dokumen)" },
                      { ok: null, item: "Referensi pengalaman 3 pekerjaan sejenis — perlu dicek" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.ok === true && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                        {c.ok === false && <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                        {c.ok === null && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
                        <span className={c.ok === false ? "text-red-300" : c.ok === null ? "text-amber-300" : "text-slate-300"}>{c.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs bg-red-500/10 text-red-600 border-red-500/20">
              <AlertTriangle className="h-3 w-3 mr-1" />Masalah Yang Sering Terjadi
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Dokumen konstruksi itu tebal,<br />
              <span className="text-red-500">dan satu kesalahan baca sangat mahal.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              RKS rata-rata 80–300 halaman. Kontrak FIDIC 150+ pasal. Syarat SKK tersebar di puluhan regulasi.
              Tidak ada waktu untuk baca semuanya — tapi terlewat satu syarat bisa fatal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-red-500/15 bg-red-500/5">
                <div className="mt-0.5 shrink-0">{p.icon}</div>
                <p className="text-sm text-foreground/80">{p.text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "48%", label: "Rework konstruksi disebabkan data & dokumen yang buruk", src: "FMI/Autodesk" },
              { value: "14 Jam", label: "Waktu kerja terbuang per orang per minggu untuk tugas non-produktif", src: "PlanGrid Research" },
              { value: "1 Pasal", label: "Yang terlewat saat baca dokumen bisa berarti tender gagal atau klaim ditolak", src: "Estimasi lapangan" },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/50 bg-background">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{s.value}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Sumber: {s.src}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution / How It Works ───────────────────────────────────────── */}
      <section id="cara-kerja" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3 w-3 mr-1" />Cara Kerja
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              3 Langkah, Hasil dalam <span className="text-primary">30 Detik</span>
            </h2>
            <p className="text-muted-foreground text-lg">Tidak perlu pelatihan. Tidak perlu akun premium untuk mulai.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="grid md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="text-center relative">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5 ring-4 ring-background relative z-10`}>
                    {step.icon}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">{step.step}</div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Target className="h-3 w-3 mr-1" />Fitur Lengkap
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Satu upload. Empat hasil analisis.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className={`rounded-2xl border p-6 bg-background relative ${f.free ? "border-border/50" : "border-border/30"}`}>
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  {f.free ? (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">Gratis</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0">Starter+</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Document Types ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs bg-violet-500/10 text-violet-600 border-violet-500/20">
              <FileText className="h-3 w-3 mr-1" />Jenis Dokumen
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Semua dokumen & gambar teknis, satu platform
            </h2>
            <p className="text-muted-foreground text-lg">AI dilatih pada regulasi konstruksi Indonesia — dan kini bisa membaca gambar teknis engineering via Vision AI.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOC_TYPES.map((dt, i) => (
              <div key={i} className={`rounded-2xl border bg-gradient-to-br p-5 ${dt.color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{dt.icon}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${dt.badge}`}>{dt.label}</Badge>
                    {(dt as any).note && (
                      <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-600 border-cyan-500/20">
                        <Zap className="h-2.5 w-2.5 mr-1" />{(dt as any).note}
                      </Badge>
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {dt.examples.map((ex, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />{ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />Harga Akses
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Mulai gratis. Upgrade saat butuh lebih.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Free */}
            <div className="rounded-2xl border border-border/60 bg-background p-7">
              <div className="mb-5">
                <h3 className="text-lg font-bold">Gratis</h3>
                <div className="text-3xl font-bold mt-2">Rp 0</div>
                <p className="text-sm text-muted-foreground mt-1">Coba sekarang, tanpa kartu kredit</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                {[
                  { ok: true, text: "1 dokumen (bebas hapus & upload ulang)" },
                  { ok: true, text: "Ringkasan Eksekutif AI" },
                  { ok: true, text: "Deteksi jenis dokumen otomatis" },
                  { ok: false, text: "Checklist Kelengkapan" },
                  { ok: false, text: "Deteksi Risiko & Rekomendasi" },
                  { ok: false, text: "Chat Dokumen (tanya jawab)" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {item.ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <Lock className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                    <span className={item.ok ? "" : "text-muted-foreground/60"}>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link href={APP_URL} onClick={() => trackLead({ content_name: "Bedah Dokumen Free CTA" })}>
                <Button variant="outline" className="w-full rounded-xl">Mulai Gratis</Button>
              </Link>
            </div>

            {/* Starter */}
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-7 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1">Paling Populer</Badge>
              </div>
              <div className="mb-5">
                <h3 className="text-lg font-bold">Starter</h3>
                <div className="text-3xl font-bold mt-2">Rp 199.000<span className="text-sm font-normal text-muted-foreground">/bulan</span></div>
                <p className="text-sm text-muted-foreground mt-1">Akses penuh Bedah Dokumen + seluruh platform</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                {[
                  "Dokumen tidak terbatas",
                  "Ringkasan Eksekutif AI",
                  "Checklist Kelengkapan otomatis",
                  "Deteksi Risiko & Rekomendasi",
                  "Chat Dokumen — tanya jawab bebas",
                  "+ Akses 13 MultiClaw SBU/Tender",
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{text}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" onClick={() => trackLead({ content_name: "Bedah Dokumen Starter CTA" })}>
                <Button className="w-full rounded-xl gap-2">
                  Aktivasi Starter <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Atau hubungi kami untuk <strong>konsultasi per kasus Rp 149.000</strong> jika hanya butuh sekali pakai
            {" · "}
            <a
              href="https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20info%20bedah%20dokumen%20per%20kasus"
              className="underline underline-offset-2"
              onClick={() => trackLead({ content_name: "Bedah Dokumen Per Kasus WA" })}
            >
              Hubungi via WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Apa kata pengguna Gustafta</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-background p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-t border-primary/10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileSearch className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Tidak perlu baca 200 halaman.<br />
            <span className="text-primary">Upload sekarang, pahami dalam 30 detik.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Gratis untuk satu dokumen pertama Anda. Tidak perlu kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={APP_URL} onClick={() => trackLead({ content_name: "Bedah Dokumen Footer CTA" })}>
              <Button size="lg" className="gap-2 text-base px-8 py-6 rounded-2xl font-semibold">
                <Upload className="h-5 w-5" />
                Upload Dokumen Gratis
              </Button>
            </Link>
            <a
              href="https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tahu%20lebih%20tentang%20Bedah%20Dokumen%20AI"
              onClick={() => trackLead({ content_name: "Bedah Dokumen Footer WA" })}
            >
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 py-6 rounded-2xl">
                <MessageSquare className="h-5 w-5" />
                Tanya via WhatsApp
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-5 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />Dokumen Anda aman & tidak dibagikan</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" />Analisis dalam 30 detik</span>
            <span className="flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-primary" />AI khusus konstruksi Indonesia</span>
          </p>
        </div>
      </section>
    </div>
  );
}
