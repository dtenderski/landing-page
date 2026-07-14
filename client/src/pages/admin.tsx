import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, CreditCard, FileText, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, Shield, ArrowLeft, Copy,
  UserCheck, AlertCircle, RefreshCw, Crown, UserCog, Wrench, Scale, Database,
  ShoppingBag, Plus, ExternalLink, Package, Trash2, Pencil, MessageCircle, Loader2,
  Link2, Zap, Globe, BookOpen, GraduationCap, Gift, Activity
} from "lucide-react";

// ---- Types ----
interface AdminMeData {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: string;
  user: any;
}

interface ModulSub {
  id: number;
  bigIdeaId: number | null;
  agentId: string | null;
  productName: string;
  productType: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  plan: string;
  status: string;
  amount: number;
  accessToken: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingTrialRequests: number;
  activeSubscriptions: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  subscription: {
    id: number;
    plan: string;
    status: string;
    endDate: string | null;
    chatbotLimit: number;
  } | null;
}

interface AdminSubscription {
  id: number;
  userId: string;
  plan: string;
  status: string;
  amount: number;
  chatbotLimit: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  grantedBy?: string | null;
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null } | null;
  grantedByUser?: { id: string; email: string | null; firstName: string | null; lastName: string | null } | null;
}

interface TrialRequest {
  id: number;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  useCase: string | null;
  status: string;
  voucherCode: string | null;
  notes: string | null;
  createdAt: string;
}

