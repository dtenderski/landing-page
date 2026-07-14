import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request } from "express";

import {
  isEventMode,
  chatRateLimitKey,
  chatRateLimitValue,
  InMemoryRateLimitStore,
  SharedRateLimitStoreAdapter,
  type RateLimitStore,
  type RateLimitHit,
} from "../server/lib/rate-limiter";

// Regresi — melindungi perbaikan inti untuk hari-H acara (mis. Indobuildtech):
//  1. User login dikunci per-AKUN (`user:<id>`), BUKAN per-IP. Di venue acara
//     ratusan peserta berbagi satu IP WiFi; kalau di-key per-IP mereka saling
//     mengunci. Bug ini hanya ketahuan saat acara berlangsung → wajib dikunci tes.
//  2. Anonim tetap di-key per-IP.
//  3. isEventMode() menghormati flag EVENT_MODE dan rentang EVENT_MODE_START/END,
//     dan mode event menaikkan batas kuota.
//
// Tes ini murni memanggil fungsi (tanpa server/DB) agar cepat & deterministik.

// ── Helper: bangun objek Request tiruan minimal ──────────────────────────────
function authedReq(userId: string, ip: string): Request {
  return {
    ip,
    isAuthenticated: () => true,
    user: { id: userId },
  } as unknown as Request;
}

function anonReq(ip: string): Request {
  return {
    ip,
    isAuthenticated: () => false,
  } as unknown as Request;
}

function resetEventEnv() {
  delete process.env.EVENT_MODE;
  delete process.env.EVENT_MODE_START;
  delete process.env.EVENT_MODE_END;
}

// ── 1. Keying per-akun: peserta di belakang IP WiFi yang sama tidak saling kunci
test("dua user login di IP yang sama → bucket independen (per-akun)", () => {
  const sharedIp = "203.0.113.7";
  const a = chatRateLimitKey(authedReq("user-A", sharedIp));
  const b = chatRateLimitKey(authedReq("user-B", sharedIp));

  assert.equal(a, "user:user-A");
  assert.equal(b, "user:user-B");
  assert.notEqual(a, b, "user berbeda di IP sama HARUS punya bucket berbeda");
});

test("user login yang sama dari dua IP berbeda → bucket sama (per-akun)", () => {
  const k1 = chatRateLimitKey(authedReq("user-A", "203.0.113.7"));
  const k2 = chatRateLimitKey(authedReq("user-A", "198.51.100.42"));
  assert.equal(k1, k2, "user sama HARUS berbagi satu bucket lintas IP");
  assert.equal(k1, "user:user-A");
});

// ── 2. Anonim di-key per-IP ──────────────────────────────────────────────────
test("anonim → di-key per-IP; IP sama berbagi bucket, IP beda terpisah", () => {
  const sharedIp = "203.0.113.7";
  const a1 = chatRateLimitKey(anonReq(sharedIp));
  const a2 = chatRateLimitKey(anonReq(sharedIp));
  const a3 = chatRateLimitKey(anonReq("198.51.100.42"));

  assert.equal(a1, a2, "anonim di IP sama HARUS berbagi bucket");
  assert.notEqual(a1, a3, "anonim di IP beda HARUS bucket terpisah");
  assert.ok(!a1.startsWith("user:"), "kunci anonim tidak boleh berformat user:");
});

// ── 3. isEventMode: flag eksplisit ───────────────────────────────────────────
test("isEventMode: EVENT_MODE flag menyala/mati eksplisit", () => {
  resetEventEnv();
  for (const on of ["on", "1", "true", "yes", "TRUE", "On"]) {
    process.env.EVENT_MODE = on;
    assert.equal(isEventMode(), true, `EVENT_MODE=${on} harus aktif`);
  }
  for (const off of ["off", "0", "false", "no"]) {
    process.env.EVENT_MODE = off;
    assert.equal(isEventMode(), false, `EVENT_MODE=${off} harus nonaktif`);
  }
  resetEventEnv();
  assert.equal(isEventMode(), false, "tanpa env apa pun → nonaktif");
});

// ── 3b. isEventMode: rentang tanggal START/END ───────────────────────────────
test("isEventMode: menghormati rentang EVENT_MODE_START/END", () => {
  resetEventEnv();
  process.env.EVENT_MODE_START = "2026-07-08";
  process.env.EVENT_MODE_END = "2026-07-10";

  assert.equal(
    isEventMode(new Date("2026-07-09T10:00:00Z")),
    true,
    "di dalam rentang harus aktif",
  );
  assert.equal(
    isEventMode(new Date("2026-07-07T10:00:00Z")),
    false,
    "sebelum rentang harus nonaktif",
  );
  assert.equal(
    isEventMode(new Date("2026-07-11T10:00:00Z")),
    false,
    "sesudah rentang harus nonaktif",
  );
  resetEventEnv();
});

test("isEventMode: EVENT_MODE eksplisit menang atas rentang tanggal", () => {
  resetEventEnv();
  process.env.EVENT_MODE = "off";
  process.env.EVENT_MODE_START = "2026-07-08";
  process.env.EVENT_MODE_END = "2026-07-10";
  assert.equal(
    isEventMode(new Date("2026-07-09T10:00:00Z")),
    false,
    "flag off harus mengalahkan rentang aktif",
  );
  resetEventEnv();
});

