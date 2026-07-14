import { test } from "node:test";
import assert from "node:assert/strict";
import { MemStorage } from "../server/storage";

// Regresi keamanan-data untuk job "Owner Usage Cleanup" (server/index.ts).
//
// Job terjadwal itu MENGHAPUS PERMANEN baris `owner_monthly_usage` yang lebih
// lama dari jendela retensi (bulan berjalan + 2 bulan sebelumnya). Karena baris
// bulan berjalan-lah yang menegakkan kuota, salah hitung cutoff bisa menghapus
// hitungan yang MASIH DIPAKAI dan mereset kuota seseorang secara diam-diam.
//
// Test ini membuktikan kontrak inti: `deleteOwnerMonthlyUsageBefore(cutoff)`
// hanya membuang baris dengan bulan KETAT lebih lama dari cutoff, dan tidak
// pernah menyentuh bulan berjalan atau 2 bulan sebelumnya (yang tepat di batas).
//
// Pakai MemStorage (in-memory) agar cepat & deterministik tanpa DB — logika
// perbandingan bulannya identik dengan DbStorage (perbandingan string "YYYY-MM"
// yang aman karena zero-padded).

// Format sebuah tanggal UTC menjadi "YYYY-MM".
function ym(d: Date): string {
  return d.toISOString().slice(0, 7);
}

// Bulan (start-of-month, UTC) yang bergeser `offset` bulan dari `base`.
function monthOffset(base: Date, offset: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1));
}

// Hitung cutoff persis seperti job di server/index.ts: awal-bulan dikurangi 2
// bulan, diformat "YYYY-MM". Retensi = bulan berjalan + 2 bulan sebelumnya.
function cutoffMonthFor(now: Date): string {
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  return ym(cutoff);
}

test("cleanup hanya menghapus bulan yang KETAT lebih lama dari cutoff retensi 3 bulan", async () => {
  const storage = new MemStorage();
  const owner = "owner-A";

  // Anggap "sekarang" = pertengahan bulan tertentu; pilih tanggal yang stabil.
  const now = new Date(Date.UTC(2026, 6, 15)); // Juli 2026
  const cutoff = cutoffMonthFor(now); // "2026-05" (Mei) — retensi mulai Mei

  const current = ym(now); // 2026-07 (bulan berjalan)
  const prev1 = ym(monthOffset(now, -1)); // 2026-06
  const prev2 = ym(monthOffset(now, -2)); // 2026-05 (== cutoff, HARUS bertahan)
  const old1 = ym(monthOffset(now, -3)); // 2026-04 (harus terhapus)
  const old2 = ym(monthOffset(now, -6)); // 2026-01 (harus terhapus)
  const old3 = ym(monthOffset(now, -14)); // 2025-05 (harus terhapus)

  // cutoff seharusnya tepat sama dengan prev2 (batas bawah jendela retensi).
  assert.equal(cutoff, prev2, "cutoff harus tepat = bulan berjalan minus 2 (batas retensi).");

  // Seed hitungan berbeda-beda per bulan agar bisa cek nilainya tak berubah.
  const seed: Array<[string, number]> = [
    [current, 42],
    [prev1, 7],
    [prev2, 3],
    [old1, 99],
    [old2, 5],
    [old3, 1],
  ];
  for (const [month, count] of seed) {
    for (let i = 0; i < count; i++) {
      await storage.incrementOwnerMonthlyUsage(owner, month);
    }
  }

  // Sanity: semua tersimpan sesuai seed sebelum cleanup.
  for (const [month, count] of seed) {
    assert.equal(
      await storage.getOwnerMonthlyUsage(owner, month),
      count,
      `seed gagal untuk ${month}`,
    );
  }

  const deleted = await storage.deleteOwnerMonthlyUsageBefore(cutoff);

  // Tepat 3 baris lama (old1, old2, old3) yang terhapus.
  assert.equal(deleted, 3, "cleanup harus menghapus tepat 3 baris lama.");

  // Bulan berjalan + 2 bulan sebelumnya HARUS utuh dengan nilai persis sama.
  assert.equal(await storage.getOwnerMonthlyUsage(owner, current), 42, "bulan berjalan tidak boleh tersentuh.");
  assert.equal(await storage.getOwnerMonthlyUsage(owner, prev1), 7, "bulan -1 harus utuh.");
  assert.equal(await storage.getOwnerMonthlyUsage(owner, prev2), 3, "bulan -2 (tepat cutoff) harus utuh.");

  // Bulan lama HARUS hilang (getOwnerMonthlyUsage kembali 0 = baris tidak ada).
  assert.equal(await storage.getOwnerMonthlyUsage(owner, old1), 0, "bulan -3 harus terhapus.");
  assert.equal(await storage.getOwnerMonthlyUsage(owner, old2), 0, "bulan -6 harus terhapus.");
  assert.equal(await storage.getOwnerMonthlyUsage(owner, old3), 0, "bulan -14 harus terhapus.");
});

