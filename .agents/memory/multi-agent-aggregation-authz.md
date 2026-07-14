---
name: Multi-agent aggregation endpoint authz
description: Endpoints that fan out over several agents and return a combined payload must redact per-agent metadata (not just docs) when that agent's access check fails.
---

# Multi-agent aggregation endpoints leak metadata if you build the object before the auth check

When an endpoint gathers many agents (resolved by slug) into one response — e.g. a
dashboard/overview that lists several team agents plus their docs — each agent must
pass its own `assertCanAccessAgentChat` / `assertCanMutateAgent` check, AND the
auth-failed branch must return only redacted placeholders (`agentId: null`,
`agentName: null`, `tagline: null`, `avatar: null`, `docs: []`).

**Why:** blocking only the *documents* still leaks agent identity. If you construct
the metadata object (id/name/tagline/avatar) *before* the access check and then
return it with `canAccess:false`, any logged-in non-owner can enumerate private /
system agents' metadata — a broken-access-control side channel. Code review caught
exactly this in `/api/marketing-team/overview`.

**How to apply:** put the `if (!auth.ok) return { ...redacted, docs: [] }` branch
*before* you assemble the identifying `base` object. Guard it with a static
regression test in `tests/agent-authz-guard.test.ts` (scope the assertion window to
the `if(!auth.ok){...}` branch only — stop before `const base`, which legitimately
exposes metadata for accessible agents).
