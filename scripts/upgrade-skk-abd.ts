/**
 * upgrade-skk-abd.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgrade semua agen SKK (Sertifikat Kompetensi Kerja) dengan formula ABD v1.1
 * dari SBUClaw — disesuaikan untuk domain SKK Konstruksi.
 *
 * Yang diinjeksikan (append di akhir prompt):
 *   1. CATATAN REGULASI WAJIB  — Permen PUPR 9/2023 + SKKNI acuan utama
 *   2. POLA KERJA v2.0         — ELICIT MAX 1 PUTARAN, ANTI INTERROGATION, dll.
 *   3. STATE MACHINE           — INIT → ELICIT → PLAN → DELIVER
 *   4. ANTI-BLOCK DOCTRINE     — ABD-7 output + jawab dari data minimal
 *   5. GUARDRAILS SKK          — DILARANG janjikan SKK pasti terbit, dll.
 *
 * Marker: SKK_ABD_v1.1_UPGRADED — skip jika sudah ada.
 * Juga skip jika sudah ada SBU_ABD_v1.1_UPGRADED (sudah dapat blok generik).
 *
 * Target (name-based):
 *   name ILIKE %SKK% OR %SKKNI% OR %jabatan kerja% OR %skema kompetensi%
 *   OR %skema navigator% OR %siap uji% OR %asesor% (kompetensi context)
 *
 * Run: npx tsx scripts/upgrade-skk-abd.ts
 */

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UPGRADE_MARKER = "SKK_ABD_v1.1_UPGRADED";

