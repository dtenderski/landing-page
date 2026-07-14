// Integrasi HTTP NYATA untuk guard akses agen (Task #2: "Confirm shared agents
// stay safe by testing real share + access requests").
//
// Berbeda dari test logika murni (agent-authz-decision / agent-collaboration-integration),
// test ini MEMBOOT Express + mengirim request HTTP sungguhan (global fetch ke port
// ephemeral) melewati middleware → guard NYATA (makeAgentAccessGuards) → MemStorage
// NYATA. Tujuannya membuktikan: status code (200/401/403), urutan middleware, dan
// pembacaan identitas sesi benar pada request sebenarnya — bukan hanya keputusan murni.
//
// Endpoint route asli (di server/routes.ts) tetap dijaga "memanggil guard yang benar"
// oleh tests/agent-authz-guard.test.ts (grep call-site). Gabungan keduanya:
//   (grep) endpoint X memanggil guard Y  +  (HTTP) guard Y menghasilkan status benar
// = pertahanan broken-access-control yang teruji end-to-end, tanpa boot DB/OIDC.
//
// Catatan: kita memakai SATU implementasi guard yang sama persis dengan produksi
// (diimpor dari server/lib/agent-access-guards.ts), jadi test ini TIDAK tautologis.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import { MemStorage } from "../server/storage";
import { makeAgentAccessGuards } from "../server/lib/agent-access-guards";

// ── Setup: MemStorage nyata + user owner/editor/viewer/stranger/admin ──────────
const storage = new MemStorage();

let ownerId = "";
let editorId = "";
let viewerId = "";
let strangerId = "";
let adminId = "";
let privateAgentId = "";
let publicAgentId = "";
let systemAgentId = "";

// Admin ditentukan lewat getDbRole tersuntik (bukan env), agar test hermetik.
const guards = makeAgentAccessGuards({
  getCollaboratorRole: (agentId, userId) => storage.getCollaboratorRole(agentId, userId),
  getDbRole: async (req: any) => {
    const uid = (req?.user as any)?.id || "";
    return uid === adminId ? "admin" : "";
  },
  adminUserIds: () => [], // jangan baca env; admin hanya via getDbRole di atas
});

// Auth shim: header x-test-user menetapkan req.user.id (jalur passport OIDC).
// Header x-test-email-user menetapkan req.session.emailUser.id TANPA req.user
// (jalur login-email; meniru route chat yang tak pakai middleware isAuthenticated).
// Tanpa header = anonim.
function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid) };
  const emailUid = req.headers["x-test-email-user"];
  if (emailUid) req.session = { emailUser: { id: String(emailUid) } };
  next();
}

async function loadAgent(req: any, res: any, next: any) {
  const agent = await storage.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  (req as any)._agent = agent;
  next();
}

const app = express();
app.use(authShim);

