---
name: PlanConfig badge vs tier for plan gating
description: Why plan gating must compare by numeric tier, not badge string; a shared middleware has this bug latent.
---

When gating a feature by subscription plan, resolve the plan with `resolvePlan(sub?.plan, sub?.status === "active")` (from `@shared/feature-plans`), then compare **by numeric tier**:

```
if (plan.tier < PLAN_CONFIGS.starter.tier) { /* deny */ }
```

**Do NOT** do `meetsMinPlan(plan.badge.toLowerCase() as PlanTier, "starter")`.

**Why:** `PlanConfig.badge` is display text — `GRATIS`, `STARTER`, `PRO`, `BISNIS`, `ENTERPRISE` — not the `PlanTier` key (`free|starter|profesional|bisnis|enterprise`). `badge.toLowerCase()` yields `"gratis"`/`"pro"` which are invalid keys, so `meetsMinPlan` → `PLAN_CONFIGS[userPlan].tier` throws `undefined` at runtime (500 on gated routes, silent skips in schedulers).

**How to apply:** Any new plan gate compares `plan.tier` against `PLAN_CONFIGS[minTier].tier`. Note the shared middleware `server/lib/feature-middleware.ts` (`requirePlan`) still contains the buggy `badge.toLowerCase() as PlanTier` pattern — prefer an inline tier compare, and fix the middleware if you ever rely on it.

Separately: `requirePlan`/`requireFeature` resolve userId as `req.user?.claims?.sub || req.userId`, which MISSES `req.user?.id`. Routes that authenticate users into `req.user.id` (not `claims.sub`) must gate inline resolving `req.user?.id || req.user?.claims?.sub`, or the middleware 401s a logged-in user.
