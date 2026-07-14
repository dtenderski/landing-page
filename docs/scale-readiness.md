# Kesiapan Skala — 1000 Peserta Serempak (Indobuildtech 2026)

Dokumen ini merangkum pengerasan (hardening) agar Gustafta tahan lonjakan ~1000
peserta yang mendaftar/mencoba serempak saat soft-launch acara, plus cara
menyalakan "Mode Acara" dan menguji beban.

## 1. Mode Acara (Event Mode)

Rate limiter (`server/lib/rate-limiter.ts`) punya dua profil batas: normal dan
acara. Aktifkan Mode Acara saat hari-H agar peserta tidak cepat kena limit.

**Cara nyalakan (pilih salah satu):**
- Set env `EVENT_MODE=on` (atau `1`/`true`), atau
- Set jendela waktu otomatis: `EVENT_MODE_START` dan `EVENT_MODE_END` (ISO
  timestamp, mis. `2026-07-15T00:00:00+07:00`). Mode aktif hanya dalam rentang itu.

**Batas yang berlaku (per menit, bisa di-override via env):**

| Env                  | Normal | Acara | Keterangan                          |
|----------------------|--------|-------|-------------------------------------|
| `CHAT_LIMIT_AUTH`    | 120    | 240   | user login (kunci per-AKUN)         |
| `CHAT_LIMIT_ANON`    | 30     | 60    | anonim (kunci per-IP)               |

> **Penting — WiFi venue:** user login dibatasi **per-akun**, bukan per-IP. Di
> venue acara ratusan peserta berbagi satu IP WiFi; keying per-IP akan membuat
> mereka saling mengunci. Anonim tetap per-IP (belum punya identitas).

Admin dikecualikan dari limit.

## 2. Koneksi Database (connection pool)

Semua koneksi kini lewat **satu pool** (`server/db.ts`) — sebelumnya ada pool
ganda (app + session store) yang menggandakan pemakaian koneksi.

- `DB_POOL_MAX` (default `12`) — maksimum koneksi per instance. Naikkan hati-hati;
  batas Postgres = jumlah_instance × DB_POOL_MAX harus di bawah kuota provider.
- `DATABASE_URL_POOLED` (opsional) — bila provider menyediakan endpoint pooler
  (mis. PgBouncer/Neon pooler), set ini agar koneksi lewat pooler eksternal.
- Session store (`connect-pg-simple`) **memakai ulang** pool aplikasi (opsi
  `pool`), bukan membuka koneksi sendiri.

## 3. Perlindungan Beban Dialog (jalur kritis acara)

Endpoint publik `/api/dialog-gustafta*` (chat + 3 gerbang JSON: profil, gambaran,
blueprint) adalah jalur yang paling ditekan peserta. Dilindungi oleh
`server/lib/dialog-load-guard.ts`:

1. **Gerbang konkurensi (p-limit):** batasi panggilan LLM serempak
   (`DIALOG_MAX_CONCURRENCY`, default 12) + antrean terbatas (`DIALOG_MAX_QUEUE`,
   default 40). Bila penuh → tolak CEPAT dengan **HTTP 503 + pesan ramah** dan
   header `Retry-After`, alih-alih menumpuk request sampai time out beruntun.
2. **Fallback lintas-provider:** OpenAI (model cepat/hemat) → DeepSeek → Qwen →
   OpenRouter → Nvidia → Gemini, mengikuti kunci API yang tersedia. Satu provider
   down/limit tidak mematikan seluruh dialog.
3. **Model hemat:** default `DIALOG_MODEL=gpt-4o-mini` (bisa di-override), agar
   dialog acara murah & cepat tanpa mengubah agen produksi.

## 4. Pemilihan Leader untuk Scheduler (multi-instance)

Saat di-deploy Autoscale, bisa jalan **beberapa instance** serempak. Tanpa
koordinasi, tiap instance akan menjalankan job harian (scrape tender, alert WA,
backup DB, research sweep, broadcast) → kirim WA/email ganda + beban LLM berlipat.

`server/lib/scheduler-leader.ts` memastikan **hanya satu instance (leader)** yang
menjalankan job pada satu waktu:
- Satu baris `system_config` (key `scheduler_leader`) menyimpan instanceId +
  heartbeat. Klaim/renew **atomik** lewat satu `INSERT ... ON CONFLICT ... WHERE`.
- Leader mem-perpanjang tiap 30 detik; TTL 90 detik. Bila leader mati, instance
  lain otomatis mengambil alih setelah TTL lewat.
