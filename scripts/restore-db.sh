#!/usr/bin/env bash
# Restore Gustafta database from a backup dump.
#
# CARA PAKAI (di repl/akun BARU, setelah database kosong dibuat):
#   bash scripts/restore-db.sh
#   bash scripts/restore-db.sh backups/gustafta-db-backup-YYYYMMDD-HHMM.sql.gz
#
# Kalau file tidak disebut, skrip otomatis pakai file .sql.gz TERBARU di folder backups/.
# WAJIB: restore ke database KOSONG, sebelum aplikasi pernah dijalankan (npm run dev).

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL belum ada. Buat dulu database PostgreSQL di tab Database Replit, lalu ulangi."
  exit 1
fi

FILE="${1:-}"
if [ -z "$FILE" ]; then
  FILE="$(ls -t backups/*.sql.gz 2>/dev/null | head -n1 || true)"
fi

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "❌ File cadangan tidak ditemukan. Sebutkan path-nya, mis:"
  echo "   bash scripts/restore-db.sh backups/gustafta-db-backup-20260707-0023.sql.gz"
  exit 1
fi

echo "📦 Akan me-restore dari: $FILE"
echo "⚠️  Pastikan database ini KOSONG (belum pernah dijalankan npm run dev)."
echo "    Menunggu 3 detik... (Ctrl+C untuk batal)"
sleep 3

echo "⏳ Merestore... (bisa 1-2 menit)"
if [[ "$FILE" == *.gz ]]; then
  gunzip -c "$FILE" | psql "$DATABASE_URL"
else
  psql "$DATABASE_URL" -f "$FILE"
fi

echo "✅ Selesai! Semua chatbot, KB, prompt, sub-agen, dan akun sudah dipulihkan."
echo "   Sekarang jalankan: npm run dev"