// Endpoint representatif yang memakai guard NYATA (mirror pola route asli):
// mutasi konfigurasi → assertCanMutateAgent
app.patch("/api/agents/:id/config", loadAgent, async (req: any, res) => {
  const auth = await guards.assertCanMutateAgent(req, req._agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json({ ok: true });
});
// aksi kepemilikan/destruktif → assertOwnerOrAdminAgent
app.delete("/api/agents/:id", loadAgent, async (req: any, res) => {
  const auth = await guards.assertOwnerOrAdminAgent(req, req._agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json({ ok: true });
});
// chat/baca riwayat → assertCanAccessAgentChat (penutup IDOR)
app.get("/api/agents/:id/messages", loadAgent, async (req: any, res) => {
  const auth = await guards.assertCanAccessAgentChat(req, req._agent);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  res.json({ messages: [] });
});

let server: Server;
let baseUrl = "";

before(async () => {
  // Seed user
  const owner = await storage.createUser({ username: "owner", password: "x", email: "owner@example.com" } as any);
  const editor = await storage.createUser({ username: "editor", password: "x", email: "editor@example.com", firstName: "Edi", lastName: "Tor" } as any);
  const viewer = await storage.createUser({ username: "viewer", password: "x", email: "viewer@example.com" } as any);
  const stranger = await storage.createUser({ username: "stranger", password: "x", email: "stranger@example.com" } as any);
  const admin = await storage.createUser({ username: "admin", password: "x", email: "admin@example.com" } as any);
  ownerId = owner.id; editorId = editor.id; viewerId = viewer.id; strangerId = stranger.id; adminId = admin.id;

  // Seed agen: privat milik owner, publik milik owner, sistem (tanpa owner)
  const priv = await storage.createAgent({ name: "Privat", userId: ownerId, isPublic: false } as any);
  const pub = await storage.createAgent({ name: "Publik", userId: ownerId, isPublic: true } as any);
  const sys = await storage.createAgent({ name: "Sistem", isPublic: false } as any);
  privateAgentId = priv.id; publicAgentId = pub.id; systemAgentId = sys.id;
  // Pastikan agen sistem benar-benar tanpa pemilik (seed lewat email-less path)
  (sys as any).userId = "";

  // Share: editor (editor role), viewer (viewer role)
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

function req(method: string, path: string, userId?: string) {
  const headers: Record<string, string> = {};
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}${path}`, { method, headers });
}

// Request sebagai user login-EMAIL (req.session.emailUser, TANPA req.user).
function reqEmail(method: string, path: string, userId: string) {
  return fetch(`${baseUrl}${path}`, { method, headers: { "x-test-email-user": userId } });
}

// ── MUTASI konfigurasi (PATCH /config → assertCanMutateAgent) ──────────────────
test("HTTP mutate: owner 200", async () => {
  const r = await req("PATCH", `/api/agents/${privateAgentId}/config`, ownerId);
  assert.equal(r.status, 200);
});
test("HTTP mutate: admin 200", async () => {
  const r = await req("PATCH", `/api/agents/${privateAgentId}/config`, adminId);
  assert.equal(r.status, 200);
});
test("HTTP mutate: editor kolaborator 200", async () => {
  const r = await req("PATCH", `/api/agents/${privateAgentId}/config`, editorId);
  assert.equal(r.status, 200);
});
test("HTTP mutate: viewer kolaborator 403 (read-only)", async () => {
  const r = await req("PATCH", `/api/agents/${privateAgentId}/config`, viewerId);
  assert.equal(r.status, 403);
});
test("HTTP mutate: stranger 403", async () => {
  const r = await req("PATCH", `/api/agents/${privateAgentId}/config`, strangerId);
  assert.equal(r.status, 403);
});
test("HTTP mutate: anonim 401", async () => {
  const r = await req("PATCH", `/api/agents/${privateAgentId}/config`);
  assert.equal(r.status, 401);
});
test("HTTP mutate: agen sistem (tanpa owner) non-admin 403", async () => {
  const r = await req("PATCH", `/api/agents/${systemAgentId}/config`, ownerId);
  assert.equal(r.status, 403);
});

// ── KEPEMILIKAN (DELETE → assertOwnerOrAdminAgent; Editor TIDAK boleh) ─────────
test("HTTP delete: owner 200", async () => {
  const r = await req("DELETE", `/api/agents/${privateAgentId}`, ownerId);
  assert.equal(r.status, 200);
});
test("HTTP delete: admin 200", async () => {
  const r = await req("DELETE", `/api/agents/${privateAgentId}`, adminId);
  assert.equal(r.status, 200);
});
test("HTTP delete: editor kolaborator 403 (bukan hak kepemilikan)", async () => {
  const r = await req("DELETE", `/api/agents/${privateAgentId}`, editorId);
  assert.equal(r.status, 403);
});
test("HTTP delete: viewer 403", async () => {
  const r = await req("DELETE", `/api/agents/${privateAgentId}`, viewerId);
  assert.equal(r.status, 403);
});
test("HTTP delete: anonim 401", async () => {
  const r = await req("DELETE", `/api/agents/${privateAgentId}`);
  assert.equal(r.status, 401);
});

// ── CHAT/BACA (GET messages → assertCanAccessAgentChat; penutup IDOR) ──────────
test("HTTP chat: agen publik boleh anonim 200", async () => {
  const r = await req("GET", `/api/agents/${publicAgentId}/messages`);
  assert.equal(r.status, 200);
});
test("HTTP chat: privat & anonim 401", async () => {
  const r = await req("GET", `/api/agents/${privateAgentId}/messages`);
  assert.equal(r.status, 401);
});
test("HTTP chat: privat & stranger 403 (IDOR ditutup)", async () => {
  const r = await req("GET", `/api/agents/${privateAgentId}/messages`, strangerId);
  assert.equal(r.status, 403);
});
test("HTTP chat: privat & viewer kolaborator boleh baca 200", async () => {
  const r = await req("GET", `/api/agents/${privateAgentId}/messages`, viewerId);
  assert.equal(r.status, 200);
});
test("HTTP chat: privat & editor kolaborator boleh baca 200", async () => {
  const r = await req("GET", `/api/agents/${privateAgentId}/messages`, editorId);
  assert.equal(r.status, 200);
});
test("HTTP chat: privat & owner 200", async () => {
  const r = await req("GET", `/api/agents/${privateAgentId}/messages`, ownerId);
  assert.equal(r.status, 200);
});
test("HTTP chat: privat & admin 200", async () => {
  const r = await req("GET", `/api/agents/${privateAgentId}/messages`, adminId);
  assert.equal(r.status, 200);
});
test("HTTP chat: agen sistem (tanpa owner) login non-admin boleh 200", async () => {
  const r = await req("GET", `/api/agents/${systemAgentId}/messages`, strangerId);
  assert.equal(r.status, 200);
});

// ── LOGIN-EMAIL (req.session.emailUser, TANPA req.user) — regresi "tidak bisa chat"
// Route chat tak pakai middleware isAuthenticated, jadi req.user tak terisi untuk
// user login-email; guard WAJIB tetap mengenalinya via session.emailUser.id.
test("HTTP chat email-session: agen sistem (tanpa owner) boleh 200 (bukan 401)", async () => {
  const r = await reqEmail("GET", `/api/agents/${systemAgentId}/messages`, strangerId);
  assert.equal(r.status, 200);
});
test("HTTP chat email-session: privat & owner 200", async () => {
  const r = await reqEmail("GET", `/api/agents/${privateAgentId}/messages`, ownerId);
  assert.equal(r.status, 200);
});
test("HTTP chat email-session: privat & stranger 403 (IDOR tetap ditutup)", async () => {
  const r = await reqEmail("GET", `/api/agents/${privateAgentId}/messages`, strangerId);
  assert.equal(r.status, 403);
});
test("HTTP chat email-session: privat & viewer kolaborator boleh baca 200", async () => {
  const r = await reqEmail("GET", `/api/agents/${privateAgentId}/messages`, viewerId);
  assert.equal(r.status, 200);
});

// ── Dinamika share: downgrade & revoke berdampak langsung pada request HTTP ────
test("HTTP dinamis: downgrade editor→viewer mencabut hak mutasi (200→403)", async () => {
  const before = await req("PATCH", `/api/agents/${privateAgentId}/config`, editorId);
  assert.equal(before.status, 200);
  await storage.addOrUpdateCollaborator({ agentId: privateAgentId, userId: editorId, role: "viewer", invitedBy: ownerId });
  const after = await req("PATCH", `/api/agents/${privateAgentId}/config`, editorId);
  assert.equal(after.status, 403);
  // pulihkan agar test lain konsisten bila urutan berubah
  await storage.addOrUpdateCollaborator({ agentId: privateAgentId, userId: editorId, role: "editor", invitedBy: ownerId });
});
test("HTTP dinamis: revoke kolaborator → kembali stranger (read 200→403)", async () => {
  const before = await req("GET", `/api/agents/${privateAgentId}/messages`, viewerId);
  assert.equal(before.status, 200);
  await storage.removeCollaborator(privateAgentId, viewerId);
  const after = await req("GET", `/api/agents/${privateAgentId}/messages`, viewerId);
  assert.equal(after.status, 403);
  await storage.addOrUpdateCollaborator({ agentId: privateAgentId, userId: viewerId, role: "viewer", invitedBy: ownerId });
});
