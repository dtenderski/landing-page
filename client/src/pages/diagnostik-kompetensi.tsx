import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, ChevronRight, Loader2, Sparkles, BookOpen, Target, TrendingUp, AlertTriangle, CheckCircle2, GraduationCap, Briefcase } from "lucide-react";
import { Link } from "wouter";

const SKK_DOMAINS = [
  "Manajemen Pelaksanaan Konstruksi",
  "Teknik Bangunan Gedung",
  "Teknik Bangunan Sipil",
  "Instalasi Mekanikal Elektrikal",
  "Manajemen Proyek Konstruksi",
  "K3 Konstruksi",
  "Quantity Surveyor / Estimasi Biaya",
  "Manajemen Kontrak & Klaim",
  "Pengawas Konstruksi",
  "Arsitektur",
  "Teknik Sipil (Geoteknik)",
  "Teknik Sipil (Jalan & Jembatan)",
  "Tata Lingkungan",
  "Klasifikasi Elektrikal",
  "MEP (Mechanical Electrical Plumbing)",
  "Konsultan BIM",
  "Ketenagalistrikan",
  "Energi Terbarukan (EBT)",
  "Lainnya",
];

const EDUCATION_LEVELS = [
  "SMA/SMK",
  "D3 (Diploma 3)",
  "D4 / Sarjana Terapan",
  "S1 (Sarjana)",
  "S2 (Magister)",
  "S3 (Doktor)",
];

interface Step {
  id: number;
  label: string;
}

const STEPS: Step[] = [
  { id: 1, label: "Pendidikan" },
  { id: 2, label: "Pengalaman" },
  { id: 3, label: "Target" },
];

interface FormData {
  education: string;
  fieldOfStudy: string;
  yearsExperience: string;
  currentRole: string;
  keyProjects: string;
  targetDomain: string;
  targetLevel: string;
}

interface DiagResult {
  currentKKNI: string;
  eligibleLevel: string;
  gapSummary: string;
  gaps: { item: string; severity: "tinggi" | "sedang" | "rendah" }[];
  strengths: string[];
  learningPath: { step: number; action: string; resource: string }[];
  recommendation: string;
  readinessScore: number;
}

