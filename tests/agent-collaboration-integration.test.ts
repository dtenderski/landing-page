import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";
import { randomUUID } from "crypto";

import { MemStorage } from "../server/storage";
import { decideAgentMutation, decideAgentReadAccess } from "../server/lib/agent-authz";

// ============================================================================
// BAGIAN A — Integrasi storage + keputusan otorisasi (MemStorage, cepat & murni)
// ============================================================================
// Integrasi NYATA (storage + keputusan otorisasi) untuk fitur berbagi agen.
//
// Berbeda dari tes statis (grep source) di agent-authz-guard.test.ts, tes ini
// menjalankan alur sesungguhnya: owner BERBAGI agen ke user lain via storage
// (getUserByEmail → addOrUpdateCollaborator), lalu untuk setiap upaya akses kita
// meniru PERSIS yang dilakukan route guard: lookup peran kolaborator dari storage
// → serahkan ke decideAgentMutation / decideAgentReadAccess. Ini membuktikan
// perilaku end-to-end, bukan sekadar keberadaan kode.

const ADMINS = new Set<string>(); // tidak ada admin di skenario dasar

// Tiru route guard mutasi: hitung peran kolaborator dari storage lalu putuskan.
async function canMutate(storage: MemStorage, agentId: string, agentOwnerId: string, userId: string) {
  const collaboratorRole = userId ? await storage.getCollaboratorRole(agentId, userId) : null;
  return decideAgentMutation({ userId, isAdmin: ADMINS.has(userId), agentOwnerId, collaboratorRole });
}

async function canRead(storage: MemStorage, agentId: string, agentOwnerId: string, userId: string) {
  const collaboratorRole = userId ? await storage.getCollaboratorRole(agentId, userId) : null;
  return decideAgentReadAccess({ userId, isAdmin: ADMINS.has(userId), agentOwnerId, collaboratorRole });
}

// Bangun dunia: owner + 1 agen privat milik owner + beberapa user lain.
async function setup() {
  const storage = new MemStorage();
  const owner = await storage.createUser({ email: "owner@contoh.id", firstName: "Oki", lastName: "Owner" } as any);
  const editor = await storage.createUser({ email: "editor@contoh.id", firstName: "Edi", lastName: "Editor" } as any);
  const viewer = await storage.createUser({ email: "viewer@contoh.id", firstName: "Vina", lastName: "Viewer" } as any);
  const stranger = await storage.createUser({ email: "stranger@contoh.id", firstName: "Sam", lastName: "Stranger" } as any);
  const agent = await storage.createAgent({ name: "Agen Privat Owner", userId: owner.id, isPublic: false } as any);
  return { storage, owner, editor, viewer, stranger, agent };
}

test("berbagi via email menyimpan peran yang benar (getUserByEmail → addOrUpdateCollaborator)", async () => {
  const { storage, owner, editor, agent } = await setup();
  const resolved = await storage.getUserByEmail("EDITOR@CONTOH.ID"); // case-insensitive
  assert.equal(resolved?.id, editor.id, "email harus di-resolve case-insensitive ke user yang benar");
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  assert.equal(await storage.getCollaboratorRole(agent.id, editor.id), "editor");
});

test("Editor: boleh MUTASI config, TAPI ditolak baca? (baca juga boleh) — dan mutasi diizinkan", async () => {
  const { storage, owner, editor, agent } = await setup();
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  assert.equal((await canMutate(storage, agent.id, owner.id, editor.id)).ok, true, "Editor harus boleh mutasi config");
  assert.equal((await canRead(storage, agent.id, owner.id, editor.id)).ok, true, "Editor harus boleh baca config");
});

test("Viewer: boleh BACA, DITOLAK mutasi (403)", async () => {
  const { storage, owner, viewer, agent } = await setup();
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: viewer.id, role: "viewer", invitedBy: owner.id });
  assert.equal((await canRead(storage, agent.id, owner.id, viewer.id)).ok, true, "Viewer harus boleh baca");
  const m = await canMutate(storage, agent.id, owner.id, viewer.id);
  assert.equal(m.ok, false);
  assert.equal((m as any).status, 403, "Viewer mutasi harus 403");
});

