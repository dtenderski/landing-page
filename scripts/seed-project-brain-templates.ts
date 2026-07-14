/**
 * Seed Project Brain Templates for All Agents
 * Creates a default construction project template (27 fields) for every
 * active agent that does not yet have any project brain template.
 *
 * Run: node_modules/.bin/tsx scripts/seed-project-brain-templates.ts
 */

import pg from "pg";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_FIELDS = [
  // === Project Profile ===
  { key: "project_name", label: "Nama Proyek", type: "text", required: true, placeholder: "Contoh: Pembangunan Jembatan Kali Brantas", helpText: "Nama resmi proyek", defaultValue: "", options: [], order: 0 },
  { key: "project_type", label: "Tipe Proyek", type: "select", required: true, placeholder: "Pilih tipe proyek", helpText: "Kategori utama proyek", defaultValue: "", options: ["Gedung", "Jalan", "Jembatan", "Infrastruktur"], order: 1 },
  { key: "project_stage", label: "Tahap Proyek", type: "select", required: true, placeholder: "Pilih tahap proyek", helpText: "Fase proyek saat ini", defaultValue: "", options: ["Planning", "Execution", "Closeout"], order: 2 },
  { key: "location", label: "Lokasi", type: "text", required: true, placeholder: "Contoh: Surabaya, Jawa Timur", helpText: "Lokasi proyek", defaultValue: "", options: [], order: 3 },
  { key: "owner_client", label: "Owner / Client", type: "text", required: true, placeholder: "Contoh: PT Jasa Marga, Kementerian PUPR", helpText: "Pemilik proyek atau klien", defaultValue: "", options: [], order: 4 },
  // === Key Technical Parameters ===
  { key: "structural_system", label: "Sistem Struktur", type: "text", required: true, placeholder: "Contoh: Beton bertulang, Baja, Komposit", helpText: "Sistem struktur utama yang digunakan", defaultValue: "", options: [], order: 5 },
  { key: "concrete_grade", label: "Mutu Beton (fc')", type: "text", required: true, placeholder: "Contoh: fc' 30 MPa", helpText: "Grade beton yang digunakan", defaultValue: "", options: [], order: 6 },
  { key: "construction_method", label: "Metode Konstruksi Utama", type: "text", required: true, placeholder: "Contoh: Konvensional, Precast, Prestress", helpText: "Metode kerja konstruksi utama", defaultValue: "", options: [], order: 7 },
  // === Project Constraints ===
  { key: "time_constraint", label: "Batasan Waktu", type: "select", required: true, placeholder: "Pilih batasan waktu", helpText: "Tingkat urgensi waktu proyek", defaultValue: "", options: ["Normal", "Tight"], order: 8 },
  { key: "cost_constraint", label: "Batasan Biaya", type: "select", required: true, placeholder: "Pilih batasan biaya", helpText: "Tingkat keketatan anggaran proyek", defaultValue: "", options: ["Normal", "Tight"], order: 9 },
  { key: "site_access", label: "Akses Lokasi", type: "select", required: true, placeholder: "Pilih kondisi akses", helpText: "Kondisi akses menuju lokasi proyek", defaultValue: "", options: ["Easy", "Limited"], order: 10 },
  { key: "environmental_factors", label: "Faktor Lingkungan", type: "text", required: true, placeholder: "Contoh: Dekat sungai, area rawan banjir", helpText: "Faktor lingkungan yang mempengaruhi proyek", defaultValue: "", options: [], order: 11 },
  // === Active Issues ===
  { key: "issue_type", label: "Tipe Isu", type: "select", required: true, placeholder: "Pilih tipe isu", helpText: "Jenis masalah yang terjadi", defaultValue: "", options: ["Structural", "Quality", "Safety", "Method", "Cost", "Schedule", "Environment"], order: 12 },
  { key: "issue_location", label: "Lokasi/Elemen Isu", type: "text", required: true, placeholder: "Contoh: Kolom Lt.3, Pondasi zona B", helpText: "Lokasi atau elemen yang terdampak", defaultValue: "", options: [], order: 13 },
  { key: "issue_status", label: "Status Isu", type: "select", required: true, placeholder: "Pilih status", helpText: "Status penanganan isu saat ini", defaultValue: "", options: ["Open", "Monitoring", "Closed"], order: 14 },
  { key: "issue_since", label: "Isu Sejak", type: "date", required: true, placeholder: "", helpText: "Sejak kapan isu ini muncul", defaultValue: "", options: [], order: 15 },
  // === Key Decisions Log ===
  { key: "decision_summary", label: "Ringkasan Keputusan", type: "textarea", required: true, placeholder: "Contoh: Ganti metode pondasi dari bored pile ke driven pile", helpText: "Ringkasan keputusan teknis yang diambil", defaultValue: "", options: [], order: 16 },
  { key: "decision_reason", label: "Alasan Keputusan", type: "textarea", required: true, placeholder: "Contoh: Kondisi tanah tidak sesuai hasil soil test", helpText: "Alasan di balik keputusan yang diambil", defaultValue: "", options: [], order: 17 },
  { key: "decision_risk_level", label: "Level Risiko Keputusan", type: "select", required: true, placeholder: "Pilih level risiko", helpText: "Tingkat risiko dari keputusan ini", defaultValue: "Medium", options: ["Low", "Medium", "High"], order: 18 },
  { key: "decision_date", label: "Tanggal Keputusan", type: "date", required: true, placeholder: "", helpText: "Kapan keputusan ini diambil", defaultValue: "", options: [], order: 19 },
  { key: "decision_impact", label: "Dampak Keputusan", type: "select", required: true, placeholder: "Pilih dampak", helpText: "Area yang paling terdampak oleh keputusan ini", defaultValue: "", options: ["Cost", "Time", "Quality", "Safety", "Multi"], order: 20 },
  { key: "assumption_used", label: "Asumsi Utama", type: "textarea", required: true, placeholder: "Contoh: Data soil test dianggap valid hingga kedalaman 30 m", helpText: "Asumsi utama yang mendasari keputusan (penting untuk audit trail)", defaultValue: "", options: [], order: 21 },
  // === Test Data Snapshot ===
  { key: "slump", label: "Slump", type: "text", required: true, placeholder: "Contoh: 12 ± 2 cm", helpText: "Hasil uji slump beton", defaultValue: "", options: [], order: 22 },
  { key: "concrete_strength", label: "Kuat Tekan Beton", type: "text", required: true, placeholder: "Contoh: 28 hari = 32 MPa (Umur / Nilai)", helpText: "Hasil uji kuat tekan beton", defaultValue: "", options: [], order: 23 },
  { key: "inspection_notes", label: "Catatan Inspeksi", type: "textarea", required: true, placeholder: "Contoh: Visual check OK, rebar spacing sesuai gambar", helpText: "Catatan dari hasil inspeksi lapangan", defaultValue: "", options: [], order: 24 },
  // === Project Brain Status ===
  { key: "completeness_level", label: "Tingkat Kelengkapan Data", type: "select", required: true, placeholder: "Pilih level", helpText: "Seberapa lengkap data proyek yang tersedia", defaultValue: "", options: ["Draft", "Partial", "Complete"], order: 25 },
  { key: "last_updated", label: "Terakhir Diperbarui", type: "date", required: true, placeholder: "", helpText: "Tanggal terakhir data proyek diperbarui", defaultValue: "", options: [], order: 26 },
];

