import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ShieldCheck, Info,
  ChevronDown, RotateCcw, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK_SMKK = [
  "Bangunan Gedung (Kantor / Komersial / Hunian)",
  "Infrastruktur Jalan Nasional / Provinsi",
  "Jembatan & Flyover",
  "Bendungan / Irigasi / Sumber Daya Air",
  "Perumahan Skala Besar",
  "Bangunan Industri / Pabrik",
  "Proyek EPC Energi / Migas",
];

const RISIKO_UTAMA = [
  "Pekerjaan di Ketinggian (>2m)",
  "Galian Dalam (>1.5m)",
  "Pengangkatan Beban Berat (crane)",
  "Pekerjaan Listrik Tegangan Tinggi",
  "Pekerjaan Bongkar / Demolisi",
  "Confined Space / Ruang Terbatas",
  "Peledakan / Blasting",
  "Pekerjaan Bawah Air / Offshore",
];

const ANGGARAN_SMK3 = [
  "< Rp 500 Juta (proyek kecil)",
  "Rp 500 Juta – Rp 10 Miliar",
  "Rp 10 Miliar – Rp 100 Miliar",
  "> Rp 100 Miliar (proyek besar)",
];

interface HasilSMKK {
  ringkasan: string;
  komponenSMKK: { nama: string; deskripsi: string; dokumen: string[]; regulasi: string }[];
  rencanaK3: { elemen: string; kegiatan: string; penanggungJawab: string; jadwal: string }[];
  hirarki: { langkah: string; contoh: string }[];
  strukturOrganisasi: string[];
  anggaranK3: string;
  referensi: string[];
}

