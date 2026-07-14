/**
 * Chaesa AI Studio Exporter (v2 — presisi)
 *
 * Memetakan data Chatbot Gustafta menjadi struktur yang kompatibel
 * dengan aplikasi "Chaesa AI Studio" (https://smart-ebook-builder-7-1.replit.app/).
 *
 * Output bundle terdiri dari 4 section:
 *  1. projectData    → form Konfigurasi → Proyek (Industri, Topik, Judul, Target, dll)
 *  2. assistantConfig → form Konfigurasi → Asisten (Nama, Jabatan, Karakter, KB, dll)
 *  3. botBuilder     → form GPT Builder (Bot Identity, Persona, System Prompt)
 *  4. modeConfig     → opsi Brainstorm/Outline/Draft (Jumlah Ide, Bab, Kedalaman)
 *
 * Semua nilai enum SUDAH PRESISI sesuai opsi resmi Chaesa per April 2026
 * (hasil verifikasi dari screenshot UI yang dikonfirmasi user).
 */

type AnyAgent = any;

// ============ DAFTAR OPSI RESMI CHAESA ============

const CHAESA_INDUSTRIES = [
  "Keteknikan & Engineering",
  "Konstruksi & Infrastruktur",
  "Pertambangan & Mineral",
  "Minyak & Gas (Migas)",
  "Ketenagalistrikan & Energi",
  "Manufaktur & Produksi",
  "UMKM & Bisnis Kecil",
  "Kekayaan & Kebebasan Finansial",
  "Keluarga & Parenting",
  "Kerohanian & Spiritualitas",
  "Kebugaran & Kesehatan",
  "Hobi & Kreativitas",
  "Perijinan Usaha",
  "Tender & Pengadaan",
  "Sertifikasi (SBU)",
  "Sertifikasi (SKK)",
  "Manajemen Proyek",
  "ERP & Sistem Informasi",
  "BIM & Desain Digital",
  "Pengembangan Usaha Berkelanjutan",
  "Pengembangan Keprofesian Berkelanjutan",
  "Sertifikasi Sistem Manajemen (ISO)",
  "Pancek KPK",
  "Umum / Lainnya",
] as const;

const CHAESA_LEVELS = ["1 Ebook", "Trilogi 1 (3 Ebook)", "Trilogi 2 (6 Ebook)", "Trilogi 3 (9 Ebook)"] as const;
const CHAESA_OUTPUT_FORMATS = ["eBook", "Artikel", "Whitepaper", "Modul Pelatihan"] as const;

const CHAESA_TONES = [
  "Authoritative", "Professional", "Friendly", "Inspirational", "Persuasive",
  "Warm", "Formal", "Encouraging", "Conversational", "Serious",
];

const CHAESA_WRITING_STYLES = [
  "Instructive", "Conversational", "Narrative", "Technical", "Storytelling",
  "Informative", "Analytical", "Direct Response", "StoryBrand", "Academic",
];

const CHAESA_AI_CHARACTERS = [
  { value: "Agentic Strategist", desc: "Proaktif & antisipatif" },
  { value: "Standard Assistant", desc: "Membantu & langsung" },
  { value: "Socratic Mentor", desc: "Membimbing lewat pertanyaan" },
  { value: "Creative Visionary", desc: "Kreatif & inovatif" },
  { value: "Strict Professional", desc: "Formal & ringkas" },
  { value: "Data-Driven Analyst", desc: "Logis & berbasis data" },
];

const CHAESA_DEPTH_LEVELS = [
  "Beginner — untuk pemula total",
  "Intermediate — untuk yang sudah paham dasar",
  "Advanced — untuk praktisi berpengalaman",
  "Expert — untuk profesional/spesialis",
];

