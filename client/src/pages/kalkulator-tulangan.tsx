import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Grid3x3, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

type TipeElemen = "kolom" | "balok" | "pelat" | "pondasi_telapak" | "dinding" | "tangga";
type MutuBaja = "BJTP24" | "BJTD32" | "BJTD40";
type Diameter = "6" | "8" | "10" | "12" | "13" | "16" | "19" | "22" | "25" | "29" | "32";

interface TulanganItem {
  diameter: Diameter;
  panjang: number;
  jumlahBatang: number;
  mutu: MutuBaja;
  keterangan: string;
}

interface Elemen {
  id: number;
  nama: string;
  tipe: TipeElemen;
  jumlahUnit: number;
  tulanganList: TulanganItem[];
}

interface HasilHitung {
  totalBeratKg: number;
  totalBeratTon: number;
  totalPanjangM: number;
  beratPerMutu: Record<MutuBaja, number>;
  biayaEstimasi: number;
  ringkasanDiameter: { diameter: string; jumlah: number; panjangTotal: number; berat: number }[];
}

const BERAT_PER_METER: Record<Diameter, number> = {
  "6": 0.222, "8": 0.395, "10": 0.617, "12": 0.888, "13": 1.04,
  "16": 1.578, "19": 2.226, "22": 2.984, "25": 3.853, "29": 5.185, "32": 6.313,
};

const HARGA_PER_KG: Record<MutuBaja, number> = {
  BJTP24: 12500, BJTD32: 13500, BJTD40: 14500,
};

const TIPE_LABEL: Record<TipeElemen, string> = {
  kolom: "Kolom", balok: "Balok", pelat: "Pelat Lantai",
  pondasi_telapak: "Pondasi Telapak", dinding: "Dinding/Shearwall", tangga: "Tangga",
};

let nextId = 1;

function buatTulanganDefault(tipe: TipeElemen): TulanganItem[] {
  const defaults: Record<TipeElemen, TulanganItem[]> = {
    kolom: [
      { diameter: "16", panjang: 4, jumlahBatang: 8, mutu: "BJTD40", keterangan: "Tulangan utama longitudinal" },
      { diameter: "10", panjang: 1.2, jumlahBatang: 30, mutu: "BJTD32", keterangan: "Sengkang / ties" },
    ],
    balok: [
      { diameter: "19", panjang: 7, jumlahBatang: 4, mutu: "BJTD40", keterangan: "Tulangan tarik bawah" },
      { diameter: "16", panjang: 7, jumlahBatang: 2, mutu: "BJTD40", keterangan: "Tulangan tekan atas" },
      { diameter: "10", panjang: 1.5, jumlahBatang: 25, mutu: "BJTD32", keterangan: "Sengkang" },
    ],
    pelat: [
      { diameter: "10", panjang: 6, jumlahBatang: 20, mutu: "BJTD32", keterangan: "Tulangan arah X" },
      { diameter: "10", panjang: 5, jumlahBatang: 24, mutu: "BJTD32", keterangan: "Tulangan arah Y" },
    ],
    pondasi_telapak: [
      { diameter: "16", panjang: 2, jumlahBatang: 10, mutu: "BJTD40", keterangan: "Tulangan arah X" },
      { diameter: "16", panjang: 2, jumlahBatang: 10, mutu: "BJTD40", keterangan: "Tulangan arah Y" },
    ],
    dinding: [
      { diameter: "12", panjang: 3, jumlahBatang: 15, mutu: "BJTD32", keterangan: "Tulangan vertikal" },
      { diameter: "10", panjang: 4, jumlahBatang: 12, mutu: "BJTD32", keterangan: "Tulangan horizontal" },
    ],
    tangga: [
      { diameter: "13", panjang: 5, jumlahBatang: 12, mutu: "BJTD40", keterangan: "Tulangan utama" },
      { diameter: "8", panjang: 1.5, jumlahBatang: 20, mutu: "BJTD32", keterangan: "Tulangan bagi" },
    ],
  };
  return defaults[tipe];
}

