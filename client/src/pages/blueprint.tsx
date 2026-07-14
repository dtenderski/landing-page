import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, ArrowRight, MessageCircle, Sparkles, Map as MapIcon,
  Target, Users, BookOpen, TrendingUp, Calendar,
  DollarSign, Brain, Zap, ChevronRight, FileText,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tahu%20tentang%20Blueprint%20Ekosistem%20AI";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}


// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_BLUEPRINT = [
  {
    icon: Brain,
    value: "30%",
    label: "Proyek AI generatif diperkirakan ditinggalkan setelah tahap uji coba — salah satu penyebab utamanya nilai bisnis yang tidak jelas sejak awal.",
    source: "Gartner, 2024",
  },
  {
    icon: FileText,
    value: "37%",
    label: "Organisasi menyebut kebutuhan & perencanaan yang tidak akurat sebagai penyebab utama kegagalan proyek.",
    source: "PMI, Pulse of the Profession",
  },
  {
    icon: TrendingUp,
    value: "5,5%",
    label: "Meski 78% organisasi memakai AI, hanya 5,5% yang benar-benar menuai nilai bisnis besar — jarak antara 'pakai AI' dan 'untung dari AI' sangat lebar.",
    source: "McKinsey, The State of AI",
  },
];

export default function BlueprintPage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-blueprint">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/3 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-1/3 w-80 h-80 rounded-full bg-cyan-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
            <MapIcon className="h-3.5 w-3.5" />
            Gustafta Blueprint
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Jangan Langsung Bangun.<br />
            <span className="text-cyan-200">Rencanakan Dulu.</span>
          </h1>
          <p className="text-base md:text-lg text-blue-100 mb-3 leading-relaxed max-w-2xl mx-auto">
            Sebelum membangun AI, Anda perlu tahu: untuk siapa, menghasilkan value apa,
            dan bagaimana roadmap monetisasinya. Blueprint membantu Anda menyusun semua itu.
          </p>
          <p className="text-sm text-cyan-200 mb-8 font-semibold">Dari ide abstrak menjadi rencana konkret. Dari "punya pengetahuan" menjadi "punya ekosistem".</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <Link href="/konsultasi">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-buat-blueprint">
                <Sparkles className="h-5 w-5" /> Buat Blueprint Saya
              </Button>
            </Link>
            <Link href="/blueprint-builder">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-blueprint-builder">
                Rancang Agen (Builder) <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-tanya-blueprint">
                <MessageCircle className="h-4 w-4" /> Pelajari Lebih Lanjut
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-blue-200 mt-8 justify-center">
            {["Guided Process", "Output Terstruktur", "Roadmap Monetisasi"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-300" />{s}
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
              Kesalahan yang Sering Terjadi
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Langsung Bangun Tanpa Rencana — Seperti Membangun Rumah Tanpa Arsitektur
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Banyak profesional langsung loncat ke Builder: "Saya punya pengetahuan, saya buat chatbot."
              Tapi tanpa rencana yang jelas, hasilnya tidak optimal.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "❌", title: "Chatbot tidak tahu untuk siapa", desc: "Tanpa persona target yang jelas, AI merespons terlalu general dan tidak relevan." },
              { icon: "❌", title: "Knowledge base tidak terstruktur", desc: "Konten yang diupload acak — AI bingung, jawaban tidak konsisten." },
              { icon: "❌", title: "Tidak ada roadmap monetisasi", desc: "AI sudah jalan tapi tidak menghasilkan revenue. Jadi 'mainan' bukan 'aset'." },
              { icon: "❌", title: "Waktu terbuang untuk trial & error", desc: "Tanpa blueprint, Anda rebuild berkali-kali. Buang waktu, buang energi." },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border bg-white dark:bg-card p-5 flex gap-3">
                <span className="text-xl mt-0.5">{p.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RISET ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800">
              Menurut Data
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Kenapa Perencanaan Menentukan Hasil
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Data lembaga riset global menunjukkan: yang membedakan AI yang menghasilkan nilai dari yang
              berhenti di tengah jalan bukan teknologinya — tapi kejelasan rencananya.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {STATS_BLUEPRINT.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border bg-gray-50 dark:bg-muted/20 p-6 text-center" data-testid={`stat-blueprint-${i}`}>
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                      <SIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{s.value}</div>
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

      {/* ── ISI BLUEPRINT ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800">
              Isi Blueprint
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              7 Komponen yang Anda Susun
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Setiap komponen menghasilkan output konkret yang langsung bisa dieksekusi.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Target, num: "1", title: "Visi & Misi Ekosistem", output: "Pernyataan visi yang jelas", desc: "Apa tujuan jangka panjang? Untuk siapa? Value proposition unik Anda?" },
              { icon: Users, num: "2", title: "Target Audience & Persona", output: "Persona user terdefinisi", desc: "Siapa pengguna utamanya? Apa masalah mereka? Bagaimana cara aksesnya?" },
              { icon: BookOpen, num: "3", title: "Struktur Knowledge Base", output: "Peta knowledge yang terstruktur", desc: "Pengetahuan apa yang didokumentasikan? Dari mana sumbernya? Hierarki seperti apa?" },
              { icon: Brain, num: "4", title: "Persona AI & Alur Dialog", output: "Persona AI terdefinisi", desc: "Karakter AI seperti apa? Nada bicara? Batasan? Alur dialog ideal?" },
              { icon: DollarSign, num: "5", title: "Roadmap Monetisasi", output: "Rencana monetisasi realistis", desc: "Bagaimana menghasilkan revenue? Model bisnis apa? Strategi pricing?" },
              { icon: TrendingUp, num: "6", title: "Strategi Growth", output: "Rencana growth actionable", desc: "Cara mendapat user pertama? Channel marketing efektif? Metrik sukses?" },
              { icon: Calendar, num: "7", title: "Timeline & Milestone", output: "Timeline 30-90-365 hari", desc: "Milestone 30 hari pertama? Target 90 hari? KPI per fase?" },
            ].map((c) => (
              <div key={c.num} className="rounded-2xl border bg-gray-50 dark:bg-muted/20 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                    <c.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Komponen {c.num}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{c.desc}</p>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                  ✓ Output: {c.output}
                </div>
              </div>
            ))}
            {/* Last card: CTA */}
            <div className="rounded-2xl border border-indigo-300 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-5 flex flex-col gap-3 items-center justify-center text-center">
              <MapIcon className="h-8 w-8 text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Blueprint Lengkap Anda</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Dokumen strategis terstruktur yang jadi panduan membangun ekosistem AI Anda.</p>
              <Link href="/konsultasi">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 gap-1.5 mt-1" data-testid="btn-komponen-mulai">
                  <Sparkles className="h-3.5 w-3.5" /> Mulai Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Proses Blueprint: 4 Tahapan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dimulai dari Dialog Gustafta — AI menggali potensi Anda secara bertahap.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { step: "01", icon: "💬", title: "Discovery", time: "30–60 menit", desc: "AI menggali latar belakang, keahlian, tujuan jangka panjang, dan target audience Anda melalui dialog mendalam.", output: "Pemahaman konteks yang dalam" },
              { step: "02", icon: "🎯", title: "Strategy", time: "60–90 menit", desc: "AI membantu menyusun visi & misi ekosistem, persona target audience, struktur knowledge base, dan persona AI.", output: "Dokumen strategi terstruktur" },
              { step: "03", icon: "💰", title: "Monetization", time: "60–90 menit", desc: "AI membantu merancang model bisnis, strategi pricing, paket produk & layanan, dan roadmap revenue.", output: "Rencana monetisasi realistis" },
              { step: "04", icon: "📈", title: "Execution Plan", time: "30–60 menit", desc: "AI membantu membuat timeline 30-90-365 hari, milestone & KPI, action plan per fase, dan checklist kesiapan.", output: "Rencana eksekusi actionable" },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border bg-white dark:bg-card p-6 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tahap {s.step}: {s.title}</h3>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{s.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{s.desc}</p>
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Output: {s.output}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            Total waktu: 3–5 jam (bisa dibagi beberapa sesi). Dimulai dari Dialog Gustafta yang gratis.
          </p>
        </div>
      </section>

      {/* ── BLUEPRINT VS BUILDER ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Blueprint vs Builder: Apa Bedanya?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: MapIcon, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-500/30",
                title: "BLUEPRINT = Perencanaan", subtitle: "Arsitek menggambar blueprint rumah",
                items: ["Fokus: Strategi & perencanaan", "Output: Dokumen strategis", "Waktu: 3–5 jam", "Pertanyaan: Apa yang harus saya bangun?"],
                when: ["Belum punya rencana yang jelas", "Belum tahu target audience", "Ingin bangun ekosistem kompleks", "Ingin maksimalkan ROI"],
                cta: "Mulai Blueprint", href: "/konsultasi",
              },
              {
                icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-500/30",
                title: "BUILDER = Eksekusi", subtitle: "Kontraktor membangun rumah",
                items: ["Fokus: Implementasi & deployment", "Output: Chatbot AI aktif", "Waktu: 30 menit – 2 jam", "Pertanyaan: Bagaimana cara build-nya?"],
                when: ["Sudah punya rencana yang jelas", "Sudah tahu target audience", "Hanya butuh chatbot sederhana", "Sudah pernah buat AI sebelumnya"],
                cta: "Ke Builder", href: builderUrl,
              },
            ].map((c) => (
              <div key={c.title} className={`rounded-2xl border ${c.border} ${c.bg} p-6 flex flex-col gap-4`}>
                <div className="flex items-center gap-3">
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{c.title}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{c.subtitle}</div>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {c.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <Check className={`h-3.5 w-3.5 ${c.color} flex-shrink-0 mt-0.5`} />{i}
                    </li>
                  ))}
                </ul>
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Butuh ini jika:</div>
                  <ul className="space-y-1">
                    {c.when.map((w) => (
                      <li key={w} className="text-[11px] text-gray-600 dark:text-gray-400">✓ {w}</li>
                    ))}
                  </ul>
                </div>
                <Link href={c.href}>
                  <Button className={`w-full text-xs h-9 bg-white dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 border`} variant="outline" data-testid={`btn-comparison-${c.cta.toLowerCase().replace(/\s/g, "-")}`}>
                    {c.cta} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              💡 Rekomendasi: Jika ini pertama kali Anda membangun ekosistem AI, mulai dari Blueprint dulu.
              Ini menghemat waktu dan memaksimalkan kesuksesan ekosistem Anda.
            </p>
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Blueprint Ini Untuk Anda</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji: "💼", label: "Konsultan & Advisor", desc: "Punya keahlian tapi belum tahu cara mengemas jadi produk digital yang bisa dijual.", output: "Rencana produkisasi keahlian" },
              { emoji: "🏢", label: "Perusahaan Training & LSP", desc: "Ingin bangun platform e-learning atau sertifikasi tapi belum punya strategi yang jelas.", output: "Rencana platform training/sertifikasi" },
              { emoji: "👨‍🏫", label: "Instruktur & Trainer", desc: "Ingin digitalisasi materi pelatihan tapi belum tahu struktur yang optimal.", output: "Rencana kurikulum digital + AI" },
              { emoji: "🏛️", label: "Asosiasi Profesi", desc: "Ingin sediakan panduan kompetensi untuk anggota tapi belum tahu struktur knowledge base-nya.", output: "Rencana ekosistem anggota" },
              { emoji: "👴", label: "Profesional Senior", desc: "Ingin wariskan pengalaman tapi belum tahu cara sistemize-nya ke dalam AI.", output: "Rencana AI Twin warisan" },
              { emoji: "🏬", label: "UMKM & Bisnis Kecil", desc: "Ingin otomatisasi CS atau sales tapi belum tahu chatbot seperti apa yang dibutuhkan.", output: "Rencana chatbot CS/sales" },
            ].map((p) => (
              <div key={p.label} className="rounded-2xl border bg-white dark:bg-card p-5 flex flex-col gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.label}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border-t border-indigo-100 dark:border-indigo-500/20 pt-2">
                  → Output: {p.output}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-700 to-blue-800 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Mulai dengan Percakapan — Blueprint Dimulai dari Dialog
          </h2>
          <p className="text-blue-100 text-sm mb-2 leading-relaxed">
            Tidak ada form panjang. Tidak ada template kaku. Dialog Gustafta menggali potensi Anda
            melalui percakapan alami, lalu menghasilkan blueprint yang benar-benar personal.
          </p>
          <p className="text-blue-200 text-sm mb-8">Gratis untuk memulai. Tanpa perlu daftar.</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <Link href="/konsultasi">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-final-blueprint">
                <Sparkles className="h-5 w-5" /> Buat Blueprint via Dialog
              </Button>
            </Link>
            <Link href="/blueprint-builder">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-cta-final-blueprint-builder">
                Rancang Agen (Builder) <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={builderUrl}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-cta-final-builder">
                Langsung ke Builder <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-gray-50 dark:bg-muted/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">GUSTAFTA BLUEPRINT</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Arsitektur ekosistem AI Anda — dari ide ke rencana konkret.</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-indigo-600">Beranda</Link>
            <Link href="/konsultasi" className="hover:text-indigo-600">Dialog Gustafta</Link>
            <Link href="/produk" className="hover:text-indigo-600">Produk</Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
