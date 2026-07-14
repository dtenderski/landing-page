import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ClipboardCheck, ChevronDown,
  CheckCircle2, AlertTriangle, Info, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const STANDAR_OPTIONS = [
  "ISO 9001:2015 (SMM — Sistem Manajemen Mutu)",
  "ISO 14001:2015 (SML — Sistem Manajemen Lingkungan)",
  "ISO 45001:2018 (SMK3 — Sistem Manajemen K3)",
  "IMS Terintegrasi (ISO 9001 + 14001 + 45001)",
  "SNI ISO 9001:2015 (versi SNI Indonesia)",
];

const JENIS_AUDIT = [
  "Audit Internal Rutin (Tahunan)",
  "Audit Persiapan Sertifikasi Awal",
  "Audit Pemeliharaan (Surveillance)",
  "Audit Re-Sertifikasi",
  "Audit Tindak Lanjut Temuan",
];

const RUANG_LINGKUP = [
  "Seluruh perusahaan", "Operasional proyek di lapangan",
  "Proses manajemen kontrak", "HRD & Rekrutmen",
  "Pengadaan & Supply Chain", "K3 lapangan & administrasi",
];

interface KlausulAudit {
  klausul: string; judul: string;
  pertanyaan: string[];
  buktiyangDicari: string[];
  tembuan: string;
  risikoPotensial: string;
}

interface HasilAudit {
  standar: string; jenisAudit: string;
  ringkasan: string;
  durasiRekomendasiHari: number;
  totalKlausulDiaudit: number;
  klausulList: KlausulAudit[];
  checklistPersiapan: { item: string; status: "Wajib" | "Disarankan" }[];
  tipsAuditor: string[];
  formatLaporan: string[];
}

export default function PanduanAuditMutuISO() {
  const [standar, setStandar] = useState("");
  const [jenisAudit, setJenisAudit] = useState(JENIS_AUDIT[0]);
  const [ruangLingkup, setRuangLingkup] = useState(RUANG_LINGKUP[0]);
  const [result, setResult] = useState<HasilAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openKlausul, setOpenKlausul] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"klausul" | "persiapan" | "tips" | "laporan">("klausul");

  function toggleKlausul(i: number) { setOpenKlausul(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!standar) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-audit-mutu-iso", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standar, jenisAudit, ruangLingkup }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenKlausul(new Set([0]));
    } catch (e: any) { setError(e.message || "Gagal generate panduan."); }
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
              <ClipboardCheck className="h-5 w-5 text-blue-400" /> Panduan Audit Mutu Internal ISO
            </h1>
            <p className="text-xs text-slate-400">Panduan audit mutu internal per klausul: pertanyaan audit, bukti yang dicari, checklist persiapan, format laporan</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">Panduan ini membantu Tim Auditor Internal menyiapkan daftar pertanyaan dan bukti yang relevan per klausul standar ISO sesuai jenis audit yang akan dilakukan.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Standar yang Diaudit *</label>
                <div className="space-y-1.5">
                  {STANDAR_OPTIONS.map(s => (
                    <button key={s} onClick={() => setStandar(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${standar === s ? "bg-blue-500/15 border-blue-400/40 text-blue-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jenis Audit</label>
                  <select value={jenisAudit} onChange={e => setJenisAudit(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {JENIS_AUDIT.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Ruang Lingkup</label>
                  <select value={ruangLingkup} onChange={e => setRuangLingkup(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {RUANG_LINGKUP.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!standar || loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan audit...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Panduan Audit Internal</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/40">{result.standar}</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600">{result.jenisAudit}</Badge>
              </div>
              <p className="text-slate-300 text-sm mb-2">{result.ringkasan}</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{result.totalKlausulDiaudit}</p>
                  <p className="text-[9px] text-slate-500">klausul</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{result.durasiRekomendasiHari}</p>
                  <p className="text-[9px] text-slate-500">hari audit</p>
                </div>
              </div>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["klausul", "Per Klausul"], ["persiapan", "Persiapan"], ["tips", "Tips Auditor"], ["laporan", "Format Laporan"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "klausul" && (
              <div className="space-y-2">
                {result.klausulList?.map((k, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleKlausul(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded shrink-0">{k.klausul}</span>
                      <p className="text-sm text-white font-medium flex-1">{k.judul}</p>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openKlausul.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openKlausul.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                        <div>
                          <p className="text-[10px] text-blue-400 font-semibold mb-1.5">Pertanyaan Audit</p>
                          <ul className="space-y-1">{k.pertanyaan.map((p, pi) => <li key={pi} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-[9px] text-blue-400 shrink-0 font-bold mt-0.5">Q{pi+1}.</span>{p}</li>)}</ul>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-400 font-semibold mb-1.5">Bukti / Dokumen yang Dicari</p>
                          <div className="flex flex-wrap gap-1">{k.buktiyangDicari.map((b, bi) => <Badge key={bi} variant="outline" className="text-[9px] text-emerald-300 border-emerald-400/30">{b}</Badge>)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-slate-900/50 p-2"><p className="text-[9px] text-slate-500">Tembuan</p><p className="text-xs text-slate-300">{k.tembuan}</p></div>
                          <div className={`rounded-lg p-2 ${k.risikoPotensial ? "bg-amber-500/10" : "bg-slate-900/50"}`}><p className="text-[9px] text-slate-500">Risiko Potensial</p><p className="text-xs text-amber-300">{k.risikoPotensial}</p></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "persiapan" && (
              <div className="space-y-2">
                {result.checklistPersiapan?.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-start gap-3 ${c.status === "Wajib" ? "border-red-500/15 bg-red-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className={`w-3.5 h-3.5 rounded border shrink-0 mt-0.5 ${c.status === "Wajib" ? "border-red-400/50" : "border-slate-600"}`} />
                    <div className="flex-1">
                      <p className="text-xs text-white">{c.item}</p>
                      {c.status === "Wajib" && <Badge variant="outline" className="text-[8px] text-red-400 border-red-400/30 mt-0.5">Wajib</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-2">
                {result.tipsAuditor?.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    <p className="text-xs text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "laporan" && (
              <div className="space-y-2">
                {result.formatLaporan?.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">{f}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Standar Lain</Button>
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Link href="/iso-claw-9001">ISOClaw 9001 →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
