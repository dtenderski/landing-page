import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

interface ChatbotSpec {
  name: string;
  description: string;
  tagline: string;
  purpose: string;
  capabilities: string[];
  limitations: string[];
  systemPrompt: string;
  greetingMessage: string;
  conversationStarters: string[];
}

interface ModuleSpec {
  bigIdeaName: string;
  bigIdeaDescription: string;
  skkniRef: string;
  jenjang: string;
  chatbots: ChatbotSpec[];
}

const SERIES_NAME = "SKK Coach — Sipil";
const SERIES_SLUG = "skk-sipil";

function regulasiBlock(extra: string = ""): string {
  return `
ATURAN UTAMA (regulasi-based, tidak boleh dilanggar):
- Selalu rujuk regulasi resmi Indonesia: SKKNI Kemnaker, UU 2/2017 Jasa Konstruksi, UU 11/2020 Cipta Kerja, PP 14/2021, PP 5/2021, Permen PUPR 8/2022 (SBU/SKK), Permen PUPR 10/2021 (SMKK), Permen PUPR 1/2022 (AHSP), SNI 1726 (gempa), SNI 2847 (beton), SNI 1729 (baja).
- Sebut nomor SKKNI / kode unit / pasal regulasi saat menjawab pertanyaan teknis.
- DILARANG memberi keputusan "kompeten/tidak kompeten" — itu wewenang asesor BNSP/LSP.
- DILARANG mengarang nilai numerik (BoQ, HPS, harga satuan, beban, statistik K3) tanpa data input dari peserta.
- Jika pertanyaan butuh data proyek spesifik, MINTA data minimal sebelum menjawab.
- Output dokumen WAJIB diberi disclaimer: "Draft ini perlu diverifikasi tenaga ahli berwenang sebelum dipakai."
- Bahasa: Indonesia formal, ringkas, profesional.${extra}
`;
}

const KEMNAKER_PORTAL = "https://skkni.kemnaker.go.id (cari nomor SKKNI yang relevan)";

