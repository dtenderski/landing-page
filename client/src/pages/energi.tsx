import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Zap,
  Flame, Layers, Shield, BarChart3, FileText, Award,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20sektor%20energi%20dan%20pertambangan";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const SECTORS = [
  {
    id: "listrik",
    color: "yellow",
    icon: <Zap className="h-7 w-7 text-yellow-600" />,
    title: "Ketenagalistrikan",
    subtitle: "PLN · IPP · Instalatir · Konsultan Listrik",
    tools: [
      { name: "KetenagalistrikanClaw", desc: "Konsultan regulasi & perizinan ketenagalistrikan Indonesia — UU 30/2009, Permen ESDM, SPLN" },
      { name: "TransmisiClaw", desc: "Transmisi, gardu induk, & operasi jaringan PLN — 7 sub-agen spesialis" },
      { name: "ElektrikalClaw", desc: "SKK klasifikasi elektrikal & kompetensi tenaga teknik" },
      { name: "MEPClaw", desc: "Mekanikal-Elektrikal-Plumbing untuk bangunan & industri" },
    ],
    usecases: [
      "Panduan perizinan IUPTL & SLO",
      "Interpretasi Permen ESDM & SNI kelistrikan",
      "Persyaratan SKK tenaga teknik ketenagalistrikan",
      "Review single line diagram & proteksi",
      "Analisis kualitas daya & efisiensi energi",
    ],
    regs: ["UU 30/2009 Ketenagalistrikan", "Permen ESDM No. 12/2021", "SPLN series", "PUIL 2011 / SNI 0225"],
  },
  {
    id: "migas",
    color: "orange",
    icon: <Flame className="h-7 w-7 text-orange-600" />,
    title: "Migas & Perminyakan",
    subtitle: "SKK Migas · Kontraktor KKS · Konsultan Hulu-Hilir",
    tools: [
      { name: "MigasClaw", desc: "Kompetensi & perizinan energi migas — 9 sub-agen hulu-hilir" },
      { name: "OffshoreSafetyClaw", desc: "K3 & operasi migas offshore — safety case, HAZOP, SIMOPS" },
      { name: "GeologiClaw", desc: "Geologi & eksplorasi — pemetaan, stratigrafi, sumber daya" },
      { name: "PertambanganClaw", desc: "Regulasi & teknis pertambangan mineral & batu bara" },
    ],
    usecases: [
      "Panduan perizinan Wilayah Kerja Migas",
      "Interpretasi PTK SKK Migas & Permen ESDM",
      "Persyaratan SKK tenaga teknis migas",
      "Prosedur HAZOP & safety case offshore",
      "Analisis reservoir & perencanaan pengeboran",
    ],
    regs: ["UU 22/2001 Migas", "PTK SKK Migas", "Permen ESDM No. 08/2017", "API & ISO standards"],
  },
  {
    id: "tambang",
    color: "stone",
    icon: <Layers className="h-7 w-7 text-stone-600" />,
    title: "Pertambangan",
    subtitle: "Pemegang IUP · Kontraktor Tambang · Konsultan ESDM",
    tools: [
      { name: "PertambanganClaw", desc: "Konsultan pertambangan mineral & batubara — regulasi, teknis, & lingkungan" },
      { name: "GeologiClaw", desc: "Geologi eksplorasi, pemetaan geologi, & estimasi sumber daya mineral" },
      { name: "LingkunganClaw", desc: "AMDAL, UKL-UPL, reklamasi & pascatambang untuk sektor tambang" },
      { name: "ESGClaw", desc: "ESG & keberlanjutan — PROPER, pelaporan lingkungan, community dev" },
    ],
    usecases: [
      "Panduan permohonan & perpanjangan IUP/IUPK",
      "Persyaratan RKAB & laporan triwulan MOMI",
      "Prosedur reklamasi & penutupan tambang",
      "Analisis cadangan & klasifikasi sumber daya",
      "Perizinan lingkungan AMDAL pertambangan",
    ],
    regs: ["UU 4/2009 jo. 3/2020 Minerba", "PP 96/2021", "Permen ESDM No. 7/2020", "JORC Code"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string; badge: string }> = {
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "bg-yellow-100 dark:bg-yellow-900/30",
    tag: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    badge: "text-yellow-700 dark:text-yellow-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/10",
    border: "border-orange-200 dark:border-orange-800",
    icon: "bg-orange-100 dark:bg-orange-900/30",
    tag: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    badge: "text-orange-700 dark:text-orange-400",
  },
  stone: {
    bg: "bg-stone-50 dark:bg-stone-900/10",
    border: "border-stone-200 dark:border-stone-700",
    icon: "bg-stone-100 dark:bg-stone-800/30",
    tag: "bg-stone-100 text-stone-700 dark:bg-stone-800/30 dark:text-stone-400",
    badge: "text-stone-700 dark:text-stone-400",
  },
};

