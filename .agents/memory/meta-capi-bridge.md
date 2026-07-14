---
name: Meta CAPI bridge
description: Server-side Purchase events to Meta from the Scalev webhook — why it exists and its invariants
---

# Meta Conversions API bridge (Scalev → Meta)

**Rule:** Purchase tracking to Meta runs server-side from the Scalev webhook (`server/lib/meta-capi.ts`), fire-and-forget — it must NEVER block or fail the webhook response, and it must skip gracefully when `META_CAPI_ACCESS_TOKEN`/`META_PIXEL_ID` are unset.

**Why:** The user's direct Scalev↔Meta integration keeps failing, so Gustafta relays events. Scalev retries webhooks; Meta dedups via `event_id = scalev_{orderId}` so replays are safe even before the store order is recorded.

**How to apply:**
- Per-agent `agents.metaPixelId` overrides the platform `META_PIXEL_ID` (resolved via scalev mapping → agent).
- PII must be SHA-256 hashed & normalized (email lowercase/trim; Indonesian phone digits-only with leading 0 → 62).
- Access token goes in the POST body, not the URL (avoids proxy/log leakage).
- Verify config via admin endpoints `/api/admin/meta-capi/status` and `/test` (supports `test_event_code` → Meta Events Manager Test Events tab).

## Pixel ID must be sanitized to digits-only everywhere
**Rule:** Any place that consumes `META_PIXEL_ID` (or `VITE_META_PIXEL_ID`) must strip non-digits before use — the browser `fbq('init', ...)`, the public config endpoint, and CAPI. **Why:** the secret was once stored as `"ID 2571064406673063"` (copy-paste artifact); an `"ID "` prefix silently breaks both pixel init and CAPI with no error. **How:** `String(raw).replace(/[^0-9]/g,"")` — done in `sanitizePixelId` (server meta-capi + client meta-pixel) and inline in the `/api/config/meta-pixel` route.

## Browser pixel id comes from runtime endpoint, not build-time VITE var
**Rule:** The browser pixel resolves its id at runtime from `GET /api/config/meta-pixel` (server `META_PIXEL_ID`), falling back to `VITE_META_PIXEL_ID`. **Why:** pixel id is public and checkout is OFF-SITE (Scalev `dialog.gustafta.my.id`), so relying on a build-time VITE var meant prod had the pixel INACTIVE whenever only the server secret was set. Runtime fetch keeps one source of truth.

## fbp/fbc bridge across the off-site Scalev checkout
**Rule:** Landing-page checkout CTAs open the Scalev URL through `withMetaAttribution(url)` (appends `fbp`,`fbc`,`esu`); the webhook extracts those back and forwards to CAPI. **Why:** browser and server Purchase share `event_id=scalev_{orderId}` so Meta merges them — no double count, better match quality. **How to apply:** the bridge is best-effort — it only works if Scalev echoes the custom URL params into the webhook; CAPI still sends via hashed email/phone if fbp/fbc are absent, so never make fbp/fbc required.

## Double-count risk is operational, not code
**Rule:** The only remaining Purchase double-count risk is Scalev's OWN native Meta integration firing with a DIFFERENT event_id (uncontrollable from our code). **How to apply:** must be turned OFF in the Scalev dashboard — a code review can't catch this, tell the user.

## Dev server does not hot-reload
`Start application` runs `tsx server/index.ts` (source, not dist) and does NOT auto-reload on edits — restart the workflow to pick up server route changes before curl-verifying.

## Scalev webhook auth: signature is accept-only, shared secret is the real gate
**Rule:** `verifyScalevWebhookAuth` is layered & safe-by-default: (1) HMAC-SHA256 of raw body via `SCALEV_SIGNING_SECRET` (tries hex+base64, common sig headers, strips `sha256=`, timing-safe) — ACCEPT-only, never the sole rejector; (2) shared secret `SCALEV_WEBHOOK_SECRET` via header/`?secret=` = the authoritative gate; (3) no secret set → accept (legacy). **Why:** Scalev's signature format is UNDOCUMENTED (confirmed via web search), so guessing it and rejecting would drop real orders. When ONLY the signing secret is set and the sig doesn't match, it returns `method:"observe"` (accept + warn-log header NAMES so the real format can be learned from order #1) — flip to hard-reject only via opt-in `SCALEV_SIGNATURE_STRICT=true` after the format is confirmed. **How to apply:** for a mandatory gate the user MUST set `SCALEV_WEBHOOK_SECRET` and append `?secret=` to the webhook URL; the request logger uses `req.path` so the query secret never leaks to logs. Matrix regression: `tests/scalev-webhook-auth.test.ts`.

## Public CAPI relay endpoint needs abuse guards, not just a whitelist
**Rule:** `POST /api/track/meta-event` is PUBLIC (browser fires it alongside the pixel with the SAME `eventId` so Meta dedups browser+server, surviving ad-blockers/iOS). Because it triggers CAPI events under our token, it must have: eventName whitelist, per-IP in-memory rate limit (40/min), and an Origin/Referer allow-list (same-host + `*.gustafta.my.id` + `*.replit.app/.dev/.repl.co`; missing Origin is allowed since privacy modes strip it, but still rate-limited). **Why:** without these, anyone can inject fake Lead/InitiateCheckout events at scale and poison ad optimization/reporting. **How to apply:** client dedup lives in `client/src/lib/meta-pixel.ts` (`genEventId` → passes `{eventID}` to `fbq` AND relays to the endpoint with fbp/fbc); keep the browser+server eventId identical or dedup breaks.

## Prod verification must hit the ACTUAL custom domain, not the .replit.app URL
**Rule:** The custom domain (`gustafta.my.id`) can point to a DIFFERENT, older Replit deployment than the `*.replit.app` URL you just published to. Publishing to the daily repl does NOT update the domain if the domain is attached to a separate (e.g. long-term/yearly) repl. **Why:** the Scalev webhook targets the domain; if that domain serves stale code without the CAPI bridge, Purchase silently never fires even though the webhook 200s. **How to apply:** verify against the real domain — `GET https://<domain>/api/config/meta-pixel` must return `{"pixelId":...}` (JSON), not the SPA HTML. Also secrets & `SCALEV_WEBHOOK_SECRET` enforcement differ per deployment (each repl has its own env), so re-add ALL secrets after any GitHub import into a fresh repl.
