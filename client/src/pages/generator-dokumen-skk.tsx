import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileText, Copy, Download,
  Check, RotateCcw, ChevronRight, User, Building2, Send,
  Printer, Info, Plus, Trash2, Calendar
} from "lucide-react";
import { Link } from "wouter";

const DOC_TYPES = [
  {
    id: "pernyataan",
    label: "Surat Pernyataan Pengalaman Kerja",
    sublabel: "Dari pemohon SKK — ditandatangani di atas materai",
    icon: User,
    color: "text-blue-400",
    borderSel: "border-blue-400/40 bg-blue-500/10",
    desc: "Menyatakan pengalaman kerja yang relevan, dibuat dan ditandatangani pemohon.",
  },
  {
    id: "keterangan",
    label: "Surat Keterangan Kerja",
    sublabel: "Dari perusahaan / atasan — menerangkan masa kerja",
    icon: Building2,
    color: "text-emerald-400",
    borderSel: "border-emerald-400/40 bg-emerald-500/10",
    desc: "Diterbitkan oleh perusahaan/instansi yang menerangkan posisi dan masa kerja pemohon.",
  },
  {
    id: "pengantar",
    label: "Surat Pengantar ke LSP",
    sublabel: "Dari instansi / BUJK — mengajukan asesi ke LSP",
    icon: Send,
    color: "text-violet-400",
    borderSel: "border-violet-400/40 bg-violet-500/10",
    desc: "Surat resmi dari instansi/BUJK yang mengajukan/merekomendasikan pemohon ke LSP.",
  },
];

interface Proyek {
  nama: string;
  lokasi: string;
  tahun: string;
  peran: string;
  nilaiKontrak: string;
}

