import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  ClipboardList, Plus, Pencil, Trash2, AlertTriangle,
  CheckCircle2, Clock, Building2, FileText, Shield,
  Award, BarChart3, ChevronRight, Loader2, X, LogIn,
  Bell, Search, RefreshCw, ScanLine, Upload, Sparkles,
  PhoneCall, Send, Check, ArrowRight, Lock, CalendarClock,
  BrainCircuit, Smartphone, HardDrive, BadgeCheck, Wrench,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type Category = "semua" | "legalitas" | "sbu" | "skk" | "perizinan" | "tender";

interface RKProfile {
  id: string;
  user_id: string;
  company_name: string;
  nib?: string;
  npwp?: string;
  bujk_class?: string;
  province?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface RKDocument {
  id: string;
  category: string;
  doc_type: string;
  doc_name: string;
  doc_number?: string;
  issued_by?: string;
  issued_date?: string;
  expired_date?: string;
  status: "active" | "expiring_soon" | "expired" | "in_progress" | "won" | "lost" | "cancelled";
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES: { key: Category; label: string; icon: any; color: string }[] = [
  { key: "semua",     label: "Semua",     icon: ClipboardList, color: "gray" },
  { key: "legalitas", label: "Legalitas", icon: Building2,     color: "blue" },
  { key: "sbu",       label: "SBU",       icon: Shield,        color: "violet" },
  { key: "skk",       label: "SKK",       icon: Award,         color: "amber" },
  { key: "perizinan", label: "Perizinan", icon: FileText,      color: "emerald" },
  { key: "tender",    label: "Tender",    icon: BarChart3,     color: "orange" },
];

const DOC_TYPES: Record<string, string[]> = {
  legalitas: [
    "NIB (Nomor Induk Berusaha)",
    "Akte Pendirian Perusahaan",
    "SK Kemenkumham",
    "NPWP Perusahaan",
    "BUJK (Badan Usaha Jasa Konstruksi)",
    "PKP (Pengusaha Kena Pajak)",
    "Surat Keterangan Domisili",
    "Lainnya",
  ],
  sbu: [
    "SBU Sipil Umum (SI)",
    "SBU Bangunan Gedung (BG)",
    "SBU Mekanikal (MK)",
    "SBU Elektrikal (EL)",
    "SBU Tata Lingkungan (TL)",
    "SBU Sumber Daya Air (SL)",
    "SBU Konstruksi Khusus (KK)",
    "SBU Konsultansi Konstruksi",
    "SBU Tenaga Listrik",
    "Lainnya",
  ],
  skk: [
    "SKK Ahli Muda",
    "SKK Ahli Madya",
    "SKK Ahli Utama",
    "SKK Teknisi / Analis",
    "SKTK (Sertifikat Keterampilan)",
    "SKK Arsitek",
    "SKK K3 Konstruksi",
    "Lainnya",
  ],
  perizinan: [
    "Izin Lingkungan / AMDAL",
    "UKL-UPL",
    "IMB / PBG (Persetujuan Bangunan Gedung)",
    "CSMS (Contractor Safety Mgmt System)",
    "SMK3 / ISO 45001",
    "ISO 9001 (Mutu)",
    "ISO 14001 (Lingkungan)",
    "Izin Pengelolaan Limbah B3",
    "Lainnya",
  ],
  tender: [
    "Tender Pengadaan Barang/Jasa",
    "Tender Jasa Konsultansi",
    "Tender Konstruksi",
    "E-Purchasing / Katalog",
    "Penunjukan Langsung",
    "Lainnya",
  ],
};

const BUJK_CLASSES = ["K1","K2","K3","M1","M2","M3","B1","B2","Tidak ada"];
const PROVINCES = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Bengkulu","Lampung",
  "DKI Jakarta","Jawa Barat","Banten","Jawa Tengah","DI Yogyakarta","Jawa Timur",
  "Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
  "Sulawesi Utara","Sulawesi Tengah","Sulawesi Selatan","Sulawesi Tenggara","Gorontalo","Sulawesi Barat",
  "Maluku","Maluku Utara","Papua","Papua Barat","Papua Tengah","Papua Pegunungan","Papua Selatan",
];

// ── Status helpers ─────────────────────────────────────────────────────────
function statusBadge(status: string) {
  switch (status) {
    case "active":        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">✓ Aktif</Badge>;
    case "expiring_soon": return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">⚠ Akan Habis</Badge>;
    case "expired":       return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">✕ Kedaluwarsa</Badge>;
    case "in_progress":   return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">→ Proses</Badge>;
    case "won":           return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">🏆 Menang</Badge>;
    case "lost":          return <Badge className="bg-gray-100 text-gray-600 border-gray-200">— Tidak Menang</Badge>;
    case "cancelled":     return <Badge className="bg-gray-100 text-gray-500 border-gray-200">✕ Dibatalkan</Badge>;
    default:              return <Badge variant="outline">{status}</Badge>;
  }
}

function daysUntilExpiry(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function RuangKelolaPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<Category>("semua");
  const [search, setSearch] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [editDoc, setEditDoc] = useState<RKDocument | null>(null);
  const [showBiroDialog, setShowBiroDialog] = useState(false);
  const [biroDoc, setBiroDoc] = useState<RKDocument | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery<RKProfile | null>({
    queryKey: ["/api/ruang-kelola/profile"],
    enabled: !!user,
  });

  const { data: summary } = useQuery<{ byCategory: any[]; totals: any }>({
    queryKey: ["/api/ruang-kelola/summary"],
    enabled: !!user,
  });

  const { data: docs = [], isLoading: docsLoading, refetch } = useQuery<RKDocument[]>({
    queryKey: ["/api/ruang-kelola/documents", activeTab],
    queryFn: () => apiRequest("GET", `/api/ruang-kelola/documents?category=${activeTab}`).then(r => r.json()),
    enabled: !!user,
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const saveProfile = useMutation({
    mutationFn: (data: Partial<RKProfile>) =>
      apiRequest("POST", "/api/ruang-kelola/profile", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/profile"] });
      setShowProfileForm(false);
      toast({ title: "Profil perusahaan tersimpan" });
    },
    onError: () => toast({ title: "Gagal menyimpan profil", variant: "destructive" }),
  });

  const createDoc = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/ruang-kelola/documents", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/documents"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/summary"] });
      setShowDocForm(false);
      toast({ title: "Dokumen berhasil ditambahkan" });
    },
    onError: () => toast({ title: "Gagal menambahkan dokumen", variant: "destructive" }),
  });

