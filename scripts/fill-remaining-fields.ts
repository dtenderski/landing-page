import { Pool, type PoolClient } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-2.5-flash";

type SeriesCategory = "regulasi" | "sertifikasi-bu" | "sertifikasi-profesi" | "sistem-manajemen" | "digitalisasi" | "umum";

const SERIES_CATEGORY: Record<string, SeriesCategory> = {
  "Regulasi Jasa Konstruksi": "regulasi",
  "Pembinaan Anggota ASPEKINDO — Kontraktor": "regulasi",
  "Kompetensi Teknis Kontraktor & Konsultan": "sertifikasi-bu",
  "Manajemen LSBU — Lembaga Sertifikasi Badan Usaha": "sertifikasi-bu",
  "Asesor Sertifikasi Konstruksi": "sertifikasi-bu",
  "Siap Uji Kompetensi SKK": "sertifikasi-profesi",
  "CIVILPRO — Professional Mentoring Sipil": "sertifikasi-profesi",
  "Manajemen LSP — Lembaga Sertifikasi Profesi": "sertifikasi-profesi",
  "ISO 9001 — Sistem Manajemen Mutu Konstruksi": "sistem-manajemen",
  "ISO 14001 — Sistem Manajemen Lingkungan Konstruksi": "sistem-manajemen",
  "SMAP & PANCEK": "sistem-manajemen",
  "CSMAS (Contractor Safety Management)": "sistem-manajemen",
  "Odoo untuk Jasa Konstruksi": "digitalisasi",
  "SIP-PJBU — Sistem Informasi Pembinaan PJBU": "digitalisasi",
  "SKK AJJ — Asesmen Jarak Jauh": "sertifikasi-profesi",
};

// off_topic_response per kategori (no AI needed)
const OFF_TOPIC_BY_CAT: Record<SeriesCategory, string> = {
  "regulasi": "Mohon maaf, Bapak/Ibu, pertanyaan tersebut di luar fokus saya yaitu Regulasi Jasa Konstruksi (UU/PP/Perpres/Permen terkait). Mari kita kembali ke topik regulasi — adakah aspek peraturan jasa konstruksi yang ingin Bapak/Ibu pahami?",
  "sertifikasi-bu": "Mohon maaf, Bapak/Ibu, pertanyaan tersebut di luar fokus saya yaitu Sertifikasi Badan Usaha Konstruksi (SBU/LSBU). Mari kita kembali ke topik sertifikasi badan usaha — adakah hal terkait klasifikasi, persyaratan, atau proses SBU yang ingin Bapak/Ibu tanyakan?",
  "sertifikasi-profesi": "Mohon maaf, Bapak/Ibu, pertanyaan tersebut di luar fokus saya yaitu Sertifikasi Kompetensi Profesi Konstruksi (SKK/LSP). Mari kita kembali ke topik kompetensi profesi — adakah aspek persiapan uji, jenjang KKNI, atau SKKNI yang ingin Bapak/Ibu pelajari?",
  "sistem-manajemen": "Mohon maaf, Bapak/Ibu, pertanyaan tersebut di luar fokus saya yaitu Sistem Manajemen (ISO/SMAP/CSMS) di Jasa Konstruksi. Mari kita kembali ke topik sistem manajemen — adakah klausul atau implementasi spesifik yang ingin Bapak/Ibu diskusikan?",
  "digitalisasi": "Mohon maaf, Bapak/Ibu, pertanyaan tersebut di luar fokus saya yaitu Digitalisasi & Sistem Informasi untuk Jasa Konstruksi. Mari kita kembali ke topik digitalisasi — adakah modul, fitur, atau alur kerja sistem yang ingin Bapak/Ibu pahami?",
  "umum": "Mohon maaf, Bapak/Ibu, pertanyaan tersebut di luar lingkup tugas saya. Mari kita kembali ke topik utama agar saya bisa membantu dengan optimal — adakah hal terkait peran saya yang ingin Bapak/Ibu tanyakan?",
};

