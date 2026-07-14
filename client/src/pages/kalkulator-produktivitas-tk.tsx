import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gauge, ChevronLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type Hasil = {
  produktivitasAktual: number;
  produktivitasStandar: number;
  efisiensi: number;
  volumePerHari: number;
  proyeksiHari: number;
  status: string;
  rekomendasi: string[];
};

const PEKERJAAN_DATA: Record<string, { satuan: string; standar: number; unit: string }> = {
  "Pekerjaan Beton (cor manual)": { satuan: "m³", standar: 1.0, unit: "m³/orang/hari" },
  "Pekerjaan Beton (cor pompa)": { satuan: "m³", standar: 3.5, unit: "m³/orang/hari" },
  "Bekisting (pasang)": { satuan: "m²", standar: 8.0, unit: "m²/orang/hari" },
  "Pembesian / Penulangan": { satuan: "kg", standar: 70, unit: "kg/orang/hari" },
  "Pasangan Bata (1 bata)": { satuan: "m²", standar: 5.0, unit: "m²/orang/hari" },
  "Plester dinding": { satuan: "m²", standar: 10.0, unit: "m²/orang/hari" },
  "Keramik lantai": { satuan: "m²", standar: 6.0, unit: "m²/orang/hari" },
  "Pengecatan (1 lapis)": { satuan: "m²", standar: 25.0, unit: "m²/orang/hari" },
  "Galian tanah (manual)": { satuan: "m³", standar: 2.5, unit: "m³/orang/hari" },
  "Urugan & Pemadatan (alat)": { satuan: "m³", standar: 150, unit: "m³/alat/hari" },
  "Pemasangan Baja (konstruksi)": { satuan: "kg", standar: 50, unit: "kg/orang/hari" },
  "Waterproofing": { satuan: "m²", standar: 20.0, unit: "m²/orang/hari" },
};

