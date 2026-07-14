import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, FileBarChart2, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_LAPORAN = [
  "Laporan Kemajuan Mingguan (Weekly Progress Report)",
  "Laporan Kemajuan Bulanan (Monthly Progress Report)",
  "Laporan Kemajuan Triwulan (Quarterly Report)",
  "Laporan MC (Monthly Certificate / Opname)",
  "Laporan Akhir Pelaksanaan Proyek",
  "Laporan Deviasi & Recovery Plan",
  "Laporan PHO (Provisional Hand Over)",
];

const STATUS_PROYEK = [
  "On Schedule — sesuai rencana",
  "Ahead of Schedule — lebih cepat dari rencana",
  "Slightly Delayed — terlambat ringan (< 5%)",
  "Delayed — terlambat signifikan (5–15%)",
  "Critical Delay — terlambat kritis (> 15%)",
];

interface HasilLaporan {
  nomorLaporan: string;
  judulLaporan: string;
  periodeCaption: string;
  ringkasanEksekutif: string;
  deviasiBobotRencana: number;
  deviasiRealisasi: number;
  deviasi: number;
  statusTrafik: "Hijau" | "Kuning" | "Merah";
  kemajuanPekerjaan: { paket: string; bobotRencana: number; realisasi: number; deviasi: number; status: string; keterangan: string }[];
  kendalaUtama: { kendala: string; dampak: string; tindakan: string; picJabatan: string; deadline: string }[];
  pencapaianMingguIni: string[];
  rencanaMingguDepan: string[];
  isu: { no: number; isu: string; kategori: string; prioritas: string; rekomendasi: string }[];
  fotoDanDokumen: string[];
  penutup: string;
}

