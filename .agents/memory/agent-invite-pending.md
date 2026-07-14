---
name: Pending agent invites (invite-before-account)
description: How sharing an agent with a not-yet-registered email works, and the rule for auto-applying grants at signup.
---

Owners can share an agent with any email even if that email has no account yet.

The rule: a "collaborator add" for an unknown email must NOT 404. Instead persist a
pending invite (agentId + email + role) and send a signup-CTA email, returning HTTP 202
`{pending:true}`. The grant is materialized into a real collaborator row only when that
email registers.

**Why:** owners were blocked from sharing with teammates who hadn't signed up; a hard 404
made the share flow feel broken.

**How to apply:**
- Auto-apply must be wired into EVERY account-creation path, or invites silently never
  activate. Currently two: email verify-email flow and Replit OAuth upsertUser. Adding a
  new auth/registration path means also calling the apply step there.
- Apply step must be idempotent and non-blocking (fire-and-forget) so a failure never
  breaks signup. Normalize email to lowercase/trim everywhere (storage + lookups) or the
  unique (agentId,email) index and the signup match will miss.
- Invite email uses the reusable fire-and-forget helper in server/lib/email.ts, so a
  missing BREVO_API_KEY degrades gracefully instead of throwing.
