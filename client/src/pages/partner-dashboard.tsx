import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Users, Gauge, CalendarDays, Plus, Clock, CheckCircle2, XCircle, Palette } from "lucide-react";

interface PartnerMe {
  id: number;
  name: string;
  brandName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  tagline: string | null;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  host: string;
  seatsPerUnit: number;
  seatCapacity: number;
  activeSeats: number;
  pendingSeats: number;
  seatsUsed: number;
  monthlyQuota: number;
  quotaUsed: number;
  billingMonth: string;
  hasDefaultAgent: boolean;
}

interface SeatMember {
  userId: string;
  role: string;
  email?: string | null;
}
interface SeatPending {
  email: string;
  role: string;
}
interface SeatsResponse {
  active: SeatMember[];
  pending: SeatPending[];
  seatCapacity: number;
  seatsUsed: number;
  seatMode: boolean;
  hasDefaultAgent: boolean;
}

interface TopupRequest {
  id: number;
  kind: "seats" | "quota";
  amount: number;
  note: string | null;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
}

const KIND_LABEL: Record<string, string> = { seats: "Kursi Fasilitator", quota: "Kuota Pesan" };
const STATUS_META: Record<string, { label: string; variant: "secondary" | "default" | "destructive"; icon: typeof Clock }> = {
  pending: { label: "Menunggu", variant: "secondary", icon: Clock },
  resolved: { label: "Selesai", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Ditolak", variant: "destructive", icon: XCircle },
};

interface BrandForm {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  tagline: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
}

function BrandSettingsCard({ partner }: { partner: PartnerMe }) {
  const { toast } = useToast();
  const [form, setForm] = useState<BrandForm>({
    brandName: partner.brandName || "",
    logoUrl: partner.logoUrl || "",
    primaryColor: partner.primaryColor || "",
    tagline: partner.tagline || "",
    description: partner.description || "",
    contactPhone: partner.contactPhone || "",
    contactEmail: partner.contactEmail || "",
  });

  const set = (key: keyof BrandForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/partner/me", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/by-host"] });
      toast({ title: "Tersimpan", description: "Pengaturan brand berhasil diperbarui. Perubahan tampil di halaman mitra Anda." });
    },
    onError: (e: any) => {
      const raw = e?.message || "";
      const msg = raw.replace(/^\d{3}:\s*/, "");
      let detail = msg;
      try { detail = JSON.parse(msg)?.error || msg; } catch { /* plain text */ }
      toast({ title: "Gagal menyimpan", description: detail, variant: "destructive" });
    },
  });

  const colorValid = !form.primaryColor || /^#[0-9a-fA-F]{3,8}$/.test(form.primaryColor.trim());

  return (
    <Card data-testid="card-brand-settings">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="w-4 h-4" /> Pengaturan Brand
        </CardTitle>
        <CardDescription>
          Atur tampilan whitelabel Anda sendiri — nama, logo, warna, dan kontak. Perubahan langsung berlaku di{" "}
          <span className="font-mono">{partner.host}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Nama Brand</Label>
            <Input id="brand-name" value={form.brandName} onChange={set("brandName")} maxLength={120} placeholder="mis. PUB ASPEKINDO" data-testid="input-brand-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-logo">URL Logo</Label>
            <div className="flex items-center gap-2">
              <Input id="brand-logo" value={form.logoUrl} onChange={set("logoUrl")} maxLength={500} placeholder="https://.../logo.png" data-testid="input-brand-logo" />
              {form.logoUrl.trim() && (
                <img src={form.logoUrl.trim()} alt="Pratinjau logo" className="h-9 w-9 rounded object-contain border shrink-0" data-testid="img-logo-preview" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-color">Warna Utama (hex)</Label>
            <div className="flex items-center gap-2">
              <Input id="brand-color" value={form.primaryColor} onChange={set("primaryColor")} maxLength={32} placeholder="#166534" data-testid="input-brand-color" />
              <input
                type="color"
                value={colorValid && form.primaryColor.trim().length >= 4 ? form.primaryColor.trim() : "#166534"}
                onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="h-9 w-12 rounded border cursor-pointer bg-transparent shrink-0"
                aria-label="Pilih warna utama"
                data-testid="input-brand-color-picker"
              />
            </div>
            {!colorValid && <p className="text-xs text-destructive">Format hex tidak valid, mis. #166534</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-tagline">Tagline</Label>
            <Input id="brand-tagline" value={form.tagline} onChange={set("tagline")} maxLength={200} placeholder="mis. AI Platform Dokumen Tender & Proyek Konstruksi" data-testid="input-brand-tagline" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-phone">No. WhatsApp/Telepon</Label>
            <Input id="brand-phone" value={form.contactPhone} onChange={set("contactPhone")} maxLength={32} placeholder="mis. 6281234567890" data-testid="input-brand-phone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-email">Email Kontak</Label>
            <Input id="brand-email" type="email" value={form.contactEmail} onChange={set("contactEmail")} maxLength={200} placeholder="mis. info@asosiasi.or.id" data-testid="input-brand-email" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-description">Deskripsi Singkat</Label>
          <Textarea id="brand-description" value={form.description} onChange={set("description")} maxLength={1000} rows={3} placeholder="Deskripsi organisasi/layanan Anda yang tampil di halaman depan..." data-testid="input-brand-description" />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.brandName.trim() || !colorValid}
            data-testid="button-save-brand"
          >
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SeatManagementCard({ partner }: { partner: PartnerMe }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");

  const { data: seats, isLoading } = useQuery<SeatsResponse>({
    queryKey: ["/api/partner/me/seats"],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/partner/me/seats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/partner/me"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/partner/me/seats", { email: email.trim().toLowerCase(), role }),
    onSuccess: async (res: any) => {
      let status = "";
      try { status = (await res.json())?.status; } catch { /* ignore */ }
      invalidate();
      setEmail("");
      toast({
        title: "Seat ditambahkan",
        description: status === "pending"
          ? "Undangan terkirim. Anggota akan dapat akses Starter setelah login."
          : "Anggota langsung diberi akses Starter.",
      });
    },
    onError: (e: any) => {
      const raw = (e?.message || "").replace(/^\d{3}:\s*/, "");
      let detail = raw;
      try { detail = JSON.parse(raw)?.error || raw; } catch { /* plain */ }
      toast({ title: "Gagal menambah seat", description: detail, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (params: { userId?: string; email?: string }) => {
      const qs = params.userId ? `userId=${encodeURIComponent(params.userId)}` : `email=${encodeURIComponent(params.email || "")}`;
      return apiRequest("DELETE", `/api/partner/me/seats?${qs}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Seat dicabut", description: "Akses anggota telah dinonaktifkan." });
    },
    onError: (e: any) => {
      toast({ title: "Gagal mencabut seat", description: e?.message || "Terjadi kesalahan", variant: "destructive" });
    },
  });

  const capacity = seats?.seatCapacity ?? partner.seatCapacity;
  const used = seats?.seatsUsed ?? partner.seatsUsed;
  const remaining = Math.max(0, capacity - used);
  const full = remaining <= 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0;

  return (
    <Card data-testid="card-seat-management">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" /> Lisensi Seat Anggota
        </CardTitle>
        <CardDescription>
          Kelola seat anggota Anda. Tiap seat = 1 akun tim dengan akses Starter (pakai chatbot asosiasi + rakit s.d. 3 chatbot sendiri + kuota pesan).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-sm">
              <strong className="text-2xl font-bold" data-testid="text-seats-used">{used}</strong>
              <span className="text-muted-foreground"> / {capacity} seat terpakai</span>
            </p>
            <span className="text-xs text-muted-foreground" data-testid="text-seats-remaining">{remaining} tersisa</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" data-testid="progress-seats" />
        </div>

        {!partner.hasDefaultAgent && (
          <p className="text-xs text-destructive">Mitra belum punya chatbot default — seat tidak dapat diberikan. Hubungi Gustafta.</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="seat-email">Email anggota</Label>
            <Input
              id="seat-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anggota@perusahaan.co.id"
              disabled={full || !partner.hasDefaultAgent}
              data-testid="input-seat-email"
            />
          </div>
          <div className="space-y-1.5 sm:w-40">
            <Label>Peran</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
              <SelectTrigger data-testid="select-seat-role" disabled={full || !partner.hasDefaultAgent}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Anggota (viewer)</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={full || !partner.hasDefaultAgent || !email.trim() || !email.includes("@") || addMutation.isPending}
            data-testid="button-add-seat"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {addMutation.isPending ? "Menambah..." : "Tambah"}
          </Button>
        </div>
        {full && (
          <p className="text-xs text-amber-600 dark:text-amber-500" data-testid="text-seats-full">
            Kapasitas seat penuh. Ajukan tambah kapasitas lewat "Ajukan Top-Up" di bawah.
          </p>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-3 text-center">Memuat daftar seat...</p>
          ) : (seats && (seats.active.length > 0 || seats.pending.length > 0)) ? (
            <>
              {seats.active.map((m) => (
                <div key={m.userId} className="flex items-center justify-between gap-3 border rounded px-3 py-2" data-testid={`row-seat-${m.userId}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.email || m.userId}</p>
                    <p className="text-xs text-muted-foreground">{m.role === "editor" ? "Editor" : "Anggota"} · aktif</p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => removeMutation.mutate({ userId: m.userId })}
                    disabled={removeMutation.isPending}
                    data-testid={`button-remove-seat-${m.userId}`}
                  >
                    <XCircle className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {seats.pending.map((p) => (
                <div key={p.email} className="flex items-center justify-between gap-3 border border-dashed rounded px-3 py-2" data-testid={`row-seat-pending-${p.email}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.role === "editor" ? "Editor" : "Anggota"} · <span className="text-amber-600 dark:text-amber-500">undangan tertunda</span></p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => removeMutation.mutate({ email: p.email })}
                    disabled={removeMutation.isPending}
                    data-testid={`button-remove-seat-pending-${p.email}`}
                  >
                    <XCircle className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-3 text-center" data-testid="text-no-seats">Belum ada anggota. Tambahkan seat pertama Anda di atas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function PartnerDashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [topupOpen, setTopupOpen] = useState(false);
  const [kind, setKind] = useState<"seats" | "quota">("quota");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  const { data: partner, isLoading, isError, error } = useQuery<PartnerMe>({
    queryKey: ["/api/partner/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: requests = [] } = useQuery<TopupRequest[]>({
    queryKey: ["/api/partner/me/topup-requests"],
    enabled: isAuthenticated && !!partner,
  });

  const topupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/partner/me/topup-requests", { kind, amount, note: note || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/me/topup-requests"] });
      setTopupOpen(false);
      setAmount(0);
      setNote("");
      toast({ title: "Permintaan terkirim", description: "Tim Gustafta akan meninjau & memproses permintaan Anda." });
    },
    onError: (e: any) => {
      toast({ title: "Gagal", description: e?.message || "Tidak dapat mengirim permintaan", variant: "destructive" });
    },
  });

  if (authLoading || (isAuthenticated && isLoading)) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Memuat...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <p>Silakan login untuk mengakses dasbor mitra.</p>
        <a href="/login"><Button>Masuk</Button></a>
      </div>
    );
  }

  if (isError || !partner) {
    const msg = (error as any)?.message || "";
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-3 px-6 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-lg font-medium">Bukan pengurus mitra</p>
        <p className="text-sm text-muted-foreground max-w-md" data-testid="text-not-partner">
          {msg.includes("403") || msg.toLowerCase().includes("pengurus")
            ? "Akun Anda belum terdaftar sebagai pengurus mitra whitelabel. Hubungi tim Gustafta untuk didaftarkan."
            : "Tidak dapat memuat data mitra saat ini."}
        </p>
      </div>
    );
  }

  const unlimited = partner.monthlyQuota === 0;
  const quotaPct = unlimited ? 0 : Math.min(100, Math.round((partner.quotaUsed / partner.monthlyQuota) * 100));
  const accent = partner.primaryColor || undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-6 py-4 flex items-center gap-3">
        {partner.logoUrl ? (
          <img src={partner.logoUrl} alt={partner.brandName} className="h-8 w-8 rounded object-contain" data-testid="img-partner-logo" />
        ) : (
          <Building2 className="w-6 h-6" style={{ color: accent }} />
        )}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: accent }} data-testid="text-partner-name">{partner.brandName}</h1>
          <p className="text-xs text-muted-foreground font-mono">{partner.host}</p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-seats">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Kursi Fasilitator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="text-active-seats">
                {partner.activeSeats}
                {(partner.seatCapacity ?? 0) > 0 && (
                  <span className="text-base font-normal text-muted-foreground"> / {partner.seatCapacity}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(partner.seatCapacity ?? 0) > 0 ? "seat terpakai" : "fasilitator aktif"}
                {partner.pendingSeats > 0 && <> · {partner.pendingSeats} undangan tertunda</>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(partner.seatCapacity ?? 0) > 0
                  ? <>Mode: <strong>Lisensi Seat</strong></>
                  : <>Jatah per unit: <strong>{partner.seatsPerUnit}</strong></>}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-quota">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Kuota Pesan Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unlimited ? (
                <>
                  <p className="text-3xl font-bold" data-testid="text-quota-used">{partner.quotaUsed.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground mt-1">terpakai · kuota <strong>tak terbatas</strong></p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold" data-testid="text-quota-used">
                    {partner.quotaUsed.toLocaleString("id-ID")}
                    <span className="text-base font-normal text-muted-foreground"> / {partner.monthlyQuota.toLocaleString("id-ID")}</span>
                  </p>
                  <Progress value={quotaPct} className="mt-2 h-2" data-testid="progress-quota" />
                  <p className="text-xs text-muted-foreground mt-1">{quotaPct}% pool bulanan terpakai</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-billing-month">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Bulan Berjalan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-billing-month">{formatMonth(partner.billingMonth)}</p>
              <p className="text-xs text-muted-foreground mt-1">Kuota di-reset otomatis tiap awal bulan.</p>
            </CardContent>
          </Card>
        </div>

        {(partner.seatCapacity ?? 0) > 0 && <SeatManagementCard partner={partner} key={`seats-${partner.id}`} />}

        <BrandSettingsCard partner={partner} key={`brand-${partner.id}`} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Permintaan Top-Up</CardTitle>
              <CardDescription>Minta tambahan kursi atau kuota. Tim Gustafta akan memproses permintaan Anda.</CardDescription>
            </div>
            <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-open-topup">
                  <Plus className="w-4 h-4 mr-2" /> Ajukan Top-Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajukan Top-Up</DialogTitle>
                  <DialogDescription>Permintaan dikirim ke tim Gustafta untuk ditinjau dan diaktifkan.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Jenis</Label>
                    <Select value={kind} onValueChange={(v) => setKind(v as "seats" | "quota")}>
                      <SelectTrigger data-testid="select-topup-kind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quota">Kuota Pesan Bulanan</SelectItem>
                        <SelectItem value="seats">Kursi Fasilitator (per unit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topup-amount">Jumlah tambahan</Label>
                    <Input id="topup-amount" type="number" min={1} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder={kind === "quota" ? "mis. 5000 pesan" : "mis. 3 kursi"} data-testid="input-topup-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topup-note">Catatan (opsional)</Label>
                    <Textarea id="topup-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Alasan atau detail tambahan..." maxLength={500} data-testid="input-topup-note" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTopupOpen(false)}>Batal</Button>
                  <Button
                    onClick={() => topupMutation.mutate()}
                    disabled={!amount || amount <= 0 || topupMutation.isPending}
                    data-testid="button-submit-topup"
                  >
                    {topupMutation.isPending ? "Mengirim..." : "Kirim Permintaan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-requests">Belum ada permintaan top-up.</p>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.pending;
                  const StatusIcon = meta.icon;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 border rounded px-3 py-2.5" data-testid={`row-request-${r.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          +{r.amount.toLocaleString("id-ID")} {KIND_LABEL[r.kind] || r.kind}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          {r.note && <> · {r.note}</>}
                        </p>
                      </div>
                      <Badge variant={meta.variant} className="shrink-0 gap-1" data-testid={`status-request-${r.id}`}>
                        <StatusIcon className="w-3 h-3" /> {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
