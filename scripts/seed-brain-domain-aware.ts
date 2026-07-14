/**
 * Seed Domain-Aware Project Brain Templates + Instances
 *
 * - Domain dikenali → template field spesifik domain
 * - Domain tidak dikenali → template universal generik
 * - Data asli (bukan hasil seed sebelumnya) TIDAK dihapus
 *
 * Run: node_modules/.bin/tsx scripts/seed-brain-domain-aware.ts
 */

import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Domain Detection ───────────────────────────────────────────────────────
function detectDomain(name: string, category: string | null, domainCharter: string | null): string {
  const h = `${name} ${domainCharter ?? ""} ${category ?? ""}`.toLowerCase();
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

// ─── Template Field Sets ─────────────────────────────────────────────────────
type F = { key: string; label: string; type: string; required: boolean; placeholder: string; helpText: string; defaultValue: string; options: string[]; order: number };

function f(key: string, label: string, type: string, opts: { ph?: string; help?: string; def?: string; options?: string[]; req?: boolean; order: number }): F {
  return { key, label, type, required: opts.req ?? false, placeholder: opts.ph ?? "", helpText: opts.help ?? "", defaultValue: opts.def ?? "", options: opts.options ?? [], order: opts.order };
}

const TEMPLATES: Record<string, { name: string; description: string; fields: F[] }> = {

  tender: {
    name: "Template Paket Tender",
    description: "Konteks proyek tender — identifikasi paket, strategi, kualifikasi, dan status penawaran.",
    fields: [
      f("project_name",        "Nama Paket Tender",        "text",     { ph: "Contoh: Pembangunan Gedung Kantor Kementerian X", req: true, order: 0 }),
      f("tender_type",         "Jenis Pekerjaan",          "select",   { options: ["Pekerjaan Konstruksi", "Jasa Konsultansi", "Pengadaan Barang", "Jasa Lainnya"], def: "Pekerjaan Konstruksi", order: 1 }),
      f("project_stage",       "Tahap Saat Ini",           "select",   { options: ["Identifikasi", "Persiapan Dokumen", "Pendaftaran", "Aanwijzing", "Penawaran", "Evaluasi", "Negosiasi", "Kontrak"], def: "Identifikasi", order: 2 }),
      f("location",            "Lokasi Pekerjaan",         "text",     { ph: "Contoh: Jakarta Pusat, DKI Jakarta", order: 3 }),
      f("owner_client",        "Pemilik / PPK",            "text",     { ph: "Contoh: Kementerian PUPR, Pemda DKI Jakarta", order: 4 }),
      f("hps_value",           "Nilai HPS (Rp)",           "text",     { ph: "Contoh: 12.500.000.000", order: 5 }),
      f("submission_deadline", "Deadline Penawaran",       "date",     { order: 6 }),
      f("qualification_status","Status Kualifikasi BUJK",  "select",   { options: ["Belum diperiksa", "Memenuhi syarat", "Kurang syarat", "Sedang dilengkapi"], def: "Belum diperiksa", order: 7 }),
      f("win_probability",     "Probabilitas Menang",      "select",   { options: ["Rendah (<40%)", "Sedang (40–70%)", "Tinggi (>70%)"], def: "Sedang (40–70%)", order: 8 }),
      f("strategy_notes",      "Catatan Strategi",         "textarea", { ph: "Contoh: Andalkan pengalaman sejenis, tekan harga di item material", order: 9 }),
      f("key_risks",           "Risiko Utama",             "textarea", { ph: "Contoh: Waktu persiapan sangat singkat, kompetitor kuat", order: 10 }),
      f("decision_summary",    "Keputusan Terakhir",       "textarea", { ph: "Contoh: Sepakat ajukan penawaran dengan margin 8%", order: 11 }),
      f("assumption_used",     "Asumsi Utama",             "textarea", { ph: "Contoh: Spesifikasi tidak berubah dari dokumen awal", order: 12 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 13 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 14 }),
    ],
  },

  sbu: {
    name: "Template Proses SBU",
    description: "Konteks proses pengurusan / perpanjangan SBU BUJK.",
    fields: [
      f("company_name",        "Nama Perusahaan (BUJK)",   "text",     { req: true, ph: "Contoh: PT Bangun Nusa Persada", order: 0 }),
      f("bujk_type",           "Jenis BUJK",               "select",   { options: ["Kontraktor", "Konsultan", "Terintegrasi", "Subspesialis"], def: "Kontraktor", order: 1 }),
      f("target_subclass",     "Target Subklasifikasi",    "text",     { ph: "Contoh: BG004 — Bangunan Gedung Hunian", order: 2 }),
      f("current_qualification","Kualifikasi Saat Ini",    "select",   { options: ["Belum ada", "K (Kecil)", "M (Menengah)", "B (Besar)"], def: "Belum ada", order: 3 }),
      f("target_qualification","Target Kualifikasi",       "select",   { options: ["K (Kecil)", "M (Menengah)", "B (Besar)"], def: "K (Kecil)", order: 4 }),
      f("tkk_gap",             "Gap TKK (Tenaga Kerja Kompeten)", "textarea", { ph: "Contoh: Butuh 2 SKK KKNI L6 Arsitek", order: 5 }),
      f("docs_status",         "Status Dokumen",           "select",   { options: ["Belum dikumpulkan", "Sebagian lengkap", "Lengkap", "Sudah disubmit"], def: "Belum dikumpulkan", order: 6 }),
      f("oss_status",          "Status OSS/LPJK",          "select",   { options: ["Belum mulai", "Sedang proses", "Selesai"], def: "Belum mulai", order: 7 }),
      f("estimated_completion","Estimasi Selesai",         "date",     { order: 8 }),
      f("issues",              "Kendala / Isu",            "textarea", { ph: "Contoh: TKK sulit dipenuhi karena biaya SKK mahal", order: 9 }),
      f("decisions",           "Keputusan Terakhir",       "textarea", { ph: "Contoh: Prioritaskan SKK Level 4 dulu, lanjut L6 bulan depan", order: 10 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 11 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 12 }),
    ],
  },

  skk: {
    name: "Template Sertifikasi SKK",
    description: "Konteks proses sertifikasi kompetensi kerja (SKK) kandidat.",
    fields: [
      f("candidate_name",      "Nama Kandidat",            "text",     { req: true, ph: "Contoh: Budi Santoso", order: 0 }),
      f("jabatan_kerja",       "Jabatan Kerja / Skema",    "text",     { ph: "Contoh: Ahli Teknik Bangunan Gedung Madya", order: 1 }),
      f("kkni_level",          "Jenjang KKNI Target",      "select",   { options: ["L4", "L5", "L6", "L7", "L8", "L9"], def: "L6", order: 2 }),
      f("lsp_target",          "LSP yang Dituju",          "text",     { ph: "Contoh: LSP Konstruksi Indonesia", order: 3 }),
      f("uji_date",            "Tanggal Rencana Uji",      "date",     { order: 4 }),
      f("portfolio_status",    "Status Portofolio Bukti",  "select",   { options: ["Belum mulai", "Sebagian", "Lengkap", "Sudah diverifikasi"], def: "Belum mulai", order: 5 }),
      f("assessment_status",   "Status Asesmen",           "select",   { options: ["Belum terjadwal", "Terjadwal", "Sedang berjalan", "Selesai — Kompeten", "Selesai — Belum Kompeten"], def: "Belum terjadwal", order: 6 }),
      f("issues",              "Kendala",                  "textarea", { ph: "Contoh: Bukti pengalaman kerja kurang dari 2 tahun", order: 7 }),
      f("coaching_notes",      "Catatan Coaching",         "textarea", { ph: "Contoh: Fokus pada unit kompetensi M.711000.003.01", order: 8 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 9 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 10 }),
    ],
  },

  askom: {
    name: "Template Kegiatan Asesmen Kompetensi",
    description: "Konteks pelaksanaan asesmen kompetensi oleh asesor.",
    fields: [
      f("scheme_name",         "Nama Skema Asesmen",       "text",     { req: true, ph: "Contoh: Pelaksana Lapangan Pekerjaan Gedung", order: 0 }),
      f("assessment_date",     "Tanggal Asesmen",          "date",     { order: 1 }),
      f("candidate_count",     "Jumlah Asesi",             "text",     { ph: "Contoh: 8 orang", order: 2 }),
      f("tuk_location",        "Lokasi TUK",               "text",     { ph: "Contoh: TUK Sewaktu — Balai Diklat PUPR Bandung", order: 3 }),
      f("muk_status",          "Status MUK",               "select",   { options: ["Belum siap", "Sebagian lengkap", "Lengkap", "Sudah divalidasi"], def: "Belum siap", order: 4 }),
      f("assessor_count",      "Jumlah Asesor",            "text",     { ph: "Contoh: 2 asesor", order: 5 }),
      f("assessment_result",   "Hasil Asesmen",            "select",   { options: ["Belum selesai", "Semua Kompeten", "Sebagian Kompeten", "Semua Belum Kompeten"], def: "Belum selesai", order: 6 }),
      f("appeals",             "Ada Banding/Sanggah?",     "select",   { options: ["Tidak ada", "Ada — sedang diproses", "Ada — selesai"], def: "Tidak ada", order: 7 }),
      f("issues",              "Kendala",                  "textarea", { ph: "Contoh: Dua asesi tidak membawa bukti portofolio", order: 8 }),
      f("decisions",           "Keputusan",                "textarea", { ph: "Contoh: Jadwal ulang asesmen untuk 2 asesi pada minggu depan", order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  lsp: {
    name: "Template Manajemen LSP",
    description: "Konteks pengelolaan lisensi dan operasional LSP.",
    fields: [
      f("lsp_name",            "Nama LSP",                 "text",     { req: true, ph: "Contoh: LSP Konstruksi Nasional", order: 0 }),
      f("license_status",      "Status Lisensi",           "select",   { options: ["Pengajuan Baru", "Perpanjangan", "Penambahan Skema", "Aktif", "Suspensi"], def: "Aktif", order: 1 }),
      f("bnsp_audit_date",     "Tanggal Audit BNSP",       "date",     { order: 2 }),
      f("scheme_count",        "Jumlah Skema Aktif",       "text",     { ph: "Contoh: 12 skema", order: 3 }),
      f("tuk_count",           "Jumlah TUK",               "text",     { ph: "Contoh: 5 TUK (3 mandiri, 2 sewaktu)", order: 4 }),
      f("surveillance_status", "Status Surveillance",      "select",   { options: ["Belum jadwal", "Terjadwal", "Selesai — Lulus", "Selesai — Ada Temuan"], def: "Belum jadwal", order: 5 }),
      f("nc_findings",         "Temuan Nonkonformitas",    "textarea", { ph: "Contoh: Major NC: prosedur penanganan banding belum direvisi", order: 6 }),
      f("capa_status",         "Status CAPA",              "select",   { options: ["Tidak ada NC", "CAPA sedang berjalan", "CAPA selesai & diverifikasi"], def: "Tidak ada NC", order: 7 }),
      f("issues",              "Isu Operasional",          "textarea", { ph: "Contoh: 3 asesor lisensi habis bulan ini", order: 8 }),
      f("notes",               "Catatan Penting",          "textarea", { order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  legal: {
    name: "Template Kasus / Program Hukum",
    description: "Konteks kasus hukum, kontrak, atau program legal.",
    fields: [
      f("case_name",           "Nama Kasus / Program",     "text",     { req: true, ph: "Contoh: Klaim Keterlambatan — Paket Jalan Tol Cipali", order: 0 }),
      f("case_type",           "Tipe",                     "select",   { options: ["Kontrak", "Klaim Konstruksi", "Sengketa", "Perizinan", "Ketenagakerjaan", "Perizinan Usaha", "Skripsi/Penelitian Hukum", "Lainnya"], def: "Kontrak", order: 1 }),
      f("parties",             "Para Pihak",               "textarea", { ph: "Contoh: PT Maju Jaya (Kontraktor) vs Kementerian PUPR (PPK)", order: 2 }),
      f("legal_basis",         "Dasar Hukum",              "textarea", { ph: "Contoh: Klausul 20 FIDIC Red Book, UU 2/2017", order: 3 }),
      f("current_phase",       "Tahap Saat Ini",           "select",   { options: ["Konsultasi Awal", "Review Kontrak", "Mediasi", "DAB", "Arbitrase BANI", "Litigasi", "Selesai"], def: "Konsultasi Awal", order: 4 }),
      f("key_facts",           "Fakta Kunci",              "textarea", { ph: "Contoh: Keterlambatan 45 hari karena force majeure banjir", order: 5 }),
      f("legal_risks",         "Risiko Hukum",             "textarea", { ph: "Contoh: Klaim ditolak jika notifikasi terlambat > 28 hari", order: 6 }),
      f("strategy",            "Strategi",                 "textarea", { ph: "Contoh: Ajukan klaim berdasarkan klausul 8.4 + bukti cuaca BMKG", order: 7 }),
      f("key_deadlines",       "Deadline Kunci",           "textarea", { ph: "Contoh: Notifikasi klaim — 15 Juni 2026", order: 8 }),
      f("decisions",           "Keputusan Terakhir",       "textarea", { order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  k3: {
    name: "Template Program K3 / SMK3",
    description: "Konteks implementasi K3 dan SMK3 di proyek atau perusahaan.",
    fields: [
      f("project_name",        "Nama Proyek / Perusahaan", "text",     { req: true, ph: "Contoh: Pembangunan Jalan Tol Semarang–Demak", order: 0 }),
      f("hse_plan_status",     "Status HSE Plan",          "select",   { options: ["Belum ada", "Draft", "Disetujui", "Aktif diterapkan"], def: "Draft", order: 1 }),
      f("smk3_level",          "Level SMK3 Target",        "select",   { options: ["Belum ada", "Awal (64 kriteria)", "Transisi (122 kriteria)", "Lanjutan (166 kriteria)"], def: "Awal (64 kriteria)", order: 2 }),
      f("last_incident_date",  "Tanggal Insiden Terakhir", "date",     { order: 3 }),
      f("ltir",                "LTIR Saat Ini",            "text",     { ph: "Contoh: 0.5", order: 4 }),
      f("near_miss_count",     "Jumlah Near Miss (bulan ini)", "text", { ph: "Contoh: 3", order: 5 }),
      f("audit_status",        "Status Audit K3",          "select",   { options: ["Belum dijadwal", "Terjadwal", "Selesai — Lulus", "Selesai — Ada Temuan"], def: "Belum dijadwal", order: 6 }),
      f("major_findings",      "Temuan Major",             "textarea", { ph: "Contoh: APD tidak lengkap di zona las — 5 orang", order: 7 }),
      f("capa_status",         "Status CAPA",              "select",   { options: ["Tidak ada temuan", "CAPA berjalan", "CAPA selesai"], def: "Tidak ada temuan", order: 8 }),
      f("emergency_drill_date","Tanggal Latihan Darurat",  "date",     { order: 9 }),
      f("notes",               "Catatan HSE",              "textarea", { order: 10 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 11 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 12 }),
    ],
  },

  iso9001: {
    name: "Template Program ISO 9001",
    description: "Konteks implementasi atau pemeliharaan sistem manajemen mutu ISO 9001.",
    fields: [
      f("company_name",        "Nama Organisasi",          "text",     { req: true, ph: "Contoh: PT Konstruksi Andalan", order: 0 }),
      f("scope",               "Ruang Lingkup Sertifikasi","text",     { ph: "Contoh: Jasa Konstruksi Gedung dan Infrastruktur", order: 1 }),
      f("certification_body",  "Lembaga Sertifikasi",      "text",     { ph: "Contoh: TÜV Rheinland, SGS, Bureau Veritas", order: 2 }),
      f("current_phase",       "Fase Saat Ini",            "select",   { options: ["Gap Analysis", "Penyusunan Dokumen", "Implementasi", "Internal Audit", "Kaji Ulang Manajemen", "Audit Sertifikasi", "Surveillance", "Sudah Tersertifikasi"], def: "Gap Analysis", order: 3 }),
      f("audit_date",          "Tanggal Audit Berikutnya", "date",     { order: 4 }),
      f("major_nc",            "Jumlah NC Major",          "text",     { ph: "Contoh: 2", def: "0", order: 5 }),
      f("minor_nc",            "Jumlah NC Minor",          "text",     { ph: "Contoh: 5", def: "0", order: 6 }),
      f("capa_status",         "Status CAPA",              "select",   { options: ["Tidak ada NC", "CAPA berjalan", "CAPA selesai & diverifikasi"], def: "Tidak ada NC", order: 7 }),
      f("weak_clauses",        "Klausul yang Lemah",       "textarea", { ph: "Contoh: Klausul 9.1 (Monitoring) dan 10.2 (Nonconformity) perlu penguatan", order: 8 }),
      f("notes",               "Catatan Penting",          "textarea", { order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  iso14001: {
    name: "Template Program ISO 14001",
    description: "Konteks implementasi sistem manajemen lingkungan ISO 14001.",
    fields: [
      f("company_name",        "Nama Organisasi",          "text",     { req: true, ph: "Contoh: PT Hijau Lestari Konstruksi", order: 0 }),
      f("scope",               "Ruang Lingkup",            "text",     { ph: "Contoh: Pelaksanaan Konstruksi Gedung", order: 1 }),
      f("current_phase",       "Fase Saat Ini",            "select",   { options: ["Gap Analysis", "Identifikasi Aspek & Dampak", "Penyusunan Dokumen", "Implementasi", "Internal Audit", "Sertifikasi", "Surveillance"], def: "Gap Analysis", order: 2 }),
      f("audit_date",          "Tanggal Audit",            "date",     { order: 3 }),
      f("significant_aspects", "Aspek Lingkungan Signifikan", "textarea", { ph: "Contoh: Emisi debu, limbah semen, air limbah beton", order: 4 }),
      f("legal_compliance",    "Status Kepatuhan Hukum",   "select",   { options: ["Belum dievaluasi", "Ada ketidaksesuaian", "Sesuai semua"], def: "Belum dievaluasi", order: 5 }),
      f("nc_findings",         "Temuan NC",                "textarea", { order: 6 }),
      f("capa_status",         "Status CAPA",              "select",   { options: ["Tidak ada NC", "CAPA berjalan", "CAPA selesai"], def: "Tidak ada NC", order: 7 }),
      f("notes",               "Catatan",                  "textarea", { order: 8 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 9 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 10 }),
    ],
  },

  smap: {
    name: "Template Program SMAP / Anti-Suap",
    description: "Konteks implementasi sistem manajemen anti-penyuapan ISO 37001.",
    fields: [
      f("company_name",        "Nama Organisasi",          "text",     { req: true, ph: "Contoh: PT Konstruksi Integritas", order: 0 }),
      f("current_phase",       "Fase Saat Ini",            "select",   { options: ["Gap Analysis", "Penyusunan Kebijakan", "Pelatihan", "Implementasi", "Internal Audit", "Sertifikasi"], def: "Gap Analysis", order: 1 }),
      f("risk_assessment",     "Status Penilaian Risiko Suap", "select", { options: ["Belum dilakukan", "Sedang berjalan", "Selesai"], def: "Belum dilakukan", order: 2 }),
      f("due_diligence",       "Status Due Diligence Mitra", "select", { options: ["Belum dilakukan", "Sebagian", "Selesai"], def: "Belum dilakukan", order: 3 }),
      f("high_risk_areas",     "Area Berisiko Tinggi",     "textarea", { ph: "Contoh: Pengadaan, perizinan, relasi pejabat publik", order: 4 }),
      f("audit_date",          "Tanggal Audit",            "date",     { order: 5 }),
      f("nc_findings",         "Temuan NC",                "textarea", { order: 6 }),
      f("notes",               "Catatan",                  "textarea", { order: 7 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 8 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 9 }),
    ],
  },

  odoo: {
    name: "Template Implementasi Odoo ERP",
    description: "Konteks proyek implementasi sistem ERP Odoo.",
    fields: [
      f("project_name",        "Nama Proyek Implementasi", "text",     { req: true, ph: "Contoh: Go-Live Odoo 17 — PT Bangun Prima", order: 0 }),
      f("client",              "Nama Klien",               "text",     { ph: "Contoh: PT Bangun Prima Konstruksi", order: 1 }),
      f("odoo_version",        "Versi Odoo",               "select",   { options: ["Odoo 16", "Odoo 17", "Odoo 18", "Lainnya"], def: "Odoo 17", order: 2 }),
      f("modules",             "Modul yang Diimplementasikan", "textarea", { ph: "Contoh: Accounting, Project, Purchase, Inventory, HR", order: 3 }),
      f("current_phase",       "Fase Saat Ini",            "select",   { options: ["Discovery", "Design", "Build", "UAT", "Training", "Go Live", "Post Go-Live Support"], def: "Discovery", order: 4 }),
      f("go_live_date",        "Target Go-Live",           "date",     { order: 5 }),
      f("team_size",           "Ukuran Tim",               "text",     { ph: "Contoh: 3 konsultan + 2 key user klien", order: 6 }),
      f("blockers",            "Blocker / Hambatan",       "textarea", { ph: "Contoh: Data master belum bersih, key user sulit dihubungi", order: 7 }),
      f("decisions",           "Keputusan Terakhir",       "textarea", { order: 8 }),
      f("notes",               "Catatan Teknis",           "textarea", { order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  properti: {
    name: "Template Proyek Properti",
    description: "Konteks proyek pengembangan atau pengelolaan properti.",
    fields: [
      f("project_name",        "Nama Proyek Properti",     "text",     { req: true, ph: "Contoh: Cluster Magnolia — BSD City", order: 0 }),
      f("property_type",       "Tipe Properti",            "select",   { options: ["Perumahan", "Apartemen", "Komersial (Ruko/Mall)", "Perkantoran", "Industrial Estate", "Mixed Use"], def: "Perumahan", order: 1 }),
      f("location",            "Lokasi",                   "text",     { ph: "Contoh: BSD City, Tangerang Selatan", order: 2 }),
      f("developer",           "Developer",                "text",     { ph: "Contoh: PT Sinar Mas Land", order: 3 }),
      f("total_units",         "Total Unit",               "text",     { ph: "Contoh: 120 unit", order: 4 }),
      f("building_stage",      "Tahap Pembangunan",        "select",   { options: ["Perencanaan", "Perizinan", "Konstruksi", "Finishing", "Serah Terima", "Pasca Serah Terima"], def: "Perencanaan", order: 5 }),
      f("permit_status",       "Status Perizinan (PBG/SLF)", "select", { options: ["Belum", "Proses", "Sebagian", "Lengkap"], def: "Belum", order: 6 }),
      f("marketing_status",    "Status Pemasaran",         "select",   { options: ["Belum dibuka", "Pre-launch", "Sudah dipasarkan", "Terjual habis"], def: "Belum dibuka", order: 7 }),
      f("issues",              "Kendala",                  "textarea", { ph: "Contoh: Perizinan PBG terlambat karena RDTR belum update", order: 8 }),
      f("decisions",           "Keputusan Terakhir",       "textarea", { order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  ibdp: {
    name: "Template Sesi IB DP",
    description: "Konteks pengelolaan sesi ujian / program International Baccalaureate Diploma Programme.",
    fields: [
      f("school_name",         "Nama Sekolah",             "text",     { req: true, ph: "Contoh: Jakarta Intercultural School", order: 0 }),
      f("academic_year",       "Tahun Akademik",           "text",     { ph: "Contoh: 2025–2026", order: 1 }),
      f("session",             "Sesi Ujian",               "select",   { options: ["May 2026", "November 2026", "May 2027", "November 2027"], def: "May 2026", order: 2 }),
      f("coordinator",         "IB Coordinator",           "text",     { ph: "Contoh: Ms. Sarah Johnson", order: 3 }),
      f("candidate_count",     "Jumlah Kandidat",          "text",     { ph: "Contoh: 45 kandidat", order: 4 }),
      f("submission_deadline", "Deadline IA Submission",   "date",     { order: 5 }),
      f("exam_period",         "Periode Ujian",            "text",     { ph: "Contoh: 28 April — 16 Mei 2026", order: 6 }),
      f("current_phase",       "Fase Saat Ini",            "select",   { options: ["Registrasi Kandidat", "Predicted Grades", "IA Submission", "Persiapan Ujian", "Ujian Berlangsung", "Post-Exam", "Result Day"], def: "Registrasi Kandidat", order: 7 }),
      f("compliance_notes",    "Catatan Kepatuhan IBO",    "textarea", { ph: "Contoh: Malpractice policy sudah disosialisasikan", order: 8 }),
      f("issues",              "Isu Saat Ini",             "textarea", { ph: "Contoh: 3 kandidat belum melengkapi CAS hours", order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  tutor: {
    name: "Template Program Belajar",
    description: "Konteks sesi tutoring atau program pembelajaran siswa.",
    fields: [
      f("student_name",        "Nama Siswa / Peserta",     "text",     { req: true, ph: "Contoh: Ahmad Fauzi", order: 0 }),
      f("subject",             "Mata Pelajaran / Topik",   "text",     { ph: "Contoh: Matematika — Kalkulus Integral", order: 1 }),
      f("learning_level",      "Level Pembelajaran",       "select",   { options: ["SD", "SMP", "SMA", "Perguruan Tinggi", "Profesional"], def: "SMA", order: 2 }),
      f("learning_objectives", "Tujuan Belajar",           "textarea", { ph: "Contoh: Bisa mengerjakan soal integral substitusi dengan benar", order: 3 }),
      f("current_chapter",     "Bab / Materi Saat Ini",    "text",     { ph: "Contoh: Bab 5 — Integral Parsial", order: 4 }),
      f("session_count",       "Jumlah Sesi Selesai",      "text",     { ph: "Contoh: 8 dari 20 sesi", order: 5 }),
      f("assessment_scores",   "Skor Asesmen Terakhir",    "text",     { ph: "Contoh: Pre-test 45/100, Latihan terakhir 72/100", order: 6 }),
      f("learning_issues",     "Hambatan Belajar",         "textarea", { ph: "Contoh: Kesulitan pada konsep batas atas/bawah integral", order: 7 }),
      f("coaching_notes",      "Catatan Pengajar",         "textarea", { ph: "Contoh: Siswa perlu lebih banyak latihan soal variasi", order: 8 }),
      f("next_milestone",      "Target Berikutnya",        "text",     { ph: "Contoh: Uji harian Bab 5 minggu depan", order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  edukasi: {
    name: "Template Program Pelatihan / Event Edukasi",
    description: "Konteks penyelenggaraan pelatihan, workshop, seminar, atau bimtek.",
    fields: [
      f("program_name",        "Nama Program",             "text",     { req: true, ph: "Contoh: Bimtek Pengadaan Barang/Jasa Tingkat Dasar", order: 0 }),
      f("program_type",        "Tipe Program",             "select",   { options: ["Pelatihan", "Workshop", "Seminar", "Bimtek", "Webinar", "Konferensi", "Lainnya"], def: "Pelatihan", order: 1 }),
      f("organizer",           "Penyelenggara",            "text",     { ph: "Contoh: Balai Diklat PUPR Wilayah II", order: 2 }),
      f("training_date",       "Tanggal Pelaksanaan",      "date",     { order: 3 }),
      f("location",            "Lokasi / Platform",        "text",     { ph: "Contoh: Hotel Aryaduta Jakarta / Zoom Meeting", order: 4 }),
      f("target_participants", "Target Peserta",           "text",     { ph: "Contoh: 50 orang (ASN Kementerian PUPR)", order: 5 }),
      f("actual_participants", "Peserta Hadir",            "text",     { ph: "Contoh: 47 orang", order: 6 }),
      f("trainer",             "Narasumber / Fasilitator", "text",     { ph: "Contoh: Dr. Hendra Kurniawan, M.T.", order: 7 }),
      f("pre_test_avg",        "Rata-rata Pre-Test",       "text",     { ph: "Contoh: 58/100", order: 8 }),
      f("post_test_avg",       "Rata-rata Post-Test",      "text",     { ph: "Contoh: 82/100", order: 9 }),
      f("issues",              "Kendala Penyelenggaraan",  "textarea", { order: 10 }),
      f("notes",               "Catatan Evaluasi",         "textarea", { order: 11 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 12 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 13 }),
    ],
  },

  pengelasan: {
    name: "Template Pekerjaan Pengelasan",
    description: "Konteks proyek atau kegiatan pengelasan — WPS, inspeksi, kualifikasi juru las.",
    fields: [
      f("project_name",        "Nama Proyek / Pekerjaan",  "text",     { req: true, ph: "Contoh: Fabrikasi Struktur Baja Tower B", order: 0 }),
      f("weld_process",        "Proses Pengelasan",        "select",   { options: ["SMAW", "GTAW (TIG)", "GMAW (MIG/MAG)", "FCAW", "SAW", "Lainnya"], def: "SMAW", order: 1 }),
      f("material_type",       "Material",                 "text",     { ph: "Contoh: ASTM A36, SS400, Stainless 304", order: 2 }),
      f("joint_type",          "Tipe Sambungan",           "select",   { options: ["Butt Joint", "T-Joint", "Corner Joint", "Lap Joint", "Edge Joint"], def: "Butt Joint", order: 3 }),
      f("position",            "Posisi Las",               "select",   { options: ["1G (Datar)", "2G (Horizontal)", "3G (Vertikal)", "4G (Overhead)", "5G (Pipa Horizontal)", "6G (Pipa Miring)"], def: "1G (Datar)", order: 4 }),
      f("wps_status",          "Status WPS",               "select",   { options: ["Belum ada", "Draft", "Sudah disetujui"], def: "Belum ada", order: 5 }),
      f("welder_count",        "Jumlah Juru Las",          "text",     { ph: "Contoh: 8 juru las", order: 6 }),
      f("wqr_status",          "Status WQR Juru Las",      "select",   { options: ["Belum semua", "Sebagian", "Semua valid"], def: "Belum semua", order: 7 }),
      f("inspection_status",   "Status Inspeksi Las",      "select",   { options: ["Belum", "Sedang berjalan", "Selesai — OK", "Selesai — Ada Defect"], def: "Belum", order: 8 }),
      f("defects_found",       "Defect Ditemukan",         "textarea", { ph: "Contoh: Porositas pada joint A-14, perlu grind & reweld", order: 9 }),
      f("ndt_results",         "Hasil NDT",                "textarea", { ph: "Contoh: VT pass, PT pada 3 titik — repair", order: 10 }),
      f("issues",              "Kendala",                  "textarea", { order: 11 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 12 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 13 }),
    ],
  },

  alat_berat: {
    name: "Template Operasi Alat Berat",
    description: "Konteks operasi, pemeliharaan, dan sertifikasi alat berat di proyek.",
    fields: [
      f("project_name",        "Nama Proyek / Lokasi",     "text",     { req: true, ph: "Contoh: Proyek Tambang Batubara — Kalimantan Selatan", order: 0 }),
      f("equipment_type",      "Jenis Alat Berat",         "select",   { options: ["Excavator", "Bulldozer", "Crane", "Motor Grader", "Wheel Loader", "Dump Truck", "Compactor", "Lainnya"], def: "Excavator", order: 1 }),
      f("equipment_count",     "Jumlah Unit",              "text",     { ph: "Contoh: 5 unit", order: 2 }),
      f("site_location",       "Lokasi Site",              "text",     { ph: "Contoh: Pit A, Blok 3, Kabupaten Tabalong", order: 3 }),
      f("mobilization_date",   "Tanggal Mobilisasi",       "date",     { order: 4 }),
      f("oee_target",          "Target OEE (%)",           "text",     { ph: "Contoh: 75%", order: 5 }),
      f("current_oee",         "OEE Aktual Bulan Ini (%)", "text",     { ph: "Contoh: 68%", order: 6 }),
      f("maintenance_status",  "Status Pemeliharaan",      "select",   { options: ["On schedule", "Terlambat", "Ada breakdown"], def: "On schedule", order: 7 }),
      f("operator_sio_status", "Status SIO Operator",      "select",   { options: ["Semua valid", "Ada yang habis/kurang", "Belum diperiksa"], def: "Belum diperiksa", order: 8 }),
      f("issues",              "Kendala",                  "textarea", { ph: "Contoh: 1 unit excavator breakdown hydraulic", order: 9 }),
      f("decisions",           "Keputusan",                "textarea", { order: 10 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 11 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 12 }),
    ],
  },

  pm: {
    name: "Template Manajemen Proyek",
    description: "Konteks perencanaan dan pengendalian proyek konstruksi.",
    fields: [
      f("project_name",        "Nama Proyek",              "text",     { req: true, ph: "Contoh: Pembangunan Jalan Tol Semarang Ring Road", order: 0 }),
      f("project_stage",       "Fase Proyek",              "select",   { options: ["Inisiasi", "Perencanaan", "Pelaksanaan", "Monitoring & Pengendalian", "Penutupan"], def: "Perencanaan", order: 1 }),
      f("owner_client",        "Owner / PPK",              "text",     { ph: "Contoh: Kementerian PUPR — Bina Marga", order: 2 }),
      f("contract_value",      "Nilai Kontrak (Rp)",       "text",     { ph: "Contoh: 450.000.000.000", order: 3 }),
      f("planned_duration",    "Durasi Kontrak",           "text",     { ph: "Contoh: 730 hari kalender", order: 4 }),
      f("progress_planned",    "Progress Rencana (%)",     "text",     { ph: "Contoh: 45%", order: 5 }),
      f("progress_actual",     "Progress Aktual (%)",      "text",     { ph: "Contoh: 38%", order: 6 }),
      f("spi",                 "SPI (Schedule Performance Index)", "text", { ph: "Contoh: 0.84", order: 7 }),
      f("cpi",                 "CPI (Cost Performance Index)", "text", { ph: "Contoh: 0.91", order: 8 }),
      f("critical_path",       "Pekerjaan Kritis Saat Ini","textarea", { ph: "Contoh: Pekerjaan tiang pancang zona C — terlambat 3 minggu", order: 9 }),
      f("key_risks",           "Risiko Utama",             "textarea", { order: 10 }),
      f("decisions",           "Keputusan Terakhir",       "textarea", { order: 11 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 12 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 13 }),
    ],
  },

  katalog: {
    name: "Template Sertifikasi Jabatan Kerja",
    description: "Konteks identifikasi jabatan dan rencana sertifikasi SKK untuk tenaga kerja.",
    fields: [
      f("worker_name",         "Nama Tenaga Kerja",        "text",     { req: true, ph: "Contoh: Slamet Riyadi", order: 0 }),
      f("current_position",    "Jabatan / Posisi Saat Ini","text",     { ph: "Contoh: Pelaksana Lapangan Gedung", order: 1 }),
      f("target_jabatan",      "Jabatan Kerja SKK Target", "text",     { ph: "Contoh: Ahli Teknik Bangunan Gedung Muda (L6)", order: 2 }),
      f("kkni_level",          "Jenjang KKNI Target",      "select",   { options: ["L4", "L5", "L6", "L7", "L8", "L9"], def: "L6", order: 3 }),
      f("experience_years",    "Pengalaman Kerja (tahun)", "text",     { ph: "Contoh: 8 tahun", order: 4 }),
      f("education",           "Pendidikan Terakhir",      "select",   { options: ["SMA/SMK", "D3", "S1", "S2", "S3"], def: "S1", order: 5 }),
      f("portfolio_status",    "Status Portofolio",        "select",   { options: ["Belum dikumpulkan", "Sedang dikumpulkan", "Lengkap"], def: "Belum dikumpulkan", order: 6 }),
      f("target_lsp",          "LSP yang Dituju",          "text",     { ph: "Contoh: LSP Konstruksi Indonesia (LPJK)", order: 7 }),
      f("uji_date",            "Rencana Uji Kompetensi",   "date",     { order: 8 }),
      f("issues",              "Kendala",                  "textarea", { ph: "Contoh: Belum memiliki bukti ijazah yang sesuai", order: 9 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 10 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 11 }),
    ],
  },

  perizinan: {
    name: "Template Proses Perizinan Usaha",
    description: "Konteks pengurusan perizinan usaha jasa konstruksi (NIB, SIUJK, PBG, SLF, dll.).",
    fields: [
      f("company_name",        "Nama Perusahaan",          "text",     { req: true, ph: "Contoh: PT Maju Konstruksi Indonesia", order: 0 }),
      f("permit_type",         "Tipe Perizinan",           "select",   { options: ["NIB", "SBU / SIUJK", "PBG (Persetujuan Bangunan Gedung)", "SLF (Sertifikat Laik Fungsi)", "Amdal / UKL-UPL", "Izin Operasional Lainnya"], def: "NIB", order: 1 }),
      f("current_phase",       "Tahap Saat Ini",           "select",   { options: ["Persiapan Dokumen", "Pengajuan OSS", "Verifikasi", "Pemenuhan Persyaratan Teknis", "Selesai"], def: "Persiapan Dokumen", order: 2 }),
      f("oss_status",          "Status OSS",               "select",   { options: ["Belum terdaftar", "Terdaftar — NIB ada", "Proses izin berusaha", "Selesai"], def: "Belum terdaftar", order: 3 }),
      f("docs_missing",        "Dokumen yang Kurang",      "textarea", { ph: "Contoh: NPWP perusahaan, akta terbaru notaris", order: 4 }),
      f("deadline",            "Target Selesai",           "date",     { order: 5 }),
      f("issues",              "Kendala",                  "textarea", { ph: "Contoh: NIB belum aktif karena KBLI tidak sesuai", order: 6 }),
      f("decisions",           "Keputusan",                "textarea", { order: 7 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 8 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 9 }),
    ],
  },

  // ── UNIVERSAL ───────────────────────────────────────────────────────────────
  universal: {
    name: "Template Proyek / Program / Event",
    description: "Template umum untuk proyek, program, event, kampanye, penelitian, atau kegiatan apapun.",
    fields: [
      f("project_name",        "Nama Proyek / Program / Event", "text", { req: true, ph: "Contoh: Program Pelatihan K3 Q3 2026 / Event Pameran Konstruksi", order: 0 }),
      f("project_type",        "Tipe Kegiatan",            "select",   { options: ["Proyek Konstruksi", "Proyek IT", "Event / Pameran", "Program Pelatihan", "Kampanye", "Penelitian", "Program Sosial", "Lainnya"], def: "Lainnya", order: 1 }),
      f("objective",           "Tujuan / Sasaran",         "textarea", { ph: "Contoh: Meningkatkan kompetensi 50 tenaga kerja konstruksi", order: 2 }),
      f("project_stage",       "Tahap Saat Ini",           "select",   { options: ["Perencanaan", "Persiapan", "Pelaksanaan", "Monitoring", "Evaluasi", "Penutupan"], def: "Perencanaan", order: 3 }),
      f("location",            "Lokasi / Platform",        "text",     { ph: "Contoh: Jakarta / Online (Zoom)", order: 4 }),
      f("owner_organizer",     "Penanggung Jawab / Penyelenggara", "text", { ph: "Contoh: Divisi HRD PT Bangun Raya", order: 5 }),
      f("start_date",          "Tanggal Mulai",            "date",     { order: 6 }),
      f("end_date",            "Tanggal Selesai / Deadline","date",    { order: 7 }),
      f("budget",              "Anggaran",                 "text",     { ph: "Contoh: Rp 150.000.000", order: 8 }),
      f("team_size",           "Ukuran Tim / Peserta",     "text",     { ph: "Contoh: 5 orang tim + 40 peserta", order: 9 }),
      f("key_deliverables",    "Deliverable / Output Utama","textarea",{ ph: "Contoh: Laporan akhir, sertifikat peserta, video dokumentasi", order: 10 }),
      f("stakeholders",        "Pemangku Kepentingan",     "textarea", { ph: "Contoh: Sponsor, peserta, dinas terkait", order: 11 }),
      f("current_issues",      "Isu Saat Ini",             "textarea", { order: 12 }),
      f("decisions",           "Keputusan Terakhir",       "textarea", { order: 13 }),
      f("risks",               "Risiko Utama",             "textarea", { order: 14 }),
      f("completeness_level",  "Kelengkapan Data",         "select",   { options: ["Draft", "Partial", "Complete"], def: "Draft", order: 15 }),
      f("last_updated",        "Terakhir Diperbarui",      "date",     { def: new Date().toISOString().slice(0, 10), order: 16 }),
    ],
  },
};

// pm and katalog fall back to their definitions; iso14001, smap → already defined
// remaining unknown domains → universal

// ─── Default instance values (first option / def for each domain) ─────────────
function buildDefaultValues(fields: F[]): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const field of fields) {
    if (field.defaultValue) {
      vals[field.key] = field.defaultValue;
    } else if (field.options && field.options.length > 0) {
      vals[field.key] = field.options[0];
    } else {
      vals[field.key] = "";
    }
  }
  return vals;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Domain-Aware Project Brain Templates + Instances ===\n");

  // 1. Delete our previous seeded templates (name = 'Template Proyek Konstruksi')
  //    and their associated instances (name LIKE 'Proyek — %')
  const delInst = await db.query(
    `DELETE FROM project_brain_instances WHERE name LIKE 'Proyek — %' RETURNING id`
  );
  console.log(`Deleted old instances: ${delInst.rowCount}`);

  const delTpl = await db.query(
    `DELETE FROM project_brain_templates WHERE name = 'Template Proyek Konstruksi' RETURNING id`
  );
  console.log(`Deleted old templates: ${delTpl.rowCount}\n`);

  // 2. Load all active agents
  const { rows: agents } = await db.query<{
    id: number; name: string; category: string | null; domain_charter: string | null;
  }>(`SELECT id, name, category, domain_charter FROM agents WHERE is_active = true ORDER BY id`);
  console.log(`Active agents: ${agents.length}`);

  // 3. Check who already has templates (real data, not our seed)
  const { rows: existingTpls } = await db.query<{ agent_id: number }>(
    `SELECT DISTINCT agent_id FROM project_brain_templates`
  );
  const alreadyHasTpl = new Set(existingTpls.map(r => r.agent_id));

  const { rows: existingInst } = await db.query<{ agent_id: number }>(
    `SELECT DISTINCT agent_id FROM project_brain_instances`
  );
  const alreadyHasInst = new Set(existingInst.map(r => r.agent_id));

  // Count distribution
  const domainCount: Record<string, number> = {};
  for (const agent of agents) {
    const d = detectDomain(agent.name, agent.category, agent.domain_charter);
    domainCount[d] = (domainCount[d] || 0) + 1;
  }
  console.log("\nDomain distribution:");
  Object.entries(domainCount).sort((a, b) => b[1] - a[1]).forEach(([d, c]) => {
    const tplName = TEMPLATES[d]?.name ?? "(→ universal)";
    console.log(`  ${d.padEnd(15)} ${String(c).padStart(4)} agen  →  ${tplName}`);
  });

  // 4. Seed templates + instances in batches
  const BATCH = 100;
  const today = new Date().toISOString().slice(0, 10);

  let tplCreated = 0, instCreated = 0, skipped = 0;

  // batch insert templates
  const toSeedTpl = agents.filter(a => !alreadyHasTpl.has(a.id));
  console.log(`\nSeeding templates for ${toSeedTpl.length} agents...`);

  for (let i = 0; i < toSeedTpl.length; i += BATCH) {
    const batch = toSeedTpl.slice(i, i + BATCH);
    const parts: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const agent of batch) {
      const domain = detectDomain(agent.name, agent.category, agent.domain_charter);
      const tpl = TEMPLATES[domain] ?? TEMPLATES["universal"];
      parts.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}::jsonb, true, NOW())`);
      params.push(agent.id, tpl.name, tpl.description, JSON.stringify(tpl.fields));
    }

    await db.query(
      `INSERT INTO project_brain_templates (agent_id, name, description, fields, is_active, created_at) VALUES ${parts.join(",")}`,
      params
    );
    tplCreated += batch.length;
    process.stdout.write(`  templates: ${tplCreated}/${toSeedTpl.length}\r`);
  }
  console.log(`\n✅ Templates seeded: ${tplCreated}`);

  // 5. Load newly created templates to get their IDs
  const { rows: allTpls } = await db.query<{ id: number; agent_id: number }>(
    `SELECT id, agent_id FROM project_brain_templates ORDER BY agent_id`
  );
  const tplByAgent = new Map(allTpls.map(t => [t.agent_id, t.id]));

  // 6. Seed instances
  const toSeedInst = agents.filter(a => !alreadyHasInst.has(a.id));
  console.log(`Seeding instances for ${toSeedInst.length} agents...`);

  for (let i = 0; i < toSeedInst.length; i += BATCH) {
    const batch = toSeedInst.slice(i, i + BATCH);
    const parts: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const agent of batch) {
      const tplId = tplByAgent.get(agent.id);
      if (!tplId) { skipped++; continue; }

      const domain = detectDomain(agent.name, agent.category, agent.domain_charter);
      const tpl = TEMPLATES[domain] ?? TEMPLATES["universal"];
      const values = buildDefaultValues(tpl.fields);

      parts.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}::jsonb, 'draft', true, NOW(), NOW())`);
      params.push(agent.id, tplId, `${tpl.name} — ${agent.name}`, JSON.stringify(values));
    }

    if (parts.length === 0) continue;

    await db.query(
      `INSERT INTO project_brain_instances (agent_id, template_id, name, values, status, is_active, created_at, updated_at) VALUES ${parts.join(",")}`,
      params
    );
    instCreated += parts.length;
    process.stdout.write(`  instances: ${instCreated}/${toSeedInst.length}\r`);
  }

  console.log(`\n✅ Instances seeded: ${instCreated}`);
  if (skipped > 0) console.log(`⚠️  Skipped (no template): ${skipped}`);

  console.log("\n=== SELESAI ===");
  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
