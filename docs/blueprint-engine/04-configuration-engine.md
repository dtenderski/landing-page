# TAHAP 4 — Configuration Engine

> **Tujuan:** Engine PERTAMA yang benar-benar **menulis** ke Builder — auto-fill agen dari Blueprint.
> **Status:** ✅ Selesai. File: `server/services/blueprint-engine/configuration-engine.ts`.
> **Prinsip:** TIDAK mengubah UI/komponen Builder — hanya menulis DATA lewat `storage`. Hasil auto-fill tetap bisa diedit user. **Belum dipanggil dari route mana pun** (masih aditif). Typecheck bersih.

---

## 1. Fungsi utama

```ts
applyBlueprintToBuilder(blueprint, options) => Promise<ConfigurationResult>
```

**Options:**
- `mode: "create" | "update"` — buat agen baru atau perbarui yang ada.
- `agentId?` — wajib untuk `update`.
- `mapping?` — opsi Mapping Engine (confidence gating).
- `dryRun?` — true = kembalikan rencana, **tidak menulis apa pun**.
- `storage?` — injeksi storage (default: singleton app; memudahkan pengujian).

**Result:** `{ applied, dryRun, mode, agentId, agentPatchKeys, created{...}, warnings }`.

## 2. Alur

1. Jalankan **Mapping Engine** → `agentPatch` + `children`.
2. **Resolusi sub-agen**: `agentSlug` → `agentId` via `getAgentBySlug` (pakai lookup by-slug sesuai gotcha). Slug tak ketemu → di-skip + warning. `agentSlug` dibuang; format kanonik `{role, agentId, description}`.
3. **Validasi** `agentPatch` (Zod):
   - `create` → `insertAgentSchema` penuh (butuh `name`, termasuk business-refine "orchestrator wajib Big Idea" & range seperti `temperature` 0–2).
   - `update` → `createInsertSchema(agents).partial()` — memvalidasi **tipe per-kolom** (cegah crash tipe), tetapi **bukan** business-range hand-written. Patch invalid-tipe → ditolak + warning.
4. **Tulis agen**: `createAgent` / `updateAgent`, **dibungkus try/catch** → kegagalan DB jadi `applied:false` + warning, bukan throw mentah.
5. **Tulis entitas anak** dengan `agentId` (di-`String()`-kan agar cocok dengan insert-Zod anak yang `z.string()`) — tiap baris divalidasi Zod + dibungkus try/catch; gagal satu baris = warning, bukan gagal total.

## 3. Mode aman & ketahanan

- `dryRun` membuktikan **nol penulisan** (tervalidasi di uji).
- Baris anak invalid (mis. KB `type` di luar enum) **dilewati dengan warning**, sisanya tetap tertulis.
- Engine menghormati **business rule existing**: mis. `insertAgentSchema` punya refine "orchestrator wajib Big Idea aktif" → create orchestrator tanpa `bigIdeaId` ditolak dan dilaporkan sebagai warning (bukan crash).

## 4. Keterbatasan yang sengaja di-defer

| Entitas | Alasan defer |
|---------|--------------|
| `vouchers` | `vouchers.agentId` bertipe **numerik nullable** — perlu enricher khusus, bukan UUID-string agen |
| `agentic_deliverables` | `agentId` integer + `dedupeKey` **unik wajib** — perlu generator dedupe |
| `projectBrain.instances` | Butuh `templateId` hasil insert template dulu |

Ketiganya dilaporkan sebagai warning, siap ditangani fase berikutnya.

## 5. Catatan drift tipe ID (penting)

Codebase ini punya inkonsistensi tipe ID yang nyata:
- `agents.id` = `serial` (**number** saat runtime), tapi tipe TS `Agent.id` ditulis `string`.
- Kolom `agentId` tabel anak = `integer`, tapi sebagian insert-Zod menulis `z.string()`.
- `agents.agenticSubAgents[].agentId` (Zod) = `z.number()` — **harus numerik**.

Configuration Engine menambahkan **koersi**: bila `agentId` sub-agen berupa string numerik, dipaksa ke `number` agar lolos validasi `agenticSubAgents`. Inilah kenapa resolusi sub-agen wajib menghasilkan id numerik.

## 6. Hasil uji (mock storage)

- **Dry run:** `writes: 0` ✓
- **Update** (agen #100, sub-agen `riset-sbu`→id 42): agen ter-update; KB=1 (1 KB invalid dilewati), miniApp=1, integration=1; voucher di-defer (warning) ✓
- **Create orchestrator tanpa bigIdeaId:** ditolak dengan warning business-rule (bukan crash) ✓
- **Slug tak ditemukan** (`tidak-ada`): sub-agen dilewati + warning ✓
