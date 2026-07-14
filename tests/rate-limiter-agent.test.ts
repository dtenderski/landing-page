import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";

import {
  chatAgentIdRateLimiter,
  InMemoryRateLimitStore,
  PostgresRateLimitStore,
  __setAgentRateLimitStore,
  __resetAgentRateLimitStore,
} from "../server/lib/rate-limiter";

// Regresi — melindungi lapisan proteksi KEDUA: batas per-AGEN per jam untuk
// pemanggil ANONIM (`chatAgentIdRateLimiter`). Inilah yang mencegah satu agen
// publik dihajar bot/skrip. Batas: 100 permintaan tak-terautentikasi / jam
// per agentId.
//
// Penghitung disimpan di store BERSAMA (PostgreSQL) supaya konsisten lintas
// instance autoscale — bukan Map in-memory per-proses. Tes ini menyuntik
// `InMemoryRateLimitStore` lewat `__setAgentRateLimitStore()` agar cepat &
// deterministik, lalu memverifikasi jalur store bersama secara terpisah.
//
// Tes:
//  - memakai agentId unik per kasus agar tiap kasus mulai dari bucket bersih;
//  - mengendalikan waktu via stub Date.now() untuk menguji cabang reset window
//    tanpa menunggu 1 jam nyata.

// Setiap tes middleware memakai store in-memory bersih; kembalikan ke default
// setelah selesai agar tidak bocor ke tes lain.
afterEach(() => {
  __resetAgentRateLimitStore();
});

const AGENT_MAX_UNAUTHENTICATED = 100;
const AGENT_WINDOW_MS = 60 * 60 * 1000;

// ── Helper: objek Request/Response tiruan minimal ────────────────────────────
function anonReq(agentId: unknown): Request {
  return {
    isAuthenticated: () => false,
    body: { agentId },
  } as unknown as Request;
}

function authedReq(agentId: unknown): Request {
  return {
    isAuthenticated: () => true,
    user: { id: "user-A" },
    body: { agentId },
  } as unknown as Request;
}

interface FakeRes {
  res: Response;
  statusCode: number | null;
  jsonBody: any;
  headers: Record<string, string>;
}

function fakeRes(): FakeRes {
  const state: FakeRes = {
    statusCode: null,
    jsonBody: undefined,
    headers: {},
    res: null as unknown as Response,
  };
  const res = {
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return res;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
  } as unknown as Response;
  state.res = res;
  return state;
}

// Menjalankan middleware sekali; mengembalikan apakah next() dipanggil.
// Middleware kini async (menunggu store bersama), jadi run() ikut async.
async function run(req: Request, res: Response): Promise<boolean> {
  let nextCalled = false;
  await chatAgentIdRateLimiter(req, res, () => {
    nextCalled = true;
  });
  return nextCalled;
}

// ── 1. Request terautentikasi mem-bypass limiter per-agen ────────────────────
test("request login mem-bypass limiter per-agen (tak dibatasi 100/jam)", async () => {
  __setAgentRateLimitStore(new InMemoryRateLimitStore());
  const agentId = "agent-auth-bypass";
  // Jauh melampaui cap; semua harus lolos karena terautentikasi.
  for (let i = 0; i < AGENT_MAX_UNAUTHENTICATED + 50; i++) {
    const r = fakeRes();
    const passed = await run(authedReq(agentId), r.res);
    assert.equal(passed, true, `request login ke-${i + 1} harus lolos`);
    assert.equal(r.statusCode, null, "request login tidak boleh kena 429");
  }
});

