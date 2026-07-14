/**
 * ============================================================================
 * CONFIDENCE ENGINE — Tahap 7
 * ============================================================================
 *
 * Menghitung SKOR KEYAKINAN (bukan sekadar "% selesai") per field, per modul,
 * dan untuk seluruh Blueprint. Mewujudkan prinsip inti roadmap:
 * **"Confidence, bukan Completion"**.
 *
 * Bedanya dengan completion:
 *   - completion  = berapa banyak field TERISI (metrik lama yang menyesatkan).
 *   - confidence  = seberapa YAKIN nilai yang ada itu benar (tertimbang asal &
 *                   meta keyakinan tiap field).
 * Sebuah modul bisa 100% terisi tapi confidence rendah (semua hasil tebakan
 * yang belum dikonfirmasi), atau sebaliknya.
 *
 * Hubungan antar-tahap:
 *   - HULU: memakai `fieldMeta` yang ditulis Inference Engine (Tahap 6) &
 *     Dialogue Engine (Tahap 5).
 *   - HILIR: skor & daftar "titik lemah" jadi bahan Gap Analysis (Tahap 8) dan
 *     Critic (Tahap 9).
 *
 * PRINSIP (sama seperti engine sebelumnya — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tidak ada efek samping.
 *   - DETERMINISTIK & idempoten.
 *   - `scoreBlueprint()` hanya MEMBACA (tak mengubah input).
 *   - `applyConfidence()` mengembalikan SALINAN baru dengan angka skor tertanam.
 *   - Belum dipanggil dari route mana pun — masih aditif.
 * ============================================================================
 */

import {
  type Blueprint,
  type BlueprintModuleName,
  type ModuleStatus,
  BLUEPRINT_MODULE_NAMES,
  MODULE_DATA_SCHEMAS,
} from "@shared/blueprint/blueprint-schema";

/* ===========================================================================
 * Konfigurasi bobot & field esensial per modul
 *
 * `weight`        = kontribusi modul ke confidence keseluruhan.
 * `requiredFields`= field esensial; jika kosong → menyeret skor modul turun.
 * `optional`      = bila true & modul TANPA data → modul dianggap "tak berlaku"
 *                   dan dikeluarkan dari rata-rata keseluruhan (tak menghukum
 *                   user yang memang belum butuh modul itu, mis. marketing).
 * ======================================================================== */

export interface ModuleSpec {
  weight: number;
  requiredFields: string[];
  optional: boolean;
}

export const MODULE_SPECS: Record<BlueprintModuleName, ModuleSpec> = {
  // Inti — selalu dihitung
  identity: { weight: 3, requiredFields: ["name", "description", "toneOfVoice", "language"], optional: false },
  aiEngine: { weight: 3, requiredFields: ["systemPrompt", "aiModel"], optional: false },
  goals: { weight: 2, requiredFields: ["primaryOutcome"], optional: false },
  policy: { weight: 2, requiredFields: ["riskCompliance", "domainCharter"], optional: false },
  // Pendukung — dihitung bila ada data
  knowledge: { weight: 1, requiredFields: ["ragEnabled"], optional: true },
  agentic: { weight: 1, requiredFields: [], optional: true },
  access: { weight: 1, requiredFields: [], optional: true },
  orchestration: { weight: 1, requiredFields: [], optional: true },
  monetization: { weight: 1, requiredFields: ["productTargetUser", "productSummary"], optional: true },
  conversion: { weight: 1, requiredFields: [], optional: true },
  widget: { weight: 0.5, requiredFields: [], optional: true },
  // Opsional murni
  openClaw: { weight: 0.5, requiredFields: [], optional: true },
  deliverables: { weight: 0.5, requiredFields: [], optional: true },
  projectBrain: { weight: 0.5, requiredFields: [], optional: true },
  miniApps: { weight: 0.5, requiredFields: [], optional: true },
  landingPage: { weight: 0.5, requiredFields: [], optional: true },
  marketing: { weight: 0.5, requiredFields: [], optional: true },
  integration: { weight: 0.5, requiredFields: [], optional: true },
  // Refleksi — "peta pemahaman" user. Bukan modul inti agen, jadi optional
  // (skip tanpa hukuman), tapi berbobot tinggi & tanpa requiredFields sehingga
  // begitu user mengisi, ia dinilai dari rata-rata field terisi (semua source=user
  // → confidence 1.0) dan mengangkat keyakinan keseluruhan.
  reflection: { weight: 2, requiredFields: [], optional: true },
};

/* ===========================================================================
 * Tipe laporan
 * ======================================================================== */

