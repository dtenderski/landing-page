import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import {
  scoreBlueprint,
  applyConfidence,
  MODULE_SPECS,
} from "../server/services/blueprint-engine/confidence-engine";

function setUser(bp: any, mod: string, field: string, value: any, confidence = 1) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "user", confidence, needsConfirmation: false };
}
function setInferred(bp: any, mod: string, field: string, value: any, confidence: number, needsConfirmation = true) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "inferred", confidence, needsConfirmation };
}

test("Blueprint kosong → overallConfidence 0, semua modul inti 'empty'", () => {
  const bp = createEmptyBlueprint();
  const r = scoreBlueprint(bp);
  assert.equal(r.overallConfidence, 0);
  assert.equal(r.coreReady, false);
  assert.equal(r.modules.identity.status, "empty");
  assert.equal(r.modules.aiEngine.status, "empty");
});

test("Confidence ≠ Completion: modul terisi penuh oleh tebakan ragu → completion tinggi, confidence rendah", () => {
  const bp = createEmptyBlueprint();
  // isi semua field esensial identity sebagai tebakan low-confidence
  for (const f of MODULE_SPECS.identity.requiredFields) {
    setInferred(bp, "identity", f, f === "language" ? "id" : "tebakan", 0.4, true);
  }
  const r = scoreBlueprint(bp);
  const m = r.modules.identity;
  assert.equal(m.counts.missingRequired, 0, "semua esensial terisi");
  assert.ok(m.completion > 0.1);
  assert.ok(m.confidence <= 0.45, `confidence harus rendah, dapat ${m.confidence}`);
  assert.equal(m.status, "inferred");
});

test("field user → confidence 1; modul inti penuh oleh user → status confirmed", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "Lex");
  setUser(bp, "identity", "description", "asisten hukum");
  setUser(bp, "identity", "toneOfVoice", "profesional");
  setUser(bp, "identity", "language", "id");
  const r = scoreBlueprint(bp);
  assert.equal(r.modules.identity.confidence, 1);
  assert.equal(r.modules.identity.status, "confirmed");
});

test("field esensial kosong → status partial + masuk daftar missingRequired", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "Lex");
  // description, toneOfVoice, language kosong
  const r = scoreBlueprint(bp);
  assert.equal(r.modules.identity.status, "partial");
  const missing = r.missingRequired.filter((m) => m.module === "identity").map((m) => m.field);
  assert.ok(missing.includes("description"));
  assert.ok(missing.includes("toneOfVoice"));
  assert.ok(missing.includes("language"));
});

test("baselineUntracked: nilai terisi tanpa fieldMeta → confidence = 0.5 default", () => {
  const bp = createEmptyBlueprint();
  bp.modules.goals.data.primaryOutcome = "closing"; // tanpa fieldMeta
  const r = scoreBlueprint(bp);
  assert.equal(r.modules.goals.fields.find((f) => f.field === "primaryOutcome")?.confidence, 0.5);
  assert.equal(r.modules.goals.confidence, 0.5);
});

test("modul opsional tanpa data → applicable=false, dikeluarkan dari overall", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "X");
  const r = scoreBlueprint(bp);
  assert.equal(r.modules.marketing.applicable, false);
  assert.equal(r.modules.landingPage.applicable, false);
  // overall hanya dipengaruhi modul inti + opsional yang terisi
  assert.ok(r.overallConfidence > 0);
});

test("modul opsional dengan data → applicable=true & ikut dihitung", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "marketing", "metaPixelId", "12345");
  const r = scoreBlueprint(bp);
  assert.equal(r.modules.marketing.applicable, true);
});

test("awaitingConfirmation: field inferred needsConfirmation masuk daftar", () => {
  const bp = createEmptyBlueprint();
  setInferred(bp, "identity", "description", "tebakan", 0.5, true);
  const r = scoreBlueprint(bp);
  assert.ok(r.awaitingConfirmation.some((a) => a.module === "identity" && a.field === "description"));
});

test("weakestFields: terurut dari confidence terendah, hanya field esensial yang lemah", () => {
  const bp = createEmptyBlueprint();
  setInferred(bp, "identity", "name", "n", 0.5, true);
  setInferred(bp, "identity", "description", "d", 0.3, true);
  setUser(bp, "identity", "toneOfVoice", "profesional");
  setUser(bp, "identity", "language", "id");
  const r = scoreBlueprint(bp);
  const ids = r.weakestFields.filter((w) => w.module === "identity").map((w) => w.field);
  assert.deepEqual(ids.slice(0, 2), ["description", "name"], "urut termenah dulu");
});

