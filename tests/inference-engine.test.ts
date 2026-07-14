import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyBlueprint,
  lintBlueprintFieldMeta,
} from "../shared/blueprint/blueprint-schema";
import {
  inferBlueprint,
  INFERENCE_RULES,
} from "../server/services/blueprint-engine/inference-engine";

function bpWithIntent(intent: string) {
  const bp = createEmptyBlueprint(intent);
  return bp;
}

test("inferBlueprint: deterministik dari intent saja → mengisi field turunan + evidence", () => {
  const bp = bpWithIntent(
    "Asisten konsultan SBU konstruksi untuk membantu BUJK mengurus sertifikat berdasarkan regulasi Permen PU",
  );
  bp.modules.identity.data.name = "SBU Advisor";
  bp.modules.identity.fieldMeta["name"] = { source: "user", confidence: 1, needsConfirmation: false };

  const { blueprint, inferences, stats } = inferBlueprint(bp);

  assert.ok(stats.written > 0);
  // slug deterministik dari nama
  assert.equal(blueprint.modules.identity.data.slug, "sbu-advisor");
  // kategori tersimpulkan = Konstruksi
  assert.equal(blueprint.modules.identity.data.category, "Konstruksi");
  // RAG menyala karena ada kata "regulasi/permen"
  assert.equal(blueprint.modules.knowledge.data.ragEnabled, true);
  // setiap inferensi punya alasan
  for (const log of inferences) {
    assert.ok(log.evidence && log.evidence.length > 0, `inferensi ${log.ruleId} wajib punya evidence`);
    assert.equal(typeof log.confidence, "number");
  }
});

test("inferBlueprint: TIDAK menimpa nilai dari user", () => {
  const bp = bpWithIntent("toko bunga online");
  bp.modules.identity.data.slug = "slug-pilihan-saya";
  bp.modules.identity.fieldMeta["slug"] = { source: "user", confidence: 1, needsConfirmation: false };
  bp.modules.identity.data.name = "Florist";

  const { blueprint, trace } = inferBlueprint(bp);
  assert.equal(blueprint.modules.identity.data.slug, "slug-pilihan-saya");
  const slugLog = trace.find((t) => t.ruleId === "identity.slug");
  assert.equal(slugLog?.action, "skipped-user");
});

test("inferBlueprint: tidak menimpa nilai non-inferred yang sudah ada (dianggap otoritatif)", () => {
  const bp = bpWithIntent("klinik gigi");
  // nilai ada tapi tanpa fieldMeta (asal tak diketahui) → jangan ditimpa
  bp.modules.identity.data.language = "en";
  const { blueprint, trace } = inferBlueprint(bp);
  assert.equal(blueprint.modules.identity.data.language, "en");
  assert.equal(trace.find((t) => t.ruleId === "identity.language")?.action, "skipped-present");
});

test("confidence & needsConfirmation: field pasti (slug) tak butuh konfirmasi; tebakan (description) butuh", () => {
  const bp = bpWithIntent("Bantu mahasiswa menulis skripsi teknik sipil");
  bp.modules.identity.data.name = "Skripsi Helper";
  const { blueprint } = inferBlueprint(bp);

  const slugMeta = blueprint.modules.identity.fieldMeta["slug"];
  assert.equal(slugMeta?.source, "inferred");
  assert.equal(slugMeta?.needsConfirmation, false);

  const descMeta = blueprint.modules.identity.fieldMeta["description"];
  assert.equal(descMeta?.source, "inferred");
  assert.equal(descMeta?.needsConfirmation, true, "deskripsi confidence rendah → wajib dikonfirmasi");
});

test("idempoten: menjalankan inferBlueprint dua kali menghasilkan Blueprint yang sama", () => {
  const bp = bpWithIntent("Konsultan pajak UMKM, bantu hitung PPh dan lapor SPT");
  bp.modules.identity.data.name = "PajakBot";
  const once = inferBlueprint(bp).blueprint;
  const twice = inferBlueprint(once).blueprint;
  assert.deepEqual(twice, once);
});

test("immutability: Blueprint input tidak dimutasi", () => {
  const bp = bpWithIntent("layanan rekrutmen dan onboarding karyawan");
  bp.modules.identity.data.name = "HRpal";
  inferBlueprint(bp);
  assert.equal(bp.modules.identity.data.slug, undefined);
  assert.equal(bp.modules.identity.data.category, undefined);
});

test("minConfidenceToWrite: ambang sangat tinggi → tidak ada yang ditulis", () => {
  const bp = bpWithIntent("asisten umum");
  bp.modules.identity.data.name = "Asisten";
  const { stats, trace } = inferBlueprint(bp, { minConfidenceToWrite: 0.99 });
  assert.equal(stats.written, 0);
  assert.ok(trace.some((t) => t.action === "skipped-low-confidence"));
});

