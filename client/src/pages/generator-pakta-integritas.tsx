import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeCheck, ChevronLeft, Copy, CheckCircle, RotateCcw, Shield } from "lucide-react";
import { Link } from "wouter";

type PaktaIntegritas = { judul: string; nomorDokumen: string; isiPakta: string; klausulKhusus: string[]; sanksiLanggar: string[]; catatan: string };

const JENIS_PAKTA = [
  "Pakta Integritas Pengadaan Barang/Jasa (Perpres 16/2018)","Pakta Integritas Anti-Korupsi Konstruksi (KPK)","Pakta Integritas Tender Proyek Pemerintah","Pakta Integritas Pejabat & Pengelola Proyek","Pakta Integritas Subkontraktor & Vendor","Pakta Integritas Pengelolaan Dana Proyek Swasta","Pakta Integritas SMM ISO 9001","Pakta Integritas K3 & HSE (Zero Accident)","Pakta Integritas SMAP ISO 37001 Anti-Penyuapan",
];

export default function GeneratorPaktaIntegritas() {
  const [jenisPakta, setJenisPakta] = useState("");
  const [namaOrganisasi, setNamaOrganisasi] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [pihakPenandatangan, setPihakPenandatangan] = useState("");
  const [kotaTanggal, setKotaTanggal] = useState("");
  const [nilaiProyek, setNilaiProyek] = useState("");
  const [hasil, setHasil] = useState<PaktaIntegritas | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!jenisPakta || !namaOrganisasi) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/generator-pakta-integritas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPakta, namaOrganisasi, namaProyek, pihakPenandatangan, kotaTanggal, nilaiProyek }),
      });
      setHasil(await r.json());
    } catch { }
    setLoading(false);
  }

  function copyText() {
    if (!hasil) return;
    const lines = [hasil.judul, hasil.nomorDokumen, "", hasil.isiPakta];
    if (hasil.klausulKhusus.length > 0) { lines.push("", "KLAUSUL KHUSUS:"); hasil.klausulKhusus.forEach((k, i) => lines.push(`${i + 1}. ${k}`)); }
    if (hasil.sanksiLanggar.length > 0) { lines.push("", "SANKSI PELANGGARAN:"); hasil.sanksiLanggar.forEach((s, i) => lines.push(`${i + 1}. ${s}`)); }
    if (hasil.catatan) lines.push("", hasil.catatan);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10"><BadgeCheck className="h-6 w-6 text-emerald-400" /></div>
          <div><h1 className="text-2xl font-bold">Generator Pakta Integritas</h1><p className="text-slate-400 text-sm">Anti-KKN, pengadaan, K3, ISO 37001 — pakta formal siap tanda tangan</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Gelombang 17</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!hasil ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="space-y-2"><Label className="text-slate-300">Jenis Pakta Integritas</Label>
              <Select value={jenisPakta} onValueChange={setJenisPakta}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis pakta..." /></SelectTrigger>
                <SelectContent>{JENIS_PAKTA.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Nama Organisasi / Perusahaan</Label>
                <Input placeholder="cth: PT Maju Konstruksi Nusantara" value={namaOrganisasi} onChange={e => setNamaOrganisasi(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Nama Proyek (opsional)</Label>
                <Input placeholder="cth: Pembangunan Gedung Kantor BPKP" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Pihak Penandatangan</Label>
                <Input placeholder="cth: Ir. Budi Hartono (Direktur Utama)" value={pihakPenandatangan} onChange={e => setPihakPenandatangan(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Kota & Tanggal</Label>
                <Input placeholder="cth: Jakarta, 9 Juni 2026" value={kotaTanggal} onChange={e => setKotaTanggal(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nilai Proyek (opsional)</Label>
                <Input placeholder="cth: Rp 25.000.000.000" value={nilaiProyek} onChange={e => setNilaiProyek(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <Button onClick={generate} disabled={loading || !jenisPakta || !namaOrganisasi} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Generating pakta integritas..." : "Generate Pakta Integritas →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={() => setHasil(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ubah</Button>
              <Button size="sm" onClick={copyText} className={`${copied ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}>
                {copied ? <><CheckCircle className="h-3 w-3 mr-1" />Tersalin!</> : <><Copy className="h-3 w-3 mr-1" />Salin Dokumen</>}
              </Button>
            </div>
            <Card className="bg-slate-900 border-slate-700 p-8">
              <div className="flex justify-center mb-4"><Shield className="h-12 w-12 text-emerald-400" /></div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{hasil.judul}</h2>
                {hasil.nomorDokumen && <p className="text-sm text-slate-400 mt-1">{hasil.nomorDokumen}</p>}
              </div>
              <div className="whitespace-pre-line text-slate-200 text-sm leading-relaxed">{hasil.isiPakta}</div>
              {hasil.klausulKhusus.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <p className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wide">Klausul Khusus</p>
                  <ol className="space-y-2">{hasil.klausulKhusus.map((k, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-400 flex-shrink-0 font-bold">{i + 1}.</span>{k}</li>)}</ol>
                </div>
              )}
              {hasil.sanksiLanggar.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">Sanksi Pelanggaran</p>
                  <ol className="space-y-1">{hasil.sanksiLanggar.map((s, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-red-400 flex-shrink-0 font-bold">{i + 1}.</span>{s}</li>)}</ol>
                </div>
              )}
              {hasil.catatan && <p className="mt-4 text-xs text-slate-500 italic border-t border-slate-700 pt-3">{hasil.catatan}</p>}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
