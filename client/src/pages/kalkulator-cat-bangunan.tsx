import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Paintbrush, Plus, Trash2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type TipePermukaan = "dinding_bata" | "dinding_beton" | "plafon_gypsum" | "plafon_kayu" | "kusen_kayu" | "pagar_besi" | "lantai_beton" | "kolom_beton";

const TIPE_LABEL: Record<TipePermukaan, string> = {
  dinding_bata: "Dinding Bata/Plester",
  dinding_beton: "Dinding Beton Ekspos",
  plafon_gypsum: "Plafon Gypsum/GRC",
  plafon_kayu: "Plafon Kayu/Triplek",
  kusen_kayu: "Kusen & Daun Pintu Kayu",
  pagar_besi: "Pagar / Railing Besi",
  lantai_beton: "Lantai Beton (Epoxy/Coating)",
  kolom_beton: "Kolom/Balok Beton",
};

const JENIS_CAT: Record<TipePermukaan, string[]> = {
  dinding_bata: ["Cat Tembok Eksterior", "Cat Tembok Interior", "Cat Elastomeric"],
  dinding_beton: ["Cat Beton Eksterior", "Cat Waterproofing", "Cat Tembok Eksterior"],
  plafon_gypsum: ["Cat Plafon Interior", "Cat Emulsi Putih"],
  plafon_kayu: ["Cat Kayu Interior", "Politur/Varnish"],
  kusen_kayu: ["Cat Kayu Eksterior", "Cat Minyak", "Politur/Varnish"],
  pagar_besi: ["Cat Besi Anti-Karat", "Cat Besi Eksterior", "Cat Epoxy Besi"],
  lantai_beton: ["Epoxy Coating Lantai", "Cat Lantai Beton", "Polyurethane Coating"],
  kolom_beton: ["Cat Beton Eksterior", "Cat Tembok Eksterior"],
};

// m2 per liter per lapis
const DAYA_SEBAR: Record<TipePermukaan, number> = {
  dinding_bata: 8,
  dinding_beton: 10,
  plafon_gypsum: 10,
  plafon_kayu: 9,
  kusen_kayu: 6,
  pagar_besi: 8,
  lantai_beton: 6,
  kolom_beton: 10,
};

const HARGA_CAT: Record<string, number> = {
  "Cat Tembok Eksterior": 85000,
  "Cat Tembok Interior": 75000,
  "Cat Elastomeric": 120000,
  "Cat Beton Eksterior": 95000,
  "Cat Waterproofing": 150000,
  "Cat Plafon Interior": 70000,
  "Cat Emulsi Putih": 65000,
  "Cat Kayu Interior": 90000,
  "Politur/Varnish": 80000,
  "Cat Kayu Eksterior": 100000,
  "Cat Minyak": 85000,
  "Cat Besi Anti-Karat": 110000,
  "Cat Besi Eksterior": 95000,
  "Cat Epoxy Besi": 160000,
  "Epoxy Coating Lantai": 200000,
  "Cat Lantai Beton": 130000,
  "Polyurethane Coating": 180000,
};

interface Elemen {
  id: number;
  nama: string;
  tipe: TipePermukaan;
  luas: number;
  jenisCat: string;
  jumlahLapis: number;
}

interface HasilElemen {
  nama: string;
  tipe: string;
  luas: number;
  jenisCat: string;
  jumlahLapis: number;
  litreTotal: number;
  kalengKecil: number; // 5L
  kalengBesar: number; // 25L
  perlu_primer: boolean;
  kaleng_primer: number;
  biayaCat: number;
  biayaPrimer: number;
  totalBiaya: number;
}

let _id = 1;