test("Non-kolaborator (orang asing): DITOLAK baca & mutasi (403) pada agen privat", async () => {
  const { storage, owner, stranger, agent } = await setup();
  const r = await canRead(storage, agent.id, owner.id, stranger.id);
  const m = await canMutate(storage, agent.id, owner.id, stranger.id);
  assert.equal(r.ok, false); assert.equal((r as any).status, 403, "orang asing baca → 403");
  assert.equal(m.ok, false); assert.equal((m as any).status, 403, "orang asing mutasi → 403");
});

test("Anonim (belum login): DITOLAK 401 untuk baca & mutasi", async () => {
  const { storage, owner, agent } = await setup();
  const r = await canRead(storage, agent.id, owner.id, "");
  const m = await canMutate(storage, agent.id, owner.id, "");
  assert.equal((r as any).status, 401, "anonim baca → 401");
  assert.equal((m as any).status, 401, "anonim mutasi → 401");
});

test("Owner: selalu boleh baca & mutasi agennya sendiri", async () => {
  const { storage, owner, agent } = await setup();
  assert.equal((await canRead(storage, agent.id, owner.id, owner.id)).ok, true);
  assert.equal((await canMutate(storage, agent.id, owner.id, owner.id)).ok, true);
});

test("Admin: boleh baca & mutasi agen orang lain (termasuk privat)", async () => {
  const { storage, owner, stranger, agent } = await setup();
  const admins = new Set([stranger.id]);
  const collaboratorRole = await storage.getCollaboratorRole(agent.id, stranger.id);
  assert.equal(decideAgentMutation({ userId: stranger.id, isAdmin: admins.has(stranger.id), agentOwnerId: owner.id, collaboratorRole }).ok, true);
  assert.equal(decideAgentReadAccess({ userId: stranger.id, isAdmin: admins.has(stranger.id), agentOwnerId: owner.id, collaboratorRole }).ok, true);
});

test("Agen SISTEM (tanpa pemilik): user login biasa DITOLAK mutasi/baca-config (403), tetap milik admin", async () => {
  const { storage, editor } = await setup();
  const sys = await storage.createAgent({ name: "Agen Sistem", userId: "", isPublic: false } as any);
  // Bahkan kalau seseorang nekat menambahkan kolaborator, agen sistem tetap admin-only.
  const m = await canMutate(storage, sys.id, "", editor.id);
  const r = await canRead(storage, sys.id, "", editor.id);
  assert.equal(m.ok, false); assert.equal((m as any).status, 403, "agen sistem mutasi non-admin → 403");
  assert.equal(r.ok, false); assert.equal((r as any).status, 403, "agen sistem baca-config non-admin → 403");
});

test("Mengubah peran (editor → viewer) lewat share ulang menurunkan hak mutasi", async () => {
  const { storage, owner, editor, agent } = await setup();
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  assert.equal((await canMutate(storage, agent.id, owner.id, editor.id)).ok, true);
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "viewer", invitedBy: owner.id });
  assert.equal((await canMutate(storage, agent.id, owner.id, editor.id)).ok, false, "turun ke viewer → mutasi 403");
  assert.equal((await canRead(storage, agent.id, owner.id, editor.id)).ok, true, "viewer masih boleh baca");
});

test("Mencabut akses (removeCollaborator) mengembalikan ke status orang asing (403)", async () => {
  const { storage, owner, editor, agent } = await setup();
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  assert.equal(await storage.removeCollaborator(agent.id, editor.id), true);
  assert.equal(await storage.getCollaboratorRole(agent.id, editor.id), null);
  const m = await canMutate(storage, agent.id, owner.id, editor.id);
  assert.equal(m.ok, false); assert.equal((m as any).status, 403, "setelah dicabut → 403");
});

test("Daftar agen yang dibagikan ke user (listAgentIdsForCollaborator) mencakup hanya yang di-share", async () => {
  const { storage, owner, editor, agent } = await setup();
  const agent2 = await storage.createAgent({ name: "Agen Kedua", userId: owner.id, isPublic: false } as any);
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  const ids = await storage.listAgentIdsForCollaborator(editor.id);
  assert.deepEqual(ids, [agent.id], "hanya agen yang di-share yang muncul");
  assert.ok(!ids.includes(agent2.id), "agen yang TIDAK di-share tidak boleh muncul");
});

