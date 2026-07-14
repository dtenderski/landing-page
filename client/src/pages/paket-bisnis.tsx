import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, CheckCircle2, MessageCircle, Building2, Zap, Pickaxe, Flame, GraduationCap, Users, Home, Globe } from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20tertarik%20dengan%20Paket%20Bisnis%20AI%20per%20Segmen.%20Bisa%20info%20lebih%20lanjut%3F";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}


type Claw = { name: string; route: string; desc: string; shared?: boolean };
type Segment = { name: string; icon: string; claws: Claw[] };
type Sector = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string; segments: Segment[] };

const SECTORS: Sector[] = [
  {
    id: "konstruksi",
    label: "Konstruksi",
    icon: Building2,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
    segments: [
      {
        name: "Kontraktor BUJK",
        icon: "🏗️",
        claws: [
          { name: "TenderaClaw", route: "/tendera-claw", desc: "AI Tender BUJK — analisis dokumen, strategi penawaran" },
          { name: "KonstraTenderClaw", route: "/konstra-tender-claw", desc: "Monitor tender SIRUP & LPSE real-time" },
          { name: "SBUClaw", route: "/sbu-claw", desc: "Panduan sertifikasi SBU Konstruksi" },
          { name: "SkemaClaw", route: "/skema-claw", desc: "Sertifikasi BUJK Permen PU 6/2025" },
          { name: "LKUTClaw", route: "/lkut-claw", desc: "Laporan Keuangan Usaha Jasa Konstruksi" },
          { name: "PUB-LKUTClaw", route: "/pub-lkut-claw", desc: "Pengembangan Usaha Berkelanjutan & LKUT" },
          { name: "KeuanganClaw", route: "/keuangan-claw", desc: "Analisis keuangan & kesehatan BUJK" },
          { name: "PJBUClaw", route: "/pjbu-claw", desc: "Personel Manajerial BUJK" },
          { name: "KonstraClaw", route: "/konstra-claw", desc: "Manajemen proyek konstruksi end-to-end" },
          { name: "BrainClaw", route: "/brain-claw", desc: "Project Intelligence & SCORECARD Win Probability" },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Manajemen kontrak & klaim konstruksi", shared: true },
          { name: "QSClaw", route: "/qs-claw", desc: "Quantity Surveying & estimasi biaya RAB", shared: true },
          { name: "SMK3Claw", route: "/smk3-claw", desc: "IMS & SMK3 terintegrasi" },
          { name: "CSMSClaw", route: "/csms-claw", desc: "Contractor Safety Management System" },
          { name: "K3ManClaw", route: "/k3man-claw", desc: "Manajemen K3 Konstruksi & SKK" },
          { name: "BIMClaw", route: "/bim-claw", desc: "Konstruksi Digital & BIM" },
          { name: "SiteOpsClaw", route: "/siteops-claw", desc: "Operasional lapangan & site management" },
          { name: "ESIMPANClaw", route: "/esimpan-claw", desc: "Input pengalaman BUJK & TKK di E-SIMPAN" },
          { name: "OSSClaw", route: "/oss-claw", desc: "OSS-RBA, NIB & perizinan usaha" },
          { name: "ISOClaw 9001", route: "/iso-claw-9001", desc: "Sistem Manajemen Mutu ISO 9001" },
          { name: "ISOClaw 14001", route: "/iso-claw-14001", desc: "Sistem Manajemen Lingkungan ISO 14001" },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG & keberlanjutan korporasi" },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak Indonesia — PPh badan, PPN, dll", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Kegiatan Penanaman Modal BKPM" },
        ],
      },
      {
        name: "Konsultan Konstruksi",
        icon: "📐",
        claws: [
          { name: "KKClaw", route: "/kk-claw", desc: "Jasa Konsultansi Konstruksi — regulasi & praktik" },
          { name: "PengawasClaw", route: "/pengawas-claw", desc: "Pengawas Konstruksi & SKK Pengawas" },
          { name: "SipilClaw", route: "/sipil-claw", desc: "Konsultan Teknik Sipil" },
          { name: "MEPClaw", route: "/mep-claw", desc: "Konsultan Mekanikal-Elektrikal-Plumbing" },
          { name: "ArsitekturClaw", route: "/arsitektur-claw", desc: "SKK Klasifikasi Arsitektur" },
          { name: "GeoteknikClaw", route: "/geoteknik-claw", desc: "SKK Sipil — Geoteknik" },
          { name: "JalanJembatanClaw", route: "/jalanjembatan-claw", desc: "SKK Sipil — Jalan & Jembatan" },
          { name: "TataLingkunganClaw", route: "/tatalingkungan-claw", desc: "SKK Tata Lingkungan" },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "Konsultan Lingkungan Hidup & AMDAL" },
          { name: "SurveiPemetaanClaw", route: "/surveipemetaan-claw", desc: "SKK Survei & Pemetaan" },
          { name: "DesainClaw", route: "/desain-claw", desc: "Konsultan Desain Arsitektur" },
          { name: "BIMClaw", route: "/bim-claw", desc: "BIM & Konstruksi Digital", shared: true },
          { name: "QSClaw", route: "/qs-claw", desc: "Quantity Surveying & estimasi biaya", shared: true },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Manajemen kontrak & klaim", shared: true },
          { name: "NSPKNavigatorClaw", route: "/nspk-navigator-claw", desc: "Panduan NSPK & Standar Teknis PU" },
          { name: "TenderaClaw", route: "/tendera-claw", desc: "AI Tender — analisis dokumen & strategi", shared: true },
        ],
      },
      {
        name: "Owner / Bowheer",
        icon: "🏢",
        claws: [
          { name: "TenderaClaw", route: "/tendera-claw", desc: "AI Tender — evaluasi penawaran & strategi", shared: true },
          { name: "KonstraTenderClaw", route: "/konstra-tender-claw", desc: "Monitor tender SIRUP & LPSE", shared: true },
          { name: "BrainClaw", route: "/brain-claw", desc: "Project Intelligence & monitoring proyek", shared: true },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Manajemen kontrak & klaim", shared: true },
          { name: "PengawasClaw", route: "/pengawas-claw", desc: "Pengawasan konstruksi & quality control", shared: true },
          { name: "QSClaw", route: "/qs-claw", desc: "Quantity Surveying & kontrol biaya", shared: true },
          { name: "NSPKNavigatorClaw", route: "/nspk-navigator-claw", desc: "Panduan NSPK & Standar Teknis", shared: true },
          { name: "SMAPClaw", route: "/smap-claw", desc: "ISO 37001 Anti-Penyuapan — tata kelola" },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG & pelaporan keberlanjutan", shared: true },
        ],
      },
      {
        name: "Supplier & Distributor",
        icon: "📦",
        claws: [
          { name: "OSSClaw", route: "/oss-claw", desc: "OSS-RBA, NIB & perizinan usaha", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Kegiatan Penanaman Modal", shared: true },
          { name: "SupplyChainClaw", route: "/supply-chain-claw", desc: "Supply Chain & Logistics management" },
          { name: "EcommerceClaw", route: "/ecommerce-claw", desc: "E-Commerce B2B material konstruksi" },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak Indonesia — PPh badan & PPN", shared: true },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Manajemen kontrak pengadaan", shared: true },
          { name: "CrmSalesClaw", route: "/crm-sales-claw", desc: "CRM & Sales untuk distribusi B2B" },
        ],
      },
      {
        name: "Tenaga Kerja Konstruksi",
        icon: "👷",
        claws: [
          { name: "PanduanASKOM", route: "/panduan-askom", desc: "Tanya Jawab SKK — panduan sertifikasi kompetensi" },
          { name: "TerasLPJK#1", route: "/teras-lpjk-1", desc: "Sharing Knowledge Sertifikasi SKK LPJK" },
          { name: "ManprojakClaw", route: "/manprojak-claw", desc: "SKK Manajemen Pelaksanaan Proyek" },
          { name: "SafiraClaw", route: "/safira-claw", desc: "SKK K3 Konstruksi — kompetensi K3" },
          { name: "K3ManClaw", route: "/k3man-claw", desc: "Manajemen K3 & persiapan SKK K3", shared: true },
          { name: "ArsitekturClaw", route: "/arsitektur-claw", desc: "SKK Klasifikasi Arsitektur", shared: true },
          { name: "GeoteknikClaw", route: "/geoteknik-claw", desc: "SKK Sipil — Geoteknik", shared: true },
          { name: "JalanJembatanClaw", route: "/jalanjembatan-claw", desc: "SKK Sipil — Jalan & Jembatan", shared: true },
          { name: "ElektrikalClaw", route: "/elektrikal-claw", desc: "SKK Klasifikasi Elektrikal" },
          { name: "TutorTeknikClaw", route: "/tutor-teknik-claw", desc: "AI Tutor Teknik — persiapan uji kompetensi" },
        ],
      },
      {
        name: "LSP & TUK",
        icon: "🏛️",
        claws: [
          { name: "IBTUClaw", route: "/ibtu-claw", desc: "IB Testing Unit AI — simulasi uji kompetensi" },
          { name: "PanduanASKOM", route: "/panduan-askom", desc: "Panduan SKK — basis pengetahuan asesor", shared: true },
          { name: "TerasLPJK#1", route: "/teras-lpjk-1", desc: "Sharing Knowledge Sertifikasi SKK", shared: true },
          { name: "LdKompetensiClaw", route: "/ld-kompetensi-claw", desc: "Learning & Development — desain program pelatihan" },
          { name: "PenilaianKinerjaClaw", route: "/penilaian-kinerja-claw", desc: "Manajemen Kinerja & asesmen kompetensi" },
        ],
      },
      {
        name: "Asesor Kompetensi",
        icon: "📋",
        claws: [
          { name: "PanduanASKOM", route: "/panduan-askom", desc: "Basis pengetahuan SKKNI & skema sertifikasi", shared: true },
          { name: "TerasLPJK#1", route: "/teras-lpjk-1", desc: "Sharing Knowledge & update regulasi SKK", shared: true },
          { name: "IBTUClaw", route: "/ibtu-claw", desc: "Simulasi uji kompetensi & validasi soal", shared: true },
          { name: "NSPKNavigatorClaw", route: "/nspk-navigator-claw", desc: "Referensi NSPK & Standar Teknis", shared: true },
        ],
      },
      {
        name: "LSBU & Asesor Badan Usaha",
        icon: "🏅",
        claws: [
          { name: "ABUClaw", route: "/abu-claw", desc: "Konsultan ABU & LSBU — verifikasi badan usaha" },
          { name: "PanduanSBU", route: "/panduan-sbu", desc: "Tanya Jawab SBU — panduan lengkap" },
          { name: "SBUClaw", route: "/sbu-claw", desc: "SBU Konstruksi — analisis kelayakan", shared: true },
          { name: "SkemaClaw", route: "/skema-claw", desc: "Sertifikasi BUJK Permen PU 6/2025", shared: true },
          { name: "LKUTClaw", route: "/lkut-claw", desc: "Verifikasi LKUT BUJK", shared: true },
        ],
      },
      {
        name: "Asosiasi Badan Usaha & Profesi",
        icon: "🤝",
        claws: [
          { name: "SBUClaw", route: "/sbu-claw", desc: "SBU Konstruksi — regulasi & panduan anggota", shared: true },
          { name: "ABUClaw", route: "/abu-claw", desc: "Konsultan ABU & LSBU — dukungan anggota", shared: true },
          { name: "NSPKNavigatorClaw", route: "/nspk-navigator-claw", desc: "Panduan NSPK & Standar Teknis PU", shared: true },
          { name: "SMAPClaw", route: "/smap-claw", desc: "ISO 37001 Anti-Penyuapan — advokasi tata kelola" },
          { name: "PanCEKClaw", route: "/pancek-claw", desc: "KPK — literasi antikorupsi" },
          { name: "PanduanASKOM", route: "/panduan-askom", desc: "Panduan SKK untuk anggota profesi", shared: true },
          { name: "TerasLPJK#1", route: "/teras-lpjk-1", desc: "Sharing Knowledge Sertifikasi SKK", shared: true },
        ],
      },
    ],
  },
  {
    id: "ketenagalistrikan",
    label: "Ketenagalistrikan",
    icon: Zap,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    segments: [
      {
        name: "Perusahaan Distribusi & Transmisi",
        icon: "⚡",
        claws: [
          { name: "TransmisiClaw", route: "/transmisi-claw", desc: "Transmisi & Gardu Induk PLN — panduan teknis" },
          { name: "KetenagalistrikanClaw", route: "/ketenagalistrikan-claw", desc: "Regulasi & perizinan ketenagalistrikan" },
          { name: "SMK3Claw", route: "/smk3-claw", desc: "IMS & SMK3 — K3 instalasi listrik", shared: true },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG & pelaporan keberlanjutan PLN", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Penanaman Modal & BKPM", shared: true },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak badan ketenagalistrikan", shared: true },
          { name: "HubunganIndustrialClaw", route: "/hubungan-industrial-claw", desc: "HR & Industrial Relations" },
        ],
      },
      {
        name: "Kontraktor Instalasi Listrik",
        icon: "🔌",
        claws: [
          { name: "KetenagalistrikanClaw", route: "/ketenagalistrikan-claw", desc: "Regulasi & IUJPTL perizinan", shared: true },
          { name: "ElektrikalClaw", route: "/elektrikal-claw", desc: "SKK Klasifikasi Elektrikal" },
          { name: "IMClaw", route: "/im-claw", desc: "Instalasi Mekanikal-Elektrikal" },
          { name: "SBUClaw", route: "/sbu-claw", desc: "SBU sub-bidang ME", shared: true },
          { name: "OSSClaw", route: "/oss-claw", desc: "NIB & perizinan usaha listrik", shared: true },
          { name: "SMK3Claw", route: "/smk3-claw", desc: "K3 instalasi listrik", shared: true },
        ],
      },
      {
        name: "Konsultan Ketenagalistrikan",
        icon: "📊",
        claws: [
          { name: "KetenagalistrikanClaw", route: "/ketenagalistrikan-claw", desc: "Konsultasi regulasi & perizinan" },
          { name: "TransmisiClaw", route: "/transmisi-claw", desc: "Transmisi & Gardu Induk — analisis teknis", shared: true },
          { name: "EnergiClaw", route: "/energi-claw", desc: "Konsultan Energi & EBT" },
          { name: "MEPClaw", route: "/mep-claw", desc: "Konsultan MEP — sistem kelistrikan gedung", shared: true },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "AMDAL & dampak lingkungan", shared: true },
        ],
      },
      {
        name: "Produsen & Developer EBT",
        icon: "☀️",
        claws: [
          { name: "EBTSolarClaw", route: "/ebt-solar-claw", desc: "PLTS & Energi Surya — regulasi & teknis" },
          { name: "EnergiClaw", route: "/energi-claw", desc: "Konsultan Energi & EBT lintas teknologi" },
          { name: "TransisiEnergiClaw", route: "/transisi-energi-claw", desc: "Strategi transisi energi nasional" },
          { name: "ETLOAcademyClaw", route: "/etlo-academy-claw", desc: "Sertifikasi EBT & program energi" },
          { name: "ETLOBizDevClaw", route: "/etlo-bizdev-claw", desc: "Strategi bisnis & pengembangan ETLO" },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "AMDAL & studi lingkungan proyek EBT", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Penanaman Modal EBT", shared: true },
        ],
      },
      {
        name: "Tenaga Teknik Ketenagalistrikan",
        icon: "👷",
        claws: [
          { name: "ElektrikalClaw", route: "/elektrikal-claw", desc: "SKK Elektrikal — persiapan sertifikasi", shared: true },
          { name: "KetenagalistrikanClaw", route: "/ketenagalistrikan-claw", desc: "Regulasi & standar teknis listrik", shared: true },
          { name: "SafiraClaw", route: "/safira-claw", desc: "SKK K3 — keselamatan kerja listrik", shared: true },
          { name: "TutorTeknikClaw", route: "/tutor-teknik-claw", desc: "AI Tutor Teknik — persiapan uji kompetensi", shared: true },
        ],
      },
    ],
  },
  {
    id: "pertambangan",
    label: "Pertambangan",
    icon: Pickaxe,
    color: "text-stone-700",
    bg: "bg-stone-50",
    border: "border-stone-300",
    segments: [
      {
        name: "Perusahaan Tambang (IUP/IUPK)",
        icon: "⛏️",
        claws: [
          { name: "PertambanganClaw", route: "/pertambangan-claw", desc: "Konsultan Pertambangan — regulasi & operasi" },
          { name: "GeologiClaw", route: "/geologi-claw", desc: "Geologi & Eksplorasi — analisis cadangan" },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "AMDAL, reklamasi & pasca-tambang" },
          { name: "SMK3Claw", route: "/smk3-claw", desc: "K3 Pertambangan & SMK3", shared: true },
          { name: "K3ManClaw", route: "/k3man-claw", desc: "Manajemen K3 operasi tambang", shared: true },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG & keberlanjutan tambang", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Penanaman Modal BKPM", shared: true },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak pertambangan — royalti & PPh badan", shared: true },
        ],
      },
      {
        name: "Kontraktor Tambang",
        icon: "🚧",
        claws: [
          { name: "PertambanganClaw", route: "/pertambangan-claw", desc: "Regulasi & operasi jasa pertambangan", shared: true },
          { name: "OffshoreSafetyClaw", route: "/offshore-safety-claw", desc: "K3 operasi tambang & migas — safety management" },
          { name: "SMK3Claw", route: "/smk3-claw", desc: "SMK3 & IMS kontraktor tambang", shared: true },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Manajemen kontrak jasa tambang", shared: true },
          { name: "SupplyChainClaw", route: "/supply-chain-claw", desc: "Supply chain & logistik alat berat", shared: true },
        ],
      },
      {
        name: "Konsultan Pertambangan",
        icon: "📐",
        claws: [
          { name: "GeologiClaw", route: "/geologi-claw", desc: "Geologi, eksplorasi & studi kelayakan" },
          { name: "PertambanganClaw", route: "/pertambangan-claw", desc: "Regulasi IUP & teknis pertambangan", shared: true },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "AMDAL & studi lingkungan tambang", shared: true },
          { name: "GeoteknikClaw", route: "/geoteknik-claw", desc: "Geoteknik — stabilitas lereng & tambang", shared: true },
        ],
      },
      {
        name: "Tenaga Kerja Tambang",
        icon: "👷",
        claws: [
          { name: "PertambanganClaw", route: "/pertambangan-claw", desc: "Regulasi & standar kerja tambang", shared: true },
          { name: "SafiraClaw", route: "/safira-claw", desc: "SKK K3 — keselamatan kerja tambang", shared: true },
          { name: "K3ManClaw", route: "/k3man-claw", desc: "Manajemen K3 & uji kompetensi K3", shared: true },
          { name: "TutorTeknikClaw", route: "/tutor-teknik-claw", desc: "AI Tutor Teknik — persiapan sertifikasi", shared: true },
        ],
      },
    ],
  },
  {
    id: "migas",
    label: "Migas",
    icon: Flame,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-300",
    segments: [
      {
        name: "Perusahaan Hulu (Eksplorasi & Produksi)",
        icon: "🛢️",
        claws: [
          { name: "MigasClaw", route: "/migas-claw", desc: "Kompetensi & Perizinan Energi Migas" },
          { name: "GeologiClaw", route: "/geologi-claw", desc: "Geologi & Eksplorasi — analisis cadangan migas" },
          { name: "OffshoreSafetyClaw", route: "/offshore-safety-claw", desc: "K3 & Operasi Migas Offshore — safety kritis" },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "AMDAL & manajemen lingkungan migas", shared: true },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG & dekarbonisasi sektor migas", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Penanaman Modal hulu migas", shared: true },
        ],
      },
      {
        name: "Kontraktor KKKS & Jasa Penunjang",
        icon: "🔧",
        claws: [
          { name: "MigasClaw", route: "/migas-claw", desc: "Regulasi KKKS & perizinan SKK Migas", shared: true },
          { name: "OffshoreSafetyClaw", route: "/offshore-safety-claw", desc: "K3 offshore & safety management system" },
          { name: "SMK3Claw", route: "/smk3-claw", desc: "SMK3 & IMS kontraktor migas", shared: true },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Manajemen kontrak migas & cost recovery", shared: true },
          { name: "SupplyChainClaw", route: "/supply-chain-claw", desc: "Supply chain & logistik operasi migas", shared: true },
        ],
      },
      {
        name: "Konsultan Migas",
        icon: "📊",
        claws: [
          { name: "MigasClaw", route: "/migas-claw", desc: "Regulasi, perizinan & kompetensi migas" },
          { name: "GeologiClaw", route: "/geologi-claw", desc: "Studi geologi & cadangan migas", shared: true },
          { name: "OffshoreSafetyClaw", route: "/offshore-safety-claw", desc: "Audit K3 & safety case migas", shared: true },
          { name: "EnergiClaw", route: "/energi-claw", desc: "Transisi energi dari migas ke EBT", shared: true },
          { name: "TransisiEnergiClaw", route: "/transisi-energi-claw", desc: "Strategi dekarbonisasi & transisi energi", shared: true },
        ],
      },
      {
        name: "Penyedia Jasa & Supplier Migas",
        icon: "📦",
        claws: [
          { name: "MigasClaw", route: "/migas-claw", desc: "Perizinan penyedia jasa SKK Migas", shared: true },
          { name: "OSSClaw", route: "/oss-claw", desc: "NIB & perizinan OSS-RBA bidang migas", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Penanaman Modal supplier", shared: true },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak jasa penunjang migas", shared: true },
        ],
      },
      {
        name: "Tenaga Kerja Migas",
        icon: "👷",
        claws: [
          { name: "MigasClaw", route: "/migas-claw", desc: "Regulasi kompetensi & sertifikasi migas", shared: true },
          { name: "OffshoreSafetyClaw", route: "/offshore-safety-claw", desc: "Keselamatan kerja offshore & sertifikasi BOSIET", shared: true },
          { name: "SafiraClaw", route: "/safira-claw", desc: "SKK K3 — keselamatan kerja migas", shared: true },
          { name: "TutorTeknikClaw", route: "/tutor-teknik-claw", desc: "AI Tutor persiapan uji kompetensi migas", shared: true },
        ],
      },
    ],
  },
  {
    id: "properti",
    label: "Properti & Real Estate",
    icon: Home,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-300",
    segments: [
      {
        name: "Developer / Pengembang",
        icon: "🏙️",
        claws: [
          { name: "DevPropertiClaw", route: "/dev-properti-claw", desc: "Developer Real Estate — strategi & regulasi" },
          { name: "DesainClaw", route: "/desain-claw", desc: "Desain Arsitektur & konsep bangunan", shared: true },
          { name: "BIMClaw", route: "/bim-claw", desc: "BIM & Konstruksi Digital untuk developer", shared: true },
          { name: "LingkunganClaw", route: "/lingkungan-claw", desc: "AMDAL & perizinan lingkungan", shared: true },
          { name: "OSSClaw", route: "/oss-claw", desc: "NIB & perizinan OSS-RBA", shared: true },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Penanaman Modal properti", shared: true },
          { name: "ESGClaw", route: "/esg-claw", desc: "Green Building & ESG developer", shared: true },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak properti — BPHTB, PPN & PPh", shared: true },
        ],
      },
      {
        name: "Konsultan & Agen Properti",
        icon: "🔑",
        claws: [
          { name: "EstateCareClaw", route: "/estate-care-claw", desc: "Konsultan Properti Konsumen — advisory jual beli" },
          { name: "DevPropertiClaw", route: "/dev-properti-claw", desc: "Analisis proyek & studi kelayakan", shared: true },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Pajak transaksi properti", shared: true },
          { name: "KontrakClaw", route: "/kontrak-claw", desc: "Kontrak jual beli & PPJB", shared: true },
          { name: "CrmSalesClaw", route: "/crm-sales-claw", desc: "CRM & Sales — pipeline properti", shared: true },
          { name: "DigitalMarketingClaw", route: "/digital-marketing-claw", desc: "Digital marketing properti & listing", shared: true },
        ],
      },
    ],
  },
  {
    id: "pendidikan",
    label: "Pendidikan",
    icon: GraduationCap,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-300",
    segments: [
      {
        name: "Lembaga Pendidikan & Pelatihan",
        icon: "🎓",
        claws: [
          { name: "EducounselClaw", route: "/educounsel-claw", desc: "Konseling Akademik — AI advisor siswa/mahasiswa" },
          { name: "TutorTeknikClaw", route: "/tutor-teknik-claw", desc: "AI Tutor Teknik untuk mahasiswa" },
          { name: "IBTUClaw", route: "/ibtu-claw", desc: "IB Testing Unit AI — simulasi tes & ujian" },
          { name: "RisetSkripsiClaw", route: "/riset-skripsi-claw", desc: "AI Konsultan Riset & Skripsi" },
          { name: "LdKompetensiClaw", route: "/ld-kompetensi-claw", desc: "Learning & Development — desain kurikulum" },
        ],
      },
      {
        name: "Mahasiswa & Peserta Didik",
        icon: "📚",
        claws: [
          { name: "TutorTeknikClaw", route: "/tutor-teknik-claw", desc: "AI Tutor Teknik — belajar mandiri", shared: true },
          { name: "RisetSkripsiClaw", route: "/riset-skripsi-claw", desc: "Riset, metodologi & penulisan skripsi/tesis", shared: true },
          { name: "EducounselClaw", route: "/educounsel-claw", desc: "Konseling karier & akademik", shared: true },
          { name: "IBTUClaw", route: "/ibtu-claw", desc: "Simulasi tes masuk & ujian sertifikasi", shared: true },
        ],
      },
    ],
  },
  {
    id: "lintas",
    label: "Lintas Sektor",
    icon: Globe,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    segments: [
      {
        name: "HR & Manajemen SDM",
        icon: "👥",
        claws: [
          { name: "RekrutmenClaw", route: "/rekrutmen-claw", desc: "AI Konsultan Rekrutmen — screening & interview" },
          { name: "LdKompetensiClaw", route: "/ld-kompetensi-claw", desc: "Learning & Development — pengembangan kompetensi" },
          { name: "PenilaianKinerjaClaw", route: "/penilaian-kinerja-claw", desc: "Manajemen Kinerja — KPI & penilaian" },
          { name: "HubunganIndustrialClaw", route: "/hubungan-industrial-claw", desc: "HR & Industrial Relations — PHK, PKB, Disnaker" },
        ],
      },
      {
        name: "Keuangan, Pajak & Hukum Bisnis",
        icon: "💼",
        claws: [
          { name: "PajakClaw", route: "/pajak-claw", desc: "AI Advisor Pajak Indonesia — PPh, PPN, transfer pricing" },
          { name: "KeuanganClaw", route: "/keuangan-claw", desc: "Analisis keuangan & laporan BUJK" },
          { name: "KorporasiClaw", route: "/korporasi-claw", desc: "Konsultan Korporasi & Bisnis — GCG, M&A" },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG & keberlanjutan korporasi" },
          { name: "SMAPClaw", route: "/smap-claw", desc: "ISO 37001 Anti-Penyuapan" },
        ],
      },
      {
        name: "Digital Marketing & Sales",
        icon: "📱",
        claws: [
          { name: "DigitalMarketingClaw", route: "/digital-marketing-claw", desc: "AI Konsultan Digital Marketing — SEO, Ads, Media Sosial" },
          { name: "CrmSalesClaw", route: "/crm-sales-claw", desc: "CRM & Sales — pipeline, follow-up & konversi" },
          { name: "BrandContentClaw", route: "/brand-content-claw", desc: "Brand & Content — strategi konten & copywriting" },
          { name: "EcommerceClaw", route: "/ecommerce-claw", desc: "E-Commerce — marketplace, toko online & fulfillment" },
        ],
      },
      {
        name: "Operasional & Manufaktur",
        icon: "🏭",
        claws: [
          { name: "LeanOpExClaw", route: "/lean-opex-claw", desc: "Lean Manufacturing & Operational Excellence" },
          { name: "SupplyChainClaw", route: "/supply-chain-claw", desc: "Supply Chain & Logistics management" },
          { name: "Industri40Claw", route: "/industri40-claw", desc: "Industri 4.0 & Digital Manufacturing — IoT, AI pabrik" },
          { name: "HACCPClaw", route: "/haccp-claw", desc: "HACCP, BPOM & Sertifikasi Halal — keamanan pangan" },
          { name: "CybersecurityClaw", route: "/cybersecurity-claw", desc: "Cybersecurity & PDP Indonesia — keamanan data" },
        ],
      },
      {
        name: "Investasi & Perizinan Usaha",
        icon: "📜",
        claws: [
          { name: "OSSClaw", route: "/oss-claw", desc: "OSS-RBA, NIB & perizinan usaha lengkap" },
          { name: "LKPMClaw", route: "/lkpm-claw", desc: "Laporan Kegiatan Penanaman Modal BKPM" },
          { name: "KorporasiClaw", route: "/korporasi-claw", desc: "Korporasi — pendirian PT, GCG & M&A" },
          { name: "PajakClaw", route: "/pajak-claw", desc: "Insentif pajak investasi & tax planning" },
          { name: "ESGClaw", route: "/esg-claw", desc: "ESG reporting untuk investor & due diligence" },
        ],
      },
    ],
  },
];

