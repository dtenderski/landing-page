import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollText, ChevronLeft, Copy, CheckCircle, RotateCcw, FileText } from "lucide-react";
import { Link } from "wouter";

type RKS = { judulRKS: string; nomorDokumen: string; bab: { nomor: string; judul: string; isi: string }[]; lampiran: string[]; catatan: string };

const JENIS_PEK = ["Pekerjaan Pondasi Tiang Pancang","Pekerjaan Struktur Beton Bertulang","Pekerjaan Baja Struktural & Fabrikasi","Pekerjaan Pasangan & Plesteran","Pekerjaan Lantai & Keramik","Pekerjaan Atap & Waterproofing","Pekerjaan Pintu, Jendela & Partisi","Pekerjaan Mekanikal (Plumbing & HVAC)","Pekerjaan Elektrikal & Panel","Pekerjaan Jalan Aspal","Pekerjaan Drainase & Saluran","Pekerjaan Landscape & Taman","Pekerjaan Pengecatan","Pekerjaan Pembongkaran & Demolisi"];
const STANDAR = ["SNI (Standar Nasional Indonesia)","ASTM (American Standard)","JIS (Japanese Industrial Standard)","BS (British Standard)","Campuran SNI + ASTM","Sesuai spesifikasi produsen material"];
const TINGKAT = ["Rencana Detail (Detail Engineering Design)","Rencana Umum (Basic Design)","Pra-Rencana (Preliminary)"];

export default function GeneratorRKS() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [standar, setStandar] = useState("SNI (Standar Nasional Indonesia)");
  const [tingkat, setTingkat] = useState("Rencana Detail (Detail Engineering Design)");
  const [nilaiPekerjaan, setNilaiPekerjaan] = useState("");
  const [seksiFokus, setSeksiFokus] = useState<string[]>([]);
  const [rks, setRks] = useState<RKS | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const SEKSI = ["Lingkup Pekerjaan & Definisi","Standar & Referensi","Material & Bahan","Peralatan & Alat Kerja","Persyaratan Tenaga Kerja","Metode Pelaksanaan","Pengendalian Mutu & QC","Pengujian & Testing","Keselamatan Kerja K3","Pembersihan & Perapian"];
  function toggleSeksi(v: string) { setSeksiFokus(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }

  async function generate() {
    if (!jenisPekerjaan) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/generator-rks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, namaProyek, standar, tingkat, nilaiPekerjaan, seksiFokus }),
      });
      setRks(await r.json());
    } catch { }
    setLoading(false);
  }

  function copyText() {
    if (!rks) return;
    const lines = [rks.judulRKS, rks.nomorDokumen, ""];
    rks.bab.forEach(b => { lines.push(`BAB ${b.nomor} — ${b.judul}`, b.isi, ""); });
    if (rks.lampiran.length > 0) { lines.push("LAMPIRAN:", ...rks.lampiran.map((l, i) => `${i + 1}. ${l}`)); }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10"><ScrollText className="h-6 w-6 text-blue-400" /></div>
          <div><h1 className="text-2xl font-bold">Generator Dokumen RKS Konstruksi</h1><p className="text-slate-400 text-sm">Rencana Kerja dan Syarat teknis per jenis pekerjaan — standar SNI/ASTM, siap pakai</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-blue-400 border-blue-400/30">Gelombang 18</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!rks ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Jenis Pekerjaan</Label>
                <Select value={jenisPekerjaan} onValueChange={setJenisPekerjaan}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis pekerjaan..." /></SelectTrigger>
                  <SelectContent>{JENIS_PEK.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nama Proyek (opsional)</Label>
                <Input placeholder="cth: Pembangunan Gedung Kantor Pusat BPJS Ketenagakerjaan" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Standar Referensi</Label>
                <Select value={standar} onValueChange={setStandar}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{STANDAR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Tingkat Detail</Label>
                <Select value={tingkat} onValueChange={setTingkat}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{TINGKAT.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nilai Pekerjaan (opsional)</Label>
                <Input placeholder="cth: Rp 15.000.000.000" value={nilaiPekerjaan} onChange={e => setNilaiPekerjaan(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <div className="space-y-3"><Label className="text-slate-300">Seksi Khusus yang Difokuskan (opsional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{SEKSI.map(s => (
                <label key={s} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500/40 cursor-pointer transition-colors">
                  <Checkbox checked={seksiFokus.includes(s)} onCheckedChange={() => toggleSeksi(s)} className="border-slate-500 flex-shrink-0" />
                  <span className="text-xs text-slate-300">{s}</span>
                </label>
              ))}</div>
            </div>
            <Button onClick={generate} disabled={loading || !jenisPekerjaan} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Generating dokumen RKS..." : "Generate Dokumen RKS →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={() => setRks(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ulang</Button>
              <Button size="sm" onClick={copyText} className={`${copied ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                {copied ? <><CheckCircle className="h-3 w-3 mr-1" />Tersalin!</> : <><Copy className="h-3 w-3 mr-1" />Salin RKS</>}
              </Button>
            </div>
            <Card className="bg-blue-500/5 border-blue-500/30 p-5">
              <h2 className="font-bold text-white text-lg">{rks.judulRKS}</h2>
              <p className="text-sm text-slate-400 mt-1">{rks.nomorDokumen}</p>
            </Card>
            {rks.bab.map((bab, i) => (
              <Card key={i} className="bg-slate-900 border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-white">BAB {bab.nomor} — {bab.judul}</h3>
                </div>
                <div className="whitespace-pre-line text-sm text-slate-300 leading-relaxed">{bab.isi}</div>
              </Card>
            ))}
            {rks.lampiran.length > 0 && (
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">Lampiran</h3>
                <ol className="space-y-1">{rks.lampiran.map((l, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-blue-400">{i + 1}.</span>{l}</li>)}</ol>
              </Card>
            )}
            {rks.catatan && <Card className="bg-slate-900 border-slate-700 p-4"><p className="text-xs text-slate-500 italic">{rks.catatan}</p></Card>}
          </div>
        )}
      </div>
    </div>
  );
}
