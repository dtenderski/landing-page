/**
 * Field Audit Agent
 * =================
 * Memeriksa kelengkapan semua field penting pada setiap chatbot.
 * Menghasilkan laporan JSON + console report.
 * Optionally: auto-fill field yang kosong menggunakan AI.
 *
 * Run (audit only):    npx tsx scripts/field-audit-agent.ts
 * Run (with autofill): npx tsx scripts/field-audit-agent.ts --fill
 * Run (single agent):  npx tsx scripts/field-audit-agent.ts --agent=123
 * Run (verbose):       npx tsx scripts/field-audit-agent.ts --verbose
 */

import OpenAI from "openai";
import pg from "pg";
import pLimit from "p-limit";
import fs from "fs";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = process.argv.slice(2);
const FILL = args.includes("--fill");
const VERBOSE = args.includes("--verbose");
const SINGLE = args.find(a => a.startsWith("--agent="))?.split("=")[1];
const CONCURRENCY = 8;
const limit = pLimit(CONCURRENCY);

// ── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  col: string;
  label: string;
  group: string;
  isJson?: boolean;
  weight: number; // 1-3, higher = more critical
}

const FIELDS: FieldDef[] = [
  // Core Identity
  { col: "name",             label: "Nama Agen",          group: "Identitas",  weight: 3 },
  { col: "tagline",          label: "Tagline",             group: "Identitas",  weight: 3 },
  { col: "description",      label: "Deskripsi",           group: "Identitas",  weight: 3 },
  { col: "category",         label: "Kategori",            group: "Identitas",  weight: 2 },
  { col: "avatar",           label: "Avatar/Emoji",        group: "Identitas",  weight: 1 },

  // Persona
  { col: "personality",      label: "Kepribadian",         group: "Persona",    weight: 3 },
  { col: "philosophy",       label: "Filosofi",            group: "Persona",    weight: 2 },
  { col: "greeting_message", label: "Pesan Sambutan",      group: "Persona",    weight: 2 },
  { col: "tone_of_voice",    label: "Tone of Voice",       group: "Persona",    weight: 2 },
  { col: "communication_style", label: "Gaya Komunikasi",  group: "Persona",    weight: 2 },
  { col: "off_topic_response", label: "Respons Off-Topic", group: "Persona",    weight: 2 },

  // Expertise
  { col: "expertise",        label: "Keahlian (array)",    group: "Expertise",  isJson: true, weight: 3 },
  { col: "conversation_starters", label: "Starter Percakapan", group: "Expertise", isJson: true, weight: 2 },
  { col: "key_phrases",      label: "Frasa Kunci",         group: "Expertise",  isJson: true, weight: 1 },

  // Agentic / Brain
  { col: "primary_outcome",  label: "Primary Outcome",     group: "Otak Proyek", weight: 3 },
  { col: "domain_charter",   label: "Domain Charter",      group: "Otak Proyek", weight: 2 },
  { col: "reasoning_policy", label: "Reasoning Policy",    group: "Otak Proyek", weight: 2 },
  { col: "interaction_policy", label: "Interaction Policy", group: "Otak Proyek", weight: 2 },
  { col: "quality_bar",      label: "Quality Bar",         group: "Otak Proyek", weight: 2 },
  { col: "risk_compliance",  label: "Risk & Compliance",   group: "Otak Proyek", weight: 2 },
  { col: "brand_voice_spec", label: "Brand Voice",         group: "Otak Proyek", weight: 1 },
  { col: "deliverable_bundle", label: "Deliverable Bundle", group: "Otak Proyek", weight: 1 },

  // Product
  { col: "product_summary",  label: "Ringkasan Produk",    group: "Produk",     weight: 2 },
  { col: "product_features", label: "Fitur Produk",        group: "Produk",     isJson: true, weight: 2 },
];

