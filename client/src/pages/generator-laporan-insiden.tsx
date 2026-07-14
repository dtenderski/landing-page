import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, AlertOctagon, Copy,
  CheckCircle2, Info, ChevronRight, RotateCcw, ChevronDown
} from "lucide-react";
import { Link } from "wouter";

const JENIS_INSIDEN = [
  "Kecelakaan Kerja (KK) — Korban Luka Ringan",
  "Kecelakaan Kerja (KK) — Korban Luka Berat",
  "Kecelakaan Kerja (KK) — Korban Meninggal",
  "Penyakit Akibat Kerja (PAK)",
  "Insiden Berbahaya (Near Miss)",
  "Kebakaran di Area Proyek",
  "Kerusakan Properti / Peralatan",
  "Tumpahan / Kebocoran B3",
];

const TIPE_PEKERJAAN = [
  "Pekerjaan Ketinggian", "Penggunaan Alat Berat",
  "Penggalian & Pondasi", "Pengelasan & Pemotongan",
  "Instalasi MEP", "Pekerjaan Struktur Baja",
  "Pekerjaan Umum / Lainnya",
];

interface HasilLaporanInsiden {
  judulLaporan: string; nomorLaporan: string; tanggal: string;
  ringkasanInsiden: string;
  kategoriKeparahan: "Ringan" | "Sedang" | "Berat" | "Fatal";
  bagianLaporan: {
    dataPelapor: string;
    kronologiKejadian: string;
    korban: string;
    penyebabLangsung: string;
    penyebabDasar: string;
    tindakanDarurat: string;
    tindakanPerbaikan: string;
    rekomendasiPencegahan: string;
    kesimpulan: string;
  };
  kewajibanalLegal: string[];
  dokumenPendukung: string[];
}

const SEV_COLOR: Record<string, string> = {
  "Ringan": "text-amber-400 border-amber-500/30 bg-amber-500/5",
  "Sedang": "text-orange-400 border-orange-500/30 bg-orange-500/5",
  "Berat": "text-red-400 border-red-500/30 bg-red-500/5",
  "Fatal": "text-red-600 border-red-600/40 bg-red-600/10",
};

export default function GeneratorLaporanInsiden() {
  const [jenisInsiden, setJenisInsiden] = useState("");
  const [tipePekerjaan, setTipePekerjaan] = useState(TIPE_PEKERJAAN[0]);
  const [lokasiProyek, setLokasiProyek] = useState("");
  const [deskripsiSingkat, setDeskripsiSingkat] = useState("");
  const [result, setResult] = useState<HasilLaporanInsiden | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openBagian, setOpenBagian] = useState<Set<string>>(new Set(["kronologi", "penyebab"]));

  function toggleBagian(k: string) { setOpenBagian(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  async function generate() {
    if (!jenisInsiden) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-laporan-insiden", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisInsiden, tipePekerjaan, lokasiProyek, deskripsiSingkat }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenBagian(new Set(["kronologi", "penyebab"]));
    } catch (e: any) { setError(e.message || "Gagal generate laporan."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const b = result.bagianLaporan;
    const text = `${result.judulLaporan}\nNo: ${result.nomorLaporan} | ${result.tanggal}\n\n${result.ringkasanInsiden}\n\n${Object.values(b).join("\n\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const BAGIAN_LIST: [string, string, string][] = [
    ["dataPelapor", "Data Pelapor & Korban", result?.bagianLaporan.dataPelapor ?? ""],
    ["kronologi", "Kronologi Kejadian", result?.bagianLaporan.kronologiKejadian ?? ""],
    ["penyebabLangsung", "Penyebab Langsung", result?.bagianLaporan.penyebabLangsung ?? ""],
    ["penyebabDasar", "Penyebab Dasar (Root Cause)", result?.bagianLaporan.penyebabDasar ?? ""],
    ["tindakanDarurat", "Tindakan Darurat yang Dilakukan", result?.bagianLaporan.tindakanDarurat ?? ""],
    ["tindakanPerbaikan", "Tindakan Perbaikan Segera", result?.bagianLaporan.tindakanPerbaikan ?? ""],
    ["rekomendasi", "Rekomendasi Pencegahan", result?.bagianLaporan.rekomendasiPencegahan ?? ""],
    ["kesimpulan", "Kesimpulan & Tanda Tangan", result?.bagianLaporan.kesimpulan ?? ""],
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-400" /> Generator Laporan Insiden K3
            </h1>
            <p className="text-xs text-slate-400">Draft laporan insiden/kecelakaan kerja formal sesuai format Kemnaker + Permenaker No. 8/2020</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-2">
              <AlertOctagon className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">Laporan Kecelakaan Kerja wajib dilaporkan ke Dinas Ketenagakerjaan dalam 2x24 jam (KK ringan) dan 1x24 jam (KK berat/fatal). Draft ini adalah panduan — lengkapi dengan data faktual aktual.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Insiden *</label>
                <div className="space-y-1.5">
                  {JENIS_INSIDEN.map(s => (
                    <button key={s} onClick={() => setJenisInsiden(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisInsiden === s ? "bg-red-500/10 border-red-400/30 text-red-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Tipe Pekerjaan Saat Insiden</label>
                  <select value={tipePekerjaan} onChange={e => setTipePekerjaan(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {TIPE_PEKERJAAN.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama / Lokasi Proyek <span className="text-slate-600">(opt)</span></label>
                  <input value={lokasiProyek} onChange={e => setLokasiProyek(e.target.value)}
                    placeholder="cth: Proyek Gedung X Jakarta"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Deskripsi Singkat Kejadian <span className="text-slate-600">(opsional)</span></label>
                <textarea value={deskripsiSingkat} onChange={e => setDeskripsiSingkat(e.target.value)}
                  placeholder="cth: Pekerja terjatuh dari scaffolding setinggi 4m saat pemasangan besi balok lantai 3..."
                  rows={2} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisInsiden || loading} className="w-full bg-red-600 hover:bg-red-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating laporan insiden...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Laporan Insiden K3</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className={`rounded-2xl border p-4 mb-4 ${SEV_COLOR[result.kategoriKeparahan]}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulLaporan}</p>
                  <p className="text-[10px] text-slate-500">No: {result.nomorLaporan} · {result.tanggal}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs border ${SEV_COLOR[result.kategoriKeparahan]}`}>{result.kategoriKeparahan}</Badge>
                  <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5">
                    {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-300">{result.ringkasanInsiden}</p>
            </div>

            <div className="space-y-2 mb-4">
              {BAGIAN_LIST.filter(([, , content]) => content).map(([key, title, content]) => (
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

            {result.kewajibanalLegal?.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
                <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertOctagon className="h-3.5 w-3.5" />Kewajiban Legal Pelaporan</p>
                <ul className="space-y-1">{result.kewajibanalLegal.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Laporan Lain</Button>
              <Button asChild className="flex-1 bg-red-600 hover:bg-red-700 text-xs">
                <Link href="/generator-jsa">Generator JSA →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
