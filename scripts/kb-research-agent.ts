/**
 * KB Research Agent
 * =================
 * Menghasilkan 3 entri Knowledge Base per agen (Foundational, Operational, Compliance)
 * menggunakan AI (OpenAI → fallback DeepSeek → Gemini).
 * Idempotent: skip agen yang sudah punya KB.
 * Concurrency: 5 paralel.
 *
 * Run: npx tsx scripts/kb-research-agent.ts
 * Run (dry): npx tsx scripts/kb-research-agent.ts --dry
 * Run (single): npx tsx scripts/kb-research-agent.ts --agent=123
 */

import OpenAI from "openai";
import pg from "pg";
import pLimit from "p-limit";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const SINGLE = args.find(a => a.startsWith("--agent="))?.split("=")[1];
const CONCURRENCY = 5;
const limit = pLimit(CONCURRENCY);

interface AgentRow {
  id: number;
  name: string;
  is_orchestrator: boolean;
  description: string;
  tagline: string;
  category: string;
  subcategory: string;
  personality: string;
  philosophy: string;
  expertise: any;
  primary_outcome: string;
  domain_charter: string;
  risk_compliance: string;
  system_prompt: string;
}

interface KBEntry {
  name: string;
  type: "foundational" | "operational" | "compliance";
  knowledge_layer: "foundational" | "operational" | "compliance";
  content: string;
  description: string;
  source_authority: string;
}

function chunkText(text: string, size = 400, overlap = 60): string[] {
  if (!text?.trim()) return [];
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const sentences = clean.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = [];
  let cur = "";
  let curLen = 0;
  for (const s of sentences) {
    const sl = Math.ceil(s.length / 4);
    if (curLen + sl > size && cur) {
      chunks.push(cur.trim());
      const words = cur.split(/\s+/);
      cur = words.slice(-Math.ceil(overlap / 4)).join(" ") + " " + s;
      curLen = Math.ceil(cur.length / 4);
    } else {
      cur += (cur ? " " : "") + s;
      curLen += sl;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function generateKB(agent: AgentRow): Promise<KBEntry[]> {
  const expertiseStr = Array.isArray(agent.expertise)
    ? agent.expertise.slice(0, 8).join(", ")
    : "";
  const role = agent.is_orchestrator ? "Orchestrator / HUB Navigator" : "Specialist AI Agent";

  const prompt = `Kamu adalah Knowledge Base Engineer untuk platform Gustafta — AI chatbot konstruksi, sertifikasi & hukum Indonesia.

DATA AGEN:
Nama: ${agent.name}
Peran: ${role}
Tagline: ${agent.tagline || "-"}
Deskripsi: ${(agent.description || "").substring(0, 500)}
Domain: ${agent.category || "-"} / ${agent.subcategory || "-"}
Keahlian: ${expertiseStr || "-"}
Primary Outcome: ${agent.primary_outcome || "-"}
Kepribadian: ${agent.personality || "-"}
Filosofi: ${agent.philosophy || "-"}
Domain Charter: ${(agent.domain_charter || "").substring(0, 300)}
Risk Compliance: ${(agent.risk_compliance || "").substring(0, 300)}

Buat 3 entri Knowledge Base dalam format JSON:

1. FOUNDATIONAL — Siapa agen ini, apa domainnya, pengetahuan inti yang harus dimiliki (regulasi, standar, definisi). Minimal 400 kata. Padat informasi faktual.

2. OPERATIONAL — Bagaimana agen bekerja: proses, alur kerja, contoh skenario pertanyaan & jawaban, cara membantu pengguna. Minimal 400 kata. Sertakan contoh konkret.

3. COMPLIANCE — Batasan, hal yang tidak boleh dilakukan, referensi hukum/regulasi, catatan keamanan, eskalasi. Minimal 250 kata.

Format output JSON:
{
  "foundational": {
    "name": "...",
    "content": "...",
    "description": "...",
    "source_authority": "..."
  },
  "operational": {
    "name": "...",
    "content": "...",
    "description": "...",
    "source_authority": "..."
  },
  "compliance": {
    "name": "...",
    "content": "...",
    "description": "...",
    "source_authority": "..."
  }
}

ATURAN:
- Bahasa Indonesia, kecuali istilah teknis baku (SNI, FIDIC, ISO, dll)
- Content harus spesifik terhadap domain agen ini, bukan generic
- Gunakan pengetahuan mendalam tentang konstruksi/sertifikasi/hukum Indonesia
- source_authority: nama lembaga/regulasi yang paling relevan (misal: PUPR, BSN, LPJK, KLHK, dll)`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as any;

    const entries: KBEntry[] = [];

    for (const [layer, key] of [
      ["foundational", "foundational"],
      ["operational", "operational"],
      ["compliance", "compliance"],
    ] as const) {
      const e = parsed[key];
      if (!e?.content) continue;
      entries.push({
        name: e.name || `${layer.charAt(0).toUpperCase() + layer.slice(1)} — ${agent.name}`,
        type: layer,
        knowledge_layer: layer,
        content: String(e.content).substring(0, 8000),
        description: String(e.description || "").substring(0, 300),
        source_authority: String(e.source_authority || "GUSTAFTA").substring(0, 100),
      });
    }

    return entries;
  } catch (err: any) {
    // Fallback: DeepSeek
    try {
      const dsclient = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com",
      });
      const resp2 = await dsclient.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });
      const raw2 = resp2.choices[0]?.message?.content ?? "{}";
      const parsed2 = JSON.parse(raw2) as any;
      const entries: KBEntry[] = [];
      for (const layer of ["foundational", "operational", "compliance"] as const) {
        const e = parsed2[layer];
        if (!e?.content) continue;
        entries.push({
          name: e.name || `${layer} — ${agent.name}`,
          type: layer,
          knowledge_layer: layer,
          content: String(e.content).substring(0, 8000),
          description: String(e.description || "").substring(0, 300),
          source_authority: String(e.source_authority || "GUSTAFTA").substring(0, 100),
        });
      }
      return entries;
    } catch {
      console.error(`  ⚠ AI error for #${agent.id}:`, err?.message);
      return [];
    }
  }
}

