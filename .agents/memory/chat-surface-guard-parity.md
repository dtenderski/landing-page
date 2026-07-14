---
name: Chat-surface guard parity (anti-IDOR)
description: Every /api/messages* endpoint (and any new one) must call assertCanAccessAgentChat before touching agent chat data, or it is an IDOR.
---

Any endpoint that reads, writes, exports, OR clears chat data for an agent
identified by `:agentId`/body `agentId` MUST fetch the agent and call
`assertCanAccessAgentChat(req, agent)` before acting. `isAuthenticated` alone is
NOT enough — it only proves the caller is logged in, not that they own / are a
collaborator on that specific private agent.

**Why:** `DELETE /api/messages/:agentId` (clear history) shipped behind only
`isAuthenticated`, so any logged-in user could wipe another user's private agent
chat history by guessing the agentId (classic IDOR by id). The sibling read/send/
export endpoints were already guarded; this one was missed because it had no agent
fetch at all.

**How to apply:**
- Guard semantics: public agent → open; system/ownerless agent → any logged-in
  user; private agent → owner/admin/collaborator only. The guard already encodes
  this; just call it.
- There is a static regression test `tests/agent-authz-guard.test.ts` with a
  `CHAT_READ_GUARDED` list that asserts each named route literal calls
  `assertCanAccessAgentChat`. ADD every new `/api/messages*` route literal to that
  list so the omission is caught at test time, not in prod.
- HTTP behavior matrix lives in `tests/agent-chat-access-http.test.ts` (mirror
  routes + role matrix). Add a row there too.
