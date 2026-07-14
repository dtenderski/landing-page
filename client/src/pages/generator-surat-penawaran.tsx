import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileEdit, Copy, CheckCircle2,
  Info, RotateCcw, ChevronDown, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN = [
  "Konstruksi Gedung", "Infrastruktur Jalan & Jembatan",
  "Instalasi Mekanikal-Elektrikal", "Renovasi & Retrofit",
  "Pekerjaan Sipil Khusus", "Proyek EPC / Turnkey",
];
const JENIS_PENGADAAN = [
  "Tender / Pelelangan Umum", "Penunjukan Langsung",
  "Pengadaan Langsung", "Tender Cepat (e-Purchasing)",
];
const BAHASA_OPTIONS = ["Indonesia (formal)", "Indonesia (semi-formal)"];

interface HasilSuratPenawaran {
  judulSurat: string; nomorSurat: string; tanggal: string;
  kop: string;
  perihal: string;
  isiSurat: {
    pembuka: string;
    dataPenawaran: string;
    lingkupPekerjaan: string;
    hargaPenawaran: string;
    jangkaWaktu: string;
    syaratPembayaran: string;
    keunggulan: string;
    penutup: string;
  };
  lampiran: string[];
  catatanTeknis: string[];
}

export default function GeneratorSuratPenawaran() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState("");
  const [jenisPengadaan, setJenisPengadaan] = useState(JENIS_PENGADAAN[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [namaOwner, setNamaOwner] = useState("");
  const [nilaiEstimasi, setNilaiEstimasi] = useState("");
  const [keunggulanPerusahaan, setKeunggulanPerusahaan] = useState("");
  const [result, setResult] = useState<HasilSuratPenawaran | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openSection, setOpenSection] = useState<Set<string>>(new Set(["isi"]));

  function toggle(k: string) { setOpenSection(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  const isValid = jenisPekerjaan && namaProyek;

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-surat-penawaran", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, jenisPengadaan, namaProyek, namaOwner, nilaiEstimasi, keunggulanPerusahaan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenSection(new Set(["isi"]));
    } catch (e: any) { setError(e.message || "Gagal generate surat."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const r = result.isiSurat;
    const text = `${result.kop}\n\n${result.nomorSurat}\n${result.tanggal}\n\nHal: ${result.perihal}\n\n${r.pembuka}\n\n${r.dataPenawaran}\n\n${r.lingkupPekerjaan}\n\n${r.hargaPenawaran}\n\n${r.jangkaWaktu}\n\n${r.syaratPembayaran}\n\n${r.keunggulan}\n\n${r.penutup}\n\nLampiran:\n${result.lampiran.map((l, i) => `${i+1}. ${l}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-violet-400" /> Generator Surat Penawaran Proyek
            </h1>
            <p className="text-xs text-slate-400">Draft surat penawaran teknis & harga untuk tender atau pengadaan langsung konstruksi</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">Draft yang dihasilkan adalah titik awal — sesuaikan dengan data aktual perusahaan, nilai penawaran final, dan ketentuan dokumen pengadaan sebelum dikirim.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan *</label>
                  <select value={jenisPekerjaan} onChange={e => setJenisPekerjaan(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="">Pilih...</option>
                    {JENIS_PEKERJAAN.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jenis Pengadaan</label>
                  <select value={jenisPengadaan} onChange={e => setJenisPengadaan(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                    {JENIS_PENGADAAN.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Paket / Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Gedung Kantor Bupati Kab. Cianjur"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Instansi / Owner <span className="text-slate-600">(opsional)</span></label>
                  <input value={namaOwner} onChange={e => setNamaOwner(e.target.value)}
                    placeholder="cth: Dinas PU Kab. Cianjur"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Estimasi Nilai <span className="text-slate-600">(opsional)</span></label>
                  <input value={nilaiEstimasi} onChange={e => setNilaiEstimasi(e.target.value)}
                    placeholder="cth: Rp 4.200.000.000"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Keunggulan Perusahaan <span className="text-slate-600">(opsional — akan dimasukkan ke surat)</span></label>
                <input value={keunggulanPerusahaan} onChange={e => setKeunggulanPerusahaan(e.target.value)}
                  placeholder="cth: 15 tahun pengalaman gedung bertingkat, ISO 9001 tersertifikasi, Tim SKK lengkap"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating surat penawaran...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Surat Penawaran</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulSurat}</p>
                  <p className="text-[10px] text-slate-500">{result.nomorSurat} · {result.tanggal}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Hal: {result.perihal}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
            </div>

            {[
              ["isi", "Isi Surat", [
                ["Pembuka", result.isiSurat.pembuka],
                ["Data Penawaran", result.isiSurat.dataPenawaran],
                ["Lingkup Pekerjaan", result.isiSurat.lingkupPekerjaan],
                ["Harga Penawaran", result.isiSurat.hargaPenawaran],
                ["Jangka Waktu", result.isiSurat.jangkaWaktu],
                ["Syarat Pembayaran", result.isiSurat.syaratPembayaran],
                ["Keunggulan Perusahaan", result.isiSurat.keunggulan],
                ["Penutup", result.isiSurat.penutup],
              ]],
            ].map(([key, title, items]) => (
              <div key={key as string} className="rounded-xl border border-white/8 bg-white/2 mb-3">
                <button onClick={() => toggle(key as string)} className="w-full flex items-center justify-between p-3.5">
                  <p className="text-sm text-white font-medium">{title as string}</p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openSection.has(key as string) ? "rotate-180" : ""}`} />
                </button>
                {openSection.has(key as string) && (
                  <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                    {(items as [string, string][]).map(([label, content]) => content && (
                      <div key={label}>
                        <p className="text-[10px] text-violet-400 font-semibold mb-1">{label}</p>
                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {result.lampiran?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
                <p className="text-xs text-slate-300 font-semibold mb-2">Lampiran</p>
                <ul className="space-y-1">{result.lampiran.map((l, i) => <li key={i} className="text-xs text-slate-400 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{l}</li>)}</ul>
              </div>
            )}

            {result.catatanTeknis?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-xs text-amber-400 font-semibold mb-2">Catatan Teknis Sebelum Mengirim</p>
                <ul className="space-y-1">{result.catatanTeknis.map((c, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-amber-400 shrink-0">{i+1}.</span>{c}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
                <Link href="/generator-rmk">Generator RMK →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
