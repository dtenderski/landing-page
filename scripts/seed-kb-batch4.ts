/**
 * Seed KB Batch 4 — Enrichment untuk agen Batch 1 & 2 dengan 3 KB dasar
 * Target: PROXIMA sub-agen, Manajer Keuangan, MRP-A, KPBU, Risk Register Bot
 * Pattern: 2 supplemental entries per specialist (operational + tactical/tool)
 * Idempotent: skip jika nama KB sudah ada untuk agen tersebut
 */
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function est(t: string) { return Math.ceil(t.length / 4); }
function chunkText(text: string, size = 512, overlap = 64): string[] {
  if (!text?.trim()) return [];
  const clean = text.replace(/\r\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
  const sents = clean.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = []; let cur = "", curTok = 0;
  for (const s of sents) {
    const st = est(s);
    if (curTok + st > size && cur) {
      chunks.push(cur.trim());
      cur = cur.split(/\s+/).slice(-Math.ceil(overlap/4)).join(" ") + " " + s;
      curTok = est(cur);
    } else { cur += (cur?" ":"") + s; curTok += st; }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

const TAX = {
  PELAKSANAAN:26, PENGENDALIAN:29, PERENCANAAN_EKSEKUSI:27,
  OPERASIONAL_LAPANGAN:28, KONTRAK_PERJANJIAN:2, TATA_KELOLA:31,
  TENDER:21, PERIJINAN:6, SMK3:39,
};

interface KB {
  agent_id:number; name:string;
  type:"foundational"|"operational"|"compliance"|"tactical";
  knowledge_layer:"foundational"|"operational"|"compliance"|"tactical";
  content:string; description:string; taxonomy_id:number;
  source_authority:string; source_url?:string;
}

const KB: KB[] = [

  // ══════════════════════════════════════════════════════════════
  // PROXIMA SUB-AGEN #892–901
  // ══════════════════════════════════════════════════════════════

  // #892 AGENT-CHARTER (Carter) — Project Charter & Initiating
  { agent_id:892, name:"Project Charter Konstruksi: Format & Komponen Wajib",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PMI-PMBOK7",
    description:"Format Project Charter konstruksi PMBOK7: komponen wajib, proses pengesahan, dan link ke RKK serta RMPK",
    content:`Project Charter adalah dokumen formal yang mengesahkan eksistensi proyek dan memberi Project Manager wewenang menggunakan sumber daya. Berdasarkan PMBOK 7th Edition.

KOMPONEN WAJIB PROJECT CHARTER KONSTRUKSI:
1. Identifikasi Proyek: nama, nomor kontrak, lokasi, owner, konsultan, kontraktor.
2. Tujuan & Justifikasi: mengapa proyek ini dilaksanakan, manfaat yang diharapkan, keterkaitan dengan rencana strategis owner.
3. Deskripsi Produk/Deliverable: lingkup pekerjaan utama, spesifikasi kunci (luas, volume, kapasitas), gambar konseptual.
4. Kriteria Keberhasilan (Success Criteria): waktu (tanggal selesai kontraktual), biaya (nilai kontrak & batas cost overrun), mutu (standar teknis yang wajib dipenuhi), K3 (target zero accident), lingkungan (target sesuai RKL-RPL).
5. Asumsi & Batasan: asumsi kondisi tanah, ketersediaan material lokal, akses site, batasan lingkup (apa yang TIDAK termasuk).
6. Risiko Awal (High Level): 5-10 risiko terbesar yang teridentifikasi saat inisiasi.
7. Milestone Utama: kick-off, selesai pondasi, topping-off struktur, MEP commissioning, PHO, FHO.
8. Anggaran Ringkas: nilai kontrak, advance payment, retensi, eskalasi (jika ada).
9. Organisasi Proyek: PM, deputy PM, engineering, konstruksi, K3, mutu, keuangan, logistik.
10. Otoritas & Pengesahan: tanda tangan Direktur BUJK (authority), PM (acknowledged), Owner/PPK (endorsed).

PROSES PENGESAHAN: Charter disusun Project Manager → review oleh BUJK Manajemen & Owner → ditandatangani → menjadi dasar penyusunan PMP (Project Management Plan).

LINK KE DOKUMEN LAIN: Charter → PMP → WBS → Schedule → RMPK (Rencana Mutu) → RKK (K3) → HIRADC. Semua dokumen turunan harus konsisten dengan tujuan dan kriteria keberhasilan di Charter.` },

  { agent_id:892, name:"Kick-Off Meeting: Agenda & Protokol Serah Terima Lapangan",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PUPR",
    description:"Agenda kick-off meeting proyek konstruksi, serah terima lapangan, dan mobilisasi awal sesuai kontrak PUPR",
    content:`Kick-Off Meeting (KOM) adalah pertemuan formal pertama setelah kontrak ditandatangani, menandai dimulainya tahap mobilisasi. Wajib dilaksanakan sebelum mobilisasi resources ke site.

AGENDA KICK-OFF MEETING:
1. Pembukaan oleh Owner/PPK — membacakan ruang lingkup kontrak, nilai, dan durasi.
2. Perkenalan tim: Owner/PPK + MK + Kontraktor (semua jabatan kunci).
3. Presentasi oleh Kontraktor: (a) Rencana mobilisasi; (b) Master Schedule draft; (c) Organisasi proyek; (d) Rencana K3 awal (RKK draft); (e) Rencana mutu awal (RMPK draft); (f) Prosedur komunikasi & pelaporan.
4. Presentasi oleh MK: prosedur review & approval, jalur eskalasi, jadwal rapat rutin.
5. Diskusi isu teknis awal: kondisi site, akses, HSSE awareness.
6. Tindak lanjut & deadline submit dokumen.
7. Penandatanganan Berita Acara Kick-Off.

SERAH TERIMA LAPANGAN (Hand Over Site):
Dilaksanakan bersamaan atau segera setelah KOM. Konten BA Serah Terima Site: deskripsi batas-batas site (koordinat GPS / gambar); kondisi eksisting (foto, topografi); utilitas yang ada (listrik, air, saluran); akses masuk/keluar; fasilitas yang tersedia (gudang, kantor eksisting); isu khusus (pohon lindung, sumur, bangunan tetangga).

DOKUMEN YANG HARUS DISIAPKAN SEBELUM KOM:
• Salinan kontrak yang sudah ditandatangani & jaminan pelaksanaan.
• Draft Project Charter & organisasi proyek.
• Draft Master Schedule (S-curve + milestone).
• Draft RMPK dan RKK (versi penawaran + awal pelaksanaan).
• Asuransi CAR/EAR & BPJSTK aktif.
• Daftar personel kunci (PM, Site Manager, Ahli K3, Ahli Mutu) + sertifikat.` },

  // #893 AGENT-WBS (Webe) — WBS & Scope Management
  { agent_id:893, name:"WBS Konstruksi: Struktur, Kamus, dan Dictionary",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PMI-PMBOK7",
    description:"Panduan membuat WBS proyek konstruksi: level dekomposisi, WBS Dictionary, dan integrasi ke schedule & cost baseline",
    content:`WBS (Work Breakdown Structure) adalah dekomposisi hierarkis seluruh scope pekerjaan proyek ke dalam komponen yang lebih kecil. Setiap work package harus dapat diestimasi, dijadwalkan, dan dipantau.

LEVEL DEKOMPOSISI WBS KONSTRUKSI TIPIKAL:
Level 0 — Proyek: [Nama Proyek Keseluruhan]
Level 1 — Phase: 1. Pre-Construction; 2. Construction; 3. Commissioning & Close-Out
Level 2 — Discipline/Area: Sipil/Struktur; Arsitektur; MEP; Infrastruktur; Lansekap
Level 3 — Sub-Area/Sistem: Pondasi; Struktur Lantai 1; Struktur Lantai 2..N; Atap; dll.
Level 4 — Work Package: Pekerjaan Beton Kolom Lt.3; Pekerjaan Baja Balok Lt.3; dll.
Level 5 (opsional) — Activity: Fabrikasi Bekisting Kolom; Pasang Tulangan Kolom; Cor Beton; dst.

WBS DICTIONARY — wajib untuk setiap work package:
• WBS Code: [1.2.3.4]
• Nama Work Package: [deskripsi singkat]
• Deskripsi Lingkup: [apa yang termasuk dan TIDAK termasuk]
• Deliverable: [output yang dihasilkan]
• Acceptance Criteria: [standar kualitas yang harus dipenuhi]
• Estimasi Durasi: [N hari]
• Estimasi Biaya: [Rp ...]
• Responsible (PIC): [jabatan/unit]
• Predecessors & Successors: [kode WBS terkait]
• Risk: [risiko utama untuk work package ini]

100% RULE: WBS harus mencakup 100% scope proyek. Tidak ada pekerjaan yang dilakukan di luar WBS. Jika ada pekerjaan baru (variation order), harus ditambahkan ke WBS.

INTEGRASI: WBS → Schedule (setiap work package jadi activity di Primavera/MSProject) → Cost baseline (budget per work package → BAC EVM) → Risk register (risiko dikaitkan ke work package) → Responsibility matrix (RACI per work package).` },

  { agent_id:893, name:"Scope Management: Change Control dan Variation Order",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"FIDIC",
    description:"Prosedur pengendalian perubahan scope (change control), drafting Variation Order, dan koordinasi dengan kontrak FIDIC/PUPR",
    content:`Scope creep adalah penambahan scope tanpa persetujuan formal — penyebab utama cost overrun dan schedule delay. Pengendalian scope menggunakan Change Control System.

PROSEDUR CHANGE CONTROL KONSTRUKSI:
1. Identifikasi Perubahan: siapapun dapat mengidentifikasi (kontraktor, MK, owner, kondisi lapangan).
2. Change Request (CR): dokumentasikan deskripsi perubahan, penyebab, impact estimate (waktu + biaya).
3. Evaluasi CR: technical feasibility, cost impact, schedule impact, regulatory impact.
4. Approval: CR di atas threshold tertentu memerlukan approval owner/PPK.
5. Terbitkan Variation Order (VO) / Perintah Perubahan (PP) jika disetujui.
6. Update WBS, Schedule, dan Budget Baseline.
7. Implementasi & monitoring.

FORMAT VARIATION ORDER (VO):
• Nomor VO: VO-[Proyek]-[NomorUrut]
• Deskripsi perubahan: [apa yang berubah dari kontrak asal]
• Justifikasi teknis/kontraktual: [alasan perubahan]
• Lingkup pekerjaan tambahan/kurang: [detail]
• Volume & harga: [unit × harga satuan (AHSP atau negosiasi)]
• Dampak schedule: [+ / - N hari]
• Klausul kontrak: [Sub-Clause 13 FIDIC / Pasal XX SSUK]
• Persetujuan: Owner + MK + Kontraktor (tandatangan)

RULES:
• Tidak ada pekerjaan perubahan dilaksanakan sebelum VO diterbitkan dan ditandatangani (kecuali emergensi dengan konfirmasi tertulis segera).
• VO negatif (pengurangan scope) juga harus formal.
• Akumulasikan semua VO → Contract Change Log → basis Addendum Kontrak.
• PUPR: total nilai VO tidak boleh melebihi 10% nilai kontrak awal tanpa persetujuan PPK tingkat lebih tinggi.` },

  // #896 AGENT-RISK (Rizko) — Risk Management
  { agent_id:896, name:"Risk Register Konstruksi: Format Standar & Top Risiko",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PMI-PMBOK7",
    description:"Format risk register proyek konstruksi PMBOK7 + ISO 31000, top risiko per kategori, dan strategi respons",
    content:`Risk Register adalah dokumen hidup yang mendaftar semua risiko proyek, penilaian, dan rencana respons. Berbasis PMBOK 7th + ISO 31000:2018.

FORMAT KOLOM RISK REGISTER:
Risk ID | Tanggal | Kategori | Deskripsi Risiko (kondisi + konsekuensi) | Probability (1-5) | Impact (1-5) | Risk Score | Priority | Trigger | Response Strategy | Action | PIC | Deadline | Status | Residual Risk | Peluang?

SKALA PENILAIAN (5×5):
Probability: 1=Sangat Jarang (<10%), 2=Jarang (10-30%), 3=Kadang (30-50%), 4=Sering (50-70%), 5=Sangat Sering (>70%).
Impact: 1=Tidak Signifikan, 2=Minor (<1% biaya/schedule), 3=Moderat (1-5%), 4=Mayor (5-15%), 5=Katastropik (>15%).
Priority Zone: ≥15 = High (monitor intensif + immediate action), 8-14 = Medium (action plan), <8 = Low (monitor rutin).

KATEGORI & RISIKO TIPIKAL KONSTRUKSI:
TEKNIS: kondisi tanah tidak sesuai DED (P=3,I=5=15 HIGH); desain berubah mid-project (P=4,I=4=16); ketersediaan material langka (P=3,I=4=12).
K3: fatality akibat pekerjaan ketinggian (P=2,I=5=10); crane collapse (P=1,I=5=5).
LEGAL/KONTRAK: klaim EOT ditolak (P=3,I=4=12); LD dikenakan (P=3,I=4=12); terminasi kontrak (P=1,I=5=5).
KEUANGAN: inflasi material >10% (P=3,I=4=12); subkon bangkrut (P=2,I=4=8); kurs dollar naik (P=3,I=3=9).
EKSTERNAL: cuaca ekstrim (P=4,I=3=12); demonstrasi masyarakat (P=2,I=4=8); perubahan regulasi (P=2,I=3=6).

4 STRATEGI RESPONS RISIKO NEGATIF:
• Avoid: ubah rencana untuk menghilangkan risiko (mis. ubah metode pekerjaan).
• Transfer: pindahkan dampak ke pihak lain (asuransi, klausul kontrak subkon).
• Mitigate: kurangi probability dan/atau impact (prosedur, training, duplikasi).
• Accept: terima risiko dengan contingency reserve (aktif) atau tanpa tindakan (pasif).
+ Risiko Positif (Peluang): Exploit, Share, Enhance, Accept.` },

  { agent_id:896, name:"Contingency Reserve & Risk-Based Cost Estimation",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PMI-PMBOK7",
    description:"Perhitungan contingency reserve berbasis risiko, management reserve, dan integrasi ke baseline biaya proyek",
    content:`Contingency Reserve adalah anggaran yang disiapkan khusus untuk menghadapi risiko yang sudah teridentifikasi. Berbeda dengan Management Reserve (untuk risiko yang belum diketahui).

METODE KALKULASI CONTINGENCY RESERVE:
1. Expected Monetary Value (EMV) — paling akurat:
   EMV per risiko = Probability × Impact (Rp)
   Total Contingency = Σ EMV semua risiko HIGH & MEDIUM
   Contoh: Risiko kondisi tanah P=0.3, Impact=Rp5M → EMV=Rp1.5M

2. Percentage Method (sederhana): 5-15% dari nilai kontrak untuk proyek konstruksi standar; 15-25% untuk proyek kompleks/first-of-kind.

3. Monte Carlo Simulation (untuk proyek besar): modelkan distribusi probabilitas setiap risiko → simulasi 10.000 iterasi → tentukan P80 atau P85 sebagai contingency.

STRUKTUR ANGGARAN PROYEK:
Base Estimate (tanpa risiko) → + Contingency Reserve (risiko diketahui) = Cost Baseline (BAC) → + Management Reserve (risiko tidak diketahui) = Budget.
Contingency Reserve dikontrol PM. Management Reserve dikontrol Manajemen BUJK/Owner.

RISK-ADJUSTED SCHEDULE (Schedule Contingency):
Mirip dengan cost contingency tapi dalam satuan hari.
EMV Schedule = Σ (Probability × Delay impact hari) per risiko kritis.
Tambahkan ke milestone buffer — khususnya untuk pekerjaan di critical path.

PENGGUNAAN CONTINGENCY:
Contingency hanya boleh digunakan untuk menangani risiko yang sudah teridentifikasi di register, setelah PIC minta formal approval.
Lacak penggunaan contingency vs sisa: jika habis sebelum 70% proyek → eskalasi ke manajemen.
Pada akhir proyek: sisa contingency dikembalikan ke owner (proyek pemerintah) atau menjadi tambahan margin (proyek swasta).` },

  // #897 AGENT-QUALITY (Kualit) — Quality Management
  { agent_id:897, name:"RMPK: Rencana Mutu Pelaksanaan Konstruksi — Struktur & Isi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PUPR",
    description:"Struktur RMPK sesuai Permen PUPR 10/2021 + ISO 9001:2015 dengan komponen wajib dan contoh pengisian",
    content:`RMPK (Rencana Mutu Pelaksanaan Konstruksi) adalah dokumen perencanaan mutu spesifik proyek. Wajib disetujui PPK/MK sebelum mobilisasi (Permen PUPR 10/2021).

STRUKTUR RMPK — 7 BAB UTAMA:
BAB 1 — UMUM: latar belakang proyek, ruang lingkup, referensi dokumen (kontrak, spesifikasi, standar).
BAB 2 — ORGANISASI MUTU: bagan organisasi tim mutu (Quality Manager, QC Inspector, Lab Technician); tugas & tanggung jawab setiap jabatan; jalur pelaporan & eskalasi NCR.
BAB 3 — DIAGRAM ALIR PEKERJAAN: flowchart proses untuk setiap paket pekerjaan utama (beton, baja, waterproofing, MEP) — dari persiapan sampai acceptance.
BAB 4 — ITP (Inspection Test Plan): tabel inspeksi & pengujian per pekerjaan dengan Hold/Witness/Review points, referensi standar, frekuensi, dan responsible party.
BAB 5 — PROSEDUR PENGENDALIAN MUTU: (a) Prosedur review & approval shop drawing; (b) Prosedur material submittal & approval; (c) Prosedur penerbitan & penanganan NCR; (d) Prosedur audit mutu internal; (e) Prosedur kalibrasi peralatan ukur.
BAB 6 — REKAMAN MUTU: daftar rekaman mutu yang diperlukan (test reports, inspection records, NCR log, CAPA log, material certificates) + format penyimpanan & retensi.
BAB 7 — PROGRAM AUDIT & TINJAUAN: jadwal audit internal, frekuensi Quality Meeting, prosedur tinjauan manajemen.

JAMINAN MUTU (QA) vs PENGENDALIAN MUTU (QC):
QA = sistem & proses (apa yang kita LAKUKAN untuk memastikan mutu) → RMPK, prosedur, pelatihan, audit.
QC = inspeksi & pengujian hasil pekerjaan (apakah OUTPUT memenuhi standar) → ITP, test reports, NCR.

FREKUENSI QUALITY MEETING:
Weekly QC Meeting: review NCR open items, hasil uji lab, temuan inspeksi, agenda minggu depan.
Monthly Quality Review: presentasi ke MK/owner, KPI mutu (NCR rate, NCR aging, rejeksi submittal), audit finding status.` },

  { agent_id:897, name:"KPI Mutu Konstruksi dan Pelaporan ke Owner",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"ISO-9001",
    description:"KPI mutu konstruksi yang terukur, metode pengukuran, dan format laporan mutu bulanan ke PPK/MK",
    content:`KPI Mutu Konstruksi — Leading & Lagging Indicators:

LAGGING INDICATORS (hasil — sudah terjadi):
• NCR Rate: jumlah NCR diterbitkan / 1,000 unit pekerjaan (target < 5/1,000).
• NCR Closure Rate: % NCR closed tepat waktu dalam SLA (target ≥ 90%).
• NCR Aging: jumlah NCR open > 30 hari (target = 0).
• Submittal Rejection Rate: % submittal dengan status C atau D (target < 10%).
• Test Failure Rate: % uji beton/material yang tidak memenuhi spesifikasi (target < 3%).
• Rework Cost Ratio: biaya rework / total biaya pelaksanaan (target < 2%).

LEADING INDICATORS (prediksi — proaktif):
• ITP Compliance: % hold/witness points yang dilaksanakan sesuai jadwal (target 100%).
• Submittal Schedule Compliance: % submittal yang diajukan sesuai jadwal (target > 90%).
• Inspection Frequency: jumlah inspeksi lapangan / minggu per site inspector.
• Toolbox & Quality Training Hours: jam pelatihan mutu per bulan.
• Calibration Compliance: % peralatan ukur yang dikalibrasi tepat waktu (target 100%).

FORMAT LAPORAN MUTU BULANAN:
1. Ringkasan KPI bulan ini vs target vs bulan lalu.
2. NCR Log: daftar NCR open & closed, aging, disposisi, PIC.
3. Status Submittal: jumlah submitted, approved, pending, rejected.
4. Hasil Pengujian: summary test beton (jumlah sample, % lulus), NDT, pengujian material.
5. Audit Findings: status temuan audit terakhir + CAPA.
6. Top 3 Quality Issues bulan ini & tindak lanjut.
7. Rencana Mutu bulan berikutnya.

KALIBRASI PERALATAN: semua alat ukur yang digunakan untuk quality control (timbangan, alat ukur slump, concrete hammer, torque wrench, DFT gauge) harus dikalibrasi ke lab KAN. Sertifikat kalibrasi disimpan dalam rekaman mutu.` },

  // #898 AGENT-PROCURE (Prokur) — Procurement Management
  { agent_id:898, name:"Manajemen Pengadaan Subkontraktor & Supplier Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"PUPR",
    description:"Proses pengadaan subkontraktor (pre-qual, tender, evaluasi, kontrak) dan manajemen supplier material sesuai PUPR",
    content:`Procurement Management mencakup pengadaan subkontraktor spesialis, supplier material, dan sewa peralatan.

PROSES PENGADAAN SUBKONTRAKTOR:
1. Pre-Qualification (Pre-Qual): undang subkon yang memenuhi syarat → isi formulir prakualifikasi (legalitas, SBU, pengalaman, kapasitas keuangan, personel K3 & mutu) → evaluasi dan buat approved vendor list (AVL).
2. Tender Subkon: kirim paket tender ke minimum 3 subkon dari AVL → RFQ (Request for Quotation) dengan scope of work, spesifikasi, jadwal, syarat kontrak → closing bid.
3. Evaluasi Penawaran: technical compliance check → commercial evaluation (harga, jadwal, syarat pembayaran) → reference check proyek sejenis → negosiasi → rekomendasi.
4. Award & Kontrak Subkon: draft kontrak (back-to-back dengan kontrak utama bila memungkinkan) → review legal → tanda tangan → jaminan pelaksanaan subkon (minimal 5%).
5. Contract Administration Subkon: monitoring progress, approval invoice, penanganan NCR, penyelesaian kontrak.

EVALUASI SUPPLIER MATERIAL — KRITERIA:
Teknis: kesesuaian spesifikasi, sertifikasi SNI/ISO, kapasitas produksi, jarak pengiriman.
Komersial: harga (dibandingkan benchmark AHSP), lead time, syarat pembayaran, garansi.
K3 & Lingkungan: MSDS tersedia, tidak menggunakan bahan terlarang, praktik lingkungan.
Rekam Jejak: referensi proyek sebelumnya, reputasi industri, stabilitas perusahaan.

KONTRAK SUBKON MINIMUM MENCAKUP:
Scope of work, spesifikasi teknis referensi, jadwal pelaksanaan (link ke master schedule), nilai kontrak & syarat pembayaran, jaminan pelaksanaan, retensi, kewajiban K3 & mutu (back-to-back dengan kontrak utama), prosedur NCR, force majeure, dispute resolution, terminasi.

APPROVED VENDOR LIST (AVL): update setiap tahun berdasarkan performance evaluation. Blacklist vendor yang gagal memenuhi mutu/jadwal/K3.` },

  { agent_id:898, name:"Manajemen Kontrak & Administrasi Subkon",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"PUPR",
    description:"Administrasi kontrak subkon: penerbitan Site Instruction, evaluasi progress, invoice approval, dan close-out subkon",
    content:`Administrasi kontrak subkon adalah tanggung jawab utama AGENT-PROCURE selama fase pelaksanaan.

ADMINISTRASI KONTRAK SUBKON HARIAN:
• Site Instruction (SI): instruksi teknis tertulis kepada subkon → dasar perubahan scope → harus ada ref klausul kontrak.
• Work Order (WO): izin memulai paket pekerjaan tertentu (setelah MS, material, K3 siap).
• Progress Monitoring: laporan harian/mingguan subkon → compare vs jadwal subkon → early warning jika delay.
• Quality Hold: hak kontraktor utama menghentikan pekerjaan subkon yang tidak sesuai standar.

EVALUASI DAN PEMBAYARAN INVOICE SUBKON:
1. Subkon ajukan Sertifikat Pembayaran + progress report + dokumen pendukung.
2. QC Kontraktor utama verifikasi volume pekerjaan selesai (joint survey).
3. Finance review — cek kesesuaian dengan kontrak subkon.
4. PM approve → proses pembayaran sesuai syarat (biasanya Net 30-45 hari).
5. Retensi 5% ditahan sampai masa pemeliharaan subkon selesai.
6. PPh Final 4(2) dipotong oleh kontraktor utama dari pembayaran subkon.

CLOSE-OUT SUBKON:
• Joint inspection pekerjaan subkon → punch list → close punch list.
• As-built documents dari subkon → serahkan ke tim dokumentasi.
• Serah terima pekerjaan subkon → tandatangani BAST subkon.
• Release retensi setelah DNP subkon selesai.
• Evaluasi kinerja subkon → update AVL (performance rating).

PENANGANAN KONFLIK SUBKON:
Dispute pertama-tama diselesaikan negosiasi internal. Jika gagal → mediasi. Jika gagal → arbitrase sesuai klausul kontrak subkon. Dokumentasikan semua korespondensi sejak awal sebagai bukti.` },

  // #899 AGENT-CHANGE (Chang) — Change Management
  { agent_id:899, name:"Integrated Change Control: Proses dan Change Log",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PMI-PMBOK7",
    description:"Proses Integrated Change Control PMBOK7 untuk proyek konstruksi: change request, impact analysis, approval, dan update baseline",
    content:`Integrated Change Control (ICC) memastikan semua perubahan dievaluasi secara menyeluruh terhadap dampak schedule, biaya, mutu, K3, dan lingkungan sebelum disetujui.

ALUR INTEGRATED CHANGE CONTROL:
1. Pemicu Perubahan: Owner request; RFI dari kontraktor; kondisi lapangan berbeda; desain error ditemukan; regulasi baru; NCR yang memerlukan redesign.
2. Change Request (CR) Form: nomor CR, tanggal, deskripsi, kategori (scope/schedule/cost/quality/K3), pemohon, prioritas (High/Medium/Low).
3. Impact Analysis (wajib sebelum keputusan):
   • Schedule Impact: apakah mempengaruhi critical path? Berapa hari?
   • Cost Impact: biaya tambahan atau pengurangan? (detail line item)
   • Quality Impact: apakah mengubah standar atau spesifikasi?
   • K3 Impact: apakah perlu update HIRADC atau PTW?
   • Lingkungan Impact: apakah perlu update RKL-RPL?
4. Approval Authority: CR < Rp 50 juta → PM approve; Rp 50–500 juta → Deputy Director; > Rp 500 juta → Board/Owner.
5. Implementasi: terbitkan VO / Addendum → update WBS, Schedule Baseline, Cost Baseline, RMPK, RKK.
6. Verifikasi & Close: konfirmasi implementasi sesuai CR → close CR.

CHANGE LOG — Kolom Minimum:
CR ID | Tanggal CR | Deskripsi | Kategori | Status (Submitted/Under Review/Approved/Rejected/Deferred) | Schedule Impact (hari) | Cost Impact (Rp) | VO/Addendum No. | Tanggal Close.

TIPS PENGENDALIAN SCOPE CREEP:
• Selalu minta CR tertulis — tolak pekerjaan tanpa CR.
• Review CR secara rutin dalam weekly meeting → cegah penumpukan.
• Komunikasikan ke Owner dampak kumulatif semua CR (total impact vs contingency).
• Jika CR melebihi contingency → eskalasi ke Owner untuk keputusan prioritas.` },

  { agent_id:899, name:"Addendum Kontrak & Eskalasi Perubahan ke PPK",
    type:"compliance", knowledge_layer:"compliance",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"PUPR",
    description:"Proses formalisasi perubahan kontrak via Addendum PUPR, batas kewenangan perubahan, dan prosedur eskalasi ke PPK/KPA",
    content:`Perubahan kontrak di proyek PUPR diformalkan melalui Addendum/Amandemen Kontrak. Berbeda dengan Variation Order yang merupakan instruksi teknis sehari-hari.

JENIS PERUBAHAN YANG MEMERLUKAN ADDENDUM:
• Perubahan nilai kontrak (positif atau negatif)
• Perpanjangan waktu pelaksanaan (EOT)
• Perubahan ruang lingkup pekerjaan yang signifikan
• Perubahan spesifikasi teknis material utama
• Perubahan sistem pembayaran
• Perubahan personel kunci (PM, Site Manager) yang disyaratkan kontrak

BATAS KEWENANGAN PERUBAHAN KONTRAK PUPR (Perpres 12/2021):
• Penambahan nilai s.d. 10% nilai kontrak awal: PPK berwenang.
• Penambahan > 10%: perlu persetujuan KPA (Kuasa Pengguna Anggaran).
• Pengurangan scope: PPK berwenang tapi perlu justifikasi teknis.
• Perpanjangan waktu: PPK berwenang jika sebab di luar kendali kontraktor (bencana, force majeure, keterlambatan owner).

PROSES PENGAJUAN ADDENDUM:
1. Kontraktor ajukan surat permohonan addendum ke PPK + justifikasi teknis + kalkulasi.
2. MK evaluasi dan rekomendasi.
3. PPK review → setujui/tolak/minta revisi.
4. Jika disetujui: draft Addendum disiapkan legal team → review → tanda tangan PPK & Kontraktor.
5. Addendum menjadi bagian dari kontrak dan mengikat kedua pihak.

PERUBAHAN HARGA KARENA ESKALASI (price adjustment): Kontrak PUPR jangka panjang (>12 bulan) biasanya memiliki klausul eskalasi harga mengacu indeks BPJS atau BPS. Hitung sesuai formula di SSUK. Pengajuan eskalasi harus disertai bukti kenaikan harga pasar (invoice, SNI harga, dll.).

DOKUMENTASI WAJIB: semua komunikasi terkait perubahan harus tertulis dan terdokumentasi. Korespondensi verbal tidak dapat dijadikan dasar perubahan kontrak.` },

  // #900 AGENT-COMM (Komun) — Communications Management
  { agent_id:900, name:"Rencana Komunikasi Proyek & Matriks Stakeholder",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PMI-PMBOK7",
    description:"Communication Management Plan konstruksi: stakeholder register, matriks komunikasi, dan protokol rapat/pelaporan",
    content:`Communications Management Plan mendefinisikan siapa mendapat informasi apa, kapan, melalui media apa, dan siapa yang bertanggung jawab.

STAKEHOLDER REGISTER PROYEK KONSTRUKSI:
Internal: Project Manager, Site Manager, Engineering, Quality, Safety, Finance, Procurement, Subkon.
Eksternal Utama: Owner/PPK, MK (Konsultan Pengawas), Perencana/Arsitek.
Eksternal Pendukung: Disnaker (K3), Dinas LH (lingkungan), Dishub (transportasi), PLN/PDAM (utilitas).
Eksternal Komunitas: masyarakat sekitar site, media lokal, tokoh adat/agama.

MATRIKS KOMUNIKASI PROYEK — Format:
Jenis Informasi | Frekuensi | Format | Pengirim | Penerima | Media | Deadline.

RAPAT PROYEK STANDAR:
• Toolbox Meeting: harian 06:30, 15 menit, semua pekerja, dipimpin Supervisor/HSE → topik K3 + instruksi hari ini.
• Weekly Site Meeting: mingguan (Senin), 60-90 menit, Tim Inti Kontraktor + MK → review progress, isu teknis, look-ahead 3 minggu.
• Monthly Progress Meeting: bulanan, 2-3 jam, PM + Owner/PPK + MK + Konsultan → WPR, EVM, isu kritis, keputusan strategis.
• Safety Meeting P2K3: bulanan, P2K3 + perwakilan pekerja → review KPI K3, insiden, program bulan depan.
• Coordination Meeting (MEP): mingguan atau dua-mingguan → koordinasi antar subkon MEP + sipil.

PROTOKOL KORESPONDENSI FORMAL:
• Semua korespondensi resmi: tertulis, bernomor surat, tertanggal.
• Site Instruction (SI): dari MK ke Kontraktor — wajib direspons dalam 3 hari kerja.
• Request for Information (RFI): dari Kontraktor ke MK/Perencana — response time max 7 hari kerja (atau sesuai kontrak).
• Transmittal: pengantar resmi setiap pengiriman dokumen (submittal, shop drawing).
• Seluruh korespondensi diarsip dalam document management system (CDE/EDMS/SharePoint).` },

  { agent_id:900, name:"Pelaporan Kemajuan Proyek: Weekly & Monthly Construction Report",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PUPR",
    description:"Struktur dan isi Weekly & Monthly Construction Report untuk proyek PUPR: laporan fisik, K3, mutu, keuangan, dan isu",
    content:`Weekly Progress Report (WPR) dan Monthly Construction Report (MCR) adalah media komunikasi formal kemajuan proyek ke Owner/PPK dan MK.

WEEKLY PROGRESS REPORT — STRUKTUR:
1. Executive Summary: % fisik minggu ini vs rencana, status keseluruhan (Green/Yellow/Red), highlight isu kritis.
2. Kemajuan Fisik per WBS: % kumulatif per paket pekerjaan (actual vs plan), S-curve update, foto dokumentasi.
3. Jadwal Look-Ahead 3 Minggu: rencana pekerjaan minggu depan, milestones, kebutuhan resources.
4. EVM Summary: PV, EV, AC, CPI, SPI, EAC, VAC (tabel ringkas + S-curve fisik & cost).
5. Isu Teknis & RFI Open: daftar RFI pending, shop drawing pending approval, isu desain.
6. K3: jam kerja, near-miss, insiden, inspeksi, PTW stats.
7. Mutu: test results minggu ini, NCR baru, status submittal.
8. Cuaca: ringkasan cuaca minggu ini + dampak ke pekerjaan (jika ada).
9. Action Items: dari WPR minggu lalu — status penyelesaian.

MONTHLY CONSTRUCTION REPORT (MCR) — STRUKTUR TAMBAHAN:
1. Semua isi WPR (versi bulanan/kumulatif).
2. Cash Flow Report: cash in (termin diterima) vs cash out (pembayaran subkon/supplier), proyeksi 3 bulan.
3. Procurement Status: status pengadaan subkon/material kritis, lead time, potensi delay.
4. Risk Register Update: risiko baru, perubahan risk score, status respons.
5. Photo Documentation: progress foto terstruktur per WBS/area/milestone.
6. Quality Report: KPI mutu bulanan (NCR rate, test failure rate, rework cost ratio).
7. K3 Report: LTIFR, TRIFR, program K3 bulanan, audit findings.
8. Environmental Report: status RKL-RPL, hasil pemantauan jika periode semester.
9. Contract Status: nilai kontrak, CO/VO yang disetujui, sisa kontrak, advance payment, retensi.
10. Lampiran: test reports, NCR log, approved submittals daftar, foto K3.

SUBMIT: WPR setiap Senin pagi (laporan minggu sebelumnya). MCR paling lambat tanggal 5 bulan berikutnya.` },

  // #901 AGENT-CLOSEOUT (Kloz) — Project Close-Out
  { agent_id:901, name:"Project Close-Out: Proses, Checklist, dan Transfer Aset",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PUPR",
    description:"Tahapan project close-out konstruksi: pre-PHO, PHO, masa pemeliharaan, FHO, dan transfer aset ke owner",
    content:`Project Close-Out adalah fase akhir proyek yang memastikan semua deliverable selesai, diserahkan, dan semua kewajiban kontraktual terpenuhi.

TAHAPAN CLOSE-OUT PROYEK KONSTRUKSI:

1. PRE-COMMISSIONING & COMMISSIONING (MEP & Sistem):
   • Testing seluruh sistem MEP (HVAC, plumbing, fire fighting, electrical, lift, BAS).
   • Inspeksi struktural akhir.
   • Waterproofing flood test.
   • Dokumentasi: commissioning report, test records, as-built MEP.

2. PRE-PHO INSPECTION (Joint Inspection):
   • Kontraktor + MK + Owner lakukan inspeksi bersama.
   • Terbitkan punch list (high/medium/low priority items).
   • Kontraktor perbaiki semua High-priority items.
   • Re-inspeksi untuk verifikasi penutupan punch list kritis.

3. PHO (Provisional Hand Over) / Serah Terima Pertama:
   • Dokumen wajib: as-built drawings (semua disiplin), O&M Manual dari manufaktur, warranty certificates, SLF (Sertifikat Laik Fungsi) untuk bangunan gedung, uji emisi/pengujian akhir.
   • BAST-I diterbitkan → retensi 5% tetap ditahan.
   • Masa Pemeliharaan (Defect Notification Period): umumnya 180 hari (6 bulan) untuk proyek PUPR.

4. MASA PEMELIHARAAN:
   • Kontraktor wajib perbaiki semua cacat yang timbul selama masa pemeliharaan atas biaya sendiri.
   • Setelah PHO, ownership aset pindah ke owner tapi tanggung jawab cacat tetap di kontraktor.

5. FHO (Final Hand Over) / Serah Terima Akhir:
   • Verifikasi semua punch list medium/low sudah closed.
   • Verifikasi tidak ada cacat baru yang timbul.
   • BAST-II diterbitkan → retensi 5% dicairkan → jaminan pemeliharaan dikembalikan.
   • Semua rekaman proyek diserahkan (as-built, test reports, NCR log, K3 records) → arsip owner (biasanya 10 tahun).

6. ADMINISTRATIVE CLOSE-OUT:
   • Final account: rekap semua VO, final payment application, retensi, klaim yang diselesaikan.
   • Lessons Learned: dokumentasikan apa yang berjalan baik dan area perbaikan.
   • Evaluasi kinerja subkon & supplier → update AVL.
   • Demobilisasi personel & peralatan.` },

  { agent_id:901, name:"Lessons Learned & Post-Project Review Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PMI-PMBOK7",
    description:"Metodologi Lessons Learned dan Post-Project Review untuk meningkatkan kinerja proyek berikutnya",
    content:`Lessons Learned (LL) adalah knowledge capture dari pengalaman proyek — baik yang berhasil maupun yang gagal. Basis untuk continuous improvement organisasi.

KAPAN LESSONS LEARNED DIKUMPULKAN:
• Mid-project: per milestone utama (selesai struktur, selesai atap, MEP commissioning) — tidak menunggu proyek selesai.
• Post-project: dalam 2 minggu setelah FHO, saat memory masih fresh.

FORMAT LESSONS LEARNED REGISTER:
ID | Tanggal | Kategori | Situasi (apa yang terjadi) | Penyebab | Dampak | Apa yang Berhasil | Apa yang Tidak | Rekomendasi untuk Proyek Berikutnya | PIC | Status Implementasi.

KATEGORI LESSONS LEARNED:
Teknis: metode konstruksi yang efektif/tidak efektif, solusi kondisi tanah sulit.
Jadwal: aktivitas yang selalu menjadi bottleneck, teknik akselerasi yang berhasil.
Biaya: item yang konsisten overrun/underrun, peluang cost saving yang terlewat.
Pengadaan: vendor/subkon berkinerja baik vs buruk, teknik procurement yang efektif.
K3: insiden yang bisa dicegah, program K3 yang berhasil menurunkan risiko.
Mutu: jenis NCR yang berulang dan cara eliminasinya, teknik quality control yang efektif.
Komunikasi: stakeholder yang sulit dikelola, media komunikasi yang paling efektif.

POST-PROJECT REVIEW MEETING:
Agenda: (1) Review target vs aktual (schedule, cost, mutu, K3); (2) Root cause analysis atas gap; (3) Presentasi lessons learned; (4) Rekomendasi perbaikan proses; (5) Action plan untuk implementasi.
Peserta: seluruh tim inti proyek + perwakilan manajemen BUJK.
Output: Laporan Lessons Learned yang disimpan dalam knowledge management sistem BUJK.

KNOWLEDGE MANAGEMENT: Simpan LL dalam database searchable (SharePoint, Confluence, atau folder bersama). PM proyek berikutnya wajib review LL proyek sejenis sebelum mobilisasi.` },

  // ══════════════════════════════════════════════════════════════
  // MANAJER KEUANGAN SUB-AGEN #903-904, #907-909
  // ══════════════════════════════════════════════════════════════

  // #903 AB-01 RAB & Cost Estimator
  { agent_id:903, name:"RAB Konstruksi: AHSP, Bill of Quantity, dan Estimasi Biaya",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PUPR",
    description:"Metode penyusunan RAB konstruksi: AHSP, SNI, BQ format, dan rekonsiliasi dengan nilai kontrak",
    content:`RAB (Rencana Anggaran Biaya) adalah estimasi biaya konstruksi yang menjadi dasar penawaran harga dan pengendalian biaya proyek.

KOMPONEN AHSP (Analisis Harga Satuan Pekerjaan):
Sesuai SE PUPR 18/2021: Biaya Langsung + Biaya Tidak Langsung.
Biaya Langsung: (a) Bahan/Material = volume × harga satuan material; (b) Upah/Tenaga Kerja = volume × koefisien pekerja × upah satuan; (c) Sewa Peralatan = volume × koefisien alat × tarif alat.
Biaya Tidak Langsung: Overhead perusahaan (biasanya 10-15%), Keuntungan (biasanya 10%), PPN 11%.

KOEFISIEN AHSP: ditetapkan dalam SNI dan SE PUPR. Contoh — beton bertulang fc'25 MPa per m³: semen 331 kg, pasir 0.485 m³, kerikil 0.832 m³, air 215 liter, besi tulangan 157 kg, kawat 2.35 kg, tenaga: Mandor 0.083 OH, Kepala Tukang 0.028 OH, Tukang Batu 0.275 OH, Pekerja 1.65 OH.

FORMAT BILL OF QUANTITY (BQ):
No | Uraian Pekerjaan | Satuan | Volume | Harga Satuan (Rp) | Jumlah Harga (Rp).
BQ disusun mengikuti WBS proyek: per section/zona dan per pekerjaan.
Sub-total per section → Rekapitulasi per bab → Total nilai pekerjaan.

REKONSILIASI RAB VS NILAI KONTRAK:
RAB penawaran (biaya langsung+tak langsung) = dasar negosiasi.
Nilai kontrak yang disetujui → menjadi Budget at Completion (BAC) dalam EVM.
Perbedaan antara RAB penawaran dan nilai kontrak = margin awal yang harus dijaga.

CONTINGENCY DALAM RAB:
Masukkan allowance untuk: quantitiy error ±5%, fluktuasi harga material ±5-10%, biaya tidak terduga ±3-5%. Total contingency biasanya 5-15% dari biaya langsung (tergantung kompleksitas proyek).` },

  { agent_id:904, name:"Cash Flow Proyek: S-Curve, Termin, dan Proyeksi Kebutuhan Modal",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PUPR",
    description:"Penyusunan S-curve cash flow proyek konstruksi, jadwal termin progress payment, dan proyeksi kebutuhan modal kerja",
    content:`Cash Flow Management proyek konstruksi memastikan ketersediaan dana untuk membayar biaya operasional (material, upah, subkon, sewa alat) sepanjang durasi proyek.

S-CURVE CASH FLOW:
S-curve memvisualisasikan profil biaya kumulatif vs waktu. Mengapa berbentuk S: fase awal lambat (mobilisasi), tengah cepat (konstruksi puncak), akhir melambat (finishing, commissioning).
Data untuk S-curve: schedule (kapan setiap pekerjaan terjadi) + biaya (AHSP per pekerjaan) → distribusikan biaya per periode waktu (mingguan/bulanan).

JADWAL TERMIN PROGRESS PAYMENT:
Termin dibayarkan berdasarkan % progres fisik yang dicapai. Contoh termin standar PUPR:
Termin 1: 10% progres → Advance Payment (dibayar di awal, dipotong per termin).
Termin 2: 25% progres.
Termin 3: 50% progres.
Termin 4: 75% progres.
Termin 5: 90% progres.
Termin 6: 95% progres (PHO).
Retensi (5%) dikembalikan saat FHO.

PROYEKSI KEBUTUHAN MODAL KERJA:
Working Capital = Cash Out kumulatif − Cash In kumulatif (termin yang sudah diterima).
Cash Out lebih cepat dari Cash In (ada time lag pengajuan termin → approval → pembayaran: biasanya 14-30 hari untuk PUPR).
Peak Working Capital: biasanya terjadi saat 50-70% pelaksanaan.
Solusi jika modal tidak cukup: Advance Payment dari owner (10-20% nilai kontrak), KIK (Kredit Investasi Konstruksi) dari bank, factoring piutang, negosiasi pembayaran subkon lebih lama.

CASH FLOW FORECAST PER BULAN:
Proyeksikan 3 bulan ke depan: rencana cash out (material delivery, progress subkon, gaji) vs rencana cash in (termin yang akan diajukan berdasarkan S-curve fisik). Identifikasi bulan dengan potential cash deficiency → siapkan solusi lebih awal.` },

  { agent_id:907, name:"Klaim Variasi & EOT: Kuantifikasi dan Prosedur PUPR",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"PUPR",
    description:"Prosedur klaim variasi dan EOT di kontrak PUPR: dasar hukum, kuantifikasi biaya, dan pengajuan ke PPK",
    content:`Klaim variasi dan EOT di kontrak PUPR mengikuti SSUK (Syarat-Syarat Umum Kontrak) yang merupakan adaptasi FIDIC ke dalam regulasi Indonesia.

JENIS KLAIM YANG DAPAT DIAJUKAN KONTRAKTOR:
1. Klaim Biaya Tambah (Variation): pekerjaan di luar lingkup kontrak asal yang diperintahkan owner/PPK.
2. Klaim EOT: perpanjangan waktu akibat force majeure, keterlambatan owner, atau variasi berdampak jadwal.
3. Klaim Prolongation Cost: biaya overhead selama perpanjangan waktu yang disebabkan risiko owner.
4. Klaim Eskalasi Harga: untuk kontrak jangka panjang dengan klausul price adjustment.

DASAR HUKUM KLAIM DI KONTRAK PUPR:
SSUK Pasal Perpanjangan Waktu (≈ FIDIC 8.5). SSUK Pasal Perubahan Kontrak (≈ FIDIC 13). SSUK Pasal Keadaan Kahar (≈ FIDIC 18 Force Majeure). PP 16/2018 dan Perpres 12/2021 tentang pengadaan barang/jasa.

PROSEDUR KLAIM PUPR:
1. Identifikasi event → catat dalam daily report & foto.
2. Ajukan Surat Permohonan ke PPK dalam 28 hari sejak event (analog FIDIC 20.1).
3. Lampirkan: kronologi event, dasar klausul SSUK, estimasi awal impact.
4. Simpan catatan kontemporer selama proses berlangsung.
5. Submit Klaim Terperinci dalam 42 hari: TIA schedule, breakdown biaya (line item), bukti pendukung.
6. MK evaluasi → rekomendasikan ke PPK.
7. PPK putuskan → terbitkan VO/Addendum jika disetujui.

KUANTIFIKASI BIAYA KLAIM:
Biaya Langsung: material tambahan (invoice), upah ekstra (payroll), sewa alat ekstra (invoice/tarif kontrak).
Biaya Tidak Langsung (Prolongation): site overhead harian × EOT hari; HQ overhead (Hudson formula); equipment idle cost (ownership cost × EOT hari).
Loss of Productivity: measured mile atau industry factor.
SEMUA harus didukung dokumen: invoice, payroll slip, daily cost sheet, equipment log.` },

  { agent_id:908, name:"Laporan Keuangan Proyek & Audit BPKP Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TATA_KELOLA, source_authority:"PSAK-34",
    description:"Laporan keuangan proyek konstruksi PSAK 34 (contract cost), persiapan audit BPKP, dan rekonsiliasi keuangan proyek",
    content:`Akuntansi proyek konstruksi menggunakan PSAK 34 (Kontrak Konstruksi) — berlaku untuk kontrak dengan durasi lebih dari satu periode akuntansi.

PSAK 34 — METODE PERSENTASE PENYELESAIAN:
Pendapatan diakui sebesar % penyelesaian × nilai kontrak.
% Penyelesaian = Biaya aktual yang terjadi / Estimasi total biaya (EAC).
Alternatif: % fisik progres yang ditetapkan secara teknis.
Jika rugi kontrak diperkirakan: akui rugi sepenuhnya sekarang (conservative principle).

KOMPONEN BIAYA KONTRAK (PSAK 34):
Biaya kontrak langsung: material, upah pekerja site, depreciation alat, subkon, biaya mobilisasi.
Biaya overhead yang dapat diatribusikan: asuransi, supervisi, administrasi proyek.
Tidak termasuk: biaya R&D, biaya tidak terkait, biaya HQ yang tidak dapat diatribusikan.

FORMAT LAPORAN KEUANGAN PROYEK (PROJECT LEDGER):
Setiap proyek memiliki cost center tersendiri: Revenue (termin billed & unbilled) vs Cost (langsung + allocated overhead) → Project Margin.
Laporan bulanan: Nilai kontrak | Termin ditagih | Termin diterima | Biaya aktual | Biaya committed (PO, kontrak subkon) | Forecast to Complete | Projected Margin.

PERSIAPAN AUDIT BPKP/INSPEKTORAT:
BPKP berwenang mengaudit proyek pemerintah. Persiapkan: kontrak asli + semua addendum, semua VO dengan bukti pendukung, invoice material & subkon, payroll records, laporan progress resmi, foto dokumentasi per milestone, berita acara inspeksi, dokumen K3 (RKK), as-built drawings.
Temuan umum audit BPKP: pekerjaan tidak sesuai volume kontrak (mark-up quantity), harga satuan tidak sesuai AHSP, pekerjaan belum selesai tapi sudah ditermin, subkon fiktif. Pastikan semua terdokumentasi dan dapat diverifikasi fisik.` },

  { agent_id:909, name:"SKK Keuangan Konstruksi: Materi Ujian & Bank Soal",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TATA_KELOLA, source_authority:"LSP-SDMKI",
    description:"Materi dan contoh soal SKK (Sertifikat Kompetensi Kerja) untuk jabatan Ahli Muda/Madya Manajemen Keuangan Konstruksi",
    content:`SKK Manajemen Keuangan Konstruksi — Jabatan: Ahli Muda (Jenjang 7) dan Ahli Madya (Jenjang 8).

UNIT KOMPETENSI SKK KEUANGAN KONSTRUKSI (representatif):
UK1: Menerapkan peraturan dan prosedur keselamatan kerja (wajib semua SKK).
UK2: Menyusun Rencana Anggaran Biaya (RAB) Konstruksi.
UK3: Mengelola Cash Flow Proyek Konstruksi.
UK4: Menerapkan akuntansi proyek (PSAK 34).
UK5: Mengelola pajak jasa konstruksi (PPh Final 4(2), PPN).
UK6: Menyusun laporan keuangan proyek.
UK7: Menganalisa biaya proyek dengan EVM (untuk Madya).
UK8: Menyusun klaim finansial kontrak (untuk Madya).

CONTOH SOAL AHLI MUDA:
1. Apa yang dimaksud DPP dalam perhitungan PPh Final 4(2)? Jawab: Dasar Pengenaan Pajak = nilai kontrak/termin sebelum PPN.
2. BUJK Kualifikasi Menengah mengerjakan proyek Rp20M, termin ke-2 adalah 30% progres. Berapa PPh Final yang dipotong owner? Jawab: DPP = 30% × Rp20M = Rp6M. PPh = 2.65% × Rp6M = Rp159 juta.
3. Apa perbedaan cost baseline dan budget proyek? Jawab: Cost Baseline = Base Estimate + Contingency Reserve; Budget = Cost Baseline + Management Reserve.
4. Jelaskan apa itu CPI dan bagaimana menginterpretasikannya! Jawab: CPI = EV/AC. CPI < 1 = over budget (setiap Rp1 dikeluarkan menghasilkan < Rp1 nilai pekerjaan). CPI > 1 = under budget.
5. Apa kewajiban kontraktor terhadap PPh pekerja site? Jawab: Potong PPh 21 dari upah pekerja, setor tanggal 10 bulan berikutnya, lapor SPT Masa PPh 21 tanggal 20.

TIPS LULUS UJIAN SKK KEUANGAN:
Pelajari rumus EVM (CV, SV, CPI, SPI, EAC semua metode). Hafal tarif pajak (PPh Final 4(2), PPN, PPh 21). Pahami komponen RAB dan AHSP. Pelajari PSAK 34 metode persentase penyelesaian. Latihan studi kasus EVM dan klaim.` },

  // ══════════════════════════════════════════════════════════════
  // MRP-A SUB-AGEN #876–882
  // ══════════════════════════════════════════════════════════════

  // #876 AB-01 Vendor Scoring
  { agent_id:876, name:"Vendor Evaluation & Scoring System untuk Rantai Pasok Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"PMI-PMBOK7",
    description:"Metodologi vendor scoring, KPI vendor konstruksi, dan sistem approved vendor list (AVL) berbasis kinerja",
    content:`Vendor Evaluation adalah proses sistematis menilai kemampuan dan kinerja supplier/subkon menggunakan kriteria terukur.

KRITERIA PENILAIAN VENDOR (Scoring Matrix):
TEKNIS (40%): (a) Kualitas produk/hasil kerja: rekam jejak NCR, rejection rate, hasil uji (20%); (b) Kapasitas produksi/kapasitas proyek (10%); (c) Sertifikasi mutu (ISO, SNI-mark) (10%).
DELIVERY & SERVICE (25%): (a) On-time delivery rate (10%); (b) Lead time (5%); (c) Responsivitas & komunikasi (5%); (d) After-sale support/warranty (5%).
KOMERSIAL (20%): (a) Harga kompetitif (dibandingkan benchmark AHSP) (10%); (b) Syarat pembayaran (5%); (c) Stabilitas harga (5%).
K3 & LINGKUNGAN (15%): (a) K3 compliance (HIRADC, APD, zero insiden) (10%); (b) Sertifikasi lingkungan (5%).

SKALA: Setiap kriteria dinilai 1-5. Nilai × Bobot → Total Weighted Score (max 500 = 5.00).

KATEGORI VENDOR:
Preferred (4.0–5.0): prioritas pengadaan, syarat pembayaran terbaik, undang ke seluruh proyek.
Approved (3.0–3.9): dapat digunakan, monitor lebih ketat.
Conditional (2.0–2.9): hanya digunakan jika tidak ada pilihan lain, action plan perbaikan wajib.
Blacklist (<2.0 atau insiden serius): tidak dapat digunakan, hapus dari AVL.

APPROVED VENDOR LIST (AVL):
Kolom: Nama Vendor | Kategori (material/subkon/alat) | Alamat | Kontak | Produk/Jasa | Sertifikasi | Tanggal Pre-Qual | Score Terakhir | Status | Catatan.
Review AVL setiap 6-12 bulan berdasarkan evaluasi kinerja proyek. Vendor baru: wajib pre-qualification sebelum masuk AVL. Vendor yang berhasil memperbaiki kinerja: upgrade kategori.

KPI VENDOR MONITORING (bulanan):
On-time delivery rate, quality acceptance rate (% batch tanpa NCR), response time to issues, K3 compliance rate.` },

  { agent_id:877, name:"Material Quality Inspection: Receiving, Testing & Rejection",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PELAKSANAAN, source_authority:"BSN-SNI",
    description:"Prosedur penerimaan material di site, inspeksi fisik, pengujian lab, dan protokol penolakan material tidak sesuai",
    content:`Material Quality Inspection memastikan setiap material yang masuk ke site sesuai spesifikasi kontrak sebelum digunakan dalam pekerjaan permanen.

PROSEDUR PENERIMAAN MATERIAL DI SITE:
1. Pre-delivery: pastikan submittal material sudah approved (status A atau B) sebelum material dipesan.
2. Saat delivery: (a) Verifikasi identitas material (label, kemasan, merek sesuai submittal); (b) Cek Certificate of Conformance dari pabrik; (c) Cek batch number, tanggal produksi, tanggal kedaluwarsa (untuk material berumur terbatas).
3. Inspeksi visual: kondisi kemasan (tidak rusak, tidak basah), tidak ada tanda kerusakan selama transit.
4. Sampling & pengujian: ambil sample sesuai frekuensi dalam ITP → kirim ke lab terakreditasi KAN.
5. Verifikasi dokumen: MSDS untuk B3, COO untuk material impor.
6. Pencatatan: Material Receiving Record (tanggal, supplier, no. PO, deskripsi, volume, kondisi, status).

FREKUENSI PENGUJIAN MATERIAL (contoh):
Beton ready-mix: slump test SETIAP truck, 1 set benda uji per 50 m³ (min 2 silinder 7 hari + 2 silinder 28 hari).
Baja tulangan: 1 set (uji tarik + tekuk) per 10 ton per diameter.
Material waterproofing: 1 sampel per batch/lot untuk uji lab (tebal, elongasi, kekuatan).
Semen: 1 sampel per 50 ton untuk uji kuat tekan mortar (jika tidak ada SNI-mark).

PROTOKOL PENOLAKAN MATERIAL:
1. Tandai material "REJECTED" (label merah, barikade area).
2. Terbitkan NCR material ke supplier.
3. Foto dokumentasi kondisi material.
4. Supplier wajib ganti material dalam waktu yang ditetapkan (biasanya 3-7 hari).
5. Material reject TIDAK BOLEH keluar dari karantina sebelum dikonfirmasi oleh supplier.
6. Jangan pernah gunakan material reject untuk pekerjaan sementara tanpa persetujuan.` },

  { agent_id:878, name:"Equipment Fitness & Kelaikan Alat di Proyek Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PELAKSANAAN, source_authority:"Kemnaker",
    description:"Checklist kelaikan alat berat sebelum operasi, persyaratan SIA/SIO, dan prosedur pemeriksaan berkala di site",
    content:`Equipment Fitness Tracker memastikan semua alat berat dan plant di site beroperasi dalam kondisi laik, bersertifikat, dan dioperasikan oleh operator yang kompeten.

CHECKLIST KELAIKAN ALAT SEBELUM OPERASI (Pre-Use Inspection):
Dokumentasi: SIA valid (tidak expired) + fotokopi tersimpan di site office. SIO operator valid + sesuai golongan kapasitas alat. Buku service/maintenance log tersedia.
Struktur & Mekanik: tidak ada retak, deformasi, atau kebocoran oli signifikan. Boom/arm/bucket dalam kondisi baik, tidak ada retak las. Pin dan bearing tidak aus berlebihan.
Sistem Operasi: engine start normal, tidak ada asap abnormal. Sistem hidrolik berfungsi normal (tidak ada hesitation atau drift). Brake berfungsi, travel device normal.
Safety Devices: lampu peringatan (horn, backup alarm) berfungsi. Limit switch/overload limiter (untuk crane) aktif dan di-test. Fire extinguisher di kabin. ROPS/FOPS (jika dipersyaratkan).
Wire Rope (untuk crane): tidak ada kink, flatten, korosi, atau putus > 10% kawat per pitch. Drum tergulung rapi. Hook safety latch berfungsi.

REGISTER KELAIKAN ALAT — Kolom:
Unit ID | Tipe Alat | Nomor SIA | Tanggal Expiry SIA | Nama Operator | Nomor SIO | Tanggal Expiry SIO | Pre-use check Terakhir | Status | Catatan.

JADWAL PEMERIKSAAN BERKALA DI SITE:
Daily pre-use: operator mengisi checklist 15 menit sebelum operasi.
Weekly: mekanik site inspeksi semua unit, fokus safety items.
Monthly: Plant Manager review semua register, identifikasi yang mendekati expiry SIA.
Biennial: perpanjangan SIA oleh PJK3 (Sucofindo, SAI, dll.) — jadwalkan 2 bulan sebelum expiry.

TINDAKAN JIKA ALAT TIDAK LAIK: Tag "OUT OF SERVICE" (merah), tidak boleh dioperasikan. Laporkan ke Plant Manager & HSE Officer. Perbaiki → re-inspect → jika laik: tag hijau kembali.` },

  { agent_id:879, name:"Supply Chain Risk Register untuk Proyek Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PMI-PMBOK7",
    description:"Identifikasi dan mitigasi risiko rantai pasok material kritis: keterlambatan, kenaikan harga, kelangkaan, dan gangguan logistik",
    content:`Supply Chain Risk Register (SCRR) mengidentifikasi risiko yang dapat mengganggu ketersediaan material, peralatan, dan jasa yang dibutuhkan proyek.

KATEGORI RISIKO RANTAI PASOK KONSTRUKSI:

1. RISIKO KETERSEDIAAN MATERIAL:
Kelangkaan material kritis (baja, beton precast): P=3, I=4 = 12 HIGH. Mitigasi: pesan early (lead time +30 hari), identifikasi 2-3 supplier alternatif, pertimbangkan buffer stock.
Material impor: P=3, I=4 = 12. Mitigasi: order 2-3 bulan sebelum butuh, monitor kurs, siapkan alternatif lokal.
Discontinuation produk (manufacturer stop): P=2, I=4 = 8. Mitigasi: konfirmasi ketersediaan sebelum submittal, stok minimal 1 batch.

2. RISIKO HARGA:
Inflasi material >10%: P=4, I=3 = 12. Mitigasi: lock harga dengan LOI atau Purchase Order awal, klausul price adjustment di PO untuk kontrak jangka panjang.
Kurs USD naik >10% (material impor): P=3, I=3 = 9. Mitigasi: hedging kurs (jika memungkinkan), percepat pembelian jika kurs menguntungkan.

3. RISIKO DELIVERY:
Keterlambatan pengiriman akibat cuaca/banjir: P=3, I=3 = 9. Mitigasi: jadwal delivery dengan buffer, identifikasi rute alternatif, monitor forecast cuaca.
Masalah kepabeanan (material impor): P=2, I=4 = 8. Mitigasi: gunakan freight forwarder berpengalaman, siapkan dokumen lengkap sejak dini.
Kapasitas angkut terbatas: P=2, I=3 = 6. Mitigasi: booking truk/trailer di muka untuk material volume besar.

4. RISIKO VENDOR:
Subkon bangkrut mid-project: P=2, I=5 = 10. Mitigasi: payment bond subkon, jangan bayar advance terlalu besar (max 20%), siapkan replacement vendor.
Vendor kunci tidak mampu supply volume: P=2, I=4 = 8. Mitigasi: AVL dengan ≥2 vendor per kategori kritis.

MONITORING SCRR: review mingguan oleh Supply Chain Manager, update status setiap bulan, eskalasi jika risk score naik ke HIGH.` },

  { agent_id:880, name:"SOP & Kontrak Subkon: Template dan Komponen Wajib",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"PUPR",
    description:"Template SOP pengadaan subkon dan komponen wajib kontrak subkon back-to-back dengan kontrak utama",
    content:`SOP Pengadaan Subkontraktor dan template kontrak subkon yang back-to-back (sejalan) dengan kontrak utama.

SOP PENGADAAN SUBKON — 7 TAHAP:
T1. Perencanaan: identifikasi paket yang akan disubkontrakkan berdasarkan WBS; tentukan kualifikasi minimum subkon; siapkan paket tender subkon (scope, spesifikasi, BOQ, jadwal, syarat kontrak).
T2. Pre-Qualification: kirim undangan + formulir PQ ke vendor dari AVL; evaluasi: legalitas (SIUP, SBU, NPWP), pengalaman (referensi 3 proyek sejenis), kapasitas (SDM, alat, keuangan), K3 & mutu (sertifikasi, rekam jejak).
T3. Tender: kirim dokumen tender ke min 3 subkon lulus PQ; evaluasi teknis & komersial; klarifikasi; negosiasi; rekomendasi pemenang.
T4. Kontrak: draft kontrak; review legal; tanda tangan + jaminan pelaksanaan subkon (5%); notifikasi ke PPK/MK jika dipersyaratkan kontrak utama.
T5. Mobilisasi: kick-off meeting subkon; serah terima area kerja; briefing K3 & mutu; verifikasi personel & alat subkon.
T6. Pelaksanaan: monitoring progress mingguan; approval invoice; penanganan NCR; koordinasi jadwal.
T7. Close-Out: joint inspection; punch list; BAST subkon; release retensi; evaluasi kinerja.

KOMPONEN WAJIB KONTRAK SUBKON:
• Scope of Work (link ke WBS nomor): detail pekerjaan yang termasuk dan TIDAK termasuk.
• Spesifikasi Teknis: referensi spesifikasi kontrak utama yang berlaku.
• Jadwal Pelaksanaan: milestone dan durasi, link ke Master Schedule proyek.
• Nilai Kontrak & Termin: nilai, syarat pembayaran, advance (max 20%), retensi (min 5%).
• Kewajiban K3 (BACK-TO-BACK): subkon wajib patuhi RKK proyek, PTW sistem, APD, toolbox meeting.
• Kewajiban Mutu: subkon ikuti ITP proyek, submit shop drawing & material sebelum pelaksanaan, tanggung jawab NCR.
• Asuransi & BPJSTK: subkon wajib BPJSTK untuk seluruh pekerjanya.
• PPh Final: kontraktor utama potong PPh Final 4(2) dari pembayaran subkon.
• Dispute Resolution & Terminasi: tahapan eskalasi, hak terminasi, konsekuensi wanprestasi.` },

  { agent_id:881, name:"LKUT: Laporan Kebutuhan Utilisasi Tenaga Kerja",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PUPR",
    description:"Penyusunan LKUT untuk proyek konstruksi: format, dasar hukum, hubungan ke SMKK dan ketenagakerjaan, dan cara pengisian",
    content:`LKUT (Laporan Kebutuhan Utilisasi Tenaga Kerja) adalah dokumen perencanaan ketenagakerjaan proyek konstruksi yang wajib disusun dan dilaporkan.

DASAR HUKUM LKUT:
Permen PUPR 8/2023 tentang SMKK: kontraktor wajib melaporkan penggunaan tenaga kerja konstruksi (TKK) beserta sertifikat kompetensinya (SKK). UU 2/2017 Jasa Konstruksi: kewajiban menggunakan TKK bersertifikat untuk jabatan tertentu.

KOMPONEN UTAMA LKUT:
Identitas Proyek: nama, lokasi, nomor kontrak, tanggal mulai & selesai, nilai kontrak.
Rencana Kebutuhan TKK per Jabatan: jabatan kerja (sesuai Kamus KKNI Konstruksi) | jumlah | jenjang SKK (Terampil/Muda/Madya/Utama) | periode dibutuhkan.
Tenaga Kerja Aktual: nama, jabatan, nomor SKK, tanggal expiry SKK, periode kerja di proyek.
Ketimpangan: identifikasi jabatan yang belum ada SKK-nya → rencana perbaikan (rekrut atau kirim pelatihan).

JABATAN WAJIB SKK TERTENTU (Konstruksi Bangunan Gedung):
Site Manager: SKK Ahli Madya Manajemen Pelaksanaan Konstruksi (minimal).
HSE Manager: SKK Ahli Madya K3 Konstruksi (minimal).
Quality Manager: SKK Ahli Muda/Madya Sistem Manajemen Mutu Konstruksi.
Mandor Beton: SKK Pelaksana Madya (Beton/Sipil).
Operator Crane: SKK + SIO Operator Crane (dari Kemnaker).

PELAPORAN LKUT:
LKUT dilaporkan ke PPK/owner sebagai bagian dari dokumen kontrak (saat mobilisasi dan update berkala).
Disnaker setempat: laporan ketenagakerjaan (wajib bagi perusahaan dengan karyawan > tertentu).
Dalam sistem SIMPAN (Sistem Informasi Manajemen Penyelenggaraan AMDA/Konstruksi) jika tersedia.

TIPS PENGISIAN: Gunakan Kamus Jabatan KKNI Konstruksi (SK Dirjen Bina Konstruksi) untuk memastikan nama jabatan sesuai. Simpan fotokopi SKK semua TKK yang bertugas.` },

  { agent_id:882, name:"Inventory Management & Lead-Time Material Konstruksi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.OPERASIONAL_LAPANGAN, source_authority:"PMI-PMBOK7",
    description:"Sistem manajemen inventory material konstruksi: reorder point, safety stock, FIFO, dan optimasi lead time",
    content:`Inventory Management material konstruksi memastikan material tersedia tepat waktu, dalam jumlah yang tepat, tanpa kelebihan stock yang membuang modal kerja.

KONSEP KUNCI INVENTORY KONSTRUKSI:
Lead Time: waktu dari pemesanan sampai material tiba di site. Bervariasi: beton ready-mix 1-2 hari, besi tulangan impor 45-90 hari, MEP spesialis 60-120 hari, material lokal 3-14 hari.
Reorder Point (ROP): level inventory di mana harus memesan lagi. ROP = (Demand Rate × Lead Time) + Safety Stock.
Safety Stock: buffer untuk mengantisipasi variasi demand dan lead time. Safety Stock = Z × σ(demand) × √Lead Time (di mana Z bergantung service level yang diinginkan).
Economic Order Quantity (EOQ): kuantitas pemesanan optimal yang meminimalkan total biaya (ordering cost + holding cost). EOQ = √(2 × D × S / H) di mana D=demand tahunan, S=biaya pesan, H=holding cost per unit.

FIFO (First In First Out) — WAJIB UNTUK MATERIAL KONSTRUKSI:
Material yang pertama masuk HARUS digunakan pertama. Penting untuk: semen (max 3 bulan), cat & sealant (expiry date), material sensitif kelembaban. Penataan gudang: baru masuk di belakang, lama di depan. Label tanggal masuk pada setiap tumpukan/batch.

MATERIAL SCHEDULE (Procurement Schedule):
Untuk setiap work package: identifikasi material kritis → tentukan tanggal butuh di site → kurangi lead time → = tanggal harus order. Buat Procurement Schedule yang diintegrasikan dengan Master Schedule. Review setiap minggu: apakah PO sudah diterbitkan? Apakah delivery on track?

GUDANG MATERIAL SITE:
Zonasi: area baja (terlindung dari hujan), area semen & material sensitif (tertutup, elevasi), area agregat (outdoor OK), area cat & B3 (TPS terpisah), area material reject (karantina). Akses terkontrol: logbuku masuk-keluar. Daily stock opname untuk material kritis.` },

  // ══════════════════════════════════════════════════════════════
  // KPBU SUB-AGEN #884-890
  // ══════════════════════════════════════════════════════════════

  { agent_id:884, name:"KPBU: Identifikasi Proyek & Klasifikasi Sektor",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"KPPIP", source_url:"https://kppip.go.id",
    description:"Kriteria proyek yang cocok untuk KPBU, klasifikasi sektor infrastruktur, dan daftar PSN yang relevan",
    content:`KPBU (Kerjasama Pemerintah dengan Badan Usaha) adalah skema pembiayaan infrastruktur di mana badan usaha swasta membangun, membiayai, dan mengoperasikan infrastruktur publik berdasarkan perjanjian konsesi.

KRITERIA PROYEK LAYAK KPBU:
Infrastruktur yang dapat menghasilkan pendapatan (revenue stream) — tol, pelabuhan, bandara, air minum, pengelolaan limbah, energi terbarukan, RS, perguruan tinggi.
Nilai proyek besar (biasanya > Rp 100 miliar) — agar biaya transaksi KPBU terjustifikasi.
Pemerintah memiliki kemampuan teknis dan regulasi untuk mengatur konsesi.
Ada permintaan (demand) yang cukup untuk menghasilkan pendapatan operator.
Value for Money: KPBU harus menghasilkan nilai lebih dari procurement konvensional.

SEKTOR INFRASTRUKTUR KPBU (PERPRES 38/2015):
Transportasi: jalan tol, jembatan, terowongan, pelabuhan, bandara, perkeretaapian.
Air: sistem penyediaan air minum (SPAM), sistem pengelolaan air limbah (SPALD), drainase.
Energi: pembangkit listrik, transmisi, distribusi (selain existing PLN).
Telekomunikasi: infrastruktur TIK, smart city.
Infrastruktur Sosial: RS, perguruan tinggi, lembaga pemasyarakatan, perumahan PNS.
Lainnya: kawasan industri, kawasan ekonomi khusus, pariwisata.

PROGRAM STRATEGIS NASIONAL (PSN):
Diprioritaskan pemerintah, dapat mengakses fasilitas KPPIP (Komite Percepatan Penyediaan Infrastruktur Prioritas), Penjaminan Infrastruktur Indonesia (PII), Viability Gap Fund (VGF).
Cek daftar PSN terkini di website KPPIP dan Perpres PSN yang diperbarui secara berkala.

PERBEDAAN KPBU vs KONTRAK KONSTRUKSI BIASA:
KPBU: Badan usaha tanggung risiko, biayai sendiri, dapat pendapatan dari pengguna selama konsesi. Konstruksi biasa: owner bayar kontraktor, aset langsung jadi milik pemerintah. KPBU lebih kompleks tapi meringankan beban APBN.` },

  { agent_id:885, name:"OBC & FBC KPBU: Business Case Infrastruktur",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"Bappenas",
    description:"Penyusunan Outline Business Case (OBC) dan Final Business Case (FBC) untuk proyek KPBU sesuai panduan Bappenas",
    content:`OBC (Outline Business Case) dan FBC (Final Business Case) adalah dokumen studi kelayakan KPBU yang menjadi dasar penetapan proyek dan penjajakan minat investor.

OUTLINE BUSINESS CASE (OBC):
Tahap: setelah studi pra-kelayakan, sebelum PPJT (Perjanjian KPBU).
Dokumen yang dikaji: (a) Kajian Kebutuhan (Needs Assessment): konfirmasi kebutuhan infrastruktur, manfaat sosial-ekonomi; (b) Kajian Teknis (Technical Review): opsi-opsi teknis, basic design; (c) Kajian Hukum & Regulasi: payung hukum, kewenangan PJPK (Penanggung Jawab Proyek Kerjasama); (d) Kajian Keuangan Awal: estimasi biaya, tarif/revenue potential, struktur keuangan awal; (e) Kajian Risiko Awal: risk allocation matrix.

FINAL BUSINESS CASE (FBC):
Tahap: sebelum tender KPBU, semua kajian sudah tuntas.
Tambahan dibanding OBC: (a) Studi Kelayakan Finansial: model keuangan detail (IRR, NPV, DSCR, payback period); (b) Kajian Value for Money: bandingkan KPBU vs public procurement konvensional; (c) Kajian Permintaan (Demand Study): proyeksi lalu lintas/pengguna 30 tahun; (d) Dokumen Lingkungan (AMDAL/UKL-UPL); (e) Kajian Sosial: pengadaan lahan, dampak masyarakat; (f) Struktur KPBU: skema konsesi, risiko alokasi final, VGF/penjaminan yang diminta.

VALUE FOR MONEY (VfM) ANALYSIS:
Bandingkan: Present Value of Cost (KPBU) vs Public Sector Comparator (PSC = biaya proyek jika dilaksanakan secara konvensional dengan APBN).
Jika PV-KPBU < PSC → KPBU memberikan VfM yang lebih baik.
Faktor yang dihitung: risk transfer ke swasta, lifecycle cost efficiency, innovation potential.

PERSETUJUAN OBC/FBC: diajukan ke Bappenas untuk proyek nasional, Bappeda untuk proyek daerah. Setelah FBC disetujui → penetapan proyek KPBU → mulai proses pengadaan (tender).` },

  { agent_id:886, name:"Model Keuangan KPBU: IRR, NPV, DSCR, dan VGF",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"DJPPR-Kemenkeu",
    description:"Parameter keuangan kunci model KPBU: IRR equity, DSCR, VGF sizing, dan struktur pembiayaan proyek infrastruktur",
    content:`Model keuangan KPBU adalah core deliverable FBC yang menjadi dasar keputusan investasi dan negosiasi dengan bank/investor.

INDIKATOR KEUANGAN UTAMA KPBU:
IRR (Internal Rate of Return): tingkat pengembalian investasi. Target: IRR Equity ≥ 15-20% (untuk menarik investor swasta). IRR Proyek (sebelum leverage) ≥ WACC proyek.
NPV (Net Present Value): nilai sekarang bersih cash flow selama masa konsesi. NPV > 0 → proyek layak secara finansial.
DSCR (Debt Service Coverage Ratio): kemampuan proyek membayar hutang. DSCR = EBITDA / Debt Service (pokok + bunga). Minimum DSCR ≥ 1.20 untuk project finance. Jika DSCR < 1.20 → proyek butuh VGF atau dukungan pemerintah.
Payback Period: berapa tahun investasi kembali. Target < ½ masa konsesi.

STRUKTUR PEMBIAYAAN KPBU TIPIKAL:
Equity (30%): kontribusi modal sponsor (pemrakarsa/investor). Debt (70%): pinjaman bank (project finance dengan aset proyek sebagai jaminan, bukan balance sheet sponsor). Perbandingan 30:70 (equity:debt) umum untuk infrastruktur.

VIABILITY GAP FUND (VGF):
Dukungan pemerintah berupa hibah (non-hutang) untuk menutupi gap financial proyek KPBU yang viable secara sosial/ekonomi tapi kurang menarik secara finansial. VGF sizing: besar VGF = selisih biaya konstruksi yang tidak dapat dikover pendapatan proyek (tarif yang terjangkau vs biaya yang sebenarnya).
Regulasi VGF: PMK 223/2012 + PMK 265/2015.
Pengajuan VGF: diajukan PJPK ke Kemenkeu → Komite VGF evaluate → persetujuan.

DEMAND RISK & REVENUE RISK:
Revenue proyek KPBU bergantung pada permintaan (pengguna jalan tol, jumlah air terjual, dll.). Revenue risk dapat dibagi: Availability Payment (pemerintah bayar operator berdasarkan ketersediaan aset → tidak ada demand risk untuk swasta), atau User Payment (swasta ambil revenue dari pengguna → ada demand risk). Pilihan skema mempengaruhi bankability dan tarif.` },

  { agent_id:887, name:"Risk Allocation Matrix KPBU: Matriks Risiko Standar",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"KPPIP",
    description:"Matriks alokasi risiko standar KPBU Indonesia per kategori risiko beserta pemegang yang tepat (Pemerintah/BU/Bersama)",
    content:`Risk Allocation Matrix KPBU mendefinisikan pihak mana yang paling efisien menanggung setiap risiko berdasarkan kemampuan kontrol dan mitigasinya. Prinsip: risiko dialokasikan ke pihak yang paling mampu mengelolanya.

PRINSIP ALOKASI RISIKO KPBU:
Risiko yang dikontrol penuh oleh satu pihak → alokasikan ke pihak tersebut.
Risiko yang lebih mudah dimitigasi oleh satu pihak → alokasikan ke pihak tersebut.
Risiko yang tidak dapat dikontrol oleh keduanya (force majeure) → bagi bersama.

MATRIKS RISIKO STANDAR KPBU INDONESIA (Perpres 38/2015 + Panduan KPPIP):

RISIKO KONSTRUKSI: Kenaikan biaya konstruksi → BU (Badan Usaha); Keterlambatan konstruksi → BU; Cacat mutu konstruksi → BU; Kondisi tanah tidak terduga → Bersama (BU tanggung geoteknik normal, Pemerintah tanggung kondisi ekstrim yang tidak dapat diprediksi).

RISIKO OPERASIONAL: Kinerja operasional di bawah standar → BU; Kenaikan O&M cost → BU; Ketersediaan bahan operasional → BU.

RISIKO PENDAPATAN/DEMAND: Permintaan/pengguna di bawah proyeksi → BU (jika user payment) atau Pemerintah (jika availability payment); Kegagalan penagihan → BU.

RISIKO POLITIK & REGULASI: Perubahan kebijakan umum → Bersama; Perubahan kebijakan spesifik proyek yang merugikan BU → Pemerintah (political risk); Perubahan tarif yang ditetapkan pemerintah (tidak mengikuti formula) → Pemerintah.

RISIKO KEUANGAN: Perubahan kurs (valuta asing) → Bersama (BU tanggung operasional, Pemerintah siapkan hedging support); Risiko suku bunga pinjaman → BU; Inflasi → Bersama (disesuaikan tarif).

RISIKO FORCE MAJEURE: Bencana alam, perang, pandemi → Bersama; Kompensasi event force majeure biasanya via Extension of Concession Period (perpanjangan masa konsesi) atau terminasi + kompensasi.

RISIKO PENGADAAN LAHAN: Keterlambatan pengadaan lahan → PEMERINTAH (ini adalah risiko yang sangat sering menyebabkan proyek KPBU terlambat); Biaya pengadaan lahan → Pemerintah.` },

  { agent_id:888, name:"Pengadaan KPBU: Tender, PPJT, dan Negosiasi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"Perpres-38-2015",
    description:"Proses pengadaan KPBU: PQ, RFP, evaluasi penawaran, PPJT, dan financial close",
    content:`Pengadaan KPBU berbeda dari pengadaan barang/jasa biasa — lebih kompleks, melibatkan konsultan transaksi, dan memerlukan waktu 1-3 tahun.

TAHAPAN PENGADAAN KPBU (Perpres 38/2015 + Permenkeu):
1. PENYIAPAN: OBC & FBC → penetapan proyek → penunjukan konsultan transaksi (legal, keuangan, teknis) → dokumen KPBU (RFQ, RFP, Perjanjian KPBU draft).
2. MARKET SOUNDING: presentasi proyek ke calon investor & perbankan → kumpulkan masukan → revisi struktur KPBU jika perlu.
3. PRA-KUALIFIKASI (PQ): kirim RFQ → evaluasi kualifikasi calon badan usaha (legal, finansial, teknis, pengalaman) → umumkan daftar pendek (shortlist, max 5 peserta).
4. REQUEST FOR PROPOSAL (RFP): dokumen RFP + draft PPJT diserahkan ke shortlist → tanya jawab → amendment → submit penawaran teknis & keuangan.
5. EVALUASI & NEGOSIASI: evaluasi teknis → evaluasi finansial (tarif, VGF yang diminta, DSCR) → negosiasi final dengan pemenang sementara → BAFO (Best and Final Offer) → penetapan pemenang.
6. PPJT (Perjanjian KPBU): penandatanganan Perjanjian KPBU → mulai proses perolehan izin & lahan.
7. FINANCIAL CLOSE: pemenang KPBU selesaikan financial arrangements (equity commitment, pinjaman bank) → Financial Close → mulai konstruksi.

DOKUMEN KPBU UTAMA: RFQ, RFP, PPJT (Perjanjian KPBU), Perjanjian Penjaminan (jika ada PII), Akta Pembentukan SPV, Perjanjian Kredit.

POIN KRITIS PPJT: Masa konsesi (duration), Tarif & formula penyesuaian, Dukungan pemerintah (VGF, lahan), Risk allocation, Terminasi & kompensasi, Dispute resolution (BANI / arbitrase internasional).

DURASI PENGADAAN KPBU: rata-rata 18-36 bulan. Penyebab keterlambatan: pengadaan lahan, persetujuan internal pemerintah, due diligence perbankan yang panjang, negosiasi komersial.` },

  { agent_id:889, name:"Dukungan Pemerintah KPBU: VGF, Penjaminan, dan Availability Payment",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.TENDER, source_authority:"Kemenkeu",
    description:"Instrumen dukungan pemerintah untuk proyek KPBU: VGF, penjaminan PII, availability payment, dan dukungan langsung lainnya",
    content:`Dukungan Pemerintah KPBU tersedia dalam berbagai bentuk untuk meningkatkan bankability proyek dan menarik investor.

JENIS DUKUNGAN PEMERINTAH KPBU:

1. VGF (VIABILITY GAP FUND): hibah pemerintah untuk menutup gap finansial proyek. Cocok untuk: proyek yang viable secara ekonomi/sosial tapi IRR lebih rendah dari hurdle rate investor. Regulasi: PMK 223/2012 + PMK 265/2015. Max VGF: 49% biaya konstruksi (sisanya 51% dari investasi swasta). Proses: PJPK ajukan ke Kemenkeu → evaluasi VfM → persetujuan DPR (jika perlu) → PPJT ditandatangani.

2. PENJAMINAN INFRASTRUKTUR (Penjaminan Indonesia Infrastructure/PII): PT PII (BUMN) menyediakan penjaminan untuk mitigasi risiko politik/regulasi yang ditanggung pemerintah. Manfaat: meningkatkan credit rating proyek → bunga pinjaman lebih rendah → proyek lebih viable. Biaya: BU membayar premi penjaminan ke PII.

3. AVAILABILITY PAYMENT (AP): pemerintah membayar BU berdasarkan ketersediaan & kinerja aset (bukan jumlah pengguna). Cocok untuk: infrastruktur sosial (RS, penjara, sekolah) di mana tarif pengguna tidak dapat menutupi biaya. Keuntungan BU: tidak ada demand risk → bankability lebih tinggi. Keuntungan pemerintah: aset terbangun tanpa pembayaran awal besar.

4. DUKUNGAN PENYIAPAN: Bappenas & KPPIP dapat membiayai penyusunan OBC/FBC untuk proyek strategis → mengurangi biaya PJPK.

5. PENGADAAN LAHAN: Pemerintah bertanggung jawab pengadaan lahan (UU 2/2012 Pengadaan Lahan) dan menyerahkan lahan bebas sebelum Financial Close. Keterlambatan lahan = risiko pemerintah dalam PPJT.

PEMILIHAN INSTRUMEN: VGF cocok jika gap finansial jelas terukur. AP cocok jika demand tidak pasti. Penjaminan cocok jika risiko politik/regulasi tinggi. Kombinasi mungkin diperlukan untuk proyek kompleks.` },

  { agent_id:890, name:"Manajemen Kontrak & Siklus Hidup Konsesi KPBU",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"Perpres-38-2015",
    description:"Administrasi PPJT selama periode konstruksi hingga akhir konsesi: monitoring, step-in rights, review tarif, dan transfer aset",
    content:`Manajemen kontrak KPBU (PPJT) berlangsung sepanjang masa konsesi — bisa 15-50 tahun. PJPK harus punya kapasitas untuk mengadministrasi PPJT selama periode yang sangat panjang ini.

FASE-FASE KPBU DAN KEGIATAN ADMINISTRASI:

FASE KONSTRUKSI (2-7 tahun):
• Monitoring progress konstruksi vs jadwal dalam PPJT.
• Verifikasi biaya konstruksi aktual vs yang dijanjikan.
• Approval milestone pembayaran VGF (jika ada).
• Koordinasi pengadaan lahan yang tersisa.
• Review dan approval perubahan desain material (jika BU minta).
• Commissioning & hand-over ke fase operasi.

FASE OPERASI (hingga akhir konsesi):
• Monitoring Key Performance Indicators (KPI) layanan: ketersediaan, waktu respons, kualitas layanan.
• Review laporan keuangan BU tahunan (PJPK berhak audit).
• Adjustment tarif: implementasi formula penyesuaian tarif sesuai PPJT (biasanya tahunan berdasarkan inflasi CPI).
• Availability Payment: verifikasi KPI tercapai → otorisasi pembayaran AP ke BU.
• Event Force Majeure: proses sesuai klausul PPJT (perpanjangan konsesi vs terminasi).

STEP-IN RIGHTS:
Hak bank (kreditur) untuk mengambil alih manajemen BU jika BU wanprestasi (gagal bayar hutang) — agar proyek dapat dilanjutkan dan kreditur dapat melindungi investasinya.

TERMINASI PPJT:
By Default BU: PJPK ambil alih aset + kompensasi sesuai PPJT (biasanya: outstanding debt - VGF yang diterima).
By Default Pemerintah: BU berhak kompensasi penuh (outstanding debt + equity invested + lost profit).
By Force Majeure: kompensasi sesuai klausul PPJT.

TRANSFER ASET AKHIR KONSESI: Aset ditransfer ke pemerintah dalam kondisi sesuai standar yang ditetapkan PPJT (Asset Hand-Back Requirements). BU wajib melakukan rehabilitasi aset sebelum transfer jika kondisi tidak memenuhi standard.` },

  // ══════════════════════════════════════════════════════════════
  // RISK REGISTER BOT SUB-AGEN #850-853
  // ══════════════════════════════════════════════════════════════

  { agent_id:850, name:"Risk Register Teknis Konstruksi: Identifikasi & Mitigasi",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PERENCANAAN_EKSEKUSI, source_authority:"PMI-PMBOK7",
    description:"Database risiko teknis konstruksi yang umum terjadi beserta probabilitas, dampak, dan strategi mitigasi terstruktur",
    content:`Risk Register Teknis mencakup risiko yang berkaitan dengan aspek engineering, desain, kondisi lapangan, dan pelaksanaan konstruksi.

TOP RISIKO TEKNIS KONSTRUKSI — DATABASE:

R-T01: Kondisi Tanah Tidak Sesuai DED/Soil Investigation
P=3, I=5, Score=15 (HIGH). Dampak: biaya pondasi membengkak 20-50%, delay 30-90 hari. Trigger: hasil bor lapangan berbeda signifikan dari SI awal. Mitigasi: lakukan SI tambahan di area kritis sebelum tender; buffer geoteknik dalam contingency. Respons jika terjadi: klaim FIDIC 4.12 (Unforeseeable Physical Conditions), ajukan VO untuk biaya pondasi tambahan.

R-T02: Desain Berubah Mid-Project (Design Change)
P=4, I=4, Score=16 (HIGH). Dampak: rework, material reject, delay 2-8 minggu per event. Trigger: revisi gambar arsitektur/struktur setelah konstruksi dimulai. Mitigasi: freeze desain sebelum tender; design review intensif sebelum mobilisasi. Respons: dokumentasikan semua perubahan, terbitkan NOC, track impact ke schedule & cost.

R-T03: Ketersediaan Material Kritis Terbatas
P=3, I=4, Score=12 (MEDIUM). Dampak: delay 2-4 minggu, kenaikan harga. Trigger: shortage baja, beton precast, material MEP spesialis. Mitigasi: order material kritis 2-3 bulan di muka, identifikasi supplier alternatif, pertimbangkan buffer stock.

R-T04: Produktivitas Tenaga Kerja Rendah (Learning Curve)
P=3, I=3, Score=9 (MEDIUM). Dampak: schedule slip 5-15%, cost overrun 3-8%. Trigger: kurangnya tenaga terampil, pergantian mandor, metode pekerjaan baru. Mitigasi: pre-qualification tenaga kerja, training on-the-job, metode konstruksi familiar diprioritaskan.

R-T05: Interferensi Utilitas Eksisting
P=3, I=4, Score=12 (MEDIUM). Dampak: perbaikan utilitas Rp50-500 juta, delay 1-3 minggu. Trigger: underground utilities yang tidak terpetakan. Mitigasi: survey utilitas sebelum galian (GPR scanning), koordinasi PLN/PDAM/Telkom, izin galian.

R-T06: Cuaca Ekstrim (Hujan Terus, Banjir)
P=4, I=3, Score=12 (MEDIUM). Dampak: suspend pekerjaan outdoor, productivity -30-50%. Trigger: curah hujan > 50mm/hari atau banjir. Mitigasi: jadwal pekerjaan outdoor di musim kering, siapkan proteksi hujan (tenda), drainase site, stockpile material mudah rusak.` },

  { agent_id:851, name:"Risk Register K3: Risiko Keselamatan & Penilaian Residual",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.SMK3, source_authority:"ISO-45001",
    description:"Database risiko K3 konstruksi berbasis HIRADC: risiko awal, pengendalian HoC, dan risiko residual untuk tracking",
    content:`Risk Register K3 adalah komponen wajib RMPK dan RKK. Setiap risiko K3 harus tercatat dengan risiko awal, pengendalian yang diterapkan, dan risiko residual yang tersisa.

DATABASE RISIKO K3 KONSTRUKSI — TOP 10:

RK-01: Jatuh dari Ketinggian (Working at Height ≥ 1.8m)
Risk Awal: L=4, C=5 = 20 (EKSTRIM). Pengendalian HoC: Engineering — scaffold ber-tag hijau, guardrail 1.0m + mid-rail 0.5m, toeboard, netting; Administrative — PTW Height, JSA daily, TBM; PPE — full body harness double lanyard, helmet, safety shoes. Risk Residual: L=2, C=4 = 8 (SEDANG).

RK-02: Tertimpa Beban Lifting (Lifting Operation ≥ 5T)
Risk Awal: L=3, C=5 = 15 (TINGGI). Pengendalian: Engineering — lift plan, barricade exclusion zone; Administrative — PTW Lifting, SIA crane valid, SIO operator, rigger bersertifikat, signaler; PPE — helm, rompi. Risk Residual: L=1, C=4 = 4 (RENDAH).

RK-03: Runtuh Dinding Galian (Excavation > 1.5m)
Risk Awal: L=3, C=5 = 15 (TINGGI). Pengendalian: Engineering — shoring/soldier pile; Administrative — PTW Excavation, tidak ada pekerja di bawah swing alat, tangga setiap 7.5m; PPE — helm, sepatu. Risk Residual: L=1, C=4 = 4 (RENDAH).

RK-04: Kebakaran (Hot Work Area)
Risk Awal: L=3, C=4 = 12 (TINGGI). Pengendalian: Engineering — APAR di dekat area, fire watch; Administrative — Hot Work Permit, remove combustibles, fire watch 30 menit setelah selesai; PPE — apron las, kacamata, sarung tangan. Risk Residual: L=1, C=3 = 3 (RENDAH).

RK-05: Tersengat Listrik (Temporary Electrical)
Risk Awal: L=3, C=5 = 15 (TINGGI). Pengendalian: Engineering — ELCB/RCCB dipasang, kabel berselubung, grounding, lockout-tagout; Administrative — inspeksi mingguan panel & kabel, hanya electrician bersertifikat; PPE — gloves insulated, safety shoes. Risk Residual: L=1, C=4 = 4 (RENDAH).

RK-06: Paparan Debu & Kebisingan Kronis
Risk Awal: L=4, C=3 = 12 (TINGGI). Pengendalian: Engineering — wet cutting, dust suppression; Administrative — rotasi pekerja, batas 8 jam; PPE — masker P100, ear plug/muff. Risk Residual: L=2, C=2 = 4 (RENDAH).

MONITORING: Risk register K3 di-review setiap minggu dalam Safety Meeting. Risiko yang residual score > 8 diprioritaskan untuk tindak lanjut tambahan.` },

  { agent_id:852, name:"Risk Register Legal & Kontrak: Klaim, LD, dan Sengketa",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.KONTRAK_PERJANJIAN, source_authority:"FIDIC",
    description:"Database risiko legal dan kontrak konstruksi: klaim EOT ditolak, LD, terminasi, dan strategi mitigasinya",
    content:`Risk Register Legal & Kontrak mencakup risiko yang berkaitan dengan pelaksanaan kontrak, klaim, dan sengketa hukum.

DATABASE RISIKO LEGAL & KONTRAK:

RL-01: Klaim EOT Ditolak oleh Engineer/PPK
P=3, I=4, Score=12 (MEDIUM). Dampak: LD dikenakan, biaya prolongasi tidak dikompensasi. Trigger: Notice of Claim terlambat (>28 hari), dokumentasi tidak cukup, concurrent delay. Mitigasi: pantau 28-day clock setiap event, kirim NOC bahkan jika impact belum pasti, dokumentasikan semua kejadian harian. Respons: eskalasi ke DAB/arbitrase dengan bukti TIA dan catatan kontemporer.

RL-02: Liquidated Damages (LD) Dikenakan
P=3, I=4, Score=12 (MEDIUM). Dampak: potongan dari payment = LD rate (Rp/hari) × hari terlambat. Max LD biasanya 5-10% nilai kontrak. Trigger: completion date terlampaui tanpa approved EOT. Mitigasi: early warning system jadwal (SPI monitoring), acceleration plan saat SPI < 0.95, ajukan EOT dengan TIA yang kuat.

RL-03: Dispute dengan Owner yang Berlarut
P=2, I=5, Score=10 (MEDIUM). Dampak: cash flow terganggu, proyek terhenti, legal cost tinggi. Trigger: klaim tidak dibayar, VO ditolak, termination. Mitigasi: dokumentasi kuat, eskalasi bertahap (negosiasi → Engineer → DAB), jangan eskalasi terlalu cepat ke arbitrase.

RL-04: Terminasi Kontrak oleh Owner
P=1, I=5, Score=5 (LOW tapi Monitor Ketat). Dampak: reputasi, kehilangan profit, gugatan balik. Trigger: gagal bayar subkon, progress jauh di bawah target, pelanggaran K3 serius, korupsi. Mitigasi: pertahankan progress sesuai jadwal, K3 compliance, laporan transparan, jangan sembunyikan masalah.

RL-05: Subkon Wanprestasi + Klaim ke Kontraktor Utama
P=2, I=4, Score=8 (MEDIUM). Dampak: delay, biaya additional untuk penggantian subkon. Trigger: subkon bangkrut, quality buruk, mangkir. Mitigasi: payment bond subkon, advance max 20%, kontrak back-to-back, evaluasi kinerja bulanan, siapkan replacement vendor dari AVL.

RL-06: Perubahan Regulasi yang Mempengaruhi Proyek
P=2, I=3, Score=6 (LOW). Dampak: biaya compliance tambahan, perubahan metode. Trigger: perubahan SNI, Permen PUPR, peraturan lingkungan. Mitigasi: monitor regulasi aktif, klausul adjustment di kontrak (FIDIC 13.7 Changes in Legislation). Respons: klaim FIDIC 13.7 untuk biaya tambahan akibat perubahan regulasi.` },

  { agent_id:853, name:"Risk Register Keuangan: Cashflow, Inflasi, dan Risiko Finansial",
    type:"operational", knowledge_layer:"operational",
    taxonomy_id:TAX.PENGENDALIAN, source_authority:"PMI-PMBOK7",
    description:"Database risiko keuangan proyek konstruksi: cash flow, inflasi material, kurs, dan strategi mitigasi finansial",
    content:`Risk Register Keuangan mencakup risiko yang berkaitan dengan pembiayaan proyek, arus kas, perubahan harga, dan kestabilan finansial entitas yang terlibat.

DATABASE RISIKO KEUANGAN:

RF-01: Cash Flow Deficiency (Kekurangan Modal Kerja)
P=3, I=4, Score=12 (MEDIUM). Dampak: tidak bisa bayar subkon/supplier tepat waktu → chain delay; risk gagal bayar. Trigger: termin dari owner terlambat, cost overrun, advance habis. Mitigasi: cash flow forecast bulanan, siapkan kredit bank (KIK), negosiasi advance dari owner, payment terms subkon lebih panjang.

RF-02: Inflasi Material > 10% Selama Proyek
P=3, I=4, Score=12 (MEDIUM). Dampak: cost overrun 5-20% tergantung komponen biaya material. Trigger: kenaikan harga baja, semen, bahan bakar. Mitigasi: lock harga dengan PO awal untuk material kritis; klausul eskalasi harga di kontrak utama (jika tersedia); pertimbangkan forward buying.

RF-03: Keterlambatan Pembayaran Termin oleh Owner
P=3, I=3, Score=9 (MEDIUM). Dampak: cash gap, biaya bunga tambahan, ketegangan hubungan owner-kontraktor. Trigger: administrasi PPK terlambat, masalah anggaran APBN/APBD, dispute progress measurement. Mitigasi: submit termin tepat waktu dengan dokumen lengkap, follow up formal jika payment > 14 hari dari jatuh tempo, tambahkan biaya bunga keterlambatan dalam klaim (FIDIC 14.8).

RF-04: Biaya Over Run Melebihi Contingency Reserve
P=2, I=4, Score=8 (MEDIUM). Dampak: margin negatif, potensi rugi proyek. Trigger: multiple risk events terjadi bersamaan, contingency under-estimated. Mitigasi: EVM monitoring ketat (alert jika CPI < 0.95), eskalasi early ke manajemen, cari efisiensi biaya alternatif, pertimbangkan klaim VO yang tertunda.

RF-05: Kurs Valuta Asing Naik > 10% (untuk Material Impor)
P=3, I=3, Score=9 (MEDIUM). Dampak: cost material impor naik signifikan. Trigger: depresiasi Rupiah. Mitigasi: identifikasi komponen impor sejak dini; pertimbangkan forward contract kurs; percepat pembelian material impor saat kurs menguntungkan; cari alternatif material lokal.

RF-06: Subkontraktor Utama Bangkrut
P=2, I=5, Score=10 (MEDIUM-HIGH). Dampak: delay 30-90 hari untuk replacement, biaya mobilisasi ulang. Trigger: kondisi keuangan subkon buruk, kurang modal. Mitigasi: tidak bayar advance > 20%, progress payment ketat, evaluasi keuangan subkon saat PQ, payment bond subkon.

MONITORING KPI KEUANGAN: CPI (EVM) mingguan; Cash flow actuals vs forecast bulanan; Subkon payment aging (alert jika > 45 hari); Inflasi material kritis bulanan.` },

];

async function main() {
  const client = await pool.connect();
  try {
    const agentIds = [...new Set(KB.map(e => e.agent_id))];
    const { rows: existing } = await client.query(
      `SELECT agent_id, name FROM knowledge_bases WHERE agent_id = ANY($1::int[])`,
      [agentIds]
    );
    const existingSet = new Set(existing.map((r: any) => `${r.agent_id}::${r.name}`));
    const toInsert = KB.filter(e => !existingSet.has(`${e.agent_id}::${e.name}`));

    console.log(`\n📚 KB Batch 4: ${toInsert.length} entries baru untuk ${agentIds.length} agen\n`);
    if (toInsert.length === 0) { console.log("✅ Sudah semua ada."); return; }

    const inserted: { id:number; agent_id:number; name:string; content:string }[] = [];
    for (const e of toInsert) {
      const { rows } = await client.query(`
        INSERT INTO knowledge_bases (
          agent_id, name, type, knowledge_layer, content, description,
          taxonomy_id, source_authority, source_url, status, is_shared
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',false)
        RETURNING id
      `, [e.agent_id, e.name, e.type, e.knowledge_layer, e.content, e.description,
          e.taxonomy_id, e.source_authority, e.source_url || null]);
      inserted.push({ id: rows[0].id, agent_id: e.agent_id, name: e.name, content: e.content });
      console.log(`  ✅ #${e.agent_id} — ${e.name.substring(0,65)}`);
    }

    // Chunks
    const chunkRows: any[] = [];
    for (const kb of inserted) {
      chunkText(kb.content).forEach((chunk, idx) => {
        chunkRows.push({ kb_id:kb.id, agent_id:kb.agent_id, chunk_index:idx,
          content:chunk, token_count:est(chunk), src:kb.name });
      });
    }
    if (chunkRows.length) {
      const vals: any[] = [], phs: string[] = []; let p = 1;
      for (const c of chunkRows) {
        phs.push(`($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},NOW())`);
        vals.push(c.kb_id, c.agent_id, c.chunk_index, c.content, c.token_count,
          JSON.stringify({ sourceName: c.src }));
      }
      await client.query(
        `INSERT INTO knowledge_chunks (knowledge_base_id,agent_id,chunk_index,content,token_count,metadata,created_at) VALUES ${phs.join(",")}`,
        vals
      );
    }

    await client.query(
      `UPDATE agents SET rag_enabled=true, rag_chunk_size=512, rag_chunk_overlap=64, rag_top_k=5 WHERE id = ANY($1::int[])`,
      [agentIds]
    );

    const { rows: totals } = await client.query(
      `SELECT (SELECT COUNT(*) FROM knowledge_bases) as kb, (SELECT COUNT(*) FROM knowledge_chunks) as chunks`
    );
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("✅ SELESAI — KB Batch 4 (PROXIMA, Keuangan, MRP-A, KPBU, Risk)");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`KB entries ditambahkan  : ${inserted.length}`);
    console.log(`Chunks dibuat           : ${chunkRows.length}`);
    console.log(`Total KB platform       : ${totals[0].kb}`);
    console.log(`Total Chunks platform   : ${totals[0].chunks}`);
    console.log("═══════════════════════════════════════════════════════════\n");

  } finally { client.release(); await pool.end(); }
}
main().catch(e => { console.error(e); process.exit(1); });
