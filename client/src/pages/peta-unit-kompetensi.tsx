import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Layers, ChevronRight, ChevronDown,
  CheckCircle2, Info, BookOpen, Target, AlertCircle
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya", "Ahli Manajemen Proyek — Utama",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Pengawas Konstruksi — Madya",
  "Ahli Manajemen Kontrak — Muda", "Ahli Manajemen Kontrak — Madya",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jalan — Madya",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

interface KUK {
  kode: string;
  kriteria: string;
  jenisUji: "Tulis" | "Lisan" | "Observasi" | "Demonstrasi" | "Portofolio";
}

interface Elemen {
  nomor: number;
  namaElemen: string;
  deskripsi: string;
  kuk: KUK[];
}

interface UnitKompetensi {
  kode: string;
  namaUnit: string;
  deskripsiUnit: string;
  kategori: string;
  elemenKompetensi: Elemen[];
  persyaratanBukti: string[];
  bobotDalamAsesmen: "Kritis" | "Penting" | "Pendukung";
}

interface PetaKompetensi {
  jabatan: string;
  totalUnit: number;
  ringkasan: string;
  kategoriBesar: string[];
  unitList: UnitKompetensi[];
  tipsAsesmen: string[];
}

const BOBOT_CONFIG = {
  "Kritis": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  "Penting": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  "Pendukung": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

const UJI_COLORS: Record<string, string> = {
  "Tulis": "text-blue-400 border-blue-400/30",
  "Lisan": "text-violet-400 border-violet-400/30",
  "Observasi": "text-emerald-400 border-emerald-400/30",
  "Demonstrasi": "text-orange-400 border-orange-400/30",
  "Portofolio": "text-teal-400 border-teal-400/30",
};

export default function PetaUnitKompetensi() {
  const [jabatan, setJabatan] = useState("");
  const [result, setResult] = useState<PetaKompetensi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openUnit, setOpenUnit] = useState<Set<string>>(new Set());
  const [openElemen, setOpenElemen] = useState<Set<string>>(new Set());
  const [filterKategori, setFilterKategori] = useState("Semua");

  function toggleUnit(kode: string) {
    setOpenUnit(prev => { const n = new Set(prev); n.has(kode) ? n.delete(kode) : n.add(kode); return n; });
  }
  function toggleElemen(key: string) {
    setOpenElemen(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  async function load() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/peta-unit-kompetensi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setFilterKategori("Semua");
    } catch (e: any) { setError(e.message || "Gagal memuat peta kompetensi."); }
    finally { setLoading(false); }
  }

  const filteredUnits = result?.unitList.filter(
    u => filterKategori === "Semua" || u.kategori === filterKategori
  ) ?? [];

  const kategoriList = result ? ["Semua", ...Array.from(new Set(result.unitList.map(u => u.kategori)))] : [];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" /> Peta Unit Kompetensi SKKNI
            </h1>
            <p className="text-xs text-slate-400">Breakdown unit kompetensi + elemen + KUK lengkap per jabatan SKK</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-300">AI menghasilkan peta kompetensi lengkap: unit kompetensi, elemen, KUK (Kriteria Unjuk Kerja), jenis uji, bobot dalam asesmen, dan tips persiapan. Ideal untuk belajar sebelum asesmen.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK *</label>
              <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                <option value="">Pilih jabatan SKK...</option>
                {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={load} disabled={!jabatan || loading} className="w-full bg-cyan-600 hover:bg-cyan-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memuat peta kompetensi...</> : <><Layers className="h-4 w-4 mr-2" />Tampilkan Peta Kompetensi</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-2/3 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-4/5" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/40">{result.jabatan}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.totalUnit} Unit Kompetensi</Badge>
              </div>
              <p className="text-slate-300 text-sm">{result.ringkasan}</p>
            </div>

            {/* Filter Kategori */}
            {kategoriList.length > 2 && (
              <div className="flex gap-1.5 flex-wrap mb-4">
                {kategoriList.map(k => (
                  <button key={k} onClick={() => setFilterKategori(k)}
                    className={`rounded-full border px-3 py-1 text-xs transition-all ${filterKategori === k ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                    {k}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {filteredUnits.map(unit => {
                const bc = BOBOT_CONFIG[unit.bobotDalamAsesmen];
                const isOpen = openUnit.has(unit.kode);
                return (
                  <div key={unit.kode} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleUnit(unit.kode)} className="w-full text-left p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${bc.bg} ${bc.color}`}>{unit.kode}</span>
                          <Badge variant="outline" className={`text-[9px] ${bc.color} border-current/30`}>{unit.bobotDalamAsesmen}</Badge>
                        </div>
                        <p className="text-sm text-white font-medium leading-tight">{unit.namaUnit}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{unit.kategori} · {unit.elemenKompetensi?.length ?? 0} elemen</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                        <p className="text-xs text-slate-400">{unit.deskripsiUnit}</p>

                        {unit.elemenKompetensi?.map((elemen, ei) => {
                          const eKey = `${unit.kode}-${ei}`;
                          const isElOpen = openElemen.has(eKey);
                          return (
                            <div key={ei} className="rounded-lg border border-white/8 bg-slate-900/40">
                              <button onClick={() => toggleElemen(eKey)} className="w-full text-left px-3 py-2.5 flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">{elemen.nomor}.</span>
                                <p className="text-xs text-slate-200 font-medium flex-1">{elemen.namaElemen}</p>
                                <ChevronDown className={`h-3.5 w-3.5 text-slate-600 shrink-0 transition-transform ${isElOpen ? "rotate-180" : ""}`} />
                              </button>
                              {isElOpen && (
                                <div className="px-3 pb-3 border-t border-white/8 pt-2 space-y-2">
                                  <p className="text-[11px] text-slate-500">{elemen.deskripsi}</p>
                                  <div>
                                    <p className="text-[10px] text-cyan-400 font-semibold mb-1">Kriteria Unjuk Kerja</p>
                                    <div className="space-y-1.5">
                                      {elemen.kuk?.map((k, ki) => (
                                        <div key={ki} className="rounded bg-slate-950/60 px-2.5 py-2 flex items-start gap-2">
                                          <span className="text-[9px] font-mono text-slate-600 shrink-0 mt-0.5">{k.kode}</span>
                                          <p className="text-[11px] text-slate-300 flex-1 leading-relaxed">{k.kriteria}</p>
                                          <Badge variant="outline" className={`text-[8px] shrink-0 ${UJI_COLORS[k.jenisUji] ?? "text-slate-400 border-slate-600"}`}>{k.jenisUji}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {unit.persyaratanBukti?.length > 0 && (
                          <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
                            <p className="text-[10px] text-teal-400 font-semibold mb-1">Bukti yang Dibutuhkan</p>
                            <ul className="space-y-0.5">{unit.persyaratanBukti.map((b, bi) => <li key={bi} className="text-[11px] text-slate-400 flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />{b}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {result.tipsAsesmen?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Tips Persiapan Asesmen</p>
                <ul className="space-y-1">{result.tipsAsesmen.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs">
                <Link href="/simulator-uji-kompetensi">Uji Kompetensi →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
