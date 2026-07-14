/**
 * ============================================================================
 * GAP ANALYSIS ENGINE — Tahap 8
 * ============================================================================
 *
 * Mengubah skor keyakinan (Tahap 7) menjadi daftar TEMUAN (gap) berprioritas
 * dengan REKOMENDASI konkret, plus deteksi INKONSISTENSI antar-field yang tak
 * terlihat dari skor saja (kontradiksi konfigurasi).
 *
 * Empat jenis gap:
 *   - missing       : field esensial masih kosong.
 *   - weak          : field esensial terisi tapi keyakinan rendah.
 *   - unconfirmed   : nilai hasil tebakan menunggu konfirmasi user.
 *   - inconsistent  : dua/lebih field saling bertentangan (mis. RAG menyala
 *                     tapi belum ada sumber).
 *
 * Hubungan antar-tahap:
 *   - HULU: memakai `scoreBlueprint()` (Tahap 7) untuk missing/weak/unconfirmed.
 *   - HILIR: `nextActions` & daftar gap jadi bahan dialog lanjutan (Tahap 5)
 *     dan Critic (Tahap 9).
 *
 * PRINSIP (sama seperti engine sebelumnya — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tidak ada efek samping.
 *   - DETERMINISTIK & idempoten. Hanya MEMBACA Blueprint (tak mengubah input).
 *   - Belum dipanggil dari route mana pun — masih aditif.
 * ============================================================================
 */

import { type Blueprint, type BlueprintModuleName } from "@shared/blueprint/blueprint-schema";
import {
  scoreBlueprint,
  type ConfidenceReport,
  type ConfidenceOptions,
} from "./confidence-engine";

/* ===========================================================================
 * Tipe
 * ======================================================================== */

export type GapType = "missing" | "weak" | "unconfirmed" | "inconsistent";
export type GapSeverity = "critical" | "high" | "medium" | "low";

export interface Gap {
  /** id stabil, mis. "missing:identity.name" atau "inconsistent:rag-without-sources". */
  id: string;
  type: GapType;
  severity: GapSeverity;
  module: BlueprintModuleName;
  /** field tunggal (missing/weak/unconfirmed). */
  field?: string;
  /** field yang terlibat (inconsistent). */
  fields?: string[];
  /** Deskripsi masalah (Bahasa Indonesia). */
  message: string;
  /** Langkah konkret untuk menutup gap. */
  recommendation: string;
  /** confidence terkait (weak/unconfirmed). */
  confidence?: number;
}

export interface GapReport {
  gaps: Gap[];
  byType: Record<GapType, number>;
  bySeverity: Record<GapSeverity, number>;
  /** true bila tak ada gap yang memblokir penerapan (lihat isBlocking). */
  readyToApply: boolean;
  /** Rekomendasi langkah berikutnya (gap teratas), maksimal `maxNextActions`. */
  nextActions: string[];
  /** Diteruskan dari Confidence Engine untuk konteks. */
  overallConfidence: number;
  /** Jumlah gap yang memblokir penerapan. */
  blockingCount: number;
}

export interface GapOptions extends ConfidenceOptions {
  /** Laporan keyakinan yang sudah dihitung (agar tak menghitung ulang). */
  report?: ConfidenceReport;
  /** Jumlah maksimum nextActions (default 5). */
  maxNextActions?: number;
}

/* ===========================================================================
 * Modul inti & utilitas keparahan
 * ======================================================================== */

const CORE_MODULES: BlueprintModuleName[] = ["identity", "aiEngine", "goals", "policy"];

const SEVERITY_RANK: Record<GapSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const TYPE_RANK: Record<GapType, number> = { inconsistent: 0, missing: 1, weak: 2, unconfirmed: 3 };

function isCore(module: BlueprintModuleName): boolean {
  return CORE_MODULES.includes(module);
}

/** Gap yang menghalangi penerapan: semua critical, atau high di modul inti. */
function isBlocking(gap: Gap): boolean {
  return gap.severity === "critical" || (gap.severity === "high" && isCore(gap.module));
}

