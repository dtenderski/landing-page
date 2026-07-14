---
name: Conversation/voice API ownership scoping
description: The Replit chat/audio integration ships conversation routes with NO auth and NO user scoping — must be secured on every import.
---

# Conversation/voice API ownership scoping

The Replit integration scaffolding (`server/replit_integrations/audio/routes.ts` and `chat/routes.ts`) ships `/api/conversations*` and `/:id/messages` + `/:id/voice-stream` routes with **no `isAuthenticated` guard** and the `conversations` table has **no owner column** — meaning any caller can list/read/create/delete every user's conversations (IDOR / cross-user data exposure).

**Rule:** whenever these integration routes are present, add `userId` (notNull) to `conversations`, scope every storage method by `userId`, gate every route with `isAuthenticated`, resolve `userId` via `req.user?.claims?.sub || req.user?.id`, and verify ownership (404 when not owned) before touching messages.

**Why:** the architect review flagged this as the one severe blocker during the Replit migration; the scaffold is insecure by default.

**How to apply:** `getMessagesByConversation`/`createMessage` stay unscoped helpers — they are only safe because each route first calls `getConversation(id, userId)`. Any NEW route touching messages MUST do the same ownership check first, or scope the message query itself.
