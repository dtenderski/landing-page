---
name: Premium Privat (per-buyer agent clone)
description: Design + non-obvious constraints for "Premium Privat" — each buyer gets an editable private clone of a master agent.
---

# Premium Standar vs Premium Privat

Two-tier premium product. `agents.premiumClass` ("standard" | "private") marks how a store/premium agent is delivered:
- **standard** = one shared admin-curated bot; buyers get access (subscription) but cannot edit.
- **private** = each buyer gets their OWN clone (`agents.clonedFromAgentId` → master) that they CAN edit/feed with internal data.

## Why owner-edit "just works"
`decideAgentMutation` (server/lib/agent-authz.ts) already grants mutate to the owner when `agents.userId === userId`. So a clone stamped with `userId = buyer` is editable by that buyer with NO authz change — only the buyer-facing UI needs exposing. KB/config edit endpoints already gate on `assertCanMutateAgent`.

## Cloning constraints (cloneAgentForOwner in db-storage.ts) — all 3 are silent-failure traps
1. **Override `isPublic=false` AND `isListed=false`.** Raw row-copy inherits master's `isPublic`; many public/embed guards key off `isPublic`, so `isListed=false` alone does NOT make the clone private.
2. **Reset `customApiKey`/`customBaseUrl`/`customModelName` to "".** Copying them puts the seller's API key into the buyer's runtime = cross-tenant billing/secret leak (sanitizing API responses is not enough; model execution still uses the copied key). Clone falls back to platform default model.
3. **Copy `knowledge_chunks`, not just `knowledge_bases`.** RAG retrieval reads chunks. Copy KB rows capturing old→new KB id, then copy each KB's chunks remapping `knowledgeBaseId` + `agentId`. Skip this and the clone shows KB entries but retrieves nothing.

Also: set `isActive=false` on the clone (isActive behaves like a global active-agent singleton — see setActiveAgent). Omit id/createdAt/slug/accessToken; mint a fresh accessToken; null the slug.

**Intentional non-clone:** an orchestrator clone keeps `agenticSubAgents` pointing at the ORIGINAL system-owned sub-agent IDs. By design the "brain" (orchestrator + sub-agents) stays system-owned; the buyer only edits KB. Not a bug.

## Delivery (done)
- Foundation: schema fields + `cloneAgentForOwner` + admin `POST /api/admin/agents/:id/deliver-private` {email} (requireAdmin; 404 if buyer email not registered yet).
- Buyer UI: "Perkuat Pengetahuan" page lets the owner feed/edit their clone's KB.
- Scalev webhook auto-clone (POST /api/webhooks/scalev): when mapped master `premiumClass==="private"`, registered buyer → clone immediately; unregistered → `pending_premium_deliveries` row, auto-applied at next login/register (`applyPendingPremiumDeliveriesForUser` in both replitAuth callback + emailAuth register). If clone throws for a registered buyer, queue pending as fallback so the paid order is never lost.

## Idempotency & atomicity (non-obvious, hard-won)
- **One clone per (master, buyer) is the product policy** (repeat purchase reuses clone; different product = different master = different clone).
- Enforce with a DB **partial unique index** `agents_clone_owner_unique` on `(cloned_from_agent_id, user_id) WHERE cloned_from_agent_id IS NOT NULL`. `getCloneForOwner` is only a fast-path check; the index is what makes concurrent webhook+login races safe (loser hits unique violation, caught/logged).
- **`cloneAgentForOwner` MUST be one `db.transaction`** (agent + KB rows + chunks all via `tx`). Driver is `drizzle-orm/node-postgres` on a real `pg.Pool` → transactions supported. **Why:** without it, agent insert can succeed while a later chunk insert fails, leaving a partial clone that `getCloneForOwner` later treats as "delivered" → buyer gets a clone with empty RAG and pending rows get wrongly cleared.
- `applyPendingPremiumDeliveriesForUser` deletes ONLY successfully-cloned masterIds (`inArray` on doneMasterIds), so failed deliveries stay queued for retry.
- Webhook auth: optional `SCALEV_WEBHOOK_SECRET` gate (x-scalev-secret / x-webhook-secret header or ?secret=), mirroring the optional MAYAR pattern. Non-breaking for the live integration; set the secret in prod when the window allows.
