import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Bot, BookOpen, Layers, ArrowRight, Sparkles, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SeriesWithStats } from "@shared/schema";

export default function SeriesCatalog() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: allSeries, isLoading } = useQuery<SeriesWithStats[]>({
    queryKey: ["/api/series/public"],
  });

  const categories = allSeries
    ? Array.from(new Set(allSeries.map(s => s.category).filter(Boolean)))
    : [];

  const filtered = allSeries?.filter(s => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      (s.tags as string[])?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const featured = filtered.filter(s => s.isFeatured);
  const regular = filtered.filter(s => !s.isFeatured);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/">
            <span className="text-lg font-bold text-foreground cursor-pointer">
              Gustafta
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">Marketplace</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Harga</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Chatbot Series
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Koleksi Chatbot Series
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Jelajahi paket chatbot terstruktur yang siap pakai. Setiap series berisi banyak chatbot yang terorganisir untuk kebutuhan spesifik Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari series chatbot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm"
             
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
               
              >
                Semua
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                 
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="h-40 bg-muted rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum Ada Series</h3>
            <p className="text-muted-foreground text-sm">
              {search ? "Tidak ditemukan series yang cocok dengan pencarian Anda." : "Belum ada chatbot series yang tersedia saat ini."}
            </p>
          </div>
        )}

        {featured.length > 0 && (
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Series Unggulan</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {featured.map(s => (
                <SeriesCard key={s.id} series={s} featured />
              ))}
            </div>
          </div>
        )}

        {regular.length > 0 && (
          <div>
            {featured.length > 0 && (
              <h2 className="text-lg font-semibold mb-4">Semua Series</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {regular.map(s => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t mt-16 py-6 text-center text-sm text-muted-foreground">
        Powered by <a href="/" className="font-medium hover:underline">Gustafta</a> - AI Chatbot Builder Platform
      </footer>
    </div>
  );
}

function SeriesCard({ series: s, featured = false }: { series: SeriesWithStats; featured?: boolean }) {
  const color = s.color || "#6366f1";

  return (
    <Link href={`/series/${s.slug}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer group">
        <CardContent className="p-0">
          <div
            className="relative overflow-hidden"
            style={{
              background: s.coverImage
                ? `url(${s.coverImage}) center/cover`
                : `linear-gradient(135deg, ${color} 0%, ${color}cc 50%, ${color}88 100%)`,
              height: featured ? 200 : 160,
            }}
          >
            {s.coverImage && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {s.isFeatured && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 border-0 text-[10px] no-default-hover-elevate no-default-active-elevate">
                    <Star className="w-3 h-3 mr-0.5" />
                    Unggulan
                  </Badge>
                )}
                {s.category && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] no-default-hover-elevate no-default-active-elevate">
                    {s.category}
                  </Badge>
                )}
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl leading-tight">
                {s.name}
              </h3>
              {s.tagline && (
                <p className="text-white/80 text-xs sm:text-sm mt-0.5 line-clamp-1">{s.tagline}</p>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {s.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{s.totalBigIdeas} Modul</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="w-3.5 h-3.5" />
                <span>{s.totalToolboxes} Chatbot</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="w-3.5 h-3.5" />
                <span>{s.totalAgents} Alat Bantu</span>
              </div>
            </div>

            {(s.tags as string[])?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(s.tags as string[]).slice(0, 4).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>{s.language === "id" ? "Indonesia" : s.language === "en" ? "English" : s.language}</span>
              </div>
              <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Jelajahi <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
