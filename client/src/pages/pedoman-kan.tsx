import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Award, ShieldCheck,
  ClipboardList, BarChart3, Globe, Star, Users,
  Building2, FileText, Layers,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20Pedoman%20KAN%20dan%20akreditasi";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const KAN_PROGRAMS = [
  {
    id: "lab",
    icon: "🧪",
    color: "blue",
    title: "Akreditasi Laboratorium",
    standard: "SNI ISO/IEC 17025:2017",
    desc: "Standar untuk laboratorium pengujian & kalibrasi — persyaratan kompetensi, imparsialitas, dan konsistensi operasional lab.",
    areas: [
      "Ruang lingkup akreditasi: pengujian, kalibrasi, & sampling",
      "Persyaratan manajemen: pengendalian dokumen & rekaman",
      "Persyaratan teknis: kompetensi personel, peralatan, & metode uji",
      "Panduan estimasi ketidakpastian pengukuran",
      "Persiapan assessmen KAN: dokumen & witness test",
      "Panduan proficiency testing & intercomparison lab",
    ],
  },
  {
    id: "lembaga-sertifikasi",
    icon: "📜",
    color: "violet",
    title: "Akreditasi Lembaga Sertifikasi",
    standard: "SNI ISO/IEC 17021-1:2015 (SMM/SML) | SNI ISO/IEC 17024:2012 (Personel)",
    desc: "Standar akreditasi untuk LSP (Lembaga Sertifikasi Profesi), LS-SNI (Sertifikasi Produk), dan LS-SMM (ISO 9001/14001).",
    areas: [
      "ISO/IEC 17021-1: persyaratan LSM (ISO 9001, 14001, 45001)",
      "ISO/IEC 17024: persyaratan LSP sertifikasi personel (BNSP)",
      "ISO/IEC 17065: persyaratan lembaga sertifikasi produk",
      "Desain skema sertifikasi & kriteria keputusan",
      "Manajemen komite teknis & imparsialitas",
      "Panduan assessmen witness di klien lembaga sertifikasi",
    ],
  },
  {
    id: "inspeksi",
    icon: "🔍",
    color: "orange",
    title: "Akreditasi Lembaga Inspeksi",
    standard: "SNI ISO/IEC 17020:2012",
    desc: "Standar untuk lembaga inspeksi Tipe A/B/C — mencakup inspeksi infrastruktur, K3, dan pengawasan konstruksi.",
    areas: [
      "Tipe A (independen), B (dalam organisasi), C (multi-klien)",
      "Persyaratan kompetensi inspektor & metode inspeksi",
      "Dokumentasi laporan inspeksi & pengelolaan keluhan",
      "Imparsialitas & konflik kepentingan inspeksi",
      "Persiapan assessmen KAN untuk lembaga inspeksi",
      "Pengelolaan subkontrak inspeksi yang diakreditasi",
    ],
  },
  {
    id: "verifikasi",
    icon: "✔️",
    color: "emerald",
    title: "Validasi & Verifikasi GRK",
    standard: "SNI ISO 14064-3 / ISO 14065",
    desc: "Akreditasi badan validasi & verifikasi Gas Rumah Kaca (GRK) — pendukung perdagangan karbon dan pelaporan emisi korporasi.",
    areas: [
      "Persyaratan badan validasi/verifikasi GRK (ISO 14065)",
      "Kompetensi validator/verifikator GRK per sektor",
      "Prosedur validasi proyek pengurangan emisi (CDM, VCS)",
      "Verifikasi inventori GRK korporasi (Scope 1, 2, 3)",
      "Koneksi dengan sistem perdagangan karbon Indonesia (IDXCarbon)",
      "Persiapan akreditasi KAN sebagai VVB (Validation Verification Body)",
    ],
  },
];

