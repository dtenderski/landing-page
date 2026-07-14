import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN_HIRADC = [
  "Pekerjaan Pondasi & Galian Tanah",
  "Pekerjaan Struktur Beton (Kolom/Balok/Pelat)",
  "Pekerjaan Bekisting & Perancah",
  "Pekerjaan Baja & Besi (Erection)",
  "Pekerjaan Atap & Waterproofing",
  "Pekerjaan Finishing & Dinding",
  "Pekerjaan MEP (Mekanikal/Elektrikal/Plumbing)",
  "Pekerjaan Jalan & Perkerasan",
  "Pekerjaan Jembatan",
  "Pekerjaan Pipa & Piping",
  "Pekerjaan Las & Cutting",
  "Pekerjaan di Ruang Tertutup (Confined Space)",
  "Pekerjaan Ketinggian (Working at Height > 1.8m)",
  "Pekerjaan Alat Berat (Crane/Excavator/Forklift)",
  "Pekerjaan Demolisi / Pembongkaran",
  "Pekerjaan Kelistrikan & Instalasi Panel",
];

const STANDAR_ACUAN = [
  "PP No. 50 Tahun 2012 (SMK3)",
  "ISO 45001:2018 (OHSMS)",
  "OHSAS 18001:2007",
  "Permenaker No. 5 Tahun 1996",
  "Permen PUPR No. 10 Tahun 2021",
  "CSMS Pertamina",
  "CSMS Chevron / PHR",
];

interface RisikoHIRADC {
  no: number;
  aktivitas: string;
  bahaya: string;
  jenisHazard: string;
  dampak: string;
  kemungkinan: number;
  keparahan: number;
  risiko: number;
  level: string;
  pengendalian: string;
  pic: string;
  targetSelesai: string;
}

interface HasilHIRADC {
  judul: string;
  nomorDokumen: string;
  lingkupPekerjaan: string;
  jenisHazardYangAda: string[];
  risiko: RisikoHIRADC[];
  rekapRisiko: { level: string; jumlah: number; warna: string }[];
  catatan: string;
}

const LEVEL_COLOR: Record<string, string> = {
  "Ekstrem": "text-red-400 bg-red-900/20 border border-red-500/30",
  "Tinggi": "text-orange-400 bg-orange-900/20 border border-orange-500/30",
  "Sedang": "text-yellow-400 bg-yellow-900/20 border border-yellow-500/30",
  "Rendah": "text-green-400 bg-green-900/20 border border-green-500/30",
};

export default function GeneratorHIRADC() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState(JENIS_PEKERJAAN_HIRADC[2]);
  const [standar, setStandar] = useState(STANDAR_ACUAN[0]);
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilHIRADC | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-hiradc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, standar, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyTSV() {
    if (!hasil) return;
    const header = "No\tAktivitas\tBahaya\tJenis Hazard\tDampak\tK\tS\tR\tLevel\tPengendalian\tPIC\tTarget";
    const rows = hasil.risiko.map(r => `${r.no}\t${r.aktivitas}\t${r.bahaya}\t${r.jenisHazard}\t${r.dampak}\t${r.kemungkinan}\t${r.keparahan}\t${r.risiko}\t${r.level}\t${r.pengendalian}\t${r.pic}\t${r.targetSelesai}`);
    navigator.clipboard.writeText([header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator HIRADC — Identifikasi Bahaya & Penilaian Risiko</h1>
              <p className="text-slate-400 text-sm">Hazard Identification, Risk Assessment, Determining Controls — sesuai PP 50/2012 & ISO 45001</p>
            </div>
            <Badge className="ml-auto bg-amber-500/15 text-amber-400 border-amber-500/30">Gelombang 24</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pekerjaan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPekerjaan} onChange={e => setJenisPekerjaan(e.target.value)}>
                {JENIS_PEKERJAAN_HIRADC.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Standar Acuan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={standar} onChange={e => setStandar(e.target.value)}>
                {STANDAR_ACUAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks Proyek (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: proyek gedung 15 lantai, lokasi dekat jalan raya, periode hujan" value={konteks} onChange={e => setKonteks(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengidentifikasi bahaya...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate HIRADC</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Mengidentifikasi bahaya dan penilaian risiko...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-amber-300 text-xs font-mono mb-1">{hasil.nomorDokumen}</div>
                <h2 className="text-white font-bold">{hasil.judul}</h2>
                <p className="text-slate-400 text-sm mt-1">{hasil.lingkupPekerjaan}</p>
              </div>
              <Button onClick={copyTSV} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin TSV"}
              </Button>
            </div>

            {hasil.rekapRisiko && hasil.rekapRisiko.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {hasil.rekapRisiko.map((r, i) => (
                  <div key={i} className={`rounded-lg p-3 text-center ${LEVEL_COLOR[r.level] || "text-slate-300 bg-slate-800"}`}>
                    <div className="text-2xl font-bold">{r.jumlah}</div>
                    <div className="text-xs font-medium">{r.level}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-x-auto">
              <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
                <div className="text-xs text-slate-400">Matriks Risiko: <span className="text-white">K = Kemungkinan (1-5), S = Keparahan (1-5), R = K × S</span></div>
              </div>
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="text-center px-3 py-2 w-8">No</th>
                    <th className="text-left px-3 py-2">Aktivitas</th>
                    <th className="text-left px-3 py-2">Bahaya</th>
                    <th className="text-left px-3 py-2">Dampak</th>
                    <th className="text-center px-2 py-2">K</th>
                    <th className="text-center px-2 py-2">S</th>
                    <th className="text-center px-2 py-2">R</th>
                    <th className="text-center px-2 py-2">Level</th>
                    <th className="text-left px-3 py-2">Pengendalian</th>
                    <th className="text-left px-3 py-2">PIC</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.risiko.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="text-center px-3 py-2 text-slate-500">{r.no}</td>
                      <td className="px-3 py-2 text-slate-300 max-w-32">{r.aktivitas}</td>
                      <td className="px-3 py-2 text-orange-300 max-w-32">{r.bahaya}</td>
                      <td className="px-3 py-2 text-slate-400 max-w-32">{r.dampak}</td>
                      <td className="text-center px-2 py-2 text-white font-medium">{r.kemungkinan}</td>
                      <td className="text-center px-2 py-2 text-white font-medium">{r.keparahan}</td>
                      <td className="text-center px-2 py-2 text-white font-bold">{r.risiko}</td>
                      <td className="text-center px-2 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.level === "Ekstrem" ? "bg-red-900/40 text-red-300" : r.level === "Tinggi" ? "bg-orange-900/40 text-orange-300" : r.level === "Sedang" ? "bg-yellow-900/40 text-yellow-300" : "bg-green-900/40 text-green-300"}`}>{r.level}</span>
                      </td>
                      <td className="px-3 py-2 text-green-300 max-w-48">{r.pengendalian}</td>
                      <td className="px-3 py-2 text-slate-400">{r.pic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">* Matriks risiko 5×5: R = Kemungkinan × Keparahan. Rendah (1-5) | Sedang (6-9) | Tinggi (10-15) | Ekstrem (16-25). HIRADC ini bersifat panduan — perlu verifikasi dengan Ahli K3 Konstruksi di lapangan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
