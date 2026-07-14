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
  ArrowLeft, Trophy, TrendingUp, FileSearch, Building2, Plus,
  Pencil, Trash2, ChevronRight, Target, Calendar, MapPin,
  Banknote, Search, Filter, AlertCircle, CheckCircle2,
  XCircle, Clock, Loader2, BarChart3, Briefcase,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BjClient {
  id: number;
  companyName: string;
  picName: string;
}

interface BjTender {
  id: number;
  clientId: number | null;
  tenderName: string;
  instansi: string;
  paguAnggaran: string;
  lokasi: string;
  kategori: string;
  metodePengadaan: string;
  tanggalTender: string;
  deadlinePenawaran: string;
  status: string;
  nilaiKontrak: string;
  sumberInfo: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  teridentifikasi: {
    label: "Teridentifikasi", color: "text-sky-400", bg: "bg-sky-500/10",
    border: "border-sky-500/30", dot: "bg-sky-500",
    icon: <FileSearch className="w-3.5 h-3.5" />,
  },
  kualifikasi: {
    label: "Kualifikasi", color: "text-indigo-400", bg: "bg-indigo-500/10",
    border: "border-indigo-500/30", dot: "bg-indigo-500",
    icon: <Filter className="w-3.5 h-3.5" />,
  },
  penawaran: {
    label: "Penawaran", color: "text-orange-400", bg: "bg-orange-500/10",
    border: "border-orange-500/30", dot: "bg-orange-500",
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  evaluasi: {
    label: "Evaluasi", color: "text-yellow-400", bg: "bg-yellow-500/10",
    border: "border-yellow-500/30", dot: "bg-yellow-500",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  menang: {
    label: "Menang ✓", color: "text-emerald-400", bg: "bg-emerald-500/10",
    border: "border-emerald-500/30", dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  kalah: {
    label: "Kalah", color: "text-red-400", bg: "bg-red-500/10",
    border: "border-red-500/30", dot: "bg-red-500",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  gugur: {
    label: "Gugur", color: "text-slate-400", bg: "bg-slate-500/10",
    border: "border-slate-500/30", dot: "bg-slate-500",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

const KATEGORI_OPTIONS = [
  "Konstruksi Gedung", "Konstruksi Sipil", "Konstruksi MEP",
  "Konsultansi Konstruksi", "Konsultansi Manajemen",
  "Pengadaan Barang", "Jasa Lainnya",
];

const METODE_OPTIONS = [
  "Tender Umum (LPSE)", "Seleksi Umum (Konsultansi)", "Penunjukan Langsung",
  "Pengadaan Langsung", "Sayembara", "Lelang Cepat",
];

const SUMBER_OPTIONS = ["SIRUP LKPP", "LPSE Pusat", "LPSE Daerah", "Referral Klien", "Jaringan Internal", "Lainnya"];

const ALL_STATUS = ["semua", ...Object.keys(STATUS_CONFIG)];

function formatRupiah(val: string): string {
  if (!val) return "-";
  const num = Number(val.replace(/\D/g, ""));
  if (isNaN(num) || num === 0) return val;
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(0)} jt`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

// ─── Tender Modal ─────────────────────────────────────────────────────────────
function TenderModal({ open, onClose, initial, clients, onSave }: {
  open: boolean; onClose: () => void;
  initial?: BjTender | null; clients: BjClient[];
  onSave: (data: Partial<BjTender>) => void;
}) {
  const [form, setForm] = useState({
    tenderName: initial?.tenderName ?? "",
    clientId: initial?.clientId ? String(initial.clientId) : "",
    instansi: initial?.instansi ?? "",
    paguAnggaran: initial?.paguAnggaran ?? "",
    lokasi: initial?.lokasi ?? "",
    kategori: initial?.kategori ?? "",
    metodePengadaan: initial?.metodePengadaan ?? "",
    tanggalTender: initial?.tanggalTender ?? "",
    deadlinePenawaran: initial?.deadlinePenawaran ?? "",
    status: initial?.status ?? "teridentifikasi",
    nilaiKontrak: initial?.nilaiKontrak ?? "",
    sumberInfo: initial?.sumberInfo ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{initial ? "Edit Tender" : "Tambah Tender Baru"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-slate-300 text-xs mb-1">Nama Paket Tender *</Label>
            <Input value={form.tenderName} onChange={e => set("tenderName", e.target.value)}
              placeholder="Pekerjaan Pembangunan Gedung Kantor BPPRD..." className="bg-slate-800 border-slate-600 text-white" data-testid="input-tender-name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Klien BUJK (opsional)</Label>
              <Select value={form.clientId} onValueChange={v => set("clientId", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-tender-client">
                  <SelectValue placeholder="Pilih klien..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="none" className="text-white hover:bg-slate-700">— Tanpa klien —</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-white hover:bg-slate-700">{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-tender-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white hover:bg-slate-700">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs mb-1">Nama Instansi / Owner *</Label>
            <Input value={form.instansi} onChange={e => set("instansi", e.target.value)}
              placeholder="Dinas PU Provinsi DKI Jakarta / BPSDM Kemenkumham..." className="bg-slate-800 border-slate-600 text-white" data-testid="input-instansi" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Kategori</Label>
              <Select value={form.kategori} onValueChange={v => set("kategori", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-kategori">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {KATEGORI_OPTIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-white hover:bg-slate-700">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Metode Pengadaan</Label>
              <Select value={form.metodePengadaan} onValueChange={v => set("metodePengadaan", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-metode">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {METODE_OPTIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-white hover:bg-slate-700">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Pagu Anggaran (Rp)</Label>
              <Input value={form.paguAnggaran} onChange={e => set("paguAnggaran", e.target.value)}
                placeholder="5000000000" className="bg-slate-800 border-slate-600 text-white" data-testid="input-pagu" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Lokasi</Label>
              <Input value={form.lokasi} onChange={e => set("lokasi", e.target.value)}
                placeholder="Jakarta / Jawa Barat" className="bg-slate-800 border-slate-600 text-white" data-testid="input-lokasi" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Tanggal Tender</Label>
              <Input type="date" value={form.tanggalTender} onChange={e => set("tanggalTender", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-tanggal-tender" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Deadline Penawaran</Label>
              <Input type="date" value={form.deadlinePenawaran} onChange={e => set("deadlinePenawaran", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-deadline" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Sumber Informasi</Label>
              <Select value={form.sumberInfo} onValueChange={v => set("sumberInfo", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-sumber">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {SUMBER_OPTIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-white hover:bg-slate-700">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Nilai Kontrak (jika menang)</Label>
              <Input value={form.nilaiKontrak} onChange={e => set("nilaiKontrak", e.target.value)}
                placeholder="4800000000" className="bg-slate-800 border-slate-600 text-white" data-testid="input-nilai-kontrak" />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs mb-1">Catatan / Strategi</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Catatan internal, strategi penawaran, kompetitor, dll..." rows={2}
              className="bg-slate-800 border-slate-600 text-white resize-none" data-testid="input-tender-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400" data-testid="button-cancel-tender">Batal</Button>
          <Button
            onClick={() => {
              if (!form.tenderName.trim()) return;
              const clientId = form.clientId && form.clientId !== "none" ? Number(form.clientId) : null;
              onSave({ ...form, clientId });
              onClose();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            data-testid="button-save-tender"
            disabled={!form.tenderName.trim()}
          >
            {initial ? "Simpan Perubahan" : "Tambah Tender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenderMate() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("semua");
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing?: BjTender | null }>({ open: false });

  const { data: clients = [] } = useQuery<BjClient[]>({ queryKey: ["/api/cert-tracker/clients"] });
  const { data: tenders = [], isLoading } = useQuery<BjTender[]>({ queryKey: ["/api/tender-mate/tenders"] });

  // ── Computed stats
  const stats = useMemo(() => {
    const active = tenders.filter(t => !["menang", "kalah", "gugur"].includes(t.status));
    const won = tenders.filter(t => t.status === "menang");
    const finished = tenders.filter(t => ["menang", "kalah", "gugur"].includes(t.status));
    const winRate = finished.length > 0 ? Math.round((won.length / finished.length) * 100) : 0;
    const totalNilai = won.reduce((sum, t) => {
      const v = Number((t.nilaiKontrak || t.paguAnggaran || "0").replace(/\D/g, ""));
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    return { total: tenders.length, active: active.length, won: won.length, winRate, totalNilai };
  }, [tenders]);

  // ── Filtered tenders
  const filtered = useMemo(() => {
    return tenders.filter(t => {
      if (statusFilter !== "semua" && t.status !== statusFilter) return false;
      if (clientFilter !== null && t.clientId !== clientFilter) return false;
      if (search && !t.tenderName.toLowerCase().includes(search.toLowerCase()) &&
          !t.instansi.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const order = ["teridentifikasi", "kualifikasi", "penawaran", "evaluasi", "menang", "kalah", "gugur"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  }, [tenders, statusFilter, clientFilter, search]);

  // ── Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { semua: tenders.length };
    Object.keys(STATUS_CONFIG).forEach(s => {
      counts[s] = tenders.filter(t => t.status === s).length;
    });
    return counts;
  }, [tenders]);

  // ── Mutations
  const saveTender = useMutation({
    mutationFn: (data: { id?: number } & Partial<BjTender>) =>
      data.id
        ? apiRequest("PUT", `/api/tender-mate/tenders/${data.id}`, data)
        : apiRequest("POST", "/api/tender-mate/tenders", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/tender-mate/tenders"] }); toast({ title: "Tender disimpan" }); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const deleteTender = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tender-mate/tenders/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/tender-mate/tenders"] }); toast({ title: "Tender dihapus" }); },
  });

  const clientMap = useMemo(() => {
    const m: Record<number, string> = {};
    clients.forEach(c => { m[c.id] = c.companyName; });
    return m;
  }, [clients]);

  const formatNilai = (n: number) => {
    if (n >= 1_000_000_000_000) return `Rp ${(n / 1_000_000_000_000).toFixed(1)} T`;
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)} jt`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  };

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
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-sm">TenderMate — Pipeline Tender</span>
            </div>
          </div>
          <Button
            onClick={() => setModal({ open: true })}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs gap-1.5"
            data-testid="button-add-tender-header"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Tender
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: BarChart3, label: "Total Tender", value: stats.total, sub: "Semua pipeline", color: "indigo" },
            { icon: TrendingUp, label: "Tender Aktif", value: stats.active, sub: "Dalam proses", color: "orange" },
            { icon: Trophy, label: "Win Rate", value: `${stats.winRate}%`, sub: `${stats.won} menang`, color: "emerald" },
            { icon: Banknote, label: "Total Nilai Kontrak", value: stats.totalNilai > 0 ? formatNilai(stats.totalNilai) : "—", sub: "Dari tender menang", color: "emerald" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 bg-slate-900/60
              ${s.color === "indigo" ? "border-indigo-800/40" : s.color === "orange" ? "border-orange-800/40" : "border-emerald-800/40"}`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color === "indigo" ? "text-indigo-400" : s.color === "orange" ? "text-orange-400" : "text-emerald-400"}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color === "indigo" ? "text-indigo-400" : s.color === "orange" ? "text-orange-400" : "text-emerald-400"}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Pipeline Status</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? "semua" : key)}
                  data-testid={`filter-status-${key}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                    ${statusFilter === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-400"}`}
                >
                  {cfg.icon}
                  {cfg.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${statusFilter === key ? cfg.bg : "bg-slate-800"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
            {statusFilter !== "semua" && (
              <button onClick={() => setStatusFilter("semua")} className="text-xs text-slate-600 hover:text-slate-400 ml-1">× Semua</button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* LEFT — Client Filter */}
          <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-3 h-fit">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">Filter Klien</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setClientFilter(null)}
                data-testid="filter-client-all"
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                  ${clientFilter === null ? "bg-indigo-900/30 text-indigo-300 border border-indigo-700/40" : "text-slate-400 hover:bg-slate-800/60"}`}
              >
                <span>Semua Klien</span>
                <span className="text-[10px] opacity-60">{tenders.length}</span>
              </button>
              {clients.map(c => {
                const count = tenders.filter(t => t.clientId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setClientFilter(clientFilter === c.id ? null : c.id)}
                    data-testid={`filter-client-${c.id}`}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                      ${clientFilter === c.id ? "bg-indigo-900/30 text-indigo-300 border border-indigo-700/40" : "text-slate-400 hover:bg-slate-800/60"}`}
                  >
                    <span className="truncate pr-2">{c.companyName}</span>
                    <span className="text-[10px] opacity-60 shrink-0">{count}</span>
                  </button>
                );
              })}
              {tenders.filter(t => !t.clientId).length > 0 && (
                <button
                  onClick={() => setClientFilter(-1)}
                  data-testid="filter-client-none"
                  className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                    ${clientFilter === -1 ? "bg-indigo-900/30 text-indigo-300 border border-indigo-700/40" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <span className="italic">Tanpa klien</span>
                  <span className="text-[10px] opacity-60">{tenders.filter(t => !t.clientId).length}</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Tender List */}
          <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200 flex-1">
                Tender
                {statusFilter !== "semua" && <span className="text-slate-500 font-normal ml-1">— {STATUS_CONFIG[statusFilter]?.label}</span>}
                {clientFilter !== null && clientFilter !== -1 && <span className="text-slate-500 font-normal ml-1">— {clientMap[clientFilter]}</span>}
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <Input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Cari paket tender..."
                    className="bg-slate-800/60 border-slate-700 text-white text-xs h-7 pl-7 w-48"
                    data-testid="input-search-tender"
                  />
                </div>
                <Button onClick={() => setModal({ open: true })}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 text-xs gap-1 shrink-0"
                  data-testid="button-add-tender">
                  <Plus className="w-3 h-3" /> Tambah
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <div className="text-sm font-medium text-slate-400 mb-1">
                    {tenders.length === 0 ? "Belum ada tender" : "Tidak ada hasil filter"}
                  </div>
                  {tenders.length === 0 && (
                    <div className="text-xs text-slate-600">Klik + Tambah Tender untuk mulai tracking pipeline</div>
                  )}
                </div>
              ) : filtered.map(tender => {
                const cfg = STATUS_CONFIG[tender.status];
                const clientName = tender.clientId ? clientMap[tender.clientId] : null;
                const daysLeft = tender.deadlinePenawaran
                  ? Math.round((new Date(tender.deadlinePenawaran).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <div key={tender.id} className="rounded-lg border border-slate-700/50 bg-slate-800/30 hover:border-slate-600/60 transition-colors p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-start gap-2 flex-wrap mb-1.5">
                          <span className="font-semibold text-sm text-white leading-tight flex-1 min-w-0">{tender.tenderName}</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          {tender.instansi && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-600" /> {tender.instansi}
                            </span>
                          )}
                          {tender.lokasi && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-600" /> {tender.lokasi}
                            </span>
                          )}
                          {tender.paguAnggaran && (
                            <span className="flex items-center gap-1 text-amber-400/80">
                              <Banknote className="w-3 h-3" /> {formatRupiah(tender.paguAnggaran)}
                            </span>
                          )}
                          {clientName && (
                            <span className="flex items-center gap-1 text-indigo-400/70">
                              <Briefcase className="w-3 h-3" /> {clientName}
                            </span>
                          )}
                        </div>

                        {/* Deadline / extra */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                          {tender.deadlinePenawaran && (
                            <span className={`flex items-center gap-1 ${daysLeft !== null && daysLeft < 0 ? "text-red-400" : daysLeft !== null && daysLeft <= 7 ? "text-orange-400" : "text-slate-500"}`}>
                              <Calendar className="w-3 h-3" />
                              Deadline: {tender.deadlinePenawaran}
                              {daysLeft !== null && daysLeft >= 0 && <span className="ml-0.5">({daysLeft}h lagi)</span>}
                              {daysLeft !== null && daysLeft < 0 && <span className="ml-0.5">(lewat)</span>}
                            </span>
                          )}
                          {tender.kategori && <span className="text-slate-600">{tender.kategori}</span>}
                          {tender.metodePengadaan && <span className="text-slate-600">{tender.metodePengadaan}</span>}
                          {tender.sumberInfo && <span className="text-slate-600">via {tender.sumberInfo}</span>}
                          {tender.nilaiKontrak && tender.status === "menang" && (
                            <span className="text-emerald-400 font-medium">Kontrak: {formatRupiah(tender.nilaiKontrak)}</span>
                          )}
                        </div>

                        {tender.notes && (
                          <div className="text-[11px] text-slate-500 mt-1.5 italic leading-relaxed">📝 {tender.notes}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={() => setModal({ open: true, editing: tender })}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                          data-testid={`button-edit-tender-${tender.id}`}
                        ><Pencil className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => { if (confirm(`Hapus tender "${tender.tenderName}"?`)) deleteTender.mutate(tender.id); }}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/30"
                          data-testid={`button-delete-tender-${tender.id}`}
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length > 0 && (
              <div className="p-2 border-t border-slate-800 text-xs text-slate-600 text-center">
                Menampilkan {filtered.length} dari {tenders.length} tender
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <TenderModal
        open={modal.open}
        initial={modal.editing}
        clients={clients}
        onClose={() => setModal({ open: false })}
        onSave={data => saveTender.mutate(modal.editing ? { ...data, id: modal.editing.id } : data)}
      />
    </div>
  );
}
