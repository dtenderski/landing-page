import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesPath = resolve(__dirname, "../server/routes.ts");
const routesSource = readFileSync(routesPath, "utf8");

test("server/routes.ts mengimpor buildFinalSystemPrompt dari ./lib/build-final-system-prompt", () => {
  // Izinkan named-import lain di kurung yang sama (mis. buildAgenticPrinciplesBlock)
  // selama buildFinalSystemPrompt tetap diimpor dari modul yang sama.
  const importRegex =
    /import\s*\{[^}]*\bbuildFinalSystemPrompt\b[^}]*\}\s*from\s*["']\.\/lib\/build-final-system-prompt["']/;
  assert.match(
    routesSource,
    importRegex,
    "routes.ts wajib mengimpor buildFinalSystemPrompt; jangan hapus import-nya saat refactor.",
  );
});

// Regex sengaja TIDAK mengunci nama argumen ke literal `agent`, supaya test
// tetap lulus kalau kelak ada refactor non-fungsional (mis. rename variabel
// jadi `theAgent`, atau spread props). Yang dijaga: helper-nya benar-benar
// dipanggil — bukan nama parameternya.
//
// Pakai dua regex: yang global khusus untuk hitung jumlah match, yang non-global
// untuk `assert.match` (regex global menyimpan `lastIndex` antar pemanggilan
// dan bisa bikin assertion berikutnya gagal spurious).
const HELPER_CALL_REGEX_GLOBAL = /buildFinalSystemPrompt\s*\(/g;
const HELPER_CALL_REGEX = /buildFinalSystemPrompt\s*\(/;

test("server/routes.ts memanggil buildFinalSystemPrompt minimal pada chat non-stream, stream, dan generateAIResponse (Telegram/WhatsApp)", () => {
  const matches = routesSource.match(HELPER_CALL_REGEX_GLOBAL) ?? [];
  // Baris import (`import { buildFinalSystemPrompt } from ...`) tidak diakhiri
  // "(" sehingga tidak ikut tertangkap. Hitungan ini murni call-site.
  const callCount = matches.length;

  assert.ok(
    callCount >= 3,
    `Harus ada minimal 3 pemanggilan buildFinalSystemPrompt(...) di routes.ts (chat non-stream, chat streaming, generateAIResponse), tapi hanya ditemukan ${callCount}. ` +
      "Pastikan semua endpoint chat tetap merakit prompt lewat helper ini.",
  );
});

test("server/routes.ts: handler chat non-stream POST /api/messages tetap memakai helper", () => {
  const messagesRouteIndex = routesSource.indexOf('app.post("/api/messages"');
  assert.ok(
    messagesRouteIndex !== -1,
    'Route handler app.post("/api/messages", ...) tidak ditemukan di routes.ts',
  );

  // Ambil ~6000 karakter setelah deklarasi handler — cukup untuk menutup body
  // handler tanpa terlalu loose. Kalau ke depan handler ini di-extract ke
  // file lain, test akan tetap menangkap regresi karena helper TIDAK lagi
  // dipanggil di lokasi ini.
  const slice = routesSource.slice(messagesRouteIndex, messagesRouteIndex + 6000);
  assert.match(
    slice,
    HELPER_CALL_REGEX,
    "Handler POST /api/messages harus memanggil buildFinalSystemPrompt(...). " +
      "Jika kamu memindahkan logika ini, pastikan helper tetap dipanggil di tempat baru.",
  );
});

test("server/routes.ts: handler chat streaming tetap memakai helper", () => {
  const streamRouteIndex = routesSource.indexOf('app.post("/api/messages/stream"');
  assert.ok(
    streamRouteIndex !== -1,
    'Route handler app.post("/api/messages/stream", ...) tidak ditemukan di routes.ts',
  );

  // Ambil blok handler sampai registrasi route berikutnya (`\n  app.`), bukan
  // jendela karakter tetap: handler streaming cukup panjang sehingga pemanggilan
  // helper berada >8000 char setelah deklarasi route (jendela tetap = false negative).
  const nextRouteIndex = routesSource.indexOf("\n  app.", streamRouteIndex + 1);
  const slice = routesSource.slice(
    streamRouteIndex,
    nextRouteIndex === -1 ? routesSource.length : nextRouteIndex,
  );
  assert.match(
    slice,
    HELPER_CALL_REGEX,
    "Handler POST /api/messages/stream harus memanggil buildFinalSystemPrompt(...). " +
      "Jika kamu memindahkan logika ini, pastikan helper tetap dipanggil di tempat baru.",
  );
});

test("server/routes.ts: helper generateAIResponse (dipakai Telegram/WhatsApp) tetap memakai helper", () => {
  const fnIndex = routesSource.indexOf("async function generateAIResponse");
  assert.ok(
    fnIndex !== -1,
    "Fungsi generateAIResponse(...) tidak ditemukan di routes.ts. " +
      "Kalau kamu mengganti namanya, perbarui test ini DAN pastikan helper buildFinalSystemPrompt tetap dipakai.",
  );

  const slice = routesSource.slice(fnIndex, fnIndex + 6000);
  assert.match(
    slice,
    HELPER_CALL_REGEX,
    "generateAIResponse harus memanggil buildFinalSystemPrompt(...) — Telegram/WhatsApp bergantung padanya untuk Kebijakan Agen.",
  );
});
