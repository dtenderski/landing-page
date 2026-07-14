---
name: Research Team news feed + Marketing pipeline
description: How Gustafta's research team gets real "eyes" (free Google News RSS → per-agent KB), and how the daily marketing pipeline (research → ad materials → retention) is wired.
---

# Research Team live feed

Gustafta has a research sub-team (Kepala Tim Riset orchestrator → sub-specialists: viral-lokal, tren-global, suara-pelanggan, kompetitor, iklan-pasar) that serves BOTH product-dev and market/sales.

**Feed mechanism (`server/lib/research-feed.ts`):** free Google News RSS (no API key) parsed with cheerio xmlMode → ingested as a Knowledge Base into the *specific feed agent's* `agentId` so RAG retrieval reaches it at chat time. Agents resolved by SLUG, never hardcoded IDs. Driven by a single `FEED_STREAMS` config array (source of truth). Topics can be a plain string or `{q,hl,gl}` to mix locales within one stream.

**Method library (honest-by-design for FB/TikTok):** live automated data from Facebook Ad Library / TikTok needs API keys or paid tools — deliberately NOT done. Instead a STATIC playbook KB is seeded (idempotent). Embeds server-side (needs OpenAI key), so seed via the sweep, not the code_execution sandbox.

**Rules / gotchas:**
- Prune BEFORE re-ingest, but only delete KB matching the daily prefix (never nuke user-uploaded KB or static/foundation KB on the same agent). Each daily generator + each static library has its OWN prune-scope prefix so they never delete each other. Feed KB must stay small because the no-embedding fallback concatenates ALL chunks.
- The sweep writes to MULTIPLE agents. **Authz must check `assertCanMutateAgent` on EVERY agent it mutates**, not just one — otherwise cross-agent privilege bleed if owners differ. (Caught in review.)
- Trigger: `POST /api/research/sweep` (isAuthenticated + per-agent mutate authz) + a daily `scheduleAtWIB(...)` in server/index.ts. Scheduler runs server-side, no HTTP auth.

**Why honest-by-design:** the feed is *public news aggregation*, NOT real-time social-media scraping. Prompts must treat it as an early signal and tag unverified claims with `[ASUMSI:…|basis:…|verifikasi-ke:…]` + ◆ GERBANG MANUSIA.

**Ownership model:** the dev DB was reset by migration — users table empty, all team agents unowned (`user_id=''`). Non-admin `GET /api/agents` only lists own/shared agents, BUT admin/superadmin skip the owner filter and see ALL agents (getDbRole promotes by email at login via `SUPERADMIN_EMAILS`/`ADMIN_EMAILS` env). So the whole unowned team shows up once a superadmin logs in — no ownership transfer needed. (Do not hardcode the admin identities here; they live in env secrets.)

## Marketing pipeline (Pipeline Marketing Gustafta)

The daily sweep (`runResearchSweep`) is the marketing team's framework: one ordered daily job with 4 fire-and-forget stages — **(1) RISET feed → (2) MATERI IKLAN per platform → (3) SEQUENCE RETENSI (email/WA) → (4) AMUNISI JUALAN (closing kit)**. Each stage isolated in its own try/catch so a partial failure never breaks the rest. Full detail (agents, roles, KB prune-scopes): `docs/marketing-pipeline.md`.

**Durable design rules for this pipeline:**
- **Chaining by return value:** a later stage consumes an earlier stage's generated content (ad-materials output feeds BOTH the retention and closing stages). When adding a stage, return the generated doc so the next stage can ground on it — don't re-read the DB.
- **Grounding = static foundation + fresh output.** The retention AND closing stages are grounded on the canonical foundation doc (AI Organization Builder vision + Trilogi "Dari Monolog ke Dialog" + produk/jasa) seeded idempotently, PLUS the day's marketing output. The closing stage adds a second static doc — a **sales playbook** (`buildSalesPlaybookDoc`: 3 jalur jualan, objection-handling framework, honest closing-script principles) — seeded on the closing agent so its RAG chat and its daily kit share the same honest grounding. Keep these docs as the single honest source for vision/product/pricing claims in customer comms.
- **Sales side = closing, distinct from retention.** Retention = existing customers; the closing stage/agent (`mkt-closing-asisten`) = prospects/conversion (objection answers + WA closing scripts + prospect follow-up). It doubles as a live RAG sales chatbot. Both are draft-only.
- **Retention/closing never auto-send.** They draft email/WA sequences & closing scripts only; sending is ◆ gerbang manusia (founder decides) even though a Brevo send helper exists. Do not wire auto-send.
- **Model/key reuse:** all generators reuse the rag-service OpenAI key pattern (`AI_INTEGRATIONS_OPENAI_API_KEY||OPENAI_API_KEY`) via a local lazy client, gpt-4o-mini, 60s timeout.

**Drift risk (important):** the whole research + marketing team (orchestrators, the ad-materials agent, the retention agent, the closing agent, and the sub-agent wiring on the marketing lead) exist ONLY as DB rows created via SQL — there is NO seed file. A reseed/redeploy will NOT recreate them. If reseeding, recreate these agents and re-wire the sub-agents manually. This is why every pipeline stage resolves its agent by slug and skips gracefully when absent.