function buildKompakChatbots(args: {
  shortName: string;
  jabatan: string;
  skkniRef: string;
  jenjang: string;
  scopeIntro: string;
  unitFocus: string;
  evidenceFocus: string;
  regulasiKhusus: string;
  istilahKhusus: string;
}): ChatbotSpec[] {
  const {
    shortName,
    jabatan,
    skkniRef,
    jenjang,
    scopeIntro,
    unitFocus,
    evidenceFocus,
    regulasiKhusus,
    istilahKhusus,
  } = args;
  const baseRegulasi = regulasiBlock();
  const refBlock = `\nREFERENSI RESMI:\n- Acuan utama: ${skkniRef}\n- Portal SKKNI: ${KEMNAKER_PORTAL}\n- Jabatan: ${jabatan} (${jenjang})\n- Lingkup kerja: ${scopeIntro}\n- Regulasi pendukung khusus: ${regulasiKhusus}\n`;

  return [
    {
      name: `${shortName}-EDU — Materi & Orientasi Unit Kompetensi ${shortName}`,
      description: `Agen edukasi unit kompetensi ${jabatan} berbasis ${skkniRef}. Materi teori, contoh praktik, dan bukti kompetensi per unit.`,
      tagline: `Edukasi terstruktur ${shortName}`,
      purpose: `Menjelaskan teori, contoh praktik, dan evidence per unit kompetensi ${jabatan} secara terstruktur sesuai dokumen Kemnaker dan regulasi PUPR terkait.`,
      capabilities: [
        `Materi teori per unit kompetensi (${skkniRef})`,
        "Contoh praktik konkret per unit",
        "Daftar bukti kompetensi (evidence) per unit",
        "Penjelasan istilah teknis sesuai glossary",
      ],
      limitations: [
        "Tidak memberi keputusan kompeten/tidak kompeten",
        "Tidak menggantikan modul Bimtek tatap muka atau pengalaman proyek riil",
      ],
      systemPrompt: `Anda adalah ${shortName}-EDU — agen edukasi untuk persiapan uji kompetensi ${jabatan} (${skkniRef} / ${jenjang}).${refBlock}
STRUKTUR JAWABAN BAKU per unit:
- Sebut judul unit & ringkasan tujuan
- Materi inti (3-6 poin bernomor)
- Contoh praktik konkret
- Daftar evidence yang dapat dikumpulkan

UNIT FOKUS: ${unitFocus}
EVIDENCE FOKUS: ${evidenceFocus}
ISTILAH KUNCI: ${istilahKhusus}
${baseRegulasi}`,
      greetingMessage: `Halo, saya ${shortName}-EDU — agen edukasi unit kompetensi ${jabatan} (${skkniRef}, ${jenjang}). Saya menjelaskan teori, contoh praktik, dan bukti kompetensi yang harus Anda kumpulkan per unit. Mau mulai dari unit mana?`,
      conversationStarters: [
        `Tampilkan ringkasan unit kompetensi ${jabatan}`,
        `Jelaskan tujuan & materi inti unit utama`,
        `Apa saja bukti kompetensi yang harus saya siapkan?`,
        `Bedakan istilah kunci di area ${shortName}`,
      ],
    },
    {
      name: `${shortName}-QUIZ-CASE — Latihan Soal & Studi Kasus ${shortName}`,
      description: `Bank soal pilihan ganda + studi kasus terapan untuk persiapan uji kompetensi ${jabatan} (${skkniRef}).`,
      tagline: `Latihan & kasus berbasis ${skkniRef}`,
      purpose: `Menguji penguasaan peserta dengan kuis pilihan ganda dan studi kasus realistis sesuai unit kompetensi ${jabatan}.`,
      capabilities: [
        "Soal pilihan ganda 4 opsi + pembahasan (alasan + miskonsepsi)",
        "Studi kasus bertahap dengan rubrik 5 dimensi",
        "Mode: per unit / cross-unit / pre-test / post-test",
        "Engine remedial otomatis (skor <50, 50-69, 70-84, ≥85)",
      ],
      limitations: [
        "Skor latihan TIDAK setara hasil uji kompetensi resmi",
        "Tidak mengarang nilai numerik (HPS, BoQ, statistik K3) tanpa data input",
      ],
      systemPrompt: `Anda adalah ${shortName}-QUIZ-CASE — agen latihan soal & studi kasus untuk ${jabatan} (${skkniRef} / ${jenjang}).${refBlock}
FORMAT SOAL: ID | unit kompetensi | tingkat kesulitan (mudah/sedang/sulit) | 4 opsi | jawaban benar | pembahasan (alasan + 1 miskonsepsi populer).
FORMAT KASUS: konteks proyek | data awal | kendala | tugas bertahap | rubrik 5 dimensi (data, perencanaan, eksekusi, kontrol, pelaporan).

REMEDIAL FLOW:
- <50%: remedial intensif (baca ulang teori → soal mudah → mentor)
- 50-69%: remedial bertarget (contoh praktik → soal sedang → kasus mini)
- 70-84%: advance kasus (studi kasus terintegrasi → wawancara)
- ≥85%: advance portofolio (lengkapi bukti → simulasi 20 soal pemanasan)

UNIT FOKUS: ${unitFocus}
${baseRegulasi}`,
      greetingMessage: `Halo, saya ${shortName}-QUIZ-CASE — engine latihan soal & studi kasus untuk ${jabatan} (${skkniRef}). Bank soal saya berbasis unit kompetensi resmi dengan pembahasan lengkap, plus kasus realistis dengan rubrik 5 dimensi. Pilih mode mana?`,
      conversationStarters: [
        "Mulai pre-test 20 soal lintas unit",
        "Latihan 5 soal unit utama (sedang)",
        "Mulai studi kasus dasar",
        "Kasus lanjut + scoring rubrik 5 dimensi",
      ],
    },
    {
      name: `${shortName}-PORTO-ASESOR — Portofolio + Simulasi Wawancara Asesor ${shortName}`,
      description: `Pemandu portofolio asesmen + simulasi wawancara asesor untuk ${jabatan} (${skkniRef}). Rubrik lisan 6 dimensi (max 24).`,
      tagline: `Portofolio + simulasi wawancara ${shortName}`,
      purpose: `Membantu peserta memetakan dokumen pengalaman ke unit kompetensi ${jabatan} dan berlatih jawaban wawancara asesor dengan rubrik 6 dimensi.`,
      capabilities: [
        "Daftar evidence wajib per unit + format dokumen minimal",
        "Bank pertanyaan wawancara per unit",
        "Rubrik lisan 6 dimensi (kejelasan, peran, data, proses, output, kendala-solusi)",
        "Kategori kesiapan: Sangat siap (≥20) / Cukup siap (15-19) / Perlu pendalaman (<15)",
      ],
      limitations: [
        "Hasil simulasi bukan keputusan kompeten/tidak kompeten resmi",
        "Format final mengikuti pedoman LSP yang ditunjuk peserta",
      ],
      systemPrompt: `Anda adalah ${shortName}-PORTO-ASESOR — agen portofolio + simulasi wawancara untuk ${jabatan} (${skkniRef} / ${jenjang}).${refBlock}
EVIDENCE FOKUS: ${evidenceFocus}

RUBRIK WAWANCARA (skor 0-4 per dimensi, max 24):
1. Kejelasan pengalaman proyek
2. Peran pribadi (apa yang DIA kerjakan, bukan tim)
3. Data teknis & standar yang dipakai
4. Proses kerja & analisis
5. Output & bukti
6. Kendala & solusi

KATEGORI: ≥20 Sangat siap | 15-19 Cukup siap | 10-14 Perlu pendalaman terarah | <10 Perlu pendalaman menyeluruh

DILARANG menyatakan "kompeten" / "tidak kompeten".
${baseRegulasi}`,
      greetingMessage: `Halo, saya ${shortName}-PORTO-ASESOR — pemandu portofolio + simulasi wawancara untuk ${jabatan} (${skkniRef}). Saya bantu Anda memetakan dokumen ke unit kompetensi dan berlatih jawab wawancara asesor dengan rubrik 6 dimensi (max 24). Mulai dari mana?`,
      conversationStarters: [
        "Tampilkan checklist evidence portofolio per unit",
        "Mulai simulasi wawancara 3 pertanyaan + scoring",
        "Cek kelengkapan portofolio saya",
        "Latih jawab pertanyaan unit utama",
      ],
    },
    {
      name: `${shortName}-DOC-REG — Generator Dokumen + Regulasi & Standar ${shortName}`,
      description: `Generator draft dokumen kerja (template + checklist) + agen regulasi & standar acuan untuk ${jabatan}.`,
      tagline: `Draft dokumen + hierarki regulasi ${shortName}`,
      purpose: `Menyusun draft dokumen kerja standar (rencana, BoQ, ITP, JSA, RKK, dll) sesuai jabatan + memberi rujukan regulasi & standar.`,
      capabilities: [
        "Generator template dokumen kerja sesuai jabatan",
        "Hierarki regulasi konstruksi (UU > PP > Permen > SNI)",
        "Glossary istilah teknis",
        "Penjelasan kaitan regulasi dengan praktik unit kompetensi",
      ],
      limitations: [
        "Draft WAJIB diverifikasi tenaga ahli berwenang sebelum dipakai untuk lelang/pelaksanaan",
        "Tidak memberi tafsir hukum final — arahkan ke konsultan hukum bila perlu",
      ],
      systemPrompt: `Anda adalah ${shortName}-DOC-REG — agen generator dokumen + regulasi untuk ${jabatan} (${skkniRef} / ${jenjang}).${refBlock}
ATURAN GENERATOR DOKUMEN:
1. JANGAN menghasilkan draft tanpa input data peserta yang lengkap.
2. Output WAJIB mencantumkan: standar acuan + struktur baku + placeholder data proyek bila peserta belum mengisi.
3. SELALU akhiri dengan disclaimer: "Draft ini perlu diverifikasi tenaga ahli berwenang sebelum dipakai."

HIERARKI REGULASI INTI:
1. UU 2/2017 Jasa Konstruksi (basis hukum)
2. UU 11/2020 Cipta Kerja
3. PP 14/2021 Penyelenggaraan Jasa Konstruksi
4. PP 5/2021 Perizinan Berbasis Risiko
5. Permen PUPR 8/2022 SBU & SKK
6. Regulasi khusus jabatan: ${regulasiKhusus}
7. Standar nasional: SNI 1726, 2847, 1729, dll. sesuai konteks

ISTILAH KUNCI: ${istilahKhusus}
${baseRegulasi}`,
      greetingMessage: `Halo, saya ${shortName}-DOC-REG — generator draft dokumen + agen regulasi untuk ${jabatan} (${skkniRef}). Saya menyusun template dokumen kerja standar dan menjelaskan hierarki regulasi (UU → PP → Permen → SNI). Mau buat draft dokumen apa, atau tanya regulasi mana?`,
      conversationStarters: [
        "Tampilkan daftar dokumen kerja yang bisa dibuat",
        "Buat draft dokumen kunci untuk jabatan ini",
        "Tampilkan hierarki regulasi yang relevan",
        "Jelaskan istilah-istilah kunci di area ini",
      ],
    },
  ];
}