export default function GeneratorLaporanKemajuan() {
  const [jenisLaporan, setJenisLaporan] = useState(JENIS_LAPORAN[1]);
  const [namaProyek, setNamaProyek] = useState("");
  const [periode, setPeriode] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [statusProyek, setStatusProyek] = useState(STATUS_PROYEK[0]);
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilLaporan | null>(null);
  const [expanded, setExpanded] = useState<string | null>("kemajuan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-laporan-kemajuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisLaporan, namaProyek, periode, nilaiKontrak, statusProyek, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  const TRAFIK: Record<string, { bg: string; text: string; label: string }> = {
    Hijau: { bg: "bg-green-900/30 border-green-500/30", text: "text-green-300", label: "ON TRACK" },
    Kuning: { bg: "bg-yellow-900/30 border-yellow-500/30", text: "text-yellow-300", label: "PERLU PERHATIAN" },
    Merah: { bg: "bg-red-900/30 border-red-500/30", text: "text-red-300", label: "KRITIS" },
  };

  function copyReport() {
    if (!hasil) return;
    const txt = [
      hasil.judulLaporan,
      hasil.nomorLaporan,
      hasil.periodeCaption,
      "",
      "RINGKASAN EKSEKUTIF:",
      hasil.ringkasanEksekutif,
      "",
      `Progress Rencana: ${hasil.deviasiBobotRencana}% | Realisasi: ${hasil.deviasiRealisasi}% | Deviasi: ${hasil.deviasi}%`,
    ].join("\n");
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
              <FileBarChart2 className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Laporan Kemajuan Proyek (Progress Report)</h1>
              <p className="text-slate-400 text-sm">Generate LKP mingguan/bulanan/MC/PHO — ringkasan eksekutif, deviasi Kurva S, kendala, rencana tindak lanjut</p>
            </div>
            <Badge className="ml-auto bg-indigo-500/15 text-indigo-400 border-indigo-500/30">Gelombang 25</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Laporan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisLaporan} onChange={e => setJenisLaporan(e.target.value)}>
                {JENIS_LAPORAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Rawat Inap RSUD X" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Periode Laporan</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Juni 2025 / Minggu ke-24 / Triwulan II 2025" value={periode} onChange={e => setPeriode(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Kontrak (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Rp 12.500.000.000" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Status Proyek Saat Ini</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={statusProyek} onChange={e => setStatusProyek(e.target.value)}>
                {STATUS_PROYEK.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks / Kendala Khusus (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: hujan deras 2 minggu, material besi terlambat, ada perubahan desain" value={konteks} onChange={e => setKonteks(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading || !namaProyek.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun laporan...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Laporan Kemajuan</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun laporan kemajuan proyek...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-indigo-300 text-xs font-mono">{hasil.nomorLaporan}</div>
                <h2 className="text-white font-bold">{hasil.judulLaporan}</h2>
                <div className="text-slate-400 text-sm">{hasil.periodeCaption}</div>
              </div>
              <Button onClick={copyReport} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>

            <div className={`rounded-xl p-4 border ${TRAFIK[hasil.statusTrafik]?.bg}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-2xl font-bold ${TRAFIK[hasil.statusTrafik]?.text}`}>{hasil.deviasiRealisasi}%</div>
                <div>
                  <div className="text-white text-sm font-medium">Progress Realisasi</div>
                  <div className={`text-xs ${TRAFIK[hasil.statusTrafik]?.text}`}>{TRAFIK[hasil.statusTrafik]?.label} | Rencana: {hasil.deviasiBobotRencana}% | Deviasi: {hasil.deviasi > 0 ? "+" : ""}{hasil.deviasi}%</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm">{hasil.ringkasanEksekutif}</p>
            </div>

            {[
              {
                key: "kemajuan", label: "Kemajuan per Paket Pekerjaan",
                content: (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-max">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700/50">
                          <th className="text-left px-3 py-2">Paket Pekerjaan</th>
                          <th className="text-right px-3 py-2">Rencana (%)</th>
                          <th className="text-right px-3 py-2">Realisasi (%)</th>
                          <th className="text-right px-3 py-2">Deviasi</th>
                          <th className="text-left px-3 py-2">Status</th>
                          <th className="text-left px-3 py-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasil.kemajuanPekerjaan.map((k, i) => (
                          <tr key={i} className="border-b border-slate-800/50">
                            <td className="px-3 py-2 text-slate-200 font-medium">{k.paket}</td>
                            <td className="text-right px-3 py-2 text-slate-300">{k.bobotRencana}</td>
                            <td className="text-right px-3 py-2 text-indigo-300 font-bold">{k.realisasi}</td>
                            <td className={`text-right px-3 py-2 font-medium ${k.deviasi >= 0 ? "text-green-400" : "text-red-400"}`}>{k.deviasi > 0 ? "+" : ""}{k.deviasi}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${k.status === "On Track" ? "bg-green-900/30 text-green-300" : k.status === "Ahead" ? "bg-blue-900/30 text-blue-300" : "bg-red-900/30 text-red-300"}`}>{k.status}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-400 max-w-48">{k.keterangan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              },
              {
                key: "kendala", label: "Kendala & Tindak Lanjut",
                content: (
                  <div className="space-y-2">
                    {hasil.kendalaUtama.map((k, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-orange-300 text-xs font-medium">⚠ {k.kendala}</div>
                        <div className="text-red-300 text-xs">Dampak: {k.dampak}</div>
                        <div className="text-green-300 text-xs">Tindakan: {k.tindakan}</div>
                        <div className="text-slate-400 text-xs">{k.picJabatan} | Target: {k.deadline}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "rencana", label: "Pencapaian & Rencana",
                content: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-green-300 text-xs font-medium mb-1">Pencapaian Periode Ini</div>
                      <ul className="space-y-0.5">{hasil.pencapaianMingguIni.map((p, i) => <li key={i} className="text-slate-300 text-xs">✓ {p}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-blue-300 text-xs font-medium mb-1">Rencana Periode Berikutnya</div>
                      <ul className="space-y-0.5">{hasil.rencanaMingguDepan.map((r, i) => <li key={i} className="text-slate-300 text-xs">→ {r}</li>)}</ul>
                    </div>
                  </div>
                )
              },
            ].map(s => (
              <div key={s.key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggle(s.key)} className="w-full flex items-center justify-between px-5 py-3 text-white font-semibold hover:bg-slate-800/40 transition-colors">
                  <span>{s.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded === s.key ? "rotate-180" : ""}`} />
                </button>
                {expanded === s.key && <div className="px-5 pb-4">{s.content}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
