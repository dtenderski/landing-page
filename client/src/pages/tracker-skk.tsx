import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle,
  Clock, Edit3, Save, X, ExternalLink, BarChart2, Award,
  RefreshCw, ChevronRight, Info, Download, Upload, Briefcase
} from "lucide-react";
import { Link } from "wouter";

interface SKKEntry {
  id: string;
  jabatan: string;
  nomorSkk: string;
  tanggalTerbit: string;
  tanggalExpired: string;
  lsp: string;
  catatan: string;
}

const STORAGE_KEY = "gustafta_tracker_skk_v1";
const LSP_OPTIONS = [
  "LSP Konstruksi Indonesia (LSKI)",
  "LSP Jasa Konstruksi (LSP-JK)",
  "LSP K3 Konstruksi",
  "LSP BUMN Karya",
  "LSP P2 Kemenaker",
  "LSP Energi",
  "LSP Teknik Infrastruktur",
  "Lainnya",
];

function calcStatus(tanggalExpired: string): { status: "aktif" | "segera" | "mendesak" | "expired"; sisaHari: number } {
  const exp = new Date(tanggalExpired);
  const today = new Date();
  const diffMs = exp.getTime() - today.getTime();
  const sisaHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (sisaHari < 0) return { status: "expired", sisaHari };
  if (sisaHari < 60) return { status: "mendesak", sisaHari };
  if (sisaHari < 180) return { status: "segera", sisaHari };
  return { status: "aktif", sisaHari };
}

const STATUS_CONFIG = {
  aktif: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", badgeColor: "text-emerald-400 border-emerald-400/30", dot: "bg-emerald-500", label: "Aktif" },
  segera: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", badgeColor: "text-amber-400 border-amber-400/30", dot: "bg-amber-500", label: "Segera Perpanjang" },
  mendesak: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", badgeColor: "text-orange-400 border-orange-400/30", dot: "bg-orange-500 animate-pulse", label: "Mendesak!" },
  expired: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", badgeColor: "text-red-400 border-red-400/30", dot: "bg-red-500", label: "Expired" },
};

