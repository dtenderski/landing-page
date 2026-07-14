import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Search, ExternalLink, Zap, Users, ChevronRight,
  Shield, Building2, HardHat, FileText, Briefcase, GraduationCap,
  TrendingUp, Leaf, Cpu, Globe, Star, Crown,
} from "lucide-react";

type PlanTier = "starter" | "profesional" | "bisnis";

const PLAN_BADGE: Record<PlanTier, { label: string; className: string }> = {
  starter:    { label: "Starter",     className: "bg-blue-500/15 text-blue-300 border-blue-500/25" },
  profesional:{ label: "Profesional", className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25" },
  bisnis:     { label: "Bisnis",      className: "bg-violet-500/15 text-violet-300 border-violet-500/25" },
};

// ─── Registry (80 Claw) ───────────────────────────────────────────────────────
const CLAWS: { href: string; name: string; tagline: string; cat: string; agents: number; color: string; plan: PlanTier }[] = [
  // SBU & Sertifikasi — STARTER
  { href: "/sbu-claw",          name: "SBUClaw",       tagline: "SBU Konstruksi Permen PU 6/2025",       cat: "SBU & Sertifikasi",   agents: 10, color: "amber",   plan: "starter" },
  { href: "/skema-claw",        name: "SkemaClaw",     tagline: "Sertifikasi BUJK Permen PU 6/2025",     cat: "SBU & Sertifikasi",   agents: 9,  color: "blue",    plan: "starter" },
  { href: "/lkut-claw",         name: "LKUTClaw",      tagline: "LKUT BUJK",                             cat: "SBU & Sertifikasi",   agents: 4,  color: "cyan",    plan: "starter" },
  { href: "/abu-claw",          name: "ABUClaw",       tagline: "Konsultan ABU & LSBU",                  cat: "SBU & Sertifikasi",   agents: 8,  color: "slate",   plan: "starter" },
  { href: "/panduan-sbu",       name: "PanduanSBU",    tagline: "Tanya Jawab SBU Konstruksi",            cat: "SBU & Sertifikasi",   agents: 1,  color: "emerald", plan: "starter" },
  // SKK & Kompetensi — PROFESIONAL
  { href: "/manprojak-claw",      name: "ManprojakClaw",      tagline: "SKK Manajemen Pelaksanaan",         cat: "SKK & Kompetensi", agents: 7, color: "indigo", plan: "profesional" },
  { href: "/arsitektur-claw",     name: "ArsitekturClaw",     tagline: "SKK Klasifikasi Arsitektur",        cat: "SKK & Kompetensi", agents: 7, color: "rose",   plan: "profesional" },
  { href: "/surveipemetaan-claw", name: "SurveiPemetaanClaw", tagline: "SKK Survei & Pemetaan",             cat: "SKK & Kompetensi", agents: 7, color: "teal",   plan: "profesional" },
  { href: "/geoteknik-claw",      name: "GeoteknikClaw",      tagline: "SKK Sipil (Geoteknik)",             cat: "SKK & Kompetensi", agents: 7, color: "amber",  plan: "profesional" },
  { href: "/jalanjembatan-claw",  name: "JalanJembatanClaw",  tagline: "SKK Sipil (Jalan & Jembatan)",      cat: "SKK & Kompetensi", agents: 7, color: "yellow", plan: "profesional" },
  { href: "/tatalingkungan-claw", name: "TataLingkunganClaw", tagline: "SKK Tata Lingkungan",               cat: "SKK & Kompetensi", agents: 7, color: "green",  plan: "profesional" },
  { href: "/elektrikal-claw",     name: "ElektrikalClaw",     tagline: "SKK Klasifikasi Elektrikal",        cat: "SKK & Kompetensi", agents: 7, color: "blue",   plan: "profesional" },
  { href: "/panduan-askom",       name: "PanduanASKOM",       tagline: "Tanya Jawab SKK",                   cat: "SKK & Kompetensi", agents: 1, color: "teal",   plan: "starter" },
  // Teknik Konstruksi — PROFESIONAL
  { href: "/bg-claw",      name: "BGClaw",      tagline: "Ruang Lingkup Bangunan Gedung",         cat: "Teknik Konstruksi", agents: 9,  color: "stone",  plan: "profesional" },
  { href: "/bs-claw",      name: "BSClaw",      tagline: "Ruang Lingkup Bangunan Sipil",          cat: "Teknik Konstruksi", agents: 11, color: "sky",    plan: "profesional" },
  { href: "/im-claw",      name: "IMClaw",      tagline: "Instalasi Mekanikal-Elektrikal",        cat: "Teknik Konstruksi", agents: 10, color: "emerald",plan: "profesional" },
  { href: "/ko-claw",      name: "KOClaw",      tagline: "Konstruksi Spesialis",                  cat: "Teknik Konstruksi", agents: 9,  color: "violet", plan: "profesional" },
  { href: "/kk-claw",      name: "KKClaw",      tagline: "Jasa Konsultansi Konstruksi",           cat: "Teknik Konstruksi", agents: 8,  color: "rose",   plan: "profesional" },
  { href: "/sipil-claw",   name: "SipilClaw",   tagline: "AI Konsultan Teknik Sipil",             cat: "Teknik Konstruksi", agents: 7,  color: "sky",    plan: "profesional" },
  { href: "/mep-claw",     name: "MEPClaw",     tagline: "AI Konsultan MEP",                      cat: "Teknik Konstruksi", agents: 7,  color: "emerald",plan: "profesional" },
  { href: "/bim-claw",     name: "BIMClaw",     tagline: "AI Konsultan BIM & Konstruksi Digital", cat: "Teknik Konstruksi", agents: 8,  color: "blue",   plan: "profesional" },
  { href: "/desain-claw",  name: "DesainClaw",  tagline: "AI Konsultan Desain Arsitektur",        cat: "Teknik Konstruksi", agents: 8,  color: "rose",   plan: "profesional" },
  { href: "/siteops-claw", name: "SiteOpsClaw", tagline: "AI Konsultan Operasional Lapangan",     cat: "Teknik Konstruksi", agents: 8,  color: "orange", plan: "profesional" },
  { href: "/konstra-claw", name: "KonstraClaw", tagline: "Manajemen Proyek Konstruksi",           cat: "Teknik Konstruksi", agents: 9,  color: "slate",  plan: "profesional" },
  { href: "/brain-claw",   name: "BrainClaw",   tagline: "Project Intelligence AI",               cat: "Teknik Konstruksi", agents: 6,  color: "cyan",   plan: "profesional" },
  // K3 & Keselamatan — PROFESIONAL (kecuali Offshore → Bisnis)
  { href: "/safira-claw",        name: "SafiraClaw",        tagline: "SKK K3 Konstruksi Coach AI",      cat: "K3 & Keselamatan", agents: 5,  color: "red",    plan: "profesional" },
  { href: "/smk3-claw",          name: "SMK3Claw",          tagline: "IMS & SMK3 Terintegrasi",         cat: "K3 & Keselamatan", agents: 7,  color: "orange", plan: "profesional" },
  { href: "/k3man-claw",         name: "K3ManClaw",         tagline: "Manajemen K3 Konstruksi & SKK",   cat: "K3 & Keselamatan", agents: 7,  color: "orange", plan: "profesional" },
  { href: "/csms-claw",          name: "CSMSClaw",          tagline: "Contractor Safety Management System", cat: "K3 & Keselamatan", agents: 12, color: "amber", plan: "profesional" },
  { href: "/offshore-safety-claw", name: "OffshoreSafetyClaw", tagline: "K3 & Operasi Migas Offshore", cat: "K3 & Keselamatan", agents: 8, color: "slate",  plan: "bisnis" },
  { href: "/lingkungan-claw",    name: "LingkunganClaw",    tagline: "AI Konsultan Lingkungan Hidup",   cat: "K3 & Keselamatan", agents: 7,  color: "teal",   plan: "profesional" },
  // Tender & Kontrak — STARTER
  { href: "/tendera-claw",       name: "TenderaClaw",       tagline: "AI Tender BUJK",                cat: "Tender & Kontrak", agents: 10, color: "indigo", plan: "starter" },
  { href: "/konstra-tender-claw",name: "KonstraTenderClaw", tagline: "Monitor Tender SIRUP",           cat: "Tender & Kontrak", agents: 4,  color: "emerald",plan: "starter" },
  { href: "/kontrak-claw",       name: "KontrakClaw",       tagline: "Manajemen Kontrak & Klaim",      cat: "Tender & Kontrak", agents: 7,  color: "red",    plan: "starter" },
  { href: "/qs-claw",            name: "QSClaw",            tagline: "Quantity Surveying & Estimasi Biaya", cat: "Tender & Kontrak", agents: 7, color: "amber", plan: "starter" },
  { href: "/pengawas-claw",      name: "PengawasClaw",      tagline: "Pengawas Konstruksi & SKK",      cat: "Tender & Kontrak", agents: 7,  color: "orange", plan: "starter" },
  // Perizinan & Regulasi — STARTER (PJBU, Keuangan) + PROFESIONAL (sisanya)
  { href: "/pjbu-claw",          name: "PJBUClaw",          tagline: "Personel Manajerial BUJK",           cat: "Perizinan & Regulasi", agents: 5, color: "indigo", plan: "starter" },
  { href: "/keuangan-claw",      name: "KeuanganClaw",      tagline: "Keuangan BUJK",                      cat: "Perizinan & Regulasi", agents: 4, color: "emerald",plan: "starter" },
  { href: "/lkpm-claw",          name: "LKPMClaw",          tagline: "LKPM & Penanaman Modal BKPM",        cat: "Perizinan & Regulasi", agents: 7, color: "teal",   plan: "profesional" },
  { href: "/oss-claw",           name: "OSSClaw",           tagline: "OSS-RBA, NIB & Perizinan Usaha",     cat: "Perizinan & Regulasi", agents: 8, color: "emerald",plan: "profesional" },
  { href: "/pub-lkut-claw",      name: "PUB-LKUTClaw",      tagline: "Pengembangan Usaha & LKUT",          cat: "Perizinan & Regulasi", agents: 8, color: "sky",    plan: "profesional" },
  { href: "/esimpan-claw",       name: "ESIMPANClaw",       tagline: "Input Pengalaman BUJK di E-SIMPAN",  cat: "Perizinan & Regulasi", agents: 9, color: "blue",   plan: "profesional" },
  { href: "/nspk-navigator-claw",name: "NSPKNavigatorClaw", tagline: "Panduan NSPK & Standar Teknis",      cat: "Perizinan & Regulasi", agents: 8, color: "blue",   plan: "profesional" },
  { href: "/teras-lpjk-1",       name: "TerasLPJK#1",       tagline: "Sharing Knowledge Sertifikasi SKK",  cat: "Perizinan & Regulasi", agents: 5, color: "indigo", plan: "profesional" },
  // Sistem Manajemen — PROFESIONAL (kecuali ESG & HACCP → Bisnis)
  { href: "/smap-claw",       name: "SMAPClaw",    tagline: "ISO 37001 Anti-Penyuapan",      cat: "Sistem Manajemen", agents: 8, color: "teal",   plan: "profesional" },
  { href: "/pancek-claw",     name: "PanCEKClaw",  tagline: "KPK & Anti Korupsi Nasional",   cat: "Sistem Manajemen", agents: 5, color: "red",    plan: "profesional" },
  { href: "/iso-claw-9001",   name: "ISOClaw 9001",tagline: "SMM ISO 9001 Jasa Konstruksi",  cat: "Sistem Manajemen", agents: 6, color: "blue",   plan: "profesional" },
  { href: "/iso-claw-14001",  name: "ISOClaw 14001",tagline: "SML ISO 14001 Jasa Konstruksi",cat: "Sistem Manajemen", agents: 6, color: "green",  plan: "profesional" },
  { href: "/esg-claw",        name: "ESGClaw",     tagline: "ESG & Keberlanjutan Indonesia", cat: "Sistem Manajemen", agents: 8, color: "emerald",plan: "bisnis" },
  { href: "/haccp-claw",      name: "HACCPClaw",   tagline: "HACCP, BPOM & Sertifikasi Halal",cat:"Sistem Manajemen",agents: 8, color: "green",  plan: "bisnis" },
  // Properti & Real Estate — BISNIS
  { href: "/dev-properti-claw",  name: "DevPropertiClaw",  tagline: "Developer Real Estate",       cat: "Properti & Real Estate", agents: 10, color: "violet",  plan: "bisnis" },
  { href: "/estate-care-claw",   name: "EstateCareClaw",   tagline: "Konsultan Properti Konsumen", cat: "Properti & Real Estate", agents: 10, color: "emerald", plan: "bisnis" },
  // Energi & Industri — BISNIS
  { href: "/migas-claw",            name: "MigasClaw",           tagline: "Kompetensi & Perizinan Energi Migas",    cat: "Energi & Industri", agents: 9, color: "orange", plan: "bisnis" },
  { href: "/energi-claw",           name: "EnergiClaw",          tagline: "Konsultan Energi & EBT",                 cat: "Energi & Industri", agents: 8, color: "orange", plan: "bisnis" },
  { href: "/ebt-solar-claw",        name: "EBTSolarClaw",        tagline: "PLTS & Energi Surya",                    cat: "Energi & Industri", agents: 8, color: "yellow", plan: "bisnis" },
  { href: "/transisi-energi-claw",  name: "TransisiEnergiClaw",  tagline: "Konsultan Transisi Energi",              cat: "Energi & Industri", agents: 8, color: "green",  plan: "bisnis" },
  { href: "/ketenagalistrikan-claw",name: "KetenagalistrikanClaw",tagline: "Konsultan Ketenagalistrikan",           cat: "Energi & Industri", agents: 8, color: "yellow", plan: "bisnis" },
  { href: "/transmisi-claw",        name: "TransmisiClaw",       tagline: "Transmisi & Gardu Induk PLN",            cat: "Energi & Industri", agents: 7, color: "red",    plan: "bisnis" },
  { href: "/pertambangan-claw",     name: "PertambanganClaw",    tagline: "Konsultan Pertambangan",                 cat: "Energi & Industri", agents: 8, color: "stone",  plan: "bisnis" },
  { href: "/geologi-claw",          name: "GeologiClaw",         tagline: "Geologi & Eksplorasi",                   cat: "Energi & Industri", agents: 8, color: "amber",  plan: "bisnis" },
  { href: "/industri40-claw",       name: "Industri40Claw",      tagline: "Industri 4.0 & Digital Manufacturing",   cat: "Energi & Industri", agents: 8, color: "violet", plan: "bisnis" },
  { href: "/lean-opex-claw",        name: "LeanOpExClaw",        tagline: "Lean Manufacturing & Operational Excellence", cat: "Energi & Industri", agents: 8, color: "blue", plan: "bisnis" },
  { href: "/supply-chain-claw",     name: "SupplyChainClaw",     tagline: "Supply Chain & Logistics",               cat: "Energi & Industri", agents: 8, color: "indigo", plan: "bisnis" },
  // HR & Bisnis — BISNIS
  { href: "/rekrutmen-claw",         name: "RekrutmenClaw",         tagline: "AI Konsultan Rekrutmen",               cat: "HR & Bisnis", agents: 8, color: "teal",   plan: "bisnis" },
  { href: "/ld-kompetensi-claw",     name: "LdKompetensiClaw",      tagline: "Learning & Development Kompetensi",    cat: "HR & Bisnis", agents: 8, color: "emerald",plan: "bisnis" },
  { href: "/penilaian-kinerja-claw", name: "PenilaianKinerjaClaw",  tagline: "Manajemen Kinerja",                    cat: "HR & Bisnis", agents: 8, color: "indigo", plan: "bisnis" },
  { href: "/hubungan-industrial-claw",name:"HubunganIndustrialClaw",tagline: "HR & Industrial Relations",            cat: "HR & Bisnis", agents: 8, color: "orange", plan: "bisnis" },
  { href: "/pajak-claw",             name: "PajakClaw",             tagline: "AI Advisor Pajak Indonesia",           cat: "HR & Bisnis", agents: 8, color: "amber",  plan: "bisnis" },
  { href: "/korporasi-claw",         name: "KorporasiClaw",         tagline: "Konsultan Korporasi & Bisnis",         cat: "HR & Bisnis", agents: 8, color: "gray",   plan: "bisnis" },
  { href: "/cybersecurity-claw",     name: "CybersecurityClaw",     tagline: "Cybersecurity & PDP Indonesia",        cat: "HR & Bisnis", agents: 8, color: "slate",  plan: "bisnis" },
  // Marketing & Digital — BISNIS
  { href: "/digital-marketing-claw", name: "DigitalMarketingClaw", tagline: "AI Konsultan Digital Marketing", cat: "Marketing & Digital", agents: 8, color: "violet", plan: "bisnis" },
  { href: "/crm-sales-claw",         name: "CrmSalesClaw",         tagline: "AI Konsultan CRM & Sales",       cat: "Marketing & Digital", agents: 8, color: "blue",   plan: "bisnis" },
  { href: "/brand-content-claw",     name: "BrandContentClaw",     tagline: "AI Konsultan Brand & Content",   cat: "Marketing & Digital", agents: 8, color: "rose",   plan: "bisnis" },
  { href: "/ecommerce-claw",         name: "EcommerceClaw",        tagline: "AI Konsultan E-Commerce",        cat: "Marketing & Digital", agents: 8, color: "orange", plan: "bisnis" },
  // Pendidikan & Riset — PROFESIONAL (kecuali ETLO → Bisnis)
  { href: "/educounsel-claw",   name: "EducounselClaw",   tagline: "Konseling Akademik",                   cat: "Pendidikan & Riset", agents: 11, color: "teal",   plan: "profesional" },
  { href: "/ibtu-claw",         name: "IBTUClaw",         tagline: "IB Testing Unit AI",                   cat: "Pendidikan & Riset", agents: 7,  color: "indigo", plan: "profesional" },
  { href: "/etlo-academy-claw", name: "ETLOAcademyClaw",  tagline: "Program ETLO Energi & Sertifikasi EBT",cat: "Pendidikan & Riset", agents: 10, color: "emerald",plan: "bisnis" },
  { href: "/etlo-bizdev-claw",  name: "ETLOBizDevClaw",   tagline: "Strategi Bisnis & Pengembangan ETLO",  cat: "Pendidikan & Riset", agents: 10, color: "teal",   plan: "bisnis" },
  { href: "/tutor-teknik-claw", name: "TutorTeknikClaw",  tagline: "AI Tutor Teknik untuk Mahasiswa",      cat: "Pendidikan & Riset", agents: 8,  color: "indigo", plan: "profesional" },
  { href: "/riset-skripsi-claw",name: "RisetSkripsiClaw", tagline: "AI Konsultan Riset & Skripsi",         cat: "Pendidikan & Riset", agents: 8,  color: "violet", plan: "profesional" },
];

const CATS = ["Semua", ...Array.from(new Set(CLAWS.map(c => c.cat)))];
const PLAN_FILTERS: { label: string; value: PlanTier | "semua" }[] = [
  { label: "Semua Paket", value: "semua" },
  { label: "Starter",     value: "starter" },
  { label: "Profesional", value: "profesional" },
  { label: "Bisnis",      value: "bisnis" },
];

const CAT_ICONS: Record<string, React.ReactNode> = {
  "SBU & Sertifikasi":    <Shield className="h-4 w-4" />,
  "SKK & Kompetensi":     <GraduationCap className="h-4 w-4" />,
  "Teknik Konstruksi":    <Building2 className="h-4 w-4" />,
  "K3 & Keselamatan":    <HardHat className="h-4 w-4" />,
  "Tender & Kontrak":     <FileText className="h-4 w-4" />,
  "Perizinan & Regulasi": <Globe className="h-4 w-4" />,
  "Sistem Manajemen":     <Shield className="h-4 w-4" />,
  "Properti & Real Estate":<Building2 className="h-4 w-4" />,
  "Energi & Industri":   <Zap className="h-4 w-4" />,
  "HR & Bisnis":          <Briefcase className="h-4 w-4" />,
  "Marketing & Digital":  <TrendingUp className="h-4 w-4" />,
  "Pendidikan & Riset":   <GraduationCap className="h-4 w-4" />,
};

const COLOR_MAP: Record<string, { border: string; badge: string; glow: string; dot: string }> = {
  amber:   { border: "border-amber-500/30",   badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",   glow: "hover:border-amber-500/50",   dot: "bg-amber-400" },
  blue:    { border: "border-blue-500/30",    badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",    glow: "hover:border-blue-500/50",    dot: "bg-blue-400" },
  cyan:    { border: "border-cyan-500/30",    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",    glow: "hover:border-cyan-500/50",    dot: "bg-cyan-400" },
  slate:   { border: "border-slate-500/30",   badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",   glow: "hover:border-slate-400/50",   dot: "bg-slate-400" },
  emerald: { border: "border-emerald-500/30", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", glow: "hover:border-emerald-500/50", dot: "bg-emerald-400" },
  indigo:  { border: "border-indigo-500/30",  badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",  glow: "hover:border-indigo-500/50",  dot: "bg-indigo-400" },
  rose:    { border: "border-rose-500/30",    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",    glow: "hover:border-rose-500/50",    dot: "bg-rose-400" },
  teal:    { border: "border-teal-500/30",    badge: "bg-teal-500/10 text-teal-300 border-teal-500/20",    glow: "hover:border-teal-500/50",    dot: "bg-teal-400" },
  green:   { border: "border-green-500/30",   badge: "bg-green-500/10 text-green-300 border-green-500/20",   glow: "hover:border-green-500/50",   dot: "bg-green-400" },
  yellow:  { border: "border-yellow-500/30",  badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",  glow: "hover:border-yellow-500/50",  dot: "bg-yellow-400" },
  orange:  { border: "border-orange-500/30",  badge: "bg-orange-500/10 text-orange-300 border-orange-500/20",  glow: "hover:border-orange-500/50",  dot: "bg-orange-400" },
  red:     { border: "border-red-500/30",     badge: "bg-red-500/10 text-red-300 border-red-500/20",     glow: "hover:border-red-500/50",     dot: "bg-red-400" },
  violet:  { border: "border-violet-500/30",  badge: "bg-violet-500/10 text-violet-300 border-violet-500/20",  glow: "hover:border-violet-500/50",  dot: "bg-violet-400" },
  sky:     { border: "border-sky-500/30",     badge: "bg-sky-500/10 text-sky-300 border-sky-500/20",     glow: "hover:border-sky-500/50",     dot: "bg-sky-400" },
  stone:   { border: "border-stone-500/30",   badge: "bg-stone-500/10 text-stone-300 border-stone-500/20",   glow: "hover:border-stone-400/50",   dot: "bg-stone-400" },
  gray:    { border: "border-gray-500/30",    badge: "bg-gray-500/10 text-gray-300 border-gray-500/20",    glow: "hover:border-gray-400/50",    dot: "bg-gray-400" },
};

const CAT_BG: Record<string, string> = {
  "SBU & Sertifikasi":     "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "SKK & Kompetensi":      "bg-blue-500/10 text-blue-300 border-blue-500/20",
  "Teknik Konstruksi":     "bg-slate-500/10 text-slate-300 border-slate-500/20",
  "K3 & Keselamatan":     "bg-red-500/10 text-red-300 border-red-500/20",
  "Tender & Kontrak":      "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  "Perizinan & Regulasi":  "bg-teal-500/10 text-teal-300 border-teal-500/20",
  "Sistem Manajemen":      "bg-green-500/10 text-green-300 border-green-500/20",
  "Properti & Real Estate":"bg-violet-500/10 text-violet-300 border-violet-500/20",
  "Energi & Industri":    "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "HR & Bisnis":           "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "Marketing & Digital":   "bg-pink-500/10 text-pink-300 border-pink-500/20",
  "Pendidikan & Riset":    "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
};

const PLAN_COUNTS = {
  starter:     CLAWS.filter(c => c.plan === "starter").length,
  profesional: CLAWS.filter(c => c.plan !== "bisnis").length,
  bisnis:      CLAWS.length,
};

export default function MultiClawDirectory() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");
  const [activePlan, setActivePlan] = useState<PlanTier | "semua">("semua");

  const filtered = CLAWS.filter(c => {
    const matchCat  = activeCat === "Semua" || c.cat === activeCat;
    const matchPlan = activePlan === "semua" || c.plan === activePlan;
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q);
    return matchCat && matchPlan && matchSearch;
  });

  const totalAgents = filtered.reduce((s, c) => s + c.agents, 0);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 bg-[#080810]/90 backdrop-blur">
        <Link href="/ai-tools">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" />Kembali
          </Button>
        </Link>
        <div className="flex-1" />
        <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/25 gap-1.5">
          <Zap className="h-3 w-3" />{CLAWS.length} MultiClaw
        </Badge>
      </div>

      {/* ── Hero ── */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 mb-5">
          <Cpu className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          MultiClaw Suite
        </h1>
        <p className="text-white/50 text-sm max-w-lg mx-auto mb-6">
          {CLAWS.length} chatbot AI multi-agen premium untuk industri konstruksi, energi, bisnis, dan pendidikan.
          Setiap Claw mengoperasikan tim AI spesialis secara paralel.
        </p>

        {/* ── Paket info strip ── */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
            <Star className="h-4 w-4 text-blue-400" />
            <div className="text-left">
              <div className="text-xs font-semibold text-blue-300">Starter</div>
              <div className="text-[10px] text-white/40">{PLAN_COUNTS.starter} claw • SBU & Tender</div>
            </div>
          </div>
          <Link href="/paket-bidang">
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 hover:border-indigo-500/40 transition-colors cursor-pointer" data-testid="link-paket-bidang-pro">
              <Zap className="h-4 w-4 text-indigo-400" />
              <div className="text-left">
                <div className="text-xs font-semibold text-indigo-300">Profesional</div>
                <div className="text-[10px] text-white/40">Claw dasar + pilih 2 paket bidang →</div>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2.5">
            <Crown className="h-4 w-4 text-violet-400" />
            <div className="text-left">
              <div className="text-xs font-semibold text-violet-300">Bisnis</div>
              <div className="text-[10px] text-white/40">{PLAN_COUNTS.bisnis} claw • Semua paket bidang</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            placeholder="Cari nama Claw atau topik..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Plan filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {PLAN_FILTERS.map(p => (
            <button
              key={p.value}
              onClick={() => setActivePlan(p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activePlan === p.value
                  ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/8 hover:text-white/70"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeCat === c
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/8 hover:text-white/70"
              }`}
            >
              {c !== "Semua" && CAT_ICONS[c]}
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Tidak ada hasil untuk "{search}"</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-white/30 mb-4 text-center">
              {filtered.length} Claw · {totalAgents} total agen AI
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(claw => {
                const c = COLOR_MAP[claw.color] ?? COLOR_MAP["slate"];
                const planBadge = PLAN_BADGE[claw.plan];
                return (
                  <Link key={claw.href} href={claw.href}>
                    <div className={`group bg-white/[0.03] border ${c.border} ${c.glow} rounded-xl p-4 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 hover:bg-white/[0.05] hover:shadow-lg`}>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{claw.name}</div>
                          <div className="text-xs text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{claw.tagline}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-0.5" />
                      </div>

                      {/* Bottom row */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <Badge className={`text-[10px] border ${CAT_BG[claw.cat] ?? "bg-white/10 text-white/50"}`}>
                          {claw.cat}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] border font-semibold ${planBadge.className}`}>
                            {planBadge.label}
                          </Badge>
                          <div className="flex items-center gap-1 text-white/30">
                            <Users className="h-3 w-3" />
                            <span className="text-[10px]">{claw.agents}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-70`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
