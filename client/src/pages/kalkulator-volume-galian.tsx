import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type MetodeHitung = "average-area" | "prismatoid" | "grid";
type SatuanVolume = "m3" | "bcm" | "lcm";
type TipeGalian = "fondasi" | "basement" | "saluran" | "cut-fill" | "kolam";

interface Segmen { id: number; nama: string; panjang: number; luasA: number; luasB?: number; luasTengah?: number; }

function hitungAvgArea(s: Segmen) { return ((s.luasA + (s.luasB ?? s.luasA)) / 2) * s.panjang; }
function hitungPrismatoid(s: Segmen) { return (s.panjang / 6) * (s.luasA + 4 * (s.luasTengah ?? ((s.luasA + (s.luasB ?? s.luasA)) / 2)) + (s.luasB ?? s.luasA)); }

const FAKTOR_KONVERSI = { fondasi: { tanah_biasa: 1.0, pasir: 0.95, lempung: 1.1, batuan_lunak: 1.3 }, basement: { tanah_biasa: 1.05, pasir: 0.98, lempung: 1.12, batuan_lunak: 1.35 }, saluran: { tanah_biasa: 1.0, pasir: 0.9, lempung: 1.08, batuan_lunak: 1.25 }, "cut-fill": { tanah_biasa: 1.0, pasir: 0.95, lempung: 1.1, batuan_lunak: 1.28 }, kolam: { tanah_biasa: 1.02, pasir: 0.96, lempung: 1.08, batuan_lunak: 1.22 } };
const HARGA_GALI: Record<string, number> = { tanah_biasa: 65000, pasir: 45000, lempung: 90000, batuan_lunak: 180000 };
const HARGA_BUANG: Record<string, number> = { tanah_biasa: 35000, pasir: 25000, lempung: 40000, batuan_lunak: 80000 };

const JENIS_TANAH_OPTIONS = [
  { value: "tanah_biasa", label: "Tanah Biasa / Urug", desc: "Tanah gembur, mudah digali" },
  { value: "pasir", label: "Pasir / Pasir Berbatu", desc: "Material granular, swell factor rendah" },
  { value: "lempung", label: "Lempung / Tanah Liat", desc: "Kohesif, swell factor tinggi" },
  { value: "batuan_lunak", label: "Batuan Lunak / Weathered Rock", desc: "Perlu ripper/blasting ringan" },
];

