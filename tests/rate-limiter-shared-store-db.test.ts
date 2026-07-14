import { test, after } from "node:test";
import assert from "node:assert/strict";

import { PostgresRateLimitStore } from "../server/lib/rate-limiter";

// Integrasi (butuh DB nyata) — memverifikasi JALUR STORE BERSAMA default benar-benar
// bisa MENULIS & MEMBACA tabel `rate_limit_buckets`, dan bahwa SQL atomik-nya
// (UPSERT + CASE reset-window) berperilaku benar terhadap Postgres SUNGGUHAN.
//
// Kenapa ini penting: unit test lain menyuntik InMemoryRateLimitStore untuk
// mensimulasikan DB bersama — itu membuktikan logika adapter, TAPI bukan SQL
// PostgresRateLimitStore. Regresi di UPSERT/CASE (mis. reset window salah, race
// tak ter-serialisasi, atau tabel/kolom hilang di lingkungan deploy) akan DIAM-DIAM
// membiarkan klien menembus batas di produksi tanpa satu tes pun gagal. Tes ini
// gagal keras kalau perilakunya berubah, sehingga migrasi 0008_rate_limit_buckets
// WAJIB ikut ter-deploy.
//
// Dilewati otomatis bila tidak ada DATABASE_URL (mis. CI tanpa DB), agar unit test
// lain tetap jalan.

const hasDb = !!process.env.DATABASE_URL;
const skip = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Satu pool dibagi semua tes di file ini; ditutup sekali lewat `after` supaya tes
// kedua dst. tidak kehabisan koneksi (jangan pool.end() di dalam tiap tes).
let poolPromise: Promise<import("pg").Pool> | null = null;
async function getPool() {
  if (!poolPromise) poolPromise = import("../server/db").then((m) => m.pool);
  return poolPromise;
}

function uniqueKey(prefix: string): string {
  return `${prefix}__it_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Suffix unik untuk MENYARINGKAN baris milik satu tes dari aktivitas lain di
// tabel yang sama (tes lain / aplikasi). Pemangkasan bersifat GLOBAL, tapi
// assertion hitungan baris DILINGKUP ke suffix ini agar deterministik.
function uniqueSuffix(): string {
  return `__prune_it_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function scopedRowCount(
  pool: import("pg").Pool,
  suffix: string,
): Promise<number> {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS n FROM rate_limit_buckets WHERE bucket_key LIKE $1",
    [`%${suffix}`],
  );
  return Number(rows[0].n);
}

async function scopedExpiredCount(
  pool: import("pg").Pool,
  suffix: string,
  now: number,
): Promise<number> {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS n FROM rate_limit_buckets WHERE bucket_key LIKE $1 AND reset_at <= $2",
    [`%${suffix}`, now],
  );
  return Number(rows[0].n);
}

// Sumber acak DETERMINISTIK yang meniru laju pemangkasan PRODUKSI: dengan
// pruneProbability = 0.02 (default produksi), pemangkasan HANYA terpicu bila
// random() < 0.02. Fungsi ini mengembalikan 0 (memicu) tepat setiap `n` panggilan
// dan nilai ~1 (tak memicu) selebihnya. Set n = 1/probabilitas (mis. 50 untuk
// 0.02) sehingga rata-rata 1-dari-50 hit ikut memangkas — laju yang SAMA seperti
// produksi, tapi tanpa keacakan yang membuat tes flaky.
function everyNthPruner(n: number): () => number {
  let i = 0;
  return () => {
    i += 1;
    return i % n === 0 ? 0 : 0.999;
  };
}

after(async () => {
  if (!hasDb || !poolPromise) return;
  const pool = await poolPromise;
  await pool.end();
});

