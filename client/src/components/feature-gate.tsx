/**
 * GUSTAFTA APPS — Feature Gate Component
 * Wraps UI sections and shows an upgrade prompt if the feature is not available.
 */
import { type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Rocket, ArrowRight, Crown, Zap } from "lucide-react";
import { useFeatureAccess, type FeatureKey, type PlanTier, PLAN_CONFIGS, FEATURE_LABELS } from "@/hooks/use-feature-access";
import { cn } from "@/lib/utils";

/* ── UpgradePrompt ───────────────────────────────────────────── */
interface UpgradePromptProps {
  feature?: FeatureKey;
  requiredPlan?: PlanTier;
  compact?: boolean;
  className?: string;
}

export function UpgradePrompt({ feature, requiredPlan, compact = false, className }: UpgradePromptProps) {
  const featureLabel = feature ? FEATURE_LABELS[feature] : null;
  const planLabel = requiredPlan ? PLAN_CONFIGS[requiredPlan] : null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm", className)}>
        <Lock className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-muted-foreground flex-1">
          {featureLabel ? featureLabel.name : "Fitur ini"} memerlukan paket{" "}
          <strong className="text-foreground">{planLabel?.name ?? "lebih tinggi"}</strong>.
        </span>
        <Link href="/onboarding">
          <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 gap-1">
            <Rocket className="h-3 w-3" /> Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className={cn("border-2 border-dashed border-primary/20 bg-primary/5", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="h-7 w-7 text-amber-500" />
        </div>
        {planLabel && (
          <Badge className="gap-1" style={{ backgroundColor: `${planLabel.color}20`, color: planLabel.color, border: `1px solid ${planLabel.color}40` }}>
            <Crown className="h-3 w-3" />
            Perlu paket {planLabel.name}
          </Badge>
        )}
        <div>
          <h3 className="font-bold text-lg mb-1">
            {featureLabel?.name ?? "Fitur Terkunci"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {featureLabel?.description
              ? `${featureLabel.description} tersedia mulai paket `
              : "Fitur ini tersedia mulai paket "}
            <strong>{planLabel?.name ?? "lebih tinggi"}</strong>.
          </p>
        </div>
        <Link href="/onboarding">
          <Button className="gap-2" data-testid="button-upgrade-plan">
            <Zap className="h-4 w-4" />
            Upgrade Sekarang
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/* ── FeatureGate ─────────────────────────────────────────────── */
interface FeatureGateProps {
  feature: FeatureKey;
  requiredPlan?: PlanTier;
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function FeatureGate({ feature, requiredPlan, children, fallback, compact, className }: FeatureGateProps) {
  const { hasFeature, planInfo } = useFeatureAccess();

  if (planInfo.status === "loading" || planInfo.status === "unauthenticated") {
    return <>{children}</>;
  }

  if (!hasFeature(feature)) {
    if (fallback) return <>{fallback}</>;
    return (
      <UpgradePrompt
        feature={feature}
        requiredPlan={requiredPlan}
        compact={compact}
        className={className}
      />
    );
  }

  return <>{children}</>;
}

/* ── PlanBadge ───────────────────────────────────────────────── */
interface PlanBadgeProps {
  plan: string;
  className?: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "#64748b",
  starter: "#3b82f6",
  profesional: "#6366f1",
  bisnis: "#8b5cf6",
  enterprise: "#f59e0b",
  free_trial: "#64748b",
  monthly_1: "#3b82f6",
  monthly_3: "#6366f1",
  monthly_6: "#8b5cf6",
  monthly_12: "#f59e0b",
};

const PLAN_BADGE_LABELS: Record<string, string> = {
  free: "GRATIS",
  starter: "STARTER",
  profesional: "PRO",
  bisnis: "BISNIS",
  enterprise: "ENTERPRISE",
  free_trial: "TRIAL",
  monthly_1: "1 BLN",
  monthly_3: "3 BLN",
  monthly_6: "6 BLN",
  monthly_12: "12 BLN",
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const color = PLAN_COLORS[plan] ?? "#64748b";
  const label = PLAN_BADGE_LABELS[plan] ?? plan.toUpperCase();
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border", className)}
      style={{ color, backgroundColor: `${color}15`, borderColor: `${color}30` }}
      data-testid="badge-plan"
    >
      <Crown className="h-3 w-3" />
      {label}
    </span>
  );
}

/* ── PlanGuard ───────────────────────────────────────────────── */
interface PlanGuardProps {
  minPlan: PlanTier;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGuard({ minPlan, children, fallback }: PlanGuardProps) {
  const { hasPlan, planInfo } = useFeatureAccess();
  if (planInfo.status === "loading" || planInfo.status === "unauthenticated") return <>{children}</>;
  if (!hasPlan(minPlan)) {
    return <>{fallback ?? <UpgradePrompt requiredPlan={minPlan} />}</>;
  }
  return <>{children}</>;
}
