---
name: Reposisi Gustafta → AI Organization Builder
description: Arah strategis besar — Gustafta naik kelas dari "AI Chatbot Builder" menjadi "AI Organization Builder". Baca sebelum kerja narasi/positioning/landing utama.
---

## Visi (dinyatakan owner, Juni 2026)
Gustafta = **AI Organization Builder**: platform yang mengubah **pengetahuan manusia → organisasi AI** yang mampu **berpikir, berkolaborasi, menghasilkan karya, dan membangun bisnis berkelanjutan**.

**Why:** naik dari positioning "alat bikin chatbot" (komoditas, mudah ditiru) ke kategori sendiri (organisasi AI) — diferensiasi & nilai jangka panjang.

## Prinsip eksekusi
- **Bertahap, pelan-pelan** (permintaan eksplisit owner). Jangan rombak besar sekaligus. Kunci konsep/narasi dulu sebelum sentuh kode/UI.
- Fondasi teknis SUDAH ADA — ini reframing + pendalaman, bukan bangun dari nol.

## Pemetaan visi → aset existing
| Pilar visi | Aset hari ini |
|---|---|
| Berpikir | 900+ agen, Model Router (`server/lib/model-router.ts`) |
| Berkolaborasi | Inter-Agent API v2, 131 Federation hub, MultiClaw orkestrasi sub-agen paralel |
| Menghasilkan karya | Mini Apps (45 jenis), AI Tools (RAB, K3 Vision), generator dokumen |
| Membangun bisnis | Store, template, sistem paket berlangganan |

## Yang masih kurang (kandidat pekerjaan)
- Narasi/manifesto "AI Organization Builder" yang tajam & konsisten.
- Builder journey (pengalaman pengguna membangun "organisasi AI"-nya).
- Bahasa produk konsisten lintas landing/UI (istilah "organisasi AI", bukan "chatbot").

## Roadmap eksekusi (Blueprint Engine) — dokumen kanonik
Roadmap teknis bertahap hidup di **`docs/blueprint-engine/`** (BUKAN di memory):
- `00-roadmap.md` — 9 tahap (Audit→Blueprint Schema→Mapping→Config→Dialogue V2→Inference→Confidence→Gap→Critic/Sim/Evolution).
- `01-builder-audit.md` — katalog Builder (tabel `agents` + panel + entitas anak).
- `02-blueprint-schema.md` + `shared/blueprint/blueprint-schema.ts` — Blueprint JSON "DNA".
- `03-mapping-engine.md` + `server/services/blueprint-engine/mapping-engine.ts` — Blueprint→Builder (PURE, no DB).
- `04-configuration-engine.md` + `server/services/blueprint-engine/configuration-engine.ts` — engine penulis pertama (create/update agen + anak via storage; dryRun; belum disambung).
- `05-dialogue-engine.md` + `server/services/blueprint-engine/dialogue-engine.ts` — Dialogue Engine V2 (PURE). Keputusan durable: bank pertanyaan KURASI (subset field, BUKAN semua ~150) demi prinsip "tanya sesedikit mungkin"; field dianggap "sudah diketahui" (tak ditanya) HANYA bila value ada DAN confidence≥ambang DAN !needsConfirmation — jadi tebakan AI low-confidence tetap dikonfirmasi.

**Drift tipe ID (jebakan nyata, lintas seluruh app):** `agents.id` = `serial` (number runtime) tapi tipe TS `Agent.id` ditulis `string`; kolom `agentId` tabel anak = `integer` tapi insert-Zod-nya `z.string()`; `agents.agenticSubAgents[].agentId` (Zod) = `z.number()`. Akibatnya saat menulis: paksa agentId anak ke `String()` (cocok insert-Zod anak), dan agentId sub-agen ke `number` (cocok jsonb). `insertAgentSchema` adalah ZodEffects (refine "orchestrator wajib Big Idea") → tak bisa `.partial()`; untuk update parsial pakai `createInsertSchema(agents).partial()` (validasi tipe saja, bukan business-range).

**Keputusan desain Blueprint (durable):**
- Field Blueprint memakai **nama kolom `agents` apa adanya** → Mapping Engine bisa 1:1. Jangan rename.
- **Confidence, bukan Completion**: tiap field punya `FieldMeta{confidence,source,evidence,needsConfirmation}`; dialog hanya tanya yang confidence rendah.
- **Scope contract**: Blueprint = DNA desain, BUKAN gudang data. Kecualikan field system-managed (id/userId/accessToken/createdAt) & tabel runtime (analytics/messages/leads/scoring_results). Yang masuk hanya konfigurasinya.

