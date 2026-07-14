import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import { MODULE_SPECS, scoreBlueprint } from "../server/services/blueprint-engine/confidence-engine";
import { analyzeGaps, CONSISTENCY_RULES } from "../server/services/blueprint-engine/gap-analysis-engine";

function setUser(bp: any, mod: string, field: string, value: any, confidence = 1) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "user", confidence, needsConfirmation: false };
}
function setInferred(bp: any, mod: string, field: string, value: any, confidence: number, needsConfirmation = true) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "inferred", confidence, needsConfirmation };
}
function fillCore(bp: any) {
  for (const m of ["identity", "aiEngine", "goals", "policy"]) {
    for (const f of MODULE_SPECS[m].requiredFields) {
      setUser(bp, m, f, f === "language" ? "id" : "x");
    }
  }
}

test("Blueprint kosong → modul inti memunculkan gap 'missing' berseverity critical", () => {
  const bp = createEmptyBlueprint();
  const r = analyzeGaps(bp);
  const coreMissing = r.gaps.filter((g) => g.type === "missing" && g.severity === "critical");
  assert.ok(coreMissing.length > 0, "harus ada gap missing critical di modul inti");
  assert.ok(coreMissing.every((g) => ["identity", "aiEngine", "goals", "policy"].includes(g.module)));
  assert.equal(r.readyToApply, false);
  assert.ok(r.blockingCount > 0);
});

test("missing di modul non-inti → severity 'high', bukan 'critical'", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  // isi sebagian knowledge agar 'applicable' & field esensialnya dianggap kurang
  const kSpec = MODULE_SPECS.knowledge;
  if (kSpec && kSpec.requiredFields.length > 0) {
    // sengaja kosongkan satu esensial dengan mengisi field lain
    setUser(bp, "knowledge", kSpec.requiredFields[kSpec.requiredFields.length - 1], "x");
    const r = analyzeGaps(bp);
    const km = r.gaps.filter((g) => g.module === "knowledge" && g.type === "missing");
    assert.ok(km.every((g) => g.severity === "high"));
  }
});

test("field user lengkap di inti → tidak ada gap missing/weak inti; readyToApply true", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  const r = analyzeGaps(bp);
  const coreProblems = r.gaps.filter(
    (g) => ["identity", "aiEngine", "goals", "policy"].includes(g.module) && (g.type === "missing" || g.type === "weak"),
  );
  assert.equal(coreProblems.length, 0);
  assert.equal(r.readyToApply, true);
  assert.equal(r.blockingCount, 0);
});

test("tebakan low-confidence di inti → gap 'weak' severity 'high'", () => {
  const bp = createEmptyBlueprint();
  for (const m of ["identity", "aiEngine", "goals", "policy"]) {
    for (const f of MODULE_SPECS[m].requiredFields) {
      setInferred(bp, m, f, f === "language" ? "id" : "tebakan", 0.3, false);
    }
  }
  const r = analyzeGaps(bp);
  const weakCore = r.gaps.filter((g) => g.type === "weak" && g.severity === "high");
  assert.ok(weakCore.length > 0, "harus ada gap weak high");
});

test("tebakan needsConfirmation → gap 'unconfirmed' severity 'low'", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  setInferred(bp, "goals", "primaryOutcome", "closing", 0.9, true);
  const r = analyzeGaps(bp);
  const unconf = r.gaps.filter((g) => g.type === "unconfirmed");
  assert.ok(unconf.some((g) => g.field === "primaryOutcome"));
  assert.ok(unconf.every((g) => g.severity === "low"));
});

test("inkonsistensi: RAG menyala tanpa sumber → gap inconsistent high", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.knowledge.data as any).ragEnabled = true;
  const r = analyzeGaps(bp);
  const g = r.gaps.find((x) => x.id === "inconsistent:rag-without-sources");
  assert.ok(g, "harus terdeteksi rag-without-sources");
  assert.equal(g!.type, "inconsistent");
  assert.equal(g!.severity, "high");
  assert.deepEqual(g!.fields, ["ragEnabled", "sources"]);
});

test("inkonsistensi: RAG menyala DAN ada sumber → tidak ada gap", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.knowledge.data as any).ragEnabled = true;
  (bp.modules.knowledge.data as any).sources = [{ type: "text", value: "x" }];
  const r = analyzeGaps(bp);
  assert.equal(r.gaps.find((x) => x.id === "inconsistent:rag-without-sources"), undefined);
});

test("inkonsistensi: orchestrator tanpa sub-agen", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.orchestration.data as any).isOrchestrator = true;
  const r = analyzeGaps(bp);
  assert.ok(r.gaps.some((g) => g.id === "inconsistent:orchestrator-without-subagents"));
});

test("inkonsistensi: temperature di luar rentang 0–2 → high", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.aiEngine.data as any).temperature = 5;
  const r = analyzeGaps(bp);
  const g = r.gaps.find((x) => x.id === "inconsistent:temperature-out-of-range");
  assert.ok(g);
  assert.equal(g!.severity, "high");
  // aiEngine adalah inti → high di inti memblokir
  assert.ok(r.blockingCount >= 1);
});

test("inkonsistensi: trial menyala tanpa trialDays; publik tapi non-aktif", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.monetization.data as any).trialEnabled = true;
  (bp.modules.access.data as any).isPublic = true;
  (bp.modules.access.data as any).isActive = false;
  const r = analyzeGaps(bp);
  assert.ok(r.gaps.some((g) => g.id === "inconsistent:trial-enabled-without-days"));
  assert.ok(r.gaps.some((g) => g.id === "inconsistent:public-but-inactive"));
});

