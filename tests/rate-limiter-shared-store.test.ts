import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

import {
  SharedRateLimitStoreAdapter,
  InMemoryRateLimitStore,
  chatAgentIdRateLimiter,
  __setAgentRateLimitStore,
  __resetAgentRateLimitStore,
  type RateLimitStore,
} from "../server/lib/rate-limiter";

// Regresi — membuktikan proteksi rate-limit TETAP ANDAL saat store bersama
// (PostgreSQL) sesaat tak terjangkau (mis. DB blip di tengah lonjakan).
//
// Dua lapisan jatuh ke `InMemoryRateLimitStore` per-proses saat store bersama
// melempar error:
//   - limiter per-MENIT lewat `SharedRateLimitStoreAdapter.increment`
//   - limiter per-AGEN per-jam lewat `chatAgentIdRateLimiter`
//
// Tes ini menegakkan dua sifat yang belum pernah di-cover:
//   (a) DEGRADASI BENAR — meski DB down, penghitungan lanjut di memori
//       per-instance dan cap TETAP memicu 429 (bukan gagal-terbuka).
//   (b) TAK BOCOR MEMORI — `InMemoryRateLimitStore.cleanup()` mereklamasi
//       entri kedaluwarsa sehingga Map tidak tumbuh tak terbatas saat churn
//       banyak key berlangsung selama DB down.
//
// Semua deterministik & tanpa DB: store bersama disimulasikan MELEMPAR, waktu
// dikendalikan via stub Date.now(), dan ukuran Map fallback diperiksa langsung.

afterEach(() => {
  __resetAgentRateLimitStore();
});

const MINUTE_MS = 60 * 1000;
const AGENT_MAX_UNAUTHENTICATED = 100;

// Store bersama yang SELALU melempar — meniru DB tak terjangkau.
class FailingSharedStore implements RateLimitStore {
  calls = 0;
  async hit(): Promise<never> {
    this.calls += 1;
    throw new Error("simulasi DB down");
  }
  async reset(): Promise<void> {
    throw new Error("simulasi DB down");
  }
}

// Baca Map internal fallback untuk memverifikasi reklamasi memori. Field-nya
// `private` (hanya batas compile-time TS); di runtime tetap terbaca.
function mapSize(store: InMemoryRateLimitStore): number {
  return (store as any).store.size as number;
}

// ── (a) per-MENIT: adapter jatuh ke in-memory & tetap MENGHITUNG saat DB down ─
test("SharedRateLimitStoreAdapter: DB down → increment lanjut via fallback in-memory", async () => {
  const shared = new FailingSharedStore();
  const fallback = new InMemoryRateLimitStore();
  const adapter = new SharedRateLimitStoreAdapter(shared, "minute:", fallback);
  adapter.init({ windowMs: MINUTE_MS } as any);

  // Hit berturut pada key yang sama harus terus naik (dari fallback), bukan
  // tersangkut/gagal — bukti penghitungan degradasi berjalan per-instance.
  const key = "ip-degrade";
  for (let i = 1; i <= 5; i++) {
    const info = await adapter.increment(key);
    assert.equal(info.totalHits, i, `hit ke-${i} harus dihitung fallback`);
    assert.ok(info.resetTime instanceof Date, "resetTime harus Date valid");
  }
  assert.ok(shared.calls >= 5, "store bersama tetap dicoba dulu tiap hit");
});

