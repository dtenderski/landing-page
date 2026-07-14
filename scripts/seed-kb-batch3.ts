/**
 * Seed Knowledge Bases untuk 30 agen Batch 3 (#920-949)
 * - Foundational + Operational + Compliance per agen (90 entries)
 * - HUBs (#920, #926, #932, #938, #944) + Tactical entry (5 entries)
 * - Chunks seeded sekaligus tanpa embedding
 * Idempotent: skip agen yang sudah punya KB
 */
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TAX = {
  PELAKSANAAN: 26, SISTEM_MANAJEMEN: 36,
  PERENCANAAN_EKSEKUSI: 27, OPERASIONAL_LAPANGAN: 28, PENGENDALIAN: 29,
  ISO9001: 37, ISO14001: 38, SMK3: 39,
};

function est(text: string) { return Math.ceil(text.length / 4); }

function chunkText(text: string, size = 512, overlap = 64): string[] {
  if (!text?.trim()) return [];
  const clean = text.replace(/\r\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
  const sents = clean.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = [];
  let cur = "", curTok = 0;
  for (const s of sents) {
    const st = est(s);
    if (curTok + st > size && cur) {
      chunks.push(cur.trim());
      const words = cur.split(/\s+/);
      cur = words.slice(-Math.ceil(overlap/4)).join(" ") + " " + s;
      curTok = est(cur);
    } else { cur += (cur?" ":"") + s; curTok += st; }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

interface KBEntry {
  agent_id: number;
  name: string;
  type: "foundational" | "operational" | "compliance" | "tactical";
  knowledge_layer: "foundational" | "operational" | "compliance" | "tactical";
  content: string;
  description: string;
  taxonomy_id: number;
  source_authority: string;
  source_url?: string;
}

const KB: KBEntry[] = [
  // ══ AGENT-TEKNIK #920 ════════════════════════════════════════════════════
  { agent_id:920, name:"Engineering Management Framework Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`AGENT-TEKNIK adalah Manajer Engineering AI yang mengintegrasikan 5 spesialis: DESIGNREV (review gambar), METHSTAT (method statement), TECHSPEC (spesifikasi teknis), VALUEENG (value engineering), dan BIM (koordinasi BIM). Routing berdasarkan intent: gambar/shop drawing → DESIGNREV; prosedur/cara kerja → METHSTAT; spesifikasi material → TECHSPEC; alternatif/efisiensi → VALUEENG; BIM/clash → BIM. Regulasi utama: UU 2/2017 Jasa Konstruksi; PP 14/2021; Permen PUPR 10/2021 SMM; FIDIC Red/Yellow Book; SNI relevan konstruksi.`,
    description:"Framework engineering management dan routing multi-agen teknik konstruksi",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:920, name:"Standar Engineering Konstruksi Indonesia & Internasional", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Standar teknis konstruksi yang berlaku di Indonesia: SNI 2847:2019 (Beton Struktural), SNI 1729:2015 (Bangunan Baja), SNI 1726:2019 (Perencanaan Gempa), SNI 1727:2020 (Beban Minimum). Standar internasional: ACI 318 (beton Amerika), AISC 360 (baja Amerika), AWS D1.1 (pengelasan), ASTM A36/A572 (baja struktural). Shop drawing harus menunjukkan dimensi aktual, detail sambungan, lokasi sebutan produk, dan referensi gambar kontrak. Method Statement wajib mencakup urutan pekerjaan, peralatan, SDM, K3, dan inspeksi mutu. Value Engineering menggunakan metodologi SAVE International: Function → Creative → Evaluation → Presentation.`,
    description:"Standar teknis engineering konstruksi Indonesia dan internasional",
    source_authority:"BSN-SNI", source_url:"https://www.bsn.go.id" },

  { agent_id:920, name:"Compliance Engineering & Pertanggungjawaban Teknis", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`Batasan pertanggungjawaban AGENT-TEKNIK: panduan teknis bersifat advisory; keputusan desain final merupakan tanggung jawab engineer bersertifikat (PU/Insinyur Profesional/SE). Perubahan desain yang signifikan memerlukan approval engineer of record dan notifikasi owner sesuai klausul FIDIC/kontrak. Shop drawing yang disetujui (status A atau B) tidak serta-merta melepaskan tanggung jawab kontraktor terhadap kesesuaian dengan kontrak. VE proposal harus melewati proses persetujuan formal sebelum implementasi. Model BIM bukan dokumen kontrak kecuali dinyatakan demikian dalam kontrak.`,
    description:"Batasan compliance dan pertanggungjawaban teknis engineering",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:920, name:"Tactical Routing Engineering Multi-Agent", type:"tactical", knowledge_layer:"tactical",
    taxonomy_id: TAX.PERENCANAAN_EKSEKUSI,
    content:`Routing AGENT-TEKNIK ke 5 sub-agen: (1) Kata kunci 'review gambar/shop drawing/submittal/gambar pelaksanaan/as-built' → AGENT-DESIGNREV #921. (2) Kata kunci 'method statement/prosedur/cara kerja/WBS teknis/urutan pekerjaan' → AGENT-METHSTAT #922. (3) Kata kunci 'spesifikasi/material/standar mutu/SNI/ASTM/equivalent material' → AGENT-TECHSPEC #923. (4) Kata kunci 'value engineering/alternatif desain/VE/optimasi/cost reduction/efisiensi' → AGENT-VALUEENG #924. (5) Kata kunci 'BIM/clash/model 3D/Revit/Navisworks/CDE/BEP/LOD' → AGENT-BIM #925.`,
    description:"Tactical routing matrix untuk engineering multi-agent orchestration",
    source_authority:"GUSTAFTA", source_url:"https://gustafta.com" },

  // ══ DESIGNREV #921 ════════════════════════════════════════════════════════
  { agent_id:921, name:"Prosedur Review Shop Drawing & Submittal Teknis", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Design Review Comment Sheet (DRCS) adalah dokumen formal review gambar konstruksi. Status review: A=Approved (dapat dilaksanakan), B=Approved with Comments (dapat dilaksanakan dengan perbaikan minor), C=Revise and Resubmit (harus direvisi dan diajukan ulang), D=Rejected (tidak dapat diterima). Setiap komentar DRCS harus menyebutkan: nomor drawing/dokumen yang direview, klausul spesifikasi atau standar yang dilanggar, deskripsi ketidaksesuaian, dan tindakan yang diperlukan. Proses: kontraktor submit → MK/owner review → komentar diterbitkan → kontraktor revisi → resubmit jika status C/D.`,
    description:"Prosedur dan format Design Review Comment Sheet (DRCS)",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:921, name:"Standar Gambar Teknis Konstruksi", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Standar gambar konstruksi yang berlaku: ISO 128 (Technical Drawing), SNI 03-1750 (Gambar Kerja). Shop drawing struktural harus mencakup: dimensi aktual, tulangan dengan diameter dan jarak, detail sambungan, bukaan dan penetrasi, angkur dan embed. Shop drawing MEP harus mencakup: routing pipa/duct/kabel, koordinasi lintas disiplin, detail support/hanger, spesifikasi produk, access panel. Gambar fasad/curtain wall: profil, detail junction, fixing, sistem ekspansi, dan waterproofing.`,
    description:"Standar dan persyaratan gambar teknis konstruksi",
    source_authority:"BSN-SNI" },

  { agent_id:921, name:"Compliance Review Gambar vs Kontrak", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`Review gambar harus memverifikasi: kesesuaian dimensi dengan Bill of Quantity, kesesuaian material dengan spesifikasi kontrak, koordinasi antar disiplin (tidak ada clash), kesesuaian dengan kode bangunan dan SNI. Approval shop drawing oleh MK/owner tidak melepaskan tanggung jawab kontraktor atas kebenaran gambar. Perubahan dari gambar kontrak harus melalui mekanisme formal (RFI/Change Order). Gambar as-built harus merefleksikan kondisi aktual terpasang.`,
    description:"Compliance dan batasan tanggung jawab review gambar teknis",
    source_authority:"PUPR" },

  // ══ METHSTAT #922 ════════════════════════════════════════════════════════
  { agent_id:922, name:"Standar Penyusunan Method Statement Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Method Statement (MS) adalah dokumen prosedur pelaksanaan pekerjaan konstruksi. Komponen wajib: (1) Deskripsi pekerjaan dan scope, (2) Referensi dokumen (spesifikasi, gambar, SNI), (3) Material dan peralatan yang dibutuhkan, (4) Kualifikasi SDM, (5) Urutan dan prosedur step-by-step, (6) Hold point/witness point untuk QC, (7) Persyaratan K3 dan APD, (8) Risiko dan mitigasi. Permen PUPR 10/2021 mensyaratkan MS untuk semua pekerjaan berisiko tinggi. MS yang disetujui menjadi acuan pelaksanaan dan tidak boleh diubah tanpa persetujuan MK.`,
    description:"Standar dan komponen wajib method statement konstruksi per Permen PUPR 10/2021",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:922, name:"Library Method Statement Pekerjaan Konstruksi Umum", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Method statement untuk pekerjaan utama konstruksi: Bored Pile: pengeboran, pemasangan tulangan, pengecoran tremie, tes integirtas. Tiang Pancang: mobilisasi alat, penentuan titik, pemancangan, PDA test/loading test. Pekerjaan Galian Dalam: dewatering, shoring, sequence galian, monitoring settlement. Pengecoran Beton In-Situ: persiapan bekisting, inspeksi tulangan (hold point), pengiriman beton (slump test), pemadatan, curing, stripping. Struktur Baja: fabrikasi, pengiriman, erection sequence, pengelasan, inspeksi NDT, cat pelindung. Waterproofing: persiapan permukaan, primer, aplikasi membran, flood test.`,
    description:"Library method statement untuk pekerjaan konstruksi utama",
    source_authority:"PUPR" },

  { agent_id:922, name:"Compliance Method Statement dan Persetujuan", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`MS yang belum disetujui tidak boleh digunakan sebagai acuan pelaksanaan. Pekerjaan yang dilaksanakan tidak sesuai MS yang disetujui dapat dihentikan oleh MK. Perubahan kondisi lapangan yang signifikan mengharuskan revisi MS. MS untuk pekerjaan berisiko tinggi (confined space, hot work, ketinggian) harus disertai risk assessment dan permit to work. Dokumentasi pelaksanaan (foto, laporan harian) harus membuktikan kesesuaian dengan MS.`,
    description:"Persyaratan compliance dan persetujuan method statement",
    source_authority:"PUPR" },

  // ══ TECHSPEC #923 ════════════════════════════════════════════════════════
  { agent_id:923, name:"Database Spesifikasi Teknis Material Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Spesifikasi material konstruksi utama: BETON: mutu K-225 (fc'18.7 MPa) s/d K-500 (fc'41.5 MPa). Semen: SNI 2049:2015 (Portland Type I-V). Agregat kasar: SNI 03-2461-2002, LA < 40%. Agregat halus: SNI 03-6820-2002, FM 2.3-3.1. BajaStruktur: BJTS40 (fy=400 MPa, fu=520 MPa, SNI 2052:2017). BJ34 (fy=240 MPa), BJ37 (fy=240 MPa), BJTS50 (fy=500 MPa). WF/IWF: ASTM A992/A572 Grade 50. ASTM A325/A490 (baut tegangan tinggi). WATERPROOFING: crystalline, torch-on membrane, sheet membrane, liquid applied.`,
    description:"Database spesifikasi teknis material konstruksi utama",
    source_authority:"BSN-SNI", source_url:"https://www.bsn.go.id" },

  { agent_id:923, name:"Prosedur Verifikasi dan Uji Material di Lapangan", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Metode pengujian material di lapangan: Beton segar: slump test (SNI 03-1972), flow test (SNI 03-6468), uji temperatur. Beton keras: uji tekan silinder 150x300mm atau kubus 150mm (SNI 1974:2011), Schmidt hammer (estimasi). Baja tulangan: uji tarik dan tekuk (SNI 07-0371-1998). Pengelasan: visual, PT (penetrant), UT (ultrasonic), RT (radiografi) sesuai AWS D1.1. Material submittal wajib dilampiri: Product Data Sheet (PDS), Test Report dari lab terakreditasi KAN, Certificate of Conformity, MSDS untuk B3.`,
    description:"Prosedur pengujian dan verifikasi material konstruksi di lapangan",
    source_authority:"BSN-SNI" },

  { agent_id:923, name:"Compliance Spesifikasi Material dan Substitusi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`Material harus sesuai spesifikasi kontrak sebelum dipasang. Material substitusi (or-equal/equivalent) memerlukan persetujuan formal dari owner/MK. Bukti ekuivalensi: test report independen, referensi proyek sejenis, data teknis yang dapat dibandingkan. Material yang sudah terpasang tanpa approval submittal dapat diperintahkan untuk dibongkar (NCR/Hold). Material impor harus dilengkapi COO (Certificate of Origin) dan dokumen kepabeanan. Sertifikasi SNI-mark wajib untuk material yang ditetapkan Menteri Perindustrian.`,
    description:"Compliance substitusi material dan persyaratan sertifikasi",
    source_authority:"PUPR" },

  // ══ VALUEENG #924 ════════════════════════════════════════════════════════
  { agent_id:924, name:"Metodologi Value Engineering SAVE International", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Value Engineering (VE) menggunakan Value Methodology dari SAVE International. Definisi Value: V = Function/Cost. Fase VE: (1) Information Phase: data proyek, cost breakdown, fungsi elemen. (2) FAST Diagram: Function Analysis System Technique — identifikasi fungsi dasar (must-do) vs sekunder (nice-to-have). (3) Creative Phase: brainstorming alternatif tanpa filter, minimum 20 ide. (4) Evaluation Phase: screening menggunakan matriks manfaat vs biaya, risiko teknis, constructability. (5) Development Phase: elaborasi alternatif terpilih. (6) Presentation Phase: VE Proposal dengan justifikasi dan persetujuan.`,
    description:"Metodologi Value Engineering SAVE International untuk konstruksi",
    source_authority:"SAVE-International" },

  { agent_id:924, name:"Aplikasi VE dalam Konstruksi Indonesia", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Target VE yang umum menghasilkan penghematan signifikan: Struktur: baja vs beton pratekan (5-15% penghematan), optimasi dimensi kolom/balok (3-8%), pondasi tiang vs mat foundation (10-20%). Arsitektur: material fasad alternatif (15-30%), optimasi sistem partisi (8-12%), material finishing (10-25%). MEP: chiller central vs split (energy savings 20-40%), teknologi LED lighting (energy 60-70%), sistem plumbing komposit vs baja galvanis. Permen PUPR 14/2021 memungkinkan VE dalam proses pengadaan. Life Cycle Cost (LCC) harus dipertimbangkan: biaya operasional 20 tahun seringkali melampaui biaya konstruksi.`,
    description:"Aplikasi dan peluang Value Engineering dalam proyek konstruksi Indonesia",
    source_authority:"PUPR" },

  { agent_id:924, name:"Compliance dan Batas VE dalam Kontrak Konstruksi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`VE proposal harus melewati persetujuan owner dan engineer of record sebelum implementasi. Klausul FIDIC 13.2 (Value Engineering) mengatur hak kontraktor mengusulkan VE dan bagi hasil penghematan. Kontrak PUPR: VE proposal harus disampaikan tertulis dengan estimasi penghematan dan analisis risiko. Perubahan yang mengakibatkan penurunan standar keselamatan atau fungsi tidak dapat diterima meski menghemat biaya. Dokumentasi VE (proposal, approval, as-built) harus dijaga untuk keperluan audit.`,
    description:"Compliance VE dalam kontrak FIDIC dan PUPR",
    source_authority:"PUPR" },

  // ══ BIM #925 ═════════════════════════════════════════════════════════════
  { agent_id:925, name:"Standar BIM ISO 19650 dan Regulasi PUPR", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`ISO 19650 adalah standar internasional untuk Organization and Digitization of Information about Buildings and Civil Engineering Works (BIM). Terdiri dari: ISO 19650-1 (Konsep dan Prinsip), ISO 19650-2 (Fase Aset Baru), ISO 19650-3 (Fase Operasional), ISO 19650-5 (Keamanan). Di Indonesia: SE Menteri PUPR 22/2018 tentang Panduan Teknis BIM; Permen PUPR 22/2020 tentang BIM dalam konstruksi infrastruktur; Perpres 22/2021 infrastruktur nasional wajib BIM. BEP (BIM Execution Plan) adalah dokumen yang menetapkan bagaimana BIM diimplementasikan dalam proyek: tujuan, peran dan tanggung jawab, LOD per fase, format file, platform CDE.`,
    description:"Standar BIM ISO 19650 dan regulasi BIM Indonesia dari PUPR",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:925, name:"Implementasi BIM dan Clash Detection", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`LOD (Level of Development): LOD 100 (konseptual), LOD 200 (desain skematik), LOD 300 (desain detail), LOD 350 (koordinasi), LOD 400 (fabrikasi), LOD 500 (as-built). Clash Detection menggunakan Navisworks atau Solibri: Hard Clash (tumpang tindih fisik), Soft Clash (tidak memenuhi jarak minimum), 4D Clash (konflik jadwal). Workflow clash: export model per disiplin → federate di Navisworks → jalankan clash test → categorize → assign ke PIC → resolusi → reverifikasi. CDE (Common Data Environment): BIM 360/ACC, ProjectWise, atau platform cloud untuk kolaborasi. Standar penamaan file: [Project]-[Originator]-[Zone]-[Level]-[Type]-[Role]-[Number] sesuai ISO 19650-2.`,
    description:"Implementasi BIM clash detection dan CDE workflow",
    source_authority:"ISO-19650" },

  { agent_id:925, name:"Compliance BIM dan Status Dokumen Legal", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`Model BIM bukan dokumen kontrak kecuali dinyatakan eksplisit dalam kontrak. Gambar 2D yang diekstrak dari BIM tetap menjadi dokumen legal. Model LOD 500 (as-built) harus diserahkan kepada owner bersama gambar as-built konvensional. Data CDE harus di-backup dan dijaga kerahasiaannya sesuai ISO 19650-5. Hak kekayaan intelektual model BIM ditentukan dalam kontrak. Proyek pemerintah wajib BIM sesuai Perpres 22/2021 untuk proyek infrastruktur > Rp 100 miliar.`,
    description:"Compliance BIM: status hukum model, hak IP, dan kewajiban PUPR",
    source_authority:"PUPR" },

  // ══ AGENT-SAFIRA #926 ════════════════════════════════════════════════════
  { agent_id:926, name:"Sistem Manajemen K3 Konstruksi: SMKK dan PP 50/2012", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.SMK3,
    content:`SMKK (Sistem Manajemen Keselamatan Konstruksi) diatur dalam Permen PUPR 8/2023. SMKK terdiri dari 5 elemen: (1) Kepemimpinan dan Partisipasi Tenaga Kerja, (2) Perencanaan Keselamatan Konstruksi (HIRADC, RKK), (3) Dukungan K3 (sumber daya, kompetensi, komunikasi), (4) Operasi K3 (pengendalian, PTW, pengelolaan darurat), (5) Evaluasi Kinerja (inspeksi, audit, tinjauan manajemen). PP 50/2012 mewajibkan SMK3 untuk perusahaan dengan >100 karyawan atau berisiko tinggi; terdiri dari 5 prinsip, 12 elemen, dan 166 kriteria audit. Sanksi ketidakpatuhan: peringatan tertulis, penghentian sementara, pencabutan izin usaha.`,
    description:"Framework SMKK Permen PUPR 8/2023 dan SMK3 PP 50/2012",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:926, name:"Routing K3 Multi-Agent: HIRADC, Investigasi, Inspeksi, SMKK, ERP", type:"tactical", knowledge_layer:"tactical",
    taxonomy_id: TAX.SMK3,
    content:`Routing AGENT-SAFIRA: (1) 'HIRADC/identifikasi bahaya/JSA/risiko K3/APD/hazard' → AGENT-HIRADC #927. (2) 'investigasi/kecelakaan/incident/near miss/RCA/korban/laporan Kemnaker' → AGENT-INSIDENRCA #928. (3) 'checklist inspeksi/audit K3/pengamatan/unsafe act/unsafe condition/temuan K3' → AGENT-K3INSPECT #929. (4) 'dokumen SMKK/RKK/program K3/anggaran K3/tender K3' → AGENT-SMKK #930. (5) 'darurat/evakuasi/kebakaran/bencana/emergency/P3K/muster point' → AGENT-ERP #931.`,
    description:"Tactical routing K3 multi-agent untuk SAFIRA orchestrator",
    source_authority:"GUSTAFTA" },

  { agent_id:926, name:"Operasi K3 Konstruksi: PTW, APD, dan Keselamatan Lapangan", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.SMK3,
    content:`Sistem Izin Kerja (Permit to Work/PTW) untuk pekerjaan berisiko tinggi: Hot Work Permit (pengelasan, cutting), Confined Space Entry Permit, Working at Height Permit (>2m), Excavation Permit (>1.5m), Electrical Isolation Permit. APD wajib proyek konstruksi: helm (SNI 8011:2014), rompi (Hi-Vis), sepatu safety (SNI 7037:2009), harness (untuk ketinggian), sarung tangan, kacamata pelindung. Scaffolding: SNI 03-2020, inspeksi sebelum penggunaan, tag sistem (hijau=aman, kuning=perhatian, merah=jangan digunakan). Toolbox meeting: wajib setiap pagi sebelum kerja, max 15 menit, catat hadir.`,
    description:"Operasi K3 konstruksi: PTW, APD standar, dan kontrol lapangan",
    source_authority:"Kemnaker" },

  { agent_id:926, name:"Compliance K3: Regulasi Wajib dan Sanksi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.SMK3,
    content:`Regulasi K3 konstruksi yang wajib dipenuhi: UU 1/1970 K3 — kewajiban melindungi tenaga kerja; PP 50/2012 SMK3 — audit wajib tiap 3 tahun; Permen PUPR 8/2023 SMKK — RKK wajib untuk semua proyek PUPR; Permenaker 9/2016 K3 ketinggian. Sanksi pelanggaran K3: pidana penjara max 1 tahun dan/atau denda max Rp 15 juta (UU 1/1970); pencabutan izin konstruksi; kewajiban kompensasi korban melalui BPJS Ketenagakerjaan. Ahli K3 bersertifikat wajib ada untuk proyek >100 pekerja. Biaya K3 minimum: 1.5% dari nilai kontrak (SE PUPR 11/2019).`,
    description:"Regulasi wajib K3 konstruksi dan sanksi ketidakpatuhan",
    source_authority:"Kemnaker", source_url:"https://jdih.kemnaker.go.id" },

  // ══ HIRADC #927 ══════════════════════════════════════════════════════════
  { agent_id:927, name:"Metodologi HIRADC ISO 45001 untuk Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.SMK3,
    content:`HIRADC (Hazard Identification, Risk Assessment, Determining Control) adalah proses sistematis mengidentifikasi bahaya dan menentukan kontrol risiko. Matriks risiko: Likelihood (L) 1-5 × Consequence (C) 1-5 = Risk Score 1-25. L: 1=Rare (<1%/tahun), 2=Unlikely (1-10%), 3=Possible (10-50%), 4=Likely (50-90%), 5=Almost Certain (>90%). C: 1=Insignificant (first aid), 2=Minor (medical treatment), 3=Moderate (LTI<30 hari), 4=Major (LTI>30 hari/permanen), 5=Catastrophic (fatality). Risk Level: 1-4 Low (Monitor), 5-9 Medium (Action Plan), 10-16 High (Corrective Action), 17-25 Critical (Stop Work). Hirarki kontrol: 1.Eliminasi, 2.Substitusi, 3.Engineering Control, 4.Administrative, 5.APD.`,
    description:"Metodologi HIRADC berbasis ISO 45001 dengan matriks risiko untuk konstruksi",
    source_authority:"ISO-45001" },

  { agent_id:927, name:"HIRADC Pekerjaan Berisiko Tinggi Konstruksi", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.SMK3,
    content:`Bahaya utama per jenis pekerjaan konstruksi: KETINGGIAN: jatuh dari scaffolding/tangga/platform (C=5); benda jatuh menimpa pekerja bawah (C=4). Kontrol: PPE (harness/helmet), guardrail, toeboard, exclusion zone. GALIAN: runtuh dinding galian (C=5); terpapar gas berbahaya (C=5). Kontrol: shoring/soldier pile, gas monitoring, confined space procedure. CRANE/ALAT BERAT: beban jatuh (C=5); alat terbalik (C=5); tersambar lengan crane (C=4). Kontrol: SIA/SIO valid, load chart, exclusion zone, banksman. PENGELASAN: kebakaran (C=4); tersengat listrik (C=5); fume (C=3). Kontrol: Hot Work Permit, fire watch, ELCB, ventilasi. LISTRIK SEMENTARA: tersengat listrik (C=5); kebakaran (C=4). Kontrol: ELCB, grounding, kabel berselubung, mekanisme lockout.`,
    description:"HIRADC standar untuk pekerjaan berisiko tinggi konstruksi",
    source_authority:"Kemnaker" },

  { agent_id:927, name:"Compliance HIRADC dan Update Berkala", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.SMK3,
    content:`HIRADC harus dibuat sebelum pekerjaan dimulai dan diperbarui saat: scope pekerjaan berubah; terjadi insiden/near miss; ada peralatan/metode baru. HIRADC harus dikomunikasikan kepada semua pekerja terdampak (toolbox meeting/safety briefing). Pengendalian risiko Critical dan High harus diimplementasikan sebelum pekerjaan dimulai. HIRADC merupakan bagian dari RKK dan dapat diperiksa saat audit SMKK. HIRADC yang tidak dilaksanakan merupakan ketidaksesuaian dalam audit PP 50/2012.`,
    description:"Compliance HIRADC: pembaruan, komunikasi, dan kewajiban implementasi",
    source_authority:"PUPR" },

  // ══ INSIDENRCA #928 ══════════════════════════════════════════════════════
  { agent_id:928, name:"Prosedur Investigasi Kecelakaan Kerja Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.SMK3,
    content:`Investigasi kecelakaan kerja harus dilakukan segera setelah kejadian. Langkah investigasi: (1) Amankan TKP dan berikan pertolongan pertama; (2) Notifikasi manajemen dan P2K3; (3) Kumpulkan bukti fisik dan wawancara saksi; (4) Rekonstruksi kronologi; (5) Analisis akar masalah (RCA); (6) Tentukan CAPA; (7) Susun laporan resmi. Kategori insiden: First Aid Injury (FAI), Medical Treatment Injury (MTI), Lost Time Injury (LTI), Permanent Total/Partial Disability, Fatality. Near miss dan kondisi berbahaya juga harus diselidiki. Pelaporan ke Kemnaker: insiden serius (LTI+) dalam 2×24 jam (Permen Naker 03/1998).`,
    description:"Prosedur investigasi kecelakaan kerja dan pelaporan ke Kemnaker",
    source_authority:"Kemnaker", source_url:"https://jdih.kemnaker.go.id" },

  { agent_id:928, name:"Metodologi RCA: 5-Why, Fishbone, Fault Tree", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.SMK3,
    content:`3 metode RCA utama: (1) 5-Why Analysis: tanyakan 'mengapa' secara berulang sampai 5 level untuk menemukan root cause. Contoh: Pekerja jatuh → Mengapa? Tidak pakai harness → Mengapa? Tidak ada harness → Mengapa? Tidak dibeli → Mengapa? Tidak ada budget K3 → ROOT CAUSE: Manajemen tidak mengalokasikan budget K3. (2) Fishbone (Ishikawa): kategorikan penyebab ke 6M: Man (human error, fatigue), Machine (kegagalan alat), Method (prosedur salah/tidak ada), Material (material rusak), Measurement (inspeksi tidak dilakukan), Milieu (kondisi lingkungan). (3) Fault Tree Analysis (FTA): dekomposisi top event secara logis ke contributing events menggunakan gerbang AND/OR. CAPA: Corrective Action menghilangkan root cause; Preventive Action mencegah recurrence sistemik.`,
    description:"Metodologi RCA: 5-Why, Fishbone, dan Fault Tree Analysis untuk kecelakaan konstruksi",
    source_authority:"ISO-45001" },

  { agent_id:928, name:"Compliance Pelaporan Insiden K3 Konstruksi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.SMK3,
    content:`Kewajiban pelaporan insiden: LTI (>1 hari tidak bisa kerja) wajib lapor ke Disnaker dalam 2×24 jam. Fatality: lapor ke Disnaker, Kemnaker, dan Polisi. BPJS Ketenagakerjaan: klaim JKK (Jaminan Kecelakaan Kerja) harus dilaporkan dalam 2×24 jam dengan formulir KK1/KK3/KK4. Kontraktor wajib menanggung biaya medis selama proses klaim BPJS berlangsung. Investigasi yang tidak dilaksanakan atau dilaporkan tidak jujur dapat mengakibatkan sanksi pidana. Rekaman investigasi harus dijaga minimal 5 tahun.`,
    description:"Compliance pelaporan insiden K3 ke Kemnaker, Disnaker, dan BPJS Ketenagakerjaan",
    source_authority:"Kemnaker" },

  // ══ K3INSPECT #929 ═══════════════════════════════════════════════════════
  { agent_id:929, name:"Checklist Inspeksi K3 Konstruksi Komprehensif", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.SMK3,
    content:`Inspeksi K3 adalah kegiatan pemeriksaan kondisi kerja untuk mengidentifikasi potensi bahaya sebelum menjadi kecelakaan. Jenis inspeksi: (1) Pre-use inspection: alat berat, scaffolding, crane sebelum digunakan. (2) Daily inspection: kondisi site, APD pekerja, housekeeping, listrik sementara. (3) Weekly inspection: seluruh site termasuk barak pekerja, gudang B3, sistem proteksi kebakaran. (4) Monthly inspection/internal audit: sistem PTW, pelatihan K3, dokumen SMKK. (5) Quarterly: audit PP 50/2012. Temuan inspeksi dikategorikan: Immediate Danger to Life and Health (IDLH) — hentikan pekerjaan; High Risk — selesaikan dalam 24 jam; Medium Risk — dalam 1 minggu; Low Risk — dalam 1 bulan.`,
    description:"Jenis dan siklus inspeksi K3 konstruksi dengan kategorisasi temuan",
    source_authority:"Kemnaker" },

  { agent_id:929, name:"Checklist Inspeksi Per Area dan Pekerjaan Kritis", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.SMK3,
    content:`Checklist inspeksi kritis: SCAFFOLDING: kondisi standard/ledger/transom, clamp kencang, baseplate, toeboard, guardrail 1.0m dan mid-rail 0.5m, papan bersih dan rapat, netting, tag warna. CRANE: pre-use checklist, kondisi wire rope (tidak ada 10% kawat putus per pitch), hook safety latch, load chart terpasang, anemometer, overload limiter, SIA valid. LISTRIK SEMENTARA: ELCB dipasang dan berfungsi, kabel tidak terendam, tidak ada sambungan terbuka, panel terkunci. EXCAVATION: shoring terpasang, akses tangga setiap 7.5m, tidak ada pekerjaan di bawah alat berat, gas monitoring untuk galian >1.2m.`,
    description:"Checklist inspeksi K3 untuk area dan pekerjaan berisiko tinggi konstruksi",
    source_authority:"PP-50-2012" },

  { agent_id:929, name:"Compliance Inspeksi K3 dan Kewenangan Stop Work", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.SMK3,
    content:`Stop Work Authority (SWA): setiap pekerja berhak menghentikan pekerjaan yang dianggap membahayakan jiwa tanpa sanksi. Temuan IDLH harus dihentikan dan diselesaikan sebelum pekerjaan dilanjutkan. Temuan inspeksi harus dicatat dan ditindaklanjuti; tracking terbuka sampai closed. Audit PP 50/2012 (166 kriteria): nilai > 84% = Bendera Emas; 64-84% = Bendera Perak; < 64% = tidak lulus. Kegagalan audit SMK3 berulang dapat mengakibatkan penghentian kegiatan oleh Kemnaker. Inspektur K3 berwenang memasuki dan memeriksa tempat kerja kapan saja (UU 1/1970 Pasal 5).`,
    description:"Compliance SWA, tindak lanjut temuan, dan audit SMK3 PP 50/2012",
    source_authority:"PP-50-2012" },

  // ══ SMKK #930 ════════════════════════════════════════════════════════════
  { agent_id:930, name:"Struktur RKK Sesuai Permen PUPR 8/2023", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.SMK3,
    content:`Rencana Keselamatan Konstruksi (RKK) sesuai Permen PUPR 8/2023 terdiri dari 2 jenis: RKK Penawaran (disusun saat tender) dan RKK Pelaksanaan (disusun setelah kontrak ditandatangani). Isi RKK Penawaran: Elemen 1 Kepemimpinan (kebijakan K3, organisasi K3, komitmen pimpinan); Elemen 2 Perencanaan (IBPR, standar K3 yang diacu, tujuan dan sasaran); Elemen 3 Dukungan (sumber daya, kompetensi, peralatan K3); Elemen 4 Operasi (pengendalian bahaya, manajemen subkontraktor, PTW, ERP); Elemen 5 Evaluasi (program inspeksi, audit, pelaporan). RKK Pelaksanaan lebih detail dengan data spesifik proyek, HIRADC lengkap, dan jadwal implementasi.`,
    description:"Struktur RKK sesuai Permen PUPR 8/2023 untuk tender dan pelaksanaan",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:930, name:"Anggaran K3 dan Program Keselamatan Konstruksi", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.SMK3,
    content:`Biaya K3 konstruksi minimum (SE PUPR 11/2019): termasuk dalam komponen Biaya Umum Kontraktor. Item biaya K3 yang diakui: APD pekerja (helm, rompi, sepatu, harness, dll.), peralatan K3 (APAR, P3K, rambu, barikade), fasilitas K3 (toilet, ruang P3K, barak, air minum), pelatihan K3 (toolbox meeting, safety induction, pelatihan Ahli K3), asuransi dan BPJS Ketenagakerjaan, audit K3. Program K3 minimum: safety induction untuk semua pekerja baru, toolbox meeting harian, weekly safety inspection, monthly safety meeting P2K3, quarterly drill darurat. Reporting: rekap jam kerja dan insiden kepada Disnaker per bulan.`,
    description:"Anggaran dan program K3 konstruksi minimum sesuai SE PUPR 11/2019",
    source_authority:"PUPR" },

  { agent_id:930, name:"Compliance SMKK dan Kewajiban RKK dalam Kontrak PUPR", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.SMK3,
    content:`RKK wajib ada dalam dokumen penawaran tender PUPR (tanpa RKK = gugur administrasi). RKK Pelaksanaan wajib disetujui PPK sebelum mobilisasi. Perubahan signifikan pada RKK memerlukan persetujuan ulang PPK. Kontraktor wajib melaksanakan program K3 sesuai RKK; ketidaksesuaian dapat dikenakan denda. BPJS Ketenagakerjaan wajib untuk semua pekerja (Program JKK dan JKM). Ahli K3 Konstruksi (SKK Muda minimal) wajib ada di lapangan untuk proyek nilai > Rp 5 miliar. Pelaporan bulanan K3 (jam kerja, insiden) ke PPK dan Disnaker.`,
    description:"Kewajiban SMKK dalam kontrak PUPR dan compliance pelaporan K3",
    source_authority:"PUPR" },

  // ══ ERP #931 ═════════════════════════════════════════════════════════════
  { agent_id:931, name:"Kerangka Emergency Response Plan Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.SMK3,
    content:`Emergency Response Plan (ERP) adalah dokumen yang menetapkan prosedur menghadapi keadaan darurat di proyek konstruksi. Skenario darurat utama: (1) Kebakaran, (2) Kecelakaan kerja serius/fatality, (3) Gempa bumi, (4) Banjir, (5) Keruntuhan struktur, (6) Kebocoran gas/B3, (7) Insiden alat berat. Struktur ERP: Tim Tanggap Darurat (ketua, anggota, peran masing-masing), Jalur notifikasi (chain of communication), Sistem alarm dan signal evakuasi, Titik kumpul (muster point) dan head count procedure, Koordinasi eksternal (pemadam, ambulans 119, polisi 110), Prosedur pertolongan pertama, Recovery procedure. Drillharus dilaksanakan minimal 1x per proyek dan didokumentasikan.`,
    description:"Kerangka ERP konstruksi: skenario, struktur tim, dan prosedur darurat",
    source_authority:"Kemnaker" },

  { agent_id:931, name:"Prosedur Kebakaran, Evakuasi, dan Pertolongan Pertama", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.SMK3,
    content:`Prosedur kebakaran: (1) Temukan api → aktifkan alarm; (2) Hubungi fire warden; (3) Jika kecil: padamkan dengan APAR (PASS: Pull-Aim-Squeeze-Sweep); (4) Jika besar: evakuasi semua orang, hubungi 113 (pemadam); (5) Kumpul di muster point; (6) Head count. APAR: inspeksi bulanan, penggantian jika < 75% tekanan, jenis ABC untuk area umum, CO2 untuk panel listrik. Prosedur evakuasi: sinyal alarm → berhenti kerja → matikan peralatan berbahaya → ikuti jalur evakuasi → muster point → head count → tidak kembali sampai all-clear. Pertolongan pertama (DRSAB): Danger-Response-Send for help-Airway-Breathing/CPR.`,
    description:"Prosedur operasional kebakaran, evakuasi, dan pertolongan pertama",
    source_authority:"Kemnaker" },

  { agent_id:931, name:"Compliance ERP: Kewajiban Sosialisasi dan Drill", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.SMK3,
    content:`ERP harus disosialisasikan kepada SEMUA pekerja di site (termasuk subkontraktor) dalam bahasa yang dipahami. Prosedur darurat harus dipasang di lokasi strategis (kantor, barak, area kerja utama). Kontak darurat (pemadam 113, ambulans 119, polisi 110, manajemen) harus tersedia dan terverifikasi. Drill kebakaran minimal 1x per 6 bulan; didokumentasikan dengan absensi dan photo. Setelah drill: evaluasi kelemahan dan perbaiki ERP. APAR harus tersedia 1 unit per 200m² atau setiap jarak 20m di area kerja. Jalur evakuasi harus bebas dari halangan.`,
    description:"Compliance ERP: kewajiban sosialisasi, drill, dan sarana proteksi kebakaran",
    source_authority:"Kemnaker" },

  // ══ AGENT-MUTU #932 ══════════════════════════════════════════════════════
  { agent_id:932, name:"Sistem Manajemen Mutu Konstruksi ISO 9001 dan PUPR", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO9001,
    content:`Manajemen mutu konstruksi diatur dalam ISO 9001:2015 dan Permen PUPR 10/2021 tentang SMM. RMPK (Rencana Mutu Pelaksanaan Konstruksi) adalah dokumen perencanaan mutu spesifik proyek. Komponen utama RMPK: struktur organisasi mutu, diagram alir pekerjaan, jadwal inspeksi dan pengujian (ITP), prosedur penanganan NCR, daftar rekaman mutu. ISO 9001:2015 berbasis risk-based thinking dan perbaikan berkelanjutan (Plan-Do-Check-Act). PUPR mewajibkan RMPK untuk semua kontrak di atas nilai tertentu; kontraktor bersertifikat ISO 9001 mendapat nilai tambah dalam evaluasi tender.`,
    description:"Framework SMM konstruksi: ISO 9001:2015 dan RMPK Permen PUPR 10/2021",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:932, name:"Routing Mutu Multi-Agent: QC Plan, NCR, Submittal, Audit, As-Built", type:"tactical", knowledge_layer:"tactical",
    taxonomy_id: TAX.ISO9001,
    content:`Routing AGENT-MUTU: (1) 'QA/QC plan/ITP/inspection test plan/rencana mutu/hold point' → AGENT-QAQCPLAN #933. (2) 'NCR/nonconformance/ketidaksesuaian/CAPA/tindakan korektif/defect' → AGENT-NCR #934. (3) 'submittal/material approval/produk/test report/or-equal/equivalent' → AGENT-SUBMITTAL #935. (4) 'audit mutu/surveilans/review ISO 9001/klausal audit' → AGENT-QAUDIT #936. (5) 'as-built/punch list/serah terima/PHO/FHO/BAST/dokumentasi akhir' → AGENT-ASBUILT #937.`,
    description:"Tactical routing mutu multi-agent untuk MUTU orchestrator",
    source_authority:"GUSTAFTA" },

  { agent_id:932, name:"Operasi Pengendalian Mutu Lapangan Konstruksi", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO9001,
    content:`Siklus pengendalian mutu konstruksi: Plan (RMPK, ITP) → Do (pelaksanaan sesuai spesifikasi) → Check (inspeksi, pengujian, audit) → Act (NCR, CAPA, perbaikan). Kualitas 7 alat (7QC Tools): Check sheet, Histogram, Pareto chart, Cause-Effect diagram (Fishbone), Scatter diagram, Control chart, Flowchart. Critical to Quality (CTQ) untuk konstruksi: dimensi struktural (toleransi ±5mm untuk kolom, ±10mm untuk pelat), kuat tekan beton (min 0.85 fc' untuk benda uji), ketebalan cat (min 80% DFT target), kedataran lantai (toleransi 3mm per 3m).`,
    description:"Operasi dan siklus pengendalian mutu lapangan konstruksi",
    source_authority:"ISO-9001" },

  { agent_id:932, name:"Compliance Mutu: Sertifikasi ISO dan Persyaratan Kontrak", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO9001,
    content:`ISO 9001 bukan kewajiban hukum tapi prasyarat tender PUPR untuk kontraktor besar. RMPK wajib disetujui PPK/MK sebelum mobilisasi. Pekerjaan yang tidak sesuai RMPK dapat diklasifikasikan sebagai NCR dan dikenakan biaya perbaikan ke kontraktor. Rekaman mutu (test reports, inspection records, NCR log, CAPA log) harus disimpan selama masa pemeliharaan + 2 tahun. As-built diserahkan kepada owner sebagai bagian dari serah terima. Surveilans sertifikasi ISO 9001 dilakukan 1x per tahun; re-sertifikasi setiap 3 tahun.`,
    description:"Compliance sertifikasi ISO 9001 dan persyaratan rekaman mutu kontrak",
    source_authority:"PUPR" },

  // ══ QAQCPLAN #933 ════════════════════════════════════════════════════════
  { agent_id:933, name:"ITP (Inspection Test Plan) Format dan Standar", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO9001,
    content:`ITP adalah dokumen yang menetapkan inspeksi dan pengujian yang harus dilakukan untuk setiap paket pekerjaan. Kolom ITP standar: No | Aktivitas/Item Pekerjaan | Spesifikasi/Standar Referensi | Metode Inspeksi | Frekuensi/Kuantitas | Pihak Inspeksi (K/MK/O) | Dokumen yang Dihasilkan | Status Point (H/W/R). H=Hold Point: pekerjaan tidak boleh dilanjutkan tanpa approval tertulis dari pihak berwenang. W=Witness Point: inspeksi harus dihadiri pihak yang ditunjuk. R=Review Point: dokumen perlu direview, tidak perlu kehadiran fisik. K=Kontraktor, MK=Manajemen Konstruksi/Konsultan, O=Owner/Pemberi Kerja.`,
    description:"Format dan standar ITP dengan sistem Hold/Witness/Review Point",
    source_authority:"ISO-9001" },

  { agent_id:933, name:"ITP untuk Pekerjaan Konstruksi Utama", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO9001,
    content:`ITP beton in-situ: Persiapan bekisting (R-K), Inspeksi tulangan (W-MK → Hold), Pengiriman beton: slump test, suhu, volume (W-MK), Pengecoran dan pemadatan (R-K), Pengambilan sampel benda uji (W-MK), Curing (R-K), Stripping dan surveying (W-MK), Hasil uji tekan 7 dan 28 hari (H-MK). ITP struktur baja: Material mill cert (R-MK), Fabrikasi & dimensi (W-MK), Pengelasan: visual+NDT (W-MK), Coating dry film thickness (W-MK), Erection toleransi (W-MK→H), High-strength bolt torque (H-MK). ITP waterproofing: Persiapan permukaan (H-MK), Primer (W-MK), Aplikasi membran (W-MK), Flood test 24 jam (H-MK/O).`,
    description:"ITP terstandarisasi untuk pekerjaan beton, baja, dan waterproofing",
    source_authority:"ISO-9001" },

  { agent_id:933, name:"Compliance ITP dan Pelaksanaan Hold Point", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO9001,
    content:`Hold point adalah mandatory stop: pekerjaan tidak dapat dilanjutkan sampai ada persetujuan tertulis dari pihak yang ditentukan dalam ITP. Melewati hold point tanpa approval adalah pelanggaran kontrak serius. Bila hold point terlewati: pekerjaan dihentikan, NCR diterbitkan, pekerjaan mungkin harus dibongkar untuk diverifikasi. Witness point: kontraktor harus notifikasi minimum 24-48 jam sebelumnya; jika tidak hadir, kontraktor dapat melanjutkan setelah batas waktu. ITP harus disepakati bersama antara kontraktor dan MK/owner sebelum pelaksanaan pekerjaan dimulai.`,
    description:"Compliance Hold Point ITP dan konsekuensi pelanggarannya",
    source_authority:"ISO-9001" },

  // ══ NCR #934 ═════════════════════════════════════════════════════════════
  { agent_id:934, name:"Sistem NCR dan CAPA Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO9001,
    content:`NCR (Nonconformance Report) adalah dokumen formal yang mendokumentasikan ketidaksesuaian terhadap spesifikasi kontrak, standar, atau prosedur yang berlaku. Komponen NCR: Nomor NCR unik (format: [Project Code]-NCR-[Tahun]-[Nomor Urut]), Tanggal, Lokasi, Deskripsi ketidaksesuaian (apa yang ditemukan vs standar yang berlaku), Referensi spesifikasi yang dilanggar, Disposisi (Use As Is/Rework/Reject/Waiver), Tindakan yang diperlukan, Timeline, Verifikasi penutupan. CAPA: Corrective Action (CA) = tindakan menghilangkan penyebab ketidaksesuaian yang sudah terjadi; Preventive Action (PA) = tindakan mencegah potensi ketidaksesuaian yang belum terjadi.`,
    description:"Sistem NCR dan CAPA dalam manajemen mutu konstruksi",
    source_authority:"ISO-9001" },

  { agent_id:934, name:"Disposisi NCR dan Proses Penutupan", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO9001,
    content:`4 opsi disposisi NCR: (1) Use As Is (UAI): ketidaksesuaian minor yang tidak mempengaruhi fungsi/keselamatan; memerlukan justifikasi teknis dan approval MK/owner. (2) Rework: perbaiki pekerjaan hingga memenuhi spesifikasi; re-inspeksi diperlukan. (3) Reject/Replace: material atau pekerjaan dibuang dan diganti dengan yang sesuai spesifikasi. (4) Waiver: permohonan kepada owner untuk menerima kondisi tidak sesuai dengan alasan teknis dan/atau ekonomis yang valid; owner memiliki hak penuh untuk menolak. Proses penutupan NCR: tindakan selesai → request verifikasi dari penerbit NCR → close NCR dengan tanggal dan tandatangan. SLA penutupan NCR: kritis 24 jam, major 3 hari, minor 1 minggu.`,
    description:"4 opsi disposisi NCR dan proses penutupan berdasarkan SLA",
    source_authority:"ISO-9001" },

  { agent_id:934, name:"Compliance NCR: Kewajiban Tindak Lanjut dan Audit", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO9001,
    content:`NCR yang tidak ditindaklanjuti dalam SLA yang ditetapkan dapat mengakibatkan eskalasi ke manajemen dan penghentian pembayaran. Kontraktor tidak dapat menutup NCR secara sepihak; harus mendapat konfirmasi dari penerbit NCR (biasanya MK/owner). NCR log (daftar NCR, status, aging) harus dipresentasikan dalam weekly/monthly quality meeting. Rekaman NCR lengkap (termasuk foto, bukti perbaikan) harus disimpan dalam quality record. Saat audit ISO 9001 atau audit PUPR, NCR yang tidak closed atau CAPA yang tidak efektif merupakan temuan audit. Biaya perbaikan NCR merupakan tanggung jawab pihak yang menyebabkan ketidaksesuaian.`,
    description:"Compliance NCR: eskalasi, rekaman, dan tanggung jawab biaya perbaikan",
    source_authority:"ISO-9001" },

  // ══ SUBMITTAL #935 ═══════════════════════════════════════════════════════
  { agent_id:935, name:"Proses Material Submittal Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO9001,
    content:`Material submittal adalah proses formal pengajuan data teknis material oleh kontraktor kepada MK/owner untuk mendapat persetujuan sebelum material dipasang. Jenis submittal: (1) Material/Product Submittal: data produk, test report, sertifikat; (2) Shop Drawing: gambar fabrikasi/instalasi; (3) Method Statement; (4) Sample fisik; (5) Warranty/Certificate. Dokumen wajib dalam submittal material: Product Data Sheet dari produsen, Test Report dari laboratorium terakreditasi KAN, Certificate of Conformance (SNI-mark atau setara), MSDS untuk bahan berbahaya, referensi proyek sejenis. Status submittal: A=Approved, B=Approved with Comments, C=Revise & Resubmit, D=Rejected. Timeline review: biasanya 7-14 hari kerja.`,
    description:"Proses dan persyaratan dokumen material submittal konstruksi",
    source_authority:"PUPR" },

  { agent_id:935, name:"Review Material Or-Equal dan Equivalent Material", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO9001,
    content:`Material substitusi (or-equal atau equivalent material) adalah material berbeda dari yang dispesifikasikan tapi memiliki kinerja setara. Kriteria penerimaan or-equal: (1) Kinerja teknis setara atau lebih baik dari material yang dispesifikasikan (berdasarkan data teknis); (2) Tidak memerlukan modifikasi desain; (3) Tersedia dalam volume dan jadwal yang diperlukan; (4) Harga sebanding atau lebih ekonomis. Bukti ekuivalensi: test report perbandingan, referensi proyek serupa di Indonesia, sertifikasi internasional yang diakui. Material lokal SNI yang setara dengan material impor dapat diterima jika kinerja teknis terpenuhi. Keputusan final ada di tangan owner/perencana.`,
    description:"Kriteria dan proses evaluasi material or-equal/equivalent dalam submittal",
    source_authority:"PUPR" },

  { agent_id:935, name:"Compliance Material Approval dan Penggunaan di Site", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO9001,
    content:`Material dilarang dipasang di site sebelum mendapat approval submittal dari MK/owner. Material yang dipasang tanpa approval dapat diperintahkan untuk dibongkar atas biaya kontraktor. Sertifikat SNI wajib untuk produk yang ditetapkan dalam Permenperin sebagai SNI wajib (baja tulangan, semen, pipa, dll.). Import material memerlukan Certificate of Origin (COO) dan dokumen kepabeanan. Kadaluarsa material (semen, cat, sealant) harus diverifikasi sebelum penggunaan. Perubahan merek/tipe material dari yang sudah diapprove memerlukan resubmittal.`,
    description:"Compliance penggunaan material: larangan tanpa approval dan kewajiban SNI",
    source_authority:"PUPR" },

  // ══ QAUDIT #936 ══════════════════════════════════════════════════════════
  { agent_id:936, name:"Audit Mutu Internal ISO 9001 untuk Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO9001,
    content:`Audit mutu internal adalah evaluasi sistematis terhadap kesesuaian dan efektivitas sistem manajemen mutu berdasarkan ISO 9001:2015. Jenis audit: (1) System Audit: apakah prosedur dan proses terdokumentasi dan dijalankan; (2) Product/Work Audit: apakah output pekerjaan sesuai spesifikasi; (3) Process Audit: apakah proses dilaksanakan sesuai prosedur. Temuan audit: Major Nonconformity (sistem tidak berjalan atau tidak ada bukti compliance); Minor Nonconformity (sistem ada tapi ada kelemahan); Observation (peluang perbaikan). Auditor internal harus tidak mengaudit area kerjanya sendiri (objektivitas). Standar audit: ISO 19011:2018.`,
    description:"Metodologi audit mutu internal ISO 9001 untuk konstruksi",
    source_authority:"ISO-9001" },

  { agent_id:936, name:"Audit Mutu per Klausal ISO 9001:2015", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO9001,
    content:`Klausal ISO 9001:2015 yang sering diaudit di konstruksi: 4.1 Konteks organisasi (pemahaman isu internal/eksternal). 4.2 Pihak berkepentingan. 5.1 Komitmen pimpinan (bukti keterlibatan top management). 6.1 Risk-based thinking (register risiko mutu). 7.1 Sumber daya (personil kompeten, peralatan kalibrasi). 7.2 Kompetensi (bukti pelatihan, sertifikasi). 7.5 Informasi terdokumentasi (prosedur, rekaman). 8.1 Perencanaan operasional (RMPK, ITP). 8.4 Pengendalian pihak eksternal (evaluasi subkontraktor). 8.7 Pengendalian output tidak sesuai (NCR log). 9.2 Audit internal (jadwal audit, laporan). 10.2 Ketidaksesuaian dan CAPA.`,
    description:"Checklist audit per klausal ISO 9001:2015 untuk proyek konstruksi",
    source_authority:"ISO-9001" },

  { agent_id:936, name:"Compliance Audit dan Corrective Action Request", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO9001,
    content:`Temuan audit major memerlukan CAR (Corrective Action Request) yang harus diselesaikan dalam 30 hari. Temuan audit minor: 60 hari. Audit eksternal badan sertifikasi: temuan major yang tidak diselesaikan dapat mengakibatkan penangguhan sertifikat ISO 9001. Jadwal audit internal harus mencakup semua proses minimal 1x dalam satu siklus sertifikasi. Auditor harus kompeten dan terlatih (ISO 19011). Rekaman audit (checklist, temuan, CAR, bukti close) harus disimpan minimal 3 tahun.`,
    description:"Compliance audit mutu: timeline CAR, konsekuensi, dan rekaman",
    source_authority:"ISO-9001" },

  // ══ ASBUILT #937 ═════════════════════════════════════════════════════════
  { agent_id:937, name:"Dokumentasi As-Built dan Serah Terima Proyek", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO9001,
    content:`As-built documentation adalah dokumentasi kondisi aktual yang dibangun, berbeda dari gambar kontrak. As-built wajib dibuat untuk semua gambar yang mengalami perubahan dari desain awal. Komponen as-built: Gambar as-built (seluruh disiplin: sipil, arsitektur, struktur, MEP), As-built material register (merek/tipe/spesifikasi yang terpasang), Test & Commissioning report (MEP, waterproofing, struktur), O&M Manual (dari manufaktur), Warranty documents (jaminan produk dan pekerjaan), Sertifikat Laik Fungsi (SLF). PHO (Provisional Hand Over) = Serah Terima Pertama; FHO (Final Hand Over) = Serah Terima Akhir setelah masa pemeliharaan.`,
    description:"Komponen as-built documentation dan proses serah terima PHO/FHO",
    source_authority:"PUPR" },

  { agent_id:937, name:"Manajemen Punch List dan Readiness Pre-BAST", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO9001,
    content:`Punch list adalah daftar pekerjaan yang belum selesai atau tidak sesuai yang ditemukan dalam inspeksi pre-BAST. Format punch list: No | Lokasi | Deskripsi Item | Responsible | Priority | Due Date | Status. Prioritas: High (masalah keselamatan/fungsi utama) — harus selesai sebelum PHO; Medium (cacat minor, finishing tidak sempurna) — harus selesai sebelum FHO; Low (perbaikan kosmetik) — dapat diselesaikan setelah FHO dengan jaminan. Proses: joint inspection oleh kontraktor, MK, dan owner → terbitkan punch list → kontraktor perbaiki → re-inspection → close item → serah terima. Best practice: punch list tidak boleh lebih dari 100 item saat PHO.`,
    description:"Manajemen punch list dan kesiapan serah terima proyek",
    source_authority:"PUPR" },

  { agent_id:937, name:"Compliance As-Built dan BAST Proyek PUPR", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO9001,
    content:`BAST (Berita Acara Serah Terima) tidak dapat diterbitkan sampai: semua High-priority punch list terselesaikan, as-built diserahkan, SLF diterbitkan (untuk bangunan gedung), dan pembayaran kewajiban kontraktor (BPJS, dll.) terpenuhi. Masa pemeliharaan setelah PHO: biasanya 180 hari (6 bulan) untuk PUPR; kontraktor wajib memperbaiki cacat yang timbul. Retensi pembayaran (5-10% nilai kontrak) baru dicairkan setelah FHO. As-built yang tidak diserahkan dapat mengakibatkan penundaan FHO dan pembayaran retensi. Gambar as-built dan O&M manual menjadi hak milik owner (pemerintah).`,
    description:"Compliance BAST dan kewajiban as-built untuk serah terima proyek PUPR",
    source_authority:"PUPR" },

  // ══ AGENT-ENVIRA #938 ════════════════════════════════════════════════════
  { agent_id:938, name:"Sistem Manajemen Lingkungan: PP 22/2021 dan ISO 14001", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO14001,
    content:`PP 22/2021 tentang Penyelenggaraan Perlindungan dan Pengelolaan Lingkungan Hidup merupakan implementasi UU Cipta Kerja dalam bidang lingkungan. Sistem Persetujuan Lingkungan: AMDAL (untuk proyek berisiko tinggi) → Persetujuan Lingkungan dari KLHK; UKL-UPL (berisiko menengah) → Rekomendasi dari Dinas LH; SPPL (berisiko rendah) → Surat Pernyataan cukup. ISO 14001:2015 adalah standar internasional Sistem Manajemen Lingkungan (EMS): siklus PDCA, identifikasi aspek dan dampak lingkungan, tujuan lingkungan dan program. Konstruksi hijau: Permen PUPR 2/2015 Bangunan Gedung Hijau; SNI 8854:2020 Bangunan Gedung Hijau.`,
    description:"Framework hukum dan standar manajemen lingkungan konstruksi Indonesia",
    source_authority:"KLHK", source_url:"https://www.menlhk.go.id" },

  { agent_id:938, name:"Routing Lingkungan Multi-Agent: AMDAL, Monitoring, Limbah, Green, Permit", type:"tactical", knowledge_layer:"tactical",
    taxonomy_id: TAX.ISO14001,
    content:`Routing AGENT-ENVIRA: (1) 'AMDAL/UKL-UPL/SPPL/dampak lingkungan/persetujuan lingkungan/KA-ANDAL/RKL-RPL' → AGENT-AMDAL #939. (2) 'pemantauan/monitoring air/udara/kebisingan/tanah/baku mutu/RPL/laporan lingkungan' → AGENT-ENVMON #940. (3) 'limbah/B3/sampah/sisa material/oli bekas/manifest/TPS' → AGENT-WASTE #941. (4) 'green building/greenship/EDGE/LEED/bangunan hijau/berkelanjutan/efisiensi energi' → AGENT-GREEN #942. (5) 'izin lingkungan/OSS/perizinan KLHK/izin pembuangan/TPS B3' → AGENT-ENVPERMIT #943.`,
    description:"Tactical routing lingkungan multi-agent untuk ENVIRA orchestrator",
    source_authority:"GUSTAFTA" },

  { agent_id:938, name:"Operasi Manajemen Lingkungan di Proyek Konstruksi", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO14001,
    content:`Pengelolaan lingkungan aktif di proyek konstruksi: Erosi dan sedimentasi: pasang silt fence, sediment trap, vegetasi sementara di area terganggu. Debu: penyiraman jalan tanah 2x/hari, penutup truk material, dust suppression di area kerja. Kebisingan: batasi jam kerja berisik 07:00-22:00 di area permukiman, barrier kebisingan jika diperlukan. Air limpasan: kolam sedimentasi, oil trap, tidak membuang langsung ke badan air. B3: penyimpanan terpisah, label lengkap, MSDS tersedia, TPS berizin. Pohon pelindung: tidak boleh ditebang tanpa izin; jika wajib tebang, kompensasi sesuai Peraturan Daerah.`,
    description:"Operasi pengelolaan lingkungan aktif selama konstruksi berlangsung",
    source_authority:"KLHK" },

  { agent_id:938, name:"Compliance Lingkungan: Sanksi dan Kewajiban Pelaporan", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO14001,
    content:`Melaksanakan kegiatan tanpa persetujuan lingkungan (AMDAL/UKL-UPL): pidana penjara 1-3 tahun dan/atau denda Rp 1-3 miliar (UU 32/2009 Pasal 109). Tidak melaksanakan RKL-RPL: sanksi administratif berupa paksaan pemerintah, pembekuan izin, atau pencabutan izin (PP 22/2021). Pembuangan limbah B3 sembarangan: pidana 1-3 tahun dan/atau denda Rp 1-3 miliar (UU 32/2009 Pasal 103). Laporan pelaksanaan RKL-RPL wajib diserahkan 2x per tahun ke KLHK/Dinas LH. Pemrakarsa wajib menginformasikan rencana kegiatan kepada masyarakat sebelum proses AMDAL dimulai.`,
    description:"Sanksi pelanggaran hukum lingkungan dan kewajiban pelaporan RKL-RPL",
    source_authority:"KLHK" },

  // ══ AMDAL #939 ═══════════════════════════════════════════════════════════
  { agent_id:939, name:"AMDAL: Proses dan Dokumen Persetujuan Lingkungan", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO14001,
    content:`AMDAL (Analisis Mengenai Dampak Lingkungan Hidup) diperlukan untuk rencana usaha/kegiatan yang diperkirakan berdampak penting pada lingkungan. Daftar kegiatan wajib AMDAL ditetapkan dalam Permen LHK 4/2021. Dokumen AMDAL: (1) KA-ANDAL: kerangka acuan analisis dampak, disetujui oleh KLHK/Dinas LH; (2) ANDAL: analisis dampak penting; (3) RKL-RPL: rencana pengelolaan dan pemantauan. Proses: pengumuman rencana → konsultasi publik → penyusunan KA → persetujuan KA → penyusunan ANDAL/RKL-RPL → sidang Komisi AMDAL → penerbitan Persetujuan Lingkungan (terintegrasi dalam OSS). PP 22/2021 mengintegrasikan persetujuan lingkungan dalam NIB melalui OSS-RBA.`,
    description:"Proses dan dokumen AMDAL dalam sistem OSS-RBA PP 22/2021",
    source_authority:"KLHK", source_url:"https://www.menlhk.go.id" },

  { agent_id:939, name:"Screening AMDAL vs UKL-UPL vs SPPL", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO14001,
    content:`Penentuan jenis persetujuan lingkungan berdasarkan PerLHK 4/2021: Wajib AMDAL (contoh): jalan baru > 5 km di kawasan sensitif; gedung > 5 ha atau > 100.000 m²; kawasan industri > 50 ha; pelabuhan, bandara, PLTU > 100 MW; tambang dengan luas bukaan > 200 ha. Wajib UKL-UPL: kegiatan yang tidak wajib AMDAL tapi memiliki dampak terhadap lingkungan. Cukup SPPL: kegiatan mikro/kecil dengan dampak sangat rendah (lihat Permen LHK 3/2021 UKL-UPL Formulir Standar). Pertimbangan lokasi: kawasan lindung (taman nasional, hutan lindung, sempadan sungai) meningkatkan potensi wajib AMDAL.`,
    description:"Matriks screening kewajiban AMDAL/UKL-UPL/SPPL berdasarkan PerLHK 4/2021",
    source_authority:"KLHK" },

  { agent_id:939, name:"Compliance AMDAL: Kewajiban Pemrakarsa", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO14001,
    content:`Kewajiban pemrakarsa setelah mendapat Persetujuan Lingkungan: melaksanakan RKL-RPL sesuai dokumen yang disetujui; melaporkan pelaksanaan RKL-RPL 2x per tahun; memberikan informasi kepada masyarakat yang terdampak; menyediakan anggaran untuk pengelolaan lingkungan. Jika terjadi perubahan usaha/kegiatan yang signifikan: ajukan perubahan Persetujuan Lingkungan (addendum ANDAL atau peninjauan kembali). AMDAL yang disusun tidak sesuai prosedur atau berisi informasi palsu dapat dibatalkan. Konsultan AMDAL harus memiliki registrasi dari KLHK.`,
    description:"Kewajiban pemrakarsa setelah mendapat Persetujuan Lingkungan AMDAL",
    source_authority:"KLHK" },

  // ══ ENVMON #940 ══════════════════════════════════════════════════════════
  { agent_id:940, name:"Program Pemantauan Lingkungan Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO14001,
    content:`Pemantauan lingkungan wajib dilaksanakan sesuai RKL-RPL yang disetujui. Parameter pemantauan utama konstruksi: Air: TSS, BOD5, COD, pH, TDS, minyak lemak (baku mutu PP 22/2021 Lampiran IX). Udara ambient: PM10, PM2.5, SO2, NO2, CO, HC (baku mutu PP 41/1999). Kebisingan: LAeq dB(A) (baku mutu Permen LHK 48/1996: perumahan 55 dB(A) siang/45 malam). Getaran: mm/detik (Permen PU 2/2008). Tanah: pH, logam berat jika ada aktivitas yang berpotensi mencemari. Pengujian harus dilakukan oleh laboratorium terakreditasi KAN (Komite Akreditasi Nasional).`,
    description:"Parameter dan standar pemantauan lingkungan konstruksi sesuai RPL",
    source_authority:"KLHK" },

  { agent_id:940, name:"Laporan RPL dan Interpretasi Hasil Uji", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO14001,
    content:`Laporan RPL (Rencana Pemantauan Lingkungan) periode: semester I (Januari-Juni, lapor Juli) dan semester II (Juli-Desember, lapor Januari). Format laporan RPL: identitas kegiatan, status persetujuan lingkungan, metode pemantauan, lokasi dan titik sampling, hasil uji laboratorium, perbandingan dengan baku mutu, analisis tren, evaluasi efektivitas RKL, dan rencana tindak lanjut. Jika hasil pemantauan melebihi baku mutu: segera laporkan ke Dinas LH, tingkatkan pengelolaan (RKL), investigasi sumber, dan laporkan tindakan perbaikan. Lab KAN akreditasi: LIPI, Laboratorium Lingkungan Dinas LH Provinsi, atau lab swasta terakreditasi.`,
    description:"Format laporan RPL, frekuensi pelaporan, dan tindak lanjut pelampauan baku mutu",
    source_authority:"KLHK" },

  { agent_id:940, name:"Compliance Pelaporan RPL dan Konsekuensi Pelanggaran", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO14001,
    content:`Pelaporan RPL wajib 2x per tahun ke: Dinas Lingkungan Hidup Kabupaten/Kota, Dinas LH Provinsi (jika izin dari provinsi), dan KLHK (jika AMDAL disetujui KLHK). Keterlambatan pelaporan: sanksi administratif dari Dinas LH. Tidak melaporkan: sanksi hingga pembekuan izin lingkungan. Pelanggaran baku mutu air: jika berulang tanpa tindakan, dapat dikenakan sanksi paksaan pemerintah. Data pemantauan harus asli dan tidak dimanipulasi; manipulasi data lingkungan dapat dikenakan sanksi pidana. Simpan rekaman pemantauan minimum 5 tahun.`,
    description:"Compliance pelaporan RPL: frekuensi, tujuan pelaporan, dan sanksi keterlambatan",
    source_authority:"KLHK" },

  // ══ WASTE #941 ═══════════════════════════════════════════════════════════
  { agent_id:941, name:"Manajemen Limbah Konstruksi: Klasifikasi dan Pengelolaan", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO14001,
    content:`Limbah konstruksi dibagi menjadi: (1) Limbah Non-B3: sisa beton, mortar, batu bata, kayu, logam, plastik, kardus, tanah galian. Prinsip 3R: Reduce (minimasi limbah sejak desain), Reuse (gunakan kembali material sisa), Recycle (daur ulang ke vendor). (2) Limbah B3 (PP 101/2014 jo PP 22/2021): Oli bekas mesin (B337-1), cat bekas (B321-1), thinner/solvent (B321-4), aki bekas (B105d), lampu TL/neon (B108d), MSDS cat aerosol, sisa epoxy dan resin. Limbah B3 harus: disimpan di TPS B3 berizin, tidak boleh dicampur dengan limbah non-B3, diangkut oleh transporter berizin KLHK, diserahkan ke pengolah/pemusnah berizin KLHK, dilengkapi manifest limbah B3.`,
    description:"Klasifikasi limbah konstruksi (B3 dan non-B3) dan prinsip pengelolaan",
    source_authority:"KLHK" },

  { agent_id:941, name:"Manifest Limbah B3 dan Pengelolaan TPS", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO14001,
    content:`Manifest Limbah B3 (Permen LHK 6/2021): dokumen yang menyertai pengiriman limbah B3 dari penghasil → transporter → pengolah/pemusnah. Manifest multi-rangkap: lembar 1 untuk arsip penghasil, lembar 2-7 untuk berbagai pihak. Penghasil wajib: mengisi manifest dengan benar, menyimpan salinan, melaporkan neraca limbah B3 per 6 bulan. TPS (Tempat Penyimpanan Sementara) Limbah B3: atap, lantai kedap, ventilasi, tanda B3, akses terkontrol, berjarak dari badan air dan fasilitas umum. Penyimpanan maksimum 90 hari sebelum harus diserahkan ke pengolah. Kemasan limbah B3: tertutup rapat, berlabel (nama limbah, jumlah, tanggal, hazard symbol).`,
    description:"Manifest limbah B3 dan persyaratan TPS sesuai Permen LHK 6/2021",
    source_authority:"KLHK" },

  { agent_id:941, name:"Compliance Pengelolaan Limbah B3: Larangan dan Sanksi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO14001,
    content:`Larangan pengelolaan limbah B3: tidak boleh membuang ke lingkungan (tanah, air, udara) tanpa izin; tidak boleh menggunakan transporter yang tidak memiliki izin KLHK; tidak boleh mencampur dengan limbah non-B3 atau limbah B3 berbeda jenis jika dapat menimbulkan reaksi berbahaya. Sanksi pembuangan limbah B3 sembarangan: pidana 1-3 tahun dan denda Rp 1-3 miliar (UU 32/2009 Pasal 103). Sanksi tidak memiliki izin TPS B3: administratif hingga pencabutan izin operasi. Pemrakarsa dapat dimintakan pemulihan kerusakan lingkungan atas biaya sendiri. Daftar transporter B3 berizin dapat dicek di website KLHK.`,
    description:"Larangan dan sanksi pidana/administratif pengelolaan limbah B3 sembarangan",
    source_authority:"KLHK" },

  // ══ GREEN #942 ═══════════════════════════════════════════════════════════
  { agent_id:942, name:"Green Building Rating Systems: Greenship, EDGE, LEED", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO14001,
    content:`3 sistem rating green building utama yang relevan di Indonesia: (1) Greenship (GBC Indonesia): 6 kategori — Tepat Guna Lahan/ASD, Efisiensi Energi & Konservasi/EEC, Konservasi Air/WAC, Sumber & Siklus Material/MRC, Kualitas Udara & Kenyamanan/IHC, Manajemen Lingkungan Bangunan/BEM. Rating: Certified (50-57.5 poin), Silver (57.5-65), Gold (65-75), Platinum (>75). (2) EDGE (IFC/World Bank): target 20% lebih efisien dari baseline untuk energi, air, dan material yang dibutuhkan. Proses sederhana via software EDGE App. (3) LEED v4 (USGBC): 9 kategori, Certified-Silver-Gold-Platinum. Permen PUPR 2/2015 tentang Bangunan Gedung Hijau; SNI 8854:2020.`,
    description:"3 sistem rating green building: Greenship, EDGE, LEED dan regulasi PUPR",
    source_authority:"GBC-Indonesia" },

  { agent_id:942, name:"Strategi Mendapatkan Kredit Greenship GBC Indonesia", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO14001,
    content:`Strategi kredit Greenship untuk gedung baru: ASD (Tepat Guna Lahan): dekat transportasi umum (+3), ruang terbuka hijau (+3), heat island reduction (+2), area parkir terkelola (+2). EEC (Energi): OTTV ≤ 35 W/m² (+2), sistem AC efisien (COP>2.7, +4), pencahayaan efisien (E>60 lm/W, +5), energy metering (+3). WAC (Air): sub-meter air (+2), rain water harvesting (+3), efisiensi irigasi (+2). MRC (Material): material lokal >50% dari berat (+5), sertifikat ramah lingkungan (+3), manajemen sampah konstruksi (+3). IHC (Kenyamanan): CO2 monitoring (+2), ventilasi luar 15% di atas ASHRAE 62.1 (+1), low VOC material (+3). BEM: GBCAS certified assessor (+2).`,
    description:"Strategi kredit Greenship per kategori untuk gedung baru",
    source_authority:"GBC-Indonesia" },

  { agent_id:942, name:"Compliance Green Building: Regulasi PUPR dan Persyaratan Sertifikasi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO14001,
    content:`Permen PUPR 2/2015 Bangunan Gedung Hijau mewajibkan penerapan efisiensi energi dan air untuk: gedung pemerintah baru luas > 50.000 m²; gedung komersial baru luas > 50.000 m². Sertifikasi Green Building: tidak wajib hukum tapi memberikan insentif: kemudahan IMB, keringanan PBB di beberapa daerah, nilai jual properti lebih tinggi. Klaim green building tanpa sertifikasi resmi dapat dikategorikan greenwashing. Sertifikasi Greenship: diajukan ke GBC Indonesia, ada biaya sertifikasi dan verifikasi. EDGE: biaya lebih rendah, prosesnya via Verifier terakreditasi IFC. Pemerintah DKI Jakarta mensyaratkan green building untuk gedung baru > 5.000 m² (Pergub DKI 38/2012).`,
    description:"Regulasi PUPR green building dan persyaratan sertifikasi resmi",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  // ══ ENVPERMIT #943 ═══════════════════════════════════════════════════════
  { agent_id:943, name:"Sistem Perizinan Lingkungan OSS-RBA PP 5/2021", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.ISO14001,
    content:`PP 5/2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko (OSS-RBA) mengintegrasikan persetujuan lingkungan dalam sistem OSS. Tingkat risiko kegiatan konstruksi: Rendah (SPPL), Menengah Rendah (UKL-UPL Formulir), Menengah Tinggi (UKL-UPL + Rekomendasi Dinas LH), Tinggi (AMDAL + Persetujuan KLHK). Persetujuan Lingkungan menjadi prasyarat terbitnya NIB (Nomor Induk Berusaha) untuk kegiatan berisiko menengah tinggi dan tinggi. Izin lingkungan lain yang terpisah: Izin Pembuangan Air Limbah, Izin TPS Limbah B3, SLO Instalasi Listrik.`,
    description:"Sistem perizinan lingkungan berbasis risiko OSS-RBA dan integrasi dengan NIB",
    source_authority:"KLHK", source_url:"https://oss.go.id" },

  { agent_id:943, name:"Proses Pengajuan Izin Lingkungan via OSS", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.ISO14001,
    content:`Langkah pengajuan persetujuan lingkungan via OSS-RBA: (1) Login ke oss.go.id dengan akun pelaku usaha; (2) Tambahkan kegiatan baru dengan KBLI yang sesuai; (3) Sistem secara otomatis menentukan tingkat risiko; (4) Untuk risiko menengah-tinggi: sistem mengarahkan ke penyusunan UKL-UPL/AMDAL; (5) Upload dokumen UKL-UPL/AMDAL yang telah disusun; (6) KLHK/Dinas LH melakukan verifikasi (umumnya 10-25 hari kerja); (7) Jika disetujui, Persetujuan Lingkungan terbit dan terintegrasi dalam NIB. Izin TPS Limbah B3: diajukan ke KLHK melalui sistem SIMPEL (Sistem Informasi Perizinan Limbah B3); untuk kapasitas dan jenis limbah tertentu melalui Dinas LH Provinsi.`,
    description:"Langkah pengajuan persetujuan lingkungan via OSS-RBA dan SIMPEL",
    source_authority:"KLHK" },

  { agent_id:943, name:"Compliance Perizinan dan Sanksi Tanpa Izin Lingkungan", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.ISO14001,
    content:`Melaksanakan kegiatan yang wajib AMDAL/UKL-UPL tanpa persetujuan lingkungan: pidana 1-3 tahun dan denda Rp 1-3 miliar. Tidak memiliki izin TPS limbah B3: sanksi administratif (teguran, pembekuan) hingga pidana. Izin lingkungan dapat dicabut jika: kondisi lingkungan di sekitar berubah signifikan, dokumen AMDAL terbukti tidak benar, kegiatan menyimpang dari yang disetujui. Persetujuan lingkungan tidak dapat dipindahtangankan tanpa persetujuan instansi penerbit. Kewajiban perlindungan lingkungan melekat pada siapapun pemegang izin (termasuk jika berganti kepemilikan).`,
    description:"Sanksi melaksanakan kegiatan tanpa izin lingkungan dan kewajiban pemegang izin",
    source_authority:"KLHK" },

  // ══ AGENT-EQUIPRA #944 ═══════════════════════════════════════════════════
  { agent_id:944, name:"Manajemen Peralatan Konstruksi: Regulasi dan Framework", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Manajemen peralatan konstruksi diatur dalam Permen PU 11/2013 tentang Sertifikasi Alat Berat. Permenaker 5/2018 tentang K3 Pesawat Angkat Angkut mengatur keselamatan crane, hoist, forklift, dan alat angkat angkut lainnya. SIA (Surat Izin Alat) wajib untuk alat angkat angkut (crane, forklift, hoist); diterbitkan Disnaker. SIO (Surat Izin Operator) wajib untuk operator alat angkat angkut; 3 golongan berdasarkan kapasitas. Framework manajemen peralatan: Perencanaan (pemilihan, mobilisasi) → Operasi (utilisasi, produktivitas) → Pemeliharaan (PM, CM) → Administrasi (biaya, sertifikasi, dokumentasi) → Demobilisasi.`,
    description:"Framework manajemen peralatan konstruksi dan regulasi SIA/SIO",
    source_authority:"Kemnaker", source_url:"https://jdih.kemnaker.go.id" },

  { agent_id:944, name:"Routing Peralatan Multi-Agent: Maintenance, OEE, Mobilisasi, Biaya, Sertifikasi", type:"tactical", knowledge_layer:"tactical",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Routing AGENT-EQUIPRA: (1) 'maintenance/perawatan/PM/service/HM/jam operasi/breakdown/kerusakan alat' → AGENT-MAINT #945. (2) 'OEE/produktivitas/availability/performance/six big losses/utilization/downtime' → AGENT-OEE #946. (3) 'mobilisasi/kirim alat/transport/rute/erection crane/demobilisasi' → AGENT-MOBILIZE #947. (4) 'biaya alat/sewa/beli/AHSP/ownership cost/tarif/analisis alat' → AGENT-EQCOST #948. (5) 'SIA/SIO/sertifikat/uji berkala/kelaikan/inspeksi Kemnaker/K2/SLO' → AGENT-CERTIFY #949.`,
    description:"Tactical routing peralatan multi-agent untuk EQUIPRA orchestrator",
    source_authority:"GUSTAFTA" },

  { agent_id:944, name:"Operasi Alat Berat: Utilisasi, Produktivitas, dan Best Practice", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Target utilisasi alat berat: excavator 75-85%, dump truck 70-80%, tower crane 85-90% (scheduled hours). Produktivitas excavator standar: PC200 = 100-120 BCM/jam; PC300 = 150-200 BCM/jam; PC400 = 200-280 BCM/jam (tergantung kondisi tanah dan jarak swing). Produktivitas dump truck: bergantung cycle time (waktu muat + jarak angkut + waktu buang + kembali). Fleet matching: rasio dump truck terhadap excavator menggunakan formula N = Cycle Time Truck / Cycle Time Muat. Daily Equipment Log: catat HM awal/akhir, bahan bakar, breakdown, kondisi, pekerjaan yang diselesaikan. Equipment Meeting mingguan: review utilisasi, downtime, issue, plan minggu depan.`,
    description:"Target utilisasi, produktivitas standar, dan operasi sehari-hari alat berat",
    source_authority:"PUPR" },

  { agent_id:944, name:"Compliance Alat Berat: SIA, SIO, dan K3 Peralatan", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Kewajiban hukum: SIA wajib untuk crane, hoist, gondola, forklift; tanpa SIA: sanksi administratif dan pidana. SIO wajib untuk operator crane, forklift, dan alat angkat angkut lainnya. Alat tanpa SIA valid dilarang beroperasi; jika beroperasi: pemilik dan operator dapat dikenakan sanksi. Inspeksi berkala: crane setiap 2 tahun untuk SIA; wire rope setiap 6 bulan. Investigasi kecelakaan alat berat: wajib dilaporkan ke Disnaker. Tanggung jawab kecelakaan: pemilik alat (Jaminan Kecelakaan Kerja BPJS) dan kontraktor (berdasarkan kontrak). Operator harus melapor ke mandor jika alat dalam kondisi tidak aman.`,
    description:"Kewajiban hukum SIA/SIO dan tanggung jawab K3 alat berat",
    source_authority:"Kemnaker" },

  // ══ MAINT #945 ═══════════════════════════════════════════════════════════
  { agent_id:945, name:"Standar Preventive Maintenance Alat Berat Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Preventive Maintenance (PM) adalah pemeliharaan terjadwal berdasarkan jam operasi (HM — Hour Meter) atau waktu kalender. Interval PM standar Komatsu/CAT/Hitachi: PM1 = setiap 250 HM (ganti oli mesin, filter oli, filter bahan bakar, cek level fluida). PM2 = setiap 500 HM (semua PM1 + ganti filter udara luar/dalam, cek fan belt, cek battery). PM3 = setiap 1000 HM (semua PM2 + ganti oli final drive, oli swing, cek undercarriage). PM4 = setiap 2000 HM (semua PM3 + ganti oli transmisi, filter hydraulic, cek/ganti filter hydraulic). Overhaul: ±10.000-15.000 HM (rebuild engine dan komponen major). Tower Crane: PM mingguan (cek wire rope, pelumas, brake), PM bulanan (periksa semua sistem mekanik/elektrik).`,
    description:"Interval PM standar alat berat konstruksi berdasarkan jam operasi",
    source_authority:"Komatsu-CAT" },

  { agent_id:945, name:"Program PM dan Fleet Maintenance Management", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Implementasi program PM: (1) Buat jadwal PM untuk semua unit berdasarkan HM saat ini dan interval PM. (2) Tentukan spare parts yang dibutuhkan per PM service; pastikan tersedia di gudang. (3) Assign mekanik yang kompeten per unit. (4) Dokumentasikan setiap PM: HM, tanggal, kegiatan, parts yang diganti, mekanik, kondisi lain yang ditemukan. (5) Update jadwal setelah PM selesai. Tools Fleet Management: spreadsheet tracking, atau CMMS (Computerized Maintenance Management System) seperti eMaint, Hippo, atau SAP PM. KPI maintenance: MTBF (Mean Time Between Failures), MTTR (Mean Time To Repair), Schedule Maintenance Compliance (SMC), PM vs CM ratio (target PM > 70%).`,
    description:"Implementasi program PM dan KPI manajemen armada alat berat",
    source_authority:"PUPR" },

  { agent_id:945, name:"Compliance PM dan Konsekuensi Kelalaian Pemeliharaan", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Pemeliharaan alat berat merupakan tanggung jawab pemilik/penyewa. Kelalaian PM yang menyebabkan kecelakaan kerja dapat meningkatkan tanggung jawab hukum pemilik alat. Garansi manufaktur biasanya mensyaratkan PM dilaksanakan sesuai interval buku service; kelalaian PM dapat menggugurkan garansi. Rekaman PM harus disimpan selama masa kepemilikan alat (berguna untuk jual-beli alat bekas). Alat yang melewati interval PM secara signifikan: tingkat kerusakan meningkat 3-5x, biaya perbaikan meningkat 5-8x dibanding biaya PM yang tepat waktu.`,
    description:"Kewajiban PM dan konsekuensi hukum dan ekonomis kelalaian pemeliharaan",
    source_authority:"Kemnaker" },

  // ══ OEE #946 ═════════════════════════════════════════════════════════════
  { agent_id:946, name:"OEE Formula dan Benchmark Alat Berat Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`OEE (Overall Equipment Effectiveness) = Availability × Performance × Quality. Availability = (Planned Production Time - Equipment Downtime) / Planned Production Time × 100%. Performance = (Actual Output / Theoretical Maximum Output) × 100%. Quality = (Good Output / Total Output) × 100%. Benchmark industri: World Class ≥ 85%; Typical manufacturing 60%; Konstruksi biasanya lebih rendah karena kondisi kerja berat (target 65-75%). Planned Production Time = Jam Kerja Total - Planned Downtime (PM terjadwal, shift break). Equipment Downtime = Unplanned Downtime (breakdown, menunggu parts, menunggu operator). Six Big Losses: Breakdown, Setup/Adjustment, Minor Stoppages, Reduced Speed, Process Defects, Reduced Yield.`,
    description:"Formula OEE, benchmark, dan Six Big Losses untuk alat berat konstruksi",
    source_authority:"TPM-Institute" },

  { agent_id:946, name:"Analisis OEE dan Strategi Peningkatan", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Cara meningkatkan OEE: (1) Tingkatkan Availability: laksanakan PM tepat waktu (kurangi breakdown), siapkan spare parts critical (kurangi repair time), operator training (kurangi misuse). (2) Tingkatkan Performance: optimasi match factor antara alat dan dump truck, kurangi idle time (menunggu material/instruksi), pastikan operator terlatih. (3) Tingkatkan Quality: pastikan material yang diangkut/dikerjakan tidak perlu re-work, kalibrasi bucket dan attachment. Data untuk analisis OEE: Equipment Log harian (HM awal/akhir, waktu breakdown, penyebab, output). Software sederhana: spreadsheet OEE tracker. TPM (Total Productive Maintenance): filosofi melibatkan operator dalam pemeliharaan dasar alat (Autonomous Maintenance).`,
    description:"Strategi peningkatan OEE alat berat dan implementasi TPM",
    source_authority:"TPM-Institute" },

  { agent_id:946, name:"Compliance OEE dan Pelaporan Produktivitas Alat", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Laporan produktivitas alat berat biasanya dipersyaratkan dalam kontrak PUPR: laporan equipment log mingguan/bulanan; utilisasi alat vs target; downtime dan penyebabnya. Owner berhak memeriksa catatan pemeliharaan dan utilisasi alat. Alat yang utilisasinya rendah dapat dipertanyakan oleh owner (apakah alat sesuai spesifikasi penawaran?). Equipment yang tidak mencapai produktivitas minimum kontrak dapat dikenakan penggantian unit. OEE rendah yang berkaitan dengan kondisi tidak aman (alat rusak tapi tetap dioperasikan) merupakan pelanggaran K3.`,
    description:"Kewajiban pelaporan produktivitas alat dan compliance dalam kontrak PUPR",
    source_authority:"PUPR" },

  // ══ MOBILIZE #947 ════════════════════════════════════════════════════════
  { agent_id:947, name:"Perencanaan Mobilisasi Alat Berat Konstruksi", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Mobilisasi alat berat adalah proses pengiriman alat dari gudang/lokasi lama ke site konstruksi. Komponen perencanaan: (1) Inventarisasi alat: jenis, dimensi, berat operasi dan pengiriman; (2) Survei rute: tinggi clearance jembatan, lebar jalan, kapasitas beban jembatan, tikungan tajam; (3) Pilih trailer yang sesuai: low-bed (untuk excavator, dozer), self-propelled (untuk crane), flatbed (untuk peralatan ringan); (4) Perizinan: untuk alat/muatan oversized memerlukan izin dari BPTD (Balai Pengelola Transportasi Darat) dan rekomendasi Binamarga untuk jalan nasional; (5) Waktu perjalanan: alat oversized umumnya hanya boleh bergerak malam hari (22:00-06:00) di kota besar. Tower crane erection memerlukan analisis geoteknik pondasi dan pengajuan SIA baru.`,
    description:"Komponen perencanaan mobilisasi alat berat: survei rute, trailer, dan perizinan",
    source_authority:"Kemenhub" },

  { agent_id:947, name:"Prosedur Erection Tower Crane dan Commissioning", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Prosedur erection tower crane: (1) Analisis geoteknik untuk pondasi TC (bearing capacity, settlement); (2) Desain pondasi TC oleh structural engineer (biasanya foundation slab + angkur); (3) Erection sequence: assemble mast base → naikan counter jib → pasang jib → naikan kait hook → komisioning load test; (4) Load test setelah erection: 100% kapasitas (initial), kemudian SIA diajukan ke Disnaker; (5) Exclusion zone saat erection dan operasi. Commissioning alat berat: uji fungsi semua sistem (engine, hydraulic, brake, safety device, limit switches); pastikan alat beroperasi sesuai spesifikasi sebelum produktif; dokumentasikan dengan laporan komisioning.`,
    description:"Prosedur erection tower crane dan commissioning alat berat",
    source_authority:"Kemnaker" },

  { agent_id:947, name:"Compliance Transportasi Alat Berat: Perizinan dan K3 Mobilisasi", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`UU 22/2009 LLAJ mengatur angkutan barang; alat berat dikategorikan sebagai angkutan barang khusus. Alat/muatan yang melebihi dimensi standar (lebar >2.5m, tinggi >4.2m, panjang >18m, berat >40 ton) wajib memiliki izin khusus dari BPTD. Trailer pengangkut wajib memiliki KIR yang valid. Sopir trailer besar harus memiliki SIM B2 atau B2 Umum. Pilot car wajib untuk muatan oversized. Kecelakaan saat mobilisasi: tanggung jawab kontraktual ada pada kontraktor; asuransi cargo alat berat direkomendasikan. Alat yang tiba di site harus diinspeksi kondisinya sebelum masuk menjadi tanggung jawab site management.`,
    description:"Compliance transportasi alat berat: perizinan BPTD dan tanggung jawab keselamatan",
    source_authority:"Kemenhub" },

  // ══ EQCOST #948 ══════════════════════════════════════════════════════════
  { agent_id:948, name:"Komponen Biaya Alat Berat: Ownership dan Operating Cost", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Biaya alat berat terdiri dari: (1) Ownership Cost (biaya kepemilikan per jam): Depresiasi = (Harga Beli - Nilai Sisa) / Umur Ekonomis / Jam Kerja per Tahun; Bunga modal = Harga Beli × Faktor Bunga / Jam Kerja; Asuransi = 1-2% harga beli / jam kerja; Pajak dan administrasi = 0.5-1% / jam. (2) Operating Cost (biaya operasional per jam): BBM = konsumsi liter/jam × harga BBM; Oli/pelumas = 0.5-1% biaya BBM; Perawatan & perbaikan = 50-100% biaya BBM; Operator = gaji/jam. Total biaya alat = Ownership + Operating. SE PUPR 18/2021 AHSP: referensi tarif alat berat pemerintah per HM atau per hari. Analisis rent vs own: OEE breakeven biasanya pada utilisasi >70% untuk 5+ tahun.`,
    description:"Komponen biaya alat berat: ownership dan operating cost sesuai AHSP PUPR",
    source_authority:"PUPR", source_url:"https://jdih.pu.go.id" },

  { agent_id:948, name:"Analisis Sewa vs Beli Alat Berat", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Kerangka keputusan Rent vs Buy vs Leasing: SEWA cocok jika: penggunaan < 50% kapasitas, proyek pendek (<6 bulan), alat spesialis jarang digunakan, modal terbatas, tidak ada kemampuan maintenance. BELI cocok jika: utilisasi > 70% secara konsisten, pipeline proyek jelas untuk 3-5 tahun, memiliki infrastruktur maintenance, kemampuan modal cukup, alat general-purpose yang selalu dibutuhkan. LEASING: middle ground, cicil kepemilikan, off-balance sheet. Break-Even Analysis: Break-Even Hours = (Harga Beli - Nilai Sisa) / (Tarif Sewa Per HM - Variable Operating Cost). Jika actual hours > break-even hours → lebih untung beli daripada sewa. Pertimbangkan juga: risiko kerusakan/downtime, beban administrasi, kebutuhan modal kerja.`,
    description:"Framework keputusan dan break-even analysis sewa vs beli alat berat",
    source_authority:"PUPR" },

  { agent_id:948, name:"Compliance Biaya Alat dalam RAB dan Audit BPKP", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PENGENDALIAN,
    content:`Biaya alat dalam RAB (Rencana Anggaran Biaya) proyek PUPR harus mengacu AHSP (Analisis Harga Satuan Pekerjaan) sesuai SE PUPR 18/2021. Penggunaan harga alat yang jauh di bawah AHSP tanpa justifikasi dapat menjadi temuan audit BPKP/Inspektorat (underpricing). Biaya sewa alat harus didukung dokumen kontrak sewa yang sah. Biaya ownership alat untuk proyek pemerintah harus dapat diaudit: harga beli, depresiasi, nilai buku. Mark-up biaya alat yang tidak wajar: risiko fraud/korupsi. Perubahan tarif alat selama masa pelaksanaan proyek: aturan eskalasi harga dalam kontrak harus diperhatikan.`,
    description:"Compliance biaya alat dalam RAB PUPR dan keperluan dokumentasi untuk audit",
    source_authority:"PUPR" },

  // ══ CERTIFY #949 ═════════════════════════════════════════════════════════
  { agent_id:949, name:"Sertifikasi Alat Berat: SIA dan SIO Kemnaker", type:"foundational", knowledge_layer:"foundational",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`SIA (Surat Izin Alat) adalah izin operasi alat pesawat angkat angkut dari Kemnaker/Disnaker. Alat yang wajib SIA: crane (mobil, tower, overhead, gantry), forklift, hoist, gondola, lift konstruksi (man/material hoist), excavator (dalam beberapa regulasi daerah). Proses SIA: permohonan ke Disnaker setempat → pemeriksaan fisik oleh PJK3 (Perusahaan Jasa K3) → uji kelaikan alat → penerbitan SIA. Berlaku: 2 tahun, diperpanjang melalui reinspeksi. SIO (Surat Izin Operator): Golongan I: kapasitas ≤ 5 ton atau jarak angkat ≤ 5m; Golongan II: 5-25 ton atau 5-30m; Golongan III: > 25 ton atau > 30m. SIO berlaku 5 tahun, dapat diperpanjang.`,
    description:"Persyaratan dan proses SIA/SIO Kemnaker untuk alat berat konstruksi",
    source_authority:"Kemnaker", source_url:"https://jdih.kemnaker.go.id" },

  { agent_id:949, name:"Inspeksi Berkala dan Pemeliharaan Sertifikasi Alat", type:"operational", knowledge_layer:"operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN,
    content:`Jadwal inspeksi berkala untuk sertifikasi: Crane: SIA 2 tahun + inspeksi wire rope setiap 6 bulan (discard jika >10% kawat putus per pitch, korosi, deformasi). Forklift: SIA 2 tahun, inspeksi harian (fork, mast, brake, lampu). Lift konstruksi (man hoist): SIA 6 bulan, inspeksi bulanan. Gondola: SIA 6 bulan. Instalasi listrik sementara: SLO (Sertifikat Laik Operasi) dari PT PLN atau lembaga inspeksi terakreditasi ESDM. Genset >25 kVA: Izin Instalasi dari ESDM. Documentation: buat Equipment Certification Register yang berisi: ID unit, jenis sertifikat, nomor sertifikat, tanggal terbit, tanggal expiry, PIC perpanjangan, status.`,
    description:"Jadwal inspeksi berkala dan sistem pelacakan sertifikasi alat berat",
    source_authority:"Kemnaker" },

  { agent_id:949, name:"Compliance SIA/SIO: Sanksi Operasi Tanpa Sertifikat", type:"compliance", knowledge_layer:"compliance",
    taxonomy_id: TAX.PELAKSANAAN,
    content:`Sanksi penggunaan alat tanpa SIA valid: penghentian operasi oleh Pengawas Ketenagakerjaan; denda administratif; jika menyebabkan kecelakaan: pidana pengusaha sesuai UU 1/1970. Operator tanpa SIO valid: pelanggaran Permenaker 5/2018; sanksi administratif dan pidana jika terjadi kecelakaan. Penggunaan alat yang SIA-nya expired: setara dengan tidak memiliki SIA. Pengecekan SIA oleh Pengawas Ketenagakerjaan dapat dilakukan kapan saja. PJK3 (Perusahaan Jasa K3) yang melakukan pemeriksaan alat harus memiliki SK dari Kemnaker. Sertifikat SIA/SIO tidak dapat dipindahtangankan antar unit alat atau antar operator.`,
    description:"Sanksi operasi alat tanpa SIA/SIO dan kewenangan Pengawas Ketenagakerjaan",
    source_authority:"Kemnaker" },
];

async function main() {
  const client = await pool.connect();
  try {
    // Check which agents already have KB
    const { rows: existing } = await client.query(`
      SELECT DISTINCT agent_id FROM knowledge_bases WHERE agent_id BETWEEN 920 AND 949
    `);
    const hasKB = new Set(existing.map((r: any) => r.agent_id));
    const toProcess = KB.filter(e => !hasKB.has(e.agent_id));
    console.log(`\n📚 Seeding KB untuk ${toProcess.length} entries (${new Set(toProcess.map(e=>e.agent_id)).size} agen)...\n`);

    // First pass: insert KB entries and collect IDs
    const kbInserted: { id: number; agent_id: number; name: string; content: string }[] = [];

    for (const e of toProcess) {
      const { rows } = await client.query(`
        INSERT INTO knowledge_bases (
          agent_id, name, type, knowledge_layer, content, description,
          taxonomy_id, source_authority, source_url, status, is_shared
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',false)
        RETURNING id
      `, [
        e.agent_id, e.name, e.type, e.knowledge_layer, e.content, e.description,
        e.taxonomy_id, e.source_authority, e.source_url || null,
      ]);
      kbInserted.push({ id: rows[0].id, agent_id: e.agent_id, name: e.name, content: e.content });
    }

    // Enable RAG on all new agents
    await client.query(`
      UPDATE agents SET rag_enabled=true, rag_chunk_size=512, rag_chunk_overlap=64, rag_top_k=5
      WHERE id BETWEEN 920 AND 949
    `);

    // Second pass: create chunks from KB content
    const chunkInserts: any[] = [];
    for (const kb of kbInserted) {
      const chunks = chunkText(kb.content);
      chunks.forEach((chunk, idx) => {
        chunkInserts.push({
          kb_id: kb.id, agent_id: kb.agent_id, chunk_index: idx,
          content: chunk, token_count: est(chunk), source_name: kb.name,
        });
      });
    }

    if (chunkInserts.length > 0) {
      const vals: any[] = [];
      const phs: string[] = [];
      let p = 1;
      for (const c of chunkInserts) {
        phs.push(`($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},NOW())`);
        vals.push(c.kb_id, c.agent_id, c.chunk_index, c.content, c.token_count,
          JSON.stringify({ sourceName: c.source_name }));
      }
      await client.query(`
        INSERT INTO knowledge_chunks (knowledge_base_id,agent_id,chunk_index,content,token_count,metadata,created_at)
        VALUES ${phs.join(",")}
      `, vals);
    }

    // Final stats
    const { rows: kbTotal } = await client.query('SELECT COUNT(*) as total FROM knowledge_bases');
    const { rows: kcTotal } = await client.query('SELECT COUNT(*) as total FROM knowledge_chunks');
    const { rows: agentKB } = await client.query(`
      SELECT COUNT(DISTINCT agent_id) as n FROM knowledge_bases WHERE agent_id BETWEEN 920 AND 949
    `);

    console.log("═══════════════════════════════════════════════════");
    console.log("✅ SELESAI — KB & Chunks untuk Batch 3 (#920-949)");
    console.log("═══════════════════════════════════════════════════");
    console.log(`KB entries ditambahkan  : ${kbInserted.length}`);
    console.log(`Chunks dibuat           : ${chunkInserts.length}`);
    console.log(`Agen Batch 3 punya KB   : ${agentKB[0].n}/30`);
    console.log(`Total KB platform       : ${kbTotal[0].total}`);
    console.log(`Total Chunks platform   : ${kcTotal[0].total}`);
    console.log("═══════════════════════════════════════════════════\n");

  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(err => { console.error(err); process.exit(1); });
