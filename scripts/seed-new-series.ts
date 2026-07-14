import { Pool, type PoolClient } from "pg";

process.on("uncaughtException", (e) => {
  process.stderr.write(`\n[uncaughtException] ${e instanceof Error ? e.stack ?? e.message : String(e)}\n`);
});
process.on("unhandledRejection", (e) => {
  process.stderr.write(`\n[unhandledRejection] ${e instanceof Error ? e.stack ?? e.message : String(e)}\n`);
});
process.on("exit", (code) => {
  process.stderr.write(`\n[exit] code=${code}\n`);
});

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!DATABASE_URL) throw new Error("DATABASE_URL required");
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY required");

const pool = new Pool({ connectionString: DATABASE_URL });

const MODEL = "gemini-2.5-flash";
const CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 30000;
let callCounter = 0;

const BRAND_VOICE_KONSTRUKSI = `Komunikasi profesional namun mudah dipahami. Gunakan bahasa Indonesia formal dengan istilah teknis konstruksi yang akurat (kontraktor, konsultan, owner, MK, EPC, BAST, MC, dll.). Selalu kontekstualisasikan jawaban dengan referensi regulasi PUPR/LKPP/LPJK/LPJK Pusat ketika relevan. Hindari jargon Inggris jika ada padanan Indonesia yang sudah baku. Saat memberikan angka (denda, retensi, jaminan), sertakan dasar pasalnya.`;

const INTERACTION_POLICY_KONSTRUKSI = `Selalu mulai dengan klarifikasi konteks proyek (nilai kontrak, jenis pekerjaan, posisi pengguna) sebelum memberikan rekomendasi spesifik. Jika permintaan ambigu, ajukan 1-2 pertanyaan klarifikasi. Susun jawaban dengan struktur: (1) Ringkasan, (2) Detail/langkah, (3) Risiko/peringatan, (4) Sumber/referensi. Untuk pertanyaan kompleks (>3 paragraf), tutup dengan "Ringkasan Kunci" 3-5 poin.`;

const QUALITY_BAR_KONSTRUKSI = `Setiap jawaban berdasarkan informasi terverifikasi: regulasi resmi (PP, Permen, Perlem LKPP, SE), standar (SNI, FIDIC, ISO), atau praktik industri yang dapat dirujuk. Jangan memberikan angka, tarif, atau prosedur spesifik tanpa konteks dasar hukumnya. Jika informasi tidak ada di knowledge base, nyatakan jujur dan arahkan ke sumber resmi (LKPP, Kementerian PUPR, BANI, BNSP). Gunakan format terstruktur (poin, tabel singkat, numbering) untuk prosedur multi-langkah.`;

const RISK_COMPLIANCE_KONSTRUKSI = `Selalu ingatkan pengguna bahwa jawaban bersifat informatif, bukan opini hukum/teknis profesional yang mengikat. Untuk keputusan yang berimplikasi finansial besar (>Rp 500 juta), legal, atau keselamatan, WAJIB sarankan konsultasi dengan ahli profesional bersertifikat (advokat konstruksi, ahli K3, PPK, MK, atau lembaga sertifikasi resmi). Jangan pernah memberikan jaminan hasil. Tolak permintaan yang melanggar etika profesi, anti-suap (SMAP/ISO 37001), atau aturan persaingan usaha (UU 5/1999).`;

const OFF_TOPIC_KONSTRUKSI = `Maaf, saya adalah asisten AI khusus untuk topik [DOMAIN]. Pertanyaan Anda di luar lingkup keahlian saya. Untuk pertanyaan ini, saya sarankan menggunakan asisten lain di Gustafta yang lebih sesuai, atau berkonsultasi dengan profesional terkait. Apakah ada pertanyaan tentang [DOMAIN] yang bisa saya bantu?`;

interface ToolboxBlueprint {
  name: string;
  isOrchestrator: boolean;
  intent: string;
}

interface BigIdeaBlueprint {
  name: string;
  description: string;
  type: string;
  toolboxes: ToolboxBlueprint[];
}

interface SeriesBlueprint {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  color: string;
  category: string;
  bigIdeas: BigIdeaBlueprint[];
}

