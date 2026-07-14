/**
 * Fills: orchestrator_config
 * Only for is_orchestrator=true agents that have empty config (734 need it)
 */

import OpenAI from "openai";
import pg from "pg";
import pLimit from "p-limit";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const limit = pLimit(8);

interface Agent {
  id: number;
  name: string;
  is_orchestrator: boolean;
  orchestrator_role: string;
  system_prompt: string;
  description: string;
  tagline: string;
  category: string;
  expertise: any;
  primary_outcome: string;
  domain_charter: string;
  orchestrator_config: any;
}

interface OrchestratorConfig {
  routing_strategy: string;
  routing_keywords: Record<string, string[]>;
  fallback_agent: string;
  max_handoff_depth: number;
  clarify_before_routing: boolean;
  routing_confirmation: boolean;
  context_pass_fields: string[];
  scope_description: string;
}

function needsFilling(a: Agent): boolean {
  if (!a.is_orchestrator) return false;
  return !a.orchestrator_config ||
    typeof a.orchestrator_config !== "object" ||
    Object.keys(a.orchestrator_config).length === 0 ||
    a.orchestrator_config.routing_strategy === undefined;
}

async function generate(agent: Agent): Promise<OrchestratorConfig | null> {
  const systemCtx = (agent.system_prompt || agent.description || "").substring(0, 2000);
  const expertiseStr = Array.isArray(agent.expertise) ? agent.expertise.join(", ") : "";

  const prompt = `Kamu adalah arsitek sistem multi-agent AI untuk platform Gustafta (konstruksi, sertifikasi, hukum Indonesia).

DATA ORCHESTRATOR HUB:
NAMA: ${agent.name}
PERAN: ${agent.orchestrator_role || "Orchestrator"}
TAGLINE: ${agent.tagline || "-"}
DOMAIN: ${agent.category || "-"}
KEAHLIAN: ${expertiseStr || "-"}
PRIMARY OUTCOME: ${agent.primary_outcome || "-"}
DOMAIN CHARTER: ${agent.domain_charter || "-"}
SISTEM PROMPT (potongan):
---
${systemCtx}
---

Hasilkan orchestrator_config dalam format JSON. Ini adalah konfigurasi teknis untuk sistem routing multi-agent.

Schema yang diharapkan:
{
  "routing_strategy": "keyword_match" | "intent_classify" | "sequential" | "parallel",
  "routing_keywords": {
    "nama_sub_topik_1": ["kata_kunci_1", "kata_kunci_2"],
    "nama_sub_topik_2": ["kata_kunci_1", "kata_kunci_2"],
    ... (3-6 sub topik relevan dengan domain agen ini)
  },
  "fallback_agent": "nama agen fallback jika tidak ada match",
  "max_handoff_depth": 2,
  "clarify_before_routing": true | false,
  "routing_confirmation": false,
  "context_pass_fields": ["field1", "field2", ...],
  "scope_description": "deskripsi singkat ruang lingkup routing agen ini"
}

ATURAN:
- routing_keywords: kata kunci dalam Bahasa Indonesia yang relevan dengan sub-domain chatbot ini
- routing_strategy: pilih yang paling sesuai dengan peran orchestrator ini
  * "keyword_match" = untuk orchestrator yang routing berdasarkan kata kunci spesifik
  * "intent_classify" = untuk orchestrator yang perlu memahami intent dulu
  * "sequential" = untuk orchestrator yang menjalankan agen berurutan
  * "parallel" = untuk orchestrator yang menjalankan beberapa agen bersamaan
- fallback_agent: nama agen default jika tidak ada routing match (sesuaikan dengan domain)
- context_pass_fields: field konteks yang perlu diteruskan antar agen
- scope_description: 1-2 kalimat Bahasa Indonesia tentang lingkup routing hub ini
- clarify_before_routing: true jika orchestrator perlu klarifikasi dulu sebelum routing
- Hasilkan JSON valid, tidak perlu markdown`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as OrchestratorConfig;
    if (!parsed.routing_strategy) return null;
    return parsed;
  } catch (err) {
    console.error(`  ⚠ Error #${agent.id}:`, err);
    return null;
  }
}

async function main() {
  console.log("🎛️  Filler: orchestrator_config");
  console.log("================================\n");

  const { rows: agents } = await db.query<Agent>(`
    SELECT id, name, is_orchestrator, orchestrator_role, system_prompt,
           description, tagline, category, expertise, primary_outcome,
           domain_charter, orchestrator_config
    FROM agents WHERE is_orchestrator = true ORDER BY id ASC
  `);

  const toProcess = agents.filter(needsFilling);
  console.log(`📊 Orchestrators: ${agents.length} | Perlu diisi: ${toProcess.length}\n`);

  let done = 0, skipped = 0, failed = 0;

  const tasks = toProcess.map((agent) =>
    limit(async () => {
      const config = await generate(agent);
      if (!config) { skipped++; return; }
      try {
        await db.query(
          `UPDATE agents SET orchestrator_config = $1 WHERE id = $2`,
          [JSON.stringify(config), agent.id]
        );
        done++;
        const idx = done + skipped + failed;
        console.log(`  ✅ [${idx}/${toProcess.length}] #${agent.id} ${agent.name.substring(0, 55)} → routing: ${config.routing_strategy}`);
      } catch (err) {
        failed++;
        console.error(`  ❌ #${agent.id} DB error:`, err);
      }
    })
  );

  await Promise.all(tasks);
  console.log(`\n✅ Updated: ${done} | ⏭ Skipped: ${skipped} | ❌ Failed: ${failed}`);
  await db.end();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
