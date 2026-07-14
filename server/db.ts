import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === "production";

// Prefer a pooled/transaction-pooler connection string when tersedia (mis. PgBouncer /
// Neon pooler) supaya banyak instance autoscale berbagi backend connection lebih hemat.
// Fallback ke DATABASE_URL biasa bila tidak diset.
const connectionString =
  process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

// Batas koneksi per-instance dapat disetel via env. Di autoscale, total koneksi =
// jumlah_instance × DB_POOL_MAX; jaga di bawah plafon Postgres (~112). Default 12
// agar aman untuk beberapa instance sekaligus. SATU pool ini dipakai untuk query
// aplikasi DAN session store (lihat replitAuth.ts) — tidak ada pool kedua.
function intEnv(name: string, fallback: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}
const DB_POOL_MAX = Math.max(2, intEnv("DB_POOL_MAX", 12));

export const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: DB_POOL_MAX,
});

// Prevent unhandled errors from crashing the server
pool.on("error", (err) => {
  console.error("[DB] Pool connection error:", err.message);
});

export const db = drizzle(pool, { schema });