const colorStyles: Record<string, { bg: string; border: string; tag: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-200 dark:border-orange-800", tag: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export default function PedomanKanPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-pedoman-kan">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-blue-800 to-indigo-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                AI Panduan Akreditasi KAN — Komite Akreditasi Nasional
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Akreditasi KAN,<br />
                <span className="text-blue-200">Pengakuan Kompetensi Internasional</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
                AI Gustafta memandu laboratorium, lembaga sertifikasi, lembaga inspeksi,
                dan badan verifikasi GRK dalam proses akreditasi KAN — dari pemahaman
                standar ISO/IEC, penyiapan dokumen, hingga persiapan assessmen dan
                mempertahankan akreditasi.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "4", label: "Program Akreditasi KAN", sub: "Lab, LS, Inspeksi, GRK" },
                { num: "ILAC", label: "Pengakuan Internasional", sub: "MRA ILAC & IAF" },
                { num: "ISO/IEC", label: "Standar Dasar", sub: "17025, 17021, 17020, 17024" },
                { num: "GRK", label: "Validasi Emisi", sub: "Carbon trading & net-zero" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-blue-300 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KAN Programs */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">4 Program Akreditasi</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Panduan AI per Program Akreditasi KAN</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {KAN_PROGRAMS.map((prog) => {
              const c = colorStyles[prog.color];
              return (
                <div key={prog.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-kan-${prog.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{prog.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{prog.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tag}`}>{prog.standard}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{prog.desc}</p>
                  <ul className="space-y-1.5">
                    {prog.areas.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proses Akreditasi */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">Proses Akreditasi</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Tahapan yang Didukung AI</h2>
          <div className="space-y-4">
            {[
              { num: "①", title: "Pemilihan Program & Ruang Lingkup", desc: "Identifikasi program akreditasi KAN yang tepat, penentuan ruang lingkup teknis, dan pemahaman persyaratan standar ISO/IEC yang berlaku." },
              { num: "②", title: "Gap Analysis & Rencana Implementasi", desc: "Analisis kesenjangan antara kondisi saat ini dengan persyaratan standar — roadmap implementasi per klausul dengan prioritas." },
              { num: "③", title: "Penyusunan Sistem Dokumen", desc: "Panduan penyusunan Quality Manual, prosedur operasi, instruksi kerja, dan rekaman yang disyaratkan standar ISO/IEC." },
              { num: "④", title: "Persiapan Assessmen KAN", desc: "Checklist kesiapan assessmen, panduan desk review, dan persiapan witness assessment per program akreditasi." },
              { num: "⑤", title: "Pemeliharaan & Surveillance", desc: "Panduan mempertahankan akreditasi: surveillance tahunan, reassessment, dan perluasan ruang lingkup akreditasi." },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 bg-slate-50 dark:bg-slate-900/10 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-full bg-slate-700 text-white text-lg font-extrabold flex items-center justify-center flex-shrink-0">{step.num}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Untuk Siapa */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Organisasi yang Membutuhkan Akreditasi KAN</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🧪", title: "Laboratorium Pengujian", pts: ["Lab bahan konstruksi", "Lab lingkungan & pangan", "Lab kalibrasi instrumen"] },
              { icon: "📜", title: "Lembaga Sertifikasi", pts: ["LSP profesi (BNSP)", "LS-SMM (ISO 9001/14001)", "LS produk SNI"] },
              { icon: "🔍", title: "Lembaga Inspeksi", pts: ["Inspeksi kelistrikan", "Inspeksi bejana tekan", "Inspeksi K3 konstruksi"] },
              { icon: "🌿", title: "Badan Verifikasi GRK", pts: ["Validasi proyek karbon", "Verifikasi inventori GRK", "Carbon credit trading"] },
            ].map((g, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-4 border border-slate-100 dark:border-border">
                <div className="text-2xl mb-2">{g.icon}</div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{g.title}</h3>
                <ul className="space-y-1">
                  {g.pts.map((pt, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-slate-700 via-blue-800 to-indigo-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Akreditasi KAN adalah Bukti Kompetensi Internasional</h2>
          <p className="text-slate-300 text-sm mb-6">MRA ILAC & IAF memastikan sertifikat & laporan dari lembaga terakreditasi KAN diakui di seluruh dunia.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Lihat juga:{" "}
            <Link href="/skk-pedoman-bnsp"><span className="underline font-semibold cursor-pointer">SKK Pedoman BNSP →</span></Link>
            {" · "}
            <Link href="/konsultan-iso-smm"><span className="underline font-semibold cursor-pointer">ISO 9001 →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/skk-pedoman-bnsp"><span className="hover:text-white cursor-pointer">SKK Pedoman BNSP</span></Link>
          <Link href="/konsultan-iso-smm"><span className="hover:text-white cursor-pointer">ISO 9001</span></Link>
          <Link href="/konsultan-iso-sml"><span className="hover:text-white cursor-pointer">ISO 14001</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
