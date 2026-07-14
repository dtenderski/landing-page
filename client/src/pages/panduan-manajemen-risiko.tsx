import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertOctagon, ChevronLeft, RotateCcw, Shield, TrendingDown, BookOpen } from "lucide-react";
import { Link } from "wouter";

type RiskItem = { id: string; risiko: string; penyebab: string; dampak: string; kemungkinan: number; dampakNilai: number; levelRisiko: string; warna: string; penanggungjawab: string; mitigasi: string[]; kontingensi: string };
type RiskPlan = { ringkasan: string; risikoUtama: RiskItem[]; matriks: { baris: string; kolom: string; nilai: string; warna: string }[][]; prosedurEskalasi: string[]; reviewSchedule: string; tips: string[] };

const JENIS_PROYEK_RISIKO = ["Gedung Bertingkat (>5 lantai)","Jalan Nasional / Tol","Bendungan & Irigasi","Instalasi MEP Kompleks","Proyek Pertambangan","Konstruksi Lepas Pantai","Perumahan Skala Besar","Proyek EPCC / Turnkey","Rehabilitasi Infrastruktur","Pengadaan Alat Berat"];
const FASE_PROYEK = ["Pra-Konstruksi / Perencanaan","Mobilisasi & Setup Lapangan","Konstruksi Awal (0–30%)","Konstruksi Tengah (30–70%)","Konstruksi Akhir (70–100%)","Serah Terima & Commissioning","Seluruh Fase Proyek"];
const KATEGORI_RISIKO = ["Risiko Teknis (desain, spesifikasi, metode)","Risiko Keselamatan & K3","Risiko Keuangan (biaya, cashflow, eskalasi)","Risiko Jadwal & Keterlambatan","Risiko Kontraktual & Legal","Risiko Geoteknik & Alam","Risiko Lingkungan & Sosial","Risiko Rantai Pasok & Material"];

