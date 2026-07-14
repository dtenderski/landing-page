ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_channel" varchar DEFAULT 'wa';
