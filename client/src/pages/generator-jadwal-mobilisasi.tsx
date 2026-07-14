import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Calendar, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK = [
  "Gedung Bertingkat (4–10 lantai)",
  "Gedung Tinggi (>10 lantai)",
  "Jalan & Perkerasan",
  "Jembatan",
  "Drainase & Irigasi",
  "Industri & Pabrik",
  "Perumahan / Kluster",
  "Renovasi Besar / Rehabilitasi",
  "Dermaga & Fasilitas Pelabuhan",
  "Sipil Umum Lainnya",
];

interface AktivitasMobilisasi {
  minggu: string;
  aktivitas: { nama: string; durasi: string; pic: string; keterangan: string }[];
}

interface HasilJadwal {
  judulProyek: string;
  durasi: string;
  ringkasan: string;
  tahapan: AktivitasMobilisasi[];
  personelKunci: { jabatan: string; jumlah: number; waktuMobilisasi: string }[];
  alatUtama: { nama: string; kapasitas: string; waktuMobilisasi: string; durasi: string }[];
  risikoMobilisasi: string[];
  catatanPenting: string;
}

export default function GeneratorJadwalMobilisasi() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [durasiKontrak, setDurasiKontrak] = useState(180);
  const [lokasiProyek, setLokasiProyek] = useState("");
  const [spesifikasiKhusus, setSpesifikasiKhusus] = useState("");
  const [result, setResult] = useState<HasilJadwal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openTahap, setOpenTahap] = useState<Set<string>>(new Set(["0", "1"]));

  function toggleTahap(k: string) { setOpenTahap(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  async function generate() {
    if (!jenisProyek || !namaProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-jadwal-mobilisasi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, namaProyek, nilaiKontrak, durasiKontrak, lokasiProyek, spesifikasiKhusus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenTahap(new Set(["0", "1"]));
    } catch (e: any) { setError(e.message || "Gagal generate jadwal."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const lines = [result.judulProyek, result.durasi, "", result.ringkasan, ""];
    result.tahapan.forEach(t => {
      lines.push(`=== ${t.minggu} ===`);
      t.aktivitas.forEach(a => lines.push(`• ${a.nama} (${a.durasi}) — PIC: ${a.pic}`, `  ${a.keterangan}`));
      lines.push("");
    });
    navigator.clipboard.writeText(lines.join("\n"));
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
              <Calendar className="h-5 w-5 text-blue-400" /> Generator Jadwal Mobilisasi Proyek
            </h1>
            <p className="text-xs text-slate-400">Jadwal mobilisasi personel, alat berat & fasilitas awal proyek konstruksi</p>
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <Badge variant="outline" className="text-blue-400 border-blue-400/30">Gelombang 19</Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Jenis Proyek *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {JENIS_PROYEK.map(j => (
                    <button key={j} onClick={() => setJenisProyek(j)}
                      className={`rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisProyek === j ? "bg-blue-500/10 border-blue-400/30 text-blue-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{j}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek *</label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Gedung Perkantoran 8 Lantai — PT Maju Bersama"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak</label>
                  <input value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)}
                    placeholder="cth: Rp 32.000.000.000"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Durasi: <span className="text-blue-400">{durasiKontrak} hari</span></label>
                  <input type="range" min={30} max={1095} value={durasiKontrak} onChange={e => setDurasiKontrak(+e.target.value)} className="w-full accent-blue-500 mt-2" />
                  <div className="flex justify-between text-[9px] text-slate-600"><span>30 hr</span><span>3 thn</span></div>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Lokasi Proyek</label>
                <input value={lokasiProyek} onChange={e => setLokasiProyek(e.target.value)}
                  placeholder="cth: Jl. HR Rasuna Said, Jakarta Selatan"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Persyaratan / Kondisi Khusus</label>
                <textarea value={spesifikasiKhusus} onChange={e => setSpesifikasiKhusus(e.target.value)} rows={2}
                  placeholder="cth: Lokasi sempit CBD, jam kerja 07.00–22.00, ada clamp crane, owner engineer wajib hadir SMPP"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisProyek || !namaProyek || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun jadwal mobilisasi...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Jadwal Mobilisasi</>}
            </Button>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulProyek}</p>
                  <p className="text-[10px] text-slate-500">{result.durasi}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-300 mt-1">{result.ringkasan}</p>
            </div>

            {/* Personel Kunci */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
              <p className="text-xs text-blue-400 font-semibold mb-3">Personel Kunci & Jadwal Mobilisasi</p>
              <div className="space-y-1.5">
                {result.personelKunci?.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                    <p className="text-xs text-slate-300">{p.jabatan}</p>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{p.jumlah} org</Badge>
                      <p className="text-[10px] text-blue-400">{p.waktuMobilisasi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alat Utama */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
              <p className="text-xs text-blue-400 font-semibold mb-3">Alat Berat & Peralatan Utama</p>
              <div className="space-y-1.5">
                {result.alatUtama?.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                    <div>
                      <p className="text-xs text-slate-300">{a.nama}</p>
                      <p className="text-[10px] text-slate-500">{a.kapasitas}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-blue-400">{a.waktuMobilisasi}</p>
                      <p className="text-[10px] text-slate-500">{a.durasi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tahapan */}
            <div className="space-y-2 mb-4">
              {result.tahapan?.map((t, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleTahap(String(idx))} className="w-full flex items-center justify-between p-3.5">
                    <p className="text-sm text-white font-medium">{t.minggu}</p>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openTahap.has(String(idx)) ? "rotate-180" : ""}`} />
                  </button>
                  {openTahap.has(String(idx)) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                      {t.aktivitas?.map((a, i) => (
                        <div key={i} className="rounded-lg bg-white/3 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-white font-medium">{a.nama}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">{a.durasi}</Badge>
                              <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">PIC: {a.pic}</Badge>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">{a.keterangan}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Risiko */}
            {result.risikoMobilisasi?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                <p className="text-xs text-amber-400 font-semibold mb-2">⚠️ Risiko Mobilisasi yang Perlu Diantisipasi</p>
                <ul className="space-y-1">
                  {result.risikoMobilisasi.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-amber-400">•</span>{r}</li>)}
                </ul>
              </div>
            )}

            {result.catatanPenting && (
              <div className="rounded-lg border border-white/8 bg-white/2 p-3 mb-4">
                <p className="text-[10px] text-slate-400">{result.catatanPenting}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Link href="/konstra-claw">KonstraClaw AI →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
