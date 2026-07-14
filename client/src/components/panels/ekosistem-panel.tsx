import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMultiClaw } from "@/contexts/multiclaw-context";
import {
  BookOpen, GraduationCap, FileText, Sparkles, ExternalLink, Download,
  ArrowRight, Bot, Layers, Zap, BookMarked, ChevronRight, Globe, Brain, Eye,
  Network, Loader2, CheckCircle2, GitBranch, ListOrdered,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EkosistemPanelProps {
  agent: any;
}

interface ProductCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
  badgeVariant: "available" | "new" | "bridge";
  actions: { label: string; icon: React.ReactNode; onClick: () => void; primary?: boolean }[];
  stats?: string;
}

export function EkosistemPanel({ agent }: EkosistemPanelProps) {
  const { toast } = useToast();
  const { studioCtx, setEkosistemCtx } = useMultiClaw();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [mcOpen, setMcOpen] = useState(false);
  const [mcResult, setMcResult] = useState<any>(null);
  const [mcRevealedStages, setMcRevealedStages] = useState(0);
  const [mcTab, setMcTab] = useState("ebook-agent");

  const mcMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/ekosistem-multiclaw", { agentId: agent?.id });
      return res.json();
    },
    onSuccess: (data) => {
      setMcResult(data);
      setMcTab("ebook-agent");
      let count = 0;
      const iv = setInterval(() => {
        count++;
        setMcRevealedStages(count);
        if (count >= 4) clearInterval(iv);
      }, 600);
      // Save to cross-panel context
      const ebook = data.stages?.find((s: any) => s.id === "ebook-agent")?.result;
      const ecourse = data.stages?.find((s: any) => s.id === "ecourse-agent")?.result;
      const docgen = data.stages?.find((s: any) => s.id === "docgen-agent")?.result;
      setEkosistemCtx({
        agentName: agent?.name || "Chatbot",
        ebookTitle: ebook?.title || "",
        ecourseTitle: ecourse?.courseTitle || "",
        docgenCount: docgen?.templates?.length || 0,
        savedAt: new Date().toISOString(),
      });
    },
    onError: () => {
      toast({ title: "MultiClaw Gagal", description: "Gagal menjalankan Ekosistem MultiClaw", variant: "destructive" });
    },
  });

  const { data: kbs = [] } = useQuery<any[]>({
    queryKey: [`/api/knowledge-base/${agent?.id}`],
    enabled: !!agent?.id,
  });
  const { data: miniApps = [] } = useQuery<any[]>({
    queryKey: [`/api/mini-apps/${agent?.id}`],
    enabled: !!agent?.id,
  });

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <Bot className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Pilih chatbot dari sidebar untuk melihat Ekosistem Kompetensi.</p>
      </div>
    );
  }

  function openProduct(id: string, path: string, newTab = true) {
    setOpeningId(id);
    const url = `/api/agents/${agent.id}/export/${path}`;
    if (newTab) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
    setTimeout(() => setOpeningId(null), 1500);
    toast({ title: "Membuka produk...", description: `Generating ${id} untuk ${agent.name}` });
  }

  function downloadProduct(id: string, path: string, ext: string) {
    setOpeningId(id + "-dl");
    const url = `/api/agents/${agent.id}/export/${path}?inline=0`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(agent.name || "chatbot").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setOpeningId(null), 1500);
    toast({ title: "Mengunduh...", description: `Download ${id} sedang diproses.` });
  }

  const kbCount = Array.isArray(kbs) ? kbs.length : 0;
  const miniAppCount = Array.isArray(miniApps) ? miniApps.length : 0;
  const starterCount = Array.isArray(agent.conversationStarters) ? agent.conversationStarters.length :
    (typeof agent.conversationStarters === "string" ? agent.conversationStarters.split(/\n|,/).filter(Boolean).length : 0);

  const products: ProductCard[] = [
    {
      id: "ebook",
      title: "eBook Kompetensi",
      subtitle: "8 Bab Terstruktur",
      description: "Dokumentasikan keahlian chatbot menjadi buku panduan profesional: Profil, Persona, Kebijakan, Knowledge Base, SOP, Mini Apps, FAQ, dan Lampiran.",
      icon: <BookOpen className="w-6 h-6" />,
      color: "orange",
      badge: "Tersedia",
      badgeVariant: "available",
      stats: `${kbCount} Materi · ${starterCount} FAQ`,
      actions: [
        {
          label: "Buka & Cetak PDF",
          icon: <BookOpen className="w-4 h-4" />,
          onClick: () => openProduct("ebook", "ebook?format=html"),
          primary: true,
        },
        {
          label: "Excel (.xlsx)",
          icon: <Download className="w-4 h-4" />,
          onClick: () => downloadProduct("ebook-xlsx", "ebook?format=xlsx", "xlsx"),
        },
        {
          label: "Teks (.txt)",
          icon: <Download className="w-4 h-4" />,
          onClick: () => downloadProduct("ebook-txt", "ebook?format=txt", "txt"),
        },
        {
          label: "Landing Page",
          icon: <Eye className="w-4 h-4" />,
          onClick: () => window.open(`/product/${agent.id}/ebook`, "_blank"),
        },
      ],
    },
    {
      id: "ecourse",
      title: "eCourse Modul Belajar",
      subtitle: "Platform Pembelajaran Digital",
      description: "Konversi knowledge base chatbot menjadi modul e-learning interaktif: Modul per kategori, sesi per materi, soal latihan dari conversation starters, dan alat bantu praktik.",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "violet",
      badge: "Baru",
      badgeVariant: "new",
      stats: `${kbCount} Sesi · ${Math.min(starterCount, 10)} Latihan`,
      actions: [
        {
          label: "Generate & Buka",
          icon: <GraduationCap className="w-4 h-4" />,
          onClick: () => openProduct("ecourse", "ecourse"),
          primary: true,
        },
        {
          label: "Download HTML",
          icon: <Download className="w-4 h-4" />,
          onClick: () => downloadProduct("ecourse", "ecourse", "html"),
        },
        {
          label: "Landing Page",
          icon: <Eye className="w-4 h-4" />,
          onClick: () => window.open(`/product/${agent.id}/ecourse`, "_blank"),
        },
      ],
    },
    {
      id: "docgen",
      title: "Generator Dokumen",
      subtitle: "Template Dokumen Profesional",
      description: "Hasilkan template dokumen kerja yang relevan: SOP, checklist, formulir, laporan, rencana kerja — otomatis disesuaikan dengan domain keahlian chatbot.",
      icon: <FileText className="w-6 h-6" />,
      color: "emerald",
      badge: "Baru",
      badgeVariant: "new",
      stats: `${kbCount} Konten · Template Otomatis`,
      actions: [
        {
          label: "Generate & Buka",
          icon: <FileText className="w-4 h-4" />,
          onClick: () => openProduct("docgen", "docgen"),
          primary: true,
        },
        {
          label: "Download HTML",
          icon: <Download className="w-4 h-4" />,
          onClick: () => downloadProduct("docgen", "docgen", "html"),
        },
        {
          label: "Landing Page",
          icon: <Eye className="w-4 h-4" />,
          onClick: () => window.open(`/product/${agent.id}/docgen`, "_blank"),
        },
      ],
    },
    {
      id: "chaesa",
      title: "Chaesa AI Studio",
      subtitle: "Platform eBook & Ekosistem Lanjutan",
      description: "Transfer chatbot ke Chaesa AI Studio untuk membuat panduan digital lanjutan, artikel, whitepaper, dan modul pelatihan yang lebih kaya dengan AI prompt generator 24 industri.",
      icon: <BookMarked className="w-6 h-6" />,
      color: "blue",
      badge: "Bridge",
      badgeVariant: "bridge",
      stats: "24 Industri · Multi-Format",
      actions: [
        {
          label: "Export Bundle Chaesa",
          icon: <Download className="w-4 h-4" />,
          onClick: () => downloadProduct("chaesa", "chaesa?download=1", "json"),
          primary: true,
        },
        {
          label: "Buka Chaesa Studio",
          icon: <ExternalLink className="w-4 h-4" />,
          onClick: () => window.open("https://smart-ebook-builder-7-1.replit.app/", "_blank"),
        },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; badge: string; icon: string; btn: string; btnHover: string }> = {
    orange: {
      bg: "from-orange-50/50 to-transparent dark:from-orange-950/20",
      border: "border-orange-400/40",
      badge: "bg-orange-500",
      icon: "bg-orange-500/10 text-orange-600",
      btn: "bg-orange-600 hover:bg-orange-700 text-white",
      btnHover: "",
    },
    violet: {
      bg: "from-violet-50/50 to-transparent dark:from-violet-950/20",
      border: "border-violet-400/40",
      badge: "bg-violet-500",
      icon: "bg-violet-500/10 text-violet-600",
      btn: "bg-violet-600 hover:bg-violet-700 text-white",
      btnHover: "",
    },
    emerald: {
      bg: "from-emerald-50/50 to-transparent dark:from-emerald-950/20",
      border: "border-emerald-400/40",
      badge: "bg-emerald-500",
      icon: "bg-emerald-500/10 text-emerald-600",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      btnHover: "",
    },
    blue: {
      bg: "from-blue-50/50 to-transparent dark:from-blue-950/20",
      border: "border-blue-400/40",
      badge: "bg-blue-500",
      icon: "bg-blue-500/10 text-blue-600",
      btn: "bg-blue-600 hover:bg-blue-700 text-white",
      btnHover: "",
    },
  };

  return (
    <>
    <div className="space-y-6 pb-8">

      {/* ── Cross-panel Banner: Studio → Ekosistem ── */}
      {studioCtx && (
        <div className="flex items-start gap-3 p-3 mx-0 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800" data-testid="banner-studio-context">
          <GitBranch className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-orange-800 dark:text-orange-200">MultiClaw Context dari Studio Kompetensi</p>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">
              <strong>{studioCtx.proposalName}</strong> · Kualitas {studioCtx.qualityBefore}→{studioCtx.qualityAfter} · +{studioCtx.additionalChunks} KB chunk
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-700 whitespace-nowrap shrink-0">Studio ✓</Badge>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold opacity-80 uppercase tracking-widest mb-3">
            <Zap className="w-3.5 h-3.5" />
            Ekosistem Kompetensi Digital
          </div>
          <h1 className="text-2xl font-extrabold leading-tight mb-2">
            Dari Chatbot, Lahirkan<br />
            <span className="text-yellow-300">Ekosistem Digital</span>
          </h1>
          <p className="text-sm opacity-85 max-w-md mb-4">
            Chatbot adalah fondasi. Transfer kompetensi {agent.name} menjadi panduan digital, e-course, generator dokumen, dan lebih banyak produk digital yang bekerja 24 jam.
          </p>

          {/* MultiClaw button */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              onClick={() => {
                setMcResult(null);
                setMcRevealedStages(0);
                setMcOpen(true);
                mcMutation.mutate();
              }}
              disabled={mcMutation.isPending}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 text-sm"
              data-testid="button-ekosistem-multiclaw"
            >
              {mcMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menjalankan 4 Agent...</>
              ) : (
                <><Network className="w-4 h-4" /> Generate Semua Produk (MultiClaw)</>
              )}
            </Button>
          </div>

          {/* Foundation pill */}
          <div className="inline-flex items-center gap-3 bg-white/15 border border-white/25 rounded-xl px-4 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs opacity-70">Sumber: Chatbot</div>
              <div className="font-bold text-sm">{agent.name}</div>
            </div>
            <div className="flex items-center gap-3 ml-2 border-l border-white/20 pl-3 text-xs opacity-75">
              {kbCount > 0 && <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{kbCount} KB</span>}
              {miniAppCount > 0 && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{miniAppCount} Apps</span>}
              {starterCount > 0 && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{starterCount} FAQ</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Flow indicator */}
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold px-3">
          <Bot className="w-3.5 h-3.5 text-indigo-500" />
          Transfer ke 4 Produk Digital
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      {/* Product cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {products.map((product) => {
          const c = colorMap[product.color];
          const isLoading = openingId === product.id || openingId === product.id + "-dl";
          return (
            <Card
              key={product.id}
              className={`border bg-gradient-to-br ${c.bg} ${c.border} transition-all hover:shadow-md`}
              data-testid={`card-product-${product.id}`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                    {product.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-foreground text-base">{product.title}</h3>
                      <Badge className={`${c.badge} text-white text-[10px] px-2`}>
                        {product.badge}
                      </Badge>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground">{product.subtitle}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>

                {/* Stats */}
                {product.stats && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-background/60 rounded-lg px-3 py-1.5 border border-border/50">
                    <Globe className="w-3 h-3" />
                    {product.stats}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {product.actions.map((action, ai) => (
                    ai === 0 ? (
                      <Button
                        key={ai}
                        onClick={action.onClick}
                        disabled={isLoading}
                        className={`w-full ${c.btn}`}
                        data-testid={`button-${product.id}-primary`}
                      >
                        {isLoading && ai === 0 ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            {action.icon}
                            {action.label}
                            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                          </span>
                        )}
                      </Button>
                    ) : (
                      <Button
                        key={ai}
                        variant="outline"
                        size="sm"
                        onClick={action.onClick}
                        disabled={isLoading}
                        className="w-full text-xs"
                        data-testid={`button-${product.id}-action-${ai}`}
                      >
                        {action.icon}
                        <span className="ml-1.5">{action.label}</span>
                      </Button>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info section */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Cara Terbaik Menggunakan Ekosistem
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-500/15 text-orange-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
            <span><strong className="text-foreground">Perkaya Knowledge Base</strong> — Tambahkan materi ke KB chatbot ini, semakin banyak materi semakin kaya semua produk yang dihasilkan.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-500/15 text-violet-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
            <span><strong className="text-foreground">Generate eBook dulu</strong> — Mulai dari eBook sebagai fondasi dokumentasi, lalu transfer ke produk lain.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
            <span><strong className="text-foreground">eCourse untuk Pelatihan</strong> — Gunakan e-course untuk onboarding tim atau pelatihan pelanggan berbasis kompetensi chatbot.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">4</span>
            <span><strong className="text-foreground">Bridge ke Chaesa</strong> — Export bundle ke Chaesa AI Studio untuk membuat panduan digital lanjutan yang lebih kompleks.</span>
          </div>
        </div>
      </div>
    </div>

      {/* ── Ekosistem MultiClaw Dialog ── */}
      <Dialog open={mcOpen} onOpenChange={(o) => { if (!mcMutation.isPending) setMcOpen(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-indigo-600" />
            Generate Semua Produk (MultiClaw)
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 text-xs font-semibold">4 Agent Paralel</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 4 parallel agent cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "ebook-agent", name: "Panduan Digital Agent", icon: <BookOpen className="w-4 h-4" />, color: "orange" },
              { id: "ecourse-agent", name: "eCourse Agent", icon: <GraduationCap className="w-4 h-4" />, color: "violet" },
              { id: "docgen-agent", name: "DocGen Agent", icon: <FileText className="w-4 h-4" />, color: "emerald" },
              { id: "chaesa-agent", name: "Chaesa Bridge Agent", icon: <BookMarked className="w-4 h-4" />, color: "blue" },
            ].map((ag, i) => {
              const isRevealed = mcRevealedStages > i;
              const isRunning = mcMutation.isPending;
              const colorMap: any = {
                orange: "border-orange-300 bg-orange-50/60 dark:border-orange-700 dark:bg-orange-950/20",
                violet: "border-violet-300 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-950/20",
                emerald: "border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20",
                blue: "border-blue-300 bg-blue-50/60 dark:border-blue-700 dark:bg-blue-950/20",
              };
              const iconMap: any = {
                orange: "bg-orange-100 text-orange-600",
                violet: "bg-violet-100 text-violet-600",
                emerald: "bg-emerald-100 text-emerald-600",
                blue: "bg-blue-100 text-blue-600",
              };
              return (
                <button
                  key={ag.id}
                  onClick={() => isRevealed && setMcTab(ag.id)}
                  disabled={!isRevealed}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                    isRevealed ? `${colorMap[ag.color]} ${mcTab === ag.id ? "ring-2 ring-offset-1" : "hover:opacity-90"}` : "border-border bg-muted/30 opacity-50 cursor-default"
                  }`}
                  data-testid={`ekosistem-stage-${ag.id}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isRevealed ? iconMap[ag.color] : "bg-muted text-muted-foreground"}`}>
                    {isRunning && !isRevealed ? <Loader2 className="w-4 h-4 animate-spin" /> : isRevealed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : ag.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{ag.name}</p>
                    <p className="text-[10px] text-muted-foreground">{isRevealed ? "Selesai ✓" : isRunning ? "Generating…" : "Menunggu"}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {!mcResult && (
            <p className="text-xs text-center text-muted-foreground">
              {mcMutation.isPending ? "4 agent berjalan paralel, mohon tunggu…" : "Klik tombol di header untuk memulai MultiClaw."}
            </p>
          )}

          {/* Result Tabs */}
          {mcResult && (
            <Tabs value={mcTab} onValueChange={setMcTab}>
              <TabsList className="grid grid-cols-4 h-8">
                <TabsTrigger value="ebook-agent" className="text-[10px]">Panduan</TabsTrigger>
                <TabsTrigger value="ecourse-agent" className="text-[10px]">eCourse</TabsTrigger>
                <TabsTrigger value="docgen-agent" className="text-[10px]">DocGen</TabsTrigger>
                <TabsTrigger value="chaesa-agent" className="text-[10px]">Chaesa</TabsTrigger>
              </TabsList>

              {mcResult.stages?.map((stage: any) => (
                <TabsContent key={stage.id} value={stage.id} className="space-y-3 mt-3">
                  {stage.id === "ebook-agent" && stage.result && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200">
                        <p className="font-bold text-sm text-orange-900 dark:text-orange-200">{stage.result.title}</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">{stage.result.subtitle} · {stage.result.targetReader}</p>
                      </div>
                      {stage.result.chapters?.map((ch: any) => (
                        <div key={ch.number} className="p-2.5 rounded-lg border text-xs">
                          <p className="font-semibold mb-1">Bab {ch.number}: {ch.title}</p>
                          <p className="text-muted-foreground mb-1">{ch.description}</p>
                          <ul className="space-y-0.5">{ch.keyPoints?.map((kp: string, j: number) => <li key={j} className="flex gap-1.5"><span className="text-orange-500 shrink-0">•</span>{kp}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {stage.id === "ecourse-agent" && stage.result && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200">
                        <p className="font-bold text-sm text-violet-900 dark:text-violet-200">{stage.result.courseTitle}</p>
                        <p className="text-xs text-violet-700 dark:text-violet-300">{stage.result.duration} · {stage.result.targetLearner}</p>
                      </div>
                      {stage.result.modules?.map((m: any) => (
                        <div key={m.number} className="p-2.5 rounded-lg border text-xs">
                          <p className="font-semibold mb-1">Modul {m.number}: {m.title}</p>
                          <p className="text-muted-foreground text-[10px] mb-1">Outcome: {m.learningOutcome}</p>
                          <ul className="space-y-0.5">{m.sessions?.map((s: string, j: number) => <li key={j} className="flex gap-1.5"><span className="text-violet-500 shrink-0">•</span>{s}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {stage.id === "docgen-agent" && stage.result && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Dokumen Utama: {stage.result.primaryDoc}</p>
                      {stage.result.templates?.map((t: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg border text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{t.name}</p>
                            <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                          </div>
                          <p className="text-muted-foreground">{t.purpose}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {stage.id === "chaesa-agent" && stage.result && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 text-xs">
                        <p className="font-bold text-blue-800 dark:text-blue-200 mb-1">Kategori: {stage.result.industryCategory}</p>
                        <p className="text-blue-700 dark:text-blue-300">{stage.result.bridgeRationale}</p>
                      </div>
                      {stage.result.contentPillars?.length > 0 && (
                        <div className="p-2.5 rounded-lg border text-xs">
                          <p className="font-semibold mb-1">Pilar Konten</p>
                          <ul className="space-y-1">{stage.result.contentPillars.map((p: string, i: number) => <li key={i} className="flex gap-1.5"><span className="text-blue-500">•</span>{p}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Cross-panel bridge — Ekosistem → Broadcast */}
          {mcResult && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20 dark:border-emerald-800">
              <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Produk tersimpan di MultiClaw Context</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Buka WA Broadcast → buat kampanye dari produk ekosistem ini</p>
              </div>
              <GitBranch className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          )}
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
