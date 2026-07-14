/**
 * GUSTAFTA — SYNC DATA PRODUCTION → DEVELOPMENT
 * ================================================
 * Tarik data konten dari database production ke database development.
 * Aman dijalankan berulang kali: pakai UPSERT (insert or update).
 * Data user & transaksi TIDAK ikut disync.
 *
 * CARA PAKAI:
 *   1. Buka Replit production → Settings → Database → copy DATABASE_URL
 *   2. Set environment variable di dev:
 *      PROD_DATABASE_URL=postgresql://... npx tsx scripts/sync-from-prod.ts
 *
 *   Atau set dulu di shell:
 *      export PROD_DATABASE_URL="postgresql://..."
 *      npx tsx scripts/sync-from-prod.ts
 *
 * OPSI PILIH TABEL:
 *   npx tsx scripts/sync-from-prod.ts --tables=agents,knowledge_bases
 *   npx tsx scripts/sync-from-prod.ts --tables=all
 */

import { Pool } from "pg";
import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

// ─── Tabel konten yang akan disync ────────────────────────────────────────
// Urutan penting: tabel induk harus lebih dulu dari tabel anak (foreign key)
const SYNC_TABLES = [
  {
    key: "series",
    table: schema.series,
    label: "Series",
    conflictKey: "id",
  },
  {
    key: "cores",
    table: schema.cores,
    label: "Cores",
    conflictKey: "id",
  },
  {
    key: "bigIdeas",
    table: schema.bigIdeas,
    label: "Big Ideas",
    conflictKey: "id",
  },
  {
    key: "toolboxes",
    table: schema.toolboxes,
    label: "Toolboxes",
    conflictKey: "id",
  },
  {
    key: "agents",
    table: schema.agents,
    label: "Agents (Chatbot)",
    conflictKey: "id",
  },
  {
    key: "knowledgeTaxonomy",
    table: schema.knowledgeTaxonomy,
    label: "Knowledge Taxonomy",
    conflictKey: "id",
  },
  {
    key: "knowledgeBases",
    table: schema.knowledgeBases,
    label: "Knowledge Bases",
    conflictKey: "id",
  },
  {
    key: "knowledgeChunks",
    table: schema.knowledgeChunks,
    label: "Knowledge Chunks",
    conflictKey: "id",
  },
  {
    key: "chatbotTemplates",
    table: schema.chatbotTemplates,
    label: "Chatbot Templates",
    conflictKey: "id",
  },
  {
    key: "storeProducts",
    table: schema.storeProducts,
    label: "Store Products",
    conflictKey: "id",
  },
  {
    key: "miniApps",
    table: schema.miniApps,
    label: "Mini Apps",
    conflictKey: "id",
  },
  {
    key: "integrations",
    table: schema.integrations,
    label: "Integrations",
    conflictKey: "id",
  },
  {
    key: "legalKnowledgeBases",
    table: schema.legalKnowledgeBases,
    label: "Legal Knowledge Bases",
    conflictKey: "id",
  },
  {
    key: "legalKnowledgeChunks",
    table: schema.legalKnowledgeChunks,
    label: "Legal Knowledge Chunks",
    conflictKey: "id",
  },
  {
    key: "tenderDocumentCatalog",
    table: schema.tenderDocumentCatalog,
    label: "Tender Document Catalog",
    conflictKey: "id",
  },
  {
    key: "projectBrainTemplates",
    table: schema.projectBrainTemplates,
    label: "Project Brain Templates",
    conflictKey: "id",
  },
  {
    key: "vouchers",
    table: schema.vouchers,
    label: "Vouchers",
    conflictKey: "id",
  },
] as const;

// ─── Tabel yang sengaja TIDAK disync (data user & transaksi) ──────────────
const SKIP_REASON: Record<string, string> = {
  userProfiles:          "data akun pengguna",
  agentMessages:         "riwayat chat user",
  clientSubscriptions:   "data langganan user",
  affiliates:            "data afiliasi",
  mlmCommissions:        "data komisi MLM",
  subscriptionsTable:    "data subscription",
  leads:                 "data prospek",
  scoringResults:        "hasil asesmen user",
  miniAppResults:        "hasil mini-app user",
  voucherRedemptions:    "penggunaan voucher",
  userMemories:          "memori percakapan user",
  waContacts:            "kontak WhatsApp",
  waBroadcasts:          "broadcast WhatsApp",
  tenders:               "data tender user",
  conversations:         "sesi percakapan",
  tenderSessions:        "sesi tender user",
  legalCases:            "kasus hukum user",
  legalChatSessions:     "sesi chat legal user",
  legalChatMessages:     "pesan chat legal",
  storeOrders:           "pesanan toko",
  companyProfiles:       "profil perusahaan user",
  customDomains:         "domain kustom user",
  trialRequests:         "permintaan trial",
  userOnboarding:        "onboarding user",
};

