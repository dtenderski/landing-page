---
name: createAgent second-arg is polymorphic (Executor | legacy userId)
description: Why db-storage createAgent()'s 2nd param accepts a string but must NOT persist it as owner
---

`storage.createAgent(insertAgent, execOrUserId)` — the 2nd param is polymorphic:
- an **Executor** (e.g. a Drizzle `tx`) → used as the DB executor (transaction path), or
- a **string** → a legacy `userId` from ~40 old seed files that still call
  `createAgent({...} as any, "49465846")`.

**Rule:** the string arg is accepted ONLY to prevent a crash (fall back to `db` as
executor). It must NEVER be persisted as the agent owner. Ownership (`agents.user_id`)
is set solely from `insertAgent.userId` (the blueprint/creator path), else `""`.

**Why:** the signature was refactored from `(insert, userId)` → `(insert, exec)` for
transaction support, but ~40 seeds were never updated — they pass `userId` positionally,
so it landed in `exec` and threw `exec.insert/select is not a function` at boot for any
seed whose agents weren't already present. Separately, `createAgent` never persisted
`userId` at all, so blueprint-created agents silently lost ownership. Persisting the
legacy seed string as a real owner is ALSO wrong: the Store treats
`(user_id ?? "").trim() !== ""` as "creator-made" → hides the agent unless `isListed`
and routes the 80/20 revenue split to that (non-existent) creator. Official Gustafta
seed agents must stay `user_id=""`.

**How to apply:** if you touch `createAgent`, keep both behaviors — polymorphic arg2
detection AND ownership only from `insertAgent.userId`. Don't "simplify" by persisting
arg2. Don't try to fix the 40 seeds individually; the single-point fix in `createAgent`
covers them all. Blueprint create injects `{...parsed.data, userId: ownerUserId}` and
relies on `createAgent` persisting `insertAgent.userId`.