const CHAESA_BRAINSTORM_NUM_IDEAS = ["3 Ide (Fokus)", "5 Ide (Standard)", "7 Ide (Lebih Banyak Pilihan)", "10 Ide (Eksplorasi Penuh)"];
const CHAESA_BRAINSTORM_ANGLES = [
  "Problem-Solution (Masalah → Solusi)", "How-To Guide (Panduan Langkah)",
  "Case Study (Studi Kasus Nyata)", "Inspirational (Kisah Motivasi)",
  "Reference (Ensiklopedia / Acuan)", "Workbook (Latihan & Praktik)",
];
const CHAESA_OUTLINE_NUM_CHAPTERS = ["5 Bab (Compact)", "7 Bab (Standard)", "10 Bab (Komprehensif)", "12 Bab (Extended)", "15 Bab (Masterclass)"];
const CHAESA_OUTLINE_DEPTHS = [
  "Simple (Judul Bab saja)", "Standard (Bab + Sub-bab)",
  "Detailed (Bab + Sub-bab + Poin Kunci)", "Full (Bab + Sub-bab + Poin + Latihan)",
];

const CHAESA_ASSISTANT_TRAITS = [
  "Profesional", "Tegas", "Empati", "Akademis", "Praktikal",
  "Inspiratif", "Sabar", "Analitis", "Kreatif", "Humoris",
  "Mentor", "Strategis", "Detail", "Visioner", "Kolaboratif",
];

const CHAESA_BOT_ROLES = [
  "Mentor Pribadi", "Konsultan Ahli", "Tutor Pembelajaran", "Asisten Produktivitas",
  "Coach Bisnis", "Customer Service AI", "Sales Assistant", "Onboarding Bot",
];

// ============ HELPER ============

function joinList(v: any, sep = ", "): string {
  if (!v) return "";
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join(sep);
  return String(v);
}

function truncate(s: string, max = 800): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max).trim() + "…" : s;
}

// ============ HEURISTIK MAPPING (sesuai label resmi Chaesa) ============

function pickIndustry(agent: AnyAgent, toolbox?: any, bigIdea?: any, series?: any): string {
  const text = `${agent?.category || ""} ${agent?.subcategory || ""} ${agent?.name || ""} ${agent?.tagline || ""} ${toolbox?.name || ""} ${toolbox?.description || ""} ${bigIdea?.name || ""} ${series?.name || ""}`.toLowerCase();
  // ORDER MATTERS: paling spesifik dulu, baru umum.
  // Pattern PKB harus di atas ISO/SKK karena keyword "askom" overlap.
  if (/(askom.*berkelanjutan|asesor.*kompet.*berkelanjutan|pkb|cpd|pengembangan keprofesian|pengembangan kompet)/.test(text)) return "Pengembangan Keprofesian Berkelanjutan";
  if (/(pancek|antikorupsi|smap|anti.suap|iso\s*37001)/.test(text)) return "Pancek KPK";
  if (/(iso\s*9001|iso\s*14001|smk3|sistem manajemen|sertifikasi.*manajemen)/.test(text)) return "Sertifikasi Sistem Manajemen (ISO)";
  if (/(askom|asesor.*kompet|skk|tenaga kerja konstruksi|sertif.*kompet)/.test(text)) return "Sertifikasi (SKK)";
  if (/(sbu|usaha jasa konstruksi|bujk)/.test(text)) return "Sertifikasi (SBU)";
  if (/(tender|pbjp|lpse|pengadaan|lkpp)/.test(text)) return "Tender & Pengadaan";
  if (/(perij|izin usaha|lisensi|nib|oss)/.test(text)) return "Perijinan Usaha";
  if (/(odoo|erp|sistem informasi|sip-pjbu)/.test(text)) return "ERP & Sistem Informasi";
  if (/(bim|desain digital|cad|revit|autocad)/.test(text)) return "BIM & Desain Digital";
  if (/(manaj.*proyek|project mgmt|pmbok|pmo|kontrak konstruksi)/.test(text)) return "Manajemen Proyek";
  if (/(esg|sustainab|keberlanjutan|berkelanjutan|sdg)/.test(text)) return "Pengembangan Usaha Berkelanjutan";
  if (/(konstruksi|sipil|kontraktor|infrastruktur|jalan|jembatan|gedung)/.test(text)) return "Konstruksi & Infrastruktur";
  if (/(migas|minyak|gas|oil|petroleum)/.test(text)) return "Minyak & Gas (Migas)";
  if (/(tambang|mineral|batubara|nikel)/.test(text)) return "Pertambangan & Mineral";
  if (/(listrik|energi|ebt|tenaga listrik|kelistrikan)/.test(text)) return "Ketenagalistrikan & Energi";
  if (/(manufaktur|pabrik|produksi industri)/.test(text)) return "Manufaktur & Produksi";
  if (/(umkm|usaha kecil|umkm)/.test(text)) return "UMKM & Bisnis Kecil";
  if (/(finansial|keuangan pribadi|investasi pribadi|wealth)/.test(text)) return "Kekayaan & Kebebasan Finansial";
  if (/(parenting|keluarga|anak)/.test(text)) return "Keluarga & Parenting";
  if (/(spiritual|rohani|religius|agama)/.test(text)) return "Kerohanian & Spiritualitas";
  if (/(kebugaran|kesehatan|fitness|olahraga|gym)/.test(text)) return "Kebugaran & Kesehatan";
  if (/(hobi|kreativ|seni|hobby)/.test(text)) return "Hobi & Kreativitas";
  if (/(engineer|keteknikan|teknik mesin|teknik elektro)/.test(text)) return "Keteknikan & Engineering";
  return "Umum / Lainnya";
}