export default function PanduanSMKK() {
  const [jenisProyek, setJenisProyek] = useState("");
  const [risiko, setRisiko] = useState<string[]>([]);
  const [anggaran, setAnggaran] = useState(ANGGARAN_SMK3[1]);
  const [durasiProyek, setDurasiProyek] = useState(12);
  const [result, setResult] = useState<HasilSMKK | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openKomponen, setOpenKomponen] = useState<Set<number>>(new Set([0, 1]));
  const [activeTab, setActiveTab] = useState<"komponen" | "rencana" | "hirarki">("komponen");

  function toggleRisiko(r: string) { setRisiko(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]); }
  function toggleKomponen(i: number) { setOpenKomponen(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); }

  async function generate() {
    if (!jenisProyek) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/panduan-smkk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, risiko, anggaran, durasiProyek }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data); setOpenKomponen(new Set([0, 1]));
    } catch (e: any) { setError(e.message || "Gagal generate panduan SMKK."); }
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
              <ShieldCheck className="h-5 w-5 text-orange-400" /> Panduan Penyusunan SMKK
            </h1>
            <p className="text-xs text-slate-400">Sistem Manajemen Keselamatan Konstruksi sesuai Permen PUPR No. 10 Tahun 2021 — panduan komponen, rencana K3, dan hirarki pengendalian</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300">SMKK wajib disusun untuk semua pekerjaan konstruksi. Dokumen ini meliputi Rencana Keselamatan Konstruksi (RKK), IBPR, prosedur darurat, dan laporan berkala. Referensi: Permen PUPR 10/2021 dan SE Menteri PUPR No. 11/2019.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Proyek *</label>
                <div className="space-y-1.5">
                  {JENIS_PROYEK_SMKK.map(s => (
                    <button key={s} onClick={() => setJenisProyek(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisProyek === s ? "bg-orange-500/10 border-orange-400/30 text-orange-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Risiko K3 Utama <span className="text-slate-500">(pilih yang ada di proyek)</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RISIKO_UTAMA.map(r => (
                    <button key={r} onClick={() => toggleRisiko(r)}
                      className={`rounded-lg border py-2 px-2 text-xs text-left transition-all ${risiko.includes(r) ? "bg-orange-500/10 border-orange-400/30 text-orange-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {risiko.includes(r) && <span className="mr-1">✓</span>}{r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Anggaran Proyek</label>
                  <select value={anggaran} onChange={e => setAnggaran(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white focus:outline-none">
                    {ANGGARAN_SMK3.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Durasi Proyek: <span className="text-orange-400">{durasiProyek} bln</span></label>
                  <input type="range" min={1} max={60} value={durasiProyek} onChange={e => setDurasiProyek(+e.target.value)} className="w-full accent-orange-500 mt-1" />
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={generate} disabled={!jenisProyek || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyusun panduan SMKK...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Panduan SMKK</>}
            </Button>
          </div>
        )}

        {loading && <div className="space-y-3 mt-2">{[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse"><div className="h-3 bg-white/8 rounded w-1/2 mb-2" /><div className="h-3 bg-white/8 rounded w-full mb-2" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>)}</div>}

        {result && !loading && (
          <>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 mb-4">
              <p className="text-sm text-white font-semibold mb-1">SMKK — {jenisProyek}</p>
              <p className="text-xs text-slate-300 mb-2">{result.ringkasan}</p>
              <p className="text-[10px] text-orange-400">{result.anggaranK3}</p>
            </div>

            <div className="flex gap-1 mb-4 rounded-xl bg-white/3 border border-white/8 p-1">
              {([["komponen", "Komponen SMKK"], ["rencana", "Rencana K3"], ["hirarki", "Hirarki Kendali"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === k ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
              ))}
            </div>

            {activeTab === "komponen" && (
              <div className="space-y-2">
                {result.komponenSMKK?.map((k, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2">
                    <button onClick={() => toggleKomponen(i)} className="w-full text-left p-3.5 flex items-center gap-2">
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold shrink-0">{i+1}</span>
                      <p className="text-sm text-white font-medium flex-1">{k.nama}</p>
                      <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30 shrink-0">{k.regulasi}</Badge>
                      <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openKomponen.has(i) ? "rotate-180" : ""}`} />
                    </button>
                    {openKomponen.has(i) && (
                      <div className="px-4 pb-4 border-t border-white/8 pt-3">
                        <p className="text-xs text-slate-300 mb-2">{k.deskripsi}</p>
                        <p className="text-[10px] text-orange-400 font-semibold mb-1">Dokumen yang Diperlukan:</p>
                        <div className="space-y-0.5">{k.dokumen.map((d, j) => <p key={j} className="text-xs text-slate-400">• {d}</p>)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "rencana" && (
              <div className="overflow-x-auto rounded-xl border border-white/8 bg-white/2">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/8">{["Elemen","Kegiatan K3","PIC","Jadwal"].map(h => <th key={h} className="text-left text-slate-500 py-2.5 px-3">{h}</th>)}</tr></thead>
                  <tbody>
                    {result.rencanaK3?.map((r, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                        <td className="py-2 px-3 text-orange-400 font-medium">{r.elemen}</td>
                        <td className="py-2 px-3 text-slate-300">{r.kegiatan}</td>
                        <td className="py-2 px-3 text-slate-400">{r.penanggungJawab}</td>
                        <td className="py-2 px-3 text-slate-500">{r.jadwal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "hirarki" && (
              <div className="space-y-2">
                {result.hirarki?.map((h, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${i < 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : i < 4 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>{i+1}</div>
                    <div>
                      <p className="text-xs text-white font-semibold">{h.langkah}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{h.contoh}</p>
                    </div>
                  </div>
                ))}
                {result.referensi?.length > 0 && (
                  <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 mt-2">
                    <p className="text-[10px] text-blue-400 font-semibold mb-1.5">Regulasi Acuan</p>
                    <div className="flex flex-wrap gap-1">{result.referensi.map((r, i) => <Badge key={i} variant="outline" className="text-[9px] text-slate-300 border-slate-600">{r}</Badge>)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Proyek Lain</Button>
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