function calcExpiredFromTerbit(tanggalTerbit: string): string {
  if (!tanggalTerbit) return "";
  const d = new Date(tanggalTerbit);
  d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_ENTRY = (): SKKEntry => ({
  id: Date.now().toString(),
  jabatan: "", nomorSkk: "", tanggalTerbit: "", tanggalExpired: "", lsp: "", catatan: "",
});

export default function TrackerSKK() {
  const [entries, setEntries] = useState<SKKEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SKKEntry>(EMPTY_ENTRY());
  const [sortBy, setSortBy] = useState<"expired" | "jabatan" | "status">("status");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  function saveEntry() {
    if (!form.jabatan || !form.tanggalTerbit) return;
    const withExpired = { ...form, tanggalExpired: form.tanggalExpired || calcExpiredFromTerbit(form.tanggalTerbit) };
    if (editId) {
      setEntries(prev => prev.map(e => e.id === editId ? { ...withExpired, id: editId } : e));
      setEditId(null);
    } else {
      setEntries(prev => [...prev, { ...withExpired, id: Date.now().toString() }]);
    }
    setForm(EMPTY_ENTRY());
    setShowForm(false);
  }

  function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function editEntry(entry: SKKEntry) {
    setForm({ ...entry });
    setEditId(entry.id);
    setShowForm(true);
  }

  function exportData() {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `portofolio-skk-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) setEntries(data);
      } catch {}
    };
    reader.readAsText(file);
  }

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "expired") return a.tanggalExpired.localeCompare(b.tanggalExpired);
    if (sortBy === "jabatan") return a.jabatan.localeCompare(b.jabatan);
    const statusOrder = { expired: 0, mendesak: 1, segera: 2, aktif: 3 };
    return statusOrder[calcStatus(a.tanggalExpired).status] - statusOrder[calcStatus(b.tanggalExpired).status];
  });

  const summary = {
    total: entries.length,
    aktif: entries.filter(e => calcStatus(e.tanggalExpired).status === "aktif").length,
    segera: entries.filter(e => ["segera", "mendesak"].includes(calcStatus(e.tanggalExpired).status)).length,
    expired: entries.filter(e => calcStatus(e.tanggalExpired).status === "expired").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-teal-400" /> Tracker Portofolio SKK
              </h1>
              <p className="text-xs text-slate-400">Dashboard SKK Anda · tersimpan di browser</p>
            </div>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title="Import JSON">
              <Upload className="h-4 w-4" />
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
            {entries.length > 0 && (
              <button onClick={exportData} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title="Export JSON">
                <Download className="h-4 w-4" />
              </button>
            )}
            <Button onClick={() => { setForm(EMPTY_ENTRY()); setEditId(null); setShowForm(true); }}
              className="bg-teal-600 hover:bg-teal-700 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Tambah SKK
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {entries.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { val: summary.total, label: "Total SKK", color: "text-teal-400", icon: Award },
              { val: summary.aktif, label: "Aktif Aman", color: "text-emerald-400", icon: CheckCircle2 },
              { val: summary.segera, label: "Perlu Perhatian", color: "text-amber-400", icon: AlertTriangle },
              { val: summary.expired, label: "Expired", color: "text-red-400", icon: XCircle },
            ].map(({ val, label, color, icon: Icon }, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                <p className={`text-xl font-bold ${color}`}>{val}</p>
                <p className="text-slate-500 text-[10px] leading-tight">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-5 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-teal-300">{editId ? "Edit SKK" : "Tambah SKK Baru"}</p>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK *</label>
              <input value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                placeholder="cth: Ahli K3 Konstruksi — Madya"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nomor SKK</label>
                <input value={form.nomorSkk} onChange={e => setForm(f => ({ ...f, nomorSkk: e.target.value }))}
                  placeholder="1-xxx/SKK/BNSP/..."
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">LSP Penerbit</label>
                <select value={form.lsp} onChange={e => setForm(f => ({ ...f, lsp: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50">
                  <option value="">Pilih LSP...</option>
                  {LSP_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Tanggal Terbit *</label>
                <input type="date" value={form.tanggalTerbit}
                  onChange={e => setForm(f => ({ ...f, tanggalTerbit: e.target.value, tanggalExpired: calcExpiredFromTerbit(e.target.value) }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Tanggal Expired <span className="text-slate-600">(auto +3 thn)</span>
                </label>
                <input type="date" value={form.tanggalExpired}
                  onChange={e => setForm(f => ({ ...f, tanggalExpired: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Catatan</label>
              <input value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                placeholder="cth: sedang proses perpanjangan, butuh diklat refresher, dll."
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
            </div>

            <Button onClick={saveEntry} disabled={!form.jabatan || !form.tanggalTerbit}
              className="w-full bg-teal-600 hover:bg-teal-700 gap-2 text-sm">
              <Save className="h-4 w-4" /> {editId ? "Simpan Perubahan" : "Tambahkan ke Portofolio"}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && !showForm && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/2 p-10 text-center mb-5">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold mb-1">Portofolio SKK kosong</p>
            <p className="text-slate-500 text-sm mb-4">Tambahkan sertifikat SKK Anda untuk mulai melacak status dan tanggal expired</p>
            <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="h-4 w-4" /> Tambah SKK Pertama
            </Button>
          </div>
        )}

        {/* Sort Controls */}
        {entries.length > 1 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">Urutkan:</span>
            {[
              { val: "status", label: "Status" },
              { val: "expired", label: "Expired" },
              { val: "jabatan", label: "Jabatan" },
            ].map(s => (
              <button key={s.val} onClick={() => setSortBy(s.val as any)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${sortBy === s.val ? "bg-teal-600 border-teal-500 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* SKK Cards */}
        <div className="space-y-3">
          {sorted.map(entry => {
            const { status, sisaHari } = calcStatus(entry.tanggalExpired);
            const sc = STATUS_CONFIG[status];
            return (
              <div key={entry.id} className={`rounded-xl border p-4 ${sc.bg}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-white text-sm font-semibold truncate">{entry.jabatan}</p>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${sc.badgeColor}`}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 mt-1">
                        {entry.nomorSkk && <span>№ {entry.nomorSkk}</span>}
                        {entry.lsp && <span>· {entry.lsp}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div>
                          <p className="text-[10px] text-slate-500">Terbit</p>
                          <p className="text-xs text-slate-300">{formatDate(entry.tanggalTerbit)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Expired</p>
                          <p className={`text-xs font-medium ${sc.color}`}>{formatDate(entry.tanggalExpired)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">{sisaHari < 0 ? "Lewat" : "Sisa"}</p>
                          <p className={`text-xs font-bold ${sc.color}`}>{Math.abs(sisaHari)} hari</p>
                        </div>
                      </div>
                      {entry.catatan && (
                        <p className="text-xs text-slate-500 mt-2 italic">"{entry.catatan}"</p>
                      )}
                      {/* Progress bar */}
                      <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${status === "aktif" ? "bg-emerald-500" : status === "segera" ? "bg-amber-500" : status === "mendesak" ? "bg-orange-500" : "bg-red-500"}`}
                          style={{ width: `${Math.max(0, Math.min(100, (sisaHari / (3 * 365)) * 100))}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => editEntry(entry)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action buttons for expiring/expired */}
                {(status === "segera" || status === "mendesak" || status === "expired") && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <Link href={`/perpanjangan-skk`}>
                      <button className={`flex items-center gap-1.5 text-xs font-medium ${sc.color} hover:opacity-80 transition-opacity`}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        {status === "expired" ? "Lihat Cara Ajukan SKK Baru →" : "Panduan Perpanjangan →"}
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Footer */}
        {entries.length > 0 && (
          <div className="mt-5 rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Data tersimpan di browser Anda (localStorage). Gunakan tombol <strong className="text-slate-400">Export</strong> untuk backup file JSON, dan <strong className="text-slate-400">Import</strong> untuk restore di browser lain.
            </p>
          </div>
        )}

        {entries.length === 0 && (
          <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan semua SKK aktif Anda — tracker ini menghitung otomatis sisa hari berlaku (SKK BNSP berlaku 3 tahun) dan memberi peringatan 6 bulan sebelum expired.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
