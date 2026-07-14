import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Bot, BookOpen, Layers, ArrowLeft, ArrowRight, ChevronDown, ChevronRight, MessageCircle, Sparkles, Target, Users, Globe, Share2, Lightbulb, Network, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SeriesWithHierarchy } from "@shared/schema";

const typeIcons: Record<string, any> = {
  problem: Target,
  idea: Lightbulb,
  inspiration: Sparkles,
  mentoring: Users,
};

const typeLabels: Record<string, string> = {
  problem: "Problem Solving",
  idea: "Ide & Inovasi",
  inspiration: "Inspirasi",
  mentoring: "Mentoring",
};

export default function SeriesDetail() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expandedBigIdeas, setExpandedBigIdeas] = useState<Set<string>>(new Set());
  const [expandedToolboxes, setExpandedToolboxes] = useState<Set<string>>(new Set());
  const [installed, setInstalled] = useState(false);

  const { data: seriesData, isLoading, error } = useQuery<SeriesWithHierarchy>({
    queryKey: ["/api/series/public", params.slug],
  });

  const { data: authUser } = useQuery<{ id: string; role: string } | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const installMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/series/${params.slug}/install`, {}),
    onSuccess: async (res: any) => {
      const data = await res.json().catch(() => ({}));
      if (data.skipped) {
        toast({ title: "Sudah terpasang", description: "LexCom sudah ada di workspace Anda." });
      } else {
        toast({ title: "Berhasil!", description: data.message });
        setInstalled(true);
        qc.invalidateQueries({ queryKey: ["/api/series"] });
      }
    },
    onError: async (err: any) => {
      const data = await err.response?.json().catch(() => ({}));
      if (data?.reason === "no_active_subscription") {
        toast({ title: "Langganan diperlukan", description: "Aktifkan langganan Gustafta untuk menginstall series ini.", variant: "destructive" });
        navigate("/pricing");
      } else {
        toast({ title: "Gagal install", description: data?.error || "Terjadi kesalahan.", variant: "destructive" });
      }
    },
  });

  const isInstallable = seriesData?.slug === "lexcom-ai-hukum-indonesia";

  const toggleBigIdea = (id: string) => {
    setExpandedBigIdeas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleToolbox = (id: string) => {
    setExpandedToolboxes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (!seriesData) return;
    const biIds = new Set(seriesData.bigIdeas.map(bi => bi.id));
    const tbIds = new Set(seriesData.bigIdeas.flatMap(bi => bi.toolboxes.map(tb => tb.id)));
    setExpandedBigIdeas(biIds);
    setExpandedToolboxes(tbIds);
  };

  const collapseAll = () => {
    setExpandedBigIdeas(new Set());
    setExpandedToolboxes(new Set());
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: seriesData?.name || "Chatbot Series",
          text: seriesData?.tagline || seriesData?.description || "",
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Memuat series...</p>
        </div>
      </div>
    );
  }

  if (error || !seriesData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Series Tidak Ditemukan</h2>
          <p className="text-muted-foreground text-sm">
            Series ini mungkin tidak tersedia atau link-nya tidak valid.
          </p>
          <Link href="/series">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Katalog
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const color = seriesData.color || "#6366f1";
  const s = seriesData;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: s.coverImage
            ? `url(${s.coverImage}) center/cover`
            : `linear-gradient(135deg, ${color} 0%, ${color}dd 40%, ${color}88 100%)`,
          minHeight: 280,
        }}
      >
        {s.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        )}
        {!s.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 left-12 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-8 right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <Link href="/series">
              <Button variant="ghost" size="sm" className="text-white">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Katalog
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="text-white" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-w-3xl pb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              {s.category && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs no-default-hover-elevate no-default-active-elevate">
                  {s.category}
                </Badge>
              )}
              {s.language && (
                <Badge variant="secondary" className="bg-white/15 text-white/90 border-0 text-xs no-default-hover-elevate no-default-active-elevate">
                  <Globe className="w-3 h-3 mr-1" />
                  {s.language === "id" ? "Indonesia" : s.language === "en" ? "English" : s.language}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {s.name}
            </h1>
            {s.tagline && (
              <p className="text-white/80 text-base sm:text-lg mb-4">{s.tagline}</p>
            )}
            {s.description && (
              <p className="text-white/70 text-sm sm:text-base max-w-2xl mb-6">{s.description}</p>
            )}

            {/* Install CTA */}
            {isInstallable && (
              <div className="mb-5">
                {installed ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Terpasang di Workspace
                    </div>
                    <Link href="/dashboard">
                      <Button size="sm" variant="ghost" className="text-white border border-white/30 hover:bg-white/10" data-testid="button-go-to-workspace">
                        Buka Workspace
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : !authUser ? (
                  <a href="/login">
                    <Button className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-lg" data-testid="button-login-to-install">
                      <Download className="w-4 h-4" />
                      Masuk & Tambah ke Workspace
                    </Button>
                  </a>
                ) : (
                  <Button
                    onClick={() => installMutation.mutate()}
                    disabled={installMutation.isPending}
                    className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-lg"
                    data-testid="button-install-series"
                  >
                    <Download className="w-4 h-4" />
                    {installMutation.isPending ? "Menginstall LexCom..." : "Tambah ke Workspace"}
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold">{s.totalBigIdeas}</p>
                  <p className="text-[10px] text-white/60">Modul</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold">{s.totalToolboxes}</p>
                  <p className="text-[10px] text-white/60">Chatbot</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold">{s.totalAgents}</p>
                  <p className="text-[10px] text-white/60">Alat Bantu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Struktur Series
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Buka Semua
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Tutup Semua
            </Button>
          </div>
        </div>

        {/* Hub Orchestrator Section — series-level chatbots */}
        {(s.orchestratorToolboxes ?? []).length > 0 && (
          <div className="mb-6 space-y-2">
            {(s.orchestratorToolboxes ?? []).map(tb =>
              tb.agents.map(agent => {
                const chatUrl = `/bot/${agent.id}`;
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-card"
                  >
                    <Avatar className="w-10 h-10 shrink-0" style={{ borderColor: `${agent.widgetColor || color}30` }}>
                      {agent.avatar ? <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" /> : null}
                      <AvatarFallback
                        className="text-sm font-bold"
                        style={{ backgroundColor: `${agent.widgetColor || color}20`, color: agent.widgetColor || color }}
                      >
                        {agent.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm">{agent.name}</h4>
                        <Badge className="text-[10px] bg-purple-500/20 text-purple-600 border-purple-500/30 no-default-hover-elevate no-default-active-elevate">
                          <Network className="w-3 h-3 mr-0.5" />
                          Hub
                        </Badge>
                      </div>
                      {agent.tagline && <p className="text-xs text-muted-foreground truncate">{agent.tagline}</p>}
                    </div>
                    <div className="shrink-0">
                      {agent.isPublic ? (
                        <Link href={chatUrl}>
                          <Button size="sm" className="text-xs gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            Chat
                          </Button>
                        </Link>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">Privat</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {s.bigIdeas.length === 0 && (s.orchestratorToolboxes ?? []).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Belum ada konten dalam series ini.</p>
          </div>
        )}

        <div className="space-y-4">
          {s.bigIdeas.map((bi, biIdx) => {
            const biExpanded = expandedBigIdeas.has(bi.id);
            const TypeIcon = typeIcons[bi.type] || Lightbulb;

            return (
              <Card key={bi.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleBigIdea(bi.id)}
                    className="w-full flex items-center gap-3 sm:gap-4 p-4 text-left hover-elevate rounded-lg"
                   
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm sm:text-base"
                      style={{ backgroundColor: color }}
                    >
                      {biIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{bi.name}</h3>
                        <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                          <TypeIcon className="w-3 h-3 mr-0.5" />
                          {typeLabels[bi.type] || bi.type}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{bi.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{bi.toolboxes.length} toolbox</span>
                        <span>{bi.toolboxes.reduce((sum, tb) => sum + tb.agents.length, 0)} chatbot</span>
                        {bi.targetAudience && <span>Target: {bi.targetAudience}</span>}
                      </div>
                    </div>
                    {biExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {biExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {bi.goals && (bi.goals as string[]).length > 0 && (
                        <div className="pl-14 sm:pl-16">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Tujuan:</p>
                          <div className="flex flex-wrap gap-1">
                            {(bi.goals as string[]).map((goal, i) => (
                              <span key={i} className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {bi.toolboxes.map((tb, tbIdx) => {
                        const tbExpanded = expandedToolboxes.has(tb.id);

                        return (
                          <div key={tb.id} className="pl-6 sm:pl-8">
                            <button
                              onClick={() => toggleToolbox(tb.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg border text-left hover-elevate"
                             
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                                style={{ backgroundColor: `${color}15`, color }}
                              >
                                {biIdx + 1}.{tbIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm truncate">{tb.name}</h4>
                                  <span className="text-[10px] text-muted-foreground">
                                    {tb.agents.length} chatbot
                                  </span>
                                </div>
                                {tb.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tb.description}</p>
                                )}
                              </div>
                              {tbExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                            </button>

                            {tbExpanded && tb.agents.length > 0 && (
                              <div className="mt-2 pl-4 sm:pl-6 space-y-2">
                                {tb.agents.map((agent) => {
                                  const chatUrl = `/bot/${agent.id}`;

                                  return (
                                    <div
                                      key={agent.id}
                                      className="flex items-center gap-3 p-3 rounded-lg border"
                                     
                                    >
                                      <Avatar className="w-9 h-9 shrink-0" style={{ borderColor: `${agent.widgetColor || color}30` }}>
                                        {agent.avatar ? (
                                          <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" />
                                        ) : null}
                                        <AvatarFallback
                                          className="text-xs font-semibold"
                                          style={{
                                            backgroundColor: `${agent.widgetColor || color}15`,
                                            color: agent.widgetColor || color,
                                          }}
                                        >
                                          {agent.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>

                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-sm truncate">{agent.name}</h5>
                                        {agent.tagline && (
                                          <p className="text-[11px] text-muted-foreground truncate">{agent.tagline}</p>
                                        )}
                                        {agent.category && (
                                          <span className="text-[10px] text-muted-foreground">{agent.category}</span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {agent.isPublic ? (
                                          <Link href={chatUrl}>
                                            <Button size="sm" className="text-xs gap-1">
                                              <MessageCircle className="w-3.5 h-3.5" />
                                              Chat
                                            </Button>
                                          </Link>
                                        ) : (
                                          <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                                            Privat
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {tb.agents.length === 0 && (
                                  <p className="text-xs text-muted-foreground text-center py-3">
                                    Belum ada chatbot di toolbox ini.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {bi.toolboxes.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3 pl-14 sm:pl-16">
                          Belum ada chatbot di Modul ini.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(s.tags as string[])?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {(s.tags as string[]).map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t mt-8 py-6 text-center text-sm text-muted-foreground">
        Powered by <a href="/" className="font-medium hover:underline">Gustafta</a>
      </footer>
    </div>
  );
}
