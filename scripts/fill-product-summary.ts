import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type AgentType = "sbu"|"skk"|"askom"|"lsp"|"tender"|"iso9001"|"iso14001"|"smk3"|"smap"|"pancek"|"konstra"|"legal"|"lexcom"|"hub"|"coach"|"sbuclaw"|"tutor"|"properti"|"odoo"|"migas"|"perizinan"|"brain"|"trilogy"|"general";

function detectType(name: string, desc: string, cat: string|null, isOrch: boolean): AgentType {
  const n = name.toLowerCase(); const d = (desc||"").toLowerCase(); const c = (cat||"").toLowerCase();
  if (n.includes("sbuclaw")||n.includes("sbu-claw")) return "sbuclaw";
  if (n.includes("konstra")||d.includes("manajemen konstruksi")) return "konstra";
  if ((n.includes("sbu")||d.includes("sertifikat badan usaha"))&&!n.includes("skk")) return "sbu";
  if (n.includes("skk")||d.includes("sertifikat kompetensi kerja")||n.includes("skkni")) return "skk";
  if (n.includes("askom")||d.includes("asesor kompetensi")) return "askom";
  if (n.includes("lsp")||n.includes("akreditasi kan")) return "lsp";
  if (n.includes("tendera")||(n.includes("tender")&&isOrch)) return "tender";
  if (n.includes("tender")||d.includes("pengadaan")||c==="tender") return "tender";
  if (n.includes("iso 9001")||n.includes("iso9001")||d.includes("iso 9001")) return "iso9001";
  if (n.includes("iso 14001")||n.includes("iso14001")||d.includes("iso 14001")) return "iso14001";
  if (n.includes("smk3")||d.includes("smk3")||d.includes("keselamatan konstruksi")) return "smk3";
  if (n.includes("smap")||d.includes("manajemen anti penyuapan")) return "smap";
  if (n.includes("pancek")||d.includes("penilaian kinerja")) return "pancek";
  if (n.includes("legal")||n.includes("lexcom")||c==="legal") return "legal";
  if (n.includes("lex")||d.includes("hukum")||d.includes("pidana")) return "lexcom";
  if (n.includes("properti")||n.includes("real estat")||n.includes("devproper")||n.includes("estatecare")) return "properti";
  if (n.includes("odoo")||d.includes("erp")) return "odoo";
  if (n.includes("migas")||n.includes("ebt")||n.includes("tambang")) return "migas";
  if (n.includes("perizinan")||n.includes("nib")||n.includes("oss")) return "perizinan";
  if (n.includes("brain")||d.includes("brain project")) return "brain";
  if (n.includes("tutor")||n.includes("lexskripsi")||c==="education") return "tutor";
  if (n.includes("hub")||isOrch) return "hub";
  if (n.includes("coach")||n.includes("advisor")||n.includes("panduan")||n.includes("guide")) return "coach";
  return "general";
}