test(
  "hit(): tulis/baca + kenaikan dalam window + reset saat window lewat (SQL nyata)",
  { skip },
  async () => {
    const pool = await getPool();
    const store = new PostgresRateLimitStore((text, params) =>
      pool.query(text, params),
    );
    const key = uniqueKey("agent:");
    const now = Date.now();

    try {
      // Hit pertama membuat baris → count 1, window baru.
      const first = await store.hit(key, HOUR_MS, now);
      assert.equal(first.count, 1, "hit pertama harus count=1");
      assert.equal(
        first.resetAt,
        now + HOUR_MS,
        "resetAt hit pertama = now + window",
      );

      // Hit kedua dalam window sama → count naik, resetAt TETAP.
      const second = await store.hit(key, HOUR_MS, now + 1000);
      assert.equal(second.count, 2, "hit kedua (window sama) harus count=2");
      assert.equal(
        second.resetAt,
        now + HOUR_MS,
        "resetAt tidak berubah dalam window",
      );

      // Melewati reset_at → CASE me-reset ke 1 dengan window baru.
      const after = now + HOUR_MS + 1;
      const reset = await store.hit(key, HOUR_MS, after);
      assert.equal(reset.count, 1, "setelah window lewat harus reset ke 1");
      assert.equal(reset.resetAt, after + HOUR_MS, "window baru terbentuk");
    } finally {
      await pool.query("DELETE FROM rate_limit_buckets WHERE bucket_key = $1", [
        key,
      ]);
    }
  },
);

test(
  "hit(): kenaikan SEREMPAK pada key sama ter-serialisasi jadi satu hitungan (UPSERT mengunci baris)",
  { skip },
  async () => {
    const pool = await getPool();
    // Simulasikan banyak instance autoscale: masing-masing store punya koneksi/
    // query sendiri lewat pool yang sama, semua menaikkan bucket yang identik.
    const store = new PostgresRateLimitStore((text, params) =>
      pool.query(text, params),
    );
    const key = uniqueKey("agent:");
    const now = Date.now();
    const CONCURRENT = 50;

    try {
      const results = await Promise.all(
        Array.from({ length: CONCURRENT }, () =>
          store.hit(key, HOUR_MS, now),
        ),
      );

      // Setiap hit menerima count berjalan yang unik 1..N (tak ada yang kembar) →
      // bukti UPSERT ter-serialisasi, bukan lost-update.
      const counts = results.map((r) => r.count).sort((a, b) => a - b);
      assert.deepEqual(
        counts,
        Array.from({ length: CONCURRENT }, (_, i) => i + 1),
        "N hit serempak harus menghasilkan count 1..N tanpa duplikat/lompatan",
      );

      // Sumber kebenaran di DB harus tepat N (tidak ada increment yang hilang).
      const { rows } = await pool.query(
        "SELECT count FROM rate_limit_buckets WHERE bucket_key = $1",
        [key],
      );
      assert.equal(
        Number(rows[0].count),
        CONCURRENT,
        "count final di DB harus = jumlah hit serempak",
      );

      // Semua berbagi satu window (resetAt sama) karena masih dalam window.
      const resetAts = new Set(results.map((r) => r.resetAt));
      assert.equal(resetAts.size, 1, "semua hit serempak berbagi satu window");
    } finally {
      await pool.query("DELETE FROM rate_limit_buckets WHERE bucket_key = $1", [
        key,
      ]);
    }
  },
);

test(
  "reset(): menghapus bucket sehingga hit berikutnya mulai dari 1",
  { skip },
  async () => {
    const pool = await getPool();
    const store = new PostgresRateLimitStore((text, params) =>
      pool.query(text, params),
    );
    const key = uniqueKey("agent:");
    const now = Date.now();

    try {
      await store.hit(key, HOUR_MS, now);
      await store.hit(key, HOUR_MS, now + 1);

      await store.reset(key);
      const { rows } = await pool.query(
        "SELECT count FROM rate_limit_buckets WHERE bucket_key = $1",
        [key],
      );
      assert.equal(rows.length, 0, "reset() harus menghapus baris bucket");

      // Hit setelah reset membuat baris baru mulai dari 1.
      const afterReset = await store.hit(key, HOUR_MS, now + 2);
      assert.equal(afterReset.count, 1, "hit setelah reset harus mulai dari 1");
    } finally {
      await pool.query("DELETE FROM rate_limit_buckets WHERE bucket_key = $1", [
        key,
      ]);
    }
  },
);

