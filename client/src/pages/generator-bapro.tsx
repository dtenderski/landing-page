import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileBarChart, Copy,
  CheckCircle2, Info, RotateCcw, ChevronDown
} from "lucide-react";
import { Link } from "wouter";

const JENIS_KONTRAK = [
  "Kontrak Harga Satuan (Unit Price)",
  "Kontrak Lump Sum",
  "Kontrak Terima Jadi (Turnkey)",
  "Kontrak Biaya Plus Fee (Cost Plus)",
];
const PERIODE = [
  "Bulanan (Monthly Progress)", "Mingguan (Weekly Progress)",
  "Termin ke-1 (30%)", "Termin ke-2 (60%)", "Termin ke-3 (90%)",
  "Serah Terima Pertama (100%)",
];

interface HasilBAPRO {
  judul: string; nomor: string; tanggal: string; periode: string;
  ringkasan: string;
  bagian: {
    dataPekerjaan: string;
    kemajuanFisik: string;
    rincianPekerjaan: string;
    statusPembayaran: string;
    kendalaDanSolusi: string;
    rencanaMingguDepan: string;
    penutup: string;
  };
  tabelKemajuan: { item: string; bobot: string; realisasi: string; keterangan: string }[];
  dokumenLampiran: string[];
}

export default function GeneratorBAPRO() {
  const [namaProyek, setNamaProyek] = useState("");
  const [jenisKontrak, setJenisKontrak] = useState(JENIS_KONTRAK[0]);
  const [periode, setPeriode] = useState(PERIODE[0]);
  const [persenFisik, setPersenFisik] = useState(45);
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [kendala, setKendala] = useState("");
  const [result, setResult] = useState<HasilBAPRO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openBagian, setOpenBagian] = useState<Set<string>>(new Set(["kemajuan", "rincian"]));

  function toggle(k: string) { setOpenBagian(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  async function generate() {
    if (!namaProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-bapro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaProyek, jenisKontrak, periode, persenFisik, nilaiKontrak, kendala }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenBagian(new Set(["kemajuan", "rincian"]));
    } catch (e: any) { setError(e.message || "Gagal generate BAPRO."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const b = result.bagian;
    navigator.clipboard.writeText([result.judul, result.nomor, result.tanggal, result.ringkasan, ...Object.values(b)].join("\n\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const BAGIAN_LIST: [string, string, string][] = result ? [
    ["dataPekerjaan", "Data Pekerjaan & Kontrak", result.bagian.dataPekerjaan],
    ["kemajuan", "Kemajuan Pekerjaan Fisik", result.bagian.kemajuanFisik],
    ["rincian", "Rincian Pekerjaan Periode Ini", result.bagian.rincianPekerjaan],
    ["pembayaran", "Status Pembayaran & Termin", result.bagian.statusPembayaran],
    ["kendala", "Kendala & Solusi", result.bagian.kendalaDanSolusi],
    ["rencana", "Rencana Periode Berikutnya", result.bagian.rencanaMingguDepan],
    ["penutup", "Penutup & Tanda Tangan", result.bagian.penutup],
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-green-400" /> Generator BAPRO — Berita Acara Kemajuan
            </h1>
            <p className="text-xs text-slate-400">Draft laporan kemajuan pekerjaan (progress report) formal untuk pelaporan ke Owner / PPK</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-xs text-green-300">BAPRO adalah dasar pencairan termin kontrak. Draft ini perlu disesuaikan dengan data aktual proyek, kurva-S, dan format yang disyaratkan dokumen kontrak Anda.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Paket / Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Gedung Rawat Inap RSUD Kab. Sukabumi"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jenis Kontrak</label>
                  <select value={jenisKontrak} onChange={e => setJenisKontrak(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {JENIS_KONTRAK.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Periode Laporan</label>
                  <select value={periode} onChange={e => setPeriode(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {PERIODE.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Kemajuan Fisik Saat Ini (%)</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPersenFisik(p => Math.max(0, p - 5))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">−</button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-green-400">{persenFisik}</span>
                      <span className="text-slate-400 text-sm">%</span>
                    </div>
                    <button onClick={() => setPersenFisik(p => Math.min(100, p + 5))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">+</button>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${persenFisik}%` }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak <span className="text-slate-600">(opt)</span></label>
                  <input value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)}
                    placeholder="cth: Rp 8.500.000.000"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kendala / Hambatan <span className="text-slate-600">(opsional)</span></label>
                <input value={kendala} onChange={e => setKendala(e.target.value)}
                  placeholder="cth: keterlambatan material baja karena banjir, curah hujan tinggi"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!namaProyek || loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating BAPRO...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate BAPRO</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judul}</p>
                  <p className="text-[10px] text-slate-500">{result.nomor} · {result.tanggal} · {result.periode}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-300">{result.ringkasan}</p>
            </div>

            {result.tabelKemajuan?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3 overflow-x-auto">
                <p className="text-xs text-green-400 font-semibold mb-2">Tabel Kemajuan Pekerjaan</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/8">{["Item Pekerjaan","Bobot (%)","Realisasi (%)","Keterangan"].map(h => <th key={h} className="text-left text-slate-500 py-1.5 pr-3">{h}</th>)}</tr></thead>
                  <tbody>{result.tabelKemajuan.map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-1.5 pr-3 text-slate-300">{r.item}</td>
                      <td className="py-1.5 pr-3 text-slate-400">{r.bobot}</td>
                      <td className="py-1.5 pr-3"><span className="text-green-400 font-semibold">{r.realisasi}</span></td>
                      <td className="py-1.5 text-slate-500">{r.keterangan}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {BAGIAN_LIST.map(([key, title, content]) => content && (
                <div key={key} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggle(key)} className="w-full flex items-center justify-between p-3.5">
                    <p className="text-sm text-white font-medium">{title}</p>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openBagian.has(key) ? "rotate-180" : ""}`} />
                  </button>
                  {openBagian.has(key) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3">
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
                <Link href="/generator-bast-proyek">Generator BAST →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