test("urutan gap: critical sebelum high sebelum medium sebelum low", () => {
  const bp = createEmptyBlueprint();
  // biarkan inti kosong (critical) + tambah inkonsistensi medium + unconfirmed low
  (bp.modules.conversion.data as any).conversionEnabled = true;
  setInferred(bp, "policy", MODULE_SPECS.policy.requiredFields[0], "x", 0.9, true);
  const r = analyzeGaps(bp);
  const ranks = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  for (let i = 1; i < r.gaps.length; i++) {
    assert.ok(
      ranks[r.gaps[i - 1].severity] <= ranks[r.gaps[i].severity],
      `gap tidak terurut di indeks ${i}: ${r.gaps[i - 1].severity} > ${r.gaps[i].severity}`,
    );
  }
});

test("nextActions: maksimal maxNextActions & berasal dari gap teratas", () => {
  const bp = createEmptyBlueprint();
  const r = analyzeGaps(bp, { maxNextActions: 3 });
  assert.ok(r.nextActions.length <= 3);
  if (r.gaps.length > 0) assert.equal(r.nextActions[0], r.gaps[0].recommendation);
});

test("byType & bySeverity konsisten dengan total gaps", () => {
  const bp = createEmptyBlueprint();
  (bp.modules.knowledge.data as any).ragEnabled = true;
  const r = analyzeGaps(bp);
  const sumType = Object.values(r.byType).reduce((a, b) => a + b, 0);
  const sumSev = Object.values(r.bySeverity).reduce((a, b) => a + b, 0);
  assert.equal(sumType, r.gaps.length);
  assert.equal(sumSev, r.gaps.length);
});

test("MURNI: analyzeGaps tidak memutasi input (deep-compare)", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.knowledge.data as any).ragEnabled = true;
  const snapshot = structuredClone(bp);
  analyzeGaps(bp);
  assert.deepEqual(bp, snapshot);
});

test("DETERMINISTIK/idempoten: dua panggilan identik", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.aiEngine.data as any).temperature = 9;
  setInferred(bp, "goals", "primaryOutcome", "closing", 0.4, true);
  assert.deepEqual(analyzeGaps(bp), analyzeGaps(bp));
});

test("options.report: memakai laporan precomputed menghasilkan output sama dgn internal", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  setInferred(bp, "goals", "primaryOutcome", "closing", 0.4, true);
  const report = scoreBlueprint(bp);
  assert.deepEqual(analyzeGaps(bp, { report }), analyzeGaps(bp));
});

test("setiap CONSISTENCY_RULES punya id unik", () => {
  const ids = CONSISTENCY_RULES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("tie-break sort: dalam severity sama, urutan jenis inconsistent<missing<weak<unconfirmed", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  // bikin dua gap medium: inconsistent (conversion-without-goal) + weak non-inti
  (bp.modules.conversion.data as any).conversionEnabled = true;
  // weak non-inti: knowledge field esensial low-confidence
  const kf = MODULE_SPECS.knowledge?.requiredFields?.[0];
  if (kf) setInferred(bp, "knowledge", kf, "x", 0.2, false);
  const r = analyzeGaps(bp);
  const medium = r.gaps.filter((g) => g.severity === "medium");
  const typeOrder = { inconsistent: 0, missing: 1, weak: 2, unconfirmed: 3 } as const;
  for (let i = 1; i < medium.length; i++) {
    const prev = typeOrder[medium[i - 1].type];
    const cur = typeOrder[medium[i].type];
    assert.ok(prev < cur || (prev === cur && medium[i - 1].id.localeCompare(medium[i].id) <= 0));
  }
});

test("table-driven: setiap aturan inkonsistensi terdeteksi saat dipicu", () => {
  const triggers: Record<string, (bp: any) => void> = {
    "rag-without-sources": (bp) => (bp.modules.knowledge.data.ragEnabled = true),
    "orchestrator-without-subagents": (bp) => (bp.modules.orchestration.data.isOrchestrator = true),
    "conversion-enabled-without-goal": (bp) => (bp.modules.conversion.data.conversionEnabled = true),
    "scoring-enabled-without-rubric": (bp) => (bp.modules.conversion.data.scoringEnabled = true),
    "landing-enabled-without-headline": (bp) => (bp.modules.landingPage.data.landingPageEnabled = true),
    "trial-enabled-without-days": (bp) => (bp.modules.monetization.data.trialEnabled = true),
    "temperature-out-of-range": (bp) => (bp.modules.aiEngine.data.temperature = 9),
    "public-but-inactive": (bp) => {
      bp.modules.access.data.isPublic = true;
      bp.modules.access.data.isActive = false;
    },
  };
  for (const rule of CONSISTENCY_RULES) {
    const bp = createEmptyBlueprint();
    const trig = triggers[rule.id];
    assert.ok(trig, `tidak ada trigger uji untuk aturan ${rule.id}`);
    trig(bp);
    const r = analyzeGaps(bp);
    assert.ok(
      r.gaps.some((g) => g.id === `inconsistent:${rule.id}`),
      `aturan ${rule.id} tidak terdeteksi saat dipicu`,
    );
  }
});

test("maxNextActions negatif/non-integer dijepit ke >=0 (tak ada slice(0,-n))", () => {
  const bp = createEmptyBlueprint();
  assert.equal(analyzeGaps(bp, { maxNextActions: -3 }).nextActions.length, 0);
  assert.ok(analyzeGaps(bp, { maxNextActions: 2.9 }).nextActions.length <= 2);
});
