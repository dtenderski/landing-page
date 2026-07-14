/**
 * Seed Knowledge Bases untuk seluruh agen platform Gustafta
 * 
 * Strategi:
 * - Setiap agen mendapat 3 KB entries: foundational + operational + compliance
 * - HUBs (orchestrator) mendapat +1 tactical entry
 * - Konten diturunkan dari field agen yang sudah ada (system_prompt, expertise, domain_charter)
 * - taxonomy_id dipilih berdasarkan big_idea_id dan nama agen
 * - Idempotent: skip agen yang sudah punya KB
 * 
 * Cara pakai:
 *   npx tsx scripts/seed-knowledge-bases-all.ts
 */

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// TAXONOMY ID MAP (dari hasil seed-knowledge-taxonomy)
// ─────────────────────────────────────────────────────────────────────────────
const TAX = {
  // Sektor
  LEGALITAS: 1,
  PERIJINAN: 6,
  SBU: 11,
  SKK: 16,
  TENDER: 21,
  PELAKSANAAN: 26,
  TATA_KELOLA: 31,
  SISTEM_MANAJEMEN: 36,
  // Sub-sektor Legalitas
  KONTRAK_PERJANJIAN: 2,
  SENGKETA: 3,
  HUKUM_OPERASIONAL: 4,
  REGULASI_INDUK: 5,
  // Sub-sektor Perijinan
  OSS_RBA: 7,
  IUJK: 8,
  PERIZINAN_BANGUNAN: 9,
  ANTI_TOLAK: 10,
  // Sub-sektor SBU
  SBU_KONTRAKTOR: 12,
  SBU_KONSULTAN: 13,
  LSBU_PROSES: 14,
  IUJPTL: 15,
  // Sub-sektor SKK
  SKK_AHLI: 17,
  SKK_TERAMPIL: 18,
  SKK_AJJ: 19,
  MANAJEMEN_LSP: 20,
  // Sub-sektor Tender
  STRATEGI_TENDER: 22,
  DOKUMEN_PENAWARAN: 23,
  REGULASI_PBJP: 24,
  ANTI_GUGUR: 25,
  // Sub-sektor Pelaksanaan
  PERENCANAAN_EKSEKUSI: 27,
  OPERASIONAL_LAPANGAN: 28,
  PENGENDALIAN: 29,
  PASCA_TENDER: 30,
  // Sub-sektor Tata Kelola
  PJBU: 32,
  ERP_ODOO: 33,
  MENTORING: 34,
  ASOSIASI: 35,
  // Sub-sektor Sistem Manajemen
  ISO9001: 37,
  ISO14001: 38,
  SMK3: 39,
  SMAP: 40,
};

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN MAPPING: big_idea_id → { taxonomyId, domainLabel, regulasi, urls }
// ─────────────────────────────────────────────────────────────────────────────
interface DomainConfig {
  taxonomyId: number;
  domainLabel: string;
  regulasiUtama: string;
  sourcesUrl?: { name: string; url: string }[];
}

