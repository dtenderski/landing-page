import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileCheck, ChevronLeft, Info, RotateCcw, CheckSquare, AlertTriangle, BookOpen } from "lucide-react";
import { Link } from "wouter";

type PanduanTKDN = {
  ringkasan: string;
  nilaiTKDNMinimal: string;
  komponenTKDN: { komponen: string; definisi: string; bobotMaksimal: string; cara: string }[];
  formulaPerhitungan: { nama: string; formula: string; keterangan: string }[];
  dokumenWajib: { nama: string; deskripsi: string; penyedia: string }[];
  prosedurVerifikasi: { langkah: number; uraian: string; instansi: string }[];
  sanksi: string[];
  tips: string[];
  regulasi: string[];
};

const JENIS_PEKERJAAN = [
  "Konstruksi Gedung (Umum)","Konstruksi Jalan & Jembatan","Konstruksi Bangunan Air (Bendungan/SPAM)","Konstruksi Mekanikal-Elektrikal (MEP)","Instalasi Jaringan Listrik","Fabrikasi Baja Konstruksi","Produksi Material Bangunan (Beton Precast)","Konstruksi Lepas Pantai (Migas/Pelabuhan)","Jasa Konsultansi Konstruksi","Pengadaan Peralatan Konstruksi",
];
const SKALA = ["< Rp 1 Miliar","Rp 1–10 Miliar","Rp 10–50 Miliar","Rp 50–100 Miliar","> Rp 100 Miliar"];
const SUMBER = ["Material lokal dominan","Material impor dominan","Campuran lokal & impor","Material lokal + teknologi asing","Subkon lokal"];

export default function PanduanTKDN() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState("");
  const [skalaProyek, setSkalaProyek] = useState("");
  const [sumberKomponen, setSumberKomponen] = useState<string[]>([]);
  const [sumberPendanaan, setSumberPendanaan] = useState("APBN/APBD");
  const [panduan, setPanduan] = useState<PanduanTKDN | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSumber(v: string) { setSumberKomponen(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }

  async function generate() {
    if (!jenisPekerjaan || !skalaProyek || sumberKomponen.length === 0) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/panduan-tkdn", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, skalaProyek, sumberKomponen, sumberPendanaan }),
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
          <div className="p-2 rounded-lg bg-orange-500/10"><FileCheck className="h-6 w-6 text-orange-400" /></div>
          <div><h1 className="text-2xl font-bold">Panduan Pembuatan Dokumen TKDN</h1><p className="text-slate-400 text-sm">Tingkat Komponen Dalam Negeri — perhitungan, formulir, verifikasi & regulasi</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-orange-400 border-orange-400/30">Gelombang 16</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!panduan ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Jenis Pekerjaan / Produk</Label>
                <Select value={jenisPekerjaan} onValueChange={setJenisPekerjaan}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis pekerjaan..." /></SelectTrigger>
                  <SelectContent>{JENIS_PEKERJAAN.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Skala Nilai Proyek</Label>
                <Select value={skalaProyek} onValueChange={setSkalaProyek}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih skala..." /></SelectTrigger>
                  <SelectContent>{SKALA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Sumber Pendanaan</Label>
                <Select value={sumberPendanaan} onValueChange={setSumberPendanaan}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["APBN/APBD","BUMN/BUMD","Swasta Murni","Pinjaman Luar Negeri (PLN)","Campuran (PPP/KPS)"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-3"><Label className="text-slate-300">Sumber Komponen (pilih yang relevan)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{SUMBER.map(s => (
                <label key={s} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-orange-500/40 cursor-pointer transition-colors">
                  <Checkbox checked={sumberKomponen.includes(s)} onCheckedChange={() => toggleSumber(s)} className="border-slate-500" />
                  <span className="text-sm text-slate-300">{s}</span>
                </label>
              ))}</div>
            </div>
            <Button onClick={generate} disabled={loading || !jenisPekerjaan || !skalaProyek || sumberKomponen.length === 0} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              {loading ? "Generating panduan TKDN..." : "Generate Panduan TKDN →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <Button size="sm" variant="outline" onClick={() => setPanduan(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ubah Parameter</Button>

            <Card className="bg-orange-500/5 border-orange-500/30 p-5">
              <p className="text-slate-200 text-sm leading-relaxed mb-2">{panduan.ringkasan}</p>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-orange-300 mb-1">TKDN Minimal yang Dipersyaratkan</div>
                <div className="text-2xl font-bold text-orange-400">{panduan.nilaiTKDNMinimal}</div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-orange-400" />Formula Perhitungan</h3>
              <div className="space-y-3">{panduan.formulaPerhitungan.map((f, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-4">
                  <div className="font-medium text-orange-300 mb-2">{f.nama}</div>
                  <div className="font-mono text-sm text-white bg-slate-900 rounded p-2 mb-2">{f.formula}</div>
                  <div className="text-xs text-slate-400">{f.keterangan}</div>
                </div>
              ))}</div>
            </Card>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-4">Komponen TKDN</h3>
              <div className="space-y-3">{panduan.komponenTKDN.map((k, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-white">{k.komponen}</div>
                    <Badge variant="outline" className="text-orange-400 border-orange-400/30 text-xs">{k.bobotMaksimal}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{k.definisi}</p>
                  <p className="text-xs text-slate-300">📐 {k.cara}</p>
                </div>
              ))}</div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CheckSquare className="h-4 w-4 text-orange-400" />Dokumen Wajib</h3>
                <div className="space-y-3">{panduan.dokumenWajib.map((d, i) => (
                  <div key={i} className="bg-slate-800 rounded p-3">
                    <div className="font-medium text-sm text-white">{d.nama}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{d.deskripsi}</div>
                    <div className="text-xs text-orange-400 mt-0.5">📋 {d.penyedia}</div>
                  </div>
                ))}</div>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">Prosedur Verifikasi</h3>
                <div className="space-y-3">{panduan.prosedurVerifikasi.map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">{p.langkah}</div>
                    <div><div className="text-sm text-white">{p.uraian}</div><div className="text-xs text-orange-400">{p.instansi}</div></div>
                  </div>
                ))}</div>
              </Card>
            </div>

            {panduan.sanksi.length > 0 && (
              <Card className="bg-red-500/5 border-red-500/30 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" />Sanksi Pelanggaran TKDN</h3>
                <ul className="space-y-2">{panduan.sanksi.map((s, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-red-400 flex-shrink-0">•</span>{s}</li>)}</ul>
              </Card>
            )}

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3">💡 Tips & Regulasi</h3>
              <ul className="space-y-2 mb-4">{panduan.tips.map((t, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-orange-400 flex-shrink-0">✓</span>{t}</li>)}</ul>
              <div className="border-t border-slate-700 pt-3">
                <div className="text-xs text-slate-500 mb-1">Regulasi Referensi:</div>
                <ul className="space-y-1">{panduan.regulasi.map((r, i) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
