---
name: getAgent must expose agent.userId for ownership authz
description: mapAgentRow silently dropped userId, breaking owner authz + non-admin agent list; integration tests through real HTTP caught it where static/pure tests could not.
---

# `storage.getAgent()` must return `agent.userId`

The agent-ownership authorization layer (`assertCanMutateAgent`,
`assertOwnerOrAdminAgent`, `decideAgentReadAccess`, and the non-admin filter in
`GET /api/agents`) all read `agent.userId` to decide owner vs system-agent vs
outsider. The DB row mapper `mapAgentRow` in `server/db-storage.ts` did NOT
include `userId` in the object it returns, so every agent fetched via
`getAgent`/`getAgents` had `userId === undefined`.

**Symptom:** owners got `403` mutating/reading their OWN agents (treated like an
empty-userId system agent → admin-only), and non-admin users saw none of their
owned agents in the dashboard list (only shared/collaborator agents). It looked
"fail-closed safe" but the feature was broken.

**Fix:** `mapAgentRow` now emits `userId: row.userId || ""`. To keep response
shape unchanged for clients (userId was never present before), `sanitizeAgentForPublic`
in `server/routes.ts` strips `userId` so it is not leaked in non-admin/public
responses; admins still get the raw agent.

**Why:** the collaboration/ownership authz refactor started reading `agent.userId`
but the central row mapper never exposed it — a pure wiring bug invisible to unit
tests of the pure decision functions.

**How to apply:** any new authz/ownership logic that reads a field off an Agent
object must confirm `mapAgentRow` actually maps that column. Prefer an
integration test that drives REAL HTTP requests through the auth middleware
(impersonation middleware sets `req.user.claims.sub` + `req.isAuthenticated()`),
because static guard tests and pure-decision tests cannot see mapper/wiring gaps.
See `tests/agent-collaboration-integration.test.ts`.

**Test hygiene:** integration tests that boot the app must close the HTTP server
AND `pool.end()`, and module-level cleanup `setInterval`s (in `server/routes.ts`,
`server/routes-legal.ts`, `server/lib/rate-limiter.ts`) are `.unref()`'d so the
process exits cleanly under `npx tsx --test`.
