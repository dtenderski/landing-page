/**
 * ============================================================================
 * INFERENCE ENGINE — Tahap 6
 * ============================================================================
 *
 * Menyimpulkan (infer) field Blueprint dari SEDIKIT input yang sudah ada —
 * terutama `meta.intent`, nama, deskripsi, dan keahlian — LENGKAP DENGAN
 * ALASAN (evidence) dan SKOR KEYAKINAN per field. Tujuannya: mengurangi jumlah
 * pertanyaan yang harus diajukan Dialogue Engine (Tahap 5).
 *
 * Hubungan antar-tahap:
 *   - HILIR ke Dialogue Engine: field hasil inferensi diberi `fieldMeta`
 *     (source="inferred", confidence, needsConfirmation). Dialogue Engine lalu
 *     HANYA menanyakan yang confidence-nya rendah / butuh konfirmasi.
 *   - HILIR ke Mapping/Configuration Engine: nilai inferensi ikut dipetakan &
 *     ditulis seperti nilai lain.
 *
 * PRINSIP (sama seperti Mapping Engine — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI. Tidak ada efek samping.
 *   - TIDAK memanggil LLM. Semua inferensi DETERMINISTIK berbasis heuristik/
 *     aturan, sehingga mudah diuji & idempoten. (Penghalus berbasis LLM bisa
 *     ditambah sebagai lapisan terpisah pada fase penyambungan.)
 *   - TIDAK PERNAH menimpa nilai yang berasal dari manusia (source="user").
 *   - Hanya mengisi field kosong, atau menyempurnakan field yang sebelumnya
 *     juga "inferred" (bila overwriteInferred=true). Nilai yang sudah ada dengan
 *     asal tak dikenal DIBIARKAN (dianggap otoritatif).
 *   - Belum dipanggil dari route mana pun — masih aditif.
 * ============================================================================
 */

import {
  type Blueprint,
  type BlueprintModuleName,
} from "@shared/blueprint/blueprint-schema";

/* ===========================================================================
 * Tipe
 * ======================================================================== */

type TargetModule = BlueprintModuleName | "meta";

export interface InferredValue {
  value: any;
  /** 0..1 — keyakinan terhadap nilai simpulan ini. */
  confidence: number;
  /** Alasan/jejak kenapa nilai ini disimpulkan (ditampilkan ke user). */
  evidence: string;
  /** Paksa status konfirmasi; default dihitung dari confirmThreshold. */
  needsConfirmation?: boolean;
}

export interface InferenceRule {
  id: string;
  module: TargetModule;
  field: string;
  /** Kembalikan nilai simpulan atau null bila tak bisa menyimpulkan. */
  infer: (bp: Blueprint) => InferredValue | null;
}

export interface InferenceOptions {
  /** Boleh menyempurnakan field yang sebelumnya juga "inferred" (default true). */
  overwriteInferred?: boolean;
  /** confidence di bawah ini → needsConfirmation=true (default 0.75). */
  confirmThreshold?: number;
  /** confidence di bawah ini → TIDAK ditulis sama sekali (default 0.3). */
  minConfidenceToWrite?: number;
  /** Jumlah lintasan agar aturan bisa saling membangun (default 2). */
  maxPasses?: number;
}

export type InferenceAction =
  | "written"
  | "skipped-user"
  | "skipped-present"
  | "skipped-low-confidence"
  | "no-inference";

export interface InferenceLog {
  ruleId: string;
  module: TargetModule;
  field: string;
  action: InferenceAction;
  value?: any;
  confidence?: number;
  evidence?: string;
  needsConfirmation?: boolean;
}

export interface InferenceResult {
  blueprint: Blueprint;
  /** Hanya entri yang benar-benar ditulis (action="written"). */
  inferences: InferenceLog[];
  /** Seluruh jejak keputusan (termasuk yang dilewati) — untuk audit/debug. */
  trace: InferenceLog[];
  stats: { written: number; skipped: number; rulesEvaluated: number };
}

/* ===========================================================================
 * Heuristik berbagi pakai
 * ======================================================================== */