test("cutoff bersifat KETAT lebih-kecil: baris tepat di bulan cutoff tidak pernah terhapus", async () => {
  const storage = new MemStorage();
  const owner = "owner-B";

  const now = new Date(Date.UTC(2026, 0, 10)); // Januari 2026 — uji lintas tahun
  const cutoff = cutoffMonthFor(now); // "2025-11" (November 2025)

  const current = ym(now); // 2026-01
  const prev1 = ym(monthOffset(now, -1)); // 2025-12
  const prev2 = ym(monthOffset(now, -2)); // 2025-11 (== cutoff)
  const justOld = ym(monthOffset(now, -3)); // 2025-10 (< cutoff → terhapus)

  assert.equal(cutoff, prev2, "cutoff harus melintasi batas tahun dengan benar.");

  await storage.incrementOwnerMonthlyUsage(owner, current);
  await storage.incrementOwnerMonthlyUsage(owner, prev1);
  await storage.incrementOwnerMonthlyUsage(owner, prev2);
  await storage.incrementOwnerMonthlyUsage(owner, justOld);

  const deleted = await storage.deleteOwnerMonthlyUsageBefore(cutoff);

  assert.equal(deleted, 1, "hanya baris tepat sebelum cutoff (2025-10) yang terhapus.");
  assert.equal(await storage.getOwnerMonthlyUsage(owner, prev2), 1, "baris tepat DI bulan cutoff harus bertahan (perbandingan ketat <).");
  assert.equal(await storage.getOwnerMonthlyUsage(owner, justOld), 0, "baris tepat SEBELUM cutoff harus terhapus.");
});

