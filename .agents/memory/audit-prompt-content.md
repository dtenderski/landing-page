---
name: Audit endpoints must inspect prompt content
description: Name + ID lookups in audits miss silent prompt corruption because chat persona lives in systemPrompt, not name.
---

# Orchestrator/agent audits must keyword-check systemPrompt, not just name + ID

**Rule:** Any "is this orchestrator wired correctly?" audit must (a) resolve the agent the same way runtime does (slug → ID → name fallback), AND (b) check that the resolved row's `system_prompt` contains at least one expected keyword (or its versioned marker). Reporting "OK" on a name+ID match alone is unsafe.

**Why:** An agent row can have the correct `name`, `slug`, `avatar`, `tagline`, and `agenticSubAgents` while its `system_prompt` has been overwritten by another seed (see [Seed early-return guards](seed-early-return-guards.md)). The orchestrator endpoint (`/api/<name>/orchestrator`) returns only the metadata fields — it cannot detect this. The chat endpoint, which reads `system_prompt`, will answer in the wrong persona ("EduCounsel" greets users as "HUB Regulasi Jasa Konstruksi"). This is invisible to users and to a name-only audit; it only surfaces by reading the prompt or by users complaining the bot is "off topic."

**How to apply:**
- For each EXPECTED entry in an audit, include 2–4 lowercase keywords that must appear somewhere in `system_prompt` (the agent's actual domain words, or its versioned marker like `EDUC_ORCHESTRATOR_v1.0`).
- Add a `PROMPT_CORRUPT` status separate from `OK` / `DEGRADED` / `MISMATCH` / `MISSING`. A row that passes name/ID but fails the prompt check is `PROMPT_CORRUPT` — louder than `DEGRADED` because behaviour is actually wrong, not just metadata drifted.
- Surface `promptHasKeyword: boolean` on every audit row so the UI can render a distinct color/badge and the operator can tell at a glance which agents need a prompt re-seed vs. just a replit.md ID update.
- When you add a new orchestrator to the audit, also add at least one keyword that you know lives only in that orchestrator's prompt — don't rely on generic words ("agent", "konsultan") that every prompt has.
