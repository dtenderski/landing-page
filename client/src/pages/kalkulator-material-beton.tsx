import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ChevronLeft, Info, RotateCcw, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

type Hasil = { semen: number; pasir: number; kerikil: number; air: number; waterCement: number; nilaiSlump: string; kategoriMutu: string; keterangan: string; rekomendasi: string[] };

const MUTU_DATA: Record<string, { fc: number; label: string; semen: number; pasir: number; kerikil: number; wc: number; slump: string; kategori: string }> = {
  "K-175": { fc: 14.5, label: "K-175 (fc' 14.5 MPa)", semen: 276, pasir: 828, kerikil: 1012, wc: 0.57, slump: "6–18 cm", kategori: "Beton Struktural Ringan" },
  "K-200": { fc: 16.6, label: "K-200 (fc' 16.6 MPa)", semen: 299, pasir: 799, kerikil: 1017, wc: 0.55, slump: "6–18 cm", kategori: "Beton Struktural" },
  "K-225": { fc: 18.7, label: "K-225 (fc' 18.7 MPa)", semen: 325, pasir: 776, kerikil: 1022, wc: 0.52, slump: "7.5–15 cm", kategori: "Beton Struktural" },
  "K-250": { fc: 20.8, label: "K-250 (fc' 20.8 MPa)", semen: 352, pasir: 731, kerikil: 1031, wc: 0.50, slump: "7.5–15 cm", kategori: "Beton Struktural" },
  "K-300": { fc: 24.9, label: "K-300 (fc' 24.9 MPa)", semen: 413, pasir: 681, kerikil: 1021, wc: 0.46, slump: "7.5–15 cm", kategori: "Beton Struktural Tinggi" },
  "K-350": { fc: 29.05, label: "K-350 (fc' 29.0 MPa)", semen: 448, pasir: 632, kerikil: 1034, wc: 0.43, slump: "7.5–15 cm", kategori: "Beton Mutu Tinggi" },
  "K-400": { fc: 33.2, label: "K-400 (fc' 33.2 MPa)", semen: 480, pasir: 600, kerikil: 1035, wc: 0.40, slump: "9–15 cm", kategori: "Beton Mutu Tinggi" },
  "K-450": { fc: 37.35, label: "K-450 (fc' 37.4 MPa)", semen: 520, pasir: 575, kerikil: 1030, wc: 0.38, slump: "9–15 cm", kategori: "Beton Mutu Sangat Tinggi" },
  "K-500": { fc: 41.5, label: "K-500 (fc' 41.5 MPa)", semen: 560, pasir: 545, kerikil: 1025, wc: 0.35, slump: "10–15 cm", kategori: "Beton Mutu Sangat Tinggi" },
};

const FAKTOR_WASTE: Record<string, number> = { "Pengecoran Kolom": 1.03, "Pengecoran Balok": 1.03, "Pengecoran Pelat Lantai": 1.025, "Pengecoran Pondasi": 1.05, "Pengecoran Dinding": 1.035, "Pengecoran Precast": 1.015 };

