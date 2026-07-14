import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import {
  HardHat, Award, Building2, FileSearch, Layers, Mountain, ShieldCheck, Ruler,
  ArrowRight, Sparkles, Gift, Briefcase, Truck, BadgeCheck, Landmark,
  Workflow, Boxes, GitBranch, ClipboardCheck, Users,
  Stethoscope, Hammer, Calculator, Camera, CalendarClock, FileSignature,
  Radar, FileCheck2, Gavel, GraduationCap, TrendingUp,
} from "lucide-react";

/*
 * Halaman perkenalan / bundling untuk soft-launch Indobuildtech 2026.
 * Mengelompokkan chatbot yang SUDAH ADA di Gustafta menurut PROFESI peserta
 * (SKK, SBU, Kontraktor, Konsultan, Suplier, LSP, LSBU) + memperagakan 3
 * kemampuan organisasi AI (Agentic, MultiClaw, OpenClaw). Semua href menaut
 * ke rute nyata di platform — tidak ada yang dibuat baru.
 */

type Claw = { name: string; tag: string; href: string; icon: any };
type Group = { key: string; title: string; audience: string; icon: any; accent: string; claws: Claw[] };

const GROUPS: Group[] = [
  {
    key: "skk",
    title: "SKK — Tenaga Ahli & Kompetensi",
    audience: "Untuk pemegang / calon pemegang Sertifikat Kompetensi Kerja.",
    icon: Award,
    accent: "text-teal-600 dark:text-teal-400",
    claws: [
      { name: "SKKClaw", tag: "Coach kompetensi & jenjang SKK", href: "/skk-coach", icon: Award },
      { name: "GeoteknikClaw", tag: "SKK Sipil — Geoteknik", href: "/geoteknik-claw", icon: Mountain },
      { name: "SafiraClaw", tag: "SKK K3 Konstruksi", href: "/safira-claw", icon: ShieldCheck },
      { name: "ManprojakClaw", tag: "Manajemen proyek konstruksi", href: "/manprojak-claw", icon: ClipboardCheck },
      { name: "PKB", tag: "Pengembangan Keprofesian Berkelanjutan", href: "/pkb", icon: GraduationCap },
    ],
  },
  {
    key: "sbu",
    title: "SBU — Badan Usaha",
    audience: "Untuk BUJK yang mengurus / merawat Sertifikat Badan Usaha.",
    icon: Building2,
    accent: "text-amber-600 dark:text-amber-400",
    claws: [
      { name: "SBUClaw", tag: "Sertifikat Badan Usaha (BUJK)", href: "/sbu-claw", icon: Building2 },
      { name: "SkemaClaw", tag: "Skema & subklasifikasi SBU", href: "/skema-claw", icon: Layers },
      { name: "PanduanSBU", tag: "Panduan langkah pengurusan SBU", href: "/panduan-sbu", icon: FileSearch },
      { name: "LKUT-PUBclaw", tag: "Pengembangan Usaha Berkelanjutan & LKUT", href: "/pub-lkut-claw", icon: TrendingUp },
    ],
  },
  {
    key: "oss",
    title: "Perijinan (OSS)",
    audience: "Untuk yang mengurus NIB & izin berusaha via OSS-RBA.",
    icon: FileCheck2,
    accent: "text-cyan-600 dark:text-cyan-400",
    claws: [
      { name: "PerijinanBot", tag: "Asisten izin usaha & OSS", href: "/perijinanbot", icon: FileCheck2 },
      { name: "OSSClaw", tag: "War-room perizinan OSS-RBA", href: "/oss-claw", icon: Layers },
      { name: "Panduan OSS", tag: "Langkah pengurusan izin OSS", href: "/panduan-oss-perizinan", icon: FileSearch },
    ],
  },
  {
    key: "tender",
    title: "Tender & Pelaksanaan Proyek",
    audience: "Untuk kejar tender lalu jalankan proyek sampai serah terima.",
    icon: Gavel,
    accent: "text-violet-600 dark:text-violet-400",
    claws: [
      { name: "TenderBot", tag: "Asisten tender & pengadaan", href: "/tenderbot", icon: Gavel },
      { name: "KonstraTenderClaw", tag: "Monitor tender SIRUP/LKPP", href: "/konstra-tender-claw", icon: Radar },
      { name: "ProyekBot", tag: "Pendamping pelaksanaan proyek", href: "/proyekbot", icon: HardHat },
      { name: "Generator Jadwal", tag: "Susun jadwal pelaksanaan", href: "/generator-jadwal-pelaksanaan", icon: CalendarClock },
    ],
  },
  {
    key: "kontraktor",
    title: "Kontraktor",
    audience: "Untuk pelaksana konstruksi yang mengejar & menang tender.",
    icon: HardHat,
    accent: "text-orange-600 dark:text-orange-400",
    claws: [
      { name: "KontraktorBot", tag: "Asisten intelijen kontraktor", href: "/kontraktorbot", icon: HardHat },
      { name: "KonstraClaw", tag: "War-room strategi proyek", href: "/konstra-claw", icon: Layers },
      { name: "TenderaClaw", tag: "Dokumen & strategi tender", href: "/tendera-claw", icon: FileSearch },
    ],
  },
  {
    key: "konsultan",
    title: "Konsultan",
    audience: "Untuk perencana, pengawas, dan konsultan teknis.",
    icon: Ruler,
    accent: "text-indigo-600 dark:text-indigo-400",
    claws: [
      { name: "KonsultanBot", tag: "Asisten intelijen konsultan", href: "/konsultanbot", icon: Briefcase },
      { name: "ArsitekturClaw", tag: "Perencanaan & desain arsitektur", href: "/arsitektur-claw", icon: Ruler },
    ],
  },
  {
    key: "suplier",
    title: "Suplier",
    audience: "Untuk pemasok material & rantai pasok konstruksi.",
    icon: Truck,
    accent: "text-emerald-600 dark:text-emerald-400",
    claws: [
      { name: "SupplierBot", tag: "Asisten intelijen suplier", href: "/supplierbot", icon: Truck },
      { name: "SupplyChainClaw", tag: "Manajemen rantai pasok", href: "/supply-chain-claw", icon: Boxes },
    ],
  },
  {
    key: "lsp",
    title: "LSP — Lembaga Sertifikasi Profesi",
    audience: "Untuk pengelola LSP & TUK (sertifikasi kompetensi).",
    icon: BadgeCheck,
    accent: "text-sky-600 dark:text-sky-400",
    claws: [
      { name: "Lisensi LSP BNSP", tag: "Pendirian & lisensi LSP ke BNSP", href: "/lisensi-lsp-bnsp", icon: BadgeCheck },
      { name: "Manajemen LSP & TUK", tag: "Operasional LSP dan TUK", href: "/manajemen-lsp-tuk", icon: ClipboardCheck },
    ],
  },
  {
    key: "lsbu",
    title: "LSBU — Lembaga Sertifikasi Badan Usaha",
    audience: "Untuk pengelola LSBU (sertifikasi badan usaha).",
    icon: Landmark,
    accent: "text-rose-600 dark:text-rose-400",
    claws: [
      { name: "ABUClaw", tag: "Akreditasi & operasional LSBU", href: "/abu-claw", icon: Landmark },
    ],
  },
];

