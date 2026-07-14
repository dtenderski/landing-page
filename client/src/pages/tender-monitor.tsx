import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Search, RefreshCw, ExternalLink, Building2,
  Flame, Mountain, Zap, Globe, MapPin, Calendar, DollarSign,
  TrendingUp, Clock, Filter, ChevronRight,
  PlayCircle, Info, Database, Loader2, Star, Layers,
  BarChart3, Bell, Bot, Brain
} from "lucide-react";
import type { TenderSource, Tender } from "@shared/schema";

// ── Types & Constants ─────────────────────────────────────────────────────────

type SourceType = "all" | "sirup" | "lpse_pusat" | "lpse_provinsi" | "lpse_kabkota" | "bumn" | "asing";
type Sector = "all" | "konstruksi" | "oil_gas" | "pertambangan" | "energi" | "umum";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  all: "Semua Sumber",
  sirup: "SIRUP Nasional",
  lpse_pusat: "LPSE Pusat",
  lpse_provinsi: "LPSE Provinsi",
  lpse_kabkota: "LPSE Kab/Kota",
  bumn: "BUMN",
  asing: "Perusahaan Asing",
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  sirup:       "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700",
  lpse_pusat:  "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700",
  lpse_provinsi:"bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700",
  lpse_kabkota:"bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-700",
  bumn:        "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700",
  asing:       "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700",
};

