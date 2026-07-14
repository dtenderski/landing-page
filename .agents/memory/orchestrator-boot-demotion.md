---
name: Orchestrator boot demotion vs runtime trigger
description: Why directly-created/Org-Builder orchestrator agents lose is_orchestrator at boot, and why the team still works anyway.
---

# Orchestrator boot demotion vs runtime orchestration trigger

`server/fix-orchestrators.ts` → `fixOrphanedOrchestrators()` runs at server boot. It finds every agent where `is_orchestrator = true AND toolbox_id IS NULL` and **demotes** it: `is_orchestrator=false`, `orchestrator_role='standalone'`, and links it to a default HUB toolbox. It only KEEPS the flag when the agent's `bigIdeaId` maps to a series' bigIdeas and that hub has no orchestrator yet.

**Consequence:** an orchestrator created directly (SQL/storage) OR via the Organization Builder (`/api/organization/configure` → `applyOrganizationToBuilder`, which creates orchestrators with NO toolbox) will lose `is_orchestrator` on the *next* restart.

**But the team still works.** Runtime multi-agent orchestration in `/api/messages/stream` triggers on `Array.isArray(agenticSubAgents) && length > 0` ONLY — it does NOT check `is_orchestrator`. `fixOrphanedOrchestrators` never clears `agentic_sub_agents`, so delegation keeps firing.

**Why:** don't fight the flag. It's cosmetic for runtime chat. Dashboard sub-agent counts are also computed from `agenticSubAgents` (parseSubAgentsValue), not the flag.

**How to apply:** when building an AI team by hand or via the org engine, make sure `agentic_sub_agents` is a non-empty array of `{role, agentId(numeric), description}`. Do NOT expect `is_orchestrator=true` to persist across restarts unless the agent is properly placed in a hub (toolbox + bigIdea). Setting the flag true on an orphan is pointless — it flips back next boot.

## CRITICAL: boot doesn't just demote — it can OVERWRITE your system_prompt

`fixOrphanedOrchestrators()` doesn't only clear the flag: it **links the orphan into a default HUB toolbox** (`toolbox_id` set, typically "HUB Regulasi Jasa Konstruksi", agent id 3). Then on the SAME boot, `server/seed-regulasi.ts` → `syncMetadataAndPatchBots()` iterates every agent in that toolbox and, for any whose prompt does NOT contain the literal marker `"Routing hints for Perizinan Usaha"`, **overwrites `system_prompt` (+greeting+starters) with the HUB Regulasi prompt** (`HUB_UTAMA_SYNCED_PROMPT`). Result: your custom orchestrator keeps its name/slug/agentic_sub_agents but its persona silently becomes "You are HUB Regulasi Jasa Konstruksi…". This is the "bernama X tapi prompt-nya HUB Regulasi" corruption the code comments in routes.ts (~9361) describe.

**Selection criterion is TOOLBOX MEMBERSHIP, not role/flag/subs.** Changing `agent_role` to Specialist does NOT help. Once `toolbox_id` points at the hub, the overwrite recurs every restart even with `is_orchestrator=false`.

**Durable fix for a hand-built orchestrator:** set `toolbox_id = NULL` (also `big_idea_id`, `parent_agent_id` NULL) AND keep `is_orchestrator=false` so `fixOrphanedOrchestrators` never re-adopts it. Keep `agentic_sub_agents` populated — runtime orchestration still fires. Verified: prompt then survives restart. (Alternative escape hatches: put `"Routing hints for Perizinan Usaha"` or `"FEDERATION_MODE v2"` in the prompt, but detaching the toolbox is cleaner.)

**Why:** a custom user-owned orchestrator is not a federation hub; the federation sync assumes every toolbox member is a HUB-Regulasi bot and normalizes it. Keeping it out of any managed toolbox is the only stable state.
