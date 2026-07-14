import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ClipboardCheck, Copy, CheckCircle2, RotateCcw, ChevronDown, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const STANDAR_AUDIT = [
  "ISO 9001:2015 — Sistem Manajemen Mutu",
  "ISO 14001:2015 — Sistem Manajemen Lingkungan",
  "ISO 45001:2018 — Sistem Manajemen K3",
  "IMS (Integrated: 9001 + 14001 + 45001)",
  "SMK3 PP 50/2012 (Kemenaker)",
  "ISO 37001:2016 — Anti-Penyuapan (SMAP)",
  "ISO 19011:2018 — Panduan Audit",
];

const TIPE_AUDIT = [
  "Audit Internal Rutin (Tahunan)",
  "Audit Internal Surveilans",
  "Audit Pre-Sertifikasi",
  "Audit Follow-Up NCR",
  "Audit Tidak Terjadwal / Khusus",
];

const SCOPE_AREA = [
  "Seluruh organisasi / perusahaan",
  "Divisi Produksi / Operasional",
  "Divisi HRD & Administrasi",
  "Divisi K3 & Lingkungan",
  "Site Proyek Konstruksi",
  "Gudang & Logistik",
  "Kantor Pusat",
];

interface Temuan { klausul: string; deskripsi: string; bukti: string; kategori: "Major NC" | "Minor NC" | "OFI" | "Positif"; rekomendasi: string; }
interface HasilLaporanAudit {
  judulLaporan: string;
  nomorLaporan: string;
  ringkasanEksekutif: string;
  hasilPerKlausul: { klausul: string; status: string; catatan: string }[];
  temuan: Temuan[];
  statistik: { totalTemuan: number; majorNC: number; minorNC: number; ofi: number; positif: number };
  kesimpulan: string;
  rekomendasiTindakLanjut: string[];
  catatanAuditor: string;
}

