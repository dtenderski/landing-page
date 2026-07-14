---
name: OTP dual-channel (WA default, Gmail-only email fallback)
description: Registration/login OTP delivery design — WhatsApp via Fonnte is default, email via Brevo kept only for @gmail.com addresses.
---

Gustafta OTP delivery uses two channels selectable at registration, stored per-user as `users.otpChannel` ("wa" default, or "email"):
- WhatsApp (Fonnte, env `FONNTE_API_KEY`) — default, works for any phone number. Requires `users.phone`.
- Email (Brevo) — kept ONLY as an alternative for @gmail.com addresses, since Outlook/Yahoo reject the personal-Gmail sender domain on SPF/DKIM/DMARC (see BREVO_SENDER_EMAIL note in email-verification-brevo.md). Non-Gmail addresses are rejected server-side with a message pointing to WhatsApp instead.

**Why:** the underlying deliverability problem (personal Gmail sender address fails alignment checks on 3rd-party inboxes) is a Brevo/DNS config issue not fixable from the app; restricting email OTP to Gmail-only sidesteps it while WhatsApp becomes the primary channel for everyone else.

**How to apply:** resend-otp and password-reset OTP must read `otpChannel` from the DB (not client input) and dispatch through the matching helper (`sendOtpWhatsapp` / `sendVerificationEmail` with reset-vs-register purpose). Registration must reject overwriting phone/otpChannel/passwordHash on any row where `emailVerified` is already true (even without passwordHash, e.g. Replit OAuth-linked emails) — otherwise a channel-swap account takeover is possible. User-supplied names are sanitized (escapeHtml + newline-stripped) before interpolation into outbound WA text/email HTML.
