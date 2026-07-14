/**
 * Tahap 20 — Organization Configuration Engine (Fase 3).
 * Mengunci: dryRun (tanpa tulis), atomik wajib (refuse tanpa runInTransaction),
 * stamp ownerUserId di SETIAP agen, dua fase (create → wiring by localId→agentId),
 * dan ROLLBACK total saat wiring gagal (tidak ada organisasi parsial).
 * Jalankan: npx tsx --test tests/organization-configuration-engine.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  organizationBlueprintSchema,
  createEmptyOrgMember,
  type OrganizationBlueprint,
} from "../shared/blueprint/organization-blueprint-schema.ts";
import { applyOrganizationToBuilder } from "../server/services/blueprint-engine/organization-configuration-engine.ts";

/* ---- Fake storage in-memory dengan transaksi (snapshot/rollback) ---- */
function makeStorage(opts: { failUpdateForAgentId?: () => string | null; failKB?: boolean } = {}) {
  const state = { agents: [] as any[], children: [] as any[], seq: 0 };
  const snapshot = () => ({
    agents: JSON.parse(JSON.stringify(state.agents)),
    children: JSON.parse(JSON.stringify(state.children)),
    seq: state.seq,
  });
  const restore = (s: ReturnType<typeof snapshot>) => {
    state.agents = s.agents;
    state.children = s.children;
    state.seq = s.seq;
  };
  const base = {
    async getAgentBySlug() { return undefined; },
    async createAgent(a: any) {
      const agent = { ...a, id: ++state.seq };
      state.agents.push(agent);
      return agent;
    },
    async updateAgent(id: string, data: any) {
      if (opts.failUpdateForAgentId && opts.failUpdateForAgentId() === String(id)) {
        throw new Error(`boom update ${id}`);
      }
      const agent = state.agents.find((x) => String(x.id) === String(id));
      if (!agent) return undefined;
      Object.assign(agent, data);
      return agent;
    },
    async createKnowledgeBase(kb: any) {
      if (opts.failKB) throw new Error("boom kb insert");
      const r = { ...kb, id: ++state.seq };
      state.children.push(r);
      return r;
    },
    async createMiniApp(a: any) { const r = { ...a, id: ++state.seq }; state.children.push(r); return r; },
    async createIntegration(i: any) { const r = { ...i, id: ++state.seq }; state.children.push(r); return r; },
    async createProjectBrainTemplate(t: any) { const r = { ...t, id: ++state.seq }; state.children.push(r); return r; },
  };
  return {
    state,
    storage: {
      ...base,
      async runInTransaction(fn: (s: any) => Promise<any>) {
        const snap = snapshot();
        try {
          return await fn(base);
        } catch (e) {
          restore(snap);
          throw e;
        }
      },
    },
    storageNoTx: base, // tanpa runInTransaction
  };
}