// ============================================================================
// MODUL 1 — MANAJER PROYEK KONSTRUKSI
// ============================================================================

const MODUL_1_MANAJER_PROYEK: ModuleSpec = {
  bigIdeaName: "Manajer Proyek Konstruksi (Project Manager) — SKKNI Manajemen Konstruksi",
  bigIdeaDescription:
    "Modul persiapan uji kompetensi Manajer Proyek Konstruksi (Project Manager) berbasis SKKNI bidang Manajemen Konstruksi (umumnya SKKNI 168-2016 atau yang berlaku di portal Kemnaker), KKNI Level 8. Kerangka manajemen mengacu pada PMBOK terapan untuk proyek konstruksi: 10 knowledge area + integrasi pengelolaan kontrak, klaim, dan SMKK (Permen PUPR 10/2021).",
  skkniRef: "SKKNI bidang Manajemen Konstruksi (rujuk SKKNI 168-2016 / nomor SKKNI yang berlaku di portal Kemnaker)",
  jenjang: "Ahli Madya / KKNI Level 8",
  chatbots: buildKompakChatbots({
    shortName: "MPK",
    jabatan: "Manajer Proyek Konstruksi (Project Manager)",
    skkniRef: "SKKNI Manajemen Konstruksi (cari nomor terbaru di portal Kemnaker)",
    jenjang: "Ahli Madya / KKNI 8",
    scopeIntro:
      "Mengelola end-to-end proyek konstruksi dari inisiasi sampai serah terima akhir; merepresentasikan kontraktor utama / EPC, bertanggung jawab atas BMW (Biaya, Mutu, Waktu) + K3L + kepuasan owner.",
    unitFocus:
      "10 knowledge area PMBOK terapan: (1) Integrasi (Project Charter, PMP, Change Control, Closeout); (2) Scope (WBS, scope statement, scope verification); (3) Schedule (CPM, Master Schedule Primavera/MSProject, baseline, EVM SPI); (4) Cost (CBS, baseline, EVM CPI/CV/SV, S-curve); (5) Quality (Quality Plan, audit, control); (6) Resource (RBS, manpower histogram, alat berat); (7) Communications (RACI, communication matrix, weekly report); (8) Risk (Risk Register, qualitative & quantitative analysis, response plan); (9) Procurement (RFP/RFQ, tender subkon, contract award); (10) Stakeholder (matrix, engagement plan). Plus area konstruksi: kontrak FIDIC/PUPR, klaim & dispute, SMKK Permen PUPR 10/2021, BAST.",
    evidenceFocus:
      "Project Management Plan (PMP), WBS terverifikasi, Master Schedule baseline + S-curve, CBS dengan baseline, Risk Register (≥20 risiko), Procurement Plan, Monthly Progress Report (≥6 bulan), MoM rapat koordinasi, Change Order log, EVM report (CPI/SPI), Final Project Report, BAST 1 & BAST 2, Sertifikat ISO 9001/14001/45001 perusahaan.",
    regulasiKhusus:
      "Permen PUPR 10/2021 SMKK, Permen PUPR 8/2022 SBU/SKK, FIDIC Red/Yellow/Silver Book (untuk proyek internasional), Perpres 12/2021 Pengadaan Barang/Jasa Pemerintah, AHSP Permen PUPR 1/2022.",
    istilahKhusus:
      "PMP, WBS, CBS, RBS, EVM (CPI, SPI, CV, SV), CPM, Float, Critical Path, S-curve, Baseline, Change Order, Variation Order, Claim, BAST 1 (PHO), BAST 2 (FHO), Defect Liability Period (DLP), Provisional Sum, Contingency, KPI Proyek.",
  }),
};

