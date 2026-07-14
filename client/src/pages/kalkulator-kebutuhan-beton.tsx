import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cylinder, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

const JENIS_ELEMEN = [
  { label: "Kolom", faktor: 1.05 },
  { label: "Balok", faktor: 1.05 },
  { label: "Pelat Lantai", faktor: 1.04 },
  { label: "Pondasi Telapak", faktor: 1.06 },
  { label: "Pondasi Tiang Bored Pile", faktor: 1.08 },
  { label: "Dinding Beton", faktor: 1.05 },
  { label: "Tangga", faktor: 1.06 },
  { label: "Sloof", faktor: 1.05 },
];

const MUTU_BETON = [
  { label: "K-175 (fc' 14.5 MPa)", wc: 0.60 },
  { label: "K-225 (fc' 19.3 MPa)", wc: 0.55 },
  { label: "K-250 (fc' 21.7 MPa)", wc: 0.52 },
  { label: "K-300 (fc' 25.0 MPa)", wc: 0.50 },
  { label: "K-350 (fc' 29.0 MPa)", wc: 0.47 },
  { label: "K-400 (fc' 33.2 MPa)", wc: 0.45 },
];

interface ItemBeton {
  id: number;
  nama: string;
  jenisElemen: string;
  panjang: number;
  lebar: number;
  tinggi: number;
  jumlah: number;
}

interface HasilItem {
  id: number;
  nama: string;
  volumeBersih: number;
  faktor: number;
  volumeKotor: number;
}

interface HasilTotal {
  totalVolumeBersih: number;
  totalVolumeKotor: number;
  jumlahTruk: number;
  semen: number; // sak 50kg
  pasir: number; // m³
  kerikil: number; // m³
  air: number; // liter
  biayaEstimasi: number;
}

const TRUK_KAPASITAS = 7; // m³ per truck mixer

// Mix design 1 m³ beton K-250 (referensi SNI):
// Semen: 380 kg/m³ = 7.6 sak @ 50kg, Pasir: 0.72 m³, Kerikil: 1.03 m³, Air: 190 L
const MIX_PER_M3 = { semen: 7.6, pasir: 0.72, kerikil: 1.03, air: 190 };

