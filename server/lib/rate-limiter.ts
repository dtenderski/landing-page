import {
  rateLimit,
  ipKeyGenerator,
  type Options,
  type Store,
  type ClientRateLimitInfo,
} from "express-rate-limit";
import type { Request, Response } from "express";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function getUserId(req: Request): string | null {
  const r = req as any;
  return r.user?.claims?.sub || r.user?.id || r.session?.emailUser?.id || null;
}

function isAuthenticatedUser(req: Request): boolean {
  const r = req as any;
  if (r.isAuthenticated && r.isAuthenticated()) return true;
  if (r.session?.emailUser?.id) return true;
  return false;
}

function isAdminUser(req: Request): boolean {
  const userId = getUserId(req);
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(String(userId));
}

/**
 * Mode Event — dipakai saat soft-launch / acara dengan lonjakan peserta serempak
 * (mis. Indobuildtech 2026). Saat aktif, batas per-akun & per-IP dinaikkan supaya
 * ratusan peserta yang sah tidak saling mengunci.
 *
 * Aktivasi (env, tanpa perlu deploy ulang kode):
 *  - EVENT_MODE = "on" / "1" / "true"  → paksa aktif
 *  - EVENT_MODE = "off"                → paksa nonaktif
 *  - atau rentang tanggal: EVENT_MODE_START & EVENT_MODE_END (ISO, mis. 2026-07-08)
 *    → aktif otomatis selama sekarang berada di dalam rentang.
 */
export function isEventMode(now: Date = new Date()): boolean {
  const flag = (process.env.EVENT_MODE || "").trim().toLowerCase();
  if (["on", "1", "true", "yes"].includes(flag)) return true;
  if (["off", "0", "false", "no"].includes(flag)) return false;

  const startRaw = (process.env.EVENT_MODE_START || "").trim();
  const endRaw = (process.env.EVENT_MODE_END || "").trim();
  if (!startRaw && !endRaw) return false;

  const t = now.getTime();
  const start = startRaw ? Date.parse(startRaw) : Number.NEGATIVE_INFINITY;
  const end = endRaw ? Date.parse(endRaw) : Number.POSITIVE_INFINITY;
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return t >= start && t <= end;
}

// Batas per menit untuk endpoint chat.
function intEnv(name: string, fallback: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}
const AUTH_LIMIT_NORMAL = intEnv("CHAT_LIMIT_AUTH", 120);
const AUTH_LIMIT_EVENT = intEnv("CHAT_LIMIT_AUTH_EVENT", 240);
const ANON_LIMIT_NORMAL = intEnv("CHAT_LIMIT_ANON", 30);
const ANON_LIMIT_EVENT = intEnv("CHAT_LIMIT_ANON_EVENT", 60);

const retryAfterHandler = (
  _req: Request,
  res: Response,
  _next: any,
  options: Options
) => {
  const windowSec = Math.ceil((options.windowMs as number) / 1000);
  res.setHeader("Retry-After", String(windowSec));
  res.status(429).json({
    error: "Too Many Requests",
    message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
    retryAfter: windowSec,
  });
};

/**
 * Batas per-menit efektif untuk sebuah request chat.
 * Admin → 0 (di-skip terpisah). User login dapat kuota lebih besar dari anonim,
 * dan mode event menaikkan keduanya. Diekspor agar bisa diuji regresi langsung.
 */
export function chatRateLimitValue(req: Request, now: Date = new Date()): number {
  if (isAdminUser(req)) return 0;
  const event = isEventMode(now);
  if (isAuthenticatedUser(req)) return event ? AUTH_LIMIT_EVENT : AUTH_LIMIT_NORMAL;
  return event ? ANON_LIMIT_EVENT : ANON_LIMIT_NORMAL;
}

/**
 * Kunci bucket rate-limit untuk sebuah request chat.
 * User login dikunci per-AKUN (`user:<id>`) — BUKAN per-IP: di venue acara
 * ratusan peserta berbagi satu IP WiFi, jadi keying per-IP membuat mereka
 * saling mengunci. Anonim tetap dibatasi per-IP. Diekspor untuk uji regresi.
 */
export function chatRateLimitKey(req: Request): string {
  const userId = getUserId(req);
  if (isAuthenticatedUser(req) && userId) return `user:${userId}`;
  return ipKeyGenerator(req.ip ?? "");
}

const AGENT_WINDOW_MS = 60 * 60 * 1000;
const AGENT_MAX_UNAUTHENTICATED = 100;

