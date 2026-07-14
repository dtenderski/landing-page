import type { Express } from "express";
import { db } from "./db";
import { lmsCourses, lmsLessons, lmsEnrollments, lmsLessonProgress } from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated?.() || req.user) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_COURSES = [
  // === ONBOARDING GUSTAFTA ===
  {
    title: "Mulai dengan Gustafta",
    slug: "mulai-gustafta",
    shortDesc: "Pelajari cara membuat chatbot AI pertama Anda dalam 30 menit.",
    description: "Kursus onboarding resmi Gustafta. Anda akan belajar membuat chatbot, mengisi knowledge base, mengatur persona, dan mempublish chatbot ke publik — langkah demi langkah.",
    category: "onboarding",
    subcategory: "Dasar",
    color: "#6366f1",
    emoji: "🚀",
    instructor: "Tim Gustafta",
    durationMinutes: 35,
    price: 0,
    level: "beginner",
    isFeatured: true,
    sortOrder: 1,
    lessons: [
      { title: "Apa itu Gustafta?", slug: "apa-itu-gustafta", type: "article", durationMinutes: 5, isPreview: true, content: `# Apa itu Gustafta?\n\nGustafta adalah platform **AI Chatbot Builder** yang memungkinkan Anda membuat, mengkonfigurasi, dan men-deploy asisten percakapan cerdas — tanpa coding.\n\n## Mengapa Gustafta?\n\n- **5-Level Modular Hierarchy** — Agen dari Master hingga Spesialis\n- **Multi-Agent Orchestration** — Beberapa agen bekerja paralel\n- **ABD v1.1 (Anti-Blocking Doctrine)** — Chatbot selalu jawab dari informasi minimal\n- **Widget Embed** — Pasang di website mana saja dengan 1 baris kode\n- **Knowledge Base** — Upload dokumen, chatbot otomatis belajar\n\n## Siapa yang cocok menggunakan Gustafta?\n\n- Konsultan konstruksi (SKK, SBU, K3, ISO)\n- Lembaga sertifikasi (LSP, BNSP)\n- Tim legal dan kepatuhan\n- Bisnis yang butuh customer service AI 24/7` },
      { title: "Buat Chatbot Pertama", slug: "buat-chatbot-pertama", type: "article", durationMinutes: 8, isPreview: true, content: `# Buat Chatbot Pertama Anda\n\n## Langkah 1: Login dan Buka Dashboard\n\nMasuk ke dashboard Gustafta. Di panel kiri, klik **+ New Agent**.\n\n## Langkah 2: Isi Informasi Dasar\n\n- **Nama**: Nama chatbot Anda (contoh: "Asisten SBU Konstruksi")\n- **Deskripsi**: Jelaskan keahlian chatbot secara singkat\n- **Persona**: Karakter chatbot (ramah, profesional, tegas, dll)\n- **Tagline**: Kalimat singkat yang muncul di widget\n\n## Langkah 3: Tulis System Prompt\n\nSystem prompt adalah instruksi utama yang mendefinisikan perilaku chatbot. Gunakan template dari Gustafta atau tulis sendiri.\n\n## Langkah 4: Simpan dan Test\n\nKlik **Simpan**, lalu buka tab **Chat** untuk test chatbot Anda langsung.` },
      { title: "Mengisi Knowledge Base", slug: "mengisi-knowledge-base", type: "article", durationMinutes: 7, content: `# Mengisi Knowledge Base\n\nKnowledge Base adalah "otak" chatbot Anda — kumpulan informasi yang digunakan untuk menjawab pertanyaan.\n\n## Cara Upload Konten\n\n### 1. Upload File\nDukung PDF, DOCX, TXT. Klik **Upload File** di tab Knowledge Base.\n\n### 2. Paste Teks\nCopy-paste konten langsung ke editor teks.\n\n### 3. Input URL\nMasukkan URL website — Gustafta akan crawl kontennya otomatis.\n\n## Tips Mengisi KB yang Baik\n\n- Gunakan judul dan subjudul yang jelas\n- Pecah konten panjang menjadi topik-topik spesifik\n- Pastikan konten up-to-date\n- Tambahkan FAQ yang sering ditanyakan user\n\n## Hierarki Konten\n\nGustafta mendukung hierarki: **Series → Big Idea → Toolbox → Agent → Knowledge Base**. Susun konten sesuai hierarki untuk navigasi yang lebih baik.` },
      { title: "Mengatur Widget & Embed", slug: "mengatur-widget-embed", type: "article", durationMinutes: 8, content: `# Mengatur Widget & Embed\n\n## Apa itu Widget?\n\nWidget adalah tombol chat mengambang yang bisa dipasang di website mana saja. Pengunjung klik tombol → chat langsung dengan chatbot Anda.\n\n## Kustomisasi Widget\n\nBuka tab **Widget** di chatbot Anda:\n\n- **Warna** — Sesuaikan dengan brand Anda\n- **Posisi** — Kanan bawah, kiri bawah, kanan atas, kiri atas\n- **Ukuran** — Kecil, Sedang, Besar\n- **Ikon** — Chat, Message, Bot, atau Help\n- **Pesan Sambutan** — Teks yang muncul saat widget dibuka\n\n## Cara Embed ke Website\n\n1. Buka tab **Widget** → scroll ke **Kode Embed**\n2. Copy 1 baris kode ini:\n\n\`\`\`html\n<script src="https://app.gustafta.com/widget/loader.js" data-agent-id="ID_CHATBOT_ANDA"></script>\n\`\`\`\n\n3. Paste sebelum tag \`</body>\` di website Anda\n4. Selesai! Widget langsung aktif.\n\n## Demo Page untuk Customer\n\nGunakan link \`/demo/[ID]\` untuk mengirim halaman demo siap pakai ke calon customer — mereka bisa langsung test chatbot dan salin kode embed sendiri.` },
      { title: "Publish dan Share Chatbot", slug: "publish-share-chatbot", type: "article", durationMinutes: 7, content: `# Publish dan Share Chatbot\n\n## Mengaktifkan Akses Publik\n\n1. Buka chatbot di dashboard\n2. Di panel atas, aktifkan toggle **"Publik"**\n3. Chatbot kini bisa diakses siapa saja via link\n\n## Link yang Bisa Dibagikan\n\n### 1. Link Chat Publik\n\`/bot/[ID]\` — Halaman chat minimal, langsung bisa ngobrol.\n\n### 2. Demo Page\n\`/demo/[ID]\` — Halaman showcase lengkap dengan embed code. Cocok untuk pitch ke customer.\n\n### 3. Kode Embed Widget\nSatu script tag untuk pasang di website manapun.\n\n## Mengontrol Akses\n\n- **Guest Message Limit** — Batasi berapa pesan yang bisa dikirim tanpa login\n- **Require Registration** — Wajib daftar sebelum bisa chat\n- **Trial Days** — Berikan trial gratis N hari\n\n## Monitoring\n\nPantau percakapan user di tab **Pesan** dashboard Anda.` },
    ],
  },
  {
    title: "Multi-Agent & Agentic AI",
    slug: "multi-agent-agentic-ai",
    shortDesc: "Kuasai sistem multi-agen — orchestrator, sub-agen, dan paralel dispatch.",
    description: "Pelajari cara membangun sistem AI agentic dengan beberapa agen yang bekerja secara paralel. Dari konfigurasi orchestrator hingga ABD v1.1 Anti-Blocking Doctrine.",
    category: "onboarding",
    subcategory: "Lanjutan",
    color: "#8b5cf6",
    emoji: "🕸️",
    instructor: "Tim Gustafta",
    durationMinutes: 45,
    price: 0,
    level: "intermediate",
    isFeatured: true,
    sortOrder: 2,
    lessons: [
      { title: "Konsep Agentic AI", slug: "konsep-agentic-ai", type: "article", durationMinutes: 8, isPreview: true, content: `# Konsep Agentic AI\n\nAgentic AI adalah sistem di mana beberapa agen AI bekerja bersama — satu agen mengkoordinasi (orchestrator), lainnya berspesialisasi (sub-agent).\n\n## Mengapa Agentic?\n\n- **Lebih akurat** — Setiap agen fokus pada domain spesifiknya\n- **Lebih lengkap** — Laporan dari banyak perspektif sekaligus\n- **Lebih cepat** — Sub-agen berjalan paralel, bukan satu per satu\n\n## Hierarki 5-Level Gustafta\n\n1. **Master** — Koordinator tertinggi\n2. **Series HUB** — Koordinator tema besar\n3. **Sub-HUB** — Koordinator subtema\n4. **Specialist** — Agen ahli domain\n5. **Deep Specialist** — Agen ultra-spesifik\n\n## Inter-Agent API v2\n\nGustafta menggunakan sistem orchestration internal: orchestrator memanggil sub-agen secara paralel, mengumpulkan hasilnya, lalu mensintesis jawaban komprehensif.` },
      { title: "Membuat Orchestrator", slug: "membuat-orchestrator", type: "article", durationMinutes: 10, content: `# Membuat Orchestrator\n\nOrchestrator adalah "manajer" yang mengkoordinasi sub-agen.\n\n## Konfigurasi Orchestrator\n\n1. Buat agen baru\n2. Di tab **Agentic AI**, aktifkan mode Orchestrator\n3. Tambahkan sub-agen yang akan dipanggil\n4. Atur timeout dan max tokens per sub-agen\n\n## System Prompt Orchestrator\n\nOrchestrator perlu instruksi khusus untuk:\n- Menentukan kapan memanggil sub-agen mana\n- Cara mensintesis hasil dari beberapa sub-agen\n- Fallback jika sub-agen tidak tersedia\n\n## SYNTHESIS ORCHESTRATOR Marker\n\nGunakan marker \`// SYNTHESIS ORCHESTRATOR\` di system prompt untuk menandai agen sebagai orchestrator aktif. Ini memicu Inter-Agent API v2.` },
      { title: "ABD v1.1 Anti-Blocking Doctrine", slug: "abd-anti-blocking", type: "article", durationMinutes: 12, content: `# ABD v1.1 — Anti-Blocking Doctrine\n\nABD adalah aturan utama yang memastikan chatbot **selalu memberikan jawaban substantif** — tidak pernah blok atau tanya-tanya berlebihan.\n\n## 7 Prinsip ABD\n\n1. **ABD-1 Jawab dengan minimum input** — Dari info sedikit, hasilkan output maksimal\n2. **ABD-2 Heuristik default** — Gunakan asumsi wajar jika data tidak lengkap\n3. **ABD-3 Nyatakan asumsi** — Tandai asumsi dengan \`[ASUMSI: ...]\`\n4. **ABD-4 Anti interrogasi** — Maksimal 1 putaran klarifikasi\n5. **ABD-5 Reflect sebelum deliver** — Review output sebelum kirim\n6. **ABD-6 Anti human-as-API** — Jangan minta user jadi input machine\n7. **ABD-7 Output terstruktur** — Gunakan tabel, poin, dan format jelas\n\n## State Machine 7-Langkah\n\n\`INIT → ELICIT → PLAN → DISPATCH → AGGREGATE → REFLECT → DELIVER\`\n\nSetiap siklus tanya-jawab mengikuti state machine ini untuk output yang konsisten dan berkualitas tinggi.` },
      { title: "Fallback Mode & Handover", slug: "fallback-handover", type: "article", durationMinutes: 10, content: `# Fallback Mode & Handover\n\n## Fallback Mode\n\nKetika sub-agen tidak tersedia, orchestrator masuk **FALLBACK MODE** — menjawab secara mandiri menggunakan domain knowledge dan menandai asumsi.\n\nFormat fallback:\n\`\`\`\n[FALLBACK MODE] Sub-agen tidak tersedia. Menjawab berdasarkan pengetahuan domain:\n[ASUMSI: nilai | basis: regulasi | verifikasi-ke: pihak]\n\`\`\`\n\n## T5-Handover\n\nKetika user bertanya di luar domain chatbot, gunakan **HANDOVER** — bot mengakui keterbatasannya, menyebutkan resource yang tepat, dan kembali ke topik utama.\n\nContoh handover:\n> "Pertanyaan ini berada di luar domain SKK yang saya layani. Untuk topik SBU, Anda bisa menghubungi [SBU Advisor Bot]. Kembali ke topik SKK, ada yang bisa saya bantu?"` },
    ],
  },

  // === KONSTRUKSI ===
  {
    title: "Panduan SBU Konstruksi Lengkap",
    slug: "panduan-sbu-konstruksi",
    shortDesc: "Semua yang perlu Anda tahu tentang Sertifikasi Badan Usaha Jasa Konstruksi.",
    description: "Kursus komprehensif tentang SBU Konstruksi berdasarkan Permen PU No. 6 Tahun 2025. Meliputi persyaratan, dokumen, proses OSS-RBA, biaya, dan tips lolos sertifikasi.",
    category: "konstruksi",
    subcategory: "SBU",
    color: "#f97316",
    emoji: "🏗️",
    instructor: "SBUClaw AI + Tim Konstruksi",
    durationMinutes: 90,
    price: 0,
    level: "intermediate",
    isFeatured: true,
    sortOrder: 3,
    lessons: [
      { title: "Apa itu SBU Konstruksi?", slug: "apa-itu-sbu", type: "article", durationMinutes: 8, isPreview: true, content: `# Apa itu SBU Konstruksi?\n\nSertifikat Badan Usaha (SBU) adalah bukti kemampuan dan kompetensi Badan Usaha Jasa Konstruksi (BUJK) dalam melaksanakan pekerjaan konstruksi.\n\n## Dasar Hukum\n\n- **Permen PU No. 6 Tahun 2025** — Regulasi utama SBU saat ini\n- **UU No. 2 Tahun 2017** — Undang-Undang Jasa Konstruksi\n- **PP No. 14 Tahun 2021** — Peraturan turunan UU Jasa Konstruksi\n\n> ⚠️ SK Dirjen No. 37/2025 masih mengacu Permen lama. Gunakan **Permen PU 6/2025** sebagai acuan utama.\n\n## Jenis SBU\n\n| Jenis | Keterangan |\n|-------|------------|\n| **SBU PK** | Pelaksana Konstruksi (kontraktor) |\n| **SBU KK** | Konsultansi Konstruksi |\n| **SBU AIO** | All-In-One (gabungan) |\n| **SBU Terintegrasi** | Untuk BUJK terintegrasi |\n| **SBU JPTL** | Jasa Penunjang Tenaga Listrik |\n| **SBU Migas/EBT** | Minyak, gas, energi terbarukan |` },
      { title: "Kualifikasi BUJK", slug: "kualifikasi-bujk", type: "article", durationMinutes: 10, content: `# Kualifikasi BUJK\n\nKualifikasi menentukan nilai pekerjaan yang boleh dikerjakan.\n\n## Kualifikasi Pelaksana Konstruksi\n\n| Kualifikasi | Nilai Pekerjaan |\n|-------------|------------------|\n| Kecil (K) | s.d. Rp 2,5 miliar |\n| Menengah (M) | Rp 2,5 M — Rp 50 M |\n| Besar (B) | > Rp 50 miliar |\n\n## Persyaratan Kualifikasi Kecil\n\n- Modal disetor minimal Rp 500 juta\n- Tenaga ahli bersertifikat (SKK minimal KKNI L4)\n- Peralatan konstruksi sesuai subklasifikasi\n\n## Subklasifikasi\n\nSubklasifikasi menentukan jenis pekerjaan yang boleh diambil:\n- **BS** — Bangunan Sipil\n- **BG** — Bangunan Gedung\n- **IL** — Instalasi Mekanikal & Elektrikal\n- **IM** — Instalasi Manufaktur\n- **KO** — Konstruksi Khusus` },
      { title: "Dokumen Persyaratan SBU", slug: "dokumen-sbu", type: "article", durationMinutes: 12, content: `# Dokumen Persyaratan SBU\n\n## Dokumen Perusahaan\n\n1. Akta Pendirian + SK Kemenkumham\n2. NPWP Perusahaan\n3. NIB (Nomor Induk Berusaha) dari OSS\n4. Laporan Keuangan 2 tahun terakhir (audited untuk Menengah/Besar)\n5. Rekening Koran 3 bulan terakhir\n\n## Dokumen Tenaga Ahli\n\n1. **SKK (Sertifikat Kompetensi Kerja)** — Wajib sesuai subklasifikasi\n2. KTP dan NPWP tenaga ahli\n3. Ijazah pendidikan formal\n4. Foto formal\n\n## Dokumen Peralatan\n\n1. Bukti kepemilikan/sewa peralatan\n2. STNK/faktur peralatan\n3. Foto peralatan\n\n## Tips Persiapan Dokumen\n\n- Mulai dari SKK tenaga ahli dulu — prosesnya paling lama\n- Pastikan nama di semua dokumen konsisten\n- Laporan keuangan harus ditandatangani akuntan publik (untuk Menengah/Besar)` },
      { title: "Proses Pengajuan via OSS-RBA", slug: "proses-oss-rba", type: "article", durationMinutes: 15, content: `# Proses Pengajuan SBU via OSS-RBA\n\n## Apa itu OSS-RBA?\n\nOSS (Online Single Submission) adalah sistem perizinan berusaha terintegrasi. SBU diajukan melalui OSS dengan mekanisme Risk-Based Approach (RBA).\n\n## Langkah-Langkah\n\n### 1. Siapkan Akun OSS\n- Daftar/login di oss.go.id\n- Pastikan NIB sudah aktif\n\n### 2. Pilih KBLI yang Tepat\n- KBLI menentukan jenis usaha dan subklasifikasi SBU\n- Contoh: KBLI 41011 = Konstruksi Gedung Hunian\n\n### 3. Upload Dokumen\n- Upload semua dokumen persyaratan\n- Verifikasi otomatis oleh sistem\n\n### 4. Verifikasi LPJK\n- LPJK (Lembaga Pengembangan Jasa Konstruksi) melakukan verifikasi\n- Proses 7-14 hari kerja\n\n### 5. Terbit SBU\n- SBU digital diterbitkan dan bisa didownload dari OSS\n- Berlaku 3 tahun dan harus diregistrasi ulang\n\n## Biaya\n\nBiaya SBU bervariasi berdasarkan kualifikasi dan subklasifikasi. Estimasi: Rp 2-10 juta.` },
      { title: "Pertanyaan Umum SBU", slug: "faq-sbu", type: "article", durationMinutes: 10, content: `# FAQ — Pertanyaan Umum SBU\n\n## Berapa lama proses SBU?\nEstimasi total 3-6 minggu dari dokumen lengkap. Bottleneck biasanya di verifikasi SKK tenaga ahli.\n\n## Apakah bisa mengurus SBU tanpa tenaga ahli SKK?\nTidak. SKK adalah persyaratan wajib. Minimal 1 tenaga ahli SKK sesuai subklasifikasi yang diajukan.\n\n## Apa bedanya SBU dan SIUJK lama?\nSIUJK sudah tidak berlaku sejak 2021. SBU adalah pengganti SIUJK yang terintegrasi dengan OSS.\n\n## Apakah SBU bisa dipakai lintas provinsi?\nYa. SBU berlaku nasional untuk semua jenis tender pemerintah di seluruh Indonesia.\n\n## Bagaimana jika SBU expired?\nHarus diregistrasi ulang sebelum expired. Jika sudah expired, BUJK tidak bisa mengikuti tender.` },
    ],
  },
  {
    title: "Persiapan SKK & Sertifikasi Kompetensi",
    slug: "persiapan-skk-sertifikasi",
    shortDesc: "Panduan lengkap persiapan Sertifikat Kompetensi Kerja (SKK) konstruksi.",
    description: "Pelajari cara mempersiapkan diri untuk uji kompetensi SKK — dari memahami SKKNI, menyiapkan portofolio, sampai proses asesmen di LSP.",
    category: "konstruksi",
    subcategory: "SKK",
    color: "#22c55e",
    emoji: "📋",
    instructor: "SKK Coach AI",
    durationMinutes: 60,
    price: 0,
    level: "beginner",
    sortOrder: 4,
    lessons: [
      { title: "Apa itu SKK?", slug: "apa-itu-skk", type: "article", durationMinutes: 7, isPreview: true, content: `# Apa itu SKK?\n\nSertifikat Kompetensi Kerja (SKK) adalah bukti kompetensi seseorang di bidang jasa konstruksi. Diterbitkan oleh **LSP (Lembaga Sertifikasi Profesi)** yang telah diakreditasi BNSP.\n\n## Dasar Hukum\n\n- **Permen PUPR No. 9 Tahun 2023** — Pedoman utama SKK\n- **SK Dirjen No. 114/KPTS/DK/2024** — Acuan teknis jabatan kerja\n- **SKKNI** — Standar Kompetensi Kerja Nasional Indonesia\n\n## Jenjang KKNI\n\n| Level | Keterangan |\n|-------|------------|\n| KKNI L2-3 | Operator/Teknisi |\n| KKNI L4-5 | Teknisi Madya |\n| KKNI L6 | Ahli Muda |\n| KKNI L7 | Ahli Madya |\n| KKNI L8 | Ahli Utama |\n\n## Mengapa SKK Penting?\n\n1. Syarat wajib SBU\n2. Syarat mengikuti tender pemerintah\n3. Meningkatkan nilai jual sebagai profesional` },
      { title: "Mengenal SKKNI", slug: "mengenal-skkni", type: "article", durationMinutes: 8, content: `# Mengenal SKKNI\n\nSKKNI (Standar Kompetensi Kerja Nasional Indonesia) adalah acuan standar kompetensi yang harus dikuasai untuk mendapatkan SKK.\n\n## Komponen SKKNI\n\n### Unit Kompetensi\nSetiap jabatan kerja terdiri dari beberapa unit kompetensi. Contoh untuk Ahli Muda Teknik Bangunan Gedung (KKNI L6):\n- Mengelola rencana kerja proyek\n- Mengendalikan mutu konstruksi\n- Mengelola keselamatan konstruksi\n\n### Elemen Kompetensi\nSetiap unit punya elemen-elemen spesifik yang harus bisa dilakukan.\n\n### Kriteria Unjuk Kerja (KUK)\nIndikator terukur bahwa elemen kompetensi dikuasai.\n\n## Cara Membaca SKKNI\n\nCari SKKNI jabatan Anda di website BNSP atau Kemen PUPR, lalu pelajari setiap unit kompetensi beserta KUK-nya.` },
      { title: "Portofolio & Dokumen", slug: "portofolio-dokumen-skk", type: "article", durationMinutes: 10, content: `# Portofolio & Dokumen SKK\n\n## Dokumen Wajib\n\n1. KTP\n2. Ijazah pendidikan terakhir\n3. NPWP pribadi\n4. Foto 3x4 formal\n\n## Portofolio Pekerjaan\n\nKumpulkan bukti pengalaman kerja:\n- Surat keterangan kerja dari perusahaan\n- Kontrak proyek yang pernah dikerjakan\n- Foto-foto proyek\n- Laporan pekerjaan\n\n## Tips Portofolio yang Kuat\n\n- Minimal 2-3 proyek yang relevan\n- Cantumkan nilai proyek dan peran Anda\n- Sertakan foto sebelum/sesudah jika ada\n- Testimonial dari atasan atau klien\n\n## FR-APL-01 — Formulir Permohonan Asesmen\n\nFR-APL-01 adalah form standar BNSP untuk mengajukan asesmen kompetensi. Isi dengan jelas dan jujur — ini dasar asesor menilai kelayakan Anda.` },
      { title: "Proses Asesmen LSP", slug: "proses-asesmen-lsp", type: "article", durationMinutes: 10, content: `# Proses Asesmen di LSP\n\n## Tahap Asesmen\n\n### 1. Pengajuan Permohonan\nSubmit FR-APL-01 + dokumen ke LSP pilihan Anda.\n\n### 2. Pra-Asesmen\nAsesor mereview portofolio Anda. Jika ada kekurangan, Anda diberi waktu melengkapi.\n\n### 3. Asesmen Kompetensi\nBisa berupa:\n- **Wawancara** — Asesor mengajukan pertanyaan teknis\n- **Observasi** — Asesor melihat Anda bekerja langsung\n- **Uji Tulis** — Soal tertulis berbasis SKKNI\n- **Portofolio Review** — Diskusi mendalam tentang proyek Anda\n\n### 4. Keputusan Asesmen\n- **Kompeten (K)** — SKK diterbitkan\n- **Belum Kompeten (BK)** — Bisa mengulang setelah remedial\n\n### 5. Penerbitan SKK\nSKK digital diterbitkan melalui sistem SIKI LPJK dalam 7-14 hari kerja.` },
    ],
  },
  {
    title: "Dasar-Dasar K3 Konstruksi",
    slug: "dasar-k3-konstruksi",
    shortDesc: "Keselamatan dan Kesehatan Kerja di proyek konstruksi — mulai dari SMK3 hingga CSMS.",
    description: "Pelajari prinsip K3 konstruksi, penerapan SMK3, program CSMS untuk kontraktor, dan cara membangun budaya keselamatan di lapangan.",
    category: "konstruksi",
    subcategory: "K3",
    color: "#ef4444",
    emoji: "⛑️",
    instructor: "AGENT-SAFIRA (K3 AI)",
    durationMinutes: 50,
    price: 0,
    level: "beginner",
    sortOrder: 5,
    lessons: [
      { title: "Mengapa K3 Itu Wajib?", slug: "mengapa-k3-wajib", type: "article", durationMinutes: 6, isPreview: true, content: `# Mengapa K3 Itu Wajib?\n\nKeselamatan dan Kesehatan Kerja (K3) bukan pilihan — ini kewajiban hukum dan etika profesional.\n\n## Dasar Hukum K3 Konstruksi\n\n- **UU No. 1 Tahun 1970** — UU Keselamatan Kerja\n- **PP No. 50 Tahun 2012** — SMK3 (Sistem Manajemen K3)\n- **Permen PUPR No. 10 Tahun 2021** — K3 Konstruksi\n- **ISO 45001:2018** — Standar internasional K3\n\n## Fakta K3 Konstruksi Indonesia\n\n- Konstruksi adalah salah satu sektor dengan angka kecelakaan kerja tertinggi\n- Biaya kecelakaan kerja jauh lebih besar dari biaya pencegahan\n- Pelanggaran K3 bisa berujung penghentian proyek dan sanksi pidana\n\n## Manfaat K3 yang Baik\n\n- Mengurangi kecelakaan kerja\n- Meningkatkan produktivitas\n- Memenuhi syarat tender (CSMS score)\n- Meningkatkan reputasi perusahaan` },
      { title: "SMK3 — Sistem Manajemen K3", slug: "smk3-sistem-manajemen", type: "article", durationMinutes: 10, content: `# SMK3 — Sistem Manajemen Keselamatan dan Kesehatan Kerja\n\nSMK3 adalah sistem manajemen yang mengintegrasikan K3 ke dalam keseluruhan manajemen perusahaan.\n\n## Elemen SMK3 (PP 50/2012)\n\n1. **Penetapan Kebijakan K3** — Komitmen manajemen puncak\n2. **Perencanaan K3** — Identifikasi bahaya, penilaian risiko\n3. **Pelaksanaan K3** — Prosedur, pelatihan, komunikasi\n4. **Pemantauan & Evaluasi** — Audit, inspeksi, investigasi kecelakaan\n5. **Peninjauan Ulang** — Review manajemen berkala\n\n## Level SMK3\n\n| Level | Elemen | Pencapaian |\n|-------|--------|------------|\n| Tingkat Awal | 64 elemen | 64% |\n| Tingkat Transisi | 122 elemen | 85% |\n| Tingkat Lanjutan | 166 elemen | 100% |\n\n## Audit SMK3\n\nAudit SMK3 dilakukan oleh lembaga audit eksternal terakreditasi. Sertifikat berlaku 3 tahun dengan surveillance audit tahunan.` },
      { title: "CSMS untuk Kontraktor", slug: "csms-kontraktor", type: "article", durationMinutes: 10, content: `# CSMS — Contractor Safety Management System\n\nCSMS adalah sistem penilaian K3 yang digunakan principal (pemilik proyek) untuk mengevaluasi kemampuan K3 kontraktor sebelum memberikan pekerjaan.\n\n## Tahap Penilaian CSMS\n\n### 1. Pra-Kualifikasi\nKontraktor mengisi kuesioner K3 dan menyerahkan dokumen:\n- Kebijakan K3\n- Statistik kecelakaan (LTIFR, TRIFR)\n- Sertifikat SMK3 (jika ada)\n- Daftar personel K3 bersertifikat\n\n### 2. Site Visit (untuk proyek besar)\nTim CSMS mengunjungi proyek yang sedang berjalan untuk verifikasi lapangan.\n\n### 3. Penilaian & Scoring\nSkor CSMS menentukan status kontraktor:\n- **Green** — Kontraktor pilihan utama\n- **Yellow** — Bisa bekerja dengan pengawasan ketat\n- **Red** — Tidak memenuhi syarat\n\n## Tips Meningkatkan CSMS Score\n\n- Investasi di pelatihan K3 personel\n- Maintain statistik kecelakaan yang baik (zero incident jika memungkinkan)\n- Dokumentasikan semua aktivitas K3 dengan baik` },
    ],
  },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────
async function seedLmsData() {
  try {
    const existing = await db.select().from(lmsCourses).limit(1);
    if (existing.length > 0) return;

    for (const courseData of SEED_COURSES) {
      const { lessons, ...course } = courseData;
      const [created] = await db.insert(lmsCourses).values({
        title: course.title,
        slug: course.slug,
        shortDesc: course.shortDesc,
        description: course.description,
        category: course.category,
        subcategory: course.subcategory,
        color: course.color,
        emoji: course.emoji,
        instructor: course.instructor,
        durationMinutes: course.durationMinutes,
        price: course.price,
        level: course.level,
        isFeatured: course.isFeatured ?? false,
        sortOrder: course.sortOrder,
        isPublic: true,
        isActive: true,
      }).returning();

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        await db.insert(lmsLessons).values({
          courseId: created.id,
          title: lesson.title,
          slug: lesson.slug,
          content: lesson.content,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          isPreview: lesson.isPreview ?? false,
          sortOrder: i + 1,
          isActive: true,
        });
      }
    }
    console.log("[LMS] Seed selesai —", SEED_COURSES.length, "kursus + lesson.");
  } catch (e) {
    console.error("[LMS] Seed error:", e);
  }
}

