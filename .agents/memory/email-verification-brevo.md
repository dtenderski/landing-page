---
name: Email verification depends on BREVO_API_KEY
description: Why email OTP verification can silently appear "disabled" — missing Brevo API key, not broken code.
---

# Email verification hinges on BREVO_API_KEY

Email OTP verification (register → OTP → verify-email; login blocks unverified users) is enforced
in `server/replit_integrations/auth/emailAuth.ts`. The verification *logic* is robust — the common
failure is that the OTP email never sends because `BREVO_API_KEY` secret is missing.

**Behavior when BREVO_API_KEY is unset:**
- Development (`NODE_ENV` not production): register returns `otpFallback` (OTP code shown on screen,
  no real email). This *looks like* verification was removed/bypassed but it is not.
- Production: register returns 503 "Layanan email belum dikonfigurasi." — registration breaks.

`BREVO_SENDER_EMAIL` (e.g. noreply@gustafta.my.id) is a separate shared env var and is usually set;
the key that goes missing is the secret `BREVO_API_KEY` (format `xkeysib-...`).

**Why:** Secrets can fail to carry over / get removed across deploys, and the dev otpFallback masks
the problem so it presents as "email verification stopped working" rather than "email won't send".

**How to apply:** When a user reports email verification "no longer working" / "kembali tanpa
verifikasi", first check `viewEnvVars({type:"secret", keys:["BREVO_API_KEY"]})`. If false, request it
— do not go hunting in the auth code. Confirm the fix: a successful register returns
`{"success":true,"message":"Kode OTP telah dikirim..."}` with NO `otpFallback` field.
