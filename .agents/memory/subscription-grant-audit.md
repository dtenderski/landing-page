---
name: Subscription grant audit (grantedBy)
description: Manual admin-granted subscriptions must be audited consistently across every grant path.
---

# Subscription grant audit

`subscriptionsTable.grantedBy` (nullable varchar) records the admin/superadmin userId who
manually granted an active subscription (null = normal paid flow). The "when" reuses
`createdAt`; UI surfaces both as "Diberi oleh" + "Diberi pada" in the admin Subscriptions tab.

**Rule:** There is MORE THAN ONE admin-mediated grant path that inserts an `active`
subscription — at minimum the Early Adopter grant AND the trial-approval direct-activation.
Any code that inserts an admin-granted active subscription MUST stamp `grantedBy`, or the
audit becomes silently inconsistent (some grants show a granter, others show "—").

**Why:** A first pass only stamped the Early Adopter route; the trial-approval path was
missed, so half of manual grants had no audit trail. Review caught it.

**How to apply:**
- When adding/finding any `db.insert(subscriptionsTable).values({... status: "active" ...})`
  reachable from an admin route, ask "is this a manual grant?" — if yes, set
  `grantedBy: req.user?.claims?.sub || null`.
- Keep `grantedBy` immutable after insert: the `PATCH /api/admin/subscriptions/:id` handler
  destructures only `{ status, endDate }` from the body on purpose — do NOT widen it to
  spread `req.body`, or an admin could rewrite the granter.
