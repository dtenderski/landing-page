import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ChevronLeft, Info, RotateCcw, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

type KomponenHarga = { nama: string; satuan: string; koefisien: number; hargaSatuan: number; total: number; kategori: "material" | "upah" | "alat" };
type HasilAHSP = { namaItem: string; satuan: string; komponenDetail: KomponenHarga[]; subTotalMaterial: number; subTotalUpah: number; subTotalAlat: number; overhead: number; hargaSatuanTotal: number; catatan: string };

const PEKERJAAN_AHSP = [
  { label: "Beton K-250 (per m³)", id: "beton-k250" },
  { label: "Pembesian (per kg)", id: "pembesian" },
  { label: "Bekisting Kolom (per m²)", id: "bekisting-kolom" },
  { label: "Pasangan Bata Merah (per m²)", id: "bata-merah" },
  { label: "Plester + Acian (per m²)", id: "plester-acian" },
  { label: "Keramik Lantai 60×60 (per m²)", id: "keramik-60" },
  { label: "Pengecatan Tembok (per m²)", id: "cat-tembok" },
  { label: "Pekerjaan Tanah Galian Manual (per m³)", id: "galian-manual" },
  { label: "Timbunan & Pemadatan (per m³)", id: "timbunan" },
  { label: "Pasang Atap Baja Ringan (per m²)", id: "atap-baja-ringan" },
];