function pickLevel(agent: AnyAgent, series?: any): string {
  const text = `${series?.name || ""} ${agent?.tagline || ""}`.toLowerCase();
  if (/(trilogi.*9|9.ebook|9.modul)/.test(text)) return "Trilogi 3 (9 Ebook)";
  if (/(trilogi.*6|6.ebook|6.modul)/.test(text)) return "Trilogi 2 (6 Ebook)";
  if (/(trilogi.*3|3.ebook|3.modul|trilogi)/.test(text)) return "Trilogi 1 (3 Ebook)";
  return "1 Ebook";
}

function pickAiCharacter(toneOfVoice: string, agent?: AnyAgent): string {
  const t = `${toneOfVoice || ""} ${agent?.philosophy || ""} ${agent?.systemPrompt || ""}`.toLowerCase();
  if (/(socratic|tanya|membimbing|mentor.*tanya|reflektif)/.test(t)) return "Socratic Mentor";
  if (/(strategis|strategic|antisipa|proaktif|agentic)/.test(t)) return "Agentic Strategist";
  if (/(data|analit|riset|fakta|statistik|berbasis data)/.test(t)) return "Data-Driven Analyst";
  if (/(playful|kreatif|inovatif|creative|visionary)/.test(t)) return "Creative Visionary";
  if (/(strict|tegas|formal|ringkas|profesional)/.test(t)) return "Strict Professional";
  return "Standard Assistant";
}

function pickBotRole(agent: AnyAgent): string {
  const text = `${agent?.category || ""} ${agent?.subcategory || ""} ${agent?.tagline || ""} ${agent?.name || ""}`.toLowerCase();
  if (/(coach|mentor|asisten|pembina|tutor pribadi)/.test(text)) return "Mentor Pribadi";
  if (/(consult|konsultan|advisor|ahli)/.test(text)) return "Konsultan Ahli";
  if (/(tutor|kelas|edukasi|kursus|pengajar)/.test(text)) return "Tutor Pembelajaran";
  if (/(produktiv|asisten kerja|asisten admin)/.test(text)) return "Asisten Produktivitas";
  if (/(bisnis|business|startup|wirausaha)/.test(text)) return "Coach Bisnis";
  if (/(customer|cs|service|helpdesk|support|helpdes)/.test(text)) return "Customer Service AI";
  if (/(sales|jual|marketing|pemasar)/.test(text)) return "Sales Assistant";
  if (/(onboarding|welcome|sambutan)/.test(text)) return "Onboarding Bot";
  return "Mentor Pribadi";
}

