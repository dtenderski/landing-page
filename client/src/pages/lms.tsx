import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Clock, Users, Star, ChevronRight, GraduationCap, Wrench, Zap, Search, Bot, ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Course {
  id: number;
  title: string;
  slug: string;
  shortDesc: string;
  category: string;
  subcategory: string;
  color: string;
  emoji: string;
  instructor: string;
  durationMinutes: number;
  price: number;
  level: string;
  isFeatured: boolean;
  lessonCount: number;
}

interface AgentEcourse {
  id: number;
  name: string;
  description: string;
  tagline: string;
  avatar: string;
  category: string;
  subcategory: string;
  widget_color: string;
  kb_count: number;
}

const CATEGORIES = [
  { key: "all", label: "Semua", icon: BookOpen },
  { key: "onboarding", label: "Panduan Gustafta", icon: Zap },
  { key: "konstruksi", label: "Konstruksi", icon: Wrench },
  { key: "demo", label: "Demo Produk", icon: GraduationCap },
];

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  beginner: { label: "Pemula", color: "bg-green-100 text-green-700" },
  intermediate: { label: "Menengah", color: "bg-yellow-100 text-yellow-700" },
  advanced: { label: "Lanjutan", color: "bg-red-100 text-red-700" },
};

// Category → color/emoji/label mapping for agent ecourses (matches DB categories)
const AGENT_CAT_META: Record<string, { color: string; emoji: string; label: string }> = {
  "engineering": { color: "#f97316", emoji: "🏗️", label: "Teknik Konstruksi" },
  "legal": { color: "#8b5cf6", emoji: "⚖️", label: "Hukum & Legal" },
  "compliance": { color: "#ec4899", emoji: "🛡️", label: "Kepatuhan & Integritas" },
  "digitalization": { color: "#06b6d4", emoji: "💻", label: "Digitalisasi & ERP" },
  "certification": { color: "#eab308", emoji: "🎓", label: "Sertifikasi & Akreditasi" },
  "business": { color: "#22c55e", emoji: "📈", label: "Bisnis & Jasa" },
  "services": { color: "#3b82f6", emoji: "🔧", label: "Layanan Profesional" },
  "education": { color: "#a855f7", emoji: "📚", label: "Pendidikan & Pelatihan" },
  // fallback patterns
  "sbu": { color: "#f97316", emoji: "🏗️", label: "SBU Konstruksi" },
  "skk": { color: "#22c55e", emoji: "📋", label: "SKK & Kompetensi" },
  "k3": { color: "#ef4444", emoji: "⛑️", label: "K3 & Keselamatan" },
  "iso": { color: "#3b82f6", emoji: "📊", label: "ISO & Standar" },
  "tender": { color: "#06b6d4", emoji: "📄", label: "Tender & Pengadaan" },
  "lsp": { color: "#eab308", emoji: "🎓", label: "LSP & Asesmen" },
};

function getAgentMeta(category: string) {
  const cat = (category || "").toLowerCase();
  // Exact match first
  if (AGENT_CAT_META[cat]) return AGENT_CAT_META[cat];
  // Partial match
  const key = Object.keys(AGENT_CAT_META).find(k => cat.includes(k));
  return key ? AGENT_CAT_META[key] : { color: "#6366f1", emoji: "📚", label: category };
}

