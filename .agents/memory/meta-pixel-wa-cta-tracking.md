---
name: Meta Pixel — WhatsApp CTA lead tracking
description: Why Meta Test Events showed PageView but no Lead, and how WA CTAs are now tracked across the site.
---

## Root cause
`trackLead()` (client/src/lib/meta-pixel.ts) was only called from the email login/registration
flow (`login.tsx`). The site's actual primary conversion action — the WhatsApp CTA button — had
no pixel event attached on the large majority of pages (~69 of ~71 files with `wa.me`/
`api.whatsapp.com` links). Only 2 pages called the weaker `trackContact()` (client-only, no CAPI
relay, no eventID dedup) on WA click. This is why Meta Test Events only ever showed `PageView`.

## Two pixel layers — not a bug
There are two independent `fbq('init', ...)` call sites by design:
1. Global site pixel — env `META_PIXEL_ID`, resolved via `/api/config/meta-pixel`, used by
   `meta-pixel.ts` for the main marketing site.
2. Per-agent pixel — `agents.metaPixelId` column, injected separately in `agent-chat.tsx`,
   `agent-landing.tsx`, `product-landing.tsx` so resold/cloned chatbot buyers can track their own
   ad campaigns on their bot's page. This is intentional multi-tenant behavior, not a stray
   duplicate pixel.

**Why:** confirmed by design/tests during a Lead-tracking audit — do not "fix" or remove the
per-agent pixel when asked to check for duplicate/rogue pixels; only the global one is in scope
for "main site" pixel questions.

## How to apply
- `trackLead()` fires both the client `fbq('track','Lead', ..., {eventID})` AND relays
  server-side via CAPI (`relayServerEvent`) with the same eventID for dedup — prefer it over
  `trackContact()` (client-only, no dedup) when wiring new conversion points.
- WA CTA tracking was added as an `onClick` handler alongside the existing `href` — this fires
  before the browser navigates to `wa.me` and does not change any visible markup/styling.
- Common per-page pattern found across ~37 sector/niche landing pages: `const WA_URL = "https://wa.me/..."`
  used in multiple `<a href={WA_URL}>` tags — fixed by defining one `handleWaClick()` helper per
  file and attaching it to every such anchor. Other pages build the URL via a local function
  (`waLink`, `waMsg`, `waUrl`) — fixed by calling `trackLead()` inside that function body so every
  caller is covered from one edit point.
- Known remaining gap (intentionally out of scope / lower priority): `admin.tsx`, `agent-chat.tsx`,
  `agent-landing.tsx`, and the OTP-support WA link in `login.tsx` still open WhatsApp without
  firing a pixel event — these are internal/per-tenant support surfaces, not the main marketing
  funnel CTA.