test("listCollaboratorsForAgent mengembalikan email & displayName untuk UI berbagi", async () => {
  const { storage, owner, editor, viewer, agent } = await setup();
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: viewer.id, role: "viewer", invitedBy: owner.id });
  const list = await storage.listCollaboratorsForAgent(agent.id);
  assert.equal(list.length, 2);
  const byEmail = Object.fromEntries(list.map((c) => [c.email, c]));
  assert.equal(byEmail["editor@contoh.id"].role, "editor");
  assert.equal(byEmail["editor@contoh.id"].displayName, "Edi Editor");
  assert.equal(byEmail["viewer@contoh.id"].role, "viewer");
});

// Alur undangan-tertunda → first-login → grant → CTA "Buka" mendarat di agen yang
// SAH dibuka. Ini menutup celah yang ditemukan review: notice tidak boleh memakai
// /activate (khusus pemilik). Kita buktikan bahwa setelah grant diterapkan, user
// baru BISA membaca agen tersebut (target CTA), tanpa perlu jadi pemilik.
test("undangan-tertunda diterapkan saat daftar → grant berisi nama agen & user baru SAH membuka agen (target CTA)", async () => {
  const { storage, owner, agent } = await setup();
  const undangEmail = "pendatang@contoh.id";

  // Owner mengundang email yang BELUM punya akun → tersimpan sebagai pending invite.
  await storage.addOrUpdatePendingInvite({ agentId: agent.id, email: undangEmail, role: "editor", invitedBy: owner.id });
  assert.equal((await storage.listPendingInvitesForAgent(agent.id)).length, 1, "invite tertunda tersimpan");

  // User mendaftar pakai email itu, lalu sistem menerapkan invite tertunda (first login).
  const pendatang = await storage.createUser({ email: undangEmail, firstName: "Putri", lastName: "Pendatang" } as any);
  const grants = await storage.applyPendingInvitesForUser(pendatang.id, undangEmail.toUpperCase());

  // Grant membawa nama agen → notice bisa menampilkan "akses ke <nama>" + deep-link.
  assert.equal(grants.length, 1, "tepat satu grant diterapkan");
  assert.equal(grants[0].agentId, agent.id, "grant menunjuk agen yang benar (untuk ?agent=<id>)");
  assert.equal(grants[0].agentName, agent.name, "grant membawa nama agen untuk teks notice");
  assert.equal(grants[0].role, "editor", "peran sesuai undangan");

  // Invite tertunda dikonsumsi sekali (idempotent — tidak terpakai dua kali).
  assert.equal((await storage.listPendingInvitesForAgent(agent.id)).length, 0, "invite tertunda dikonsumsi");

  // INTI: target CTA SAH. User baru kini boleh MEMBUKA (baca) agen yang dibagikan —
  // tanpa /activate yang owner-only. Inilah yang dijamin oleh deep-link dashboard.
  assert.equal((await canRead(storage, agent.id, owner.id, pendatang.id)).ok, true, "user baru boleh membuka agen yang dibagikan");
  // Editor juga boleh mutasi config (sesuai peran undangan).
  assert.equal((await canMutate(storage, agent.id, owner.id, pendatang.id)).ok, true, "editor hasil grant boleh mutasi config");
});

