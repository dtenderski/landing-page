/**
 * patch-lexskripsi-mini-apps.ts
 * Buat 9 Mini Apps untuk LexSkripsi sesuai domain skripsi hukum:
 *
 * Orchestrator (1362):
 *   1. brief_intake    — Intake Mahasiswa Baru (10 pertanyaan onboarding)
 *   2. progress_tracker — Tracker Progress Bab I–V + Sidang
 *   3. mentoring_plan  — Rencana Bimbingan Terstruktur
 *
 * AGENT-METODE (1363):
 *   4. document_generator — Generator Outline Metodologi (Bab I & III)
 *
 * AGENT-SUBSTANSI (1364):
 *   5. rubric_scoring  — Review & Rubrik Bab (skor per dimensi akademik)
 *   6. gap_analysis    — Analisis Gap Penelitian Terdahulu vs Penelitian Ini
 *
 * AGENT-SIDANG (1376):
 *   7. checklist       — Checklist Kesiapan Sidang
 *   8. scoring_assessment — Skor Kesiapan Sidang (skala 0–100)
 *
 * AGENT-NOTION (1447):
 *   9. decision_summary — Ringkasan Diskusi → Simpan ke Notion
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-MINI-APPS-v1";

// ─────────────────────────────────────────────────────────────────────────────
// MINI APP DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const MINI_APPS = [
  // ── 1. ORCHESTRATOR — Brief/Intake Builder ──────────────────────────────────
  {
    agentId: 1362,
    name: "Intake Mahasiswa Baru",
    description: "10 pertanyaan onboarding untuk memahami konteks skripsi, topik, fase, dan kebutuhan mahasiswa. Output: brief eksekutif siap pakai untuk memulai bimbingan.",
    type: "brief_intake",
    icon: "ClipboardList",
    config: {
      questions: [
        "Nama kamu dan topik/judul skripsi yang sedang atau ingin dikerjakan?",
        "Program studi dan kampus kamu?",
        "Sudah sampai mana sekarang? (Proposal / Bab I / II / III / IV / V / Menjelang sidang)",
        "Metode penelitian apa yang digunakan? (Normatif / Empiris / Campuran)",
        "Apa rumusan masalah utama kamu? (boleh satu atau lebih)",
        "Teori atau doktrin hukum apa yang menjadi landasan utama?",
        "Apakah sudah ada data lapangan / wawancara? Kalau ada, sudah berapa?",
        "Apa bagian yang paling bikin buntu sekarang?",
        "Apakah sudah punya dosen pembimbing dari kampus? Masukan terbaru dari dosen?",
        "Apa target terdekat kamu — sidang kapan, atau bab mana yang ingin selesai bulan ini?",
      ],
      outputTemplate: "BRIEF EKSEKUTIF MAHASISWA SKRIPSI",
      outputSections: [
        "Profil Mahasiswa & Topik",
        "Fase & Progress Saat Ini",
        "Metodologi & Rumusan Masalah",
        "Kendala Utama",
        "Target & Langkah Prioritas",
      ],
    },
  },

  // ── 2. ORCHESTRATOR — Progress Tracker ─────────────────────────────────────
  {
    agentId: 1362,
    name: "Tracker Progress Skripsi",
    description: "Pantau kemajuan penulisan Bab I–V dan persiapan sidang. Lacak status tiap bab: Belum mulai / Draft / Revisi / Final. AI bantu identifikasi bottleneck.",
    type: "progress_tracker",
    icon: "TrendingUp",
    config: {
      milestones: [
        { id: "proposal", label: "Proposal / BAB I", target: 100 },
        { id: "bab2", label: "BAB II — Tinjauan Pustaka", target: 100 },
        { id: "bab3", label: "BAB III — Metode Penelitian", target: 100 },
        { id: "bab4", label: "BAB IV — Hasil & Analisis", target: 100 },
        { id: "bab5", label: "BAB V — Kesimpulan & Saran", target: 100 },
        { id: "sidang", label: "Persiapan Sidang", target: 100 },
      ],
      statusOptions: [
        "Belum mulai",
        "Sedang dikerjakan",
        "Draft selesai",
        "Sedang revisi",
        "Final",
      ],
      ai_prompt: "Berdasarkan progress skripsi berikut, identifikasi: (1) bab mana yang paling tertinggal, (2) risiko tidak selesai tepat waktu, (3) rekomendasi urutan prioritas pengerjaan minggu ini.",
    },
  },

  // ── 3. ORCHESTRATOR — Mentoring Plan ───────────────────────────────────────
  {
    agentId: 1362,
    name: "Rencana Bimbingan Terstruktur",
    description: "Generator rencana bimbingan personal berdasarkan fase dan target sidang. Output: jadwal mingguan, milestone per bab, dan checkpoint review.",
    type: "mentoring_plan",
    icon: "GraduationCap",
    config: {
      phases: [
        {
          id: "proposal",
          label: "Fase Proposal",
          activities: ["Finalkan judul & RM", "Susun Bab I", "Review metodologi awal"],
        },
        {
          id: "penulisan",
          label: "Fase Penulisan (Bab II–IV)",
          activities: ["Bangun kerangka teori Bab II", "Susun Bab III metodologi", "Kumpul & analisis data Bab IV"],
        },
        {
          id: "finalisasi",
          label: "Fase Finalisasi",
          activities: ["Tulis Bab V kesimpulan", "Cek konsistensi antar bab", "Format & daftar pustaka"],
        },
        {
          id: "pra_sidang",
          label: "Fase Pra-Sidang",
          activities: ["Simulasi penguji 3x", "Audit dokumen administrasi", "Coaching argumen defensif"],
        },
      ],
      weeklyCheckpoints: [
        "Apa yang berhasil diselesaikan minggu ini?",
        "Apa yang masih pending dan kenapa?",
        "Apa satu hal yang paling perlu didiskusikan minggu depan?",
      ],
      ai_prompt: "Buat rencana bimbingan terstruktur untuk mahasiswa ini. Sesuaikan jadwal berdasarkan fase saat ini dan target sidang. Berikan milestone yang realistis dan checkpoint mingguan yang spesifik.",
    },
  },

  // ── 4. AGENT-METODE — Document Generator Outline Metodologi ────────────────
  {
    agentId: 1363,
    name: "Generator Outline Metodologi",
    description: "Generate kerangka Bab I (Pendahuluan) dan Bab III (Metode Penelitian) berdasarkan topik dan pendekatan yang dipilih. Output siap ditulis.",
    type: "document_generator",
    icon: "FileOutput",
    config: {
      templates: [
        {
          id: "bab1_outline",
          name: "Kerangka Bab I — Pendahuluan",
          sections: [
            "A. Latar Belakang Masalah",
            "B. Rumusan Masalah",
            "C. Tujuan Penelitian",
            "D. Manfaat Penelitian",
            "E. Keaslian Penelitian (Penelitian Terdahulu)",
            "F. Sistematika Penulisan",
          ],
          ai_prompt: "Berdasarkan topik dan rumusan masalah berikut, generate kerangka Bab I yang lengkap dengan poin-poin utama untuk setiap subbab. Gunakan pendekatan yang sesuai dengan metode penelitian hukum Purwaka.",
        },
        {
          id: "bab3_outline",
          name: "Kerangka Bab III — Metode Penelitian",
          sections: [
            "A. Jenis Penelitian",
            "B. Pendekatan Penelitian",
            "C. Sumber Bahan Hukum (Primer / Sekunder / Tersier)",
            "D. Teknik Pengumpulan Bahan Hukum",
            "E. Teknik Analisis Bahan Hukum",
            "F. Tahapan Penelitian",
          ],
          ai_prompt: "Berdasarkan jenis penelitian (normatif/empiris/campuran) dan topik berikut, generate kerangka Bab III yang sesuai dengan metodologi Purwaka. Sertakan justifikasi pemilihan metode.",
        },
      ],
      inputs: [
        { id: "topik", label: "Topik/Judul Skripsi", type: "text" },
        { id: "rumusan_masalah", label: "Rumusan Masalah", type: "textarea" },
        { id: "jenis_penelitian", label: "Jenis Penelitian", type: "select", options: ["Yuridis Normatif", "Yuridis Empiris", "Yuridis Empiris Ringan (Campuran)"] },
        { id: "template", label: "Pilih Outline", type: "select", options: ["Kerangka Bab I — Pendahuluan", "Kerangka Bab III — Metode Penelitian"] },
      ],
    },
  },

  // ── 5. AGENT-SUBSTANSI — Rubric Scoring ────────────────────────────────────
  {
    agentId: 1364,
    name: "Review & Rubrik Bab",
    description: "Review draft bab skripsi dengan rubrik terstruktur. Skor 0–3 per 6 dimensi: ketajaman argumen, ketepatan doktrin, konsistensi logika, penggunaan sumber, kesesuaian metodologi, dan kualitas penulisan.",
    type: "rubric_scoring",
    icon: "BookOpen",
    config: {
      dimensions: [
        {
          id: "ketajaman_argumen",
          label: "Ketajaman Argumen Hukum",
          description: "Seberapa kuat dan tajam argumen hukum yang dibangun — apakah ada hubungan kausal yang jelas antara premis dan kesimpulan?",
          rubric: [
            { score: 0, descriptor: "Tidak ada argumen yang jelas — pernyataan tanpa justifikasi hukum" },
            { score: 1, descriptor: "Argumen ada tapi lemah — tidak didukung pasal/doktrin yang tepat" },
            { score: 2, descriptor: "Argumen cukup kuat — ada pasal/doktrin yang relevan tapi belum terintegrasi" },
            { score: 3, descriptor: "Argumen sangat kuat — pasal + doktrin + fakta terintegrasi, siap dipublikasikan" },
          ],
        },
        {
          id: "ketepatan_doktrin",
          label: "Ketepatan Doktrin & Referensi",
          description: "Apakah doktrin, pasal, dan referensi yang digunakan tepat, relevan, dan dikutip dengan benar?",
          rubric: [
            { score: 0, descriptor: "Doktrin salah atau tidak ada — pasal dikutip tanpa konteks" },
            { score: 1, descriptor: "Doktrin relevan tapi kurang tepat — kutipan ada celah" },
            { score: 2, descriptor: "Doktrin tepat — kutipan benar, namun belum dielaborasi" },
            { score: 3, descriptor: "Doktrin sangat tepat — elaborasi mendalam, menunjukkan penguasaan literatur" },
          ],
        },
        {
          id: "konsistensi_logika",
          label: "Konsistensi Logika Antar Bab",
          description: "Apakah Bab ini konsisten dengan Bab sebelumnya? Tidak ada kontradiksi antara rumusan masalah, teori, dan analisis?",
          rubric: [
            { score: 0, descriptor: "Ada kontradiksi nyata — tidak ada benang merah antar bab" },
            { score: 1, descriptor: "Sebagian konsisten tapi ada celah logika yang terlihat" },
            { score: 2, descriptor: "Cukup konsisten — benang merah ada tapi belum eksplisit" },
            { score: 3, descriptor: "Sangat konsisten — RM, teori, analisis, dan kesimpulan saling memperkuat" },
          ],
        },
        {
          id: "kualitas_sumber",
          label: "Kualitas & Keragaman Sumber",
          description: "Apakah sumber yang digunakan kredibel, beragam, dan relevan? Apakah ada sumber primer (UU, putusan) yang dimanfaatkan?",
          rubric: [
            { score: 0, descriptor: "Sumber tidak memadai — hanya website atau referensi tidak kredibel" },
            { score: 1, descriptor: "Sumber ada tapi terbatas — kurang sumber primer" },
            { score: 2, descriptor: "Sumber memadai — ada sumber primer + sekunder tapi bisa lebih beragam" },
            { score: 3, descriptor: "Sumber sangat kuat — sumber primer (UU/putusan) + jurnal + buku + mix" },
          ],
        },
        {
          id: "kesesuaian_metodologi",
          label: "Kesesuaian dengan Metodologi",
          description: "Apakah cara analisis dalam Bab ini sesuai dengan metode yang dipilih di Bab III? (normatif/empiris/campuran)",
          rubric: [
            { score: 0, descriptor: "Tidak sesuai — metode yang digunakan berbeda dari yang dideklarasikan" },
            { score: 1, descriptor: "Sebagian sesuai — ada inkonsistensi yang signifikan" },
            { score: 2, descriptor: "Sebagian besar sesuai — minor inkonsistensi yang bisa diperbaiki" },
            { score: 3, descriptor: "Sangat sesuai — analisis mencerminkan metode yang dideklarasikan secara konsisten" },
          ],
        },
        {
          id: "kualitas_penulisan",
          label: "Kualitas Penulisan Akademik",
          description: "Apakah penulisan menggunakan bahasa ilmiah yang tepat, paragraf yang kohesif, dan gaya penulisan yang sesuai standar akademik?",
          rubric: [
            { score: 0, descriptor: "Penulisan tidak akademik — banyak kalimat tidak efektif, typo, tidak kohesif" },
            { score: 1, descriptor: "Penulisan cukup tapi banyak yang perlu diperbaiki" },
            { score: 2, descriptor: "Penulisan baik — sebagian besar sudah akademik tapi ada beberapa kelemahan" },
            { score: 3, descriptor: "Penulisan sangat baik — standar jurnal, kohesif, efektif, dan ilmiah" },
          ],
        },
      ],
      maxScore: 18,
      thresholds: {
        siap_submit: 15,
        perlu_revisi_minor: 10,
        perlu_revisi_mayor: 6,
      },
      ai_prompt: "Review draft bab berikut menggunakan rubrik akademik skripsi hukum. Beri skor 0–3 untuk setiap dimensi, jelaskan alasan spesifik, identifikasi poin yang paling perlu diperbaiki, dan berikan rekomendasi konkret. Gunakan perspektif dosen yang review skripsi untuk publikasi jurnal.",
    },
  },

  // ── 6. AGENT-SUBSTANSI — Gap Analysis ──────────────────────────────────────
  {
    agentId: 1364,
    name: "Analisis Gap Penelitian Terdahulu",
    description: "Identifikasi gap antara penelitian terdahulu dengan penelitian yang sedang dikerjakan. Output: tabel pembanding + novelty statement untuk Bab I dan Bab II.",
    type: "gap_analysis",
    icon: "GitCompare",
    config: {
      comparisonDimensions: [
        "Topik / fokus penelitian",
        "Rumusan masalah",
        "Metode penelitian",
        "Objek penelitian / lokasi",
        "Teori yang digunakan",
        "Hasil / kesimpulan utama",
        "Gap yang belum dijawab",
      ],
      noveltyStatement: {
        template: "Berbeda dari penelitian-penelitian sebelumnya yang [ringkasan penelitian terdahulu], penelitian ini berfokus pada [fokus unik penelitian ini] dengan menggunakan [metode yang digunakan], yang secara khusus menganalisis [aspek yang belum diteliti].",
        ai_prompt: "Berdasarkan penelitian terdahulu yang diberikan dan penelitian yang sedang dikerjakan, buat: (1) tabel perbandingan sistematis per dimensi, (2) identifikasi gap yang jelas dan spesifik, (3) draft novelty statement yang kuat dan akademik, (4) saran cara memperkuat justifikasi keaslian penelitian di Bab I.",
      },
    },
  },

  // ── 7. AGENT-SIDANG — Checklist Kesiapan Sidang ────────────────────────────
  {
    agentId: 1376,
    name: "Checklist Kesiapan Sidang",
    description: "Checklist komprehensif untuk persiapan sidang skripsi: dokumen administrasi, kesiapan materi, kemampuan defensi, dan mental coaching.",
    type: "checklist",
    icon: "CheckSquare",
    config: {
      categories: [
        {
          id: "dokumen_admin",
          label: "📋 Dokumen Administrasi",
          items: [
            "Naskah skripsi final sudah dijilid dan distempel kampus",
            "Lembar persetujuan dosen pembimbing sudah ditandatangani",
            "Surat pendaftaran sidang sudah diserahkan ke bagian akademik",
            "Bebas perpustakaan dan keuangan sudah dikonfirmasi",
            "Abstrak (Indonesia + Inggris) sudah final",
            "Daftar pustaka format sudah diperiksa ulang",
            "Fotokopi KTM dan transkrip sudah disiapkan",
          ],
        },
        {
          id: "kesiapan_materi",
          label: "📚 Kesiapan Materi Skripsi",
          items: [
            "Mampu jelaskan latar belakang dalam 2 menit tanpa membaca",
            "Hafal 3 rumusan masalah dan jawaban singkatnya",
            "Bisa sebutkan 5 sumber primer utama yang digunakan",
            "Paham perbedaan metode penelitian yang dipilih vs alternatifnya",
            "Mampu jelaskan teori utama dan mengapa relevan untuk topik ini",
            "Bisa jelaskan temuan utama Bab IV dalam 3 poin",
            "Siap jelaskan mengapa kesimpulan Bab V menjawab RM",
          ],
        },
        {
          id: "kemampuan_defensi",
          label: "🎤 Kemampuan Defensi",
          items: [
            "Sudah latihan simulasi sidang minimal 3x",
            "Sudah siapkan jawaban untuk 10 pertanyaan penguji yang paling sering",
            "Bisa handle pertanyaan tentang kelemahan metodologi",
            "Tahu cara menjawab jika penguji tidak setuju dengan kesimpulan",
            "Sudah latihan presentasi PowerPoint (maks 15 menit)",
            "Bisa jelaskan relevansi penelitian untuk praktik hukum nyata",
          ],
        },
        {
          id: "mental_coaching",
          label: "🧠 Mental & Persiapan Hari H",
          items: [
            "Tidur cukup 2 malam sebelum sidang",
            "Sudah tahu ruangan sidang dan jam mulai",
            "Pakaian rapi dan sesuai standar kampus sudah disiapkan",
            "Sarapan sebelum sidang sudah direncanakan",
            "Ada support system (keluarga/teman) yang mengantar atau menunggu",
            "Mental sudah siap — ingat: penguji ingin kamu LULUS",
          ],
        },
      ],
      ai_prompt: "Berdasarkan checklist kesiapan sidang berikut, identifikasi: (1) item mana yang belum selesai dan paling krusial, (2) estimasi waktu yang dibutuhkan untuk menyelesaikan tiap item, (3) urutan prioritas untuk 3 hari terakhir sebelum sidang.",
    },
  },

  // ── 8. AGENT-SIDANG — Scoring Assessment Kesiapan Sidang ───────────────────
  {
    agentId: 1376,
    name: "Skor Kesiapan Sidang",
    description: "Penilaian kesiapan sidang berbasis skor 0–100. Empat dimensi: penguasaan materi, kemampuan defensi, kesiapan dokumen, dan kesiapan mental. AI berikan rekomendasi akhir.",
    type: "scoring_assessment",
    icon: "Target",
    config: {
      dimensions: [
        {
          id: "penguasaan_materi",
          label: "Penguasaan Materi Skripsi",
          weight: 35,
          questions: [
            "Bisa jelaskan RM dan jawaban singkatnya tanpa membaca?",
            "Hafal teori utama dan kaitannya dengan topik?",
            "Paham setiap halaman naskah (tidak ada yang 'asal tulis')?",
            "Bisa jelaskan metodologi dan kenapa pilih metode itu?",
            "Siap jawab pertanyaan tentang sumber dan validitasnya?",
          ],
          scale: { min: 1, max: 5, labels: ["Belum sama sekali", "Sedikit", "Cukup", "Baik", "Sangat siap"] },
        },
        {
          id: "kemampuan_defensi",
          label: "Kemampuan Defensi Argumen",
          weight: 35,
          questions: [
            "Sudah latihan simulasi sidang berapa kali?",
            "Bisa counter argumen jika penguji tidak setuju kesimpulan?",
            "Tahu cara menjawab jika ada pertanyaan yang tidak diketahui?",
            "Bisa handle tekanan atau pertanyaan beruntun dari penguji?",
          ],
          scale: { min: 1, max: 5, labels: ["0 kali / Tidak siap", "1–2 kali / Kurang", "3 kali / Cukup", "4–5 kali / Baik", "5+ kali / Sangat siap"] },
        },
        {
          id: "kesiapan_dokumen",
          label: "Kelengkapan Dokumen",
          weight: 20,
          questions: [
            "Naskah final sudah dijilid dan distempel?",
            "Semua tanda tangan dosen pembimbing sudah ada?",
            "Surat pendaftaran sidang sudah diterima kampus?",
            "Bebas perpustakaan & keuangan sudah beres?",
          ],
          scale: { min: 1, max: 5, labels: ["Belum ada", "25% selesai", "50% selesai", "75% selesai", "100% selesai"] },
        },
        {
          id: "kesiapan_mental",
          label: "Kesiapan Mental & Percaya Diri",
          weight: 10,
          questions: [
            "Seberapa yakin kamu bisa lulus sidang ini?",
            "Sudah ada support system yang mendukung?",
            "Kondisi fisik dan istirahat cukup?",
          ],
          scale: { min: 1, max: 5, labels: ["Sangat tidak yakin", "Kurang yakin", "Cukup yakin", "Yakin", "Sangat yakin"] },
        },
      ],
      interpretation: {
        excellent: { min: 85, label: "SIAP SIDANG — Go! 🎓", color: "green" },
        good: { min: 70, label: "HAMPIR SIAP — 1–2 hal yang perlu diperkuat", color: "blue" },
        fair: { min: 55, label: "PERLU PERSIAPAN TAMBAHAN — fokus pada area lemah", color: "yellow" },
        poor: { min: 0, label: "BELUM SIAP — tunda jika memungkinkan, atau sprint intensif", color: "red" },
      },
      ai_prompt: "Berdasarkan skor kesiapan sidang berikut, berikan: (1) evaluasi per dimensi secara jujur, (2) 3 prioritas utama yang harus dikerjakan sebelum sidang, (3) estimasi apakah mahasiswa siap dengan jadwal sidang saat ini, (4) satu kalimat motivasi yang realistis (bukan pujian kosong).",
    },
  },

  // ── 9. AGENT-NOTION — Decision Summary ─────────────────────────────────────
  {
    agentId: 1447,
    name: "Ringkasan Diskusi → Notion",
    description: "Buat ringkasan keputusan dari diskusi bimbingan lalu simpan otomatis ke workspace Notion mahasiswa. Cocok digunakan di akhir setiap sesi LexSkripsi.",
    type: "decision_summary",
    icon: "ClipboardList",
    config: {
      summaryTemplate: {
        sections: [
          {
            id: "konteks_sesi",
            label: "Konteks Sesi",
            fields: ["Tanggal", "Topik diskusi", "Bab yang dibahas", "Fase saat ini"],
          },
          {
            id: "keputusan_utama",
            label: "Keputusan & Kesimpulan Utama",
            fields: ["Keputusan 1", "Keputusan 2", "Keputusan 3"],
          },
          {
            id: "tindak_lanjut",
            label: "Action Items",
            fields: ["Action item + PIC + deadline"],
          },
          {
            id: "catatan_penting",
            label: "Catatan Penting / Peringatan",
            fields: ["Hal yang perlu diverifikasi ke dosen kampus", "Asumsi yang digunakan", "Referensi tambahan yang disarankan"],
          },
          {
            id: "sesi_berikutnya",
            label: "Agenda Sesi Berikutnya",
            fields: ["Target minggu depan", "Dokumen yang perlu disiapkan"],
          },
        ],
      },
      notion: {
        pageTitle: "📝 Catatan Bimbingan LexSkripsi — {tanggal}",
        databaseName: "Tracker Bimbingan Skripsi",
        properties: [
          { name: "Tanggal", type: "date" },
          { name: "Topik", type: "title" },
          { name: "Bab", type: "select", options: ["Proposal", "Bab I", "Bab II", "Bab III", "Bab IV", "Bab V", "Pra-Sidang"] },
          { name: "Status", type: "select", options: ["Selesai", "Ada PR", "Perlu follow-up"] },
        ],
      },
      ai_prompt: "Buat ringkasan bimbingan yang rapi dan terstruktur berdasarkan diskusi yang terjadi. Format: tanggal, topik, keputusan utama (list), action items (who + what + when), catatan penting, dan agenda sesi berikutnya. Bahasa: profesional tapi santai, sesuai gaya bimbingan informal. Siap untuk disimpan ke Notion.",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PATCH RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export async function patchLexSkripsiMiniApps(): Promise<{ done: boolean; skipped: boolean; created: number }> {
  // Idempotency check
  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases 
    WHERE name LIKE ${'%' + PATCH_MARKER + '%'}
    LIMIT 1
  `);
  if (existing.rows.length > 0) {
    log("[Patch LexSkripsi Mini Apps] Sudah dijalankan, skip.");
    return { done: false, skipped: true, created: 0 };
  }

  log("[Patch LexSkripsi Mini Apps] Membuat 9 mini apps untuk LexSkripsi...");

  let created = 0;
  for (const app of MINI_APPS) {
    try {
      await db.execute(sql`
        INSERT INTO mini_apps (agent_id, name, description, type, config, icon, is_active, created_at)
        VALUES (
          ${app.agentId},
          ${app.name},
          ${app.description},
          ${app.type},
          ${JSON.stringify(app.config)}::jsonb,
          ${app.icon},
          true,
          NOW()
        )
      `);
      log(`[Patch LexSkripsi Mini Apps] ✅ ${app.type} | ${app.name} → agent ${app.agentId}`);
      created++;
    } catch (err) {
      log(`[Patch LexSkripsi Mini Apps] ⚠️ Gagal buat ${app.name}: ${(err as Error).message}`);
    }
  }

  // Marker
  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. ${created}/9 mini apps berhasil dibuat untuk LexSkripsi. Types: brief_intake, progress_tracker, mentoring_plan, document_generator, rubric_scoring, gap_analysis, checklist, scoring_assessment, decision_summary.`,
    description: "Patch marker otomatis — jangan dihapus",
    processingStatus: "completed",
    status: "active",
  } as any);

  log(`[Patch LexSkripsi Mini Apps] SELESAI — ${created}/9 mini apps dibuat`);
  return { done: true, skipped: false, created };
}