function getDomainByBigIdeaId(bigIdeaId: number | null, agentName: string, behaviorPreset: string): DomainConfig {
  const name = (agentName || "").toLowerCase();

  // SKK / LSP / Kompetensi
  if ([3, 5, 6, 43, 44, 45, 46, 47, 48, 49, 50, 200, 201, 202, 203].includes(bigIdeaId!) ||
      name.includes("skk") || name.includes("asesor") || name.includes("ajj") ||
      name.includes("lsp") || name.includes("kompetensi") || name.includes("sertifikasi")) {
    if (name.includes("ajj") || bigIdeaId === 44 || bigIdeaId === 19 || bigIdeaId === 43 || bigIdeaId === 201) {
      return { taxonomyId: TAX.SKK_AJJ, domainLabel: "Asesmen Jarak Jauh (AJJ) SKK Konstruksi",
        regulasiUtama: "Permen PUPR 6/2021 tentang Standar Kompetensi Kerja Konstruksi; Peraturan LPJK No. 7/2021; Pedoman AJJ LPJK; PP 14/2021 tentang Perubahan PP 22/2020",
        sourcesUrl: [{ name: "LPJK Portal", url: "https://lpjk.pu.go.id" }] };
    }
    if (name.includes("lsp") && (name.includes("manajemen") || name.includes("lisensi") || name.includes("akreditasi") || bigIdeaId === 50)) {
      return { taxonomyId: TAX.MANAJEMEN_LSP, domainLabel: "Manajemen Lembaga Sertifikasi Profesi (LSP) Konstruksi",
        regulasiUtama: "Pedoman BNSP 201-202-203; Permen PUPR 6/2021; Peraturan LPJK No. 7/2021 tentang LSP Terakreditasi; PP 14/2021",
        sourcesUrl: [{ name: "BNSP", url: "https://bnsp.go.id" }, { name: "LPJK", url: "https://lpjk.pu.go.id" }] };
    }
    if ([17, 45, 46, 47, 202, 209, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230].includes(bigIdeaId!)) {
      return { taxonomyId: TAX.SKK_AHLI, domainLabel: "SKK Jenjang Tenaga Ahli Konstruksi (Jenjang 7-9)",
        regulasiUtama: "Permen PUPR 6/2021 tentang Standar Kompetensi Kerja; SKKNI sesuai bidang; Perpres 8/2012 KKNI; PP 14/2021",
        sourcesUrl: [{ name: "LPJK", url: "https://lpjk.pu.go.id" }, { name: "Jasa Konstruksi", url: "https://jdih.pu.go.id" }] };
    }
    return { taxonomyId: TAX.SKK_TERAMPIL, domainLabel: "SKK Jenjang Tenaga Terampil Konstruksi (Jenjang 1-6)",
      regulasiUtama: "Permen PUPR 6/2021; SKKNI Bidang Konstruksi; Perpres 8/2012 KKNI; Peraturan LPJK No. 7/2021",
      sourcesUrl: [{ name: "LPJK", url: "https://lpjk.pu.go.id" }] };
  }

  // SBU Kontraktor & Konsultan
  if ([2, 22, 39, 40, 57, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109].includes(bigIdeaId!) ||
      name.includes("sbu") || name.includes("sertifikasi badan")) {
    if (name.includes("konsultan") || name.includes("perencana") || name.includes("pengawas")) {
      return { taxonomyId: TAX.SBU_KONSULTAN, domainLabel: "SBU Konsultan Konstruksi (28 Subklasifikasi)",
        regulasiUtama: "Permen PUPR 6/2021; PerLem LPJK No. 2/2022 tentang Sertifikasi Badan Usaha; PP 14/2021; UU 2/2017 Jasa Konstruksi",
        sourcesUrl: [{ name: "LPJK", url: "https://lpjk.pu.go.id" }, { name: "OSS RBA", url: "https://oss.go.id" }] };
    }
    return { taxonomyId: TAX.SBU_KONTRAKTOR, domainLabel: "SBU Kontraktor Konstruksi (73 Subklasifikasi)",
      regulasiUtama: "Permen PUPR 6/2021; PerLem LPJK No. 2/2022; PP 14/2021 jo PP 22/2020; UU 2/2017 Jasa Konstruksi; Permen PUPR 7/2024",
      sourcesUrl: [{ name: "LPJK", url: "https://lpjk.pu.go.id" }, { name: "OSS RBA", url: "https://oss.go.id" }] };
  }

  // Tender & Pengadaan
  if ([4, 69, 70, 71, 72, 73].includes(bigIdeaId!) ||
      name.includes("tender") || name.includes("pengadaan") || name.includes("hps") ||
      name.includes("penawaran") || name.includes("lpse") || name.includes("pbjp")) {
    if (name.includes("hps") || name.includes("ahsp") || name.includes("volume") || name.includes("rab")) {
      return { taxonomyId: TAX.DOKUMEN_PENAWARAN, domainLabel: "Penyusunan Dokumen Penawaran & HPS Konstruksi",
        regulasiUtama: "Perpres 16/2018 jo 12/2021 PBJP; Perlem LKPP No. 12/2021; SE Menteri PUPR No. 18/2021 tentang AHSP; Perlem LKPP No. 11/2021 Katalog Elektronik",
        sourcesUrl: [{ name: "LKPP", url: "https://lkpp.go.id" }, { name: "LPSE Nasional", url: "https://lpse.lkpp.go.id" }] };
    }
    if (name.includes("anti-gugur") || name.includes("validator") || name.includes("evaluasi")) {
      return { taxonomyId: TAX.ANTI_GUGUR, domainLabel: "Anti-Gugur Blueprint & Evaluasi Penawaran PBJP",
        regulasiUtama: "Perlem LKPP 12/2021 tentang Pedoman Tender; SE LKPP No. 3/2023; Perpres 16/2018 jo 12/2021 Pasal 50-70 (evaluasi penawaran)",
        sourcesUrl: [{ name: "LKPP", url: "https://lkpp.go.id" }] };
    }
    return { taxonomyId: TAX.STRATEGI_TENDER, domainLabel: "Strategi & Persiapan Tender Konstruksi Pemerintah",
      regulasiUtama: "Perpres 16/2018 jo Perpres 12/2021 tentang PBJP; Perlem LKPP No. 12/2021; Perlem LKPP No. 18/2021 E-Purchasing; Permen PUPR 14/2020 SBD",
      sourcesUrl: [{ name: "LKPP", url: "https://lkpp.go.id" }, { name: "INAPROC", url: "https://inaproc.lkpp.go.id" }] };
  }

  // Kontrak & Hukum
  if ([77, 78, 79, 113, 204, 205, 206, 207, 208].includes(bigIdeaId!) ||
      name.includes("kontrak") || name.includes("hukum") || name.includes("fidic") ||
      name.includes("sengketa") || name.includes("litigasi") || name.includes("arbitrase") ||
      name.includes("klaim") || name.includes("dispute")) {
    if (name.includes("fidic") || name.includes("kontrak") || name.includes("perjanjian") || bigIdeaId === 77) {
      return { taxonomyId: TAX.KONTRAK_PERJANJIAN, domainLabel: "Kontrak & Perjanjian Konstruksi (FIDIC, PUPR, Swasta)",
        regulasiUtama: "FIDIC Red Book 1999/2017; SBD PUPR (Permen PUPR 14/2020); KUHPerdata Buku III; UU 2/2017 Jasa Konstruksi Pasal 47-64; PP 22/2020 jo PP 14/2021",
        sourcesUrl: [{ name: "FIDIC", url: "https://fidic.org" }, { name: "JDIH PUPR", url: "https://jdih.pu.go.id" }] };
    }
    if (name.includes("sengketa") || name.includes("arbitrase") || name.includes("litigasi") || bigIdeaId === 78) {
      return { taxonomyId: TAX.SENGKETA, domainLabel: "Penyelesaian Sengketa Konstruksi (Mediasi, Arbitrase, Litigasi)",
        regulasiUtama: "UU 2/2017 Pasal 88-101 (Penyelesaian Sengketa); UU 30/1999 Arbitrase; Peraturan BANI; PP 9/2022 BPPJK; Perma No. 1/2016 Mediasi",
        sourcesUrl: [{ name: "BANI", url: "https://bani-arb.org" }] };
    }
    if (name.includes("pajak") || name.includes("pph") || name.includes("ppn") || bigIdeaId === 206) {
      return { taxonomyId: TAX.HUKUM_OPERASIONAL, domainLabel: "Hukum Operasional Konstruksi (PPh, PPN, Asuransi, Ketenagakerjaan)",
        regulasiUtama: "PPh Final Pasal 4(2) 2,65% (konstruksi); PMK 59/2022 PPN Jasa Konstruksi; UU 13/2003 Ketenagakerjaan; POJK Asuransi CAR/EAR; UU No. 7/2021 HPP",
        sourcesUrl: [{ name: "DJP Online", url: "https://pajak.go.id" }, { name: "Coretax", url: "https://coretax.pajak.go.id" }] };
    }
    return { taxonomyId: TAX.REGULASI_INDUK, domainLabel: "Regulasi Induk Jasa Konstruksi Indonesia",
      regulasiUtama: "UU 2/2017 Jasa Konstruksi (diubah UU Cipta Kerja); PP 22/2020 jo PP 14/2021; Permen PUPR 6/2021; Permen PUPR 9/2021; Permen PUPR 10/2021",
      sourcesUrl: [{ name: "JDIH PUPR", url: "https://jdih.pu.go.id" }, { name: "JDIH BPK", url: "https://peraturan.bpk.go.id" }] };
  }

  // Perizinan & OSS
  if ([1, 41, 42, 55, 80, 81, 82, 83].includes(bigIdeaId!) ||
      name.includes("perizinan") || name.includes("oss") || name.includes("nib") ||
      name.includes("iujk") || name.includes("pbg") || name.includes("slf") ||
      name.includes("imb") || name.includes("anti-tolak")) {
    if (name.includes("pbg") || name.includes("slf") || name.includes("bangunan gedung") || bigIdeaId === 82) {
      return { taxonomyId: TAX.PERIZINAN_BANGUNAN, domainLabel: "Perizinan Bangunan Gedung (PBG, SLF, Renovasi)",
        regulasiUtama: "UU 28/2002 Bangunan Gedung jo UU Cipta Kerja; PP 16/2021 tentang PBG; Permen PUPR 11/2021 Bangunan Gedung Hijau; PerMen ATR/BPN 11/2021",
        sourcesUrl: [{ name: "OSS RBA", url: "https://oss.go.id" }, { name: "SIMBG", url: "https://simbg.pu.go.id" }] };
    }
    if (name.includes("anti-tolak") || name.includes("anti tolak") || bigIdeaId === 55) {
      return { taxonomyId: TAX.ANTI_TOLAK, domainLabel: "Anti-Tolak Blueprint & Error Map Perizinan Konstruksi",
        regulasiUtama: "PP 16/2021 PBG; Permen PUPR 6/2021 SBU; OSS-RBA Perpres 91/2017; 5 Fase Pembinaan PUB-ASPEKINDO; Error Map E01-E16",
        sourcesUrl: [{ name: "OSS RBA", url: "https://oss.go.id" }] };
    }
    return { taxonomyId: TAX.OSS_RBA, domainLabel: "OSS-RBA, NIB & Perizinan Usaha Jasa Konstruksi",
      regulasiUtama: "Perpres 91/2017 OSS; PP 5/2021 tentang Perizinan Berusaha Berbasis Risiko (OSS-RBA); Permen PUPR 6/2021; PP 14/2021 tentang Jasa Konstruksi",
      sourcesUrl: [{ name: "OSS RBA", url: "https://oss.go.id" }, { name: "BKPM", url: "https://bkpm.go.id" }] };
  }

  // Sistem Manajemen (ISO, SMK3, SMAP, Pancek, CSMS)
  if ([7, 8, 51, 52, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68].includes(bigIdeaId!) ||
      name.includes("iso") || name.includes("smk3") || name.includes("smap") ||
      name.includes("pancek") || name.includes("csms") || name.includes("k3") ||
      name.includes("mutu") || name.includes("ims") || name.includes("anti-suap") ||
      name.includes("lingkungan") || name.includes("hsqe") || name.includes("csmas")) {
    if (name.includes("smk3") || name.includes("k3") || bigIdeaId === 61 ||
        name.includes("keselamatan") || name.includes("kesehatan kerja")) {
      return { taxonomyId: TAX.SMK3, domainLabel: "SMK3 (Sistem Manajemen K3) PP 50/2012 & ISO 45001",
        regulasiUtama: "PP 50/2012 tentang SMK3; Permen Naker 26/2014 SMK3; ISO 45001:2018 (pengganti OHSAS 18001); UU 1/1970 K3; SE Menteri PUPR 11/2019 K3 Konstruksi",
        sourcesUrl: [{ name: "Kemnaker", url: "https://kemnaker.go.id" }, { name: "ISO", url: "https://iso.org/iso-45001-occupational-health-and-safety.html" }] };
    }
    if (name.includes("smap") || name.includes("pancek") || name.includes("anti-suap") ||
        name.includes("csms") || name.includes("integritas") || bigIdeaId === 7 || bigIdeaId === 51 || bigIdeaId === 52) {
      return { taxonomyId: TAX.SMAP, domainLabel: "SMAP/ISO 37001 Anti-Suap, Pancek & CSMAS Konstruksi",
        regulasiUtama: "ISO 37001:2016 SMAP (Anti-Bribery); Perpres 54/2018 Strategi Nasional Pencegahan Korupsi; Permen PUPR 1/2022 CSMS; SE PUPR 16/2022 Pancek; UU 31/1999 jo UU 20/2001 Tipikor",
        sourcesUrl: [{ name: "KPK", url: "https://kpk.go.id" }, { name: "ISO 37001", url: "https://iso.org/iso-37001-anti-bribery-management.html" }] };
    }
    if (name.includes("mutu") || name.includes("iso 9001") || name.includes("qms") || bigIdeaId === 62) {
      return { taxonomyId: TAX.ISO9001, domainLabel: "Sistem Manajemen Mutu ISO 9001:2015 Konstruksi",
        regulasiUtama: "ISO 9001:2015 Quality Management System; SNI ISO 9001:2015; Permen PUPR 14/2020 tentang Standar dan Pedoman PBJP Bidang Konstruksi; SE LPJK/LSP tentang Audit Mutu",
        sourcesUrl: [{ name: "BSN", url: "https://bsn.go.id" }, { name: "ISO 9001", url: "https://iso.org/iso-9001-quality-management.html" }] };
    }
    if (name.includes("lingkungan") || name.includes("iso 14001") || name.includes("amdal") || bigIdeaId === 63) {
      return { taxonomyId: TAX.ISO14001, domainLabel: "Sistem Manajemen Lingkungan ISO 14001 & AMDAL Konstruksi",
        regulasiUtama: "ISO 14001:2015 EMS; UU 32/2009 Perlindungan Lingkungan Hidup; PP 22/2021 AMDAL & UKL-UPL; Permen LHK 4/2021; SE PUPR tentang Green Construction",
        sourcesUrl: [{ name: "KLHK", url: "https://menlhk.go.id" }, { name: "ISO 14001", url: "https://iso.org/iso-14001-environmental-management.html" }] };
    }
    // IMS (Integrated Management System)
    if (name.includes("ims") || bigIdeaId === 60) {
      return { taxonomyId: TAX.SISTEM_MANAJEMEN, domainLabel: "IMS — Integrated Management System (ISO 9001+14001+45001+37001)",
        regulasiUtama: "ISO 9001:2015 QMS; ISO 14001:2015 EMS; ISO 45001:2018 OHS; ISO 37001:2016 SMAP; Annex SL High Level Structure integrasi 4 sistem",
        sourcesUrl: [{ name: "BSN", url: "https://bsn.go.id" }] };
    }
    return { taxonomyId: TAX.SISTEM_MANAJEMEN, domainLabel: "Sistem Manajemen Terintegrasi Konstruksi",
      regulasiUtama: "PP 50/2012 SMK3; ISO 9001:2015; ISO 14001:2015; ISO 45001:2018; Permen PUPR 1/2022 CSMS; SE PUPR 16/2022 Pancek",
      sourcesUrl: [{ name: "BSN", url: "https://bsn.go.id" }] };
  }

  // Pelaksanaan Proyek (Project Management)
  if ([74, 75, 76, 111, 112, 147, 174, 214].includes(bigIdeaId!) ||
      name.includes("manajer proyek") || name.includes("project manager") ||
      name.includes("proxima") || name.includes("pelaksanaan") ||
      name.includes("wbs") || name.includes("schedule") || name.includes("gantt") ||
      name.includes("method statement") || name.includes("rab") || name.includes("s-curve")) {
    if (name.includes("supply chain") || name.includes("logistik") || name.includes("pengadaan") ||
        name.includes("vendor") || name.includes("mrp") || bigIdeaId === 174) {
      return { taxonomyId: TAX.OPERASIONAL_LAPANGAN, domainLabel: "Manajemen Rantai Pasok & Logistik Konstruksi",
        regulasiUtama: "SNI 7393:2008 Tata Cara Pengadaan Jasa Konstruksi; Perpres 16/2018 jo 12/2021 PBJP; SE PUPR 18/2021 AHSP; ISO 20400:2017 Sustainable Procurement; PP 14/2021",
        sourcesUrl: [{ name: "LKPP", url: "https://lkpp.go.id" }] };
    }
    if (name.includes("biaya") || name.includes("keuangan") || name.includes("evm") ||
        name.includes("cost") || name.includes("quantity surveyor") || name.includes("qs") ||
        bigIdeaId === 145) {
      return { taxonomyId: TAX.PERENCANAAN_EKSEKUSI, domainLabel: "Estimasi Biaya, RAB & Quantity Surveying Konstruksi",
        regulasiUtama: "SE Menteri PUPR 18/2021 tentang AHSP; Permen PUPR 14/2020 SBD; SNI 2835:2008 Estimasi; PMBOK 7th Edition Cost Management; EVA (Earned Value Analysis) ANSI EIA-748",
        sourcesUrl: [{ name: "JDIH PUPR", url: "https://jdih.pu.go.id" }] };
    }
    if (name.includes("risiko") || name.includes("risk") || bigIdeaId === 112) {
      return { taxonomyId: TAX.PENGENDALIAN, domainLabel: "Manajemen Risiko Proyek Konstruksi (ISO 31000, PMBOK)",
        regulasiUtama: "ISO 31000:2018 Risk Management; PMBOK 7th Ed. Risk Domain; SE PUPR 22/2018 Manajemen Risiko Konstruksi; SNI IEC 62198 Manajemen Risiko Proyek; FIDIC Yellow Book Clause 17",
        sourcesUrl: [{ name: "PMI", url: "https://pmi.org" }] };
    }
    if (name.includes("kpbu") || name.includes("ppp") || name.includes("vfm") ||
        name.includes("obc") || name.includes("fbc") || bigIdeaId === 77) {
      return { taxonomyId: TAX.PASCA_TENDER, domainLabel: "KPBU (Kerja Sama Pemerintah Badan Usaha) & PPP Konstruksi",
        regulasiUtama: "Perpres 38/2015 tentang KPBU; Permen PPN/Bappenas 4/2015 Tata Cara Pelaksanaan KPBU; PMK 260/2016 VGF; PMK 264/2015 Jaminan Pemerintah; ADB PPP Handbook",
        sourcesUrl: [{ name: "Bappenas KPBU", url: "https://kpbu.bappenas.go.id" }, { name: "PT PII", url: "https://iigf.co.id" }] };
    }
    return { taxonomyId: TAX.PERENCANAAN_EKSEKUSI, domainLabel: "Manajemen Proyek Konstruksi (PMBOK, FIDIC, SNI)",
      regulasiUtama: "PMBOK 7th Edition (PMI); FIDIC Conditions of Contract; SNI 6128:2016 Manajemen Proyek; ISO 21502:2020 Project Management; PP 14/2021 Jasa Konstruksi",
      sourcesUrl: [{ name: "PMI", url: "https://pmi.org" }, { name: "FIDIC", url: "https://fidic.org" }] };
  }

  // Keuangan Konstruksi & Pajak
  if ([145, 241].includes(bigIdeaId!) ||
      name.includes("keuangan") || name.includes("cash flow") || name.includes("pajak") ||
      name.includes("coretax") || name.includes("pph") || name.includes("ppn") ||
      name.includes("termin") || name.includes("invoice") || name.includes("audit keuangan")) {
    return { taxonomyId: TAX.HUKUM_OPERASIONAL, domainLabel: "Keuangan Proyek Konstruksi, Perpajakan & Pelaporan Keuangan",
      regulasiUtama: "PPh Final Ps.4(2) tarif 1,75%-4%; PPN Jasa Konstruksi PMK 59/2022; UU 7/2021 HPP (HPP); Coretax DJP (berlaku 2025); PSAK 34 Kontrak Konstruksi; SE DJP tentang Construksi",
      sourcesUrl: [{ name: "DJP Online", url: "https://pajak.go.id" }, { name: "Coretax", url: "https://coretax.pajak.go.id" }] };
  }

  // Tata Kelola & ERP
  if ([53, 54, 56, 85].includes(bigIdeaId!) ||
      name.includes("odoo") || name.includes("erp") || name.includes("tata kelola") ||
      name.includes("pjbu") || name.includes("lkut") || name.includes("asosiasi") ||
      name.includes("pembinaan")) {
    if (name.includes("odoo") || name.includes("erp") || bigIdeaId === 53) {
      return { taxonomyId: TAX.ERP_ODOO, domainLabel: "ERP & Odoo Konstruksi — Digitalisasi Tata Kelola BUJK",
        regulasiUtama: "Odoo v16/v17 Community & Enterprise; PSAK 34 Kontrak Konstruksi; PSAK 72 Pendapatan; UU 40/2007 PT; PP 47/2012 Tanggung Jawab Sosial; SE OJK tentang Laporan Keuangan",
        sourcesUrl: [{ name: "Odoo", url: "https://odoo.com" }, { name: "OCA", url: "https://odoo-community.org" }] };
    }
    if (name.includes("lkut") || bigIdeaId === 56) {
      return { taxonomyId: TAX.PJBU, domainLabel: "LKUT (Laporan Keuangan Usaha Tahunan) & Pembinaan BUJK",
        regulasiUtama: "Permen PUPR 19/2014 tentang Pembinaan Jasa Konstruksi; PP 14/2021 Ps. 84-96; SE LPJK tentang LKUT; Permen PUPR 9/2021 tentang Pedoman Pembinaan",
        sourcesUrl: [{ name: "LPJK", url: "https://lpjk.pu.go.id" }] };
    }
    return { taxonomyId: TAX.ASOSIASI, domainLabel: "Tata Kelola & Pembinaan Usaha Jasa Konstruksi",
      regulasiUtama: "UU 2/2017 Jasa Konstruksi; PP 14/2021 tentang Pembinaan; Permen PUPR 9/2021; Permen PUPR 19/2014 Pembinaan; Perpres 192/2014 BPKP",
      sourcesUrl: [{ name: "LPJK", url: "https://lpjk.pu.go.id" }, { name: "PUPR", url: "https://pu.go.id" }] };
  }

  // Legal & Hukum Umum
  if ([204, 205, 206, 207, 208].includes(bigIdeaId!) ||
      name.includes("lex") || name.includes("hukum") || name.includes("legal") ||
      name.includes("pidana") || name.includes("perdata")) {
    return { taxonomyId: TAX.REGULASI_INDUK, domainLabel: "Hukum Bisnis & Korporasi untuk Industri Konstruksi",
      regulasiUtama: "KUHPerdata; KUHDagang; UU 40/2007 PT; UU 2/2017 Jasa Konstruksi; UU 31/1999 Antikorupsi; UU 11/2020 Cipta Kerja; UU 13/2003 Ketenagakerjaan",
      sourcesUrl: [{ name: "JDIH BPK", url: "https://peraturan.bpk.go.id" }] };
  }

  // Ketenagalistrikan & MEP
  if ([175, 176, 177, 178, 179, 180, 181, 182, 183, 184].includes(bigIdeaId!) ||
      name.includes("listrik") || name.includes("elektrikal") || name.includes("mep") ||
      name.includes("mekanikal") || name.includes("iujptl") || name.includes("pltu")) {
    return { taxonomyId: TAX.IUJPTL, domainLabel: "Jasa Konstruksi Ketenagalistrikan & IUJPTL",
      regulasiUtama: "UU 30/2009 Ketenagalistrikan jo UU Cipta Kerja; Permen ESDM 26/2021 IUJPTL; SNI 04-0225-2011 PUIL; Permen ESDM 38/2018 K2 Instalasi Listrik; PP 14/2012 Usaha Ketenagalistrikan",
      sourcesUrl: [{ name: "Kementerian ESDM", url: "https://esdm.go.id" }, { name: "PLN", url: "https://pln.co.id" }] };
  }

  // Properti & Real Estate
  if ([190, 191, 192, 193, 194, 195, 196, 197, 198, 199].includes(bigIdeaId!) ||
      name.includes("properti") || name.includes("real estate") || name.includes("rumah") ||
      name.includes("apartemen") || name.includes("kawasan")) {
    return { taxonomyId: TAX.PERIZINAN_BANGUNAN, domainLabel: "Properti & Real Estate — Perizinan & Regulasi",
      regulasiUtama: "UU 28/2002 Bangunan Gedung; UU 11/2020 Cipta Kerja; PP 16/2021 PBG; UU 1/2011 Perumahan; Permen ATR/BPN 18/2021 RDTR; UU 26/2007 Penataan Ruang",
      sourcesUrl: [{ name: "OSS RBA", url: "https://oss.go.id" }, { name: "ATR/BPN", url: "https://atrbpn.go.id" }] };
  }

  // Default: General Construction
  return { taxonomyId: TAX.REGULASI_INDUK, domainLabel: "Regulasi Umum Industri Jasa Konstruksi Indonesia",
    regulasiUtama: "UU 2/2017 Jasa Konstruksi jo UU 11/2020 Cipta Kerja; PP 22/2020 jo PP 14/2021; Permen PUPR 6/2021; Permen PUPR 7/2024 tentang Standar Jasa Konstruksi; SNI terkait",
    sourcesUrl: [{ name: "JDIH PUPR", url: "https://jdih.pu.go.id" }, { name: "LPJK", url: "https://lpjk.pu.go.id" }] };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE KB ENTRIES FOR ONE AGENT
// ─────────────────────────────────────────────────────────────────────────────
interface AgentRow {
  id: number;
  name: string;
  behavior_preset: string;
  description: string;
  system_prompt: string;
  expertise: any;
  domain_charter: string;
  quality_bar: string;
  risk_compliance: string;
  product_summary: string;
  big_idea_id: number | null;
}

interface KBEntry {
  agent_id: number;
  name: string;
  type: string;
  content: string;
  description: string;
  knowledge_layer: string;
  taxonomy_id: number;
  source_authority: string;
  source_url: string | null;
  status: string;
  is_shared: boolean;
  shared_scope: string | null;
}

function generateKBEntries(agent: AgentRow): KBEntry[] {
  const domain = getDomainByBigIdeaId(agent.big_idea_id, agent.name, agent.behavior_preset);
  const isHub = agent.behavior_preset === "orchestrator";
  const entries: KBEntry[] = [];

  // ── 1. FOUNDATIONAL: Regulasi & Standar ─────────────────────────────────
  const expertiseText = Array.isArray(agent.expertise)
    ? agent.expertise.slice(0, 8).map((e: any) => {
        if (typeof e === "string") return `• ${e}`;
        if (e && typeof e === "object") return `• ${e.name || e.label || e.title || JSON.stringify(e)}`;
        return `• ${String(e)}`;
      }).join("\n")
    : "";

  const descriptionText = (agent.description || "").substring(0, 500);
  const systemPromptExcerpt = extractRegulasFromSystemPrompt(agent.system_prompt || "");

  const foundationalContent = `# Dasar Regulasi & Standar — ${agent.name}

## Domain
${domain.domainLabel}

## Regulasi Utama yang Berlaku
${domain.regulasiUtama}

${systemPromptExcerpt ? `## Regulasi Spesifik dari Konfigurasi Agent\n${systemPromptExcerpt}\n` : ""}
## Deskripsi Agent
${descriptionText}

${expertiseText ? `## Area Keahlian Utama\n${expertiseText}` : ""}`.trim();

  entries.push({
    agent_id: agent.id,
    name: `Regulasi & Standar — ${agent.name.substring(0, 80)}`,
    type: "text",
    content: foundationalContent,
    description: `Dasar regulasi dan standar yang menjadi landasan kerja ${agent.name}`,
    knowledge_layer: "foundational",
    taxonomy_id: domain.taxonomyId,
    source_authority: domain.regulasiUtama.split(";")[0].trim(),
    source_url: domain.sourcesUrl?.[0]?.url || null,
    status: "active",
    is_shared: false,
    shared_scope: null,
  });

  // ── 2. OPERATIONAL: SOP & Prosedur ──────────────────────────────────────
  const qualityBarText = (agent.quality_bar || "").substring(0, 600);
  const productSummaryText = (agent.product_summary || "").substring(0, 600);

  const expertiseList = Array.isArray(agent.expertise)
    ? agent.expertise.slice(0, 12).map((e: any, i: number) => {
        if (typeof e === "string") return `${i + 1}. ${e}`;
        if (e && typeof e === "object") return `${i + 1}. ${e.name || e.label || e.title || e.description || ""}${e.description ? ": " + e.description.substring(0, 120) : ""}`;
        return `${i + 1}. ${String(e)}`;
      }).join("\n")
    : "";

  const operationalContent = `# SOP & Prosedur Operasional — ${agent.name}

## Cara Kerja Agent
${productSummaryText || descriptionText}

${expertiseList ? `## Spesialisasi & Kompetensi\n${expertiseList}\n` : ""}
${qualityBarText ? `## Standar Kualitas Output\n${qualityBarText}\n` : ""}
## Panduan Penggunaan
- Ajukan pertanyaan spesifik dengan konteks proyek/perusahaan yang jelas
- Sertakan data numerik (luas, volume, nilai kontrak) jika relevan
- Minta referensi peraturan yang berlaku pada setiap saran yang diberikan
- Output dapat berupa dokumen, checklist, analisis, atau simulasi sesuai permintaan`.trim();

  entries.push({
    agent_id: agent.id,
    name: `SOP & Prosedur — ${agent.name.substring(0, 80)}`,
    type: "text",
    content: operationalContent,
    description: `Prosedur operasional, spesialisasi, dan panduan penggunaan ${agent.name}`,
    knowledge_layer: "operational",
    taxonomy_id: domain.taxonomyId,
    source_authority: agent.name,
    source_url: null,
    status: "active",
    is_shared: false,
    shared_scope: null,
  });

  // ── 3. COMPLIANCE: Guardrails & Batas Domain ────────────────────────────
  const domainCharterText = (agent.domain_charter || "").substring(0, 700);
  const riskComplianceText = (agent.risk_compliance || "").substring(0, 500);

  const complianceContent = `# Guardrails & Batasan Domain — ${agent.name}

${domainCharterText ? `## Domain Charter\n${domainCharterText}\n` : ""}
${riskComplianceText ? `## Manajemen Risiko & Kepatuhan\n${riskComplianceText}\n` : ""}
## Prinsip Kepatuhan
- Seluruh saran mengacu pada regulasi dan standar yang berlaku di Indonesia
- Tidak memberikan nasihat hukum yang menggantikan konsultasi profesional bersertifikat
- Konten diperbarui mengikuti perubahan regulasi terbaru (Permen PUPR, SE, Perpres)
- Data dan informasi sensitif klien tidak disimpan di luar sesi percakapan
- Referensi ke sumber resmi: JDIH PUPR, LPJK, OSS-RBA, DJP, LKPP

## Disclaimer
Agent ini adalah alat bantu AI untuk industri konstruksi Indonesia. Keputusan akhir
tetap berada pada pengguna yang bertanggung jawab secara profesional.`.trim();

  entries.push({
    agent_id: agent.id,
    name: `Guardrails & Compliance — ${agent.name.substring(0, 80)}`,
    type: "text",
    content: complianceContent,
    description: `Guardrails, batasan domain, dan panduan kepatuhan ${agent.name}`,
    knowledge_layer: "compliance",
    taxonomy_id: domain.taxonomyId,
    source_authority: "Domain Charter & Risk Compliance",
    source_url: null,
    status: "active",
    is_shared: false,
    shared_scope: null,
  });

  // ── 4. TACTICAL (HUBs only): Multi-Agent & Routing ──────────────────────
  if (isHub) {
    const urlEntries = domain.sourcesUrl || [];
    const urlText = urlEntries.map(u => `- **${u.name}**: ${u.url}`).join("\n");

    const tacticalContent = `# Panduan Routing Multi-Agent — ${agent.name}

## Peran sebagai Orchestrator
${agent.name} adalah HUB orchestrator yang mengelola dan merutekan permintaan ke
sub-agen spesialis sesuai topik dan konteks pertanyaan.

## Prinsip Routing
1. Identifikasi intent utama dari pertanyaan pengguna
2. Pilih specialist agent yang paling relevan berdasarkan domain keahlian
3. Untuk pertanyaan lintas-domain, koordinasikan antara beberapa specialist
4. Berikan ringkasan terpadu dari output semua specialist yang terlibat

## Referensi Sumber Resmi
${urlText || "- Lihat regulasi utama pada KB Foundational"}

## Kemampuan Platform
- Analisis dokumen multi-format (PDF, Excel, Word, Image)
- Generate laporan, checklist, dan dokumen formal
- Simulasi skenario dan kalkulasi teknis
- Panduan step-by-step berbasis regulasi terkini`.trim();

    entries.push({
      agent_id: agent.id,
      name: `Routing & Sumber Referensi — ${agent.name.substring(0, 70)}`,
      type: "text",
      content: tacticalContent,
      description: `Panduan routing multi-agent dan sumber referensi resmi untuk ${agent.name}`,
      knowledge_layer: "tactical",
      taxonomy_id: domain.taxonomyId,
      source_authority: "Multi-Agent Orchestration Guide",
      source_url: domain.sourcesUrl?.[0]?.url || null,
      status: "active",
      is_shared: false,
      shared_scope: null,
    });

    // URL KB entries for official sources
    if (urlEntries.length > 0) {
      urlEntries.slice(0, 2).forEach(urlEntry => {
        entries.push({
          agent_id: agent.id,
          name: `Referensi Web: ${urlEntry.name}`,
          type: "url",
          content: `Sumber resmi: ${urlEntry.name} — ${urlEntry.url}\nRelevan untuk domain: ${domain.domainLabel}\nRegulasi: ${domain.regulasiUtama.split(";")[0].trim()}`,
          description: `Tautan ke sumber referensi resmi ${urlEntry.name} untuk domain ${domain.domainLabel}`,
          knowledge_layer: "foundational",
          taxonomy_id: domain.taxonomyId,
          source_authority: urlEntry.name,
          source_url: urlEntry.url,
          status: "active",
          is_shared: true,
          shared_scope: "platform",
        });
      });
    }
  }

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Extract regulations mentioned in system_prompt
// ─────────────────────────────────────────────────────────────────────────────
function extractRegulasFromSystemPrompt(systemPrompt: string): string {
  if (!systemPrompt || systemPrompt.length < 50) return "";

  // Look for regulation patterns
  const regexPatterns = [
    /(?:UU|PP|Perpres|Permen|PerLem|SE|Peraturan|SNI|ISO|PMBOK|FIDIC)[^\n]{5,80}/gi,
  ];

  const found = new Set<string>();
  for (const rx of regexPatterns) {
    const matches = systemPrompt.match(rx) || [];
    matches.slice(0, 8).forEach(m => {
      const cleaned = m.trim().replace(/\s+/g, " ");
      if (cleaned.length > 8 && cleaned.length < 120) found.add(cleaned);
    });
  }

  if (found.size === 0) return "";
  return Array.from(found).slice(0, 8).map(r => `• ${r}`).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEEDER
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();

  try {
    // 1. Get agents that DON'T have KB yet
    const { rows: agents } = await client.query<AgentRow>(`
      SELECT 
        a.id, a.name, a.behavior_preset, a.description, a.system_prompt,
        a.expertise, a.domain_charter, a.quality_bar, a.risk_compliance,
        a.product_summary, a.big_idea_id
      FROM agents a
      WHERE a.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM knowledge_bases kb WHERE kb.agent_id = a.id
        )
      ORDER BY a.id
    `);

    console.log(`\n📚 Mulai seed Knowledge Base untuk ${agents.length} agen...\n`);

    let inserted = 0;
    let failed = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < agents.length; i += BATCH_SIZE) {
      const batch = agents.slice(i, i + BATCH_SIZE);
      const allEntries: KBEntry[] = [];

      for (const agent of batch) {
        const entries = generateKBEntries(agent);
        allEntries.push(...entries);
      }

      // Bulk insert
      if (allEntries.length === 0) continue;

      // Build parameterized query
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIdx = 1;

      for (const e of allEntries) {
        placeholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, ` +
          `$${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, ` +
          `$${paramIdx++}, NOW())`
        );
        values.push(
          e.agent_id, e.name, e.type, e.content, e.description,
          e.knowledge_layer, e.taxonomy_id, e.source_authority, e.source_url,
          e.status, e.is_shared
        );
      }

      try {
        await client.query(`
          INSERT INTO knowledge_bases 
            (agent_id, name, type, content, description, knowledge_layer, taxonomy_id,
             source_authority, source_url, status, is_shared, created_at)
          VALUES ${placeholders.join(", ")}
        `, values);

        inserted += allEntries.length;
        const batchStart = i + 1;
        const batchEnd = Math.min(i + BATCH_SIZE, agents.length);
        console.log(`  ✅ Batch agen #${batchStart}-${batchEnd}: +${allEntries.length} KB entries`);
      } catch (err: any) {
        console.error(`  ❌ Batch gagal (agen ${i}-${i + BATCH_SIZE}):`, err.message);
        failed += batch.length;
      }
    }

    // 2. Update rag_enabled for all agents that now have KB
    const { rowCount: ragUpdated } = await client.query(`
      UPDATE agents SET rag_enabled = true
      WHERE is_active = true
        AND EXISTS (SELECT 1 FROM knowledge_bases kb WHERE kb.agent_id = agents.id)
        AND (rag_enabled IS NULL OR rag_enabled = false)
    `);

    // 3. Set default RAG params for agents missing them
    const { rowCount: ragParams } = await client.query(`
      UPDATE agents SET
        rag_chunk_size = COALESCE(rag_chunk_size, 512),
        rag_chunk_overlap = COALESCE(rag_chunk_overlap, 64),
        rag_top_k = COALESCE(rag_top_k, 5)
      WHERE is_active = true
        AND EXISTS (SELECT 1 FROM knowledge_bases kb WHERE kb.agent_id = agents.id)
    `);

    // 4. Final stats
    const { rows: finalStats } = await client.query(`
      SELECT 
        COUNT(*) as total_kb,
        COUNT(DISTINCT agent_id) as agents_covered,
        COUNT(*) FILTER (WHERE knowledge_layer='foundational') as foundational,
        COUNT(*) FILTER (WHERE knowledge_layer='operational') as operational,
        COUNT(*) FILTER (WHERE knowledge_layer='compliance') as compliance,
        COUNT(*) FILTER (WHERE knowledge_layer='tactical') as tactical,
        COUNT(*) FILTER (WHERE type='url') as url_type
      FROM knowledge_bases
    `);

    const { rows: totalAgents } = await client.query(
      "SELECT COUNT(*) as total FROM agents WHERE is_active=true"
    );

    console.log("\n═══════════════════════════════════════════════════");
    console.log("✅ SELESAI — Ringkasan Knowledge Base Seeding");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Total agen aktif      : ${totalAgents[0].total}`);
    console.log(`Agen tercakup KB      : ${finalStats[0].agents_covered}`);
    console.log(`Total KB entries      : ${finalStats[0].total_kb}`);
    console.log(`  → Foundational      : ${finalStats[0].foundational}`);
    console.log(`  → Operational       : ${finalStats[0].operational}`);
    console.log(`  → Compliance        : ${finalStats[0].compliance}`);
    console.log(`  → Tactical (HUBs)   : ${finalStats[0].tactical}`);
    console.log(`  → URL refs          : ${finalStats[0].url_type}`);
    console.log(`KB entries inserted   : ${inserted}`);
    console.log(`RAG enabled updated   : ${ragUpdated}`);
    console.log(`RAG params set        : ${ragParams}`);
    if (failed > 0) console.log(`⚠ Agen gagal          : ${failed}`);
    console.log("═══════════════════════════════════════════════════\n");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