export interface FieldScore {
  field: string;
  /** confidence efektif 0..1 */
  confidence: number;
  filled: boolean;
  source: "user" | "inferred" | "default" | "unknown" | "none";
  needsConfirmation: boolean;
  required: boolean;
}

export interface ModuleScore {
  module: BlueprintModuleName;
  /** confidence agregat 0..1 (rata-rata field esensial, atau field terisi). */
  confidence: number;
  /** completion lama: field terisi / total field skema. */
  completion: number;
  status: ModuleStatus;
  /** apakah modul dihitung ke skor keseluruhan. */
  applicable: boolean;
  weight: number;
  counts: { total: number; filled: number; needsConfirmation: number; missingRequired: number };
  fields: FieldScore[];
}

export interface ConfidenceReport {
  overallConfidence: number;
  /** completion keseluruhan (field terisi / total) — untuk kontras. */
  overallCompletion: number;
  /** true bila semua modul inti sudah "confirmed". */
  coreReady: boolean;
  modules: Record<BlueprintModuleName, ModuleScore>;
  /** Field penting yang masih lemah (confidence < lowConfidenceThreshold). */
  weakestFields: Array<{ module: BlueprintModuleName; field: string; confidence: number }>;
  /** Field esensial yang masih kosong. */
  missingRequired: Array<{ module: BlueprintModuleName; field: string }>;
  /** Field yang menunggu konfirmasi user. */
  awaitingConfirmation: Array<{ module: BlueprintModuleName; field: string }>;
}

export interface ConfidenceOptions {
  /** confidence ≥ ini & tanpa needsConfirmation → modul "confirmed" (default 0.85). */
  confirmedThreshold?: number;
  /** confidence modul inti ≥ ini → dianggap siap (default 0.7). */
  readyThreshold?: number;
  /** Nilai untuk field terisi yang asalnya tak diketahui/tanpa meta (default 0.5). */
  baselineUntracked?: number;
  /** Ambang "field lemah" untuk daftar weakestFields (default 0.6). */
  lowConfidenceThreshold?: number;
  /** Override bobot per modul. */
  weights?: Partial<Record<BlueprintModuleName, number>>;
}

/* ===========================================================================
 * Helper nilai/keyakinan field
 * ======================================================================== */

function hasValue(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true; // number (termasuk 0) & boolean (termasuk false) dianggap ada
}

