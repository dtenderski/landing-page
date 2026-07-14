/**
 * GUSTAFTA DATABASE EXPORT SCRIPT
 * Jalankan di akun Replit LAMA sebelum pindah.
 *
 * Cara pakai:
 *   npx tsx scripts/db-export.ts
 *
 * Output: backup/db-backup-TANGGAL.json
 */

import { db } from "../server/db";
import * as schema from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

const TABLES = [
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

async function main() {
  console.log("🔄 Memulai export database Gustafta...\n");

  const backup: Record<string, unknown[]> = {};
  const stats: Record<string, number> = {};

  for (const { name, table } of TABLES) {
    try {
      const rows = await db.select().from(table as any);
      backup[name] = rows;
      stats[name] = rows.length;
      console.log(`  ✅ ${name}: ${rows.length} baris`);
    } catch (err: any) {
      console.warn(`  ⚠️  ${name}: gagal (${err.message})`);
      backup[name] = [];
      stats[name] = 0;
    }
  }

  // Buat folder backup kalau belum ada
  const backupDir = path.join(process.cwd(), "backup");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `db-backup-${dateStr}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify({ exportedAt: new Date().toISOString(), stats, data: backup }, null, 2), "utf-8");

  const totalRows = Object.values(stats).reduce((a, b) => a + b, 0);
  const fileSizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ Export selesai!`);
  console.log(`   File  : backup/${fileName}`);
  console.log(`   Total : ${totalRows} baris dari ${TABLES.length} tabel`);
  console.log(`   Size  : ${fileSizeMB} MB`);
  console.log(`\n📁 Download file backup/${fileName} dari Replit lalu simpan di komputer Anda.`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Export gagal:", err);
  process.exit(1);
});
