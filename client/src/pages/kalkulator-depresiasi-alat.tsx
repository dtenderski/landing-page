import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wrench, Info, TrendingDown, BarChart3 } from "lucide-react";
import { Link } from "wouter";

const JENIS_ALAT = [
  "Excavator (Backhoe)", "Bulldozer", "Motor Grader", "Compactor / Vibro",
  "Wheel Loader", "Dump Truck", "Concrete Mixer Truck", "Concrete Pump",
  "Tower Crane", "Mobile Crane", "Scaffolding Set", "Generator Set",
  "Jack Hammer / Drilling Rig", "Forklift", "Asphalt Finisher",
];

const METODE = [
  { key: "sl", label: "Straight Line (SL) — Penyusutan Seragam", desc: "Depresiasi sama setiap tahun" },
  { key: "db", label: "Double Declining Balance (DDB) — Saldo Menurun Ganda", desc: "Depresiasi besar di awal" },
  { key: "syd", label: "Sum of Years Digits (SYD) — Jumlah Angka Tahun", desc: "Depresiasi akselerasi sedang" },
];

function fmt(n: number) { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); }

interface TahunRow { tahun: number; depresiasiTahun: number; akumulasi: number; nilaiBuku: number; persentase: number }

function calcSL(nilai: number, salvage: number, umur: number): TahunRow[] {
  const dep = (nilai - salvage) / umur;
  let nb = nilai;
  return Array.from({ length: umur }, (_, i) => {
    const d = dep; nb -= d;
    return { tahun: i + 1, depresiasiTahun: d, akumulasi: (i + 1) * d, nilaiBuku: Math.max(nb, salvage), persentase: (d / nilai) * 100 };
  });
}

function calcDDB(nilai: number, salvage: number, umur: number): TahunRow[] {
  const rate = 2 / umur;
  let nb = nilai;
  let akum = 0;
  return Array.from({ length: umur }, (_, i) => {
    const d = Math.max(0, Math.min(nb * rate, nb - salvage));
    nb -= d; akum += d;
    return { tahun: i + 1, depresiasiTahun: d, akumulasi: akum, nilaiBuku: Math.max(nb, salvage), persentase: (d / nilai) * 100 };
  });
}

function calcSYD(nilai: number, salvage: number, umur: number): TahunRow[] {
  const total = (umur * (umur + 1)) / 2;
  let nb = nilai; let akum = 0;
  return Array.from({ length: umur }, (_, i) => {
    const d = ((nilai - salvage) * (umur - i)) / total;
    nb -= d; akum += d;
    return { tahun: i + 1, depresiasiTahun: d, akumulasi: akum, nilaiBuku: Math.max(nb, salvage), persentase: (d / nilai) * 100 };
  });
}

export default function KalkulatorDepresiasiAlat() {
  const [jenisAlat, setJenisAlat] = useState(JENIS_ALAT[0]);
  const [nilaiPerolehan, setNilaiPerolehan] = useState(0);
  const [nilaiSalvage, setNilaiSalvage] = useState(0);
  const [umurEkonomis, setUmurEkonomis] = useState(5);
  const [metode, setMetode] = useState("sl");
  const [calculated, setCalculated] = useState(false);

  const rows: TahunRow[] = (() => {
    if (!calculated || nilaiPerolehan <= 0) return [];
    if (metode === "sl") return calcSL(nilaiPerolehan, nilaiSalvage, umurEkonomis);
    if (metode === "db") return calcDDB(nilaiPerolehan, nilaiSalvage, umurEkonomis);
    return calcSYD(nilaiPerolehan, nilaiSalvage, umurEkonomis);
  })();

  const maxDep = rows.length ? Math.max(...rows.map(r => r.depresiasiTahun)) : 1;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-400" /> Kalkulator Depresiasi Alat Berat
            </h1>
            <p className="text-xs text-slate-400">Hitung penyusutan alat berat dengan metode SL, DDB, atau SYD — cocok untuk analisis biaya proyek & laporan keuangan</p>
          </div>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-300">Depresiasi alat berat diperlukan untuk: penentuan harga satuan alat di RAB, biaya kepemilikan (owning cost) analisis sewa vs beli, dan laporan keuangan BUJK sesuai PSAK.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jenis Alat Berat</label>
            <select value={jenisAlat} onChange={e => { setJenisAlat(e.target.value); setCalculated(false); }}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
              {JENIS_ALAT.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Nilai Perolehan (Rp)</label>
              <input type="number" value={nilaiPerolehan || ""} onChange={e => { setNilaiPerolehan(+e.target.value); setCalculated(false); }}
                placeholder="cth: 1500000000"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Nilai Sisa / Salvage (Rp)</label>
              <input type="number" value={nilaiSalvage || ""} onChange={e => { setNilaiSalvage(+e.target.value); setCalculated(false); }}
                placeholder="cth: 150000000"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Umur Ekonomis: <span className="text-orange-400 font-bold">{umurEkonomis} tahun</span></label>
            <input type="range" min={1} max={20} value={umurEkonomis} onChange={e => { setUmurEkonomis(+e.target.value); setCalculated(false); }}
              className="w-full accent-orange-500" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-0.5"><span>1 thn</span><span>20 thn</span></div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Metode Depresiasi</label>
            <div className="space-y-1.5">
              {METODE.map(m => (
                <button key={m.key} onClick={() => { setMetode(m.key); setCalculated(false); }}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${metode === m.key ? "bg-orange-500/10 border-orange-400/30" : "border-white/10 hover:border-white/20"}`}>
                  <p className={`text-xs font-medium ${metode === m.key ? "text-orange-300" : "text-white"}`}>{m.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setCalculated(true)} disabled={nilaiPerolehan <= 0} className="w-full bg-orange-600 hover:bg-orange-700">
            Hitung Depresiasi
          </Button>
        </div>

        {calculated && rows.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                ["Nilai Perolehan", fmt(nilaiPerolehan), "text-white"],
                ["Total Depresiasi", fmt(nilaiPerolehan - nilaiSalvage), "text-orange-400"],
                ["Nilai Sisa", fmt(nilaiSalvage), "text-slate-300"],
              ].map(([l, v, c]) => (
                <div key={l} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                  <p className="text-[9px] text-slate-500 mb-1">{l}</p>
                  <p className={`text-xs font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 mb-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-400" />
                <p className="text-sm text-white font-semibold">Tabel Depresiasi — {METODE.find(m => m.key === metode)?.label.split(" — ")[0]}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/8">{["Tahun","Depresiasi/Tahun","Akumulasi","Nilai Buku","%"].map(h => <th key={h} className="text-left text-slate-500 py-2.5 px-3">{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.tahun} className="border-b border-white/5 hover:bg-white/2">
                        <td className="py-2 px-3 text-slate-400 font-medium">Tahun {r.tahun}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 rounded-full bg-orange-500/30" style={{ width: `${(r.depresiasiTahun / maxDep) * 60}px` }}>
                              <div className="h-full rounded-full bg-orange-500" style={{ width: "100%" }} />
                            </div>
                            <span className="text-orange-400 font-semibold">{fmt(r.depresiasiTahun)}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{fmt(r.akumulasi)}</td>
                        <td className="py-2 px-3 text-white">{fmt(r.nilaiBuku)}</td>
                        <td className="py-2 px-3 text-slate-500">{r.persentase.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-xs">
              <Link href="/rab-kalkulator">Gunakan di Kalkulator RAB →</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