// ── (a) per-MENIT: lewat middleware express-rate-limit → 429 di atas cap ──────
test("per-menit: DB down tetap menegakkan cap → 429 lewat middleware", async () => {
  const shared = new FailingSharedStore();
  const fallback = new InMemoryRateLimitStore();
  const adapter = new SharedRateLimitStoreAdapter(shared, "minute:", fallback);

  const CAP = 3;
  const limiter = rateLimit({
    windowMs: MINUTE_MS,
    limit: CAP,
    store: adapter,
    keyGenerator: () => "single-key",
    standardHeaders: false,
    legacyHeaders: false,
  });

  function runOnce(): Promise<{ blocked: boolean; status: number | null }> {
    return new Promise((resolve) => {
      let status: number | null = null;
      const req = { ip: "1.2.3.4", headers: {}, method: "POST" } as unknown as Request;
      const res = {
        statusCode: 200,
        headersSent: false,
        setHeader() {},
        getHeader() {},
        status(code: number) {
          status = code;
          this.statusCode = code;
          return this;
        },
        send() {
          resolve({ blocked: true, status });
          return this;
        },
        json() {
          resolve({ blocked: true, status });
          return this;
        },
        end() {
          resolve({ blocked: true, status });
          return this;
        },
      } as unknown as Response;
      limiter(req, res, () => resolve({ blocked: false, status: null }));
    });
  }

  // CAP request pertama lolos; request ke-(CAP+1) diblok 429.
  for (let i = 1; i <= CAP; i++) {
    const r = await runOnce();
    assert.equal(r.blocked, false, `request ke-${i} (<= cap) harus lolos`);
  }
  const over = await runOnce();
  assert.equal(over.blocked, true, "melewati cap harus diblokir");
  assert.equal(over.status, 429, "blokir saat DB down harus 429, bukan gagal-terbuka");
});

// ── (a) per-AGEN: DB down → chatAgentIdRateLimiter tetap 429 di atas cap ──────
test("per-agen: DB down → fallback in-memory tetap 429 di atas cap", async () => {
  const shared = new FailingSharedStore();
  __setAgentRateLimitStore(shared as unknown as RateLimitStore);

  const agentId = `agent-dbdown-${Date.now()}`;
  function anonReq(): Request {
    return { isAuthenticated: () => false, body: { agentId } } as unknown as Request;
  }
  function fakeRes() {
    const state = { statusCode: null as number | null, headers: {} as Record<string, string> };
    const res = {
      setHeader(n: string, v: string) {
        state.headers[n] = v;
        return res;
      },
      status(c: number) {
        state.statusCode = c;
        return res;
      },
      json() {
        return res;
      },
    } as unknown as Response;
    return { state, res };
  }
  async function run(res: Response): Promise<boolean> {
    let passed = false;
    await chatAgentIdRateLimiter(anonReq(), res, () => {
      passed = true;
    });
    return passed;
  }

  let sawBlock = false;
  for (let i = 0; i < AGENT_MAX_UNAUTHENTICATED + 5; i++) {
    const { state, res } = fakeRes();
    const passed = await run(res);
    if (!passed) {
      sawBlock = true;
      assert.equal(state.statusCode, 429, "blokir fallback harus 429");
      assert.ok(state.headers["Retry-After"], "429 harus menyertakan Retry-After");
      break;
    }
  }
  assert.ok(sawBlock, "meski DB down, per-agen fallback harus tetap memicu cap");
});

