import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShoppingCart, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PENGADAAN = [
  "Jasa Konstruksi — Pekerjaan Gedung",
  "Jasa Konstruksi — Pekerjaan Sipil/Infrastruktur",
  "Jasa Konstruksi — Pekerjaan Spesialis (MEP/Pondasi)",
  "Jasa Konsultansi Konstruksi (Perencanaan)",
  "Jasa Konsultansi Konstruksi (Pengawasan/MK)",
  "Pengadaan Material/Bahan Konstruksi",
  "Pengadaan Alat Berat/Sewa Peralatan",
  "Pengadaan Jasa EPC (Engineering-Procurement-Construction)",
];

const SUMBER_DANA = [
  "APBN (Kementerian/Lembaga)",
  "APBD Provinsi",
  "APBD Kabupaten/Kota",
  "BUMN / BUMD",
  "Swasta / Non-Pemerintah",
  "Dana Hibah / Loan PHLN",
];

const NILAI_PAGU = [
  "Di bawah Rp 50 Juta",
  "Rp 50 Juta – Rp 200 Juta",
  "Rp 200 Juta – Rp 2,5 Miliar",
  "Rp 2,5 Miliar – Rp 50 Miliar",
  "Di atas Rp 50 Miliar",
  "Di atas Rp 100 Miliar (tender internasional)",
];

interface TahapPengadaan {
  urutan: number;
  nama: string;
  deskripsi: string;
  durasi: string;
  dokumen: string[];
  pihakBerwenang: string;
  referensiPasal: string;
}

interface HasilPBJ {
  judulPanduan: string;
  metodePengadaan: string;
  dasarHukum: string[];
  alasanMetode: string;
  tahapPengadaan: TahapPengadaan[];
  dokumenPengadaan: { nama: string; isi: string[]; pihakPembuat: string }[];
  syaratPenyedia: { kategori: string; syarat: string[] }[];
  evaluasiPenawaran: string[];
  kesalahanUmum: { kesalahan: string; dampak: string; pencegahan: string }[];
  jadwalEstimasi: string;
  catatanPenting: string[];
}

