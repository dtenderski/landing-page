/**
 * Comprehensive Persona & Contextual Fields Filler
 * Fills: personality, philosophy, expertise[], conversation_starters[],
 *        off_topic_response, key_phrases[], avoid_topics[]
 *
 * Run: node_modules/.bin/tsx scripts/fill-persona-fields.ts
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
  personality: string | null;
  philosophy: string | null;
  expertise: any;
  conversation_starters: any;
  off_topic_response: string | null;
  key_phrases: any;
  avoid_topics: any;
}

interface PersonaFields {
  personality?: string;
  philosophy?: string;
  expertise?: string[];
  conversation_starters?: string[];
  off_topic_response?: string;
  key_phrases?: string[];
  avoid_topics?: string[];
}

function needsFilling(agent: Agent): boolean {
  return (
    !agent.personality || agent.personality.trim() === "" ||
    !agent.philosophy || agent.philosophy.trim() === "" ||
    !agent.expertise || (Array.isArray(agent.expertise) && agent.expertise.length === 0) ||
    !agent.conversation_starters || (Array.isArray(agent.conversation_starters) && agent.conversation_starters.length === 0) ||
    !agent.off_topic_response || agent.off_topic_response.trim() === "" ||
    !agent.key_phrases || (Array.isArray(agent.key_phrases) && agent.key_phrases.length === 0) ||
    !agent.avoid_topics || (Array.isArray(agent.avoid_topics) && agent.avoid_topics.length === 0)
  );
}

async function generatePersona(agent: Agent): Promise<PersonaFields> {
  const missing: string[] = [];
  if (!agent.personality || agent.personality.trim() === "") missing.push("personality");
  if (!agent.philosophy || agent.philosophy.trim() === "") missing.push("philosophy");
  if (!agent.expertise || (Array.isArray(agent.expertise) && agent.expertise.length === 0)) missing.push("expertise");
  if (!agent.conversation_starters || (Array.isArray(agent.conversation_starters) && agent.conversation_starters.length === 0)) missing.push("conversation_starters");
  if (!agent.off_topic_response || agent.off_topic_response.trim() === "") missing.push("off_topic_response");
  if (!agent.key_phrases || (Array.isArray(agent.key_phrases) && agent.key_phrases.length === 0)) missing.push("key_phrases");
  if (!agent.avoid_topics || (Array.isArray(agent.avoid_topics) && agent.avoid_topics.length === 0)) missing.push("avoid_topics");

  if (missing.length === 0) return {};

  const role = agent.is_orchestrator
    ? `Orchestrator/HUB (${agent.orchestrator_role}) — mengarahkan ke spesialis`
    : `Specialist Agent — menjawab langsung`;

  const systemCtx = agent.system_prompt
    ? agent.system_prompt.substring(0, 1800)
    : "(tidak ada)";

  const prompt = `Kamu adalah ahli konfigurasi chatbot AI untuk platform Gustafta — platform AI konstruksi, sertifikasi & hukum Indonesia.

Data chatbot:
NAMA: ${agent.name}
PERAN: ${role}
DESKRIPSI: ${agent.description || "-"}
TAGLINE: ${agent.tagline || "-"}
KATEGORI: ${agent.category || "-"}
SISTEM PROMPT (potongan):
---
${systemCtx}
---

Hasilkan HANYA field yang diminta dalam format JSON (hanya JSON, tanpa komentar, tanpa markdown):

Field yang dibutuhkan: ${missing.join(", ")}

Definisi setiap field:
- personality: Deskripsi karakter/persona chatbot ini dalam 2-3 kalimat. Jelaskan gaya komunikasinya, sifat utamanya, dan bagaimana ia berinteraksi. (string, Bahasa Indonesia)
- philosophy: Prinsip/filosofi utama yang memandu chatbot ini — apa yang menjadi landasan cara kerjanya. 2-3 kalimat. (string, Bahasa Indonesia)
- expertise: Array 5-8 keahlian/topik spesifik yang dikuasai chatbot ini. Singkat, konkret, relevan domain. (array of strings)
- conversation_starters: Array 4-6 pertanyaan/kalimat pembuka yang bisa digunakan pengguna untuk memulai percakapan yang relevan. Harus spesifik dan kontekstual dengan domain chatbot ini. (array of strings, Bahasa Indonesia)
- off_topic_response: Kalimat sopan dalam Bahasa Indonesia yang diucapkan ketika pengguna bertanya di luar domain chatbot ini. Sebutkan domain chatbot dan arahkan ke sumber yang tepat. 1-2 kalimat. (string)
- key_phrases: Array 5-8 kata kunci/frasa penting yang sering digunakan dalam domain chatbot ini. (array of strings)
- avoid_topics: Array 3-5 topik yang TIDAK boleh dijawab oleh chatbot ini (di luar domain-nya). (array of strings)

Aturan:
- Semua teks dalam Bahasa Indonesia kecuali istilah teknis baku
- Sesuaikan PERSIS dengan domain dan peran chatbot
- conversation_starters harus SANGAT spesifik (bukan generik)
- Untuk orchestrator/HUB: conversation_starters fokus pada routing/navigasi
- Untuk specialist: conversation_starters fokus pada tugas spesifik mereka
- off_topic_response harus menyebut nama chatbot dan domain-nya
- avoid_topics harus spesifik (bukan "hal di luar domain" tapi sebutkan contoh konkret)

Contoh format output:
{
  "personality": "...",
  "philosophy": "...",
  "expertise": ["...", "..."],
  "conversation_starters": ["...", "..."],
  "off_topic_response": "...",
  "key_phrases": ["...", "..."],
  "avoid_topics": ["...", "..."]
}

Hasilkan HANYA field: ${missing.join(", ")}`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 900,
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as PersonaFields;

    const result: PersonaFields = {};

    if (missing.includes("personality") && parsed.personality) {
      result.personality = String(parsed.personality).substring(0, 500);
    }
    if (missing.includes("philosophy") && parsed.philosophy) {
      result.philosophy = String(parsed.philosophy).substring(0, 500);
    }
    if (missing.includes("expertise") && Array.isArray(parsed.expertise) && parsed.expertise.length > 0) {
      result.expertise = parsed.expertise.slice(0, 10).map((e: any) => String(e));
    }
    if (missing.includes("conversation_starters") && Array.isArray(parsed.conversation_starters) && parsed.conversation_starters.length > 0) {
      result.conversation_starters = parsed.conversation_starters.slice(0, 8).map((e: any) => String(e));
    }
    if (missing.includes("off_topic_response") && parsed.off_topic_response) {
      result.off_topic_response = String(parsed.off_topic_response).substring(0, 400);
    }
    if (missing.includes("key_phrases") && Array.isArray(parsed.key_phrases) && parsed.key_phrases.length > 0) {
      result.key_phrases = parsed.key_phrases.slice(0, 10).map((e: any) => String(e));
    }
    if (missing.includes("avoid_topics") && Array.isArray(parsed.avoid_topics) && parsed.avoid_topics.length > 0) {
      result.avoid_topics = parsed.avoid_topics.slice(0, 8).map((e: any) => String(e));
    }

    return result;
  } catch (err) {
    console.error(`  ⚠ Error for agent #${agent.id} (${agent.name}):`, err);
    return {};
  }
}

async function updateAgent(agentId: number, fields: PersonaFields) {
  if (Object.keys(fields).length === 0) return;

  const setClauses: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (fields.personality !== undefined) { setClauses.push(`personality = $${i++}`); values.push(fields.personality); }
  if (fields.philosophy !== undefined) { setClauses.push(`philosophy = $${i++}`); values.push(fields.philosophy); }
  if (fields.expertise !== undefined) { setClauses.push(`expertise = $${i++}`); values.push(JSON.stringify(fields.expertise)); }
  if (fields.conversation_starters !== undefined) { setClauses.push(`conversation_starters = $${i++}`); values.push(JSON.stringify(fields.conversation_starters)); }
  if (fields.off_topic_response !== undefined) { setClauses.push(`off_topic_response = $${i++}`); values.push(fields.off_topic_response); }
  if (fields.key_phrases !== undefined) { setClauses.push(`key_phrases = $${i++}`); values.push(JSON.stringify(fields.key_phrases)); }
  if (fields.avoid_topics !== undefined) { setClauses.push(`avoid_topics = $${i++}`); values.push(JSON.stringify(fields.avoid_topics)); }

  values.push(agentId);
  await db.query(`UPDATE agents SET ${setClauses.join(", ")} WHERE id = $${i}`, values);
}

async function main() {
  console.log("🧠 Gustafta — Persona & Contextual Fields Filler");
  console.log("=================================================\n");

  const { rows: agents } = await db.query<Agent>(`
    SELECT id, name, is_orchestrator, orchestrator_role, system_prompt,
           description, tagline, category,
           personality, philosophy, expertise, conversation_starters,
           off_topic_response, key_phrases, avoid_topics
    FROM agents
    ORDER BY is_orchestrator DESC, id ASC
  `);

  const toProcess = agents.filter(needsFilling);
  console.log(`📊 Total agents: ${agents.length}`);
  console.log(`📋 Agents needing persona fill: ${toProcess.length}\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  const tasks = toProcess.map((agent) =>
    limit(async () => {
      const fields = await generatePersona(agent);
      if (Object.keys(fields).length === 0) {
        skipped++;
        return;
      }
      try {
        await updateAgent(agent.id, fields);
        done++;
        const fieldNames = Object.keys(fields).join(", ");
        const idx = done + skipped + failed;
        console.log(`  ✅ [${idx}/${toProcess.length}] #${agent.id} ${agent.name.substring(0, 48)} → ${fieldNames}`);
      } catch (err) {
        failed++;
        console.error(`  ❌ #${agent.id} ${agent.name} — DB error:`, err);
      }
    })
  );

  await Promise.all(tasks);

  console.log(`\n=================================================`);
  console.log(`✅ Updated: ${done}`);
  console.log(`⏭  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total processed: ${toProcess.length}`);

  await db.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
