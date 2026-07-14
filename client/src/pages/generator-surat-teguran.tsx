import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, AlertTriangle, Copy,
  CheckCircle2, Info, RotateCcw, ChevronDown
} from "lucide-react";
import { Link } from "wouter";

const TIPE_TEGURAN = [
  "Teguran Pertama — Peringatan Awal",
  "Teguran Kedua — Peringatan Keras",
  "Teguran Ketiga — Ancaman Pemutusan Kontrak",
  "Teguran Final — Sebelum Blacklist",
];

const PENERIMA_TEGURAN = [
  "Sub-Kontraktor Sipil / Struktural",
  "Sub-Kontraktor MEP (Mekanikal/Elektrikal/Plumbing)",
  "Supplier Material Bangunan",
  "Sub-Kontraktor Finishing",
  "Konsultan Pengawas / MK",
  "Kontraktor Utama (dari PPK/Owner)",
  "Mandor / Tenaga Borongan",
];

const ALASAN_KETERLAMBATAN = [
  "Keterlambatan mobilisasi alat dan tenaga kerja",
  "Progress pekerjaan di bawah kurva S (schedule)",
  "Keterlambatan pengiriman / pengadaan material",
  "Mutu pekerjaan tidak memenuhi spesifikasi teknis",
  "Absensi / kekurangan tenaga kerja tanpa izin",
  "Tidak memenuhi persyaratan K3 di lapangan",
  "Tidak menyampaikan laporan harian/mingguan",
  "Tidak responsif terhadap instruksi lapangan",
];

interface HasilSuratTeguran {
  nomor: string; perihal: string;
  isi: string[];
  tuntutan: string[];
  konsekuensi: string;
  penutup: string;
  catatan: string;
}

