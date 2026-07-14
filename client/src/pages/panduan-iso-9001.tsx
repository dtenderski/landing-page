import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, ChevronLeft, RotateCcw, CheckCircle2, BookOpen, FileText } from "lucide-react";
import { Link } from "wouter";

type PanduanISO = {
  ringkasan: string;
  klausulUtama: { klausul: string; judul: string; persyaratan: string; implementasi: string[]; dokumenWajib: string[]; indikatorKesesuaian: string }[];
  roadmapImplementasi: { fase: string; durasi: string; aktivitas: string[]; output: string }[];
  dokumenSistem: string[];
  biayaEstimasi: string;
  tipsSukses: string[];
};

const SKALA_PERUSAHAAN = ["Mikro (<10 karyawan)","Kecil (10–50 karyawan)","Menengah (50–250 karyawan)","Besar (>250 karyawan)"];
const JENIS_KONSTRUKSI = ["Kontraktor Umum (Gedung)","Kontraktor Jalan & Jembatan","Kontraktor Spesialis (MEP/Geoteknik)","Konsultan Perencana","Konsultan Pengawas","Kontraktor EPC/Turnkey","Kontraktor Pertambangan & Migas"];
const STATUS_SMM = ["Belum ada sistem mutu","Ada prosedur tapi belum terdokumentasi","Sudah ISO 9001:2008 (ingin upgrade ke 2015)","Audit internal pertama kali","Dalam proses sertifikasi","Re-sertifikasi ISO 9001:2015"];
const FOKUS_KLAUSUL = ["Klausul 4 — Konteks Organisasi","Klausul 5 — Kepemimpinan","Klausul 6 — Perencanaan","Klausul 7 — Dukungan","Klausul 8 — Operasi (Pelaksanaan Proyek)","Klausul 9 — Evaluasi Kinerja","Klausul 10 — Peningkatan"];

export default function PanduanISO9001() {
  const [skalaPer, setSkalaPer] = useState("");
  const [jenisKonstruksi, setJenisKonstruksi] = useState("");
  const [statusSMM, setStatusSMM] = useState("");
  const [targetSertif, setTargetSertif] = useState("");
  const [fokusKlausul, setFokusKlausul] = useState<string[]>([]);
  const [panduan, setPanduan] = useState<PanduanISO | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleFokus(v: string) { setFokusKlausul(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }

  async function generate() {
    if (!jenisKonstruksi || !skalaPer || !statusSMM) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/panduan-iso-9001", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skalaPer, jenisKonstruksi, statusSMM, targetSertif, fokusKlausul }),
      });
      setPanduan(await r.json());
    } catch { }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/10"><CheckSquare className="h-6 w-6 text-indigo-400" /></div>
          <div><h1 className="text-2xl font-bold">Panduan Penerapan ISO 9001:2015 Konstruksi</h1><p className="text-slate-400 text-sm">Roadmap implementasi QMS, klausul per klausul, dokumen wajib, & indikator kesesuaian</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-indigo-400 border-indigo-400/30">Gelombang 18</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {!panduan ? (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Jenis Perusahaan Konstruksi</Label>
                <Select value={jenisKonstruksi} onValueChange={setJenisKonstruksi}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis..." /></SelectTrigger>
                  <SelectContent>{JENIS_KONSTRUKSI.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Skala Perusahaan</Label>
                <Select value={skalaPer} onValueChange={setSkalaPer}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih skala..." /></SelectTrigger>
                  <SelectContent>{SKALA_PERUSAHAAN.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Status SMM Saat Ini</Label>
                <Select value={statusSMM} onValueChange={setStatusSMM}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                  <SelectContent>{STATUS_SMM.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Target Sertifikasi (opsional)</Label>
                <Input placeholder="cth: Desember 2026 / 6 bulan lagi" value={targetSertif} onChange={e => setTargetSertif(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <div className="space-y-3"><Label className="text-slate-300">Klausul yang Difokuskan (opsional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{FOKUS_KLAUSUL.map(f => (
                <label key={f} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-indigo-500/40 cursor-pointer transition-colors">
                  <Checkbox checked={fokusKlausul.includes(f)} onCheckedChange={() => toggleFokus(f)} className="border-slate-500" />
                  <span className="text-sm text-slate-300">{f}</span>
                </label>
              ))}</div>
            </div>
            <Button onClick={generate} disabled={loading || !jenisKonstruksi || !skalaPer || !statusSMM} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? "Generating panduan ISO 9001..." : "Generate Panduan ISO 9001:2015 →"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <Button size="sm" variant="outline" onClick={() => setPanduan(null)} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ubah Parameter</Button>

            <Card className="bg-indigo-500/5 border-indigo-500/30 p-5">
              <p className="text-slate-200 text-sm leading-relaxed">{panduan.ringkasan}</p>
            </Card>

            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-400" />Panduan per Klausul</h3>
              <div className="space-y-3">{panduan.klausulUtama.map((k, i) => (
                <Card key={i} className="bg-slate-900 border-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded">{k.klausul}</span>
                    <h4 className="font-semibold text-white">{k.judul}</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{k.persyaratan}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-800 rounded p-3">
                      <div className="text-xs font-semibold text-indigo-400 mb-2">Langkah Implementasi</div>
                      <ul className="space-y-1">{k.implementasi.map((im, j) => <li key={j} className="text-xs text-slate-300 flex gap-1"><CheckCircle2 className="h-3 w-3 text-indigo-400 flex-shrink-0 mt-0.5" />{im}</li>)}</ul>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <div className="text-xs font-semibold text-emerald-400 mb-2">Dokumen Wajib</div>
                      <ul className="space-y-1">{k.dokumenWajib.map((d, j) => <li key={j} className="text-xs text-slate-300 flex gap-1"><FileText className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{d}</li>)}</ul>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <div className="text-xs font-semibold text-amber-400 mb-2">Indikator Kesesuaian</div>
                      <p className="text-xs text-slate-300">{k.indikatorKesesuaian}</p>
                    </div>
                  </div>
                </Card>
              ))}</div>
            </div>

            <Card className="bg-slate-900 border-slate-700 p-5">
              <h3 className="font-semibold text-white mb-4">Roadmap Implementasi</h3>
              <div className="space-y-3">{panduan.roadmapImplementasi.map((fase, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{i + 1}</div>
                    {i < panduan.roadmapImplementasi.length - 1 && <div className="w-0.5 bg-slate-700 flex-1 mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-white">{fase.fase}</div>
                      <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 text-xs">{fase.durasi}</Badge>
                    </div>
                    <ul className="space-y-1 mb-2">{fase.aktivitas.map((a, j) => <li key={j} className="text-xs text-slate-400 flex gap-1"><span className="text-indigo-400">•</span>{a}</li>)}</ul>
                    <div className="text-xs text-emerald-400">Output: {fase.output}</div>
                  </div>
                </div>
              ))}</div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">Dokumen Sistem Mutu Wajib</h3>
                <ul className="space-y-1">{panduan.dokumenSistem.map((d, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><FileText className="h-4 w-4 text-indigo-400 flex-shrink-0" />{d}</li>)}</ul>
              </Card>
              <Card className="bg-slate-900 border-slate-700 p-5">
                <h3 className="font-semibold text-white mb-3">Tips Sukses Implementasi</h3>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-2 mb-3 text-sm text-indigo-200">{panduan.biayaEstimasi}</div>
                <ul className="space-y-1">{panduan.tipsSukses.map((t, i) => <li key={i} className="text-xs text-slate-300 flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />{t}</li>)}</ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