// ── 4. Batas kuota naik saat mode event ──────────────────────────────────────
test("mode event menaikkan batas untuk user login maupun anonim", () => {
  resetEventEnv();

  const authed = authedReq("user-A", "203.0.113.7");
  const anon = anonReq("203.0.113.7");

  process.env.EVENT_MODE = "off";
  const authedNormal = chatRateLimitValue(authed);
  const anonNormal = chatRateLimitValue(anon);

  process.env.EVENT_MODE = "on";
  const authedEvent = chatRateLimitValue(authed);
  const anonEvent = chatRateLimitValue(anon);

  assert.ok(
    authedEvent > authedNormal,
    `batas user login harus naik saat event (${authedNormal} → ${authedEvent})`,
  );
  assert.ok(
    anonEvent > anonNormal,
    `batas anonim harus naik saat event (${anonNormal} → ${anonEvent})`,
  );
  assert.ok(
    authedNormal > anonNormal,
    "user login harus punya kuota lebih besar dari anonim",
  );
  resetEventEnv();
});

// ── 5. Store BERSAMA lintas-instance untuk limiter per-MENIT ──────────────────
// Bug #16: chatIpRateLimiter dulu memakai MemoryStore per-proses. Di autoscale,
// tiap instance punya hitungan sendiri, jadi klien yang berputar antar-instance
// bisa menembus batas per-menit sementara tiap instance masih merasa aman.
// SharedRateLimitStoreAdapter membungkus RateLimitStore bersama (Postgres di
// produksi) → satu hitungan tunggal untuk semua instance.

const WINDOW = 60 * 1000;

test("adapter menghitung di store BERSAMA: dua 'instance' menaikkan bucket yang sama", async () => {
  const shared = new InMemoryRateLimitStore(); // mensimulasikan 1 DB bersama
  const instanceA = new SharedRateLimitStoreAdapter(shared, "minute:");
  const instanceB = new SharedRateLimitStoreAdapter(shared, "minute:");
  instanceA.init({ windowMs: WINDOW } as any);
  instanceB.init({ windowMs: WINDOW } as any);

  const r1 = await instanceA.increment("user:X");
  const r2 = await instanceB.increment("user:X"); // instance berbeda, key sama
  const r3 = await instanceA.increment("user:X");

  assert.equal(r1.totalHits, 1, "hit pertama = 1");
  assert.equal(r2.totalHits, 2, "instance kedua HARUS lihat hitungan berjalan");
  assert.equal(r3.totalHits, 3, "hitungan terus bertambah lintas instance");
  assert.ok(r1.resetTime instanceof Date, "resetTime harus Date untuk express-rate-limit");
});

test("adapter memakai prefix untuk memisahkan bucket per-menit dari bucket lain", async () => {
  const shared = new InMemoryRateLimitStore();
  const minute = new SharedRateLimitStoreAdapter(shared, "minute:");
  minute.init({ windowMs: WINDOW } as any);

  await minute.increment("agent:1"); // key "minute:agent:1"
  // Bucket per-agen (tanpa prefix "minute:") harus TERPISAH.
  const raw = await shared.hit("agent:1", WINDOW, Date.now());
  assert.equal(raw.count, 1, "bucket per-agen tidak boleh terpengaruh limiter per-menit");
});

test("adapter jatuh ke in-memory bila store bersama error (chat tidak mati)", async () => {
  const failing: RateLimitStore = {
    async hit(): Promise<RateLimitHit> {
      throw new Error("DB down");
    },
  };
  const fallback = new InMemoryRateLimitStore();
  const adapter = new SharedRateLimitStoreAdapter(failing, "minute:", fallback);
  adapter.init({ windowMs: WINDOW } as any);

  const r1 = await adapter.increment("user:Y");
  const r2 = await adapter.increment("user:Y");
  assert.equal(r1.totalHits, 1, "fallback tetap menghitung meski store bersama error");
  assert.equal(r2.totalHits, 2, "fallback per-proses tetap membatasi (terdegradasi)");
});

test("adapter menghormati reset window setelah waktu habis", async () => {
  let nowMs = 1_000_000;
  const realNow = Date.now;
  (Date as any).now = () => nowMs;
  try {
    const shared = new InMemoryRateLimitStore();
    const adapter = new SharedRateLimitStoreAdapter(shared, "minute:");
    adapter.init({ windowMs: WINDOW } as any);

    const r1 = await adapter.increment("user:Z");
    assert.equal(r1.totalHits, 1);
    nowMs += WINDOW + 1; // window lewat
    const r2 = await adapter.increment("user:Z");
    assert.equal(r2.totalHits, 1, "window baru → hitungan reset ke 1");
  } finally {
    (Date as any).now = realNow;
  }
});

test("resetKey menghapus bucket di store bersama", async () => {
  const shared = new InMemoryRateLimitStore();
  const adapter = new SharedRateLimitStoreAdapter(shared, "minute:");
  adapter.init({ windowMs: WINDOW } as any);

  await adapter.increment("user:R");
  await adapter.resetKey("user:R");
  const after = await adapter.increment("user:R");
  assert.equal(after.totalHits, 1, "setelah resetKey hitungan mulai dari 1 lagi");
});
