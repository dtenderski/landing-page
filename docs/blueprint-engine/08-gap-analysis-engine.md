# Tahap 8 — Gap Analysis Engine

> **Status:** ✅ SELESAI
> **File:** `server/services/blueprint-engine/gap-analysis-engine.ts`
> **Tes:** `tests/gap-analysis-engine.test.ts` (17 tes)

## Tujuan
Mengubah skor keyakinan (Tahap 7) menjadi **daftar temuan (gap) berprioritas
dengan rekomendasi konkret**, plus mendeteksi **inkonsistensi antar-field**
(kontradiksi konfigurasi) yang tidak terlihat dari skor saja.

Pertanyaan yang dijawab: *"Apa yang harus diperbaiki berikutnya, dan kenapa?"*

## Prinsip (sama seperti engine sebelumnya)
- **Murni (pure):** tanpa DB / storage / UI / LLM. Tidak ada efek samping.
- **Deterministik & idempoten:** dua panggilan identik → output identik.
- **Read-only:** hanya membaca Blueprint, tidak memutasi input.
- **Aditif:** belum disambung ke route mana pun.

## Empat jenis gap
| Jenis | Arti | Sumber |
|------|------|--------|
| `missing` | field esensial masih kosong | `ConfidenceReport.missingRequired` |
| `weak` | field esensial terisi tapi keyakinan rendah | `ConfidenceReport.weakestFields` |
| `unconfirmed` | nilai hasil tebakan AI menunggu konfirmasi | `ConfidenceReport.awaitingConfirmation` |
| `inconsistent` | dua/lebih field saling bertentangan | `CONSISTENCY_RULES` (di engine ini) |

## Keparahan (severity)
- `missing` di modul **inti** (identity/aiEngine/goals/policy) → **critical**; di modul lain → **high**.
- `weak` di inti → **high**; di modul lain → **medium**.
- `unconfirmed` → **low**.
- `inconsistent` → sesuai aturan (high/medium).

**Gap pemblokir** (`isBlocking`): semua `critical`, atau `high` di modul inti.
`readyToApply = blockingCount === 0`.

## Aturan inkonsistensi (`CONSISTENCY_RULES`)
Deterministik, tiap aturan mengembalikan satu gap atau null:

| id | Modul | Kontradiksi |
|----|-------|-------------|
| `rag-without-sources` | knowledge | `ragEnabled` true tapi `sources` kosong |
| `orchestrator-without-subagents` | orchestration | `isOrchestrator` true tapi `agenticSubAgents` kosong |
| `conversion-enabled-without-goal` | conversion | `conversionEnabled` true tapi `conversionGoal` kosong |
| `scoring-enabled-without-rubric` | conversion | `scoringEnabled` true tapi `scoringRubric` kosong |
| `landing-enabled-without-headline` | landingPage | `landingPageEnabled` true tapi `landingHeroHeadline` kosong |
| `trial-enabled-without-days` | monetization | `trialEnabled` true tapi `trialDays` ≤ 0 |
| `temperature-out-of-range` | aiEngine | `temperature` di luar 0–2 |
| `public-but-inactive` | access | `isPublic` true tapi `isActive` false |

## API
```ts
analyzeGaps(blueprint: Blueprint, options?: GapOptions): GapReport
```

### GapOptions
- `report?` — `ConfidenceReport` precomputed (agar tak menghitung ulang).
- `maxNextActions?` — jumlah rekomendasi teratas (default 5).
- (+ semua `ConfidenceOptions`: `weights`, `confirmedThreshold`, `baselineUntracked`, dst.)

### GapReport
- `gaps` — terurut: keparahan → jenis → id (stabil).
- `byType`, `bySeverity` — ringkasan jumlah.
- `readyToApply` — true bila tak ada gap pemblokir.
- `blockingCount` — jumlah gap pemblokir.
- `nextActions` — rekomendasi dari gap teratas (≤ `maxNextActions`).
- `overallConfidence` — diteruskan dari Confidence Engine.

## Hubungan antar-tahap
- **Hulu:** memakai `scoreBlueprint()` (Tahap 7).
- **Hilir:** `nextActions` & daftar gap jadi bahan dialog lanjutan (Tahap 5,
  hanya tanya yang lemah) dan input untuk Critic Engine (Tahap 9).

## Contoh
```ts
const report = analyzeGaps(bp);
if (!report.readyToApply) {
  console.log("Perlu dibenahi dulu:", report.nextActions);
}
```
