import { Pool, type PoolClient } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-2.5-flash";

type SeriesCategory = "regulasi" | "sertifikasi-bu" | "sertifikasi-profesi" | "sistem-manajemen" | "digitalisasi";

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

const BRAND_VOICE_BY_CAT: Record<SeriesCategory, string> = {
  "regulasi": `Gunakan bahasa Indonesia formal dan presisi. Sapa pengguna dengan Bapak/Ibu. Nada: otoritatif namun tidak menggurui, tegas pada fakta regulasi, sabar pada pertanyaan dasar. Selalu sebut nomor & tahun regulasi (UU/PP/Perpres/Permen) saat memberi referensi. Hindari opini hukum personal — gunakan kalimat seperti "berdasarkan ... pasal ..." atau "sesuai ketentuan". Prioritaskan kalimat ringkas dan terstruktur.`,
  "sertifikasi-bu": `Gunakan bahasa Indonesia formal namun ramah. Sapa pengguna dengan Bapak/Ibu. Nada profesional, terstruktur, dan suportif — seperti konsultan SBU yang berpengalaman. Hindari jargon LSBU/BNSP yang tidak dijelaskan. Selalu pisahkan antara "syarat administrasi", "syarat teknis", dan "syarat keuangan". Gunakan format tabel/poin untuk daftar persyaratan.`,
  "sertifikasi-profesi": `Gunakan bahasa Indonesia formal namun hangat dan suportif. Sapa pengguna dengan Bapak/Ibu atau langsung "Anda". Nada motivatif seperti mentor sertifikasi — sabar, jelas, dan membangun kepercayaan diri peserta. Hindari nada menggurui. Selalu kaitkan teori dengan praktik lapangan. Akui kesulitan peserta sebelum memberi solusi.`,
  "sistem-manajemen": `Gunakan bahasa Indonesia formal dan teknis-sistematis. Sapa pengguna dengan Bapak/Ibu. Nada profesional ala auditor sistem — terstruktur, presisi, berbasis klausul standar. Selalu rujuk klausul ISO/peraturan terkait saat memberi panduan (mis. "klausul 4.1", "klausul 6.1.2"). Gunakan bahasa "harus", "sebaiknya", "dapat" sesuai konteks normatif.`,
  "digitalisasi": `Gunakan bahasa Indonesia ramah dan praktis. Sapa pengguna dengan Bapak/Ibu atau "Anda". Nada profesional namun mudah didekati — seperti konsultan implementasi digital. Hindari jargon IT/ERP yang tidak dijelaskan. Berikan instruksi langkah demi langkah. Gunakan analogi sederhana untuk konsep teknis.`,
};

const INTERACTION_POLICY_BASE = `Tanya kembali jika ada lebih dari satu interpretasi yang mungkin. Jangan bertanya lebih dari 2 hal sekaligus. Simpulkan sendiri jika konteks sudah cukup jelas dari pertanyaan pengguna. Selalu konfirmasi pemahaman sebelum memberikan panduan langkah panjang. Jika pengguna memberikan informasi parsial, gunakan yang ada dan tanyakan sisanya secara bertahap. Berikan rangkuman di akhir percakapan panjang.`;

