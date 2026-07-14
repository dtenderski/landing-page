import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers2, Plus, Trash2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type TipeElemen = "kolom_persegi" | "kolom_bulat" | "balok" | "pelat" | "dinding" | "tangga" | "pondasi_pile_cap";

const TIPE_LABEL: Record<TipeElemen, string> = {
  kolom_persegi: "Kolom Persegi",
  kolom_bulat: "Kolom Bulat",
  balok: "Balok",
  pelat: "Pelat Lantai",
  dinding: "Dinding/Shearwall",
  tangga: "Tangga",
  pondasi_pile_cap: "Pile Cap / Footing",
};

interface Elemen {
  id: number;
  nama: string;
  tipe: TipeElemen;
  panjang: number;
  lebar: number;
  tinggi: number;
  diameter?: number;
  jumlahUnit: number;
}

interface HasilElemen {
  nama: string;
  tipe: string;
  jumlahUnit: number;
  luasBekistingM2: number;
  luasTotalM2: number;
  plywoodLembar: number;
  kasoM: number;
  scafoldingSet: number;
  biayaEstimasi: number;
}

const PLYWOOD_M2_PER_LEMBAR = 2.88; // 1.2m x 2.4m
const HARGA_PLYWOOD = 180000;
const HARGA_KASO_PER_M = 12000;
const HARGA_SCAFFOLDING_PER_SET_PER_BULAN = 35000;
const DURASI_BULAN = 1;

function hitungLuasBekisting(el: Elemen): number {
  const { tipe, panjang, lebar, tinggi, diameter } = el;
  switch (tipe) {
    case "kolom_persegi": return 2 * (panjang + lebar) * tinggi;
    case "kolom_bulat": return Math.PI * (diameter || lebar) * tinggi;
    case "balok": return 2 * tinggi * panjang + lebar * panjang;
    case "pelat": return panjang * lebar;
    case "dinding": return 2 * panjang * tinggi;
    case "tangga": return panjang * lebar * 1.5;
    case "pondasi_pile_cap": return 2 * (panjang + lebar) * tinggi + panjang * lebar;
    default: return 0;
  }
}

let nextId = 1;

