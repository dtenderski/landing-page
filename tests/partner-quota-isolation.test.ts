import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Regresi keamanan whitelabel reseller (mitra/partner).
//
// Alur reseller di `/api/messages/stream` bersifat sensitif keamanan:
//   1) MITRA di-resolve dari HOST permintaan (bukan sekadar agentId), agar satu
//      mitra tidak bisa menguras kuota mitra lain lewat domain lain yang menebak
//      agentId, dan agar kuota langganan PEMILIK agen tidak salah tertagih.
//   2) Kuota POOL mitra hanya boleh dikonsumsi SETELAH semua gerbang
//      akses/monetisasi/guest lolos — request yang ditolak tidak boleh memotong
//      kuota.
//   3) Agen NON-mitra tetap tunduk pada kuota trial/plan bulanan si pemilik.
//   4) Endpoint branding publik `/api/partner/by-host` TIDAK boleh membocorkan
//      defaultAgentId (kalau bocor, penyerang bisa memetakan host→agentId lalu
//      menyalahgunakan pool mitra dari domain lain).
//
// Test ini statis (membaca source routes.ts) — sengaja begitu agar tidak butuh
// DB/sesi/server hidup (cepat & deterministik) dan gagal keras kalau ada refactor
// yang diam-diam mengembalikan cross-domain drain yang baru saja diperbaiki.
// Pola mengikuti `tests/agent-authz-guard.test.ts`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesPath = resolve(__dirname, "../server/routes.ts");
const src = readFileSync(routesPath, "utf8");

// Ambil blok handler sebuah route: dari literal registrasinya sampai registrasi
// route berikutnya (`\n  app.` pada indentasi 2 spasi). Untuk route terakhir,
// pakai 6000 karakter sesudahnya sebagai batas aman. Handler stream sangat
// panjang — batas "route berikutnya" memang mencakup seluruh handler.
function routeBlock(registrationLiteral: string): string {
  const start = src.indexOf(registrationLiteral);
  assert.ok(
    start !== -1,
    `Registrasi route tidak ditemukan: ${registrationLiteral}. ` +
      "Kalau path/method-nya berubah, PERBARUI test ini — jangan hapus guard kuota/branding mitra.",
  );
  const nextIdx = src.indexOf("\n  app.", start + registrationLiteral.length);
  const end = nextIdx === -1 ? Math.min(src.length, start + 6000) : nextIdx;
  return src.slice(start, end);
}

const streamBlock = routeBlock('app.post("/api/messages/stream"');

// ── 1. Resolusi mitra: HOST + defaultAgentId, bukan agentId saja ────────────
test("stream me-resolve mitra dari HOST permintaan (bukan client body / agentId saja)", () => {
  // Host diambil dari header permintaan (server-side), dinormalkan (lowercase,
  // tanpa port). JANGAN percaya field host dari body yang bisa dipalsukan.
  assert.match(
    streamBlock,
    /const\s+_reqHost\s*=\s*String\(\s*req\.headers\.host\s*\|\|\s*""\s*\)\s*\.split\(":"\)\[0\]\.toLowerCase\(\)\.trim\(\)/,
    "Host mitra WAJIB diambil dari req.headers.host lalu dinormalkan (bukan dari body permintaan).",
  );
});

test("stream mengikat mitra ke partners.host + partners.active", () => {
  assert.match(
    streamBlock,
    /from\(partners\)[\s\S]{0,200}eq\(partners\.host,\s*_reqHost\)/,
    "Query mitra WAJIB memfilter partners.host === _reqHost.",
  );
  assert.match(
    streamBlock,
    /eq\(partners\.active,\s*true\)/,
    "Query mitra WAJIB memfilter partners.active === true (mitra nonaktif tidak boleh dipakai).",
  );
});

test("stream hanya set konteks mitra bila defaultAgentId === agent.id (host cocok BELUM cukup)", () => {
  // Ini gerbang kunci anti cross-domain drain: host mitra harus memang memakai
  // agen INI sebagai chatbot default-nya. Host cocok tapi agentId beda => TIDAK
  // ada konteks mitra (pool tidak tersentuh, model override tidak aktif).
  assert.match(
    streamBlock,
    /if\s*\(\s*pr\s*&&\s*pr\.defaultAgentId\s*===\s*String\(agent\.id\)\s*\)\s*_partnerForChat\s*=\s*pr\s*;/,
    "Konteks mitra HANYA boleh diset bila pr.defaultAgentId === String(agent.id). " +
      "Tanpa ini, host mitra bisa dipakai untuk menguras pool via agentId lain.",
  );
});

// ── 2. Kuota pool mitra dikonsumsi SETELAH semua gerbang lolos ──────────────
test("konsumsi kuota pool mitra terjadi SETELAH gerbang akses/monetisasi/guest", () => {
  const accessGateIdx = streamBlock.indexOf("assertCanAccessAgentChat(req, agent)");
  const monetizationIdx = streamBlock.indexOf("agent.requireRegistration");
  const guestGateIdx = streamBlock.indexOf("guest_limit_reached");
  const commitIdx = streamBlock.search(/_partnerForChat\s*&&\s*_partnerForChat\.monthlyQuota\s*>\s*0/);

  assert.ok(accessGateIdx !== -1, "stream harus punya gerbang assertCanAccessAgentChat.");
  assert.ok(monetizationIdx !== -1, "stream harus punya gerbang monetisasi (requireRegistration).");
  assert.ok(guestGateIdx !== -1, "stream harus punya gerbang guest (guest_limit_reached).");
  assert.ok(commitIdx !== -1, "stream harus punya blok konsumsi kuota pool mitra.");

  assert.ok(
    accessGateIdx < commitIdx,
    "Konsumsi kuota mitra HARUS setelah gerbang akses (request tanpa akses tak boleh memotong kuota).",
  );
  assert.ok(
    monetizationIdx < commitIdx,
    "Konsumsi kuota mitra HARUS setelah gerbang monetisasi.",
  );
  assert.ok(
    guestGateIdx < commitIdx,
    "Konsumsi kuota mitra HARUS setelah gerbang guest (request yang ditolak tak boleh memotong kuota).",
  );
});

