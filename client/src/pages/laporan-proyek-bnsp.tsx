import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileText, Copy, CheckCircle2,
  Plus, Trash2, ChevronRight, Building2, Calendar, DollarSign, X
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli Manajemen Konstruksi — Muda",
  "Ahli Manajemen Proyek — Muda", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda",
];

const PERAN_OPTIONS = [
  "Project Manager", "Site Manager", "Pengawas Lapangan", "Supervisor K3",
  "Quantity Surveyor", "Konsultan Perencana", "Konsultan Pengawas",
  "Ahli Struktur", "Ahli Arsitektur", "Ahli MEP", "Ahli Geoteknik",
  "Koordinator Konstruksi", "Engineer",
];

interface HasilLaporan {
  headerLaporan: string;
  deskripsiProyek: string;
  peranDanTanggungjawab: string;
  kompetensiYangDibuktikan: { unitKompetensi: string; bukti: string }[];
  pencapaianKinerja: string[];
  metodePelaksanaan: string;
  hasilDanDampak: string;
  kalimatPenutup: string;
  tipsOptimasi: string[];
}

export default function LaporanProyekBNSP() {
  const [form, setForm] = useState({
    namaProyek: "", lokasiProyek: "", nilaiProyek: "", tahunMulai: "", tahunSelesai: "",
    jenisPekerjaan: "", jabatanSKK: "", peranDiProyek: "", namaPemberiKerja: "",
  });
  const [deskripsiTambahan, setDeskripsiTambahan] = useState("");
  const [result, setResult] = useState<HasilLaporan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isValid = form.namaProyek && form.jabatanSKK && form.peranDiProyek;

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/laporan-proyek-bnsp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, deskripsiTambahan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate laporan."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = [
      result.headerLaporan,
      "\nDESKRIPSI PROYEK",
      result.deskripsiProyek,
      "\nPERAN DAN TANGGUNG JAWAB",
      result.peranDanTanggungjawab,
      "\nKOMPETENSI YANG DIBUKTIKAN",
      result.kompetensiYangDibuktikan.map(k => `• ${k.unitKompetensi}: ${k.bukti}`).join("\n"),
      "\nPENCAPAIAN DAN KINERJA",
      result.pencapaianKinerja.map(p => `• ${p}`).join("\n"),
      "\nMETODE PELAKSANAAN",
      result.metodePelaksanaan,
      "\nHASIL DAN DAMPAK",
      result.hasilDanDampak,
      "\n" + result.kalimatPenutup,
    ].join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <FileText className="h-5 w-5 text-blue-400" /> Generator Laporan Proyek BNSP
            </h1>
            <p className="text-xs text-slate-400">Buat laporan proyek terstruktur format portofolio BNSP/SKK dari input singkat</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Data Proyek</p>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={form.namaProyek} onChange={e => setForm(f => ({ ...f, namaProyek: e.target.value }))}
                  placeholder="cth: Pembangunan Gedung Perkantoran 8 Lantai PT. ABC"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Lokasi</label>
                  <input value={form.lokasiProyek} onChange={e => setForm(f => ({ ...f, lokasiProyek: e.target.value }))}
                    placeholder="cth: Jakarta Selatan"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Proyek</label>
                  <input value={form.nilaiProyek} onChange={e => setForm(f => ({ ...f, nilaiProyek: e.target.value }))}
                    placeholder="cth: Rp 15 Miliar"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Tahun Mulai</label>
                  <input value={form.tahunMulai} onChange={e => setForm(f => ({ ...f, tahunMulai: e.target.value }))}
                    placeholder="cth: 2022"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Tahun Selesai</label>
                  <input value={form.tahunSelesai} onChange={e => setForm(f => ({ ...f, tahunSelesai: e.target.value }))}
                    placeholder="cth: 2023"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Pekerjaan Konstruksi</label>
                <input value={form.jenisPekerjaan} onChange={e => setForm(f => ({ ...f, jenisPekerjaan: e.target.value }))}
                  placeholder="cth: Konstruksi Bangunan Gedung Bertingkat"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Pemberi Kerja / Owner</label>
                <input value={form.namaPemberiKerja} onChange={e => setForm(f => ({ ...f, namaPemberiKerja: e.target.value }))}
                  placeholder="cth: PT. ABC Tbk / Dinas Pekerjaan Umum Kota Jakarta"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Data Peran & Jabatan</p>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dilamar *</label>
                <select value={form.jabatanSKK} onChange={e => setForm(f => ({ ...f, jabatanSKK: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Peran Anda di Proyek *</label>
                <select value={form.peranDiProyek} onChange={e => setForm(f => ({ ...f, peranDiProyek: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50">
                  <option value="">Pilih peran...</option>
                  {PERAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Informasi Tambahan <span className="text-slate-600">(opsional)</span></label>
                <textarea value={deskripsiTambahan} onChange={e => setDeskripsiTambahan(e.target.value)}
                  rows={3} placeholder="Tuliskan hal penting yang ingin ditonjolkan: pencapaian khusus, tantangan yang diatasi, inovasi yang diterapkan, dll."
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 resize-none" />
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun laporan proyek...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Laporan Proyek BNSP</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-3" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-4/5" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/40">Laporan Proyek SKK</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{form.jabatanSKK.split(" — ")[0]}</Badge>
              </div>
              <Button onClick={copyAll} variant="outline" className="text-xs h-7 gap-1.5">
                {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Disalin!</> : <><Copy className="h-3 w-3" /> Salin Semua</>}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <p className="text-blue-300 text-xs font-semibold whitespace-pre-line">{result.headerLaporan}</p>
              </div>

              {[
                { judul: "Deskripsi Proyek", konten: result.deskripsiProyek },
                { judul: "Peran dan Tanggung Jawab", konten: result.peranDanTanggungjawab },
                { judul: "Metode Pelaksanaan", konten: result.metodePelaksanaan },
                { judul: "Hasil dan Dampak", konten: result.hasilDanDampak },
              ].map((sec, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                  <p className="text-xs text-blue-400 font-semibold mb-2">{sec.judul}</p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{sec.konten}</p>
                </div>
              ))}

              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <p className="text-xs text-blue-400 font-semibold mb-2">Kompetensi yang Dibuktikan</p>
                <div className="space-y-2">
                  {result.kompetensiYangDibuktikan?.map((k, i) => (
                    <div key={i} className="rounded-lg bg-slate-900/40 px-3 py-2">
                      <p className="text-xs text-white font-medium">{k.unitKompetensi}</p>
                      <p className="text-xs text-slate-400">{k.bukti}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <p className="text-xs text-blue-400 font-semibold mb-2">Pencapaian & Kinerja</p>
                <ul className="space-y-1">{result.pencapaianKinerja?.map((p, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-3">
                <p className="text-sm text-slate-400 italic">{result.kalimatPenutup}</p>
              </div>
            </div>

            {result.tipsOptimasi?.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-amber-400 text-xs font-semibold mb-2">Tips Optimasi Laporan</p>
                <ul className="space-y-1">{result.tipsOptimasi.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Proyek Lain</Button>
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Link href="/evaluasi-portofolio">Evaluasi Portofolio →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
