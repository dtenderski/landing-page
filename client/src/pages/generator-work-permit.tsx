import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShieldAlert, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN_BERISIKO = [
  "Pekerjaan di Ketinggian (>1.8m) — Working at Height",
  "Pekerjaan di Ruang Terbatas — Confined Space Entry",
  "Pekerjaan Panas / Hot Work (las, gerinda, cutting)",
  "Pekerjaan Listrik Tegangan Tinggi / LOTO",
  "Pekerjaan Penggalian >1.5m (Excavation Permit)",
  "Pekerjaan Pengangkatan Kritis — Critical Lifting",
  "Pekerjaan Demolisi / Pembongkaran Struktur",
  "Pekerjaan Malam Hari (Night Work)",
  "Pekerjaan di Atas / Dekat Air (Marine / Waterfront)",
  "Pekerjaan dengan Bahan Kimia Berbahaya (B3/MSDS)",
  "Pekerjaan Radiasi / Uji NDT",
  "Pekerjaan Blasting / Peledakan",
];

const TIPE_OUTPUT = [
  "Work Permit Form + JSA Lengkap",
  "Hanya Work Permit Form",
  "Hanya JSA (Job Safety Analysis)",
  "Checklist Pre-Task Safety Briefing",
];

interface JSAStep {
  langkah: string;
  bahaya: string[];
  risikoAwal: string;
  pengendalian: string[];
  risikoSisa: string;
  pic: string;
}

interface HasilWorkPermit {
  judul: string;
  nomorPermit: string;
  lingkupPekerjaan: string;
  persyaratanIzin: string[];
  apd: string[];
  jsaSteps: JSAStep[];
  emergencyProcedure: string[];
  persetujuan: { jabatan: string; kewenangan: string }[];
  validitasIzin: string;
  catatanKhusus: string;
}

