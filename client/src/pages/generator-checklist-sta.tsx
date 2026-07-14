import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ClipboardSignature, Copy,
  CheckCircle2, Info, RotateCcw, ChevronDown
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK = [
  "Gedung Bertingkat (Komersial/Perkantoran)",
  "Gedung Fasilitas Publik (Rumah Sakit, Sekolah, dll)",
  "Perumahan & Hunian (Residensial)",
  "Infrastruktur Jalan & Jembatan",
  "Instalasi MEP (Mekanikal, Elektrikal, Plumbing)",
  "Renovasi & Retrofit Bangunan Eksisting",
];

const TAHAPAN_STA = [
  "STA-1 (Serah Terima Pertama / PHO)",
  "STA-2 (Serah Terima Akhir / FHO) — setelah masa pemeliharaan",
  "Keduanya (PHO + FHO)",
];

interface ChecklistGrup {
  kategori: string; icon: string;
  items: { item: string; kriteria: string; status: "Wajib" | "Opsional"; referensi?: string }[];
}

interface HasilChecklistSTA {
  judulChecklist: string; jenisProyek: string; tahapanSTA: string;
  ringkasan: string;
  totalItemWajib: number; totalItemOpsional: number;
  grupChecklist: ChecklistGrup[];
  dokumenSerahTerima: { dokumen: string; tujuan: string; urgensi: "Wajib" | "Disarankan" }[];
  catatanPenting: string[];
}

export default function GeneratorChecklistSTA() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [tahapanSTA, setTahapanSTA] = useState(TAHAPAN_STA[0]);
  const [fokusKhusus, setFokusKhusus] = useState("");
  const [result, setResult] = useState<HasilChecklistSTA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openGrup, setOpenGrup] = useState<Set<number>>(new Set([0, 1]));
  const [activeTab, setActiveTab] = useState<"checklist" | "dokumen">("checklist");

  function toggleGrup(i: number) { setOpenGrup(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-checklist-sta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, tahapanSTA, fokusKhusus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenGrup(new Set([0, 1]));
    } catch (e: any) { setError(e.message || "Gagal generate checklist."); }
    finally { setLoading(false); }
  }

  function copyChecklist() {
    if (!result) return;
    const lines = result.grupChecklist.flatMap(g => [
      `\n## ${g.kategori}`,
      ...g.items.map(it => `[ ] ${it.item} — ${it.kriteria}${it.referensi ? ` (${it.referensi})` : ""}`)
    ]);
    navigator.clipboard.writeText([result.judulChecklist, ...lines].join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
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
              <ClipboardSignature className="h-5 w-5 text-teal-400" /> Generator Checklist Serah Terima Proyek
            </h1>
            <p className="text-xs text-slate-400">Checklist PHO/FHO komprehensif per kategori pekerjaan: item pemeriksaan, kriteria kelulusan, dokumen serah terima</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-300">Checklist ini mengacu pada persyaratan serah terima sesuai Permen PU dan kontrak konstruksi standar Indonesia (FIDIC adaptasi). Sesuaikan dengan spesifikasi teknis kontrak Anda.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Proyek *</label>
                <div className="space-y-1.5">
                  {JENIS_PROYEK.map(s => (
                    <button key={s} onClick={() => setJenisProyek(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisProyek === s ? "bg-teal-500/10 border-teal-400/30 text-teal-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Tahapan Serah Terima</label>
                <select value={tahapanSTA} onChange={e => setTahapanSTA(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                  {TAHAPAN_STA.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Fokus Khusus <span className="text-slate-600">(opsional)</span></label>
                <input value={fokusKhusus} onChange={e => setFokusKhusus(e.target.value)}
                  placeholder="cth: ada lift, sistem chiller, panel listrik, kolam renang"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisProyek || loading} className="w-full bg-teal-600 hover:bg-teal-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating checklist STA...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Checklist Serah Terima</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulChecklist}</p>
                  <p className="text-[10px] text-slate-500">{result.jenisProyek} · {result.tahapanSTA}</p>
                </div>
                <Button onClick={copyChecklist} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-300 mb-2">{result.ringkasan}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs text-slate-400">Wajib: <span className="text-white font-semibold">{result.totalItemWajib}</span></span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500" /><span className="text-xs text-slate-400">Opsional: <span className="text-white font-semibold">{result.totalItemOpsional}</span></span></div>
              </div>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["checklist", "Checklist Item"], ["dokumen", "Dokumen STA"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "checklist" && (
              <div className="space-y-2">
                {result.grupChecklist?.map((g, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleGrup(i)} className="w-full text-left p-3.5 flex items-center gap-2">
                      <span className="text-base">{g.icon}</span>
                      <p className="text-sm text-white font-medium flex-1">{g.kategori}</p>
                      <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{g.items.length} item</Badge>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openGrup.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openGrup.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-2 space-y-2">
                        {g.items.map((it, j) => (
                          <div key={j} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
                            <div className={`w-3.5 h-3.5 rounded border shrink-0 mt-0.5 ${it.status === "Wajib" ? "border-red-400/50" : "border-slate-600"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white">{it.item}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{it.kriteria}</p>
                              {it.referensi && <p className="text-[9px] text-teal-500 mt-0.5">{it.referensi}</p>}
                            </div>
                            {it.status === "Wajib" && <Badge variant="outline" className="text-[8px] text-red-400 border-red-400/30 shrink-0">Wajib</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "dokumen" && (
              <div className="space-y-2">
                {result.dokumenSerahTerima?.map((d, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <div className={`w-3 h-3 rounded border shrink-0 mt-1 ${d.urgensi === "Wajib" ? "border-red-400/50" : "border-slate-600"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-xs text-white font-medium">{d.dokumen}</p>
                        <Badge variant="outline" className={`text-[8px] border ${d.urgensi === "Wajib" ? "text-red-400 border-red-400/30" : "text-slate-400 border-slate-600"}`}>{d.urgensi}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">{d.tujuan}</p>
                    </div>
                  </div>
                ))}
                {result.catatanPenting?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mt-2">
                    <p className="text-[10px] text-amber-400 font-semibold mb-1.5">Catatan Penting STA</p>
                    {result.catatanPenting.map((c, i) => <p key={i} className="text-xs text-slate-300 mb-1">{i+1}. {c}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs">
                <Link href="/generator-bast-proyek">Generator BAST →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