interface AgentRow {
  id: number;
  name: string;
  description: string | null;
  tagline: string | null;
  series: string | null;
  toolbox: string | null;
  is_orchestrator: boolean;
  philosophy: string | null;
  off_topic_response: string | null;
  expertise: unknown;
  primary_outcome: string | null;
  brand_voice_spec: string | null;
}

interface ToolboxRow {
  id: number;
  name: string;
  description: string | null;
  series: string | null;
  purpose: string | null;
  capabilities: unknown;
  limitations: unknown;
}

interface GeminiResponseBody {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

interface AgentExtras {
  philosophy?: string;
  expertise?: string[];
}

interface ToolboxExtras {
  purpose?: string;
  capabilities?: string[];
  limitations?: string[];
}

async function callGemini<T>(prompt: string): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 200)}`);
  const data = (await res.json()) as GeminiResponseBody;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Empty response (finish=${data.candidates?.[0]?.finishReason ?? "?"})`);
  const raw: unknown = JSON.parse(text);
  return (Array.isArray(raw) ? raw[0] : raw) as T;
}

async function genAgentExtras(agent: AgentRow): Promise<AgentExtras> {
  const prompt = `Anda ahli desain agen AI untuk industri Jasa Konstruksi Indonesia. Untuk chatbot berikut, hasilkan 2 field:

CHATBOT:
- Nama: ${agent.name}
- Series: ${agent.series ?? "Umum"}
- Toolbox: ${agent.toolbox ?? "(standalone)"}
- Tagline: ${agent.tagline ?? ""}
- Deskripsi: ${agent.description ?? ""}
- Hub/Orkestrator: ${agent.is_orchestrator ? "Ya" : "Tidak"}

Hasilkan JSON dengan field PERSIS:
{
  "philosophy": "1-2 kalimat filosofi/prinsip kerja agen ini dalam bahasa Indonesia. Mulai dengan 'Saya percaya bahwa ...' atau 'Prinsip saya adalah ...'. Spesifik untuk peran chatbot ini.",
  "expertise": ["3-6 tag keahlian singkat dalam bahasa Indonesia, misal 'Regulasi PUPR', 'Klasifikasi SBU', 'Klausul ISO 9001'. Tag harus spesifik untuk domain chatbot ini, bukan generik."]
}

Output HANYA JSON valid.`;
  return callGemini<AgentExtras>(prompt);
}

async function genToolboxExtras(tb: ToolboxRow): Promise<ToolboxExtras> {
  const prompt = `Anda ahli desain produk untuk platform AI Jasa Konstruksi Indonesia. Untuk modul/toolbox berikut, hasilkan 3 field:

TOOLBOX:
- Nama: ${tb.name}
- Series: ${tb.series ?? "Umum"}
- Deskripsi: ${tb.description ?? ""}
- Purpose saat ini: ${tb.purpose ?? "(kosong)"}

Hasilkan JSON dengan field PERSIS:
{
  "purpose": "1-2 kalimat tujuan utama toolbox dalam bahasa Indonesia. Mulai dengan 'Toolbox ini digunakan untuk ...' atau 'Membantu pengguna untuk ...'. Spesifik untuk fungsi toolbox.",
  "capabilities": ["3-5 kemampuan konkret yang bisa dilakukan toolbox, masing-masing 5-12 kata, bahasa Indonesia. Contoh format: 'Memberi penjelasan klausul ISO 9001:2015', 'Menyusun checklist persiapan audit'."],
  "limitations": ["3-5 batasan/limitasi toolbox, masing-masing 5-12 kata, bahasa Indonesia. Contoh: 'Tidak menerbitkan sertifikat resmi', 'Tidak menggantikan konsultasi auditor berlisensi'."]
}

Output HANYA JSON valid.`;
  return callGemini<ToolboxExtras>(prompt);
}