export default function GeneratorWorkPermit() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState(JENIS_PEKERJAAN_BERISIKO[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [pelaksana, setPelaksana] = useState("");
  const [tipeOutput, setTipeOutput] = useState(TIPE_OUTPUT[0]);
  const [kondisiKhusus, setKondisiKhusus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilWorkPermit | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/work-permit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, namaProyek, lokasi, tanggal, pelaksana, tipeOutput, kondisiKhusus }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch {
      setHasil(null);
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!hasil) return;
    const lines = [
      `WORK PERMIT / IZIN KERJA`,
      `No: ${hasil.nomorPermit}`,
      `Judul: ${hasil.judul}`,
      "",
      `LINGKUP PEKERJAAN`,
      hasil.lingkupPekerjaan,
      "",
      `PERSYARATAN IZIN`,
      ...hasil.persyaratanIzin.map(p => `• ${p}`),
      "",
      `APD WAJIB`,
      ...hasil.apd.map(a => `• ${a}`),
      "",
      `JSA — ANALISIS KESELAMATAN KERJA`,
      ...hasil.jsaSteps.map((j, i) => [
        `${i + 1}. ${j.langkah}`,
        `   Bahaya: ${j.bahaya.join(", ")}`,
        `   Risiko Awal: ${j.risikoAwal}`,
        `   Pengendalian: ${j.pengendalian.join("; ")}`,
        `   Risiko Sisa: ${j.risikoSisa}`,
      ].join("\n")),
      "",
      `PROSEDUR DARURAT`,
      ...hasil.emergencyProcedure.map(e => `• ${e}`),
      "",
      `Validitas: ${hasil.validitasIzin}`,
      `Catatan: ${hasil.catatanKhusus}`,
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const RISIKO_COLOR: Record<string, string> = {
    "Tinggi": "text-red-400 bg-red-500/10",
    "Sedang": "text-orange-400 bg-orange-500/10",
    "Rendah": "text-green-400 bg-green-500/10",
    "Ekstrim": "text-red-500 bg-red-600/15",
  };
  function risikoClass(r: string) {
    for (const k of Object.keys(RISIKO_COLOR)) {
      if (r.toLowerCase().includes(k.toLowerCase())) return RISIKO_COLOR[k];
    }
    return "text-slate-300 bg-slate-700/30";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <ShieldAlert className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Work Permit & JSA</h1>
              <p className="text-slate-400 text-sm">Izin kerja formal + Job Safety Analysis untuk pekerjaan berisiko tinggi</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 20</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pekerjaan Berisiko *</label>
              <select
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPekerjaan}
                onChange={e => setJenisPekerjaan(e.target.value)}
              >
                {JENIS_PEKERJAAN_BERISIKO.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Proyek Tower Residensial ABC"
                value={namaProyek}
                onChange={e => setNamaProyek(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Lokasi / Area Kerja</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Lantai 12 - Area Kolom K-7 s/d K-12"
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tanggal Kerja</label>
              <input
                type="date"
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Pelaksana / Tim</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Tim Bekisting - Mandor Budi (8 orang)"
                value={pelaksana}
                onChange={e => setPelaksana(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tipe Output</label>
              <select
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tipeOutput}
                onChange={e => setTipeOutput(e.target.value)}
              >
                {TIPE_OUTPUT.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kondisi / Catatan Khusus</label>
              <textarea
                rows={2}
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 resize-none"
                placeholder="cth: pekerjaan malam hari, cuaca hujan, dekat utilitas existing, dll."
                value={kondisiKhusus}
                onChange={e => setKondisiKhusus(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={generate}
              disabled={loading || !namaProyek.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Work Permit...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Work Permit + JSA</>}
            </Button>
            {hasil && (
              <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun work permit & JSA…</p>
            <p className="text-slate-500 text-sm mt-1">Identifikasi bahaya, pengendalian risiko, APD, prosedur darurat</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-orange-300 text-xs font-mono mb-1">IZIN KERJA NO. {hasil.nomorPermit}</div>
                  <h2 className="text-white font-bold text-lg">{hasil.judul}</h2>
                  <div className="text-slate-400 text-sm mt-1">Validitas: {hasil.validitasIzin}</div>
                </div>
                <Button onClick={copyAll} variant="outline" size="sm" className="border-orange-500/40 text-orange-300 shrink-0">
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>
              <p className="text-slate-300 text-sm">{hasil.lingkupPekerjaan}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-orange-300 font-semibold mb-3">Persyaratan Izin</h3>
                <ul className="space-y-1.5">
                  {hasil.persyaratanIzin.map((p, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-orange-300 font-semibold mb-3">APD Wajib</h3>
                <ul className="space-y-1.5">
                  {hasil.apd.map((a, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-orange-400 shrink-0">▪</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-orange-300 font-semibold mb-4">JSA — Job Safety Analysis</h3>
              <div className="space-y-4">
                {hasil.jsaSteps.map((step, i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-xs text-orange-300 font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{step.langkah}</div>
                        <div className="text-slate-500 text-xs mt-0.5">PIC: {step.pic}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${risikoClass(step.risikoAwal)}`}>R.Awal: {step.risikoAwal}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${risikoClass(step.risikoSisa)}`}>R.Sisa: {step.risikoSisa}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 ml-9">
                      <div>
                        <div className="text-red-400 text-xs font-medium mb-1">Bahaya Teridentifikasi</div>
                        <ul className="space-y-0.5">{step.bahaya.map((b, j) => <li key={j} className="text-slate-300 text-xs">• {b}</li>)}</ul>
                      </div>
                      <div>
                        <div className="text-green-400 text-xs font-medium mb-1">Pengendalian</div>
                        <ul className="space-y-0.5">{step.pengendalian.map((p, j) => <li key={j} className="text-slate-300 text-xs">• {p}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-red-400 font-semibold mb-3">Prosedur Darurat / Emergency</h3>
              <ul className="space-y-1.5">
                {hasil.emergencyProcedure.map((e, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {e}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Persetujuan & Tandatangan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {hasil.persetujuan.map((p, i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3 text-center">
                    <div className="h-8 border-b border-slate-600 mb-2"></div>
                    <div className="text-white text-xs font-medium">{p.jabatan}</div>
                    <div className="text-slate-500 text-xs">{p.kewenangan}</div>
                  </div>
                ))}
              </div>
              {hasil.catatanKhusus && (
                <p className="text-slate-400 text-xs mt-3 italic">{hasil.catatanKhusus}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
