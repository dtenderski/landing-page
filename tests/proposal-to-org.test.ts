import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proposalTeamToOrgMembers,
  dialogBlueprintToOrgDraft,
  type ProposalTeamMember,
} from "../shared/proposal-to-org.ts";

const noGlyph = (seeds: ReturnType<typeof proposalTeamToOrgMembers>) => {
  for (const m of seeds) for (const g of m.gates ?? []) assert.ok(!g.includes("◆"), `gerbang memuat ◆: "${g}"`);
};
const idsUnique = (seeds: ReturnType<typeof proposalTeamToOrgMembers>) => {
  const ids = new Set(seeds.map((m) => m.localId));
  assert.equal(ids.size, seeds.length);
};

test("kosong / tak valid → []", () => {
  assert.deepEqual(proposalTeamToOrgMembers([]), []);
  assert.deepEqual(proposalTeamToOrgMembers(undefined as any), []);
  assert.deepEqual(proposalTeamToOrgMembers([{ peran: "", tugas: "x" }] as ProposalTeamMember[]), []);
});

test("satu tim → DATAR: Ketua Tim + spesialis (tanpa parentLocalId), gerbang dipetakan", () => {
  const tim: ProposalTeamMember[] = [
    { tim: "Tim Marketing", peran: "Ketua Tim Marketing", tugas: "Memimpin", gerbang: "Anggaran iklan besar — disetujui founder." },
    { tim: "Tim Marketing", peran: "Penulis Konten", tugas: "Menulis konten", gerbang: "-" },
    { tim: "Tim Marketing", peran: "Analis Iklan", tugas: "Analisis kinerja", gerbang: "" },
  ];
  const s = proposalTeamToOrgMembers(tim);
  assert.equal(s.length, 3);
  assert.equal(s[0].role, "orchestrator");
  assert.equal(s[0].title, "Ketua Tim Marketing");
  assert.ok(s.every((m) => m.parentLocalId === undefined), "tim datar: tanpa parentLocalId");
  assert.deepEqual(s[0].gates, ["Anggaran iklan besar — disetujui founder."]);
  assert.equal(s[1].role, "specialist");
  assert.equal(s[1].gates, undefined, "gerbang '-' → tanpa gerbang");
  assert.equal(s[2].gates, undefined, "gerbang kosong → tanpa gerbang");
  idsUnique(s);
  noGlyph(s);
});

test("gerbang dengan glyph ◆ di tengah dibersihkan seluruhnya", () => {
  const s = proposalTeamToOrgMembers([
    { tim: "Kantor", peran: "Kepala Kantor", tugas: "koordinasi", gerbang: "Keputusan ◆ final ke ◆ klien" },
    { tim: "Tim A", peran: "Ketua A", tugas: "x" },
    { tim: "Tim B", peran: "Ketua B", tugas: "y" },
  ]);
  assert.deepEqual(s[0].gates, ["Keputusan final ke klien"]);
  noGlyph(s);
});

test("tanpa penanda Ketua → anggota pertama jadi lead", () => {
  const s = proposalTeamToOrgMembers([
    { tim: "Tim A", peran: "Spesialis Satu", tugas: "a" },
    { tim: "Tim A", peran: "Spesialis Dua", tugas: "b" },
  ]);
  assert.equal(s[0].role, "orchestrator");
  assert.equal(s[0].title, "Spesialis Satu");
  assert.equal(s[1].role, "specialist");
});