const SERIES: SeriesBlueprint[] = [
  // === SERIES B: Tender Konstruksi ===
  {
    name: "Tender Konstruksi & PBJP",
    slug: "tender-konstruksi-pbjp",
    tagline: "AI Strategist untuk Memenangkan Tender Konstruksi Pemerintah & Swasta",
    color: "#dc2626",
    category: "tender",
    description: "Ekosistem chatbot AI untuk seluruh siklus tender konstruksi: dari market intelligence, pemilihan paket, kelengkapan dokumen administrasi/teknis/harga, simulasi scoring evaluasi, hingga strategi konsorsium/JO. Berbasis Perlem LKPP No. 12/2021, Perpres 16/2018 jo. 12/2021, dan SBD (Standar Bidding Document) PUPR. Mendukung 4 metode pemilihan: Tender, Tender Cepat, Penunjukan Langsung, dan Pengadaan Langsung.",
    bigIdeas: [
      {
        name: "Strategi & Persiapan Tender",
        type: "domain",
        description: "Fase pra-tender: analisis pasar, bid-no-bid decision, pemilihan paket, dan persiapan persyaratan kualifikasi.",
        toolboxes: [
          { name: "Tender Strategy Hub", isOrchestrator: true, intent: "Hub orchestrator yang mengarahkan pengguna ke spesialis tender yang tepat berdasarkan fase (pra-tender, tender, pasca-tender) dan jenis paket." },
          { name: "Market Intelligence — LPSE & SPSE Scanner", isOrchestrator: false, intent: "Membantu kontraktor membaca pengumuman tender di LPSE/SPSE: parsing HPS, lokasi, klasifikasi, sub-klasifikasi SBU/SKK yang dibutuhkan, dan tenggat." },
          { name: "Bid-No-Bid Decision Analyzer", isOrchestrator: false, intent: "Menilai kelayakan ikut tender berdasarkan kapasitas keuangan, SBU/SKK, pengalaman sejenis (PK), kompetisi, dan margin proyeksi." },
          { name: "Konsorsium & Joint Operation Planner", isOrchestrator: false, intent: "Memandu pembentukan konsorsium/JO untuk paket besar: pembagian peran, share modal, akta JO, dan kompatibilitas SBU." },
          { name: "Pricing Strategy & HPS Analyzer", isOrchestrator: false, intent: "Membantu menyusun strategi harga penawaran: analisis HPS, biaya overhead, profit margin, dan posisi kompetitif." },
        ],
      },
      {
        name: "Penyusunan Dokumen Penawaran",
        type: "domain",
        description: "Fase tender: penyusunan dokumen administrasi, teknis, dan harga sesuai SBD PUPR/LKPP.",
        toolboxes: [
          { name: "Dokumen Administrasi Builder", isOrchestrator: false, intent: "Memandu penyusunan dokumen administrasi sesuai SBD: surat penawaran, jaminan penawaran, NIB, SBU, ISO, dan dokumen kualifikasi." },
          { name: "Dokumen Teknis & Metode Pelaksanaan Builder", isOrchestrator: false, intent: "Membantu menyusun metode pelaksanaan, jadwal pelaksanaan (S-Curve), daftar personil inti, peralatan, dan RK3K." },
          { name: "RAB & BoQ Pricing Engine", isOrchestrator: false, intent: "Memandu penyusunan Rincian Anggaran Biaya (RAB) dan Bill of Quantity (BoQ) berdasarkan analisa harga satuan, harga pasar, dan margin." },
          { name: "Tender Document Compliance Checker", isOrchestrator: false, intent: "Mengecek kelengkapan dan kepatuhan dokumen penawaran terhadap kriteria evaluasi (LULUS/GUGUR) sebelum upload SPSE." },
          { name: "Sanggahan & Reaktif Strategy Advisor", isOrchestrator: false, intent: "Membantu menyusun sanggahan/sanggah banding dan reaktif jika tender dimenangkan kompetitor secara tidak wajar." },
        ],
      },
    ],
  },

  // === SERIES A1: Pasca Tender ===
  {
    name: "Pasca Tender & Manajemen Kontrak Konstruksi",
    slug: "pasca-tender-manajemen-kontrak",
    tagline: "AI Co-pilot untuk Mengelola Kontrak Konstruksi dari Awarding hingga Closing",
    color: "#7c3aed",
    category: "kontrak",
    description: "Ekosistem chatbot AI untuk fase pasca-tender: dari Surat Penunjukan Penyedia Jasa (SPPBJ), penandatanganan kontrak, mobilisasi, eksekusi kontrak (addendum, MC, change order, klaim), hingga penyelesaian (BAST PHO/FHO, retensi, masa pemeliharaan). Berbasis SBD PUPR, Perlem LKPP No. 12/2021, FIDIC Red/Yellow Book untuk konteks internasional, serta UU Jasa Konstruksi No. 2/2017. Membantu PPK, kontraktor, MK, dan konsultan supervisi.",
    bigIdeas: [
      {
        name: "Awarding & Mobilisasi Kontrak",
        type: "domain",
        description: "Fase awarding: SPPBJ, penandatanganan kontrak, jaminan pelaksanaan, dan mobilisasi proyek.",
        toolboxes: [
          { name: "Manajemen Kontrak Hub", isOrchestrator: true, intent: "Hub orchestrator untuk seluruh siklus pasca-tender: mengarahkan ke awarding, eksekusi, atau closing sesuai fase proyek." },
          { name: "SPPBJ & Kontrak Signing Advisor", isOrchestrator: false, intent: "Memandu proses pasca-pengumuman pemenang: SPPBJ, masa sanggah, penandatanganan kontrak, dan dokumen pendukung." },
          { name: "Bank Garansi & Jaminan Pelaksanaan Builder", isOrchestrator: false, intent: "Menyiapkan jaminan pelaksanaan (5% nilai kontrak), jaminan uang muka, jaminan pemeliharaan, dan asuransi CAR/EAR." },
          { name: "Mobilisasi & Pre-Construction Meeting Planner", isOrchestrator: false, intent: "Memandu PCM, mobilisasi personel, peralatan, material, dan setup site office sesuai jadwal kontrak." },
        ],
      },
      {
        name: "Eksekusi & Pengendalian Kontrak",
        type: "domain",
        description: "Fase eksekusi: addendum, change order, monthly certificate, klaim, dan koordinasi subkontrak.",
        toolboxes: [
          { name: "Addendum & Change Order Manager", isOrchestrator: false, intent: "Menyusun addendum kontrak (CCO/Contract Change Order), variation order, dan justifikasi teknis-administratif sesuai pasal." },
          { name: "Monthly Certificate (MC) & Termin Builder", isOrchestrator: false, intent: "Membantu menyusun MC: opname progress, kalkulasi prestasi, pengurangan retensi, dan dokumen pendukung pencairan termin." },
          { name: "Klaim & Eskalasi Kontrak Advisor", isOrchestrator: false, intent: "Memandu pengajuan klaim (perpanjangan waktu, biaya tambahan, force majeure) dengan dokumentasi kuat dan dasar pasal kontrak." },
          { name: "Subkontrak & Suplai Coordinator", isOrchestrator: false, intent: "Mengelola subkontrak (≤30% nilai kontrak utama), surat perjanjian suplai, dan koordinasi back-to-back dengan kontrak induk." },
        ],
      },
      {
        name: "Penyelesaian & Penutupan Proyek",
        type: "domain",
        description: "Fase closing: BAST, retensi, masa pemeliharaan, dan dispute resolution.",
        toolboxes: [
          { name: "BAST PHO & FHO Documentation Builder", isOrchestrator: false, intent: "Memandu Provisional Hand Over (PHO) dan Final Hand Over (FHO): punch list, BAP, BAST, retensi, dan kelengkapan as-built." },
          { name: "Masa Pemeliharaan & Defect Liability Tracker", isOrchestrator: false, intent: "Tracker masa pemeliharaan (3-12 bulan), defect liability period, dan klaim defect dengan SLA respon." },
          { name: "Dispute Avoidance & Pre-Litigation Advisor", isOrchestrator: false, intent: "Strategi pencegahan dispute selama eksekusi, dokumentasi yang kuat, dan jalur eskalasi non-litigasi (mediasi, dewan sengketa)." },
        ],
      },
    ],
  },

  // === SERIES A2: Pelaksanaan Proyek Lapangan ===
  {
    name: "Pelaksanaan Proyek Konstruksi — Operasional Lapangan",
    slug: "pelaksanaan-proyek-lapangan",
    tagline: "AI Site Engineer untuk Mengeksekusi Proyek Konstruksi di Lapangan",
    color: "#ea580c",
    category: "operasional",
    description: "Ekosistem chatbot AI untuk operasional harian proyek konstruksi: perencanaan eksekusi (RAB pelaksanaan, master schedule, method statement), operasional lapangan (DPR, opname, logistik material, K3 lapangan), dan pengendalian (EVM, NCR, punch list, MC tracking). Untuk Site Manager, Site Engineer, QS, QA/QC, K3, dan Logistic. Berbasis praktik kontraktor BUMN/swasta nasional, SNI 03 series, dan PMBOK 7th adapted untuk konstruksi Indonesia.",
    bigIdeas: [
      {
        name: "Perencanaan Eksekusi Proyek",
        type: "domain",
        description: "Fase planning: RAB pelaksanaan, schedule master, method statement, dan resource loading.",
        toolboxes: [
          { name: "Site Operations Hub", isOrchestrator: true, intent: "Hub orchestrator untuk operasional lapangan: mengarahkan ke spesialis perencanaan, eksekusi, atau pengendalian sesuai kebutuhan tim." },
          { name: "RAB Pelaksanaan & Cost Plan Builder", isOrchestrator: false, intent: "Membantu menyusun RAB Pelaksanaan (berbeda dengan RAB tender): cost plan harian, target cost vs actual, dan margin tracking." },
          { name: "Master Schedule & S-Curve Planner", isOrchestrator: false, intent: "Menyusun master schedule (CPM/Gantt), kurva S, milestone, dan critical path analysis untuk proyek konstruksi." },
          { name: "Method Statement & SOP Builder", isOrchestrator: false, intent: "Memandu penyusunan method statement per item pekerjaan: alur kerja, peralatan, personil, K3, dan inspection point." },
          { name: "Resource Loading & Material Plan Builder", isOrchestrator: false, intent: "Perencanaan kebutuhan material, peralatan, dan tenaga kerja per minggu sesuai master schedule." },
        ],
      },
      {
        name: "Operasional & Eksekusi Lapangan",
        type: "domain",
        description: "Fase eksekusi harian: progress report, opname, logistik, koordinasi subkon, dan K3 lapangan.",
        toolboxes: [
          { name: "Daily Progress Report (DPR) Builder", isOrchestrator: false, intent: "Membantu menyusun DPR harian: progress fisik, manpower, material, peralatan, cuaca, kendala, dan foto dokumentasi." },
          { name: "Opname & Quantity Surveyor Assistant", isOrchestrator: false, intent: "Memandu opname mingguan/bulanan: pengukuran volume, kalkulasi prestasi, rekonsiliasi BoQ vs aktual, dan input MC." },
          { name: "Material Approval & Logistik Coordinator", isOrchestrator: false, intent: "Mengelola material approval (mock-up, sample, mill certificate), logistik kedatangan, gudang, dan FIFO." },
          { name: "Subkontraktor & Mandor Coordination Manager", isOrchestrator: false, intent: "Koordinasi harian dengan subkon dan mandor: target harian, evaluasi kinerja, payment milestone, dan eskalasi konflik." },
          { name: "K3 Lapangan & Toolbox Talk Builder", isOrchestrator: false, intent: "K3 praktis lapangan: toolbox talk harian, JSA, P2K3, induksi pekerja baru, dan tracking near-miss/incident." },
        ],
      },
      {
        name: "Pengendalian & Pelaporan Proyek",
        type: "domain",
        description: "Fase control: EVM, variance analysis, NCR, punch list, dan progress reporting ke owner/MK.",
        toolboxes: [
          { name: "Earned Value Management (EVM) Calculator", isOrchestrator: false, intent: "Menghitung EVM (PV, EV, AC, CPI, SPI, EAC) dan memberikan analisis kesehatan proyek dari sisi waktu dan biaya." },
          { name: "NCR & CAPA Management Tracker", isOrchestrator: false, intent: "Mengelola Non-Conformance Report (NCR), Corrective Action Preventive Action (CAPA), dan tracking closing." },
          { name: "Punch List & Defect Tracker", isOrchestrator: false, intent: "Mengelola punch list (item belum selesai), defect, dan tracking penyelesaian sebelum BAST PHO." },
          { name: "Weekly Progress Report ke Owner Builder", isOrchestrator: false, intent: "Menyusun laporan progress mingguan ke owner/MK: fisik, biaya, schedule, isu kritis, dan rekomendasi keputusan." },
        ],
      },
    ],
  },

  // === SERIES A3: Legalitas Jasa Konstruksi ===
  {
    name: "Legalitas Jasa Konstruksi",
    slug: "legalitas-jasa-konstruksi",
    tagline: "AI Legal Advisor untuk Aspek Hukum Industri Konstruksi Indonesia",
    color: "#0891b2",
    category: "legal",
    description: "Ekosistem chatbot AI untuk seluruh aspek hukum industri jasa konstruksi: kontrak konstruksi (FIDIC, SBD PUPR, kontrak swasta), sengketa & dispute resolution (mediasi, BANI, dewan sengketa, litigasi), dan hukum operasional (ketenagakerjaan, pajak konstruksi, asuransi, kepailitan). Berbasis UU Jasa Konstruksi No. 2/2017, UU Cipta Kerja, KUHPerdata, UU Arbitrase No. 30/1999, UU Ketenagakerjaan No. 13/2003 jo. UU Cipta Kerja, dan peraturan perpajakan PP 9/2022. Untuk PPK, direktur kontraktor/konsultan, legal officer, dan ahli hukum konstruksi.",
    bigIdeas: [
      {
        name: "Kontrak & Perjanjian Konstruksi",
        type: "domain",
        description: "Aspek hukum kontrak: review klausul, force majeure, klausul pembayaran, asuransi, dan jaminan.",
        toolboxes: [
          { name: "Legal Konstruksi Hub", isOrchestrator: true, intent: "Hub orchestrator untuk seluruh aspek hukum konstruksi: kontrak, sengketa, atau hukum operasional sesuai kebutuhan pengguna." },
          { name: "Kontrak Konstruksi Reviewer", isOrchestrator: false, intent: "Mereview draft kontrak konstruksi: klausul kritis, risiko, ketidakseimbangan, dan rekomendasi negosiasi. Mendukung kontrak SBD PUPR, FIDIC, dan kontrak swasta." },
          { name: "Force Majeure & Risk Clause Analyzer", isOrchestrator: false, intent: "Menganalisis klausul force majeure (pandemi, bencana, perubahan regulasi) dan klausul alokasi risiko (geological, weather, design, payment)." },
          { name: "Klausul Pembayaran, Eskalasi & Penalti Advisor", isOrchestrator: false, intent: "Memandu klausul pembayaran (uang muka, termin, retensi), eskalasi harga, denda keterlambatan (1‰/hari, max 5%), dan likuidated damages." },
        ],
      },
      {
        name: "Sengketa & Dispute Resolution Konstruksi",
        type: "domain",
        description: "Penyelesaian sengketa konstruksi: pencegahan, mediasi, dewan sengketa, arbitrase BANI, dan litigasi.",
        toolboxes: [
          { name: "Dewan Sengketa Konstruksi (DSK) Advisor", isOrchestrator: false, intent: "Memandu pembentukan dan penggunaan Dewan Sengketa Konstruksi sesuai UU 2/2017: jadwal, prosedur, putusan binding/non-binding." },
          { name: "Mediasi & Arbitrase BANI Strategist", isOrchestrator: false, intent: "Strategi mediasi dan arbitrase di BANI: pemilihan arbiter, prosedur SIAC/BANI, biaya, jadwal, dan execution award." },
          { name: "Litigasi Konstruksi & Class Action Advisor", isOrchestrator: false, intent: "Strategi litigasi di Pengadilan Negeri/Niaga: gugatan wanprestasi, perbuatan melawan hukum, dan eksekusi putusan." },
        ],
      },
      {
        name: "Hukum Operasional Konstruksi",
        type: "domain",
        description: "Aspek hukum operasional: ketenagakerjaan, pajak, asuransi, dan kepailitan.",
        toolboxes: [
          { name: "Ketenagakerjaan & PKWT Konstruksi Advisor", isOrchestrator: false, intent: "Memandu hukum ketenagakerjaan konstruksi: PKWT proyek, BPJS, upah minimum, K3, outsourcing pasca UU Cipta Kerja." },
          { name: "Pajak Konstruksi (PPh 4(2) & PPN) Calculator", isOrchestrator: false, intent: "Menjelaskan dan menghitung pajak konstruksi: PPh Final 4(2) konstruksi (1.75%/2.65%/4%), PPN, PPh 21/23, dan e-Faktur." },
          { name: "Asuransi Konstruksi (CAR/EAR/TPL) Advisor", isOrchestrator: false, intent: "Memandu pemilihan dan klaim asuransi konstruksi: Construction All Risk (CAR), Erection All Risk (EAR), Third Party Liability (TPL)." },
          { name: "Kepailitan & PKPU Konstruksi Strategist", isOrchestrator: false, intent: "Strategi menghadapi situasi kepailitan/PKPU: pengajuan gugatan, perlindungan piutang, posisi kreditor preferen vs konkuren." },
        ],
      },
    ],
  },
];

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

