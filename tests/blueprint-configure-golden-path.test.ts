import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import {
  MODULE_SPECS,
  applyBlueprintToBuilder,
  type ConfigStorage,
} from "../server/services/blueprint-engine";

/**
 * GOLDEN PATH — Blueprint → Konfigurasi Agen (Configuration Engine / Tahap 4).
 *
 * Mengunci "ekspor" blueprint ke konfigurasi chatbot: inilah janji inti produk
 * (dialog singkat → agen jadi). Engine 1–9 yang murni sudah punya test sendiri,
 * tapi jalur TULIS (mapping → create/update agen + entitas anak) belum. Test ini
 * memakai ConfigStorage tiruan (engine mendukung injeksi storage) agar
 * deterministik tanpa DB/server.
 */

function setUser(bp: any, mod: string, field: string, value: any) {
  bp.modules[mod].data[field] = value;
  bp.modules[mod].fieldMeta[field] = { source: "user", confidence: 1, needsConfirmation: false };
}

function fillCore(bp: any) {
  for (const m of ["identity", "aiEngine", "goals", "policy"]) {
    for (const f of MODULE_SPECS[m].requiredFields) {
      setUser(bp, m, f, f === "language" ? "id" : f === "aiModel" ? "gpt-4o-mini" : "x");
    }
  }
}

/** Blueprint realistis & valid untuk mode create. */
function realisticBlueprint() {
  const bp = createEmptyBlueprint("asisten hukum umkm");
  fillCore(bp);
  setUser(bp, "identity", "name", "Asisten Hukum UMKM");
  setUser(bp, "identity", "description", "Asisten hukum UMKM untuk pertanyaan kontrak & kepatuhan dasar.");
  setUser(bp, "identity", "toneOfVoice", "ramah-profesional");
  setUser(bp, "aiEngine", "systemPrompt", "Anda asisten hukum UMKM. " + "x".repeat(140));
  setUser(bp, "aiEngine", "aiModel", "gpt-4o-mini");
  setUser(bp, "aiEngine", "temperature", 0.4);
  setUser(bp, "goals", "primaryOutcome", "Bantu UMKM memahami kontrak dasar");
  (bp.modules.knowledge.data as any).ragEnabled = true;
  setUser(bp, "knowledge", "sources", [
    { type: "text", name: "Dasar Kontrak", content: "Ringkasan UU & asas kontrak ..." },
  ]);
  return bp;
}

/** ConfigStorage tiruan in-memory — mencatat semua tulisan untuk diperiksa. */
function makeMockStorage() {
  const state = {
    created: [] as any[],
    updated: [] as Array<{ id: string; data: any }>,
    knowledgeBases: [] as any[],
    miniApps: [] as any[],
    integrations: [] as any[],
    projectBrainTemplates: [] as any[],
    bySlug: new Map<string, any>(),
  };
  let seq = 100;
  const storage: ConfigStorage = {
    async getAgentBySlug(slug: string) {
      return state.bySlug.get(slug);
    },
    async createAgent(agent: any) {
      const rec = { ...agent, id: ++seq };
      state.created.push(rec);
      return rec;
    },
    async updateAgent(id: string, data: any) {
      state.updated.push({ id, data });
      return { id: Number(id), ...data } as any;
    },
    async createKnowledgeBase(kb: any) {
      state.knowledgeBases.push(kb);
      return { id: state.knowledgeBases.length, ...kb } as any;
    },
    async createMiniApp(a: any) {
      state.miniApps.push(a);
      return { id: state.miniApps.length, ...a } as any;
    },
    async createIntegration(i: any) {
      state.integrations.push(i);
      return { id: state.integrations.length, ...i } as any;
    },
    async createProjectBrainTemplate(t: any) {
      state.projectBrainTemplates.push(t);
      return { id: state.projectBrainTemplates.length, ...t } as any;
    },
  };
  return { storage, state };
}

