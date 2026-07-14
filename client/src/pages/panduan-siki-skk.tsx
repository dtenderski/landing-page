import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Shield, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info,
  Monitor, Upload, FileText, ExternalLink, HelpCircle
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Proyek — Muda",
  "Ahli Quantity Surveyor — Muda", "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
];

const STATUS_OPTIONS = ["Baru mendapat SKK, belum terdaftar", "Sudah terdaftar, perlu update data", "Akan perpanjangan SKK", "Pindah LSP/jabatan"];

interface HasilPanduan {
  jabatan: string; statusPendaftar: string;
  ringkasan: string;
  tahapanRegistrasi: {
    nomor: number; judul: string; deskripsi: string;
    langkahDetail: string[]; dokumenDibutuhkan: string[];
    catatan: string;
  }[];
  sistemTerkait: { nama: string; url: string; fungsi: string; caraMasuk: string }[];
  masalahUmum: { masalah: string; solusi: string }[];
  faq: { pertanyaan: string; jawaban: string }[];
  tipsVerifikasi: string[];
}

export default function PanduanSIKISKK() {
  const [jabatan, setJabatan] = useState("");
  const [statusPendaftar, setStatusPendaftar] = useState("Baru mendapat SKK, belum terdaftar");
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTahap, setOpenTahap] = useState<Set<number>>(new Set([0]));
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"registrasi" | "sistem" | "masalah" | "faq">("registrasi");

  function toggleTahap(i: number) { setOpenTahap(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }
  function toggleFaq(i: number) { setOpenFaq(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null); setOpenTahap(new Set([0]));
    try {
      const res = await fetch("/api/tools/panduan-siki-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, statusPendaftar }),
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
              <Monitor className="h-5 w-5 text-blue-400" /> Panduan Registrasi SIKI-SKK
            </h1>
            <p className="text-xs text-slate-400">Cara mendaftar, mengisi profil, upload dokumen, dan aktivasi SKK di sistem digital LPJK</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">Panduan step-by-step mendaftarkan SKK ke SIKI-SKK (Sistem Informasi Kompetensi Indonesia), SiKA-SKK, dan sistem digital LPJK lainnya — termasuk cara upload dokumen dan verifikasi.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Status Pendaftar</label>
                <div className="space-y-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => setStatusPendaftar(s)}
                      className={`w-full rounded-lg border py-2.5 px-3 text-xs text-left transition-all ${statusPendaftar === s ? "bg-blue-500/15 border-blue-400/40 text-blue-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jabatan || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan SIKI-SKK...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Registrasi</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/40">{result.jabatan}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.statusPendaftar.split(",")[0]}</Badge>
              </div>
              <p className="text-slate-300 text-sm">{result.ringkasan}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["registrasi", "Langkah"], ["sistem", "Sistem"], ["masalah", "Masalah Umum"], ["faq", "FAQ"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "registrasi" && (
              <div className="space-y-2">
                {result.tahapanRegistrasi?.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleTahap(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <div className={`rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold ${openTahap.has(i) ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"}`}>{t.nomor}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{t.judul}</p>
                        <p className="text-[10px] text-slate-500">{t.deskripsi}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openTahap.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openTahap.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                        <div>
                          <p className="text-[10px] text-blue-400 font-semibold mb-1.5">Langkah Detail</p>
                          <ol className="space-y-1">{t.langkahDetail.map((l, li) => <li key={li} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-[10px] font-mono text-slate-600 shrink-0 mt-0.5">{li + 1}.</span>{l}</li>)}</ol>
                        </div>
                        {t.dokumenDibutuhkan?.length > 0 && (
                          <div className="rounded-lg border border-white/8 bg-slate-900/40 px-3 py-2">
                            <p className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1"><Upload className="h-3 w-3" /> Dokumen yang Diupload</p>
                            <ul className="space-y-0.5">{t.dokumenDibutuhkan.map((d, di) => <li key={di} className="text-[11px] text-slate-300 flex items-start gap-1.5"><FileText className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />{d}</li>)}</ul>
                          </div>
                        )}
                        {t.catatan && <p className="text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{t.catatan}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "sistem" && (
              <div className="space-y-3">
                {result.sistemTerkait?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-sm text-white font-medium">{s.nama}</p>
                        <p className="text-[10px] text-blue-400">{s.url}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{s.fungsi}</p>
                    <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                      <p className="text-[10px] text-slate-500 font-semibold mb-0.5">Cara Masuk / Akses</p>
                      <p className="text-xs text-slate-300">{s.caraMasuk}</p>
                    </div>
                  </div>
                ))}
                {result.tipsVerifikasi?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Tips Verifikasi SKK</p>
                    <ul className="space-y-1">{result.tipsVerifikasi.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "masalah" && (
              <div className="space-y-3">
                {result.masalahUmum?.map((m, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-sm text-red-400 font-medium mb-1 flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />{m.masalah}</p>
                    <p className="text-xs text-slate-300 ml-5">{m.solusi}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-2">
                {result.faq?.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleFaq(i)} className="w-full text-left p-3.5 flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <p className="text-sm text-slate-200 flex-1">{f.pertanyaan}</p>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openFaq.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openFaq.has(i) && <div className="px-4 pb-4 border-t border-white/8 pt-3"><p className="text-sm text-slate-400 leading-relaxed">{f.jawaban}</p></div>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Link href="/panduan-pasca-asesmen">Panduan Pasca-Asesmen →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