test(
  "prefix minute: (per-menit) dan agent: (per-jam) berbagi tabel tanpa tabrakan",
  { skip },
  async () => {
    const pool = await getPool();
    const store = new PostgresRateLimitStore((text, params) =>
      pool.query(text, params),
    );
    const suffix = `__it_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const minuteKey = `minute:${suffix}`;
    const agentKey = `agent:${suffix}`;
    const now = Date.now();

    try {
      // Naikkan bucket per-menit beberapa kali; bucket per-jam sekali.
      await store.hit(minuteKey, MINUTE_MS, now);
      const minute2 = await store.hit(minuteKey, MINUTE_MS, now + 100);
      const agent1 = await store.hit(agentKey, HOUR_MS, now);

      assert.equal(minute2.count, 2, "bucket minute: menghitung independen");
      assert.equal(
        agent1.count,
        1,
        "bucket agent: tidak terpengaruh kenaikan bucket minute:",
      );

      // Window tiap prefix mengikuti windowMs-nya sendiri (menit vs jam).
      assert.equal(minute2.resetAt, now + MINUTE_MS, "window minute: = 60 detik");
      assert.equal(agent1.resetAt, now + HOUR_MS, "window agent: = 60 menit");

      // Verifikasi keduanya benar-benar dua baris terpisah di tabel yang sama.
      const { rows } = await pool.query(
        "SELECT bucket_key, count FROM rate_limit_buckets WHERE bucket_key = ANY($1) ORDER BY bucket_key",
        [[agentKey, minuteKey]],
      );
      assert.equal(rows.length, 2, "harus ada dua baris terpisah");
      const byKey = Object.fromEntries(
        rows.map((r: any) => [r.bucket_key, Number(r.count)]),
      );
      assert.equal(byKey[minuteKey], 2, "baris minute: = 2");
      assert.equal(byKey[agentKey], 1, "baris agent: = 1");
    } finally {
      await pool.query(
        "DELETE FROM rate_limit_buckets WHERE bucket_key = ANY($1)",
        [[minuteKey, agentKey]],
      );
    }
  },
);

// ── delete-on-write terhadap Postgres SUNGGUHAN: tabel kembali ke batas kecil ──
// Task #21 menambah pemangkasan yang DIPICU LALU-LINTAS (delete-on-write). Unit
// test lain membuktikan LOGIKA pemangkasan pakai SQL palsu; tes ini membuktikan
// jalur Postgres NYATA: churn tinggi bucket `minute:*` (1 baris yatim per
// IP/akun per menit) benar-benar dibersihkan oleh `hit()` sehingga jumlah baris
// (dan indeks PK yang mengikutinya) kembali ke batas kecil — hanya baris live.
test(
  "delete-on-write: churn minute:* kedaluwarsa dibersihkan hit() → tabel kembali kecil (SQL nyata)",
  { skip },
  async () => {
    const pool = await getPool();
    const suffix = uniqueSuffix();
    const STALE = 200; // banyak baris yatim seolah churn per-menit yang lama
    const now = Date.now();

    // pruneBatchLimit lebih besar dari STALE agar backlog milik tes ini bisa
    // terkuras; pruneProbability:1 + random:()=>0 memaksa setiap hit memangkas.
    const store = new PostgresRateLimitStore(
      (text, params) => pool.query(text, params),
      { pruneProbability: 1, pruneBatchLimit: STALE + 50, random: () => 0 },
    );

    try {
      // Tabur STALE baris `minute:*` yang SUDAH kedaluwarsa (reset_at jauh di
      // masa lalu). Satu INSERT massal agar cepat.
      await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         SELECT 'minute:stale-' || g || $1, 1, $2
         FROM generate_series(1, $3) AS g`,
        [suffix, now - 1, STALE],
      );
      assert.equal(
        await scopedRowCount(pool, suffix),
        STALE,
        "prasyarat: STALE baris basi tertanam",
      );

      // Dorong hit() nyata pada satu baris live. Setiap hit menulis/menaikkan
      // baris live DAN memicu pemangkasan fire-and-forget. Karena fire-and-forget
      // tak di-await, kita polling sampai backlog milik tes ini terkuras.
      const liveKey = `minute:live${suffix}`;
      const deadline = Date.now() + 15_000;
      let scoped = STALE + 1;
      while (Date.now() < deadline) {
        await store.hit(liveKey, MINUTE_MS, Date.now());
        await new Promise((r) => setTimeout(r, 50));
        scoped = await scopedRowCount(pool, suffix);
        if (scoped <= 1) break;
      }

      // Hanya baris live yang tersisa — tabel kembali ke batas kecil.
      assert.equal(
        scoped,
        1,
        "setelah delete-on-write, hanya baris live milik tes yang tersisa",
      );
      const { rows: liveRows } = await pool.query(
        "SELECT count FROM rate_limit_buckets WHERE bucket_key = $1",
        [liveKey],
      );
      assert.equal(liveRows.length, 1, "baris live harus tetap ada");
    } finally {
      await pool.query(
        "DELETE FROM rate_limit_buckets WHERE bucket_key LIKE $1",
        [`%${suffix}`],
      );
    }
  },
);

