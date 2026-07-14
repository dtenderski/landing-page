import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cylinder, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

type TipeElemen = "kolom" | "balok" | "pelat" | "pondasi_telapak" | "pondasi_bored" | "dinding" | "tangga";
type MutuBeton = "K-175" | "K-225" | "K-250" | "K-300" | "K-350" | "K-400" | "fc21" | "fc25" | "fc30" | "fc35";

interface Elemen {
  id: number;
  nama: string;
  tipe: TipeElemen;
  panjang: number;
  lebar: number;
  tinggi: number;
  jumlah: number;
  mutu: MutuBeton;
}

interface HasilHitung {
  volumeBersih: number;
  volumeWastage: number;
  volumeTotal: number;
  jumlahTruk: number;
  biayaBeton: number;
  biayaUpah: number;
  biayaTotal: number;
}

const HARGA_BETON: Record<MutuBeton, number> = {
  "K-175": 820000, "K-225": 890000, "K-250": 960000, "K-300": 1050000,
  "K-350": 1140000, "K-400": 1250000,
  "fc21": 940000, "fc25": 1020000, "fc30": 1100000, "fc35": 1200000,
};

const UPAH_PER_M3: Record<TipeElemen, number> = {
  kolom: 120000, balok: 95000, pelat: 85000, pondasi_telapak: 110000,
  pondasi_bored: 135000, dinding: 100000, tangga: 150000,
};

const WASTAGE_PER_TIPE: Record<TipeElemen, number> = {
  kolom: 0.05, balok: 0.04, pelat: 0.03, pondasi_telapak: 0.05,
  pondasi_bored: 0.08, dinding: 0.05, tangga: 0.07,
};

const TIPE_LABEL: Record<TipeElemen, string> = {
  kolom: "Kolom", balok: "Balok", pelat: "Pelat Lantai",
  pondasi_telapak: "Pondasi Telapak", pondasi_bored: "Pondasi Bored Pile",
  dinding: "Dinding Beton (Shearwall)", tangga: "Tangga",
};

const KAPASITAS_TRUK = 7; // m3
let nextId = 1;

function hitungVolume(e: Elemen): number {
  if (e.tipe === "pondasi_bored") {
    const r = e.lebar / 2;
    return Math.PI * r * r * e.tinggi * e.jumlah;
  }
  return e.panjang * e.lebar * e.tinggi * e.jumlah;
}

