import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSignature, ChevronLeft, Copy, CheckCircle, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type SuratKuasa = { judul: string; nomorSurat: string; tanggal: string; isiSurat: string; ketentuanTambahan: string[]; catatan: string };

const JENIS_SK = [
  "Pengambilan Dokumen Tender / RKS","Penandatanganan Kontrak Konstruksi","Mewakili Rapat Koordinasi Proyek","Pengurusan Izin Bangunan (IMB/PBG)","Penandatanganan BA Serah Terima (PHO/FHO)","Pengambilan Jaminan Pelaksanaan / Uang Muka","Mewakili Klarifikasi & Negosiasi Tender","Pengurusan Dokumen SKT/SKK Tenaga Ahli","Penandatanganan Adendum Kontrak","Mewakili Pemberian Keterangan di Instansi Pemerintah",
];

export default function GeneratorSuratKuasa() {
  const [jenisSK, setJenisSK] = useState("");
  const [pemberiNama, setPemberiNama] = useState("");
  const [pemberiJabatan, setPemberiJabatan] = useState("");
  const [pemberiPerusahaan, setPemberiPerusahaan] = useState("");
  const [penerimaKuasaNama, setPenerimaKuasaNama] = useState("");
  const [penerimaKuasaJabatan, setPenerimaKuasaJabatan] = useState("");
  const [penerimaKuasaKTP, setPenerimaKuasaKTP] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [kotaTanggal, setKotaTanggal] = useState("");
  const [bahasa, setBahasa] = useState("Bahasa Indonesia Formal");
  const [hasil, setHasil] = useState<SuratKuasa | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!jenisSK || !pemberiNama || !penerimaKuasaNama) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/generator-surat-kuasa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisSK, pemberiNama, pemberiJabatan, pemberiPerusahaan, penerimaKuasaNama, penerimaKuasaJabatan, penerimaKuasaKTP, keperluan, kotaTanggal, bahasa }),
      });
      setHasil(await r.json());
    } catch { }
    setLoading(false);
  }

  function copyText() {
    if (!hasil) return;
    navigator.clipboard.writeText(`${hasil.judul}\n${hasil.nomorSurat}\n\n${hasil.isiSurat}\n\n${hasil.ketentuanTambahan.join("\n")}\n\n${hasil.catatan}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/10"><FileSignature className="h-6 w-6 text-indigo-400" /></div>
          <div><h1 className="text-2xl font-bold">Generator Surat Kuasa Proyek Konstruksi</h1><p className="text-slate-400 text-sm">Tender, kontrak, rapat, izin, serah terima — surat kuasa formal siap pakai</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-indigo-400 border-indigo-400/30">Gelombang 17</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!hasil ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="space-y-2"><Label className="text-slate-300">Jenis / Keperluan Surat Kuasa</Label>
              <Select value={jenisSK} onValueChange={setJenisSK}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih keperluan..." /></SelectTrigger>
                <SelectContent>{JENIS_SK.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Pemberi Kuasa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Nama Lengkap</Label>
                  <Input placeholder="cth: Ir. Budi Hartono, MT." value={pemberiNama} onChange={e => setPemberiNama(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Jabatan</Label>
                  <Input placeholder="cth: Direktur Utama" value={pemberiJabatan} onChange={e => setPemberiJabatan(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                <div className="space-y-2 md:col-span-2"><Label className="text-slate-300 text-sm">Nama Perusahaan</Label>
                  <Input placeholder="cth: PT Maju Konstruksi Nusantara" value={pemberiPerusahaan} onChange={e => setPemberiPerusahaan(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Penerima Kuasa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Nama Lengkap</Label>
                  <Input placeholder="cth: Andi Kurniawan, ST." value={penerimaKuasaNama} onChange={e => setPenerimaKuasaNama(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Jabatan</Label>
                  <Input placeholder="cth: Kepala Proyek / Site Manager" value={penerimaKuasaJabatan} onChange={e => setPenerimaKuasaJabatan(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300 text-sm">No. KTP (opsional)</Label>
                  <Input placeholder="cth: 3271xxxxxxxxxxxx" value={penerimaKuasaKTP} onChange={e => setPenerimaKuasaKTP(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Kota & Tanggal Surat</Label>
                  <Input placeholder="cth: Jakarta, 9 Juni 2026" value={kotaTanggal} onChange={e => setKotaTanggal(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Keperluan Spesifik (opsional)</Label>
              <Textarea placeholder="cth: Pengambilan dokumen Tender Pembangunan Gedung Serbaguna Kota Surabaya Tahun Anggaran 2026 di Dinas PUPR Kota Surabaya" value={keperluan} onChange={e => setKeperluan(e.target.value)} className="bg-slate-800 border-slate-600 text-white" rows={3} /></div>
            <div className="space-y-2"><Label className="text-slate-300">Gaya Bahasa</Label>
              <Select value={bahasa} onValueChange={setBahasa}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{["Bahasa Indonesia Formal","Bahasa Indonesia Formal + Legal","Singkat & Padat"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={generate} disabled={loading || !jenisSK || !pemberiNama || !penerimaKuasaNama} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? "Generating surat kuasa..." : "Generate Surat Kuasa →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={() => setHasil(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ubah</Button>
              <Button size="sm" onClick={copyText} className={`${copied ? "bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}>
                {copied ? <><CheckCircle className="h-3 w-3 mr-1" />Tersalin!</> : <><Copy className="h-3 w-3 mr-1" />Salin Surat</>}
              </Button>
            </div>
            <Card className="bg-slate-900 border-slate-700 p-8">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{hasil.judul}</h2>
                {hasil.nomorSurat && <p className="text-sm text-slate-400 mt-1">{hasil.nomorSurat}</p>}
              </div>
              <div className="whitespace-pre-line text-slate-200 text-sm leading-relaxed font-serif">{hasil.isiSurat}</div>
              {hasil.ketentuanTambahan.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 mb-2">KETENTUAN TAMBAHAN:</p>
                  <ul className="space-y-1">{hasil.ketentuanTambahan.map((k, i) => <li key={i} className="text-xs text-slate-400">• {k}</li>)}</ul>
                </div>
              )}
              {hasil.catatan && <p className="mt-4 text-xs text-slate-500 italic">{hasil.catatan}</p>}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
