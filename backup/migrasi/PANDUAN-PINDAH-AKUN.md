# Panduan Pindah Gustafta ke Akun Replit Lain

Tanggal paket: 7 Juli 2026

## Isi Paket Ini
1. `gustafta-dev-dump-20260707.sql` — backup LENGKAP database development (skema + semua data: users, agents, langganan, pesan, knowledge base, dll). Ukuran asli ±12,7 MB, PostgreSQL 16.
2. `gustafta-prod-snapshot-20260707.json` — catatan status database produksi per 7 Juli 2026 (lihat Langkah 4 kenapa produksi TIDAK perlu direstore manual).
3. `PANDUAN-PINDAH-AKUN.md` — dokumen ini.

> PENTING: file backup ini berisi data pengguna. Simpan baik-baik, jangan dibagikan ke pihak lain.

---

## Langkah 1 — Salin Kode ke Akun Baru
Backup database TIDAK berisi kode aplikasi. Pilih salah satu cara:

**Cara A (paling mudah): Fork/Remix**
1. Dari akun lama, buka Repl Gustafta → menu titik tiga → **Share** → jadikan bisa diakses akun baru (atau set sementara jadi public).
2. Login di akun baru → buka link Repl tersebut → klik **Fork/Remix**. Seluruh kode tersalin.
3. Setelah selesai, kembalikan Repl lama jadi private.

**Cara B: Lewat GitHub**
1. Di akun lama: hubungkan Repl ke GitHub dan push seluruh kode.
2. Di akun baru: **Create Repl → Import from GitHub**.

> Catatan: Fork TIDAK menyalin secrets dan TIDAK menyalin isi database — itulah gunanya langkah 2 dan 5.

---

## Langkah 2 — Buat Database Baru & Restore
1. Di Repl baru, buka tab **Database** (atau minta Agent: "buatkan database PostgreSQL").
   Setelah dibuat, variabel `DATABASE_URL` otomatis tersedia.
2. Upload file `gustafta-dev-dump-20260707.sql` ke Repl baru (drag & drop ke file tree, misal ke folder `backup/`).
3. Buka **Shell** di Repl baru, jalankan:
   ```bash
   psql "$DATABASE_URL" -f backup/gustafta-dev-dump-20260707.sql
   ```
4. Cek hasilnya:
   ```bash
   psql "$DATABASE_URL" -tAc "select count(*) from agents;"
   psql "$DATABASE_URL" -tAc "select count(*) from users;"
   ```
   Angka `agents` harus ±1400-an dan `users` sesuai jumlah pengguna Anda.

**Kalau ada error "already exists":** database baru mungkin sudah terisi tabel (misal server sempat jalan duluan). Solusi paling bersih: jangan jalankan aplikasi dulu sebelum restore; atau minta Agent di akun baru mengosongkan database lalu restore ulang.

**Versi PostgreSQL:** dump dibuat dari PostgreSQL 16. Database Replit baru umumnya versi 16 juga — aman.

---

## Langkah 3 — Data Pengguna Tetap Dikenali
Login memakai **akun Replit masing-masing pengguna** (bukan password yang disimpan aplikasi). Setelah restore, pengguna lama login seperti biasa dan langsung dikenali sebagai orang yang sama (ID Replit mereka tidak berubah walau aplikasi pindah akun).

Yang perlu Anda cek: variabel `ADMIN_USER_IDS` (daftar ID admin). Kalau akun admin Anda ikut ganti, isi dengan ID Replit akun baru Anda. Cara tahu ID: login di aplikasi baru, lalu minta Agent mengecek ID Anda di tabel `users`.

---

## Langkah 4 — Database Produksi: TIDAK Perlu Restore Manual
Berdasarkan snapshot 7 Juli 2026 (`gustafta-prod-snapshot-20260707.json`):
- Produksi **belum punya data pengguna sama sekali** (users, langganan, order, testimoni = 0 baris).
- Isinya hanya 1.405 agent hasil seed otomatis + 2 pesan uji.

Artinya, di akun baru Anda cukup:
1. Klik **Publish/Deploy**. Replit otomatis membuat database produksi baru dan menerapkan skema.
2. Saat server produksi pertama kali menyala, ±1.405 agent akan di-seed otomatis oleh aplikasi.

Tidak ada data produksi yang hilang karena memang belum ada. (Kalau nanti sebelum pindah produksi sudah terlanjur punya data pengguna, minta Agent membuat dump produksi terbaru dulu sebelum pindah.)

---

## Langkah 5 — Isi Ulang Secrets & Environment Variables
Secrets TIDAK ikut tersalin saat fork — harus diisi manual di tab **Secrets** Repl baru. Nilainya bisa Anda lihat di tab Secrets Repl lama (selagi masih ada aksesnya), lalu salin satu per satu.

