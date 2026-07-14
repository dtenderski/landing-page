import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import { inferBlueprint } from "../server/services/blueprint-engine/inference-engine";

/**
 * Regresi keamanan: aturan enrichment refleksi (goals.primaryOutcome,
 * monetization.productTargetUser, policy.domainCharter) menurunkan nilai dari
 * field refleksi pada keyakinan rendah (0.5, needsConfirmation). Aturan ini
 * TIDAK BOLEH PERNAH menimpa field yang dijawab langsung oleh user
 * (source="user"). Bila field target kosong, nilai turunan refleksi BOLEH
 * diterapkan dengan confidence 0.5 + needsConfirmation.
 */

function seedReflection(bp: ReturnType<typeof createEmptyBlueprint>) {
  bp.modules.reflection.data.successVision = "Klien bisa closing tanpa bantuan manual saya";
  bp.modules.reflection.data.desiredCreation = "Asisten yang menyusun proposal otomatis";
  bp.modules.reflection.data.beneficiary = "Tim sales UMKM konstruksi";
  bp.modules.reflection.data.vision = "Setiap UMKM punya asisten AI andal";
  bp.modules.reflection.data.nonNegotiableValues = "Jujur, tidak mengarang data";
  bp.modules.reflection.data.painPoint = "Proposal manual makan waktu berhari-hari";
  return bp;
}

test("refleksi TIDAK menimpa goals.primaryOutcome & monetization.productTargetUser yang dijawab user", () => {
  const bp = seedReflection(createEmptyBlueprint("asisten proposal untuk tim sales"));

  const USER_OUTCOME = "target user asli yang saya ketik sendiri";
  const USER_TARGET = "pelanggan enterprise yang saya tentukan sendiri";

  bp.modules.goals.data.primaryOutcome = USER_OUTCOME;
  bp.modules.goals.fieldMeta["primaryOutcome"] = { source: "user", confidence: 1, needsConfirmation: false };

  bp.modules.monetization.data.productTargetUser = USER_TARGET;
  bp.modules.monetization.fieldMeta["productTargetUser"] = { source: "user", confidence: 1, needsConfirmation: false };

  const { blueprint, trace } = inferBlueprint(bp);

  // Nilai user tetap utuh
  assert.equal(blueprint.modules.goals.data.primaryOutcome, USER_OUTCOME);
  assert.equal(blueprint.modules.monetization.data.productTargetUser, USER_TARGET);

  // Sumber tetap "user" (tidak berubah jadi "inferred")
  assert.equal(blueprint.modules.goals.fieldMeta["primaryOutcome"]?.source, "user");
  assert.equal(blueprint.modules.monetization.fieldMeta["productTargetUser"]?.source, "user");

  // Trace mencatat aturan dilewati karena nilai berasal dari user
  assert.equal(trace.find((t) => t.ruleId === "goals.primaryOutcome")?.action, "skipped-user");
  assert.equal(trace.find((t) => t.ruleId === "monetization.productTargetUser")?.action, "skipped-user");
});

test("refleksi mengisi field target yang kosong dengan confidence 0.5 + needsConfirmation", () => {
  const bp = seedReflection(createEmptyBlueprint("asisten proposal untuk tim sales"));
  // Sengaja TIDAK mengisi goals.primaryOutcome / productTargetUser / domainCharter.

  const { blueprint, trace } = inferBlueprint(bp);

  // goals.primaryOutcome ← successVision
  assert.equal(blueprint.modules.goals.data.primaryOutcome, "Klien bisa closing tanpa bantuan manual saya");
  const outcomeMeta = blueprint.modules.goals.fieldMeta["primaryOutcome"];
  assert.equal(outcomeMeta?.source, "inferred");
  assert.equal(outcomeMeta?.confidence, 0.5);
  assert.equal(outcomeMeta?.needsConfirmation, true);

  // monetization.productTargetUser ← beneficiary
  assert.equal(blueprint.modules.monetization.data.productTargetUser, "Tim sales UMKM konstruksi");
  const targetMeta = blueprint.modules.monetization.fieldMeta["productTargetUser"];
  assert.equal(targetMeta?.source, "inferred");
  assert.equal(targetMeta?.confidence, 0.5);
  assert.equal(targetMeta?.needsConfirmation, true);

  // policy.domainCharter ← vision + pain + nilai
  const charter = blueprint.modules.policy.data.domainCharter as string;
  assert.ok(charter.includes("Setiap UMKM punya asisten AI andal"));
  assert.ok(charter.includes("Proposal manual makan waktu berhari-hari"));
  assert.ok(charter.includes("Jujur, tidak mengarang data"));
  const charterMeta = blueprint.modules.policy.fieldMeta["domainCharter"];
  assert.equal(charterMeta?.source, "inferred");
  assert.equal(charterMeta?.confidence, 0.5);
  assert.equal(charterMeta?.needsConfirmation, true);

  // Trace mencatat semua ditulis
  assert.equal(trace.find((t) => t.ruleId === "goals.primaryOutcome")?.action, "written");
  assert.equal(trace.find((t) => t.ruleId === "monetization.productTargetUser")?.action, "written");
  assert.equal(trace.find((t) => t.ruleId === "policy.domainCharter")?.action, "written");
});

test("refleksi TIDAK menimpa policy.domainCharter yang dijawab user", () => {
  const bp = seedReflection(createEmptyBlueprint("asisten proposal untuk tim sales"));

  const USER_CHARTER = "piagam domain yang saya tulis manual dan tidak boleh diubah";
  bp.modules.policy.data.domainCharter = USER_CHARTER;
  bp.modules.policy.fieldMeta["domainCharter"] = { source: "user", confidence: 1, needsConfirmation: false };

  const { blueprint, trace } = inferBlueprint(bp);

  assert.equal(blueprint.modules.policy.data.domainCharter, USER_CHARTER);
  assert.equal(blueprint.modules.policy.fieldMeta["domainCharter"]?.source, "user");
  assert.equal(trace.find((t) => t.ruleId === "policy.domainCharter")?.action, "skipped-user");
});
