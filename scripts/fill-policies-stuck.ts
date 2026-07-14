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

interface GeminiResponseBody {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

interface GeminiCallResult {
  text: string;
  parsed: GeminiParsedJson;
}

async function callGemini(agent: AgentRow, attempt: number): Promise<GeminiCallResult> {
  const sysSnippet = (agent.system_prompt ?? "").trim().substring(0, 300);
  const sysLine = sysSnippet ? `System Prompt (kutipan): "${sysSnippet}${(agent.system_prompt ?? "").length > 300 ? "..." : ""}"` : "System Prompt: (kosong)";
  const prompt = `Anda ahli desain agen AI Jasa Konstruksi Indonesia. Buat 4 kebijakan untuk chatbot ini.

CHATBOT:
Nama: ${agent.name}
Series: ${agent.series}
Toolbox: ${agent.toolbox}
Deskripsi: ${agent.description || "(tidak ada)"}
Hub/Orkestrator: ${agent.is_orchestrator ? "Ya" : "Tidak"}
${sysLine}

Hasilkan JSON dengan EXACT field names berikut:
{
  "primary_outcome": "lead_capture" | "user_education" | "product_trial",
  "conversation_win_conditions": "1-2 kalimat spesifik chatbot ini",
  "domain_charter": "Mulai 'Agen HANYA membahas X.' lalu 2-3 'Dilarang ...' spesifik",
  "quality_bar_extra": "1 kalimat standar kualitas spesifik"
}

Output HANYA JSON valid. Field names harus persis seperti di atas.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: attempt === 1 ? 0.5 : 0.8,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 200)}`);
  const data = (await res.json()) as GeminiResponseBody;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason;
    throw new Error(`Empty response. Finish: ${finishReason ?? "?"}, Feedback: ${JSON.stringify(data.promptFeedback ?? {})}`);
  }
  const raw: unknown = JSON.parse(text);
  const parsed: GeminiParsedJson = (Array.isArray(raw) ? raw[0] : raw) as GeminiParsedJson;
  return { text, parsed };
}

async function fillOne(client: PoolClient, agent: AgentRow): Promise<boolean> {
  console.log(`\n→ ${agent.series} | ${agent.name}`);
  const cat: SeriesCategory = SERIES_CATEGORY[agent.series] ?? "regulasi";

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const { text, parsed } = await callGemini(agent, attempt);
      console.log(`  attempt ${attempt} keys: ${Object.keys(parsed).join(", ")}`);

      const outcome = parsed.primary_outcome ?? parsed.outcome ?? "";
      const winCond = parsed.conversation_win_conditions ?? parsed.win_conditions ?? parsed.winConditions ?? "";
      const charter = parsed.domain_charter ?? parsed.charter ?? parsed.domainCharter ?? "";
      const qExtra = parsed.quality_bar_extra ?? parsed.quality_bar ?? parsed.qualityBar ?? "";

      const validOutcomes = ["lead_capture", "user_education", "product_trial"] as const;
      type ValidOutcome = typeof validOutcomes[number];
      const finalOutcome: ValidOutcome = (validOutcomes as readonly string[]).includes(outcome)
        ? (outcome as ValidOutcome)
        : "user_education";

      if (!winCond || !charter) {
        console.log(`  attempt ${attempt} ✗ missing: winCond=${!!winCond} charter=${!!charter}`);
        console.log(`  TEXT: ${text.substring(0, 300)}`);
        continue;
      }

      const qualityBar = QUALITY_BAR_BASE + (qExtra ? " " + qExtra : "");
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
         WHERE id=$8`,
        [finalOutcome, winCond, BRAND_VOICE_BY_CAT[cat], INTERACTION_POLICY_BASE,
          charter, qualityBar, RISK_COMPLIANCE_BY_CAT[cat], agent.id]
      );
      console.log(`  ✓ saved (outcome=${finalOutcome})`);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  attempt ${attempt} error: ${msg.substring(0, 200)}`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    // Detect emptiness across ALL 7 policy fields
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
    console.log(`Found ${agents.length} agents with at least one empty policy field`);
    let ok = 0;
    for (const a of agents) {
      if (await fillOne(client, a)) ok++;
    }
    console.log(`\nDone: ${ok}/${agents.length} filled`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