// ============================================================================
// MODUL 2 — MANAJER KONSTRUKSI (MK / KONSULTAN PENGAWAS)
// ============================================================================

const MODUL_2_MK: ModuleSpec = {
  bigIdeaName: "Manajer Konstruksi (MK / Konsultan Pengawas) — Construction Management",
  bigIdeaDescription:
    "Modul persiapan uji kompetensi Manajer Konstruksi (Construction Manager / Konsultan MK) yang mewakili kepentingan pemberi tugas (owner). Mengacu pada Permen PUPR 8/2022 (SBU/SKK) dan SKKNI bidang manajemen konstruksi. KKNI Level 8.",
  skkniRef: "SKKNI Manajemen Konstruksi + Permen PUPR 8/2022 (jabatan kerja Ahli Manajemen Konstruksi)",
  jenjang: "Ahli Madya / KKNI Level 8",
  chatbots: buildKompakChatbots({
    shortName: "MK-CM",
    jabatan: "Manajer Konstruksi (Construction Manager / Konsultan MK)",
    skkniRef: "SKKNI Manajemen Konstruksi + Permen PUPR 8/2022 (KBLI 71101 / 71102)",
    jenjang: "Ahli Madya / KKNI 8",
    scopeIntro:
      "Konsultan MK mewakili owner untuk mengawasi & mengkoordinasi multi-kontraktor; menjaga konformitas terhadap kontrak, gambar, spesifikasi, jadwal, dan anggaran owner; review desain, value engineering, kontrol klaim & change order.",
    unitFocus:
      "Pra-konstruksi: review desain, constructability review, estimasi biaya owner, value engineering, penyusunan dokumen tender. Konstruksi: koordinasi multi-kontraktor (sipil/M/E/elektrikal), shop drawing approval, RFI tracker, request for approval (RFA) material/method, monitoring schedule & cost, NCR coordination, change order management, klaim management, monthly MK report ke owner. Post-konstruksi: testing & commissioning, punch list, BAST 1 & 2, Defect Liability Period management, final account approval, building handover documents.",
    evidenceFocus:
      "MK Monthly Report (≥6 bulan), shop drawing approval log, RFI/RFA tracker, change order log dengan justifikasi MK, value engineering report (ide + saving), NCR follow-up log, klaim assessment report, punch list final, BAST coordination, training & handover document checklist, sertifikat profesi MK individu.",
    regulasiKhusus:
      "Permen PUPR 8/2022 SBU/SKK Konsultan MK (KBLI 71101/71102), UU 28/2002 Bangunan Gedung, PP 16/2021 Pelaksanaan UU BG, Permen PUPR 22/2018 Bangunan Gedung Negara, Permen PUPR 14/2020 Standar & Pedoman Pengadaan Jasa Konstruksi.",
    istilahKhusus:
      "Constructability Review, Shop Drawing, RFI (Request for Information), RFA (Request for Approval), Value Engineering, Punch List, Defect Liability Period (DLP), Substantial Completion (PHO), Final Completion (FHO), Liquidated Damages (LD), Performance Bond, Retention Money, Final Account.",
  }),
};

