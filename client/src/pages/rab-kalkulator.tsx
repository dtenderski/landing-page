import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, Download, FileText, Loader2, RefreshCw, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

interface RabItem {
  no: number;
  uraian: string;
  satuan: string;
  volume: number;
  harga_satuan: number;
  jumlah: number;
  keterangan: string;
}

interface RabResult {
  proyek_estimasi: string;
  catatan_analisis: string;
  items: RabItem[];
  total: number;
  ppn_10: number;
  grand_total: number;
  asumsi: string[];
  peringatan: string[];
}

const CONTOH_CATATAN = [
  "Galian tanah biasa 5x10x1.5m, timbunan kembali 30%, pasang batu kali 40m2, plester semen 1:4 tebal 15mm, cat tembok 2 lapis 80m2",
  "Pekerjaan cor beton K-250 untuk plat lantai 6x8m tebal 12cm, tulangan D10-150 + D8-200, bekisting multiplex 18mm",
  "Pasang keramik 30x30 anti-slip 120m2, nat keramik putih, lis keramik 10x30 sekitar 45m, plin bawah 60m",
];

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

async function downloadPDF(result: RabResult) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RENCANA ANGGARAN BIAYA (RAB)", margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(result.proyek_estimasi, margin, y);
  y += 5;
  doc.text(result.catatan_analisis, margin, y);
  y += 7;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  const colWidths = [12, 80, 18, 18, 40, 42];
  const headers = ["No", "Uraian Pekerjaan", "Satuan", "Volume", "Harga Satuan (Rp)", "Jumlah (Rp)"];
  const colX = colWidths.reduce<number[]>((acc, w, i) => [...acc, (acc[i - 1] ?? margin) + (i === 0 ? 0 : colWidths[i - 1])], []);

  doc.setFillColor(245, 158, 11);
  doc.rect(margin, y, pageW - margin * 2, 7, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => doc.text(h, colX[i] + 2, y + 5));
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  result.items.forEach((item, idx) => {
    if (y > 175) { doc.addPage(); y = margin; }
    if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 1, pageW - margin * 2, 7, "F"); }
    doc.text(String(item.no), colX[0] + 2, y + 4);
    doc.text(doc.splitTextToSize(item.uraian, colWidths[1] - 3)[0], colX[1] + 2, y + 4);
    doc.text(item.satuan, colX[2] + 2, y + 4);
    doc.text(item.volume.toLocaleString("id-ID"), colX[3] + 2, y + 4);
    doc.text(new Intl.NumberFormat("id-ID").format(item.harga_satuan), colX[4] + 2, y + 4);
    doc.text(new Intl.NumberFormat("id-ID").format(item.jumlah), colX[5] + 2, y + 4);
    y += 7;
  });

  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  const totals = [
    ["Sub Total", result.total],
    ["PPN 11%", result.ppn_10],
  ];
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  totals.forEach(([label, val]) => {
    doc.text(String(label), pageW - margin - 80, y + 4);
    doc.text(new Intl.NumberFormat("id-ID").format(Number(val)), pageW - margin - 2, y + 4, { align: "right" });
    y += 7;
  });

  doc.setFillColor(245, 158, 11);
  doc.rect(pageW - margin - 100, y - 1, 100, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("GRAND TOTAL", pageW - margin - 98, y + 5);
  doc.text("Rp " + new Intl.NumberFormat("id-ID").format(result.grand_total), pageW - margin - 2, y + 5, { align: "right" });
  y += 14;

  if (result.asumsi.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 100, 180);
    doc.text("Asumsi Kalkulasi:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    result.asumsi.forEach(a => {
      if (y > 185) { doc.addPage(); y = margin; }
      doc.text("• " + a, margin + 2, y);
      y += 5;
    });
    y += 3;
  }

  if (result.peringatan.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(180, 80, 40);
    doc.text("Peringatan:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    result.peringatan.forEach(p => {
      if (y > 185) { doc.addPage(); y = margin; }
      doc.text("• " + p, margin + 2, y);
      y += 5;
    });
  }

  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("Dihasilkan oleh Gustafta AI · Estimasi berdasarkan AHSP umum · Verifikasi dengan HSP daerah setempat", margin, doc.internal.pageSize.getHeight() - 8);

  doc.save(`RAB_Estimasi_${Date.now()}.pdf`);
}

