import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { MemStorage } from "../server/storage";

// Regresi — "Confirm invited teammates actually get access after they sign up".
//
// Alur "undang email yang belum punya akun" hanya aman bila pending-invite
// BERUBAH jadi akses nyata begitu orang itu mendaftar. Hook auto-apply dipasang
// di DUA jalur signup terpisah (verifikasi email + Replit OAuth upsertUser) dan
// harus idempoten + non-blocking. Tanpa coverage, perubahan di salah satu jalur
// auth bisa diam-diam berhenti mengaktifkan invite tanpa ada yang sadar.
//
// Bagian A — integrasi NYATA terhadap storage: kita panggil persis yang
// dilakukan kedua handler signup (`storage.applyPendingInvitesForUser`) dan
// buktikan hasil end-to-end (peran benar, idempoten, case-insensitive).
// Bagian B — statik: kunci wiring di kedua file auth agar refactor tak diam-diam
// menghapus panggilan apply atau membuatnya blocking.

// ── Bagian A: integrasi storage ─────────────────────────────────────────────

// Bangun dunia: owner + 1 agen privat milik owner. Orang yang diundang BELUM
// punya akun (mirip skenario produksi: undang lewat email sebelum signup).
async function setupOwnerAndAgent() {
  const storage = new MemStorage();
  const owner = await storage.createUser({
    email: "owner@contoh.id",
    firstName: "Oki",
    lastName: "Owner",
  } as any);
  const agent = await storage.createAgent({
    name: "Agen Privat Owner",
    userId: owner.id,
    isPublic: false,
  } as any);
  return { storage, owner, agent };
}

test("email-verification signup: pending invite untuk email tanpa akun → kolaborator nyata dengan peran benar", async () => {
  const { storage, owner, agent } = await setupOwnerAndAgent();

  // Owner mengundang email yang BELUM terdaftar → tersimpan sebagai pending.
  await storage.addOrUpdatePendingInvite({
    agentId: agent.id,
    email: "newbie@contoh.id",
    role: "editor",
    invitedBy: owner.id,
  });
  assert.equal(
    (await storage.listPendingInvitesForAgent(agent.id)).length,
    1,
    "harus ada 1 pending invite sebelum signup",
  );

  // Orang itu mendaftar via verifikasi email → user row dibuat, lalu handler
  // verify-email memanggil applyPendingInvitesForUser(userRow.id, email).
  const newUser = await storage.createUser({
    email: "newbie@contoh.id",
    firstName: "Nadia",
    lastName: "Newbie",
  } as any);
  const applied = await storage.applyPendingInvitesForUser(newUser.id, "newbie@contoh.id");

  assert.equal(applied.length, 1, "tepat 1 invite harus teraplikasi");
  assert.equal(
    await storage.getCollaboratorRole(agent.id, newUser.id),
    "editor",
    "peran kolaborator harus persis seperti invite (editor)",
  );
  assert.equal(
    (await storage.listPendingInvitesForAgent(agent.id)).length,
    0,
    "pending invite harus dikonsumsi (dihapus) setelah teraplikasi",
  );
});

test("Replit OAuth upsertUser signup: jalur yang sama mengaktifkan pending invite", async () => {
  const { storage, owner, agent } = await setupOwnerAndAgent();

  await storage.addOrUpdatePendingInvite({
    agentId: agent.id,
    email: "oauth-user@contoh.id",
    role: "viewer",
    invitedBy: owner.id,
  });

  // upsertUser() di replitAuth membuat/meng-upsert user dari klaim OIDC lalu
  // memanggil applyPendingInvitesForUser(claims.sub, claims.email). Kita tiru
  // dengan membuat user (mewakili upsert) + apply memakai email klaim.
  const oauthUser = await storage.createUser({
    id: "replit-sub-123",
    email: "oauth-user@contoh.id",
    firstName: "Olga",
    lastName: "OAuth",
  } as any);
  const applied = await storage.applyPendingInvitesForUser(oauthUser.id, "oauth-user@contoh.id");

  assert.equal(applied.length, 1, "invite harus teraplikasi lewat jalur OAuth");
  assert.equal(
    await storage.getCollaboratorRole(agent.id, oauthUser.id),
    "viewer",
    "peran kolaborator harus persis seperti invite (viewer)",
  );
});

test("idempoten: apply ulang TIDAK membuat baris kolaborator ganda", async () => {
  const { storage, owner, agent } = await setupOwnerAndAgent();

  await storage.addOrUpdatePendingInvite({
    agentId: agent.id,
    email: "dupe@contoh.id",
    role: "editor",
    invitedBy: owner.id,
  });
  const user = await storage.createUser({ email: "dupe@contoh.id" } as any);

  const first = await storage.applyPendingInvitesForUser(user.id, "dupe@contoh.id");
  assert.equal(first.length, 1, "apply pertama mengaplikasikan 1 invite");

  // Jalankan ulang (mis. user verifikasi/login berkali-kali). Pending sudah
  // dikonsumsi → 0 invite baru, dan TIDAK ada baris kolaborator ganda.
  const second = await storage.applyPendingInvitesForUser(user.id, "dupe@contoh.id");
  assert.equal(second.length, 0, "apply kedua tidak menemukan pending lagi");

  const collaborators = (await storage.listCollaboratorsForAgent(agent.id)).filter(
    (c) => c.userId === user.id,
  );
  assert.equal(collaborators.length, 1, "harus tepat 1 baris kolaborator (tanpa duplikat)");
});

