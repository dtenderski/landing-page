import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, DollarSign, ChevronRight, Info, TrendingUp,
  Building2, MapPin, Briefcase, RefreshCw
} from "lucide-react";
import { Link } from "wouter";

const JABATAN_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya", "Ahli Manajemen Proyek — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Pengawas Konstruksi — Madya",
  "Ahli Manajemen Kontrak — Muda", "Ahli Manajemen Kontrak — Madya",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

const KOTA_MULTIPLIER: Record<string, number> = {
  "Jakarta": 1.5, "Surabaya": 1.3, "Bandung": 1.2, "Medan": 1.1,
  "Semarang": 1.15, "Makassar": 1.1, "Bali/Denpasar": 1.25,
  "Balikpapan/Kaltim": 1.35, "Papua": 1.5, "Kota lain (Pulau Jawa)": 1.0,
  "Kota lain (Luar Jawa)": 1.1,
};

const JENIS_KONTRAK = ["Tetap / Permanen", "Kontrak Per Proyek", "Kontrak Tahunan", "Freelance / Konsultan"];

const BASE_RATES: Record<string, { muda: [number, number]; madya: [number, number]; utama: [number, number] }> = {
  "K3": { muda: [6000000, 10000000], madya: [10000000, 18000000], utama: [18000000, 30000000] },
  "ManajemenProyek": { muda: [7000000, 12000000], madya: [12000000, 22000000], utama: [22000000, 40000000] },
  "ManajemenKonstruksi": { muda: [6500000, 11000000], madya: [11000000, 20000000], utama: [20000000, 35000000] },
  "QS": { muda: [6000000, 10000000], madya: [10000000, 18000000], utama: [18000000, 32000000] },
  "Pengawas": { muda: [5500000, 9000000], madya: [9000000, 16000000], utama: [16000000, 28000000] },
  "Kontrak": { muda: [7000000, 12000000], madya: [12000000, 22000000], utama: [22000000, 38000000] },
  "Teknik": { muda: [5500000, 9500000], madya: [9500000, 17000000], utama: [17000000, 30000000] },
  "default": { muda: [5500000, 9000000], madya: [9000000, 16000000], utama: [16000000, 28000000] },
};

function getBaseRate(jabatan: string): [number, number] {
  const j = jabatan.toLowerCase();
  const level = jabatan.includes("Utama") ? "utama" : jabatan.includes("Madya") ? "madya" : "muda";
  let cat = "default";
  if (j.includes("k3")) cat = "K3";
  else if (j.includes("manajemen proyek") || j.includes("management")) cat = "ManajemenProyek";
  else if (j.includes("manajemen konstruksi")) cat = "ManajemenKonstruksi";
  else if (j.includes("quantity") || j.includes("qs")) cat = "QS";
  else if (j.includes("pengawas")) cat = "Pengawas";
  else if (j.includes("kontrak")) cat = "Kontrak";
  else if (j.includes("teknik") || j.includes("arsitektur") || j.includes("mekanikal") || j.includes("elektrikal")) cat = "Teknik";
  return BASE_RATES[cat][level];
}