export default function KalkulatorVolumeGalian() {
  const [tipe, setTipe] = useState<TipeGalian>("fondasi");
  const [metode, setMetode] = useState<MetodeHitung>("average-area");
  const [jenisTanah, setJenisTanah] = useState("tanah_biasa");
  const [satuan, setSatuan] = useState<SatuanVolume>("m3");
  const [faktorTimbunan, setFaktorTimbunan] = useState(0.9);
  const [segmen, setSegmen] = useState<Segmen[]>([{ id: 1, nama: "Segmen 1", panjang: 10, luasA: 6, luasB: 6, luasTengah: 6 }]);
  const [hitung, setHitung] = useState(false);

  function addSegmen() {
    setSegmen(prev => [...prev, { id: Date.now(), nama: `Segmen ${prev.length + 1}`, panjang: 10, luasA: 6, luasB: 6, luasTengah: 6 }]);
  }
  function updateSegmen(id: number, field: keyof Segmen, val: string | number) {
    setSegmen(prev => prev.map(s => s.id === id ? { ...s, [field]: typeof val === "string" ? val : Number(val) } : s));
  }
  function removeSegmen(id: number) { setSegmen(prev => prev.filter(s => s.id !== id)); }

  const totalGalian = segmen.reduce((sum, s) => {
    return sum + (metode === "prismatoid" ? hitungPrismatoid(s) : hitungAvgArea(s));
  }, 0);

  const fk = FAKTOR_KONVERSI[tipe][jenisTanah as keyof typeof FAKTOR_KONVERSI["fondasi"]] ?? 1.0;
  const volBCM = totalGalian * fk;
  const volTimbunan = totalGalian * faktorTimbunan;
  const kelebihan = totalGalian - volTimbunan;

  function getSatuanVol(v: number) {
    if (satuan === "bcm") return (v * fk).toFixed(2) + " BCM";
    if (satuan === "lcm") return (v * (fk * 0.75)).toFixed(2) + " LCM";
    return v.toFixed(2) + " m³";
  }

  const biayaGali = totalGalian * HARGA_GALI[jenisTanah];
  const biayaBuang = kelebihan > 0 ? kelebihan * HARGA_BUANG[jenisTanah] : 0;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-400" /> Kalkulator Volume Galian & Timbunan
            </h1>
            <p className="text-xs text-slate-400">Average End Area · Prismatoid · Cut & Fill · Estimasi biaya pekerjaan tanah</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          <Badge variant="outline" className="text-teal-400 border-teal-400/30">Gelombang 19</Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600">Frontend</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Tipe Galian */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs text-slate-400 mb-3">Tipe Pekerjaan Galian</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["fondasi","basement","saluran","cut-fill","kolam"] as TipeGalian[]).map(t => (
                <button key={t} onClick={() => setTipe(t)}
                  className={`rounded-lg border py-1.5 px-2 text-xs capitalize transition-all ${tipe === t ? "bg-teal-500/10 border-teal-400/30 text-teal-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Jenis Tanah */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs text-slate-400 mb-3">Jenis Material</p>
            <div className="space-y-1.5">
              {JENIS_TANAH_OPTIONS.map(j => (
                <button key={j.value} onClick={() => setJenisTanah(j.value)}
                  className={`w-full text-left rounded-lg border py-1.5 px-2.5 transition-all ${jenisTanah === j.value ? "bg-teal-500/10 border-teal-400/30" : "border-white/10 hover:border-white/20"}`}>
                  <p className={`text-xs font-medium ${jenisTanah === j.value ? "text-teal-300" : "text-slate-300"}`}>{j.label}</p>
                  <p className="text-[10px] text-slate-500">{j.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metode & Satuan */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">Metode Perhitungan</p>
              <div className="flex gap-1.5">
                {(["average-area","prismatoid"] as MetodeHitung[]).map(m => (
                  <button key={m} onClick={() => setMetode(m)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs transition-all ${metode === m ? "bg-teal-500/10 border-teal-400/30 text-teal-300" : "border-white/10 text-slate-400"}`}>
                    {m === "average-area" ? "Avg End Area" : "Prismatoid"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">Satuan Volume</p>
              <div className="flex gap-1.5">
                {(["m3","bcm","lcm"] as SatuanVolume[]).map(s => (
                  <button key={s} onClick={() => setSatuan(s)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs uppercase transition-all ${satuan === s ? "bg-teal-500/10 border-teal-400/30 text-teal-300" : "border-white/10 text-slate-400"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-1">Faktor Kompaksi Timbunan: <span className="text-teal-400">{(faktorTimbunan * 100).toFixed(0)}%</span></p>
            <input type="range" min={0.7} max={1.0} step={0.01} value={faktorTimbunan} onChange={e => setFaktorTimbunan(+e.target.value)} className="w-full accent-teal-500" />
            <div className="flex justify-between text-[9px] text-slate-600"><span>70% (lepas)</span><span>100% (kompak)</span></div>
          </div>
        </div>

        {/* Segmen */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-semibold">Data Segmen Galian</p>
            <button onClick={addSegmen} className="text-xs bg-teal-500/10 border border-teal-400/30 text-teal-400 rounded-lg px-2.5 py-1 hover:bg-teal-500/20 transition-colors">+ Tambah Segmen</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-white/8">
                  <th className="text-left py-1.5 pr-3">Nama</th>
                  <th className="text-right pr-3">Panjang (m)</th>
                  <th className="text-right pr-3">Luas A (m²)</th>
                  <th className="text-right pr-3">Luas B (m²)</th>
                  {metode === "prismatoid" && <th className="text-right pr-3">Luas Tengah (m²)</th>}
                  <th className="text-right pr-3">Volume</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {segmen.map(s => {
                  const vol = metode === "prismatoid" ? hitungPrismatoid(s) : hitungAvgArea(s);
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="py-1.5 pr-3"><input value={s.nama} onChange={e => updateSegmen(s.id, "nama", e.target.value)} className="w-24 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-white text-xs" /></td>
                      <td className="pr-3"><input type="number" value={s.panjang} onChange={e => updateSegmen(s.id, "panjang", e.target.value)} min={0.1} step={0.1} className="w-20 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-right text-white text-xs" /></td>
                      <td className="pr-3"><input type="number" value={s.luasA} onChange={e => updateSegmen(s.id, "luasA", e.target.value)} min={0.01} step={0.01} className="w-20 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-right text-white text-xs" /></td>
                      <td className="pr-3"><input type="number" value={s.luasB ?? s.luasA} onChange={e => updateSegmen(s.id, "luasB", e.target.value)} min={0.01} step={0.01} className="w-20 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-right text-white text-xs" /></td>
                      {metode === "prismatoid" && <td className="pr-3"><input type="number" value={s.luasTengah ?? ((s.luasA + (s.luasB ?? s.luasA)) / 2)} onChange={e => updateSegmen(s.id, "luasTengah", e.target.value)} min={0.01} step={0.01} className="w-20 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-right text-white text-xs" /></td>}
                      <td className="text-teal-400 text-right pr-3 font-medium">{vol.toFixed(2)} m³</td>
                      <td><button onClick={() => removeSegmen(s.id)} className="text-red-400/50 hover:text-red-400 transition-colors px-1"><RotateCcw className="h-3 w-3" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hasil */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Volume Galian (BM)", value: totalGalian.toFixed(2) + " m³", color: "text-teal-400", sub: "Bank Measure" },
            { label: "Volume (BCM)", value: volBCM.toFixed(2) + " BCM", color: "text-blue-400", sub: `FK = ${fk}` },
            { label: "Kebutuhan Timbunan", value: volTimbunan.toFixed(2) + " m³", color: "text-emerald-400", sub: `${(faktorTimbunan*100).toFixed(0)}% kompaksi` },
            { label: "Kelebihan Galian", value: (kelebihan > 0 ? kelebihan : 0).toFixed(2) + " m³", color: kelebihan > 0 ? "text-amber-400" : "text-slate-500", sub: "perlu dibuang" },
          ].map((r, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 text-center">
              <p className={`text-base font-bold ${r.color}`}>{r.value}</p>
              <p className="text-white text-xs font-medium mt-0.5">{r.label}</p>
              <p className="text-slate-500 text-[10px]">{r.sub}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <p className="text-xs text-slate-400 font-semibold mb-3">Estimasi Biaya Pekerjaan Tanah</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Biaya penggalian ({jenisTanah})</span>
              <span className="text-white font-medium">Rp {biayaGali.toLocaleString("id-ID")}</span>
            </div>
            {kelebihan > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Biaya pembuangan tanah sisa</span>
                <span className="text-white font-medium">Rp {biayaBuang.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-teal-400 font-semibold text-sm">Total Estimasi</span>
              <span className="text-teal-400 font-bold text-sm">Rp {(biayaGali + biayaBuang).toLocaleString("id-ID")}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">* Estimasi menggunakan harga satuan AHSP Permen PUPR 28/2016. Aktualkan dengan harga pasar setempat.</p>
        </div>
      </div>
    </div>
  );
}
