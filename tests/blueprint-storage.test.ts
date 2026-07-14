import { test } from "node:test";
import assert from "node:assert/strict";

import { MemStorage } from "../server/storage";
import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";

test("createBlueprint menyimpan & mengembalikan record dengan id + timestamp", async () => {
  const s = new MemStorage();
  const bp = createEmptyBlueprint("asisten hukum umkm");
  const rec = await s.createBlueprint({ userId: "u1", name: "Hukum UMKM", intent: "legal", data: bp });
  assert.ok(rec.id > 0);
  assert.equal(rec.userId, "u1");
  assert.equal(rec.name, "Hukum UMKM");
  assert.ok(rec.createdAt instanceof Date);
  assert.deepEqual(rec.data, bp);
});

test("getBlueprint mengambil by id; tak ada → undefined", async () => {
  const s = new MemStorage();
  const created = await s.createBlueprint({ userId: "u1", name: "A", data: createEmptyBlueprint() });
  assert.deepEqual(await s.getBlueprint(created.id), created);
  assert.equal(await s.getBlueprint(99999), undefined);
});

test("getBlueprints memfilter per userId", async () => {
  const s = new MemStorage();
  await s.createBlueprint({ userId: "u1", name: "A", data: createEmptyBlueprint() });
  await s.createBlueprint({ userId: "u1", name: "B", data: createEmptyBlueprint() });
  await s.createBlueprint({ userId: "u2", name: "C", data: createEmptyBlueprint() });
  assert.equal((await s.getBlueprints("u1")).length, 2);
  assert.equal((await s.getBlueprints("u2")).length, 1);
  assert.equal((await s.getBlueprints()).length, 3);
});

test("updateBlueprint patch parsial & memperbarui updatedAt; id tak ada → undefined", async () => {
  const s = new MemStorage();
  const created = await s.createBlueprint({ userId: "u1", name: "Lama", data: createEmptyBlueprint() });
  const updated = await s.updateBlueprint(created.id, { name: "Baru" });
  assert.equal(updated?.name, "Baru");
  assert.equal(updated?.userId, "u1");
  assert.ok((updated!.updatedAt as Date).getTime() >= (created.updatedAt as Date).getTime());
  assert.equal(await s.updateBlueprint(99999, { name: "x" }), undefined);
});

test("deleteBlueprint menghapus; id tak ada → false", async () => {
  const s = new MemStorage();
  const created = await s.createBlueprint({ userId: "u1", name: "A", data: createEmptyBlueprint() });
  assert.equal(await s.deleteBlueprint(created.id), true);
  assert.equal(await s.getBlueprint(created.id), undefined);
  assert.equal(await s.deleteBlueprint(created.id), false);
});

test("id auto-increment unik per record", async () => {
  const s = new MemStorage();
  const a = await s.createBlueprint({ userId: "u1", name: "A", data: createEmptyBlueprint() });
  const b = await s.createBlueprint({ userId: "u1", name: "B", data: createEmptyBlueprint() });
  assert.notEqual(a.id, b.id);
});

test("owner-scoped: pemilik bisa akses, non-pemilik ditolak (cegah IDOR)", async () => {
  const s = new MemStorage();
  const rec = await s.createBlueprint({ userId: "owner", name: "Milik Owner", data: createEmptyBlueprint() });

  // pemilik
  assert.deepEqual(await s.getBlueprintForUser(rec.id, "owner"), rec);
  // penyusup
  assert.equal(await s.getBlueprintForUser(rec.id, "intruder"), undefined);
  assert.equal(await s.updateBlueprintForUser(rec.id, "intruder", { name: "Dibajak" }), undefined);
  assert.equal(await s.deleteBlueprintForUser(rec.id, "intruder"), false);
  // record tetap utuh setelah upaya penyusup
  assert.equal((await s.getBlueprint(rec.id))?.name, "Milik Owner");

  // pemilik boleh ubah & hapus
  const upd = await s.updateBlueprintForUser(rec.id, "owner", { name: "Diubah" });
  assert.equal(upd?.name, "Diubah");
  assert.equal(await s.deleteBlueprintForUser(rec.id, "owner"), true);
  assert.equal(await s.getBlueprint(rec.id), undefined);
});
