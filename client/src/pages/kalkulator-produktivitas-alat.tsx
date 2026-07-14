import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_ALAT = [
  {
    label: "Excavator (0.5–1.2 m³ bucket)",
    kapasitasBucket: 0.8,
    satuan: "m³/jam",
    faktorEfisiensi: 0.75,
    siklus: 0.4,
    faktorSwing: 1.0,
    kelas: "Excavator",
  },
  {
    label: "Bulldozer (D6/D7 setara)",
    kapasitasBucket: 3.5,
    satuan: "m³/jam",
    faktorEfisiensi: 0.80,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Bulldozer",
  },
  {
    label: "Motor Grader",
    kapasitasBucket: 0,
    satuan: "m²/jam",
    faktorEfisiensi: 0.80,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Grader",
  },
  {
    label: "Dump Truck 5–8 ton",
    kapasitasBucket: 5,
    satuan: "m³/ritasi",
    faktorEfisiensi: 0.85,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Truck",
  },
  {
    label: "Compactor / Vibro Roller",
    kapasitasBucket: 0,
    satuan: "m²/jam",
    faktorEfisiensi: 0.80,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Compactor",
  },
  {
    label: "Concrete Pump",
    kapasitasBucket: 0,
    satuan: "m³/jam",
    faktorEfisiensi: 0.75,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Pump",
  },
  {
    label: "Tower Crane (jangkauan 40m)",
    kapasitasBucket: 0,
    satuan: "siklus/jam",
    faktorEfisiensi: 0.80,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Crane",
  },
  {
    label: "Mobile Crane 25–50 ton",
    kapasitasBucket: 0,
    satuan: "siklus/jam",
    faktorEfisiensi: 0.75,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Crane",
  },
  {
    label: "Asphalt Finisher",
    kapasitasBucket: 0,
    satuan: "ton/jam",
    faktorEfisiensi: 0.80,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Asphalt",
  },
  {
    label: "Concrete Mixer Truck (7 m³)",
    kapasitasBucket: 7,
    satuan: "m³/ritasi",
    faktorEfisiensi: 0.90,
    siklus: 0,
    faktorSwing: 1.0,
    kelas: "Truck",
  },
];

const KONDISI_LAPANGAN = [
  { label: "Sangat Baik (akses mudah, tanah padat)", faktor: 1.0 },
  { label: "Baik (kondisi normal)", faktor: 0.90 },
  { label: "Sedang (beberapa hambatan)", faktor: 0.80 },
  { label: "Jelek (medan berat, berlumpur)", faktor: 0.65 },
  { label: "Sangat Jelek (medan ekstrem)", faktor: 0.50 },
];

interface HasilProduktivitas {
  alatLabel: string;
  produktivitasJam: number;
  produktivitasHari: number;
  produktivitasMinggu: number;
  satuan: string;
  jumlahHariUntukTarget: number;
  jumlahAlatUntukTarget: number;
  biayaOperasiJam: number;
  biayaPerUnit: number;
  catatan: string[];
}

