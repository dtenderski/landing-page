import { Pool } from "pg";
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // KB table structure
  const { rows: cols } = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'knowledge_bases' ORDER BY ordinal_position
  `);
  console.log("KB COLUMNS:", cols.map(c => `${c.column_name}(${c.data_type})`).join(", "));

  // How many agents have KB vs not
  const { rows: summary } = await pool.query(`
    SELECT 
      COUNT(DISTINCT a.id) as total_agents,
      COUNT(DISTINCT kb.agent_id) as agents_with_kb,
      COUNT(DISTINCT a.id) - COUNT(DISTINCT kb.agent_id) as agents_without_kb,
      COUNT(kb.id) as total_kb_entries
    FROM agents a
    LEFT JOIN knowledge_bases kb ON kb.agent_id = a.id
    WHERE a.is_active = true
  `);
  console.log("\nKB SUMMARY:", JSON.stringify(summary[0], null, 2));

  // Sample KB entry to understand format
  const { rows: sample } = await pool.query(`
    SELECT kb.*, a.name as agent_name 
    FROM knowledge_bases kb
    JOIN agents a ON a.id = kb.agent_id
    LIMIT 3
  `);
  console.log("\nSAMPLE KB ENTRIES:");
  sample.forEach(r => {
    console.log(`\n[Agent: ${r.agent_name}]`);
    console.log("  id:", r.id, "| type:", r.type || r.source_type, "| label:", r.label || r.title);
    const keys = Object.keys(r).filter(k => k !== 'agent_name');
    keys.forEach(k => {
      const v = r[k];
      if (v && typeof v === 'string' && v.length > 0) {
        console.log(`  ${k}: ${v.substring(0, 80)}`);
      } else if (v && typeof v !== 'string') {
        console.log(`  ${k}: ${JSON.stringify(v).substring(0, 80)}`);
      }
    });
  });

  // Agents without any KB
  const { rows: noKb } = await pool.query(`
    SELECT a.id, a.name, a.category, a.is_orchestrator
    FROM agents a
    LEFT JOIN knowledge_bases kb ON kb.agent_id = a.id
    WHERE a.is_active = true AND kb.id IS NULL
    ORDER BY a.id
    LIMIT 20
  `);
  console.log(`\nFIRST 20 AGENTS WITHOUT KB (of ${summary[0].agents_without_kb} total):`);
  noKb.forEach(r => console.log(`  [${r.id}] ${r.name} | cat=${r.category} | orch=${r.is_orchestrator}`));

  await pool.end();
}
main().catch(console.error);
