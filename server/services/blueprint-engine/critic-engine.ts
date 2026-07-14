/**
 * ============================================================================
 * CRITIC ENGINE — Tahap 9 (bagian 1/3)
 * ============================================================================
 *
 * Menilai MUTU Blueprint secara kualitatif — melampaui sekadar "ada/tidak"
 * (Gap Analysis) atau "seberapa yakin" (Confidence). Critic bertanya:
 * *"Apakah konfigurasi ini akan menghasilkan agen yang BAIK?"*
 *
 * Lima dimensi penilaian (masing-masing 0..1):
 *   - completeness : seberapa lengkap & yakin (dari Confidence Engine).
 *   - readiness    : seberapa siap diterapkan (dari Gap Analysis Engine).
 *   - clarity      : seberapa spesifik identitas/persona/prompt.
 *   - alignment    : keselarasan tujuan ↔ kebijakan ↔ konversi ↔ produk.
 *   - safety       : adanya pagar pengaman (guardrail, off-topic, eskalasi).
 *
 * PRINSIP (sama seperti engine lain — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tanpa efek samping.
 *   - DETERMINISTIK & idempoten. Hanya MEMBACA Blueprint.
 *   - Belum disambung ke route mana pun — aditif.
 * ============================================================================
 */

import { type Blueprint, type BlueprintModuleName } from "@shared/blueprint/blueprint-schema";
import { scoreBlueprint, type ConfidenceReport, type ConfidenceOptions } from "./confidence-engine";
import { analyzeGaps, type GapReport, type GapOptions } from "./gap-analysis-engine";

/* ===========================================================================
 * Tipe
 * ======================================================================== */

export type CritiqueDimension = "completeness" | "readiness" | "clarity" | "alignment" | "safety";
export type FindingKind = "strength" | "warning" | "weakness";
export type CritiqueGrade = "A" | "B" | "C" | "D" | "E";

export interface CritiqueFinding {
  dimension: CritiqueDimension;
  kind: FindingKind;
  message: string;
  recommendation?: string;
}

export interface CritiqueReport {
  dimensions: Record<CritiqueDimension, number>;
  overallScore: number;
  grade: CritiqueGrade;
  findings: CritiqueFinding[];
  summary: string;
}

export interface CriticOptions extends ConfidenceOptions, GapOptions {
  confidenceReport?: ConfidenceReport;
  gapReport?: GapReport;
}

/* ===========================================================================
 * Utilitas
 * ======================================================================== */

function val(bp: Blueprint, module: BlueprintModuleName, field: string): any {
  return (bp.modules[module].data as any)[field];
}

function has(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function strLen(v: any): number {
  return typeof v === "string" ? v.trim().length : 0;
}

const DIMENSION_WEIGHTS: Record<CritiqueDimension, number> = {
  completeness: 0.3,
  readiness: 0.25,
  clarity: 0.15,
  alignment: 0.15,
  safety: 0.15,
};

function gradeOf(score: number): CritiqueGrade {
  if (score >= 0.85) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.55) return "C";
  if (score >= 0.4) return "D";
  return "E";
}

/* ===========================================================================
 * Pemeriksaan heuristik per dimensi
 *
 * Tiap "check" deterministik: { passed, weakness, recommendation, strength? }.
 * Skor dimensi = rasio check yang lolos.
 * ======================================================================== */

interface Check {
  passed: boolean;
  weakness: string;
  recommendation: string;
  strength?: string;
}

function ratio(checks: Check[]): number {
  if (checks.length === 0) return 1;
  return checks.filter((c) => c.passed).length / checks.length;
}

function findingsFrom(dimension: CritiqueDimension, checks: Check[]): CritiqueFinding[] {
  const out: CritiqueFinding[] = [];
  for (const c of checks) {
    if (c.passed) {
      if (c.strength) out.push({ dimension, kind: "strength", message: c.strength });
    } else {
      out.push({ dimension, kind: "weakness", message: c.weakness, recommendation: c.recommendation });
    }
  }
  return out;
}

function clarityChecks(bp: Blueprint): Check[] {
  return [
    {
      passed: strLen(val(bp, "identity", "description")) >= 40,
      strength: "Deskripsi identitas cukup spesifik.",
      weakness: "Deskripsi identitas terlalu pendek/umum.",
      recommendation: "Perjelas deskripsi identitas (≥ ~40 karakter) — siapa agen ini & untuk siapa.",
    },
    {
      passed: has(val(bp, "identity", "toneOfVoice")) || has(val(bp, "identity", "communicationStyle")),
      strength: "Gaya/nada komunikasi sudah ditetapkan.",
      weakness: "Nada/gaya komunikasi belum ditetapkan.",
      recommendation: "Tetapkan toneOfVoice atau communicationStyle agar persona konsisten.",
    },
    {
      passed: strLen(val(bp, "aiEngine", "systemPrompt")) >= 120,
      strength: "System prompt cukup kaya.",
      weakness: "System prompt terlalu tipis untuk memandu perilaku agen.",
      recommendation: "Perkaya systemPrompt (≥ ~120 karakter) dengan peran, batasan, dan gaya.",
    },
  ];
}

