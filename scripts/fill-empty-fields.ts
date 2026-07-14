/**
 * Batch AI Field Filler
 * Fills empty description, greeting_message, and tagline for all agents
 * using GPT-4o-mini with the agent's system_prompt and name as context.
 * 
 * Run: node_modules/.bin/tsx scripts/fill-empty-fields.ts
 */

import OpenAI from "openai";
import pg from "pg";
import pLimit from "p-limit";

const { Pool } = pg;

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Max concurrent OpenAI calls
const limit = pLimit(8);

interface Agent {
  id: number;
  name: string;
  is_orchestrator: boolean;
  orchestrator_role: string;
  system_prompt: string;
  description: string | null;
  greeting_message: string | null;
  tagline: string | null;
  category: string | null;
  subcategory: string | null;
}

interface FieldsToFill {
  description?: string;
  greeting_message?: string;
  tagline?: string;
}

async function generateFields(agent: Agent): Promise<FieldsToFill> {
  const needsDescription = !agent.description || agent.description.trim() === "";
  const needsGreeting = !agent.greeting_message || agent.greeting_message.trim() === "";
  const needsTagline = !agent.tagline || agent.tagline.trim() === "";

  if (!needsDescription && !needsGreeting && !needsTagline) return {};

  const role = agent.is_orchestrator
    ? `Orchestrator/HUB (${agent.orchestrator_role})`
    : `Specialist Agent`;

  const promptParts: string[] = [];
  if (needsDescription) {
    promptParts.push(`- description: 1–2 kalimat bahasa Indonesia yang menjelaskan peran dan kemampuan utama chatbot ini (max 200 karakter). Jangan mulai dengan nama agent.`);
  }
  if (needsGreeting) {
    promptParts.push(`- greeting_message: Pesan sambutan pembuka saat pengguna memulai chat. Bahasa Indonesia, profesional, hangat, 2–4 baris. Sebutkan nama chatbot dan 2–3 hal yang bisa dibantu. Gunakan bullet point singkat.`);
  }
  if (needsTagline) {
    promptParts.push(`- tagline: Slogan pendek 4–8 kata bahasa Indonesia yang menggambarkan nilai utama chatbot ini.`);
  }

  const systemCtx = agent.system_prompt
    ? agent.system_prompt.substring(0, 1500)
    : "(tidak ada)";

  const prompt = `Kamu adalah asisten pengisi metadata chatbot AI untuk platform Gustafta — platform AI konstruksi & hukum Indonesia.

Chatbot berikut perlu diisi field-nya:

NAMA: ${agent.name}
PERAN: ${role}
KATEGORI: ${agent.category || "-"}
SISTEM PROMPT (potongan):
---
${systemCtx}
---

Hasilkan field berikut dalam format JSON yang valid (hanya JSON, tanpa komentar, tanpa markdown):
{
${needsDescription ? `  "description": "..."` : ""}${needsDescription && (needsGreeting || needsTagline) ? "," : ""}
${needsGreeting ? `  "greeting_message": "..."` : ""}${needsGreeting && needsTagline ? "," : ""}
${needsTagline ? `  "tagline": "..."` : ""}
}

Aturan:
${promptParts.join("\n")}
- Semua teks dalam Bahasa Indonesia
- Sesuaikan konteks dengan domain chatbot (konstruksi, sertifikasi, K3, hukum, dll)
- Gunakan tone profesional namun mudah dipahami`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as FieldsToFill;

    // Validate and clean
    const result: FieldsToFill = {};
    if (needsDescription && parsed.description) {
      result.description = parsed.description.substring(0, 500);
    }
    if (needsGreeting && parsed.greeting_message) {
      result.greeting_message = parsed.greeting_message.substring(0, 1000);
    }
    if (needsTagline && parsed.tagline) {
      result.tagline = parsed.tagline.substring(0, 150);
    }
    return result;
  } catch (err) {
    console.error(`  ⚠ Error generating for agent ${agent.id} (${agent.name}):`, err);
    return {};
  }
}

async function updateAgent(agentId: number, fields: FieldsToFill) {
  if (Object.keys(fields).length === 0) return;

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (fields.description !== undefined) {
    setClauses.push(`description = $${paramIdx++}`);
    values.push(fields.description);
  }
  if (fields.greeting_message !== undefined) {
    setClauses.push(`greeting_message = $${paramIdx++}`);
    values.push(fields.greeting_message);
  }
  if (fields.tagline !== undefined) {
    setClauses.push(`tagline = $${paramIdx++}`);
    values.push(fields.tagline);
  }

  values.push(agentId);
  await db.query(
    `UPDATE agents SET ${setClauses.join(", ")} WHERE id = $${paramIdx}`,
    values
  );
}

async function main() {
  console.log("🚀 Gustafta — Batch AI Field Filler");
  console.log("=====================================\n");

  // Fetch all agents that need any field filled
  const { rows: agents } = await db.query<Agent>(`
    SELECT id, name, is_orchestrator, orchestrator_role, system_prompt,
           description, greeting_message, tagline, category, subcategory
    FROM agents
    WHERE (description IS NULL OR description = '')
       OR (greeting_message IS NULL OR greeting_message = '')
       OR (tagline IS NULL OR tagline = '')
    ORDER BY is_orchestrator DESC, id ASC
  `);

  console.log(`📊 Found ${agents.length} agents needing field completion\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  const tasks = agents.map((agent) =>
    limit(async () => {
      const fields = await generateFields(agent);
      if (Object.keys(fields).length === 0) {
        skipped++;
        return;
      }
      try {
        await updateAgent(agent.id, fields);
        done++;
        const fieldNames = Object.keys(fields).join(", ");
        console.log(`  ✅ [${done + skipped + failed}/${agents.length}] #${agent.id} ${agent.name.substring(0, 50)} → filled: ${fieldNames}`);
      } catch (err) {
        failed++;
        console.error(`  ❌ [${done + skipped + failed}/${agents.length}] #${agent.id} ${agent.name} — DB error:`, err);
      }
    })
  );

  await Promise.all(tasks);

  console.log(`\n=====================================`);
  console.log(`✅ Completed: ${done}`);
  console.log(`⏭  Skipped (already filled): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${agents.length}`);

  await db.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
