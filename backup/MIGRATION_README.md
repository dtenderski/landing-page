# Backup Migrasi Gustafta — Panduan Pindah Akun

Dibuat otomatis untuk pindah akun Replit. Bundel ini berisi **data**, bukan kode.
Kode aplikasi ikut pindah lewat **Fork/Transfer Repl** atau **Git** (lihat langkah 4).

## Isi bundel
1. `gustafta-db-*.sql` — **backup penuh database** (pg_dump, 86 tabel, skema + isi).
   Sudah pakai `--clean --if-exists --no-owner --no-privileges` supaya bisa
   di-restore ke database baru mana pun.
2. `uploads/` — file yang di-upload pengguna (gambar, video, PDF).

> Catatan: folder `attached_assets/` (± 884 MB) TIDAK dimasukkan karena besar dan
> merupakan bagian dari repo/kode — ikut pindah otomatis saat Fork/Transfer atau
> lewat Git. Kalau perlu terpisah, minta saya buatkan arsipnya sendiri.

---

## Langkah restore di AKUN BARU

### 1. Siapkan database PostgreSQL baru
Di Repl baru, buat database (menu Database / tool bawaan Replit). Ini otomatis
mengisi `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

### 2. Restore isi database
```bash
psql "$DATABASE_URL" < gustafta-db-YYYYMMDD-HHMM.sql
```
Atau, kalau repo sudah ada, cukup jalankan skema lalu import:
```bash
npm run db:push        # buat tabel dari schema
# lalu import data via scripts/db-import.ts kalau lebih suka format JSON
```
(Untuk migrasi penuh, `psql < file.sql` di atas paling lengkap.)

### 3. Kembalikan file upload
Salin isi folder `uploads/` ke lokasi yang sama di Repl baru (root project).

### 4. Pindahkan kode
Salah satu:
- **Fork / Transfer Repl** ke akun baru (paling mudah — kode + assets ikut), atau
- Push repo ke Git lalu clone di akun baru.

### 5. Isi ulang Secret & Environment Variable
Nilai secret **tidak bisa** ikut di-backup (demi keamanan). Tambahkan lagi
secara manual di akun baru. Berikut daftar NAMA-nya (nilainya ambil dari sumber
masing-masing / catatan pribadi Anda).

**A. Secret milik Anda — WAJIB diisi ulang manual:**
- OPENAI_API_KEY
- GEMINI_API_KEY
- DEEPSEEK_API_KEY
- QWEN_API_KEY
- NVIDIA_API_KEY
- OPENROUTER_API_KEY
- META_CAPI_ACCESS_TOKEN
- META_PIXEL_ID
- SCALEV_WEBHOOK_SECRET
- SESSION_SECRET  (boleh dibuat baru — string acak panjang)
- TENDER_INGEST_KEY

**B. Environment Variable (shared) — isi ulang manual:**
- BREVO_API_KEY
- BREVO_SENDER_EMAIL
- SCALEV_API_KEY
- SMTP_HOST
- SMTP_PORT
- ADMIN_EMAILS
- ADMIN_USER_IDS
- SUPERADMIN_EMAILS

**C. Otomatis dari Replit — JANGAN disalin manual** (terisi sendiri saat buat DB/Repl baru):
- DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
- REPLIT_DOMAINS, REPLIT_DEV_DOMAIN, REPL_ID

> Sebagian key (mis. OPENAI_API_KEY, GEMINI_API_KEY) mungkin terisi otomatis
> ketika Anda memasang kembali integrasi Replit yang sama di akun baru
> (OpenAI, Gemini, Database, Notion, Login with Replit).

### 6. Verifikasi
- Jalankan `npm run dev`, buka app, cek login & beberapa chatbot.
- Cek data penting (agents, langganan, testimoni) sudah ada.
- Publish ulang bila perlu.

---
Butuh bantuan lanjutan (mis. arsip `attached_assets`, atau format JSON via
`scripts/db-export.ts`)? Tinggal minta.