/* Peragaan 3 kemampuan organisasi AI — menaut ke fitur nyata. */
const CAPABILITIES = [
  {
    name: "Agentic",
    icon: Workflow,
    accent: "text-indigo-600 dark:text-indigo-400",
    ring: "hover:border-indigo-300 dark:hover:border-indigo-700",
    headline: "Satu chatbot, satu tim di belakangnya",
    desc: "Bukan sekadar menjawab. Satu orkestrator berpikir bertahap, memanggil beberapa sub-agen spesialis secara paralel, lalu merangkum satu jawaban utuh. Perhatikan titik-titik sub-agen menyala saat bekerja.",
    href: "/konstra-claw",
    cta: "Lihat orkestrasi langsung",
  },
  {
    name: "MultiClaw",
    icon: Boxes,
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "hover:border-emerald-300 dark:hover:border-emerald-700",
    headline: "Puluhan 'departemen AI' siap pakai",
    desc: "Kumpulan Claw per bidang — konstruksi, tender, K3, badan usaha, dan lainnya. Tiap Claw adalah satu departemen berisi banyak sub-agen. Pilih yang sesuai kebutuhan, langsung pakai tanpa merakit.",
    href: "/multiclaw-suite",
    cta: "Jelajahi katalog Claw",
  },
  {
    name: "OpenClaw",
    icon: GitBranch,
    accent: "text-orange-600 dark:text-orange-400",
    ring: "hover:border-orange-300 dark:hover:border-orange-700",
    headline: "Rakit tim agen Anda sendiri",
    desc: "Ubah cara kerja Anda menjadi tim agen AI kustom (Trilogi). Tentukan peran, alur, dan gerbang keputusan manusia — lalu jalankan sebagai satu organisasi kecil yang bekerja untuk Anda.",
    href: "/tutor-builder",
    cta: "Rakit tim agen",
  },
];

