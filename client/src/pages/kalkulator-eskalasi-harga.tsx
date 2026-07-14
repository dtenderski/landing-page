import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Info, Plus, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const MATERIAL_PRESETS: Record<string, { satuan: string; hargaDasar: number; indexAwal: number }> = {
  "Baja Tulangan (Rebar)": { satuan: "ton", hargaDasar: 9500000, indexAwal: 100 },
  "Baja Profil / WF": { satuan: "ton", hargaDasar: 11200000, indexAwal: 100 },
  "Semen (Portland)": { satuan: "zak 50kg", hargaDasar: 67000, indexAwal: 100 },
  "Pasir Beton": { satuan: "m³", hargaDasar: 320000, indexAwal: 100 },
  "Batu Split 2/3": { satuan: "m³", hargaDasar: 380000, indexAwal: 100 },
  "Bata Merah": { satuan: "ribu buah", hargaDasar: 950000, indexAwal: 100 },
  "Kayu Bekisting": { satuan: "m³", hargaDasar: 3400000, indexAwal: 100 },
  "Pipa PVC 4 inch": { satuan: "batang 4m", hargaDasar: 95000, indexAwal: 100 },
  "Kabel NYY 4x10mm²": { satuan: "meter", hargaDasar: 48000, indexAwal: 100 },
  "Solar / BBM": { satuan: "liter", hargaDasar: 6800, indexAwal: 100 },
  "Custom / Lainnya": { satuan: "unit", hargaDasar: 0, indexAwal: 100 },
};

interface Row {
  id: string; material: string; satuan: string;
  hargaDasar: number; volume: number;
  indexAwal: number; indexAkhir: number;
}

function calcEskalasi(r: Row) {
  const pct = r.indexAwal > 0 ? ((r.indexAkhir - r.indexAwal) / r.indexAwal) * 100 : 0;
  const hargaBaru = r.hargaDasar * (r.indexAkhir / r.indexAwal);
  const selisihSatuan = hargaBaru - r.hargaDasar;
  const totalDasar = r.hargaDasar * r.volume;
  const totalBaru = hargaBaru * r.volume;
  const eskalasiBruto = totalBaru - totalDasar;
  return { pct, hargaBaru, selisihSatuan, totalDasar, totalBaru, eskalasiBruto };
}

function fmt(n: number) { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); }
function fmtNum(n: number) { return n.toLocaleString("id-ID"); }