export default function KalkulatorBekisting() {
  const [elemen, setElemen] = useState<Elemen[]>([
    { id: nextId++, nama: "Kolom K1 (400×400)", tipe: "kolom_persegi", panjang: 0.4, lebar: 0.4, tinggi: 4, jumlahUnit: 20 },
    { id: nextId++, nama: "Balok B1 (300×600)", tipe: "balok", panjang: 7, lebar: 0.3, tinggi: 0.6, jumlahUnit: 16 },
    { id: nextId++, nama: "Pelat Lantai 2", tipe: "pelat", panjang: 12, lebar: 8, tinggi: 0, jumlahUnit: 1 },
  ]);
  const [hasil, setHasil] = useState<HasilElemen[] | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function updateElemen(id: number, field: keyof Elemen, value: string | number) {
    setElemen(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field === "tipe") return { ...e, tipe: value as TipeElemen };
      return { ...e, [field]: value };
    }));
  }

  function tambah() {
    setElemen(prev => [...prev, { id: nextId++, nama: `Elemen Baru`, tipe: "pelat", panjang: 5, lebar: 5, tinggi: 0.15, jumlahUnit: 1 }]);
  }

  function hapus(id: number) { setElemen(prev => prev.filter(e => e.id !== id)); }

  function hitung() {
    const results: HasilElemen[] = elemen.map(el => {
      const luasBekistingM2 = hitungLuasBekisting(el);
      const luasTotalM2 = luasBekistingM2 * el.jumlahUnit;
      const plywoodLembar = Math.ceil(luasTotalM2 / PLYWOOD_M2_PER_LEMBAR * 1.1);
      const kasoM = Math.ceil(luasTotalM2 * 2.5);
      const scafoldingSet = el.tipe === "kolom_persegi" || el.tipe === "kolom_bulat" || el.tipe === "dinding" || el.tipe === "tangga"
        ? Math.ceil(luasTotalM2 / 4)
        : 0;
      const biayaEstimasi = plywoodLembar * HARGA_PLYWOOD + kasoM * HARGA_KASO_PER_M + scafoldingSet * HARGA_SCAFFOLDING_PER_SET_PER_BULAN * DURASI_BULAN;
      return { nama: el.nama, tipe: TIPE_LABEL[el.tipe], jumlahUnit: el.jumlahUnit, luasBekistingM2, luasTotalM2, plywoodLembar, kasoM, scafoldingSet, biayaEstimasi };
    });
    setHasil(results);
  }

  const totalLuas = hasil?.reduce((s, h) => s + h.luasTotalM2, 0) ?? 0;
  const totalPlywood = hasil?.reduce((s, h) => s + h.plywoodLembar, 0) ?? 0;
  const totalKaso = hasil?.reduce((s, h) => s + h.kasoM, 0) ?? 0;
  const totalScafolding = hasil?.reduce((s, h) => s + h.scafoldingSet, 0) ?? 0;
  const totalBiaya = hasil?.reduce((s, h) => s + h.biayaEstimasi, 0) ?? 0;

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
              <Layers2 className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Bekisting & Perancah</h1>
              <p className="text-slate-400 text-sm">Hitung kebutuhan plywood, kaso, scaffolding, dan estimasi biaya bekisting per elemen struktural</p>
            </div>
            <Badge className="ml-auto bg-teal-500/15 text-teal-400 border-teal-500/30">Gelombang 22</Badge>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {elemen.map(el => (
            <div key={el.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 items-end">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nama</label>
                  <input className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                    value={el.nama} onChange={ev => updateElemen(el.id, "nama", ev.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tipe</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.tipe} onChange={ev => updateElemen(el.id, "tipe", ev.target.value)}>
                    {(Object.keys(TIPE_LABEL) as TipeElemen[]).map(t => <option key={t} value={t}>{TIPE_LABEL[t]}</option>)}
                  </select>
                </div>
                {el.tipe === "kolom_bulat" ? (
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Diameter (m)</label>
                    <input type="number" step="0.01" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                      value={el.diameter ?? el.lebar} onChange={ev => updateElemen(el.id, "diameter", Number(ev.target.value))} />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">{el.tipe === "pelat" ? "Panjang (m)" : "Panjang (m)"}</label>
                      <input type="number" step="0.01" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                        value={el.panjang} onChange={ev => updateElemen(el.id, "panjang", Number(ev.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">{el.tipe === "pelat" ? "Lebar (m)" : "Lebar/b (m)"}</label>
                      <input type="number" step="0.01" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                        value={el.lebar} onChange={ev => updateElemen(el.id, "lebar", Number(ev.target.value))} />
                    </div>
                  </>
                )}
                {el.tipe !== "pelat" && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tinggi (m)</label>
                    <input type="number" step="0.01" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                      value={el.tinggi} onChange={ev => updateElemen(el.id, "tinggi", Number(ev.target.value))} />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Jml Unit</label>
                  <input type="number" min={1} className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                    value={el.jumlahUnit} onChange={ev => updateElemen(el.id, "jumlahUnit", Number(ev.target.value))} />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-teal-300 text-xs">{fmt(hitungLuasBekisting(el) * el.jumlahUnit)} m²</span>
                  <button onClick={() => hapus(el.id)} className="text-red-400 hover:text-red-300 ml-2">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={tambah} variant="outline" className="border-teal-600 text-teal-300 hover:bg-teal-900/30">
            <Plus className="h-4 w-4 mr-1" /> Tambah Elemen
          </Button>
          <Button onClick={hitung} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
            Hitung Kebutuhan Bekisting
          </Button>
          {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Luas Bekisting", value: `${fmt(totalLuas)} m²`, color: "text-teal-300" },
                { label: "Plywood (1.2×2.4)", value: `${totalPlywood} lembar`, color: "text-blue-300" },
                { label: "Kaso/Balok Kayu", value: `${fmt(totalKaso, 0)} m`, color: "text-orange-300" },
                { label: "Estimasi Biaya", value: fmtRp(totalBiaya), color: "text-green-300" },
              ].map(item => (
                <div key={item.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
                  <div className={`text-xl font-bold ${item.color} mb-0.5`}>{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>

            {totalScafolding > 0 && (
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-amber-300 font-bold text-lg">{totalScafolding} set × {DURASI_BULAN} bulan</div>
                <div className="text-slate-400 text-sm">Kebutuhan Perancah/Scaffolding (estimasi sewa)</div>
              </div>
            )}

            <button onClick={() => setShowDetail(!showDetail)} className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between text-white font-medium">
              <span>Detail per Elemen</span>
              <span className="text-slate-400 text-sm">{showDetail ? "Sembunyikan ▲" : "Tampilkan ▼"}</span>
            </button>

            {showDetail && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50 text-xs">
                      <th className="text-left px-4 py-2">Elemen</th>
                      <th className="text-right px-3 py-2">Luas/unit m²</th>
                      <th className="text-right px-3 py-2">Total m²</th>
                      <th className="text-right px-3 py-2">Plywood</th>
                      <th className="text-right px-3 py-2">Kaso (m)</th>
                      <th className="text-right px-3 py-2">Scaffolding</th>
                      <th className="text-right px-4 py-2">Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.map((h, i) => (
                      <tr key={i} className="border-b border-slate-800/60 text-slate-300">
                        <td className="px-4 py-2 font-medium text-teal-300">{h.nama}</td>
                        <td className="text-right px-3 py-2">{fmt(h.luasBekistingM2)}</td>
                        <td className="text-right px-3 py-2">{fmt(h.luasTotalM2)}</td>
                        <td className="text-right px-3 py-2">{h.plywoodLembar} lbr</td>
                        <td className="text-right px-3 py-2">{fmt(h.kasoM, 0)} m</td>
                        <td className="text-right px-3 py-2">{h.scafoldingSet > 0 ? `${h.scafoldingSet} set` : "-"}</td>
                        <td className="text-right px-4 py-2">{fmtRp(h.biayaEstimasi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-500">* Plywood +10% wastage. Harga material estimasi Jabodetabek. Scaffolding sewa 1 bulan. Belum termasuk upah pemasangan/pembongkaran bekisting. Konfirmasi ke supplier lokal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
