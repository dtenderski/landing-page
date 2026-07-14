import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import {
  HardHat, Award, Building2, FileSearch, Layers, Mountain, ShieldCheck, Ruler,
  ArrowRight, Sparkles, Gift,
} from "lucide-react";

/* Kurasi Claw yang relevan untuk insan jasa konstruksi — semua mengacu ke rute nyata di platform. */
const GROUPS = [
  {
    title: "Kompetensi & Legalitas",
    desc: "Sertifikasi tenaga ahli & badan usaha.",
    claws: [
      { name: "SKKClaw", tag: "Sertifikat Kompetensi Kerja", href: "/skk-coach", icon: Award, accent: "text-teal-600 dark:text-teal-400" },
      { name: "SBUClaw", tag: "Sertifikat Badan Usaha", href: "/sbu-claw", icon: Building2, accent: "text-amber-600 dark:text-amber-400" },
    ],
  },
  {
    title: "Tender & Proyek",
    desc: "Kesiapan mengikuti dan memenangkan tender.",
    claws: [
      { name: "TenderClaw", tag: "Dokumen & strategi tender BUJK", href: "/tendera-claw", icon: FileSearch, accent: "text-indigo-600 dark:text-indigo-400" },
      { name: "KonstraTenderClaw", tag: "Monitor tender SIRUP/LKPP", href: "/konstra-tender-claw", icon: Layers, accent: "text-emerald-600 dark:text-emerald-400" },
    ],
  },
  {
    title: "Teknis & Struktur",
    desc: "Perkuatan bangunan, geoteknik, dan ruang lingkup teknis.",
    claws: [
      { name: "GeoteknikClaw", tag: "SKK Sipil — Geoteknik", href: "/geoteknik-claw", icon: Mountain, accent: "text-amber-600 dark:text-amber-400" },
      { name: "BSClaw", tag: "Ruang lingkup Bangunan Sipil", href: "/bs-claw", icon: Ruler, accent: "text-sky-600 dark:text-sky-400" },
      { name: "BGClaw", tag: "Ruang lingkup Bangunan Gedung", href: "/bg-claw", icon: Building2, accent: "text-stone-600 dark:text-stone-400" },
    ],
  },
  {
    title: "K3 & Mutu",
    desc: "Keselamatan konstruksi dan sistem manajemen.",
    claws: [
      { name: "SafiraClaw", tag: "SKK K3 Konstruksi", href: "/safira-claw", icon: ShieldCheck, accent: "text-red-600 dark:text-red-400" },
      { name: "SMK3Claw", tag: "IMS & SMK3 terintegrasi", href: "/smk3-claw", icon: HardHat, accent: "text-orange-600 dark:text-orange-400" },
    ],
  },
];

export default function PaketKonstruksiPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Paket Konstruksi — Asisten AI untuk Insan Jasa Konstruksi | Gustafta";
    return () => { document.title = prevTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-paket-konstruksi">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 via-indigo-800 to-blue-800 px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-0" data-testid="badge-konstruksi">
              <HardHat className="h-3.5 w-3.5 mr-1" /> Paket Konstruksi
            </Badge>
            <Badge variant="outline" className="border-white/40 text-white bg-white/10">
              <Gift className="h-3.5 w-3.5 mr-1" /> Bagian dari bonus Indobuildtech 2026
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Asisten AI untuk Insan Jasa Konstruksi
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-2xl">
            Sekumpulan asisten AI (Claw) siap coba — dari kompetensi (SKK), badan usaha (SBU), tender, teknis struktur,
            hingga K3. Pilih yang sesuai kebutuhan Anda dan mulai bertanya.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-try-blueprint-konstruksi">
              <Link href="/blueprint-builder?preset=konstruksi">
                <Sparkles className="h-4 w-4" /> Rakit AI dari Pengalaman Anda
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white" data-testid="button-back-event">
              <Link href="/indobuildtech">Kembali ke Halaman Event</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Groups */}
      <section className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="mb-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{g.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{g.desc}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.claws.map((c) => (
                <Link key={c.name} href={c.href} className="group" data-testid={`link-konstruksi-${c.name.toLowerCase()}`}>
                  <Card className="h-full transition-all hover:shadow-lg border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-700">
                    <CardContent className="pt-6 space-y-2">
                      <c.icon className={`h-7 w-7 ${c.accent}`} />
                      <h3 className="font-bold text-gray-900 dark:text-white">{c.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.tag}</p>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${c.accent}`}>
                        Coba <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Sebagian asisten AI memerlukan akun & paket aktif — akses penuh terbuka lewat kode bonus peserta menjelang acara.
        </p>
      </section>
    </div>
  );
}
