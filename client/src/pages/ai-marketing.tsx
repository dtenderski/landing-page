import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { priceForClass } from "@shared/premium-classes";
import {
  ArrowRight, Zap, Rocket, Sparkles, CheckCircle2, Users,
  ShieldCheck, Layers, Store, MessageCircle,
} from "lucide-react";

const K2_LICENSE = priceForClass(2) ?? 2_500_000;
const MONTHLY = 199_000;
const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

const PRODUCTS = [
  {
    slug: "/market-intelligence-claw", emoji: "🎯", name: "Market Intelligence",
    tagline: "War-room riset pasar & intelijen marketing",
    color: "from-emerald-500/20 to-teal-500/10", ring: "border-emerald-500/30",
    accent: "text-emerald-300",
    points: ["Bedah angle & iklan pesaing", "Audiens, tren, & celah positioning", "Amunisi iklan + aksi 7 hari"],
  },
  {
    slug: "/autopilot-jualan", emoji: "🚀", name: "Auto-Pilot Jualan",
    tagline: "Ketua Tim kampanye jualan otomatis",
    color: "from-indigo-500/20 to-blue-500/10", ring: "border-indigo-500/30",
    accent: "text-indigo-300",
    points: ["Copy iklan siap pakai (3 variasi)", "Targeting Meta + 2 persona", "Follow-up WA & kalender 7 hari"],
  },
  {
    slug: "/riset-audiens", emoji: "🔬", name: "Riset Audiens",
    tagline: "Riset audiens mendalam siap targeting",
    color: "from-cyan-500/20 to-teal-500/10", ring: "border-cyan-500/30",
    accent: "text-cyan-300",
    points: ["Hidden interest untuk targeting Meta", "Persona & segmentasi + prioritas", "Pain & bahasa pelanggan siap copy"],
  },
  {
    slug: "/funnel-otomatis", emoji: "🔄", name: "Funnel Otomatis",
    tagline: "Mesin follow-up otomatis end-to-end",
    color: "from-green-500/20 to-emerald-500/10", ring: "border-green-500/30",
    accent: "text-green-300",
    points: ["Sequence follow-up WhatsApp siap kirim", "Skrip CS bot & auto-reply", "Penanganan keberatan & closing"],
  },
  {
    slug: "/agen-keputusan", emoji: "🧭", name: "Agen Keputusan",
    tagline: "Analisa keputusan bisnis yang jernih",
    color: "from-amber-500/20 to-orange-500/10", ring: "border-amber-500/30",
    accent: "text-amber-300",
    points: ["Peta opsi + risiko & skenario", "Tabel kriteria & scoring", "Rekomendasi + rencana aksi"],
  },
];

const STEPS = [
  { icon: <Store className="h-5 w-5" />, title: "1. Beli sekali di Store", desc: "Pilih produk premium yang Anda butuhkan. Bayar lisensi sekali, langsung jadi milik Anda." },
  { icon: <Zap className="h-5 w-5" />, title: "2. Langsung siap pakai", desc: "Tanpa setup, tanpa rakit agen. Begitu dibeli, tim AI-nya langsung aktif di akun Anda." },
  { icon: <MessageCircle className="h-5 w-5" />, title: "3. Ketik 1 input, dapat hasil", desc: "Cukup satu input produk/usaha. Beberapa divisi bekerja paralel lalu merangkai hasil siap tempel." },
];

const DIFFERENTIATORS = [
  { icon: <Layers className="h-5 w-5" />, title: "Tim AI, bukan 1 chatbot", desc: "Tiap produk berisi beberapa divisi yang bekerja paralel per fungsi — hasilnya jauh lebih tajam daripada satu bot." },
  { icon: <Zap className="h-5 w-5" />, title: "Zero setup untuk pembeli", desc: "Anda tidak perlu merakit apa pun. Beli → langsung pakai. Cocok untuk pemilik usaha yang sibuk." },
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Gerbang manusia (◆)", desc: "Semua hasil adalah draf siap pakai. Keputusan & eksekusi final tetap di tangan Anda — jujur soal asumsi." },
  { icon: <Users className="h-5 w-5" />, title: "Bahasa & konteks Indonesia", desc: "Dirancang untuk pasar Indonesia: targeting Meta lokal, skrip WhatsApp, momen kampanye (gajian, Ramadan, dll.)." },
];

function useSeo() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "AI Marketing Suite — Tim AI Jualan Siap Pakai | Gustafta";
    const desc = "5 produk premium siap pakai berisi tim divisi AI: riset audiens, copy iklan, funnel follow-up, sampai analisa keputusan. Beli sekali, langsung pakai, tanpa setup.";
    const ensureMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      const created = !el;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      const prev = el.getAttribute("content");
      el.setAttribute("content", content);
      return { el, created, prev };
    };
    const metas = [
      ensureMeta("name", "description", desc),
      ensureMeta("property", "og:title", "AI Marketing Suite — Tim AI Jualan Siap Pakai | Gustafta"),
      ensureMeta("property", "og:description", desc),
      ensureMeta("property", "og:type", "website"),
    ];
    return () => {
      document.title = prevTitle;
      for (const m of metas) {
        if (m.created) m.el.remove();
        else if (m.prev != null) m.el.setAttribute("content", m.prev);
      }
    };
  }, []);
}

