import { test } from "node:test";
import assert from "node:assert/strict";

import { buildFinalSystemPrompt } from "../server/lib/build-final-system-prompt";

type AnyAgent = Parameters<typeof buildFinalSystemPrompt>[0];

function makeAgent(overrides: Partial<Record<string, unknown>> = {}): AnyAgent {
  const base = {
    id: "agent-test",
    name: "Tester",
    systemPrompt: "Kamu adalah Tester.",
    tagline: null,
    philosophy: null,
    personality: null,
    communicationStyle: null,
    toneOfVoice: null,
    primaryOutcome: "",
    conversationWinConditions: "",
    brandVoiceSpec: "",
    interactionPolicy: "",
    domainCharter: "",
    qualityBar: "",
    riskCompliance: "",
    reasoningPolicy: "",
    executionGatePolicy: "",
  };
  return { ...base, ...overrides } as unknown as AnyAgent;
}

test("buildFinalSystemPrompt: section header lengkap saat semua field Kebijakan Agen terisi", () => {
  const agent = makeAgent({
    primaryOutcome: "Bantu user lulus uji kompetensi.",
    conversationWinConditions: "User mendaftar paket kursus.",
    brandVoiceSpec: "Profesional, hangat, ringkas.",
    interactionPolicy: "Selalu konfirmasi pemahaman user dulu.",
    reasoningPolicy: "Langkah demi langkah dengan asumsi eksplisit.",
    domainCharter: "Hanya menjawab seputar sertifikasi LSP.",
    qualityBar: "Sumber dari regulasi resmi, tidak berhalusinasi.",
    riskCompliance: "Jangan beri saran hukum tanpa disclaimer.",
    executionGatePolicy: "Konfirmasi sebelum write ke DB.",
  });

  const prompt = buildFinalSystemPrompt(agent);

  const expectedHeaders = [
    "=== PERSONA ===",
    "=== PRIMARY OUTCOME (TUJUAN UTAMA) ===",
    "=== WIN CONDITIONS (KONDISI MENANG PERCAKAPAN) ===",
    "=== BRAND VOICE (WAJIB DIPATUHI) ===",
    "=== INTERACTION RULES ===",
    "=== DOMAIN BOUNDARIES (BATAS TOPIK) ===",
    "=== QUALITY STANDARDS ===",
    "=== COMPLIANCE & RISK ===",
  ];

  for (const header of expectedHeaders) {
    assert.ok(
      prompt.includes(header),
      `Prompt harus berisi header "${header}".\n--- Prompt ---\n${prompt}`,
    );
  }

  assert.ok(prompt.includes("Bantu user lulus uji kompetensi."));
  assert.ok(prompt.includes("User mendaftar paket kursus."));
  assert.ok(prompt.includes("Profesional, hangat, ringkas."));
  assert.ok(prompt.includes("Selalu konfirmasi pemahaman user dulu."));
  assert.ok(prompt.includes("Langkah demi langkah dengan asumsi eksplisit."));
  assert.ok(prompt.includes("Hanya menjawab seputar sertifikasi LSP."));
  assert.ok(prompt.includes("Sumber dari regulasi resmi, tidak berhalusinasi."));
  assert.ok(prompt.includes("Jangan beri saran hukum tanpa disclaimer."));
  assert.ok(prompt.includes("Konfirmasi sebelum write ke DB."));
});

test("buildFinalSystemPrompt: section opsional di-skip saat field-nya kosong", () => {
  const agent = makeAgent({
    primaryOutcome: "",
    conversationWinConditions: "",
    brandVoiceSpec: "",
    interactionPolicy: "",
    reasoningPolicy: "",
    domainCharter: "",
    qualityBar: "",
    riskCompliance: "",
    executionGatePolicy: "",
  });

  const prompt = buildFinalSystemPrompt(agent);

  assert.ok(prompt.includes("=== PERSONA ==="), "PERSONA harus selalu muncul");

  const skippedHeaders = [
    "=== PRIMARY OUTCOME (TUJUAN UTAMA) ===",
    "=== WIN CONDITIONS (KONDISI MENANG PERCAKAPAN) ===",
    "=== BRAND VOICE (WAJIB DIPATUHI) ===",
    "=== INTERACTION RULES ===",
    "=== DOMAIN BOUNDARIES (BATAS TOPIK) ===",
    "=== QUALITY STANDARDS ===",
    "=== COMPLIANCE & RISK ===",
  ];

  for (const header of skippedHeaders) {
    assert.ok(
      !prompt.includes(header),
      `Header "${header}" tidak boleh muncul saat field kosong, tapi muncul di:\n${prompt}`,
    );
  }
});

