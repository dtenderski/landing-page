-- Remove unused slug column from store_products table
-- The slug-based API route was already removed; no code reads this column.
ALTER TABLE "store_products" DROP COLUMN IF EXISTS "slug";
