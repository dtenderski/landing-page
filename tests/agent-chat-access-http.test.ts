// Integrasi HTTP NYATA untuk SURFACE CHAT agen (Task #6: "Make sure private
// chatbot conversations can't be opened by the wrong people").
//
// Berbeda dari tests/agent-access-guards-http.test.ts (yang memakai endpoint
// REPRESENTATIF /api/agents/:id/messages untuk menguji guard tingkat-fungsi),
// file ini MENIRU BENTUK ASLI endpoint chat di server/routes.ts — termasuk
// perilaku khusus yang TIDAK ada di guard murni:
//   • GET /api/messages/:agentId   → optionalAuth; publik+anonim balas 200 []
//                                     (riwayat pengunjung lain tak dibocorkan)
//   • .../session/:sessionId       → optionalAuth; murni guard
//   • .../export/json | .../csv    → isAuthenticated (anonim 401 dari middleware)
//   • POST /api/messages           → guard setelah fetch agen
//   • POST /api/messages/stream    → guard setelah fetch agen
//
// Semua memakai guard PRODUKSI (makeAgentAccessGuards) + MemStorage NYATA +
// shim auth (header x-test-user). Pasangannya, tests/agent-authz-guard.test.ts,
// memastikan route ASLI benar-benar MEMANGGIL assertCanAccessAgentChat. Gabungan
// keduanya = bukti anti-IDOR end-to-end pada surface chat, tanpa boot DB/OIDC.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import { MemStorage } from "../server/storage";
import { makeAgentAccessGuards } from "../server/lib/agent-access-guards";

const storage = new MemStorage();

let ownerId = "";
let editorId = "";
let viewerId = "";
let strangerId = "";
let adminId = "";
let privateAgentId = "";
let publicAgentId = "";
let systemAgentId = "";

// Admin via getDbRole tersuntik (hermetik, tak baca env).
const guards = makeAgentAccessGuards({
  getCollaboratorRole: (agentId, userId) => storage.getCollaboratorRole(agentId, userId),
  getDbRole: async (req: any) => {
    const uid = (req?.user as any)?.id || "";
    return uid === adminId ? "admin" : "";
  },
  adminUserIds: () => [],
});

