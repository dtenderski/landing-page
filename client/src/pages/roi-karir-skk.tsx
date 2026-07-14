import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, TrendingUp, DollarSign,
  Target, RotateCcw, ChevronRight, Award, Calendar, BarChart2,
  ArrowUpRight, CheckCircle2, Lightbulb
} from "lucide-react";
import { Link } from "wouter";

const SKK_TARGET_LIST = [
  "Ahli K3 Konstruksi — Muda",
  "Ahli K3 Konstruksi — Madya",
  "Ahli K3 Konstruksi — Utama",
  "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Manajemen Konstruksi — Muda",
  "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda",
  "Ahli Quantity Surveyor — Madya",
  "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya",
  "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda",
  "Ahli Teknik Geoteknik — Muda",
  "Ahli Teknik Mekanikal — Muda",
  "Ahli Teknik Elektrikal — Muda",
  "Ahli Arsitektur — Muda",
];

const REGIONS = ["Jabodetabek", "Jawa (luar Jabodebak)", "Sumatera", "Kalimantan / Sulawesi", "Bali / NTB / NTT", "Papua / Maluku"];
const COMPANY_TYPES = [
  "BUJK Kecil (Grade K2–K3)",
  "BUJK Menengah (Grade M1–M2)",
  "BUJK Besar (Grade B1–B2)",
  "Instansi Pemerintah / BUMN",
  "Konsultan Konstruksi",
  "Mandiri / Freelance",
];

interface YearProjection {
  tahun: number;
  gajiEstimasi: number;
  kumulatifSelisih: number;
  milestone: string;
}

interface NextSKK {
  jabatan: string;
  potensiKenaikan: string;
  estimasiWaktu: string;
}

