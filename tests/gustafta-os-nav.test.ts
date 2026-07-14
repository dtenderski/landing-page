import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Penjaga integritas navigasi Gustafta OS.
//
// Halaman `client/src/pages/gustafta-os.tsx` adalah "peta" seluruh platform:
// tiap pilar berisi objek Destination { href, label, desc, icon }. Kalau sebuah
// href menunjuk ke route yang TIDAK terdaftar di `client/src/App.tsx`, user akan
// klik kartu dan mendarat di halaman 404 tanpa error saat build.
//
// Test ini statis (membaca source) — sengaja begitu agar cepat, deterministik,
// tanpa DB/server, dan gagal keras kalau ada perubahan yang diam-diam memutus
// tautan OS. Mengikuti pola `tests/agent-authz-guard.test.ts`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const osPath = resolve(__dirname, "../client/src/pages/gustafta-os.tsx");
const appPath = resolve(__dirname, "../client/src/App.tsx");
const osSrc = readFileSync(osPath, "utf8");
const appSrc = readFileSync(appPath, "utf8");

// Ambil semua href dari objek Destination (pola `href: "/..."` — pakai titik dua,
// beda dari `href="..."` di JSX Link). Hanya objek data yang memakai `href:`.
function osDestinationHrefs(): string[] {
  const hrefs = new Set<string>();
  // Dukung kutip ganda maupun tunggal agar tak rapuh terhadap gaya penulisan.
  const re = /href:\s*["'](\/[^"']*)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(osSrc)) !== null) hrefs.add(m[1]);
  return [...hrefs];
}

// Ambil semua path route terdaftar dari App.tsx. Agnostik urutan atribut: cocok
// `<Route ... path="/..." ...>` di mana pun `path` berada dalam tag (dan kedua
// gaya kutip). `[^>]*` menjaga pencocokan tetap dalam satu tag <Route>.
function registeredRoutePaths(): string[] {
  const paths = new Set<string>();
  const re = /<Route\b[^>]*\bpath=["'](\/[^"']*)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(appSrc)) !== null) paths.add(m[1]);
  return [...paths];
}

// Sebuah href OS cocok dengan route bila sama persis, ATAU cocok dengan route
// berparam (mis. href `/chat/123` cocok `path="/chat/:id"`). Semua href OS saat
// ini statis, tapi pencocokan berparam menjaga test tetap benar bila kelak ada.
function routeMatches(href: string, routePath: string): boolean {
  if (href === routePath) return true;
  const hrefSegs = href.split("/");
  const routeSegs = routePath.split("/");
  if (hrefSegs.length !== routeSegs.length) return false;
  return routeSegs.every((seg, i) => seg.startsWith(":") || seg === hrefSegs[i]);
}

test("gustafta-os.tsx punya minimal satu destinasi (guard tidak boleh kosong)", () => {
  const hrefs = osDestinationHrefs();
  assert.ok(
    hrefs.length >= 20,
    `Hanya ${hrefs.length} destinasi OS terdeteksi (harusnya >= 20) — pola ekstraksi mungkin rusak. ` +
      "Kalau bentuk objek Destination berubah, PERBARUI test ini, jangan biarkan lolos diam-diam.",
  );
});

test("setiap destinasi Gustafta OS mengarah ke route yang terdaftar di App.tsx (tanpa tautan mati)", () => {
  const hrefs = osDestinationHrefs();
  const routes = registeredRoutePaths();
  const dead = hrefs.filter((h) => !routes.some((r) => routeMatches(h, r)));
  assert.deepEqual(
    dead,
    [],
    `Destinasi OS berikut TIDAK punya route di App.tsx (akan 404 saat diklik): ${dead.join(", ")}. ` +
      "Daftarkan <Route> yang sesuai atau perbaiki href-nya di gustafta-os.tsx.",
  );
});
