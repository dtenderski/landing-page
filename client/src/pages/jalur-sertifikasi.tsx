import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ChevronRight, MapPin,
  Target, TrendingUp, DollarSign, Clock, Star, Lightbulb,
  Info, CheckCircle2, Circle, Award, Building2, GraduationCap,
  BarChart3, Calendar, ArrowRight
} from "lucide-react";
import { Link } from "wouter";

const PROFESI_OPTIONS = [
  "Teknisi / Pelaksana Lapangan",
  "Drafter / Juru Gambar",
  "Surveyor / Juru Ukur",
  "Mandor / Kepala Tukang",
  "Safety Officer / Petugas K3",
  "Quality Control / QC Inspector",
  "Engineer / Insinyur Junior",
  "Site Engineer",
  "Project Engineer",
  "Supervisor Konstruksi",
  "Site Manager",
  "Project Manager",
  "Konsultan Perencana",
  "Konsultan Pengawas",
  "Quantity Surveyor",
  "Contract Manager",
  "Construction Manager",
  "General Manager Proyek",
];

const BIDANG_OPTIONS = [
  "Bangunan Gedung",
  "Infrastruktur & Jalan",
  "Jembatan & Struktur",
  "Mekanikal-Elektrikal (MEP)",
  "Manajemen Proyek",
  "K3 Konstruksi",
  "Quantity Surveying / Estimasi",
  "Arsitektur",
  "Geoteknik & Pondasi",
  "Manajemen Kontrak",
];

const PENGALAMAN_OPTIONS = [
  "< 2 tahun",
  "2–4 tahun",
  "5–7 tahun",
  "8–10 tahun",
  "> 10 tahun",
];

const PENDIDIKAN_OPTIONS = [
  "SMA/SMK",
  "D3 (Diploma 3)",
  "S1 / D4",
  "S2 (Magister)",
];

const TARGET_OPTIONS = [
  "Masuk ke BUJK besar / BUMN",
  "Naik jabatan ke level madya",
  "Naik jabatan ke level utama",
  "Jadi konsultan independen",
  "Buka perusahaan jasa konstruksi (BUJK)",
  "Spesialisasi di bidang K3",
  "Spesialisasi di bidang kontrak / hukum",
  "Karir internasional / proyek luar negeri",
];

const HORIZON_OPTIONS = [
  "3 tahun",
  "5 tahun",
  "7–10 tahun",
];

interface LangkahSertifikasi {
  tahap: number;
  tahunTarget: string;
  skkYangDiperoleh: string;
  kkniLevel: string;
  prasyarat: string;
  alasan: string;
  estimasiBiaya: string;
  estimasiWaktuPersiapan: string;
  manfaatKarir: string;
  prioritas: "Wajib" | "Sangat Direkomendasikan" | "Opsional";
}

interface HasilJalur {
  profilRingkas: string;
  skkSaatIni: string;
  targetKarir: string;
  totalEstimasiBiaya: string;
  totalTahun: string;
  ringkasanStrategi: string;
  langkah: LangkahSertifikasi[];
  keuntunganJalurIni: string[];
  peringatanPenting: string[];
  tipUmum: string;
}

