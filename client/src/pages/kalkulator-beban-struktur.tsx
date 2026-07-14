import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Plus, Trash2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type TipeElemen = "pelat_lantai" | "balok" | "kolom" | "dinding" | "pondasi_telapak" | "tangga";

const TIPE_LABEL: Record<TipeElemen, string> = {
  pelat_lantai: "Pelat Lantai Beton",
  balok: "Balok Beton",
  kolom: "Kolom Beton",
  dinding: "Dinding Bata/Beton",
  pondasi_telapak: "Pondasi Telapak",
  tangga: "Tangga Beton",
};

const BERAT_JENIS_BETON = 2400; // kg/m³
const BERAT_JENIS_BATA = 1800;

const BEBAN_HIDUP_TIPIKAL: Record<string, number> = {
  "Rumah Tinggal / Apartemen": 200,
  "Kantor": 250,
  "Toko / Retail": 400,
  "Gudang Ringan": 500,
  "Gudang Berat": 1000,
  "Parkir Kendaraan": 400,
  "Atap Datar": 100,
  "Tangga / Koridor": 300,
};

const MUTU_BETON: Record<string, { fc: number; label: string }> = {
  K175: { fc: 14.5, label: "K-175 / fc 14.5 MPa" },
  K225: { fc: 18.7, label: "K-225 / fc 18.7 MPa" },
  K250: { fc: 20.7, label: "K-250 / fc 20.7 MPa" },
  K300: { fc: 24.9, label: "K-300 / fc 24.9 MPa" },
  K350: { fc: 29.0, label: "K-350 / fc 29.0 MPa" },
  K400: { fc: 33.2, label: "K-400 / fc 33.2 MPa" },
};

interface Elemen {
  id: number;
  nama: string;
  tipe: TipeElemen;
  panjang: number;
  lebar: number;
  tinggi: number;
  mutu: string;
  fungsi: string;
}

interface HasilElemen {
  nama: string;
  tipe: string;
  volume: number;
  beratSendiri: number;
  bebanHidup: number;
  bebanTotal: number;
  bebanUlt: number;
  notes: string;
}

let _id = 1;

