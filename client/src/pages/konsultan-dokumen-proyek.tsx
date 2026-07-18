import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, FileText, FolderOpen,
  ClipboardList, BarChart3, Brain, Star, Layers,
  Building2, TrendingUp, Users,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20dokumen%20dan%20laporan%20proyek";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const DOC_TYPES = [
  {
    id: "perencanaan",
    title: "Dokumen Perencanaan & Pra-Konstruksi",
    icon: "📐",
    color: "blue",
    docs: [
      "Rencana Mutu Kontrak (RMK) / Rencana Mutu Proyek (RMP)",
      "Rencana K3 Proyek (RKKP) & IBPR",
      "Metode Kerja (Method Statement) per item pekerjaan",
      "Shop Drawing review & transmittal management",
      "Pre-Construction Meeting (PCM) Minutes & agenda",
      "Mobilisasi checklist & baseline jadwal S-Curve",
    ],
  },
  {
    id: "pelaksanaan",
    title: "Laporan Pelaksanaan & Progress",
    icon: "📊",
    color: "emerald",
    docs: [
      "Laporan Harian (Daily Report): progres fisik, cuaca, tenaga kerja",
      "Laporan Mingguan (Weekly Report): tren, isu, & rencana minggu depan",
      "Laporan Bulanan (Monthly Report) untuk owner & steering committee",
      "Earning Value Report: CPI, SPI, EAC, & analisis tren",
      "Berita Acara Kemajuan Pekerjaan (BAKP) untuk termin",
      "Photo documentation report per milestone pekerjaan",
    ],
  },
  {
    id: "mutu",
    title: "Dokumen Mutu & Penerimaan",
    icon: "✅",
    color: "teal",
    docs: [
      "Inspection & Test Plan (ITP) per item pekerjaan",
      "Request for Inspection (RFI) & Non-Conformance Report (NCR)",
      "Material Submittals & Shop Drawing Submittal Register",
      "Checklist penerimaan pekerjaan & punch list management",
      "Provisional Handover & Defect Liability Period (DLP) records",
      "As-Built Drawing transmittal & O&M Manual submission",
    ],
  },
  {
    id: "penutupan",
    title: "Dokumen Penutupan & Close-Out",
    icon: "🏁",
    color: "amber",
    docs: [
      "Practical/Substantial Completion Certificate (PC/SC)",
      "Final Account & Rekonsiliasi Klaim proyek",
      "Project Close-Out Report & Lesson Learned",
      "Performance Evaluation Subkontraktor & Pemasok",
      "Taking-Over Certificate & Defect Notification Period",
      "Archive & filing dokumentasi proyek untuk audit",
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; head: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", head: "text-blue-700 dark:text-blue-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", head: "text-emerald-700 dark:text-emerald-400" },
  teal: { bg: "bg-teal-50 dark:bg-teal-900/10", border: "border-teal-200 dark:border-teal-800", head: "text-teal-700 dark:text-teal-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", head: "text-amber-700 dark:text-amber-400" },
};

const STATS_DOC = [
  { icon: BarChart3, value: "48–52%", label: "Rework konstruksi disebabkan data buruk & miskomunikasi", source: "FMI/Autodesk/PlanGrid, 2018" },
  { icon: TrendingUp, value: "US$88,7 miliar", label: "Estimasi biaya rework global akibat data buruk (2020)", source: "Autodesk + FMI" },
  { icon: ClipboardList, value: "±14 jam", label: "Waktu kerja terbuang per pekerja/minggu untuk tugas non-produktif (±35%)", source: "FMI/PlanGrid" },
];

export default function KonsultanDokumenProyekPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-konsultan-dokumen-proyek">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-gray-700 to-zinc-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <FolderOpen className="h-3.5 w-3.5" />
                KonstraClaw + BrainClaw — AI Dokumen & Laporan Proyek
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Dokumentasi Proyek<br />
                <span className="text-slate-300">yang Rapi, Tepat, & Terjaga</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
                Dari RMK, RKK, method statement, laporan harian/bulanan, ITP, NCR,
                hingga Final Account dan project close-out — AI Gustafta membantu tim proyek
                menyusun dan mengelola seluruh dokumentasi proyek secara sistematis.
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
                { num: "9+", label: "Sub-Agen KonstraClaw", sub: "Seluruh siklus proyek" },
                { num: "4", label: "Fase Dokumentasi", sub: "Perencanaan → Close-out" },
                { num: "24+", label: "Jenis Dokumen", sub: "RMK, RKK, ITP, NCR, Final Account" },
                { num: "Audit", label: "Siap Audit", sub: "BPK, PMO, Owner, & Klien" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">Jenis Dokumen</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Seluruh Siklus Dokumentasi Proyek</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {DOC_TYPES.map((dt) => {
              const c = colorMap[dt.color];
              return (
                <div key={dt.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-5`} data-testid={`card-${dt.id}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{dt.icon}</span>
                    <h3 className={`font-bold text-sm ${c.head}`}>{dt.title}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {dt.docs.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">AI Tools yang Digunakan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">KonstraClaw + BrainClaw Bekerja Bersama</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { name: "KonstraClaw", color: "slate", sub: "Manajemen Proyek Konstruksi — 9 sub-agen", agents: ["PROJECT-PLANNER: Jadwal, WBS, dan resource plan", "QUALITY-MANAGER: RMK, ITP, NCR & quality assurance", "SAFETY-OFFICER: RKK, IBPR, & safety inspection checklist", "DOCUMENT-CONTROLLER: Transmittal, register, & filing sistem", "COST-CONTROLLER: Laporan biaya, earned value, & reforecast"] },
              { name: "BrainClaw", color: "cyan", sub: "Project Intelligence AI — 6 sub-agen", agents: ["PERFORMANCE-ANALYST: EVM, CPI, SPI real-time", "RISK-RADAR: Identifikasi & mitigasi risiko dokumentasi", "FORECAST-ENGINE: Proyeksi penyelesaian & biaya akhir", "DECISION-ARCHITECT: Keputusan eskalasi berbasis data"] },
            ].map((tool, i) => (
              <div key={i} className={`rounded-2xl p-5 border-2 ${tool.color === "slate" ? "bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-700" : "bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${tool.color === "slate" ? "bg-slate-200 text-slate-700" : "bg-cyan-100 text-cyan-700"}`}>{tool.name}</span>
                  <span className="text-[10px] text-gray-400">{tool.sub}</span>
                </div>
                <ul className="space-y-1.5">
                  {tool.agents.map((a, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{a}
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
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Menurut Data</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dokumentasi Buruk = Biaya Rework yang Mahal</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STATS_DOC.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/10 p-5" data-testid={`card-research-${i}`}>
                  <SIcon className="h-6 w-6 text-slate-600 mb-3" />
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

      <section className="py-14 px-4 bg-gradient-to-br from-slate-700 via-gray-700 to-zinc-800 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Dokumentasi Proyek Anda Layak Mendapat Sistem yang Baik</h2>
          <p className="text-slate-300 text-sm mb-6">Dokumentasi yang rapi bukan hanya untuk audit — ia adalah bukti kerja profesional Anda dan perlindungan jika ada sengketa di masa depan.</p>
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
            <Link href="/konsultan-kontrak"><span className="underline font-semibold cursor-pointer">Konsultan Kontrak →</span></Link>
            {" · "}
            <Link href="/brain-project"><span className="underline font-semibold cursor-pointer">Brain Project →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <Link href="/konsultan-kontrak"><span className="hover:text-white cursor-pointer">Konsultan Kontrak</span></Link>
          <Link href="/brain-project"><span className="hover:text-white cursor-pointer">Brain Project</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
