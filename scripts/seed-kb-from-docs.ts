/**
 * Seed KB dari 5 dokumen knowledge base KONSTRA:
 *   1. KB-RKK            → AGENT-SAFIRA #926, AGENT-HIRADC #927, AGENT-SMKK #930
 *   2. KB-FIDIC/KONTRAK  → KontrakBot #860, AGENT-FIDIC #861, AGENT-KLAIM-DISPUTE #864
 *   3. KB-EVM            → PROXIMA #891, AGENT-COST #895, AB-03 EVM #905, Cash Flow #844
 *   4. Kalkulator EOT    → AGENT-FIDIC #861, AGENT-KLAIM-DISPUTE #864, AGENT-SCHEDULE #894
 *   5. Kalkulator OEE    → AGENT-EQUIPRA #944, AGENT-OEE #946
 *   6. Kalkulator PPh    → AGENT-PPH-KONSTRUKSI #841, AB-04 Tax #906
 *
 * Idempotent: skip jika KB dengan nama yang sama sudah ada di agent tersebut.
 */
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function est(text: string) { return Math.ceil(text.length / 4); }

function chunkText(text: string, size = 512, overlap = 64): string[] {
  if (!text?.trim()) return [];
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const sents = clean.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = [];
  let cur = "", curTok = 0;
  for (const s of sents) {
    const st = est(s);
    if (curTok + st > size && cur) {
      chunks.push(cur.trim());
      const words = cur.split(/\s+/);
      cur = words.slice(-Math.ceil(overlap / 4)).join(" ") + " " + s;
      curTok = est(cur);
    } else { cur += (cur ? " " : "") + s; curTok += st; }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

const TAX = {
  PELAKSANAAN: 26, SISTEM_MANAJEMEN: 36,
  PERENCANAAN_EKSEKUSI: 27, OPERASIONAL_LAPANGAN: 28, PENGENDALIAN: 29,
  ISO9001: 37, SMK3: 39,
  KONTRAK_PERJANJIAN: 2, TATA_KELOLA: 31,
};

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

  // ══════════════════════════════════════════════════════════════════════════
  // 1. KB-RKK (Permen PUPR 8/2023) — 3 agen: #926 SAFIRA, #927 HIRADC, #930 SMKK
  // ══════════════════════════════════════════════════════════════════════════

  { agent_id: 926, name: "KB-RKK: Struktur Wajib RKK Pelaksanaan Permen PUPR 8/2023",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.SMK3, source_authority: "PUPR", source_url: "https://jdih.pu.go.id",
    description: "Struktur lengkap Rencana Keselamatan Konstruksi (RKK) Pelaksanaan sesuai Lampiran Permen PUPR 8/2023",
    content: `RKK (Rencana Keselamatan Konstruksi) Pelaksanaan adalah dokumen utama SMKK yang wajib disusun kontraktor BUJK sebelum mobilisasi dan di-update per milestone proyek. Dasar hukum: UU 2/2017 Pasal 59 (K4), PP 14/2021 Pasal 84–86 (SMKK), Permen PUPR 8/2023, PP 50/2012 (SMK3), UU 1/1970, ISO 45001:2018.

Tipe RKK: (1) RKK Pengkajian — studi kelayakan, oleh konsultan; (2) RKK Perancangan — DED, oleh konsultan perencana; (3) RKK Penawaran — dokumen tender ringkas; (4) RKK Pelaksanaan — mobilisasi & eksekusi, oleh kontraktor (dokumen utama); (5) RKK Pengawasan — audit & verifikasi, oleh MK.

Struktur RKK Pelaksanaan — 5 Bab:
BAB A. Kepemimpinan & Partisipasi Pekerja: A.1 Kebijakan K3 (ditandatangani Direktur BUJK); A.2 Organisasi P2K3 proyek (struktur, tugas, kewenangan); A.3 Kompetensi — matriks SKK Ahli K3 Muda/Madya/Utama sesuai risiko; A.4 Komitmen biaya K3 (minimal 1.5–2.5% nilai kontrak).
BAB B. Perencanaan: B.1 HIRA/IBPRP (seluruh aktivitas); B.2 Sasaran & program K3 SMART; B.3 Standar & peraturan per aktivitas.
BAB C. Dukungan: C.1 Sumber daya (Ahli K3, APD, fasilitas medis); C.2 Kompetensi personel (sertifikat operator, K3 berjenjang); C.3 Komunikasi K3 (toolbox, induction, signage); C.4 Informasi terdokumentasi (SOP, JSA, PTW log).
BAB D. Operasi: D.1 JSA per aktivitas; D.2 PTW — height, hot work, confined space, lifting, electrical, excavation; D.3 Tanggap darurat ERP; D.4 Investigasi insiden (5-Why + Fishbone + Bow-Tie).
BAB E. Evaluasi: E.1 Pemantauan leading & lagging indicators; E.2 Tinjauan manajemen (bulanan & per milestone); E.3 Audit internal.

Biaya SMKK minimum: 1.5–2.5% nilai kontrak (bangunan gedung normal); lebih tinggi untuk high-rise, bendungan, terowongan. Komponen: Personel K3, APD, fasilitas P3K/ambulan, rambu & barikade, alat pengukur lingkungan, sosialisasi & pelatihan, asuransi BPJSTK, audit & dokumentasi SMK3/SMKK.` },

  { agent_id: 926, name: "KB-RKK: Workflow Harian K3 dan Klasifikasi Insiden",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.SMK3, source_authority: "PUPR",
    description: "Workflow operasional harian K3 (induction→TBM→JSA→PTW→close) dan tabel klasifikasi/pelaporan insiden",
    content: `Workflow Operasional Harian K3 Konstruksi:
Safety Induction (pekerja baru) → Toolbox Meeting 06:30 (seluruh pekerja, max 15 menit) → JSA refresh per aktivitas → PTW diterbitkan jika risiko tinggi → Pelaksanaan + inspeksi rutin → PTW close-out akhir shift → Daily HSE Report.

Toolbox meeting wajib: dokumentasi absensi, topik safety, isu K3 terkini. JSA ditinjau ulang setiap kali ada perubahan kondisi, metode, atau personel baru. PTW untuk: pekerjaan ketinggian ≥ 1.8m, hot work, confined space entry, lifting ≥ 5T, electrical isolation, excavation > 1.5m.

Klasifikasi & Pelaporan Insiden:
• Near-miss: hampir kecelakaan tanpa cedera → lapor Internal HSE dalam 24 jam.
• First-aid: cedera ringan, P3K cukup → lapor Internal HSE dalam 24 jam.
• Medical Treatment: perlu perawatan medis di luar P3K → lapor Internal + Owner dalam 24 jam.
• LTI (Lost Time Injury): kehilangan hari kerja ≥ 1 hari → lapor Internal + Owner + Disnaker dalam 2×24 jam (Permenaker 03/1998).
• Fatality: korban jiwa → lapor Polisi + Disnaker + KemenPUPR + Direksi SEGERA; investigasi 30 hari.

Investigasi insiden: amankan TKP → P3K → notifikasi manajemen & P2K3 → kumpul bukti & wawancara saksi → rekonstruksi kronologi → RCA (5-Why + Fishbone + Bow-Tie) → CAPA → laporan resmi. Rekaman disimpan minimal 5 tahun.

Audit & Sertifikasi: Audit internal SMK3/SMKK triwulanan oleh P2K3. Audit eksternal oleh PJK3 (Sucofindo/SAI Global/TUV/Bureau Veritas). Tingkat sertifikasi: Awal (60–84%) → Transisi → Lanjutan (≥ 85%). ISO 45001:2018 sering disyaratkan tender besar.` },

  { agent_id: 927, name: "KB-RKK: HIRA/IBPRP Format & Hierarchy of Control",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.SMK3, source_authority: "ISO-45001",
    description: "Format standar HIRA/IBPRP Permen PUPR 8/2023 dengan contoh pekerjaan ketinggian dan lifting, plus Hierarchy of Control lengkap",
    content: `HIRA/IBPRP (Hazard Identification, Risk Assessment, Risk Priority) adalah komponen utama Bab B RKK Pelaksanaan. Setiap aktivitas pekerjaan harus memiliki baris HIRA dengan kolom: Aktivitas | Bahaya | Risk Awal (LxC) | Pengendalian (HoC) | Risk Sisa (LxC) | PIC.

Contoh HIRA Pekerjaan Ketinggian ≥ 1.8m:
• Bahaya: Jatuh dari ketinggian → fatal. Risk awal: L=4 × C=5 = 20 (EKSTRIM).
• Pengendalian Hierarchy of Control: 1. Eliminasi — tidak memungkinkan; 2. Engineering — pasang scaffold ber-tag hijau; 3. Administrative — PTW + JSA + TBM; 4. PPE — full body harness ganda, helm, safety shoes.
• Risk sisa: L=2 × C=4 = 8 (SEDANG). PIC: HSE Officer + Site Manager.

Contoh HIRA Lifting Alat Berat ≥ 5T:
• Bahaya: Tertimpa beban → fatal/cacat permanen. Risk awal: L=3 × C=5 = 15 (TINGGI).
• Pengendalian: 1. PTW Lifting; 2. Sertifikat SIO operator valid (Gol I/II/III); 3. Lift plan tertulis & barricade exclusion zone; 4. Signaler bersertifikat (rigger).
• Risk sisa: L=1 × C=4 = 4 (RENDAH). PIC: Rigger + HSE Officer.

Hierarchy of Control (HoC) — urutan prioritas:
1. ELIMINASI: hilangkan bahaya sepenuhnya (paling efektif)
2. SUBSTITUSI: ganti dengan yang lebih aman
3. ENGINEERING CONTROL: rekayasa teknis (guardrail, ventilasi, interlock)
4. ADMINISTRATIVE: prosedur, PTW, JSA, rotasi, pelatihan
5. PPE (Personal Protective Equipment): perlindungan terakhir, paling lemah

Matriks Risiko 5×5: Likelihood (L) 1-5 × Consequence (C) 1-5:
• 1-4: LOW (Monitor)
• 5-9: MEDIUM (Action Plan)
• 10-16: HIGH (Corrective Action)
• 17-25: CRITICAL / EKSTRIM (STOP WORK, segera tangani)

IBPRP harus mencakup SELURUH aktivitas proyek dan diperbarui: saat scope berubah, pasca insiden, ada metode/alat baru. IBPRP dikomunikasikan ke seluruh pekerja via toolbox meeting.` },

  { agent_id: 930, name: "KB-RKK: Template Lengkap RKK Pelaksanaan Siap Pakai",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.SMK3, source_authority: "PUPR", source_url: "https://jdih.pu.go.id",
    description: "Template isi wajib RKK Pelaksanaan per bab sesuai Lampiran Permen PUPR 8/2023 untuk drafting cepat",
    content: `Template RKK Pelaksanaan — Isi Wajib Per Bab (Permen PUPR 8/2023):

BAB A — KEPEMIMPINAN & PARTISIPASI PEKERJA:
A.1 Kebijakan K3: Pernyataan tertulis ditandatangani Direktur BUJK; mencakup komitmen pencegahan cedera & penyakit akibat kerja, pemenuhan peraturan K3, perbaikan berkelanjutan; dipasang di kantor proyek & area kerja.
A.2 Organisasi P2K3: Bagan struktur (Project Manager → HSE Manager → HSE Officer → HSE Inspector); deskripsi tugas setiap jabatan; kewenangan stop work; waktu respons insiden.
A.3 Matriks Kompetensi: Jabatan × Sertifikat (SIO Operator, SKK Ahli K3 Muda/Madya/Utama, P3K, SKPK); jumlah sesuai nilai & risiko proyek. Risiko tinggi (>100 orang atau nilai>Rp50M): wajib Ahli K3 Konstruksi Madya. Risiko sangat tinggi: wajib Ahli K3 Utama.
A.4 Komitmen Biaya K3: Rincian anggaran K3 (APD, fasilitas, pelatihan, asuransi, audit); minimum 1.5–2.5% nilai kontrak; disertakan dalam RAB.

BAB B — PERENCANAAN:
B.1 IBPRP/HIRA: Tabel seluruh aktivitas dengan bahaya, risiko awal, pengendalian HoC, risiko sisa, PIC.
B.2 Sasaran & Program: Target LAR=0 (Lost Time Rate), SR=0 (Severity Rate), audit internal 4x/tahun; program toolbox harian, inspeksi mingguan, drill kuartalan.
B.3 Regulasi yang Diacu: Daftar UU, PP, Permen, SNI yang berlaku per aktivitas.

BAB C — DUKUNGAN: Daftar APD per aktivitas; layout fasilitas medis; jadwal safety induction & toolbox; prosedur penerbitan & arsip PTW; daftar SOP operasional.

BAB D — OPERASI: JSA per paket pekerjaan; matriks PTW (jenis, kapan, siapa yang approve, arsip); ERP (skenario kebakaran, evakuasi, medical, environmental spill); prosedur investigasi insiden.

BAB E — EVALUASI: Leading indicators (% TBM dilaksanakan, % PTW closed tepat waktu, jumlah inspeksi). Lagging indicators (LTIFR, TRIFR, fatality). Jadwal tinjauan manajemen; jadwal audit internal. Template laporan K3 bulanan ke PPK.` },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. KB-FIDIC & KB-KONTRAK — #860 KontrakBot, #861 AGENT-FIDIC, #864 AGENT-KLAIM-DISPUTE
  // ══════════════════════════════════════════════════════════════════════════

  { agent_id: 861, name: "KB-FIDIC: Klausul Kunci Red Book 2017 — Tabel Lengkap",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.KONTRAK_PERJANJIAN, source_authority: "FIDIC",
    description: "Tabel referensi cepat klausul kunci FIDIC Red Book 2017 beserta catatan praktis implementasinya",
    content: `FIDIC 2017 memiliki 3 buku utama: Red Book (Owner-design, risiko desain pada Owner), Yellow Book (Plant & Design-Build, risiko desain pada Kontraktor), Silver Book (EPC/Turnkey, risiko desain penuh pada Kontraktor).

Klausul Kunci FIDIC Red Book 2017:
• Sub-Clause 1.3 — Notices and Communications: bentuk resmi tertulis, tertanggal, alamat sesuai SCC. Semua klaim, notice, approval harus via mekanisme ini.
• Sub-Clause 3.7 — Engineer's Determination: keputusan Engineer atas dispute teknis sebelum eskalasi DAB; mengikat sementara.
• Sub-Clause 4.12 — Unforeseeable Physical Conditions: klaim kontraktor atas kondisi tanah/lingkungan di luar prediksi; wajib notice segera saat ditemukan.
• Sub-Clause 8.4 — Advance Warning: kewajiban kontraktor melaporkan event yang berpotensi delay atau cost impact.
• Sub-Clause 8.5 — Extension of Time (EOT): penyebab EOT yang diakui — Owner delay, force majeure, cuaca ekstrim tak terduga, instructed Variation.
• Sub-Clause 8.8 — Delay Damages (LD): Liquidated Damages — cap & daily rate ditetapkan di SCC.
• Sub-Clause 10 — Taking Over: mekanisme PHO / Taking-Over Certificate (ToC).
• Sub-Clause 11 — Defects after Taking Over: Defect Notification Period (DNP) default 365 hari + Performance Certificate (final release).
• Sub-Clause 13 — Variations: VO mechanism, value engineering, adjustment perubahan regulasi; VE sharing savings antara Owner & Kontraktor.
• Sub-Clause 14 — Payment: termin, retensi (biasanya 5-10%), advance payment, Final Statement.
• Sub-Clause 15 — Termination by Employer: for Default (kegagalan kontraktor) & for Convenience (tanpa alasan, kontraktor berhak kompensasi).
• Sub-Clause 16 — Suspension & Termination by Contractor: hak kontraktor jika Owner tidak bayar atau suspend pekerjaan >84 hari.
• Sub-Clause 17 — Care of Works: tanggung jawab atas kerusakan & indemnification.
• Sub-Clause 18 — Exceptional Events (Force Majeure): perang, bencana, pandemi, regulasi baru; force majeure → EOT + cost (tertentu), bukan profit.
• Sub-Clause 19 — Insurance: CAR/EAR, Workmen Compensation (BPJSTK), Third Party Liability — minimum cover ditetapkan di SCC.
• Sub-Clause 20.1 — Claims: 28 hari notice time-bar + 42 hari Fully Detailed Claim.
• Sub-Clause 21 — Disputes: DAB → Amicable Settlement (56 hari) → Arbitrase (ICC/BANI/SIAC).

Mekanisme Eskalasi Sengketa: Negosiasi internal (30 hari) → Engineer's Determination → DAB → Amicable Settlement → Arbitrase → Pengadilan (eksekusi putusan).

Konversi ke Kontrak PUPR: FIDIC 8.5 EOT = SSUK Perpanjangan Waktu; FIDIC 13 VO = SSUK Perubahan/Adendum; FIDIC 19 Insurance = SSUK Asuransi CAR+BPJS; FIDIC 21 Arbitrase = SSUK Penyelesaian Sengketa (BANI atau PN).` },

  { agent_id: 864, name: "KB-FIDIC: Klausul 20.1 — Aturan Emas Klaim & Template Notice of Claim",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.KONTRAK_PERJANJIAN, source_authority: "FIDIC",
    description: "Prosedur klaim FIDIC 20.1 step-by-step dan template Notice of Claim siap pakai bahasa Indonesia",
    content: `Klausul FIDIC 20.1 — Aturan Emas Klaim Kontraktor:

(a) Notice of Claim: Kontraktor WAJIB kirim Notice ke Engineer dalam 28 hari sejak menyadari (atau seharusnya menyadari) event yang menjadi dasar klaim. PERINGATAN: Jika melewati 28 hari → klaim KEHILANGAN HAK (time-bar). Kirim NOC bahkan sebelum dampak terkuantifikasi.

(b) Continuing Records: Setelah Notice, kontraktor wajib menyimpan catatan kontemporer — daily report, foto, korespondensi, time sheet, cost records — sebagai bukti klaim.

(c) Fully Detailed Claim: Submit dalam 42 hari sejak Notice (atau waktu lain yang disetujui Engineer). Isi wajib: dasar kontraktual (klausul), kronologi event, quantum cost (line item breakdown), schedule impact (TIA pada critical path), bukti pendukung.

(d) Engineer's Determination: Engineer memutuskan dalam 42 hari. Mengikat sementara sampai DAB/arbitrase.

Template Notice of Claim (FIDIC 20.1) — Bahasa Indonesia:
---
Nomor: NOC-[YYYY-MM-NNN] | Tanggal: [DD MMMM YYYY]
Perihal: NOTICE OF CLAIM (Sub-Clause 20.1) — [Judul Event]
Kepada: [Nama Engineer / MK], Proyek: [Nama Proyek], Kontrak No.: [Nomor]

1. URAIAN EVENT: Pada tanggal [X], terjadi [uraian faktual — misal: keterlambatan penerbitan revisi gambar struktur Zone-B yang deadline kontraktual tanggal Y namun baru diterima tanggal Z].

2. DASAR KONTRAKTUAL: Sub-Clause 1.9 (late drawings) + Sub-Clause 8.5 (EOT) + [klausul lain].

3. ESTIMASI DAMPAK AWAL: Schedule Impact: [N] hari kalender pada lintasan kritis. Cost Impact: Rp [Nilai] (preliminary, dirinci dalam Fully Detailed Claim).

4. KEWAJIBAN: Kami akan menyimpan catatan kontemporer sesuai 20.1(b) dan menyampaikan Fully Detailed Claim dalam 42 hari atau waktu yang disetujui.

5. PERMOHONAN: (a) Konfirmasi penerimaan tertulis; (b) Site instruction lanjutan; (c) Koordinasi pada [tanggal].
---

Tipe Kontrak & Pemegang Risiko:
• Lump Sum: risiko volume & harga pada Kontraktor; cocok untuk scope jelas & DED matang.
• Unit Price: risiko volume pada Owner; cocok pekerjaan repetitif (jalan, pondasi).
• Cost-plus Fee: risiko pada Owner; untuk scope sangat tidak pasti.
• Design-Build/EPC (Yellow Book): risiko desain pada Kontraktor.
• Turnkey Silver Book: seluruh risiko pada Kontraktor.
• KPBU/PPP: konsorsium menanggung risiko jangka panjang dengan revenue stream.` },

  { agent_id: 860, name: "KB-FIDIC: Navigasi Tiga Buku FIDIC 2017 dan Kontrak PUPR",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.KONTRAK_PERJANJIAN, source_authority: "FIDIC",
    description: "Perbandingan 3 buku FIDIC 2017, konversi ke standar kontrak PUPR, dan matriks tipe kontrak vs risiko",
    content: `FIDIC 2017 — 3 Buku Utama:
Red Book (Merah): Conditions of Contract for Construction. Owner menyiapkan desain (DED). Risiko desain pada Owner. Cocok untuk proyek infrastruktur pemerintah dengan DED matang.
Yellow Book (Kuning): Plant & Design-Build. Kontraktor menyiapkan desain sesuai Employer's Requirements. Risiko desain pada Kontraktor. Cocok untuk EPC parsial.
Silver Book (Perak): EPC/Turnkey. Lump sum, Owner serahkan total. Risiko desain penuh pada Kontraktor. Cocok untuk BOT, IPP, proyek non-teknis Owner.

Perbandingan FIDIC 2017 vs Kontrak Permen PUPR 8/2023:
Sub-Clause 8.5 EOT ↔ SSUK Pasal Perpanjangan Waktu Pelaksanaan
Sub-Clause 13 Variations ↔ SSUK Pasal Perubahan Kontrak/Adendum
Sub-Clause 17 Care of Works ↔ SSUK Pasal Tanggung Jawab atas Pekerjaan
Sub-Clause 19 Insurance ↔ SSUK Pasal Asuransi (CAR/EAR + BPJSTK)
Sub-Clause 21 Arbitration ↔ SSUK Pasal Penyelesaian Sengketa (BANI/PN)

Matriks Risiko per Tipe Kontrak:
• Lump Sum Fixed Price: Volume=Kontraktor, Harga=Kontraktor, Desain=Owner.
• Unit Price: Volume=Owner, Harga=Owner, Desain=Owner.
• Cost-plus Fee: Volume=Owner, Harga=Owner, Desain=Owner.
• Design-Build EPC: Volume=Kontraktor, Harga=Kontraktor, Desain=Kontraktor.
• Turnkey Silver Book: semua risiko pada Kontraktor.
• KPBU PPP: semua risiko pada konsorsium (jangka panjang, ada revenue stream).

Perpres 12/2021 mengatur pengadaan barang/jasa pemerintah; kontrak PUPR menggunakan SSUK (Syarat-Syarat Umum Kontrak) dan SSKK (Syarat-Syarat Khusus Kontrak) yang dapat mengadopsi klausul FIDIC.` },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. KB-EVM — #891 PROXIMA, #895 AGENT-COST, #905 AB-03 EVM, #844 Cash Flow
  // ══════════════════════════════════════════════════════════════════════════

  { agent_id: 895, name: "KB-EVM: Formula Lengkap Earned Value Management",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.PENGENDALIAN, source_authority: "PMI-PMBOK7",
    description: "Formula EVM lengkap (CV, SV, CPI, SPI, EAC, ETC, VAC, TCPI) dan 4 metode EAC untuk proyek konstruksi",
    content: `EVM (Earned Value Management) mengintegrasikan pengukuran schedule dan cost dalam satu set indikator. Standar acuan: PMBOK 7th Edition Section 2.6 — Measurement Performance Domain.

TIGA VARIABEL INTI:
• PV (Planned Value / BCWS): Budgeted Cost of Work Scheduled — anggaran yang seharusnya sudah terpakai sesuai baseline schedule. Sumber: Master Schedule + Budget.
• EV (Earned Value / BCWP): Budgeted Cost of Work Performed — nilai pekerjaan yang benar-benar selesai diukur dalam satuan anggaran. Hitung: % progress fisik aktual × BAC item.
• AC (Actual Cost / ACWP): Actual Cost of Work Performed — biaya yang sudah dikeluarkan. Sumber: akuntansi proyek (PSAK 34).
• BAC (Budget at Completion): total anggaran proyek di baseline.

FORMULA VARIAN & INDEKS:
CV (Cost Variance) = EV − AC → ≥ 0 = on/under budget; < 0 = over budget.
SV (Schedule Variance) = EV − PV → ≥ 0 = on/ahead schedule; < 0 = behind.
CPI (Cost Performance Index) = EV / AC → ≥ 1 = sehat; < 1 = over budget.
SPI (Schedule Performance Index) = EV / PV → ≥ 1 = sehat; < 1 = behind.

FORMULA FORECAST (4 metode EAC):
EAC₁ = AC + (BAC − EV) — sisa pekerjaan dengan rate baseline.
EAC₂ = BAC / CPI — asumsi CPI tetap sampai selesai.
EAC₃ = AC + (BAC − EV) / CPI — paling umum dipakai.
EAC₄ = AC + (BAC − EV) / (CPI × SPI) — kondisi schedule juga buruk.
ETC (Estimate to Complete) = EAC − AC.
VAC (Variance at Completion) = BAC − EAC.
TCPI (To-Complete Performance Index) = (BAC − EV) / (BAC − AC).

INTERPRETASI CPI × SPI:
Sehat: CPI≥1 & SPI≥1 → pertahankan, pertimbangkan acceleration.
Late but Cheap: CPI≥1 & SPI<1 → mobilisasi resources, review critical path.
Fast but Expensive: CPI<1 & SPI≥1 → cost control, cek waste & scope creep.
CRISIS: CPI<1 & SPI<1 → eskalasi Direksi, re-baseline, potensi klaim VO/EOT.

TEKNIK KUANTIFIKASI % FISIK (EV):
0/100: pekerjaan singkat/atomic — 0% sampai selesai, lompat ke 100%.
Weighted Milestones: pekerjaan multi-tahap — bobot per milestone (mis. bekisting 30%, pembesian 30%, cor 30%, curing 10%).
Apportioned Effort: QA/QC, supervisi — ikuti % progress paket utama yang didukung.

CONTOH (Proyek Rp 100M, Minggu 26 dari 52): BAC=100M, PV=50M (50% baseline), EV=45M (45% aktual), AC=48M.
CV=45-48=−3M (over budget). SV=45-50=−5M (terlambat 5%).
CPI=45/48=0.9375. SPI=45/50=0.90.
EAC₃=48+(100-45)/0.9375=Rp106.67M. VAC=−6.67M.
Diagnosis: CRISIS → eskalasi Direksi, root cause analysis, recovery plan.` },

  { agent_id: 891, name: "KB-EVM: Integrasi EVM ke Weekly Progress Report Proyek",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.PENGENDALIAN, source_authority: "PMI-PMBOK7",
    description: "Struktur Weekly Progress Report berbasis EVM: S-curve, heat-map WBS, recovery plan, dan integrasi ke meeting proyek",
    content: `Weekly Progress Report dengan EVM wajib mencakup (minimal):

1. S-CURVE FISIK: grafik kumulatif % plan vs % actual dari minggu 1 sampai laporan. Deviation > 5% wajib penjelasan dan recovery action.
2. S-CURVE CASH: cash plan vs cash actual; koordinasi ke Manajer Keuangan untuk kebutuhan modal kerja dan proyeksi cash flow.
3. TABEL EVM RINGKAS: BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC — per periode laporan dan kumulatif.
4. HEAT-MAP PER WBS: status CPI/SPI per paket pekerjaan (WBS Level 2/3): hijau (≥1.0), kuning (0.95–0.99), merah (<0.95). Identifikasi 3–5 paket paling bermasalah.
5. TOP 5 RISIKO: risiko yang sedang menyebabkan penurunan CPI/SPI, PIC, dan tindakan mitigasi.
6. RECOVERY ACTION: wajib ada jika CPI atau SPI <0.90 — rencana akselerasi, resequencing, penambahan resources, atau klaim EOT/VO.

FREKUENSI PELAPORAN EVM:
• Weekly: tabel EVM ringkas + update S-curve.
• Monthly: laporan EVM lengkap ke pemilik proyek (owner/PPK) + lampirkan ke MCR (Monthly Construction Report).
• Per Milestone: re-baseline jika scope atau durasi berubah signifikan (>10%).

INTEGRASI EVM KE MEETING PROYEK:
Weekly Site Meeting: review WPR + EVM, update schedule look-ahead 3 minggu, action items.
Monthly Progress Meeting (dengan Owner/PPK): presentasi EVM, S-curve, EAC forecast, isu kritis, request VO/EOT jika ada.
PMBOK 7: EVM bukan sekedar laporan — gunakan sebagai early warning system untuk intervensi dini sebelum proyek masuk kondisi Crisis.

TEMPLATE EXCEL EVM: Input BAC, PV, EV, AC per periode. Output otomatis: CV, SV, CPI, SPI, EAC (method 3), ETC, VAC, TCPI. Conditional formatting: CPI/SPI ≥1.0 = hijau; 0.95–0.99 = kuning; <0.95 = merah.` },

  { agent_id: 905, name: "KB-EVM: Kalkulator EVM Lengkap untuk Cost Control Analyst",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.PENGENDALIAN, source_authority: "PMI-PMBOK7",
    description: "Kalkulator EVM step-by-step dengan contoh numerik proyek konstruksi Indonesia dan panduan diagnosis",
    content: `KALKULATOR EVM — Langkah Operasional:

STEP 1 — INPUT DATA PERIODE:
BAC = nilai kontrak total (sebelum contingency & keuntungan).
PV = % rencana × BAC (dari Master Schedule baseline).
EV = % fisik aktual × BAC (dari laporan progress fisik).
AC = biaya aktual dari sistem akuntansi proyek (PSAK 34).

STEP 2 — HITUNG VARIAN:
CV = EV − AC. Positif = under budget. Negatif = over budget.
SV = EV − PV. Positif = ahead schedule. Negatif = behind schedule.

STEP 3 — HITUNG INDEKS:
CPI = EV / AC. Target ≥ 1.0. Jika CPI = 0.94 artinya setiap Rp1 dikeluarkan menghasilkan Rp0.94 nilai pekerjaan.
SPI = EV / PV. Target ≥ 1.0. Jika SPI = 0.90 artinya progres fisik baru 90% dari rencana.

STEP 4 — FORECAST:
TCPI = (BAC − EV) / (BAC − AC). Jika TCPI > 1.10 → target sangat sulit dicapai, perlu re-baseline.
EAC (method 3) = AC + (BAC − EV) / CPI → gunakan jika CPI buruk karena masalah produktivitas sistemik.
EAC (method 1) = AC + (BAC − EV) → gunakan jika masalah cost adalah one-time event (sudah selesai).
ETC = EAC − AC.
VAC = BAC − EAC. Negatif = projected overrun.

STEP 5 — DIAGNOSIS & AKSI:
CPI≥1, SPI≥1: Sehat → monitoring rutin.
CPI≥1, SPI<1: Late but Cheap → percepat schedule, tambah resources.
CPI<1, SPI≥1: Fast but Expensive → audit biaya, cek waste & scope creep, review vendor.
CPI<1, SPI<1: CRISIS → eskalasi Direksi dalam 24 jam, root cause analysis, recovery plan dengan milestone penutup.

ROOT CAUSE ANALYSIS UNTUK CPI RENDAH:
Material cost overrun (vendor markup, material rusak, pencurian).
Labor cost overrun (produktivitas rendah, overtime, absensi tinggi).
Equipment cost overrun (breakdown berulang, downtime tinggi, OEE rendah).
Scope creep (pekerjaan tambah tanpa VO formal → draftkan variation order).

ROOT CAUSE ANALYSIS UNTUK SPI RENDAH:
RFI pending dari engineer yang memblokir pekerjaan.
Material/equipment delivery terlambat.
Produktivitas rendah (cuaca, learning curve, overtime fatigue).
Sequence pekerjaan tidak optimal (koordinasi MEP vs struktur).` },

  { agent_id: 844, name: "KB-EVM: Integrasi EVM dengan Cash Flow Management",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.PENGENDALIAN, source_authority: "PMI-PMBOK7",
    description: "Hubungan EVM dengan S-curve cash, proyeksi cash flow, dan koordinasi pembayaran termin",
    content: `Integrasi EVM dengan Cash Flow Management Proyek:

HUBUNGAN EVM DAN CASH FLOW:
EV (Earned Value) bukan cash flow — EV adalah nilai pekerjaan yang selesai dalam satuan anggaran. Cash in terjadi saat termin diajukan & dibayar Owner (umumnya dengan time lag 14–30 hari).

S-CURVE CASH vs S-CURVE FISIK:
S-curve fisik: % kumulatif volume pekerjaan selesai (EV/BAC).
S-curve cash out: akumulasi biaya aktual yang dikeluarkan (AC/BAC).
S-curve cash in: akumulasi pembayaran yang diterima dari Owner.
Gap antara cash out dan cash in = kebutuhan modal kerja (working capital gap).

FORMULA KEBUTUHAN MODAL KERJA:
Working Capital Gap = AC kumulatif − Cash In kumulatif.
Jika gap > kemampuan kas perusahaan → risiko cash flow → ajukan advance payment atau negosiasi termin lebih sering.

PROYEKSI CASH FLOW BERBASIS EVM:
EAC (forecast biaya akhir) → breakdown per bulan berdasarkan ETC dan sisa schedule.
Revenue projection = EAC × (1 + margin) → target cash in.
Gap analysis per bulan → identifikasi bulan kritis kebutuhan kredit bank (KIK Konstruksi).

KOORDINASI TERMIN DENGAN EVM:
Termin biasanya dibayarkan saat mencapai % progres fisik tertentu (10%, 20%, 40%, 70%, 90%, 100% + retensi).
% progres fisik = EV / BAC × 100%.
Jika SPI < 1.0 → termin terlambat → kebutuhan modal kerja meningkat.
Solusi: percepat pekerjaan prioritas untuk mencapai milestone termin, atau negosiasi interim payment.

LAPORAN KE OWNER/PPK:
Monthly Construction Report harus menyertakan: S-curve fisik+cash, EVM table (CPI/SPI/EAC), cash flow forecast 3 bulan ke depan, status piutang termin.` },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. Kalkulator EOT — #861 AGENT-FIDIC, #864 AGENT-KLAIM, #894 AGENT-SCHEDULE
  // ══════════════════════════════════════════════════════════════════════════

  { agent_id: 864, name: "Kalkulator EOT: Time Impact Analysis (TIA) — 8 Langkah",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.KONTRAK_PERJANJIAN, source_authority: "FIDIC",
    description: "Metodologi TIA 8-langkah untuk menghitung Extension of Time sesuai FIDIC 2017 & SCL Delay Protocol 2017",
    content: `Extension of Time (EOT) dihitung menggunakan Time Impact Analysis (TIA) — metode standar industri yang paling diterima Engineer dan DAB.

4 METODE TIA — PILIH SESUAI KONTEKS:
1. Impacted As-Planned: tambahkan delay ke baseline original. Cocok untuk klaim prospektif sebelum event terjadi penuh.
2. Time Impact Analysis (TIA): update schedule ke kondisi tepat sebelum event, insert delay fragnet → STANDAR INDUSTRI.
3. As-Planned vs As-Built: bandingkan baseline vs aktual akhir. Cocok untuk klaim retrospektif setelah proyek selesai.
4. Window Analysis: bagi proyek per window 30 hari, analisa delay per window. Cocok untuk proyek panjang dengan multiple delay events.

WORKFLOW TIA — 8 LANGKAH:
1. Identify Delay Event (apa yang menjadi dasar klaim).
2. Tentukan tanggal kejadian event (tanggal aware/seharusnya aware → hitung 28 hari NOC).
3. Update schedule ke kondisi sesaat sebelum event terjadi.
4. Identify activity yang langsung ter-delay oleh event ini.
5. Insert delay fragnet (duration perpanjangan) ke dalam schedule software (Primavera P6/MS Project).
6. Recalculate CPM (Critical Path Method) dengan fragnet.
7. Hitung selisih completion date (sebelum vs sesudah fragnet).
8. Tentukan EOT = selisih hari kalender pada completion date.

KALKULATOR EOT — TEMPLATE:
Event: [NOC-YYYY-MM-NNN] | [Deskripsi] | Tanggal: [DD-MM-YYYY].
Klausul: Sub-Clause [X] FIDIC/SSUK. Pemegang risiko: Owner/Kontraktor/Force Majeure.
Baseline: Start kontrak [DD-MM-YYYY], durasi [N] hari, original completion [DD-MM-YYYY].
Impact: Activity affected [ID]; critical path? Ya/Tidak; free float [N] hari; delay raw [N] hari.
Mitigasi dilakukan: Acceleration/Resequencing/Tidak ada.
Net Delay = Delay − Free Float (jika non-critical).
Concurrent Delay = [N] hari (delay paralel oleh kontraktor) → Apportionment sesuai SCL Protocol.
EOT yang diklaim = Net Delay − Concurrent Apportionment = [N] hari kalender.
New Completion Date = Original + EOT = [DD-MM-YYYY].

COST IMPACT (Prolongation Cost):
Site Overhead (Rp/hari) × EOT + HQ Overhead (Hudson/Eichleay formula) × EOT + Equipment Idle × EOT + Loss of Productivity × EOT = Total Cost Impact.

CONTOH: Late drawing Zone-B (43 hari terlambat, critical path, no concurrent delay, mitigasi resequencing 5 hari):
EOT = 43 − 5 = 38 hari. Cost = (25+8+12+5) juta/hari × 38 = Rp1.9M.
NOC dikirim 14-Mar-2026 (≤28 hari). Fully Detailed Claim due 25-Apr-2026 (42 hari setelah NOC).` },

  { agent_id: 894, name: "Kalkulator EOT: Critical Path dan Concurrent Delay",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.PENGENDALIAN, source_authority: "FIDIC",
    description: "Analisis critical path untuk EOT, konsep float ownership, dan penanganan concurrent delay sesuai SCL Delay Protocol 2017",
    content: `Analisis Critical Path untuk Klaim EOT:

CRITICAL PATH: rangkaian aktivitas tanpa float (total float = 0) dari start hingga completion. Delay pada critical path = delay langsung pada completion date = dasar EOT.

FREE FLOAT vs TOTAL FLOAT:
Free float: waktu suatu aktivitas dapat terlambat tanpa mempengaruhi aktivitas berikutnya.
Total float: waktu suatu aktivitas dapat terlambat tanpa mempengaruhi project completion.
Delay pada aktivitas non-critical: EOT = Delay − Total Float (jika delay melebihi float, sisanya masuk critical path).

FLOAT OWNERSHIP (PERINGATAN):
Float umumnya milik proyek (project's float), bukan eksklusif kontraktor. Jika Owner menggunakan float untuk delay-nya, ini mengurangi safety margin proyek tetapi belum tentu memberi hak EOT pada kontraktor — kecuali kontrak secara eksplisit menyatakan float milik kontraktor.

CONCURRENT DELAY:
Situasi: delay Owner dan delay Kontraktor terjadi pada periode yang sama (overlapping).
SCL Delay Protocol 2017: jika concurrent delay murni (periode sama, keduanya berdampak ke completion), maka:
- Kontraktor berhak EOT (time extension) tapi TIDAK berhak prolongation cost.
- Apportionment: distribusikan tanggung jawab delay secara proporsional.
- Pastikan ada bukti bahwa delay kontraktor berdampak independen ke completion.
Jika delay Kontraktor terjadi karena delay Owner sebelumnya (caused concurrent): Kontraktor dapat klaim penuh.

LANGKAH IDENTIFIKASI CONCURRENT DELAY:
1. Buat timeline semua delay events dari kedua pihak.
2. Overlay ke schedule update per periode.
3. Identifikasi periode overlapping di critical path.
4. Tentukan apportionment (mis. 60% Owner, 40% Kontraktor).
5. Dokumentasikan dengan daily records, site instructions, korespondensi.

PRIMAVERA P6 UNTUK TIA:
Buat baseline copy → update progress aktual → insert fragnet untuk delay event → run schedule → catat pergeseran completion date → bandingkan vs baseline. Export report sebagai lampiran Fully Detailed Claim.` },

  { agent_id: 861, name: "Kalkulator EOT: Prolognation Cost dan FIDIC Claim Quantum",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.KONTRAK_PERJANJIAN, source_authority: "FIDIC",
    description: "Formula prolongation cost untuk klaim EOT FIDIC: site overhead, HQ overhead (Hudson/Eichleay), equipment idle, loss of productivity",
    content: `Prolongation Cost — Komponen Klaim EOT Finansial:

Setelah EOT (hari) ditentukan via TIA, hitung financial claim untuk perpanjangan waktu:

1. SITE OVERHEAD (Rp/hari × EOT):
Site overhead = biaya tetap site yang terus berjalan selama perpanjangan: site office, utilitas, safety officer, surveyor, staf administrasi, dokumen & komunikasi.
Hitung dari monthly overhead budget ÷ 30 hari.

2. HQ OVERHEAD — Formula Hudson:
HQ Overhead/hari = (Nilai Kontrak × % HQ Overhead rate) ÷ Durasi Kontrak (hari).
% HQ Overhead biasanya 5–15% dari nilai kontrak (sesuai yang ditawarkan/aktual).
Alternatif Formula Eichleay (AS): (HQ Overhead selama proyek / Total Revenue selama proyek) × Revenue kontrak ini ÷ Durasi aktual kontrak.

3. EQUIPMENT IDLE COST (Rp/hari × EOT):
Alat yang stand-by karena delay Owner: ownership cost (depresiasi + bunga) + operating minimum.
Jangan masukkan alat yang dimobilisasi ke pekerjaan lain selama periode delay.
Gunakan tarif sewa pasar atau AHSP PUPR sebagai benchmark.

4. LOSS OF PRODUCTIVITY:
Akibat pekerjaan out-of-sequence, overtime berkepanjangan (diminishing return), atau kondisi yang berubah.
Metode kuantifikasi: Measured Mile (bandingkan produktivitas period normal vs period terdampak); Earned Value ratio; Industry tables (Mechanical Contractor Association, NECA, dll.).

PERHATIAN PENTING:
• Prolongation cost hanya dapat diklaim jika EOT berasal dari risiko Owner (bukan force majeure).
• Force majeure → EOT tanpa biaya prolongation (hanya biaya langsung tertentu).
• Bukti wajib: daily cost records, payroll, invoices, equipment logs selama periode delay.
• Submit Fully Detailed Claim = TIA report + prolongation cost breakdown + semua bukti pendukung.` },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. Kalkulator OEE — #944 AGENT-EQUIPRA, #946 AGENT-OEE
  // ══════════════════════════════════════════════════════════════════════════

  { agent_id: 946, name: "Kalkulator OEE: Formula Inti dan Six Big Losses Konstruksi",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN, source_authority: "TPM-Nakajima",
    description: "Formula OEE lengkap (Availability×Performance×Quality), Six Big Losses adaptasi konstruksi, benchmark, dan kalkulator template",
    content: `OEE (Overall Equipment Effectiveness) mengukur efektivitas alat berat & plant. Standar: TPM Nakajima 1988, diterapkan via ISO 55000.

FORMULA INTI:
OEE = Availability × Performance × Quality

Availability = Operating Time / Planned Production Time
             = (Planned Production Time − Unplanned Downtime) / Planned Production Time
Planned Production Time = Total Shift Time − Planned Downtime (PM, isi BBM, ganti shift, istirahat).
Unplanned Downtime = breakdown + setup tidak terduga + menunggu operator.

Performance = Actual Output / (Standard Rate × Operating Time)
            = Actual Output / Standard Output
Standard Rate: kapasitas teoretis alat sesuai spesifikasi manufaktur.

Quality = Good Output / Total Output
        = (Total − Rework − Reject) / Total
Rework di konstruksi: over-cut galian yang harus diurug ulang, grading salah elevasi, beton tumpah.

BENCHMARK OEE INDUSTRI:
World-Class ≥ 85%: Manufacturing Toyota/TPM matang.
Excellent 75–84%: target ambisius proyek konstruksi besar.
Average 60–74%: rata-rata industri konstruksi Indonesia.
Below Average 40–59%: banyak kehilangan, perlu intervensi segera.
Critical < 40%: audit menyeluruh, pertimbangkan penggantian alat.

THE SIX BIG LOSSES (sumber penurunan OEE di konstruksi):
Availability Losses: (1) Breakdown — engine rusak, hidrolik bocor, ban pecah; (2) Setup & Adjustments — pindah lokasi, tukar attachment.
Performance Losses: (3) Idling & Minor Stops — tunggu material/dump truck/signaler; (4) Reduced Speed — area sempit, tanah basah, akses buruk.
Quality Losses: (5) Rework/Defect — over-cut, grading salah; (6) Startup Losses — output sub-standar saat warm-up.

CONTOH KALKULASI — Excavator PC200 Mingguan:
Standard rate: 60 m³/jam. Planned hours: 48 jam (8j×6 hari). Planned downtime: 4 jam. Unplanned downtime: 6 jam (breakdown 4j + setup 2j). Actual output: 1,800 m³. Rework: 100 m³.
Planned prod = 44 jam. Operating = 38 jam.
Availability = 38/44 = 86.4%. Standard output = 60×38 = 2,280 m³.
Performance = 1,800/2,280 = 78.9%. Quality = (1,800-100)/1,800 = 94.4%.
OEE = 86.4% × 78.9% × 94.4% = 64.4% → AVERAGE (di bawah target 75%).
Root cause Performance rendah: investigasi tunggu dump truck (fleet matching) atau akses jelek.` },

  { agent_id: 946, name: "Kalkulator OEE: Analisis Root Cause dan Strategi Peningkatan",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN, source_authority: "TPM-Nakajima",
    description: "Strategi peningkatan OEE per komponen (Availability/Performance/Quality), Fleet OEE aggregation, dan TPM autonomous maintenance",
    content: `Strategi Peningkatan OEE per Komponen:

TINGKATKAN AVAILABILITY (kurangi downtime):
• Laksanakan PM tepat waktu sesuai interval HM (250/500/1000/2000 HM) → kurangi breakdown.
• Siapkan critical spare parts di gudang site → kurangi Mean Time To Repair (MTTR).
• Operator training: operator yang terlatih mengoperasikan alat dengan benar → kurangi misuse.
• Root cause analysis setiap breakdown > 2 jam → eliminasi repeat failures.
• Target MTBF (Mean Time Between Failures) meningkat setiap bulan.

TINGKATKAN PERFORMANCE (kurangi idle dan reduced speed):
• Fleet matching: hitung rasio dump truck vs excavator optimal.
  N truck = Cycle Time Truck / Cycle Time Loading.
  Jika N actual < N optimal → alat excavator idle menunggu truck.
• Kurangi idle time: pastikan instruksi kerja jelas, material tersedia sebelum alat mulai.
• Optimasi akses site: perbaiki jalan sementara, tambah lampu untuk kerja malam.
• Target utilization: excavator 75-85%, crane 85-90% dari scheduled hours.

TINGKATKAN QUALITY (kurangi rework):
• Marking jelas sebelum galian → kurangi over-cut.
• Briefing operator tentang batas elevasi dan dimensi target.
• Inspeksi berkala (surveyor setiap 2 jam untuk pekerjaan grading presisi).
• Kalibrasi bucket dan attachment secara berkala.

FLEET OEE AGGREGATION:
Fleet OEE = Σ (OEEᵢ × Weightᵢ)
Weight = nilai sewa atau kapasitas relatif unit sebagai bobot kontribusi.
Untuk fleet sederhana: gunakan rata-rata aritmetik OEE per unit.

TPM — AUTONOMOUS MAINTENANCE (AM):
Libatkan operator dalam pemeliharaan dasar: pembersihan, pelumasan, inspeksi visual harian (pre-use check).
7 langkah AM: Initial cleaning → Eliminate contamination sources → Cleaning & lubrication standards → General inspection training → Autonomous inspection → Standardization → Autonomous management.

KPI UTAMA EQUIPMENT MANAGEMENT: OEE target ≥ 75%, MTBF meningkat 10% per kuartal, PM Compliance ≥ 95%, Unplanned Downtime < 5% dari Planned Production Time.` },

  { agent_id: 944, name: "Kalkulator OEE: Implementasi di Fleet Alat Berat Proyek",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.OPERASIONAL_LAPANGAN, source_authority: "ISO-55000",
    description: "Cara implementasi pengukuran OEE untuk fleet alat berat proyek konstruksi: daily log, weekly review, pelaporan ke owner",
    content: `Implementasi Pengukuran OEE di Proyek Konstruksi:

EQUIPMENT LOG HARIAN (wajib per unit):
Kolom: Tanggal | Unit ID | Operator | HM Awal | HM Akhir | Total Shift | PM/Planned Downtime | Breakdown (waktu, penyebab) | Output aktual (m³/m/ton) | Remark.
Dari data harian: hitung availability harian, akumulasi ke weekly OEE.

WEEKLY OEE REVIEW:
Setiap Senin pagi: review OEE minggu lalu per unit.
Identifikasi unit dengan OEE < 65%: wajib root cause analysis dan action plan.
Fleet meeting: 30 menit — review OEE, downtime terbesar, kebutuhan spare parts, rencana PM minggu ini.

KALKULATOR OEE PER UNIT PER MINGGU:
Input: Total shift time, Planned downtime, Unplanned downtime, Standard rate (m³/jam dari spek alat), Actual output (m³), Rework (m³).
Output: Availability (%), Performance (%), Quality (%), OEE (%), Tier (World-Class/Excellent/Average/Below/Critical).

PELAPORAN OEE KE OWNER/PPK:
Equipment Report bulanan: OEE per unit, fleet OEE rata-rata, top 3 causes of downtime, utilisasi aktual vs kontrak, rencana PM bulan berikutnya.
Jika utilisasi alat < 70% dari yang ditawarkan dalam penawaran: owner dapat mempertanyakan kecukupan alat.
OEE rendah yang berdampak ke schedule: link ke EVM report (SPI rendah akibat equipment performance).

INTEGRASI OEE DENGAN EVM:
OEE Performance rate rendah → produktivitas rendah → SPI < 1.0.
OEE Availability rendah → breakdown → downtime → schedule delay → potensi klaim EOT jika penyebabnya alat owner.
EAC overrun akibat alat: identifikasi unit dengan ownership cost tinggi vs output rendah → pertimbangkan replace atau sewa additional unit.

TOOLS SEDERHANA: Gunakan spreadsheet Google Sheets/Excel dengan dashboard OEE otomatis. Input daily log → pivot table weekly OEE per unit → chart trend → export ke PDF untuk laporan.` },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. Kalkulator PPh Final 4(2) — #841 AGENT-PPH, #906 AB-04 Tax
  // ══════════════════════════════════════════════════════════════════════════

  { agent_id: 841, name: "KB-PPh Final 4(2): Tarif PP 9/2022 dan Mekanisme Pemotongan",
    type: "foundational", knowledge_layer: "foundational",
    taxonomy_id: TAX.TATA_KELOLA, source_authority: "DJP", source_url: "https://pajak.go.id",
    description: "Tarif PPh Final 4(2) jasa konstruksi per PP 9/2022 dan mekanisme pemotongan/penyetoran oleh Pemotong vs setor sendiri",
    content: `PPh Final 4(2) Jasa Konstruksi — PP 9/2022 (berlaku efektif 21 Februari 2022, mengganti PP 51/2008 & PP 40/2009).

TARIF PER JENIS JASA & KUALIFIKASI BUJK:
Pelaksanaan Konstruksi:
• Kualifikasi Kecil (K1–K3): 1.75% dari DPP.
• Kualifikasi Menengah (M1–M2): 2.65% dari DPP.
• Kualifikasi Besar (B1–B2) / Spesialis: 2.65% dari DPP.
• Tanpa SBU: 4% dari DPP.

Konsultansi Konstruksi:
• Memiliki SBU: 3.5% dari DPP.
• Tidak punya SBU: 6% dari DPP.

Pekerjaan Konstruksi Terintegrasi (EPC):
• Memiliki SBU: 2.65% dari DPP.
• Tidak punya SBU: 4% dari DPP.

DPP (Dasar Pengenaan Pajak) = Nilai kontrak sebelum PPN = nilai termin invoice yang dibayar Owner.

MEKANISME PEMOTONGAN:
Jika Owner adalah PEMOTONG (Pemerintah/K-L, BUMN, WP Badan tertentu):
→ Owner POTONG PPh Final saat bayar termin → Owner setor ke Kas Negara → Kontraktor terima NET → Kontraktor terima Bukti Potong (BP-1 / e-Bupot CoreTax).

Jika Owner BUKAN Pemotong (orang pribadi non-pemotong):
→ Kontraktor SETOR SENDIRI → deadline tanggal 15 bulan berikutnya → lapor SPT Masa tanggal 20 bulan berikutnya.

KARAKTERISTIK FINAL:
PPh Final 4(2) adalah FINAL — tidak digabung dengan penghasilan lain di SPT Tahunan PPh Badan. Tidak dapat dikompensasi rugi. Tidak dapat dikreditkan. Ini berbeda dengan PPh Pasal 23 atau 25.

KUALIFIKASI SBU MENENTUKAN TARIF: kualifikasi saat kontrak ditandatangani yang berlaku. Jika SBU naik tier mid-project, tarif lama tetap untuk kontrak existing.

SUBKONTRAKTOR: Kontraktor utama wajib memotong PPh Final 4(2) saat bayar subkon (tarif sesuai kualifikasi subkon). Kontraktor utama menjadi pemotong terhadap subkon.` },

  { agent_id: 841, name: "Kalkulator PPh Final 4(2): Step-by-Step dan Contoh BUJK Besar",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.TATA_KELOLA, source_authority: "DJP",
    description: "Kalkulator PPh Final 4(2) step-by-step dengan contoh kalkulasi BUJK Besar (Kualifikasi B1) proyek PUPR dan mekanisme CoreTax",
    content: `KALKULATOR PPh FINAL 4(2) — LANGKAH OPERASIONAL:

STEP 1 — IDENTIFIKASI:
Nomor kontrak, nama owner, apakah owner adalah pemotong (Pemerintah/BUMN = ya, orang pribadi non-WP badan = tidak).

STEP 2 — KLASIFIKASI JASA & TARIF:
Tentukan: (a) Jenis jasa (pelaksanaan/konsultansi/terintegrasi); (b) Kualifikasi BUJK (K/M/B/tanpa SBU); (c) Tarif final yang berlaku.

STEP 3 — HITUNG PER TERMIN:
DPP = nilai termin (sebelum PPN).
PPh Final = DPP × tarif.
PPN = DPP × 11%.
Invoice bruto = DPP + PPN.
Net diterima (jika dipotong) = Invoice bruto − PPh Final.
(PPN tetap diterima karena kontraktor harus setor PPN ke DJP.)

CONTOH KALKULASI — BUJK BESAR (B1), PROYEK PUPR:
BUJK: PT Kontraktor Sejahtera (Kualifikasi B1). Owner: K/L Pemerintah (PEMOTONG).
Nilai kontrak: Rp50M. Termin 3 (50% progres): DPP = Rp25M.
Tarif: 2.65% (BUJK Besar, pelaksanaan, ber-SBU).
PPh Final dipotong = 2.65% × 25M = Rp662.5 juta.
PPN 11% = 11% × 25M = Rp2.75M.
Invoice bruto = 25M + 2.75M = Rp27.75M.
Net ditransfer Owner = 27.75M − 662.5 juta = Rp27.0875M.
Kewajiban BUJK: (1) Setor PPN Rp2.75M → e-Faktur CoreTax → deadline akhir bulan berikut; (2) Terima Bukti Potong PPh Final (BP-1) dari Owner via CoreTax; (3) Catat akuntansi PSAK 34: pendapatan bruto Rp25M, PPh Final sudah final.

MEKANISME CORETAX DJP (mulai 2025):
Bukti Potong otomatis ter-generate via CoreTax (e-Bupot). Pelaporan SPT Masa via CoreTax. Setoran via billing CoreTax (SSE online). Kontraktor akses CoreTax untuk verifikasi BP-1 dari owner.

DEADLINE PAJAK:
Setor PPh Final (jika setor sendiri): tanggal 15 bulan berikutnya.
Lapor SPT Masa Bukti Potong (e-Bupot): tanggal 20 bulan berikutnya.
Lapor SPT Masa PPN (e-Faktur): akhir bulan berikutnya.` },

  { agent_id: 906, name: "KB-PPh Final 4(2): Integrasi Pajak dengan Cost Control Proyek",
    type: "operational", knowledge_layer: "operational",
    taxonomy_id: TAX.TATA_KELOLA, source_authority: "DJP",
    description: "Integrasi perhitungan PPh Final 4(2) dan PPN dalam cost control proyek, RAB, dan cash flow planning",
    content: `Integrasi Pajak Jasa Konstruksi dengan Cost Control Proyek:

PPH FINAL DALAM CASH FLOW PLANNING:
PPh Final dipotong saat termin dibayar → kontraktor terima NET. Dampak cash flow: setiap termin, potongan PPh Final mengurangi cash in. Contoh: kontrak Rp100M, BUJK Besar → PPh Final total = 2.65% × 100M = Rp2.65M (dipotong Owner, tidak masuk kas kontraktor).
Cash flow planning harus memperhitungkan NET cash in (setelah potongan PPh) untuk proyeksi modal kerja.

PPN DALAM RAB DAN INVOICING:
RAB (Rencana Anggaran Biaya) umumnya tidak termasuk PPN → nilai RAB = DPP.
Invoice ke Owner = DPP + PPN 11%.
Kontraktor menerima PPN dari Owner lalu menyetorkan ke DJP (PPN ini bukan pendapatan kontraktor).
Jika kontraktor membeli material berPPN → PPN masukan dapat dikreditkan terhadap PPN keluaran.
PPN Net yang disetorkan = PPN keluaran (dari invoice ke owner) − PPN masukan (dari pembelian material/jasa berPPN).

PAJAK SUBKONTRAKTOR DALAM BIAYA PROYEK:
Saat kontraktor membayar subkon: potong PPh Final 4(2) subkon → kontraktor sebagai pemotong.
PPh Final yang dipotong dari subkon: bukan beban kontraktor utama (dibayar dari uang subkon).
Namun: kewajiban administratif (setor + lapor BP-1 ke subkon) ada di kontraktor utama.
Risiko: jika kontraktor tidak memotong PPh subkon → dapat dikenakan sanksi DJP.

PERENCANAAN PAJAK DALAM PENAWARAN TENDER:
RAB tender tidak memasukkan PPh Final (final = sudah clear) tapi harus memasukkan: BPJSTK (4.24% dari upah), BPJS Kesehatan (4% dari upah), THR, PPh 21 karyawan site.
Kontrak PUPR: biaya BPJSTK termasuk dalam biaya K3 (komponen SMKK). Pastikan tidak double-count.

REKONSILIASI TAHUNAN:
PPh Final 4(2) tidak masuk SPT Tahunan PPh Badan sebagai penghasilan kena pajak biasa. Lampirkan di SPT Tahunan bagian penghasilan yang dikenakan pajak final. Bukti Potong (BP-1) dari owner harus dikumpulkan lengkap untuk rekonsiliasi.` },

];

async function main() {
  const client = await pool.connect();
  try {
    // Collect agent IDs
    const agentIds = [...new Set(KB.map(e => e.agent_id))];

    // Get existing KB names per agent to skip duplicates
    const { rows: existing } = await client.query(
      `SELECT agent_id, name FROM knowledge_bases WHERE agent_id = ANY($1)`,
      [agentIds]
    );
    const existingSet = new Set(existing.map((r: any) => `${r.agent_id}::${r.name}`));

    const toInsert = KB.filter(e => !existingSet.has(`${e.agent_id}::${e.name}`));
    console.log(`\n📚 Dokumen KB yang akan ditambahkan: ${toInsert.length} entries (${toInsert.length} baru dari ${KB.length} total)\n`);

    if (toInsert.length === 0) {
      console.log("✅ Semua KB entries sudah ada. Tidak ada yang perlu ditambahkan.");
      return;
    }

    const kbInserted: { id: number; agent_id: number; name: string; content: string }[] = [];

    for (const e of toInsert) {
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
      console.log(`  ✅ #${e.agent_id} — ${e.name.substring(0, 60)}`);
    }

    // Create chunks
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
        INSERT INTO knowledge_chunks (knowledge_base_id, agent_id, chunk_index, content, token_count, metadata, created_at)
        VALUES ${phs.join(",")}
      `, vals);
    }

    // Ensure RAG enabled for these agents
    await client.query(`
      UPDATE agents SET rag_enabled=true, rag_chunk_size=512, rag_chunk_overlap=64, rag_top_k=5
      WHERE id = ANY($1)
    `, [agentIds]);

    // Stats
    const { rows: totals } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM knowledge_bases) as kb,
        (SELECT COUNT(*) FROM knowledge_chunks) as chunks
    `);

    // Per-agent summary
    const { rows: summary } = await client.query(`
      SELECT agent_id, COUNT(*) as new_entries
      FROM knowledge_bases
      WHERE id = ANY($1)
      GROUP BY agent_id ORDER BY agent_id
    `, [kbInserted.map(k => k.id)]);

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("✅ SELESAI — KB Enrichment dari 5 Dokumen KONSTRA");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`KB entries ditambahkan  : ${kbInserted.length}`);
    console.log(`Chunks dibuat           : ${chunkInserts.length}`);
    console.log(`Total KB platform       : ${totals[0].kb}`);
    console.log(`Total Chunks platform   : ${totals[0].chunks}`);
    console.log("\nPer Agen:");
    summary.forEach((r: any) => {
      console.log(`  #${r.agent_id}: +${r.new_entries} KB baru`);
    });
    console.log("═══════════════════════════════════════════════════════════\n");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
