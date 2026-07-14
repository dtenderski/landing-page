import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ScrollText, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_DOKUMEN = [
  "SPK — Surat Perintah Kerja",
  "Kontrak Pekerjaan Konstruksi (Lumpsum)",
  "Kontrak Pekerjaan Konstruksi (Unit Price/Harga Satuan)",
  "MOU / Nota Kesepahaman",
  "Perjanjian Subkontraktor",
  "Perjanjian Konsultansi Pengawasan",
  "Surat Perjanjian Sewa Alat Berat",
  "Perjanjian Pengadaan Material",
  "Perjanjian Kerja Sama (Joint Operation)",
  "Addendum / Amandemen Kontrak",
];

const SUMBER_DANA = [
  "APBN / APBD (Pemerintah)",
  "Dana Swasta / Perusahaan",
  "Dana Campuran (Publik-Swasta)",
  "Dana Pinjaman / Hibah Luar Negeri",
];

interface HasilSPK {
  nomorDokumen: string;
  judul: string;
  pembukaan: string;
  pihak: { posisi: string; nama: string; jabatan: string; perusahaan: string }[];
  pasal: { nomorPasal: number; judul: string; isi: string }[];
  penutup: string;
  klausulKhusus: string[];
  lampiranWajib: string[];
}

export default function GeneratorSPKKontrak() {
  const [jenisDok, setJenisDok] = useState(JENIS_DOKUMEN[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [durasiPekerjaan, setDurasiPekerjaan] = useState("90");
  const [sumberDana, setSumberDana] = useState(SUMBER_DANA[0]);
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilSPK | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedPasal, setExpandedPasal] = useState<number | null>(1);

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-spk-kontrak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisDok, namaProyek, nilaiKontrak, durasiPekerjaan, sumberDana, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyAll() {
    if (!hasil) return;
    const text = [
      hasil.judul,
      `No. ${hasil.nomorDokumen}`,
      "",
      hasil.pembukaan,
      "",
      ...hasil.pasal.map(p => `PASAL ${p.nomorPasal}\n${p.judul}\n${p.isi}`),
      "",
      hasil.penutup,
    ].join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <ScrollText className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator SPK & Kontrak Konstruksi</h1>
              <p className="text-slate-400 text-sm">Generate template SPK, kontrak lumpsum/unit price, MOU, subkontrak, perjanjian sewa alat — per klausul formal</p>
            </div>
            <Badge className="ml-auto bg-rose-500/15 text-rose-400 border-rose-500/30">Gelombang 24</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Dokumen *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisDok} onChange={e => setJenisDok(e.target.value)}>
                {JENIS_DOKUMEN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek / Pekerjaan *</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Serbaguna" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Kontrak</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Rp 2.500.000.000" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Durasi Pekerjaan (hari kalender)</label>
              <input type="number" className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={durasiPekerjaan} onChange={e => setDurasiPekerjaan(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Sumber Dana</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={sumberDana} onChange={e => setSumberDana(e.target.value)}>
                {SUMBER_DANA.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kondisi Khusus (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: ada klausul penalti, termination for convenience, retensi 5%, jaminan pelaksanaan, dll" value={konteks} onChange={e => setKonteks(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading || !namaProyek.trim()} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat dokumen kontrak...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Kontrak</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-rose-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun dokumen kontrak...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="text-center flex-1">
                  <div className="text-white font-bold text-lg uppercase tracking-wide">{hasil.judul}</div>
                  <div className="text-rose-300 text-sm mt-0.5">Nomor: {hasil.nomorDokumen}</div>
                </div>
                <Button onClick={copyAll} variant="outline" size="sm" className="border-rose-500/40 text-rose-300 shrink-0 ml-4">
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>

              <div className="mb-4 bg-slate-800/60 rounded-lg p-4">
                <p className="text-slate-300 text-sm leading-relaxed">{hasil.pembukaan}</p>
              </div>

              <div className="mb-4">
                <div className="text-slate-400 text-xs mb-2 font-medium">PARA PIHAK</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {hasil.pihak.map((p, i) => (
                    <div key={i} className="bg-slate-800/40 rounded-lg p-3">
                      <div className="text-rose-300 text-xs font-bold">{p.posisi}</div>
                      <div className="text-white text-sm font-medium">{p.perusahaan}</div>
                      <div className="text-slate-400 text-xs">{p.jabatan}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {hasil.pasal.map(p => (
                  <div key={p.nomorPasal} className="border border-slate-700/40 rounded-lg overflow-hidden">
                    <button onClick={() => setExpandedPasal(expandedPasal === p.nomorPasal ? null : p.nomorPasal)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 text-left">
                      <span className="text-white text-sm font-medium">PASAL {p.nomorPasal} — {p.judul}</span>
                      <span className="text-slate-500 text-xs">{expandedPasal === p.nomorPasal ? "▲" : "▼"}</span>
                    </button>
                    {expandedPasal === p.nomorPasal && (
                      <div className="px-4 py-3 bg-slate-900/40">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{p.isi}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-4 bg-slate-800/60 rounded-lg p-4">
                <div className="text-slate-400 text-xs mb-1 font-medium">PENUTUP</div>
                <p className="text-slate-300 text-sm leading-relaxed">{hasil.penutup}</p>
              </div>

              {hasil.klausulKhusus.length > 0 && (
                <div className="mb-4 bg-amber-900/15 border border-amber-500/20 rounded-lg p-4">
                  <div className="text-amber-300 text-xs font-medium mb-2">⚑ Klausul Khusus yang Perlu Diperhatikan</div>
                  <ul className="space-y-0.5">{hasil.klausulKhusus.map((k, i) => <li key={i} className="text-slate-300 text-xs">• {k}</li>)}</ul>
                </div>
              )}

              {hasil.lampiranWajib.length > 0 && (
                <div>
                  <div className="text-slate-400 text-xs mb-1 font-medium">LAMPIRAN WAJIB</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {hasil.lampiranWajib.map((l, i) => <div key={i} className="text-slate-300 text-xs">□ {l}</div>)}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">⚠ Template ini untuk referensi. Konsultasikan dengan ahli hukum kontrak konstruksi sebelum digunakan untuk perjanjian resmi bernilai material.</p>
          </div>
        )}
      </div>
    </div>
  );
}
