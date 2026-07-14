import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, RefreshCw, MessageSquare, Copy, Check, CalendarDays,
  Megaphone, Heart, Handshake, Search, Clock, AlertCircle,
} from "lucide-react";

interface DailyDoc {
  id: number | string;
  name: string;
  description: string;
  createdAt: string;
  content: string;
}
interface Stream {
  key: string;
  title: string;
  subtitle: string;
  group: "produksi" | "riset";
  slug: string;
  exists: boolean;
  canAccess: boolean;
  agentId: number | string | null;
  agentName: string | null;
  avatar: string | null;
  tagline: string | null;
  docs: DailyDoc[];
}
interface Overview {
  orchestrator: { id: number | string; name: string; tagline: string | null; avatar: string | null } | null;
  streams: Stream[];
}

const STREAM_ICON: Record<string, React.ReactNode> = {
  "materi-iklan": <Megaphone className="w-5 h-5" />,
  retensi: <Heart className="w-5 h-5" />,
  closing: <Handshake className="w-5 h-5" />,
  "riset-lokal": <Search className="w-5 h-5" />,
  "riset-global": <Search className="w-5 h-5" />,
  "riset-pasar": <Search className="w-5 h-5" />,
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function StreamCard({ stream }: { stream: Stream }) {
  const { toast } = useToast();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const doc = stream.docs[selectedIdx];

  const handleCopy = async () => {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(doc.content);
      setCopied(true);
      toast({ title: "Tersalin", description: "Isi materi disalin ke clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Gagal menyalin", variant: "destructive" });
    }
  };

  return (
    <Card data-testid={`card-stream-${stream.key}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {STREAM_ICON[stream.key] ?? <CalendarDays className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base" data-testid={`text-stream-title-${stream.key}`}>{stream.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{stream.subtitle}</p>
          </div>
          {stream.exists && stream.canAccess && stream.agentId != null && (
            <Link href={`/chat/${stream.agentId}`}>
              <Button variant="ghost" size="sm" data-testid={`button-chat-${stream.key}`}>
                <MessageSquare className="w-4 h-4 mr-1" /> Chat
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!stream.exists ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Agen ini belum dibuat.
          </p>
        ) : !stream.canAccess ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Anda tidak punya akses ke agen ini.
          </p>
        ) : stream.docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada hasil harian. Tim akan bekerja otomatis tiap pagi (06:30 WIB), atau tekan
            <span className="font-medium"> "Jalankan Sekarang"</span> di atas.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {stream.docs.slice(0, 7).map((d, i) => (
                <button
                  key={String(d.id)}
                  onClick={() => setSelectedIdx(i)}
                  data-testid={`button-date-${stream.key}-${i}`}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    i === selectedIdx
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </button>
              ))}
            </div>
            {doc && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5" data-testid={`text-docdate-${stream.key}`}>
                    <CalendarDays className="w-3.5 h-3.5" /> {formatDate(doc.createdAt)}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleCopy} data-testid={`button-copy-${stream.key}`}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? "Tersalin" : "Salin"}
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm font-sans leading-relaxed" data-testid={`text-content-${stream.key}`}>
                    {doc.content || "(kosong)"}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonitorMarketing() {
  const { toast } = useToast();
  const { data: adminMe, isLoading: adminLoading } = useQuery<{ isAdmin: boolean; isSuperAdmin: boolean; role: string }>({ queryKey: ["/api/admin/me"] });
  const isAdminUser = adminMe?.isAdmin === true;
  const { data, isLoading, error } = useQuery<Overview>({
    queryKey: ["/api/marketing-team/overview"],
    enabled: isAdminUser,
  });

  const sweepMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/research/sweep");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tim marketing dijalankan", description: "Hasil baru sedang dibuat. Muat ulang sebentar lagi untuk melihatnya." });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-team/overview"] });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menjalankan", description: e?.message || "Coba lagi.", variant: "destructive" });
    },
  });

  const streams = data?.streams ?? [];
  const produksi = streams.filter((s) => s.group === "produksi");
  const riset = streams.filter((s) => s.group === "riset");

  const lastUpdated = streams
    .flatMap((s) => s.docs.map((d) => new Date(d.createdAt).getTime()))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full" data-testid="card-access-denied">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-bold" data-testid="text-access-denied">Akses Terbatas</h1>
              <p className="text-sm text-muted-foreground mt-1">Halaman ini hanya untuk tim internal Gustafta.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Monitor Tim Marketing</h1>
              <p className="text-sm text-muted-foreground">Pantau hasil kerja harian tim marketing AI Anda di satu tempat.</p>
            </div>
          </div>
          <Button
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            data-testid="button-run-now"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${sweepMutation.isPending ? "animate-spin" : ""}`} />
            {sweepMutation.isPending ? "Menjalankan…" : "Jalankan Sekarang"}
          </Button>
        </div>

        {/* Orchestrator + last updated */}
        {data?.orchestrator && (
          <Card data-testid="card-orchestrator">
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
                {data.orchestrator.avatar || "📣"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" data-testid="text-orchestrator-name">{data.orchestrator.name}</p>
                <p className="text-xs text-muted-foreground">{data.orchestrator.tagline || "Ketua tim yang mengoordinasi semua anggota marketing."}</p>
              </div>
              {lastUpdated && (
                <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-last-updated">
                  <Clock className="w-3 h-3" /> Terakhir: {formatDate(new Date(lastUpdated).toISOString())}
                </Badge>
              )}
              <Link href={`/chat/${data.orchestrator.id}`}>
                <Button variant="outline" size="sm" data-testid="button-chat-orchestrator">
                  <MessageSquare className="w-4 h-4 mr-1" /> Tanya Ketua Tim
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Gagal memuat data. Coba muat ulang halaman.
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="py-6 space-y-3">
                <Skeleton className="h-6 w-2/3" /><Skeleton className="h-24 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {produksi.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Hasil Kerja Harian</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {produksi.map((s) => <StreamCard key={s.key} stream={s} />)}
                </div>
              </section>
            )}
            {riset.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Riset & Intelijen Pasar</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {riset.map((s) => <StreamCard key={s.key} stream={s} />)}
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Semua hasil di sini masih berupa <span className="font-medium">draf</span>. Keputusan akhir tetap di tangan Anda sebelum dipublikasikan (◆ gerbang manusia).
        </p>
      </div>
    </div>
  );
}
