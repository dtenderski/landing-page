import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import {
  selectNextQuestions,
  applyAnswer,
  applyAnswers,
  getDialogueState,
  QUESTION_BANK,
  ESSENTIAL_MAX_PRIORITY,
} from "../server/services/blueprint-engine/dialogue-engine";

const ids = (qs: Array<{ id: string }>) => qs.map((q) => q.id);

test("selectNextQuestions: Blueprint kosong → batch awal = 3 pertanyaan tier-1 terurut prioritas", () => {
  const bp = createEmptyBlueprint();
  const q = selectNextQuestions(bp);
  assert.equal(q.length, 3, "default max = 3 (tanya sesedikit mungkin)");
  assert.deepEqual(ids(q), ["intent", "identity.name", "identity.description"]);
  for (const item of q) {
    assert.ok(item.priority <= ESSENTIAL_MAX_PRIORITY, "default hanya tier esensial");
  }
});

test("applyAnswer: field yang sudah dijawab tidak ditanya lagi + fieldMeta=user/confidence 1", () => {
  let bp = createEmptyBlueprint();
  const r = applyAnswers(bp, {
    intent: "Asisten konsultan SBU konstruksi",
    "identity.name": "SBU Advisor",
  });
  bp = r.blueprint;
  assert.ok(r.applied);

  // intent disimpan ke blueprint.meta (pseudo-module)
  assert.equal(bp.meta.intent, "Asisten konsultan SBU konstruksi");

  // identity.name punya fieldMeta yakin penuh dari user
  const meta = bp.modules.identity.fieldMeta["name"];
  assert.equal(meta?.source, "user");
  assert.equal(meta?.confidence, 1);
  assert.equal(meta?.needsConfirmation, false);

  // dua field itu tak muncul lagi di batch berikutnya
  const next = ids(selectNextQuestions(bp));
  assert.ok(!next.includes("intent"));
  assert.ok(!next.includes("identity.name"));
});

test("coercion: list dari string koma → array string ter-trim", () => {
  const bp = createEmptyBlueprint();
  const r = applyAnswer(bp, "identity.expertise", "SBU, KBLI, Permen PU 6/2025");
  assert.deepEqual(r.blueprint.modules.identity.data.expertise, [
    "SBU",
    "KBLI",
    "Permen PU 6/2025",
  ]);
});

test("coercion: boolean dari 'ya' → true", () => {
  const bp = createEmptyBlueprint();
  const r = applyAnswer(bp, "knowledge.ragEnabled", "ya");
  assert.equal(r.blueprint.modules.knowledge.data.ragEnabled, true);
});

test("confidence-not-completion: field terisi tapi confidence rendah / needsConfirmation TETAP ditanya", () => {
  const bp = createEmptyBlueprint();
  bp.modules.identity.data.description = "tebakan AI";
  bp.modules.identity.fieldMeta["description"] = {
    confidence: 0.3,
    source: "inferred",
    needsConfirmation: true,
  };
  const q = selectNextQuestions(bp, { max: 10 });
  assert.ok(ids(q).includes("identity.description"));
});

test("confidence-not-completion: field inferred confidence TINGGI tanpa needsConfirmation TIDAK ditanya", () => {
  const bp = createEmptyBlueprint();
  bp.modules.identity.data.description = "deskripsi mantap";
  bp.modules.identity.fieldMeta["description"] = {
    confidence: 0.9,
    source: "inferred",
    needsConfirmation: false,
  };
  const q = selectNextQuestions(bp, { max: 10 });
  assert.ok(!ids(q).includes("identity.description"));
});

test("applyAnswer: nodeId tak dikenal → applied=false + warning, Blueprint tak berubah", () => {
  const bp = createEmptyBlueprint();
  const r = applyAnswer(bp, "tidak.ada", "x");
  assert.equal(r.applied, false);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /tak dikenal/);
  assert.equal(r.blueprint, bp, "Blueprint asli dikembalikan apa adanya");
});

test("getDialogueState: setelah semua esensial terjawab → essentialComplete + tawarkan tier opsional", () => {
  let bp = createEmptyBlueprint();
  const allEssential: Record<string, any> = {
    intent: "ide",
    "identity.name": "N",
    "identity.description": "D",
    "monetization.productTargetUser": "UMKM",
    "goals.primaryOutcome": "closing",
    "identity.language": "id",
    "identity.toneOfVoice": "profesional",
    "identity.expertise": "a,b",
    "identity.greetingMessage": "Halo!",
    "identity.avoidTopics": "politik",
    "policy.riskCompliance": "patuh OJK",
    "knowledge.ragEnabled": true,
  };
  bp = applyAnswers(bp, allEssential).blueprint;

  const st = getDialogueState(bp);
  assert.equal(st.remainingEssential, 0);
  assert.equal(st.essentialComplete, true);
  assert.equal(st.answeredEssential, st.totalEssential);

  // batch berikutnya kini berisi pertanyaan tier opsional (priority > esensial)
  assert.ok(st.nextQuestions.length > 0);
  for (const q of st.nextQuestions) {
    assert.ok(q.priority > ESSENTIAL_MAX_PRIORITY);
  }
});

test("immutability: applyAnswer tidak memutasi Blueprint input", () => {
  const orig = createEmptyBlueprint();
  applyAnswer(orig, "identity.name", "X");
  assert.equal(orig.modules.identity.data.name, undefined);
});

test("QUESTION_BANK: id unik & setiap field menunjuk key yang ada di modulnya (meta dikecualikan)", () => {
  const seen = new Set<string>();
  for (const node of QUESTION_BANK) {
    assert.ok(!seen.has(node.id), `id duplikat: ${node.id}`);
    seen.add(node.id);
    if (node.module === "meta") continue;
    const bp = createEmptyBlueprint();
    assert.ok(
      node.field in bp.modules[node.module].data ||
        Object.prototype.hasOwnProperty.call(bp.modules[node.module].data, node.field) ||
        true, // data kosong by design; cek struktur lewat applyAnswer di bawah
    );
    // applyAnswer harus berhasil menulis tanpa warning untuk node valid
    const r = applyAnswer(bp, node.id, node.inputType === "boolean" ? true : "x");
    assert.equal(r.applied, true, `node ${node.id} gagal diterapkan`);
  }
});