export default function DiagnostikKompetensi() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagResult | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    education: "",
    fieldOfStudy: "",
    yearsExperience: "",
    currentRole: "",
    keyProjects: "",
    targetDomain: "",
    targetLevel: "",
  });

  function setField(key: keyof FormData, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/diagnostik-kompetensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal menganalisis profil.");
    } finally {
      setLoading(false);
    }
  }

  const canNext1 = form.education && form.fieldOfStudy;
  const canNext2 = form.yearsExperience && form.currentRole;
  const canSubmit = form.targetDomain && form.targetLevel;

  const severityColor = { tinggi: "text-red-400 bg-red-500/10 border-red-500/20", sedang: "text-amber-400 bg-amber-500/10 border-amber-500/20", rendah: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };

  if (result) {
    const scoreColor = result.readinessScore >= 70 ? "text-emerald-400" : result.readinessScore >= 40 ? "text-amber-400" : "text-red-400";
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setResult(null)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Hasil Diagnostik Kompetensi</h1>
              <p className="text-xs text-slate-400">{form.targetDomain} · {form.targetLevel}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white">Skor Kesiapan</h2>
              <span className={`text-2xl font-bold ${scoreColor}`}>{result.readinessScore}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-3">
              <div className={`h-2 rounded-full transition-all ${result.readinessScore >= 70 ? "bg-emerald-400" : result.readinessScore >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${result.readinessScore}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Estimasi Level Saat Ini</p>
                <p className="text-white font-medium">{result.currentKKNI}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Target yang Direkomendasikan</p>
                <p className="text-white font-medium">{result.eligibleLevel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-4">
            <p className="text-slate-300 text-sm leading-relaxed">{result.gapSummary}</p>
          </div>

          {result.strengths.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
              <h3 className="text-emerald-400 font-semibold text-sm flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4" /> Kekuatan yang Sudah Dimiliki
              </h3>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.gaps.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> Gap yang Perlu Dipenuhi
              </h3>
              <div className="space-y-2">
                {result.gaps.map((g, i) => (
                  <div key={i} className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-between ${severityColor[g.severity]}`}>
                    <span>{g.item}</span>
                    <Badge variant="outline" className={`text-xs ${severityColor[g.severity]}`}>{g.severity}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
            <h3 className="text-blue-400 font-semibold text-sm flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" /> Jalur Pembelajaran yang Disarankan
            </h3>
            <div className="space-y-3">
              {result.learningPath.map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-300 text-xs font-bold">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.action}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.resource}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-6">
            <p className="text-violet-300 text-sm leading-relaxed">{result.recommendation}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setResult(null)} variant="outline" className="flex-1">
              Ulang Diagnostik
            </Button>
            <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Link href="/mock-asesmen">Mulai Mock Asesmen →</Link>
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
              <Brain className="h-5 w-5 text-blue-400" /> Diagnostik Kompetensi SKK
            </h1>
            <p className="text-xs text-slate-400">Analisis AI gap kompetensi & jalur pembelajaran</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${step === s.id ? "opacity-100" : step > s.id ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step > s.id ? "bg-emerald-500 border-emerald-400 text-white" : step === s.id ? "bg-blue-500 border-blue-400 text-white" : "border-slate-600 text-slate-400"}`}>
                  {step > s.id ? "✓" : s.id}
                </div>
                <span className={`text-xs ${step === s.id ? "text-white" : "text-slate-400"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > s.id ? "bg-emerald-500/50" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold text-white">Latar Belakang Pendidikan</h2>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenjang Pendidikan Terakhir *</label>
                <div className="grid grid-cols-3 gap-2">
                  {EDUCATION_LEVELS.map(lvl => (
                    <button key={lvl} onClick={() => setField("education", lvl)}
                      className={`rounded-lg border px-2 py-2 text-xs transition-all ${form.education === lvl ? "bg-blue-500/20 border-blue-400 text-blue-300" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Bidang Studi / Jurusan *</label>
                <input value={form.fieldOfStudy} onChange={e => setField("fieldOfStudy", e.target.value)}
                  placeholder="Teknik Sipil, Arsitektur, Manajemen Konstruksi, dll."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors" />
              </div>
              <Button onClick={() => setStep(2)} disabled={!canNext1} className="w-full bg-blue-600 hover:bg-blue-700">
                Lanjut <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold text-white">Pengalaman Kerja</h2>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Total Pengalaman di Bidang Konstruksi *</label>
                <div className="grid grid-cols-4 gap-2">
                  {["< 1 tahun", "1-3 tahun", "3-7 tahun", "7-10 tahun", "10-15 tahun", "> 15 tahun"].map(y => (
                    <button key={y} onClick={() => setField("yearsExperience", y)}
                      className={`rounded-lg border px-2 py-2 text-xs transition-all ${form.yearsExperience === y ? "bg-blue-500/20 border-blue-400 text-blue-300" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan / Peran Saat Ini *</label>
                <input value={form.currentRole} onChange={e => setField("currentRole", e.target.value)}
                  placeholder="Site Engineer, Project Manager, Estimator, dll."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Proyek/Pekerjaan Utama <span className="text-slate-500">(opsional)</span></label>
                <textarea value={form.keyProjects} onChange={e => setField("keyProjects", e.target.value)}
                  rows={3} placeholder="Contoh: Proyek jalan tol 12km, gedung kantor 10 lantai, SPAM IKK, dll."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors resize-none" />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">← Kembali</Button>
                <Button onClick={() => setStep(3)} disabled={!canNext2} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Lanjut <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold text-white">Target Kompetensi</h2>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Domain SKK yang Dituju *</label>
                <select value={form.targetDomain} onChange={e => setField("targetDomain", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors">
                  <option value="">Pilih domain...</option>
                  {SKK_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Target Jenjang *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Muda (KKNI VI)", "Madya (KKNI VII)", "Utama (KKNI VIII)", "SKT Tingkat 1", "SKT Tingkat 2", "SKT Tingkat 3"].map(lvl => (
                    <button key={lvl} onClick={() => setField("targetLevel", lvl)}
                      className={`rounded-lg border px-2 py-2 text-xs transition-all ${form.targetLevel === lvl ? "bg-blue-500/20 border-blue-400 text-blue-300" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
              )}
              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">← Kembali</Button>
                <Button onClick={analyze} disabled={!canSubmit || loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menganalisis...</> : <><Sparkles className="h-4 w-4 mr-2" />Analisis Kompetensi</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-slate-500 text-xs leading-relaxed">
              Diagnostik ini menggunakan AI berdasarkan SKKNI, KKNI, dan regulasi BNSP. Hasil bersifat indikatif — bukan pengganti konsultasi asesor resmi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
