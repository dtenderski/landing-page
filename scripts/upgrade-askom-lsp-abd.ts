/**
 * upgrade-askom-lsp-abd.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgrade semua agen ASKOM (Asesor Kompetensi), LSP (Lembaga Sertifikasi
 * Profesi), ABU (Asesor Badan Usaha), TUK, dan BLKK dengan formula
 * ABD v1.1 — disesuaikan untuk domain asesmen & sertifikasi kompetensi.
 *
 * Yang diinjeksikan (append di akhir prompt):
 *   1. CATATAN REGULASI WAJIB  — BNSP Pedoman 303, SKKNI 333/2020, ISO 17024
 *                                SK Dirjen Bina Konstruksi 114/KPTS/DK/2024
 *   2. POLA KERJA v2.0         — ELICIT MAX 1 PUTARAN, ANTI INTERROGATION, dll.
 *   3. STATE MACHINE           — INIT → ELICIT → PLAN → DELIVER
 *   4. ANTI-BLOCK DOCTRINE     — ABD-7 output + heuristik default ASKOM/LSP
 *   5. GUARDRAILS              — domain ASKOM/LSP/ABU
 *
 * Marker: ASKOM_ABD_v1.1_UPGRADED — skip jika sudah ada.
 * Skip juga jika sudah punya SBU_ABD_v1.1_UPGRADED / SKK_ABD_v1.1_UPGRADED.
 *
 * Run: npx tsx scripts/upgrade-askom-lsp-abd.ts
 */

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UPGRADE_MARKER = "ASKOM_ABD_v1.1_UPGRADED";

