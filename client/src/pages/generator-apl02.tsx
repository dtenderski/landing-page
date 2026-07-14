import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, FileText, CheckCircle2, XCircle,
  Download, RotateCcw, ChevronDown, ChevronUp, Copy, AlertCircle
} from "lucide-react";
import { Link } from "wouter";

const SKK_POSITIONS_APL = [
  "Ahli K3 Konstruksi — Muda",
  "Ahli K3 Konstruksi — Madya",
  "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Manajemen Konstruksi — Muda",
  "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda",
  "Ahli Quantity Surveyor — Madya",
  "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya",
  "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda",
  "Ahli Teknik Geoteknik — Muda",
  "Ahli Teknik Sumber Daya Air — Muda",
  "Ahli Teknik Mekanikal — Muda",
  "Ahli Teknik Elektrikal — Muda",
  "Ahli Arsitektur — Muda",
  "Ahli Teknik Lingkungan — Muda",
  "Ahli Perencana Tata Lingkungan — Muda",
  "Ahli Survei & Pemetaan — Muda",
];

const BUKTI_TYPES = [
  "Hasil kerja (portofolio proyek)",
  "Sertifikat pelatihan",
  "Surat keterangan kerja",
  "Laporan/dokumen teknis",
  "Testimoni atasan/klien",
  "Foto dokumentasi lapangan",
];

interface UnitAPL {
  kodeUnit: string;
  namaUnit: string;
  klaimKompetensi: "K" | "BK";
  konfidensitasDiri: 1 | 2 | 3 | 4;
  jenisBukti: string[];
  deskripsiKonteks: string;
  rekomendasiDokumen: string;
}

interface APL02Result {
  jabatan: string;
  namaAsesi: string;
  lembaga: string;
  tanggal: string;
  totalUnit: number;
  unitKompeten: number;
  unitBelumKompeten: number;
  ringkasanKelayakan: string;
  units: UnitAPL[];
  catatanUmum: string;
}

