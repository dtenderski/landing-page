/**
 * Tahap 23 — Organization Dialogue / Inference Engine (Fase 3).
 * Mengunci: saran komposisi tim deterministik, dialog org-level (pure),
 * inferensi per-anggota (pakai ulang inferBlueprint), auto-struktur, kontrak
 * sumber-kebenaran wiring, dan agregat overallConfidence.
 * Jalankan: npx tsx --test tests/organization-dialogue-engine.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyOrganizationBlueprint,
  createEmptyOrgMember,
  organizationBlueprintSchema,
  lintOrganizationBlueprint,
  type OrganizationBlueprint,
} from "../shared/blueprint/organization-blueprint-schema.ts";
import {
  suggestTeamComposition,
  applyTeamSuggestion,
  selectNextOrgQuestions,
  applyOrgAnswer,
  applyOrgAnswers,
  getOrgDialogueState,
  inferOrganization,
  ORG_QUESTION_BANK,
  teamTemplateDomains,
  leadGateDomains,
} from "../server/services/blueprint-engine/organization-dialogue-engine.ts";

/* --- Saran komposisi tim ------------------------------------------------ */

test("suggestTeamComposition mendeteksi domain konstruksi → lead + spesialis", () => {
  const s = suggestTeamComposition("Saya mau bantu kontraktor urus SBU dan tender konstruksi");
  assert.equal(s.domain, "Konstruksi");
  assert.ok(s.members.length >= 2);
  assert.equal(s.members[0].role, "orchestrator");
  assert.equal(s.members[0].localId, "m1");
  // localId unik & berurutan
  const ids = new Set(s.members.map((m) => m.localId));
  assert.equal(ids.size, s.members.length);
});

test("suggestTeamComposition fallback ke tim Umum untuk misi tak dikenal", () => {
  const s = suggestTeamComposition("zxqw blah blah sesuatu yang tak ada kata kuncinya");
  assert.equal(s.domain, "Umum");
  assert.equal(s.members[0].role, "orchestrator");
});

test("suggestTeamComposition deterministik (idempoten)", () => {
  const a = suggestTeamComposition("tim pemasaran konten dan iklan");
  const b = suggestTeamComposition("tim pemasaran konten dan iklan");
  assert.deepEqual(a, b);
});

test("maxSpecialists membatasi jumlah spesialis", () => {
  const s = suggestTeamComposition("konstruksi sbu tender", { maxSpecialists: 1 });
  // 1 lead + 1 spesialis
  assert.equal(s.members.length, 2);
});

/* --- Terapkan saran → OrganizationBlueprint ----------------------------- */

test("applyTeamSuggestion menghasilkan org valid: lead + edges lead→lainnya, lint bersih", () => {
  const org = createEmptyOrganizationBlueprint("tim keuangan dan pajak umkm");
  const s = suggestTeamComposition("tim keuangan dan pajak umkm");
  const next = applyTeamSuggestion(org, s);

  // Tetap valid menurut schema.
  organizationBlueprintSchema.parse(next);

  const lead = next.members.find((m) => m.role === "orchestrator")!;
  assert.equal(next.structure.leadLocalId, lead.localId);
  const others = next.members.filter((m) => m.localId !== lead.localId);
  assert.equal(next.structure.edges.length, others.length);
  for (const e of next.structure.edges) {
    assert.equal(e.fromLocalId, lead.localId);
  }
  assert.deepEqual(lintOrganizationBlueprint(next), []);
});

test("applyTeamSuggestion tidak memutasi input", () => {
  const org = createEmptyOrganizationBlueprint("hukum kontrak");
  const snapshot = JSON.stringify(org);
  applyTeamSuggestion(org, suggestTeamComposition("hukum kontrak"));
  assert.equal(JSON.stringify(org), snapshot);
});

/* --- Dialog org-level --------------------------------------------------- */

