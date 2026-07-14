import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type AgentType = "sbu"|"skk"|"askom"|"lsp"|"tender"|"iso9001"|"iso14001"|"smk3"|"smap"|"pancek"|"konstra"|"legal"|"lexcom"|"hub"|"coach"|"sbuclaw"|"tutor"|"properti"|"odoo"|"migas"|"perizinan"|"brain"|"trilogy"|"general";

function detectType(name: string, desc: string, cat: string|null, isOrch: boolean): AgentType {
  const n = name.toLowerCase(); const d = (desc||"").toLowerCase();
  if (n.includes("sbuclaw")||n.includes("sbu-claw")) return "sbuclaw";
  if (n.includes("konstra")||d.includes("manajemen konstruksi")) return "konstra";
  if ((n.includes("sbu")||d.includes("sertifikat badan usaha"))&&!n.includes("skk")) return "sbu";
  if (n.includes("skk")||d.includes("sertifikat kompetensi kerja")||n.includes("skkni")) return "skk";
  if (n.includes("askom")||d.includes("asesor kompetensi")) return "askom";
  if (n.includes("lsp")||n.includes("akreditasi kan")) return "lsp";
  if (n.includes("tendera")||(n.includes("tender")&&isOrch)) return "tender";
  if (n.includes("tender")||d.includes("pengadaan")) return "tender";
  if (n.includes("iso 9001")||n.includes("iso9001")||d.includes("iso 9001")) return "iso9001";
  if (n.includes("iso 14001")||n.includes("iso14001")||d.includes("iso 14001")) return "iso14001";
  if (n.includes("smk3")||d.includes("smk3")) return "smk3";
  if (n.includes("smap")||d.includes("manajemen anti penyuapan")) return "smap";
  if (n.includes("pancek")||d.includes("penilaian kinerja")) return "pancek";
  if (n.includes("legal")||n.includes("lexcom")) return "legal";
  if (n.includes("lex")||d.includes("hukum")||d.includes("pidana")) return "lexcom";
  if (n.includes("properti")||n.includes("real estat")||n.includes("devproper")||n.includes("estatecare")) return "properti";
  if (n.includes("odoo")||d.includes("erp")) return "odoo";
  if (n.includes("migas")||n.includes("ebt")||n.includes("tambang")) return "migas";
  if (n.includes("perizinan")||n.includes("nib")||n.includes("oss")) return "perizinan";
  if (n.includes("brain")||d.includes("brain project")) return "brain";
  if (n.includes("tutor")||n.includes("lexskripsi")) return "tutor";
  if (n.includes("hub")||isOrch) return "hub";
  if (n.includes("coach")||n.includes("advisor")||n.includes("panduan")||n.includes("guide")) return "coach";
  return "general";
}

