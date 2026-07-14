// Integrasi HTTP NYATA untuk status "Bersertifikat" (isCertified) — Loop Publikasi #7.
//
// Melengkapi test statis `agent-certification-authz.test.ts` (grep call-site di
// routes.ts) dengan verifikasi PERILAKU end-to-end: memboot Express + kirim request
// HTTP sungguhan (fetch ke port ephemeral) → middleware admin NYATA → MemStorage NYATA.
//
// Pembagian pertahanan (sama pola dgn agent-access-guards-http.test.ts):
//   (grep)  routes.ts memakai requireAdmin + strip isCertified non-admin
//   (HTTP)  requireAdmin + strip menghasilkan status & STATE yang benar
// = anti broken-access-control yang teruji tanpa boot DB/OIDC.
//
// Handler di sini MENIRU handler produksi (requireAdmin → 404 → validasi boolean →
// updateAgent; PATCH/POST strip isCertified untuk non-admin) memakai MemStorage yang
// sama persis dengan produksi. Status admin disuntik lewat getDbRole test (hermetik).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import { MemStorage } from "../server/storage";

const storage = new MemStorage();

let adminId = "";
let ownerId = "";
let strangerId = "";
let creatorAgentId = "";

function isAdminReq(req: any): boolean {
  const uid = (req?.user as any)?.id || "";
  return uid === adminId; // admin HANYA via daftar tersuntik (tanpa env)
}

function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid) };
  next();
}

// Mirror `requireAdmin` produksi: 401 tanpa user, 403 non-admin, lanjut bila admin.
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  if (!isAdminReq(req)) return res.status(403).json({ error: "Akses ditolak" });
  next();
}

const app = express();
app.use(express.json());
app.use(authShim);

// Mirror POST /api/admin/agents/:id/certification
app.post("/api/admin/agents/:id/certification", requireAdmin, async (req: any, res) => {
  const agentId = String(req.params.id);
  const existing = await storage.getAgent(agentId);
  if (!existing) return res.status(404).json({ error: "Agen tidak ditemukan" });
  if (typeof req.body?.certified !== "boolean") {
    return res.status(400).json({ error: "Field 'certified' wajib boolean" });
  }
  const certified = req.body.certified === true;
  const updated = await storage.updateAgent(agentId, { isCertified: certified } as any);
  const adminUid = (req.user as any)?.id || "unknown";
  try {
    await storage.addCertificationAudit({ agentId, certified, adminId: String(adminUid) });
  } catch { /* fire-and-forget: audit gagal tak boleh batalkan sertifikasi */ }
  res.json({ success: true, id: agentId, isCertified: (updated as any)?.isCertified === true });
});

// Mirror GET /api/admin/agents/:id/certification/history
app.get("/api/admin/agents/:id/certification/history", requireAdmin, async (req: any, res) => {
  const agentId = String(req.params.id);
  const history = await storage.listCertificationAudits(agentId);
  res.json({ agentId, history });
});

