import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmptyBlueprint } from "../shared/blueprint/blueprint-schema";
import { applyAnswers } from "../server/services/blueprint-engine/dialogue-engine";
import { buildMasteryProfile } from "../server/services/blueprint-engine/mastery-profile-engine";

test("buildMasteryProfile: blueprint kosong → 0 field, narasi ajakan mengisi", () => {
  const bp = createEmptyBlueprint();
  const p = buildMasteryProfile(bp);
  assert.equal(p.answeredFields, 0);
  assert.equal(p.totalFields, 22);
  assert.equal(p.completion, 0);
  assert.equal(p.gates.length, 3);
  assert.deepEqual(
    p.gates.map((g) => g.gate),
    ["dialog", "kolaborasi", "kreasi"],
  );
  // Semua field kosong → semuanya jadi growthAreas, tidak ada strengths.
  assert.equal(p.strengths.length, 0);
  assert.equal(p.growthAreas.length, 22);
  assert.match(p.narrative, /belum terisi/i);
});

test("buildMasteryProfile: refleksi parsial → hitung per-gerbang + role mapping + fokus", () => {
  let bp = createEmptyBlueprint();
  bp = applyAnswers(bp, {
    intent: "Bikin konten edukasi UMKM",
    // Gerbang 1 (Dialog): 2 field, salah satunya panjang (strength)
    "reflection.vision": "Membantu UMKM naik kelas lewat literasi keuangan yang mudah dipahami.",
    "reflection.mastered": "singkat",
    // Gerbang 2 (Kolaborasi): 1 field = painPoint → dipakai sebagai fokus
    "reflection.painPoint": "Pemilik UMKM bingung menyusun laporan keuangan sederhana.",
    // Gerbang 3 (Kreasi): role select
    "reflection.desiredRole": "pengarah",
  }).blueprint;

  const p = buildMasteryProfile(bp);
  assert.equal(p.topic, "Bikin konten edukasi UMKM");
  assert.equal(p.answeredFields, 4);

  const byGate = Object.fromEntries(p.gates.map((g) => [g.gate, g]));
  assert.equal(byGate.dialog.answered, 2);
  assert.equal(byGate.kolaborasi.answered, 1);
  assert.equal(byGate.kreasi.answered, 1);

  // Role label ramah
  assert.equal(p.role, "Pengarah");
  // Fokus dari painPoint
  assert.ok(p.focus && p.focus.includes("laporan keuangan"));

  // Jawaban panjang & role dianggap "diuraikan jelas"; "singkat" (<40 char) tidak.
  assert.ok(p.strengths.includes("visi besar"));
  assert.ok(p.strengths.includes("peran yang diinginkan"));
  assert.ok(!p.strengths.includes("hal yang sudah dikuasai"));

  // Narasi menyebut topik & bukan tes
  assert.match(p.narrative, /bukan tes/i);
});

test("buildMasteryProfile: deterministik/idempoten untuk input sama", () => {
  let bp = createEmptyBlueprint();
  bp = applyAnswers(bp, {
    "reflection.vision": "arah jangka panjang yang jelas dan bermakna bagi komunitas",
    "reflection.desiredRole": "kombinasi",
  }).blueprint;
  const a = buildMasteryProfile(bp);
  const b = buildMasteryProfile(bp);
  assert.deepEqual(a, b);
});
