/**
 * Tahap 18 — Organization Blueprint Schema (Fase 3).
 * Mengunci kontrak skema organisasi AI: konstruksi valid + lint konsistensi.
 * Jalankan: npx tsx --test tests/organization-blueprint-schema.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  organizationBlueprintSchema,
  createEmptyOrganizationBlueprint,
  createEmptyOrgMember,
  lintOrganizationBlueprint,
  getOrchestrators,
  getSubMembers,
  type OrganizationBlueprint,
} from "../shared/blueprint/organization-blueprint-schema.ts";

test("createEmptyOrganizationBlueprint menghasilkan org valid tanpa anggota", () => {
  const org = createEmptyOrganizationBlueprint("toko online");
  assert.equal(org.members.length, 0);
  assert.equal(org.structure.edges.length, 0);
  assert.equal(org.meta.status, "draft");
  assert.equal(org.meta.intent, "toko online");
  // parse ulang harus tetap valid
  assert.doesNotThrow(() => organizationBlueprintSchema.parse(org));
});

test("createEmptyOrgMember membawa Blueprint single-agent lengkap", () => {
  const m = createEmptyOrgMember("m1", "orchestrator", "Ketua");
  assert.equal(m.localId, "m1");
  assert.equal(m.role, "orchestrator");
  // memakai ulang single-agent blueprint → punya 18 modul
  assert.ok(m.blueprint.modules.identity);
  assert.ok(m.blueprint.modules.orchestration);
});

function sampleOrg(): OrganizationBlueprint {
  const lead = createEmptyOrgMember("m1", "orchestrator", "Ketua");
  const spec = createEmptyOrgMember("m2", "specialist", "Marketing");
  return organizationBlueprintSchema.parse({
    meta: { schemaVersion: "1.0.0", status: "draft" },
    members: [lead, spec],
    structure: {
      leadLocalId: "m1",
      edges: [{ fromLocalId: "m1", toLocalId: "m2", role: "MARKETING" }],
    },
    overallConfidence: 0,
  });
}

test("lint: organisasi konsisten = tanpa peringatan", () => {
  assert.equal(lintOrganizationBlueprint(sampleOrg()).length, 0);
});

test("lint: edge ke localId tak dikenal terdeteksi", () => {
  const org = sampleOrg();
  org.structure.edges.push({ fromLocalId: "m1", toLocalId: "ghost" });
  const w = lintOrganizationBlueprint(org);
  assert.ok(w.some((x) => x.message.includes("toLocalId tidak dikenal")));
});

test("lint: orchestrator bukan-orchestrator sebagai fromLocalId terdeteksi", () => {
  const org = sampleOrg();
  // m2 adalah specialist; jadikan ia pemanggil → harus warning
  org.structure.edges.push({ fromLocalId: "m2", toLocalId: "m1" });
  const w = lintOrganizationBlueprint(org);
  assert.ok(w.some((x) => x.message.includes("bukan orchestrator")));
});

test("lint: self-edge & localId duplikat & lead salah terdeteksi", () => {
  const dupA = createEmptyOrgMember("m1", "orchestrator");
  const dupB = createEmptyOrgMember("m1", "specialist");
  const org = organizationBlueprintSchema.parse({
    meta: { schemaVersion: "1.0.0", status: "draft" },
    members: [dupA, dupB],
    structure: {
      leadLocalId: "m1", // m1 ada tapi peran campur; juga ada self-edge
      edges: [{ fromLocalId: "m1", toLocalId: "m1" }],
    },
    overallConfidence: 0,
  });
  const w = lintOrganizationBlueprint(org);
  assert.ok(w.some((x) => x.message.includes("duplikat")));
  assert.ok(w.some((x) => x.message.includes("self-reference")));
});

test("lint: field linkage runtime di anggota memicu peringatan sumber-kebenaran", () => {
  const org = sampleOrg();
  // anggota seharusnya TIDAK menyetel wiring sendiri — harus lewat structure.edges
  org.members[0].blueprint.meta.agentId = 999;
  org.members[1].blueprint.modules.orchestration.data.agenticSubAgents = [
    { role: "X", agentId: 5 },
  ];
  org.members[1].blueprint.modules.orchestration.data.parentAgentId = 7;
  const w = lintOrganizationBlueprint(org);
  assert.ok(w.some((x) => x.message.includes("meta.agentId")));
  assert.ok(w.some((x) => x.message.includes("agenticSubAgents")));
  assert.ok(w.some((x) => x.message.includes("parentAgentId")));
});

test("helper: getOrchestrators mengutamakan lead, getSubMembers benar", () => {
  const org = sampleOrg();
  const orch = getOrchestrators(org);
  assert.equal(orch[0].localId, "m1");
  const subs = getSubMembers(org, "m1");
  assert.equal(subs.length, 1);
  assert.equal(subs[0].localId, "m2");
});