export default function GeneratorLaporanAudit() {
  const [standarAudit, setStandarAudit] = useState("");
  const [tipeAudit, setTipeAudit] = useState("");
  const [scopeArea, setScopeArea] = useState("");
  const [namaOrganisasi, setNamaOrganisasi] = useState("");
  const [tanggalAudit, setTanggalAudit] = useState("");
  const [auditorUtama, setAuditorUtama] = useState("");
  const [kondisiTemuan, setKondisiTemuan] = useState("");
  const [result, setResult] = useState<HasilLaporanAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openSection, setOpenSection] = useState<Set<string>>(new Set(["temuan", "rekomendasi"]));

  function toggleSection(k: string) { setOpenSection(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  async function generate() {
    if (!standarAudit || !tipeAudit) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-laporan-audit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standarAudit, tipeAudit, scopeArea, namaOrganisasi, tanggalAudit, auditorUtama, kondisiTemuan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenSection(new Set(["temuan", "rekomendasi"]));
    } catch (e: any) { setError(e.message || "Gagal generate laporan audit."); }
    finally { setLoading(false); }
  }

  function copyAll() {
    if (!result) return;
    const lines = [result.judulLaporan, result.nomorLaporan, "", result.ringkasanEksekutif, "",
      "TEMUAN AUDIT:", ...result.temuan.map(t => `[${t.kategori}] Klausul ${t.klausul}: ${t.deskripsi}\nBukti: ${t.bukti}\nRekomendasi: ${t.rekomendasi}`),
      "", "KESIMPULAN:", result.kesimpulan];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const KATEGORI_COLOR: Record<string, string> = {
    "Major NC": "text-red-400 border-red-400/30 bg-red-500/10",
    "Minor NC": "text-amber-400 border-amber-400/30 bg-amber-500/10",
    "OFI": "text-blue-400 border-blue-400/30 bg-blue-500/10",
    "Positif": "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-indigo-400" /> Generator Laporan Audit Internal ISO
            </h1>
            <p className="text-xs text-slate-400">ISO 9001 / 14001 / 45001 / IMS / SMK3 — temuan, NCR, OFI, rekomendasi</p>
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <Badge variant="outline" className="text-indigo-400 border-indigo-400/30">Gelombang 19</Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Standar yang Diaudit *</label>
                <div className="space-y-1.5">
                  {STANDAR_AUDIT.map(s => (
                    <button key={s} onClick={() => setStandarAudit(s)}
                      className={`w-full text-left rounded-lg border py-2 px-3 text-xs transition-all ${standarAudit === s ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Tipe Audit *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIPE_AUDIT.map(t => (
                    <button key={t} onClick={() => setTipeAudit(t)}
                      className={`rounded-lg border py-2 px-2.5 text-xs text-left transition-all ${tipeAudit === t ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Scope / Area Audit</label>
                <div className="flex flex-wrap gap-1.5">
                  {SCOPE_AREA.map(s => (
                    <button key={s} onClick={() => setScopeArea(s)}
                      className={`rounded-lg border py-1.5 px-2.5 text-xs transition-all ${scopeArea === s ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Organisasi / Proyek</label>
                  <input value={namaOrganisasi} onChange={e => setNamaOrganisasi(e.target.value)}
                    placeholder="cth: PT Konstruksi Nusantara"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Tanggal Audit</label>
                  <input value={tanggalAudit} onChange={e => setTanggalAudit(e.target.value)}
                    placeholder="cth: 9–10 Juni 2026"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Auditor Utama & Tim</label>
                <input value={auditorUtama} onChange={e => setAuditorUtama(e.target.value)}
                  placeholder="cth: Budi Santoso (Lead Auditor QMS), Sari Dewi (Auditor K3)"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kondisi / Konteks Audit</label>
                <textarea value={kondisiTemuan} onChange={e => setKondisiTemuan(e.target.value)} rows={2}
                  placeholder="cth: Audit surveilans ke-2, ada NCR minor dari audit sebelumnya terkait kalibrasi alat ukur, target sertifikasi ulang Agustus 2026"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!standarAudit || !tipeAudit || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun laporan audit...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Laporan Audit Internal</>}
            </Button>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm text-white font-semibold">{result.judulLaporan}</p>
                  <p className="text-[10px] text-slate-500">{result.nomorLaporan}</p>
                </div>
                <Button onClick={copyAll} variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
                  {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Disalin</> : <><Copy className="h-3 w-3" />Salin</>}
                </Button>
              </div>
              <p className="text-xs text-slate-300 mt-1">{result.ringkasanEksekutif}</p>
            </div>

            {/* Statistik */}
            {result.statistik && (
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[
                  { label: "Total", value: result.statistik.totalTemuan, color: "text-white" },
                  { label: "Major NC", value: result.statistik.majorNC, color: "text-red-400" },
                  { label: "Minor NC", value: result.statistik.minorNC, color: "text-amber-400" },
                  { label: "OFI", value: result.statistik.ofi, color: "text-blue-400" },
                  { label: "Positif", value: result.statistik.positif, color: "text-emerald-400" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border border-white/8 bg-white/2 p-2 text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Hasil per Klausul */}
            {result.hasilPerKlausul?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
                <button onClick={() => toggleSection("klausul")} className="w-full flex items-center justify-between">
                  <p className="text-xs text-indigo-400 font-semibold">Hasil per Klausul</p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openSection.has("klausul") ? "rotate-180" : ""}`} />
                </button>
                {openSection.has("klausul") && (
                  <div className="mt-3 space-y-1.5">
                    {result.hasilPerKlausul.map((k, i) => (
                      <div key={i} className="flex items-start justify-between py-1 border-b border-white/5">
                        <div>
                          <p className="text-xs text-slate-300">{k.klausul}</p>
                          {k.catatan && <p className="text-[10px] text-slate-500">{k.catatan}</p>}
                        </div>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ml-2 ${k.status.includes("NC") ? "text-red-400 border-red-400/30" : k.status.includes("OFI") ? "text-amber-400 border-amber-400/30" : "text-emerald-400 border-emerald-400/30"}`}>{k.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Temuan */}
            {result.temuan?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
                <button onClick={() => toggleSection("temuan")} className="w-full flex items-center justify-between">
                  <p className="text-xs text-indigo-400 font-semibold">Detail Temuan Audit</p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openSection.has("temuan") ? "rotate-180" : ""}`} />
                </button>
                {openSection.has("temuan") && (
                  <div className="mt-3 space-y-3">
                    {result.temuan.map((t, i) => (
                      <div key={i} className={`rounded-lg border p-3 ${KATEGORI_COLOR[t.kategori] || "border-white/10 bg-white/3"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[9px] ${KATEGORI_COLOR[t.kategori] || ""}`}>{t.kategori}</Badge>
                          <span className="text-[10px] text-slate-400">Klausul {t.klausul}</span>
                        </div>
                        <p className="text-xs text-white font-medium mb-0.5">{t.deskripsi}</p>
                        {t.bukti && <p className="text-[10px] text-slate-400 mb-1">Bukti: {t.bukti}</p>}
                        <p className="text-[10px] text-slate-300"><span className="text-indigo-400">Rekomendasi:</span> {t.rekomendasi}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rekomendasi */}
            {result.rekomendasiTindakLanjut?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
                <button onClick={() => toggleSection("rekomendasi")} className="w-full flex items-center justify-between">
                  <p className="text-xs text-indigo-400 font-semibold">Rekomendasi Tindak Lanjut</p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openSection.has("rekomendasi") ? "rotate-180" : ""}`} />
                </button>
                {openSection.has("rekomendasi") && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-300 mb-2">{result.kesimpulan}</p>
                    <ul className="space-y-1">
                      {result.rekomendasiTindakLanjut.map((r, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-indigo-400 shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.catatanAuditor && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">{result.catatanAuditor}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                <Link href="/iso-claw-9001">ISOClaw 9001 →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