async function fillAgent(client: PoolClient, agent: AgentRow): Promise<{ ok: boolean; err?: string }> {
  try {
    const cat: SeriesCategory = agent.series ? (SERIES_CATEGORY[agent.series] ?? "umum") : "umum";
    const offTopic = OFF_TOPIC_BY_CAT[cat];

    let philosophy = agent.philosophy;
    let expertise: unknown = agent.expertise;
    const expertiseEmpty = !expertise || (Array.isArray(expertise) && expertise.length === 0);

    if (!philosophy || !philosophy.trim() || expertiseEmpty) {
      const ext = await genAgentExtras(agent);
      if (!philosophy || !philosophy.trim()) philosophy = (ext.philosophy ?? "").trim();
      if (expertiseEmpty && Array.isArray(ext.expertise)) expertise = ext.expertise;
    }

    if (!philosophy) philosophy = "Saya berkomitmen memberikan informasi yang akurat, terstruktur, dan sesuai konteks Jasa Konstruksi Indonesia.";
    if (!Array.isArray(expertise) || expertise.length === 0) {
      expertise = ["Jasa Konstruksi Indonesia", "Bantuan informasi", "Panduan praktis"];
    }

    // Preserve existing non-empty values; only fill kosong fields.
    await client.query(
      `UPDATE agents SET
        philosophy = COALESCE(NULLIF(philosophy, ''), $1),
        off_topic_response = COALESCE(NULLIF(off_topic_response, ''), $2),
        expertise = CASE
          WHEN expertise IS NULL OR jsonb_array_length(expertise) = 0 THEN $3::jsonb
          ELSE expertise
        END
       WHERE id=$4`,
      [philosophy, offTopic, JSON.stringify(expertise), agent.id]
    );
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

async function fillToolbox(client: PoolClient, tb: ToolboxRow): Promise<{ ok: boolean; err?: string }> {
  try {
    const purposeEmpty = !tb.purpose || !tb.purpose.trim();
    const capsEmpty = !tb.capabilities || (Array.isArray(tb.capabilities) && tb.capabilities.length === 0);
    const limsEmpty = !tb.limitations || (Array.isArray(tb.limitations) && tb.limitations.length === 0);

    if (!purposeEmpty && !capsEmpty && !limsEmpty) return { ok: true };

    const ext = await genToolboxExtras(tb);

    const finalPurpose = purposeEmpty ? (ext.purpose ?? "").trim() || `Toolbox ${tb.name} membantu pengguna pada lingkup ${tb.series ?? "Jasa Konstruksi"}.` : tb.purpose!;
    const finalCaps = capsEmpty
      ? (Array.isArray(ext.capabilities) && ext.capabilities.length > 0 ? ext.capabilities : ["Memberi panduan terstruktur", "Menjawab pertanyaan domain", "Menyusun ringkasan"])
      : tb.capabilities;
    const finalLims = limsEmpty
      ? (Array.isArray(ext.limitations) && ext.limitations.length > 0 ? ext.limitations : ["Bukan keputusan resmi", "Tidak menggantikan konsultasi ahli berlisensi"])
      : tb.limitations;

    await client.query(
      `UPDATE toolboxes SET purpose=$1, capabilities=$2::jsonb, limitations=$3::jsonb WHERE id=$4`,
      [finalPurpose, JSON.stringify(finalCaps), JSON.stringify(finalLims), tb.id]
    );
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

// Untuk orphan agents: isi 7 field policy dengan template "umum"
const UMUM_BRAND_VOICE = `Gunakan bahasa Indonesia formal namun ramah. Sapa pengguna dengan Bapak/Ibu. Nada profesional, suportif, dan terstruktur. Berikan jawaban yang jelas dan ringkas. Hindari jargon yang tidak dijelaskan. Selalu berikan rangkuman di akhir penjelasan panjang.`;
const UMUM_INTERACTION = `Tanya kembali jika ada lebih dari satu interpretasi. Jangan bertanya lebih dari 2 hal sekaligus. Konfirmasi pemahaman sebelum panduan langkah panjang. Berikan rangkuman di akhir percakapan kompleks.`;
const UMUM_RISK = `Selalu tambahkan disclaimer bahwa jawaban bersifat panduan informatif. Untuk keputusan resmi, arahkan pengguna ke instansi/profesional berwenang. Jangan menyimpan data sensitif pengguna. Patuhi UU PDP (Perlindungan Data Pribadi).`;
const UMUM_QUALITY = `Setiap jawaban harus berdasarkan informasi terverifikasi. Jangan memberikan angka/tanggal/prosedur spesifik tanpa konteks jelas. Jawaban panjang wajib disertai ringkasan poin. Jika informasi tidak tersedia, nyatakan jujur dan arahkan ke sumber resmi.`;

async function fillOrphanPolicy(client: PoolClient, agent: AgentRow): Promise<void> {
  // Read FRESH state per field for true idempotency (each of 7 fields evaluated independently)
  const { rows } = await client.query<{
    primary_outcome: string | null;
    conversation_win_conditions: string | null;
    brand_voice_spec: string | null;
    interaction_policy: string | null;
    domain_charter: string | null;
    quality_bar: string | null;
    risk_compliance: string | null;
  }>(
    `SELECT primary_outcome, conversation_win_conditions, brand_voice_spec, interaction_policy,
       domain_charter, quality_bar, risk_compliance FROM agents WHERE id=$1`,
    [agent.id]
  );
  const cur = rows[0];
  if (!cur) return;
  const isEmpty = (v: string | null) => !v || v.trim() === "";

  const updates: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (isEmpty(cur.primary_outcome)) { updates.push(`primary_outcome=$${i++}`); vals.push("user_education"); }
  if (isEmpty(cur.conversation_win_conditions)) {
    updates.push(`conversation_win_conditions=$${i++}`);
    vals.push(`Pengguna mendapatkan jawaban yang membantu terkait ${agent.name} dan tahu kemana harus melanjutkan jika butuh tindakan resmi.`);
  }
  if (isEmpty(cur.brand_voice_spec)) { updates.push(`brand_voice_spec=$${i++}`); vals.push(UMUM_BRAND_VOICE); }
  if (isEmpty(cur.interaction_policy)) { updates.push(`interaction_policy=$${i++}`); vals.push(UMUM_INTERACTION); }
  if (isEmpty(cur.domain_charter)) {
    updates.push(`domain_charter=$${i++}`);
    vals.push(`Agen HANYA membahas topik terkait peran "${agent.name}" dalam ekosistem Jasa Konstruksi Indonesia. Dilarang memberikan saran hukum mengikat, keputusan resmi sertifikasi, atau interpretasi regulasi yang tidak didukung sumber. Dilarang membahas topik di luar Jasa Konstruksi.`);
  }
  if (isEmpty(cur.quality_bar)) { updates.push(`quality_bar=$${i++}`); vals.push(UMUM_QUALITY); }
  if (isEmpty(cur.risk_compliance)) { updates.push(`risk_compliance=$${i++}`); vals.push(UMUM_RISK); }

  if (updates.length === 0) return;
  vals.push(agent.id);
  await client.query(`UPDATE agents SET ${updates.join(", ")} WHERE id=$${i}`, vals);
}

function safeIntEnv(name: string, def: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return def;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min || n > max) {
    console.warn(`[warn] ${name}=${raw} invalid (must be int ${min}..${max}), using default ${def}`);
    return def;
  }
  return n;
}

async function run(): Promise<void> {
  const validSteps = new Set(["all", "1", "2", "3"]);
  const STEP = process.env.STEP ?? "all";
  if (!validSteps.has(STEP)) {
    throw new Error(`Invalid STEP=${STEP}. Allowed: all|1|2|3`);
  }
  const LIMIT = safeIntEnv("LIMIT", 9999, 1, 100000);
  const CONCURRENCY = safeIntEnv("CONCURRENCY", 4, 1, 10);
  const client = await pool.connect();
  try {
    if (STEP === "all" || STEP === "1") {
      console.log("=== STEP 1: Orphan policy fields ===");
      const { rows: orphans } = await client.query<AgentRow>(`
        SELECT a.id, a.name, a.description, a.tagline, a.is_orchestrator,
          a.philosophy, a.off_topic_response, a.expertise,
          a.primary_outcome, a.brand_voice_spec,
          s.name as series, t.name as toolbox
        FROM agents a
        LEFT JOIN toolboxes t ON a.toolbox_id = t.id
        LEFT JOIN big_ideas b ON t.big_idea_id = b.id
        LEFT JOIN series s ON COALESCE(t.series_id, b.series_id) = s.id
        WHERE s.name IS NULL
      `);
      console.log(`  ${orphans.length} orphan agents`);
      for (const o of orphans) await fillOrphanPolicy(client, o);
      console.log("  ✓ done");
    }

    if (STEP === "all" || STEP === "2") {
      console.log("\n=== STEP 2: Agents (philosophy, off_topic_response, expertise) ===");
      const { rows: agents } = await client.query<AgentRow>(`
        SELECT a.id, a.name, a.description, a.tagline, a.is_orchestrator,
          a.philosophy, a.off_topic_response, a.expertise,
          a.primary_outcome, a.brand_voice_spec,
          s.name as series, t.name as toolbox
        FROM agents a
        LEFT JOIN toolboxes t ON a.toolbox_id = t.id
        LEFT JOIN big_ideas b ON t.big_idea_id = b.id
        LEFT JOIN series s ON COALESCE(t.series_id, b.series_id) = s.id
        WHERE (a.philosophy IS NULL OR a.philosophy = '')
           OR (a.off_topic_response IS NULL OR a.off_topic_response = '')
           OR (a.expertise IS NULL OR a.expertise = '[]'::jsonb)
        ORDER BY a.id
        LIMIT ${LIMIT}
      `);
      console.log(`  ${agents.length} agents to process`);
      let okA = 0, failA = 0;
      const failsA: { id: number; name: string; err: string }[] = [];
      for (let i = 0; i < agents.length; i += CONCURRENCY) {
        const chunk = agents.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(async a => ({ a, r: await fillAgent(client, a) })));
        for (const { a, r } of results) {
          if (r.ok) { okA++; process.stdout.write("."); }
          else { failA++; failsA.push({ id: a.id, name: a.name, err: r.err ?? "?" }); process.stdout.write("x"); }
        }
        if ((i + CONCURRENCY) % 30 === 0) process.stdout.write(` ${okA+failA}/${agents.length}\n`);
      }
      console.log(`\n  Agents: ${okA} ok, ${failA} fail`);
      if (failsA.length > 0) failsA.slice(0, 5).forEach(f => console.log(`    ✗ #${f.id} ${f.name}: ${f.err.substring(0,150)}`));
    }

    if (STEP === "all" || STEP === "3") {
      console.log("\n=== STEP 3: Toolboxes (purpose, capabilities, limitations) ===");
      const { rows: toolboxes } = await client.query<ToolboxRow>(`
        SELECT t.id, t.name, t.description, t.purpose, t.capabilities, t.limitations,
          s.name as series
        FROM toolboxes t
        LEFT JOIN big_ideas b ON t.big_idea_id = b.id
        LEFT JOIN series s ON COALESCE(t.series_id, b.series_id) = s.id
        WHERE (t.purpose IS NULL OR t.purpose = '')
           OR (t.capabilities IS NULL OR t.capabilities = '[]'::jsonb)
           OR (t.limitations IS NULL OR t.limitations = '[]'::jsonb)
        ORDER BY t.id
        LIMIT ${LIMIT}
      `);
      console.log(`  ${toolboxes.length} toolboxes to process`);
      let okT = 0, failT = 0;
      const failsT: { id: number; name: string; err: string }[] = [];
      for (let i = 0; i < toolboxes.length; i += CONCURRENCY) {
        const chunk = toolboxes.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(async t => ({ t, r: await fillToolbox(client, t) })));
        for (const { t, r } of results) {
          if (r.ok) { okT++; process.stdout.write("."); }
          else { failT++; failsT.push({ id: t.id, name: t.name, err: r.err ?? "?" }); process.stdout.write("x"); }
        }
        if ((i + CONCURRENCY) % 30 === 0) process.stdout.write(` ${okT+failT}/${toolboxes.length}\n`);
      }
      console.log(`\n  Toolboxes: ${okT} ok, ${failT} fail`);
      if (failsT.length > 0) failsT.slice(0, 5).forEach(f => console.log(`    ✗ #${f.id} ${f.name}: ${f.err.substring(0,150)}`));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e: unknown) => {
  console.error("FATAL:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
