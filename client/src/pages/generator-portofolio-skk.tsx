import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ScrollText, ChevronRight,
  Copy, CheckCircle2, Plus, Trash2, FileText, Info, Award
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
];

interface DataProyek {
  namaProyek: string;
  jabatanDiProyek: string;
  nilaiKontrak: string;
  durasi: string;
  pemilikProyek: string;
  deskripsiTugas: string;
}

interface HasilPortofolio {
  jabatan: string; namaLengkap: string;
  ringkasanProfil: string;
  kompetensiUtama: string[];
  proyekDetail: {
    namaProyek: string;
    jabatan: string;
    nilaiKontrak: string;
    durasi: string;
    pemilik: string;
    uraianTugas: string[];
    hasilCapaian: string;
    unitKompetensiYangDibuktikan: string[];
  }[];
  kalimatPenutup: string;
  formatAPL02: string;
  saranPenguatan: string[];
}

export default function GeneratorPortofolioSKK() {
  const [jabatan, setJabatan] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [proyekList, setProyekList] = useState<DataProyek[]>([
    { namaProyek: "", jabatanDiProyek: "", nilaiKontrak: "", durasi: "", pemilikProyek: "", deskripsiTugas: "" },
  ]);
  const [result, setResult] = useState<HasilPortofolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profil" | "proyek" | "apl02">("profil");

  function addProyek() {
    setProyekList(prev => [...prev, { namaProyek: "", jabatanDiProyek: "", nilaiKontrak: "", durasi: "", pemilikProyek: "", deskripsiTugas: "" }]);
  }
  function removeProyek(i: number) {
    setProyekList(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateProyek(i: number, field: keyof DataProyek, val: string) {
    setProyekList(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  const isValid = jabatan && namaLengkap && proyekList.some(p => p.namaProyek && p.jabatanDiProyek);

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-portofolio-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, namaLengkap, proyekList: proyekList.filter(p => p.namaProyek) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate portofolio."); }
    finally { setLoading(false); }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
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
              <ScrollText className="h-5 w-5 text-teal-400" /> Generator Portofolio SKK Digital
            </h1>
            <p className="text-xs text-slate-400">Input pengalaman proyek → AI generate portofolio profesional format BNSP + draft APL-02</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-300">AI akan generate portofolio terstruktur: ringkasan profil, uraian tugas per proyek, capaian terukur, unit kompetensi yang dibuktikan, dan draft APL-02 siap pakai.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK Target *</label>
                  <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400/50">
                    <option value="">Pilih jabatan...</option>
                    {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Lengkap *</label>
                  <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2 font-semibold">Data Proyek ({proyekList.length})</p>
              <div className="space-y-3">
                {proyekList.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-teal-400 font-medium">Proyek #{i+1}</p>
                      {proyekList.length > 1 && (
                        <button onClick={() => removeProyek(i)} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />Hapus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nama Proyek *</label>
                        <input value={p.namaProyek} onChange={e => updateProyek(i, "namaProyek", e.target.value)}
                          placeholder="cth: Pembangunan Gedung X"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Jabatan di Proyek *</label>
                        <input value={p.jabatanDiProyek} onChange={e => updateProyek(i, "jabatanDiProyek", e.target.value)}
                          placeholder="cth: K3 Officer / Site Engineer"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nilai Kontrak</label>
                        <input value={p.nilaiKontrak} onChange={e => updateProyek(i, "nilaiKontrak", e.target.value)}
                          placeholder="cth: Rp 12 miliar"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Durasi</label>
                        <input value={p.durasi} onChange={e => updateProyek(i, "durasi", e.target.value)}
                          placeholder="cth: Jan 2022–Des 2023"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Pemilik Proyek</label>
                      <input value={p.pemilikProyek} onChange={e => updateProyek(i, "pemilikProyek", e.target.value)}
                        placeholder="cth: Kementerian PUPR / Pemkot Surabaya"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Deskripsi Tugas <span className="text-slate-600">(opsional, AI akan generate jika kosong)</span></label>
                      <textarea value={p.deskripsiTugas} onChange={e => updateProyek(i, "deskripsiTugas", e.target.value)}
                        rows={2} placeholder="cth: Bertanggung jawab atas inspeksi K3 harian, safety briefing, investigasi insiden"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addProyek} className="mt-2 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors">
                <Plus className="h-3.5 w-3.5" />Tambah proyek
              </button>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-teal-600 hover:bg-teal-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating portofolio...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Portofolio SKK</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-teal-400" />
                <p className="text-sm text-white font-semibold">{result.namaLengkap}</p>
                <Badge variant="outline" className="text-xs text-teal-400 border-teal-400/40">{result.jabatan}</Badge>
              </div>
              <p className="text-xs text-slate-400">{result.ringkasanProfil}</p>
            </div>

            {result.kompetensiUtama?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {result.kompetensiUtama.map((k, i) => <Badge key={i} variant="outline" className="text-[10px] text-teal-400 border-teal-400/30">{k}</Badge>)}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["profil", "Profil"], ["proyek", "Proyek"], ["apl02", "APL-02"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "profil" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-teal-400 font-semibold">Ringkasan Profil Profesional</p>
                    <Button onClick={() => copyText(result.ringkasanProfil, "profil")} variant="outline" className="h-6 text-[10px] gap-1">
                      {copied === "profil" ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.ringkasanProfil}</p>
                </div>
                {result.saranPenguatan?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Saran Penguatan Portofolio</p>
                    <ul className="space-y-1">{result.saranPenguatan.map((s, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{s}</li>)}</ul>
                  </div>
                )}
                <p className="text-xs text-slate-500 italic px-1">{result.kalimatPenutup}</p>
              </div>
            )}

            {activeTab === "proyek" && (
              <div className="space-y-3">
                {result.proyekDetail?.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-white font-semibold">{p.namaProyek}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="outline" className="text-[9px] text-teal-400 border-teal-400/30">{p.jabatan}</Badge>
                          {p.nilaiKontrak && <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{p.nilaiKontrak}</Badge>}
                          {p.durasi && <span className="text-[10px] text-slate-500">{p.durasi}</span>}
                        </div>
                      </div>
                    </div>
                    {p.pemilik && <p className="text-[11px] text-slate-500 mb-2">Pemberi kerja: {p.pemilik}</p>}
                    <div className="mb-2">
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">Uraian Tugas & Tanggung Jawab</p>
                      <ul className="space-y-0.5">{p.uraianTugas.map((u, ui) => <li key={ui} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />{u}</li>)}</ul>
                    </div>
                    <div className="rounded-lg bg-teal-500/5 border border-teal-500/20 px-3 py-2 mb-2">
                      <p className="text-[10px] text-teal-400 font-semibold mb-0.5">Hasil & Capaian</p>
                      <p className="text-xs text-slate-300">{p.hasilCapaian}</p>
                    </div>
                    {p.unitKompetensiYangDibuktikan?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold mb-1">Unit kompetensi yang dibuktikan</p>
                        <div className="flex flex-wrap gap-1">{p.unitKompetensiYangDibuktikan.map((u, ui) => <Badge key={ui} variant="outline" className="text-[9px] text-slate-400 border-slate-600">{u}</Badge>)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "apl02" && (
              <div className="rounded-xl border border-white/8 bg-white/2">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <p className="text-xs text-slate-400 font-semibold">Draft APL-02 (Asesmen Mandiri)</p>
                  <Button onClick={() => copyText(result.formatAPL02, "apl02")} variant="outline" className="h-7 text-xs gap-1.5">
                    {copied === "apl02" ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                  </Button>
                </div>
                <div className="p-4">
                  <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{result.formatAPL02}</pre>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Buat Ulang</Button>
              <Button asChild className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs">
                <Link href="/laporan-proyek-bnsp">Laporan Proyek BNSP →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
