---
name: Knowledge Base endpoint authz parity
description: All /api/knowledge-base/* endpoints must gate on AGENT ownership, not just isAuthenticated, or it's an IDOR over ~900 system agents + every private agent.
---

# KB endpoints = agent config surface (gate on agent ownership)

`/api/knowledge-base/*` was historically guarded only by `isAuthenticated`. That is an IDOR: any logged-in user could read/create/edit/delete/reprocess/version the KB of ANY agent — including ~900 seeded system agents and other users' private agents — and trigger RAG re-embedding cost on agents they don't own.

**Rule:** every KB endpoint must resolve the OWNING AGENT (KB row → `agentId` → `storage.getAgent`) and gate via the same agent guards used elsewhere:
- **Reads** (list, rag-stats, versions) → `assertCanAccessAgentChat(req, agent)`.
- **Mutations** (create, update, delete, reprocess, supersede) → `assertCanMutateAgent(req, agent)` (owner/editor/admin). `supersede` checks BOTH the old and new KB's agents.
- `upload` / `process-url` stay `isAuthenticated`-only on purpose — they don't bind to any agent (file/extract only); binding happens at create.

**Trap:** the old `assertKBOwnership` helper allowed access when `agent.userId` was empty (i.e. system agents → any logged-in user passed). Don't reintroduce that shape; the shared guards correctly make ownerless/system agents admin-only for mutation.

**Why:** KB is private agent config + an LLM/embedding cost surface; same threat class as the chat-surface IDOR. **How to apply:** any NEW `/api/knowledge-base/*` route must add the guard AND a literal to `tests/agent-authz-guard.test.ts` (`KB_MUTATE_GUARDED` / `KB_READ_GUARDED`) — the static test reads routes.ts and fails hard if a guard is dropped.
