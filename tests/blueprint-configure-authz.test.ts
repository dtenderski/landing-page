import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * Mengunci otorisasi kepemilikan pada satu-satunya jalur TULIS Blueprint:
 * POST /api/blueprint/configure mode "update". Engine konfigurasi TIDAK
 * memeriksa kepemilikan — gerbangnya ada di route layer. Test ini regresi-guard
 * agar gate itu (a) ada, (b) berjalan SEBELUM penulisan ke DB, sehingga user
 * lain tak bisa menimpa agen milik orang lain via Blueprint.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesPath = resolve(__dirname, "../server/blueprint-engine-routes.ts");
const source = readFileSync(routesPath, "utf8");

function configureHandlerSlice(): string {
  const start = source.indexOf('"/api/blueprint/configure"');
  assert.ok(start !== -1, "Route POST /api/blueprint/configure tidak ditemukan.");
  // Ambil sampai akhir file — configure adalah handler terakhir; cukup untuk
  // menangkap seluruh body handler tanpa jendela karakter rapuh.
  return source.slice(start);
}

test("POST /api/blueprint/configure dijaga isAuthenticated", () => {
  const slice = source.slice(source.indexOf('"/api/blueprint/configure"'));
  assert.match(
    slice.slice(0, 200),
    /isAuthenticated/,
    "Route configure wajib memakai middleware isAuthenticated.",
  );
});

test("mode 'update' memeriksa kepemilikan (owner/admin) dan menolak 403", () => {
  const slice = configureHandlerSlice();
  assert.match(slice, /mode === "update"/, "Harus ada cabang khusus mode update.");
  assert.match(
    slice,
    /target\.userId\s*===\s*userId/,
    "Update wajib membandingkan pemilik agen dengan user sesi.",
  );
  assert.match(
    slice,
    /isAdminUser\(userId\)/,
    "Update wajib mengizinkan admin sebagai pengecualian pemilik.",
  );
  assert.match(
    slice,
    /HttpError\(403/,
    "Non-pemilik & non-admin wajib ditolak 403 pada mode update.",
  );
});

test("gate kepemilikan berjalan SEBELUM penulisan ke Builder (applyBlueprintToBuilder)", () => {
  const slice = configureHandlerSlice();
  const ownershipIdx = slice.indexOf("HttpError(403");
  const writeIdx = slice.indexOf("applyBlueprintToBuilder(");
  assert.ok(ownershipIdx !== -1, "Gate 403 kepemilikan tidak ditemukan.");
  assert.ok(writeIdx !== -1, "Pemanggilan applyBlueprintToBuilder tidak ditemukan.");
  assert.ok(
    ownershipIdx < writeIdx,
    "Cek kepemilikan (403) HARUS sebelum applyBlueprintToBuilder — kalau tidak, agen orang lain bisa ditimpa sebelum gate dievaluasi.",
  );
});

test("mode 'create' menstempel ownerUserId = user sesi (agar update berikutnya owner-gated)", () => {
  const slice = configureHandlerSlice();
  assert.match(
    slice,
    /ownerUserId:\s*mode === "create"\s*\?\s*userId/,
    "Create wajib menstempel ownerUserId dari sesi agar kepemilikan terbentuk.",
  );
});