export default function KalkulatorTulangan() {
  const [elemen, setElemen] = useState<Elemen[]>([
    { id: nextId++, nama: "Kolom K1", tipe: "kolom", jumlahUnit: 12, tulanganList: buatTulanganDefault("kolom") },
    { id: nextId++, nama: "Balok B1", tipe: "balok", jumlahUnit: 8, tulanganList: buatTulanganDefault("balok") },
  ]);
  const [hasil, setHasil] = useState<HasilHitung | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function tambahElemen() {
    setElemen(prev => [...prev, {
      id: nextId++, nama: `Elemen ${nextId}`, tipe: "pelat",
      jumlahUnit: 1, tulanganList: buatTulanganDefault("pelat"),
    }]);
  }

  function updateElemen(id: number, field: "nama" | "tipe" | "jumlahUnit", value: string | number) {
    setElemen(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field === "tipe") return { ...e, tipe: value as TipeElemen, tulanganList: buatTulanganDefault(value as TipeElemen) };
      return { ...e, [field]: value };
    }));
  }

  function updateTulangan(elemenId: number, idx: number, field: keyof TulanganItem, value: string | number) {
    setElemen(prev => prev.map(e => {
      if (e.id !== elemenId) return e;
      const newList = [...e.tulanganList];
      newList[idx] = { ...newList[idx], [field]: value };
      return { ...e, tulanganList: newList };
    }));
  }

  function tambahTulangan(elemenId: number) {
    setElemen(prev => prev.map(e => {
      if (e.id !== elemenId) return e;
      return { ...e, tulanganList: [...e.tulanganList, { diameter: "12", panjang: 3, jumlahBatang: 10, mutu: "BJTD40", keterangan: "" }] };
    }));
  }

  function hapusTulangan(elemenId: number, idx: number) {
    setElemen(prev => prev.map(e => {
      if (e.id !== elemenId) return e;
      const newList = e.tulanganList.filter((_, i) => i !== idx);
      return { ...e, tulanganList: newList };
    }));
  }

  function hapusElemen(id: number) { setElemen(prev => prev.filter(e => e.id !== id)); }

  function hitung() {
    let totalBeratKg = 0;
    let totalPanjangM = 0;
    const beratPerMutu: Record<MutuBaja, number> = { BJTP24: 0, BJTD32: 0, BJTD40: 0 };
    const diamMap: Record<string, { jumlah: number; panjangTotal: number; berat: number }> = {};

    elemen.forEach(el => {
      el.tulanganList.forEach(t => {
        const panjangTotal = t.panjang * t.jumlahBatang * el.jumlahUnit;
        const berat = panjangTotal * BERAT_PER_METER[t.diameter];
        totalBeratKg += berat;
        totalPanjangM += panjangTotal;
        beratPerMutu[t.mutu] = (beratPerMutu[t.mutu] ?? 0) + berat;
        if (!diamMap[t.diameter]) diamMap[t.diameter] = { jumlah: 0, panjangTotal: 0, berat: 0 };
        diamMap[t.diameter].jumlah += t.jumlahBatang * el.jumlahUnit;
        diamMap[t.diameter].panjangTotal += panjangTotal;
        diamMap[t.diameter].berat += berat;
      });
    });

    let biayaEstimasi = 0;
    (Object.keys(beratPerMutu) as MutuBaja[]).forEach(m => {
      biayaEstimasi += beratPerMutu[m] * HARGA_PER_KG[m];
    });

    const ringkasanDiameter = Object.entries(diamMap).map(([d, v]) => ({ diameter: `D${d}`, ...v })).sort((a, b) => parseInt(a.diameter.slice(1)) - parseInt(b.diameter.slice(1)));

    setHasil({ totalBeratKg, totalBeratTon: totalBeratKg / 1000, totalPanjangM, beratPerMutu, biayaEstimasi, ringkasanDiameter });
  }

  const fmt = (n: number, dec = 2) => n.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec });
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
              <Grid3x3 className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Kebutuhan Tulangan</h1>
              <p className="text-slate-400 text-sm">Hitung berat baja tulangan, jumlah batang, dan estimasi biaya per elemen struktural</p>
            </div>
            <Badge className="ml-auto bg-teal-500/15 text-teal-400 border-teal-500/30">Gelombang 21</Badge>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          {elemen.map(el => (
            <div key={el.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nama Elemen</label>
                  <input className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                    value={el.nama} onChange={ev => updateElemen(el.id, "nama", ev.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tipe</label>
                  <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                    value={el.tipe} onChange={ev => updateElemen(el.id, "tipe", ev.target.value)}>
                    {(Object.keys(TIPE_LABEL) as TipeElemen[]).map(t => (
                      <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Jumlah Unit</label>
                  <input type="number" min={1} className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-2 py-1.5 text-white text-sm"
                    value={el.jumlahUnit} onChange={ev => updateElemen(el.id, "jumlahUnit", Number(ev.target.value))} />
                </div>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">DAFTAR TULANGAN</span>
                  <button onClick={() => tambahTulangan(el.id)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {el.tulanganList.map((t, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                      <div>
                        <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1 text-white text-xs"
                          value={t.diameter} onChange={ev => updateTulangan(el.id, idx, "diameter", ev.target.value)}>
                          {(["6","8","10","12","13","16","19","22","25","29","32"] as Diameter[]).map(d => (
                            <option key={d} value={d}>D{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input type="number" step="0.01" placeholder="Panjang (m)" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1 text-white text-xs"
                          value={t.panjang} onChange={ev => updateTulangan(el.id, idx, "panjang", Number(ev.target.value))} />
                      </div>
                      <div>
                        <input type="number" placeholder="Jumlah batang" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1 text-white text-xs"
                          value={t.jumlahBatang} onChange={ev => updateTulangan(el.id, idx, "jumlahBatang", Number(ev.target.value))} />
                      </div>
                      <div>
                        <select className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1 text-white text-xs"
                          value={t.mutu} onChange={ev => updateTulangan(el.id, idx, "mutu", ev.target.value)}>
                          <option value="BJTP24">BJTP 24</option>
                          <option value="BJTD32">BJTD 32</option>
                          <option value="BJTD40">BJTD 40</option>
                        </select>
                      </div>
                      <div>
                        <input type="text" placeholder="Keterangan" className="w-full bg-slate-700/60 border border-slate-600/50 rounded px-1.5 py-1 text-white text-xs"
                          value={t.keterangan} onChange={ev => updateTulangan(el.id, idx, "keterangan", ev.target.value)} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-teal-300 text-xs">{fmt(t.panjang * t.jumlahBatang * el.jumlahUnit * BERAT_PER_METER[t.diameter], 1)} kg</span>
                        <button onClick={() => hapusTulangan(el.id, idx)} className="text-red-400 hover:text-red-300 text-xs">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-teal-300">
                  Subtotal: {fmt(el.tulanganList.reduce((s, t) => s + t.panjang * t.jumlahBatang * el.jumlahUnit * BERAT_PER_METER[t.diameter], 0), 1)} kg
                </span>
                <button onClick={() => hapusElemen(el.id)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Hapus Elemen
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={tambahElemen} variant="outline" className="border-teal-600 text-teal-300 hover:bg-teal-900/30">
            <Plus className="h-4 w-4 mr-1" /> Tambah Elemen
          </Button>
          <Button onClick={hitung} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
            Hitung Kebutuhan Tulangan
          </Button>
          {hasil && (
            <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Berat", value: `${fmt(hasil.totalBeratKg, 0)} kg`, sub: `${fmt(hasil.totalBeratTon, 3)} ton`, color: "text-teal-300" },
                { label: "Total Panjang", value: `${fmt(hasil.totalPanjangM, 0)} m`, sub: `semua batang`, color: "text-blue-300" },
                { label: "BJTD 40", value: `${fmt(hasil.beratPerMutu.BJTD40, 0)} kg`, sub: `mutu tinggi`, color: "text-orange-300" },
                { label: "Estimasi Biaya", value: fmtRp(hasil.biayaEstimasi), sub: `incl. upah potong-bengkok`, color: "text-green-300" },
              ].map(item => (
                <div key={item.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
                  <div className={`text-xl font-bold ${item.color} mb-0.5`}>{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Rekapitulasi per Mutu Baja</h3>
              <div className="grid grid-cols-3 gap-3">
                {(["BJTP24","BJTD32","BJTD40"] as MutuBaja[]).map(m => (
                  <div key={m} className="bg-slate-800/60 rounded-lg p-3 text-center">
                    <div className="text-teal-300 font-bold">{fmt(hasil.beratPerMutu[m], 0)} kg</div>
                    <div className="text-white text-sm">{m}</div>
                    <div className="text-slate-500 text-xs">{fmtRp(hasil.beratPerMutu[m] * HARGA_PER_KG[m])}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <button onClick={() => setShowDetail(!showDetail)} className="w-full flex items-center justify-between text-white font-semibold mb-1">
                <span>Rekapitulasi per Diameter</span>
                <span className="text-slate-400 text-sm">{showDetail ? "Sembunyikan" : "Tampilkan"}</span>
              </button>
              {showDetail && (
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="text-left py-2">Diameter</th>
                      <th className="text-right py-2">Jumlah Batang</th>
                      <th className="text-right py-2">Total Panjang</th>
                      <th className="text-right py-2">Berat (kg)</th>
                      <th className="text-right py-2">Berat (ton)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.ringkasanDiameter.map(r => (
                      <tr key={r.diameter} className="text-slate-300 border-b border-slate-800/60">
                        <td className="py-2 font-medium text-teal-300">{r.diameter}</td>
                        <td className="text-right">{fmt(r.jumlah, 0)} btg</td>
                        <td className="text-right">{fmt(r.panjangTotal, 1)} m</td>
                        <td className="text-right">{fmt(r.berat, 1)} kg</td>
                        <td className="text-right text-slate-400">{fmt(r.berat / 1000, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-xs text-slate-500">* Harga estimasi Jabodetabek. Belum termasuk kawat bendrat, biaya angkut, dan PPN. Konfirmasi ke supplier besi setempat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
