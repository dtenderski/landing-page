---
name: Seed early-return guards
description: Idempotent seeds must validate prompt marker, not just slug existence, or stale-prompt agents never get fixed.
---

# Seed early-return guards must check the prompt marker, not just slug presence

**Rule:** When an idempotent seed checks "already seeded → skip", the check MUST include a prompt-marker test (e.g. `systemPrompt LIKE '%MY_MARKER_v1.0%'`), not only "slug exists" or "row count matches".

**Why:** Two seeds can collide on the same row. Seed A creates agent at slug `foo` with prompt-A. Later, seed B (or a manual SQL fix) overwrites the row's NAME and SLUG to `foo` but leaves prompt-A intact. Next boot, seed B sees "slug `foo` exists, all sub-agents exist → skip" and never overwrites the prompt. Symptom: the API/UI returns the right NAME and avatar (from the orchestrator endpoint), but chat responses come from the wrong personality because `system_prompt` is still from seed A. Audit endpoints that only compare name keywords are fooled too.

**How to apply:**
- Every seed that owns an orchestrator should embed a unique marker string into the orchestrator's systemPrompt (e.g. `FOO_ORCHESTRATOR_v1.0`).
- The "skip if already seeded" guard must do `existing.systemPrompt.includes(MARKER)` — if false, force re-seed of prompt + agenticSubAgents + name + tagline, even though slug already exists.
- For sub-agents, do a lightweight prompt sanity check too (e.g. expected prefix). A row that exists with the right slug but a wrong-shape prompt is worse than missing — it serves traffic with the wrong persona.
- The same lesson applies to the audit endpoint: comparing only `name` keywords misses prompt corruption. Either include a marker check in the audit, or accept that "DEGRADED via name" doesn't guarantee correct behaviour.
