---
name: import-reveals-plaintext-secrets
description: A GitHub re-import can bring in a committed .replit with real API keys under [userenv.shared]; check for this on every fresh import.
---

When re-importing a project from GitHub after an initial empty/failed import, the pulled `.replit` file can contain real, plaintext API keys under `[userenv.shared]` (committed by a prior non-Replit host, e.g. Railway env var dump).

**Why:** the source repo (Gustafta) had `SCALEV_API_KEY` and `BREVO_API_KEY` committed in plaintext in `.replit`, exposed in git history.

**How to apply:** after any import/re-import, diff the incoming `.replit` for a `[userenv.shared]`/env block with key-like strings, move real secrets to Replit Secrets via `requestSecrets`, move plain config to `setEnvVars`, strip them from `.replit` via `verifyAndReplaceDotReplit`, and tell the user to rotate the exposed keys at their provider (git history still has them).