function alignmentChecks(bp: Blueprint): Check[] {
  const hasGoal = has(val(bp, "goals", "primaryOutcome"));
  const conversionOn = val(bp, "conversion", "conversionEnabled") === true;
  const hasProduct = has(val(bp, "monetization", "productSummary"));
  const hasPolicy = has(val(bp, "policy", "domainCharter")) || has(val(bp, "policy", "riskCompliance"));
  return [
    {
      passed: !conversionOn || hasGoal,
      strength: "Konversi selaras dengan tujuan yang jelas.",
      weakness: "Konversi diaktifkan tapi tujuan utama (primaryOutcome) belum jelas.",
      recommendation: "Tetapkan goals.primaryOutcome agar alur konversi punya arah.",
    },
    {
      passed: !hasProduct || hasGoal,
      strength: "Produk selaras dengan tujuan agen.",
      weakness: "Ada definisi produk tapi tujuan utama agen belum jelas.",
      recommendation: "Selaraskan goals.primaryOutcome dengan produk yang ditawarkan.",
    },
    {
      passed: !hasGoal || hasPolicy,
      strength: "Tujuan didampingi kebijakan/pagar pengaman.",
      weakness: "Agen punya tujuan tapi belum ada kebijakan (charter/risk) sebagai pagar.",
      recommendation: "Isi policy.domainCharter atau policy.riskCompliance agar tujuan dikejar secara aman.",
    },
  ];
}

function safetyChecks(bp: Blueprint): Check[] {
  return [
    {
      passed: has(val(bp, "policy", "riskCompliance")),
      strength: "Kebijakan risiko/kepatuhan tersedia.",
      weakness: "Belum ada kebijakan risiko/kepatuhan (riskCompliance).",
      recommendation: "Isi policy.riskCompliance — batas hukum/etika yang harus dipatuhi agen.",
    },
    {
      passed:
        has(val(bp, "identity", "offTopicHandling")) ||
        has(val(bp, "identity", "offTopicResponse")) ||
        has(val(bp, "identity", "offTopicBehavior")) ||
        has(val(bp, "identity", "avoidTopics")),
      strength: "Penanganan pertanyaan di luar topik sudah diatur.",
      weakness: "Belum ada aturan untuk pertanyaan di luar topik.",
      recommendation: "Tetapkan offTopicHandling/avoidTopics agar agen tak keluar jalur.",
    },
    {
      passed:
        has(val(bp, "agentic", "escalationRules")) ||
        has(val(bp, "agentic", "actionBoundary")) ||
        has(val(bp, "policy", "interactionPolicy")),
      strength: "Ada aturan eskalasi/batas tindakan.",
      weakness: "Belum ada aturan eskalasi atau batas tindakan.",
      recommendation: "Tambahkan agentic.escalationRules atau policy.interactionPolicy untuk kasus sulit.",
    },
  ];
}

/* ===========================================================================
 * Engine
 * ======================================================================== */

export function critiqueBlueprint(blueprint: Blueprint, options: CriticOptions = {}): CritiqueReport {
  const confidence = options.confidenceReport ?? scoreBlueprint(blueprint, options);
  const gap = options.gapReport ?? analyzeGaps(blueprint, { ...options, report: confidence });

  const clarity = clarityChecks(blueprint);
  const alignment = alignmentChecks(blueprint);
  const safety = safetyChecks(blueprint);

  const dimensions: Record<CritiqueDimension, number> = {
    completeness: round2(confidence.overallConfidence),
    readiness: round2(Math.max(0, 1 - gap.blockingCount * 0.2)),
    clarity: round2(ratio(clarity)),
    alignment: round2(ratio(alignment)),
    safety: round2(ratio(safety)),
  };

  const overallScore = round2(
    (Object.keys(dimensions) as CritiqueDimension[]).reduce(
      (sum, d) => sum + dimensions[d] * DIMENSION_WEIGHTS[d],
      0,
    ),
  );

  const findings: CritiqueFinding[] = [
    ...findingsFrom("clarity", clarity),
    ...findingsFrom("alignment", alignment),
    ...findingsFrom("safety", safety),
  ];

  if (dimensions.completeness < 0.5) {
    findings.push({
      dimension: "completeness",
      kind: "warning",
      message: "Tingkat keyakinan keseluruhan masih rendah.",
      recommendation: "Lengkapi & konfirmasi field esensial (lihat Gap Analysis).",
    });
  }
  if (gap.blockingCount > 0) {
    findings.push({
      dimension: "readiness",
      kind: "weakness",
      message: `Ada ${gap.blockingCount} masalah pemblokir sebelum siap diterapkan.`,
      recommendation: gap.nextActions[0] ?? "Selesaikan gap critical/high pada modul inti.",
    });
  }

  const grade = gradeOf(overallScore);
  const summary = buildSummary(grade, overallScore, dimensions);

  return { dimensions, overallScore, grade, findings, summary };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildSummary(grade: CritiqueGrade, score: number, dims: Record<CritiqueDimension, number>): string {
  const weakest = (Object.keys(dims) as CritiqueDimension[]).reduce((a, b) => (dims[a] <= dims[b] ? a : b));
  return `Nilai mutu Blueprint: ${grade} (${score}). Dimensi terlemah: ${weakest} (${dims[weakest]}).`;
}
