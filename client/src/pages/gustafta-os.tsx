import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ChevronRight, Sparkles, MessageSquare, Users, Briefcase,
  GraduationCap, Award, Bot, Layers, Building2, Brain, ClipboardList,
  BookOpen, ShieldCheck, Store, TrendingUp, Handshake, FileCheck,
  Wrench, Compass, Rocket, Trophy, Wallet,
} from "lucide-react";

interface Destination {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  group?: string;
}

interface Pillar {
  id: string;
  number: string;
  name: string;
  tagline: string;
  intro: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  icon: React.ReactNode;
  status: "aktif" | "segera";
  destinations: Destination[];
}

const PILLARS: Pillar[] = [
  {
    id: "coach",
    number: "01",
    name: "COACH",
    tagline: "Chatbot pendamping ahli",
    intro:
      "Asisten AI satu-per-satu yang menemani Anda per bidang — bertanya, konsultasi, dan dibimbing seperti punya mentor pribadi.",
    accent: "border-sky-500/30",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: <MessageSquare className="h-6 w-6" />,
    status: "aktif",
    destinations: [
      { href: "/ai-tools", label: "AI Tools Hub", desc: "Direktori lengkap semua asisten & alat AI standalone.", icon: <Wrench className="h-5 w-5" /> },
      { href: "/skk-coach/chat", label: "SKK Coach", desc: "Pendamping sertifikasi kompetensi konstruksi (SKK).", icon: <GraduationCap className="h-5 w-5" /> },
      { href: "/legal/chat", label: "LexCom Hukum", desc: "Asisten hukum untuk kontrak, regulasi, dan sengketa.", icon: <ShieldCheck className="h-5 w-5" /> },
      { href: "/askom/chat", label: "ASKOM Coach", desc: "Pendamping asesor kompetensi & uji BNSP.", icon: <Award className="h-5 w-5" /> },
      { href: "/konsultasi", label: "Dialog Konsultasi", desc: "Ngobrol dulu — temukan solusi AI yang pas untuk Anda.", icon: <MessageSquare className="h-5 w-5" /> },
    ],
  },
  {
    id: "claw",
    number: "02",
    name: "CLAW",
    tagline: "Tim agen spesialis",
    intro:
      "Bukan satu chatbot, tapi satu tim agen yang bekerja bersama (orkestrasi) menyelesaikan pekerjaan lintas bidang secara paralel.",
    accent: "border-violet-500/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    icon: <Users className="h-6 w-6" />,
    status: "aktif",
    destinations: [
      { href: "/multiclaw-suite", label: "MultiClaw Suite", desc: "Katalog 80 tim agen spesialis per bidang.", icon: <Layers className="h-5 w-5" /> },
      { href: "/paket-bidang", label: "Pilih Paket Bidang", desc: "Aktifkan paket claw sesuai kebutuhan usaha Anda.", icon: <Compass className="h-5 w-5" /> },
      { href: "/tendera-claw", label: "TenderaClaw", desc: "Tim agen untuk analisis & persiapan tender.", icon: <Briefcase className="h-5 w-5" /> },
      { href: "/sbu-claw", label: "SBUClaw", desc: "Tim agen untuk Sertifikat Badan Usaha & perizinan.", icon: <Building2 className="h-5 w-5" /> },
    ],
  },
  {
    id: "workroom",
    number: "03",
    name: "WORKROOM",
    tagline: "Ruang kerja manusia + agen",
    intro:
      "Tempat pekerjaan nyata dikerjakan bersama: alur kerja bertahap, gerbang persetujuan manusia ◆, catatan keputusan, sampai hasil jadi (deliverable).",
    accent: "border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: <Briefcase className="h-6 w-6" />,
    status: "aktif",
    destinations: [
      { href: "/workroom", label: "Workroom", desc: "Garap masalah bertahap per bidang (Ruang Tender, Ruang Perizinan, Ruang Sertifikasi, Ruang K3, dll): kelayakan → strategi → gerbang ◆ → submit.", icon: <Briefcase className="h-5 w-5" /> },
      { href: "/organization-builder", label: "Rakit Tim Agen", desc: "Susun tim agen berperan dengan gerbang manusia ◆.", icon: <Users className="h-5 w-5" /> },
      { href: "/blueprint-builder", label: "Rancang Agen (Blueprint)", desc: "Wizard merancang agen/tim dari kebutuhan Anda.", icon: <Brain className="h-5 w-5" /> },
      { href: "/brain-project", label: "Otak Proyek", desc: "Pusat konteks & memori untuk proyek yang berjalan.", icon: <ClipboardList className="h-5 w-5" /> },
    ],
  },
  {
    id: "academy",
    number: "04",
    name: "ACADEMY",
    tagline: "Belajar berjenjang",
    intro:
      "Kurikulum bertingkat dari pemula sampai mahir — pelajari cara membangun & menjalankan organisasi AI, lengkap dengan sertifikat.",
    accent: "border-amber-500/30",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: <GraduationCap className="h-6 w-6" />,
    status: "aktif",
    destinations: [
      { href: "/lms", label: "Kelas & Kursus (LMS)", desc: "Ikuti kursus berjenjang dengan progres & sertifikat.", icon: <BookOpen className="h-5 w-5" /> },
      { href: "/materi-belajar-skk", label: "Materi Belajar SKK", desc: "Bahan belajar kompetensi konstruksi terstruktur.", icon: <GraduationCap className="h-5 w-5" /> },
      { href: "/kompetensi-hub", label: "Kompetensi Hub", desc: "Pusat diagnostik gap, mock asesmen, dan roadmap SKK.", icon: <Compass className="h-5 w-5" /> },
      { href: "/etlo-academy-claw", label: "ETLO Academy", desc: "Tim agen pendamping belajar & pengembangan.", icon: <Bot className="h-5 w-5" /> },
    ],
  },
  {
    id: "competency",
    number: "05",
    name: "COMPETENCY & MONETIZATION",
    tagline: "Bukti, portofolio & penghasilan",
    intro:
      "Buktikan kompetensi lewat sertifikat, tampilkan portofolio, lalu hasilkan pendapatan — jual di marketplace, afiliasi, dan langganan.",
    accent: "border-rose-500/30",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: <Award className="h-6 w-6" />,
    status: "aktif",
    destinations: [
      { group: "Bukti & Kompetensi", href: "/portofolio", label: "Portofolio Kompetensi", desc: "Kumpulan bukti: kursus, hasil kerja Workroom, sertifikat & lencana.", icon: <Trophy className="h-5 w-5" /> },
      { group: "Bukti & Kompetensi", href: "/sertifikat-digital", label: "E-Sertifikat Digital", desc: "Terbitkan sertifikat terverifikasi dengan QR publik.", icon: <FileCheck className="h-5 w-5" /> },
      { group: "Bukti & Kompetensi", href: "/jalur-sertifikasi", label: "Jalur Sertifikasi", desc: "Peta jalan menuju sertifikasi kompetensi resmi.", icon: <Award className="h-5 w-5" /> },
      { group: "Menghasilkan", href: "/penghasilan", label: "Penghasilan Kreator", desc: "Lacak bagi hasil 80/20 dari lisensi produk Anda di marketplace.", icon: <Wallet className="h-5 w-5" /> },
      { group: "Menghasilkan", href: "/store", label: "Gustafta Store", desc: "Marketplace chatbot & template siap pakai.", icon: <Store className="h-5 w-5" /> },
      { group: "Menghasilkan", href: "/affiliate", label: "Program Afiliasi", desc: "Dapatkan komisi dengan merekomendasikan Gustafta.", icon: <Handshake className="h-5 w-5" /> },
      { group: "Menghasilkan", href: "/monitor-marketing", label: "Monitor & Analitik", desc: "Pantau performa penjualan & kampanye pemasaran.", icon: <TrendingUp className="h-5 w-5" /> },
    ],
  },
];

