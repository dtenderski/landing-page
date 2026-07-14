import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  XCircle, ChevronRight, Info, Users, DollarSign, MapPin,
  Building2, Shield, ClipboardCheck, Plus, X, Trash2
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK_OPTIONS = [
  "Konstruksi Bangunan Gedung", "Konstruksi Bangunan Komersial/Mall",
  "Jalan Raya / Jalan Tol", "Jembatan", "Drainase & Irigasi",
  "Instalasi Listrik & Panel", "Instalasi Mekanikal (HVAC/Plumbing)",
  "Pondasi & Geoteknik", "Struktur Baja", "Renovasi Bangunan",
  "Konstruksi Fasilitas Industri", "Pengembangan Kawasan Perumahan",
];

const NILAI_PROYEK_OPTIONS = [
  "< Rp 500 juta", "Rp 500 juta – 1 M", "Rp 1 M – 5 M",
  "Rp 5 M – 15 M", "Rp 15 M – 50 M", "Rp 50 M – 100 M",
  "Rp 100 M – 500 M", "> Rp 500 M",
];

const SUMBER_DANA_OPTIONS = ["APBN", "APBD Provinsi", "APBD Kota/Kabupaten", "Swasta / Non-APBN"];

interface SKKBUJKItem { id: string; jabatan: string; level: string; jumlah: number; }

interface HasilChecker {
  statusKepatuhan: "Memenuhi Syarat" | "Hampir Memenuhi" | "Tidak Memenuhi" | "Perlu Verifikasi";
  skorKepatuhan: number;
  ringkasan: string;
  syaratSKKProyek: {
    jabatan: string; level: string; jumlahDibutuhkan: number;
    dasar: string; status: "Terpenuhi" | "Kurang" | "Tidak Ada"; kekurangan: number;
  }[];
  kewajiban: { kewajiban: string; status: "OK" | "Perlu Cek" | "Tidak Terpenuhi"; catatan: string; }[];
  tindakanDiperlukan: string[];
  peringatanRegulasi: string[];
  rekomendasiFinal: string;
}

const STATUS_CONFIG = {
  "Memenuhi Syarat": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2, bar: "bg-emerald-500" },
  "Hampir Memenuhi": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: CheckCircle2, bar: "bg-blue-500" },
  "Tidak Memenuhi": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle, bar: "bg-red-500" },
  "Perlu Verifikasi": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle, bar: "bg-amber-500" },
};