export default function KalkulatorBebanStruktur() {
  const [elemen, setElemen] = useState<Elemen[]>([
    { id: _id++, nama: "Pelat Lt. 1", tipe: "pelat_lantai", panjang: 6, lebar: 5, tinggi: 0.12, mutu: "K250", fungsi: "Kantor" },
    { id: _id++, nama: "Balok Induk B1", tipe: "balok", panjang: 6, lebar: 0.3, tinggi: 0.5, mutu: "K250", fungsi: "Kantor" },
    { id: _id++, nama: "Kolom K1", tipe: "kolom", panjang: 0.4, lebar: 0.4, tinggi: 4, mutu: "K300", fungsi: "Kantor" },
  ]);
  const [hasil, setHasil] = useState<HasilElemen[] | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [supStrength, setSupStrength] = useState(0.85);

  function update(id: number, field: keyof Elemen, val: string | number) {
    setElemen(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  }

  function tambah() {
    setElemen(prev => [...prev, { id: _id++, nama: "Elemen Baru", tipe: "pelat_lantai", panjang: 4, lebar: 3, tinggi: 0.12, mutu: "K250", fungsi: "Kantor" }]);
  }

  function hitung() {
    const r: HasilElemen[] = elemen.map(el => {
      const vol = el.panjang * el.lebar * el.tinggi;
      const bjBeton = ["pelat_lantai", "balok", "kolom", "pondasi_telapak", "tangga"].includes(el.tipe) ? BERAT_JENIS_BETON : BERAT_JENIS_BATA;
      const beratSendiri = vol * bjBeton; // kg
      const area = el.tipe === "pelat_lantai" || el.tipe === "tangga" ? el.panjang * el.lebar : 0;
      const qHidup = BEBAN_HIDUP_TIPIKAL[el.fungsi] ?? 250; // kg/m²
      const bebanHidup = area * qHidup;
      const beratTotal = beratSendiri + bebanHidup; // kg
      // Beban ultimate (SNI 1727:2020): 1.2D + 1.6L
      const bebanUlt = 1.2 * beratSendiri + 1.6 * bebanHidup;

      // Notes
      const fc = MUTU_BETON[el.mutu]?.fc ?? 24.9;
      let notes = "";
      if (el.tipe === "pelat_lantai") {
        const ratio = (el.tinggi * 1000) / (Math.max(el.panjang, el.lebar) * 1000 / el.panjang);
        notes = `Tebal/bentang ≈ ${(el.tinggi / el.panjang * 100).toFixed(1)}% | fc' = ${fc} MPa`;
      } else if (el.tipe === "kolom") {
        const ag = el.panjang * el.lebar * 1e6; // mm²
        const pn = 0.8 * (0.85 * fc * ag) / 1000; // kN
        notes = `Kapasitas aksial maks ≈ ${(pn / 1000).toFixed(0)} ton (Pn tanpa tulangan)`;
      } else if (el.tipe === "balok") {
        notes = `Volume beton: ${vol.toFixed(3)} m³ | Berat: ${beratSendiri.toFixed(0)} kg`;
      }

      return { nama: el.nama, tipe: TIPE_LABEL[el.tipe], volume: vol, beratSendiri, bebanHidup, bebanTotal: beratTotal, bebanUlt, notes };
    });
    setHasil(r);
  }

  const totalBerat = hasil?.reduce((s, h) => s + h.bebanTotal, 0) ?? 0;
  const totalVol = hasil?.reduce((s, h) => s + h.volume, 0) ?? 0;
  const totalUlt = hasil?.reduce((s, h) => s + h.bebanUlt, 0) ?? 0;
  const fmt = (n: number, d = 1) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  const ton = (n: number) => (n / 1000).toFixed(2) + " ton";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Calculator className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Beban Struktural Beton</h1>
              <p className="text-slate-400 text-sm">Hitung berat sendiri, beban hidup, dan beban ultimate elemen struktural beton (SNI 1727:2020)</p>
            </div>
            <Badge className="ml-auto bg-cyan-500/15 text-cyan-400 border-cyan-500/30">Gelombang 24</Badge>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {elemen.map(el => (
            <div key={el.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nama</label>
                  <input className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-xs"
                    value={el.nama} onChange={e => update(el.id, "nama", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tipe Elemen</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.tipe} onChange={e => update(el.id, "tipe", e.target.value)}>
                    {(Object.keys(TIPE_LABEL) as TipeElemen[]).map(t => <option key={t} value={t}>{TIPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">P/L/T (m)</label>
                  <div className="flex gap-1">
                    <input type="number" step="0.1" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1 py-1.5 text-white text-xs" placeholder="P" value={el.panjang} onChange={e => update(el.id, "panjang", Number(e.target.value))} />
                    <input type="number" step="0.1" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1 py-1.5 text-white text-xs" placeholder="L" value={el.lebar} onChange={e => update(el.id, "lebar", Number(e.target.value))} />
                    <input type="number" step="0.01" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1 py-1.5 text-white text-xs" placeholder="T" value={el.tinggi} onChange={e => update(el.id, "tinggi", Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Mutu Beton</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.mutu} onChange={e => update(el.id, "mutu", e.target.value)}>
                    {Object.entries(MUTU_BETON).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Fungsi Ruang</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1.5 text-white text-xs"
                    value={el.fungsi} onChange={e => update(el.id, "fungsi", e.target.value)}>
                    {Object.keys(BEBAN_HIDUP_TIPIKAL).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs text-slate-400 mb-1 block">Vol / Berat</label>
                  <div className="text-cyan-300 text-xs">
                    {(el.panjang * el.lebar * el.tinggi).toFixed(3)} m³<br />
                    <span className="text-slate-400">{((el.panjang * el.lebar * el.tinggi) * BERAT_JENIS_BETON / 1000).toFixed(2)} ton</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={() => setElemen(prev => prev.filter(e => e.id !== el.id))} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={tambah} variant="outline" className="border-cyan-600 text-cyan-300 hover:bg-cyan-900/30">
            <Plus className="h-4 w-4 mr-1" /> Tambah Elemen
          </Button>
          <Button onClick={hitung} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
            Hitung Beban Struktural
          </Button>
          {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Volume Beton", value: `${fmt(totalVol, 3)} m³`, color: "text-cyan-300" },
                { label: "Total Beban Kerja", value: ton(totalBerat), color: "text-blue-300" },
                { label: "Beban Ultimate (1.2D+1.6L)", value: ton(totalUlt), color: "text-orange-300" },
              ].map(i => (
                <div key={i.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
                  <div className={`text-xl font-bold ${i.color} mb-0.5`}>{i.value}</div>
                  <div className="text-xs text-slate-400">{i.label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowDetail(!showDetail)} className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between text-white font-medium">
              <span>Detail per Elemen</span>
              <span className="text-slate-400 text-sm">{showDetail ? "Sembunyikan ▲" : "Tampilkan ▼"}</span>
            </button>

            {showDetail && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-x-auto">
                <table className="w-full text-xs min-w-max">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="text-left px-4 py-2">Elemen</th>
                      <th className="text-right px-3 py-2">Volume m³</th>
                      <th className="text-right px-3 py-2">Berat Sendiri</th>
                      <th className="text-right px-3 py-2">Beban Hidup</th>
                      <th className="text-right px-3 py-2">Total (ton)</th>
                      <th className="text-right px-4 py-2">Ultimate (ton)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.map((h, i) => (
                      <tr key={i} className="border-b border-slate-800/60 text-slate-300">
                        <td className="px-4 py-2">
                          <div className="font-medium text-cyan-300">{h.nama}</div>
                          <div className="text-slate-500 text-xs">{h.tipe}</div>
                          {h.notes && <div className="text-slate-500 text-xs italic">{h.notes}</div>}
                        </td>
                        <td className="text-right px-3 py-2">{fmt(h.volume, 3)}</td>
                        <td className="text-right px-3 py-2">{(h.beratSendiri / 1000).toFixed(2)}</td>
                        <td className="text-right px-3 py-2">{(h.bebanHidup / 1000).toFixed(2)}</td>
                        <td className="text-right px-3 py-2">{(h.bebanTotal / 1000).toFixed(2)}</td>
                        <td className="text-right px-4 py-2 text-orange-300">{(h.bebanUlt / 1000).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-500">* Beban ultimate = 1.2D + 1.6L sesuai SNI 1727:2020. Kapasitas kolom menggunakan persamaan sederhana tanpa tulangan (perlu perhitungan detail oleh Ahli Struktur).</p>
          </div>
        )}
      </div>
    </div>
  );
}
