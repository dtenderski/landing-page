import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, DollarSign, ChevronRight, Info, TrendingUp,
  Calculator, CheckCircle2, AlertTriangle, PieChart
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda",
];

// Biaya dasar per jabatan (estimasi)
const BASE_LSP: Record<string, [number, number]> = {
  "K3 Konstruksi": [1500000, 3500000],
  "Manajemen Proyek": [2000000, 4000000],
  "Manajemen Konstruksi": [2000000, 3500000],
  "Quantity Surveyor": [1800000, 3500000],
  "Pengawas Konstruksi": [1500000, 3000000],
  "Manajemen Kontrak": [2000000, 4000000],
  "default": [1500000, 3500000],
};
const PELATIHAN_BASE: Record<string, [number, number]> = {
  "K3 Konstruksi": [1000000, 3000000],
  "Manajemen Proyek": [2000000, 5000000],
  "default": [1500000, 4000000],
};

function getRange(jabatan: string, map: Record<string, [number, number]>): [number, number] {
  for (const key of Object.keys(map)) {
    if (jabatan.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return map["default"];
}

function formatRp(n: number): string {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1).replace(".0", "")} jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const LEVEL_MULTIPLIER: Record<string, number> = { "Muda": 1, "Madya": 1.3, "Utama": 1.7 };
const KOTA_ADD: Record<string, number> = {
  "Jakarta / Jabodetabek": 500000, "Surabaya / Jawa Timur": 200000,
  "Bandung / Jawa Barat": 200000, "Semarang / Jawa Tengah": 100000,
  "Kota Lain Jawa": 0, "Luar Jawa": -200000,
};
const CPD_COST = [200000, 800000];
const DOKUMEN_COST = [150000, 400000];
const TRANSPORT_COST: Record<string, [number, number]> = {
  "Dalam kota (< 30 km)": [0, 200000],
  "Luar kota (30–200 km)": [200000, 600000],
  "Perlu menginap": [500000, 1500000],
};

export default function EstimatorBiayaSertifikasi() {
  const [jabatan, setJabatan] = useState("");
  const [ikutPelatihan, setIkutPelatihan] = useState(true);
  const [kota, setKota] = useState("Jakarta / Jabodetabek");
  const [jarak, setJarak] = useState("Dalam kota (< 30 km)");
  const [retake, setRetake] = useState(false);
  const [result, setResult] = useState<{ min: number; max: number; items: { label: string; min: number; max: number }[] } | null>(null);

  function hitung() {
    if (!jabatan) return;
    const level = jabatan.includes("Utama") ? "Utama" : jabatan.includes("Madya") ? "Madya" : "Muda";
    const mult = LEVEL_MULTIPLIER[level];
    const kotaAdd = KOTA_ADD[kota] ?? 0;
    const [lspMin, lspMax] = getRange(jabatan, BASE_LSP).map(v => Math.round((v * mult + kotaAdd) / 50000) * 50000) as [number, number];
    const [pelMin, pelMax] = ikutPelatihan ? getRange(jabatan, PELATIHAN_BASE).map(v => Math.round(v / 50000) * 50000) as [number, number] : [0, 0];
    const [dokMin, dokMax] = [DOKUMEN_COST[0], DOKUMEN_COST[1]];
    const [transMin, transMax] = TRANSPORT_COST[jarak] ?? [0, 0];
    const [cpdMin, cpdMax] = [CPD_COST[0], CPD_COST[1]];
    const retakeAdd = retake ? lspMin * 0.5 : 0;
    const items = [
      { label: "Biaya Asesmen LSP", min: lspMin, max: lspMax },
      ...(ikutPelatihan ? [{ label: "Pelatihan / Bimbel Pra-Asesmen", min: pelMin, max: pelMax }] : []),
      { label: "Persiapan Dokumen & Fotokopi", min: dokMin, max: dokMax },
      { label: "Transportasi & Akomodasi", min: transMin, max: transMax },
      { label: "Kegiatan CPD Pendukung", min: cpdMin, max: cpdMax },
      ...(retake ? [{ label: "Buffer Biaya Asesmen Ulang (est. 50%)", min: Math.round(retakeAdd), max: Math.round(retakeAdd * 1.5) }] : []),
    ];
    const min = items.reduce((a, i) => a + i.min, 0);
    const max = items.reduce((a, i) => a + i.max, 0);
    setResult({ min, max, items });
  }

  useEffect(() => { if (jabatan) hitung(); }, [jabatan, ikutPelatihan, kota, jarak, retake]);

  const total = result ? Math.round((result.min + result.max) / 2) : 0;
  const pct = (v: number) => result ? Math.round((v / result.max) * 100) : 0;
  const BAR_COLORS = ["bg-blue-400", "bg-violet-400", "bg-amber-400", "bg-teal-400", "bg-green-400", "bg-red-400"];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-sky-400" /> Estimator Biaya Sertifikasi SKK
            </h1>
            <p className="text-xs text-slate-400">Estimasi total biaya dari awal hingga sertifikat terbit — LSP, pelatihan, dokumen, transportasi, CPD</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">Estimasi berdasarkan rentang biaya pasar 2024–2025. Biaya aktual tergantung LSP yang dipilih dan kondisi masing-masing.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mb-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Pilih jabatan SKK...</option>
              {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Kota / Wilayah</label>
              <select value={kota} onChange={e => setKota(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none">
                {Object.keys(KOTA_ADD).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Jarak ke Lokasi Asesmen</label>
              <select value={jarak} onChange={e => setJarak(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none">
                {Object.keys(TRANSPORT_COST).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setIkutPelatihan(!ikutPelatihan)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${ikutPelatihan ? "bg-sky-500" : "bg-slate-700"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ikutPelatihan ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-xs text-slate-300">Ikut pelatihan / bimbel pra-asesmen</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setRetake(!retake)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${retake ? "bg-sky-500" : "bg-slate-700"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${retake ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-xs text-slate-300">Tambahkan buffer biaya asesmen ulang</span>
            </label>
          </div>
        </div>

        {result && jabatan ? (
          <>
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 mb-4">
              <p className="text-xs text-slate-400 mb-1">{jabatan} · {kota}</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Minimum</p>
                  <p className="text-lg font-bold text-slate-300">{formatRp(result.min)}</p>
                </div>
                <div className="text-center rounded-xl bg-sky-500/15 border border-sky-500/30 py-2">
                  <p className="text-[10px] text-sky-400 mb-0.5 font-semibold">Estimasi Tengah</p>
                  <p className="text-xl font-bold text-sky-300">{formatRp(total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Maksimum</p>
                  <p className="text-lg font-bold text-slate-300">{formatRp(result.max)}</p>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="h-3 flex rounded-full overflow-hidden mb-3 gap-px">
                {result.items.map((item, i) => (
                  <div key={i} className={`${BAR_COLORS[i % BAR_COLORS.length]} transition-all`} style={{ width: `${pct(item.max)}%` }} />
                ))}
              </div>

              <div className="space-y-1.5">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                      <span className="text-xs text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-xs text-slate-300 font-medium">{formatRp(item.min)}–{formatRp(item.max)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/8 bg-white/2 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Jika bayar sendiri (cicil 6 bln)</p>
                <p className="text-sm font-bold text-white">{formatRp(Math.round(total / 6 / 50000) * 50000)}</p>
                <p className="text-[10px] text-slate-500">per bulan</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/2 p-3">
                <p className="text-[10px] text-slate-500 mb-1">ROI (kenaikan gaji est.)</p>
                <p className="text-sm font-bold text-emerald-400">{formatRp(Math.round(total * 3.5 / 50000) * 50000)}</p>
                <p className="text-[10px] text-slate-500">per tahun ekstra</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4">
              <p className="text-amber-400 text-xs font-semibold mb-1 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Tips Hemat Biaya Sertifikasi</p>
              <ul className="space-y-1 text-xs text-slate-300">
                <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />Tanyakan ke perusahaan — banyak BUJK mau menanggung biaya sertifikasi tenaga ahlinya</li>
                <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />Daftar ke LSP 2–3 bulan sebelumnya untuk dapat harga reguler, hindari slot mendesak</li>
                <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />Kumpulkan dokumen sendiri (tanpa jasa agen) untuk hemat Rp 300–500 ribu</li>
              </ul>
            </div>
          </>
        ) : !jabatan ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
            <Calculator className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Pilih jabatan SKK untuk melihat estimasi biaya</p>
          </div>
        ) : null}

        <div className="flex gap-3 mt-2">
          <Button asChild variant="outline" className="flex-1 text-xs">
            <Link href="/kalkulator-rpl">Kalkulator RPL →</Link>
          </Button>
          <Button asChild className="flex-1 bg-sky-600 hover:bg-sky-700 text-xs">
            <Link href="/panduan-pemilihan-lsp">Panduan Pilih LSP →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
