import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, TrendingUp, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK = [
  "Gedung Bertingkat (4–10 lantai)",
  "Gedung Tinggi (>10 lantai)",
  "Jalan & Perkerasan",
  "Jembatan",
  "Drainase & Irigasi",
  "Perumahan / Kluster",
  "Industri & Pabrik",
  "Renovasi Besar / Rehabilitasi",
  "Sipil Umum Lainnya",
];

const SATUAN_WAKTU = ["Minggu", "Bulan", "Hari"];

interface ItemPekerjaan {
  no: number;
  uraian: string;
  bobot: number;
  distribusi: number[];
}

interface HasilKurvaS {
  judulProyek: string;
  periodePelaporan: string;
  itemPekerjaan: ItemPekerjaan[];
  kumulatifRencana: number[];
  milestoneKritis: { periode: number; label: string; kumulatif: number }[];
  catatanPerencanaan: string;
}

export default function GeneratorKurvaS() {
  const [jenisProyek, setJenisProyek] = useState(JENIS_PROYEK[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [durasiTotal, setDurasiTotal] = useState("12");
  const [satuanWaktu, setSatuanWaktu] = useState(SATUAN_WAKTU[1]);
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [catatanKhusus, setCatatanKhusus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilKurvaS | null>(null);
  const [copied, setCopied] = useState(false);

  const durasi = Math.min(parseInt(durasiTotal) || 12, 24);

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/kurva-s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, namaProyek, durasiTotal: durasi, satuanWaktu, nilaiKontrak, catatanKhusus }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch {
      setHasil(null);
    } finally {
      setLoading(false);
    }
  }

  function copyCSV() {
    if (!hasil) return;
    const headers = ["No", "Uraian Pekerjaan", "Bobot (%)", ...Array.from({ length: durasi }, (_, i) => `${satuanWaktu} ${i + 1}`), "Total"].join(",");
    const rows = hasil.itemPekerjaan.map(item =>
      [item.no, `"${item.uraian}"`, item.bobot.toFixed(2), ...item.distribusi.map(d => d.toFixed(2)), item.distribusi.reduce((a, b) => a + b, 0).toFixed(2)].join(",")
    );
    const kumulatifRow = ["", "KUMULATIF RENCANA (%)", "", ...hasil.kumulatifRencana.map(k => k.toFixed(2)), ""].join(",");
    const csv = [headers, ...rows, kumulatifRow].join("\n");
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fmt = (n: number) => n.toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <TrendingUp className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Kurva S Proyek</h1>
              <p className="text-slate-400 text-sm">Generate Kurva S rencana: item pekerjaan, bobot, distribusi per periode, kumulatif, milestones</p>
            </div>
            <Badge className="ml-auto bg-indigo-500/15 text-indigo-400 border-indigo-500/30">Gelombang 21</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Proyek *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}>
                {JENIS_PROYEK.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Kantor 8 Lantai Kota Bandung" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Kontrak (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Rp 12,5 Miliar" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Durasi Total</label>
              <input type="number" min={2} max={24} className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={durasiTotal} onChange={e => setDurasiTotal(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Satuan Waktu</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={satuanWaktu} onChange={e => setSatuanWaktu(e.target.value)}>
                {SATUAN_WAKTU.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Catatan Khusus</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: fast track, musim hujan, dll" value={catatanKhusus} onChange={e => setCatatanKhusus(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading || !namaProyek.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Kurva S...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Kurva S</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun item pekerjaan & Kurva S…</p>
            <p className="text-slate-500 text-sm mt-1">Distribusi bobot per periode, kumulatif & milestones kritis</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">{hasil.judulProyek}</h2>
              <Button onClick={copyCSV} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin CSV!" : "Salin CSV"}
              </Button>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 pr-3 font-medium sticky left-0 bg-slate-900/60">No</th>
                    <th className="text-left py-2 pr-3 font-medium sticky left-6 bg-slate-900/60 min-w-[160px]">Uraian Pekerjaan</th>
                    <th className="text-right py-2 pr-3 font-medium">Bobot %</th>
                    {Array.from({ length: durasi }, (_, i) => (
                      <th key={i} className="text-right py-2 px-2 font-medium">{satuanWaktu.slice(0, 3)}-{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasil.itemPekerjaan.map(item => (
                    <tr key={item.no} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                      <td className="py-1.5 pr-3 text-slate-400">{item.no}</td>
                      <td className="py-1.5 pr-3 text-slate-300 font-medium">{item.uraian}</td>
                      <td className="text-right py-1.5 pr-3 text-indigo-300">{fmt(item.bobot)}</td>
                      {item.distribusi.map((d, i) => (
                        <td key={i} className="text-right py-1.5 px-2 text-slate-300">{d > 0 ? fmt(d) : "-"}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-indigo-500/40 bg-indigo-950/20">
                    <td className="py-2 pr-3 text-indigo-400 font-bold" colSpan={2}>KUMULATIF RENCANA (%)</td>
                    <td className="text-right pr-3 text-indigo-300 font-bold">100.00</td>
                    {hasil.kumulatifRencana.map((k, i) => (
                      <td key={i} className="text-right py-2 px-2 text-indigo-300 font-bold">{fmt(k)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-indigo-300 font-semibold mb-3">Milestone Kritis</h3>
                <div className="space-y-2">
                  {hasil.milestoneKritis.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                        <span className="text-slate-300 text-sm">{m.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-300 text-sm font-medium">{satuanWaktu} {m.periode}</span>
                        <span className="text-slate-400 text-xs ml-2">({fmt(m.kumulatif)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-indigo-300 font-semibold mb-3">Kurva S — Titik Kumulatif</h3>
                <div className="h-32 flex items-end gap-0.5">
                  {hasil.kumulatifRencana.map((k, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${satuanWaktu} ${i + 1}: ${fmt(k)}%`}>
                      <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: `${k}%`, minHeight: k > 0 ? "2px" : "0" }}></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-slate-500 text-xs mt-1">
                  <span>{satuanWaktu} 1</span>
                  <span>{satuanWaktu} {durasi}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
              <h3 className="text-indigo-300 font-semibold mb-2">Catatan Perencanaan</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{hasil.catatanPerencanaan}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