function formatRupiah(n: number): string {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1).replace(".0", "")} jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function KalkulatorUpahSKK() {
  const [jabatan, setJabatan] = useState("");
  const [kota, setKota] = useState("Jakarta");
  const [pengalaman, setPengalaman] = useState(2);
  const [jenisKontrak, setJenisKontrak] = useState("Tetap / Permanen");
  const [proyek, setProyek] = useState("Menengah (Rp 5–50 M)");
  const [result, setResult] = useState<{ min: number; max: number; rekomendasi: number; faktorPengaruh: string[] } | null>(null);

  const proyekMultiplier: Record<string, number> = {
    "Kecil (< Rp 5 M)": 0.85, "Menengah (Rp 5–50 M)": 1.0,
    "Besar (Rp 50–500 M)": 1.2, "Mega (> Rp 500 M)": 1.45,
  };
  const kontrakMultiplier: Record<string, number> = {
    "Tetap / Permanen": 1.0, "Kontrak Per Proyek": 1.15,
    "Kontrak Tahunan": 0.95, "Freelance / Konsultan": 1.3,
  };

  function hitung() {
    if (!jabatan) return;
    const [baseMin, baseMax] = getBaseRate(jabatan);
    const kotaMult = KOTA_MULTIPLIER[kota] ?? 1.0;
    const pengalamanMult = 1 + (pengalaman * 0.04);
    const proyekMult = proyekMultiplier[proyek] ?? 1.0;
    const kontrakMult = kontrakMultiplier[jenisKontrak] ?? 1.0;
    const totalMult = kotaMult * pengalamanMult * proyekMult * kontrakMult;
    const min = Math.round((baseMin * totalMult) / 500000) * 500000;
    const max = Math.round((baseMax * totalMult) / 500000) * 500000;
    const rekomendasi = Math.round(((min + max) / 2) / 500000) * 500000;
    const faktor: string[] = [];
    if (kotaMult > 1.2) faktor.push(`Lokasi ${kota} menaikkan standar +${Math.round((kotaMult - 1) * 100)}%`);
    if (pengalamanMult > 1.1) faktor.push(`${pengalaman} tahun pengalaman menaikkan +${Math.round((pengalamanMult - 1) * 100)}%`);
    if (proyekMult > 1) faktor.push(`Proyek ${proyek} menaikkan standar +${Math.round((proyekMult - 1) * 100)}%`);
    if (kontrakMult > 1) faktor.push(`${jenisKontrak} biasanya lebih tinggi +${Math.round((kontrakMult - 1) * 100)}% vs tetap`);
    setResult({ min, max, rekomendasi, faktorPengaruh: faktor });
  }

  useEffect(() => { if (jabatan) hitung(); }, [jabatan, kota, pengalaman, jenisKontrak, proyek]);

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" /> Kalkulator Standar Upah SKK
            </h1>
            <p className="text-xs text-slate-400">Estimasi rentang upah wajar berdasarkan jabatan, level, lokasi, dan pengalaman</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">Estimasi berdasarkan data pasar konstruksi Indonesia. Hanya untuk referensi negosiasi — upah aktual dipengaruhi kebijakan perusahaan, proyek spesifik, dan kondisi pasar.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400/50">
              <option value="">Pilih jabatan SKK...</option>
              {JABATAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Kota / Wilayah</label>
              <select value={kota} onChange={e => setKota(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.keys(KOTA_MULTIPLIER).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Skala Proyek</label>
              <select value={proyek} onChange={e => setProyek(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.keys(proyekMultiplier).map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Pengalaman Kerja: <span className="text-green-400 font-semibold">{pengalaman} tahun</span></label>
            <input type="range" min={0} max={25} value={pengalaman} onChange={e => setPengalaman(parseInt(e.target.value))}
              className="w-full accent-green-500" />
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5"><span>0 th</span><span>5 th</span><span>10 th</span><span>15 th</span><span>20 th</span><span>25 th</span></div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jenis Kontrak</label>
            <div className="grid grid-cols-2 gap-1.5">
              {JENIS_KONTRAK.map(j => (
                <button key={j} onClick={() => setJenisKontrak(j)}
                  className={`rounded-lg border py-2 text-xs transition-all text-left px-3 ${jenisKontrak === j ? "bg-green-500/15 border-green-400/40 text-green-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                  {j}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && jabatan && (
          <>
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 mb-4">
              <p className="text-xs text-slate-400 mb-3">{jabatan} · {kota} · {pengalaman} th pengalaman · {jenisKontrak}</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="rounded-xl bg-slate-900/60 p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Batas Bawah</p>
                  <p className="text-lg font-bold text-slate-300">{formatRupiah(result.min)}</p>
                  <p className="text-[9px] text-slate-600">/bulan</p>
                </div>
                <div className="rounded-xl bg-green-500/15 border border-green-500/30 p-3 text-center">
                  <p className="text-[10px] text-green-400 mb-1 font-semibold">Rekomendasi</p>
                  <p className="text-xl font-bold text-green-300">{formatRupiah(result.rekomendasi)}</p>
                  <p className="text-[9px] text-green-600">/bulan</p>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Batas Atas</p>
                  <p className="text-lg font-bold text-slate-300">{formatRupiah(result.max)}</p>
                  <p className="text-[9px] text-slate-600">/bulan</p>
                </div>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-gradient-to-r from-green-700 via-green-400 to-emerald-300 opacity-70" style={{ width: "100%" }} />
              </div>
              {result.faktorPengaruh.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Faktor yang Mempengaruhi</p>
                  <ul className="space-y-0.5">{result.faktorPengaruh.map((f, i) => <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />{f}</li>)}</ul>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/8 bg-white/2 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Jika Kontrak Per Proyek</p>
                <p className="text-sm font-bold text-white">{formatRupiah(Math.round(result.rekomendasi * 1.15 * 3 / 500000) * 500000)}</p>
                <p className="text-[10px] text-slate-500">per 3 bulan proyek</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/2 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Jika Freelance/Konsultan</p>
                <p className="text-sm font-bold text-white">{formatRupiah(Math.round(result.rekomendasi * 1.3 / 500000) * 500000)}</p>
                <p className="text-[10px] text-slate-500">per bulan (gross)</p>
              </div>
            </div>
          </>
        )}

        {!jabatan && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
            <DollarSign className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Pilih jabatan SKK untuk melihat estimasi upah</p>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <Button asChild variant="outline" className="flex-1 text-xs">
            <Link href="/biaya-tim-skk">Biaya Tim SKK →</Link>
          </Button>
          <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
            <Link href="/panduan-rekrutmen-skk">Panduan Rekrutmen →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