/** Taksonomi kategori → kata kunci (lowercase). */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Hukum: ["hukum", "legal", "pengacara", "kontrak", "perjanjian", "litigasi", "perkara", "advokat"],
  Konstruksi: [
    "konstruksi", "sbu", "skk", "bujk", "bangunan", "sipil", "arsitek", "kontraktor", "lpjk",
    "jasa konstruksi", "tender",
  ],
  "Keuangan & Pajak": ["pajak", "akuntansi", "keuangan", "ppn", "pph", "faktur", "spt", "audit keuangan"],
  SDM: ["sdm", "rekrutmen", "karyawan", "kepegawaian", "payroll", "talent", "hrd"],
  Pemasaran: ["marketing", "pemasaran", "iklan", "brand", "konten", "sosial media", "seo", "copywriting"],
  Pendidikan: ["tutor", "belajar", "mahasiswa", "skripsi", "akademik", "kursus", "pendidikan", "ujian"],
  Kesehatan: ["kesehatan", "medis", "dokter", "pasien", "klinik", "rumah sakit", "obat", "gizi"],
  Energi: ["energi", "migas", "ebt", "listrik", "plts", "tambang", "ketenagalistrikan", "surya"],
  Teknologi: ["software", "aplikasi", "developer", "coding", "teknologi", "saas", "it"],
  Properti: ["properti", "real estate", "rumah", "kpr", "sewa", "developer properti"],
};

/** Kategori → nada bicara yang lazim. */
const CATEGORY_TONE: Record<string, string> = {
  Hukum: "profesional",
  "Keuangan & Pajak": "profesional",
  Kesehatan: "profesional",
  Energi: "profesional",
  Konstruksi: "profesional",
  Teknologi: "profesional",
  Properti: "profesional",
  Pendidikan: "ramah",
  Pemasaran: "santai",
  SDM: "empatik",
};

/** Nada bicara → temperature LLM. */
const TONE_TEMPERATURE: Record<string, number> = {
  profesional: 0.3,
  tegas: 0.3,
  ramah: 0.6,
  empatik: 0.6,
  santai: 0.8,
};

const RAG_KEYWORDS = [
  "dokumen", "regulasi", "peraturan", "permen", "uu", "sop", "kebijakan",
  "standar", "referensi", "basis pengetahuan", "knowledge", "berdasarkan sumber",
];

