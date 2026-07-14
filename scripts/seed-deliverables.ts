/**
 * Seed deliverables[] untuk semua agen aktif yang masih kosong.
 * Logika:
 *   1. Orchestrator hub → snapshot_proyek + rencana_aksi + ringkasan_jawaban
 *   2. Domain-aware (tender/sbu/skk/…)
 *   3. Fallback deliverable_bundle text → mapping
 *
 * Run: node_modules/.bin/tsx scripts/seed-deliverables.ts
 */

import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

type DKey =
  | "ringkasan_jawaban" | "rencana_aksi" | "checklist"
  | "handout_materi" | "latihan_kuis" | "feedback_rubrik"
  | "snapshot_proyek" | "timeline_report" | "notulen_sesi"
  | "dokumen_draft" | "pesan_siap_kirim" | "ekspor_data";

// ─── Domain detection (same as project brain seed) ──────────────────────────
function detectDomain(name: string, cat: string | null, dc: string | null): string {
  const h = `${name} ${dc ?? ""} ${cat ?? ""}`.toLowerCase();
  if (/pengelasan|welding|smaw|tig\b|mig\b|fcaw/.test(h)) return "pengelasan";
  if (/alat berat|excavator|bulldozer|crane operator/.test(h)) return "alat_berat";
  if (/\bsbu\b|subklasifikasi|kualifikasi usaha|\bbujk\b/.test(h)) return "sbu";
  if (/\bskk\b|sertifikat kompetensi kerja|skkni/.test(h)) return "skk";
  if (/askom|asesor kompetensi|\bmuk\b|fr-apl/.test(h)) return "askom";
  if (/lisensi lsp|akreditasi lsp|\bbnsp\b|kan.*lsp/.test(h)) return "lsp";
  if (/tender|pengadaan|\bpbjp\b|\blkpp\b/.test(h)) return "tender";
  if (/hukum|legal|kontrak|fidic|sengketa|lexcom|skripsi/.test(h)) return "legal";
  if (/\bk3\b|\bsmk3\b|\bhse\b|keselamatan kerja|\bcsms\b|safety/.test(h)) return "k3";
  if (/iso.9001|\bmutu\b|\bsmm\b|quality management/.test(h)) return "iso9001";
  if (/iso.14001|lingkungan|amdal/.test(h)) return "iso14001";
  if (/smap|anti.suap|iso.37001/.test(h)) return "smap";
  if (/\bodoo\b|erp.*bujk|implementasi.*odoo/.test(h)) return "odoo";
  if (/properti|real estate|devproperti|estatecare/.test(h)) return "properti";
  if (/ib dp|ib.*diploma|registrar.*ib|\bibis\b|malpractice.*ib/.test(h)) return "ibdp";
  if (/tutor|pedagogi|belajar adaptif|theoryagent|drillagent/.test(h)) return "tutor";
  if (/manajemen proyek|project management|pm.*konstruksi/.test(h)) return "pm";
  if (/katalog jabatan|jabatan.*skkni|jabatan.*kerja/.test(h)) return "katalog";
  if (/perizinan|\boss\b|\bnib\b|\bsiujk\b/.test(h)) return "perizinan";
  if (/pelatihan|training|workshop|bimtek/.test(h)) return "edukasi";
  return "universal";
}

// ─── Bundle-text → deliverable keys (legacy deliverable_bundle field hints) ──
function bundleTextToKeys(bundle: string): DKey[] | null {
  const b = bundle.toLowerCase();
  if (/sintesis|rekomendasi eksekutif/.test(b))
    return ["snapshot_proyek", "rencana_aksi", "ringkasan_jawaban"];
  if (/monitoring|dashboard status/.test(b))
    return ["snapshot_proyek", "timeline_report", "rencana_aksi"];
  if (/set soal|analisis hasil|belajar/.test(b))
    return ["latihan_kuis", "feedback_rubrik", "ringkasan_jawaban"];
  if (/dokumen terstruktur|checklist.*template/.test(b))
    return ["dokumen_draft", "checklist", "ringkasan_jawaban"];
  if (/langkah.*regulasi|referensi regulasi/.test(b))
    return ["ringkasan_jawaban", "checklist", "dokumen_draft"];
  if (/evaluasi|gap analysis/.test(b))
    return ["checklist", "rencana_aksi", "ringkasan_jawaban"];
  if (/panduan.*analisis|analisis.*rekomendasi/.test(b))
    return ["ringkasan_jawaban", "checklist", "rencana_aksi"];
  if (/draft dokumen|template.*panduan pengisian/.test(b))
    return ["dokumen_draft", "checklist", "rencana_aksi"];
  return null;
}

