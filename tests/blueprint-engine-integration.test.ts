import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import {
  MODULE_SPECS,
  scoreBlueprint,
  analyzeGaps,
  critiqueBlueprint,
  simulateBlueprint,
  analyzeEvolution,
} from "../server/services/blueprint-engine";

function setUser(bp: any, mod: string, field: string, value: any) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "user", confidence: 1, needsConfirmation: false };
}
function fillCore(bp: any) {
  for (const m of ["identity", "aiEngine", "goals", "policy"]) {
    for (const f of MODULE_SPECS[m].requiredFields) {
      setUser(bp, m, f, f === "language" ? "id" : "x");
    }
  }
}

function realisticBlueprint() {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  setUser(bp, "identity", "description", "Asisten hukum UMKM untuk pertanyaan kontrak & kepatuhan dasar.");
  setUser(bp, "identity", "toneOfVoice", "ramah-profesional");
  setUser(bp, "identity", "greetingMessage", "Halo! Saya asisten hukum UMKM.");
  setUser(bp, "identity", "offTopicHandling", "tolak dengan sopan & arahkan kembali");
  setUser(bp, "aiEngine", "systemPrompt", "x".repeat(160));
  setUser(bp, "agentic", "escalationRules", ["serahkan ke advokat bila perlu"]);
  setUser(bp, "monetization", "productSummary", "Paket konsultasi hukum bulanan");
  setUser(bp, "monetization", "monthlyPrice", 199000);
  (bp.modules.conversion.data as any).conversionEnabled = true;
  setUser(bp, "conversion", "conversionGoal", "tangkap lead konsultasi");
  setUser(bp, "conversion", "whatsappCta", "https://wa.me/628xxx");
  (bp.modules.knowledge.data as any).ragEnabled = true;
  setUser(bp, "knowledge", "sources", [{ type: "text", content: "UU Cipta Kerja ..." }]);
  return bp;
}

test("kontrak komposisi: Confidence → Gap → Critic konsisten satu sama lain", () => {
  const bp = realisticBlueprint();
  const conf = scoreBlueprint(bp);
  const gap = analyzeGaps(bp, { report: conf });
  const critique = critiqueBlueprint(bp, { confidenceReport: conf, gapReport: gap });

  // completeness Critic = overallConfidence (dibulatkan 2 desimal)
  assert.equal(critique.dimensions.completeness, Math.round(conf.overallConfidence * 100) / 100);
  // readiness Critic mengikuti blockingCount Gap
  assert.equal(critique.dimensions.readiness, Math.round(Math.max(0, 1 - gap.blockingCount * 0.2) * 100) / 100);
});

test("kontrak: precomputed report = compute internal (Gap & Critic)", () => {
  const bp = realisticBlueprint();
  const conf = scoreBlueprint(bp);
  assert.deepEqual(analyzeGaps(bp, { report: conf }), analyzeGaps(bp));
  assert.deepEqual(
    critiqueBlueprint(bp, { confidenceReport: conf, gapReport: analyzeGaps(bp, { report: conf }) }),
    critiqueBlueprint(bp),
  );
});

test("Blueprint realistis: grade layak, cakupan simulasi tinggi, siap diterapkan", () => {
  const bp = realisticBlueprint();
  const gap = analyzeGaps(bp);
  const critique = critiqueBlueprint(bp);
  const sim = simulateBlueprint(bp);

  assert.equal(gap.readyToApply, true);
  const order = { E: 0, D: 1, C: 2, B: 3, A: 4 };
  assert.ok(order[critique.grade] >= order["B"], `grade ${critique.grade} ≥ B`);
  assert.ok(sim.coverage >= 0.8, `cakupan ${sim.coverage} ≥ 0.8`);
});

test("Evolution: kosong → realistis = improving, modul inti membaik", () => {
  const evo = analyzeEvolution([createEmptyBlueprint(), realisticBlueprint()]);
  assert.equal(evo.trend, "improving");
  assert.ok(evo.improved.includes("identity"));
  assert.ok(evo.improved.includes("aiEngine"));
  assert.ok(evo.overallConfidenceTo > evo.overallConfidenceFrom);
});

test("seluruh pipeline murni: tak satu pun engine memutasi Blueprint", () => {
  const bp = realisticBlueprint();
  const snapshot = structuredClone(bp);
  scoreBlueprint(bp);
  analyzeGaps(bp);
  critiqueBlueprint(bp);
  simulateBlueprint(bp);
  analyzeEvolution([createEmptyBlueprint(), bp]);
  assert.deepEqual(bp, snapshot);
});
