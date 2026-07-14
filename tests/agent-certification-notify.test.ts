// Notifikasi kreator saat sertifikasi (Loop Publikasi #10).
//
// Saat admin memberi/mencabut status "Bersertifikat", pemilik-kreator agen harus
// mendapat notifikasi in-app. Agen resmi/seeded (userId="") TIDAK menghasilkan
// notifikasi (tak ada penerima). Notifikasi bersifat fire-and-forget: kegagalannya
// tak boleh membatalkan sertifikasi.
//
// Handler di sini MENIRU handler produksi (server/routes.ts POST /certification):
// requireAdmin → 404 → validasi boolean → updateAgent → audit → notifikasi kreator,
// memakai MemStorage yang sama persis dengan produksi.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import { MemStorage } from "../server/storage";
import { NOTIFICATION_TYPES } from "../shared/schema";

const storage = new MemStorage();

let adminId = "";
let ownerId = "";
let creatorAgentId = "";
let officialAgentId = "";

function isAdminReq(req: any): boolean {
  return ((req?.user as any)?.id || "") === adminId;
}
function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid) };
  next();
}
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  if (!isAdminReq(req)) return res.status(403).json({ error: "Akses ditolak" });
  next();
}

const app = express();
app.use(express.json());
app.use(authShim);

// Mirror POST /api/admin/agents/:id/certification (bagian notifikasi kreator).
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
  } catch { /* fire-and-forget */ }

  const ownerUserId = (existing as any).userId;
  if (ownerUserId && String(ownerUserId).trim() !== "") {
    const agentName = (updated as any)?.name ?? (existing as any).name ?? "Chatbot";
    try {
      await storage.createNotification({
        userId: String(ownerUserId),
        type: certified ? NOTIFICATION_TYPES.AGENT_CERTIFICATION_GRANTED : NOTIFICATION_TYPES.AGENT_CERTIFICATION_REVOKED,
        title: certified
          ? `Chatbot "${agentName}" kini Bersertifikat`
          : `Status Bersertifikat "${agentName}" dicabut`,
        message: certified
          ? `Admin menandai chatbot kamu sebagai "Bersertifikat" di Store.`
          : `Status "Bersertifikat" untuk chatbot kamu telah dicabut admin.`,
        link: "/dashboard",
        agentId: Number(agentId) || null,
      });
    } catch { /* fire-and-forget */ }
  }
  res.json({ success: true, id: agentId, isCertified: (updated as any)?.isCertified === true });
});

let server: Server;
let baseUrl = "";

before(async () => {
  const admin = await storage.createUser({ username: "admin", password: "x", email: "admin@example.com" } as any);
  const owner = await storage.createUser({ username: "owner", password: "x", email: "owner@example.com" } as any);
  adminId = admin.id; ownerId = owner.id;

  const creatorAgent = await storage.createAgent({ name: "Bot Kreator", userId: ownerId } as any);
  creatorAgentId = creatorAgent.id;
  const officialAgent = await storage.createAgent({ name: "Bot Resmi", userId: "" } as any);
  officialAgentId = officialAgent.id;

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

test("notify: grant agen kreator → 1 notifikasi in-app ke pemilik", async () => {
  const before = await storage.listNotificationsForUser(ownerId, 100);
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: adminId, body: { certified: true } });
  assert.equal(r.status, 200);
  const after = await storage.listNotificationsForUser(ownerId, 100);
  assert.equal(after.length, before.length + 1, "tepat 1 notifikasi baru");
  const n = after[0];
  assert.equal(n.type, NOTIFICATION_TYPES.AGENT_CERTIFICATION_GRANTED);
  assert.equal(n.userId, ownerId);
  assert.match(n.title, /Bersertifikat/);
});

test("notify: cabut agen kreator → notifikasi bernada 'dicabut'", async () => {
  const before = await storage.listNotificationsForUser(ownerId, 100);
  const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: adminId, body: { certified: false } });
  assert.equal(r.status, 200);
  const after = await storage.listNotificationsForUser(ownerId, 100);
  assert.equal(after.length, before.length + 1, "tepat 1 notifikasi baru");
  assert.equal(after[0].type, NOTIFICATION_TYPES.AGENT_CERTIFICATION_REVOKED);
  assert.match(after[0].title, /dicabut/i);
});

test("notify: agen resmi (userId kosong) → TIDAK ada notifikasi", async () => {
  const r = await req("POST", `/api/admin/agents/${officialAgentId}/certification`, { user: adminId, body: { certified: true } });
  assert.equal(r.status, 200);
  const forEmpty = await storage.listNotificationsForUser("", 100);
  assert.equal(forEmpty.length, 0, "tak ada penerima untuk agen resmi");
});

test("notify: createNotification error → sertifikasi TETAP 200 & state berubah", async () => {
  const orig = storage.createNotification.bind(storage);
  (storage as any).createNotification = async () => { throw new Error("boom notif"); };
  try {
    const r = await req("POST", `/api/admin/agents/${creatorAgentId}/certification`, { user: adminId, body: { certified: true } });
    assert.equal(r.status, 200, "kegagalan notifikasi TIDAK boleh membatalkan sertifikasi");
    const a = await storage.getAgent(creatorAgentId);
    assert.equal((a as any)?.isCertified, true, "state sertifikasi tetap tersimpan");
  } finally {
    (storage as any).createNotification = orig;
  }
});