function downloadCSV(result: RabResult) {
  const rows = [
    ["No", "Uraian Pekerjaan", "Satuan", "Volume", "Harga Satuan (Rp)", "Jumlah (Rp)", "Keterangan"],
    ...result.items.map(i => [i.no, i.uraian, i.satuan, i.volume, i.harga_satuan, i.jumlah, i.keterangan]),
    [],
    ["", "", "", "", "Sub Total", result.total, ""],
    ["", "", "", "", "PPN 11%", result.ppn_10, ""],
    ["", "", "", "", "Grand Total", result.grand_total, ""],
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RAB_Estimasi_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RabKalkulator() {
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RabResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!catatan.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/rab-kalkulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menghasilkan RAB");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex-1" />
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1.5">
          <Calculator className="h-3.5 w-3.5" />
          RAB Kalkulator AI
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Calculator className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Kalkulator RAB Otomatis</h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Tempel catatan lapangan yang berantakan → AI langsung mengubahnya menjadi tabel RAB terstruktur dengan volume dan estimasi biaya.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">
                Catatan Pekerjaan / Field Notes
              </label>
              <Textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Tempel catatan lapangan Anda di sini... misal: galian tanah 10x5x1.5m, pasang batu kali 30m2, plester 1:4 tebal 15mm..."
                className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                data-testid="input-rab-catatan"
              />
              <p className="text-xs text-white/30 mt-1">
                {catatan.length} karakter · Bisa dalam bahasa Indonesia atau campuran
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !catatan.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
              data-testid="button-generate-rab"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menghitung RAB...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate RAB Sekarang</>
              )}
            </Button>

            <div>
              <p className="text-xs text-white/40 mb-2">Contoh catatan:</p>
              <div className="space-y-2">
                {CONTOH_CATATAN.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setCatatan(c)}
                    className="w-full text-left text-xs bg-white/3 hover:bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-white/50 hover:text-white/70 transition-colors"
                    data-testid={`button-contoh-${i}`}
                  >
                    {c.length > 100 ? c.slice(0, 100) + "…" : c}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
              <p className="text-xs text-amber-400/80 font-medium mb-1">⚠️ Disclaimer</p>
              <p className="text-xs text-white/40 leading-relaxed">
                Estimasi harga satuan berdasarkan AHSP umum. Verifikasi dengan HSP daerah setempat sebelum dijadikan penawaran resmi.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            {!result && !loading && !error && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center border border-white/8 rounded-2xl bg-white/2">
                <Calculator className="h-12 w-12 text-white/15 mb-3" />
                <p className="text-white/30 text-sm">Hasil RAB akan muncul di sini</p>
                <p className="text-white/20 text-xs mt-1">Masukkan catatan pekerjaan, lalu klik Generate</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center border border-white/8 rounded-2xl bg-white/2">
                <Loader2 className="h-10 w-10 text-amber-400 animate-spin mb-3" />
                <p className="text-white/60 text-sm">AI sedang menganalisis catatan...</p>
                <p className="text-white/30 text-xs mt-1">Menghitung volume & estimasi biaya</p>
              </div>
            )}

            {error && (
              <div className="border border-red-500/20 rounded-2xl bg-red-500/5 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
                <Button onClick={handleGenerate} variant="outline" size="sm" className="mt-3 gap-2 border-red-500/30 text-red-400">
                  <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
                </Button>
              </div>
            )}

            {result && (
              <div className="space-y-4" data-testid="result-rab">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white">{result.proyek_estimasi}</h2>
                    <p className="text-xs text-white/40 mt-0.5">{result.catatan_analisis}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={() => downloadPDF(result)}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-400/50"
                      data-testid="button-download-pdf"
                    >
                      <FileText className="h-3.5 w-3.5" /> PDF
                    </Button>
                    <Button
                      onClick={() => downloadCSV(result)}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-white/15 text-white/70 hover:text-white"
                      data-testid="button-download-csv"
                    >
                      <Download className="h-3.5 w-3.5" /> CSV
                    </Button>
                  </div>
                </div>

                <div className="border border-white/8 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-amber-500/10 border-b border-white/8">
                          <th className="px-3 py-2.5 text-left text-white/60 font-medium w-8">No</th>
                          <th className="px-3 py-2.5 text-left text-white/60 font-medium">Uraian Pekerjaan</th>
                          <th className="px-3 py-2.5 text-right text-white/60 font-medium w-16">Sat</th>
                          <th className="px-3 py-2.5 text-right text-white/60 font-medium w-16">Vol</th>
                          <th className="px-3 py-2.5 text-right text-white/60 font-medium">Harga Satuan</th>
                          <th className="px-3 py-2.5 text-right text-white/60 font-medium">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/3">
                            <td className="px-3 py-2 text-white/40">{item.no}</td>
                            <td className="px-3 py-2 text-white/80">
                              {item.uraian}
                              {item.keterangan && (
                                <span className="block text-white/30 text-[10px] mt-0.5">{item.keterangan}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-white/50">{item.satuan}</td>
                            <td className="px-3 py-2 text-right text-white/70">{item.volume.toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2 text-right text-white/60">{formatRupiah(item.harga_satuan)}</td>
                            <td className="px-3 py-2 text-right text-white font-medium">{formatRupiah(item.jumlah)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-white/10 bg-white/3">
                          <td colSpan={5} className="px-3 py-2 text-right text-white/50 text-xs font-medium">Sub Total</td>
                          <td className="px-3 py-2 text-right text-white font-semibold">{formatRupiah(result.total)}</td>
                        </tr>
                        <tr className="bg-white/2">
                          <td colSpan={5} className="px-3 py-2 text-right text-white/50 text-xs">PPN 11%</td>
                          <td className="px-3 py-2 text-right text-white/70">{formatRupiah(result.ppn_10)}</td>
                        </tr>
                        <tr className="border-t border-amber-500/30 bg-amber-500/5">
                          <td colSpan={5} className="px-3 py-3 text-right text-amber-400 font-bold text-sm">GRAND TOTAL</td>
                          <td className="px-3 py-3 text-right text-amber-400 font-bold text-sm">{formatRupiah(result.grand_total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {result.asumsi.length > 0 && (
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                    <p className="text-xs text-blue-400 font-medium mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Asumsi Kalkulasi
                    </p>
                    <ul className="space-y-1">
                      {result.asumsi.map((a, i) => (
                        <li key={i} className="text-xs text-white/50 flex gap-2">
                          <span className="text-blue-400/50 shrink-0">·</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.peringatan.length > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
                    <p className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Peringatan
                    </p>
                    <ul className="space-y-1">
                      {result.peringatan.map((p, i) => (
                        <li key={i} className="text-xs text-white/50 flex gap-2">
                          <span className="text-orange-400/50 shrink-0">·</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