/* Peragaan Klinik vs Lapangan — konsultasi (tanya) berdampingan dengan alat kerja (hasilkan). */
const KLINIK_LOKET = [
  { name: "Loket Perizinan (OSS)", tag: "Tanya izin usaha, NIB, OSS-RBA", href: "/perijinanbot", icon: FileCheck2 },
  { name: "Loket Tender", tag: "Tanya syarat & strategi tender", href: "/tenderbot", icon: Gavel },
  { name: "Loket Pelaksanaan Proyek", tag: "Tanya EVM, K3, klaim, LHP", href: "/proyekbot", icon: HardHat },
  { name: "Loket Kontraktor", tag: "Tanya operasional BUJK umum", href: "/kontraktorbot", icon: Briefcase },
];

const LAPANGAN_ALAT = [
  { name: "RAB Kalkulator", tag: "Susun RAB otomatis + ekspor", href: "/rab-kalkulator", icon: Calculator },
  { name: "K3 Vision", tag: "Audit K3 dari foto lapangan", href: "/k3-vision", icon: Camera },
  { name: "Generator Jadwal", tag: "Susun jadwal pelaksanaan proyek", href: "/generator-jadwal-pelaksanaan", icon: CalendarClock },
  { name: "Generator BAST", tag: "Draf Berita Acara Serah Terima", href: "/generator-bast-proyek", icon: FileSignature },
  { name: "Tender Monitor", tag: "Pantau tender masuk (SIRUP)", href: "/tender-monitor", icon: Radar },
  { name: "Proposal Jasa", tag: "Draf proposal penawaran", href: "/proposal-jasa", icon: FileSearch },
];