### Wajib (aplikasi inti tidak jalan penuh tanpa ini)
| Nama | Untuk apa |
|---|---|
| `OPENAI_API_KEY` | Otak utama semua chatbot (atau aktifkan integrasi OpenAI Replit, lihat Langkah 6) |
| `ADMIN_USER_IDS` | Daftar ID Replit yang jadi admin (pisahkan koma). Ganti bila akun admin berubah |
| `ADMIN_EMAILS`, `SUPERADMIN_EMAILS` | Email admin/superadmin |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` | Kirim email (verifikasi, notifikasi, tender alert, backup) |
| `SESSION_SECRET` | Kunci sesi login (otomatis dibuat saat integrasi Login Replit diaktifkan) |

### Pembayaran & event (wajib bila fiturnya dipakai)
| Nama | Untuk apa |
|---|---|
| `SCALEV_API_KEY`, `SCALEV_WEBHOOK_SECRET` | Pembayaran Scalev.id (webhook pesanan). Jangan lupa update URL webhook di dashboard Scalev ke domain baru! |
| `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | Pelacakan iklan Meta (Conversions API) |
| `TENDER_INGEST_KEY` | Kunci relay data tender SIRUP (update juga di server relay eksternal Anda) |

### Model AI cadangan (opsional tapi disarankan — fallback saat OpenAI gangguan)
`DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `QWEN_API_KEY`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`

### Opsional lain (isi hanya bila dipakai)
`SMTP_HOST`, `SMTP_PORT`, `LEGAL_ADMIN_KEY` (upload KB LexCom), `BOOTSTRAP_ADMIN_TOKEN`, `FONNTE_API_TOKEN` (WhatsApp), `BPS_API_KEY`, `MAYAR_API_KEY`, `MAYAR_WEBHOOK_SECRET`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` (legacy), `PROD_URL`, `EVENT_MODE`, `EVENT_MODE_START`, `EVENT_MODE_END`, `BACKUP_RECIPIENT_EMAIL`, `BREVO_WEBHOOK_SECRET`, `SCALEV_SIGNING_SECRET`, `SCALEV_SIGNATURE_STRICT`

### Otomatis — JANGAN diisi manual
`DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (dibuat saat database dibuat), `REPL_ID`, `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN`, `PORT`, `NODE_ENV` (dikelola Replit).

---

## Langkah 6 — Aktifkan Ulang Integrasi Replit
Integrasi terpasang per-Repl, jadi di Repl baru minta Agent mengaktifkan ulang:
1. **Login Replit** (Replit Auth) — untuk sistem login.
2. **OpenAI AI Integrations** — bila Anda pakai jalur integrasi (tanpa API key sendiri).
3. **Gemini AI Integrations** — idem.
4. **Database PostgreSQL** — sudah dari Langkah 2.
5. **Notion** — bila masih dipakai.

Cukup bilang ke Agent di Repl baru: *"aktifkan integrasi Login Replit, OpenAI, dan Gemini"*.

---

## Langkah 7 — Publish Ulang & Domain
1. Klik **Publish/Deploy** dari akun baru (deployment lama di akun lama tidak ikut pindah).
2. Isi secrets produksi bila diminta (umumnya sama dengan Langkah 5).
3. **Domain khusus** (bila ada): lepaskan dari deployment lama, lalu tambahkan di deployment baru dan update DNS sesuai instruksi Replit.
4. **Matikan/hapus deployment lama** supaya tidak tagihan dobel dan tidak ada dua versi aplikasi hidup.
5. Update URL webhook pihak ketiga ke domain baru: **Scalev** (webhook pembayaran), server **relay tender**, dan link apa pun yang Anda sebar (widget chatbot yang ditanam di situs lain memakai domain — perlu diganti bila domainnya berubah).

---

## Langkah 8 — Checklist Verifikasi Setelah Pindah
- [ ] Buka aplikasi → halaman depan tampil normal
- [ ] Login dengan akun Replit → berhasil, nama dikenali
- [ ] Akun admin bisa buka halaman `/admin` (cek `ADMIN_USER_IDS`)
- [ ] Chat dengan salah satu agen (misal dari Store) → AI menjawab
- [ ] Buat chatbot baru lewat Blueprint Builder → tersimpan
- [ ] Store tampil dengan ±1.400 produk
- [ ] Kirim email uji (misal minta verifikasi email) → email masuk
- [ ] Setelah publish: ulangi cek di atas pada URL produksi
- [ ] Webhook Scalev diarahkan ke domain baru & transaksi uji berhasil dicatat

Kalau ada yang macet, minta Agent di Repl baru: *"cek log dan perbaiki"* — sebutkan langkah mana yang gagal.

---

*Dokumen ini dibuat otomatis. Tidak ada nilai secret/kunci apa pun di dalam paket ini — hanya nama variabelnya.*
