---
name: drizzle-kit push blocked by access_codes drift
description: Why `drizzle-kit push` hangs interactively in this repl and how to add new tables safely.
---

# `drizzle-kit push` is blocked in this repl — use direct SQL for new tables

`npx drizzle-kit push` (even with `--force`) stops on an **interactive prompt** about
adding `access_codes_code_unique` unique constraint ("truncate table? Yes/No"). This is
PRE-EXISTING schema drift on `access_codes`, unrelated to whatever you're pushing, and it
blocks the whole push non-interactively.

**How to apply:** To add a NEW table/column, do NOT run push. Instead run the DDL directly
via the code_execution `executeSql` callback (`CREATE TABLE IF NOT EXISTS ...` +
`CREATE UNIQUE INDEX IF NOT EXISTS ...`). Keep `shared/schema.ts` as the source of truth in
sync so Drizzle types match, but apply the actual DDL by hand.

**Why:** push tries to reconcile the full schema and trips on the access_codes drift prompt
before it ever creates your table. Direct, scoped DDL touches only what you intend and never
prompts.
