---
name: Reusable Brevo email helper
description: Where to send transactional emails from the backend, and the safety rule for doing so.
---

# Reusable Brevo email helper

`server/lib/email.ts` is the shared place for backend transactional emails.
- `sendEmail({to,toName,subject,htmlContent,textContent,tags})` — generic Brevo
  SMTP send. Returns a typed `SendEmailResult`, never throws.
- `sendAgentShareNotification({to,recipientName,agentName,role,inviterName})` —
  the agent-share notice.

**Rule:** When adding new outbound email, reuse `sendEmail` here instead of
cloning the inline Brevo fetch from `server/replit_integrations/auth/emailAuth.ts`
(that one stays self-contained for OTP). Always dispatch fire-and-forget
(`void ...catch(...)`) from the route so a send failure or missing
`BREVO_API_KEY` never breaks the underlying action.

**Why:** `BREVO_API_KEY` is a secret that can be absent (see
`email-verification-brevo.md`); emails must degrade silently in dev and never
crash prod. Sender defaults: `BREVO_SENDER_EMAIL` or `noreply@gustafta.com`.
Dashboard CTA links derive from `REPLIT_DEV_DOMAIN`.

**How to apply:** import from `./lib/email`, build the message, fire-and-forget
after the primary mutation succeeds.
