/**
 * GUSTAFTA APPS — My Subscription Dashboard
 * Shows the user's current plan, feature access, and upgrade options.
 */
import { Link, useLocation } from "wouter";
import { trackLead } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess, PLAN_CONFIGS, FEATURE_LABELS, type FeatureKey } from "@/hooks/use-feature-access";
import {
  Check, X, Lock, Rocket, ArrowRight, Crown, Calendar, Clock,
  MessageSquare, BookOpen, Blocks, PlaySquare, FileText, Mic,
  Globe, Headphones, Cpu, Bot, Zap, Building2,
  RefreshCw, Phone, ChevronRight, Sparkles, BarChart3, AlertCircle, CheckCircle2,
  HardHat, Briefcase, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const FEATURE_ICONS: Record<FeatureKey, typeof Check> = {
  chatbot: MessageSquare,
  modul_pembelajaran: BookOpen,
  mini_apps: Blocks,
  ecourse: PlaySquare,
  doc_generator: FileText,
  podcast: Mic,
  custom_domain: Globe,
  priority_support: Headphones,
  api_access: Cpu,
  ai_tools: Bot,
  advanced_ai_tools: Sparkles,
  claw_sbu_tender: HardHat,
  claw_bisnis: Briefcase,
};

const PLAN_ORDER = ["starter", "profesional", "bisnis", "enterprise"] as const;
const PLAN_ICONS = { starter: Bot, profesional: Zap, bisnis: Building2, enterprise: Crown };

function formatDate(d: string | null | undefined) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(n: number) {
  if (n === 0) return "Custom";
  return "Rp " + n.toLocaleString("id-ID");
}

function formatLimit(val: number) {
  if (val === -1) return "∞ Tak terbatas";
  return val.toLocaleString("id-ID");
}

const WA = (plan: string, email: string) =>
  `https://wa.me/6282299417818?text=${encodeURIComponent(`Halo, saya ingin upgrade ke paket ${PLAN_CONFIGS[plan as keyof typeof PLAN_CONFIGS]?.name ?? plan}. Email: ${email}`)}`;

export default function MySubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const { planInfo, isLoading } = useFeatureAccess();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: pendingData } = useQuery<{ pending: any | null }>({
    queryKey: ["/api/subscriptions/pending"],
    enabled: isAuthenticated,
  });

  const upgradeMutation = useMutation({
    mutationFn: (targetPlan: string) => apiRequest("POST", "/api/subscriptions/upgrade", { plan: targetPlan }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/pending"] });
      toast({
        title: "Permintaan Naik Tier tercatat",
        description: data?.message ?? "Admin akan mengaktifkan setelah pembayaran dikonfirmasi.",
      });
      if (data?.waUrl) window.open(data.waUrl, "_blank");
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/pending"] });
      toast({
        title: "Tidak dapat memproses",
        description: "Mungkin sudah ada permintaan upgrade yang menunggu, atau terjadi kesalahan. Coba lagi.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center space-y-4 max-w-sm">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Login Diperlukan</h2>
            <Button onClick={() => (window.location.href = "/login")} className="gap-2">
              <Rocket className="h-4 w-4" /> Login Sekarang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const plan = planInfo.config;
  const isActive = planInfo.status === "active";
  const isPaid = planInfo.tier > 0;
  const currentKey = planInfo.plan ?? "free";

  const nextPlanKey = (() => {
    const idx = PLAN_ORDER.indexOf(currentKey as (typeof PLAN_ORDER)[number]);
    if (idx === -1 || idx >= PLAN_ORDER.length - 1) return null;
    return PLAN_ORDER[idx + 1];
  })();

  const pendingUpgrade = pendingData?.pending ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Langganan Saya</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/onboarding")} className="gap-2" data-testid="button-change-plan">
            <Rocket className="h-4 w-4" /> Upgrade Paket
          </Button>
        </div>

        {/* Status card */}
        <Card className={cn("border-2", isActive && isPaid ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5")}>
          <CardContent className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
              isActive && isPaid ? "bg-green-500/10" : "bg-amber-500/10"
            )}>
              {isActive && isPaid
                ? <Crown className="h-7 w-7 text-green-500" />
                : <AlertCircle className="h-7 w-7 text-amber-500" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-bold text-lg">{plan.name}</span>
                <Badge className={cn("text-xs gap-1",
                  isActive && isPaid ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                )}>
                  {isActive && isPaid ? <><CheckCircle2 className="h-3 w-3" /> Aktif</> : <><Clock className="h-3 w-3" /> {planInfo.status === "unauthenticated" || planInfo.status === "loading" ? "–" : "Tidak Aktif"}</>}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              {planInfo.startDate && (
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Mulai: {formatDate(planInfo.startDate)}</span>
                  {planInfo.endDate && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Berakhir: {formatDate(planInfo.endDate)}</span>
                  )}
                  {planInfo.daysRemaining !== null && planInfo.daysRemaining > 0 && (
                    <Badge variant="secondary" className="text-xs">{planInfo.daysRemaining} hari tersisa</Badge>
                  )}
                </div>
              )}
            </div>

            {!isPaid && (
              <Link href="/onboarding">
                <Button className="gap-2 shrink-0" data-testid="button-subscribe-now">
                  <Rocket className="h-4 w-4" /> Berlangganan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Feature access */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Fitur yang Bisa Diakses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((feat) => {
                const enabled = plan.features[feat];
                const FIcon = FEATURE_ICONS[feat];
                const label = FEATURE_LABELS[feat];
                return (
                  <div key={feat} className={cn("flex items-center gap-3 p-2 rounded-lg transition-colors",
                    enabled ? "bg-green-500/5 border border-green-500/10" : "bg-muted/30"
                  )}>
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                      enabled ? "bg-green-500/10" : "bg-muted"
                    )}>
                      {enabled
                        ? <FIcon className="h-4 w-4 text-green-500" />
                        : <Lock className="h-4 w-4 text-muted-foreground/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-none">{label.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{label.description}</div>
                    </div>
                    {enabled
                      ? <Check className="h-4 w-4 text-green-500 shrink-0" />
                      : <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Limits + Upgrade */}
          <div className="space-y-5">
            {/* Limits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Batas Penggunaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "maxAgents", label: "Agent AI", icon: Bot },
                  { key: "maxSeries", label: "Seri / Domain", icon: Blocks },
                  { key: "maxMiniAppTypes", label: "Tipe Mini App", icon: Cpu },
                  { key: "maxMessagesPerMonth", label: "Pesan AI / Bulan", icon: MessageSquare },
                  { key: "maxCustomDomains", label: "Custom Domain", icon: Globe },
                ] .map((item) => {
                  const val = plan[item.key as keyof typeof plan] as number;
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </div>
                      <span className={cn("text-sm font-semibold", val === -1 ? "text-green-500" : "text-foreground")}>
                        {formatLimit(val)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Pending upgrade — menunggu konfirmasi admin */}
            {pendingUpgrade ? (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">Menunggu Konfirmasi Admin</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permintaan paket{" "}
                    <span className="font-medium text-foreground">
                      {PLAN_CONFIGS[pendingUpgrade.plan as keyof typeof PLAN_CONFIGS]?.name ?? pendingUpgrade.plan}
                    </span>{" "}
                    sudah tercatat. Selesaikan pembayaran, lalu admin akan mengaktifkannya.
                  </p>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tarif baru: </span>
                    <span className="font-bold text-primary">
                      {formatPrice(PLAN_CONFIGS[pendingUpgrade.plan as keyof typeof PLAN_CONFIGS]?.monthlyFee ?? 0)}/bln
                    </span>
                  </div>
                  <a href={WA(pendingUpgrade.plan, user?.email ?? "")} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full gap-2" data-testid="button-complete-payment">
                      <Phone className="h-4 w-4" />
                      Selesaikan Pembayaran
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ) : nextPlanKey ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Naik Tier ke {PLAN_CONFIGS[nextPlanKey]?.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dapatkan lebih banyak agent, fitur, dan kapasitas untuk mengembangkan ekosistem Anda.
                  </p>
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-bold text-primary">
                      {formatPrice(PLAN_CONFIGS[nextPlanKey]?.monthlyFee ?? 0)}/bln
                    </span>
                  </div>
                  <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" /> Lisensi tidak ditagih lagi — hanya biaya bulanan
                  </p>
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    disabled={upgradeMutation.isPending}
                    onClick={() => upgradeMutation.mutate(nextPlanKey)}
                    data-testid="button-upgrade-next"
                  >
                    {upgradeMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Rocket className="h-4 w-4" />}
                    Naik Tier
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {/* No plan yet */}
            {!isPaid && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-5 text-center space-y-3">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium">Belum ada langganan aktif</p>
                  <p className="text-xs text-muted-foreground">Pilih paket untuk mendapatkan akses penuh platform Gustafta Apps.</p>
                  <Link href="/onboarding">
                    <Button className="w-full gap-2" data-testid="button-start-subscription">
                      <Rocket className="h-4 w-4" /> Pilih Paket Sekarang
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* All plans comparison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perbandingan Semua Paket</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Fitur</th>
                  {PLAN_ORDER.map((pk) => {
                    const PIcon = PLAN_ICONS[pk];
                    const isCurrent = pk === currentKey;
                    return (
                      <th key={pk} className={cn("text-center py-2 px-3 font-bold", isCurrent && "text-primary")}>
                        <div className="flex flex-col items-center gap-0.5">
                          <PIcon className="h-4 w-4" style={{ color: PLAN_CONFIGS[pk]?.color }} />
                          <span>{PLAN_CONFIGS[pk]?.name}</span>
                          {isCurrent && <Badge className="text-xs bg-primary/10 text-primary border-primary/20 mt-0.5">Paket Anda</Badge>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((feat) => (
                  <tr key={feat} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 text-muted-foreground">{FEATURE_LABELS[feat].name}</td>
                    {PLAN_ORDER.map((pk) => {
                      const enabled = PLAN_CONFIGS[pk]?.features[feat];
                      const isCurrent = pk === currentKey;
                      return (
                        <td key={pk} className={cn("text-center py-2 px-3", isCurrent && "bg-primary/5")}>
                          {enabled
                            ? <Check className="h-4 w-4 text-green-500 mx-auto" />
                            : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t bg-muted/20">
                  <td className="py-2 pr-4 font-medium">Harga Bulanan</td>
                  {PLAN_ORDER.map((pk) => (
                    <td key={pk} className={cn("text-center py-2 px-3 font-bold", pk === currentKey && "text-primary bg-primary/5")}>
                      {pk === "enterprise" ? "Custom" : formatPrice(PLAN_CONFIGS[pk]?.monthlyFee ?? 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center text-sm text-muted-foreground py-4 border-t">
          Ada pertanyaan?{" "}
          <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20butuh%20bantuan%20dengan%20langganan%20Gustafta%20Apps." onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
            target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Hubungi support via WhatsApp
          </a>{" "}atau{" "}
          <a href="mailto:hello@gustafta.com" className="text-primary hover:underline">hello@gustafta.com</a>
        </div>
      </div>
    </div>
  );
}
