#!/bin/bash
set -e

echo "[startup] Pushing database schema..."
npm run db:push

echo "[startup] Schema ready. Starting server..."

set +e
while true; do
  echo "[runner] Starting server..."
  npm run start
  EXIT_CODE=$?
  echo "[runner] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
