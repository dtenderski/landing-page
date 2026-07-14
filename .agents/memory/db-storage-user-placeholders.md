---
name: db-storage user-method placeholders
description: getUser/getUserByUsername/createUser in the live DatabaseStorage are Replit-Auth placeholders that return undefined/empty — never use them for existence checks.
---

The live storage (`dbStorage`) implements `getUser()`, `getUserByUsername()`, and `createUser()` as placeholders that always return `undefined`/empty (comment: "placeholder - using Replit Auth"). Any route that checks user existence via `storage.getUser(id)` will always 404.

**Why:** Users are managed by Replit Auth upsert paths, not the generic IStorage user methods; the placeholders were never wired to the `users` table. An admin endpoint shipped broken because of this until architect review caught it.

**How to apply:** For user existence/lookup on the server, query the `users` table directly (`db.select(...).from(users).where(eq(users.id, id))`) or use the dedicated methods that do hit the table (e.g. `getUserByEmail`, claw-package methods). Also: one-shot "locked after save" semantics must use an atomic conditional UPDATE (`WHERE ... IS NULL OR cardinality(...) = 0` + RETURNING), not check-then-write.