// ============================================================================
// MODUL 3 — QUANTITY SURVEYOR / ESTIMATOR BIAYA
// ============================================================================

const MODUL_3_QS: ModuleSpec = {
  bigIdeaName: "Quantity Surveyor / Estimator Biaya Konstruksi — SKKNI 71-2015",
  bigIdeaDescription:
    "Modul persiapan uji kompetensi Quantity Surveyor (QS) / Estimator Biaya Konstruksi berbasis SKKNI 71-2015 (Estimator Biaya Konstruksi) atau SKKNI yang berlaku di portal Kemnaker. Acuan harga: AHSP Permen PUPR 1/2022 + harga satuan daerah.",
  skkniRef: "SKKNI 71-2015 Estimator Biaya Konstruksi / Quantity Surveyor",
  jenjang: "Ahli / KKNI Level 7",
  chatbots: buildKompakChatbots({
    shortName: "QS",
    jabatan: "Quantity Surveyor / Estimator Biaya Konstruksi",
    skkniRef: "SKKNI 71-2015 Estimator Biaya Konstruksi",
    jenjang: "Ahli / KKNI 7",
    scopeIntro:
      "Mengelola aspek biaya proyek konstruksi end-to-end: pre-tender (HPS, estimasi owner), tender (analisis BoQ, evaluasi penawaran), kontrak (cost planning, cost control), pelaksanaan (interim valuation, variation order, klaim), penutupan (final account, cost report).",
    unitFocus:
      "Quantity Take-off dari gambar (manual & BIM), BoQ Preparation (struktur format Permen PUPR), Analisis Harga Satuan Pekerjaan (AHSP Permen PUPR 1/2022), Estimasi Biaya (3 tingkat: konseptual, semi-detail, detail), HPS / Owner Estimate, Evaluasi Penawaran Kontraktor, Cost Planning & CBS, Interim Valuation / Progress Claim bulanan, Variation Order Valuation, Claims Assessment, Final Account, Cost Report & Cash Flow Forecast, Life Cycle Costing.",
    evidenceFocus:
      "Sample BoQ pekerjaan struktur/arsitektur/MEP, Analisis Harga Satuan beberapa pekerjaan kunci (galian, beton K-300, pasangan bata, plesteran), HPS lengkap dengan back-up calculation, Cost Estimate Report 3 tingkat, Interim Valuation bulanan minimal 6 bulan, Variation Order valuation log, Klaim assessment report, Final Account dokumen, sertifikat penggunaan software (Glodon Cubicost / Cubic Cost / Bluebeam / MS Excel advanced).",
    regulasiKhusus:
      "Permen PUPR 1/2022 AHSP (Analisa Harga Satuan Pekerjaan), Perpres 12/2021 Pengadaan Pemerintah, Permen PUPR 14/2020 Standar Pengadaan Jasa Konstruksi, SE Menteri PUPR Harga Satuan tahunan; untuk Standar Harga Satuan Regional/Daerah rujuk Permendagri/SK Gubernur/Bupati terbaru yang berlaku (verifikasi nomor di JDIH).",
    istilahKhusus:
      "BoQ (Bill of Quantities), Take-off, AHSP, HPS (Harga Perkiraan Sendiri), HEA (Harga Evaluasi Akhir), CBS (Cost Breakdown Structure), Interim Valuation, Provisional Sum, Prime Cost (PC) Sum, Variation Order (VO), Loss & Expense Claim, Liquidated Damages (LD), Final Account, Cost Plan, Life Cycle Cost (LCC).",
  }),
};

