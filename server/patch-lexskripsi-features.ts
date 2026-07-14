/**
 * patch-lexskripsi-features.ts
 * Konfigurasi 4 fitur sekaligus untuk LexSkripsi:
 *
 * 1. DELIVERABLES — pilih output yang relevan per agent
 * 2. CONVERSION / LEAD CAPTURE — tangkap profil mahasiswa baru
 * 3. SCORING — ukur kesiapan skripsi & sidang otomatis
 * 4. LANDING PAGE — set hero, pain points, benefits untuk halaman publik
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-FEATURES-v1";

// ─────────────────────────────────────────────────────────────────────────────
// 1. DELIVERABLES — per agent
// ─────────────────────────────────────────────────────────────────────────────

const DELIVERABLES_CONFIG: Record<number, { deliverables: string[]; bundle: string }> = {
  // Orchestrator — semua jenis output relevan untuk pembimbing utama
  1362: {
    deliverables: [
      "ringkasan_jawaban",  // ringkasan diskusi bimbingan
      "rencana_aksi",       // rencana penulisan bab & action items
      "checklist",          // checklist bab atau sidang
      "feedback_rubrik",    // feedback draft dengan rubrik akademik
      "notulen_sesi",       // notulen bimbingan untuk arsip
      "dokumen_draft",      // draft outline bab, abstrak, daftar pustaka
      "latihan_kuis",       // soal latihan sidang beserta pembahasan
    ],
    bundle: "mentor",
  },
  // AGENT-METODE — output metodologi & outline
  1363: {
    deliverables: [
      "ringkasan_jawaban",
      "checklist",
      "dokumen_draft",      // kerangka Bab I & III siap tulis
      "rencana_aksi",
    ],
    bundle: "",
  },
  // AGENT-SUBSTANSI — feedback & review substansi hukum
  1364: {
    deliverables: [
      "ringkasan_jawaban",
      "feedback_rubrik",    // rubrik review bab substansi
      "dokumen_draft",      // ringkasan doktrin, tabel pasal, dll
      "rencana_aksi",
    ],
    bundle: "",
  },
  // AGENT-LAPANGAN — output data & analisis empiris
  1365: {
    deliverables: [
      "ringkasan_jawaban",
      "checklist",          // checklist kelengkapan data lapangan
      "notulen_sesi",       // ringkasan hasil wawancara
      "rencana_aksi",
    ],
    bundle: "",
  },
  // AGENT-SIDANG — latihan & kesiapan sidang
  1376: {
    deliverables: [
      "latihan_kuis",       // soal simulasi sidang + pembahasan
      "checklist",          // checklist kesiapan sidang
      "feedback_rubrik",    // feedback penampilan & kemampuan defensi
      "rencana_aksi",       // rencana sprint terakhir sebelum sidang
    ],
    bundle: "mentor",
  },
  // AGENT-NOTION — output arsip & catatan
  1447: {
    deliverables: [
      "notulen_sesi",       // notulen → simpan ke Notion
      "ringkasan_jawaban",
      "ekspor_data",        // ekspor data dari Otak Skripsi
    ],
    bundle: "",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONVERSION & LEAD CAPTURE — hanya di orchestrator (1362)
// ─────────────────────────────────────────────────────────────────────────────

const CONVERSION_CONFIG = {
  conversion_enabled: true,
  conversion_goal: "assessment",           // goal: penilaian kesiapan skripsi
  cta_trigger_after_messages: 4,           // muncul setelah 4 pesan
  cta_trigger_on_score: 50,               // atau jika skor rendah (<50)
  whatsapp_cta: "",                        // bisa diisi link WA kalau ada
  conversion_cta: {
    title: "Lengkapi Profil Skripsimu",
    description: "Isi Otak Skripsi sekarang agar AI bisa mengenalmu lebih baik di setiap sesi — tanpa perlu cerita ulang dari awal.",
    buttonText: "Isi Profil Skripsi",
    buttonUrl: "",
    style: "card",
  },
  lead_capture_fields: [
    {
      id: "lc-nama",
      label: "Nama Lengkap",
      type: "text",
      required: true,
      placeholder: "Nama lengkap kamu",
    },
    {
      id: "lc-email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "email@kampus.ac.id",
    },
    {
      id: "lc-kampus",
      label: "Kampus",
      type: "text",
      required: true,
      placeholder: "Nama universitas/kampus",
    },
    {
      id: "lc-topik",
      label: "Topik Skripsi (singkat)",
      type: "text",
      required: false,
      placeholder: "Contoh: Tanggung jawab hukum perusahaan MBDK",
    },
    {
      id: "lc-fase",
      label: "Fase Skripsi Saat Ini",
      type: "select",
      required: false,
      placeholder: "Pilih fase",
      options: ["Proposal", "Bab I", "Bab II", "Bab III", "Bab IV", "Bab V", "Pra-Sidang"],
    },
  ],
  conversion_offers: [
    {
      id: "offer-bimbingan",
      title: "Sesi Bimbingan Intensif",
      description: "1 jam diskusi mendalam dengan LexSkripsi untuk membahas bab paling kritis — metodologi, substansi, atau persiapan sidang.",
      price: "Gratis",
      features: [
        "Review draft bab dengan rubrik akademik",
        "Simulasi 10 pertanyaan penguji",
        "Rencana aksi konkret untuk minggu berikutnya",
        "Output: notulen + checklist siap pakai",
      ],
      ctaText: "Mulai Sesi Bimbingan",
      ctaUrl: "",
      isPopular: true,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCORING — kesiapan skripsi & sidang
// ─────────────────────────────────────────────────────────────────────────────

const SCORING_CONFIG = {
  scoring_enabled: true,
  scoring_rubric: [
    {
      id: "sc-rm",
      category: "Kejelasan Rumusan Masalah",
      maxScore: 20,
      weight: 20,
      description: "Seberapa tajam dan spesifik rumusan masalah — apakah menjawab masalah hukum yang nyata dan terbatas scopenya?",
    },
    {
      id: "sc-metode",
      category: "Kekuatan Metodologi",
      maxScore: 20,
      weight: 20,
      description: "Apakah jenis penelitian, pendekatan, dan sumber bahan hukum sudah tepat dan konsisten satu sama lain?",
    },
    {
      id: "sc-substansi",
      category: "Kedalaman Substansi Hukum",
      maxScore: 25,
      weight: 25,
      description: "Seberapa kuat landasan teori, doktrin, dan analisis normatif yang dibangun di Bab II dan IV?",
    },
    {
      id: "sc-data",
      category: "Kesiapan Data & Analisis",
      maxScore: 20,
      weight: 20,
      description: "Apakah data (normatif atau empiris) sudah terkumpul, diolah, dan dianalisis dengan cara yang sesuai metode?",
    },
    {
      id: "sc-sidang",
      category: "Kesiapan Defensi Sidang",
      maxScore: 15,
      weight: 15,
      description: "Seberapa siap mahasiswa menjawab pertanyaan penguji — menguasai materi, bisa counter argument, sudah latihan simulasi?",
    },
  ],
  scoring_thresholds: {
    low: 40,
    medium: 65,
    high: 80,
    lowLabel: "Perlu Perhatian Segera",
    mediumLabel: "Sedang Berkembang",
    highLabel: "Siap Dipertahankan",
    lowRecommendation: "Ada area fundamental yang perlu diperkuat dulu sebelum lanjut ke bab berikutnya. Mari identifikasi prioritasnya bersama.",
    mediumRecommendation: "Progress sudah bagus! Ada beberapa area yang bisa diperkuat — terutama di metodologi dan substansi. Kita fokus ke sana.",
    highRecommendation: "Skripsi ini sudah dalam kondisi sangat baik. Mari kita pastikan tidak ada celah yang terlewat sebelum sidang.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. LANDING PAGE — halaman publik LexSkripsi
// ─────────────────────────────────────────────────────────────────────────────

const LANDING_PAGE_CONFIG = {
  landing_page_enabled: true,
  landing_hero_headline: "Sparring Partner Skripsi Hukummu yang Selalu Siap",
  landing_hero_subheadline: "LexSkripsi hadir sebagai teman diskusi informal untuk mahasiswa S1 Hukum — membantu dari proposal hingga sidang, kapan saja, tanpa takut dihakimi.",
  landing_hero_cta_text: "Mulai Diskusi Sekarang",
  landing_pain_points: [
    "Bingung memilih metode penelitian yang tepat — normatif, empiris, atau campuran?",
    "Argumen hukum terasa lemah tapi tidak tahu cara memperkuatnya",
    "Data lapangan sudah ada tapi tidak tahu cara menganalisisnya",
    "Takut menghadapi pertanyaan penguji yang kritis saat sidang",
    "Dosen pembimbing sulit ditemui dan tidak bisa konsultasi setiap saat",
  ],
  landing_solution_text: "LexSkripsi adalah AI Sparring Partner Skripsi Hukum yang telah mempublikasikan artikel di jurnal nasional terakreditasi dan internasional bereputasi — terbiasa membimbing dari berbagai topik hukum. Obrolannya enak, tapi substansinya tajam.",
  landing_benefits: [
    {
      title: "5 Spesialis dalam 1 Platform",
      description: "AGENT-METODE, AGENT-SUBSTANSI, AGENT-LAPANGAN, AGENT-SIDANG, dan AGENT-NOTION bekerja paralel untuk menjawab pertanyaanmu dari semua sudut sekaligus.",
    },
    {
      title: "Konteks Tersimpan, Tidak Perlu Cerita Ulang",
      description: "Otak Skripsi menyimpan semua profil, metodologi, dan progress skripsimu — AI langsung tahu siapa kamu dan sedang di mana tanpa perlu diperkenalkan lagi.",
    },
    {
      title: "Output Nyata yang Bisa Langsung Dipakai",
      description: "Setiap sesi menghasilkan deliverable konkret — outline bab siap tulis, checklist sidang, notulen diskusi, atau soal latihan dari penguji yang paling sering keluar.",
    },
    {
      title: "Sinkron dengan Notion",
      description: "AGENT-NOTION menyimpan catatan bimbingan, keputusan, dan action items langsung ke workspace Notionmu — sehingga semua terdokumentasi rapi.",
    },
    {
      title: "Jawaban Berbasis Referensi, Bukan Tebak-tebakan",
      description: "Setiap analisis didukung pasal yang tepat, doktrin yang relevan, dan metodologi Purwaka — bukan sekedar pendapat umum.",
    },
  ],
  landing_testimonials: [
    {
      name: "Mahasiswa S1 Hukum",
      company: "Unika Atma Jaya Jakarta",
      text: "Baru pertama kali ada AI yang benar-benar paham metodologi Purwaka dan bisa bedain kapan harus pakai Pasal 1365 vs strict liability. Diskusi dengan LexSkripsi itu kayak ketemu dosen yang tulisannya banyak dikutip tapi ngobrolnya enak.",
      rating: 5,
    },
    {
      name: "Mahasiswa Pra-Sidang",
      company: "Universitas Indonesia",
      text: "Simulasi sidang sama AGENT-SIDANG itu keras tapi realistis. Pertanyaan yang keluar waktu sidang beneran persis yang kita latih. Lulus dengan revisi minor.",
      rating: 5,
    },
  ],
  landing_faq: [
    {
      question: "Apakah LexSkripsi bisa menggantikan dosen pembimbing dari kampus?",
      answer: "Tidak, dan memang tidak dimaksudkan demikian. LexSkripsi adalah pendamping informal — teman diskusi yang siap kapan saja. Dosen pembimbing kampus tetap menjadi otoritas resmi untuk persetujuan dan nilai. LexSkripsi hadir untuk mengisi waktu di antara sesi bimbingan resmi.",
    },
    {
      question: "Apa yang membedakan LexSkripsi dari chatbot AI biasa?",
      answer: "LexSkripsi punya 5 sub-agent spesialis yang bekerja paralel: metodologi, substansi hukum, data lapangan, persiapan sidang, dan manajemen dokumen Notion. Ditambah Otak Skripsi yang menyimpan konteks persistenmu sehingga AI selalu tahu siapa kamu tanpa perlu cerita ulang.",
    },
    {
      question: "Apakah LexSkripsi bisa membantu semua bidang hukum?",
      answer: "LexSkripsi paling kuat untuk skripsi hukum perdata, perlindungan konsumen, dan hukum bisnis. Untuk topik lain seperti hukum pidana, tata negara, atau internasional, LexSkripsi tetap bisa membantu di aspek metodologi penelitian hukum secara umum.",
    },
    {
      question: "Bagaimana dengan privasi data skripsi saya?",
      answer: "Semua data yang kamu masukkan ke Otak Skripsi tersimpan secara pribadi di akunmu dan tidak dibagikan ke siapapun. Diskusi di chat juga bersifat privat.",
    },
  ],
  landing_authority: "LexSkripsi didukung oleh sistem multi-agent paralel yang sama yang digunakan oleh 131 Federation Hub dalam ekosistem Gustafta — platform AI chatbot builder terdepan untuk domain profesional Indonesia.",
  landing_guarantees: [
    "Tidak ada pertanyaan yang terlalu dasar atau terlalu 'bodoh' untuk ditanyakan",
    "Selalu ada jawaban substantif — bukan hanya validasi kosong",
    "Transparansi penuh: jika ada yang di luar domain, akan langsung diarahkan ke resource yang tepat",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export async function patchLexSkripsiFeatures(): Promise<{ done: boolean; skipped: boolean }> {
  // Idempotency
  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases 
    WHERE name LIKE ${'%' + PATCH_MARKER + '%'}
    LIMIT 1
  `);
  if (existing.rows.length > 0) {
    log("[Patch LexSkripsi Features] Sudah dijalankan, skip.");
    return { done: false, skipped: true };
  }

  log("[Patch LexSkripsi Features] Mengkonfigurasi Deliverables, Conversion, Scoring, Landing Page...");

  // ── 1. DELIVERABLES per agent ────────────────────────────────────────────
  for (const [agentId, config] of Object.entries(DELIVERABLES_CONFIG)) {
    await db.execute(sql`
      UPDATE agents 
      SET 
        deliverables = ${JSON.stringify(config.deliverables)}::jsonb,
        deliverable_bundle = ${config.bundle}
      WHERE id = ${parseInt(agentId)}
    `);
    log(`[Patch LexSkripsi Features] ✅ Deliverables → agent ${agentId}: ${config.deliverables.length} items, bundle="${config.bundle}"`);
  }

  // ── 2. CONVERSION + LEAD CAPTURE untuk orchestrator ─────────────────────
  await db.execute(sql`
    UPDATE agents 
    SET 
      conversion_enabled = true,
      conversion_goal = ${CONVERSION_CONFIG.conversion_goal},
      cta_trigger_after_messages = ${CONVERSION_CONFIG.cta_trigger_after_messages},
      cta_trigger_on_score = ${CONVERSION_CONFIG.cta_trigger_on_score},
      whatsapp_cta = ${CONVERSION_CONFIG.whatsapp_cta},
      conversion_cta = ${JSON.stringify(CONVERSION_CONFIG.conversion_cta)}::jsonb,
      lead_capture_fields = ${JSON.stringify(CONVERSION_CONFIG.lead_capture_fields)}::jsonb,
      conversion_offers = ${JSON.stringify(CONVERSION_CONFIG.conversion_offers)}::jsonb
    WHERE id = 1362
  `);
  log("[Patch LexSkripsi Features] ✅ Conversion + Lead Capture → orchestrator 1362 aktif");

  // ── 3. SCORING untuk orchestrator ───────────────────────────────────────
  await db.execute(sql`
    UPDATE agents 
    SET 
      scoring_enabled = true,
      scoring_rubric = ${JSON.stringify(SCORING_CONFIG.scoring_rubric)}::jsonb,
      scoring_thresholds = ${JSON.stringify(SCORING_CONFIG.scoring_thresholds)}::jsonb
    WHERE id = 1362
  `);
  log("[Patch LexSkripsi Features] ✅ Scoring (5 dimensi kesiapan skripsi) → orchestrator 1362 aktif");

  // ── 4. LANDING PAGE untuk orchestrator (split menjadi 2 query untuk keamanan) ──
  await db.execute(sql`
    UPDATE agents 
    SET 
      landing_page_enabled = true,
      landing_hero_headline = ${LANDING_PAGE_CONFIG.landing_hero_headline},
      landing_hero_subheadline = ${LANDING_PAGE_CONFIG.landing_hero_subheadline},
      landing_hero_cta_text = ${LANDING_PAGE_CONFIG.landing_hero_cta_text},
      landing_solution_text = ${LANDING_PAGE_CONFIG.landing_solution_text}
    WHERE id = 1362
  `);
  // JSONB fields in a separate query (landing_authority is jsonb, not text)
  await db.execute(sql`
    UPDATE agents 
    SET 
      landing_pain_points = ${JSON.stringify(LANDING_PAGE_CONFIG.landing_pain_points)}::jsonb,
      landing_benefits = ${JSON.stringify(LANDING_PAGE_CONFIG.landing_benefits)}::jsonb,
      landing_testimonials = ${JSON.stringify(LANDING_PAGE_CONFIG.landing_testimonials)}::jsonb,
      landing_faq = ${JSON.stringify(LANDING_PAGE_CONFIG.landing_faq)}::jsonb,
      landing_authority = ${JSON.stringify(LANDING_PAGE_CONFIG.landing_authority)}::jsonb,
      landing_guarantees = ${JSON.stringify(LANDING_PAGE_CONFIG.landing_guarantees)}::jsonb
    WHERE id = 1362
  `);
  log("[Patch LexSkripsi Features] ✅ Landing Page → orchestrator 1362 dikonfigurasi");

  // ── Marker ───────────────────────────────────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. 4 fitur dikonfigurasi: (1) Deliverables — 6 agents, mentor bundle; (2) Conversion/Lead Capture — 5 fields + 1 offer; (3) Scoring — 5 dimensi, threshold 40/65/80; (4) Landing Page — hero + pain points + benefits + FAQ + testimonial.`,
    description: "Patch marker otomatis — jangan dihapus",
    processingStatus: "completed",
    status: "active",
  } as any);

  log("[Patch LexSkripsi Features] SELESAI — 4 fitur aktif untuk LexSkripsi");
  return { done: true, skipped: false };
}
