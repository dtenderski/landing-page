import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { HOSTING_PERIODS, SERVICE_TIERS } from "../client/src/data/pricing";

// Regresi — kunci aturan kanonik "harga satu sumber" (rule #6):
// SEMUA angka harga platform (langganan durasi + tier jasa) HARUS berasal dari
// `client/src/data/pricing.ts`. Halaman tidak boleh menulis ulang angka harga
// secara manual; kalau drift, /pricing & /checkout bisa menampilkan harga beda.
//
// Test bersifat statis + import data murni (tanpa DB/server/React render) agar
// cepat, deterministik, dan gagal keras kalau ada yang menyalin angka harga
// kembali ke dalam halaman. Pola mengikuti `tests/routes-helper-usage.test.ts`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(resolve(__dirname, rel), "utf8");

/** "Rp 1.499.000" → 1499000 */
function parseRupiah(s: string): number {
  return Number(s.replace(/[^0-9]/g, ""));
}

// ── 1. Integritas data kanonik: string harga ↔ angka harus cocok ─────────────
// Bug paling mungkin di masa depan: edit string tapi lupa angkanya (atau
// sebaliknya). Kunci keduanya supaya selalu sinkron di dalam pricing.ts sendiri.
test("SERVICE_TIERS: price string cocok dengan numeric amount", () => {
  assert.equal(SERVICE_TIERS.length, 4, "Jumlah tier jasa kanonik harus tetap 4.");
  for (const t of SERVICE_TIERS) {
    assert.equal(
      parseRupiah(t.price),
      t.amount,
      `${t.tier}: price "${t.price}" tidak cocok dengan amount ${t.amount}.`,
    );
  }
});

test("HOSTING_PERIODS: price string cocok dengan numeric priceNum", () => {
  assert.equal(HOSTING_PERIODS.length, 4, "Jumlah periode hosting kanonik harus tetap 4.");
  for (const h of HOSTING_PERIODS) {
    assert.equal(
      parseRupiah(h.price),
      h.priceNum,
      `${h.key}: price "${h.price}" tidak cocok dengan priceNum ${h.priceNum}.`,
    );
  }
});

// ── 2. Halaman harga harus impor dari sumber kanonik ─────────────────────────
const pricingPage = read("../client/src/pages/pricing.tsx");
const checkoutPage = read("../client/src/pages/checkout.tsx");

test("pricing.tsx & checkout.tsx impor dari @/data/pricing", () => {
  assert.match(
    pricingPage,
    /from\s+["']@\/data\/pricing["']/,
    "pricing.tsx harus mengambil harga dari @/data/pricing.",
  );
  assert.match(
    checkoutPage,
    /from\s+["']@\/data\/pricing["']/,
    "checkout.tsx harus mengambil harga dari @/data/pricing.",
  );
});

// ── 3. Guard: harga jasa kanonik TIDAK boleh ditulis manual di halaman ───────
// Angka tier jasa bersifat khas (1.499 / 2.499 / 4.900 / 7.490 rb) dan tidak
// dipakai katalog add-on/modul, jadi aman dipakai sebagai sentinel anti-drift.
// (Harga hosting seperti 299.000 sengaja TIDAK di-scan karena bertabrakan
//  dengan katalog add-on yang memang punya angka sendiri.)
test("tidak ada harga jasa kanonik yang di-hardcode di halaman", () => {
  const jasaPriceStrings = SERVICE_TIERS.map((t) => t.price); // "Rp 1.499.000", ...
  const jasaAmounts = SERVICE_TIERS.map((t) => String(t.amount)); // "1499000", ...

  for (const page of [
    { name: "pricing.tsx", src: pricingPage },
    { name: "checkout.tsx", src: checkoutPage },
  ]) {
    for (const lit of jasaPriceStrings) {
      assert.ok(
        !page.src.includes(lit),
        `${page.name} menulis harga jasa "${lit}" manual — ambil dari SERVICE_TIERS.price di @/data/pricing.`,
      );
    }
    for (const num of jasaAmounts) {
      assert.ok(
        !page.src.includes(num),
        `${page.name} menulis angka harga jasa ${num} manual — ambil dari SERVICE_TIERS.amount di @/data/pricing.`,
      );
    }
  }
});
