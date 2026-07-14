import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, ChevronLeft, BookOpen, CheckSquare, DollarSign, Clock, Building2, Download } from "lucide-react";
import { Link } from "wouter";

type Panduan = {
  ringkasan: string;
  jalurSertifikasi: { nama: string; deskripsi: string; regulasi: string }[];
  persyaratan: { kategori: string; items: string[] }[];
  prosedur: { urutan: number; langkah: string; estimasiWaktu: string; keterangan: string }[];
  lembagaPenguji: { nama: string; jenis: string; layanan: string[] }[];
  estimasiBiaya: { komponen: string; kisaran: string }[];
  estimasiWaktu: string;
  tips: string[];
};

const JABATAN_MIGAS = [
  "Ahli Teknik Perminyakan (Reservoir)", "Ahli Teknik Pemboran", "Ahli Teknik Produksi",
  "Ahli Pipa & Fasilitas Produksi", "Ahli K3 Migas (Safety Officer Migas)", "Ahli Lindungan Lingkungan Migas",
  "Pengawas Operasi Migas", "Teknisi Instrumentasi Migas", "Ahli Geologi Eksplorasi",
  "Ahli Geofisika Seismik", "Ahli Gas & Distribusi (Hilir)", "Ahli Kilang (Refinery Engineer)",
  "Pengawas Instalasi Pipa Gas (PIPGAS)", "Ahli Sipil Konstruksi Migas", "Manajer Proyek Migas",
];

const PENGALAMAN_OPT = ["< 2 tahun", "2–5 tahun", "5–10 tahun", "> 10 tahun"];
const SUBSEKTOR_OPT = ["Hulu (Eksplorasi & Produksi)", "Pengolahan / Kilang", "Hilir (Distribusi & Niaga)", "Transmisi & Regasifikasi", "Konstruksi Fasilitas Migas"];

