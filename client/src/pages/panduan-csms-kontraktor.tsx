import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShieldCheck, ChevronDown, RotateCcw, Info, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const TIPE_OWNER = [
  "BUMN Energi (Pertamina, PLN, PGN)",
  "SKK Migas / Kontraktor KKS",
  "BUMN Konstruksi (Waskita, Wijaya Karya, HK)",
  "Pemerintah / APBN-APBD",
  "Swasta Nasional",
  "Perusahaan Multinasional / PMA",
];

const KATEGORI_CSMS = [
  "Pra-Kualifikasi CSMS (Prequalification)",
  "Evaluasi CSMS Level 1 (Administrasi)",
  "Evaluasi CSMS Level 2 (Lapangan)",
  "Evaluasi CSMS Level 3 (Advanced Audit)",
  "CSMS Renewal / Perpanjangan",
  "Perbaikan NCR CSMS",
];

const SKALA_PEKERJAAN = ["Kecil (< Rp 2 M)", "Menengah (Rp 2–20 M)", "Besar (> Rp 20 M)", "Proyek Migas Kritikal"];

interface ElemenCSMS { elemen: string; persyaratan: string[]; dokumen: string[]; nilaiBobot: string; tipikalNilai: string; }
interface HasilPanduan {
  judulPanduan: string;
  konteks: string;
  elemenCSMS: ElemenCSMS[];
  checklistKesiapan: { kategori: string; items: string[] }[];
  dokumenWajib: string[];
  jadwalPersiapan: { fase: string; durasi: string; aktivitas: string[] }[];
  tipsNilaiTinggi: string[];
  risikoGagal: string[];
  catatanRegulasi: string;
}