test("selectNextOrgQuestions menanyakan misi dulu, lalu berhenti saat terisi", () => {
  const org = createEmptyOrganizationBlueprint();
  const q1 = selectNextOrgQuestions(org);
  assert.ok(q1.some((q) => q.id === "org.mission"));

  const filled = applyOrgAnswer(org, "org.mission", "Bantu UMKM jualan online").organization;
  const q2 = selectNextOrgQuestions(filled);
  assert.ok(!q2.some((q) => q.id === "org.mission"));
  assert.ok(q2.some((q) => q.id === "org.name"));
});

test("applyOrgAnswer mengisi meta + mirror misi ke intent, pure", () => {
  const org = createEmptyOrganizationBlueprint();
  const snapshot = JSON.stringify(org);
  const res = applyOrgAnswer(org, "org.mission", "  Tim layanan pelanggan toko  ");
  assert.equal(res.applied, true);
  assert.equal(res.organization.meta.mission, "Tim layanan pelanggan toko"); // trim
  assert.equal(res.organization.meta.intent, "Tim layanan pelanggan toko"); // mirror
  assert.equal(JSON.stringify(org), snapshot); // input tak berubah
});

test("applyOrgAnswer menolak nodeId tak dikenal & jawaban kosong", () => {
  const org = createEmptyOrganizationBlueprint();
  assert.equal(applyOrgAnswer(org, "org.unknown", "x").applied, false);
  assert.equal(applyOrgAnswer(org, "org.name", "   ").applied, false);
});

test("applyOrgAnswer SELALU mengembalikan salinan baru (sukses & gagal)", () => {
  const org = createEmptyOrganizationBlueprint();
  // sukses
  assert.notEqual(applyOrgAnswer(org, "org.name", "Tim A").organization, org);
  // gagal: node tak dikenal
  assert.notEqual(applyOrgAnswer(org, "org.unknown", "x").organization, org);
  // gagal: jawaban kosong
  assert.notEqual(applyOrgAnswer(org, "org.name", "   ").organization, org);
});

test("applyOrgAnswers mengembalikan salinan baru walau answers kosong", () => {
  const org = createEmptyOrganizationBlueprint();
  assert.notEqual(applyOrgAnswers(org, {}).organization, org);
});

test("getOrgDialogueState menandai readyToCompose setelah misi terisi", () => {
  const org = createEmptyOrganizationBlueprint();
  assert.equal(getOrgDialogueState(org).readyToCompose, false);
  const filled = applyOrgAnswers(org, { "org.mission": "tim pemasaran", "org.name": "Tim Promosi" }).organization;
  const st = getOrgDialogueState(filled);
  assert.equal(st.hasName, true);
  assert.equal(st.hasMission, true);
  assert.equal(st.readyToCompose, true);
});

test("ORG_QUESTION_BANK punya id unik", () => {
  const ids = new Set(ORG_QUESTION_BANK.map((n) => n.id));
  assert.equal(ids.size, ORG_QUESTION_BANK.length);
});

/* --- Inferensi organisasi ----------------------------------------------- */

function composedOrg(): OrganizationBlueprint {
  const org = createEmptyOrganizationBlueprint("Bantu kontraktor urus SBU dan tender");
  org.meta.mission = "Bantu kontraktor urus SBU dan tender";
  return applyTeamSuggestion(org, suggestTeamComposition(org.meta.mission!));
}

test("inferOrganization mengisi field anggota (systemPrompt/slug) via inferBlueprint", () => {
  const res = inferOrganization(composedOrg());
  const lead = res.organization.members[0];
  const ai = lead.blueprint.modules.aiEngine.data as Record<string, any>;
  const id = lead.blueprint.modules.identity.data as Record<string, any>;
  assert.ok(typeof ai.systemPrompt === "string" && ai.systemPrompt.length > 0);
  assert.ok(typeof id.slug === "string" && id.slug.length > 0);
  assert.ok(res.memberInferences.every((m) => m.written > 0));
  assert.ok(res.overallConfidence > 0);
});

