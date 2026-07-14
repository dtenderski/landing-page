import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Briefcase, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info,
  Building2, FileText, DollarSign
} from "lucide-react";
import { Link } from "wouter";

const BIDANG_OPTIONS = [
  "Konsultan Manajemen Proyek (PMC)", "Konsultan Pengawas / Supervisi",
  "Konsultan Perencana Struktur", "Konsultan Perencana Arsitektur",
  "Konsultan Perencana MEP", "Konsultan K3 Konstruksi",
  "Konsultan Quantity Surveying (QS)", "Konsultan Manajemen Kontrak",
  "Konsultan Studi Kelayakan", "Konsultan AMDAL / Lingkungan",
  "Konsultan Geoteknik / Geodesi", "Konsultan BIM",
];

const SKALA_OPTIONS = ["Konsultan Perorangan / Freelance", "BUJK Konsultan Kecil (< 5 ahli)", "BUJK Konsultan Menengah (5–15 ahli)", "BUJK Konsultan Besar (> 15 ahli)"];

interface HasilPanduan {
  bidang: string; skala: string;
  ringkasan: string;
  jabatanSKKWajib: { jabatan: string; jumlahMinimal: number; alasan: string; alternatif: string }[];
  jabatanSKKDisarankan: { jabatan: string; manfaat: string }[];
  persyaratanBUJK: { persyaratan: string; detail: string; dokumen: string }[];
  tipsJasaKonsultansi: string[];
  perbedaanDenganKontraktor: string[];
  estimasiBiayaSetup: { komponen: string; estimasi: string; catatan: string }[];
}

export default function PanduanSKKJasaKonsultansi() {
  const [bidang, setBidang] = useState("");
  const [skala, setSkala] = useState("BUJK Konsultan Kecil (< 5 ahli)");
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openPersyaratan, setOpenPersyaratan] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"jabatan" | "persyaratan" | "biaya" | "tips">("jabatan");

  function toggleP(i: number) { setOpenPersyaratan(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!bidang) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-skk-jasa-konsultansi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidang, skala }),
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
              <Briefcase className="h-5 w-5 text-cyan-400" /> Panduan SKK untuk Jasa Konsultansi
            </h1>
            <p className="text-xs text-slate-400">Jabatan SKK wajib & disarankan, persyaratan BUJK konsultan, dan perbedaan dengan kontraktor</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-300">Jasa konsultansi konstruksi memiliki persyaratan SKK yang berbeda dari kontraktor. Panduan ini khusus membahas kebutuhan tenaga ahli SKK untuk BUJK atau konsultan perorangan di bidang yang Anda pilih.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Bidang Jasa Konsultansi *</label>
                <select value={bidang} onChange={e => setBidang(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                  <option value="">Pilih bidang konsultansi...</option>
                  {BIDANG_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Skala Usaha</label>
                <div className="space-y-1.5">
                  {SKALA_OPTIONS.map(s => (
                    <button key={s} onClick={() => setSkala(s)}
                      className={`w-full rounded-lg border py-2.5 px-3 text-xs text-left transition-all ${skala === s ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!bidang || loading} className="w-full bg-cyan-600 hover:bg-cyan-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan konsultansi...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan SKK Konsultansi</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/40">{result.bidang}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.skala}</Badge>
              </div>
              <p className="text-slate-300 text-sm">{result.ringkasan}</p>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["jabatan", "Jabatan SKK"], ["persyaratan", "Persyaratan BUJK"], ["biaya", "Estimasi Setup"], ["tips", "Tips"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "jabatan" && (
              <div className="space-y-3">
                {result.jabatanSKKWajib?.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Jabatan SKK Wajib</p>
                    <div className="space-y-2">
                      {result.jabatanSKKWajib.map((j, i) => (
                        <div key={i} className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-white font-medium">{j.jabatan}</p>
                            <Badge variant="outline" className="text-[9px] text-red-400 border-red-400/30">min. {j.jumlahMinimal} orang</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{j.alasan}</p>
                          {j.alternatif && <p className="text-[11px] text-slate-500 flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />Alternatif: {j.alternatif}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.jabatanSKKDisarankan?.length > 0 && (
                  <div>
                    <p className="text-xs text-cyan-400 font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Jabatan SKK yang Disarankan</p>
                    <div className="space-y-2">
                      {result.jabatanSKKDisarankan.map((j, i) => (
                        <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-white font-medium">{j.jabatan}</p>
                            <p className="text-[11px] text-slate-400">{j.manfaat}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "persyaratan" && (
              <div className="space-y-2">
                {result.persyaratanBUJK?.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleP(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <div className="rounded-full bg-cyan-500/20 w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold text-cyan-400">{i+1}</div>
                      <p className="text-sm text-white font-medium flex-1">{p.persyaratan}</p>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openPersyaratan.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openPersyaratan.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                        <p className="text-xs text-slate-400">{p.detail}</p>
                        {p.dokumen && <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                          <p className="text-[10px] text-cyan-400 font-semibold mb-0.5">Dokumen yang Dibutuhkan</p>
                          <p className="text-xs text-slate-300">{p.dokumen}</p>
                        </div>}
                      </div>
                    )}
                  </div>
                ))}
                {result.perbedaanDenganKontraktor?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-2">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Perbedaan Utama vs BUJK Kontraktor</p>
                    <ul className="space-y-1">{result.perbedaanDenganKontraktor.map((p, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "biaya" && (
              <div className="space-y-2">
                {result.estimasiBiayaSetup?.map((b, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-white font-medium">{b.komponen}</p>
                      <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30">{b.estimasi}</Badge>
                    </div>
                    {b.catatan && <p className="text-[11px] text-slate-500">{b.catatan}</p>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-2">
                {result.tipsJasaKonsultansi?.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Bidang Lain</Button>
              <Button asChild className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs">
                <Link href="/kalkulator-manfaat-skk-bujk">Kalkulator Manfaat SKK →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
