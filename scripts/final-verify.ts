import { Pool } from "pg";
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN tagline IS NULL OR tagline='' THEN 1 END) as no_tagline,
      COUNT(CASE WHEN personality IS NULL OR personality='' THEN 1 END) as no_personality,
      COUNT(CASE WHEN greeting_message IS NULL OR greeting_message='' THEN 1 END) as no_greeting,
      COUNT(CASE WHEN philosophy IS NULL OR philosophy='' THEN 1 END) as no_philosophy,
      COUNT(CASE WHEN off_topic_response IS NULL OR off_topic_response='' THEN 1 END) as no_off_topic,
      COUNT(CASE WHEN quality_bar IS NULL OR quality_bar='' THEN 1 END) as no_quality,
      COUNT(CASE WHEN risk_compliance IS NULL OR risk_compliance='' THEN 1 END) as no_risk,
      COUNT(CASE WHEN domain_charter IS NULL OR domain_charter='' THEN 1 END) as no_charter,
      COUNT(CASE WHEN primary_outcome IS NULL OR primary_outcome='' THEN 1 END) as no_outcome,
      COUNT(CASE WHEN tone_of_voice IS NULL OR tone_of_voice='' THEN 1 END) as no_tone,
      COUNT(CASE WHEN communication_style IS NULL OR communication_style='' THEN 1 END) as no_comm,
      COUNT(CASE WHEN expertise IS NULL OR expertise::text='[]' OR expertise::text='null' THEN 1 END) as no_exp,
      COUNT(CASE WHEN conversation_starters IS NULL OR conversation_starters::text='[]' OR conversation_starters::text='null' THEN 1 END) as no_cs,
      COUNT(CASE WHEN key_phrases IS NULL OR key_phrases::text='[]' OR key_phrases::text='null' THEN 1 END) as no_kp,
      COUNT(CASE WHEN product_summary IS NULL OR product_summary='' THEN 1 END) as no_ps,
      COUNT(CASE WHEN reasoning_policy IS NULL OR reasoning_policy='' THEN 1 END) as no_rp,
      COUNT(CASE WHEN interaction_policy IS NULL OR interaction_policy='' THEN 1 END) as no_ip,
      COUNT(CASE WHEN product_features IS NULL OR product_features::text='[]' OR product_features::text='null' THEN 1 END) as no_pf
    FROM agents WHERE is_active=true
  `);
  const r = rows[0];
  const fields: [string, string][] = [
    ["tagline", r.no_tagline], ["personality", r.no_personality],
    ["greeting_message", r.no_greeting], ["philosophy", r.no_philosophy],
    ["off_topic_response", r.no_off_topic], ["quality_bar", r.no_quality],
    ["risk_compliance", r.no_risk], ["domain_charter", r.no_charter],
    ["primary_outcome", r.no_outcome], ["tone_of_voice", r.no_tone],
    ["communication_style", r.no_comm], ["expertise", r.no_exp],
    ["conversation_starters", r.no_cs], ["key_phrases", r.no_kp],
    ["product_summary", r.no_ps], ["reasoning_policy", r.no_rp],
    ["interaction_policy", r.no_ip], ["product_features", r.no_pf],
  ];
  console.log(`\n=== VERIFIKASI FINAL — ${r.total} AGEN AKTIF ===\n`);
  let allGood = true;
  for (const [f, cnt] of fields) {
    const n = parseInt(cnt); const ok = n === 0;
    if (!ok) allGood = false;
    console.log(`  ${f.padEnd(24)} ${ok ? "✅ LENGKAP" : `⚠️  ${n} kosong`}`);
  }
  console.log(`\n${allGood ? "🎉 SEMUA FIELD LENGKAP!" : "⚠️  Ada field yang masih kosong."}`);
  await pool.end();
}
main().catch(console.error);
