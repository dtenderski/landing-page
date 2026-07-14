import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ArrowUpFromLine, Info,
  ChevronDown, AlertTriangle, CheckCircle2, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN = [
  "Pemasangan Scaffolding / Perancah",
  "Pekerjaan Bekisting & Pengecoran di Ketinggian",
  "Pemasangan Rangka Atap / Kuda-Kuda",
  "Pemasangan Fasad & Curtain Wall",
  "Pekerjaan Pengecatan Eksterior Gedung Tinggi",
  "Perawatan & Pembersihan Gedung (Gondola/Rope Access)",
  "Pemasangan Tower Crane & Alat Berat Vertikal",
  "Pekerjaan di Jembatan & Viaduk",
  "Penggantian Atap & Waterproofing Ketinggian",
];

const KETINGGIAN = [
  "1.8 – 3 meter (scaffolding rendah)",
  "3 – 6 meter (lantai 2)",
  "6 – 15 meter (lantai 2–5)",
  "15 – 30 meter (lantai 5–10)",
  "> 30 meter (high-rise / high-rise crane)",
];

interface RisikoItem { bahaya: string; level: "Kritis" | "Tinggi" | "Sedang"; pengendalian: string[] }
interface HasilK3Ketinggian {
  jenisPekerjaan: string; ketinggian: string;
  ringkasanRisiko: string;
  persyaratanAPD: { item: string; standar: string; catatan: string }[];
  prosedurKerja: string[];
  risikoUtama: RisikoItem[];
  persyaratanLegal: string[];
  checklistSebelumKerja: string[];
  prosedurDarurat: string[];
  referensi: string[];
}

const LEVEL_COLOR: Record<string, string> = {
  "Kritis": "text-red-400 border-red-500/30 bg-red-500/5",
  "Tinggi": "text-orange-400 border-orange-500/30 bg-orange-500/5",
  "Sedang": "text-amber-400 border-amber-500/30 bg-amber-500/5",
};

export default function PanduanK3Ketinggian() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState("");
  const [ketinggian, setKetinggian] = useState(KETINGGIAN[2]);
  const [result, setResult] = useState<HasilK3Ketinggian | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"apd" | "prosedur" | "risiko" | "darurat" | "checklist">("apd");
  const [openRisiko, setOpenRisiko] = useState<Set<number>>(new Set([0]));

  function toggleRisiko(i: number) { setOpenRisiko(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisPekerjaan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-k3-ketinggian", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, ketinggian }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenRisiko(new Set([0]));
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
              <ArrowUpFromLine className="h-5 w-5 text-orange-400" /> Panduan K3 Pekerjaan Ketinggian
            </h1>
            <p className="text-xs text-slate-400">APD wajib, prosedur kerja aman, risiko + pengendalian, checklist, prosedur darurat per jenis pekerjaan ketinggian</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">Pekerjaan ketinggian ≥ 1.8m wajib menggunakan sistem proteksi jatuh sesuai Permenaker No. 9/2016 tentang K3 dalam Pekerjaan pada Ketinggian.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan Ketinggian *</label>
                <div className="space-y-1.5">
                  {JENIS_PEKERJAAN.map(s => (
                    <button key={s} onClick={() => setJenisPekerjaan(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisPekerjaan === s ? "bg-orange-500/10 border-orange-400/30 text-orange-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Rentang Ketinggian</label>
                <div className="space-y-1.5">
                  {KETINGGIAN.map(s => (
                    <button key={s} onClick={() => setKetinggian(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${ketinggian === s ? "bg-orange-500/10 border-orange-400/30 text-orange-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisPekerjaan || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan K3...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Panduan K3 Ketinggian</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 mb-4">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/40">{result.jenisPekerjaan}</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600">{result.ketinggian}</Badge>
              </div>
              <p className="text-xs text-slate-300">{result.ringkasanRisiko}</p>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1 flex-wrap">
              {([["apd", "APD"], ["prosedur", "Prosedur"], ["risiko", "Risiko"], ["checklist", "Checklist"], ["darurat", "Darurat"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all min-w-14 ${activeTab === k ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "apd" && (
              <div className="space-y-2">
                {result.persyaratanAPD?.map((a, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-white font-medium">{a.item}</p>
                      <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-400/30 shrink-0">{a.standar}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{a.catatan}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "prosedur" && (
              <div className="space-y-2">
                {result.prosedurKerja?.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{p}</p>
                  </div>
                ))}
                {result.persyaratanLegal?.length > 0 && (
                  <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 mt-2">
                    <p className="text-[10px] text-blue-400 font-semibold mb-2">Regulasi yang Berlaku</p>
                    <div className="flex flex-wrap gap-1">{result.persyaratanLegal.map((r, i) => <Badge key={i} variant="outline" className="text-[9px] text-slate-300 border-slate-600">{r}</Badge>)}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "risiko" && (
              <div className="space-y-2">
                {result.risikoUtama?.map((r, i) => (
                  <div key={i} className={`rounded-xl border ${LEVEL_COLOR[r.level]}`}>
                    <button onClick={() => toggleRisiko(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <Badge variant="outline" className={`text-[9px] border ${LEVEL_COLOR[r.level]} shrink-0`}>{r.level}</Badge>
                      <p className="text-sm text-white font-medium flex-1">{r.bahaya}</p>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openRisiko.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openRisiko.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3">
                        <p className="text-[10px] text-slate-500 mb-1.5">Pengendalian</p>
                        <ul className="space-y-1">{r.pengendalian.map((p, pi) => <li key={pi} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="space-y-2">
                {result.checklistSebelumKerja?.map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <div className="w-4 h-4 rounded border border-slate-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">{c}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "darurat" && (
              <div className="space-y-2">
                {result.prosedurDarurat?.map((d, i) => (
                  <div key={i} className="rounded-xl border border-red-500/15 bg-red-500/5 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-red-500/20 text-red-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{d}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Jenis Lain</Button>
              <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs">
                <Link href="/generator-jsa">Generator JSA →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
