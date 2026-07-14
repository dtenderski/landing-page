import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, ChevronLeft, TrendingUp, TrendingDown, AlertTriangle, Info, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

type BulanData = { bulan: number; label: string; progres: number; cashIn: number; cashOut: number; netCashflow: number; kumulatif: number };

export default function KalkulatorCashflowProyek() {
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [uangMuka, setUangMuka] = useState("10");
  const [termin, setTermin] = useState("30");
  const [durasiProyek, setDurasiProyek] = useState("12");
  const [overheadPersen, setOverheadPersen] = useState("8");
  const [retensi, setRetensi] = useState("5");
  const [distribusiPola, setDistribusiPola] = useState("normal-s");
  const [hasil, setHasil] = useState<{ bulanan: BulanData[]; ringkasan: { peakDefisit: number; bulanPeakDefisit: number; totalCashIn: number; totalCashOut: number; maxKumulatif: number; breakEvenBulan: number | null } } | null>(null);

  function generateSCurve(n: number, pola: string): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      let v: number;
      if (pola === "normal-s") { v = 1 / (1 + Math.exp(-10 * (t - 0.5))); }
      else if (pola === "front-loaded") { v = Math.pow(t, 0.5); }
      else if (pola === "back-loaded") { v = Math.pow(t, 2); }
      else { v = t; }
      arr.push(v);
    }
    const first = arr[0], last = arr[arr.length - 1];
    return arr.map(v => (v - first) / (last - first));
  }

  function hitung() {
    const NK = parseFloat(nilaiKontrak.replace(/[.,Rp\s]/g, "")) || 0;
    if (!NK) return;
    const UM = parseFloat(uangMuka) / 100;
    const T = parseFloat(termin);
    const N = parseInt(durasiProyek);
    const OH = parseFloat(overheadPersen) / 100;
    const RET = parseFloat(retensi) / 100;

    const cumPct = generateSCurve(N, distribusiPola);
    const progPerBulan: number[] = [cumPct[0]];
    for (let i = 1; i < N; i++) progPerBulan.push(cumPct[i] - cumPct[i - 1]);

    const bulanan: BulanData[] = [];
    let kumul = 0;

    for (let i = 0; i < N; i++) {
      const bulan = i + 1;
      const label = `Bln ${bulan}`;
      const progres = progPerBulan[i];

      // Cash IN: uang muka bulan 1, termin pembayaran setelah progres tertentu
      let cashIn = 0;
      if (i === 0) cashIn += NK * UM; // uang muka

      // Termin dibayar setiap T% progres (kumulatif)
      const prevCum = i > 0 ? cumPct[i - 1] : 0;
      const curCum = cumPct[i];
      const terminPct = T / 100;
      const prevTermin = Math.floor(prevCum / terminPct);
      const curTermin = Math.floor(curCum / terminPct);
      if (curTermin > prevTermin) {
        const terminValue = NK * terminPct * (1 - RET);
        cashIn += terminValue * (curTermin - prevTermin);
      }

      // Bulan terakhir: bayar retensi
      if (i === N - 1) cashIn += NK * RET;

      // Cash OUT: biaya langsung + overhead
      const biayaLangsung = NK * progres * (1 - OH);
      const overhead = NK * (1 / N) * OH;
      const cashOut = biayaLangsung + overhead;

      const net = cashIn - cashOut;
      kumul += net;
      bulanan.push({ bulan, label, progres: progres * 100, cashIn, cashOut, netCashflow: net, kumulatif: kumul });
    }

    const peakDefisit = Math.min(...bulanan.map(b => b.kumulatif));
    const bulanPeakDefisit = bulanan.findIndex(b => b.kumulatif === peakDefisit) + 1;
    const totalCashIn = bulanan.reduce((a, b) => a + b.cashIn, 0);
    const totalCashOut = bulanan.reduce((a, b) => a + b.cashOut, 0);
    const maxKumulatif = Math.max(...bulanan.map(b => b.kumulatif));
    const breakEvenIdx = bulanan.findIndex(b => b.kumulatif >= 0);
    const breakEvenBulan = breakEvenIdx >= 0 ? breakEvenIdx + 1 : null;

    setHasil({ bulanan, ringkasan: { peakDefisit, bulanPeakDefisit, totalCashIn, totalCashOut, maxKumulatif, breakEvenBulan } });
  }

  function fmt(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${n < 0 ? "-" : ""}Rp ${(abs / 1e9).toFixed(1)}M`;
    if (abs >= 1e6) return `${n < 0 ? "-" : ""}Rp ${(abs / 1e6).toFixed(0)}jt`;
    return `${n < 0 ? "-" : ""}Rp ${Math.round(abs).toLocaleString("id")}`;
  }

  const maxOut = hasil ? Math.max(...hasil.bulanan.map(b => b.cashOut)) : 1;
  const maxIn = hasil ? Math.max(...hasil.bulanan.map(b => b.cashIn)) : 1;
  const maxBar = Math.max(maxOut, maxIn);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10"><BarChart3 className="h-6 w-6 text-emerald-400" /></div>
          <div><h1 className="text-2xl font-bold">Kalkulator Cashflow Proyek Konstruksi</h1><p className="text-slate-400 text-sm">Proyeksi cashflow bulanan — defisit puncak, titik impas, kebutuhan kredit</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Gelombang 16</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">Frontend</Badge></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-700 p-5 space-y-4">
            <h2 className="font-semibold text-white">Parameter Proyek</h2>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Nilai Kontrak (Rp)</Label>
              <Input placeholder="cth: 50000000000" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Uang Muka (%)</Label>
              <Select value={uangMuka} onValueChange={setUangMuka}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["0","5","10","15","20","25","30"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Progres per Termin (%)</Label>
              <Select value={termin} onValueChange={setTermin}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["10","20","25","30","50"].map(v => <SelectItem key={v} value={v}>Setiap {v}% progres</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Durasi Proyek (bulan)</Label>
              <Select value={durasiProyek} onValueChange={setDurasiProyek}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["6","9","12","18","24","30","36"].map(v => <SelectItem key={v} value={v}>{v} bulan</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Overhead & Profit (%)</Label>
              <Select value={overheadPersen} onValueChange={setOverheadPersen}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["5","8","10","12","15"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Retensi (%)</Label>
              <Select value={retensi} onValueChange={setRetensi}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["0","3","5","10"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300 text-sm">Pola Distribusi Pekerjaan</Label>
              <Select value={distribusiPola} onValueChange={setDistribusiPola}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal-s">Kurva-S Normal</SelectItem>
                  <SelectItem value="front-loaded">Front-Loaded (cepat awal)</SelectItem>
                  <SelectItem value="back-loaded">Back-Loaded (cepat akhir)</SelectItem>
                  <SelectItem value="linear">Linear (merata)</SelectItem>
                </SelectContent></Select></div>
            <Button onClick={hitung} disabled={!nilaiKontrak} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Hitung Cashflow</Button>
          </Card>

          <div className="md:col-span-2 space-y-4">
            {hasil ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-slate-900 border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-400 mb-1">Defisit Puncak</div>
                    <div className={`font-bold text-sm ${hasil.ringkasan.peakDefisit < 0 ? "text-red-400" : "text-emerald-400"}`}>{fmt(hasil.ringkasan.peakDefisit)}</div>
                    <div className="text-xs text-slate-500">Bulan {hasil.ringkasan.bulanPeakDefisit}</div>
                  </Card>
                  <Card className="bg-slate-900 border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-400 mb-1">Break Even</div>
                    <div className="font-bold text-sm text-blue-400">{hasil.ringkasan.breakEvenBulan ? `Bulan ${hasil.ringkasan.breakEvenBulan}` : "Tidak Tercapai"}</div>
                  </Card>
                  <Card className="bg-slate-900 border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-400 mb-1">Total Cash In</div>
                    <div className="font-bold text-sm text-emerald-400">{fmt(hasil.ringkasan.totalCashIn)}</div>
                  </Card>
                  <Card className="bg-slate-900 border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-400 mb-1">Total Cash Out</div>
                    <div className="font-bold text-sm text-amber-400">{fmt(hasil.ringkasan.totalCashOut)}</div>
                  </Card>
                </div>

                {hasil.ringkasan.peakDefisit < 0 && (
                  <Card className="bg-red-500/10 border-red-500/30 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">Proyek membutuhkan pembiayaan/kredit kerja minimal <strong>{fmt(Math.abs(hasil.ringkasan.peakDefisit))}</strong> sekitar bulan ke-{hasil.ringkasan.bulanPeakDefisit}. Siapkan fasilitas kredit atau negosiasi skema pembayaran.</p>
                  </Card>
                )}

                <Card className="bg-slate-900 border-slate-700 p-4">
                  <h3 className="font-semibold text-white mb-3 text-sm">Cashflow per Bulan</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-slate-700 text-slate-400">
                        <th className="pb-2 pr-2 text-left">Bln</th>
                        <th className="pb-2 pr-2 text-right">Progres</th>
                        <th className="pb-2 pr-2 text-right">Cash In</th>
                        <th className="pb-2 pr-2 text-right">Cash Out</th>
                        <th className="pb-2 pr-2 text-right">Net</th>
                        <th className="pb-2 text-right">Kumulatif</th>
                      </tr></thead>
                      <tbody>{hasil.bulanan.map(b => (
                        <tr key={b.bulan} className={`border-b border-slate-800 ${b.kumulatif < 0 ? "bg-red-500/5" : ""}`}>
                          <td className="py-1.5 pr-2 text-slate-400">{b.label}</td>
                          <td className="py-1.5 pr-2 text-right text-slate-300">{b.progres.toFixed(1)}%</td>
                          <td className="py-1.5 pr-2 text-right text-emerald-400">{fmt(b.cashIn)}</td>
                          <td className="py-1.5 pr-2 text-right text-amber-400">{fmt(b.cashOut)}</td>
                          <td className={`py-1.5 pr-2 text-right font-medium ${b.netCashflow >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(b.netCashflow)}</td>
                          <td className={`py-1.5 text-right font-bold ${b.kumulatif >= 0 ? "text-blue-400" : "text-red-400"}`}>{fmt(b.kumulatif)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </Card>

                <Button variant="outline" onClick={() => setHasil(null)} className="border-slate-600 text-slate-300 w-full"><RotateCcw className="h-4 w-4 mr-2" />Hitung Ulang</Button>
              </>
            ) : (
              <Card className="bg-slate-900 border-slate-700 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <BarChart3 className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400">Isi parameter di kiri, lalu klik <strong className="text-white">Hitung Cashflow</strong> untuk proyeksi arus kas bulanan beserta titik defisit puncak dan kebutuhan kredit.</p>
              </Card>
            )}
          </div>
        </div>
        <Card className="bg-slate-800/50 border-slate-700 p-4 mt-6">
          <p className="text-xs text-slate-400"><Info className="h-3 w-3 inline mr-1" /><strong className="text-slate-300">Asumsi model:</strong> Cash Out diasumsikan proporsional terhadap progres + overhead rata/bulan. Cash In: uang muka bulan 1, termin dibayar setiap progres mencapai threshold, retensi dibayar akhir proyek. Sesuaikan dengan ketentuan kontrak aktual.</p>
        </Card>
      </div>
    </div>
  );
}