// ---- Helpers ----
function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function planLabel(plan: string) {
  const map: Record<string, string> = {
    monthly: "1 Bulan", quarterly: "3 Bulan",
    semiannual: "6 Bulan", annual: "12 Bulan", voucher: "Voucher",
  };
  return map[plan] || plan;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Aktif", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    expired: { label: "Expired", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
    approved: { label: "Disetujui", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    rejected: { label: "Ditolak", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  };
  const m = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.className}`}>{m.label}</span>;
}

// ── ProdUrlCard: configure stable production URL ──────────────────────────
function ProdUrlCard({ appUrl, isDevUrl, onSaved }: { appUrl: string; isDevUrl: boolean; onSaved: (u: string) => void }) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const url = input.trim();
    if (!url) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/set-prod-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      onSaved(data.appUrl);
      setInput("");
      toast({ title: "URL Production tersimpan!", description: data.appUrl });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Card className={isDevUrl ? "border-red-500/50 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-base">URL Production (Delivery Produk)</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          URL yang dipakai untuk generate link chatbot, embed code, dan widget yang dikirim ke customer.
          Harus URL stabil — bukan <code className="bg-muted px-1 rounded text-xs">.replit.dev</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badge */}
        <div className={`rounded-lg p-4 flex gap-3 ${isDevUrl ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
          {isDevUrl ? (
            <>
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-500">URL Saat Ini TIDAK STABIL — Jangan Dibagikan!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <code className="bg-muted px-1 rounded">{appUrl}</code> adalah URL development yang berubah-ubah dan akan <strong>rusak dalam beberapa jam</strong>.
                  Semua link chatbot dan embed code yang digenerate saat ini <strong>tidak aman</strong> untuk dikirim ke customer.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">URL Stabil Terdeteksi ✓</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <code className="bg-muted px-1 rounded">{appUrl}</code> — aman untuk delivery ke customer.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Manual input */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Set URL Production Manual</p>
          <p className="text-xs text-muted-foreground">
            Setelah deploy, buka app di browser → salin URL dari address bar → paste di sini. URL ini disimpan ke database dan dipakai di semua link delivery.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://nama-app.replit.app"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="text-sm font-mono"
              data-testid="input-prod-url"
            />
            <Button size="sm" onClick={handleSave} disabled={saving || !input.trim()} data-testid="button-save-prod-url">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Simpan"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cara Mendapatkan URL Production</p>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="font-medium">Deploy / Publish App di Replit</p>
                <p className="text-xs text-muted-foreground mt-0.5">Klik tombol <strong>Deploy</strong> di Replit. Setelah selesai, URL production otomatis tersimpan ke database — tidak perlu set manual.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="font-medium">Atau: Set Manual di Kolom Atas</p>
                <p className="text-xs text-muted-foreground mt-0.5">Buka app dari tab <strong>Deployments</strong> Replit, salin URL-nya (format: <code className="bg-muted px-1 rounded">https://xxx.replit.app</code>), lalu paste dan simpan di sini.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200">
          <strong>Penting:</strong> Jangan pernah menyalin URL dari browser saat berada di halaman dev preview (berisi <code>.replit.dev</code>). Selalu gunakan URL dari deployment tab.
        </div>
      </CardContent>
    </Card>
  );
}

function roleBadge(role: string | null) {
  if (role === "superadmin") return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1 w-fit"><Crown className="h-3 w-3" /> Super Admin</span>;
  if (role === "admin") return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 w-fit"><Shield className="h-3 w-3" /> Admin</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">User</span>;
}

// ---- Welcome WA Template Generator ----
const PLAN_LABEL_WA: Record<string, string> = {
  starter: "Starter", profesional: "Profesional", bisnis: "Bisnis", enterprise: "Enterprise",
  monthly: "1 Bulan", quarterly: "3 Bulan", semiannual: "6 Bulan", annual: "12 Bulan", free: "Free",
};

function makeWelcomeWA(sub: AdminSubscription, appUrl: string): string {
  const name = [sub.user?.firstName, sub.user?.lastName].filter(Boolean).join(" ") || "Kak";
  const plan = PLAN_LABEL_WA[sub.plan] ?? sub.plan;
  return `Halo ${name}! 👋

Selamat, paket Gustafta *${plan}* Anda sudah *AKTIF* 🎉

Silakan langsung mulai:
1. Buka: ${appUrl}
2. Klik "Masuk" — gunakan akun yang sudah Anda daftarkan
3. Pilih "Dashboard" → chatbot siap dikonfigurasi

✅ Yang bisa Anda gunakan sekarang:
• Buat & konfigurasi AI Chatbot
• Akses 131 Hub Orchestrator siap pakai
• Upload knowledge base (7 tipe dokumen)
• Embed chatbot di website Anda
• 45 Mini Apps produktivitas

📖 Panduan langkah-demi-langkah: ${appUrl}/welcome

Butuh bantuan? Hubungi kami:
📱 WA: 081287941900 / 082299417818

Selamat berkreasi! 🚀
— Tim Gustafta`;
}

// ---- Main Component ----
export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: TrialRequest | null }>({ open: false, request: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: TrialRequest | null }>({ open: false, request: null });
  const [durationDays, setDurationDays] = useState("7");
  const [trialPlan, setTrialPlan] = useState("enterprise");
  const [rejectNotes, setRejectNotes] = useState("");
  const [subDialog, setSubDialog] = useState<{ open: boolean; sub: AdminSubscription | null }>({ open: false, sub: null });
  const [newStatus, setNewStatus] = useState("active");
  const [newEndDate, setNewEndDate] = useState("");
  const [waDialog, setWaDialog] = useState<{ open: boolean; sub: AdminSubscription | null }>({ open: false, sub: null });
  const [earlyDialog, setEarlyDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [earlyPlan, setEarlyPlan] = useState("enterprise");
  const [earlyDuration, setEarlyDuration] = useState("365");
  const [appUrl, setAppUrl] = useState<string>(window.location.origin);

  useEffect(() => {
    fetch("/api/config/app-url")
      .then((r) => r.json())
      .then((d) => { if (d.appUrl) setAppUrl(d.appUrl); })
      .catch(() => {});
  }, []);

  // Store tab state
  const [manualForm, setManualForm] = useState({ name: "", email: "", phone: "", agentId: "" });
  const [manualResult, setManualResult] = useState<{ accessUrl: string; agentName: string } | null>(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", category: "Konstruksi", price: "", agentId: "", emoji: "🤖" });
  const [showProductForm, setShowProductForm] = useState(false);

  // ---- Queries ----
  const { data: meData, isError: meError, isLoading: meLoading } = useQuery<AdminMeData>({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  const isSuperAdmin = meData?.isSuperAdmin === true;
  const isAdmin = meData?.isAdmin === true;

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: usersList = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin && activeTab === "users",
  });

  const { data: adminsList = [], isLoading: adminsLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/admins"],
    enabled: isSuperAdmin && activeTab === "admins",
  });

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery<AdminSubscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: isAdmin && activeTab === "subscriptions",
  });

  const { data: trialList = [], isLoading: trialLoading } = useQuery<TrialRequest[]>({
    queryKey: ["/api/admin/trial-requests"],
    enabled: isAdmin && activeTab === "trials",
  });

  interface StoreOrder {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    amount: number;
    status: string;
    midtransOrderId: string;
    accessToken: string;
    createdAt: string;
  }

  interface StoreProduct {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    agentId: number | null;
    emoji: string;
    isActive: boolean;
    sortOrder: number;
  }

  const { data: modulSubs = [], isLoading: modulSubsLoading, refetch: refetchModulSubs } = useQuery<ModulSub[]>({
    queryKey: ["/api/admin/modul-subs"],
    enabled: isAdmin && activeTab === "modul-subs",
  });

  const [modulSubDialog, setModulSubDialog] = useState<{ open: boolean; sub: ModulSub | null }>({ open: false, sub: null });
  const [modulSubStatus, setModulSubStatus] = useState("active");
  const [modulSubDays, setModulSubDays] = useState("30");
  const [modulWaDialog, setModulWaDialog] = useState<{ open: boolean; sub: ModulSub | null }>({ open: false, sub: null });
  const [storeWaDialog, setStoreWaDialog] = useState<{ open: boolean; order: StoreOrder | null }>({ open: false, order: null });

  // Scalev state
  interface ScalevMapping {
    id: number;
    scalevProductName: string;
    type: string;
    agentId: number | null;
    bigIdeaId: number | null;
    agentIds: number[] | null;
    label: string;
    createdAt: string;
  }
  const [scalevForm, setScalevForm] = useState({ scalevProductName: "", type: "chatbot", agentId: "", bigIdeaId: "", agentIds: "", label: "" });
  const [showScalevForm, setShowScalevForm] = useState(false);
  const [scalevEditId, setScalevEditId] = useState<number | null>(null);

  const [autoRegForm, setAutoRegForm] = useState({ productName: "", price: "", description: "", type: "chatbot", agentId: "", bigIdeaId: "", agentIds: "", label: "" });
  const [showAutoReg, setShowAutoReg] = useState(false);
  const [autoRegResult, setAutoRegResult] = useState<{ checkoutUrl: string; message: string } | null>(null);
  const autoRegMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/scalev-auto-register", data),
    onSuccess: (res: any) => {
      setAutoRegResult({ checkoutUrl: res.checkoutUrl, message: res.message });
      setAutoRegForm({ productName: "", price: "", description: "", type: "chatbot", agentId: "", bigIdeaId: "", agentIds: "", label: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scalev-mappings"] });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  const { data: storeOrders = [], isLoading: storeOrdersLoading, refetch: refetchOrders } = useQuery<StoreOrder[]>({
    queryKey: ["/api/store/admin/orders"],
    queryFn: async () => { const res = await fetch("/api/store/admin/orders"); return res.json(); },
    enabled: isAdmin && activeTab === "store",
  });

  const { data: storeProducts = [], isLoading: storeProductsLoading, refetch: refetchProducts } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store/admin/products"],
    queryFn: async () => { const res = await fetch("/api/store/admin/products"); return res.json(); },
    enabled: isAdmin && activeTab === "store",
  });

  const { data: scalevMappings = [], isLoading: scalevLoading, refetch: refetchScalev } = useQuery<ScalevMapping[]>({
    queryKey: ["/api/admin/scalev-mappings"],
    enabled: isAdmin && activeTab === "scalev",
  });

  const createScalevMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/scalev-mappings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scalev-mappings"] });
      setScalevForm({ scalevProductName: "", type: "chatbot", agentId: "", bigIdeaId: "", agentIds: "", label: "" });
      setShowScalevForm(false);
      setScalevEditId(null);
      toast({ title: "Mapping berhasil disimpan." });
    },
    onError: () => toast({ title: "Gagal menyimpan mapping.", variant: "destructive" }),
  });

  const updateScalevMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/scalev-mappings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scalev-mappings"] });
      setScalevForm({ scalevProductName: "", type: "chatbot", agentId: "", bigIdeaId: "", agentIds: "", label: "" });
      setShowScalevForm(false);
      setScalevEditId(null);
      toast({ title: "Mapping diperbarui." });
    },
    onError: () => toast({ title: "Gagal memperbarui mapping.", variant: "destructive" }),
  });

  const deleteScalevMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/scalev-mappings/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scalev-mappings"] });
      toast({ title: "Mapping dihapus." });
    },
    onError: () => toast({ title: "Gagal menghapus mapping.", variant: "destructive" }),
  });

  // ---- Mutations ----
  const toggleUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PATCH", `/api/admin/users/${userId}/toggle`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Status pengguna diperbarui." });
    },
    onError: () => toast({ title: "Gagal memperbarui status.", variant: "destructive" }),
  });

  const earlyAdopterMutation = useMutation({
    mutationFn: ({ userId, plan, durationDays }: { userId: string; plan: string; durationDays: number }) =>
      apiRequest("POST", `/api/admin/users/${userId}/early-adopter`, { plan, durationDays }),
    onSuccess: async (data: any) => {
      const result = await data.json().catch(() => ({}));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setEarlyDialog({ open: false, user: null });
      toast({ title: "Early Adopter aktif", description: result?.message || "Langganan gratis diaktifkan." });
    },
    onError: () => toast({ title: "Gagal mengaktifkan Early Adopter.", variant: "destructive" }),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PATCH", `/api/admin/admins/${userId}/toggle`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Status admin diperbarui." });
    },
    onError: () => toast({ title: "Gagal memperbarui status admin.", variant: "destructive" }),
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Role pengguna diperbarui." });
    },
    onError: () => toast({ title: "Gagal mengubah role.", variant: "destructive" }),
  });

  const approveTrialMutation = useMutation({
    mutationFn: ({ id, durationDays, plan }: { id: number; durationDays: number; plan: string }) =>
      apiRequest("POST", `/api/admin/trial-requests/${id}/approve`, { durationDays, plan }),
    onSuccess: async (data: any) => {
      const result = await data.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setApproveDialog({ open: false, request: null });
      toast({
        title: result.instantActivated
          ? `Aktif! Plan ${result.plan} ${result.durationDays} hari`
          : `Voucher dibuat: ${result.voucherCode}`,
        description: result.instantActivated
          ? `User langsung dapat akses. Voucher cadangan: ${result.voucherCode}`
          : "User belum daftar — kirim kode voucher via WA/Email agar bisa redeem.",
      });
    },
    onError: () => toast({ title: "Gagal menyetujui trial.", variant: "destructive" }),
  });

  const rejectTrialMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      apiRequest("POST", `/api/admin/trial-requests/${id}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setRejectDialog({ open: false, request: null });
      setRejectNotes("");
      toast({ title: "Permintaan trial ditolak." });
    },
    onError: () => toast({ title: "Gagal menolak permintaan.", variant: "destructive" }),
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ id, status, endDate }: { id: number; status: string; endDate: string }) =>
      apiRequest("PATCH", `/api/admin/subscriptions/${id}`, { status, endDate: endDate || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      const activatedSub = subDialog.sub;
      const activatedStatus = newStatus;
      setSubDialog({ open: false, sub: null });
      toast({ title: "Langganan diperbarui." });
      // Auto-show WA welcome dialog when admin just activated a subscription
      if (activatedStatus === "active" && activatedSub) {
        setTimeout(() => setWaDialog({ open: true, sub: activatedSub }), 300);
      }
    },
    onError: () => toast({ title: "Gagal memperbarui langganan.", variant: "destructive" }),
  });

  const createManualOrderMutation = useMutation({
    mutationFn: async (data: { agentId: number; name: string; email: string; phone: string }) => {
      const res = await apiRequest("POST", "/api/store/order/manual", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setManualResult({ accessUrl: data.accessUrl, agentName: data.agentName });
      setManualForm({ name: "", email: "", phone: "", agentId: "" });
      refetchOrders();
      toast({ title: "Link akses berhasil dibuat!", description: `Order manual untuk ${data.agentName} siap dikirim.` });
    },
    onError: (err: any) => toast({ title: "Gagal buat order manual", description: err.message, variant: "destructive" }),
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("POST", "/api/store/admin/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/catalog"] });
      setProductForm({ name: "", description: "", category: "Konstruksi", price: "", agentId: "", emoji: "🤖" });
      setShowProductForm(false);
      toast({ title: "Produk berhasil ditambahkan!" });
    },
    onError: (err: any) => toast({ title: "Gagal tambah produk", description: err.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/store/admin/products/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/catalog"] });
      toast({ title: "Produk dihapus." });
    },
    onError: () => toast({ title: "Gagal hapus produk.", variant: "destructive" }),
  });

  const updateModulSubMutation = useMutation({
    mutationFn: ({ id, status, durationDays }: { id: number; status: string; durationDays: string }) =>
      apiRequest("PATCH", `/api/admin/modul-subs/${id}`, { status, durationDays: parseInt(durationDays) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modul-subs"] });
      const activatedSub = modulSubDialog.sub;
      const activatedStatus = modulSubStatus;
      setModulSubDialog({ open: false, sub: null });
      toast({ title: "Subscriber modul diperbarui." });
      if (activatedStatus === "active" && activatedSub) {
        setTimeout(() => setModulWaDialog({ open: true, sub: activatedSub }), 300);
      }
    },
    onError: () => toast({ title: "Gagal memperbarui subscriber.", variant: "destructive" }),
  });

  const toggleProductMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/store/admin/products/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/catalog"] });
      toast({ title: "Status produk diperbarui." });
    },
    onError: () => toast({ title: "Gagal ubah status produk.", variant: "destructive" }),
  });

  const seedLexComMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/seed-lexcom", {}),
    onSuccess: async (res: any) => {
      const data = await res.json().catch(() => ({}));
      if (data.skipped) {
        toast({ title: "LexCom sudah ada", description: "Series LexCom sudah tersedia di workspace Anda." });
      } else {
        toast({ title: "LexCom berhasil di-seed!", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/series"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
    },
    onError: () => toast({ title: "Gagal seed LexCom", description: "Coba lagi atau cek log server.", variant: "destructive" }),
  });

  // ---- Guards ----
  if (meError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Login Diperlukan</h1>
          <p className="text-muted-foreground">Silakan login terlebih dahulu untuk mengakses admin panel.</p>
          <a href="/login">
            <Button className="gap-2">Masuk ke Gustafta</Button>
          </a>
        </div>
      </div>
    );
  }

  if (meData && !meData.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <Shield className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground">Halaman ini hanya untuk administrator Gustafta.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (meLoading || !meData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Memeriksa akses admin...</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kode voucher disalin!" });
  };

  const tabCount = isSuperAdmin ? 7 : 6;
  const isDevUrl = appUrl.includes(".replit.dev") || appUrl.includes("localhost");

  return (
    <div className="min-h-screen bg-background">
      {/* ── URL WARNING BANNER ── */}
      {isDevUrl && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-center text-sm flex items-center justify-center gap-2 flex-wrap">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>⚠️ URL DEVELOPMENT terdeteksi:</strong> Semua link yang digenerate ({appUrl}) adalah URL sementara yang <strong>akan rusak</strong> jika dibagikan ke customer.
            Silakan deploy app dulu → URL akan berubah ke <code className="bg-red-800 px-1 rounded">.replit.app</code>,
            atau set <strong>PROD_URL</strong> di tab Tools.
          </span>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                Admin Panel
                {isSuperAdmin ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1 font-medium">
                    <Crown className="h-3 w-3" /> Super Admin
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 font-medium">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">Gustafta Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/panduan-delivery">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs hidden sm:flex" data-testid="button-panduan-delivery">
                <FileText className="h-3.5 w-3.5" />
                Panduan Delivery
              </Button>
            </Link>
            <Link href="/admin/system-load">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs hidden sm:flex border-indigo-500/40 text-indigo-500 hover:bg-indigo-500/10" data-testid="button-system-load">
                <Activity className="h-3.5 w-3.5" />
                Beban Sistem
              </Button>
            </Link>
            {isSuperAdmin && (
              <Link href="/multiclaw-admin">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs hidden sm:flex border-violet-500/40 text-violet-500 hover:bg-violet-500/10" data-testid="button-multiclaw-admin-header">
                  <Wrench className="h-3.5 w-3.5" />
                  MultiClaw Admin
                </Button>
              </Link>
            )}
            {isSuperAdmin ? <Crown className="h-4 w-4 text-purple-500" /> : <Shield className="h-4 w-4 text-primary" />}
            <span className="text-sm font-medium hidden sm:block">{meData.user?.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total-users">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Pengguna</p>
                  <p className="text-3xl font-bold mt-1">{statsLoading ? "—" : (stats?.totalUsers ?? 0)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-users">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pengguna Aktif</p>
                  <p className="text-3xl font-bold mt-1 text-green-600">{statsLoading ? "—" : (stats?.activeUsers ?? 0)}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-subs">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Langganan Aktif</p>
                  <p className="text-3xl font-bold mt-1 text-primary">{statsLoading ? "—" : (stats?.activeSubscriptions ?? 0)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending-trials">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Trial Menunggu</p>
                  <p className="text-3xl font-bold mt-1 text-yellow-600">{statsLoading ? "—" : (stats?.pendingTrialRequests ?? 0)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full max-w-2xl`} style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
            {isSuperAdmin && (
              <TabsTrigger value="admins" className="gap-1.5 text-xs" data-testid="tab-admins">
                <UserCog className="h-3.5 w-3.5" /> Admin
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="gap-1.5 text-xs" data-testid="tab-users">
              <Users className="h-3.5 w-3.5" /> Pengguna
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5 text-xs" data-testid="tab-subscriptions">
              <CreditCard className="h-3.5 w-3.5" /> Langganan
            </TabsTrigger>
            <TabsTrigger value="trials" className="gap-1.5 text-xs" data-testid="tab-trials">
              <FileText className="h-3.5 w-3.5" /> Trial
              {(stats?.pendingTrialRequests ?? 0) > 0 && (
                <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {stats?.pendingTrialRequests}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="modul-subs" className="gap-1.5 text-xs" data-testid="tab-modul-subs">
              <Package className="h-3.5 w-3.5" /> Modul
            </TabsTrigger>
            <TabsTrigger value="store" className="gap-1.5 text-xs" data-testid="tab-store">
              <ShoppingBag className="h-3.5 w-3.5" /> Store
            </TabsTrigger>
            <TabsTrigger value="scalev" className="gap-1.5 text-xs" data-testid="tab-scalev">
              <Zap className="h-3.5 w-3.5" /> Scalev
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-1.5 text-xs" data-testid="tab-tools">
              <Wrench className="h-3.5 w-3.5" /> Tools
            </TabsTrigger>
          </TabsList>

          {/* ========== ADMINS TAB (Super Admin only) ========== */}
          {isSuperAdmin && (
            <TabsContent value="admins" className="mt-4">
              <Card className="mb-4 border-dashed" data-testid="card-authority-legend">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Siapa Boleh Apa
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Ringkasan kewenangan tiap peran di panel ini.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-3">
                      <p className="text-sm font-semibold flex items-center gap-1.5 text-purple-800 dark:text-purple-300 mb-2"><Crown className="h-3.5 w-3.5" /> Super Admin</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                        <li>Angkat / turunkan Admin</li>
                        <li>Aktif / nonaktifkan akun Admin</li>
                        <li>+ semua kewenangan Admin di bawah</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                      <p className="text-sm font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300 mb-2"><Shield className="h-3.5 w-3.5" /> Admin</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                        <li>Kelola pengguna: aktif/nonaktif &amp; beri Early Adopter</li>
                        <li>Kelola langganan &amp; setujui trial</li>
                        <li>Kelola mitra, seat &amp; permintaan top-up</li>
                        <li>Kelola store, produk &amp; Scalev</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Admin &amp; Super Admin otomatis mendapat akses fitur <strong>Enterprise</strong>. Mengubah peran &amp; mengelola akun admin <strong>hanya</strong> bisa dilakukan Super Admin.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserCog className="h-4 w-4" /> Manajemen Admin
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Atur akun admin. Untuk membuat admin baru, buka tab Pengguna → ubah role ke "Admin".
                      </p>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] })}
                      data-testid="button-refresh-admins"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {adminsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
                    </div>
                  ) : adminsList.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <UserCog className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-muted-foreground">Belum ada akun admin.</p>
                      <p className="text-xs text-muted-foreground">Buka tab Pengguna → ubah role user menjadi "Admin" untuk menambah admin.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 pr-4 font-medium">Nama</th>
                            <th className="text-left py-2 pr-4 font-medium">Email</th>
                            <th className="text-left py-2 pr-4 font-medium">Status</th>
                            <th className="text-left py-2 pr-4 font-medium">Bergabung</th>
                            <th className="text-right py-2 font-medium">On/Off</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {adminsList.map((admin) => (
                            <tr key={admin.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-admin-${admin.id}`}>
                              <td className="py-3 pr-4 font-medium">
                                {[admin.firstName, admin.lastName].filter(Boolean).join(" ") || "—"}
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground text-xs">{admin.email || "—"}</td>
                              <td className="py-3 pr-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${admin.isActive !== false ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"}`}>
                                  {admin.isActive !== false ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground text-xs">{formatDate(admin.createdAt)}</td>
                              <td className="py-3 text-right">
                                <Button
                                  variant={admin.isActive !== false ? "outline" : "default"}
                                  size="sm"
                                  className={`gap-1 text-xs ${admin.isActive !== false ? "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : "bg-green-600 hover:bg-green-700 text-white"}`}
                                  onClick={() => toggleAdminMutation.mutate(admin.id)}
                                  disabled={toggleAdminMutation.isPending}
                                  data-testid={`button-toggle-admin-${admin.id}`}
                                >
                                  {admin.isActive !== false ? (
                                    <><ToggleRight className="h-3.5 w-3.5" /> Nonaktifkan</>
                                  ) : (
                                    <><ToggleLeft className="h-3.5 w-3.5" /> Aktifkan</>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ========== USERS TAB ========== */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Manajemen Pengguna</CardTitle>
                    {!isSuperAdmin && (
                      <p className="text-xs text-muted-foreground mt-1">Aktifkan/nonaktifkan pengguna berdasarkan status pembayaran atau pelanggaran.</p>
                    )}
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
                    data-testid="button-refresh-users"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : usersList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada pengguna terdaftar.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Pengguna</th>
                          <th className="text-left py-2 pr-4 font-medium">Role</th>
                          <th className="text-left py-2 pr-4 font-medium">Langganan</th>
                          <th className="text-left py-2 pr-4 font-medium">Status</th>
                          <th className="text-left py-2 pr-4 font-medium">Bergabung</th>
                          <th className="text-right py-2 font-medium">On/Off</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {usersList.map((user) => (
                          <tr key={user.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-user-${user.id}`}>
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</p>
                                <p className="text-xs text-muted-foreground">{user.email || "—"}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              {isSuperAdmin && user.role !== "superadmin" ? (
                                <select
                                  value={user.role || "user"}
                                  onChange={(e) => setRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                                  className="text-xs border rounded px-1.5 py-0.5 bg-background"
                                  data-testid={`select-role-${user.id}`}
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                roleBadge(user.role)
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              {user.subscription ? (
                                <div>
                                  <p className="font-medium">{planLabel(user.subscription.plan)}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {statusBadge(user.subscription.status)}
                                    <span className="text-xs text-muted-foreground">
                                      s/d {formatDate(user.subscription.endDate)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">Tidak berlangganan</span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive !== false ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"}`}>
                                {user.isActive !== false ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                            <td className="py-3 text-right">
                              {user.role === "superadmin" ? (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                    onClick={() => { setEarlyPlan("enterprise"); setEarlyDuration("365"); setEarlyDialog({ open: true, user }); }}
                                    disabled={earlyAdopterMutation.isPending}
                                    data-testid={`button-early-adopter-${user.id}`}
                                  >
                                    <Gift className="h-3.5 w-3.5" /> Early Adopter
                                  </Button>
                                  <Button
                                    variant={user.isActive !== false ? "outline" : "default"}
                                    size="sm"
                                    className={`gap-1 text-xs ${user.isActive !== false ? "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : "bg-green-600 hover:bg-green-700 text-white"}`}
                                    onClick={() => toggleUserMutation.mutate(user.id)}
                                    disabled={toggleUserMutation.isPending}
                                    data-testid={`button-toggle-user-${user.id}`}
                                  >
                                    {user.isActive !== false ? (
                                      <><ToggleRight className="h-3.5 w-3.5" /> Nonaktifkan</>
                                    ) : (
                                      <><ToggleLeft className="h-3.5 w-3.5" /> Aktifkan</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== SUBSCRIPTIONS TAB ========== */}
          <TabsContent value="subscriptions" className="mt-4">
            <Card className="mb-4 border-dashed" data-testid="card-status-flow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Alur Status Langganan
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Perjalanan sebuah langganan dari pengguna mendaftar sampai chatbot terkirim.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
                  {[
                    { n: "1", t: "Daftar", d: "Pengguna membuat akun & verifikasi email.", c: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
                    { n: "2", t: "Bayar", d: "Checkout via Scalev. Status: pending.", c: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
                    { n: "3", t: "Aktif", d: "Pembayaran lunas / diberi Early Adopter. Status: active.", c: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
                    { n: "4", t: "Terkirim", d: "Chatbot premium disalin & masuk dashboard pengguna.", c: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
                  ].map((s, i, arr) => (
                    <div key={s.n} className="flex items-center gap-2 flex-1" data-testid={`flow-step-${s.n}`}>
                      <div className="rounded-lg border p-3 flex-1 h-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${s.c}`}>{s.n}</span>
                          <span className="text-sm font-semibold">{s.t}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.d}</p>
                      </div>
                      {i < arr.length - 1 && <span className="hidden sm:block text-muted-foreground shrink-0">→</span>}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  <strong>Early Adopter</strong> melompat langsung ke <strong>Aktif</strong> (gratis, Rp 0) tanpa tahap Bayar — tercatat pada kolom "Diberi oleh" di bawah.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Data Langganan</CardTitle>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] })}
                    data-testid="button-refresh-subs"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : subscriptions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada data langganan.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Pengguna</th>
                          <th className="text-left py-2 pr-4 font-medium">Paket</th>
                          <th className="text-left py-2 pr-4 font-medium">Harga</th>
                          <th className="text-left py-2 pr-4 font-medium">Status</th>
                          <th className="text-left py-2 pr-4 font-medium">Mulai</th>
                          <th className="text-left py-2 pr-4 font-medium">Berakhir</th>
                          <th className="text-left py-2 pr-4 font-medium">Diberi oleh</th>
                          <th className="text-right py-2 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-sub-${sub.id}`}>
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium">{[sub.user?.firstName, sub.user?.lastName].filter(Boolean).join(" ") || "—"}</p>
                                <p className="text-xs text-muted-foreground">{sub.user?.email || "—"}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-medium">{planLabel(sub.plan)}</p>
                              <p className="text-xs text-muted-foreground">{sub.chatbotLimit} chatbot</p>
                            </td>
                            <td className="py-3 pr-4">
                              {sub.amount > 0 ? `Rp ${sub.amount.toLocaleString("id-ID")}` : "—"}
                            </td>
                            <td className="py-3 pr-4">{statusBadge(sub.status)}</td>
                            <td className="py-3 pr-4 text-muted-foreground text-xs">{formatDate(sub.startDate)}</td>
                            <td className="py-3 pr-4 text-muted-foreground text-xs">{formatDate(sub.endDate)}</td>
                            <td className="py-3 pr-4 text-xs" data-testid={`text-granted-by-${sub.id}`}>
                              {sub.grantedBy ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                    <Gift className="h-3 w-3" />
                                    {[sub.grantedByUser?.firstName, sub.grantedByUser?.lastName].filter(Boolean).join(" ") || sub.grantedByUser?.email || "admin"}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">Diberi pada {formatDate(sub.createdAt)}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {sub.status === "active" && (
                                  <Button
                                    variant="outline" size="sm" className="text-xs text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
                                    onClick={() => setWaDialog({ open: true, sub })}
                                    data-testid={`button-wa-sub-${sub.id}`}
                                    title="Kirim Welcome WA"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" /> WA
                                  </Button>
                                )}
                                <Button
                                  variant="outline" size="sm" className="text-xs"
                                  onClick={() => {
                                    setSubDialog({ open: true, sub });
                                    setNewStatus(sub.status);
                                    setNewEndDate(sub.endDate ? sub.endDate.slice(0, 10) : "");
                                  }}
                                  data-testid={`button-edit-sub-${sub.id}`}
                                >
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TRIALS TAB ========== */}
          <TabsContent value="trials" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Permintaan Trial</CardTitle>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-requests"] })}
                    data-testid="button-refresh-trials"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {trialLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : trialList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada permintaan trial.</p>
                ) : (
                  <div className="space-y-3">
                    {trialList.map((req) => (
                      <div
                        key={req.id}
                        className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                        data-testid={`card-trial-${req.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{req.name}</p>
                              {statusBadge(req.status)}
                              <span className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span>📱 {req.phone}</span>
                              <span>✉️ {req.email}</span>
                              {req.company && <span>🏢 {req.company}</span>}
                            </div>
                            {req.useCase && (
                              <p className="text-sm text-muted-foreground italic mt-1">"{req.useCase}"</p>
                            )}
                            {req.voucherCode && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">Kode voucher:</span>
                                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded font-bold text-primary">
                                  {req.voucherCode}
                                </code>
                                <Button
                                  variant="ghost" size="icon" className="h-6 w-6"
                                  onClick={() => copyToClipboard(req.voucherCode!)}
                                  data-testid={`button-copy-voucher-${req.id}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {req.notes && (
                              <p className="text-xs text-muted-foreground mt-1">Catatan: {req.notes}</p>
                            )}
                          </div>

                          {req.status === "pending" && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={() => setApproveDialog({ open: true, request: req })}
                                data-testid={`button-approve-trial-${req.id}`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="gap-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                                onClick={() => setRejectDialog({ open: true, request: req })}
                                data-testid={`button-reject-trial-${req.id}`}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Tolak
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== MODUL SUBSCRIBERS TAB ========== */}
          <TabsContent value="modul-subs" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" /> Subscriber Modul & Chatbot Premium
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kelola pelanggan yang berlangganan Paket Series/Modul atau Chatbot Premium
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchModulSubs()} data-testid="button-refresh-modul-subs">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {modulSubsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : modulSubs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Belum ada subscriber modul.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left py-2 pr-3 font-medium">Nama / Email</th>
                          <th className="text-left py-2 pr-3 font-medium">Produk</th>
                          <th className="text-left py-2 pr-3 font-medium">Paket</th>
                          <th className="text-left py-2 pr-3 font-medium">Status</th>
                          <th className="text-left py-2 pr-3 font-medium">Berakhir</th>
                          <th className="text-left py-2 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modulSubs.map(sub => (
                          <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-modul-sub-${sub.id}`}>
                            <td className="py-2.5 pr-3">
                              <p className="font-medium truncate max-w-[140px]">{sub.customerName}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]">{sub.customerEmail}</p>
                              {sub.customerPhone && (
                                <p className="text-xs text-muted-foreground">{sub.customerPhone}</p>
                              )}
                            </td>
                            <td className="py-2.5 pr-3">
                              <p className="text-xs font-medium truncate max-w-[120px]">{sub.productName}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{sub.productType}</span>
                              {sub.bigIdeaId && (
                                <a
                                  href={`/modul/${sub.bigIdeaId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" /> Buka Modul
                                </a>
                              )}
                              {sub.agentId && (
                                <a
                                  href={`/bot/${sub.agentId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" /> Buka Chatbot
                                </a>
                              )}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className="text-xs capitalize">{sub.plan}</span>
                              {sub.amount > 0 && (
                                <p className="text-xs text-muted-foreground">Rp {sub.amount.toLocaleString("id-ID")}</p>
                              )}
                            </td>
                            <td className="py-2.5 pr-3">{statusBadge(sub.status)}</td>
                            <td className="py-2.5 pr-3 text-xs text-muted-foreground">{formatDate(sub.endDate)}</td>
                            <td className="py-2.5">
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() => {
                                    setModulSubDialog({ open: true, sub });
                                    setModulSubStatus(sub.status);
                                    setModulSubDays("30");
                                  }}
                                  data-testid={`button-edit-modul-sub-${sub.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                {sub.status === "active" && (sub.bigIdeaId || sub.agentId) && (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => setModulWaDialog({ open: true, sub })}
                                    data-testid={`button-wa-modul-sub-${sub.id}`}
                                    title="Kirim link akses via WA"
                                  >
                                    WA
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== STORE TAB ========== */}
          <TabsContent value="store" className="mt-4">
            <div className="space-y-4">

              {/* ── Kelola Produk ── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-base">Kelola Produk Store</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => refetchProducts()} data-testid="button-refresh-products">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
                        onClick={() => setShowProductForm(!showProductForm)}
                        data-testid="button-toggle-product-form">
                        <Plus className="h-4 w-4" /> {showProductForm ? "Tutup Form" : "Tambah Produk"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Form tambah produk */}
                  {showProductForm && (
                    <div className="border border-violet-500/30 rounded-lg p-4 bg-violet-500/5 space-y-3">
                      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Produk Baru</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Nama Produk *</label>
                          <Input value={productForm.name} onChange={(e) => setProductForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="mis. Tender Readiness Checker" data-testid="input-product-name" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Harga (IDR) *</label>
                          <Input type="number" value={productForm.price} onChange={(e) => setProductForm(f => ({ ...f, price: e.target.value }))}
                            placeholder="149000" data-testid="input-product-price" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Kategori</label>
                          <Input value={productForm.category} onChange={(e) => setProductForm(f => ({ ...f, category: e.target.value }))}
                            placeholder="Konstruksi" data-testid="input-product-category" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Agent ID (opsional)</label>
                          <Input type="number" value={productForm.agentId} onChange={(e) => setProductForm(f => ({ ...f, agentId: e.target.value }))}
                            placeholder="mis. 24" data-testid="input-product-agent-id" />
                          <p className="text-xs text-muted-foreground mt-1">ID chatbot yang dibeli user saat checkout produk ini</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Emoji</label>
                          <Input value={productForm.emoji} onChange={(e) => setProductForm(f => ({ ...f, emoji: e.target.value }))}
                            placeholder="🤖" data-testid="input-product-emoji" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Deskripsi</label>
                          <Textarea value={productForm.description} onChange={(e) => setProductForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Deskripsi singkat produk..." rows={2} data-testid="input-product-description" />
                        </div>
                      </div>
                      <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                        disabled={createProductMutation.isPending || !productForm.name || !productForm.price}
                        onClick={() => createProductMutation.mutate({
                          name: productForm.name,
                          description: productForm.description,
                          category: productForm.category,
                          price: Number(productForm.price),
                          agentId: productForm.agentId ? Number(productForm.agentId) : null,
                          emoji: productForm.emoji || "🤖",
                          isActive: true,
                        })}
                        data-testid="button-save-product">
                        {createProductMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Plus className="h-4 w-4" /> Simpan Produk</>}
                      </Button>
                    </div>
                  )}

                  {/* Daftar produk */}
                  {storeProductsLoading ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">Memuat produk...</div>
                  ) : storeProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p>Belum ada produk. Klik <strong>Tambah Produk</strong> untuk mulai.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {storeProducts.map((p) => (
                        <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap"
                          data-testid={`row-product-${p.id}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl flex-shrink-0">{p.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.category} · Rp {p.price.toLocaleString("id-ID")}
                                {p.agentId ? ` · Agent #${p.agentId}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleProductMutation.mutate({ id: p.id, isActive: !p.isActive })}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${p.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-muted text-muted-foreground"}`}
                              data-testid={`button-toggle-product-${p.id}`}>
                              {p.isActive ? "Aktif" : "Nonaktif"}
                            </button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => { if (confirm(`Hapus produk "${p.name}"?`)) deleteProductMutation.mutate(p.id); }}
                              data-testid={`button-delete-product-${p.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Order Form */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-violet-500" />
                    <CardTitle className="text-base">Buat Order Manual</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Untuk pembeli yang sudah bayar via transfer / WA. Masukkan data pembeli dan ID chatbot, sistem akan generate link akses yang bisa langsung dikirim ke pembeli.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {manualResult && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Link akses berhasil dibuat — {manualResult.agentName}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-white dark:bg-black/30 border rounded px-2 py-1.5 flex-1 break-all">{manualResult.accessUrl}</code>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(manualResult.accessUrl); toast({ title: "Link disalin!" }); }} data-testid="button-copy-access-url">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <a href={manualResult.accessUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" data-testid="button-open-access-url">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground">Kirim link ini ke pembeli via WhatsApp atau email.</p>
                      <Button size="sm" variant="ghost" onClick={() => setManualResult(null)}>Buat order baru</Button>
                    </div>
                  )}

                  {!manualResult && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Nama Pembeli *</label>
                        <Input value={manualForm.name} onChange={(e) => setManualForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" data-testid="input-manual-name" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Email *</label>
                        <Input type="email" value={manualForm.email} onChange={(e) => setManualForm(f => ({ ...f, email: e.target.value }))} placeholder="email@pembeli.com" data-testid="input-manual-email" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">No. WA / HP</label>
                        <Input value={manualForm.phone} onChange={(e) => setManualForm(f => ({ ...f, phone: e.target.value }))} placeholder="08xxx" data-testid="input-manual-phone" />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">ID Chatbot (Agent ID) *</label>
                        <Input type="number" value={manualForm.agentId} onChange={(e) => setManualForm(f => ({ ...f, agentId: e.target.value }))} placeholder="mis. 1281" data-testid="input-manual-agent-id" />
                        <p className="text-xs text-muted-foreground mt-1">Lihat ID di halaman agent di dashboard.</p>
                      </div>
                    </div>
                  )}

                  {!manualResult && (
                    <Button
                      className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                      disabled={createManualOrderMutation.isPending || !manualForm.name || !manualForm.email || !manualForm.agentId}
                      onClick={() => createManualOrderMutation.mutate({ agentId: Number(manualForm.agentId), name: manualForm.name, email: manualForm.email, phone: manualForm.phone })}
                      data-testid="button-create-manual-order"
                    >
                      {createManualOrderMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</> : <><Plus className="h-4 w-4" /> Generate Link Akses</>}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Orders List */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <CardTitle className="text-base">Semua Order Chatbot</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => refetchOrders()} data-testid="button-refresh-orders">
                      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {storeOrdersLoading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Memuat data...</div>
                  ) : storeOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Belum ada order masuk.</div>
                  ) : (
                    <div className="space-y-2">
                      {storeOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap" data-testid={`row-order-${order.id}`}>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground truncate">{order.customerEmail} · {order.customerPhone || "—"}</p>
                            <p className="text-xs text-muted-foreground">{order.midtransOrderId}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : order.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" : "bg-muted text-muted-foreground"}`}>
                              {order.status === "paid" ? "Lunas" : order.status === "pending" ? "Pending" : order.status}
                            </span>
                            <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs"
                              onClick={() => { const url = `${appUrl}/store/access/${order.accessToken}`; navigator.clipboard.writeText(url); toast({ title: "Link akses disalin!" }); }}
                              data-testid={`button-copy-order-${order.id}`}>
                              <Copy className="h-3 w-3" /> Link
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setStoreWaDialog({ open: true, order })}
                              data-testid={`button-wa-order-${order.id}`}
                              title="Kirim link akses via WhatsApp"
                            >
                              WA
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== SCALEV TAB ========== */}
          <TabsContent value="scalev" className="mt-4">
            <div className="space-y-4">

              {/* Webhook URL Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-base">Scalev Payment Integration</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Terima pembayaran dari Scalev secara otomatis. Ketika customer membayar di Scalev, akses chatbot/modul langsung aktif.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Langkah Setup</p>
                    <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Login ke <a href="https://app.scalev.id" target="_blank" className="text-orange-500 hover:underline">app.scalev.id</a> → Settings → Developers</li>
                      <li>Salin URL webhook di bawah, paste ke field <strong>Webhook URL</strong></li>
                      <li>Aktifkan semua events kecuali "Spam Order Created"</li>
                      <li>Buat produk di Scalev, lalu tambahkan mapping di bawah</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">URL Webhook Gustafta (copy ke Scalev)</label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${appUrl}/api/webhooks/scalev`}
                        className="font-mono text-xs bg-muted/50"
                        data-testid="input-scalev-webhook-url"
                      />
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`${appUrl}/api/webhooks/scalev`);
                        toast({ title: "URL disalin!" });
                      }} data-testid="button-copy-webhook-url">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Paste URL ini di: Scalev → Settings → Developers → Webhook URL</p>
                  </div>
                </CardContent>
              </Card>

              {/* AUTO-REGISTER: Buat Produk Scalev Otomatis */}
              <Card className="border-orange-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <CardTitle className="text-base">Auto-Daftarkan ke Scalev</CardTitle>
                    </div>
                    <Button size="sm" variant={showAutoReg ? "outline" : "default"}
                      className={showAutoReg ? "" : "bg-orange-500 hover:bg-orange-600 text-white gap-1"}
                      onClick={() => { setShowAutoReg(!showAutoReg); setAutoRegResult(null); }}
                      data-testid="button-toggle-auto-register">
                      {showAutoReg ? "Tutup" : <><Plus className="h-4 w-4" /> Daftarkan Chatbot/Modul</>}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Buat produk di Scalev <strong>otomatis</strong> — tidak perlu buka dashboard Scalev. Satu klik, mapping langsung terdaftar.
                  </p>
                </CardHeader>
                {showAutoReg && (
                  <CardContent className="space-y-4">
                    {autoRegResult ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">✅ {autoRegResult.message}</p>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Link checkout Scalev (bagikan ke customer):</p>
                          <div className="flex gap-2">
                            <Input readOnly value={autoRegResult.checkoutUrl} className="font-mono text-xs bg-muted/50" />
                            <Button variant="outline" size="sm" onClick={() => {
                              navigator.clipboard.writeText(autoRegResult.checkoutUrl);
                              toast({ title: "Link disalin!" });
                            }}><Copy className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setAutoRegResult(null); setShowAutoReg(true); }}>
                          + Daftarkan produk lagi
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Nama Produk (tampil di Scalev) *</label>
                            <Input value={autoRegForm.productName} onChange={e => setAutoRegForm(f => ({ ...f, productName: e.target.value }))}
                              placeholder="mis. Chatbot SBUClaw Pro" data-testid="input-auto-product-name" />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Harga (Rp) *</label>
                            <Input type="number" value={autoRegForm.price} onChange={e => setAutoRegForm(f => ({ ...f, price: e.target.value }))}
                              placeholder="mis. 299000" data-testid="input-auto-price" />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Label Mapping (nama varian di webhook)</label>
                            <Input value={autoRegForm.label} onChange={e => setAutoRegForm(f => ({ ...f, label: e.target.value }))}
                              placeholder="Dikosongkan = sama dengan nama produk" data-testid="input-auto-label" />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Tipe Akses *</label>
                            <select value={autoRegForm.type} onChange={e => setAutoRegForm(f => ({ ...f, type: e.target.value, agentId: "", bigIdeaId: "", agentIds: "" }))}
                              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background" data-testid="select-auto-type">
                              <option value="chatbot">Chatbot (1 chatbot)</option>
                              <option value="modul">Modul (Email Access)</option>
                              <option value="bundle">Bundle (beberapa chatbot)</option>
                            </select>
                          </div>
                          {autoRegForm.type === "chatbot" && (
                            <div>
                              <label className="text-xs font-medium mb-1 block text-muted-foreground">Agent ID Chatbot *</label>
                              <Input type="number" value={autoRegForm.agentId} onChange={e => setAutoRegForm(f => ({ ...f, agentId: e.target.value }))}
                                placeholder="mis. 24" data-testid="input-auto-agent-id" />
                            </div>
                          )}
                          {autoRegForm.type === "modul" && (
                            <div>
                              <label className="text-xs font-medium mb-1 block text-muted-foreground">Big Idea ID Modul *</label>
                              <Input type="number" value={autoRegForm.bigIdeaId} onChange={e => setAutoRegForm(f => ({ ...f, bigIdeaId: e.target.value }))}
                                placeholder="mis. 5" data-testid="input-auto-big-idea-id" />
                            </div>
                          )}
                          {autoRegForm.type === "bundle" && (
                            <div className="sm:col-span-2">
                              <label className="text-xs font-medium mb-1 block text-muted-foreground">Agent IDs (pisah koma) *</label>
                              <Input value={autoRegForm.agentIds} onChange={e => setAutoRegForm(f => ({ ...f, agentIds: e.target.value }))}
                                placeholder="mis. 24, 31, 45, 67" data-testid="input-auto-agent-ids" />
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Deskripsi (opsional)</label>
                            <Input value={autoRegForm.description} onChange={e => setAutoRegForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Deskripsi singkat produk untuk halaman checkout Scalev" data-testid="input-auto-description" />
                          </div>
                        </div>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                          disabled={autoRegMutation.isPending || !autoRegForm.productName || !autoRegForm.price}
                          onClick={() => autoRegMutation.mutate(autoRegForm)}
                          data-testid="button-auto-register-submit">
                          {autoRegMutation.isPending
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Membuat di Scalev...</>
                            : <><Zap className="h-4 w-4" /> Buat Produk Scalev & Daftar Mapping</>
                          }
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Product Mappings */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-orange-500" />
                      <CardTitle className="text-base">Mapping Produk Scalev</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => refetchScalev()} data-testid="button-refresh-scalev">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
                        onClick={() => {
                          setScalevForm({ scalevProductName: "", type: "chatbot", agentId: "", bigIdeaId: "", agentIds: "", label: "" });
                          setScalevEditId(null);
                          setShowScalevForm(!showScalevForm);
                        }}
                        data-testid="button-toggle-scalev-form">
                        <Plus className="h-4 w-4" /> {showScalevForm && !scalevEditId ? "Tutup" : "Tambah Mapping"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hubungkan nama produk Scalev (dari <code>final_variants</code>) ke chatbot atau modul Gustafta.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(showScalevForm || scalevEditId !== null) && (
                    <div className="border border-orange-500/30 rounded-lg p-4 bg-orange-500/5 space-y-3">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">
                        {scalevEditId ? "Edit Mapping" : "Mapping Baru"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Nama Produk Scalev *</label>
                          <Input
                            value={scalevForm.scalevProductName}
                            onChange={(e) => setScalevForm(f => ({ ...f, scalevProductName: e.target.value }))}
                            placeholder="mis. Tender AI Chatbot"
                            data-testid="input-scalev-product-name"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Harus persis sama dengan nama produk/varian di Scalev</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Label (tampilan admin)</label>
                          <Input
                            value={scalevForm.label}
                            onChange={(e) => setScalevForm(f => ({ ...f, label: e.target.value }))}
                            placeholder="mis. Akses Chatbot Tender"
                            data-testid="input-scalev-label"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-muted-foreground">Tipe Akses *</label>
                          <select
                            value={scalevForm.type}
                            onChange={(e) => setScalevForm(f => ({ ...f, type: e.target.value, agentId: "", bigIdeaId: "", agentIds: "" }))}
                            className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background"
                            data-testid="select-scalev-type"
                          >
                            <option value="chatbot">Chatbot (1 chatbot)</option>
                            <option value="modul">Modul (Email Access)</option>
                            <option value="bundle">Bundle (beberapa chatbot sekaligus)</option>
                            <option value="ebook">Ebook (kirim email fulfillment + trial)</option>
                          </select>
                        </div>
                        {scalevForm.type === "ebook" ? (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Tidak perlu Agent ID / Big Idea ID. Saat order masuk, sistem akan mengirim email
                              berisi link download ebook + bonus, dan memberi trial 7 hari jika email pembeli
                              sudah terdaftar sebagai akun Gustafta.
                            </p>
                          </div>
                        ) : scalevForm.type === "chatbot" ? (
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Agent ID Chatbot</label>
                            <Input
                              type="number"
                              value={scalevForm.agentId}
                              onChange={(e) => setScalevForm(f => ({ ...f, agentId: e.target.value }))}
                              placeholder="mis. 24"
                              data-testid="input-scalev-agent-id"
                            />
                            <p className="text-xs text-muted-foreground mt-1">ID agent chatbot yang dibeli customer</p>
                          </div>
                        ) : scalevForm.type === "modul" ? (
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Big Idea ID Modul</label>
                            <Input
                              type="number"
                              value={scalevForm.bigIdeaId}
                              onChange={(e) => setScalevForm(f => ({ ...f, bigIdeaId: e.target.value }))}
                              placeholder="mis. 5"
                              data-testid="input-scalev-big-idea-id"
                            />
                            <p className="text-xs text-muted-foreground mt-1">ID modul yang diakses customer</p>
                          </div>
                        ) : (
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">Agent IDs (dipisah koma) *</label>
                            <Input
                              value={scalevForm.agentIds}
                              onChange={(e) => setScalevForm(f => ({ ...f, agentIds: e.target.value }))}
                              placeholder="mis. 24, 31, 45, 67"
                              data-testid="input-scalev-agent-ids"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Masukkan semua Agent ID chatbot yang termasuk dalam paket bundle ini (pisah dengan koma).
                              Customer yang bayar 1 produk ini akan otomatis dapat akses ke <strong>semua chatbot</strong> tersebut.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          disabled={createScalevMutation.isPending || updateScalevMutation.isPending}
                          onClick={() => {
                            if (scalevEditId !== null) {
                              updateScalevMutation.mutate({ id: scalevEditId, data: scalevForm });
                            } else {
                              createScalevMutation.mutate(scalevForm);
                            }
                          }}
                          data-testid="button-save-scalev-mapping"
                        >
                          {(createScalevMutation.isPending || updateScalevMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowScalevForm(false); setScalevEditId(null); }}>Batal</Button>
                      </div>
                    </div>
                  )}

                  {scalevLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                  ) : scalevMappings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada mapping produk Scalev.</p>
                      <p className="text-xs mt-1">Tambah mapping untuk menghubungkan produk Scalev ke chatbot/modul Gustafta.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Produk Scalev</th>
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Label</th>
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Tipe</th>
                            <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">ID Target</th>
                            <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scalevMappings.map((m) => (
                            <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-scalev-mapping-${m.id}`}>
                              <td className="py-2 px-2 font-mono text-xs text-orange-600 dark:text-orange-400">{m.scalevProductName}</td>
                              <td className="py-2 px-2 text-xs">{m.label || "—"}</td>
                              <td className="py-2 px-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  m.type === "chatbot" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                  : m.type === "bundle" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                  : m.type === "ebook" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"}`}>
                                  {m.type === "chatbot" ? "Chatbot" : m.type === "bundle" ? `Bundle (${m.agentIds?.length ?? 0} chatbot)` : m.type === "ebook" ? "Ebook" : "Modul"}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-xs text-muted-foreground">
                                {m.type === "chatbot" ? `Agent #${m.agentId ?? "—"}`
                                  : m.type === "bundle" ? `[${(m.agentIds ?? []).join(", ")}]`
                                  : m.type === "ebook" ? "—"
                                  : `Modul #${m.bigIdeaId ?? "—"}`}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                    setScalevForm({
                                      scalevProductName: m.scalevProductName,
                                      type: m.type,
                                      agentId: m.agentId ? String(m.agentId) : "",
                                      bigIdeaId: m.bigIdeaId ? String(m.bigIdeaId) : "",
                                      agentIds: m.agentIds ? m.agentIds.join(", ") : "",
                                      label: m.label,
                                    });
                                    setScalevEditId(m.id);
                                    setShowScalevForm(false);
                                  }} data-testid={`button-edit-scalev-${m.id}`}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => {
                                    if (confirm(`Hapus mapping "${m.scalevProductName}"?`)) {
                                      deleteScalevMutation.mutate(m.id);
                                    }
                                  }} data-testid={`button-delete-scalev-${m.id}`}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* How it works */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-sm">Cara Kerja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="font-semibold text-foreground">1. Customer beli di Scalev</p>
                      <p>Customer checkout produk di landing page Scalev Anda, bayar via QRIS / e-wallet / transfer bank.</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="font-semibold text-foreground">2. Scalev kirim notifikasi</p>
                      <p>Setelah lunas, Scalev otomatis POST data order ke URL webhook Gustafta di atas.</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="font-semibold text-foreground">3. Gustafta proses</p>
                      <p>Gustafta cocokkan nama produk Scalev dengan mapping, lalu buat akses (token chatbot / email modul).</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="font-semibold text-foreground">4. Kirim akses ke customer</p>
                      <p>Order masuk di tab Store. Gunakan tombol WA untuk kirim link akses ke customer. (Auto-delivery coming soon)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== TOOLS TAB ========== */}
          <TabsContent value="tools" className="mt-4">
            <div className="space-y-4">

              {/* ── MultiClaw Admin Shortcut ── */}
              <Card className="border-violet-500/30 bg-violet-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-violet-500/15 p-2">
                        <Wrench className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">MultiClaw Admin — Kelola 45+ Claw Tools</p>
                        <p className="text-xs text-muted-foreground">Edit system prompt, upload KB regulasi, konfigurasi RAG, dan kelola semua agen Claw dari satu tempat</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm" className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10">
                        <Link href="/multiclaw-admin">Buka MultiClaw Admin →</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10">
                        <Link href="/panduan-input-data">Panduan Input Data →</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── KB Hub Shortcut ── */}
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-500/15 p-2">
                        <BookOpen className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">KB Hub — Knowledge Base Global</p>
                        <p className="text-xs text-muted-foreground">Lihat cakupan KB semua agen, tambah cepat, & seed massal</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                      <a href="/admin/kb-hub">Buka KB Hub →</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Kompetensi Hub Shortcut ── */}
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/15 p-2">
                        <GraduationCap className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ekosistem Kompetensi SKK — Gelombang 1</p>
                        <p className="text-xs text-muted-foreground">G1: SERTIVA · Diagnostik · Mock Asesmen · Persiapan &nbsp;|&nbsp; G2: Cek Kelayakan · APL-02 · ROI Karir SKK</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
                        <a href="/kompetensi-hub">Kompetensi Hub →</a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
                        <a href="/ai-tools">AI Tools Hub →</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── URL Delivery Setting ── */}
              <ProdUrlCard appUrl={appUrl} isDevUrl={isDevUrl} onSaved={(u) => setAppUrl(u)} />

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-violet-600" />
                    <CardTitle className="text-base">LexCom — AI Hukum Indonesia</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seed Series LexCom ke workspace Anda — 1 Orchestrator (Lex) + 17 Agen Spesialis Hukum, siap dipublikasikan dan dimonetisasi.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Structure</div>
                      <ul className="text-sm space-y-1 text-foreground/80">
                        <li>• 1 Series "LexCom"</li>
                        <li>• 3 BigIdeas (domain grup)</li>
                        <li>• 13 Toolboxes (Hub + 12 Spesialis)</li>
                        <li>• 13 Agents (Lex + 12 Spesialis)</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">12 Spesialis</div>
                      <ul className="text-sm space-y-0.5 text-foreground/80">
                        <li>🚨 Pidana · ⚖️ Perdata · 🏛️ Litigasi</li>
                        <li>🏢 Korporasi · 👷 Tenaga Kerja</li>
                        <li>🏠 Pertanahan · 💰 Pajak · 💼 Kepailitan</li>
                        <li>📚 Yurisprudensi · ✍️ Drafter</li>
                        <li>🌐 MultiClaw · 💻 OpenClaw</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Monetisasi</div>
                      <ul className="text-sm space-y-1 text-foreground/80">
                        <li>✅ Hub (Lex): gratis/publik</li>
                        <li>🔒 12 Spesialis: butuh login</li>
                        <li>💳 PDF Export: premium</li>
                        <li>📄 Legal Opinion: premium</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => seedLexComMutation.mutate()}
                      disabled={seedLexComMutation.isPending}
                      className="gap-2 bg-violet-600 hover:bg-violet-700"
                      data-testid="button-seed-lexcom"
                    >
                      <Database className="h-4 w-4" />
                      {seedLexComMutation.isPending ? "Sedang seeding LexCom..." : "Seed LexCom ke Workspace"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Idempotent — aman dijalankan ulang, tidak duplikat jika Series sudah ada.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ========== EARLY ADOPTER DIALOG ========== */}
      <Dialog open={earlyDialog.open} onOpenChange={(o) => setEarlyDialog({ open: o, user: earlyDialog.user })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Jadikan Early Adopter
            </DialogTitle>
          </DialogHeader>
          {earlyDialog.user && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><strong>Nama:</strong> {[earlyDialog.user.firstName, earlyDialog.user.lastName].filter(Boolean).join(" ") || "—"}</p>
                <p><strong>Email:</strong> {earlyDialog.user.email || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tier</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={earlyPlan}
                    onChange={(e) => setEarlyPlan(e.target.value)}
                    data-testid="select-early-plan"
                  >
                    <option value="enterprise">Enterprise (semua fitur)</option>
                    <option value="bisnis">Bisnis</option>
                    <option value="profesional">Profesional</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Durasi (hari)</label>
                  <Input
                    type="number"
                    value={earlyDuration}
                    onChange={(e) => setEarlyDuration(e.target.value)}
                    min="1" max="3650"
                    data-testid="input-early-duration"
                  />
                </div>
              </div>
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
                Langganan langsung <strong>aktif &amp; gratis</strong> (Rp 0) tanpa user perlu memilih paket atau membayar. User tetap berperan biasa (bukan admin), semua fitur sesuai tier terbuka.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEarlyDialog({ open: false, user: null })}>Batal</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              disabled={earlyAdopterMutation.isPending}
              onClick={() => earlyDialog.user && earlyAdopterMutation.mutate({
                userId: earlyDialog.user.id,
                plan: earlyPlan,
                durationDays: parseInt(earlyDuration) || 365,
              })}
              data-testid="button-confirm-early-adopter"
            >
              {earlyAdopterMutation.isPending ? "Memproses..." : "Aktifkan Gratis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialog.open} onOpenChange={(o) => setApproveDialog({ open: o, request: approveDialog.request })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Setujui Permintaan Trial
            </DialogTitle>
          </DialogHeader>
          {approveDialog.request && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><strong>Nama:</strong> {approveDialog.request.name}</p>
                <p><strong>HP/WA:</strong> {approveDialog.request.phone}</p>
                <p><strong>Email:</strong> {approveDialog.request.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Durasi (hari)</label>
                  <Input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    min="1" max="365"
                    data-testid="input-duration-days"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Plan</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={trialPlan}
                    onChange={(e) => setTrialPlan(e.target.value)}
                    data-testid="select-trial-plan"
                  >
                    <option value="enterprise">Enterprise (semua fitur)</option>
                    <option value="bisnis">Bisnis</option>
                    <option value="profesional">Profesional</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>
              </div>
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                <strong>Jika user sudah daftar:</strong> trial langsung aktif tanpa perlu redeem.<br />
                <strong>Jika belum:</strong> kode voucher cadangan otomatis dibuat untuk dikirim manual.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })}>Batal</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              disabled={approveTrialMutation.isPending}
              onClick={() => approveDialog.request && approveTrialMutation.mutate({
                id: approveDialog.request.id,
                durationDays: parseInt(durationDays) || 7,
                plan: trialPlan,
              })}
              data-testid="button-confirm-approve"
            >
              {approveTrialMutation.isPending ? "Memproses..." : "Setujui & Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== REJECT DIALOG ========== */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ open: o, request: rejectDialog.request })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Tolak Permintaan Trial
            </DialogTitle>
          </DialogHeader>
          {rejectDialog.request && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p><strong>{rejectDialog.request.name}</strong> — {rejectDialog.request.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Alasan penolakan (opsional)</label>
                <Textarea
                  placeholder="Contoh: Informasi tidak lengkap, mohon hubungi kami kembali..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={3}
                  data-testid="input-reject-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, request: null }); setRejectNotes(""); }}>Batal</Button>
            <Button
              variant="destructive" className="gap-2"
              disabled={rejectTrialMutation.isPending}
              onClick={() => rejectDialog.request && rejectTrialMutation.mutate({ id: rejectDialog.request.id, notes: rejectNotes })}
              data-testid="button-confirm-reject"
            >
              {rejectTrialMutation.isPending ? "Memproses..." : "Tolak Permintaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== EDIT SUBSCRIPTION DIALOG ========== */}
      <Dialog open={subDialog.open} onOpenChange={(o) => setSubDialog({ open: o, sub: subDialog.sub })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Langganan</DialogTitle>
          </DialogHeader>
          {subDialog.sub && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p><strong>{subDialog.sub.user?.email || subDialog.sub.userId}</strong></p>
                <p className="text-muted-foreground">Paket: {planLabel(subDialog.sub.plan)}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                  data-testid="select-sub-status"
                >
                  <option value="active">Aktif</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tanggal Berakhir</label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  data-testid="input-sub-end-date"
                />
              </div>
              {newStatus === "active" && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-md px-3 py-2">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  Setelah simpan, template pesan WhatsApp akan otomatis muncul untuk dikirim ke pelanggan.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog({ open: false, sub: null })}>Batal</Button>
            <Button
              disabled={updateSubMutation.isPending}
              onClick={() => subDialog.sub && updateSubMutation.mutate({ id: subDialog.sub.id, status: newStatus, endDate: newEndDate })}
              data-testid="button-save-sub"
            >
              {updateSubMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== MODUL SUB EDIT DIALOG ========== */}
      <Dialog open={modulSubDialog.open} onOpenChange={(o) => setModulSubDialog({ open: o, sub: modulSubDialog.sub })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Subscriber Modul</DialogTitle>
          </DialogHeader>
          {modulSubDialog.sub && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium">{modulSubDialog.sub.customerName}</p>
                <p className="text-xs text-muted-foreground">{modulSubDialog.sub.customerEmail}</p>
                <p className="text-xs text-muted-foreground">{modulSubDialog.sub.productType === "chatbot" ? "Chatbot" : "Modul"}: {modulSubDialog.sub.productName}</p>
                <p className="text-xs text-muted-foreground">Paket: {modulSubDialog.sub.plan}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select
                  value={modulSubStatus}
                  onChange={(e) => setModulSubStatus(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                  data-testid="select-modul-sub-status"
                >
                  <option value="active">Aktif</option>
                  <option value="pending">Pending (belum bayar)</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              {modulSubStatus === "active" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Durasi aktif (hari)</label>
                  <Input
                    type="number"
                    min="1"
                    value={modulSubDays}
                    onChange={(e) => setModulSubDays(e.target.value)}
                    placeholder="30"
                    data-testid="input-modul-sub-days"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Dihitung dari hari ini. Kosongkan untuk 30 hari.</p>
                </div>
              )}
              {modulSubStatus === "active" && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-md px-3 py-2">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  Setelah simpan, template WA berisi link akses akan otomatis muncul.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModulSubDialog({ open: false, sub: null })}>Batal</Button>
            <Button
              disabled={updateModulSubMutation.isPending}
              onClick={() => modulSubDialog.sub && updateModulSubMutation.mutate({
                id: modulSubDialog.sub.id,
                status: modulSubStatus,
                durationDays: modulSubDays || "30",
              })}
              data-testid="button-save-modul-sub"
            >
              {updateModulSubMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== MODUL WA DIALOG ========== */}
      <Dialog open={modulWaDialog.open} onOpenChange={(o) => setModulWaDialog({ open: o, sub: modulWaDialog.sub })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Kirim Link Akses Modul via WA
            </DialogTitle>
          </DialogHeader>
          {modulWaDialog.sub && (() => {
            const sub = modulWaDialog.sub!;
            const isChatbot = sub.productType === "chatbot";
            const accessLink = isChatbot
              ? `${appUrl}/bot/${sub.agentId}`
              : `${appUrl}/modul/${sub.bigIdeaId}?email=${encodeURIComponent(sub.customerEmail)}`;
            const planMap: Record<string, string> = { trial: "Trial", monthly: "Bulanan", yearly: "Tahunan", lifetime: "Seumur Hidup", scalev: "Scalev" };
            const msg = isChatbot
              ? `Halo ${sub.customerName}! 👋

Akses *Chatbot AI ${sub.productName}* Anda sudah *AKTIF* 🎉

Klik link di bawah untuk langsung chat:
${accessLink}

Paket: *${planMap[sub.plan] ?? sub.plan}*${sub.endDate ? `\nAktif hingga: ${new Date(sub.endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}` : ""}

💡 Simpan link di atas agar mudah dibuka kapan saja!

Butuh bantuan? Hubungi kami:
📱 WA: 081287941900 / 082299417818

Selamat menggunakan! 🚀
— Tim Gustafta`
              : `Halo ${sub.customerName}! 👋

Akses Paket Modul *${sub.productName}* Anda sudah *AKTIF* 🎉

Klik link di bawah untuk langsung masuk:
${accessLink}

Paket: *${planMap[sub.plan] ?? sub.plan}*${sub.endDate ? `\nAktif hingga: ${new Date(sub.endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}` : ""}

💡 Bookmark link di atas agar mudah dibuka kapan saja — bahkan dari HP berbeda sekalipun!

Butuh bantuan? Hubungi kami:
📱 WA: 081287941900 / 082299417818

Selamat menggunakan! 🚀
— Tim Gustafta`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            return (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{sub.customerName}</p>
                  <p className="text-xs text-muted-foreground">{sub.customerEmail}</p>
                  <p className="text-xs text-muted-foreground">{isChatbot ? "Chatbot" : "Modul"}: {sub.productName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Link Akses</p>
                  <div className="flex gap-2">
                    <Input value={accessLink} readOnly className="text-xs font-mono" data-testid="input-modul-access-link" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { navigator.clipboard.writeText(accessLink); toast({ title: "Link disalin!" }); }}
                      data-testid="button-copy-modul-link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Preview Pesan WA</p>
                  <div className="bg-[#dcf8c6] dark:bg-green-900/30 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed max-h-56 overflow-y-auto border border-green-200 dark:border-green-800">
                    {msg}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => { navigator.clipboard.writeText(msg); toast({ title: "Pesan disalin!" }); }}
                    data-testid="button-copy-modul-wa-msg"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Teks
                  </Button>
                  <Button
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open(waUrl, "_blank")}
                    data-testid="button-open-modul-wa"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Buka WA
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Link berisi email subscriber — mereka langsung masuk tanpa perlu input email ulang.
                </p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModulWaDialog({ open: false, sub: null })}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== WELCOME WA DIALOG ========== */}
      <Dialog open={waDialog.open} onOpenChange={(o) => setWaDialog({ open: o, sub: waDialog.sub })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Kirim Welcome WhatsApp
            </DialogTitle>
          </DialogHeader>
          {waDialog.sub && (() => {
            const msg = makeWelcomeWA(waDialog.sub, appUrl);
            const phone = waDialog.sub.user?.email ?? "";
            const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            return (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{[waDialog.sub.user?.firstName, waDialog.sub.user?.lastName].filter(Boolean).join(" ") || "—"}</p>
                  <p className="text-xs text-muted-foreground">{phone}</p>
                  <p className="text-xs text-muted-foreground">Paket: {PLAN_LABEL_WA[waDialog.sub.plan] ?? waDialog.sub.plan}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Preview Pesan WA</p>
                  <div className="bg-[#dcf8c6] dark:bg-green-900/30 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed max-h-64 overflow-y-auto border border-green-200 dark:border-green-800">
                    {msg}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(msg);
                      toast({ title: "Pesan disalin!", description: "Tempel di WhatsApp Web atau aplikasi WA." });
                    }}
                    data-testid="button-copy-wa-msg"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Teks
                  </Button>
                  <Button
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open(waUrl, "_blank")}
                    data-testid="button-open-wa"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Buka WA
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  "Buka WA" akan membuka WhatsApp Web dengan pesan sudah terisi. Pilih kontak pelanggan, lalu kirim.
                </p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaDialog({ open: false, sub: null })}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== STORE ORDER WA DIALOG ========== */}
      <Dialog open={storeWaDialog.open} onOpenChange={(o) => setStoreWaDialog({ open: o, order: storeWaDialog.order })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Kirim Link Akses Chatbot via WA
            </DialogTitle>
          </DialogHeader>
          {storeWaDialog.order && (() => {
            const order = storeWaDialog.order!;
            const accessUrl = `${appUrl}/store/access/${order.accessToken}`;
            const msg = `Halo ${order.customerName}! 👋

Terima kasih sudah membeli Chatbot di Gustafta Store 🎉

Berikut link akses eksklusif Anda:
${accessUrl}

Link ini berisi:
✅ Chat langsung dengan AI Chatbot Anda
✅ Kode embed untuk dipasang di website
✅ Panduan penggunaan

⚠️ *Simpan link ini* — link Anda bersifat permanen dan bisa dibuka kapan saja dari browser manapun.

Butuh bantuan? Hubungi kami:
📱 WA: 081287941900 / 082299417818

Selamat menggunakan! 🚀
— Tim Gustafta`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            const phoneNum = order.customerPhone?.replace(/\D/g, "");
            const waDirectUrl = phoneNum ? `https://wa.me/${phoneNum.startsWith("0") ? "62" + phoneNum.slice(1) : phoneNum}?text=${encodeURIComponent(msg)}` : waUrl;
            return (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                  {order.customerPhone && <p className="text-xs text-muted-foreground">{order.customerPhone}</p>}
                  <p className="text-xs mt-1">{order.status === "paid" ? "✅ Lunas" : "⏳ Pending"} · {order.midtransOrderId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Link Akses</p>
                  <div className="flex gap-2">
                    <Input value={accessUrl} readOnly className="text-xs font-mono" data-testid="input-store-access-link" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(accessUrl); toast({ title: "Link disalin!" }); }} data-testid="button-copy-store-link">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Preview Pesan WA</p>
                  <div className="bg-[#dcf8c6] dark:bg-green-900/30 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed max-h-56 overflow-y-auto border border-green-200 dark:border-green-800">
                    {msg}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => { navigator.clipboard.writeText(msg); toast({ title: "Pesan disalin!" }); }} data-testid="button-copy-store-wa-msg">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Teks
                  </Button>
                  <Button className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(waDirectUrl, "_blank")} data-testid="button-open-store-wa">
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> {phoneNum ? "WA Langsung" : "Buka WA"}
                  </Button>
                </div>
                {phoneNum && (
                  <p className="text-xs text-muted-foreground text-center">
                    "WA Langsung" membuka chat ke nomor {order.customerPhone} dengan pesan sudah terisi.
                  </p>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoreWaDialog({ open: false, order: null })}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
