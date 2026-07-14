import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Clock, BookOpen, Play, Lock, Check, ChevronRight,
  Star, Users, GraduationCap, Zap, Rocket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: number;
  title: string;
  slug: string;
  type: string;
  durationMinutes: number;
  isPreview: boolean;
  sortOrder: number;
}

interface Course {
  id: number;
  title: string;
  shortDesc: string;
  description: string;
  category: string;
  subcategory: string;
  color: string;
  emoji: string;
  instructor: string;
  durationMinutes: number;
  price: number;
  level: string;
  isFeatured: boolean;
  lessons: Lesson[];
}

interface Progress {
  enrolled: boolean;
  progress: number;
  completedLessons: number[];
  completedAt: string | null;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

const CAPSTONE_BY_CATEGORY: Record<string, { domain: string; label: string; desc: string }> = {
  konstruksi: {
    domain: "tender",
    label: "Praktik Nyata: Ruang Tender",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja tender, jalankan analisis kelayakan & peluang menang, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  tender: {
    domain: "tender",
    label: "Praktik Nyata: Ruang Tender",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja tender, jalankan analisis kelayakan & peluang menang, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  perizinan: {
    domain: "perizinan",
    label: "Praktik Nyata: Ruang Perizinan",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja perizinan, jalankan analisis kesiapan berkas OSS, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  legalitas: {
    domain: "perizinan",
    label: "Praktik Nyata: Ruang Perizinan",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja perizinan, jalankan analisis kesiapan berkas OSS, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  skk: {
    domain: "skk",
    label: "Praktik Nyata: Ruang Sertifikasi SKK",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja SKK, jalankan analisis kesiapan uji kompetensi, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  kompetensi: {
    domain: "skk",
    label: "Praktik Nyata: Ruang Sertifikasi SKK",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja SKK, jalankan analisis kesiapan uji kompetensi, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  k3: {
    domain: "k3",
    label: "Praktik Nyata: Ruang K3 / SMK3",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja K3, jalankan analisis kematangan sistem K3 proyek, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  keselamatan: {
    domain: "k3",
    label: "Praktik Nyata: Ruang K3 / SMK3",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja K3, jalankan analisis kematangan sistem K3 proyek, lalu simpan hasilnya sebagai bukti portofolio.",
  },
};

// Subcategory lebih spesifik daripada category — mis. 3 kursus konstruksi (SBU/SKK/K3)
// berbagi category "konstruksi" tapi harus menuju Workroom domain yang berbeda.
const CAPSTONE_BY_SUBCATEGORY: Record<string, { domain: string; label: string; desc: string }> = {
  SBU: {
    domain: "perizinan",
    label: "Praktik Nyata: Ruang Perizinan (SBU via OSS)",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja perizinan, jalankan analisis kesiapan berkas & kualifikasi badan usaha untuk pengajuan SBU lewat OSS, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  SKK: {
    domain: "skk",
    label: "Praktik Nyata: Ruang Sertifikasi SKK",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja SKK, jalankan analisis kesiapan uji kompetensi, lalu simpan hasilnya sebagai bukti portofolio.",
  },
  K3: {
    domain: "k3",
    label: "Praktik Nyata: Ruang K3 / SMK3",
    desc: "Terapkan yang Anda pelajari — buat ruang kerja K3, jalankan analisis kematangan sistem K3 proyek, lalu simpan hasilnya sebagai bukti portofolio.",
  },
};

function capstoneForCourse(
  course?: { category?: string; subcategory?: string } | null,
): { domain: string; label: string; desc: string } | null {
  if (!course) return null;
  const subKey = course.subcategory ? course.subcategory.trim().toUpperCase() : "";
  const bySub = subKey ? CAPSTONE_BY_SUBCATEGORY[subKey] : undefined;
  if (bySub) return bySub;
  const catKey = course.category ? course.category.trim().toLowerCase() : "";
  return (catKey ? CAPSTONE_BY_CATEGORY[catKey] : undefined) || null;
}

export default function LmsCourse() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["/api/lms/courses", id],
    queryFn: () => fetch(`/api/lms/courses/${id}`).then(r => {
      if (!r.ok) throw new Error("Kursus tidak ditemukan");
      return r.json();
    }),
  });

  const { data: progress } = useQuery<Progress>({
    queryKey: ["/api/lms/progress", id],
    queryFn: () => fetch(`/api/lms/progress/${id}`).then(r => r.json()),
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/lms/enroll/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/progress", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/lms/my-courses"] });
      toast({ title: "Berhasil!", description: "Anda telah terdaftar di kursus ini." });
    },
    onError: () => {
      toast({ title: "Login diperlukan", description: "Silakan login untuk mendaftar kursus.", variant: "destructive" });
    },
  });

  const capstoneMutation = useMutation({
    mutationFn: (): Promise<any> =>
      apiRequest("POST", "/api/workrooms", {
        title: course ? `Capstone — ${course.title}` : "Capstone",
        domain: capstoneForCourse(course)?.domain || "tender",
        context: { source: "capstone", courseId: course?.id, courseTitle: course?.title },
      }),
    onSuccess: (room: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workrooms"] });
      toast({ title: "Workroom capstone dibuat", description: "Praktikkan skill Anda di ruang kerja nyata." });
      navigate(`/workroom/${room.id}`);
    },
    onError: () => {
      toast({ title: "Login diperlukan", description: "Silakan login untuk memulai capstone.", variant: "destructive" });
    },
  });

  const handleStartLesson = (lesson: Lesson) => {
    const canAccess = lesson.isPreview || (progress?.enrolled ?? false) || (course?.price === 0);
    if (!canAccess) {
      enrollMutation.mutate();
      return;
    }
    navigate(`/lms/course/${id}/lesson/${lesson.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Memuat kursus…</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Kursus tidak ditemukan.</p>
          <Link href="/lms"><button className="mt-3 text-indigo-600 text-sm hover:underline">← Kembali ke Learning Center</button></Link>
        </div>
      </div>
    );
  }

  const isEnrolled = progress?.enrolled ?? (course.price === 0);
  const capstone = capstoneForCourse(course);
  const completedCount = progress?.completedLessons?.length ?? 0;
  const totalLessons = course.lessons.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const firstLesson = course.lessons[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="text-white py-12 px-4" style={{ background: `linear-gradient(135deg, ${course.color}ee 0%, ${course.color}99 100%)` }}>
        <div className="max-w-5xl mx-auto">
          <Link href="/lms">
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Learning Center
            </button>
          </Link>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-4xl">{course.emoji}</span>
                {course.isFeatured && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Star className="w-3 h-3 mr-1" />
                    Unggulan
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-white/30">
                  {LEVEL_LABELS[course.level] || "Pemula"}
                </Badge>
                {course.subcategory && (
                  <Badge className="bg-white/20 text-white border-white/30">{course.subcategory}</Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
              <p className="text-white/85 text-base">{course.shortDesc}</p>
              <div className="flex items-center gap-5 text-white/70 text-sm flex-wrap">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {totalLessons} lesson
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDuration(course.durationMinutes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {course.instructor}
                </span>
                <span className="font-semibold text-white">
                  {course.price === 0 ? "Gratis" : `Rp ${course.price.toLocaleString("id-ID")}`}
                </span>
              </div>
            </div>

            {/* Enroll / Progress card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              {isEnrolled && progressPct > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>Progress</span>
                    <span className="font-semibold">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-white/70">{completedCount} dari {totalLessons} lesson selesai</p>
                  {firstLesson && (
                    <button
                      onClick={() => navigate(`/lms/course/${id}/lesson/${firstLesson.id}`)}
                      className="w-full py-2.5 bg-white text-slate-800 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Lanjutkan Belajar
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{course.price === 0 ? "Gratis" : `Rp ${course.price.toLocaleString("id-ID")}`}</p>
                    {course.price === 0 && <p className="text-white/70 text-xs mt-1">Akses penuh tanpa biaya</p>}
                  </div>
                  <button
                    onClick={() => firstLesson && navigate(`/lms/course/${id}/lesson/${firstLesson.id}`)}
                    className="w-full py-2.5 bg-white text-slate-800 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                    data-testid="button-start-course"
                  >
                    <Zap className="w-4 h-4" />
                    Mulai Belajar
                  </button>
                  <div className="space-y-2 text-xs text-white/70">
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-green-300" /> Akses seumur hidup</p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-green-300" /> Tracking progress otomatis</p>
                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-green-300" /> Konten selalu diperbarui</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Lessons list */}
          <div className="md:col-span-2 space-y-3">
            {capstone && (
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm mb-6" data-testid="card-capstone">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-800">{capstone.label}</h3>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Capstone</Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{capstone.desc}</p>
                    <Button
                      onClick={() => capstoneMutation.mutate()}
                      disabled={capstoneMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      data-testid="button-start-capstone"
                    >
                      {capstoneMutation.isPending ? "Menyiapkan…" : "Mulai Capstone di Workroom"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <h2 className="font-bold text-slate-800 text-lg mb-4">Daftar Lesson</h2>
            {course.lessons.map((lesson, i) => {
              const isCompleted = progress?.completedLessons?.includes(lesson.id) ?? false;
              const canAccess = lesson.isPreview || isEnrolled || course.price === 0;
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleStartLesson(lesson)}
                  className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  data-testid={`lesson-item-${lesson.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Number / status */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${
                      isCompleted
                        ? "bg-green-100 text-green-600"
                        : canAccess
                        ? "text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                    style={!isCompleted && canAccess ? { backgroundColor: course.color } : {}}>
                      {isCompleted ? <Check className="w-4 h-4" /> : canAccess ? (i + 1) : <Lock className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.isPreview && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 py-0">Preview Gratis</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          {lesson.type === "video" ? <Play className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                          {lesson.type === "video" ? "Video" : "Artikel"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.durationMinutes} menit
                        </span>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${canAccess ? "text-slate-300 group-hover:text-indigo-400" : "text-slate-200"}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* About course */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3">Tentang Kursus</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3">Detail Kursus</h3>
              <div className="space-y-2">
                {[
                  { label: "Level", value: LEVEL_LABELS[course.level] || "Pemula" },
                  { label: "Lesson", value: `${totalLessons} lesson` },
                  { label: "Durasi", value: formatDuration(course.durationMinutes) },
                  { label: "Instruktur", value: course.instructor },
                  { label: "Harga", value: course.price === 0 ? "Gratis" : `Rp ${course.price.toLocaleString("id-ID")}` },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="font-medium text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to catalog */}
            <Link href="/lms">
              <button className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                ← Kembali ke Katalog
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