// Divergensi YANG DIKETAHUI & DISENGAJA antara MemStorage vs DatabaseStorage:
// DatabaseStorage memakai agentId integer; MemStorage memakai id agen UUID.
// AgentCollaborator.agentId bertipe number, jadi MemStorage menurunkan field itu
// dari `parseInt(uuid) || 0` — nilainya TIDAK bermakna (UUID v4 bisa diawali huruf
// → 0, atau diawali digit → angka acak). Yang penting: field numerik ini BUKAN
// sumber kebenaran authz. Lookup TETAP benar karena disimpan via rawAgentId.
// Test ini mengunci ekspektasi itu agar "parity" tidak menyesatkan:
// auth bergantung pada getCollaboratorRole(rawId,userId), BUKAN pada field agentId.
test("[divergensi terdokumentasi] MemStorage: agentId numerik non-otoritatif untuk id UUID, tapi lookup tetap benar", async () => {
  const { storage, owner, editor, agent } = await setup();
  assert.ok(!/^\d+$/.test(agent.id), "prasyarat: id agen MemStorage adalah UUID (non-numerik penuh)");
  const rec = await storage.addOrUpdateCollaborator({ agentId: agent.id, userId: editor.id, role: "editor", invitedBy: owner.id });
  // Field numerik tidak bermakna di MemStorage → untuk id UUID selalu 0 secara
  // DETERMINISTIK. (Jangan pakai parseInt(uuid) mentah: UUID berawalan digit,
  // mis. "8e4f…", menghasilkan angka sampah non-deterministik & test flaky.)
  assert.equal(rec.agentId, 0, "agentId numerik = 0 untuk id UUID (deterministik, non-otoritatif; sumber kebenaran = rawAgentId)");
  // Sumber kebenaran authz: lookup via id string mentah tetap menemukan peran.
  assert.equal(await storage.getCollaboratorRole(agent.id, editor.id), "editor", "lookup via rawAgentId tetap benar");
});

// ============================================================================
// BAGIAN B — Integrasi HTTP NYATA (Express + auth middleware + DatabaseStorage)
// ============================================================================
// Integration test — drives REAL HTTP requests through the REAL auth middleware
// (server/replit_integrations/auth → isAuthenticated) and the REAL route handlers
// in server/routes.ts, against the REAL DatabaseStorage. Tujuannya menangkap
// kesalahan WIRING (mis. sebuah route lupa memasang guard) yang TIDAK terlihat
// oleh test statik (tests/agent-authz-guard.test.ts) maupun test fungsi murni
// (tests/agent-authz-decision.test.ts dan BAGIAN A di atas).
//
// Matriks kebijakan yang dibuktikan terhadap aplikasi hidup:
//   owner   → ✓ semua (config / destruktif / kelola-share / baca)
//   admin   → ✓ semua (ADMIN_USER_IDS)
//   editor  → ✓ config & baca, ✗ destruktif (delete/archive) & kelola-share
//   viewer  → ✗ semua mutasi, ✓ baca (GET tersanitasi)
//   outsider→ ✗ semua (termasuk baca) — bukan kolaborator
//   anon    → 401 di mana pun
//   agen sistem (userId kosong) → hanya admin

const HAS_DB = !!process.env.DATABASE_URL;

// Impor dinamis SETELAH cek DB supaya `npx tsx --test` tidak gagal keras saat
// DATABASE_URL tak tersedia (mis. environment terbatas) — test akan di-skip.
let db: any;
let pool: any;
let users: any;
let agents: any;
let agentCollaborators: any;
let storageDb: any;
let registerRoutes: any;
let eq: any;
let inArray: any;

let server: Server;
let baseUrl = "";

// ── Identitas test (unik per run) ─────────────────────────────────────────────
const suffix = randomUUID().slice(0, 8);
const ownerId = `it-owner-${suffix}`;
const adminId = `it-admin-${suffix}`;
const editorId = `it-editor-${suffix}`;
const viewerId = `it-viewer-${suffix}`;
const outsiderId = `it-outsider-${suffix}`;
const outsiderEmail = `it-outsider-${suffix}@example.test`;

const createdAgentIds: number[] = [];
const createdUserIds = [ownerId, adminId, editorId, viewerId, outsiderId];

async function makeUser(id: string, email: string) {
  await db.insert(users).values({ id, email, role: "user", isActive: true }).onConflictDoNothing();
}

async function makeAgent(opts: { ownerId: string; isPublic?: boolean }): Promise<number> {
  const [row] = await db
    .insert(agents)
    .values({
      name: `IT Agent ${randomUUID().slice(0, 6)}`,
      userId: opts.ownerId,
      systemPrompt: "SECRET-PROMPT-DO-NOT-LEAK",
      isPublic: opts.isPublic ?? false,
    })
    .returning({ id: agents.id });
  createdAgentIds.push(row.id);
  return row.id;
}

async function addCollab(agentId: number, userId: string, role: "editor" | "viewer") {
  await db
    .insert(agentCollaborators)
    .values({ agentId, userId, role, invitedBy: ownerId })
    .onConflictDoUpdate({
      target: [agentCollaborators.agentId, agentCollaborators.userId],
      set: { role },
    });
}