export default function KalkulatorKebutuhanBeton() {
  const [items, setItems] = useState<ItemBeton[]>([
    { id: 1, nama: "Kolom K1 40x40", jenisElemen: "Kolom", panjang: 0.4, lebar: 0.4, tinggi: 3.5, jumlah: 20 },
    { id: 2, nama: "Balok B1 25x50", jenisElemen: "Balok", panjang: 6, lebar: 0.25, tinggi: 0.5, jumlah: 15 },
  ]);
  const [mutuBeton, setMutuBeton] = useState(MUTU_BETON[2].label);
  const [hargaBeton, setHargaBeton] = useState(1200000);
  const [hasilItems, setHasilItems] = useState<HasilItem[] | null>(null);
  const [hasilTotal, setHasilTotal] = useState<HasilTotal | null>(null);
  const nextId = Math.max(...items.map(i => i.id), 0) + 1;

  function addItem() {
    setItems(prev => [...prev, { id: nextId, nama: "", jenisElemen: "Kolom", panjang: 0, lebar: 0, tinggi: 0, jumlah: 1 }]);
  }

  function removeItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItem(id: number, field: keyof ItemBeton, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  function hitung() {
    const results: HasilItem[] = items.map(item => {
      const faktorEl = JENIS_ELEMEN.find(e => e.label === item.jenisElemen)?.faktor ?? 1.05;
      const volumeBersih = item.panjang * item.lebar * item.tinggi * item.jumlah;
      const volumeKotor = volumeBersih * faktorEl;
      return { id: item.id, nama: item.nama || item.jenisElemen, volumeBersih, faktor: faktorEl, volumeKotor };
    });
    const totalBersih = results.reduce((s, r) => s + r.volumeBersih, 0);
    const totalKotor = results.reduce((s, r) => s + r.volumeKotor, 0);
    const jumlahTruk = Math.ceil(totalKotor / TRUK_KAPASITAS);
    const total: HasilTotal = {
      totalVolumeBersih: totalBersih,
      totalVolumeKotor: totalKotor,
      jumlahTruk,
      semen: totalKotor * MIX_PER_M3.semen,
      pasir: totalKotor * MIX_PER_M3.pasir,
      kerikil: totalKotor * MIX_PER_M3.kerikil,
      air: totalKotor * MIX_PER_M3.air,
      biayaEstimasi: totalKotor * hargaBeton,
    };
    setHasilItems(results);
    setHasilTotal(total);
  }

  function reset() { setHasilItems(null); setHasilTotal(null); }

  const fmt = (n: number, d = 2) => n.toFixed(d);
  const fmtK = (n: number) => `Rp ${(n / 1000000).toFixed(2)} Juta`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20"><Cylinder className="h-6 w-6 text-orange-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Kebutuhan Material Beton</h1>
              <p className="text-slate-400 text-sm">Input elemen-elemen beton → volume kotor, semen/pasir/kerikil/air, jumlah truck mixer, estimasi biaya ready mix</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 27</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-200 font-medium text-sm">Daftar Elemen Beton</h2>
            <Button onClick={addItem} size="sm" variant="outline" className="border-slate-600 text-slate-300 h-7 gap-1 text-xs"><Plus className="h-3 w-3" /> Tambah Elemen</Button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-1 text-xs text-slate-500 px-1">
              <div className="col-span-3">Nama Elemen</div>
              <div className="col-span-2">Jenis</div>
              <div>P (m)</div>
              <div>L (m)</div>
              <div>T (m)</div>
              <div>Jml</div>
              <div className="col-span-2">Volume (m³)</div>
              <div></div>
            </div>
            {items.map(item => {
              const vol = item.panjang * item.lebar * item.tinggi * item.jumlah;
              return (
                <div key={item.id} className="grid grid-cols-12 gap-1 items-center">
                  <input className="col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500" placeholder="Nama elemen" value={item.nama} onChange={e => updateItem(item.id, "nama", e.target.value)} />
                  <select className="col-span-2 bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-white" value={item.jenisElemen} onChange={e => updateItem(item.id, "jenisElemen", e.target.value)}>
                    {JENIS_ELEMEN.map(e => <option key={e.label} value={e.label}>{e.label}</option>)}
                  </select>
                  {(["panjang", "lebar", "tinggi", "jumlah"] as const).map(f => (
                    <input key={f} type="number" min="0" step="0.01" className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-white" value={item[f]} onChange={e => updateItem(item.id, f, parseFloat(e.target.value) || 0)} />
                  ))}
                  <div className="col-span-2 text-orange-300 text-xs font-mono">{fmt(vol)} m³</div>
                  <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Mutu Beton</label>
            <select className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={mutuBeton} onChange={e => setMutuBeton(e.target.value)}>
              {MUTU_BETON.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Harga Ready Mix (Rp/m³)</label>
            <input type="number" className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={hargaBeton} onChange={e => setHargaBeton(Number(e.target.value))} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={hitung} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold">Hitung</Button>
            {hasilTotal && <Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4" /></Button>}
          </div>
        </div>

        {hasilTotal && hasilItems && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Volume Bersih", value: `${fmt(hasilTotal.totalVolumeBersih)} m³`, sub: "tanpa waste" },
                { label: "Volume + Waste", value: `${fmt(hasilTotal.totalVolumeKotor)} m³`, sub: "siap pesan" },
                { label: "Truck Mixer", value: `${hasilTotal.jumlahTruk} truk`, sub: `@ ${TRUK_KAPASITAS} m³/truk` },
                { label: "Est. Biaya Ready Mix", value: fmtK(hasilTotal.biayaEstimasi), sub: `@ Rp ${(hargaBeton/1000).toFixed(0)}rb/m³` },
              ].map(c => (
                <div key={c.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                  <div className="text-orange-300 font-bold">{c.value}</div>
                  <div className="text-slate-300 text-xs">{c.label}</div>
                  <div className="text-slate-500 text-xs">{c.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-slate-200 font-medium text-sm mb-3">Kebutuhan Material Mix Design</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Semen", value: `${fmt(hasilTotal.semen, 0)} sak`, sub: "@ 50 kg/sak" },
                  { label: "Pasir", value: `${fmt(hasilTotal.pasir)} m³`, sub: "" },
                  { label: "Kerikil", value: `${fmt(hasilTotal.kerikil)} m³`, sub: "" },
                  { label: "Air", value: `${fmt(hasilTotal.air, 0)} L`, sub: "" },
                ].map(c => (
                  <div key={c.label} className="bg-slate-800/40 rounded p-2 text-center">
                    <div className="text-blue-300 font-bold text-sm">{c.value}</div>
                    <div className="text-slate-400 text-xs">{c.label}{c.sub && ` ${c.sub}`}</div>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-2">* Mix design berdasarkan SNI 7394:2008. Tambah 5–10% toleransi untuk pemesanan aktual.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-slate-200 font-medium text-sm mb-3">Rincian per Elemen</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-max">
                  <thead><tr className="text-slate-500 border-b border-slate-700/50">{["Nama Elemen", "Volume Bersih (m³)", "Faktor Waste", "Volume Kotor (m³)", "Est. Biaya"].map(h => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}</tr></thead>
                  <tbody>
                    {hasilItems.map(r => (
                      <tr key={r.id} className="border-b border-slate-800/50">
                        <td className="px-2 py-1.5 text-slate-200">{r.nama}</td>
                        <td className="px-2 py-1.5 text-slate-300">{fmt(r.volumeBersih)}</td>
                        <td className="px-2 py-1.5 text-slate-400">×{r.faktor}</td>
                        <td className="px-2 py-1.5 text-orange-300 font-medium">{fmt(r.volumeKotor)}</td>
                        <td className="px-2 py-1.5 text-green-300">{fmtK(r.volumeKotor * hargaBeton)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t border-orange-500/30">
                      <td className="px-2 py-2 text-white">TOTAL</td>
                      <td className="px-2 py-2 text-white">{fmt(hasilTotal.totalVolumeBersih)}</td>
                      <td className="px-2 py-2 text-slate-400">—</td>
                      <td className="px-2 py-2 text-orange-300">{fmt(hasilTotal.totalVolumeKotor)}</td>
                      <td className="px-2 py-2 text-green-300">{fmtK(hasilTotal.biayaEstimasi)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
