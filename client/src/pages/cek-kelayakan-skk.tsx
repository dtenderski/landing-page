import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Trophy, TrendingUp, Target, Download, RotateCcw, User
} from "lucide-react";
import { Link } from "wouter";

const EDUCATION_OPTIONS = [
  "SMA/SMK Teknik",
  "D3 Teknik Sipil",
  "D3 Arsitektur",
  "D3 Teknik Mesin/Elektro",
  "D4/S1 Teknik Sipil",
  "D4/S1 Arsitektur",
  "D4/S1 Teknik Lingkungan",
  "D4/S1 Teknik Mesin",
  "D4/S1 Teknik Elektro",
  "D4/S1 Teknik Geodesi/Geomatika",
  "D4/S1 Teknik Geologi",
  "D4/S1 Manajemen/Ekonomi",
  "D4/S1 Kesehatan & Keselamatan Kerja (K3)",
  "S2 Teknik Sipil",
  "S2 Arsitektur",
  "S2 Manajemen Konstruksi",
  "S2 Teknik Lainnya",
];

const FIELD_OPTIONS = [
  "Bangunan Gedung",
  "Jalan & Jembatan",
  "Bangunan Air & Sumber Daya Air",
  "Geoteknik & Pondasi",
  "Mekanikal Elektrikal Plumbing (MEP)",
  "Arsitektur & Desain",
  "Manajemen Proyek Konstruksi",
  "Quantity Surveying & Estimasi",
  "Manajemen Kontrak & Klaim",
  "K3 Konstruksi",
  "Pengawasan Konstruksi",
  "Lingkungan Hidup & AMDAL",
  "Survei & Pemetaan",
  "Geologi & Eksplorasi",
  "Energi & Ketenagalistrikan",
  "IT & Digital Engineering",
];

interface SkkEntry {
  jabatan: string;
  level: string;
  klasifikasi: string;
  jalurTerbaik: string;
  persentaseKesiapan: number;
  catatan: string;
}

interface Gap {
  jabatan: string;
  level: string;
  kurang: string;
  estimasiWaktu: string;
}

interface Result {
  profil: {
    pendidikan: string;
    pengalaman: number;
    bidang: string;
  };
  eligible: SkkEntry[];
  segera: Gap[];
  prioritas: { urutan: number; jabatan: string; alasan: string }[];
  totalEligible: number;
  totalSegera: number;
  ringkasan: string;
}