const FEATURES: Record<AgentType, string[]> = {
  sbu: ["Panduan persyaratan SBU berbasis Permen PU 6/2025", "Analisis subklasifikasi sesuai bidang usaha BUJK", "Checklist kelengkapan dokumen pengajuan SBU", "Penjelasan alur OSS-RBA dan LPJK step-by-step", "Panduan kualifikasi Kecil/Menengah/Besar", "Estimasi waktu dan biaya proses SBU", "Panduan perpanjangan dan perubahan data SBU", "Compliance check terhadap regulasi terbaru"],
  skk: ["Panduan persyaratan SKK per jabatan kerja (SKKNI)", "Analisis level KKNI yang sesuai latar belakang kandidat", "Roadmap karir tenaga kerja konstruksi", "Checklist persiapan uji kompetensi LSP/BNSP", "Panduan penyusunan portofolio kompetensi", "Informasi TUK dan jadwal uji kompetensi", "Panduan perpanjangan SKK dan CPD", "Mapping jabatan kerja ke regulasi SK Dirjen 114"],
  askom: ["Panduan alur ASKOM sesuai BNSP Pedoman 201/301", "Bimbingan pengisian FR-APL-01 dan FR-APL-02", "Checklist bukti kompetensi untuk portofolio asesmen", "Penjelasan metode uji: observasi, wawancara, portofolio", "Panduan persiapan demonstrasi kompetensi di TUK", "Informasi prosedur banding hasil asesmen", "Simulasi pertanyaan asesmen kompetensi", "Panduan unit kompetensi SKKNI yang relevan"],
  lsp: ["Panduan pendirian dan lisensi LSP dari BNSP", "Checklist persyaratan akreditasi KAN (ISO/IEC 17024)", "Template dokumen manajemen LSP (kebijakan, prosedur)", "Panduan pengembangan skema sertifikasi yang valid", "Sistem manajemen asesor dan TUK", "Persiapan audit surveillance dan re-akreditasi", "Panduan penanganan banding dan keluhan asesi", "Analisis kepatuhan terhadap persyaratan KAN terbaru"],
  tender: ["Analisis dokumen tender dan persyaratan kualifikasi", "Strategi penawaran harga kompetitif berbasis AHSP", "Checklist kelengkapan dokumen penawaran", "Analisis win probability berdasarkan profil BUJK", "Panduan proses pra-kualifikasi dan kualifikasi", "Simulasi skenario negosiasi dan sanggah", "Template dokumen tender standar", "Panduan pengelolaan kontrak pasca-award"],
  iso9001: ["Perancangan Sistem Manajemen Mutu (QMS) sesuai ISO 9001:2015", "Template dokumen wajib: Manual Mutu, Prosedur, Instruksi Kerja", "Panduan pelaksanaan audit internal yang efektif", "Sistem penanganan ketidaksesuaian dan tindakan korektif", "Dashboard sasaran mutu dan KPI", "Persiapan audit sertifikasi oleh CB terakreditasi KAN", "Analisis risiko dan peluang berbasis risk-based thinking", "Program peningkatan berkelanjutan (continual improvement)"],
  iso14001: ["Perancangan Sistem Manajemen Lingkungan (EMS) ISO 14001:2015", "Identifikasi dan penilaian aspek-dampak lingkungan", "Pemetaan peraturan lingkungan yang berlaku", "Program pengelolaan limbah B3 dan non-B3", "Panduan pemantauan dan pengukuran kinerja lingkungan", "Persiapan audit sertifikasi ISO 14001", "Integrasi EMS dengan sistem manajemen lain (IMS)", "Pelaporan kinerja lingkungan yang transparan"],
  smk3: ["Perancangan SMK3 sesuai PP No. 50 Tahun 2012", "Template Hazard Identification Risk Assessment (HIRA)", "Job Safety Analysis (JSA) untuk pekerjaan berisiko tinggi", "Checklist APD dan peralatan keselamatan", "Prosedur investigasi kecelakaan dan near miss", "Program pelatihan K3 dan safety induction", "Persiapan audit SMK3 oleh Kemenaker", "Laporan statistik K3 dan zero accident monitoring"],
  smap: ["Perancangan SMAP sesuai ISO 37001:2016", "Template kebijakan anti-penyuapan perusahaan", "Sistem due diligence mitra bisnis dan vendor", "Mekanisme whistleblowing yang efektif dan rahasia", "Panduan penanganan pelaporan gratifikasi ke KPK", "Program pelatihan integritas dan etika bisnis", "Persiapan audit sertifikasi ISO 37001", "Monitoring kepatuhan dan review berkala SMAP"],
  pancek: ["Analisis kelengkapan dokumen PANCEK", "Penilaian kapasitas teknis dan manajerial BUJK", "Review laporan keuangan untuk penilaian PANCEK", "Strategi peningkatan rating kinerja BUJK", "Panduan penyusunan portofolio proyek yang kuat", "Analisis gap dan rekomendasi perbaikan", "Simulasi penilaian PANCEK sebelum evaluasi resmi", "Monitoring indikator kinerja konstruksi berkelanjutan"],
  konstra: ["Pengendalian proyek multi-agen (9 spesialis paralel)", "Earned Value Management (EVM) — biaya dan jadwal", "Manajemen mutu lapangan sesuai ISO 9001", "Monitoring K3/SMK3 dan safety compliance", "Pengelolaan aspek lingkungan ISO 14001 proyek", "Analisis kontrak dan klaim FIDIC", "Optimasi peralatan dan OEE", "Laporan keuangan proyek (PSAK 34 & PPh konstruksi)"],
  legal: ["Analisis kontrak kerja konstruksi sesuai regulasi", "Panduan mekanisme penyelesaian sengketa (BANI/Arbitrase)", "Checklist jaminan wajib dalam kontrak konstruksi", "Panduan klaim dan perubahan lingkup (change order)", "Analisis kepatuhan regulasi UU 2/2017 dan PP 14/2021", "Panduan sanksi dan konsekuensi hukum pelanggaran", "Draft dan review klausul kontrak konstruksi", "Hak dan kewajiban para pihak dalam kontrak"],
  lexcom: ["Analisis yuridis perdata dan pidana berbasis KUHP terbaru", "Panduan prosedur pengadilan dan arbitrase", "Research regulasi dan yurisprudensi Indonesia", "Draft dan review perjanjian/kontrak", "Analisis risiko hukum transaksi bisnis", "Panduan kepatuhan regulasi sektoral", "Penjelasan hak dan kewajiban hukum para pihak", "Rekomendasi strategi penyelesaian sengketa"],
  hub: ["Routing cepat ke chatbot spesialis yang paling relevan", "Pemetaan kebutuhan pengguna ke domain yang tepat", "Overview semua layanan dan chatbot yang tersedia", "Panduan navigasi ekosistem regulasi konstruksi", "Rekomendasi langkah pertama berdasarkan kebutuhan", "Informasi umum regulasi jasa konstruksi Indonesia", "Koneksi ke domain SBU, SKK, Tender, ISO, K3, Legal", "Panduan alur proses end-to-end dari perizinan hingga operasional"],
  coach: ["Konsultasi strategis pengembangan kapasitas BUJK", "Panduan step-by-step compliance regulasi konstruksi", "Analisis gap dan rekomendasi perbaikan bisnis", "Program pengembangan SDM konstruksi", "Strategi peningkatan daya saing di pasar konstruksi", "Panduan best practice operasional konstruksi", "Problem solving berbasis regulasi dan pengalaman industri", "Knowledge transfer teknologi dan inovasi konstruksi"],
  sbuclaw: ["Multi-agen paralel: 10 spesialis SBU bekerja bersamaan", "AGENT-MAPPER: mapping subklasifikasi SBU otomatis", "AGENT-QUALIFY: gap analysis kualifikasi BUJK", "AGENT-DOCS: checklist dokumen lengkap", "AGENT-SKKMATCH: pencocokan SKK yang dibutuhkan", "AGENT-LETTERGEN: draft surat 5 jenis otomatis", "AGENT-COST: estimasi biaya dan timeline SBU", "AGENT-ASSESS: asesmen kesiapan BUJK 8 dimensi"],
  tutor: ["Pembelajaran adaptif berbasis kebutuhan individual", "Metode Socratis — pertanyaan pemandu pemahaman mendalam", "Materi terstruktur regulasi dan teknis konstruksi", "Bimbingan akademik dan penulisan ilmiah", "Simulasi ujian dan latihan soal kompetensi", "Feedback konstruktif dan penjelasan konseptual", "Integrasi teori dengan praktik nyata industri", "Progress tracking dan rekomendasi materi berikutnya"],
  properti: ["Analisis kelayakan investasi properti", "Panduan perizinan pembangunan (IMB/PBG)", "Review regulasi pertanahan dan agraria", "Analisis pasar properti dan tren investasi", "Panduan pembiayaan properti (KPR/KPA)", "Checklist due diligence akuisisi properti", "Panduan manajemen gedung dan fasilitas", "Analisis risiko pengembangan properti"],
  odoo: ["Konfigurasi dan setup modul Odoo untuk konstruksi", "Panduan akuntansi dan pelaporan keuangan Odoo", "Optimasi manajemen proyek di Odoo Project", "Integrasi Odoo dengan sistem dan aplikasi lain", "Kustomisasi workflow sesuai kebutuhan BUJK", "Pelatihan penggunaan Odoo untuk tim operasional", "Troubleshooting dan dukungan teknis Odoo", "Migrasi data dari sistem lama ke Odoo"],
  migas: ["Panduan sertifikasi kompetensi sektor Migas/EBT/Tambang", "Analisis persyaratan SKK untuk jabatan kerja energi", "Standar keselamatan fasilitas migas (API/ASME)", "Panduan regulasi lingkungan sektor pertambangan", "Checklist kepatuhan operasional kilang dan fasilitas", "Panduan audit K3 industri energi", "Informasi perizinan operasional sektor migas", "Analisis risiko operasional fasilitas energi"],
  perizinan: ["Panduan step-by-step registrasi NIB di OSS RBA", "Identifikasi kode KBLI yang tepat untuk usaha konstruksi", "Checklist persyaratan perizinan berbasis tingkat risiko", "Panduan perubahan dan pembaruan data perizinan", "Integrasi persyaratan LPJK dalam perizinan konstruksi", "Monitoring status permohonan izin secara real-time", "Panduan izin khusus dan izin operasional sektoral", "Compliance check perizinan terhadap regulasi terkini"],
  brain: ["Sintesis laporan multi-spesialis dalam satu respons", "Dashboard pengendalian proyek terintegrasi", "Analisis Earned Value Management (EVM) real-time", "Monitoring K3 dan kepatuhan lingkungan proyek", "Review status kontrak dan klaim FIDIC", "Optimasi penggunaan sumber daya dan peralatan", "Laporan keuangan proyek berbasis PSAK 34", "Rekomendasi tindak lanjut prioritas dari 6 perspektif"],
  trilogy: ["Builder chatbot AI tanpa coding", "Hierarki agen 5-level (Master → Deep Specialist)", "Multi-agen orchestration dengan SSE streaming", "Knowledge Base dinamis dengan berbagai tipe dokumen", "Mini Apps terintegrasi (45 tipe tools)", "Fitur Persona, Project Brain, dan Agentic AI", "Monetisasi chatbot via Gustafta Store", "Analytics dan evaluasi performa chatbot"],
  general: ["Panduan regulasi jasa konstruksi Indonesia terkini", "Analisis persyaratan teknis dan legal per domain", "Checklist kepatuhan operasional BUJK", "Panduan pengembangan kapasitas perusahaan konstruksi", "Informasi sertifikasi dan perizinan yang dibutuhkan", "Strategi peningkatan daya saing di industri konstruksi", "Problem solving berbasis regulasi dan best practice", "Knowledge base regulasi konstruksi yang komprehensif"],
};

async function main() {
  const { rows: agents } = await pool.query<{ id: number; name: string; description: string; category: string|null; is_orchestrator: boolean }>(
    `SELECT id, name, description, category, is_orchestrator FROM agents WHERE is_active=true ORDER BY id`
  );
  console.log(`[ProductFeatures] Mengisi product_features untuk ${agents.length} agen...`);
  let updated = 0;
  for (const agent of agents) {
    const type = detectType(agent.name, agent.description||"", agent.category, agent.is_orchestrator);
    await pool.query(`UPDATE agents SET product_features = $1 WHERE id = $2`, [JSON.stringify(FEATURES[type]), agent.id]);
    updated++;
    if (updated % 100 === 0) console.log(`  Progress: ${updated}/${agents.length}`);
  }
  const { rows: check } = await pool.query(`SELECT COUNT(CASE WHEN product_features IS NULL OR product_features::text='[]' OR product_features::text='null' THEN 1 END) as empty FROM agents WHERE is_active=true`);
  console.log(`\n✅ Selesai — ${updated} agen diupdate.`);
  console.log(`Verifikasi product_features kosong: ${check[0].empty} (harus 0)`);
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
