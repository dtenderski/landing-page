import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, ChevronRight,
  Clock, Calendar, FileText, Shield, Award, Info,
  AlertTriangle, ExternalLink, ChevronDown, HelpCircle
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
];

const HASIL_OPTIONS = ["Kompeten — Lulus", "Belum Kompeten — Tidak Lulus"];

interface Fase {
  nomor: number; judul: string; durasi: string;
  langkah: { aksi: string; detail: string; waktunya: string }[];
}

interface HasilPanduan {
  jabatan: string; hasilAsesmen: string;
  pesanMotivasi: string;
  fase: Fase[];
  hakDanKewajiban: { hak: string; detail: string }[];
  caraGunakanSKK: { konteks: string; caranya: string }[];
  sistemDigital: { sistem: string; fungsi: string; caraDaftar: string }[];
  faq: { pertanyaan: string; jawaban: string }[];
  tipsKeamananSKK: string[];
  reminderPerpanjangan: string;
}

export default function PanduanPascaAsesmen() {
  const [jabatan, setJabatan] = useState("");
  const [hasilAsesmen, setHasilAsesmen] = useState("Kompeten — Lulus");
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFase, setOpenFase] = useState<Set<number>>(new Set([0]));
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"fase" | "penggunaan" | "sistem" | "faq">("fase");

  function toggleFase(i: number) { setOpenFase(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }
  function toggleFaq(i: number) { setOpenFaq(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null); setOpenFase(new Set([0]));
    try {
      const res = await fetch("/api/tools/panduan-pasca-asesmen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, hasilAsesmen }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate panduan."); }
    finally { setLoading(false); }
  }

  const isLulus = hasilAsesmen.includes("Kompeten");

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-sky-400" /> Panduan Pasca-Asesmen SKK
            </h1>
            <p className="text-xs text-slate-400">Apa yang harus dilakukan setelah asesmen — proses SKK, cara menggunakan, dan sistem digital</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-300">AI akan buat panduan lengkap: proses penerbitan SKK, cara mendaftarkan ke SIKI-SKK/SiKA-SKK, cara menggunakan SKK di tender & proyek, perpanjangan, dan FAQ.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Diases *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400/50">
                  <option value="">Pilih jabatan SKK...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Hasil Asesmen</label>
                <div className="grid grid-cols-2 gap-2">
                  {HASIL_OPTIONS.map(h => (
                    <button key={h} onClick={() => setHasilAsesmen(h)}
                      className={`rounded-xl border py-3 px-3 text-xs transition-all text-left ${hasilAsesmen === h ? (h.includes("Kompeten —") ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "bg-red-500/15 border-red-400/40 text-red-300") : "border-white/10 text-slate-400 hover:text-white"}`}>
                      <p className="font-semibold">{h.split(" — ")[0]}</p>
                      <p className="text-[10px] opacity-70">{h.split(" — ")[1]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jabatan || loading} className="w-full bg-sky-600 hover:bg-sky-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan pasca-asesmen...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan Pasca-Asesmen</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className={`rounded-2xl border p-4 mb-4 ${isLulus ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className={`text-xs ${isLulus ? "text-emerald-400 border-emerald-400/40" : "text-amber-400 border-amber-400/40"}`}>{result.hasilAsesmen}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.jabatan}</Badge>
              </div>
              <p className={`text-sm font-medium ${isLulus ? "text-emerald-300" : "text-amber-300"}`}>{result.pesanMotivasi}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["fase", "Langkah Selanjutnya"], ["penggunaan", "Cara Pakai"], ["sistem", "Sistem Digital"], ["faq", "FAQ"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "fase" && (
              <div className="space-y-2">
                {result.fase?.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleFase(i)} className="w-full text-left p-3.5 flex items-center gap-3">
                      <div className={`rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold ${openFase.has(i) ? "bg-sky-500/20 text-sky-400" : "bg-white/5 text-slate-400"}`}>{f.nomor}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{f.judul}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />{f.durasi}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openFase.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openFase.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                        {f.langkah.map((l, li) => (
                          <div key={li} className="rounded-lg bg-slate-900/40 p-3">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs text-white font-medium">{l.aksi}</p>
                              <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-700 shrink-0 ml-2">{l.waktunya}</Badge>
                            </div>
                            <p className="text-xs text-slate-400">{l.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "penggunaan" && (
              <div className="space-y-3">
                {result.caraGunakanSKK?.map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-xs text-sky-400 font-semibold mb-2">{c.konteks}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.caranya}</p>
                  </div>
                ))}
                {result.hakDanKewajiban?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-400 text-xs font-semibold mb-2">Hak & Kewajiban Pemegang SKK</p>
                    {result.hakDanKewajiban.map((h, i) => (
                      <div key={i} className="mb-2">
                        <p className="text-xs text-white font-medium">{h.hak}</p>
                        <p className="text-xs text-slate-400">{h.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
                {result.reminderPerpanjangan && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-amber-400 font-semibold mb-0.5">Reminder Perpanjangan</p>
                      <p className="text-xs text-slate-300">{result.reminderPerpanjangan}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sistem" && (
              <div className="space-y-3">
                {result.sistemDigital?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-sky-400 shrink-0" />
                      <p className="text-sm text-white font-medium">{s.sistem}</p>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{s.fungsi}</p>
                    <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                      <p className="text-[10px] text-slate-500 font-semibold mb-1">Cara Daftar / Akses</p>
                      <p className="text-xs text-slate-300">{s.caraDaftar}</p>
                    </div>
                  </div>
                ))}
                {result.tipsKeamananSKK?.length > 0 && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Tips Keamanan SKK</p>
                    <ul className="space-y-1">{result.tipsKeamananSKK.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{t}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-2">
                {result.faq?.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleFaq(i)} className="w-full text-left p-3.5 flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <p className="text-sm text-slate-200 flex-1">{f.pertanyaan}</p>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openFaq.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openFaq.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3">
                        <p className="text-sm text-slate-400 leading-relaxed">{f.jawaban}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-sky-600 hover:bg-sky-700 text-xs">
                <Link href="/kalkulator-cpd">Kalkulator CPD →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
