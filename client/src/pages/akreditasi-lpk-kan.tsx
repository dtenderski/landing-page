import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, ShieldCheck, Globe,
  ClipboardList, BarChart3, Award, Users, Star,
  Building2, FileText, Layers,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20Akreditasi%20LPK%20KAN";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";

const LPK_TYPES = [
  {
    id: "lab",
    icon: "🧪",
    color: "blue",
    title: "Laboratorium Pengujian & Kalibrasi",
    standard: "SNI ISO/IEC 17025:2017",
    desc: "Lab yang menguji produk, material, atau lingkungan — dan lab kalibrasi instrumen ukur. Wajib bagi lab yang melayani pengujian SNI atau sertifikasi produk.",
    topics: ["Gap analysis per klausul 17025 (Klausul 4–8)", "Sistem manajemen mutu lab: dokumen & rekaman", "Kompetensi personel, pelatihan & kualifikasi", "Validasi & verifikasi metode pengujian/kalibrasi", "Estimasi ketidakpastian pengukuran (GUM)", "Persiapan proficiency testing & uji banding"],
  },
  {
    id: "lspersonel",
    icon: "📜",
    color: "violet",
    title: "Lembaga Sertifikasi Personel (LSP)",
    standard: "SNI ISO/IEC 17024:2012",
    desc: "LSP berlisensi BNSP yang juga ingin diakreditasi KAN — memberikan pengakuan internasional atas sertifikat kompetensi yang diterbitkan.",
    topics: ["Persyaratan imparsialitas & konflik kepentingan", "Desain skema sertifikasi berbasis SKKNI", "Kompetensi tim asesor & manajemen asesor", "Sistem rekaman & keamanan sertifikat", "Mekanisme banding & keberatan yang terstruktur", "Persiapan assessmen & witness KAN"],
  },
  {
    id: "lsproduk",
    icon: "🏷️",
    color: "emerald",
    title: "Lembaga Sertifikasi Produk (LSPro)",
    standard: "SNI ISO/IEC 17065:2012",
    desc: "Lembaga yang mensertifikasi produk sesuai SNI — SPPT SNI, LS-Pro makanan/minuman, produk elektronik, bahan bangunan, dll.",
    topics: ["Skema sertifikasi produk & sampling plan", "Persyaratan kompetensi personel evaluasi teknis", "Sistem sub-kontrak lab pengujian", "Pengambilan sampel & surveillance produk", "Mekanisme keputusan & penangguhan sertifikasi", "Hubungan dengan otoritas regulasi (BSN, Kemendag)"],
  },
  {
    id: "inspeksi",
    icon: "🔍",
    color: "orange",
    title: "Lembaga Inspeksi (LI)",
    standard: "SNI ISO/IEC 17020:2012",
    desc: "Lembaga yang melakukan inspeksi infrastruktur, instalasi K3, atau pengawasan mutu — Tipe A (independen), B, atau C.",
    topics: ["Diferensiasi Tipe A, B, C & implikasi imparsialitas", "Kompetensi inspektur per bidang inspeksi", "Prosedur inspeksi, checklist & laporan inspeksi", "Pengelolaan sub-kontrak inspeksi berlisensi", "Audit internal & tinjauan manajemen LI", "Persiapan assessmen & witness KAN"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; tag: string; check: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", check: "text-blue-500" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", check: "text-violet-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", check: "text-emerald-500" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-200 dark:border-orange-800", tag: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", check: "text-orange-500" },
};

export default function AkreditasiLpkKanPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-akreditasi-lpk-kan">
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
                AI Panduan Akreditasi Lembaga Penilai Kesesuaian (LPK) — KAN
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Akreditasi KAN,<br />
                <span className="text-blue-200">Kunci Kepercayaan Internasional</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
                Laboratorium, lembaga sertifikasi, dan lembaga inspeksi yang terakreditasi KAN
                mendapat pengakuan internasional melalui MRA ILAC & IAF. AI Gustafta memandu
                seluruh proses akreditasi — dari gap analysis standar ISO/IEC, penyusunan
                sistem dokumen, hingga persiapan assessmen dan witness KAN.
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
                { num: "4", label: "Tipe LPK", sub: "Lab · LSP · LSPro · Inspeksi" },
                { num: "ILAC", label: "Pengakuan Global", sub: "MRA ILAC & IAF" },
                { num: "ISO/IEC", label: "Standar Dasar", sub: "17025 · 17024 · 17065 · 17020" },
                { num: "KAN", label: "Akreditasi Nasional", sub: "Komite Akreditasi Nasional" },
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

      {/* LPK Types */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">4 Tipe LPK</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Panduan AI per Jenis Lembaga Penilai Kesesuaian</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {LPK_TYPES.map((lpk) => {
              const c = colorStyles[lpk.color];
              return (
                <div key={lpk.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-lpk-${lpk.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{lpk.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{lpk.title}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.tag}`}>{lpk.standard}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-3 leading-relaxed">{lpk.desc}</p>
                  <ul className="space-y-1.5">
                    {lpk.topics.map((t, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${c.check}`} />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proses Akreditasi KAN */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">Alur Akreditasi</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Proses Akreditasi KAN yang Didukung AI</h2>
          <div className="space-y-4">
            {[
              { phase: "Desk Review", desc: "Pengajuan dokumen sistem manajemen mutu ke KAN — AI membantu memastikan semua dokumen lengkap & sesuai standar sebelum dikirim." },
              { phase: "Assessmen Lapangan (On-Site)", desc: "Tim asesor KAN mengunjungi fasilitas LPK. AI membantu persiapan: checklist fasilitas, simulasi pertanyaan asesor, & pengelolaan dokumen yang akan diperiksa." },
              { phase: "Witness Assessment", desc: "Asesor KAN menyaksikan langsung kegiatan pengujian/sertifikasi/inspeksi. AI membantu persiapan uji coba, pengisian formulir, & pengendalian ketidakpastian." },
              { phase: "Tindakan Korektif", desc: "Penanganan temuan assessmen (nonconformity). AI memandu Root Cause Analysis & penyusunan tindakan korektif yang efektif & dapat diverifikasi." },
              { phase: "Pemeliharaan Akreditasi", desc: "Surveillance tahunan & reassessment 4 tahunan. AI membantu audit internal rutin, pemantauan kinerja, & persiapan perpanjangan akreditasi." },
            ].map((p, i) => (
              <div key={i} className="flex gap-4 bg-slate-50 dark:bg-slate-900/10 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{p.phase}</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-slate-700 via-blue-800 to-indigo-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Akreditasi KAN = Pengakuan Kompetensi Global</h2>
          <p className="text-slate-300 text-sm mb-6">Laporan dan sertifikat dari LPK terakreditasi KAN diakui di seluruh negara anggota ILAC & IAF — membuka pasar internasional.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
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
            <Link href="/lisensi-lsp-bnsp"><span className="underline font-semibold cursor-pointer">Lisensi LSP BNSP →</span></Link>
            {" · "}
            <Link href="/pedoman-kan"><span className="underline font-semibold cursor-pointer">Pedoman KAN →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/pedoman-kan"><span className="hover:text-white cursor-pointer">Pedoman KAN</span></Link>
          <Link href="/lisensi-lsp-bnsp"><span className="hover:text-white cursor-pointer">Lisensi LSP</span></Link>
          <Link href="/konsultan-iso-smm"><span className="hover:text-white cursor-pointer">ISO 9001</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
