import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ClipboardList, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN_SOP = [
  "Pekerjaan Galian Tanah & Pondasi",
  "Pekerjaan Struktur Beton (Cor Kolom/Balok/Pelat)",
  "Pekerjaan Bekisting & Perancah (Scaffolding)",
  "Pekerjaan Besi/Baja (Fabrikasi & Erection)",
  "Pekerjaan Pasangan Bata & Plesteran",
  "Pekerjaan Atap (Baja Ringan + Penutup Atap)",
  "Pekerjaan Finishing (Keramik, Cat, Plafon)",
  "Pekerjaan Mekanikal Plumbing (Instalasi Pipa Air)",
  "Pekerjaan Elektrikal (Instalasi Kabel & Panel)",
  "Pekerjaan Jalan Aspal (Hotmix/Overlay)",
  "Pekerjaan Jembatan (Pondasi Tiang Pancang)",
  "Pekerjaan Las (Welding & Cutting)",
  "Pekerjaan di Ruang Tertutup (Confined Space)",
  "Pekerjaan Ketinggian (Working at Height)",
  "Pekerjaan Alat Berat (Pengoperasian Crane)",
  "Pekerjaan Demolisi / Pembongkaran Bangunan",
  "Pekerjaan Waterproofing & Grouting",
  "Pekerjaan Pengecoran Massal (Mass Concrete)",
];

const STANDAR_SOP = [
  "Permen PUPR No. 10 Tahun 2021 (K3 Konstruksi)",
  "PP No. 50 Tahun 2012 (SMK3)",
  "ISO 45001:2018 (OHSMS)",
  "CSMS Pertamina / PHR",
  "CSMS Chevron",
  "Internal Perusahaan (best practice)",
];

const LEVEL_RESIKO = ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

interface LangkahSOP {
  nomor: number;
  fase: string;
  aktivitas: string;
  pelaksana: string;
  alat: string[];
  hazard: string;
  pengendalian: string;
  verifikasi: string;
}

interface HasilSOP {
  nomorDokumen: string;
  judul: string;
  tujuan: string;
  ruangLingkup: string;
  referensi: string[];
  definisi: string[];
  APDWajib: string[];
  langkah: LangkahSOP[];
  kondisiDarurat: { kondisi: string; tindakan: string }[];
  catatanKhusus: string[];
  revisiKe: string;
}

export default function GeneratorSOPPekerjaan() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState(JENIS_PEKERJAAN_SOP[1]);
  const [standar, setStandar] = useState(STANDAR_SOP[0]);
  const [levelResiko, setLevelResiko] = useState("Tinggi");
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilSOP | null>(null);
  const [expandedFase, setExpandedFase] = useState<string | null>("Persiapan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-sop-pekerjaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, standar, levelResiko, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyAll() {
    if (!hasil) return;
    const lines = [
      `SOP: ${hasil.judul}`,
      `No. Dok: ${hasil.nomorDokumen}`,
      "",
      `TUJUAN: ${hasil.tujuan}`,
      `RUANG LINGKUP: ${hasil.ruangLingkup}`,
      "",
      `APD WAJIB: ${hasil.APDWajib.join(", ")}`,
      "",
      "LANGKAH-LANGKAH:",
      ...hasil.langkah.map(l => `${l.nomor}. [${l.fase}] ${l.aktivitas}\n   Pelaksana: ${l.pelaksana}\n   Hazard: ${l.hazard}\n   Pengendalian: ${l.pengendalian}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fases = hasil ? [...new Set(hasil.langkah.map(l => l.fase))] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ClipboardList className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator SOP Pekerjaan Konstruksi</h1>
              <p className="text-slate-400 text-sm">Generate SOP formal dengan langkah kerja, APD, hazard, dan pengendalian — per fase pekerjaan</p>
            </div>
            <Badge className="ml-auto bg-blue-500/15 text-blue-400 border-blue-500/30">Gelombang 25</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pekerjaan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPekerjaan} onChange={e => setJenisPekerjaan(e.target.value)}>
                {JENIS_PEKERJAAN_SOP.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Standar Acuan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={standar} onChange={e => setStandar(e.target.value)}>
                {STANDAR_SOP.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Level Risiko Pekerjaan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={levelResiko} onChange={e => setLevelResiko(e.target.value)}>
                {LEVEL_RESIKO.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks / Kondisi Khusus (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: proyek tepi laut, dekat fasilitas listrik tegangan tinggi, cuaca ekstrem" value={konteks} onChange={e => setKonteks(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun SOP...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate SOP</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun SOP pekerjaan konstruksi...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-300 text-xs font-mono mb-1">{hasil.nomorDokumen} | Rev. {hasil.revisiKe}</div>
                <h2 className="text-white font-bold">{hasil.judul}</h2>
              </div>
              <Button onClick={copyAll} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin SOP"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-blue-300 text-xs font-medium mb-1">Tujuan</div>
                <p className="text-slate-300 text-xs">{hasil.tujuan}</p>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-blue-300 text-xs font-medium mb-1">Ruang Lingkup</div>
                <p className="text-slate-300 text-xs">{hasil.ruangLingkup}</p>
              </div>
            </div>

            <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-4">
              <div className="text-orange-300 text-sm font-medium mb-2">🦺 APD Wajib</div>
              <div className="flex flex-wrap gap-1.5">
                {hasil.APDWajib.map((a, i) => <span key={i} className="bg-orange-900/30 text-orange-200 text-xs px-2 py-0.5 rounded">{a}</span>)}
              </div>
            </div>

            <div className="space-y-2">
              {fases.map(fase => {
                const langkahFase = hasil.langkah.filter(l => l.fase === fase);
                return (
                  <div key={fase} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedFase(expandedFase === fase ? null : fase)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">{langkahFase.length} langkah</span>
                        <span className="text-white font-medium">{fase}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedFase === fase ? "rotate-180" : ""}`} />
                    </button>
                    {expandedFase === fase && (
                      <div className="px-4 pb-4 space-y-2">
                        {langkahFase.map((l, i) => (
                          <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{l.nomor}</div>
                              <div className="flex-1">
                                <div className="text-blue-200 text-sm font-medium mb-1">{l.aktivitas}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 text-xs">
                                  <div><span className="text-slate-500">Pelaksana:</span> <span className="text-slate-300">{l.pelaksana}</span></div>
                                  {l.alat.length > 0 && <div><span className="text-slate-500">Alat/Bahan:</span> <span className="text-slate-300">{l.alat.join(", ")}</span></div>}
                                  <div className="md:col-span-2 mt-1"><span className="text-red-400">⚠ {l.hazard}</span></div>
                                  <div className="md:col-span-2"><span className="text-green-400">✓ {l.pengendalian}</span></div>
                                  {l.verifikasi && <div className="md:col-span-2"><span className="text-slate-500">Verifikasi:</span> <span className="text-slate-400">{l.verifikasi}</span></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {hasil.kondisiDarurat.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                <div className="text-red-300 font-medium mb-2">🚨 Prosedur Keadaan Darurat</div>
                <div className="space-y-1.5">
                  {hasil.kondisiDarurat.map((k, i) => (
                    <div key={i} className="bg-red-900/20 rounded p-2">
                      <div className="text-red-300 text-xs font-medium">{k.kondisi}</div>
                      <div className="text-slate-300 text-xs">{k.tindakan}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
