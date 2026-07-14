import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Users, ChevronRight,
  CheckCircle2, AlertTriangle, Search, FileCheck,
  Briefcase, Shield, ChevronDown, Info
} from "lucide-react";
import { Link } from "wouter";

const KEBUTUHAN_OPTIONS = [
  "Ahli K3 Konstruksi", "Ahli Manajemen Proyek", "Ahli Manajemen Konstruksi",
  "Ahli Quantity Surveyor", "Ahli Pengawas Konstruksi", "Ahli Manajemen Kontrak",
  "Ahli Teknik Bangunan Gedung", "Ahli Teknik Jalan", "Ahli Teknik Jembatan",
  "Ahli Arsitektur", "Ahli Teknik Mekanikal", "Ahli Teknik Elektrikal",
];

const URGENSI_OPTIONS = ["Sangat Mendesak (< 1 bulan)", "Mendesak (1–3 bulan)", "Normal (3–6 bulan)"];

interface HasilPanduan {
  ringkasan: string;
  tahapanRekrutmen: {
    tahap: string;
    durasi: string;
    aktivitas: string[];
    tools: string[];
  }[];
  kriteriaSeleksi: {
    kategori: string;
    kriteria: string[];
    caraMengukur: string;
  }[];
  pertanyaanWawancara: {
    topik: string;
    pertanyaan: string;
    yangDicarikan: string;
  }[];
  verifikasiSKK: {
    langkah: string;
    caranya: string;
    peringatan: string;
  }[];
  estimasiBiayaRekrutmen: string;
  waktuEfektif: string;
  kesalahanUmum: string[];
  tipsNegosiasi: string[];
}

export default function PanduanRekrutmenSKK() {
  const [form, setForm] = useState({
    jabatanDibutuhkan: "", levelTarget: "Muda", jumlahDibutuhkan: 1,
    urgensi: "Normal (3–6 bulan)", kualifikasiBUJK: "Menengah M1", budgetRange: "",
  });
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTahap, setOpenTahap] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"tahapan" | "seleksi" | "wawancara" | "verifikasi">("tahapan");

  function toggleTahap(i: number) {
    setOpenTahap(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  async function generate() {
    if (!form.jabatanDibutuhkan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-rekrutmen-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate panduan."); }
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
              <Users className="h-5 w-5 text-indigo-400" /> Panduan Rekrutmen Tenaga SKK BUJK
            </h1>
            <p className="text-xs text-slate-400">Panduan lengkap rekrut, seleksi, dan verifikasi SKK kandidat untuk perusahaan konstruksi</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dibutuhkan *</label>
                <select value={form.jabatanDibutuhkan} onChange={e => setForm(f => ({ ...f, jabatanDibutuhkan: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400/50">
                  <option value="">Pilih jabatan...</option>
                  {KEBUTUHAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Level</label>
                  <select value={form.levelTarget} onChange={e => setForm(f => ({ ...f, levelTarget: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                    {["Muda", "Madya", "Utama"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jumlah</label>
                  <input type="number" min={1} max={20} value={form.jumlahDibutuhkan} onChange={e => setForm(f => ({ ...f, jumlahDibutuhkan: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Kualifikasi BUJK</label>
                  <select value={form.kualifikasiBUJK} onChange={e => setForm(f => ({ ...f, kualifikasiBUJK: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                    {["Kecil K1", "Kecil K2", "Menengah M1", "Menengah M2", "Besar B1", "Besar B2"].map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Urgensi Kebutuhan</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {URGENSI_OPTIONS.map(u => (
                    <button key={u} onClick={() => setForm(f => ({ ...f, urgensi: u }))}
                      className={`rounded-lg border py-2 text-xs text-left px-3 transition-all ${form.urgensi === u ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Budget Gaji / Kontrak <span className="text-slate-600">(opsional)</span></label>
                <input value={form.budgetRange} onChange={e => setForm(f => ({ ...f, budgetRange: e.target.value }))}
                  placeholder="cth: Rp 8–12 juta/bulan atau kontrak Rp 5 juta/proyek"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/50" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!form.jabatanDibutuhkan || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan rekrutmen...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Rekrutmen SKK</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className="text-xs text-indigo-400 border-indigo-400/40">{form.jabatanDibutuhkan} — {form.levelTarget}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{form.jumlahDibutuhkan} orang</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{form.urgensi.split(" ")[0]}</Badge>
              </div>
              <p className="text-slate-300 text-sm mb-2">{result.ringkasan}</p>
              <div className="flex items-center gap-4">
                <p className="text-xs text-slate-400 flex items-center gap-1"><Briefcase className="h-3 w-3" /> {result.estimasiBiayaRekrutmen}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {result.waktuEfektif}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["tahapan", "Tahapan"], ["seleksi", "Kriteria"], ["wawancara", "Wawancara"], ["verifikasi", "Verif. SKK"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "tahapan" && (
              <div className="space-y-2">
                {result.tahapanRekrutmen?.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleTahap(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <div className="rounded-full bg-indigo-500/20 w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-400">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{t.tahap}</p>
                        <p className="text-[10px] text-slate-500">{t.durasi}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openTahap.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openTahap.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3">
                        <div className="mb-2">
                          <p className="text-[10px] text-slate-400 font-semibold mb-1">Aktivitas</p>
                          <ul className="space-y-1">{t.aktivitas.map((a, ai) => <li key={ai} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />{a}</li>)}</ul>
                        </div>
                        {t.tools?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold mb-1">Tools / Platform</p>
                            <div className="flex flex-wrap gap-1">{t.tools.map((tool, ti) => <Badge key={ti} variant="outline" className="text-[9px] text-slate-400 border-slate-600">{tool}</Badge>)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "seleksi" && (
              <div className="space-y-3">
                {result.kriteriaSeleksi?.map((k, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-xs text-indigo-400 font-semibold mb-2">{k.kategori}</p>
                    <ul className="space-y-1 mb-2">{k.kriteria.map((c, ci) => <li key={ci} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />{c}</li>)}</ul>
                    <p className="text-xs text-slate-500 italic">{k.caraMengukur}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "wawancara" && (
              <div className="space-y-3">
                {result.pertanyaanWawancara?.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-400/30 mb-2">{p.topik}</Badge>
                    <p className="text-sm text-slate-200 font-medium mb-1">"{p.pertanyaan}"</p>
                    <p className="text-xs text-slate-500">→ Yang dicari: {p.yangDicarikan}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "verifikasi" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">Selalu verifikasi keaslian SKK sebelum menandatangani kontrak kerja.</p>
                </div>
                {result.verifikasiSKK?.map((v, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-400">{i + 1}</div>
                      <p className="text-sm text-white font-medium">{v.langkah}</p>
                    </div>
                    <p className="text-xs text-slate-400 mb-1 ml-7">{v.caranya}</p>
                    {v.peringatan && <p className="text-xs text-amber-400 ml-7 flex items-start gap-1"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{v.peringatan}</p>}
                  </div>
                ))}
              </div>
            )}

            {result.kesalahanUmum?.length > 0 && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-red-400 text-xs font-semibold mb-2">Kesalahan Umum dalam Rekrutmen SKK</p>
                <ul className="space-y-1">{result.kesalahanUmum.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{k}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                <Link href="/biaya-tim-skk">Kalkulator Biaya Tim →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
