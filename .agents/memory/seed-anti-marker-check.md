---
name: Seed prompt validation needs anti-markers, not just markers
description: Why `prompt.includes("MARKER")` alone is insufficient to detect prompt corruption — a partially-merged prompt can still contain the marker yet serve the wrong persona.
---

# Substring marker check fails on merged/polluted prompts

A seed guard that re-seeds only when `prompt.includes("MARKER_v1.0")` is **false** misses the case where another seed has merged or appended its content while leaving the original marker intact. The marker check passes, the seed skips, but the live chat persona is wrong because the dominant body of `system_prompt` is now foreign content.

**Concrete case (prod EduCounsel):** agent 682 had name `EDUCOUNSEL-ORCHESTRATOR` and its prompt still contained `EDUC_ORCHESTRATOR_v1.0` somewhere, but the bulk of the prompt body was "HUB Regulasi Jasa Konstruksi / Global Navigator for construction…" from `seed-regulasi.ts`. The EduCounsel seed's `includes("EDUC_ORCHESTRATOR_v1.0")` check passed → early-return "skip" → prompt never repaired → chat answered every message as HUB Regulasi.

**Rule:** seed validation must check **both** a positive marker AND a list of anti-markers (signature strings from known polluting seeds). When an anti-marker is present, treat the prompt as corrupt and force re-seed regardless of whether the positive marker still appears.

**Why:** runtime helpers like `findOrchestratorAgent` can guard the *lookup* path (return 404 instead of wrong agent), but the chat endpoint loads the agent by ID directly from a cached orchestrator response and uses its `system_prompt` verbatim. The only durable fix is to repair the prompt at the source — and the seed only repairs if its guard correctly identifies the corruption.

**How to apply:**
- For each orchestrator seed that lives near other seeds touching the same agent rows, add a hard-coded list of anti-marker substrings (a unique phrase from each foreign seed's prompt).
- Compute `isCorrupt = !hasMarker || hasAnyAntiMarker` and force re-seed whenever `isCorrupt`.
- Log entry-point state at the top of the seed function (`log("Mulai cek state orchestrator…")`) so a future agent can confirm from deploy logs whether the seed ran and what it decided. Silent early-returns hide bugs for months.