test("idempoten + tetap mempertahankan peran bila invite teraplikasi dua kali (upsert, bukan insert ganda)", async () => {
  const { storage, owner, agent } = await setupOwnerAndAgent();
  const user = await storage.createUser({ email: "again@contoh.id" } as any);

  // Dua siklus undang→apply berturut-turut. Baris kolaborator harus tetap satu.
  await storage.addOrUpdatePendingInvite({ agentId: agent.id, email: "again@contoh.id", role: "viewer", invitedBy: owner.id });
  await storage.applyPendingInvitesForUser(user.id, "again@contoh.id");
  await storage.addOrUpdatePendingInvite({ agentId: agent.id, email: "again@contoh.id", role: "editor", invitedBy: owner.id });
  await storage.applyPendingInvitesForUser(user.id, "again@contoh.id");

  const collaborators = (await storage.listCollaboratorsForAgent(agent.id)).filter(
    (c) => c.userId === user.id,
  );
  assert.equal(collaborators.length, 1, "apply berulang harus upsert, bukan menambah baris");
  assert.equal(
    await storage.getCollaboratorRole(agent.id, user.id),
    "editor",
    "peran terakhir (editor) harus menang setelah apply kedua",
  );
});

test("email dicocokkan case-insensitive antara undangan dan signup", async () => {
  const { storage, owner, agent } = await setupOwnerAndAgent();

  // Owner mengundang dengan email kapital; user mendaftar dengan email kecil.
  await storage.addOrUpdatePendingInvite({
    agentId: agent.id,
    email: "MixedCase@Contoh.ID",
    role: "editor",
    invitedBy: owner.id,
  });
  const user = await storage.createUser({ email: "mixedcase@contoh.id" } as any);

  const applied = await storage.applyPendingInvitesForUser(user.id, "mixedcase@contoh.id");
  assert.equal(applied.length, 1, "perbedaan kapitalisasi email tidak boleh menghalangi apply");
  assert.equal(
    await storage.getCollaboratorRole(agent.id, user.id),
    "editor",
    "kolaborator harus terbentuk meski kapitalisasi email berbeda",
  );

  // Arah sebaliknya: undang email kecil, apply dengan email kapital.
  const agent2 = await storage.createAgent({ name: "Agen Kedua", userId: owner.id, isPublic: false } as any);
  await storage.addOrUpdatePendingInvite({ agentId: agent2.id, email: "lower@contoh.id", role: "viewer", invitedBy: owner.id });
  const user2 = await storage.createUser({ email: "lower@contoh.id" } as any);
  const applied2 = await storage.applyPendingInvitesForUser(user2.id, "LOWER@CONTOH.ID");
  assert.equal(applied2.length, 1, "apply dengan email kapital harus cocok dengan invite huruf kecil");
  assert.equal(await storage.getCollaboratorRole(agent2.id, user2.id), "viewer");
});

// ── Bagian B: kunci wiring di kedua jalur auth (statik) ──────────────────────
//
// Statik (baca source) — sengaja agar cepat, deterministik, tanpa DB/sesi, dan
// GAGAL KERAS bila refactor menghapus panggilan apply atau membuatnya blocking.
// Mengikuti pola tests/agent-authz-guard.test.ts & routes-helper-usage.test.ts.

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSrc(rel: string): string {
  return readFileSync(resolve(__dirname, rel), "utf8");
}

test("emailAuth (verify-email) memanggil applyPendingInvitesForUser secara non-blocking", () => {
  const src = readSrc("../server/replit_integrations/auth/emailAuth.ts");
  assert.match(
    src,
    /applyPendingInvitesForUser\(/,
    "jalur verifikasi email WAJIB memanggil applyPendingInvitesForUser",
  );
  // Harus dibungkus try/catch agar kegagalan apply tidak menggagalkan signup.
  assert.match(
    src,
    /try\s*{[\s\S]*?applyPendingInvitesForUser\([\s\S]*?}\s*catch/,
    "panggilan apply harus non-blocking (dibungkus try/catch)",
  );
});

test("replitAuth (upsertUser) memanggil applyPendingInvitesForUser secara non-blocking", () => {
  const src = readSrc("../server/replit_integrations/auth/replitAuth.ts");
  assert.match(
    src,
    /applyPendingInvitesForUser\(/,
    "jalur OAuth upsertUser WAJIB memanggil applyPendingInvitesForUser",
  );
  assert.match(
    src,
    /try\s*{[\s\S]*?applyPendingInvitesForUser\([\s\S]*?}\s*catch/,
    "panggilan apply harus non-blocking (dibungkus try/catch)",
  );
});
