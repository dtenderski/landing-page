import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Plus, Trash2, CheckCircle2,
  AlertTriangle, XCircle, ChevronRight, Info, FileCheck,
  Lightbulb, BarChart2, Star, Target, Award, X
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
  "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda",
  "Ahli Teknik Elektrikal — Muda",
];

const JALUR_OPTIONS = ["Portofolio / RPL", "Asesmen Langsung (non-RPL)"];

interface ProyekPengalaman {
  id: string;
  namaProjek: string;
  peran: string;
  nilaiKontrak: string;
  tahun: string;
  durasi: string;
  deskripsiPekerjaan: string;
}

interface KriteriaEvaluasi {
  nama: string;
  skor: number; // 1-5
  label: string;
  komentar: string;
  rekomendasi: string;
}

interface HasilEvaluasi {
  jabatan: string;
  skorKeseluruhan: number; // 1-100
  predikat: "Sangat Siap" | "Siap" | "Perlu Persiapan" | "Belum Siap";
  ringkasan: string;
  kriteria: KriteriaEvaluasi[];
  kekuatanPortofolio: string[];
  kelemahanPortofolio: string[];
  dokumenYangKurang: string[];
  rekomendasiPerbaikan: string[];
  estimasiKesiapan: string;
}

const PREDIKAT_CONFIG = {
  "Sangat Siap": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2, bar: "bg-emerald-500" },
  "Siap": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: CheckCircle2, bar: "bg-blue-500" },
  "Perlu Persiapan": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle, bar: "bg-amber-500" },
  "Belum Siap": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle, bar: "bg-red-500" },
};