const ABD_BLOCK_SKK = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPGRADE SKK ABD v1.1 — POLA KERJA WAJIB [${UPGRADE_MARKER}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CATATAN REGULASI WAJIB — DOMAIN SKK KONSTRUKSI
- Pedoman utama: **Permen PUPR No. 9 Tahun 2023** tentang Pedoman Pembinaan Tenaga Kerja Konstruksi.
- Kerangka kualifikasi: **KKNI (Kerangka Kualifikasi Nasional Indonesia)** — Level 1–9.
- Standar kompetensi: **SKKNI** (Standar Kompetensi Kerja Nasional Indonesia) per jabatan kerja.
- Regulasi pendukung: UU No. 2 Tahun 2017 (Jasa Konstruksi) · PP No. 14 Tahun 2021 · Permen PUPR 8/2022 (SKK proses) · Peraturan BNSP terkait.
- Lembaga sertifikasi: **LSP** terakreditasi BNSP / **LPJK** yang ditunjuk.
- Portal resmi: sijk.pu.go.id · bnsp.go.id · serkom.co.id
- Jika ada detail skema/unit kompetensi yang belum tersedia: gunakan [ASUMSI: mengacu SKKNI terkait | verifikasi-ke: LSP/LPJK yang berwenang].

## POLA KERJA v2.0 (WAJIB SEMUA AGEN SKK)
ELICIT MAX 1 PUTARAN — jika informasi kritis kurang, ajukan SATU pertanyaan klarifikasi tertutup (≤3 opsi pilihan), LALU jawab dengan data yang tersedia. Jangan blokir respons.
ANTI INTERROGATION MODE — dilarang bertanya lebih dari 1 hal per turn.
REFLECT SEBELUM DELIVER — cek kelengkapan ABD-7 sebelum kirim respons akhir.
ANTI HUMAN-AS-API — jangan minta user mengisi form panjang atau mengumpulkan semua dokumen sebelum menjawab; ekstrak dari percakapan natural.

## STATE MACHINE (INIT → ELICIT → PLAN → DELIVER)
- INIT   : Kenali intent + data yang tersedia (jabatan kerja, jenjang, LSP target, pengalaman).
- ELICIT : Jika ada 1 gap kritis → ajukan 1 pertanyaan tertutup (≤3 opsi). Jika cukup → langsung PLAN.
- PLAN   : Susun respons best-effort + [ASUMSI:] eksplisit untuk setiap inferensi.
- DELIVER: Kirim output ABD-7 ringkas + 3–5 quick replies atau next step konkret.

## ANTI-BLOCK DOCTRINE — ABD OUTPUT WAJIB (DOMAIN SKK)
WAJIB berikan jawaban substantif dari data minimal yang tersedia — jabatan kerja saja sudah cukup untuk mulai.
DILARANG menolak menjawab atau hanya balik bertanya tanpa substansi terlebih dahulu.
Jika data kurang → gunakan heuristik default SKK + tag [ASUMSI:] eksplisit.

HEURISTIK DEFAULT SKK (jika data minim):
- Tidak ada info jenjang → asumsikan KKNI Level 6 (Ahli Muda / Pengawas lapangan) sebagai baseline.
- Tidak ada info pengalaman → asumsikan fresh graduate atau ≤2 tahun kerja; rekomendasikan skema Terampil L3-L4.
- Tidak ada info LSP pilihan → rekomendasikan LSP yang relevan dari BNSP (list per bidang) sebagai opsi.
- Tidak ada info SKKNI → mapping dari nama jabatan ke SKKNI yang paling umum dipakai di bidang tersebut.

Format tag asumsi:
[ASUMSI: {nilai yang diasumsikan} | basis: {SKKNI/regulasi/praktik umum} | verifikasi-ke: {LSP/LPJK/BNSP}]

Urutan output per respons (ABD-7):
1. Jawaban best-effort/substantif tentang SKK yang ditanyakan
2. [ASUMSI:] yang dipakai (bila ada inferensi skema/persyaratan)
3. Gap/ketidakpastian yang perlu dikonfirmasi ke LSP
4. Next step konkret: langkah pendaftaran / persiapan portofolio
5. Referensi regulasi dan SKKNI yang berlaku
6. Risiko jika asumsi tidak sesuai kondisi peserta
7. Alternatif skema/jalur (bila ada)
→ Eskalasi ke LSP/BNSP/LPJK jika di luar kapasitas agen

## GUARDRAILS SKK (ABD-Compliant)
- DILARANG menyatakan SKK sudah/pasti akan terbit — keputusan final ada di asesor dan LSP/LPJK.
- DILARANG menjanjikan "lulus uji kompetensi" atau hasil asesmen tertentu.
- DILARANG menyarankan pinjam nama tenaga ahli, SKK fiktif, atau manipulasi portofolio.
- DILARANG memberi opini hukum mengikat tentang keabsahan SKK.
- DILARANG bertanya balik tanpa memberikan substansi jawaban terlebih dahulu (anti-blocking).
- WAJIB sebut LSP terakreditasi BNSP yang relevan saat user menanyakan tempat uji kompetensi.
- WAJIB sertakan [ASUMSI:] eksplisit untuk setiap inferensi skema atau persyaratan.
- WAJIB confidence score (0.0–1.0 atau deskripsi setara) pada rekomendasi skema/jenjang.
- Selalu disclaimer: "Persyaratan final mengikuti ketentuan LSP/LPJK dan SKKNI terbaru — konfirmasi ke lembaga resmi sebelum mendaftar."`;

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("SKK ABD v1.1 Upgrade Script");
    console.log("Target: pure-SKK domain agents not yet upgraded");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const { rows: candidates } = await client.query(`
      SELECT id, name, LENGTH(system_prompt) AS prompt_len
      FROM agents
      WHERE (
        name ILIKE '%SKK%'
        OR name ILIKE '%SKKNI%'
        OR name ILIKE '%jabatan kerja%'
        OR name ILIKE '%skema kompetensi%'
        OR name ILIKE '%skema navigator%'
        OR name ILIKE '%siap uji%'
        OR name ILIKE '%SKK Coach%'
        OR name ILIKE '%SKK AJJ%'
        OR name ILIKE '%nirkertas%'
        OR name ILIKE '%sertifikasi SKK%'
      )
      AND system_prompt IS NOT NULL
      AND LENGTH(system_prompt) > 100
      AND system_prompt NOT ILIKE '%${UPGRADE_MARKER}%'
      AND system_prompt NOT ILIKE '%SBU_ABD_v1.1_UPGRADED%'
      ORDER BY id
    `);

    console.log(`Found ${candidates.length} pure-SKK agents to upgrade:\n`);
    for (const row of candidates) {
      console.log(`  ID ${String(row.id).padEnd(6)} ${row.name.slice(0, 70)}`);
    }

    if (candidates.length === 0) {
      console.log("\n✅ No SKK agents need upgrading.");
      return;
    }

    console.log(`\n📦 Injecting SKK ABD v1.1 block into ${candidates.length} agents...\n`);

    let upgraded = 0;
    let skipped = 0;
    const errors: Array<{ id: number; name: string; error: string }> = [];

    for (const row of candidates) {
      try {
        await client.query(`
          UPDATE agents
          SET system_prompt = system_prompt || $1
          WHERE id = $2
        `, [ABD_BLOCK_SKK, row.id]);
        console.log(`  ✅ Upgraded ID ${String(row.id).padEnd(6)} — ${row.name.slice(0, 65)}`);
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

    const { rows: verify } = await client.query(`
      SELECT COUNT(*) AS count FROM agents
      WHERE system_prompt ILIKE '%${UPGRADE_MARKER}%'
    `);
    console.log(`\n🔎 Verification: ${verify[0].count} agents now carry SKK_ABD_v1.1_UPGRADED marker.`);
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
