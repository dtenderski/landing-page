import { test } from "node:test";
import assert from "node:assert/strict";

import { buildAgenticPrinciplesBlock } from "../server/lib/build-final-system-prompt";

/**
 * Mengunci agar toggle kapabilitas agentic BENAR-BENAR menggerakkan prompt
 * (dulu blok "PRINSIP AGENTIC AI" di-hardcode sama untuk semua agen, sehingga
 * toggle di UI = hiasan). P2: field harus berfungsi atau ditandai jujur.
 */

function agent(overrides: Record<string, any> = {}): any {
  return { ...overrides };
}

test("default (semua undefined): blok berisi prinsip default-true + retensi default", () => {
  const block = buildAgenticPrinciplesBlock(agent());
  assert.ok(block.startsWith("PRINSIP AGENTIC AI:"));
  assert.match(block, /Dengarkan dengan cermat/); // attentiveListening !== false
  assert.match(block, /koreksi dengan sopan/); // selfCorrection !== false
  assert.match(block, /langkah-langkah penalaran/); // multiStepReasoning !== false
  assert.match(block, /empati/); // emotionalIntelligence !== false
  // proactiveAssistance default false → TIDAK ada
  assert.doesNotMatch(block, /Proaktif memberikan saran/);
});

test("emotionalIntelligence=false → baris empati hilang (toggle berfungsi)", () => {
  const block = buildAgenticPrinciplesBlock(agent({ emotionalIntelligence: false }));
  assert.doesNotMatch(block, /empati/);
});

test("proactiveAssistance=true → baris proaktif muncul", () => {
  const block = buildAgenticPrinciplesBlock(agent({ proactiveAssistance: true }));
  assert.match(block, /Proaktif memberikan saran/);
});

test("contextRetention angka → disebut dalam blok; 0/null → tidak ada baris konteks", () => {
  assert.match(buildAgenticPrinciplesBlock(agent({ contextRetention: 25 })), /hingga 25 pesan/);
  assert.doesNotMatch(buildAgenticPrinciplesBlock(agent({ contextRetention: 0 })), /pesan percakapan sebelumnya/);
});

test("semua kapabilitas mati → blok kosong (tak ada teks hiasan)", () => {
  const block = buildAgenticPrinciplesBlock(
    agent({
      attentiveListening: false,
      selfCorrection: false,
      multiStepReasoning: false,
      emotionalIntelligence: false,
      proactiveAssistance: false,
      contextRetention: 0,
    }),
  );
  assert.equal(block, "");
});
