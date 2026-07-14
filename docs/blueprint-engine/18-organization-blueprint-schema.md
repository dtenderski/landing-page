# Tahap 18 — Organization Blueprint Schema (Fase 3: AI Organization)

> **Sasaran Fase 3:** memperluas alur no-code **Dialog → Blueprint → Konfigurasi**
> agar bukan hanya melahirkan *satu* chatbot, tapi *satu organisasi AI* —
> sekumpulan agen (orchestrator + spesialis) yang saling bekerja sama.
> Pengguna tetap tidak menulis kode; yang bertambah adalah *apa* yang bisa
> dihasilkan dari alur yang sama.

## Apa yang dibuat di tahap ini
`shared/blueprint/organization-blueprint-schema.ts` — tipe/skema murni (Zod),
**aditif total**: tidak mengubah `blueprint-schema.ts`, tidak menyentuh Builder,
DB, API, atau UI. Belum diimpor kode aplikasi mana pun.

## Bentuk data
`OrganizationBlueprint`:
- `meta` — `name`, `mission`, `intent`, `status`, dan `agentIds` (peta
  `localId → agentId`, diisi NANTI oleh Configuration Engine setelah agen dibuat).
- `members[]` — tiap anggota = satu "kursi": `localId`, `role`
  (`orchestrator | specialist | support`), `title`, `responsibility`, dan
  `blueprint` (DNA agen single-agent dari Tahap 2, **dipakai ulang** — tanpa
  duplikasi field).
- `structure` — `leadLocalId` (orchestrator puncak) + `edges[]` (graf berarah
  `fromLocalId → toLocalId`, plus `role`/`description`). Edge inilah yang nanti
  menjadi entri `agenticSubAgents` tiap orchestrator.

## Keputusan desain penting (kenapa begini)
1. **localId, bukan agentId.** Saat DESAIN, agen belum punya ID database. Anggota
   dirujuk via `localId` stabil dalam satu blueprint. Configuration Engine (tahap
   lanjutan) yang menerjemahkan `localId → agentId` setelah agen dibuat, lalu
   menulis `agenticSubAgents`. Ini menghindari masalah ayam-dan-telur (edge butuh
   agentId; agentId baru ada setelah agen dibuat).
2. **Memakai ulang `blueprintSchema` per anggota.** Tidak ada definisi field yang
   diduplikasi; semua metadata confidence/source single-agent otomatis berlaku.
3. **Struktur kolaborasi disimpan di level ORGANISASI**, bukan di dalam modul
   `orchestration` tiap anggota. Sebab modul itu memakai `agentId`/`agentSlug`
   yang belum ada pada saat desain.
4. **Partial by design + lint sebagai warning, bukan throw.** Organisasi boleh
   setengah jadi selama dialog. `lintOrganizationBlueprint` mendeteksi: localId
   duplikat, edge menggantung (from/to tak dikenal), `fromLocalId` bukan
   orchestrator, self-edge, dan `leadLocalId` salah/bukan orchestrator.

## Tes
`tests/organization-blueprint-schema.test.ts` (`node:test` + `tsx --test`):
konstruksi valid, pemakaian ulang Blueprint (18 modul), dan setiap aturan lint.

## Langkah lanjut (belum dikerjakan)
- **Tahap 19** — Organization Mapping Engine: `OrganizationBlueprint` →
  rencana N agen + wiring `agenticSubAgents` (pure, belum disambung).
- **Tahap 20** — Organization Configuration Engine: materialisasi tim (buat N
  agen secara atomik, resolve `localId → agentId`, tulis edge), safe-by-default
  `dryRun` seperti `/configure` single-agent.
- **Tahap 21+** — perluasan Dialogue/Inference untuk merancang struktur tim, lalu
  API wiring & UI wizard. Tiap tahap: berhenti & review.