const DEFAULT_KOMPONEN: Record<string, Omit<KomponenHarga, "total">[]> = {
  "beton-k250": [
    { nama: "Semen Portland 50kg", satuan: "sak", koefisien: 7.04, hargaSatuan: 62000, kategori: "material" },
    { nama: "Pasir Beton", satuan: "m³", koefisien: 0.731, hargaSatuan: 280000, kategori: "material" },
    { nama: "Batu Kerikil/Split", satuan: "m³", koefisien: 1.031, hargaSatuan: 320000, kategori: "material" },
    { nama: "Air", satuan: "liter", koefisien: 215, hargaSatuan: 50, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 1.65, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Batu", satuan: "OH", koefisien: 0.275, hargaSatuan: 150000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.028, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.083, hargaSatuan: 200000, kategori: "upah" },
    { nama: "Molen/Mixer", satuan: "jam", koefisien: 0.5, hargaSatuan: 85000, kategori: "alat" },
  ],
  "pembesian": [
    { nama: "Besi Beton SNI D10-D25", satuan: "kg", koefisien: 1.05, hargaSatuan: 13500, kategori: "material" },
    { nama: "Kawat Bendrat", satuan: "kg", koefisien: 0.015, hargaSatuan: 25000, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.07, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Besi", satuan: "OH", koefisien: 0.07, hargaSatuan: 150000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.007, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.004, hargaSatuan: 200000, kategori: "upah" },
  ],
  "bekisting-kolom": [
    { nama: "Kayu Meranti/Kamper", satuan: "m³", koefisien: 0.04, hargaSatuan: 3200000, kategori: "material" },
    { nama: "Kayu Balok 5/7", satuan: "m³", koefisien: 0.015, hargaSatuan: 3000000, kategori: "material" },
    { nama: "Plywood 9mm", satuan: "lembar", koefisien: 0.35, hargaSatuan: 145000, kategori: "material" },
    { nama: "Paku", satuan: "kg", koefisien: 0.4, hargaSatuan: 22000, kategori: "material" },
    { nama: "Minyak Bekisting", satuan: "liter", koefisien: 0.2, hargaSatuan: 18000, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.66, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Kayu", satuan: "OH", koefisien: 0.33, hargaSatuan: 150000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.033, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.033, hargaSatuan: 200000, kategori: "upah" },
  ],
  "bata-merah": [
    { nama: "Bata Merah (23×11×5cm)", satuan: "bh", koefisien: 70, hargaSatuan: 950, kategori: "material" },
    { nama: "Semen PC 50kg", satuan: "sak", koefisien: 0.163, hargaSatuan: 62000, kategori: "material" },
    { nama: "Pasir Pasang", satuan: "m³", koefisien: 0.048, hargaSatuan: 250000, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.3, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Batu", satuan: "OH", koefisien: 0.1, hargaSatuan: 150000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.01, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.015, hargaSatuan: 200000, kategori: "upah" },
  ],
  "plester-acian": [
    { nama: "Semen PC 50kg", satuan: "sak", koefisien: 0.215, hargaSatuan: 62000, kategori: "material" },
    { nama: "Pasir Pasang", satuan: "m³", koefisien: 0.024, hargaSatuan: 250000, kategori: "material" },
    { nama: "Air", satuan: "liter", koefisien: 7, hargaSatuan: 50, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.3, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Plester", satuan: "OH", koefisien: 0.15, hargaSatuan: 150000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.015, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.0075, hargaSatuan: 200000, kategori: "upah" },
  ],
  "keramik-60": [
    { nama: "Keramik 60×60 cm (polished)", satuan: "m²", koefisien: 1.05, hargaSatuan: 185000, kategori: "material" },
    { nama: "Semen PC 50kg", satuan: "sak", koefisien: 0.148, hargaSatuan: 62000, kategori: "material" },
    { nama: "Pasir Pasang", satuan: "m³", koefisien: 0.018, hargaSatuan: 250000, kategori: "material" },
    { nama: "Semen Warna (nat)", satuan: "kg", koefisien: 0.5, hargaSatuan: 18000, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.25, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Keramik", satuan: "OH", koefisien: 0.125, hargaSatuan: 150000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.0125, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.00625, hargaSatuan: 200000, kategori: "upah" },
  ],
  "cat-tembok": [
    { nama: "Cat Dasar/Alkali (galon 5kg)", satuan: "kg", koefisien: 0.2, hargaSatuan: 48000, kategori: "material" },
    { nama: "Cat Tembok Interior (galon)", satuan: "kg", koefisien: 0.26, hargaSatuan: 65000, kategori: "material" },
    { nama: "Ampelas", satuan: "lembar", koefisien: 0.1, hargaSatuan: 8000, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.02, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Cat", satuan: "OH", koefisien: 0.063, hargaSatuan: 140000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.006, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.003, hargaSatuan: 200000, kategori: "upah" },
  ],
  "galian-manual": [
    { nama: "Pekerja Galian", satuan: "OH", koefisien: 0.75, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.025, hargaSatuan: 200000, kategori: "upah" },
    { nama: "Cangkul & Sekop (sewa)", satuan: "hari", koefisien: 0.1, hargaSatuan: 15000, kategori: "alat" },
  ],
  "timbunan": [
    { nama: "Material Urugan Pilihan", satuan: "m³", koefisien: 1.2, hargaSatuan: 180000, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.5, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.05, hargaSatuan: 200000, kategori: "upah" },
    { nama: "Stamper/Compactor (sewa)", satuan: "jam", koefisien: 0.15, hargaSatuan: 250000, kategori: "alat" },
  ],
  "atap-baja-ringan": [
    { nama: "Baja Ringan (rangka atap sistem)", satuan: "m²", koefisien: 1.05, hargaSatuan: 95000, kategori: "material" },
    { nama: "Genteng Metal / Spandek", satuan: "m²", koefisien: 1.1, hargaSatuan: 85000, kategori: "material" },
    { nama: "Baut & Reng", satuan: "set", koefisien: 12, hargaSatuan: 1500, kategori: "material" },
    { nama: "Pekerja", satuan: "OH", koefisien: 0.25, hargaSatuan: 120000, kategori: "upah" },
    { nama: "Tukang Baja", satuan: "OH", koefisien: 0.25, hargaSatuan: 160000, kategori: "upah" },
    { nama: "Kepala Tukang", satuan: "OH", koefisien: 0.025, hargaSatuan: 175000, kategori: "upah" },
    { nama: "Mandor", satuan: "OH", koefisien: 0.025, hargaSatuan: 200000, kategori: "upah" },
  ],
};

export default function KalkulatorAHSP() {
  const [selectedPek, setSelectedPek] = useState("");
  const [volume, setVolume] = useState("1");
  const [overheadPct, setOverheadPct] = useState("15");
  const [komponen, setKomponen] = useState<KomponenHarga[]>([]);
  const [hasil, setHasil] = useState<HasilAHSP | null>(null);

  function loadTemplate(id: string) {
    const template = DEFAULT_KOMPONEN[id] ?? [];
    setKomponen(template.map(k => ({ ...k, total: k.koefisien * k.hargaSatuan })));
    setHasil(null);
  }

  function onSelectPek(id: string) { setSelectedPek(id); loadTemplate(id); }

  function updateKoef(i: number, v: string) {
    setKomponen(prev => { const n = [...prev]; n[i] = { ...n[i], koefisien: parseFloat(v) || 0, total: (parseFloat(v) || 0) * n[i].hargaSatuan }; return n; });
    setHasil(null);
  }
  function updateHarga(i: number, v: string) {
    setKomponen(prev => { const n = [...prev]; n[i] = { ...n[i], hargaSatuan: parseFloat(v) || 0, total: n[i].koefisien * (parseFloat(v) || 0) }; return n; });
    setHasil(null);
  }
  function removeKomp(i: number) { setKomponen(prev => prev.filter((_, j) => j !== i)); setHasil(null); }

  function hitung() {
    const namaItem = PEKERJAAN_AHSP.find(p => p.id === selectedPek)?.label ?? "Pekerjaan";
    const satuan = namaItem.includes("m³") ? "m³" : namaItem.includes("m²") ? "m²" : namaItem.includes("kg") ? "kg" : "unit";
    const komponenDetail = komponen.map(k => ({ ...k, total: k.koefisien * k.hargaSatuan }));
    const subTotalMaterial = komponenDetail.filter(k => k.kategori === "material").reduce((a, k) => a + k.total, 0);
    const subTotalUpah = komponenDetail.filter(k => k.kategori === "upah").reduce((a, k) => a + k.total, 0);
    const subTotalAlat = komponenDetail.filter(k => k.kategori === "alat").reduce((a, k) => a + k.total, 0);
    const subtotal = subTotalMaterial + subTotalUpah + subTotalAlat;
    const overhead = subtotal * (parseFloat(overheadPct) / 100);
    const hargaSatuanTotal = subtotal + overhead;
    setHasil({ namaItem, satuan, komponenDetail, subTotalMaterial, subTotalUpah, subTotalAlat, overhead, hargaSatuanTotal, catatan: "Berdasarkan AHSP PUPR 2022 & Permen PUPR No.1/2022. Sesuaikan harga satuan dengan HSPK daerah setempat." });
  }

  function fmt(n: number) { return `Rp ${Math.round(n).toLocaleString("id")}`; }
  const vol = parseFloat(volume) || 1;
  const katBadge: Record<string, string> = { material: "bg-blue-500/15 text-blue-400", upah: "bg-emerald-500/15 text-emerald-400", alat: "bg-amber-500/15 text-amber-400" };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10"><DollarSign className="h-6 w-6 text-amber-400" /></div>
          <div><h1 className="text-2xl font-bold">Kalkulator AHSP — Analisa Harga Satuan Pekerjaan</h1><p className="text-slate-400 text-sm">Template AHSP PUPR 2022 — koefisien material, upah, alat + overhead + volume pekerjaan</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-amber-400 border-amber-400/30">Gelombang 18</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">Frontend</Badge></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-700 p-5 space-y-4">
              <h2 className="font-semibold text-white text-sm">Parameter</h2>
              <div className="space-y-2"><Label className="text-slate-300 text-xs">Jenis Pekerjaan</Label>
                <Select value={selectedPek} onValueChange={onSelectPek}><SelectTrigger className="bg-slate-800 border-slate-600 text-sm"><SelectValue placeholder="Pilih pekerjaan..." /></SelectTrigger>
                  <SelectContent>{PEKERJAAN_AHSP.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300 text-xs">Volume Pekerjaan</Label>
                <Input type="number" placeholder="1" value={volume} onChange={e => { setVolume(e.target.value); setHasil(null); }} className="bg-slate-800 border-slate-600 text-white text-sm" /></div>
              <div className="space-y-2"><Label className="text-slate-300 text-xs">Overhead & Profit (%)</Label>
                <Select value={overheadPct} onValueChange={v => { setOverheadPct(v); setHasil(null); }}><SelectTrigger className="bg-slate-800 border-slate-600 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["5","10","12","15","18","20"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent></Select></div>
              <Button onClick={hitung} disabled={komponen.length === 0} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm">Hitung AHSP</Button>
            </Card>
            {hasil && (
              <Card className="bg-slate-900 border-slate-700 p-5 space-y-3">
                <h3 className="font-semibold text-white text-sm">Ringkasan (per satuan)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-blue-400">Material</span><span className="text-white font-medium">{fmt(hasil.subTotalMaterial)}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-400">Upah</span><span className="text-white font-medium">{fmt(hasil.subTotalUpah)}</span></div>
                  <div className="flex justify-between"><span className="text-amber-400">Alat</span><span className="text-white font-medium">{fmt(hasil.subTotalAlat)}</span></div>
                  <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-400">Overhead {overheadPct}%</span><span className="text-white">{fmt(hasil.overhead)}</span></div>
                  <div className="flex justify-between bg-amber-500/10 rounded p-2"><span className="text-amber-300 font-bold">Harga Satuan</span><span className="text-amber-400 font-bold">{fmt(hasil.hargaSatuanTotal)}</span></div>
                  <div className="flex justify-between bg-amber-500/20 rounded p-2"><span className="text-amber-300 font-bold">Total (×{vol})</span><span className="text-amber-400 font-bold">{fmt(hasil.hargaSatuanTotal * vol)}</span></div>
                </div>
              </Card>
            )}
          </div>

          <div className="md:col-span-2">
            {komponen.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <DollarSign className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm">Pilih jenis pekerjaan untuk memuat template AHSP koefisien material, upah, dan alat.</p>
                <div className="mt-3 flex items-start gap-2 text-left bg-slate-800 rounded p-3 max-w-sm">
                  <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">Koefisien berdasarkan AHSP PUPR 2022 & SNI. Edit harga satuan sesuai kondisi pasar lokal Anda.</p>
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-700 p-4">
                <h3 className="font-semibold text-white text-sm mb-3">Komponen Harga Satuan <span className="text-slate-500 font-normal">({PEKERJAAN_AHSP.find(p => p.id === selectedPek)?.label})</span></h3>
                <div className="space-y-2">
                  {komponen.map((k, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                      <div className="col-span-4 flex items-center gap-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${katBadge[k.kategori]}`}>{k.kategori[0].toUpperCase()}</span>
                        <span className="text-xs text-slate-300 leading-tight">{k.nama}</span>
                      </div>
                      <div className="col-span-1 text-xs text-slate-500 text-center">{k.satuan}</div>
                      <div className="col-span-2">
                        <Input type="number" value={k.koefisien} onChange={e => updateKoef(i, e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 px-2" />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" value={k.hargaSatuan} onChange={e => updateHarga(i, e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 px-2" />
                      </div>
                      <div className="col-span-1 text-xs text-amber-400 text-right">{fmt(k.koefisien * k.hargaSatuan)}</div>
                      <div className="col-span-1 flex justify-end"><button onClick={() => removeKomp(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button></div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
                  <Info className="h-3 w-3" />Edit koefisien & harga satuan, lalu klik Hitung AHSP. Kolom: Nama · Satuan · Koefisien · Harga Satuan · Total
                </div>
              </Card>
            )}
          </div>
        </div>
        <Card className="bg-slate-800/50 border-slate-700 p-4 mt-6">
          <p className="text-xs text-slate-400 flex gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" /><span>Koefisien berdasarkan AHSP PUPR 2022 & SNI Analisa Biaya. Harga satuan bahan & upah bervariasi per daerah — sesuaikan dengan HSPK (Harga Satuan Pokok Kegiatan) pemerintah daerah setempat atau survei pasar terkini.</span></p>
        </Card>
      </div>
    </div>
  );
}