const CRITICAL_FIELDS = FIELDS.filter(f => f.weight === 3).map(f => f.col);

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentAudit {
  id: number;
  name: string;
  is_orchestrator: boolean;
  category: string;
  has_kb: boolean;
  kb_count: number;
  missing: string[];
  empty_critical: string[];
  score: number; // 0-100
  fields: Record<string, boolean>; // field → isFilled
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(val: any, isJson = false): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim() === "" || val === "You are a helpful assistant.";
  if (isJson) {
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === "object") return Object.keys(val).length === 0;
    try {
      const p = JSON.parse(String(val));
      if (Array.isArray(p)) return p.length === 0;
      if (typeof p === "object") return Object.keys(p).length === 0;
    } catch { return true; }
  }
  return false;
}

function calcScore(agent: any, fields: FieldDef[]): { score: number; missing: string[]; fieldMap: Record<string, boolean> } {
  let totalWeight = 0, filledWeight = 0;
  const missing: string[] = [];
  const fieldMap: Record<string, boolean> = {};

  for (const f of fields) {
    totalWeight += f.weight;
    const val = agent[f.col];
    const filled = !isEmpty(val, f.isJson);
    fieldMap[f.col] = filled;
    if (filled) {
      filledWeight += f.weight;
    } else {
      missing.push(f.col);
    }
  }

  const score = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
  return { score, missing, fieldMap };
}

// ── Auto-fill missing fields ─────────────────────────────────────────────────

async function autoFill(agent: any, missingCols: string[]): Promise<Record<string, any>> {
  if (missingCols.length === 0) return {};

  const expertiseStr = Array.isArray(agent.expertise)
    ? agent.expertise.slice(0, 6).join(", ")
    : "";

  const fieldDescs: Record<string, string> = {
    tagline: "Tagline singkat 5-10 kata yang menggambarkan keunggulan agen. (string)",
    personality: "Kepribadian agen dalam 1-2 kalimat: sifat utama, cara berkomunikasi. (string)",
    philosophy: "Prinsip kerja dan nilai inti agen dalam 1-2 kalimat. (string)",
    greeting_message: "Pesan sambutan pertama yang ramah dan spesifik terhadap domain agen. (string, max 200 karakter)",
    tone_of_voice: "Tone suara: misal 'Profesional, lugas, berbasis data'. (string)",
    communication_style: "Gaya komunikasi: misal 'Terstruktur, menggunakan poin-poin, memberikan contoh'. (string)",
    off_topic_response: "Respons saat pengguna bertanya di luar domain agen. (string, 1-2 kalimat)",
    expertise: "Array 5-8 area keahlian spesifik agen. (array of strings)",
    conversation_starters: "Array 3-5 pertanyaan pembuka yang relevan dengan domain agen. (array of strings)",
    key_phrases: "Array 5-10 frasa/istilah kunci yang sering digunakan dalam domain ini. (array of strings)",
    primary_outcome: "Satu outcome utama yang ingin dicapai agen setelah setiap sesi. (string, 1 kalimat)",
    domain_charter: "Batasan domain agen: apa yang dilakukan dan tidak dilakukan. (string, 2-3 kalimat)",
    reasoning_policy: "Cara agen berpikir dan memvalidasi jawabannya. (string, 1-2 kalimat)",
    interaction_policy: "Aturan interaksi: bagaimana merespons, kapan mengklarifikasi. (string, 1-2 kalimat)",
    quality_bar: "Standar kualitas respons yang harus dipenuhi. (string, 1-2 kalimat)",
    risk_compliance: "Risiko dan kepatuhan yang harus diperhatikan agen. (string, 1-2 kalimat)",
    brand_voice_spec: "Spesifikasi suara brand agen. (string, 1 kalimat)",
    deliverable_bundle: "Apa yang dihasilkan agen: laporan, checklist, analisis, dll. (string, 1-2 kalimat)",
    product_summary: "Ringkasan produk 2-3 kalimat untuk calon pengguna. (string)",
    product_features: "Array 5-8 fitur utama agen sebagai produk. Format: 'Fitur — deskripsi'. (array of strings)",
  };

  const fieldList = missingCols
    .filter(c => fieldDescs[c])
    .map(c => `- ${c}: ${fieldDescs[c]}`)
    .join("\n");

  if (!fieldList) return {};

  const prompt = `Kamu mengisi field kosong untuk chatbot AI konstruksi Indonesia di platform Gustafta.

DATA AGEN:
Nama: ${agent.name}
Peran: ${agent.is_orchestrator ? "HUB/Orchestrator" : "Specialist"}
Tagline: ${agent.tagline || "-"}
Deskripsi: ${(agent.description || "").substring(0, 400)}
Domain: ${agent.category || "-"}
Keahlian yang ada: ${expertiseStr || "-"}
Primary Outcome ada: ${agent.primary_outcome || "-"}

FIELD YANG PERLU DIISI:
${fieldList}

Hasilkan JSON dengan field-field di atas. Semua nilai harus spesifik terhadap domain agen ini, bukan generic. Bahasa Indonesia kecuali istilah teknis.`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });
    return JSON.parse(resp.choices[0]?.message?.content ?? "{}");
  } catch {
    return {};
  }
}

