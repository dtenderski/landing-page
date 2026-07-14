import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ScrollText, Copy,
  CheckCircle2, Info, RotateCcw, ChevronDown, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN = [
  "Subkontrak Pekerjaan Sipil (pondasi, struktur bawah)",
  "Subkontrak Finishing (keramik, cat, kusen, plafon)",
  "Subkontrak MEP (instalasi listrik, plumbing, AC)",
  "Subkontrak Landscaping & Penghijauan",
  "Sewa Alat Berat (crane, excavator, bulldozer)",
  "Jasa Tenaga Kerja Borongan (mandor + pekerja)",
  "Pengadaan Material (besi, beton readymix, bata)",
  "Jasa Konsultansi Teknis (QS, supervision, testing)",
];

const MATA_UANG = ["IDR (Rupiah)", "USD (Dollar)", "SGD (Singapore Dollar)"];
const METODE_BAYAR = [
  "Termin (sesuai progress fisik)",
  "Lump Sum Tunai (setelah selesai)",
  "Mingguan (per laporan kemajuan)",
  "Uang Muka + Sisa Setelah Selesai",
  "Monthly Progress Payment",
];

interface HasilKontrak {
  judulKontrak: string; nomorKontrak: string;
  pasal: { nomor: string; judul: string; isi: string }[];
  lampiranList: string[];
  catatanHukum: string;
  ringkasanKontrak: string;
}

export default function GeneratorKontrakSederhana() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [metodeBayar, setMetodeBayar] = useState(METODE_BAYAR[0]);
  const [durasiHari, setDurasiHari] = useState(60);
  const [matauang, setMatauang] = useState(MATA_UANG[0]);
  const [result, setResult] = useState<HasilKontrak | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openPasal, setOpenPasal] = useState<Set<string>>(new Set(["1", "2", "3"]));

  function togglePasal(k: string) { setOpenPasal(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  async function generate() {
    if (!jenisPekerjaan || !namaProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-kontrak-sederhana", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, namaProyek, nilaiKontrak, metodeBayar, durasiHari, matauang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenPasal(new Set(["1", "2", "3"]));
    } catch (e: any) { setError(e.message || "Gagal generate kontrak."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = [result.judulKontrak, result.nomorKontrak, ...result.pasal.map(p => `Pasal ${p.nomor}: ${p.judul}\n${p.isi}`)].join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-blue-400" /> Generator Draft Kontrak Sederhana
            </h1>
            <p className="text-xs text-slate-400">Draft kontrak subkontraktor / sewa alat / pengadaan material untuk proyek konstruksi</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Draft ini adalah template awal. Konsultasikan dengan konsultan hukum / legal officer sebelum ditandatangani. Kontrak harus disesuaikan dengan kondisi spesifik proyek dan peraturan yang berlaku.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan / Obyek Kontrak *</label>
                <div className="space-y-1.5">
                  {JENIS_PEKERJAAN.map(s => (
                    <button key={s} onClick={() => setJenisPekerjaan(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisPekerjaan === s ? "bg-blue-500/10 border-blue-400/30 text-blue-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek / Lokasi *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Gedung Kantor 5 Lantai — Jl. Sudirman, Jakarta Selatan"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak</label>
                  <input value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)}
                    placeholder="cth: Rp 450.000.000"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Mata Uang</label>
                  <select value={matauang} onChange={e => setMatauang(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {MATA_UANG.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Metode Pembayaran</label>
                  <select value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {METODE_BAYAR.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Durasi Kontrak: <span className="text-blue-400">{durasiHari} hari</span></label>
                  <input type="range" min={7} max={730} value={durasiHari} onChange={e => setDurasiHari(+e.target.value)} className="w-full accent-blue-500 mt-1" />
                  <div className="flex justify-between text-[9px] text-slate-600 mt-0.5"><span>7 hr</span><span>730 hr</span></div>
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisPekerjaan || !namaProyek || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun draft kontrak...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Draft Kontrak</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulKontrak}</p>
                  <p className="text-[10px] text-slate-500">{result.nomorKontrak}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-300">{result.ringkasanKontrak}</p>
            </div>

            <div className="space-y-2 mb-4">
              {result.pasal?.map((p) => (
                <div key={p.nomor} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => togglePasal(p.nomor)} className="w-full flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">Pasal {p.nomor}</span>
                      <p className="text-sm text-white font-medium">{p.judul}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openPasal.has(p.nomor) ? "rotate-180" : ""}`} />
                  </button>
                  {openPasal.has(p.nomor) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3">
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{p.isi}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.lampiranList?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
                <p className="text-xs text-blue-400 font-semibold mb-2">Lampiran yang Disarankan</p>
                <div className="space-y-1">{result.lampiranList.map((l, i) => <p key={i} className="text-xs text-slate-300">• {l}</p>)}</div>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4">
              <p className="text-[10px] text-amber-400 font-semibold mb-1">⚠️ Catatan Hukum</p>
              <p className="text-xs text-slate-300">{result.catatanHukum}</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Link href="/kontrak-claw">KontrakClaw AI →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