/**
 * Lapisan proteksi KEDUA: batas per-AGEN per jam untuk pemanggil ANONIM.
 *
 * Penghitungnya WAJIB dibagi lintas-instance. Di deployment autoscale setiap
 * proses punya memorinya sendiri, jadi Map in-memory saja membuat bot yang
 * memutar antar-instance bisa melewati 100/jam per agen sementara tiap instance
 * masih merasa aman. Karena itu penghitung disimpan di store BERSAMA (PostgreSQL)
 * lewat abstraksi `RateLimitStore` di bawah.
 */
export interface RateLimitHit {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  /**
   * Catat satu request untuk `key`. Mengembalikan hitungan berjalan di dalam
   * window aktif dan kapan window itu berakhir (epoch ms). Bila window lama sudah
   * lewat, hitungan di-reset ke 1 dengan window baru. Operasi ini WAJIB atomik
   * agar konsisten saat banyak instance menaikkan bucket yang sama serempak.
   */
  hit(key: string, windowMs: number, now: number): Promise<RateLimitHit>;
  /** Opsional: hapus/nolkan bucket sebuah key (dipakai express-rate-limit resetKey). */
  reset?(key: string): Promise<void>;
}

/**
 * Store in-memory (per-proses). Dipakai sebagai FALLBACK saat store bersama
 * gagal (mis. DB tak terjangkau) supaya proteksi tetap ada meski hanya
 * per-instance, dan sebagai store yang mudah disuntik pada unit test.
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async hit(key: string, windowMs: number, now: number): Promise<RateLimitHit> {
    const entry = this.store.get(key);
    if (!entry || now >= entry.resetAt) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.store.set(key, fresh);
      return { ...fresh };
    }
    entry.count += 1;
    return { count: entry.count, resetAt: entry.resetAt };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  cleanup(now: number = Date.now()): void {
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) this.store.delete(key);
    }
  }
}

type SqlQuery = (
  text: string,
  params: any[]
) => Promise<{ rows: any[] }>;

// Probabilitas & batas batch untuk pemangkasan baris kedaluwarsa yang DIPICU
// oleh lalu-lintas (delete-on-write). Bisa disetel lewat env tanpa deploy ulang.
const PRUNE_PROBABILITY = (() => {
  const raw = parseFloat(process.env.RATE_LIMIT_PRUNE_PROBABILITY ?? "");
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.02; // ~1 dari 50 hit ikut memangkas baris basi
})();
const PRUNE_BATCH_LIMIT = intEnv("RATE_LIMIT_PRUNE_BATCH", 1000);

export interface PostgresRateLimitStoreOptions {
  /** Peluang (0..1) sebuah hit ikut memangkas baris kedaluwarsa. Default 0.02. */
  pruneProbability?: number;
  /** Batas baris kedaluwarsa yang dihapus per pemangkasan. Default 1000. */
  pruneBatchLimit?: number;
  /** Sumber acak (dapat disuntik saat test agar deterministik). Default Math.random. */
  random?: () => number;
}

/**
 * Store bersama berbasis PostgreSQL. Satu UPSERT atomik menaikkan hitungan
 * (atau me-reset window bila sudah lewat) dan mengembalikan nilai final.
 * Karena `INSERT ... ON CONFLICT DO UPDATE` mengunci baris, kenaikan serempak
 * dari banyak instance ter-serialisasi dengan benar → satu hitungan tunggal.
 *
 * PEMANGKASAN DIPICU LALU-LINTAS (delete-on-write): tabel `rate_limit_buckets`
 * hanya membengkak karena WRITE (bucket per-menit lahir 1 baris per IP/akun per
 * menit, lalu jadi baris yatim yang kedaluwarsa dan tak pernah disentuh lagi).
 * Karena itu setiap hit — dengan peluang kecil `pruneProbability` — ikut
 * menghapus SEBATCH baris kedaluwarsa (`reset_at <= now`, dibatasi `LIMIT` agar
 * tidak mengunci tabel). Ini menjadikan pembersihan sebanding dengan churn dan
 * tidak bergantung pada satu instance yang harus tetap hidup (berbeda dari
 * `setInterval` yang best-effort). Idempoten & aman dari banyak instance.
 */
export class PostgresRateLimitStore implements RateLimitStore {
  private pruneProbability: number;
  private pruneBatchLimit: number;
  private random: () => number;

  constructor(private query: SqlQuery, opts: PostgresRateLimitStoreOptions = {}) {
    this.pruneProbability = opts.pruneProbability ?? PRUNE_PROBABILITY;
    this.pruneBatchLimit = opts.pruneBatchLimit ?? PRUNE_BATCH_LIMIT;
    this.random = opts.random ?? Math.random;
  }

