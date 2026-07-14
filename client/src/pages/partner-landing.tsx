import { Link } from "wouter";
import { trackLead } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SharedHeader } from "@/components/shared-header";
import { usePartnerBranding, toDirectImageUrl } from "@/hooks/use-partner-branding";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Bot, ShieldCheck, Zap, Phone, Mail, LogIn } from "lucide-react";

/**
 * Landing netral untuk host mitra (whitelabel).
 * Tidak menampilkan konten pemasaran Gustafta — hanya brand mitra,
 * tagline/deskripsi mitra, dan tombol masuk ke asisten AI mitra.
 */
export default function PartnerLanding() {
  const { partner } = usePartnerBranding();
  const { isAuthenticated } = useAuth();

  if (!partner) return null;

  const accent = partner.primaryColor || "#1e40af";
  const chatHref = partner.defaultAgentId ? `/chat/${partner.defaultAgentId}` : "/login";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SharedHeader />

      {/* Hero */}
      <section className="flex-1 flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {partner.logoUrl && (
              <img
                src={toDirectImageUrl(partner.logoUrl)}
                alt={partner.brandName}
                className="h-24 w-24 md:h-32 md:w-32 object-contain mx-auto"
                data-testid="img-partner-hero-logo"
              />
            )}
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: accent }}
              data-testid="text-partner-hero-brand"
            >
              {partner.brandName}
            </h1>
            {partner.tagline && (
              <p className="text-xl md:text-2xl font-medium text-foreground/80" data-testid="text-partner-tagline">
                {partner.tagline}
              </p>
            )}
            {partner.description && (
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed" data-testid="text-partner-description">
                {partner.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                asChild
                size="lg"
                className="gap-2 text-base px-8"
                style={{ backgroundColor: accent, color: "#fff" }}
              >
                <Link href="/konsultasi" data-testid="link-partner-start-dialog">
                  <MessageCircle className="h-5 w-5" />
                  Dialog Blueprint
                </Link>
              </Button>
              {partner.defaultAgentId && (
                <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
                  <Link href={chatHref} data-testid="link-partner-start-chat">
                    <Bot className="h-5 w-5" />
                    Chat Asisten AI
                  </Link>
                </Button>
              )}
              {!isAuthenticated && (
                <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
                  <a href="/login" data-testid="link-partner-login">
                    <LogIn className="h-5 w-5" />
                    Masuk
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Fitur ringkas — netral, tanpa branding platform */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
            {[
              { icon: Bot, title: "Asisten AI", desc: "Jawaban cepat dan terarah untuk kebutuhan Anda, kapan saja." },
              { icon: ShieldCheck, title: "Terkurasi", desc: "Pengetahuan disusun dan dikelola khusus untuk anggota." },
              { icon: Zap, title: "Praktis", desc: "Langsung tanya lewat chat — tanpa instalasi, tanpa ribet." },
            ].map((f) => (
              <Card key={f.title} className="text-center">
                <CardContent className="pt-6 space-y-2">
                  <f.icon className="h-8 w-8 mx-auto" style={{ color: accent }} />
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer netral */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span data-testid="text-partner-footer-brand">
            © {new Date().getFullYear()} {partner.brandName}
          </span>
          <div className="flex items-center gap-4">
            {partner.contactPhone && (
              <a
                href={`https://wa.me/${partner.contactPhone.replace(/[^0-9]/g, "")}`} onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                data-testid="link-partner-footer-phone"
              >
                <Phone className="h-3.5 w-3.5" />
                {partner.contactPhone}
              </a>
            )}
            {partner.contactEmail && (
              <a
                href={`mailto:${partner.contactEmail}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                data-testid="link-partner-footer-email"
              >
                <Mail className="h-3.5 w-3.5" />
                {partner.contactEmail}
              </a>
            )}
            {!partner.hidePlatformBranding && (
              <span className="text-xs opacity-60">Didukung oleh Gustafta</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
