import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, ArrowRight, MessageCircle, Sparkles, TrendingUp,
  Users, ShoppingBag, Wallet, Star, Zap, Award, Globe,
  ChevronRight, Shield, BarChart3, HandshakeIcon,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20tertarik%20jadi%20Mitra%20Gustafta%20Builder";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}


// Data riset/lembaga (konteks industri, bukan klaim hasil produk). Diverifikasi via sumber publik.
const STATS_MITRA = [
  {
    icon: TrendingUp,
    value: "US$480 Miliar",
    label: "Ekonomi kreator global diperkirakan tumbuh dari ~US$250 miliar (2023) menjadi ~US$480 miliar pada 2027 — hampir dua kali lipat dalam 5 tahun.",
    source: "Goldman Sachs, 2023",
  },
  {
    icon: Globe,
    value: "US$90 Miliar",
    label: "Nilai ekonomi digital Indonesia (GMV) menembus ~US$90 miliar pada 2024 dan terus tumbuh dua digit per tahun.",
    source: "Google, Temasek & Bain — e-Conomy SEA 2024",
  },
  {
    icon: Award,
    value: "US$700 Miliar",
    label: "Pasar e-learning global diproyeksikan menembus ratusan miliar dolar (≈US$700 miliar) pada 2030 — peluang besar memonetisasi keahlian.",
    source: "The Business Research Company",
  },
];

