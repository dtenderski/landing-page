-- Add session_type column to legal_chat_sessions to distinguish Legal Opinion sessions from regular chats
ALTER TABLE "legal_chat_sessions"
  ADD COLUMN IF NOT EXISTS "session_type" text NOT NULL DEFAULT 'chat';
