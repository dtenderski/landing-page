import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, BookOpen, ChevronDown, ChevronRight,
  FileText, Globe, BookMarked, Target, Lightbulb, Clock,
  CheckCircle2, ExternalLink, Info, GraduationCap, List
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Teknik Geoteknik — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

const WAKTU_OPTIONS = ["1 minggu (intensif)", "2–4 minggu", "1–2 bulan", "3 bulan+"];

interface TopikBelajar {
  topik: string;
  prioritas: "Wajib" | "Penting" | "Tambahan";
  estimasiJam: string;
  poinKunci: string[];
  regulasiTerkait: string[];
}

interface Referensi {
  jenis: "SNI" | "Peraturan" | "Buku" | "Online" | "Modul";
  judul: string;
  keterangan: string;
  aksesibilitas: "Gratis" | "Berbayar" | "Perpustakaan";
}

interface HasilMateri {
  jabatan: string;
  ringkasanPersiapan: string;
  totalEstimasiJam: string;
  rencanaBelajar: {
    minggu: string;
    fokus: string;
    aktivitas: string[];
  }[];
  topikBelajar: TopikBelajar[];
  referensiUtama: Referensi[];
  tipsAsesmen: string[];
  kesalahanUmum: string[];
}

const PRIORITAS_CONFIG = {
  "Wajib": { color: "text-red-400", badge: "text-red-400 border-red-400/30 bg-red-500/5" },
  "Penting": { color: "text-amber-400", badge: "text-amber-400 border-amber-400/30 bg-amber-500/5" },
  "Tambahan": { color: "text-slate-400", badge: "text-slate-400 border-slate-600 bg-slate-800/50" },
};
const JENIS_CONFIG: Record<string, { color: string; icon: any }> = {
  "SNI": { color: "text-blue-400", icon: FileText },
  "Peraturan": { color: "text-red-400", icon: BookMarked },
  "Buku": { color: "text-emerald-400", icon: BookOpen },
  "Online": { color: "text-violet-400", icon: Globe },
  "Modul": { color: "text-amber-400", icon: GraduationCap },
};
const AKSES_CONFIG = {
  "Gratis": "text-emerald-400 border-emerald-400/30 bg-emerald-500/5",
  "Berbayar": "text-amber-400 border-amber-400/30 bg-amber-500/5",
  "Perpustakaan": "text-blue-400 border-blue-400/30 bg-blue-500/5",
};

