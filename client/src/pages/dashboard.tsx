import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  Bot, BookOpen, Plug, MessageSquare, Plus, ChevronDown, ChevronRight, ArrowLeft, Settings, BarChart3,
  Lightbulb, Wrench, Sparkles, User, PanelLeftClose, PanelLeft, Menu, Home, X, Palette, Network, Brain, Blocks,
  ShoppingBag, Users, Handshake, TrendingUp, Users2, Ticket, Pencil, Trash2, Radio, FileText, FolderOpen, Target, Globe, Megaphone, Loader2, PackageCheck, Wand2, Scale,
  Download, Upload, Folder, FolderPlus, Power, PowerOff, Cpu, Archive, ArchiveRestore, Eye, EyeOff, Crown, AlertCircle, Rocket, CheckCircle2, GraduationCap, DatabaseZap, UserPlus, Share2,
  Award, Shield, ShieldCheck, ShieldAlert, Leaf, Search, HardHat, Building2, Construction, Map as MapIcon, Landmark, Calculator, Package,
  FileSignature, GitBranch, Lock, FileDown, ArrowRight, Wallet, Trophy
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { usePartnerBranding } from "@/hooks/use-partner-branding";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { PersonaPanel } from "@/components/panels/persona-panel";
import { KnowledgeBasePanel } from "@/components/panels/knowledge-base-panel";
import { IntegrationsPanel } from "@/components/panels/integrations-panel";
import { ChatConsolePanel } from "@/components/panels/chat-console-panel";
import { AnalyticsPanel } from "@/components/panels/analytics-panel";
import { WidgetPanel } from "@/components/panels/widget-panel";
import { AgenticAIPanel } from "@/components/panels/agentic-ai-panel";
import { PolicyPanel } from "@/components/panels/policy-panel";
import { ProjectBrainPanel } from "@/components/panels/project-brain-panel";
import { MiniAppsPanel } from "@/components/panels/mini-apps-panel";
import { DeliverablesPanel } from "@/components/panels/deliverables-panel";
import { ProductSettingsPanel } from "@/components/panels/product-settings-panel";
import { RevenuPanel } from "@/components/panels/revenue-panel";
import { AffiliatePanel } from "@/components/panels/affiliate-panel";
import { VoucherPanel } from "@/components/panels/voucher-panel";
import { BroadcastPanel } from "@/components/panels/broadcast-panel";
import { TenderPanel } from "@/components/panels/tender-panel";
import { ConversionPanel } from "@/components/panels/conversion-panel";
import { LandingPagePanel } from "@/components/panels/landing-page-panel";
import { MarketingPanel } from "@/components/panels/marketing-panel";
import { AdminAgentsPanel } from "@/components/panels/admin-agents-panel";
import { StudioPanel } from "@/components/panels/studio-panel";
import { EkosistemPanel } from "@/components/panels/ekosistem-panel";
import { TrialLockOverlay } from "@/components/trial-lock-overlay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateAgentDialog } from "@/components/dialogs/create-agent-dialog";
import { CreateBigIdeaDialog } from "@/components/dialogs/create-big-idea-dialog";
import { GenerateBigIdeasDialog } from "@/components/dialogs/generate-big-ideas-dialog";
import { CreateToolboxDialog } from "@/components/dialogs/create-toolbox-dialog";
import { EditBigIdeaDialog } from "@/components/dialogs/edit-big-idea-dialog";
import { EditToolboxDialog } from "@/components/dialogs/edit-toolbox-dialog";
import { UserProfileDialog } from "@/components/dialogs/user-profile-dialog";
import { ShareAgentDialog } from "@/components/dialogs/share-agent-dialog";
import { ChatPopup } from "@/components/chat-popup";
import { SeriesManagementDialog } from "@/components/series-management-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useAgents, useActiveAgent, useSetActiveAgent, useDeleteAgent } from "@/hooks/use-agents";
import { useBigIdeas, useActiveBigIdea, useActivateBigIdea, useDeleteBigIdea } from "@/hooks/use-big-ideas";
import { useToolboxes, useActiveToolbox, useActivateToolbox, useDeleteToolbox, useOrchestratorToolbox, useCreateToolbox } from "@/hooks/use-toolboxes";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Agent, BigIdea, Toolbox } from "@shared/schema";

type NavItem = "persona" | "policy" | "knowledge" | "integrations" | "widget" | "chat" | "analytics" | "agentic" | "project-brain" | "mini-apps" | "deliverables" | "product-settings" | "revenue" | "affiliates" | "vouchers" | "broadcast" | "tenders" | "conversion" | "landing-page" | "marketing" | "studio" | "ekosistem" | "admin-agents";

const navItems: { id: NavItem; label: string; shortLabel: string; icon: typeof Bot }[] = [
  { id: "persona", label: "Persona", shortLabel: "Persona", icon: Bot },
  { id: "policy", label: "Kebijakan Agen", shortLabel: "Kebijakan", icon: BookOpen },
  { id: "agentic", label: "Agentic AI", shortLabel: "AI", icon: Sparkles },
  { id: "knowledge", label: "Knowledge Base", shortLabel: "KB", icon: BookOpen },
  { id: "project-brain", label: "Otak Proyek", shortLabel: "Brain", icon: Brain },
  { id: "mini-apps", label: "Mini Apps", shortLabel: "Apps", icon: Blocks },
  { id: "deliverables", label: "Deliverables", shortLabel: "Output", icon: PackageCheck },
  { id: "studio", label: "Studio Kompetensi", shortLabel: "Studio", icon: Wand2 },
  { id: "ekosistem", label: "Ekosistem Kompetensi", shortLabel: "Ekosistem", icon: Network },
  { id: "integrations", label: "Integrations", shortLabel: "Integ", icon: Plug },
  { id: "widget", label: "Widget", shortLabel: "Widget", icon: Palette },
  { id: "broadcast", label: "Broadcast WA", shortLabel: "Broadcast", icon: Radio },
  { id: "tenders", label: "Info Tender", shortLabel: "Tender", icon: FileText },
  { id: "conversion", label: "Conversion", shortLabel: "Convert", icon: Target },
  { id: "landing-page", label: "Rangkuman Chatbot", shortLabel: "Rangkuman", icon: Globe },
  { id: "marketing", label: "Brief Marketing", shortLabel: "Brief", icon: Megaphone },
  { id: "product-settings", label: "Monetisasi", shortLabel: "Produk", icon: ShoppingBag },
  { id: "revenue", label: "Revenue & Klien", shortLabel: "Revenue", icon: TrendingUp },
  { id: "affiliates", label: "Afiliasi", shortLabel: "Afiliasi", icon: Users2 },
  { id: "vouchers", label: "Voucher", shortLabel: "Voucher", icon: Ticket },
  { id: "chat", label: "Chat Console", shortLabel: "Chat", icon: MessageSquare },
  { id: "analytics", label: "Analytics", shortLabel: "Stats", icon: BarChart3 },
];