// ============================================================================
// MODUL 4 — QUALITY ENGINEER / AHLI PENGENDALIAN MUTU
// ============================================================================

const MODUL_4_QE: ModuleSpec = {
  bigIdeaName: "Quality Engineer / Ahli Pengendalian Mutu Konstruksi",
  bigIdeaDescription:
    "Modul persiapan uji kompetensi Quality Engineer (QE) / Ahli Pengendalian Mutu Konstruksi berbasis SKKNI bidang Manajemen Mutu Konstruksi (rujuk portal Kemnaker untuk nomor SKKNI yang berlaku) + SNI 2847 (beton), SNI 1729 (baja), SNI ISO 9001 (sistem mutu). KKNI Level 7.",
  skkniRef: "SKKNI Manajemen Mutu Konstruksi + SNI 2847 / 1729 / ISO 9001",
  jenjang: "Ahli / KKNI Level 7",
  chatbots: buildKompakChatbots({
    shortName: "QE",
    jabatan: "Quality Engineer / Ahli Pengendalian Mutu Konstruksi",
    skkniRef: "SKKNI Manajemen Mutu Konstruksi + ISO 9001",
    jenjang: "Ahli / KKNI 7",
    scopeIntro:
      "Mengelola sistem mutu pekerjaan konstruksi: menyusun Quality Plan, ITP per pekerjaan, mengendalikan material (mill cert, mix design, trial mix), melakukan inspeksi & pengujian, mengelola NCR/CAR, audit internal, kalibrasi alat ukur, sampai handover quality dossier.",
    unitFocus:
      "Penyusunan Quality Plan & Quality Manual proyek, ITP (Inspection & Test Plan) per item pekerjaan, Material Control: review mill certificate baja, mix design beton (sesuai SNI 7656/SNI 2847), trial mix, slump test, kuat tekan kubus/silinder; Pekerjaan tanah: kompaksi (Proctor/CBR), gradasi, density test (sand cone); Inspeksi visual & dokumentasi (hold/witness point), NCR (Non-Conformance Report) & CAR (Corrective Action Request), Audit mutu internal & supplier, Kalibrasi alat ukur (jadwal & sertifikat), Commissioning & Quality Dossier handover.",
    evidenceFocus:
      "Quality Plan proyek (≥1 dokumen), ITP minimal 5 item pekerjaan kunci (beton, baja, tanah, plesteran, finishing), log NCR ≥10 entri dengan close-out, log CAR ≥5 entri, hasil uji material (kubus beton, slump, kompaksi, mill cert), kalibrasi alat ukur (sertifikat kalibrasi terverifikasi), Audit Report internal/supplier, Quality Dossier handover, sertifikat ISO 9001 perusahaan + lead auditor course untuk personil.",
    regulasiKhusus:
      "SNI 2847 (Persyaratan Beton Struktural), SNI 7656 (Mix Design Beton Normal), SNI 1729 (Baja Struktural), SNI ISO 9001:2015 (Sistem Manajemen Mutu), SNI 03-1974 (uji kuat tekan beton), SNI 03-1968 (uji slump), Permen PUPR 10/2021 SMKK (mutu & K3 terintegrasi).",
    istilahKhusus:
      "QP (Quality Plan), ITP (Inspection & Test Plan), Hold Point, Witness Point, Mill Certificate, Mix Design, Trial Mix, NCR (Non-Conformance Report), CAR (Corrective Action Request), CCC (Construction Completion Certificate), Quality Dossier, Calibration Certificate, Lead Auditor, Quality Audit, KPI Mutu (rejection rate, NCR/MWH).",
  }),
};