// Shim auth: header x-test-user → req.user.id + req.isAuthenticated().
function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid) };
  req.isAuthenticated = () => Boolean(req.user);
  next();
}
// Mirror middleware isAuthenticated (dipakai endpoint export): anonim → 401.
function requireAuth(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const app = express();
app.use(express.json());
app.use(authShim);

// ── GET /api/messages/:agentId (optionalAuth) — mirror persis ──────────────────
app.get("/api/messages/:agentId", async (req: any, res) => {
  const agent = await storage.getAgent(req.params.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const isAuthed = req.isAuthenticated && req.isAuthenticated();
  if (agent.isPublic && !isAuthed) return res.json([]); // riwayat publik tak dibocorkan ke anonim
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json(await storage.getMessages(req.params.agentId));
});

// ── GET /api/messages/:agentId/session/:sessionId (optionalAuth) ───────────────
app.get("/api/messages/:agentId/session/:sessionId", async (req: any, res) => {
  const agent = await storage.getAgent(req.params.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json([]);
});

// ── GET /api/messages/:agentId/export/json (isAuthenticated) ───────────────────
app.get("/api/messages/:agentId/export/json", requireAuth, async (req: any, res) => {
  const agent = await storage.getAgent(req.params.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json({ messages: [] });
});

// ── GET /api/messages/:agentId/export/csv (isAuthenticated) ────────────────────
app.get("/api/messages/:agentId/export/csv", requireAuth, async (req: any, res) => {
  const agent = await storage.getAgent(req.params.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.send("Timestamp,Role,Content");
});

// ── POST /api/messages (kirim pesan) — guard setelah fetch agen ────────────────
app.post("/api/messages", async (req: any, res) => {
  const agent = await storage.getAgent(req.body?.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.status(201).json({ ok: true });
});

// ── POST /api/messages/stream (kirim pesan streaming) ──────────────────────────
app.post("/api/messages/stream", async (req: any, res) => {
  const agent = await storage.getAgent(req.body?.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json({ ok: true });
});

// ── HAPUS RIWAYAT: DELETE /api/messages/:agentId (isAuthenticated) ─────────────
app.delete("/api/messages/:agentId", requireAuth, async (req: any, res) => {
  const agent = await storage.getAgent(req.params.agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const auth = await guards.assertCanAccessAgentChat(req, agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.status(204).send();
});

let server: Server;
let baseUrl = "";

before(async () => {
  const owner = await storage.createUser({ username: "owner", password: "x", email: "owner@example.com" } as any);
  const editor = await storage.createUser({ username: "editor", password: "x", email: "editor@example.com" } as any);
  const viewer = await storage.createUser({ username: "viewer", password: "x", email: "viewer@example.com" } as any);
  const stranger = await storage.createUser({ username: "stranger", password: "x", email: "stranger@example.com" } as any);
  const admin = await storage.createUser({ username: "admin", password: "x", email: "admin@example.com" } as any);
  ownerId = owner.id; editorId = editor.id; viewerId = viewer.id; strangerId = stranger.id; adminId = admin.id;

  const priv = await storage.createAgent({ name: "Privat", userId: ownerId, isPublic: false } as any);
  const pub = await storage.createAgent({ name: "Publik", userId: ownerId, isPublic: true } as any);
  const sys = await storage.createAgent({ name: "Sistem", isPublic: false } as any);
  privateAgentId = priv.id; publicAgentId = pub.id; systemAgentId = sys.id;
  (sys as any).userId = ""; // benar-benar tanpa pemilik (agen sistem bersama)

  await storage.addOrUpdateCollaborator({ agentId: privateAgentId, userId: editorId, role: "editor", invitedBy: ownerId });
  await storage.addOrUpdateCollaborator({ agentId: privateAgentId, userId: viewerId, role: "viewer", invitedBy: ownerId });

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function req(method: string, path: string, userId?: string, body?: any) {
  const headers: Record<string, string> = {};
  if (userId) headers["x-test-user"] = userId;
  if (body) headers["content-type"] = "application/json";
  return fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

// ── Matrix BACA RIWAYAT: GET /api/messages/:agentId (agen PRIVAT) ──────────────
test("chat read: privat & owner → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, ownerId)).status, 200);
});
test("chat read: privat & admin → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, adminId)).status, 200);
});
test("chat read: privat & editor kolaborator → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, editorId)).status, 200);
});
test("chat read: privat & viewer kolaborator → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, viewerId)).status, 200);
});
test("chat read: privat & orang asing → 403 (IDOR ditutup)", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, strangerId)).status, 403);
});
test("chat read: privat & anonim → 401", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`)).status, 401);
});

// ── Agen PUBLIK & SISTEM: tetap dapat diakses sesuai desain ───────────────────
test("chat read: publik & anonim → 200 (balas [] riwayat tak dibocorkan)", async () => {
  const r = await req("GET", `/api/messages/${publicAgentId}`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), []);
});
test("chat read: publik & login → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${publicAgentId}`, strangerId)).status, 200);
});
test("chat read: agen sistem (tanpa owner) & login non-admin → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${systemAgentId}`, strangerId)).status, 200);
});

// ── Riwayat per-SESI: GET .../session/:sessionId (agen PRIVAT) ─────────────────
test("session read: privat & owner → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/session/abc`, ownerId)).status, 200);
});
test("session read: privat & admin → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/session/abc`, adminId)).status, 200);
});
test("session read: privat & editor → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/session/abc`, editorId)).status, 200);
});
test("session read: privat & viewer → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/session/abc`, viewerId)).status, 200);
});
test("session read: privat & orang asing → 403", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/session/abc`, strangerId)).status, 403);
});
test("session read: privat & anonim → 401", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/session/abc`)).status, 401);
});

// ── EXPORT (isAuthenticated): anonim 401 via middleware, IDOR via guard ────────
test("export json: privat & owner → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/json`, ownerId)).status, 200);
});
test("export json: privat & admin → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/json`, adminId)).status, 200);
});
test("export json: privat & editor → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/json`, editorId)).status, 200);
});
test("export json: privat & viewer → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/json`, viewerId)).status, 200);
});
test("export json: privat & orang asing → 403", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/json`, strangerId)).status, 403);
});
test("export json: privat & anonim → 401 (isAuthenticated)", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/json`)).status, 401);
});
test("export csv: privat & viewer → 200", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/csv`, viewerId)).status, 200);
});
test("export csv: privat & orang asing → 403", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}/export/csv`, strangerId)).status, 403);
});

