import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Flame, Info,
  RotateCcw, Copy, CheckCircle2, ChevronDown
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN_JSA = [
  "Pekerjaan di Ketinggian (perancah, atap, fasad)",
  "Penggalian dan Galian Dalam (> 1.5m)",
  "Pengangkatan Beban Berat (crane, rigger)",
  "Pekerjaan Pembesian & Bekisting",
  "Pekerjaan Pengecoran Beton (in-situ / ready mix)",
  "Pekerjaan Bongkar / Demolisi Struktur",
  "Instalasi Listrik (panel, kabel HV/LV)",
  "Pekerjaan Las (arc welding, gas welding)",
  "Pekerjaan di Ruang Terbatas (confined space)",
  "Pekerjaan Pemasangan Atap / Genteng",
  "Pekerjaan Pemancangan / Bored Pile",
  "Pekerjaan Jalan / Asphalt Paving",
];

const KONDISI_LINGKUNGAN = [
  "Normal (siang hari, cuaca baik)",
  "Malam hari / penerangan terbatas",
  "Hujan / basah / licin",
  "Dekat area publik / lalu lintas",
  "Area berdebu / polusi udara tinggi",
  "Cuaca ekstrem (angin kencang > 35 km/j)",
];

const LEVEL_RISIKO = ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

interface StepJSA {
  langkahKerja: string; bahaya: string[]; risikoLevel: string;
  pengendalian: { tipe: string; uraian: string }[];
  APD: string[];
}
interface HasilJSA {
  judulJSA: string; nomorJSA: string; lingkupPekerjaan: string;
  steps: StepJSA[];
  APDUmum: string[];
  prosedurDarurat: string;
  tanda_tangan: string[];
}

