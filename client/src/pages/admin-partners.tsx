import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, Trash2, ArrowLeft, Pencil, Users, UserPlus, Globe, Check, X, Inbox } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import type { Partner, PartnerTopupRequest } from "@shared/schema";

type PartnerForm = {
  slug: string;
  name: string;
  host: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  tagline: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  defaultAgentId: string;
  cheapModel: string;
  seatsPerUnit: number;
  seatCapacity: number;
  monthlyQuota: number;
  adminEmails: string;
  hidePlatformBranding: boolean;
  active: boolean;
};

const emptyForm: PartnerForm = {
  slug: "",
  name: "",
  host: "",
  brandName: "",
  logoUrl: "",
  primaryColor: "",
  tagline: "",
  description: "",
  contactPhone: "",
  contactEmail: "",
  defaultAgentId: "none",
  cheapModel: "gpt-4o-mini",
  seatsPerUnit: 3,
  seatCapacity: 0,
  monthlyQuota: 0,
  adminEmails: "",
  hidePlatformBranding: true,
  active: true,
};

interface SeatsData {
  active: Array<{ userId: string; role: string; email?: string | null }>;
  pending: Array<{ email: string; role: string }>;
  seatsPerUnit: number;
}

export default function AdminPartnersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: agents = [] } = useAgents();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [seatsTarget, setSeatsTarget] = useState<Partner | null>(null);
  const [newSeatEmail, setNewSeatEmail] = useState("");
  const [newSeatRole, setNewSeatRole] = useState<"viewer" | "editor">("viewer");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const adminEmailList = form.adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const addAdminEmail = () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Email tidak valid", description: `"${email}" bukan alamat email yang benar.`, variant: "destructive" });
      return;
    }
    if (adminEmailList.includes(email)) {
      toast({ title: "Sudah ada", description: "Email itu sudah terdaftar sebagai pengurus.", variant: "destructive" });
      setNewAdminEmail("");
      return;
    }
    setForm({ ...form, adminEmails: [...adminEmailList, email].join(", ") });
    setNewAdminEmail("");
  };

  const removeAdminEmail = (email: string) => {
    setForm({ ...form, adminEmails: adminEmailList.filter((e) => e !== email).join(", ") });
  };

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
    enabled: isAuthenticated,
  });

  const { data: seatsData, isLoading: seatsLoading } = useQuery<SeatsData>({
    queryKey: ["/api/admin/partners", seatsTarget?.id, "seats"],
    enabled: !!seatsTarget,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        defaultAgentId: form.defaultAgentId === "none" ? null : form.defaultAgentId,
        logoUrl: form.logoUrl || null,
        primaryColor: form.primaryColor || null,
        tagline: form.tagline || null,
        description: form.description || null,
        contactPhone: form.contactPhone || null,
        contactEmail: form.contactEmail || null,
        adminEmails: form.adminEmails
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      };
      if (editId) {
        return await apiRequest("PATCH", `/api/admin/partners/${editId}`, payload);
      }
      return await apiRequest("POST", "/api/admin/partners", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      setFormOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast({ title: editId ? "Mitra diperbarui" : "Mitra berhasil dibuat" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal", description: e?.message || "Slug/host mungkin sudah terdaftar", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      setDeleteTarget(null);
      toast({ title: "Mitra dihapus" });
    },
  });

  const addSeatMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/partners/${seatsTarget!.id}/seats`, {
        email: newSeatEmail,
        role: newSeatRole,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners", seatsTarget?.id, "seats"] });
      setNewSeatEmail("");
      toast({
        title: data?.status === "granted" ? "Fasilitator ditambahkan" : "Undangan terkirim",
        description: data?.status === "granted" ? "Pengguna langsung mendapat akses." : "Akses aktif otomatis saat mereka mendaftar.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Gagal", description: e?.message || "Tidak dapat menambah fasilitator", variant: "destructive" });
    },
  });

  const removeSeatMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId?: string; email?: string }) => {
      const qs = userId ? `userId=${encodeURIComponent(userId)}` : `email=${encodeURIComponent(email || "")}`;
      return await apiRequest("DELETE", `/api/admin/partners/${seatsTarget!.id}/seats?${qs}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners", seatsTarget?.id, "seats"] });
      toast({ title: "Kursi fasilitator dihapus" });
    },
  });

  const { data: topupRequests = [] } = useQuery<PartnerTopupRequest[]>({
    queryKey: ["/api/admin/partners/topup-requests"],
    enabled: isAuthenticated,
  });

  const pendingByPartner = topupRequests.reduce<Record<number, PartnerTopupRequest[]>>((acc, r) => {
    (acc[r.partnerId] ||= []).push(r);
    return acc;
  }, {});

  const topupMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      return await apiRequest("PATCH", `/api/admin/partners/topup-requests/${id}`, { action });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners/topup-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: variables.action === "approve" ? "Permintaan disetujui" : "Permintaan ditolak" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal", description: e?.message || "Tidak dapat memproses permintaan", variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditId(p.id);
    setForm({
      slug: p.slug,
      name: p.name,
      host: p.host,
      brandName: p.brandName,
      logoUrl: p.logoUrl || "",
      primaryColor: p.primaryColor || "",
      tagline: p.tagline || "",
      description: p.description || "",
      contactPhone: p.contactPhone || "",
      contactEmail: p.contactEmail || "",
      defaultAgentId: p.defaultAgentId || "none",
      cheapModel: p.cheapModel || "gpt-4o-mini",
      seatsPerUnit: p.seatsPerUnit,
      seatCapacity: p.seatCapacity ?? 0,
      monthlyQuota: p.monthlyQuota,
      adminEmails: (p.adminEmails || []).join(", "),
      hidePlatformBranding: p.hidePlatformBranding,
      active: p.active,
    });
    setFormOpen(true);
  };

  if (authLoading) return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <p>Silakan login untuk mengakses halaman ini.</p>
        <a href="/login"><Button>Masuk</Button></a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Whitelabel Mitra (Asosiasi/Reseller)</h1>
          </div>
        </div>
        <Button onClick={openCreate} data-testid="button-add-partner">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mitra
        </Button>
      </div>

      <div className="container max-w-4xl mx-auto px-6 py-8 space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat mitra...</div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <div>
              <p className="text-lg font-medium">Belum ada mitra whitelabel</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tambahkan asosiasi/reseller agar mereka punya halaman berbrand sendiri.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Mitra Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => {
              const linkedAgent = (agents as any[]).find((a) => String(a.id) === p.defaultAgentId);
              const pending = pendingByPartner[p.id] || [];
              return (
                <Card key={p.id} data-testid={`card-partner-${p.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" style={{ color: p.primaryColor || undefined }}>{p.brandName}</span>
                          <Badge variant={p.active ? "default" : "secondary"} className="text-xs">
                            {p.active ? "Aktif" : "Nonaktif"}
                          </Badge>
                          {p.hidePlatformBranding && (
                            <Badge variant="outline" className="text-xs">Brand Gustafta disembunyikan</Badge>
                          )}
                          {pending.length > 0 && (
                            <Badge variant="destructive" className="text-xs gap-1" data-testid={`badge-pending-topup-${p.id}`}>
                              <Inbox className="w-3 h-3" />
                              {pending.length} permintaan top-up
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="font-mono">{p.host}</span>
                        </div>
                        {p.tagline && <p className="text-xs text-muted-foreground">{p.tagline}</p>}
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span>Chatbot: <strong>{linkedAgent?.name || "—"}</strong></span>
                          <span>Model: <strong>{p.cheapModel}</strong></span>
                          <span>Seats/unit: <strong>{p.seatsPerUnit}</strong></span>
                          <span data-testid={`text-seat-capacity-${p.id}`}>Lisensi Seat: <strong>{(p.seatCapacity ?? 0) === 0 ? "Nonaktif (mode pooled)" : `${p.seatCapacity} seat`}</strong></span>
                          <span>Kuota/bulan: <strong>{p.monthlyQuota === 0 ? "Tak terbatas" : `${p.monthlyQuota.toLocaleString("id-ID")} (${p.quotaUsed.toLocaleString("id-ID")} terpakai)`}</strong></span>
                        </div>
                        {pending.length > 0 && (
                          <div className="mt-3 space-y-2 rounded-md border border-dashed p-3" data-testid={`list-topup-partner-${p.id}`}>
                            <p className="text-xs font-medium text-muted-foreground">Permintaan top-up menunggu persetujuan</p>
                            {pending.map((r) => (
                              <div key={r.id} className="flex items-start justify-between gap-3 text-xs" data-testid={`row-topup-${r.id}`}>
                                <div className="flex-1 space-y-0.5">
                                  <div>
                                    <strong>+{r.amount.toLocaleString("id-ID")}</strong>{" "}
                                    {r.kind === "seats" ? "kursi/unit" : "kuota/bulan"}
                                    <span className="text-muted-foreground"> · dari {r.requestedByEmail}</span>
                                  </div>
                                  {r.note && <p className="text-muted-foreground italic">"{r.note}"</p>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    disabled={topupMutation.isPending}
                                    onClick={() => topupMutation.mutate({ id: r.id, action: "approve" })}
                                    data-testid={`button-approve-topup-${r.id}`}
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                                    Setujui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    disabled={topupMutation.isPending}
                                    onClick={() => topupMutation.mutate({ id: r.id, action: "reject" })}
                                    data-testid={`button-reject-topup-${r.id}`}
                                  >
                                    <X className="w-3.5 h-3.5 mr-1 text-destructive" />
                                    Tolak
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSeatsTarget(p)}
                          data-testid={`button-seats-partner-${p.id}`}
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5" />
                          Fasilitator
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                          data-testid={`button-edit-partner-${p.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(p)}
                          data-testid={`button-delete-partner-${p.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Mitra" : "Tambah Mitra"}</DialogTitle>
            <DialogDescription>
              Konfigurasi branding & kuota untuk asosiasi/reseller. Daftar harga Gustafta tetap; hanya layer per-mitra yang berbeda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-name">Nama Mitra</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ASPEKINDO" data-testid="input-partner-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-slug">Slug</Label>
                <Input id="p-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="aspekindo" data-testid="input-partner-slug" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-host">Host (domain)</Label>
              <Input id="p-host" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="dialog.aspekindo-pub.com" data-testid="input-partner-host" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-brand">Nama Brand (tampil)</Label>
                <Input id="p-brand" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} placeholder="ASPEKINDO" data-testid="input-partner-brand" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-color">Warna Utama</Label>
                <Input id="p-color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} placeholder="#1e40af" data-testid="input-partner-color" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-logo">URL Logo</Label>
              <Input id="p-logo" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." data-testid="input-partner-logo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-tagline">Tagline</Label>
              <Input id="p-tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Asisten AI Konstruksi" data-testid="input-partner-tagline" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-description">Deskripsi Singkat (untuk landing mitra)</Label>
              <Input id="p-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Layanan konsultasi AI untuk anggota asosiasi..." data-testid="input-partner-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-phone">Kontak WA/Telepon Mitra</Label>
                <Input id="p-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="0812xxxxxxx" data-testid="input-partner-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">Email Kontak Mitra</Label>
                <Input id="p-email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="info@aspekindo.or.id" data-testid="input-partner-email" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Kontak mitra menggantikan kontak Gustafta di bar atas & footer halaman mitra. Kosongkan bila tidak ingin ditampilkan.</p>
            <div className="space-y-2">
              <Label>Chatbot Default</Label>
              <Select value={form.defaultAgentId} onValueChange={(v) => setForm({ ...form, defaultAgentId: v })}>
                <SelectTrigger data-testid="select-partner-agent">
                  <SelectValue placeholder="Pilih chatbot..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum dipilih</SelectItem>
                  {(agents as any[]).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-model">Model Hemat</Label>
                <Input id="p-model" value={form.cheapModel} onChange={(e) => setForm({ ...form, cheapModel: e.target.value })} placeholder="gpt-4o-mini" data-testid="input-partner-model" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-seats">Seats/Unit</Label>
                <Input id="p-seats" type="number" min={1} value={form.seatsPerUnit} onChange={(e) => setForm({ ...form, seatsPerUnit: Number(e.target.value) })} data-testid="input-partner-seats" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-quota">Kuota/Bulan</Label>
                <Input id="p-quota" type="number" min={0} value={form.monthlyQuota} onChange={(e) => setForm({ ...form, monthlyQuota: Number(e.target.value) })} data-testid="input-partner-quota" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Kuota 0 = tak terbatas. Kuota di-pool per mitra (bukan per pengguna).</p>
            <div className="space-y-2">
              <Label htmlFor="p-seat-capacity">Kapasitas Lisensi Seat (Model B)</Label>
              <Input id="p-seat-capacity" type="number" min={0} step={25} value={form.seatCapacity} onChange={(e) => setForm({ ...form, seatCapacity: Number(e.target.value) })} data-testid="input-partner-seat-capacity" />
              <p className="text-xs text-muted-foreground">Total seat Starter berbayar (isi kelipatan 25 setelah asosiasi bayar). <strong>0 = nonaktif</strong> (mitra pakai mode pooled lama). Bila &gt; 0: tiap seat = 1 akun tim dapat akses Starter (rakit s.d. 3 chatbot + kuota pesan), dan pengurus asosiasi bisa kelola seat sendiri dalam batas kapasitas.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-admins">Email Pengurus Mitra (Partner-Admin)</Label>
              <div className="flex gap-2">
                <Input
                  id="p-admins"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAdminEmail(); } }}
                  placeholder="ketua@aspekindo.or.id"
                  data-testid="input-partner-admins"
                />
                <Button type="button" variant="outline" onClick={addAdminEmail} data-testid="button-add-partner-admin">
                  <Plus className="h-4 w-4 mr-1" /> Tambah
                </Button>
              </div>
              {adminEmailList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {adminEmailList.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1" data-testid={`chip-partner-admin-${email}`}>
                      {email}
                      <button
                        type="button"
                        onClick={() => removeAdminEmail(email)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        aria-label={`Hapus ${email}`}
                        data-testid={`button-remove-partner-admin-${email}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Ketik email lalu Enter / Tambah. Mereka bisa login lalu buka <code>/partner</code> untuk melihat pemakaian & meminta top-up kursi/kuota mandiri.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="p-hide">Sembunyikan brand Gustafta</Label>
                <p className="text-xs text-muted-foreground">Hilangkan "Powered by Gustafta" di halaman mitra.</p>
              </div>
              <Switch id="p-hide" checked={form.hidePlatformBranding} onCheckedChange={(v) => setForm({ ...form, hidePlatformBranding: v })} data-testid="switch-partner-hide" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="p-active">Aktif</Label>
                <p className="text-xs text-muted-foreground">Nonaktif = host tidak menampilkan branding mitra.</p>
              </div>
              <Switch id="p-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="switch-partner-active" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name.trim() || !form.slug.trim() || !form.host.trim() || !form.brandName.trim() || saveMutation.isPending}
              data-testid="button-save-partner"
            >
              {saveMutation.isPending ? "Menyimpan..." : editId ? "Simpan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mitra?</AlertDialogTitle>
            <AlertDialogDescription>
              Mitra <strong>{deleteTarget?.brandName}</strong> akan dihapus. Halaman di host <code>{deleteTarget?.host}</code> akan kembali menampilkan brand Gustafta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget!.id)}
              data-testid="button-confirm-delete-partner"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seats Dialog */}
      <Dialog open={!!seatsTarget} onOpenChange={(o) => { if (!o) { setSeatsTarget(null); setNewSeatEmail(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fasilitator — {seatsTarget?.brandName}</DialogTitle>
            <DialogDescription>
              Undang fasilitator asosiasi untuk mengakses chatbot. Pengguna terdaftar langsung aktif; email baru menerima undangan otomatis.
            </DialogDescription>
          </DialogHeader>
          {!seatsTarget?.defaultAgentId ? (
            <p className="text-sm text-muted-foreground py-4">Mitra ini belum punya chatbot default. Set dulu chatbot pada pengaturan mitra.</p>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="seat-email">Email Fasilitator</Label>
                  <Input id="seat-email" value={newSeatEmail} onChange={(e) => setNewSeatEmail(e.target.value)} placeholder="fasilitator@aspekindo.or.id" data-testid="input-seat-email" />
                </div>
                <Select value={newSeatRole} onValueChange={(v) => setNewSeatRole(v as "viewer" | "editor")}>
                  <SelectTrigger className="w-28" data-testid="select-seat-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => addSeatMutation.mutate()}
                  disabled={!newSeatEmail.includes("@") || addSeatMutation.isPending}
                  data-testid="button-add-seat"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>

              {seatsLoading ? (
                <p className="text-sm text-muted-foreground">Memuat fasilitator...</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">AKTIF ({seatsData?.active.length || 0})</p>
                    {(seatsData?.active.length || 0) === 0 ? (
                      <p className="text-xs text-muted-foreground">Belum ada fasilitator aktif.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {seatsData!.active.map((s) => (
                          <div key={s.userId} className="flex items-center justify-between gap-2 text-sm border rounded px-3 py-2" data-testid={`row-seat-active-${s.userId}`}>
                            <span className="truncate">{s.email || s.userId} <Badge variant="outline" className="ml-1 text-[10px]">{s.role}</Badge></span>
                            <Button size="sm" variant="ghost" onClick={() => removeSeatMutation.mutate({ userId: s.userId })} data-testid={`button-remove-seat-${s.userId}`}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">UNDANGAN TERTUNDA ({seatsData?.pending.length || 0})</p>
                    {(seatsData?.pending.length || 0) === 0 ? (
                      <p className="text-xs text-muted-foreground">Tidak ada undangan tertunda.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {seatsData!.pending.map((s) => (
                          <div key={s.email} className="flex items-center justify-between gap-2 text-sm border rounded px-3 py-2 bg-muted/30" data-testid={`row-seat-pending-${s.email}`}>
                            <span className="truncate">{s.email} <Badge variant="outline" className="ml-1 text-[10px]">{s.role}</Badge></span>
                            <Button size="sm" variant="ghost" onClick={() => removeSeatMutation.mutate({ email: s.email })} data-testid={`button-remove-invite-${s.email}`}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeatsTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