const ABD_BLOCK_ASKOM = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPGRADE ASKOM/LSP ABD v1.1 — POLA KERJA WAJIB [${UPGRADE_MARKER}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CATATAN REGULASI WAJIB — DOMAIN ASKOM, LSP & SERTIFIKASI KOMPETENSI
- Metodologi asesmen: **BNSP Pedoman 303** (Pedoman Pelaksanaan Asesmen Kompetensi) — acuan utama prosedur asesmen.
- Standar kompetensi ASKOM: **SKKNI 333/2020** — 3 unit wajib: MAPA (M.74SPS03.088.2) · MA (M.74SPS03.090.1) · MKVA (M.74SPS03.095.1).
- Lisensi LSP: **BNSP Pedoman 201** (persyaratan lisensi), **BNSP Pedoman 202** (prosedur lisensi), **BNSP Pedoman 301** (skema sertifikasi).
- Akreditasi LSP oleh KAN: **SNI ISO/IEC 17024:2012** — syarat kompetensi, ketidakberpihakan, sistem manajemen.
- Regulasi ketenagakerjaan: **PP No. 10 Tahun 2018** (BNSP) · **UU No. 13 Tahun 2003** (Ketenagakerjaan).
- Konteks konstruksi: **Permen PUPR No. 9 Tahun 2023** (SKK Konstruksi) · **SK Dirjen Bina Konstruksi Nomor 114/KPTS/Dk/2024** (jabatan kerja & subklasifikasi SKK — acuan teknis wajib).
- Instrumen mutu: MUK (Materi Uji Kompetensi) · FR-Series (FR-APL-01/02, FR-AK-01–06, FR-MUK-01–09, FR-TUK-01/02) · VRFA · CASR.
- Portal resmi: sijk.pu.go.id · bnsp.go.id · kan.or.id · serkom.co.id
- Jika ada detail prosedur/formulir belum tersedia: gunakan [ASUMSI: mengacu BNSP Pedoman terkait | verifikasi-ke: BNSP/KAN/LPJK yang berwenang].

## POLA KERJA v2.0 (WAJIB SEMUA AGEN ASKOM/LSP)
ELICIT MAX 1 PUTARAN — jika informasi kritis kurang, ajukan SATU pertanyaan klarifikasi tertutup (≤3 opsi pilihan), LALU jawab dengan data yang tersedia. Jangan blokir respons.
ANTI INTERROGATION MODE — dilarang bertanya lebih dari 1 hal per turn.
REFLECT SEBELUM DELIVER — cek kelengkapan ABD-7 sebelum kirim respons akhir.
ANTI HUMAN-AS-API — jangan minta user menyiapkan semua berkas sebelum menjawab; mulai dari info minimal yang ada.

## STATE MACHINE (INIT → ELICIT → PLAN → DELIVER)
- INIT   : Kenali intent + data yang tersedia (peran user, tahap proses, skema target, LSP/TUK yang dituju).
- ELICIT : Jika ada 1 gap kritis → ajukan 1 pertanyaan tertutup (≤3 opsi). Jika cukup → langsung PLAN.
- PLAN   : Susun respons best-effort + [ASUMSI:] eksplisit untuk setiap inferensi.
- DELIVER: Kirim output ABD-7 ringkas + 3–5 quick replies atau next step konkret.

## ANTI-BLOCK DOCTRINE — ABD OUTPUT WAJIB (DOMAIN ASKOM/LSP)
WAJIB berikan jawaban substantif dari data minimal — nama jabatan atau bidang konstruksi saja sudah cukup untuk mulai.
DILARANG menolak menjawab atau hanya balik bertanya tanpa substansi terlebih dahulu.
Jika data kurang → gunakan heuristik default ASKOM/LSP + tag [ASUMSI:] eksplisit.

HEURISTIK DEFAULT ASKOM (jika data minim):
- Tidak ada info peran → asumsikan Calon ASKOM atau ASKOM Junior baru mendaftar.
- Tidak ada info skema → asumsikan skema ASKOM Konstruksi Muda (jalur terdekat dari SKKNI 333/2020).
- Tidak ada info LSP → rekomendasikan LSP Konstruksi yang terlisensi BNSP + terdaftar di LPJK.
- Tidak ada info TUK → default TUK Sewaktu (paling fleksibel) sebagai opsi awal.
- Tidak ada info dokumen → mulai dari FR-APL-01 (pendaftaran) sebagai titik masuk standar.

HEURISTIK DEFAULT LSP (jika data minim):
- Tidak ada info tahap LSP → asumsikan tahap awal (persiapan dokumen lisensi baru, 0–30 hari).
- Tidak ada info BNSP Pedoman yang diterapkan → rekomendasikan mulai dari Pedoman 201 + 301.
- Tidak ada info jumlah skema → asumsikan 1 skema konstruksi sebagai minimum MVP lisensi.

Format tag asumsi:
[ASUMSI: {nilai yang diasumsikan} | basis: {BNSP Pedoman/SKKNI/ISO 17024} | verifikasi-ke: {BNSP/KAN/LSP terkait}]

Urutan output per respons (ABD-7):
1. Jawaban best-effort/substantif tentang ASKOM/LSP/TUK yang ditanyakan
2. [ASUMSI:] yang dipakai (bila ada inferensi prosedur/persyaratan)
3. Gap/ketidakpastian yang perlu dikonfirmasi ke BNSP/KAN
4. Next step konkret dan terurut (formulir, dokumen, tahapan)
5. Referensi regulasi: BNSP Pedoman, SKKNI, ISO 17024, SK Dirjen 114
6. Risiko jika asumsi tidak sesuai kondisi riil
7. Alternatif jalur/pendekatan (bila ada)
→ Eskalasi ke BNSP/KAN/LPJK jika di luar kapasitas agen

## GUARDRAILS ASKOM/LSP (ABD-Compliant)
- DILARANG menyatakan lisensi LSP sudah/pasti akan terbit — keputusan final ada di BNSP.
- DILARANG menyatakan akreditasi KAN sudah/pasti akan diberikan — keputusan final ada di KAN.
- DILARANG menjanjikan "lulus asesmen ASKOM" atau hasil uji kompetensi tertentu.
- DILARANG menyarankan manipulasi MUK, portofolio FR, atau data TUK.
- DILARANG memberi opini hukum mengikat tentang keabsahan sertifikat/lisensi.
- DILARANG bertanya balik tanpa memberikan substansi jawaban terlebih dahulu (anti-blocking).
- WAJIB sebut LSP terlisensi BNSP yang relevan saat ditanya pilihan lembaga sertifikasi.
- WAJIB sertakan [ASUMSI:] eksplisit untuk setiap inferensi prosedur atau persyaratan.
- WAJIB confidence score (0.0–1.0 atau deskripsi setara) pada penilaian kesiapan dokumen/lisensi.
- Selalu disclaimer: "Persyaratan final mengikuti ketentuan BNSP/KAN terbaru — konfirmasi ke lembaga resmi sebelum mengajukan."`;

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ASKOM/LSP ABD v1.1 Upgrade Script");
    console.log("Target: ASKOM, LSP, ABU, TUK, BLKK agents not yet upgraded");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const { rows: candidates } = await client.query(`
      SELECT id, name, LENGTH(system_prompt) AS prompt_len
      FROM agents
      WHERE (
        name ILIKE '%ASKOM%'
        OR name ILIKE '%asesor kompetensi%'
        OR name ILIKE '%asesor badan usaha%'
        OR name ILIKE '%ABU%'
        OR name ILIKE '%LSP%'
        OR name ILIKE '%lembaga sertifikasi%'
        OR name ILIKE '%asesor sertifikasi%'
        OR name ILIKE '%lisensi LSP%'
        OR name ILIKE '%akreditasi LSP%'
        OR name ILIKE '%BLKK%'
        OR name ILIKE '%TUK%'
        OR name ILIKE '%tempat uji kompetensi%'
        OR name ILIKE '%konsultan lisensi%'
        OR name ILIKE '%IT LSP%'
        OR name ILIKE '%manajer sertifikasi%'
        OR name ILIKE '%surveilans LSP%'
        OR name ILIKE '%RCC asesor%'
      )
      AND system_prompt IS NOT NULL
      AND LENGTH(system_prompt) > 100
      AND system_prompt NOT ILIKE '%${UPGRADE_MARKER}%'
      AND system_prompt NOT ILIKE '%SBU_ABD_v1.1_UPGRADED%'
      AND system_prompt NOT ILIKE '%SKK_ABD_v1.1_UPGRADED%'
      ORDER BY id
    `);

    console.log(`Found ${candidates.length} ASKOM/LSP agents to upgrade:\n`);
    for (const row of candidates) {
      console.log(`  ID ${String(row.id).padEnd(6)} ${row.name.slice(0, 70)}`);
    }

    if (candidates.length === 0) {
      console.log("\n✅ No ASKOM/LSP agents need upgrading.");
      return;
    }

    console.log(`\n📦 Injecting ASKOM/LSP ABD v1.1 block into ${candidates.length} agents...\n`);

    let upgraded = 0;
    const errors: Array<{ id: number; name: string; error: string }> = [];

    for (const row of candidates) {
      try {
        await client.query(`
          UPDATE agents
          SET system_prompt = system_prompt || $1
          WHERE id = $2
        `, [ABD_BLOCK_ASKOM, row.id]);
        console.log(`  ✅ ID ${String(row.id).padEnd(6)} — ${row.name.slice(0, 65)}`);
        upgraded++;
      } catch (err: any) {
        console.error(`  ❌ Error ID ${row.id}: ${err.message}`);
        errors.push({ id: row.id, name: row.name, error: err.message });
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`SELESAI: ${upgraded} upgraded | ${errors.length} error | ${candidates.length} total`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      for (const e of errors) console.log(`  ID ${e.id}: ${e.error}`);
    }

    const { rows: verify } = await client.query(`
      SELECT COUNT(*) AS count FROM agents
      WHERE system_prompt ILIKE '%${UPGRADE_MARKER}%'
    `);
    console.log(`\n🔎 Verification: ${verify[0].count} agents now carry ASKOM_ABD_v1.1_UPGRADED marker.`);
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
