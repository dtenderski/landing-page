import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, HardHat, Copy,
  CheckCircle2, ChevronDown, Info, AlertTriangle, FileText, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK = [
  "Gedung Bertingkat / Highrise", "Jalan & Jembatan",
  "Bendungan / Irigasi", "Pelabuhan / Dermaga",
  "Instalasi Mekanikal-Elektrikal", "Proyek Tambang / Minyak & Gas",
  "Proyek Renovasi / Retrofit", "Proyek Sipil Umum",
];

const AKTIVITAS_TINGGI_RISIKO = [
  "Pekerjaan ketinggian (>2 meter)", "Penggalian & pekerjaan tanah",
  "Scaffolding & perancah", "Pekerjaan listrik bertegangan",
  "Penggunaan alat berat & crane", "Pekerjaan panas (pengelasan, pemotongan)",
  "Penanganan bahan berbahaya (B3)", "Cofferdam & penyanggaan galian",
  "Pekerjaan bawah air", "Demolisi / pembongkaran",
];

const SKALA_PROYEK = ["Kecil (< Rp 5 M, < 50 pekerja)", "Menengah (Rp 5–50 M, 50–200 pekerja)", "Besar (> Rp 50 M, > 200 pekerja)"];

interface SeksiSOP {
  nomor: string;
  judul: string;
  tujuan: string;
  prosedur: { langkah: string; penanggungJawab: string; alat: string }[];
  formulirTerkait: string[];
}

interface HasilSOP {
  judulSOP: string;
  jenisProyek: string;
  nomorDokumen: string;
  tanggalEfektif: string;
  ringkasan: string;
  ruangLingkup: string;
  definisi: { istilah: string; arti: string }[];
  seksiList: SeksiSOP[];
  indikatorKepatuhan: string[];
  referensiRegulasi: string[];
}

export default function GeneratorSOPK3Proyek() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [aktivitas, setAktivitas] = useState<string[]>([]);
  const [skala, setSkala] = useState("Menengah (Rp 5–50 M, 50–200 pekerja)");
  const [namaProyek, setNamaProyek] = useState("");
  const [result, setResult] = useState<HasilSOP | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSeksi, setOpenSeksi] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState(false);

  function toggleAktivitas(a: string) {
    setAktivitas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }
  function toggleSeksi(i: number) { setOpenSeksi(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  const isValid = jenisProyek && aktivitas.length > 0;

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-sop-k3-proyek", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, aktivitas, skala, namaProyek }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenSeksi(new Set([0]));
    } catch (e: any) { setError(e.message || "Gagal generate SOP."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = `${result.judulSOP}\nNo. Dokumen: ${result.nomorDokumen}\n\n${result.ringkasan}\n\nRuang Lingkup: ${result.ruangLingkup}\n\n${result.seksiList.map(s => `${s.nomor} ${s.judul}\nTujuan: ${s.tujuan}\n${s.prosedur.map((p, i) => `  ${i+1}. ${p.langkah} (PJ: ${p.penanggungJawab})`).join("\n")}`).join("\n\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
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
              <HardHat className="h-5 w-5 text-red-400" /> Generator SOP K3 Proyek Konstruksi
            </h1>
            <p className="text-xs text-slate-400">Pilih jenis proyek + aktivitas berisiko → AI generate draft SOP K3 struktural siap pakai</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-2">
              <HardHat className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">SOP K3 yang dihasilkan adalah draft awal sebagai referensi dan titik awal — harus ditinjau oleh Ahli K3 Konstruksi bersertifikat sebelum diimplementasikan di proyek nyata.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Proyek *</label>
                <select value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-400/50">
                  <option value="">Pilih jenis proyek...</option>
                  {JENIS_PROYEK.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek <span className="text-slate-600">(opsional)</span></label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Proyek Gedung X Jakarta"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Skala Proyek</label>
                <div className="space-y-1.5">
                  {SKALA_PROYEK.map(s => (
                    <button key={s} onClick={() => setSkala(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${skala === s ? "bg-red-500/15 border-red-400/40 text-red-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Aktivitas Berisiko Tinggi yang Akan Dicakup * <span className="text-slate-600">(pilih yang relevan)</span></label>
                <div className="grid grid-cols-1 gap-1.5">
                  {AKTIVITAS_TINGGI_RISIKO.map(a => (
                    <button key={a} onClick={() => toggleAktivitas(a)}
                      className={`rounded-lg border py-2 px-3 text-xs text-left transition-all flex items-center gap-2 ${aktivitas.includes(a) ? "bg-red-500/10 border-red-400/30 text-red-200" : "border-white/8 text-slate-400 hover:text-white"}`}>
                      <div className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${aktivitas.includes(a) ? "bg-red-500 border-red-500" : "border-slate-600"}`}>
                        {aktivitas.includes(a) && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                      </div>
                      {a}
                    </button>
                  ))}
                </div>
                {aktivitas.length > 0 && <p className="text-[10px] text-red-400 mt-1.5">{aktivitas.length} aktivitas dipilih</p>}
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-red-600 hover:bg-red-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating SOP K3...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Draft SOP K3</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulSOP}</p>
                  <p className="text-[10px] text-slate-500">No: {result.nomorDokumen} · Efektif: {result.tanggalEfektif}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-400">{result.ringkasan}</p>
              <p className="text-[11px] text-slate-500 mt-1">{result.ruangLingkup}</p>
            </div>

            {result.definisi?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-3 mb-4">
                <p className="text-xs text-slate-400 font-semibold mb-2">Definisi & Singkatan</p>
                <div className="grid grid-cols-1 gap-1">{result.definisi.map((d, i) => <p key={i} className="text-[11px] text-slate-400"><span className="text-white font-medium">{d.istilah}</span>: {d.arti}</p>)}</div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {result.seksiList?.map((s, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleSeksi(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-red-400 shrink-0">{s.nomor}</span>
                    <p className="text-sm text-white font-medium flex-1">{s.judul}</p>
                    <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-700 shrink-0">{s.prosedur?.length || 0} langkah</Badge>
                    <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openSeksi.has(i) ? "rotate-180" : ""}`} />
                  </button>
                  {openSeksi.has(i) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                      <p className="text-xs text-slate-400">{s.tujuan}</p>
                      <div className="space-y-1.5">
                        {s.prosedur?.map((p, pi) => (
                          <div key={pi} className="rounded-lg bg-slate-900/50 px-3 py-2 flex items-start gap-2">
                            <span className="text-[10px] font-mono text-red-400 shrink-0 mt-0.5">{pi+1}.</span>
                            <div className="flex-1">
                              <p className="text-xs text-slate-200">{p.langkah}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-500">PJ: {p.penanggungJawab}</span>
                                {p.alat && <span className="text-[9px] text-slate-600">· APD: {p.alat}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {s.formulirTerkait?.length > 0 && (
                        <div className="flex flex-wrap gap-1">{s.formulirTerkait.map((f, fi) => <Badge key={fi} variant="outline" className="text-[9px] text-slate-400 border-slate-600">{f}</Badge>)}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.referensiRegulasi?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-amber-400 text-xs font-semibold mb-2">Referensi Regulasi</p>
                <ul className="space-y-0.5">{result.referensiRegulasi.map((r, i) => <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{r}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-red-600 hover:bg-red-700 text-xs">
                <Link href="/k3-vision">AI K3 Inspector →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