function getCatLabel(category: string) {
  return getAgentMeta(category).label || category;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

function CourseCard({ course }: { course: Course }) {
  const level = LEVEL_LABELS[course.level] || LEVEL_LABELS.beginner;
  return (
    <Link href={`/lms/course/${course.id}`}>
      <div
        className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden h-full flex flex-col"
        data-testid={`card-course-${course.id}`}
      >
        <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: course.color }} />
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-3">
            <span className="text-3xl">{course.emoji}</span>
            <div className="flex flex-col items-end gap-1">
              {course.isFeatured && (
                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  <Star className="w-2.5 h-2.5 mr-1" />
                  Unggulan
                </Badge>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${level.color}`}>
                {level.label}
              </span>
            </div>
          </div>
          <h3 className="font-bold text-slate-800 text-base leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
            {course.title}
          </h3>
          {course.subcategory && (
            <p className="text-xs text-slate-400 mb-2">{course.subcategory}</p>
          )}
          <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-4">
            {course.shortDesc}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 mt-auto">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {course.lessonCount} lesson
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(course.durationMinutes)}
              </span>
            </div>
            {course.price === 0 ? (
              <span className="font-semibold text-green-600">Gratis</span>
            ) : (
              <span className="font-semibold text-slate-700">
                Rp {course.price.toLocaleString("id-ID")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EcourseAgentCard({ agent }: { agent: AgentEcourse }) {
  const meta = getAgentMeta(agent.category);
  const color = agent.widget_color || meta.color;
  const ecourseUrl = `/product/${agent.id}/ecourse`;

  return (
    <a
      href={ecourseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden h-full flex flex-col"
      data-testid={`card-ecourse-agent-${agent.id}`}
    >
      <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{meta.emoji}</span>
          <div className="flex flex-col items-end gap-1">
            <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200">
              <Bot className="w-2.5 h-2.5 mr-1" />
              AI-Generated
            </Badge>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
              Gratis
            </span>
          </div>
        </div>
        <h3 className="font-bold text-slate-800 text-base leading-snug mb-1 group-hover:text-violet-600 transition-colors line-clamp-2">
          {agent.name}
        </h3>
        {agent.category && (
          <p className="text-xs text-slate-400 mb-2 capitalize">{agent.category} · {agent.subcategory || "eCourse"}</p>
        )}
        <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-4 line-clamp-3">
          {agent.description || agent.tagline || `Kursus berbasis AI tentang ${agent.category || "kompetensi konstruksi"}.`}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 mt-auto">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {agent.kb_count} modul KB
          </span>
          <span className="flex items-center gap-1.5 font-medium text-violet-600 group-hover:text-violet-700">
            <Play className="w-3 h-3" />
            Buka eCourse
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function LmsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [ecourseSearch, setEcourseSearch] = useState("");

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/lms/courses", activeCategory],
    queryFn: () =>
      fetch(`/api/lms/courses?category=${activeCategory}`).then(r => r.json()),
  });

  const { data: agentEcourses = [], isLoading: ecLoading } = useQuery<AgentEcourse[]>({
    queryKey: ["/api/lms/ecourses"],
    queryFn: () => fetch("/api/lms/ecourses").then(r => r.json()),
  });

  const filtered = courses.filter(c =>
    search === "" ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.shortDesc.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEcourses = agentEcourses.filter(a =>
    ecourseSearch === "" ||
    a.name.toLowerCase().includes(ecourseSearch.toLowerCase()) ||
    (a.category || "").toLowerCase().includes(ecourseSearch.toLowerCase()) ||
    (a.description || "").toLowerCase().includes(ecourseSearch.toLowerCase())
  );

  const featured = filtered.filter(c => c.isFeatured);
  const regular = filtered.filter(c => !c.isFeatured);

  // Group agent ecourses by category for display
  const ecourseGroups = filteredEcourses.reduce<Record<string, AgentEcourse[]>>((acc, a) => {
    const cat = a.category || "Lainnya";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <GraduationCap className="w-4 h-4" />
            Gustafta Learning Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Pelajari AI & Konstruksi</h1>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
            Kursus gratis — dari cara pakai Gustafta hingga panduan SKK, SBU, dan K3 konstruksi.
          </p>
          <div className="max-w-md mx-auto mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari kursus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white text-slate-800 border-0 h-11 rounded-xl"
              data-testid="input-search-courses"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
              }`}
              data-testid={`filter-${cat.key}`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Tidak ada kursus yang ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h2 className="font-bold text-slate-800">Kursus Unggulan</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              </section>
            )}
            {regular.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <h2 className="font-bold text-slate-800">
                    {featured.length > 0 ? "Kursus Lainnya" : "Semua Kursus"}
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {regular.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ─── eCourse Interaktif dari Chatbot AI ─── */}
        {(activeCategory === "all" || activeCategory === "demo") && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-500" />
                <h2 className="font-bold text-slate-800 text-lg">eCourse Interaktif dari Chatbot AI</h2>
                {!ecLoading && (
                  <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                    {agentEcourses.length} tersedia
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              eCourse yang dihasilkan otomatis dari knowledge base chatbot AI — materi terstruktur, kuis, dan sertifikat untuk setiap topik.
            </p>

            {/* Search ecourses */}
            <div className="relative max-w-sm mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Cari eCourse AI..."
                value={ecourseSearch}
                onChange={e => setEcourseSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
                data-testid="input-search-ecourses"
              />
            </div>

            {ecLoading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : filteredEcourses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada eCourse yang cocok.</p>
              </div>
            ) : ecourseSearch !== "" ? (
              // Flat list when searching
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEcourses.map(a => (
                  <EcourseAgentCard key={a.id} agent={a} />
                ))}
              </div>
            ) : (
              // Grouped by category
              <div className="space-y-8">
                {Object.entries(ecourseGroups)
                  .sort(([, a], [, b]) => b.length - a.length)
                  .map(([cat, agents]) => {
                    const meta = getAgentMeta(cat);
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{meta.emoji}</span>
                          <span className="text-base font-semibold text-slate-700">{getCatLabel(cat)}</span>
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{agents.length} kursus</span>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {agents.map(a => (
                            <EcourseAgentCard key={a.id} agent={a} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* CTA: Product Tour */}
        <div className="mt-14 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-bold text-slate-800 text-xl mb-2">Belum yakin dengan Gustafta?</h3>
          <p className="text-slate-500 mb-5 max-w-md mx-auto text-sm">
            Coba tur interaktif produk — jelajahi semua fitur Gustafta tanpa perlu login atau mendaftar.
          </p>
          <Link href="/product-tour">
            <button className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
              Mulai Product Tour
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
