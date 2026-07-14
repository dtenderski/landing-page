import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Lock, LogIn, Zap, ArrowRight, Crown, Star, Shield,
  Brain, Cpu, Bot, Sparkles, CheckCircle2, MessageCircle, Phone,
  LayoutGrid, PackageOpen, AlertTriangle, Flame, TrendingUp, BadgeCheck, HelpCircle
} from "lucide-react";
import { useFeatureAccess, type FeatureKey, type PlanTier, PLAN_CONFIGS, FEATURE_LABELS } from "@/hooks/use-feature-access";
import { useClawPackages, packageForRoute } from "@/hooks/use-claw-packages";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { trackLead } from "@/lib/meta-pixel";

const WA_TRIAL_NUMBER = "6281287941900";
const WA_TRIAL_NUMBER_2 = "6282299417818";

/** Statistik faktual kapasitas produk (BUKAN testimoni/angka pengguna fiktif) — mis. "10 Agen Spesialis". */
export interface CapabilityStat {
  value: string;
  label: string;
}

/** Satu butir FAQ pada bagian penutup halaman gate. */
export interface GuardFaqItem {
  q: string;
  a: string;
}

/** Salinan PAS (Problem–Agitate–Solution) opsional untuk memperkaya layar gate menjadi halaman jualan yang utuh. */
export interface PasCopy {
  /** Masalah yang dialami audiens sebelum memakai produk ini. */
  problemTitle?: string;
  problemBody?: string;
  /** Akibat bila masalah itu dibiarkan (mengapa harus segera bertindak). */
  agitateBody?: string;
  /** Gambaran kondisi "sesudah" memakai produk (desire). */
  desireBody?: string;
  /** Angka kapasitas produk yang faktual (jumlah agen, cakupan regulasi, dsb). */
  stats?: CapabilityStat[];
  /** Catatan sumber/regulasi acuan (bukan klaim statistik pengguna). */
  proofNote?: string;
  faqs?: GuardFaqItem[];
}

interface PremiumPageGuardProps {
  feature: FeatureKey;
  requiredPlan?: PlanTier;
  title: string;
  description: string;
  highlights?: string[];
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Salinan PAS/AIDA khusus produk ini. Bila kosong, gate tetap tampil dengan salinan generik yang jujur (diturunkan dari description/highlights). */
  pas?: PasCopy;
}

function genericPas(title: string, description: string, highlights: string[]): Required<Pick<PasCopy, "problemTitle" | "problemBody" | "agitateBody" | "desireBody" | "faqs">> & { stats: CapabilityStat[] } {
  return {
    problemTitle: "Biasanya, ini yang bikin repot",
    problemBody: `Mengurus ini sendiri seringkali membingungkan — banyak istilah, syarat, dan alur yang tersebar di berbagai sumber. Salah langkah kecil saja bisa membuat pengajuan tertunda atau ditolak.`,
    agitateBody: `Setiap hari yang terbuang untuk bolak-balik cari info berarti waktu dan biaya yang hilang — dan tenggat yang makin mepet.`,
    desireBody: `Dengan ${title}, Anda cukup bertanya dan langkah kerja langsung terarah — dari mana harus mulai, dokumen apa yang perlu disiapkan, sampai apa yang harus dihindari.`,
    stats: [
      { value: `${Math.max(highlights.length, 4)}+`, label: "Area Bantuan Utama" },
      { value: "24/7", label: "Selalu Siap Diakses" },
    ],
    faqs: [
      { q: "Apakah ini menggantikan proses resmi ke instansi terkait?", a: "Tidak. Ini adalah asisten AI yang memandu dan mempercepat persiapan Anda — proses resmi tetap dilakukan melalui instansi/lembaga berwenang." },
      { q: "Bagaimana kalau pertanyaan saya spesifik ke kasus saya?", a: "Ceritakan detail situasi Anda di chat — agen akan menyesuaikan jawaban dan langkah berdasarkan konteks yang Anda berikan." },
      { q: "Apakah data yang saya masukkan aman?", a: "Data percakapan Anda digunakan hanya untuk memberi jawaban dalam sesi Anda dan tidak dibagikan ke pihak ketiga." },
    ],
  };
}

