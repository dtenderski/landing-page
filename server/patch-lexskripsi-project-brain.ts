/**
 * patch-lexskripsi-project-brain.ts
 * Buat Project Brain Template "Otak Skripsi" untuk LexSkripsi (agent 1362).
 *
 * Template ini menyimpan konteks persisten tentang mahasiswa dan skripsinya:
 * — Profil mahasiswa (nama, NIM, kampus, prodi)
 * — Skripsi (judul, 3 RM, fokus hukum)
 * — Metodologi (jenis penelitian, pendekatan)
 * — Data lapangan (lokasi, informan, status)
 * — Progress per bab (Bab I–V + sidang)
 * — Dosen pembimbing & catatan
 * — Kendala aktif saat ini
 *
 * Setelah template dibuat, satu instance default "Skripsi Graciella" juga
 * disiapkan agar context default sudah langsung tersedia.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-PROJECT-BRAIN-v1";

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FIELDS — "Otak Skripsi"
// ─────────────────────────────────────────────────────────────────────────────

const OTAK_SKRIPSI_FIELDS = [
  // ── BLOK 1: PROFIL MAHASISWA ──────────────────────────────────────────────
  {
    key: "nama_mahasiswa",
    label: "Nama Mahasiswa",
    type: "text",
    required: true,
    placeholder: "Contoh: Graciella Audrey Firmantoputri",
    helpText: "Nama lengkap mahasiswa",
    defaultValue: "",
    options: [],
    order: 1,
  },
  {
    key: "nim",
    label: "NIM",
    type: "text",
    required: false,
    placeholder: "Contoh: 202005000117",
    helpText: "Nomor Induk Mahasiswa",
    defaultValue: "",
    options: [],
    order: 2,
  },
  {
    key: "kampus",
    label: "Kampus / Universitas",
    type: "text",
    required: false,
    placeholder: "Contoh: Unika Atma Jaya Jakarta",
    helpText: "Nama kampus mahasiswa",
    defaultValue: "",
    options: [],
    order: 3,
  },
  {
    key: "program_studi",
    label: "Program Studi",
    type: "text",
    required: false,
    placeholder: "Contoh: S1 Ilmu Hukum — Hukum Perdata",
    helpText: "Nama program studi lengkap",
    defaultValue: "S1 Ilmu Hukum",
    options: [],
    order: 4,
  },
  {
    key: "email_mahasiswa",
    label: "Email Mahasiswa",
    type: "email",
    required: false,
    placeholder: "email@kampus.ac.id",
    helpText: "Email aktif mahasiswa",
    defaultValue: "",
    options: [],
    order: 5,
  },

  // ── BLOK 2: SKRIPSI ───────────────────────────────────────────────────────
  {
    key: "judul_skripsi",
    label: "Judul Skripsi (Draft / Final)",
    type: "textarea",
    required: true,
    placeholder: "Contoh: Tanggung Jawab Perusahaan Minuman Berpemanis dalam Kemasan terhadap Konsumen Ditinjau dari Perspektif Perbuatan Melawan Hukum dan Strict Liability",
    helpText: "Judul skripsi — tulis lengkap, bisa masih draft",
    defaultValue: "",
    options: [],
    order: 6,
  },
  {
    key: "fokus_hukum",
    label: "Bidang / Fokus Hukum",
    type: "select",
    required: true,
    placeholder: "Pilih bidang hukum",
    helpText: "Bidang hukum utama yang menjadi fokus penelitian",
    defaultValue: "",
    options: [
      "Hukum Perdata",
      "Hukum Bisnis & Ekonomi",
      "Hukum Pidana",
      "Hukum Tata Negara",
      "Hukum Administrasi Negara",
      "Hukum Internasional",
      "Hukum Lingkungan",
      "Hukum Ketenagakerjaan",
      "Hukum Perlindungan Konsumen",
      "Hukum Konstruksi & Infrastruktur",
      "Lainnya",
    ],
    order: 7,
  },
  {
    key: "rumusan_masalah_1",
    label: "Rumusan Masalah 1",
    type: "textarea",
    required: true,
    placeholder: "Contoh: Bagaimana tanggung jawab hukum perusahaan MBDK terhadap konsumen yang mengalami kerugian akibat konsumsi produk MBDK berdasarkan Pasal 1365 KUHPerdata?",
    helpText: "Rumusan masalah pertama — kalimat tanya yang akan dijawab di Bab IV",
    defaultValue: "",
    options: [],
    order: 8,
  },
  {
    key: "rumusan_masalah_2",
    label: "Rumusan Masalah 2",
    type: "textarea",
    required: false,
    placeholder: "Contoh: Apakah regulasi MBDK yang ada sudah memadai untuk melindungi konsumen?",
    helpText: "Rumusan masalah kedua (jika ada)",
    defaultValue: "",
    options: [],
    order: 9,
  },
  {
    key: "rumusan_masalah_3",
    label: "Rumusan Masalah 3",
    type: "textarea",
    required: false,
    placeholder: "Contoh: Bagaimana upaya hukum yang dapat ditempuh konsumen?",
    helpText: "Rumusan masalah ketiga (jika ada)",
    defaultValue: "",
    options: [],
    order: 10,
  },

  // ── BLOK 3: METODOLOGI ────────────────────────────────────────────────────
  {
    key: "jenis_penelitian",
    label: "Jenis Penelitian",
    type: "select",
    required: true,
    placeholder: "Pilih jenis penelitian",
    helpText: "Jenis penelitian hukum yang digunakan",
    defaultValue: "",
    options: [
      "Yuridis Normatif",
      "Yuridis Empiris",
      "Yuridis Empiris Ringan (Campuran 70/30)",
      "Socio-Legal",
    ],
    order: 11,
  },
  {
    key: "pendekatan_penelitian",
    label: "Pendekatan Penelitian",
    type: "multiselect",
    required: false,
    placeholder: "Pilih pendekatan (boleh lebih dari satu)",
    helpText: "Pendekatan yang digunakan dalam penelitian",
    defaultValue: "",
    options: [
      "Pendekatan Perundang-undangan (Statute Approach)",
      "Pendekatan Konseptual (Conceptual Approach)",
      "Pendekatan Kasus (Case Approach)",
      "Pendekatan Komparatif (Comparative Approach)",
      "Pendekatan Empiris / Lapangan",
      "Pendekatan Historis",
    ],
    order: 12,
  },
  {
    key: "teori_utama",
    label: "Teori / Doktrin Hukum Utama",
    type: "textarea",
    required: false,
    placeholder: "Contoh: Teori Perbuatan Melawan Hukum (PMH) — Pasal 1365 KUHPerdata; Doktrin Strict Liability; Teori Perlindungan Konsumen (UUPK No. 8/1999)",
    helpText: "Teori atau doktrin hukum yang menjadi landasan analisis",
    defaultValue: "",
    options: [],
    order: 13,
  },
  {
    key: "referensi_metodologi",
    label: "Referensi Metodologi Utama",
    type: "text",
    required: false,
    placeholder: "Contoh: Purwaka (Metodologi Penelitian Hukum, 2011)",
    helpText: "Buku metodologi yang digunakan sebagai panduan",
    defaultValue: "Purwaka",
    options: [],
    order: 14,
  },

  // ── BLOK 4: DATA LAPANGAN ─────────────────────────────────────────────────
  {
    key: "ada_data_lapangan",
    label: "Ada Komponen Empiris / Lapangan?",
    type: "boolean",
    required: false,
    placeholder: "",
    helpText: "Apakah penelitian ini melibatkan data primer dari lapangan?",
    defaultValue: "false",
    options: [],
    order: 15,
  },
  {
    key: "lokasi_penelitian",
    label: "Lokasi Penelitian / Lapangan",
    type: "text",
    required: false,
    placeholder: "Contoh: Kelurahan Jatiasih, Kota Bekasi",
    helpText: "Lokasi pengambilan data lapangan",
    defaultValue: "",
    options: [],
    order: 16,
  },
  {
    key: "jumlah_informan",
    label: "Jumlah Informan",
    type: "number",
    required: false,
    placeholder: "Contoh: 10",
    helpText: "Total informan yang diwawancarai",
    defaultValue: "",
    options: [],
    order: 17,
  },
  {
    key: "komposisi_informan",
    label: "Komposisi Informan",
    type: "text",
    required: false,
    placeholder: "Contoh: 6 Konsumen + 2 Pelaku Usaha + 2 Konsultan/Pakar",
    helpText: "Rincian komposisi informan per kategori",
    defaultValue: "",
    options: [],
    order: 18,
  },
  {
    key: "status_data_lapangan",
    label: "Status Pengumpulan Data",
    type: "select",
    required: false,
    placeholder: "Pilih status",
    helpText: "Status pengumpulan data lapangan saat ini",
    defaultValue: "",
    options: [
      "Belum mulai",
      "Sedang menyusun instrumen",
      "Sedang wawancara",
      "Data terkumpul, belum diolah",
      "Selesai — data sudah diolah",
    ],
    order: 19,
  },

  // ── BLOK 5: PROGRESS PER BAB ──────────────────────────────────────────────
  {
    key: "fase_saat_ini",
    label: "Fase Skripsi Saat Ini",
    type: "select",
    required: true,
    placeholder: "Pilih fase",
    helpText: "Tahapan penulisan skripsi yang sedang dikerjakan",
    defaultValue: "",
    options: [
      "Masih mencari topik",
      "Menyusun proposal",
      "Bab I — Pendahuluan",
      "Bab II — Tinjauan Pustaka",
      "Bab III — Metode Penelitian",
      "Bab IV — Hasil & Analisis",
      "Bab V — Kesimpulan & Saran",
      "Finalisasi & Formatting",
      "Pra-Sidang",
      "Sudah sidang",
    ],
    order: 20,
  },
  {
    key: "status_bab1",
    label: "Status Bab I (Pendahuluan)",
    type: "select",
    required: false,
    placeholder: "Pilih status",
    helpText: "Status penyelesaian Bab I",
    defaultValue: "Belum mulai",
    options: ["Belum mulai", "Sedang dikerjakan", "Draft selesai", "Sedang revisi", "Final"],
    order: 21,
  },
  {
    key: "status_bab2",
    label: "Status Bab II (Tinjauan Pustaka)",
    type: "select",
    required: false,
    placeholder: "Pilih status",
    helpText: "Status penyelesaian Bab II",
    defaultValue: "Belum mulai",
    options: ["Belum mulai", "Sedang dikerjakan", "Draft selesai", "Sedang revisi", "Final"],
    order: 22,
  },
  {
    key: "status_bab3",
    label: "Status Bab III (Metode Penelitian)",
    type: "select",
    required: false,
    placeholder: "Pilih status",
    helpText: "Status penyelesaian Bab III",
    defaultValue: "Belum mulai",
    options: ["Belum mulai", "Sedang dikerjakan", "Draft selesai", "Sedang revisi", "Final"],
    order: 23,
  },
  {
    key: "status_bab4",
    label: "Status Bab IV (Hasil & Analisis)",
    type: "select",
    required: false,
    placeholder: "Pilih status",
    helpText: "Status penyelesaian Bab IV",
    defaultValue: "Belum mulai",
    options: ["Belum mulai", "Sedang dikerjakan", "Draft selesai", "Sedang revisi", "Final"],
    order: 24,
  },
  {
    key: "status_bab5",
    label: "Status Bab V (Kesimpulan & Saran)",
    type: "select",
    required: false,
    placeholder: "Pilih status",
    helpText: "Status penyelesaian Bab V",
    defaultValue: "Belum mulai",
    options: ["Belum mulai", "Sedang dikerjakan", "Draft selesai", "Sedang revisi", "Final"],
    order: 25,
  },
  {
    key: "target_sidang",
    label: "Target Tanggal Sidang",
    type: "date",
    required: false,
    placeholder: "",
    helpText: "Tanggal sidang yang ditargetkan",
    defaultValue: "",
    options: [],
    order: 26,
  },

  // ── BLOK 6: DOSEN & BIMBINGAN ─────────────────────────────────────────────
  {
    key: "nama_dosen_pembimbing",
    label: "Nama Dosen Pembimbing",
    type: "text",
    required: false,
    placeholder: "Contoh: Dr. Budi Santoso, S.H., M.H.",
    helpText: "Nama dosen pembimbing dari kampus",
    defaultValue: "",
    options: [],
    order: 27,
  },
  {
    key: "catatan_dosen_terakhir",
    label: "Catatan / Masukan Terakhir dari Dosen",
    type: "textarea",
    required: false,
    placeholder: "Contoh: Dosen minta perkuat bagian Penelitian Terdahulu di Bab II; hapus Konvensi Wina 1969 atau beri justifikasi",
    helpText: "Masukan terbaru dari dosen pembimbing kampus",
    defaultValue: "",
    options: [],
    order: 28,
  },
  {
    key: "jadwal_bimbingan",
    label: "Jadwal Bimbingan Rutin",
    type: "text",
    required: false,
    placeholder: "Contoh: Setiap Rabu 13.00 WIB (via Zoom)",
    helpText: "Jadwal bimbingan reguler dengan dosen kampus",
    defaultValue: "",
    options: [],
    order: 29,
  },

  // ── BLOK 7: KENDALA AKTIF ─────────────────────────────────────────────────
  {
    key: "kendala_utama",
    label: "Kendala / Hambatan Utama Saat Ini",
    type: "textarea",
    required: false,
    placeholder: "Contoh: Bab II belum punya bagian Penelitian Terdahulu; data wawancara sudah ada tapi belum tahu cara menganalisis",
    helpText: "Apa yang paling bikin buntu atau sulit diselesaikan sekarang",
    defaultValue: "",
    options: [],
    order: 30,
  },
  {
    key: "bab_bermasalah",
    label: "Bab yang Paling Perlu Perhatian",
    type: "select",
    required: false,
    placeholder: "Pilih bab",
    helpText: "Bab yang saat ini paling membutuhkan diskusi atau bantuan",
    defaultValue: "",
    options: ["Bab I", "Bab II", "Bab III", "Bab IV", "Bab V", "Semua bab", "Persiapan sidang"],
    order: 31,
  },
  {
    key: "catatan_tambahan",
    label: "Catatan Tambahan",
    type: "textarea",
    required: false,
    placeholder: "Info lain yang penting untuk diketahui AI saat membantu",
    helpText: "Konteks tambahan yang perlu diingat AI dalam setiap diskusi",
    defaultValue: "",
    options: [],
    order: 32,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT INSTANCE — Skripsi Graciella (dari konteks default)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_INSTANCE_VALUES = {
  nama_mahasiswa: "Graciella Audrey Firmantoputri",
  nim: "202005000117",
  kampus: "Unika Atma Jaya Jakarta",
  program_studi: "S1 Ilmu Hukum — Hukum Perdata",
  judul_skripsi: "Tanggung Jawab Perusahaan Minuman Berpemanis dalam Kemasan (MBDK) terhadap Konsumen Ditinjau dari Perspektif Perbuatan Melawan Hukum (PMH) dan Strict Liability",
  fokus_hukum: "Hukum Perlindungan Konsumen",
  rumusan_masalah_1: "Bagaimana tanggung jawab hukum perusahaan MBDK terhadap konsumen yang mengalami kerugian berdasarkan Pasal 1365 KUHPerdata tentang Perbuatan Melawan Hukum?",
  rumusan_masalah_2: "Apakah konsep Strict Liability dapat diterapkan pada kasus tanggung jawab perusahaan MBDK dalam hukum perlindungan konsumen Indonesia?",
  rumusan_masalah_3: "Bagaimana upaya hukum yang dapat ditempuh konsumen yang mengalami kerugian akibat produk MBDK?",
  jenis_penelitian: "Yuridis Empiris Ringan (Campuran 70/30)",
  pendekatan_penelitian: "Pendekatan Perundang-undangan (Statute Approach), Pendekatan Konseptual (Conceptual Approach), Pendekatan Empiris / Lapangan",
  teori_utama: "Teori Perbuatan Melawan Hukum (PMH) — Pasal 1365 KUHPerdata; Doktrin Strict Liability; Teori Perlindungan Konsumen (UUPK No. 8 Tahun 1999); Regulasi MBDK",
  referensi_metodologi: "Purwaka (Metodologi Penelitian Hukum, 2011); Peter Mahmud Marzuki",
  ada_data_lapangan: "true",
  lokasi_penelitian: "Kelurahan Jatiasih, Kota Bekasi",
  jumlah_informan: "10",
  komposisi_informan: "6 Konsumen + 2 Pelaku Usaha + 2 Konsultan/Pakar",
  status_data_lapangan: "Selesai — data sudah diolah",
  fase_saat_ini: "Bab IV — Hasil & Analisis",
  status_bab1: "Final",
  status_bab2: "Sedang revisi",
  status_bab3: "Final",
  status_bab4: "Sedang dikerjakan",
  status_bab5: "Belum mulai",
  nama_dosen_pembimbing: "Dosen Pembimbing Kampus (belum tercatat)",
  catatan_dosen_terakhir: "RM sudah dipecah menjadi 3 — sudah benar. Bab III sudah direvisi — wawancara dipindah dari tersier ke data empiris. Yang belum: Penelitian Terdahulu di Bab II. Konvensi Wina 1969 perlu dihapus atau diberi justifikasi.",
  kendala_utama: "Belum ada bagian Penelitian Terdahulu di Bab II. Perlu justifikasi atau penghapusan Konvensi Wina 1969 di Bab III.",
  bab_bermasalah: "Bab II",
  catatan_tambahan: "Metode penelitian: 70% normatif + 30% empiris (campuran ringan). Mahasiswa aktif dalam fase penulisan Bab IV.",
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export async function patchLexSkripsiProjectBrain(): Promise<{ done: boolean; skipped: boolean }> {
  // Idempotency
  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases 
    WHERE name LIKE ${'%' + PATCH_MARKER + '%'}
    LIMIT 1
  `);
  if (existing.rows.length > 0) {
    log("[Patch LexSkripsi Project Brain] Sudah dijalankan, skip.");
    return { done: false, skipped: true };
  }

  log("[Patch LexSkripsi Project Brain] Membuat template Otak Skripsi...");

  // Insert template
  const tmplResult = await db.execute(sql`
    INSERT INTO project_brain_templates (agent_id, name, description, fields, is_active, created_at)
    VALUES (
      1362,
      'Otak Skripsi',
      'Profil lengkap mahasiswa dan skripsinya — konteks persisten untuk semua diskusi bimbingan. Isi sekali, AI akan ingat seterusnya.',
      ${JSON.stringify(OTAK_SKRIPSI_FIELDS)}::jsonb,
      true,
      NOW()
    )
    RETURNING id
  `);

  const templateId = (tmplResult.rows[0] as any)?.id;
  log(`[Patch LexSkripsi Project Brain] ✅ Template "Otak Skripsi" dibuat — ID ${templateId}`);

  // Insert default instance (Graciella)
  if (templateId) {
    await db.execute(sql`
      INSERT INTO project_brain_instances (agent_id, template_id, name, values, status, is_active, created_at, updated_at)
      VALUES (
        1362,
        ${templateId},
        'Skripsi Graciella — MBDK & Strict Liability',
        ${JSON.stringify(DEFAULT_INSTANCE_VALUES)}::jsonb,
        'active',
        true,
        NOW(),
        NOW()
      )
    `);
    log("[Patch LexSkripsi Project Brain] ✅ Instance default 'Skripsi Graciella' dibuat dan diaktifkan");
  }

  // Marker
  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. Template "Otak Skripsi" dibuat (ID: ${templateId}) dengan 32 field — 7 blok: Profil Mahasiswa, Skripsi, Metodologi, Data Lapangan, Progress per Bab, Dosen & Bimbingan, Kendala Aktif. Instance default "Skripsi Graciella" sudah diaktifkan.`,
    description: "Patch marker otomatis — jangan dihapus",
    processingStatus: "completed",
    status: "active",
  } as any);

  log("[Patch LexSkripsi Project Brain] SELESAI — Otak Skripsi siap digunakan");
  return { done: true, skipped: false };
}
