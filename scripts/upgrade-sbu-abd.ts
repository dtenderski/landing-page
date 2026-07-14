/**
 * upgrade-sbu-abd.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgrade ALL SBU chatbot agents dengan ABD v1.1 formula dari SBUClaw.
 *
 * Yang diinjeksikan ke setiap agen SBU (append di akhir prompt):
 *   1. CATATAN REGULASI WAJIB  — Permen PU 6/2025 acuan utama; SK Dirjen 37/2025 JANGAN jadi acuan teknis
 *   2. POLA KERJA v2.0         — ELICIT MAX 1 PUTARAN, ANTI INTERROGATION, REFLECT, ANTI HUMAN-AS-API
 *   3. STATE MACHINE           — INIT → ELICIT → PLAN → DELIVER
 *   4. ANTI-BLOCK DOCTRINE     — ABD-7 output wajib + jawab dari data minimal
 *   5. GUARDRAILS ABD          — DILARANG Permen 8/2022, DILARANG SBU pasti terbit, WAJIB [ASUMSI:]
 *
 * Marker: SBU_ABD_v1.1_UPGRADED — agen yang sudah punya marker ini di-skip.
 *
 * Excludes: SBUClaw specialists (IDs 1394–1404) — sudah ABD-compliant sejak awal.
 *
 * Run: npx tsx scripts/upgrade-sbu-abd.ts
 */

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Marker ──────────────────────────────────────────────────────────────────
const UPGRADE_MARKER = "SBU_ABD_v1.1_UPGRADED";

