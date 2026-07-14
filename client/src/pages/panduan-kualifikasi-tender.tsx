import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Target, Info,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PENGADAAN = [
  "Pengadaan Barang/Jasa Konstruksi — Pemerintah (APBN/APBD)",
  "Pengadaan Jasa Konsultansi Konstruksi — Pemerintah",
  "Pengadaan Konstruksi — BUMN/BUMD",
  "Tender Swasta — Developer / EPC Company",
  "Pengadaan Konstruksi — Sektor Migas/Energi",
];

const METODE_KUALIFIKASI = [
  "Pascakualifikasi (1 sampul)", "Prakualifikasi (PQ)",
  "Pascakualifikasi (2 sampul — teknis + harga)",
  "Pengadaan Langsung (PL)", "Penunjukan Langsung (PL)",
];

const KLASIFIKASI_SBU = [
  "BG — Bangunan Gedung (BG001–BG009)",
  "BS — Bangunan Sipil (BS001–BS013)",
  "MK — Instalasi Mekanikal & Elektrikal (MK001–MK008)",
  "EL — Konstruksi Spesialis Elektrikal",
  "SI — Konstruksi Spesialis Sipil",
  "KK — Jasa Konsultansi Konstruksi (KK001–KK010)",
];

interface GapItem { persyaratan: string; status: "Terpenuhi" | "Perlu Perhatian" | "Kritis"; catatan: string; saran?: string }
interface HasilKualifikasi {
  ringkasan: string; skor: number; predikat: string;
  gapList: GapItem[];
  persyaratanWajib: string[];
  strategiPemenangan: string[];
  dokumenDisiapkan: { dokumen: string; tips: string }[];
  referensiRegulasi: string[];
}

const STATUS_COLOR: Record<string, string> = {
  "Terpenuhi": "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  "Perlu Perhatian": "text-amber-400 border-amber-500/30 bg-amber-500/5",
  "Kritis": "text-red-400 border-red-500/30 bg-red-500/5",
};
const STATUS_ICON = { "Terpenuhi": CheckCircle2, "Perlu Perhatian": AlertTriangle, "Kritis": XCircle };

export default function PanduanKualifikasiTender() {
  const [jenisPengadaan, setJenisPengadaan] = useState("");
  const [metodePQ, setMetodePQ] = useState(METODE_KUALIFIKASI[0]);
  const [klasifikasi, setKlasifikasi] = useState("");
  const [subkualifikasi, setSubkualifikasi] = useState("M (Menengah)");
  const [pengalamanTahun, setPengalamanTahun] = useState(5);
  const [nilaiPaket, setNilaiPaket] = useState("");
  const [result, setResult] = useState<HasilKualifikasi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"gap" | "dokumen" | "strategi">("gap");
  const [openGap, setOpenGap] = useState<Set<number>>(new Set([0, 1]));

  function toggleGap(i: number) { setOpenGap(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisPengadaan || !klasifikasi) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-kualifikasi-tender", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPengadaan, metodePQ, klasifikasi, subkualifikasi, pengalamanTahun, nilaiPaket }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenGap(new Set([0, 1]));
    } catch (e: any) { setError(e.message || "Gagal generate panduan."); }
    finally { setLoading(false); }
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
              <Target className="h-5 w-5 text-indigo-400" /> Panduan Kualifikasi Tender BUJK
            </h1>
            <p className="text-xs text-slate-400">Analisis persyaratan kualifikasi, gap assessment, dan strategi pemenangan per jenis tender konstruksi</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-300">AI akan menganalisis persyaratan kualifikasi berdasarkan Perpres 46/2025, Permen PUPR, dan regulasi pengadaan yang relevan, lalu memberikan gap assessment dan strategi dokumen.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis / Sektor Pengadaan *</label>
                <div className="space-y-1.5">
                  {JENIS_PENGADAAN.map(s => (
                    <button key={s} onClick={() => setJenisPengadaan(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisPengadaan === s ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Metode Kualifikasi</label>
                  <select value={metodePQ} onChange={e => setMetodePQ(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {METODE_KUALIFIKASI.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Subkualifikasi SBU</label>
                  <select value={subkualifikasi} onChange={e => setSubkualifikasi(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {["K1 (Kecil-1)", "K2 (Kecil-2)", "K3 (Kecil-3)", "M1 (Menengah-1)", "M2 (Menengah-2)", "B1 (Besar-1)", "B2 (Besar-2)"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Klasifikasi SBU *</label>
                <div className="space-y-1.5">
                  {KLASIFIKASI_SBU.map(s => (
                    <button key={s} onClick={() => setKlasifikasi(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${klasifikasi === s ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Pengalaman Perusahaan: <span className="text-indigo-400">{pengalamanTahun} thn</span></label>
                  <input type="range" min={0} max={30} value={pengalamanTahun} onChange={e => setPengalamanTahun(+e.target.value)} className="w-full accent-indigo-500 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Estimasi Nilai Paket</label>
                  <input value={nilaiPaket} onChange={e => setNilaiPaket(e.target.value)}
                    placeholder="cth: Rp 25 Miliar"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisPengadaan || !klasifikasi || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis kualifikasi...</> : <><Sparkles className="h-4 w-4 mr-2" />Analisis Kualifikasi Tender</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="text-center shrink-0">
                  <p className="text-2xl font-bold text-indigo-400">{result.skor}</p>
                  <p className="text-[9px] text-slate-500">/ 100</p>
                </div>
                <div>
                  <p className="text-sm text-white font-bold">{result.predikat}</p>
                  <p className="text-xs text-slate-300">{result.ringkasan}</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${result.skor}%` }} />
              </div>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["gap", "Gap Analysis"], ["dokumen", "Dokumen"], ["strategi", "Strategi"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "gap" && (
              <div className="space-y-2">
                {result.gapList?.map((g, i) => {
                  const Icon = STATUS_ICON[g.status];
                  return (
                    <div key={i} className={`rounded-xl border ${STATUS_COLOR[g.status]}`}>
                      <button onClick={() => toggleGap(i)} className="w-full text-left p-3.5 flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <p className="text-sm text-white font-medium flex-1">{g.persyaratan}</p>
                        <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openGap.has(i) ? "rotate-180" : ""}`} />
                      </button>
                      {openGap.has(i) && (
                        <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-1.5">
                          <p className="text-xs text-slate-300">{g.catatan}</p>
                          {g.saran && <p className="text-xs text-indigo-300 border-l-2 border-indigo-500 pl-2">💡 {g.saran}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "dokumen" && (
              <div className="space-y-2">
                {result.dokumenDisiapkan?.map((d, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded border border-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-white font-medium">{d.dokumen}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{d.tips}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {result.referensiRegulasi?.length > 0 && (
                  <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3">
                    <p className="text-[10px] text-blue-400 font-semibold mb-1.5">Regulasi Acuan</p>
                    <div className="flex flex-wrap gap-1">{result.referensiRegulasi.map((r, i) => <Badge key={i} variant="outline" className="text-[9px] text-slate-300 border-slate-600">{r}</Badge>)}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "strategi" && (
              <div className="space-y-2">
                {result.strategiPemenangan?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{s}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Analisis Ulang</Button>
              <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                <Link href="/tendera-claw">TenderaClaw AI →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
