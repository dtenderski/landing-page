---
name: Session cookie SameSite & Replit preview proxy
description: Why login "works but doesn't survive browser close/reopen" — SameSite cookie behavior + Replit dev-proxy override.
---

# Session cookie persistence & SameSite

Auth session cookie (`connect.sid`) is configured in `getSession()` in
`server/replit_integrations/auth/replitAuth.ts`. It already has `secure: true`,
`httpOnly: true`, persistent `maxAge` (1 week), pg-backed store. Backend session
persistence is solid — login sets the cookie, `/api/auth/user` reads it.

**Symptom:** user logs in, dashboard loads, but after closing/reopening the browser
they are asked to log in again. This is NOT a backend bug — it is the browser
dropping the cookie.

**Root cause:** a `SameSite=None` first-party session cookie gets treated as
third-party tracking state and purged/blocked by browsers' "block third-party
cookies" protection on close. Fix: set `sameSite: "lax"` so the login cookie is a
robust first-party cookie that survives restarts on the published (top-level) site.

**Critical gotcha — Replit dev preview proxy forces SameSite=None.** On the
`*.replit.dev` dev domain, the preview proxy rewrites `Set-Cookie` to
`SameSite=None` regardless of what the code sets (so the in-editor preview iframe
works). So you CANNOT observe/verify a `sameSite: "lax"` change on the dev domain —
it will still show `SameSite=None`. The Lax setting only takes effect on the
**published** deployment (top-level, no rewrite). Always verify cookie SameSite on
the published app, never the dev preview.

**Tradeoff:** Lax cookies are not sent in cross-site iframes (e.g. embedding the
dashboard in another site, or the Replit preview). The dashboard is a top-level
app so Lax is correct. The embeddable chatbot widget uses public config endpoints,
not this session cookie, so it is unaffected.

**How to apply:** when a user reports "login doesn't stay logged in / asks to
register again after reopening" and backend session checks pass, suspect the cookie
SameSite/third-party-blocking, not the auth code. Re-publish is required for cookie
config changes to reach production.
