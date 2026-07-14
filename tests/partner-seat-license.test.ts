import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Regresi Lisensi Seat Asosiasi (Model B) — mengunci hasil review arsitek.
//
// Tiga invarian yang WAJIB tetap ada agar fitur seat aman:
//   1) Klaim/cabut seat lewat method ATOMIK (claimPartnerSeat/revokePartnerSeat),
//      BUKAN pola lama count-lalu-insert atau provisioning yang di-.catch (drift).
//   2) claimPartnerSeat di db-storage berjalan dalam satu transaksi DB +
//      pg_advisory_xact_lock per-mitra (menutup race kapasitas).
//   3) Mode pooled (seatCapacity=0) TETAP perilaku lama: SETIAP endpoint
//      partner-admin yang MEMUTASI seat (POST + DELETE /api/partner/me/seats)
//      wajib menolak (guard `seatCapacity <= 0`), demi kompatibilitas mundur.
//
// Test STATIS (membaca source) — sengaja begitu: cepat, deterministik, tanpa DB,
// dan gagal keras kalau refactor diam-diam menghapus guard/atomisitas. Pola ini
// mengikuti tests/agent-authz-guard.test.ts & tests/routes-helper-usage.test.ts.

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesSrc = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
const dbStorageSrc = readFileSync(resolve(__dirname, "../server/db-storage.ts"), "utf8");

// Ambil blok handler sebuah route: dari literal registrasinya sampai registrasi
// route berikutnya (`\n  app.`). Untuk route terakhir, pakai 4000 char sesudahnya.
function routeBlock(src: string, registrationLiteral: string): string {
  const start = src.indexOf(registrationLiteral);
  assert.ok(
    start !== -1,
    `Registrasi route tidak ditemukan: ${registrationLiteral}. ` +
      "Kalau path/method-nya berubah, PERBARUI test ini — jangan hapus guard/atomisitasnya.",
  );
  const nextIdx = src.indexOf("\n  app.", start + registrationLiteral.length);
  const end = nextIdx === -1 ? Math.min(src.length, start + 4000) : nextIdx;
  return src.slice(start, end);
}

// ── 1. Route MEMAKAI method atomik, BUKAN pola lama ────────────────────────────
const SEAT_ADD_ROUTES = [
  'app.post("/api/admin/partners/:id/seats"',
  'app.post("/api/partner/me/seats"',
];
const SEAT_REMOVE_ROUTES = [
  'app.delete("/api/admin/partners/:id/seats"',
  'app.delete("/api/partner/me/seats"',
];

for (const reg of SEAT_ADD_ROUTES) {
  test(`${reg} — menambah seat lewat storage.claimPartnerSeat (atomik)`, () => {
    const block = routeBlock(routesSrc, reg);
    assert.match(
      block,
      /storage\.claimPartnerSeat\s*\(/,
      `${reg} wajib memanggil storage.claimPartnerSeat(...) — jangan kembali ke ` +
        "pola count-lalu-insert (rawan race) atau provisioning terpisah (rawan drift).",
    );
    // Anti-regresi: provisioning langganan TIDAK boleh dipanggil terpisah dengan
    // .catch di jalur ini (dulu penyebab drift — sekarang di dalam transaksi).
    assert.doesNotMatch(
      block,
      /provisionPartnerSeatSubscription[\s\S]*?\.catch/,
      `${reg} tidak boleh memakai provisionPartnerSeatSubscription(...).catch terpisah — ` +
        "provisioning harus atomik di dalam claimPartnerSeat.",
    );
  });
}

for (const reg of SEAT_REMOVE_ROUTES) {
  test(`${reg} — mencabut seat lewat storage.revokePartnerSeat (atomik)`, () => {
    const block = routeBlock(routesSrc, reg);
    assert.match(
      block,
      /storage\.revokePartnerSeat\s*\(/,
      `${reg} wajib memanggil storage.revokePartnerSeat(...) — cabut langganan + ` +
        "hapus akses harus atomik (jangan pisah removeCollaborator + deactivate .catch).",
    );
    assert.doesNotMatch(
      block,
      /deactivatePartnerSeatSubscription[\s\S]*?\.catch/,
      `${reg} tidak boleh memakai deactivatePartnerSeatSubscription(...).catch terpisah — ` +
        "pencabutan langganan harus atomik di dalam revokePartnerSeat.",
    );
  });
}

// ── 2. Atomisitas: transaksi + advisory lock per-mitra di claimPartnerSeat ──────
test("db-storage.claimPartnerSeat berjalan dalam db.transaction + pg_advisory_xact_lock", () => {
  const idx = dbStorageSrc.indexOf("async claimPartnerSeat(");
  assert.ok(idx !== -1, "Method claimPartnerSeat(...) tidak ditemukan di db-storage.ts.");
  // Ambil isi method sampai batas aman.
  const block = dbStorageSrc.slice(idx, idx + 4000);
  assert.match(
    block,
    /db\.transaction\s*\(/,
    "claimPartnerSeat wajib memakai db.transaction(...) — cek kapasitas + tulis akses + " +
      "provision langganan harus satu transaksi (fail-closed, tanpa drift).",
  );
  assert.match(
    block,
    /pg_advisory_xact_lock/,
    "claimPartnerSeat wajib mengambil pg_advisory_xact_lock per-mitra sebelum cek kapasitas — " +
      "tanpa lock, dua klaim serentak bisa melampaui kapasitas berbayar (race).",
  );
});

// ── 3. Pooled mode (seatCapacity=0): SEMUA mutasi partner-admin ditolak ─────────
for (const reg of [
  'app.post("/api/partner/me/seats"',
  'app.delete("/api/partner/me/seats"',
]) {
  test(`${reg} — menolak mode pooled (seatCapacity<=0) demi kompatibilitas mundur`, () => {
    const block = routeBlock(routesSrc, reg);
    assert.match(
      block,
      /partner\.seatCapacity\s*\?\?\s*0\)\s*<=\s*0/,
      `${reg} wajib punya guard (partner.seatCapacity ?? 0) <= 0 → 400. ` +
        "Mitra pooled TIDAK boleh mutasi keanggotaan lewat self-service (perilaku lama).",
    );
  });
}
