import { test } from "node:test";
import assert from "node:assert/strict";

import { PostgresRateLimitStore } from "../server/lib/rate-limiter";

// Regresi — menjaga tabel `rate_limit_buckets` TIDAK membengkak tanpa batas.
// Bucket per-menit lahir 1 baris per IP/akun per menit lalu menjadi baris yatim
// yang kedaluwarsa. Pembersihan UTAMA kini DIPICU LALU-LINTAS (delete-on-write)
// di `PostgresRateLimitStore.hit`, tidak bergantung pada satu instance yang harus
// tetap hidup untuk menjalankan `setInterval`.

// Query palsu yang mensimulasikan satu tabel { key -> {count, resetAt} } dan
// mengeksekusi UPSERT `hit` + DELETE bounded `pruneExpired` dengan benar.
function makeFakeStore() {
  const table = new Map<string, { count: number; resetAt: number }>();
  const calls: string[] = [];
  const query = async (text: string, params: any[]) => {
    const kind = text.trim().slice(0, 6).toUpperCase();
    calls.push(kind);
    if (kind.startsWith("INSERT")) {
      const [key, resetAt, now] = params as [string, number, number];
      const existing = table.get(key);
      let row: { count: number; resetAt: number };
      if (!existing || existing.resetAt <= now) row = { count: 1, resetAt };
      else row = { count: existing.count + 1, resetAt: existing.resetAt };
      table.set(key, row);
      return { rows: [{ count: row.count, reset_at: row.resetAt }] };
    }
    if (kind.startsWith("DELETE")) {
      const [now, limit] = params as [number, number];
      const expired = [...table.entries()]
        .filter(([, v]) => v.resetAt <= now)
        .slice(0, limit)
        .map(([k]) => k);
      for (const k of expired) table.delete(k);
      return { rows: expired.map((bucket_key) => ({ bucket_key })) };
    }
    return { rows: [] };
  };
  return { table, calls, query };
}

// ── 1. delete-on-write: hit dengan peluang penuh ikut memangkas baris basi ────
test("hit memicu pemangkasan baris kedaluwarsa (delete-on-write)", async () => {
  const { table, calls, query } = makeFakeStore();
  const store = new PostgresRateLimitStore(query, {
    pruneProbability: 1, // paksa selalu memangkas
    random: () => 0, // < probability → selalu memicu
  });

  const now = 1_000_000;
  // Tabur 5 baris yatim yang SUDAH kedaluwarsa (churn per-menit yang lama).
  for (let i = 0; i < 5; i++) {
    table.set(`minute:stale-${i}`, { count: 1, resetAt: now - 1 });
  }
  assert.equal(table.size, 5, "prasyarat: 5 baris basi tertanam");

  // Satu hit baru → menulis 1 baris DAN memangkas baris kedaluwarsa.
  const hit = await store.hit("minute:live", 60_000, now);
  assert.equal(hit.count, 1);
  // Beri kesempatan pemangkasan fire-and-forget selesai.
  await new Promise((r) => setImmediate(r));

  assert.ok(calls.includes("DELETE"), "hit harus mengeluarkan DELETE pemangkas");
  // Semua 5 baris basi terhapus; hanya baris live yang tersisa.
  assert.equal(table.size, 1, "baris kedaluwarsa harus dipangkas");
  assert.ok(table.has("minute:live"), "baris aktif tidak boleh terhapus");
});

// ── 2. probabilitas 0 → tidak pernah memangkas di jalur hit ───────────────────
test("pruneProbability=0 → hit tidak pernah DELETE", async () => {
  const { calls, query } = makeFakeStore();
  const store = new PostgresRateLimitStore(query, { pruneProbability: 0 });
  for (let i = 0; i < 20; i++) {
    await store.hit(`minute:k${i}`, 60_000, 2_000_000);
  }
  await new Promise((r) => setImmediate(r));
  assert.ok(!calls.includes("DELETE"), "tanpa peluang, hit tidak boleh DELETE");
});