// ── 2. Anonim di bawah cap lolos; melewati cap → 429 + Retry-After ───────────
test("anonim: lolos sampai cap, lalu 429 dengan Retry-After", async () => {
  __setAgentRateLimitStore(new InMemoryRateLimitStore());
  const agentId = "agent-anon-cap";

  // Tepat AGENT_MAX_UNAUTHENTICATED request pertama harus lolos.
  for (let i = 0; i < AGENT_MAX_UNAUTHENTICATED; i++) {
    const r = fakeRes();
    const passed = await run(anonReq(agentId), r.res);
    assert.equal(passed, true, `anonim ke-${i + 1} (<= cap) harus lolos`);
    assert.equal(r.statusCode, null, "belum boleh 429 di bawah/di cap");
  }

  // Request berikutnya melewati cap → harus 429.
  const blocked = fakeRes();
  const passed = await run(anonReq(agentId), blocked.res);
  assert.equal(passed, false, "request melewati cap tidak boleh lolos");
  assert.equal(blocked.statusCode, 429, "melewati cap harus 429");
  assert.ok(
    blocked.headers["Retry-After"],
    "respons 429 harus menyertakan header Retry-After",
  );
  const retryAfter = Number(blocked.headers["Retry-After"]);
  assert.ok(
    Number.isFinite(retryAfter) && retryAfter > 0,
    "Retry-After harus angka detik positif",
  );
});

// ── 3. Setelah window reset, anonim lolos lagi (kendalikan waktu) ────────────
test("setelah window reset, anonim lolos lagi", async () => {
  __setAgentRateLimitStore(new InMemoryRateLimitStore());
  const agentId = "agent-window-reset";
  const realNow = Date.now;
  const t0 = 1_000_000_000_000; // basis waktu tetap
  try {
    Date.now = () => t0;

    // Habiskan cap pada window pertama.
    for (let i = 0; i < AGENT_MAX_UNAUTHENTICATED; i++) {
      const r = fakeRes();
      assert.equal(await run(anonReq(agentId), r.res), true);
    }
    // Konfirmasi terblokir di window pertama.
    const blocked = fakeRes();
    assert.equal(await run(anonReq(agentId), blocked.res), false);
    assert.equal(blocked.statusCode, 429);

    // Majukan waktu melewati akhir window → entri harus reset.
    Date.now = () => t0 + AGENT_WINDOW_MS + 1;

    const afterReset = fakeRes();
    const passed = await run(anonReq(agentId), afterReset.res);
    assert.equal(passed, true, "setelah reset window, anonim harus lolos lagi");
    assert.equal(afterReset.statusCode, null, "setelah reset tidak boleh 429");
  } finally {
    Date.now = realNow;
  }
});

// ── 4. Tanpa agentId di body → middleware lolos begitu saja ──────────────────
test("tanpa agentId di body → lolos (limiter tak berlaku)", async () => {
  __setAgentRateLimitStore(new InMemoryRateLimitStore());
  const r = fakeRes();
  const passed = await run(anonReq(undefined), r.res);
  assert.equal(passed, true, "tanpa agentId harus lolos");
  assert.equal(r.statusCode, null, "tanpa agentId tidak boleh 429");
});

// ── 5. Store bersama: dua "instance" berbagi satu hitungan lintas-proses ──────
// Inti Task: pada autoscale, tiap instance TIDAK boleh punya hitungan sendiri.
// Kita simulasikan store bersama dengan satu backing Map yang dipakai oleh dua
// PostgresRateLimitStore berbeda (mewakili dua proses yang bicara ke DB sama).
// Bila hitungan benar-benar dibagi, total request di kedua instance dijumlahkan
// dan cap terpicu — bukan per-instance.
test("store bersama: cap ditegakkan dari total lintas-instance (bukan per-instance)", async () => {
  // Backing bersama: satu tabel virtual { key -> {count, resetAt} }.
  const shared = new Map<string, { count: number; resetAt: number }>();

  // Query SQL palsu yang meniru UPSERT atomik pada satu baris bersama.
  const sharedQuery = async (_text: string, params: any[]) => {
    const [key, resetAt, now] = params as [string, number, number];
    const existing = shared.get(key);
    let row: { count: number; resetAt: number };
    if (!existing || existing.resetAt <= now) {
      row = { count: 1, resetAt };
    } else {
      row = { count: existing.count + 1, resetAt: existing.resetAt };
    }
    shared.set(key, row);
    return { rows: [{ count: row.count, reset_at: row.resetAt }] };
  };

  // Dua "instance" berbeda menunjuk ke backing yang SAMA.
  const instanceA = new PostgresRateLimitStore(sharedQuery);
  const instanceB = new PostgresRateLimitStore(sharedQuery);
  const agentId = "agent-shared-store";
  const windowMs = AGENT_WINDOW_MS;
  const now = 2_000_000_000_000;

  // Kirim 100 request TOTAL: berselang-seling antar instance.
  let last!: { count: number };
  for (let i = 0; i < AGENT_MAX_UNAUTHENTICATED; i++) {
    const inst = i % 2 === 0 ? instanceA : instanceB;
    last = await inst.hit(`agent:${agentId}`, windowMs, now);
  }
  assert.equal(
    last.count,
    AGENT_MAX_UNAUTHENTICATED,
    "hitungan harus terakumulasi lintas kedua instance, bukan direset per-instance",
  );

  // Request ke-101 (di instance mana pun) harus melewati cap.
  const over = await instanceB.hit(`agent:${agentId}`, windowMs, now);
  assert.equal(
    over.count,
    AGENT_MAX_UNAUTHENTICATED + 1,
    "request melewati cap harus terbaca > cap di store bersama",
  );
  assert.ok(
    over.count > AGENT_MAX_UNAUTHENTICATED,
    "cap harus terpicu berdasarkan total bersama",
  );
});