/** Filter & normalisasi tone Gustafta menjadi opsi resmi Chaesa (multi-select). */
function pickTones(toneOfVoice: string): string[] {
  const t = (toneOfVoice || "").toLowerCase();
  const out: string[] = [];
  const map: Array<[RegExp, string]> = [
    [/profession|profesional/, "Professional"],
    [/friendly|ramah|akrab/, "Friendly"],
    [/authorit|otorit|berwibawa/, "Authoritative"],
    [/inspir|motivasi/, "Inspirational"],
    [/persuas|membujuk/, "Persuasive"],
    [/warm|hangat|empati/, "Warm"],
    [/formal/, "Formal"],
    [/encourag|mendukung|suportif/, "Encouraging"],
    [/conversation|santai|casual/, "Conversational"],
    [/serious|serius|tegas/, "Serious"],
  ];
  for (const [rx, label] of map) if (rx.test(t)) out.push(label);
  if (out.length === 0) out.push("Professional", "Friendly");
  return Array.from(new Set(out));
}

function pickWritingStyles(agent: AnyAgent): string[] {
  const t = `${agent?.toneOfVoice || ""} ${agent?.philosophy || ""} ${agent?.description || ""}`.toLowerCase();
  const out: string[] = [];
  const map: Array<[RegExp, string]> = [
    [/instruct|panduan|step.by.step|langkah/, "Instructive"],
    [/storytell|kisah|cerita|narasi/, "Storytelling"],
    [/conversation|santai|dialog/, "Conversational"],
    [/narrative|naratif/, "Narrative"],
    [/technical|teknis|spesifikasi/, "Technical"],
    [/inform|informatif|edukatif/, "Informative"],
    [/analyt|analitis|analisis/, "Analytical"],
    [/direct|cta|sales|penjualan/, "Direct Response"],
    [/storybrand|brand story/, "StoryBrand"],
    [/academ|akademis|riset|ilmiah/, "Academic"],
  ];
  for (const [rx, label] of map) if (rx.test(t)) out.push(label);
  if (out.length === 0) out.push("Instructive", "Storytelling");
  return Array.from(new Set(out)).slice(0, 4);
}

function pickAssistantTraits(agent: AnyAgent): string[] {
  const t = `${agent?.toneOfVoice || ""} ${agent?.philosophy || ""} ${agent?.description || ""}`.toLowerCase();
  const out: string[] = [];
  const map: Array<[RegExp, string]> = [
    [/profession|profesional/, "Profesional"],
    [/tegas|firm|strict/, "Tegas"],
    [/empati|empath|hangat/, "Empati"],
    [/akadem|scholar|ilmiah/, "Akademis"],
    [/praktis|practical|aplikatif/, "Praktikal"],
    [/inspir|motivasi/, "Inspiratif"],
    [/sabar|patient|telaten/, "Sabar"],
    [/analit|analytical|logis/, "Analitis"],
    [/kreatif|creative|inovatif/, "Kreatif"],
    [/humor|lucu|santai/, "Humoris"],
    [/mentor|coach|pembimbing/, "Mentor"],
    [/strategis|strategic/, "Strategis"],
    [/detail|teliti|cermat/, "Detail"],
    [/visi|visionary|pandangan jauh/, "Visioner"],
    [/kolaborat|collaborative|tim/, "Kolaboratif"],
  ];
  for (const [rx, label] of map) if (rx.test(t)) out.push(label);
  if (out.length === 0) out.push("Profesional", "Mentor", "Praktikal");
  return Array.from(new Set(out));
}

function pickAngle(agent: AnyAgent): string {
  const t = `${agent?.toneOfVoice || ""} ${agent?.philosophy || ""} ${agent?.description || ""}`.toLowerCase();
  if (/(case|studi kasus|contoh nyata)/.test(t)) return "Case Study (Studi Kasus Nyata)";
  if (/(how.?to|panduan|langkah|tutorial)/.test(t)) return "How-To Guide (Panduan Langkah)";
  if (/(referen|ensiklopedi|acuan)/.test(t)) return "Reference (Ensiklopedia / Acuan)";
  if (/(workbook|latihan|praktik|exercise)/.test(t)) return "Workbook (Latihan & Praktik)";
  if (/(inspir|kisah|motivasi)/.test(t)) return "Inspirational (Kisah Motivasi)";
  return "Problem-Solution (Masalah → Solusi)";
}

