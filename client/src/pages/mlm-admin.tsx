import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Users, GitBranch, TrendingUp, Wallet, Percent,
  Plus, Pencil, Trash2, Copy, Check, ChevronRight, Loader2,
  Settings, ReceiptText, Building2, MapPin, Crown, Star, Circle,
  CheckCircle2, XCircle, Clock, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Affiliate {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  mlmLevel: number;
  parentId: number | null;
  region: string;
  commissionRate: number;
  totalEarnings: number;
  totalEarningsLicense: number;
  totalEarningsRecurring: number;
  totalReferrals: number;
  payoutInfo: string;
  isActive: boolean;
  createdAt: string;
}
interface CommissionRate { id: number; mlmLevel: number; commissionType: string; rate: number; }
interface Commission {
  id: number;
  affiliateId: number;
  sourceAffiliateId: number | null;
  transactionType: string;
  transactionRef: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  mlmLevel: number;
  status: string;
  notes: string;
  createdAt: string;
  paidAt: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<number, { label: string; color: string; bg: string; icon: any; dot: string }> = {
  1: { label: "Pusat (L1)",    color: "text-amber-400",   bg: "bg-amber-500/10",   icon: Crown,    dot: "bg-amber-500" },
  2: { label: "Provinsi (L2)", color: "text-violet-400",  bg: "bg-violet-500/10",  icon: Star,     dot: "bg-violet-500" },
  3: { label: "Kab/Kota (L3)", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: MapPin,   dot: "bg-emerald-500" },
};
const COMMISSION_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "Pending",   color: "text-amber-400",   icon: Clock },
  approved:  { label: "Approved",  color: "text-blue-400",    icon: CheckCircle2 },
  paid:      { label: "Dibayar",   color: "text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan",color: "text-red-400",     icon: XCircle },
};
function rupiah(n: number): string {
  if (!n) return "Rp 0";
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}

