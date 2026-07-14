import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ChevronLeft, Copy, CheckCircle, RotateCcw, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { Link } from "wouter";

type LaporanHSE = {
  header: { namaProyek: string; periode: string; hseOfficer: string; manHours: number };
  ringkasanKinerja: string;
  statistikK3: { label: string; nilai: string; satuan: string; trend: string }[];
  insidenDetail: { jenis: string; jumlah: number; kronologi: string; tindakLanjut: string }[];
  inspeksiHasil: { area: string; temuan: number; kategori: string; status: string }[];
  programK3: { program: string; realisasi: string; status: string; catatan: string }[];
  analisisRisiko: string;
  rekomendasi: string[];
  targetBulanDepan: string[];
  penutup: string;
};

export default function GeneratorLaporanHSE() {
  const [namaProyek, setNamaProyek] = useState("");
  const [periode, setPeriode] = useState("");
  const [hseOfficer, setHseOfficer] = useState("");
  const [manHours, setManHours] = useState("");
  const [jumlahPekerja, setJumlahPekerja] = useState("");
  const [insiden, setInsiden] = useState("0");
  const [hampirCelaka, setHampirCelaka] = useState("0");
  const [jumlahInspeksi, setJumlahInspeksi] = useState("");
  const [temuanTotal, setTemuanTotal] = useState("");
  const [temuanKritis, setTemuanKritis] = useState("0");
  const [programK3, setProgramK3] = useState("");
  const [kondisiUmum, setKondisiUmum] = useState("");
  const [laporan, setLaporan] = useState<LaporanHSE | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek || !periode || !manHours) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/generator-laporan-hse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaProyek, periode, hseOfficer, manHours, jumlahPekerja, insiden, hampirCelaka, jumlahInspeksi, temuanTotal, temuanKritis, programK3, kondisiUmum }),
      });
      setLaporan(await r.json());
    } catch { }
    setLoading(false);
  }

  function copyText() {
    if (!laporan) return;
    const lines = [`LAPORAN HSE BULANAN`, `Proyek: ${laporan.header.namaProyek}`, `Periode: ${laporan.header.periode}`, `HSE Officer: ${laporan.header.hseOfficer}`, `Man-Hours: ${laporan.header.manHours.toLocaleString("id")}`, "", "RINGKASAN:", laporan.ringkasanKinerja, "", "STATISTIK K3:"];
    laporan.statistikK3.forEach(s => lines.push(`${s.label}: ${s.nilai} ${s.satuan} (${s.trend})`));
    lines.push("", "REKOMENDASI:");
    laporan.rekomendasi.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-rose-500/10"><Activity className="h-6 w-6 text-rose-400" /></div>
          <div><h1 className="text-2xl font-bold">Generator Laporan HSE Bulanan</h1><p className="text-slate-400 text-sm">Input data K3 bulan ini → laporan HSE formal: statistik, insiden, inspeksi, rekomendasi</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-rose-400 border-rose-400/30">Gelombang 16</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!laporan ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nama Proyek</Label>
                <Input placeholder="cth: Pembangunan Gedung Kantor PLN Pusat Jakarta" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Periode Laporan</Label>
                <Input placeholder="cth: Mei 2026 / Juni 2026" value={periode} onChange={e => setPeriode(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">HSE Officer / Penanggung Jawab</Label>
                <Input placeholder="cth: Ir. Andi Pratama, SKK K3 Ahli Madya" value={hseOfficer} onChange={e => setHseOfficer(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Total Man-Hours Bulan Ini</Label>
                <Input type="number" placeholder="cth: 18500" value={manHours} onChange={e => setManHours(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Jumlah Tenaga Kerja Aktif</Label>
                <Input type="number" placeholder="cth: 120" value={jumlahPekerja} onChange={e => setJumlahPekerja(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Data Insiden & Kecelakaan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2"><Label className="text-xs text-slate-400">Kecelakaan Kerja</Label>
                  <Select value={insiden} onValueChange={setInsiden}><SelectTrigger className="bg-slate-800 border-slate-600 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{["0","1","2","3","4","5","6+"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-xs text-slate-400">Near Miss</Label>
                  <Select value={hampirCelaka} onValueChange={setHampirCelaka}><SelectTrigger className="bg-slate-800 border-slate-600 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{["0","1","2","3","4","5","6","7","8","9","10+"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-xs text-slate-400">Inspeksi K3</Label>
                  <Input type="number" placeholder="cth: 8" value={jumlahInspeksi} onChange={e => setJumlahInspeksi(e.target.value)} className="bg-slate-800 border-slate-600 text-white text-sm" /></div>
                <div className="space-y-2"><Label className="text-xs text-slate-400">Total Temuan</Label>
                  <Input type="number" placeholder="cth: 24" value={temuanTotal} onChange={e => setTemuanTotal(e.target.value)} className="bg-slate-800 border-slate-600 text-white text-sm" /></div>
              </div>
              <div className="mt-3"><Label className="text-xs text-slate-400">Temuan Kritis / Kategori A</Label>
                <Select value={temuanKritis} onValueChange={setTemuanKritis}><SelectTrigger className="bg-slate-800 border-slate-600 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["0","1","2","3","4","5"].map(v => <SelectItem key={v} value={v}>{v} temuan kritis</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Program K3 yang Dilaksanakan Bulan Ini</Label>
              <Textarea placeholder="cth:&#10;- Safety induction 4 batch (48 pekerja baru)&#10;- Tool box meeting setiap Senin pagi (4x)&#10;- Inspeksi APD bulanan&#10;- Simulasi evakuasi kebakaran&#10;- Pelatihan P3K untuk mandor" value={programK3} onChange={e => setProgramK3(e.target.value)} className="bg-slate-800 border-slate-600 text-white" rows={5} /></div>
            <div className="space-y-2"><Label className="text-slate-300">Kondisi / Isu Umum K3 (opsional)</Label>
              <Textarea placeholder="cth: Cuaca hujan lebat minggu ke-2 & 3 menyebabkan pekerjaan ketinggian dihentikan 3 hari. Ditemukan 2 pekerja subkon tidak memiliki APD standar dan sudah ditindak." value={kondisiUmum} onChange={e => setKondisiUmum(e.target.value)} className="bg-slate-800 border-slate-600 text-white" rows={3} /></div>
            <Button onClick={generate} disabled={loading || !namaProyek || !periode || !manHours} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
              {loading ? "Generating laporan HSE..." : "Generate Laporan HSE →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={() => setLaporan(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ubah Data</Button>
              <Button size="sm" onClick={copyText} className={`${copied ? "bg-rose-700" : "bg-rose-600 hover:bg-rose-700"} text-white`}>
                {copied ? <><CheckCircle className="h-3 w-3 mr-1" />Tersalin!</> : <><Copy className="h-3 w-3 mr-1" />Salin</>}
              </Button>
            </div>

            <Card className="bg-rose-500/5 border-rose-500/30 p-5">
              <h2 className="font-bold text-white text-lg mb-1">LAPORAN HSE BULANAN</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div><div className="text-xs text-slate-500">Proyek</div><div className="text-white font-medium">{laporan.header.namaProyek}</div></div>
                <div><div className="text-xs text-slate-500">Periode</div><div className="text-white">{laporan.header.periode}</div></div>
                <div><div className="text-xs text-slate-500">HSE Officer</div><div className="text-white">{laporan.header.hseOfficer || "-"}</div></div>
                <div><div className="text-xs text-slate-500">Man-Hours</div><div className="text-white font-bold">{laporan.header.manHours.toLocaleString("id")}</div></div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-2">Ringkasan Kinerja K3</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{laporan.ringkasanKinerja}</p>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {laporan.statistikK3.map((s, i) => (
                <Card key={i} className="bg-slate-900 border-slate-700 p-4 text-center">
                  <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                  <div className={`font-bold text-lg ${s.nilai === "0" || s.nilai === "0.00" ? "text-emerald-400" : "text-amber-400"}`}>{s.nilai}</div>
                  <div className="text-xs text-slate-500">{s.satuan}</div>
                  <div className={`text-xs mt-1 ${s.trend.includes("↓") || s.trend.includes("Nihil") ? "text-emerald-400" : s.trend.includes("↑") ? "text-red-400" : "text-slate-400"}`}>{s.trend}</div>
                </Card>
              ))}
            </div>

            {laporan.insidenDetail.length > 0 && (
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-400" />Detail Insiden</h3>
                <div className="space-y-3">{laporan.insidenDetail.map((ins, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex justify-between mb-2"><div className="font-medium text-white">{ins.jenis}</div><Badge variant="outline" className="text-rose-400 border-rose-400/30 text-xs">{ins.jumlah} kasus</Badge></div>
                    <p className="text-xs text-slate-400 mb-2">{ins.kronologi}</p>
                    <p className="text-xs text-emerald-300">✓ {ins.tindakLanjut}</p>
                  </div>
                ))}</div>
              </Card>
            )}

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-rose-400" />Hasil Inspeksi K3</h3>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-2 pr-3">Area / Lokasi</th><th className="pb-2 pr-3">Temuan</th><th className="pb-2 pr-3">Kategori</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>{laporan.inspeksiHasil.map((ins, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-2 pr-3 text-slate-300">{ins.area}</td>
                    <td className="py-2 pr-3 text-amber-400 font-medium">{ins.temuan}</td>
                    <td className="py-2 pr-3"><Badge variant="outline" className={`text-xs ${ins.kategori === "Kritis" ? "text-red-400 border-red-400/30" : ins.kategori === "Sedang" ? "text-amber-400 border-amber-400/30" : "text-slate-400 border-slate-600"}`}>{ins.kategori}</Badge></td>
                    <td className="py-2"><Badge variant="outline" className={`text-xs ${ins.status === "Closed" ? "text-emerald-400 border-emerald-400/30" : "text-amber-400 border-amber-400/30"}`}>{ins.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table></div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3">Program K3 Bulan Ini</h3>
              <div className="space-y-2">{laporan.programK3.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-800 last:border-0">
                  <div><div className="text-sm text-slate-300">{p.program}</div>{p.catatan && <div className="text-xs text-slate-500">{p.catatan}</div>}</div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-400">{p.realisasi}</div>
                    <Badge variant="outline" className={`text-xs mt-1 ${p.status === "Terlaksana" ? "text-emerald-400 border-emerald-400/30" : p.status === "Parsial" ? "text-amber-400 border-amber-400/30" : "text-red-400 border-red-400/30"}`}>{p.status}</Badge>
                  </div>
                </div>
              ))}</div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-2">Analisis Risiko</h3>
              <p className="text-sm text-slate-300">{laporan.analisisRisiko}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-rose-400" />Rekomendasi</h3>
                <ul className="space-y-2">{laporan.rekomendasi.map((r, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-rose-400 flex-shrink-0">{i + 1}.</span>{r}</li>)}</ul>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">Target Bulan Depan</h3>
                <ul className="space-y-2">{laporan.targetBulanDepan.map((t, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-emerald-400 flex-shrink-0">✓</span>{t}</li>)}</ul>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-700 p-4">
              <p className="text-sm text-slate-400 italic">{laporan.penutup}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