function TrialQuotaBanner() {
  const { partner } = usePartnerBranding();
  const { data, isLoading } = useQuery<{
    hasActiveTrial: boolean;
    trialMessagesUsed: number;
    trialMessagesQuota: number;
    trialMessagesRemaining: number;
    trialEndsAt?: string;
    dialogCompleted: boolean;
  }>({ queryKey: ["/api/trial/status"], retry: 1 });

  if (isLoading || !data) return null;

  if (!data.hasActiveTrial) {
    if (!data.dialogCompleted) {
      return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-500 shrink-0" />
            <span className="text-muted-foreground">Selesaikan <strong>{partner ? "Dialog Blueprint" : "Dialog Gustafta"}</strong> untuk aktifkan trial gratis (75 pesan)</span>
          </div>
          <Link href="/konsultasi">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
              <MessageSquare className="h-3 w-3" /> Mulai Dialog
            </Button>
          </Link>
        </div>
      );
    }
    return null;
  }

  const used = data.trialMessagesUsed;
  const quota = data.trialMessagesQuota;
  const pct = Math.min(100, Math.round((used / quota) * 100));
  const isNearLimit = pct >= 80;
  const daysLeft = data.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className={`px-4 py-3 rounded-xl border text-sm space-y-2 ${isNearLimit ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className={`h-4 w-4 shrink-0 ${isNearLimit ? "text-amber-500" : "text-emerald-500"}`} />
          <span>
            <strong>Trial Aktif</strong>
            {daysLeft !== null && <span className="text-muted-foreground ml-1">· {daysLeft} hari lagi</span>}
          </span>
        </div>
        <span className={`text-xs font-medium ${isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {used}/{quota} pesan
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isNearLimit && !partner && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Kuota hampir habis — upgrade untuk akses penuh</span>
          <Link href="/onboarding">
            <Button size="sm" className="h-6 text-xs gap-1">
              <Crown className="h-3 w-3" /> Upgrade
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

const BLUEPRINT_STORAGE_KEY = "gustafta_blueprint_pending";

function BlueprintPendingBanner() {
  const { partner } = usePartnerBranding();
  const [bp, setBp] = useState<{ namaAI: string; domain: string; status?: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BLUEPRINT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status !== "unlocked" && parsed.status !== "imported") setBp(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  if (!bp || dismissed || partner) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 shrink-0">
        <FileDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Blueprint AI siap — belum diaktivasi</p>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
          <strong>{bp.namaAI}</strong> · {bp.domain} — Pilih paket untuk unlock Blueprint lengkap dan import ke Builder.
        </p>
        <div className="flex gap-2 mt-2">
          <Link href="/blueprint-saya">
            <Button size="sm" className="h-7 text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white">
              <Lock className="h-3 w-3" /> Lihat Blueprint
            </Button>
          </Link>
          <Link href="/packs">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
              <ShoppingBag className="h-3 w-3" /> Pilih Paket
            </Button>
          </Link>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 mt-0.5"
        title="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function BlueprintUpsellBanner() {
  const { partner } = usePartnerBranding();
  const { data } = useQuery<{
    hasActiveTrial: boolean;
    dialogCompleted: boolean;
  }>({ queryKey: ["/api/trial/status"], retry: 1 });

  if (!data?.hasActiveTrial || partner) return null;

  const LOCKED_FEATURES = [
    "Multi-Agent Orchestration",
    "Custom Domain",
    "Knowledge Base Penuh",
    "Revenue & Monetisasi",
    "Mini Apps (45 tools)",
    "Analytics Lengkap",
  ];

  return (
    <div className="px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/5 text-sm space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
        <span className="font-medium text-violet-700 dark:text-violet-300">
          Blueprint Anda punya {LOCKED_FEATURES.length} fitur lagi yang belum terbuka
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {LOCKED_FEATURES.join(" · ")}
      </p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">Upgrade sekarang untuk akses penuh</span>
        <Link href="/onboarding">
          <Button size="sm" className="h-6 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white">
            <Crown className="h-3 w-3" /> Lihat Paket
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PlanStatusBanner() {
  const { partner } = usePartnerBranding();
  const { planInfo, isLoading } = useFeatureAccess();
  if (isLoading || planInfo.status === "unauthenticated") return null;

  const isActive = planInfo.status === "active";
  const isPaid = planInfo.tier > 0;

  if (isActive && isPaid) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span>Paket <strong>{planInfo.config.name}</strong> aktif
            {planInfo.daysRemaining !== null && planInfo.daysRemaining <= 14 && (
              <span className="text-amber-500 ml-1">· {planInfo.daysRemaining} hari tersisa</span>
            )}
          </span>
        </div>
        <Link href="/my-subscription">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-green-600 dark:text-green-400">
            <Crown className="h-3 w-3" /> Detail
          </Button>
        </Link>
      </div>
    );
  }

  if (planInfo.status === "pending") {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Paket <strong>{planInfo.config.name}</strong> menunggu konfirmasi pembayaran</span>
        </div>
        <Link href="/my-subscription">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600 dark:text-amber-400 gap-1">
            <Crown className="h-3 w-3" /> Status
          </Button>
        </Link>
      </div>
    );
  }

  if (partner) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">Belum berlangganan — <strong>upgrade</strong> untuk akses penuh Gustafta Apps</span>
      </div>
      <Link href="/onboarding">
        <Button size="sm" className="h-7 text-xs gap-1">
          <Crown className="h-3 w-3" /> Pilih Paket
        </Button>
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { partner } = usePartnerBranding();
  const [activeNav, setActiveNav] = useState<NavItem>("persona");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createAsOrchestrator, setCreateAsOrchestrator] = useState(false);
  const [hubDialogOpen, setHubDialogOpen] = useState(false);
  const [hubName, setHubName] = useState("");
  const [hubDescription, setHubDescription] = useState("");
  const [modulOrchDialogOpen, setModulOrchDialogOpen] = useState(false);
  const [modulOrchName, setModulOrchName] = useState("");
  const [modulOrchDescription, setModulOrchDescription] = useState("");
  const [bigIdeaDialogOpen, setBigIdeaDialogOpen] = useState(false);
  const [generateBigIdeasOpen, setGenerateBigIdeasOpen] = useState(false);
  const [toolboxDialogOpen, setToolboxDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editBigIdeaDialogOpen, setEditBigIdeaDialogOpen] = useState(false);
  const [editingBigIdea, setEditingBigIdea] = useState<BigIdea | null>(null);
  const [editToolboxDialogOpen, setEditToolboxDialogOpen] = useState(false);
  const [editingToolbox, setEditingToolbox] = useState<Toolbox | null>(null);
  const [deleteBigIdeaConfirm, setDeleteBigIdeaConfirm] = useState<BigIdea | null>(null);
  const [deleteToolboxConfirm, setDeleteToolboxConfirm] = useState<Toolbox | null>(null);
  const [deleteAgentConfirm, setDeleteAgentConfirm] = useState<Agent | null>(null);
  const [editSeriesTarget, setEditSeriesTarget] = useState<any | null>(null);
  const [editSeriesName, setEditSeriesName] = useState("");
  const [editSeriesDesc, setEditSeriesDesc] = useState("");
  const [deleteSeriesConfirm, setDeleteSeriesConfirm] = useState<any | null>(null);
  const [editAgentTarget, setEditAgentTarget] = useState<Agent | null>(null);
  const [shareAgentTarget, setShareAgentTarget] = useState<Agent | null>(null);
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentDesc, setEditAgentDesc] = useState("");
  const [folderDialogAgent, setFolderDialogAgent] = useState<Agent | null>(null);
  const [folderDialogName, setFolderDialogName] = useState("");
  const [exportingAgentId, setExportingAgentId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [premiumGroupOpen, setPremiumGroupOpen] = useState(false);
  const [biasaGroupOpen, setBiasaGroupOpen] = useState(false);
  const [shortcutBiasaOpen, setShortcutBiasaOpen] = useState(false);
  const [shortcutPremiumOpen, setShortcutPremiumOpen] = useState(false);
  const [openShortcutSections, setOpenShortcutSections] = useState<Set<string>>(new Set());
  const [collapsedRegularGroups, setCollapsedRegularGroups] = useState<Set<string>>(new Set());

  // Penjelasan singkat beda Chatbot Biasa vs Premium (dipakai di beberapa level navigasi)
  const biasaPremiumInfo = (
    <div className="mb-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground" data-testid="info-biasa-premium">
      <p className="mb-1"><span className="font-semibold text-blue-600 dark:text-blue-400">Chatbot Biasa</span> = 1 chatbot untuk 1 tugas, Anda rakit sendiri.</p>
      <p><span className="font-semibold text-purple-600 dark:text-purple-400">Chatbot Premium</span> = 1 tim agen (orkestrator) yang menggerakkan banyak spesialis sekaligus.</p>
    </div>
  );

  const toggleShortcutSection = (key: string) => {
    setOpenShortcutSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const renderShortcutSection = (key: string, label: string) => (
    <button
      onClick={() => toggleShortcutSection(key)}
      className="w-full flex items-center gap-1.5 rounded-md px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors"
      data-testid={`toggle-shortcut-section-${key}`}
    >
      {openShortcutSections.has(key) ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
  
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { planInfo } = useFeatureAccess();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Akses Ditolak",
        description: "Silakan login terlebih dahulu...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);
  
  const { data: adminMe } = useQuery<{ isAdmin: boolean; isSuperAdmin: boolean; role: string }>({ queryKey: ["/api/admin/me"] });
  const isAdminUser = adminMe?.isAdmin === true;
  const { data: activeAgent } = useActiveAgent();
  const setActiveAgent = useSetActiveAgent();
  const agentCreationCooldown = useRef(false);
  const bigIdeaCreationCooldown = useRef(false);
  const toolboxCreationCooldown = useRef(false);
  const forceOrchestratorSelect = useRef(false);
  type HierarchyLevel = 'series' | 'bigIdeas' | 'toolboxes' | 'agents';
  const [navLevel, setNavLevel] = useState<HierarchyLevel>('series');
  const [navInitialized, setNavInitialized] = useState(false);
  
  const { data: allSeries = [] } = useQuery<any[]>({ queryKey: ["/api/series"] });
  const { data: activeDomains = [] } = useQuery<any[]>({ queryKey: ["/api/domains"], select: (d: any[]) => d.filter((x: any) => x.status === "active") });
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const activeSeries = allSeries.find((s: any) => String(s.id) === activeSeriesId) || null;
  
  const { data: bigIdeas = [] } = useBigIdeas();
  const { data: activeBigIdea } = useActiveBigIdea();
  const activateBigIdea = useActivateBigIdea();

  const [localBigIdeaId, setLocalBigIdeaId] = useState<string | undefined>();
  const [localToolboxId, setLocalToolboxId] = useState<string | undefined>();
  const [localAgentId, setLocalAgentId] = useState<string | undefined>();

  // BigIdea yang valid untuk konteks series aktif saat ini (lokal dulu, lalu API)
  const contextBigIdea = (() => {
    if (localBigIdeaId) {
      const local = (bigIdeas as BigIdea[]).find(bi => String(bi.id) === localBigIdeaId);
      if (local && activeSeriesId && String(local.seriesId) === activeSeriesId) return local;
    }
    if (activeBigIdea && activeSeriesId && String(activeBigIdea.seriesId) === activeSeriesId) return activeBigIdea;
    return null;
  })();
  // Alias untuk kompatibilitas kode yang sudah ada
  const activeBigIdeaInCurrentSeries = contextBigIdea;
  const effectiveBigIdeaId = contextBigIdea?.id;
  const effectiveBigIdeaObj = contextBigIdea;

  useEffect(() => {
    if (activeBigIdea?.id && localBigIdeaId && String(activeBigIdea.id) === localBigIdeaId) {
      setLocalBigIdeaId(undefined);
    }
  }, [activeBigIdea?.id, localBigIdeaId]);

  useEffect(() => {
    if (activeBigIdea?.seriesId && allSeries.length > 0) {
      const seriesIdStr = String(activeBigIdea.seriesId);
      if (activeSeriesId !== seriesIdStr) {
        setActiveSeriesId(seriesIdStr);
      }
    } else if (activeBigIdea && !activeBigIdea.seriesId) {
      setActiveSeriesId(null);
    }
  }, [activeBigIdea?.id, activeBigIdea?.seriesId, allSeries.length]);
  
  const filteredBigIdeas = activeSeriesId
    ? bigIdeas.filter((bi: any) => String(bi.seriesId) === activeSeriesId)
    : bigIdeas;

  const updateSeriesMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name: string; description?: string }) => {
      const res = await apiRequest("PATCH", `/api/series/${id}`, { name, description });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      setEditSeriesTarget(null);
      toast({ title: "Series berhasil diperbarui" });
    },
    onError: () => toast({ title: "Gagal memperbarui", variant: "destructive" }),
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/series/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      setDeleteSeriesConfirm(null);
      if (activeSeriesId === String(deleteSeriesConfirm?.id)) setActiveSeriesId(null);
      toast({ title: "Series berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const res = await apiRequest("PATCH", `/api/agents/${id}`, { name, description });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setEditAgentTarget(null);
      toast({ title: "Alat Bantu berhasil diperbarui" });
    },
    onError: () => toast({ title: "Gagal memperbarui", variant: "destructive" }),
  });

  const toggleAgentEnabledMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/agents/${id}/toggle-enabled`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: data.isEnabled ? "Chatbot diaktifkan" : "Chatbot dinonaktifkan" });
    },
    onError: () => toast({ title: "Gagal mengubah status chatbot", variant: "destructive" }),
  });

  const setFolderMutation = useMutation({
    mutationFn: async ({ id, folderName }: { id: string; folderName: string | null }) => {
      const res = await apiRequest("PATCH", `/api/agents/${id}/folder`, { folderName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setFolderDialogAgent(null);
      toast({ title: "Folder berhasil diperbarui" });
    },
    onError: () => toast({ title: "Gagal memperbarui folder", variant: "destructive" }),
  });

  const archiveAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/agents/${id}/archive`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/archived"] });
      toast({ title: data.archived ? "Chatbot diarsipkan" : "Chatbot dipulihkan dari arsip" });
    },
    onError: () => toast({ title: "Gagal mengarsipkan chatbot", variant: "destructive" }),
  });

  const handleExportAgent = async (agentId: string, agentName: string) => {
    try {
      setExportingAgentId(agentId);
      const res = await fetch(`/api/agents/${agentId}/export?download=true`);
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeAgentName = agentName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 40);
      a.download = `gustafta_agent_${safeAgentName}_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Konfigurasi berhasil diexport" });
    } catch {
      toast({ title: "Gagal mengexport konfigurasi", variant: "destructive" });
    } finally {
      setExportingAgentId(null);
    }
  };

  const handleImportAgent = async () => {
    if (!importFile) return;
    try {
      setImportLoading(true);
      const text = await importFile.text();
      const config = JSON.parse(text);
      const res = await apiRequest("POST", "/api/agents/import", { config, toolboxId: effectiveToolboxId });
      if (!res.ok) throw new Error("Import gagal");
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setImportDialogOpen(false);
      setImportFile(null);
      toast({ title: "Konfigurasi berhasil diimport" });
    } catch {
      toast({ title: "Gagal mengimport konfigurasi. Pastikan file JSON valid.", variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleSeriesSelect = (seriesId: string | null) => {
    if (bigIdeaCreationCooldown.current) return;
    setActiveSeriesId(seriesId);
    setLocalBigIdeaId(undefined);
    setLocalToolboxId(undefined);
    if (seriesId !== null) {
      const filtered = bigIdeas.filter((bi: any) => String(bi.seriesId) === seriesId);
      if (activeBigIdea) {
        const belongsToSeries = String(activeBigIdea.seriesId) === seriesId;
        if (!belongsToSeries && filtered.length > 0) {
          activateBigIdea.mutate(String(filtered[0].id));
        }
      } else if (filtered.length > 0) {
        activateBigIdea.mutate(String(filtered[0].id));
      }
    }
  };
  
  const deleteBigIdea = useDeleteBigIdea();
  const deleteAgent = useDeleteAgent();
  
  const { data: toolboxes = [] } = useToolboxes(effectiveBigIdeaId);
  const { data: orchestratorHub } = useOrchestratorToolbox(activeSeriesId);
  const { data: activeToolbox } = useActiveToolbox();
  const activateToolbox = useActivateToolbox();
  const deleteToolbox = useDeleteToolbox();
  const createToolboxMutation = useCreateToolbox();

  // Validasi activeToolbox milik series/modul yang aktif
  const activeToolboxInContext = (() => {
    if (!activeToolbox || !activeSeriesId) return null;
    if (activeToolbox.isOrchestrator && String(activeToolbox.seriesId) === activeSeriesId) return activeToolbox;
    if (effectiveBigIdeaId && String(activeToolbox.bigIdeaId) === String(effectiveBigIdeaId)) return activeToolbox;
    return null;
  })();
  const effectiveToolboxId = localToolboxId || activeToolboxInContext?.id;
  const shouldFetchAgents = !!effectiveToolboxId;
  const { data: agents = [], isLoading: agentsLoading } = useAgents(shouldFetchAgents ? effectiveToolboxId : undefined);
  const filteredAgents = shouldFetchAgents ? agents : [];

  // All user agents (no toolbox filter) — used for setup checklist on home screen
  const { data: allUserAgents = [] } = useQuery<any[]>({
    queryKey: ["/api/agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Demo agent — shown in sidebar when user has no agents
  const { data: demoAgent } = useQuery<{ id: number; name: string; description: string; emoji?: string; color?: string } | null>({
    queryKey: ["/api/agents/demo"],
    queryFn: async () => {
      const res = await fetch("/api/agents/demo", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: archivedAgents = [] } = useQuery<any[]>({
    queryKey: ["/api/agents/archived"],
    queryFn: async () => {
      const res = await fetch("/api/agents/archived", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch archived agents");
      return res.json();
    },
    enabled: showArchived,
  });

  const { data: profile } = useProfile();

  useEffect(() => {
    if (activeToolbox?.id && localToolboxId && String(activeToolbox.id) === localToolboxId) {
      setLocalToolboxId(undefined);
    }
  }, [activeToolbox?.id, localToolboxId]);

  useEffect(() => {
    if (activeAgent?.id && localAgentId && String(activeAgent.id) === localAgentId) {
      setLocalAgentId(undefined);
    }
  }, [activeAgent?.id, localAgentId]);

  // Deep-link ke agen tertentu via ?agent=<id> (mis. dari notice "Anda kini punya
  // akses agen baru"). Pakai state lokal saja (tanpa /activate yang owner-only),
  // sehingga kolaborator pun bisa langsung membuka agen yang dibagikan.
  const agentDeepLinkHandled = useRef(false);
  useEffect(() => {
    if (agentDeepLinkHandled.current) return;
    const wantAgentId = new URLSearchParams(window.location.search).get("agent");
    if (!wantAgentId) return;
    if (!allUserAgents || allUserAgents.length === 0) return;
    const target = allUserAgents.find((a: any) => String(a.id) === String(wantAgentId));
    agentDeepLinkHandled.current = true;
    if (target) {
      if ((target as any).toolboxId) {
        setLocalToolboxId(String((target as any).toolboxId));
      }
      setLocalAgentId(String(wantAgentId));
      setNavLevel('agents');
    }
    // Bersihkan query param agar refresh tidak memicu ulang seleksi.
    const url = new URL(window.location.href);
    url.searchParams.delete("agent");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [allUserAgents]);

  useEffect(() => {
    if (bigIdeaCreationCooldown.current) return;
    if (toolboxCreationCooldown.current) return;
    if (localToolboxId) return;
    // Hanya auto-select jika BigIdea aktif benar-benar milik series saat ini
    if (!contextBigIdea || toolboxes.length === 0) return;
    // Don't auto-switch if user intentionally navigated into the Series-level Hub
    if (navLevel === 'agents' && activeToolboxInContext?.id && orchestratorHub?.id && String(activeToolboxInContext.id) === String(orchestratorHub.id)) return;
    if (!activeToolboxInContext) {
      activateToolbox.mutate(String(toolboxes[0].id));
    } else {
      const toolboxBelongs = toolboxes.some((tb) => tb.id === activeToolboxInContext.id);
      if (!toolboxBelongs) {
        activateToolbox.mutate(String(toolboxes[0].id));
      }
    }
  }, [contextBigIdea?.id, toolboxes, activeToolboxInContext?.id, orchestratorHub?.id, navLevel]);

  useEffect(() => {
    if (!effectiveToolboxId || filteredAgents.length === 0) return;
    if (agentCreationCooldown.current) return;
    if (toolboxCreationCooldown.current) return;
    if (bigIdeaCreationCooldown.current) return;
    if (navLevel !== 'agents') return;

    if (forceOrchestratorSelect.current) {
      forceOrchestratorSelect.current = false;
      const orchestratorAgent = filteredAgents.find(a => a.isOrchestrator);
      if (orchestratorAgent) {
        if (String(activeAgent?.id) !== String(orchestratorAgent.id)) {
          setLocalAgentId(String(orchestratorAgent.id));
          setActiveAgent.mutate(String(orchestratorAgent.id));
        }
        return;
      }
    }

    // Hanya skip jika orkestrator aktif memang milik context saat ini
    if (activeAgent?.isOrchestrator) {
      const orchestratorBelongs = filteredAgents.some(a => String(a.id) === String(activeAgent.id));
      if (orchestratorBelongs) return;
    }

    // Juga skip jika localAgentId sudah diset (menghindari dobel-select)
    if (localAgentId && filteredAgents.some(a => String(a.id) === localAgentId)) return;

    const pickDefault = () => {
      const orchestratorAgent = filteredAgents.find(a => a.isOrchestrator);
      return orchestratorAgent || filteredAgents[0];
    };

    if (!activeAgent) {
      const def = pickDefault();
      setLocalAgentId(String(def.id));
      setActiveAgent.mutate(String(def.id));
    } else {
      const agentBelongs = filteredAgents.some((a) => String(a.id) === String(activeAgent.id));
      if (!agentBelongs) {
        const def = pickDefault();
        setLocalAgentId(String(def.id));
        setActiveAgent.mutate(String(def.id));
      }
    }
  }, [effectiveToolboxId, filteredAgents, activeAgent?.id, navLevel, localAgentId]);

  useEffect(() => {
    if (navInitialized) return;
    if (allSeries.length === 0) return;
    if (!activeSeriesId) return;
    if (contextBigIdea && activeToolboxInContext && filteredAgents.length > 0) {
      setNavLevel('agents');
      setNavInitialized(true);
    } else if (contextBigIdea && toolboxes.length > 0) {
      setNavLevel('toolboxes');
      setNavInitialized(true);
    } else if (contextBigIdea) {
      setNavLevel('bigIdeas');
      setNavInitialized(true);
    } else {
      setNavLevel('bigIdeas');
      setNavInitialized(true);
    }
  }, [navInitialized, allSeries.length, activeSeriesId, contextBigIdea?.id, activeToolboxInContext?.id, toolboxes.length, filteredAgents.length]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  const handleAgentSelect = (agent: Agent) => {
    setLocalAgentId(String(agent.id));
    setActiveAgent.mutate(String(agent.id));
  };

  const handleBigIdeaSelect = (bigIdea: BigIdea) => {
    activateBigIdea.mutate(String(bigIdea.id));
  };

  const handleToolboxSelect = (toolbox: Toolbox) => {
    activateToolbox.mutate(String(toolbox.id));
  };

  const handleEditBigIdea = (bi: BigIdea) => {
    setEditingBigIdea(bi);
    setEditBigIdeaDialogOpen(true);
  };

  const handleDeleteBigIdea = async (bi: BigIdea) => {
    try {
      await deleteBigIdea.mutateAsync(String(bi.id));
      toast({ title: "Berhasil", description: `Modul "${bi.name}" berhasil dihapus` });
      setDeleteBigIdeaConfirm(null);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus Modul", variant: "destructive" });
    }
  };

  const handleEditToolbox = (tb: Toolbox) => {
    setEditingToolbox(tb);
    setEditToolboxDialogOpen(true);
  };

  const handleDeleteToolbox = async (tb: Toolbox) => {
    try {
      await deleteToolbox.mutateAsync(String(tb.id));
      toast({ title: "Berhasil", description: `Chatbot "${tb.name}" berhasil dihapus` });
      setDeleteToolboxConfirm(null);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus Chatbot", variant: "destructive" });
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      await deleteAgent.mutateAsync(String(agent.id));
      toast({ title: "Berhasil", description: `Alat Bantu "${agent.name}" berhasil dihapus` });
      setDeleteAgentConfirm(null);
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus Alat Bantu", variant: "destructive" });
    }
  };

  const handleCreateHub = async () => {
    if (!hubName.trim() || !activeSeriesId) return;
    try {
      await createToolboxMutation.mutateAsync({
        seriesId: activeSeriesId,
        isOrchestrator: true,
        name: hubName.trim(),
        description: hubDescription.trim(),
        purpose: "",
        capabilities: [],
        limitations: [],
        sortOrder: 0,
      });
      setHubDialogOpen(false);
      setHubName("");
      setHubDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes/orchestrator"] });
      toast({ title: "Berhasil", description: "Chatbot Orkestrator berhasil dibuat" });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Gagal membuat Chatbot Orkestrator", variant: "destructive" });
    }
  };

  const handleCreateModulOrchestrator = async () => {
    if (!modulOrchName.trim() || !activeBigIdeaInCurrentSeries) return;
    let newToolboxId: number | null = null;
    try {
      const newToolbox = await createToolboxMutation.mutateAsync({
        bigIdeaId: activeBigIdeaInCurrentSeries.id,
        seriesId: activeSeriesId || undefined,
        isOrchestrator: false,
        name: modulOrchName.trim(),
        description: modulOrchDescription.trim(),
        purpose: "Orkestrator untuk Modul " + activeBigIdeaInCurrentSeries.name,
        capabilities: [],
        limitations: [],
        sortOrder: 0,
      });
      newToolboxId = newToolbox.id;
      await apiRequest("POST", "/api/agents", {
        name: modulOrchName.trim(),
        description: modulOrchDescription.trim() || `Orkestrator untuk ${activeBigIdeaInCurrentSeries.name}`,
        toolboxId: newToolbox.id,
        bigIdeaId: activeBigIdeaInCurrentSeries.id,
        isOrchestrator: true,
        orchestratorRole: "orchestrator",
        isActive: true,
        isPublic: true,
      });
      setModulOrchDialogOpen(false);
      setModulOrchName("");
      setModulOrchDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Berhasil", description: "Orkestrator Modul berhasil dibuat" });
    } catch (error: any) {
      if (newToolboxId) {
        try { await apiRequest("DELETE", `/api/toolboxes/${newToolboxId}`); } catch {}
        queryClient.invalidateQueries({ queryKey: ["/api/toolboxes"] });
      }
      toast({ title: "Error", description: error?.message || "Gagal membuat Orkestrator Modul", variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentToolbox = localToolboxId
    ? ([...toolboxes, orchestratorHub].find(tb => tb && String(tb.id) === localToolboxId) || activeToolboxInContext)
    : activeToolboxInContext;
  const isCurrentToolboxHub = currentToolbox?.isOrchestrator === true;

  // Agent hanya valid jika memang milik filteredAgents toolbox aktif saat ini
  // localAgentId memberi respons instan seperti localToolboxId
  const currentAgent = (() => {
    if (localAgentId) {
      const local = filteredAgents.find(a => String(a.id) === localAgentId);
      if (local) return local;
    }
    if (activeAgent && filteredAgents.some(a => String(a.id) === String(activeAgent.id))) return activeAgent;
    return null;
  })();

  const renderPanel = () => {
    if (!currentAgent) {
      if (filteredAgents.length > 0 || agentsLoading) {
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Memuat...</p>
            </div>
          </div>
        );
      }
      if (isCurrentToolboxHub && currentToolbox) {
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4 md:space-y-6 max-w-lg">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
                <Network className="w-8 h-8 md:w-10 md:h-10 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground">{currentToolbox.name}</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  {currentToolbox.description || "Chatbot Orkestrator (HUB) mengoordinasikan semua chatbot spesialis dalam ekosistem ini."}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Buat Alat Bantu pertama untuk mulai mengatur persona dan fungsi orkestrasi HUB Anda.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Alat Bantu HUB
                </Button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
            {/* Welcome header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-border">
                {partner ? (
                  partner.logoUrl
                    ? <img src={partner.logoUrl} alt={partner.brandName} className="w-12 h-12 object-contain" />
                    : <span className="text-xl font-bold" style={{ color: partner.primaryColor || undefined }}>{partner.brandName.charAt(0)}</span>
                ) : (
                  <img src="/logo-gustafta.png" alt="Gustafta" className="w-12 h-12 object-contain" />
                )}
              </div>
              <h2 className="text-xl font-semibold">Selamat Datang di {partner ? partner.brandName : "Gustafta"}</h2>
              <p className="text-sm text-muted-foreground">
                {partner ? (partner.tagline || "Asisten AI untuk kebutuhan Anda.") : "Platform Penyelesaian Masalah untuk sektor konstruksi & profesional Indonesia — mulai dari masalah Anda."}
              </p>
            </div>

            {/* Trial Quota Banner */}
            <TrialQuotaBanner />

            {/* Blueprint Pending Banner — from Socratic Dialog */}
            <BlueprintPendingBanner />

            {/* Blueprint Upsell Banner — locked features for trial users */}
            <BlueprintUpsellBanner />

            {/* Plan Status Banner */}
            <PlanStatusBanner />

            {/* Setup Checklist — shown until user has a customized agent */}
            {(() => {
              const hasSampleOnly = allUserAgents.length > 0 && allUserAgents.every((a: any) => a.name === "Contoh: CS Toko Online");
              const hasNoAgent = allUserAgents.length === 0;
              if (!hasSampleOnly && !hasNoAgent) return null;

              const sampleAgent = allUserAgents.find((a: any) => a.name === "Contoh: CS Toko Online");

              const steps = [
                {
                  done: false,
                  label: "Buka agent contoh & pelajari strukturnya",
                  desc: sampleAgent
                    ? 'Agent "Contoh: CS Toko Online" sudah tersedia di sidebar kiri.'
                    : 'Buat chatbot pertama Anda dari menu "Buat Alat Bantu" di bawah.',
                  action: sampleAgent ? null : "create",
                },
                {
                  done: false,
                  label: "Modifikasi nama & system prompt",
                  desc: 'Ganti nama agent & isi system prompt sesuai bisnis Anda. Lihat tab "Persona".',
                  action: null,
                },
                {
                  done: false,
                  label: "Upload knowledge base",
                  desc: "Upload dokumen, FAQ, atau tempel URL — chatbot akan menjawab berdasarkan konten ini.",
                  action: null,
                },
                {
                  done: false,
                  label: "Test percakapan di Chat Console",
                  desc: 'Klik tab "Chat" di panel kanan untuk coba chatbot Anda secara langsung.',
                  action: null,
                },
                {
                  done: false,
                  label: "Salin embed code & pasang di website",
                  desc: 'Buka tab "Widget" → salin script embed → tempel di website Anda.',
                  action: null,
                },
              ];

              return (
                <div className="border border-primary/20 rounded-xl bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold">Setup Checklist — 5 Langkah Mulai</p>
                    </div>
                    <Link href="/welcome">
                      <span className="text-xs text-primary underline underline-offset-2 cursor-pointer hover:opacity-80">Panduan lengkap →</span>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-bold">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-1 border-t border-border/50">
                    Checklist ini hilang otomatis setelah Anda mulai mengkustomisasi agent Anda.
                  </p>
                </div>
              );
            })()}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Alat Bantu", value: agents?.length || 0, icon: Bot, color: "text-primary" },
                { label: "Modul Aktif", value: bigIdeas?.length || 0, icon: Lightbulb, color: "text-yellow-500" },
                { label: "Domain Aktif", value: activeDomains?.length || 0, icon: Globe, color: "text-green-500" },
                { label: "Series", value: allSeries?.length || 0, icon: FolderOpen, color: "text-blue-500" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border rounded-lg p-3 text-center space-y-1">
                  <stat.icon className={`w-5 h-5 mx-auto ${stat.color}`} />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aksi Cepat</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/os" className="sm:col-span-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/40 bg-gradient-to-r from-primary/10 to-sky-500/10 hover:border-primary hover:from-primary/15 hover:to-sky-500/15 transition-colors text-left cursor-pointer" data-testid="card-gustafta-os">
                    <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Gustafta OS — 5 Pilar</p>
                      <p className="text-xs text-muted-foreground">Peta lengkap: Coach · Claw · Workroom · Academy · Kompetensi</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  </div>
                </Link>
                <Link href="/blueprint-builder" className="sm:col-span-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 hover:border-indigo-500 hover:from-indigo-500/15 hover:to-blue-500/15 transition-colors text-left cursor-pointer" data-testid="card-blueprint-builder">
                    <div className="w-8 h-8 rounded-md bg-indigo-500/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Rancang Agen (Blueprint Builder)</p>
                      <p className="text-xs text-muted-foreground">Wizard terpandu: dialog → analisis → buat agen otomatis</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                  </div>
                </Link>
                <Link href="/organization-builder" className="sm:col-span-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 hover:border-violet-500 hover:from-violet-500/15 hover:to-fuchsia-500/15 transition-colors text-left cursor-pointer" data-testid="card-organization-builder">
                    <div className="w-8 h-8 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Rakit Tim AI (Pembuat Tim)</p>
                      <p className="text-xs text-muted-foreground">Buat beberapa agen sekaligus: ketua tim + anggota yang saling terhubung</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-violet-500 shrink-0" />
                  </div>
                </Link>
                <Link href="/portofolio">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:border-amber-500 hover:from-amber-500/15 hover:to-yellow-500/15 transition-colors text-left cursor-pointer h-full" data-testid="card-portofolio">
                    <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Portofolio Kompetensi</p>
                      <p className="text-xs text-muted-foreground">Bukti belajar, hasil kerja & sertifikat Anda</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>
                </Link>
                {!partner && (<Link href="/penghasilan">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-pink-500/10 hover:border-rose-500 hover:from-rose-500/15 hover:to-pink-500/15 transition-colors text-left cursor-pointer h-full" data-testid="card-penghasilan">
                    <div className="w-8 h-8 rounded-md bg-rose-500/15 flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Penghasilan Kreator</p>
                      <p className="text-xs text-muted-foreground">Lacak bagi hasil penjualan produk Anda</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
                  </div>
                </Link>)}
                {isAdminUser && (<Link href="/monitor-marketing" className="sm:col-span-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-rose-500/10 hover:border-pink-500 hover:from-pink-500/15 hover:to-rose-500/15 transition-colors text-left cursor-pointer" data-testid="card-monitor-marketing">
                    <div className="w-8 h-8 rounded-md bg-pink-500/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Monitor Tim Marketing</p>
                      <p className="text-xs text-muted-foreground">Pantau hasil kerja harian tim marketing AI di satu tempat</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-pink-500 shrink-0" />
                  </div>
                </Link>)}
                <button
                  onClick={() => setBigIdeaDialogOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-md bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Buat Modul Baru</p>
                    <p className="text-xs text-muted-foreground">Tambah Modul di hierarki Anda</p>
                  </div>
                </button>
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Buat Alat Bantu</p>
                    <p className="text-xs text-muted-foreground">Buat Chatbot AI baru</p>
                  </div>
                </button>
                <a href="/perkuat-pengetahuan" className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-emerald-500 hover:bg-emerald-500/5 transition-colors" data-testid="card-perkuat-pengetahuan">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Perkuat Pengetahuan</p>
                    <p className="text-xs text-muted-foreground">Isi chatbot privat Anda dengan data internal</p>
                  </div>
                </a>
                <a href="/domains" className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-green-500 hover:bg-green-500/5 transition-colors">
                  <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kelola Domain</p>
                    <p className="text-xs text-muted-foreground">Hubungkan domain kustom</p>
                  </div>
                </a>
                {!partner && (<a href="/packs" className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Paket & Tender</p>
                    <p className="text-xs text-muted-foreground">Tools Wizard untuk tender</p>
                  </div>
                </a>)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeNav) {
      case "persona":
        return <PersonaPanel agent={currentAgent!} />;
      case "policy":
        return <PolicyPanel agent={currentAgent!} />;
      case "agentic": {
        const isFreePlanA = planInfo.tier === 0;
        return (
          <div className="relative">
            {isFreePlanA && (
              <TrialLockOverlay feature="Multi-Agent Orchestration" description="Konfigurasi sub-agen & alur orkestrasi tersedia di paket Starter ke atas." />
            )}
            <AgenticAIPanel />
          </div>
        );
      }
      case "knowledge": {
        const isFreePlanK = planInfo.tier === 0;
        return (
          <div className="relative">
            {isFreePlanK && (
              <TrialLockOverlay feature="Knowledge Base Penuh" description="Upload dokumen & basis pengetahuan kustom tersedia di paket Starter ke atas." />
            )}
            <KnowledgeBasePanel agent={currentAgent!} />
          </div>
        );
      }
      case "integrations":
        return <IntegrationsPanel agent={currentAgent!} />;
      case "widget":
        return <WidgetPanel agent={currentAgent!} bigIdeaId={effectiveBigIdeaId} />;
      case "chat":
        return null;
      case "project-brain":
        return <ProjectBrainPanel agent={currentAgent!} />;
      case "mini-apps": {
        const isFreePlan = planInfo.tier === 0;
        return (
          <div className="relative">
            {isFreePlan && (
              <TrialLockOverlay feature="Mini Apps" description={partner ? "Akses Mini Apps dengan paket Starter ke atas, atau aktifkan trial gratis via Dialog Blueprint." : "Akses Mini Apps dengan paket Starter ke atas, atau aktifkan trial gratis via Dialog Gustafta."} />
            )}
            <MiniAppsPanel agent={currentAgent!} />
          </div>
        );
      }
      case "deliverables":
        return <DeliverablesPanel agent={currentAgent!} />;
      case "conversion":
        return <ConversionPanel agent={currentAgent!} />;
      case "landing-page":
        return <LandingPagePanel agent={currentAgent!} />;
      case "marketing":
        return <MarketingPanel agent={currentAgent!} />;
      case "studio":
        return <StudioPanel agent={currentAgent!} />;
      case "ekosistem":
        return <EkosistemPanel agent={currentAgent!} />;
      case "product-settings":
        return <ProductSettingsPanel agent={currentAgent!} />;
      case "revenue": {
        const isFreePlanR = planInfo.tier === 0;
        return (
          <div className="relative">
            {isFreePlanR && (
              <TrialLockOverlay feature="Revenue & Monetisasi" description="Fitur monetisasi chatbot & langganan klien tersedia di paket Starter ke atas." />
            )}
            <RevenuPanel agent={currentAgent!} />
          </div>
        );
      }
      case "affiliates":
        return <AffiliatePanel agent={currentAgent!} />;
      case "vouchers":
        return <VoucherPanel agent={currentAgent!} />;
      case "broadcast":
        return <BroadcastPanel agent={currentAgent!} />;
      case "tenders":
        return <TenderPanel agent={currentAgent!} />;
      case "analytics": {
        const isFreePlan = planInfo.tier === 0;
        return (
          <div className="relative">
            {isFreePlan && (
              <TrialLockOverlay feature="Analytics" description={partner ? "Lihat statistik chat & konversi dengan paket Starter ke atas, atau aktifkan trial gratis via Dialog Blueprint." : "Lihat statistik chat & konversi dengan paket Starter ke atas, atau aktifkan trial gratis via Dialog Gustafta."} />
            )}
            <AnalyticsPanel agent={currentAgent!} />
          </div>
        );
      }
      case "admin-agents":
        return <AdminAgentsPanel />;
      default:
        return null;
    }
  };

  const navigateToLevel = (level: HierarchyLevel) => {
    if (level === 'series' || level === 'bigIdeas') {
      setLocalBigIdeaId(undefined);
      setLocalToolboxId(undefined);
    }
    if (level === 'toolboxes') {
      setLocalToolboxId(undefined);
      forceOrchestratorSelect.current = false;
    }
    setNavLevel(level);
  };

  const handleSeriesDrillDown = (seriesId: string | number) => {
    const seriesIdStr = String(seriesId);
    setActiveSeriesId(seriesIdStr);
    setNavLevel('bigIdeas');
    // If the current active big idea belongs to a different series, auto-activate
    // the first big idea of the selected series so dialogs show the correct module
    if (!activeBigIdea || String(activeBigIdea.seriesId) !== seriesIdStr) {
      const firstBigIdea = bigIdeas.find((bi: BigIdea) => String(bi.seriesId) === seriesIdStr);
      if (firstBigIdea) {
        setLocalBigIdeaId(String(firstBigIdea.id));
        setLocalToolboxId(undefined);
        setLocalAgentId(undefined);
        activateBigIdea.mutate(String(firstBigIdea.id));
      }
    }
  };

  const handleBigIdeaDrillDown = (bi: BigIdea) => {
    setLocalBigIdeaId(String(bi.id));
    setLocalToolboxId(undefined);
    setLocalAgentId(undefined);
    handleBigIdeaSelect(bi);
    setNavLevel('toolboxes');
  };

  const handleToolboxDrillDown = (tb: Toolbox) => {
    setLocalToolboxId(String(tb.id));
    setLocalAgentId(undefined);
    handleToolboxSelect(tb);
    queryClient.setQueryData(["/api/agents/active"], null);
    forceOrchestratorSelect.current = !!(tb as any).isOrchestrator || !!(tb as any).hasOrchestrator;
    setNavLevel('agents');
  };

  const SidebarContent = () => (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className={cn("border-b border-sidebar-border", sidebarCollapsed ? "p-2" : "")}>
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-1 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Navigasi Hierarki">
                  <FolderOpen className="w-4 h-4 text-purple-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Navigasi</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { navigateToLevel('series'); setSidebarCollapsed(false); }} className="gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-500" />
                  <span>Series (L1)</span>
                </DropdownMenuItem>
                {activeSeries && (
                  <DropdownMenuItem onClick={() => { navigateToLevel('bigIdeas'); setSidebarCollapsed(false); }} className="gap-2 pl-6">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="truncate">Big Idea - {activeSeries.name}</span>
                  </DropdownMenuItem>
                )}
                {activeBigIdeaInCurrentSeries && (
                  <DropdownMenuItem onClick={() => { navigateToLevel('toolboxes'); setSidebarCollapsed(false); }} className="gap-2 pl-8">
                    <Wrench className="w-4 h-4 text-blue-500" />
                    <span className="truncate">Chatbot - {activeBigIdeaInCurrentSeries.name}</span>
                  </DropdownMenuItem>
                )}
                {currentToolbox && (
                  <DropdownMenuItem onClick={() => { navigateToLevel('agents'); setSidebarCollapsed(false); }} className="gap-2 pl-10">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="truncate">Alat Bantu - {currentToolbox.name}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="px-3 pt-3 pb-2">
            {/* Hierarchy level path */}
            <div className="mb-2 space-y-0.5">
              {/* Level 1: Series */}
              <button
                onClick={() => navigateToLevel('series')}
                className={cn(
                  "w-full flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors text-left",
                  navLevel === 'series'
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-sidebar-foreground"
                )}
                data-testid="breadcrumb-series"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 w-10 text-right opacity-60">L1</span>
                <FolderOpen className="w-3 h-3 shrink-0" />
                <span className={cn("text-[11px] font-medium truncate", navLevel === 'series' ? "font-semibold" : "")}>
                  {activeSeries ? activeSeries.name : "Pilih Series"}
                </span>
              </button>

              {/* Level 2: Modul — sembunyikan hanya saat di agents level dalam Hub */}
              {activeSeriesId && !(isCurrentToolboxHub && navLevel === 'agents') && (
                <button
                  onClick={() => navigateToLevel('bigIdeas')}
                  className={cn(
                    "w-full flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors text-left pl-3",
                    navLevel === 'bigIdeas'
                      ? "bg-blue-500/10 text-blue-500"
                      : (navLevel === 'series' ? "opacity-40 cursor-not-allowed" : "text-muted-foreground hover:text-sidebar-foreground")
                  )}
                  disabled={navLevel === 'series'}
                  data-testid="breadcrumb-modul"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 w-8 text-right opacity-60">L2</span>
                  <Lightbulb className="w-3 h-3 shrink-0" />
                  <span className={cn("text-[11px] font-medium truncate", navLevel === 'bigIdeas' ? "font-semibold" : "")}>
                    {activeBigIdeaInCurrentSeries ? activeBigIdeaInCurrentSeries.name : "Pilih Modul"}
                  </span>
                </button>
              )}

              {/* Level 3: Chatbot */}
              {activeSeriesId && activeBigIdeaInCurrentSeries && (navLevel === 'toolboxes' || navLevel === 'agents') && !isCurrentToolboxHub && (
                <button
                  onClick={() => navigateToLevel('toolboxes')}
                  className={cn(
                    "w-full flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors text-left pl-5",
                    navLevel === 'toolboxes'
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground hover:text-sidebar-foreground"
                  )}
                  data-testid="breadcrumb-chatbot"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 w-6 text-right opacity-60">L3</span>
                  <Bot className="w-3 h-3 shrink-0" />
                  <span className={cn("text-[11px] font-medium truncate", navLevel === 'toolboxes' ? "font-semibold" : "")}>
                    {currentToolbox ? currentToolbox.name : "Pilih Chatbot"}
                  </span>
                </button>
              )}
              {/* Level 3: Hub (Series-level Orkestrator) */}
              {isCurrentToolboxHub && currentToolbox && navLevel === 'agents' && (
                <div className="flex items-center gap-1.5 rounded px-1.5 py-0.5 pl-5 bg-purple-500/10">
                  <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 w-6 text-right opacity-60 text-purple-500">L3</span>
                  <Network className="w-3 h-3 shrink-0 text-purple-500" />
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 truncate">{currentToolbox.name}</span>
                </div>
              )}

              {/* Level 4: Alat Bantu */}
              {navLevel === 'agents' && (
                <div className="flex items-center gap-1.5 rounded px-1.5 py-0.5 pl-7 bg-green-500/10">
                  <span className="text-[9px] font-bold uppercase tracking-widest shrink-0 w-4 text-right opacity-60 text-green-600">L4</span>
                  <Users className="w-3 h-3 shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-[11px] font-semibold text-green-700 dark:text-green-400 truncate">Alat Bantu</span>
                </div>
              )}
            </div>

            {/* Level content */}
            <div className="space-y-0.5">
              {navLevel === 'series' && (
                <>
                  {allSeries.length === 0 ? (
                    <div className="py-3 text-sm text-muted-foreground text-center">
                      Belum ada Series
                    </div>
                  ) : (
                    allSeries.map((s: any) => (
                      <div
                        key={s.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                          activeSeriesId === String(s.id)
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                        onClick={() => handleSeriesDrillDown(s.id)}
                        data-testid={`nav-series-${s.id}`}
                      >
                        <FolderOpen className="w-4 h-4 text-purple-500 shrink-0" />
                        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide"><span className="whitespace-nowrap">{s.name}</span></div>
                        <div className="flex items-center gap-0.5 invisible group-hover:visible shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-6 h-6"
                            onClick={(e) => { e.stopPropagation(); setEditSeriesTarget(s); setEditSeriesName(s.name); setEditSeriesDesc(s.description || ""); }}
                            data-testid={`button-edit-series-${s.id}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-6 h-6"
                            onClick={(e) => { e.stopPropagation(); setDeleteSeriesConfirm(s); }}
                            data-testid={`button-delete-series-${s.id}`}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setSeriesDialogOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    data-testid="button-manage-series"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Kelola Series</span>
                  </button>
                </>
              )}

              {navLevel === 'bigIdeas' && (
                <>
                  <button
                    onClick={() => navigateToLevel('series')}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors mb-1"
                    data-testid="button-back-to-series"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Kembali ke Series</span>
                  </button>
                  {biasaPremiumInfo}
                  {/* AI Chatbot Shortcuts */}
                  <button
                    className="w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors mb-1"
                    onClick={() => setShortcutBiasaOpen(v => !v)}
                    data-testid="toggle-shortcut-biasa-group"
                  >
                    {shortcutBiasaOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="flex-1 text-left">AI Chatbot Biasa</span>
                  </button>
                  {shortcutBiasaOpen && (
                    <div className="mb-1 animate-group-open max-h-[55vh] overflow-y-auto pr-1">
                  <Link href="/brain-project">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-brain-project">
                      <Brain className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">Brain Project AI</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/tender-ai">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-tender-ai">
                      <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TENDERA AI</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/ib-tu">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-2" data-testid="nav-shortcut-ib-tu">
                      <GraduationCap className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">IB TU Coordinator</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/edu-counsel">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-edu-counsel">
                      <GraduationCap className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">EduCounsel AI</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/ai-tutor">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-2" data-testid="nav-shortcut-ai-tutor">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">AI Tutor Adaptif</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  <Link href="/tutor-builder">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-2" data-testid="nav-shortcut-tutor-builder">
                      <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">Rakit Tim Agen — Trilogi</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/rab-kalkulator">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-rab-kalkulator">
                      <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">Kalkulator RAB Otomatis</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/k3-vision">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-red-700 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 mb-1" data-testid="nav-shortcut-k3-vision">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">AI Vision K3 Inspector</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-500/50" />
                    </div>
                  </Link>
                  <Link href="/ai-tools">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-ai-tools-hub">
                      <Wrench className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">AI Tools Hub</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/cert-tracker">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-cert-tracker">
                      <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">CertTracker Biro Jasa</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/docu-gen">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-docu-gen">
                      <FileSignature className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">DocuGen — Pembuat Surat AI</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/tender-mate">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-1" data-testid="nav-shortcut-tender-mate">
                      <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TenderMate — Pipeline Tender</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  <Link href="/client-hub">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-client-hub">
                      <Handshake className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ClientHub — Manajemen Klien</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/laporan-bj">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mb-1" data-testid="nav-shortcut-laporan-bj">
                      <BarChart3 className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">LaporanBJ — Laporan Bisnis</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500/50" />
                    </div>
                  </Link>
                  <Link href="/boheerbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-boheerbot">
                      <Wrench className="w-4 h-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">BoheerBot — AI Subkontraktor & Klaim Termin</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/supplierbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-supplierbot">
                      <Package className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SupplierBot — AI Material & Supply Chain</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/ownerbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-ownerbot">
                      <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">OwnerBot — AI Developer & Pemilik Proyek</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/konsultanbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mb-1" data-testid="nav-shortcut-konsultanbot">
                      <Pencil className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KonsultanBot — AI DED, MK & Jasa Konsultansi</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500/50" />
                    </div>
                  </Link>
                  <Link href="/kontraktorbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-kontraktorbot">
                      <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KontraktorBot — AI QS, RAB & Estimasi Biaya</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/perijinanbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-perijinanbot">
                      <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PerijinanBot — AI Konsultan OSS-RBA & NIB</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/proyekbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 border border-slate-500/20 mb-1" data-testid="nav-shortcut-proyekbot">
                      <Construction className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ProyekBot — AI Manajemen Proyek Konstruksi</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500/50" />
                    </div>
                  </Link>
                  <Link href="/sertifikasibot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-sertifikasibot">
                      <Award className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SertifikasiBot — AI Konsultan SBU/SKK BUJK</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/tenderbot">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-1" data-testid="nav-shortcut-tenderbot">
                      <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TenderBot — AI Intelijen Tender BUJK</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  <Link href="/mlm-admin">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-purple-700 dark:text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 mb-2" data-testid="nav-shortcut-mlm-admin">
                      <GitBranch className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">MLM — Jaringan Afiliasi 3 Level</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-500/50" />
                    </div>
                  </Link>
                    </div>
                  )}
                  <button
                    className="w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors mb-1"
                    onClick={() => setShortcutPremiumOpen(v => !v)}
                    data-testid="toggle-shortcut-premium-group"
                  >
                    {shortcutPremiumOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                    <Crown className="w-3 h-3 shrink-0" />
                    <span className="flex-1 text-left">AI Chatbot Premium</span>
                  </button>
                  {shortcutPremiumOpen && (
                    <div className="mb-1 animate-group-open max-h-[60vh] overflow-y-auto pr-1">
                  {renderShortcutSection('prem-utama', 'Claw Utama & Populer')}
                  {openShortcutSections.has('prem-utama') && (<div className="animate-group-open">
                  <Link href="/sbu-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-2" data-testid="nav-shortcut-sbu-claw">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SBUClaw OpenClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/data-master">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 mb-2" data-testid="nav-shortcut-data-master">
                      <DatabaseZap className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">Data Master OpenClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-500/50" />
                    </div>
                  </Link>
                  <Link href="/legal/chat">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-purple-700 dark:text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 mb-1" data-testid="nav-shortcut-lexcom">
                      <Scale className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">LexCom AI Hukum</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-500/50" />
                    </div>
                  </Link>
                  <Link href="/skk-coach/chat">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-skk-coach">
                      <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SKK Coach</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/askom/chat">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-askom">
                      <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ASKOM AI</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/pjbu-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-pjbu">
                      <Users className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PJBUClaw (Manajerial)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/keuangan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-keuangan">
                      <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KeuanganClaw (BUJK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/pajak-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-pajak-claw">
                      <Landmark className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PajakClaw (Advisor)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/tendera-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-tendera">
                      <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TenderaClaw (10 Agen)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/konstra-tender-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-green-700 dark:text-green-400 hover:bg-green-500/10 border border-green-500/20 mb-1" data-testid="nav-shortcut-konstra-tender">
                      <Search className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KonstraTender (LKPP)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-green-500/50" />
                    </div>
                  </Link>
                  <Link href="/bg-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-stone-600 dark:text-stone-400 hover:bg-stone-500/10 border border-stone-500/20 mb-1" data-testid="nav-shortcut-bg-claw">
                      <Building2 className="w-4 h-4 text-stone-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">BGClaw (BG001–BG009)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500/50" />
                    </div>
                  </Link>
                  <Link href="/bs-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-sky-700 dark:text-sky-400 hover:bg-sky-500/10 border border-sky-500/20 mb-1" data-testid="nav-shortcut-bs-claw">
                      <Construction className="w-4 h-4 text-sky-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">BSClaw (BS001–BS010)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-sky-500/50" />
                    </div>
                  </Link>
                  <Link href="/im-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-im-claw">
                      <Wrench className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">IMClaw (IM001–IM009)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/ko-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-ko-claw">
                      <HardHat className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KOClaw (KO001–KO008)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/kk-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mb-1" data-testid="nav-shortcut-kk-claw">
                      <Scale className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KKClaw (KK001–KK007)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500/50" />
                    </div>
                  </Link>
                  <Link href="/csms-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-csms">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">CSMSClaw (K3L)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/safira-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-red-700 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 mb-1" data-testid="nav-shortcut-safira">
                      <HardHat className="w-4 h-4 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SafiraClaw (SKK K3)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-500/50" />
                    </div>
                  </Link>
                  <Link href="/smk3-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-smk3">
                      <HardHat className="w-4 h-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SMK3Claw (IMS)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/lkut-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-lkut">
                      <BarChart3 className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">LKUTClaw (BUJK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/pub-lkut-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-sky-700 dark:text-sky-400 hover:bg-sky-500/10 border border-sky-500/20 mb-1" data-testid="nav-shortcut-pub-lkut">
                      <TrendingUp className="w-4 h-4 text-sky-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PUB-LKUTClaw (Kegiatan Usaha)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-sky-500/50" />
                    </div>
                  </Link>
                  <Link href="/iso-claw-9001">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-iso-9001">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ISOClaw 9001 (Mutu)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/iso-claw-14001">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-lime-700 dark:text-lime-400 hover:bg-lime-500/10 border border-lime-500/20 mb-1" data-testid="nav-shortcut-iso-14001">
                      <Leaf className="w-4 h-4 text-lime-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ISOClaw 14001 (LH)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-lime-500/50" />
                    </div>
                  </Link>
                  <Link href="/smap-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-smap-claw">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SMAPClaw ISO 37001</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/pancek-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-red-700 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 mb-1" data-testid="nav-shortcut-pancek-claw">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PanCEKClaw KPK</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-500/50" />
                    </div>
                  </Link>
                  <Link href="/sipil-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-sipil-claw">
                      <HardHat className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SipilClaw (Teknik Sipil)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/mep-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-mep-claw">
                      <Wrench className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">MEPClaw (MEP Gedung)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/k3-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-k3-claw">
                      <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">K3Claw (K3 Teknis)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/lingkungan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-green-700 dark:text-green-400 hover:bg-green-500/10 border border-green-500/20 mb-1" data-testid="nav-shortcut-lingkungan-claw">
                      <Leaf className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">LingkunganClaw (LH)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-green-500/50" />
                    </div>
                  </Link>
                  <Link href="/manprojak-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-1" data-testid="nav-shortcut-manprojak-claw">
                      <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ManprojakClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  <Link href="/qs-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-qs-claw">
                      <span className="text-sm shrink-0">💰</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">QSClaw (QS &amp; Estimasi)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/pengawas-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-pengawas-claw">
                      <span className="text-sm shrink-0">👷</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PengawasClaw (Pengawas)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/kontrak-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-red-700 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 mb-1" data-testid="nav-shortcut-kontrak-claw">
                      <span className="text-sm shrink-0">📝</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KontrakClaw (Kontrak &amp; Klaim)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-500/50" />
                    </div>
                  </Link>
                  <Link href="/k3man-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-k3man-claw">
                      <span className="text-sm shrink-0">⛑️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">K3ManClaw (K3 Konstruksi)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/arsitektur-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mb-1" data-testid="nav-shortcut-arsitektur-claw">
                      <Building2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ArsitekturClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500/50" />
                    </div>
                  </Link>
                  <Link href="/surveipemetaan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-surveipemetaan-claw">
                      <MapIcon className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SurveiPemetaanClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/geoteknik-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-geoteknik-claw">
                      <span className="text-sm shrink-0">⛏️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">GeoteknikClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/jalanjembatan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 mb-1" data-testid="nav-shortcut-jalanjembatan-claw">
                      <span className="text-sm shrink-0">🛣️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">JalanJembatanClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-yellow-500/50" />
                    </div>
                  </Link>
                  <Link href="/tatalingkungan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-green-700 dark:text-green-400 hover:bg-green-500/10 border border-green-500/20 mb-1" data-testid="nav-shortcut-tatalingkungan-claw">
                      <span className="text-sm shrink-0">🌿</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TataLingkunganClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-green-500/50" />
                    </div>
                  </Link>
                  <Link href="/elektrikal-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-2" data-testid="nav-shortcut-elektrikal-claw">
                      <span className="text-sm shrink-0">🔌</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ElektrikalClaw (SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── Konstruksi Manajemen & Digital ── */}
                  {renderShortcutSection('prem-konstruksi', 'Konstruksi — Manajemen & Digital')}
                  {openShortcutSections.has('prem-konstruksi') && (<div className="animate-group-open">
                  <Link href="/konstra-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-slate-700 dark:text-slate-400 hover:bg-slate-500/10 border border-slate-500/20 mb-1" data-testid="nav-shortcut-konstra-claw">
                      <HardHat className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KonstraClaw (Manpro)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500/50" />
                    </div>
                  </Link>
                  <Link href="/brain-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 mb-1" data-testid="nav-shortcut-brain-claw">
                      <Brain className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">BrainClaw (Project Intel)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-500/50" />
                    </div>
                  </Link>
                  <Link href="/bim-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-bim-claw">
                      <span className="text-sm shrink-0">🏗️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">BIMClaw (BIM Digital)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/desain-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mb-1" data-testid="nav-shortcut-desain-claw">
                      <span className="text-sm shrink-0">🎨</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">DesainClaw (Arsitektur)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500/50" />
                    </div>
                  </Link>
                  <Link href="/siteops-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-2" data-testid="nav-shortcut-siteops-claw">
                      <span className="text-sm shrink-0">🦺</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SiteOpsClaw (Lapangan)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── Energi & Pertambangan ── */}
                  {renderShortcutSection('prem-energi', 'Energi & Pertambangan')}
                  {openShortcutSections.has('prem-energi') && (<div className="animate-group-open">
                  <Link href="/ketenagalistrikan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 mb-1" data-testid="nav-shortcut-ketenagalistrikan-claw">
                      <span className="text-sm shrink-0">⚡</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KetenagalistrikanClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-yellow-500/50" />
                    </div>
                  </Link>
                  <Link href="/energi-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-energi-claw">
                      <span className="text-sm shrink-0">🔋</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">EnergiClaw (EBT)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/ebt-solar-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-ebt-solar-claw">
                      <span className="text-sm shrink-0">☀️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">EbtSolarClaw (PLTS)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/transisi-energi-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-transisi-energi-claw">
                      <span className="text-sm shrink-0">🌱</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TransisiEnergiClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/migas-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-migas-claw">
                      <span className="text-sm shrink-0">🛢️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">MigasClaw (Energi)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/pertambangan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-stone-600 dark:text-stone-400 hover:bg-stone-500/10 border border-stone-500/20 mb-1" data-testid="nav-shortcut-pertambangan-claw">
                      <span className="text-sm shrink-0">⛏️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PertambanganClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500/50" />
                    </div>
                  </Link>
                  <Link href="/geologi-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-stone-600 dark:text-stone-400 hover:bg-stone-500/10 border border-stone-500/20 mb-1" data-testid="nav-shortcut-geologi-claw">
                      <span className="text-sm shrink-0">🪨</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">GeologiClaw (Eksplorasi)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500/50" />
                    </div>
                  </Link>
                  <Link href="/offshore-safety-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-2" data-testid="nav-shortcut-offshore-safety-claw">
                      <span className="text-sm shrink-0">🛥️</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">OffshoreSafetyClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── Properti & Real Estate ── */}
                  {renderShortcutSection('prem-properti', 'Properti & Real Estate')}
                  {openShortcutSections.has('prem-properti') && (<div className="animate-group-open">
                  <Link href="/dev-properti-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-dev-properti-claw">
                      <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">DevPropertiClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/estate-care-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-2" data-testid="nav-shortcut-estate-care-claw">
                      <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">EstateCareClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── Sertifikasi & Perizinan ── */}
                  {renderShortcutSection('prem-sertifikasi', 'Sertifikasi & Perizinan')}
                  {openShortcutSections.has('prem-sertifikasi') && (<div className="animate-group-open">
                  <Link href="/skema-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-1" data-testid="nav-shortcut-skema-claw">
                      <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SkemaClaw (BUJK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  <Link href="/simpk-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 mb-1" data-testid="nav-shortcut-simpk-claw">
                      <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">SIMPKClaw (Peralatan)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/50" />
                    </div>
                  </Link>
                  <Link href="/esimpan-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-esimpan-claw">
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ESIMPANClaw (BUJK & TKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/lkpm-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-lkpm-claw">
                      <Landmark className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">LKPMClaw (Penanaman Modal)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/oss-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-oss-claw">
                      <Landmark className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">OSSClaw (NIB & Perizinan)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/abu-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-slate-700 dark:text-slate-400 hover:bg-slate-500/10 border border-slate-500/20 mb-1" data-testid="nav-shortcut-abu-claw">
                      <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ABUClaw (LSBU)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500/50" />
                    </div>
                  </Link>
                  <Link href="/panduan-sbu">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-panduan-sbu">
                      <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PanduanSBU (Tanya Jawab)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/panduan-askom">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-panduan-askom">
                      <BookOpen className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PanduanASKOM (Uji SKK)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/teras-lpjk-1">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-2" data-testid="nav-shortcut-teras-lpjk-1">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TerasLPJK#1 (SKK & LSP)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── ETLO & Pendidikan ── */}
                  {renderShortcutSection('prem-etlo', 'ETLO & Pendidikan')}
                  {openShortcutSections.has('prem-etlo') && (<div className="animate-group-open">
                  <Link href="/educounsel-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-educounsel-claw">
                      <GraduationCap className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">EducounselClaw (Konseling)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/ibtu-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-1" data-testid="nav-shortcut-ibtu-claw">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">IBTUClaw (IB Testing)</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  <Link href="/etlo-academy-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-etlo-academy-claw">
                      <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ETLOAcademyClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/etlo-bizdev-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-etlo-bizdev-claw">
                      <TrendingUp className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">ETLOBizDevClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/tutor-teknik-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-tutor-teknik-claw">
                      <GraduationCap className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">TutorTeknikClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/riset-skripsi-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-2" data-testid="nav-shortcut-riset-skripsi-claw">
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">RisetSkripsiClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── Bisnis & HR ── */}
                  {renderShortcutSection('prem-bisnis', 'Bisnis & HR')}
                  {openShortcutSections.has('prem-bisnis') && (<div className="animate-group-open">
                  <Link href="/digital-marketing-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 border border-violet-500/20 mb-1" data-testid="nav-shortcut-digital-marketing-claw">
                      <TrendingUp className="w-4 h-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">DigitalMarketingClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500/50" />
                    </div>
                  </Link>
                  <Link href="/crm-sales-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-crm-sales-claw">
                      <Users className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">CrmSalesClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/brand-content-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mb-1" data-testid="nav-shortcut-brand-content-claw">
                      <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">BrandContentClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500/50" />
                    </div>
                  </Link>
                  <Link href="/ecommerce-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 mb-1" data-testid="nav-shortcut-ecommerce-claw">
                      <span className="text-sm shrink-0">🛒</span>
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">EcommerceClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500/50" />
                    </div>
                  </Link>
                  <Link href="/rekrutmen-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 mb-1" data-testid="nav-shortcut-rekrutmen-claw">
                      <Users className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">RekrutmenClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500/50" />
                    </div>
                  </Link>
                  <Link href="/ld-kompetensi-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 mb-1" data-testid="nav-shortcut-ld-kompetensi-claw">
                      <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">LdKompetensiClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                  </Link>
                  <Link href="/penilaian-kinerja-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-2" data-testid="nav-shortcut-penilaian-kinerja-claw">
                      <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">PenilaianKinerjaClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                  </div>)}
                  {/* ── Regulasi & Hukum ── */}
                  {renderShortcutSection('prem-regulasi', 'Regulasi & Hukum')}
                  {openShortcutSections.has('prem-regulasi') && (<div className="animate-group-open">
                  <Link href="/nspk-navigator-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 mb-1" data-testid="nav-shortcut-nspk-navigator-claw">
                      <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">NspkNavigatorClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />
                    </div>
                  </Link>
                  <Link href="/korporasi-claw">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 mb-2" data-testid="nav-shortcut-korporasi-claw">
                      <Scale className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="whitespace-nowrap text-xs font-medium">KorporasiClaw</span></div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500/50" />
                    </div>
                  </Link>
                    </div>)}
                    </div>
                  )}
                  {orchestratorHub ? (
                    <div
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors mb-2 border border-purple-500/30",
                        orchestratorHub.isActive
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                          : "text-purple-600/70 dark:text-purple-400/70 hover:bg-purple-500/10"
                      )}
                      onClick={() => handleToolboxDrillDown(orchestratorHub)}
                      data-testid="nav-hub-orchestrator"
                    >
                      <Network className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                        <span className="whitespace-nowrap block">{orchestratorHub.name}</span>
                        <span className="text-[10px] text-purple-500/70 whitespace-nowrap">Orkestrator</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <div className="invisible group-hover:visible flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => { e.stopPropagation(); handleEditToolbox(orchestratorHub); }}
                            data-testid="button-edit-hub"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteToolboxConfirm(orchestratorHub); }}
                            data-testid="button-delete-hub"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  ) : activeSeriesId ? (
                    <button
                      onClick={() => setHubDialogOpen(true)}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-purple-500/70 hover:text-purple-600 hover:bg-purple-500/10 transition-colors mb-2 border border-dashed border-purple-500/30"
                      data-testid="button-create-hub"
                    >
                      <Network className="w-4 h-4" />
                      <span>Buat Chatbot Orkestrator</span>
                    </button>
                  ) : null}
                  {(orchestratorHub || activeSeriesId) && (
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-1">Modul</div>
                  )}
                  {filteredBigIdeas.length === 0 ? (
                    <div className="py-3 text-sm text-muted-foreground text-center">
                      Belum ada Modul
                    </div>
                  ) : (
                    filteredBigIdeas.map((bi) => (
                      <div
                        key={bi.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                          bi.isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                        onClick={() => handleBigIdeaDrillDown(bi)}
                        data-testid={`nav-bigidea-${bi.id}`}
                      >
                        <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0" />
                        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide"><span className="whitespace-nowrap">{bi.name}</span></div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <div className="invisible group-hover:visible flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => { e.stopPropagation(); handleEditBigIdea(bi); }}
                              data-testid={`button-edit-bigidea-${bi.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteBigIdeaConfirm(bi); }}
                              data-testid={`button-delete-bigidea-${bi.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setBigIdeaDialogOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    data-testid="button-add-bigidea"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Modul Baru</span>
                  </button>
                  <button
                    onClick={() => setGenerateBigIdeasOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors border border-dashed border-primary/30"
                    data-testid="button-generate-bigideas"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Generate dari Referensi</span>
                  </button>
                </>
              )}

              {navLevel === 'toolboxes' && (
                <>
                  <button
                    onClick={() => navigateToLevel('bigIdeas')}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors mb-2"
                    data-testid="button-back-to-bigideas"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Kembali ke Modul</span>
                  </button>

                  {biasaPremiumInfo}

                  {/* === AI Chatbot Premium === */}
                  {(() => {
                    const orchToolboxes = toolboxes.filter((tb: any) => tb.hasOrchestrator);
                    return (
                      <>
                        <button
                          className="w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors mb-1"
                          onClick={() => setPremiumGroupOpen(v => !v)}
                          data-testid="toggle-premium-group"
                        >
                          {premiumGroupOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          <Crown className="w-3 h-3 shrink-0" />
                          <span className="flex-1 text-left">AI Chatbot Premium</span>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">{orchToolboxes.length}</Badge>
                        </button>
                        {premiumGroupOpen && (
                          <div className="mb-2 animate-group-open">
                            {orchToolboxes.length === 0 ? (
                              <button
                                onClick={() => setModulOrchDialogOpen(true)}
                                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-purple-500/70 hover:text-purple-600 hover:bg-purple-500/10 transition-colors mb-1 border border-dashed border-purple-500/30"
                                data-testid="button-create-modul-orch"
                              >
                                <Network className="w-4 h-4" />
                                <span>Buat Orkestrator Modul</span>
                              </button>
                            ) : (
                              orchToolboxes.map((orchTb: any) => (
                                <div
                                  key={orchTb.id}
                                  className={cn(
                                    "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors mb-1 border border-purple-500/30",
                                    "bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15"
                                  )}
                                  onClick={() => handleToolboxDrillDown(orchTb)}
                                  data-testid={`nav-modul-orchestrator-${orchTb.id}`}
                                >
                                  <Network className="w-4 h-4 text-purple-500 shrink-0" />
                                  <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                                    <span className="whitespace-nowrap block">{orchTb.name}</span>
                                    <span className="text-[10px] text-purple-500/70 whitespace-nowrap">Multi-Agen</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <div className="invisible group-hover:visible flex items-center gap-0.5">
                                      <Button variant="ghost" size="icon" className="h-5 w-5"
                                        onClick={(e) => { e.stopPropagation(); handleEditToolbox(orchTb); }}
                                        data-testid={`button-edit-modul-orch-${orchTb.id}`}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* === AI Chatbot Biasa === */}
                  {(() => {
                    const regularToolboxes = toolboxes.filter((tb: any) => !tb.hasOrchestrator);
                    if (regularToolboxes.length === 0) return null;
                    return (
                      <>
                        <button
                          className="w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors mb-1"
                          onClick={() => setBiasaGroupOpen(v => !v)}
                          data-testid="toggle-biasa-group"
                        >
                          {biasaGroupOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span className="flex-1 text-left">AI Chatbot Biasa</span>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">{regularToolboxes.length}</Badge>
                        </button>
                        {biasaGroupOpen && (
                          <div className="mb-2 animate-group-open">
                            {(
                              regularToolboxes.map((tb: any) => (
                                <div
                                  key={tb.id}
                                  className={cn(
                                    "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors mb-1",
                                    tb.isActive
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                  )}
                                  onClick={() => handleToolboxDrillDown(tb)}
                                  data-testid={`nav-toolbox-${tb.id}`}
                                >
                                  <Wrench className="w-4 h-4 text-blue-500 shrink-0" />
                                  <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                                    <span className="whitespace-nowrap">{tb.name}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <div className="invisible group-hover:visible flex items-center gap-0.5">
                                      <Button variant="ghost" size="icon" className="h-5 w-5"
                                        onClick={(e) => { e.stopPropagation(); handleEditToolbox(tb); }}
                                        data-testid={`button-edit-toolbox-${tb.id}`}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive"
                                        onClick={(e) => { e.stopPropagation(); setDeleteToolboxConfirm(tb); }}
                                        data-testid={`button-delete-toolbox-${tb.id}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <button
                    onClick={() => setToolboxDialogOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    data-testid="button-add-toolbox"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Chatbot Baru</span>
                  </button>
                </>
              )}

              {navLevel === 'agents' && (
                <>
                  <button
                    onClick={() => {
                      const activeToolboxData = toolboxes.find(t => String(t.id) === effectiveToolboxId) || orchestratorHub;
                      if (activeToolboxData?.isOrchestrator) {
                        navigateToLevel('bigIdeas');
                      } else {
                        navigateToLevel('toolboxes');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors mb-1"
                    data-testid="button-back-to-toolboxes"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>{orchestratorHub && String(effectiveToolboxId) === String(orchestratorHub.id) ? "Kembali ke Modul" : "Kembali ke Chatbot"}</span>
                  </button>
                  {(() => {
                    const hasOrchAgent = filteredAgents.some((a: any) => a.isOrchestrator);
                    const orchAgents = filteredAgents.filter((a: any) => a.isOrchestrator);
                    const regularAgents = filteredAgents.filter((a: any) => !a.isOrchestrator);
                    // Kelompokkan Alat Bantu ke grup bernama (accordion) agar tidak tersebar:
                    // pakai Folder bila diatur, jika tidak ambil awalan nama (mis. "SBU Coach", "SKK Coach").
                    const groupKeyFor = (a: any) => {
                      const folder = (a.folderName || "").trim();
                      if (folder) return folder;
                      const nm = (a.name || "").trim();
                      // Pisah pada pemisah umum: em/en-dash, hyphen ber-spasi, titik dua, pipa
                      let prefix = nm.split(/\s[—–-]\s|[—–:|]/)[0].trim();
                      // Bila tak ada pemisah, kelompokkan berdasarkan 2 kata pertama
                      if (prefix === nm) {
                        const words = nm.split(/\s+/);
                        if (words.length > 2) prefix = words.slice(0, 2).join(" ");
                      }
                      return prefix && prefix.length >= 2 && prefix.length <= 28 ? prefix : "Lainnya";
                    };
                    const regularGroups = regularAgents.reduce((acc: Record<string, any[]>, a: any) => {
                      const key = groupKeyFor(a);
                      (acc[key] = acc[key] || []).push(a);
                      return acc;
                    }, {} as Record<string, any[]>);
                    const regularGroupNames = Object.keys(regularGroups).sort((a, b) => a.localeCompare(b, "id"));
                    return agentsLoading ? (
                      <div className="py-3 text-sm text-muted-foreground text-center">Memuat...</div>
                    ) : (
                      <>
                        {orchAgents.map((agent) => (
                          <div
                            key={agent.id}
                            className={cn(
                              "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors mb-1 border border-purple-500/30",
                              String(agent.id) === String(activeAgent?.id)
                                ? "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                                : "bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15"
                            )}
                            onClick={() => handleAgentSelect(agent)}
                            data-testid={`nav-agent-${agent.id}`}
                          >
                            <Avatar className="w-5 h-5 shrink-0">
                              <AvatarFallback className="text-[9px] bg-purple-500/10 text-purple-600">
                                <Network className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                              <span className="whitespace-nowrap block">{agent.name}</span>
                              {(agent as any).shared ? (
                                <span className="text-[10px] text-blue-500/80 whitespace-nowrap flex items-center gap-0.5" data-testid={`badge-shared-${agent.id}`}>
                                  <Users className="w-2.5 h-2.5" />Dibagikan • {(agent as any).effectiveRole === "editor" ? "Editor" : "Viewer"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-purple-500/70 whitespace-nowrap">Orkestrator</span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 invisible group-hover:visible shrink-0">
                              {!(agent as any).shared && (
                                <Switch
                                  checked={(agent as any).isEnabled !== false}
                                  onCheckedChange={() => { toggleAgentEnabledMutation.mutate(String(agent.id)); }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="scale-[0.65] origin-right"
                                  data-testid={`toggle-agent-enabled-${agent.id}`}
                                />
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6"
                                title="Atur Folder"
                                onClick={(e) => { e.stopPropagation(); setFolderDialogAgent(agent as Agent); setFolderDialogName((agent as any).folderName || ""); }}
                                data-testid={`button-folder-agent-${agent.id}`}
                              >
                                <FolderPlus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6"
                                title="Export JSON"
                                onClick={(e) => { e.stopPropagation(); handleExportAgent(String(agent.id), agent.name); }}
                                disabled={exportingAgentId === String(agent.id)}
                                data-testid={`button-export-agent-${agent.id}`}
                              >
                                {exportingAgentId === String(agent.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              </Button>
                              {!(agent as any).shared && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-6 h-6"
                                  title="Bagikan"
                                  onClick={(e) => { e.stopPropagation(); setShareAgentTarget(agent as Agent); }}
                                  data-testid={`button-share-agent-${agent.id}`}
                                >
                                  <Share2 className="w-3 h-3 text-blue-500" />
                                </Button>
                              )}
                              {(agent as any).effectiveRole !== "viewer" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-6 h-6"
                                  onClick={(e) => { e.stopPropagation(); setEditAgentTarget(agent as Agent); setEditAgentName(agent.name); setEditAgentDesc((agent as any).description || ""); }}
                                  data-testid={`button-edit-agent-${agent.id}`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                              {!(agent as any).shared && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-6 h-6"
                                  title={(agent as any).archived ? "Pulihkan dari Arsip" : "Arsipkan"}
                                  onClick={(e) => { e.stopPropagation(); archiveAgentMutation.mutate(String(agent.id)); }}
                                  data-testid={`button-archive-agent-${agent.id}`}
                                >
                                  {(agent as any).archived ? <ArchiveRestore className="w-3 h-3 text-blue-500" /> : <Archive className="w-3 h-3 text-amber-500" />}
                                </Button>
                              )}
                              {!(agent as any).shared && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-6 h-6"
                                  onClick={(e) => { e.stopPropagation(); setDeleteAgentConfirm(agent as Agent); }}
                                  data-testid={`button-delete-agent-${agent.id}`}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {!hasOrchAgent && (
                          <button
                            onClick={() => {
                              setCreateAsOrchestrator(true);
                              setCreateDialogOpen(true);
                            }}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-purple-500/70 hover:text-purple-600 hover:bg-purple-500/10 transition-colors mb-1 border border-dashed border-purple-500/30"
                            data-testid="button-create-orch-agent"
                          >
                            <Network className="w-4 h-4" />
                            <span>Buat Orkestrator</span>
                          </button>
                        )}
                        {regularAgents.length > 0 && (
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-1">Alat Bantu</div>
                        )}
                        {regularAgents.length === 0 && orchAgents.length === 0 ? (
                          <div className="py-2 space-y-1">
                            <div className="text-xs text-muted-foreground text-center pb-1">Belum ada Alat Bantu</div>
                            {demoAgent && (
                              <a
                                href={`/chat/${demoAgent.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors border border-dashed border-primary/30 text-primary/70 hover:bg-primary/5 hover:text-primary"
                                data-testid="nav-demo-agent"
                              >
                                <Avatar className="w-5 h-5 shrink-0">
                                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                    {demoAgent.emoji || demoAgent.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-xs font-medium">{demoAgent.name}</div>
                                  <div className="text-[10px] text-muted-foreground">Coba agen demo →</div>
                                </div>
                              </a>
                            )}
                          </div>
                        ) : (
                          regularGroupNames.map((groupName) => {
                            const groupAgents = regularGroups[groupName];
                            const groupOpen = !collapsedRegularGroups.has(groupName);
                            return (
                              <div key={`grp-${groupName}`} className="mb-1">
                                <button
                                  type="button"
                                  aria-expanded={groupOpen}
                                  className="w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent/40 transition-colors"
                                  onClick={() => setCollapsedRegularGroups(prev => { const next = new Set(prev); if (next.has(groupName)) next.delete(groupName); else next.add(groupName); return next; })}
                                  data-testid={`toggle-agent-group-${groupName}`}
                                >
                                  {groupOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                                  <Folder className="w-3 h-3 shrink-0" />
                                  <span className="flex-1 text-left truncate">{groupName}</span>
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">{groupAgents.length}</Badge>
                                </button>
                                {groupOpen && (
                                  <div className="animate-group-open">
                                    {groupAgents.map((agent) => (
                            <div
                              key={agent.id}
                              className={cn(
                                "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                String(agent.id) === String(activeAgent?.id)
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                              onClick={() => handleAgentSelect(agent)}
                              data-testid={`nav-agent-${agent.id}`}
                            >
                              <Avatar className="w-5 h-5 shrink-0">
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                  {agent.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                                <span className="whitespace-nowrap block">{agent.name}</span>
                                {(agent as any).shared ? (
                                  <span className="text-[10px] text-blue-500/80 whitespace-nowrap flex items-center gap-0.5" data-testid={`badge-shared-${agent.id}`}>
                                    <Users className="w-2.5 h-2.5" />Dibagikan • {(agent as any).effectiveRole === "editor" ? "Editor" : "Viewer"}
                                  </span>
                                ) : (agent as any).folderName ? (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5">
                                    <Folder className="w-2.5 h-2.5" />{(agent as any).folderName}
                                  </span>
                                ) : null}
                              </div>
                              {(agent as any).isEnabled === false && (
                                <span className="text-[9px] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded px-1 py-0.5 shrink-0">OFF</span>
                              )}
                              <div className="flex items-center gap-0.5 invisible group-hover:visible shrink-0">
                                {!(agent as any).shared && (
                                  <Switch
                                    checked={(agent as any).isEnabled !== false}
                                    onCheckedChange={() => { toggleAgentEnabledMutation.mutate(String(agent.id)); }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="scale-[0.65] origin-right"
                                    data-testid={`toggle-agent-enabled-${agent.id}`}
                                  />
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-6 h-6"
                                  title="Atur Folder"
                                  onClick={(e) => { e.stopPropagation(); setFolderDialogAgent(agent as Agent); setFolderDialogName((agent as any).folderName || ""); }}
                                  data-testid={`button-folder-agent-${agent.id}`}
                                >
                                  <FolderPlus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-6 h-6"
                                  title="Export JSON"
                                  onClick={(e) => { e.stopPropagation(); handleExportAgent(String(agent.id), agent.name); }}
                                  disabled={exportingAgentId === String(agent.id)}
                                  data-testid={`button-export-agent-${agent.id}`}
                                >
                                  {exportingAgentId === String(agent.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                </Button>
                                {!(agent as any).shared && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-6 h-6"
                                    title="Bagikan"
                                    onClick={(e) => { e.stopPropagation(); setShareAgentTarget(agent as Agent); }}
                                    data-testid={`button-share-agent-${agent.id}`}
                                  >
                                    <Share2 className="w-3 h-3 text-blue-500" />
                                  </Button>
                                )}
                                {(agent as any).effectiveRole !== "viewer" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-6 h-6"
                                    onClick={(e) => { e.stopPropagation(); setEditAgentTarget(agent as Agent); setEditAgentName(agent.name); setEditAgentDesc((agent as any).description || ""); }}
                                    data-testid={`button-edit-agent-${agent.id}`}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}
                                {!(agent as any).shared && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-6 h-6"
                                    title={(agent as any).archived ? "Pulihkan dari Arsip" : "Arsipkan"}
                                    onClick={(e) => { e.stopPropagation(); archiveAgentMutation.mutate(String(agent.id)); }}
                                    data-testid={`button-archive-agent-${agent.id}`}
                                  >
                                    {(agent as any).archived ? <ArchiveRestore className="w-3 h-3 text-blue-500" /> : <Archive className="w-3 h-3 text-amber-500" />}
                                  </Button>
                                )}
                                {!(agent as any).shared && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-6 h-6"
                                    onClick={(e) => { e.stopPropagation(); setDeleteAgentConfirm(agent as Agent); }}
                                    data-testid={`button-delete-agent-${agent.id}`}
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </>
                    );
                  })()}
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    data-testid="button-add-agent-sidebar"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Alat Bantu Baru</span>
                  </button>
                  <button
                    onClick={() => setImportDialogOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    data-testid="button-import-agent-sidebar"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import dari JSON</span>
                  </button>
                  {/* Show Archived toggle */}
                  <button
                    onClick={() => setShowArchived(v => !v)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      showArchived
                        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                    data-testid="button-show-archived"
                  >
                    {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showArchived ? "Sembunyikan Arsip" : "Tampilkan Arsip"}</span>
                  </button>
                  {/* Archived agents section */}
                  {showArchived && (() => {
                    if (archivedAgents.length === 0) return (
                      <div className="mt-1 px-2 py-2 text-xs text-muted-foreground text-center border border-dashed border-amber-300/40 rounded-md bg-amber-50/30 dark:bg-amber-950/20">
                        Tidak ada chatbot yang diarsipkan
                      </div>
                    );
                    return (
                      <div className="mt-1 space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-amber-500/70 px-2 py-0.5 flex items-center gap-1">
                          <Archive className="w-2.5 h-2.5" />
                          Arsip Cold Storage ({archivedAgents.length})
                        </div>
                        {archivedAgents.map((agent: any) => (
                          <div
                            key={`archived-${agent.id}`}
                            className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors opacity-60 hover:opacity-90 hover:bg-sidebar-accent/40"
                          >
                            <Bot className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                            <div className="flex-1 min-w-0">
                              <span className="whitespace-nowrap block text-muted-foreground line-through text-xs">{agent.name}</span>
                            </div>
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded px-1 py-0.5 shrink-0">ARSIP</span>
                            <div className="flex items-center gap-0.5 invisible group-hover:visible shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6"
                                title="Pulihkan dari Arsip"
                                onClick={(e) => { e.stopPropagation(); archiveAgentMutation.mutate(String(agent.id)); }}
                                data-testid={`button-unarchive-agent-${agent.id}`}
                              >
                                <ArchiveRestore className="w-3 h-3 text-blue-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6"
                                title="Export JSON"
                                onClick={(e) => { e.stopPropagation(); handleExportAgent(String(agent.id), agent.name); }}
                                disabled={exportingAgentId === String(agent.id)}
                                data-testid={`button-export-archived-agent-${agent.id}`}
                              >
                                {exportingAgentId === String(agent.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6"
                                title="Hapus permanen"
                                onClick={(e) => { e.stopPropagation(); setDeleteAgentConfirm(agent as Agent); }}
                                data-testid={`button-delete-archived-agent-${agent.id}`}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className={cn("border-t border-sidebar-border space-y-0.5", sidebarCollapsed ? "p-2" : "px-3 py-2")}>
        {/* Packs shortcut */}
        <Link
          href="/packs"
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium transition-colors mb-1",
            sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
            "text-primary/80 hover:bg-primary/10 hover:text-primary border border-primary/20 bg-primary/5"
          )}
          title={sidebarCollapsed ? "Paket Domain" : undefined}
          data-testid="link-packs-sidebar"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="flex-1 flex items-center justify-between">
              Paket Domain
              <Badge variant="secondary" className="text-[10px] py-0 ml-1">Pack</Badge>
            </span>
          )}
        </Link>
        <Link
          href="/domains"
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium transition-colors mb-1",
            sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
            "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
          title={sidebarCollapsed ? "Manajemen Domain" : undefined}
          data-testid="link-domains-sidebar"
        >
          <Globe className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="flex-1 flex items-center justify-between">
              Manajemen Domain
              {activeDomains.length > 0 && (
                <Badge variant="default" className="text-[10px] py-0 ml-1 bg-green-600 text-white">
                  {activeDomains.length} aktif
                </Badge>
              )}
            </span>
          )}
        </Link>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveNav(item.id);
              setMobileMenuOpen(false);
            }}
            disabled={!currentAgent}
            className={cn(
              "w-full flex items-center rounded-md text-sm font-medium transition-colors",
              sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
              activeNav === item.id && currentAgent
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              !currentAgent && "opacity-50 cursor-not-allowed"
            )}
           
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && item.label}
            {!sidebarCollapsed && (item.id === "project-brain" || item.id === "mini-apps") && (
              <Badge variant="secondary" className="ml-auto text-xs">New</Badge>
            )}
          </button>
        ))}
      </nav>

      <div className={cn("border-t border-sidebar-border space-y-0.5 shrink-0", sidebarCollapsed ? "p-2" : "px-3 py-2")}>
        <button
          onClick={() => setActiveNav("admin-agents")}
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium transition-colors",
            sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
            activeNav === "admin-agents"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
          title={sidebarCollapsed ? "Sistem Agen AI" : undefined}
        >
          <Cpu className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 text-left">Sistem Agen AI</span>}
        </button>
        <button
          onClick={() => setProfileDialogOpen(true)}
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
            sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
         
          title={sidebarCollapsed ? "Profil" : undefined}
        >
          <Avatar className="w-6 h-6 shrink-0">
            <AvatarImage src={profile?.avatarUrl} />
            <AvatarFallback className="text-xs">
              {profile?.displayName ? getInitials(profile.displayName) : <User className="w-3 h-3" />}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && <span className="truncate">{profile?.displayName || "Profil"}</span>}
        </button>
        <Link href="/">
          <button
            className={cn(
              "w-full flex items-center rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
              sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
            )}
            title={sidebarCollapsed ? "Beranda" : undefined}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && "Beranda"}
          </button>
        </Link>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "w-full flex items-center rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
            sidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
         
          title={sidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              Ciutkan
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className={cn(
        "hidden md:flex bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white">
              {partner ? (
                partner.logoUrl
                  ? <img src={partner.logoUrl} alt={partner.brandName} className="w-9 h-9 object-contain" />
                  : <span className="text-lg font-bold" style={{ color: partner.primaryColor || undefined }}>{partner.brandName.charAt(0)}</span>
              ) : (
                <img src="/logo-gustafta.png" alt="Gustafta" className="w-9 h-9 object-contain" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-semibold text-sidebar-foreground truncate">{partner ? partner.brandName : "Gustafta"}</h1>
                <p className="text-xs text-muted-foreground">{partner ? (partner.tagline || "Asisten AI") : "Platform Penyelesaian Masalah"}</p>
              </div>
            )}
          </div>
        </div>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 md:px-4 gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-sidebar">
                <div className="p-3 border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                      {partner ? (
                        partner.logoUrl
                          ? <img src={partner.logoUrl} alt={partner.brandName} className="w-9 h-9 object-contain" />
                          : <span className="text-lg font-bold" style={{ color: partner.primaryColor || undefined }}>{partner.brandName.charAt(0)}</span>
                      ) : (
                        <img src="/logo-gustafta.png" alt="Gustafta" className="w-9 h-9 object-contain" />
                      )}
                    </div>
                    <div>
                      <h1 className="font-semibold text-sidebar-foreground">{partner ? partner.brandName : "Gustafta"}</h1>
                      <p className="text-xs text-muted-foreground">{partner ? (partner.tagline || "Asisten AI") : "Platform Penyelesaian Masalah"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col h-[calc(100%-73px)]">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-1 md:gap-2 px-2 md:px-3 max-w-[180px] md:max-w-none"
                  disabled={agentsLoading}
                 
                >
                  {currentAgent ? (
                    <>
                      <Avatar className="w-5 h-5 md:w-6 md:h-6">
                        <AvatarFallback className="text-[10px] md:text-xs bg-primary/10 text-primary">
                          {currentAgent.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm md:text-base truncate">{currentAgent.name}</span>
                      {currentAgent.orchestratorRole === "orchestrator" && (
                        <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">Orkestrator</Badge>
                      )}
                    </>
                  ) : isCurrentToolboxHub && currentToolbox ? (
                    <>
                      <Avatar className="w-5 h-5 md:w-6 md:h-6">
                        <AvatarFallback className="text-[10px] md:text-xs bg-purple-500/10 text-purple-500">
                          <Network className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm md:text-base truncate">{currentToolbox.name}</span>
                      <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">HUB</Badge>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Pilih Alat Bantu</span>
                  )}
                  <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Alat Bantu{currentToolbox ? ` - ${currentToolbox.name}` : ""}</DropdownMenuLabel>
                {!currentToolbox ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    Pilih Chatbot terlebih dahulu
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    Belum ada alat bantu di chatbot ini
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent)}
                      className="gap-2"
                     
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className={cn(
                          "text-xs",
                          agent.isOrchestrator ? "bg-purple-500/10 text-purple-600" : "bg-primary/10 text-primary"
                        )}>
                          {agent.isOrchestrator ? (
                            <Network className="w-3 h-3" />
                          ) : (
                            agent.name.substring(0, 2).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{agent.name}</span>
                      {agent.isOrchestrator && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-600 border-purple-500/30">Orkestrator</Badge>
                      )}
                      {agent.isActive && (
                        <Badge variant="secondary" className="ml-auto text-xs">Aktif</Badge>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setCreateDialogOpen(true)}
                  className="gap-2"
                 
                >
                  <Plus className="w-4 h-4" />
                  Buat Alat Bantu Baru
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="hidden sm:flex"
             
            >
              <Plus className="w-4 h-4 mr-2" />
              Alat Bantu Baru
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="icon"
              className="sm:hidden"
             
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          {currentAgent && (
            <div style={{ display: activeNav === "chat" ? "block" : "none" }} className="h-full">
              <ChatConsolePanel key={currentAgent.id} agent={currentAgent} />
            </div>
          )}
          {activeNav === "chat" ? (currentAgent ? null : renderPanel()) : (
            <div key={`${currentAgent?.id ?? 'none'}-${activeNav}`} className="animate-panel-in">
              {renderPanel()}
            </div>
          )}
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
          <div className="flex items-center justify-around h-14">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                disabled={!currentAgent}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-0 flex-1",
                  activeNav === item.id && currentAgent
                    ? "text-primary"
                    : "text-muted-foreground",
                  !currentAgent && "opacity-50"
                )}
               
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{item.shortLabel}</span>
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-0 flex-1",
                    navItems.slice(5).some((item) => activeNav === item.id) ? "text-primary" : "text-muted-foreground"
                  )}
                 
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[10px] font-medium">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mb-2">
                {navItems.slice(5).map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className="gap-2"
                   
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="gap-2">
                  <User className="w-4 h-4" />
                  Profil
                </DropdownMenuItem>
                <Link href="/">
                  <DropdownMenuItem className="gap-2">
                    <Home className="w-4 h-4" />
                    Beranda
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link href="/legal/chat">
                  <DropdownMenuItem className="gap-2 text-purple-600 dark:text-purple-400">
                    <Scale className="w-4 h-4" />
                    LexCom AI Hukum
                  </DropdownMenuItem>
                </Link>
                <Link href="/skk-coach/chat">
                  <DropdownMenuItem className="gap-2 text-emerald-600 dark:text-emerald-400">
                    <Award className="w-4 h-4" />
                    SKK Coach
                  </DropdownMenuItem>
                </Link>
                <Link href="/askom/chat">
                  <DropdownMenuItem className="gap-2 text-blue-600 dark:text-blue-400">
                    <Shield className="w-4 h-4" />
                    ASKOM AI
                  </DropdownMenuItem>
                </Link>
                <Link href="/pjbu-claw">
                  <DropdownMenuItem className="gap-2 text-violet-600 dark:text-violet-400">
                    <Users className="w-4 h-4" />
                    PJBUClaw (Manajerial)
                  </DropdownMenuItem>
                </Link>
                <Link href="/keuangan-claw">
                  <DropdownMenuItem className="gap-2 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    KeuanganClaw (BUJK)
                  </DropdownMenuItem>
                </Link>
                <Link href="/pajak-claw">
                  <DropdownMenuItem className="gap-2 text-amber-600 dark:text-amber-400">
                    <Landmark className="w-4 h-4" />
                    PajakClaw (Advisor)
                  </DropdownMenuItem>
                </Link>
                <Link href="/tendera-claw">
                  <DropdownMenuItem className="gap-2 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    TenderaClaw (10 Agen)
                  </DropdownMenuItem>
                </Link>
                <Link href="/konstra-tender-claw">
                  <DropdownMenuItem className="gap-2 text-green-600 dark:text-green-400">
                    <Search className="w-4 h-4" />
                    KonstraTender (LKPP)
                  </DropdownMenuItem>
                </Link>
                <Link href="/bg-claw">
                  <DropdownMenuItem className="gap-2 text-stone-600 dark:text-stone-400">
                    <Building2 className="w-4 h-4" />
                    BGClaw (BG001–BG009)
                  </DropdownMenuItem>
                </Link>
                <Link href="/bs-claw">
                  <DropdownMenuItem className="gap-2 text-sky-600 dark:text-sky-400">
                    <Construction className="w-4 h-4" />
                    BSClaw (BS001–BS010)
                  </DropdownMenuItem>
                </Link>
                <Link href="/im-claw">
                  <DropdownMenuItem className="gap-2 text-emerald-600 dark:text-emerald-400">
                    <Wrench className="w-4 h-4" />
                    IMClaw (IM001–IM009)
                  </DropdownMenuItem>
                </Link>
                <Link href="/ko-claw">
                  <DropdownMenuItem className="gap-2 text-violet-600 dark:text-violet-400">
                    <HardHat className="w-4 h-4" />
                    KOClaw (KO001–KO008)
                  </DropdownMenuItem>
                </Link>
                <Link href="/kk-claw">
                  <DropdownMenuItem className="gap-2 text-rose-600 dark:text-rose-400">
                    <Scale className="w-4 h-4" />
                    KKClaw (KK001–KK007)
                  </DropdownMenuItem>
                </Link>
                <Link href="/csms-claw">
                  <DropdownMenuItem className="gap-2 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    CSMSClaw (K3L)
                  </DropdownMenuItem>
                </Link>
                <Link href="/safira-claw">
                  <DropdownMenuItem className="gap-2 text-red-600 dark:text-red-400">
                    <HardHat className="w-4 h-4" />
                    SafiraClaw (SKK K3)
                  </DropdownMenuItem>
                </Link>
                <Link href="/smk3-claw">
                  <DropdownMenuItem className="gap-2 text-orange-600 dark:text-orange-400">
                    <HardHat className="w-4 h-4" />
                    SMK3Claw (IMS)
                  </DropdownMenuItem>
                </Link>
                <Link href="/lkut-claw">
                  <DropdownMenuItem className="gap-2 text-teal-600 dark:text-teal-400">
                    <BarChart3 className="w-4 h-4" />
                    LKUTClaw (BUJK)
                  </DropdownMenuItem>
                </Link>
                <Link href="/pub-lkut-claw">
                  <DropdownMenuItem className="gap-2 text-sky-600 dark:text-sky-400">
                    <TrendingUp className="w-4 h-4" />
                    PUB-LKUTClaw (Kegiatan Usaha)
                  </DropdownMenuItem>
                </Link>
                <Link href="/iso-claw-9001">
                  <DropdownMenuItem className="gap-2 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                    ISOClaw 9001 (Mutu)
                  </DropdownMenuItem>
                </Link>
                <Link href="/iso-claw-14001">
                  <DropdownMenuItem className="gap-2 text-lime-600 dark:text-lime-400">
                    <Leaf className="w-4 h-4" />
                    ISOClaw 14001 (LH)
                  </DropdownMenuItem>
                </Link>
                <Link href="/smap-claw">
                  <DropdownMenuItem className="gap-2 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    SMAPClaw ISO 37001
                  </DropdownMenuItem>
                </Link>
                <Link href="/pancek-claw">
                  <DropdownMenuItem className="gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-4 h-4" />
                    PanCEKClaw KPK
                  </DropdownMenuItem>
                </Link>
                <Link href="/sipil-claw">
                  <DropdownMenuItem className="gap-2 text-blue-600 dark:text-blue-400">
                    <HardHat className="w-4 h-4" />
                    SipilClaw (Teknik Sipil)
                  </DropdownMenuItem>
                </Link>
                <Link href="/mep-claw">
                  <DropdownMenuItem className="gap-2 text-emerald-600 dark:text-emerald-400">
                    <Wrench className="w-4 h-4" />
                    MEPClaw (MEP Gedung)
                  </DropdownMenuItem>
                </Link>
                <Link href="/k3-claw">
                  <DropdownMenuItem className="gap-2 text-orange-600 dark:text-orange-400">
                    <ShieldAlert className="w-4 h-4" />
                    K3Claw (K3 Teknis)
                  </DropdownMenuItem>
                </Link>
                <Link href="/lingkungan-claw">
                  <DropdownMenuItem className="gap-2 text-green-600 dark:text-green-400">
                    <Leaf className="w-4 h-4" />
                    LingkunganClaw (LH)
                  </DropdownMenuItem>
                </Link>
                <Link href="/manprojak-claw">
                  <DropdownMenuItem className="gap-2 text-indigo-600 dark:text-indigo-400">
                    <BarChart3 className="w-4 h-4" />
                    ManprojakClaw (SKK Manprojak)
                  </DropdownMenuItem>
                </Link>
                <Link href="/qs-claw">
                  <DropdownMenuItem className="gap-2 text-amber-600 dark:text-amber-400">
                    <span className="w-4 h-4 text-sm flex items-center justify-center">💰</span>
                    QSClaw (QS &amp; Estimasi Biaya)
                  </DropdownMenuItem>
                </Link>
                <Link href="/pengawas-claw">
                  <DropdownMenuItem className="gap-2 text-orange-600 dark:text-orange-400">
                    <span className="w-4 h-4 text-sm flex items-center justify-center">👷</span>
                    PengawasClaw (Pengawas Konstruksi)
                  </DropdownMenuItem>
                </Link>
                <Link href="/kontrak-claw">
                  <DropdownMenuItem className="gap-2 text-red-600 dark:text-red-400">
                    <span className="w-4 h-4 text-sm flex items-center justify-center">📝</span>
                    KontrakClaw (Kontrak &amp; Klaim)
                  </DropdownMenuItem>
                </Link>
                <Link href="/k3man-claw">
                  <DropdownMenuItem className="gap-2 text-orange-600 dark:text-orange-400">
                    <span className="w-4 h-4 text-sm flex items-center justify-center">⛑️</span>
                    K3ManClaw (K3 Konstruksi)
                  </DropdownMenuItem>
                </Link>
                <Link href="/arsitektur-claw">
                  <DropdownMenuItem className="gap-2 text-rose-600 dark:text-rose-400">
                    <Building2 className="w-4 h-4" />
                    ArsitekturClaw (SKK Arsitektur)
                  </DropdownMenuItem>
                </Link>
                <Link href="/surveipemetaan-claw">
                  <DropdownMenuItem className="gap-2 text-teal-600 dark:text-teal-400">
                    <MapIcon className="w-4 h-4" />
                    SurveiPemetaanClaw (SKK Survei & Pemetaan)
                  </DropdownMenuItem>
                </Link>
                <Link href="/geoteknik-claw">
                  <DropdownMenuItem className="gap-2 text-amber-600 dark:text-amber-400">
                    <span className="text-sm">⛏️</span>
                    GeoteknikClaw (SKK Geoteknik)
                  </DropdownMenuItem>
                </Link>
                <Link href="/jalanjembatan-claw">
                  <DropdownMenuItem className="gap-2 text-yellow-600 dark:text-yellow-400">
                    <span className="text-sm">🛣️</span>
                    JalanJembatanClaw (SKK Jalan & Jembatan)
                  </DropdownMenuItem>
                </Link>
                <Link href="/tatalingkungan-claw">
                  <DropdownMenuItem className="gap-2 text-green-600 dark:text-green-400">
                    <span className="text-sm">🌿</span>
                    TataLingkunganClaw (SKK Tata Lingkungan)
                  </DropdownMenuItem>
                </Link>
                <Link href="/elektrikal-claw">
                  <DropdownMenuItem className="gap-2 text-blue-600 dark:text-blue-400">
                    <span className="text-sm">🔌</span>
                    ElektrikalClaw (SKK Elektrikal)
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>

      {currentAgent && <ChatPopup agent={currentAgent} />}

      <CreateAgentDialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateAsOrchestrator(false);
        }}
        forceOrchestrator={createAsOrchestrator}
        bigIdea={contextBigIdea ? { id: contextBigIdea.id, name: contextBigIdea.name } : null}
        toolbox={currentToolbox ? { id: currentToolbox.id, name: currentToolbox.name } : null}
        series={activeSeries ? { id: activeSeries.id, name: activeSeries.name } : null}
        onCreated={() => {
          agentCreationCooldown.current = true;
          setTimeout(() => { agentCreationCooldown.current = false; }, 3000);
        }}
      />
      <GenerateBigIdeasDialog
        open={generateBigIdeasOpen}
        onOpenChange={setGenerateBigIdeasOpen}
        seriesId={activeSeriesId ? Number(activeSeriesId) : null}
        onCreated={() => setGenerateBigIdeasOpen(false)}
      />
      <CreateBigIdeaDialog 
        open={bigIdeaDialogOpen} 
        onOpenChange={setBigIdeaDialogOpen} 
        seriesId={activeSeriesId ? Number(activeSeriesId) : null}
        onCreated={() => {
          bigIdeaCreationCooldown.current = true;
          setTimeout(() => { bigIdeaCreationCooldown.current = false; }, 3000);
        }}
      />
      <CreateToolboxDialog 
        open={toolboxDialogOpen} 
        onOpenChange={setToolboxDialogOpen} 
        bigIdea={effectiveBigIdeaObj ?? undefined}
        activeSeriesId={activeSeriesId}
        onCreateModule={() => setBigIdeaDialogOpen(true)}
        onCreated={() => {
          toolboxCreationCooldown.current = true;
          setTimeout(() => { toolboxCreationCooldown.current = false; }, 3000);
        }}
      />
      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
      <SeriesManagementDialog open={seriesDialogOpen} onOpenChange={setSeriesDialogOpen} />

      {/* Dialog Edit Series */}
      <Dialog open={!!editSeriesTarget} onOpenChange={(open) => { if (!open) setEditSeriesTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Series</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-series-name">Nama Series *</Label>
              <Input
                id="edit-series-name"
                value={editSeriesName}
                onChange={(e) => setEditSeriesName(e.target.value)}
                placeholder="Nama series..."
                data-testid="input-edit-series-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-series-desc">Deskripsi</Label>
              <Textarea
                id="edit-series-desc"
                value={editSeriesDesc}
                onChange={(e) => setEditSeriesDesc(e.target.value)}
                placeholder="Deskripsi series..."
                rows={3}
                data-testid="input-edit-series-desc"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditSeriesTarget(null)}>Batal</Button>
              <Button
                onClick={() => updateSeriesMutation.mutate({ id: editSeriesTarget.id, name: editSeriesName, description: editSeriesDesc })}
                disabled={!editSeriesName.trim() || updateSeriesMutation.isPending}
                data-testid="button-save-edit-series"
              >
                {updateSeriesMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Hapus Series */}
      <AlertDialog open={!!deleteSeriesConfirm} onOpenChange={(open) => { if (!open) setDeleteSeriesConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Series?</AlertDialogTitle>
            <AlertDialogDescription>
              Series "<strong>{deleteSeriesConfirm?.name}</strong>" beserta semua Big Idea dan Toolbox di dalamnya akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSeriesMutation.mutate(deleteSeriesConfirm!.id)}
              data-testid="button-confirm-delete-series"
            >
              {deleteSeriesMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Bagikan Agen (kolaborator) */}
      <ShareAgentDialog
        agentId={shareAgentTarget ? String(shareAgentTarget.id) : null}
        agentName={shareAgentTarget?.name}
        open={!!shareAgentTarget}
        onOpenChange={(open) => { if (!open) setShareAgentTarget(null); }}
      />

      {/* Dialog Edit Alat Bantu (Agent) */}
      <Dialog open={!!editAgentTarget} onOpenChange={(open) => { if (!open) setEditAgentTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Alat Bantu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-agent-name">Nama *</Label>
              <Input
                id="edit-agent-name"
                value={editAgentName}
                onChange={(e) => setEditAgentName(e.target.value)}
                placeholder="Nama alat bantu..."
                data-testid="input-edit-agent-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-agent-desc">Deskripsi</Label>
              <Textarea
                id="edit-agent-desc"
                value={editAgentDesc}
                onChange={(e) => setEditAgentDesc(e.target.value)}
                placeholder="Deskripsi singkat..."
                rows={3}
                data-testid="input-edit-agent-desc"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditAgentTarget(null)}>Batal</Button>
              <Button
                onClick={() => updateAgentMutation.mutate({ id: String(editAgentTarget!.id), name: editAgentName, description: editAgentDesc })}
                disabled={!editAgentName.trim() || updateAgentMutation.isPending}
                data-testid="button-save-edit-agent"
              >
                {updateAgentMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={hubDialogOpen} onOpenChange={(open) => { setHubDialogOpen(open); if (!open) { setHubName(""); setHubDescription(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-500" />
              Buat Chatbot Orkestrator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Apa itu Chatbot Orkestrator?</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Chatbot Orkestrator (HUB) adalah pintu masuk utama ekosistem multi-chatbot. Ia mengarahkan pengguna ke chatbot spesialis yang tepat, menjaga alur prasyarat, dan menyimpan konteks lintas chatbot. Setiap Series hanya memiliki 1 Orkestrator.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hub-name">Nama Orkestrator *</Label>
              <Input id="hub-name" placeholder="Contoh: HUB Regulasi Konstruksi" value={hubName} onChange={(e) => setHubName(e.target.value)} data-testid="input-hub-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hub-desc">Deskripsi</Label>
              <Textarea id="hub-desc" placeholder="Jelaskan peran orkestrator ini..." value={hubDescription} onChange={(e) => setHubDescription(e.target.value)} rows={3} data-testid="input-hub-description" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setHubDialogOpen(false)}>Batal</Button>
              <Button onClick={handleCreateHub} disabled={createToolboxMutation.isPending || !hubName.trim()} data-testid="button-submit-hub">
                {createToolboxMutation.isPending ? "Membuat..." : "Buat Orkestrator"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modulOrchDialogOpen} onOpenChange={(open) => { setModulOrchDialogOpen(open); if (!open) { setModulOrchName(""); setModulOrchDescription(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-500" />
              Buat Orkestrator Modul
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Apa itu Orkestrator Modul?</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Orkestrator Modul mengoordinasikan chatbot-chatbot spesialis di dalam satu Modul. Ia menjadi pintu masuk utama dan mengarahkan pengguna ke chatbot yang tepat berdasarkan kebutuhan.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="persp-orch-name">Nama Orkestrator *</Label>
              <Input id="persp-orch-name" placeholder={`Contoh: Orkestrator ${activeBigIdeaInCurrentSeries?.name || 'Modul'}`} value={modulOrchName} onChange={(e) => setModulOrchName(e.target.value)} data-testid="input-modul-orch-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="persp-orch-desc">Deskripsi</Label>
              <Textarea id="persp-orch-desc" placeholder="Jelaskan peran orkestrator modul ini..." value={modulOrchDescription} onChange={(e) => setModulOrchDescription(e.target.value)} rows={3} data-testid="input-modul-orch-description" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setModulOrchDialogOpen(false)}>Batal</Button>
              <Button onClick={handleCreateModulOrchestrator} disabled={createToolboxMutation.isPending || !modulOrchName.trim()} data-testid="button-submit-modul-orch">
                {createToolboxMutation.isPending ? "Membuat..." : "Buat Orkestrator"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editingBigIdea && (
        <EditBigIdeaDialog
          open={editBigIdeaDialogOpen}
          onOpenChange={(open) => {
            setEditBigIdeaDialogOpen(open);
            if (!open) setEditingBigIdea(null);
          }}
          bigIdea={editingBigIdea}
        />
      )}

      {editingToolbox && (
        <EditToolboxDialog
          open={editToolboxDialogOpen}
          onOpenChange={(open) => {
            setEditToolboxDialogOpen(open);
            if (!open) setEditingToolbox(null);
          }}
          toolbox={editingToolbox}
        />
      )}

      <AlertDialog open={!!deleteBigIdeaConfirm} onOpenChange={(open) => { if (!open) setDeleteBigIdeaConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Modul?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Modul "{deleteBigIdeaConfirm?.name}"? 
              Semua Chatbot dan Alat Bantu di dalamnya juga akan terpengaruh. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-bigidea">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBigIdeaConfirm && handleDeleteBigIdea(deleteBigIdeaConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-bigidea"
            >
              {deleteBigIdea.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteToolboxConfirm} onOpenChange={(open) => { if (!open) setDeleteToolboxConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Chatbot?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Chatbot "{deleteToolboxConfirm?.name}"? 
              Semua Alat Bantu di dalamnya juga akan terpengaruh. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-toolbox">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteToolboxConfirm && handleDeleteToolbox(deleteToolboxConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-toolbox"
            >
              {deleteToolbox.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAgentConfirm} onOpenChange={(open) => { if (!open) setDeleteAgentConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Alat Bantu?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Alat Bantu "{deleteAgentConfirm?.name}"? 
              Semua pesan dan knowledge base terkait juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-agent">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAgentConfirm && handleDeleteAgent(deleteAgentConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-agent"
            >
              {deleteAgent.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Management Dialog */}
      <Dialog open={!!folderDialogAgent} onOpenChange={(open) => { if (!open) { setFolderDialogAgent(null); setFolderDialogName(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Atur Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Masukkan nama folder untuk <span className="font-medium text-foreground">{folderDialogAgent?.name}</span>. Kosongkan untuk menghapus dari folder.
            </p>
            <div className="space-y-2">
              <Label htmlFor="folder-name-input">Nama Folder</Label>
              <Input
                id="folder-name-input"
                placeholder="Contoh: Konstruksi, Marketing, HR..."
                value={folderDialogName}
                onChange={(e) => setFolderDialogName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setFolderMutation.mutate({ id: String(folderDialogAgent!.id), folderName: folderDialogName.trim() || null }); } }}
                data-testid="input-folder-name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setFolderDialogAgent(null); setFolderDialogName(""); }}>Batal</Button>
              {(folderDialogAgent as any)?.folderName && (
                <Button variant="ghost" className="text-destructive" onClick={() => setFolderMutation.mutate({ id: String(folderDialogAgent!.id), folderName: null })} disabled={setFolderMutation.isPending} data-testid="button-remove-folder">
                  Hapus Folder
                </Button>
              )}
              <Button
                onClick={() => setFolderMutation.mutate({ id: String(folderDialogAgent!.id), folderName: folderDialogName.trim() || null })}
                disabled={setFolderMutation.isPending}
                data-testid="button-save-folder"
              >
                {setFolderMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Agent Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportFile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Konfigurasi Chatbot
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Upload file JSON hasil export dari Gustafta. Konfigurasi akan diimport sebagai Alat Bantu baru ke dalam chatbot yang sedang aktif.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file-input">File JSON</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => document.getElementById("import-file-input")?.click()}
                data-testid="dropzone-import-file"
              >
                {importFile ? (
                  <div className="space-y-1">
                    <Download className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Klik untuk pilih file JSON</p>
                  </div>
                )}
                <input
                  id="import-file-input"
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  data-testid="input-import-file"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportFile(null); }}>Batal</Button>
              <Button
                onClick={handleImportAgent}
                disabled={!importFile || importLoading}
                data-testid="button-confirm-import"
              >
                {importLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengimport...</> : <><Upload className="w-4 h-4 mr-2" />Import</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