// ── pruneExpired() terhadap Postgres NYATA: LIMIT dihormati, hanya kedaluwarsa ─
// Membuktikan subquery `LIMIT` + `FOR UPDATE SKIP LOCKED` + cek-ulang
// `reset_at <= now` benar terhadap Postgres SUNGGUHAN: satu panggilan menghapus
// PALING BANYAK `limit` baris, dan baris LIVE tak pernah tersentuh.
test(
  "pruneExpired(): batch dibatasi LIMIT & hanya baris kedaluwarsa (SQL nyata)",
  { skip },
  async () => {
    const pool = await getPool();
    const suffix = uniqueSuffix();
    const EXPIRED = 10;
    const LIVE = 3;
    const BATCH = 4;
    const now = Date.now();

    const store = new PostgresRateLimitStore((text, params) =>
      pool.query(text, params),
    );

    try {
      // Baris kedaluwarsa diberi reset_at = 1 (praktis minimum) agar menjadi yang
      // TERTUA secara global → `ORDER BY reset_at LIMIT` menjamin batch pertama
      // mengambil baris MILIK TES ini, bukan baris kedaluwarsa insidental lain.
      await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         SELECT 'minute:old-' || g || $1, 1, 1
         FROM generate_series(1, $2) AS g`,
        [suffix, EXPIRED],
      );
      // Baris live: reset_at jauh di masa depan → tak pernah kedaluwarsa.
      await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         SELECT 'minute:live-' || g || $1, 1, $2
         FROM generate_series(1, $3) AS g`,
        [suffix, now + HOUR_MS, LIVE],
      );
      assert.equal(
        await scopedRowCount(pool, suffix),
        EXPIRED + LIVE,
        "prasyarat: EXPIRED basi + LIVE aktif tertanam",
      );

      // Batch pertama menghapus TEPAT LIMIT baris (baris tes adalah yang tertua).
      const first = await store.pruneExpired(now, BATCH);
      assert.equal(first, BATCH, "batch pertama menghapus tepat LIMIT baris");

      // Kuras sisa backlog milik tes; setiap batch WAJIB ≤ LIMIT.
      let guard = 0;
      while ((await scopedExpiredCount(pool, suffix, now)) > 0 && guard++ < 20) {
        const n = await store.pruneExpired(now, BATCH);
        assert.ok(n <= BATCH, "setiap batch dibatasi LIMIT");
        if (n === 0) break;
      }

      assert.equal(
        await scopedExpiredCount(pool, suffix, now),
        0,
        "seluruh baris kedaluwarsa milik tes akhirnya terpangkas",
      );
      assert.equal(
        await scopedRowCount(pool, suffix),
        LIVE,
        "hanya baris LIVE yang tersisa — pruneExpired tak menyentuh yang aktif",
      );
    } finally {
      await pool.query(
        "DELETE FROM rate_limit_buckets WHERE bucket_key LIKE $1",
        [`%${suffix}`],
      );
    }
  },
);

