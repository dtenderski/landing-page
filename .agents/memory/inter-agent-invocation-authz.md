---
name: Inter-agent invocation authz (canInvokeSubAgent)
description: Rule for when one agent may invoke another as a sub-agent; guards callAgentInternal without breaking the sellable clone model.
---

# Inter-agent invocation authz

`canInvokeSubAgent(ctx)` (server/lib/agent-authz.ts) is the single gate deciding
whether an orchestrator may call another agent as a sub-agent inside
`callAgentInternal`. Allow if ANY of:
1. `callerOwnerId === undefined` — trusted server context (schedulers, seeds).
2. sub-agent owner is falsy (null/"") — system/shared division agent.
3. sub-agent `isPublic === true`.
4. same owner (`callerOwnerId === subAgentOwnerId`).
Otherwise DENY (returns a graceful string, not a throw, so orchestration degrades).

**Why:** The guard MUST check against the ORCHESTRATOR'S OWNER, not the requesting
end-user — creator/public orchestrators legitimately call their own private
sub-agents on behalf of anonymous visitors. And rules 2+3 are load-bearing for the
**sellable premium-private clone model**: a buyer's cloned orchestrator points its
`agenticSubAgents` at system-owned SHARED division agents (empty userId) so there is
zero per-buyer setup. If a future change "tightens" the falsy-owner allowance to
require same-owner, every sold claw/clone breaks silently (sub-agents refuse to run).

**How to apply:** When adding any new call site of `callAgentInternal`, pass the
orchestrator's `userId ?? null` as `callerOwnerId`. Trusted server jobs may omit it
(undefined) to stay unrestricted. Route-level owner checks (e.g. the agent-batch
endpoint) are an acceptable alternative gate. Regression: keep the pure-function
tests in `tests/sub-agent-invocation-authz.test.ts` (the cross-owner-private DENY
case is the security-critical one).
