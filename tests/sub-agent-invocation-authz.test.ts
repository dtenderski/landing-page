import { test } from "node:test";
import assert from "node:assert/strict";

import { canInvokeSubAgent } from "../server/lib/agent-authz";

// Gerbang inter-agen (catatan keamanan): orkestrator satu user TIDAK boleh
// memanggil agen PRIVAT milik user lain. Divisi sistem/bersama & agen publik
// tetap boleh supaya model jual (salinan pembeli → divisi bersama) tidak rusak.

test("konteks server tepercaya (callerOwnerId undefined) → boleh apa pun", () => {
  assert.equal(canInvokeSubAgent({ subAgentOwnerId: "victim", subAgentIsPublic: false }), true);
});

test("sub-agen sistem/bersama tanpa pemilik → boleh (divisi siap-jual)", () => {
  assert.equal(canInvokeSubAgent({ callerOwnerId: "buyer", subAgentOwnerId: null }), true);
  assert.equal(canInvokeSubAgent({ callerOwnerId: "buyer", subAgentOwnerId: "" }), true);
});

test("orkestrator sistem (callerOwnerId null) memanggil divisi sistem → boleh", () => {
  assert.equal(canInvokeSubAgent({ callerOwnerId: null, subAgentOwnerId: null }), true);
});

test("sub-agen publik → boleh walau pemilik beda", () => {
  assert.equal(canInvokeSubAgent({ callerOwnerId: "u1", subAgentOwnerId: "u2", subAgentIsPublic: true }), true);
});

test("pemilik sama (creator merangkai timnya) → boleh", () => {
  assert.equal(canInvokeSubAgent({ callerOwnerId: "creator", subAgentOwnerId: "creator", subAgentIsPublic: false }), true);
});

test("SERANGAN: orkestrator user A memanggil agen PRIVAT user B → DITOLAK", () => {
  assert.equal(canInvokeSubAgent({ callerOwnerId: "attacker", subAgentOwnerId: "victim", subAgentIsPublic: false }), false);
});

test("orkestrator sistem memanggil agen PRIVAT user → DITOLAK", () => {
  assert.equal(canInvokeSubAgent({ callerOwnerId: null, subAgentOwnerId: "victim", subAgentIsPublic: false }), false);
});
