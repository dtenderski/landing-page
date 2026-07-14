import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, DollarSign, Users, Calculator,
  ChevronRight, Info, RotateCcw, TrendingDown, Building2, X
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

// Estimasi biaya per jabatan (dalam juta Rp)
const BIAYA_ESTIMASI: Record<string, { min: number; max: number; diklat: number }> = {
  default: { min: 3.5, max: 7, diklat: 5 },
  "Ahli K3 Konstruksi — Muda": { min: 4, max: 8, diklat: 6 },
  "Ahli K3 Konstruksi — Madya": { min: 5, max: 9, diklat: 7 },
  "Ahli K3 Konstruksi — Utama": { min: 6, max: 12, diklat: 9 },
  "Ahli Manajemen Konstruksi — Madya": { min: 6, max: 11, diklat: 8 },
  "Ahli Manajemen Proyek — Madya": { min: 5.5, max: 10, diklat: 7 },
};

const JALUR_OPTIONS = ["Asesmen Langsung", "Portofolio / RPL", "Diklat + Asesmen"];
const BIAYA_JALUR_MULTIPLIER: Record<string, number> = {
  "Asesmen Langsung": 1, "Portofolio / RPL": 0.8, "Diklat + Asesmen": 1.8,
};

const STORAGE_KEY = "gustafta_biaya_skk_v1";

interface ItemTim {
  id: string; jabatan: string; jumlah: number; jalur: string; termasukDiklat: boolean;
}