export default function CheckerSKKProyek() {
  const [form, setForm] = useState({ jenisProyek: "", nilaiProyek: "", sumberDana: "", lokasi: "", kualifikasiBUJK: "Menengah M1" });
  const [skkBUJK, setSkkBUJK] = useState<SKKBUJKItem[]>([]);
  const [showSkkForm, setShowSkkForm] = useState(false);
  const [skkForm, setSkkForm] = useState({ jabatan: "", level: "Muda", jumlah: 1 });
  const [result, setResult] = useState<HasilChecker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addSKK() {
    if (!skkForm.jabatan) return;
    setSkkBUJK(prev => [...prev, { id: Date.now().toString(), ...skkForm }]);
    setSkkForm({ jabatan: "", level: "Muda", jumlah: 1 });
    setShowSkkForm(false);
  }

  const isValid = form.jenisProyek && form.nilaiProyek;

  async function check() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/checker-skk-proyek", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skkBUJK }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal mengecek. Coba lagi."); }
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
              <ClipboardCheck className="h-5 w-5 text-orange-400" /> Checker Kepatuhan SKK Proyek
            </h1>
            <p className="text-xs text-slate-400">Cek apakah SKK yang dimiliki BUJK memenuhi syarat untuk proyek spesifik</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Data Proyek</p>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan Konstruksi *</label>
                <select value={form.jenisProyek} onChange={e => setForm(f => ({ ...f, jenisProyek: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                  <option value="">Pilih jenis proyek...</option>
                  {JENIS_PROYEK_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak *</label>
                  <select value={form.nilaiProyek} onChange={e => setForm(f => ({ ...f, nilaiProyek: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                    <option value="">Pilih nilai...</option>
                    {NILAI_PROYEK_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Sumber Dana</label>
                  <select value={form.sumberDana} onChange={e => setForm(f => ({ ...f, sumberDana: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                    <option value="">Pilih...</option>
                    {SUMBER_DANA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Kualifikasi BUJK</label>
                  <select value={form.kualifikasiBUJK} onChange={e => setForm(f => ({ ...f, kualifikasiBUJK: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                    {["Kecil K1", "Kecil K2", "Menengah M1", "Menengah M2", "Besar B1", "Besar B2"].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Lokasi Proyek <span className="text-slate-600">(opsional)</span></label>
                  <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                    placeholder="cth: Jakarta Pusat, DKI Jakarta"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-400/50" />
                </div>
              </div>
            </div>

            {/* SKK yang dimiliki BUJK */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold">SKK yang Dimiliki BUJK <span className="text-slate-600">(opsional tapi lebih akurat)</span></p>
                <button onClick={() => setShowSkkForm(true)} className="text-xs text-orange-400 flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Tambah</button>
              </div>
              {skkBUJK.length === 0 && !showSkkForm && <p className="text-xs text-slate-600 text-center py-2">Kosong — AI hanya analisis syarat tanpa cek status</p>}
              {skkBUJK.map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg bg-slate-900/40 px-3 py-2 mb-1.5">
                  <Users className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  <span className="text-xs text-slate-300 flex-1">{s.jabatan} — {s.level}</span>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">{s.jumlah} orang</Badge>
                  <button onClick={() => setSkkBUJK(prev => prev.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              {showSkkForm && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 space-y-2 mt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input value={skkForm.jabatan} onChange={e => setSkkForm(f => ({ ...f, jabatan: e.target.value }))}
                        placeholder="Jabatan SKK"
                        className="w-full rounded-lg border border-white/8 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                    </div>
                    <select value={skkForm.level} onChange={e => setSkkForm(f => ({ ...f, level: e.target.value }))}
                      className="rounded-lg border border-white/8 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none">
                      {["Muda", "Madya", "Utama"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" min={1} value={skkForm.jumlah} onChange={e => setSkkForm(f => ({ ...f, jumlah: parseInt(e.target.value) || 1 }))}
                      className="w-16 rounded-lg border border-white/8 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none" />
                    <span className="text-xs text-slate-400 self-center">orang</span>
                    <Button onClick={addSKK} disabled={!skkForm.jabatan} className="ml-auto bg-orange-600 hover:bg-orange-700 text-xs h-7 px-3">Tambah</Button>
                    <button onClick={() => setShowSkkForm(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={check} disabled={!isValid || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memeriksa kepatuhan SKK...</> : <><Shield className="h-4 w-4 mr-2" />Cek Kepatuhan SKK Proyek</>}
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
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-7 w-7 ${sc.color} shrink-0`} />
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${sc.color}`}>{result.statusKepatuhan}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${result.skorKepatuhan}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${sc.color}`}>{result.skorKepatuhan}/100</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm">{result.ringkasan}</p>
              </div>

              {/* Syarat SKK */}
              <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
                <p className="text-xs text-slate-400 font-semibold mb-3">Syarat SKK untuk Proyek Ini</p>
                <div className="space-y-2">
                  {result.syaratSKKProyek?.map((s, i) => {
                    const stColors = { "Terpenuhi": "text-emerald-400", "Kurang": "text-amber-400", "Tidak Ada": "text-red-400" };
                    const stIcons = { "Terpenuhi": <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, "Kurang": <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, "Tidak Ada": <XCircle className="h-3.5 w-3.5 text-red-400" /> };
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-900/40 px-3 py-2.5">
                        {stIcons[s.status]}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 font-medium">{s.jabatan} — {s.level}</p>
                          <p className="text-[10px] text-slate-500">{s.dasar}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">{s.jumlahDibutuhkan} orang</p>
                          {s.kekurangan > 0 && <p className={`text-[10px] font-semibold ${stColors[s.status]}`}>-{s.kekurangan}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kewajiban Lain */}
              {result.kewajiban?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
                  <p className="text-xs text-slate-400 font-semibold mb-3">Kewajiban Administrasi & Regulasi</p>
                  <div className="space-y-2">
                    {result.kewajiban.map((k, i) => {
                      const icons = { "OK": <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, "Perlu Cek": <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, "Tidak Terpenuhi": <XCircle className="h-3.5 w-3.5 text-red-400" /> };
                      return (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-900/30 px-3 py-2">
                          <div className="shrink-0 mt-0.5">{icons[k.status]}</div>
                          <div>
                            <p className="text-xs text-slate-300 font-medium">{k.kewajiban}</p>
                            {k.catatan && <p className="text-[10px] text-slate-500">{k.catatan}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.tindakanDiperlukan?.length > 0 && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 mb-3">
                  <p className="text-orange-400 text-xs font-semibold mb-2">Tindakan yang Diperlukan</p>
                  <ul className="space-y-1">{result.tindakanDiperlukan.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-orange-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
                </div>
              )}

              {result.peringatanRegulasi?.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mb-4 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-xs font-semibold mb-1">Peringatan Regulasi</p>
                    <ul className="space-y-1">{result.peringatanRegulasi.map((p, i) => <li key={i} className="text-xs text-slate-300">{p}</li>)}</ul>
                  </div>
                </div>
              )}

              {result.rekomendasiFinal && <p className="text-slate-400 text-xs text-center mb-4 italic">{result.rekomendasiFinal}</p>}

              <div className="flex gap-3">
                <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Cek Proyek Lain</Button>
                <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                  <Link href="/planner-skk-bujk">Planner SKK BUJK →</Link>
                </Button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
