# Pipeline Marketing Gustafta

Framework tim marketing Gustafta yang berjalan **otomatis tiap hari** (06:30 WIB) sebagai
satu alur berurutan. Engine: `server/lib/research-feed.ts` → `runResearchSweep()`. Dijadwalkan
di `server/index.ts` (`scheduleAtWIB`). Semua tahap **fire-and-forget** — kegagalan satu tahap
tidak menggagalkan tahap lain.

Model kolaborasi mengikuti Trilogi Buku II (KOLABORASI): agen mengerjakan yang repetitif,
manusia (founder) memegang **◆ gerbang manusia** untuk keputusan (publikasi iklan, pengiriman
sequence). Lihat `.agents/memory/ebook2-collaboration-model.md`.

## Tim & orkestrator
Kepala Tim Marketing (`kepala-tim-marketing`, id 1511) mengorkestrasi 6 sub-agen:

| Role | Agen | Slug | Peran |
|---|---|---|---|
| RISET | Tim Riset | `riset-*` (id 1476) | Pain point lokal, tren global, suara pelanggan, kompetitor |
| KONTEN | Pembuat Konten | (1508) | Headline, caption, artikel, email, skrip |
| MEDSOS | Media Sosial | (1509) | Distribusi & kalender posting lintas platform |
| IKLAN | Strategi Iklan | (1510) | Struktur kampanye berbayar (Meta/TikTok/Google) |
| MATERI_IKLAN | Pembuat Materi Iklan | `mkt-materi-iklan` (1522) | Temuan riset → materi iklan siap pakai per platform |
| RETENSI | Perawatan Pelanggan | `mkt-retensi-sequence` (1553) | Draf sequence email/WA retensi/nurture |
| CLOSING | Asisten Closing | `mkt-closing-asisten` (1564) | Jawab keberatan, skrip closing WA, follow-up prospek (Amunisi Jualan harian) + chatbot bantu jualan |

## Tahapan harian (berurutan)

### Tahap 1 — RISET
`FEED_STREAMS` (pasar, lokal, global) ditarik dari Google News RSS → diformat → di-ingest jadi
KB per agen riset (prefix `Feed Riset`). Playbook metode riset di-seed sekali (`Panduan Metode Riset`).

### Tahap 2 — MATERI IKLAN (per platform)
`generateDailyAdMaterials()` mengubah temuan riset jadi brief 3-bagian: **Inti Kreatif** (sudut dari
riset) → **Adaptasi per Platform** (TikTok/IG/FB/YouTube, sadar batas karakter) → **Cara Beriklan**.
Rujukan spesifikasi statis: `Panduan Platform Iklan` (`ensureAdPlatformLibrary`). Output disimpan KB
prefix `Materi Iklan Harian`. Mengembalikan `content` untuk dikonsumsi Tahap 3.

### Tahap 3 — SEQUENCE RETENSI (email/WA)
`generateDailyRetentionSequence()` menyusun draf **sequence email (4-5 tahap) + WhatsApp (4-5 pesan)**
untuk memelihara hubungan dengan pelanggan yang sudah ada. Bahan:
- **Konteks marketing hari ini** (output Tahap 2 + temuan pasar), dan
- **Fondasi Gustafta** (`buildGustaftaFoundationDoc` / KB `Fondasi Gustafta` via
  `ensureRetentionFoundationLibrary`) = visi AI Organization Builder + Trilogi "Dari Monolog ke
  Dialog" + produk & jasa.
Output disimpan KB prefix `Sequence Retensi Harian`. **Tidak auto-kirim** — draf untuk disetujui founder.

### Tahap 4 — AMUNISI JUALAN (bantu closing)
`generateDailyClosingKit()` menyusun **amunisi jualan** siap salin-tempel untuk membantu founder
MENUTUP penjualan: (A) 5-7 **keberatan umum + jawaban terbaik**, (B) **skrip closing WhatsApp** per
situasi (baru tanya / ragu harga / membandingkan / sudah tertarik), (C) **follow-up prospek** (belum
beli) bertahap. Bahan:
- **Konteks marketing hari ini** (materi iklan Tahap 2 + temuan pasar),
- **Fondasi Penjualan** (`buildSalesPlaybookDoc` / KB `Fondasi Penjualan` via `ensureSalesPlaybookLibrary`)
  = 3 jalur jualan, kerangka menjawab keberatan, prinsip skrip closing (jujur, ◆ gerbang manusia), dan
- **Fondasi Gustafta** (via `ensureRetentionFoundationLibrary` — juga di-seed di agen closing agar chat grounded).
Output disimpan KB prefix `Amunisi Jualan Harian`. **Tidak auto-kirim** — draf & alat bantu; keputusan
final founder. Agen ini juga berfungsi sebagai **chatbot bantu jualan** (RAG) yang siap menjawab calon
pembeli dengan grounding yang sama.

## Prune-scope KB (terpisah, tidak saling hapus)
`Feed Riset` · `Panduan Metode Riset` · `Materi Iklan Harian` · `Panduan Platform Iklan` ·
`Fondasi Gustafta` · `Sequence Retensi Harian` · `Fondasi Penjualan` · `Amunisi Jualan Harian`.
Yang "Harian" di-refresh (delete+recreate) tiap run; yang panduan/fondasi idempoten (seed sekali).

## Catatan
- Semua agen tim ini **tanpa pemilik** (`user_id=''`), dibuat via SQL (bukan seed file) — reseed/redeploy
  TIDAK membuat ulang. Bila reseed, buat ulang manual (agen 1522, 1553 & 1564 + wiring sub di 1511).
  Selalu resolve via slug (`getAgentBySlug`), jangan hardcode ID — ID bisa drift di prod.
- Spesifikasi platform iklan bisa berubah → verifikasi angka final di dashboard resmi tiap platform.
