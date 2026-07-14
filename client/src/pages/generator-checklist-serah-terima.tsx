import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, ChevronLeft, Copy, CheckCircle, RotateCcw, Download } from "lucide-react";
import { Link } from "wouter";

type Section = { judul: string; items: { kode: string; item: string; standar: string; status: string }[]; catatan: string };
type Checklist = { judul: string; nomorChecklist: string; jenisSerahTerima: string; lingkupChecklist: string; sections: Section[]; dokumenPendamping: string[]; prosedurTindakLanjut: string; catatan: string };

const JENIS_PROYEK = ["Gedung Bertingkat","Jalan & Jembatan","Bendungan / Irigasi","Pelabuhan / Dermaga","Perumahan / Permukiman","Instalasi Mekanikal-Elektrikal","Pipeline / Pipa Gas","Jaringan Listrik Tegangan Tinggi","Fasilitas Industri / Pabrik","Infrastruktur Air Minum (SPAM)"];
const LINGKUP = ["Pekerjaan Sipil & Arsitektur","Pekerjaan Mekanikal-Elektrikal-Plumbing (MEP)","Pekerjaan Landscape & Sarana Luar","Semua Lingkup (Komprehensif)"];

export default function GeneratorChecklistSerahTerima() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [jenisST, setJenisST] = useState("PHO (Provisional Hand Over)");
  const [lingkup, setLingkup] = useState<string[]>([]);
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [pemilik, setPemilik] = useState("");
  const [kontraktor, setKontraktor] = useState("");
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggleLingkup(v: string) { setLingkup(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }

  async function generate() {
    if (!jenisProyek || lingkup.length === 0) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/generator-checklist-serah-terima", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, jenisST, lingkup, nilaiKontrak, pemilik, kontraktor }),
      });
      const d = await r.json();
      setChecklist(d);
      setChecked({});
    } catch { }
    setLoading(false);
  }

  function buildText(): string {
    if (!checklist) return "";
    const lines = [`${checklist.judul}`, `No: ${checklist.nomorChecklist}`, `Jenis: ${checklist.jenisSerahTerima}`, `Lingkup: ${checklist.lingkupChecklist}`, ""];
    checklist.sections.forEach((s, si) => {
      lines.push(`${si + 1}. ${s.judul}`, "");
      s.items.forEach(it => { lines.push(`  [${checked[it.kode] ? "✓" : " "}] ${it.kode} — ${it.item}`); lines.push(`      Standar: ${it.standar}`); });
      if (s.catatan) lines.push(`  Catatan: ${s.catatan}`);
      lines.push("");
    });
    lines.push("DOKUMEN PENDAMPING:", ...checklist.dokumenPendamping.map((d, i) => `${i + 1}. ${d}`));
    lines.push("", "TINDAK LANJUT:", checklist.prosedurTindakLanjut);
    if (checklist.catatan) lines.push("", "CATATAN:", checklist.catatan);
    return lines.join("\n");
  }

  function copyText() { navigator.clipboard.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const totalItems = checklist?.sections.reduce((a, s) => a + s.items.length, 0) ?? 0;
  const doneItems = Object.values(checked).filter(Boolean).length;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10"><ClipboardCheck className="h-6 w-6 text-blue-400" /></div>
          <div><h1 className="text-2xl font-bold">Generator Checklist Serah Terima Proyek</h1><p className="text-slate-400 text-sm">PHO & FHO — checklist per seksi, standar penerimaan, status, dokumen pendamping</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-blue-400 border-blue-400/30">Gelombang 16</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!checklist ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Jenis Proyek</Label>
                <Select value={jenisProyek} onValueChange={setJenisProyek}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis proyek..." /></SelectTrigger>
                  <SelectContent>{JENIS_PROYEK.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Jenis Serah Terima</Label>
                <Select value={jenisST} onValueChange={setJenisST}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["PHO (Provisional Hand Over)","FHO (Final Hand Over)","Serah Terima Parsial / Sectional","Serah Terima Peralatan / Instalasi"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Nilai Kontrak (opsional)</Label>
                <Input placeholder="cth: Rp 25.000.000.000" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Nama Pemilik / Owner</Label>
                <Input placeholder="cth: Dinas PUPR Kota Surabaya" value={pemilik} onChange={e => setPemilik(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nama Kontraktor</Label>
                <Input placeholder="cth: PT Maju Konstruksi Nusantara" value={kontraktor} onChange={e => setKontraktor(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <div className="space-y-3"><Label className="text-slate-300">Lingkup Checklist (pilih satu atau lebih)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{LINGKUP.map(l => (
                <label key={l} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500/40 cursor-pointer transition-colors">
                  <Checkbox checked={lingkup.includes(l)} onCheckedChange={() => toggleLingkup(l)} className="border-slate-500" />
                  <span className="text-sm text-slate-300">{l}</span>
                </label>
              ))}</div>
            </div>
            <Button onClick={generate} disabled={loading || !jenisProyek || lingkup.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Generating checklist..." : "Generate Checklist Serah Terima →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setChecklist(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ulang</Button>
                <Button size="sm" onClick={copyText} className={`${copied ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                  {copied ? <><CheckCircle className="h-3 w-3 mr-1" />Tersalin!</> : <><Copy className="h-3 w-3 mr-1" />Salin</>}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-400">{doneItems}/{totalItems} item</div>
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                <div className="text-sm font-medium text-blue-400">{pct}%</div>
              </div>
            </div>

            <Card className="bg-blue-500/5 border-blue-500/30 p-4">
              <h2 className="font-bold text-white text-lg">{checklist.judul}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                <span>📋 {checklist.nomorChecklist}</span>
                <span>🔖 {checklist.jenisSerahTerima}</span>
                <span>📐 {checklist.lingkupChecklist}</span>
              </div>
            </Card>

            {checklist.sections.map((section, si) => (
              <Card key={si} className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-bold flex items-center justify-center">{si + 1}</span>
                  {section.judul}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <label key={item.kode} className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked[item.kode] ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-800 border-slate-700 hover:border-blue-500/20"}`}>
                      <Checkbox checked={!!checked[item.kode]} onCheckedChange={(v) => setChecked(prev => ({ ...prev, [item.kode]: !!v }))} className="mt-0.5 border-slate-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-blue-400 font-mono flex-shrink-0 mt-0.5">{item.kode}</span>
                          <span className={`text-sm ${checked[item.kode] ? "line-through text-slate-500" : "text-slate-200"}`}>{item.item}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 ml-0">📏 {item.standar}</div>
                      </div>
                      <Badge variant="outline" className={`flex-shrink-0 self-start text-xs ${item.status === "Wajib" ? "text-red-400 border-red-400/30" : item.status === "Dianjurkan" ? "text-amber-400 border-amber-400/30" : "text-slate-400 border-slate-600"}`}>{item.status}</Badge>
                    </label>
                  ))}
                </div>
                {section.catatan && <p className="text-xs text-slate-500 mt-3 italic">📌 {section.catatan}</p>}
              </Card>
            ))}

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-3">Dokumen Pendamping Wajib</h3>
              <ul className="space-y-1">{checklist.dokumenPendamping.map((d, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-blue-400">{i + 1}.</span>{d}</li>)}</ul>
            </Card>
            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-2">Prosedur Tindak Lanjut</h3>
              <p className="text-sm text-slate-300">{checklist.prosedurTindakLanjut}</p>
              {checklist.catatan && <p className="text-xs text-slate-500 mt-3 italic">📌 {checklist.catatan}</p>}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
