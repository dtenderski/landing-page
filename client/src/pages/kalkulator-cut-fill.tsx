import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers2, Plus, Trash2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const METODE = ["Metode Penampang (Cross Section)", "Metode Grid / Borrow Pit", "Prismatoid Sederhana"];
const JENIS_TANAH = [
  { label: "Tanah Biasa (Loam/Clay)", faktorSwell: 1.25, faktorShinkage: 0.9 },
  { label: "Tanah Pasir (Sandy)", faktorSwell: 1.12, faktorShinkage: 0.95 },
  { label: "Tanah Keras / Laterit", faktorSwell: 1.35, faktorShinkage: 0.85 },
  { label: "Batu Pecah / Rock", faktorSwell: 1.50, faktorShinkage: 0.75 },
  { label: "Tanah Organik / Gambut", faktorSwell: 1.20, faktorShinkage: 0.80 },
  { label: "Tanah Lempung Ekspansif", faktorSwell: 1.30, faktorShinkage: 0.88 },
];

interface Penampang {
  id: number;
  nama: string;
  jarakKePenampangBerikutnya: number;
  luas_cut: number;
  luas_fill: number;
}

interface HasilCutFill {
  totalCut: number;
  totalFill: number;
  selisih: number;
  rekomendasi: string;
  cutBankVolume: number;
  fillCompactedVolume: number;
  materialBuang: number;
  materialDatangkan: number;
  biayaEstimasi: { cut: number; fill: number; buang: number; datangkan: number; total: number };
}

let _id = 1;