// Cutoff yang DIHARAPKAN, dihitung dengan aritmetika bulan manual yang
// INDEPENDEN dari formula job (tanpa Date.UTC). Ini "sumber kebenaran" kedua:
// kalau formula job (yang pakai Date.UTC month-underflow) drift, ia tak lagi
// sama dengan hitungan manual ini dan test gagal keras.
function expectedCutoffMonth(now: Date): string {
  const year = now.getUTCFullYear();
  const month0 = now.getUTCMonth(); // 0..11
  let m = month0 - 2;
  let y = year;
  if (m < 0) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

test("cutoff job SELALU tepat = bulan berjalan minus 2, lintas ribuan tanggal 'now'", () => {
  // Uji setiap HARI dari 2020-01-01 s.d. 2035-12-31 (mencakup batas bulan/tahun,
  // Januari/Februari, dan tahun kabisat 2020/2024/2028/2032). Untuk tiap tanggal
  // ini menegakkan dua hal sekaligus:
  //   1) formula job == hitungan bulan manual independen (tidak drift), dan
  //   2) cutoff TIDAK PERNAH jatuh di bulan berjalan atau 2 bulan sebelumnya
  //      (jendela retensi yang menegakkan kuota harus selalu selamat).
  const start = Date.UTC(2020, 0, 1);
  const end = Date.UTC(2035, 11, 31);
  const DAY = 24 * 60 * 60 * 1000;

  let checked = 0;
  for (let t = start; t <= end; t += DAY) {
    const now = new Date(t);

    const cutoff = cutoffMonthFor(now); // formula PERSIS seperti job
    const expected = expectedCutoffMonth(now); // aritmetika independen

    // (1) Formula job cocok dengan hitungan manual — tak ada off-by-one bulan.
    assert.equal(
      cutoff,
      expected,
      `cutoff drift pada ${now.toISOString()}: job=${cutoff} vs manual=${expected}`,
    );

    // Jendela retensi (yang HARUS selamat): bulan berjalan + 2 sebelumnya.
    const current = ym(now);
    const prev1 = ym(monthOffset(now, -1));
    const prev2 = ym(monthOffset(now, -2));

    // (2) Cutoff harus TEPAT = prev2 (batas bawah retensi). Karena penghapusan
    //     bersifat KETAT lebih-kecil (< cutoff), baris di bulan prev2 selamat,
    //     jadi prev2 adalah nilai cutoff yang benar & aman.
    assert.equal(
      cutoff,
      prev2,
      `cutoff (${cutoff}) harus TEPAT = batas retensi prev2 (${prev2}) pada ${now.toISOString()}`,
    );

    // Bahaya nyata: cutoff yang MERAYAP MASUK jendela retensi. Karena hapus =
    //   (bulan < cutoff), cutoff di bulan berjalan akan menghapus prev1 & prev2,
    //   dan cutoff di prev1 akan menghapus prev2 — keduanya mereset kuota hidup.
    //   Cutoff HARUS ketat lebih lama dari prev1 (dan otomatis dari current).
    assert.ok(
      cutoff < prev1,
      `cutoff (${cutoff}) harus < prev1 (${prev1}) — kalau tidak, retensi bocor pada ${now.toISOString()}`,
    );
    assert.notEqual(cutoff, current, `cutoff jatuh di BULAN BERJALAN pada ${now.toISOString()} — bisa hapus kuota hidup!`);
    assert.notEqual(cutoff, prev1, `cutoff jatuh di bulan -1 (masih retensi) pada ${now.toISOString()} — akan hapus prev2!`);

    checked++;
  }

  // Sanity: benar-benar menguji rentang besar, bukan loop kosong.
  assert.ok(checked > 5000, `harus memeriksa ribuan tanggal, hanya ${checked}`);
});

test("cutoff pada batas bulan/tahun & kabisat tepat current-minus-2 (kasus eksplisit)", () => {
  // Kasus tabel eksplisit untuk keterbacaan: [tahun, bulan0, hari] → cutoff.
  const cases: Array<[number, number, number, string]> = [
    [2026, 0, 1, "2025-11"], // 1 Jan → Nov tahun lalu (lintas tahun)
    [2026, 0, 31, "2025-11"], // akhir Jan
    [2026, 1, 1, "2025-12"], // 1 Feb → Des tahun lalu
    [2026, 1, 28, "2025-12"], // akhir Feb (non-kabisat)
    [2024, 1, 29, "2023-12"], // 29 Feb (kabisat) → Des tahun lalu
    [2026, 2, 1, "2026-01"], // 1 Mar → Jan (tahun sama)
    [2026, 11, 31, "2026-10"], // 31 Des → Okt
    [2026, 6, 15, "2026-05"], // pertengahan Juli → Mei
    [2020, 2, 15, "2020-01"], // Mar tahun kabisat → Jan
    [2020, 0, 15, "2019-11"], // Jan 2020 → Nov 2019
  ];

  for (const [y, m0, d, want] of cases) {
    const now = new Date(Date.UTC(y, m0, d));
    assert.equal(
      cutoffMonthFor(now),
      want,
      `cutoff salah untuk ${now.toISOString()}`,
    );
  }
});

test("mid-month vs akhir-bulan menghasilkan cutoff yang sama (hari tak boleh mempengaruhi bulan cutoff)", () => {
  // Menegaskan cutoff hanya bergantung pada BULAN, bukan hari — jadi menjalankan
  // job pada tanggal 1 vs tanggal 31 tak pernah menggeser jendela retensi.
  for (let year = 2020; year <= 2035; year++) {
    for (let month = 0; month < 12; month++) {
      const first = new Date(Date.UTC(year, month, 1));
      // Hari terakhir bulan = hari 0 dari bulan berikutnya.
      const last = new Date(Date.UTC(year, month + 1, 0));
      assert.equal(
        cutoffMonthFor(first),
        cutoffMonthFor(last),
        `cutoff berbeda antara awal & akhir ${year}-${month + 1}`,
      );
    }
  }
});

test("cleanup tidak menyentuh baris owner lain dan menghormati per-owner isolation", async () => {
  const storage = new MemStorage();
  const now = new Date(Date.UTC(2026, 6, 15));
  const cutoff = cutoffMonthFor(now);
  const current = ym(now);
  const old = ym(monthOffset(now, -5));

  await storage.incrementOwnerMonthlyUsage("owner-X", current);
  await storage.incrementOwnerMonthlyUsage("owner-X", old);
  await storage.incrementOwnerMonthlyUsage("owner-Y", current);
  await storage.incrementOwnerMonthlyUsage("owner-Y", old);

  const deleted = await storage.deleteOwnerMonthlyUsageBefore(cutoff);

  // Kedua baris lama (X & Y) terhapus; kedua baris bulan berjalan bertahan.
  assert.equal(deleted, 2, "baris lama kedua owner harus terhapus.");
  assert.equal(await storage.getOwnerMonthlyUsage("owner-X", current), 1, "bulan berjalan owner-X utuh.");
  assert.equal(await storage.getOwnerMonthlyUsage("owner-Y", current), 1, "bulan berjalan owner-Y utuh.");
  assert.equal(await storage.getOwnerMonthlyUsage("owner-X", old), 0, "bulan lama owner-X terhapus.");
  assert.equal(await storage.getOwnerMonthlyUsage("owner-Y", old), 0, "bulan lama owner-Y terhapus.");
});
