import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Clock,
  TrendingUp, Target, Info, BarChart3, RefreshCw
} from "lucide-react";
import { Link } from "wouter";

const KATEGORI_CPD = [
  { nama: "Seminar / Webinar / Workshop", satuan: "jam", icon: "🎤" },
  { nama: "Pelatihan Teknis Bersertifikat", satuan: "jam", icon: "📋" },
  { nama: "Menulis Artikel / Makalah Ilmiah", satuan: "artikel", icon: "✍️" },
  { nama: "Menjadi Narasumber / Fasilitator", satuan: "jam", icon: "🎙️" },
  { nama: "Studi Banding / Kunjungan Teknis", satuan: "hari", icon: "🏗️" },
  { nama: "Keanggotaan Aktif Asosiasi Profesi", satuan: "tahun", icon: "🏛️" },
  { nama: "Proyek sebagai Tenaga Ahli", satuan: "bulan", icon: "👷" },
  { nama: "Kursus Online Bersertifikat", satuan: "jam", icon: "💻" },
  { nama: "Penelitian / R&D", satuan: "bulan", icon: "🔬" },
];

// Nilai poin CPD per satuan (estimasi LPJK)
const POIN_PER_SATUAN: Record<string, number> = {
  "Seminar / Webinar / Workshop": 1,
  "Pelatihan Teknis Bersertifikat": 2,
  "Menulis Artikel / Makalah Ilmiah": 5,
  "Menjadi Narasumber / Fasilitator": 3,
  "Studi Banding / Kunjungan Teknis": 2,
  "Keanggotaan Aktif Asosiasi Profesi": 3,
  "Proyek sebagai Tenaga Ahli": 4,
  "Kursus Online Bersertifikat": 1,
  "Penelitian / R&D": 5,
};

const TARGET_CPD_3_TAHUN = 40; // poin minimum untuk perpanjangan SKK

interface AktivitasCPD {
  id: string;
  kategori: string;
  nama: string;
  tanggal: string;
  jumlah: number;
  keterangan: string;
}

const STORAGE_KEY = "gustafta_tracker_cpd_v1";

