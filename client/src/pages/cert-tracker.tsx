import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Building2, ChevronRight, FileBadge, Plus,
  Shield, Trash2, Pencil, Phone, Mail, ArrowLeft, CheckCircle,
  XCircle, Clock, Bell, Users, FileText, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BjClient {
  id: number;
  companyName: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface BjCertificate {
  id: number;
  clientId: number;
  certType: string;
  subType: string;
  certNumber: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string;
  holderName: string;
  notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CERT_TYPES = [
  "SBU Konstruksi", "SBU Konsultansi", "SBU Instalasi Listrik",
  "SBU Mekanikal", "SBU Elektrikal",
  "SKK Konstruksi", "SKK K3", "SKK Sipil", "SKK Arsitektur",
  "SKK MEP", "SKK Manajemen Proyek",
  "ISO 9001", "ISO 14001", "ISO 45001", "ISO 37001",
  "SMK3 / PP 50/2012", "CSMS",
  "Tenaga Kerja K3 Umum", "Tenaga Kerja K3 Konstruksi",
  "NIB / OSS", "IUJK", "IUJJK", "IUJK-PMA",
  "Lainnya",
];

function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(days: number) {
  if (days < 0) return { label: `Expired ${Math.abs(days)} hari lalu`, color: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-500", level: "expired" };
  if (days <= 30) return { label: `${days} hari lagi`, color: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-500", level: "critical" };
  if (days <= 90) return { label: `${days} hari lagi`, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-500", level: "warning" };
  return { label: `${days} hari lagi`, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500", level: "active" };
}

function clientBadgeSummary(certs: BjCertificate[]) {
  if (!certs.length) return { label: "Belum ada sertifikat", color: "text-slate-400" };
  const statuses = certs.map(c => getExpiryStatus(getDaysRemaining(c.expiryDate)).level);
  if (statuses.includes("expired")) return { label: "Ada yang Expired", color: "text-red-400" };
  if (statuses.includes("critical")) return { label: "Segera Habis (<30hr)", color: "text-orange-400" };
  if (statuses.includes("warning")) return { label: "Perlu Perhatian (<90hr)", color: "text-yellow-400" };
  return { label: `${certs.length} sertifikat aktif`, color: "text-emerald-400" };
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function ClientModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void;
  initial?: BjClient | null; onSave: (data: Partial<BjClient>) => void;
}) {
  const [form, setForm] = useState({
    companyName: initial?.companyName ?? "",
    picName: initial?.picName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{initial ? "Edit Klien" : "Tambah Klien Baru"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-slate-300 text-xs mb-1">Nama Perusahaan *</Label>
            <Input value={form.companyName} onChange={e => set("companyName", e.target.value)}
              placeholder="PT Maju Bersama / CV Karya Jaya" className="bg-slate-800 border-slate-600 text-white" data-testid="input-company-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">PIC / Kontak</Label>
              <Input value={form.picName} onChange={e => set("picName", e.target.value)}
                placeholder="Nama PIC" className="bg-slate-800 border-slate-600 text-white" data-testid="input-pic-name" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">No. Telepon</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="08xx-xxxx-xxxx" className="bg-slate-800 border-slate-600 text-white" data-testid="input-phone" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1">Email</Label>
            <Input value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="email@perusahaan.co.id" className="bg-slate-800 border-slate-600 text-white" data-testid="input-email" />
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1">Alamat</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="Kota / Provinsi" className="bg-slate-800 border-slate-600 text-white" data-testid="input-address" />
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1">Catatan</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Catatan tambahan..." rows={2} className="bg-slate-800 border-slate-600 text-white resize-none" data-testid="input-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400" data-testid="button-cancel-client">Batal</Button>
          <Button onClick={() => { if (form.companyName.trim()) { onSave(form); onClose(); } }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-save-client" disabled={!form.companyName.trim()}>
            {initial ? "Simpan Perubahan" : "Tambah Klien"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CertModal({ open, onClose, clientId, initial, onSave }: {
  open: boolean; onClose: () => void; clientId: number;
  initial?: BjCertificate | null; onSave: (data: Partial<BjCertificate>) => void;
}) {
  const [form, setForm] = useState({
    certType: initial?.certType ?? "",
    subType: initial?.subType ?? "",
    certNumber: initial?.certNumber ?? "",
    issuer: initial?.issuer ?? "",
    issuedDate: initial?.issuedDate ?? "",
    expiryDate: initial?.expiryDate ?? "",
    holderName: initial?.holderName ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{initial ? "Edit Sertifikat" : "Tambah Sertifikat / Dokumen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Jenis Sertifikat *</Label>
              <Select value={form.certType} onValueChange={v => set("certType", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-cert-type">
                  <SelectValue placeholder="Pilih jenis..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {CERT_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="text-white hover:bg-slate-700">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Sub-Tipe / Klasifikasi</Label>
              <Input value={form.subType} onChange={e => set("subType", e.target.value)}
                placeholder="Mis. Gedung, Jalan..." className="bg-slate-800 border-slate-600 text-white" data-testid="input-sub-type" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Nomor Sertifikat</Label>
              <Input value={form.certNumber} onChange={e => set("certNumber", e.target.value)}
                placeholder="No. Sertifikat" className="bg-slate-800 border-slate-600 text-white" data-testid="input-cert-number" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Penerbit / Lembaga</Label>
              <Input value={form.issuer} onChange={e => set("issuer", e.target.value)}
                placeholder="LPJK / BSN / dll" className="bg-slate-800 border-slate-600 text-white" data-testid="input-issuer" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1">Nama Pemegang (untuk SKK / personal)</Label>
            <Input value={form.holderName} onChange={e => set("holderName", e.target.value)}
              placeholder="Nama pemegang sertifikat (jika personal)" className="bg-slate-800 border-slate-600 text-white" data-testid="input-holder-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Tanggal Terbit</Label>
              <Input type="date" value={form.issuedDate} onChange={e => set("issuedDate", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-issued-date" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 flex items-center gap-1">
                Tanggal Berakhir *
                <span className="text-orange-400">(wajib)</span>
              </Label>
              <Input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-expiry-date" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1">Catatan</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Catatan status, proses perpanjangan, dll..." rows={2}
              className="bg-slate-800 border-slate-600 text-white resize-none" data-testid="input-cert-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400" data-testid="button-cancel-cert">Batal</Button>
          <Button onClick={() => { if (form.certType && form.expiryDate) { onSave({ ...form, clientId }); onClose(); } }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-save-cert"
            disabled={!form.certType || !form.expiryDate}>
            {initial ? "Simpan Perubahan" : "Tambah Sertifikat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CertTracker() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [clientModal, setClientModal] = useState<{ open: boolean; editing?: BjClient | null }>({ open: false });
  const [certModal, setCertModal] = useState<{ open: boolean; editing?: BjCertificate | null }>({ open: false });

  // ── Queries
  const { data: clients = [], isLoading: loadingClients } = useQuery<BjClient[]>({
    queryKey: ["/api/cert-tracker/clients"],
  });

  const { data: allCerts = [], isLoading: loadingCerts } = useQuery<BjCertificate[]>({
    queryKey: ["/api/cert-tracker/certificates"],
  });

  // ── Computed
  const certsByClient = useMemo(() => {
    const map: Record<number, BjCertificate[]> = {};
    allCerts.forEach(c => {
      if (!map[c.clientId]) map[c.clientId] = [];
      map[c.clientId].push(c);
    });
    return map;
  }, [allCerts]);

  const selectedCerts = selectedClientId ? (certsByClient[selectedClientId] ?? []) : [];

  const filteredClients = useMemo(() =>
    clients.filter(c => c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (c.picName ?? "").toLowerCase().includes(search.toLowerCase())),
    [clients, search]);

  const stats = useMemo(() => {
    const total = clients.length;
    let active = 0, warning = 0, expired = 0;
    allCerts.forEach(c => {
      const d = getDaysRemaining(c.expiryDate);
      if (d < 0) expired++;
      else if (d <= 90) warning++;
      else active++;
    });
    return { total, certTotal: allCerts.length, active, warning, expired };
  }, [clients, allCerts]);

  // ── Mutations
  const saveClient = useMutation({
    mutationFn: (data: { id?: number } & Partial<BjClient>) =>
      data.id
        ? apiRequest("PUT", `/api/cert-tracker/clients/${data.id}`, data)
        : apiRequest("POST", "/api/cert-tracker/clients", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cert-tracker/clients"] }); toast({ title: "Klien disimpan" }); },
    onError: () => toast({ title: "Gagal menyimpan klien", variant: "destructive" }),
  });

  const deleteClient = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cert-tracker/clients/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["/api/cert-tracker/clients"] });
      qc.invalidateQueries({ queryKey: ["/api/cert-tracker/certificates"] });
      if (selectedClientId === id) setSelectedClientId(null);
      toast({ title: "Klien dihapus" });
    },
  });

  const saveCert = useMutation({
    mutationFn: (data: { id?: number } & Partial<BjCertificate>) =>
      data.id
        ? apiRequest("PUT", `/api/cert-tracker/certificates/${data.id}`, data)
        : apiRequest("POST", "/api/cert-tracker/certificates", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cert-tracker/certificates"] }); toast({ title: "Sertifikat disimpan" }); },
    onError: () => toast({ title: "Gagal menyimpan sertifikat", variant: "destructive" }),
  });

  const deleteCert = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cert-tracker/certificates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cert-tracker/certificates"] }); toast({ title: "Sertifikat dihapus" }); },
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-sm">CertTracker — Biro Jasa</span>
            </div>
          </div>
          <Button
            onClick={() => setClientModal({ open: true })}
            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs gap-1.5"
            data-testid="button-add-client-header"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Klien
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Total Klien BUJK", value: stats.total, color: "emerald", sub: `${stats.certTotal} sertifikat` },
            { icon: CheckCircle, label: "Sertifikat Aktif", value: stats.active, color: "emerald", sub: "> 90 hari" },
            { icon: AlertTriangle, label: "Perlu Perhatian", value: stats.warning, color: "orange", sub: "≤ 90 hari" },
            { icon: XCircle, label: "Expired / Kritis", value: stats.expired, color: "red", sub: "Segera perbarui" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 bg-slate-900/60
              ${s.color === "emerald" ? "border-emerald-800/40" : s.color === "orange" ? "border-orange-800/40" : "border-red-800/40"}`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color === "emerald" ? "text-emerald-400" : s.color === "orange" ? "text-orange-400" : "text-red-400"}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className={`text-3xl font-bold ${s.color === "emerald" ? "text-emerald-400" : s.color === "orange" ? "text-orange-400" : "text-red-400"}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Alert Banner — if expired/critical */}
        {(stats.expired > 0 || stats.warning > 0) && (
          <div className="rounded-xl border border-orange-800/50 bg-orange-900/20 p-3 flex items-start gap-3">
            <Bell className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div className="text-sm text-orange-300">
              <span className="font-semibold">Perhatian: </span>
              {stats.expired > 0 && <span>{stats.expired} sertifikat sudah <strong>expired</strong>. </span>}
              {stats.warning > 0 && <span>{stats.warning} sertifikat akan habis dalam <strong>90 hari ke depan</strong>. </span>}
              Segera koordinasikan perpanjangan dengan klien terkait.
            </div>
          </div>
        )}

        {/* Main Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: "55vh" }}>

          {/* LEFT — Client List */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-200">Klien BUJK</span>
              <Badge className="bg-slate-700 text-slate-300 text-[10px] ml-auto">{clients.length}</Badge>
            </div>

            <div className="p-2 border-b border-slate-800/50">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama perusahaan / PIC..."
                className="bg-slate-800/60 border-slate-700 text-white text-xs h-8"
                data-testid="input-search-client"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {loadingClients ? (
                <div className="text-center text-slate-500 py-8 text-sm">Memuat...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">
                  {search ? "Tidak ada hasil" : (
                    <div className="space-y-2">
                      <Building2 className="w-8 h-8 mx-auto text-slate-600" />
                      <div>Belum ada klien.<br />Klik + Tambah Klien untuk mulai.</div>
                    </div>
                  )}
                </div>
              ) : filteredClients.map(client => {
                const certs = certsByClient[client.id] ?? [];
                const { label, color } = clientBadgeSummary(certs);
                const isSelected = selectedClientId === client.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(isSelected ? null : client.id)}
                    data-testid={`client-card-${client.id}`}
                    className={`rounded-lg border p-3 cursor-pointer transition-all
                      ${isSelected
                        ? "border-emerald-500/60 bg-emerald-900/20"
                        : "border-slate-700/60 hover:border-emerald-700/40 hover:bg-slate-800/60 bg-slate-800/30"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white truncate">{client.companyName}</div>
                        {client.picName && (
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>{client.picName}</span>
                            {client.phone && <span className="text-slate-600">· {client.phone}</span>}
                          </div>
                        )}
                        <div className={`text-xs mt-1 font-medium ${color}`}>{label}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setClientModal({ open: true, editing: client }); }}
                          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                          data-testid={`button-edit-client-${client.id}`}
                        ><Pencil className="w-3 h-3" /></button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm(`Hapus klien "${client.companyName}" beserta semua sertifikatnya?`)) {
                              deleteClient.mutate(client.id);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/30"
                          data-testid={`button-delete-client-${client.id}`}
                        ><Trash2 className="w-3 h-3" /></button>
                        <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? "text-emerald-400" : "text-slate-600"}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-800">
              <Button
                onClick={() => setClientModal({ open: true })}
                variant="outline"
                className="w-full h-8 text-xs border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-500"
                data-testid="button-add-client-bottom"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Klien Baru
              </Button>
            </div>
          </div>

          {/* RIGHT — Certificate List */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-emerald-400" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-200">
                  {selectedClient ? selectedClient.companyName : "Sertifikat & Dokumen"}
                </span>
                {selectedClient && (
                  <span className="text-xs text-slate-500 ml-2">— {selectedCerts.length} dokumen</span>
                )}
              </div>
              {selectedClientId && (
                <Button
                  onClick={() => setCertModal({ open: true })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs gap-1"
                  data-testid="button-add-cert"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!selectedClientId ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8 gap-3">
                  <FileText className="w-12 h-12 text-slate-700" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-400 mb-1">Pilih klien di sebelah kiri</div>
                    untuk melihat dan mengelola sertifikat / dokumen mereka
                  </div>
                </div>
              ) : loadingCerts ? (
                <div className="text-center text-slate-500 py-8 text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Memuat...
                </div>
              ) : selectedCerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8 gap-3">
                  <FileBadge className="w-12 h-12 text-slate-700" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-400 mb-1">Belum ada sertifikat</div>
                    untuk {selectedClient?.companyName}
                  </div>
                  <Button
                    onClick={() => setCertModal({ open: true })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
                    data-testid="button-add-first-cert"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Sertifikat Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCerts
                    .sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate))
                    .map(cert => {
                      const days = getDaysRemaining(cert.expiryDate);
                      const { label, color, dot } = getExpiryStatus(days);
                      return (
                        <div key={cert.id} className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 hover:border-slate-600 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-white">{cert.certType}</span>
                                {cert.subType && <span className="text-xs text-slate-400">— {cert.subType}</span>}
                                <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                  {label}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                {cert.certNumber && (
                                  <span className="text-xs text-slate-400">
                                    <span className="text-slate-600">No:</span> {cert.certNumber}
                                  </span>
                                )}
                                {cert.holderName && (
                                  <span className="text-xs text-slate-400">
                                    <span className="text-slate-600">Pemegang:</span> {cert.holderName}
                                  </span>
                                )}
                                {cert.issuer && (
                                  <span className="text-xs text-slate-400">
                                    <span className="text-slate-600">Penerbit:</span> {cert.issuer}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                {cert.issuedDate && (
                                  <span className="text-xs text-slate-500">Terbit: {cert.issuedDate}</span>
                                )}
                                <span className="text-xs text-slate-500">Berakhir: <span className="text-slate-300 font-medium">{cert.expiryDate}</span></span>
                              </div>
                              {cert.notes && (
                                <div className="text-xs text-slate-500 mt-1.5 italic">📝 {cert.notes}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setCertModal({ open: true, editing: cert })}
                                className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                                data-testid={`button-edit-cert-${cert.id}`}
                              ><Pencil className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => { if (confirm("Hapus sertifikat ini?")) deleteCert.mutate(cert.id); }}
                                className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/30"
                                data-testid={`button-delete-cert-${cert.id}`}
                              ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-500 flex flex-wrap gap-6">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <strong className="text-slate-400">Aktif</strong> — lebih dari 90 hari</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> <strong className="text-slate-400">Perlu Perhatian</strong> — 31–90 hari</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> <strong className="text-slate-400">Segera Habis</strong> — ≤ 30 hari</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> <strong className="text-slate-400">Expired</strong> — sudah lewat</span>
            <span className="text-slate-600">· Sertifikat diurutkan dari yang paling mendesak</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientModal
        open={clientModal.open}
        initial={clientModal.editing}
        onClose={() => setClientModal({ open: false })}
        onSave={data => saveClient.mutate(clientModal.editing ? { ...data, id: clientModal.editing.id } : data)}
      />
      {selectedClientId && (
        <CertModal
          open={certModal.open}
          clientId={selectedClientId}
          initial={certModal.editing}
          onClose={() => setCertModal({ open: false })}
          onSave={data => saveCert.mutate(certModal.editing ? { ...data, id: certModal.editing.id } : data)}
        />
      )}
    </div>
  );
}
