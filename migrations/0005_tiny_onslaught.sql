-- Trial Gate: add dialog_completed to users and trial_messages_used to subscriptions_new
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dialog_completed" boolean DEFAULT false;
ALTER TABLE "subscriptions_new" ADD COLUMN IF NOT EXISTS "trial_messages_used" integer DEFAULT 0;
