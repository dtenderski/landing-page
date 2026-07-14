import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, MessageCircle, Cpu, Zap, Star,
  Shield, Sparkles, ChevronRight, Lock,
  Crown, Filter, AlertTriangle, Clock, Wallet,
  FileWarning, X, HelpCircle, Users, ArrowRight,
  TrendingUp, Brain,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tahu%20lebih%20tentang%20MultiClaw%20Suite";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_BUNDLE = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";
const CHECKOUT_BASIC  = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";

type PlanTier = "starter" | "profesional" | "bisnis";

// ── Plan lookup ───────────────────────────────────────────────────────────────
const STARTER_SET = new Set([
  "SBUClaw", "LKUTClaw", "PJBUClaw", "KeuanganClaw", "ABUClaw",
  "PanduanSBU", "SkemaClaw", "TenderaClaw", "KonstraTenderClaw",
  "PanduanASKOM", "QSClaw", "PengawasClaw", "KontrakClaw",
]);
const BISNIS_SET = new Set([
  "PajakClaw", "OffshoreSafetyClaw", "HACCPClaw", "KetenagalistrikanClaw",
  "EnergiClaw", "EBTSolarClaw", "TransisiEnergiClaw", "MigasClaw",
  "PertambanganClaw", "GeologiClaw", "TransmisiClaw", "DevPropertiClaw",
  "EstateCareClaw", "DigitalMarketingClaw", "CrmSalesClaw", "BrandContentClaw",
  "EcommerceClaw", "RekrutmenClaw", "LdKompetensiClaw", "PenilaianKinerjaClaw",
  "HubunganIndustrialClaw", "ESGClaw", "LeanOpExClaw", "SupplyChainClaw",
  "Industri40Claw", "KorporasiClaw", "CybersecurityClaw", "ETLOAcademyClaw",
  "ETLOBizDevClaw",
]);

function getPlan(tool: string): PlanTier {
  if (STARTER_SET.has(tool)) return "starter";
  if (BISNIS_SET.has(tool)) return "bisnis";
  return "profesional";
}

function isAccessible(tool: string, selectedPlan: PlanTier | "semua"): boolean {
  if (selectedPlan === "semua" || selectedPlan === "bisnis") return true;
  const plan = getPlan(tool);
  if (selectedPlan === "starter") return plan === "starter";
  // profesional: starter + profesional
  return plan !== "bisnis";
}

const PLAN_DOT: Record<PlanTier, string> = {
  starter: "bg-blue-500",
  profesional: "bg-indigo-500",
  bisnis: "bg-violet-500",
};

// ── Categories (industry grouping preserved) ──────────────────────────────────
const CATEGORIES = [
  {
    label: "Konstruksi & Infrastruktur", color: "amber",
    tools: ["SBUClaw","SMK3Claw","SafiraClaw","TenderaClaw","BGClaw","BSClaw","IMClaw","KOClaw","KKClaw","BIMClaw","SiteOpsClaw","KonstraClaw"],
  },
  {
    label: "K3 & Keselamatan", color: "red",
    tools: ["CSMSClaw","K3ManClaw","OffshoreSafetyClaw","SMAPClaw","PanCEKClaw"],
  },
  {
    label: "Sertifikasi & Kompetensi SKK", color: "blue",
    tools: ["ManprojakClaw","ArsitekturClaw","SurveiPemetaanClaw","GeoteknikClaw","JalanJembatanClaw","TataLingkunganClaw","ElektrikalClaw","PengawasClaw","K3ManClaw"],
  },
  {
    label: "Perizinan & Regulasi", color: "emerald",
    tools: ["LKUTClaw","PJBUClaw","LKPMClaw","OSSClaw","ESIMPANClaw","ABUClaw","SkemaClaw","NSPKNavigatorClaw"],
  },
  {
    label: "Energi & Lingkungan", color: "green",
    tools: ["MigasClaw","EBTSolarClaw","EnergiClaw","TransisiEnergiClaw","KetenagalistrikanClaw","TransmisiClaw","GeologiClaw","ESGClaw","LingkunganClaw"],
  },
  {
    label: "Properti & Real Estate", color: "violet",
    tools: ["DevPropertiClaw","EstateCareClaw","QSClaw","DesainClaw","SipilClaw","MEPClaw"],
  },
  {
    label: "Bisnis & Manajemen", color: "indigo",
    tools: ["KontrakClaw","KeuanganClaw","PajakClaw","KorporasiClaw","HubunganIndustrialClaw","LeanOpExClaw","SupplyChainClaw","Industri40Claw"],
  },
  {
    label: "Marketing & Sales", color: "rose",
    tools: ["DigitalMarketingClaw","CrmSalesClaw","BrandContentClaw","EcommerceClaw"],
  },
  {
    label: "SDM & Pengembangan", color: "teal",
    tools: ["RekrutmenClaw","LdKompetensiClaw","PenilaianKinerjaClaw","CybersecurityClaw","HACCPClaw"],
  },
  {
    label: "Pendidikan & Riset", color: "sky",
    tools: ["EducounselClaw","IBTUClaw","ETLOAcademyClaw","TutorTeknikClaw","RisetSkripsiClaw","BrainClaw"],
  },
];

