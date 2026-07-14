/**
 * upgrade-all-remaining-abd.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgrade SEMUA agen yang belum diupgrade dengan formula MultiClaw Agentic AI
 * ABD v1.1 — mencakup domain: LSBU, Personel Manajerial BUJK, PJ-BUJK,
 * ISO 9001/14001, CSMS, IMS/SMK3, SMAP, Tender/Kontrak, Legal Konstruksi,
 * Katalog Jabatan SKK Coach, SKKNI EDU/QUIZ/PORTO series, Odoo, Properti,
 * LexCom, AI Tutor, AJJ, dan seluruh agen generik lainnya.
 *
 * Blok yang diinjeksikan:
 *   1. CATATAN REGULASI WAJIB (universal + domain-aware)
 *   2. POLA KERJA v2.0 (ELICIT MAX 1, ANTI INTERROGATION, REFLECT, ANTI H-AS-API)
 *   3. STATE MACHINE (INIT -> ELICIT -> PLAN -> DELIVER)
 *   4. ANTI-BLOCK DOCTRINE (ABD-7 output + heuristik default)
 *   5. GUARDRAILS universal
 *
 * Marker: ABD_v1.1_UPGRADED
 * Skip: SBU_ABD_v1.1_UPGRADED | SKK_ABD_v1.1_UPGRADED | ASKOM_ABD_v1.1_UPGRADED
 *       | ABD_v1.1_UPGRADED (idempotent)
 * Exclude: IDs 1394–1404 (SBUClaw specialists already seeded ABD-compliant)
 *          IDs 1272–1281 (KONSTRA specialists already seeded ABD-compliant)
 *
 * Run: npx tsx scripts/upgrade-all-remaining-abd.ts
 */

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UPGRADE_MARKER = "ABD_v1.1_UPGRADED";

