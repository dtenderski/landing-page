-- Add source column to mini_app_results to distinguish owner vs public user submissions
-- This migration is idempotent and safe to run on existing databases.

ALTER TABLE "mini_app_results"
  ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'owner';

UPDATE "mini_app_results"
  SET "source" = 'owner'
  WHERE "source" IS NULL;
