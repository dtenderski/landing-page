// Jejak audit sertifikasi (Loop Publikasi #8) — bukti historis permanen.
//
// Memverifikasi bahwa MemStorage NYATA menyimpan riwayat grant/cabut "Bersertifikat"
// dan mengembalikannya terurut (terbaru dulu). Pelengkap:
//   (grep)  agent-certification-authz.test.ts — wiring route
//   (HTTP)  agent-certification-http.test.ts   — status + state isCertified
//   (audit) berkas ini                          — jejak historis tercatat benar
//
// Fokus: kontrak addCertificationAudit / listCertificationAudits (dipakai endpoint
// POST /certification & GET /certification/history), langsung di MemStorage.

import { test } from "node:test";
import assert from "node:assert/strict";
import { MemStorage } from "../server/storage";

test("audit: grant lalu cabut → 2 baris, terbaru dulu, isolasi per agen", async () => {
  const storage = new MemStorage();
  const owner = await storage.createUser({ username: "o", password: "x", email: "o@example.com" } as any);
  const a1 = await storage.createAgent({ name: "Bot A", userId: owner.id } as any);
  const a2 = await storage.createAgent({ name: "Bot B", userId: owner.id } as any);

  await storage.addCertificationAudit({ agentId: a1.id, certified: true, adminId: "admin-1" });
  await new Promise((r) => setTimeout(r, 5));
  await storage.addCertificationAudit({ agentId: a1.id, certified: false, adminId: "admin-2" });
  await storage.addCertificationAudit({ agentId: a2.id, certified: true, adminId: "admin-1" });

  const h1 = await storage.listCertificationAudits(a1.id);
  assert.equal(h1.length, 2, "agen A punya 2 catatan");
  assert.equal(h1[0].certified, false, "terbaru dulu: pencabutan di indeks 0");
  assert.equal(h1[0].adminId, "admin-2");
  assert.equal(h1[1].certified, true, "grant lebih lama di indeks 1");
  assert.equal(h1[1].adminId, "admin-1");

  const h2 = await storage.listCertificationAudits(a2.id);
  assert.equal(h2.length, 1, "isolasi: agen B hanya 1 catatan");
  assert.equal(h2[0].certified, true);
});

test("audit: agen tanpa riwayat → array kosong", async () => {
  const storage = new MemStorage();
  const h = await storage.listCertificationAudits("999");
  assert.deepEqual(h, []);
});

test("audit: setiap baris punya id unik & timestamp", async () => {
  const storage = new MemStorage();
  const owner = await storage.createUser({ username: "o", password: "x", email: "o@example.com" } as any);
  const a = await storage.createAgent({ name: "Bot", userId: owner.id } as any);

  const r1 = await storage.addCertificationAudit({ agentId: a.id, certified: true, adminId: "x" });
  const r2 = await storage.addCertificationAudit({ agentId: a.id, certified: false, adminId: "x" });
  assert.notEqual(r1.id, r2.id, "id tiap baris unik");
  assert.ok(r1.createdAt instanceof Date, "createdAt terisi");
  assert.equal(r1.certified, true);
  assert.equal(r2.certified, false);
});