interface AgentContent {
  description: string;
  tagline: string;
  system_prompt: string;
  philosophy: string;
  expertise: string[];
  primary_outcome: "lead_capture" | "user_education" | "product_trial";
  conversation_win_conditions: string;
  domain_charter: string;
  quality_bar_extra: string;
}

interface ToolboxContent {
  description: string;
  purpose: string;
  capabilities: string[];
  limitations: string[];
}

async function callGemini(prompt: string, maxTokens = 1500, label = ""): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const myId = ++callCounter;
  const t0 = Date.now();
  // Retry once on transient errors
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 200)}`);
      const data = (await res.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Empty response. Finish: ${data.candidates?.[0]?.finishReason ?? "?"}`);
      const parsed = JSON.parse(text);
      console.log(`      [#${myId}] ${label} OK ${Date.now() - t0}ms`);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e: unknown) {
      clearTimeout(timer);
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`      [#${myId}] ${label} FAIL attempt ${attempt}/${2} (${Date.now() - t0}ms): ${msg.substring(0, 120)}`);
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("unreachable");
}

async function genAgentContent(agent: { name: string; intent: string; series: string; bigIdea: string; isOrchestrator: boolean }): Promise<AgentContent> {
  const prompt = `Anda ahli desain agen AI untuk industri Jasa Konstruksi Indonesia. Buat konten lengkap untuk chatbot berikut:

CHATBOT:
- Nama: ${agent.name}
- Series (ekosistem): ${agent.series}
- Domain: ${agent.bigIdea}
- Tujuan/Intent: ${agent.intent}
- Tipe: ${agent.isOrchestrator ? "Hub Orchestrator (mengarahkan ke spesialis lain)" : "Spesialis (menjawab langsung)"}

Hasilkan JSON valid dengan EXACT field names ini (semua wajib, dalam BAHASA INDONESIA):

{
  "description": "1-2 kalimat ringkas peran chatbot ini, dimulai dengan kata kerja (Membantu/Memandu/Menyusun/Menganalisis/Menjawab).",
  "tagline": "1 kalimat pendek (max 12 kata) sebagai tagline chatbot.",
  "system_prompt": "3-5 paragraf system prompt yang mendetail. Mulai dengan 'Anda adalah [peran spesifik] dengan keahlian [domain]. Tugas utama Anda adalah ...'. Sertakan: (1) peran & otoritas, (2) lingkup pekerjaan konkret, (3) cara berinteraksi (langkah, format jawaban), (4) batasan & rujukan ke sumber resmi. Jangan generic — gunakan istilah teknis konstruksi yang relevan dengan domain.",
  "philosophy": "1 kalimat filosofi/prinsip kerja agen, mulai dengan 'Saya percaya bahwa ...' atau 'Prinsip saya adalah ...'.",
  "expertise": ["array 4-6 tag keahlian spesifik dalam Bahasa Indonesia, contoh: 'Perpres 16/2018', 'Klausul FIDIC Red Book', 'Kalkulasi MC', 'Analisis CPI/SPI'"],
  "primary_outcome": "Pilih SATU: 'lead_capture' (kumpul lead) | 'user_education' (edukasi pengguna) | 'product_trial' (trial produk). Untuk hub orchestrator pilih 'user_education'.",
  "conversation_win_conditions": "1-2 kalimat kapan percakapan dianggap berhasil. Format: 'Pengguna [memahami/mendapatkan/menyelesaikan] X dan [bisa melakukan/tidak perlu] Y.'",
  "domain_charter": "3-4 kalimat. Mulai 'Agen HANYA membahas [scope spesifik domain].' Lalu 2-3 larangan jelas dengan format 'Dilarang ...'. Larangan harus spesifik untuk peran ini, bukan generik.",
  "quality_bar_extra": "1 kalimat tambahan standar kualitas spesifik untuk chatbot ini (format output, sumber wajib, struktur khas)."
}

Output HANYA JSON valid. Field names harus persis seperti di atas.`;

  const raw = await callGemini(prompt, 2000, `agent:${agent.name}`);
  const p = raw as Record<string, unknown>;

  const validOutcomes = ["lead_capture", "user_education", "product_trial"] as const;
  const outcomeRaw = String(p.primary_outcome ?? "user_education");
  const outcome: typeof validOutcomes[number] = (validOutcomes as readonly string[]).includes(outcomeRaw)
    ? (outcomeRaw as typeof validOutcomes[number])
    : "user_education";

  const expertiseRaw = Array.isArray(p.expertise) ? (p.expertise as unknown[]).map(String) : [];
  const expertise = expertiseRaw.length > 0 ? expertiseRaw : ["Jasa Konstruksi Indonesia", "Regulasi PUPR/LKPP", "Praktik Industri"];

  return {
    description: String(p.description ?? "").trim() || `${agent.intent}`,
    tagline: String(p.tagline ?? "").trim() || agent.name,
    system_prompt: String(p.system_prompt ?? "").trim() || `Anda adalah asisten AI untuk ${agent.name}. ${agent.intent}`,
    philosophy: String(p.philosophy ?? "").trim() || "Saya berkomitmen memberikan informasi yang akurat dan kontekstual untuk industri Jasa Konstruksi Indonesia.",
    expertise,
    primary_outcome: outcome,
    conversation_win_conditions: String(p.conversation_win_conditions ?? "").trim() || `Pengguna mendapatkan ${agent.name.toLowerCase()} yang akurat dan dapat diterapkan.`,
    domain_charter: String(p.domain_charter ?? "").trim() || `Agen HANYA membahas ${agent.bigIdea}. Dilarang membahas topik di luar domain ini. Dilarang memberikan opini hukum mengikat.`,
    quality_bar_extra: String(p.quality_bar_extra ?? "").trim() || "Selalu sertakan rujukan ke regulasi atau standar resmi yang berlaku.",
  };
}

