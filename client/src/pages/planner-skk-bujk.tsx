import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Building2, Plus, Trash2,
  CheckCircle2, AlertTriangle, XCircle, ChevronRight,
  Users, Target, Calendar, DollarSign, Info, X, TrendingUp
} from "lucide-react";
import { Link } from "wouter";

const SUBKLASIFIKASI_SBU = [
  "BG001 — Bangunan Gedung", "BG002 — Bangunan Komersial", "BG003 — Bangunan Industri",
  "BS001 — Jalan Raya", "BS002 — Jembatan", "BS003 — Terowongan",
  "BS004 — Bangunan Pengairan", "BS005 — Bangunan Pantai",
  "EL001 — Instalasi Listrik", "EL002 — Jaringan Listrik",
  "MK001 — Instalasi Mekanikal", "MK002 — Instalasi HVAC",
  "KS001 — Pondasi & Geoteknik", "KS002 — Struktur Baja",
  "KS003 — Struktur Beton", "KS004 — Pemeliharaan Bangunan",
  "KK001 — Konsultan Arsitektur", "KK002 — Konsultan Sipil", "KK003 — Konsultan Mekanikal",
  "KK004 — Konsultan Pengawas", "KK005 — Konsultan Manajemen Proyek",
];

const KUALIFIKASI_OPTIONS = ["Kecil K1", "Kecil K2", "Menengah M1", "Menengah M2", "Besar B1", "Besar B2"];

interface SKKDimiliki {
  id: string; jabatan: string; level: string; jumlah: number;
}

interface HasilPlanner {
  ringkasan: string;
  statusKepatuhan: "Lengkap" | "Hampir Lengkap" | "Perlu Perhatian" | "Tidak Memenuhi";
  skkWajib: { jabatan: string; level: string; jumlahMinimum: number; regulasi: string; status: "Ada" | "Kurang" | "Tidak Ada"; kekurangan: number }[];
  gapAnalisis: string[];
  rencanaRekrutmen: { prioritas: string; jabatan: string; level: string; jumlah: number; estimasiBiaya: string; waktuTarget: string }[];
  estimasiBiayaTotal: string;
  timelinePersiapan: string;
  risikoJikaTidakDilengkapi: string[];
  rekomendasiSegera: string[];
}

const STATUS_CONFIG = {
  "Lengkap": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  "Hampir Lengkap": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: CheckCircle2 },
  "Perlu Perhatian": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle },
  "Tidak Memenuhi": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle },
};

