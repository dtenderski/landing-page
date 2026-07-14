import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, BookOpen, Bot, Lock, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { KnowledgeBasePanel } from "@/components/panels/knowledge-base-panel";
import type { Agent } from "@shared/schema";

type OwnedAgent = Agent & { effectiveRole?: string };

export default function PerkuatPengetahuanPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Akses Ditolak",
        description: "Silakan login terlebih dahulu untuk mengelola pengetahuan chatbot Anda.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  const { data: agents = [], isLoading: agentsLoading } = useQuery<OwnedAgent[]>({
    queryKey: ["/api/agents"],
    enabled: isAuthenticated,
  });

  // Hanya chatbot PRIVAT milik sendiri (salinan privat yang dibeli). Bot bersama
  // (Premium Standar) & bot yang hanya dibagikan ke saya tidak bisa diubah di sini.
  const privateBots = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.effectiveRole === "owner" &&
          (a.premiumClass === "private" || a.clonedFromAgentId != null),
      ),
    [agents],
  );

  const selectedBot = privateBots.find((a) => String(a.id) === selectedId) || null;

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-3 -ml-2 text-muted-foreground"
          >
            <Link href="/dashboard" data-testid="link-back-dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Perkuat Pengetahuan
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Tambahkan dokumen, catatan, atau data internal perusahaan Anda ke
                chatbot privat. Semakin banyak pengetahuan yang Anda berikan,
                semakin pintar dan relevan jawaban chatbot untuk bisnis Anda.
              </p>
            </div>
          </div>
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Memuat chatbot Anda...
          </div>
        ) : privateBots.length === 0 ? (
          <Card data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="rounded-full bg-muted p-4 text-muted-foreground">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold">Belum ada chatbot privat</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Halaman ini untuk mengelola pengetahuan chatbot{" "}
                <span className="font-medium text-foreground">Premium Privat</span>{" "}
                — salinan pribadi yang bisa Anda isi dengan data internal sendiri.
                Setelah Anda membeli atau menerima chatbot privat, ia akan muncul di sini.
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/store" data-testid="link-browse-store">
                  Lihat Katalog Chatbot
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : selectedBot ? (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-muted-foreground"
              onClick={() => setSelectedId(null)}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Pilih chatbot lain
            </Button>
            <div className="mb-4 flex items-center gap-3 rounded-lg border bg-background p-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-semibold" data-testid="text-selected-bot-name">
                    {selectedBot.name}
                  </h2>
                  <Badge variant="secondary" className="shrink-0">
                    Privat
                  </Badge>
                </div>
                {selectedBot.description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedBot.description}
                  </p>
                )}
              </div>
            </div>
            <KnowledgeBasePanel agent={selectedBot} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {privateBots.map((bot) => (
              <Card
                key={bot.id}
                className="cursor-pointer transition-colors hover-elevate"
                onClick={() => setSelectedId(String(bot.id))}
                data-testid={`card-bot-${bot.id}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold" data-testid={`text-bot-name-${bot.id}`}>
                        {bot.name}
                      </h3>
                      <Badge variant="secondary" className="shrink-0">
                        Privat
                      </Badge>
                    </div>
                    {bot.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {bot.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                      <BookOpen className="h-3.5 w-3.5" />
                      Kelola pengetahuan
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
