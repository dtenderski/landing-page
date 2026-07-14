---
name: Agent Collaboration (Editor/Viewer) authz
description: Permission policy for shared agents — who may mutate, who may delete, who may chat/read. Route classification rules.
---

# Agent Collaboration (Editor/Viewer) authz

Owners/admins share an agent by email granting **Editor** (mutate config) or **Viewer** (read-only). All authz *decisions* live in pure, tested functions (`decideAgentMutation` / `decideAgentReadAccess`); route-layer guards only gather inputs (userId, isAdmin, agentOwnerId, collaboratorRole) and delegate.

## Classify every agent route before choosing a guard
There are FOUR capability tiers, each with its own guard. The recurring failure mode is reusing one tier's guard for another.

1. **Config mutation → editor-allowed.** Editors may edit the agent's configuration. Guard looks up collaborator role and passes it through (editor ⇒ ok).
2. **Destructive / ownership (delete, archive, toggle-enabled, activate) → owner-or-admin ONLY.** The guard deliberately does NOT look up collaborator role (passes null) so editors fall through to 403. Enable/disable and activation are ownership actions, NOT config edits — keep them here, not in tier 1. Collaborator-management is also owner-only.
3. **Chat / read of message history → tiered by visibility, NOT just "is logged in".** This is the IDOR surface (`/api/messages`, `/api/messages/stream`, `GET /api/messages/:agentId`, message export json/csv):
   - public agent (`isPublic`) → anyone, including anonymous/widget;
   - private + no owner (system/seeded shared agent, e.g. MultiClaw/Legal AI) → any logged-in user (entitlement enforced by the UI page guard, not here);
   - private + has owner → owner/admin/collaborator only.
4. **Private config read (builder) → owner/admin/collaborator**, with sensitive fields sanitized for non-admin.

**Why:** broken access control hides in tier confusion — (a) reusing the config-mutation guard on a destructive/ownership action lets editors delete/disable; (b) gating chat/read with a bare `isAuthenticated` lets any logged-in user (or a guessed agentId/sessionId) reach another user's *private* agent history.

**How to apply:** when adding ANY agent or message route, ask "which of the 4 tiers is this?" Never gate chat/read with a bare `isAuthenticated` — a system agent and a user's private agent need different rules. Never reuse the config-mutation guard for delete/archive/activate/share.

## Don't over-tighten system agents
~900 seeded agents have an empty owner and are intentionally shared. Tiers 2–3 must let logged-in users reach them; only *owner-set* private agents get the collaborator gate. Tightening system agents silently breaks the whole MultiClaw / Legal AI chat suite.

## Collaborator-facing CTAs must not hit owner-only routes
A "open the shared agent" CTA for an invited collaborator must NOT call the owner-only `POST /api/agents/:id/activate` — it 403s for non-owners, and `isActive`/active-agent is a GLOBAL singleton so relaxing that auth would let a viewer flip what everyone sees. Instead deep-link to `/dashboard?agent=<id>`; the dashboard selects the agent via pure client state (`localAgentId`/`localToolboxId`, the same path as clicking a shared agent in the sidebar) — no mutation, collaborator-authorized. The unfiltered `/api/agents` list already returns shared agents to collaborators (tagged `shared`, `effectiveRole`).

**Why:** the first cut wired the CTA to activate; review caught it as a guaranteed 403 for exactly the audience it serves.
**How to apply:** any collaborator-reachable navigation/action should route through a tier-1/3/4 surface, never tier-2 (owner-only). Prefer client-state selection over a write when you only need to *display* an agent.

## Regression locks
Static source-grep tests assert each route family calls the correct guard (mutation vs owner-only vs chat-access), plus a pure decision matrix (editor/viewer/non-collaborator/system/anonymous). Moving a route between tiers requires updating these tests in lockstep, or the grep test fails loudly.

## Testing route authz at HTTP level without booting the monolith
routes.ts is ~20k lines and full boot needs DB + Replit OIDC + seeding — too brittle for node:test (project convention = pure/MemStorage, no server). To still verify real request behaviour (status codes, middleware order), extract the guard closures into an INJECTABLE factory module (`server/lib/agent-access-guards.ts`, deps: getCollaboratorRole + getDbRole + optional adminUserIds). Production routes destructure the factory's guards; an HTTP test mounts those SAME guards on a tiny Express app + real MemStorage + an auth shim (header sets req.user) + injected getDbRole, then issues real fetch() and asserts 200/401/403.

**Why:** logic-only tests can't catch route-wiring/status/middleware bugs; re-implementing guards in the test is tautological. One shared module = same code in prod and test, so HTTP assertions are meaningful.

**How to apply:** when a guard/closure lives inside the route monolith and you need request-level coverage, lift it to an injectable module rather than booting the app. Keep the static call-site grep (each endpoint calls the right guard) — combined with the HTTP test it gives end-to-end coverage without DB/OIDC. Note: a guard converted from hoisted `async function` to a `const` from a factory must be declared BEFORE its first textual use in registerRoutes (lost hoisting ⇒ TS use-before-declaration).
