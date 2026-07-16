import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { usePartnerBranding, toDirectImageUrl, type PartnerBranding } from "@/hooks/use-partner-branding";
import { trackLead } from "@/lib/meta-pixel";
import { Bot, BookOpen, BarChart3, LogIn, LogOut, Menu, CreditCard, LayoutDashboard, ShoppingBag, Smartphone, Package, Shield, Crown, User, Store, Rocket, TrendingUp, MessageCircle, GraduationCap, Sparkles, Brain, Zap, FileDown, Stethoscope, CalendarDays, FileSearch } from "lucide-react";

const WA_NUMBERS = [
  { display: "081287941900", link: "6281287941900" },
  { display: "082299417818", link: "6282299417818" },
];

const PLAN_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  free:        { label: "Free",        className: "bg-muted text-muted-foreground border-border" },
  free_trial:  { label: "Trial",       className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30" },
  starter:     { label: "Starter",     className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  profesional: { label: "Profesional", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  bisnis:      { label: "Bisnis",      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  enterprise:  { label: "Enterprise",  className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" },
};

function PlanBadge() {
  const { planInfo, isLoading } = useFeatureAccess();
  if (isLoading || planInfo.status === "unauthenticated" || planInfo.status === "loading") return null;

  const planKey = planInfo.plan ?? "free";
  const cfg = PLAN_BADGE_CONFIG[planKey] ?? PLAN_BADGE_CONFIG.free;
  const isActive = planInfo.status === "active";
  const isPaid = planInfo.tier > 0;
  const urgent = isActive && isPaid && planInfo.daysRemaining !== null && planInfo.daysRemaining <= 7;

  return (
    <Link href="/my-subscription">
      <Badge
        variant="outline"
        className={`gap-1 text-[10px] h-6 px-2 cursor-pointer transition-opacity hover:opacity-80 font-semibold ${cfg.className} ${urgent ? "animate-pulse" : ""}`}
        data-testid="badge-plan-header"
        title={
          isActive && planInfo.daysRemaining !== null
            ? `${cfg.label} — ${planInfo.daysRemaining} hari tersisa`
            : cfg.label
        }
      >
        {isPaid ? <Crown className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
        {cfg.label}
        {isActive && planInfo.daysRemaining !== null && planInfo.daysRemaining <= 14 && (
          <span className={urgent ? "text-red-500" : "opacity-70"}>
            · {planInfo.daysRemaining}h
          </span>
        )}
      </Badge>
    </Link>
  );
}

function BlueprintHeaderDot() {
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gustafta_blueprint_pending");
      if (raw) {
        const bp = JSON.parse(raw);
        setHasPending(bp.status !== "unlocked" && bp.status !== "imported");
      }
    } catch { /* ignore */ }
  }, []);

  if (!hasPending) return null;

  return (
    <Link href="/blueprint-saya" title="Blueprint Saya — klik untuk lihat">
      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20 relative">
        <FileDown className="h-3.5 w-3.5" />
        Blueprint
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      </Button>
    </Link>
  );
}

interface SharedHeaderProps {
  transparent?: boolean;
}

function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => window.__pwaInstallPrompt || null);
  const [installed, setInstalled] = useState(() => window.__pwaInstalled || false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.__pwaInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (installed || isStandalone) return null;
  if (!deferredPrompt && !isIOS) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        window.__pwaInstalled = true;
      }
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = undefined;
    } else if (isIOS) {
      setShowIOSGuide(prev => !prev);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        className="gap-1.5 text-xs"
        data-testid="button-pwa-install"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </Button>
      {showIOSGuide && (
        <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-popover border rounded-lg shadow-lg z-50 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Install di iPhone/iPad:</p>
          <p>1. Tap tombol Share <span className="font-mono">⬆</span> di Safari</p>
          <p>2. Pilih "Add to Home Screen"</p>
          <p>3. Tap "Add" di pojok kanan atas</p>
        </div>
      )}
    </div>
  );
}

