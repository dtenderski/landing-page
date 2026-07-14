---
name: PremiumPageGuard as shared PAS/AIDA sales template
description: How the ~85 "claw"/premium chat-tool pages get their pre-login/pre-upgrade sales copy, and how to add tailored persuasive copy per product.
---

`client/src/components/premium-page-guard.tsx`'s `LockedScreen` is the *only* pre-login/pre-upgrade screen shown for every claw/premium chat-tool route — it functions as each product's landing/sales page, not just an access gate.

It now renders a full PAS→AIDA structure: Hero → Problem/Agitate → Solution (existing `highlights` prop) → Desire → Pricing/CTA + WA trial → FAQ accordion → Final CTA.

To add tailored copy for a specific product, pass an optional `pas` prop (`PasCopy` type: `problemTitle`, `problemBody`, `agitateBody`, `desireBody`, `stats` (factual capability counts only, never fake usage stats), `proofNote` (regulatory citation), `faqs`) at that route's `<PremiumPageGuard>` call site in `App.tsx`.

If `pas` is omitted, `genericPas()` inside the component synthesizes honest generic copy from the existing `title`/`description`/`highlights` — so all pages get the new structure even without per-product writing, and tailoring is purely additive.

**Why:** editing this one shared component instantly upgrades all ~85 routes at once; per-product tailored copy is then rolled out incrementally (done so far: sbu-claw, tender-ai, tendera-claw, konstra-tender-claw, tenderbot, kontraktorbot, konstra-claw) without needing a rewrite of the guard itself each time.

**How to apply:** when asked to improve a claw/premium product's "landing page", check whether it already goes through `PremiumPageGuard` in `App.tsx` before writing a standalone page — most "claw" products do, and a few instead have dedicated `*-landing.tsx` pages (e.g. `skk-coach-landing.tsx`, `askom-landing.tsx`) that bypass the guard entirely and would need separate treatment.
