import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, TrendingUp, ChevronRight,
  CheckCircle2, Target, Calendar, Award, Milestone,
  Clock, Zap, BookOpen, Star
} from "lucide-react";
import { Link } from "wouter";

const JABATAN_SEKARANG = [
  "Belum memiliki SKK", "Teknisi / Pelaksana (non-SKK Ahli)",
  "Ahli Muda — K3 Konstruksi", "Ahli Muda — Manajemen Proyek",
  "Ahli Muda — Manajemen Konstruksi", "Ahli Muda — Quantity Surveyor",
  "Ahli Muda — Pengawas Konstruksi", "Ahli Muda — Manajemen Kontrak",
  "Ahli Muda — Teknik Bangunan Gedung", "Ahli Muda — Teknik Jalan",
  "Ahli Muda — Teknik Jembatan", "Ahli Muda — Arsitektur",
  "Ahli Madya — K3 Konstruksi", "Ahli Madya — Manajemen Proyek",
  "Ahli Madya — Manajemen Konstruksi",
];

const JABATAN_TARGET = [
  "Ahli Muda — K3 Konstruksi", "Ahli Muda — Manajemen Proyek",
  "Ahli Muda — Manajemen Konstruksi", "Ahli Muda — Quantity Surveyor",
  "Ahli Muda — Pengawas Konstruksi", "Ahli Muda — Manajemen Kontrak",
  "Ahli Madya — K3 Konstruksi", "Ahli Madya — Manajemen Proyek",
  "Ahli Madya — Manajemen Konstruksi", "Ahli Madya — Quantity Surveyor",
  "Ahli Utama — K3 Konstruksi", "Ahli Utama — Manajemen Proyek",
  "Direktur Teknik / Principal Engineer",
];

const TIMELINE_OPTIONS = ["6 bulan", "1 tahun", "2 tahun", "3 tahun", "5 tahun"];

interface Milestone {
  waktu: string; judul: string; deskripsi: string;
  aksi: string[]; hasil: string;
}

interface HasilRencana {
  jabatanSekarang: string; jabatanTarget: string; timeline: string;
  skoreKesiapan: number; tingkatKesiapan: string;
  ringkasanRencana: string;
  milestones: Milestone[];
  kebutuhanCPD: { kategori: string; jam: number; contohKegiatan: string[] }[];
  kebutuhanPelatihan: { pelatihan: string; tujuan: string; estimasiBiaya: string; prioritas: "Wajib" | "Disarankan" }[];
  hambatanPotensial: { hambatan: string; solusi: string }[];
  indikatorSukses: string[];
  pesanMotivasi: string;
}

const KESIAPAN_CONFIG = {
  "Siap": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  "Hampir Siap": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  "Perlu Persiapan": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  "Butuh Waktu": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
};