// ── churn berkelanjutan pada LAJU PEMANGKASAN PRODUKSI (0.02) tetap terbatas ──
// Task #23 membuktikan baris kedaluwarsa AKHIRNYA direklamasi, tapi memaksa
// `pruneProbability:1` (setiap hit memangkas) — tidak realistis. Produksi hanya
// memangkas ~1 dari 50 hit (default 0.02). Tes ini mensimulasikan churn
// BERKELANJUTAN pada laju produksi itu: tiap "menit" melahirkan sekumpulan key
// `minute:*` berbeda (1 baris yatim per IP/akun per menit) yang kedaluwarsa di
// menit berikutnya, sementara hit baru terus mengalir. Buktinya: jumlah baris
// STABIL di sekitar himpunan-live (1 menit) alih-alih tumbuh tak terbatas ke
// MENIT×KEY — artinya pembersihan mengejar laju kelahiran, bukan tertinggal.
test(
  "churn berkelanjutan @ pruneProbability produksi (0.02): tabel stabil di himpunan-live, tak tumbuh tak terbatas (SQL nyata)",
  { skip },
  async () => {
    const pool = await getPool();
    const suffix = uniqueSuffix();
    const MINUTES = 12;
    const KEYS_PER_MINUTE = 50; // = 1/0.02 → ~1 pemangkasan per menit pada laju produksi
    const base = Date.now();

    // Laju pemangkasan PRODUKSI (0.02) + pemicu deterministik setiap 50 hit.
    // pruneBatchLimit default (1000) ≫ backlog per menit, jadi satu pemangkasan
    // cukup menguras backlog satu menit.
    const store = new PostgresRateLimitStore(
      (text, params) => pool.query(text, params),
      { pruneProbability: 0.02, random: everyNthPruner(KEYS_PER_MINUTE) },
    );

    // Berapa banyak baris yang AKAN ada bila TANPA pemangkasan sama sekali —
    // basis pembanding untuk "tumbuh tak terbatas".
    const unbounded = MINUTES * KEYS_PER_MINUTE;

    try {
      const settledPerMinute: number[] = [];

      for (let m = 0; m < MINUTES; m++) {
        const minuteNow = base + m * MINUTE_MS;

        // Menit m melahirkan KEYS_PER_MINUTE baris `minute:*` BARU (window 1 menit).
        // Baris menit sebelumnya kini kedaluwarsa (reset_at = minuteNow) → yatim.
        for (let k = 0; k < KEYS_PER_MINUTE; k++) {
          const key = `minute:churn-${m}-${k}${suffix}`;
          await store.hit(key, MINUTE_MS, minuteNow);
        }

        // Pemangkasan fire-and-forget (tak di-await) → polling sampai baris basi
        // milik tes terkuras dan hanya himpunan-live (menit ini) tersisa.
        const deadline = Date.now() + 8_000;
        let scoped = await scopedRowCount(pool, suffix);
        while (scoped > KEYS_PER_MINUTE && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 30));
          scoped = await scopedRowCount(pool, suffix);
        }
        settledPerMinute.push(scoped);
      }

      // INTI: setiap menit, setelah pembersihan mengejar, jumlah baris kembali ke
      // himpunan-live (KEYS_PER_MINUTE) — TIDAK tumbuh menit demi menit. Bila
      // pembersihan tertinggal, nilai-nilai ini akan menanjak menuju `unbounded`.
      for (let m = 0; m < MINUTES; m++) {
        assert.equal(
          settledPerMinute[m],
          KEYS_PER_MINUTE,
          `menit ${m}: baris stabil di himpunan-live (${KEYS_PER_MINUTE}), bukan menumpuk`,
        );
      }

      const maxSettled = Math.max(...settledPerMinute);
      assert.ok(
        maxSettled < unbounded,
        `puncak baris stabil (${maxSettled}) harus jauh di bawah pertumbuhan tak-terbatas (${unbounded})`,
      );

      // Setelah seluruh run: hanya baris live menit terakhir yang tersisa.
      assert.equal(
        await scopedRowCount(pool, suffix),
        KEYS_PER_MINUTE,
        "akhir run: tabel terbatas pada himpunan-live menit terakhir",
      );
    } finally {
      await pool.query(
        "DELETE FROM rate_limit_buckets WHERE bucket_key LIKE $1",
        [`%${suffix}`],
      );
    }
  },
);

