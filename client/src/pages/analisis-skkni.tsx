import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ChevronDown, ChevronRight,
  BookOpen, Target, FileCheck, Mic, Eye, PenLine, ClipboardList,
  Lightbulb, Info, ExternalLink, LayoutGrid, List, CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda",
  "Ahli K3 Konstruksi — Madya",
  "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Konstruksi — Muda",
  "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Proyek — Utama",
  "Ahli Quantity Surveyor — Muda",
  "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda",
  "Ahli Pengawas Konstruksi — Madya",
  "Ahli Manajemen Kontrak — Muda",
  "Ahli Manajemen Kontrak — Madya",
  "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jalan — Madya",
  "Ahli Teknik Jembatan — Muda",
  "Ahli Teknik Geoteknik — Muda",
  "Ahli Teknik Mekanikal — Muda",
  "Ahli Teknik Elektrikal — Muda",
  "Ahli Arsitektur — Muda",
  "Ahli Arsitektur — Madya",
  "Ahli Geodesi — Muda",
  "Ahli Lingkungan — Muda",
];

const METODE_ICON: Record<string, any> = {
  "Wawancara": Mic,
  "Observasi": Eye,
  "Tes Tertulis": PenLine,
  "Portofolio": FileCheck,
  "Demonstrasi": ClipboardList,
};
const METODE_COLOR: Record<string, string> = {
  "Wawancara": "text-rose-400 border-rose-400/30 bg-rose-500/5",
  "Observasi": "text-amber-400 border-amber-400/30 bg-amber-500/5",
  "Tes Tertulis": "text-blue-400 border-blue-400/30 bg-blue-500/5",
  "Portofolio": "text-violet-400 border-violet-400/30 bg-violet-500/5",
  "Demonstrasi": "text-teal-400 border-teal-400/30 bg-teal-500/5",
};

interface UnitKompetensi {
  kodeUnit: string;
  namaUnit: string;
  jenis: "Inti" | "Pilihan" | "Umum";
  deskripsi: string;
  elemenKompetensi: { nama: string; kuk: string[] }[];
  metodeAsesmen: string[];
  contohBukti: string[];
  tipAsesmen: string;
}

interface HasilAnalisis {
  jabatan: string;
  kkniLevel: string;
  totalUnit: number;
  ringkasanSkema: string;
  unitKompetensi: UnitKompetensi[];
  strategiUmum: string[];
}