async function insertKB(agent: AgentRow, entries: KBEntry[]): Promise<number> {
  let inserted = 0;
  for (const e of entries) {
    const { rows } = await db.query(
      `INSERT INTO knowledge_bases
         (agent_id, name, type, content, description, knowledge_layer,
          source_authority, processing_status, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'completed','active',NOW())
       RETURNING id`,
      [agent.id, e.name, e.type, e.content, e.description, e.knowledge_layer, e.source_authority]
    );
    const kbId = rows[0].id as number;
    inserted++;

    // Create knowledge chunks
    const chunks = chunkText(e.content, 400, 60);
    for (let i = 0; i < chunks.length; i++) {
      const tok = Math.ceil(chunks[i].length / 4);
      await db.query(
        `INSERT INTO knowledge_chunks
           (knowledge_base_id, agent_id, chunk_index, content, token_count, embedding, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,'[]','{}',NOW())`,
        [kbId, agent.id, i, chunks[i], tok]
      );
    }
  }
  return inserted;
}

async function main() {
  console.log("🔬 KB Research Agent — Gustafta");
  console.log("================================");
  if (DRY) console.log("🧪 DRY RUN — tidak ada yang disimpan\n");
  if (SINGLE) console.log(`🎯 Mode single agen: #${SINGLE}\n`);

  let query = `
    SELECT a.id, a.name, a.is_orchestrator, a.description, a.tagline,
           a.category, a.subcategory, a.personality, a.philosophy,
           a.expertise, a.primary_outcome, a.domain_charter,
           a.risk_compliance, a.system_prompt
    FROM agents a
    WHERE a.is_active = true
  `;
  const params: any[] = [];

  if (SINGLE) {
    query += ` AND a.id = $1`;
    params.push(parseInt(SINGLE));
  } else {
    // Only agents without any KB
    query += ` AND NOT EXISTS (SELECT 1 FROM knowledge_bases kb WHERE kb.agent_id = a.id)`;
    query += ` ORDER BY a.is_orchestrator DESC, a.id ASC`;
  }

  const { rows: agents } = await db.query<AgentRow>(query, params);
  console.log(`📊 Agen tanpa KB: ${agents.length}\n`);

  if (agents.length === 0) {
    console.log("✅ Semua agen sudah memiliki Knowledge Base!");
    await db.end();
    return;
  }

  let done = 0, failed = 0, totalEntries = 0;
  const startTime = Date.now();

  const tasks = agents.map((agent) =>
    limit(async () => {
      const idx = done + failed + 1;
      process.stdout.write(`  ⏳ [${idx}/${agents.length}] #${agent.id} ${agent.name.substring(0, 45)}...`);

      const entries = await generateKB(agent);
      if (entries.length === 0) {
        failed++;
        process.stdout.write(` ❌ (no entries)\n`);
        return;
      }

      if (!DRY) {
        try {
          const n = await insertKB(agent, entries);
          totalEntries += n;
          done++;
          process.stdout.write(` ✅ ${n} KB + chunks\n`);
        } catch (err: any) {
          failed++;
          process.stdout.write(` ❌ DB: ${err.message}\n`);
        }
      } else {
        done++;
        process.stdout.write(` ✅ DRY: ${entries.length} KB (tidak disimpan)\n`);
      }
    })
  );

  await Promise.all(tasks);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Selesai: ${done} agen | ❌ Gagal: ${failed} | 📚 Total KB: ${totalEntries} | ⏱ ${elapsed}s`);
  await db.end();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