export function PremiumPageGuard({
  feature,
  requiredPlan = "starter",
  title,
  description,
  highlights = [],
  icon,
  children,
  className,
  pas,
}: PremiumPageGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasFeature, planInfo } = useFeatureAccess();
  const [location] = useLocation();
  const routePackage = packageForRoute(location);
  const clawPkgQuery = useClawPackages();

  // Admin/SuperAdmin bypass — check role from /api/admin/me
  const { data: adminData, isLoading: adminLoading } = useQuery<{
    isAdmin: boolean;
    isSuperAdmin: boolean;
    role: string;
  }>({
    queryKey: ["/api/admin/me"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isSuperAdmin = adminData?.isSuperAdmin === true;

  if (authLoading || adminLoading || planInfo.status === "loading" || (isAuthenticated && routePackage && clawPkgQuery.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Memeriksa akses…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LockedScreen
        title={title}
        description={description}
        highlights={highlights}
        icon={icon}
        reason="auth"
        requiredPlan={requiredPlan}
        className={className}
        pas={pas}
      />
    );
  }

  // Only SuperAdmin gets full bypass — regular admin still needs subscription
  if (isSuperAdmin) return <>{children}</>;

  // ── Paket bidang: route claw yang termasuk paket bidang ──
  // Bisnis/Enterprise (allowance "all") → buka semua paket.
  // Profesional (allowance > 0) → buka HANYA claw di paket terpilih (termasuk claw yang dulunya khusus Bisnis).
  // Tier di bawahnya → jatuh ke pengecekan fitur biasa (upsell lama).
  if (routePackage) {
    const { allowance, selected } = clawPkgQuery.info;
    if (allowance === "all") return <>{children}</>;
    if (typeof allowance === "number" && allowance > 0) {
      if (selected.includes(routePackage.id)) return <>{children}</>;
      return (
        <PackageLockedScreen
          title={title}
          description={description}
          icon={icon}
          packageName={routePackage.name}
          hasSelection={selected.length > 0}
          className={className}
        />
      );
    }
  }

  if (!hasFeature(feature)) {
    return (
      <LockedScreen
        title={title}
        description={description}
        highlights={highlights}
        icon={icon}
        reason="plan"
        requiredPlan={requiredPlan}
        className={className}
        pas={pas}
      />
    );
  }

  return <>{children}</>;
}

interface PackageLockedScreenProps {
  title: string;
  description: string;
  icon?: ReactNode;
  packageName: string;
  hasSelection: boolean;
  className?: string;
}

function PackageLockedScreen({ title, description, icon, packageName, hasSelection, className }: PackageLockedScreenProps) {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center space-y-8">

          <div className="relative flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center text-4xl shadow-lg">
              {icon ?? <Bot className="h-12 w-12 text-muted-foreground" />}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow">
              <PackageOpen className="h-5 w-5 text-indigo-500" />
            </div>
          </div>

          <div className="space-y-3">
            <Badge className="gap-1.5 px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
              <LayoutGrid className="h-3.5 w-3.5" />
              Paket Bidang: {packageName}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
          </div>

          <div className="bg-muted/40 rounded-2xl p-5 border border-border/50 text-sm text-muted-foreground leading-relaxed">
            {hasSelection ? (
              <>Claw ini termasuk paket bidang <span className="font-semibold text-foreground">{packageName}</span> yang belum ada di pilihan Anda. Pilihan paket bidang terkunci setelah disimpan — hubungi admin jika ingin mengganti.</>
            ) : (
              <>Claw ini termasuk paket bidang <span className="font-semibold text-foreground">{packageName}</span>. Paket Profesional Anda memberi jatah memilih paket bidang — pilih sekarang untuk membuka claw ini.</>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/paket-bidang">
              <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-pilih-paket-bidang">
                <LayoutGrid className="h-4 w-4" />
                {hasSelection ? "Lihat Paket Bidang Saya" : "Pilih Paket Bidang"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/multiclaw">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-back-directory">
                <Cpu className="h-4 w-4" />
                Direktori MultiClaw
              </Button>
            </Link>
          </div>

          {hasSelection && (
            <p className="text-xs text--muted-foreground text-muted-foreground">
              Ingin akses semua bidang tanpa memilih? Upgrade ke paket Bisnis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface LockedScreenProps {
  title: string;
  description: string;
  highlights: string[];
  icon?: ReactNode;
  reason: "auth" | "plan";
  requiredPlan: PlanTier;
  className?: string;
  pas?: PasCopy;
}

function buildWaMessage(title: string, reason: "auth" | "plan", requiredPlan: PlanTier) {
  const planConfig = PLAN_CONFIGS[requiredPlan];
  if (reason === "auth") {
    return encodeURIComponent(
      `Halo, saya ingin coba trial ${title} di Gustafta. Bagaimana caranya?`
    );
  }
  return encodeURIComponent(
    `Halo, saya sudah login di Gustafta dan ingin mengajukan trial ${title} (Paket ${planConfig.name}). Apakah tersedia?`
  );
}

function LockedScreen({ title, description, highlights, icon, reason, requiredPlan, className, pas }: LockedScreenProps) {
  const planConfig = PLAN_CONFIGS[requiredPlan];
  const waMsg = buildWaMessage(title, reason, requiredPlan);
  const waUrl1 = `https://wa.me/${WA_TRIAL_NUMBER}?text=${waMsg}`;
  const waUrl2 = `https://wa.me/${WA_TRIAL_NUMBER_2}?text=${waMsg}`;

  const fallback = genericPas(title, description, highlights);
  const problemTitle = pas?.problemTitle ?? fallback.problemTitle;
  const problemBody = pas?.problemBody ?? fallback.problemBody;
  const agitateBody = pas?.agitateBody ?? fallback.agitateBody;
  const desireBody = pas?.desireBody ?? fallback.desireBody;
  const stats = pas?.stats ?? fallback.stats;
  const faqs = pas?.faqs ?? fallback.faqs;
  const proofNote = pas?.proofNote;

  const CtaButtons = ({ testidSuffix }: { testidSuffix: string }) => (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {reason === "auth" ? (
        <>
          <a href="/login">
            <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid={`button-login-access-${testidSuffix}`}>
              <LogIn className="h-4 w-4" />
              Masuk untuk Akses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <Link href="/pricing">
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" data-testid={`button-see-pricing-${testidSuffix}`}>
              <Star className="h-4 w-4" />
              Lihat Paket
            </Button>
          </Link>
        </>
      ) : (
        <>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="gap-2 w-full sm:w-auto"
              style={{ backgroundColor: planConfig.color }}
              data-testid={`button-upgrade-premium-${testidSuffix}`}
            >
              <Zap className="h-4 w-4" />
              Upgrade ke {planConfig.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/my-subscription">
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" data-testid={`button-my-subscription-${testidSuffix}`}>
              <Crown className="h-4 w-4" />
              Paket Saya
            </Button>
          </Link>
        </>
      )}
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      <div className="flex-1 px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-14">

          {/* ── Attention: Hero ─────────────────────────────────────── */}
          <div className="text-center space-y-8">
            <div className="relative flex justify-center">
              <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center text-4xl shadow-lg">
                {icon ?? <Bot className="h-12 w-12 text-muted-foreground" />}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
            </div>

            <div className="space-y-3">
              <Badge
                className="gap-1.5 px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${planConfig.color}15`,
                  color: planConfig.color,
                  border: `1px solid ${planConfig.color}30`,
                }}
              >
                <Crown className="h-3.5 w-3.5" />
                {reason === "auth" ? "Login Diperlukan" : `Perlu Paket ${planConfig.name}`}
              </Badge>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
            </div>

            {stats.length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 pt-1">
                {stats.map((s, i) => (
                  <div key={i} className="text-center" data-testid={`stat-guard-${i}`}>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Problem → Agitate ───────────────────────────────────── */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3 text-left">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider">{problemTitle}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{problemBody}</p>
            <div className="flex items-start gap-2 pt-1 border-t border-amber-500/20 mt-1">
              <Flame className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{agitateBody}</p>
            </div>
          </div>

          {/* ── Solution: fitur/highlights ──────────────────────────── */}
          {highlights.length > 0 && (
            <div className="bg-muted/40 rounded-2xl p-6 text-left space-y-3 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bagaimana {title} membantu:</p>
              <ul className="space-y-2.5">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Desire ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider">Setelah pakai {title}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{desireBody}</p>
            {proofNote && (
              <div className="flex items-start gap-2 pt-2 mt-2 border-t border-emerald-500/20">
                <BadgeCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{proofNote}</p>
              </div>
            )}
          </div>

          {/* ── Action: harga & CTA utama ───────────────────────────── */}
          <div className="text-center space-y-6">
            <CtaButtons testidSuffix="top" />

            {/* Trial via WhatsApp */}
            <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-5 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Ingin coba trial dulu? Hubungi kami langsung
                </p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400">
                Kami siapkan akses trial untuk Anda — cukup kirim pesan, admin akan aktifkan dalam hitungan jam.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a href={waUrl1} onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    className="gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-wa-trial-1"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    081287941900
                  </Button>
                </a>
                <a href={waUrl2} onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 w-full sm:w-auto border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
                    data-testid="button-wa-trial-2"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    082299417818
                  </Button>
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {reason === "auth"
                ? "Sudah punya akun? Masuk sekarang. Belum punya? Daftar gratis, lalu hubungi kami untuk trial."
                : `Saat ini Anda di paket gratis. Upgrade ke ${planConfig.name} (Rp ${planConfig.monthlyFee.toLocaleString("id")}/bln) atau minta trial via WhatsApp.`}
            </p>
          </div>

          {/* ── FAQ ─────────────────────────────────────────────────── */}
          {faqs.length > 0 && (
            <div className="text-left space-y-3">
              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">Pertanyaan yang sering ditanyakan</p>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} data-testid={`faq-item-${i}`}>
                    <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* ── Final CTA ───────────────────────────────────────────── */}
          <div className="text-center space-y-4 pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">Siap mulai dengan {title}?</p>
            <CtaButtons testidSuffix="bottom" />
          </div>

        </div>
      </div>
    </div>
  );
}
