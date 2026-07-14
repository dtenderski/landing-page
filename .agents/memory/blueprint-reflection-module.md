---
name: Blueprint reflection module (Dialog Reflektif 3 Gerbang)
description: How the reflection module interacts with dialogue essentials, agent mapping, and inference — and the test pitfalls it creates.
---

# Blueprint reflection module (Dialog Reflektif 3 Gerbang)

The Blueprint Engine has a `reflection` module (22 fields, 3 gates: dialog/kolaborasi/kreasi)
framed as a "sertifikat pembelajaran reflektif" / peta pemahaman — NOT psychometric.
Output surface = `buildMasteryProfile()` (pure engine) → `POST /api/blueprint/analyze` → builder card.

## Non-obvious constraints (respect these on any Blueprint change)

- **Reflection is a NON-AGENT module.** It must stay in `NON_AGENT_MODULES` in `mapping-engine.ts`
  so it is never written to `agents` columns. Adding an agent-facing module? Do NOT add it there.
- **Reflection questions are OPTIONAL (priority 3 > `ESSENTIAL_MAX_PRIORITY`), by deliberate decision.**
  They are offered AFTER the core identity/goal essentials, never before. Do NOT promote them to
  priority ≤ 2 again.
  **Why:** an earlier revision made all 22 reflection questions priority-1 essential AND placed them
  at the front of `QUESTION_BANK` (before `identity.*`). The owner flagged that this hijacked the
  Blueprint's lean "tanya sesedikit mungkin" flow — it buried the questions that actually define the
  chatbot and risked an unfocused build. Reflection is an *additive* layer (feeds the mastery profile +
  optional enrichment), not a mandatory gate.

## Test pitfall

Dialogue tests that hard-code the first-N batch ids or the essential count depend on reflection
staying OPTIONAL. If you ever change reflection priority, `tests/dialogue-engine.test.ts` (first-batch
= identity-first; the all-essential completeness test) will need updating in lockstep.

## Inference enrichment (safety)

`inference-engine.ts` reads reflection to fill `goals.primaryOutcome`, `monetization.productTargetUser`,
`policy.domainCharter` at confidence 0.5 (auto needsConfirmation) ONLY when empty. It must never
overwrite `source="user"` data — the engine's existing `evaluateRule` guard enforces this; keep it.