async function applyFill(agentId: number, filled: Record<string, any>, fields: FieldDef[]) {
  if (Object.keys(filled).length === 0) return;
  const setClauses: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const f of fields) {
    if (!(f.col in filled)) continue;
    const val = filled[f.col];
    if (val === undefined || val === null) continue;
    setClauses.push(`${f.col} = $${i++}`);
    values.push(f.isJson ? JSON.stringify(val) : String(val).substring(0, 2000));
  }

  if (setClauses.length === 0) return;
  values.push(agentId);
  await db.query(`UPDATE agents SET ${setClauses.join(", ")} WHERE id = $${i}`, values);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Field Audit Agent — Gustafta");
  console.log("================================");
  if (FILL) console.log("🤖 Mode: AUDIT + AUTO-FILL\n");
  else console.log("📋 Mode: AUDIT ONLY\n");

  // Build column select
  const colSelect = FIELDS.map(f => f.col).join(", ");

  let query = `
    SELECT a.id, a.name, a.is_orchestrator, a.category, ${colSelect},
           (SELECT COUNT(*)::int FROM knowledge_bases kb WHERE kb.agent_id = a.id) as kb_count
    FROM agents a
    WHERE a.is_active = true
  `;
  const params: any[] = [];

  if (SINGLE) {
    query += ` AND a.id = $1`;
    params.push(parseInt(SINGLE));
  } else {
    query += ` ORDER BY a.is_orchestrator DESC, a.id ASC`;
  }

  const { rows: agents } = await db.query(query, params);
  console.log(`📊 Total agen aktif: ${agents.length}\n`);

  const audits: AgentAudit[] = [];
  let fillDone = 0, fillFailed = 0;

  const tasks = agents.map((agent: any) =>
    limit(async () => {
      const { score, missing, fieldMap } = calcScore(agent, FIELDS);
      const emptyCritical = missing.filter(c => CRITICAL_FIELDS.includes(c));
      const hasKb = agent.kb_count > 0;

      const audit: AgentAudit = {
        id: agent.id,
        name: agent.name,
        is_orchestrator: agent.is_orchestrator,
        category: agent.category || "",
        has_kb: hasKb,
        kb_count: agent.kb_count,
        missing,
        empty_critical: emptyCritical,
        score,
        fields: fieldMap,
      };

      audits.push(audit);

      if (FILL && missing.length > 0) {
        const fillable = missing.filter(c => c !== "name" && c !== "avatar");
        const filled = await autoFill(agent, fillable);
        if (Object.keys(filled).length > 0) {
          try {
            await applyFill(agent.id, filled, FIELDS);
            fillDone++;
            if (VERBOSE) console.log(`  ✅ Filled #${agent.id} ${agent.name.substring(0, 40)} → ${Object.keys(filled).join(", ")}`);
          } catch {
            fillFailed++;
          }
        }
      }
    })
  );

  await Promise.all(tasks);

  // Sort by score ascending (worst first)
  audits.sort((a, b) => a.score - b.score);

  // ── Summary report ──────────────────────────────────────────────────────
  const perfect = audits.filter(a => a.score === 100).length;
  const noKb = audits.filter(a => !a.has_kb).length;
  const critical = audits.filter(a => a.empty_critical.length > 0).length;
  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length)
    : 0;

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║              HASIL AUDIT FIELD CHATBOT                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  Total agen        : ${audits.length}`);
  console.log(`  Rata-rata skor    : ${avgScore}%`);
  console.log(`  Lengkap (100%)    : ${perfect}`);
  console.log(`  Field kritis kosong: ${critical} agen`);
  console.log(`  Tanpa KB          : ${noKb} agen`);
  if (FILL) console.log(`  Field diisi AI    : ${fillDone} agen | Gagal: ${fillFailed}`);

  // Group by score range
  const ranges = [
    { label: "🔴 0-39%",   min: 0,  max: 39  },
    { label: "🟠 40-59%",  min: 40, max: 59  },
    { label: "🟡 60-79%",  min: 60, max: 79  },
    { label: "🟢 80-99%",  min: 80, max: 99  },
    { label: "✅ 100%",    min: 100, max: 100 },
  ];

  console.log("\n📊 Distribusi Skor:");
  for (const r of ranges) {
    const cnt = audits.filter(a => a.score >= r.min && a.score <= r.max).length;
    const bar = "█".repeat(Math.min(40, Math.round(cnt / audits.length * 40)));
    console.log(`  ${r.label.padEnd(10)} ${String(cnt).padStart(4)} agen  ${bar}`);
  }

  // Worst 20
  const worst = audits.filter(a => a.score < 80).slice(0, 20);
  if (worst.length > 0) {
    console.log("\n🔴 20 Agen Paling Tidak Lengkap:");
    console.log("─".repeat(80));
    for (const a of worst) {
      const kb = a.has_kb ? `✅KB(${a.kb_count})` : "❌KB";
      console.log(`  #${String(a.id).padStart(4)} [${String(a.score).padStart(3)}%] ${kb} ${a.name.substring(0, 45).padEnd(45)}`);
      if (a.empty_critical.length > 0) {
        console.log(`         🔴 KRITIS: ${a.empty_critical.join(", ")}`);
      }
      if (VERBOSE && a.missing.length > 0) {
        console.log(`         ⚠  Kosong: ${a.missing.join(", ")}`);
      }
    }
  }

  // Most common missing fields
  const missingCount: Record<string, number> = {};
  for (const a of audits) {
    for (const m of a.missing) missingCount[m] = (missingCount[m] || 0) + 1;
  }
  const topMissing = Object.entries(missingCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (topMissing.length > 0) {
    console.log("\n📋 Field Paling Sering Kosong:");
    console.log("─".repeat(50));
    for (const [col, cnt] of topMissing) {
      const pct = Math.round((cnt / audits.length) * 100);
      const fd = FIELDS.find(f => f.col === col);
      const label = fd?.label || col;
      const bar = "█".repeat(Math.round(pct / 5));
      const crit = fd && fd.weight === 3 ? " 🔴" : "";
      console.log(`  ${label.padEnd(28)} ${String(cnt).padStart(4)} agen (${String(pct).padStart(3)}%)  ${bar}${crit}`);
    }
  }

  // Save JSON report
  const report = {
    generated_at: new Date().toISOString(),
    total: audits.length,
    avg_score: avgScore,
    perfect_count: perfect,
    no_kb_count: noKb,
    critical_missing_count: critical,
    summary: audits.map(a => ({
      id: a.id, name: a.name, score: a.score,
      has_kb: a.has_kb, kb_count: a.kb_count,
      empty_critical: a.empty_critical,
      missing_count: a.missing.length,
    })),
    field_stats: topMissing.map(([col, cnt]) => ({ col, missing: cnt, pct: Math.round(cnt / audits.length * 100) })),
  };

  const reportPath = "/tmp/field-audit-report.json";
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Laporan JSON disimpan: ${reportPath}`);
  console.log("\n✅ Audit selesai!\n");

  await db.end();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
