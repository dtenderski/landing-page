import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

export async function seedPerijinanSertifikasi(userId: string) {
  try {
    const existingSeries = await storage.getSeries();
    const existing = existingSeries.find((s: any) => s.name === "Regulasi Jasa Konstruksi");
    if (existing) {
      log("[Seed] Regulasi Jasa Konstruksi series already exists, skipping");
      return;
    }

    const oldExisting = existingSeries.find((s: any) => s.name === "Perijinan dan Sertifikasi Jasa Konstruksi");
    if (oldExisting) {
      log("[Seed] Legacy Perijinan series exists, skipping");
      return;
    }

    log("[Seed] Creating Regulasi Jasa Konstruksi ecosystem...");

    const series = await storage.createSeries({
      name: "Regulasi Jasa Konstruksi",
      slug: "regulasi-jasa-konstruksi",
      description: "Ekosistem chatbot AI untuk membantu profesional dan perusahaan jasa konstruksi dalam memahami dan mematuhi regulasi, mengurus perijinan, sertifikasi, serta mengembangkan bisnis di sektor konstruksi Indonesia. Mencakup kepatuhan hukum, pengembangan usaha, manajemen risiko regulasi, dan tender pengadaan.",
      tagline: "Panduan Lengkap Regulasi & Bisnis Jasa Konstruksi Indonesia",
      coverImage: "",
      color: "#059669",
      category: "engineering",
      tags: ["regulasi", "konstruksi", "kepatuhan", "sertifikasi", "tender", "bisnis"],
      language: "id",
      isPublic: true,
      isFeatured: true,
      sortOrder: 2,
    } as any, userId);

    const seriesId = series.id;

    const bigIdeasData = [
      {
        name: "Kepatuhan & Compliance",
        type: "problem",
        description: "Modul kepatuhan: memastikan perusahaan dan tenaga kerja konstruksi memenuhi seluruh persyaratan hukum, regulasi, dan standar yang berlaku. Fokus pada pemenuhan kewajiban legal agar dapat beroperasi secara sah dan terhindar dari sanksi.",
        goals: ["Memastikan kelengkapan perijinan usaha", "Menjaga validitas sertifikasi badan usaha dan tenaga kerja", "Kepatuhan terhadap standar dan regulasi teknis", "Persiapan audit dan inspeksi"],
        targetAudience: "Perusahaan jasa konstruksi, admin perijinan, compliance officer, tenaga ahli konstruksi",
        expectedOutcome: "Perusahaan dan tenaga kerja beroperasi sepenuhnya sesuai regulasi yang berlaku",
        sortOrder: 1,
        isActive: true,
        toolboxes: [
          {
            name: "1. Perijinan Usaha Dasar",
            description: "Domain perijinan usaha dasar jasa konstruksi — fondasi legal yang harus ada sebelum proses lainnya",
            purpose: "Memandu pengurusan NIB, OSS, KBLI, dan izin operasional dasar sebagai prasyarat SBU",
            capabilities: ["Registrasi OSS/NIB", "Pemilihan KBLI konstruksi", "Pengurusan IUJK", "Kepatuhan PP 14/2021"],
            sortOrder: 1,
            agents: [
              { name: "Checklist Perijinan Usaha", desc: "Checklist lengkap persyaratan perijinan usaha jasa konstruksi dari NIB hingga izin operasional.", tagline: "Verifikasi kelengkapan perijinan usaha", prompt: "Kamu adalah asisten checklist perijinan usaha konstruksi. Bantu pengguna memverifikasi kelengkapan perijinan dari NIB, IUJK, hingga izin sektoral. Tanyakan jenis usaha dan skala perusahaan terlebih dahulu. Tekankan bahwa perijinan dasar ini harus selesai sebelum mengurus SBU." },
              { name: "Formulir Registrasi OSS", desc: "Panduan step-by-step registrasi dan pengisian data di sistem OSS RBA untuk usaha jasa konstruksi.", tagline: "Panduan registrasi OSS untuk konstruksi", prompt: "Kamu adalah asisten registrasi OSS. Pandu pengguna dalam proses registrasi OSS RBA step-by-step: pemilihan KBLI konstruksi yang tepat, pengisian data perusahaan, dan pengurusan perijinan berusaha berbasis risiko." },
              { name: "Panduan Kepatuhan PP 14/2021", desc: "Panduan pemahaman dan kepatuhan terhadap PP No. 14 Tahun 2021 tentang Usaha Jasa Konstruksi.", tagline: "Panduan PP 14/2021 Jasa Konstruksi", prompt: "Kamu adalah asisten regulasi PP 14/2021. Bantu pengguna memahami kewajiban dan hak berdasarkan PP 14/2021. Jelaskan persyaratan yang berlaku, sanksi pelanggaran, dan cara memastikan kepatuhan." },
            ]
          },
          {
            name: "2. SKK (Sertifikasi Kompetensi Kerja)",
            description: "Domain sertifikasi kompetensi kerja untuk tenaga kerja konstruksi — bisa paralel dengan SBU karena SBU membutuhkan data tenaga ahli bersertifikat",
            purpose: "Membantu persiapan dan pengurusan SKK di semua jenjang sebagai prasyarat personel untuk SBU",
            capabilities: ["Jenjang kualifikasi SKK", "Persiapan portofolio", "Simulasi ujian", "Pemeliharaan sertifikat"],
            sortOrder: 2,
            agents: [
              { name: "Checklist Dokumen SKK", desc: "Checklist persyaratan dokumen untuk pengajuan SKK per jenjang kualifikasi (Ahli Utama, Madya, Muda, Operator/Teknisi).", tagline: "Verifikasi kelengkapan dokumen SKK", prompt: "Kamu adalah asisten checklist SKK. Tanyakan jenjang kualifikasi yang dituju (Ahli Utama/Madya/Muda/Operator/Teknisi) dan sub-bidang, lalu berikan checklist dokumen yang diperlukan secara lengkap dan terstruktur." },
              { name: "Panduan Portofolio SKK", desc: "Panduan penyusunan portofolio dan bukti kompetensi untuk asesmen SKK.", tagline: "Susun portofolio SKK yang memenuhi syarat", prompt: "Kamu adalah asisten penyusunan portofolio SKK. Bantu pengguna menyusun portofolio yang memenuhi persyaratan asesmen. Jelaskan format, contoh bukti kerja yang valid, dan tips agar portofolio lolos evaluasi." },
              { name: "Simulasi Ujian SKK", desc: "Simulasi soal ujian dan wawancara kompetensi untuk persiapan asesmen SKK.", tagline: "Latihan simulasi ujian SKK", prompt: "Kamu adalah simulator ujian SKK. Berikan soal-soal latihan yang relevan dengan jenjang dan sub-bidang yang dipilih. Simulasikan juga sesi wawancara kompetensi. Berikan feedback dan penjelasan untuk setiap jawaban." },
            ]
          },
          {
            name: "3. SBU (Sertifikasi Badan Usaha)",
            description: "Domain sertifikasi badan usaha jasa konstruksi — membutuhkan perijinan dasar dan SKK tenaga ahli yang sudah siap",
            purpose: "Memandu proses pengurusan, perpanjangan, dan peningkatan SBU setelah perijinan dan SKK terpenuhi",
            capabilities: ["Klasifikasi & kualifikasi SBU", "Proses pengajuan baru", "Perpanjangan & peningkatan grade", "Persyaratan PJT/PJBU"],
            sortOrder: 3,
            agents: [
              { name: "Checklist Persyaratan SBU", desc: "Checklist interaktif untuk memverifikasi kelengkapan dokumen dan persyaratan pengajuan SBU berdasarkan klasifikasi dan kualifikasi yang dipilih.", tagline: "Verifikasi kelengkapan persyaratan SBU", prompt: "Kamu adalah asisten checklist SBU. Bantu pengguna memverifikasi kelengkapan dokumen dan persyaratan untuk pengajuan, perpanjangan, atau peningkatan SBU jasa konstruksi. Tanyakan klasifikasi (umum/spesialis), sub-klasifikasi, dan kualifikasi (kecil/menengah/besar) terlebih dahulu, lalu berikan checklist yang sesuai. Pastikan perijinan dasar (NIB, OSS) dan SKK tenaga ahli sudah dimiliki." },
              { name: "Formulir Pengajuan SBU", desc: "Panduan pengisian formulir dan proses step-by-step pengajuan SBU baru melalui sistem LPJK dan OSS.", tagline: "Panduan pengisian formulir SBU", prompt: "Kamu adalah asisten formulir SBU. Pandu pengguna dalam mengisi formulir pengajuan SBU secara step-by-step. Jelaskan setiap field yang perlu diisi, dokumen yang perlu dilampirkan, dan tips agar pengajuan berhasil." },
              { name: "Kalkulator Grade SBU", desc: "Alat bantu untuk menghitung dan menentukan grade SBU yang sesuai berdasarkan kekayaan bersih, pengalaman, dan tenaga ahli perusahaan.", tagline: "Hitung kualifikasi grade SBU Anda", prompt: "Kamu adalah kalkulator grade SBU. Bantu pengguna menentukan grade SBU yang tepat berdasarkan: kekayaan bersih perusahaan, pengalaman pekerjaan, jumlah dan kualifikasi tenaga ahli, serta peralatan. Berikan analisis apakah perusahaan memenuhi syarat untuk grade tertentu." },
            ]
          },
          {
            name: "4. Standar & Regulasi Teknis",
            description: "Domain standar nasional dan regulasi teknis — penguatan jangka panjang untuk meningkatkan kelas usaha",
            purpose: "Membantu pemahaman dan penerapan SNI, UU, PP, dan Permen terkait konstruksi",
            capabilities: ["UU 2/2017 Jasa Konstruksi", "SNI konstruksi", "Permen PUPR", "Interpretasi regulasi"],
            sortOrder: 4,
            agents: [
              { name: "Panduan UU Jasa Konstruksi", desc: "Panduan pemahaman UU No. 2/2017 tentang Jasa Konstruksi dan PP turunannya.", tagline: "Navigasi regulasi jasa konstruksi", prompt: "Kamu adalah asisten regulasi jasa konstruksi. Bantu pengguna memahami UU No. 2/2017 dan peraturan turunannya. Jelaskan pasal-pasal penting, kewajiban para pihak, dan implikasi praktisnya." },
              { name: "Referensi SNI Konstruksi", desc: "Panduan dan referensi Standar Nasional Indonesia yang berlaku di sektor konstruksi.", tagline: "Referensi standar SNI konstruksi", prompt: "Kamu adalah asisten referensi SNI konstruksi. Bantu pengguna menemukan dan memahami SNI yang relevan: SNI beton, baja, gempa, keselamatan, dan standar teknis lainnya. Jelaskan penerapan praktisnya." },
            ]
          },
        ]
      },
      {
        name: "Pengembangan Bisnis",
        type: "inspiration",
        description: "Modul pengembangan bisnis: membantu perusahaan jasa konstruksi bertumbuh melalui strategi tender, perluasan klasifikasi, peningkatan kapasitas, dan penguatan daya saing di pasar konstruksi Indonesia.",
        goals: ["Memenangkan tender secara kompetitif", "Memperluas klasifikasi dan kualifikasi usaha", "Meningkatkan kapasitas organisasi", "Membangun reputasi dan track record"],
        targetAudience: "Direktur perusahaan konstruksi, manajer pengembangan bisnis, estimator, admin tender",
        expectedOutcome: "Perusahaan mampu tumbuh dan bersaing secara strategis di pasar konstruksi",
        sortOrder: 2,
        isActive: true,
        toolboxes: [
          {
            name: "1. Kontrak & Administrasi Proyek",
            description: "Domain manajemen kontrak konstruksi — fondasi yang harus dipahami sebelum ikut tender dan mengelola proyek",
            purpose: "Membantu pemahaman kontrak, administrasi, dan penyelesaian klaim sebagai dasar bisnis konstruksi",
            capabilities: ["Administrasi kontrak", "Change order", "Klaim dan dispute", "FIDIC dan standar kontrak"],
            sortOrder: 1,
            agents: [
              { name: "Checklist Kontrak Konstruksi", desc: "Checklist poin-poin penting yang harus diperhatikan dalam kontrak konstruksi.", tagline: "Review poin kritis kontrak konstruksi", prompt: "Kamu adalah asisten review kontrak konstruksi. Bantu pengguna mereview kontrak: klausul pembayaran, lingkup pekerjaan, jadwal, denda keterlambatan, force majeure, penyelesaian sengketa, dan jaminan. Identifikasi poin risiko tinggi." },
              { name: "Panduan Klaim Konstruksi", desc: "Panduan penyusunan dan pengelolaan klaim dalam proyek konstruksi.", tagline: "Panduan penyusunan klaim proyek", prompt: "Kamu adalah asisten klaim konstruksi. Bantu pengguna menyusun klaim: perpanjangan waktu, eskalasi harga, pekerjaan tambah kurang, dan dispute. Jelaskan prosedur, dokumen pendukung, dan strategi negosiasi." },
            ]
          },
          {
            name: "2. Tender & Pengadaan",
            description: "Domain tender dan pengadaan jasa konstruksi — proses operasional untuk mendapatkan proyek",
            purpose: "Membantu perusahaan mengikuti dan memenangkan tender secara kompetitif",
            capabilities: ["e-Procurement LKPP/LPSE", "Penyusunan dokumen penawaran", "Strategi pricing", "Evaluasi dan negosiasi"],
            sortOrder: 2,
            agents: [
              { name: "Checklist Dokumen Tender", desc: "Checklist lengkap dokumen kualifikasi dan penawaran untuk mengikuti tender konstruksi.", tagline: "Verifikasi kelengkapan dokumen tender", prompt: "Kamu adalah asisten checklist tender konstruksi. Bantu pengguna memverifikasi kelengkapan dokumen untuk tender: dokumen kualifikasi (administratif, teknis, keuangan), dokumen penawaran teknis, dan penawaran harga. Tanyakan jenis tender (pemerintah/swasta) dan metode evaluasi." },
              { name: "Formulir Evaluasi Penawaran", desc: "Alat bantu untuk mengevaluasi kekuatan dan kelemahan dokumen penawaran sebelum disubmit.", tagline: "Evaluasi kualitas penawaran tender Anda", prompt: "Kamu adalah asisten evaluasi penawaran tender. Bantu pengguna mengevaluasi dokumen penawarannya: apakah sudah lengkap, apakah harga kompetitif, apakah metode pelaksanaan realistis, dan apakah jadwal feasible. Berikan skor dan rekomendasi perbaikan." },
              { name: "Panduan e-Procurement", desc: "Panduan penggunaan sistem e-procurement pemerintah (LPSE/LKPP) untuk tender konstruksi.", tagline: "Panduan sistem e-procurement LKPP", prompt: "Kamu adalah asisten e-procurement. Pandu pengguna dalam menggunakan sistem LPSE: registrasi, pencarian tender, upload dokumen, aanwijzing online, pembukaan penawaran, dan tracking status tender." },
            ]
          },
          {
            name: "3. Strategi Peningkatan Grade",
            description: "Domain strategi peningkatan kualifikasi dan klasifikasi usaha — pengembangan jangka panjang",
            purpose: "Membantu perusahaan merencanakan dan melaksanakan peningkatan kapasitas usaha secara strategis",
            capabilities: ["Analisis gap kualifikasi", "Roadmap peningkatan", "Strategi penambahan klasifikasi", "Perencanaan sumber daya"],
            sortOrder: 3,
            agents: [
              { name: "Analisis Gap Kualifikasi", desc: "Alat analisis kesenjangan antara posisi perusahaan saat ini dengan target grade/klasifikasi yang diinginkan.", tagline: "Identifikasi gap menuju grade target", prompt: "Kamu adalah analis gap kualifikasi. Bantu pengguna mengidentifikasi kesenjangan antara kondisi perusahaan saat ini (kekayaan bersih, pengalaman, tenaga ahli, peralatan) dengan persyaratan grade SBU yang ditargetkan. Berikan roadmap perbaikan." },
              { name: "Roadmap Pengembangan Usaha", desc: "Panduan penyusunan roadmap strategis untuk pengembangan dan pertumbuhan usaha konstruksi.", tagline: "Susun roadmap pertumbuhan bisnis", prompt: "Kamu adalah konsultan pengembangan bisnis konstruksi. Bantu pengguna menyusun roadmap pengembangan usaha: dari peningkatan grade, penambahan klasifikasi, hingga strategi pasar. Berikan timeline dan milestone yang realistis." },
            ]
          },
        ]
      },
      {
        name: "Manajemen Risiko Regulasi",
        type: "mentoring",
        description: "Modul manajemen risiko: mengidentifikasi, menilai, dan memitigasi risiko yang timbul dari perubahan regulasi, ketidakpatuhan, dan kompleksitas birokrasi di sektor konstruksi Indonesia.",
        goals: ["Identifikasi risiko regulasi proaktif", "Mitigasi risiko ketidakpatuhan", "Persiapan menghadapi audit dan inspeksi", "Monitoring perubahan regulasi"],
        targetAudience: "Risk manager, compliance officer, manajer proyek, konsultan hukum konstruksi",
        expectedOutcome: "Perusahaan memiliki sistem manajemen risiko regulasi yang proaktif dan terstruktur",
        sortOrder: 3,
        isActive: true,
        toolboxes: [
          {
            name: "1. Monitoring Regulasi",
            description: "Domain pemantauan perubahan regulasi — fondasi untuk mengetahui regulasi apa yang berlaku dan berubah",
            purpose: "Membantu perusahaan tetap update dengan perubahan regulasi terbaru sebagai dasar manajemen risiko",
            capabilities: ["Tracking perubahan UU/PP", "Analisis dampak regulasi baru", "Masa transisi regulasi", "Alert regulasi"],
            sortOrder: 1,
            agents: [
              { name: "Analisis Dampak Regulasi", desc: "Alat analisis dampak perubahan regulasi terhadap operasional perusahaan konstruksi.", tagline: "Analisis dampak regulasi baru", prompt: "Kamu adalah analis dampak regulasi. Bantu pengguna menganalisis dampak perubahan regulasi terhadap perusahaannya: apa yang berubah, apa yang harus dilakukan, timeline kepatuhan, dan estimasi biaya adaptasi." },
              { name: "Panduan Masa Transisi", desc: "Panduan navigasi masa transisi ketika terjadi perubahan regulasi di sektor konstruksi.", tagline: "Navigasi transisi regulasi baru", prompt: "Kamu adalah asisten transisi regulasi. Bantu pengguna menavigasi masa transisi regulasi baru: ketentuan yang masih berlaku, ketentuan baru yang harus dipatuhi, timeline compliance, dan langkah-langkah migrasi." },
            ]
          },
          {
            name: "2. Audit & Inspeksi",
            description: "Domain persiapan dan pelaksanaan audit kepatuhan — memastikan perusahaan siap menghadapi pemeriksaan",
            purpose: "Membantu perusahaan mempersiapkan dan melewati proses audit dengan lancar",
            capabilities: ["Checklist audit kepatuhan", "Simulasi inspeksi", "Dokumentasi bukti kepatuhan", "Remediasi temuan"],
            sortOrder: 2,
            agents: [
              { name: "Checklist Kesiapan Audit", desc: "Checklist komprehensif untuk mempersiapkan audit kepatuhan perijinan dan sertifikasi konstruksi.", tagline: "Persiapan audit perijinan dan sertifikasi", prompt: "Kamu adalah asisten persiapan audit konstruksi. Bantu pengguna mempersiapkan audit: kelengkapan dokumen perijinan, validitas sertifikasi, kepatuhan K3, dan standar mutu. Berikan checklist terstruktur per area audit." },
              { name: "Panduan Remediasi Temuan", desc: "Panduan penanganan dan remediasi temuan audit atau pelanggaran regulasi.", tagline: "Tindak lanjut temuan audit", prompt: "Kamu adalah asisten remediasi audit. Bantu pengguna menangani temuan audit: prioritasi temuan, rencana tindak lanjut, timeline perbaikan, dan dokumentasi remediasi. Berikan contoh surat tanggapan dan rencana aksi." },
            ]
          },
          {
            name: "3. Sanksi & Penyelesaian",
            description: "Domain penanganan sanksi dan sengketa — penyelesaian masalah jika terjadi pelanggaran",
            purpose: "Membantu perusahaan menangani dan menyelesaikan masalah sanksi atau sengketa regulasi",
            capabilities: ["Jenis sanksi dan remedi", "Prosedur banding", "Mediasi dan arbitrase", "Pencegahan pengulangan"],
            sortOrder: 3,
            agents: [
              { name: "Panduan Penanganan Sanksi", desc: "Panduan penanganan sanksi administratif, denda, atau pencabutan izin di sektor konstruksi.", tagline: "Tangani sanksi regulasi konstruksi", prompt: "Kamu adalah asisten penanganan sanksi konstruksi. Bantu pengguna memahami jenis sanksi yang dihadapi, opsi penyelesaian (banding, remediasi, mediasi), timeline penanganan, dan langkah pencegahan pengulangan." },
            ]
          },
        ]
      },
    ];

    let totalToolboxes = 0;
    let totalAgents = 0;

    const hubToolbox = await storage.createToolbox({
      name: `Regulasi Jasa Konstruksi HUB`,
      description: `Chatbot Orkestrator yang mengoordinasikan semua chatbot spesialis dalam Regulasi Jasa Konstruksi.`,
      isOrchestrator: true,
      seriesId: seriesId,
      bigIdeaId: null,
      isActive: true,
      sortOrder: 0,
      purpose: "Mengoordinasikan semua chatbot spesialis dalam Regulasi Jasa Konstruksi",
      capabilities: [],
      limitations: [],
    } as any);

    const orchestrator = await storage.createAgent({
      name: "Regulasi Jasa Konstruksi Orchestrator",
      description: "Chatbot orkestrator utama untuk ekosistem Regulasi Jasa Konstruksi. Mengarahkan pengguna ke modul dan alat bantu yang tepat.",
      tagline: "Asisten AI Utama Regulasi Jasa Konstruksi",
      category: "engineering",
      subcategory: "construction-regulation",
      isPublic: true,
      isOrchestrator: true,
      aiModel: "gpt-4o",
      temperature: "0.7",
      maxTokens: 2048,
      toolboxId: parseInt(hubToolbox.id),
      systemPrompt: `Kamu adalah Orchestrator utama untuk ekosistem Regulasi Jasa Konstruksi.\n\nPeran kamu adalah:\n1. Memahami kebutuhan pengguna\n2. Mengarahkan ke modul dan alat bantu yang tepat\n3. Memberikan gambaran umum sebelum mengarahkan ke spesialis\n4. Menjawab pertanyaan umum tentang regulasi jasa konstruksi`,
      greetingMessage: `Selamat datang di Regulasi Jasa Konstruksi!\n\nSaya adalah asisten utama yang akan membantu mengarahkan Anda ke layanan yang tepat.\n\nSilakan ceritakan kebutuhan Anda.`,
      personality: "Profesional, terstruktur, dan responsif",
    } as any);

    for (const biData of bigIdeasData) {
      const bigIdea = await storage.createBigIdea({
        seriesId: seriesId,
        name: biData.name,
        type: biData.type,
        description: biData.description,
        goals: biData.goals,
        targetAudience: biData.targetAudience,
        expectedOutcome: biData.expectedOutcome,
        sortOrder: biData.sortOrder,
        isActive: biData.isActive,
      } as any);

      for (const tbData of biData.toolboxes) {
        const toolbox = await storage.createToolbox({
          bigIdeaId: bigIdea.id,
          name: tbData.name,
          description: tbData.description,
          purpose: tbData.purpose,
          capabilities: tbData.capabilities,
          sortOrder: tbData.sortOrder,
          isActive: true,
        } as any);
        totalToolboxes++;

        for (const agentData of tbData.agents) {
          await storage.createAgent({
            name: agentData.name,
            description: agentData.desc,
            tagline: agentData.tagline,
            category: "engineering",
            subcategory: "construction-regulation",
            isPublic: true,
            aiModel: "gpt-4o-mini",
            temperature: "0.7",
            maxTokens: 1024,
            toolboxId: parseInt(toolbox.id),
            parentAgentId: parseInt(orchestrator.id),
            systemPrompt: agentData.prompt,
            greetingMessage: `Halo! Saya ${agentData.name}. ${agentData.desc}\n\nSilakan mulai dengan menceritakan kebutuhan Anda.`,
            personality: "Profesional, detail, dan membantu",
          } as any);
          totalAgents++;
        }
      }

      log(`[Seed] Created Big Idea: ${biData.name} (${biData.toolboxes.length} toolboxes, ${biData.toolboxes.reduce((sum: number, tb: any) => sum + tb.agents.length, 0)} agents)`);
    }

    log(`[Seed] Regulasi Jasa Konstruksi ecosystem created successfully!`);
    log(`[Seed] Total: 1 Series (Goal), 1 HUB + 1 Orchestrator, ${bigIdeasData.length} Big Ideas (Modul), ${totalToolboxes} Toolboxes (Domain), ${totalAgents} Agents (Alat)`);
  } catch (error) {
    log(`[Seed] Error creating Regulasi Jasa Konstruksi ecosystem: ${error}`);
  }
}
