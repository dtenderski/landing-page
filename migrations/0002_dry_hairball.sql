-- LexCom Legal AI: legal chat, case search, regulation KB, and RAG tables
-- All statements use IF NOT EXISTS for safe replay on existing databases.
-- Note: mini_app_results.source column was added in 0001_mini_app_results_source.sql

-- Legal chat (originally tracked only in 0002_legal_chat_tables.sql outside journal)
CREATE TABLE IF NOT EXISTS "legal_chat_sessions" (
"id" serial PRIMARY KEY NOT NULL,
"user_id" varchar(255) NOT NULL,
"agent_type" text DEFAULT 'auto' NOT NULL,
"title" text DEFAULT 'New Chat' NOT NULL,
"message_count" integer DEFAULT 0 NOT NULL,
"created_at" timestamp DEFAULT now() NOT NULL,
"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legal_chat_messages" (
"id" serial PRIMARY KEY NOT NULL,
"session_id" integer NOT NULL,
"user_id" varchar(255) NOT NULL,
"role" text NOT NULL,
"content" text NOT NULL,
"agent_type" text DEFAULT 'auto' NOT NULL,
"agent_selected" text,
"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Case database for AGENT-YURISPRUDENSI semantic search and citation
CREATE TABLE IF NOT EXISTS "legal_cases" (
"id" serial PRIMARY KEY NOT NULL,
"case_number" text NOT NULL,
"court" text NOT NULL,
"year" integer,
"domain" text DEFAULT 'perdata' NOT NULL,
"parties" text DEFAULT '',
"legal_issue" text DEFAULT '',
"ratio_decidendi" text NOT NULL,
"conclusion" text DEFAULT '',
"keywords" text[] DEFAULT '{}',
"source_url" text DEFAULT '',
"embedding" jsonb DEFAULT '[]'::jsonb,
"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Regulation document knowledge bases (admin-uploadable)
CREATE TABLE IF NOT EXISTS "legal_knowledge_bases" (
"id" serial PRIMARY KEY NOT NULL,
"name" text NOT NULL,
"category" text DEFAULT 'regulasi' NOT NULL,
"source_authority" text DEFAULT '',
"source_url" text DEFAULT '',
"effective_date" text DEFAULT '',
"status" text DEFAULT 'active' NOT NULL,
"content_summary" text DEFAULT '',
"chunk_count" integer DEFAULT 0,
"created_at" timestamp DEFAULT now() NOT NULL,
"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Chunked regulation text with embeddings for RAG retrieval
CREATE TABLE IF NOT EXISTS "legal_knowledge_chunks" (
"id" serial PRIMARY KEY NOT NULL,
"legal_kb_id" integer NOT NULL,
"chunk_index" integer NOT NULL,
"content" text NOT NULL,
"token_count" integer DEFAULT 0,
"embedding" jsonb DEFAULT '[]'::jsonb,
"metadata" jsonb DEFAULT '{}'::jsonb,
"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Performance indexes
CREATE INDEX IF NOT EXISTS "legal_chat_sessions_user_id_idx" ON "legal_chat_sessions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_chat_messages_session_id_idx" ON "legal_chat_messages" ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_cases_domain_idx" ON "legal_cases" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_cases_case_number_idx" ON "legal_cases" ("case_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_kb_status_idx" ON "legal_knowledge_bases" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_chunks_kb_id_idx" ON "legal_knowledge_chunks" ("legal_kb_id");