export default function BiayaTimSKK() {
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [items, setItems] = useState<ItemTim[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ jabatan: "", jumlah: 1, jalur: "Asesmen Langsung", termasukDiklat: false });
  const [loaded, setLoaded] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const d = JSON.parse(s); setItems(d.items || []); setNamaPerusahaan(d.nama || ""); } } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, nama: namaPerusahaan })); }, [items, loaded, namaPerusahaan]);

  function getBiaya(jabatan: string, jalur: string, termasukDiklat: boolean) {
    const base = BIAYA_ESTIMASI[jabatan] ?? BIAYA_ESTIMASI.default;
    const mult = BIAYA_JALUR_MULTIPLIER[jalur] ?? 1;
    const diklatExtra = termasukDiklat && jalur !== "Diklat + Asesmen" ? base.diklat * 0.6 : 0;
    return {
      min: Math.round((base.min * mult + diklatExtra) * 10) / 10,
      max: Math.round((base.max * mult + diklatExtra) * 10) / 10,
    };
  }

  function getItemBiayaTotal(item: ItemTim) {
    const b = getBiaya(item.jabatan, item.jalur, item.termasukDiklat);
    return { min: b.min * item.jumlah, max: b.max * item.jumlah, perOrang: b };
  }

  function addItem() {
    if (!form.jabatan) return;
    setItems(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm({ jabatan: "", jumlah: 1, jalur: "Asesmen Langsung", termasukDiklat: false });
    setShowForm(false);
  }

  const totalMin = items.reduce((s, item) => s + getItemBiayaTotal(item).min, 0);
  const totalMax = items.reduce((s, item) => s + getItemBiayaTotal(item).max, 0);
  const totalOrang = items.reduce((s, i) => s + i.jumlah, 0);
  const rataPerOrang = totalOrang > 0 ? ((totalMin + totalMax) / 2 / totalOrang).toFixed(1) : "0";

  function formatRp(val: number) {
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(1)} M`;
    return `Rp ${val.toFixed(0)} juta`;
  }

  const JALUR_COLORS: Record<string, string> = {
    "Asesmen Langsung": "text-blue-400 border-blue-400/30",
    "Portofolio / RPL": "text-emerald-400 border-emerald-400/30",
    "Diklat + Asesmen": "text-amber-400 border-amber-400/30",
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" /> Kalkulator Biaya Tim SKK
              </h1>
              <p className="text-xs text-slate-400">Estimasi anggaran sertifikasi SKK untuk tim / perusahaan</p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={() => setItems([])} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nama perusahaan */}
        <div className="mb-4">
          <input value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)}
            placeholder="Nama perusahaan (opsional)"
            className="w-full rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/40" />
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">{namaPerusahaan || "Total Anggaran Sertifikasi"}</p>
                <p className="text-xl font-bold text-amber-400">
                  {items.length === 0 ? "Rp 0" : `${formatRp(totalMin)} – ${formatRp(totalMax)}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">{totalOrang} orang · {items.length} item</p>
              {totalOrang > 0 && <p className="text-xs text-amber-300">~{formatRp(parseFloat(rataPerOrang))}/orang</p>}
            </div>
          </div>
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-900/50 p-2 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5">Minimum</p>
                <p className="text-xs font-bold text-emerald-400">{formatRp(totalMin)}</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-2 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5">Rata-rata</p>
                <p className="text-xs font-bold text-amber-400">{formatRp((totalMin + totalMax) / 2)}</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-2 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5">Maksimum</p>
                <p className="text-xs font-bold text-red-400">{formatRp(totalMax)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Add Button */}
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 bg-amber-600 hover:bg-amber-700 gap-2">
          <Plus className="h-4 w-4" /> Tambah Jabatan SKK
        </Button>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-300">Tambah Item</p>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK</label>
              <select value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50">
                <option value="">Pilih jabatan...</option>
                {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jumlah Orang</label>
                <input type="number" min={1} max={50} value={form.jumlah}
                  onChange={e => setForm(f => ({ ...f, jumlah: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jalur Sertifikasi</label>
                <select value={form.jalur} onChange={e => setForm(f => ({ ...f, jalur: e.target.value, termasukDiklat: e.target.value === "Diklat + Asesmen" ? false : f.termasukDiklat }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50">
                  {JALUR_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>
            {form.jalur !== "Diklat + Asesmen" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.termasukDiklat} onChange={e => setForm(f => ({ ...f, termasukDiklat: e.target.checked }))}
                  className="rounded border-white/20 bg-slate-900 text-amber-500" />
                <span className="text-xs text-slate-300">Tambah estimasi biaya diklat persiapan</span>
              </label>
            )}
            {form.jabatan && (
              <div className="rounded-lg bg-slate-900/60 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Estimasi biaya:</span>
                <span className="text-xs font-bold text-amber-400">
                  {formatRp(getBiaya(form.jabatan, form.jalur, form.termasukDiklat).min * form.jumlah)} – {formatRp(getBiaya(form.jabatan, form.jalur, form.termasukDiklat).max * form.jumlah)}
                </span>
              </div>
            )}
            <Button onClick={addItem} disabled={!form.jabatan} className="w-full bg-amber-600 hover:bg-amber-700 gap-2 text-sm">
              <Plus className="h-4 w-4" /> Tambahkan
            </Button>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !showForm && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
            <p className="text-slate-400 text-sm mb-1">Belum ada item</p>
            <p className="text-slate-600 text-xs">Tambahkan jabatan SKK yang ingin disertifikasi untuk menghitung estimasi biaya</p>
          </div>
        )}

        {/* Item List */}
        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            <button onClick={() => setShowBreakdown(!showBreakdown)} className="text-xs text-slate-400 flex items-center gap-1 hover:text-white transition-colors">
              {showBreakdown ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} Rincian per Jabatan
            </button>
            {showBreakdown && items.map(item => {
              const { min, max, perOrang } = getItemBiayaTotal(item);
              const persen = totalMax > 0 ? Math.round((max / totalMax) * 100) : 0;
              return (
                <div key={item.id} className="rounded-xl border border-white/8 bg-white/2 p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{item.jabatan}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{item.jumlah} orang</span>
                        <Badge variant="outline" className={`text-[9px] ${JALUR_COLORS[item.jalur] || "text-slate-400 border-slate-600"}`}>{item.jalur}</Badge>
                        {item.termasukDiklat && <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">+diklat</Badge>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-amber-400">{formatRp(min)}–{formatRp(max)}</p>
                      <p className="text-[10px] text-slate-500">{formatRp(perOrang.min)}–{formatRp(perOrang.max)}/org</p>
                    </div>
                    <button onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))} className="p-1 text-slate-600 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${persen}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips Hemat */}
        {items.length >= 2 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
            <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5" /> Tips Hemat Biaya</p>
            <ul className="space-y-1.5">
              <li className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />Daftar secara kolektif ke LSP — biasanya ada diskon 10–20% untuk grup 3+ peserta</li>
              <li className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />Karyawan dengan pengalaman 5+ tahun cocok jalur Portofolio/RPL — hemat hingga 20% vs asesmen langsung</li>
              {items.some(i => !i.termasukDiklat && i.jalur === "Asesmen Langsung") && (
                <li className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />Pertimbangkan diklat in-house untuk jabatan yang banyak — lebih hemat dari diklat individu</li>
              )}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-white/2 p-3 flex items-start gap-2 mb-4">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">Estimasi biaya berdasarkan rata-rata pasar 2024–2025. Biaya aktual bervariasi tergantung LSP, lokasi, dan negosiasi kolektif. Data tersimpan di browser. Tidak termasuk biaya transportasi, akomodasi, dan dokumen.</p>
        </div>

        {items.length > 0 && (
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/planner-skk-bujk">Planner BUJK →</Link>
            </Button>
            <Button asChild className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs">
              <Link href="/jalur-sertifikasi">Roadmap Karir →</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
