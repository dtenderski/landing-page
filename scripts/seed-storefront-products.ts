/**
 * Seed Storefront / Product fields untuk semua 881 agen aktif
 * Fields: product_summary, product_problem, product_use_cases, product_target_user,
 *         product_features, product_pricing, monthly_price, branding_name, is_listed
 *
 * Run: node_modules/.bin/tsx scripts/seed-storefront-products.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Domain detection (same as conversion layer) ─────────────────────────────
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

// ─── Branding name generator ──────────────────────────────────────────────────
function makeBrandName(name: string): string {
  // Remove emoji + special chars, take first 3-4 words, title-case
  const clean = name
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[^\w\s\-–&()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove common prefix patterns like "AGENT-", "HUB-", "LEX-"
  const stripped = clean
    .replace(/^(AGENT|HUB|LEX|RG|AJJ|INV|SBU|SKK)\s*[-–]\s*/i, "")
    .replace(/\s*(ORCHESTRATOR|SYNTHESIS|v\d+\.\d+)\s*/gi, " ")
    .trim();

  // Take first 4 words max
  const words = stripped.split(/\s+/).filter(Boolean).slice(0, 4);
  const brand = words.join(" ");

  // Cap at 30 chars
  return brand.length > 30 ? brand.slice(0, 28).trim() + "…" : brand;
}

// ─── Domain product configs ───────────────────────────────────────────────────
interface ProductConfig {
  summary: string;
  problem: string;
  useCases: string;
  targetUser: string;
  features: string[];
  pricingType: string;
}

