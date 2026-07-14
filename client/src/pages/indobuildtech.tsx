import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import posterUrl from "@assets/Indobuildtech_2_1783396237535.jpeg";
import speakersUrl from "@assets/Indobuildtech_1_1783396237537.jpeg";
import {
  Sparkles, Calendar, MapPin, Gift, Bot, BookOpen, GraduationCap, Users,
  ArrowRight, CheckCircle2, Ticket, Building2, ShieldCheck, FileSearch, Award, Zap,
  UserPlus, MessageSquare, Edit3, Stethoscope,
} from "lucide-react";

const REGISTER_URL = "https://bit.ly/SeminarIndobuildtech2026";

/* Claw profesi konstruksi yang jadi bagian bonus (mengacu ke rute nyata di platform). */
const CLAWS = [
  {
    name: "SKKClaw",
    desc: "Pendamping digital Sertifikat Kompetensi Kerja (SKK): jenjang kompetensi, syarat sertifikasi, persiapan asesmen, dan regulasi terbaru.",
    href: "/skk-coach",
    icon: Award,
    accent: "text-teal-600 dark:text-teal-400",
    ring: "group-hover:border-teal-400 dark:group-hover:border-teal-500",
  },
  {
    name: "SBUClaw",
    desc: "Bantu badan usaha memahami Sertifikat Badan Usaha (SBU): klasifikasi & subklasifikasi, syarat administrasi, dan pemenuhan tenaga ahli.",
    href: "/sbu-claw",
    icon: Building2,
    accent: "text-amber-600 dark:text-amber-400",
    ring: "group-hover:border-amber-400 dark:group-hover:border-amber-500",
  },
  {
    name: "TenderClaw",
    desc: "Asisten dokumen tender konstruksi: syarat tender, dokumen pemilihan, evaluasi administrasi, dan strategi kesiapan mengikuti tender.",
    href: "/tendera-claw",
    icon: FileSearch,
    accent: "text-indigo-600 dark:text-indigo-400",
    ring: "group-hover:border-indigo-400 dark:group-hover:border-indigo-500",
  },
];

const COURSES = [
  "Pengalaman Kasus Kegagalan Konstruksi Fondasi",
  "Desain Fondasi",
  "Understanding Soil Behavior & Design Parameters",
  "Konsep & Prosedur Perencanaan Bangunan Tahan Gempa",
  "Konsep & Dasar Desain Perkuatan Struktur Beton Bertulang",
];

const REFLECT_STEPS = [
  "Menggali pengalaman proyek secara sistematis",
  "Mengubah pengalaman menjadi knowledge base digital",
  "Menyusun SOP, checklist, best practice, dan lesson learned",
  "Merakit AI Chatbot pribadi sesuai bidang keahlian",
  "Membangun asisten digital yang siap menjawab pertanyaan teknis kapan saja",
];

/* Alur membuat chatbot — diperagakan langsung di booth pameran. */
const FLOW_STEPS = [
  { icon: UserPlus, title: "Registrasi", desc: "Daftar akun atau tukar kode peserta." },
  { icon: MessageSquare, title: "Dialog Gustafta", desc: "Konsultasi awal — ceritakan kebutuhan Anda." },
  { icon: BookOpen, title: "Blueprint", desc: "Sistem menyusun cetak biru agen AI Anda." },
  { icon: Edit3, title: "Edit", desc: "Sempurnakan persona, pengetahuan & alur." },
  { icon: CheckCircle2, title: "Approval", desc: "Persetujuan akhir — gerbang manusia." },
  { icon: Bot, title: "Chatbot Aktif", desc: "Agen siap menjawab & bekerja." },
];