export default function CekKelayakanSKK() {
  const [pendidikan, setPendidikan] = useState("");
  const [pengalaman, setPengalaman] = useState(3);
  const [bidang, setBidang] = useState("");
  const [skk_existing, setSkkExisting] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function check() {
    if (!pendidikan || !bidang) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/cek-kelayakan-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendidikan, pengalaman, bidang, skk_existing }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal mengecek kelayakan.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
  }

  function copyResult() {
    if (!result) return;
    const text = [
      `CEK KELAYAKAN SKK`,
      `Pendidikan: ${result.profil.pendidikan} | Pengalaman: ${result.profil.pengalaman} thn | Bidang: ${result.profil.bidang}`,
      ``,
      `=== ELIGIBLE SEKARANG (${result.totalEligible} jabatan) ===`,
      ...result.eligible.map(e =>
        `• ${e.jabatan} — ${e.level} (${e.klasifikasi})\n  Jalur: ${e.jalurTerbaik} | Kesiapan: ${e.persentaseKesiapan}%\n  ${e.catatan}`
      ),
      ``,
      `=== BISA SEGERA (${result.totalSegera} jabatan dalam 1-2 tahun) ===`,
      ...result.segera.map(g =>
        `• ${g.jabatan} — ${g.level}\n  Kurang: ${g.kurang} | Est: ${g.estimasiWaktu}`
      ),
      ``,
      `=== PRIORITAS ===`,
      ...result.prioritas.map(p => `${p.urutan}. ${p.jabatan}\n   ${p.alasan}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
  }

  const readinessColor = (pct: number) => {
    if (pct >= 90) return "text-emerald-400";
    if (pct >= 70) return "text-blue-400";
    return "text-amber-400";
  };
  const readinessBg = (pct: number) => {
    if (pct >= 90) return "bg-emerald-400";
    if (pct >= 70) return "bg-blue-400";
    return "bg-amber-400";
  };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={reset} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white">Hasil Cek Kelayakan SKK</h1>
                <p className="text-xs text-slate-400">{result.profil.pendidikan} · {result.profil.pengalaman} thn · {result.profil.bidang}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyResult} size="sm" variant="outline" className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Salin
              </Button>
              <Button onClick={reset} size="sm" variant="outline" className="text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Ulang
              </Button>
            </div>
          </div>

          {/* Score Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Trophy className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-bold text-emerald-400">{result.totalEligible}</span>
                <span className="text-slate-400 text-sm">jabatan SKK bisa diambil sekarang</span>
                <span className="text-slate-500 text-sm">+{result.totalSegera} dalam 1-2 tahun</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{result.ringkasan}</p>
            </div>
          </div>

          {/* Eligible Now */}
          {result.eligible.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Eligible Sekarang</h2>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">{result.eligible.length} jabatan</Badge>
              </div>
              <div className="space-y-2">
                {result.eligible.map((e, i) => (
                  <div key={i} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-white text-sm font-semibold">{e.jabatan}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-400/30">{e.level}</Badge>
                          <span className="text-slate-500 text-xs">{e.klasifikasi}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-lg font-bold ${readinessColor(e.persentaseKesiapan)}`}>{e.persentaseKesiapan}%</span>
                        <p className="text-slate-500 text-[10px]">kesiapan</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full mb-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${readinessBg(e.persentaseKesiapan)}`} style={{ width: `${e.persentaseKesiapan}%` }} />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-400 text-xs">{e.catatan}</p>
                      <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30 shrink-0">{e.jalurTerbaik}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon */}
          {result.segera.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Bisa Diambil dalam 1-2 Tahun</h2>
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">{result.segera.length} jabatan</Badge>
              </div>
              <div className="space-y-2">
                {result.segera.map((g, i) => (
                  <div key={i} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{g.jabatan}</p>
                      <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-400/30 mt-0.5">{g.level}</Badge>
                      <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                        Kurang: {g.kurang}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-amber-400 text-xs font-medium">{g.estimasiWaktu}</p>
                      <p className="text-slate-500 text-[10px]">estimasi</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Roadmap */}
          {result.prioritas.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-white">Urutan Prioritas Disarankan</h2>
              </div>
              <div className="space-y-1.5">
                {result.prioritas.map((p, i) => (
                  <div key={i} className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 flex items-start gap-3">
                    <span className="text-violet-400 font-bold text-sm w-5 shrink-0">{p.urutan}.</span>
                    <div>
                      <p className="text-white text-sm font-medium">{p.jabatan}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{p.alasan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3 mt-5">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/diagnostik-kompetensi">Diagnostik Gap SKK →</Link>
            </Button>
            <Button asChild className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs">
              <Link href="/persiapan-asesmen">Persiapan Asesmen →</Link>
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
              <Target className="h-5 w-5 text-violet-400" /> Cek Kelayakan SKK
            </h1>
            <p className="text-xs text-slate-400">SKK apa saja yang bisa kamu ambil sekarang?</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-5">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Pendidikan Terakhir *</label>
            <select value={pendidikan} onChange={e => setPendidikan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 transition-colors">
              <option value="">Pilih pendidikan...</option>
              {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">
              Pengalaman Kerja Relevan: <span className="text-violet-400 font-semibold">{pengalaman} tahun</span>
            </label>
            <input type="range" min={0} max={25} step={1} value={pengalaman}
              onChange={e => setPengalaman(Number(e.target.value))}
              className="w-full accent-violet-500" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0 thn (fresh)</span><span>5 thn</span><span>10 thn</span><span>15 thn</span><span>25 thn</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Bidang Utama Pekerjaan *</label>
            <select value={bidang} onChange={e => setBidang(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 transition-colors">
              <option value="">Pilih bidang...</option>
              {FIELD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">SKK yang Sudah Dimiliki (opsional)</label>
            <input type="text" value={skk_existing} onChange={e => setSkkExisting(e.target.value)}
              placeholder="cth: Ahli Muda Teknik Bangunan Gedung, ..."
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/50 transition-colors" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={check} disabled={!pendidikan || !bidang || loading} className="w-full bg-violet-600 hover:bg-violet-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Menganalisis Kelayakan...</>
              : <><Sparkles className="h-4 w-4 mr-2" />Cek Kelayakan SKK Saya</>
            }
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">Apa yang akan dianalisis:</p>
          </div>
          <ul className="text-xs text-slate-500 space-y-0.5 ml-5">
            <li>• Jabatan SKK yang bisa diambil <span className="text-emerald-400 font-medium">sekarang</span> (sesuai PP 14/2021 & Permen PU 6/2025)</li>
            <li>• SKK yang bisa dicapai dalam <span className="text-amber-400 font-medium">1-2 tahun</span> beserta gap yang harus dipenuhi</li>
            <li>• Urutan prioritas pengambilan SKK yang paling strategis</li>
            <li>• Jalur terbaik: Reguler, RPL, atau Bimtek+Uji</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
