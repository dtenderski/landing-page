import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award, GraduationCap, Briefcase, FileCheck, Rocket, TrendingUp,
  BookOpen, ArrowRight, Trophy,
} from "lucide-react";

interface Portfolio {
  stats: {
    enrolledCount: number;
    completedCount: number;
    workroomCount: number;
    capstoneCount: number;
    deliverableCount: number;
    certCount: number;
  };
  badges: { id: string; label: string; desc: string; tone: string }[];
  completedCourses: { id: number; title: string; emoji: string; color: string; category: string; completedAt: string }[];
  workrooms: { id: number; title: string; domain: string; status: string; source: string | null; courseTitle: string | null }[];
  certificates: { id: number; title: string; competencyDomain: string; level: string; issuedAt: string; verifyToken: string }[];
}

const TONE: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
};

function fmtDate(s: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Portofolio() {
  const { data, isLoading, isError } = useQuery<Portfolio>({ queryKey: ["/api/portfolio"] });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-500/30 border-t-rose-400 animate-spin" />
        <p className="text-slate-400 text-sm">Memuat portofolio…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-400" data-testid="text-portfolio-error">
          Gagal memuat portofolio. Silakan login terlebih dahulu untuk melihat pencapaian Anda.
        </p>
        <Button asChild variant="outline"><Link href="/os">Kembali ke Gustafta OS</Link></Button>
      </div>
    );
  }

  const { stats, badges, completedCourses, workrooms, certificates } = data;
  const isEmpty =
    stats.enrolledCount === 0 && stats.workroomCount === 0 && stats.certCount === 0;

  const statCards = [
    { label: "Kursus Selesai", value: stats.completedCount, icon: <GraduationCap className="h-4 w-4" />, testid: "stat-completed" },
    { label: "Workroom", value: stats.workroomCount, icon: <Briefcase className="h-4 w-4" />, testid: "stat-workrooms" },
    { label: "Hasil Kerja", value: stats.deliverableCount, icon: <Rocket className="h-4 w-4" />, testid: "stat-deliverables" },
    { label: "Sertifikat", value: stats.certCount, icon: <FileCheck className="h-4 w-4" />, testid: "stat-certs" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" data-testid="text-page-title">Portofolio Kompetensi</h1>
            <p className="text-slate-400 text-sm">Bukti nyata: belajar, praktik, dan sertifikasi Anda dalam satu tempat.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-slate-700">
            <Link href="/os">Gustafta OS</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="bg-slate-900 border-slate-800" data-testid={s.testid}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">{s.icon}{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isEmpty && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center space-y-4">
              <Award className="h-10 w-10 text-rose-400 mx-auto" />
              <div>
                <p className="font-semibold text-lg">Portofolio Anda masih kosong</p>
                <p className="text-slate-400 text-sm mt-1">
                  Mulai belajar di Academy, praktik di Workroom, lalu bukti pencapaian Anda muncul otomatis di sini.
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button asChild className="bg-amber-600 hover:bg-amber-700"><Link href="/lms" data-testid="button-goto-academy">Mulai Belajar</Link></Button>
                <Button asChild variant="outline" className="border-slate-700"><Link href="/workroom" data-testid="button-goto-workroom">Buka Workroom</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Award className="h-5 w-5 text-rose-400" /> Lencana Pencapaian</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.id} className={`rounded-xl border p-4 ${TONE[b.tone] || TONE.amber}`} data-testid={`badge-${b.id}`}>
                  <div className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4" />{b.label}</div>
                  <p className="text-xs opacity-80 mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed courses */}
        {completedCourses.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-400" /> Kursus Selesai</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedCourses.map((c) => (
                <Link key={c.id} href={`/lms/course/${c.id}`} className="block" data-testid={`course-done-${c.id}`}>
                  <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <span className="text-2xl">{c.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-snug">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Selesai {fmtDate(c.completedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Workrooms */}
        {workrooms.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Briefcase className="h-5 w-5 text-sky-400" /> Workroom & Hasil Praktik</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workrooms.map((w) => (
                <Link key={w.id} href={`/workroom/${w.id}`} className="block" data-testid={`workroom-item-${w.id}`}>
                  <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm leading-snug flex-1 min-w-0">{w.title}</p>
                        {w.source === "capstone" && (
                          <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs">Capstone</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="capitalize">{w.domain}</span>
                        <span>·</span>
                        <span className="capitalize">{w.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><FileCheck className="h-5 w-5 text-indigo-400" /> Sertifikat Digital</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {certificates.map((cert) => (
                <Link key={cert.id} href={`/verify-sertifikat?token=${cert.verifyToken}`} className="block" data-testid={`cert-item-${cert.id}`}>
                  <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <FileCheck className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-snug">{cert.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {cert.competencyDomain && <span>{cert.competencyDomain} · </span>}
                          {fmtDate(cert.issuedAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Next steps */}
        {!isEmpty && (
          <Card className="bg-gradient-to-br from-rose-500/10 to-slate-900 border-rose-500/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-rose-400" /> Tingkatkan Portofolio</CardTitle></CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              <Button asChild variant="outline" className="border-slate-700"><Link href="/lms" data-testid="button-more-courses"><BookOpen className="h-4 w-4 mr-2" /> Ikuti Kursus Lain <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
              <Button asChild variant="outline" className="border-slate-700"><Link href="/workroom" data-testid="button-more-workrooms"><Briefcase className="h-4 w-4 mr-2" /> Praktik di Workroom <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