test("coreReady true hanya bila SEMUA modul inti confirmed", () => {
  const bp = createEmptyBlueprint();
  const fill = (mod: string, fields: string[]) =>
    fields.forEach((f) => setUser(bp, mod, f, f === "language" ? "id" : "x"));
  fill("identity", MODULE_SPECS.identity.requiredFields);
  fill("aiEngine", MODULE_SPECS.aiEngine.requiredFields);
  fill("goals", MODULE_SPECS.goals.requiredFields);
  // policy belum diisi → coreReady harus false
  let r = scoreBlueprint(bp);
  assert.equal(r.coreReady, false);
  fill("policy", MODULE_SPECS.policy.requiredFields);
  r = scoreBlueprint(bp);
  assert.equal(r.coreReady, true);
});

test("applyConfidence: menulis skor ke salinan, input tidak dimutasi", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "X");
  const { blueprint, report } = applyConfidence(bp);
  assert.equal(blueprint.overallConfidence, report.overallConfidence);
  assert.equal(blueprint.modules.identity.confidence, report.modules.identity.confidence);
  // input asli tak berubah
  assert.equal(bp.overallConfidence, 0);
  assert.equal(bp.modules.identity.confidence, 0);
});

test("idempoten: scoreBlueprint dua kali identik; applyConfidence dua kali identik", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "X");
  setInferred(bp, "goals", "primaryOutcome", "closing", 0.5, true);
  assert.deepEqual(scoreBlueprint(bp), scoreBlueprint(bp));
  const once = applyConfidence(bp).blueprint;
  const twice = applyConfidence(once).blueprint;
  assert.deepEqual(twice, once);
});

test("scoreBlueprint TIDAK memutasi input (deep-compare sebelum/sesudah)", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "X");
  setInferred(bp, "goals", "primaryOutcome", "closing", 0.5, true);
  const snapshot = structuredClone(bp);
  scoreBlueprint(bp);
  assert.deepEqual(bp, snapshot);
});

test("options.weights: override bobot modul mengubah overallConfidence", () => {
  const bp = createEmptyBlueprint();
  // identity sempurna (conf 1), policy lemah (conf 0.2)
  for (const f of MODULE_SPECS.identity.requiredFields) setUser(bp, "identity", f, f === "language" ? "id" : "x");
  for (const f of MODULE_SPECS.policy.requiredFields) setInferred(bp, "policy", f, "x", 0.2, true);
  const def = scoreBlueprint(bp).overallConfidence;
  // beri policy bobot besar → overall turun mendekati 0.2
  const heavyPolicy = scoreBlueprint(bp, { weights: { policy: 100 } }).overallConfidence;
  assert.ok(heavyPolicy < def, `bobot policy besar harus menurunkan overall (${heavyPolicy} < ${def})`);
});

test("options.confirmedThreshold: ambang lebih rendah → modul jadi 'confirmed'", () => {
  const bp = createEmptyBlueprint();
  // semua esensial identity inferred conf 0.7 tanpa needsConfirmation
  for (const f of MODULE_SPECS.identity.requiredFields) {
    setInferred(bp, "identity", f, f === "language" ? "id" : "x", 0.7, false);
  }
  assert.equal(scoreBlueprint(bp).modules.identity.status, "inferred"); // default 0.85 → belum
  assert.equal(scoreBlueprint(bp, { confirmedThreshold: 0.65 }).modules.identity.status, "confirmed");
});

test("options.baselineUntracked: override mengubah confidence field tanpa meta", () => {
  const bp = createEmptyBlueprint();
  bp.modules.goals.data.primaryOutcome = "closing"; // tanpa meta
  assert.equal(scoreBlueprint(bp, { baselineUntracked: 0.9 }).modules.goals.confidence, 0.9);
});

test("clamping: fieldMeta.confidence di luar 0..1 dijepit", () => {
  const bp = createEmptyBlueprint();
  bp.modules.goals.data.primaryOutcome = "closing";
  bp.modules.goals.fieldMeta["primaryOutcome"] = { source: "inferred", confidence: 5, needsConfirmation: false };
  assert.equal(scoreBlueprint(bp).modules.goals.fields.find((f) => f.field === "primaryOutcome")?.confidence, 1);
});