async function genToolboxContent(tb: { name: string; intent: string; series: string; bigIdea: string }): Promise<ToolboxContent> {
  const prompt = `Anda ahli desain produk modul AI untuk industri Jasa Konstruksi Indonesia. Buat konten untuk modul/toolbox berikut:

MODUL:
- Nama: ${tb.name}
- Series (ekosistem): ${tb.series}
- Domain: ${tb.bigIdea}
- Tujuan: ${tb.intent}

Hasilkan JSON valid (semua wajib, BAHASA INDONESIA):

{
  "description": "1-2 kalimat deskripsi modul, fokus pada manfaat untuk pengguna konstruksi.",
  "purpose": "1-2 kalimat tujuan utama modul ini.",
  "capabilities": ["array 3-5 kemampuan KONKRET modul, contoh: 'Menyusun draft addendum kontrak dengan dasar pasal', 'Menghitung denda keterlambatan otomatis', 'Mengecek kelengkapan dokumen sebelum upload SPSE'"],
  "limitations": ["array 3-5 batasan jujur, contoh: 'Tidak menggantikan opini hukum advokat profesional', 'Bukan untuk negosiasi langsung dengan owner', 'Hanya untuk konteks regulasi Indonesia, bukan internasional'"]
}

Output HANYA JSON valid.`;

  const raw = await callGemini(prompt, 1200, `toolbox:${tb.name}`);
  const p = raw as Record<string, unknown>;
  const caps = Array.isArray(p.capabilities) ? (p.capabilities as unknown[]).map(String) : [];
  const lims = Array.isArray(p.limitations) ? (p.limitations as unknown[]).map(String) : [];

  return {
    description: String(p.description ?? "").trim() || tb.intent,
    purpose: String(p.purpose ?? "").trim() || tb.intent,
    capabilities: caps.length > 0 ? caps : ["Membantu pengguna sesuai konteks domain", "Memberikan referensi sumber resmi", "Memandu langkah demi langkah"],
    limitations: lims.length > 0 ? lims : ["Tidak menggantikan konsultasi profesional", "Hanya untuk konteks Jasa Konstruksi Indonesia", "Tidak memberikan jaminan hasil akhir"],
  };
}