export default function PanduanCSMSKontraktor() {
  const [tipeOwner, setTipeOwner] = useState("");
  const [kategoriCSMS, setKategoriCSMS] = useState("");
  const [skalaPekerjaan, setSkalaPekerjaan] = useState("");
  const [kondisiExisting, setKondisiExisting] = useState("");
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openElemen, setOpenElemen] = useState<Set<number>>(new Set([0, 1]));
  const [openChecklist, setOpenChecklist] = useState<Set<number>>(new Set([0]));

  function toggleElemen(i: number) { setOpenElemen(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }
  function toggleChecklist(i: number) { setOpenChecklist(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!tipeOwner || !kategoriCSMS) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-csms-kontraktor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipeOwner, kategoriCSMS, skalaPekerjaan, kondisiExisting }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenElemen(new Set([0, 1])); setOpenChecklist(new Set([0]));
    } catch (e: any) { setError(e.message || "Gagal generate panduan CSMS."); }
    finally { setLoading(false); }
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
              <ShieldCheck className="h-5 w-5 text-orange-400" /> Panduan CSMS Kontraktor
            </h1>
            <p className="text-xs text-slate-400">Contractor Safety Management System — BUMN, SKK Migas, Pertamina, PLN</p>
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <Badge variant="outline" className="text-orange-400 border-orange-400/30">Gelombang 19</Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-start gap-2">
              <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">CSMS adalah syarat wajib untuk tender pekerjaan di lingkungan BUMN, SKK Migas, dan perusahaan multinasional. Nilai CSMS mempengaruhi kelulusan pra-kualifikasi tender.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Tipe Owner / Pemberi Kerja *</label>
                <div className="space-y-1.5">
                  {TIPE_OWNER.map(t => (
                    <button key={t} onClick={() => setTipeOwner(t)}
                      className={`w-full text-left rounded-lg border py-2 px-3 text-xs transition-all ${tipeOwner === t ? "bg-orange-500/10 border-orange-400/30 text-orange-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Kategori / Fase CSMS *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {KATEGORI_CSMS.map(k => (
                    <button key={k} onClick={() => setKategoriCSMS(k)}
                      className={`rounded-lg border py-2 px-2.5 text-xs text-left transition-all ${kategoriCSMS === k ? "bg-orange-500/10 border-orange-400/30 text-orange-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{k}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Skala Pekerjaan</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SKALA_PEKERJAAN.map(s => (
                    <button key={s} onClick={() => setSkalaPekerjaan(s)}
                      className={`rounded-lg border py-1.5 px-2.5 text-xs transition-all ${skalaPekerjaan === s ? "bg-orange-500/10 border-orange-400/30 text-orange-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Kondisi SMK3 / CSMS Saat Ini</label>
                <textarea value={kondisiExisting} onChange={e => setKondisiExisting(e.target.value)} rows={2}
                  placeholder="cth: Sudah punya ISO 45001:2018, SMK3 PP 50/2012 Bendera Emas, nilai CSMS 2023 = 82/100, NCR terkait inspeksi alat"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none" />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!tipeOwner || !kategoriCSMS || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan CSMS...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Panduan CSMS</>}
            </Button>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 mb-4">
              <p className="text-sm text-white font-semibold">{result.judulPanduan}</p>
              <p className="text-xs text-slate-300 mt-1">{result.konteks}</p>
            </div>

            {/* Elemen CSMS */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-orange-400 font-semibold mb-2">Elemen CSMS & Persyaratan</p>
              {result.elemenCSMS?.map((el, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleElemen(idx)} className="w-full flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium text-left">{el.elemen}</p>
                      <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-400/30">{el.nilaiBobot}</Badge>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openElemen.has(idx) ? "rotate-180" : ""}`} />
                  </button>
                  {openElemen.has(idx) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                      <p className="text-[10px] text-slate-400">Nilai tipikal: <span className="text-orange-400">{el.tipikalNilai}</span></p>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">Persyaratan:</p>
                        <ul className="space-y-0.5">{el.persyaratan?.map((p, i) => <li key={i} className="text-xs text-slate-300 flex gap-1.5"><span className="text-orange-400">•</span>{p}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">Dokumen yang dibutuhkan:</p>
                        <ul className="space-y-0.5">{el.dokumen?.map((d, i) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-emerald-400">📄</span>{d}</li>)}</ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Checklist Kesiapan */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-orange-400 font-semibold mb-2">Checklist Kesiapan CSMS</p>
              {result.checklistKesiapan?.map((c, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-white/2">
                  <button onClick={() => toggleChecklist(idx)} className="w-full flex items-center justify-between p-3.5">
                    <p className="text-sm text-white font-medium">{c.kategori}</p>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openChecklist.has(idx) ? "rotate-180" : ""}`} />
                  </button>
                  {openChecklist.has(idx) && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3">
                      <ul className="space-y-1.5">{c.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />{item}
                        </li>
                      ))}</ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Jadwal Persiapan */}
            {result.jadwalPersiapan?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
                <p className="text-xs text-orange-400 font-semibold mb-3">Jadwal Persiapan CSMS</p>
                <div className="space-y-2">
                  {result.jadwalPersiapan.map((j, i) => (
                    <div key={i} className="rounded-lg bg-white/3 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white font-medium">{j.fase}</p>
                        <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-400/30">{j.durasi}</Badge>
                      </div>
                      <ul className="space-y-0.5">{j.aktivitas?.map((a, ai) => <li key={ai} className="text-[11px] text-slate-400 flex gap-1"><span className="text-slate-600">▸</span>{a}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tipsNilaiTinggi?.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-3">
                <p className="text-xs text-emerald-400 font-semibold mb-2">💡 Tips Raih Nilai CSMS Tinggi</p>
                <ul className="space-y-1">{result.tipsNilaiTinggi.map((t, i) => <li key={i} className="text-xs text-slate-300 flex gap-1.5"><span className="text-emerald-400">✓</span>{t}</li>)}</ul>
              </div>
            )}

            {result.catatanRegulasi && (
              <div className="rounded-lg border border-white/8 bg-white/2 p-3 mb-4">
                <p className="text-[10px] text-slate-400">{result.catatanRegulasi}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Buat Ulang</Button>
              <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs">
                <Link href="/smk3-claw">SMK3Claw AI →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