function UnitCard({ unit, idx }: { unit: UnitAPL; idx: number }) {
  const [open, setOpen] = useState(idx < 3);
  const isK = unit.klaimKompetensi === "K";
  const konfLabel = ["", "Tidak yakin", "Cukup yakin", "Yakin", "Sangat yakin"];
  const konfColor = ["", "text-red-400", "text-amber-400", "text-blue-400", "text-emerald-400"];

  return (
    <div className={`rounded-xl border overflow-hidden mb-2 ${isK ? "border-emerald-500/20 bg-emerald-500/5" : "border-slate-700 bg-white/2"}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isK ? "bg-emerald-500/20" : "bg-slate-700"}`}>
            {isK
              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              : <XCircle className="h-3.5 w-3.5 text-slate-400" />
            }
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400">{unit.kodeUnit}</p>
            <p className="text-sm font-medium text-white leading-tight">{unit.namaUnit}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge variant="outline" className={`text-[9px] ${isK ? "text-emerald-400 border-emerald-400/30" : "text-slate-400 border-slate-600"}`}>
            {isK ? "KOMPETEN" : "BELUM KOMPETEN"}
          </Badge>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-white/5">
          <div className="grid grid-cols-2 gap-3 mt-2.5 mb-2">
            <div>
              <p className="text-slate-500 text-xs mb-1">Klaim</p>
              <p className={`text-sm font-semibold ${isK ? "text-emerald-400" : "text-slate-400"}`}>
                {isK ? "✓ Kompeten (K)" : "✗ Belum Kompeten (BK)"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Konfidensitas Diri</p>
              <p className={`text-sm font-semibold ${konfColor[unit.konfidensitasDiri]}`}>
                {unit.konfidensitasDiri}/4 — {konfLabel[unit.konfidensitasDiri]}
              </p>
            </div>
          </div>
          {unit.deskripsiKonteks && (
            <div className="mb-2">
              <p className="text-slate-500 text-xs mb-1">Konteks & Bukti dari Pengalaman</p>
              <p className="text-slate-300 text-xs leading-relaxed">{unit.deskripsiKonteks}</p>
            </div>
          )}
          {unit.jenisBukti.length > 0 && (
            <div className="mb-2">
              <p className="text-slate-500 text-xs mb-1">Jenis Bukti yang Dapat Diajukan</p>
              <div className="flex flex-wrap gap-1">
                {unit.jenisBukti.map((b, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">{b}</Badge>
                ))}
              </div>
            </div>
          )}
          {unit.rekomendasiDokumen && (
            <div className="rounded-lg bg-slate-800/50 p-2.5">
              <p className="text-slate-500 text-xs mb-0.5">Dokumen Pendukung yang Disarankan</p>
              <p className="text-slate-300 text-xs">{unit.rekomendasiDokumen}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GeneratorAPL02() {
  const [jabatan, setJabatan] = useState("");
  const [namaAsesi, setNamaAsesi] = useState("");
  const [lembaga, setLembaga] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<APL02Result | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!jabatan || !pengalaman.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/generator-apl02", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, namaAsesi, lembaga, pengalaman }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal membuat APL-02.");
    } finally {
      setLoading(false);
    }
  }

  function copyText() {
    if (!result) return;
    const lines = [
      `FORMULIR APL-02 — ASESMEN MANDIRI`,
      `Jabatan SKK: ${result.jabatan}`,
      `Nama Asesi: ${result.namaAsesi || "-"}`,
      `Lembaga/Perusahaan: ${result.lembaga || "-"}`,
      `Tanggal: ${result.tanggal}`,
      ``,
      `Total Unit: ${result.totalUnit} | Kompeten: ${result.unitKompeten} | Belum Kompeten: ${result.unitBelumKompeten}`,
      ``,
      `Ringkasan: ${result.ringkasanKelayakan}`,
      ``,
      `---`,
      ...result.units.map((u, i) =>
        [
          `${i + 1}. ${u.kodeUnit} — ${u.namaUnit}`,
          `   Klaim: ${u.klaimKompetensi === "K" ? "Kompeten (K)" : "Belum Kompeten (BK)"}`,
          `   Konfidensitas: ${u.konfidensitasDiri}/4`,
          `   Konteks: ${u.deskripsiKonteks}`,
          `   Bukti: ${u.jenisBukti.join(", ")}`,
          `   Dok. Pendukung: ${u.rekomendasiDokumen}`,
        ].join("\n")
      ),
      ``,
      `Catatan: ${result.catatanUmum}`,
    ].join("\n");
    navigator.clipboard.writeText(lines);
  }

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
                <h1 className="text-base font-bold text-white">APL-02 Asesmen Mandiri</h1>
                <p className="text-xs text-slate-400">{result.jabatan}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyText} size="sm" variant="outline" className="text-xs gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Salin
              </Button>
              <Button onClick={() => setResult(null)} size="sm" variant="outline" className="text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Ulang
              </Button>
            </div>
          </div>

          {/* Header info */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Jabatan SKK</p>
                <p className="text-white text-xs font-medium leading-tight">{result.jabatan}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Nama Asesi</p>
                <p className="text-white text-xs font-medium">{result.namaAsesi || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Lembaga</p>
                <p className="text-white text-xs font-medium">{result.lembaga || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Tanggal</p>
                <p className="text-white text-xs font-medium">{result.tanggal}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-white/5 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-400">{result.unitKompeten}</span>
                <span className="text-slate-400 text-xs">unit<br/>kompeten</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-slate-400">{result.unitBelumKompeten}</span>
                <span className="text-slate-400 text-xs">unit<br/>belum</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex-1">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.round(result.unitKompeten / result.totalUnit * 100)}%` }} />
                </div>
                <p className="text-slate-500 text-xs mt-1">{Math.round(result.unitKompeten / result.totalUnit * 100)}% klaim kompeten</p>
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 mb-4 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300 text-xs leading-relaxed">{result.ringkasanKelayakan}</p>
          </div>

          {/* Unit list */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 font-semibold mb-2">Unit Kompetensi ({result.totalUnit} unit)</p>
            {result.units.map((unit, i) => <UnitCard key={i} unit={unit} idx={i} />)}
          </div>

          {result.catatanUmum && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4">
              <p className="text-amber-400 text-xs font-medium mb-0.5">Catatan Asesor</p>
              <p className="text-slate-300 text-xs leading-relaxed">{result.catatanUmum}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/persiapan-asesmen">Persiapan Asesmen →</Link>
            </Button>
            <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
              <Link href="/mock-asesmen">Latihan Mock Asesmen →</Link>
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
              <FileText className="h-5 w-5 text-blue-400" /> Generator APL-02
            </h1>
            <p className="text-xs text-slate-400">Formulir Asesmen Mandiri otomatis dari pengalaman kerjamu</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Jabatan SKK yang Akan Diuji *</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors">
              <option value="">Pilih jabatan SKK...</option>
              {SKK_POSITIONS_APL.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Nama Lengkap (opsional)</label>
              <input type="text" value={namaAsesi} onChange={e => setNamaAsesi(e.target.value)}
                placeholder="Nama Asesi"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Lembaga/Perusahaan (opsional)</label>
              <input type="text" value={lembaga} onChange={e => setLembaga(e.target.value)}
                placeholder="PT. ABC / Instansi"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">
              Deskripsi Pengalaman Kerja * <span className="text-slate-600">(ceritakan proyek, tanggung jawab, dan durasi)</span>
            </label>
            <textarea
              value={pengalaman}
              onChange={e => setPengalaman(e.target.value)}
              rows={5}
              placeholder={`Contoh:\nSaya telah bekerja sebagai Safety Officer selama 5 tahun di PT. XYZ. Bertanggung jawab atas identifikasi bahaya K3, penyusunan HIRARC, pelaksanaan safety induction, investigasi kecelakaan kerja, dan pembuatan laporan K3 bulanan untuk 3 proyek bangunan gedung bertingkat. Mengikuti pelatihan AK3U dari Kemenaker tahun 2021...`}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 transition-colors resize-none leading-relaxed" />
            <p className="text-slate-600 text-xs mt-1">Semakin detail → APL-02 semakin akurat. Min. 3-4 kalimat.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={generate} disabled={!jabatan || !pengalaman.trim() || loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Mengisi APL-02...</>
              : <><Sparkles className="h-4 w-4 mr-2" />Generate APL-02 Asesmen Mandiri</>
            }
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4">
          <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> APL-02 yang dihasilkan mencakup:
          </p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• Semua unit kompetensi SKKNI untuk jabatan yang dipilih</li>
            <li>• Klaim Kompeten (K) atau Belum Kompeten (BK) per unit — berdasarkan pengalamanmu</li>
            <li>• Tingkat konfidensitas diri (1-4) per unit kompetensi</li>
            <li>• Jenis bukti yang bisa diajukan + rekomendasi dokumen pendukung spesifik</li>
            <li>• Ringkasan kelayakan keseluruhan + catatan untuk asesor</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
