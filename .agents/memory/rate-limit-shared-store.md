---
name: Rate limiter shared store
description: Why the anonymous per-agent chat cap must use a shared store (not in-memory) and the constraints around adding tables here.
---

# Rate limiter shared store (cross-instance)

Any rate limit that must hold on autoscale (multiple instances) CANNOT count in
a per-process Map — a bot rotating across instances blows past the cap while
each instance thinks it's under it. The anonymous per-agent hourly cap now
counts in a shared PostgreSQL table via a row-locked atomic upsert.

**Decision:** shared-store is authoritative; in-memory is a *fallback only* when
the DB errors (chat must degrade, never fail-closed) and a test double.
**Why:** fail-closed would take chat fully offline on a DB blip; fail-open with
per-instance protection is the accepted tradeoff.

**Operational constraints (the parts that bite):**
- Prod schema comes from Replit copying the DEV DB → prod at deploy; runtime
  `drizzle-kit push` is deliberately avoided (blocks the startup health probe).
  So a new table must exist in DEV *and* ship a committed migration artifact —
  reviewers reject "schema.ts changed but no migration". `drizzle-kit push` is
  also blocked interactively here, so add the table via direct DDL in dev AND
  hand-write the numbered migration + journal entry.
- The fallback is silent except for a logged error — guard against a permanently-
  missing table with a real-DB integration test that writes/reads the bucket,
  not just unit tests with a fake query.

**Still open:** the sibling per-minute `chatIpRateLimiter` uses express-rate-limit's
default in-memory store — same cross-instance gap, not yet fixed.
