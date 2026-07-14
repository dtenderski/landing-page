import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, FileBadge, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_BAST = [
  "BAST Pekerjaan Selesai 100% (Penyerahan Pertama / PHO)",
  "BAST Pekerjaan Selesai + Masa Pemeliharaan (FHO)",
  "BAST Pekerjaan Parsial / Termin Pembayaran",
  "BAST Pengadaan Material ke Lapangan",
  "BAST Penyerahan Aset kepada Pemerintah/Instansi",
  "BAST Pembayaran Termin (MC-1/MC-2/MC-N)",
  "BAST Penyelesaian Masa Pemeliharaan",
  "BAST Sub-Kontraktor kepada Kontraktor Utama",
];

const JENIS_PROYEK = [
  "Gedung & Bangunan",
  "Jalan & Jembatan",
  "Irigasi & Drainase",
  "Instalasi MEP",
  "Renovasi / Rehabilitasi",
  "Infrastruktur Utilitas",
];

const SUMBER_ANGGARAN = [
  "APBN (Kementerian/Lembaga)",
  "APBD Provinsi",
  "APBD Kabupaten/Kota",
  "BUMN / BUMD",
  "Swasta / Developer",
];

interface ItemPemeriksaan {
  item: string;
  kondisi: string;
  keterangan: string;
  status: "Sesuai" | "Perlu Perbaikan" | "N/A";
}

interface HasilBAST {
  nomorBAST: string;
  tanggal: string;
  judulBAST: string;
  pihakYangMenyerahkan: string;
  pihakYangMenerima: string;
  dasar: string[];
  uraianPekerjaan: string;
  nilaiKontrak: string;
  realisasiPekerjaan: string;
  daftarPemeriksaan: ItemPemeriksaan[];
  catatanTemuan: string[];
  kewajibanMasaPemeliharaan: string[];
  dokumenYangDiserahkan: string[];
  pernyataanPenerimaan: string;
  syaratDanKetentuan: string[];
  penutup: string;
}