test("kuota pool mitra di-refund lalu 429 saat melewati batas (request ditolak tidak menyisakan potongan)", () => {
  const commitIdx = streamBlock.search(/_partnerForChat\s*&&\s*_partnerForChat\.monthlyQuota\s*>\s*0/);
  const commitBlock = streamBlock.slice(commitIdx, commitIdx + 1400);
  // Increment atomik + reset bulan.
  assert.match(
    commitBlock,
    /quotaUsed:\s*sqlExpr`CASE WHEN[\s\S]*?\+ 1 ELSE 1 END`/,
    "Konsumsi kuota mitra harus increment atomik dengan reset per bulan (CASE WHEN quotaMonth ...).",
  );
  // Refund saat melewati batas.
  assert.match(
    commitBlock,
    /GREATEST\(\$\{partners\.quotaUsed\}\s*-\s*1,\s*0\)/,
    "Saat melewati batas, quotaUsed WAJIB di-refund (GREATEST(quotaUsed - 1, 0)) sebelum menolak.",
  );
  assert.match(
    commitBlock,
    /status\(429\)[\s\S]*?partner_quota_exceeded/,
    "Melewati batas kuota mitra WAJIB mengembalikan 429 reason partner_quota_exceeded.",
  );
});

test("konsumsi kuota mitra terjadi SEBELUM header SSE dikirim (bisa tolak 429 tanpa membuka stream)", () => {
  const commitIdx = streamBlock.search(/_partnerForChat\s*&&\s*_partnerForChat\.monthlyQuota\s*>\s*0/);
  const sseIdx = streamBlock.indexOf("text/event-stream");
  assert.ok(sseIdx !== -1, "stream harus menyetel header text/event-stream.");
  assert.ok(
    commitIdx < sseIdx,
    "Konsumsi/penolakan kuota mitra HARUS sebelum header SSE — agar 429 bisa dikirim sebagai JSON biasa.",
  );
});

// ── 3. Agen NON-mitra: kuota trial/plan pemilik tetap ditegakkan ────────────
test("kuota trial pemilik hanya dilewati untuk agen mitra (non-mitra tetap ditegakkan)", () => {
  assert.match(
    streamBlock,
    /if\s*\(\s*!_partnerForChat\s*&&\s*_ownerIdForQuota\s*\)/,
    "Cek kuota trial WAJIB dibungkus !_partnerForChat — agen non-mitra tetap kena kuota trial pemilik.",
  );
  assert.match(
    streamBlock,
    /trial_quota_exceeded/,
    "Kuota trial harus bisa menolak dengan reason trial_quota_exceeded.",
  );
});

test("kuota bulanan plan pemilik hanya dilewati untuk agen mitra (non-mitra tetap ditegakkan)", () => {
  assert.match(
    streamBlock,
    /if\s*\(\s*!_partnerForChat\s*&&\s*\(req as any\)\.isAuthenticated/,
    "Cek kuota plan bulanan WAJIB dibungkus !_partnerForChat — agen non-mitra tetap kena kuota pemilik.",
  );
  assert.match(
    streamBlock,
    /owner_quota_exceeded/,
    "Kuota plan bulanan harus bisa menolak dengan reason owner_quota_exceeded.",
  );
});

// ── 4. Override model hemat mitra hanya aktif bila mitra ter-resolve ─────────
test("override cheapModel hanya berlaku saat konteks mitra ter-resolve", () => {
  assert.match(
    streamBlock,
    /if\s*\(\s*_partnerForChat\?\.cheapModel\s*\)\s*\{[\s\S]{0,80}agentModel\s*=\s*_partnerForChat\.cheapModel/,
    "Override model hemat WAJIB dibungkus _partnerForChat?.cheapModel — agen non-mitra tak boleh terpengaruh.",
  );
});

// ── 5. /api/partner/by-host TIDAK membocorkan defaultAgentId ─────────────────
test("GET /api/partner/by-host TIDAK mengembalikan defaultAgentId (cegah pemetaan host→agentId)", () => {
  const block = routeBlock('app.get("/api/partner/by-host"');
  // Endpoint publik ini hanya mengembalikan field branding yang aman.
  assert.ok(
    !/defaultAgentId/.test(block),
    "Respon /api/partner/by-host TIDAK boleh menyertakan defaultAgentId — kebocoran ini memudahkan " +
      "penyerang memetakan host mitra ke agentId lalu menyalahgunakan pool kuota dari domain lain.",
  );
  // Sanity: juga tidak membocorkan akuntansi kuota internal.
  assert.ok(
    !/quotaUsed|monthlyQuota|quotaMonth/.test(block),
    "Respon /api/partner/by-host TIDAK boleh membocorkan akuntansi kuota internal mitra.",
  );
  // Positif: field branding yang memang diekspos ada.
  assert.match(block, /brandName:\s*row\.brandName/, "by-host harus mengekspos brandName untuk whitelabel.");
});