export default function KalkulatorCutFill() {
  const [metode, setMetode] = useState(METODE[0]);
  const [jenisTanah, setJenisTanah] = useState(JENIS_TANAH[0].label);
  const [hargaCut, setHargaCut] = useState(45000);
  const [hargaFill, setHargaFill] = useState(55000);
  const [hargaBuang, setHargaBuang] = useState(80000);
  const [hargaDatangkan, setHargaDatangkan] = useState(120000);
  const [penampang, setPenampang] = useState<Penampang[]>([
    { id: _id++, nama: "STA 0+000", jarakKePenampangBerikutnya: 25, luas_cut: 12.5, luas_fill: 0 },
    { id: _id++, nama: "STA 0+025", jarakKePenampangBerikutnya: 25, luas_cut: 8.2, luas_fill: 3.1 },
    { id: _id++, nama: "STA 0+050", jarakKePenampangBerikutnya: 25, luas_cut: 0, luas_fill: 15.4 },
    { id: _id++, nama: "STA 0+075", jarakKePenampangBerikutnya: 0, luas_cut: 0, luas_fill: 10.2 },
  ]);
  const [hasil, setHasil] = useState<HasilCutFill | null>(null);

  const tanah = JENIS_TANAH.find(j => j.label === jenisTanah) ?? JENIS_TANAH[0];

  function update(id: number, field: keyof Penampang, val: string | number) {
    setPenampang(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  }

  function hitung() {
    let totalCut = 0, totalFill = 0;
    for (let i = 0; i < penampang.length - 1; i++) {
      const d = penampang[i].jarakKePenampangBerikutnya || 0;
      totalCut += ((penampang[i].luas_cut + penampang[i + 1].luas_cut) / 2) * d;
      totalFill += ((penampang[i].luas_fill + penampang[i + 1].luas_fill) / 2) * d;
    }
    const selisih = totalCut - totalFill;
    const cutBankVolume = totalCut;
    const fillCompactedVolume = totalFill / tanah.faktorShinkage;
    const rekomendasi = selisih > 0 ? `Material cut surplus ${selisih.toFixed(2)} m³ (bank) → perlu dibuang atau digunakan untuk timbunan lain` : selisih < 0 ? `Material fill kurang ${Math.abs(selisih).toFixed(2)} m³ → perlu mendatangkan material dari luar` : "Volume cut dan fill seimbang — tidak perlu membuang atau mendatangkan material";

    const biayaCut = totalCut * hargaCut;
    const biayaFill = totalFill * hargaFill;
    const materialBuang = selisih > 0 ? selisih * tanah.faktorSwell : 0;
    const materialDatangkan = selisih < 0 ? Math.abs(selisih) / tanah.faktorShinkage : 0;
    const biayaBuang = materialBuang * hargaBuang;
    const biayaDatangkan = materialDatangkan * hargaDatangkan;

    setHasil({
      totalCut, totalFill, selisih, rekomendasi, cutBankVolume, fillCompactedVolume,
      materialBuang, materialDatangkan,
      biayaEstimasi: { cut: biayaCut, fill: biayaFill, buang: biayaBuang, datangkan: biayaDatangkan, total: biayaCut + biayaFill + biayaBuang + biayaDatangkan }
    });
  }

  const idr = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
  const m3 = (n: number) => n.toFixed(2) + " m³";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Layers2 className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Cut & Fill — Volume Galian & Timbunan</h1>
              <p className="text-slate-400 text-sm">Metode penampang melintang (cross section) — hitung volume galian, timbunan, swell/shrinkage, dan biaya pekerjaan tanah</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 25</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Metode Hitung</label>
              <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                value={metode} onChange={e => setMetode(e.target.value)}>
                {METODE.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Jenis Tanah</label>
              <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                value={jenisTanah} onChange={e => setJenisTanah(e.target.value)}>
                {JENIS_TANAH.map(j => <option key={j.label} value={j.label}>{j.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 text-xs text-slate-400 flex items-end gap-4">
              <div>Swell factor: <span className="text-orange-300 font-bold">{tanah.faktorSwell}×</span></div>
              <div>Shrinkage factor: <span className="text-blue-300 font-bold">{tanah.faktorShinkage}×</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Harga Galian (Rp/m³)", val: hargaCut, set: setHargaCut },
              { label: "Harga Timbunan (Rp/m³)", val: hargaFill, set: setHargaFill },
              { label: "Harga Buang (Rp/m³)", val: hargaBuang, set: setHargaBuang },
              { label: "Harga Datangkan (Rp/m³)", val: hargaDatangkan, set: setHargaDatangkan },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <input type="number" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                  value={f.val} onChange={e => f.set(Number(e.target.value))} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-5 gap-2 px-4 text-xs text-slate-500">
            <span>Nama STA</span>
            <span>Jarak ke STA berikutnya (m)</span>
            <span>Luas Galian / Cut (m²)</span>
            <span>Luas Timbunan / Fill (m²)</span>
            <span></span>
          </div>
          {penampang.map((p, i) => (
            <div key={p.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
              <div className="grid grid-cols-5 gap-2 items-center">
                <input className="bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                  value={p.nama} onChange={e => update(p.id, "nama", e.target.value)} />
                <input type="number" step="0.5" className="bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                  value={p.jarakKePenampangBerikutnya} onChange={e => update(p.id, "jarakKePenampangBerikutnya", Number(e.target.value))}
                  disabled={i === penampang.length - 1} placeholder={i === penampang.length - 1 ? "—" : ""} />
                <input type="number" step="0.1" className="bg-slate-700/60 border border-red-500/30 rounded px-2 py-1.5 text-red-300 text-xs"
                  value={p.luas_cut} onChange={e => update(p.id, "luas_cut", Number(e.target.value))} />
                <input type="number" step="0.1" className="bg-slate-700/60 border border-blue-500/30 rounded px-2 py-1.5 text-blue-300 text-xs"
                  value={p.luas_fill} onChange={e => update(p.id, "luas_fill", Number(e.target.value))} />
                <button onClick={() => setPenampang(prev => prev.filter(x => x.id !== p.id))} className="text-red-400 hover:text-red-300 justify-self-center">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={() => setPenampang(prev => [...prev, { id: _id++, nama: `STA ${prev.length}+${String(prev.length * 25).padStart(3, "0")}`, jarakKePenampangBerikutnya: 25, luas_cut: 0, luas_fill: 0 }])}
            variant="outline" className="border-orange-600 text-orange-300 hover:bg-orange-900/30">
            <Plus className="h-4 w-4 mr-1" /> Tambah Penampang
          </Button>
          <Button onClick={hitung} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold">Hitung Volume Cut & Fill</Button>
          {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Galian (bank)", value: m3(hasil.totalCut), color: "text-red-300" },
                { label: "Total Timbunan (padat)", value: m3(hasil.fillCompactedVolume), color: "text-blue-300" },
                { label: hasil.selisih >= 0 ? "Material Dibuang (loose)" : "Material Didatangkan (bank)", value: m3(hasil.selisih >= 0 ? hasil.materialBuang : hasil.materialDatangkan), color: hasil.selisih >= 0 ? "text-orange-300" : "text-yellow-300" },
                { label: "Total Biaya Estimasi", value: idr(hasil.biayaEstimasi.total), color: "text-teal-300" },
              ].map(i => (
                <div key={i.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
                  <div className={`text-lg font-bold ${i.color} mb-0.5`}>{i.value}</div>
                  <div className="text-xs text-slate-400">{i.label}</div>
                </div>
              ))}
            </div>
            <div className={`rounded-xl p-4 border ${hasil.selisih > 0 ? "bg-orange-900/20 border-orange-500/30" : hasil.selisih < 0 ? "bg-blue-900/20 border-blue-500/30" : "bg-green-900/20 border-green-500/30"}`}>
              <div className="text-white font-medium text-sm mb-1">Rekomendasi Pekerjaan Tanah</div>
              <p className="text-slate-300 text-sm">{hasil.rekomendasi}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-slate-300 text-sm font-medium mb-3">Rincian Biaya Pekerjaan Tanah</div>
              <div className="space-y-1.5">
                {[
                  { label: "Pekerjaan Galian", vol: `${m3(hasil.totalCut)} × ${idr(hargaCut)}`, total: hasil.biayaEstimasi.cut },
                  { label: "Pekerjaan Timbunan", vol: `${m3(hasil.totalFill)} × ${idr(hargaFill)}`, total: hasil.biayaEstimasi.fill },
                  { label: "Pembuangan Material", vol: `${m3(hasil.materialBuang)} × ${idr(hargaBuang)}`, total: hasil.biayaEstimasi.buang },
                  { label: "Mendatangkan Material", vol: `${m3(hasil.materialDatangkan)} × ${idr(hargaDatangkan)}`, total: hasil.biayaEstimasi.datangkan },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{r.label} <span className="text-slate-600">({r.vol})</span></span>
                    <span className="text-white font-medium">{idr(r.total)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700/50 pt-2 flex justify-between font-bold">
                  <span className="text-slate-200">TOTAL</span>
                  <span className="text-teal-300">{idr(hasil.biayaEstimasi.total)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">* Volume menggunakan metode average end area (prismatoid). Swell = kondisi loose/diangkut. Shrinkage = kondisi setelah dipadatkan. Biaya bersifat estimasi, sesuaikan dengan AHSP/harga pasar setempat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