const PRODUCT_SUMMARY: Record<AgentType, string> = {
  sbu: "Layanan panduan Sertifikat Badan Usaha (SBU) Konstruksi berbasis Permen PU No. 6 Tahun 2025. Membantu BUJK memahami persyaratan, subklasifikasi, alur pengajuan via OSS-RBA & LPJK, serta strategi mempertahankan keabsahan SBU. Mencakup semua kualifikasi: Kecil, Menengah, Besar — untuk BS, BG, IL, IM, KO.",
  skk: "Layanan panduan Sertifikat Kompetensi Kerja (SKK) Konstruksi berbasis Permen PUPR No. 9 Tahun 2023 dan SK Dirjen Bina Konstruksi No. 114/2024. Membantu tenaga kerja memahami persyaratan, jabatan kerja, alur uji kompetensi LSP/BNSP, dan pengembangan karir berbasis KKNI Level 1-9.",
  askom: "Layanan panduan Asesmen Kompetensi (ASKOM) Konstruksi sesuai BNSP Pedoman 201/301 dan SNI ISO/IEC 17024:2012. Membantu calon asesi mempersiapkan dokumen (FR-APL-01/02), memahami metode uji, dan menjalani proses asesmen kompetensi dengan sukses.",
  lsp: "Layanan panduan pendirian, akreditasi, dan operasional Lembaga Sertifikasi Profesi (LSP) sesuai BNSP Pedoman 202/303 dan SNI ISO/IEC 17024:2012. Mencakup proses lisensi BNSP, akreditasi KAN, pengembangan skema sertifikasi, manajemen asesor, dan pengelolaan TUK.",
  tender: "Layanan panduan strategis pengadaan dan tender konstruksi berbasis Perpres 16/2018. Membantu BUJK menyiapkan dokumen penawaran yang kompetitif, menganalisis peluang menang, memahami persyaratan kualifikasi, dan mengelola proses pasca-tender termasuk sanggah dan kontrak.",
  iso9001: "Layanan panduan implementasi Sistem Manajemen Mutu ISO 9001:2015 untuk perusahaan konstruksi. Mencakup perancangan QMS, dokumentasi wajib, audit internal, penanganan ketidaksesuaian, dan persiapan sertifikasi oleh Certification Body terakreditasi KAN.",
  iso14001: "Layanan panduan implementasi Sistem Manajemen Lingkungan ISO 14001:2015 untuk konstruksi. Mencakup identifikasi aspek-dampak lingkungan, kepatuhan regulasi lingkungan, program pengelolaan limbah, pemantauan kinerja, dan persiapan audit sertifikasi.",
  smk3: "Layanan panduan implementasi Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3) sesuai PP No. 50 Tahun 2012 dan ISO 45001. Mencakup HIRA, JSA, dokumentasi K3, program pencegahan kecelakaan, dan persiapan audit SMK3 oleh Kemenaker.",
  smap: "Layanan panduan implementasi Sistem Manajemen Anti Penyuapan (SMAP) ISO 37001:2016. Membantu perusahaan konstruksi membangun kebijakan integritas, due diligence mitra, sistem whistleblowing, dan mempersiapkan sertifikasi ISO 37001 sebagai bukti komitmen GCG.",
  pancek: "Layanan panduan Penilaian Kinerja BUJK (PANCEK) oleh PUPR. Membantu perusahaan memahami indikator penilaian, menyiapkan dokumentasi portofolio dan keuangan, meningkatkan rating kinerja, dan memanfaatkan hasil PANCEK untuk pengembangan kapasitas bisnis.",
  konstra: "Platform multi-agen manajemen proyek konstruksi (KONSTRA-ORCHESTRATOR). Mengintegrasikan 9 spesialis paralel: PM (PROXIMA), EVM, Mutu (ISO 9001), K3/SMK3 (SAFIRA), Lingkungan (ENVIRA), Kontrak FIDIC, Peralatan/OEE (EQUIPRA), Logistik, dan Keuangan (PSAK34). Laporan terintegrasi dalam satu respons.",
  legal: "Layanan panduan hukum jasa konstruksi Indonesia berbasis UU No. 2 Tahun 2017, PP No. 14 Tahun 2021, dan regulasi turunannya. Membantu memahami hak-kewajiban para pihak, struktur kontrak konstruksi, mekanisme penyelesaian sengketa, dan kepatuhan regulasi sektoral.",
  lexcom: "Layanan asisten hukum AI komprehensif untuk berbagai bidang hukum Indonesia — perdata, pidana (UU 1/2023 KUHP Baru), administrasi negara, ketenagakerjaan, perusahaan, agraria, pajak, dan regulasi sektoral. Didukung 8 spesialis hukum LexCom yang bekerja secara terintegrasi.",
  hub: "Hub navigasi regulasi jasa konstruksi yang mengarahkan pengguna ke chatbot spesialis paling relevan. Memetakan kebutuhan pengguna ke domain yang tepat — SBU, SKK, Tender, ISO, K3, Legal, Perizinan — dengan routing cepat dan akurat tanpa analisis mendalam di luar domain.",
  coach: "Layanan konsultasi dan pembimbingan teknis konstruksi yang komprehensif. Membantu BUJK dan praktisi industri memahami regulasi, menyusun strategi pengembangan kapasitas, memecahkan masalah operasional, dan meningkatkan daya saing melalui panduan berbasis best practice industri.",
  sbuclaw: "Platform OpenClaw multi-agen untuk pembuatan SBU Konstruksi secara end-to-end. 10 agen spesialis bekerja paralel: MAPPER (subklasifikasi), QUALIFY (gap analysis), DOCS (checklist), SKKMATCH (pencocokan SKK), LETTERGEN (draft surat), COST (estimasi biaya), ASSESS (kesiapan BUJK), OSS (walkthrough), COMPLY (regulasi), INTEGRITY (anti-fraud).",
  tutor: "Layanan pendidikan dan pembelajaran berbasis AI untuk bidang konstruksi, regulasi, dan akademik. Menggunakan pendekatan pedagogis adaptif — Socratis, pembelajaran berbasis masalah, dan scaffolding — untuk membangun pemahaman mendalam bagi pelajar, mahasiswa, dan profesional.",
  properti: "Layanan panduan pengembangan, investasi, dan manajemen properti Indonesia. Mencakup regulasi pertanahan, perizinan pembangunan (IMB/PBG), analisis pasar properti, pembiayaan, manajemen gedung, dan aspek hukum transaksi properti berbasis regulasi terkini.",
  odoo: "Layanan panduan implementasi dan optimasi ERP Odoo untuk perusahaan konstruksi Indonesia. Mencakup konfigurasi modul Project, Akuntansi, Inventory, HR, dan CRM, serta kustomisasi sesuai kebutuhan spesifik BUJK, pelatihan pengguna, dan dukungan teknis berkelanjutan.",
  migas: "Layanan panduan sertifikasi kompetensi, keselamatan, dan regulasi di sektor Migas, EBT (Energi Baru Terbarukan), dan Pertambangan Indonesia. Mencakup SKK Migas, standar keselamatan industri energi, peraturan lingkungan sektoral, dan pengembangan kompetensi tenaga kerja energi.",
  perizinan: "Layanan panduan perizinan usaha jasa konstruksi via OSS RBA (Online Single Submission Risk-Based Approach). Membantu BUJK mendapatkan NIB, memahami kode KBLI yang tepat, mengelola perubahan data perizinan, dan memastikan kepatuhan terhadap persyaratan perizinan sektoral konstruksi.",
  brain: "Platform multi-agen pengendalian proyek konstruksi (BRAIN Project). Mengintegrasikan 6 spesialis: PROXIMA (PM), EVM (biaya/jadwal), MUTU (QC), SAFIRA (K3/SMK3), ENVIRA (LH/ISO 14001), KONTRAK (FIDIC). Memberikan laporan pengendalian proyek yang holistik dan rekomendasi tindak lanjut terintegrasi.",
  trilogy: "Platform Gustafta AI Chatbot Builder — memungkinkan pembuatan, konfigurasi, dan deployment chatbot AI cerdas tanpa coding. Mendukung hierarki agen 5-level, multi-agen orchestration, knowledge base dinamis, mini apps, dan monetisasi. Dirancang khusus untuk ekosistem industri konstruksi Indonesia.",
  general: "Layanan konsultasi AI berbasis regulasi jasa konstruksi Indonesia. Memberikan panduan akurat dan dapat ditindaklanjuti untuk BUJK, tenaga kerja, dan praktisi industri konstruksi terkait regulasi, sertifikasi, perizinan, dan operasional bisnis konstruksi Indonesia.",
};

async function main() {
  const { rows: agents } = await pool.query<{ id: number; name: string; description: string; category: string|null; is_orchestrator: boolean }>(
    `SELECT id, name, description, category, is_orchestrator FROM agents WHERE is_active=true ORDER BY id`
  );
  console.log(`[ProductSummary] Mengisi product_summary untuk ${agents.length} agen...`);
  let updated = 0;
  for (const agent of agents) {
    const type = detectType(agent.name, agent.description||"", agent.category, agent.is_orchestrator);
    const ps = PRODUCT_SUMMARY[type];
    await pool.query(`UPDATE agents SET product_summary = $1 WHERE id = $2`, [ps, agent.id]);
    updated++;
    if (updated % 100 === 0) console.log(`  Progress: ${updated}/${agents.length}`);
  }
  console.log(`[ProductSummary] Selesai — ${updated} agen diupdate.`);
  // Verify
  const { rows: check } = await pool.query(`SELECT COUNT(CASE WHEN product_summary IS NULL OR product_summary='' THEN 1 END) as empty FROM agents WHERE is_active=true`);
  console.log(`Verifikasi: product_summary kosong = ${check[0].empty} (harus 0)`);
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