// HTTP helper — actor=null berarti anonim (tanpa header impersonasi).
async function req(
  method: string,
  path: string,
  actor: string | null,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {};
  if (actor) headers["x-test-user"] = actor;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  return { status: res.status, json };
}

before(async () => {
  if (!HAS_DB) return;

  // Tandai admin lewat ADMIN_USER_IDS — dibaca getDbRole/guards secara dinamis
  // saat request (bukan saat import), jadi aman di-set di sini.
  process.env.ADMIN_USER_IDS = [process.env.ADMIN_USER_IDS, adminId]
    .filter(Boolean)
    .join(",");

  ({ db, pool } = await import("../server/db"));
  ({ users } = await import("../shared/models/auth"));
  ({ agents, agentCollaborators } = await import("../shared/schema"));
  ({ storage: storageDb } = await import("../server/storage"));
  ({ registerRoutes } = await import("../server/routes"));
  ({ eq, inArray } = await import("drizzle-orm"));

  // Data uji.
  await makeUser(ownerId, `it-owner-${suffix}@example.test`);
  await makeUser(adminId, `it-admin-${suffix}@example.test`);
  await makeUser(editorId, `it-editor-${suffix}@example.test`);
  await makeUser(viewerId, `it-viewer-${suffix}@example.test`);
  await makeUser(outsiderId, outsiderEmail);

  // App + middleware impersonasi DI DEPAN registerRoutes (express menjalankan
  // middleware sesuai urutan registrasi). Kita memasang req.user & req.isAuthenticated
  // persis seperti yang dilihat isAuthenticated/getDbRole, lalu request asli mengalir
  // melewati middleware auth + handler route yang sesungguhnya.
  const app = express();
  app.use(express.json());
  app.use((reqAny: any, _res, next) => {
    const uid = reqAny.headers["x-test-user"];
    if (uid) {
      reqAny.user = { claims: { sub: uid } };
      reqAny.isAuthenticated = () => true;
    } else {
      reqAny.isAuthenticated = () => false;
    }
    next();
  });

  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  server = httpServer;
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!HAS_DB) return;
  try {
    if (createdAgentIds.length) {
      await db.delete(agentCollaborators).where(inArray(agentCollaborators.agentId, createdAgentIds));
      await db.delete(agents).where(inArray(agents.id, createdAgentIds));
    }
    await db.delete(users).where(inArray(users.id, createdUserIds));
  } catch (e) {
    console.error("[it cleanup]", e);
  }
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  // Tutup pool agar event loop tidak tertahan handle terbuka → proses exit bersih.
  try {
    if (pool && typeof pool.end === "function") await pool.end();
  } catch (e) {
    console.error("[it pool close]", e);
  }
});

// ── 1. GET /api/agents/:id (baca konfigurasi tersanitasi) ─────────────────────
test("GET /api/agents/:id — matriks akses baca", { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false }, async () => {
  const agentId = await makeAgent({ ownerId });
  await addCollab(agentId, editorId, "editor");
  await addCollab(agentId, viewerId, "viewer");

  // anon → 401
  assert.equal((await req("GET", `/api/agents/${agentId}`, null)).status, 401);

  // outsider (bukan kolaborator) → 403
  assert.equal((await req("GET", `/api/agents/${agentId}`, outsiderId)).status, 403);

  // owner → 200, tersanitasi (systemPrompt TIDAK bocor), effectiveRole owner
  const asOwner = await req("GET", `/api/agents/${agentId}`, ownerId);
  assert.equal(asOwner.status, 200);
  assert.equal(asOwner.json.systemPrompt, undefined, "owner non-admin TIDAK boleh menerima systemPrompt");
  assert.equal(asOwner.json.effectiveRole, "owner");

  // editor → 200, tersanitasi
  const asEditor = await req("GET", `/api/agents/${agentId}`, editorId);
  assert.equal(asEditor.status, 200);
  assert.equal(asEditor.json.systemPrompt, undefined);
  assert.equal(asEditor.json.effectiveRole, "editor");

  // viewer → 200, tersanitasi
  const asViewer = await req("GET", `/api/agents/${agentId}`, viewerId);
  assert.equal(asViewer.status, 200);
  assert.equal(asViewer.json.systemPrompt, undefined);
  assert.equal(asViewer.json.effectiveRole, "viewer");

  // admin → 200, data PENUH (boleh lihat systemPrompt)
  const asAdmin = await req("GET", `/api/agents/${agentId}`, adminId);
  assert.equal(asAdmin.status, 200);
  assert.equal(asAdmin.json.systemPrompt, "SECRET-PROMPT-DO-NOT-LEAK", "admin menerima data penuh");
});