function pickDepth(agent: AnyAgent): string {
  const t = `${agent?.tagline || ""} ${agent?.description || ""}`.toLowerCase();
  if (/(expert|spesialis|master|pakar|senior)/.test(t)) return "Expert — untuk profesional/spesialis";
  if (/(advanced|berpengalaman|lanjutan|mahir)/.test(t)) return "Advanced — untuk praktisi berpengalaman";
  if (/(beginner|pemula|awal|dasar)/.test(t)) return "Beginner — untuk pemula total";
  return "Intermediate — untuk yang sudah paham dasar";
}

// ============ TYPES & MAIN BUILDER ============

export interface ChaesaExportInput {
  agent: AnyAgent;
  knowledgeBases?: any[];
  miniApps?: any[];
  projectBrainTemplates?: any[];
  toolbox?: any;
  bigIdea?: any;
  series?: any;
}

export interface ChaesaExport {
  meta: {
    sourceApp: "Gustafta";
    targetApp: "Chaesa AI Studio";
    targetUrl: string;
    exportedAt: string;
    schemaVersion: "2.0";
    chaesaImportTab: string;
  };
  projectData: Record<string, string>;
  assistantConfig: Record<string, string>;
  botBuilder: Record<string, string>;
  modeConfig: Record<string, string>;
  knowledgeRefs: Array<{ name: string; description?: string; preview: string }>;
  quickFill: Array<{ section: string; field: string; label: string; value: string; options?: readonly string[] | string[] }>;
  validOptions: {
    industries: readonly string[];
    levels: readonly string[];
    outputFormats: readonly string[];
    tones: string[];
    writingStyles: string[];
    aiCharacters: string[];
    assistantTraits: string[];
    botRoles: string[];
  };
}

