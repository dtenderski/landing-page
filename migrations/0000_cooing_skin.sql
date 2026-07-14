-- Add public_slug column to mini_apps for shareable public links
-- This migration is idempotent and safe to run on existing databases.

ALTER TABLE "mini_apps"
  ADD COLUMN IF NOT EXISTS "public_slug" text;

CREATE UNIQUE INDEX IF NOT EXISTS "mini_apps_public_slug_unique"
  ON "mini_apps" ("public_slug");
