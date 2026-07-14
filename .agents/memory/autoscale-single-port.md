---
name: Autoscale promote failure — transient, and the single-port rule
description: A Gustafta publish that fails at "Creating Autoscale service" with no runtime logs was TRANSIENT (retry fixed it). Also documents the real single-port rule for future reference.
---

# "Creating Autoscale service" failure with no runtime logs

**Observed case:** A publish failed at the "Creating Autoscale service" (promote) step — build phase succeeded (image compiled + pushed), then service creation failed and **no runtime deployment logs were captured**. Every measurable health signal was fine (build ok, boots ~1s, `GET /` 200 in ~30ms, peak RSS ~331 MB on the 4 GB cr-2-4, all env/secrets present in dev+prod). **Simply re-publishing succeeded** — so this instance was a **transient infrastructure failure**, not code/config.

**Lesson:** When a promote fails with no runtime logs AND all local health checks pass, the first cheap move is to **retry the publish** before making any code/config changes. Don't over-diagnose.

**Correction — multi-port was NOT the cause here:** The successful re-publish happened with `.replit` still containing **4 `[[ports]]` blocks** (5000→80 plus dev leftovers 5050→3000, 5051→3002, 23636→3001). So multiple ports did **not** block this autoscale deploy. Replit tolerated the extra dev ports and routed the primary one.

**The single-port rule still exists (just wasn't the culprit):** Replit docs state Autoscale supports only one external port and multiple `externalPort` entries "will fail." Treat it as a thing to check, but the observed reality is that extra dev ports did not break this deploy. If you ever do need to reduce ports, the agent CANNOT edit `.replit` (blocked) and there is no agent tool for it — it's a user action in the Ports pane.

**Gotcha — local prod testing pollutes `.replit` ports:** Running a local server on a non-5000 port (e.g. `NODE_ENV=production PORT=5050 node dist/index.cjs` to test the prod build) makes Replit auto-add that port to `.replit` as a new `[[ports]]` block that persists after the process dies. Prefer testing on port 5000 to avoid the clutter.

**Verified-healthy signals for the Gustafta prod build (skip re-checking):** `npm run build` succeeds; `NODE_ENV=production node dist/index.cjs` boots ~1s, serves `GET /` 200 in ~30ms, peak RSS ~331 MB; all env/secrets present in both environments. A promote failure is therefore NOT code/env/memory.

**Known benign prod log noise:** `[agent-policies] series lookup failed, falling back to default category: TypeError: e.select is not a function` — pre-existing minified-bundle db quirk that falls back gracefully; not fatal, not newly introduced.