const CONFIGS: Record<string, ProductConfig> = {

  tender: {
    summary: "Asisten AI strategi tender & pengadaan — analisis dokumen, compliance matrix, strategi harga, dan panduan pemenuhan persyaratan LKPP/PBJP.",
    problem: "Kontraktor dan konsultan sering kesulitan memahami persyaratan KAK, menyusun dokumen penawaran yang kompetitif, dan menilai peluang menang (go/no-go) sebelum memutuskan ikut tender.",
    useCases: "Analisis kelayakan tender (go/no-go checklist); Review dokumen KAK dan penyusunan compliance matrix; Strategi penghitungan HPS dan harga penawaran; Simulasi checklist dokumen administrasi & teknis; Penyusunan laporan ringkasan eksekutif penawaran; Panduan aanwijzing dan klarifikasi.",
    targetUser: "Kontraktor, konsultan pengadaan, staf procurement BUMN/swasta, PPK, pejabat pengadaan pemerintah, dan direktur teknik perusahaan jasa konstruksi.",
    features: [
      "Go/No-Go Checklist — penilaian peluang sebelum memutuskan ikut tender",
      "Compliance Matrix KAK — analisis kesesuaian persyaratan secara otomatis",
      "Strategi penawaran harga & analisis HPS berbasis data pasar",
      "Checklist kelengkapan dokumen administrasi, teknis, dan harga",
      "Simulasi skenario aanwijzing dan pertanyaan klarifikasi",
      "Executive Summary Penawaran untuk presentasi kepada manajemen",
    ],
    pricingType: "free",
  },

  sbu: {
    summary: "Asisten AI pengurusan dan perpanjangan Sertifikat Badan Usaha (SBU) BUJK sesuai Permen PU No. 6 Tahun 2025 — gap analysis TKK, checklist dokumen, dan panduan proses OSS-LPJK.",
    problem: "BUJK sering tidak memahami persyaratan terbaru Permen PU 6/2025, mengalami kendala pemenuhan TKK (Tenaga Kerja Kompeten), atau tidak tahu alur proses OSS dan LPJK untuk pengurusan SBU yang benar.",
    useCases: "Gap analysis kesiapan SBU vs subklasifikasi target; Checklist TKK dan persyaratan SKK yang dibutuhkan; Panduan alur proses pengajuan SBU di OSS; Simulasi estimasi timeline dan biaya pengurusan; Panduan perpanjangan SBU yang hampir habis masa berlaku.",
    targetUser: "Direktur dan manajer BUJK (kontraktor & konsultan), staf legal/administrasi perusahaan konstruksi, konsultan SBU, dan asosiasi jasa konstruksi.",
    features: [
      "Gap Analysis TKK — identifikasi kekurangan Tenaga Kerja Kompeten vs syarat kualifikasi",
      "Checklist dokumen SBU lengkap sesuai Permen PU 6/2025",
      "Panduan step-by-step proses pengajuan di OSS dan LPJK",
      "Simulasi skor kesiapan BUJK (8 dimensi) dengan rekomendasi pemenuhan",
      "Panduan perpanjangan SBU — timeline, dokumen, dan risiko keterlambatan",
      "Update regulasi terbaru — perbedaan Permen 6/2025 vs 8/2022",
    ],
    pricingType: "free",
  },

  skk: {
    summary: "Asisten AI persiapan Sertifikat Kompetensi Kerja (SKK) — identifikasi jabatan KKNI, checklist bukti portofolio, simulasi uji kompetensi, dan panduan SK Dirjen 114/2024.",
    problem: "Tenaga kerja konstruksi kebingungan memilih skema SKK yang tepat, tidak tahu dokumen bukti apa yang perlu disiapkan, dan tidak siap menghadapi proses asesmen kompetensi di LSP.",
    useCases: "Identifikasi jabatan SKK yang sesuai berdasarkan pengalaman dan pendidikan; Checklist dokumen bukti kompetensi spesifik per jabatan; Simulasi pertanyaan uji tulis dan uji lisan asesor; Panduan pengisian FR-APL-01 dan FR-APL-02; Estimasi kesiapan uji dan rekomendasi gap yang perlu dipenuhi.",
    targetUser: "Tenaga kerja konstruksi (pelaksana, pengawas, perencana), mandor, site engineer, project manager yang ingin mendapatkan SKK, serta HRD perusahaan konstruksi.",
    features: [
      "Identifikasi jabatan SKK yang tepat berdasarkan profil pengalaman dan pendidikan",
      "Checklist bukti portofolio — dokumen wajib per jabatan dan jenjang KKNI",
      "Simulasi pertanyaan uji tulis & lisan sesuai standar SKKNI",
      "Panduan pengisian FR-APL-01 dan FR-APL-02 step-by-step",
      "Skor kesiapan uji dengan identifikasi gap dan rekomendasi pemenuhan",
      "Referensi SK Dirjen 114/2024 dan SKKNI terkini per jabatan",
    ],
    pricingType: "free",
  },

  askom: {
    summary: "Asisten AI asesor kompetensi — panduan penyusunan MUK, prosedur pelaksanaan asesmen, dan pengelolaan rekaman sesuai Pedoman BNSP 201/202/301/303.",
    problem: "Asesor dan koordinator LSP sering kesulitan menyusun MUK yang sesuai standar, memahami prosedur asesmen yang benar, atau mempersiapkan rekaman hasil asesmen untuk audit BNSP.",
    useCases: "Panduan penyusunan FR-APL-01, FR-APL-02, dan FR-AK series; Review kelengkapan MUK sesuai Pedoman BNSP 201/202; Panduan prosedur pelaksanaan asesmen (Pedoman 301/303); Simulasi skenario asesmen dan penanganan kasus tidak biasa; Checklist rekaman dan pengarsipan hasil asesmen.",
    targetUser: "Asesor kompetensi, koordinator LSP, manajer sertifikasi, staf TUK, dan calon asesor yang sedang dalam proses lisensi.",
    features: [
      "Panduan penyusunan MUK lengkap — FR-APL-01/02 dan FR-AK series",
      "Checklist kelengkapan instrumen asesmen sesuai standar BNSP",
      "Prosedur pelaksanaan asesmen step-by-step (Pedoman 301/303)",
      "Simulasi skenario asesmen dan penanganan kasus tidak biasa",
      "Checklist rekaman & pengarsipan untuk kesiapan audit BNSP",
      "Referensi regulasi: PP 10/2018, Permen PUPR 9/2023, Pedoman BNSP",
    ],
    pricingType: "free",
  },

  lsp: {
    summary: "Asisten AI manajemen Lembaga Sertifikasi Profesi (LSP) — lisensi baru, perpanjangan, penambahan skema, dan persiapan audit BNSP sesuai SNI ISO/IEC 17024:2012.",
    problem: "LSP menghadapi tantangan memenuhi persyaratan ISO 17024, mengelola skema dan asesor dengan baik, serta mempersiapkan diri menghadapi audit lisensi atau surveillance BNSP.",
    useCases: "Gap analysis kesiapan LSP vs persyaratan ISO 17024; Checklist dokumen sistem manajemen LSP; Panduan persiapan audit lisensi/surveillance BNSP; Prosedur penambahan skema sertifikasi baru; Panduan pengelolaan asesor dan TUK.",
    targetUser: "Direktur LSP, manajer sertifikasi, staf administrasi LSP, konsultan manajemen mutu LSP, dan perusahaan yang hendak mendirikan LSP baru.",
    features: [
      "Gap analysis sistem manajemen LSP vs ISO 17024:2012",
      "Checklist dokumen wajib sistem manajemen dan rekaman LSP",
      "Panduan persiapan audit lisensi dan surveillance BNSP",
      "Prosedur penambahan skema dan pengelolaan asesor",
      "Template prosedur dan formulir sistem manajemen LSP",
      "Referensi Pedoman BNSP 201/202/301/303 dan PP 10/2018",
    ],
    pricingType: "free",
  },

  legal: {
    summary: "Asisten AI hukum konstruksi — analisis kontrak, strategi klaim FIDIC, review regulasi UU Jasa Konstruksi, dan panduan penyelesaian sengketa konstruksi.",
    problem: "Kontraktor dan konsultan sering salah memahami klausul kontrak, terlambat mengajukan klaim, atau tidak tahu langkah hukum yang tepat saat terjadi sengketa proyek.",
    useCases: "Analisis klausul kontrak vs FIDIC Red/Yellow/Silver Book; Panduan pengajuan klaim kontrak (notice, substantiation, final claim); Review regulasi UU 2/2017, PP 22/2020, dan Permen PUPR; Simulasi strategi negosiasi dan mediasi sengketa; Panduan pembuatan surat teguran, somasi, dan dokumen hukum.",
    targetUser: "Direktur dan manajer kontrak perusahaan konstruksi, contract administrator, konsultan hukum konstruksi, PPK dan kuasa pengguna anggaran, serta project manager.",
    features: [
      "Analisis klausul kontrak konstruksi (FIDIC, SSUK, SSKK)",
      "Panduan pengajuan klaim kontrak — notice, EOT, additional payment",
      "Review regulasi terbaru UU Jasa Konstruksi dan turunannya",
      "Simulasi strategi negosiasi dan langkah penyelesaian sengketa",
      "Generator draft surat teguran, somasi, dan dokumen legal",
      "Checklist kepatuhan administrasi kontrak untuk mitigasi risiko hukum",
    ],
    pricingType: "free",
  },

  k3: {
    summary: "Asisten AI sistem manajemen K3 dan SMK3 — identifikasi bahaya, penilaian risiko, prosedur keselamatan, dan persiapan audit sesuai PP 50/2012.",
    problem: "Perusahaan konstruksi sering kesulitan mengimplementasikan SMK3 secara konsisten, menyusun dokumen IBPR/HIRARC yang benar, atau mempersiapkan diri menghadapi audit K3 dan inspeksi disnaker.",
    useCases: "Identifikasi bahaya dan penilaian risiko (IBPR/HIRARC) per aktivitas proyek; Penyusunan JSA, HIRAC, dan prosedur pengendalian bahaya; Checklist inspeksi K3 harian, mingguan, dan bulanan; Panduan investigasi insiden dan pelaporan kecelakaan kerja; Persiapan audit SMK3 PP 50/2012.",
    targetUser: "HSE Manager, Safety Officer, Site Manager, pengawas K3, auditor K3, dan manajemen perusahaan konstruksi yang wajib menerapkan SMK3.",
    features: [
      "IBPR/HIRARC otomatis — identifikasi bahaya dan penilaian risiko per aktivitas",
      "Generator JSA (Job Safety Analysis) dan prosedur pengendalian bahaya",
      "Checklist inspeksi K3 harian/mingguan/bulanan sesuai standar",
      "Panduan investigasi insiden dan root cause analysis",
      "Persiapan audit SMK3 PP 50/2012 — gap analysis dan action plan",
      "Referensi regulasi K3: PP 50/2012, Permenaker, SNI, dan OHSAS 18001",
    ],
    pricingType: "free",
  },

  iso9001: {
    summary: "Asisten AI implementasi ISO 9001:2015 — gap analysis Sistem Manajemen Mutu (SMM), penyusunan dokumentasi, persiapan audit internal, dan panduan menuju sertifikasi.",
    problem: "Perusahaan yang hendak sertifikasi ISO 9001 sering tidak tahu mulai dari mana, mengalami kesulitan menyusun dokumentasi yang sesuai, atau tidak siap menghadapi audit dari lembaga sertifikasi.",
    useCases: "Gap analysis kesiapan SMM vs persyaratan ISO 9001:2015 (klausul 4–10); Penyusunan kebijakan mutu, sasaran mutu, dan prosedur operasional; Persiapan dan pelaksanaan audit internal ISO 9001; Penyusunan CAPA (Corrective Action Preventive Action); Panduan memilih CB (Certification Body) dan proses sertifikasi.",
    targetUser: "Management Representative (MR), Manajer Mutu, auditor internal, konsultan ISO, dan manajemen perusahaan yang sedang dalam proses sertifikasi ISO 9001.",
    features: [
      "Gap analysis 7 klausul ISO 9001:2015 dengan skor kesiapan per klausul",
      "Template dokumen — kebijakan mutu, sasaran mutu, prosedur, instruksi kerja",
      "Panduan audit internal ISO 9001 — checklist dan laporan temuan",
      "Generator CAPA (Corrective Action Preventive Action) terstruktur",
      "Roadmap implementasi ISO 9001 — fase, milestone, dan timeline realistis",
      "Panduan memilih lembaga sertifikasi (CB) dan persiapan audit sertifikasi",
    ],
    pricingType: "free",
  },

  iso14001: {
    summary: "Asisten AI implementasi ISO 14001:2015 — identifikasi aspek lingkungan, pengendalian dampak, audit internal SML, dan persiapan sertifikasi.",
    problem: "Perusahaan sering tidak tahu cara mengidentifikasi aspek dan dampak lingkungan yang signifikan, menyusun rencana pengendalian yang efektif, atau mempersiapkan sistem dokumentasi SML yang sesuai ISO 14001.",
    useCases: "Identifikasi aspek lingkungan dan penilaian signifikansi dampak; Penyusunan kebijakan lingkungan, sasaran, dan program; Persiapan audit internal ISO 14001; Pengelolaan kepatuhan hukum lingkungan; Panduan tanggap darurat lingkungan.",
    targetUser: "MR Lingkungan, HSE Manager, Environmental Officer, konsultan ISO 14001, dan manajemen perusahaan yang hendak sertifikasi SML.",
    features: [
      "Identifikasi aspek lingkungan dan penilaian signifikansi dampak",
      "Template kebijakan lingkungan, sasaran, dan program pengelolaan",
      "Gap analysis kesiapan SML vs klausul ISO 14001:2015",
      "Panduan kepatuhan peraturan lingkungan hidup Indonesia",
      "Audit internal ISO 14001 — checklist dan laporan temuan NC",
      "Roadmap implementasi dari gap analysis hingga sertifikasi",
    ],
    pricingType: "free",
  },

  smap: {
    summary: "Asisten AI Sistem Manajemen Anti-Penyuapan (SMAP) — implementasi ISO 37001, penilaian risiko suap, prosedur kepatuhan, dan persiapan sertifikasi.",
    problem: "Perusahaan menghadapi risiko sanksi hukum dan reputasi akibat tindakan suap, namun banyak yang belum tahu cara membangun sistem anti-penyuapan yang efektif sesuai ISO 37001.",
    useCases: "Gap analysis SMAP vs ISO 37001:2016; Penilaian risiko penyuapan per proses bisnis dan mitra; Penyusunan kebijakan anti-suap dan prosedur kepatuhan; Perancangan sistem whistleblowing dan investigasi; Persiapan audit sertifikasi ISO 37001.",
    targetUser: "Compliance Officer, Internal Audit, Direktur, tim legal, dan konsultan GRC (Governance, Risk & Compliance) perusahaan konstruksi dan BUMN.",
    features: [
      "Gap analysis SMAP vs persyaratan ISO 37001:2016",
      "Register risiko penyuapan per proses bisnis, jabatan, dan mitra",
      "Template kebijakan anti-suap, kode etik, dan prosedur kepatuhan",
      "Panduan sistem whistleblowing dan prosedur investigasi",
      "Audit internal SMAP — checklist temuan dan CAPA",
      "Roadmap sertifikasi ISO 37001 dari nol hingga audit",
    ],
    pricingType: "free",
  },

  odoo: {
    summary: "Asisten AI implementasi dan operasional Odoo ERP — panduan modul, troubleshooting, konfigurasi, dan optimalisasi sistem ERP untuk perusahaan konstruksi.",
    problem: "Tim internal sering kebingungan mengoperasikan modul Odoo, mengalami kendala konfigurasi, atau tidak tahu cara mengoptimalkan ERP agar sesuai dengan proses bisnis perusahaan konstruksi.",
    useCases: "Panduan penggunaan modul Odoo (Accounting, Project, HR, Inventory, Purchase); Troubleshooting error dan masalah konfigurasi umum; Bantuan setup chart of accounts dan konfigurasi awal; Panduan pembuatan laporan dan analitik kustom; Optimalisasi workflow approval dan integrasi antar-modul.",
    targetUser: "Admin Odoo, Finance Manager, Project Manager, IT Manager, dan end-user yang menggunakan Odoo untuk operasional perusahaan konstruksi dan properti.",
    features: [
      "Panduan step-by-step penggunaan modul Odoo (Accounting, Project, HR, dll)",
      "Troubleshooting error umum dengan solusi praktis",
      "Panduan konfigurasi awal — chart of accounts, perusahaan, dan pengguna",
      "Pembuatan laporan kustom dan analitik berbasis data Odoo",
      "Optimalisasi workflow approval dan integrasi antar-modul",
      "Best practice Odoo untuk proses bisnis perusahaan konstruksi",
    ],
    pricingType: "free",
  },

  properti: {
    summary: "Asisten AI properti dan real estate — panduan investasi, pengembangan proyek, pengelolaan unit, dan analisis kelayakan properti.",
    problem: "Investor dan developer properti sering kesulitan menganalisis kelayakan investasi, memahami regulasi perizinan, atau mengelola portofolio properti secara efisien.",
    useCases: "Analisis kelayakan investasi properti (IRR, NPV, payback period); Panduan regulasi perizinan PBG, SLF, dan tata ruang; Simulasi cashflow dan proyeksi return investasi properti; Panduan pengelolaan unit hunian dan komersial; Strategi pemasaran dan penjualan properti.",
    targetUser: "Developer properti, investor real estate, manajer properti, agen properti, dan perusahaan pengelola gedung & kawasan.",
    features: [
      "Analisis kelayakan investasi — IRR, NPV, payback period, simulasi cashflow",
      "Panduan perizinan properti — PBG, SLF, IMB, dan tata ruang",
      "Strategi pemasaran dan penjualan unit properti",
      "Pengelolaan tenant dan operasional properti komersial",
      "Analisis pasar properti dan tren harga per lokasi",
      "Checklist due diligence properti sebelum transaksi",
    ],
    pricingType: "free",
  },

  ibdp: {
    summary: "Asisten AI program IB Diploma (IB DP) — panduan administrasi registrasi, supervisasi IA/EE/CAS, penanganan malpractice, dan koordinasi sekolah dengan IBO.",
    problem: "Koordinator dan guru IB DP sering menghadapi kerumitan administrasi registrasi, deadline yang ketat, prosedur supervisasi IA/EE yang kompleks, dan penanganan kasus malpractice yang tidak biasa.",
    useCases: "Panduan registrasi dan manajemen kandidat di IBIS; Checklist deadline submission IA, EE, TOK, dan CAS; Prosedur supervisasi IA yang sesuai kebijakan IBO; Panduan penanganan kasus malpractice dan academic honesty; Persiapan session sertifikasi IB dan pelaporan ke IBO.",
    targetUser: "Koordinator IB DP, guru mata pelajaran IB, kepala sekolah, staf administrasi IB, dan orang tua siswa program IB Diploma.",
    features: [
      "Panduan administrasi IBIS — registrasi, deadline, dan manajemen kandidat",
      "Checklist IA, EE, TOK, dan CAS per tahapan dan deadline resmi",
      "Prosedur supervisasi IA yang sesuai kebijakan academic integrity IBO",
      "Panduan penanganan malpractice dan academic honesty policy",
      "Persiapan session sertifikasi — M/J exam administration",
      "Update kebijakan terbaru IBO dan perubahan kurikulum DP",
    ],
    pricingType: "free",
  },

  tutor: {
    summary: "Asisten AI tutoring personal — rencana belajar adaptif, latihan soal, pemantauan progres, dan motivasi belajar yang dipersonalisasi.",
    problem: "Siswa sering belajar tanpa arah yang jelas, tidak mendapatkan feedback yang tepat waktu, dan tidak tahu materi mana yang perlu diperkuat sebelum ujian.",
    useCases: "Penyusunan rencana belajar personal sesuai kebutuhan dan target ujian; Latihan soal adaptif berdasarkan kelemahan yang teridentifikasi; Penjelasan konsep yang sulit dengan pendekatan yang bervariasi; Simulasi ujian dengan analisis hasil dan area yang perlu diperbaiki; Motivasi dan tips belajar efektif.",
    targetUser: "Siswa SMA/SMK/MA, mahasiswa, calon peserta UTBK/SNBT, dan orang tua yang memantau progres belajar anak.",
    features: [
      "Rencana belajar adaptif personal — disesuaikan gaya belajar dan target",
      "Latihan soal dengan tingkat kesulitan yang menyesuaikan kemampuan",
      "Penjelasan konsep mendalam dengan berbagai pendekatan analogi",
      "Simulasi ujian dengan analisis hasil dan rekomendasi perbaikan",
      "Pelacakan progres belajar dari waktu ke waktu",
      "Tips, motivasi, dan strategi menghadapi ujian nasional",
    ],
    pricingType: "free",
  },

  pm: {
    summary: "Asisten AI manajemen proyek konstruksi — pengendalian jadwal, biaya, risiko, klaim kontrak, dan pelaporan kemajuan proyek.",
    problem: "Project manager dan site engineer sering kesulitan mendeteksi deviasi jadwal dan biaya sejak dini, mengelola risiko proyek secara proaktif, dan menyiapkan klaim kontrak yang tepat waktu dan terstruktur.",
    useCases: "Analisis earned value (SPI/CPI) dan prediksi ETC/EAC proyek; Penyusunan risk register dan strategi mitigasi risiko konstruksi; Panduan pengajuan klaim EOT dan additional payment; Generator laporan kemajuan proyek (harian/mingguan/bulanan); Pengelolaan sub-kontraktor dan pengendalian mutu lapangan.",
    targetUser: "Project Manager, Site Manager, Planning Engineer, Contract Administrator, dan Direktur Teknik perusahaan kontraktor & konsultan.",
    features: [
      "Analisis Earned Value — SPI, CPI, ETC, EAC dengan interpretasi otomatis",
      "Risk Register konstruksi — identifikasi, penilaian, dan strategi mitigasi",
      "Panduan klaim kontrak — EOT, additional payment, acceleration",
      "Generator laporan kemajuan proyek harian/mingguan/bulanan",
      "Pengendalian mutu lapangan — checklist inspeksi dan NCR management",
      "Panduan koordinasi sub-kontraktor dan manajemen material",
    ],
    pricingType: "free",
  },

  katalog: {
    summary: "Asisten AI katalog jabatan SKKNI konstruksi — identifikasi jabatan yang tepat, persyaratan KKNI, checklist kompetensi, dan panduan sertifikasi per bidang.",
    problem: "Tenaga kerja konstruksi kesulitan menemukan jabatan SKK yang sesuai dengan pengalaman dan pendidikan mereka, serta tidak tahu jalur sertifikasi yang paling efisien untuk karir mereka.",
    useCases: "Pencarian jabatan SKK yang sesuai berdasarkan bidang kerja dan pengalaman; Perbandingan jenjang KKNI dan persyaratan antar-jabatan; Checklist unit kompetensi yang harus dikuasai; Panduan jalur karir dan sertifikasi bertahap; Simulasi kesiapan uji kompetensi.",
    targetUser: "Tenaga kerja konstruksi semua bidang (gedung, jalan, jembatan, mekanikal, elektrikal), HRD perusahaan, dan koordinator SKK/LSP.",
    features: [
      "Katalog lengkap jabatan SKKNI per bidang konstruksi (gedung, jalan, jembatan, MEP)",
      "Perbandingan jenjang KKNI Level 1–9 dan persyaratan antar-jabatan",
      "Checklist unit kompetensi wajib per jabatan dan jenjang",
      "Panduan jalur karir dan sertifikasi bertahap yang efisien",
      "Simulasi kesiapan uji — skor dan identifikasi gap kompetensi",
      "Referensi SK Dirjen 114/2024 dan SKKNI terbaru per bidang",
    ],
    pricingType: "free",
  },

  perizinan: {
    summary: "Asisten AI perizinan usaha konstruksi — panduan NIB, SBU, PBG, SLF, dan proses OSS-RBA sesuai regulasi terbaru.",
    problem: "Pelaku usaha jasa konstruksi sering kebingungan mengurus berbagai izin (NIB, SBU, PBG, SLF) melalui OSS yang terus berubah regulasinya, dan tidak tahu urutan proses yang benar.",
    useCases: "Panduan pengurusan NIB dan izin usaha jasa konstruksi di OSS; Checklist persyaratan PBG (Persetujuan Bangunan Gedung) dan SLF; Simulasi alur proses perizinan online di OSS-RBA; Panduan pemenuhan persyaratan SIUJK dan BUJK; Troubleshooting kendala umum proses perizinan OSS.",
    targetUser: "Direktur dan staf legal perusahaan konstruksi, konsultan perizinan, developer properti, dan pengelola bangunan yang mengurus SLF.",
    features: [
      "Panduan lengkap NIB dan izin usaha jasa konstruksi di OSS-RBA",
      "Checklist persyaratan PBG (Persetujuan Bangunan Gedung) per jenis",
      "Panduan pengurusan SLF — dokumen, proses, dan perpanjangan",
      "Alur proses perizinan OSS step-by-step dengan estimasi waktu",
      "Troubleshooting masalah umum perizinan online dan DPMPTSP",
      "Update regulasi perizinan terbaru — UU Cipta Kerja dan PP turunannya",
    ],
    pricingType: "free",
  },

  edukasi: {
    summary: "Asisten AI pelatihan & pengembangan kompetensi — rancangan program pelatihan, materi, evaluasi, dan pengelolaan learning & development.",
    problem: "Tim HR dan Training Officer kesulitan merancang program pelatihan yang efektif, mengukur dampak pelatihan terhadap kinerja, dan mengelola anggaran training secara efisien.",
    useCases: "Perancangan kurikulum dan modul pelatihan sesuai kompetensi target; Penyusunan TNA (Training Needs Analysis) yang terstruktur; Evaluasi efektivitas pelatihan (Kirkpatrick Level 1–4); Pembuatan materi pelatihan dan bahan ajar; Pengelolaan jadwal dan administrasi pelatihan.",
    targetUser: "Training Manager, HRD, Learning & Development Officer, trainer internal, dan konsultan pengembangan SDM perusahaan konstruksi.",
    features: [
      "Perancangan kurikulum pelatihan berbasis kompetensi (CBC)",
      "TNA (Training Needs Analysis) terstruktur dan prioritas pelatihan",
      "Evaluasi efektivitas pelatihan Kirkpatrick Level 1–4",
      "Template modul pelatihan, bahan ajar, dan assessment tools",
      "Pengelolaan jadwal, absensi, dan administrasi pelatihan",
      "Laporan ROI dan dampak pelatihan terhadap KPI",
    ],
    pricingType: "free",
  },

  pengelasan: {
    summary: "Asisten AI sertifikasi pengelasan — identifikasi jabatan SKK Welder, persyaratan WQR, checklist dokumen, dan persiapan uji kompetensi SKKNI.",
    problem: "Juru las dan perusahaan konstruksi sering tidak tahu jabatan SKK pengelasan yang sesuai, persyaratan dokumen WQR, atau cara mempersiapkan diri untuk uji kompetensi sertifikasi las.",
    useCases: "Identifikasi jabatan SKK yang sesuai (SMAW, TIG, Oxyacetylene, Las Konstruksi); Checklist dokumen kualifikasi juru las (WQR/WPS); Panduan persiapan uji kompetensi SKK pengelasan; Perbedaan jenis proses las dan aplikasinya; Panduan K3 pengelasan dan prosedur keselamatan kerja las.",
    targetUser: "Juru las/welder (SMAW, TIG, GMAW, Oxyacetylene), supervisor las, QC Inspector las, HRD perusahaan konstruksi dan fabrikasi.",
    features: [
      "Katalog jabatan SKK pengelasan — SMAW, TIG, Oxyacetylene, Las Konstruksi",
      "Checklist dokumen kualifikasi WQR dan persyaratan per jenjang KKNI",
      "Panduan persiapan uji kompetensi SKK pengelasan di LSP",
      "Penjelasan perbedaan proses las dan standar kualitas hasil las",
      "Panduan K3 pengelasan — APD, hot work permit, penanganan gas",
      "Referensi SKKNI 98-2018, SKKNI 27-2021, dan standar WPS",
    ],
    pricingType: "free",
  },

  alat_berat: {
    summary: "Asisten AI sertifikasi dan operasional alat berat — identifikasi jabatan SKK operator/mekanik, SIO, checklist inspeksi, dan panduan K3 alat berat.",
    problem: "Operator dan mekanik alat berat tidak tahu jabatan SKK yang sesuai, persyaratan SIO yang berlaku, atau prosedur K3 alat berat yang benar sesuai regulasi Kemnaker.",
    useCases: "Identifikasi jabatan SKK operator alat berat yang sesuai (Excavator, Bulldozer, Crane, dll); Panduan pengurusan SIO (Surat Izin Operator) di Kemnaker; Checklist inspeksi harian alat berat (pre-operation check); Panduan perawatan dasar dan OEE (Overall Equipment Effectiveness); Persiapan uji kompetensi SKK operator/mekanik alat berat.",
    targetUser: "Operator alat berat, mekanik alat berat, Plant Manager, HRD perusahaan konstruksi, pertambangan, dan kontraktor alat berat.",
    features: [
      "Katalog jabatan SKK alat berat — Operator (KKNI 2–3) dan Mekanik (KKNI 4–5)",
      "Panduan pengurusan SIO (Surat Izin Operator) Kemnaker",
      "Checklist inspeksi harian pre-operation sesuai standar K3",
      "Panduan perawatan preventif dan analisis OEE alat berat",
      "Persiapan uji kompetensi SKK operator dan mekanik",
      "Prosedur K3 alat berat — pengoperasian aman dan penanganan darurat",
    ],
    pricingType: "free",
  },

  universal: {
    summary: "Asisten AI serbaguna untuk industri konstruksi Indonesia — menjawab pertanyaan, membantu analisis, memberikan panduan, dan rekomendasi sesuai kebutuhan.",
    problem: "Profesional konstruksi membutuhkan asisten cerdas yang bisa menjawab berbagai pertanyaan teknis dan regulasi secara cepat dan akurat tanpa perlu mencari referensi sendiri.",
    useCases: "Menjawab pertanyaan teknis dan regulasi konstruksi; Membantu analisis dan penilaian situasi proyek; Memberikan rekomendasi langkah tindak lanjut; Menyusun dokumen, laporan, atau surat terkait konstruksi; Panduan best practice industri konstruksi Indonesia.",
    targetUser: "Profesional dan praktisi industri konstruksi Indonesia — kontraktor, konsultan, owner, pengawas, dan semua yang membutuhkan asisten AI berbasis regulasi konstruksi.",
    features: [
      "Menjawab pertanyaan teknis, regulasi, dan prosedur konstruksi Indonesia",
      "Membantu analisis dan penilaian cepat berbagai situasi proyek",
      "Generator dokumen, laporan, dan surat terkait konstruksi",
      "Rekomendasi langkah tindak lanjut berdasarkan konteks spesifik",
      "Referensi regulasi konstruksi Indonesia yang terkini",
      "Panduan best practice pengelolaan proyek dan perusahaan jasa konstruksi",
    ],
    pricingType: "free",
  },
};

