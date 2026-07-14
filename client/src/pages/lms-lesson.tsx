import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, Check, BookOpen, Clock, Play,
  CheckCircle2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  videoUrl: string;
  type: string;
  durationMinutes: number;
  sortOrder: number;
  isPreview: boolean;
}

interface Course {
  id: number;
  title: string;
  color: string;
  emoji: string;
  lessons: { id: number; title: string; isPreview: boolean; type: string; durationMinutes: number }[];
}

interface Progress {
  enrolled: boolean;
  progress: number;
  completedLessons: number[];
}

function MarkdownContent({ content }: { content: string }) {
  if (!content) return <p className="text-slate-400 italic">Tidak ada konten.</p>;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-slate-800 mt-2 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-bold text-slate-700 mt-6 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-bold text-slate-700 mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-indigo-300 pl-4 py-1 my-3 bg-indigo-50 rounded-r-lg">
          <p className="text-sm text-indigo-700">{line.slice(2)}</p>
        </blockquote>
      );
    } else if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-slate-900 text-green-400 rounded-xl p-4 overflow-x-auto text-xs font-mono my-4 leading-relaxed">
          {codeLines.join("\n")}
        </pre>
      );
    } else if (line.startsWith("- ")) {
      const listItems = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1.5 my-3">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-slate-600 text-sm">
              <Check className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith("|")) {
      // Table
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split("|").filter(h => h.trim()).map(h => h.trim());
        const rows = tableLines.slice(2).map(row => row.split("|").filter(c => c.trim()).map(c => c.trim()));
        elements.push(
          <div key={i} className="overflow-x-auto my-4 rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>{headers.map((h, j) => <th key={j} className="px-4 py-2.5 text-left font-semibold text-slate-700">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, j) => (
                  <tr key={j} className="border-t border-slate-100">
                    {row.map((cell, k) => <td key={k} className="px-4 py-2.5 text-slate-600">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    } else if (line.startsWith("1. ") || /^\d+\. /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="space-y-1.5 my-3 list-none">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-slate-600 text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {j + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      // Regular paragraph — handle **bold** inline
      const formatted = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      elements.push(
        <p key={i} className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function LmsLesson() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [markingDone, setMarkingDone] = useState(false);

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/lms/courses", id],
    queryFn: () => fetch(`/api/lms/courses/${id}`).then(r => r.json()),
  });

  const { data: lesson, isLoading, error } = useQuery<Lesson & { requireLogin?: boolean }>({
    queryKey: ["/api/lms/lessons", lessonId],
    queryFn: () => fetch(`/api/lms/lessons/${lessonId}`).then(async r => {
      const data = await r.json();
      if (!r.ok) throw data;
      return data;
    }),
    retry: false,
  });

  const { data: progress } = useQuery<Progress>({
    queryKey: ["/api/lms/progress", id],
    queryFn: () => fetch(`/api/lms/progress/${id}`).then(r => r.json()),
    retry: false,
  });

  const progressMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/lms/progress", { lessonId: parseInt(lessonId!), courseId: parseInt(id!) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/progress", id] });
      setMarkingDone(true);
      toast({ title: "Selesai!", description: "Progress kursus diperbarui." });
    },
  });

  const isCompleted = progress?.completedLessons?.includes(parseInt(lessonId!)) ?? false;

  // Navigation
  const lessons = course?.lessons ?? [];
  const currentIndex = lessons.findIndex(l => l.id === parseInt(lessonId!));
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Memuat lesson…</p>
        </div>
      </div>
    );
  }

  if ((error as any)?.requireLogin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="font-bold text-slate-800 mb-2">Login Diperlukan</h2>
          <p className="text-slate-500 text-sm mb-5">Silakan login untuk mengakses lesson ini.</p>
          <Link href="/api/auth/login">
            <Button className="w-full">Login / Daftar</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Lesson tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href={`/lms/course/${id}`}>
            <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{course?.title ?? "Kursus"}</span>
            </button>
          </Link>

          {/* Progress breadcrumb */}
          {lessons.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto">
              {lessons.map((l, i) => {
                const done = progress?.completedLessons?.includes(l.id) ?? false;
                const active = l.id === parseInt(lessonId!);
                return (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/lms/course/${id}/lesson/${l.id}`)}
                    className={`w-2.5 h-2.5 rounded-full transition-all flex-shrink-0 ${
                      active ? "w-5 bg-indigo-500" : done ? "bg-green-400" : "bg-slate-200"
                    }`}
                    title={l.title}
                  />
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            {isCompleted || markingDone ? (
              <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Selesai
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => progressMutation.mutate()}
                disabled={progressMutation.isPending}
                className="text-xs"
                data-testid="button-mark-done"
              >
                <Check className="w-3 h-3 mr-1" />
                {progressMutation.isPending ? "Menyimpan…" : "Tandai Selesai"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar — lesson list */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-20">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Daftar Lesson</p>
              <div className="space-y-1">
                {lessons.map((l, i) => {
                  const done = progress?.completedLessons?.includes(l.id) ?? false;
                  const active = l.id === parseInt(lessonId!);
                  return (
                    <button
                      key={l.id}
                      onClick={() => navigate(`/lms/course/${id}/lesson/${l.id}`)}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                        active
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        done ? "bg-green-100 text-green-600" : active ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                      }`}>
                        {done ? <Check className="w-3 h-3" /> : (i + 1)}
                      </div>
                      <span className="line-clamp-2">{l.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Lesson header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  {lesson.type === "video" ? <Play className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                  {lesson.type === "video" ? "Video" : "Artikel"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lesson.durationMinutes} menit
                </span>
                {lesson.isPreview && (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Preview Gratis</span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">{lesson.title}</h1>
              {(isCompleted || markingDone) && (
                <div className="flex items-center gap-2 mt-3 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Lesson ini sudah selesai
                </div>
              )}
            </div>

            {/* Video (if any) */}
            {lesson.videoUrl && (
              <div className="bg-black rounded-2xl overflow-hidden mb-5 aspect-video">
                <iframe
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
              <MarkdownContent content={lesson.content || ""} />
            </div>

            {/* Bottom navigation */}
            <div className="flex items-center justify-between gap-4">
              {prevLesson ? (
                <button
                  onClick={() => navigate(`/lms/course/${id}/lesson/${prevLesson.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{prevLesson.title}</span>
                  <span className="sm:hidden">Sebelumnya</span>
                </button>
              ) : (
                <Link href={`/lms/course/${id}`}>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Kembali ke Kursus
                  </button>
                </Link>
              )}

              {nextLesson ? (
                <button
                  onClick={() => {
                    if (!isCompleted && !markingDone) progressMutation.mutate();
                    navigate(`/lms/course/${id}/lesson/${nextLesson.id}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  data-testid="button-next-lesson"
                >
                  <span className="hidden sm:inline">{nextLesson.title}</span>
                  <span className="sm:hidden">Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link href={`/lms/course/${id}`}>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Kursus Selesai!
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
