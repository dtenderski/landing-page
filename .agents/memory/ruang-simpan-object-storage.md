---
name: Ruang Simpan Object Storage Migration
description: File binary Ruang Simpan dipindah dari PostgreSQL bytea → Replit Object Storage. DB hanya simpan metadata + chunks RAG. Autoscale aktif.
---

## Apa yang Berubah

- **Sebelum (Phase 1)**: File bytes disimpan di `ruang_simpan_file_contents.content` (bytea PostgreSQL) — tidak scalable.
- **Sekarang (Phase 2)**: File bytes disimpan di Replit Object Storage via `@replit/object-storage`. DB hanya menyimpan `storage_key`.

## Key conventions

- Storage key format: `ruang-simpan/{userId}/{fileId}/{encodeURIComponent(filename)}`
- Wrapper: `server/lib/object-storage.ts` — fungsi: `uploadFile`, `downloadFile`, `deleteFile`, `fileExists`
- Kolom baru: `ruang_simpan_files.storage_key TEXT`
- Tabel `ruang_simpan_file_contents` tidak lagi menerima raw bytes — masih ada di schema untuk backward compat

## Flow baru

1. **Upload**: multer.memoryStorage → `uploadFile()` → storage_key disimpan di DB via UPDATE
2. **Download/Preview**: ambil `storage_key` dari DB → `downloadFile()` → stream ke client
3. **Delete**: DELETE dari DB (RETURNING storage_key) → `deleteFile()` fire-and-forget

## Deployment

- Target berubah dari `vm` → `autoscale` (dikonfigurasi via deployConfig)
- Scheduler sudah autoscale-ready (leader election via PostgreSQL di `system_config`)
- Rate limiter sudah autoscale-ready (PostgresRateLimitStore via PostgreSQL)
- Tidak perlu pisah scheduler — leader election sudah menangani multi-instance

**Why:** File bytes di PostgreSQL tidak scalable untuk penetrasi pasar. Object Storage + Autoscale = horizontal scaling siap lonjakan customer.
