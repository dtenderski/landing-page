import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, GraduationCap, FileText, Calculator, Bot,
  ArrowRight, ExternalLink, Download, Check, Star,
  ChevronDown, ChevronUp, MessageSquare, Layers, Zap,
  Shield, Clock, Users, Target, Play, BookMarked,
  ClipboardList, Wrench, Brain, Award, Globe
} from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type ProductType = "ecourse" | "ebook" | "mini-apps" | "docgen";

interface AgentPublic {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  tagline?: string;
  category?: string;
  expertise: string[];
  productFeatures: string[];
  landingPainPoints: string[];
  landingBenefits: string[];
  landingTestimonials: { name: string; role?: string; company?: string; quote: string }[];
  landingFaq: { question: string; answer: string }[];
  conversationStarters: string[];
  kbCount: number;
  kbCategories: string[];
  miniAppCount: number;
  miniApps: { id: string; name: string; description: string; type: string }[];
  moduleCount: number;
  chapterCount: number;
  monthlyPrice: number;
  trialEnabled: boolean;
  trialDays: number;
  whatsappCta?: string;
}

const PRODUCT_META: Record<ProductType, {
  label: string;
  icon: React.ElementType;
  accentFrom: string;
  accentTo: string;
  accentText: string;
  badge: string;
  badgeBg: string;
}> = {
  ecourse: {
    label: "eCourse",
    icon: GraduationCap,
    accentFrom: "from-violet-900",
    accentTo: "to-indigo-900",
    accentText: "text-violet-300",
    badge: "Modul Belajar Interaktif",
    badgeBg: "bg-violet-500/20 text-violet-200 border-violet-500/30",
  },
  ebook: {
    label: "eBook",
    icon: BookOpen,
    accentFrom: "from-amber-900",
    accentTo: "to-orange-900",
    accentText: "text-amber-300",
    badge: "Panduan Kompetensi Digital",
    badgeBg: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  },
  "mini-apps": {
    label: "Mini Apps",
    icon: Calculator,
    accentFrom: "from-emerald-900",
    accentTo: "to-teal-900",
    accentText: "text-emerald-300",
    badge: "Alat Kalkulasi & Analisis",
    badgeBg: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  },
  docgen: {
    label: "Generator Dokumen",
    icon: FileText,
    accentFrom: "from-blue-900",
    accentTo: "to-cyan-900",
    accentText: "text-blue-300",
    badge: "Dokumen Profesional Otomatis",
    badgeBg: "bg-blue-500/20 text-blue-200 border-blue-500/30",
  },
};