export default function BundlingKonstruksiPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Bundling Chatbot Konstruksi — Perkenalan Indobuildtech 2026 | Gustafta";
    return () => { document.title = prevTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-bundling-konstruksi">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 via-indigo-800 to-blue-800 px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-0" data-testid="badge-bundling">
              <HardHat className="h-3.5 w-3.5 mr-1" /> Perkenalan Indobuildtech 2026
            </Badge>
            <Badge variant="outline" className="border-white/40 text-white bg-white/10">
              <Gift className="h-3.5 w-3.5 mr-1" /> Bonus peserta
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Bundling Chatbot untuk Insan Jasa Konstruksi
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-2xl">
            Dirakit khusus untuk peserta: Profesional Jasa Konstruksi, Kontraktor, Suplier, Konsultan,
            dan lembaga terkait. Pilih sesuai profesi Anda, lalu lihat bagaimana chatbot Gustafta bekerja
            sebagai <span className="font-semibold text-white">organisasi AI</span> — bukan sekadar tanya-jawab.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-mulai-bonus">
              <Link href="/bonus-indobuildtech">
                <Sparkles className="h-4 w-4" /> Mulai Jalur Bonus Peserta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white" data-testid="button-back-event">
              <Link href="/indobuildtech">Kembali ke Halaman Event</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Peragaan — Klinik Konstruksi Virtual & Lapangan */}
      <section className="max-w-5xl mx-auto px-4 pt-12 -mb-2">
        <div className="max-w-2xl space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
              Klinik Konstruksi Virtual — di sampingnya ada Lapangan
            </h2>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Di <span className="font-semibold text-gray-900 dark:text-white">Klinik</span> Anda berkonsultasi — datang dengan pertanyaan, pulang dengan jawaban.
            Lalu ke <span className="font-semibold text-gray-900 dark:text-white">Lapangan</span> untuk mengerjakannya — alat yang menghasilkan dokumen & output nyata.
          </p>
          <Button asChild className="bg-teal-600 hover:bg-teal-500 text-white gap-2 mt-1" data-testid="button-masuk-klinik">
            <Link href="/klinik-konsultasi">
              <Stethoscope className="h-4 w-4" /> Masuk ke Klinik Konsultasi
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Klinik */}
          <Card className="border-2 border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20" data-testid="panel-klinik">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-teal-100 dark:bg-teal-900/40 p-2 text-teal-600 dark:text-teal-400">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">Klinik Konstruksi Virtual</h3>
                  <p className="text-sm text-teal-700 dark:text-teal-300">Loket konsultasi — tanya, dapat jawaban</p>
                </div>
              </div>
              <div className="space-y-2">
                {KLINIK_LOKET.map((k) => (
                  <Link key={k.name} href={k.href} className="group flex items-center gap-3 rounded-lg border border-teal-200/70 dark:border-teal-800/50 bg-white dark:bg-white/5 px-3 py-2.5 transition-all hover:shadow-md hover:border-teal-400" data-testid={`link-klinik-${k.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                    <k.icon className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{k.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{k.tag}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lapangan */}
          <Card className="border-2 border-orange-200 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/20" data-testid="panel-lapangan">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 dark:bg-orange-900/40 p-2 text-orange-600 dark:text-orange-400">
                  <Hammer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">Lapangan</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Alat kerja — hasilkan dokumen & output</p>
                </div>
              </div>
              <div className="space-y-2">
                {LAPANGAN_ALAT.map((a) => (
                  <Link key={a.name} href={a.href} className="group flex items-center gap-3 rounded-lg border border-orange-200/70 dark:border-orange-800/50 bg-white dark:bg-white/5 px-3 py-2.5 transition-all hover:shadow-md hover:border-orange-400" data-testid={`link-lapangan-${a.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                    <a.icon className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{a.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.tag}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bagian 1 — Bundling per profesi */}
      <section className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Pilih menurut profesi Anda
          </h2>
        </div>

        {GROUPS.map((g) => (
          <div key={g.key} data-testid={`group-${g.key}`}>
            <div className="mb-4 flex items-start gap-3">
              <div className={`mt-0.5 rounded-lg bg-gray-100 dark:bg-white/5 p-2 ${g.accent}`}>
                <g.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{g.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{g.audience}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.claws.map((c) => (
                <Link key={c.name} href={c.href} className="group" data-testid={`link-claw-${c.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Card className="h-full transition-all hover:shadow-lg border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-700">
                    <CardContent className="pt-6 space-y-2">
                      <c.icon className={`h-7 w-7 ${g.accent}`} />
                      <h4 className="font-bold text-gray-900 dark:text-white">{c.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.tag}</p>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${g.accent}`}>
                        Coba <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Bagian 2 — Peragaan kemampuan organisasi AI */}
      <section className="bg-white dark:bg-white/5 border-y border-gray-200 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                Bukan chatbot biasa — ini organisasi AI
              </h2>
            </div>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Setiap chatbot di atas ditopang tiga kemampuan inti Gustafta. Coba peragaannya langsung.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {CAPABILITIES.map((cap) => (
              <Card key={cap.name} className={`h-full flex flex-col border-2 border-transparent transition-all hover:shadow-lg ${cap.ring}`} data-testid={`card-capability-${cap.name.toLowerCase()}`}>
                <CardContent className="pt-6 flex flex-col h-full space-y-3">
                  <cap.icon className={`h-8 w-8 ${cap.accent}`} />
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">{cap.name}</h3>
                    <p className={`text-sm font-medium ${cap.accent}`}>{cap.headline}</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{cap.desc}</p>
                  <Button asChild variant="outline" className="gap-2 w-full mt-2" data-testid={`button-capability-${cap.name.toLowerCase()}`}>
                    <Link href={cap.href}>
                      {cap.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Penutup */}
      <section className="max-w-5xl mx-auto px-4 py-12 space-y-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Punya kode peserta?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aktifkan kode bonus untuk membuka akses penuh, lalu rakit chatbot pertama Anda dari pengalaman kerja.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="button-kode-akses">
                <Link href="/kode-akses">Aktifkan Kode</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2" data-testid="button-rakit-agen">
                <Link href="/blueprint-builder?preset=konstruksi">
                  <Sparkles className="h-4 w-4" /> Rakit AI dari Pengalaman Anda
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Sebagian asisten AI memerlukan akun & paket aktif — akses penuh terbuka lewat kode bonus peserta menjelang acara.
        </p>
      </section>
    </div>
  );
}
