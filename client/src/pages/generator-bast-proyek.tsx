import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileSignature, Copy,
  CheckCircle2, Info, ChevronRight, RotateCcw, ClipboardList
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK_OPTIONS = [
  "Gedung Kantor / Komersial", "Gedung Hunian / Apartemen",
  "Jalan Raya / Jalan Tol", "Jembatan",
  "Bendungan / Irigasi", "Pelabuhan / Dermaga",
  "Instalasi Mekanikal-Elektrikal", "Renovasi / Retrofit",
  "Proyek Infrastruktur Lainnya",
];

const JENIS_SERAH_TERIMA = [
  "BAST Pertama — Serah Terima dari Kontraktor ke PPK",
  "BAST Kedua — Serah Terima Akhir setelah Masa Pemeliharaan",
  "BAST Pekerjaan Parsial / Termin",
  "BAST Pekerjaan Tambah/Kurang (CCO)",
  "BAST Pengadaan Material / Peralatan",
];

interface HasilBAST {
  judulDokumen: string;
  nomorDokumen: string;
  jenisSerahTerima: string;
  tanggalDokumen: string;
  isiDokumen: {
    pembukaanLegal: string;
    identitasPihakPenyerah: { uraian: string; isiKosong: string };
    identitasPihakPenerima: { uraian: string; isiKosong: string };
    deskripsiPekerjaan: string;
    nilaiKontrak: string;
    pernyataanSelesai: string;
    kondisiPenyerahan: string;
    masaPemeliharaan: string;
    kewajibankMasaPemeliharaan: string;
    klausulPerselisihan: string;
    penutup: string;
  };
  checklistKelengkapan: { dokumen: string; keterangan: string; wajib: boolean }[];
  catatanPenting: string[];
}

export default function GeneratorBASTProyek() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [jenisSerahTerima, setJenisSerahTerima] = useState(JENIS_SERAH_TERIMA[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [result, setResult] = useState<HasilBAST | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"dokumen" | "checklist" | "catatan">("dokumen");

  const isValid = jenisProyek && namaProyek;

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-bast-proyek", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, jenisSerahTerima, namaProyek, nilaiKontrak }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate BAST."); }
    finally { setLoading(false); }
  }

  function copyDokumen() {
    if (!result) return;
    const r = result.isiDokumen;
    const text = `${result.judulDokumen}\nNo: ${result.nomorDokumen} | Tanggal: ${result.tanggalDokumen}\n\n${r.pembukaanLegal}\n\nPIHAK PENYERAH:\n${r.identitasPihakPenyerah.isiKosong}\n\nPIHAK PENERIMA:\n${r.identitasPihakPenerima.isiKosong}\n\n${r.deskripsiPekerjaan}\n\n${r.pernyataanSelesai}\n\n${r.kondisiPenyerahan}\n\n${r.masaPemeliharaan}\n\n${r.kewajibankMasaPemeliharaan}\n\n${r.klausulPerselisihan}\n\n${r.penutup}`;
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
              <FileSignature className="h-5 w-5 text-blue-400" /> Generator BAST Proyek Konstruksi
            </h1>
            <p className="text-xs text-slate-400">Generate draft Berita Acara Serah Terima formal + checklist kelengkapan dokumen pendukung</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">Draft BAST yang dihasilkan adalah referensi awal. Sesuaikan dengan ketentuan kontrak, peraturan instansi terkait, dan periksa bersama konsultan hukum sebelum ditandatangani.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis / Tipe Proyek *</label>
                <select value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">
                  <option value="">Pilih tipe proyek...</option>
                  {JENIS_PROYEK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Gedung Kantor Pusat BPJK Jakarta"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Serah Terima</label>
                <div className="space-y-1.5">
                  {JENIS_SERAH_TERIMA.map(s => (
                    <button key={s} onClick={() => setJenisSerahTerima(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisSerahTerima === s ? "bg-blue-500/15 border-blue-400/40 text-blue-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak <span className="text-slate-600">(opsional)</span></label>
                <input value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)}
                  placeholder="cth: Rp 12.500.000.000"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating BAST...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Draft BAST</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulDokumen}</p>
                  <p className="text-[10px] text-slate-500">No: {result.nomorDokumen} · {result.tanggalDokumen}</p>
                </div>
                <Button onClick={copyDokumen} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">{result.jenisSerahTerima}</Badge>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["dokumen", "Isi Dokumen"], ["checklist", "Checklist Lampiran"], ["catatan", "Catatan Penting"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "dokumen" && result.isiDokumen && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
                {[
                  ["Pembukaan & Dasar Hukum", result.isiDokumen.pembukaanLegal],
                  ["Identitas Pihak Penyerah", result.isiDokumen.identitasPihakPenyerah.isiKosong],
                  ["Identitas Pihak Penerima", result.isiDokumen.identitasPihakPenerima.isiKosong],
                  ["Uraian Pekerjaan yang Diserahkan", result.isiDokumen.deskripsiPekerjaan],
                  ["Pernyataan Penyelesaian Pekerjaan", result.isiDokumen.pernyataanSelesai],
                  ["Kondisi & Kelengkapan Penyerahan", result.isiDokumen.kondisiPenyerahan],
                  ["Masa Pemeliharaan", result.isiDokumen.masaPemeliharaan],
                  ["Kewajiban Masa Pemeliharaan", result.isiDokumen.kewajibankMasaPemeliharaan],
                  ["Penyelesaian Perselisihan", result.isiDokumen.klausulPerselisihan],
                  ["Penutup & Penandatanganan", result.isiDokumen.penutup],
                ].map(([label, content], i) => content && (
                  <div key={i} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                    <p className="text-[10px] text-blue-400 font-semibold mb-1">{label}</p>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="space-y-2">
                {result.checklistKelengkapan?.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-start gap-3 ${c.wajib ? "border-red-500/15 bg-red-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className={`w-3.5 h-3.5 rounded border shrink-0 mt-0.5 ${c.wajib ? "border-red-400/50" : "border-slate-600"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs text-white font-medium">{c.dokumen}</p>
                        {c.wajib && <Badge variant="outline" className="text-[8px] text-red-400 border-red-400/30">Wajib</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-400">{c.keterangan}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "catatan" && (
              <div className="space-y-2">
                {result.catatanPenting?.map((c, i) => (
                  <div key={i} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 flex items-start gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">{c}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Link href="/generator-sop-k3-proyek">Generator SOP K3 →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