export default function MateriBelajarSKK() {
  const [jabatan, setJabatan] = useState("");
  const [waktu, setWaktu] = useState("2–4 minggu");
  const [fokusKhusus, setFokusKhusus] = useState("");
  const [result, setResult] = useState<HasilMateri | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTopics, setOpenTopics] = useState<Set<number>>(new Set([0, 1]));
  const [activeTab, setActiveTab] = useState<"rencana" | "topik" | "referensi">("rencana");

  function toggleTopic(i: number) {
    setOpenTopics(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  async function generate() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null);
    setOpenTopics(new Set([0, 1]));
    try {
      const res = await fetch("/api/tools/materi-belajar-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, waktu, fokusKhusus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate. Coba lagi."); }
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
              <BookOpen className="h-5 w-5 text-emerald-400" /> Materi Belajar & Referensi SKK
            </h1>
            <p className="text-xs text-slate-400">Panduan studi terstruktur + regulasi + sumber belajar per jabatan SKK</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mb-5 space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Akan Diasesmen *</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/50">
              <option value="">Pilih jabatan SKK...</option>
              {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Waktu Persiapan yang Tersedia</label>
            <div className="grid grid-cols-4 gap-1.5">
              {WAKTU_OPTIONS.map(w => (
                <button key={w} onClick={() => setWaktu(w)}
                  className={`rounded-lg border py-2 text-xs transition-all ${waktu === w ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Fokus Khusus <span className="text-slate-600">(opsional)</span></label>
            <input value={fokusKhusus} onChange={e => setFokusKhusus(e.target.value)}
              placeholder="cth: lemah di aspek regulasi K3, belum pernah baca SNI bangunan gedung"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/50" />
          </div>
          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
          <Button onClick={generate} disabled={!jabatan || loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan belajar...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Belajar</>}
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-2/3 mb-2" /><div className="h-3 bg-white/8 rounded w-full" /></div>)}
          </div>
        )}

        {result && !loading && (
          <>
            {/* Header */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <p className="text-white text-sm font-bold">{result.jabatan}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40 flex items-center gap-1"><Clock className="h-3 w-3" />{result.totalEstimasiJam}</Badge>
                  <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{waktu}</Badge>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.ringkasanPersiapan}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["rencana", "Rencana Belajar"], ["topik", "Topik & Materi"], ["referensi", "Referensi"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === key ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Rencana Belajar */}
            {activeTab === "rencana" && result.rencanaBelajar?.length > 0 && (
              <div className="space-y-3">
                {result.rencanaBelajar.map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="rounded-full bg-emerald-500/20 px-2.5 py-0.5">
                        <span className="text-emerald-400 text-xs font-bold">{r.minggu}</span>
                      </div>
                      <p className="text-white text-sm font-semibold">{r.fokus}</p>
                    </div>
                    <ul className="space-y-1">
                      {r.aktivitas.map((a, ai) => (
                        <li key={ai} className="text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Topik */}
            {activeTab === "topik" && (
              <div className="space-y-2">
                {result.topikBelajar?.map((t, i) => {
                  const pc = PRIORITAS_CONFIG[t.prioritas] || PRIORITAS_CONFIG["Tambahan"];
                  const isOpen = openTopics.has(i);
                  return (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                      <button onClick={() => toggleTopic(i)} className="w-full text-left p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`text-[9px] ${pc.badge}`}>{t.prioritas}</Badge>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{t.estimasiJam}</span>
                          </div>
                          <p className="text-sm text-white font-medium">{t.topik}</p>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                          {t.poinKunci.length > 0 && (
                            <div>
                              <p className="text-[10px] text-slate-400 font-semibold mb-1.5">Poin Kunci yang Harus Dikuasai</p>
                              <ul className="space-y-1">
                                {t.poinKunci.map((p, pi) => <li key={pi} className="text-xs text-slate-300 flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{p}</li>)}
                              </ul>
                            </div>
                          )}
                          {t.regulasiTerkait.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {t.regulasiTerkait.map((r, ri) => <Badge key={ri} variant="outline" className="text-[9px] text-blue-400 border-blue-400/30 bg-blue-500/5">{r}</Badge>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Referensi */}
            {activeTab === "referensi" && (
              <div className="space-y-2">
                {result.referensiUtama?.map((ref, i) => {
                  const jc = JENIS_CONFIG[ref.jenis] || JENIS_CONFIG["Buku"];
                  const Icon = jc.icon;
                  return (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4 flex items-start gap-3">
                      <div className="rounded-lg bg-white/5 p-2 shrink-0">
                        <Icon className={`h-4 w-4 ${jc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className={`text-[9px] ${jc.color} border-current/30`}>{ref.jenis}</Badge>
                          <Badge variant="outline" className={`text-[9px] ${AKSES_CONFIG[ref.aksesibilitas]}`}>{ref.aksesibilitas}</Badge>
                        </div>
                        <p className="text-white text-sm font-medium">{ref.judul}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{ref.keterangan}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tips & Kesalahan Umum */}
            {result.tipsAsesmen?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5" /> Tips Asesmen</p>
                  <ul className="space-y-1">{result.tipsAsesmen.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-emerald-400">•</span>{t}</li>)}</ul>
                </div>
                {result.kesalahanUmum?.length > 0 && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Kesalahan Umum</p>
                    <ul className="space-y-1">{result.kesalahanUmum.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-red-400">•</span>{k}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Ganti Jabatan</Button>
              <Button asChild className="flex-1 bg-rose-600 hover:bg-rose-700 text-xs">
                <Link href="/simulator-wawancara">Latih Wawancara →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
