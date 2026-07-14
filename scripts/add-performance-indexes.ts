/**
 * Performance Indexes — tambahkan index pada kolom yang sering di-query
 * Idempotent: skip IF NOT EXISTS
 */
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const INDEXES = [
  // agents
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_is_active ON agents(is_active)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_toolbox_id ON agents(toolbox_id)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_parent_agent_id ON agents(parent_agent_id)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_behavior_preset ON agents(behavior_preset)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_access_token ON agents(access_token)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_big_idea_id ON agents(big_idea_id) WHERE big_idea_id IS NOT NULL`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_is_active_toolbox ON agents(toolbox_id, is_active)`,

  // knowledge_bases
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kb_agent_id ON knowledge_bases(agent_id)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kb_status ON knowledge_bases(status)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kb_taxonomy_id ON knowledge_bases(taxonomy_id) WHERE taxonomy_id IS NOT NULL`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kb_agent_status ON knowledge_bases(agent_id, status)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kb_is_shared ON knowledge_bases(is_shared) WHERE is_shared = true`,

  // knowledge_chunks
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_agent_id ON knowledge_chunks(agent_id)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_kb_id ON knowledge_chunks(knowledge_base_id)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_agent_index ON knowledge_chunks(agent_id, chunk_index)`,

  // conversations & messages
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conv_agent_id ON conversations(agent_id) WHERE agent_id IS NOT NULL`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conv_user_id ON conversations(user_id) WHERE user_id IS NOT NULL`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_msg_conversation_id ON messages(conversation_id)`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_msg_created_at ON messages(created_at DESC)`,
];

async function main() {
  const client = await pool.connect();
  console.log("🔧 Menambahkan database indexes untuk performa...\n");
  let ok = 0, skip = 0;
  for (const sql of INDEXES) {
    const name = sql.match(/idx_\w+/)?.[0] || "?";
    try {
      await client.query(sql);
      console.log(`  ✅ ${name}`);
      ok++;
    } catch (e: any) {
      if (e.code === "42P07") { console.log(`  ⏭  ${name} (already exists)`); skip++; }
      else { console.error(`  ❌ ${name}: ${e.message}`); }
    }
  }

  // Verify indexes
  const { rows } = await client.query(`
    SELECT indexname, tablename FROM pg_indexes
    WHERE schemaname='public' AND indexname LIKE 'idx_%'
    ORDER BY tablename, indexname
  `);
  console.log(`\n✅ Total indexes aktif: ${rows.length} (${ok} baru, ${skip} sudah ada)`);
  rows.forEach(r => console.log(`   [${r.tablename}] ${r.indexname}`));

  // Run ANALYZE to update statistics
  console.log("\n📊 Running ANALYZE untuk update query planner statistics...");
  await client.query("ANALYZE agents");
  await client.query("ANALYZE knowledge_bases");
  await client.query("ANALYZE knowledge_chunks");
  console.log("✅ ANALYZE selesai\n");

  client.release();
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