test("dryRun create: TIDAK menulis apa pun (aman secara default)", async () => {
  const { storage, state } = makeMockStorage();
  const res = await applyBlueprintToBuilder(realisticBlueprint(), {
    mode: "create",
    dryRun: true,
    ownerUserId: "owner-1",
    storage,
  });
  assert.equal(res.applied, false, "dryRun tidak boleh menerapkan");
  assert.equal(res.dryRun, true);
  assert.equal(state.created.length, 0, "dryRun tidak boleh membuat agen");
  assert.equal(state.knowledgeBases.length, 0, "dryRun tidak boleh membuat KB");
  assert.ok(res.agentPatchKeys.length > 0, "rencana patch tetap dilaporkan saat dryRun");
});

test("create nyata: agen dibuat, field inti terisi, kepemilikan ter-stamp", async () => {
  const { storage, state } = makeMockStorage();
  const res = await applyBlueprintToBuilder(realisticBlueprint(), {
    mode: "create",
    dryRun: false,
    ownerUserId: "owner-1",
    storage,
  });

  assert.equal(res.applied, true, `create harus berhasil; warnings: ${res.warnings.join(" | ")}`);
  assert.equal(state.created.length, 1, "tepat satu agen dibuat");

  const agent = state.created[0];
  assert.equal(agent.userId, "owner-1", "ownerUserId wajib di-stamp agar muncul di dashboard pemilik");
  assert.equal(agent.name, "Asisten Hukum UMKM");
  assert.equal(agent.aiModel, "gpt-4o-mini");
  assert.ok(typeof agent.systemPrompt === "string" && agent.systemPrompt.length > 100, "systemPrompt terbawa");
  assert.equal(agent.description, "Asisten hukum UMKM untuk pertanyaan kontrak & kepatuhan dasar.");

  // Entitas anak: knowledge base dari knowledge.sources ikut ter-export.
  assert.equal(state.knowledgeBases.length, 1, "1 sumber knowledge → 1 KB dibuat");
  assert.equal(res.created.knowledgeBases, 1);
});

test("create: sub-agen by-slug diresolusi ke agentId numerik", async () => {
  const { storage, state } = makeMockStorage();
  state.bySlug.set("hukum-kontrak-spesialis", { id: 777, slug: "hukum-kontrak-spesialis" });

  // Catatan: TIDAK set isOrchestrator=true di sini — schema agen mewajibkan
  // orchestrator punya bigIdeaId aktif (refine yang sah, bukan bug). Resolusi
  // sub-agen by-slug tetap berjalan tanpa mode orchestrator, jadi cukup untuk
  // mengunci kontrak slug→agentId numerik.
  const bp = realisticBlueprint();
  setUser(bp, "orchestration", "agenticSubAgents", [
    { role: "KONTRAK", agentSlug: "hukum-kontrak-spesialis", description: "spesialis kontrak" },
  ]);

  const res = await applyBlueprintToBuilder(bp, {
    mode: "create",
    dryRun: false,
    ownerUserId: "owner-1",
    storage,
  });

  assert.equal(res.applied, true, `warnings: ${res.warnings.join(" | ")}`);
  const agent = state.created[0];
  assert.ok(Array.isArray(agent.agenticSubAgents), "agenticSubAgents tersimpan");
  const sub = agent.agenticSubAgents[0];
  assert.equal(sub.agentId, 777, "slug diresolusi ke id numerik");
  assert.equal(sub.role, "KONTRAK");
  assert.equal(sub.agentSlug, undefined, "agentSlug dibuang agar format kanonik {role,agentId,description}");
});

test("update: memanggil updateAgent dengan patch (bukan membuat agen baru)", async () => {
  const { storage, state } = makeMockStorage();
  const res = await applyBlueprintToBuilder(realisticBlueprint(), {
    mode: "update",
    agentId: "42",
    dryRun: false,
    storage,
  });
  assert.equal(res.applied, true, `warnings: ${res.warnings.join(" | ")}`);
  assert.equal(state.created.length, 0, "update tidak boleh membuat agen baru");
  assert.equal(state.updated.length, 1, "tepat satu update");
  assert.equal(state.updated[0].id, "42");
  assert.equal(state.updated[0].data.name, "Asisten Hukum UMKM");
});
