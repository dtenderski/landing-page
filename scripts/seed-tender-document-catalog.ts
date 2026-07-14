// Seed katalog dokumen tender pemerintah (Perpres 46/2025).
// Idempotent by `code`. Jalankan: npx tsx scripts/seed-tender-document-catalog.ts
// Sumber struktur: rangkuman sesi Notion/Grok "Tender Document Generator — Spec & JSON Template".

import { dbStorage } from "../server/db-storage";
import type { InsertTenderDocumentCatalog } from "../shared/schema";

type Doc = InsertTenderDocumentCatalog;

const DOCS: Doc[] = [
  // ==================== ADMINISTRASI (ADM-xx) — sisi penyedia ====================
  {
    code: "ADM-01", name: "Pakta Integritas",
    kelompok: "administrasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perpres 16/2018 jo. Perpres 46/2025 Pasal 7",
    sumberAutoFill: "company.name, company.picName, company.picPosition",
    openClawAgentRef: "tender-doc-generator", sortOrder: 1,
    description: "Pernyataan integritas anti-KKN; ditandatangani di atas materai oleh pimpinan perusahaan.",
  },
  {
    code: "ADM-02", name: "Surat Pernyataan Tidak Pailit & Tidak Blacklist",
    kelompok: "administrasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perpres 46/2025 Pasal 12",
    sumberAutoFill: "company.name, company.address, company.picName",
    openClawAgentRef: "tender-doc-generator", sortOrder: 2,
    description: "Pernyataan perusahaan tidak dalam pailit dan tidak masuk daftar hitam LKPP.",
  },
  {
    code: "ADM-03", name: "Surat Pernyataan Tunduk pada Dokumen Pemilihan",
    kelompok: "administrasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018",
    sumberAutoFill: "company.name, paket_info.kode_paket",
    openClawAgentRef: "tender-doc-generator", sortOrder: 3,
  },
  {
    code: "ADM-04", name: "Surat Kuasa (jika dikuasakan)",
    kelompok: "administrasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "opsional", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "KUH Perdata Pasal 1792",
    sumberAutoFill: "company.picName, company.picKuasa",
    openClawAgentRef: "tender-doc-generator", sortOrder: 4,
  },
  {
    code: "ADM-05", name: "Surat Penawaran",
    kelompok: "penawaran", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perpres 16/2018 Pasal 50",
    sumberAutoFill: "company.name, paket_info.kode_paket, paket_info.nilai_hps, settings.masa_berlaku_penawaran",
    openClawAgentRef: "tender-doc-generator", sortOrder: 5,
    description: "Surat utama berisi nilai penawaran, masa berlaku (min 60 hari), waktu pelaksanaan.",
  },
  {
    code: "ADM-06", name: "Formulir Isian Kualifikasi Elektronik (FIKE)",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perka LKPP 12/2021",
    sumberAutoFill: "company.*, personel[*], pengalaman[*], peralatan[*]",
    openClawAgentRef: "tender-doc-generator", sortOrder: 6,
  },
  {
    code: "ADM-07", name: "Surat Pernyataan KSO/JV (jika konsorsium)",
    kelompok: "administrasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "opsional", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 18",
    sumberAutoFill: "company.kso_partners[*]",
    openClawAgentRef: "tender-doc-generator", sortOrder: 7,
  },
  {
    code: "ADM-08", name: "Lampiran Sertifikat ISO/SMK3 (jika dipersyaratkan)",
    kelompok: "administrasi", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "opsional", formatOutput: "PDF", priority: "P2", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 10/2021 (SMK3)",
    sumberAutoFill: "company.iso_certs[*]",
    openClawAgentRef: "tender-doc-generator", sortOrder: 8,
  },

  // ==================== KUALIFIKASI / LEGALITAS (KUL-xx) ====================
  {
    code: "KUL-01", name: "NIB (OSS)",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "PP 5/2021 OSS Berbasis Risiko",
    sumberAutoFill: "company.nib", openClawAgentRef: "tender-doc-generator", sortOrder: 10,
    description: "Nomor Induk Berusaha — wajib aktif & sesuai KBLI pekerjaan.",
  },
  {
    code: "KUL-02", name: "NPWP Perusahaan + SPT Tahunan terakhir",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "UU 28/2007 KUP; Perpres 16/2018",
    sumberAutoFill: "company.npwp, company.spt_tahun",
    openClawAgentRef: "tender-doc-generator", sortOrder: 11,
  },
  {
    code: "KUL-03", name: "Akta Pendirian + Perubahan + KTP Direktur",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "UU 40/2007 PT",
    sumberAutoFill: "company.akta_no, company.akta_tanggal, company.direktur_ktp",
    openClawAgentRef: "tender-doc-generator", sortOrder: 12,
  },
  {
    code: "KUL-04", name: "TDP / Pengganti via OSS",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "opsional", formatOutput: "PDF", priority: "P2", templateStatus: "placeholder",
    dasarHukum: "PP 24/2018 (digantikan NIB)",
    sumberAutoFill: "company.nib", openClawAgentRef: "tender-doc-generator", sortOrder: 13,
  },
  {
    code: "KUL-05", name: "SBU-LPJK (Konstruksi / Konsultansi)",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Permen PUPR 9/2020; UU 2/2017 Jasa Konstruksi",
    sumberAutoFill: "company.sbu_no, company.sbu_subklas, company.sbu_kualifikasi",
    openClawAgentRef: "tender-doc-generator", sortOrder: 14,
    description: "Sertifikat Badan Usaha; subklasifikasi & kualifikasi (K1-K3/M1-M2/B1-B2) HARUS sesuai paket.",
  },
  {
    code: "KUL-06", name: "Surat Keterangan Domisili / SKDU",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "opsional", formatOutput: "PDF", priority: "P2", templateStatus: "placeholder",
    dasarHukum: "Perda setempat",
    sumberAutoFill: "company.address", openClawAgentRef: "tender-doc-generator", sortOrder: 15,
  },
  {
    code: "KUL-07", name: "Bukti Bayar Pajak Tahun Berjalan (3 bulan terakhir)",
    kelompok: "kualifikasi", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018",
    sumberAutoFill: "company.pajak_bulanan[*]", openClawAgentRef: "tender-doc-generator", sortOrder: 16,
  },

  // ==================== PERSONEL (PRS-xx) ====================
  {
    code: "PRS-01", name: "Daftar Tenaga Ahli + CV + SKA/BNSP",
    kelompok: "personel", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Permen PUPR 14/2020; UU 2/2017 Pasal 70",
    sumberAutoFill: "personel[*].nama, personel[*].jabatan, personel[*].ska_no, personel[*].cv",
    openClawAgentRef: "tender-doc-generator", sortOrder: 20,
    description: "Wajib lampirkan SKA/SKK aktif terdaftar di LPJK; jabatan minimal sesuai LDP.",
  },
  {
    code: "PRS-02", name: "Daftar Tenaga Terampil + SKT/BNSP",
    kelompok: "personel", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 14/2020",
    sumberAutoFill: "personel_terampil[*]", openClawAgentRef: "tender-doc-generator", sortOrder: 21,
  },
  {
    code: "PRS-03", name: "Surat Pernyataan Komitmen Personel Inti",
    kelompok: "personel", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perka LKPP 12/2021",
    sumberAutoFill: "personel[*].nama, paket_info.kode_paket",
    openClawAgentRef: "tender-doc-generator", sortOrder: 22,
  },
  {
    code: "PRS-04", name: "Struktur Organisasi Proyek",
    kelompok: "personel", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 21/2019",
    sumberAutoFill: "personel[*]", openClawAgentRef: "tender-doc-generator", sortOrder: 23,
  },

  // ==================== PENGALAMAN (PNG-xx) ====================
  {
    code: "PNG-01", name: "Bukti Pengalaman Kerja (Kontrak + BA Serah Terima)",
    kelompok: "pengalaman", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perpres 16/2018 Pasal 25; Perpres 46/2025",
    sumberAutoFill: "pengalaman[*].nama_paket, pengalaman[*].nilai, pengalaman[*].tahun, pengalaman[*].pemberi_kerja",
    openClawAgentRef: "tender-doc-generator", sortOrder: 30,
    description: "Pengalaman 4 tahun terakhir; nilai per paket sesuai persyaratan kualifikasi.",
  },
  {
    code: "PNG-02", name: "Bukti Kinerja Penyedia (SIKaP)",
    kelompok: "pengalaman", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib_perpres_46", formatOutput: "PDF", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perpres 46/2025 Pasal 25 ayat (3)",
    sumberAutoFill: "company.sikap_score, pengalaman[*].sikap_kinerja",
    openClawAgentRef: "tender-doc-generator", sortOrder: 31,
    description: "WAJIB Perpres 46/2025 — diunduh dari aplikasi SIKaP LKPP.",
  },
  {
    code: "PNG-03", name: "Daftar Pengalaman Sub-Bidang Sejenis",
    kelompok: "pengalaman", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "XLSX", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 25",
    sumberAutoFill: "pengalaman[*]", openClawAgentRef: "tender-doc-generator", sortOrder: 32,
  },

  // ==================== PERALATAN (ALT-xx) ====================
  {
    code: "ALT-01", name: "Daftar Peralatan Utama (milik/sewa)",
    kelompok: "peralatan", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "XLSX", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 25",
    sumberAutoFill: "peralatan[*].nama, peralatan[*].jumlah, peralatan[*].status_kepemilikan, peralatan[*].bukti",
    openClawAgentRef: "tender-doc-generator", sortOrder: 40,
  },
  {
    code: "ALT-02", name: "Bukti Kepemilikan/Sewa Peralatan",
    kelompok: "peralatan", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018",
    sumberAutoFill: "peralatan[*].bukti", openClawAgentRef: "tender-doc-generator", sortOrder: 41,
  },

  // ==================== TEKNIS (TKN-xx) — Pekerjaan Konstruksi ====================
  {
    code: "TKN-01", name: "Metode Pelaksanaan Pekerjaan",
    kelompok: "teknis", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 14/2020",
    sumberAutoFill: "teknis.metode, paket_info.lingkup_pekerjaan",
    openClawAgentRef: "tender-doc-generator", sortOrder: 50,
  },
  {
    code: "TKN-02", name: "Jadwal Pelaksanaan (Kurva-S / Bar Chart)",
    kelompok: "teknis", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "XLSX", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 14/2020",
    sumberAutoFill: "teknis.durasi_hari, paket_info.lingkup_pekerjaan",
    openClawAgentRef: "tender-doc-generator", sortOrder: 51,
  },
  {
    code: "TKN-03", name: "RKK (Rencana Keselamatan Konstruksi)",
    kelompok: "teknis", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 10/2021 SMK3 Konstruksi",
    sumberAutoFill: "teknis.rkk, personel[*].ahli_k3",
    openClawAgentRef: "tender-doc-generator", sortOrder: 52,
  },
  {
    code: "TKN-04", name: "Kerangka Acuan Kerja Tanggapan (KAK Response)",
    kelompok: "teknis", jenisTender: "konsultansi_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018",
    sumberAutoFill: "teknis.tanggapan_kak", openClawAgentRef: "tender-doc-generator", sortOrder: 53,
  },
  {
    code: "TKN-05", name: "Pendekatan & Metodologi Konsultansi",
    kelompok: "teknis", jenisTender: "konsultansi_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018",
    sumberAutoFill: "teknis.pendekatan", openClawAgentRef: "tender-doc-generator", sortOrder: 54,
  },

  // ==================== KEUANGAN / PENAWARAN HARGA (KEU-xx) ====================
  {
    code: "KEU-01", name: "Rekapitulasi Harga Penawaran",
    kelompok: "keuangan", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "XLSX", priority: "P0", templateStatus: "template_filled",
    dasarHukum: "Perpres 16/2018 Pasal 50; PMK PPN 12%",
    sumberAutoFill: "boq[*], settings.ppn_persen, settings.tkdn_persen",
    openClawAgentRef: "tender-doc-generator", sortOrder: 60,
    description: "Termasuk PPN 12% dan komponen PDN/TKDN minimal 7,5% sesuai Perpres 46/2025.",
  },
  {
    code: "KEU-02", name: "Rincian BoQ + Analisis Harga Satuan (AHSP)",
    kelompok: "keuangan", jenisTender: "pekerjaan_konstruksi", sisi: "penyedia",
    wajibStatus: "wajib", formatOutput: "XLSX", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Permen PUPR 1/2022 AHSP",
    sumberAutoFill: "boq[*].uraian, boq[*].volume, boq[*].harga_satuan, ahsp[*]",
    openClawAgentRef: "tender-doc-generator", sortOrder: 61,
  },
  {
    code: "KEU-03", name: "Dokumen PDN/TKDN",
    kelompok: "keuangan", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "wajib_perpres_46", formatOutput: "PDF", priority: "P0", templateStatus: "placeholder",
    dasarHukum: "Perpres 46/2025 Pasal 66; Permenperin 16/2011",
    sumberAutoFill: "settings.tkdn_persen, boq[*].komponen_dn",
    openClawAgentRef: "tender-doc-generator", sortOrder: 62,
    description: "WAJIB Perpres 46/2025 — minimal 7,5% komponen dalam negeri (atau sesuai LDP).",
  },
  {
    code: "KEU-04", name: "Dukungan Bank / Surat Jaminan Penawaran",
    kelompok: "penjaminan", jenisTender: "semua", sisi: "penyedia",
    wajibStatus: "opsional", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 30",
    sumberAutoFill: "company.bank_dukungan, paket_info.nilai_jaminan",
    openClawAgentRef: "tender-doc-generator", sortOrder: 63,
  },

  // ==================== POKJA / PPK SIDE (PJA-xx) ====================
  {
    code: "PJA-01", name: "Dokumen Pemilihan (Tender)",
    kelompok: "administrasi", jenisTender: "semua", sisi: "pokja",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P0", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018; Perka LKPP 12/2021",
    sumberAutoFill: "paket_info.*, ldp.*, ldk.*",
    openClawAgentRef: "tender-doc-generator", sortOrder: 70,
    description: "Disusun Pokja: IKP + LDP + LDK + Spek Teknis + BoQ + Draft Kontrak.",
  },
  {
    code: "PJA-02", name: "Berita Acara Evaluasi Penawaran",
    kelompok: "administrasi", jenisTender: "semua", sisi: "pokja",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 51",
    sumberAutoFill: "evaluasi[*]", openClawAgentRef: "tender-doc-generator", sortOrder: 71,
  },
  {
    code: "PJA-03", name: "Berita Acara Hasil Pemilihan (BAHP)",
    kelompok: "administrasi", jenisTender: "semua", sisi: "pokja",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 52",
    sumberAutoFill: "evaluasi[*], pemenang", openClawAgentRef: "tender-doc-generator", sortOrder: 72,
  },
  {
    code: "PJA-04", name: "Surat Penetapan Pemenang (SPPBJ)",
    kelompok: "administrasi", jenisTender: "semua", sisi: "pokja",
    wajibStatus: "wajib", formatOutput: "PDF", priority: "P1", templateStatus: "placeholder",
    dasarHukum: "Perpres 16/2018 Pasal 53",
    sumberAutoFill: "pemenang, paket_info.*", openClawAgentRef: "tender-doc-generator", sortOrder: 73,
  },
];

async function main() {
  let created = 0, updated = 0;
  for (const doc of DOCS) {
    const before = await dbStorage.getTenderDocumentByCode(doc.code);
    await dbStorage.upsertTenderDocumentCatalog(doc);
    if (before) updated++; else created++;
  }
  // Verifikasi total aktif
  const all = await dbStorage.getTenderDocumentCatalog();
  console.log(`[seed-tender-document-catalog] selesai: ${created} dibuat, ${updated} diperbarui.`);
  console.log(`Total dokumen aktif di katalog: ${all.length}`);
  console.log(`Per kelompok:`, all.reduce<Record<string, number>>((acc, d) => { acc[d.kelompok] = (acc[d.kelompok] || 0) + 1; return acc; }, {}));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
