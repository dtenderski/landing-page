---
name: Sellable claw / agent seed gotchas
description: How to seed an orchestrator agent that must appear in the Store and sell with zero buyer setup — the createAgent field traps and the reconcile requirement.
---

# Seeding a SELLABLE claw/agent (Store-listed, zero buyer setup)

To make a seeded orchestrator both a native claw AND a product that shows in the Store and sells hands-off:

- **Store visibility fields**: the product must be `isPublic=true`, `isListed=true`, `isActive=true`. The Store query filters on `isListed=true` — if it's false the product never appears.
- **Zero-setup selling** rides the existing Premium-Private path: set `premiumClass='private'` so purchase triggers clone-per-buyer + Scalev webhook. The cloned orchestrator references the SAME shared sub-agent (division) rows, so the buyer needs no configuration. This works at runtime because sub-agent dispatch (`callAgentInternal`) does a direct `storage.getAgent()` with NO owner/visibility check — a private buyer clone can still call `isPublic:false` shared divisions.
- **Pricing**: `licenseClass` (premium band K1–K4) forces `licensePrice` to the band via the storage backstop; `monthlyPrice` is separate (hosting/token). Set `category` for Store grouping.

**Why:** sellability was the top-priority objective; a claw that isn't `isListed` or isn't `premiumClass:private` is built but not actually sellable hands-off.

## createAgent field traps (server/db-storage.ts)
`createAgent` uses an explicit whitelist insert — it does NOT read every field you pass:
- It **ignores `isListed` and `premiumClass`** (they fall to schema defaults `false` / `standard`). Set them with a **post-create `updateAgent`** (updateAgent passes any field through generically).
- It maps **`aiModel`, not `model`**. The whole sibling-claw family passes `model:` which is silently dropped → every orchestrator defaults to `gpt-4o-mini`. Pass **`aiModel`** if you actually want gpt-4o.
- It forces `isActive:true` regardless — don't also put `isActive` in a spread object or you get TS2783 duplicate-key.

## Seed must RECONCILE, not early-return
The common `if (existing) return;` guard leaves older/partial deployments unsellable (isListed=false) or on a stale model/wiring forever. For a sellable product the seed must, when the orchestrator already exists, **`updateAgent` the Store fields + rewire `agenticSubAgents` + set `aiModel`** and then return.

**How to apply:** any future "sellable agent/claw" seed — verify the DB row after boot (`SELECT ai_model, is_listed, premium_class, license_*`), not just that the orchestrator endpoint returns an id.
