import { Pool } from "pg";
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN tagline IS NULL OR tagline = '' THEN 1 END) as no_tagline,
      COUNT(CASE WHEN personality IS NULL OR personality = '' THEN 1 END) as no_personality,
      COUNT(CASE WHEN greeting_message IS NULL OR greeting_message = '' THEN 1 END) as no_greeting,
      COUNT(CASE WHEN tone_of_voice IS NULL OR tone_of_voice = '' THEN 1 END) as no_tone,
      COUNT(CASE WHEN communication_style IS NULL OR communication_style = '' THEN 1 END) as no_comm_style,
      COUNT(CASE WHEN primary_outcome IS NULL OR primary_outcome = '' THEN 1 END) as no_outcome,
      COUNT(CASE WHEN philosophy IS NULL OR philosophy = '' THEN 1 END) as no_philosophy,
      COUNT(CASE WHEN domain_charter IS NULL OR domain_charter = '' THEN 1 END) as no_charter,
      COUNT(CASE WHEN off_topic_response IS NULL OR off_topic_response = '' THEN 1 END) as no_off_topic,
      COUNT(CASE WHEN quality_bar IS NULL OR quality_bar = '' THEN 1 END) as no_quality,
      COUNT(CASE WHEN risk_compliance IS NULL OR risk_compliance = '' THEN 1 END) as no_risk,
      COUNT(CASE WHEN expertise IS NULL OR expertise::text = '[]' OR expertise::text = 'null' THEN 1 END) as no_expertise,
      COUNT(CASE WHEN conversation_starters IS NULL OR conversation_starters::text = '[]' OR conversation_starters::text = 'null' THEN 1 END) as no_starters,
      COUNT(CASE WHEN key_phrases IS NULL OR key_phrases::text = '[]' OR key_phrases::text = 'null' THEN 1 END) as no_keyphrases
    FROM agents WHERE is_active = true
  `);
  console.log("EMPTY FIELD COUNTS:", JSON.stringify(rows[0], null, 2));

  const { rows: cats } = await pool.query(`
    SELECT DISTINCT category, COUNT(*) as cnt FROM agents WHERE is_active=true 
    GROUP BY category ORDER BY cnt DESC LIMIT 25
  `);
  console.log("\nCATEGORIES:");
  cats.forEach(r => console.log(`  ${r.category || 'NULL'}: ${r.cnt}`));

  const { rows: filled } = await pool.query(`
    SELECT id, name, category, tagline, personality, philosophy, greeting_message, 
           tone_of_voice, primary_outcome, expertise, conversation_starters, key_phrases,
           off_topic_response, quality_bar, risk_compliance, domain_charter
    FROM agents WHERE is_active=true 
    AND tagline IS NOT NULL AND tagline != ''
    AND personality IS NOT NULL AND personality != ''
    ORDER BY id LIMIT 3
  `);
  console.log("\nFILLED EXAMPLES:");
  filled.forEach(r => {
    console.log(`\n[${r.id}] ${r.name} | cat=${r.category}`);
    console.log("  tagline:", r.tagline);
    console.log("  personality:", r.personality?.substring(0,100));
    console.log("  philosophy:", r.philosophy?.substring(0,100));
    console.log("  greeting:", r.greeting_message?.substring(0,100));
    console.log("  tone:", r.tone_of_voice?.substring(0,60));
    console.log("  outcome:", r.primary_outcome?.substring(0,60));
    console.log("  off_topic:", r.off_topic_response?.substring(0,80));
    console.log("  quality:", r.quality_bar?.substring(0,80));
    console.log("  risk:", r.risk_compliance?.substring(0,80));
    console.log("  charter:", r.domain_charter?.substring(0,80));
    console.log("  expertise:", JSON.stringify(r.expertise)?.substring(0,100));
    console.log("  starters:", JSON.stringify(r.conversation_starters)?.substring(0,100));
    console.log("  keyphrases:", JSON.stringify(r.key_phrases)?.substring(0,100));
  });
  await pool.end();
}
main().catch(console.error);
