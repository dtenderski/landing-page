---
name: Claw agent model config & durability
description: How the MultiClaw agents' LLM model is set, why raw DB updates don't stick, and the durable fix.
---

# Claw agent LLM model — durability rules

Claw agents (slug ILIKE '%claw%') answer mainly from their **system prompts** (expertise baked in), NOT from KB. Empty KB is by design; KB is optional enrichment. There is NO scheduled system auto-update of claw KBs (the research-feed only targets specific feed agents by slug, not the claw suite).

Answer QUALITY is driven by the **model tier**, not KB. Historically almost all claw agents ran on `gpt-4o-mini` (weak → shallow/wrong answers, e.g. SBUClaw once said "SBU = Surat Izin Usaha" instead of "Sertifikat Badan Usaha"). Upgrading to `gpt-4o` fixes this.

## Rule: a raw SQL UPDATE of ai_model does NOT stick
**Why:** ~7 construction-claw seed files (sipil/mep/k3/lingkungan/manprojak/arsitektur/surveipemetaan) force-`updateAgent` on EVERY server boot and re-apply their hardcoded model. So a bulk `UPDATE agents SET ai_model=...` gets reverted on the next restart/deploy for exactly those force-reseed agents.

**How to apply:** to change a claw model durably you MUST edit the seed source, not just the DB. The claw seed data arrays use a `model:` field (~65 `server/seed-*claw*.ts` files, 124 literals). Fix the literal there.

## Rule: seeds pass `model:` but createAgent reads `aiModel`
**Why:** on a FRESH DB (all seeds run create-path), most claw seeds call `createAgent({ ..., model: "..." })`, but `createAgent` in both `server/db-storage.ts` and `server/storage.ts` only read `insertAgent.aiModel` (defaulting to `gpt-4o-mini`). So `model:` was silently ignored on create → fresh DB would get mini regardless of the seed literal. `defaultModel()` also returns `gpt-4o-mini` when only OPENAI_API_KEY is set (no Qwen/DeepSeek).

**How to apply:** both storages now have a backstop: `aiModel: insertAgent.aiModel || (insertAgent as any).model || "gpt-4o-mini"`. Keep it — it maps the legacy `model` field so all `model:`-passing seeds create with the right model. Runtime resolution is `agent.aiModel || defaultModel()` (external chat path `~routes.ts:7023` uses `agent.aiModel || "gpt-4o-mini"`).

## Rule: prod is a SEPARATE DB — the durable fix is a boot-time idempotent UPDATE
**Why:** editing seed source only fixes the CREATE path (fresh DB). Existing rows in an already-populated DB are skipped by "skip if exists" seeds, so a dev-only model upgrade NEVER propagates to production (which has its own DB and only ever ran the original seed). Symptom: dev all `gpt-4o`, prod majority still `gpt-4o-mini` → deployed chatbots feel dumb even though dev is fine. Cannot write prod DB directly (only read-replica for queries); the only write channel into prod is code that runs at boot on deploy.

**How to apply:** there is now a `[SmartModelUpgrade]` block in `server/index.ts` (broadened from the old claw-only `[ClawModelUpgrade]`) placed AFTER all seed calls and before `startScheduler()` — `UPDATE agents SET ai_model='gpt-4o' WHERE ai_model IS NULL OR ai_model IN ('gpt-4o-mini','gpt-3.5-turbo','qwen-turbo')`. Now covers ALL agents (not just claw), but ONLY the known weak tiers — it deliberately leaves `custom`/`deepseek*`/`qwen-plus`/`gemini*-pro` choices untouched so operator-chosen smart models aren't clobbered. Runs every boot (idempotent no-op once converged), and because it runs LAST it wins over the force-reseed claw files. Takes effect in prod only after a REDEPLOY. Keep this block; don't "clean it up" — it is the propagation mechanism.

## Rule: "smart standard everywhere" — no weak default in any runtime answer path
**Why:** user directive (cost-accepted) — every feature & chatbot must use a smart-tier model, never gpt-4o-mini/3.5/qwen-turbo/gemini-flash. Weak literals were scattered across many runtime files, not just claw seeds.

**How to apply:** `routes.ts` defines `const SMART_MODEL="gpt-4o"`; `defaultModel()` is smart-first cross-provider `gpt-4o → deepseek-chat → qwen-plus → gemini-2.5-pro` (falls to next provider only when that key exists). All standalone inline `openai.chat.completions.create({model:...})` calls, model-router `chooseModel` tiers, storage/routes-legal defaults, signup default agents (auth storage.ts + emailAuth.ts), document-importer, research-feed fallbacks, blueprint inference default, and the KB-generate Gemini call (→ gemini-2.5-pro) are all smart now. EXCLUDED on purpose: audio `gpt-4o-mini-transcribe` (transcription axis, not answer quality) and the `/api/diag/gemini` connectivity probe. **Follow-up gap:** only the main chat stream has per-request provider failover; standalone tool endpoints use a fixed SMART_MODEL with NO cross-provider retry, so OpenAI quota exhaustion can hard-fail those. Extending failover to non-stream endpoints (e.g. via `callWithRouter`) is the next improvement.

## Rule: OpenRouter & Nvidia are FALLBACK-ONLY, never primary
**Why:** the chat-stream primary client selection maps a bare model string → provider by prefix (`gpt-4o`/`deepseek-`/`qwen-`/`gemini-`/`custom`). OpenRouter (`openai/gpt-4o`) and Nvidia (`deepseek-ai/...`) model strings do NOT match any primary branch → they'd hit the OpenAI default branch and fail (or hard-error "AI service not configured" if no OpenAI key) BEFORE fallbacks run. So they must NOT be added to `defaultModel()`.

**How to apply:** both are wired ONLY as extra `fallbackAttempts.push(...)` entries in the `/api/chat/stream` failover array (routes.ts), gated on `process.env.OPENROUTER_API_KEY` / `NVIDIA_API_KEY`, inserted BEFORE the DeepSeek block. Full chain: OpenAI(gpt-4o primary) → OpenRouter → Nvidia → DeepSeek → Qwen → Gemini. Both are OpenAI-SDK compatible (`new OpenAI({apiKey, baseURL})`, streaming). Constants near `defaultModel`: `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1` model `OPENROUTER_MODEL`||`openai/gpt-4o`; `NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1` model `NVIDIA_MODEL`||`deepseek-ai/deepseek-v4-flash`. **Nvidia account is model-gated:** the 405b/llama-3.3-70b/nemotron slugs return 404 "Not found for account"; only `deepseek-ai/deepseek-v4-flash` was reachable (200, ~2.7s) — verify slug via `GET /v1/models` + a live chat probe before changing the default. Auto-shift only activates for the chat stream; standalone tool endpoints still have no cross-provider retry (see follow-up gap above). Takes effect in prod only after REDEPLOY.

## Unrelated pre-existing boot noise (not caused by model work)
SKK/LSP seeds (seed-manajemen-lsp-extra, seed-skk-sipil-wave*) throw `exec.select/insert is not a function` at boot — they pass a partial transaction executor into `lookupSeriesNameForAgent`/`createAgent`. Non-fatal, seeds catch it. Not a claw/model issue.