export default function GeneratorJSA() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState("");
  const [kondisi, setKondisi] = useState(KONDISI_LINGKUNGAN[0]);
  const [jumlahPekerja, setJumlahPekerja] = useState(5);
  const [risikoAwal, setRisikoAwal] = useState("Tinggi");
  const [lokasiProyek, setLokasiProyek] = useState("");
  const [result, setResult] = useState<HasilJSA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openStep, setOpenStep] = useState<Set<number>>(new Set([0, 1, 2]));

  function toggleStep(i: number) { setOpenStep(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisPekerjaan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-jsa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, kondisi, jumlahPekerja, risikoAwal, lokasiProyek }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenStep(new Set([0, 1, 2]));
    } catch (e: any) { setError(e.message || "Gagal generate JSA."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = `${result.judulJSA}\n${result.nomorJSA}\n\n${result.lingkupPekerjaan}\n\n${result.steps.map((s, i) => `Langkah ${i+1}: ${s.langkahKerja}\nBahaya: ${s.bahaya.join(", ")}\nPengendalian: ${s.pengendalian.map(p => p.uraian).join("; ")}\nAPD: ${s.APD.join(", ")}`).join("\n\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const RISIKO_COLOR: Record<string, string> = {
    "Rendah": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Sedang": "text-amber-400 bg-amber-500/10 border-amber-500/30",
    "Tinggi": "text-orange-400 bg-orange-500/10 border-orange-500/30",
    "Sangat Tinggi": "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-400" /> Generator Job Safety Analysis (JSA)
            </h1>
            <p className="text-xs text-slate-400">Buat JSA / HIRARC untuk pekerjaan konstruksi berisiko tinggi — identifikasi bahaya, penilaian risiko, pengendalian, dan APD</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">JSA (Job Safety Analysis) wajib dibuat sebelum setiap pekerjaan berisiko tinggi. Mengacu pada IBPR (Identifikasi Bahaya & Penilaian Risiko) dalam SMKK (Permen PUPR 10/2021, SNI ISO 45001:2018).</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan *</label>
                <div className="space-y-1.5">
                  {JENIS_PEKERJAAN_JSA.map(s => (
                    <button key={s} onClick={() => setJenisPekerjaan(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisPekerjaan === s ? "bg-red-500/10 border-red-400/30 text-red-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Lokasi / Nama Proyek <span className="text-slate-600">(opsional)</span></label>
                <input value={lokasiProyek} onChange={e => setLokasiProyek(e.target.value)}
                  placeholder="cth: Proyek Gedung Tower A — Lantai 15"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Kondisi Lingkungan Kerja</label>
                  <select value={kondisi} onChange={e => setKondisi(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {KONDISI_LINGKUNGAN.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Level Risiko Awal</label>
                  <select value={risikoAwal} onChange={e => setRisikoAwal(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {LEVEL_RISIKO.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jumlah Pekerja: <span className="text-red-400 font-bold">{jumlahPekerja} orang</span></label>
                <input type="range" min={1} max={50} value={jumlahPekerja} onChange={e => setJumlahPekerja(+e.target.value)} className="w-full accent-red-500" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5"><span>1</span><span>50</span></div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisPekerjaan || loading} className="w-full bg-red-600 hover:bg-red-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun JSA...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Job Safety Analysis</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulJSA}</p>
                  <p className="text-[10px] text-slate-500">{result.nomorJSA}</p>
                  <p className="text-xs text-slate-300 mt-1">{result.lingkupPekerjaan}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              {result.APDUmum?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/8">
                  <p className="text-[10px] text-red-400 font-semibold mb-1.5">APD Wajib Umum</p>
                  <div className="flex flex-wrap gap-1">{result.APDUmum.map((a, i) => <Badge key={i} variant="outline" className="text-[9px] text-slate-300 border-slate-600">{a}</Badge>)}</div>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-400 font-semibold">Langkah Kerja & Pengendalian Bahaya</p>
              {result.steps?.map((s, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleStep(i)} className="w-full text-left p-3.5 flex items-center gap-2">
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold shrink-0">#{i+1}</span>
                    <p className="text-sm text-white font-medium flex-1">{s.langkahKerja}</p>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${RISIKO_COLOR[s.risikoLevel] ?? "text-slate-400 border-slate-600"}`}>{s.risikoLevel}</Badge>
                    <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openStep.has(i) ? "rotate-180" : ""}`} />
                  </button>
                  {openStep.has(i) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                      <div>
                        <p className="text-[10px] text-red-400 font-semibold mb-1">Identifikasi Bahaya</p>
                        <div className="flex flex-wrap gap-1">{s.bahaya.map((b, j) => <Badge key={j} variant="outline" className="text-[9px] text-red-300 border-red-400/30">{b}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="text-[10px] text-orange-400 font-semibold mb-1">Pengendalian Risiko</p>
                        <div className="space-y-1">{s.pengendalian.map((p, j) => (
                          <div key={j} className="flex items-start gap-2"><Badge variant="outline" className="text-[8px] text-slate-400 border-slate-600 shrink-0">{p.tipe}</Badge><p className="text-xs text-slate-300">{p.uraian}</p></div>
                        ))}</div>
                      </div>
                      {s.APD.length > 0 && (
                        <div>
                          <p className="text-[10px] text-emerald-400 font-semibold mb-1">APD Spesifik</p>
                          <div className="flex flex-wrap gap-1">{s.APD.map((a, j) => <Badge key={j} variant="outline" className="text-[9px] text-emerald-300 border-emerald-400/30">{a}</Badge>)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4">
              <p className="text-[10px] text-amber-400 font-semibold mb-1">Prosedur Tanggap Darurat</p>
              <p className="text-xs text-slate-300">{result.prosedurDarurat}</p>
            </div>

            {result.tanda_tangan?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-3 mb-4">
                <p className="text-[10px] text-slate-400 font-semibold mb-2">Kolom Persetujuan</p>
                <div className="grid grid-cols-3 gap-2">{result.tanda_tangan.map((t, i) => (
                  <div key={i} className="rounded-lg border border-white/8 p-2 text-center">
                    <div className="h-8 border-b border-dashed border-white/15 mb-1" />
                    <p className="text-[9px] text-slate-500">{t}</p>
                  </div>
                ))}</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />JSA Baru</Button>
              <Button asChild className="flex-1 bg-red-600 hover:bg-red-700 text-xs">
                <Link href="/smk3-claw">SMK3Claw AI →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