test("inferOrganization menyarankan struktur saat edges kosong", () => {
  const org = createEmptyOrganizationBlueprint("tim SDM rekrutmen");
  const lead = createEmptyOrgMember("m1", "orchestrator", "Ketua SDM");
  const spc = createEmptyOrgMember("m2", "specialist", "Rekrutmen");
  org.members = [lead, spc];
  org.structure = { leadLocalId: "m1", edges: [] };

  const res = inferOrganization(organizationBlueprintSchema.parse(org));
  assert.equal(res.edgesAdded.length, 1);
  assert.equal(res.organization.structure.edges[0].fromLocalId, "m1");
  assert.equal(res.organization.structure.edges[0].toLocalId, "m2");
});

test("inferOrganization menjaga kontrak: tidak menulis wiring di blueprint anggota", () => {
  const res = inferOrganization(composedOrg());
  // lint tetap bersih → tak ada agenticSubAgents/parentAgentId/agentId di anggota
  assert.deepEqual(lintOrganizationBlueprint(res.organization), []);
  for (const m of res.organization.members) {
    const orch = m.blueprint.modules.orchestration.data as Record<string, any>;
    assert.ok(!Array.isArray(orch.agenticSubAgents) || orch.agenticSubAgents.length === 0);
    assert.equal(orch.parentAgentId ?? null, null);
  }
});

test("inferOrganization tidak menimpa nilai buatan user", () => {
  const org = composedOrg();
  (org.members[0].blueprint.modules.identity.data as Record<string, any>).name = "Bos Besar";
  org.members[0].blueprint.modules.identity.fieldMeta = {
    name: { confidence: 1, source: "user", needsConfirmation: false },
  };
  const res = inferOrganization(org);
  assert.equal(
    (res.organization.members[0].blueprint.modules.identity.data as Record<string, any>).name,
    "Bos Besar",
  );
});

test("inferOrganization pure (input tak berubah) & mengisi nama org dari domain", () => {
  const org = composedOrg();
  const snapshot = JSON.stringify(org);
  const res = inferOrganization(org);
  assert.equal(JSON.stringify(org), snapshot);
  assert.equal(res.organization.meta.name, "Tim Konstruksi");
});

/* --- Multi-departemen (Fase B) ----------------------------------------- */

test("suggestTeamComposition menyusun MULTI-DEPARTEMEN saat misi lintas-domain", () => {
  const s = suggestTeamComposition(
    "Bangun organisasi AI: tim pemasaran untuk konten & iklan, tim keuangan untuk pajak & akuntansi, dan tim hukum untuk kontrak",
  );
  // Kepala Kantor = akar (m1), punya gerbang, tanpa atasan.
  assert.equal(s.members[0].role, "orchestrator");
  assert.equal(s.members[0].localId, "m1");
  assert.equal(s.members[0].parentLocalId, undefined);
  assert.ok((s.members[0].gates ?? []).length > 0, "Kepala Kantor punya gerbang");
  assert.match(s.domain, /Multi-departemen/);

  // ≥2 Ketua Tim (orchestrator ber-parent m1), tiap-tiap punya gerbang default.
  const ketua = s.members.filter((m) => m.role === "orchestrator" && m.parentLocalId === "m1");
  assert.ok(ketua.length >= 2, "minimal 2 Ketua Tim di bawah Kepala Kantor");
  for (const k of ketua) assert.ok((k.gates ?? []).length > 0, "tiap Ketua Tim punya gerbang default");

  // Tiap spesialis lapor ke salah satu Ketua Tim.
  const ketuaIds = new Set(ketua.map((k) => k.localId));
  const specialists = s.members.filter((m) => m.role !== "orchestrator");
  assert.ok(specialists.length > 0);
  for (const sp of specialists) assert.ok(ketuaIds.has(sp.parentLocalId!), "spesialis lapor ke Ketua Tim");

  // localId unik.
  const ids = new Set(s.members.map((m) => m.localId));
  assert.equal(ids.size, s.members.length);
});