function hasValue(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/* ===========================================================================
 * Aturan inkonsistensi antar-field (deterministik)
 * ======================================================================== */

interface ConsistencyRule {
  id: string;
  module: BlueprintModuleName;
  check: (bp: Blueprint) => Omit<Gap, "id" | "type" | "severity" | "module"> | null;
  severity: GapSeverity;
}

export const CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    id: "rag-without-sources",
    module: "knowledge",
    severity: "high",
    check: (bp) => {
      const k = bp.modules.knowledge.data as any;
      if (k.ragEnabled === true && !hasValue(k.sources)) {
        return {
          fields: ["ragEnabled", "sources"],
          message: "RAG (basis pengetahuan) dinyalakan tapi belum ada sumber pengetahuan.",
          recommendation: "Tambahkan minimal satu sumber (file/URL/teks) atau matikan ragEnabled.",
        };
      }
      return null;
    },
  },
  {
    id: "orchestrator-without-subagents",
    module: "orchestration",
    severity: "high",
    check: (bp) => {
      const o = bp.modules.orchestration.data as any;
      if (o.isOrchestrator === true && !hasValue(o.agenticSubAgents)) {
        return {
          fields: ["isOrchestrator", "agenticSubAgents"],
          message: "Agen ditandai sebagai orchestrator tapi belum punya sub-agen.",
          recommendation: "Tambahkan daftar agenticSubAgents (role + agentId/agentSlug) atau matikan isOrchestrator.",
        };
      }
      return null;
    },
  },
  {
    id: "conversion-enabled-without-goal",
    module: "conversion",
    severity: "medium",
    check: (bp) => {
      const c = bp.modules.conversion.data as any;
      if (c.conversionEnabled === true && !hasValue(c.conversionGoal)) {
        return {
          fields: ["conversionEnabled", "conversionGoal"],
          message: "Konversi diaktifkan tapi tujuan konversi (conversionGoal) belum diisi.",
          recommendation: "Tetapkan conversionGoal (mis. tangkap lead / jual produk) agar CTA terarah.",
        };
      }
      return null;
    },
  },
  {
    id: "scoring-enabled-without-rubric",
    module: "conversion",
    severity: "medium",
    check: (bp) => {
      const c = bp.modules.conversion.data as any;
      if (c.scoringEnabled === true && !hasValue(c.scoringRubric)) {
        return {
          fields: ["scoringEnabled", "scoringRubric"],
          message: "Lead scoring diaktifkan tapi rubrik penilaian (scoringRubric) kosong.",
          recommendation: "Isi scoringRubric atau matikan scoringEnabled.",
        };
      }
      return null;
    },
  },
  {
    id: "landing-enabled-without-headline",
    module: "landingPage",
    severity: "medium",
    check: (bp) => {
      const l = bp.modules.landingPage.data as any;
      if (l.landingPageEnabled === true && !hasValue(l.landingHeroHeadline)) {
        return {
          fields: ["landingPageEnabled", "landingHeroHeadline"],
          message: "Landing page diaktifkan tapi headline hero belum diisi.",
          recommendation: "Tulis landingHeroHeadline yang jelas atau matikan landingPageEnabled.",
        };
      }
      return null;
    },
  },
  {
    id: "trial-enabled-without-days",
    module: "monetization",
    severity: "medium",
    check: (bp) => {
      const m = bp.modules.monetization.data as any;
      if (m.trialEnabled === true && !(typeof m.trialDays === "number" && m.trialDays > 0)) {
        return {
          fields: ["trialEnabled", "trialDays"],
          message: "Masa coba (trial) diaktifkan tapi durasinya (trialDays) belum diisi/0.",
          recommendation: "Tetapkan trialDays > 0 atau matikan trialEnabled.",
        };
      }
      return null;
    },
  },
  {
    id: "temperature-out-of-range",
    module: "aiEngine",
    severity: "high",
    check: (bp) => {
      const a = bp.modules.aiEngine.data as any;
      if (typeof a.temperature === "number" && (a.temperature < 0 || a.temperature > 2)) {
        return {
          fields: ["temperature"],
          message: `Temperature (${a.temperature}) di luar rentang wajar 0–2.`,
          recommendation: "Setel temperature antara 0 (deterministik) dan 2 (sangat kreatif).",
        };
      }
      return null;
    },
  },
  {
    id: "public-but-inactive",
    module: "access",
    severity: "medium",
    check: (bp) => {
      const a = bp.modules.access.data as any;
      if (a.isPublic === true && a.isActive === false) {
        return {
          fields: ["isPublic", "isActive"],
          message: "Agen ditandai publik tapi statusnya non-aktif (isActive=false).",
          recommendation: "Aktifkan isActive agar agen publik benar-benar bisa diakses, atau jadikan privat.",
        };
      }
      return null;
    },
  },
];