export default function PanduanSertifikasiMigas() {
  const [jabatan, setJabatan] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [subsektor, setSubsektor] = useState<string[]>([]);
  const [pendidikan, setPendidikan] = useState("S1 Teknik");
  const [panduan, setPanduan] = useState<Panduan | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSub(v: string) { setSubsektor(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }

  async function generate() {
    if (!jabatan || !pengalaman || subsektor.length === 0) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/panduan-sertifikasi-migas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, pengalaman, subsektor, pendidikan }),
      });
      setPanduan(await r.json());
    } catch { }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10"><Award className="h-6 w-6 text-amber-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">Panduan Sertifikasi Tenaga Ahli Migas</h1>
            <p className="text-slate-400 text-sm">Jalur sertifikasi, persyaratan, prosedur & estimasi biaya — SKK Migas & BNSP</p>
          </div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-amber-400 border-amber-400/30">Gelombang 15</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!panduan ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <h2 className="font-semibold text-white">Profil Tenaga Ahli</h2>
            <div className="space-y-2"><Label className="text-slate-300">Jabatan / Bidang Kompetensi Target</Label>
              <Select value={jabatan} onValueChange={setJabatan}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jabatan..." /></SelectTrigger>
                <SelectContent>{JABATAN_MIGAS.map(j=><SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Pengalaman di Sektor Migas</Label>
                <Select value={pengalaman} onValueChange={setPengalaman}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>{PENGALAMAN_OPT.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Latar Belakang Pendidikan</Label>
                <Select value={pendidikan} onValueChange={setPendidikan}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["SMA/SMK","D3 Teknik","S1 Teknik","S2 Teknik","Non-Teknik"].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-3"><Label className="text-slate-300">Subsektor Migas (pilih satu atau lebih)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUBSEKTOR_OPT.map(s=>(
                  <label key={s} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-500/40 cursor-pointer transition-colors">
                    <Checkbox checked={subsektor.includes(s)} onCheckedChange={()=>toggleSub(s)} className="border-slate-500" />
                    <span className="text-sm text-slate-300">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={generate} disabled={loading || !jabatan || !pengalaman || subsektor.length === 0} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? "Generating panduan..." : "Generate Panduan Sertifikasi →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-3 flex-wrap">
              <Button size="sm" variant="outline" onClick={()=>setPanduan(null)} className="border-slate-600 text-slate-300">← Ubah Parameter</Button>
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 self-center">{jabatan}</Badge>
              <Badge variant="outline" className="text-slate-400 border-slate-600 self-center">{pengalaman} pengalaman</Badge>
            </div>

            <Card className="bg-amber-500/5 border-amber-500/30 p-5">
              <p className="text-slate-200 text-sm leading-relaxed">{panduan.ringkasan}</p>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-slate-900 border-slate-700 p-4 text-center"><Clock className="h-5 w-5 text-amber-400 mx-auto mb-1"/><div className="text-xs text-slate-400 mb-1">Estimasi Waktu</div><div className="font-semibold text-white text-sm">{panduan.estimasiWaktu}</div></Card>
              <Card className="bg-slate-900 border-slate-700 p-4 text-center"><Building2 className="h-5 w-5 text-blue-400 mx-auto mb-1"/><div className="text-xs text-slate-400 mb-1">Lembaga Penguji</div><div className="font-semibold text-white text-sm">{panduan.lembagaPenguji.length} opsi</div></Card>
              <Card className="bg-slate-900 border-slate-700 p-4 text-center"><BookOpen className="h-5 w-5 text-emerald-400 mx-auto mb-1"/><div className="text-xs text-slate-400 mb-1">Jalur Sertifikasi</div><div className="font-semibold text-white text-sm">{panduan.jalurSertifikasi.length} jalur</div></Card>
              <Card className="bg-slate-900 border-slate-700 p-4 text-center"><CheckSquare className="h-5 w-5 text-violet-400 mx-auto mb-1"/><div className="text-xs text-slate-400 mb-1">Langkah Prosedur</div><div className="font-semibold text-white text-sm">{panduan.prosedur.length} langkah</div></Card>
            </div>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-400"/>Jalur Sertifikasi</h3>
              <div className="space-y-3">{panduan.jalurSertifikasi.map((j,i)=>(
                <div key={i} className="bg-slate-800 rounded-lg p-4">
                  <div className="font-medium text-amber-300 mb-1">{j.nama}</div>
                  <p className="text-sm text-slate-300 mb-1">{j.deskripsi}</p>
                  <div className="text-xs text-slate-500">📋 {j.regulasi}</div>
                </div>
              ))}</div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><CheckSquare className="h-4 w-4 text-amber-400"/>Persyaratan</h3>
              <div className="space-y-4">{panduan.persyaratan.map((p,i)=>(
                <div key={i}><div className="text-sm font-medium text-amber-300 mb-2">{p.kategori}</div>
                  <ul className="space-y-1">{p.items.map((it,j)=><li key={j} className="flex gap-2 text-sm text-slate-300"><span className="text-amber-400 flex-shrink-0">•</span>{it}</li>)}</ul></div>
              ))}</div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-4">Prosedur Langkah demi Langkah</h3>
              <div className="space-y-3">{panduan.prosedur.map((p,i)=>(
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-sm font-bold text-amber-400 flex-shrink-0">{p.urutan}</div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{p.langkah}</div>
                    <div className="text-xs text-amber-400">{p.estimasiWaktu}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.keterangan}</div>
                  </div>
                </div>
              ))}</div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-400"/>Lembaga Penguji</h3>
                <div className="space-y-3">{panduan.lembagaPenguji.map((l,i)=>(
                  <div key={i} className="bg-slate-800 rounded p-3">
                    <div className="font-medium text-sm text-white">{l.nama}</div>
                    <div className="text-xs text-blue-400 mb-1">{l.jenis}</div>
                    <ul className="space-y-0.5">{l.layanan.map((s,j)=><li key={j} className="text-xs text-slate-400">• {s}</li>)}</ul>
                  </div>
                ))}</div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-400"/>Estimasi Biaya</h3>
                <div className="space-y-2">{panduan.estimasiBiaya.map((b,i)=>(
                  <div key={i} className="flex justify-between items-start py-2 border-b border-slate-700 last:border-0">
                    <span className="text-sm text-slate-300">{b.komponen}</span>
                    <span className="text-sm font-medium text-emerald-400 text-right ml-4">{b.kisaran}</span>
                  </div>
                ))}</div>
              </Card>
            </div>

            {panduan.tips.length > 0 && (
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">💡 Tips Kelulusan</h3>
                <ul className="space-y-2">{panduan.tips.map((t,i)=><li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-amber-400 flex-shrink-0">✓</span>{t}</li>)}</ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
