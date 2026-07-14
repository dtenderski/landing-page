# Tahap 5 — Dialogue Engine V2

**File:** `server/services/blueprint-engine/dialogue-engine.ts`
**Sifat:** MURNI (pure) — tanpa DB, tanpa LLM, tanpa UI. Belum disambung ke route mana pun (aditif).

## Tujuan
Wawancara Socratic **adaptif** yang mengisi Blueprint dengan pertanyaan **sesedikit mungkin**. Mewujudkan prinsip roadmap *"Confidence, bukan Completion"*: hanya menanyakan field penting yang masih **kosong / confidence rendah / menunggu konfirmasi**.

## API publik
| Fungsi | Guna |
|---|---|
| `selectNextQuestions(blueprint, options?)` | Kembalikan **batch** pertanyaan berikutnya (default maks 3), terurut prioritas, hanya field yang belum mantap. Jantung "tanya sesedikit mungkin". |
| `applyAnswer(blueprint, nodeId, rawValue)` | Simpan satu jawaban → **salinan Blueprint baru** (set nilai + `fieldMeta` `source:"user"`, `confidence:1`, `needsConfirmation:false` + segarkan status modul). |
| `applyAnswers(blueprint, { nodeId: value })` | Terapkan banyak jawaban sekaligus. |
| `getDialogueState(blueprint, options?)` | Ringkasan progres esensial + batch berikutnya. Bila esensial tuntas, otomatis menawarkan tier opsional. |
| `QUESTION_BANK` | Bank pertanyaan kurasi (diekspor agar bisa diuji/diinspeksi). |

## Opsi (`SelectOptions`)
- `max` (default **3**) — batas jumlah pertanyaan per batch.
- `minConfidence` (default **0.6**) — field dengan confidence di bawah ini dianggap belum mantap → ditanya ulang.
- `includeOptional` (default **false**) — ikut sertakan tier opsional (priority > `ESSENTIAL_MAX_PRIORITY`).

## Aturan "sudah diketahui" (tidak ditanya lagi)
Sebuah field dilewati hanya bila **ketiganya** benar:
1. Nilainya **ada** (bukan undefined/null/string kosong/array kosong; `0` & `false` dianggap ada).
2. `fieldMeta.needsConfirmation` **bukan** true.
3. `fieldMeta.confidence` **≥** `minConfidence`.

Artinya field hasil tebakan AI berkeyakinan rendah / bertanda `needsConfirmation` **tetap** ditanyakan/dikonfirmasi.

## Bank pertanyaan (tier)
- **Tier 1 (inti):** `meta.intent`, `identity.name`, `identity.description`, `monetization.productTargetUser`, `goals.primaryOutcome`.
- **Tier 2 (persona & batasan):** `identity.language`, `identity.toneOfVoice`, `identity.expertise`, `identity.greetingMessage`, `identity.avoidTopics`, `policy.riskCompliance`, `knowledge.ragEnabled`.
- **Tier 3 (opsional):** `orchestration.isOrchestrator`, `monetization.productSummary`, `conversion.conversionGoal`, `widget.widgetWelcomeMessage`.

Tier 1–2 = **esensial** (`ESSENTIAL_MAX_PRIORITY = 2`). Bank **sengaja tidak** mencakup semua ~150 field — itu melawan prinsip "sesedikit mungkin". Field lain diisi via Inference (Tahap 6), default, atau edit manual di Builder.

## Pseudo-module `meta`
Node dengan `module: "meta"` menulis ke `blueprint.meta` (mis. `intent`). `meta` tak punya `fieldMeta`, jadi status "diketahui" dinilai dari ada/tidaknya nilai saja.

## Coercion jawaban
- `boolean` ← `true`/`"ya"`/`"yes"`/`"1"`/`"aktif"`.
- `number` ← `Number(raw)`.
- `list` / `multiselect` ← string dipisah koma/baris baru → `string[]` (di-trim, buang kosong).
- Selain itu identitas (apa adanya). Node boleh override via `coerce`.

## Keamanan & batas
- **Pure & immutable**: `applyAnswer` tak memutasi input (uji #9). Mengembalikan salinan via `structuredClone`.
- `nodeId` asing → `applied:false` + warning, Blueprint tak berubah.
- Belum memanggil LLM: penghalusan kalimat pertanyaan (opsional) menjadi tugas lapisan di atas pada fase penyambungan.

## Hubungan tahap
- **Hulu:** Tahap 6 (Inference) & 7 (Confidence) mengisi `confidence`/`needsConfirmation`; engine ini hanya **membacanya** untuk memutuskan apa yang ditanya.
- **Hilir:** jawaban menaikkan confidence → siap dipetakan Mapping Engine (Tahap 3) lalu ditulis Configuration Engine (Tahap 4).