async function main() {
  console.log("=== Seed Project Brain Templates — All Agents ===\n");

  // 1. Get all active agents
  const { rows: allAgents } = await db.query<{ id: number; name: string }>(
    `SELECT id, name FROM agents WHERE is_active = true ORDER BY id`
  );
  console.log(`Total active agents: ${allAgents.length}`);

  // 2. Get agent IDs that already have at least one template
  const { rows: existingRows } = await db.query<{ agent_id: number }>(
    `SELECT DISTINCT agent_id FROM project_brain_templates`
  );
  const alreadyHas = new Set(existingRows.map((r) => r.agent_id));
  console.log(`Agents with existing templates: ${alreadyHas.size}`);

  // 3. Filter to agents that need a template
  const toSeed = allAgents.filter((a) => !alreadyHas.has(a.id));
  console.log(`Agents to seed: ${toSeed.length}\n`);

  if (toSeed.length === 0) {
    console.log("✅ Semua agen sudah memiliki template Otak Proyek.");
    await db.end();
    return;
  }

  // 4. Bulk insert — build VALUES string
  const fieldsJson = JSON.stringify(DEFAULT_FIELDS);
  let created = 0;
  let failed = 0;

  // Insert in batches of 100
  const BATCH = 100;
  for (let i = 0; i < toSeed.length; i += BATCH) {
    const batch = toSeed.slice(i, i + BATCH);
    const valueParts: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const agent of batch) {
      valueParts.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}::jsonb, true, NOW())`
      );
      params.push(
        agent.id,
        "Template Proyek Konstruksi",
        "Template default 27 field untuk konteks proyek konstruksi — profil, parameter teknis, isu aktif, keputusan, data uji, dan status kelengkapan.",
        fieldsJson
      );
    }

    try {
      await db.query(
        `INSERT INTO project_brain_templates (agent_id, name, description, fields, is_active, created_at)
         VALUES ${valueParts.join(", ")}`,
        params
      );
      created += batch.length;
      process.stdout.write(`  [${i + batch.length}/${toSeed.length}] Inserted ${batch.length} templates\r`);
    } catch (err: any) {
      failed += batch.length;
      console.error(`\n  ❌ Batch ${i}–${i + batch.length} gagal:`, err.message);
    }
  }

  console.log(`\n\n=== SELESAI ===`);
  console.log(`✅ Berhasil: ${created} template`);
  if (failed > 0) console.log(`❌ Gagal   : ${failed} template`);

  await db.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
