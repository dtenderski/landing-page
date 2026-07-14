import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { useGustaftaAssistant } from "@/hooks/use-agents";
import { ChatPopup } from "@/components/chat-popup";
import { SharedHeader } from "@/components/shared-header";
import { getSectorContent, featuredSectors } from "@/lib/sector-content";
import {
  Bot, Sparkles, ArrowRight, Check, Rocket, CheckCircle2, XCircle,
  Brain, Blocks, BookOpen, Plug, Lightbulb, ArrowLeft,
  Palette, Shield, Code, Cpu, BarChart3, Camera
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function SectorLanding() {
  const params = useParams<{ sectorId: string }>();
  const sectorId = params.sectorId || "";
  const { isAuthenticated } = useAuth();
  const { data: gustaftaAssistant } = useGustaftaAssistant();
  const sector = getSectorContent(sectorId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sectorId]);

  if (!sector) {
    return (
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Sektor tidak ditemukan</h1>
            <p className="text-muted-foreground">Halaman sektor yang Anda cari tidak tersedia.</p>
            <Link href="/">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SectorIcon = sector.icon;

  const platformFeatures: { icon: LucideIcon; title: string; description: string }[] = [
    { icon: Brain, title: "Project Brain", description: "Pusatkan semua data dan konteks bisnis dalam satu tempat untuk referensi AI" },
    { icon: Blocks, title: "Mini Apps AI", description: "12 tools bawaan termasuk checklist, kalkulator, tracker, dan generator dokumen" },
    { icon: Lightbulb, title: "Hierarki Terstruktur", description: "Organisir chatbot dengan Series, Big Idea, Toolbox, dan Agent" },
    { icon: BookOpen, title: "Knowledge Base", description: "Upload PDF, dokumen, URL untuk memperkaya pengetahuan chatbot" },
    { icon: Plug, title: "Multi-Channel", description: "WhatsApp, Telegram, Discord, Slack, Web Widget, dan REST API" },
    { icon: Sparkles, title: "Agentic AI", description: "AI cerdas dengan retensi konteks, koreksi diri, dan pemahaman mendalam" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <section className="relative overflow-hidden py-16 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6 gap-2" data-testid="link-back-home">
                <ArrowLeft className="h-4 w-4" />
                Semua Sektor
              </Button>
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <SectorIcon className="h-4 w-4" />
              <span>{sector.label}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" data-testid="text-sector-hero-title">
              {sector.heroTitle}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {sector.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-6" data-testid="button-sector-dashboard">
                    <Rocket className="h-5 w-5" />
                    Buka Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <a href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 text-lg px-8 py-6" data-testid="button-sector-start">
                    <Rocket className="h-5 w-5" />
                    Mulai Gratis Sekarang
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-500" />
              Gratis untuk memulai. Tidak perlu kartu kredit. Setup dalam 7 menit.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/50 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {sector.stats.map((stat) => (
              <div key={stat.label} className="text-center" data-testid={`stat-${stat.label}`}>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Masalah & Solusi</Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Tantangan yang Kami Selesaikan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gustafta membantu mengatasi tantangan utama di sektor {sector.label.toLowerCase()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {sector.painPoints.map((item, index) => (
              <Card key={index} className="hover-elevate overflow-visible" data-testid={`card-pain-point-${index}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <item.icon className="h-6 w-6 text-destructive" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="font-medium text-destructive">{item.problem}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Use Cases</Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Contoh Penggunaan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Berbagai cara Gustafta membantu bisnis di sektor {sector.label.toLowerCase()}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {sector.useCases.map((useCase, index) => (
              <Card key={index} className="hover-elevate overflow-visible" data-testid={`card-use-case-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{useCase.title}</h3>
                      <p className="text-sm text-muted-foreground">{useCase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Fitur Platform</Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fitur lengkap Gustafta untuk membangun chatbot AI profesional
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature) => (
              <Card key={feature.title} className="hover-elevate overflow-visible" data-testid={`card-feature-${feature.title}`}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Menurut Data</Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Kenapa Ini Penting
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Konteks industri di sektor {sector.label.toLowerCase()} berdasarkan data lembaga riset terverifikasi
            </p>
          </div>

          <div className={`grid grid-cols-1 ${sector.research.length > 1 ? "md:grid-cols-2" : ""} gap-6 max-w-3xl mx-auto`}>
            {sector.research.map((item, index) => (
              <Card key={index} className="hover-elevate overflow-visible" data-testid={`card-research-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-3xl font-extrabold text-foreground">{item.value}</div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-2">{item.label}</p>
                  <p className="text-xs text-muted-foreground/70">Sumber: {item.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/70 text-center max-w-2xl mx-auto mt-6">
            Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {sector.faq.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left" data-testid={`faq-trigger-${index}`}>
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-3xl font-bold mb-4">Jelajahi Sektor Lainnya</h2>
            <p className="text-muted-foreground">Gustafta melayani berbagai sektor usaha</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {featuredSectors
              .filter((s) => s.id !== sectorId)
              .slice(0, 8)
              .map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.id} href={`/sector/${s.id}`}>
                    <Button variant="outline" className="gap-2" data-testid={`link-sector-${s.id}`}>
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      {s.label}
                    </Button>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            <SectorIcon className="h-3 w-3 mr-1" />
            Gustafta untuk {sector.label}
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Siap Memulai?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
            Buat chatbot AI untuk bisnis {sector.label.toLowerCase()} Anda dalam hitungan menit. Gratis untuk memulai.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <CheckCircle2 className="h-5 w-5" />
              <span>Setup 7 menit</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <CheckCircle2 className="h-5 w-5" />
              <span>Tanpa coding</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <CheckCircle2 className="h-5 w-5" />
              <span>Multi-channel</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6" data-testid="button-sector-cta-dashboard">
                  <Rocket className="h-5 w-5" />
                  Buka Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <a href="/login">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6" data-testid="button-sector-cta-start">
                  <Rocket className="h-5 w-5" />
                  Mulai Gratis Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
            )}
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Lihat Harga
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">Gustafta</span>
              <span className="text-sm text-muted-foreground">AI Chatbot Builder</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Gustafta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {gustaftaAssistant && <ChatPopup agent={gustaftaAssistant} />}
    </div>
  );
}
