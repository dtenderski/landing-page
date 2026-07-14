# Tahap 7 — Confidence Engine

**File:** `server/services/blueprint-engine/confidence-engine.ts`
**Tes:** `tests/confidence-engine.test.ts` (12 tes, lolos)
**Status:** SELESAI — murni/pure, belum disambung ke route mana pun (aditif).

## Tujuan
Menghitung **skor keyakinan** (bukan sekadar "% selesai") per field, per modul,
dan untuk seluruh Blueprint. Mewujudkan prinsip inti roadmap:
**"Confidence, bukan Completion"**.

| Metrik | Arti |
|--------|------|
| **completion** | Berapa banyak field TERISI (metrik lama yang menyesatkan). |
| **confidence** | Seberapa YAKIN nilai yang ada itu benar (tertimbang asal & meta keyakinan). |

Sebuah modul bisa 100% terisi tapi confidence rendah (semua tebakan yang belum
dikonfirmasi), atau sebaliknya. Skor ini jadi bahan Gap Analysis (Tahap 8).

## Prinsip (sama seperti engine sebelumnya)
- **Murni/pure**: tanpa DB, storage, UI, atau LLM. Tidak ada efek samping.
- **Deterministik & idempoten.**
- `scoreBlueprint()` hanya **membaca** (input tak diubah).
- `applyConfidence()` mengembalikan **salinan baru** dengan skor tertanam.
- **Aditif**: belum dipanggil dari route mana pun.

## API
```ts
scoreBlueprint(blueprint, options?) => ConfidenceReport   // baca-saja
applyConfidence(blueprint, options?) => { blueprint, report } // salinan + skor
```

### ConfidenceReport (ringkas)
- `overallConfidence` — rata-rata tertimbang antar modul yang berlaku.
- `overallCompletion` — field terisi / total (untuk kontras).
- `coreReady` — true bila SEMUA modul inti (`identity`, `aiEngine`, `goals`, `policy`) sudah `confirmed`.
- `modules[name]` — `{ confidence, completion, status, applicable, weight, counts, fields }`.
- `weakestFields` — field esensial terlemah (terurut confidence menaik).
- `missingRequired` — field esensial yang masih kosong.
- `awaitingConfirmation` — field yang menunggu konfirmasi user.

### options
| Opsi | Default | Arti |
|------|---------|------|
| `confirmedThreshold` | `0.85` | confidence ≥ ini & tanpa needsConfirmation → modul `confirmed`. |
| `readyThreshold` | `0.7` | confidence modul inti ≥ ini → ikut syarat `coreReady`. |
| `baselineUntracked` | `0.5` | confidence untuk field terisi yang tanpa `fieldMeta`. |
| `lowConfidenceThreshold` | `0.6` | ambang masuk daftar `weakestFields`. |
| `weights` | — | override bobot per modul. |

## Cara skor dihitung
**Confidence per field:**
- kosong → `0`
- `source="user"` → `1`
- ada `fieldMeta.confidence` → pakai nilai itu (clamp 0..1)
- terisi tanpa meta → `baselineUntracked` (default 0.5)

**Confidence per modul:**
- Modul ber-`requiredFields`: rata-rata atas field esensial (kosong = 0 → menyeret turun).
- Modul tanpa `requiredFields`: rata-rata atas field yang **terisi saja**.

**Confidence keseluruhan:** rata-rata tertimbang `confidence × weight` atas modul
yang **applicable**. Modul opsional tanpa data → `applicable=false`, dikeluarkan
(tak menghukum user yang memang belum butuh modul itu, mis. marketing).

**Status modul** (`empty`/`partial`/`inferred`/`confirmed`):
- `empty` — tak ada field terisi.
- `partial` — ada esensial yang kosong.
- `inferred` — esensial lengkap tapi confidence < ambang / ada needsConfirmation.
- `confirmed` — esensial lengkap, confidence ≥ `confirmedThreshold`, tanpa needsConfirmation.

## Bobot & field esensial (`MODULE_SPECS`)
| Modul | weight | requiredFields | optional |
|-------|--------|----------------|----------|
| identity | 3 | name, description, toneOfVoice, language | ✗ |
| aiEngine | 3 | systemPrompt, aiModel | ✗ |
| goals | 2 | primaryOutcome | ✗ |
| policy | 2 | riskCompliance, domainCharter | ✗ |
| knowledge | 1 | ragEnabled | ✓ |
| agentic / access / orchestration / conversion | 1 | — | ✓ |
| monetization | 1 | productTargetUser, productSummary | ✓ |
| widget + sisanya | 0.5 | — | ✓ |

## Integrasi dengan tahap lain
- **HULU**: memakai `fieldMeta` dari Inference (6) & Dialogue (5).
- **HILIR**: `weakestFields` / `missingRequired` / `awaitingConfirmation` jadi
  masukan langsung untuk Gap Analysis (Tahap 8) & Critic (Tahap 9).
