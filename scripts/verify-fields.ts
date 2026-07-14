import pg from "pg";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const totalRes = await db.query("SELECT COUNT(*) FROM agents");
  const total = totalRes.rows[0].count;
  console.log("Total agents:", total);
  console.log("");

  const jsonFields = ["expertise", "conversation_starters", "key_phrases", "avoid_topics"];
  const textFields = ["personality", "philosophy", "off_topic_response"];
  const allFields = [
    "personality", "philosophy", "expertise", "conversation_starters",
    "off_topic_response", "key_phrases", "avoid_topics",
    "description", "greeting_message", "tagline"
  ];

  for (const f of allFields) {
    let empty: number;
    if (jsonFields.includes(f)) {
      const r = await db.query(
        `SELECT COUNT(*) FROM agents WHERE ${f} IS NULL OR ${f}::text = '[]' OR ${f}::text = 'null'`
      );
      empty = parseInt(r.rows[0].count);
    } else {
      const r = await db.query(
        `SELECT COUNT(*) FROM agents WHERE ${f} IS NULL OR TRIM(${f}) = ''`
      );
      empty = parseInt(r.rows[0].count);
    }
    const status = empty === 0 ? "✅" : "❌";
    const pct = (((parseInt(total) - empty) / parseInt(total)) * 100).toFixed(1);
    console.log(`${status} ${f.padEnd(24)} empty: ${String(empty).padStart(3)} / ${total}  (${pct}% filled)`);
  }

  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