// ── 3. pruneExpired menghapus HANYA yang kedaluwarsa & menghormati LIMIT ──────
test("pruneExpired: bounded LIMIT, hanya baris kedaluwarsa", async () => {
  const { table, query } = makeFakeStore();
  const store = new PostgresRateLimitStore(query);
  const now = 3_000_000;

  // 10 basi + 3 masih aktif.
  for (let i = 0; i < 10; i++) table.set(`old-${i}`, { count: 1, resetAt: now - 1 });
  for (let i = 0; i < 3; i++) table.set(`live-${i}`, { count: 1, resetAt: now + 60_000 });

  // Batch dibatasi 4 → hanya 4 basi terhapus per panggilan.
  const first = await store.pruneExpired(now, 4);
  assert.equal(first, 4, "batch pertama menghapus tepat LIMIT baris");

  // Kuras sisanya.
  let total = first;
  for (let i = 0; i < 10; i++) {
    const n = await store.pruneExpired(now, 4);
    total += n;
    if (n === 0) break;
  }
  assert.equal(total, 10, "seluruh 10 baris basi akhirnya terpangkas");
  assert.equal(table.size, 3, "3 baris aktif harus tetap ada");
});

// ── 3b. Race-safe: baris yang di-reset sebelum DELETE tidak boleh terhapus ────
// Regresi bug review: baris terpilih sebagai kedaluwarsa lalu di-reset `hit()`
// (window baru) sebelum DELETE. Query WAJIB mengulang `reset_at <= now` di klausa
// DELETE luar agar counter aktif tidak ikut terhapus.
test("pruneExpired tidak menghapus baris yang sudah di-reset (race-safe)", async () => {
  const { table, query } = makeFakeStore();
  const now = 5_000_000;

  // Baris tampak kedaluwarsa saat "diseleksi"...
  table.set("renewed", { count: 1, resetAt: now - 1 });
  table.set("still-old", { count: 1, resetAt: now - 1 });

  // ...tetapi tepat sebelum DELETE, `renewed` di-reset ke window baru (masa depan).
  // Bungkus query agar mensimulasikan renew tepat sebelum eksekusi DELETE.
  const racingQuery = async (text: string, params: any[]) => {
    if (text.trim().toUpperCase().startsWith("DELETE")) {
      table.set("renewed", { count: 1, resetAt: now + 60_000 });
    }
    return query(text, params);
  };
  const store = new PostgresRateLimitStore(racingQuery);

  const deleted = await store.pruneExpired(now, 100);
  assert.equal(deleted, 1, "hanya baris yang masih kedaluwarsa yang terhapus");
  assert.ok(table.has("renewed"), "baris yang di-reset TIDAK boleh terhapus");
  assert.ok(!table.has("still-old"), "baris kedaluwarsa harus terhapus");
});

// ── 3c. SQL DELETE mengulang cek reset_at di klausa luar (bukan hanya subquery) ─
test("SQL pruneExpired mengulang reset_at di DELETE luar", async () => {
  let deleteSql = "";
  const query = async (text: string) => {
    if (text.trim().toUpperCase().startsWith("DELETE")) deleteSql = text;
    return { rows: [] };
  };
  const store = new PostgresRateLimitStore(query);
  await store.pruneExpired(1, 10);

  const outer = deleteSql.slice(0, deleteSql.indexOf("bucket_key IN"));
  assert.match(
    outer,
    /reset_at\s*<=\s*\$1/,
    "klausa DELETE luar harus mengecek ulang reset_at <= now",
  );
});

// ── 4. Pemangkasan fire-and-forget yang gagal TIDAK mematikan hit ────────────
test("pemangkasan gagal tidak menggagalkan hit", async () => {
  const table = new Map<string, { count: number; resetAt: number }>();
  const query = async (text: string, params: any[]) => {
    if (text.trim().toUpperCase().startsWith("DELETE")) {
      throw new Error("simulasi DB error saat prune");
    }
    const [key, resetAt, now] = params as [string, number, number];
    const existing = table.get(key);
    const row =
      !existing || existing.resetAt <= now
        ? { count: 1, resetAt }
        : { count: existing.count + 1, resetAt: existing.resetAt };
    table.set(key, row);
    return { rows: [{ count: row.count, reset_at: row.resetAt }] };
  };
  const store = new PostgresRateLimitStore(query, {
    pruneProbability: 1,
    random: () => 0,
  });

  const hit = await store.hit("minute:live", 60_000, 4_000_000);
  assert.equal(hit.count, 1, "hit tetap sukses meski prune gagal");
  await new Promise((r) => setImmediate(r));
});