// ─── Cross‑sell strip ──────────────────────────────────────────────────────
function OtherProducts({ agentId, current }: { agentId: string; current: ProductType }) {
  const products = (Object.keys(PRODUCT_META) as ProductType[]).filter((p) => p !== current);
  const chatbotUrl = `/bot/${agentId}`;
  return (
    <section className="bg-gray-950 border-t border-white/10 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <p className="text-center text-sm text-gray-400 mb-6 uppercase tracking-widest font-semibold">
          Produk Ekosistem Kompetensi Lainnya
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map((p) => {
            const meta = PRODUCT_META[p];
            const Icon = meta.icon;
            return (
              <Link key={p} href={`/product/${agentId}/${p}`}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <Icon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-white text-center font-medium transition-colors">
                    {meta.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Link href={chatbotUrl}>
            <Button variant="outline" className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10 gap-2">
              <Bot className="w-4 h-4" /> Buka Chatbot Asisten
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Topbar ─────────────────────────────────────────────────────────
function Topbar({ agent, product, openUrl }: { agent: AgentPublic; product: ProductType; openUrl: string }) {
  const meta = PRODUCT_META[product];
  const Icon = meta.icon;
  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-white/10">
      <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Link href={`/bot/${agent.id}`}>
            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-7 w-7">
                {agent.avatar && <AvatarImage src={agent.avatar} />}
                <AvatarFallback className="bg-gray-700 text-white text-xs font-bold">
                  {agent.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-semibold text-sm hidden sm:block">{agent.name}</span>
            </div>
          </Link>
          <span className="text-gray-600 text-sm">›</span>
          <div className="flex items-center gap-1.5">
            <Icon className={`w-4 h-4 ${meta.accentText}`} />
            <span className={`text-sm font-semibold ${meta.accentText}`}>{meta.label}</span>
          </div>
        </div>
        <a href={openUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="gap-1.5 bg-white text-gray-900 hover:bg-gray-100 text-xs" data-testid="button-topbar-open">
            <ExternalLink className="w-3.5 h-3.5" /> Buka {meta.label}
          </Button>
        </a>
      </div>
    </header>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────
function Faq({ items }: { items: AgentPublic["landingFaq"] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <section className="py-16 bg-gray-950">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Pertanyaan Umum</h2>
        <div className="space-y-3">
          {items.map((f, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left text-white hover:bg-white/5 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
                data-testid={`button-faq-${i}`}
              >
                <span className="font-medium pr-4">{f.question}</span>
                {open === i ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-gray-300 text-sm leading-relaxed">{f.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────
function Testimonials({ items }: { items: AgentPublic["landingTestimonials"] }) {
  if (!items.length) return null;
  return (
    <section className="py-16 bg-gray-900">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Yang Mereka Katakan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed italic">"{t.quote}"</p>
              <div>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                {(t.role || t.company) && (
                  <p className="text-gray-500 text-xs">{[t.role, t.company].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT PAGES
// ═══════════════════════════════════════════════════════════════════════

// ─── eCourse Landing ──────────────────────────────────────────────────────
function EcourseLanding({ agent, agentId }: { agent: AgentPublic; agentId: string }) {
  const openUrl = `/api/agents/${agentId}/export/ecourse`;
  const modules = agent.kbCategories.length ? agent.kbCategories : agent.productFeatures.slice(0, 6);
  const quizCount = agent.conversationStarters.length;
  const features = [
    { icon: BookMarked, label: `${Math.max(agent.moduleCount, 1)} Modul Belajar`, desc: "Setiap modul berisi materi terstruktur dari Knowledge Base" },
    { icon: Brain, label: `${Math.max(quizCount, 5)} Soal Quiz`, desc: "Evaluasi pemahaman dari setiap conversation starter" },
    { icon: Clock, label: "Belajar Mandiri", desc: "Akses kapan saja, selesai sesuai kecepatan Anda" },
    { icon: Award, label: "Berbasis Kompetensi", desc: "Konten disesuaikan standar konstruksi Indonesia" },
    { icon: Globe, label: "Bahasa Indonesia", desc: "Seluruh materi dalam Bahasa Indonesia yang profesional" },
    { icon: Zap, label: "Interaktif", desc: "Navigasi modul, progress bar, dan evaluasi mandiri" },
  ];
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Topbar agent={agent} product="ecourse" openUrl={openUrl} />

      {/* Hero — dark purple like microlearning */}
      <section className="relative overflow-hidden py-24 md:py-36 bg-gradient-to-br from-violet-950 via-indigo-950 to-gray-950">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 70% 60%, #4f46e5 0%, transparent 50%)" }} />
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <Badge className="mb-6 bg-violet-500/20 text-violet-200 border border-violet-500/30 px-4 py-1.5 text-sm">
            ✨ Ditenagai oleh Gustafta AI
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6" data-testid="text-ecourse-headline">
            Kuasai{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              {agent.name}
            </span>
            <br />dalam Satu eCourse
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            {agent.description || `Pelajari ${agent.category || "kompetensi konstruksi"} secara terstruktur — dari teori hingga praktik lapangan.`}
          </p>
          <p className="text-sm text-violet-300 mb-10">{agent.tagline}</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mb-10 flex-wrap">
            {[
              { val: `${Math.max(agent.moduleCount, 1)}+`, label: "Modul" },
              { val: `${Math.max(quizCount, 5)}+`, label: "Soal Quiz" },
              { val: Math.max(agent.kbCount, 1) + "x", label: "KB Diproses" },
              { val: "100%", label: "Gratis" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-extrabold text-violet-300">{s.val}</div>
                <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={openUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 text-base gap-2 w-full sm:w-auto" data-testid="button-open-ecourse-hero">
                <Play className="w-4 h-4" /> Mulai eCourse Gratis
              </Button>
            </a>
            <Link href={`/bot/${agentId}`}>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 px-6 py-3 text-base gap-2 w-full sm:w-auto">
                <MessageSquare className="w-4 h-4" /> Tanya Chatbot Asisten
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modules preview */}
      {modules.length > 0 && (
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-3">Kurikulum eCourse</h2>
            <p className="text-gray-400 text-center mb-10 text-sm">Modul dirancang dari Knowledge Base chatbot {agent.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((mod, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center flex-shrink-0 text-violet-300 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{mod}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sesi materi + evaluasi</p>
                  </div>
                  <Check className="w-4 h-4 text-violet-400 ml-auto flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-10">Apa yang Anda Dapatkan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <Icon className="w-7 h-7 text-violet-400 mb-3" />
                  <p className="font-semibold text-white mb-1">{f.label}</p>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quiz preview from conversation starters */}
      {agent.conversationStarters.length > 0 && (
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl font-bold mb-3">Contoh Soal Quiz</h2>
            <p className="text-gray-400 text-sm mb-8">Diambil dari conversation starters chatbot {agent.name}</p>
            <div className="space-y-3 text-left">
              {agent.conversationStarters.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-violet-950/50 border border-violet-500/20">
                  <span className="text-violet-400 font-bold text-sm flex-shrink-0">Q{i + 1}.</span>
                  <p className="text-gray-300 text-sm">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Testimonials items={agent.landingTestimonials} />
      <Faq items={agent.landingFaq} />

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-950 to-indigo-950 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-extrabold mb-4">Siap Mulai Belajar?</h2>
          <p className="text-gray-300 mb-8 text-lg">eCourse ini sepenuhnya gratis dan dapat diakses langsung</p>
          <a href={openUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-violet-600 hover:bg-violet-500 px-10 py-4 text-lg font-semibold gap-2" data-testid="button-open-ecourse-cta">
              <GraduationCap className="w-5 h-5" /> Buka eCourse Sekarang
            </Button>
          </a>
        </div>
      </section>

      <OtherProducts agentId={agentId} current="ecourse" />
    </div>
  );
}

// ─── eBook Landing ───────────────────────────────────────────────────────
function EbookLanding({ agent, agentId }: { agent: AgentPublic; agentId: string }) {
  const openUrl = `/api/agents/${agentId}/export/ebook`;
  const chapters = [
    "Pendahuluan & Konteks Kompetensi",
    "Definisi & Ruang Lingkup",
    "Kerangka Kompetensi Teknis",
    "Regulasi & Standar yang Berlaku",
    "Prosedur & Metodologi",
    "Studi Kasus & Praktik Terbaik",
    "Checklist & Alat Bantu",
    "Penutup & Referensi",
  ];
  const benefits = agent.landingBenefits.length
    ? agent.landingBenefits
    : agent.expertise.slice(0, 5).map((e) => `Panduan ${e}`);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Topbar agent={agent} product="ebook" openUrl={openUrl} />

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-gray-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, #d97706 0%, transparent 55%)" }} />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-5 bg-amber-500/20 text-amber-200 border border-amber-500/30 px-3 py-1">
                📘 Panduan Kompetensi Digital
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5" data-testid="text-ebook-headline">
                eBook Kompetensi{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  {agent.name}
                </span>
              </h1>
              <p className="text-gray-300 text-lg mb-3">
                {agent.description || "Panduan lengkap berbasis Knowledge Base chatbot AI untuk profesional konstruksi Indonesia."}
              </p>
              {agent.tagline && <p className="text-amber-300 text-sm italic mb-8">{agent.tagline}</p>}
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={`${openUrl}?format=html`} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white px-7 py-3 text-base gap-2" data-testid="button-open-ebook-html">
                    <BookOpen className="w-4 h-4" /> Baca Online (HTML)
                  </Button>
                </a>
                <a href={`${openUrl}?format=md`} download>
                  <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 px-6 py-3 gap-2">
                    <Download className="w-4 h-4" /> Unduh .md
                  </Button>
                </a>
              </div>
            </div>

            {/* Book cover mockup */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-52 h-72 rounded-l-sm rounded-r-md shadow-2xl overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #92400e, #d97706, #f59e0b)", transform: "perspective(600px) rotateY(-10deg)" }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <BookOpen className="w-12 h-12 text-white/80 mb-3" />
                    <div className="text-white font-bold text-sm leading-tight">{agent.name}</div>
                    <div className="text-white/70 text-xs mt-2">8 Bab Kompetensi</div>
                    <div className="mt-4 text-white/60 text-xs">Gustafta AI</div>
                  </div>
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20" style={{ borderRight: "1px solid rgba(0,0,0,0.3)" }} />
                </div>
                <div className="absolute -right-2 top-2 bottom-2 w-2 bg-gradient-to-r from-amber-900 to-amber-950 rounded-r" style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.5)" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-2 text-center">Daftar Isi</h2>
          <p className="text-gray-400 text-center text-sm mb-10">8 bab kompetensi yang komprehensif</p>
          <div className="space-y-3">
            {chapters.map((ch, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-gray-200 font-medium">{ch}</span>
                <ArrowRight className="w-4 h-4 text-gray-600 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      {benefits.length > 0 && (
        <section className="py-16 bg-gray-950">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-10">Yang Akan Anda Pelajari</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Testimonials items={agent.landingTestimonials} />
      <Faq items={agent.landingFaq} />

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-950 to-orange-950 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-extrabold mb-4">Unduh eBook Gratis Sekarang</h2>
          <p className="text-gray-300 mb-8">Panduan komprehensif berbasis AI — tersedia dalam HTML, Markdown, dan teks biasa.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`${openUrl}?format=html`} target="_blank" rel="noopener noreferrer">
              <Button className="bg-amber-600 hover:bg-amber-500 px-8 py-3 text-base gap-2" data-testid="button-open-ebook-cta">
                <BookOpen className="w-4 h-4" /> Baca Online
              </Button>
            </a>
            <a href={`${openUrl}?format=xlsx`} download>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 px-8 py-3 gap-2">
                <Download className="w-4 h-4" /> Unduh Excel
              </Button>
            </a>
          </div>
        </div>
      </section>

      <OtherProducts agentId={agentId} current="ebook" />
    </div>
  );
}

// ─── Mini Apps Landing ────────────────────────────────────────────────────
function MiniAppsLanding({ agent, agentId }: { agent: AgentPublic; agentId: string }) {
  const chatUrl = `/bot/${agentId}`;
  const apps = agent.miniApps.length
    ? agent.miniApps
    : [
        { id: "1", name: "Kalkulator Estimasi", description: "Hitung estimasi biaya dan material proyek", type: "calculator" },
        { id: "2", name: "Checklist Proyek", description: "Daftar pemeriksaan proyek yang terstruktur", type: "checklist" },
        { id: "3", name: "Analisis Risiko", description: "Identifikasi dan evaluasi risiko proyek", type: "analysis" },
      ];
  const typeIcon: Record<string, React.ElementType> = {
    calculator: Calculator,
    checklist: ClipboardList,
    analysis: Target,
    wizard: Wrench,
    default: Zap,
  };
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Topbar agent={agent} product="mini-apps" openUrl={chatUrl} />

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-gray-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #059669 0%, transparent 55%)" }} />
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-4 py-1.5 text-sm">
            ⚡ Alat Kalkulasi & Analisis Proyek
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6" data-testid="text-miniapps-headline">
            Mini Apps untuk{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Produktivitas Proyek
            </span>
          </h1>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            {agent.miniAppCount > 0
              ? `${agent.miniAppCount} alat interaktif terintegrasi chatbot ${agent.name} — kalkulator, checklist, analisis, dan wizard siap pakai.`
              : `Alat kalkulasi, checklist, dan analisis interaktif yang terintegrasi langsung dengan chatbot ${agent.name}.`}
          </p>
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {[`${Math.max(agent.miniAppCount, 3)} Mini Apps`, "Langsung Pakai", "Terintegrasi AI"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                <Check className="w-4 h-4" /> {s}
              </div>
            ))}
          </div>
          <Link href={chatUrl}>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 text-base gap-2" data-testid="button-open-miniapps-hero">
              <Calculator className="w-4 h-4" /> Akses Mini Apps via Chatbot
            </Button>
          </Link>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-3">Koleksi Mini Apps</h2>
          <p className="text-gray-400 text-center text-sm mb-10">Akses melalui chatbot {agent.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app, i) => {
              const Icon = typeIcon[app.type] || typeIcon.default;
              return (
                <div key={app.id || i} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{app.name}</h3>
                  <p className="text-gray-400 text-sm">{app.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to access */}
      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-10">Cara Mengakses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "1", title: "Buka Chatbot", desc: `Masuk ke chatbot ${agent.name}`, icon: MessageSquare },
              { num: "2", title: "Ketik Perintah", desc: "Tanyakan atau minta mini app yang Anda butuhkan", icon: Zap },
              { num: "3", title: "Gunakan Alat", desc: "Interaksi langsung dengan kalkulator / checklist", icon: Check },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-lg">{s.num}</div>
                  <Icon className="w-5 h-5 text-emerald-300" />
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-gray-400 text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Testimonials items={agent.landingTestimonials} />
      <Faq items={agent.landingFaq} />

      <section className="py-20 bg-gradient-to-br from-emerald-950 to-teal-950 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-extrabold mb-4">Coba Mini Apps Sekarang</h2>
          <p className="text-gray-300 mb-8">Akses semua alat interaktif langsung melalui chatbot {agent.name}</p>
          <Link href={chatUrl}>
            <Button className="bg-emerald-600 hover:bg-emerald-500 px-10 py-4 text-lg font-semibold gap-2" data-testid="button-open-miniapps-cta">
              <Calculator className="w-5 h-5" /> Buka Chatbot & Mini Apps
            </Button>
          </Link>
        </div>
      </section>

      <OtherProducts agentId={agentId} current="mini-apps" />
    </div>
  );
}

// ─── DocGen Landing ───────────────────────────────────────────────────────
function DocgenLanding({ agent, agentId }: { agent: AgentPublic; agentId: string }) {
  const openUrl = `/docgen/${agentId}`;
  const docTypes = [
    { icon: ClipboardList, name: "Checklist Proyek", desc: "Daftar pemeriksaan pekerjaan terstruktur" },
    { icon: FileText, name: "SOP Lapangan", desc: "Prosedur operasional standar kegiatan konstruksi" },
    { icon: Target, name: "Formulir Penilaian", desc: "Form evaluasi kompetensi dan kinerja" },
    { icon: Shield, name: "Laporan K3", desc: "Laporan keselamatan dan kesehatan kerja" },
    { icon: BookOpen, name: "Berita Acara", desc: "Dokumen resmi kegiatan dan serah terima" },
    { icon: Layers, name: "Template Tender", desc: "Dokumen penawaran dan kualifikasi proyek" },
  ];
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Topbar agent={agent} product="docgen" openUrl={openUrl} />

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-cyan-950 to-gray-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 35% 50%, #1d4ed8 0%, transparent 55%)" }} />
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-200 border border-blue-500/30 px-4 py-1.5 text-sm">
            📄 Dokumen Profesional Otomatis
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6" data-testid="text-docgen-headline">
            Buat Dokumen Proyek{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              dalam Hitungan Detik
            </span>
          </h1>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Generator Dokumen otomatis berbasis AI dari chatbot {agent.name} — SOP, checklist, form, laporan, dan dokumen tender siap unduh.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={openUrl}>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base gap-2" data-testid="button-open-docgen-hero">
                <FileText className="w-4 h-4" /> Buat Dokumen Sekarang
              </Button>
            </Link>
            <Link href={`/bot/${agentId}`}>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 px-6 py-3 gap-2">
                <MessageSquare className="w-4 h-4" /> Tanya Chatbot Asisten
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Document types */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-3">Jenis Dokumen yang Dihasilkan</h2>
          <p className="text-gray-400 text-center text-sm mb-10">Disesuaikan otomatis dengan domain {agent.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {docTypes.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                  <Icon className="w-7 h-7 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">{d.name}</h3>
                  <p className="text-gray-400 text-sm">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Keunggulan Generator Dokumen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Konten otomatis dari Knowledge Base chatbot",
              "Format HTML interaktif dengan kolom isian",
              "Sesuai standar konstruksi Indonesia",
              "Unduh dan cetak langsung dari browser",
              "Tidak perlu template manual — AI mengatur layout",
              "Disesuaikan dengan domain spesifik chatbot",
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials items={agent.landingTestimonials} />
      <Faq items={agent.landingFaq} />

      <section className="py-20 bg-gradient-to-br from-blue-950 to-cyan-950 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-extrabold mb-4">Buat Dokumen Proyek Anda</h2>
          <p className="text-gray-300 mb-8">Gratis, otomatis, dan siap unduh</p>
          <Link href={openUrl}>
            <Button className="bg-blue-600 hover:bg-blue-500 px-10 py-4 text-lg font-semibold gap-2" data-testid="button-open-docgen-cta">
              <FileText className="w-5 h-5" /> Generate Dokumen Sekarang
            </Button>
          </Link>
        </div>
      </section>

      <OtherProducts agentId={agentId} current="docgen" />
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="h-14 bg-gray-900 border-b border-white/10" />
      <div className="container mx-auto px-4 max-w-4xl py-24 space-y-6">
        <Skeleton className="h-8 w-40 mx-auto bg-white/10" />
        <Skeleton className="h-16 w-3/4 mx-auto bg-white/10" />
        <Skeleton className="h-6 w-2/3 mx-auto bg-white/10" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-36 bg-white/10" />
          <Skeleton className="h-12 w-36 bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────
export default function EkosistemLanding() {
  const params = useParams<{ agentId: string; product: string }>();
  const agentId = params.agentId || "";
  const product = (params.product || "ecourse") as ProductType;

  const { data: agent, isLoading } = useQuery<AgentPublic>({
    queryKey: [`/api/public/agent/${agentId}`],
    enabled: !!agentId,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <Bot className="h-16 w-16 text-gray-600 mx-auto" />
          <h1 className="text-2xl font-bold">Chatbot Tidak Ditemukan</h1>
          <p className="text-gray-400">Halaman produk yang Anda cari tidak tersedia.</p>
          <Link href="/">
            <Button variant="outline" className="border-white/20 gap-2 mt-2">
              <ArrowRight className="w-4 h-4 rotate-180" /> Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (product === "ecourse") return <EcourseLanding agent={agent} agentId={agentId} />;
  if (product === "ebook") return <EbookLanding agent={agent} agentId={agentId} />;
  if (product === "mini-apps") return <MiniAppsLanding agent={agent} agentId={agentId} />;
  if (product === "docgen") return <DocgenLanding agent={agent} agentId={agentId} />;

  return <EcourseLanding agent={agent} agentId={agentId} />;
}