export default function KalkulatorBetonReadymix() {
  const [elemen, setElemen] = useState<Elemen[]>([
    { id: nextId++, nama: "Kolom K1", tipe: "kolom", panjang: 0.5, lebar: 0.5, tinggi: 3.5, jumlah: 12, mutu: "K-300" },
    { id: nextId++, nama: "Balok B1", tipe: "balok", panjang: 6, lebar: 0.3, tinggi: 0.5, jumlah: 8, mutu: "K-300" },
  ]);
  const [hasil, setHasil] = useState<HasilHitung | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function tambahElemen() {
    setElemen(prev => [...prev, {
      id: nextId++, nama: `Elemen ${nextId}`, tipe: "pelat",
      panjang: 4, lebar: 4, tinggi: 0.12, jumlah: 1, mutu: "K-250",
    }]);
  }

  function updateElemen(id: number, field: keyof Elemen, value: string | number) {
    setElemen(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function hapusElemen(id: number) {
    setElemen(prev => prev.filter(e => e.id !== id));
  }

  function hitung() {
    let volBersih = 0;
    let volWaste = 0;
    let biayaUpah = 0;

    const grouped: Record<MutuBeton, number> = {} as Record<MutuBeton, number>;

    elemen.forEach(e => {
      const vol = hitungVolume(e);
      const waste = vol * WASTAGE_PER_TIPE[e.tipe];
      volBersih += vol;
      volWaste += waste;
      biayaUpah += (vol + waste) * UPAH_PER_M3[e.tipe];
      grouped[e.mutu] = (grouped[e.mutu] ?? 0) + vol + waste;
    });

    const volTotal = volBersih + volWaste;
    let biayaBeton = 0;
    Object.entries(grouped).forEach(([mutu, vol]) => {
      biayaBeton += vol * HARGA_BETON[mutu as MutuBeton];
    });

    setHasil({
      volumeBersih: volBersih,
      volumeWastage: volWaste,
      volumeTotal: volTotal,
      jumlahTruk: Math.ceil(volTotal / KAPASITAS_TRUK),
      biayaBeton,
      biayaUpah,
      biayaTotal: biayaBeton + biayaUpah,
    });
  }

  function reset() { setHasil(null); }

  const fmt = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <Cylinder className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Beton Ready Mix</h1>
              <p className="text-slate-400 text-sm">Hitung kebutuhan volume, truk molen, dan estimasi biaya beton proyek</p>
            </div>
            <Badge className="ml-auto bg-teal-500/15 text-teal-400 border-teal-500/30">Gelombang 20</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Daftar Elemen Beton</h2>
            <Button onClick={tambahElemen} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Tambah Elemen
            </Button>
          </div>

          <div className="space-y-3">
            {elemen.map(e => (
              <div key={e.id} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Nama Elemen</label>
                    <input
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.nama}
                      onChange={ev => updateElemen(e.id, "nama", ev.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tipe Elemen</label>
                    <select
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.tipe}
                      onChange={ev => updateElemen(e.id, "tipe", ev.target.value)}
                    >
                      {(Object.keys(TIPE_LABEL) as TipeElemen[]).map(t => (
                        <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Mutu Beton</label>
                    <select
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.mutu}
                      onChange={ev => updateElemen(e.id, "mutu", ev.target.value)}
                    >
                      {(Object.keys(HARGA_BETON) as MutuBeton[]).map(m => (
                        <option key={m} value={m}>{m} — {fmtRp(HARGA_BETON[m])}/m³</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Jumlah</label>
                    <input type="number" min={1}
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.jumlah}
                      onChange={ev => updateElemen(e.id, "jumlah", Number(ev.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      {e.tipe === "pondasi_bored" ? "Panjang (m) — opsional" : "Panjang (m)"}
                    </label>
                    <input type="number" step="0.01" min={0}
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.panjang}
                      onChange={ev => updateElemen(e.id, "panjang", Number(ev.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      {e.tipe === "pondasi_bored" ? "Diameter (m)" : "Lebar (m)"}
                    </label>
                    <input type="number" step="0.01" min={0}
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.lebar}
                      onChange={ev => updateElemen(e.id, "lebar", Number(ev.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      {e.tipe === "pondasi_bored" ? "Kedalaman (m)" : "Tinggi/Tebal (m)"}
                    </label>
                    <input type="number" step="0.01" min={0}
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                      value={e.tinggi}
                      onChange={ev => updateElemen(e.id, "tinggi", Number(ev.target.value))}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-teal-300">
                    Volume bersih: {fmt(hitungVolume(e))} m³ × {e.jumlah > 1 ? `(${e.jumlah} unit) = sudah termasuk` : "1 unit"}
                    &nbsp;· Wastage {(WASTAGE_PER_TIPE[e.tipe] * 100).toFixed(0)}%
                  </span>
                  <button onClick={() => hapusElemen(e.id)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={hitung} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              Hitung Kebutuhan Beton
            </Button>
            {hasil && (
              <Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Volume Bersih", value: `${fmt(hasil.volumeBersih)} m³`, color: "text-teal-300" },
                { label: "Volume + Wastage", value: `${fmt(hasil.volumeTotal)} m³`, color: "text-blue-300" },
                { label: "Jumlah Truk Molen", value: `${hasil.jumlahTruk} truk`, color: "text-orange-300" },
                { label: "Total Wastage", value: `${fmt(hasil.volumeWastage)} m³`, color: "text-yellow-300" },
              ].map(item => (
                <div key={item.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Estimasi Biaya</h3>
              <div className="space-y-3">
                {[
                  { label: "Biaya Beton Ready Mix", value: hasil.biayaBeton },
                  { label: "Biaya Upah Pengecoran (estimasi)", value: hasil.biayaUpah },
                  { label: "Total Estimasi", value: hasil.biayaTotal, bold: true },
                ].map(item => (
                  <div key={item.label} className={`flex justify-between items-center py-2 border-b border-slate-700/40 ${item.bold ? "text-white font-bold" : "text-slate-300"}`}>
                    <span className="text-sm">{item.label}</span>
                    <span className={`text-sm ${item.bold ? "text-teal-300 text-base" : ""}`}>{fmtRp(item.value)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">* Harga beton & upah estimasi regional Jabodetabek. Konfirmasi ke supplier & mandor setempat. Belum termasuk PPN, pompa beton, dan biaya overhead.</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <button onClick={() => setShowDetail(!showDetail)} className="w-full flex items-center justify-between text-white font-semibold mb-1">
                <span>Detail per Elemen</span>
                <span className="text-slate-400 text-sm">{showDetail ? "Sembunyikan" : "Tampilkan"}</span>
              </button>
              {showDetail && (
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="text-left py-2">Elemen</th>
                      <th className="text-right py-2">Vol Bersih</th>
                      <th className="text-right py-2">Wastage</th>
                      <th className="text-right py-2">Vol Total</th>
                      <th className="text-right py-2">Truk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elemen.map(e => {
                      const v = hitungVolume(e);
                      const w = v * WASTAGE_PER_TIPE[e.tipe];
                      return (
                        <tr key={e.id} className="text-slate-300 border-b border-slate-800/60">
                          <td className="py-2">{e.nama}</td>
                          <td className="text-right">{fmt(v)} m³</td>
                          <td className="text-right text-yellow-400">{fmt(w)} m³</td>
                          <td className="text-right text-teal-300">{fmt(v + w)} m³</td>
                          <td className="text-right">{Math.ceil((v + w) / KAPASITAS_TRUK)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