export default function IndobuildtechPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Bonus Seminar Indobuildtech 2026 — Perkuatan Bangunan Miring | Gustafta";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "Bonus eksklusif peserta Seminar Nasional Indobuildtech 2026 (ASDAMKINDO × Gustafta): Blueprint Reflektif merakit AI dari pengalaman, akses SKKClaw/SBUClaw/TenderClaw, 5 kursus online, dan ekosistem pembelajaran konstruksi berbasis AI.",
    );
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) meta?.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-indobuildtech">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-blue-800 to-slate-900 px-4 py-14 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.18),transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-0" data-testid="badge-hybrid">HYBRID</Badge>
              <Badge variant="outline" className="border-white/40 text-white bg-white/10" data-testid="badge-bonus">
                <Gift className="h-3.5 w-3.5 mr-1" /> Bonus Eksklusif Peserta
              </Badge>
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-300">Seminar Nasional Indobuildtech 2026</p>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Perkuatan Bangunan Miring <span className="text-orange-300">&</span> Peningkatan Kompetensi Tenaga Konstruksi
            </h1>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed">
              Lebih dari sekadar seminar. Setiap peserta memperoleh akses menuju ekosistem pembelajaran & AI dari
              <span className="font-semibold text-white"> Gustafta</span> — mengubah pengalaman profesional menjadi AI yang bekerja untuk Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 text-orange-300" />
                <span className="text-sm font-medium">Kamis, 9 Juli 2026 · 13.00–17.30 WIB</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5 text-orange-300" />
                <span className="text-sm font-medium">ICE BSD City · Ruang Garuda 7 A/B</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-register-hero">
                <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer">
                  Daftar Sekarang <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white" data-testid="button-claim-hero">
                <a href="#klaim">
                  <Ticket className="h-4 w-4" /> Klaim Bonus
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="gap-2 text-orange-200 hover:text-white hover:bg-white/10" data-testid="button-redeem-hero">
                <Link href="/bonus-indobuildtech">
                  <Ticket className="h-4 w-4" /> Punya kode peserta? Mulai Jalur Bonus
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-300" /> Gratis Sertifikat</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-300" /> Gratis 10 SKPK Terverifikasi LPJK</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-300" /> 5 Kursus Online Gratis (offline)</span>
            </div>
          </div>

          <div className="relative">
            <img
              src={posterUrl}
              alt="Poster Seminar Indobuildtech 2026 — Perkuatan Bangunan Miring"
              className="rounded-2xl shadow-2xl ring-1 ring-white/20 w-full max-w-sm mx-auto"
              data-testid="img-poster"
            />
          </div>
        </div>
      </section>

      {/* ── BONUS INTRO ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-3" data-testid="badge-value">Professional Value Added</Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bonus Eksklusif dari Gustafta</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Peserta tidak hanya memperoleh ilmu satu hari, tetapi aset pengetahuan, alat bantu digital, dan akses ekosistem kompetensi berbasis AI.
          </p>
        </div>

        {/* Bonus 1: Blueprint Reflektif — fitur andalan */}
        <Card className="overflow-hidden border-indigo-200 dark:border-indigo-900 mb-8">
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-3 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Bonus Utama</p>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Blueprint Reflektif Tenaga Ahli Konstruksi</h3>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Dari pengalaman lapangan menjadi <span className="font-semibold text-gray-900 dark:text-white">AI Asisten Profesional</span>.
                Panduan praktis mengubah pengalaman bertahun-tahun menjadi aset digital yang bisa bekerja untuk diri sendiri maupun organisasi.
              </p>
              <ul className="space-y-2 mb-5">
                {REFLECT_STEPS.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="button-try-blueprint">
                <Link href="/blueprint-builder?preset=konstruksi">
                  <Sparkles className="h-4 w-4" /> Coba Blueprint Agen AI
                </Link>
              </Button>
            </div>
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 md:p-8 flex flex-col justify-center text-white">
              <p className="text-sm font-semibold text-blue-100 mb-2">Dari Pengalaman → Pengetahuan → AI → Produktivitas</p>
              <p className="text-lg font-bold leading-snug">
                "Belajar bukan hanya menambah ilmu, tetapi mengubah pengalaman menjadi AI yang dapat bekerja untuk Anda."
              </p>
            </div>
          </div>
        </Card>

        {/* Bonus 2: AI Chatbot Profesi (Claws) */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Akses AI Chatbot Profesi Konstruksi</h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-indigo-600 dark:text-indigo-400" data-testid="link-bundling-konstruksi">
              <Link href="/bundling-konstruksi">
                Lihat bundling chatbot per profesi <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {CLAWS.map((c) => (
              <Link key={c.name} href={c.href} className="group" data-testid={`link-claw-${c.name.toLowerCase()}`}>
                <Card className={`h-full transition-all hover:shadow-lg border-2 border-transparent ${c.ring}`}>
                  <CardContent className="pt-6 space-y-2">
                    <c.icon className={`h-8 w-8 ${c.accent}`} />
                    <h4 className="font-bold text-gray-900 dark:text-white">{c.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{c.desc}</p>
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${c.accent}`}>
                      Coba sekarang <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Sebagian asisten AI memerlukan akun & paket aktif — akses penuh terbuka lewat kode bonus peserta menjelang acara.
          </p>
        </div>
      </section>

      {/* ── ALUR PROSES (peraga pameran) ── */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-gray-200 dark:border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-3" data-testid="badge-flow">Peraga Pameran & Seminar</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Alur Membuat Chatbot Anda</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Dari daftar sampai chatbot siap pakai — inilah alur yang kami peragakan langsung di booth Indobuildtech 2026.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.title} className="relative" data-testid={`flow-step-${i + 1}`}>
                <Card className="h-full">
                  <CardContent className="pt-6 text-center space-y-2">
                    <span className="mx-auto w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                    <s.icon className="h-7 w-7 mx-auto text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{s.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{s.desc}</p>
                  </CardContent>
                </Card>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 h-5 w-5 text-indigo-400 z-10" />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="button-flow-dialog">
              <Link href="/konsultasi">
                <MessageSquare className="h-4 w-4" /> Coba Dialog Gustafta
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2" data-testid="button-flow-blueprint">
              <Link href="/blueprint-builder?preset=konstruksi">
                <BookOpen className="h-4 w-4" /> Rancang Blueprint
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2" data-testid="button-flow-klinik">
              <Link href="/klinik-konsultasi">
                <Stethoscope className="h-4 w-4" /> Klinik Konsultasi
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── BONUS 3 & 4 ── */}
      <section className="bg-white dark:bg-card border-y border-gray-200 dark:border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
          {/* 5 Kursus */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">5 Kursus Online Bersertifikat</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Voucher <span className="font-semibold">GRATIS</span> untuk peserta offline (3 Geoteknik + 2 Struktur):
            </p>
            <ul className="space-y-2">
              {COURSES.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
          {/* Ekosistem */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Ekosistem Pembelajaran ASDAMKINDO</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Jadi bagian dari komunitas pembelajaran berkelanjutan (lifelong learning):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Webinar lanjutan", "Regulasi terbaru", "Program PKB", "Informasi SKPK", "Informasi sertifikasi", "Inovasi teknologi konstruksi"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Zap className="h-3.5 w-3.5 text-violet-500 shrink-0" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── KLAIM BONUS ── */}
      <section id="klaim" className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <Card className="overflow-hidden border-orange-200 dark:border-orange-900">
          <div className="grid md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="h-5 w-5 text-orange-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cara Klaim Bonus</h3>
              </div>
              <ol className="space-y-3">
                {[
                  { t: "Daftar seminar", d: "Registrasi lewat tautan resmi panitia." },
                  { t: "Hadir offline & ambil kode", d: "Peserta offline memperoleh kode akses eksklusif di lokasi acara." },
                  { t: "Tukarkan kode di Gustafta", d: "Fitur penukaran kode akan aktif menjelang acara — akses bonus langsung terbuka." },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.t}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-3 mt-6">
                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-register-claim">
                  <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer">
                    Daftar Seminar <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2" data-testid="button-explore-gustafta">
                  <Link href="/">
                    <Sparkles className="h-4 w-4" /> Jelajahi Gustafta
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Kontak panitia: Mala 0813-3338-2393 · Melani 0812-1159-6251
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-muted p-6 md:p-8 flex items-center justify-center">
              <img
                src={speakersUrl}
                alt="Pembicara Seminar Indobuildtech 2026"
                className="rounded-xl shadow-lg w-full"
                data-testid="img-speakers"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* ── FOOTER co-brand ── */}
      <footer className="border-t border-gray-200 dark:border-border bg-white dark:bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span>Persembahan <span className="font-semibold text-gray-900 dark:text-white">ASDAMKINDO</span> × <span className="font-semibold text-gray-900 dark:text-white">Gustafta</span></span>
          </div>
          <span>© {new Date().getFullYear()} Gustafta — Mengubah pengetahuan manusia menjadi organisasi AI.</span>
        </div>
      </footer>
    </div>
  );
}
