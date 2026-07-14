/**
 * GUSTAFTA APPS — Feature Access Hook (Client)
 * Provides plan info and per-feature access for the logged-in user.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { PlanConfig, FeatureKey, PlanTier } from "../../../shared/feature-plans";
import { PLAN_CONFIGS, LEGACY_PLAN_MAP, resolvePlan, meetsMinPlan } from "../../../shared/feature-plans";

export type { FeatureKey, PlanTier };
export { PLAN_CONFIGS, FEATURE_LABELS } from "../../../shared/feature-plans";

/* ── API Response ────────────────────────────────────────────── */
export interface UserPlanInfo {
  plan: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
  config: PlanConfig;
  tier: number;
}

/* ── Fetch /api/subscriptions/my ────────────────────────────── */
async function fetchMyPlan(): Promise<UserPlanInfo> {
  const res = await fetch("/api/subscriptions/my", { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) {
      return {
        plan: null, status: "unauthenticated",
        startDate: null, endDate: null, daysRemaining: null,
        config: PLAN_CONFIGS.free, tier: 0,
      };
    }
    throw new Error("Failed to fetch plan info");
  }
  return res.json();
}

/* ── Main Hook ───────────────────────────────────────────────── */
export function useFeatureAccess() {
  const { user, isAuthenticated } = useAuth();

  const query = useQuery<UserPlanInfo>({
    queryKey: ["/api/subscriptions/my"],
    queryFn: fetchMyPlan,
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 min cache
  });

  const planInfo: UserPlanInfo = query.data ?? {
    plan: null,
    status: isAuthenticated ? "loading" : "unauthenticated",
    startDate: null,
    endDate: null,
    daysRemaining: null,
    config: PLAN_CONFIGS.free,
    tier: 0,
  };

  /** Check if user has a specific feature */
  function hasFeature(feature: FeatureKey): boolean {
    return planInfo.config.features[feature] ?? false;
  }

  /** Check if user meets minimum plan tier */
  function hasPlan(minPlan: PlanTier): boolean {
    return meetsMinPlan(
      (LEGACY_PLAN_MAP[planInfo.plan ?? ""] ?? "free") as PlanTier,
      minPlan
    );
  }

  /** Check if user has an active subscription */
  const isSubscribed = planInfo.status === "active" && planInfo.tier > 0;

  /** Check usage limits */
  function withinLimit(limitKey: keyof Pick<PlanConfig, "maxAgents" | "maxSeries" | "maxMiniAppTypes" | "maxMessagesPerMonth" | "maxCustomDomains">, currentUsage: number): boolean {
    const limit = planInfo.config[limitKey];
    if (limit === -1) return true; // unlimited
    return currentUsage < limit;
  }

  return {
    ...query,
    planInfo,
    isSubscribed,
    hasFeature,
    hasPlan,
    withinLimit,
  };
}
