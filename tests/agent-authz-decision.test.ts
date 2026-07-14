import { test } from "node:test";
import assert from "node:assert/strict";

import { decideAgentMutation, decideAgentReadAccess } from "../server/lib/agent-authz";

// Tahap 17 — validasi SEMANTIK runtime otorisasi mutasi agen (bukan sekadar
// keberadaan guard di source seperti agent-authz-guard.test.ts). Menguji
// langsung fungsi keputusan murni untuk seluruh matriks aktor.

test("belum login (userId kosong) → 401 Unauthorized", () => {
  const r = decideAgentMutation({ userId: "", isAdmin: false, agentOwnerId: "u2" });
  assert.deepEqual(r, { ok: false, status: 401, error: "Unauthorized" });
});

test("admin → boleh memutasi agen milik orang lain", () => {
  assert.deepEqual(
    decideAgentMutation({ userId: "admin1", isAdmin: true, agentOwnerId: "u2" }),
    { ok: true },
  );
});

test("admin → boleh memutasi agen sistem (tanpa pemilik)", () => {
  assert.deepEqual(
    decideAgentMutation({ userId: "admin1", isAdmin: true, agentOwnerId: "" }),
    { ok: true },
  );
});

test("pemilik → boleh memutasi agennya sendiri", () => {
  assert.deepEqual(
    decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u1" }),
    { ok: true },
  );
});

test("non-admin atas agen sistem (tanpa pemilik) → 403 admin-only", () => {
  const r = decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
  assert.match((r as { error: string }).error, /sistem/i);
});

test("non-pemilik atas agen milik orang lain → 403 bukan pemilik", () => {
  const r = decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u2" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
  assert.match((r as { error: string }).error, /pemilik/i);
});

test("defense-in-depth: userId kosong tetap 401 walau isAdmin=true", () => {
  // Tanpa identitas, klaim admin tidak boleh dipercaya — 401 didahulukan.
  const r = decideAgentMutation({ userId: "", isAdmin: true, agentOwnerId: "u2" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 401);
});

// ─── Kolaborator (Editor/Viewer) — MUTASI ───────────────────────────────────

test("kolaborator EDITOR atas agen orang lain → boleh memutasi konfigurasi", () => {
  assert.deepEqual(
    decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: "editor" }),
    { ok: true },
  );
});

test("kolaborator VIEWER atas agen orang lain → 403 (read-only)", () => {
  const r = decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: "viewer" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
  assert.match((r as { error: string }).error, /pemilik/i);
});

test("collaboratorRole=null pada agen orang lain → tetap 403 bukan pemilik", () => {
  const r = decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: null });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
});

test("editor pada agen sistem (tanpa pemilik) → tetap 403 admin-only", () => {
  // Agen sistem hanya admin; peran editor tidak boleh mem-bypass guard sistem.
  const r = decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "", collaboratorRole: "editor" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
  assert.match((r as { error: string }).error, /sistem/i);
});

test("editor dengan userId kosong → 401 didahulukan", () => {
  const r = decideAgentMutation({ userId: "", isAdmin: false, agentOwnerId: "u2", collaboratorRole: "editor" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 401);
});

// ─── Kebijakan aksi DESTRUKTIF/KEPEMILIKAN (delete, archive) ─────────────────
// Route destruktif memanggil decideAgentMutation TANPA meneruskan
// collaboratorRole (selalu null), sehingga editor pun ditolak. Test ini
// mengunci kontrak itu agar refactor tak sengaja memberi editor hak hapus.
test("aksi destruktif: EDITOR diperlakukan owner-only (collaboratorRole null) → 403", () => {
  // Sekalipun user adalah editor di DB, route delete/archive TIDAK lookup peran
  // → memanggil dengan collaboratorRole:null → harus 403.
  const r = decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: null });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
});

test("aksi destruktif: OWNER tetap boleh (delete/archive)", () => {
  assert.deepEqual(
    decideAgentMutation({ userId: "u1", isAdmin: false, agentOwnerId: "u1", collaboratorRole: null }),
    { ok: true },
  );
});

test("aksi destruktif: ADMIN tetap boleh (delete/archive)", () => {
  assert.deepEqual(
    decideAgentMutation({ userId: "admin1", isAdmin: true, agentOwnerId: "u2", collaboratorRole: null }),
    { ok: true },
  );
});

// ─── Akses BACA (decideAgentReadAccess) ─────────────────────────────────────

test("read: belum login → 401", () => {
  const r = decideAgentReadAccess({ userId: "", isAdmin: false, agentOwnerId: "u2" });
  assert.deepEqual(r, { ok: false, status: 401, error: "Unauthorized" });
});

test("read: admin → boleh baca agen siapa pun", () => {
  assert.deepEqual(decideAgentReadAccess({ userId: "a", isAdmin: true, agentOwnerId: "u2" }), { ok: true });
});

test("read: pemilik → boleh baca agennya", () => {
  assert.deepEqual(decideAgentReadAccess({ userId: "u1", isAdmin: false, agentOwnerId: "u1" }), { ok: true });
});

test("read: kolaborator EDITOR → boleh baca", () => {
  assert.deepEqual(
    decideAgentReadAccess({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: "editor" }),
    { ok: true },
  );
});

test("read: kolaborator VIEWER → boleh baca", () => {
  assert.deepEqual(
    decideAgentReadAccess({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: "viewer" }),
    { ok: true },
  );
});

test("read: non-kolaborator atas agen orang lain → 403", () => {
  const r = decideAgentReadAccess({ userId: "u1", isAdmin: false, agentOwnerId: "u2", collaboratorRole: null });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
});

test("read: agen sistem (tanpa pemilik) non-admin → 403", () => {
  const r = decideAgentReadAccess({ userId: "u1", isAdmin: false, agentOwnerId: "" });
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
  assert.match((r as { error: string }).error, /sistem/i);
});
