# TAHAP 2 — Blueprint Schema (JSON "DNA")

> **Tujuan:** Menyediakan satu skema JSON yang mampu mewakili SELURUH konfigurasi Builder.
> **Status:** ✅ Selesai. File: `shared/blueprint/blueprint-schema.ts`.
> **Penting:** Skema ini **belum tersambung** ke Builder/DB/UI. Murni aditif. Tidak ada kode aplikasi yang diubah; typecheck bersih (tidak menambah error).

---

## 1. Konsep

Sebuah **Blueprint** = "DNA" organisasi AI. Strukturnya:

```
Blueprint
├── meta            (versi skema, intent/Big Idea, status, agentId setelah diterapkan)
├── modules         (18 modul — cermin dari kelompok audit Tahap 1)
│   └── <modul>
│       ├── data        nilai field (mengikuti nama kolom tabel `agents`)
│       ├── fieldMeta   keyakinan PER-FIELD: { confidence, source, evidence, needsConfirmation }
│       ├── confidence  keyakinan agregat modul (0..1)
│       └── status      empty | partial | inferred | confirmed
└── overallConfidence  keyakinan keseluruhan
```

**Confidence, bukan Completion.** Tiap field punya skor keyakinan + asal (`user` / `inferred` / `default` / `unknown`). Inilah yang nanti dipakai Dialogue Engine (Tahap 5) untuk hanya menanyakan field ber-confidence rendah, dan Inference Engine (Tahap 6) untuk mengisi sisanya beserta alasannya (`evidence`).

## 2. 18 Modul (cermin audit)

`identity` · `aiEngine` · `access` · `orchestration` · `agentic` · `openClaw` · `goals` · `policy` · `deliverables` · `knowledge` · `projectBrain` · `miniApps` · `widget` · `monetization` · `landingPage` · `conversion` · `marketing` · `integration`

Setiap field di dalam modul memakai **nama JS kolom `agents`** yang sama persis (mis. `systemPrompt`, `agenticSubAgents`, `landingHeroHeadline`) supaya Mapping Engine (Tahap 3) bisa memetakan 1:1 tanpa ambiguitas. Entitas anak (knowledge base, mini apps, project brain, vouchers, integrations) diwakili sebagai array di dalam modul terkait.

## 2b. Ruang lingkup (scope contract)

Blueprint = **DNA desain**, bukan gudang semua data. Yang sengaja dikecualikan:
- **System-managed** (bukan didesain user): `id`, `userId`, `accessToken`, `createdAt`, `archivedAt`.
- **Data runtime** (bukan konfigurasi): `analytics`, `agent_messages`, `conversations`, `leads`, `scoring_results`, `mini_app_results`, `knowledge_chunks`. Yang masuk Blueprint hanya **konfigurasi**-nya (mis. `scoringRubric`/`leadCaptureFields` di modul `conversion`, `ragChunkSize` di `knowledge`).
- **Ditunda:** `company_profiles` (entitas klien BUJK, bukan DNA agen).

Kontrak ini ditulis eksplisit sebagai komentar di header `blueprint-schema.ts` agar tidak ada ekspektasi keliru soal "seluruh tabel".

## 3. API skema (yang diekspor)

- `blueprintSchema` — Zod schema Blueprint lengkap; `Blueprint` = tipe TS-nya.
- `blueprintModulesSchema`, `BlueprintModuleName`, `BLUEPRINT_MODULE_NAMES` — daftar & tipe modul.
- `fieldMetaSchema` / `FieldMeta`, `fieldSourceSchema`, `moduleStatusSchema` — primitif confidence.
- `blueprintModule(dataSchema)` — factory pembungkus modul.
- `createEmptyBlueprint(intent?)` — bikin Blueprint kosong yang valid.
- `MODULE_DATA_SCHEMAS` — registry nama modul → schema data (untuk validasi & mapping).
- `lintBlueprintFieldMeta(bp)` — deteksi key `fieldMeta` yang typo/tak dikenal sebelum mapping.
- Schema data tiap modul (`identityDataSchema`, dst.) bisa dipakai terpisah.

## 4. Contoh Blueprint (terisi sebagian, hasil dialog awal)

```jsonc
{
  "meta": {
    "schemaVersion": "1.0.0",
    "intent": "Konsultan AI sertifikasi SBU konstruksi untuk BUJK kecil-menengah",
    "status": "in_dialogue"
  },
  "modules": {
    "identity": {
      "data": {
        "name": "SBU Advisor",
        "tagline": "Pandu sertifikasi SBU dari nol sampai terbit",
        "language": "id",
        "category": "konstruksi"
      },
      "fieldMeta": {
        "name":     { "confidence": 1.0, "source": "user" },
        "tagline":  { "confidence": 0.6, "source": "inferred", "evidence": "Disimpulkan dari intent: fokus pendampingan SBU", "needsConfirmation": true },
        "language": { "confidence": 0.95, "source": "default" },
        "category": { "confidence": 0.8, "source": "inferred", "evidence": "Kata 'SBU konstruksi' pada intent" }
      },
      "confidence": 0.84,
      "status": "partial"
    },
    "goals": {
      "data": {
        "primaryOutcome": "Pengguna paham syarat & langkah ajukan SBU",
        "conversationWinConditions": "User dapat checklist dokumen + estimasi waktu"
      },
      "fieldMeta": {
        "primaryOutcome": { "confidence": 0.7, "source": "inferred", "evidence": "Tujuan lazim konsultan SBU" }
      },
      "confidence": 0.7,
      "status": "inferred"
    },
    "policy":       { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "aiEngine":     { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "access":       { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "orchestration":{ "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "agentic":      { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "openClaw":     { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "deliverables": { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "knowledge":    { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "projectBrain": { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "miniApps":     { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "widget":       { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "monetization": { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "landingPage":  { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "conversion":   { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "marketing":    { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" },
    "integration":  { "data": {}, "fieldMeta": {}, "confidence": 0, "status": "empty" }
  },
  "overallConfidence": 0.12
}
```

## 5. Jembatan ke Tahap 3 (Mapping Engine)

Karena `modules.<modul>.data.<field>` sudah memakai nama kolom `agents` yang sama, Mapping Engine cukup:
1. Untuk field datar → tulis langsung ke kolom `agents` bernama sama.
2. Untuk array entitas anak (`knowledge.sources`, `miniApps.apps`, `integration.integrations`, `projectBrain.templates`, `monetization.vouchers`) → buat baris di tabel anak terkait.
3. Untuk field jsonb (`orchestratorConfig`, `agenticConfig`, dll.) → salin objek apa adanya.

Mapping Engine akan dibuat sebagai modul terpisah (rencana `server/services/blueprint-engine/`), tetap tanpa menyentuh Builder sampai Tahap 4 (Configuration Engine) menyambungkannya.
