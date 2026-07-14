import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileText, ChevronRight,
  ChevronDown, CheckCircle2, AlertTriangle, Info, Gavel
} from "lucide-react";
import { Link } from "wouter";

const JABATAN_PENGADAAN = [
  "PPK (Pejabat Pembuat Komitmen)",
  "PPTK (Pejabat Pelaksana Teknis Kegiatan)",
  "PP (Pejabat Pengadaan)",
  "Pokja Pemilihan (ULP/UKPBJ)",
  "Panitia Penerimaan Hasil Pekerjaan (PPHP)",
  "Konsultan Pengawas Proyek Pemerintah",
  "Pengelola Keuangan Proyek Konstruksi",
];

const NILAI_KONTRAK = ["< Rp 200 juta", "Rp 200 juta – 2,5 miliar", "Rp 2,5 – 50 miliar", "Rp 50 – 100 miliar", "> Rp 100 miliar"];

interface HasilPanduan {
  jabatan: string; nilaiKontrak: string;
  ringkasan: string;
  skk_wajib: { jabatan: string; jenjang: string; alasan: string; regulasiAcuan: string }[];
  skk_disarankan: { jabatan: string; manfaat: string }[];
  konsekuensiTanpaSKK: string[];
  langkahMempersiapkan: { langkah: string; detail: string }[];
  regulasiReferensi: string[];
  tipsKepatuhan: string[];
}

export default function PanduanSKKPengadaan() {
  const [jabatan, setJabatan] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("Rp 200 juta – 2,5 miliar");
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"wajib" | "langkah" | "regulasi" | "tips">("wajib");

  async function generate() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-skk-pengadaan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, nilaiKontrak }),
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
              <Gavel className="h-5 w-5 text-slate-300" /> Panduan SKK untuk Pengadaan Konstruksi
            </h1>
            <p className="text-xs text-slate-400">SKK wajib untuk PPK, PPTK, PP, Pokja, dan PPHP di proyek konstruksi pemerintah</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-500/20 bg-slate-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">Regulasi pengadaan dan UU Jasa Konstruksi mensyaratkan kompetensi bagi pengelola kontrak konstruksi pemerintah. Panduan ini menjelaskan SKK apa yang diperlukan berdasarkan jabatan dan nilai kontrak.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan / Peran di Pengadaan *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-slate-400/50">
                  <option value="">Pilih jabatan pengadaan...</option>
                  {JABATAN_PENGADAAN.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak yang Dikelola</label>
                <div className="space-y-1.5">
                  {NILAI_KONTRAK.map(n => (
                    <button key={n} onClick={() => setNilaiKontrak(n)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${nilaiKontrak === n ? "bg-slate-500/15 border-slate-400/40 text-slate-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jabatan || loading} className="w-full bg-slate-600 hover:bg-slate-500">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan pengadaan...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Panduan SKK Pengadaan</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-slate-500/30 bg-slate-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs text-slate-300 border-slate-500/40">{result.jabatan}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">{result.nilaiKontrak}</Badge>
              </div>
              <p className="text-slate-300 text-sm">{result.ringkasan}</p>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["wajib", "SKK Wajib"], ["langkah", "Langkah"], ["regulasi", "Regulasi"], ["tips", "Tips"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "wajib" && (
              <div className="space-y-3">
                {result.skk_wajib?.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> SKK yang Wajib Dimiliki</p>
                    <div className="space-y-2">
                      {result.skk_wajib.map((s, i) => (
                        <div key={i} className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-white font-medium">{s.jabatan}</p>
                            <Badge variant="outline" className="text-[9px] text-slate-300 border-slate-600">{s.jenjang}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{s.alasan}</p>
                          <p className="text-[11px] text-slate-500 flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-slate-600 shrink-0 mt-0.5" />{s.regulasiAcuan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.skk_disarankan?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> SKK Tambahan yang Disarankan</p>
                    <div className="space-y-2">
                      {result.skk_disarankan.map((s, i) => (
                        <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-white font-medium">{s.jabatan}</p>
                            <p className="text-[11px] text-slate-400">{s.manfaat}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.konsekuensiTanpaSKK?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Konsekuensi Tanpa SKK</p>
                    <ul className="space-y-1">{result.konsekuensiTanpaSKK.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "langkah" && (
              <div className="space-y-2">
                {result.langkahMempersiapkan?.map((l, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4 flex items-start gap-3">
                    <div className="rounded-full bg-slate-500/20 w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold text-slate-300">{i+1}</div>
                    <div>
                      <p className="text-sm text-white font-medium mb-0.5">{l.langkah}</p>
                      <p className="text-xs text-slate-400">{l.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "regulasi" && (
              <div className="space-y-2">
                {result.regulasiReferensi?.map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">{r}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-2">
                {result.tipsKepatuhan?.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-slate-500/20 text-slate-300 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-slate-600 hover:bg-slate-500 text-xs">
                <Link href="/kalkulator-manfaat-skk-bujk">Kalkulator Manfaat SKK →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