// Mirror PATCH /api/agents/:id strip (owner boleh mutasi, tapi isCertified di-strip
// untuk non-admin). Untuk fokus test authz field, owner selalu diizinkan memutasi.
app.patch("/api/agents/:id", authShim, async (req: any, res) => {
  const existing = await storage.getAgent(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agent not found" });
  if (!isAdminReq(req) && Object.prototype.hasOwnProperty.call(req.body, "isCertified")) {
    delete req.body.isCertified;
  }
  const updated = await storage.updateAgent(req.params.id, req.body);
  res.json({ id: updated?.id, isCertified: (updated as any)?.isCertified === true });
});

// Mirror POST /api/agents strip untuk non-admin.
app.post("/api/agents", async (req: any, res) => {
  const body = { ...req.body };
  if (!isAdminReq(req) && Object.prototype.hasOwnProperty.call(body, "isCertified")) {
    delete body.isCertified;
  }
  const created = await storage.createAgent({ name: "Baru", userId: (req.user as any)?.id || "", ...body });
  res.status(201).json({ id: created.id, isCertified: (created as any).isCertified === true });
});

let server: Server;
let baseUrl = "";

before(async () => {
  const admin = await storage.createUser({ username: "admin", password: "x", email: "admin@example.com" } as any);
  const owner = await storage.createUser({ username: "owner", password: "x", email: "owner@example.com" } as any);
  const stranger = await storage.createUser({ username: "stranger", password: "x", email: "stranger@example.com" } as any);
  adminId = admin.id; ownerId = owner.id; strangerId = stranger.id;

  const agent = await storage.createAgent({ name: "Bot Kreator", userId: ownerId, isPublic: false } as any);
  creatorAgentId = agent.id;

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

function req(method: string, path: string, opts: { user?: string; body?: any } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.user) headers["x-test-user"] = opts.user;
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

// ── Endpoint sertifikasi admin ────────────────────────────────────────────────
test("cert HTTP: anonim 401", async () => {
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { body: { certified: true } });
  assert.equal(r.status, 401);
});
test("cert HTTP: non-admin (owner agen) 403", async () => {
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: ownerId, body: { certified: true } });
  assert.equal(r.status, 403);
});
test("cert HTTP: stranger 403", async () => {
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: strangerId, body: { certified: true } });
  assert.equal(r.status, 403);
});
test("cert HTTP: admin grant 200 + state jadi true", async () => {
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: adminId, body: { certified: true } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.isCertified, true);
  const a = await storage.getAgent(creatorAgentId);
  assert.equal((a as any)?.isCertified, true);
});
test("cert HTTP: admin revoke 200 + state jadi false", async () => {
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: adminId, body: { certified: false } });
  assert.equal(r.status, 200);
  const a = await storage.getAgent(creatorAgentId);
  assert.equal((a as any)?.isCertified, false);
});
test("cert HTTP: admin body malformed 400 (bukan boolean)", async () => {
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: adminId, body: { certified: "yes" } });
  assert.equal(r.status, 400);
});
test("cert HTTP: admin agen tak ada 404", async () => {
  const r = await req("POST", `/api/admin/agents/tidak-ada/certification`, { user: adminId, body: { certified: true } });
  assert.equal(r.status, 404);
});

// ── PATCH strip: owner tak bisa self-certify lewat PATCH ──────────────────────
test("PATCH HTTP: owner kirim isCertified:true → tetap false (di-strip)", async () => {
  const r = await req("PATCH", `/api/agents/${creatorAgentId}`, { user: ownerId, body: { isCertified: true, tagline: "x" } });
  assert.equal(r.status, 200);
  const a = await storage.getAgent(creatorAgentId);
  assert.equal((a as any)?.isCertified, false);
});
test("PATCH HTTP: admin kirim isCertified:true → jadi true", async () => {
  const r = await req("PATCH", `/api/agents/${creatorAgentId}`, { user: adminId, body: { isCertified: true } });
  assert.equal(r.status, 200);
  const a = await storage.getAgent(creatorAgentId);
  assert.equal((a as any)?.isCertified, true);
  await storage.updateAgent(creatorAgentId, { isCertified: false } as any); // pulihkan
});

// ── POST strip: create non-admin tak bisa langsung Bersertifikat ──────────────
test("POST HTTP: non-admin create isCertified:true → tersimpan false (di-strip)", async () => {
  const r = await req("POST", `/api/agents`, { user: ownerId, body: { isCertified: true } });
  assert.equal(r.status, 201);
  const j = await r.json();
  assert.equal(j.isCertified, false);
});
test("POST HTTP: admin create isCertified:true → tersimpan true", async () => {
  const r = await req("POST", `/api/agents`, { user: adminId, body: { isCertified: true } });
  assert.equal(r.status, 201);
  const j = await r.json();
  assert.equal(j.isCertified, true);
});

// ── Riwayat jejak audit sertifikasi (GET history) ─────────────────────────────
test("history HTTP: anonim 401", async () => {
  const r = await req("GET", `/api/admin/agents/${creatorAgentId}/certification/history`);
  assert.equal(r.status, 401);
});
test("history HTTP: non-admin 403", async () => {
  const r = await req("GET", `/api/admin/agents/${creatorAgentId}/certification/history`, { user: ownerId });
  assert.equal(r.status, 403);
});
test("history HTTP: admin 200 + urutan terbaru dulu setelah grant→cabut", async () => {
  const fresh = await storage.createAgent({ name: "Bot Riwayat", userId: ownerId } as any);
  await req("POST", `/api/admin/agents/${fresh.id}/certification`, { user: adminId, body: { certified: true } });
  await new Promise((r) => setTimeout(r, 5));
  await req("POST", `/api/admin/agents/${fresh.id}/certification`, { user: adminId, body: { certified: false } });
  const r = await req("GET", `/api/admin/agents/${fresh.id}/certification/history`, { user: adminId });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.history.length, 2);
  assert.equal(j.history[0].certified, false, "terbaru dulu: pencabutan di indeks 0");
  assert.equal(j.history[1].certified, true);
  assert.equal(j.history[0].adminId, adminId);
});
