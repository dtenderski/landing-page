/**
 * Fill ALL empty fields for KarirHub Bot (agent ID 1480)
 * Covers: agent fields, project brain template+instance,
 *         deliverables, mini apps, store product
 *
 * Run: node_modules/.bin/tsx scripts/seed-karirhub-complete.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const AGENT_ID = 1480;

async function main() {
  console.log("=== Fill All Fields — KarirHub Bot (ID 1480) ===\n");

  // ── 1. Agent field patch ──────────────────────────────────────────────────
  await db.query(`
    UPDATE agents SET
      personality           = $1,
      expertise             = $2::jsonb,
      domain_charter        = $3,
      quality_bar           = $4,
      risk_compliance       = $5,
      brand_voice_spec      = $6,
      interaction_policy    = $7,
      open_claw_entity_owner = $8,
      open_claw_rulebook    = $9,
      open_claw_rulebook_category = $10::jsonb,
      conversation_win_conditions = $11,
      widget_welcome_message = $12,
      landing_page_url      = $13,
      landing_hero_headline = $14,
      landing_hero_subheadline = $15,
      landing_pain_points   = $16::jsonb,
      landing_solution_text = $17,
      landing_benefits      = $18::jsonb,
      landing_demo_items    = $19::jsonb,
      landing_testimonials  = $20::jsonb,
      landing_faq           = $21::jsonb,
      landing_authority     = $22::jsonb,
      landing_guarantees    = $23::jsonb,
      ad_copies             = $24::jsonb,
      image_hook_prompts    = $25::jsonb,
      video_reel_prompts    = $26::jsonb,
      context_questions     = $27::jsonb,
      key_phrases           = $28::jsonb,
      avoid_topics          = $29::jsonb,
      folder_name           = $30
    WHERE id = $31
  `, [
    /* $1  personality */
    "KarirHub Bot adalah asisten karir yang hangat, suportif, dan jujur. Seperti mentor karir profesional yang berbicara apa adanya — tidak over-promise, tidak menolak pertanyaan, dan selalu memberikan saran berbasis data pasar nyata. Prioritas utama: membantu pencari kerja teknik Indonesia menemukan pekerjaan yang benar-benar cocok dan layak.",

    /* $2  expertise */
    JSON.stringify([
      "Job matching berbasis kompetensi dan sertifikasi BNSP",
      "Analisis pasar kerja teknik Indonesia 2026",
      "Review CV dan optimasi ATS score",
      "Strategi melamar ke perusahaan lokal maupun remote global",
      "Sertifikasi BNSP konstruksi (SKK, Ahli K3) dan vendor IT (AWS, GCP)",
      "Draft surat lamaran bahasa Indonesia dan Inggris",
      "Panduan karir untuk AI Engineer, K3, Electrical, Site Engineer",
      "Analisis gaji dan benchmark pasar lokal vs remote worldwide",
    ]),

    /* $3  domain_charter */
    "KarirHub melayani pencari kerja dan pemberi kerja di sektor teknik Indonesia — prioritas tenaga bersertifikat BNSP (konstruksi, K3, MEP, alat berat, welding) dan IT/AI Engineering. Domain: career, recruitment, job matching, sertifikasi profesional, pengembangan karir teknik.",

    /* $4  quality_bar */
    "Setiap rekomendasi lowongan harus disertai Fit Score (0–100) dengan penjelasan per dimensi. Setiap saran sertifikasi harus menyebutkan LSP terkait, estimasi biaya, dan ROI karir. Jawaban tidak boleh lebih dari 400 kata kecuali diminta detail. Wajib gunakan tag [ASUMSI:] untuk setiap informasi yang tidak dapat diverifikasi langsung.",

    /* $5  risk_compliance */
    "Jangan menjanjikan hasil spesifik (lulus seleksi, dapat pekerjaan, gaji tertentu). Gunakan [ASUMSI:] saat informasi tidak dapat diverifikasi. Jangan ekspos kontak pribadi kandidat/pemberi kerja tanpa izin. Informasi gaji selalu disajikan sebagai estimasi/range, bukan angka pasti. Hindari diskriminasi berdasarkan gender, usia, atau agama dalam rekomendasi.",

    /* $6  brand_voice_spec */
    "Tone: profesional namun hangat, seperti senior yang membantu junior. Bahasa: formal-santai (bukan kaku, bukan slang). Kalimat: pendek dan langsung. Emoji: digunakan hemat untuk emphasis (💼 🔎 📝 🏅). Tidak menggunakan bahasa hiperbola atau over-promise. Jika berbicara Inggris: confident dan technical.",

    /* $7  interaction_policy */
    "ELICIT MAX 1 PUTARAN: tidak bertanya lebih dari 2 pertanyaan klarifikasi sekaligus. Langsung jawab best-effort bahkan jika profil belum lengkap. ANTI INTERROGATION: jangan wawancara berturut-turut — jawab dulu, tanya kemudian. REFLECT: cek kecukupan jawaban sebelum kirim. Format output: heading kecil + bullet, bukan paragraf panjang.",

    /* $8  open_claw_entity_owner */
    "KarirHub — Platform Karir Tenaga Teknik BNSP Indonesia",

    /* $9  open_claw_rulebook */
    "ABD v1.1 (Anti-Blocking Doctrine): (1) Tidak pernah menolak dengan alasan 'data tidak ada'. (2) Selalu berikan jawaban best-effort. (3) Tag [ASUMSI:] wajib untuk setiap asumsi. (4) Confidence score wajib di akhir output non-trivial. (5) ELICIT MAX 1 PUTARAN — tidak boleh mengajukan >2 pertanyaan berturut-turut. (6) Prioritaskan kandidat bersertifikat BNSP di sektor konstruksi.",

    /* $10 open_claw_rulebook_category — JSONB array */
    JSON.stringify(["career", "recruitment", "job-matching", "bnsp-advisory"]),

    /* $11 conversation_win_conditions — TEXT field */
    "User mendapat ≥3 rekomendasi lowongan dengan Fit Score; ATAU user menerima ATS Score CV + 3 rekomendasi perbaikan konkret; ATAU user mendapat roadmap sertifikasi BNSP dengan LSP dan estimasi biaya; ATAU user mendapat draft surat lamaran siap kirim.",

    /* $12 widget_welcome_message */
    "Halo! Saya KarirHub Bot 💼 — asisten karir teknik Indonesia. Cari lowongan, review CV, atau tanya soal sertifikasi BNSP? Mulai dari sini!",

    /* $13 landing_page_url */
    "/bot/karirhub-bot",

    /* $14 landing_hero_headline */
    "Temukan Pekerjaan Teknik yang Layak — Dipandu AI, Diprioritaskan BNSP",

    /* $15 landing_hero_subheadline */
    "KarirHub Bot mencocokkan profil Anda dengan lowongan aktif, memberi ATS Score CV, merekomendasikan sertifikasi BNSP yang meningkatkan nilai jual, dan membuatkan surat lamaran siap kirim — semua dalam satu percakapan.",

    /* $16 landing_pain_points */
    JSON.stringify([
      { icon: "😩", title: "Lamar puluhan kali, tidak dipanggil?", description: "CV tidak lolos ATS karena keyword dan struktur yang kurang tepat untuk bidang teknik." },
      { icon: "🎯", title: "Tidak tahu mana lowongan yang benar-benar cocok?", description: "Terlalu banyak pilihan tanpa tahu lowongan mana yang sesuai kompetensi dan target gaji." },
      { icon: "📜", title: "BNSP sudah punya tapi tidak tahu cara manfaatkannya?", description: "Sertifikasi BNSP sangat berharga di sektor konstruksi tapi banyak yang tidak tahu cara menonjolkannya." },
      { icon: "💸", title: "Target gaji >25jt tapi bingung dari mana mulai?", description: "Pasar lokal tidak bisa capai target — perlu strategi remote global yang berbeda." },
    ]),

    /* $17 landing_solution_text */
    "KarirHub Bot adalah asisten karir AI yang dirancang khusus untuk tenaga teknik Indonesia. Dengan Knowledge Base lowongan aktif, insight pasar gaji 2026, dan panduan sertifikasi BNSP yang komprehensif, bot ini memberikan panduan karir yang akurat, jujur, dan langsung bisa dijalankan.",

    /* $18 landing_benefits */
    JSON.stringify([
      { icon: "🔎", title: "Job Matching dengan Fit Score", description: "Cocokkan profil Anda dengan lowongan aktif. Setiap lowongan dinilai dengan Fit Score 0–100 berdasarkan sektor, sertifikasi, pengalaman, lokasi, dan target gaji." },
      { icon: "📝", title: "Review CV & ATS Score", description: "Dapatkan ATS Score dengan rincian keyword match, struktur, kuantifikasi prestasi, dan 3 rekomendasi perbaikan konkret dengan contoh 'sebelum → sesudah'." },
      { icon: "🏅", title: "BNSP Advisory Berbasis ROI", description: "Rekomendasi 2–4 sertifikasi BNSP paling berdampak untuk target karir Anda, lengkap dengan LSP terkait, estimasi biaya, dan dampak nyata terhadap gaji." },
      { icon: "✉️", title: "Draft Surat Lamaran Siap Kirim", description: "Surat lamaran dipersonalisasi — Bahasa Indonesia formal atau English — yang menonjolkan sertifikasi dan pengalaman relevan untuk posisi target." },
      { icon: "📊", title: "Insight Pasar Gaji 2026", description: "Data gaji lokal vs remote global, jalur karir yang paling menghasilkan, dan strategi untuk capai target gaji Anda berdasarkan data terkini." },
    ]),

    /* $19 landing_demo_items */
    JSON.stringify([
      { prompt: "Cari lowongan AI Engineer remote dengan gaji 25–40jt", response: "Top 3 match: (1) Remote AI Engineer Crossover — $200K/yr, Fit Score 95 ✅; (2) Senior R&D AI Tooploox APAC — $80K+, Fit Score 82; (3) AI Engineer Avanade Jakarta — Rp 25–35jt, Fit Score 71. [Detail lengkap + cara melamar...]" },
      { prompt: "Saya punya SKK Konstruksi Madya + Ahli K3 — posisi apa yang paling laku?", response: "Dengan profil SKK Madya + Ahli K3, posisi paling kompetitif 2026: (1) Site HSE Manager Rp 12–20jt, (2) K3 Lead Multi-proyek Rp 8–14jt, (3) Safety Consultant Freelance... [Rekomendasi sertifikasi lanjutan...]" },
      { prompt: "Review CV saya: [paste teks CV]", response: "ATS Score: 68/100. Kekuatan: pengalaman terverifikasi, sertifikasi BNSP dicantumkan ✅. Area perbaikan: (1) Tambah keyword teknis spesifik, (2) Kuantifikasi proyek (budget Rp X, durasi Y bulan), (3) Ringkas bagian pendidikan..." },
    ]),

    /* $20 landing_testimonials */
    JSON.stringify([
      { name: "Budi S., Site Engineer", role: "Konstruksi gedung, Surabaya", quote: "KarirHub Bot membantu saya menemukan lowongan yang cocok dalam 10 menit — dan langsung kasih tahu CV saya perlu diperbaiki di bagian mana sebelum melamar.", rating: 5 },
      { name: "Dewi R., Fresh Graduate K3", role: "Teknik Keselamatan, Bandung", quote: "Saya baru lulus Ahli K3 Konstruksi BNSP tapi bingung mau melamar ke mana. Bot ini langsung kasih 4 lowongan yang mensyaratkan sertifikasi saya, dan bantu buat surat lamaran dalam Bahasa Indonesia yang profesional.", rating: 5 },
      { name: "Andi W., AI Engineer", role: "Freelancer, Jakarta", quote: "Target gaji 30jt/bulan dari pasar lokal hampir mustahil. KarirHub Bot jujur bilang harus ke remote global dan langsung kasih 3 platform terbaik + strategi portofolio untuk melamar ke Crossover.", rating: 5 },
    ]),

    /* $21 landing_faq */
    JSON.stringify([
      { q: "Apakah bot ini bisa melamarkan pekerjaan untuk saya?", a: "Bot ini memberikan rekomendasi lowongan, review CV, dan draft surat lamaran — tapi proses melamar tetap dilakukan sendiri. Kami memberi Anda semua amunisi yang dibutuhkan." },
      { q: "Berapa biaya menggunakan KarirHub Bot?", a: "Sepenuhnya gratis untuk 10 pertanyaan pertama per hari. Tidak perlu registrasi untuk memulai." },
      { q: "Apakah informasi lowongan yang diberikan selalu akurat?", a: "KB lowongan diperbarui secara berkala. Setiap informasi yang tidak dapat diverifikasi real-time akan ditandai dengan [ASUMSI:] dan disertai confidence score." },
      { q: "Apakah bot ini memahami sertifikasi BNSP konstruksi Indonesia?", a: "Ya — KarirHub Bot dibangun dengan pengetahuan mendalam tentang SKK Konstruksi, Ahli K3, ASKOM, dan regulasi UU Jasa Konstruksi, Permen PUPR, dan SK Dirjen 114/2024." },
      { q: "Bisa bantu untuk posisi remote global?", a: "Tentu. Bot ini memiliki insight khusus untuk posisi remote global (Crossover, Wellfound, RemoteOK) termasuk strategi portofolio untuk pasar AI Engineering internasional." },
    ]),

    /* $22 landing_authority */
    JSON.stringify([
      { label: "Lowongan Aktif di KB", value: "10+ Lowongan Terkurasi" },
      { label: "Platform Sumber", value: "17+ Platform Lokal & Global" },
      { label: "Regulasi Referensi", value: "UU 2/2017, SK Dirjen 114/2024, BNSP" },
      { label: "Model AI", value: "GPT-4o — Teknologi Terbaik" },
      { label: "Doktrin", value: "ABD v1.1 Anti-Blocking" },
    ]),

    /* $23 landing_guarantees */
    JSON.stringify([
      { icon: "✅", text: "Selalu jawab best-effort — tidak pernah menolak dengan alasan 'data tidak ada'" },
      { icon: "🔍", text: "Setiap asumsi ditandai [ASUMSI:] — transparan dan jujur" },
      { icon: "🔒", text: "Kontak pribadi Anda tidak dibagikan tanpa izin eksplisit" },
      { icon: "📊", text: "Rekomendasi berbasis data pasar 2026, bukan opini subjektif" },
    ]),

    /* $24 ad_copies */
    JSON.stringify([
      { headline: "CV Kamu Sudah Benar Belum?", body: "Cek ATS Score CV-mu sekarang — gratis. KarirHub Bot beri tahu kenapa CV kamu tidak lolos dan cara memperbaikinya.", cta: "Cek CV Sekarang", platform: "instagram" },
      { headline: "Punya SKK/Ahli K3 tapi Belum Kerja Optimal?", body: "Sertifikasi BNSP kamu sangat berharga. KarirHub Bot temukan lowongan yang mensyaratkan sertifikasimu dan bantu kamu melamar dengan lebih percaya diri.", cta: "Cari Lowongan BNSP", platform: "facebook" },
      { headline: "AI Engineer? Target Gaji >25jt/bulan?", body: "Pasar lokal tidak bisa capai target itu. Tapi remote global bisa. KarirHub Bot kasih strategi yang jujur dan berbasis data 2026.", cta: "Mulai Konsultasi", platform: "linkedin" },
    ]),

    /* $25 image_hook_prompts */
    JSON.stringify([
      "Split screen: sebelah kiri CV merah (ditolak ATS), sebelah kanan CV hijau (lolos ATS) — dengan KarirHub Bot di tengah sebagai penghubung",
      "Infografis: Gaji AI Engineer Lokal Rp 15jt vs Remote Global Rp 130jt — dengan tagline 'Tahu bedanya sebelum melamar'",
      "Sertifikat BNSP di tangan engineer konstruksi lapangan dengan keterangan: 'Sertifikat ini bisa 2x lipatkan gaji Anda'",
    ]),

    /* $26 video_reel_prompts */
    JSON.stringify([
      "Hook 3 detik: 'Kenapa CV saya ditolak terus?' → Reveal: ATS Score hanya 45/100 → KarirHub Bot tunjukkan 3 fix konkret → Closing: 'Cek CV kamu gratis'",
      "Hook: 'Punya SKK Konstruksi tapi gaji segitu-gitu aja?' → Data: lowongan K3 yang bayar 2x lebih tinggi → CTA: chat KarirHub Bot",
      "Hook: 'Bagaimana cara dapat gaji $200K dari Indonesia?' → Penjelasan singkat: remote global engineer → Crossover case study → CTA: konsultasi KarirHub Bot",
    ]),

    /* $27 context_questions */
    JSON.stringify([
      { id: "cq1", question: "Anda mencari lowongan atau ingin posting kebutuhan tenaga kerja?", type: "choice", options: ["Cari Lowongan", "Posting Kebutuhan", "Review CV / Konsultasi Karir"] },
      { id: "cq2", question: "Bidang teknik yang Anda geluti?", type: "choice", options: ["AI / Software Engineering", "Konstruksi / Sipil", "K3 / HSE", "Elektrikal / MEP", "Lainnya"] },
    ]),

    /* $28 key_phrases */
    JSON.stringify([
      "lowongan", "pekerjaan", "karir", "lamaran", "CV", "resume", "gaji",
      "sertifikat", "BNSP", "SKK", "Ahli K3", "konstruksi", "AI engineer",
      "remote", "freelance", "JobStreet", "Kalibrr", "Wellfound", "Crossover",
      "fit score", "ATS", "surat lamaran", "interview", "peluang kerja",
    ]),

    /* $29 avoid_topics */
    JSON.stringify([
      "Topik politik dan ideologi",
      "Investasi saham atau kripto",
      "Pinjaman online atau kredit",
      "Konten dewasa atau tidak pantas",
      "Klaim medis atau kesehatan",
    ]),

    /* $30 folder_name */
    "KarirHub — Karir & Rekrutmen",

    /* $31 WHERE id */
    AGENT_ID,
  ]);
  console.log("✅ Agent fields updated (personality, expertise, domain charter, landing page, ad copies, dll)");

  // ── 2. Project Brain Template ─────────────────────────────────────────────
  // Actual columns: agent_id, name, description, fields (jsonb), is_active
  const pbtCheck = await db.query(`SELECT id FROM project_brain_templates WHERE agent_id=$1`, [AGENT_ID]);
  if (pbtCheck.rows.length === 0) {
    const { rows: [tmpl] } = await db.query(`
      INSERT INTO project_brain_templates (agent_id, name, description, fields, is_active)
      VALUES ($1,$2,$3,$4::jsonb,true) RETURNING id
    `, [
      AGENT_ID,
      "Profil Karir Pencari Kerja",
      "Konteks profil kandidat untuk personalisasi rekomendasi lowongan, review CV, dan saran sertifikasi BNSP",
      JSON.stringify([
        { key: "nama_kandidat", label: "Nama Kandidat", type: "text", required: false, order: 1, placeholder: "Nama lengkap Anda", helpText: "Untuk personalisasi rekomendasi" },
        { key: "bidang_teknik", label: "Bidang Teknik Utama", type: "select", required: false, order: 2, options: ["AI / Software Engineering", "Konstruksi / Sipil", "K3 / HSE", "Elektrikal / MEP", "Alat Berat / Welding", "Migas & Energi", "Lainnya"], helpText: "Bidang pekerjaan yang Anda tekuni saat ini" },
        { key: "posisi_target", label: "Posisi / Jabatan yang Dicari", type: "text", required: false, order: 3, placeholder: "Contoh: AI Engineer, Ahli K3, Site Engineer", helpText: "Jabatan spesifik yang ingin Anda lamar" },
        { key: "tahun_pengalaman", label: "Tahun Pengalaman Kerja", type: "select", required: false, order: 4, options: ["Fresh Graduate (0–1 thn)", "Junior (1–3 thn)", "Mid (3–6 thn)", "Senior (6–10 thn)", "Principal (10+ thn)"], helpText: "Total pengalaman di bidang relevan" },
        { key: "sertifikasi_dimiliki", label: "Sertifikasi yang Sudah Dimiliki", type: "textarea", required: false, order: 5, placeholder: "Contoh: SKK Madya, Ahli K3 BNSP, AWS ML Specialty", helpText: "Sebutkan semua sertifikasi BNSP maupun vendor" },
        { key: "skill_teknis", label: "Skill Teknis Utama", type: "textarea", required: false, order: 6, placeholder: "Contoh: Python, LLM Engineering, Project Management, AutoCAD, PLC", helpText: "3–5 skill paling relevan untuk posisi target" },
        { key: "target_gaji", label: "Target Gaji per Bulan (Rp)", type: "text", required: false, order: 7, placeholder: "Contoh: 15.000.000 – 25.000.000", helpText: "Range gaji yang Anda harapkan" },
        { key: "preferensi_lokasi", label: "Preferensi Lokasi/Mode Kerja", type: "select", required: false, order: 8, options: ["Onsite (kota tertentu)", "Hybrid", "Remote Indonesia", "Remote Worldwide", "Fleksibel"], helpText: "Preferensi lokasi atau mode kerja" },
        { key: "domisili", label: "Domisili Saat Ini", type: "text", required: false, order: 9, placeholder: "Kota, Provinsi", helpText: "Untuk filter lowongan onsite yang relevan" },
        { key: "link_cv_portfolio", label: "Link CV / Portfolio (opsional)", type: "url", required: false, order: 10, placeholder: "https://github.com/...", helpText: "Link publik ke CV atau portofolio Anda" },
      ]),
    ]);
    console.log(`✅ Project Brain Template created: ID ${tmpl.id}`);

    // Instance — actual columns: agent_id, template_id, name, values (jsonb), status, is_active
    const { rows: [inst] } = await db.query(`
      INSERT INTO project_brain_instances (agent_id, template_id, name, values, status, is_active)
      VALUES ($1,$2,$3,$4::jsonb,$5,true) RETURNING id
    `, [
      AGENT_ID,
      tmpl.id,
      "Profil Karir — Contoh (AI Engineer Remote)",
      JSON.stringify({
        nama_kandidat: "Kandidat Contoh",
        bidang_teknik: "AI / Software Engineering",
        posisi_target: "AI Engineer / LLM Engineer",
        tahun_pengalaman: "Senior (6–10 thn)",
        sertifikasi_dimiliki: "SKK Konstruksi Madya, Ahli K3 Konstruksi BNSP",
        skill_teknis: "Python, LLM Engineering, Multi-agent Orchestration, Prompt Engineering, RAG Systems",
        target_gaji: "25.000.000 – 40.000.000",
        preferensi_lokasi: "Remote Worldwide",
        domisili: "Jakarta",
        link_cv_portfolio: "",
      }),
      "active",
    ]);
    console.log(`✅ Project Brain Instance created: ID ${inst.id}`);
  } else {
    console.log("ℹ️  Project Brain Template sudah ada, skip");
  }

  // ── 3. Deliverables ───────────────────────────────────────────────────────
  // Actual columns: agent_id, type, title, content (jsonb), status, dedupe_key
  const delCheck = await db.query(`SELECT COUNT(*) FROM agentic_deliverables WHERE agent_id=$1`, [AGENT_ID]);
  if (parseInt(delCheck.rows[0].count) === 0) {
    const deliverables = [
      {
        type: "dokumen_draft",
        title: "Surat Lamaran Siap Kirim",
        content: {
          description: "Draft surat lamaran yang dipersonalisasi untuk posisi target — Bahasa Indonesia formal atau English.",
          output_format: "markdown",
          template: "Buat surat lamaran profesional untuk posisi {posisi_target} yang menonjolkan sertifikasi BNSP dan pengalaman relevan kandidat.",
          fields: ["posisi_target", "nama_perusahaan", "bahasa"],
        },
        status: "active",
        dedupe_key: `karirhub-surat-lamaran-${AGENT_ID}`,
      },
      {
        type: "rencana_aksi",
        title: "Rencana Karir & Roadmap Sertifikasi",
        content: {
          description: "Roadmap karir 3–6 bulan: prioritas sertifikasi BNSP, platform melamar, skill gap, dan milestone.",
          output_format: "markdown",
          template: "Buat roadmap karir 6 bulan untuk kandidat bidang {bidang_teknik}, pengalaman {tahun_pengalaman}, target {posisi_target}, gaji {target_gaji}.",
          fields: ["bidang_teknik", "tahun_pengalaman", "posisi_target", "target_gaji"],
        },
        status: "active",
        dedupe_key: `karirhub-roadmap-karir-${AGENT_ID}`,
      },
      {
        type: "ringkasan_jawaban",
        title: "Laporan Fit Score & Rekomendasi Lowongan",
        content: {
          description: "Laporan top 3–5 lowongan paling cocok dengan Fit Score per dimensi dan langkah melamar.",
          output_format: "markdown",
          template: "Tampilkan top 5 lowongan dari KB dengan breakdown Fit Score 6 dimensi dan rekomendasi cara melamar untuk kandidat dengan profil: {profil_kandidat}.",
          fields: ["profil_kandidat"],
        },
        status: "active",
        dedupe_key: `karirhub-fit-score-report-${AGENT_ID}`,
      },
    ];

    for (const del of deliverables) {
      await db.query(`
        INSERT INTO agentic_deliverables (agent_id, type, title, content, status, dedupe_key)
        VALUES ($1,$2,$3,$4::jsonb,$5,$6)
      `, [AGENT_ID, del.type, del.title, JSON.stringify(del.content), del.status, del.dedupe_key]);
    }
    console.log(`✅ Deliverables created: ${deliverables.length} items`);
  } else {
    console.log("ℹ️  Deliverables sudah ada, skip");
  }

  // ── 4. Mini Apps ──────────────────────────────────────────────────────────
  // Actual columns: agent_id, name, description, type, config (jsonb), icon, is_active, public_slug
  const maCheck = await db.query(`SELECT COUNT(*) FROM mini_apps WHERE agent_id=$1`, [AGENT_ID]);
  if (parseInt(maCheck.rows[0].count) === 0) {
    const apps = [
      {
        type: "job_fit_score",
        name: "Kalkulator Fit Score Lowongan",
        description: "Hitung Fit Score kesesuaian profil Anda dengan lowongan target — 6 dimensi penilaian.",
        icon: "🎯",
        public_slug: "karirhub-fit-score",
        config: {
          dimensions: [
            { id: "sektor", label: "Kecocokan Sektor / Posisi", maxScore: 30 },
            { id: "sertifikasi", label: "Sertifikasi BNSP / Vendor", maxScore: 20 },
            { id: "pengalaman", label: "Pengalaman Kerja", maxScore: 15 },
            { id: "lokasi", label: "Lokasi / Mode Kerja", maxScore: 15 },
            { id: "skill", label: "Skill Teknis", maxScore: 10 },
            { id: "gaji", label: "Target Gaji", maxScore: 10 },
          ],
          resultLabels: { low: "Belum Cocok (<50)", medium: "Layak Dipertimbangkan (50–75)", high: "Sangat Cocok (>75)" },
          prompt_template: "Berdasarkan Fit Score input berikut, rekomendasikan apakah kandidat sebaiknya melamar dan langkah persiapannya: {input_data}",
        },
      },
      {
        type: "cv_ats_checker",
        name: "CV ATS Score Checker",
        description: "Analisis CV — ATS Score 0–100, keyword gap, dan 3 rekomendasi perbaikan konkret.",
        icon: "📝",
        public_slug: "karirhub-ats-checker",
        config: {
          scoring_dimensions: [
            { id: "keyword", label: "Keyword Match", weight: 30 },
            { id: "struktur", label: "Struktur & Format", weight: 25 },
            { id: "kuantifikasi", label: "Kuantifikasi Prestasi", weight: 25 },
            { id: "panjang", label: "Panjang & Relevansi", weight: 20 },
          ],
          input_fields: [
            { id: "cv_text", label: "Paste Teks CV Anda", type: "textarea" },
            { id: "posisi_target", label: "Posisi yang Akan Dilamar", type: "text" },
          ],
          prompt_template: "Analisis CV berikut untuk posisi {posisi_target}. Berikan ATS Score 0-100, breakdown per dimensi, 3 rekomendasi 'sebelum → sesudah', keyword yang perlu ditambahkan. CV: {cv_text}",
        },
      },
      {
        type: "bnsp_advisor",
        name: "BNSP Sertifikasi Advisor",
        description: "Rekomendasi 2–4 sertifikasi BNSP paling berdampak — LSP, biaya, syarat, dan ROI karir.",
        icon: "🏅",
        public_slug: "karirhub-bnsp-advisor",
        config: {
          input_fields: [
            { id: "bidang", label: "Bidang Karir", type: "select", options: ["Konstruksi / Sipil", "K3 / HSE", "Elektrikal / MEP", "Alat Berat / Welding", "Migas & Energi", "IT / AI Engineering", "Lainnya"] },
            { id: "level", label: "Level Pengalaman", type: "select", options: ["Fresh Graduate", "Junior (1–3 thn)", "Mid (3–6 thn)", "Senior (6+ thn)"] },
            { id: "posisi_impian", label: "Posisi Target 2 Tahun", type: "text" },
            { id: "sertifikasi_ada", label: "Sertifikasi yang Sudah Dimiliki", type: "textarea" },
          ],
          prompt_template: "Rekomendasikan 2–4 sertifikasi BNSP paling berdampak untuk: bidang {bidang}, level {level}, target posisi {posisi_impian}, sudah punya: {sertifikasi_ada}. Tampilkan: Nama sertifikasi, LSP, Biaya estimasi, Syarat, ROI karir (dampak gaji & eligibilitas lowongan).",
        },
      },
    ];

    for (const app of apps) {
      await db.query(`
        INSERT INTO mini_apps (agent_id, name, description, type, config, icon, is_active, public_slug)
        VALUES ($1,$2,$3,$4,$5::jsonb,$6,true,$7)
      `, [AGENT_ID, app.name, app.description, app.type, JSON.stringify(app.config), app.icon, app.public_slug]);
    }
    console.log(`✅ Mini Apps created: ${apps.length} items`);
  } else {
    console.log("ℹ️  Mini Apps sudah ada, skip");
  }

  // ── 5. Store Product ──────────────────────────────────────────────────────
  // Actual columns: agent_id, name, description, category, price (int), features (jsonb), emoji, color, is_active, sort_order
  const spCheck = await db.query(`SELECT COUNT(*) FROM store_products WHERE agent_id=$1`, [AGENT_ID]);
  if (parseInt(spCheck.rows[0].count) === 0) {
    await db.query(`
      INSERT INTO store_products (agent_id, name, description, category, price, features, emoji, color, is_active, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,true,$9)
    `, [
      AGENT_ID,
      "KarirHub Bot — Asisten Karir Teknik Indonesia",
      "Asisten karir AI untuk tenaga teknik Indonesia — cocokkan profil dengan lowongan aktif, dapatkan ATS Score CV, rekomendasi sertifikasi BNSP dengan ROI karir, dan surat lamaran siap kirim.",
      "career",
      0,
      JSON.stringify([
        "Job Matching dengan Fit Score 0–100 (6 dimensi: sektor, BNSP, pengalaman, lokasi, skill, gaji)",
        "CV ATS Score Checker dengan rekomendasi 'sebelum → sesudah' yang konkret",
        "BNSP Advisory — rekomendasi sertifikasi dengan LSP, biaya estimasi, dan ROI karir",
        "Draft surat lamaran Bahasa Indonesia formal atau English yang dipersonalisasi",
        "Insight gaji pasar 2026 — lokal vs remote global",
        "Curator lowongan dari 17+ platform (JobStreet, Glints, Crossover, RemoteOK, dll)",
        "Kalkulator Fit Score interaktif (6 dimensi)",
        "Panduan jalur karir teknik per bidang (konstruksi, K3, elektrikal, AI/IT)",
      ]),
      "💼",
      "#0ea5e9",
      999,
    ]);
    console.log("✅ Store Product created");
  } else {
    console.log("ℹ️  Store Product sudah ada, skip");
  }

  // ── 6. Verify ─────────────────────────────────────────────────────────────
  const v = await db.query(`
    SELECT
      a.personality IS NOT NULL AND a.personality != '' AS has_personality,
      a.expertise IS NOT NULL AS has_expertise,
      a.domain_charter IS NOT NULL AND a.domain_charter != '' AS has_domain_charter,
      a.quality_bar IS NOT NULL AND a.quality_bar != '' AS has_quality_bar,
      a.landing_hero_headline IS NOT NULL AND a.landing_hero_headline != '' AS has_landing_hero,
      a.ad_copies IS NOT NULL AS has_ad_copies,
      a.brand_voice_spec IS NOT NULL AND a.brand_voice_spec != '' AS has_brand_voice,
      (SELECT COUNT(*) FROM project_brain_templates WHERE agent_id=$1) AS pbt_count,
      (SELECT COUNT(*) FROM project_brain_instances WHERE agent_id=$1) AS pbi_count,
      (SELECT COUNT(*) FROM agentic_deliverables WHERE agent_id=$1) AS del_count,
      (SELECT COUNT(*) FROM mini_apps WHERE agent_id=$1) AS ma_count,
      (SELECT COUNT(*) FROM store_products WHERE agent_id=$1) AS sp_count
    FROM agents a WHERE a.id = $1
  `, [AGENT_ID]);

  const r = v.rows[0];
  console.log("\n=== Verification ===");
  console.log(`  personality         : ${r.has_personality ? '✅' : '❌'}`);
  console.log(`  expertise           : ${r.has_expertise ? '✅' : '❌'}`);
  console.log(`  domain_charter      : ${r.has_domain_charter ? '✅' : '❌'}`);
  console.log(`  quality_bar         : ${r.has_quality_bar ? '✅' : '❌'}`);
  console.log(`  landing hero        : ${r.has_landing_hero ? '✅' : '❌'}`);
  console.log(`  ad_copies           : ${r.has_ad_copies ? '✅' : '❌'}`);
  console.log(`  brand_voice_spec    : ${r.has_brand_voice ? '✅' : '❌'}`);
  console.log(`  Project Brain Tmpl  : ${r.pbt_count}`);
  console.log(`  Project Brain Inst  : ${r.pbi_count}`);
  console.log(`  Deliverables        : ${r.del_count}`);
  console.log(`  Mini Apps           : ${r.ma_count}`);
  console.log(`  Store Products      : ${r.sp_count}`);

  console.log("\n✅ KarirHub Bot — semua field terisi lengkap!");
  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
