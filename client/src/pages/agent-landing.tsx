import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DemoChat from "@/components/demo-chat";
import {
  CheckCircle2, MessageSquare, Phone, Calendar, Star, ChevronDown, ChevronUp,
  Zap, Shield, Award, ArrowRight, Bot, Sparkles, AlertCircle, UserPlus,
  CreditCard, Rocket, Lock, BadgeCheck
} from "lucide-react";

interface LandingData {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  category: string;
  landingPageEnabled: boolean;
  landingHeroHeadline: string;
  landingHeroSubheadline: string;
  landingHeroCtaText: string;
  landingPainPoints: string[];
  landingSolutionText: string;
  landingBenefits: Array<{ title: string; description: string }>;
  landingDemoItems: Array<{ question: string; answer: string }>;
  landingTestimonials: Array<{ name: string; role: string; company: string; text: string; rating?: number }>;
  landingFaq: Array<{ q: string; a: string }>;
  landingAuthority: { title?: string; items?: string[] };
  landingGuarantees: string[];
  productFeatures: string[];
  conversionOffers: Array<{ title: string; description: string; value: string }>;
  monthlyPrice: number | null;
  whatsappCta: string;
  calendlyUrl: string;
  chatUrl: string;
  metaPixelId: string;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-3" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-3" />}
      </button>
      {open && (
        <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

export default function AgentLanding() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;

  const { data, isLoading, error } = useQuery<LandingData>({
    queryKey: [`/api/landing/${agentId}`],
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Memuat halaman…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Halaman tidak ditemukan</h2>
          <p className="text-gray-400 text-sm">Landing page ini tidak tersedia.</p>
        </div>
      </div>
    );
  }

  const heroHeadline = data.landingHeroHeadline || data.name;
  const heroSub = data.landingHeroSubheadline || data.description || data.tagline;
  const ctaText = data.landingHeroCtaText || "Mulai Sekarang";
  const painPoints = Array.isArray(data.landingPainPoints) ? data.landingPainPoints.filter(Boolean) : [];
  const benefits = Array.isArray(data.landingBenefits) ? data.landingBenefits.filter(Boolean) : [];
  const features = Array.isArray(data.productFeatures) ? data.productFeatures.filter(Boolean) : [];
  const demos = Array.isArray(data.landingDemoItems) ? data.landingDemoItems.filter(Boolean) : [];
  const testimonials = Array.isArray(data.landingTestimonials) ? data.landingTestimonials.filter(Boolean) : [];
  const faqs = Array.isArray(data.landingFaq) ? data.landingFaq.filter(Boolean) : [];
  const guarantees = Array.isArray(data.landingGuarantees) ? data.landingGuarantees.filter(Boolean) : [];
  const authority = data.landingAuthority || {};
  const offers = Array.isArray(data.conversionOffers) ? data.conversionOffers.filter(Boolean) : [];
  const price = data.monthlyPrice ? `Rp ${Number(data.monthlyPrice).toLocaleString("id-ID")}` : null;

  const handleCta = () => {
    if (data.chatUrl) window.open(data.chatUrl, "_blank");
  };
  const handleWhatsapp = () => {
    if (data.whatsappCta) {
      const num = data.whatsappCta.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=Halo, saya tertarik dengan ${data.name}`, "_blank");
    }
  };
  const handleCalendly = () => {
    if (data.calendlyUrl) window.open(data.calendlyUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Meta Pixel */}
      {data.metaPixelId && (
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${data.metaPixelId}');fbq('track','PageView');` }} />
      )}

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-300 rounded-full blur-2xl translate-y-1/2" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          {/* Avatar / Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur mb-6 mx-auto">
            {data.avatar ? (
              <img src={data.avatar} alt={data.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <Bot className="w-10 h-10 text-white" />
            )}
          </div>

          {data.category && (
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white/90 text-xs font-medium px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              AI {data.category}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5 max-w-4xl mx-auto">
            {heroHeadline}
          </h1>
          {heroSub && (
            <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto leading-relaxed">
              {heroSub}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={handleCta}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-base"
              data-testid="btn-hero-cta"
            >
              <MessageSquare className="w-5 h-5" />
              {ctaText}
              <ArrowRight className="w-4 h-4" />
            </button>
            {data.whatsappCta && (
              <button
                onClick={handleWhatsapp}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-base"
                data-testid="btn-whatsapp"
              >
                <Phone className="w-5 h-5" />
                WhatsApp
              </button>
            )}
          </div>

          {guarantees.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              {guarantees.slice(0, 3).map((g, i) => (
                <span key={i} className="flex items-center gap-1.5 text-white/80 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── DEMO CHAT ────────────────────────────────── */}
      {data.landingPageEnabled && (
      <section className="py-16 bg-white" data-testid="section-demo-chat">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Coba Gratis
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Coba Langsung Sekarang</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Buktikan kualitas jawabannya sebelum membeli — tanpa perlu daftar.
            </p>
          </div>
          <DemoChat
            agentId={String(data.id)}
            agentName={data.name}
            avatar={data.avatar}
            chatUrl={data.chatUrl || `/chat/${data.slug}`}
            ctaText={data.landingHeroCtaText || "Mulai Sekarang"}
          />
        </div>
      </section>
      )}

      {/* ── PAIN POINTS ──────────────────────────────── */}
      {painPoints.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium mb-3">
                <AlertCircle className="w-3.5 h-3.5" />
                Apakah Anda Mengalami Ini?
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Tantangan yang Sering Dihadapi</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {painPoints.map((p, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-red-100 rounded-xl p-4">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">✕</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SOLUTION ─────────────────────────────────── */}
      {data.landingSolutionText && (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Solusi
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-5">Solusi Cerdas untuk Anda</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{data.landingSolutionText}</p>
          </div>
        </section>
      )}

      {/* ── BENEFITS ─────────────────────────────────── */}
      {benefits.length > 0 && (
        <section className="py-16 bg-indigo-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-indigo-600 bg-white px-3 py-1 rounded-full text-xs font-medium mb-3 shadow-sm">
                <Award className="w-3.5 h-3.5" />
                Keunggulan
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Manfaat yang Anda Dapatkan</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {benefits.map((b, i) => {
                const title = typeof b === "string" ? b : b.title;
                const desc = typeof b === "string" ? "" : b.description;
                return (
                  <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-indigo-100">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1.5">{title}</h3>
                    {desc && <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ─────────────────────────────────── */}
      {features.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Fitur Lengkap</h2>
              <p className="text-gray-500">Semua yang Anda butuhkan, dalam satu platform</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                  <span className="text-gray-700 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DEMO / CARA KERJA ────────────────────────── */}
      {demos.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-violet-600 bg-violet-50 px-3 py-1 rounded-full text-xs font-medium mb-3">
                <MessageSquare className="w-3.5 h-3.5" />
                Demo
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Lihat Cara Kerjanya</h2>
            </div>
            <div className="space-y-4">
              {demos.map((d, i) => {
                const q = typeof d === "string" ? d : d.question;
                const a = typeof d === "string" ? "" : d.answer;
                return (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                    <div className="flex items-start gap-3 p-4 bg-indigo-50">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">U</div>
                      <p className="text-sm text-gray-700 font-medium pt-1">{q}</p>
                    </div>
                    {a && (
                      <div className="flex items-start gap-3 p-4">
                        <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pt-1">{a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── AUTHORITY ────────────────────────────────── */}
      {authority?.items && authority.items.length > 0 && (
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            {authority.title && <p className="text-gray-400 text-sm mb-6 uppercase tracking-wide">{authority.title}</p>}
            <div className="flex flex-wrap justify-center gap-4">
              {authority.items.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CARA BERLANGGANAN ────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <Rocket className="w-3.5 h-3.5" />
              Cara Memulai
            </div>
            <h2 className="text-3xl font-bold text-gray-800">3 Langkah Mudah untuk Memulai</h2>
            <p className="text-gray-500 mt-2">Dari daftar hingga langsung chat dengan AI — hanya dalam beberapa menit</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: UserPlus, step: "1", title: "Daftar Akun Gratis", desc: "Buat akun Gustafta Anda dalam 30 detik. Tidak perlu kartu kredit untuk mulai.", color: "bg-indigo-600" },
              { icon: CreditCard, step: "2", title: "Pilih & Aktifkan Paket", desc: "Pilih paket yang sesuai kebutuhan Anda. Pembayaran mudah via transfer atau dompet digital.", color: "bg-violet-600" },
              { icon: Rocket, step: "3", title: "Langsung Gunakan AI", desc: "Akses penuh ke chatbot AI ini beserta semua fitur premium. Langsung produktif hari ini.", color: "bg-emerald-600" },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:-right-2 w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING / UPGRADE MEMBER ─────────────────── */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-indigo-950 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <BadgeCheck className="w-3.5 h-3.5" />
              Paket & Harga
            </div>
            <h2 className="text-3xl font-bold mb-2">Pilih Paket yang Tepat</h2>
            <p className="text-white/60">Investasi terjangkau untuk efisiensi kerja yang nyata</p>
          </div>

          <div className={`grid gap-6 ${offers.length > 0 ? "md:grid-cols-" + Math.min(offers.length + 1, 3) : "md:grid-cols-2"} justify-center`}>
            {/* Free Trial Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="mb-4">
                <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">Coba Dulu</div>
                <div className="text-2xl font-bold">Gratis</div>
                <div className="text-white/50 text-sm mt-1">Akses demo terbatas</div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Coba chat langsung", "Lihat contoh respons AI", "Tidak perlu kartu kredit"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCta}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors text-sm"
                data-testid="btn-try-free"
              >
                Coba Sekarang
              </button>
            </div>

            {/* Main Paid Plan */}
            <div className="bg-indigo-600 border-2 border-indigo-400 rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/50">
              <div className="absolute top-4 right-4">
                <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">POPULER</span>
              </div>
              <div className="mb-4">
                <div className="text-xs font-medium text-indigo-200 uppercase tracking-wide mb-1">Akses Penuh</div>
                <div className="flex items-end gap-1">
                  <div className="text-3xl font-bold">{price || "Custom"}</div>
                  {price && <div className="text-indigo-200 text-sm mb-1">/bulan</div>}
                </div>
                <div className="text-indigo-200 text-sm mt-1">Semua fitur tidak terbatas</div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Chat tidak terbatas 24/7",
                  "Semua fitur premium aktif",
                  "Prioritas respons AI",
                  "Update konten reguler",
                  ...(guarantees.length > 0 ? guarantees.slice(0, 2) : ["Dukungan teknis"]),
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => window.open(`${window.location.origin}/login?mode=register`, "_blank")}
                className="w-full bg-white text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors text-sm shadow-lg"
                data-testid="btn-upgrade-member"
              >
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Daftar & Aktifkan Akses
                </span>
              </button>
              {data.whatsappCta && (
                <button
                  onClick={handleWhatsapp}
                  className="w-full mt-2 text-indigo-200 hover:text-white text-xs py-2 transition-colors"
                  data-testid="btn-pricing-wa"
                >
                  Tanya via WhatsApp dulu →
                </button>
              )}
            </div>

            {/* Custom/Enterprise if offers exist */}
            {offers.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                <div className="mb-4">
                  <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">Enterprise</div>
                  <div className="text-2xl font-bold">Custom</div>
                  <div className="text-white/50 text-sm mt-1">Untuk tim & organisasi</div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {offers.slice(0, 3).map((o: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      {typeof o === "string" ? o : o.title}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    SLA & dedicated support
                  </li>
                </ul>
                <button
                  onClick={data.whatsappCta ? handleWhatsapp : handleCta}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors text-sm"
                  data-testid="btn-enterprise-contact"
                >
                  Hubungi Kami
                </button>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-white/10">
            {[
              { icon: Lock, text: "Pembayaran Aman" },
              { icon: Shield, text: "Data Terproteksi" },
              { icon: BadgeCheck, text: "Bergaransi" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/50 text-xs">
                <Icon className="w-4 h-4" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium mb-3">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                Testimoni
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Dipercaya Pengguna Kami</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t, i) => {
                const name = typeof t === "string" ? t : t.name;
                const role = typeof t === "string" ? "" : t.role;
                const company = typeof t === "string" ? "" : t.company;
                const text = typeof t === "string" ? "" : t.text;
                const rating = typeof t === "string" ? 5 : (t.rating || 5);
                return (
                  <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <StarRating rating={rating} />
                    {text && <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-4">"{text}"</p>}
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{name}</div>
                      {(role || company) && (
                        <div className="text-gray-400 text-xs mt-0.5">{role}{role && company ? " · " : ""}{company}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800">Pertanyaan Umum</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => {
                const q = typeof faq === "string" ? faq : faq.q;
                const a = typeof faq === "string" ? "" : faq.a;
                return <FaqItem key={i} q={q} a={a} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-indigo-700 to-violet-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Memulai?</h2>
          <p className="text-white/80 text-lg mb-8">
            Coba {data.name} sekarang — tanpa perlu instalasi, langsung di browser Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCta}
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-xl text-base"
              data-testid="btn-final-cta"
            >
              <MessageSquare className="w-5 h-5" />
              {ctaText}
              <ArrowRight className="w-4 h-4" />
            </button>
            {data.whatsappCta && (
              <button
                onClick={handleWhatsapp}
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-4 rounded-xl transition-colors text-base"
                data-testid="btn-final-whatsapp"
              >
                <Phone className="w-5 h-5" />
                Hubungi via WhatsApp
              </button>
            )}
            {data.calendlyUrl && (
              <button
                onClick={handleCalendly}
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-6 py-4 rounded-xl transition-colors text-base"
                data-testid="btn-calendly"
              >
                <Calendar className="w-5 h-5" />
                Jadwalkan Demo
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="py-6 bg-gray-900 text-center">
        <p className="text-gray-500 text-xs">
          Dibuat dengan <span className="text-indigo-400">Gustafta</span> · AI Chatbot Builder
        </p>
      </footer>
    </div>
  );
}