// ─── Route registration ───────────────────────────────────────────────────────
export function registerLmsRoutes(app: Express) {
  seedLmsData();

  // GET /api/lms/courses — list all public courses (optionally filter by category)
  app.get("/api/lms/courses", async (req, res) => {
    try {
      const { category } = req.query as { category?: string };
      let rows;
      if (category && category !== "all") {
        rows = await db.select().from(lmsCourses)
          .where(and(eq(lmsCourses.isActive, true), eq(lmsCourses.isPublic, true), eq(lmsCourses.category, category)))
          .orderBy(asc(lmsCourses.sortOrder));
      } else {
        rows = await db.select().from(lmsCourses)
          .where(and(eq(lmsCourses.isActive, true), eq(lmsCourses.isPublic, true)))
          .orderBy(asc(lmsCourses.sortOrder));
      }
      // Attach lesson count
      const withCounts = await Promise.all(rows.map(async (c) => {
        const lessons = await db.select().from(lmsLessons)
          .where(and(eq(lmsLessons.courseId, c.id), eq(lmsLessons.isActive, true)));
        return { ...c, lessonCount: lessons.length };
      }));
      res.json(withCounts);
    } catch (e) {
      console.error("[LMS] GET courses:", e);
      res.status(500).json({ error: "Gagal mengambil kursus" });
    }
  });

  // GET /api/lms/courses/:id — course detail + lessons
  app.get("/api/lms/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [course] = await db.select().from(lmsCourses).where(eq(lmsCourses.id, id));
      if (!course) return res.status(404).json({ error: "Kursus tidak ditemukan" });
      const lessons = await db.select().from(lmsLessons)
        .where(and(eq(lmsLessons.courseId, id), eq(lmsLessons.isActive, true)))
        .orderBy(asc(lmsLessons.sortOrder));
      res.json({ ...course, lessons });
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil detail kursus" });
    }
  });

  // GET /api/lms/lessons/:id — single lesson (check enrollment or preview)
  app.get("/api/lms/lessons/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const [lesson] = await db.select().from(lmsLessons).where(eq(lmsLessons.id, id));
      if (!lesson) return res.status(404).json({ error: "Lesson tidak ditemukan" });

      const userId = req.user?.id;
      // If not preview, check enrollment
      if (!lesson.isPreview && !userId) {
        return res.status(403).json({ error: "Harus login untuk mengakses lesson ini", requireLogin: true });
      }
      if (!lesson.isPreview && userId) {
        const [enrollment] = await db.select().from(lmsEnrollments)
          .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, lesson.courseId)));
        // For free courses (price=0) auto-enroll
        const [course] = await db.select().from(lmsCourses).where(eq(lmsCourses.id, lesson.courseId));
        if (!enrollment && course?.price === 0) {
          await db.insert(lmsEnrollments).values({ userId, courseId: lesson.courseId, progress: 0 });
        } else if (!enrollment) {
          return res.status(403).json({ error: "Harus terdaftar di kursus ini", requireEnrollment: true });
        }
      }
      res.json(lesson);
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil lesson" });
    }
  });

  // POST /api/lms/enroll/:courseId — enroll in a course
  app.post("/api/lms/enroll/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      const [existing] = await db.select().from(lmsEnrollments)
        .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, courseId)));
      if (existing) return res.json(existing);
      const [enrollment] = await db.insert(lmsEnrollments)
        .values({ userId, courseId, progress: 0 }).returning();
      res.json(enrollment);
    } catch (e) {
      res.status(500).json({ error: "Gagal mendaftar kursus" });
    }
  });

  // POST /api/lms/progress — mark lesson as complete
  app.post("/api/lms/progress", isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId, courseId } = req.body;
      const userId = req.user.id;

      // Upsert progress
      const [existing] = await db.select().from(lmsLessonProgress)
        .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.lessonId, lessonId)));
      if (!existing) {
        await db.insert(lmsLessonProgress).values({ userId, courseId, lessonId });
      }

      // Recalculate course progress
      const allLessons = await db.select().from(lmsLessons)
        .where(and(eq(lmsLessons.courseId, courseId), eq(lmsLessons.isActive, true)));
      const completedLessons = await db.select().from(lmsLessonProgress)
        .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.courseId, courseId)));
      const progress = Math.round((completedLessons.length / allLessons.length) * 100);

      await db.update(lmsEnrollments)
        .set({ progress, completedAt: progress === 100 ? new Date() : null })
        .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, courseId)));

      res.json({ progress, completed: completedLessons.map(l => l.lessonId) });
    } catch (e) {
      res.status(500).json({ error: "Gagal update progress" });
    }
  });

  // GET /api/lms/my-courses — enrolled courses with progress
  app.get("/api/lms/my-courses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const enrollments = await db.select().from(lmsEnrollments)
        .where(eq(lmsEnrollments.userId, userId));
      const results = await Promise.all(enrollments.map(async (e) => {
        const [course] = await db.select().from(lmsCourses).where(eq(lmsCourses.id, e.courseId));
        const completed = await db.select().from(lmsLessonProgress)
          .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.courseId, e.courseId)));
        return { ...e, course, completedLessons: completed.map(l => l.lessonId) };
      }));
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil kursus saya" });
    }
  });

  // GET /api/lms/progress/:courseId — get my progress for a specific course
  app.get("/api/lms/progress/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      const [enrollment] = await db.select().from(lmsEnrollments)
        .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, courseId)));
      const completed = await db.select().from(lmsLessonProgress)
        .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.courseId, courseId)));
      res.json({
        enrolled: !!enrollment,
        progress: enrollment?.progress ?? 0,
        completedLessons: completed.map(l => l.lessonId),
        completedAt: enrollment?.completedAt ?? null,
      });
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil progress" });
    }
  });

  // GET /api/lms/ecourses — public orchestrator agents grouped by category, usable as ecourses
  app.get("/api/lms/ecourses", async (req, res) => {
    try {
      const { category } = req.query as { category?: string };
      let extra = "";
      if (category && category !== "all") {
        const safe = category.replace(/'/g, "''");
        extra = ` AND lower(a.category) = lower('${safe}')`;
      }
      const rows = await db.execute(sql.raw(`
        SELECT
          a.id,
          a.name,
          a.description,
          a.tagline,
          a.avatar,
          a.category,
          a.subcategory,
          a.widget_color,
          (SELECT COUNT(*)::int FROM knowledge_bases kb WHERE kb.agent_id = a.id AND kb.status = 'active') AS kb_count
        FROM agents a
        WHERE a.is_public = true
          AND a.is_orchestrator = true
          AND a.category IS NOT NULL AND a.category != ''
          AND (a.description IS NOT NULL AND length(a.description) > 20)
          ${extra}
        ORDER BY a.category ASC, a.id ASC
        LIMIT 200
      `));
      res.json(rows.rows ?? rows);
    } catch (e) {
      console.error("[LMS] GET ecourses:", e);
      res.status(500).json({ error: "Gagal mengambil ecourse" });
    }
  });
}
