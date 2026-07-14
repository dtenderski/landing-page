---
name: Store catalog cache
description: Why GET /api/store/catalog is cached and how staleness is bounded
---

# Store catalog caching

`GET /api/store/catalog` (server/routes.ts) computes its item list by fetching
ALL active agents (900+ rows, heavy text/jsonb columns), running a child-count
group-by, then filtering/mapping/paginating in memory. Doing that per-request
made p95 ≈ 2.5s @ 40 concurrency.

Fix: a module-level cache keyed by `(category, search)` holds the fully-computed
item list; pagination stays per-request (slice). It uses:
- 30s fresh TTL + single-flight (concurrent misses trigger ONE build),
- stale-while-revalidate up to ~10 min (serve stale instantly, refresh in bg),
- bounded map (max 100 keys) so user-supplied search terms can't grow it,
- boot pre-warm of the default (no-filter) listing.

**Why:** the expensive cost is the enrich-all-agents query, not pool exhaustion;
caching + single-flight collapses a stampede into one build. Warm p95 ≈ 190ms.

**How to apply:** the catalog reflects data changes within ~30s (fresh TTL),
longer if served stale. That lag is acceptable for a public listing but if a
future feature needs immediate reflection (e.g. admin toggling isListed and
expecting instant visibility), add explicit cache invalidation on that mutation
rather than shortening the TTL. Same pattern fits other fetch-everything-then-
paginate public GETs.

## SQL pushdown of the cold rebuild (July 2026)

The cold rebuild was still fetching every active agent. Cheap, unambiguous
predicates were pushed into the agents WHERE clause so the DB (not JS) drops most
rows: `parent_agent_id IS NULL` (child agents are never sold standalone) and the
creator publish gate `trim(user_id) = '' OR is_listed = true`. Backing indexes:
`agents_active_category_idx (is_active, category)`, `agents_parent_agent_id_idx
(parent_agent_id)`, `store_products_active_category_idx (is_active, category)`
(also mirrored in shared/schema.ts; created via direct DDL since drizzle push is
blocked).

**Why the bundle "2+ components" filter stays in JS, NOT SQL:** it depends on
`agenticSubAgents` array length, and that jsonb column can be double-encoded (a
JSON *string*, see jsonb-double-encoding.md). `jsonb_array_length` would see type
'string' and under-count, silently dropping real bundles. `parseSubAgentsValue`
normalizes it in JS. Don't push subCount into SQL until the column is guaranteed
array-typed everywhere.