export default function AnalisisSKKNI() {
  const [jabatan, setJabatan] = useState("");
  const [result, setResult] = useState<HasilAnalisis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [filterJenis, setFilterJenis] = useState<"semua" | "Inti" | "Pilihan" | "Umum">("semua");

  function toggleUnit(kode: string) {
    setOpenUnits(prev => {
      const n = new Set(prev);
      n.has(kode) ? n.delete(kode) : n.add(kode);
      return n;
    });
  }

  function expandAll() {
    if (result) setOpenUnits(new Set(result.unitKompetensi.map(u => u.kodeUnit)));
  }
  function collapseAll() { setOpenUnits(new Set()); }

  async function analyze() {
    if (!jabatan) return;
    setLoading(true);
    setError("");
    setResult(null);
    setOpenUnits(new Set());
    try {
      const res = await fetch("/api/tools/analisis-skkni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      // Auto-expand first 2 units
      if (data.unitKompetensi?.length) {
        setOpenUnits(new Set(data.unitKompetensi.slice(0, 2).map((u: UnitKompetensi) => u.kodeUnit)));
      }
    } catch (e: any) {
      setError(e.message || "Gagal menganalisis. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const filteredUnits = result?.unitKompetensi.filter(u =>
    filterJenis === "semua" || u.jenis === filterJenis
  ) ?? [];

  const JENIS_CONFIG = {
    Inti: { color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", badge: "bg-sky-500/10 text-sky-400 border-sky-400/30" },
    Pilihan: { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", badge: "bg-violet-500/10 text-violet-400 border-violet-400/30" },
    Umum: { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", badge: "bg-slate-500/10 text-slate-400 border-slate-400/30" },
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-400" /> Analisis Unit SKKNI
            </h1>
            <p className="text-xs text-slate-400">Breakdown unit kompetensi, elemen, KUK, metode asesmen & bukti portofolio</p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mb-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-2">Pilih Jabatan SKK</label>
              <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400/50">
                <option value="">Pilih jabatan SKK yang ingin dianalisis...</option>
                {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={analyze} disabled={!jabatan || loading} className="bg-sky-600 hover:bg-sky-700 shrink-0">
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis...</>
                  : <><Sparkles className="h-4 w-4 mr-2" />Analisis</>
                }
              </Button>
            </div>
          </div>
          {error && <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse">
              <div className="h-3 bg-white/8 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/8 rounded w-1/2" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse">
                <div className="h-3 bg-white/8 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/8 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Summary Card */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 mb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sky-400 text-xs font-semibold mb-1">Skema Sertifikasi</p>
                  <h2 className="text-white text-base font-bold mb-1">{result.jabatan}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs text-sky-400 border-sky-400/40">KKNI {result.kkniLevel}</Badge>
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.totalUnit} Unit Kompetensi</Badge>
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">
                      {result.unitKompetensi.filter(u => u.jenis === "Inti").length} Inti
                    </Badge>
                  </div>
                </div>
                <Link href="/simulator-wawancara">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
                    <ExternalLink className="h-3.5 w-3.5" /> Latih Wawancara
                  </Button>
                </Link>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mt-3">{result.ringkasanSkema}</p>
            </div>

            {/* Strategi Umum */}
            {result.strategiUmum?.length > 0 && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
                <p className="text-violet-400 text-xs font-semibold mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Strategi Persiapan Asesmen
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {result.strategiUmum.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-xs leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter + View Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Filter:</span>
                {(["semua", "Inti", "Pilihan", "Umum"] as const).map(f => (
                  <button key={f} onClick={() => setFilterJenis(f)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${filterJenis === f ? "bg-sky-600 border-sky-500 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}>
                    {f === "semua" ? `Semua (${result.totalUnit})` : f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={expandAll} className="text-[11px] text-slate-500 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-all">Expand All</button>
                <button onClick={collapseAll} className="text-[11px] text-slate-500 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-all">Collapse</button>
              </div>
            </div>

            {/* Unit Cards */}
            <div className="space-y-2">
              {filteredUnits.map((unit, idx) => {
                const isOpen = openUnits.has(unit.kodeUnit);
                const jc = JENIS_CONFIG[unit.jenis] || JENIS_CONFIG.Umum;
                return (
                  <div key={unit.kodeUnit} className={`rounded-xl border transition-all ${isOpen ? jc.bg : "border-white/8 bg-white/2 hover:bg-white/4"}`}>
                    {/* Unit Header */}
                    <button onClick={() => toggleUnit(unit.kodeUnit)} className="w-full text-left p-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 shrink-0 ${isOpen ? "bg-white/10" : "bg-white/5"}`}>
                          <span className={`text-xs font-bold ${jc.color}`}>{String(idx + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`text-[9px] shrink-0 ${jc.badge}`}>{unit.jenis}</Badge>
                            <span className="text-[10px] text-slate-500 font-mono">{unit.kodeUnit}</span>
                          </div>
                          <p className={`text-sm font-semibold ${isOpen ? "text-white" : "text-slate-200"}`}>{unit.namaUnit}</p>
                          {!isOpen && <p className="text-xs text-slate-500 truncate mt-0.5">{unit.deskripsi}</p>}
                          {!isOpen && unit.metodeAsesmen.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {unit.metodeAsesmen.map(m => {
                                const Icon = METODE_ICON[m] || ClipboardList;
                                return (
                                  <span key={m} className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${METODE_COLOR[m] || "text-slate-400 border-slate-600"}`}>
                                    <Icon className="h-2.5 w-2.5" />{m}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-3">
                        <p className="text-slate-300 text-sm leading-relaxed">{unit.deskripsi}</p>

                        {/* Metode Asesmen */}
                        <div>
                          <p className="text-xs text-slate-400 font-semibold mb-2">Metode Asesmen</p>
                          <div className="flex gap-2 flex-wrap">
                            {unit.metodeAsesmen.map(m => {
                              const Icon = METODE_ICON[m] || ClipboardList;
                              return (
                                <span key={m} className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium ${METODE_COLOR[m] || "text-slate-400 border-slate-600"}`}>
                                  <Icon className="h-3.5 w-3.5" />{m}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Elemen Kompetensi */}
                        {unit.elemenKompetensi?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 font-semibold mb-2">Elemen Kompetensi & KUK</p>
                            <div className="space-y-2.5">
                              {unit.elemenKompetensi.map((el, ei) => (
                                <div key={ei} className="rounded-lg border border-white/8 bg-slate-900/50 p-3">
                                  <p className="text-xs font-semibold text-white mb-2 flex items-start gap-1.5">
                                    <Target className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${jc.color}`} />
                                    {el.nama}
                                  </p>
                                  <ul className="space-y-1">
                                    {el.kuk.map((k, ki) => (
                                      <li key={ki} className="flex items-start gap-1.5 text-xs text-slate-400">
                                        <CheckCircle2 className="h-3 w-3 shrink-0 text-slate-600 mt-0.5" />
                                        {k}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contoh Bukti */}
                        {unit.contohBukti?.length > 0 && (
                          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                            <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                              <FileCheck className="h-3.5 w-3.5" /> Contoh Bukti Portofolio
                            </p>
                            <ul className="space-y-1">
                              {unit.contohBukti.map((b, bi) => (
                                <li key={bi} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <ChevronRight className="h-3 w-3 shrink-0 text-amber-400 mt-0.5" />{b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tip Asesmen */}
                        {unit.tipAsesmen && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-white/8">
                            <Lightbulb className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${jc.color}`} />
                            <p className="text-xs text-slate-300 leading-relaxed"><strong className={jc.color}>Tips: </strong>{unit.tipAsesmen}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA Footer */}
            <div className="mt-5 rounded-xl border border-white/8 bg-white/2 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs text-slate-500">Analisis berdasarkan SKKNI yang berlaku. Skema aktual dapat bervariasi per LSP.</p>
              </div>
              <Link href="/simulator-wawancara">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-xs gap-1.5 shrink-0">
                  Latih Wawancara →
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
