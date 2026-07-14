import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Leaf, BarChart3,
  AlertTriangle, RefreshCw, Shield, Star, Globe,
  Building2, TrendingUp, Award,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20ISO%2014001%20Sistem%20Manajemen%20Lingkungan";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";

const STATS_SML = [
  { icon: Leaf, value: "300.410", label: "Sertifikat ISO 14001 valid di seluruh dunia", source: "ISO Survey 2023" },
  { icon: Building2, value: "122.814", label: "Di antaranya dari sektor konstruksi — sektor pengguna ISO 14001 teratas", source: "ISO Survey 2023" },
  { icon: BarChart3, value: "1,48 juta", label: "Total sertifikasi sistem manajemen ISO aktif secara global", source: "ISO Survey 2023" },
];

export default function KonsultanIsoSmlPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-iso-sml">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Leaf className="h-3.5 w-3.5" />
                ISOClaw 14001 — AI Konsultan Sistem Manajemen Lingkungan
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Bisnis Berkelanjutan<br />
                <span className="text-green-200">Dimulai dari SML yang Kuat</span>
              </h1>
              <p className="text-base md:text-lg text-emerald-100 mb-8 leading-relaxed">
                ISOClaw 14001 hadir dengan 6 sub-agen spesialis untuk memandu implementasi
                Sistem Manajemen Lingkungan (SML) ISO 14001:2015 — dari identifikasi aspek &
                dampak lingkungan, kepatuhan regulasi KLHK, hingga integrasi dengan ESG reporting.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <Link href={builderUrl}>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-coba">
                    Coba Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "6", label: "Sub-Agen ISOClaw 14001", sub: "Lingkungan & keberlanjutan" },
                { num: "AMDAL", label: "Regulasi KLHK", sub: "AMDAL, UKL-UPL, SPPL, PTSP" },
                { num: "ESG", label: "Integrasi ESG", sub: "GHG, GRI, TCFD terintegrasi" },
                { num: "PDCA", label: "Siklus Perbaikan", sub: "Continual improvement SML" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-green-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Topics */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest text-center mb-2">Cakupan AI Konsultan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Seluruh Aspek SML ISO 14001:2015</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Perencanaan & Perancangan SML",
                icon: <Globe className="h-5 w-5 text-green-600" />,
                color: "green",
                items: [
                  "Identifikasi aspek & dampak lingkungan (signifikan vs tidak signifikan)",
                  "Identifikasi kewajiban kepatuhan: KLHK, Pemda, izin lingkungan",
                  "Penetapan sasaran & program lingkungan yang SMART",
                  "Risk-Based Thinking: risiko & peluang aspek lingkungan",
                  "Pemetaan konteks organisasi terkait lingkungan",
                ],
              },
              {
                title: "Operasional & Kendali Lingkungan",
                icon: <RefreshCw className="h-5 w-5 text-emerald-600" />,
                color: "emerald",
                items: [
                  "Pengelolaan limbah B3 & non-B3: identifikasi, penyimpanan, pengangkutan",
                  "Pengendalian pencemaran udara, air, & tanah per BAKU MUTU",
                  "Program penghematan energi & air di fasilitas",
                  "Prosedur tanggap darurat lingkungan & simulasi",
                  "Pengelolaan subkontraktor & rantai pasok (Klausul 8.1)",
                ],
              },
              {
                title: "Monitoring, Audit & Pelaporan",
                icon: <BarChart3 className="h-5 w-5 text-teal-600" />,
                color: "teal",
                items: [
                  "Pemantauan kinerja lingkungan: emisi, limbah, energi, air",
                  "Audit internal SML per klausul ISO 14001:2015",
                  "Evaluasi kepatuhan regulasi lingkungan secara berkala",
                  "Pelaporan kinerja lingkungan untuk KLHK & Pemda",
                  "Persiapan audit eksternal & sertifikasi ISO 14001",
                ],
              },
              {
                title: "ESG & Keberlanjutan Terintegrasi",
                icon: <Leaf className="h-5 w-5 text-green-500" />,
                color: "green",
                items: [
                  "Kalkulasi emisi GRK Scope 1, 2, 3 berbasis ISO 14064",
                  "Integrasi SML dengan laporan keberlanjutan GRI Standards",
                  "Panduan PROPER KLHK: persyaratan Hijau & Emas",
                  "Koneksi ISO 14001 ke standar TCFD & SFDR untuk investor",
                  "Carbon footprint reduction roadmap & target net-zero",
                ],
              },
            ].map((sec, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${sec.color === "teal" ? "bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800" : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"}`} data-testid={`card-sml-${i}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{sec.icon}</div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{sec.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulasi KLHK */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest text-center mb-2">Regulasi Lingkungan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Regulasi KLHK yang Dipahami AI</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["UU No. 32/2009 (PPLH)", "PP No. 22/2021 (NSPK LH)", "Permen LHK AMDAL/UKL-UPL", "Baku Mutu Lingkungan Hidup", "PROPER KLHK", "PermenLH Limbah B3", "Izin Lingkungan & PTSP", "Perjanjian Paris & NDC RI"].map((r, i) => (
              <div key={i} className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3 border border-green-100 dark:border-green-800/30 text-center text-xs font-medium text-green-800 dark:text-green-300">
                {r}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menurut Data */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Menurut Data</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Standar Lingkungan Makin Jadi Tuntutan Global</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STATS_SML.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border border-green-100 dark:border-green-800/30 bg-green-50 dark:bg-green-900/10 p-5" data-testid={`card-research-${i}`}>
                  <SIcon className="h-6 w-6 text-green-600 mb-3" />
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">{s.label}</div>
                  <p className="text-xs text-muted-foreground/70 mt-2">Sumber: {s.source}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6 max-w-2xl mx-auto">
            Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">SML yang Kuat adalah Fondasi Bisnis Berkelanjutan</h2>
          <p className="text-green-100 text-sm mb-6">Investor, pembeli internasional, dan regulator semakin mensyaratkan bukti nyata komitmen lingkungan organisasi Anda.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-green-200 mt-4">
            Lihat juga:{" "}
            <Link href="/konsultan-iso-smm"><span className="underline font-semibold cursor-pointer">ISO 9001 (Mutu) →</span></Link>
            {" · "}
            <Link href="/esg-sustainability"><span className="underline font-semibold cursor-pointer">ESGClaw →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-iso-smm"><span className="hover:text-white cursor-pointer">ISO 9001</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
