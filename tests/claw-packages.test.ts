import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLAW_PACKAGES,
  clawPackageNames,
  formatClawCatalogForPrompt,
  resolveClawPackageName,
} from "../shared/claw-packages";

test("formatClawCatalogForPrompt lists every package name + description", () => {
  const text = formatClawCatalogForPrompt();
  for (const p of CLAW_PACKAGES) {
    assert.ok(text.includes(p.name), `katalog memuat nama paket: ${p.name}`);
  }
  assert.equal(text.split("\n").length, CLAW_PACKAGES.length);
});

test("resolveClawPackageName: exact package name (case-insensitive)", () => {
  assert.equal(resolveClawPackageName("K3 & Keselamatan"), "K3 & Keselamatan");
  assert.equal(resolveClawPackageName("k3 & keselamatan"), "K3 & Keselamatan");
});

test("resolveClawPackageName: claw inside description maps to its package", () => {
  // "SKK K3" muncul di deskripsi paket "K3 & Keselamatan"
  assert.equal(resolveClawPackageName("SKK K3"), "K3 & Keselamatan");
});

test("resolveClawPackageName: hallucinated / out-of-catalog names rejected", () => {
  assert.equal(resolveClawPackageName("Departemen Sihir"), null);
  assert.equal(resolveClawPackageName(""), null);
  assert.equal(resolveClawPackageName("   "), null);
});

test("resolveClawPackageName output always a valid catalog name", () => {
  const valid = new Set(clawPackageNames());
  for (const probe of ["Marketing", "K3", "Perizinan", "ISO 37001"]) {
    const r = resolveClawPackageName(probe);
    if (r !== null) assert.ok(valid.has(r), `hasil valid utk "${probe}": ${r}`);
  }
});
