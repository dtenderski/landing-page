---
name: Partner seat license (Model B) atomicity
description: How B2B2C seat-license claim/revoke must stay race-safe and drift-free, and how pooled mode (seatCapacity=0) preserves legacy behavior.
---

# Lisensi Seat Asosiasi (Model B) — atomicity & pooled-mode parity

`partners.seatCapacity` (int, default 0) is the switch:
- `0` = legacy **pooled** mode (no per-seat quota, no per-seat subscription).
- `>0` = **Model B**: association buys Starter seats (blocks of 25, manual pay), each seat = 1 team account with Starter access. Subscriptions rows carry `partnerId` and mark seats.

## Rule 1 — seat claim must be one atomic transaction under a per-partner lock
**Why:** the original count-then-insert had a race (two concurrent claims both pass the capacity check, both insert → over-provision) AND provisioning was fire-and-forget `.catch`-swallowed → subscription drift (access granted but no subscription, or vice-versa).
**How to apply:** the claim path (`claimPartnerSeat` in db-storage) MUST: open `db.transaction`, take `pg_advisory_xact_lock(1397051220, partnerId)` (only when capacity>0), THEN count existing collaborators+pending, enforce capacity, grant access, and provision the subscription — all in the SAME tx so a failure rolls everything back (fail-closed). Capacity is enforced only for a NEW seat; an already-seated email just updates its role. Revoke (`revokePartnerSeat`) likewise cancels subscription + removes access in one tx.

## Rule 2 — signup provisioning stays best-effort ON PURPOSE
**Why:** provisioning a pending invite's subscription during `applyPendingInvitesForUser` must never block or fail a user signup.
**How to apply:** keep that path `.catch`-logged (best-effort). This is the one intentional non-atomic seam; do not "fix" it to fail-closed.

## Rule 3 — pooled mode (seatCapacity=0) must reject ALL partner-admin seat mutations
**Why:** self-service seat management is a Model-B feature; letting pooled partner-admins mutate membership via `/api/partner/me/seats` is a silent behavior expansion that breaks backward compat.
**How to apply:** EVERY mutation route (`POST` and `DELETE /api/partner/me/seats`) needs an early `if ((partner.seatCapacity ?? 0) <= 0) return 400`. The read-only `GET` may stay unguarded (returns a `seatMode` flag the UI gates on). Admin routes (`/api/admin/partners/:id/seats`) are intentionally mode-agnostic — admin manages any partner.

## Authz
Partner-admin endpoints resolve the partner SERVER-SIDE from the authenticated user's email via `resolvePartnerForAdmin` — never accept a client-supplied `partnerId` (avoids IDOR). Admin routes gate on `isRequestAdmin`.