// ─── Domain → deliverable keys ───────────────────────────────────────────────
const DOMAIN_DELIVERABLES: Record<string, DKey[]> = {
  tender:     ["checklist", "rencana_aksi", "dokumen_draft"],
  sbu:        ["checklist", "rencana_aksi", "dokumen_draft"],
  skk:        ["checklist", "rencana_aksi", "ringkasan_jawaban"],
  askom:      ["checklist", "feedback_rubrik", "dokumen_draft"],
  lsp:        ["checklist", "dokumen_draft", "rencana_aksi"],
  legal:      ["dokumen_draft", "ringkasan_jawaban", "checklist"],
  k3:         ["checklist", "rencana_aksi", "dokumen_draft"],
  iso9001:    ["checklist", "rencana_aksi", "dokumen_draft"],
  iso14001:   ["checklist", "rencana_aksi", "dokumen_draft"],
  smap:       ["checklist", "rencana_aksi", "dokumen_draft"],
  odoo:       ["snapshot_proyek", "rencana_aksi", "notulen_sesi"],
  properti:   ["snapshot_proyek", "rencana_aksi", "pesan_siap_kirim"],
  ibdp:       ["checklist", "ringkasan_jawaban", "dokumen_draft"],
  tutor:      ["handout_materi", "latihan_kuis", "feedback_rubrik", "notulen_sesi"],
  edukasi:    ["handout_materi", "latihan_kuis", "feedback_rubrik"],
  pengelasan: ["checklist", "rencana_aksi", "dokumen_draft"],
  alat_berat: ["checklist", "snapshot_proyek", "rencana_aksi"],
  pm:         ["snapshot_proyek", "timeline_report", "rencana_aksi"],
  katalog:    ["checklist", "rencana_aksi", "ringkasan_jawaban"],
  perizinan:  ["checklist", "rencana_aksi", "dokumen_draft"],
  universal:  ["ringkasan_jawaban", "checklist", "rencana_aksi"],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Deliverables for All Agents ===\n");

  const { rows: agents } = await db.query<{
    id: number;
    name: string;
    category: string | null;
    domain_charter: string | null;
    deliverable_bundle: string | null;
    is_orchestrator: boolean;
  }>(`
    SELECT id, name, category, domain_charter, deliverable_bundle, is_orchestrator
    FROM agents
    WHERE is_active = true
      AND (deliverables IS NULL OR deliverables::text = '[]' OR deliverables::text = 'null')
    ORDER BY id
  `);

  console.log(`Agents with empty deliverables: ${agents.length}`);

  // Count by final mapping
  const distrib: Record<string, number> = {};

  const BATCH = 200;
  let updated = 0;

  for (let i = 0; i < agents.length; i += BATCH) {
    const batch = agents.slice(i, i + BATCH);
    const cases: string[] = [];
    const ids: number[] = [];

    for (const a of batch) {
      let keys: DKey[];

      if (a.is_orchestrator) {
        // Orchestrators always get synthesis outputs
        keys = ["snapshot_proyek", "rencana_aksi", "ringkasan_jawaban"];
        distrib["[orch] snapshot+action+summary"] = (distrib["[orch] snapshot+action+summary"] || 0) + 1;
      } else {
        const domain = detectDomain(a.name, a.category, a.domain_charter);
        keys = DOMAIN_DELIVERABLES[domain] ?? DOMAIN_DELIVERABLES["universal"];

        // Override with legacy bundle hints when they give more specific signal
        // (only if domain resolved to "universal")
        if (domain === "universal" && a.deliverable_bundle) {
          const fromBundle = bundleTextToKeys(a.deliverable_bundle);
          if (fromBundle) keys = fromBundle;
        }

        const label = `[${domain}] ${keys.join("+")}`;
        distrib[label] = (distrib[label] || 0) + 1;
      }

      ids.push(a.id);
      cases.push(`WHEN id = ${a.id} THEN '${JSON.stringify(keys)}'::jsonb`);
    }

    await db.query(`
      UPDATE agents
      SET deliverables = CASE ${cases.join(" ")} END
      WHERE id = ANY($1::int[])
    `, [ids]);

    updated += batch.length;
    process.stdout.write(`  Updated: ${updated}/${agents.length}\r`);
  }

  console.log(`\n\n✅ Deliverables seeded: ${updated}`);
  console.log("\nDistribution summary (top 20):");
  Object.entries(distrib)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([label, cnt]) => console.log(`  ${String(cnt).padStart(4)}  ${label}`));

  // Verify
  const { rows: verify } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE deliverables IS NULL OR deliverables::text = '[]') as still_empty,
      COUNT(*) FILTER (WHERE deliverables::text != '[]') as filled
    FROM agents WHERE is_active = true
  `);
  console.log(`\nVerify — empty: ${verify[0].still_empty}, filled: ${verify[0].filled}`);

  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