test("≥2 tim dengan Kepala Kantor eksplisit → 3 tingkat berjenjang", () => {
  const tim: ProposalTeamMember[] = [
    { tim: "Kantor", peran: "Kepala Kantor", tugas: "Koordinasi lintas-tim", gerbang: "◆ Keputusan final ke klien — founder." },
    { tim: "Tim Marketing", peran: "Ketua Tim Marketing", tugas: "Pimpin marketing" },
    { tim: "Tim Marketing", peran: "Penulis Konten", tugas: "Tulis konten" },
    { tim: "Tim Keuangan", peran: "Ketua Tim Keuangan", tugas: "Pimpin keuangan", gerbang: "Laporan pajak final — akuntan manusia." },
    { tim: "Tim Keuangan", peran: "Analis Pajak", tugas: "Hitung pajak" },
  ];
  const s = proposalTeamToOrgMembers(tim);
  // m1 = Kepala Kantor (dari entri eksplisit), akar tanpa parent, gerbang bersih (tanpa ◆).
  assert.equal(s[0].localId, "m1");
  assert.equal(s[0].role, "orchestrator");
  assert.equal(s[0].title, "Kepala Kantor");
  assert.equal(s[0].parentLocalId, undefined);
  assert.deepEqual(s[0].gates, ["Keputusan final ke klien — founder."]);

  // 2 Ketua Tim (orchestrator) ber-parent m1, tiap-tiap punya spesialis.
  const ketua = s.filter((m) => m.role === "orchestrator" && m.parentLocalId === "m1");
  assert.equal(ketua.length, 2);
  const ketuaIds = new Set(ketua.map((k) => k.localId));
  const specialists = s.filter((m) => m.role === "specialist");
  assert.equal(specialists.length, 2);
  for (const sp of specialists) assert.ok(ketuaIds.has(sp.parentLocalId!), "spesialis lapor ke Ketua Tim");
  idsUnique(s);
  noGlyph(s);
});

test("≥2 tim TANPA Kepala Kantor → puncak disintesis + gerbang default", () => {
  const s = proposalTeamToOrgMembers([
    { tim: "Tim Marketing", peran: "Ketua Marketing", tugas: "x" },
    { tim: "Tim Marketing", peran: "Penulis", tugas: "y" },
    { tim: "Tim Hukum", peran: "Ketua Hukum", tugas: "z" },
    { tim: "Tim Hukum", peran: "Reviewer Kontrak", tugas: "w" },
  ]);
  assert.equal(s[0].title, "Kepala Kantor");
  assert.equal(s[0].parentLocalId, undefined);
  assert.ok((s[0].gates ?? []).length > 0, "puncak sintetis punya gerbang default");
  noGlyph(s);
});

test("multi-departemen: tim beranggota tunggal → spesialis langsung di bawah Kepala Kantor", () => {
  const s = proposalTeamToOrgMembers([
    { tim: "Tim Marketing", peran: "Ketua Marketing", tugas: "x" },
    { tim: "Tim Marketing", peran: "Penulis", tugas: "y" },
    { tim: "Tim Solo", peran: "Spesialis Tunggal", tugas: "z" },
  ]);
  const solo = s.find((m) => m.title === "Spesialis Tunggal")!;
  assert.equal(solo.role, "specialist");
  assert.equal(solo.parentLocalId, "m1", "tim tunggal → spesialis di bawah puncak, bukan Ketua tanpa bawahan");
});

// ── dialogBlueprintToOrgDraft (Dialog → Organization Builder bridge) ───────────
test("dialogBlueprintToOrgDraft: builds a single-orchestrator org seed from a blueprint", () => {
  const draft = dialogBlueprintToOrgDraft({
    namaChatbot: "Asisten Toko Roti",
    persona: "Ramah dan cekatan menjawab pertanyaan pelanggan.",
    targetPengguna: "Pembeli toko roti",
    ringkasan: "Chatbot untuk menjawab jam buka, menu, dan harga.",
  });
  assert.equal(draft.members.length, 1);
  assert.equal(draft.members[0].role, "orchestrator");
  assert.equal(draft.members[0].title, "Asisten Toko Roti");
  assert.equal(draft.orgName, "Tim Asisten Toko Roti");
  assert.match(draft.mission, /jam buka/);
  assert.match(draft.mission, /Target pengguna:/);
  assert.ok(draft.maxSpecialists >= 1 && draft.maxSpecialists <= 5);
});

test("dialogBlueprintToOrgDraft: falls back gracefully when fields are missing", () => {
  const draft = dialogBlueprintToOrgDraft({});
  assert.equal(draft.members.length, 1);
  assert.equal(draft.members[0].title, "Asisten AI");
  assert.ok(draft.orgName.length > 0);
  assert.ok(draft.mission.length > 0);
  assert.ok(draft.members[0].responsibility.length > 0);
});

test("dialogBlueprintToOrgDraft: clamps overly long strings", () => {
  const long = "x".repeat(1000);
  const draft = dialogBlueprintToOrgDraft({ namaChatbot: long, ringkasan: long, persona: long });
  assert.ok(draft.orgName.length <= 120);
  assert.ok(draft.mission.length <= 600);
  assert.ok(draft.members[0].title.length <= 120);
  assert.ok(draft.members[0].responsibility.length <= 600);
});