const ABD_BLOCK_UNIVERSAL = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MULTICLAW AGENTIC AI — ABD v1.1 UPGRADE [${UPGRADE_MARKER}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CATATAN REGULASI WAJIB — KONSTRUKSI & JASA KONSTRUKSI
Agen ini beroperasi dalam ekosistem regulasi berikut (gunakan sesuai domain):
- **UU No. 2 Tahun 2017** (Jasa Konstruksi) — dasar hukum utama seluruh rantai sertifikasi & kelembagaan.
- **PP No. 14 Tahun 2021** (Perubahan atas PP 22/2020) — operasional usaha jasa konstruksi.
- **Permen PU No. 6 Tahun 2025** — SBU (Sertifikat Badan Usaha), menggantikan Permen PU 8/2022.
  ⚠ SK Dirjen No. 37/2025 masih berpedoman Permen lama — JANGAN jadikan acuan utama SBU.
- **Permen PUPR No. 9 Tahun 2023** — SKK (Sertifikat Kompetensi Kerja) Konstruksi.
- **SK Dirjen Bina Konstruksi No. 114/KPTS/Dk/2024** — jabatan kerja, subklasifikasi, & SKKNI acuan teknis (WAJIB diacu untuk SKK).
- **BNSP Pedoman 201/202/301/303** — lisensi & operasional LSP, prosedur asesmen kompetensi.
- **SKKNI 333/2020** — 3 unit ASKOM (MAPA · MA · MKVA).
- **SNI ISO/IEC 17024:2012** — akreditasi LSP oleh KAN.
- **PP No. 10 Tahun 2018** — BNSP dan sistem sertifikasi nasional.
- **ISO 9001:2015 / ISO 14001:2015** — sistem manajemen mutu & lingkungan.
- **PP No. 50 Tahun 2012 + Permen Ketenagakerjaan No. 26/2014** — SMK3.
- **Perpres No. 39 Tahun 2014 + ISO 37001:2016** — SMAP (Sistem Manajemen Anti Penyuapan).
- **FIDIC Suite (MDB Harmonised, Rainbow Books)** — manajemen kontrak konstruksi internasional.
- Portal resmi: oss.go.id · sijk.pu.go.id · lpjk.pu.go.id · bnsp.go.id · kan.or.id · serkom.co.id
- Jika detail prosedur belum tersedia -> gunakan [ASUMSI: ...] dan rekomendasikan konfirmasi ke instansi berwenang.

## POLA KERJA v2.0 (WAJIB SEMUA AGEN)
**ELICIT MAX 1 PUTARAN** — Jika informasi kritis kurang, ajukan SATU pertanyaan klarifikasi tertutup (≤3 opsi pilihan), lalu jawab langsung dengan data yang tersedia. JANGAN blokir respons karena informasi kurang.
**ANTI INTERROGATION MODE** — DILARANG bertanya lebih dari 1 hal per turn. Pilih gap paling kritis.
**REFLECT SEBELUM DELIVER** — Periksa kelengkapan output (ABD-7) sebelum kirim. Tambah [ASUMSI:] bila perlu.
**ANTI HUMAN-AS-API** — DILARANG minta user menyiapkan semua berkas/data sebelum memberi jawaban apapun. Mulai dari informasi minimal yang tersedia.

## STATE MACHINE — ALUR KERJA STANDAR
INIT   : Kenali intent user + data yang tersedia (domain, konteks, profil user).
ELICIT : Jika ada GAP KRITIS: 1 pertanyaan tertutup (max 3 opsi). Jika cukup: langsung PLAN.
PLAN   : Susun respons best-effort + [ASUMSI:] eksplisit untuk setiap inferensi.
DELIVER: Kirim output ABD-7 ringkas + 3-5 next step konkret atau quick replies.

## ANTI-BLOCK DOCTRINE (ABD v1.1) — OUTPUT WAJIB
**WAJIB** memberikan jawaban substantif dari data minimal — nama bidang atau konteks singkat sudah cukup untuk memulai.
**DILARANG** menolak menjawab atau hanya balik bertanya tanpa substansi terlebih dahulu.
**Jika data kurang** -> gunakan heuristik default domain + tag [ASUMSI:] eksplisit.

### Heuristik Default Universal
- Tidak ada info peran/jenjang -> asumsikan pemula yang baru memulai proses.
- Tidak ada info subklasifikasi -> rekomendasikan subklasifikasi paling umum di bidang yang disebutkan.
- Tidak ada info dokumen -> sajikan checklist dokumen standar untuk tahap awal.
- Tidak ada info regulasi yang berlaku -> gunakan regulasi termutakhir yang relevan dengan domain.
- Tidak ada info skala proyek -> asumsikan skala menengah sebagai baseline.

### Format Tag Asumsi (WAJIB dipakai)
  [ASUMSI: {nilai yang diasumsikan} | basis: {regulasi/standar} | verifikasi-ke: {instansi berwenang}]

### Urutan Output per Respons (ABD-7)
1. **Jawaban substantif** — jawab langsung pertanyaan dengan data yang ada
2. **[ASUMSI:]** — sebutkan inferensi yang dipakai (bila ada)
3. **Gap/ketidakpastian** — apa yang perlu dikonfirmasi ke instansi
4. **Next step konkret** — langkah terurut yang bisa segera diambil
5. **Referensi regulasi** — peraturan/standar yang relevan dengan topik
6. **Risiko** — jika asumsi tidak sesuai kondisi riil
7. **Alternatif** — opsi jalur/pendekatan lain (bila ada)
* Eskalasi ke instansi berwenang jika di luar kapasitas agen

## GUARDRAILS UNIVERSAL (ABD-Compliant)
- DILARANG memberikan kepastian hasil yang bergantung pada keputusan instansi pemerintah/lembaga (terbit/tidaknya sertifikat, lulus/tidaknya asesmen, dll).
- DILARANG memberikan opini hukum mengikat — selalu tambahkan "konsultasikan ke kuasa hukum/instansi berwenang."
- DILARANG bertanya balik tanpa memberikan substansi jawaban terlebih dahulu (anti-blocking utama).
- DILARANG menyarankan manipulasi dokumen, data, atau persyaratan apapun.
- WAJIB sertakan [ASUMSI:] eksplisit untuk setiap inferensi prosedur atau persyaratan.
- WAJIB confidence score atau indikasi keyakinan pada penilaian kesiapan/kelayakan.
- WAJIB disclaimer: "Konfirmasi persyaratan final ke instansi resmi sebelum mengajukan."
- Gunakan bahasa Indonesia profesional kecuali user memulai dengan bahasa lain.`;

// IDs that are already ABD-compliant from seeding — exclude them
const EXCLUDE_IDS = [
  // SBUClaw specialists (seeded ABD-compliant)
  1394, 1395, 1396, 1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404,
  // KONSTRA specialists (seeded ABD-compliant)
  1272, 1273, 1274, 1275, 1276, 1277, 1278, 1279, 1280, 1281,
];

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("MULTICLAW Agentic AI — Universal ABD v1.1 Upgrade Script");
    console.log("Target: ALL remaining agents (LSBU, PJ-BUJK, ISO, CSMS, Tender, Legal, SKKNI, dll)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const excludePlaceholders = EXCLUDE_IDS.map((_, i) => `$${i + 1}`).join(",");

    const { rows: candidates } = await client.query(`
      SELECT id, name, LENGTH(system_prompt) AS prompt_len
      FROM agents
      WHERE system_prompt IS NOT NULL
        AND LENGTH(system_prompt) > 100
        AND system_prompt NOT ILIKE '%SBU_ABD_v1.1_UPGRADED%'
        AND system_prompt NOT ILIKE '%SKK_ABD_v1.1_UPGRADED%'
        AND system_prompt NOT ILIKE '%ASKOM_ABD_v1.1_UPGRADED%'
        AND system_prompt NOT ILIKE '%${UPGRADE_MARKER}%'
        AND id NOT IN (${excludePlaceholders})
      ORDER BY id
    `, EXCLUDE_IDS);

    console.log(`Found ${candidates.length} agents to upgrade (excluding ${EXCLUDE_IDS.length} already-seeded ABD agents)\n`);

    // Print domain summary
    const groups: Record<string, number> = {};
    for (const row of candidates) {
      const name = row.name as string;
      let domain = "Other";
      if (/LSBU|lembaga sertifikasi badan/i.test(name)) domain = "LSBU";
      else if (/PJBU|PJTBU|PJKBU|PJSKBU|personel manajerial|penanggung jawab/i.test(name)) domain = "PJ-BUJK";
      else if (/ISO 14001|ISO 9001/i.test(name)) domain = "ISO";
      else if (/CSMS|SMK3|IMS|SMAP/i.test(name)) domain = "CSMS/SMK3/SMAP";
      else if (/LEX|AGENT-PIDANA|AGENT-PERDATA|hukum/i.test(name)) domain = "Legal";
      else if (/properti|estate|devProperti/i.test(name)) domain = "Properti";
      else if (/katalog|asesmen|studi kasus|AGENT-EDU|EDU|QUIZ|PORTO|ASESOR/i.test(name)) domain = "Katalog/SKK-Coach/SKKNI";
      else if (/tender|kontrak|RAB|site|manajemen kontrak/i.test(name)) domain = "Tender/Kontrak";
      else if (/Odoo/i.test(name)) domain = "Odoo";
      else if (/tutor|AI Tutor|IB-TU|TU-/i.test(name)) domain = "AI-Tutor/IB";
      else if (/AGENT-|BRAIN-|ORCHESTRATOR/i.test(name)) domain = "Agentic Sub-Agents";
      groups[domain] = (groups[domain] || 0) + 1;
    }
    console.log("Domain breakdown:");
    for (const [domain, count] of Object.entries(groups).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${domain.padEnd(30)} ${count} agents`);
    }

    console.log(`\n📦 Injecting Universal ABD v1.1 block into ${candidates.length} agents...\n`);

    let upgraded = 0;
    let skipped = 0;
    const errors: Array<{ id: number; name: string; error: string }> = [];

    // Batch in groups of 50 for efficiency
    const BATCH_SIZE = 50;
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const batchIds = batch.map(r => r.id);

      try {
        await client.query(`
          UPDATE agents
          SET system_prompt = system_prompt || $1
          WHERE id = ANY($2::int[])
        `, [ABD_BLOCK_UNIVERSAL, batchIds]);

        for (const row of batch) {
          console.log(`  ✅ ID ${String(row.id).padEnd(6)} — ${(row.name as string).slice(0, 65)}`);
          upgraded++;
        }
      } catch (err: any) {
        // Fallback: individual update for this batch
        for (const row of batch) {
          try {
            await client.query(`
              UPDATE agents SET system_prompt = system_prompt || $1 WHERE id = $2
            `, [ABD_BLOCK_UNIVERSAL, row.id]);
            console.log(`  ✅ ID ${String(row.id).padEnd(6)} — ${(row.name as string).slice(0, 65)}`);
            upgraded++;
          } catch (e2: any) {
            console.error(`  ❌ Error ID ${row.id}: ${e2.message}`);
            errors.push({ id: row.id, name: row.name, error: e2.message });
          }
        }
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`SELESAI: ${upgraded} upgraded | ${errors.length} error | ${candidates.length} total`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      for (const e of errors) console.log(`  ID ${e.id} ${e.name}: ${e.error}`);
    }

    // Final tally — all markers
    const { rows: tally } = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE system_prompt ILIKE '%SBU_ABD_v1.1_UPGRADED%') AS sbu,
        COUNT(*) FILTER (WHERE system_prompt ILIKE '%SKK_ABD_v1.1_UPGRADED%') AS skk,
        COUNT(*) FILTER (WHERE system_prompt ILIKE '%ASKOM_ABD_v1.1_UPGRADED%') AS askom,
        COUNT(*) FILTER (WHERE system_prompt ILIKE '%ABD_v1.1_UPGRADED%') AS universal,
        COUNT(*) FILTER (WHERE 
          system_prompt ILIKE '%SBU_ABD_v1.1_UPGRADED%'
          OR system_prompt ILIKE '%SKK_ABD_v1.1_UPGRADED%'
          OR system_prompt ILIKE '%ASKOM_ABD_v1.1_UPGRADED%'
          OR system_prompt ILIKE '%ABD_v1.1_UPGRADED%'
        ) AS total_upgraded,
        COUNT(*) AS grand_total
      FROM agents WHERE system_prompt IS NOT NULL AND LENGTH(system_prompt) > 100
    `);

    const t = tally[0];
    console.log("\n🔎 ABD Upgrade Summary Across All Markers:");
    console.log(`  SBU_ABD_v1.1_UPGRADED   : ${t.sbu} agents`);
    console.log(`  SKK_ABD_v1.1_UPGRADED   : ${t.skk} agents`);
    console.log(`  ASKOM_ABD_v1.1_UPGRADED : ${t.askom} agents`);
    console.log(`  ABD_v1.1_UPGRADED (univ): ${t.universal} agents`);
    console.log(`  ─────────────────────────────────────────`);
    console.log(`  TOTAL UPGRADED          : ${t.total_upgraded} / ${t.grand_total} agents`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
