import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ClipboardCheck, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN = [
  "Pekerjaan Pondasi (Bored Pile / Tiang Pancang)",
  "Pekerjaan Struktur Beton Bertulang (Kolom/Balok/Pelat)",
  "Pekerjaan Pasangan Dinding Bata/Bata Ringan",
  "Pekerjaan Waterproofing",
  "Pekerjaan Finishing Plester & Acian",
  "Pekerjaan Perkerasan Jalan (AC-WC / AC-BC / Lapen)",
  "Pekerjaan Jembatan (Gelagar Beton/Baja)",
  "Pekerjaan Instalasi Mekanikal (Plumbing/Pipa)",
  "Pekerjaan Instalasi Elektrikal (Panel/Kabel)",
  "Pekerjaan Fabrikasi Baja Struktural",
  "Pekerjaan Tiang Listrik & Saluran PLN",
  "Pekerjaan Pemancangan / Drilling",
  "Pekerjaan Pengecatan (Cat Interior/Eksterior)",
  "Pekerjaan Pemasangan Keramik & Homogeneous Tile",
];

const LEVEL_INSPEKSI_OPTIONS = [
  "R — Review (cukup periksa dokumen)",
  "H — Hold Point (wajib hadir, pekerjaan tidak boleh lanjut sebelum disetujui)",
  "W — Witness (diundang hadir, boleh lanjut jika tidak hadir)",
  "M — Monitor (pantau berkala)",
];

interface ItemITP {
  no: number;
  aktivitas: string;
  referensi: string;
  dokumenVerifikasi: string;
  levelKontraktor: string;
  levelMK: string;
  levelOwner: string;
  frekuensi: string;
  batasPenerimaan: string;
  catatan: string;
}

interface HasilITP {
  judulITP: string;
  nomorITP: string;
  klausulMutu: string;
  deskripsi: string;
  items: ItemITP[];
  dokumenTerkait: string[];
  catatanUmum: string;
}

export default function GeneratorITP() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState(JENIS_PEKERJAAN[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [kontraktor, setKontraktor] = useState("");
  const [standarAcuan, setStandarAcuan] = useState("SNI & Spesifikasi Teknis Kontrak");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilITP | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-itp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, namaProyek, kontraktor, standarAcuan }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { /**/ } finally { setLoading(false); }
  }

  function copyAll() {
    if (!hasil) return;
    const header = ["No", "Aktivitas/Item Inspeksi", "Referensi", "Dokumen Verifikasi", "Kont", "MK", "Owner", "Frekuensi", "Batas Penerimaan", "Catatan"].join("\t");
    const rows = hasil.items.map(i => [i.no, i.aktivitas, i.referensi, i.dokumenVerifikasi, i.levelKontraktor, i.levelMK, i.levelOwner, i.frekuensi, i.batasPenerimaan, i.catatan].join("\t"));
    navigator.clipboard.writeText([hasil.judulITP, "", header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const LEVEL_COLOR: Record<string, string> = {
    H: "bg-red-500/20 text-red-300 border-red-500/30",
    W: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    R: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    M: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ClipboardCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator ITP — Inspection Test Plan</h1>
              <p className="text-slate-400 text-sm">Generate Rencana Inspeksi dan Pengujian (ITP) formal sesuai standar QC konstruksi</p>
            </div>
            <Badge className="ml-auto bg-blue-500/15 text-blue-400 border-blue-500/30">Gelombang 22</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pekerjaan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPekerjaan} onChange={e => setJenisPekerjaan(e.target.value)}>
                {JENIS_PEKERJAAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Proyek Gedung Kantor 8 Lantai" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Kontraktor</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: PT Konstruksi Maju Jaya" value={kontraktor} onChange={e => setKontraktor(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Standar & Acuan Teknis</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: SNI, Spesifikasi Teknis, ACI, AASHTO" value={standarAcuan} onChange={e => setStandarAcuan(e.target.value)} />
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-4 gap-2 text-xs">
              {LEVEL_INSPEKSI_OPTIONS.map(opt => (
                <div key={opt} className="flex gap-1 items-center">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${LEVEL_COLOR[opt[0]] || ""}`}>{opt[0]}</span>
                  <span className="text-slate-300">{opt.slice(4)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat ITP...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate ITP</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun Inspection Test Plan...</p>
            <p className="text-slate-500 text-sm mt-1">Hold Points, Witness, dokumen verifikasi, batas penerimaan</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-300 text-xs font-mono mb-1">No. {hasil.nomorITP} | {hasil.klausulMutu}</div>
                <h2 className="text-white font-bold text-lg">{hasil.judulITP}</h2>
                <p className="text-slate-400 text-sm mt-1">{hasil.deskripsi}</p>
              </div>
              <Button onClick={copyAll} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin TSV"}
              </Button>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/60">
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium w-8">No</th>
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium min-w-[180px]">Aktivitas / Item Inspeksi</th>
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium min-w-[100px]">Referensi</th>
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium min-w-[140px]">Dokumen Verifikasi</th>
                    <th className="text-center px-2 py-2.5 text-slate-400 font-medium w-14">Kont</th>
                    <th className="text-center px-2 py-2.5 text-slate-400 font-medium w-10">MK</th>
                    <th className="text-center px-2 py-2.5 text-slate-400 font-medium w-14">Owner</th>
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium min-w-[100px]">Frekuensi</th>
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium min-w-[120px]">Batas Penerimaan</th>
                    <th className="text-left px-3 py-2.5 text-slate-400 font-medium min-w-[100px]">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.items.map(item => (
                    <tr key={item.no} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="px-3 py-2.5 text-slate-400">{item.no}</td>
                      <td className="px-3 py-2.5 text-slate-200 font-medium">{item.aktivitas}</td>
                      <td className="px-3 py-2.5 text-slate-400">{item.referensi}</td>
                      <td className="px-3 py-2.5 text-slate-300">{item.dokumenVerifikasi}</td>
                      {[item.levelKontraktor, item.levelMK, item.levelOwner].map((level, i) => (
                        <td key={i} className="text-center px-2 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${LEVEL_COLOR[level] || "text-slate-400"}`}>{level}</span>
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-slate-300">{item.frekuensi}</td>
                      <td className="px-3 py-2.5 text-slate-300">{item.batasPenerimaan}</td>
                      <td className="px-3 py-2.5 text-slate-400 italic">{item.catatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-blue-300 font-semibold mb-3">Dokumen Terkait</h3>
                <ul className="space-y-1">
                  {hasil.dokumenTerkait.map((d, i) => <li key={i} className="text-slate-300 text-sm">• {d}</li>)}
                </ul>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-blue-300 font-semibold mb-2">Catatan Umum</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{hasil.catatanUmum}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
