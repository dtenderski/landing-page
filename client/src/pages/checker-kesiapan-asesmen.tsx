import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, CheckSquare, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Target, FileText, Info
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
];

const DOKUMEN_UMUM = [
  "KTP / Identitas diri (e-KTP)",
  "Ijazah pendidikan terakhir (legalisir)",
  "Foto 3×4 berlatar merah",
  "Curriculum Vitae (CV) terbaru",
  "Surat keterangan bekerja / SK pengangkatan",
  "APL-01 (formulir permohonan asesmen) sudah diisi",
  "APL-02 (asesmen mandiri) sudah diisi lengkap",
  "Sertifikat pelatihan terkait bidang",
  "Surat referensi / rekomendasi atasan",
  "Bukti pengalaman kerja (kontrak, surat tugas, atau sejenisnya)",
  "Foto kegiatan proyek (lapangan, rapat, dll)",
  "Laporan proyek atau dokumen teknis yang pernah dibuat",
  "Sertifikat K3 / pelatihan K3 (jika relevan)",
  "Log book atau catatan harian kerja",
  "Sertifikat kompetensi lain yang dimiliki",
];

interface HasilChecker {
  jabatan: string;
  skorKesiapan: number;
  statusKesiapan: string;
  dokumenLengkap: string[];
  dokumenKurang: { dokumen: string; alasan: string; caraMendapatkan: string }[];
  dokumenOpsional: { dokumen: string; manfaat: string }[];
  rekomendasiPrioritas: string[];
  estimasiWaktuMelengkapi: string;
  tipsFinalisasi: string[];
}

export default function CheckerKesiapanAsesmen() {
  const [jabatan, setJabatan] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<HasilChecker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(d: string) {
    setChecked(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n; });
  }

  const checkedList = Array.from(checked);
  const uncheckedList = DOKUMEN_UMUM.filter(d => !checked.has(d));

  async function analyze() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/checker-kesiapan-asesmen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, dokumenDimiliki: checkedList, dokumenBelumAda: uncheckedList }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal menganalisis kesiapan."); }
    finally { setLoading(false); }
  }

  const pct = DOKUMEN_UMUM.length > 0 ? Math.round((checked.size / DOKUMEN_UMUM.length) * 100) : 0;
  const statusColor = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
  const barColor = pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-400" /> Checker Kesiapan Asesmen SKK
            </h1>
            <p className="text-xs text-slate-400">Centang dokumen yang sudah disiapkan → AI analisis kelengkapan + skor kesiapan + prioritas</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
              <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Akan Diases *</label>
              <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/50">
                <option value="">Pilih jabatan SKK...</option>
                {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold">Dokumen yang Sudah Disiapkan</p>
                <span className={`text-sm font-bold ${statusColor}`}>{pct}% siap</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="space-y-1.5">
                {DOKUMEN_UMUM.map(d => (
                  <button key={d} onClick={() => toggle(d)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-all ${checked.has(d) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "border-white/8 bg-white/2 text-slate-400 hover:text-white"}`}>
                    <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all ${checked.has(d) ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                      {checked.has(d) && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-xs">{d}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="text-xs h-8" onClick={() => setChecked(new Set(DOKUMEN_UMUM))}>Pilih Semua</Button>
                <Button variant="outline" className="text-xs h-8" onClick={() => setChecked(new Set())}>Reset</Button>
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}

            <Button onClick={analyze} disabled={!jabatan || loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis kesiapan...</> : <><Sparkles className="h-4 w-4 mr-2" />Analisis Kesiapan Asesmen</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className={`rounded-2xl border p-5 mb-4 ${result.skorKesiapan >= 80 ? "border-emerald-500/30 bg-emerald-500/5" : result.skorKesiapan >= 50 ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-slate-400 text-xs">{result.jabatan}</p>
                  <p className={`text-xl font-bold ${result.skorKesiapan >= 80 ? "text-emerald-400" : result.skorKesiapan >= 50 ? "text-amber-400" : "text-red-400"}`}>{result.statusKesiapan}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${result.skorKesiapan >= 80 ? "text-emerald-400" : result.skorKesiapan >= 50 ? "text-amber-400" : "text-red-400"}`}>{result.skorKesiapan}<span className="text-sm text-slate-500">/100</span></p>
                  <p className="text-xs text-slate-500">Skor Kesiapan</p>
                </div>
              </div>
              <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${result.skorKesiapan >= 80 ? "bg-emerald-400" : result.skorKesiapan >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${result.skorKesiapan}%` }} />
              </div>
            </div>

            {result.rekomendasiPrioritas?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Prioritas Sebelum Asesmen</p>
                <ul className="space-y-1">{result.rekomendasiPrioritas.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>{r}</li>)}</ul>
                {result.estimasiWaktuMelengkapi && <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-400" />Estimasi waktu melengkapi: <span className="text-amber-400 font-medium">{result.estimasiWaktuMelengkapi}</span></p>}
              </div>
            )}

            {result.dokumenKurang?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
                <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Dokumen yang Masih Kurang ({result.dokumenKurang.length})</p>
                <div className="space-y-2">
                  {result.dokumenKurang.map((d, i) => (
                    <div key={i} className="rounded-lg border border-red-500/15 bg-red-500/5 p-3">
                      <p className="text-xs text-red-300 font-medium mb-1">{d.dokumen}</p>
                      <p className="text-[11px] text-slate-400 mb-1">{d.alasan}</p>
                      <p className="text-[11px] text-slate-500 flex items-start gap-1"><ChevronRight className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{d.caraMendapatkan}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.dokumenLengkap?.length > 0 && (
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 mb-4">
                <p className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Dokumen Sudah Lengkap ({result.dokumenLengkap.length})</p>
                <div className="grid grid-cols-1 gap-1">{result.dokumenLengkap.map((d, i) => <p key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />{d}</p>)}</div>
              </div>
            )}

            {result.tipsFinalisasi?.length > 0 && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
                <p className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Tips Finalisasi Persiapan</p>
                <ul className="space-y-1">{result.tipsFinalisasi.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Cek Ulang</Button>
              <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Link href="/simulator-uji-kompetensi">Uji Kompetensi →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