const CHUNK_SIZE = 50;

async function readTableFromProd(pool: Pool, tableName: string): Promise<any[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM "${tableName}" ORDER BY id`);
    return res.rows;
  } finally {
    client.release();
  }
}

function getTableName(tableObj: any): string {
  return tableObj[Symbol.for("drizzle:Name")] ?? tableObj._.name ?? String(tableObj);
}

async function upsertRows(tableObj: any, rows: any[]): Promise<number> {
  if (rows.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(tableObj).values(chunk).onConflictDoNothing();
    count += chunk.length;
  }
  return count;
}

async function resetSequence(tableName: string) {
  try {
    await db.execute(
      sql.raw(`SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1))`)
    );
  } catch {
    // tabel mungkin tidak punya serial id
  }
}

async function main() {
  const prodUrl = process.env.PROD_DATABASE_URL;
  if (!prodUrl) {
    console.error("❌  PROD_DATABASE_URL tidak ditemukan!");
    console.error("");
    console.error("   Cara set:");
    console.error('   export PROD_DATABASE_URL="postgresql://user:pass@host/db"');
    console.error("   npx tsx scripts/sync-from-prod.ts");
    console.error("");
    console.error("   Cari DATABASE_URL di: Replit production → Settings → Database");
    process.exit(1);
  }

  // Filter tabel dari argumen --tables=...
  const tablesArg = process.argv.find((a) => a.startsWith("--tables="));
  let selectedKeys: string[] | null = null;
  if (tablesArg) {
    const val = tablesArg.replace("--tables=", "").trim();
    if (val !== "all") {
      selectedKeys = val.split(",").map((k) => k.trim());
    }
  }

  const tablesToSync = selectedKeys
    ? SYNC_TABLES.filter((t) => selectedKeys!.includes(t.key))
    : SYNC_TABLES;

  if (tablesToSync.length === 0) {
    console.error("❌  Tidak ada tabel yang cocok. Cek nama tabel di argumen --tables=");
    process.exit(1);
  }

  console.log("╔════════════════════════════════════════════╗");
  console.log("║  GUSTAFTA — SYNC PRODUCTION → DEV         ║");
  console.log("╚════════════════════════════════════════════╝\n");
  console.log(`🔌 Menghubungkan ke database production...`);

  const prodPool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await prodPool.query("SELECT 1");
    console.log("✅  Terhubung ke production DB\n");
  } catch (err: any) {
    console.error(`❌  Gagal konek ke production: ${err.message}`);
    process.exit(1);
  }

  console.log(`📋 Tabel yang akan disync: ${tablesToSync.length}`);
  console.log(`⏭️  Tabel yang dilewati (data user/transaksi): ${Object.keys(SKIP_REASON).length}\n`);

  type Result = { label: string; fetched: number; inserted: number; error?: string };
  const results: Result[] = [];

  for (const { key, table, label } of tablesToSync) {
    const tableName = getTableName(table);
    process.stdout.write(`  🔄 ${label.padEnd(30, ".")} `);
    try {
      const rows = await readTableFromProd(prodPool, tableName);
      if (rows.length === 0) {
        console.log(`0 baris (kosong di production, dilewati)`);
        results.push({ label, fetched: 0, inserted: 0 });
        continue;
      }
      const inserted = await upsertRows(table, rows);
      await resetSequence(tableName);
      console.log(`${rows.length} baris disync`);
      results.push({ label, fetched: rows.length, inserted });
    } catch (err: any) {
      const msg = err.message?.slice(0, 80) ?? "error tidak diketahui";
      console.log(`⚠️  ERROR — ${msg}`);
      results.push({ label, fetched: 0, inserted: 0, error: msg });
    }
  }

  await prodPool.end();

  const totalFetched  = results.reduce((a, r) => a + r.fetched, 0);
  const totalInserted = results.reduce((a, r) => a + r.inserted, 0);
  const errorCount    = results.filter((r) => r.error).length;

  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║  HASIL SYNC                                ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log(`  Total baris di production  : ${totalFetched}`);
  console.log(`  Total berhasil disync       : ${totalInserted}`);
  console.log(`  Tabel error                : ${errorCount}`);

  if (errorCount > 0) {
    console.log("\n⚠️  Tabel yang gagal:");
    results
      .filter((r) => r.error)
      .forEach((r) => console.log(`   - ${r.label}: ${r.error}`));
    console.log("\n   Kemungkinan penyebab:");
    console.log("   • Schema dev belum di-update → jalankan: npx drizzle-kit push");
    console.log("   • Tabel belum ada di dev → cek shared/schema.ts");
  }

  console.log("\n✅  Selesai! Restart server dev untuk muat data baru.");
  console.log("   npx tsx server/index.ts\n");

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("❌  Sync gagal:", err);
  process.exit(1);
});
