import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ArrowRightLeft, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info, Clock, Star
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda",
];

interface HasilMutasi {
  jabatanAsal: string; jabatanTujuan: string;
  ringkasan: string;
  tingkatKesulitan: "Mudah" | "Sedang" | "Sulit";
  estimasiWaktu: string;
  unitKompetensiDiakui: { unit: string; alasan: string }[];
  unitKompetensiPerluDitambah: { unit: string; caraMendapatkan: string; estimasiWaktu: string }[];
  gapDokumen: { dokumen: string; status: "Bisa dipakai" | "Perlu diperbarui" | "Perlu baru"; catatan: string }[];
  langkahMutasi: { langkah: string; detail: string; waktu: string }[];
  keuntunganMutasi: string[];
  risikoYangPerluDipertimbangkan: string[];
}

export default function PanduanMutasiSKK() {
  const [jabatanAsal, setJabatanAsal] = useState("");
  const [jabatanTujuan, setJabatanTujuan] = useState("");
  const [result, setResult] = useState<HasilMutasi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openUnit, setOpenUnit] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"gap" | "dokumen" | "langkah" | "pertimbangan">("gap");

  function toggleUnit(i: number) { setOpenUnit(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jabatanAsal || !jabatanTujuan || jabatanAsal === jabatanTujuan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-mutasi-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatanAsal, jabatanTujuan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate panduan."); }
    finally { setLoading(false); }
  }

  const diffColor = result?.tingkatKesulitan === "Mudah" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" :
    result?.tingkatKesulitan === "Sedang" ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "text-red-400 border-red-500/30 bg-red-500/5";

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-orange-400" /> Panduan Mutasi / Alih Profesi SKK
            </h1>
            <p className="text-xs text-slate-400">Gap analisis + dokumen yang bisa dipakai ulang + langkah mutasi dari satu jabatan SKK ke jabatan lain</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">Ingin pindah spesialisasi atau naik level? AI akan analisis gap unit kompetensi, dokumen yang masih bisa dipakai, dan langkah yang harus ditempuh untuk beralih dari jabatan lama ke jabatan baru.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK Sekarang (Asal) *</label>
                  <select value={jabatanAsal} onChange={e => setJabatanAsal(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                    <option value="">Pilih jabatan saat ini...</option>
                    {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-orange-400">
                    <div className="h-px w-16 bg-orange-500/30" />
                    <ArrowRightLeft className="h-4 w-4" />
                    <div className="h-px w-16 bg-orange-500/30" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dituju (Target) *</label>
                  <select value={jabatanTujuan} onChange={e => setJabatanTujuan(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                    <option value="">Pilih jabatan tujuan...</option>
                    {SKK_OPTIONS.filter(s => s !== jabatanAsal).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {jabatanAsal && jabatanTujuan && jabatanAsal === jabatanTujuan &&
              <p className="text-xs text-amber-400 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Jabatan asal dan tujuan tidak boleh sama.</p>}
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jabatanAsal || !jabatanTujuan || jabatanAsal === jabatanTujuan || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis gap mutasi...</> : <><Sparkles className="h-4 w-4 mr-2" />Analisis Mutasi SKK</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className={`rounded-2xl border p-4 mb-4 ${diffColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                    <span>{result.jabatanAsal}</span><ArrowRightLeft className="h-3 w-3 text-orange-400" /><span>{result.jabatanTujuan}</span>
                  </div>
                  <p className="text-white font-semibold">Tingkat Kesulitan Mutasi: <span className={result.tingkatKesulitan === "Mudah" ? "text-emerald-400" : result.tingkatKesulitan === "Sedang" ? "text-amber-400" : "text-red-400"}>{result.tingkatKesulitan}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Estimasi waktu</p>
                  <p className="text-sm font-bold text-orange-400">{result.estimasiWaktu}</p>
                </div>
              </div>
              <p className="text-slate-300 text-xs">{result.ringkasan}</p>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["gap", "Gap Unit"], ["dokumen", "Dokumen"], ["langkah", "Langkah"], ["pertimbangan", "Pertimbangan"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "gap" && (
              <div className="space-y-3">
                {result.unitKompetensiDiakui?.length > 0 && (
                  <div>
                    <p className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Unit Kompetensi yang Masih Diakui ({result.unitKompetensiDiakui.length})</p>
                    <div className="space-y-1.5">
                      {result.unitKompetensiDiakui.map((u, i) => (
                        <div key={i} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                          <p className="text-xs text-emerald-300 font-medium">{u.unit}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{u.alasan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.unitKompetensiPerluDitambah?.length > 0 && (
                  <div>
                    <p className="text-xs text-orange-400 font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Unit Kompetensi Baru yang Perlu Dipenuhi ({result.unitKompetensiPerluDitambah.length})</p>
                    <div className="space-y-2">
                      {result.unitKompetensiPerluDitambah.map((u, i) => (
                        <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                          <button onClick={() => toggleUnit(i)} className="w-full text-left p-3 flex items-center gap-2">
                            <p className="text-xs text-white font-medium flex-1">{u.unit}</p>
                            <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-700 shrink-0">{u.estimasiWaktu}</Badge>
                            <ChevronDown className={`h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform ${openUnit.has(i) ? "rotate-180" : ""}`} />
                          </button>
                          {openUnit.has(i) && (
                            <div className="px-3 pb-3 border-t border-white/8 pt-2">
                              <p className="text-xs text-slate-400"><ChevronRight className="h-3 w-3 text-orange-400 inline mr-1" />{u.caraMendapatkan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "dokumen" && (
              <div className="space-y-2">
                {result.gapDokumen?.map((d, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-start gap-3 ${d.status === "Bisa dipakai" ? "border-emerald-500/20 bg-emerald-500/5" : d.status === "Perlu diperbarui" ? "border-amber-500/20 bg-amber-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${d.status === "Bisa dipakai" ? "text-emerald-400 border-emerald-400/30 bg-emerald-500/10" : d.status === "Perlu diperbarui" ? "text-amber-400 border-amber-400/30 bg-amber-500/10" : "text-slate-400 border-slate-600 bg-white/5"}`}>{d.status}</div>
                    <div className="flex-1">
                      <p className="text-xs text-white font-medium">{d.dokumen}</p>
                      {d.catatan && <p className="text-[11px] text-slate-400 mt-0.5">{d.catatan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "langkah" && (
              <div className="space-y-2">
                {result.langkahMutasi?.map((l, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4 flex items-start gap-3">
                    <div className="rounded-full bg-orange-500/20 w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold text-orange-400">{i+1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-white font-medium">{l.langkah}</p>
                        <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{l.waktu}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{l.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pertimbangan" && (
              <div className="space-y-3">
                {result.keuntunganMutasi?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Keuntungan Mutasi ke {result.jabatanTujuan}</p>
                    <ul className="space-y-1">{result.keuntunganMutasi.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
                  </div>
                )}
                {result.risikoYangPerluDipertimbangkan?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Risiko & Hal yang Perlu Dipertimbangkan</p>
                    <ul className="space-y-1">{result.risikoYangPerluDipertimbangkan.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{r}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jalur Lain</Button>
              <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs">
                <Link href="/rencana-karir-skk">Rencana Karir →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
