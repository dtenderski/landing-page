---
name: Orchestrator lookup pattern
description: How to resolve orchestrator agents safely when IDs drift over time
---

# Orchestrator lookup — never trust hardcoded ID alone

When an `/api/{name}-claw/orchestrator` route hardcodes `storage.getAgent("<id>")`, it eventually breaks: agent IDs in `replit.md` drift when the DB is reseeded or rows are deleted/recreated, and the route silently returns whichever unrelated agent now occupies that ID.

**Rule:** orchestrator routes must resolve via slug-first: `storage.getAgentBySlug("slug")` → if null, try systemPrompt marker → if null, try name keyword. Use `findOrchestratorAgent()` helper in `server/routes.ts` for complex cases.

**CRITICAL — fallback chains only fire on NULL.** If a wrong agent exists at the hardcoded ID, `getAgent("id")` returns that wrong agent (not null), and every fallback in the `if (!agent)` chain is silently skipped. The route serves the wrong persona with no error. Confirmed in prod: 9 routes were returning completely unrelated agents because old IDs were occupied by different agents after DB drift. The fix: replace `getAgent("hardcoded-id")` primary with `getAgentBySlug("correct-slug")` primary.

**Known corrected routes (post-fix correct IDs):**
- `tendera-claw` → slug `tendera-orchestrator` → ID 653
- `konstra-tender-claw` → slug `konstra-tender-orchestrator` → ID 642
- `smk3-claw` → slug `hub-ims-smk3-terintegrasi` → ID 297
- `lkut-claw` → slug `lkut-hub` → ID 292
- `safira-claw` → slug `safira-claw-orchestrator` → name fallback "Safira" → ID 657 (BRAIN-SAFIRA)
- `smap-claw` → slug `smap-orchestrator-hub-multi-agent-anti-penyuapan` → ID 262
- `pancek-claw` → slug `pancek-orchestrator-hub-multi-agent-smap-nasional-pancek` → ID 271
- `dev-properti-claw` → slug `hub-devproperti-pro-v1` → ID 565
- `estate-care-claw` → slug `hub-estatecare-pro-v1` → ID 576

**Why:** in prod we observed routes returning wildly wrong agents (e.g. `/tendera-claw` → "AGENT-AKADEMIK" which is an EducounselClaw sub-agent) because ID 663 was occupied by an unrelated agent after reseed. Slug stays stable; numeric IDs do not.

**How to apply:**
- New orchestrator route → use `getAgentBySlug("slug")` as primary. Never lead with `getAgent("hardcoded-id")`.
- Slug pattern: `{route-base}-orchestrator` (e.g. `ko-claw-orchestrator`, `kk-claw-orchestrator`) with exceptions for legacy hubs (e.g. `hub-ims-smk3-terintegrasi`, `hub-devproperti-pro-v1`).
- Fallback chain: slug → systemPrompt marker ilike → name keyword ilike → 404.
- If 404 is genuinely correct (orchestrator not yet seeded), let it 404 loudly — never fall back to "first agent that loosely matches".

# Audit endpoint must mirror runtime, not lookup-by-ID

The audit endpoint at `/api/admin/audit-orchestrators` uses `findOrchestratorAgent()` (slug+name fallback), so it reports the same agent that chat endpoints actually use. Differentiate `OK` (ID matches expected) from `DEGRADED` (resolved via fallback at different ID — means `replit.md` is stale but page works) from `MISMATCH`/`MISSING`.

**Why:** previously audit reported 51/66 broken; reality was ~9 truly broken. Noisy audits cause wasted reseed work.
