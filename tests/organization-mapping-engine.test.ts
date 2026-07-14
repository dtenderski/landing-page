/**
 * Tahap 19 — Organization Mapping Engine (Fase 3).
 * Mengunci: pemakaian ulang single-agent mapping per anggota, kontrak
 * sumber-kebenaran (wiring HANYA dari structure.edges), dan stats.
 * Jalankan: npx tsx --test tests/organization-mapping-engine.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  organizationBlueprintSchema,
  createEmptyOrgMember,
  type OrganizationBlueprint,
} from "../shared/blueprint/organization-blueprint-schema.ts";
import { mapOrganizationToBuilder } from "../server/services/blueprint-engine/organization-mapping-engine.ts";

function buildOrg(): OrganizationBlueprint {
  const lead = createEmptyOrgMember("m1", "orchestrator", "Ketua");
  lead.blueprint.modules.identity.data.name = "Ketua Tim";
  const mkt = createEmptyOrgMember("m2", "specialist", "Marketing");
  mkt.blueprint.modules.identity.data.name = "Agen Marketing";
  const cs = createEmptyOrgMember("m3", "support", "CS");
  return organizationBlueprintSchema.parse({
    meta: { schemaVersion: "1.0.0", status: "draft", name: "Toko Saya" },
    members: [lead, mkt, cs],
    structure: {
      leadLocalId: "m1",
      edges: [
        { fromLocalId: "m1", toLocalId: "m2", role: "MARKETING" },
        { fromLocalId: "m1", toLocalId: "m3", role: "CS" },
      ],
    },
    overallConfidence: 0,
  });
}

test("memetakan tiap anggota lewat single-agent mapping (agentPatch terisi)", () => {
  const res = mapOrganizationToBuilder(buildOrg());
  assert.equal(res.members.length, 3);
  const lead = res.members.find((m) => m.localId === "m1")!;
  assert.equal(lead.mapping.agentPatch.name, "Ketua Tim");
  // peran orchestrator ditandai di kolom agen
  assert.equal(lead.mapping.agentPatch.isOrchestrator, true);
});

test("wiring dibangun dari structure.edges (by localId), bukan dari anggota", () => {
  const res = mapOrganizationToBuilder(buildOrg());
  assert.equal(res.wiring.length, 1);
  assert.equal(res.wiring[0].orchestratorLocalId, "m1");
  const subIds = res.wiring[0].subAgents.map((s) => s.localId).sort();
  assert.deepEqual(subIds, ["m2", "m3"]);
  assert.equal(res.leadLocalId, "m1");
});

test("KONTRAK: agenticSubAgents/parentAgentId di anggota DIBUANG + warning", () => {
  const org = buildOrg();
  org.members[0].blueprint.modules.orchestration.data.agenticSubAgents = [
    { role: "GHOST", agentId: 123 },
  ];
  org.members[0].blueprint.modules.orchestration.data.parentAgentId = 9;
  const res = mapOrganizationToBuilder(org);
  const lead = res.members.find((m) => m.localId === "m1")!;
  assert.equal(lead.mapping.agentPatch.agenticSubAgents, undefined);
  assert.equal(lead.mapping.agentPatch.parentAgentId, undefined);
  assert.ok(res.warnings.some((w) => w.includes("agenticSubAgents")));
  assert.ok(res.warnings.some((w) => w.includes("parentAgentId")));
});

test("KONTRAK: isOrchestrator:true di anggota non-orchestrator dipaksa false + warning", () => {
  const org = buildOrg();
  // m2 = specialist, tapi Blueprint-nya mengaku orchestrator
  org.members[1].blueprint.modules.orchestration.data.isOrchestrator = true;
  const res = mapOrganizationToBuilder(org);
  const mkt = res.members.find((m) => m.localId === "m2")!;
  assert.equal(mkt.mapping.agentPatch.isOrchestrator, false);
  assert.equal(res.stats.orchestratorCount, 1); // tetap hanya m1
  assert.ok(res.warnings.some((w) => w.includes("dipaksa false")));
});

test("edge menggantung / dari non-orchestrator tidak masuk wiring", () => {
  const org = buildOrg();
  org.structure.edges.push({ fromLocalId: "m2", toLocalId: "m3" }); // m2 specialist
  org.structure.edges.push({ fromLocalId: "m1", toLocalId: "ghost" }); // tak dikenal
  const res = mapOrganizationToBuilder(org);
  // wiring tetap hanya untuk m1 → {m2, m3}
  assert.equal(res.wiring.length, 1);
  assert.equal(res.wiring[0].subAgents.length, 2);
});

test("orchestrator tanpa edge keluar memicu warning", () => {
  const lone = createEmptyOrgMember("solo", "orchestrator");
  const org = organizationBlueprintSchema.parse({
    meta: { schemaVersion: "1.0.0", status: "draft" },
    members: [lone],
    structure: { edges: [] },
    overallConfidence: 0,
  });
  const res = mapOrganizationToBuilder(org);
  assert.ok(res.warnings.some((w) => w.includes("tanpa sub-agen")));
  assert.equal(res.stats.orchestratorCount, 1);
});

test("stats akurat", () => {
  const res = mapOrganizationToBuilder(buildOrg());
  assert.equal(res.stats.memberCount, 3);
  assert.equal(res.stats.orchestratorCount, 1);
  assert.equal(res.stats.edgeCount, 2);
});
