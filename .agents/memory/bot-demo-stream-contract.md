---
name: Public "bot" demo pages — stream contract & access
description: The 9 hand-rolled vertical bot chat pages drift from the canonical stream contract and are login-gated, not public.
---

The 9 single-vertical "bot" demo pages (`perijinanbot`, `tenderbot`, `supplierbot`, `sertifikasibot`, `proyekbot`, `ownerbot`, `boheerbot`, `kontraktorbot`, `konsultanbot`) each hand-roll their own streaming chat instead of reusing the canonical `use-streaming-chat` hook. They drifted from the real server contract and silently broke:

- **Endpoint:** the only stream route is `POST /api/messages/stream`. There is NO `/api/chat/:agentId/stream` — posting there falls through to the SPA catch-all (returns HTML at HTTP 200), so the client "succeeds" but never gets SSE.
- **Body:** must match `insertMessageSchema` → `{ agentId:String(agentId), content, role:"user" }`. NOT `{ message, conversationHistory }` (server ignores client history).
- **SSE event:** server emits `chunk` (with `content`) + `complete`, NOT `token`.
- **Render:** `MessageContent` from `@/lib/format-message` takes prop `text`, NOT `content`. Passing `content` renders nothing.

**Access decision:** these pages are login-gated via `<PremiumPageGuard feature="advanced_ai_tools" requiredPlan="profesional">` in `App.tsx` (consistent with the rest of the MultiClaw suite). Their orchestrator agents stay `is_public=false`. They are ownerless system agents, so `assertCanAccessAgentChat` (agent-access-guards.ts) admits ANY authenticated user (line: no owner → ok:true); anonymous → 401. Product owner chose login-gate over making agents public (free 7-day trial is the on-ramp).

**Why:** the whole family broke identically because the contract is copy-pasted per page. **How to apply:** when touching any of these pages, mirror `use-streaming-chat.ts`; better, consolidate to that single hook to stop future drift.