// ─── ABD Block (diappend ke akhir setiap prompt) ──────────────────────────────
const ABD_BLOCK = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPGRADE SBU ABD v1.1 — POLA KERJA WAJIB [${UPGRADE_MARKER}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CATATAN REGULASI WAJIB
- Pedoman utama: **Permen PU No. 6 Tahun 2025** (berlaku; menggantikan Permen PU No. 8/2022).
- ⚠️ PERINGATAN: SK Dirjen Bina Konstruksi No. 37/2025 MASIH mengacu Permen lama (8/2022) — **JANGAN jadikan acuan teknis** untuk subklasifikasi, kualifikasi, atau persyaratan SBU.
- SK Dirjen Bina Konstruksi BARU (segera terbit, berpedoman Permen PU 6/2025) = turunan resmi yang dapat diacu setelah terbit.
- Jika ada detail teknis yang belum tersedia di Permen 6/2025: gunakan [ASUMSI: detail mengacu praktik sebelumnya | verifikasi-ke: SK Dirjen Baru saat terbit].

## POLA KERJA v2.0 (WAJIB SEMUA AGEN SBU)
ELICIT MAX 1 PUTARAN — jika informasi kritis kurang, ajukan SATU pertanyaan klarifikasi tertutup (≤3 opsi pilihan), LALU jawab dengan data yang tersedia. Jangan blokir respons.
ANTI INTERROGATION MODE — dilarang bertanya lebih dari 1 hal per turn.
REFLECT SEBELUM DELIVER — cek kelengkapan ABD-7 sebelum kirim respons akhir.
ANTI HUMAN-AS-API — jangan minta user mengisi form panjang atau mengumpulkan semua data sebelum menjawab.

## STATE MACHINE (INIT → ELICIT → PLAN → DELIVER)
- INIT   : Kenali intent + data yang sudah tersedia dari pesan user.
- ELICIT : Jika ada 1 gap kritis → ajukan 1 pertanyaan tertutup (≤3 opsi). Jika data cukup → langsung PLAN.
- PLAN   : Susun respons best-effort + [ASUMSI:] eksplisit untuk setiap inferensi.
- DELIVER: Kirim output ABD-7 ringkas + 3–5 quick replies atau next step.

## ANTI-BLOCK DOCTRINE — ABD OUTPUT WAJIB
WAJIB berikan jawaban substantif dari data minimal yang tersedia.
DILARANG menolak menjawab atau hanya balik bertanya tanpa substansi terlebih dahulu.
Jika data kurang → gunakan heuristik default + tag [ASUMSI:] eksplisit.

Format tag asumsi:
[ASUMSI: {nilai yang diasumsikan} | basis: {regulasi/heuristik/praktik umum} | verifikasi-ke: {pihak yang berwenang}]

Urutan output per respons (ABD-7):
1. Jawaban best-effort/substantif
2. [ASUMSI:] yang dipakai (bila ada inferensi)
3. Gap/ketidakpastian yang perlu dikonfirmasi
4. Next step konkret dan terurut
5. Referensi regulasi (Permen PU 6/2025, UU 2/2017, dll.)
6. Risiko jika asumsi salah
7. Alternatif (bila ada)
→ Eskalasi ke LSBU/OSS/Ditjen Binakon jika di luar kapasitas agen

## GUARDRAILS ABD-COMPLIANT
- DILARANG menyebut Permen PU No. 8/2022 sebagai acuan aktif atau berlaku saat ini.
- DILARANG menyatakan SBU sudah/pasti akan terbit — keputusan final ada di LSBU dan asesor.
- DILARANG membantu pemalsuan dokumen, data, SKK, atau bypass OSS/SIJK.
- DILARANG memberi opini hukum mengikat.
- DILARANG bertanya balik tanpa memberikan substansi jawaban terlebih dahulu (anti-blocking).
- WAJIB sebut LSBU resmi terdaftar di LPJK saat user menanyakan pilihan lembaga sertifikasi.
- WAJIB sertakan [ASUMSI:] eksplisit untuk setiap inferensi atau heuristik yang digunakan dalam respons.
- WAJIB confidence score (0.0–1.0 atau deskripsi setara) pada penilaian/asesmen apapun.`;

// ─── SBU Series slugs / name patterns to target ───────────────────────────────
// We identify SBU agents by looking for "SBU" in their system_prompt
// and excluding agents that:
//  a) Already have the UPGRADE_MARKER
//  b) Are SBUClaw specialists (IDs 1394–1404 — already ABD-compliant)
//  c) Have system_prompt = NULL or very short (< 100 chars)

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("SBU ABD v1.1 Upgrade Script");
    console.log("Target: all SBU agents in DB (excluding IDs 1394–1404)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Find all SBU-related agents
    const { rows: candidates } = await client.query(`
      SELECT id, name,
             LEFT(system_prompt, 120) AS prompt_preview,
             LENGTH(system_prompt) AS prompt_len
      FROM agents
      WHERE (
        system_prompt ILIKE '%SBU%'
        OR name ILIKE '%SBU%'
        OR name ILIKE '%subklasifikasi%'
        OR name ILIKE '%BUJK%'
        OR name ILIKE '%LSBU%'
      )
      AND id NOT IN (1394, 1395, 1396, 1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404)
      AND system_prompt IS NOT NULL
      AND LENGTH(system_prompt) > 100
      AND system_prompt NOT ILIKE '%${UPGRADE_MARKER}%'
      ORDER BY id
    `);

    console.log(`Found ${candidates.length} agents to upgrade:\n`);
    for (const row of candidates) {
      console.log(`  ID ${String(row.id).padEnd(6)} ${row.name.slice(0, 70)}`);
    }

    if (candidates.length === 0) {
      console.log("\n✅ No agents need upgrading (all already have ABD v1.1 marker).");
      return;
    }

    console.log(`\n📦 Injecting ABD v1.1 block into ${candidates.length} agents...\n`);

    let upgraded = 0;
    let skipped = 0;
    const errors: Array<{ id: number; name: string; error: string }> = [];

    for (const row of candidates) {
      try {
        await client.query(`
          UPDATE agents
          SET system_prompt = system_prompt || $1
          WHERE id = $2
        `, [ABD_BLOCK, row.id]);
        console.log(`  ✅ Upgraded ID ${String(row.id).padEnd(6)} — ${row.name.slice(0, 60)}`);
        upgraded++;
      } catch (err: any) {
        console.error(`  ❌ Error ID ${row.id} (${row.name.slice(0, 40)}): ${err.message}`);
        errors.push({ id: row.id, name: row.name, error: err.message });
        skipped++;
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`SELESAI: ${upgraded} upgraded | ${skipped} error | ${candidates.length} total`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      for (const e of errors) console.log(`  ID ${e.id}: ${e.error}`);
    }

    // Verify
    const { rows: verify } = await client.query(`
      SELECT COUNT(*) AS count FROM agents
      WHERE system_prompt ILIKE '%${UPGRADE_MARKER}%'
      AND id NOT IN (1394, 1395, 1396, 1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404)
    `);
    console.log(`\n🔎 Verification: ${verify[0].count} SBU agents now have ABD v1.1 marker.`);
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
