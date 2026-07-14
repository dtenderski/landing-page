import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, BadgeCheck, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info, Star, Plus, Trash2
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda",
];

interface KlaimUnit {
  id: string;
  namaUnit: string;
  deskripsiPengalaman: string;
  buktiYangDimiliki: string;
}

interface HasilValidasi {
  jabatan: string;
  ringkasan: string;
  skorKeseluruhan: number; // 0–100
  unitValidasi: {
    namaUnit: string;
    status: "Kuat" | "Cukup" | "Lemah" | "Tidak Cukup";
    skor: number;
    analisis: string;
    buktiYangDiperlukan: string;
    saranPerkuatan: string;
  }[];
  kesiapanAsesmen: string;
  prioritasPerbaikan: string[];
  rekomendasiDokumen: string[];
}

const STATUS_COLOR: Record<string, string> = {
  "Kuat": "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  "Cukup": "text-blue-400 border-blue-500/40 bg-blue-500/10",
  "Lemah": "text-amber-400 border-amber-500/40 bg-amber-500/10",
  "Tidak Cukup": "text-red-400 border-red-500/40 bg-red-500/10",
};

export default function ValidatorKlaimUK() {
  const [jabatan, setJabatan] = useState("");
  const [klaimList, setKlaimList] = useState<KlaimUnit[]>([
    { id: "1", namaUnit: "", deskripsiPengalaman: "", buktiYangDimiliki: "" },
  ]);
  const [result, setResult] = useState<HasilValidasi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openUnit, setOpenUnit] = useState<Set<number>>(new Set([0]));

  function toggleUnit(i: number) { setOpenUnit(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }
  function addKlaim() { setKlaimList(prev => [...prev, { id: Date.now().toString(), namaUnit: "", deskripsiPengalaman: "", buktiYangDimiliki: "" }]); }
  function removeKlaim(id: string) { setKlaimList(prev => prev.filter(k => k.id !== id)); }
  function updateKlaim(id: string, field: keyof KlaimUnit, val: string) { setKlaimList(prev => prev.map(k => k.id === id ? { ...k, [field]: val } : k)); }

  const isValid = jabatan && klaimList.length > 0 && klaimList.every(k => k.namaUnit && k.deskripsiPengalaman);

  async function validate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/validator-klaim-uk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, klaimList }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenUnit(new Set([0]));
    } catch (e: any) { setError(e.message || "Gagal memvalidasi klaim."); }
    finally { setLoading(false); }
  }

  const skorColor = (result?.skorKeseluruhan ?? 0) >= 80 ? "text-emerald-400" : (result?.skorKeseluruhan ?? 0) >= 60 ? "text-blue-400" : (result?.skorKeseluruhan ?? 0) >= 40 ? "text-amber-400" : "text-red-400";
  const barColor = (result?.skorKeseluruhan ?? 0) >= 80 ? "bg-emerald-400" : (result?.skorKeseluruhan ?? 0) >= 60 ? "bg-blue-400" : (result?.skorKeseluruhan ?? 0) >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-indigo-400" /> Validator Klaim Unit Kompetensi SKK
            </h1>
            <p className="text-xs text-slate-400">Deskripsikan pengalaman per unit kompetensi → AI nilai kekuatan klaim & saran perkuatan sebelum asesmen</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 flex items-start gap-2">
              <BadgeCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-300">Sebelum mendaftar asesmen, pastikan klaim unit kompetensi Anda cukup kuat. AI akan menilai setiap klaim dan memberikan skor serta saran konkret untuk memperkuat bukti.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dituju *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="border-t border-white/8 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Unit Kompetensi yang Diklaim *</label>
                  <Button onClick={addKlaim} variant="outline" className="h-6 text-[10px] gap-1 px-2"><Plus className="h-3 w-3" />Tambah Unit</Button>
                </div>
                <div className="space-y-3">
                  {klaimList.map((k, i) => (
                    <div key={k.id} className="rounded-xl border border-white/8 bg-slate-900/40 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-indigo-400 font-bold shrink-0">UK {i+1}</span>
                        <input value={k.namaUnit} onChange={e => updateKlaim(k.id, "namaUnit", e.target.value)}
                          placeholder="Nama / kode unit kompetensi (cth: Merencanakan K3 Konstruksi)"
                          className="flex-1 rounded border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                        {klaimList.length > 1 && <button onClick={() => removeKlaim(k.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                      <textarea value={k.deskripsiPengalaman} onChange={e => updateKlaim(k.id, "deskripsiPengalaman", e.target.value)}
                        placeholder="Deskripsikan pengalaman yang membuktikan kompetensi di unit ini (proyek, peran, hasil konkret)..."
                        rows={2} className="w-full rounded border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none" />
                      <input value={k.buktiYangDimiliki} onChange={e => updateKlaim(k.id, "buktiYangDimiliki", e.target.value)}
                        placeholder="Bukti dokumen yang dimiliki (cth: surat tugas, ijazah pelatihan, laporan proyek)"
                        className="w-full rounded border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={validate} disabled={!isValid || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memvalidasi klaim kompetensi...</> : <><Sparkles className="h-4 w-4 mr-2" />Validasi Klaim Unit Kompetensi</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">{result.jabatan}</p>
                  <p className="text-sm text-slate-300">{result.ringkasan}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-3xl font-bold ${skorColor}`}>{result.skorKeseluruhan}</p>
                  <p className="text-[9px] text-slate-500">skor kesiapan</p>
                </div>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${result.skorKeseluruhan}%` }} />
              </div>
              <p className="text-xs text-slate-400 italic">{result.kesiapanAsesmen}</p>
            </div>

            <div className="space-y-2 mb-4">
              {result.unitValidasi?.map((u, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleUnit(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                    <div className="rounded-full bg-indigo-500/20 w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-400">{i+1}</div>
                    <p className="text-sm text-white font-medium flex-1">{u.namaUnit}</p>
                    <Badge variant="outline" className={`text-[9px] border shrink-0 ${STATUS_COLOR[u.status]}`}>{u.status}</Badge>
                    <span className={`text-xs font-bold shrink-0 ${STATUS_COLOR[u.status].split(" ")[0]}`}>{u.skor}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openUnit.has(i) ? "rotate-180" : ""}`} />
                  </button>
                  {openUnit.has(i) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                      <p className="text-xs text-slate-400">{u.analisis}</p>
                      <div className="rounded-lg bg-slate-900/50 p-3 space-y-2">
                        <div>
                          <p className="text-[10px] text-amber-400 font-semibold">Bukti yang Diperlukan Asesor</p>
                          <p className="text-xs text-slate-300">{u.buktiYangDiperlukan}</p>
                        </div>
                        {u.saranPerkuatan && <div>
                          <p className="text-[10px] text-indigo-400 font-semibold">Saran Perkuatan Klaim</p>
                          <p className="text-xs text-slate-300">{u.saranPerkuatan}</p>
                        </div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.prioritasPerbaikan?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Prioritas Perbaikan Sebelum Mendaftar</p>
                <ul className="space-y-1">{result.prioritasPerbaikan.map((p, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-[9px] font-bold text-amber-400 shrink-0 mt-0.5">{i+1}.</span>{p}</li>)}</ul>
              </div>
            )}

            {result.rekomendasiDokumen?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
                <p className="text-slate-300 text-xs font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />Dokumen Pendukung yang Disarankan</p>
                <div className="flex flex-wrap gap-1">{result.rekomendasiDokumen.map((d, i) => <Badge key={i} variant="outline" className="text-[9px] text-indigo-300 border-indigo-400/30">{d}</Badge>)}</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Validasi Ulang</Button>
              <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                <Link href="/checker-kesiapan-asesmen">Checker Kesiapan Asesmen →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