interface ROIResult {
  inputSummary: {
    jabatan: string;
    gajiSaatIni: number;
    targetSkk: string;
    wilayah: string;
    perusahaan: string;
  };
  biayaSertifikasi: {
    pendaftaran: number;
    bimtek: number;
    administrasi: number;
    total: number;
  };
  hasilSetelahSkk: {
    gajiMinimum: number;
    gajiMaksimum: number;
    rataRata: number;
    persentaseKenaikan: number;
    tambahanBulanan: number;
  };
  breakevenBulan: number;
  proyeksi5Tahun: YearProjection[];
  totalROI5Tahun: number;
  roiPersentase: number;
  benefitNonFinansial: string[];
  skklanjutan: NextSKK[];
  kesimpulan: string;
}

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} jt`;
  return `Rp ${(n / 1_000).toFixed(0)} rb`;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

export default function ROIKarirSKK() {
  const [jabatan, setJabatan] = useState("");
  const [gaji, setGaji] = useState(8);
  const [targetSkk, setTargetSkk] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [perusahaan, setPerusahaan] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ROIResult | null>(null);
  const [error, setError] = useState("");

  async function calculate() {
    if (!jabatan || !targetSkk || !wilayah || !perusahaan) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/roi-karir-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, gaji: gaji * 1_000_000, targetSkk, wilayah, perusahaan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal menghitung ROI.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
  }

  if (result) {
    const maxGaji = Math.max(...result.proyeksi5Tahun.map(y => y.gajiEstimasi));
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={reset} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white">ROI Sertifikasi SKK</h1>
                <p className="text-xs text-slate-400">{result.inputSummary.targetSkk}</p>
              </div>
            </div>
            <Button onClick={reset} size="sm" variant="outline" className="text-xs gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Hitung Ulang
            </Button>
          </div>

          {/* Hero ROI Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">Kenaikan Gaji Estimasi</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-400">+{result.hasilSetelahSkk.persentaseKenaikan}%</span>
                  <span className="text-slate-400 text-sm">per bulan</span>
                </div>
                <p className="text-emerald-300 text-sm mt-0.5">
                  {formatRp(result.inputSummary.gajiSaatIni)} → {formatRp(result.hasilSetelahSkk.rataRata)}/bln
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-1">ROI 5 Tahun</p>
                <p className="text-2xl font-bold text-teal-400">{result.roiPersentase}%</p>
                <p className="text-teal-300 text-xs">Total +{formatRp(result.totalROI5Tahun)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <div className="text-center">
                <p className="text-slate-500 text-xs">Biaya Total</p>
                <p className="text-white text-sm font-semibold">{formatRp(result.biayaSertifikasi.total)}</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-slate-500 text-xs">Tambahan/Bulan</p>
                <p className="text-emerald-400 text-sm font-semibold">+{formatRp(result.hasilSetelahSkk.tambahanBulanan)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-xs">Breakeven</p>
                <p className="text-white text-sm font-semibold">{result.breakevenBulan} bulan</p>
              </div>
            </div>
          </div>

          {/* Biaya Rincian */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
            <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Rincian Biaya Sertifikasi
            </p>
            {[
              { label: "Biaya Pendaftaran BNSP/LSP", val: result.biayaSertifikasi.pendaftaran },
              { label: "Bimtek / Pelatihan (opsional)", val: result.biayaSertifikasi.bimtek },
              { label: "Administrasi & Dokumen", val: result.biayaSertifikasi.administrasi },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-slate-300 text-xs">{item.label}</span>
                <span className="text-white text-xs font-medium">{formatRp(item.val)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-1">
              <span className="text-slate-400 text-xs font-semibold">Total Investasi</span>
              <span className="text-amber-400 text-sm font-bold">{formatRp(result.biayaSertifikasi.total)}</span>
            </div>
          </div>

          {/* Proyeksi 5 Tahun */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
            <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" /> Proyeksi Gaji 5 Tahun
            </p>
            <div className="space-y-2.5">
              {result.proyeksi5Tahun.map((yr) => (
                <div key={yr.tahun}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs w-12">Tahun {yr.tahun}</span>
                      {yr.milestone && (
                        <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">{yr.milestone}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-medium">{formatRp(yr.gajiEstimasi)}/bln</span>
                      {yr.kumulatifSelisih > 0 && (
                        <span className="text-emerald-400 text-[10px]">+{formatRp(yr.kumulatifSelisih)} kum.</span>
                      )}
                    </div>
                  </div>
                  <ProgressBar value={yr.gajiEstimasi} max={maxGaji * 1.1} color="bg-emerald-500" />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Total tambahan penghasilan 5 tahun</span>
              <span className="text-emerald-400 text-sm font-bold">+{formatRp(result.totalROI5Tahun)}</span>
            </div>
          </div>

          {/* Benefit Non-Finansial */}
          {result.benefitNonFinansial.length > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-3">
              <p className="text-xs text-violet-400 font-semibold mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Manfaat Non-Finansial
              </p>
              <ul className="space-y-1.5">
                {result.benefitNonFinansial.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SKK Lanjutan */}
          {result.skklanjutan.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
              <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> SKK Lanjutan yang Bisa Meningkatkan Karir
              </p>
              <div className="space-y-2">
                {result.skklanjutan.map((s, i) => (
                  <div key={i} className="rounded-lg border border-white/8 bg-white/2 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-medium">{s.jabatan}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Estimasi: {s.estimasiWaktu}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-400/30 shrink-0">
                      {s.potensiKenaikan}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kesimpulan */}
          {result.kesimpulan && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 mb-4 flex items-start gap-2">
              <Award className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs leading-relaxed">{result.kesimpulan}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/cek-kelayakan-skk">Cek Kelayakan SKK →</Link>
            </Button>
            <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs">
              <Link href="/persiapan-asesmen">Mulai Persiapan →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> ROI & Karir SKK
            </h1>
            <p className="text-xs text-slate-400">Berapa kenaikan gaji dan ROI setelah sertifikasi?</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-5">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Jabatan / Posisi Saat Ini *</label>
            <input type="text" value={jabatan} onChange={e => setJabatan(e.target.value)}
              placeholder="cth: Safety Officer, Site Engineer, Pengawas Lapangan, dll."
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/50 transition-colors" />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">
              Gaji Saat Ini: <span className="text-emerald-400 font-semibold">Rp {gaji} juta/bulan</span>
            </label>
            <input type="range" min={3} max={50} step={1} value={gaji}
              onChange={e => setGaji(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Rp 3 jt</span><span>Rp 10 jt</span><span>Rp 20 jt</span><span>Rp 35 jt</span><span>Rp 50 jt</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Target SKK yang Akan Diambil *</label>
            <select value={targetSkk} onChange={e => setTargetSkk(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors">
              <option value="">Pilih target SKK...</option>
              {SKK_TARGET_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Wilayah Kerja *</label>
              <select value={wilayah} onChange={e => setWilayah(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors">
                <option value="">Pilih wilayah...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Jenis Perusahaan *</label>
              <select value={perusahaan} onChange={e => setPerusahaan(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors">
                <option value="">Pilih tipe...</option>
                {COMPANY_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={calculate} disabled={!jabatan || !targetSkk || !wilayah || !perusahaan || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Menghitung Proyeksi...</>
              : <><Sparkles className="h-4 w-4 mr-2" />Hitung ROI & Proyeksi Karir</>
            }
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4">
          <p className="text-xs text-slate-400 font-medium mb-2">Apa yang akan dihitung:</p>
          <ul className="text-xs text-slate-500 space-y-0.5">
            <li>• Estimasi kenaikan gaji setelah mendapat SKK (berdasarkan wilayah + tipe perusahaan)</li>
            <li>• Rincian biaya sertifikasi yang realistis</li>
            <li>• <span className="text-emerald-400">Breakeven</span>: berapa bulan untuk balik modal biaya sertifikasi</li>
            <li>• Proyeksi gaji 5 tahun dengan milestone karir</li>
            <li>• Total ROI finansial 5 tahun + manfaat non-finansial</li>
            <li>• SKK lanjutan yang bisa meningkatkan karir lebih jauh</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
