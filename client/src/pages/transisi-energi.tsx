import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import { trackInitiateCheckout, withMetaAttribution } from "@/hooks/use-meta-pixel";
import {
  Check, ArrowRight, MessageCircle, Leaf, Sun, Wind,
  BarChart3, Shield, Globe, Zap, TrendingUp, FileText,
} from "lucide-react";

function openCheckout(e: { preventDefault: () => void }, url: string, label: string, value: number) {
  e.preventDefault();
  trackInitiateCheckout({ content_name: label, value, currency: "IDR" });
  window.open(withMetaAttribution(url), "_blank", "noopener,noreferrer");
}

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20transisi%20energi%20dan%20lingkungan";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";
const CHECKOUT_BASIC = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";

const PILLARS = [
  {
    id: "ebt",
    color: "yellow",
    icon: <Sun className="h-7 w-7 text-yellow-600" />,
    title: "Energi Baru & Terbarukan (EBT)",
    tools: [
      { name: "EBTSolarClaw", desc: "Konsultan PLTS & energi surya — desain, perizinan, insentif ESDM" },
      { name: "EnergiClaw", desc: "Konsultan energi & EBT — regulasi, ekonomi proyek, BOOT/IPP" },
      { name: "TransisiEnergiClaw", desc: "Strategi transisi energi — peta jalan, target NDC, just transition" },
      { name: "ETLOAcademyClaw", desc: "Program ETLO — edukasi sertifikasi EBT & kompetensi energi" },
    ],
    usecases: [
      "Kelayakan teknis & ekonomi proyek PLTS",
      "Perizinan IUPTL & sertifikasi PLTS rooftop",
      "Panduan insentif fiskal proyek EBT",
      "Peta jalan transisi energi perusahaan",
      "Kalkulasi potensi penghematan energi",
    ],
  },
  {
    id: "lingkungan",
    color: "emerald",
    icon: <Leaf className="h-7 w-7 text-emerald-600" />,
    title: "Lingkungan Hidup & AMDAL",
    tools: [
      { name: "LingkunganClaw", desc: "Konsultan lingkungan hidup — AMDAL, UKL-UPL, KLHS, PROPER" },
      { name: "TataLingkunganClaw", desc: "SKK Tata Lingkungan & kompetensi tenaga ahli lingkungan" },
      { name: "ISOClaw 14001", desc: "Sistem Manajemen Lingkungan — gap analysis, implementasi, sertifikasi" },
      { name: "HACCPClaw", desc: "Keamanan pangan & BPOM — HACCP, sertifikasi halal, izin edar" },
    ],
    usecases: [
      "Panduan penyusunan dokumen AMDAL",
      "Checklist persyaratan UKL-UPL per jenis usaha",
      "Gap analysis implementasi ISO 14001",
      "Strategi peningkatan peringkat PROPER",
      "Prosedur pengelolaan limbah B3",
    ],
  },
  {
    id: "esg",
    color: "green",
    icon: <TrendingUp className="h-7 w-7 text-green-600" />,
    title: "ESG & Keberlanjutan Bisnis",
    tools: [
      { name: "ESGClaw", desc: "ESG & keberlanjutan Indonesia — pelaporan, rating, strategi dekarbonisasi" },
      { name: "TransisiEnergiClaw", desc: "Dekarbonisasi operasional & supply chain, carbon footprint" },
      { name: "LingkunganClaw", desc: "Kepatuhan lingkungan & manajemen risiko iklim (TCFD)" },
      { name: "ETLOBizDevClaw", desc: "Strategi bisnis ETLO — pengembangan portofolio EBT & green business" },
    ],
    usecases: [
      "Penyusunan laporan keberlanjutan GRI/SASB",
      "Kalkulasi emisi Scope 1, 2, & 3",
      "Strategi net-zero & carbon offset",
      "Analisis risiko iklim berbasis TCFD",
      "Panduan green bond & sustainability-linked financing",
    ],
  },
  {
    id: "safety",
    color: "teal",
    icon: <Shield className="h-7 w-7 text-teal-600" />,
    title: "K3 & Keselamatan Energi",
    tools: [
      { name: "OffshoreSafetyClaw", desc: "K3 operasi migas offshore — HAZOP, SIMOPS, safety case" },
      { name: "SMK3Claw", desc: "SMK3 & ISO 45001 untuk perusahaan energi" },
      { name: "K3ManClaw", desc: "Manajemen K3 konstruksi & SKK K3 energi" },
      { name: "SMAPClaw", desc: "ISO 37001 Anti-Penyuapan — SMAP untuk BUMN energi" },
    ],
    usecases: [
      "Implementasi sistem manajemen K3 ISO 45001",
      "HAZOP & risk assessment proyek EBT",
      "Audit K3 lapangan & corrective action",
      "Prosedur tanggap darurat energi",
    ],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/10", border: "border-yellow-200 dark:border-yellow-800", icon: "bg-yellow-100 dark:bg-yellow-900/30", tag: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/30", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  green: { bg: "bg-green-50 dark:bg-green-900/10", border: "border-green-200 dark:border-green-800", icon: "bg-green-100 dark:bg-green-900/30", tag: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  teal: { bg: "bg-teal-50 dark:bg-teal-900/10", border: "border-teal-200 dark:border-teal-800", icon: "bg-teal-100 dark:bg-teal-900/30", tag: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
};

export default function TransisiEnergiPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-transisi-energi">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Leaf className="h-3.5 w-3.5" />
                AI untuk Transisi Energi & Lingkungan Hidup
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Menuju Net-Zero<br />
                <span className="text-emerald-200">dengan AI yang Memahami Jalannya</span>
              </h1>
              <p className="text-base md:text-lg text-emerald-100 mb-8 leading-relaxed">
                Dari PLTS rooftop, AMDAL, ISO 14001, pelaporan ESG, hingga strategi dekarbonisasi —
                Gustafta menghadirkan AI spesialis yang memahami regulasi lingkungan dan energi
                Indonesia secara mendalam.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <Link href={builderUrl}>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-mulai">
                    Coba Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "16+", label: "AI Tools Lingkungan & EBT", sub: "PLTS, AMDAL, ESG, K3" },
                { num: "4", label: "Pilar Utama", sub: "EBT · Lingkungan · ESG · Safety" },
                { num: "NDC", label: "Target Indonesia", sub: "29–41% pengurangan emisi 2030" },
                { num: "TCFD", label: "Standar Pelaporan", sub: "GRI, SASB, TCFD, SFDR" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-emerald-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">Empat Pilar Solusi</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Coverage Lengkap: EBT, Lingkungan, ESG & Safety
          </h2>
          <div className="space-y-6">
            {PILLARS.map((pillar) => {
              const c = colorStyles[pillar.color];
              return (
                <div key={pillar.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-pillar-${pillar.id}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`p-3 rounded-xl ${c.icon}`}>{pillar.icon}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-xl">{pillar.title}</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Tools</p>
                      <div className="space-y-2.5">
                        {pillar.tools.map((tool, j) => (
                          <div key={j}>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{tool.name}</span>
                            <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Use Cases</p>
                      <ul className="space-y-2">
                        {pillar.usecases.map((uc, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            {uc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">Target Pengguna</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Paling Diuntungkan?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Globe className="h-5 w-5 text-emerald-500" />, title: "Perusahaan & BUMN Energi", points: ["Tim sustainability & ESG", "Divisi lingkungan hidup", "Manajer energi & efisiensi", "Pelaporan GRI & keberlanjutan"] },
              { icon: <Sun className="h-5 w-5 text-yellow-500" />, title: "Developer Proyek EBT", points: ["Developer PLTS rooftop & utility", "IPP Angin, Hidro, Bioenergi", "Konsultan studi kelayakan EBT", "Lembaga keuangan hijau (green finance)"] },
              { icon: <Leaf className="h-5 w-5 text-green-500" />, title: "Konsultan Lingkungan", points: ["Konsultan penyusun AMDAL/UKL-UPL", "Auditor lingkungan & ISO 14001", "Peneliti perubahan iklim", "LSM & advokasi lingkungan"] },
            ].map((group, i) => (
              <div key={i} className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menurut Data ── */}
      <section className="py-16 px-4 bg-emerald-50 dark:bg-emerald-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Konteks Transisi Energi Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "14,1%", label: "Realisasi bauran energi terbarukan nasional 2024", source: "KESDM 2024", icon: <Sun className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
              { value: "19,5%", label: "Target bauran EBT 2024 yang masih harus dikejar", source: "KESDM", icon: <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
              { value: "13.155 MW", label: "Total kapasitas terpasang pembangkit EBT (2023)", source: "KESDM", icon: <Wind className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-emerald-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-700 via-emerald-700 to-teal-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Leaf className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Transisi Energi Butuh Panduan yang Tepat</h2>
          <p className="text-emerald-100 mb-8 leading-relaxed">
            Regulasi lingkungan dan EBT berubah cepat. AI Gustafta siap menjadi navigator Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer"
              onClick={(e) => openCheckout(e, CHECKOUT_URL, "Bundle Trilogi (Transisi Energi)", 499000)}>
              <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-emerald-200 mt-5">
            Lihat juga:{" "}
            <Link href="/energi"><span className="underline font-semibold cursor-pointer">Ketenagalistrikan & Migas →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/energi"><span className="hover:text-white cursor-pointer">Energi & Migas</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