function fieldConfidence(
  filled: boolean,
  meta: { source?: string; confidence?: number } | undefined,
  baselineUntracked: number,
): number {
  if (!filled) return 0;
  if (meta?.source === "user") return 1;
  if (meta && typeof meta.confidence === "number") return clamp01(meta.confidence);
  return baselineUntracked; // ada nilai tapi tanpa meta
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

const CORE_MODULES: BlueprintModuleName[] = ["identity", "aiEngine", "goals", "policy"];

/* ===========================================================================
 * Skoring (MURNI — tidak mengubah input)
 * ======================================================================== */

export function scoreBlueprint(
  blueprint: Blueprint,
  options: ConfidenceOptions = {},
): ConfidenceReport {
  const confirmedThreshold = options.confirmedThreshold ?? 0.85;
  const readyThreshold = options.readyThreshold ?? 0.7;
  const baselineUntracked = options.baselineUntracked ?? 0.5;
  const lowConfidenceThreshold = options.lowConfidenceThreshold ?? 0.6;

  const modules = {} as Record<BlueprintModuleName, ModuleScore>;
  const weakestFields: ConfidenceReport["weakestFields"] = [];
  const missingRequired: ConfidenceReport["missingRequired"] = [];
  const awaitingConfirmation: ConfidenceReport["awaitingConfirmation"] = [];

  let weightedSum = 0;
  let weightTotal = 0;
  let globalFilled = 0;
  let globalTotal = 0;

  for (const name of BLUEPRINT_MODULE_NAMES) {
    const spec = MODULE_SPECS[name];
    const weight = options.weights?.[name] ?? spec.weight;
    const mod = blueprint.modules[name];
    const data = (mod.data ?? {}) as Record<string, any>;
    const fieldMeta = mod.fieldMeta ?? {};
    const allFields = Object.keys(MODULE_DATA_SCHEMAS[name].shape);

    const fields: FieldScore[] = [];
    let filledCount = 0;
    let needsConfirmationCount = 0;
    let missingRequiredCount = 0;

    for (const field of allFields) {
      const filled = hasValue(data[field]);
      const meta = fieldMeta[field] as { source?: string; confidence?: number; needsConfirmation?: boolean } | undefined;
      const conf = fieldConfidence(filled, meta, baselineUntracked);
      const required = spec.requiredFields.includes(field);
      const needsConfirm = filled && meta?.needsConfirmation === true;

      if (filled) filledCount++;
      if (needsConfirm) needsConfirmationCount++;
      if (required && !filled) missingRequiredCount++;

      const fs: FieldScore = {
        field,
        confidence: conf,
        filled,
        source: (meta?.source as FieldScore["source"]) ?? (filled ? "unknown" : "none"),
        needsConfirmation: needsConfirm,
        required,
      };
      fields.push(fs);

      if (required && !filled) missingRequired.push({ module: name, field });
      if (needsConfirm) awaitingConfirmation.push({ module: name, field });
      if (required && filled && conf < lowConfidenceThreshold) {
        weakestFields.push({ module: name, field, confidence: conf });
      }
    }

    // confidence agregat modul
    const moduleConfidence = computeModuleConfidence(spec, fields, baselineUntracked);
    const completion = allFields.length === 0 ? 0 : filledCount / allFields.length;
    const applicable = !spec.optional || filledCount > 0;

    const status = deriveStatus({
      spec,
      filledCount,
      missingRequiredCount,
      needsConfirmationCount,
      moduleConfidence,
      confirmedThreshold,
    });

    modules[name] = {
      module: name,
      confidence: round3(moduleConfidence),
      completion: round3(completion),
      status,
      applicable,
      weight,
      counts: {
        total: allFields.length,
        filled: filledCount,
        needsConfirmation: needsConfirmationCount,
        missingRequired: missingRequiredCount,
      },
      fields,
    };

    globalFilled += filledCount;
    globalTotal += allFields.length;
    if (applicable && weight > 0) {
      weightedSum += moduleConfidence * weight;
      weightTotal += weight;
    }
  }

  const overallConfidence = weightTotal === 0 ? 0 : weightedSum / weightTotal;
  const coreReady = CORE_MODULES.every(
    (m) => modules[m].confidence >= readyThreshold && modules[m].status === "confirmed",
  );

  weakestFields.sort((a, b) => a.confidence - b.confidence);

  return {
    overallConfidence: round3(overallConfidence),
    overallCompletion: round3(globalTotal === 0 ? 0 : globalFilled / globalTotal),
    coreReady,
    modules,
    weakestFields,
    missingRequired,
    awaitingConfirmation,
  };
}

/* ===========================================================================
 * Tulis skor ke SALINAN Blueprint (untuk persistensi nanti)
 * ======================================================================== */

export function applyConfidence(
  blueprint: Blueprint,
  options: ConfidenceOptions = {},
): { blueprint: Blueprint; report: ConfidenceReport } {
  const report = scoreBlueprint(blueprint, options);
  const next = cloneBlueprint(blueprint);
  for (const name of BLUEPRINT_MODULE_NAMES) {
    next.modules[name].confidence = report.modules[name].confidence;
    next.modules[name].status = report.modules[name].status;
  }
  next.overallConfidence = report.overallConfidence;
  return { blueprint: next, report };
}

/* ===========================================================================
 * Helper internal
 * ======================================================================== */

function computeModuleConfidence(
  spec: ModuleSpec,
  fields: FieldScore[],
  baselineUntracked: number,
): number {
  // Modul dengan field esensial: rata-rata atas field esensial (kosong = 0).
  if (spec.requiredFields.length > 0) {
    const req = fields.filter((f) => f.required);
    const sum = req.reduce((s, f) => s + f.confidence, 0);
    return req.length === 0 ? 0 : sum / req.length;
  }
  // Modul tanpa field esensial: rata-rata atas field yang TERISI saja.
  const filled = fields.filter((f) => f.filled);
  if (filled.length === 0) return 0;
  return filled.reduce((s, f) => s + f.confidence, 0) / filled.length;
}

function deriveStatus(args: {
  spec: ModuleSpec;
  filledCount: number;
  missingRequiredCount: number;
  needsConfirmationCount: number;
  moduleConfidence: number;
  confirmedThreshold: number;
}): ModuleStatus {
  const { filledCount, missingRequiredCount, needsConfirmationCount, moduleConfidence, confirmedThreshold } = args;
  if (filledCount === 0) return "empty";
  if (missingRequiredCount > 0) return "partial";
  // semua esensial terisi:
  if (needsConfirmationCount === 0 && moduleConfidence >= confirmedThreshold) return "confirmed";
  if (needsConfirmationCount > 0 || moduleConfidence < confirmedThreshold) return "inferred";
  return "partial";
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function cloneBlueprint(bp: Blueprint): Blueprint {
  return typeof structuredClone === "function"
    ? structuredClone(bp)
    : JSON.parse(JSON.stringify(bp));
}
