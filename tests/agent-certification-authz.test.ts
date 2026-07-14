import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Regresi Loop Publikasi #5–#6 — kunci aturan "Bersertifikat" (isCertified):
// status ini HANYA boleh di-set admin. Kreator TIDAK boleh menyertifikasi
// agennya sendiri lewat jalur tulis apa pun.
//
// Kenapa penting: badge hijau "Bersertifikat" di Store adalah klaim otoritas
// platform (agen sudah lulus workshop). Kalau owner bisa set sendiri, badge itu
// jadi menyesatkan pembeli. `PATCH /api/agents/:id` meneruskan `req.body` MENTAH
// ke storage.updateAgent — jadi field sensitif WAJIB di-strip eksplisit di route
// (zod tidak divalidasi pada PATCH). `POST /api/agents` di-strip juga demi
// konsistensi (cegah latent risk kalau mapping createAgent berubah).
//
// Test bersifat statis (baca source routes.ts) — tanpa DB/sesi/server, gagal
// keras kalau refactor diam-diam menghapus guard. Pola: agent-authz-guard.test.ts.

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesPath = resolve(__dirname, "../server/routes.ts");
const src = readFileSync(routesPath, "utf8");

function routeBlock(registrationLiteral: string): string {
  const start = src.indexOf(registrationLiteral);
  assert.ok(
    start !== -1,
    `Registrasi route tidak ditemukan: ${registrationLiteral}. ` +
      "Kalau path/method berubah, PERBARUI test ini — jangan hapus guard-nya.",
  );
  const nextIdx = src.indexOf("\n  app.", start + registrationLiteral.length);
  const end = nextIdx === -1 ? Math.min(src.length, start + 4000) : nextIdx;
  return src.slice(start, end);
}

test("PATCH /api/agents/:id men-strip isCertified untuk non-admin (owner tak bisa self-certify)", () => {
  const block = routeBlock('app.patch("/api/agents/:id"');
  assert.match(
    block,
    /!isAdminUpdate[\s\S]*hasOwnProperty[\s\S]*isCertified[\s\S]*delete[\s\S]*isCertified/,
    "PATCH /api/agents/:id WAJIB menghapus isCertified dari req.body bila pemanggil bukan admin. " +
      "Tanpa ini, pemilik agen bisa menyertifikasi agennya sendiri langsung via PATCH.",
  );
});

test("POST /api/agents men-strip isCertified untuk non-admin (create tak bisa self-certify)", () => {
  const block = routeBlock('app.post("/api/agents"');
  assert.match(
    block,
    /!isAdminCreate[\s\S]*hasOwnProperty[\s\S]*isCertified[\s\S]*delete[\s\S]*isCertified/,
    "POST /api/agents WAJIB menghapus isCertified dari input bila pemanggil bukan admin, " +
      "supaya kreator tak bisa membuat agen yang langsung berstatus Bersertifikat.",
  );
});

test("Endpoint sertifikasi admin dijaga requireAdmin (jalur tunggal & auditable untuk isCertified)", () => {
  assert.match(
    src,
    /app\.post\(\s*["']\/api\/admin\/agents\/:id\/certification["']\s*,\s*requireAdmin\s*,/,
    "POST /api/admin/agents/:id/certification WAJIB dijaga requireAdmin — hanya admin yang boleh " +
      "menaikkan/menurunkan status Bersertifikat.",
  );
  const block = routeBlock('app.post("/api/admin/agents/:id/certification"');
  assert.match(
    block,
    /isCertified\s*:\s*certified/,
    "Endpoint sertifikasi admin harus benar-benar menulis isCertified via updateAgent.",
  );
  assert.match(
    block,
    /\[CERTIFICATION\]/,
    "Endpoint sertifikasi admin harus mencatat audit log (mis. tag [CERTIFICATION]).",
  );
});
