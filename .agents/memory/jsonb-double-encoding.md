---
name: jsonb double-encoded agenticSubAgents
description: jsonb columns can silently store JSON *strings*; Array.isArray gates then skip orchestration silently
---

# Rule
A jsonb column happily stores a double-encoded JSON string (`"[{...}]"`) when a caller passes `JSON.stringify(cfg)` through a pass-through write path. Every runtime gate that does `Array.isArray(value)` then fails silently — MultiClaw pages answer as a single agent with no sub-agents and no error.

**Why:** 17 orchestrators (SBUClaw, QSClaw, PJBUClaw, KeuanganClaw, BG/BS/IM/KO/KKClaw, K3Man, Kontrak, Pengawas, Elektrikal, ETLO x2, AI Tutor, MUK 230) were silently non-orchestrating in BOTH dev and prod because seeds sent `agenticSubAgents: JSON.stringify(cfg)` and `updateAgent` passed it through raw. `createAgent` didn't persist the field at all (silent drop).

**How to apply:**
- Normalize at BOTH read and write: `parseSubAgentsValue()` in `server/db-storage.ts` (exported; used by mapAgentRow, createAgent, updateAgent, and raw `db.select` spots in routes like store catalog/featured & tutor-builder teams).
- Detection SQL: `SELECT jsonb_typeof(col::jsonb), count(*) ... GROUP BY 1` — any `string` rows are broken. Repair: `SET col = (col #>> '{}')::jsonb WHERE jsonb_typeof='string' AND inner is array`.
- Prod data can't be repaired directly (read-only replica) — the defensive read parse heals it on republish.
- Audit lesson: "endpoint returns valid JSON" is NOT enough; also verify the returned agent actually has a usable (array-typed, non-empty) sub-agent config.