  async hit(key: string, windowMs: number, now: number): Promise<RateLimitHit> {
    const resetAt = now + windowMs;
    const { rows } = await this.query(
      `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (bucket_key) DO UPDATE SET
         count = CASE
           WHEN rate_limit_buckets.reset_at <= $3 THEN 1
           ELSE rate_limit_buckets.count + 1
         END,
         reset_at = CASE
           WHEN rate_limit_buckets.reset_at <= $3 THEN EXCLUDED.reset_at
           ELSE rate_limit_buckets.reset_at
         END
       RETURNING count, reset_at`,
      [key, resetAt, now]
    );
    const row = rows[0];

    // Fire-and-forget: pemangkasan tidak menahan jalur respons (tak di-await).
    // Peluang kecil per hit sudah cukup karena volume hit tinggi = pemangkasan
    // sering, sebanding dengan laju churn tabel.
    if (this.pruneProbability > 0 && this.random() < this.pruneProbability) {
      void this.pruneExpired(now).catch(() => {
        // best-effort — jangan pernah mematikan chat karena pembersihan gagal.
      });
    }

    return { count: Number(row.count), resetAt: Number(row.reset_at) };
  }

  /**
   * Hapus SEBATCH baris kedaluwarsa (`reset_at <= now`). Dibatasi `LIMIT` lewat
   * subquery agar tidak mengunci seluruh tabel saat backlog besar; dipanggil
   * berulang oleh lalu-lintas sampai backlog habis. Mengembalikan jumlah baris
   * yang terhapus.
   */
  async pruneExpired(now: number, limit: number = this.pruneBatchLimit): Promise<number> {
    // Race-safe: baris kandidat dipilih (tertua dulu) & DIKUNCI via
    // `FOR UPDATE SKIP LOCKED`, dan `reset_at <= $1` DIULANG di klausa DELETE
    // luar. Tanpa cek-ulang ini, sebuah baris yang terpilih sebagai kedaluwarsa
    // bisa di-reset oleh `hit()` (window baru) di antara SELECT dan DELETE lalu
    // tetap terhapus karena kunci-nya masih cocok — menghapus counter aktif dan
    // melemahkan penegakan batas. SKIP LOCKED juga mencegah dua instance saling
    // menunggu baris yang sama.
    const { rows } = await this.query(
      `DELETE FROM rate_limit_buckets
       WHERE reset_at <= $1
         AND bucket_key IN (
           SELECT bucket_key FROM rate_limit_buckets
           WHERE reset_at <= $1
           ORDER BY reset_at
           LIMIT $2
           FOR UPDATE SKIP LOCKED
         )
       RETURNING bucket_key`,
      [now, limit]
    );
    return rows.length;
  }

  async reset(key: string): Promise<void> {
    await this.query(`DELETE FROM rate_limit_buckets WHERE bucket_key = $1`, [
      key,
    ]);
  }
}

// Store bersama default = PostgreSQL. Import `pool` secara dinamis supaya modul
// ini tetap bisa di-import di unit test tanpa membuka koneksi DB (test menyuntik
// store sendiri lewat `__setAgentRateLimitStore`).
const defaultSharedStore = new PostgresRateLimitStore(async (text, params) => {
  const { pool } = await import("../db");
  return pool.query(text, params);
});

/**
 * Adapter yang membungkus `RateLimitStore` (Postgres bersama) agar bisa dipakai
 * langsung sebagai `store` oleh express-rate-limit. Dengan ini limiter per-MENIT
 * (`chatIpRateLimiter`) menghitung di store BERSAMA lintas-instance — sama seperti
 * batas per-agen per jam — bukan lagi MemoryStore per-proses yang bisa ditembus
 * klien yang berputar antar-instance autoscale.
 *
 * Bila store bersama error saat runtime (mis. DB down), adapter JATUH ke store
 * in-memory per-proses supaya chat tidak mati — proteksi terdegradasi (per-instance)
 * tapi tetap ada, konsisten dengan `chatAgentIdRateLimiter`.
 */
export class SharedRateLimitStoreAdapter implements Store {
  localKeys = false;
  prefix: string;
  private windowMs = 60 * 1000;

