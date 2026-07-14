/**
 * /welcome — Post-Subscribe Welcome Kit
 * Shown to users after plan activation to guide first steps.
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, BookOpen, Globe, Blocks, BarChart3, Code, Rocket,
  ArrowRight, CheckCircle2, Copy, Check, MessageSquare,
  Phone, Layers, Zap, ChevronRight, Package, Sparkles,
  CreditCard, Play, FileText, HardHat, Star
} from "lucide-react";
import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";

const WA_NUMBER = "6282299417818";

function waMsg(topic: string) {
  trackLead({ content_name: "WhatsApp CTA" });
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Halo Gustafta, saya butuh bantuan onboarding: ${topic}`)}`;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Tersalin!", description: "Kode berhasil disalin ke clipboard." });
  };
  return (
    <div className="relative rounded-xl bg-zinc-900 dark:bg-zinc-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
      <pre className="pr-10 whitespace-pre-wrap break-all">{code}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
        data-testid="button-copy-code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

const STEPS = [
  {
    num: "01",
    icon: Bot,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Buat Agent Pertama Anda",
    desc: "Masuk ke Dashboard → klik \"+ Agent Baru\". Pilih template yang sesuai industri Anda, atau mulai dari scratch.",
    cta: { label: "Buka Dashboard", href: "/dashboard", external: false },
    tips: [
      "Gunakan salah satu dari 131 Hub Orchestrator yang sudah dikonfigurasi",
      "Template tersedia: Customer Support, Legal, Konstruksi, Education, dll.",
      "Agent siap menjawab dalam hitungan menit",
    ],
  },
  {
    num: "02",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Upload Knowledge Base",
    desc: "Isi agent Anda dengan pengetahuan: upload PDF, masukkan URL website, atau ketik Q&A langsung.",
    cta: { label: "Ke Dashboard → KB", href: "/dashboard", external: false },
    tips: [
      "Mendukung PDF, DOCX, TXT, URL, dan teks bebas",
      "Sistem otomatis memecah dan mengindeks konten",
      "Agent Anda menjawab hanya berdasarkan data yang Anda upload",
    ],
  },
  {
    num: "03",
    icon: Code,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Deploy ke Website Anda",
    desc: "Satu baris kode JavaScript. Tempel di bagian <body> website Anda — chatbot langsung muncul.",
    cta: null,
    tips: [
      "Kode bersifat dinamis: perubahan config diterapkan otomatis",
      "Tersedia mode: floating widget, iframe embed, atau full-page",
      "Ganti agent tanpa ganti kode di website",
    ],
    code: true,
  },
  {
    num: "04",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Bagikan Link Chat Publik",
    desc: "Setiap agent punya URL publik. Bagikan ke WhatsApp, email, atau buat QR code — tanpa pasang kode di website.",
    cta: { label: "Buka Dashboard", href: "/dashboard", external: false },
    tips: [
      "Format: gustafta.app/bot/[agent-id]",
      "Bisa dicustom dengan domain sendiri (plan Profesional+)",
      "Cocok untuk share via WA Group, link di bio, atau QR code fisik",
    ],
  },
  {
    num: "05",
    icon: Blocks,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Jelajahi Mini Apps (45 Tipe)",
    desc: "Dari RAB estimator, contract drafter, notulis rapat, hingga sales script. Tools AI siap pakai tanpa konfigurasi.",
    cta: { label: "Buka Mini Apps", href: "/dashboard", external: false },
    tips: [
      "Tersedia di Dashboard → Mini Apps",
      "Hub: Belajar, Bekerja, Berusaha, Kreator, Konstruksi",
      "Output bisa langsung disalin atau didownload",
    ],
  },
];

const DELIVERABLES = [
  { icon: Bot, label: "Chatbot AI agent yang dikonfigurasi penuh", color: "text-primary" },
  { icon: Code, label: "Embed code siap pasang di website", color: "text-violet-500" },
  { icon: Globe, label: "URL chat publik untuk setiap agent", color: "text-blue-500" },
  { icon: BookOpen, label: "Knowledge base dengan 7 tipe upload", color: "text-emerald-500" },
  { icon: Blocks, label: "Akses 45 Mini Apps produktivitas", color: "text-orange-500" },
  { icon: BarChart3, label: "Dashboard analytics & manajemen", color: "text-pink-500" },
  { icon: Layers, label: "131 Hub Orchestrator siap pakai", color: "text-indigo-500" },
  { icon: MessageSquare, label: "Support onboarding via WhatsApp", color: "text-emerald-500" },
];

// Embed code samples — domain filled in dynamically once app URL is fetched
function makeSampleEmbed(base: string) {
  return `<!-- Gustafta Chat Widget -->
<script
  src="${base}/widget/loader.js"
  data-agent-id="GANTI_DENGAN_AGENT_ID_ANDA">
</script>
<!-- End Gustafta Chat Widget -->`;
}

function makeSampleIframe(base: string) {
  return `<iframe
  src="${base}/embed/GANTI_DENGAN_AGENT_ID"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius:12px">
</iframe>`;
}

export default function WelcomePage() {
  const { user, isAuthenticated } = useAuth();
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscriptions/my"] });
  const [activeStep, setActiveStep] = useState(0);
  const [appUrl, setAppUrl] = useState<string>(window.location.origin);

  useEffect(() => {
    fetch("/api/config/app-url")
      .then((r) => r.json())
      .then((d) => { if (d.appUrl) setAppUrl(d.appUrl); })
      .catch(() => {});
  }, []);

  const planLabel = (p?: string) => {
    const map: Record<string, string> = {
      starter: "Starter", profesional: "Profesional", bisnis: "Bisnis", enterprise: "Enterprise", free: "Free",
    };
    return map[p ?? "free"] ?? "Free";
  };

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="pt-20 pb-10 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-5">
            <CheckCircle2 className="h-4 w-4" />
            {isAuthenticated ? `Selamat datang, ${user?.firstName ?? ""}!` : "Panduan Memulai Gustafta"}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-welcome-title">
            {isAuthenticated && subscription?.plan && subscription?.status === "active"
              ? <>Paket <span className="text-primary">{planLabel(subscription.plan)}</span> Anda Sudah Aktif!</>
              : <>Dari Subscribe ke <span className="text-primary">Live</span> dalam 30 Menit</>}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Berikut panduan langkah demi langkah untuk deploy chatbot AI pertama Anda — mulai dari setup hingga embed di website.
          </p>

          {/* What you get summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
            {[
              { icon: Bot, label: "AI Agent" },
              { icon: Code, label: "Embed Code" },
              { icon: Globe, label: "URL Publik" },
              { icon: Blocks, label: "45 Mini Apps" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-muted/60 p-3 flex flex-col items-center gap-1.5">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2" data-testid="button-go-dashboard">
                <Rocket className="h-5 w-5" />
                Buka Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <a href="/login">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-login-welcome">
                  <Zap className="h-5 w-5" />
                  Login / Daftar Gratis
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Step-by-step guide */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Langkah-Langkah Setup</h2>

          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <Card
                  key={step.num}
                  className={`cursor-pointer transition-all border-2 ${isActive ? "border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/30"}`}
                  onClick={() => setActiveStep(isActive ? -1 : i)}
                  data-testid={`card-step-${step.num}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${step.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-6 w-6 ${step.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-muted-foreground">LANGKAH {step.num}</span>
                        </div>
                        <CardTitle className="text-base md:text-lg">{step.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isActive ? "rotate-90" : ""}`} />
                    </div>
                  </CardHeader>

                  {isActive && (
                    <CardContent className="pt-0 pb-5 space-y-4">
                      <ul className="space-y-2">
                        {step.tips.map((tip) => (
                          <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>

                      {step.code && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Floating Widget (Disarankan)</p>
                            <CodeBlock code={makeSampleEmbed(appUrl)} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Embed sebagai iFrame</p>
                            <CodeBlock code={makeSampleIframe(appUrl)} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Ganti <code className="bg-muted px-1 rounded">GANTI_DENGAN_AGENT_ID_ANDA</code> dengan ID agent dari Dashboard → Settings agent Anda.
                          </p>
                        </div>
                      )}

                      {step.cta && (
                        <Link href={step.cta.href}>
                          <Button size="sm" className="gap-2" data-testid={`button-step-cta-${step.num}`}>
                            <ArrowRight className="h-4 w-4" />
                            {step.cta.label}
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full deliverables list */}
      <section className="py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-3">Yang Sudah Disiapkan untuk Anda</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">Semua ini tersedia di dashboard Anda sejak hari pertama.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DELIVERABLES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/20 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Butuh Bantuan Setup?</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Tim onboarding kami siap membantu via WhatsApp. Dari konfigurasi agent hingga pasang embed code di website Anda.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={waMsg("onboarding pertama")} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2" data-testid="button-wa-support">
                  <Phone className="h-5 w-5" />
                  Hubungi via WhatsApp
                </Button>
              </a>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-go-dashboard-support">
                  <Rocket className="h-5 w-5" />
                  Buka Dashboard
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              WA: +62 822-9941-7818 · Respon dalam 1×24 jam kerja
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
