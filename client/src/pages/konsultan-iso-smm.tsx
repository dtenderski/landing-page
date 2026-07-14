import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Award, ClipboardList,
  BarChart3, TrendingUp, Shield, Star, Users,
  Building2, RefreshCw, Target,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20ISO%209001%20Sistem%20Manajemen%20Mutu";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";

const PDCA = [
  { phase: "PLAN", color: "blue", items: ["Gap analysis ISO 9001:2015 vs kondisi saat ini", "Identifikasi konteks organisasi & isu internal-eksternal", "Penetapan kebijakan mutu & tujuan mutu terukur", "Desain Sistem Manajemen Mutu & mapping proses bisnis", "Rencana penanganan risiko & peluang (Risk-Based Thinking)"] },
  { phase: "DO", color: "emerald", items: ["Penyusunan & implementasi prosedur terdokumentasi", "Panduan pengelolaan pengetahuan organisasi (Klausul 7.1.6)", "Implementasi kontrol operasional & rencana mutu proyek", "Pengelolaan penyedia eksternal & klausul 8.4", "Kampanye awareness & pelatihan ISO 9001 untuk seluruh staf"] },
  { phase: "CHECK", color: "amber", items: ["Panduan audit internal ISO 9001 — persiapan hingga laporan", "Pemantauan & pengukuran kinerja proses (KPI mutu)", "Analisis kepuasan pelanggan & penanganan komplain", "Evaluasi kesesuaian regulasi & persyaratan hukum", "Internal audit checklist per klausul ISO 9001:2015"] },
  { phase: "ACT", color: "violet", items: ["Penanganan ketidaksesuaian & Root Cause Analysis (RCA)", "Corrective Action & Preventive Action (CAPA)", "Tinjauan Manajemen (Management Review) — agenda & laporan", "Persiapan sertifikasi: pre-audit & desk review", "Pemeliharaan sertifikat & persiapan re-sertifikasi 3 tahunan"] },
];

const colorMap: Record<string, { bg: string; border: string; badge: string; num: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-600", num: "text-blue-700 dark:text-blue-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-600", num: "text-emerald-700 dark:text-emerald-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-500", num: "text-amber-700 dark:text-amber-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", badge: "bg-violet-600", num: "text-violet-700 dark:text-violet-400" },
};

const STATS_SMM = [
  { icon: Award, value: "837.052", label: "Sertifikat ISO 9001 valid di seluruh dunia", source: "ISO Survey 2023" },
  { icon: BarChart3, value: "10–30%", label: "Cost of Poor Quality (biaya mutu buruk) dari pendapatan perusahaan tanpa sistem mutu", source: "ASQ — American Society for Quality" },
  { icon: Building2, value: "1,25 juta", label: "Situs/lokasi tersertifikasi ISO 9001 secara global", source: "ISO Survey 2023" },
];

export default function KonsultanIsoSmmPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-iso-smm">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Award className="h-3.5 w-3.5" />
                ISOClaw 9001 — AI Konsultan Sistem Manajemen Mutu
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                ISO 9001 Bukan Sekadar<br />
                <span className="text-blue-200">Sertifikat di Dinding</span>
              </h1>
              <p className="text-base md:text-lg text-blue-100 mb-8 leading-relaxed">
                ISOClaw 9001 hadir dengan 6 sub-agen spesialis untuk memandu implementasi
                Sistem Manajemen Mutu (SMM) ISO 9001:2015 yang benar-benar berdampak —
                dari gap analysis, penyusunan dokumen, audit internal, hingga persiapan sertifikasi.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "6", label: "Sub-Agen ISOClaw 9001", sub: "Jasa konstruksi & umum" },
                { num: "10", label: "Klausul ISO 9001:2015", sub: "Analisis mendalam per klausul" },
                { num: "PDCA", label: "Siklus Perbaikan", sub: "Plan-Do-Check-Act terintegrasi" },
                { num: "RBT", label: "Risk-Based Thinking", sub: "Klausul 6: Risiko & Peluang" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-blue-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PDCA */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest text-center mb-2">Siklus PDCA</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Panduan AI per Fase Implementasi ISO 9001</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {PDCA.map((p) => {
              const c = colorMap[p.color];
              return (
                <div key={p.phase} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-5`} data-testid={`card-pdca-${p.phase}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-xl ${c.badge} text-white font-extrabold text-lg flex items-center justify-center`}>{p.phase}</span>
                    <h3 className={`font-bold text-sm ${c.num}`}>
                      {p.phase === "PLAN" ? "Perencanaan & Perancangan SMM" :
                       p.phase === "DO" ? "Implementasi & Operasional" :
                       p.phase === "CHECK" ? "Pemantauan & Evaluasi" : "Tindakan Perbaikan & Sertifikasi"}
                    </h3>
                  </div>
                  <ul className="space-y-1.5">
                    {p.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Untuk Siapa */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Membutuhkan ISO 9001?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Building2 className="h-5 w-5 text-blue-500" />, title: "Perusahaan Konstruksi", pts: ["Syarat kualifikasi tender pemerintah", "Kewajiban SBU bermutu SNI ISO 9001", "Meningkatkan kepercayaan owner", "Standar proses proyek yang konsisten"] },
              { icon: <Award className="h-5 w-5 text-emerald-500" />, title: "Konsultan ISO & KAP", pts: ["Jasa implementasi ISO 9001 untuk klien", "Audit surveillance & recertification", "Training internal auditor ISO 9001", "Gap analysis & readiness assessment"] },
              { icon: <Users className="h-5 w-5 text-violet-500" />, title: "Manufaktur & Jasa", pts: ["Persyaratan rantai pasok internasional", "Efisiensi operasional berbasis standar", "Customer satisfaction tracking", "Continuous improvement culture"] },
            ].map((g, i) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-background rounded-lg">{g.icon}</div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{g.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {g.pts.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menurut Data */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Menurut Data</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mengapa Sistem Manajemen Mutu Itu Penting</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STATS_SMM.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border border-blue-100 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/10 p-5" data-testid={`card-research-${i}`}>
                  <SIcon className="h-6 w-6 text-blue-600 mb-3" />
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

      <section className="py-14 px-4 bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">ISO 9001 yang Implementasinya Benar-Benar Berdampak</h2>
          <p className="text-blue-100 text-sm mb-6">Bukan hanya sertifikat — AI memandu Anda membangun SMM yang meningkatkan kinerja nyata organisasi.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-blue-200 mt-4">
            Lihat juga:{" "}
            <Link href="/konsultan-iso-sml"><span className="underline font-semibold cursor-pointer">ISO 14001 (Lingkungan) →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-iso-sml"><span className="hover:text-white cursor-pointer">ISO 14001</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