interface PromisePoolItem<T> {
  fn: () => Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
}

async function promisePool<T>(items: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(items.length);
  const queue: Array<PromisePoolItem<T> & { idx: number }> = items.map((fn, idx) => {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { fn, resolve, reject, idx, promise } as PromisePoolItem<T> & { idx: number; promise: Promise<T> };
  });
  let cursor = 0;
  let firstError: unknown = null;
  async function worker(): Promise<void> {
    while (cursor < queue.length) {
      if (firstError) return; // fail-fast: stop scheduling once a job fails
      const myIdx = cursor++;
      const item = queue[myIdx];
      try {
        const r = await item.fn();
        results[item.idx] = r;
        item.resolve(r);
      } catch (e) {
        if (!firstError) firstError = e;
        item.reject(e);
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
  await Promise.all(workers);
  if (firstError) {
    // Fail loudly with deterministic cause so caller can ROLLBACK the per-series transaction
    throw firstError;
  }
  return results;
}

async function seedSeries(client: PoolClient, blueprint: SeriesBlueprint): Promise<void> {
  console.log(`\n=== SERIES: ${blueprint.name} ===`);

  // Idempotency: skip kalau series dengan slug sama sudah ada.
  // FOR UPDATE supaya dua proses paralel tidak race antara SELECT dan INSERT (lock row di transaksi ini).
  const exist = await client.query("SELECT id FROM series WHERE slug = $1 FOR UPDATE", [blueprint.slug]);
  if (exist.rows.length > 0) {
    console.log(`  ⚠ Series sudah ada (id=${exist.rows[0].id}), skip.`);
    return;
  }

  // Insert series. Catatan: tidak ada UNIQUE constraint DB-level di kolom slug,
  // jadi lock di atas + transaction-per-series adalah lapis pertahanan utama.
  const sRes = await client.query(
    `INSERT INTO series (user_id, name, slug, description, tagline, color, category, is_public, is_active, is_featured)
     VALUES ('', $1, $2, $3, $4, $5, $6, true, true, true) RETURNING id`,
    [blueprint.name, blueprint.slug, blueprint.description, blueprint.tagline, blueprint.color, blueprint.category]
  );
  const seriesId = sRes.rows[0].id as number;
  console.log(`  ✓ Series id=${seriesId}`);

  // Generate toolbox + agent content per (bigIdea, toolbox) — paralel
  const allToolboxJobs: Array<() => Promise<{
    bigIdeaIdx: number;
    tbIdx: number;
    tbContent: ToolboxContent;
    agentContent: AgentContent;
  }>> = [];

  blueprint.bigIdeas.forEach((bi, biIdx) => {
    bi.toolboxes.forEach((tb, tbIdx) => {
      allToolboxJobs.push(async () => {
        const tbContent = await genToolboxContent({ name: tb.name, intent: tb.intent, series: blueprint.name, bigIdea: bi.name });
        const agentContent = await genAgentContent({ name: tb.name, intent: tb.intent, series: blueprint.name, bigIdea: bi.name, isOrchestrator: tb.isOrchestrator });
        return { bigIdeaIdx: biIdx, tbIdx, tbContent, agentContent };
      });
    });
  });

  const totalJobs = allToolboxJobs.length;
  console.log(`  Generating content untuk ${totalJobs} toolbox+agent pairs (concurrency=${CONCURRENCY})...`);
  const generated = await promisePool(allToolboxJobs, CONCURRENCY);
  console.log(`  ✓ Content generated.`);

  // Group results per big idea
  const grouped = new Map<number, Array<typeof generated[number]>>();
  for (const g of generated) {
    if (!grouped.has(g.bigIdeaIdx)) grouped.set(g.bigIdeaIdx, []);
    grouped.get(g.bigIdeaIdx)!.push(g);
  }

  // Insert big_ideas + toolboxes + agents
  for (let biIdx = 0; biIdx < blueprint.bigIdeas.length; biIdx++) {
    const bi = blueprint.bigIdeas[biIdx];
    const biRes = await client.query(
      `INSERT INTO big_ideas (series_id, name, type, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [seriesId, bi.name, bi.type, bi.description, biIdx]
    );
    const bigIdeaId = biRes.rows[0].id as number;
    console.log(`    big_idea id=${bigIdeaId}: ${bi.name}`);

    const items = grouped.get(biIdx) ?? [];
    for (const item of items) {
      const tb = bi.toolboxes[item.tbIdx];
      const tbRes = await client.query(
        `INSERT INTO toolboxes (big_idea_id, is_orchestrator, name, description, purpose, capabilities, limitations, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, true) RETURNING id`,
        [
          bigIdeaId,
          tb.isOrchestrator,
          tb.name,
          item.tbContent.description,
          item.tbContent.purpose,
          JSON.stringify(item.tbContent.capabilities),
          JSON.stringify(item.tbContent.limitations),
          item.tbIdx,
        ]
      );
      const toolboxId = tbRes.rows[0].id as number;

      const ac = item.agentContent;
      const offTopic = OFF_TOPIC_KONSTRUKSI.replace(/\[DOMAIN\]/g, bi.name);
      const qualityBar = QUALITY_BAR_KONSTRUKSI + (ac.quality_bar_extra ? " " + ac.quality_bar_extra : "");

      await client.query(
        `INSERT INTO agents (
          user_id, name, description, tagline, philosophy, off_topic_response,
          system_prompt, language, toolbox_id, big_idea_id,
          is_orchestrator, orchestrator_role,
          expertise,
          primary_outcome, conversation_win_conditions, brand_voice_spec,
          interaction_policy, domain_charter, quality_bar, risk_compliance
        ) VALUES (
          '', $1, $2, $3, $4, $5,
          $6, 'id', $7, $8,
          $9, $10,
          $11::jsonb,
          $12, $13, $14,
          $15, $16, $17, $18
        )`,
        [
          tb.name, ac.description, ac.tagline, ac.philosophy, offTopic,
          ac.system_prompt, toolboxId, bigIdeaId,
          tb.isOrchestrator, tb.isOrchestrator ? "orchestrator" : "standalone",
          JSON.stringify(ac.expertise),
          ac.primary_outcome, ac.conversation_win_conditions, BRAND_VOICE_KONSTRUKSI,
          INTERACTION_POLICY_KONSTRUKSI, ac.domain_charter, qualityBar, RISK_COMPLIANCE_KONSTRUKSI,
        ]
      );
      console.log(`      ✓ agent: ${tb.name}${tb.isOrchestrator ? " [HUB]" : ""}`);
    }
  }
}

async function run(): Promise<void> {
  // Allow slug filter via argv
  const filter = process.argv[2];
  const list = filter ? SERIES.filter((s) => s.slug === filter) : SERIES;
  if (filter && list.length === 0) {
    console.log(`No series matching slug=${filter}`);
    return;
  }
  // Per-series transaction (so failure of one doesn't rollback others)
  for (const series of list) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await seedSeries(client, series);
      await client.query("COMMIT");
      console.log(`  ✓ COMMITTED: ${series.slug}`);
    } catch (e: unknown) {
      await client.query("ROLLBACK");
      console.error(`  ✗ ROLLBACK ${series.slug}:`, e instanceof Error ? e.message : String(e));
    } finally {
      client.release();
    }
  }
  await pool.end();
  console.log("\n=== ALL DONE ===");
}

run().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
