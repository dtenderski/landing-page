import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Building2, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info, DollarSign
} from "lucide-react";
import { Link } from "wouter";

const KLASIFIKASI_OPTIONS = [
  "Bangunan Gedung (BG)", "Bangunan Sipil (BS)",
  "Instalasi Mekanikal-Elektrikal (ME)", "Konstruksi Spesialis (KS)",
  "Jasa Konsultansi Konstruksi (KK)",
];

const KUALIFIKASI_OPTIONS = [
  "Kecil (K1)", "Kecil (K2)", "Kecil (K3)",
  "Menengah (M1)", "Menengah (M2)",
  "Besar (B1)", "Besar (B2)",
];

const KONDISI_OPTIONS = [
  "Baru mendirikan perusahaan (belum ada SBU)",
  "Sudah punya PT/CV, belum ada SBU",
  "Memperpanjang SBU yang kadaluarsa",
  "Upgrade kualifikasi SBU (naik kelas)",
  "Tambah subklasifikasi baru",
];

interface HasilPanduan {
  klasifikasi: string; kualifikasi: string; kondisi: string;
  ringkasan: string;
  persyaratanSKK: { jabatan: string; jumlah: number; keterangan: string }[];
  persyaratanDokumen: { dokumen: string; keterangan: string; wajib: boolean }[];
  langkahPendaftaran: { langkah: string; platform: string; detail: string; estimasiWaktu: string; biaya: string }[];
  syaratModalMinimal: string;
  masaBerlaku: string;
  tipsProses: string[];
  kesalahanUmum: string[];
}

export default function PanduanIUJKSBU() {
  const [klasifikasi, setKlasifikasi] = useState("");
  const [kualifikasi, setKualifikasi] = useState("Kecil (K1)");
  const [kondisi, setKondisi] = useState(KONDISI_OPTIONS[1]);
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openLangkah, setOpenLangkah] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"skk" | "dokumen" | "langkah" | "tips">("skk");

  function toggleLangkah(i: number) { setOpenLangkah(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!klasifikasi) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-iujk-sbu", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ klasifikasi, kualifikasi, kondisi }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenLangkah(new Set([0]));
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
              <Building2 className="h-5 w-5 text-emerald-400" /> Panduan Pengurusan SBU & IUJK
            </h1>
            <p className="text-xs text-slate-400">Dari SKK ke SBU — persyaratan, dokumen, platform OSS, langkah-langkah, biaya, dan tips sukses</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-start gap-2">
              <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300">Setelah SKK, langkah berikutnya adalah mendaftarkan BUJK dan mendapatkan SBU. Panduan ini menjelaskan seluruh proses dari A hingga Z termasuk persyaratan SKK yang dibutuhkan.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Klasifikasi SBU yang Dituju *</label>
                <select value={klasifikasi} onChange={e => setKlasifikasi(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/50">
                  <option value="">Pilih klasifikasi...</option>
                  {KLASIFIKASI_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kualifikasi</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {KUALIFIKASI_OPTIONS.map(k => (
                    <button key={k} onClick={() => setKualifikasi(k)}
                      className={`rounded-lg border py-2 text-xs transition-all ${kualifikasi === k ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{k}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kondisi Perusahaan Saat Ini</label>
                <div className="space-y-1.5">
                  {KONDISI_OPTIONS.map(c => (
                    <button key={c} onClick={() => setKondisi(c)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${kondisi === c ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!klasifikasi || loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan SBU...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan SBU & IUJK</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40">{result.klasifikasi}</Badge>
                <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">{result.kualifikasi}</Badge>
              </div>
              <p className="text-slate-300 text-sm mb-2">{result.ringkasan}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                  <p className="text-[9px] text-slate-500">Modal Minimal</p>
                  <p className="text-xs text-white font-medium">{result.syaratModalMinimal}</p>
                </div>
                <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                  <p className="text-[9px] text-slate-500">Masa Berlaku SBU</p>
                  <p className="text-xs text-white font-medium">{result.masaBerlaku}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["skk", "SKK Wajib"], ["dokumen", "Dokumen"], ["langkah", "Langkah"], ["tips", "Tips"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "skk" && (
              <div className="space-y-2">
                {result.persyaratanSKK?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-white font-medium flex-1">{s.jabatan}</p>
                      <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-400/30">min. {s.jumlah} orang</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{s.keterangan}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "dokumen" && (
              <div className="space-y-2">
                {result.persyaratanDokumen?.map((d, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-start gap-3 ${d.wajib ? "border-red-500/15 bg-red-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className={`w-3 h-3 rounded border shrink-0 mt-0.5 ${d.wajib ? "border-red-400/50" : "border-slate-600"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs text-white font-medium">{d.dokumen}</p>
                        {d.wajib && <Badge variant="outline" className="text-[8px] text-red-400 border-red-400/30">Wajib</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-400">{d.keterangan}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "langkah" && (
              <div className="space-y-2">
                {result.langkahPendaftaran?.map((l, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleLangkah(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/20 w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold text-emerald-400">{i+1}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{l.langkah}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-700">{l.platform}</Badge>
                          <span className="text-[9px] text-slate-500">{l.estimasiWaktu}</span>
                          {l.biaya && <span className="text-[9px] text-emerald-400">{l.biaya}</span>}
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openLangkah.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openLangkah.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3">
                        <p className="text-xs text-slate-400">{l.detail}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {result.tipsProses?.map((t, i) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                      <p className="text-xs text-slate-300">{t}</p>
                    </div>
                  ))}
                </div>
                {result.kesalahanUmum?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Kesalahan yang Sering Terjadi</p>
                    <ul className="space-y-1">{result.kesalahanUmum.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Kualifikasi Lain</Button>
              <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Link href="/kalkulator-manfaat-skk-bujk">Kalkulator Manfaat SKK →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
