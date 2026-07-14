/**
 * Tahap 37 — Organization Drafts storage (Fase 3 / KOLABORASI).
 * Mengunci: simpan/baca/ubah/hapus rancangan tim DAN owner-scoping (cegah IDOR).
 * Jalankan: npx tsx --test tests/organization-drafts-storage.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { MemStorage } from "../server/storage";

const sampleDraft = (orgName = "Tim A") => ({
  orgName,
  mission: "Bantu UMKM",
  members: [
    { localId: "m1", role: "orchestrator", title: "Ketua", responsibility: "", systemPrompt: "" },
    { localId: "m2", role: "specialist", title: "Marketing", responsibility: "", systemPrompt: "" },
  ],
  maxSpecialists: 3,
});

test("createOrganizationDraft menyimpan & mengembalikan record dengan id + timestamp", async () => {
  const s = new MemStorage();
  const data = sampleDraft();
  const rec = await s.createOrganizationDraft({ userId: "u1", name: "Tim A", mission: "Bantu UMKM", data });
  assert.ok(rec.id > 0);
  assert.equal(rec.userId, "u1");
  assert.equal(rec.name, "Tim A");
  assert.ok(rec.createdAt instanceof Date);
  assert.deepEqual(rec.data, data);
});

test("listOrganizationDraftsForUser memfilter per userId", async () => {
  const s = new MemStorage();
  await s.createOrganizationDraft({ userId: "u1", name: "A", mission: "", data: sampleDraft() });
  await s.createOrganizationDraft({ userId: "u1", name: "B", mission: "", data: sampleDraft() });
  await s.createOrganizationDraft({ userId: "u2", name: "C", mission: "", data: sampleDraft() });
  assert.equal((await s.listOrganizationDraftsForUser("u1")).length, 2);
  assert.equal((await s.listOrganizationDraftsForUser("u2")).length, 1);
  assert.equal((await s.listOrganizationDraftsForUser("nobody")).length, 0);
});

test("id auto-increment unik per record", async () => {
  const s = new MemStorage();
  const a = await s.createOrganizationDraft({ userId: "u1", name: "A", mission: "", data: sampleDraft() });
  const b = await s.createOrganizationDraft({ userId: "u1", name: "B", mission: "", data: sampleDraft() });
  assert.notEqual(a.id, b.id);
});

test("owner-scoped: pemilik bisa akses, non-pemilik ditolak (cegah IDOR)", async () => {
  const s = new MemStorage();
  const rec = await s.createOrganizationDraft({ userId: "owner", name: "Milik Owner", mission: "", data: sampleDraft() });

  // pemilik
  assert.deepEqual(await s.getOrganizationDraftForUser(rec.id, "owner"), rec);
  // penyusup TIDAK boleh baca/ubah/hapus
  assert.equal(await s.getOrganizationDraftForUser(rec.id, "intruder"), undefined);
  assert.equal(await s.updateOrganizationDraftForUser(rec.id, "intruder", { name: "Dibajak" }), undefined);
  assert.equal(await s.deleteOrganizationDraftForUser(rec.id, "intruder"), false);
  // record tetap utuh setelah upaya penyusup
  assert.equal((await s.getOrganizationDraftForUser(rec.id, "owner"))?.name, "Milik Owner");

  // pemilik boleh ubah & hapus
  const upd = await s.updateOrganizationDraftForUser(rec.id, "owner", { name: "Diubah" });
  assert.equal(upd?.name, "Diubah");
  assert.equal(await s.deleteOrganizationDraftForUser(rec.id, "owner"), true);
  assert.equal(await s.getOrganizationDraftForUser(rec.id, "owner"), undefined);
});

test("update memperbarui updatedAt; id tak ada → undefined", async () => {
  const s = new MemStorage();
  const created = await s.createOrganizationDraft({ userId: "u1", name: "Lama", mission: "", data: sampleDraft() });
  const updated = await s.updateOrganizationDraftForUser(created.id, "u1", { name: "Baru" });
  assert.equal(updated?.name, "Baru");
  assert.ok((updated!.updatedAt as Date).getTime() >= (created.updatedAt as Date).getTime());
  assert.equal(await s.updateOrganizationDraftForUser(99999, "u1", { name: "x" }), undefined);
});