export default function GeneratorSuratTeguran() {
  const [tipeTeguran, setTipeTeguran] = useState(TIPE_TEGURAN[0]);
  const [penerima, setPenerima] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [alasan, setAlasan] = useState<string[]>([]);
  const [hariKeterlambatan, setHariKeterlambatan] = useState(7);
  const [dendaInfo, setDendaInfo] = useState("");
  const [result, setResult] = useState<HasilSuratTeguran | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openSection, setOpenSection] = useState<Set<string>>(new Set(["isi", "tuntutan"]));

  function toggleSection(k: string) { setOpenSection(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }
  function toggleAlasan(a: string) { setAlasan(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]); }

  async function generate() {
    if (!penerima || !namaProyek || alasan.length === 0) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-surat-teguran", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipeTeguran, penerima, namaProyek, alasan, hariKeterlambatan, dendaInfo }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenSection(new Set(["isi", "tuntutan"]));
    } catch (e: any) { setError(e.message || "Gagal generate surat."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = `${result.nomor}\nPerihal: ${result.perihal}\n\n${result.isi.join("\n\n")}\n\nTuntutan:\n${result.tuntutan.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n${result.konsekuensi}\n\n${result.penutup}`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const teguranColor = tipeTeguran.includes("Pertama") ? "amber" : tipeTeguran.includes("Kedua") ? "orange" : tipeTeguran.includes("Ketiga") ? "red" : "rose";
  const colorMap: Record<string, string> = {
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    orange: "text-orange-400 border-orange-500/30 bg-orange-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
    rose: "text-rose-400 border-rose-500/30 bg-rose-500/5",
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> Generator Surat Teguran Keterlambatan
            </h1>
            <p className="text-xs text-slate-400">Surat teguran resmi kepada sub-kontraktor/supplier yang terlambat atau tidak memenuhi kewajiban kontrak</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Surat teguran resmi adalah dokumen penting untuk perlindungan hukum kontraktor. Surat ini menjadi dasar klaim denda, eskalasi, dan jika perlu pemutusan kontrak sesuai UUJK dan KUH Perdata.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Tingkat Teguran</label>
                <div className="space-y-1.5">
                  {TIPE_TEGURAN.map((t, i) => (
                    <button key={t} onClick={() => setTipeTeguran(t)}
                      className={`w-full rounded-lg border py-2.5 px-3 text-xs text-left transition-all flex items-center gap-2 ${tipeTeguran === t ? "bg-amber-500/10 border-amber-400/30 text-amber-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${tipeTeguran === t ? "border-amber-400 bg-amber-500/20 text-amber-400" : "border-slate-600 text-slate-600"}`}>{i + 1}</span>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Penerima Surat *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PENERIMA_TEGURAN.map(p => (
                    <button key={p} onClick={() => setPenerima(p)}
                      className={`rounded-lg border py-2 px-2 text-xs text-left transition-all ${penerima === p ? "bg-amber-500/10 border-amber-400/30 text-amber-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Gedung Pusat Perbelanjaan — Tangerang"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Alasan / Pelanggaran * <span className="text-slate-500">(pilih semua yang relevan)</span></label>
                <div className="space-y-1.5">
                  {ALASAN_KETERLAMBATAN.map(a => (
                    <button key={a} onClick={() => toggleAlasan(a)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${alasan.includes(a) ? "bg-amber-500/10 border-amber-400/30 text-amber-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {alasan.includes(a) && <span className="mr-1">✓</span>}{a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Hari Keterlambatan: <span className="text-amber-400 font-bold">{hariKeterlambatan} hari</span></label>
                  <input type="range" min={1} max={180} value={hariKeterlambatan} onChange={e => setHariKeterlambatan(+e.target.value)} className="w-full accent-amber-500" />
                  <div className="flex justify-between text-[9px] text-slate-600 mt-0.5"><span>1 hr</span><span>180 hr</span></div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Info Denda <span className="text-slate-600">(opsional)</span></label>
                  <input value={dendaInfo} onChange={e => setDendaInfo(e.target.value)}
                    placeholder="cth: 1‰/hari maks 5%"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!penerima || !namaProyek || alasan.length === 0 || loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun surat teguran...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Surat Teguran</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className={`rounded-2xl border p-4 mb-4 ${colorMap[teguranColor]}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-[10px] text-slate-500">{result.nomor}</p>
                  <p className="text-sm text-white font-semibold">Perihal: {result.perihal}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <Badge variant="outline" className={`text-[10px] ${colorMap[teguranColor]}`}>{tipeTeguran}</Badge>
            </div>

            {[
              ["isi", "Isi Surat", result.isi],
              ["tuntutan", "Tuntutan & Instruksi", result.tuntutan],
            ].map(([key, title, items]) => (
              <div key={key as string} className="rounded-xl border border-white/8 bg-white/2 mb-2">
                <button onClick={() => toggleSection(key as string)} className="w-full flex items-center justify-between p-3.5">
                  <p className="text-sm text-white font-medium">{title as string}</p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openSection.has(key as string) ? "rotate-180" : ""}`} />
                </button>
                {openSection.has(key as string) && (
                  <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                    {(items as string[]).map((item, i) => (
                      <p key={i} className={`text-xs text-slate-300 ${key === "tuntutan" ? "flex items-start gap-2" : ""}`}>
                        {key === "tuntutan" && <span className="text-amber-400 shrink-0 font-bold">{i + 1}.</span>}{item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mb-2">
              <p className="text-[10px] text-red-400 font-semibold mb-1">⚠️ Konsekuensi Jika Tidak Ditindaklanjuti</p>
              <p className="text-xs text-slate-300">{result.konsekuensi}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/2 p-3 mb-4">
              <p className="text-xs text-slate-300 italic">{result.penutup}</p>
              {result.catatan && <p className="text-[10px] text-slate-500 mt-2 border-t border-white/8 pt-2">Catatan: {result.catatan}</p>}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs">
                <Link href="/kontrak-claw">KontrakClaw AI →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
