import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, FileCheck, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_BA = [
  "Berita Acara Serah Terima Pertama Pekerjaan (PHO)",
  "Berita Acara Serah Terima Akhir Pekerjaan (FHO)",
  "Berita Acara Pemeriksaan Pekerjaan (MC)",
  "Berita Acara Serah Terima Lapangan (STL)",
  "Berita Acara Perubahan Pekerjaan / Addendum",
  "Berita Acara Opname Pekerjaan di Lapangan",
  "Berita Acara Rapat Koordinasi Lapangan",
  "Berita Acara Penghentian Pekerjaan Sementara",
  "Berita Acara Pemutusan Kontrak",
  "Berita Acara Penerimaan Material/Barang",
  "Berita Acara Pengujian/Testing Pekerjaan",
  "Berita Acara Kemajuan Pekerjaan (Bulanan)",
];

interface HasilBA {
  nomorBA: string;
  judulBA: string;
  perihal: string;
  dasar: string[];
  isiBA: string;
  kondisiPekerjaan: string[];
  kewajiban: string[];
  catatan: string;
  pihakTTD: { jabatan: string; nama: string; instansi: string }[];
}

export default function GeneratorBeritaAcara() {
  const [jenisBA, setJenisBA] = useState(JENIS_BA[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [nomorKontrak, setNomorKontrak] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [konteksBA, setKonteksBA] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilBA | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-berita-acara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisBA, namaProyek, nomorKontrak, tanggal, konteksBA }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { /**/ } finally { setLoading(false); }
  }

  function copyAll() {
    if (!hasil) return;
    const text = [
      `BERITA ACARA`,
      `Nomor: ${hasil.nomorBA}`,
      `Perihal: ${hasil.perihal}`,
      "",
      hasil.isiBA,
      "",
      "Yang bertanda tangan di bawah ini:",
      ...hasil.pihakTTD.map(p => `• ${p.jabatan} — ${p.nama} (${p.instansi})`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <FileCheck className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Berita Acara Proyek</h1>
              <p className="text-slate-400 text-sm">Generate BA formal: PHO, FHO, MC, opname, perubahan, rapat — siap ditandatangani</p>
            </div>
            <Badge className="ml-auto bg-indigo-500/15 text-indigo-400 border-indigo-500/30">Gelombang 23</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Berita Acara *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisBA} onChange={e => setJenisBA(e.target.value)}>
                {JENIS_BA.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Kantor Dinas X" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nomor Kontrak</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 123/KTR/2025" value={nomorKontrak} onChange={e => setNomorKontrak(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tanggal BA</label>
              <input type="date" className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks / Keterangan</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: progress 100%, ada 3 item snagging, dst" value={konteksBA} onChange={e => setKonteksBA(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading || !namaProyek.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Berita Acara...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Berita Acara</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun berita acara...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="text-white font-bold text-lg uppercase tracking-wide">BERITA ACARA</div>
                  <div className="text-indigo-300 font-semibold mt-0.5">{hasil.judulBA}</div>
                  <div className="text-slate-400 text-sm mt-0.5">Nomor: {hasil.nomorBA}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Tanggal: {tanggal}</div>
                </div>
                <Button onClick={copyAll} variant="outline" size="sm" className="border-indigo-500/40 text-indigo-300 shrink-0 ml-4">
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>

              <div className="border-t border-slate-700/50 pt-4 mb-4">
                <div className="text-slate-400 text-xs mb-1 font-medium">PERIHAL</div>
                <p className="text-slate-200 text-sm">{hasil.perihal}</p>
              </div>

              <div className="mb-4">
                <div className="text-slate-400 text-xs mb-1 font-medium">DASAR</div>
                <ul className="space-y-0.5">{hasil.dasar.map((d, i) => <li key={i} className="text-slate-300 text-sm">{i+1}. {d}</li>)}</ul>
              </div>

              <div className="mb-4">
                <div className="text-slate-400 text-xs mb-2 font-medium">ISI BERITA ACARA</div>
                <div className="bg-slate-800/60 rounded-lg p-4">
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{hasil.isiBA}</p>
                </div>
              </div>

              {hasil.kondisiPekerjaan.length > 0 && (
                <div className="mb-4">
                  <div className="text-slate-400 text-xs mb-1 font-medium">KONDISI PEKERJAAN</div>
                  <ul className="space-y-0.5">{hasil.kondisiPekerjaan.map((k, i) => <li key={i} className="text-slate-300 text-sm">• {k}</li>)}</ul>
                </div>
              )}

              {hasil.kewajiban.length > 0 && (
                <div className="mb-4">
                  <div className="text-orange-400 text-xs mb-1 font-medium">KEWAJIBAN / TINDAK LANJUT</div>
                  <ul className="space-y-0.5">{hasil.kewajiban.map((k, i) => <li key={i} className="text-slate-300 text-sm">• {k}</li>)}</ul>
                </div>
              )}

              {hasil.catatan && (
                <div className="mb-4 bg-amber-900/20 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-amber-300 text-xs font-medium mb-1">CATATAN</div>
                  <p className="text-slate-300 text-sm">{hasil.catatan}</p>
                </div>
              )}

              <div className="border-t border-slate-700/50 pt-4">
                <div className="text-slate-400 text-xs mb-3 font-medium">YANG BERTANDA TANGAN DI BAWAH INI</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hasil.pihakTTD.map((p, i) => (
                    <div key={i} className="text-center">
                      <div className="h-12 border-b border-slate-600 mb-2"></div>
                      <div className="text-slate-300 text-xs font-medium">{p.jabatan}</div>
                      <div className="text-slate-400 text-xs">{p.nama || "( _________________ )"}</div>
                      <div className="text-slate-500 text-xs">{p.instansi}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