test("buildFinalSystemPrompt: field whitespace-only diperlakukan sebagai kosong", () => {
  const agent = makeAgent({
    brandVoiceSpec: "   \n  ",
    qualityBar: "\t",
  });

  const prompt = buildFinalSystemPrompt(agent);

  assert.ok(!prompt.includes("=== BRAND VOICE"));
  assert.ok(!prompt.includes("=== QUALITY STANDARDS"));
});

test("buildFinalSystemPrompt: instruksi penolakan domain ikut tertulis saat domainCharter ada", () => {
  const agent = makeAgent({
    domainCharter: "Hanya menjawab seputar sertifikasi LSP.",
  });

  const prompt = buildFinalSystemPrompt(agent);

  assert.ok(prompt.includes("=== DOMAIN BOUNDARIES (BATAS TOPIK) ==="));
  assert.ok(prompt.includes("Hanya menjawab seputar sertifikasi LSP."));
  assert.ok(
    prompt.includes("WAJIB menolak"),
    "Prompt harus berisi instruksi WAJIB menolak saat di luar domain",
  );
  assert.ok(
    prompt.includes("Jangan pernah menjawab di luar batas domain"),
    "Prompt harus melarang menjawab di luar batas domain",
  );
});

test("buildFinalSystemPrompt: INTERACTION RULES menggabungkan reasoningPolicy + interactionPolicy", () => {
  const agent = makeAgent({
    reasoningPolicy: "Berpikir terstruktur.",
    interactionPolicy: "Konfirmasi tiap langkah.",
  });

  const prompt = buildFinalSystemPrompt(agent);

  assert.ok(prompt.includes("=== INTERACTION RULES ==="));
  assert.ok(prompt.includes("Cara penalaran: Berpikir terstruktur."));
  assert.ok(prompt.includes("Aturan interaksi: Konfirmasi tiap langkah."));
});

test("buildFinalSystemPrompt: COMPLIANCE & RISK menggabungkan riskCompliance + executionGatePolicy", () => {
  const agent = makeAgent({
    riskCompliance: "Jangan keluarkan PII.",
    executionGatePolicy: "Konfirmasi untuk write.",
  });

  const prompt = buildFinalSystemPrompt(agent);

  assert.ok(prompt.includes("=== COMPLIANCE & RISK ==="));
  assert.ok(prompt.includes("Jangan keluarkan PII."));
  assert.ok(prompt.includes("Gate eksekusi tindakan: Konfirmasi untuk write."));
  assert.ok(prompt.includes("WAJIB"));
});

test("buildFinalSystemPrompt: PERSONA selalu memuat systemPrompt dan kombinasi tagline/personality", () => {
  const agent = makeAgent({
    systemPrompt: "Kamu adalah asisten resmi Aspekindo.",
    tagline: "Mitra perizinan terpercaya.",
    philosophy: "Selalu patuh regulasi.",
    personality: "Tegas namun ramah.",
    communicationStyle: "Formal-baku.",
    toneOfVoice: "Hangat.",
  });

  const prompt = buildFinalSystemPrompt(agent);

  assert.ok(prompt.startsWith("=== PERSONA ==="));
  assert.ok(prompt.includes("Kamu adalah asisten resmi Aspekindo."));
  assert.ok(prompt.includes("Mitra perizinan terpercaya."));
  assert.ok(prompt.includes("Filosofi: Selalu patuh regulasi."));
  assert.ok(prompt.includes("Kepribadian: Tegas namun ramah."));
  assert.ok(prompt.includes("Gaya komunikasi: Formal-baku."));
  assert.ok(prompt.includes("Nada suara: Hangat."));
});

test("buildFinalSystemPrompt: PERSONA fallback ke nama agen saat systemPrompt kosong", () => {
  const agent = makeAgent({ systemPrompt: "", name: "Aspek" });
  const prompt = buildFinalSystemPrompt(agent);
  assert.ok(prompt.includes("Kamu adalah Aspek."));
});
