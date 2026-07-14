/**
 * Seed taksonomi awal Knowledge Base — 8 sektor sesuai profesi user
 * (Legalitas, Perijinan, SBU, SKK, Tender, Pelaksanaan, Tata Kelola, Sistem Manajemen).
 *
 * Idempotent by slug per level. Aman dijalankan ulang.
 *
 * Cara pakai:
 *   npx tsx scripts/seed-knowledge-taxonomy.ts
 */
import pg from "pg";

const { Pool } = pg;

interface Subsektor {
  slug: string;
  name: string;
  description: string;
}

interface Sektor {
  slug: string;
  name: string;
  description: string;
  subsektor: Subsektor[];
}

const SEKTOR_SEED: Sektor[] = [
  {
    slug: "legalitas",
    name: "Legalitas Jasa Konstruksi",
    description: "Aspek hukum kontrak, sengketa, ketenagakerjaan, pajak, asuransi, dan kepailitan untuk industri jasa konstruksi.",
    subsektor: [
      { slug: "kontrak-perjanjian", name: "Kontrak & Perjanjian", description: "FIDIC, SBD PUPR, kontrak swasta, force majeure, eskalasi harga, klausul penalti." },
      { slug: "sengketa-dispute", name: "Sengketa & Dispute Resolution", description: "Dewan Sengketa Konstruksi (UU 2/2017), mediasi, arbitrase BANI, litigasi." },
      { slug: "hukum-operasional", name: "Hukum Operasional", description: "Ketenagakerjaan PKWT, PPh Final 4(2), PPN, asuransi CAR/EAR/TPL, PKPU/kepailitan." },
      { slug: "regulasi-induk", name: "Regulasi Induk", description: "UU 2/2017 Jasa Konstruksi, UU 30/1999 Arbitrase, KUHPerdata Buku III, PP 9/2022." },
    ],
  },
  {
    slug: "perijinan",
    name: "Perijinan Usaha Konstruksi",
    description: "OSS-RBA, NIB, IUJK, SLF, izin lingkungan, perizinan PJBU, dan turunan operasional.",
    subsektor: [
      { slug: "oss-rba-nib", name: "OSS-RBA & NIB", description: "Pendaftaran, KBLI konstruksi, klasifikasi risiko (rendah/menengah/tinggi)." },
      { slug: "iujk-sertifikat-usaha", name: "IUJK & Sertifikat Usaha", description: "Izin Usaha Jasa Konstruksi nasional/asing, syarat dan prosesnya." },
      { slug: "perizinan-bangunan", name: "Perizinan Bangunan", description: "PBG, SLF, IMB transisi, izin lingkungan AMDAL/UKL-UPL." },
      { slug: "anti-tolak-blueprint", name: "Anti-Tolak Blueprint", description: "5 fase pembinaan PUB-ASPEKINDO + Error Map E01-E16." },
    ],
  },
  {
    slug: "sertifikasi-badan-usaha",
    name: "Sertifikasi Badan Usaha (SBU)",
    description: "Klasifikasi & subklasifikasi SBU kontraktor (73 subklas) & konsultan (28 subklas), proses LSBU.",
    subsektor: [
      { slug: "sbu-kontraktor", name: "SBU Kontraktor", description: "73 subklasifikasi: bangunan gedung, sipil, EPC, mekanikal, elektrikal." },
      { slug: "sbu-konsultan", name: "SBU Konsultan", description: "28 subklasifikasi: perencanaan, pengawasan, konsultansi spesialis." },
      { slug: "lsbu-proses", name: "Proses LSBU", description: "Akreditasi, audit, sidang, perpanjangan, registrasi LPJK." },
      { slug: "iujptl-ketenagalistrikan", name: "IUJPTL Ketenagalistrikan", description: "Izin usaha jasa penunjang tenaga listrik, integrasi dengan SBU." },
    ],
  },
  {
    slug: "sertifikasi-kompetensi-kerja",
    name: "Sertifikasi Kompetensi Kerja (SKK)",
    description: "9 jenjang SKK Konstruksi, AJJ (Asesmen Jarak Jauh), persiapan uji, manajemen LSP.",
    subsektor: [
      { slug: "skk-jenjang-tenaga-ahli", name: "SKK Jenjang Tenaga Ahli (7-9)", description: "Ahli Muda/Madya/Utama: persyaratan, portofolio, uji kompetensi." },
      { slug: "skk-jenjang-tenaga-terampil", name: "SKK Jenjang Tenaga Terampil (1-6)", description: "Operator, teknisi, mandor: persyaratan dan jalur sertifikasi." },
      { slug: "skk-ajj-asesmen-jarak-jauh", name: "SKK AJJ", description: "Asesmen Jarak Jauh: tata cara, infrastruktur, asesor, dan kandidat." },
      { slug: "manajemen-lsp", name: "Manajemen LSP", description: "Lembaga Sertifikasi Profesi: akreditasi BNSP, asesor, skema sertifikasi." },
    ],
  },
  {
    slug: "tender",
    name: "Tender & Pengadaan Pemerintah (PBJP)",
    description: "Siklus tender LPSE/SPSE, dokumen penawaran, sanggahan, kontrak PBJP.",
    subsektor: [
      { slug: "strategi-persiapan-tender", name: "Strategi & Persiapan Tender", description: "Market intelligence LPSE/SPSE, bid/no-bid, konsorsium/JO, pricing/HPS." },
      { slug: "penyusunan-dokumen-penawaran", name: "Penyusunan Dokumen Penawaran", description: "Administrasi, teknis, RAB/BoQ, compliance checker, sanggahan." },
      { slug: "regulasi-pbjp", name: "Regulasi PBJP", description: "Perpres 16/2018 jo. 12/2021, Perlem LKPP No. 12/2021, SBD PUPR." },
      { slug: "anti-gugur-blueprint", name: "Anti-Gugur Blueprint", description: "Tiga Pilar Validasi, Error Map E01-E16 sisi tender." },
    ],
  },
  {
    slug: "pelaksanaan-proyek",
    name: "Pelaksanaan Proyek Konstruksi",
    description: "Eksekusi lapangan: perencanaan eksekusi, operasional, pengendalian, pelaporan.",
    subsektor: [
      { slug: "perencanaan-eksekusi", name: "Perencanaan Eksekusi", description: "RAB pelaksanaan, master schedule/S-curve, method statement, resource loading." },
      { slug: "operasional-lapangan", name: "Operasional Lapangan", description: "DPR, opname/QS, material/logistik, subkon/mandor, K3 lapangan." },
      { slug: "pengendalian-pelaporan", name: "Pengendalian & Pelaporan", description: "EVM (CPI/SPI), NCR/CAPA, punch list, weekly report owner." },
      { slug: "pasca-tender-kontrak", name: "Pasca Tender & Manajemen Kontrak", description: "SPPBJ, bank garansi, PCM, addendum/CCO, MC/termin, BAST PHO/FHO." },
    ],
  },
  {
    slug: "tata-kelola-usaha",
    name: "Tata Kelola Usaha Jasa Konstruksi",
    description: "PJBU, sistem informasi pembinaan, ERP/Odoo, mentoring profesional.",
    subsektor: [
      { slug: "pjbu-pembinaan", name: "PJBU & Pembinaan", description: "SIP-PJBU, registrasi & pembinaan PJBU, pelaporan periodik." },
      { slug: "erp-odoo-konstruksi", name: "ERP & Odoo Konstruksi", description: "Modul akuntansi, project, procurement, HR untuk kontraktor." },
      { slug: "mentoring-profesional", name: "Mentoring Profesional Sipil", description: "CIVILPRO: pengembangan karir teknik sipil, supervisi senior." },
      { slug: "ekosistem-asosiasi", name: "Ekosistem Asosiasi", description: "Pembinaan ASPEKINDO, jaringan asosiasi industri konstruksi." },
    ],
  },
  {
    slug: "sistem-manajemen",
    name: "Sistem Manajemen (ISO, SMK3, Pancek)",
    description: "ISO 9001/14001, SMK3 (PP 50/2012), Pancek/CSMAS, ISO 37001 SMAP.",
    subsektor: [
      { slug: "iso-9001-mutu", name: "ISO 9001 — Sistem Manajemen Mutu", description: "Implementasi & audit ISO 9001:2015 untuk kontraktor/konsultan." },
      { slug: "iso-14001-lingkungan", name: "ISO 14001 — Sistem Manajemen Lingkungan", description: "Aspek dampak lingkungan proyek konstruksi." },
      { slug: "smk3-pp-50-2012", name: "SMK3 (PP 50/2012)", description: "Sistem Manajemen K3 wajib untuk usaha konstruksi, audit Kemnaker." },
      { slug: "smap-pancek-csmas", name: "SMAP/Pancek/CSMAS", description: "ISO 37001 anti-suap, Pancek (Pancasila Compliance), CSMAS." },
    ],
  },
];

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL tidak ter-set.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: databaseUrl });
  let createdSektor = 0;
  let createdSubsektor = 0;
  let skippedSektor = 0;
  let skippedSubsektor = 0;

  try {
    const client = await pool.connect();
    try {
      for (let i = 0; i < SEKTOR_SEED.length; i++) {
        const sektor = SEKTOR_SEED[i];
        await client.query("BEGIN");
        try {
          // Cek root sektor by slug + level=sektor
          const existSektor = await client.query(
            "SELECT id FROM knowledge_taxonomy WHERE slug = $1 AND level = 'sektor' AND parent_id IS NULL FOR UPDATE",
            [sektor.slug]
          );
          let sektorId: number;
          if (existSektor.rows.length > 0) {
            sektorId = existSektor.rows[0].id;
            skippedSektor++;
            console.log(`⚠ Sektor sudah ada: ${sektor.name} (id=${sektorId})`);
          } else {
            const ins = await client.query(
              `INSERT INTO knowledge_taxonomy (parent_id, name, slug, level, description, sort_order, is_active)
               VALUES (NULL, $1, $2, 'sektor', $3, $4, true) RETURNING id`,
              [sektor.name, sektor.slug, sektor.description, i]
            );
            sektorId = ins.rows[0].id;
            createdSektor++;
            console.log(`✓ Sektor baru: ${sektor.name} (id=${sektorId})`);
          }

          // Subsektor
          for (let j = 0; j < sektor.subsektor.length; j++) {
            const sub = sektor.subsektor[j];
            const existSub = await client.query(
              "SELECT id FROM knowledge_taxonomy WHERE slug = $1 AND parent_id = $2 FOR UPDATE",
              [sub.slug, sektorId]
            );
            if (existSub.rows.length > 0) {
              skippedSubsektor++;
              continue;
            }
            await client.query(
              `INSERT INTO knowledge_taxonomy (parent_id, name, slug, level, description, sort_order, is_active)
               VALUES ($1, $2, $3, 'subsektor', $4, $5, true)`,
              [sektorId, sub.name, sub.slug, sub.description, j]
            );
            createdSubsektor++;
            console.log(`  ✓ Subsektor baru: ${sub.name}`);
          }
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`✗ Gagal seed ${sektor.name}:`, err);
          throw err;
        }
      }
    } finally {
      client.release();
    }
    console.log("\n=== RINGKASAN ===");
    console.log(`Sektor baru   : ${createdSektor}`);
    console.log(`Sektor skip   : ${skippedSektor}`);
    console.log(`Subsektor baru: ${createdSubsektor}`);
    console.log(`Subsektor skip: ${skippedSubsektor}`);
  } finally {
    await pool.end();
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