const bgMap: Record<string, string> = {
  amber:   "bg-amber-50 border-amber-200 dark:bg-amber-900/10",
  red:     "bg-red-50 border-red-200 dark:bg-red-900/10",
  blue:    "bg-blue-50 border-blue-200 dark:bg-blue-900/10",
  emerald: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10",
  green:   "bg-green-50 border-green-200 dark:bg-green-900/10",
  violet:  "bg-violet-50 border-violet-200 dark:bg-violet-900/10",
  indigo:  "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10",
  rose:    "bg-rose-50 border-rose-200 dark:bg-rose-900/10",
  teal:    "bg-teal-50 border-teal-200 dark:bg-teal-900/10",
  sky:     "bg-sky-50 border-sky-200 dark:bg-sky-900/10",
};

const totalClaws = 80;
const starterCount = STARTER_SET.size;
const proCount = totalClaws - BISNIS_SET.size;

// ── PAS content ───────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    icon: <FileWarning className="h-6 w-6 text-red-500" />,
    title: "Regulasi berubah lebih cepat dari yang bisa Anda ikuti",
    desc: "Perpres 46/2025, Permen PU, SKKNI, SNI, ISO — terus berganti. Salah rujukan bisa berarti dokumen ditolak atau temuan audit.",
  },
  {
    icon: <Clock className="h-6 w-6 text-red-500" />,
    title: "Deadline tender & audit tidak menunggu",
    desc: "RAB, eligibility, win probability, laporan K3, SPT — semua dikerjakan manual, berjam-jam, sering lembur sampai larut.",
  },
  {
    icon: <Wallet className="h-6 w-6 text-red-500" />,
    title: "Konsultan spesialis mahal — dan dibayar per kasus",
    desc: "Tiap kebutuhan baru (SBU, SKK, ISO, pajak, ESG) berarti tarif konsultan baru. Biaya menumpuk sebelum proyek menghasilkan.",
  },
  {
    icon: <Brain className="h-6 w-6 text-red-500" />,
    title: "Mustahil menguasai semua bidang sendirian",
    desc: "Konstruksi, hukum, K3, energi, keuangan, SDM — satu orang tak mungkin jadi ahli di semuanya, padahal pekerjaan menuntutnya.",
  },
];

const OUTCOMES = [
  "Jawaban terstruktur & siap pakai dalam hitungan detik",
  "Selalu merujuk regulasi Indonesia terkini, lengkap dengan dasarnya",
  "Satu langganan menggantikan banyak tarif konsultan",
  "Tim AI 5–12 sub-agen bekerja paralel untuk tiap pertanyaan",
  "Tools baru otomatis bertambah tanpa biaya tambahan",
  "Akses dari mana saja, kapan saja — 24/7",
];

