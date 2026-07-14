---
name: KB seeding with real embeddings for a new mentor/RAG agent
description: Pattern for creating an agent + grounding it in large source docs (ebooks etc.) with real semantic search, and the OpenAI-key pitfall hit while doing it.
---

When building an agent meant to answer from specific source documents (e.g. an "AI Mentor" grounded in a book series), the codebase's `scripts/seed-*.ts` idiom (standalone `tsx` script, raw `pg` Pool against `DATABASE_URL`, bypassing the HTTP API) is the right pattern — but the existing examples (`seed-kb-from-docs.ts`) skip embeddings and insert empty `embedding: []`, which makes `searchKnowledgeBase` fall back to returning arbitrary/first chunks instead of true semantic retrieval.

For a corpus large enough to need real RAG (multiple long documents), compute embeddings yourself in the seed script: reuse the exact `chunkText` logic from `server/lib/rag-service.ts` (800 chunkSize/200 overlap defaults) and call OpenAI's `text-embedding-3-small` in batches of 20, storing the vector in the `knowledge_chunks.embedding` jsonb column (not just `metadata`). Make the script idempotent by deleting the agent's existing `knowledge_bases`/`knowledge_chunks` before re-inserting, so it can be safely re-run when source content changes.

**Pitfall hit:** `OPENAI_API_KEY` existed as a secret but was an invalid placeholder — the OpenAI 401 error body echoed back the masked string as `OPENAI_A**_KEY`, a strong signal the secret's *value* was literally the string `"OPENAI_API_KEY"` rather than a real key. Don't assume a listed secret is a working credential; a 401 whose masked-key text matches the env var name itself means the value is bogus, not a real leaked/expired key — ask the user for a real one via `requestSecrets`.

**Also note:** routes that read `process.env.OPENAI_API_KEY` at module load (`server/routes.ts`) need a workflow restart after the secret is fixed/added before the new key takes effect — a curl test right after `requestSecrets` resolves can still 503 with "AI service is not configured" until restarted.

**Model behavior caveat:** even with an explicit "don't guess/hallucinate definitions for terms not in your knowledge base" instruction in the system prompt, gpt-4o-mini will still confidently answer domain-specific acronyms (e.g. answered "SMAP" using its own general training knowledge as "Sistem Manajemen Anti Penyuapan") when the term isn't in the retrieved RAG context. Prompt-only guardrails don't fully suppress a general-purpose model's own world knowledge — treat this as a known limitation, not something to keep iterating on via prompt tweaks alone.