const CONVERSION_KEYWORDS = [
  "jual", "beli", "lead", "closing", "pelanggan", "daftar", "langganan",
  "subscribe", "pesan", "order", "konversi",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function corpus(bp: Blueprint): string {
  const id = bp.modules.identity.data as Record<string, any>;
  const ref = (bp.modules.reflection?.data ?? {}) as Record<string, any>;
  const parts = [
    bp.meta.intent,
    id.name,
    id.description,
    id.tagline,
    ...(Array.isArray(id.expertise) ? id.expertise : []),
    // Jawaban reflektif ikut memperkaya deteksi kategori/RAG/konversi.
    ref.vision,
    ref.mastered,
    ref.currentReality,
    ref.painPoint,
    ref.desiredCreation,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/** Ambil field refleksi (string) bila terisi, atau null. */
function reflectionField(bp: Blueprint, field: string): string | null {
  const v = (bp.modules.reflection?.data as Record<string, any> | undefined)?.[field];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

const KEYWORD_REGEX_CACHE = new Map<string, RegExp>();

/** Cocokkan kata kunci pada batas kata (hindari "it" cocok di dalam "audit"). */
function matchesKeyword(text: string, keyword: string): boolean {
  let re = KEYWORD_REGEX_CACHE.get(keyword);
  if (!re) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?![a-z0-9])`, "i");
    KEYWORD_REGEX_CACHE.set(keyword, re);
  }
  return re.test(text);
}

function countHits(text: string, keywords: string[]): number {
  return keywords.reduce((n, k) => (matchesKeyword(text, k) ? n + 1 : n), 0);
}

function detectCategory(bp: Blueprint): { category: string; hits: number } | null {
  const text = corpus(bp);
  if (!text) return null;
  let best: { category: string; hits: number } | null = null;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = countHits(text, keywords);
    if (hits > 0 && (!best || hits > best.hits)) best = { category, hits };
  }
  return best;
}

/* ===========================================================================
 * BANK ATURAN INFERENSI (urutan = dependensi: yang dipakai aturan lain dulu)
 * ======================================================================== */

export const INFERENCE_RULES: InferenceRule[] = [
  // slug ← nama (transformasi deterministik → keyakinan tinggi)
  {
    id: "identity.slug",
    module: "identity",
    field: "slug",
    infer: (bp) => {
      const name = (bp.modules.identity.data as any).name;
      if (!name || typeof name !== "string") return null;
      return {
        value: slugify(name),
        confidence: 0.9,
        evidence: `Diturunkan dari nama "${name}".`,
        needsConfirmation: false,
      };
    },
  },

  // description ← intent (ringkas) bila deskripsi kosong
  {
    id: "identity.description",
    module: "identity",
    field: "description",
    infer: (bp) => {
      const intent = bp.meta.intent;
      if (!intent || typeof intent !== "string") return null;
      const text = intent.trim();
      return {
        value: text.length > 220 ? text.slice(0, 217).trimEnd() + "…" : text,
        confidence: 0.5,
        evidence: "Diringkas dari ide besar (intent). Mohon disesuaikan.",
      };
    },
  },

  // category ← pencocokan kata kunci pada intent/deskripsi/keahlian
  {
    id: "identity.category",
    module: "identity",
    field: "category",
    infer: (bp) => {
      const found = detectCategory(bp);
      if (!found) return null;
      return {
        value: found.category,
        confidence: Math.min(0.9, 0.5 + 0.13 * found.hits),
        evidence: `Cocok ${found.hits} kata kunci kategori "${found.category}".`,
      };
    },
  },

  // toneOfVoice ← kategori
  {
    id: "identity.toneOfVoice",
    module: "identity",
    field: "toneOfVoice",
    infer: (bp) => {
      const cat = (bp.modules.identity.data as any).category;
      const tone = cat ? CATEGORY_TONE[cat] : undefined;
      if (!tone) return null;
      return {
        value: tone,
        confidence: 0.55,
        evidence: `Nada lazim untuk kategori "${cat}".`,
      };
    },
  },

  // temperature ← nada bicara (default numerik aman → tak perlu konfirmasi)
  {
    id: "aiEngine.temperature",
    module: "aiEngine",
    field: "temperature",
    infer: (bp) => {
      const tone = (bp.modules.identity.data as any).toneOfVoice;
      const temp = tone ? TONE_TEMPERATURE[tone] : 0.5;
      return {
        value: temp ?? 0.5,
        confidence: 0.6,
        evidence: tone ? `Disetel dari nada "${tone}".` : "Nilai tengah default.",
        needsConfirmation: false,
      };
    },
  },

  // language ← default platform (Indonesia)
  {
    id: "identity.language",
    module: "identity",
    field: "language",
    infer: () => ({
      value: "id",
      confidence: 0.7,
      evidence: "Default platform berbahasa Indonesia.",
      needsConfirmation: false,
    }),
  },

  // model default hemat
  {
    id: "aiEngine.aiModel",
    module: "aiEngine",
    field: "aiModel",
    infer: () => ({
      value: "gpt-4o",
      confidence: 0.6,
      evidence: "Model standar cerdas untuk kualitas jawaban terbaik.",
      needsConfirmation: false,
    }),
  },

  // greeting ← nama + bahasa
  {
    id: "identity.greetingMessage",
    module: "identity",
    field: "greetingMessage",
    infer: (bp) => {
      const name = (bp.modules.identity.data as any).name;
      if (!name) return null;
      return {
        value: `Halo! Saya ${name}. Ada yang bisa saya bantu hari ini?`,
        confidence: 0.5,
        evidence: `Sapaan standar memakai nama "${name}".`,
      };
    },
  },

  // ragEnabled ← jejak kebutuhan berbasis dokumen/sumber
  {
    id: "knowledge.ragEnabled",
    module: "knowledge",
    field: "ragEnabled",
    infer: (bp) => {
      const hits = countHits(corpus(bp), RAG_KEYWORDS);
      if (hits === 0) return null;
      return {
        value: true,
        confidence: Math.min(0.8, 0.5 + 0.1 * hits),
        evidence: `Terindikasi ${hits} kata kunci berbasis dokumen/sumber.`,
      };
    },
  },

  // conversionGoal ← jejak niat komersial
  {
    id: "conversion.conversionGoal",
    module: "conversion",
    field: "conversionGoal",
    infer: (bp) => {
      const hits = countHits(corpus(bp), CONVERSION_KEYWORDS);
      if (hits === 0) return null;
      return {
        value: "Mengubah pengunjung menjadi prospek (lead) untuk ditindaklanjuti.",
        confidence: 0.5,
        evidence: `Terindikasi ${hits} kata kunci komersial.`,
      };
    },
  },

  // agenticMode ← bila ditandai orchestrator
  {
    id: "agentic.agenticMode",
    module: "agentic",
    field: "agenticMode",
    infer: (bp) => {
      if ((bp.modules.orchestration.data as any).isOrchestrator !== true) return null;
      return {
        value: true,
        confidence: 0.85,
        evidence: "Agen ditandai sebagai orchestrator → mode agentic dihidupkan.",
        needsConfirmation: false,
      };
    },
  },

  // primaryOutcome ← refleksi (successVision / desiredCreation) bila kosong
  {
    id: "goals.primaryOutcome",
    module: "goals",
    field: "primaryOutcome",
    infer: (bp) => {
      const src = reflectionField(bp, "successVision") ?? reflectionField(bp, "desiredCreation");
      if (!src) return null;
      return {
        value: src.length > 220 ? src.slice(0, 217).trimEnd() + "…" : src,
        confidence: 0.5,
        evidence: "Diturunkan dari refleksi Anda (gambaran berhasil / karya yang diinginkan). Mohon dikonfirmasi.",
      };
    },
  },

  // productTargetUser ← refleksi (beneficiary) bila kosong
  {
    id: "monetization.productTargetUser",
    module: "monetization",
    field: "productTargetUser",
    infer: (bp) => {
      const src = reflectionField(bp, "beneficiary");
      if (!src) return null;
      return {
        value: src.length > 160 ? src.slice(0, 157).trimEnd() + "…" : src,
        confidence: 0.5,
        evidence: "Diturunkan dari refleksi Anda (siapa yang memakai hasil karya). Mohon dikonfirmasi.",
      };
    },
  },

  // domainCharter ← refleksi (visi + nilai + pain point) bila kosong
  {
    id: "policy.domainCharter",
    module: "policy",
    field: "domainCharter",
    infer: (bp) => {
      const vision = reflectionField(bp, "vision");
      const values = reflectionField(bp, "nonNegotiableValues");
      const pain = reflectionField(bp, "painPoint");
      if (!vision && !values && !pain) return null;
      const lines: string[] = [];
      if (vision) lines.push(`Visi: ${vision}`);
      if (pain) lines.push(`Masalah yang ingin diatasi: ${pain}`);
      if (values) lines.push(`Nilai yang wajib dijaga: ${values}`);
      return {
        value: lines.join("\n"),
        confidence: 0.5,
        evidence: "Disusun dari refleksi Anda (visi, masalah, & nilai). Tinjau sebelum dipakai.",
      };
    },
  },

  // systemPrompt ← komposisi dari identitas + tujuan + kebijakan (terakhir)
  {
    id: "aiEngine.systemPrompt",
    module: "aiEngine",
    field: "systemPrompt",
    infer: (bp) => {
      const id = bp.modules.identity.data as Record<string, any>;
      const goals = bp.modules.goals.data as Record<string, any>;
      const policy = bp.modules.policy.data as Record<string, any>;
      if (!id.name && !id.description && !bp.meta.intent) return null;

      const lines: string[] = [];
      lines.push(`Kamu adalah ${id.name ?? "asisten AI"}.`);
      if (id.description) lines.push(id.description);
      else if (bp.meta.intent) lines.push(String(bp.meta.intent));
      if (Array.isArray(id.expertise) && id.expertise.length) {
        lines.push(`Keahlian utama: ${id.expertise.join(", ")}.`);
      }
      if (id.toneOfVoice) lines.push(`Gunakan nada ${id.toneOfVoice}.`);
      if (id.language) lines.push(`Jawab dalam bahasa ${id.language === "en" ? "Inggris" : "Indonesia"}.`);
      if (goals.primaryOutcome) lines.push(`Tujuan utama: ${goals.primaryOutcome}.`);
      if (policy.riskCompliance) lines.push(`Kepatuhan: ${policy.riskCompliance}.`);

      return {
        value: lines.join("\n"),
        confidence: 0.55,
        evidence: "Disusun otomatis dari identitas, tujuan, & kebijakan. Tinjau sebelum dipakai.",
      };
    },
  },
];

/* ===========================================================================
 * Engine
 * ======================================================================== */

export function inferBlueprint(
  blueprint: Blueprint,
  options: InferenceOptions = {},
): InferenceResult {
  const overwriteInferred = options.overwriteInferred ?? true;
  const confirmThreshold = options.confirmThreshold ?? 0.75;
  const minConfidenceToWrite = options.minConfidenceToWrite ?? 0.3;
  const maxPasses = options.maxPasses ?? 2;

  const next = cloneBlueprint(blueprint);
  const trace: InferenceLog[] = [];
  let rulesEvaluated = 0;

  for (let pass = 0; pass < maxPasses; pass++) {
    for (const rule of INFERENCE_RULES) {
      rulesEvaluated++;
      const decision = evaluateRule(next, rule, {
        overwriteInferred,
        confirmThreshold,
        minConfidenceToWrite,
      });
      // Catat trace hanya pada lintasan terakhir agar ringkas & deterministik.
      if (pass === maxPasses - 1) trace.push(decision);
    }
  }

  const inferences = trace.filter((t) => t.action === "written");
  return {
    blueprint: next,
    inferences,
    trace,
    stats: {
      written: inferences.length,
      skipped: trace.length - inferences.length,
      rulesEvaluated,
    },
  };
}

/* ===========================================================================
 * Helper
 * ======================================================================== */

function evaluateRule(
  bp: Blueprint,
  rule: InferenceRule,
  cfg: { overwriteInferred: boolean; confirmThreshold: number; minConfidenceToWrite: number },
): InferenceLog {
  const base: InferenceLog = { ruleId: rule.id, module: rule.module, field: rule.field, action: "no-inference" };

  // meta tidak punya fieldMeta → hanya isi bila kosong, tak pernah "user".
  if (rule.module === "meta") {
    const current = (bp.meta as Record<string, any>)[rule.field];
    if (hasValue(current)) return { ...base, action: "skipped-present" };
    const out = rule.infer(bp);
    if (!out) return base;
    if (out.confidence < cfg.minConfidenceToWrite) {
      return { ...base, action: "skipped-low-confidence", confidence: out.confidence };
    }
    (bp.meta as Record<string, any>)[rule.field] = out.value;
    return { ...base, action: "written", value: out.value, confidence: out.confidence, evidence: out.evidence };
  }

  const mod = bp.modules[rule.module];
  const data = mod.data as Record<string, any>;
  const meta = mod.fieldMeta?.[rule.field];
  const current = data[rule.field];

  // 1) Jangan pernah menimpa nilai manusia.
  if (meta?.source === "user") return { ...base, action: "skipped-user" };

  // 2) Nilai sudah ada:
  if (hasValue(current)) {
    const isInferred = meta?.source === "inferred";
    if (!(isInferred && cfg.overwriteInferred)) {
      return { ...base, action: "skipped-present" };
    }
    // boleh disempurnakan ulang (deterministik → idempoten)
  }

  // 3) Jalankan aturan.
  const out = rule.infer(bp);
  if (!out) return base;
  if (out.confidence < cfg.minConfidenceToWrite) {
    return { ...base, action: "skipped-low-confidence", confidence: out.confidence };
  }

  const needsConfirmation = out.needsConfirmation ?? out.confidence < cfg.confirmThreshold;
  data[rule.field] = out.value;
  mod.fieldMeta = mod.fieldMeta ?? {};
  mod.fieldMeta[rule.field] = {
    confidence: out.confidence,
    source: "inferred",
    evidence: out.evidence,
    needsConfirmation,
  };
  if (mod.status === "empty") mod.status = "inferred";

  return {
    ...base,
    action: "written",
    value: out.value,
    confidence: out.confidence,
    evidence: out.evidence,
    needsConfirmation,
  };
}

function hasValue(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true; // number (termasuk 0) & boolean (termasuk false) dianggap ada
}

function cloneBlueprint(bp: Blueprint): Blueprint {
  return typeof structuredClone === "function"
    ? structuredClone(bp)
    : JSON.parse(JSON.stringify(bp));
}
