import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  XCircle, ChevronRight, BarChart3, Target, TrendingUp,
  Info, Lightbulb
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda",
];

interface HasilAnalisis {
  jabatanTarget: string;
  skorKesesuaian: number;
  levelKesesuaian: "Sangat Sesuai" | "Sesuai" | "Cukup Sesuai" | "Kurang Sesuai";
  ringkasan: string;
  unitKompetensiTerpenuhi: { unit: string; buktiDariProyek: string; kekuatan: string }[];
  unitKompetensiKurang: { unit: string; gap: string; saran: string }[];
  kekuatanUtamaProyek: string[];
  kelemahanSebagaiBukti: string[];
  saranPenguatan: string[];
  rekomendasiJalur: string;
  nilaiStrategis: string;
}

const LEVEL_CONFIG = {
  "Sangat Sesuai": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", bar: "bg-emerald-500" },
  "Sesuai": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", bar: "bg-blue-500" },
  "Cukup Sesuai": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", bar: "bg-amber-500" },
  "Kurang Sesuai": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", bar: "bg-red-500" },
};

export default function AnalisisProyekSKK() {
  const [form, setForm] = useState({
    jabatanSKK: "", namaProyek: "", jenisPekerjaan: "", nilaiProyek: "",
    durasi: "", peranAnda: "", deskripsiPekerjaan: "",
  });
  const [result, setResult] = useState<HasilAnalisis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = form.jabatanSKK && form.namaProyek && form.peranAnda && form.deskripsiPekerjaan;

  async function analyze() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/analisis-proyek-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal menganalisis."); }
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
              <BarChart3 className="h-5 w-5 text-teal-400" /> Analisis Proyek vs Kompetensi SKK
            </h1>
            <p className="text-xs text-slate-400">Cek seberapa kuat proyek Anda sebagai bukti portofolio untuk jabatan SKK tertentu</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-300">AI akan menganalisis kesesuaian proyek dengan unit kompetensi jabatan SKK target, menghitung skor kesesuaian, dan memberikan saran penguatan portofolio.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK Target *</label>
                <select value={form.jabatanSKK} onChange={e => setForm(f => ({ ...f, jabatanSKK: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={form.namaProyek} onChange={e => setForm(f => ({ ...f, namaProyek: e.target.value }))}
                  placeholder="cth: Pembangunan Gedung Kantor 10 Lantai"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan</label>
                  <input value={form.jenisPekerjaan} onChange={e => setForm(f => ({ ...f, jenisPekerjaan: e.target.value }))}
                    placeholder="cth: Konstruksi Gedung"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Proyek</label>
                  <input value={form.nilaiProyek} onChange={e => setForm(f => ({ ...f, nilaiProyek: e.target.value }))}
                    placeholder="cth: Rp 8 Miliar"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Durasi Proyek</label>
                  <input value={form.durasi} onChange={e => setForm(f => ({ ...f, durasi: e.target.value }))}
                    placeholder="cth: 18 bulan"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Peran Anda *</label>
                  <input value={form.peranAnda} onChange={e => setForm(f => ({ ...f, peranAnda: e.target.value }))}
                    placeholder="cth: Site Manager"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Deskripsi Pekerjaan & Tanggung Jawab Anda *</label>
                <textarea value={form.deskripsiPekerjaan} onChange={e => setForm(f => ({ ...f, deskripsiPekerjaan: e.target.value }))}
                  rows={4} placeholder="Jelaskan apa yang Anda kerjakan, tanggung jawab utama, keputusan yang Anda buat, dan hasil yang Anda capai di proyek ini..."
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50 resize-none" />
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={analyze} disabled={!isValid || loading} className="w-full bg-teal-600 hover:bg-teal-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis kesesuaian...</> : <><Target className="h-4 w-4 mr-2" />Analisis Kesesuaian Proyek</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-2/3 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-4/5" /></div>)}</div>}

        {result && !loading && (() => {
          const lc = LEVEL_CONFIG[result.levelKesesuaian];
          return (
            <>
              <div className={`rounded-2xl border p-5 mb-4 ${lc.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`text-xl font-bold ${lc.color}`}>{result.levelKesesuaian}</p>
                    <p className="text-slate-400 text-xs">{result.jabatanTarget}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${lc.color}`}>{result.skorKesesuaian}</p>
                    <p className="text-slate-500 text-xs">/100</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${lc.bar}`} style={{ width: `${result.skorKesesuaian}%` }} />
                </div>
                <p className="text-slate-300 text-sm">{result.ringkasan}</p>
              </div>

              {/* Unit Kompetensi Terpenuhi */}
              {result.unitKompetensiTerpenuhi?.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Unit Kompetensi Terpenuhi</p>
                  <div className="space-y-2">
                    {result.unitKompetensiTerpenuhi.map((u, i) => (
                      <div key={i} className="rounded-lg bg-slate-900/40 p-3">
                        <p className="text-xs text-white font-medium mb-0.5">{u.unit}</p>
                        <p className="text-xs text-slate-400">{u.buktiDariProyek}</p>
                        {u.kekuatan && <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1"><TrendingUp className="h-3 w-3" />{u.kekuatan}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unit Kompetensi Kurang */}
              {result.unitKompetensiKurang?.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-3">
                  <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Gap yang Perlu Diisi</p>
                  <div className="space-y-2">
                    {result.unitKompetensiKurang.map((u, i) => (
                      <div key={i} className="rounded-lg bg-slate-900/40 p-3">
                        <p className="text-xs text-white font-medium mb-0.5">{u.unit}</p>
                        <p className="text-xs text-slate-400">{u.gap}</p>
                        <p className="text-xs text-amber-300 mt-0.5">→ {u.saran}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                {result.kekuatanUtamaProyek?.length > 0 && (
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3">
                    <p className="text-teal-400 text-xs font-semibold mb-2">Kekuatan Proyek</p>
                    <ul className="space-y-1">{result.kekuatanUtamaProyek.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
                  </div>
                )}
                {result.kelemahanSebagaiBukti?.length > 0 && (
                  <div className="rounded-xl border border-slate-600/30 bg-slate-800/20 p-3">
                    <p className="text-slate-400 text-xs font-semibold mb-2">Kelemahan Bukti</p>
                    <ul className="space-y-1">{result.kelemahanSebagaiBukti.map((k, i) => <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />{k}</li>)}</ul>
                  </div>
                )}
              </div>

              {result.saranPenguatan?.length > 0 && (
                <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 mb-3">
                  <p className="text-teal-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Saran Penguatan Portofolio</p>
                  <ul className="space-y-1">{result.saranPenguatan.map((s, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />{s}</li>)}</ul>
                </div>
              )}

              {result.rekomendasiJalur && (
                <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 mb-4">
                  <p className="text-xs text-slate-400 mb-0.5">Rekomendasi Jalur Asesmen</p>
                  <p className="text-sm text-teal-300 font-medium">{result.rekomendasiJalur}</p>
                  {result.nilaiStrategis && <p className="text-xs text-slate-500 mt-1">{result.nilaiStrategis}</p>}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Analisis Proyek Lain</Button>
                <Button asChild className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs">
                  <Link href="/evaluasi-portofolio">Evaluasi Portofolio Penuh →</Link>
                </Button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
