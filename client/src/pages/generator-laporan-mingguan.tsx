import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ClipboardList, Copy,
  CheckCircle2, Info, RotateCcw, ChevronDown, Calendar
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK_LM = [
  "Gedung Komersial / Perkantoran",
  "Infrastruktur Jalan & Jembatan",
  "Perumahan / Hunian",
  "Industri & Pabrik",
  "Rumah Sakit / Fasilitas Publik",
  "Proyek Energi & Utilitas",
];

const PERIODE_MINGGU = ["Minggu ke-1", "Minggu ke-2", "Minggu ke-3", "Minggu ke-4",
  "Minggu ke-5", "Minggu ke-6", "Minggu ke-7", "Minggu ke-8",
  "Minggu ke-9", "Minggu ke-10", "Minggu ke-11", "Minggu ke-12"];

const KONDISI_CUACA = ["Cerah / Normal", "Hujan Ringan (1-3 hari)", "Hujan Lebat (>3 hari / banjir)", "Musim Kemarau Ekstrem"];

interface HasilLaporanMingguan {
  judulLaporan: string; periodeMingguan: string; nomor: string;
  ringkasan: string;
  bagian: {
    statusProyek: string;
    realisasiPekerjaan: string;
    isu_risiko: string;
    rencanaMingguDepan: string;
    isu_pembayaran: string;
    catatan_direksi: string;
  };
  tabelProgress: { aktivitas: string; target: string; realisasi: string; deviasi: string }[];
  isu_kritis: string[];
}

export default function GeneratorLaporanMingguan() {
  const [namaProyek, setNamaProyek] = useState("");
  const [jenisProyek, setJenisProyek] = useState("");
  const [periode, setPeriode] = useState(PERIODE_MINGGU[0]);
  const [progressFisik, setProgressFisik] = useState(20);
  const [progressRencana, setProgressRencana] = useState(22);
  const [cuaca, setCuaca] = useState(KONDISI_CUACA[0]);
  const [kendala, setKendala] = useState("");
  const [result, setResult] = useState<HasilLaporanMingguan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openBagian, setOpenBagian] = useState<Set<string>>(new Set(["status", "realisasi"]));

  function toggleBagian(k: string) { setOpenBagian(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  async function generate() {
    if (!namaProyek || !jenisProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-laporan-mingguan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaProyek, jenisProyek, periode, progressFisik, progressRencana, cuaca, kendala }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenBagian(new Set(["status", "realisasi"]));
    } catch (e: any) { setError(e.message || "Gagal generate laporan."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const b = result.bagian;
    navigator.clipboard.writeText([result.judulLaporan, result.periodeMingguan, result.ringkasan, ...Object.values(b)].join("\n\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const deviasi = progressFisik - progressRencana;

  const BAGIAN_LIST: [string, string, string][] = result ? [
    ["status", "Status Proyek Minggu Ini", result.bagian.statusProyek],
    ["realisasi", "Realisasi Pekerjaan", result.bagian.realisasiPekerjaan],
    ["isu", "Isu & Risiko", result.bagian.isu_risiko],
    ["rencana", "Rencana Minggu Depan", result.bagian.rencanaMingguDepan],
    ["pembayaran", "Status Pembayaran", result.bagian.isu_pembayaran],
    ["direksi", "Catatan untuk Direksi / Owner", result.bagian.catatan_direksi],
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-400" /> Generator Laporan Mingguan Proyek
            </h1>
            <p className="text-xs text-slate-400">Draft laporan mingguan Site Manager ke Owner / PPK — progress, realisasi, kendala, rencana minggu depan</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300">Laporan mingguan yang akurat dan profesional memperlancar komunikasi dengan Owner/PPK, mempercepat persetujuan termin, dan mendokumentasikan kendala sebagai dasar klaim waktu/biaya.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan RS Tipe B — Kab. Bekasi"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Proyek *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {JENIS_PROYEK_LM.map(s => (
                    <button key={s} onClick={() => setJenisProyek(s)}
                      className={`rounded-lg border py-2 px-2 text-xs text-left transition-all ${jenisProyek === s ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Periode Pelaporan</label>
                  <select value={periode} onChange={e => setPeriode(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {PERIODE_MINGGU.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Kondisi Cuaca</label>
                  <select value={cuaca} onChange={e => setCuaca(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {KONDISI_CUACA.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Progress Fisik Aktual (%): <span className="text-emerald-400 font-bold">{progressFisik}%</span></label>
                  <input type="range" min={0} max={100} value={progressFisik} onChange={e => setProgressFisik(+e.target.value)} className="w-full accent-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Progress Rencana (%): <span className="text-blue-400 font-bold">{progressRencana}%</span></label>
                  <input type="range" min={0} max={100} value={progressRencana} onChange={e => setProgressRencana(+e.target.value)} className="w-full accent-blue-500" />
                </div>
              </div>
              {deviasi !== 0 && (
                <div className={`rounded-lg px-3 py-2 flex items-center gap-2 text-xs ${deviasi >= 0 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  <span>{deviasi >= 0 ? "▲" : "▼"}</span> Deviasi: {deviasi >= 0 ? "+" : ""}{deviasi.toFixed(1)}% ({deviasi >= 0 ? "di atas rencana — bagus!" : "di bawah rencana — perlu perhatian"})
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kendala Utama Minggu Ini <span className="text-slate-600">(opsional)</span></label>
                <input value={kendala} onChange={e => setKendala(e.target.value)}
                  placeholder="cth: keterlambatan pengiriman besi wiremesh, pekerja kurang"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!namaProyek || !jenisProyek || loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun laporan...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Laporan Mingguan</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulLaporan}</p>
                  <p className="text-[10px] text-slate-500">{result.nomor} · {result.periodeMingguan}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-300 mb-3">{result.ringkasan}</p>
              {result.isu_kritis?.length > 0 && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
                  <p className="text-[10px] text-red-400 font-semibold mb-1">⚠️ Isu Kritis</p>
                  {result.isu_kritis.map((isu, i) => <p key={i} className="text-xs text-slate-300">• {isu}</p>)}
                </div>
              )}
            </div>

            {result.tabelProgress?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3 overflow-x-auto">
                <p className="text-xs text-emerald-400 font-semibold mb-2">Tabel Progress Pekerjaan</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/8">{["Aktivitas","Target (%)","Realisasi (%)","Deviasi"].map(h => <th key={h} className="text-left text-slate-500 py-1.5 pr-3">{h}</th>)}</tr></thead>
                  <tbody>{result.tabelProgress.map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-1.5 pr-3 text-slate-300">{r.aktivitas}</td>
                      <td className="py-1.5 pr-3 text-slate-400">{r.target}</td>
                      <td className="py-1.5 pr-3"><span className="text-emerald-400 font-semibold">{r.realisasi}</span></td>
                      <td className={`py-1.5 text-xs ${r.deviasi.startsWith("+") ? "text-emerald-400" : r.deviasi.startsWith("-") ? "text-red-400" : "text-slate-400"}`}>{r.deviasi}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {BAGIAN_LIST.map(([key, title, content]) => content && (
                <div key={key} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleBagian(key)} className="w-full flex items-center justify-between p-3.5">
                    <p className="text-sm text-white font-medium">{title}</p>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openBagian.has(key) ? "rotate-180" : ""}`} />
                  </button>
                  {openBagian.has(key) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3">
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Link href="/generator-bapro">Generator BAPRO →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