export default function AiMarketingLanding() {
  useSeo();
  return (
    <div className="min-h-screen bg-[#05060d] text-white overflow-x-hidden">
      {/* backdrop glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg tracking-tight">Gustafta</span>
          <Badge variant="outline" className="ml-1 text-[10px] border-white/15 text-white/50 hidden sm:inline-flex">AI Marketing Suite</Badge>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hidden sm:inline-flex" data-testid="button-login">
            <a href="/api/login">Masuk</a>
          </Button>
          <Button asChild size="sm" className="bg-white text-black hover:bg-white/90" data-testid="button-store-top">
            <Link href="/store">Lihat di Store</Link>
          </Button>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 px-5 sm:px-8 pt-16 pb-14 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          Tim AI marketing siap pakai — tanpa rakit, tanpa ribet
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
          Berhenti bakar budget iklan.
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">Mulai jualan dengan tim AI.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          Lima produk premium siap pakai — masing-masing berisi <strong className="text-white/80">tim divisi AI khusus</strong> yang bekerja paralel. Cukup satu input produk, dapat hasil siap tempel: riset audiens, copy iklan, funnel follow-up, sampai analisa keputusan.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-indigo-500 hover:bg-indigo-400 text-white w-full sm:w-auto" data-testid="button-explore-store">
            <Link href="/store">
              <Store className="h-4 w-4 mr-2" /> Jelajahi di Store <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/15 text-white hover:bg-white/5 w-full sm:w-auto" data-testid="button-free-consult">
            <Link href="/konsultasi">
              <MessageCircle className="h-4 w-4 mr-2" /> Konsultasi gratis dulu
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/40">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Zero setup pembeli</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Banyak divisi paralel per produk</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Konteks Indonesia</span>
        </div>
      </section>

      {/* products */}
      <section className="relative z-10 px-5 sm:px-8 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">5 Produk. 5 Tim AI. Satu tujuan: jualan.</h2>
          <p className="mt-3 text-white/50 max-w-2xl mx-auto text-sm">Tiap produk adalah Ketua Tim yang memimpin timnya sendiri (6–8 divisi). Pilih yang Anda butuhkan — atau miliki semuanya.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCTS.map((p) => (
            <div key={p.slug} className={`group rounded-2xl border ${p.ring} bg-gradient-to-br ${p.color} p-5 flex flex-col`} data-testid={`card-product-${p.slug.replace(/\//g, "")}`}>
              <div className="flex items-start justify-between">
                <span className="text-3xl">{p.emoji}</span>
                <Badge variant="outline" className="text-[10px] border-white/15 text-white/50">Premium K2</Badge>
              </div>
              <h3 className="mt-3 font-bold text-lg">{p.name}</h3>
              <p className={`text-sm ${p.accent} mb-3`}>{p.tagline}</p>
              <ul className="space-y-1.5 mb-4 flex-1">
                {p.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-white/40" /> {pt}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="text-xs text-white/50">
                  <div className="text-white/80 font-semibold">{rp(K2_LICENSE)}</div>
                  <div>lisensi + {rp(MONTHLY)}/bln</div>
                </div>
                <Button asChild size="sm" variant="ghost" className="text-white/70 hover:text-white" data-testid={`button-detail-${p.slug.replace(/\//g, "")}`}>
                  <Link href="/store">Beli <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </div>
          ))}
          {/* bundle card */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 flex flex-col justify-center text-center">
            <Rocket className="h-8 w-8 mx-auto text-indigo-300 mb-2" />
            <h3 className="font-bold text-lg">Butuh semuanya?</h3>
            <p className="text-sm text-white/50 mt-1 mb-4">Naik ke paket Bisnis untuk membuka seluruh suite marketing sekaligus.</p>
            <Button asChild size="sm" className="bg-white text-black hover:bg-white/90" data-testid="button-see-pricing">
              <Link href="/pricing">Lihat paket & harga</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="relative z-10 px-5 sm:px-8 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Cara kerjanya — semudah 3 langkah</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-testid={`step-${i}`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mb-3">{s.icon}</div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* differentiators */}
      <section className="relative z-10 px-5 sm:px-8 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Kenapa berbeda dari sekadar chatbot AI</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DIFFERENTIATORS.map((d, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-testid={`diff-${i}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">{d.icon}</div>
              <div>
                <h3 className="font-semibold mb-1">{d.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="relative z-10 px-5 sm:px-8 py-16 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/15 to-emerald-600/10 p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Punya tim marketing AI hari ini.
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Tak perlu tim mahal atau agensi. Beli sekali, langsung pakai, dan biarkan tim AI mengerjakan riset, iklan, & follow-up.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 w-full sm:w-auto" data-testid="button-cta-store">
              <Link href="/store"><Store className="h-4 w-4 mr-2" /> Mulai dari Store</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 text-white hover:bg-white/5 w-full sm:w-auto" data-testid="button-cta-consult">
              <Link href="/konsultasi">Tanya dulu ke asisten</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-5 sm:px-8 py-8 border-t border-white/5 text-center text-xs text-white/30">
        <p>Gustafta — platform yang mengubah pengetahuan manusia menjadi organisasi AI.</p>
        <p className="mt-1">Semua hasil AI adalah draf; keputusan & eksekusi final tetap di tangan Anda (◆ gerbang manusia).</p>
      </footer>
    </div>
  );
}
