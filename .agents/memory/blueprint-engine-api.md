---
name: Blueprint Engine API wiring
description: How the pure Blueprint engines (Tahap 1-9) connect to HTTP, and the safe-write + ownership conventions that must hold.
---

# Blueprint Engine → API

The Tahap 1–9 engines (`server/services/blueprint-engine/*`) are pure/stateless. They are exposed via `/api/blueprint/{start,answer,state,analyze,configure}` (own module, registered in `registerRoutes`). The API is **stateless**: the client carries the whole Blueprint JSON in each request body; there is no DB table for in-progress blueprints.

## Conventions that MUST hold
- **`/configure` is the ONLY write path.** It is **safe-by-default**: `dryRun` is treated as `true` unless the client sends `dryRun:false` explicitly. Never flip this default to write-by-default.
- **Update ownership is enforced at the route layer**, not the engine. `update` mode fetches the target agent and rejects with 403 unless caller is the owner (`agent.userId === session user`) or an admin.
- Pipeline after any blueprint change = `applyAnswers` → `inferBlueprint` → `applyConfidence` → `getDialogueState`. Keep this order so "next questions" reflect inferred/scored state.

**Why:** the engines write real `agents` rows; a naive `update` that trusts a client-supplied `agentId` is a cross-tenant IDOR. Safe-by-default `dryRun` prevents accidental writes during UI integration.
**How to apply:** when adding the dialog UI or new write surfaces, reuse `/configure` semantics; do not bypass the ownership check or the dryRun default.

## Non-obvious constraint: agent ownership is NOT in the insert type
- `InsertAgent` (z.infer of `insertAgentSchema`) **omits `userId`** — you cannot type-safely pass `userId` into `storage.createAgent(...)`. The existing `/api/agents` create route adds `userId` pre-parse but Zod strips it too.
- Consequence: a naive create leaves `userId=""`, and `GET /api/agents` filters `a.userId === userId` for non-admins → the created agent is **invisible to its own creator** and can't be `update`d (the ownership check fails).
- **Fix (in use):** `ConfigurationOptions.ownerUserId`. The create branch spreads ownership in **after** `insertAgentSchema.safeParse` (which strips `userId`): `storage.createAgent({ ...parsed.data, userId: ownerUserId })`; storage persists it via `(insertAgent as any).userId`. The `/configure` route sets `ownerUserId = sessionUserId` **only for mode `create`** (server identity, never client input). Any new write surface that creates agents MUST stamp ownership the same way or the agent vanishes from the user's dashboard.

## Agent "active" state is a GLOBAL singleton — authorize before mutating
- `setActiveAgent(id)` sets ONE agent `isActive=true` and clears the rest app-wide (not per-user). So activating an agent mutates **shared global state**.
- `POST /api/agents/:id/activate` must check existence + ownership (`existing.userId === sessionUserId`, or admin via DB role / `ADMIN_USER_IDS`) **before** calling `setActiveAgent` — and reject empty `userId` for non-admins. The old code mutated first and only computed admin status for response sanitization → any user could hijack the global active agent (IDOR).
- **Why:** the broken-access-control class here is "mutate global/shared state, then (don't) authorize". **How to apply:** for any route that flips shared singletons (active agent/toolbox/big-idea, project-brain instance), gate on ownership/admin first; non-admins only ever list their own agents (`GET /api/agents` filters `a.userId===userId`), so activation access must match that boundary.

