import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileBadge, Copy,
  CheckCircle2, Plus, Trash2, Info, FileText, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Arsitektur — Muda",
];

interface DataProyek {
  namaProyek: string;
  lokasiProyek: string;
  nilaiKontrak: string;
  periodeAwal: string;
  periodeAkhir: string;
  jabatanDiProyek: string;
  pemberiKerja: string;
}

interface HasilSertifikat {
  jabatan: string;
  namaLengkap: string;
  dokumenList: {
    tipe: "Surat Pernyataan Pengalaman" | "Surat Keterangan Kerja" | "Surat Pengantar LSP";
    konten: string;
    instruksi: string;
  }[];
  catatanPenting: string[];
}

export default function GeneratorSertifikatPengalaman() {
  const [jabatan, setJabatan] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [perusahaan, setPerusahaan] = useState("");
  const [proyekList, setProyekList] = useState<DataProyek[]>([
    { namaProyek: "", lokasiProyek: "", nilaiKontrak: "", periodeAwal: "", periodeAkhir: "", jabatanDiProyek: "", pemberiKerja: "" },
  ]);
  const [result, setResult] = useState<HasilSertifikat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [activeDoc, setActiveDoc] = useState(0);

  function addProyek() {
    setProyekList(prev => [...prev, { namaProyek: "", lokasiProyek: "", nilaiKontrak: "", periodeAwal: "", periodeAkhir: "", jabatanDiProyek: "", pemberiKerja: "" }]);
  }
  function removeProyek(i: number) { setProyekList(prev => prev.filter((_, idx) => idx !== i)); }
  function updateProyek(i: number, field: keyof DataProyek, val: string) {
    setProyekList(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  const isValid = jabatan && namaLengkap && proyekList.some(p => p.namaProyek && p.jabatanDiProyek);

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-sertifikat-pengalaman", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, namaLengkap, perusahaan, proyekList: proyekList.filter(p => p.namaProyek) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setActiveDoc(0);
    } catch (e: any) { setError(e.message || "Gagal generate dokumen."); }
    finally { setLoading(false); }
  }

  function copyDoc(i: number) {
    if (!result?.dokumenList[i]) return;
    navigator.clipboard.writeText(result.dokumenList[i].konten);
    setCopied(i); setTimeout(() => setCopied(null), 2000);
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
              <FileBadge className="h-5 w-5 text-rose-400" /> Generator Surat Pengalaman Proyek SKK
            </h1>
            <p className="text-xs text-slate-400">Generate surat pernyataan pengalaman, surat keterangan kerja, dan surat pengantar LSP otomatis</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300">AI menghasilkan 3 dokumen siap pakai: Surat Pernyataan Pengalaman Kerja (format bermaterai), Surat Keterangan Kerja dari perusahaan, dan Surat Pengantar ke LSP. Tinggal edit nama/tanda tangan.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dilamar *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Lengkap *</label>
                  <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)}
                    placeholder="Nama lengkap sesuai KTP"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Perusahaan</label>
                  <input value={perusahaan} onChange={e => setPerusahaan(e.target.value)}
                    placeholder="PT/CV nama perusahaan"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2 font-semibold">Data Proyek Pengalaman *</p>
              <div className="space-y-3">
                {proyekList.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-rose-400 font-medium">Proyek #{i+1}</p>
                      {proyekList.length > 1 && (
                        <button onClick={() => removeProyek(i)} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />Hapus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nama Proyek *</label>
                        <input value={p.namaProyek} onChange={e => updateProyek(i, "namaProyek", e.target.value)}
                          placeholder="cth: Pembangunan Jalan Tol X"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Jabatan di Proyek *</label>
                        <input value={p.jabatanDiProyek} onChange={e => updateProyek(i, "jabatanDiProyek", e.target.value)}
                          placeholder="cth: K3 Officer"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Periode Mulai</label>
                        <input value={p.periodeAwal} onChange={e => updateProyek(i, "periodeAwal", e.target.value)}
                          placeholder="cth: Januari 2022"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Periode Selesai</label>
                        <input value={p.periodeAkhir} onChange={e => updateProyek(i, "periodeAkhir", e.target.value)}
                          placeholder="cth: Desember 2023"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Pemberi Kerja</label>
                        <input value={p.pemberiKerja} onChange={e => updateProyek(i, "pemberiKerja", e.target.value)}
                          placeholder="cth: Kementerian PUPR"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nilai Kontrak</label>
                        <input value={p.nilaiKontrak} onChange={e => updateProyek(i, "nilaiKontrak", e.target.value)}
                          placeholder="cth: Rp 50 miliar"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Lokasi Proyek</label>
                      <input value={p.lokasiProyek} onChange={e => updateProyek(i, "lokasiProyek", e.target.value)}
                        placeholder="cth: Jakarta Selatan, DKI Jakarta"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addProyek} className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors">
                <Plus className="h-3.5 w-3.5" />Tambah proyek
              </button>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-rose-600 hover:bg-rose-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating dokumen...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Surat Pengalaman</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs text-rose-400 border-rose-400/40">{result.jabatan}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.namaLengkap}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.dokumenList?.length || 3} dokumen</Badge>
              </div>
              <p className="text-xs text-slate-400">Dokumen siap pakai — tinggal cetak, tempel meterai, dan tanda tangan.</p>
            </div>

            {/* Doc tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {result.dokumenList?.map((d, i) => (
                <button key={i} onClick={() => setActiveDoc(i)}
                  className={`flex-1 py-2 text-[10px] font-medium rounded-lg transition-all leading-tight px-1 ${activeDoc === i ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  {d.tipe.replace("Surat ", "").replace(" SKK", "")}
                </button>
              ))}
            </div>

            {result.dokumenList?.[activeDoc] && (
              <div className="rounded-xl border border-white/8 bg-white/2 mb-4">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <div>
                    <p className="text-xs text-rose-400 font-semibold">{result.dokumenList[activeDoc].tipe}</p>
                    <p className="text-[10px] text-slate-500">{result.dokumenList[activeDoc].instruksi}</p>
                  </div>
                  <Button onClick={() => copyDoc(activeDoc)} variant="outline" className="h-7 text-xs gap-1.5">
                    {copied === activeDoc ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                  </Button>
                </div>
                <div className="p-4">
                  <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{result.dokumenList[activeDoc].konten}</pre>
                </div>
              </div>
            )}

            {result.catatanPenting?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-amber-400 text-xs font-semibold mb-2">Catatan Penting</p>
                <ul className="space-y-1">{result.catatanPenting.map((c, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{c}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-rose-600 hover:bg-rose-700 text-xs">
                <Link href="/panduan-apl-01">Panduan APL-01 →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