export default function GeneratorDokumenSKK() {
  const [docType, setDocType] = useState("pernyataan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Form fields — pernyataan & keterangan shared
  const [namaPemohon, setNamaPemohon] = useState("");
  const [nik, setNik] = useState("");
  const [jabatanSkk, setJabatanSkk] = useState("");
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [jabatanPemohon, setJabatanPemohon] = useState("");
  const [kotaTanggal, setKotaTanggal] = useState("");

  // Keterangan — atasan
  const [namaAtasan, setNamaAtasan] = useState("");
  const [jabatanAtasan, setJabatanAtasan] = useState("");
  const [mulaiKerja, setMulaiKerja] = useState("");
  const [akhirKerja, setAkhirKerja] = useState("");

  // Pengantar — lsp
  const [namaLsp, setNamaLsp] = useState("");
  const [namaInstansi, setNamaInstansi] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [jabatanPJ, setJabatanPJ] = useState("");

  // Proyek list
  const [proyek, setProyek] = useState<Proyek[]>([
    { nama: "", lokasi: "", tahun: "", peran: "", nilaiKontrak: "" },
  ]);

  function addProyek() {
    setProyek([...proyek, { nama: "", lokasi: "", tahun: "", peran: "", nilaiKontrak: "" }]);
  }
  function removeProyek(i: number) {
    setProyek(proyek.filter((_, idx) => idx !== i));
  }
  function updateProyek(i: number, field: keyof Proyek, val: string) {
    const copy = [...proyek];
    copy[i] = { ...copy[i], [field]: val };
    setProyek(copy);
  }

  async function generate() {
    if (!namaPemohon || !jabatanSkk) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/generator-dokumen-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType, namaPemohon, nik, jabatanSkk, namaPerusahaan, jabatanPemohon, kotaTanggal,
          namaAtasan, jabatanAtasan, mulaiKerja, akhirKerja,
          namaLsp, namaInstansi, penanggungJawab, jabatanPJ,
          proyek: proyek.filter(p => p.nama.trim()),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.dokumen);
    } catch (e: any) {
      setError(e.message || "Gagal generate dokumen.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function printDoc() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${docType}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; margin: 2.5cm 3cm; color: #000; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: 12pt; }
        @media print { body { margin: 1cm 2cm; } }
      </style></head><body><pre>${result}</pre></body></html>`);
    win.document.close();
    win.print();
  }

  const selectedType = DOC_TYPES.find(d => d.id === docType)!;

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setResult(null)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white">{selectedType.label}</h1>
                <p className="text-xs text-slate-400">{namaPemohon} · {jabatanSkk}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyText} size="sm" variant="outline" className="text-xs gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Disalin!" : "Salin"}
              </Button>
              <Button onClick={printDoc} size="sm" variant="outline" className="text-xs gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button onClick={() => setResult(null)} size="sm" variant="outline" className="text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Buat Lagi
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/2 p-1 mb-4">
            <div className="rounded-lg bg-slate-900 p-5">
              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">{result}</pre>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs leading-relaxed">
              Periksa dan sesuaikan isi surat dengan data aktual Anda. Tanda tangan di atas <strong>materai Rp 10.000</strong> untuk surat pernyataan yang memerlukan.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/generator-apl02">Generator APL-02 →</Link>
            </Button>
            <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
              <Link href="/persiapan-asesmen">Checklist Dokumen Lengkap →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" /> Generator Dokumen SKK
            </h1>
            <p className="text-xs text-slate-400">Surat resmi siap pakai untuk aplikasi & asesmen SKK</p>
          </div>
        </div>

        {/* Doc Type Picker */}
        <div className="space-y-2 mb-5">
          {DOC_TYPES.map(d => {
            const Icon = d.icon;
            const sel = docType === d.id;
            return (
              <button key={d.id} onClick={() => setDocType(d.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all flex items-center gap-3 ${sel ? d.borderSel : "border-white/10 hover:border-white/20"}`}>
                <div className={`rounded-lg p-2 ${sel ? "bg-white/10" : "bg-white/3"}`}>
                  <Icon className={`h-4 w-4 ${d.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${sel ? "text-white" : "text-slate-300"}`}>{d.label}</p>
                  <p className="text-xs text-slate-500">{d.sublabel}</p>
                </div>
                {sel && <ChevronRight className={`h-4 w-4 ${d.color} shrink-0`} />}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
          {/* Shared fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1.5">Nama Lengkap Pemohon SKK *</label>
              <input value={namaPemohon} onChange={e => setNamaPemohon(e.target.value)}
                placeholder="cth: Budi Santoso, S.T."
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">NIK (opsional)</label>
              <input value={nik} onChange={e => setNik(e.target.value)}
                placeholder="3171xxxxxx"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Kota & Tanggal Surat</label>
              <input value={kotaTanggal} onChange={e => setKotaTanggal(e.target.value)}
                placeholder="cth: Jakarta, 8 Juni 2026"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Diajukan *</label>
            <input value={jabatanSkk} onChange={e => setJabatanSkk(e.target.value)}
              placeholder="cth: Ahli K3 Konstruksi — Madya"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Nama Perusahaan / Instansi</label>
              <input value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)}
                placeholder="PT. ABC Konstruksi"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Jabatan Pemohon di Perusahaan</label>
              <input value={jabatanPemohon} onChange={e => setJabatanPemohon(e.target.value)}
                placeholder="cth: HSE Manager"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
            </div>
          </div>

          {/* Keterangan kerja extra */}
          {docType === "keterangan" && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-3">
              <p className="text-xs text-emerald-400 font-semibold">Data Penerbit Surat Keterangan</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Atasan / Pejabat Penandatangan</label>
                  <input value={namaAtasan} onChange={e => setNamaAtasan(e.target.value)}
                    placeholder="Ir. Ahmad Fauzi"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jabatan Penandatangan</label>
                  <input value={jabatanAtasan} onChange={e => setJabatanAtasan(e.target.value)}
                    placeholder="Direktur Teknik"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Mulai Bekerja</label>
                  <input value={mulaiKerja} onChange={e => setMulaiKerja(e.target.value)}
                    placeholder="Januari 2018"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Sampai / Sekarang</label>
                  <input value={akhirKerja} onChange={e => setAkhirKerja(e.target.value)}
                    placeholder="sekarang / Desember 2023"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/50" />
                </div>
              </div>
            </div>
          )}

          {/* Pengantar LSP extra */}
          {docType === "pengantar" && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-3">
              <p className="text-xs text-violet-400 font-semibold">Data Surat Pengantar</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama LSP Tujuan</label>
                  <input value={namaLsp} onChange={e => setNamaLsp(e.target.value)}
                    placeholder="LSP Konstruksi Indonesia"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Instansi Pengirim</label>
                  <input value={namaInstansi} onChange={e => setNamaInstansi(e.target.value)}
                    placeholder="PT. Maju Jaya"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Penandatangan</label>
                  <input value={penanggungJawab} onChange={e => setPenanggungJawab(e.target.value)}
                    placeholder="Ir. Siti Rahayu, M.T."
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jabatan Penandatangan</label>
                  <input value={jabatanPJ} onChange={e => setJabatanPJ(e.target.value)}
                    placeholder="Direktur Utama"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50" />
                </div>
              </div>
            </div>
          )}

          {/* Riwayat Proyek */}
          {(docType === "pernyataan" || docType === "keterangan") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 font-medium">Riwayat Proyek Relevan</label>
                <button onClick={addProyek} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Tambah Proyek
                </button>
              </div>
              <div className="space-y-2">
                {proyek.map((p, i) => (
                  <div key={i} className="rounded-lg border border-white/8 bg-white/2 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Proyek #{i + 1}</span>
                      {proyek.length > 1 && (
                        <button onClick={() => removeProyek(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input value={p.nama} onChange={e => updateProyek(i, "nama", e.target.value)}
                          placeholder="Nama proyek"
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                      </div>
                      <input value={p.lokasi} onChange={e => updateProyek(i, "lokasi", e.target.value)}
                        placeholder="Lokasi"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                      <input value={p.tahun} onChange={e => updateProyek(i, "tahun", e.target.value)}
                        placeholder="Tahun (cth: 2022-2023)"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                      <input value={p.peran} onChange={e => updateProyek(i, "peran", e.target.value)}
                        placeholder="Peran / jabatan"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                      <input value={p.nilaiKontrak} onChange={e => updateProyek(i, "nilaiKontrak", e.target.value)}
                        placeholder="Nilai kontrak (opsional)"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={generate} disabled={!namaPemohon || !jabatanSkk || loading}
            className="w-full bg-blue-600 hover:bg-blue-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Menyusun Surat...</>
              : <><Sparkles className="h-4 w-4 mr-2" />Generate {selectedType.label}</>
            }
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
          <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Semua 3 jenis surat dibutuhkan untuk kelengkapan berkas SKK: <span className="text-slate-400">pernyataan</span> dari pemohon + <span className="text-slate-400">keterangan</span> dari perusahaan + <span className="text-slate-400">pengantar</span> jika perusahaan mendaftarkan karyawan ke LSP.
          </p>
        </div>
      </div>
    </div>
  );
}
