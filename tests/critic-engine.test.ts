import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import { MODULE_SPECS } from "../server/services/blueprint-engine/confidence-engine";
import { critiqueBlueprint } from "../server/services/blueprint-engine/critic-engine";

function setUser(bp: any, mod: string, field: string, value: any, confidence = 1) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "user", confidence, needsConfirmation: false };
}
function fillCore(bp: any) {
  for (const m of ["identity", "aiEngine", "goals", "policy"]) {
    for (const f of MODULE_SPECS[m].requiredFields) {
      setUser(bp, m, f, f === "language" ? "id" : "x");
    }
  }
}

test("Blueprint kosong → grade E, skor rendah, banyak weakness", () => {
  const bp = createEmptyBlueprint();
  const r = critiqueBlueprint(bp);
  assert.equal(r.grade, "E");
  assert.ok(r.overallScore < 0.4);
  assert.ok(r.findings.some((f) => f.kind === "weakness"));
});

test("dimensi selalu lengkap & dalam rentang 0..1", () => {
  const bp = createEmptyBlueprint();
  const r = critiqueBlueprint(bp);
  for (const d of ["completeness", "readiness", "clarity", "alignment", "safety"] as const) {
    assert.ok(d in r.dimensions, `dimensi ${d} hilang`);
    assert.ok(r.dimensions[d] >= 0 && r.dimensions[d] <= 1);
  }
});

test("clarity: deskripsi spesifik + tone + systemPrompt kaya → clarity 1", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "description", "Asisten hukum untuk UMKM yang menjawab pertanyaan kontrak sederhana.");
  setUser(bp, "identity", "toneOfVoice", "ramah-profesional");
  setUser(bp, "aiEngine", "systemPrompt", "x".repeat(150));
  const r = critiqueBlueprint(bp);
  assert.equal(r.dimensions.clarity, 1);
  assert.ok(r.findings.some((f) => f.dimension === "clarity" && f.kind === "strength"));
});

test("alignment: conversion menyala tanpa goal → ada weakness alignment", () => {
  const bp = createEmptyBlueprint();
  (bp.modules.conversion.data as any).conversionEnabled = true;
  const r = critiqueBlueprint(bp);
  assert.ok(r.findings.some((f) => f.dimension === "alignment" && f.kind === "weakness"));
  assert.ok(r.dimensions.alignment < 1);
});

test("safety: risk + offTopic + escalation terisi → safety 1", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "policy", "riskCompliance", "patuh UU PDP");
  setUser(bp, "identity", "offTopicHandling", "tolak sopan");
  setUser(bp, "agentic", "escalationRules", ["serahkan ke manusia bila marah"]);
  const r = critiqueBlueprint(bp);
  assert.equal(r.dimensions.safety, 1);
});

test("readiness turun mengikuti jumlah gap pemblokir", () => {
  const empty = critiqueBlueprint(createEmptyBlueprint());
  const full = createEmptyBlueprint();
  fillCore(full);
  const r = critiqueBlueprint(full);
  assert.ok(r.dimensions.readiness > empty.dimensions.readiness);
});

test("Blueprint inti lengkap & aman → grade lebih baik dari kosong", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  setUser(bp, "identity", "description", "Asisten hukum UMKM untuk pertanyaan kontrak dan kepatuhan dasar.");
  setUser(bp, "identity", "toneOfVoice", "ramah");
  setUser(bp, "aiEngine", "systemPrompt", "x".repeat(150));
  setUser(bp, "identity", "offTopicHandling", "tolak sopan");
  setUser(bp, "agentic", "escalationRules", ["eskalasi"]);
  const r = critiqueBlueprint(bp);
  const order = { E: 0, D: 1, C: 2, B: 3, A: 4 };
  assert.ok(order[r.grade] >= order["C"], `grade ${r.grade} harus ≥ C`);
});

test("summary menyebut grade & dimensi terlemah", () => {
  const r = critiqueBlueprint(createEmptyBlueprint());
  assert.match(r.summary, /Nilai mutu Blueprint: E/);
  assert.match(r.summary, /terlemah/);
});

test("MURNI: critiqueBlueprint tidak memutasi input", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  const snapshot = structuredClone(bp);
  critiqueBlueprint(bp);
  assert.deepEqual(bp, snapshot);
});

test("DETERMINISTIK/idempoten: dua panggilan identik", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.conversion.data as any).conversionEnabled = true;
  assert.deepEqual(critiqueBlueprint(bp), critiqueBlueprint(bp));
});