  const updateDoc = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/ruang-kelola/documents/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/documents"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/summary"] });
      setShowDocForm(false);
      setEditDoc(null);
      toast({ title: "Dokumen berhasil diperbarui" });
    },
    onError: () => toast({ title: "Gagal memperbarui dokumen", variant: "destructive" }),
  });

  const deleteDoc = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/ruang-kelola/documents/${id}`).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/documents"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-kelola/summary"] });
      toast({ title: "Dokumen dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus dokumen", variant: "destructive" }),
  });

  // ── Filtered docs ──────────────────────────────────────────────────────
  const filteredDocs = docs.filter(d =>
    search === "" ||
    d.doc_name.toLowerCase().includes(search.toLowerCase()) ||
    d.doc_type.toLowerCase().includes(search.toLowerCase()) ||
    (d.doc_number || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Summary stats ──────────────────────────────────────────────────────
  const totals = summary?.totals || { total: 0, total_expired: 0, total_expiring_soon: 0 };

  // ── Loading / auth guard ───────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!user) return <RuangKelolaLandingPage />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <SharedHeader />

      {/* ── Hero / Header ── */}
      <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="h-5 w-5 text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Ruang Kelola</span>
              </div>
              {profile ? (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.company_name}</h1>
                  <p className="text-blue-200 text-sm mt-0.5">
                    {[profile.bujk_class, profile.province].filter(Boolean).join(" · ")}
                  </p>
                </>
              ) : (
                <h1 className="text-2xl font-bold">Kelola Legalitas & Kepatuhan BUJK</h1>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-1.5"
                onClick={() => setShowProfileForm(true)}
              >
                <Building2 className="h-3.5 w-3.5" />
                {profile ? "Edit Profil" : "Setup Profil"}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-500 hover:bg-blue-400 text-white"
                onClick={() => { setEditDoc(null); setShowDocForm(true); }}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Dokumen
              </Button>
            </div>
          </div>

          {/* Setup prompt */}
          {!profile && !profileLoading && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-amber-300 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Lengkapi profil perusahaan dulu</p>
                <p className="text-xs text-blue-200">Tambahkan nama perusahaan, NIB, dan data lainnya agar Ruang Kelola siap digunakan.</p>
              </div>
              <Button size="sm" variant="secondary" className="ml-auto shrink-0" onClick={() => setShowProfileForm(true)}>
                Setup <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Dokumen",     value: totals.total || 0,               icon: ClipboardList, color: "from-blue-500/20 to-blue-600/10",   border: "border-blue-500/30" },
              { label: "Aktif",            value: Math.max(0, (totals.total || 0) - (totals.total_expired || 0) - (totals.total_expiring_soon || 0)), icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30" },
              { label: "Akan Habis (30hr)", value: totals.total_expiring_soon || 0, icon: Clock,         color: "from-amber-500/20 to-amber-600/10",   border: "border-amber-500/30" },
              { label: "Kedaluwarsa",       value: totals.total_expired || 0,        icon: AlertTriangle, color: "from-red-500/20 to-red-600/10",       border: "border-red-500/30" },
            ].map(card => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-xl p-3 backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className="h-4 w-4 text-white/70" />
                  <span className="text-xs text-white/70">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Category tabs ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(cat => {
            const catSummary = summary?.byCategory?.find(c => c.category === cat.key);
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                  ${isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white dark:bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
                {cat.key !== "semua" && catSummary && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                    {catSummary.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search + refresh bar ── */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor dokumen..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditDoc(null); setShowDocForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> Tambah
          </Button>
        </div>

        {/* ── Documents table ── */}
        {docsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-card rounded-2xl border border-border">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">Belum ada dokumen</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Tidak ditemukan dokumen yang sesuai pencarian." : `Tambahkan dokumen ${activeTab === "semua" ? "pertama" : activeTab} Anda.`}
            </p>
            <Button size="sm" onClick={() => { setEditDoc(null); setShowDocForm(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Dokumen
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Dokumen</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Kategori</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Nomor</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Berlaku s/d</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.map(doc => {
                    const days = daysUntilExpiry(doc.expired_date);
                    return (
                      <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{doc.doc_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.doc_type}</p>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{doc.category}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-xs font-mono text-muted-foreground">{doc.doc_number || "—"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs">{formatDate(doc.expired_date)}</p>
                          {days !== null && days > 0 && days <= 90 && (
                            <p className={`text-[10px] font-semibold mt-0.5 ${days <= 30 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {days} hari lagi
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {statusBadge(doc.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditDoc(doc); setShowDocForm(true); }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus "${doc.doc_name}"?`)) deleteDoc.mutate(doc.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-muted-foreground hover:text-red-600"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Expiry alerts + Biro Jasa CTA ── */}
        {filteredDocs.some(d => d.status === "expiring_soon" || d.status === "expired") && (
          <div className="mt-4 space-y-2">
            {filteredDocs
              .filter(d => d.status === "expired" || d.status === "expiring_soon")
              .slice(0, 8)
              .map(doc => {
                const days = daysUntilExpiry(doc.expired_date);
                const isExpired = doc.status === "expired";
                return (
                  <div key={doc.id + "-alert"}
                    className={`flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border text-sm
                    ${isExpired
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    <Bell className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{doc.doc_name}</span>
                    <span className="text-xs">
                      {isExpired ? `Kedaluwarsa ${formatDate(doc.expired_date)}` : `Berakhir ${days} hari lagi (${formatDate(doc.expired_date)})`}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => { setEditDoc(doc); setShowDocForm(true); }}
                        className="text-xs underline underline-offset-2 hover:no-underline">
                        Perbarui
                      </button>
                      <button
                        onClick={() => { setBiroDoc(doc); setShowBiroDialog(true); }}
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-white/60 dark:bg-white/10 border border-current hover:bg-white dark:hover:bg-white/20 transition-colors"
                      >
                        <PhoneCall className="h-3 w-3" /> Biro Jasa
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── Biro Jasa Banner (jika ada dokumen bermasalah) ── */}
        {(totals.total_expired > 0 || totals.total_expiring_soon > 0) && (
          <div className="mt-5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-violet-200">Layanan Biro Jasa</span>
              </div>
              <p className="font-bold text-lg leading-tight">Urus dokumen tanpa ribet — serahkan ke tim Gustafta.</p>
              <p className="text-violet-200 text-sm mt-0.5">SBU, SKK, NIB, BUJK, perizinan lingkungan, dan lainnya. Anda fokus di proyek, kami yang urus administrasinya.</p>
            </div>
            <Button
              size="sm"
              className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-1.5 shrink-0"
              onClick={() => { setBiroDoc(null); setShowBiroDialog(true); }}
            >
              <Send className="h-3.5 w-3.5" /> Ajukan Sekarang
            </Button>
          </div>
        )}
      </div>

      {/* ── Profile Dialog ── */}
      <ProfileDialog
        open={showProfileForm}
        onClose={() => setShowProfileForm(false)}
        profile={profile}
        onSave={(data) => saveProfile.mutate(data)}
        isSaving={saveProfile.isPending}
      />

      {/* ── Document Form Dialog ── */}
      <DocFormDialog
        open={showDocForm}
        onClose={() => { setShowDocForm(false); setEditDoc(null); }}
        doc={editDoc}
        defaultCategory={activeTab === "semua" ? undefined : activeTab}
        onSave={(data) => {
          if (editDoc) {
            updateDoc.mutate({ id: editDoc.id, data });
          } else {
            createDoc.mutate(data);
          }
        }}
        isSaving={createDoc.isPending || updateDoc.isPending}
      />

      {/* ── Biro Jasa Dialog ── */}
      <BiroJasaDialog
        open={showBiroDialog}
        onClose={() => { setShowBiroDialog(false); setBiroDoc(null); }}
        doc={biroDoc}
        companyName={profile?.company_name}
      />
    </div>
  );
}

