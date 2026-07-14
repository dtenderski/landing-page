import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, AlertOctagon, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_TEMUAN = [
  "NCR Major — Ketidaksesuaian Mutu Beton (strength test gagal)",
  "NCR Major — Penulangan Tidak Sesuai Gambar",
  "NCR Minor — Dimensi Elemen Tidak Toleransi",
  "NCR Minor — Sambungan Las Tidak Standar",
  "NCR Major — APD Tidak Dipakai (K3 Critical)",
  "NCR Minor — Prosedur Cor Tidak Sesuai SOP",
  "NCR Major — Material Tidak Bersertifikat/Reject",
  "NCR Minor — Rekaman/Dokumentasi Tidak Lengkap",
  "OFI — Proses Baik, Ada Peluang Perbaikan",
  "NCR Major — Deviasi Geometrik Melebihi Toleransi",
  "NCR Minor — Mix Design Tidak Diverifikasi",
  "Observation — Tren Negatif Perlu Dipantau",
];

const STANDAR_ACUAN = [
  "SNI 2847:2019 (Beton Struktural)",
  "SNI 1729:2020 (Baja Struktural)",
  "SNI 7395 (Pekerjaan Tanah)",
  "ISO 9001:2015 (QMS)",
  "ISO 45001:2018 (SMK3)",
  "CSMS Pertamina",
  "Spesifikasi Teknis Kontrak",
  "ITP / QC Plan Proyek",
];

interface HasilNCR {
  nomorNCR: string;
  tanggalTemuan: string;
  judulNCR: string;
  jenisKetidaksesuaian: string;
  standar: string;
  klausulDilanggar: string;
  deskripsiTemuan: string;
  buktiObjektif: string[];
  lokasiTemuan: string;
  picAuditee: string;
  picAuditor: string;
  dampakPotensial: string;
  analisisAkarMasalah: { metode: string; hasilAnalisis: string[] };
  tindakanPerbaikan: { tindakan: string; penanggungjawab: string; deadline: string }[];
  tindakanPencegahan: string[];
  verifikasi: { item: string; metode: string; batas: string }[];
  statusNCR: string;
  catatanPenting: string[];
}