// ── KIRIM PESAN: POST /api/messages (agen PRIVAT) ─────────────────────────────
test("send msg: privat & editor → 201", async () => {
  assert.equal((await req("POST", `/api/messages`, editorId, { agentId: privateAgentId, content: "hai" })).status, 201);
});
test("send msg: privat & viewer → 201 (viewer boleh chat/baca)", async () => {
  assert.equal((await req("POST", `/api/messages`, viewerId, { agentId: privateAgentId, content: "hai" })).status, 201);
});
test("send msg: privat & orang asing → 403", async () => {
  assert.equal((await req("POST", `/api/messages`, strangerId, { agentId: privateAgentId, content: "hai" })).status, 403);
});
test("send msg: privat & anonim → 401", async () => {
  assert.equal((await req("POST", `/api/messages`, undefined, { agentId: privateAgentId, content: "hai" })).status, 401);
});
test("send msg: publik & anonim → 201 (chat publik terbuka)", async () => {
  assert.equal((await req("POST", `/api/messages`, undefined, { agentId: publicAgentId, content: "hai" })).status, 201);
});

// ── KIRIM PESAN STREAM: POST /api/messages/stream ─────────────────────────────
test("stream msg: privat & owner → 200", async () => {
  assert.equal((await req("POST", `/api/messages/stream`, ownerId, { agentId: privateAgentId, content: "hai" })).status, 200);
});
test("stream msg: privat & admin → 200", async () => {
  assert.equal((await req("POST", `/api/messages/stream`, adminId, { agentId: privateAgentId, content: "hai" })).status, 200);
});
test("stream msg: privat & editor → 200", async () => {
  assert.equal((await req("POST", `/api/messages/stream`, editorId, { agentId: privateAgentId, content: "hai" })).status, 200);
});
test("stream msg: privat & viewer → 200", async () => {
  assert.equal((await req("POST", `/api/messages/stream`, viewerId, { agentId: privateAgentId, content: "hai" })).status, 200);
});
test("stream msg: privat & orang asing → 403", async () => {
  assert.equal((await req("POST", `/api/messages/stream`, strangerId, { agentId: privateAgentId, content: "hai" })).status, 403);
});
test("stream msg: privat & anonim → 401", async () => {
  assert.equal((await req("POST", `/api/messages/stream`, undefined, { agentId: privateAgentId, content: "hai" })).status, 401);
});

// ── HAPUS RIWAYAT: DELETE /api/messages/:agentId (agen PRIVAT) ─────────────────
// Sebelumnya hanya isAuthenticated → siapa pun login bisa hapus riwayat agen
// privat orang lain (IDOR). Kini wajib owner/admin/kolaborator.
test("clear history: privat & owner → 204", async () => {
  assert.equal((await req("DELETE", `/api/messages/${privateAgentId}`, ownerId)).status, 204);
});
test("clear history: privat & admin → 204", async () => {
  assert.equal((await req("DELETE", `/api/messages/${privateAgentId}`, adminId)).status, 204);
});
test("clear history: privat & editor kolaborator → 204", async () => {
  assert.equal((await req("DELETE", `/api/messages/${privateAgentId}`, editorId)).status, 204);
});
test("clear history: privat & viewer kolaborator → 204", async () => {
  assert.equal((await req("DELETE", `/api/messages/${privateAgentId}`, viewerId)).status, 204);
});
test("clear history: privat & orang asing → 403 (IDOR ditutup)", async () => {
  assert.equal((await req("DELETE", `/api/messages/${privateAgentId}`, strangerId)).status, 403);
});
test("clear history: privat & anonim → 401 (isAuthenticated)", async () => {
  assert.equal((await req("DELETE", `/api/messages/${privateAgentId}`)).status, 401);
});
test("clear history: publik & login → 204 (chat publik terbuka)", async () => {
  assert.equal((await req("DELETE", `/api/messages/${publicAgentId}`, strangerId)).status, 204);
});

// ── Dinamika: revoke kolaborator langsung menutup akses chat (200 → 403) ───────
test("dinamis: revoke viewer → chat read 200 lalu 403", async () => {
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, viewerId)).status, 200);
  await storage.removeCollaborator(privateAgentId, viewerId);
  assert.equal((await req("GET", `/api/messages/${privateAgentId}`, viewerId)).status, 403);
  await storage.addOrUpdateCollaborator({ agentId: privateAgentId, userId: viewerId, role: "viewer", invitedBy: ownerId });
});
