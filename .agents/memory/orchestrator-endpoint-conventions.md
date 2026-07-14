---
name: Orchestrator/agent endpoint URL conventions & SPA 200-HTML trap
description: How to correctly health-check the 80 MultiClaw orchestrator endpoints without false positives
---

When health-checking MultiClaw "orchestrator" endpoints by curling the dev server, two traps cause false "broken" verdicts:

1. **Unregistered API routes return the SPA index HTML with HTTP 200, not 404.** So status code alone is useless — detect a working JSON endpoint by checking the body starts with `{`. An HTML body = endpoint not wired (or wrong URL).

2. **Orchestrator endpoints do NOT all follow `/api/{page-route}/orchestrator`.** At least four shapes exist:
   - `/api/{slug}/orchestrator` (most, e.g. sbu-claw, smap-claw)
   - `/api/{different-name}/orchestrator` where API name ≠ page route (brain-claw → `/api/brain-project/orchestrator`; educounsel-claw → `/api/educounsel/orchestrator`; panduan-askom UI → `/api/askom`)
   - path-param: `/api/iso-claw/9001/orchestrator` and `/api/iso-claw/14001/orchestrator`
   - answer-machines use `/agent` not `/orchestrator`: `/api/panduan-sbu/agent`, `/api/panduan-askom/agent`

**How to apply:** a single-convention curl sweep will flag ~6 false positives. Before declaring any flagged route broken, grep the page component (`client/src/pages/<route>.tsx`) for its actual `/api/...` call and curl THAT. As of the June 2026 audit all 80 page routes resolve correctly.

**Why:** the project memory repeatedly warns orchestrator config can drift silently (slug→ID). A naive sweep that trusts one URL pattern + HTTP status would both miss real breakage and raise false alarms.
