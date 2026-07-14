/**
 * GUSTAFTA APPS — Onboarding / Plan Selection Page
 * New users land here after registration/login to choose their package.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess, PLAN_CONFIGS } from "@/hooks/use-feature-access";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Check, X, ArrowRight, Rocket, Bot, Zap, Building2, Crown,
  Phone, MessageSquare, BookOpen, Blocks, PlaySquare, FileText,
  Mic, Globe, Shield, Headphones, Star, CheckCircle2, Lock, Flame, Clock, Code
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackLead } from "@/lib/meta-pixel";

const FEATURE_ICONS: Record<string, typeof Check> = {
  chatbot: MessageSquare,
  modul_pembelajaran: BookOpen,
  mini_apps: Blocks,
  ecourse: PlaySquare,
  doc_generator: FileText,
  podcast: Mic,
  custom_domain: Globe,
  priority_support: Headphones,
  api_access: Rocket,
};

const FEATURE_NAMES: Record<string, string> = {
  chatbot: "AI Chatbot",
  modul_pembelajaran: "Modul Pembelajaran",
  mini_apps: "Mini Apps",
  ecourse: "E-Course",
  doc_generator: "Document Generator",
  podcast: "Podcast",
  custom_domain: "Custom Domain",
  priority_support: "Priority Support",
  api_access: "API Access",
};

const PLAN_ICONS = { starter: Bot, profesional: Zap, bisnis: Building2, enterprise: Crown };

const PLAN_LIMIT_LABELS = [
  { key: "maxAgents", label: "Agent AI" },
  { key: "maxSeries", label: "Seri / Domain" },
  { key: "maxMiniAppTypes", label: "Tipe Mini App" },
  { key: "maxMessagesPerMonth", label: "Pesan AI / Bulan" },
  { key: "maxCustomDomains", label: "Custom Domain" },
] as const;

function formatLimit(val: number): string {
  if (val === -1) return "Tak terbatas";
  return val.toLocaleString("id-ID");
}

function formatPrice(n: number) {
  if (n === 0) return "Custom";
  return "Rp " + n.toLocaleString("id-ID");
}

const PLANS_TO_SHOW = ["starter", "profesional", "bisnis", "enterprise"] as const;

type ShowPlan = (typeof PLANS_TO_SHOW)[number];

export default function OnboardingPage() {
  const { user, isAuthenticated } = useAuth();
  const { planInfo } = useFeatureAccess();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selected, setSelected] = useState<ShowPlan>("profesional");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"choose" | "confirm" | "success">("choose");

  const WA = "https://wa.me/6282299417818";
  const waMsg = (plan: string) => {
    trackLead({ content_name: "WhatsApp CTA" });
    return `${WA}?text=${encodeURIComponent(`Halo, saya ingin berlangganan Gustafta Apps paket ${PLAN_CONFIGS[plan as ShowPlan]?.name ?? plan}. User: ${user?.email ?? "-"}`)}`;
  };

  async function handleActivateFree() {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    // Redirect to Dialog Gustafta — user must complete dialog to activate trial
    navigate("/konsultasi");
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Login Dulu</h1>
          <p className="text-muted-foreground text-sm">
            Untuk memilih paket Gustafta Apps, Anda perlu login terlebih dahulu.
          </p>
          <Button onClick={() => (window.location.href = "/login")} className="w-full gap-2">
            <Rocket className="h-4 w-4" /> Login / Daftar
          </Button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Selamat datang di Gustafta Apps!</h1>
          <p className="text-muted-foreground">
            {selected === "starter" || selected === "profesional" || selected === "bisnis"
              ? "Tim kami akan menghubungi Anda dalam 1×24 jam untuk proses setup. Cek WhatsApp Anda."
              : "Trial Anda sudah aktif. Eksplorasi platform sekarang!"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/dashboard")} className="gap-2">
              <Rocket className="h-4 w-4" /> Ke Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/my-subscription")} className="gap-2">
              Lihat Langganan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold">Gustafta Apps</span>
            <Badge variant="secondary" className="text-xs">Pilih Paket</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Login sebagai <strong>{user?.email}</strong>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Current plan banner */}
        {planInfo.tier > 0 && planInfo.status === "active" && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Anda sudah berlangganan paket <strong>{planInfo.config.name}</strong></p>
              <p className="text-xs text-muted-foreground">
                Aktif hingga {planInfo.endDate ? new Date(planInfo.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "–"}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/my-subscription")} className="ml-auto shrink-0">
              Kelola Langganan
            </Button>
          </div>
        )}

        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Pilih Paket Anda</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Mulai Ekosistem Digital Anda
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Setiap paket terdiri dari <strong>Biaya Setup</strong> (satu kali, sudah termasuk lisensi + Starter Kit) + <strong>Biaya Bulanan</strong>. 
            Pilih paket yang sesuai kebutuhan, tim kami akan menghubungi Anda dalam 24 jam.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {PLANS_TO_SHOW.map((planKey) => {
            const plan = PLAN_CONFIGS[planKey];
            const Icon = PLAN_ICONS[planKey];
            const isSelected = selected === planKey;
            const isPop = planKey === "profesional";

            return (
              <div
                key={planKey}
                onClick={() => setSelected(planKey)}
                className={cn(
                  "relative rounded-2xl border-2 cursor-pointer transition-all",
                  planKey === "bisnis"
                    ? isSelected
                      ? "border-red-500 shadow-xl shadow-red-500/20 scale-[1.02]"
                      : "border-red-500/40 hover:border-red-500/70"
                    : isSelected
                    ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/40"
                )}
                data-testid={`card-plan-${planKey}`}
              >
                {isPop && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 text-xs gap-1">
                      <Star className="h-3 w-3" /> Paling Populer
                    </Badge>
                  </div>
                )}
                {planKey === "bisnis" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-red-500 text-white px-3 text-xs gap-1 whitespace-nowrap">
                      <Flame className="h-3 w-3" /> PROMO · Harga Naik 1 Juli
                    </Badge>
                  </div>
                )}

                <div className="p-5 pt-7 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                        style={{ backgroundColor: `${plan.color}15` }}>
                        <Icon className="h-5 w-5" style={{ color: plan.color }} />
                      </div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <div className="text-xs text-muted-foreground mb-0.5">Setup (sekali)</div>
                      <div className="font-bold" style={{ color: plan.color }}>
                        {planKey === "enterprise" ? "Negosiasi" : formatPrice(plan.setupFee)}
                      </div>
                    </div>
                    <div className={cn("rounded-lg p-3", planKey === "bisnis" ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900" : "bg-muted/60")}>
                      <div className="text-xs text-muted-foreground mb-0.5">Bulanan</div>
                      <div className="font-bold" style={{ color: planKey === "bisnis" ? "#ef4444" : plan.color }}>
                        {planKey === "enterprise" ? "Custom" : formatPrice(plan.monthlyFee) + "/bln"}
                      </div>
                      {planKey === "bisnis" && (
                        <div className="flex items-center gap-1 mt-1">
                          <Flame className="h-3 w-3 text-red-500 shrink-0" />
                          <span className="text-[10px] text-red-500 font-medium">Naik → Rp 1,99jt/bln per 1 Jul</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="space-y-1.5">
                    {PLAN_LIMIT_LABELS.map((lim) => (
                      <div key={lim.key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{lim.label}</span>
                        <span className="font-medium">{formatLimit(plan[lim.key])}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 pt-1 border-t">
                    {Object.entries(plan.features).map(([feat, enabled]) => {
                      const FIcon = FEATURE_ICONS[feat] ?? Check;
                      return (
                        <div key={feat} className={cn("flex items-center gap-1.5 text-xs", !enabled && "opacity-40")}>
                          {enabled
                            ? <FIcon className="h-3 w-3 text-green-500 shrink-0" />
                            : <X className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <span className={enabled ? "" : "line-through"}>{FEATURE_NAMES[feat]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="max-w-lg mx-auto text-center space-y-4">
          {selected === "enterprise" ? (
            <a href={waMsg("enterprise")} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full gap-2 py-6 text-base" data-testid="button-subscribe-enterprise">
                <Phone className="h-5 w-5" />
                Hubungi Tim Enterprise
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
          ) : (
            <a href={waMsg(selected)} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="w-full gap-2 py-6 text-base"
                data-testid={`button-subscribe-${selected}`}
              >
                <Rocket className="h-5 w-5" />
                Mulai Paket {PLAN_CONFIGS[selected]?.name}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
          )}

          <p className="text-xs text-muted-foreground">
            Setelah klik, tim kami akan menghubungi via WhatsApp dalam 1×24 jam untuk proses setup & invoice.
          </p>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">Ingin coba dulu?</p>
            <Button
              variant="outline"
              onClick={handleActivateFree}
              disabled={isSubmitting}
              className="gap-2"
              data-testid="button-try-free"
            >
              <Zap className="h-4 w-4" />
              {isSubmitting ? "Mengaktifkan..." : "Aktifkan Trial Gratis (Terbatas)"}
            </Button>
          </div>
        </div>

        {/* ── Delivery Timeline ───────────────────────────────────────── */}
        <div className="mt-14 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Yang Anda Terima Setelah Aktivasi</p>
            <h3 className="text-xl font-bold">Dari Konfirmasi ke Live dalam 30 Menit</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {([
              { step: "1", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", title: "Akun Aktif", desc: "Login langsung, akses dashboard penuh sesuai paket" },
              { step: "2", icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", title: "Buat Agent AI", desc: "Pilih template atau dari scratch, siap dalam menit" },
              { step: "3", icon: BookOpen, color: "text-orange-500", bg: "bg-orange-500/10", title: "Upload KB", desc: "PDF, URL, atau teks jadi knowledge base agent Anda" },
              { step: "4", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10", title: "Deploy & Share", desc: "Embed code di website atau bagikan URL publik" },
            ] as const).map(({ step, icon: Icon, color, bg, title, desc }) => (
              <div key={step} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ background: bg.replace("bg-", "") }}>
                  <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{step}</span>
                </div>
                <div className="font-semibold text-sm mb-1">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>

          {/* Deliverables grid */}
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">Semua Ini Sudah Tersedia di Dashboard Anda</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {([
                { icon: Bot, label: "AI Agent dengan system prompt & KB", color: "text-primary" },
                { icon: Code, label: "Embed code (widget JS + iframe) siap pakai", color: "text-violet-500" },
                { icon: Globe, label: "URL chat publik per agent", color: "text-blue-500" },
                { icon: Blocks, label: "45 Mini Apps produktivitas (RAB, kontrak, dll)", color: "text-orange-500" },
                { icon: BookOpen, label: "Knowledge base 7 tipe upload", color: "text-emerald-500" },
                { icon: CheckCircle2, label: "Onboarding support via WhatsApp", color: "text-emerald-500" },
              ] as const).map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <Icon className={`h-4 w-4 ${color} shrink-0`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-6">
            <a href="/welcome" className="text-sm text-primary underline underline-offset-4 hover:no-underline" data-testid="link-panduan-lengkap">
              Lihat Panduan Setup Lengkap →
            </a>
          </div>
        </div>
        {/* ───────────────────────────────────────────────────────────── */}

      </div>
    </div>
  );
}