// ─── Add/Edit Affiliate Modal ─────────────────────────────────────────────────
function AffiliateModal({ open, onClose, affiliates, editing, onSave }: {
  open: boolean; onClose: () => void; affiliates: Affiliate[];
  editing?: Affiliate | null; onSave: (d: any) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    code: editing?.code ?? "",
    mlmLevel: editing?.mlmLevel ?? 3,
    parentId: editing?.parentId ? String(editing.parentId) : "",
    region: editing?.region ?? "",
    payoutInfo: editing?.payoutInfo ?? "",
    isActive: editing?.isActive ?? true,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validParents = affiliates.filter(a => a.mlmLevel === form.mlmLevel - 1 && a.isActive);

  function genCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{editing ? "Edit Afiliasi" : "Tambah Afiliasi Baru"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Level Afiliasi *</Label>
              <Select value={String(form.mlmLevel)} onValueChange={v => { set("mlmLevel", Number(v)); set("parentId", ""); }}
                disabled={!!editing}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-mlm-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="1" className="text-white hover:bg-slate-700">🏛️ Level 1 — Pusat</SelectItem>
                  <SelectItem value="2" className="text-white hover:bg-slate-700">🌏 Level 2 — Provinsi</SelectItem>
                  <SelectItem value="3" className="text-white hover:bg-slate-700">📍 Level 3 — Kab/Kota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.mlmLevel > 1 && (
              <div>
                <Label className="text-slate-300 text-xs mb-1">Upline (Level {form.mlmLevel - 1}) *</Label>
                <Select value={form.parentId} onValueChange={v => set("parentId", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-parent">
                    <SelectValue placeholder="Pilih upline..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {validParents.length === 0
                      ? <SelectItem value="_none" className="text-slate-500">Tidak ada upline level {form.mlmLevel - 1}</SelectItem>
                      : validParents.map(a => (
                        <SelectItem key={a.id} value={String(a.id)} className="text-white hover:bg-slate-700">
                          {a.name} ({a.region || a.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Nama Lengkap *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Nama afiliasi" className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-aff-name" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Wilayah</Label>
              <Input value={form.region} onChange={e => set("region", e.target.value)}
                placeholder={form.mlmLevel === 1 ? "Nasional" : form.mlmLevel === 2 ? "Nama Provinsi" : "Nama Kab/Kota"}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-aff-region" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Email *</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="email@example.com" className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-aff-email" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">No. Telepon</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="08xx-xxxx-xxxx" className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-aff-phone" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Kode Referral *</Label>
              <div className="flex gap-1.5">
                <Input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                  placeholder="KODE123" className="bg-slate-800 border-slate-600 text-white font-mono"
                  data-testid="input-aff-code" />
                <Button type="button" size="icon" variant="outline"
                  className="border-slate-600 text-slate-400 hover:text-white shrink-0"
                  onClick={() => set("code", genCode())}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Info Rekening / Payout</Label>
              <Input value={form.payoutInfo} onChange={e => set("payoutInfo", e.target.value)}
                placeholder="BCA 1234567890 a.n. ..." className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-aff-payout" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Label className="text-slate-300 text-xs">Status:</Label>
            <Button type="button" size="sm" variant="outline"
              className={`h-7 text-xs border-slate-600 ${form.isActive ? "text-emerald-400 border-emerald-600/40" : "text-slate-500"}`}
              onClick={() => set("isActive", !form.isActive)}>
              {form.isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
              {form.isActive ? "Aktif" : "Tidak Aktif"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Batal</Button>
          <Button
            onClick={() => {
              if (!form.name.trim() || !form.email.trim() || !form.code.trim()) return;
              if (form.mlmLevel > 1 && !form.parentId) return;
              onSave({
                ...form,
                mlmLevel: Number(form.mlmLevel),
                parentId: form.parentId ? Number(form.parentId) : null,
              });
              onClose();
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white"
            data-testid="button-save-affiliate"
            disabled={!form.name.trim() || !form.email.trim() || !form.code.trim() || (form.mlmLevel > 1 && !form.parentId)}>
            {editing ? "Simpan" : "Tambah Afiliasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Commission Modal ──────────────────────────────────────────────────
function RecordCommissionModal({ open, onClose, affiliates, onSave }: {
  open: boolean; onClose: () => void; affiliates: Affiliate[]; onSave: (d: any) => void;
}) {
  const [form, setForm] = useState({
    affiliateCode: "",
    grossAmount: "",
    transactionType: "license",
    transactionRef: "",
    notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedAff = affiliates.find(a => a.code === form.affiliateCode);
  const RATES: Record<string, Record<number, number>> = {
    license:   { 1: 2, 2: 8,  3: 20 },
    recurring: { 1: 2, 2: 4,  3: 4  },
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Catat Komisi Transaksi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Kode Referral *</Label>
              <Select value={form.affiliateCode} onValueChange={v => set("affiliateCode", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-aff-code">
                  <SelectValue placeholder="Pilih afiliasi..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-48">
                  {affiliates.filter(a => a.isActive).map(a => (
                    <SelectItem key={a.id} value={a.code} className="text-white hover:bg-slate-700 text-xs">
                      [{a.code}] {a.name} (L{a.mlmLevel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Jenis Transaksi *</Label>
              <Select value={form.transactionType} onValueChange={v => set("transactionType", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-trans-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="license" className="text-white hover:bg-slate-700">Biaya Lisensi (one-time)</SelectItem>
                  <SelectItem value="recurring" className="text-white hover:bg-slate-700">Berlangganan (recurring)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Jumlah Transaksi (Rp) *</Label>
              <Input value={form.grossAmount} onChange={e => set("grossAmount", e.target.value)}
                type="number" placeholder="1000000" className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-gross-amount" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Ref / No. Order</Label>
              <Input value={form.transactionRef} onChange={e => set("transactionRef", e.target.value)}
                placeholder="INV-2026-001" className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-trans-ref" />
            </div>
          </div>

          {/* Commission preview with rollup logic */}
          {selectedAff && form.grossAmount && (
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-2 font-semibold">Preview Distribusi Komisi</div>
              {(() => {
                // Build upline chain
                const chain: Affiliate[] = [selectedAff];
                let cur = selectedAff;
                while (cur.parentId) {
                  const p = affiliates.find(a => a.id === cur.parentId);
                  if (!p) break;
                  chain.push(p);
                  cur = p;
                }
                const gross = Number(form.grossAmount);
                const type = form.transactionType;
                const presentLevels = new Set(chain.map(a => a.mlmLevel));

                // Compute effective rates with rollup
                const effRate = new Map<number, number>();
                chain.forEach(a => effRate.set(a.id, RATES[type]?.[a.mlmLevel] ?? 0));
                // Missing L3 → absorbed by L2 or L1; Missing L2 → absorbed by L1
                for (const missingLvl of [3, 2]) {
                  if (!presentLevels.has(missingLvl)) {
                    const missedRate = RATES[type]?.[missingLvl] ?? 0;
                    const absorbLvl = [missingLvl - 1, missingLvl - 2].find(l => l >= 1 && presentLevels.has(l));
                    if (absorbLvl !== undefined) {
                      const absAff = chain.find(a => a.mlmLevel === absorbLvl)!;
                      effRate.set(absAff.id, (effRate.get(absAff.id) ?? 0) + missedRate);
                    }
                  }
                }

                const missingLabels: string[] = [];
                if (!presentLevels.has(3)) missingLabels.push("Kab/Kota");
                if (!presentLevels.has(2)) missingLabels.push("Provinsi");

                return (
                  <>
                    {missingLabels.length > 0 && (
                      <div className="text-[10px] text-amber-400/80 mb-2 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Rollup aktif — {missingLabels.join(" & ")} tidak ada, komisinya dialihkan ke level atasnya.</span>
                      </div>
                    )}
                    {chain.map(aff => {
                      const rate = effRate.get(aff.id) ?? 0;
                      const baseRate = RATES[type]?.[aff.mlmLevel] ?? 0;
                      const absorbed = rate - baseRate;
                      const amount = Math.round((gross * rate) / 100);
                      const cfg = LEVEL_CONFIG[aff.mlmLevel];
                      return (
                        <div key={aff.id} className="flex justify-between items-center py-1.5 border-b border-slate-700/30 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                            <span className="text-xs text-slate-300 truncate">{aff.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-xs font-semibold text-emerald-400">
                              {rate}% = {rupiah(amount)}
                            </span>
                            {absorbed > 0 && (
                              <div className="text-[10px] text-amber-400/70">(termasuk +{absorbed}% rollup)</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}

          <div>
            <Label className="text-slate-300 text-xs mb-1">Catatan</Label>
            <Input value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Opsional..." className="bg-slate-800 border-slate-600 text-white"
              data-testid="input-commission-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Batal</Button>
          <Button
            onClick={() => {
              if (!form.affiliateCode || !form.grossAmount) return;
              onSave({ ...form, grossAmount: Number(form.grossAmount) });
              onClose();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            data-testid="button-record-commission"
            disabled={!form.affiliateCode || !form.grossAmount}>
            Catat Komisi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MlmAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"tree" | "commissions" | "rates">("tree");
  const [affModal, setAffModal] = useState<{ open: boolean; editing?: Affiliate | null }>({ open: false });
  const [commModal, setCommModal] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: affiliates = [], isLoading: loadAff } = useQuery<Affiliate[]>({ queryKey: ["/api/mlm/affiliates"] });
  const { data: commissions = [], isLoading: loadComm } = useQuery<Commission[]>({ queryKey: ["/api/mlm/commissions"] });
  const { data: rates = [] } = useQuery<CommissionRate[]>({ queryKey: ["/api/mlm/rates"] });

  const stats = useMemo(() => {
    const l1 = affiliates.filter(a => a.mlmLevel === 1).length;
    const l2 = affiliates.filter(a => a.mlmLevel === 2).length;
    const l3 = affiliates.filter(a => a.mlmLevel === 3).length;
    const totalEarnings = affiliates.reduce((s, a) => s + (a.totalEarnings ?? 0), 0);
    const pendingComm = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);
    const paidComm = commissions.filter(c => c.status === "paid").reduce((s, c) => s + c.commissionAmount, 0);
    return { l1, l2, l3, totalEarnings, pendingComm, paidComm };
  }, [affiliates, commissions]);

  // ── Mutations
  const saveAffiliate = useMutation({
    mutationFn: (d: any) => d.id
      ? apiRequest("PUT", `/api/mlm/affiliates/${d.id}`, d)
      : apiRequest("POST", "/api/mlm/affiliates", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/mlm/affiliates"] }); toast({ title: "Afiliasi disimpan" }); },
    onError: async (e: any) => {
      let msg = "Gagal menyimpan";
      try { const j = await e.response?.json(); msg = j?.error ?? msg; } catch {}
      toast({ title: msg, variant: "destructive" });
    },
  });
  const deleteAffiliate = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/mlm/affiliates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/mlm/affiliates"] }); toast({ title: "Afiliasi dihapus" }); },
  });
  const recordCommission = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/mlm/commissions/record", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mlm/commissions"] });
      qc.invalidateQueries({ queryKey: ["/api/mlm/affiliates"] });
      toast({ title: "Komisi dicatat berhasil" });
    },
    onError: async (e: any) => {
      let msg = "Gagal catat komisi";
      try { const j = await e.response?.json(); msg = j?.error ?? msg; } catch {}
      toast({ title: msg, variant: "destructive" });
    },
  });
  const updateCommStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/mlm/commissions/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/mlm/commissions"] }),
  });
  const updateRate = useMutation({
    mutationFn: ({ id, rate }: { id: number; rate: number }) => apiRequest("PUT", `/api/mlm/rates/${id}`, { rate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/mlm/rates"] }); toast({ title: "Rate diperbarui" }); },
  });

  const copyCode = (aff: Affiliate) => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${aff.code}`);
    setCopiedId(aff.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link disalin!" });
  };

  // Build tree: L1 → L2[] → L3[]
  const l1List = affiliates.filter(a => a.mlmLevel === 1);
  const l2ByParent = (parentId: number) => affiliates.filter(a => a.mlmLevel === 2 && a.parentId === parentId);
  const l3ByParent = (parentId: number) => affiliates.filter(a => a.mlmLevel === 3 && a.parentId === parentId);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-400" />
              <span className="font-semibold text-sm">MLM Admin — Program Afiliasi 3 Level</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCommModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs gap-1.5"
              data-testid="button-record-commission">
              <ReceiptText className="w-3.5 h-3.5" /> Catat Komisi
            </Button>
            <Button onClick={() => setAffModal({ open: true })}
              className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs gap-1.5"
              data-testid="button-add-affiliate">
              <Plus className="w-3.5 h-3.5" /> Tambah Afiliasi
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { icon: Crown,    label: "Pusat (L1)",      value: stats.l1,             color: "amber" },
            { icon: Star,     label: "Provinsi (L2)",   value: stats.l2,             color: "violet" },
            { icon: MapPin,   label: "Kab/Kota (L3)",   value: stats.l3,             color: "emerald" },
            { icon: Wallet,   label: "Total Komisi",    value: rupiah(stats.totalEarnings), color: "blue" },
            { icon: Clock,    label: "Komisi Pending",  value: rupiah(stats.pendingComm), color: stats.pendingComm > 0 ? "amber" : "slate" },
            { icon: CheckCircle2, label: "Sudah Dibayar", value: rupiah(stats.paidComm), color: "green" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 bg-slate-900/60
              ${s.color === "amber" ? "border-amber-800/40" : s.color === "violet" ? "border-violet-800/40" : s.color === "emerald" || s.color === "green" ? "border-emerald-800/40" : s.color === "blue" ? "border-blue-800/40" : "border-slate-800/40"}`}>
              <s.icon className={`w-4 h-4 mb-1 ${s.color === "amber" ? "text-amber-400" : s.color === "violet" ? "text-violet-400" : s.color === "emerald" || s.color === "green" ? "text-emerald-400" : s.color === "blue" ? "text-blue-400" : "text-slate-500"}`} />
              <div className={`text-xl font-bold leading-tight ${s.color === "amber" ? "text-amber-400" : s.color === "violet" ? "text-violet-400" : s.color === "emerald" || s.color === "green" ? "text-emerald-400" : s.color === "blue" ? "text-blue-400" : "text-slate-500"}`}>
                {s.value}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { key: "tree",        label: `Jaringan Afiliasi (${affiliates.length})`, icon: GitBranch },
            { key: "commissions", label: `Ledger Komisi (${commissions.length})`,   icon: ReceiptText },
            { key: "rates",       label: "Konfigurasi Rate",                          icon: Settings },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2
                ${activeTab === t.key ? "text-violet-400 border-violet-500 bg-violet-900/10" : "text-slate-500 border-transparent hover:text-slate-400"}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Jaringan ──────────────────────────────────────────────────── */}
        {activeTab === "tree" && (
          <div className="space-y-3">
            {loadAff ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Memuat...
              </div>
            ) : affiliates.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <div className="mb-3">Belum ada afiliasi. Tambah Level 1 (Pusat) terlebih dahulu.</div>
                <Button onClick={() => setAffModal({ open: true })} className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Afiliasi
                </Button>
              </div>
            ) : (
              <>
                {/* Orphan L2/L3 without parent */}
                {affiliates.filter(a => a.mlmLevel > 1 && !a.parentId).length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-400">
                    ⚠️ {affiliates.filter(a => a.mlmLevel > 1 && !a.parentId).length} afiliasi tanpa upline — perlu diassign ke upline yang sesuai.
                  </div>
                )}
                {/* Tree */}
                {l1List.map(l1 => (
                  <div key={l1.id} className="rounded-xl border border-amber-800/30 bg-slate-900/50 overflow-hidden">
                    {/* L1 row */}
                    <AffRow aff={l1} copiedId={copiedId} onCopy={copyCode}
                      onEdit={() => setAffModal({ open: true, editing: l1 })}
                      onDelete={() => deleteAffiliate.mutate(l1.id)}
                      commissions={commissions} />
                    {/* L2 */}
                    {l2ByParent(l1.id).map(l2 => (
                      <div key={l2.id} className="border-t border-slate-800/40">
                        <div className="pl-6 border-l-2 border-violet-800/30 ml-4">
                          <AffRow aff={l2} copiedId={copiedId} onCopy={copyCode}
                            onEdit={() => setAffModal({ open: true, editing: l2 })}
                            onDelete={() => deleteAffiliate.mutate(l2.id)}
                            commissions={commissions} />
                          {/* L3 */}
                          {l3ByParent(l2.id).map(l3 => (
                            <div key={l3.id} className="border-t border-slate-800/40 border-l-2 border-emerald-800/30 ml-4">
                              <div className="pl-6">
                                <AffRow aff={l3} copiedId={copiedId} onCopy={copyCode}
                                  onEdit={() => setAffModal({ open: true, editing: l3 })}
                                  onDelete={() => deleteAffiliate.mutate(l3.id)}
                                  commissions={commissions} />
                              </div>
                            </div>
                          ))}
                          {l3ByParent(l2.id).length === 0 && (
                            <div className="px-4 py-2 text-[10px] text-slate-700 italic">Belum ada Kab/Kota di bawah ini</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {l2ByParent(l1.id).length === 0 && (
                      <div className="px-4 py-2 text-[10px] text-slate-700 italic border-t border-slate-800/30">Belum ada Provinsi di bawah Pusat ini</div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Ledger Komisi ─────────────────────────────────────────────── */}
        {activeTab === "commissions" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            {loadComm ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memuat...</div>
            ) : commissions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <ReceiptText className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <div>Belum ada catatan komisi</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/30">
                      <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Afiliasi</th>
                      <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Level</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Jenis</th>
                      <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">Gross</th>
                      <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">Rate</th>
                      <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">Komisi</th>
                      <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Status</th>
                      <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(c => {
                      const aff = affiliates.find(a => a.id === c.affiliateId);
                      const cfg = LEVEL_CONFIG[c.mlmLevel] ?? LEVEL_CONFIG[3];
                      const statusCfg = COMMISSION_STATUS[c.status] ?? COMMISSION_STATUS.pending;
                      return (
                        <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                          <td className="px-4 py-3">
                            <div className="text-sm text-white">{aff?.name ?? `ID #${c.affiliateId}`}</div>
                            <div className="text-[10px] text-slate-600">{aff?.code}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-[10px] ${c.transactionType === "license" ? "bg-blue-950/60 text-blue-400 border-blue-800/40" : "bg-violet-950/60 text-violet-400 border-violet-800/40"}`}>
                              {c.transactionType === "license" ? "Lisensi" : "Berlangganan"}
                            </Badge>
                            {c.transactionRef && <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{c.transactionRef}</div>}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400">{rupiah(c.grossAmount)}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400">{c.commissionRate}%</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">{rupiah(c.commissionAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-semibold flex items-center justify-center gap-1 ${statusCfg.color}`}>
                              <statusCfg.icon className="w-3 h-3" />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {c.status === "pending" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-blue-400 hover:text-blue-300 px-2"
                                  onClick={() => updateCommStatus.mutate({ id: c.id, status: "approved" })}
                                  data-testid={`approve-comm-${c.id}`}>Setujui</Button>
                              )}
                              {c.status === "approved" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 px-2"
                                  onClick={() => updateCommStatus.mutate({ id: c.id, status: "paid" })}
                                  data-testid={`pay-comm-${c.id}`}>Bayar</Button>
                              )}
                              {(c.status === "pending" || c.status === "approved") && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-400 hover:text-red-300 px-2"
                                  onClick={() => updateCommStatus.mutate({ id: c.id, status: "cancelled" })}
                                  data-testid={`cancel-comm-${c.id}`}>Batal</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Konfigurasi Rate ──────────────────────────────────────────── */}
        {activeTab === "rates" && (
          <div className="max-w-lg space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              Atur persentase komisi per level per jenis transaksi. Total komisi lisensi = L1+L2+L3, total berlangganan = L1+L2+L3.
            </div>
            {["license", "recurring"].map(type => (
              <div key={type} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
                  <span className="font-semibold text-sm text-white">
                    {type === "license" ? "💼 Komisi Lisensi (one-time)" : "🔄 Komisi Berlangganan (recurring)"}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(lvl => {
                    const rateRow = rates.find(r => r.mlmLevel === lvl && r.commissionType === type);
                    const cfg = LEVEL_CONFIG[lvl];
                    const [editVal, setEditVal] = useState(rateRow?.rate ?? 0);
                    const total = rates.filter(r => r.commissionType === type).reduce((s, r) => s + r.rate, 0);

                    return (
                      <div key={lvl} className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 w-36 shrink-0`}>
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Input type="number" min={0} max={50} step={0.5}
                            defaultValue={rateRow?.rate ?? 0}
                            onChange={e => setEditVal(Number(e.target.value))}
                            className="bg-slate-800 border-slate-600 text-white h-8 w-24"
                            data-testid={`input-rate-${type}-${lvl}`} />
                          <span className="text-slate-400 text-sm">%</span>
                          {rateRow && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-violet-400 hover:text-violet-300"
                              onClick={() => updateRate.mutate({ id: rateRow.id, rate: editVal })}
                              data-testid={`save-rate-${type}-${lvl}`}>
                              Simpan
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-500">Total komisi {type === "license" ? "lisensi" : "berlangganan"}:</span>
                    <span className="text-xs font-semibold text-white">
                      {rates.filter(r => r.commissionType === type).reduce((s, r) => s + r.rate, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AffiliateModal
        open={affModal.open} affiliates={affiliates} editing={affModal.editing}
        onClose={() => setAffModal({ open: false })}
        onSave={d => saveAffiliate.mutate(affModal.editing ? { ...d, id: affModal.editing.id } : d)}
      />
      <RecordCommissionModal
        open={commModal} affiliates={affiliates}
        onClose={() => setCommModal(false)}
        onSave={d => recordCommission.mutate(d)}
      />
    </div>
  );
}

// ─── Affiliate Row Component ──────────────────────────────────────────────────
function AffRow({ aff, copiedId, onCopy, onEdit, onDelete, commissions }: {
  aff: Affiliate; copiedId: number | null;
  onCopy: (a: Affiliate) => void; onEdit: () => void; onDelete: () => void;
  commissions: Commission[];
}) {
  const cfg = LEVEL_CONFIG[aff.mlmLevel] ?? LEVEL_CONFIG[3];
  const affComms = commissions.filter(c => c.affiliateId === aff.id);
  const pending = affComms.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/20 transition-colors">
      <div className="flex items-center gap-2 shrink-0">
        <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">{aff.name}</span>
          {!aff.isActive && <Badge className="text-[9px] bg-slate-800 text-slate-500 border-slate-700">Tidak Aktif</Badge>}
          {aff.region && <span className="text-[10px] text-slate-500">{aff.region}</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-[10px] text-slate-500">{aff.email}</span>
          {aff.phone && <span className="text-[10px] text-slate-600">{aff.phone}</span>}
          <span className="text-[10px] font-mono text-slate-600">Kode: {aff.code}</span>
          <span className="text-[10px] text-emerald-400/80">Total: {rupiah(aff.totalEarnings ?? 0)}</span>
          {pending > 0 && <span className="text-[10px] text-amber-400">Pending: {rupiah(pending)}</span>}
          <span className="text-[10px] text-slate-600">{aff.totalReferrals} referral</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onCopy(aff)} title="Copy referral link"
          className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          data-testid={`copy-link-${aff.id}`}>
          {copiedId === aff.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onEdit} className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          data-testid={`edit-aff-${aff.id}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors"
          data-testid={`delete-aff-${aff.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