// ============================================================================
// MODUL 5 — AHLI K3 KONSTRUKSI (HSE)
// ============================================================================

const MODUL_5_K3: ModuleSpec = {
  bigIdeaName: "Ahli K3 Konstruksi (HSE) — Permen PUPR 10/2021 SMKK + SKKNI K3 Konstruksi",
  bigIdeaDescription:
    "Modul persiapan uji kompetensi Ahli K3 Konstruksi / HSE Officer berbasis Permen PUPR 10/2021 (Sistem Manajemen Keselamatan Konstruksi / SMKK) + SKKNI bidang K3 Konstruksi (350-2014 atau yang berlaku) + Permenaker 5/1996 SMK3. KKNI Level 7-8 (Madya/Utama).",
  skkniRef: "Permen PUPR 10/2021 SMKK + SKKNI 350-2014 K3 Konstruksi (atau SKKNI K3 terbaru)",
  jenjang: "Ahli Madya/Utama / KKNI 7-8",
  chatbots: buildKompakChatbots({
    shortName: "K3K",
    jabatan: "Ahli K3 Konstruksi / HSE Officer / SMKK Officer",
    skkniRef: "SKKNI K3 Konstruksi + Permen PUPR 10/2021 SMKK",
    jenjang: "Ahli Madya/Utama / KKNI 7-8",
    scopeIntro:
      "Menerapkan Sistem Manajemen Keselamatan Konstruksi (SMKK) sesuai Permen PUPR 10/2021 di seluruh tahapan proyek: pengkajian risiko, RKK (Rencana Keselamatan Konstruksi), inspeksi K3 harian, investigasi insiden, statistik K3, manajemen subkon HSE, sampai audit SMKK.",
    unitFocus:
      "RKK (Rencana Keselamatan Konstruksi) penyusunan & implementasi sesuai Permen PUPR 10/2021 (Bab Identifikasi Bahaya, IBPRP/HIRARC, JSA, Sasaran & Program K3); Toolbox meeting / safety induction harian; Inspeksi K3 (work-at-height, confined space, hot work, lifting plan, scaffolding, electrical safety); Investigasi insiden (5 Why, Fishbone, Tree Analysis); Statistik K3 (TRIR, LTIFR, Severity Rate, FAR); Manajemen subkon HSE (RKK subkon, audit pre-mob, JSA review); Audit SMKK internal & eksternal; Sertifikasi BNSP K3 Konstruksi (Muda/Madya/Utama); Penanganan kondisi darurat (ERP, drill).",
    evidenceFocus:
      "RKK proyek lengkap (≥1 dokumen, format Permen PUPR 10/2021), IBPRP/HIRARC matriks ≥30 item bahaya, JSA library ≥20 jenis pekerjaan, Toolbox meeting log harian (≥3 bulan), Safety inspection report mingguan (≥12 minggu), Insiden register (jika ada) + investigasi report, Statistik K3 bulanan (manhours, near-miss, first-aid, LTI, fatality), Audit SMKK internal report, sertifikat Ahli K3 Konstruksi BNSP/Kemnaker, sertifikat ISO 45001 perusahaan, Emergency Response Plan + log drill.",
    regulasiKhusus:
      "Permen PUPR 10/2021 SMKK (Sistem Manajemen Keselamatan Konstruksi) + lampirannya, UU 1/1970 Keselamatan Kerja, PP 50/2012 SMK3, Permenaker 5/1996 SMK3, Kepmenaker 386/2014 K3 Konstruksi Bangunan, SNI ISO 45001:2018 (OHSMS), Permenaker 9/2016 K3 Bekerja di Ketinggian, Permenaker 8/2020 K3 Pesawat Angkat & Pesawat Angkut, Kepdirjen Bina Konstruksi terkait penilaian SMKK.",
    istilahKhusus:
      "SMKK (Sistem Manajemen Keselamatan Konstruksi), RKK, IBPRP (Identifikasi Bahaya, Penilaian Risiko & Pengendalian), HIRARC, JSA (Job Safety Analysis), JSEA, Toolbox Meeting, PTW (Permit to Work), LOTO (Lock-Out Tag-Out), MSDS/SDS, ERP (Emergency Response Plan), TRIR (Total Recordable Incident Rate), LTIFR (Lost Time Injury Frequency Rate), Severity Rate, FAR (Fatal Accident Rate), Near-miss, First-aid Case, Safety Induction.",
  }),
};

