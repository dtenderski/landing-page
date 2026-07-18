import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Video, TrendingUp,
  PenTool, BarChart3, Users, Zap, Globe,
  ShoppingBag, Heart, Target, Layers,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20content%20creator";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const CHALLENGES = [
  { icon: <PenTool className="h-5 w-5 text-red-500" />, title: "Kehabisan Ide Konten", desc: "Content block adalah musuh terbesar kreator. Kewajiban posting konsisten tanpa ide segar membuat kualitas konten menurun dan engagement ikut anjlok." },
  { icon: <TrendingUp className="h-5 w-5 text-red-500" />, title: "Tidak Tahu Apa yang Trending", desc: "Algoritma platform berubah terus. Konten yang bekerja bulan lalu sudah tidak relevan hari ini. Susah mengikuti tren tanpa sistem monitoring yang baik." },
  { icon: <ShoppingBag className="h-5 w-5 text-red-500" />, title: "Monetisasi yang Stagnan", desc: "Sudah punya follower tapi tidak tahu cara mengkonversi audiens menjadi penghasilan. Brand deal, affiliate, jualan produk — bingung mulai dari mana." },
  { icon: <BarChart3 className="h-5 w-5 text-red-500" />, title: "Tidak Paham Data Analitik", desc: "Insight platform ada, tapi tidak tahu cara membacanya untuk mengoptimalkan strategi konten. Hanya posting dan berharap — bukan berdasarkan data." },
];