/* ===========================================================================
 * Engine
 * ======================================================================== */

export function analyzeGaps(blueprint: Blueprint, options: GapOptions = {}): GapReport {
  const maxNextActions = Math.max(0, Math.trunc(options.maxNextActions ?? 5));
  const report = options.report ?? scoreBlueprint(blueprint, options);

  const gaps: Gap[] = [];

  // 1) missing — field esensial kosong
  for (const { module, field } of report.missingRequired) {
    gaps.push({
      id: `missing:${module}.${field}`,
      type: "missing",
      severity: isCore(module) ? "critical" : "high",
      module,
      field,
      message: `Field esensial "${field}" pada modul ${module} masih kosong.`,
      recommendation: `Isi "${field}" — ini wajib agar ${module} berfungsi baik.`,
    });
  }

  // 2) weak — field esensial terisi tapi keyakinan rendah
  for (const { module, field, confidence } of report.weakestFields) {
    gaps.push({
      id: `weak:${module}.${field}`,
      type: "weak",
      severity: isCore(module) ? "high" : "medium",
      module,
      field,
      confidence,
      message: `Field "${field}" (${module}) terisi tapi keyakinannya rendah (${confidence}).`,
      recommendation: `Tinjau & perkuat "${field}" — pertajam atau konfirmasi nilainya.`,
    });
  }

  // 3) unconfirmed — tebakan menunggu konfirmasi
  for (const { module, field } of report.awaitingConfirmation) {
    const conf = report.modules[module].fields.find((f) => f.field === field)?.confidence;
    gaps.push({
      id: `unconfirmed:${module}.${field}`,
      type: "unconfirmed",
      severity: "low",
      module,
      field,
      confidence: conf,
      message: `Nilai "${field}" (${module}) adalah tebakan AI yang belum dikonfirmasi.`,
      recommendation: `Konfirmasi atau koreksi "${field}".`,
    });
  }

  // 4) inconsistent — kontradiksi antar-field
  for (const rule of CONSISTENCY_RULES) {
    const hit = rule.check(blueprint);
    if (hit) {
      gaps.push({
        id: `inconsistent:${rule.id}`,
        type: "inconsistent",
        severity: rule.severity,
        module: rule.module,
        ...hit,
      });
    }
  }

  // Urutkan: keparahan → jenis → id (stabil & deterministik)
  gaps.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      TYPE_RANK[a.type] - TYPE_RANK[b.type] ||
      a.id.localeCompare(b.id),
  );

  const byType: Record<GapType, number> = { missing: 0, weak: 0, unconfirmed: 0, inconsistent: 0 };
  const bySeverity: Record<GapSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  let blockingCount = 0;
  for (const g of gaps) {
    byType[g.type]++;
    bySeverity[g.severity]++;
    if (isBlocking(g)) blockingCount++;
  }

  const nextActions = gaps.slice(0, maxNextActions).map((g) => g.recommendation);

  return {
    gaps,
    byType,
    bySeverity,
    readyToApply: blockingCount === 0,
    nextActions,
    overallConfidence: report.overallConfidence,
    blockingCount,
  };
}
