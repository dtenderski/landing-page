/**
 * GUSTAFTA APPS — Feature Access Middleware (Server)
 * Protects API routes based on user's active subscription plan.
 */
import type { Request, Response, NextFunction } from "express";
import { resolvePlan, meetsMinPlan, type PlanTier, type FeatureKey, PLAN_CONFIGS } from "@shared/feature-plans";

interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

/**
 * Express middleware: blocks requests if user doesn't have the required plan tier.
 * Usage: app.get("/api/ecourse", requirePlan("profesional"), handler)
 */
export function requirePlan(minPlan: PlanTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub || req.userId;
      if (!userId) {
        return res.status(401).json({
          error: "Login diperlukan",
          reason: "not_authenticated",
        });
      }

      // Get active subscription from storage
      const { storage } = await import("../storage");
      const subscription = await storage.getActiveSubscription(String(userId));

      const plan = resolvePlan(subscription?.plan, subscription?.status === "active");
      if (!meetsMinPlan(plan.badge.toLowerCase() as PlanTier, minPlan)) {
        return res.status(403).json({
          error: `Fitur ini memerlukan paket ${PLAN_CONFIGS[minPlan].name} atau lebih tinggi.`,
          reason: "insufficient_plan",
          requiredPlan: minPlan,
          currentPlan: subscription?.plan ?? "free",
          upgradeUrl: "/onboarding",
        });
      }

      next();
    } catch (err) {
      console.error("[requirePlan] Error:", err);
      next();
    }
  };
}

/**
 * Express middleware: blocks if user doesn't have a specific feature enabled.
 */
export function requireFeature(feature: FeatureKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub || req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Login diperlukan", reason: "not_authenticated" });
      }

      const { storage } = await import("../storage");
      const subscription = await storage.getActiveSubscription(String(userId));
      const plan = resolvePlan(subscription?.plan, subscription?.status === "active");

      if (!plan.features[feature]) {
        return res.status(403).json({
          error: `Fitur ini tidak tersedia di paket Anda.`,
          reason: "feature_not_available",
          feature,
          currentPlan: subscription?.plan ?? "free",
          upgradeUrl: "/onboarding",
        });
      }

      next();
    } catch (err) {
      console.error("[requireFeature] Error:", err);
      next();
    }
  };
}

/**
 * Helper: get resolved plan config for a userId.
 */
export async function getUserPlanConfig(userId: string) {
  const { storage } = await import("../storage");
  const subscription = await storage.getActiveSubscription(userId);
  const plan = resolvePlan(subscription?.plan, subscription?.status === "active");
  return { subscription, plan };
}
