-- Audit reproducible: Kebijakan Agen + field lengkap (agen + alat bantu)
-- Run: psql "$DATABASE_URL" -f docs/audit/policy-fields-audit-2026-04-24-v2.sql
-- Expected: semua kolom empty_* = 0, agents_with_any_empty_policy = 0

\echo === Query A: Empty TEXT fields per agent + toolbox ===
SELECT
  (SELECT COUNT(*) FROM agents) AS total_agents,
  (SELECT COUNT(*) FROM agents WHERE philosophy IS NULL OR philosophy = '') AS empty_phil,
  (SELECT COUNT(*) FROM agents WHERE expertise IS NULL OR expertise = '[]'::jsonb) AS empty_exp,
  (SELECT COUNT(*) FROM agents WHERE off_topic_response IS NULL OR off_topic_response = '') AS empty_ot,
  (SELECT COUNT(*) FROM toolboxes) AS total_toolboxes,
  (SELECT COUNT(*) FROM toolboxes WHERE purpose IS NULL OR purpose = '') AS empty_purp,
  (SELECT COUNT(*) FROM toolboxes WHERE capabilities IS NULL OR capabilities = '[]'::jsonb) AS empty_caps,
  (SELECT COUNT(*) FROM toolboxes WHERE limitations IS NULL OR limitations = '[]'::jsonb) AS empty_lims;

\echo === Query B: Agents with ANY of 7 policy fields empty ===
SELECT COUNT(*) AS agents_with_any_empty_policy
FROM agents
WHERE primary_outcome IS NULL OR primary_outcome = ''
   OR conversation_win_conditions IS NULL OR conversation_win_conditions = ''
   OR brand_voice_spec IS NULL OR brand_voice_spec = ''
   OR interaction_policy IS NULL OR interaction_policy = ''
   OR domain_charter IS NULL OR domain_charter = ''
   OR quality_bar IS NULL OR quality_bar = ''
   OR risk_compliance IS NULL OR risk_compliance = '';

\echo === Query C: Per-series breakdown of empty policy fields ===
SELECT
  s.name AS series,
  COUNT(*) AS total_agents,
  SUM(CASE WHEN a.primary_outcome IS NULL OR a.primary_outcome = '' THEN 1 ELSE 0 END) AS empty_outcome,
  SUM(CASE WHEN a.conversation_win_conditions IS NULL OR a.conversation_win_conditions = '' THEN 1 ELSE 0 END) AS empty_win,
  SUM(CASE WHEN a.brand_voice_spec IS NULL OR a.brand_voice_spec = '' THEN 1 ELSE 0 END) AS empty_voice,
  SUM(CASE WHEN a.interaction_policy IS NULL OR a.interaction_policy = '' THEN 1 ELSE 0 END) AS empty_inter,
  SUM(CASE WHEN a.domain_charter IS NULL OR a.domain_charter = '' THEN 1 ELSE 0 END) AS empty_charter,
  SUM(CASE WHEN a.quality_bar IS NULL OR a.quality_bar = '' THEN 1 ELSE 0 END) AS empty_qbar,
  SUM(CASE WHEN a.risk_compliance IS NULL OR a.risk_compliance = '' THEN 1 ELSE 0 END) AS empty_risk
FROM agents a
JOIN toolboxes t ON a.toolbox_id = t.id
LEFT JOIN big_ideas b ON t.big_idea_id = b.id
LEFT JOIN series s ON COALESCE(t.series_id, b.series_id) = s.id
WHERE s.name IS NOT NULL
GROUP BY s.name
ORDER BY s.name;
