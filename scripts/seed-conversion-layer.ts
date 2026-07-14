/**
 * Seed Conversion Layer untuk semua 881 agen aktif
 * Fields: conversion_enabled, conversion_goal, conversion_cta, lead_capture_fields,
 *         scoring_enabled, scoring_rubric, scoring_thresholds, whatsapp_cta,
 *         conversion_offers, cta_trigger_after_messages
 *
 * Run: node_modules/.bin/tsx scripts/seed-conversion-layer.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Domain detection ────────────────────────────────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface LeadField { id: string; label: string; type: string; required: boolean; placeholder: string }
interface RubricItem { id: string; category: string; maxScore: number; weight: number; description: string }
interface Offer { id: string; title: string; description: string; price: string; features: string[]; ctaText: string; ctaUrl: string; isPopular: boolean }
interface ConversionConfig {
  goal: string;
  cta: { title: string; description: string; buttonText: string; buttonUrl: string; style: string };
  triggerAfterMessages: number;
  leadFields: LeadField[];
  scoringEnabled: boolean;
  rubric: RubricItem[];
  thresholds: Record<string, any>;
  whatsappCta: string;
  offers: Offer[];
}

const WA = "+6281234567890"; // default placeholder
const WA_URL = "https://wa.me/6281234567890";

// ─── Lead field helpers ───────────────────────────────────────────────────────
function lf(id: string, label: string, type: string, ph: string, req = true): LeadField {
  return { id, label, type, required: req, placeholder: ph };
}

// ─── Domain configurations ───────────────────────────────────────────────────
const CONFIGS: Record<string, ConversionConfig> = {

  tender: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Strategi Tender — Gratis",
      description: "Tim konsultan kami siap membantu Anda menganalisis peluang tender, menyusun strategi penawaran, dan mereview dokumen sebelum submit.",
      buttonText: "Mulai Konsultasi Tender",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: Direktur, Manajer Tender"),
      lf("3", "Nama Perusahaan", "text", "Nama BUJK / perusahaan Anda"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
      lf("6", "Paket Tender yang Diikuti", "text", "Contoh: Jalan Tol Semarang Ring Road", false),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kesiapan Administrasi & Legalitas", maxScore: 25, weight: 0.25, description: "SBU, SKK TKK, SIUJK, legalitas perusahaan, pajak" },
      { id: "r2", category: "Kemampuan Teknis & Pengalaman", maxScore: 30, weight: 0.30, description: "Track record proyek sejenis, kapasitas peralatan, metode" },
      { id: "r3", category: "Kapasitas Keuangan", maxScore: 20, weight: 0.20, description: "Kemampuan cash flow, jaminan penawaran, modal kerja" },
      { id: "r4", category: "Strategi & Analisis Peluang", maxScore: 15, weight: 0.15, description: "Pemahaman HPS, kompetitor, win probability" },
      { id: "r5", category: "Kesiapan Dokumen Penawaran", maxScore: 10, weight: 0.10, description: "Kelengkapan teknis, harga, dan administrasi" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Belum Siap Tender", mediumLabel: "Perlu Persiapan", highLabel: "Siap Tender",
      lowRecommendation: "Butuh persiapan signifikan — mulai dari legalitas dan TKK dahulu.",
      mediumRecommendation: "Hampir siap — fokus penuhi gap dokumen dan strategi harga.",
      highRecommendation: "Siap submit — pastikan finalisasi checklist go/no-go sebelum deadline.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Review Tender", description: "Review dokumen penawaran, compliance check, dan rekomendasi perbaikan sebelum submit.",
        price: "Hubungi Kami", features: ["Review administrasi & teknis", "Compliance matrix KAK", "Checklist go/no-go", "1x konsultasi via WA"],
        ctaText: "Minta Review", ctaUrl: WA_URL, isPopular: false,
      },
      {
        id: "o2", title: "Paket Pendampingan Penuh", description: "Pendampingan lengkap dari persiapan hingga submit — strategi, dokumen, dan simulasi klarifikasi.",
        price: "Hubungi Kami", features: ["Semua fitur Review Tender", "Penyusunan metode pelaksanaan", "Analisis kompetitor & HPS", "Strategi harga & margin", "Simulasi aanwijzing & klarifikasi", "Pendampingan hingga pengumuman"],
        ctaText: "Daftar Sekarang", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  sbu: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Proses SBU — Gratis",
      description: "Dapatkan panduan lengkap pengurusan atau perpanjangan SBU BUJK sesuai Permen PU 6/2025 — dari gap analysis hingga OSS.",
      buttonText: "Mulai Konsultasi SBU",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan di Perusahaan", "text", "Contoh: Direktur, HRD Manager"),
      lf("3", "Nama Perusahaan (BUJK)", "text", "Nama PT / CV Anda"),
      lf("4", "Kualifikasi Target SBU", "text", "Contoh: SBU BG004 Kualifikasi M", false),
      lf("5", "Email", "email", "email@perusahaan.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kelengkapan TKK (Tenaga Kerja Kompeten)", maxScore: 30, weight: 0.30, description: "Jumlah & level SKK sesuai kualifikasi target" },
      { id: "r2", category: "Kapasitas Keuangan", maxScore: 25, weight: 0.25, description: "Modal disetor, laporan keuangan, referensi bank" },
      { id: "r3", category: "Pengalaman Pekerjaan Sejenis", maxScore: 25, weight: 0.25, description: "Kontrak & BAST pekerjaan sejenis 5 tahun terakhir" },
      { id: "r4", category: "Kelengkapan Dokumen Administrasi", maxScore: 10, weight: 0.10, description: "Akta, NIB, NPWP, izin usaha" },
      { id: "r5", category: "Status OSS & LPJK", maxScore: 10, weight: 0.10, description: "NIB aktif, data BUJK di LPJK terupdate" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Belum Memenuhi Syarat", mediumLabel: "Perlu Pemenuhan Gap", highLabel: "Siap Proses SBU",
      lowRecommendation: "Gap signifikan — prioritaskan pemenuhan TKK dan pengalaman pekerjaan dahulu.",
      mediumRecommendation: "Hampir memenuhi — fokus pada dokumen yang kurang dan update OSS.",
      highRecommendation: "Siap proses — mulai pengajuan melalui OSS dengan pendampingan konsultan.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Gap Analysis SBU", description: "Analisis lengkap kesiapan BUJK vs persyaratan SBU target dengan roadmap pemenuhan.",
        price: "Hubungi Kami", features: ["Gap analysis TKK & pengalaman", "Checklist dokumen lengkap", "Roadmap pemenuhan 30-60-90 hari", "1x sesi konsultasi"],
        ctaText: "Mulai Gap Analysis", ctaUrl: WA_URL, isPopular: false,
      },
      {
        id: "o2", title: "Paket Pengurusan SBU Penuh", description: "Pendampingan lengkap dari persiapan dokumen hingga SBU terbit.",
        price: "Hubungi Kami", features: ["Gap analysis + roadmap", "Pendampingan kelengkapan TKK & SKK", "Persiapan & review dokumen", "Proses OSS & LPJK", "Monitoring hingga SBU terbit"],
        ctaText: "Mulai Sekarang", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  skk: {
    goal: "registration",
    cta: {
      title: "Daftar Bimbingan SKK Sekarang",
      description: "Persiapkan diri menghadapi uji kompetensi SKK bersama coach berpengalaman — portofolio, latihan uji, dan pendampingan hingga kompeten.",
      buttonText: "Daftar Bimbingan SKK",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan Kerja / Skema SKK Target", "text", "Contoh: Ahli Teknik Bangunan Gedung Madya"),
      lf("3", "Jenjang KKNI Target", "text", "Contoh: KKNI Level 6", false),
      lf("4", "Pengalaman Kerja", "text", "Contoh: 8 tahun di bidang gedung", false),
      lf("5", "Email", "email", "email@gmail.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kesesuaian Pendidikan & Jabatan", maxScore: 20, weight: 0.20, description: "Ijazah + jabatan kerja sesuai syarat KKNI level target" },
      { id: "r2", category: "Pengalaman Kerja (tahun & relevansi)", maxScore: 30, weight: 0.30, description: "Lama dan relevansi pengalaman vs syarat minimum SKKNI" },
      { id: "r3", category: "Kelengkapan Portofolio Bukti", maxScore: 30, weight: 0.30, description: "Kontrak, BAST, foto dokumentasi, surat referensi" },
      { id: "r4", category: "Pengetahuan Teknis & Regulasi", maxScore: 20, weight: 0.20, description: "Pemahaman SKKNI, SK Dirjen 114, dan prosedur uji" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Belum Siap Uji", mediumLabel: "Perlu Persiapan", highLabel: "Siap Uji Kompetensi",
      lowRecommendation: "Butuh bimbingan intensif — portofolio dan pengalaman perlu diperkuat dahulu.",
      mediumRecommendation: "Hampir siap — fokus pada kelengkapan bukti portofolio dan simulasi uji.",
      highRecommendation: "Siap daftar uji — pastikan semua dokumen FR-APL-01 dan 02 lengkap.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Siap Uji SKK", description: "Bimbingan intensif persiapan uji kompetensi SKK — portofolio, latihan, dan simulasi.",
        price: "Hubungi Kami", features: ["Asesmen kesiapan awal", "Bimbingan penyusunan portofolio", "Latihan soal uji tulis & lisan", "Simulasi wawancara asesor"],
        ctaText: "Daftar Sekarang", ctaUrl: WA_URL, isPopular: true,
      },
      {
        id: "o2", title: "Paket SKK Express", description: "Bimbingan percepatan untuk yang sudah siap — fokus simulasi dan finalisasi dokumen.",
        price: "Hubungi Kami", features: ["Cek kesiapan & gap analysis", "Review portofolio bukti", "Simulasi uji kompetensi", "Finalisasi FR-APL-01 & 02"],
        ctaText: "Mulai Express", ctaUrl: WA_URL, isPopular: false,
      },
    ],
  },

  askom: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Asesmen Kompetensi",
      description: "Konsultasi persiapan atau pelaksanaan asesmen kompetensi — MUK, TUK, dan prosedur BNSP.",
      buttonText: "Konsultasi Sekarang",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan / Peran", "text", "Contoh: Asesor, Koordinator LSP, Kandidat"),
      lf("3", "Organisasi / LSP", "text", "Nama LSP atau perusahaan"),
      lf("4", "Skema yang Diasesmen", "text", "Nama skema / jabatan kerja", false),
      lf("5", "Email", "email", "email@gmail.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Pemahaman Standar BNSP & SKKNI", maxScore: 25, weight: 0.25, description: "Penguasaan Pedoman 201/202/301/303 dan regulasi terkait" },
      { id: "r2", category: "Kelengkapan & Kualitas MUK", maxScore: 35, weight: 0.35, description: "FR-APL, FR-AK series, instrumen uji sesuai standar" },
      { id: "r3", category: "Prosedur Pelaksanaan Asesmen", maxScore: 25, weight: 0.25, description: "Kesesuaian proses dengan Pedoman 301/303 BNSP" },
      { id: "r4", category: "Rekaman & Dokumentasi", maxScore: 15, weight: 0.15, description: "Kelengkapan rekaman hasil asesmen dan pengarsipan" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Perlu Pembinaan", mediumLabel: "Cukup Baik", highLabel: "Memenuhi Standar BNSP",
      lowRecommendation: "Diperlukan bimbingan intensif sebelum pelaksanaan asesmen.",
      mediumRecommendation: "Secara umum baik — perkuat MUK dan prosedur spesifik yang masih lemah.",
      highRecommendation: "Siap melaksanakan asesmen — pastikan rekaman tersimpan dengan baik.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Konsultasi MUK & Asesmen", description: "Review dan pendampingan penyusunan MUK serta persiapan pelaksanaan asesmen.",
        price: "Hubungi Kami", features: ["Review kelengkapan FR-APL & FR-AK", "Konsultasi instrumen uji", "Panduan prosedur BNSP", "1x sesi konsultasi online"],
        ctaText: "Mulai Konsultasi", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  lsp: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Lisensi & Manajemen LSP",
      description: "Dapatkan panduan pengurusan lisensi LSP baru, perpanjangan, atau persiapan audit BNSP.",
      buttonText: "Konsultasi LSP Sekarang",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan di LSP", "text", "Contoh: Direktur LSP, Manajer Sertifikasi"),
      lf("3", "Nama LSP", "text", "Nama Lembaga Sertifikasi Profesi"),
      lf("4", "Kebutuhan Konsultasi", "text", "Contoh: Lisensi baru, perpanjangan, tambah skema", false),
      lf("5", "Email", "email", "email@lsp.or.id"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kepatuhan Sistem Manajemen (ISO 17024)", maxScore: 30, weight: 0.30, description: "Kesesuaian dengan klausul SNI ISO/IEC 17024:2012" },
      { id: "r2", category: "Kualitas Skema & MUK", maxScore: 25, weight: 0.25, description: "Kelengkapan skema sertifikasi dan perangkat asesmen" },
      { id: "r3", category: "Kompetensi Asesor & Pengelola", maxScore: 25, weight: 0.25, description: "Lisensi asesor aktif, kompetensi pengelola LSP" },
      { id: "r4", category: "Rekaman & Dokumentasi", maxScore: 20, weight: 0.20, description: "Sistem rekaman, pengarsipan, dan pelaporan BNSP" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Perlu Pembenahan Sistem", mediumLabel: "Cukup Baik", highLabel: "Siap Audit BNSP",
      lowRecommendation: "LSP perlu pembenahan sistem manajemen sebelum audit.",
      mediumRecommendation: "Hampir siap audit — fokus perkuat area yang masih lemah.",
      highRecommendation: "Siap menghadapi audit BNSP — pastikan rekaman lengkap dan terkini.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Persiapan Audit LSP", description: "Pendampingan persiapan audit lisensi / surveillance BNSP.",
        price: "Hubungi Kami", features: ["Pre-audit gap analysis", "Review dokumen sistem manajemen", "Simulasi audit internal", "Panduan pemenuhan temuan NC"],
        ctaText: "Mulai Persiapan", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  legal: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Hukum — Gratis 30 Menit",
      description: "Konsultasikan permasalahan hukum, kontrak, atau klaim konstruksi Anda dengan tim legal berpengalaman.",
      buttonText: "Mulai Konsultasi Legal",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan / Kapasitas", "text", "Contoh: Direktur, PPK, Kontraktor"),
      lf("3", "Nama Perusahaan / Instansi", "text", "Nama perusahaan atau instansi"),
      lf("4", "Jenis Permasalahan", "text", "Contoh: Klaim kontrak, sengketa, perizinan"),
      lf("5", "Email", "email", "email@perusahaan.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kekuatan Dasar Hukum & Bukti", maxScore: 35, weight: 0.35, description: "Kualitas bukti dokumen, dasar hukum/klausul kontrak" },
      { id: "r2", category: "Kelengkapan Pemenuhan Prosedur", maxScore: 25, weight: 0.25, description: "Notifikasi tepat waktu, prosedur klaim, dokumen formal" },
      { id: "r3", category: "Posisi Tawar & Strategi", maxScore: 25, weight: 0.25, description: "Kekuatan posisi hukum vs pihak lawan" },
      { id: "r4", category: "Urgensi & Dampak Waktu", maxScore: 15, weight: 0.15, description: "Deadline hukum, kadaluarsa klaim, risiko lewat waktu" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Posisi Lemah — Perlu Persiapan", mediumLabel: "Posisi Moderat", highLabel: "Posisi Kuat",
      lowRecommendation: "Butuh penguatan bukti dan strategi sebelum melangkah lebih jauh.",
      mediumRecommendation: "Posisi cukup baik — lengkapi prosedur dan siapkan strategi negosiasi.",
      highRecommendation: "Posisi hukum kuat — segera ambil langkah konkret sesuai strategi.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Konsultasi Legal Awal", description: "Review posisi hukum, analisis risiko, dan rekomendasi strategi awal.",
        price: "Hubungi Kami", features: ["Analisis posisi hukum", "Identifikasi risiko klaim/sengketa", "Rekomendasi strategi awal", "1x sesi konsultasi 60 menit"],
        ctaText: "Jadwalkan Konsultasi", ctaUrl: WA_URL, isPopular: false,
      },
      {
        id: "o2", title: "Paket Pendampingan Hukum", description: "Pendampingan lengkap dari persiapan dokumen hingga proses negosiasi/arbitrase.",
        price: "Hubungi Kami", features: ["Semua fitur konsultasi awal", "Penyusunan surat & dokumen legal", "Pendampingan negosiasi / mediasi", "Review kontrak & addendum", "Dukungan klaim FIDIC / kontrak pemerintah"],
        ctaText: "Mulai Pendampingan", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  k3: {
    goal: "assessment",
    cta: {
      title: "Audit K3 & Gap Analysis SMK3 Gratis",
      description: "Dapatkan penilaian kondisi K3 proyek atau perusahaan Anda — temukan gap dan rekomendasi perbaikan sebelum audit eksternal.",
      buttonText: "Minta Audit K3 Gratis",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Penanggung Jawab K3", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: HSE Manager, Safety Officer"),
      lf("3", "Nama Perusahaan / Proyek", "text", "Nama perusahaan atau proyek"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kepemimpinan & Kebijakan K3", maxScore: 20, weight: 0.20, description: "Komitmen manajemen, kebijakan K3 tertulis, struktur organisasi K3" },
      { id: "r2", category: "Perencanaan & Identifikasi Bahaya", maxScore: 25, weight: 0.25, description: "HIRARC/IBPR, HSE Plan, pengendalian risiko" },
      { id: "r3", category: "Pelaksanaan & Pengendalian Operasional", maxScore: 30, weight: 0.30, description: "APD, JSA, hot work permit, housekeeping, pelatihan K3" },
      { id: "r4", category: "Monitoring & Evaluasi K3", maxScore: 25, weight: 0.25, description: "Inspeksi rutin, investigasi insiden, KPI K3, audit internal" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Tingkat K3 Kritis", mediumLabel: "K3 Cukup Baik", highLabel: "K3 Baik",
      lowRecommendation: "Diperlukan perbaikan mendesak — mulai dari kebijakan dan identifikasi bahaya.",
      mediumRecommendation: "K3 berjalan namun masih ada gap — perkuat monitoring dan pengendalian operasional.",
      highRecommendation: "K3 sudah baik — pertahankan dan tingkatkan menuju zero accident.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Audit K3 & SMK3", description: "Audit komprehensif sistem K3 dengan laporan gap analysis dan rekomendasi.",
        price: "Hubungi Kami", features: ["Audit lapangan K3", "Gap analysis vs PP 50/2012", "Laporan temuan & rekomendasi", "Action plan perbaikan prioritas"],
        ctaText: "Pesan Audit K3", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  iso9001: {
    goal: "assessment",
    cta: {
      title: "Gap Analysis ISO 9001 — Gratis",
      description: "Ketahui sejauh mana sistem manajemen mutu Anda siap untuk sertifikasi ISO 9001:2015 — dapatkan laporan gap dan roadmap implementasi.",
      buttonText: "Mulai Gap Analysis ISO 9001",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Penanggung Jawab", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: MR (Management Representative), Manajer Mutu"),
      lf("3", "Nama Organisasi", "text", "Nama perusahaan / organisasi"),
      lf("4", "Fase Implementasi Saat Ini", "text", "Contoh: Gap Analysis, Implementasi, Menjelang Audit", false),
      lf("5", "Email", "email", "email@perusahaan.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kl.4–5: Konteks & Kepemimpinan", maxScore: 20, weight: 0.20, description: "Konteks org, pihak berkepentingan, kebijakan mutu" },
      { id: "r2", category: "Kl.6–7: Perencanaan & Dukungan", maxScore: 20, weight: 0.20, description: "Manajemen risiko, sasaran mutu, kompetensi, dokumen" },
      { id: "r3", category: "Kl.8: Operasional", maxScore: 30, weight: 0.30, description: "Pengendalian operasional, pengelolaan pemasok, nonkonformitas" },
      { id: "r4", category: "Kl.9–10: Evaluasi & Perbaikan", maxScore: 30, weight: 0.30, description: "Audit internal, kaji ulang manajemen, CAPA, perbaikan berkelanjutan" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Belum Siap Sertifikasi", mediumLabel: "Perlu Penguatan", highLabel: "Siap Sertifikasi",
      lowRecommendation: "Implementasi masih awal — mulai dari dokumentasi dasar dan komitmen manajemen.",
      mediumRecommendation: "Sistem sudah berjalan — fokus perkuat klausul yang lemah dan siapkan audit internal.",
      highRecommendation: "Hampir siap sertifikasi — lakukan audit internal dan kaji ulang manajemen terakhir.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Gap Analysis ISO 9001", description: "Penilaian kesiapan dan laporan gap analysis terhadap persyaratan ISO 9001:2015.",
        price: "Hubungi Kami", features: ["Penilaian 7 klausul ISO 9001", "Laporan gap analysis lengkap", "Roadmap implementasi", "Rekomendasi prioritas"],
        ctaText: "Pesan Gap Analysis", ctaUrl: WA_URL, isPopular: false,
      },
      {
        id: "o2", title: "Paket Implementasi ISO 9001", description: "Pendampingan implementasi lengkap dari gap analysis hingga sertifikasi.",
        price: "Hubungi Kami", features: ["Gap analysis awal", "Penyusunan dokumentasi SMM", "Training awareness & internal audit", "Pendampingan audit sertifikasi", "Pemilihan lembaga sertifikasi"],
        ctaText: "Mulai Implementasi", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  iso14001: {
    goal: "assessment",
    cta: {
      title: "Gap Analysis ISO 14001 — Gratis",
      description: "Evaluasi kesiapan sistem manajemen lingkungan Anda terhadap ISO 14001:2015.",
      buttonText: "Mulai Gap Analysis ISO 14001",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Penanggung Jawab", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: MR Lingkungan, HSE Manager"),
      lf("3", "Nama Organisasi", "text", "Nama perusahaan"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Konteks & Kepemimpinan (Kl.4–5)", maxScore: 20, weight: 0.20, description: "Isu lingkungan, pihak berkepentingan, kebijakan lingkungan" },
      { id: "r2", category: "Perencanaan Aspek & Dampak (Kl.6)", maxScore: 30, weight: 0.30, description: "Identifikasi aspek signifikan, kepatuhan hukum, sasaran lingkungan" },
      { id: "r3", category: "Operasional & Tanggap Darurat (Kl.8)", maxScore: 30, weight: 0.30, description: "Pengendalian operasional, kesiapan darurat lingkungan" },
      { id: "r4", category: "Evaluasi & Perbaikan (Kl.9–10)", maxScore: 20, weight: 0.20, description: "Audit internal, kaji ulang manajemen, CAPA lingkungan" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Belum Siap Sertifikasi", mediumLabel: "Perlu Penguatan", highLabel: "Siap Sertifikasi",
      lowRecommendation: "Mulai dari identifikasi aspek lingkungan dan komitmen manajemen.",
      mediumRecommendation: "Perkuat pengendalian operasional dan prosedur tanggap darurat.",
      highRecommendation: "Siap sertifikasi — lakukan audit internal dan kaji ulang manajemen.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Implementasi ISO 14001", description: "Pendampingan implementasi SML dari gap analysis hingga sertifikasi.",
        price: "Hubungi Kami", features: ["Gap analysis SML", "Identifikasi aspek & dampak lingkungan", "Penyusunan dokumen SML", "Training & audit internal", "Pendampingan audit sertifikasi"],
        ctaText: "Mulai Implementasi", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  smap: {
    goal: "assessment",
    cta: {
      title: "Asesmen Kematangan SMAP — Gratis",
      description: "Evaluasi tingkat kematangan sistem manajemen anti-penyuapan dan kesiapan sertifikasi ISO 37001.",
      buttonText: "Mulai Asesmen SMAP",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Penanggung Jawab", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: Compliance Officer, Internal Audit"),
      lf("3", "Nama Organisasi", "text", "Nama perusahaan"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kepemimpinan & Kebijakan Anti-Suap", maxScore: 20, weight: 0.20, description: "Komitmen pimpinan, kebijakan ABMS tertulis, fungsi kepatuhan" },
      { id: "r2", category: "Penilaian Risiko Suap", maxScore: 25, weight: 0.25, description: "Register risiko suap, due diligence mitra, area berisiko tinggi" },
      { id: "r3", category: "Kontrol & Prosedur Anti-Suap", maxScore: 30, weight: 0.30, description: "Prosedur pengadaan, gratifikasi, whistleblowing, investigasi" },
      { id: "r4", category: "Monitoring & Audit SMAP", maxScore: 25, weight: 0.25, description: "Audit internal SMAP, KPI, kaji ulang manajemen" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Maturity Rendah", mediumLabel: "Maturity Sedang", highLabel: "Siap Sertifikasi ISO 37001",
      lowRecommendation: "Mulai dari kebijakan anti-suap dan penilaian risiko dasar.",
      mediumRecommendation: "Perkuat kontrol operasional dan sistem pelaporan pelanggaran.",
      highRecommendation: "Siap menuju sertifikasi — lakukan audit internal SMAP terakhir.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Implementasi SMAP / ISO 37001", description: "Pendampingan implementasi sistem manajemen anti-penyuapan.",
        price: "Hubungi Kami", features: ["Gap analysis SMAP", "Penyusunan kebijakan & prosedur", "Penilaian risiko suap", "Training awareness", "Audit internal & persiapan sertifikasi"],
        ctaText: "Mulai Implementasi", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  odoo: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Implementasi Odoo ERP",
      description: "Diskusikan kebutuhan ERP bisnis Anda — dari pemilihan modul hingga strategi go-live.",
      buttonText: "Konsultasi Odoo Gratis",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: Direktur, IT Manager, Finance Manager"),
      lf("3", "Nama Perusahaan", "text", "Nama perusahaan Anda"),
      lf("4", "Modul yang Dibutuhkan", "text", "Contoh: Accounting, Project, HR, Inventory", false),
      lf("5", "Email", "email", "email@perusahaan.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kesiapan Organisasi & Change Management", maxScore: 25, weight: 0.25, description: "Komitmen manajemen, kesiapan SDM, resistensi perubahan" },
      { id: "r2", category: "Kesiapan Data & Proses Bisnis", maxScore: 30, weight: 0.30, description: "Kebersihan data master, dokumentasi proses, SOP tertulis" },
      { id: "r3", category: "Infrastruktur IT", maxScore: 20, weight: 0.20, description: "Server/cloud, koneksi internet, perangkat end-user" },
      { id: "r4", category: "Timeline & Anggaran", maxScore: 25, weight: 0.25, description: "Realistisme jadwal go-live, alokasi anggaran, key user availability" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Belum Siap Implementasi", mediumLabel: "Siap dengan Persiapan", highLabel: "Siap Go-Live",
      lowRecommendation: "Butuh persiapan signifikan — mulai dari pembersihan data dan dokumentasi proses bisnis.",
      mediumRecommendation: "Hampir siap — pastikan kesiapan data master dan pelatihan key user.",
      highRecommendation: "Siap implementasi — mulai dari fase discovery dengan tim konsultan.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Implementasi Odoo Starter", description: "Implementasi modul dasar Odoo untuk UMKM dan perusahaan konstruksi.",
        price: "Hubungi Kami", features: ["Setup & konfigurasi modul dasar", "Migrasi data master", "Training user", "Go-live support 30 hari"],
        ctaText: "Mulai Implementasi", ctaUrl: WA_URL, isPopular: false,
      },
      {
        id: "o2", title: "Paket Implementasi Odoo Full", description: "Implementasi komprehensif Odoo dengan kustomisasi dan integrasi sistem.",
        price: "Hubungi Kami", features: ["Semua fitur Starter", "Kustomisasi sesuai proses bisnis", "Integrasi sistem eksternal", "UAT & QA testing", "Hypercare support 3 bulan"],
        ctaText: "Konsultasi Full", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  properti: {
    goal: "lead_capture",
    cta: {
      title: "Dapatkan Info Proyek & Penawaran Spesial",
      description: "Tinggalkan data Anda dan tim kami akan menghubungi dengan informasi terbaru, harga terbaik, dan promo eksklusif.",
      buttonText: "Minta Info Properti",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 3,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Email", "email", "email@gmail.com"),
      lf("3", "Telepon / WhatsApp", "phone", "+62..."),
      lf("4", "Budget yang Disiapkan", "text", "Contoh: Rp 500 juta – 1 miliar", false),
      lf("5", "Kebutuhan Properti", "text", "Contoh: Rumah, ruko, kavling, apartemen", false),
    ],
    scoringEnabled: false,
    rubric: [],
    thresholds: { low: 30, medium: 60, high: 80, lowLabel: "Prospek Dingin", mediumLabel: "Prospek Hangat", highLabel: "Prospek Panas", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Konsultasi Properti Gratis", description: "Konsultasi kebutuhan properti dan rekomendasi unit sesuai budget.",
        price: "Gratis", features: ["Analisis kebutuhan properti", "Rekomendasi unit sesuai budget", "Simulasi KPR / pembiayaan", "Tur virtual / site visit"],
        ctaText: "Jadwalkan Konsultasi", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  ibdp: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Program IB DP",
      description: "Dapatkan panduan lengkap program IB Diploma — registrasi, IA, CAS, EE, dan persiapan ujian.",
      buttonText: "Hubungi Koordinator IB",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Peran", "text", "Contoh: Koordinator IB, Guru, Orang Tua, Siswa"),
      lf("3", "Nama Sekolah", "text", "Nama sekolah / institusi"),
      lf("4", "Email", "email", "email@sekolah.edu"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: false,
    rubric: [],
    thresholds: { low: 30, medium: 60, high: 80, lowLabel: "Perlu Bimbingan", mediumLabel: "Cukup Baik", highLabel: "Siap", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Workshop Koordinator IB", description: "Workshop untuk koordinator dan guru IB DP — manajemen program dan best practice.",
        price: "Hubungi Kami", features: ["Pengelolaan administrasi IBIS", "Best practice IA & EE supervision", "Penanganan kasus malpractice", "Q&A session"],
        ctaText: "Daftar Workshop", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  tutor: {
    goal: "registration",
    cta: {
      title: "Mulai Belajar Sekarang",
      description: "Bergabung dengan program tutoring personal — belajar di kecepatan Anda sendiri dengan panduan dari tutor berpengalaman.",
      buttonText: "Daftar Program Belajar",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Mata Pelajaran / Topik", "text", "Contoh: Matematika, Fisika, Bahasa Inggris"),
      lf("3", "Level Pendidikan", "text", "Contoh: SMA Kelas 11, Persiapan UTBK"),
      lf("4", "Email", "email", "email@gmail.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Pemahaman Konsep Dasar", maxScore: 30, weight: 0.30, description: "Kekuatan fondasi materi pelajaran" },
      { id: "r2", category: "Kemampuan Mengerjakan Soal", maxScore: 35, weight: 0.35, description: "Akurasi dan kecepatan dalam mengerjakan soal" },
      { id: "r3", category: "Konsistensi Belajar", maxScore: 20, weight: 0.20, description: "Kehadiran, disiplin, dan keaktifan dalam sesi" },
      { id: "r4", category: "Kemajuan dari Sesi Sebelumnya", maxScore: 15, weight: 0.15, description: "Perkembangan skor dari waktu ke waktu" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Perlu Perhatian Ekstra", mediumLabel: "Berkembang dengan Baik", highLabel: "Excellent",
      lowRecommendation: "Butuh lebih banyak latihan dan sesi remedial — jangan menyerah!",
      mediumRecommendation: "Progres bagus — tingkatkan intensitas latihan soal untuk level berikutnya.",
      highRecommendation: "Prestasi luar biasa — siap menghadapi ujian sesungguhnya!",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Tutoring 8 Sesi", description: "8 sesi belajar personal dengan kurikulum terstruktur dan evaluasi per sesi.",
        price: "Hubungi Kami", features: ["8 sesi 90 menit bersama tutor", "Rencana belajar personal", "Latihan soal & pembahasan", "Laporan progress orang tua"],
        ctaText: "Daftar Sekarang", ctaUrl: WA_URL, isPopular: false,
      },
      {
        id: "o2", title: "Paket Intensif Ujian", description: "Persiapan ujian intensif — fokus materi kritis dan simulasi ujian nyata.",
        price: "Hubungi Kami", features: ["Semua fitur Paket 8 Sesi", "Analisis soal ujian tahun lalu", "5 simulasi ujian penuh", "Target skor yang dijamin"], ctaText: "Mulai Intensif", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  edukasi: {
    goal: "registration",
    cta: {
      title: "Daftar Program Pelatihan",
      description: "Tingkatkan kompetensi tim Anda dengan program pelatihan terstruktur — sertifikat resmi dan trainer berpengalaman.",
      buttonText: "Daftar Pelatihan",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Penanggung Jawab", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: HRD Manager, Training Coordinator"),
      lf("3", "Nama Instansi / Perusahaan", "text", "Nama perusahaan atau instansi"),
      lf("4", "Jumlah Peserta", "text", "Contoh: 20 orang", false),
      lf("5", "Email", "email", "email@perusahaan.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: false,
    rubric: [],
    thresholds: { low: 30, medium: 60, high: 80, lowLabel: "Perlu Pelatihan", mediumLabel: "Cukup Kompeten", highLabel: "Kompeten", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket In-House Training", description: "Pelatihan diselenggarakan di tempat Anda — fleksibel jadwal dan konten.",
        price: "Hubungi Kami", features: ["Trainer berpengalaman", "Materi disesuaikan kebutuhan", "Sertifikat peserta", "Laporan evaluasi pelatihan"],
        ctaText: "Pesan In-House Training", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  pengelasan: {
    goal: "registration",
    cta: {
      title: "Daftar Pelatihan & Sertifikasi Pengelasan",
      description: "Tingkatkan kompetensi juru las Anda — pelatihan proses las, kualifikasi WPS/WQR, dan sertifikasi SKKNI.",
      buttonText: "Daftar Pelatihan Las",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap / Nama Perusahaan", "text", "Masukkan nama Anda"),
      lf("2", "Jumlah Juru Las", "text", "Contoh: 5 orang"),
      lf("3", "Proses Las yang Dibutuhkan", "text", "Contoh: SMAW, GTAW, GMAW"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Penguasaan Teknik Las", maxScore: 35, weight: 0.35, description: "Kualitas hasil las, kontrol parameter, posisi las" },
      { id: "r2", category: "Pengetahuan Teori (Metalurgi, NDT, WPS)", maxScore: 25, weight: 0.25, description: "Teori pengelasan, cacat las, prosedur pengelasan" },
      { id: "r3", category: "Kepatuhan K3 Las", maxScore: 25, weight: 0.25, description: "APD, hot work permit, penanganan gas/kawat las" },
      { id: "r4", category: "Dokumen Kualifikasi (WQR)", maxScore: 15, weight: 0.15, description: "Kelengkapan dan validitas sertifikat WQR" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Perlu Pelatihan Intensif", mediumLabel: "Kompeten Dasar", highLabel: "Kompeten Penuh",
      lowRecommendation: "Perlu pelatihan dari dasar — enroll ke program pelatihan pengelasan segera.",
      mediumRecommendation: "Kompetensi dasar ada — tingkatkan lewat latihan posisi yang lebih sulit.",
      highRecommendation: "Siap kualifikasi WQR dan uji SKK pengelasan.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Pelatihan & Kualifikasi Las", description: "Pelatihan pengelasan + kualifikasi WQR + persiapan SKK.",
        price: "Hubungi Kami", features: ["Pelatihan teori & praktik las", "Kualifikasi WPS/WQR", "Uji NDT (VT, PT)", "Persiapan SKK pengelasan"],
        ctaText: "Daftar Pelatihan", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  alat_berat: {
    goal: "registration",
    cta: {
      title: "Daftar Pelatihan Operator Alat Berat",
      description: "Ikuti pelatihan operator alat berat bersertifikat — SIO, K3, dan peningkatan OEE.",
      buttonText: "Daftar Pelatihan Alat Berat",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap / Nama Perusahaan", "text", "Masukkan nama Anda"),
      lf("2", "Jenis Alat Berat", "text", "Contoh: Excavator, Crane, Bulldozer"),
      lf("3", "Jumlah Operator", "text", "Contoh: 3 orang"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: false,
    rubric: [],
    thresholds: { low: 30, medium: 60, high: 80, lowLabel: "Perlu Pelatihan", mediumLabel: "Cukup Kompeten", highLabel: "Kompeten & Bersertifikat", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Pelatihan Operator Alat Berat", description: "Pelatihan + SIO + K3 operator alat berat bersertifikat Kemnaker.",
        price: "Hubungi Kami", features: ["Pelatihan teori & praktik", "Pengurusan SIO (Kemnaker)", "K3 operator alat berat", "Simulasi OEE & maintenance dasar"],
        ctaText: "Daftar Sekarang", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  pm: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Manajemen Proyek Konstruksi",
      description: "Dapatkan panduan pengendalian proyek — schedule, biaya, risiko, dan claim management.",
      buttonText: "Mulai Konsultasi PM",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan", "text", "Contoh: Project Manager, Site Engineer"),
      lf("3", "Nama Proyek / Perusahaan", "text", "Nama proyek atau perusahaan"),
      lf("4", "Email", "email", "email@perusahaan.com"),
      lf("5", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Pengendalian Jadwal (SPI)", maxScore: 25, weight: 0.25, description: "Schedule Performance Index dan analisis lintasan kritis" },
      { id: "r2", category: "Pengendalian Biaya (CPI)", maxScore: 25, weight: 0.25, description: "Cost Performance Index, earned value, dan forecast" },
      { id: "r3", category: "Manajemen Risiko", maxScore: 25, weight: 0.25, description: "Risk register aktif, mitigasi berjalan, eskalasi tepat waktu" },
      { id: "r4", category: "Manajemen Kontrak & Klaim", maxScore: 25, weight: 0.25, description: "Kepatuhan kontrak, notifikasi klaim, administrasi kontrak" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Proyek Bermasalah", mediumLabel: "Proyek Terkendali Sebagian", highLabel: "Proyek Terkendali Baik",
      lowRecommendation: "Diperlukan intervensi segera — analisis kritis dan recovery plan.",
      mediumRecommendation: "Proyek masih dalam kendali — perkuat manajemen risiko dan biaya.",
      highRecommendation: "Proyek berjalan baik — pertahankan dengan monitoring konsisten.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Konsultasi Project Control", description: "Review dan perbaikan sistem pengendalian proyek — schedule, biaya, dan risiko.",
        price: "Hubungi Kami", features: ["Review kurva S dan earned value", "Analisis SPI & CPI", "Risk register audit", "Recovery plan rekomendasi"],
        ctaText: "Pesan Konsultasi", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  katalog: {
    goal: "assessment",
    cta: {
      title: "Asesmen Kompetensi Jabatan Kerja Gratis",
      description: "Identifikasi jabatan kerja yang paling sesuai dan dapatkan roadmap sertifikasi SKK yang tepat untuk Anda.",
      buttonText: "Mulai Asesmen Jabatan",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Bidang Pekerjaan", "text", "Contoh: Struktur Gedung, Jalan, Mekanikal"),
      lf("3", "Jabatan / Posisi Saat Ini", "text", "Contoh: Site Engineer, Pelaksana Lapangan"),
      lf("4", "Pengalaman Kerja", "text", "Contoh: 5 tahun", false),
      lf("5", "Email", "email", "email@gmail.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: true,
    rubric: [
      { id: "r1", category: "Kesesuaian Pendidikan & Jabatan", maxScore: 20, weight: 0.20, description: "Ijazah + bidang pekerjaan vs syarat KKNI" },
      { id: "r2", category: "Pengalaman Kerja Relevan", maxScore: 30, weight: 0.30, description: "Durasi dan relevansi pengalaman vs syarat minimum" },
      { id: "r3", category: "Penguasaan Unit Kompetensi", maxScore: 30, weight: 0.30, description: "Pemahaman dan kemampuan unit kompetensi SKKNI" },
      { id: "r4", category: "Kelengkapan Portofolio", maxScore: 20, weight: 0.20, description: "Bukti pekerjaan, kontrak, referensi atasan" },
    ],
    thresholds: {
      low: 40, medium: 65, high: 80,
      lowLabel: "Perlu Persiapan Lebih Lanjut", mediumLabel: "Hampir Siap", highLabel: "Siap Uji Kompetensi",
      lowRecommendation: "Mulai kumpulkan portofolio dan perkuat pengalaman di bidang target.",
      mediumRecommendation: "Hampir siap — lengkapi dokumen dan simulasikan uji kompetensi.",
      highRecommendation: "Siap mendaftar uji — pilih LSP dan jadwalkan uji kompetensi.",
    },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Coaching Jabatan & SKK", description: "Pendampingan identifikasi jabatan yang tepat + persiapan SKK.",
        price: "Hubungi Kami", features: ["Matching jabatan kerja vs profil", "Gap analysis komprehensif", "Bimbingan penyusunan portofolio", "Persiapan uji kompetensi SKK"],
        ctaText: "Mulai Coaching", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  perizinan: {
    goal: "consultation",
    cta: {
      title: "Konsultasi Perizinan Usaha Konstruksi",
      description: "Dapatkan panduan lengkap pengurusan NIB, SBU, PBG, SLF, dan perizinan usaha lainnya melalui OSS.",
      buttonText: "Konsultasi Perizinan Gratis",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 4,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Jabatan di Perusahaan", "text", "Contoh: Direktur, Manajer Legal"),
      lf("3", "Nama Perusahaan", "text", "Nama PT / CV Anda"),
      lf("4", "Jenis Izin yang Diurus", "text", "Contoh: NIB, SBU, PBG, SLF", false),
      lf("5", "Email", "email", "email@perusahaan.com"),
      lf("6", "Telepon / WhatsApp", "phone", "+62..."),
    ],
    scoringEnabled: false,
    rubric: [],
    thresholds: { low: 30, medium: 60, high: 80, lowLabel: "Banyak Dokumen Kurang", mediumLabel: "Hampir Lengkap", highLabel: "Siap Proses", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" },
    whatsappCta: WA,
    offers: [
      {
        id: "o1", title: "Paket Pengurusan Perizinan", description: "Pendampingan pengurusan perizinan usaha dari persiapan dokumen hingga izin terbit.",
        price: "Hubungi Kami", features: ["Cek & persiapan dokumen", "Proses OSS / DPMPTSP", "Monitoring status perizinan", "Follow up hingga izin terbit"],
        ctaText: "Mulai Pengurusan", ctaUrl: WA_URL, isPopular: true,
      },
    ],
  },

  universal: {
    goal: "lead_capture",
    cta: {
      title: "Hubungi Kami untuk Informasi Lebih Lanjut",
      description: "Tim kami siap membantu Anda — tinggalkan data dan kami akan segera menghubungi.",
      buttonText: "Hubungi Kami",
      buttonUrl: WA_URL,
      style: "card",
    },
    triggerAfterMessages: 5,
    leadFields: [
      lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
      lf("2", "Email", "email", "email@gmail.com"),
      lf("3", "Telepon / WhatsApp", "phone", "+62..."),
      lf("4", "Keperluan / Pertanyaan", "textarea", "Ceritakan kebutuhan Anda...", false),
    ],
    scoringEnabled: false,
    rubric: [],
    thresholds: { low: 30, medium: 60, high: 80, lowLabel: "Perlu Informasi Lebih", mediumLabel: "Tertarik", highLabel: "Siap Tindak Lanjut", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" },
    whatsappCta: WA,
    offers: [],
  },
};

// Orchestrators use the synthesis / "consultation" variant
const ORCHESTRATOR_CONFIG: ConversionConfig = {
  goal: "consultation",
  cta: {
    title: "Konsultasi Mendalam bersama Tim Ahli",
    description: "Dapatkan analisis komprehensif lintas domain dari tim konsultan kami — dari identifikasi masalah hingga rekomendasi eksekutif.",
    buttonText: "Mulai Konsultasi",
    buttonUrl: WA_URL,
    style: "card",
  },
  triggerAfterMessages: 5,
  leadFields: [
    lf("1", "Nama Lengkap", "text", "Masukkan nama Anda"),
    lf("2", "Jabatan / Posisi", "text", "Contoh: Direktur, Manager, Konsultan"),
    lf("3", "Nama Perusahaan / Instansi", "text", "Nama perusahaan atau instansi"),
    lf("4", "Topik Konsultasi", "text", "Jelaskan kebutuhan konsultasi Anda"),
    lf("5", "Email", "email", "email@perusahaan.com"),
    lf("6", "Telepon / WhatsApp", "phone", "+62..."),
  ],
  scoringEnabled: true,
  rubric: [
    { id: "r1", category: "Kompleksitas & Urgensi Permasalahan", maxScore: 30, weight: 0.30, description: "Tingkat kompleksitas dan urgensi masalah yang dihadapi" },
    { id: "r2", category: "Kesiapan Data & Konteks", maxScore: 25, weight: 0.25, description: "Kelengkapan informasi dan konteks yang tersedia" },
    { id: "r3", category: "Kapasitas Implementasi", maxScore: 25, weight: 0.25, description: "Kemampuan eksekusi rekomendasi (SDM, anggaran, waktu)" },
    { id: "r4", category: "Potensi Dampak & ROI", maxScore: 20, weight: 0.20, description: "Estimasi manfaat dan return dari intervensi" },
  ],
  thresholds: {
    low: 40, medium: 65, high: 80,
    lowLabel: "Perlu Persiapan Lebih", mediumLabel: "Siap Konsultasi", highLabel: "Prioritas Tinggi",
    lowRecommendation: "Kumpulkan data dan konteks lebih lengkap sebelum sesi konsultasi.",
    mediumRecommendation: "Siap berkonsultasi — persiapkan pertanyaan spesifik untuk sesi Anda.",
    highRecommendation: "Kasus dengan prioritas tinggi — jadwalkan sesi konsultasi segera.",
  },
  whatsappCta: WA,
  offers: [
    {
      id: "o1", title: "Sesi Konsultasi Strategis", description: "Sesi konsultasi mendalam dengan tim ahli multi-domain.",
      price: "Hubungi Kami", features: ["Analisis masalah lintas domain", "Rekomendasi eksekutif terstruktur", "Action plan prioritas", "Follow-up 2 minggu pasca sesi"],
      ctaText: "Jadwalkan Sesi", ctaUrl: WA_URL, isPopular: true,
    },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Conversion Layer — All Active Agents ===\n");

  const { rows: agents } = await db.query<{
    id: number; name: string; category: string | null;
    domain_charter: string | null; is_orchestrator: boolean;
  }>(`SELECT id, name, category, domain_charter, is_orchestrator FROM agents WHERE is_active = true ORDER BY id`);

  console.log(`Total agents: ${agents.length}`);

  const distrib: Record<string, number> = {};
  const BATCH = 100;
  let updated = 0;

  for (let i = 0; i < agents.length; i += BATCH) {
    const batch = agents.slice(i, i + BATCH);
    const parts: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const a of batch) {
      const domain = a.is_orchestrator ? "orchestrator" : detectDomain(a.name, a.category, a.domain_charter);
      const cfg: ConversionConfig = a.is_orchestrator
        ? ORCHESTRATOR_CONFIG
        : (CONFIGS[detectDomain(a.name, a.category, a.domain_charter)] ?? CONFIGS["universal"]);

      distrib[domain] = (distrib[domain] || 0) + 1;

      parts.push(`
        UPDATE agents SET
          conversion_enabled     = $${idx++},
          conversion_goal        = $${idx++},
          conversion_cta         = $${idx++}::jsonb,
          lead_capture_fields    = $${idx++}::jsonb,
          scoring_enabled        = $${idx++},
          scoring_rubric         = $${idx++}::jsonb,
          scoring_thresholds     = $${idx++}::jsonb,
          whatsapp_cta           = $${idx++},
          conversion_offers      = $${idx++}::jsonb,
          cta_trigger_after_messages = $${idx++}
        WHERE id = $${idx++}
      `);
      params.push(
        true,
        cfg.goal,
        JSON.stringify(cfg.cta),
        JSON.stringify(cfg.leadFields),
        cfg.scoringEnabled,
        JSON.stringify(cfg.rubric),
        JSON.stringify(cfg.thresholds),
        cfg.whatsappCta,
        JSON.stringify(cfg.offers),
        cfg.triggerAfterMessages,
        a.id
      );
    }

    // Execute each update in the batch
    for (let j = 0; j < batch.length; j++) {
      // extract params for this agent
      const perAgent = 11;
      const agentParams = params.slice(j * perAgent, (j + 1) * perAgent);
      const sql = `
        UPDATE agents SET
          conversion_enabled         = $1,
          conversion_goal            = $2,
          conversion_cta             = $3::jsonb,
          lead_capture_fields        = $4::jsonb,
          scoring_enabled            = $5,
          scoring_rubric             = $6::jsonb,
          scoring_thresholds         = $7::jsonb,
          whatsapp_cta               = $8,
          conversion_offers          = $9::jsonb,
          cta_trigger_after_messages = $10
        WHERE id = $11
      `;
      await db.query(sql, agentParams);
    }

    updated += batch.length;
    process.stdout.write(`  Updated: ${updated}/${agents.length}\r`);
  }

  console.log(`\n\n✅ Conversion layer seeded: ${updated} agents`);
  console.log("\nDistribution:");
  Object.entries(distrib).sort((a, b) => b[1] - a[1]).forEach(([d, c]) =>
    console.log(`  ${String(c).padStart(4)}  ${d}`)
  );

  // Verify
  const { rows: v } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE conversion_enabled = true) as enabled,
      COUNT(*) FILTER (WHERE conversion_cta::text != '{}' AND conversion_cta::text != 'null') as has_cta,
      COUNT(*) FILTER (WHERE lead_capture_fields::text != '[]') as has_lead_fields,
      COUNT(*) FILTER (WHERE scoring_enabled = true) as scoring_on,
      COUNT(*) FILTER (WHERE conversion_offers::text != '[]') as has_offers,
      COUNT(*) FILTER (WHERE whatsapp_cta != '') as has_wa
    FROM agents WHERE is_active = true
  `);
  console.log("\nVerification:");
  Object.entries(v[0]).forEach(([k, val]) => console.log(`  ${k.padEnd(20)} ${val}`));

  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
