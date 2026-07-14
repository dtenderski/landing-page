---
name: code_execution sandbox quirks (DB access)
description: Gotchas when doing DB work from the code_execution JS sandbox.
---

# code_execution sandbox quirks for DB work

- **`process.env` is NOT exposed** in the code_execution sandbox — `process.env.DATABASE_URL` throws "Cannot read properties of undefined". Do not build a `pg`/driver client from env there.
- **Use the pre-registered `executeSql({ sqlQuery })` callback** for all DB access from the sandbox — it connects to the same app database.
- **`executeSql` returns the command tag, not `RETURNING` rows.** An `INSERT ... RETURNING id` prints `INSERT 0 1`, not the id. To capture generated ids, run a follow-up `SELECT ... WHERE <unique cols>` (e.g. by slug) after the insert.
- **SELECT output is CSV** with a header line, then rows. Parse accordingly.
- For long text (system prompts) inserted via `executeSql`, escape single quotes by doubling them (`'` → `''`); jsonb via a JSON string literal cast `...'::jsonb`.