export default function KalkulatorMaterialBeton() {
  const [mutu, setMutu] = useState("K-250");
  const [volume, setVolume] = useState("");
  const [jenisPekerjaan, setJenisPekerjaan] = useState("Pengecoran Pelat Lantai");
  const [satuanSemen, setSatuanSemen] = useState("sak");
  const [hasil, setHasil] = useState<Hasil | null>(null);

  function hitung() {
    const vol = parseFloat(volume);
    if (!vol || vol <= 0) return;
    const d = MUTU_DATA[mutu];
    const waste = FAKTOR_WASTE[jenisPekerjaan] ?? 1.03;
    const volEfektif = vol * waste;

    const semenKg = d.semen * volEfektif;
    const semenSak = semenKg / 50;
    const pasirKg = d.pasir * volEfektif;
    const kerikilKg = d.kerikil * volEfektif;
    const airLiter = semenKg * d.wc;

    const rekomendasi: string[] = [];
    if (d.fc >= 30) rekomendasi.push("Gunakan admixture superplasticizer untuk workability yang baik tanpa tambah air");
    if (d.fc >= 35) rekomendasi.push("Pertimbangkan penggunaan silica fume atau fly ash untuk kekuatan dan durabilitas optimal");
    rekomendasi.push(`Lakukan uji slump setiap kedatangan truk mixer — target: ${d.slump}`);
    rekomendasi.push("Curing minimal 7 hari dengan karung goni basah atau curing compound");
    if (vol > 20) rekomendasi.push("Untuk volume > 20 m³, koordinasikan jadwal pengiriman ready-mix agar sambungan cor < 30 menit");
    rekomendasi.push(`Faktor waste ${jenisPekerjaan}: ${((waste - 1) * 100).toFixed(1)}% sudah diperhitungkan dalam hasil`);

    const keterangan = `Mutu ${mutu} (${d.kategori}) — ${d.label} — Slump target: ${d.slump}. Mix design berdasarkan SNI 03-2834 & SNI 7656:2012 dengan koreksi faktor waste ${jenisPekerjaan}.`;

    setHasil({
      semen: satuanSemen === "sak" ? Math.ceil(semenSak) : Math.ceil(semenKg),
      pasir: Math.ceil(pasirKg / 1000 * 100) / 100,
      kerikil: Math.ceil(kerikilKg / 1000 * 100) / 100,
      air: Math.round(airLiter),
      waterCement: d.wc,
      nilaiSlump: d.slump,
      kategoriMutu: d.kategori,
      keterangan,
      rekomendasi,
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-teal-500/10"><Calculator className="h-6 w-6 text-teal-400" /></div>
          <div><h1 className="text-2xl font-bold">Kalkulator Kebutuhan Material Beton</h1><p className="text-slate-400 text-sm">K-175 hingga K-500 — semen, pasir, kerikil, air per volume pekerjaan + faktor waste</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-teal-400 border-teal-400/30">Gelombang 17</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">Frontend</Badge></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-white">Parameter Beton</h2>
            <div className="space-y-2"><Label className="text-slate-300">Mutu Beton</Label>
              <Select value={mutu} onValueChange={v => { setMutu(v); setHasil(null); }}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MUTU_DATA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
              <div className="bg-slate-800 rounded p-2 text-xs text-slate-400">
                <span className="text-teal-400 font-medium">{MUTU_DATA[mutu].kategori}</span> · W/C = {MUTU_DATA[mutu].wc} · Slump: {MUTU_DATA[mutu].slump}
              </div>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Volume Pekerjaan (m³)</Label>
              <Input type="number" placeholder="cth: 35.5" value={volume} onChange={e => { setVolume(e.target.value); setHasil(null); }} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-slate-300">Jenis Pekerjaan</Label>
              <Select value={jenisPekerjaan} onValueChange={v => { setJenisPekerjaan(v); setHasil(null); }}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(FAKTOR_WASTE).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300">Satuan Semen</Label>
              <Select value={satuanSemen} onValueChange={v => { setSatuanSemen(v); setHasil(null); }}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="sak">Sak (50 kg)</SelectItem><SelectItem value="kg">Kilogram (kg)</SelectItem></SelectContent></Select></div>
            <Button onClick={hitung} disabled={!volume || parseFloat(volume) <= 0} className="w-full bg-teal-600 hover:bg-teal-700 text-white">Hitung Kebutuhan Material</Button>
          </Card>

          {hasil ? (
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-1">Kebutuhan Material — {mutu}</h3>
                <p className="text-xs text-slate-500 mb-4">Volume: {volume} m³ · {jenisPekerjaan}</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <div><div className="text-sm text-slate-300">Semen Portland</div><div className="text-xs text-slate-500">Type I, 50 kg/sak</div></div>
                    <div className="text-right"><div className="font-bold text-teal-400 text-lg">{hasil.semen.toLocaleString("id")}</div><div className="text-xs text-slate-500">{satuanSemen === "sak" ? "sak" : "kg"}</div></div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <div><div className="text-sm text-slate-300">Pasir Beton</div><div className="text-xs text-slate-500">Pasir kasar bersih, FM 2.3–3.1</div></div>
                    <div className="text-right"><div className="font-bold text-amber-400 text-lg">{hasil.pasir.toFixed(2)}</div><div className="text-xs text-slate-500">ton</div></div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <div><div className="text-sm text-slate-300">Kerikil / Split</div><div className="text-xs text-slate-500">Agregat kasar, maks 20–25 mm</div></div>
                    <div className="text-right"><div className="font-bold text-slate-300 text-lg">{hasil.kerikil.toFixed(2)}</div><div className="text-xs text-slate-500">ton</div></div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <div><div className="text-sm text-slate-300">Air Bersih</div><div className="text-xs text-slate-500">pH 6–8, bebas minyak & lumpur</div></div>
                    <div className="text-right"><div className="font-bold text-blue-400 text-lg">{hasil.air.toLocaleString("id")}</div><div className="text-xs text-slate-500">liter</div></div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800 rounded p-2"><div className="text-xs text-slate-500">W/C Ratio</div><div className="text-sm font-bold text-white">{hasil.waterCement}</div></div>
                  <div className="bg-slate-800 rounded p-2"><div className="text-xs text-slate-500">Slump Target</div><div className="text-sm font-bold text-teal-400">{hasil.nilaiSlump}</div></div>
                  <div className="bg-slate-800 rounded p-2"><div className="text-xs text-slate-500">Kategori</div><div className="text-xs font-bold text-white">{hasil.kategoriMutu}</div></div>
                </div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 text-sm">Rekomendasi Pelaksanaan</h3>
                <ul className="space-y-2">{hasil.rekomendasi.map((r, i) => <li key={i} className="flex gap-2 text-xs text-slate-300"><span className="text-teal-400 flex-shrink-0">•</span>{r}</li>)}</ul>
              </Card>
              <Button variant="outline" onClick={() => setHasil(null)} className="w-full border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-2" />Hitung Ulang</Button>
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-700 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Calculator className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-sm">Isi parameter beton di kiri, lalu klik <strong className="text-white">Hitung Kebutuhan Material</strong>.</p>
              <div className="mt-4 flex items-start gap-2 text-left bg-slate-800 rounded-lg p-3">
                <Info className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400">Hasil sudah termasuk faktor waste sesuai jenis pekerjaan (SNI 03-2834 & SNI 7656:2012).</p>
              </div>
            </Card>
          )}
        </div>

        <Card className="bg-slate-800/50 border-slate-700 p-4 mt-6">
          <p className="text-xs text-slate-400 flex gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" /><span><strong className="text-slate-300">Catatan:</strong> Mix design ini berdasarkan SNI 03-2834 dan AHSP PUPR. Untuk proyek struktural penting, lakukan job mix formula (JMF) di laboratorium beton bersertifikat sebelum pelaksanaan. Mutu aktual dipengaruhi kualitas material, metode pemadatan, dan kondisi curing lapangan.</span></p>
        </Card>
      </div>
    </div>
  );
}
