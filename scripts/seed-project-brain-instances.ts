/**
 * Seed Project Brain Instances for All Agents
 * Creates one default "draft" instance per agent (from their template)
 * with pre-filled values for all 27 construction project fields.
 *
 * Run: node_modules/.bin/tsx scripts/seed-project-brain-instances.ts
 */

import pg from "pg";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Default values to pre-fill for every instance
const DEFAULT_VALUES: Record<string, string> = {
  project_name: "",
  project_type: "Gedung",
  project_stage: "Planning",
  location: "",
  owner_client: "",
  structural_system: "",
  concrete_grade: "",
  construction_method: "",
  time_constraint: "Normal",
  cost_constraint: "Normal",
  site_access: "Easy",
  environmental_factors: "",
  issue_type: "Structural",
  issue_location: "",
  issue_status: "Open",
  issue_since: "",
  decision_summary: "",
  decision_reason: "",
  decision_risk_level: "Medium",
  decision_date: "",
  decision_impact: "Cost",
  assumption_used: "",
  slump: "",
  concrete_strength: "",
  inspection_notes: "",
  completeness_level: "Draft",
  last_updated: new Date().toISOString().slice(0, 10),
};

async function main() {
  console.log("=== Seed Project Brain Instances — All Agents ===\n");

  // 1. Get all templates (one per agent, we seeded them in previous step)
  const { rows: templates } = await db.query<{
    id: number;
    agent_id: number;
    name: string;
  }>(
    `SELECT id, agent_id, name FROM project_brain_templates ORDER BY agent_id`
  );
  console.log(`Total templates: ${templates.length}`);

  // 2. Find agents that already have at least one instance
  const { rows: existingRows } = await db.query<{ agent_id: number }>(
    `SELECT DISTINCT agent_id FROM project_brain_instances`
  );
  const alreadyHas = new Set(existingRows.map((r) => r.agent_id));
  console.log(`Agents with existing instances: ${alreadyHas.size}`);

  // 3. Filter templates to agents without instances
  const toSeed = templates.filter((t) => !alreadyHas.has(t.agent_id));
  console.log(`Agents to seed instances: ${toSeed.length}\n`);

  if (toSeed.length === 0) {
    console.log("✅ Semua agen sudah memiliki instance Otak Proyek.");
    await db.end();
    return;
  }

  // 4. Get agent names for labelling instances
  const agentIds = toSeed.map((t) => t.agent_id);
  const { rows: agentRows } = await db.query<{ id: number; name: string }>(
    `SELECT id, name FROM agents WHERE id = ANY($1)`,
    [agentIds]
  );
  const agentNames = new Map(agentRows.map((a) => [a.id, a.name]));

  const valuesJson = JSON.stringify(DEFAULT_VALUES);

  let created = 0;
  let failed = 0;
  const BATCH = 100;

  for (let i = 0; i < toSeed.length; i += BATCH) {
    const batch = toSeed.slice(i, i + BATCH);
    const valueParts: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const tpl of batch) {
      const agentName = agentNames.get(tpl.agent_id) || `Agen ${tpl.agent_id}`;
      const instanceName = `Proyek — ${agentName}`;

      valueParts.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}::jsonb, 'draft', true, NOW(), NOW())`
      );
      params.push(tpl.agent_id, tpl.id, instanceName, valuesJson);
    }

    try {
      await db.query(
        `INSERT INTO project_brain_instances (agent_id, template_id, name, values, status, is_active, created_at, updated_at)
         VALUES ${valueParts.join(", ")}`,
        params
      );
      created += batch.length;
      process.stdout.write(`  [${i + batch.length}/${toSeed.length}] Inserted ${batch.length} instances\r`);
    } catch (err: any) {
      failed += batch.length;
      console.error(`\n  ❌ Batch ${i}–${i + batch.length} gagal:`, err.message);
    }
  }

  console.log(`\n\n=== SELESAI ===`);
  console.log(`✅ Berhasil: ${created} instance`);
  if (failed > 0) console.log(`❌ Gagal   : ${failed} instance`);

  await db.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
