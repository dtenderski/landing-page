import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SharedHeader } from "@/components/shared-header";
import {
  ShoppingBag,
  Search,
  Bot,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Layers,
  BookOpen,
  Crown,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeriesWithHierarchy } from "@shared/schema";

const roleLabels: Record<string, string> = {
  orchestrator: "Orkestrator",
  specialist: "Spesialis",
  standalone: "Agen",
};

const roleColors: Record<string, string> = {
  orchestrator: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  specialist: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  standalone: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function SeriesCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

interface AgentSummary {
  id: string;
  name: string;
  description: string;
  avatar: string;
  tagline: string;
  category: string;
  subcategory: string;
  isPublic: boolean;
  isActive: boolean;
  widgetColor: string;
  isOrchestrator: boolean;
  orchestratorRole: string;
}

function AgentCard({ agent }: { agent: AgentSummary }) {
  const role = agent.orchestratorRole || "standalone";
  return (
    <Link href={`/bot/${agent.id}`}>
      <div
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
        data-testid={`card-agent-${agent.id}`}
      >
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={agent.avatar || ""} alt={agent.name} />
          <AvatarFallback>
            {agent.isOrchestrator ? (
              <Crown className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate" data-testid={`text-agent-name-${agent.id}`}>
              {agent.name}
            </span>
            <Badge className={cn("text-[10px] px-1.5 py-0", roleColors[role])}>
              {role === "orchestrator" && <Crown className="h-2.5 w-2.5 mr-0.5" />}
              {roleLabels[role]}
            </Badge>
          </div>
          {agent.tagline && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {agent.tagline}
            </p>
          )}
        </div>
        <MessageSquare className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  );
}

interface ToolboxSection {
  id: string;
  name: string;
  description: string;
  isOrchestrator: boolean;
  agents: AgentSummary[];
}

function ToolboxGroup({
  toolbox,
  isExpanded,
  onToggle,
}: {
  toolbox: ToolboxSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const orchestrators = toolbox.agents.filter(a => a.orchestratorRole === "orchestrator");
  const specialists = toolbox.agents.filter(a => a.orchestratorRole === "specialist");
  const standalones = toolbox.agents.filter(a => a.orchestratorRole === "standalone" && !a.isOrchestrator);

  const sortedAgents = [...orchestrators, ...specialists, ...standalones];

  if (sortedAgents.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`toolbox-${toolbox.id}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent/30 transition-colors"
        data-testid={`button-toggle-toolbox-${toolbox.id}`}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-sm flex-1 truncate">{toolbox.name}</span>
        <Badge variant="secondary" className="text-xs">
          {sortedAgents.length} chatbot
        </Badge>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {sortedAgents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

interface BigIdeaSection {
  id: string;
  name: string;
  description: string;
  type: string;
  toolboxes: ToolboxSection[];
}

function BigIdeaGroup({
  bigIdea,
  expandedToolboxes,
  toggleToolbox,
  isExpanded,
  onToggle,
}: {
  bigIdea: BigIdeaSection;
  expandedToolboxes: Set<string>;
  toggleToolbox: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const totalAgents = bigIdea.toolboxes.reduce((sum, tb) => sum + tb.agents.length, 0);
  if (totalAgents === 0) return null;

  return (
    <div className="space-y-2" data-testid={`bigidea-${bigIdea.id}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-2 text-left rounded-md hover:bg-accent/30 transition-colors"
        data-testid={`button-toggle-bigidea-${bigIdea.id}`}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-primary flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
        )}
        <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="font-semibold text-sm flex-1">{bigIdea.name}</span>
        <Badge variant="outline" className="text-xs">
          {totalAgents} chatbot
        </Badge>
      </button>
      {isExpanded && (
        <div className="ml-6 space-y-2">
          {bigIdea.toolboxes.map(tb => (
            <ToolboxGroup
              key={tb.id}
              toolbox={tb}
              isExpanded={expandedToolboxes.has(tb.id)}
              onToggle={() => toggleToolbox(tb.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [expandedBigIdeas, setExpandedBigIdeas] = useState<Set<string>>(new Set());
  const [expandedToolboxes, setExpandedToolboxes] = useState<Set<string>>(new Set());

  const { data: seriesList = [], isLoading } = useQuery<SeriesWithHierarchy[]>({
    queryKey: ["/api/marketplace/hierarchy"],
  });

  const toggleSeries = (id: string) => {
    setExpandedSeries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    const sIds = new Set(seriesList.map(s => s.id));
    const biIds = new Set<string>();
    const tbIds = new Set<string>();
    seriesList.forEach(s => {
      const allBigIdeas = [...s.bigIdeas, ...s.cores.flatMap(c => c.bigIdeas)];
      allBigIdeas.forEach(bi => {
        biIds.add(bi.id);
        (bi as any).toolboxes?.forEach((tb: any) => tbIds.add(tb.id));
      });
      // === Include series-level orchestrator toolboxes ===
      ((s as any).orchestratorToolboxes || []).forEach((tb: any) => tbIds.add(tb.id));
    });
    setExpandedSeries(sIds);
    setExpandedBigIdeas(biIds);
    setExpandedToolboxes(tbIds);
  };

  const collapseAll = () => {
    setExpandedSeries(new Set());
    setExpandedBigIdeas(new Set());
    setExpandedToolboxes(new Set());
  };

  const filteredSeriesList = useMemo(() => {
    if (!searchQuery.trim()) return seriesList;

    const q = searchQuery.toLowerCase();
    return seriesList
      .map(s => {
        const filterBigIdeas = (bigIdeas: BigIdeaSection[]) =>
          bigIdeas
            .map(bi => {
              const filteredToolboxes = bi.toolboxes
                .map(tb => ({
                  ...tb,
                  agents: tb.agents.filter(
                    a =>
                      a.name.toLowerCase().includes(q) ||
                      a.tagline?.toLowerCase().includes(q) ||
                      a.description?.toLowerCase().includes(q) ||
                      a.category?.toLowerCase().includes(q)
                  ),
                }))
                .filter(tb => tb.agents.length > 0 || tb.name.toLowerCase().includes(q));
              return { ...bi, toolboxes: filteredToolboxes };
            })
            .filter(
              bi => bi.toolboxes.length > 0 || bi.name.toLowerCase().includes(q)
            );

        const filteredBigIdeas = filterBigIdeas(s.bigIdeas as BigIdeaSection[]);
        const filteredCores = s.cores.map(c => ({
          ...c,
          bigIdeas: filterBigIdeas(c.bigIdeas as BigIdeaSection[]),
        })).filter(c => c.bigIdeas.length > 0);

        const seriesMatches =
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.tagline?.toLowerCase().includes(q);

        if (filteredBigIdeas.length > 0 || filteredCores.length > 0 || seriesMatches) {
          return {
            ...s,
            bigIdeas: seriesMatches ? (s.bigIdeas as BigIdeaSection[]) : filteredBigIdeas,
            cores: seriesMatches ? s.cores : filteredCores,
          };
        }
        return null;
      })
      .filter(Boolean) as SeriesWithHierarchy[];
  }, [seriesList, searchQuery]);

  const totalAgents = seriesList.reduce((sum, s) => sum + (s.totalAgents || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-marketplace-title">
                Marketplace Chatbot
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              Temukan chatbot AI untuk kebutuhan Jasa Konstruksi Anda
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {seriesList.length} series
              </span>
              <span className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                {totalAgents} chatbot
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari chatbot, series, atau modul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                data-testid="button-expand-all"
              >
                Buka Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                data-testid="button-collapse-all"
              >
                Tutup Semua
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SeriesCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredSeriesList.length === 0 ? (
            <div className="text-center py-16">
              <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery
                  ? "Tidak ada chatbot yang cocok"
                  : "Belum ada chatbot tersedia"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Coba ubah kata kunci pencarian Anda"
                  : "Chatbot akan segera hadir"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  Hapus Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSeriesList.map((series) => {
                const isSeriesExpanded = expandedSeries.has(series.id);
                const allBigIdeas = [
                  ...series.bigIdeas,
                  ...series.cores.flatMap(c => c.bigIdeas),
                ] as BigIdeaSection[];

                return (
                  <Card key={series.id} data-testid={`card-series-${series.id}`}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleSeries(series.id)}
                        className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-accent/20 transition-colors rounded-t-lg"
                        data-testid={`button-toggle-series-${series.id}`}
                      >
                        {isSeriesExpanded ? (
                          <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: series.color || "#6366f1" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-base md:text-lg" data-testid={`text-series-name-${series.id}`}>
                              {series.name}
                            </h2>
                            {series.category && (
                              <Badge variant="secondary" className="text-xs">
                                {series.category}
                              </Badge>
                            )}
                          </div>
                          {series.tagline && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {series.tagline}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {series.totalBigIdeas}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5" />
                            {series.totalAgents}
                          </span>
                        </div>
                      </button>

                      {isSeriesExpanded && (allBigIdeas.length > 0 || (series as any).orchestratorToolboxes?.length > 0) && (
                        <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-2">
                          {series.description && (
                            <p className="text-sm text-muted-foreground mb-3 pl-8">
                              {series.description}
                            </p>
                          )}
                          {/* Series-level orchestrator toolboxes that bypass BigIdea */}
                          {((series as any).orchestratorToolboxes || []).map((tb: ToolboxSection) => (
                            <ToolboxGroup
                              key={tb.id}
                              toolbox={tb}
                              isExpanded={expandedToolboxes.has(tb.id)}
                              onToggle={() => toggleToolbox(tb.id)}
                            />
                          ))}
                          {allBigIdeas.map(bi => (
                            <BigIdeaGroup
                              key={bi.id}
                              bigIdea={bi}
                              expandedToolboxes={expandedToolboxes}
                              toggleToolbox={toggleToolbox}
                              isExpanded={expandedBigIdeas.has(bi.id)}
                              onToggle={() => toggleBigIdea(bi.id)}
                            />
                          ))}

                          <div className="pt-2 pl-8">
                            <Link href={`/series/${series.slug}`}>
                              <Button variant="outline" size="sm" data-testid={`button-view-series-${series.id}`}>
                                Lihat Detail Series
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Klik chatbot untuk langsung mulai percakapan
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Badge className={cn("text-[10px] px-1.5 py-0", roleColors.orchestrator)}>
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Orkestrator
                </Badge>
                Hub pengarah utama
              </span>
              <span className="flex items-center gap-1.5">
                <Badge className={cn("text-[10px] px-1.5 py-0", roleColors.specialist)}>
                  Spesialis
                </Badge>
                Ahli bidang tertentu
              </span>
              <span className="flex items-center gap-1.5">
                <Badge className={cn("text-[10px] px-1.5 py-0", roleColors.standalone)}>
                  Agen
                </Badge>
                Chatbot mandiri
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
