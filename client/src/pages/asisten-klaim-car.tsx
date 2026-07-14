import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Umbrella, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const JENIS_KLAIM = [
  "Kerusakan Material / Pekerjaan di Lokasi",
  "Kecelakaan Alat Berat / Peralatan",
  "Kebakaran / Ledakan di Proyek",
  "Banjir / Bencana Alam",
  "Pencurian Material di Site",
  "Third Party Liability (TPL) — Kerugian Pihak Ketiga",
  "Testing & Commissioning Loss",
  "Collapse / Keruntuhan Parsial",
];

const NILAI_PROYEK = [
  "< Rp 1 miliar", "Rp 1–5 miliar", "Rp 5–20 miliar",
  "Rp 20–100 miliar", "> Rp 100 miliar",
];

interface LangkahKlaim {
  urutan: number; langkah: string; detail: string;
  batasWaktu: string; dokumenDiperlukan: string[];
}

interface HasilKlaimCAR {
  jenisKlaim: string;
  ringkasan: string;
  tingkatKesulitan: "Mudah" | "Sedang" | "Rumit";
  estimasiWaktu: string;
  langkahKlaim: LangkahKlaim[];
  dokumenWajib: { dokumen: string; keterangan: string; urgensi: "Segera" | "1 minggu" | "Sebelum survei" }[];
  klausulPolisYangRelevan: string[];
  pengecualianUmum: string[];
  tipsNegosiasiKlaim: string[];
  kontak: string;
}

const DIFF_COLOR: Record<string, string> = {
  "Mudah": "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  "Sedang": "text-amber-400 border-amber-500/30 bg-amber-500/5",
  "Rumit": "text-red-400 border-red-500/30 bg-red-500/5",
};

export default function AsistenKlaimCAR() {
  const [jenisKlaim, setJenisKlaim] = useState("");
  const [nilaiProyek, setNilaiProyek] = useState("Rp 5–20 miliar");
  const [namaProyek, setNamaProyek] = useState("");
  const [deskripsiKejadian, setDeskripsiKejadian] = useState("");
  const [result, setResult] = useState<HasilKlaimCAR | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openLangkah, setOpenLangkah] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"langkah" | "dokumen" | "polis" | "tips">("langkah");

  function toggleLangkah(i: number) { setOpenLangkah(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisKlaim) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/asisten-klaim-car", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKlaim, nilaiProyek, namaProyek, deskripsiKejadian }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenLangkah(new Set([0]));
    } catch (e: any) { setError(e.message || "Gagal generate panduan."); }
    finally { setLoading(false); }
  }

  const UrgColor: Record<string, string> = {
    "Segera": "text-red-400 border-red-400/30",
    "1 minggu": "text-amber-400 border-amber-400/30",
    "Sebelum survei": "text-blue-400 border-blue-400/30",
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
              <Umbrella className="h-5 w-5 text-amber-400" /> Asisten Klaim Asuransi CAR
            </h1>
            <p className="text-xs text-slate-400">Panduan langkah klaim Construction All Risk: dokumen wajib, batas waktu, klausul polis, tips negosiasi</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2">
              <Umbrella className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Klaim CAR harus dilaporkan ke insurer dalam waktu yang ditentukan polis (biasanya 7–14 hari). Panduan ini membantu mempersiapkan klaim yang kuat dan terstruktur.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Klaim / Kejadian *</label>
                <div className="space-y-1.5">
                  {JENIS_KLAIM.map(s => (
                    <button key={s} onClick={() => setJenisKlaim(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisKlaim === s ? "bg-amber-500/10 border-amber-400/30 text-amber-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Proyek (RAB)</label>
                  <select value={nilaiProyek} onChange={e => setNilaiProyek(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {NILAI_PROYEK.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek <span className="text-slate-600">(opt)</span></label>
                  <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                    placeholder="cth: Proyek Gedung Kantor"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Deskripsi Singkat Kejadian <span className="text-slate-600">(opsional — semakin detail, panduan semakin relevan)</span></label>
                <textarea value={deskripsiKejadian} onChange={e => setDeskripsiKejadian(e.target.value)}
                  placeholder="cth: Tower crane roboh menimpa area parkir sekitar proyek, merusak 3 kendaraan milik warga..."
                  rows={2} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisKlaim || loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyiapkan panduan klaim...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Klaim CAR</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className={`rounded-2xl border p-4 mb-4 ${DIFF_COLOR[result.tingkatKesulitan]}`}>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className={`text-xs border ${DIFF_COLOR[result.tingkatKesulitan]}`}>{result.tingkatKesulitan}</Badge>
                <span className="text-xs text-slate-400">Estimasi proses: {result.estimasiWaktu}</span>
              </div>
              <p className="text-sm text-slate-300">{result.ringkasan}</p>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["langkah", "Langkah Klaim"], ["dokumen", "Dokumen"], ["polis", "Klausul Polis"], ["tips", "Tips Negosiasi"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "langkah" && (
              <div className="space-y-2">
                {result.langkahKlaim?.map((l, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleLangkah(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <div className="rounded-full bg-amber-500/20 w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold text-amber-400">{l.urutan}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{l.langkah}</p>
                        <Badge variant="outline" className="text-[9px] text-red-400 border-red-400/30">{l.batasWaktu}</Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openLangkah.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openLangkah.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                        <p className="text-xs text-slate-400">{l.detail}</p>
                        {l.dokumenDiperlukan?.length > 0 && (
                          <div className="flex flex-wrap gap-1">{l.dokumenDiperlukan.map((d, di) => <Badge key={di} variant="outline" className="text-[9px] text-slate-300 border-slate-600">{d}</Badge>)}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "dokumen" && (
              <div className="space-y-2">
                {result.dokumenWajib?.map((d, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <div className={`w-3 h-3 rounded border shrink-0 mt-0.5 border-slate-500`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-xs text-white font-medium">{d.dokumen}</p>
                        <Badge variant="outline" className={`text-[8px] border ${UrgColor[d.urgensi]}`}>{d.urgensi}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">{d.keterangan}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "polis" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {result.klausulPolisYangRelevan?.map((k, i) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300">{k}</p>
                    </div>
                  ))}
                </div>
                {result.pengecualianUmum?.length > 0 && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Pengecualian yang Sering Ditolak</p>
                    <ul className="space-y-1">{result.pengecualianUmum.map((e, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{e}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-2">
                {result.tipsNegosiasiKlaim?.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Klaim Lain</Button>
              <Button asChild className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs">
                <Link href="/kalkulator-eskalasi-harga">Eskalasi Harga →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
