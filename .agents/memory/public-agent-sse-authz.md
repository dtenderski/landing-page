---
name: Public-agent SSE endpoint authz gate
description: Correct unauthenticated-access gate for endpoints serving public agents (docgen/preview/widget-style)
---

Rule: on any endpoint that allows unauthenticated access to "public" agents, the deny condition must be `!auth.ok && agent.isPublic !== true`. Never gate on `agent.userId && !agent.isPublic`.

**Why:** many system-seeded/legacy agents have NO `userId` but are private (`isPublic` false/null). A `userId`-based gate silently lets unauthenticated callers use those agents (KB exposure + unauthorized LLM spend). Caught by architect review on the DocGen generate endpoint (July 2026).

**How to apply:** whenever adding a public-facing agent endpoint (generate/preview/widget/export), copy the `isPublic !== true` deny gate, keep the `isEnabled === false → 503` check, and for SSE streams add `req.on("close", () => abortController.abort())` and pass the signal to the OpenAI call so dropped clients don't leak generations.