export default function KalkulatorProduktivitasTK() {
  const [jenis, setJenis] = useState("Pekerjaan Beton (cor manual)");
  const [volume, setVolume] = useState("");
  const [jumlahPekerja, setJumlahPekerja] = useState("");
  const [jamKerja, setJamKerja] = useState("8");
  const [hariKerja, setHariKerja] = useState("");
  const [faktorCuaca, setFaktorCuaca] = useState("1.0");
  const [faktorPengalaman, setFaktorPengalaman] = useState("1.0");
  const [hasil, setHasil] = useState<Hasil | null>(null);

  function hitung() {
    const vol = parseFloat(volume);
    const pekerja = parseFloat(jumlahPekerja);
    const jam = parseFloat(jamKerja);
    const hari = parseFloat(hariKerja) || 0;
    const cuaca = parseFloat(faktorCuaca);
    const pengalaman = parseFloat(faktorPengalaman);
    if (!vol || !pekerja || !jam) return;

    const data = PEKERJAAN_DATA[jenis];
    const standarHarian = data.standar * (jam / 8) * cuaca * pengalaman;
    const volumePerHari = pekerja * standarHarian;
    const proyeksiHari = Math.ceil(vol / volumePerHari);
    const produktivitasAktual = hari > 0 ? vol / (pekerja * hari) : volumePerHari / pekerja;
    const efisiensi = (produktivitasAktual / data.standar) * 100;

    let status = "Optimal";
    if (efisiensi < 60) status = "Sangat Rendah";
    else if (efisiensi < 80) status = "Di Bawah Standar";
    else if (efisiensi < 95) status = "Cukup";
    else if (efisiensi <= 110) status = "Optimal";
    else status = "Di Atas Standar";

    const rekomendasi: string[] = [];
    if (efisiensi < 80) rekomendasi.push("Evaluasi kecukupan alat bantu dan material di lapangan");
    if (efisiensi < 80) rekomendasi.push("Cek apakah terjadi bottleneck di proses kerja sebelumnya");
    if (parseFloat(faktorCuaca) < 0.85) rekomendasi.push("Pertimbangkan pekerjaan malam atau optimasi jadwal untuk hindari cuaca buruk");
    if (parseFloat(faktorPengalaman) < 0.85) rekomendasi.push("Sediakan supervisor lapangan / mandor berpengalaman untuk mentoring");
    if (jam < 8) rekomendasi.push("Evaluasi kemungkinan penambahan jam kerja jika diizinkan kontrak");
    if (proyeksiHari > 30) rekomendasi.push(`Pertimbangkan penambahan tenaga: +${Math.ceil(pekerja * 0.25)} orang dapat mempercepat ~25%`);
    if (rekomendasi.length === 0) rekomendasi.push("Pertahankan ritme kerja, monitor harian untuk konsistensi");
    rekomendasi.push(`Produktivitas optimal untuk ${jenis} adalah ${data.standar} ${data.unit}`);

    setHasil({ produktivitasAktual, produktivitasStandar: data.standar, efisiensi, volumePerHari, proyeksiHari, status, rekomendasi });
  }

  const statusColor = hasil ? (hasil.efisiensi >= 95 ? "text-emerald-400" : hasil.efisiensi >= 80 ? "text-yellow-400" : "text-red-400") : "";
  const efisiensiBar = hasil ? Math.min(hasil.efisiensi, 120) : 0;
  const data = PEKERJAAN_DATA[jenis];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-teal-500/10"><Gauge className="h-6 w-6 text-teal-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">Kalkulator Produktivitas Tenaga Kerja</h1>
            <p className="text-slate-400 text-sm">Hitung efisiensi kerja vs standar SNI — proyeksi penyelesaian pekerjaan</p>
          </div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-teal-400 border-teal-400/30">Gelombang 15</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">Frontend</Badge></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-white">Parameter Pekerjaan</h2>
            <div className="space-y-2"><Label className="text-slate-300">Jenis Pekerjaan</Label>
              <Select value={jenis} onValueChange={v=>{setJenis(v);setHasil(null);}}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(PEKERJAAN_DATA).map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
              <p className="text-xs text-slate-500">Standar SNI: {data.standar} {data.unit}</p></div>
            <div className="space-y-2"><Label className="text-slate-300">Volume Pekerjaan ({data.satuan})</Label>
              <Input type="number" placeholder={`cth: 250`} value={volume} onChange={e=>{setVolume(e.target.value);setHasil(null);}} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-slate-300">Jumlah Tenaga Kerja (orang)</Label>
              <Input type="number" placeholder="cth: 10" value={jumlahPekerja} onChange={e=>{setJumlahPekerja(e.target.value);setHasil(null);}} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-slate-300">Jam Kerja per Hari</Label>
              <Select value={jamKerja} onValueChange={v=>{setJamKerja(v);setHasil(null);}}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["6","7","8","9","10","12"].map(v=><SelectItem key={v} value={v}>{v} jam/hari</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300">Realisasi Hari Kerja (opsional)</Label>
              <Input type="number" placeholder="kosongkan jika belum ada realisasi" value={hariKerja} onChange={e=>{setHariKerja(e.target.value);setHasil(null);}} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-slate-300 text-xs">Faktor Cuaca</Label>
                <Select value={faktorCuaca} onValueChange={v=>{setFaktorCuaca(v);setHasil(null);}}><SelectTrigger className="bg-slate-800 border-slate-600 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1.0">Cerah (1.0)</SelectItem><SelectItem value="0.9">Berawan (0.9)</SelectItem><SelectItem value="0.8">Musim Hujan (0.8)</SelectItem><SelectItem value="0.7">Hujan Lebat (0.7)</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300 text-xs">Faktor Pengalaman</Label>
                <Select value={faktorPengalaman} onValueChange={v=>{setFaktorPengalaman(v);setHasil(null);}}><SelectTrigger className="bg-slate-800 border-slate-600 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1.1">Sangat Terampil (1.1)</SelectItem><SelectItem value="1.0">Terampil (1.0)</SelectItem><SelectItem value="0.9">Semi-Terampil (0.9)</SelectItem><SelectItem value="0.75">Tidak Terampil (0.75)</SelectItem></SelectContent></Select></div>
            </div>
            <Button onClick={hitung} disabled={!volume || !jumlahPekerja} className="w-full bg-teal-600 hover:bg-teal-700 text-white">Hitung Produktivitas</Button>
          </Card>

          {hasil ? (
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-4">Hasil Analisis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Status Efisiensi</span><span className={`font-bold ${statusColor}`}>{hasil.status}</span></div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400"><span>Efisiensi</span><span className={statusColor}>{hasil.efisiensi.toFixed(1)}%</span></div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${hasil.efisiensi >= 95 ? "bg-emerald-500" : hasil.efisiensi >= 80 ? "bg-yellow-500" : "bg-red-500"}`} style={{width:`${Math.min(efisiensiBar,100)}%`}}/></div>
                    <div className="flex justify-between text-xs text-slate-600"><span>0%</span><span>Standar SNI</span><span>120%</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-800 rounded-lg p-3 text-center"><div className="text-xs text-slate-400 mb-1">Produktivitas Aktual</div><div className="font-bold text-white">{hasil.produktivitasAktual.toFixed(2)}</div><div className="text-xs text-slate-500">{data.unit}</div></div>
                    <div className="bg-slate-800 rounded-lg p-3 text-center"><div className="text-xs text-slate-400 mb-1">Standar SNI</div><div className="font-bold text-slate-300">{hasil.produktivitasStandar}</div><div className="text-xs text-slate-500">{data.unit}</div></div>
                    <div className="bg-slate-800 rounded-lg p-3 text-center"><div className="text-xs text-slate-400 mb-1">Volume/Hari (tim)</div><div className="font-bold text-teal-400">{hasil.volumePerHari.toFixed(1)}</div><div className="text-xs text-slate-500">{data.satuan}/hari</div></div>
                    <div className="bg-slate-800 rounded-lg p-3 text-center"><div className="text-xs text-slate-400 mb-1">Proyeksi Selesai</div><div className="font-bold text-blue-400">{hasil.proyeksiHari}</div><div className="text-xs text-slate-500">hari kerja</div></div>
                  </div>
                </div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-teal-400" />Rekomendasi</h3>
                <ul className="space-y-2">{hasil.rekomendasi.map((r,i)=>(
                  <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-teal-400 flex-shrink-0 mt-0.5">•</span>{r}</li>
                ))}</ul>
              </Card>
              <Button variant="outline" onClick={()=>{setHasil(null);}} className="w-full border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-2"/>Hitung Ulang</Button>
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-700 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Gauge className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">Isi parameter di kiri, lalu klik <strong className="text-white">Hitung Produktivitas</strong> untuk melihat efisiensi dan proyeksi penyelesaian.</p>
            </Card>
          )}
        </div>

        <Card className="bg-slate-800/50 border-slate-700 p-4 mt-6">
          <p className="text-xs text-slate-400"><strong className="text-slate-300">Referensi Standar:</strong> SNI 7395:2008 (Koefisien Pekerjaan Tanah), SNI 03-2835 & 2836 (Pekerjaan Beton), SNI 03-6863 (Pekerjaan Baja). Faktor cuaca & pengalaman mengikuti AHSP Bidang Cipta Karya Kementerian PUPR.</p>
        </Card>
      </div>
    </div>
  );
}
