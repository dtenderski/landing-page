import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPatchPreview } from "../server/services/blueprint-engine/configuration-engine";

/**
 * Mengunci pratinjau "review-before-create": user harus melihat nilai SUBSTANTIF
 * yang akan ditulis (nama/deskripsi/model/persona), TANPA membocorkan kredensial
 * atau endpoint sensitif, dan tanpa membanjiri UI dengan blob besar / struktur
 * kompleks.
 *
 * DESAIN KEAMANAN: allowlist (bukan denylist). Kunci yang tidak dikenal dibuang
 * default → field sensitif baru tak otomatis bocor.
 */

test("memuat field presentasional substantif (string/number)", () => {
  const out = buildPatchPreview({
    name: "Asisten Hukum",
    description: "Bantu urusan kontrak",
    aiModel: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2048,
  });
  assert.equal(out.name, "Asisten Hukum");
  assert.equal(out.description, "Bantu urusan kontrak");
  assert.equal(out.aiModel, "gpt-4o-mini");
  assert.equal(out.temperature, "0.7");
  assert.equal(out.maxTokens, "2048");
});

test("KEAMANAN: field kredensial/endpoint sensitif dibuang (tak ada di allowlist)", () => {
  const out = buildPatchPreview({
    name: "X",
    customApiKey: "sk-RAHASIA",
    customBaseUrl: "https://user:pass@internal.host/v1",
    customModelName: "internal-model",
    accessToken: "tok_123",
    userId: "u-1",
    allowedDomains: ["a.com"],
  });
  assert.deepEqual(Object.keys(out), ["name"]);
  assert.ok(!("customApiKey" in out), "customApiKey wajib dibuang");
  assert.ok(!("customBaseUrl" in out), "customBaseUrl (bisa memuat kredensial/endpoint internal) wajib dibuang");
  assert.ok(!("customModelName" in out), "customModelName wajib dibuang");
  assert.ok(!("accessToken" in out), "accessToken wajib dibuang");
  assert.ok(!("userId" in out), "userId wajib dibuang");
});

test("KEAMANAN: kunci tak dikenal apa pun dibuang default (allowlist, bukan denylist)", () => {
  const out = buildPatchPreview({
    name: "X",
    webhookUrl: "https://hook/abc?token=xyz",
    connectionString: "postgres://u:p@h/db",
    signedUrl: "https://s3/...&Signature=abc",
    someFutureSecretField: "leak",
  });
  assert.deepEqual(Object.keys(out), ["name"]);
});

test("string kosong/whitespace & null/undefined dilewati (pakai kunci allowlist)", () => {
  const out = buildPatchPreview({ name: "", description: "   ", category: null, tagline: undefined, personality: "ok" });
  assert.deepEqual(Object.keys(out), ["personality"]);
});

test("array/objek pada kunci allowlist tetap dilewati (hanya primitif)", () => {
  const out = buildPatchPreview({
    name: "X",
    expertise: ["a", "b"], // bukan allowlist + array
    conversationStarters: ["hai"], // bukan allowlist + array
  });
  assert.deepEqual(Object.keys(out), ["name"]);
});

test("string panjang dipotong dengan ellipsis di 200 char", () => {
  const long = "a".repeat(250);
  const out = buildPatchPreview({ systemPrompt: long });
  assert.equal(out.systemPrompt.length, 201); // 200 + "…"
  assert.ok(out.systemPrompt.endsWith("…"));
});