- Semua job (`scheduleAtWIB` + broadcast checker) hanya jalan bila
  `isSchedulerLeader()` true; kalau bukan leader, job di-skip diam-diam.

## 5. Uji Beban

Skrip tanpa dependensi: `scripts/load-test.mjs` (Node 18+). Melaporkan
throughput, tingkat error, dan persentil latensi (p50/p90/p95/p99).

```bash
# Health check ringan
node scripts/load-test.mjs --url "$REPLIT_DEV_DOMAIN/health" -n 500 -c 50

# Endpoint GET publik yang murah
node scripts/load-test.mjs --url "$REPLIT_DEV_DOMAIN/api/store/agents" -n 1000 -c 100
```

> **JANGAN** arahkan uji beban ke endpoint LLM (`/api/dialog-gustafta*`,
> `/api/chat/*`) — mahal dan rate-limited. Uji jalur murah (health, aset publik,
> daftar store) untuk memvalidasi HTTP/DB/pool. Perlindungan LLM sudah diuji lewat
> gerbang konkurensi (poin 3).

**Baseline dev (health, 300 req @ 40 konkurensi):** ~500 req/s, 0% error,
p95 ≈ 194ms. Produksi (Autoscale) akan menskalakan instance sesuai beban.

### 5a. Dry-run PRODUKSI (Autoscale, domain published) — 07 Jul 2026

Dijalankan ke domain `.replit.app` (build sukses, Autoscale, TLS, cold start
nyata) memakai jalur GET murah pada konkurensi realistis. Semua **0% error**.

| Jalur (GET)                    | Beban       | Throughput | p50    | p95    | p99    | Error |
|--------------------------------|-------------|------------|--------|--------|--------|-------|
| `/health` (warm-up cold start) | 20 @ 5      | 25 req/s   | 86ms   | 455ms  | 523ms  | 0%    |
| `/health`                      | 500 @ 50    | 381 req/s  | 90ms   | 322ms  | 334ms  | 0%    |
| `/api/testimonials/featured`   | 300 @ 40    | 248 req/s  | 112ms  | 351ms  | 380ms  | 0%    |
| `/indobuildtech` (SPA HTML)    | 300 @ 40    | 232 req/s  | 112ms  | 346ms  | 357ms  | 0%    |
| `/api/store/catalog`           | 300 @ 40    | 28 req/s   | 1672ms | 2467ms | 2621ms | 0%    |

**Kesimpulan:**
- **Jalur kritis acara** (health, testimoni unggulan halaman event, HTML landing
  `/indobuildtech`) **SEHAT**: p95 ≈ 320–350ms, 0% error @ konkurensi 40–50.
  Cold start hanya menambah ±450ms sekali di awal (warm-up), lalu stabil.
- **`/api/store/catalog` lambat** (p95 ≈ 2,5 s) tetapi **0% error / tanpa
  timeout** — ini biaya query katalog (banyak agen di-join), BUKAN kehabisan
  koneksi pool. Katalog Store **tidak berada di jalur peserta acara** (peserta
  masuk lewat `/indobuildtech` → `/bonus-indobuildtech` → dialog → blueprint),
  jadi tidak memblokir kesiapan hari-H. Optimasi query katalog dicatat sebagai
  perbaikan lanjutan, bukan blocker acara.

**Tuning pool/instance:** TIDAK ada perubahan yang diperlukan. Tanpa error koneksi
maupun timeout pada seluruh uji (termasuk 500 @ 50 pada health), `DB_POOL_MAX=12`
default sudah memadai; Autoscale menambah instance sesuai beban. Menaikkan pool
tanpa bukti saturasi justru berisiko melampaui kuota koneksi Postgres
(instance × DB_POOL_MAX).

## 6. Checklist hari-H

- [ ] Set `EVENT_MODE=on` (atau jendela `EVENT_MODE_START`/`END`).
- [ ] Pastikan kunci LLM fallback terisi (minimal OpenAI + 1 cadangan).
- [ ] Verifikasi `DB_POOL_MAX` × perkiraan instance < kuota koneksi Postgres.
- [x] Jalankan `load-test.mjs` ke domain published (jalur murah) sebelum acara. **Selesai 07 Jul 2026 — hasil di §5a; jalur kritis 0% error, p95 ≈ 350ms.**
- [ ] Konfirmasi hanya satu leader scheduler di log (`[SchedulerLeader] … menjadi LEADER`).
- [ ] Setelah acara: `EVENT_MODE=off` (atau biarkan jendela lewat).