export default function PanduanPBJKonstruksi() {
  const [jenisPengadaan, setJenisPengadaan] = useState(JENIS_PENGADAAN[0]);
  const [sumberDana, setSumberDana] = useState(SUMBER_DANA[0]);
  const [nilaiPagu, setNilaiPagu] = useState(NILAI_PAGU[3]);
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilPBJ | null>(null);
  const [expanded, setExpanded] = useState<string | null>("tahap");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-pbj-konstruksi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPengadaan, sumberDana, nilaiPagu, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  function copyTahap() {
    if (!hasil) return;
    const txt = hasil.tahapPengadaan.map(t => `${t.urutan}. ${t.nama} (${t.durasi})\n${t.deskripsi}`).join("\n\n");
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"><ShoppingCart className="h-6 w-6 text-amber-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan Pengadaan Barang/Jasa Konstruksi</h1>
              <p className="text-slate-400 text-sm">Metode pengadaan, tahapan, dokumen wajib, evaluasi — sesuai Perpres 46/2025 & Perlem LKPP</p>
            </div>
            <Badge className="ml-auto bg-amber-500/15 text-amber-400 border-amber-500/30">Gelombang 26</Badge>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pengadaan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisPengadaan} onChange={e => setJenisPengadaan(e.target.value)}>
                {JENIS_PENGADAAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Sumber Dana *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={sumberDana} onChange={e => setSumberDana(e.target.value)}>
                {SUMBER_DANA.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Pagu *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={nilaiPagu} onChange={e => setNilaiPagu(e.target.value)}>
                {NILAI_PAGU.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks / Kondisi Khusus (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: ada SBU wajib, zona bencana, lelang ulang, waktu terbatas" value={konteks} onChange={e => setKonteks(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun panduan PBJ...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan Pengadaan</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center"><Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-3" /><p className="text-slate-300">Menyusun panduan pengadaan...</p></div>}

        {hasil && (
          <div className="space-y-3">
            <div>
              <h2 className="text-white font-bold">{hasil.judulPanduan}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-amber-600/20 text-amber-300 border-amber-500/30">{hasil.metodePengadaan}</Badge>
                <span className="text-slate-400 text-xs">{hasil.jadwalEstimasi}</span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{hasil.alasanMetode}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
              <div className="text-blue-300 text-xs font-medium mb-1">Dasar Hukum</div>
              <div className="flex flex-wrap gap-1">{hasil.dasarHukum.map((r, i) => <span key={i} className="bg-blue-900/40 text-blue-200 text-xs px-2 py-0.5 rounded">{r}</span>)}</div>
            </div>
            {[
              {
                key: "tahap", label: "Tahap-Tahap Pengadaan",
                content: (
                  <div className="space-y-2">
                    <Button onClick={copyTahap} variant="outline" size="sm" className="border-slate-600 text-slate-300 mb-2">
                      {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Tersalin!" : "Salin Tahapan"}
                    </Button>
                    {hasil.tahapPengadaan.map((t, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.urutan}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-200 font-medium text-sm">{t.nama}</span>
                              <span className="text-slate-500 text-xs">{t.durasi}</span>
                            </div>
                            <p className="text-slate-300 text-xs mt-0.5">{t.deskripsi}</p>
                            <div className="text-slate-500 text-xs mt-0.5">PIC: {t.pihakBerwenang} | Ref: {t.referensiPasal}</div>
                            {t.dokumen.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{t.dokumen.map((d, j) => <span key={j} className="bg-slate-700/60 text-slate-300 text-xs px-1.5 py-0.5 rounded">📄 {d}</span>)}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "dokumen", label: "Dokumen Pengadaan yang Dibutuhkan",
                content: (
                  <div className="space-y-2">
                    {hasil.dokumenPengadaan.map((d, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-amber-200 text-sm font-medium mb-1">{d.nama} <span className="text-slate-500 text-xs">— dibuat oleh {d.pihakPembuat}</span></div>
                        <ul className="space-y-0.5">{d.isi.map((s, j) => <li key={j} className="text-slate-300 text-xs">• {s}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "syarat", label: "Syarat Kualifikasi Penyedia",
                content: (
                  <div className="space-y-2">
                    {hasil.syaratPenyedia.map((s, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-amber-200 text-xs font-medium mb-1">{s.kategori}</div>
                        <ul className="space-y-0.5">{s.syarat.map((item, j) => <li key={j} className="text-slate-300 text-xs">✓ {item}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "evaluasi", label: "Metode & Kriteria Evaluasi Penawaran",
                content: <ul className="space-y-1">{hasil.evaluasiPenawaran.map((e, i) => <li key={i} className="text-slate-300 text-xs">• {e}</li>)}</ul>
              },
              {
                key: "kesalahan", label: "Kesalahan Umum & Cara Mencegah",
                content: (
                  <div className="space-y-2">
                    {hasil.kesalahanUmum.map((k, i) => (
                      <div key={i} className="bg-red-900/15 border border-red-500/20 rounded-lg p-2">
                        <div className="text-orange-300 text-xs font-medium">⚠ {k.kesalahan}</div>
                        <div className="text-red-300 text-xs">Dampak: {k.dampak}</div>
                        <div className="text-green-300 text-xs">Pencegahan: {k.pencegahan}</div>
                      </div>
                    ))}
                  </div>
                )
              },
            ].map(s => (
              <div key={s.key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggle(s.key)} className="w-full flex items-center justify-between px-5 py-3 text-white font-semibold hover:bg-slate-800/40 transition-colors">
                  <span>{s.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded === s.key ? "rotate-180" : ""}`} />
                </button>
                {expanded === s.key && <div className="px-5 pb-4">{s.content}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
