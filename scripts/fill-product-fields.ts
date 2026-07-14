/**
 * Fills: product_summary, product_features
 * for all 747 agents (idempotent)
 */

import OpenAI from "openai";
import pg from "pg";
import pLimit from "p-limit";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const limit = pLimit(10);

interface Agent {
  id: number;
  name: string;
  is_orchestrator: boolean;
  description: string;
  tagline: string;
  category: string;
  expertise: any;
  primary_outcome: string;
  personality: string;
  philosophy: string;
  product_summary: string | null;
  product_features: any;
}

interface Fields {
  product_summary?: string;
  product_features?: string[];
}

function needsFilling(a: Agent): boolean {
  const psEmpty = !a.product_summary || a.product_summary.trim() === "";
  const pfEmpty = !a.product_features || (Array.isArray(a.product_features) && a.product_features.length === 0);
  return psEmpty || pfEmpty;
}

async function generate(agent: Agent): Promise<Fields> {
  const missing: string[] = [];
  if (!agent.product_summary || agent.product_summary.trim() === "") missing.push("product_summary");
  if (!agent.product_features || (Array.isArray(agent.product_features) && agent.product_features.length === 0)) missing.push("product_features");
  if (missing.length === 0) return {};

  const expertiseStr = Array.isArray(agent.expertise) ? agent.expertise.slice(0, 5).join(", ") : "";
  const role = agent.is_orchestrator ? "Orchestrator/HUB" : "Specialist Agent";

  const prompt = `Kamu adalah copywriter produk AI untuk Gustafta — platform chatbot AI konstruksi, sertifikasi & hukum Indonesia.

DATA AGEN:
NAMA: ${agent.name}
PERAN: ${role}
TAGLINE: ${agent.tagline || "-"}
DESKRIPSI: ${agent.description || "-"}
DOMAIN: ${agent.category || "-"}
KEAHLIAN: ${expertiseStr || "-"}
PRIMARY OUTCOME: ${agent.primary_outcome || "-"}
PERSONALITY: ${agent.personality || "-"}

Hasilkan field berikut dalam format JSON (hanya JSON, tanpa komentar):
Field dibutuhkan: ${missing.join(", ")}

DEFINISI:
- product_summary: Paragraf ringkasan produk 2-3 kalimat dalam Bahasa Indonesia. Jelaskan APA yang dilakukan agen ini, SIAPA penggunanya, dan NILAI utama yang diberikan. Bersifat marketable tapi tetap informatif. (string)
- product_features: Array 5-8 fitur/kemampuan utama agen ini sebagai produk. Setiap item adalah string singkat (5-10 kata) yang mendeskripsikan satu fitur konkret. Format: "Fitur — deskripsi singkat". (array of strings, Bahasa Indonesia)

ATURAN:
- product_summary: langsung ke poin, tidak generic, sebutkan domain spesifik
- product_features: fitur nyata, bukan slogan; gunakan kata kerja aktif
- Semua dalam Bahasa Indonesia kecuali istilah teknis baku

Format output:
{
  "product_summary": "...",
  "product_features": ["...", "..."]
}

Hasilkan HANYA: ${missing.join(", ")}`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as any;
    const result: Fields = {};

    if (missing.includes("product_summary") && parsed.product_summary) {
      result.product_summary = String(parsed.product_summary).substring(0, 600);
    }
    if (missing.includes("product_features") && Array.isArray(parsed.product_features) && parsed.product_features.length > 0) {
      result.product_features = parsed.product_features.slice(0, 10).map((e: any) => String(e));
    }
    return result;
  } catch (err) {
    console.error(`  ⚠ Error #${agent.id}:`, err);
    return {};
  }
}

async function updateAgent(id: number, fields: Fields) {
  if (Object.keys(fields).length === 0) return;
  const setClauses: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (fields.product_summary) { setClauses.push(`product_summary = $${i++}`); values.push(fields.product_summary); }
  if (fields.product_features) { setClauses.push(`product_features = $${i++}`); values.push(JSON.stringify(fields.product_features)); }
  values.push(id);
  await db.query(`UPDATE agents SET ${setClauses.join(", ")} WHERE id = $${i}`, values);
}

async function main() {
  console.log("📦 Filler: product_summary + product_features");
  console.log("=============================================\n");

  const { rows: agents } = await db.query<Agent>(`
    SELECT id, name, is_orchestrator, description, tagline, category,
           expertise, primary_outcome, personality, philosophy,
           product_summary, product_features
    FROM agents ORDER BY is_orchestrator DESC, id ASC
  `);

  const toProcess = agents.filter(needsFilling);
  console.log(`📊 Total: ${agents.length} | Perlu diisi: ${toProcess.length}\n`);

  let done = 0, skipped = 0, failed = 0;

  const tasks = toProcess.map((agent) =>
    limit(async () => {
      const fields = await generate(agent);
      if (Object.keys(fields).length === 0) { skipped++; return; }
      try {
        await updateAgent(agent.id, fields);
        done++;
        const idx = done + skipped + failed;
        console.log(`  ✅ [${idx}/${toProcess.length}] #${agent.id} ${agent.name.substring(0, 50)} → ${Object.keys(fields).join(", ")}`);
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