export default function PanduanManajemenRisiko() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [fase, setFase] = useState("");
  const [nilaiProyek, setNilaiProyek] = useState("");
  const [kategoriDipilih, setKategoriDipilih] = useState<string[]>([]);
  const [plan, setPlan] = useState<RiskPlan | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleKat(v: string) { setKategoriDipilih(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }

  async function generate() {
    if (!jenisProyek || !fase || kategoriDipilih.length === 0) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/panduan-manajemen-risiko", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, fase, nilaiProyek, kategoriDipilih }),
      });
      setPlan(await r.json());
    } catch { }
    setLoading(false);
  }

  const warnaBadge: Record<string, string> = { "Sangat Tinggi": "text-red-400 border-red-400/30", "Tinggi": "text-orange-400 border-orange-400/30", "Sedang": "text-amber-400 border-amber-400/30", "Rendah": "text-emerald-400 border-emerald-400/30" };
  const warnaBg: Record<string, string> = { "Sangat Tinggi": "bg-red-500", "Tinggi": "bg-orange-500", "Sedang": "bg-amber-500", "Rendah": "bg-emerald-500", "Sangat Rendah": "bg-blue-500" };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10"><AlertOctagon className="h-6 w-6 text-amber-400" /></div>
          <div><h1 className="text-2xl font-bold">Panduan Manajemen Risiko Proyek</h1><p className="text-slate-400 text-sm">Risk register, matriks 5×5, rencana mitigasi — ISO 31000 & PMBOK</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-amber-400 border-amber-400/30">Gelombang 17</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!plan ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Jenis Proyek</Label>
                <Select value={jenisProyek} onValueChange={setJenisProyek}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis proyek..." /></SelectTrigger>
                  <SelectContent>{JENIS_PROYEK_RISIKO.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Fase Proyek Saat Ini</Label>
                <Select value={fase} onValueChange={setFase}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih fase..." /></SelectTrigger>
                  <SelectContent>{FASE_PROYEK.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nilai Proyek (opsional)</Label>
                <Input placeholder="cth: Rp 150 Miliar" value={nilaiProyek} onChange={e => setNilaiProyek(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <div className="space-y-3"><Label className="text-slate-300">Kategori Risiko yang Ingin Dianalisis</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{KATEGORI_RISIKO.map(k => (
                <label key={k} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-500/40 cursor-pointer transition-colors">
                  <Checkbox checked={kategoriDipilih.includes(k)} onCheckedChange={() => toggleKat(k)} className="border-slate-500" />
                  <span className="text-sm text-slate-300">{k}</span>
                </label>
              ))}</div>
            </div>
            <Button onClick={generate} disabled={loading || !jenisProyek || !fase || kategoriDipilih.length === 0} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? "Generating risk register..." : "Generate Risk Register & Mitigasi →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <Button size="sm" variant="outline" onClick={() => setPlan(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ubah Parameter</Button>

            <Card className="bg-amber-500/5 border-amber-500/30 p-5">
              <p className="text-slate-200 text-sm leading-relaxed">{plan.ringkasan}</p>
            </Card>

            {/* Matriks Risiko 5x5 */}
            {plan.matriks && plan.matriks.length > 0 && (
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-amber-400" />Matriks Risiko 5×5</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr><th className="text-left pb-2 text-slate-400">Kemungkinan \ Dampak</th>
                      {["Tidak Berarti","Minor","Sedang","Mayor","Katastropik"].map(h => <th key={h} className="pb-2 text-center text-slate-400">{h}</th>)}
                    </tr></thead>
                    <tbody>{plan.matriks.map((baris, bi) => (
                      <tr key={bi}><td className="py-1.5 pr-3 text-slate-400 whitespace-nowrap">{["Sangat Jarang","Jarang","Kadang","Sering","Sangat Sering"][bi]}</td>
                        {baris.map((sel, ci) => (
                          <td key={ci} className="py-1.5 text-center"><div className={`mx-auto w-16 py-1 rounded text-white text-xs font-medium ${warnaBg[sel.warna] || "bg-slate-600"} opacity-80`}>{sel.nilai}</div></td>
                        ))}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Risk Register */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-400" />Risk Register ({plan.risikoUtama.length} risiko)</h3>
              {plan.risikoUtama.map((risk, i) => (
                <Card key={i} className={`border p-5 ${risk.warna === "Sangat Tinggi" ? "bg-red-500/5 border-red-500/30" : risk.warna === "Tinggi" ? "bg-orange-500/5 border-orange-500/30" : risk.warna === "Sedang" ? "bg-amber-500/5 border-amber-500/30" : "bg-slate-900 border-slate-700"}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-mono text-slate-500 flex-shrink-0 mt-0.5">{risk.id}</div>
                      <div><div className="font-medium text-white">{risk.risiko}</div><div className="text-xs text-slate-400 mt-0.5">Penyebab: {risk.penyebab}</div></div>
                    </div>
                    <Badge variant="outline" className={`flex-shrink-0 text-xs ${warnaBadge[risk.warna] || "text-slate-400 border-slate-600"}`}>{risk.levelRisiko}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Dampak: {risk.dampak}</p>
                  <div className="flex gap-3 mb-3 text-xs">
                    <div className="bg-slate-800 rounded px-2 py-1">Kemungkinan: <span className="text-white font-medium">{risk.kemungkinan}/5</span></div>
                    <div className="bg-slate-800 rounded px-2 py-1">Dampak: <span className="text-white font-medium">{risk.dampakNilai}/5</span></div>
                    <div className="bg-slate-800 rounded px-2 py-1">PIC: <span className="text-amber-400 font-medium">{risk.penanggungjawab}</span></div>
                  </div>
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-slate-400 mb-1">Rencana Mitigasi:</div>
                    <ul className="space-y-1">{risk.mitigasi.map((m, j) => <li key={j} className="text-xs text-slate-300 flex gap-2"><span className="text-amber-400 flex-shrink-0">•</span>{m}</li>)}</ul>
                  </div>
                  {risk.kontingensi && <div className="bg-slate-800/50 rounded p-2 text-xs text-slate-400"><strong className="text-white">Kontingensi:</strong> {risk.kontingensi}</div>}
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-400" />Prosedur Eskalasi</h3>
                <ol className="space-y-2">{plan.prosedurEskalasi.map((p, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-amber-400 flex-shrink-0 font-bold">{i + 1}.</span>{p}</li>)}</ol>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">Jadwal Review & Tips</h3>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mb-3 text-sm text-amber-200">{plan.reviewSchedule}</div>
                <ul className="space-y-1">{plan.tips.map((t, i) => <li key={i} className="text-xs text-slate-300 flex gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span>{t}</li>)}</ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
