import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ChevronDown, ChevronRight,
  FileText, CheckCircle2, AlertTriangle, Info, Lightbulb,
  ClipboardList, BookOpen, HelpCircle
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

const JALUR_OPTIONS = ["Asesmen Langsung", "Portofolio / RPL", "Pelatihan + Asesmen"];

interface SeksiAPL {
  nomor: string;
  judul: string;
  tujuan: string;
  petunjukPengisian: string[];
  contohIsi: string;
  kesalahanUmum: string[];
  tipsPenting: string[];
}

interface HasilPanduanAPL {
  jabatan: string;
  jalur: string;
  overview: string;
  dokumenPendukung: { nama: string; wajib: boolean; keterangan: string }[];
  seksi: SeksiAPL[];
  checklist: { item: string; kritikal: boolean }[];
  peringatanUmum: string[];
}

export default function PanduanAPL01() {
  const [jabatan, setJabatan] = useState("");
  const [jalur, setJalur] = useState("Asesmen Langsung");
  const [pertanyaanKhusus, setPertanyaanKhusus] = useState("");
  const [result, setResult] = useState<HasilPanduanAPL | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSeksi, setOpenSeksi] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"panduan" | "dokumen" | "checklist">("panduan");

  function toggleSeksi(i: number) {
    setOpenSeksi(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  async function generate() {
    if (!jabatan) return;
    setLoading(true); setError(""); setResult(null); setOpenSeksi(new Set([0]));
    try {
      const res = await fetch("/api/tools/panduan-apl01", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, jalur, pertanyaanKhusus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate. Coba lagi."); }
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
              <ClipboardList className="h-5 w-5 text-rose-400" /> Panduan Pengisian APL-01
            </h1>
            <p className="text-xs text-slate-400">Petunjuk lengkap isi formulir APL-01 pendaftaran asesmen SKK per jabatan</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mb-5 space-y-3">
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">APL-01 adalah formulir pendaftaran asesmen SKK ke LSP. Mengisi APL-01 dengan benar adalah langkah pertama yang menentukan kelancaran proses asesmen.</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Akan Didaftarkan *</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400/50">
              <option value="">Pilih jabatan SKK...</option>
              {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Jalur Asesmen</label>
            <div className="grid grid-cols-3 gap-1.5">
              {JALUR_OPTIONS.map(j => (
                <button key={j} onClick={() => setJalur(j)}
                  className={`rounded-lg border py-2 text-xs transition-all ${jalur === j ? "bg-rose-500/15 border-rose-400/40 text-rose-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                  {j}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Pertanyaan / Kendala Khusus <span className="text-slate-600">(opsional)</span></label>
            <input value={pertanyaanKhusus} onChange={e => setPertanyaanKhusus(e.target.value)}
              placeholder="cth: bingung isi bagian pengalaman kerja, tidak ada surat keterangan dari perusahaan lama"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50" />
          </div>
          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
          <Button onClick={generate} disabled={!jabatan || loading} className="w-full bg-rose-600 hover:bg-rose-700">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan APL-01...</> : <><FileText className="h-4 w-4 mr-2" />Buat Panduan APL-01</>}
          </Button>
        </div>

        {loading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-2/3 mb-2" /><div className="h-3 bg-white/8 rounded w-full" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className="text-xs text-rose-400 border-rose-400/40">APL-01</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.jabatan}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{result.jalur}</Badge>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.overview}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["panduan", "Petunjuk per Seksi"], ["dokumen", "Dokumen Pendukung"], ["checklist", "Checklist"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {/* Panduan per Seksi */}
            {activeTab === "panduan" && (
              <div className="space-y-2">
                {result.seksi?.map((s, i) => {
                  const isOpen = openSeksi.has(i);
                  return (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                      <button onClick={() => toggleSeksi(i)} className="w-full text-left p-4 flex items-center gap-3">
                        <div className="rounded-lg bg-rose-500/15 w-7 h-7 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-rose-400">{s.nomor}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">{s.judul}</p>
                          <p className="text-[10px] text-slate-500">{s.tujuan}</p>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold mb-1.5">Cara Mengisi</p>
                            <ul className="space-y-1">
                              {s.petunjukPengisian.map((p, pi) => <li key={pi} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />{p}</li>)}
                            </ul>
                          </div>
                          {s.contohIsi && (
                            <div className="rounded-lg bg-slate-900/60 border border-white/8 px-3 py-2">
                              <p className="text-[9px] text-slate-500 font-semibold uppercase mb-1">Contoh Isian</p>
                              <p className="text-xs text-slate-300 italic">{s.contohIsi}</p>
                            </div>
                          )}
                          {s.kesalahanUmum?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-amber-400 font-semibold mb-1.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Kesalahan Umum</p>
                              <ul className="space-y-1">{s.kesalahanUmum.map((k, ki) => <li key={ki} className="text-xs text-slate-400 flex items-start gap-1.5"><span className="text-amber-400">!</span>{k}</li>)}</ul>
                            </div>
                          )}
                          {s.tipsPenting?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-rose-400 font-semibold mb-1.5 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Tips Penting</p>
                              <ul className="space-y-1">{s.tipsPenting.map((t, ti) => <li key={ti} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-rose-400">→</span>{t}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dokumen */}
            {activeTab === "dokumen" && (
              <div className="space-y-2">
                {result.dokumenPendukung?.map((d, i) => (
                  <div key={i} className={`rounded-xl border p-3.5 flex items-start gap-3 ${d.wajib ? "border-red-500/20 bg-red-500/5" : "border-white/8 bg-white/2"}`}>
                    <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${d.wajib ? "text-red-400" : "text-slate-400"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm text-white font-medium">{d.nama}</p>
                        <Badge variant="outline" className={`text-[9px] ${d.wajib ? "text-red-400 border-red-400/30 bg-red-500/5" : "text-slate-500 border-slate-600"}`}>{d.wajib ? "Wajib" : "Pendukung"}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{d.keterangan}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Checklist */}
            {activeTab === "checklist" && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-3">Centang semua item sebelum menyerahkan formulir APL-01 ke LSP</p>
                {result.checklist?.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${c.kritikal ? "border-rose-500/20 bg-rose-500/5" : "border-white/8 bg-white/2"}`}>
                    <div className={`w-5 h-5 rounded border-2 shrink-0 ${c.kritikal ? "border-rose-400" : "border-slate-600"}`} />
                    <span className={`text-xs ${c.kritikal ? "text-slate-200 font-medium" : "text-slate-400"}`}>{c.item}</span>
                    {c.kritikal && <Badge variant="outline" className="text-[9px] text-rose-400 border-rose-400/30 ml-auto shrink-0">Kritikal</Badge>}
                  </div>
                ))}
              </div>
            )}

            {result.peringatanUmum?.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Peringatan Umum</p>
                <ul className="space-y-1">{result.peringatanUmum.map((p, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Jabatan Lain</Button>
              <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
                <Link href="/evaluasi-portofolio">Evaluasi Portofolio →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
