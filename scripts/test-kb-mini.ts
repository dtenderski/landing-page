import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  // Test single insert with simple content
  const { rows } = await pool.query(`SELECT id, name FROM agents WHERE id = 3 LIMIT 1`);
  console.log("Agent:", rows[0]);
  await pool.query(
    `INSERT INTO knowledge_bases (agent_id, name, type, content, description, processing_status, knowledge_layer, source_authority, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [3, "Test KB", "text", "# Test Content\nHello world", "Test", "completed", "foundational", "Test", "active", new Date().toISOString()]
  );
  console.log("Insert succeeded!");
  await pool.query(`DELETE FROM knowledge_bases WHERE agent_id = 3 AND name = 'Test KB'`);
  await pool.end();
}
main().catch(e => console.error("Error:", e.message));
