import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import DemoChat from "@/components/demo-chat";
import {
  AlertTriangle,
  CheckCircle,
  Star,
  Shield,
  Award,
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Rocket,
  Eye,
  BookOpen,
  GraduationCap,
  FileText,
} from "lucide-react";

interface DemoItem {
  title: string;
  description?: string;
  imageUrl?: string;
}

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  quote: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface ConversionOffer {
  id: string;
  title: string;
  description?: string;
  price?: number;
  features?: string[];
  ctaText?: string;
  ctaUrl?: string;
  isPopular?: boolean;
}

interface Authority {
  title?: string;
  description?: string;
  credentials?: string[];
}

function injectMetaPixel(pixelId: string) {
  const sanitized = pixelId.replace(/[^0-9]/g, "");
  if (!sanitized || document.getElementById("meta-pixel-script")) return;
  const loader = document.createElement("script");
  loader.id = "meta-pixel-script";
  loader.async = true;
  loader.src = "https://connect.facebook.net/en_US/fbevents.js";
  loader.onload = () => {
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("init", sanitized);
      (window as any).fbq("track", "PageView");
    }
  };
  const w = window as any;
  if (!w.fbq) {
    const n: any = (w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
  }
  document.head.appendChild(loader);
}

export default function ProductLanding() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId || "";

  const { data: agent, isLoading } = useQuery<any>({
    queryKey: ["/api/landing", agentId],
  });

  useEffect(() => {
    if (agent?.metaPixelId) {
      injectMetaPixel(agent.metaPixelId);
    }
  }, [agent]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold" data-testid="text-not-found">
            Halaman tidak ditemukan
          </h1>
          <p className="text-muted-foreground">
            Halaman produk yang Anda cari tidak tersedia.
          </p>
          <Link href="/store">
            <Button className="gap-2" data-testid="link-back-home">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Kembali ke Store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!agent.landingPageEnabled) {
    const chatUrl = `/bot/${agentId}`;
    return (
      <div className="min-h-screen bg-background">
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {agent.avatar && (
                <div className="flex justify-center mb-8">
                  <Avatar className="h-20 w-20 border-2 border-white/20">
                    <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" />
                    <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                      {agent.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight text-white" data-testid="text-hero-headline">
                {agent.name}
              </h1>
              {agent.description && (
                <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto" data-testid="text-hero-subheadline">
                  {agent.description}
                </p>
              )}
              <Link href={chatUrl}>
                <Button size="lg" className="gap-2 text-lg px-8" data-testid="button-hero-cta">
                  <MessageSquare className="h-5 w-5" />
                  Mulai Chat Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {(agent.productFeatures ?? []).length > 0 && (
          <section className="py-16 md:py-20 bg-muted/50">
            <div className="container mx-auto px-4">
              <SectionHeader title="Yang Bisa Dilakukan" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {(agent.productFeatures ?? []).map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-3" data-testid={`text-feature-${index}`}>
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 md:py-20" data-testid="section-demo-chat">
          <div className="container mx-auto px-4">
            <SectionHeader title="Coba Langsung, Gratis" />
            <p className="text-center text-muted-foreground max-w-xl mx-auto -mt-6 mb-8">
              Buktikan sendiri kualitas jawabannya sebelum membeli — tanpa perlu daftar.
            </p>
            <DemoChat
              agentId={agentId}
              agentName={agent.name}
              avatar={agent.avatar}
              chatUrl={chatUrl}
              ctaText="Mulai Chat Sekarang"
            />
          </div>
        </section>

        <section className="py-20 md:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Siap Mulai?</h2>
            <p className="text-gray-300 mb-10 max-w-xl mx-auto">Gunakan {agent.name} sekarang — tanya apa saja seputar keahliannya.</p>
            <Link href={chatUrl}>
              <Button size="lg" className="gap-2 text-lg px-8" data-testid="button-final-cta">
                <MessageSquare className="h-5 w-5" />
                Mulai Chat
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const heroHeadline = agent.landingHeroHeadline || agent.name;
  const heroSubheadline =
    agent.landingHeroSubheadline || agent.description || "";
  const heroCtaText = agent.landingHeroCtaText || "Mulai Sekarang";
  const chatUrl = `/bot/${agentId}`;

  const painPoints: string[] = agent.landingPainPoints || [];
  const solutionText: string = agent.landingSolutionText || "";
  const productFeatures: string[] = agent.productFeatures || [];
  const demoItems: DemoItem[] = agent.landingDemoItems || [];
  const benefits: string[] = agent.landingBenefits || [];
  const testimonials: Testimonial[] = agent.landingTestimonials || [];
  const conversionOffers: ConversionOffer[] = agent.conversionOffers || [];
  const guarantees: string[] = agent.landingGuarantees || [];
  const authority: Authority = agent.landingAuthority || {};
  const faqItems: FaqItem[] = agent.landingFaq || [];
  const monthlyPrice: number = agent.monthlyPrice || 0;

  const hasAuthority =
    authority.title || authority.description || (authority.credentials && authority.credentials.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/50" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {agent.avatar && (
              <div className="flex justify-center mb-8">
                <Avatar className="h-20 w-20 border-2 border-white/20">
                  <AvatarImage
                    src={agent.avatar}
                    alt={agent.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                    {agent.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white"
              data-testid="text-hero-headline"
            >
              {heroHeadline}
            </h1>

            {heroSubheadline && (
              <p
                className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
                data-testid="text-hero-subheadline"
              >
                {heroSubheadline}
              </p>
            )}

            <Link href={chatUrl}>
              <Button
                size="lg"
                className="gap-2 text-lg px-8"
                data-testid="button-hero-cta"
              >
                <MessageSquare className="h-5 w-5" />
                {heroCtaText}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      {painPoints.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeader title="Apakah Anda Mengalami Ini?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {painPoints.map((point, index) => (
                <Card
                  key={index}
                  className="hover-elevate overflow-visible"
                  data-testid={`card-pain-point-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <p className="text-sm text-muted-foreground pt-2">
                        {point}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Solution Framing */}
      {(solutionText || productFeatures.length > 0) && (
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader title="Solusi yang Tepat" />
            <div className="max-w-3xl mx-auto">
              {solutionText && (
                <p
                  className="text-center text-muted-foreground mb-10 text-lg"
                  data-testid="text-solution"
                >
                  {solutionText}
                </p>
              )}
              {productFeatures.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {productFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                      data-testid={`text-feature-${index}`}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center mt-10">
              <Link href={chatUrl}>
                <Button className="gap-2" data-testid="button-solution-cta">
                  <Rocket className="h-4 w-4" />
                  Coba Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Demo / Preview */}
      {demoItems.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeader title="Lihat Bagaimana Cara Kerjanya" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {demoItems.map((item, index) => (
                <Card
                  key={index}
                  className="hover-elevate overflow-visible"
                  data-testid={`card-demo-${index}`}
                >
                  {item.imageUrl && (
                    <div className="aspect-video bg-muted rounded-t-md overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-sm mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Outcome Benefits */}
      {benefits.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader title="Hasil yang Akan Anda Dapatkan" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="hover-elevate overflow-visible"
                  data-testid={`card-benefit-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-md bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                        <Star className="h-5 w-5 text-yellow-500" />
                      </div>
                      <p className="text-sm pt-2">{benefit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeader title="Apa Kata Mereka" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="hover-elevate overflow-visible"
                  data-testid={`card-testimonial-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="text-4xl text-muted-foreground/30 font-serif mb-3 leading-none">
                      &ldquo;
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-6">
                      {testimonial.quote}
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {testimonial.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">
                          {testimonial.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {[testimonial.role, testimonial.company]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo Chat — coba langsung */}
      <section className="py-16 md:py-20" data-testid="section-demo-chat">
        <div className="container mx-auto px-4">
          <SectionHeader title="Coba Langsung, Gratis" />
          <p className="text-center text-muted-foreground max-w-xl mx-auto -mt-6 mb-8">
            Buktikan sendiri kualitas jawabannya sebelum membeli — tanpa perlu daftar.
          </p>
          <DemoChat
            agentId={agentId}
            agentName={agent.name}
            avatar={agent.avatar}
            chatUrl={`/bot/${agentId}`}
            ctaText={agent.landingHeroCtaText || "Mulai Sekarang"}
          />
        </div>
      </section>

      {/* Pricing / Offers */}
      {(conversionOffers.length > 0 || monthlyPrice > 0) && (
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader title="Pilih Paket yang Tepat" />

            {conversionOffers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {conversionOffers.map((offer) => (
                  <Card
                    key={offer.id}
                    className={`hover-elevate overflow-visible relative ${offer.isPopular ? "border-primary" : ""}`}
                    data-testid={`card-offer-${offer.id}`}
                  >
                    {offer.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" data-testid={`badge-popular-${offer.id}`}>
                          Populer
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8">
                      <h3 className="text-lg font-bold mb-2">{offer.title}</h3>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {offer.description}
                        </p>
                      )}
                      {typeof offer.price === "number" && (
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            Rp {offer.price.toLocaleString("id-ID")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /bulan
                          </span>
                        </div>
                      )}
                      {offer.features && offer.features.length > 0 && (
                        <ul className="space-y-2 mb-6">
                          {offer.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link href={offer.ctaUrl || chatUrl}>
                        <Button
                          className="w-full gap-2"
                          variant={offer.isPopular ? "default" : "outline"}
                          data-testid={`button-offer-cta-${offer.id}`}
                        >
                          {offer.ctaText || "Pilih Paket"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <Card
                  className="hover-elevate overflow-visible"
                  data-testid="card-pricing-single"
                >
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-bold mb-2">{agent.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        Rp {monthlyPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /bulan
                      </span>
                    </div>
                    <Link href={chatUrl}>
                      <Button
                        className="w-full gap-2"
                        data-testid="button-pricing-cta"
                      >
                        Mulai Sekarang
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Guarantees */}
      {guarantees.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeader title="Jaminan Kami" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {guarantees.map((guarantee, index) => (
                <Card
                  key={index}
                  className="hover-elevate overflow-visible"
                  data-testid={`card-guarantee-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm pt-2">{guarantee}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Authority / Credentials */}
      {hasAuthority && (
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader title="Mengapa Mempercayai Kami" />
            <div className="max-w-3xl mx-auto text-center">
              {authority.title && (
                <h3
                  className="text-xl font-bold mb-3"
                  data-testid="text-authority-title"
                >
                  {authority.title}
                </h3>
              )}
              {authority.description && (
                <p className="text-muted-foreground mb-8">
                  {authority.description}
                </p>
              )}
              {authority.credentials && authority.credentials.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {authority.credentials.map((cred, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-left"
                      data-testid={`text-credential-${index}`}
                    >
                      <Award className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{cred}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <SectionHeader title="Pertanyaan yang Sering Diajukan" />
            <div className="max-w-3xl mx-auto space-y-3">
              {faqItems.map((item, index) => (
                <FaqAccordionItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
            data-testid="text-final-cta-heading"
          >
            Siap Memulai?
          </h2>
          <p className="text-gray-300 mb-10 max-w-2xl mx-auto text-lg">
            Jangan tunda lagi. Mulai gunakan {agent.name} sekarang dan rasakan
            perbedaannya.
          </p>
          <Link href={chatUrl}>
            <Button
              size="lg"
              className="gap-2 text-lg px-8"
              data-testid="button-final-cta"
            >
              <MessageSquare className="h-5 w-5" />
              {heroCtaText}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Ecosystem Products Strip */}
      <section className="py-14 bg-gray-950 border-t border-white/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest font-semibold mb-6">
            Ekosistem Kompetensi dari Chatbot Ini
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon: BookOpen, label: "Panduan Digital", path: "ebook", color: "text-amber-400" },
              { icon: GraduationCap, label: "eCourse Modul", path: "ecourse", color: "text-violet-400" },
              { icon: FileText, label: "Generator Dokumen", path: "docgen", color: "text-blue-400" },
              { icon: MessageSquare, label: "Mini Apps", path: "mini-apps", color: "text-emerald-400" },
            ].map((prod) => {
              const PIcon = prod.icon;
              return (
                <Link key={prod.path} href={`/product/${agentId}/${prod.path}`}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors cursor-pointer group">
                    <PIcon className={`w-6 h-6 ${prod.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs text-gray-400 group-hover:text-white text-center font-medium transition-colors leading-tight">
                      {prod.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/">
              <div
                className="flex items-center gap-2 cursor-pointer"
                data-testid="link-footer-home"
              >
                <Bot className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Powered by Gustafta
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Gustafta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-4xl font-bold">{title}</h2>
    </div>
  );
}

function FaqAccordionItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-visible">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        data-testid={`button-faq-${index}`}
      >
        <span className="font-medium text-sm">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-sm text-muted-foreground">{answer}</p>
        </div>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 text-center space-y-6">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-12 w-48 mx-auto rounded-md" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-16 space-y-6">
        <Skeleton className="h-8 w-64 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
