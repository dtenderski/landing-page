-- LexCom Legal Chat: session and message tables
-- These tables were created via drizzle-kit push; this file documents the schema for reference.

CREATE TABLE IF NOT EXISTS "legal_chat_sessions" (
  "id" serial PRIMARY KEY,
  "user_id" varchar(255) NOT NULL,
  "agent_type" text NOT NULL DEFAULT 'auto',
  "title" text NOT NULL DEFAULT 'New Chat',
  "message_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "legal_chat_sessions_user_id_idx" ON "legal_chat_sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "legal_chat_messages" (
  "id" serial PRIMARY KEY,
  "session_id" integer NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "agent_type" text NOT NULL DEFAULT 'auto',
  "agent_selected" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "legal_chat_messages_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "legal_chat_sessions"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "legal_chat_messages_session_id_idx" ON "legal_chat_messages" ("session_id");
