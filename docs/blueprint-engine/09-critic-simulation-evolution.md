# Tahap 9 — Critic / Simulation / Evolution Engine (TERAKHIR)

> **Status:** ✅ SELESAI
> **File:**
> - `server/services/blueprint-engine/critic-engine.ts`
> - `server/services/blueprint-engine/simulation-engine.ts`
> - `server/services/blueprint-engine/evolution-engine.ts`
> **Tes:** `tests/critic-engine.test.ts` (10) · `tests/simulation-engine.test.ts` (10) · `tests/evolution-engine.test.ts` (10)

Tahap penutup menambah tiga engine yang menilai **mutu**, **kesiapan**, dan
**perkembangan** Blueprint. Ketiganya menyusun di atas Confidence (Tahap 7) &
Gap Analysis (Tahap 8). **Prinsip sama:** murni/deterministik, tanpa
DB/LLM/UI, read-only, belum disambung (aditif).

---

## 1. Critic Engine — `critiqueBlueprint(bp, options?)`
Menjawab: *"Apakah konfigurasi ini akan menghasilkan agen yang BAIK?"* —
penilaian **kualitatif** melampaui ada/tidak (Gap) dan seberapa yakin (Confidence).

Lima dimensi (0..1):
| Dimensi | Arti | Sumber |
|---------|------|--------|
| completeness | lengkap & yakin | Confidence Engine |
| readiness | siap diterapkan | Gap Engine (`blockingCount`) |
| clarity | spesifik-tidaknya identitas/persona/prompt | heuristik |
| alignment | keselarasan tujuan↔kebijakan↔konversi↔produk | heuristik |
| safety | adanya pagar pengaman (guardrail/off-topic/eskalasi) | heuristik |

Output `CritiqueReport`: `dimensions`, `overallScore` (rata-rata berbobot),
`grade` (A–E), `findings` (strength/warning/weakness + rekomendasi), `summary`.

Bobot: completeness 0.30, readiness 0.25, clarity/alignment/safety masing-masing 0.15.
Grade: A ≥0.85, B ≥0.70, C ≥0.55, D ≥0.40, E <0.40.

## 2. Simulation Engine — `simulateBlueprint(bp, options?)`
"Uji kering" **tanpa LLM**: menurunkan skenario percakapan customer yang
representatif dari isi Blueprint, lalu memeriksa apakah field pendukungnya ada.

Skenario dasar (selalu): `greeting`, `core-question`, `off-topic`, `escalation`.
Skenario bersyarat (muncul jika fitur dipakai): `factual-domain` (knowledge),
`pricing` (produk), `purchase-intent` (konversi/produk).

Tiap skenario punya `mode`:
- `any` — cukup salah satu field ada → readiness 1.
- `all` — readiness = rasio field yang ada.

Status: `ready` (≥ `readyThreshold`, default 0.99), `partial` (>0), `unready` (0).
Output `SimulationReport`: per-skenario (`readiness`, `status`, `satisfied`,
`missing`), `coverage` (rata-rata), hitungan ready/partial/unready, `summary`.

## 3. Evolution Engine — `analyzeEvolution(history, options?)`
"Living Blueprint": menganalisis **riwayat** snapshot (kronologis, terbaru di
akhir) — riwayat diberikan sebagai input array (engine tetap tak menyimpan apa pun).

- < 2 snapshot → `trend: "insufficient-data"` (tetap memberi saran dari gap bila ada 1).
- Membandingkan snapshot **pertama vs terakhir**: `overallConfidenceDelta`,
  delta per modul (`up`/`down`/`stable`, ambang `changeThreshold` default 0.02).
- `trend`: improving / declining / stable.
- `suggestions`: prioritaskan modul yang **menurun**, lalu rekomendasi gap teratas.

Output `EvolutionReport`: `trend`, confidence from/to/delta, `perModule[]`,
`improved[]`, `regressed[]`, `suggestions[]`, `snapshots`.

---

## Hubungan antar-tahap
- **Hulu:** Confidence (7) + Gap (8) → Critic & Evolution.
- **Hilir:** Critic `findings` + Simulation `missing` + Evolution `suggestions`
  jadi bahan dialog lanjutan (Tahap 5) — menyempurnakan Blueprint terus-menerus.

## Catatan
Semua engine Tahap 1–9 kini lengkap dan **belum tersambung** ke route/UI mana
pun. Penyambungan ke aplikasi adalah fase berikutnya (di luar 9-tahap roadmap),
dilakukan saat diputuskan, tanpa merombak Builder existing.
