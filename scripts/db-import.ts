/**
 * GUSTAFTA DATABASE IMPORT SCRIPT
 * Jalankan di akun Replit BARU setelah import dari GitHub.
 *
 * Cara pakai:
 *   1. Upload file backup ke folder backup/ di Replit baru
 *   2. npx tsx scripts/db-import.ts backup/db-backup-TANGGAL.json
 *
 * PERHATIAN: Script ini akan MENGHAPUS data yang ada di tabel sebelum import.
 * Hanya jalankan di database BARU / kosong.
 */

import { db } from "../server/db";
import * as schema from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

// Urutan import penting — tabel induk lebih dulu dari tabel anak
const IMPORT_ORDER = [
  { name: "userProfiles",          table: schema.userProfiles },
  { name: "series",                table: schema.series },
  { name: "cores",                 table: schema.cores },
  { name: "bigIdeas",              table: schema.bigIdeas },
  { name: "toolboxes",             table: schema.toolboxes },
  { name: "agents",                table: schema.agents },
  { name: "knowledgeTaxonomy",     table: schema.knowledgeTaxonomy },
  { name: "knowledgeBases",        table: schema.knowledgeBases },
  { name: "knowledgeChunks",       table: schema.knowledgeChunks },
  { name: "integrations",          table: schema.integrations },
  { name: "agentMessages",         table: schema.agentMessages },
  { name: "clientSubscriptions",   table: schema.clientSubscriptions },
  { name: "affiliates",            table: schema.affiliates },
  { name: "subscriptionsTable",    table: schema.subscriptionsTable },
  { name: "projectBrainTemplates", table: schema.projectBrainTemplates },
  { name: "projectBrainInstances", table: schema.projectBrainInstances },
  { name: "leads",                 table: schema.leads },
  { name: "scoringResults",        table: schema.scoringResults },
  { name: "miniApps",              table: schema.miniApps },
  { name: "miniAppResults",        table: schema.miniAppResults },
  { name: "vouchers",              table: schema.vouchers },
  { name: "voucherRedemptions",    table: schema.voucherRedemptions },
  { name: "userMemories",          table: schema.userMemories },
  { name: "waContacts",            table: schema.waContacts },
  { name: "waBroadcasts",          table: schema.waBroadcasts },
  { name: "waBroadcastRuns",       table: schema.waBroadcastRuns },
  { name: "tenderSources",         table: schema.tenderSources },
  { name: "tenders",               table: schema.tenders },
  { name: "tenderDocumentCatalog", table: schema.tenderDocumentCatalog },
  { name: "conversations",         table: schema.conversations },
  { name: "companyProfiles",       table: schema.companyProfiles },
  { name: "tenderSessions",        table: schema.tenderSessions },
  { name: "customDomains",         table: schema.customDomains },
  { name: "trialRequests",         table: schema.trialRequests },
  { name: "legalKnowledgeBases",   table: schema.legalKnowledgeBases },
  { name: "legalKnowledgeChunks",  table: schema.legalKnowledgeChunks },
  { name: "legalCases",            table: schema.legalCases },
  { name: "legalChatSessions",     table: schema.legalChatSessions },
  { name: "legalChatMessages",     table: schema.legalChatMessages },
  { name: "chatbotTemplates",      table: schema.chatbotTemplates },
  { name: "userOnboarding",        table: schema.userOnboarding },
  { name: "storeProducts",         table: schema.storeProducts },
  { name: "storeOrders",           table: schema.storeOrders },
] as const;

const CHUNK_SIZE = 100; // insert per batch agar tidak timeout

async function insertChunked(table: any, rows: unknown[]) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(table).values(chunk as any).onConflictDoNothing();
  }
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("❌ Harap sertakan path file backup.");
    console.error("   Contoh: npx tsx scripts/db-import.ts backup/db-backup-2026-01-01.json");
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File tidak ditemukan: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📂 Membaca file: ${filePath}`);
  const raw = fs.readFileSync(absolutePath, "utf-8");
  const backup = JSON.parse(raw) as { exportedAt: string; stats: Record<string, number>; data: Record<string, unknown[]> };

  console.log(`📅 Backup dibuat: ${new Date(backup.exportedAt).toLocaleString("id-ID")}`);
  console.log(`🔄 Memulai import...\n`);

  const results: { name: string; imported: number; skipped: number; error?: string }[] = [];

  for (const { name, table } of IMPORT_ORDER) {
    const rows = backup.data[name] ?? [];
    if (rows.length === 0) {
      console.log(`  ⏭️  ${name}: kosong, dilewati`);
      results.push({ name, imported: 0, skipped: 0 });
      continue;
    }

    try {
      await insertChunked(table, rows);
      console.log(`  ✅ ${name}: ${rows.length} baris diimport`);
      results.push({ name, imported: rows.length, skipped: 0 });
    } catch (err: any) {
      console.warn(`  ⚠️  ${name}: error — ${err.message}`);
      results.push({ name, imported: 0, skipped: rows.length, error: err.message });
    }
  }

  const totalImported = results.reduce((a, r) => a + r.imported, 0);
  const totalError = results.filter((r) => r.error).length;

  console.log(`\n✅ Import selesai!`);
  console.log(`   Total diimport : ${totalImported} baris`);
  console.log(`   Tabel error    : ${totalError}`);

  if (totalError > 0) {
    console.log(`\n⚠️  Tabel yang gagal:`);
    results.filter((r) => r.error).forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
    console.log(`\n   Tabel yang gagal biasanya karena schema belum dibuat.`);
    console.log(`   Pastikan sudah jalankan: npx drizzle-kit push`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Import gagal:", err);
  process.exit(1);
});
