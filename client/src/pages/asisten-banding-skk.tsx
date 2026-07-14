import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, AlertTriangle, ChevronRight,
  Copy, CheckCircle2, FileText, Shield, Lightbulb, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Proyek — Muda",
  "Ahli Quantity Surveyor — Muda", "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda",
];

interface HasilBanding {
  ringkasanSituasi: string;
  suratBanding: string;
  hakBanding: string;
  prosedurBanding: { langkah: string; detail: string; batas: string }[];
  strategiRemedial: { unit: string; gap: string; cara: string; buktiTambahan: string }[];
  rencanaPersiapanUlang: { minggu: string; aktivitas: string[] }[];
  dokumenTambahan: string[];
  pesanSemangat: string;
}

export default function AsistenBandingSKK() {
  const [form, setForm] = useState({
    jabatan: "", unitTidakLulus: "", alasanPenguji: "", konteksnya: "",
  });
  const [result, setResult] = useState<HasilBanding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"surat" | "remedial" | "rencana">("surat");

  const isValid = form.jabatan && form.unitTidakLulus;

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/asisten-banding-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate panduan banding."); }
    finally { setLoading(false); }
  }

  function copySurat() {
    if (!result?.suratBanding) return;
    navigator.clipboard.writeText(result.suratBanding);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <Shield className="h-5 w-5 text-amber-400" /> Asisten Banding Asesmen SKK
            </h1>
            <p className="text-xs text-slate-400">Panduan banding, strategi remedial, dan rencana persiapan ulang asesmen</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Tidak lulus asesmen bukan akhir perjalanan — itu informasi berharga tentang gap yang perlu diisi. AI akan bantu buat surat banding + strategi remedial + rencana persiapan ulang yang terarah.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Diases *</label>
                <select value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Unit Kompetensi yang Tidak Lulus *</label>
                <textarea value={form.unitTidakLulus} onChange={e => setForm(f => ({ ...f, unitTidakLulus: e.target.value }))}
                  rows={3} placeholder="Sebutkan unit kompetensi yang dinyatakan Belum Kompeten (bisa lebih dari satu). cth: Mengelola K3 di tempat kerja, Melakukan inspeksi keselamatan rutin"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Alasan/Catatan Penguji <span className="text-slate-600">(opsional)</span></label>
                <textarea value={form.alasanPenguji} onChange={e => setForm(f => ({ ...f, alasanPenguji: e.target.value }))}
                  rows={2} placeholder="Apa yang dikatakan penguji/asesor tentang kekurangan Anda? cth: Kurang bukti pelaksanaan inspeksi, jawaban tidak sesuai prosedur"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Konteks Tambahan <span className="text-slate-600">(opsional)</span></label>
                <textarea value={form.konteksnya} onChange={e => setForm(f => ({ ...f, konteksnya: e.target.value }))}
                  rows={2} placeholder="cth: Sudah 5 tahun pengalaman K3 tapi pertama kali asesmen formal, LSP: XYZ"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyiapkan panduan banding...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Banding & Remedial</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
              <p className="text-amber-300 text-sm font-medium mb-1">{result.pesanSemangat}</p>
              <p className="text-slate-400 text-xs">{result.ringkasanSituasi}</p>
            </div>

            {/* Hak Banding */}
            <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 mb-4">
              <p className="text-xs text-amber-400 font-semibold mb-1 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Hak Banding Anda</p>
              <p className="text-sm text-slate-300">{result.hakBanding}</p>
            </div>

            {/* Prosedur Banding */}
            {result.prosedurBanding?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
                <p className="text-xs text-slate-400 font-semibold mb-2">Prosedur Pengajuan Banding</p>
                <div className="space-y-2">
                  {result.prosedurBanding.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-amber-400">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-xs text-white font-medium">{p.langkah}</p>
                        <p className="text-xs text-slate-400">{p.detail}</p>
                        {p.batas && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-400/30 mt-1">{p.batas}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["surat", "Surat Banding"], ["remedial", "Strategi Remedial"], ["rencana", "Rencana Persiapan"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "surat" && (
              <div className="rounded-xl border border-white/8 bg-white/2">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <p className="text-xs text-slate-400 font-semibold">Draft Surat Banding</p>
                  <Button onClick={copySurat} variant="outline" className="h-7 text-xs gap-1.5">
                    {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                  </Button>
                </div>
                <div className="p-4">
                  <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{result.suratBanding}</pre>
                </div>
              </div>
            )}

            {activeTab === "remedial" && (
              <div className="space-y-3">
                {result.strategiRemedial?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-xs text-amber-400 font-semibold mb-1">{s.unit}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold">Gap yang harus diisi</p>
                        <p className="text-xs text-slate-300">{s.gap}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold">Cara memperbaiki</p>
                        <p className="text-xs text-slate-300">{s.cara}</p>
                      </div>
                      <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                        <p className="text-[10px] text-teal-400 font-semibold mb-0.5">Bukti Tambahan yang Dibutuhkan</p>
                        <p className="text-xs text-slate-300">{s.buktiTambahan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "rencana" && (
              <div className="space-y-3">
                {result.rencanaPersiapanUlang?.map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-xs text-amber-400 font-semibold mb-2">{r.minggu}</p>
                    <ul className="space-y-1">{r.aktivitas.map((a, ai) => <li key={ai} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{a}</li>)}</ul>
                  </div>
                ))}
                {result.dokumenTambahan?.length > 0 && (
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
                    <p className="text-teal-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Dokumen Tambahan yang Perlu Disiapkan</p>
                    <ul className="space-y-1">{result.dokumenTambahan.map((d, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />{d}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Mulai Ulang</Button>
              <Button asChild className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs">
                <Link href="/materi-belajar-skk">Materi Belajar →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
