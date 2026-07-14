import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Building, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info, Phone,
  Globe, DollarSign, Calendar, Star
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
];

const PRIORITAS_OPTIONS = [
  "Biaya paling murah", "Jadwal paling cepat",
  "Reputasi / nama besar LSP", "Lokasi dekat / mudah dijangkau",
  "Proses paling mudah", "LSP yang sudah berpengalaman untuk jabatan ini",
];

interface HasilPanduan {
  jabatan: string;
  ringkasanPanduan: string;
  tipologiLSP: { tipe: string; contoh: string; keunggulan: string; kelemahan: string; cocokUntuk: string }[];
  caraMenemukanLSP: { langkah: string; detail: string; tips: string }[];
  checklistVerifikasiLSP: { kriteria: string; cara: string; bendaRed: boolean }[];
  estimasiBiaya: { komponenBiaya: string; rentang: string; catatan: string }[];
  tipsNegosiasiJadwal: string[];
  pertanyaanKepadaLSP: string[];
  peringatanUmum: string[];
}

export default function PanduanPemilihanLSP() {
  const [jabatan, setJabatan] = useState("");
  const [prioritas, setPrioritas] = useState<string[]>([]);
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTipe, setOpenTipe] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"temukan" | "verifikasi" | "biaya" | "tips">("temukan");

  function togglePrioritas(p: string) {
    setPrioritas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }
  function toggleTipe(i: number) { setOpenTipe(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null); setOpenTipe(new Set([0]));
    try {
      const res = await fetch("/api/tools/panduan-pemilihan-lsp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, prioritas }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
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
              <Building className="h-5 w-5 text-indigo-400" /> Panduan Memilih LSP SKK
            </h1>
            <p className="text-xs text-slate-400">Tips memilih LSP yang tepat: cara menemukan, verifikasi keaslian, estimasi biaya, dan pertanyaan yang harus ditanyakan</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-300">Pilih LSP yang tepat sangat menentukan kelancaran proses sertifikasi SKK. Panduan ini membantu Anda menemukan, memverifikasi, dan bernegosiasi dengan LSP yang sesuai kebutuhan.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dicari *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Prioritas Saya <span className="text-slate-600">(pilih yang paling penting, opsional)</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRIORITAS_OPTIONS.map(p => (
                    <button key={p} onClick={() => togglePrioritas(p)}
                      className={`rounded-lg border py-2 px-3 text-xs text-left transition-all ${prioritas.includes(p) ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jabatan || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan LSP...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Pemilihan LSP</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
              <Badge variant="outline" className="text-xs text-indigo-400 border-indigo-400/40 mb-2">{result.jabatan}</Badge>
              <p className="text-slate-300 text-sm">{result.ringkasanPanduan}</p>
            </div>

            {/* Tipologi LSP */}
            {result.tipologiLSP?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
                <p className="text-xs text-indigo-400 font-semibold mb-2">Tipe-Tipe LSP yang Melayani SKK Konstruksi</p>
                <div className="space-y-1.5">
                  {result.tipologiLSP.map((t, i) => (
                    <div key={i} className="rounded-lg border border-white/8 bg-slate-900/40">
                      <button onClick={() => toggleTipe(i)} className="w-full text-left px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white font-medium">{t.tipe}</p>
                          <p className="text-[10px] text-slate-500">{t.contoh}</p>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform ${openTipe.has(i) ? "rotate-180" : ""}`} />
                      </button>
                      {openTipe.has(i) && (
                        <div className="px-3 pb-3 border-t border-white/8 pt-2 space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded bg-emerald-500/5 border border-emerald-500/15 px-2 py-1.5">
                              <p className="text-[9px] text-emerald-400 font-semibold mb-0.5">Keunggulan</p>
                              <p className="text-[11px] text-slate-300">{t.keunggulan}</p>
                            </div>
                            <div className="rounded bg-red-500/5 border border-red-500/15 px-2 py-1.5">
                              <p className="text-[9px] text-red-400 font-semibold mb-0.5">Kelemahan</p>
                              <p className="text-[11px] text-slate-300">{t.kelemahan}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-indigo-300 bg-indigo-500/5 border border-indigo-500/15 rounded px-2 py-1.5"><span className="font-semibold">Cocok untuk: </span>{t.cocokUntuk}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["temukan", "Cara Cari"], ["verifikasi", "Verifikasi"], ["biaya", "Estimasi Biaya"], ["tips", "Tips"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "temukan" && (
              <div className="space-y-3">
                {result.caraMenemukanLSP?.map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="rounded-full bg-indigo-500/20 w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-400">{i+1}</div>
                      <p className="text-sm text-white font-medium">{c.langkah}</p>
                    </div>
                    <p className="text-xs text-slate-400 ml-9 mb-1">{c.detail}</p>
                    {c.tips && <p className="text-[11px] text-indigo-300 ml-9 flex items-start gap-1.5"><Star className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />{c.tips}</p>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "verifikasi" && (
              <div className="space-y-2">
                {result.checklistVerifikasiLSP?.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-start gap-3 ${c.bendaRed ? "border-red-500/20 bg-red-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center mt-0.5 ${c.bendaRed ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
                      {c.bendaRed ? <AlertTriangle className="h-3 w-3 text-red-400" /> : <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium mb-0.5 ${c.bendaRed ? "text-red-300" : "text-slate-200"}`}>{c.kriteria}</p>
                      <p className="text-[11px] text-slate-400">{c.cara}</p>
                    </div>
                  </div>
                ))}
                {result.pertanyaanKepadaLSP?.length > 0 && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 mt-2">
                    <p className="text-indigo-400 text-xs font-semibold mb-2">Pertanyaan yang Harus Ditanyakan ke LSP</p>
                    <ul className="space-y-1">{result.pertanyaanKepadaLSP.map((q, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />{q}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "biaya" && (
              <div className="space-y-2">
                {result.estimasiBiaya?.map((b, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-white font-medium">{b.komponenBiaya}</p>
                      {b.catatan && <p className="text-[11px] text-slate-500 mt-0.5">{b.catatan}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30 ml-3 shrink-0">{b.rentang}</Badge>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-3">
                {result.tipsNegosiasiJadwal?.length > 0 && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                    <p className="text-indigo-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Tips Negosiasi Jadwal & Biaya</p>
                    <ul className="space-y-1">{result.tipsNegosiasiJadwal.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
                  </div>
                )}
                {result.peringatanUmum?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Peringatan: Hindari LSP Seperti Ini</p>
                    <ul className="space-y-1">{result.peringatanUmum.map((p, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                <Link href="/checker-kesiapan-asesmen">Cek Kesiapan Dokumen →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
