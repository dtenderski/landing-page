/**
 * ============================================================================
 * EVOLUTION ENGINE — Tahap 9 (bagian 3/3)
 * ============================================================================
 *
 * "Living Blueprint": menganalisis RIWAYAT beberapa snapshot Blueprint
 * (kronologis, terbaru di akhir) untuk melihat ARAH perkembangan — apakah
 * makin yakin/lengkap, modul mana yang naik/turun, lalu menyarankan langkah
 * evolusi berikutnya.
 *
 * Riwayat diberikan sebagai INPUT (array) — engine tetap murni, tak menyimpan
 * apa pun sendiri.
 *
 * PRINSIP (sama seperti engine lain — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tanpa efek samping.
 *   - DETERMINISTIK & idempoten. Hanya MEMBACA snapshot.
 *   - Belum disambung ke route mana pun — aditif.
 * ============================================================================
 */

import { type Blueprint, type BlueprintModuleName } from "@shared/blueprint/blueprint-schema";
import { scoreBlueprint, type ConfidenceOptions } from "./confidence-engine";
import { analyzeGaps } from "./gap-analysis-engine";

/* ===========================================================================
 * Tipe
 * ======================================================================== */

export type EvolutionTrend = "improving" | "declining" | "stable" | "insufficient-data";
export type ModuleDirection = "up" | "down" | "stable";

export interface ModuleDelta {
  module: BlueprintModuleName;
  from: number;
  to: number;
  delta: number;
  direction: ModuleDirection;
}

export interface EvolutionReport {
  snapshots: number;
  trend: EvolutionTrend;
  overallConfidenceFrom: number;
  overallConfidenceTo: number;
  overallConfidenceDelta: number;
  perModule: ModuleDelta[];
  improved: BlueprintModuleName[];
  regressed: BlueprintModuleName[];
  suggestions: string[];
}

export interface EvolutionOptions extends ConfidenceOptions {
  /** Ambang perubahan agar dianggap naik/turun (default 0.02). */
  changeThreshold?: number;
  /** Jumlah maksimum saran (default 5). */
  maxSuggestions?: number;
}

/* ===========================================================================
 * Engine
 * ======================================================================== */

export function analyzeEvolution(history: Blueprint[], options: EvolutionOptions = {}): EvolutionReport {
  const changeThreshold = options.changeThreshold ?? 0.02;
  const maxSuggestions = Math.max(0, Math.trunc(options.maxSuggestions ?? 5));

  if (history.length < 2) {
    const only = history.length === 1 ? scoreBlueprint(history[0], options) : null;
    const suggestions = only
      ? analyzeGaps(history[0], { ...options, report: only }).nextActions.slice(0, maxSuggestions)
      : [];
    return {
      snapshots: history.length,
      trend: "insufficient-data",
      overallConfidenceFrom: only?.overallConfidence ?? 0,
      overallConfidenceTo: only?.overallConfidence ?? 0,
      overallConfidenceDelta: 0,
      perModule: [],
      improved: [],
      regressed: [],
      suggestions,
    };
  }

  const first = scoreBlueprint(history[0], options);
  const lastBp = history[history.length - 1];
  const last = scoreBlueprint(lastBp, options);

  const overallConfidenceFrom = first.overallConfidence;
  const overallConfidenceTo = last.overallConfidence;
  const overallConfidenceDelta = round2(overallConfidenceTo - overallConfidenceFrom);

  const moduleNames = Object.keys(last.modules) as BlueprintModuleName[];
  const perModule: ModuleDelta[] = [];
  const improved: BlueprintModuleName[] = [];
  const regressed: BlueprintModuleName[] = [];

  for (const m of moduleNames) {
    const fromC = first.modules[m]?.confidence ?? 0;
    const toC = last.modules[m]?.confidence ?? 0;
    const delta = round2(toC - fromC);
    let direction: ModuleDirection = "stable";
    if (delta > changeThreshold) {
      direction = "up";
      improved.push(m);
    } else if (delta < -changeThreshold) {
      direction = "down";
      regressed.push(m);
    }
    perModule.push({ module: m, from: round2(fromC), to: round2(toC), delta, direction });
  }

  let trend: EvolutionTrend = "stable";
  if (overallConfidenceDelta > changeThreshold) trend = "improving";
  else if (overallConfidenceDelta < -changeThreshold) trend = "declining";

  // Saran: prioritaskan regresi, lalu gap teratas Blueprint terbaru.
  const suggestions: string[] = [];
  for (const m of regressed) {
    suggestions.push(`Modul "${m}" menurun keyakinannya — tinjau perubahan terakhir & konfirmasi ulang.`);
  }
  const gapActions = analyzeGaps(lastBp, { ...options, report: last }).nextActions;
  for (const a of gapActions) {
    if (suggestions.length >= maxSuggestions) break;
    suggestions.push(a);
  }

  return {
    snapshots: history.length,
    trend,
    overallConfidenceFrom: round2(overallConfidenceFrom),
    overallConfidenceTo: round2(overallConfidenceTo),
    overallConfidenceDelta,
    perModule,
    improved,
    regressed,
    suggestions: suggestions.slice(0, maxSuggestions),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
