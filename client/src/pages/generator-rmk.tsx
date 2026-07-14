import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ClipboardList, Copy,
  CheckCircle2, ChevronDown, Info, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK = [
  "Gedung Bertingkat", "Infrastruktur Jalan", "Jembatan",
  "Bendungan / Irigasi", "Instalasi MEP", "Proyek Renovasi",
  "Proyek Konstruksi Lainnya",
];
const PERAN_OPTIONS = [
  "Kontraktor Pelaksana (Penyedia Jasa)", "Konsultan Perencana",
  "Konsultan Pengawas / Supervisi", "Manajemen Konstruksi (MK)",
];
const DURASI_OPTIONS = ["< 3 bulan", "3–6 bulan", "6–12 bulan", "12–24 bulan", "> 24 bulan"];

interface BabRMK {
  bab: string; judul: string; isi: string[];
}

interface HasilRMK {
  judulRMK: string; nomorDokumen: string; tanggal: string;
  ringkasan: string;
  babList: BabRMK[];
  indikatorMutu: string[];
  jadwalPeninjauan: string;
  catatanKontraktor: string[];
}

export default function GeneratorRMK() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [peran, setPeran] = useState(PERAN_OPTIONS[0]);
  const [durasi, setDurasi] = useState("6–12 bulan");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [result, setResult] = useState<HasilRMK | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openBab, setOpenBab] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState(false);

  function toggleBab(i: number) { setOpenBab(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisProyek || !namaProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-rmk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, namaProyek, peran, durasi, nilaiKontrak }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenBab(new Set([0]));
    } catch (e: any) { setError(e.message || "Gagal generate RMK."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = result.babList.map(b => `${b.bab} ${b.judul}\n${b.isi.join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(`${result.judulRMK}\nNo: ${result.nomorDokumen}\n\n${result.ringkasan}\n\n${text}`);
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
              <ClipboardList className="h-5 w-5 text-violet-400" /> Generator Rencana Mutu Kontrak (RMK)
            </h1>
            <p className="text-xs text-slate-400">Generate draft RMK terstruktur sesuai jenis proyek, peran, dan durasi — lengkap dengan indikator mutu dan jadwal peninjauan</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">RMK (Rencana Mutu Kontrak) adalah dokumen wajib pada proyek konstruksi pemerintah sesuai Perlem LKPP. Draft yang dihasilkan adalah titik awal yang perlu disesuaikan dengan spesifikasi kontrak aktual.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jenis Proyek *</label>
                  <select value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                    <option value="">Pilih tipe...</option>
                    {JENIS_PROYEK.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Durasi Proyek</label>
                  <select value={durasi} onChange={e => setDurasi(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                    {DURASI_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Gedung Kantor Bupati Kab. X"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Peran Penyusun RMK</label>
                <div className="space-y-1.5">
                  {PERAN_OPTIONS.map(p => (
                    <button key={p} onClick={() => setPeran(p)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${peran === p ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak <span className="text-slate-600">(opsional)</span></label>
                <input value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)}
                  placeholder="cth: Rp 8.500.000.000"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisProyek || !namaProyek || loading} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating RMK...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Rencana Mutu Kontrak</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulRMK}</p>
                  <p className="text-[10px] text-slate-500">No: {result.nomorDokumen} · {result.tanggal}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-400">{result.ringkasan}</p>
            </div>

            <div className="space-y-2 mb-4">
              {result.babList?.map((b, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleBab(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-violet-400 shrink-0 w-8">{b.bab}</span>
                    <p className="text-sm text-white font-medium flex-1">{b.judul}</p>
                    <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openBab.has(i) ? "rotate-180" : ""}`} />
                  </button>
                  {openBab.has(i) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-1.5">
                      {b.isi?.map((item, ii) => (
                        <p key={ii} className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.indikatorMutu?.length > 0 && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
                <p className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Indikator Mutu Proyek</p>
                <div className="space-y-1">
                  {result.indikatorMutu.map((m, i) => <p key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-violet-400 shrink-0">•</span>{m}</p>)}
                </div>
                {result.jadwalPeninjauan && <div className="mt-2 rounded-lg bg-slate-900/50 px-3 py-2">
                  <p className="text-[10px] text-slate-500">Jadwal Peninjauan RMK</p>
                  <p className="text-xs text-slate-200">{result.jadwalPeninjauan}</p>
                </div>}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
                <Link href="/generator-bast-proyek">Generator BAST →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
