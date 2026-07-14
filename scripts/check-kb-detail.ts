import { Pool } from "pg";
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(`SELECT id, agent_id, name, type, content, description, processing_status, knowledge_layer, source_url, source_authority, status FROM knowledge_bases ORDER BY id LIMIT 5`);
  rows.forEach(r => {
    console.log(`\n=== KB ID ${r.id} | Agent ${r.agent_id} ===`);
    console.log("name:", r.name);
    console.log("type:", r.type, "| layer:", r.knowledge_layer, "| status:", r.status);
    console.log("description:", r.description?.substring(0, 120));
    console.log("source_authority:", r.source_authority);
    console.log("content (first 600 chars):\n", r.content?.substring(0, 600));
  });
  // Also check agents that have KB to see which ones (these should be skipped)
  const { rows: withKb } = await pool.query(`SELECT DISTINCT agent_id FROM knowledge_bases`);
  console.log("\nAgent IDs that already have KB:", withKb.map(r => r.agent_id).join(", "));
  await pool.end();
}
main().catch(console.error);