const ADMIN_ONLY_HREFS = new Set(["/monitor-marketing"]);

export default function GustaftaOs() {
  const { data: adminMe } = useQuery<{ isAdmin: boolean; isSuperAdmin: boolean; role: string }>({ queryKey: ["/api/admin/me"] });
  const isAdminUser = adminMe?.isAdmin === true;
  const pillars = PILLARS.map((p) => ({
    ...p,
    destinations: p.destinations.filter((d) => isAdminUser || !ADMIN_ONLY_HREFS.has(d.href)),
  }));
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 z-20 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/dashboard" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
          <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary" data-testid="badge-os-version">
            <Sparkles className="h-3.5 w-3.5" />
            Gustafta OS
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-5" data-testid="text-os-eyebrow">
          <Rocket className="h-4 w-4" />
          Sistem Operasi AI Anda
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4" data-testid="text-os-title">
          Gustafta AI Operating System
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-os-subtitle">
          Lima pilar untuk mengubah pengetahuan Anda menjadi organisasi AI yang bekerja:
          dari asisten pribadi, tim agen, ruang kerja, sampai belajar dan menghasilkan.
        </p>

        {/* Pillar quick-nav */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {pillars.map((p) => (
            <a
              key={p.id}
              href={`#pilar-${p.id}`}
              className="text-xs font-medium rounded-full border border-border px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
              data-testid={`link-nav-${p.id}`}
            >
              {p.number} · {p.name}
            </a>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-14">
        {pillars.map((pillar) => (
          <section key={pillar.id} id={`pilar-${pillar.id}`} className="scroll-mt-24" data-testid={`section-pilar-${pillar.id}`}>
            {/* Pillar header */}
            <div className={`rounded-2xl border ${pillar.accent} bg-card/40 p-6 mb-5`}>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 rounded-xl ${pillar.iconBg} ${pillar.iconColor} p-3`}>
                  {pillar.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">PILAR {pillar.number}</span>
                    <h2 className="text-xl sm:text-2xl font-bold" data-testid={`text-pilar-name-${pillar.id}`}>{pillar.name}</h2>
                    <Badge variant="outline" className={pillar.badge}>{pillar.tagline}</Badge>
                    <span className="text-xs text-muted-foreground" data-testid={`text-pilar-count-${pillar.id}`}>· {pillar.destinations.length} tujuan</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-3xl">{pillar.intro}</p>
                </div>
              </div>
            </div>

            {/* Destinations grid — dikelompokkan bila destinasi punya `group` */}
            {(() => {
              const renderCard = (d: Destination) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="group block h-full rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/50 hover:bg-card"
                  data-testid={`card-dest-${d.href.replace(/\//g, "-").replace(/^-/, "")}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`rounded-lg ${pillar.iconBg} ${pillar.iconColor} p-2`}>{d.icon}</div>
                    <span className="font-semibold text-sm flex-1">{d.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
                </Link>
              );

              const hasGroups = pillar.destinations.some((d) => d.group);
              if (!hasGroups) {
                return (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pillar.destinations.map(renderCard)}
                  </div>
                );
              }

              const groupOrder = pillar.destinations.reduce<string[]>((acc, d) => {
                const g = d.group ?? "";
                if (!acc.includes(g)) acc.push(g);
                return acc;
              }, []);

              return (
                <div className="space-y-5">
                  {groupOrder.map((g) => (
                    <div key={g || "_"} className="space-y-3">
                      {g && (
                        <p className={`text-xs font-semibold uppercase tracking-wide ${pillar.iconColor}`} data-testid={`text-group-${pillar.id}-${g.replace(/[^a-zA-Z]+/g, "-").toLowerCase()}`}>
                          {g}
                        </p>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {pillar.destinations.filter((d) => (d.group ?? "") === g).map(renderCard)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center space-y-4">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto" data-testid="text-os-footer">
            Satu peta, lima pilar — dari asisten pribadi sampai menghasilkan pendapatan.
          </p>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/dashboard" data-testid="link-footer-dashboard">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
