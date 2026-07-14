import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyScalevWebhookAuth } from "../server/lib/meta-capi";

const RAW = Buffer.from(JSON.stringify({ data: { payment_status: "paid" } }));

function reset() {
  delete process.env.SCALEV_WEBHOOK_SECRET;
  delete process.env.SCALEV_SIGNING_SECRET;
  delete process.env.SCALEV_SIGNATURE_STRICT;
}

test("no secrets configured → accept (legacy, non-breaking)", () => {
  reset();
  const r = verifyScalevWebhookAuth(RAW, {}, {});
  assert.equal(r.authorized, true);
  assert.equal(r.method, "none-configured");
});

test("shared secret: valid via query & header accepted; wrong/missing rejected", () => {
  reset();
  process.env.SCALEV_WEBHOOK_SECRET = "s3cr3t";
  assert.equal(verifyScalevWebhookAuth(RAW, {}, { secret: "s3cr3t" }).authorized, true);
  assert.equal(verifyScalevWebhookAuth(RAW, { "x-scalev-secret": "s3cr3t" }, {}).authorized, true);
  assert.equal(verifyScalevWebhookAuth(RAW, {}, {}).authorized, false);
  assert.equal(verifyScalevWebhookAuth(RAW, { "x-scalev-secret": "wrong" }, {}).authorized, false);
  reset();
});

test("signing secret only + valid HMAC hex → accept via signature", () => {
  reset();
  process.env.SCALEV_SIGNING_SECRET = "signkey";
  const hex = createHmac("sha256", "signkey").update(RAW).digest("hex");
  const r = verifyScalevWebhookAuth(RAW, { "x-signature": hex }, {});
  assert.equal(r.authorized, true);
  assert.equal(r.method, "signature");
  assert.equal(r.sigValid, true);
  reset();
});

test("signing secret only + valid HMAC base64 with sha256= prefix → accept", () => {
  reset();
  process.env.SCALEV_SIGNING_SECRET = "signkey";
  const b64 = createHmac("sha256", "signkey").update(RAW).digest("base64");
  const r = verifyScalevWebhookAuth(RAW, { "x-scalev-signature": "sha256=" + b64 }, {});
  assert.equal(r.authorized, true);
  assert.equal(r.method, "signature");
  reset();
});

test("signing secret only + wrong signature → observe (accept + flag), NOT drop", () => {
  reset();
  process.env.SCALEV_SIGNING_SECRET = "signkey";
  const r = verifyScalevWebhookAuth(RAW, { "x-signature": "deadbeef" }, {});
  assert.equal(r.authorized, true);
  assert.equal(r.method, "observe");
  reset();
});

test("signing secret only + STRICT + wrong signature → reject", () => {
  reset();
  process.env.SCALEV_SIGNING_SECRET = "signkey";
  process.env.SCALEV_SIGNATURE_STRICT = "true";
  const r = verifyScalevWebhookAuth(RAW, { "x-signature": "deadbeef" }, {});
  assert.equal(r.authorized, false);
  assert.equal(r.method, "rejected");
  reset();
});

test("both secrets: signature invalid but shared secret valid → accept (shared authoritative)", () => {
  reset();
  process.env.SCALEV_WEBHOOK_SECRET = "s3cr3t";
  process.env.SCALEV_SIGNING_SECRET = "signkey";
  const r = verifyScalevWebhookAuth(RAW, { "x-signature": "deadbeef" }, { secret: "s3cr3t" });
  assert.equal(r.authorized, true);
  assert.equal(r.method, "shared-secret");
  reset();
});

test("both secrets: neither valid → reject", () => {
  reset();
  process.env.SCALEV_WEBHOOK_SECRET = "s3cr3t";
  process.env.SCALEV_SIGNING_SECRET = "signkey";
  const r = verifyScalevWebhookAuth(RAW, { "x-signature": "deadbeef" }, {});
  assert.equal(r.authorized, false);
  reset();
});