export default function GeneratorBASTKonstruksi() {
  const [jenisBAST, setJenisBAST] = useState(JENIS_BAST[0]);
  const [jenisProyek, setJenisProyek] = useState(JENIS_PROYEK[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [sumberAnggaran, setSumberAnggaran] = useState(SUMBER_ANGGARAN[0]);
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilBAST | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-bast-konstruksi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisBAST, jenisProyek, namaProyek, nilaiKontrak, sumberAnggaran, keterangan }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyBAST() {
    if (!hasil) return;
    const txt = [
      hasil.judulBAST,
      hasil.nomorBAST,
      `Tanggal: ${hasil.tanggal}`,
      "",
      `Pihak Pertama (Menyerahkan): ${hasil.pihakYangMenyerahkan}`,
      `Pihak Kedua (Menerima): ${hasil.pihakYangMenerima}`,
      "",
      `Dasar:`,
      ...hasil.dasar.map(d => `• ${d}`),
      "",
      `Uraian Pekerjaan: ${hasil.uraianPekerjaan}`,
      `Nilai Kontrak: ${hasil.nilaiKontrak}`,
      `Realisasi: ${hasil.realisasiPekerjaan}`,
      "",
      `Dokumen yang Diserahkan:`,
      ...hasil.dokumenYangDiserahkan.map(d => `✓ ${d}`),
      "",
      hasil.pernyataanPenerimaan,
    ].join("\n");
    navigator.clipboard.writeText(txt);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20"><FileBadge className="h-6 w-6 text-violet-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Berita Acara Serah Terima (BAST) Konstruksi</h1>
              <p className="text-slate-400 text-sm">Generate BAST formal PHO/FHO/Parsial/Aset — daftar pemeriksaan, kewajiban pemeliharaan, dokumen serah terima</p>
            </div>
            <Badge className="ml-auto bg-violet-500/15 text-violet-400 border-violet-500/30">Gelombang 26</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis BAST *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisBAST} onChange={e => setJenisBAST(e.target.value)}>
                {JENIS_BAST.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Proyek</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}>
                {JENIS_PROYEK.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Sumber Anggaran</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={sumberAnggaran} onChange={e => setSumberAnggaran(e.target.value)}>
                {SUMBER_ANGGARAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Kantor Dinas PU Kab. X" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Kontrak (Rp)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 4.750.000.000" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Keterangan Tambahan (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: ada temuan minor 3 item, masa pemeliharaan 180 hari, include as-built drawing" value={keterangan} onChange={e => setKeterangan(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun BAST...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate BAST</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center"><Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-3" /><p className="text-slate-300">Menyusun Berita Acara Serah Terima...</p></div>}

        {hasil && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-violet-300 text-xs font-mono">{hasil.nomorBAST} · {hasil.tanggal}</div>
                <h2 className="text-white font-bold">{hasil.judulBAST}</h2>
              </div>
              <Button onClick={copyBAST} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Tersalin!" : "Salin BAST"}
              </Button>
            </div>

            <div className="bg-slate-900/60 border border-violet-500/20 rounded-xl p-5 font-serif space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-0.5">Pihak I — Menyerahkan</div>
                  <div className="text-violet-200 font-medium">{hasil.pihakYangMenyerahkan}</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-0.5">Pihak II — Menerima</div>
                  <div className="text-violet-200 font-medium">{hasil.pihakYangMenerima}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-xs font-bold mb-1">DASAR PELAKSANAAN</div>
                <ul className="space-y-0.5">{hasil.dasar.map((d, i) => <li key={i} className="text-slate-300 text-xs">• {d}</li>)}</ul>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-3">
                <div className="text-slate-400 text-xs font-bold mb-2">URAIAN PEKERJAAN & NILAI</div>
                <p className="text-slate-300 text-sm mb-2">{hasil.uraianPekerjaan}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Nilai Kontrak:</span> <span className="text-green-300 font-medium">{hasil.nilaiKontrak}</span></div>
                  <div><span className="text-slate-500">Realisasi:</span> <span className="text-blue-300 font-medium">{hasil.realisasiPekerjaan}</span></div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-xs font-bold mb-2">DAFTAR PEMERIKSAAN</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-max">
                    <thead><tr className="text-slate-500 border-b border-slate-700/50">{["Item", "Kondisi", "Keterangan", "Status"].map(h => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}</tr></thead>
                    <tbody>
                      {hasil.daftarPemeriksaan.map((p, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          <td className="px-2 py-1.5 text-slate-200">{p.item}</td>
                          <td className="px-2 py-1.5 text-slate-300">{p.kondisi}</td>
                          <td className="px-2 py-1.5 text-slate-400">{p.keterangan}</td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${p.status === "Sesuai" ? "bg-green-900/40 text-green-300" : p.status === "Perlu Perbaikan" ? "bg-orange-900/40 text-orange-300" : "bg-slate-700/40 text-slate-400"}`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {hasil.catatanTemuan.length > 0 && (
                <div className="bg-orange-900/15 border border-orange-500/20 rounded-lg p-3">
                  <div className="text-orange-300 text-xs font-bold mb-1">CATATAN TEMUAN</div>
                  <ul className="space-y-0.5">{hasil.catatanTemuan.map((c, i) => <li key={i} className="text-slate-300 text-xs">• {c}</li>)}</ul>
                </div>
              )}

              <div>
                <div className="text-slate-400 text-xs font-bold mb-1">KEWAJIBAN MASA PEMELIHARAAN</div>
                <ul className="space-y-0.5">{hasil.kewajibanMasaPemeliharaan.map((k, i) => <li key={i} className="text-slate-300 text-xs">{i + 1}. {k}</li>)}</ul>
              </div>

              <div>
                <div className="text-slate-400 text-xs font-bold mb-1">DOKUMEN YANG DISERAHKAN</div>
                <div className="grid grid-cols-2 gap-1">
                  {hasil.dokumenYangDiserahkan.map((d, i) => <div key={i} className="text-xs text-slate-300">✓ {d}</div>)}
                </div>
              </div>

              <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-3">
                <p className="text-slate-300 text-sm italic">{hasil.pernyataanPenerimaan}</p>
              </div>

              <p className="text-slate-400 text-sm">{hasil.penutup}</p>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center">
                  <div className="h-12 border-b border-slate-600 mb-2"></div>
                  <div className="text-slate-400 text-xs">{hasil.pihakYangMenyerahkan}</div>
                  <div className="text-slate-500 text-xs">Pihak I</div>
                </div>
                <div className="text-center">
                  <div className="h-12 border-b border-slate-600 mb-2"></div>
                  <div className="text-slate-400 text-xs">{hasil.pihakYangMenerima}</div>
                  <div className="text-slate-500 text-xs">Pihak II</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