const COMPARE = [
  { tanpa: "Riset manual berjam-jam tiap dokumen", dengan: "Analisis lengkap dalam hitungan detik" },
  { tanpa: "Bingung regulasi mana yang terbaru", dengan: "Selalu merujuk aturan terkini + dasarnya" },
  { tanpa: "Bayar konsultan untuk tiap kebutuhan", dengan: "Satu langganan untuk seluruh kebutuhan" },
  { tanpa: "Bekerja sendirian, mudah keliru", dengan: "Tim AI spesialis mendampingi 24/7" },
  { tanpa: "Hasil berantakan, harus dirapikan lagi", dengan: "Laporan terstruktur, langsung dipakai" },
];

const USE_CASES = [
  {
    icon: <Users className="h-6 w-6 text-amber-600" />,
    persona: "BUJK yang mengejar tender",
    claws: ["SBUClaw", "TenderaClaw", "KonstraTenderClaw"],
    outcome: "Cek eligibility, hitung win probability, dan susun dokumen penawaran — dari scouting sampai kontrak.",
  },
  {
    icon: <Shield className="h-6 w-6 text-red-600" />,
    persona: "Profesional K3 & HSE",
    claws: ["SMK3Claw", "CSMSClaw", "K3ManClaw"],
    outcome: "Susun SMKK, dokumen CSMS, dan laporan keselamatan sesuai Permen PUPR & standar pemberi kerja.",
  },
  {
    icon: <Star className="h-6 w-6 text-blue-600" />,
    persona: "Calon pemegang SKK",
    claws: ["PanduanASKOM", "ManprojakClaw", "PengawasClaw"],
    outcome: "Persiapan asesmen jenjang J3–J9 — pahami unit kompetensi, latihan, dan dokumen portofolio.",
  },
];

// Statistik riset industri (konteks umum, bukan klaim hasil produk).
// Sumber diverifikasi: McKinsey Global Institute; Brynjolfsson, Li & Raymond (NBER w31161 / QJE).
const STATS = [
  {
    icon: <Clock className="h-6 w-6 text-cyan-600" />,
    value: "±20%",
    label: "waktu kerja mingguan pekerja pengetahuan habis hanya untuk mencari informasi.",
    source: "McKinsey Global Institute, \u201CThe Social Economy\u201D, 2012",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-teal-600" />,
    value: "+14%",
    label: "rata-rata kenaikan produktivitas pekerja yang dibantu AI generatif.",
    source: "Brynjolfsson, Li & Raymond, NBER w31161 / QJE, 2023",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-emerald-600" />,
    value: "US$4,4T",
    label: "potensi nilai tambah AI generatif bagi ekonomi global per tahun.",
    source: "McKinsey Global Institute, 2023",
  },
];

const FAQ = [
  {
    q: "Apakah saya perlu kemampuan teknis atau coding?",
    a: "Tidak. Cukup ketik pertanyaan seperti chatting biasa. Setiap Claw sudah dirancang untuk profesional, bukan programmer.",
  },
  {
    q: "Apakah jawabannya akurat dan sesuai regulasi terbaru?",
    a: "Setiap Claw ditraining dengan regulasi Indonesia dan selalu menyertakan dasar rujukannya. Untuk keputusan resmi, hasil tetap perlu diverifikasi ke pihak berwenang — AI mempercepat, bukan menggantikan tanggung jawab profesional Anda.",
  },
  {
    q: "Bisakah saya coba dulu sebelum membeli?",
    a: "Bisa. Coba demo gratis dulu, dan paket Bisnis (Bundle) sudah termasuk 1 bulan Builder gratis sebagai bonus untuk Anda mencoba penuh.",
  },
  {
    q: "Apakah tools baru menambah biaya?",
    a: "Tidak. Tools baru yang masuk ke paket Anda otomatis tersedia tanpa biaya tambahan selama langganan aktif.",
  },
  {
    q: "Bagaimana cara mengaksesnya setelah membeli?",
    a: "Pilih paket → checkout → akses langsung aktif. Tidak ada konfigurasi teknis yang rumit.",
  },
];