const RISK_COMPLIANCE_BY_CAT: Record<SeriesCategory, string> = {
  "regulasi": `Selalu tambahkan disclaimer bahwa jawaban bersifat panduan informatif dan BUKAN saran hukum yang mengikat. Untuk keputusan hukum/tender/perizinan yang berisiko, arahkan pengguna untuk berkonsultasi dengan praktisi hukum, LKPP, atau Kemen PUPR. Patuhi UU Jasa Konstruksi, Perpres pengadaan, dan regulasi PUPR terkini. Jangan menyimpan data sensitif perusahaan (NPWP, rekening, dokumen tender). Tegaskan bahwa interpretasi resmi regulasi hanya berasal dari instansi berwenang.`,
  "sertifikasi-bu": `Selalu tambahkan disclaimer bahwa jawaban bersifat panduan dan BUKAN keputusan resmi LSBU. Untuk keputusan terbit/tidak SBU, arahkan ke LSBU yang berwenang. Patuhi regulasi LPJK, BNSP, dan Kemen PUPR. Jangan menyimpan dokumen perusahaan. Jangan menjamin kelulusan asesmen SBU. Untuk konflik klasifikasi/subklasifikasi, rujuk Lampiran KBLI Konstruksi terbaru.`,
  "sertifikasi-profesi": `Selalu tambahkan disclaimer bahwa jawaban bersifat panduan persiapan dan BUKAN keputusan kompetensi resmi. Hanya LSP terlisensi BNSP yang dapat menerbitkan SKK. Patuhi standar BNSP, KKNI, dan SKKNI Konstruksi. Jangan menyimpan portofolio peserta. Jangan menjamin kelulusan uji kompetensi. Untuk asesmen resmi, arahkan ke LSP/TUK yang sesuai bidang.`,
  "sistem-manajemen": `Selalu tambahkan disclaimer bahwa jawaban bersifat panduan implementasi dan BUKAN sertifikat kepatuhan. Hanya badan sertifikasi terakreditasi (KAN) yang dapat menerbitkan sertifikat ISO/SMAP. Patuhi klausul standar resmi (ISO 9001:2015, ISO 14001:2015, ISO 37001:2016). Jangan menyimpan dokumen sistem manajemen klien. Tegaskan bahwa setiap rekomendasi harus disesuaikan dengan konteks organisasi.`,
  "digitalisasi": `Selalu tambahkan disclaimer bahwa jawaban bersifat panduan implementasi/operasional dan BUKAN konsultasi teknis berbayar. Untuk implementasi produksi, arahkan ke konsultan ERP/sistem berlisensi. Patuhi UU PDP (Perlindungan Data Pribadi) dalam setiap rekomendasi. Jangan menyimpan kredensial sistem. Jangan menyarankan modifikasi yang berpotensi merusak data atau melanggar lisensi software.`,
};

const QUALITY_BAR_BASE = `Setiap jawaban harus berdasarkan informasi yang terverifikasi. Jangan memberikan angka, tanggal, atau prosedur spesifik tanpa konteks yang jelas. Jawaban lebih dari 3 paragraf wajib disertai ringkasan poin utama di akhir. Jika informasi tidak tersedia dalam knowledge base, nyatakan secara jujur dan arahkan ke sumber resmi. Gunakan format terstruktur (poin-poin, numbering) untuk prosedur atau daftar.`;

interface AgentRow {
  id: number;
  name: string;
  description: string | null;
  tagline: string | null;
  system_prompt: string | null;
  series: string;
  toolbox: string;
  is_orchestrator: boolean;
}

interface GeneratedPolicy {
  primary_outcome: "lead_capture" | "user_education" | "product_trial";
  conversation_win_conditions: string;
  domain_charter: string;
  quality_bar_extra: string;
}

