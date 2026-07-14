/**
 * patch-skk-sk-dirjen-114.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * KOREKSI: Tambahkan referensi regulasi yang benar untuk domain SKK:
 *   → SK Dirjen Bina Konstruksi Nomor 114/KPTS/Dk/2024
 *
 * Target: semua agen yang sudah punya marker SKK_ABD_v1.1_UPGRADED
 * Metode: REPLACE() — ganti baris acuan lama dengan versi yang sudah diperbaiki
 *         yang menyertakan SK Dirjen 114/KPTS/DK/2024.
 *
 * Run: npx tsx scripts/patch-skk-sk-dirjen-114.ts
 */

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Teks lama (dari blok ABD yang diinject sebelumnya)
const OLD_REG_NOTE = `## CATATAN REGULASI WAJIB — DOMAIN SKK KONSTRUKSI
- Pedoman utama: **Permen PUPR No. 9 Tahun 2023** tentang Pedoman Pembinaan Tenaga Kerja Konstruksi.
- Kerangka kualifikasi: **KKNI (Kerangka Kualifikasi Nasional Indonesia)** — Level 1–9.
- Standar kompetensi: **SKKNI** (Standar Kompetensi Kerja Nasional Indonesia) per jabatan kerja.
- Regulasi pendukung: UU No. 2 Tahun 2017 (Jasa Konstruksi) · PP No. 14 Tahun 2021 · Permen PUPR 8/2022 (SKK proses) · Peraturan BNSP terkait.
- Lembaga sertifikasi: **LSP** terakreditasi BNSP / **LPJK** yang ditunjuk.
- Portal resmi: sijk.pu.go.id · bnsp.go.id · serkom.co.id
- Jika ada detail skema/unit kompetensi yang belum tersedia: gunakan [ASUMSI: mengacu SKKNI terkait | verifikasi-ke: LSP/LPJK yang berwenang].`;

// Teks baru — dengan SK Dirjen 114/KPTS/DK/2024 masuk sebagai acuan utama
const NEW_REG_NOTE = `## CATATAN REGULASI WAJIB — DOMAIN SKK KONSTRUKSI
- Pedoman utama: **Permen PUPR No. 9 Tahun 2023** tentang Pedoman Pembinaan Tenaga Kerja Konstruksi.
- Acuan teknis jabatan kerja: **SK Dirjen Bina Konstruksi Nomor 114/KPTS/Dk/2024** — referensi resmi daftar jabatan kerja, subklasifikasi SKK, dan persyaratan kompetensi yang berlaku. WAJIB jadikan acuan utama untuk detail teknis jabatan kerja SKK.
- Kerangka kualifikasi: **KKNI (Kerangka Kualifikasi Nasional Indonesia)** — Level 1–9.
- Standar kompetensi: **SKKNI** (Standar Kompetensi Kerja Nasional Indonesia) per jabatan kerja sesuai SK Dirjen 114/KPTS/DK/2024.
- Regulasi pendukung: UU No. 2 Tahun 2017 (Jasa Konstruksi) · PP No. 14 Tahun 2021 · Permen PUPR 9/2023 · Peraturan BNSP terkait.
- Lembaga sertifikasi: **LSP** terakreditasi BNSP / **LPJK** yang ditunjuk.
- Portal resmi: sijk.pu.go.id · bnsp.go.id · serkom.co.id
- Jika ada detail skema/unit kompetensi yang belum tersedia: gunakan [ASUMSI: mengacu SK Dirjen 114/KPTS/DK/2024 dan SKKNI terkait | verifikasi-ke: LSP/LPJK yang berwenang].`;

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("PATCH: Tambah SK Dirjen Bina Konstruksi 114/KPTS/DK/2024");
    console.log("Target: agen dengan marker SKK_ABD_v1.1_UPGRADED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Cek berapa yang perlu dipatch
    const { rows: targets } = await client.query(`
      SELECT id, name
      FROM agents
      WHERE system_prompt ILIKE '%SKK_ABD_v1.1_UPGRADED%'
      AND system_prompt NOT ILIKE '%SK Dirjen Bina Konstruksi Nomor 114%'
      ORDER BY id
    `);

    console.log(`Found ${targets.length} agents to patch:\n`);
    targets.forEach(r => console.log(`  ID ${String(r.id).padEnd(6)} ${r.name.slice(0, 70)}`));

    if (targets.length === 0) {
      console.log("\n✅ All SKK agents already have SK Dirjen 114 reference.");
      return;
    }

    console.log(`\n🔧 Patching ${targets.length} agents...\n`);

    const result = await client.query(`
      UPDATE agents
      SET system_prompt = REPLACE(system_prompt, $1, $2)
      WHERE system_prompt ILIKE '%SKK_ABD_v1.1_UPGRADED%'
      AND system_prompt NOT ILIKE '%SK Dirjen Bina Konstruksi Nomor 114%'
    `, [OLD_REG_NOTE, NEW_REG_NOTE]);

    console.log(`✅ Patched ${result.rowCount} agents.\n`);

    // Verify
    const { rows: v } = await client.query(`
      SELECT COUNT(*) AS c FROM agents
      WHERE system_prompt ILIKE '%SKK_ABD_v1.1_UPGRADED%'
      AND system_prompt ILIKE '%SK Dirjen Bina Konstruksi Nomor 114%'
    `);
    console.log(`🔎 Verification: ${v[0].c} agents now have SK Dirjen 114/KPTS/DK/2024.`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
