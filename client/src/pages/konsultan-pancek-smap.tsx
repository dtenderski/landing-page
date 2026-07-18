import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Shield, ShieldCheck,
  AlertTriangle, Eye, Star, ClipboardList, Building2,
  Users, FileText, Gavel,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20SMAP%20ISO%2037001%20dan%20PancekClaw";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const STATS_SMAP = [
  { icon: Gavel, value: "37/100", label: "Skor Indeks Persepsi Korupsi (IPK) Indonesia 2024 — peringkat 99 dari 180 negara", source: "Transparency International, CPI 2024" },
  { icon: AlertTriangle, value: "≥5%", label: "Estimasi biaya korupsi global terhadap PDB dunia (±US$2,6 triliun/tahun)", source: "World Economic Forum" },
  { icon: ShieldCheck, value: ">US$1 triliun", label: "Suap yang dibayarkan dunia usaha & individu setiap tahun", source: "World Bank" },
];

export default function KonsultanPancekSmapPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-pancek-smap">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-green-700 to-red-700 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                SMAPClaw + PancekClaw — ISO 37001 Anti-Penyuapan & KPK
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Integritas Korporasi<br />
                <span className="text-teal-200">Bukan Sekadar Compliance</span>
              </h1>
              <p className="text-base md:text-lg text-teal-100 mb-8 leading-relaxed">
                Dua AI spesialis anti-korupsi Indonesia: <strong>SMAPClaw</strong> untuk implementasi
                ISO 37001 Anti-Penyuapan di korporasi, dan <strong>PancekClaw</strong> untuk
                panduan kepatuhan gratifikasi KPK. Proteksi reputasi dan hukum organisasi Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-teal-800 hover:bg-teal-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "8", label: "Sub-Agen SMAPClaw", sub: "ISO 37001 end-to-end" },
                { num: "5", label: "Sub-Agen PancekClaw", sub: "Gratifikasi & KPK compliance" },
                { num: "ISO", label: "Standar Internasional", sub: "ISO 37001:2016 Anti-Bribery" },
                { num: "KPK", label: "Regulasi Nasional", sub: "UU Tipikor & Peraturan KPK" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-teal-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two Tools */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Dua AI, Satu Ekosistem Anti-Korupsi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* SMAPClaw */}
            <div className="bg-white dark:bg-card rounded-2xl border-2 border-teal-200 dark:border-teal-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">SMAPClaw</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">ISO 37001 Anti-Penyuapan — 8 sub-agen</p>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-0.5">Sistem Manajemen Anti-Penyuapan (SMAP)</h3>
                </div>
              </div>
              <ul className="space-y-2">
                {[
                  "Gap analysis implementasi ISO 37001:2016 vs kondisi organisasi",
                  "Panduan penyusunan kebijakan anti-penyuapan & anti-gratifikasi",
                  "Due diligence mitra bisnis untuk risiko penyuapan",
                  "Desain kontrol anti-penyuapan: prosedur, limit, & approval matrix",
                  "Persiapan sertifikasi ISO 37001 & audit kesiapan",
                  "Program pelatihan & awareness anti-penyuapan berbasis AI",
                  "Investigasi awal insiden penyuapan & whistle-blowing procedure",
                  "Pemantauan & pelaporan kepatuhan SMAP berkala",
                ].map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
            </div>
            {/* PancekClaw */}
            <div className="bg-white dark:bg-card rounded-2xl border-2 border-red-200 dark:border-red-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Eye className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700">PancekClaw</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">KPK & Gratifikasi — 5 sub-agen</p>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-0.5">Panduan Kepatuhan KPK Nasional</h3>
                </div>
              </div>
              <ul className="space-y-2">
                {[
                  "Panduan definisi gratifikasi per UU KPK & Peraturan KPK",
                  "Prosedur pelaporan gratifikasi ke KPK step-by-step",
                  "Panduan kebijakan gratifikasi untuk ASN, BUMN, & swasta",
                  "Analisis batas kewajaran pemberian & penerimaan hadiah",
                  "Simulasi kasus gratifikasi & cara meresponnya dengan benar",
                  "Panduan whistleblowing & mekanisme pengaduan internal KPK",
                  "Due diligence partner & analisis red flags korupsi",
                  "Pelatihan awareness KPK compliance untuk seluruh karyawan",
                ].map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Untuk siapa */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Organisasi yang Wajib Compliance Anti-Korupsi</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🏛️", title: "BUMN & BUMD", pts: ["Wajib ISO 37001 per regulasi", "Laporan GCG & anti-korupsi", "Gratifikasi ASN & pejabat"] },
              { icon: "🏗️", title: "Kontraktor & Vendor", pts: ["Syarat tender pemerintah", "Due diligence dari buyer", "Kebijakan anti-suap rantai pasok"] },
              { icon: "💼", title: "Perusahaan Swasta", pts: ["International business partner", "ESG & investor requirement", "IPO & listing compliance"] },
              { icon: "⚖️", title: "Konsultan & Law Firm", pts: ["Jasa implementasi ISO 37001", "Audit kepatuhan anti-korupsi", "Due diligence M&A"] },
            ].map((g, i) => (
              <div key={i} className="bg-teal-50 dark:bg-teal-900/10 rounded-2xl p-4 border border-teal-100 dark:border-teal-800/30">
                <div className="text-2xl mb-2">{g.icon}</div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{g.title}</h3>
                <ul className="space-y-1">
                  {g.pts.map((pt, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menurut Data */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Menurut Data</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Korupsi Masih Jadi Risiko Nyata bagi Organisasi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STATS_SMAP.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border border-teal-100 dark:border-teal-800/30 bg-teal-50 dark:bg-teal-900/10 p-5" data-testid={`card-research-${i}`}>
                  <SIcon className="h-6 w-6 text-teal-600 mb-3" />
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

      <section className="py-14 px-4 bg-gradient-to-br from-teal-700 via-green-700 to-emerald-700 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Bangun Budaya Integritas yang Terbukti</h2>
          <p className="text-teal-100 text-sm mb-6">ISO 37001 + kepatuhan KPK = reputasi yang terlindungi dan bisnis yang berkelanjutan.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-teal-800 hover:bg-teal-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-hukum"><span className="hover:text-white cursor-pointer">Konsultan Hukum</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