export default function KalkulatorCatBangunan() {
  const [elemen, setElemen] = useState<Elemen[]>([
    { id: _id++, nama: "Dinding Eksterior", tipe: "dinding_bata", luas: 200, jenisCat: "Cat Tembok Eksterior", jumlahLapis: 2 },
    { id: _id++, nama: "Dinding Interior", tipe: "dinding_bata", luas: 350, jenisCat: "Cat Tembok Interior", jumlahLapis: 2 },
    { id: _id++, nama: "Plafon", tipe: "plafon_gypsum", luas: 150, jenisCat: "Cat Plafon Interior", jumlahLapis: 2 },
  ]);
  const [hasil, setHasil] = useState<HasilElemen[] | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function update(id: number, field: keyof Elemen, val: string | number) {
    setElemen(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field === "tipe") {
        const tipe = val as TipePermukaan;
        return { ...e, tipe, jenisCat: JENIS_CAT[tipe][0] };
      }
      return { ...e, [field]: val };
    }));
  }

  function tambah() {
    setElemen(prev => [...prev, { id: _id++, nama: "Area Baru", tipe: "dinding_bata", luas: 50, jenisCat: "Cat Tembok Eksterior", jumlahLapis: 2 }]);
  }

  function hitung() {
    const r: HasilElemen[] = elemen.map(el => {
      const dayaSebar = DAYA_SEBAR[el.tipe];
      const litreTotal = (el.luas / dayaSebar) * el.jumlahLapis * 1.1; // +10% wastage
      const kalengKecil = Math.ceil(litreTotal / 5);
      const kalengBesar = Math.floor(litreTotal / 25);
      const perlu_primer = ["dinding_bata", "dinding_beton", "pagar_besi", "lantai_beton", "kolom_beton"].includes(el.tipe);
      const litrePrimer = perlu_primer ? el.luas / 10 * 1.1 : 0;
      const kaleng_primer = perlu_primer ? Math.ceil(litrePrimer / 5) : 0;
      const hargaPerL = HARGA_CAT[el.jenisCat] ?? 85000;
      const biayaCat = Math.round(litreTotal * hargaPerL / 5) * 5; // per liter
      const biayaPrimer = perlu_primer ? Math.round(litrePrimer * 55000 / 5) * 5 : 0;
      const totalBiaya = biayaCat + biayaPrimer;
      return { nama: el.nama, tipe: TIPE_LABEL[el.tipe], luas: el.luas, jenisCat: el.jenisCat, jumlahLapis: el.jumlahLapis, litreTotal, kalengKecil, kalengBesar, perlu_primer, kaleng_primer, biayaCat, biayaPrimer, totalBiaya };
    });
    setHasil(r);
  }

  const totalLuas = hasil?.reduce((s, h) => s + h.luas, 0) ?? 0;
  const totalLitre = hasil?.reduce((s, h) => s + h.litreTotal, 0) ?? 0;
  const totalBiaya = hasil?.reduce((s, h) => s + h.totalBiaya, 0) ?? 0;
  const fmt = (n: number, d = 1) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <Paintbrush className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Kebutuhan Cat Bangunan</h1>
              <p className="text-slate-400 text-sm">Hitung volume cat, kaleng, dan estimasi biaya per jenis permukaan bangunan</p>
            </div>
            <Badge className="ml-auto bg-teal-500/15 text-teal-400 border-teal-500/30">Gelombang 23</Badge>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {elemen.map(el => (
            <div key={el.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nama Area</label>
                  <input className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                    value={el.nama} onChange={ev => update(el.id, "nama", ev.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tipe Permukaan</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.tipe} onChange={ev => update(el.id, "tipe", ev.target.value)}>
                    {(Object.keys(TIPE_LABEL) as TipePermukaan[]).map(t => <option key={t} value={t}>{TIPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Jenis Cat</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.jenisCat} onChange={ev => update(el.id, "jenisCat", ev.target.value)}>
                    {JENIS_CAT[el.tipe].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Luas (m²)</label>
                  <input type="number" min={1} step={0.5} className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                    value={el.luas} onChange={ev => update(el.id, "luas", Number(ev.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Jml Lapis</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.jumlahLapis} onChange={ev => update(el.id, "jumlahLapis", Number(ev.target.value))}>
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} lapis</option>)}
                  </select>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-teal-300 text-xs">{fmt((el.luas / DAYA_SEBAR[el.tipe]) * el.jumlahLapis * 1.1)} L</span>
                  <button onClick={() => setElemen(prev => prev.filter(e => e.id !== el.id))} className="text-red-400 hover:text-red-300 ml-2">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={tambah} variant="outline" className="border-teal-600 text-teal-300 hover:bg-teal-900/30">
            <Plus className="h-4 w-4 mr-1" /> Tambah Area
          </Button>
          <Button onClick={hitung} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
            Hitung Kebutuhan Cat
          </Button>
          {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Total Luas", value: `${fmt(totalLuas)} m²`, color: "text-teal-300" },
                { label: "Total Volume Cat", value: `${fmt(totalLitre)} liter`, color: "text-blue-300" },
                { label: "Estimasi Biaya", value: fmtRp(totalBiaya), color: "text-green-300" },
              ].map(i => (
                <div key={i.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
                  <div className={`text-xl font-bold ${i.color} mb-0.5`}>{i.value}</div>
                  <div className="text-xs text-slate-400">{i.label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowDetail(!showDetail)} className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between text-white font-medium">
              <span>Detail per Area</span>
              <span className="text-slate-400 text-sm">{showDetail ? "Sembunyikan ▲" : "Tampilkan ▼"}</span>
            </button>

            {showDetail && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-x-auto">
                <table className="w-full text-xs min-w-max">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50 text-xs">
                      <th className="text-left px-4 py-2">Area</th>
                      <th className="text-right px-3 py-2">Luas m²</th>
                      <th className="text-left px-3 py-2">Cat</th>
                      <th className="text-right px-3 py-2">Lapis</th>
                      <th className="text-right px-3 py-2">Volume (L)</th>
                      <th className="text-right px-3 py-2">Kaleng 5L</th>
                      <th className="text-right px-3 py-2">Primer</th>
                      <th className="text-right px-4 py-2">Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.map((h, i) => (
                      <tr key={i} className="border-b border-slate-800/60 text-slate-300">
                        <td className="px-4 py-2 font-medium text-teal-300">{h.nama}</td>
                        <td className="text-right px-3 py-2">{fmt(h.luas)}</td>
                        <td className="px-3 py-2 text-slate-400 text-xs">{h.jenisCat}</td>
                        <td className="text-right px-3 py-2">{h.jumlahLapis}×</td>
                        <td className="text-right px-3 py-2">{fmt(h.litreTotal)}</td>
                        <td className="text-right px-3 py-2">{h.kalengKecil} klg</td>
                        <td className="text-right px-3 py-2">{h.perlu_primer ? `${h.kaleng_primer} klg` : "-"}</td>
                        <td className="text-right px-4 py-2 text-green-300">{fmtRp(h.totalBiaya)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-500">* Volume cat +10% wastage. Primer (55rb/L) dihitung untuk permukaan beton/bata/besi. Harga estimasi per liter. Konfirmasi ke toko cat setempat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