test("misi satu-domain tetap satu tim DATAR (tanpa hirarki), lead punya gerbang default", () => {
  const s = suggestTeamComposition("tim pemasaran konten dan iklan");
  assert.equal(s.domain, "Pemasaran");
  assert.ok(!s.members.some((m) => m.title === "Kepala Kantor"));
  assert.equal(s.members.filter((m) => m.role === "orchestrator").length, 1);
  // Struktur tetap datar: tak ada parentLocalId di anggota mana pun.
  assert.ok(s.members.every((m) => m.parentLocalId === undefined), "tim datar: tanpa parentLocalId");
  // Lead selalu punya gerbang domain.
  assert.ok((s.members[0].gates ?? []).length > 0, "lead punya gerbang default");
  // Fase E: spesialis berfungsi-berisiko (Konten, Media Sosial & Iklan) punya gerbang per-fungsi.
  const konten = s.members.find((m) => m.title.includes("Konten"));
  const iklan = s.members.find((m) => m.title.includes("Iklan"));
  assert.ok((konten?.gates ?? []).length > 0, "Spesialis Konten punya gerbang per-fungsi");
  assert.ok((iklan?.gates ?? []).length > 0, "Spesialis Media Sosial & Iklan punya gerbang per-fungsi");
  // Spesialis advisory (SEO) tetap tanpa gerbang — hindari kebisingan.
  const seo = s.members.find((m) => m.title.includes("SEO"));
  assert.equal((seo?.gates ?? []).length, 0, "Spesialis SEO (advisory) tanpa gerbang");
});

test("Fase E: spesialis berfungsi-berisiko di tim multi-departemen tetap dapat gerbang per-fungsi", () => {
  const s = suggestTeamComposition("tim pemasaran iklan, tim keuangan pajak");
  assert.ok(s.members.some((m) => m.title === "Kepala Kantor"), "multi-departemen: ada Kepala Kantor");
  const pajak = s.members.find((m) => m.title.includes("Pajak"));
  const iklan = s.members.find((m) => m.title.includes("Iklan"));
  assert.equal(pajak?.role !== "orchestrator", true, "Spesialis Pajak bukan orchestrator");
  assert.ok((pajak?.gates ?? []).length > 0, "Spesialis Pajak punya gerbang per-fungsi di multi-departemen");
  assert.ok((iklan?.gates ?? []).length > 0, "Spesialis Iklan punya gerbang per-fungsi di multi-departemen");
});

test("string gerbang TIDAK menyertakan glyph ◆ (ditambahkan hanya saat render)", () => {
  const s = suggestTeamComposition("tim pemasaran iklan, tim keuangan pajak, tim hukum kontrak");
  for (const m of s.members) for (const g of m.gates ?? []) assert.ok(!g.includes("◆"), `gerbang tak boleh memuat ◆: "${g}"`);
});

test("paritas: setiap domain template punya gerbang default (cegah drift)", () => {
  const withGates = new Set(leadGateDomains());
  for (const d of teamTemplateDomains()) {
    assert.ok(withGates.has(d), `domain "${d}" tak punya gerbang default di DOMAIN_LEAD_GATES`);
  }
});

test("applyTeamSuggestion multi-departemen: hirarki lewat parentLocalId, lint bersih", () => {
  const mission = "tim pemasaran iklan, tim keuangan pajak, tim hukum kontrak";
  const org = createEmptyOrganizationBlueprint(mission);
  const s = suggestTeamComposition(mission);
  const next = applyTeamSuggestion(org, s);
  organizationBlueprintSchema.parse(next);

  // leadLocalId = Kepala Kantor (m1).
  assert.equal(next.structure.leadLocalId, "m1");
  // Tiap non-akar tepat satu edge.
  assert.equal(next.structure.edges.length, next.members.length - 1);
  // Ada edge dari Ketua Tim (bukan m1) → spesialis: hirarki bertingkat.
  const subEdges = next.structure.edges.filter((e) => e.fromLocalId !== "m1");
  assert.ok(subEdges.length > 0, "ada edge dari Ketua Tim ke spesialis");
  // Semua from harus orchestrator (lint bersih).
  assert.deepEqual(lintOrganizationBlueprint(next), []);
});