export default function MulticlawSuitePage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | "semua">("semua");

  const PLAN_FILTERS: { label: string; value: PlanTier | "semua"; icon: React.ReactNode; desc: string }[] = [
    { label: "Semua",      value: "semua",      icon: <Filter className="h-3.5 w-3.5" />,  desc: `${totalClaws} claw` },
    { label: "Starter",    value: "starter",    icon: <Star className="h-3.5 w-3.5" />,    desc: `${starterCount} claw` },
    { label: "Profesional",value: "profesional",icon: <Zap className="h-3.5 w-3.5" />,     desc: `${proCount} claw` },
    { label: "Bisnis",     value: "bisnis",     icon: <Crown className="h-3.5 w-3.5" />,   desc: `${totalClaws} claw` },
  ];

  const planColors: Record<string, string> = {
    semua:      "bg-gray-800 text-white border-gray-600",
    starter:    "bg-blue-600 text-white border-blue-500",
    profesional:"bg-indigo-600 text-white border-indigo-500",
    bisnis:     "bg-violet-600 text-white border-violet-500",
  };
  const planColorsInactive = "bg-white/5 dark:bg-muted/30 text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/50";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-multiclaw-suite">
      <SharedHeader />

      {/* ── HERO (Attention) ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
            <Cpu className="h-3.5 w-3.5" />
            80+ AI Tools Spesialis Indonesia
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight" data-testid="text-hero-headline">
            Berhenti Mengerjakan Semuanya Sendirian.<br />
            <span className="text-cyan-100">Punya Armada AI Spesialis untuk Tiap Pekerjaan.</span>
          </h1>
          <p className="text-base md:text-lg text-cyan-100 mb-6 max-w-3xl mx-auto leading-relaxed">
            MultiClaw Suite memberi Anda 80+ tim AI multi-agen — Konstruksi, K3, Legal, Energi, SDM, hingga
            Marketing. Setiap "Claw" bekerja paralel dengan dasar regulasi Indonesia, menyelesaikan yang biasanya
            butuh berjam-jam riset dalam hitungan detik.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8 text-white">
            {[["80+", "AI Tools"], ["10+", "Sektor Industri"], ["5-12", "Sub-agen/Claw"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold">{num}</div>
                <div className="text-xs text-cyan-200">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_BUNDLE} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-mulai">
                <Zap className="h-5 w-5" /> Ambil Bundle — Bonus 1 Bulan Gratis
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-tanya">
                <MessageCircle className="h-4 w-4" /> Tanya via WA
              </Button>
            </a>
          </div>
          <p className="text-cyan-200/80 text-xs mt-4">Coba demo gratis dulu • Aktif tanpa konfigurasi teknis • Dikurasi & diuji tim Gustafta</p>
        </div>
      </section>

      {/* ── PROBLEM (PAS) ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-2">Kenapa Pekerjaan Terasa Makin Berat</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Tuntutan Naik, Waktu & Tenaga Tetap Segitu
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground mb-10 max-w-2xl mx-auto">
            Profesional Indonesia menghadapi tekanan yang sama setiap hari. Mungkin ini terdengar familiar:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PROBLEMS.map((p, i) => (
              <div
                key={i}
                className="flex gap-4 bg-red-50/60 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-5"
                data-testid={`card-problem-${i}`}
              >
                <div className="shrink-0 p-2.5 bg-white dark:bg-card rounded-xl border border-red-100 dark:border-red-900/30 h-fit">
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">{p.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGITATE (PAS) ── */}
      <section className="py-14 px-4 bg-gray-900 dark:bg-black/40 text-center">
        <div className="max-w-3xl mx-auto">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-5" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 leading-snug">
            Setiap jam yang habis untuk riset manual adalah tender yang nyaris lolos,
            audit yang menegangkan, dan margin yang menipis.
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Status quo punya harga yang tak tertulis: kesempatan yang hilang, risiko salah regulasi, dan
            tenaga yang terkuras sebelum proyek menghasilkan. Semakin lama dibiarkan, semakin mahal.
          </p>
        </div>
      </section>

      {/* ── RISET / DATA (credibility) ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Bukan Sekadar Tren</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Pergeseran yang Didukung Riset
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground mb-10 max-w-2xl mx-auto">
            Bukan opini — data lintas industri menunjukkan besarnya waktu yang hilang, dan potensi yang
            terbuka, saat pekerjaan didampingi AI.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {STATS.map((s, i) => (
              <div key={i} className="bg-gray-50 dark:bg-card rounded-2xl p-6 border border-gray-100 dark:border-border text-center" data-testid={`stat-${i}`}>
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-white dark:bg-muted rounded-xl border border-gray-100 dark:border-border">{s.icon}</div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{s.value}</div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed mb-3">{s.label}</p>
                <p className="text-[10px] text-gray-400 dark:text-muted-foreground/70 leading-snug">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-gray-400 dark:text-muted-foreground/60 mt-6 max-w-2xl mx-auto">
            Angka di atas adalah temuan riset industri sebagai konteks umum, bukan klaim hasil spesifik produk MultiClaw Suite.
          </p>
        </div>
      </section>

      {/* ── SOLUTION (PAS → Interest) ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Solusinya</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Bukan Sekadar Chatbot — Tim AI Spesialis yang Bekerja Bersama
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground mb-10 max-w-2xl mx-auto">
            Setiap "Claw" adalah orchestrator AI yang mengoordinasi tim sub-agen spesialis secara paralel,
            lalu mengompilasinya menjadi laporan terstruktur — seolah Anda punya satu tim konsultan di tiap bidang.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Cpu className="h-7 w-7 text-teal-600" />,
                title: "Orchestrator + Sub-Agen",
                desc: "Satu pertanyaan → dipecah ke 5–12 sub-agen spesialis yang bekerja paralel. Hasilnya dikompilasi jadi laporan terstruktur.",
              },
              {
                icon: <Sparkles className="h-7 w-7 text-violet-600" />,
                title: "5-Level Modular Hierarchy",
                desc: "Master → Series HUB → Sub-HUB → Specialist → Deep Specialist. Setiap level makin dalam dan spesifik keahliannya.",
              },
              {
                icon: <Shield className="h-7 w-7 text-blue-600" />,
                title: "Berbasis Regulasi Indonesia",
                desc: "Ditraining dengan Perpres, Permen PUPR, SNI, SKKNI, UU Ketenagakerjaan, dan ratusan standar teknis lokal.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border text-center" data-testid={`card-how-${i}`}>
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-gray-50 dark:bg-muted rounded-xl">{item.icon}</div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESIRE: Tanpa vs Dengan ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Bedanya Terasa Sejak Hari Pertama</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Dari Kewalahan Menjadi Kendali Penuh
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Tanpa */}
            <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 p-6">
              <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                <X className="h-5 w-5" /> Tanpa MultiClaw
              </h3>
              <ul className="space-y-3">
                {COMPARE.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-muted-foreground" data-testid={`compare-tanpa-${i}`}>
                    <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    {c.tanpa}
                  </li>
                ))}
              </ul>
            </div>
            {/* Dengan */}
            <div className="rounded-2xl border-2 border-teal-300 dark:border-teal-700 bg-teal-50/60 dark:bg-teal-900/10 p-6">
              <h3 className="font-bold text-teal-700 dark:text-teal-300 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Dengan MultiClaw
              </h3>
              <ul className="space-y-3">
                {COMPARE.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-foreground font-medium" data-testid={`compare-dengan-${i}`}>
                    <Check className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                    {c.dengan}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Outcomes strip */}
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {OUTCOMES.map((o, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-muted/30 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-muted-foreground" data-testid={`outcome-${i}`}>
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                {o}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES (Desire) ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Skenario Nyata</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Bagaimana Profesional Memakainya
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {USE_CASES.map((u, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-6 border border-gray-100 dark:border-border" data-testid={`card-usecase-${i}`}>
                <div className="p-2.5 bg-gray-50 dark:bg-muted rounded-xl w-fit mb-4">{u.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">{u.persona}</h3>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {u.claws.map((c) => (
                    <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">{u.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KATALOG (proof of breadth) ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Bukti Cakupan</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
            80+ AI Tools dalam 10 Kategori
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground mb-8 text-sm">
            Apa pun bidang Anda, kemungkinan besar sudah ada Claw-nya. Filter berdasarkan paket untuk melihat akses Anda.
          </p>

          {/* ── Plan filter ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {PLAN_FILTERS.map(p => (
              <button
                key={p.value}
                onClick={() => setSelectedPlan(p.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                  selectedPlan === p.value ? planColors[p.value] : planColorsInactive
                }`}
                data-testid={`filter-plan-${p.value}`}
              >
                {p.icon}
                {p.label}
                <span className={`text-[10px] opacity-70`}>{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Legend */}
          {selectedPlan === "semua" && (
            <div className="flex flex-wrap justify-center gap-3 mb-8 text-[10px] text-gray-500 dark:text-muted-foreground">
              {(["starter","profesional","bisnis"] as PlanTier[]).map(p => (
                <span key={p} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${PLAN_DOT[p]}`} />
                  {p === "starter" ? "Starter" : p === "profesional" ? "Profesional" : "Bisnis"}
                </span>
              ))}
            </div>
          )}

          {selectedPlan !== "semua" && (
            <div className="flex justify-center mb-8">
              <div className={`inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full border ${
                selectedPlan === "starter"     ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" :
                selectedPlan === "profesional" ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" :
                "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300"
              }`}>
                <Lock className="h-3 w-3 opacity-60" />
                Tool berwarna abu-abu memerlukan upgrade paket yang lebih tinggi
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {CATEGORIES.map((cat, i) => {
              const accessibleTools = cat.tools.filter(t => isAccessible(t, selectedPlan));
              const hasAny = selectedPlan === "semua" || accessibleTools.length > 0;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 transition-all ${bgMap[cat.color]} ${
                    !hasAny ? "opacity-40" : ""
                  }`}
                  data-testid={`card-category-${i}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{cat.label}</h3>
                    {selectedPlan !== "semua" && (
                      <span className="text-[10px] text-gray-400 dark:text-muted-foreground">
                        {accessibleTools.length}/{cat.tools.length} tersedia
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tools.map((tool, j) => {
                      const accessible = isAccessible(tool, selectedPlan);
                      const plan = getPlan(tool);
                      return (
                        <span
                          key={j}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            accessible
                              ? "bg-white/80 dark:bg-background/60 border-gray-200 dark:border-border text-gray-700 dark:text-muted-foreground"
                              : "bg-gray-100 dark:bg-muted/20 border-gray-200 dark:border-border text-gray-300 dark:text-muted-foreground/40 line-through"
                          }`}
                        >
                          {selectedPlan === "semua" && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PLAN_DOT[plan]}`} />
                          )}
                          {!accessible && <Lock className="h-2.5 w-2.5 shrink-0" />}
                          {tool}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CARA AKSES / PRICING (Action) ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Pilih Paket</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Mulai dari yang Sesuai Kebutuhan Anda</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground mb-10 text-sm max-w-xl mx-auto">
            Tidak perlu komitmen besar untuk mulai. Naik kelas kapan saja saat kebutuhan bertambah.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {/* Starter */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Starter</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4">
                Akses {starterCount} MultiClaw inti — SBU, Tender, Perizinan dasar. Cocok untuk BUJK yang baru mulai.
              </p>
              <ul className="space-y-1.5 mb-5">
                {[`${starterCount} claw SBU & Tender`, "SSE streaming real-time", "Sub-agen panel visualisasi"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href={CHECKOUT_BASIC} target="_blank" rel="noopener noreferrer">
                <Button className="w-full font-bold border-blue-300 dark:border-blue-700" variant="outline" data-testid="btn-akses-starter">
                  Mulai Starter <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Profesional */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 border-2 border-indigo-300 dark:border-indigo-700 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Profesional</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4">
                Akses {proCount} MultiClaw — termasuk Konstruksi Teknis, SKK, K3, ISO, dan Perizinan lanjutan.
              </p>
              <ul className="space-y-1.5 mb-5">
                {[`${proCount} claw Konstruksi & SKK`, "K3, ISO & Perizinan", "Update tools baru otomatis"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={builderUrl}>
                <Button className="w-full font-bold border-indigo-300 dark:border-indigo-700" variant="outline" data-testid="btn-akses-profesional">
                  Lihat Paket Profesional <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Bisnis — recommended */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 border-2 border-teal-400 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">REKOMENDASI</div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-violet-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Bisnis</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4">
                Akses semua {totalClaws} MultiClaw — termasuk Energi, HR, Marketing, dan Bisnis. Bundle Trilogi + 1 bulan gratis.
              </p>
              <ul className="space-y-1.5 mb-5">
                {["Semua 80+ claw tanpa batas", "3 buku Trilogi (PDF + Flipbook)", "50+ Prompt Pack siap pakai", "1 bulan Builder GRATIS"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href={CHECKOUT_BUNDLE} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold" data-testid="btn-akses-bundle">
                  Ambil Bundle Sekarang →
                </Button>
              </a>
            </div>
          </div>

          {/* Risk reversal */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-teal-500" /> Coba demo gratis dulu</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-teal-500" /> Bundle termasuk 1 bulan Builder gratis</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-teal-500" /> Aktif tanpa konfigurasi teknis</span>
          </div>
        </div>
      </section>

      {/* ── FAQ (objection handling) ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest text-center mb-2">Masih Ragu?</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Pertanyaan yang Sering Diajukan
          </h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="group bg-gray-50 dark:bg-muted/20 rounded-2xl border border-gray-100 dark:border-border overflow-hidden" data-testid={`faq-${i}`}>
                <summary className="flex items-center justify-between gap-3 cursor-pointer p-5 list-none">
                  <span className="flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white text-sm">
                    <HelpCircle className="h-4 w-4 text-teal-500 shrink-0" />
                    {f.q}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-500 dark:text-muted-foreground leading-relaxed pl-12">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (Action) ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-cyan-700 to-teal-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Armada AI Siap Bekerja untuk Anda Hari Ini</h2>
          <p className="text-cyan-100 mb-8 leading-relaxed">
            Tidak perlu memilih satu tool. Dengan MultiClaw Suite, seluruh ekosistem AI spesialis Indonesia
            ada di tangan Anda — mulai dari sekarang, bukan nanti.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_BUNDLE} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-mulai">
                <Zap className="h-5 w-5" /> Ambil Bundle Sekarang
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WhatsApp
              </Button>
            </a>
          </div>
          <Link href={builderUrl}>
            <span className="inline-flex items-center gap-1 mt-5 text-cyan-100 text-sm hover:text-white cursor-pointer" data-testid="link-cta-akses">
              Sudah punya akun? Buka MultiClaw Suite <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/trilogi"><span className="hover:text-white cursor-pointer">Trilogi</span></Link>
          <Link href="/multiclaw"><span className="hover:text-white cursor-pointer">Direktori</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