const PRIORITAS_CONFIG = {
  "Wajib": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", badge: "bg-red-500/10 text-red-400 border-red-400/30" },
  "Sangat Direkomendasikan": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", badge: "bg-amber-500/10 text-amber-400 border-amber-400/30" },
  "Opsional": { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", badge: "bg-slate-500/10 text-slate-400 border-slate-400/30" },
};

export default function JalurSertifikasi() {
  const [form, setForm] = useState({
    profesi: "", bidang: "", pengalaman: "", pendidikan: "",
    skkSudahPunya: "", targetKarir: "", horizon: "5 tahun",
  });
  const [result, setResult] = useState<HasilJalur | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const isFormValid = form.profesi && form.bidang && form.pengalaman && form.pendidikan && form.targetKarir;

  async function generate() {
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    setResult(null);
    setExpandedStep(0);
    try {
      const res = await fetch("/api/tools/jalur-sertifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal membuat roadmap. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-400" /> Rekomendasi Jalur Sertifikasi SKK
            </h1>
            <p className="text-xs text-slate-400">Roadmap sertifikasi multi-tahun yang optimal untuk karir Anda</p>
          </div>
        </div>

        {/* Setup Form */}
        {!result && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Profesi / Jabatan Saat Ini *</label>
                <select value={form.profesi} onChange={e => setForm(f => ({ ...f, profesi: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                  <option value="">Pilih profesi...</option>
                  {PROFESI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Bidang Keahlian *</label>
                <select value={form.bidang} onChange={e => setForm(f => ({ ...f, bidang: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                  <option value="">Pilih bidang...</option>
                  {BIDANG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Pengalaman Kerja *</label>
                <select value={form.pengalaman} onChange={e => setForm(f => ({ ...f, pengalaman: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                  <option value="">Pilih...</option>
                  {PENGALAMAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Pendidikan Terakhir *</label>
                <select value={form.pendidikan} onChange={e => setForm(f => ({ ...f, pendidikan: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/50">
                  <option value="">Pilih...</option>
                  {PENDIDIKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">SKK yang Sudah Dimiliki <span className="text-slate-600">(opsional)</span></label>
              <input value={form.skkSudahPunya} onChange={e => setForm(f => ({ ...f, skkSudahPunya: e.target.value }))}
                placeholder="cth: Ahli K3 Konstruksi Muda (2022), Ahli Manajemen Proyek Muda (2023)"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-400/50" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Target Karir yang Ingin Dicapai *</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TARGET_OPTIONS.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, targetKarir: t }))}
                    className={`rounded-lg border px-3 py-2.5 text-xs text-left transition-all ${form.targetKarir === t ? "bg-orange-500/15 border-orange-400/40 text-orange-300" : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Horizon Perencanaan</label>
              <div className="flex gap-2">
                {HORIZON_OPTIONS.map(h => (
                  <button key={h} onClick={() => setForm(f => ({ ...f, horizon: h }))}
                    className={`flex-1 rounded-lg border py-2 text-xs transition-all ${form.horizon === h ? "bg-orange-500/15 border-orange-400/40 text-orange-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}

            <Button onClick={generate} disabled={!isFormValid || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Merancang roadmap sertifikasi...</>
                : <><Sparkles className="h-4 w-4 mr-2" />Buat Roadmap Sertifikasi</>
              }
            </Button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3 mt-4">
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse">
              <div className="h-4 bg-white/8 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/8 rounded w-full mb-1" />
              <div className="h-3 bg-white/8 rounded w-3/4" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-white/8" />
                  <div className="flex-1"><div className="h-3 bg-white/8 rounded w-1/2 mb-1" /><div className="h-3 bg-white/8 rounded w-3/4" /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <>
            {/* Summary Banner */}
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 mb-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1">
                  <p className="text-orange-400 text-xs font-semibold mb-1">Roadmap Sertifikasi SKK</p>
                  <h2 className="text-white text-base font-bold mb-2">{result.targetKarir}</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/40 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{result.totalTahun}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />{result.totalEstimasiBiaya}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-sky-400 border-sky-400/40 flex items-center gap-1">
                      <Award className="h-3 w-3" />{result.langkah.length} tahap
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{result.ringkasanStrategi}</p>
                </div>
              </div>
            </div>

            {/* Keuntungan & Peringatan */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {result.keuntunganJalurIni?.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Keunggulan Jalur Ini
                  </p>
                  <ul className="space-y-1">
                    {result.keuntunganJalurIni.map((k, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0">•</span>{k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.peringatanPenting?.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> Perhatikan
                  </p>
                  <ul className="space-y-1">
                    {result.peringatanPenting.map((p, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Timeline Steps */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Roadmap Tahapan Sertifikasi
              </p>
              <div className="space-y-2">
                {result.langkah.map((langkah, idx) => {
                  const isOpen = expandedStep === idx;
                  const pc = PRIORITAS_CONFIG[langkah.prioritas] || PRIORITAS_CONFIG["Opsional"];
                  const isLast = idx === result.langkah.length - 1;
                  return (
                    <div key={idx}>
                      <div className={`rounded-xl border transition-all ${isOpen ? pc.bg : "border-white/8 bg-white/2 hover:bg-white/4"}`}>
                        <button onClick={() => setExpandedStep(isOpen ? null : idx)} className="w-full text-left p-4">
                          <div className="flex items-start gap-3">
                            {/* Step number circle */}
                            <div className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-xs font-bold ${isOpen ? "bg-orange-500 text-white" : "bg-white/8 text-slate-400"}`}>
                              {langkah.tahap}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <Badge variant="outline" className={`text-[9px] shrink-0 ${pc.badge}`}>{langkah.prioritas}</Badge>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />{langkah.tahunTarget}
                                </span>
                                <span className="text-[10px] text-slate-500">{langkah.kkniLevel}</span>
                              </div>
                              <p className={`text-sm font-semibold ${isOpen ? "text-white" : "text-slate-200"}`}>{langkah.skkYangDiperoleh}</p>
                              {!isOpen && <p className="text-xs text-slate-500 mt-0.5 truncate">{langkah.alasan}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-emerald-400 font-medium">{langkah.estimasiBiaya}</span>
                              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                            <p className="text-slate-300 text-sm leading-relaxed">{langkah.alasan}</p>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-lg border border-white/8 bg-slate-900/50 p-2.5">
                                <p className="text-[10px] text-slate-500 mb-1">Prasyarat</p>
                                <p className="text-xs text-slate-300">{langkah.prasyarat}</p>
                              </div>
                              <div className="rounded-lg border border-white/8 bg-slate-900/50 p-2.5">
                                <p className="text-[10px] text-slate-500 mb-1">Waktu Persiapan</p>
                                <p className="text-xs text-slate-300">{langkah.estimasiWaktuPersiapan}</p>
                              </div>
                            </div>

                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Dampak Karir</p>
                                <p className="text-xs text-slate-300">{langkah.manfaatKarir}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {!isLast && (
                        <div className="flex justify-center my-1">
                          <ArrowRight className="h-4 w-4 text-slate-700 rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tip umum */}
            {result.tipUmum && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
                <p className="text-violet-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Tips Sukses Menjalankan Roadmap
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">{result.tipUmum}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button onClick={() => { setResult(null); setExpandedStep(0); }} variant="outline" className="flex-1 text-xs">
                Buat Roadmap Baru
              </Button>
              <Button asChild className="flex-1 bg-sky-600 hover:bg-sky-700 text-xs">
                <Link href="/analisis-skkni">Pelajari Unit SKKNI →</Link>
              </Button>
            </div>
          </>
        )}

        {/* Info */}
        {!result && !loading && (
          <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
            <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Roadmap disesuaikan dengan peraturan LPJK/BNSP, syarat pengalaman per level KKNI, dan realita industri konstruksi Indonesia. Biaya estimasi berdasarkan rata-rata pasar 2024–2025.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