export default function MitraPage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-mitra">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
            <HandshakeIcon className="h-3.5 w-3.5" />
            Program Mitra Gustafta
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Ubah Keahlian Anda<br />
            <span className="text-emerald-200">Menjadi Penghasilan Nyata</span>
          </h1>
          <p className="text-base md:text-lg text-emerald-100 mb-4 max-w-2xl mx-auto leading-relaxed">
            Anda sudah punya pengetahuan. Anda sudah punya pengalaman. Gustafta memberi Anda
            platform, payment gateway, marketplace, dan dukungan penuh — tanpa modal besar.
          </p>
          <p className="text-sm text-emerald-200 mb-8 font-semibold">Revenue Sharing 80/20 · Tanpa Risiko · Mulai Kapan Saja</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-jadi-mitra">
                <HandshakeIcon className="h-5 w-5" /> Jadi Mitra Gustafta
              </Button>
            </a>
            <Link href={builderUrl}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-coba-builder">
                Coba Builder Dulu <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-emerald-200 mt-8 justify-center">
            {["80% revenue untuk Anda", "Infrastruktur lengkap tersedia", "Support penuh dari tim"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-300" />{s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MASALAH ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
            Tantangan Nyata
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Keahlian Anda Belum Termonetisasi Optimal
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            Banyak konsultan, trainer, dan profesional yang punya pengetahuan berharga — tapi belum punya platform untuk mengemas dan menjualnya secara digital.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: "⏰", title: "Waktu habis untuk yang repetitif", desc: "Menjawab pertanyaan yang sama berulang-ulang, sementara pekerjaan bernilai tinggi terabaikan." },
              { icon: "📦", title: "Pengetahuan belum dikemas", desc: "Keahlian 10-20 tahun masih tersimpan di kepala — belum jadi produk yang bisa dijual." },
              { icon: "💸", title: "Revenue tidak scalable", desc: "Penghasilan terbatas waktu Anda. Tidak ada passive income dari keahlian yang sudah dimiliki." },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border bg-white dark:bg-card p-5 flex flex-col gap-3">
                <span className="text-2xl">{p.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RISET ── */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-muted/20 dark:to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
              Menurut Data
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Memonetisasi Keahlian Bukan Lagi Tren — Ini Gelombang Besar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Data lembaga riset global menunjukkan ekonomi kreator dan ekonomi digital tumbuh pesat —
              momentum tepat untuk mengubah pengetahuan menjadi penghasilan.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {STATS_MITRA.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border bg-white dark:bg-card p-6 text-center" data-testid={`stat-mitra-${i}`}>
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <SIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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

      {/* ── SOLUSI: MITRA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
              Solusi
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Gustafta Memberi Anda Semua yang Dibutuhkan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Infrastruktur penuh tersedia — Anda tinggal bawa keahlian.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", title: "Platform Builder", desc: "Buat dan kelola chatbot AI tanpa coding. Template 1350+ siap digunakan." },
              { icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", title: "Payment Gateway", desc: "Pembayaran otomatis via Scalev.id. Anda terima 80% langsung ke rekening." },
              { icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", title: "Template Marketplace", desc: "Jual template chatbot ke ribuan pengguna Gustafta. Passive income berkelanjutan." },
              { icon: Users, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", title: "Dukungan Penuh", desc: "Training, materi marketing, dan support tim Gustafta selama Anda aktif." },
            ].map((f) => (
              <div key={f.title} className={`rounded-2xl ${f.bg} border border-white/60 dark:border-white/5 p-5 flex flex-col gap-3`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JALUR MITRA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">3 Jalur Menjadi Mitra</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pilih sesuai kapasitas dan tujuan Anda.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: "🤝", tier: "Afiliasi", badge: "", highlight: false,
                tagline: "Rekomendasikan & Dapatkan Komisi",
                desc: "Bagikan link referral Anda. Setiap pengguna yang daftar lewat link Anda menghasilkan komisi.",
                items: ["Komisi per konversi", "Dashboard tracking real-time", "Materi promosi siap pakai", "Tanpa target minimum"],
                cta: "Daftar Afiliasi",
              },
              {
                icon: "⚡", tier: "Reseller", badge: "Populer", highlight: true,
                tagline: "Jual Template & Ekosistem AI",
                desc: "Buat dan jual template chatbot di Gustafta Store. Revenue sharing 80% untuk setiap penjualan.",
                items: ["80% dari setiap penjualan", "Publish unlimited template", "Laporan penjualan otomatis", "Support onboarding pembeli"],
                cta: "Mulai Jual Template",
              },
              {
                icon: "🏛️", tier: "Partner Strategis", badge: "", highlight: false,
                tagline: "Bangun Ekosistem untuk Klien",
                desc: "Gunakan platform Gustafta untuk membangun solusi AI bagi klien Anda.",
                items: ["Harga khusus mitra", "Dedicated account manager", "Co-marketing opportunity"],
                cta: "Hubungi Tim Kami",
              },
            ].map((t) => (
              <div key={t.tier} className={`relative rounded-2xl border p-6 flex flex-col gap-4 ${t.highlight ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-card"}`}>
                {t.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">{t.badge}</span>
                  </div>
                )}
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{t.tier}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{t.tagline}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{t.desc}</div>
                </div>
                <ul className="space-y-2 flex-1">
                  {t.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{i}
                    </li>
                  ))}
                </ul>
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button className={`w-full text-xs h-9 ${t.highlight ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`} variant={t.highlight ? "default" : "outline"} data-testid={`btn-tier-${t.tier.toLowerCase().replace(/\s/g, "-")}`}>
                    {t.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Program Ini Untuk Anda</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji: "💼", label: "Konsultan Independen", desc: "Kemas pengalaman konsultasi Anda jadi chatbot dan jual ke banyak klien sekaligus." },
              { emoji: "🎓", label: "Instruktur & Trainer", desc: "Digitalisasi materi pelatihan, jual sebagai template, hasilkan passive income." },
              { emoji: "🏛️", label: "Lembaga Sertifikasi (LSP)", desc: "Buat ekosistem kompetensi digital untuk peserta — sertifikasi + AI panduan." },
              { emoji: "📣", label: "Digital Marketer", desc: "Bantu klien Anda punya chatbot AI — tambah layanan, tambah revenue Anda." },
              { emoji: "🤝", label: "Community Builder", desc: "Rekomendasikan Gustafta ke komunitas Anda, raih komisi dari setiap konversi." },
              { emoji: "🏢", label: "Perusahaan Pelatihan", desc: "Bangun platform pelatihan AI untuk tim Anda, didukung infrastruktur Gustafta." },
            ].map((p) => (
              <div key={p.label} className="rounded-2xl border bg-gray-50 dark:bg-muted/20 p-5 flex flex-col gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.label}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Cara Kerja Program Mitra</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">4 langkah dari daftar hingga penghasilan pertama.</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-5">
            {[
              { step: "01", title: "Daftar Mitra", desc: "Hubungi tim Gustafta via WhatsApp. Isi form mitra — proses verifikasi 1×24 jam." },
              { step: "02", title: "Onboarding", desc: "Training platform, akses materi marketing, dan panduan produksi template pertama Anda." },
              { step: "03", title: "Buat & Publish", desc: "Buat template chatbot atau ekosistem AI. Publish ke Gustafta Store atau tawarkan ke klien." },
              { step: "04", title: "Terima Revenue", desc: "Setiap penjualan otomatis masuk ke dashboard Anda. Transfer ke rekening setiap periode." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-4">{s.step}</div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEUNTUNGAN VISUAL ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
                Potensi Penghasilan
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ekosistem yang Menghasilkan — Bahkan Saat Anda Tidur
              </h2>
              <div className="space-y-4 mb-6">
                {[
                  { label: "Template Sekali Jual", value: "Passive income berkelanjutan", bar: 85 },
                  { label: "Komisi Referral", value: "Per konversi, otomatis tercatat", bar: 65 },
                  { label: "Ekosistem Klien", value: "Revenue berulang dari langganan", bar: 90 },
                ].map((r) => (
                  <div key={r.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{r.label}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{r.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${r.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Ilustrasi potensi. Hasil aktual tergantung aktivitas dan keahlian masing-masing mitra.</p>
            </div>
            <div className="rounded-2xl border bg-gray-50 dark:bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Dashboard Mitra</span>
              </div>
              {[
                { label: "Template Aktif", badge: "🔥 Trending", bar: 88 },
                { label: "Konversi Bulan Ini", badge: "📈 Naik", bar: 72 },
                { label: "Revenue Terkumpul", badge: "⭐ Milestone", bar: 60 },
                { label: "Pembeli Baru", badge: "✨ Baru", bar: 45 },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{m.label}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{m.badge}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${m.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Bergabunglah dengan Ekosistem Mitra Gustafta
          </h2>
          <p className="text-emerald-100 text-sm mb-8 leading-relaxed">
            Platform sudah siap. Payment sudah siap. Marketplace sudah siap.<br />
            Yang kurang hanya satu: keahlian dan pengetahuan Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-final-mitra">
                <MessageCircle className="h-5 w-5" /> Jadi Mitra — Hubungi Kami
              </Button>
            </a>
            <Link href={builderUrl}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-cta-final-coba">
                Coba Builder Gratis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-gray-50 dark:bg-muted/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">GUSTAFTA MITRA</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ekosistem kemitraan digital yang menguntungkan.</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-emerald-600">Beranda</Link>
            <Link href="/store" className="hover:text-emerald-600">Store</Link>
            <Link href="/produk" className="hover:text-emerald-600">Produk</Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