## Every `/api/agents/:id/*` route that mutates OR reads private config must authorize — `isAuthenticated` is NOT enough
- The whole family had the same latent bug: routes were behind `isAuthenticated` but never checked that the caller *owns* the target agent, so any logged-in user could mutate/read **any** of the ~900 seeded agents and other users' agents.
- Standard guard = `await assertCanMutateAgent(req, agent)` (defined in `registerRoutes` near the other authz helpers): empty session userId → 401; admin (DB role + `ADMIN_USER_IDS`) → ok; agent with empty `userId` (seeded/system) → 403 admin-only; non-owner → 403. Pattern is always **fetch → assert → act**.
- Three risk classes, all covered: (1) mutation (PATCH/DELETE/toggle/archive/folder/apply-import/publish-template), (2) private-config exfiltration (`GET :id/export` returns systemPrompt **+ integrations which may hold credentials** → owner/admin only), (3) LLM cost-abuse (the `*/generate*` endpoints run a model on someone's agent).
- **Read-export nuance:** "rendered" exports (`export/ebook`, `export/docgen`, `export/ecourse`) intentionally stay broad — they allow **shared system agents (empty userId)** and **public agents (`isPublic`)**, hiding `systemPrompt` for non-owners. The leak that had to be closed was returning *KB content of a private, owned-by-someone-else agent*; gate: `if (!owner && !admin && agent.userId && !agent.isPublic) return 403`. `export/chaesa`/`aspekindo-llm` already gated via `assertCanPreviewAgentPrompt`.
- **Why:** `assertCanPreviewAgentPrompt` only knows env-var admins (`ADMIN_USER_IDS`), so DB-role admins get wrongly blocked — prefer `assertCanMutateAgent` for write/cost paths. **How to apply:** any NEW `/api/agents/:id/*` route that writes the agent or triggers a model MUST call `assertCanMutateAgent` right after the 404 check; for new doc-export routes, copy the `owner || admin || isPublic || system-agent` read gate.

## `/configure` dryRun preview must be default-DENY (allowlist), never denylist
- The dryRun response surfaces a `agentPatchPreview` (field→value) so the wizard can show *what* will be written before create. The patch keys are dynamic (mapping engine builds them per blueprint module).
- Build it from an explicit **ALLOWLIST** of presentational/persona/model fields only (`buildPatchPreview` in `configuration-engine.ts`). Unknown keys are dropped by default.
- **Why:** the `agents` table holds credential/endpoint columns (`customApiKey`, `customBaseUrl`, `customModelName`, `accessToken`). A substring denylist (apikey/secret/token…) was reviewed and rejected — it leaks non-matching sensitive fields like `customBaseUrl` (can embed creds/internal host) and any future sensitive column.
- **How to apply:** to expose a new field in the preview, add it to `PREVIEW_ALLOWLIST` deliberately; treat any allowlist addition as a security review. Keep it primitive-only + truncate long strings.

## Dialogue UI: boolean answer submission (Tahap 11)
- `/answer` treats any present key in `answers` as a real user-sourced answer (updates source/confidence). For boolean dialogue questions, **only submit the key if the user actually toggled it** — never default untouched booleans to `false`, or you silently write wrong answers and skew confidence/progression.
- `multiselect` inputType must send an **array** (not a single Select string). Skip empty arrays before submitting.

**Why:** an architect review caught the wizard sending `false` for every untouched boolean, corrupting elicitation.
**How to apply:** in any blueprint dialogue UI, build the answers payload from explicitly-touched fields only.

## Client-side blueprint IMPORT must fail on server 4xx, not soft-fallback
- The wizard exports a blueprint envelope `{type:"gustafta-blueprint",version,exportedAt,blueprint}` and can re-import it. Import rehydrates the dialog by POSTing the blueprint to `/state` (read-only; no DB write) and reusing its `{dialogue,nextQuestions}`.
- **Rule:** treat a `/state` **4xx** as a real import failure — the file is invalid; keep the user on the intro step and show a destructive toast. Only soft-fallback (minimal DialogueState + "dimuat sebagian" toast) on genuine transient/network errors. Split 401/403 into a "session expired" message.
- **Why:** an earlier version swallowed every `/state` error into a fake minimal DialogueState and reported "Blueprint dimuat", so malformed/wrong-shape JSON *looked* imported but then failed later at `/analyze` and `/configure`. `apiRequest` throws `"${status}: ${text}"`, so branch on `/^4\d\d:/`.
- **How to apply:** mutate visible state (`setBlueprint/setStep/...`) only AFTER `/state` succeeds, so a rejected file never partially overwrites the user's context. Client-side `typeof bp.modules === "object"` is a cheap pre-check; the server `parseBlueprint` is the real validator.