test("validitas struktur: semua fieldMeta hasil inferensi lolos lintBlueprintFieldMeta (field & modul valid)", () => {
  // Jalankan dengan ambang rendah agar SEMUA aturan berkesempatan menulis,
  // sehingga lint mengecek setiap pasangan modul/field di bank aturan.
  const bp = bpWithIntent(
    "Asisten hukum kontrak yang menjawab berdasarkan dokumen regulasi dan membantu closing klien",
  );
  bp.modules.identity.data.name = "Lex";
  bp.modules.orchestration.data.isOrchestrator = true;
  const { blueprint } = inferBlueprint(bp, { minConfidenceToWrite: 0 });
  const warnings = lintBlueprintFieldMeta(blueprint);
  assert.deepEqual(warnings, [], `lint harus bersih, tapi: ${JSON.stringify(warnings)}`);
});

test("temperature: nada profesional → 0.3, santai → 0.8", () => {
  const proBp = bpWithIntent("firma hukum");
  proBp.modules.identity.data.name = "Pro";
  const pro = inferBlueprint(proBp).blueprint;
  assert.equal(pro.modules.identity.data.toneOfVoice, "profesional");
  assert.equal(pro.modules.aiEngine.data.temperature, 0.3);

  const mktBp = bpWithIntent("agensi pemasaran konten media sosial");
  mktBp.modules.identity.data.name = "Mkt";
  const mkt = inferBlueprint(mktBp).blueprint;
  assert.equal(mkt.modules.identity.data.toneOfVoice, "santai");
  assert.equal(mkt.modules.aiEngine.data.temperature, 0.8);
});

test("systemPrompt: tersusun dari identitas + tujuan + kebijakan", () => {
  const bp = bpWithIntent("asisten layanan pelanggan");
  bp.modules.identity.data.name = "CSbot";
  bp.modules.identity.data.expertise = ["FAQ produk", "komplain"];
  bp.modules.goals.data.primaryOutcome = "menyelesaikan keluhan tanpa eskalasi";
  bp.modules.policy.data.riskCompliance = "tidak menjanjikan refund tanpa persetujuan";

  const { blueprint } = inferBlueprint(bp);
  const sp = blueprint.modules.aiEngine.data.systemPrompt as string;
  assert.ok(sp.includes("CSbot"));
  assert.ok(sp.includes("FAQ produk"));
  assert.ok(sp.includes("menyelesaikan keluhan tanpa eskalasi"));
  assert.ok(sp.includes("tidak menjanjikan refund tanpa persetujuan"));
  assert.equal(blueprint.modules.aiEngine.fieldMeta["systemPrompt"]?.needsConfirmation, true);
});

test("overwriteInferred=false: field yang sudah 'inferred' tidak disempurnakan ulang", () => {
  const bp = bpWithIntent("firma hukum kontrak");
  bp.modules.identity.data.name = "Lex";
  // tanam nilai inferred lama yang sengaja berbeda dari hasil deterministik
  bp.modules.identity.data.slug = "slug-lama";
  bp.modules.identity.fieldMeta["slug"] = {
    source: "inferred",
    confidence: 0.4,
    needsConfirmation: true,
  };
  const { blueprint, trace } = inferBlueprint(bp, { overwriteInferred: false });
  assert.equal(blueprint.modules.identity.data.slug, "slug-lama");
  assert.equal(trace.find((t) => t.ruleId === "identity.slug")?.action, "skipped-present");
});

test("word-boundary matching: 'audit' TIDAK memicu kategori Teknologi via kata kunci 'it'", () => {
  const bp = bpWithIntent("jasa audit keuangan dan laporan SPT perusahaan");
  bp.modules.identity.data.name = "Auditor";
  const { blueprint } = inferBlueprint(bp);
  assert.equal(blueprint.modules.identity.data.category, "Keuangan & Pajak");
});

test("maxPasses: 1 lintasan cukup untuk rantai kategori→nada→temperature (urutan aturan benar)", () => {
  const bp = bpWithIntent("agensi pemasaran konten media sosial");
  bp.modules.identity.data.name = "Mkt";
  const onePass = inferBlueprint(bp, { maxPasses: 1 }).blueprint;
  // kategori → nada → temperature semua terisi dalam 1 lintasan karena urutan aturan benar
  assert.equal(onePass.modules.identity.data.category, "Pemasaran");
  assert.equal(onePass.modules.identity.data.toneOfVoice, "santai");
  assert.equal(onePass.modules.aiEngine.data.temperature, 0.8);
});

test("INFERENCE_RULES: id unik", () => {
  const seen = new Set<string>();
  for (const r of INFERENCE_RULES) {
    assert.ok(!seen.has(r.id), `id aturan duplikat: ${r.id}`);
    seen.add(r.id);
  }
});
