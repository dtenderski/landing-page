import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSearch, FileText, BookOpen, GraduationCap, BarChart3,
  Hammer, Calculator, ClipboardList, Microscope, Award,
  ArrowRight, Wrench, Layers, Brain
} from "lucide-react";

interface ToolItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  isExternal?: boolean;
}

interface ToolCategory {
  label: string;
  icon: React.ElementType;
  color: string;
  tools: ToolItem[];
}

const CATEGORIES: ToolCategory[] = [
  {
    label: "Analisis & Dokumen",
    icon: FileSearch,
    color: "text-blue-600 dark:text-blue-400",
    tools: [
      {
        icon: FileSearch,
        title: "Bedah Dokumen",
        desc: "Upload dokumen tender, SBU, kontrak, atau laporan — AI analisis risiko, kelengkapan, dan potensi masalah secara otomatis.",
        href: "/bedah-dokumen",
        badge: "Unggulan",
        badgeColor: "bg-blue-500 text-white",
      },
      {
        icon: FileText,
        title: "Executive Summary",
        desc: "Generate ringkasan eksekutif untuk laporan proyek, hasil belajar, penugasan dinas, atau riset — 4 template siap pakai.",
        href: "/executive-summary",
      },
      {
        icon: Brain,
        title: "Brain Project Workroom",
        desc: "Ruang kerja cerdas untuk analisis & pendampingan proyek konstruksi: CPI, EVM, laporan progress, dan skenario recovery.",
        href: "/brain-project",
        badge: "Premium",
        badgeColor: "bg-violet-500 text-white",
      },
    ],
  },
  {
    label: "Kompetensi & SKK",
    icon: Award,
    color: "text-emerald-600 dark:text-emerald-400",
    tools: [
      {
        icon: Microscope,
        title: "Diagnostik Kompetensi",
        desc: "Analisis AI terhadap profil pendidikan & pengalaman untuk menentukan level KKNI dan gap kompetensi sebelum uji SKK.",
        href: "/diagnostik-kompetensi",
      },
      {
        icon: GraduationCap,
        title: "Simulator Uji Kompetensi",
        desc: "Latihan soal uji kompetensi berbasis SKKNI/BNSP dengan penilaian dan penjelasan per soal. Pilih jabatan & jenjang.",
        href: "/simulator-uji-kompetensi",
      },
      {
        icon: ClipboardList,
        title: "Peta Unit Kompetensi",
        desc: "Tampilkan peta lengkap unit kompetensi, elemen, KUK, dan jenis pengujian untuk setiap jabatan SKK yang dipilih.",
        href: "/peta-unit-kompetensi",
      },
    ],
  },
  {
    label: "Kalkulasi & Produktivitas",
    icon: Calculator,
    color: "text-amber-600 dark:text-amber-400",
    tools: [
      {
        icon: Calculator,
        title: "Kalkulator Produktivitas TK",
        desc: "Hitung produktivitas tenaga kerja konstruksi berdasarkan jenis pekerjaan, kondisi lapangan, dan faktor koreksi.",
        href: "/kalkulator-produktivitas-tk",
      },
      {
        icon: BarChart3,
        title: "Kalkulator Produktivitas Alat",
        desc: "Estimasi produktivitas alat berat (excavator, dump truck, bulldozer, dll) untuk perencanaan dan analisa harga satuan.",
        href: "/kalkulator-produktivitas-alat",
      },
    ],
  },
  {
    label: "Workroom & Manajemen Proyek",
    icon: Layers,
    color: "text-purple-600 dark:text-purple-400",
    tools: [
      {
        icon: Layers,
        title: "Workroom Proyek",
        desc: "Ruang kerja terstruktur untuk tender, perizinan OSS, dan sertifikasi SKK — dari identifikasi hingga persetujuan ◆.",
        href: "/workroom",
        badge: "Premium",
        badgeColor: "bg-violet-500 text-white",
      },
      {
        icon: BookOpen,
        title: "Ekosistem Kompetensi",
        desc: "Akses lengkap tools kompetensi konstruksi: diagnostik, simulator, peta unit, portofolio APL, dan lebih banyak lagi.",
        href: "/kompetensi-hub",
      },
    ],
  },
];

export default function ToolkitPage() {
  const totalTools = CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-14 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-5">
            <Wrench className="h-4 w-4 text-amber-400" />
            <span>{totalTools} Tools Tersedia</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Toolkit Praktisi
            <span className="block text-amber-400">Konstruksi & Kompetensi</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Semua mini apps dan alat kerja digital Gustafta dalam satu halaman. Pilih tool yang paling relevan
            dengan kebutuhan proyek, sertifikasi, atau dokumen Anda hari ini.
          </p>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg bg-muted ${cat.color}`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{cat.label}</h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Tools grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.tools.map((tool) => (
                <Link key={tool.href} href={tool.href}>
                  <div className="group h-full border border-border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-muted ${cat.color} group-hover:scale-110 transition-transform`}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      {tool.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-2 text-sm">{tool.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed flex-1">{tool.desc}</p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Buka Tool <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA bawah */}
      <section className="border-t bg-muted/30 py-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <Hammer className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Tidak Menemukan yang Dicari?</h2>
          <p className="text-muted-foreground mb-6">
            Gustafta terus menambahkan mini apps baru. Coba Bedah Dokumen sebagai pintu masuk —
            atau hubungi kami untuk kebutuhan tools khusus.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/bedah-dokumen">
              <Button className="gap-2">
                <FileSearch className="h-4 w-4" />
                Coba Bedah Dokumen
              </Button>
            </Link>
            <Link href="/klinik-konsultasi">
              <Button variant="outline" className="gap-2">
                Klinik Konsultasi
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