export default function PlannerSKKBUJK() {
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [subklasifikasi, setSubklasifikasi] = useState<string[]>([]);
  const [kualifikasi, setKualifikasi] = useState("Menengah M1");
  const [skkDimiliki, setSkkDimiliki] = useState<SKKDimiliki[]>([]);
  const [result, setResult] = useState<HasilPlanner | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSKKForm, setShowSKKForm] = useState(false);
  const [skkForm, setSkkForm] = useState({ jabatan: "", level: "Muda", jumlah: 1 });

  function toggleSubklas(s: string) {
    setSubklasifikasi(prev => prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 5 ? [...prev, s] : prev);
  }
  function addSKK() {
    if (!skkForm.jabatan) return;
    setSkkDimiliki(prev => [...prev, { id: Date.now().toString(), ...skkForm }]);
    setSkkForm({ jabatan: "", level: "Muda", jumlah: 1 });
    setShowSKKForm(false);
  }

  const isValid = subklasifikasi.length > 0;

  async function analyze() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/planner-skk-bujk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaPerusahaan, subklasifikasi, kualifikasi, skkDimiliki }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal menganalisis. Coba lagi."); }
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
              <Building2 className="h-5 w-5 text-indigo-400" /> Planner SKK BUJK
            </h1>
            <p className="text-xs text-slate-400">Analisis kebutuhan SKK perusahaan berdasarkan subklasifikasi & kualifikasi SBU</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Profil BUJK</p>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Perusahaan <span className="text-slate-600">(opsional)</span></label>
                <input value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)}
                  placeholder="cth: PT. Karya Konstruksi Nusantara"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kualifikasi SBU</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {KUALIFIKASI_OPTIONS.map(k => (
                    <button key={k} onClick={() => setKualifikasi(k)}
                      className={`rounded-lg border py-2 text-xs transition-all ${kualifikasi === k ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Subklasifikasi SBU <span className="text-slate-500">(pilih maks 5)</span> *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {subklasifikasi.map(s => (
                    <Badge key={s} variant="outline" className="text-xs text-indigo-400 border-indigo-400/40 bg-indigo-500/10 flex items-center gap-1 cursor-pointer" onClick={() => toggleSubklas(s)}>
                      {s.split(" — ")[0]} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <select onChange={e => { if (e.target.value) { toggleSubklas(e.target.value); e.target.value = ""; } }}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  <option value="">+ Tambah subklasifikasi...</option>
                  {SUBKLASIFIKASI_SBU.filter(s => !subklasifikasi.includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* SKK yang sudah dimiliki */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold">SKK yang Sudah Dimiliki <span className="text-slate-600">(opsional)</span></p>
                <button onClick={() => setShowSKKForm(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Tambah</button>
              </div>
              {skkDimiliki.length === 0 && !showSKKForm && (
                <p className="text-xs text-slate-600 text-center py-2">Kosong — AI akan analisis kebutuhan dari nol</p>
              )}
              {skkDimiliki.map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg bg-slate-900/40 px-3 py-2 mb-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="text-xs text-slate-300 flex-1">{s.jabatan} — {s.level}</span>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">{s.jumlah} orang</Badge>
                  <button onClick={() => setSkkDimiliki(prev => prev.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              {showSKKForm && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2 mt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input value={skkForm.jabatan} onChange={e => setSkkForm(f => ({ ...f, jabatan: e.target.value }))}
                        placeholder="Jabatan SKK (cth: Ahli K3 Konstruksi)"
                        className="w-full rounded-lg border border-white/8 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                    </div>
                    <select value={skkForm.level} onChange={e => setSkkForm(f => ({ ...f, level: e.target.value }))}
                      className="rounded-lg border border-white/8 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none">
                      {["Muda", "Madya", "Utama"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={20} value={skkForm.jumlah} onChange={e => setSkkForm(f => ({ ...f, jumlah: parseInt(e.target.value) || 1 }))}
                      className="w-20 rounded-lg border border-white/8 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none" />
                    <span className="text-xs text-slate-400">orang</span>
                    <Button onClick={addSKK} disabled={!skkForm.jabatan} className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-xs h-7 px-3">Tambah</Button>
                    <button onClick={() => setShowSKKForm(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={analyze} disabled={!isValid || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis kebutuhan SKK...</> : <><Sparkles className="h-4 w-4 mr-2" />Analisis Kebutuhan SKK BUJK</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (() => {
          const sc = STATUS_CONFIG[result.statusKepatuhan];
          const Icon = sc.icon;
          return (
            <>
              <div className={`rounded-2xl border p-5 mb-4 ${sc.bg}`}>
                <div className="flex items-start gap-3 mb-2">
                  <Icon className={`h-6 w-6 ${sc.color} shrink-0`} />
                  <div>
                    <p className="text-slate-400 text-xs">{namaPerusahaan || "BUJK"} · {kualifikasi}</p>
                    <p className={`text-lg font-bold ${sc.color}`}>{result.statusKepatuhan}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-slate-400 text-xs">Estimasi kebutuhan</p>
                    <p className={`text-sm font-bold ${sc.color}`}>{result.estimasiBiayaTotal}</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm">{result.ringkasan}</p>
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {result.timelinePersiapan}</p>
              </div>

              {/* SKK Wajib */}
              <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
                <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Kebutuhan SKK per Jabatan</p>
                <div className="space-y-2">
                  {result.skkWajib?.map((s, i) => {
                    const st = s.status === "Ada" ? "text-emerald-400" : s.status === "Kurang" ? "text-amber-400" : "text-red-400";
                    const stIcon = s.status === "Ada" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : s.status === "Kurang" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-900/40 px-3 py-2.5">
                        {stIcon}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 font-medium truncate">{s.jabatan} — {s.level}</p>
                          <p className="text-[10px] text-slate-500">{s.regulasi}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">Min. {s.jumlahMinimum} orang</p>
                          {s.kekurangan > 0 && <p className={`text-[10px] font-semibold ${st}`}>Kurang {s.kekurangan}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rencana Rekrutmen */}
              {result.rencanaRekrutmen?.some(r => r.jumlah > 0) && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-3">
                  <p className="text-indigo-400 text-xs font-semibold mb-3 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Rencana Rekrutmen/Sertifikasi</p>
                  <div className="space-y-2">
                    {result.rencanaRekrutmen.filter(r => r.jumlah > 0).map((r, i) => (
                      <div key={i} className="rounded-lg bg-slate-900/50 px-3 py-2.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[9px] ${r.prioritas === "Tinggi" ? "text-red-400 border-red-400/30" : r.prioritas === "Sedang" ? "text-amber-400 border-amber-400/30" : "text-slate-400 border-slate-600"}`}>{r.prioritas}</Badge>
                            <span className="text-xs text-slate-300 font-medium">{r.jabatan} — {r.level}</span>
                          </div>
                          <span className="text-xs text-indigo-400">{r.jumlah} orang</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1"><DollarSign className="h-3 w-3" />{r.estimasiBiaya}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{r.waktuTarget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {result.rekomendasiSegera?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Lakukan Segera</p>
                    <ul className="space-y-1">{result.rekomendasiSegera.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{r}</li>)}</ul>
                  </div>
                )}
                {result.risikoJikaTidakDilengkapi?.length > 0 && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-red-400 text-xs font-semibold mb-2">Risiko Jika Tidak Dilengkapi</p>
                    <ul className="space-y-1">{result.risikoJikaTidakDilengkapi.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{r}</li>)}</ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Analisis Ulang</Button>
                <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                  <Link href="/checker-skk-proyek">Checker SKK Proyek →</Link>
                </Button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