  constructor(
    private shared: RateLimitStore,
    prefix = "",
    private fallback: InMemoryRateLimitStore = new InMemoryRateLimitStore(),
  ) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const now = Date.now();
    const fullKey = `${this.prefix}${key}`;
    let hit: RateLimitHit;
    try {
      hit = await this.shared.hit(fullKey, this.windowMs, now);
    } catch (err) {
      console.error(
        "[rate-limiter] shared store gagal (per-menit), fallback in-memory:",
        (err as Error)?.message ?? err,
      );
      hit = await this.fallback.hit(fullKey, this.windowMs, now);
    }
    return { totalHits: hit.count, resetTime: new Date(hit.resetAt) };
  }

  // decrement hanya dipakai bila skipFailedRequests/skipSuccessfulRequests aktif;
  // limiter chat tidak memakainya, jadi best-effort no-op sudah aman.
  async decrement(_key: string): Promise<void> {}

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    try {
      if (this.shared.reset) await this.shared.reset(fullKey);
    } catch {
      // best-effort
    }
    if (this.fallback.reset) await this.fallback.reset(fullKey);
  }
}

// Fallback per-proses bila store bersama error di runtime.
const memoryFallbackStore = new InMemoryRateLimitStore();

let agentRateLimitStore: RateLimitStore = defaultSharedStore;

/** Suntik store alternatif (dipakai unit test). */
export function __setAgentRateLimitStore(store: RateLimitStore): void {
  agentRateLimitStore = store;
}

/** Kembalikan ke store bersama default (bersihkan efek test). */
export function __resetAgentRateLimitStore(): void {
  agentRateLimitStore = defaultSharedStore;
}

// Store bersama untuk limiter per-MENIT. Di-key dengan prefix "minute:" supaya
// tidak bertabrakan dengan bucket per-agen ("agent:") di tabel yang sama.
const chatMinuteStore = new SharedRateLimitStoreAdapter(
  defaultSharedStore,
  "minute:",
  memoryFallbackStore,
);

export const chatIpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: (req: Request) => chatRateLimitValue(req),
  keyGenerator: (req: Request) => chatRateLimitKey(req),
  skip: (req: Request) => isAdminUser(req),
  store: chatMinuteStore,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: retryAfterHandler as any,
  message: "Terlalu banyak permintaan dari IP ini.",
});

export async function chatAgentIdRateLimiter(
  req: Request,
  res: Response,
  next: () => void
): Promise<void> {
  if (isAuthenticatedUser(req)) return next();

  const agentId = req.body?.agentId;
  if (!agentId) return next();

  const now = Date.now();
  const key = `agent:${String(agentId)}`;

  let result: RateLimitHit;
  try {
    result = await agentRateLimitStore.hit(key, AGENT_WINDOW_MS, now);
  } catch (err) {
    // Store bersama gagal (mis. DB down) → jangan matikan chat; jatuh ke
    // proteksi in-memory per-instance (terdegradasi tapi tetap membatasi).
    console.error(
      "[rate-limiter] shared store gagal, fallback in-memory:",
      (err as Error)?.message ?? err
    );
    result = await memoryFallbackStore.hit(key, AGENT_WINDOW_MS, now);
  }

  if (result.count > AGENT_MAX_UNAUTHENTICATED) {
    const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      error: "Too Many Requests",
      message:
        "Agen ini telah mencapai batas permintaan per jam. Silakan coba lagi nanti.",
      retryAfter: retryAfterSec,
    });
    return;
  }

  return next();
}

// BACKSTOP: pembersih terjadwal di store bersama. Jalur pembersihan UTAMA kini
// dipicu lalu-lintas (delete-on-write di `PostgresRateLimitStore.hit`), jadi
// interval ini hanya jaring pengaman untuk baris yatim saat lalu-lintas sepi.
// Memangkas per-BATCH (via `pruneExpired`, dibatasi LIMIT) berulang sampai
// backlog habis agar tidak mengunci tabel dalam satu DELETE raksasa. Idempoten &
// aman dari banyak instance. .unref(): timer tak boleh menahan event loop hidup.
setInterval(
  async () => {
    try {
      let deleted = 0;
      // Kuras backlog per batch; batasi jumlah putaran agar satu tick tidak
      // berjalan tanpa henti bila churn sangat tinggi (sisanya diambil tick
      // berikut / delete-on-write).
      for (let i = 0; i < 50; i++) {
        deleted = await defaultSharedStore.pruneExpired(Date.now());
        if (deleted < PRUNE_BATCH_LIMIT) break;
      }
    } catch {
      // Bersih-bersih bersifat best-effort; abaikan error sementara.
    }
    memoryFallbackStore.cleanup();
  },
  2 * 60 * 1000
).unref();