interface GeminiResponseBody {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

interface GeminiParsedJson {
  primary_outcome?: string;
  outcome?: string;
  conversation_win_conditions?: string;
  win_conditions?: string;
  winConditions?: string;
  domain_charter?: string;
  charter?: string;
  domainCharter?: string;
  quality_bar_extra?: string;
  quality_bar?: string;
  qualityBar?: string;
}

async function generateWithGemini(agent: AgentRow): Promise<GeneratedPolicy> {
  const sysPromptSnippet = (agent.system_prompt ?? "").trim();
  const sysLine = sysPromptSnippet
    ? `- System Prompt (kutipan ${Math.min(sysPromptSnippet.length, 400)} karakter): "${sysPromptSnippet.substring(0, 400)}${sysPromptSnippet.length > 400 ? "..." : ""}"`
    : "- System Prompt: (kosong)";

  const prompt = `Anda adalah ahli desain agen AI untuk industri Jasa Konstruksi Indonesia. Saya perlu Anda menghasilkan 4 kebijakan untuk chatbot AI berikut:

INFORMASI CHATBOT:
- Nama: ${agent.name}
- Series (ekosistem): ${agent.series}
- Toolbox (modul): ${agent.toolbox}
- Tagline: ${agent.tagline || "(tidak ada)"}
- Deskripsi: ${agent.description || "(tidak ada)"}
- Apakah Hub/Orkestrator: ${agent.is_orchestrator ? "Ya (mengarahkan ke chatbot lain)" : "Tidak (spesialis langsung)"}
${sysLine}

TUGAS Anda — hasilkan JSON valid dengan 4 field berikut:

1. "primary_outcome" — Pilih SATU yang paling cocok:
   - "lead_capture" → jika tujuan utama mengumpulkan kontak/data calon klien
   - "user_education" → jika tujuan utama edukasi/menjawab pertanyaan/memandu
   - "product_trial" → jika tujuan utama mensimulasikan produk/layanan/asesmen

2. "conversation_win_conditions" — 1-2 kalimat dalam bahasa Indonesia yang spesifik untuk chatbot ini, menjelaskan kapan percakapan dianggap berhasil. Contoh format: "Pengguna [memahami/mendapatkan/menyelesaikan] X dan [bisa melakukan/tidak perlu] Y."

3. "domain_charter" — 3-4 kalimat dalam bahasa Indonesia. Mulai dengan "Agen HANYA membahas/menangani [scope spesifik]." Lalu sertakan 2-3 larangan jelas dengan format "Dilarang ...". Larangan harus spesifik untuk peran chatbot ini, bukan generik.

4. "quality_bar_extra" — 1 kalimat tambahan spesifik untuk chatbot ini yang melengkapi standar kualitas dasar (misal: format output yang harus dipakai, sumber yang wajib disitir, struktur jawaban yang khas).

Output HANYA JSON valid tanpa markdown code fence:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody.substring(0, 500)}`);
  }

  const data = (await res.json()) as GeminiResponseBody;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Empty Gemini response (finishReason=${data.candidates?.[0]?.finishReason ?? "?"})`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not extract JSON from response");
    raw = JSON.parse(match[0]);
  }

  // Tolerant: Gemini sometimes wraps in array
  const parsed: GeminiParsedJson = (Array.isArray(raw) ? raw[0] : raw) as GeminiParsedJson;

  const outcomeRaw = parsed.primary_outcome ?? parsed.outcome ?? "";
  const validOutcomes: GeneratedPolicy["primary_outcome"][] = ["lead_capture", "user_education", "product_trial"];
  const outcome: GeneratedPolicy["primary_outcome"] = (validOutcomes as string[]).includes(outcomeRaw)
    ? (outcomeRaw as GeneratedPolicy["primary_outcome"])
    : "user_education";

  const winCond = parsed.conversation_win_conditions ?? parsed.win_conditions ?? parsed.winConditions ?? "";
  const charter = parsed.domain_charter ?? parsed.charter ?? parsed.domainCharter ?? "";
  const qExtra = parsed.quality_bar_extra ?? parsed.quality_bar ?? parsed.qualityBar ?? "";

  if (!winCond || !charter) {
    throw new Error(
      `Missing required fields in Gemini response. Got keys: [${Object.keys(parsed).join(", ")}]. Snippet: ${text.substring(0, 200)}`
    );
  }

  return {
    primary_outcome: outcome,
    conversation_win_conditions: String(winCond).trim(),
    domain_charter: String(charter).trim(),
    quality_bar_extra: String(qExtra).trim(),
  };
}

async function processAgent(client: PoolClient, agent: AgentRow): Promise<{ ok: boolean; err?: string }> {
  try {
    const cat: SeriesCategory = SERIES_CATEGORY[agent.series] ?? "regulasi";
    const policy = await generateWithGemini(agent);
    const qualityBar = QUALITY_BAR_BASE + (policy.quality_bar_extra ? " " + policy.quality_bar_extra : "");

    // Preserve existing non-empty values; only fill kosong fields.
    await client.query(
      `UPDATE agents SET
        primary_outcome = COALESCE(NULLIF(primary_outcome, ''), $1),
        conversation_win_conditions = COALESCE(NULLIF(conversation_win_conditions, ''), $2),
        brand_voice_spec = COALESCE(NULLIF(brand_voice_spec, ''), $3),
        interaction_policy = COALESCE(NULLIF(interaction_policy, ''), $4),
        domain_charter = COALESCE(NULLIF(domain_charter, ''), $5),
        quality_bar = COALESCE(NULLIF(quality_bar, ''), $6),
        risk_compliance = COALESCE(NULLIF(risk_compliance, ''), $7)
      WHERE id = $8`,
      [
        policy.primary_outcome,
        policy.conversation_win_conditions,
        BRAND_VOICE_BY_CAT[cat],
        INTERACTION_POLICY_BASE,
        policy.domain_charter,
        qualityBar,
        RISK_COMPLIANCE_BY_CAT[cat],
        agent.id,
      ]
    );
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    // Detect emptiness across ALL 7 policy fields, not just brand_voice_spec
    const { rows: agents } = await client.query<AgentRow>(`
      SELECT a.id, a.name, a.description, a.tagline, a.system_prompt,
        s.name as series, t.name as toolbox, a.is_orchestrator
      FROM agents a
      JOIN toolboxes t ON a.toolbox_id = t.id
      LEFT JOIN big_ideas b ON t.big_idea_id = b.id
      LEFT JOIN series s ON COALESCE(t.series_id, b.series_id) = s.id
      WHERE s.name IS NOT NULL
        AND (
          a.primary_outcome IS NULL OR a.primary_outcome = ''
          OR a.conversation_win_conditions IS NULL OR a.conversation_win_conditions = ''
          OR a.brand_voice_spec IS NULL OR a.brand_voice_spec = ''
          OR a.interaction_policy IS NULL OR a.interaction_policy = ''
          OR a.domain_charter IS NULL OR a.domain_charter = ''
          OR a.quality_bar IS NULL OR a.quality_bar = ''
          OR a.risk_compliance IS NULL OR a.risk_compliance = ''
        )
      ORDER BY s.name, a.name
    `);

    console.log(`Found ${agents.length} agents with at least one empty policy field across ${new Set(agents.map(a => a.series)).size} series\n`);

    if (agents.length === 0) {
      console.log("No agents need filling. All 7 policy fields are populated.");
      return;
    }

    const CONCURRENCY = 3;
    let completed = 0;
    let failed = 0;
    const failures: { name: string; err: string }[] = [];

    for (let i = 0; i < agents.length; i += CONCURRENCY) {
      const chunk = agents.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (agent) => {
          const result = await processAgent(client, agent);
          return { agent, result };
        })
      );

      for (const { agent, result } of results) {
        if (result.ok) {
          completed++;
          console.log(`  [${completed}/${agents.length}] ✓ ${agent.series.substring(0, 30)} | ${agent.name}`);
        } else {
          failed++;
          failures.push({ name: `${agent.series} | ${agent.name}`, err: result.err ?? "unknown" });
          console.log(`  [${completed + failed}/${agents.length}] ✗ ${agent.name} — ${result.err}`);
        }
      }
    }

    console.log(`\n=== SELESAI ===`);
    console.log(`Total: ${agents.length} | Berhasil: ${completed} | Gagal: ${failed}`);
    if (failures.length > 0) {
      console.log(`\nKegagalan:`);
      failures.forEach(f => console.log(`  - ${f.name}: ${f.err}`));
    }
  } catch (e: unknown) {
    console.error("FATAL:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
