---
name: Hardcoded Super Admin phone allowlist
description: How the founder's phone-based Super Admin bypass is implemented and why it's role-based, not scattered checks.
---

Founder-designated Super Admin (identified by phone number, normalized) is promoted to
`users.role = "superadmin"` idempotently at every WhatsApp-OTP register/verify/login touch
point in `server/replit_integrations/auth/emailAuth.ts` (via a `promoteSuperAdminIfMatch`
helper keyed on a `SUPERADMIN_PHONES` set). Never downgrades, never touches other users.

**Why:** The app already has a DB `role` column (`user`/`admin`/`superadmin`) checked
pervasively across routes.ts (`getDbRole`, `isAdminUser`, `requireAdmin`/`requireSuperAdmin`,
`ADMIN_USER_IDS`) to bypass plan/premium/ownership gates. Promoting role in the DB — instead
of adding a new hardcoded-ID bypass — means every existing admin check across blueprint
persistence, Workroom access, and premium gates picks it up for free with zero new surface
area to audit.

**How to apply:** Blueprint *generation* itself (`/api/dialog-gustafta/blueprint`) is already
ungated (no login needed) for everyone, so no change was needed there. Workroom access and
persisted blueprint edits require at least a logged-in session (OTP), which is expected —
"no barrier" for Super Admin means no plan/premium/ownership barrier, not zero login. To add
another Super Admin by phone, extend the `SUPERADMIN_PHONES` set in emailAuth.ts.