export default function KalkulatorEskalasiHarga() {
  const [rows, setRows] = useState<Row[]>([
    { id: "1", material: "Baja Tulangan (Rebar)", satuan: "ton", hargaDasar: 9500000, volume: 50, indexAwal: 100, indexAkhir: 115 },
    { id: "2", material: "Semen (Portland)", satuan: "zak 50kg", hargaDasar: 67000, volume: 2000, indexAwal: 100, indexAkhir: 108 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Row, "id">>({ material: "Baja Tulangan (Rebar)", satuan: "ton", hargaDasar: 9500000, volume: 0, indexAwal: 100, indexAkhir: 100 });
  const [klausulEskalasi, setKlausulEskalasi] = useState(75); // persen yang bisa diklaim

  function selectPreset(mat: string) {
    const p = MATERIAL_PRESETS[mat];
    if (p) setForm(f => ({ ...f, material: mat, satuan: p.satuan, hargaDasar: p.hargaDasar, indexAwal: p.indexAwal }));
    else setForm(f => ({ ...f, material: mat }));
  }

  function addRow() {
    if (!form.material || form.volume <= 0) return;
    setRows(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm({ material: "Baja Tulangan (Rebar)", satuan: "ton", hargaDasar: 9500000, volume: 0, indexAwal: 100, indexAkhir: 100 });
    setShowForm(false);
  }
  function removeRow(id: string) { setRows(prev => prev.filter(r => r.id !== id)); }
  function updateRow(id: string, field: keyof Row, val: any) { setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r)); }

  const results = rows.map(r => ({ ...r, ...calcEskalasi(r) }));
  const totalEskalasiBruto = results.reduce((acc, r) => acc + r.eskalasiBruto, 0);
  const totalEskalasiNetKlaim = totalEskalasiBruto * (klausulEskalasi / 100);
  const totalNilaiBaru = results.reduce((acc, r) => acc + r.totalBaru, 0);
  const totalNilaiDasar = results.reduce((acc, r) => acc + r.totalDasar, 0);

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" /> Kalkulator Eskalasi Harga Material
            </h1>
            <p className="text-xs text-slate-400">Hitung dampak kenaikan indeks harga terhadap nilai kontrak dan estimasi klaim CCO/addendum</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700 text-xs h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />Tambah
          </Button>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-300">Masukkan Indeks Harga Konstruksi (IHK/IHBK) dari BPS pada periode kontrak ditandatangani vs periode pelaksanaan. Klausul eskalasi mengacu pada Perpres 46/2025.</p>
        </div>

        {/* Klausul eskalasi */}
        <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-0.5">Klausul Eskalasi dalam Kontrak (%)</p>
            <p className="text-[10px] text-slate-600">Persentase selisih yang dapat diklaim (biasanya 75–90%)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setKlausulEskalasi(k => Math.max(0, k - 5))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">−</button>
            <span className="text-lg font-bold text-orange-400 w-12 text-center">{klausulEskalasi}%</span>
            <button onClick={() => setKlausulEskalasi(k => Math.min(100, k + 5))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">+</button>
          </div>
        </div>

        {/* Form tambah */}
        {showForm && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 mb-4 space-y-3">
            <p className="text-xs text-orange-400 font-semibold">Material Baru</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 block mb-1">Material *</label>
                <select value={form.material} onChange={e => selectPreset(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none">
                  {Object.keys(MATERIAL_PRESETS).map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Harga Dasar / {form.satuan}</label>
                <input type="number" value={form.hargaDasar} onChange={e => setForm(f => ({ ...f, hargaDasar: +e.target.value }))}
                  className="w-full rounded border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Volume ({form.satuan})</label>
                <input type="number" value={form.volume || ""} onChange={e => setForm(f => ({ ...f, volume: +e.target.value }))}
                  className="w-full rounded border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Indeks Awal (saat kontrak)</label>
                <input type="number" value={form.indexAwal} onChange={e => setForm(f => ({ ...f, indexAwal: +e.target.value }))}
                  className="w-full rounded border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Indeks Akhir (saat pelaksanaan)</label>
                <input type="number" value={form.indexAkhir} onChange={e => setForm(f => ({ ...f, indexAkhir: +e.target.value }))}
                  className="w-full rounded border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addRow} disabled={!form.material || form.volume <= 0} className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs h-8">Tambah</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="text-xs h-8">Batal</Button>
            </div>
          </div>
        )}

        {/* Summary top */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl border border-white/8 bg-white/2 p-3 text-center">
            <p className="text-[9px] text-slate-500">Nilai Dasar Total</p>
            <p className="text-xs font-bold text-white">{fmt(totalNilaiDasar)}</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${totalEskalasiBruto > 0 ? "border-orange-500/30 bg-orange-500/5" : "border-white/8 bg-white/2"}`}>
            <p className="text-[9px] text-slate-500">Eskalasi Bruto</p>
            <p className={`text-xs font-bold ${totalEskalasiBruto > 0 ? "text-orange-400" : "text-slate-300"}`}>{fmt(totalEskalasiBruto)}</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${totalEskalasiNetKlaim > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/8 bg-white/2"}`}>
            <p className="text-[9px] text-slate-500">Klaim Bersih ({klausulEskalasi}%)</p>
            <p className={`text-xs font-bold ${totalEskalasiNetKlaim > 0 ? "text-emerald-400" : "text-slate-300"}`}>{fmt(totalEskalasiNetKlaim)}</p>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-2 mb-4">
          {results.map(r => (
            <div key={r.id} className="rounded-xl border border-white/8 bg-white/2 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-white font-medium">{r.material}</p>
                  <p className="text-[10px] text-slate-500">{fmtNum(r.volume)} {r.satuan}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] border ${r.pct > 0 ? "text-orange-400 border-orange-400/30" : r.pct < 0 ? "text-emerald-400 border-emerald-400/30" : "text-slate-400 border-slate-600"}`}>{r.pct > 0 ? "+" : ""}{r.pct.toFixed(1)}%</Badge>
                  <button onClick={() => removeRow(r.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[["Indeks Awal", r.indexAwal, "indexAwal"], ["Indeks Akhir", r.indexAkhir, "indexAkhir"]].map(([label, val, field]) => (
                  <div key={field as string} className="col-span-2">
                    <p className="text-[9px] text-slate-500 mb-0.5">{label as string}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateRow(r.id, field as keyof Row, Math.max(1, (val as number) - 1))} className="w-5 h-5 rounded border border-white/10 text-slate-500 hover:text-white text-xs">−</button>
                      <span className="text-sm font-bold text-white flex-1 text-center">{val as number}</span>
                      <button onClick={() => updateRow(r.id, field as keyof Row, (val as number) + 1)} className="w-5 h-5 rounded border border-white/10 text-slate-500 hover:text-white text-xs">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div>
                  <p className="text-[9px] text-slate-500">Harga Dasar</p>
                  <p className="text-[10px] text-slate-300">{fmt(r.hargaDasar)}/{r.satuan}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500">Harga Baru</p>
                  <p className={`text-[10px] font-semibold ${r.pct > 0 ? "text-orange-400" : "text-emerald-400"}`}>{fmt(r.hargaBaru)}/{r.satuan}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500">Eskalasi Total</p>
                  <p className={`text-[10px] font-bold ${r.eskalasiBruto > 0 ? "text-orange-400" : "text-emerald-400"}`}>{fmt(r.eskalasiBruto)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center mb-4">
            <TrendingUp className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Belum ada material — tekan "+ Tambah"</p>
          </div>
        )}

        {totalEskalasiNetKlaim > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
            <p className="text-emerald-400 text-xs font-semibold mb-1">Rekomendasi Klaim</p>
            <p className="text-sm text-white">Ajukan addendum CCO sebesar <span className="text-emerald-400 font-bold">{fmt(totalEskalasiNetKlaim)}</span> berdasarkan klausul eskalasi {klausulEskalasi}% sesuai Perpres 46/2025 (klausul eskalasi harga).</p>
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 mb-3">
          <p className="text-[10px] text-slate-600">Data tidak tersimpan saat refresh. Indeks harga aktual tersedia di website BPS (bps.go.id) → Harga Konstruksi.</p>
        </div>
        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-xs">
          <Link href="/asisten-klaim-car">Asisten Klaim Asuransi CAR →</Link>
        </Button>
      </div>
    </div>
  );
}
