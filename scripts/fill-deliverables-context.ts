/**
 * Fills: context_questions, deliverables, deliverable_bundle
 * for all 747 agents (idempotent — skips already filled)
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
  orchestrator_role: string;
  system_prompt: string;
  description: string;
  tagline: string;
  category: string;
  expertise: any;
  primary_outcome: string;
  domain_charter: string;
  context_questions: any;
  deliverables: any;
  deliverable_bundle: string | null;
}

interface Fields {
  context_questions?: string[];
  deliverables?: { title: string; format: string; description: string }[];
  deliverable_bundle?: string;
}

function needsFilling(a: Agent): boolean {
  const cqEmpty = !a.context_questions || (Array.isArray(a.context_questions) && a.context_questions.length === 0);
  const delEmpty = !a.deliverables || (Array.isArray(a.deliverables) && a.deliverables.length === 0);
  const dbEmpty = !a.deliverable_bundle || a.deliverable_bundle.trim() === "";
  return cqEmpty || delEmpty || dbEmpty;
}

async function generate(agent: Agent): Promise<Fields> {
  const missing: string[] = [];
  const cqEmpty = !agent.context_questions || (Array.isArray(agent.context_questions) && agent.context_questions.length === 0);
  const delEmpty = !agent.deliverables || (Array.isArray(agent.deliverables) && agent.deliverables.length === 0);
  const dbEmpty = !agent.deliverable_bundle || agent.deliverable_bundle.trim() === "";
  if (cqEmpty) missing.push("context_questions");
  if (delEmpty) missing.push("deliverables");
  if (dbEmpty) missing.push("deliverable_bundle");
  if (missing.length === 0) return {};

  const role = agent.is_orchestrator
    ? `Orchestrator/HUB — menavigasi & mengarahkan ke agen spesialis`
    : `Specialist Agent — menyelesaikan tugas spesifik`;

  const systemCtx = (agent.system_prompt || agent.description || "").substring(0, 1500);
  const expertiseStr = Array.isArray(agent.expertise) ? agent.expertise.slice(0, 5).join(", ") : "";

  const prompt = `Kamu adalah arsitek chatbot AI untuk platform Gustafta (konstruksi, sertifikasi, hukum Indonesia).

DATA AGEN:
NAMA: ${agent.name}
PERAN: ${role}
TAGLINE: ${agent.tagline || "-"}
DOMAIN: ${agent.category || "-"}
KEAHLIAN: ${expertiseStr || "-"}
PRIMARY OUTCOME: ${agent.primary_outcome || "-"}
SISTEM PROMPT (potongan):
---
${systemCtx}
---

Hasilkan HANYA field berikut dalam format JSON (hanya JSON valid, tanpa komentar):
Field dibutuhkan: ${missing.join(", ")}

DEFINISI:
- context_questions: Array 3-5 pertanyaan yang diajukan agen di awal percakapan untuk memahami kebutuhan spesifik pengguna. Harus SANGAT spesifik sesuai domain agen ini. (array of strings, Bahasa Indonesia)
- deliverables: Array 3-7 output konkret yang bisa dihasilkan agen ini. Setiap item adalah objek dengan: title (nama output), format (jenis: "dokumen PDF", "laporan teks", "checklist", "template Word", "analisis JSON", dst), description (deskripsi singkat 1 kalimat). (array of objects)
- deliverable_bundle: Nama paket layanan ringkas untuk semua deliverables agen ini. Contoh: "Paket Konsultasi SBU", "Toolkit Asesmen SKK", "Bundle Dokumen Tender". (string, 3-7 kata)

ATURAN:
- Semua teks Bahasa Indonesia kecuali istilah teknis baku
- context_questions: pertanyaan terbuka, praktis, relevan dengan tugas agen
- Untuk orchestrator: context_questions fokus pada routing (apa yang dibutuhkan user, sudah sampai mana prosesnya)
- deliverables harus OUTPUT NYATA (bukan layanan abstrak)
- deliverable_bundle: singkat, marketable, mencerminkan nilai utama agen

Format JSON output:
{
  "context_questions": ["...", "..."],
  "deliverables": [
    { "title": "...", "format": "...", "description": "..." }
  ],
  "deliverable_bundle": "..."
}

Hasilkan HANYA field: ${missing.join(", ")}`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as any;
    const result: Fields = {};

    if (missing.includes("context_questions") && Array.isArray(parsed.context_questions) && parsed.context_questions.length > 0) {
      result.context_questions = parsed.context_questions.slice(0, 6).map((e: any) => String(e));
    }
    if (missing.includes("deliverables") && Array.isArray(parsed.deliverables) && parsed.deliverables.length > 0) {
      result.deliverables = parsed.deliverables.slice(0, 8).map((d: any) => ({
        title: String(d.title || ""),
        format: String(d.format || "dokumen"),
        description: String(d.description || ""),
      }));
    }
    if (missing.includes("deliverable_bundle") && parsed.deliverable_bundle) {
      result.deliverable_bundle = String(parsed.deliverable_bundle).substring(0, 80);
    }
    return result;
  } catch (err) {
    console.error(`  ⚠ Error #${agent.id} (${agent.name}):`, err);
    return {};
  }
}

async function updateAgent(id: number, fields: Fields) {
  if (Object.keys(fields).length === 0) return;
  const setClauses: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (fields.context_questions) { setClauses.push(`context_questions = $${i++}`); values.push(JSON.stringify(fields.context_questions)); }
  if (fields.deliverables) { setClauses.push(`deliverables = $${i++}`); values.push(JSON.stringify(fields.deliverables)); }
  if (fields.deliverable_bundle) { setClauses.push(`deliverable_bundle = $${i++}`); values.push(fields.deliverable_bundle); }
  values.push(id);
  await db.query(`UPDATE agents SET ${setClauses.join(", ")} WHERE id = $${i}`, values);
}

async function main() {
  console.log("📦 Filler: context_questions + deliverables + deliverable_bundle");
  console.log("================================================================\n");

  const { rows: agents } = await db.query<Agent>(`
    SELECT id, name, is_orchestrator, orchestrator_role, system_prompt,
           description, tagline, category, expertise, primary_outcome, domain_charter,
           context_questions, deliverables, deliverable_bundle
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