// Orchestrators get a synthesis/platform config
const ORCH_CONFIG: ProductConfig = {
  summary: "Hub orkestrasi AI multi-agen — mensintesis analisis dari berbagai agen spesialis secara paralel untuk menghasilkan rekomendasi komprehensif dan terstruktur.",
  problem: "Pengguna membutuhkan analisis lintas domain yang mendalam namun tidak memiliki waktu untuk berkonsultasi dengan banyak spesialis — hub ini mengkoordinasikan seluruh agen spesialis secara otomatis.",
  useCases: "Analisis komprehensif masalah lintas domain (teknis, legal, keuangan, operasional); Sintesis rekomendasi dari banyak perspektif spesialis sekaligus; Penilaian risiko multi-dimensi dengan bobot yang terukur; Laporan eksekutif yang menggabungkan output agen-agen spesialis; Panduan strategi holistik untuk keputusan bisnis konstruksi.",
  targetUser: "Direktur, manajer senior, pengambil keputusan, dan konsultan yang membutuhkan analisis menyeluruh dari banyak sudut pandang sekaligus.",
  features: [
    "Orkestrasi paralel multi-agen spesialis untuk analisis komprehensif",
    "Sintesis laporan dari berbagai perspektif domain sekaligus",
    "Scorecard 4-dimensi dengan probabilitas keberhasilan terukur",
    "Penilaian risiko multi-layer dengan rekomendasi mitigasi",
    "Laporan eksekutif terstruktur siap presentasi",
    "Fallback mandiri saat sub-agen tidak tersedia",
  ],
  pricingType: "free",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Storefront / Product Fields — All Active Agents ===\n");

  const { rows: agents } = await db.query<{
    id: number; name: string; category: string | null;
    domain_charter: string | null; is_orchestrator: boolean;
  }>(`SELECT id, name, category, domain_charter, is_orchestrator FROM agents WHERE is_active = true ORDER BY id`);

  console.log(`Total agents: ${agents.length}`);

  const distrib: Record<string, number> = {};
  const BATCH = 50;
  let updated = 0;

  for (let i = 0; i < agents.length; i += BATCH) {
    const batch = agents.slice(i, i + BATCH);

    for (const a of batch) {
      const domain = a.is_orchestrator
        ? "orchestrator"
        : detectDomain(a.name, a.category, a.domain_charter);

      const cfg: ProductConfig = a.is_orchestrator
        ? ORCH_CONFIG
        : (CONFIGS[detectDomain(a.name, a.category, a.domain_charter)] ?? CONFIGS["universal"]);

      const brandName = makeBrandName(a.name);

      distrib[domain] = (distrib[domain] || 0) + 1;

      await db.query(`
        UPDATE agents SET
          product_summary     = $1,
          product_problem     = $2,
          product_use_cases   = $3,
          product_target_user = $4,
          product_features    = $5::jsonb,
          product_pricing     = $6::jsonb,
          monthly_price       = 0,
          trial_enabled       = true,
          trial_days          = 7,
          require_registration = false,
          branding_name       = $7,
          is_listed           = true
        WHERE id = $8
      `, [
        cfg.summary,
        cfg.problem,
        cfg.useCases,
        cfg.targetUser,
        JSON.stringify(cfg.features),
        JSON.stringify({ type: cfg.pricingType, note: "Gratis — didukung ekosistem Gustafta" }),
        brandName,
        a.id,
      ]);
    }

    updated += batch.length;
    process.stdout.write(`  Updated: ${updated}/${agents.length}\r`);
  }

  console.log(`\n\n✅ Storefront fields seeded: ${updated} agents`);
  console.log("\nDistribution:");
  Object.entries(distrib).sort((a, b) => b[1] - a[1]).forEach(([d, c]) =>
    console.log(`  ${String(c).padStart(4)}  ${d}`)
  );

  // Verify
  const { rows: v } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE product_summary != '') as has_summary,
      COUNT(*) FILTER (WHERE product_problem != '') as has_problem,
      COUNT(*) FILTER (WHERE product_use_cases != '') as has_use_cases,
      COUNT(*) FILTER (WHERE product_target_user != '') as has_target,
      COUNT(*) FILTER (WHERE product_features::text != '[]') as has_features,
      COUNT(*) FILTER (WHERE branding_name != '') as has_brand,
      COUNT(*) FILTER (WHERE is_listed = true) as is_listed
    FROM agents WHERE is_active = true
  `);
  console.log("\nVerification:");
  Object.entries(v[0]).forEach(([k, val]) => console.log(`  ${k.padEnd(22)} ${val}`));

  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