// ── 6. Store bersama Postgres: window reset saat resetAt lewat ────────────────
test("store bersama: window di-reset saat melewati resetAt", async () => {
  const shared = new Map<string, { count: number; resetAt: number }>();
  const sharedQuery = async (_text: string, params: any[]) => {
    const [key, resetAt, now] = params as [string, number, number];
    const existing = shared.get(key);
    let row: { count: number; resetAt: number };
    if (!existing || existing.resetAt <= now) {
      row = { count: 1, resetAt };
    } else {
      row = { count: existing.count + 1, resetAt: existing.resetAt };
    }
    shared.set(key, row);
    return { rows: [{ count: row.count, reset_at: row.resetAt }] };
  };
  const store = new PostgresRateLimitStore(sharedQuery);
  const key = "agent:shared-reset";
  const t0 = 3_000_000_000_000;

  const first = await store.hit(key, AGENT_WINDOW_MS, t0);
  assert.equal(first.count, 1);
  assert.equal(first.resetAt, t0 + AGENT_WINDOW_MS);

  const second = await store.hit(key, AGENT_WINDOW_MS, t0 + 1000);
  assert.equal(second.count, 2, "dalam window sama harus naik");
  assert.equal(second.resetAt, t0 + AGENT_WINDOW_MS, "resetAt tidak berubah");

  // Lewati window → reset ke 1 dengan window baru.
  const afterWindow = t0 + AGENT_WINDOW_MS + 1;
  const reset = await store.hit(key, AGENT_WINDOW_MS, afterWindow);
  assert.equal(reset.count, 1, "setelah window lewat, hitungan reset ke 1");
  assert.equal(reset.resetAt, afterWindow + AGENT_WINDOW_MS, "window baru");
});

// ── 7. Fallback: store bersama error → tetap membatasi via in-memory ─────────
// Kalau DB down, chat tidak boleh mati total; middleware jatuh ke proteksi
// in-memory per-instance (terdegradasi tapi tetap menegakkan cap).
test("store bersama error → fallback in-memory tetap menegakkan cap", async () => {
  const failingStore: { hit: () => Promise<never> } = {
    hit: async () => {
      throw new Error("simulasi DB down");
    },
  };
  __setAgentRateLimitStore(failingStore as any);
  const agentId = "agent-db-down";

  // Fallback in-memory dibagikan lintas-tes (modul-level), jadi kita hanya
  // memastikan cap tetap terpicu: kirim jauh melebihi cap dan pastikan 429 muncul.
  let sawBlock = false;
  for (let i = 0; i < AGENT_MAX_UNAUTHENTICATED + 5; i++) {
    const r = fakeRes();
    const passed = await run(anonReq(agentId), r.res);
    if (!passed) {
      sawBlock = true;
      assert.equal(r.statusCode, 429, "blokir fallback harus 429");
      break;
    }
  }
  assert.ok(
    sawBlock,
    "meski store bersama gagal, fallback in-memory harus tetap menegakkan cap",
  );
});
