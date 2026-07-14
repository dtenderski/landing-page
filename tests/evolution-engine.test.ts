import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import { MODULE_SPECS } from "../server/services/blueprint-engine/confidence-engine";
import { analyzeEvolution } from "../server/services/blueprint-engine/evolution-engine";

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

test("riwayat < 2 snapshot → trend insufficient-data", () => {
  const r0 = analyzeEvolution([]);
  assert.equal(r0.trend, "insufficient-data");
  assert.equal(r0.snapshots, 0);

  const r1 = analyzeEvolution([createEmptyBlueprint()]);
  assert.equal(r1.trend, "insufficient-data");
  assert.equal(r1.snapshots, 1);
  assert.deepEqual(r1.perModule, []);
});

test("riwayat 1 snapshot tetap memberi saran dari gap", () => {
  const r = analyzeEvolution([createEmptyBlueprint()]);
  assert.ok(Array.isArray(r.suggestions));
});

test("Blueprint membaik dari kosong → trend improving, delta positif", () => {
  const empty = createEmptyBlueprint();
  const better = createEmptyBlueprint();
  fillCore(better);
  const r = analyzeEvolution([empty, better]);
  assert.equal(r.trend, "improving");
  assert.ok(r.overallConfidenceDelta > 0);
  assert.ok(r.overallConfidenceTo > r.overallConfidenceFrom);
  assert.ok(r.improved.includes("identity"));
});

test("Blueprint memburuk → trend declining, modul tercatat regressed", () => {
  const good = createEmptyBlueprint();
  fillCore(good);
  const worse = structuredClone(good);
  // hapus seluruh isi identity
  worse.modules.identity.data = {} as any;
  worse.modules.identity.fieldMeta = {} as any;
  const r = analyzeEvolution([good, worse]);
  assert.equal(r.trend, "declining");
  assert.ok(r.overallConfidenceDelta < 0);
  assert.ok(r.regressed.includes("identity"));
  assert.ok(r.suggestions.some((s) => s.includes("identity")));
});

test("tanpa perubahan berarti → trend stable", () => {
  const a = createEmptyBlueprint();
  fillCore(a);
  const b = structuredClone(a);
  const r = analyzeEvolution([a, b]);
  assert.equal(r.trend, "stable");
  assert.equal(r.overallConfidenceDelta, 0);
});

test("perModule lengkap untuk semua modul & direction konsisten dengan delta", () => {
  const a = createEmptyBlueprint();
  const b = createEmptyBlueprint();
  fillCore(b);
  const r = analyzeEvolution([a, b]);
  assert.equal(r.perModule.length, Object.keys(b.modules).length);
  for (const m of r.perModule) {
    if (m.delta > 0.02) assert.equal(m.direction, "up");
    else if (m.delta < -0.02) assert.equal(m.direction, "down");
    else assert.equal(m.direction, "stable");
  }
});

test("memakai snapshot pertama & terakhir (mengabaikan tengah untuk arah keseluruhan)", () => {
  const empty = createEmptyBlueprint();
  const mid = createEmptyBlueprint();
  setUser(mid, "identity", "name", "X");
  const full = createEmptyBlueprint();
  fillCore(full);
  const r = analyzeEvolution([empty, mid, full]);
  assert.equal(r.snapshots, 3);
  assert.equal(r.overallConfidenceFrom, 0);
  assert.ok(r.overallConfidenceTo > 0);
});

test("maxSuggestions membatasi jumlah saran", () => {
  const good = createEmptyBlueprint();
  fillCore(good);
  const worse = structuredClone(good);
  worse.modules.identity.data = {} as any;
  worse.modules.identity.fieldMeta = {} as any;
  const r = analyzeEvolution([good, worse], { maxSuggestions: 1 });
  assert.ok(r.suggestions.length <= 1);
});

test("MURNI: analyzeEvolution tidak memutasi snapshot", () => {
  const a = createEmptyBlueprint();
  const b = createEmptyBlueprint();
  fillCore(b);
  const snapA = structuredClone(a);
  const snapB = structuredClone(b);
  analyzeEvolution([a, b]);
  assert.deepEqual(a, snapA);
  assert.deepEqual(b, snapB);
});

test("DETERMINISTIK/idempoten: dua panggilan identik", () => {
  const a = createEmptyBlueprint();
  const b = createEmptyBlueprint();
  fillCore(b);
  assert.deepEqual(analyzeEvolution([a, b]), analyzeEvolution([a, b]));
});