export default function PaketBisnis() {
  const [activeSector, setActiveSector] = useState("konstruksi");
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});

  const sector = SECTORS.find((s) => s.id === activeSector)!;

  const toggleSegment = (key: string) => {
    setExpandedSegments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalClawsInSector = sector.segments.reduce(
    (sum, seg) => sum + seg.claws.filter((c) => !c.shared).length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans" data-testid="page-paket-bisnis">

      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <span className="font-extrabold text-xl text-blue-900 cursor-pointer">GUSTAFTA</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/trilogi">
              <span className="hidden sm:inline text-sm text-blue-600 hover:text-blue-500 font-semibold cursor-pointer">Ebook Trilogi</span>
            </Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-5 rounded-full text-sm transition-all hover:scale-105 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Konsultasi Gratis
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="bg-blue-950/60 text-blue-100 text-xs font-bold px-4 py-1.5 rounded-full mb-4 inline-block border border-blue-400/30 uppercase tracking-widest">
            Solusi AI per Segmen Industri
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Paket Bisnis AI<br />
            <span className="text-orange-400">Sesuai Bidang & Peran Anda</span>
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-3xl mx-auto mb-6 leading-relaxed">
            Setiap segmen industri punya kebutuhan berbeda. Gustafta hadir dengan <strong className="text-white">80+ AI Chatbot Spesialis</strong> yang dikelompokkan per sektor dan segmen — sehingga Anda hanya bayar untuk chatbot yang benar-benar Anda butuhkan.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[
              { v: "80+", l: "AI Spesialis" },
              { v: "7", l: "Sektor Industri" },
              { v: "30+", l: "Segmen Pasar" },
              { v: "24/7", l: "Selalu Aktif" },
            ].map(({ v, l }) => (
              <div key={l} className="bg-white/10 border border-white/20 rounded-xl px-5 py-3">
                <div className="text-2xl font-extrabold text-orange-300">{v}</div>
                <div className="text-blue-200 text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHARED CHATBOT NOTE */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-start gap-2 text-sm text-amber-800">
          <span className="text-lg flex-shrink-0">💡</span>
          <p>
            <strong>Chatbot Shared</strong> ditandai dengan badge <span className="bg-amber-200 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded">Shared</span> — chatbot ini tersedia di lebih dari satu segmen karena relevansinya lintas peran. Setiap segmen tetap mendapatkan akses penuh.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* SECTOR TABS */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SECTORS.map((s) => {
            const Icon = s.icon;
            const active = activeSector === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSector(s.id); setExpandedSegments({}); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  active
                    ? `${s.bg} ${s.color} ${s.border} shadow-md`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
                data-testid={`tab-sector-${s.id}`}>
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* SECTOR HEADER */}
        <div className={`${sector.bg} border ${sector.border} rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3`}>
          <div className="flex-1">
            <h2 className={`text-xl font-extrabold ${sector.color} mb-1`}>
              Sektor {sector.label}
            </h2>
            <p className="text-sm text-gray-600">
              {sector.segments.length} segmen · <strong>{totalClawsInSector}</strong> AI chatbot unggulan (+ shared tools)
            </p>
          </div>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-all hover:scale-105"
            data-testid="button-wa-sector">
            <MessageCircle className="w-4 h-4" />
            Tanya Paket {sector.label}
          </a>
        </div>

        {/* SEGMENTS */}
        <div className="space-y-4">
          {sector.segments.map((seg, si) => {
            const key = `${activeSector}-${si}`;
            const isOpen = expandedSegments[key] ?? true;
            const exclusiveCount = seg.claws.filter((c) => !c.shared).length;
            const sharedCount = seg.claws.filter((c) => c.shared).length;

            return (
              <div key={si} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Segment header */}
                <button
                  className="w-full flex items-center gap-3 p-5 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleSegment(key)}
                  data-testid={`toggle-segment-${si}`}>
                  <span className="text-2xl flex-shrink-0">{seg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-gray-900 text-base">{seg.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="text-blue-600 font-semibold">{exclusiveCount} chatbot utama</span>
                      {sharedCount > 0 && <span className="text-gray-400"> + {sharedCount} shared tools</span>}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""}`} />
                </button>

                {/* Claw list */}
                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {seg.claws.map((claw, ci) => (
                        <Link key={ci} href={claw.route}>
                          <div
                            className={`group flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                              claw.shared
                                ? "bg-amber-50 border-amber-200 hover:border-amber-400"
                                : "bg-blue-50 border-blue-200 hover:border-blue-400"
                            }`}
                            data-testid={`card-claw-${ci}`}>
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${claw.shared ? "text-amber-500" : "text-blue-500"}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                  {claw.name}
                                </span>
                                {claw.shared && (
                                  <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Shared</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{claw.desc}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Per-segment CTA */}
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Paket <strong className="text-gray-700">{seg.name}</strong> — {seg.claws.length} chatbot AI siap pakai
                      </p>
                      <a
                        href={`${WA_URL.replace("Paket%20Bisnis%20AI%20per%20Segmen", `Paket%20${encodeURIComponent(seg.name)}%20(Sektor%20${encodeURIComponent(sector.label)})`)} `}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
                        data-testid={`button-wa-segment-${si}`}>
                        <MessageCircle className="w-3 h-3" />
                        Tanya Harga Paket Ini
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-4 mt-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
            Bingung Pilih Paket yang Tepat?
          </h2>
          <p className="text-blue-100 mb-8 text-base leading-relaxed">
            Tim kami siap membantu menyesuaikan paket chatbot AI terbaik untuk bisnis atau peran spesifik Anda. Konsultasi <strong className="text-white">GRATIS</strong>, tanpa komitmen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-extrabold py-4 px-8 rounded-xl shadow-xl transition-all hover:scale-105"
              data-testid="button-cta-wa">
              <MessageCircle className="w-5 h-5" />
              WhatsApp Sekarang — Gratis
            </a>
            <Link href="/">
              <span className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white text-white font-semibold py-4 px-8 rounded-xl transition-all hover:bg-white/10 cursor-pointer">
                Lihat Platform Gustafta
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-xs">
        <p className="mb-1 font-bold text-gray-300">GUSTAFTA — AI Chatbot Builder Indonesia</p>
        <p>© {new Date().getFullYear()} Gustafta. Semua chatbot beroperasi 24/7 tanpa perlu koding.</p>
      </footer>

    </div>
  );
}