// ── (b) TAK BOCOR MEMORI: cleanup() mereklamasi entri kedaluwarsa ─────────────
// Selama DB down, tiap menit melahirkan sekumpulan key `minute:*` BARU (1 baris
// per IP/akun per menit) yang kedaluwarsa menit berikutnya. Tanpa cleanup, Map
// fallback tumbuh MENIT×KEY tanpa batas. Dengan cleanup, Map stabil di
// himpunan-live (satu menit) — mengejar laju kelahiran.
test("fallback in-memory: cleanup() reklamasi entri basi → Map tak tumbuh tak terbatas", async () => {
  const shared = new FailingSharedStore();
  const fallback = new InMemoryRateLimitStore();
  const adapter = new SharedRateLimitStoreAdapter(shared, "minute:", fallback);
  adapter.init({ windowMs: MINUTE_MS } as any);

  const MINUTES = 10;
  const KEYS_PER_MINUTE = 100;
  const base = 1_700_000_000_000;
  const realNow = Date.now;

  try {
    const sizesAfterCleanup: number[] = [];
    for (let m = 0; m < MINUTES; m++) {
      const now = base + m * MINUTE_MS;
      Date.now = () => now;

      // Reklamasi entri menit-menit sebelumnya (kini kedaluwarsa).
      fallback.cleanup(now);

      // Menit m: KEYS_PER_MINUTE key unik baru (window 1 menit) via fallback.
      for (let k = 0; k < KEYS_PER_MINUTE; k++) {
        await adapter.increment(`ip-${m}-${k}`);
      }
      sizesAfterCleanup.push(mapSize(fallback));
    }

    // Tiap menit, setelah cleanup, Map kembali ke himpunan-live saja — TIDAK
    // menumpuk menit demi menit.
    for (let m = 0; m < MINUTES; m++) {
      assert.equal(
        sizesAfterCleanup[m],
        KEYS_PER_MINUTE,
        `menit ${m}: Map stabil di himpunan-live (${KEYS_PER_MINUTE}), bukan menumpuk`,
      );
    }

    // Kontras dengan pertumbuhan tak-terbatas bila cleanup tak pernah jalan.
    const unbounded = MINUTES * KEYS_PER_MINUTE;
    assert.ok(
      Math.max(...sizesAfterCleanup) < unbounded,
      `puncak Map (${Math.max(...sizesAfterCleanup)}) harus jauh di bawah tanpa-cleanup (${unbounded})`,
    );
  } finally {
    Date.now = realNow;
  }
});

// ── (b) kontrol: TANPA cleanup, Map memang tumbuh linear (membuktikan tes valid)
test("fallback in-memory: tanpa cleanup Map tumbuh tak terbatas (kontrol negatif)", async () => {
  const shared = new FailingSharedStore();
  const fallback = new InMemoryRateLimitStore();
  const adapter = new SharedRateLimitStoreAdapter(shared, "minute:", fallback);
  adapter.init({ windowMs: MINUTE_MS } as any);

  const MINUTES = 10;
  const KEYS_PER_MINUTE = 100;
  const base = 1_700_000_000_000;
  const realNow = Date.now;

  try {
    for (let m = 0; m < MINUTES; m++) {
      const now = base + m * MINUTE_MS;
      Date.now = () => now;
      for (let k = 0; k < KEYS_PER_MINUTE; k++) {
        await adapter.increment(`ip-${m}-${k}`);
      }
    }
    // Tanpa cleanup, semua entri (termasuk yang basi) tetap tersimpan.
    assert.equal(
      mapSize(fallback),
      MINUTES * KEYS_PER_MINUTE,
      "tanpa cleanup, Map menyimpan tiap key unik → bukti risiko kebocoran nyata",
    );
  } finally {
    Date.now = realNow;
  }
});

// ── cleanup() hanya menghapus yang kedaluwarsa, menyisakan entri LIVE ─────────
test("cleanup(): entri live tetap, hanya yang lewat resetAt dihapus", async () => {
  const store = new InMemoryRateLimitStore();
  const t0 = 1_700_000_000_000;

  // Entri basi: window pendek (akan kedaluwarsa).
  await store.hit("basi", MINUTE_MS, t0);
  // Entri live: window jauh ke depan.
  await store.hit("live", 60 * MINUTE_MS, t0);
  assert.equal(mapSize(store), 2, "prasyarat: dua entri tertanam");

  // Majukan waktu melewati window "basi" tapi masih dalam window "live".
  store.cleanup(t0 + MINUTE_MS + 1);
  assert.equal(mapSize(store), 1, "hanya entri kedaluwarsa yang direklamasi");

  // Entri live masih menghitung dari nilai lama (tidak di-reset oleh cleanup).
  const live = await store.hit("live", 60 * MINUTE_MS, t0 + MINUTE_MS + 2);
  assert.equal(live.count, 2, "entri live selamat & lanjut menghitung");
  // Key basi yang sudah direklamasi mulai dari 1 lagi.
  const basi = await store.hit("basi", MINUTE_MS, t0 + MINUTE_MS + 2);
  assert.equal(basi.count, 1, "key basi yang direklamasi mulai ulang dari 1");
});
