import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, BookOpen, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const KONDISI_CUACA = ["Cerah", "Cerah Berawan", "Berawan", "Hujan Ringan", "Hujan Lebat", "Hujan Disertai Petir"];
const JENIS_PROYEK_OPTS = [
  "Gedung Bertingkat",
  "Jalan & Perkerasan",
  "Jembatan",
  "Perumahan",
  "Infrastruktur Air (Irigasi/Drainase)",
  "Industri & Pabrik",
  "Renovasi / Rehabilitasi",
];

interface HasilLaporanHarian {
  nomorLaporan: string;
  judulLaporan: string;
  ringkasanProgress: string;
  kegiatanHariIni: { uraian: string; volume: string; satuan: string; bobot: string; keterangan: string }[];
  personelHariIni: { jabatan: string; jumlah: number; pekerjaan: string }[];
  peralatanDigunakan: { nama: string; jumlah: number; kondisi: string }[];
  materialDiterima: { material: string; volume: string; satuan: string; supplier: string }[];
  masalahKendala: string[];
  rencanaEsokHari: string[];
  instruksiDireksiMK: string;
  catatanK3: string;
  progressKumulatif: string;
}

export default function GeneratorLaporanHarian() {
  const [jenisProyek, setJenisProyek] = useState(JENIS_PROYEK_OPTS[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [tanggalLaporan, setTanggalLaporan] = useState(new Date().toISOString().split("T")[0]);
  const [kondisiCuaca, setKondisiCuaca] = useState("Cerah Berawan");
  const [kegiatanHariIni, setKegiatanHariIni] = useState("");
  const [progressKumulatif, setProgressKumulatif] = useState("");
  const [masalah, setMasalah] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilLaporanHarian | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek.trim() || !kegiatanHariIni.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-laporan-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, namaProyek, tanggalLaporan, kondisiCuaca, kegiatanHariIni, progressKumulatif, masalah }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { /**/ } finally { setLoading(false); }
  }

  function copyAll() {
    if (!hasil) return;
    const text = [
      hasil.judulLaporan,
      `No. ${hasil.nomorLaporan} | Tanggal: ${tanggalLaporan} | Cuaca: ${kondisiCuaca}`,
      "",
      "RINGKASAN PROGRESS:",
      hasil.ringkasanProgress,
      "",
      "KEGIATAN HARI INI:",
      ...hasil.kegiatanHariIni.map(k => `• ${k.uraian} — ${k.volume} ${k.satuan} (Bobot: ${k.bobot}%)`),
      "",
      "RENCANA ESOK HARI:",
      ...hasil.rencanaEsokHari.map(r => `• ${r}`),
      "",
      "CATATAN K3:",
      hasil.catatanK3,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const CUACA_COLOR: Record<string, string> = {
    "Cerah": "text-yellow-400", "Cerah Berawan": "text-orange-400", "Berawan": "text-slate-400",
    "Hujan Ringan": "text-blue-400", "Hujan Lebat": "text-blue-300", "Hujan Disertai Petir": "text-red-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Laporan Harian Proyek</h1>
              <p className="text-slate-400 text-sm">Buat daily report proyek formal: kegiatan, personel, alat, material, masalah, rencana esok hari</p>
            </div>
            <Badge className="ml-auto bg-indigo-500/15 text-indigo-400 border-indigo-500/30">Gelombang 22</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Proyek</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}>
                {JENIS_PROYEK_OPTS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Proyek Gedung Kantor 8 Lantai Bandung" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tanggal Laporan</label>
              <input type="date" className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tanggalLaporan} onChange={e => setTanggalLaporan(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kondisi Cuaca</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={kondisiCuaca} onChange={e => setKondisiCuaca(e.target.value)}>
                {KONDISI_CUACA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Progress Kumulatif s/d Hari Ini (%)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 42% (rencana 45%)" value={progressKumulatif} onChange={e => setProgressKumulatif(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Masalah / Kendala</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: keterlambatan material, cuaca, dll (opsional)" value={masalah} onChange={e => setMasalah(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kegiatan Hari Ini *</label>
              <textarea rows={3} className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 resize-none"
                placeholder="cth: Pengecoran kolom lantai 3 as A-B/1-4 (8 kolom), pemasangan bekisting balok lantai 4, pabrikasi tulangan balok B1 (20 unit)..."
                value={kegiatanHariIni} onChange={e => setKegiatanHariIni(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading || !namaProyek.trim() || !kegiatanHariIni.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Laporan Harian...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Laporan Harian</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun laporan harian proyek...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-indigo-300 text-xs font-mono mb-1">No. {hasil.nomorLaporan}</div>
                  <h2 className="text-white font-bold">{hasil.judulLaporan}</h2>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-slate-400">📅 {tanggalLaporan}</span>
                    <span className={CUACA_COLOR[kondisiCuaca] || "text-slate-400"}>☁ {kondisiCuaca}</span>
                    {hasil.progressKumulatif && <span className="text-green-400">📊 {hasil.progressKumulatif}</span>}
                  </div>
                </div>
                <Button onClick={copyAll} variant="outline" size="sm" className="border-indigo-500/40 text-indigo-300 shrink-0">
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>
              <p className="text-slate-300 text-sm">{hasil.ringkasanProgress}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-indigo-300 font-semibold mb-3">Kegiatan Hari Ini</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead><tr className="text-slate-400 border-b border-slate-700/50 text-xs">
                    <th className="text-left py-2 pr-4">Uraian Kegiatan</th>
                    <th className="text-right py-2 px-3">Volume</th>
                    <th className="text-right py-2 px-3">Satuan</th>
                    <th className="text-right py-2 px-3">Bobot %</th>
                    <th className="text-left py-2 pl-3">Keterangan</th>
                  </tr></thead>
                  <tbody>
                    {hasil.kegiatanHariIni.map((k, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td className="py-2 pr-4 text-slate-200">{k.uraian}</td>
                        <td className="text-right px-3 text-indigo-300">{k.volume}</td>
                        <td className="text-right px-3 text-slate-400">{k.satuan}</td>
                        <td className="text-right px-3 text-green-300">{k.bobot}</td>
                        <td className="pl-3 text-slate-400 text-xs">{k.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-indigo-300 font-semibold mb-3 text-sm">Personel</h3>
                <div className="space-y-1">
                  {hasil.personelHariIni.map((p, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-white font-medium">{p.jumlah} org</span>
                      <span className="text-slate-400 ml-1">{p.jabatan}</span>
                      <div className="text-slate-500 text-xs">{p.pekerjaan}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-indigo-300 font-semibold mb-3 text-sm">Peralatan</h3>
                <div className="space-y-1">
                  {hasil.peralatanDigunakan.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{p.jumlah}× {p.nama}</span>
                      <span className={`text-xs ${p.kondisi === "Baik" ? "text-green-400" : "text-orange-400"}`}>{p.kondisi}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-indigo-300 font-semibold mb-3 text-sm">Material Diterima</h3>
                {hasil.materialDiterima.length > 0 ? (
                  <div className="space-y-1">
                    {hasil.materialDiterima.map((m, i) => (
                      <div key={i} className="text-xs text-slate-300">{m.volume} {m.satuan} {m.material}<div className="text-slate-500">{m.supplier}</div></div>
                    ))}
                  </div>
                ) : <div className="text-slate-500 text-xs">Tidak ada penerimaan material hari ini</div>}
              </div>
            </div>

            {hasil.masalahKendala.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-red-400 font-semibold mb-2">Masalah & Kendala</h3>
                <ul className="space-y-1">{hasil.masalahKendala.map((m, i) => <li key={i} className="text-slate-300 text-sm">• {m}</li>)}</ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-green-400 font-semibold mb-2">Rencana Esok Hari</h3>
                <ul className="space-y-1">{hasil.rencanaEsokHari.map((r, i) => <li key={i} className="text-slate-300 text-sm">• {r}</li>)}</ul>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-orange-400 font-semibold mb-2">Catatan K3</h3>
                <p className="text-slate-300 text-sm">{hasil.catatanK3}</p>
                {hasil.instruksiDireksiMK && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-blue-300 text-xs font-medium mb-1">Instruksi Direksi/MK:</div>
                    <p className="text-slate-300 text-xs">{hasil.instruksiDireksiMK}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
              {[
                { label: "Pelaksana", line: "Nama: _______________", sub: "TTD & Stempel" },
                { label: "Pengawas Lapangan", line: "Nama: _______________", sub: "TTD" },
                { label: "Direksi / MK", line: "Nama: _______________", sub: "TTD" },
                { label: "Site Manager", line: "Nama: _______________", sub: "TTD & Stempel" },
              ].map(sig => (
                <div key={sig.label} className="text-center">
                  <div className="h-8 border-b border-slate-600 mb-1"></div>
                  <div className="text-slate-400 font-medium">{sig.label}</div>
                  <div className="text-slate-500 text-xs">{sig.line}</div>
                  <div className="text-slate-600 text-xs">{sig.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
