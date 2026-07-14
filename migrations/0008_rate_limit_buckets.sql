CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
"bucket_key" varchar(255) PRIMARY KEY NOT NULL,
"count" integer DEFAULT 0 NOT NULL,
"reset_at" bigint NOT NULL
);