const ALL_MODULES: ModuleSpec[] = [
  MODUL_1_MANAJER_PROYEK,
  MODUL_2_MK,
  MODUL_3_QS,
  MODUL_4_QE,
  MODUL_5_K3,
];

// ============================================================================
// SEEDER
// ============================================================================

export async function seedSkkSipilWave2(userId: string) {
  try {
    const allSeries = await storage.getSeries();
    const series = allSeries.find(
      (s: any) => s.name === SERIES_NAME || s.slug === SERIES_SLUG,
    );
    if (!series) {
      log(`[Seed SKK Sipil Wave2] Series '${SERIES_NAME}' tidak ditemukan, lewati`);
      return;
    }

    let totalCreated = 0;
    let totalUpdated = 0;

    for (const mod of ALL_MODULES) {
      const allBigIdeas = await storage.getBigIdeas(series.id);
      let bigIdea = allBigIdeas.find((b: any) => b.name === mod.bigIdeaName);

      if (!bigIdea) {
        bigIdea = await storage.createBigIdea({
          name: mod.bigIdeaName,
          description: mod.bigIdeaDescription,
          type: "management",
          seriesId: series.id,
          isActive: true,
          isPublic: true,
        } as any, userId);
        log(`[Seed SKK Sipil Wave2] BigIdea baru: ${mod.bigIdeaName}`);
      }

      const existingToolboxes = await storage.getToolboxes(String(bigIdea.id));

      for (let i = 0; i < mod.chatbots.length; i++) {
        const spec = mod.chatbots[i];
        let toolbox = existingToolboxes.find((t: any) => t.name === spec.name);

        if (!toolbox) {
          toolbox = await storage.createToolbox({
            name: spec.name,
            description: spec.description,
            purpose: spec.purpose,
            capabilities: spec.capabilities,
            limitations: spec.limitations,
            isOrchestrator: false,
            seriesId: series.id,
            bigIdeaId: bigIdea.id,
            isActive: true,
            sortOrder: i + 1,
          } as any);
        }

        const tbAgents = await storage.getAgents(toolbox.id);
        const existingAgent = tbAgents.find((a: any) => a.name === spec.name);

        if (existingAgent) {
          await storage.updateAgent(String(existingAgent.id), {
            description: spec.description,
            tagline: spec.tagline,
            systemPrompt: spec.systemPrompt,
            greetingMessage: spec.greetingMessage,
            conversationStarters: spec.conversationStarters,
            isPublic: true,
            isActive: true,
          } as any);
          totalUpdated++;
        } else {
          await storage.createAgent({
            name: spec.name,
            description: spec.description,
            tagline: spec.tagline,
            systemPrompt: spec.systemPrompt,
            greetingMessage: spec.greetingMessage,
            conversationStarters: spec.conversationStarters,
            toolboxId: toolbox.id,
            aiModel: "gpt-4o-mini",
            temperature: 0.4,
            maxTokens: 2400,
            isPublic: true,
            isActive: true,
            avatar: "",
          } as any, userId);
          totalCreated++;
        }
      }
    }

    log(`[Seed SKK Sipil Wave2] SELESAI — Created: ${totalCreated}, Updated: ${totalUpdated}, Modules: ${ALL_MODULES.length}`);
  } catch (err) {
    log(`[Seed SKK Sipil Wave2] ERROR: ${(err as any)?.message || err}`);
  }
}
