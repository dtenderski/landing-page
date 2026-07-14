# Tahap 6 — Inference Engine

**File:** `server/services/blueprint-engine/inference-engine.ts`
**Tes:** `tests/inference-engine.test.ts` (11 tes, lolos)
**Status:** SELESAI — murni/pure, belum disambung ke route mana pun (aditif).

## Tujuan
Menyimpulkan (infer) field Blueprint dari **sedikit input** yang sudah ada —
terutama `meta.intent`, nama, deskripsi, dan keahlian — lengkap dengan
**alasan (evidence)** dan **skor keyakinan** per field. Tujuan akhirnya:
mengurangi jumlah pertanyaan yang harus diajukan Dialogue Engine (Tahap 5),
mewujudkan prinsip **"Confidence, bukan Completion"**.

## Prinsip (sama seperti engine sebelumnya)
- **Murni/pure**: tanpa DB, storage, UI, atau LLM. Tidak ada efek samping.
- **Deterministik**: semua inferensi berbasis heuristik/aturan → mudah diuji &
  **idempoten** (menjalankan dua kali menghasilkan Blueprint identik).
- **Tidak pernah menimpa manusia**: field dengan `source="user"` selalu dilewati.
- **Aditif**: belum dipanggil dari route mana pun.

## API
```ts
inferBlueprint(blueprint, options?) => {
  blueprint,          // salinan baru (input tak dimutasi)
  inferences,         // log field yang BENAR-BENAR ditulis (punya evidence)
  trace,              // seluruh jejak keputusan (termasuk yang dilewati)
  stats,              // { written, skipped, rulesEvaluated }
}
```

### options
| Opsi | Default | Arti |
|------|---------|------|
| `overwriteInferred` | `true` | Boleh menyempurnakan ulang field yang sebelumnya juga "inferred". |
| `confirmThreshold` | `0.75` | confidence di bawah ini → `needsConfirmation=true`. |
| `minConfidenceToWrite` | `0.3` | confidence di bawah ini → tidak ditulis sama sekali. |
| `maxPasses` | `2` | Jumlah lintasan agar aturan bisa saling membangun. |

## Aturan prioritas penulisan (`evaluateRule`)
1. `source="user"` → **skip selalu** (jangan timpa manusia).
2. Nilai sudah ada:
   - asal `"inferred"` & `overwriteInferred` → boleh disempurnakan ulang.
   - selain itu → **skip** (nilai asal tak dikenal dianggap otoritatif).
3. Nilai kosong → jalankan aturan; bila `confidence < minConfidenceToWrite` → skip.

Setiap penulisan mengisi `fieldMeta`: `{ source:"inferred", confidence, evidence,
needsConfirmation }`, dan menaikkan `module.status` dari `empty` → `inferred`.

## Bank aturan (`INFERENCE_RULES`, urutan = dependensi)
| Aturan | Field | Sumber sinyal | Catatan keyakinan |
|--------|-------|---------------|-------------------|
| `identity.slug` | identity.slug | nama | 0.9, tak perlu konfirmasi (transformasi pasti) |
| `identity.description` | identity.description | intent | 0.5, perlu konfirmasi |
| `identity.category` | identity.category | taksonomi kata kunci | 0.5–0.9 sesuai jumlah hit |
| `identity.toneOfVoice` | identity.toneOfVoice | kategori | 0.55 |
| `aiEngine.temperature` | aiEngine.temperature | nada bicara | 0.6, tak perlu konfirmasi |
| `identity.language` | identity.language | default platform `id` | 0.7, tak perlu konfirmasi |
| `aiEngine.aiModel` | aiEngine.aiModel | default `gpt-4o-mini` | 0.6, tak perlu konfirmasi |
| `identity.greetingMessage` | identity.greetingMessage | nama | 0.5, perlu konfirmasi |
| `knowledge.ragEnabled` | knowledge.ragEnabled | jejak kata "dokumen/regulasi/…" | 0.5–0.8 |
| `conversion.conversionGoal` | conversion.conversionGoal | jejak kata komersial | 0.5, perlu konfirmasi |
| `agentic.agenticMode` | agentic.agenticMode | `orchestration.isOrchestrator=true` | 0.85 |
| `aiEngine.systemPrompt` | aiEngine.systemPrompt | komposisi identitas+tujuan+kebijakan | 0.55, perlu konfirmasi (terakhir, agar memakai field hasil inferensi lain) |

Taksonomi kategori → nada → temperature di-hardcode sebagai peta kecil
(`CATEGORY_KEYWORDS`, `CATEGORY_TONE`, `TONE_TEMPERATURE`).

## Integrasi dengan tahap lain
- **Dialogue Engine (5)**: field hasil inferensi yang `needsConfirmation=true`
  atau confidence rendah tetap akan ditanyakan; yang yakin tinggi tidak.
- **Mapping/Configuration (3/4)**: nilai inferensi diperlakukan sama seperti
  nilai lain saat dipetakan & ditulis ke Builder.
- Validitas struktur dijaga oleh `lintBlueprintFieldMeta` (diuji di tes) — setiap
  pasangan modul/field di bank aturan dipastikan valid terhadap skema.

## Catatan desain
- Penghalus berbasis LLM (mis. menulis ulang deskripsi/systemPrompt lebih natural)
  sengaja **tidak** dimasukkan ke sini agar engine tetap deterministik & teruji.
  Lapisan LLM bisa ditambah terpisah saat fase penyambungan.