// ── backstop setInterval: kuras backlog BESAR per-batch tanpa DELETE raksasa ───
// Jalur utama = delete-on-write (di atas). `setInterval` di rate-limiter.ts hanya
// jaring pengaman saat lalu-lintas sepi; ia MENGURAS backlog dengan loop batch
// (`pruneExpired` berulang, dibatasi LIMIT), BUKAN satu DELETE besar yang
// mengunci tabel. Tes ini meniru bentuk loop itu terhadap Postgres NYATA dengan
// backlog jauh lebih besar dari batch → membuktikan (a) tiap batch ≤ LIMIT,
// (b) butuh BANYAK batch (bukan sekali sapu), (c) backlog terkuras habis, dan
// (d) baris live tak tersentuh.
test(
  "backstop drain: backlog besar dikuras banyak batch (≤ LIMIT), tak ada DELETE raksasa, baris live aman (SQL nyata)",
  { skip },
  async () => {
    const pool = await getPool();
    const suffix = uniqueSuffix();
    const BACKLOG = 1200;
    const LIVE = 5;
    const BATCH = 200; // ≪ BACKLOG → wajib banyak putaran
    const now = Date.now();

    // pruneBatchLimit = BATCH agar `pruneExpired()` (tanpa arg) memakai batas ini,
    // persis seperti `defaultSharedStore.pruneExpired(Date.now())` di setInterval.
    const store = new PostgresRateLimitStore(
      (text, params) => pool.query(text, params),
      { pruneBatchLimit: BATCH },
    );

    try {
      // reset_at = 1 → baris tes menjadi yang TERTUA secara global sehingga
      // `ORDER BY reset_at LIMIT` mengambilnya lebih dulu (bukan basi insidental).
      await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         SELECT 'minute:backlog-' || g || $1, 1, 1
         FROM generate_series(1, $2) AS g`,
        [suffix, BACKLOG],
      );
      await pool.query(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         SELECT 'minute:live-' || g || $1, 1, $2
         FROM generate_series(1, $3) AS g`,
        [suffix, now + HOUR_MS, LIVE],
      );
      assert.equal(
        await scopedExpiredCount(pool, suffix, now),
        BACKLOG,
        "prasyarat: backlog kedaluwarsa besar tertanam",
      );

      // Loop pengurasan MENIRU badan setInterval: batch berulang, berhenti saat
      // satu batch menghapus < LIMIT (backlog habis). Batasi putaran seperti
      // backstop asli (i < 50).
      let batches = 0;
      let totalDeleted = 0;
      for (let i = 0; i < 50; i++) {
        const deleted = await store.pruneExpired(now);
        batches += 1;
        assert.ok(
          deleted <= BATCH,
          `batch ${batches}: hapus ${deleted} ≤ LIMIT ${BATCH} (tak ada DELETE raksasa)`,
        );
        totalDeleted += deleted;
        if (deleted < BATCH) break;
      }

      // Butuh BANYAK batch, bukan satu sapuan — inti "tanpa DELETE besar".
      assert.ok(
        batches >= Math.ceil(BACKLOG / BATCH),
        `perlu ≥ ${Math.ceil(BACKLOG / BATCH)} batch untuk menguras ${BACKLOG} (aktual ${batches})`,
      );
      assert.ok(
        totalDeleted >= BACKLOG,
        `total terhapus (${totalDeleted}) mencakup seluruh backlog (${BACKLOG})`,
      );

      // Backlog milik tes terkuras habis; LIVE tak tersentuh.
      assert.equal(
        await scopedExpiredCount(pool, suffix, now),
        0,
        "seluruh backlog kedaluwarsa milik tes terkuras",
      );
      assert.equal(
        await scopedRowCount(pool, suffix),
        LIVE,
        "hanya baris LIVE tersisa — drain tak menyentuh yang aktif",
      );
    } finally {
      await pool.query(
        "DELETE FROM rate_limit_buckets WHERE bucket_key LIKE $1",
        [`%${suffix}`],
      );
    }
  },
);