function StarRating({ skor, color }: { skor: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= skor ? color : "text-slate-700"}`} fill={i <= skor ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

const EMPTY_PROYEK = (): ProyekPengalaman => ({
  id: Date.now().toString(), namaProjek: "", peran: "", nilaiKontrak: "", tahun: "", durasi: "", deskripsiPekerjaan: "",
});

export default function EvaluasiPortofolio() {
  const [jabatan, setJabatan] = useState("");
  const [jalur, setJalur] = useState("Portofolio / RPL");
  const [tahunPengalaman, setTahunPengalaman] = useState("");
  const [pendidikan, setPendidikan] = useState("");
  const [proyekList, setProyekList] = useState<ProyekPengalaman[]>([EMPTY_PROYEK()]);
  const [dokumenDimiliki, setDokumenDimiliki] = useState("");
  const [result, setResult] = useState<HasilEvaluasi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateProyek(id: string, field: keyof ProyekPengalaman, value: string) {
    setProyekList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }
  function addProyek() { setProyekList(prev => [...prev, EMPTY_PROYEK()]); }
  function removeProyek(id: string) { setProyekList(prev => prev.filter(p => p.id !== id)); }

  const isFormValid = jabatan && tahunPengalaman && proyekList.some(p => p.namaProjek && p.peran);

  async function evaluate() {
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tools/evaluasi-portofolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, jalur, tahunPengalaman, pendidikan, proyekList, dokumenDimiliki }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal mengevaluasi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-violet-400" /> Evaluasi Kesiapan Portofolio SKK
            </h1>
            <p className="text-xs text-slate-400">AI evaluasi kelayakan bukti portofolio untuk asesmen SKK jalur RPL</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Informasi Dasar</p>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dituju *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jalur Asesmen</label>
                  <div className="flex gap-1.5">
                    {JALUR_OPTIONS.map(j => (
                      <button key={j} onClick={() => setJalur(j)}
                        className={`flex-1 rounded-lg border py-2 text-xs transition-all ${jalur === j ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                        {j.split(" /")[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Pengalaman Kerja *</label>
                  <select value={tahunPengalaman} onChange={e => setTahunPengalaman(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                    <option value="">Pilih...</option>
                    {["< 2 tahun", "2–3 tahun", "4–5 tahun", "6–9 tahun", "> 10 tahun"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Pendidikan Terakhir <span className="text-slate-600">(opsional)</span></label>
                <select value={pendidikan} onChange={e => setPendidikan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                  <option value="">Pilih...</option>
                  {["SMA/SMK", "D3", "S1/D4", "S2"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Proyek */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold">Pengalaman Proyek / Pekerjaan *</p>
                <button onClick={addProyek} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Tambah
                </button>
              </div>
              <div className="space-y-4">
                {proyekList.map((p, idx) => (
                  <div key={p.id} className="rounded-xl border border-white/8 bg-slate-900/40 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-violet-400 font-semibold">Proyek {idx + 1}</span>
                      {proyekList.length > 1 && (
                        <button onClick={() => removeProyek(p.id)} className="text-slate-600 hover:text-red-400">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={p.namaProjek} onChange={e => updateProyek(p.id, "namaProjek", e.target.value)}
                        placeholder="Nama proyek / pekerjaan *"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                      <input value={p.peran} onChange={e => updateProyek(p.id, "peran", e.target.value)}
                        placeholder="Peran/jabatan Anda *"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                      <input value={p.nilaiKontrak} onChange={e => updateProyek(p.id, "nilaiKontrak", e.target.value)}
                        placeholder="Nilai kontrak (cth: Rp 25 M)"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                      <input value={p.tahun} onChange={e => updateProyek(p.id, "tahun", e.target.value)}
                        placeholder="Tahun (cth: 2021–2023)"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                    </div>
                    <textarea value={p.deskripsiPekerjaan} onChange={e => updateProyek(p.id, "deskripsiPekerjaan", e.target.value)}
                      rows={2} placeholder="Deskripsi singkat pekerjaan & tanggung jawab Anda di proyek ini"
                      className="w-full rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 resize-none" />
                  </div>
                ))}
              </div>
            </div>

            {/* Dokumen */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <label className="text-xs text-slate-400 block mb-2">Dokumen yang Sudah Dimiliki <span className="text-slate-600">(opsional)</span></label>
              <textarea value={dokumenDimiliki} onChange={e => setDokumenDimiliki(e.target.value)} rows={2}
                placeholder="cth: CV, ijazah, KTP, referensi dari perusahaan, laporan proyek, foto dokumentasi, sertifikat diklat K3"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 resize-none" />
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}

            <Button onClick={evaluate} disabled={!isFormValid || loading} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI mengevaluasi portofolio...</>
                : <><Sparkles className="h-4 w-4 mr-2" />Evaluasi Kesiapan Portofolio</>
              }
            </Button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse">
                <div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <>
            {/* Main Score */}
            {(() => {
              const pc = PREDIKAT_CONFIG[result.predikat];
              const Icon = pc.icon;
              return (
                <div className={`rounded-2xl border p-5 mb-4 ${pc.bg}`}>
                  <div className="flex items-start gap-4 mb-3">
                    <Icon className={`h-8 w-8 ${pc.color} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs mb-0.5">Kesiapan Portofolio SKK — {result.jabatan}</p>
                      <p className={`text-xl font-bold ${pc.color}`}>{result.predikat}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pc.bar}`} style={{ width: `${result.skorKeseluruhan}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${pc.color}`}>{result.skorKeseluruhan}/100</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{result.ringkasan}</p>
                  {result.estimasiKesiapan && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs text-slate-400">{result.estimasiKesiapan}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Kriteria Score */}
            {result.kriteria?.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
                <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> Penilaian per Kriteria
                </p>
                <div className="space-y-3">
                  {result.kriteria.map((k, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-300 font-medium">{k.nama}</p>
                        <div className="flex items-center gap-2">
                          <StarRating skor={k.skor} color={k.skor >= 4 ? "text-emerald-400" : k.skor >= 3 ? "text-blue-400" : k.skor >= 2 ? "text-amber-400" : "text-red-400"} />
                          <span className={`text-xs font-semibold ${k.skor >= 4 ? "text-emerald-400" : k.skor >= 3 ? "text-blue-400" : k.skor >= 2 ? "text-amber-400" : "text-red-400"}`}>{k.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{k.komentar}</p>
                      {k.rekomendasi && (
                        <p className="text-xs text-violet-300 flex items-start gap-1.5">
                          <Lightbulb className="h-3 w-3 shrink-0 mt-0.5" />{k.rekomendasi}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              {result.kekuatanPortofolio?.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Kekuatan</p>
                  <ul className="space-y-1">{result.kekuatanPortofolio.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-emerald-400">•</span>{k}</li>)}</ul>
                </div>
              )}
              {result.kelemahanPortofolio?.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Perlu Diperkuat</p>
                  <ul className="space-y-1">{result.kelemahanPortofolio.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-amber-400">•</span>{k}</li>)}</ul>
                </div>
              )}
            </div>

            {result.dokumenYangKurang?.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-3">
                <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Dokumen yang Masih Kurang</p>
                <ul className="space-y-1">{result.dokumenYangKurang.map((d, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{d}</li>)}</ul>
              </div>
            )}

            {result.rekomendasiPerbaikan?.length > 0 && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
                <p className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Rekomendasi Perbaikan</p>
                <ul className="space-y-1.5">{result.rekomendasiPerbaikan.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{r}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Evaluasi Ulang</Button>
              <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
                <Link href="/generator-dokumen-skk">Generate Surat SKK →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