export default function TrackerCPDMandiri() {
  const [aktivitasList, setAktivitasList] = useState<AktivitasCPD[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kategori: KATEGORI_CPD[0].nama, nama: "", tanggal: "", jumlah: 1, keterangan: "" });
  const [filterKategori, setFilterKategori] = useState("Semua");

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(aktivitasList)); }, [aktivitasList]);

  function getSatuan(kategori: string) { return KATEGORI_CPD.find(k => k.nama === kategori)?.satuan ?? "jam"; }
  function getIcon(kategori: string) { return KATEGORI_CPD.find(k => k.nama === kategori)?.icon ?? "📌"; }
  function getPoin(kategori: string, jumlah: number) { return (POIN_PER_SATUAN[kategori] ?? 1) * jumlah; }

  function addAktivitas() {
    if (!form.nama || !form.tanggal) return;
    setAktivitasList(prev => [...prev, { id: Date.now().toString(), ...form }]);
    setForm({ kategori: KATEGORI_CPD[0].nama, nama: "", tanggal: "", jumlah: 1, keterangan: "" });
    setShowForm(false);
  }
  function removeAktivitas(id: string) { setAktivitasList(prev => prev.filter(a => a.id !== id)); }

  const totalPoin = aktivitasList.reduce((acc, a) => acc + getPoin(a.kategori, a.jumlah), 0);
  const pct = Math.min(100, Math.round((totalPoin / TARGET_CPD_3_TAHUN) * 100));
  const pctColor = pct >= 100 ? "text-emerald-400" : pct >= 60 ? "text-blue-400" : pct >= 30 ? "text-amber-400" : "text-red-400";
  const barColor = pct >= 100 ? "bg-emerald-400" : pct >= 60 ? "bg-blue-400" : pct >= 30 ? "bg-amber-400" : "bg-red-400";

  // Breakdown per kategori
  const breakdown = KATEGORI_CPD.map(k => ({
    ...k,
    total: aktivitasList.filter(a => a.kategori === k.nama).reduce((acc, a) => acc + getPoin(k.nama, a.jumlah), 0),
    count: aktivitasList.filter(a => a.kategori === k.nama).length,
  })).filter(k => k.total > 0).sort((a, b) => b.total - a.total);

  const filtered = filterKategori === "Semua" ? aktivitasList : aktivitasList.filter(a => a.kategori === filterKategori);

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" /> Tracker CPD Mandiri SKK
            </h1>
            <p className="text-xs text-slate-400">Catat aktivitas CPD, hitung poin, pantau progres menuju perpanjangan SKK</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-violet-600 hover:bg-violet-700 text-xs h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />Tambah
          </Button>
        </div>

        {/* Progress */}
        <div className={`rounded-2xl border p-5 mb-4 ${pct >= 100 ? "border-emerald-500/30 bg-emerald-500/5" : "border-violet-500/20 bg-violet-500/5"}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-slate-400">Progres CPD (target 3 tahun)</p>
              <p className={`text-2xl font-bold ${pctColor}`}>{totalPoin} <span className="text-sm text-slate-500">/ {TARGET_CPD_3_TAHUN} poin</span></p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${pctColor}`}>{pct}%</p>
              {pct >= 100 ? <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">Siap Perpanjang SKK ✓</Badge>
                : <p className="text-xs text-slate-500">{TARGET_CPD_3_TAHUN - totalPoin} poin lagi</p>}
            </div>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Form tambah */}
        {showForm && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4 space-y-3">
            <p className="text-xs text-violet-400 font-semibold">Tambah Aktivitas CPD</p>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Kategori</label>
              <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none">
                {KATEGORI_CPD.map(k => <option key={k.nama} value={k.nama}>{k.icon} {k.nama}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Nama Kegiatan *</label>
                <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  placeholder="cth: Webinar K3 Konstruksi 2024"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tanggal *</label>
                <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Jumlah ({getSatuan(form.kategori)})</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(f => ({ ...f, jumlah: Math.max(1, f.jumlah - 1) }))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">−</button>
                  <span className="flex-1 text-center text-sm text-white font-medium">{form.jumlah}</span>
                  <button onClick={() => setForm(f => ({ ...f, jumlah: f.jumlah + 1 }))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">+</button>
                </div>
                <p className="text-[9px] text-violet-400 text-center mt-0.5">= {getPoin(form.kategori, form.jumlah)} poin</p>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Keterangan</label>
                <input value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  placeholder="No. sertifikat, penyelenggara, dll"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addAktivitas} disabled={!form.nama || !form.tanggal} className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs h-8">Simpan</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="text-xs h-8">Batal</Button>
            </div>
          </div>
        )}

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
            <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-violet-400" /> Poin per Kategori</p>
            <div className="space-y-2">
              {breakdown.map((k, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-5">{k.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-slate-400">{k.nama}</span>
                      <span className="text-[10px] text-violet-400 font-medium">{k.total} poin ({k.count}x)</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: `${Math.min(100, (k.total / 10) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter + list */}
        {aktivitasList.length > 0 && (
          <>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {["Semua", ...KATEGORI_CPD.filter(k => aktivitasList.some(a => a.kategori === k.nama)).map(k => k.nama)].map(k => (
                <button key={k} onClick={() => setFilterKategori(k)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] transition-all ${filterKategori === k ? "bg-violet-500/20 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                  {k === "Semua" ? "Semua" : KATEGORI_CPD.find(x => x.nama === k)?.icon + " " + k.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filtered.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map(a => (
                <div key={a.id} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">{getIcon(a.kategori)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{a.nama}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-500">{a.tanggal}</span>
                      <span className="text-[10px] text-slate-500">{a.jumlah} {getSatuan(a.kategori)}</span>
                      {a.keterangan && <span className="text-[10px] text-slate-600">{a.keterangan}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-400/30">{getPoin(a.kategori, a.jumlah)} poin</Badge>
                    <button onClick={() => removeAktivitas(a.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {aktivitasList.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
            <TrendingUp className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 text-sm mb-1">Belum ada aktivitas CPD yang dicatat</p>
            <p className="text-xs text-slate-600">Tekan "+ Tambah" untuk mencatat kegiatan CPD pertama</p>
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 mt-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600">Data tersimpan di browser (localStorage). Untuk kebutuhan resmi, catat CPD sesuai petunjuk LSP atau sistem LPJK.</p>
        </div>

        <Button asChild className="w-full mt-3 bg-violet-600 hover:bg-violet-700 text-xs">
          <Link href="/kalkulator-cpd">Kalkulator CPD Resmi →</Link>
        </Button>
      </div>
    </div>
  );
}
