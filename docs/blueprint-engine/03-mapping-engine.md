# TAHAP 3 — Mapping Engine

> **Tujuan:** Mengubah Blueprint → rencana penulisan ke Builder (kolom `agents` + baris tabel anak).
> **Status:** ✅ Selesai. File: `server/services/blueprint-engine/mapping-engine.ts`.
> **Penting:** Fungsi **murni (pure)** — TIDAK menyentuh DB/storage/Builder. Hanya menghasilkan struktur data. Penulisan sebenarnya = tugas Tahap 4 (Configuration Engine). Typecheck bersih; tidak ada kode app yang diubah.

---

## 1. Fungsi utama

```ts
mapBlueprintToBuilder(blueprint, options?) => MappingResult
```

**Output `MappingResult`:**
- `agentPatch` — objek partial kolom tabel `agents` yang akan di-set.
- `children` — baris untuk tabel anak: `knowledgeBases`, `miniApps`, `integrations`, `projectBrainTemplates`, `vouchers`, `agenticDeliverables`.
- `warnings` — field dilewati / tak dikenal / butuh resolusi.
- `stats` — `{ fieldsMapped, fieldsSkipped, childRows }`.

**Opsi `MappingOptions`:**
- `minConfidence` (default 0) — hanya petakan field datar dengan confidence ≥ nilai ini.
- `includeNeedsConfirmation` (default true) — sertakan field yang `needsConfirmation`.

## 2. Aturan pemetaan

| Jenis field | Aksi |
|-------------|------|
| Field datar modul | Disalin 1:1 ke `agentPatch[key]` (nama kolom `agents` sama) |
| `orchestration.agenticSubAgents` | Ditransform ke format jsonb `agents`: `{role, agentId, description}`; bila hanya ada `agentSlug` → warning (resolusi di Tahap 4) |
| jsonb (`orchestratorConfig`, `agenticConfig`, `productPricing`, dll.) | Disalin apa adanya |
| Entitas anak (array) | Dirutekan ke `children.*` (tidak masuk `agentPatch`) |
| Key tak dikenal di schema modul | Dilewati + warning (deteksi typo/drift) |
| `projectBrain.instances` | Ditunda ke Tahap 4 (butuh `templateId` hasil insert) |

**Entitas anak yang dikecualikan dari `agentPatch`:** `knowledge.sources` → `knowledge_bases`; `miniApps.apps` → `mini_apps`; `integration.integrations` → `integrations`; `projectBrain.templates` → `project_brain_templates`; `monetization.vouchers` → `vouchers`; `deliverables.items` → `agentic_deliverables`.

## 3. Hasil uji (sample Blueprint)

Input Blueprint berisi identity + aiEngine + orchestration (sub-agen by-slug) + knowledge (1 source) + miniApps (1 app), plus 1 field typo (`taglinee`):

```
agentPatch: name, tagline, language, systemPrompt, temperature, aiModel,
            isOrchestrator, agenticSubAgents, ragEnabled, ragTopK
children:   knowledgeBases=1, miniApps=1
warnings:   - field tak dikenal "taglinee" (dilewati)
            - sub-agen "RISET" hanya punya agentSlug → resolusi Tahap 4
stats:      { fieldsMapped: 12, fieldsSkipped: 1, childRows: 2 }
```

Dengan `{ minConfidence: 0.5, includeNeedsConfirmation: false }`, field `tagline` (confidence 0.4 + needsConfirmation) **otomatis dilewati** — membuktikan gating confidence berfungsi.

## 4. Jembatan ke Tahap 4 (Configuration Engine)

Configuration Engine akan:
1. Ambil `agentPatch` → `UPDATE agents SET ...` (atau insert agen baru) via storage interface.
2. Untuk tiap `children.*` → insert baris ke tabel anak dengan `agentId` hasil langkah 1.
3. Resolusi `agentSlug` sub-agen → `agentId` (pakai lookup by-slug, sesuai gotcha existing).
4. Buat `project_brain_instances` setelah template-nya ter-insert.

Configuration Engine inilah satu-satunya titik yang akan **benar-benar menulis** ke Builder — dan tetap tanpa mengubah UI/komponen Builder.
