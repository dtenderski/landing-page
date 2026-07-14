import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import { MODULE_SPECS } from "../server/services/blueprint-engine/confidence-engine";
import { simulateBlueprint } from "../server/services/blueprint-engine/simulation-engine";

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

test("Blueprint kosong → skenario dasar ada tapi semua unready", () => {
  const bp = createEmptyBlueprint();
  const r = simulateBlueprint(bp);
  const ids = r.scenarios.map((s) => s.id);
  assert.deepEqual(ids.sort(), ["core-question", "escalation", "greeting", "off-topic"]);
  assert.equal(r.unreadyCount, r.scenarios.length);
  assert.equal(r.coverage, 0);
});

test("skenario bersyarat muncul hanya saat fitur dipakai", () => {
  const bp = createEmptyBlueprint();
  (bp.modules.knowledge.data as any).ragEnabled = true;
  setUser(bp, "monetization", "productSummary", "Produk X");
  (bp.modules.conversion.data as any).conversionEnabled = true;
  const r = simulateBlueprint(bp);
  const ids = r.scenarios.map((s) => s.id);
  assert.ok(ids.includes("factual-domain"));
  assert.ok(ids.includes("pricing"));
  assert.ok(ids.includes("purchase-intent"));
});

test("mode 'any': cukup satu field → ready", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "Lex");
  const r = simulateBlueprint(bp);
  const greeting = r.scenarios.find((s) => s.id === "greeting")!;
  assert.equal(greeting.status, "ready");
  assert.equal(greeting.readiness, 1);
});

test("mode 'all': satu dari dua field → partial", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "aiEngine", "systemPrompt", "x");
  const r = simulateBlueprint(bp);
  const core = r.scenarios.find((s) => s.id === "core-question")!;
  assert.equal(core.status, "partial");
  assert.equal(core.readiness, 0.5);
  assert.ok(core.missing.some((c) => c.field === "primaryOutcome"));
});

test("mode 'all': kedua field ada → ready", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "aiEngine", "systemPrompt", "x");
  setUser(bp, "goals", "primaryOutcome", "closing");
  const r = simulateBlueprint(bp);
  const core = r.scenarios.find((s) => s.id === "core-question")!;
  assert.equal(core.status, "ready");
});

test("coverage = rata-rata readiness; hitung ready/partial/unready konsisten", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  setUser(bp, "identity", "name", "Lex");
  const r = simulateBlueprint(bp);
  const avg = r.scenarios.reduce((s, x) => s + x.readiness, 0) / r.scenarios.length;
  assert.equal(r.coverage, Math.round(avg * 100) / 100);
  assert.equal(r.readyCount + r.partialCount + r.unreadyCount, r.scenarios.length);
});

test("satisfied + missing = requires untuk tiap skenario", () => {
  const bp = createEmptyBlueprint();
  setUser(bp, "identity", "name", "Lex");
  const r = simulateBlueprint(bp);
  for (const s of r.scenarios) {
    assert.equal(s.satisfied.length + s.missing.length, s.requires.length);
  }
});

test("summary menyebut jumlah skenario & cakupan", () => {
  const r = simulateBlueprint(createEmptyBlueprint());
  assert.match(r.summary, /Simulasi \d+ skenario/);
  assert.match(r.summary, /Cakupan/);
});

test("MURNI: simulateBlueprint tidak memutasi input", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  (bp.modules.knowledge.data as any).ragEnabled = true;
  const snapshot = structuredClone(bp);
  simulateBlueprint(bp);
  assert.deepEqual(bp, snapshot);
});

test("DETERMINISTIK/idempoten: dua panggilan identik", () => {
  const bp = createEmptyBlueprint();
  fillCore(bp);
  setUser(bp, "monetization", "productSummary", "Produk X");
  assert.deepEqual(simulateBlueprint(bp), simulateBlueprint(bp));
});