export default function RencanaKarirSKK() {
  const [form, setForm] = useState({
    jabatanSekarang: "", jabatanTarget: "", timeline: "2 tahun",
    pengalamanTahun: 3, informasiTambahan: "",
  });
  const [result, setResult] = useState<HasilRencana | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"roadmap" | "cpd" | "pelatihan" | "hambatan">("roadmap");

  const isValid = form.jabatanSekarang && form.jabatanTarget;

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/rencana-karir-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate rencana karir."); }
    finally { setLoading(false); }
  }

  const kc = result ? (KESIAPAN_CONFIG[result.tingkatKesiapan as keyof typeof KESIAPAN_CONFIG] ?? KESIAPAN_CONFIG["Perlu Persiapan"]) : null;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" /> Rencana Pengembangan Karir SKK
            </h1>
            <p className="text-xs text-slate-400">Roadmap karir SKK yang realistis: milestone, CPD, pelatihan, dan timeline terstruktur</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Posisi SKK Saat Ini *</label>
                <select value={form.jabatanSekarang} onChange={e => setForm(f => ({ ...f, jabatanSekarang: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                  <option value="">Pilih posisi sekarang...</option>
                  {JABATAN_SEKARANG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK Target *</label>
                <select value={form.jabatanTarget} onChange={e => setForm(f => ({ ...f, jabatanTarget: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                  <option value="">Pilih target jabatan...</option>
                  {JABATAN_TARGET.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Target Timeline</label>
                <div className="grid grid-cols-5 gap-1">
                  {TIMELINE_OPTIONS.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, timeline: t }))}
                      className={`rounded-lg border py-2 text-xs transition-all ${form.timeline === t ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Total Pengalaman Kerja: <span className="text-violet-400 font-semibold">{form.pengalamanTahun} tahun</span></label>
                <input type="range" min={0} max={20} value={form.pengalamanTahun} onChange={e => setForm(f => ({ ...f, pengalamanTahun: parseInt(e.target.value) }))}
                  className="w-full accent-violet-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Info Tambahan <span className="text-slate-600">(opsional)</span></label>
                <textarea value={form.informasiTambahan} onChange={e => setForm(f => ({ ...f, informasiTambahan: e.target.value }))}
                  rows={2} placeholder="cth: Sudah ikut pelatihan K3 BNSP, punya pengalaman proyek gedung tinggi, bekerja di BUJK Menengah"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun rencana karir...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Rencana Pengembangan Karir</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && kc && (
          <>
            <div className={`rounded-2xl border p-5 mb-4 ${kc.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-slate-400 text-xs">{result.jabatanSekarang}</p>
                  <p className="text-white flex items-center gap-2 text-sm font-medium"><ChevronRight className="h-4 w-4" /> {result.jabatanTarget}</p>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600 mt-1">{result.timeline}</Badge>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${kc.color}`}>{result.skoreKesiapan}<span className="text-sm">/100</span></p>
                  <p className={`text-xs font-medium ${kc.color}`}>{result.tingkatKesiapan}</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm">{result.ringkasanRencana}</p>
            </div>

            <p className={`text-sm italic text-center mb-4 ${kc.color}`}>{result.pesanMotivasi}</p>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["roadmap", "Roadmap"], ["cpd", "CPD"], ["pelatihan", "Pelatihan"], ["hambatan", "Hambatan"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "roadmap" && (
              <div className="space-y-3">
                {result.milestones?.map((m, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-full bg-violet-500/20 w-8 h-8 flex items-center justify-center shrink-0">
                        <Star className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{m.judul}</p>
                        <p className="text-[10px] text-violet-400 flex items-center gap-1"><Clock className="h-3 w-3" />{m.waktu}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{m.deskripsi}</p>
                    <ul className="space-y-0.5 mb-2">{m.aksi.map((a, ai) => <li key={ai} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{a}</li>)}</ul>
                    <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 px-3 py-1.5">
                      <p className="text-[10px] text-violet-400 font-semibold">Hasil yang dicapai</p>
                      <p className="text-xs text-slate-300">{m.hasil}</p>
                    </div>
                  </div>
                ))}

                {result.indikatorSukses?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Indikator Sukses</p>
                    <ul className="space-y-1">{result.indikatorSukses.map((ind, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{ind}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "cpd" && (
              <div className="space-y-3">
                {result.kebutuhanCPD?.map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white font-medium">{c.kategori}</p>
                      <Badge variant="outline" className="text-xs text-violet-400 border-violet-400/40">{c.jam} jam</Badge>
                    </div>
                    <ul className="space-y-1">{c.contohKegiatan.map((k, ki) => <li key={ki} className="text-xs text-slate-400 flex items-start gap-2"><BookOpen className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pelatihan" && (
              <div className="space-y-3">
                {result.kebutuhanPelatihan?.map((p, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${p.prioritas === "Wajib" ? "border-violet-500/30 bg-violet-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[9px] ${p.prioritas === "Wajib" ? "text-violet-400 border-violet-400/30" : "text-slate-400 border-slate-600"}`}>{p.prioritas}</Badge>
                      {p.estimasiBiaya && <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{p.estimasiBiaya}</Badge>}
                    </div>
                    <p className="text-sm text-white font-medium mb-1">{p.pelatihan}</p>
                    <p className="text-xs text-slate-400">{p.tujuan}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hambatan" && (
              <div className="space-y-3">
                {result.hambatanPotensial?.map((h, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-sm text-amber-400 font-medium mb-1 flex items-start gap-2">
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>{h.hambatan}
                    </p>
                    <p className="text-xs text-slate-300 ml-7">{h.solusi}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Rencana Baru</Button>
              <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
                <Link href="/kalkulator-cpd">Kalkulator CPD →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
