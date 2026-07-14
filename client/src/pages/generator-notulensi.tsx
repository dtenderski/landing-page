import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, ChevronLeft, Copy, CheckCircle, RotateCcw, CalendarDays, Users } from "lucide-react";
import { Link } from "wouter";

type Notulensi = {
  header: { judul: string; tanggal: string; tempat: string; notulis: string; dipimpin: string };
  peserta: string[];
  agendaDibahas: { agenda: string; pembahasan: string; kesimpulan: string }[];
  keputusan: string[];
  actionItem: { no: number; kegiatan: string; penanggungJawab: string; target: string; status: string }[];
  halLainnya: string;
  penutup: string;
};

const JENIS_RAPAT = [
  "Rapat Koordinasi Proyek", "Rapat Kick-Off Proyek", "Rapat Evaluasi Mingguan",
  "Rapat Evaluasi Bulanan", "Rapat Mutu Internal", "Rapat K3 Lapangan",
  "Rapat Progres dengan Owner", "Rapat Keuangan & Cash Flow", "Rapat Teknis Design",
  "Rapat Serah Terima (PHO/FHO)", "Rapat Manajemen Kontrak & Klaim", "Rapat Pengadaan & Vendor",
];

export default function GeneratorNotulensi() {
  const [jenisRapat, setJenisRapat] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [tempat, setTempat] = useState("");
  const [dipimpin, setDipimpin] = useState("");
  const [notulis, setNotulis] = useState("");
  const [peserta, setPeserta] = useState("");
  const [agenda, setAgenda] = useState("");
  const [poinDiskusi, setPoinDiskusi] = useState("");
  const [hasil, setHasil] = useState<Notulensi | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!jenisRapat || !poinDiskusi || !agenda) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/generator-notulensi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisRapat, tanggal, tempat, dipimpin, notulis, peserta, agenda, poinDiskusi }),
      });
      setHasil(await r.json());
    } catch { }
    setLoading(false);
  }

  function buildTeks(n: Notulensi): string {
    const lines: string[] = [
      `NOTULENSI RAPAT`, `${"=".repeat(60)}`,
      `Jenis Rapat : ${n.header.judul}`,
      `Tanggal     : ${n.header.tanggal}`,
      `Tempat      : ${n.header.tempat}`,
      `Dipimpin    : ${n.header.dipimpin}`,
      `Notulis     : ${n.header.notulis}`,
      ``, `PESERTA RAPAT:`,
      ...n.peserta.map((p, i) => `${i + 1}. ${p}`),
      ``, `AGENDA DAN PEMBAHASAN:`,
    ];
    n.agendaDibahas.forEach((a, i) => {
      lines.push(``, `${i + 1}. ${a.agenda}`, `   Pembahasan: ${a.pembahasan}`, `   Kesimpulan: ${a.kesimpulan}`);
    });
    lines.push(``, `KEPUTUSAN RAPAT:`);
    n.keputusan.forEach((k, i) => lines.push(`${i + 1}. ${k}`));
    lines.push(``, `ACTION ITEM:`, `No | Kegiatan | PIC | Target | Status`);
    n.actionItem.forEach(a => lines.push(`${a.no}. ${a.kegiatan} — ${a.penanggungJawab} — ${a.target} — ${a.status}`));
    if (n.halLainnya) lines.push(``, `HAL LAINNYA:`, n.halLainnya);
    lines.push(``, `PENUTUP:`, n.penutup, ``, `${"=".repeat(60)}`);
    return lines.join("\n");
  }

  function copyText() {
    if (!hasil) return;
    navigator.clipboard.writeText(buildTeks(hasil));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10"><ClipboardList className="h-6 w-6 text-emerald-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">Generator Notulensi Rapat Otomatis</h1>
            <p className="text-slate-400 text-sm">Input poin-poin diskusi → AI generate notulensi formal, keputusan & action item</p>
          </div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Gelombang 15</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!hasil ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <h2 className="font-semibold text-white">Detail Rapat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Jenis Rapat</Label>
                <Select value={jenisRapat} onValueChange={setJenisRapat}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis rapat..." /></SelectTrigger>
                  <SelectContent>{JENIS_RAPAT.map(j=><SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Tanggal Rapat</Label>
                <Input type="date" value={tanggal} onChange={e=>setTanggal(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Tempat / Platform</Label>
                <Input placeholder="cth: Ruang Rapat Lantai 3 / Zoom Meeting" value={tempat} onChange={e=>setTempat(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Dipimpin Oleh</Label>
                <Input placeholder="cth: Ir. Budi Santoso (Project Manager)" value={dipimpin} onChange={e=>setDipimpin(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Notulis</Label>
                <Input placeholder="cth: Siti Rahayu (Site Admin)" value={notulis} onChange={e=>setNotulis(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Peserta Rapat (satu per baris atau dipisah koma)</Label>
              <Textarea placeholder="cth:&#10;Budi Santoso (PM Kontraktor)&#10;Rini Wijaya (Pengawas Owner)&#10;Andi Kurniawan (Konsultan MK)" value={peserta} onChange={e=>setPeserta(e.target.value)} className="bg-slate-800 border-slate-600 text-white" rows={3} /></div>
            <div className="space-y-2"><Label className="text-slate-300">Agenda Rapat</Label>
              <Textarea placeholder="cth:&#10;1. Evaluasi progres pekerjaan minggu ke-12&#10;2. Pembahasan keterlambatan pekerjaan pembesian&#10;3. Rencana kerja minggu depan" value={agenda} onChange={e=>setAgenda(e.target.value)} className="bg-slate-800 border-slate-600 text-white" rows={3} /></div>
            <div className="space-y-2"><Label className="text-slate-300">Poin-Poin Diskusi / Hasil Rapat <span className="text-red-400">*</span></Label>
              <Textarea placeholder="Tulis poin utama diskusi dalam rapat — AI akan menyusunnya menjadi notulensi formal.&#10;&#10;cth:&#10;- Progres fisik 68%, target minggu ini 72% → perlu akselerasi&#10;- Pembesian kolom L4 terlambat karena material besi 16mm telat datang, Andi akan konfirmasi supplier hari ini&#10;- K3: ditemukan pekerja tidak pakai helm di area galian, HSE tegur dan catat&#10;- Rencana kerja minggu depan: fokus pengecoran lantai 5 dan pemasangan MEP" value={poinDiskusi} onChange={e=>setPoinDiskusi(e.target.value)} className="bg-slate-800 border-slate-600 text-white font-mono text-sm" rows={7} /></div>
            <Button onClick={generate} disabled={loading || !jenisRapat || !poinDiskusi || !agenda} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Generating notulensi..." : "Generate Notulensi Formal →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm" variant="outline" onClick={()=>setHasil(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1"/>Ubah Input</Button>
              <Button size="sm" onClick={copyText} className={`${copied ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}>
                {copied ? <><CheckCircle className="h-3 w-3 mr-1"/>Tersalin!</> : <><Copy className="h-3 w-3 mr-1"/>Salin Notulensi</>}
              </Button>
            </div>

            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="border-b border-slate-600 pb-4 mb-5">
                <h2 className="text-xl font-bold text-center text-white mb-1">{hasil.header.judul}</h2>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400 mt-3">
                  {hasil.header.tanggal && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/>{hasil.header.tanggal}</span>}
                  {hasil.header.tempat && <span>📍 {hasil.header.tempat}</span>}
                  {hasil.header.dipimpin && <span>👤 {hasil.header.dipimpin}</span>}
                  {hasil.header.notulis && <span>📝 {hasil.header.notulis}</span>}
                </div>
              </div>

              {hasil.peserta.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-emerald-400"/>Peserta Rapat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">{hasil.peserta.map((p,i)=><div key={i} className="text-sm text-slate-300">{i+1}. {p}</div>)}</div>
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-semibold text-white mb-3">Agenda & Pembahasan</h3>
                <div className="space-y-4">{hasil.agendaDibahas.map((a,i)=>(
                  <div key={i} className="bg-slate-800 rounded-lg p-4">
                    <div className="font-medium text-emerald-300 mb-2">{i+1}. {a.agenda}</div>
                    <p className="text-sm text-slate-300 mb-2">{a.pembahasan}</p>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-sm text-emerald-200"><strong>Kesimpulan:</strong> {a.kesimpulan}</div>
                  </div>
                ))}</div>
              </div>

              <div className="mb-5">
                <h3 className="font-semibold text-white mb-2">Keputusan Rapat</h3>
                <ul className="space-y-2">{hasil.keputusan.map((k,i)=>(
                  <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-emerald-400 font-bold flex-shrink-0">{i+1}.</span>{k}</li>
                ))}</ul>
              </div>

              <div className="mb-5">
                <h3 className="font-semibold text-white mb-3">Action Item</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-600 text-slate-400 text-left">
                    <th className="pb-2 pr-3">No</th><th className="pb-2 pr-3">Kegiatan</th><th className="pb-2 pr-3">PIC</th><th className="pb-2 pr-3">Target</th><th className="pb-2">Status</th>
                  </tr></thead>
                  <tbody>{hasil.actionItem.map(a=>(
                    <tr key={a.no} className="border-b border-slate-800">
                      <td className="py-2 pr-3 text-slate-400">{a.no}</td>
                      <td className="py-2 pr-3 text-slate-300">{a.kegiatan}</td>
                      <td className="py-2 pr-3 text-blue-400 whitespace-nowrap">{a.penanggungJawab}</td>
                      <td className="py-2 pr-3 text-amber-400 whitespace-nowrap">{a.target}</td>
                      <td className="py-2"><Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">{a.status}</Badge></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              </div>

              {hasil.halLainnya && <div className="mb-5"><h3 className="font-semibold text-white mb-2">Hal Lainnya</h3><p className="text-sm text-slate-300">{hasil.halLainnya}</p></div>}
              <div className="border-t border-slate-600 pt-4 text-sm text-slate-400 italic">{hasil.penutup}</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