const SOLUTIONS = [
  {
    id: "strategi",
    color: "rose",
    icon: <Target className="h-6 w-6 text-rose-600" />,
    name: "BrandContentClaw",
    title: "Brand Identity & Strategi Konten",
    sub: "AI Konsultan Brand & Content — 8 sub-agen",
    desc: "Bangun brand identity yang kuat dan strategi konten yang kohesif agar setiap postingan berkontribusi pada pertumbuhan jangka panjang.",
    features: [
      "Audit brand identity dan positioning saat ini",
      "Pengembangan brand voice & visual guideline",
      "Content pillar strategy per platform (IG, TikTok, YouTube, LinkedIn)",
      "Content calendar planning bulanan & mingguan",
      "Konsistensi pesan lintas platform dan format konten",
    ],
  },
  {
    id: "digital",
    color: "violet",
    icon: <TrendingUp className="h-6 w-6 text-violet-600" />,
    name: "DigitalMarketingClaw",
    title: "Digital Marketing & Growth Hacking",
    sub: "AI Konsultan Digital Marketing — 8 sub-agen",
    desc: "Terapkan strategi digital marketing yang terbukti untuk tumbuhkan follower organik dan tingkatkan reach konten Anda.",
    features: [
      "Strategi hashtag & SEO konten per platform",
      "Analisis kompetitor & benchmark performa konten",
      "Optimasi caption, hook, dan call-to-action",
      "Panduan kolaborasi & cross-promotion dengan kreator lain",
      "Strategi growth organik tanpa iklan berbayar",
    ],
  },
  {
    id: "monetisasi",
    color: "amber",
    icon: <ShoppingBag className="h-6 w-6 text-amber-600" />,
    name: "EcommerceClaw",
    title: "Monetisasi & Digital Commerce",
    sub: "AI Konsultan E-Commerce — 8 sub-agen",
    desc: "Ubah audiens setia Anda menjadi pelanggan yang membayar melalui berbagai jalur monetisasi yang sesuai niche Anda.",
    features: [
      "Panduan membuka toko online & digital product",
      "Strategi affiliate marketing & brand deal",
      "Pricing strategi untuk produk & jasa digital",
      "Funnel konversi dari follower ke pembeli",
      "Panduan jualan di Tokopedia, Shopee, TikTok Shop",
    ],
  },
  {
    id: "crm",
    color: "blue",
    icon: <Heart className="h-6 w-6 text-blue-600" />,
    name: "CrmSalesClaw",
    title: "Community Building & Audience CRM",
    sub: "AI Konsultan CRM & Sales — 8 sub-agen",
    desc: "Bangun komunitas yang loyal dan hubungan jangka panjang dengan audiens yang menghasilkan pendapatan berulang.",
    features: [
      "Strategi membangun komunitas aktif (grup, forum, Discord)",
      "Panduan membership & subscription model untuk kreator",
      "Teknik engagement untuk tingkatkan komentar & interaksi",
      "Email marketing & newsletter untuk kreator",
      "CRM sederhana untuk manajemen subscriber & pelanggan",
    ],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  rose: { bg: "bg-rose-50 dark:bg-rose-900/10", border: "border-rose-200 dark:border-rose-800", icon: "bg-rose-100 dark:bg-rose-900/30", tag: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/30", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/30", tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", icon: "bg-blue-100 dark:bg-blue-900/30", tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const NICHES = ["🎮 Gaming", "💄 Beauty & Fashion", "🍳 Food & Kuliner", "✈️ Travel", "💪 Health & Fitness", "💰 Finansial & Investasi", "👶 Parenting", "🏠 Home & Lifestyle", "📚 Edukasi & Self-dev", "⚙️ Teknologi & Gadget", "🎨 Seni & Desain", "🌿 Sustainability"];

export default function ContentCreatorPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-content-creator">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-pink-600 to-violet-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Video className="h-3.5 w-3.5" />
                AI untuk Content Creator & Digital Creator Indonesia
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Konten Lebih Strategis,<br />
                <span className="text-pink-200">Monetisasi Lebih Optimal</span>
              </h1>
              <p className="text-base md:text-lg text-rose-100 mb-8 leading-relaxed">
                Dari strategi konten, brand identity, digital marketing, community building,
                hingga monetisasi produk digital — AI Gustafta adalah tim konsultan kreatif
                yang selalu siap mendampingi perjalanan kreator Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-rose-700 hover:bg-rose-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "4", label: "AI Tools Kreator", sub: "Brand, Marketing, Commerce, CRM" },
                { num: "8+", label: "Sub-Agen per Claw", sub: "Analisis mendalam per aspek" },
                { num: "12+", label: "Niche Didukung", sub: "Gaming hingga Sustainability" },
                { num: "∞", label: "Ide Konten", sub: "Tidak pernah kehabisan ide lagi" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-pink-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHALLENGES ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-2">Masalah Nyata Kreator</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Kenapa Banyak Kreator Berhenti di Tengah Jalan?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CHALLENGES.map((c, i) => (
              <div key={i} className="flex items-start gap-4 bg-white dark:bg-card rounded-2xl p-5 border border-gray-100 dark:border-border">
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl flex-shrink-0">{c.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest text-center mb-2">Solusi AI Gustafta</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">4 AI Konsultan untuk Ekosistem Kreator</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {SOLUTIONS.map((sol) => {
              const c = colorStyles[sol.color];
              return (
                <div key={sol.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-solution-${sol.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${c.icon}`}>{sol.icon}</div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{sol.name}</span>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mt-1">{sol.title}</h3>
                      <p className="text-[10px] text-gray-400">{sol.sub}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{sol.desc}</p>
                  <ul className="space-y-1.5">
                    {sol.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NICHE ── */}
      <section className="py-16 px-4 bg-rose-50 dark:bg-rose-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest text-center mb-2">Semua Niche</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">AI yang Paham Berbagai Niche Kreator</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NICHES.map((niche, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-xl p-3 border border-rose-100 dark:border-border text-center text-xs font-medium text-gray-700 dark:text-muted-foreground">
                {niche}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest text-center mb-2">Untuk Siapa</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Level Kreator Mana Pun, AI Ini untuk Anda</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Zap className="h-5 w-5 text-rose-500" />, title: "Kreator Pemula", points: ["Baru mulai membuat konten", "Masih mencari niche & gaya konten", "Belum punya strategi yang jelas", "Ingin monetisasi tapi tidak tahu caranya"] },
              { icon: <TrendingUp className="h-5 w-5 text-violet-500" />, title: "Kreator Berkembang", points: ["Sudah punya 1K–100K followers", "Ingin naik ke level berikutnya", "Strategi konten belum konsisten", "Mulai masuk brand deal pertama"] },
              { icon: <Globe className="h-5 w-5 text-blue-500" />, title: "Full-time Creator & Agency", points: ["Kreator profesional dengan tim", "Mengelola multiple platform sekaligus", "Klien brand dan content agency", "Ingin scale bisnis konten lebih jauh"] },
            ].map((group, i) => (
              <div key={i} className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl p-5 border border-rose-100 dark:border-rose-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
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
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Konteks Efektivitas Content Marketing</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "3× lipat", label: "Lead dari content marketing dibanding metode outbound", source: "Demand Metric", icon: <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" /> },
              { value: "62%", label: "Lebih hemat biaya dibanding outbound marketing", source: "Demand Metric", icon: <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" /> },
              { value: "87%", label: "Marketer menyatakan content marketing menghasilkan demand & leads", source: "Content Marketing Institute 2024", icon: <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-rose-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">{s.icon}</div>
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
      <section className="py-16 px-4 bg-gradient-to-br from-rose-600 via-pink-600 to-violet-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Video className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Kreativitas Anda + Strategi AI = Pertumbuhan Nyata</h2>
          <p className="text-rose-100 mb-8 leading-relaxed">
            Berhenti posting tanpa arah. Mulai bangun karir kreator dengan strategi yang terbukti.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-rose-700 hover:bg-rose-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-rose-200 mt-5">
            Lihat juga:{" "}
            <Link href="/persona"><span className="underline font-semibold cursor-pointer">Semua Buyer Persona →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/persona"><span className="hover:text-white cursor-pointer">Buyer Persona</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