// ── Profile Dialog ─────────────────────────────────────────────────────────
function ProfileDialog({ open, onClose, profile, onSave, isSaving }: {
  open: boolean; onClose: () => void;
  profile?: RKProfile | null;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    company_name: profile?.company_name || "",
    nib: profile?.nib || "",
    npwp: profile?.npwp || "",
    bujk_class: profile?.bujk_class || "",
    province: profile?.province || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    address: profile?.address || "",
  });

  useEffect(() => {
    if (profile) setForm({
      company_name: profile.company_name || "",
      nib: profile.nib || "",
      npwp: profile.npwp || "",
      bujk_class: profile.bujk_class || "",
      province: profile.province || "",
      phone: profile.phone || "",
      email: profile.email || "",
      address: profile.address || "",
    });
  }, [profile]);

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {profile ? "Edit Profil Perusahaan" : "Setup Profil Perusahaan"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nama Perusahaan *</Label>
            <Input value={form.company_name} onChange={e => f("company_name")(e.target.value)} placeholder="PT. Kontraktor Sejahtera" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>NIB</Label>
              <Input value={form.nib} onChange={e => f("nib")(e.target.value)} placeholder="8120xxxxxxxxxx" />
            </div>
            <div className="grid gap-1.5">
              <Label>NPWP</Label>
              <Input value={form.npwp} onChange={e => f("npwp")(e.target.value)} placeholder="xx.xxx.xxx.x-xxx.xxx" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Klasifikasi BUJK</Label>
              <Select value={form.bujk_class} onValueChange={f("bujk_class")}>
                <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>
                  {BUJK_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Provinsi</Label>
              <Select value={form.province} onValueChange={f("province")}>
                <SelectTrigger><SelectValue placeholder="Pilih provinsi" /></SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>No. WhatsApp</Label>
              <Input value={form.phone} onChange={e => f("phone")(e.target.value)} placeholder="0812xxxxxxxx" />
            </div>
            <div className="grid gap-1.5">
              <Label>Email Perusahaan</Label>
              <Input value={form.email} onChange={e => f("email")(e.target.value)} placeholder="admin@perusahaan.com" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Alamat</Label>
            <Textarea value={form.address} onChange={e => f("address")(e.target.value)} placeholder="Jl. ..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave(form)} disabled={!form.company_name || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Simpan Profil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Document Form Dialog ───────────────────────────────────────────────────
function DocFormDialog({ open, onClose, doc, defaultCategory, onSave, isSaving }: {
  open: boolean; onClose: () => void;
  doc?: RKDocument | null;
  defaultCategory?: string;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  const emptyForm = {
    category: defaultCategory || "legalitas",
    doc_type: "",
    doc_name: "",
    doc_number: "",
    issued_by: "",
    issued_date: "",
    expired_date: "",
    status: "active",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ confidence: string; filename: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setOcrResult(null);
    if (doc) {
      setForm({
        category: doc.category,
        doc_type: doc.doc_type,
        doc_name: doc.doc_name,
        doc_number: doc.doc_number || "",
        issued_by: doc.issued_by || "",
        issued_date: doc.issued_date ? doc.issued_date.split("T")[0] : "",
        expired_date: doc.expired_date ? doc.expired_date.split("T")[0] : "",
        status: doc.status,
        notes: doc.notes || "",
      });
    } else {
      setForm({ ...emptyForm, category: defaultCategory || "legalitas" });
    }
  }, [doc, open, defaultCategory]);

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const isTender = form.category === "tender";
  const availableTypes = DOC_TYPES[form.category] || [];

  const TENDER_STATUSES = [
    { value: "in_progress", label: "Sedang Diikuti" },
    { value: "won",         label: "Menang" },
    { value: "lost",        label: "Tidak Menang" },
    { value: "cancelled",   label: "Dibatalkan" },
  ];

  const handleOcrUpload = async (file: File) => {
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ruang-kelola/ocr", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "OCR gagal");
      const d = json.data;
      // Merge OCR results into form — only overwrite non-empty fields
      setForm(prev => ({
        ...prev,
        doc_name:    d.doc_name    || prev.doc_name,
        doc_number:  d.doc_number  || prev.doc_number,
        issued_by:   d.issued_by   || prev.issued_by,
        issued_date: d.issued_date || prev.issued_date,
        expired_date:d.expired_date|| prev.expired_date,
        category:    (d.detected_category && d.detected_category !== "tender") ? d.detected_category : prev.category,
        notes:       d.notes ? (prev.notes ? prev.notes + "\n" + d.notes : d.notes) : prev.notes,
        // map doc_type to closest option
        doc_type:    d.doc_type    || prev.doc_type,
      }));
      setOcrResult({ confidence: d.confidence, filename: file.name });
      toast({ title: `OCR selesai (${d.confidence} confidence)`, description: "Field terisi otomatis dari dokumen. Periksa dan sesuaikan jika perlu." });
    } catch (err: any) {
      toast({ title: "Gagal scan dokumen", description: err.message, variant: "destructive" });
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {doc ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {doc ? "Edit Dokumen" : "Tambah Dokumen"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">

          {/* ── OCR Upload Area (only for new doc) ── */}
          {!doc && (
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
                ${ocrLoading ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : ocrResult ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : "border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"}`}
              onClick={() => !ocrLoading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleOcrUpload(file);
                  e.target.value = "";
                }}
              />
              {ocrLoading ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <p className="text-sm font-medium text-blue-600">Gemini sedang membaca dokumen…</p>
                </div>
              ) : ocrResult ? (
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-2">
                    <ScanLine className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Field terisi dari dokumen</p>
                    <p className="text-xs text-muted-foreground truncate">{ocrResult.filename}</p>
                  </div>
                  <Badge className={`text-xs shrink-0
                    ${ocrResult.confidence === "high" ? "bg-emerald-100 text-emerald-700" :
                      ocrResult.confidence === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    {ocrResult.confidence === "high" ? "✓ Akurat" : ocrResult.confidence === "medium" ? "~ Sedang" : "? Rendah"}
                  </Badge>
                  <button onClick={e => { e.stopPropagation(); setOcrResult(null); fileInputRef.current?.click(); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline shrink-0">
                    Ganti
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <ScanLine className="h-4 w-4" />
                    <Sparkles className="h-4 w-4 text-violet-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Scan Dokumen (OCR)</p>
                  <p className="text-xs text-muted-foreground">Upload foto/PDF → Gemini Vision mengisi form otomatis</p>
                  <p className="text-[10px] text-muted-foreground/60">JPG · PNG · WEBP · PDF · maks 8MB</p>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div className="grid gap-1.5">
            <Label>Kategori *</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v, doc_type: "", doc_name: "" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(c => c.key !== "semua").map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doc type */}
          <div className="grid gap-1.5">
            <Label>Jenis Dokumen *</Label>
            <Select value={form.doc_type} onValueChange={v => f("doc_type")(v)}>
              <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
              <SelectContent>
                {availableTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="grid gap-1.5">
            <Label>Nama Dokumen / Subklasifikasi *</Label>
            <Input
              value={form.doc_name}
              onChange={e => f("doc_name")(e.target.value)}
              placeholder={
                form.category === "skk" ? "cth: SKK Ahli Muda Sipil — Budi Santoso" :
                form.category === "sbu" ? "cth: SBU Bangunan Gedung — Kecil 1" :
                form.category === "tender" ? "cth: Pembangunan Gedung Kantor Dinas X" :
                "Nama atau keterangan dokumen"
              }
            />
          </div>

          {/* Number */}
          <div className="grid gap-1.5">
            <Label>{form.category === "tender" ? "Nomor Paket / RUP" : "Nomor Dokumen"}</Label>
            <Input value={form.doc_number} onChange={e => f("doc_number")(e.target.value)}
              placeholder={form.category === "tender" ? "cth: 1234567" : "Nomor sertifikat / dokumen"} />
          </div>

          {/* Issued by */}
          <div className="grid gap-1.5">
            <Label>{form.category === "tender" ? "Instansi / Satuan Kerja" : "Diterbitkan Oleh"}</Label>
            <Input value={form.issued_by} onChange={e => f("issued_by")(e.target.value)}
              placeholder={form.category === "tender" ? "cth: Dinas PU Provinsi X" : "cth: LPJK, OSS, Kemenkumham..."} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{isTender ? "Deadline Pemasukan" : "Tanggal Terbit"}</Label>
              <Input type="date" value={form.issued_date} onChange={e => f("issued_date")(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{isTender ? "Deadline Aanwijzing" : "Berlaku Sampai"}</Label>
              <Input type="date" value={form.expired_date} onChange={e => f("expired_date")(e.target.value)} />
            </div>
          </div>

          {/* Status tender */}
          {isTender && (
            <div className="grid gap-1.5">
              <Label>Status Tender</Label>
              <Select value={form.status} onValueChange={f("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TENDER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label>Catatan</Label>
            <Textarea value={form.notes} onChange={e => f("notes")(e.target.value)}
              placeholder="Catatan tambahan..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.category || !form.doc_type || !form.doc_name || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {doc ? "Simpan Perubahan" : "Tambah Dokumen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Biro Jasa Dialog ───────────────────────────────────────────────────────
const BIRO_SERVICES = [
  "Pengurusan SBU (Sertifikat Badan Usaha)",
  "Pengurusan SKK / Sertifikasi Kompetensi",
  "Pengurusan NIB / BUJK",
  "Pengurusan Perizinan Lingkungan",
  "Perpanjangan SBU / SKK yang Kedaluwarsa",
  "Pengurusan ISO 9001 / 14001 / 45001",
  "Pengurusan IMB / PBG",
  "Konsultasi & Bimbingan Tender",
  "Lainnya",
];

function BiroJasaDialog({ open, onClose, doc, companyName }: {
  open: boolean; onClose: () => void;
  doc?: RKDocument | null;
  companyName?: string;
}) {
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setNotes("");
      if (doc) {
        setServiceType(`Perpanjangan ${doc.doc_type}`);
      } else {
        setServiceType("");
      }
    }
  }, [open, doc]);

  const handleSubmit = async () => {
    if (!serviceType) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/ruang-kelola/biro-request", {
        doc_id: doc?.id || null,
        service_type: serviceType,
        notes,
      });
      if (!res.ok) throw new Error("Gagal mengirim permintaan");
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Gagal mengirim permintaan", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // WA direct link as alternative
  const waMessage = encodeURIComponent(
    `Halo Gustafta! Saya membutuhkan bantuan biro jasa:\n` +
    `📋 Layanan: ${serviceType || "Biro Jasa"}\n` +
    (doc ? `📄 Dokumen: ${doc.doc_name} (${doc.doc_type})\n` : "") +
    (companyName ? `🏢 Perusahaan: ${companyName}\n` : "") +
    (notes ? `💬 Catatan: ${notes}\n` : "") +
    `\nMohon info lebih lanjut. Terima kasih!`
  );
  const waUrl = `https://wa.me/6282299417818?text=${waMessage}`;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Ajukan ke Biro Jasa Gustafta
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-bold text-lg">Permintaan Terkirim!</p>
            <p className="text-sm text-muted-foreground">
              Tim Gustafta akan menghubungi Anda dalam waktu 1×24 jam melalui WhatsApp.
            </p>
            <div className="pt-2 flex gap-2 justify-center">
              <Button variant="outline" onClick={onClose}>Tutup</Button>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-1.5 bg-green-600 hover:bg-green-500 text-white">
                  <PhoneCall className="h-4 w-4" /> Chat Langsung di WA
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {doc && (
                <div className="bg-muted/50 rounded-xl p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-0.5">Dokumen yang diajukan:</p>
                  <p className="font-semibold">{doc.doc_name}</p>
                  <p className="text-xs text-muted-foreground">{doc.doc_type} · {statusBadge(doc.status)}</p>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label>Jenis Layanan yang Dibutuhkan *</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue placeholder="Pilih layanan..." /></SelectTrigger>
                  <SelectContent>
                    {BIRO_SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Keterangan Tambahan</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ceritakan kebutuhan Anda secara singkat — dokumen yang perlu diurus, deadline, atau pertanyaan khusus..."
                  rows={3}
                />
              </div>
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
                💡 Tim akan menghubungi Anda via WhatsApp untuk konsultasi dan estimasi biaya. Tidak ada biaya di tahap ini.
              </p>
            </div>
            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
                  <PhoneCall className="h-3.5 w-3.5" /> Via WA Langsung
                </Button>
              </a>
              <Button
                onClick={handleSubmit}
                disabled={!serviceType || loading}
                className="gap-1.5"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim Permintaan
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Landing Page (unauthenticated) ────────────────────────────────────────────

function RuangKelolaLandingPage() {
  const CATEGORIES = [
    { icon: Shield,      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",      label: "Legalitas",   desc: "NIB, NPWP, Akta, SK Kemenkumham, PKP" },
    { icon: BadgeCheck,  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", label: "SBU",     desc: "Sertifikat Badan Usaha semua subklasifikasi" },
    { icon: Award,       color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20", label: "SKK",        desc: "SKK Ahli Muda / Madya / Utama" },
    { icon: FileText,    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", label: "Perizinan",  desc: "IMB/PBG, ISO, CSMS, lingkungan" },
    { icon: BarChart3,   color: "text-red-600 bg-red-50 dark:bg-red-900/20",          label: "Tender",     desc: "Status & deadline proyek aktif" },
  ];

  const FEATURES = [
    { icon: Bell,         color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",    title: "Alarm Dokumen Kedaluwarsa",  desc: "Notifikasi otomatis 30 hari & 7 hari sebelum expired — dikirim ke WhatsApp perusahaan Anda." },
    { icon: ScanLine,     color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20", title: "Scan OCR Gemini AI",          desc: "Foto dokumen fisik → AI baca & isi formulir otomatis. Tidak perlu ketik manual." },
    { icon: Wrench,       color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20",       title: "Biro Jasa Terintegrasi",     desc: "Dokumen expired? Ajukan bantuan pengurusan langsung dari dashboard — tim Gustafta siap bantu." },
    { icon: HardDrive,    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",       title: "Link ke Ruang Simpan",       desc: "Hubungkan file scan asli ke catatan dokumen — arsip digital terpadu satu klik." },
    { icon: Lock,         color: "text-slate-600 bg-slate-50 dark:bg-slate-900/20",    title: "Keamanan 10 Layer",          desc: "Zod validation, UUID guard, rate limiting, ownership check, audit log — data legal Anda aman." },
    { icon: BrainCircuit, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20", title: "Konteks untuk Semua AI",     desc: "Data dokumen bisa dijadikan konteks oleh Klinik, Brain Project, dan fitur AI lainnya." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(59,130,246,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.3) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold mb-6">
            <ClipboardList className="h-3.5 w-3.5" /> Ruang Kelola — Gratis untuk BUJK
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
            Jangan sampai SBU/SKK expired<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              di tengah proses tender.
            </span>
          </h1>
          <p className="text-blue-200 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Dashboard legalitas khusus BUJK — pantau semua dokumen perusahaan,
            terima peringatan sebelum kedaluwarsa, dan urus langsung via Biro Jasa terintegrasi.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/masuk">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8">
                <LogIn className="h-4 w-4" /> Mulai Gratis Sekarang
              </Button>
            </Link>
            <a href="#fitur">
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                Lihat Fitur <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-blue-300/70">
            <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> 100% gratis untuk semua user</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Data hanya milik Anda</span>
            <span className="flex items-center gap-1.5"><Bell className="h-3 w-3" /> Reminder WA otomatis</span>
          </div>
        </div>
      </section>

      {/* MASALAH */}
      <section className="bg-muted/30 border-y border-border py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">Berapa kerugian akibat dokumen yang tidak terpantau?</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Satu dokumen expired bisa menggugurkan seluruh proses tender — padahal sudah mengeluarkan biaya penawaran.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "❌", title: "Gugur Tender", desc: "SBU/SKK kedaluwarsa = gugur di verifikasi administrasi, meski penawaran sudah terbaik." },
              { icon: "⏰", title: "Pengurusan Mendadak", desc: "Urus SBU darurat memakan 1–3 bulan + biaya lebih mahal karena tidak direncanakan." },
              { icon: "😓", title: "Lupa Tanggal Expired", desc: "Ratusan dokumen, puluhan tanggal — tidak ada sistem yang mengingatkan tepat waktu." },
              { icon: "🚪", title: "Pegawai Resign, Data Hilang", desc: "Admin keluar — tidak ada yang tahu di mana file tersimpan, versi mana yang terakhir, dan dokumen mana yang sudah diurus." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-card border border-border rounded-xl p-5 text-left">
                <div className="text-2xl mb-2">{icon}</div>
                <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">5 Kategori Dokumen</p>
        <h2 className="text-center text-2xl font-bold text-foreground mb-8">Semua dokumen BUJK dalam satu tempat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CATEGORIES.map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="bg-white dark:bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-bold text-sm text-foreground mb-1">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" className="bg-muted/20 border-y border-border py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Fitur Utama</p>
          <h2 className="text-center text-2xl font-bold text-foreground mb-10">Lebih dari sekadar spreadsheet</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white dark:bg-card border border-border rounded-xl p-5">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Cara Kerja</p>
        <h2 className="text-center text-2xl font-bold text-foreground mb-10">Siap pakai dalam 3 langkah</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: "1", icon: Building2, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",       title: "Lengkapi Profil Perusahaan", desc: "Isi nama perusahaan, NIB, NPWP, dan kelas BUJK. Sistem langsung siap digunakan." },
            { step: "2", icon: ScanLine,  color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30", title: "Input atau Scan Dokumen",    desc: "Tambah manual atau foto dokumen fisik — AI OCR mengisi formulir otomatis dalam detik." },
            { step: "3", icon: Bell,      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30", title: "Terima Reminder & Kelola", desc: "WA reminder otomatis 30 & 7 hari sebelum expired. Urus via Biro Jasa jika perlu." },
          ].map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className="relative text-center bg-white dark:bg-card border border-border rounded-2xl p-6">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow">{step}</div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BIRO JASA */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-y border-amber-200 dark:border-amber-900/30 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-full px-4 py-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-4">
            <Wrench className="h-3.5 w-3.5" /> Biro Jasa Terintegrasi
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">Dokumen expired? Kami yang urus.</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto leading-relaxed">
            Ketika sistem mendeteksi dokumen kedaluwarsa, tombol <strong>Biro Jasa</strong> muncul
            otomatis di dashboard. Pilih layanan — tim Gustafta menghubungi Anda untuk tindak lanjut.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-6 text-left">
            {[
              "Pengurusan SBU & Perpanjangan",
              "SKK & Sertifikasi Kompetensi",
              "NIB / BUJK & OSS",
              "Perizinan Lingkungan & ISO",
              "IMB / PBG",
              "Konsultasi & Bimbingan Tender",
            ].map(s => (
              <div key={s} className="flex items-center gap-2 text-xs text-foreground bg-white dark:bg-card border border-amber-200 dark:border-amber-900/30 rounded-lg px-3 py-2">
                <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" /> {s}
              </div>
            ))}
          </div>
          <Link href="/masuk">
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <LogIn className="h-4 w-4" /> Coba Ruang Kelola — Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-xl font-bold text-foreground mb-8">Pertanyaan Umum</h2>
          <div className="space-y-3">
            {[
              { q: "Apakah Ruang Kelola benar-benar gratis?", a: "Ya, 100% gratis. Semua fitur dashboard — input dokumen, reminder, OCR scan, dan monitoring — tersedia tanpa biaya. Biro Jasa (pengurusan dokumen) berbayar sesuai layanan yang dipilih." },
              { q: "Bagaimana reminder WA bekerja?", a: "Sistem otomatis mengirim pesan WhatsApp ke nomor perusahaan yang Anda daftarkan — 30 hari dan 7 hari sebelum dokumen expired. Tidak perlu setting apapun." },
              { q: "Apakah data dokumen saya aman?", a: "Ya. Setiap dokumen hanya bisa diakses oleh pemilik akun. Sistem dilindungi 10 layer keamanan termasuk audit log, rate limiting, dan ownership check pada setiap operasi." },
              { q: "Bisakah saya scan dokumen fisik?", a: "Bisa. Fitur OCR menggunakan Gemini AI — foto dokumen SBU, SKK, atau NIB fisik, sistem otomatis membaca dan mengisi formulir tanpa ketik manual." },
              { q: "Apa bedanya dengan spreadsheet Excel?", a: "Excel tidak mengirim reminder, tidak bisa scan dokumen, tidak terhubung ke fitur AI lain, dan tidak ada Biro Jasa. Ruang Kelola adalah sistem aktif yang bekerja untuk Anda." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white dark:bg-card border border-border rounded-xl p-4">
                <p className="font-semibold text-sm text-foreground mb-1.5">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-blue-700 to-slate-900 py-16 px-4 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-black mb-3">Mulai pantau legalitas BUJK Anda hari ini.</h2>
        <p className="text-blue-200 mb-7 max-w-md mx-auto text-sm leading-relaxed">
          Gratis selamanya. Tidak perlu kartu kredit. Cukup daftar dan masukkan dokumen pertama Anda.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/masuk">
            <Button size="lg" className="gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-8">
              <LogIn className="h-4 w-4" /> Daftar & Mulai Gratis
            </Button>
          </Link>
          <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Ruang%20Kelola%20Gustafta" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
              <PhoneCall className="h-4 w-4" /> Tanya via WhatsApp
            </Button>
          </a>
        </div>
      </section>

      <div className="h-12 bg-background" />
    </div>
  );
}