export default function EnergiPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-energi">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-600 via-orange-600 to-red-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Zap className="h-3.5 w-3.5" />
                AI untuk Sektor Energi & Sumber Daya Alam
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                AI Spesialis<br />
                <span className="text-yellow-200">Ketenagalistrikan, Migas & Pertambangan</span>
              </h1>
              <p className="text-base md:text-lg text-orange-100 mb-8 leading-relaxed">
                Regulasi ESDM berubah terus, perizinan berlapis, dan persyaratan teknis kompleks.
                Gustafta menghadirkan AI yang memahami ekosistem energi Indonesia secara mendalam —
                dari hulu ke hilir, dari UU hingga PTK lapangan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-orange-800 hover:bg-orange-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "12+", label: "AI Tools Energi", sub: "Listrik, Migas, Tambang" },
                { num: "3", label: "Sub-Sektor Covered", sub: "End-to-end coverage" },
                { num: "50+", label: "Regulasi ESDM", sub: "UU, PP, Permen, PTK" },
                { num: "9+", label: "Sub-Agen per Claw", sub: "Analisis paralel mendalam" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-yellow-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTORS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest text-center mb-2">Tiga Sub-Sektor</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Solusi AI per Sub-Sektor Energi
          </h2>
          <div className="space-y-6">
            {SECTORS.map((sec) => {
              const c = colorStyles[sec.color];
              return (
                <div key={sec.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-sector-${sec.id}`}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${c.icon}`}>{sec.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-xl">{sec.title}</h3>
                      <p className="text-xs text-gray-500">{sec.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-5">
                    {/* Tools */}
                    <div className="md:col-span-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Tools</p>
                      <div className="space-y-2.5">
                        {sec.tools.map((tool, j) => (
                          <div key={j}>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{tool.name}</span>
                            <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Use cases */}
                    <div className="md:col-span-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Use Cases</p>
                      <ul className="space-y-1.5">
                        {sec.usecases.map((uc, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            {uc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Regs */}
                    <div className="md:col-span-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Regulasi Dipahami</p>
                      <ul className="space-y-1.5">
                        {sec.regs.map((reg, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            {reg}
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
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest text-center mb-2">Target Pengguna</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Untuk Siapa AI Energi Ini?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: <Zap className="h-5 w-5 text-yellow-500" />, title: "Perusahaan Ketenagalistrikan", points: ["Staf perizinan & regulasi IUPTL", "Engineer transmisi & distribusi", "Tim SKK & sertifikasi teknisi", "Konsultan sistem kelistrikan"] },
              { icon: <Flame className="h-5 w-5 text-orange-500" />, title: "Perusahaan Migas", points: ["Tim legal & compliance SKK Migas", "Engineer hulu (eksplorasi & produksi)", "Kontraktor KKS & service company", "HSE officer operasi offshore"] },
              { icon: <Layers className="h-5 w-5 text-stone-500" />, title: "Perusahaan Pertambangan", points: ["Tim perizinan IUP/IUPK & RKAB", "Geologist & mine planner", "Konsultan lingkungan tambang", "Tim reklamasi & pascatambang"] },
              { icon: <Award className="h-5 w-5 text-blue-500" />, title: "Konsultan & Akademisi", points: ["Konsultan regulasi ESDM", "Peneliti energi & sumber daya", "Dosen teknik pertambangan/perminyakan", "Lembaga sertifikasi energi"] },
            ].map((group, i) => (
              <div key={i} className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{group.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
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
      <section className="py-16 px-4 bg-orange-50 dark:bg-orange-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Konteks Sektor Energi Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "14,1%", label: "Realisasi bauran energi terbarukan nasional 2024", source: "KESDM 2024", icon: <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" /> },
              { value: "19,5%", label: "Target bauran EBT 2024 — masih ada gap ±5,4 poin", source: "KESDM", icon: <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" /> },
              { value: "13.155 MW", label: "Total kapasitas terpasang pembangkit EBT (2023)", source: "KESDM", icon: <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-orange-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── PAKET ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Pilih Paket</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Mulai dari Mana?</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-gray-200 dark:border-border text-left">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Starter Kit</h3>
              <p className="text-xs text-gray-500 mb-4">Fondasi membangun chatbot AI pertama untuk tim energi Anda</p>
              <ul className="space-y-2 mb-5 text-xs text-gray-700 dark:text-muted-foreground">
                {["Buku I + Panduan Builder", "15 Prompt Pack siap pakai", "Garansi 7 hari"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-500" />{item}</li>
                ))}
              </ul>
              <a href={CHECKOUT_BASIC} target="_blank" rel="noopener noreferrer">
                <Button className="w-full" variant="outline" data-testid="btn-paket-basic">Tanya Info Pembayaran via WA →</Button>
              </a>
            </div>
            <div className="bg-white dark:bg-card rounded-2xl p-6 border-2 border-orange-400 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">REKOMENDASI</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Bundle Trilogi</h3>
              <p className="text-xs text-gray-500 mb-4">Solusi lengkap + akses MultiClaw Suite energi</p>
              <ul className="space-y-2 mb-5 text-xs text-gray-700 dark:text-muted-foreground">
                {["3 Buku + 50+ Prompt Pack", "Template tim 6-agen AI", "1 Bulan Builder GRATIS"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-500" />{item}</li>
                ))}
              </ul>
              <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold" data-testid="btn-paket-bundle">Tanya Info Pembayaran via WA →</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-yellow-600 via-orange-600 to-red-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Sektor Energi Butuh AI yang Paham Regulasinya</h2>
          <p className="text-orange-100 mb-8 leading-relaxed">
            Mulai konsultasi gratis atau langsung ambil akses MultiClaw Suite untuk tim energi Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-orange-800 hover:bg-orange-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-yellow-200 mt-5">
            Lihat juga:{" "}
            <Link href="/transisi-energi"><span className="underline font-semibold cursor-pointer">Transisi Energi & Lingkungan →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <Link href="/transisi-energi"><span className="hover:text-white cursor-pointer">Transisi Energi</span></Link>
          <Link href="/multiclaw-suite"><span className="hover:text-white cursor-pointer">MultiClaw Suite</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