const SECTOR_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  all:          { label: "Semua Sektor",  icon: Globe,     color: "text-foreground",                      bg: "bg-muted" },
  konstruksi:   { label: "Konstruksi",    icon: Building2, color: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800" },
  oil_gas:      { label: "Oil & Gas",     icon: Flame,     color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  pertambangan: { label: "Pertambangan",  icon: Mountain,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40" },
  energi:       { label: "Energi",        icon: Zap,       color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/40" },
  umum:         { label: "Umum",          icon: Globe,     color: "text-gray-500 dark:text-gray-400",     bg: "bg-gray-50 dark:bg-gray-900" },
};

const STATUS_COLORS: Record<string, string> = {
  "Pengumuman Tender":                  "bg-green-100  text-green-700  dark:bg-green-950/50  dark:text-green-300",
  "Pendaftaran & Pengambilan Dokumen":  "bg-blue-100   text-blue-700   dark:bg-blue-950/50   dark:text-blue-300",
  "Pemasukan Dokumen Penawaran":        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  "Evaluasi Penawaran":                 "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
  "Pengumuman Pemenang":                "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  "Aktif":                              "bg-green-100  text-green-700  dark:bg-green-950/50  dark:text-green-300",
};

// ── SIRUP Banner — top CTA for UKM ────────────────────────────────────────────

function SirupBanner({
  sirupSource,
  onScrape,
  isScraping,
}: {
  sirupSource: any | null;
  onScrape: (id: number) => void;
  isScraping: boolean;
}) {
  if (!sirupSource) return null;
  return (
    <div className="mb-5 p-4 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
            <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">SIRUP LKPP — Agregator Nasional (Terbuka Penuh)</h3>
              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white border-0">Direkomendasikan untuk UKM</Badge>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-2xl">
              <strong>Satu tombol → data dari seluruh 514 Kab/Kota Indonesia.</strong> SIRUP (Sistem Informasi Rencana Umum Pengadaan) adalah API
              publik resmi LKPP yang dapat diakses tanpa autentikasi. Setiap paket mencantumkan <strong>kualifikasi usaha</strong> (Kecil/Menengah/Besar),
              sehingga UKM dapat langsung memfilter paket yang sesuai kemampuan.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex-wrap">
              {sirupSource.lastScrapedAt && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Update terakhir: {new Date(sirupSource.lastScrapedAt).toLocaleDateString("id-ID")}</span>
              )}
              {sirupSource.totalTenders > 0 && (
                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {sirupSource.totalTenders} paket tersimpan</span>
              )}
              <a href="https://sirup.lkpp.go.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">
                <ExternalLink className="w-3 h-3" /> sirup.lkpp.go.id
              </a>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          onClick={() => onScrape(sirupSource.id)}
          disabled={isScraping}
          data-testid="button-scrape-sirup"
        >
          {isScraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
          {isScraping ? "Mengambil data…" : "Ambil Data SIRUP"}
        </Button>
      </div>
    </div>
  );
}

// ── Source Card ───────────────────────────────────────────────────────────────

function SourceCard({
  source, onScrape, isScraping,
}: {
  source: any;
  onScrape: (id: number) => void;
  isScraping: boolean;
}) {
  const st = source.sourceType || "lpse_pusat";
  const sector = source.sector || "konstruksi";
  const SectorIcon = SECTOR_CONFIG[sector]?.icon || Globe;
  const isRestricted = st === "bumn" || st === "asing";
  const isSirup = st === "sirup";

  return (
    <Card className={`border transition-all hover:shadow-sm ${isScraping ? "opacity-70" : ""} ${isSirup ? "border-emerald-300 dark:border-emerald-700" : ""}`} data-testid={`card-source-${source.id}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Badge className={`text-[10px] px-1.5 py-0 border ${SOURCE_TYPE_COLORS[st] || "bg-gray-100 text-gray-700"}`}>
                {SOURCE_TYPE_LABELS[st] || st}
              </Badge>
              {isRestricted && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-400">Demo</Badge>}
              {isSirup && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white border-0">Terbuka</Badge>}
            </div>
            <p className="font-medium text-sm truncate">{source.name}</p>
            {source.region && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" /><span>{source.region}</span>
              </div>
            )}
          </div>
          <div className={`p-1.5 rounded-md shrink-0 ${SECTOR_CONFIG[sector]?.bg || "bg-muted"}`}>
            <SectorIcon className={`w-4 h-4 ${SECTOR_CONFIG[sector]?.color || ""}`} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {source.totalTenders ? (
              <span className="flex items-center gap-0.5"><Database className="w-3 h-3" />{source.totalTenders}</span>
            ) : (
              <span className="text-muted-foreground/50 text-[10px]">Belum di-scrape</span>
            )}
            {source.lastScrapedAt && (
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(source.lastScrapedAt).toLocaleDateString("id-ID")}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <a href={source.baseUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-source-${source.id}`}>
              <Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="w-3 h-3" /></Button>
            </a>
            <Button
              size="sm" variant={isRestricted ? "outline" : "secondary"}
              className={`h-6 text-xs px-2 ${isSirup ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 border-0" : ""}`}
              onClick={() => onScrape(source.id)}
              disabled={isScraping}
              data-testid={`button-scrape-${source.id}`}
            >
              {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tender Card ───────────────────────────────────────────────────────────────

function TenderCard({ tender }: { tender: any }) {
  const sector = tender.sector || "konstruksi";
  const sType = tender.sourceType || "lpse_pusat";
  const SectorIcon = SECTOR_CONFIG[sector]?.icon || Globe;
  const isDemo = tender.rawData?.demo === true;
  const isSirup = tender.rawData?.sirup === true;
  const kualifikasi = tender.rawData?.kualifikasi || "";
  const statusColor = STATUS_COLORS[tender.status || ""] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

  return (
    <Card
      className={`border transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 ${isDemo ? "border-dashed opacity-80" : ""} ${isSirup ? "hover:border-emerald-300 dark:hover:border-emerald-700" : ""}`}
      data-testid={`card-tender-${tender.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md shrink-0 mt-0.5 ${SECTOR_CONFIG[sector]?.bg}`}>
            <SectorIcon className={`w-4 h-4 ${SECTOR_CONFIG[sector]?.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <Badge className={`text-[10px] px-1.5 py-0 border ${SOURCE_TYPE_COLORS[sType] || ""}`}>
                    {SOURCE_TYPE_LABELS[sType] || sType}
                  </Badge>
                  {kualifikasi && (
                    <Badge className={`text-[10px] px-1.5 py-0 border ${kualifikasi.includes("Kecil") ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                      {kualifikasi}
                    </Badge>
                  )}
                  {isDemo && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-400">Contoh</Badge>}
                  {tender.status && (
                    <span className={`inline-flex items-center px-1.5 py-0 text-[10px] rounded-sm font-medium ${statusColor}`}>
                      {tender.status.length > 32 ? tender.status.substring(0, 30) + "…" : tender.status}
                    </span>
                  )}
                </div>
                <p className="font-medium text-sm leading-snug">{tender.name.replace("[DEMO] ", "")}</p>
              </div>
              {tender.url && (
                <a href={tender.url} target="_blank" rel="noopener noreferrer" data-testid={`link-tender-${tender.id}`}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><ExternalLink className="w-3 h-3" /></Button>
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              {tender.agency && (
                <div className="flex items-center gap-1 col-span-2">
                  <Building2 className="w-3 h-3 shrink-0" /><span className="truncate">{tender.agency}</span>
                </div>
              )}
              {tender.budget && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 shrink-0" />
                  <span className="truncate font-medium text-foreground">{tender.budget}</span>
                </div>
              )}
              {tender.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{tender.location}</span>
                </div>
              )}
              {tender.publishDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" /><span>{tender.publishDate}</span>
                </div>
              )}
              {tender.deadlineDate && (
                <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
                  <Clock className="w-3 h-3 shrink-0" /><span>Deadline: {tender.deadlineDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenderMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSourceType, setActiveSourceType] = useState<SourceType>("all");
  const [activeSector, setActiveSector] = useState<Sector>("all");
  const [search, setSearch] = useState("");
  const [scrapingIds, setScrapingIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"feed" | "sources">("feed");

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const { data: sources = [], isLoading: sourcesLoading, refetch: refetchSources } = useQuery<TenderSource[]>({
    queryKey: ["/api/tender-sources"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: tenders = [], isLoading: tendersLoading, refetch: refetchTenders } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
    queryFn: () => fetch("/api/tenders?limit=200", { credentials: "include" }).then(r => r.ok ? r.json() : []),
    staleTime: 2 * 60 * 1000,
  });

  // ── Scrape Action ─────────────────────────────────────────────────────────

  const scrapeMutation = useMutation({
    mutationFn: (sourceId: number) =>
      apiRequest("POST", `/api/tender-sources/${sourceId}/scrape`, {}),
    onMutate: (sourceId) => {
      setScrapingIds(prev => new Set(Array.from(prev).concat(sourceId)));
    },
    onSuccess: (data: any, sourceId) => {
      setScrapingIds(prev => { const s = new Set(prev); s.delete(sourceId); return s; });
      const result = (data && typeof data === "object" && !data.json) ? data : {};
      if (result.success) {
        toast({
          title: "Berhasil",
          description: result.message || "Data tender diperbarui",
        });
      } else if (result.message) {
        toast({
          title: "Selesai (parsial)",
          description: result.message,
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tender-sources"] });
    },
    onError: (err: any, sourceId) => {
      setScrapingIds(prev => { const s = new Set(prev); s.delete(sourceId); return s; });
      const msg = err?.message || "Gagal mengakses sumber";
      if (!msg.includes("401")) {
        toast({ title: "Sumber tidak terjangkau", description: msg.slice(0, 120), variant: "destructive" });
      }
    },
  });

  async function handleScrapeAll() {
    const enabled = realSources.filter(s => (s as any).isEnabled);
    toast({ title: "Memulai scraping…", description: `${enabled.length} sumber akan diproses` });
    let ok = 0, fail = 0;
    for (const src of enabled.slice(0, 8)) {
      try {
        await scrapeMutation.mutateAsync((src as any).id);
        ok++;
      } catch {
        fail++;
      }
      await new Promise(r => setTimeout(r, 400));
    }
    if (ok + fail > 1) {
      toast({
        title: fail === 0 ? "Scraping selesai" : `Scraping selesai (${fail} gagal)`,
        description: `${ok} sumber berhasil diproses`,
        variant: fail > 0 ? "destructive" : "default",
      });
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const realSources = useMemo(() =>
    (sources as any[]).filter(s => !s.name?.includes("[TENDER_SOURCES") && s.isEnabled !== false)
  , [sources]);

  const sirupSource = useMemo(() =>
    realSources.find((s: any) => s.sourceType === "sirup") || null
  , [realSources]);

  const visibleSources = useMemo(() => {
    return realSources.filter((s: any) => {
      if (activeSourceType !== "all" && s.sourceType !== activeSourceType) return false;
      if (activeSector !== "all" && s.sector !== activeSector && s.sector !== "multiple") return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.region?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [realSources, activeSourceType, activeSector, search]);

  const visibleTenders = useMemo(() => {
    return (tenders as any[]).filter(t => {
      if (activeSourceType !== "all" && t.sourceType !== activeSourceType) return false;
      if (activeSector !== "all" && t.sector !== activeSector) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !(t.agency || "").toLowerCase().includes(q) && !(t.location || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tenders, activeSourceType, activeSector, search]);

  const stats = useMemo(() => ({
    totalSources: realSources.length,
    sirup:        realSources.filter((s: any) => s.sourceType === "sirup").length,
    lpse:         realSources.filter((s: any) => s.sourceType?.startsWith("lpse")).length,
    kabkota:      realSources.filter((s: any) => s.sourceType === "lpse_kabkota").length,
    bumn:         realSources.filter((s: any) => s.sourceType === "bumn").length,
    asing:        realSources.filter((s: any) => s.sourceType === "asing").length,
    totalTenders: (tenders as any[]).length,
    konstruksi:   (tenders as any[]).filter((t: any) => t.sector === "konstruksi").length,
    oil_gas:      (tenders as any[]).filter((t: any) => t.sector === "oil_gas").length,
    pertambangan: (tenders as any[]).filter((t: any) => t.sector === "pertambangan").length,
    energi:       (tenders as any[]).filter((t: any) => t.sector === "energi").length,
    usahaKecil:   (tenders as any[]).filter((t: any) => t.rawData?.kualifikasi?.includes("Kecil")).length,
  }), [realSources, tenders]);

  const sourceTypes: SourceType[] = ["all", "sirup", "lpse_pusat", "lpse_provinsi", "lpse_kabkota", "bumn", "asing"];
  const sectors: Sector[] = ["all", "konstruksi", "oil_gas", "pertambangan", "energi"];

  // Group sources for sources tab
  const sourceGroups: Array<{ type: SourceType; sources: any[]; note?: string }> = [
    { type: "sirup",        sources: visibleSources.filter((s: any) => s.sourceType === "sirup"), note: "API publik LKPP — terbuka, nasional, cover semua 514 Kab/Kota" },
    { type: "lpse_pusat",   sources: visibleSources.filter((s: any) => s.sourceType === "lpse_pusat") },
    { type: "lpse_provinsi",sources: visibleSources.filter((s: any) => s.sourceType === "lpse_provinsi") },
    { type: "lpse_kabkota", sources: visibleSources.filter((s: any) => s.sourceType === "lpse_kabkota"), note: "80+ Kab/Kota prioritas UKM Kecil" },
    { type: "bumn",         sources: visibleSources.filter((s: any) => s.sourceType === "bumn"), note: "Portal tertutup — data contoh ditampilkan" },
    { type: "asing",        sources: visibleSources.filter((s: any) => s.sourceType === "asing"), note: "Portal tertutup — data contoh ditampilkan" },
  ].filter((g): g is { type: SourceType; sources: any[]; note?: string } => g.sources.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h1 className="text-lg font-bold">Tender Monitor</h1>
                <Badge variant="outline" className="text-xs">Multi-Sumber</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                SIRUP Nasional · LPSE Pusat · LPSE Provinsi · LPSE Kab/Kota (80+) · BUMN · Asing &nbsp;·&nbsp;
                Konstruksi · Oil&Gas · Pertambangan · Energi
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <Link href="/tender-ai">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-8 border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" data-testid="button-nav-tendera">
                  <Bot className="w-3.5 h-3.5" />TENDERA AI
                </Button>
              </Link>
              <Link href="/brain-project">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-8 border-indigo-500/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" data-testid="button-nav-brain-project">
                  <Brain className="w-3.5 h-3.5" />Brain Project
                </Button>
              </Link>
              <Link href="/win-probability">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-8 border-purple-500/40 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40" data-testid="button-nav-winprob">
                  <BarChart3 className="w-3.5 h-3.5" />Win Prob
                </Button>
              </Link>
              <Link href="/bujk-profile">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-8 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" data-testid="button-nav-bujk">
                  <Building2 className="w-3.5 h-3.5" />Profil BUJK
                </Button>
              </Link>
              <Link href="/tender-alert">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-8 border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40" data-testid="button-nav-alert">
                  <Bell className="w-3.5 h-3.5" />Alert
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => { refetchSources(); refetchTenders(); }} data-testid="button-refresh-all" className="gap-1 text-xs h-8">
                <RefreshCw className="w-3.5 h-3.5" />Refresh
              </Button>
              <Button size="sm" onClick={handleScrapeAll} disabled={scrapeMutation.isPending} data-testid="button-scrape-all" className="gap-1 text-xs h-8">
                {scrapeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                Scrape Semua
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-600 font-medium"><Star className="w-3 h-3" />SIRUP: 514 Kab/Kota</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{stats.totalSources} sumber total</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{stats.kabkota} LPSE Kab/Kota</span>
            <span>·</span>
            <span className="font-medium text-foreground">{stats.totalTenders} tender</span>
            {stats.usahaKecil > 0 && <span className="text-emerald-600 font-medium">({stats.usahaKecil} Usaha Kecil)</span>}
            {stats.konstruksi > 0 && <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />{stats.konstruksi} konstruksi</span>}
            {stats.oil_gas > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="w-3 h-3" />{stats.oil_gas} oil&gas</span>}
            {stats.pertambangan > 0 && <span className="flex items-center gap-0.5 text-amber-500"><Mountain className="w-3 h-3" />{stats.pertambangan} tambang</span>}
            {stats.energi > 0 && <span className="flex items-center gap-0.5 text-yellow-500"><Zap className="w-3 h-3" />{stats.energi} energi</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* SIRUP Banner */}
        <SirupBanner
          sirupSource={sirupSource}
          onScrape={(id) => scrapeMutation.mutate(id)}
          isScraping={sirupSource ? scrapingIds.has(sirupSource.id) : false}
        />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              data-testid="input-search-tender"
              placeholder="Cari nama tender, instansi, wilayah…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 text-sm h-8"
            />
          </div>
          {/* Source Type Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {sourceTypes.map(st => (
              <button
                key={st}
                onClick={() => setActiveSourceType(st)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  activeSourceType === st
                    ? st === "sirup"
                      ? "bg-emerald-600 text-white border-transparent"
                      : "bg-foreground text-background border-transparent"
                    : "border-border hover:border-foreground/50"
                }`}
                data-testid={`filter-source-${st}`}
              >
                {SOURCE_TYPE_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {sectors.map(sec => {
            const cfg = SECTOR_CONFIG[sec];
            const Icon = cfg.icon;
            return (
              <button
                key={sec}
                onClick={() => setActiveSector(sec)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  activeSector === sec
                    ? `${cfg.bg} ${cfg.color} border-current font-medium`
                    : "border-border hover:border-current hover:bg-muted/50"
                }`}
                data-testid={`filter-sector-${sec}`}
              >
                <Icon className="w-3 h-3" />{cfg.label}
              </button>
            );
          })}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="feed" data-testid="tab-tender-feed">
              Feed Tender ({visibleTenders.length})
            </TabsTrigger>
            <TabsTrigger value="sources" data-testid="tab-tender-sources">
              Sumber ({visibleSources.length})
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed">
            {tendersLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}
              </div>
            )}
            {!tendersLoading && tenders.length === 0 && <EmptyTenderState onScrapeAll={handleScrapeAll} stats={stats} />}
            {!tendersLoading && tenders.length > 0 && visibleTenders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Tidak ada tender yang cocok dengan filter aktif.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleTenders.map((t: any) => <TenderCard key={t.id} tender={t} />)}
            </div>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources">
            {sourcesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
              </div>
            )}
            {sourceGroups.map(group => (
              <div key={group.type} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-sm">{SOURCE_TYPE_LABELS[group.type]}</h3>
                  <Badge variant="outline" className="text-xs">{group.sources.length}</Badge>
                  {group.note && (
                    <span className={`text-xs flex items-center gap-1 ${group.type === "sirup" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                      <Info className="w-3 h-3" />{group.note}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {group.sources.map((s: any) => (
                    <SourceCard
                      key={s.id}
                      source={s}
                      onScrape={(id) => scrapeMutation.mutate(id)}
                      isScraping={scrapingIds.has(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Info footer */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p><strong>SIRUP LKPP</strong> — API publik terbuka. Satu kali scrape = data seluruh Kab/Kota nasional. Field <em>kualifikasi</em> menunjukkan apakah paket untuk Usaha Kecil/Menengah/Besar.</p>
            <p><strong>LPSE Kab/Kota (80+ sumber)</strong> — Dicoba via SPSE JSON API → DataTables → HTML. Sebagian situs dilindungi Cloudflare sehingga perlu fallback demo.</p>
            <p><strong>BUMN & Asing</strong> — Portal tertutup (perlu registrasi vendor). Data contoh ditampilkan sebagai gambaran. Klik <ExternalLink className="w-3 h-3 inline" /> untuk buka portal asli.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyTenderState({ onScrapeAll, stats }: { onScrapeAll: () => void; stats: any }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base mb-2">Belum Ada Data Tender</h3>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-2">
        <strong>{stats.totalSources}+ sumber</strong> sudah dikonfigurasi — SIRUP Nasional, {stats.lpse} LPSE (termasuk {stats.kabkota} Kab/Kota), {stats.bumn} BUMN, dan {stats.asing} Perusahaan Asing.
      </p>
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-6">
        Rekomendasi UKM: mulai dari <strong>SIRUP LKPP</strong> — satu kali klik, langsung data seluruh Indonesia termasuk field "Usaha Kecil".
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button onClick={onScrapeAll} className="gap-2" data-testid="button-start-scrape">
          <PlayCircle className="w-4 h-4" />Mulai Scraping Semua Sumber
        </Button>
        <Button variant="outline" onClick={() => window.open("https://sirup.lkpp.go.id", "_blank")} className="gap-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50">
          <Star className="w-4 h-4" />Buka SIRUP Langsung
        </Button>
      </div>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
        {[
          { label: "SIRUP Nasional", sub: "514 Kab/Kota", icon: Star, color: "text-emerald-500", border: "border-emerald-300" },
          { label: "LPSE Kab/Kota", sub: `${stats.kabkota}+ sumber`, icon: MapPin, color: "text-violet-500", border: "" },
          { label: "BUMN",          sub: `${stats.bumn} sumber`,  icon: Building2, color: "text-orange-500", border: "" },
          { label: "Asing",         sub: `${stats.asing} sumber`,  icon: Globe, color: "text-rose-500", border: "" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`p-3 rounded-lg border bg-card text-center ${item.border}`}>
              <Icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
              <p className="font-medium text-xs">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