export default function KalkulatorProduktivitasAlat() {
  const [jenisAlat, setJenisAlat] = useState(JENIS_ALAT[0].label);
  const [kondisi, setKondisi] = useState(KONDISI_LAPANGAN[1].label);
  const [jamKerjaHari, setJamKerjaHari] = useState(8);
  const [targetVolume, setTargetVolume] = useState(1000);
  const [jumlahAlat, setJumlahAlat] = useState(1);
  const [hargaSewa, setHargaSewa] = useState(500000);
  const [hasil, setHasil] = useState<HasilProduktivitas | null>(null);

  // Base productivity per jam (SNI referensi)
  const BASE_PRODUCTIVITY: Record<string, number> = {
    "Excavator (0.5–1.2 m³ bucket)": 60,
    "Bulldozer (D6/D7 setara)": 120,
    "Motor Grader": 2500,
    "Dump Truck 5–8 ton": 5, // per ritasi
    "Compactor / Vibro Roller": 3000,
    "Concrete Pump": 40,
    "Tower Crane (jangkauan 40m)": 10,
    "Mobile Crane 25–50 ton": 6,
    "Asphalt Finisher": 60,
    "Concrete Mixer Truck (7 m³)": 7, // per ritasi
  };

  function hitung() {
    const alat = JENIS_ALAT.find(a => a.label === jenisAlat);
    const kondisiData = KONDISI_LAPANGAN.find(k => k.label === kondisi);
    if (!alat || !kondisiData) return;

    const baseProduktivitas = BASE_PRODUCTIVITY[jenisAlat] ?? 50;
    const produktivitasJam = baseProduktivitas * alat.faktorEfisiensi * kondisiData.faktor;
    const produktivitasHari = produktivitasJam * jamKerjaHari;
    const produktivitasMinggu = produktivitasHari * 6;
    const totalProduksi = produktivitasHari * jumlahAlat;
    const jumlahHariUntukTarget = Math.ceil(targetVolume / totalProduksi);
    const jumlahAlatUntukTarget = Math.ceil(targetVolume / (produktivitasHari * 30)); // estimasi 30 hari
    const biayaOperasiJam = hargaSewa;
    const biayaPerUnit = (biayaOperasiJam * jamKerjaHari) / produktivitasHari;

    const catatan: string[] = [
      `Faktor efisiensi alat: ${(alat.faktorEfisiensi * 100).toFixed(0)}%`,
      `Faktor kondisi lapangan: ${(kondisiData.faktor * 100).toFixed(0)}%`,
      `Produktivitas teoritis: ${baseProduktivitas} ${alat.satuan} (SNI 7394:2008)`,
    ];
    if (kondisiData.faktor < 0.70) catatan.push("Perhatikan kondisi lapangan — faktor turun drastis. Pertimbangkan perawatan akses.");
    if (jumlahHariUntukTarget > 90) catatan.push("Target volume membutuhkan >90 hari. Tambah jumlah alat atau perpanjang jam kerja.");

    setHasil({ alatLabel: jenisAlat, produktivitasJam, produktivitasHari, produktivitasMinggu, satuan: alat.satuan, jumlahHariUntukTarget, jumlahAlatUntukTarget, biayaOperasiJam, biayaPerUnit, catatan });
  }

  const fmt = (n: number, d = 1) => n.toFixed(d);
  const fmtK = (n: number) => `Rp ${(n / 1000).toFixed(0)}rb`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-yellow-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"><Zap className="h-6 w-6 text-yellow-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Produktivitas Alat Berat</h1>
              <p className="text-slate-400 text-sm">Hitung output/jam, hari kerja untuk target volume, jumlah alat optimal, biaya per unit produksi — SNI 7394:2008</p>
            </div>
            <Badge className="ml-auto bg-yellow-500/15 text-yellow-400 border-yellow-500/30">Gelombang 27</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Jenis Alat Berat *</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={jenisAlat} onChange={e => setJenisAlat(e.target.value)}>
                {JENIS_ALAT.map(a => <option key={a.label} value={a.label}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Kondisi Lapangan</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={kondisi} onChange={e => setKondisi(e.target.value)}>
                {KONDISI_LAPANGAN.map(k => <option key={k.label} value={k.label}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Jam Kerja / Hari</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={jamKerjaHari} onChange={e => setJamKerjaHari(Number(e.target.value))}>
                {[7, 8, 9, 10].map(j => <option key={j} value={j}>{j} jam/hari</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Volume / Pekerjaan</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={targetVolume} onChange={e => setTargetVolume(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Jumlah Alat (unit)</label>
              <input type="number" min="1" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={jumlahAlat} onChange={e => setJumlahAlat(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Harga Sewa (Rp/jam)</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={hargaSewa} onChange={e => setHargaSewa(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={hitung} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold">Hitung Produktivitas</Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {hasil && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Produktivitas / Jam", value: `${fmt(hasil.produktivitasJam)} ${hasil.satuan.replace("/jam", "")}`, color: "text-yellow-300" },
                { label: "Produktivitas / Hari", value: `${fmt(hasil.produktivitasHari)} ${hasil.satuan.replace("/jam", "")}`, color: "text-yellow-300" },
                { label: "Hari untuk Target", value: `${hasil.jumlahHariUntukTarget} hari`, color: `${hasil.jumlahHariUntukTarget > 60 ? "text-orange-300" : "text-green-300"}` },
                { label: "Biaya / Unit Produksi", value: fmtK(hasil.biayaPerUnit), color: "text-blue-300" },
              ].map(c => (
                <div key={c.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                  <div className={`font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-slate-400">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-slate-200 font-medium text-sm mb-3">Rencana Penggunaan Alat</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-800/40 rounded p-2"><div className="text-yellow-300 font-bold">{jumlahAlat} unit</div><div className="text-xs text-slate-400">Alat digunakan</div></div>
                <div className="bg-slate-800/40 rounded p-2"><div className="text-blue-300 font-bold">{fmt(hasil.produktivitasHari * jumlahAlat)} {hasil.satuan.replace("/jam", "")}</div><div className="text-xs text-slate-400">Output / hari ({jumlahAlat} unit)</div></div>
                <div className="bg-slate-800/40 rounded p-2"><div className="text-green-300 font-bold">{hasil.jumlahHariUntukTarget} hari</div><div className="text-xs text-slate-400">Untuk target {targetVolume.toLocaleString()} {hasil.satuan.split("/")[0]}</div></div>
                <div className="bg-slate-800/40 rounded p-2"><div className="text-orange-300 font-bold">{fmt(hasil.produktivitasMinggu)} {hasil.satuan.replace("/jam", "")}</div><div className="text-xs text-slate-400">Output / minggu (6 hari)</div></div>
                <div className="bg-slate-800/40 rounded p-2"><div className="text-slate-200 font-bold">Rp {((hargaSewa * jamKerjaHari * jumlahAlat) / 1000000).toFixed(1)} Jt</div><div className="text-xs text-slate-400">Biaya sewa / hari</div></div>
                <div className="bg-slate-800/40 rounded p-2"><div className="text-slate-200 font-bold">Rp {((hargaSewa * jamKerjaHari * jumlahAlat * hasil.jumlahHariUntukTarget) / 1000000).toFixed(1)} Jt</div><div className="text-xs text-slate-400">Est. total biaya sewa</div></div>
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400 space-y-0.5">
              {hasil.catatan.map((c, i) => <div key={i}>• {c}</div>)}
              <div className="text-slate-500 mt-1">Referensi: SNI 7394:2008 Tata Cara Perhitungan Harga Satuan Pekerjaan Beton</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
