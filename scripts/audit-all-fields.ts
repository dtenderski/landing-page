import pg from "pg";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const totalRes = await db.query("SELECT COUNT(*) FROM agents");
  const total = parseInt(totalRes.rows[0].count);
  console.log(`Total agents: ${total}\n`);

  const textFields = [
    // Persona
    "personality", "philosophy", "off_topic_response",
    "description", "greeting_message", "tagline",
    // Agentic AI
    "behavior_preset", "autonomy_level", "response_depth", "output_format",
    "uncertainty_handling", "interaction_style", "contextual_empathy",
    "adaptive_learning_mode", "communication_style", "tone_of_voice",
    "response_format", "agent_role", "work_mode", "execution_gate_policy",
    // Otak Proyek
    "primary_outcome", "conversation_win_conditions", "fallback_objective",
    "brand_voice_spec", "reasoning_policy", "interaction_policy",
    "domain_charter", "quality_bar", "risk_compliance",
    "deliverable_bundle",
    // Product
    "product_summary",
    // Widget
    "widget_welcome_message",
    // Open Claw
    "open_claw_rulebook",
  ];

  const jsonFields = [
    // Persona
    "expertise", "conversation_starters", "key_phrases", "avoid_topics",
    // Agentic
    "context_priority", "proactive_help_types", "action_boundary", "escalation_rules",
    "source_priority", "context_questions",
    // Deliverables
    "deliverables", "product_features",
    // Orchestrator
    "orchestrator_config",
    // Open Claw
    "clarification_triggers",
  ];

  const groups: Record<string, string[]> = {
    "📋 PERSONA": ["personality", "philosophy", "off_topic_response", "description", "greeting_message", "tagline", "expertise", "conversation_starters", "key_phrases", "avoid_topics", "communication_style", "tone_of_voice"],
    "🤖 AGENTIC AI": ["behavior_preset", "autonomy_level", "response_depth", "output_format", "uncertainty_handling", "interaction_style", "contextual_empathy", "adaptive_learning_mode", "response_format", "agent_role", "work_mode", "execution_gate_policy", "context_priority", "proactive_help_types", "action_boundary", "escalation_rules", "source_priority", "context_questions", "clarification_triggers"],
    "🧠 OTAK PROYEK": ["primary_outcome", "conversation_win_conditions", "fallback_objective", "brand_voice_spec", "reasoning_policy", "interaction_policy", "domain_charter", "quality_bar", "risk_compliance", "deliverables", "deliverable_bundle", "orchestrator_config"],
    "📦 PRODUCT": ["product_summary", "product_features"],
  };

  for (const [group, fields] of Object.entries(groups)) {
    console.log(`\n${group}`);
    console.log("─".repeat(70));
    for (const f of fields) {
      let empty: number;
      if (jsonFields.includes(f)) {
        const r = await db.query(
          `SELECT COUNT(*) FROM agents WHERE ${f} IS NULL OR ${f}::text = '[]' OR ${f}::text = 'null' OR ${f}::text = '{}'`
        );
        empty = parseInt(r.rows[0].count);
      } else {
        const r = await db.query(
          `SELECT COUNT(*) FROM agents WHERE ${f} IS NULL OR TRIM(COALESCE(${f},''::text)) = ''`
        );
        empty = parseInt(r.rows[0].count);
      }
      const pct = (((total - empty) / total) * 100).toFixed(0);
      const bar = pct === "100" ? "✅" : empty === total ? "❌" : "⚠️ ";
      console.log(`  ${bar} ${f.padEnd(30)} empty: ${String(empty).padStart(3)} / ${total}  (${pct}%)`);
    }
  }

  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