// ── 2. PATCH /api/agents/:id (mutasi konfigurasi) ─────────────────────────────
test("PATCH /api/agents/:id — owner/admin/editor boleh; viewer/outsider 403; anon 401", { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false }, async () => {
  const agentId = await makeAgent({ ownerId });
  await addCollab(agentId, editorId, "editor");
  await addCollab(agentId, viewerId, "viewer");

  const body = { description: "edited-by-test" };

  assert.equal((await req("PATCH", `/api/agents/${agentId}`, null, body)).status, 401);
  assert.equal((await req("PATCH", `/api/agents/${agentId}`, ownerId, body)).status, 200);
  assert.equal((await req("PATCH", `/api/agents/${agentId}`, adminId, body)).status, 200);
  assert.equal((await req("PATCH", `/api/agents/${agentId}`, editorId, body)).status, 200);
  assert.equal((await req("PATCH", `/api/agents/${agentId}`, viewerId, body)).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${agentId}`, outsiderId, body)).status, 403);
});

// ── 3. PATCH /api/agents/:id/archive (destruktif/kepemilikan) ────────────────
test("PATCH /api/agents/:id/archive — owner/admin boleh; editor/viewer/outsider 403; anon 401", { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false }, async () => {
  // Editor (yang boleh edit config) HARUS tetap 403 di sini.
  const a1 = await makeAgent({ ownerId });
  await addCollab(a1, editorId, "editor");
  await addCollab(a1, viewerId, "viewer");

  assert.equal((await req("PATCH", `/api/agents/${a1}/archive`, null)).status, 401);
  assert.equal((await req("PATCH", `/api/agents/${a1}/archive`, editorId)).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${a1}/archive`, viewerId)).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${a1}/archive`, outsiderId)).status, 403);

  // owner & admin sukses (pakai agen terpisah karena archive bersifat toggle stateful)
  const a2 = await makeAgent({ ownerId });
  assert.equal((await req("PATCH", `/api/agents/${a2}/archive`, ownerId)).status, 200);
  const a3 = await makeAgent({ ownerId });
  assert.equal((await req("PATCH", `/api/agents/${a3}/archive`, adminId)).status, 200);
});

// ── 4. DELETE /api/agents/:id (destruktif/kepemilikan) ───────────────────────
test("DELETE /api/agents/:id — owner/admin boleh; editor/viewer/outsider 403; anon 401", { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false }, async () => {
  const a1 = await makeAgent({ ownerId });
  await addCollab(a1, editorId, "editor");
  await addCollab(a1, viewerId, "viewer");

  assert.equal((await req("DELETE", `/api/agents/${a1}`, null)).status, 401);
  assert.equal((await req("DELETE", `/api/agents/${a1}`, editorId)).status, 403);
  assert.equal((await req("DELETE", `/api/agents/${a1}`, viewerId)).status, 403);
  assert.equal((await req("DELETE", `/api/agents/${a1}`, outsiderId)).status, 403);

  // owner sukses (204), agen baru untuk admin.
  const a2 = await makeAgent({ ownerId });
  assert.equal((await req("DELETE", `/api/agents/${a2}`, ownerId)).status, 204);
  const a3 = await makeAgent({ ownerId });
  assert.equal((await req("DELETE", `/api/agents/${a3}`, adminId)).status, 204);
});

// ── 5. Kelola kolaborator (share-management) — hak KEPEMILIKAN, bukan editor ──
test("POST/PATCH/DELETE /api/agents/:id/collaborators — owner/admin boleh; editor/viewer/outsider 403; anon 401", { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false }, async () => {
  const agentId = await makeAgent({ ownerId });
  await addCollab(agentId, editorId, "editor");
  await addCollab(agentId, viewerId, "viewer");

  // POST (undang kolaborator via email) — non-pemilik DITOLAK sebelum efek apa pun.
  const invite = { email: outsiderEmail, role: "viewer" };
  assert.equal((await req("POST", `/api/agents/${agentId}/collaborators`, null, invite)).status, 401);
  assert.equal((await req("POST", `/api/agents/${agentId}/collaborators`, editorId, invite)).status, 403, "editor TIDAK boleh kelola kolaborator");
  assert.equal((await req("POST", `/api/agents/${agentId}/collaborators`, viewerId, invite)).status, 403);
  assert.equal((await req("POST", `/api/agents/${agentId}/collaborators`, outsiderId, invite)).status, 403);

  // owner berhasil mengundang outsider (201).
  const ownerInvite = await req("POST", `/api/agents/${agentId}/collaborators`, ownerId, invite);
  assert.equal(ownerInvite.status, 201);

  // PATCH peran kolaborator — editor/viewer/outsider 403; owner 200; admin 200.
  const patchBody = { role: "editor" };
  assert.equal((await req("PATCH", `/api/agents/${agentId}/collaborators/${outsiderId}`, editorId, patchBody)).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${agentId}/collaborators/${outsiderId}`, viewerId, patchBody)).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${agentId}/collaborators/${outsiderId}`, ownerId, patchBody)).status, 200);
  assert.equal((await req("PATCH", `/api/agents/${agentId}/collaborators/${editorId}`, adminId, { role: "viewer" })).status, 200);

  // GET daftar kolaborator — hanya owner/admin; editor/viewer 403.
  assert.equal((await req("GET", `/api/agents/${agentId}/collaborators`, editorId)).status, 403);
  assert.equal((await req("GET", `/api/agents/${agentId}/collaborators`, ownerId)).status, 200);

  // DELETE kolaborator — editor/outsider 403; owner 200; admin 200.
  assert.equal((await req("DELETE", `/api/agents/${agentId}/collaborators/${outsiderId}`, editorId)).status, 403);
  assert.equal((await req("DELETE", `/api/agents/${agentId}/collaborators/${outsiderId}`, ownerId)).status, 200);
  assert.equal((await req("DELETE", `/api/agents/${agentId}/collaborators/${editorId}`, adminId)).status, 200);
});

// ── 6. Agen sistem (userId kosong) — hanya admin yang lolos otorisasi ────────
test("Agen sistem (userId kosong) — non-admin 403, admin lolos", { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false }, async () => {
  const sysId = await makeAgent({ ownerId: "" });

  // Baca: non-admin (bahkan user terotentikasi) 403; admin 200 penuh.
  assert.equal((await req("GET", `/api/agents/${sysId}`, ownerId)).status, 403);
  assert.equal((await req("GET", `/api/agents/${sysId}`, outsiderId)).status, 403);
  const adminRead = await req("GET", `/api/agents/${sysId}`, adminId);
  assert.equal(adminRead.status, 200);
  assert.equal(adminRead.json.systemPrompt, "SECRET-PROMPT-DO-NOT-LEAK");

  // Mutasi config: non-admin 403; admin 200.
  assert.equal((await req("PATCH", `/api/agents/${sysId}`, ownerId, { description: "x" })).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${sysId}`, adminId, { description: "x" })).status, 200);

  // Destruktif (archive): non-admin 403; admin 200.
  assert.equal((await req("PATCH", `/api/agents/${sysId}/archive`, ownerId)).status, 403);
  assert.equal((await req("PATCH", `/api/agents/${sysId}/archive`, adminId)).status, 200);

  // Kelola kolaborator: non-admin 403; admin lolos auth lalu 400 (agen sistem tak bisa dibagikan).
  assert.equal((await req("POST", `/api/agents/${sysId}/collaborators`, ownerId, { email: outsiderEmail })).status, 403);
  const adminShare = await req("POST", `/api/agents/${sysId}/collaborators`, adminId, { email: outsiderEmail });
  assert.equal(adminShare.status, 400, "admin lolos guard tetapi agen sistem ditolak dibagikan (400)");
});
