---
name: Pricing single source of truth
description: All product/page pricing must come from client/src/data/pricing.ts — never re-hardcode price strings in pages.
---

# Pricing single source of truth

All product pricing, service tiers, hosting periods, and credit packs live in
`client/src/data/pricing.ts` (PRICING, HOSTING/HOSTING_SUMMARY/HOSTING_RANGE,
HOSTING_PERIODS, SERVICE_TIERS, CREDIT_PACKS, LICENSE_INFO, formatIDR).
`HOSTING_PERIODS` = duration-based subscriptions (1/3/6/12 bulan: key/name/price/
priceNum/period/duration/savings) for /pricing & /checkout. `SERVICE_TIERS` carries
both display `price` AND numeric `amount` — use `amount` for any numeric price field.

**Rule:** ALL pricing pages — marketing (`produk.tsx`, `packs.tsx`, `store.tsx`,
`store-featured.tsx`) AND checkout flow (`pricing.tsx`, `checkout.tsx`) — must import
values from this module. Never paste raw price strings like `"Rp 299.000"` or numeric
amounts like `299000` into page JSX/data arrays.

**Why:** prices were previously duplicated across pages and drifted out of sync;
a single edit point prevents inconsistent numbers between /produk, /packs, /store.

**How to apply:** when adding/changing any price, edit `pricing.ts` only. Canonical
business rules still hold (see `gustafta-pricing-model.md`): chatbot product = license
only (no mandatory setup), jasa/modul = has setup fee, no permanent free tier
(free = 7-day trial), and jasa uses the 4 canonical SERVICE_TIERS (Tier 1–4:
1.499 / 2.499 / 4.900 / 7.490 rb).

**Easily-missed drift surfaces (not just visible JSX):**
- **Analytics payloads** — Meta Pixel `trackInitiateCheckout({ value: ... })` etc.
  must use `*.amount` from the source, never a raw number. A hardcoded `value: 499000`
  silently drifts from the UI price.
- **Computed combos** — e.g. "first month = license + subscription" must be
  `formatIDR(PRICING.license.amount + PRICING.subscription.starter.amount)`, not a
  pre-computed string like `"Rp 498.000"`.
- **Distinct products at the same nominal price** — Trilogi Buku I and Starter Kit are
  both Rp245k but are SEPARATE products: Buku I → `TRILOGI.bukuSatu`, Starter Kit →
  `PRICING.starterKit`. Never merge two products just because the number matches.
- **Intentionally local (do NOT centralize):** page-specific marketing anchors
  (coret prices like "Harga normal Rp 350.000"), illustrative affiliate sample
  earnings, and DB-sourced Store catalog prices (admin-editable).
- **Short vs full form:** `PRICING.{license,starterKit}.short` ("Rp 245rb") for
  badges/CTAs; `.price` ("Rp 245.000") for full display. Trilogi constant: `TRILOGI`
  (bundle.price / bundle.normal / bundle.amount, bukuSatu.price / .amount).