export function buildChaesaExport(input: ChaesaExportInput): ChaesaExport {
  const { agent, knowledgeBases = [], toolbox, bigIdea, series } = input;

  const expertise = joinList(agent?.expertise);
  const keyPhrases = joinList(agent?.keyPhrases);
  const avoidTopics = joinList(agent?.avoidTopics);
  const conversationStarters = Array.isArray(agent?.conversationStarters) ? agent.conversationStarters : [];

  const tone = agent?.toneOfVoice || "Profesional, Friendly, Empatik";
  const industry = pickIndustry(agent, toolbox, bigIdea, series);
  const level = pickLevel(agent, series);
  const tones = pickTones(tone);
  const writingStyles = pickWritingStyles(agent);
  const traits = pickAssistantTraits(agent);
  const aiCharacter = pickAiCharacter(tone, agent);

  // hasilRiset: ringkasan singkat dari Knowledge Base
  const hasilRiset = knowledgeBases
    .slice(0, 5)
    .map((kb: any) => {
      const content = String(kb?.content || kb?.extractedText || "").slice(0, 220).trim();
      return `• ${kb?.name || "Materi"}: ${content}${content.length >= 220 ? "…" : ""}`;
    })
    .filter(Boolean)
    .join("\n");

  const painPoint = conversationStarters.length > 0
    ? `Kebutuhan utama target pembaca:\n${conversationStarters.slice(0, 4).map((s: string) => `• ${s}`).join("\n")}`
    : truncate(agent?.philosophy || "", 400);

  const bigIdeaText = bigIdea?.name
    ? `${bigIdea.name}${bigIdea.description ? " — " + bigIdea.description : ""}`
    : truncate(agent?.philosophy || "", 300);

  // ============ 1. PROJECT DATA (form Konfigurasi → Proyek) ============
  const projectData: Record<string, string> = {
    industry,
    topik: expertise || agent?.subcategory || agent?.category || agent?.name || "",
    judul: agent?.name ? `${agent.name} — Panduan Profesional` : "",
    target: agent?.tagline || `Praktisi ${agent?.category || "industri"} di Indonesia`,
    level,
    tujuan: truncate(agent?.description || "", 500),
    painPoint,
    bigIdea: bigIdeaText,
    hasilRiset,
    produk: toolbox?.name || "",
    language: "Bahasa Indonesia",
    outputFormat: "eBook",
    tone: tones.join(", "),
    writingStyle: writingStyles.join(", "),
    aiCharacter,
  };

  // ============ 2. ASISTEN TOPIK (form Konfigurasi → Asisten) ============
  const assistantConfig: Record<string, string> = {
    assistantName: agent?.name || "",
    assistantRole: agent?.subcategory || pickBotRole(agent),
    assistantTagline: agent?.tagline || "",
    assistantTraits: traits.join(", "),
    assistantGreeting: agent?.greetingMessage || "",
    assistantKnowledge: hasilRiset || truncate(agent?.systemPrompt || "", 1200),
    assistantMethod: keyPhrases || expertise || "",
    assistantCaseStudy: conversationStarters.length > 0
      ? conversationStarters.slice(0, 3).join("\n• ")
      : "",
    assistantFocusTopics: expertise || keyPhrases || "",
    assistantAvoidTopics: avoidTopics,
    assistantInstructions: truncate(agent?.systemPrompt || "", 800),
  };

  // ============ 3. GPT BUILDER (form GPT Builder) ============
  const botBuilder: Record<string, string> = {
    botName: agent?.name || "",
    botRole: pickBotRole(agent),
    botPersonality: tones.join(", "),
    botPersonaDetail: truncate(agent?.philosophy || agent?.description || "", 600),
    botLanguage: "Bahasa Indonesia",
    botAudience: agent?.tagline || projectData.target,
    botAvoidTopics: avoidTopics,
    botSystemPrompt: truncate(agent?.systemPrompt || "", 4000),
  };

  // ============ 4. MODE CONFIG (Brainstorm + Outline + Draft) ============
  const modeConfig: Record<string, string> = {
    brainstormNumIdeas: "5 Ide (Standard)",
    brainstormAngle: pickAngle(agent),
    brainstormDepth: pickDepth(agent),
    outlineNumChapters: "7 Bab (Standard)",
    outlineDepth: "Standard (Bab + Sub-bab)",
    outlineFlow: "",
    extendTextTarget: "300-500 kata (Artikel Pendek)",
    anglePositioning: "Unik & Berbeda dari buku sejenis",
  };

  const knowledgeRefs = knowledgeBases.slice(0, 20).map((kb: any) => ({
    name: String(kb?.name || "Materi"),
    description: kb?.description ? String(kb.description) : undefined,
    preview: truncate(String(kb?.content || kb?.extractedText || ""), 280),
  }));

  // ============ QUICK-FILL TABLE (untuk dialog UI) ============
  const labelMap: Record<string, string> = {
    industry: "Industri / Sektor",
    topik: "Topik / Kata Kunci Utama",
    judul: "Judul Ebook",
    target: "Target Pembaca",
    level: "Level/Struktur Ebook",
    tujuan: "Tujuan Ebook",
    painPoint: "Pain Point / Masalah Target",
    bigIdea: "Big Idea / Konsep Unik",
    hasilRiset: "Hasil Riset / Data Pendukung",
    produk: "Produk/Layanan Terkait",
    language: "Bahasa",
    outputFormat: "Format Output",
    tone: "Tone Penulisan (multi)",
    writingStyle: "Gaya Penulisan (multi)",
    aiCharacter: "AI Character / Brain Mode",
    assistantName: "Nama Asisten",
    assistantRole: "Jabatan / Keahlian",
    assistantTagline: "Tagline / Kalimat Pembeda",
    assistantTraits: "Karakter & Kepribadian (multi)",
    assistantGreeting: "Sapaan Khas / Opening Statement",
    assistantKnowledge: "Konten & Pengetahuan Utama",
    assistantMethod: "Metode / Framework Favorit",
    assistantCaseStudy: "Contoh Kasus / Case Study",
    assistantFocusTopics: "Topik yang Difokuskan",
    assistantAvoidTopics: "Topik yang Dihindari",
    assistantInstructions: "Instruksi Khusus",
    botName: "Nama Bot",
    botRole: "Peran Bot",
    botPersonality: "Kepribadian Bot",
    botPersonaDetail: "Deskripsi Persona Detail",
    botLanguage: "Bahasa Chatbot",
    botAudience: "Target Pengguna Bot",
    botAvoidTopics: "Topik yang Harus Dihindari",
    botSystemPrompt: "Instruksi Tambahan / System Prompt",
    brainstormNumIdeas: "Jumlah Ide yang Dihasilkan",
    brainstormAngle: "Angle / Pendekatan Utama",
    brainstormDepth: "Level Kedalaman Ebook",
    outlineNumChapters: "Jumlah Bab",
    outlineDepth: "Kedalaman Outline",
    outlineFlow: "Struktur Alur",
    extendTextTarget: "Target Panjang (Extend Text)",
    anglePositioning: "Angle Positioning Utama",
  };

  const optionsMap: Record<string, readonly string[] | string[]> = {
    industry: CHAESA_INDUSTRIES,
    level: CHAESA_LEVELS,
    outputFormat: CHAESA_OUTPUT_FORMATS,
    tone: CHAESA_TONES,
    writingStyle: CHAESA_WRITING_STYLES,
    aiCharacter: CHAESA_AI_CHARACTERS.map(c => c.value),
    assistantTraits: CHAESA_ASSISTANT_TRAITS,
    botRole: CHAESA_BOT_ROLES,
    brainstormNumIdeas: CHAESA_BRAINSTORM_NUM_IDEAS,
    brainstormAngle: CHAESA_BRAINSTORM_ANGLES,
    brainstormDepth: CHAESA_DEPTH_LEVELS,
    outlineNumChapters: CHAESA_OUTLINE_NUM_CHAPTERS,
    outlineDepth: CHAESA_OUTLINE_DEPTHS,
  };

  const quickFill: ChaesaExport["quickFill"] = [];
  const sections: Array<[string, Record<string, string>]> = [
    ["📚 Konfigurasi → Proyek (Data Ebook)", projectData],
    ["🧑‍🏫 Konfigurasi → Asisten Topik", assistantConfig],
    ["🤖 GPT Builder", botBuilder],
    ["⚙️ Mode Konfigurasi (Brainstorm/Outline/Draft)", modeConfig],
  ];
  for (const [section, data] of sections) {
    for (const [k, v] of Object.entries(data)) {
      quickFill.push({
        section,
        field: k,
        label: labelMap[k] || k,
        value: v,
        options: optionsMap[k],
      });
    }
  }

  return {
    meta: {
      sourceApp: "Gustafta",
      targetApp: "Chaesa AI Studio",
      targetUrl: "https://smart-ebook-builder-7-1.replit.app/",
      exportedAt: new Date().toISOString(),
      schemaVersion: "2.0",
      chaesaImportTab:
        "Tip: Untuk auto-fill semua field, download eBook (HTML/Markdown) dari Studio Gustafta lalu unggah di Chaesa → Fondasi Ebook → Import. Atau salin manual per field di sini.",
    },
    projectData,
    assistantConfig,
    botBuilder,
    modeConfig,
    knowledgeRefs,
    quickFill,
    validOptions: {
      industries: CHAESA_INDUSTRIES,
      levels: CHAESA_LEVELS,
      outputFormats: CHAESA_OUTPUT_FORMATS,
      tones: CHAESA_TONES,
      writingStyles: CHAESA_WRITING_STYLES,
      aiCharacters: CHAESA_AI_CHARACTERS.map(c => c.value),
      assistantTraits: CHAESA_ASSISTANT_TRAITS,
      botRoles: CHAESA_BOT_ROLES,
    },
  };
}