export default function GeneratorNCRReport() {
  const [jenisTemuan, setJenisTemuan] = useState(JENIS_TEMUAN[0]);
  const [standarAcuan, setStandarAcuan] = useState(STANDAR_ACUAN[0]);
  const [lokasiPekerjaan, setLokasiPekerjaan] = useState("");
  const [deskripsiSingkat, setDeskripsiSingkat] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilNCR | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-ncr-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisTemuan, standarAcuan, lokasiPekerjaan, deskripsiSingkat }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyNCR() {
    if (!hasil) return;
    const txt = [
      `NCR REPORT: ${hasil.nomorNCR}`,
      `Tanggal: ${hasil.tanggalTemuan}`,
      `Judul: ${hasil.judulNCR}`,
      `Jenis: ${hasil.jenisKetidaksesuaian}`,
      `Klausul: ${hasil.klausulDilanggar}`,
      "",
      `DESKRIPSI TEMUAN:`,
      hasil.deskripsiTemuan,
      "",
      `BUKTI OBJEKTIF:`,
      ...hasil.buktiObjektif.map(b => `• ${b}`),
      "",
      `TINDAKAN PERBAIKAN:`,
      ...hasil.tindakanPerbaikan.map(t => `• ${t.tindakan} — PIC: ${t.penanggungjawab} | ${t.deadline}`),
    ].join("\n");
    navigator.clipboard.writeText(txt);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const WARNA_NCR: Record<string, { bg: string; text: string; border: string }> = {
    "NCR Major": { bg: "bg-red-900/20", text: "text-red-300", border: "border-red-500/30" },
    "NCR Minor": { bg: "bg-orange-900/20", text: "text-orange-300", border: "border-orange-500/30" },
    "OFI": { bg: "bg-blue-900/20", text: "text-blue-300", border: "border-blue-500/30" },
    "Observation": { bg: "bg-slate-800/40", text: "text-slate-300", border: "border-slate-600/30" },
  };

  const jenisNCRKey = jenisTemuan.split(" — ")[0];
  const warnaNCR = WARNA_NCR[jenisNCRKey] ?? WARNA_NCR["NCR Minor"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20"><AlertOctagon className="h-6 w-6 text-red-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator NCR / CAR Report</h1>
              <p className="text-slate-400 text-sm">Generate Non-Conformance Report formal — deskripsi, bukti objektif, akar masalah, tindakan perbaikan & pencegahan</p>
            </div>
            <Badge className="ml-auto bg-red-500/15 text-red-400 border-red-500/30">Gelombang 26</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Temuan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisTemuan} onChange={e => setJenisTemuan(e.target.value)}>
                {JENIS_TEMUAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Standar/Dokumen Acuan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={standarAcuan} onChange={e => setStandarAcuan(e.target.value)}>
                {STANDAR_ACUAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Lokasi/Area Pekerjaan (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Lantai 3 Kolom K-12, Area Galian STA 1+200" value={lokasiPekerjaan} onChange={e => setLokasiPekerjaan(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Deskripsi Singkat Temuan (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: hasil test beton umur 28 hari menunjukkan fc'=19 MPa, persyaratan min fc'=25 MPa" value={deskripsiSingkat} onChange={e => setDeskripsiSingkat(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun NCR Report...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate NCR Report</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center"><Loader2 className="h-8 w-8 text-red-400 animate-spin mx-auto mb-3" /><p className="text-slate-300">Menyusun NCR / CAR Report...</p></div>}

        {hasil && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${warnaNCR.bg} ${warnaNCR.text} ${warnaNCR.border}`}>{hasil.jenisKetidaksesuaian}</span>
                  <span className="text-slate-400 text-xs font-mono">{hasil.nomorNCR}</span>
                  <span className="text-slate-500 text-xs">{hasil.tanggalTemuan}</span>
                </div>
                <h2 className="text-white font-bold">{hasil.judulNCR}</h2>
              </div>
              <Button onClick={copyNCR} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Tersalin!" : "Salin NCR"}
              </Button>
            </div>

            <div className={`rounded-xl border p-4 space-y-3 ${warnaNCR.bg} ${warnaNCR.border}`}>
              <div>
                <div className={`text-xs font-medium mb-0.5 ${warnaNCR.text}`}>Deskripsi Temuan</div>
                <p className="text-slate-300 text-sm">{hasil.deskripsiTemuan}</p>
              </div>
              <div>
                <div className={`text-xs font-medium mb-0.5 ${warnaNCR.text}`}>Klausul / Referensi Dilanggar</div>
                <p className="text-slate-300 text-sm">{hasil.klausulDilanggar}</p>
              </div>
              <div>
                <div className={`text-xs font-medium mb-1 ${warnaNCR.text}`}>Bukti Objektif</div>
                <ul className="space-y-0.5">{hasil.buktiObjektif.map((b, i) => <li key={i} className="text-slate-300 text-xs">• {b}</li>)}</ul>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Lokasi:</span> <span className="text-slate-300">{hasil.lokasiTemuan}</span></div>
                <div><span className="text-slate-500">PIC Auditee:</span> <span className="text-slate-300">{hasil.picAuditee}</span></div>
                <div><span className="text-slate-500">Auditor:</span> <span className="text-slate-300">{hasil.picAuditor}</span></div>
                <div><span className="text-slate-500">Dampak:</span> <span className="text-orange-300">{hasil.dampakPotensial}</span></div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-slate-200 font-medium text-sm mb-2">Analisis Akar Masalah ({hasil.analisisAkarMasalah.metode})</div>
              <ul className="space-y-1">{hasil.analisisAkarMasalah.hasilAnalisis.map((a, i) => <li key={i} className="text-slate-300 text-xs">• {a}</li>)}</ul>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-slate-200 font-medium text-sm mb-2">Tindakan Perbaikan (Corrective Action)</div>
              <div className="space-y-1.5">
                {hasil.tindakanPerbaikan.map((t, i) => (
                  <div key={i} className="bg-slate-800/60 rounded p-2 text-xs">
                    <div className="text-green-300 font-medium">✓ {t.tindakan}</div>
                    <div className="text-slate-400">PIC: {t.penanggungjawab} | Deadline: {t.deadline}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-slate-200 font-medium text-sm mb-2">Tindakan Pencegahan (Preventive Action)</div>
              <ul className="space-y-1">{hasil.tindakanPencegahan.map((t, i) => <li key={i} className="text-slate-300 text-xs">• {t}</li>)}</ul>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-slate-200 font-medium text-sm mb-2">Verifikasi Penutupan NCR</div>
              <div className="space-y-1.5">
                {hasil.verifikasi.map((v, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-blue-300 min-w-32">{v.item}</span>
                    <span className="text-slate-400">Metode: {v.metode}</span>
                    <span className="text-amber-300">Batas: {v.batas}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
