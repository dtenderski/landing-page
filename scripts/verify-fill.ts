import { Pool } from "pg";
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN tagline IS NULL OR tagline = '' THEN 1 END) as no_tagline,
      COUNT(CASE WHEN personality IS NULL OR personality = '' THEN 1 END) as no_personality,
      COUNT(CASE WHEN greeting_message IS NULL OR greeting_message = '' THEN 1 END) as no_greeting,
      COUNT(CASE WHEN philosophy IS NULL OR philosophy = '' THEN 1 END) as no_philosophy,
      COUNT(CASE WHEN off_topic_response IS NULL OR off_topic_response = '' THEN 1 END) as no_off_topic,
      COUNT(CASE WHEN quality_bar IS NULL OR quality_bar = '' THEN 1 END) as no_quality,
      COUNT(CASE WHEN risk_compliance IS NULL OR risk_compliance = '' THEN 1 END) as no_risk,
      COUNT(CASE WHEN domain_charter IS NULL OR domain_charter = '' THEN 1 END) as no_charter,
      COUNT(CASE WHEN primary_outcome IS NULL OR primary_outcome = '' THEN 1 END) as no_outcome,
      COUNT(CASE WHEN tone_of_voice IS NULL OR tone_of_voice = '' THEN 1 END) as no_tone,
      COUNT(CASE WHEN communication_style IS NULL OR communication_style = '' THEN 1 END) as no_comm_style,
      COUNT(CASE WHEN expertise IS NULL OR expertise::text = '[]' OR expertise::text = 'null' THEN 1 END) as no_expertise,
      COUNT(CASE WHEN conversation_starters IS NULL OR conversation_starters::text = '[]' OR conversation_starters::text = 'null' THEN 1 END) as no_starters,
      COUNT(CASE WHEN key_phrases IS NULL OR key_phrases::text = '[]' OR key_phrases::text = 'null' THEN 1 END) as no_keyphrases,
      COUNT(CASE WHEN product_summary IS NULL OR product_summary = '' THEN 1 END) as no_product_summary,
      COUNT(CASE WHEN reasoning_policy IS NULL OR reasoning_policy = '' THEN 1 END) as no_reasoning,
      COUNT(CASE WHEN interaction_policy IS NULL OR interaction_policy = '' THEN 1 END) as no_interaction
    FROM agents WHERE is_active = true
  `);
  const r = rows[0];
  console.log("\n=== HASIL VERIFIKASI FIELD KOSONG ===");
  const fields = [
    ["tagline", r.no_tagline],
    ["personality", r.no_personality],
    ["greeting_message", r.no_greeting],
    ["philosophy", r.no_philosophy],
    ["off_topic_response", r.no_off_topic],
    ["quality_bar", r.no_quality],
    ["risk_compliance", r.no_risk],
    ["domain_charter", r.no_charter],
    ["primary_outcome", r.no_outcome],
    ["tone_of_voice", r.no_tone],
    ["communication_style", r.no_comm_style],
    ["expertise", r.no_expertise],
    ["conversation_starters", r.no_starters],
    ["key_phrases", r.no_keyphrases],
    ["product_summary", r.no_product_summary],
    ["reasoning_policy", r.no_reasoning],
    ["interaction_policy", r.no_interaction],
  ];
  console.log(`Total agen aktif: ${r.total}\n`);
  for (const [field, count] of fields) {
    const n = parseInt(count as string);
    const status = n === 0 ? "✅" : `⚠️  ${n} kosong`;
    console.log(`  ${field.toString().padEnd(22)} ${status}`);
  }

  // Sample 2 agents to confirm data quality
  const { rows: samples } = await pool.query(`
    SELECT id, name, tagline, philosophy, off_topic_response, expertise, key_phrases, conversation_starters
    FROM agents WHERE is_active=true ORDER BY RANDOM() LIMIT 2
  `);
  console.log("\n=== SAMPLE 2 AGEN RANDOM ===");
  for (const s of samples) {
    console.log(`\n[${s.id}] ${s.name}`);
    console.log("  tagline:", s.tagline?.substring(0,70));
    console.log("  philosophy:", s.philosophy?.substring(0,80));
    console.log("  off_topic:", s.off_topic_response?.substring(0,80));
    console.log("  expertise:", JSON.stringify(s.expertise)?.substring(0,100));
    console.log("  key_phrases:", JSON.stringify(s.key_phrases)?.substring(0,100));
    console.log("  starters:", JSON.stringify(s.conversation_starters)?.substring(0,100));
  }
  await pool.end();
}
main().catch(console.error);