**STATUS roadmap (per Juni 2026): Tahap 1–9 SELESAI.** Seluruh engine ada di `server/services/blueprint-engine/` + barrel `index.ts`. Tahap 6 Inference, 7 Confidence, 8 Gap, 9 = Critic+Simulation+Evolution (tiga file: `critic-engine.ts` skorecard 5-dimensi grade A–E; `simulation-engine.ts` dry-run skenario customer tanpa LLM; `evolution-engine.ts` analisis riwayat snapshot). Semua PURE/deterministik + tes regresi permanen di `tests/*-engine*.test.ts`. **PENTING: lapisan engine (Tahap 1–9) masih PURE & belum disambung ke route/UI.** Fase penyambungan ("wiring") berjalan bertahap, aman karena **akun dev ini TERPISAH dari akun live** (live di akun lain — perubahan di sini tak menyentuh produksi).
**Wiring Stage 1 = SELESAI:** persistensi Blueprint. Tabel `blueprints` (`shared/schema.ts`: id serial, userId varchar, name, intent, data jsonb, timestamps) + `insertBlueprintSchema`/`InsertBlueprint`/`BlueprintRecord`. CRUD di `IStorage`+`DatabaseStorage`+`MemStorage`, plus varian **owner-scoped** (`get/update/deleteBlueprintForUser(id,userId)`) untuk cegah IDOR sebelum route dibuat. Tes: `tests/blueprint-storage.test.ts` (MemStorage, 7 pass). Tabel sudah di-push ke DB dev. **Belum ada route/UI.** Rencana lanjut: Stage 2 = API route read-only (jalankan engine atas Blueprint), Stage 3 = persistence API (pakai owner-scoped), Stage 4 = halaman internal tersembunyi, Stage 5 = Builder auto-fill via configuration-engine. UI/Builder disentuh PALING AKHIR.
**Catatan tes pre-existing:** `tests/routes-helper-usage.test.ts` (handler `/api/messages/stream` harus panggil `buildFinalSystemPrompt`) GAGAL sejak sebelum kerja engine — bukan regresi dari Blueprint Engine; terpisah.

**Prinsip mati-matian (ditegaskan owner berulang):** JANGAN rombak app, JANGAN ubah UI/Builder. Engine baru = ADITIF, tersembunyi dulu, disambung pelan-pelan. Engine direncanakan di `server/services/blueprint-engine/` agar Builder existing tak tersentuh sampai Tahap 4.
**Pergeseran inti:** Builder bukan titik awal tapi tujuan — alurnya `Dialog→Blueprint(JSON "DNA")→Config→Builder auto-fill→Ekosistem`. Pakai **Confidence**, bukan Completion %.

## Catatan selaras strategi lain
- Tetap hormati Framework Visibility Strategy (Framework login-gated) & aturan anti-testimoni/anti-stat-fiktif di landing-page-persuasion.md.

## Positioning inti (dikonfirmasi Gustaf, Jul 2026) — "arms dealer", bukan pesaing
Yang DIJUAL Gustafta = PLATFORM dialog-kolaborasi-kreasi (bangun chatbot/tim AI sendiri). Gustafta BUKAN penyedia jasa SBU/legalitas/tender dan BUKAN pesaing biro jasa/konsultan/asosiasi — justru merekalah pelanggan. Target pembeli = kontraktor, konsultan, biro jasa, asosiasi (pelaku ekosistem legalitas/tender/konstruksi) yang dipersenjatai AI untuk melayani klien/anggotanya lebih cepat. Grid DOMAIN(legalitas/tender/K3/ISO...) x SEKTOR(konstruksi/energi/tambang/migas/lingkungan) dipakai sebagai LENSA memilih sel pembeli + use-case, BUKAN sebagai bisnis. Konten SBU/tender/K3 di app = BUKTI/HOOK, bukan lini jasa.
**Why:** menghindari tim AI (Ketua Tim 1872 + Peneliti 1883) mengira Gustafta jualan jasa SBU. Model = "Gabungan": pesan inti platform, konten domain sebagai contoh nyata.
**How to apply:** setiap prompt tim distribusi/riset harus menyatakan positioning ini; jangan sempitkan misi jadi "riset/jual SBU".