function ContactTopBar({ partner }: { partner: PartnerBranding | null }) {
  // Host mitra whitelabel: tampilkan kontak MITRA (bukan kontak Gustafta/Scalev).
  if (partner) {
    if (!partner.contactPhone && !partner.contactEmail) return null;
    return (
      <div className="hidden md:flex bg-muted/60 border-b text-xs text-muted-foreground px-4 py-1.5 items-center gap-4">
        <span className="flex items-center gap-1 font-medium text-foreground/70">
          <Smartphone className="h-3 w-3" /> Hubungi Kami:
        </span>
        {partner.contactPhone && (
          <a
            href={`https://wa.me/${partner.contactPhone.replace(/[^0-9]/g, "")}`}
            onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium"
            data-testid="link-topbar-partner-wa"
          >
            <MessageCircle className="h-3 w-3 text-green-500" />
            {partner.contactPhone}
          </a>
        )}
        {partner.contactEmail && (
          <a
            href={`mailto:${partner.contactEmail}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
            data-testid="link-topbar-partner-email"
          >
            {partner.contactEmail}
          </a>
        )}
      </div>
    );
  }
  return (
    <div className="hidden md:flex bg-muted/60 border-b text-xs text-muted-foreground px-4 py-1.5 items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 font-medium text-foreground/70">
          <Smartphone className="h-3 w-3" /> Hubungi Kami:
        </span>
        {WA_NUMBERS.map((n) => (
          <a
            key={n.link}
            href={`https://wa.me/${n.link}`}
            onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium"
            data-testid={`link-topbar-wa-${n.link}`}
          >
            <MessageCircle className="h-3 w-3 text-green-500" />
            {n.display}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CreditCard className="h-3 w-3" />
        <span>Pembayaran aman via <strong className="text-foreground/70">Scalev.id</strong> — Pembayaran Terverifikasi</span>
      </div>
    </div>
  );
}

export function SharedHeader({ transparent }: SharedHeaderProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { partner } = usePartnerBranding();

  const { data: adminData } = useQuery<{ isAdmin: boolean; isSuperAdmin: boolean; role: string }>({
    queryKey: ["/api/admin/me"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Host mitra whitelabel: menu Gustafta disembunyikan, diganti menu netral mitra.
  const navItems = partner
    ? [
        { href: "/", label: "Beranda", icon: Bot },
        ...(partner.defaultAgentId
          ? [{ href: `/chat/${partner.defaultAgentId}`, label: "Asisten AI", icon: MessageCircle }]
          : []),
      ]
    : [
        { href: "/#trilogi", label: "Belajar", icon: GraduationCap, badge: "Mulai di Sini" },
        { href: "/produk", label: "Merakit AI", icon: Rocket },
        { href: "/store", label: "Menggunakan AI", icon: Zap },
        { href: "/affiliate", label: "Menghasilkan Nilai", icon: TrendingUp },
        { href: "/packs", label: "Berkembang", icon: Sparkles },
        { href: "/klinik-konsultasi", label: "Klinik Konsultasi", icon: Stethoscope },
        { href: "/bedah-dokumen", label: "Bedah Dokumen", icon: FileSearch },
        { href: "/indobuildtech", label: "Indobuildtech", icon: CalendarDays, badge: "Event" },
      ];

  const premiumNavItems = [
    { href: "/edu-counsel", label: "EduCounsel AI", icon: Brain },
    { href: "/ai-tutor", label: "AI Tutor Adaptif", icon: GraduationCap },
    { href: "/tutor-builder", label: "Rakit Tim Agen", icon: Sparkles },
    { href: "/tender-ai", label: "Tendera AI", icon: TrendingUp },
    { href: "/ib-tu", label: "IB-TU Coordinator", icon: GraduationCap },
    { href: "/sbu-claw", label: "SBUClaw", icon: TrendingUp },
    { href: "/data-master", label: "Data Master", icon: TrendingUp },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="sticky top-0 z-50">
      <ContactTopBar partner={partner} />
      <header className={`border-b ${transparent ? "bg-background/80" : "bg-background/95"} backdrop-blur`}>

        {/* ── Baris 1: Logo + Aksi Kanan ── */}
        <div className="container mx-auto px-4 h-28 flex items-center justify-between gap-2">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer shrink-0">
              {partner ? (
                <>
                  {partner.logoUrl && (
                    <img src={toDirectImageUrl(partner.logoUrl)} alt={partner.brandName} className="h-[67px] w-[67px] object-contain" />
                  )}
                  <span
                    className="text-[40px] font-black tracking-tight leading-none"
                    style={{ color: partner.primaryColor || undefined }}
                    data-testid="text-partner-brand"
                  >
                    {partner.brandName}
                  </span>
                </>
              ) : (
                <>
                  <img src="/logo-gustafta.png" alt="Gustafta" className="h-[67px] w-[67px] object-contain" />
                  <span className="text-[40px] font-black tracking-tight leading-none bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-900 bg-clip-text text-transparent">GUSTAFTA</span>
                </>
              )}
            </div>
          </Link>

          {/* Aksi kanan — desktop */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />
            <ThemeToggle />
            {isLoading ? (
              <Button disabled size="sm">Loading...</Button>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                {adminData?.isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant="outline" size="sm"
                      className={`gap-1 text-xs h-8 ${adminData.isSuperAdmin ? "border-purple-400 text-purple-600 dark:text-purple-400" : "border-primary/40 text-primary"}`}
                      data-testid="button-admin-link"
                    >
                      {adminData.isSuperAdmin ? <Crown className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                      {adminData.isSuperAdmin ? "Super Admin" : "Admin"}
                    </Button>
                  </Link>
                )}
                {!partner && <PlanBadge />}
                <Link href="/dashboard">
                  <Button size="sm" className="gap-1.5 text-xs h-8">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Button>
                </Link>
                {!partner && <BlueprintHeaderDot />}
                <Link href="/account" title="Akun Saya">
                  <Avatar className="h-7 w-7 cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition-all" data-testid="avatar-account-link">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback className="text-xs">{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Link>
                <a href="/api/logout">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Keluar">
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/login">
                <Button size="sm" className="gap-1.5 text-xs h-8">
                  <LogIn className="h-3.5 w-3.5" />
                  Masuk
                </Button>
              </a>
            )}
          </div>

          {/* Aksi kanan — mobile */}
          <div className="flex md:hidden items-center gap-2">
            <PWAInstallButton />
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex items-center gap-2 mb-6">
                  {partner ? (
                    <>
                      {partner.logoUrl ? (
                        <img src={toDirectImageUrl(partner.logoUrl)} alt={partner.brandName} className="h-6 w-6 object-contain" />
                      ) : (
                        <Bot className="h-6 w-6" style={{ color: partner.primaryColor || undefined }} />
                      )}
                      <span className="font-bold">{partner.brandName}</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-6 w-6 text-primary" />
                      <span className="font-bold">Gustafta</span>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  {isAuthenticated && !partner && (
                    <Link href="/my-subscription" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={isActive("/my-subscription") || isActive("/subscription") ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Paket Saya
                      </Button>
                    </Link>
                  )}
                  {!partner && (
                    <>
                      <Link href="/blueprint-saya" onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant={isActive("/blueprint-saya") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <FileDown className="h-4 w-4 mr-2 text-amber-500" />
                          Blueprint Saya
                        </Button>
                      </Link>
                      <div className="border-t pt-3 mt-1">
                        <Link href="/documentation" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Dokumentasi
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                  <div className="border-t pt-4 mt-2">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        {adminData?.isAdmin && (
                          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="outline"
                              className={`w-full gap-2 ${adminData.isSuperAdmin ? "border-purple-400 text-purple-600 dark:text-purple-400" : "border-primary/40 text-primary"}`}
                              data-testid="button-admin-mobile"
                            >
                              {adminData.isSuperAdmin ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                              {adminData.isSuperAdmin ? "Super Admin Panel" : "Admin Panel"}
                            </Button>
                          </Link>
                        )}
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                        {!partner && (
                          <Link href="/my-subscription" onClick={() => setMobileMenuOpen(false)}>
                            <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Status Membership
                              </div>
                              <PlanBadge />
                            </div>
                          </Link>
                        )}
                        <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full gap-2" data-testid="button-account-mobile">
                            <User className="h-4 w-4" />
                            Akun Saya
                          </Button>
                        </Link>
                        <a href="/api/logout">
                          <Button variant="outline" className="w-full gap-2">
                            <LogOut className="h-4 w-4" />
                            Keluar
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <a href="/login">
                        <Button className="w-full gap-2">
                          <LogIn className="h-4 w-4" />
                          Masuk
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ── Baris 2: Nav — desktop only ── */}
        <nav className="hidden md:flex items-center justify-center gap-0.5 border-t border-border/50 h-10 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                className="text-xs px-3 h-8 font-medium relative"
              >
                {item.label}
                {"badge" in item && item.badge && (
                  <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    item.badge === "Mulai di Sini"
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-400 text-amber-900"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          ))}
          {isAuthenticated && !partner && (
            <Link href="/my-subscription">
              <Button
                variant={isActive("/my-subscription") || isActive("/subscription") ? "secondary" : "ghost"}
                size="sm"
                className="text-xs px-3 h-8 font-medium"
              >
                <Crown className="h-3.5 w-3.5 mr-1" />
                Paket Saya
              </Button>
            </Link>
          )}
        </nav>

      </header>
    </div>
  );
}