function buildOrg(): OrganizationBlueprint {
  const lead = createEmptyOrgMember("m1", "orchestrator", "Ketua");
  lead.blueprint.modules.identity.data.name = "Ketua Tim";
  const mkt = createEmptyOrgMember("m2", "specialist", "Marketing");
  mkt.blueprint.modules.identity.data.name = "Agen Marketing";
  const cs = createEmptyOrgMember("m3", "support", "CS");
  cs.blueprint.modules.identity.data.name = "Agen CS";
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

test("dryRun: tidak menulis apa pun, tetap beri pratinjau", async () => {
  const { storage, state } = makeStorage();
  const res = await applyOrganizationToBuilder(buildOrg(), { dryRun: true, storage, ownerUserId: "u1" });
  assert.equal(res.applied, false);
  assert.equal(res.dryRun, true);
  assert.equal(state.agents.length, 0);
  assert.equal(res.members.length, 3);
  assert.ok(res.members.find((m) => m.localId === "m1")!.agentPatchPreview.name);
});

test("penulisan nyata: 3 agen dibuat, wiring orchestrator terisi, ownerUserId distempel", async () => {
  const { storage, state } = makeStorage();
  const res = await applyOrganizationToBuilder(buildOrg(), { storage, ownerUserId: "u1" });
  assert.equal(res.applied, true);
  assert.equal(res.atomic, true);
  assert.equal(res.created.agents, 3);
  assert.equal(state.agents.length, 3);
  // ownerUserId di SETIAP agen
  assert.ok(state.agents.every((a) => a.userId === "u1"));
  // orchestrator (m1) → isOrchestrator true + 2 sub-agen numerik
  const orchId = res.idMap["m1"];
  const orch = state.agents.find((a) => String(a.id) === orchId)!;
  assert.equal(orch.isOrchestrator, true);
  assert.equal(orch.agenticSubAgents.length, 2);
  assert.ok(orch.agenticSubAgents.every((s: any) => typeof s.agentId === "number"));
  const wiredIds = orch.agenticSubAgents.map((s: any) => String(s.agentId)).sort();
  assert.deepEqual(wiredIds, [res.idMap["m2"], res.idMap["m3"]].sort());
});

test("ATOMIK: storage tanpa runInTransaction → penulisan dibatalkan", async () => {
  const { storageNoTx, state } = makeStorage();
  const res = await applyOrganizationToBuilder(buildOrg(), { storage: storageNoTx as any, ownerUserId: "u1" });
  assert.equal(res.applied, false);
  assert.equal(state.agents.length, 0);
  assert.ok(res.warnings.some((w) => w.includes("transaksi atomik")));
});

test("ROLLBACK: gagal di Fase B (wiring) → tidak ada agen tersisa", async () => {
  // Gagalkan update untuk agen pertama (orchestrator m1 = id 1).
  const { storage, state } = makeStorage({ failUpdateForAgentId: () => "1" });
  const res = await applyOrganizationToBuilder(buildOrg(), { storage, ownerUserId: "u1" });
  assert.equal(res.applied, false);
  assert.equal(state.agents.length, 0, "semua agen harus di-rollback");
  assert.equal(res.created.agents, 0);
  assert.ok(res.warnings.some((w) => w.includes("rollback")));
});

test("ROLLBACK: gagal insert entitas anak (KB) di Fase A → tidak ada agen tersisa", async () => {
  const org = buildOrg();
  // beri m2 sebuah sumber KB valid agar createKnowledgeBase terpanggil (lalu dibuat gagal)
  org.members[1].blueprint.modules.knowledge.data.sources = [
    { name: "Manual", type: "text", content: "isi" },
  ];
  const { storage, state } = makeStorage({ failKB: true });
  const res = await applyOrganizationToBuilder(org, { storage, ownerUserId: "u1" });
  assert.equal(res.applied, false);
  assert.equal(state.agents.length, 0, "agen yang sempat dibuat harus di-rollback");
  assert.equal(state.children.length, 0);
  assert.equal(res.created.agents, 0);
  assert.ok(res.warnings.some((w) => w.includes("rollback")));
});

test("patch invalid (nama kosong) → seluruh organisasi dibatalkan", async () => {
  const org = buildOrg();
  org.members[1].blueprint.modules.identity.data.name = ""; // invalid
  const { storage, state } = makeStorage();
  const res = await applyOrganizationToBuilder(org, { storage, ownerUserId: "u1" });
  assert.equal(res.applied, false);
  assert.equal(state.agents.length, 0);
  assert.ok(res.warnings.some((w) => w.includes("tidak valid")));
});

test("orchestrator tanpa bigIdeaId tetap bisa dibuat (isOrchestrator ditunda ke Fase B)", async () => {
  const { storage, state } = makeStorage();
  const res = await applyOrganizationToBuilder(buildOrg(), { storage, ownerUserId: "u1" });
  assert.equal(res.applied, true);
  const orch = state.agents.find((a) => String(a.id) === res.idMap["m1"])!;
  assert.equal(orch.isOrchestrator, true);
  assert.ok(res.warnings.some((w) => w.includes("tanpa bigIdeaId")));
});
