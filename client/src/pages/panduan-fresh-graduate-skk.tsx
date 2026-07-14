import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, GraduationCap, ChevronRight,
  ChevronDown, CheckCircle2, Info, Target, Clock, Star, Lightbulb
} from "lucide-react";
import { Link } from "wouter";

const JURUSAN_OPTIONS = [
  "Teknik Sipil", "Teknik Arsitektur", "Teknik Lingkungan",
  "Teknik Mesin", "Teknik Elektro", "Teknik Industri",
  "Manajemen Konstruksi", "Manajemen Proyek", "Perencanaan Wilayah & Kota",
  "Keselamatan & Kesehatan Kerja (K3)", "Teknik Geodesi / Geomatika",
  "Lainnya (teknik/sains)",
];

const IPK_OPTIONS = ["< 2.75", "2.75 – 3.00", "3.00 – 3.50", "> 3.50"];
const PENGALAMAN_OPTIONS = [
  "Belum ada sama sekali",
  "Magang / KP ≤ 3 bulan",
  "Magang / KP 3–6 bulan di proyek konstruksi",
  "Kerja paruh waktu / freelance konstruksi",
  "Sudah bekerja < 1 tahun di konstruksi",
];

interface HasilPanduan {
  jurusan: string;
  ringkasan: string;
  jabatanYangRealistis: {
    jabatan: string; alasan: string; persyaratanMinimal: string;
    jalurCepat: string; estimasiWaktu: string;
  }[];
  strategiRPL: { tips: string; contoh: string }[];
  langkahPertama: { langkah: string; detail: string; waktu: string }[];
  kesalahanUmum: string[];
  motivasi: string;
}

export default function PanduanFreshGraduateSKK() {
  const [jurusan, setJurusan] = useState("");
  const [ipk, setIpk] = useState("> 3.50");
  const [pengalaman, setPengalaman] = useState("Magang / KP 3–6 bulan di proyek konstruksi");
  const [result, setResult] = useState<HasilPanduan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openJabatan, setOpenJabatan] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"jabatan" | "rpl" | "langkah" | "hindari">("jabatan");

  function toggleJabatan(i: number) { setOpenJabatan(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jurusan) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-fresh-graduate-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurusan, ipk, pengalaman }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
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
              <GraduationCap className="h-5 w-5 text-green-400" /> Panduan SKK untuk Fresh Graduate
            </h1>
            <p className="text-xs text-slate-400">Jalur cepat mendapat SKK pertama setelah lulus kuliah — jabatan realistis, strategi RPL, dan langkah konkret</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-start gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-xs text-green-300">Baru lulus atau masih kuliah tingkat akhir? SKK bisa didapat lebih cepat dari yang Anda kira — bahkan dengan pengalaman magang saja. AI akan tunjukkan jalur yang realistis untuk jurusan dan latar belakang Anda.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jurusan / Bidang Studi *</label>
                <select value={jurusan} onChange={e => setJurusan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400/50">
                  <option value="">Pilih jurusan...</option>
                  {JURUSAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">IPK</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {IPK_OPTIONS.map(i => (
                    <button key={i} onClick={() => setIpk(i)}
                      className={`rounded-lg border py-2 text-xs transition-all ${ipk === i ? "bg-green-500/15 border-green-400/40 text-green-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{i}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Pengalaman Sejauh Ini</label>
                <div className="space-y-1.5">
                  {PENGALAMAN_OPTIONS.map(p => (
                    <button key={p} onClick={() => setPengalaman(p)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${pengalaman === p ? "bg-green-500/15 border-green-400/40 text-green-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jurusan || loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan fresh graduate...</> : <><Sparkles className="h-4 w-4 mr-2" />Buat Panduan SKK Pertamaku</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-4">
              <Badge variant="outline" className="text-xs text-green-400 border-green-400/40 mb-1">{result.jurusan}</Badge>
              <p className="text-slate-300 text-sm mb-2">{result.ringkasan}</p>
              <p className="text-green-300 text-xs italic">{result.motivasi}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["jabatan", "Jabatan Target"], ["rpl", "Strategi RPL"], ["langkah", "Langkah Pertama"], ["hindari", "Hindari Ini"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-[10px] font-medium rounded-lg transition-all ${activeTab === k ? "bg-green-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "jabatan" && (
              <div className="space-y-2">
                {result.jabatanYangRealistis?.map((j, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleJabatan(i)} className="w-full text-left p-4 flex items-start gap-3">
                      <div className={`rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold ${openJabatan.has(i) ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-400"}`}>{i+1}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{j.jabatan}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">{j.estimasiWaktu}</span>
                          <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30">Realistis</Badge>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openJabatan.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openJabatan.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-2">
                        <p className="text-xs text-slate-400">{j.alasan}</p>
                        <div className="rounded-lg border border-white/8 bg-slate-900/50 p-3 space-y-2">
                          <div>
                            <p className="text-[10px] text-slate-500 font-semibold">Persyaratan Minimal</p>
                            <p className="text-xs text-slate-300">{j.persyaratanMinimal}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-green-400 font-semibold">Jalur Cepat untuk Fresh Graduate</p>
                            <p className="text-xs text-slate-300">{j.jalurCepat}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "rpl" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
                  <p className="text-xs text-green-400 font-semibold mb-1 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Apa itu RPL?</p>
                  <p className="text-xs text-slate-300">RPL (Rekognisi Pembelajaran Lampau) memungkinkan pengalaman magang, proyek kampus, dan pelatihan dihitung sebagai bukti kompetensi — tanpa harus punya pengalaman kerja formal bertahun-tahun.</p>
                </div>
                {result.strategiRPL?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <p className="text-xs text-white font-medium mb-1">{s.tips}</p>
                    <p className="text-xs text-slate-400">{s.contoh}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "langkah" && (
              <div className="space-y-3">
                {result.langkahPertama?.map((l, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-4 flex items-start gap-3">
                    <div className="rounded-full bg-green-500/20 w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold text-green-400">{i+1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-white font-medium">{l.langkah}</p>
                        <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{l.waktu}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{l.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hindari" && (
              <div className="space-y-2">
                {result.kesalahanUmum?.map((k, i) => (
                  <div key={i} className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-red-400">{i+1}</span>
                    </div>
                    <p className="text-xs text-slate-300">{k}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jurusan Lain</Button>
              <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
                <Link href="/kalkulator-rpl">Kalkulator RPL →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
