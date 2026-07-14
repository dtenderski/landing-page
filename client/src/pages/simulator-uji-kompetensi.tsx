import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, XCircle,
  ChevronRight, Trophy, RotateCcw, Brain, Target,
  AlertTriangle, Clock, BookOpen
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya", "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Arsitektur — Muda",
  "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

const JUMLAH_OPTIONS = [5, 10, 15];

interface Soal {
  nomor: number;
  tipe: "pilihan_ganda" | "esai";
  pertanyaan: string;
  unitKompetensi: string;
  opsi?: string[];
  kunciJawaban?: string;
  modelJawaban?: string;
  bobot: number;
}

interface Jawaban { nomor: number; jawaban: string; }
interface HasilEvaluasi {
  nilaiTotal: number;
  nilaiMaksimum: number;
  persentase: number;
  predikat: "Kompeten" | "Belum Kompeten" | "Perlu Pengembangan";
  evaluasiPerSoal: {
    nomor: number;
    status: "Benar" | "Salah" | "Sebagian" | "Perlu Review";
    skorDapat: number;
    skorMaks: number;
    feedback: string;
    pembahasanSingkat: string;
  }[];
  rekomendasiBelajar: string[];
  unitLemah: string[];
  kesimpulan: string;
}

const PREDIKAT_CONFIG = {
  "Kompeten": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: Trophy },
  "Perlu Pengembangan": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle },
  "Belum Kompeten": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle },
};

export default function SimulatorUjiKompetensi() {
  const [phase, setPhase] = useState<"setup" | "soal" | "loading-soal" | "mengerjakan" | "evaluating" | "hasil">("setup");
  const [jabatan, setJabatan] = useState("");
  const [jumlahSoal, setJumlahSoal] = useState(10);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [jawaban, setJawaban] = useState<Jawaban[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hasil, setHasil] = useState<HasilEvaluasi | null>(null);
  const [error, setError] = useState("");
  const [waktuMulai, setWaktuMulai] = useState<Date | null>(null);

  async function mulaiUji() {
    if (!jabatan) return;
    setPhase("loading-soal"); setError("");
    try {
      const res = await fetch("/api/tools/simulator-uji-kompetensi/soal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, jumlahSoal }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSoalList(data.soalList);
      setJawaban(data.soalList.map((s: Soal) => ({ nomor: s.nomor, jawaban: "" })));
      setCurrentIdx(0);
      setWaktuMulai(new Date());
      setPhase("mengerjakan");
    } catch (e: any) { setError(e.message || "Gagal memuat soal."); setPhase("setup"); }
  }

  async function selesaikan() {
    setPhase("evaluating"); setError("");
    try {
      const res = await fetch("/api/tools/simulator-uji-kompetensi/evaluasi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, soalList, jawaban }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHasil(data);
      setPhase("hasil");
    } catch (e: any) { setError(e.message || "Gagal mengevaluasi."); setPhase("mengerjakan"); }
  }

  function setJawabanSoal(nomor: number, val: string) {
    setJawaban(prev => prev.map(j => j.nomor === nomor ? { ...j, jawaban: val } : j));
  }

  const currentSoal = soalList[currentIdx];
  const currentJawaban = jawaban.find(j => j.nomor === currentSoal?.nomor)?.jawaban ?? "";
  const terjawab = jawaban.filter(j => j.jawaban.trim()).length;
  const waktuBerlalu = waktuMulai ? Math.floor((Date.now() - waktuMulai.getTime()) / 60000) : 0;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" /> Simulator Uji Kompetensi SKK
            </h1>
            <p className="text-xs text-slate-400">Latihan soal berbasis unit kompetensi jabatan SKK dengan evaluasi AI</p>
          </div>
        </div>

        {/* Setup */}
        {(phase === "setup" || phase === "loading-soal") && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-violet-300 text-xs font-semibold mb-1 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Cara kerja simulator</p>
              <p className="text-slate-400 text-xs">AI membuat soal pilihan ganda + esai sesuai unit kompetensi jabatan SKK. Kerjakan → AI evaluasi jawaban + beri feedback detail + rekomendasi materi yang perlu diperkuat.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK *</label>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50">
                  <option value="">Pilih jabatan SKK yang ingin diuji...</option>
                  {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jumlah Soal</label>
                <div className="grid grid-cols-3 gap-2">
                  {JUMLAH_OPTIONS.map(n => (
                    <button key={n} onClick={() => setJumlahSoal(n)}
                      className={`rounded-lg border py-2.5 text-sm transition-all ${jumlahSoal === n ? "bg-violet-500/15 border-violet-400/40 text-violet-300 font-semibold" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {n} soal
                      <p className="text-[10px] text-slate-500 font-normal">{n === 5 ? "~10 menit" : n === 10 ? "~20 menit" : "~30 menit"}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={mulaiUji} disabled={!jabatan || phase === "loading-soal"} className="w-full bg-violet-600 hover:bg-violet-700">
              {phase === "loading-soal" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyiapkan soal...</> : <><Brain className="h-4 w-4 mr-2" />Mulai Uji Kompetensi</>}
            </Button>
          </div>
        )}

        {/* Mengerjakan Soal */}
        {phase === "mengerjakan" && currentSoal && (
          <>
            {/* Progress Bar */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{jabatan}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />{waktuBerlalu} menit</span>
                  <span className="text-xs text-violet-400 font-medium">{terjawab}/{soalList.length} dijawab</span>
                </div>
              </div>
              <div className="flex gap-1">
                {soalList.map((s, i) => {
                  const jawabanItem = jawaban.find(j => j.nomor === s.nomor);
                  const isDone = !!jawabanItem?.jawaban.trim();
                  const isCurrent = i === currentIdx;
                  return <div key={i} onClick={() => setCurrentIdx(i)} className={`flex-1 h-1.5 rounded-full cursor-pointer transition-all ${isCurrent ? "bg-violet-400" : isDone ? "bg-violet-700" : "bg-slate-800"}`} />;
                })}
              </div>
            </div>

            {/* Soal Card */}
            <div className="rounded-2xl border border-white/10 bg-white/2 p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs text-violet-400 border-violet-400/40">Soal {currentSoal.nomor}/{soalList.length}</Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{currentSoal.tipe === "pilihan_ganda" ? "Pilihan Ganda" : "Esai"}</Badge>
                <Badge variant="outline" className="text-xs text-slate-500 border-slate-700 ml-auto">{currentSoal.bobot} poin</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-1">{currentSoal.unitKompetensi}</p>
              <p className="text-sm text-slate-200 leading-relaxed mb-4">{currentSoal.pertanyaan}</p>

              {currentSoal.tipe === "pilihan_ganda" && currentSoal.opsi && (
                <div className="space-y-2">
                  {currentSoal.opsi.map((opsi, i) => {
                    const label = String.fromCharCode(65 + i);
                    const isSelected = currentJawaban === label;
                    return (
                      <button key={i} onClick={() => setJawabanSoal(currentSoal.nomor, label)}
                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all flex items-center gap-3 ${isSelected ? "bg-violet-500/15 border-violet-400/50 text-white" : "border-white/8 bg-white/2 text-slate-300 hover:border-white/20 hover:text-white"}`}>
                        <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${isSelected ? "bg-violet-500 border-violet-500 text-white" : "border-slate-600 text-slate-400"}`}>{label}</span>
                        {opsi}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentSoal.tipe === "esai" && (
                <textarea value={currentJawaban} onChange={e => setJawabanSoal(currentSoal.nomor, e.target.value)}
                  rows={5} placeholder="Tulis jawaban Anda di sini..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-400/40 resize-none" />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} variant="outline" className="flex-1 text-sm">← Sebelumnya</Button>
              {currentIdx < soalList.length - 1 ? (
                <Button onClick={() => setCurrentIdx(i => i + 1)} className="flex-1 bg-violet-600 hover:bg-violet-700 text-sm">Berikutnya →</Button>
              ) : (
                <Button onClick={selesaikan} disabled={terjawab < soalList.length} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm">
                  Selesai & Evaluasi
                </Button>
              )}
            </div>
            {terjawab < soalList.length && currentIdx === soalList.length - 1 && (
              <p className="text-xs text-amber-400 text-center mt-2">{soalList.length - terjawab} soal belum dijawab</p>
            )}
          </>
        )}

        {/* Evaluating */}
        {phase === "evaluating" && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-white font-medium">Mengevaluasi jawaban...</p>
            <p className="text-slate-400 text-sm mt-1">AI sedang memeriksa dan memberikan feedback detail</p>
          </div>
        )}

        {/* Hasil */}
        {phase === "hasil" && hasil && (() => {
          const pc = PREDIKAT_CONFIG[hasil.predikat];
          const Icon = pc.icon;
          return (
            <>
              <div className={`rounded-2xl border p-5 mb-4 ${pc.bg}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-8 w-8 ${pc.color} shrink-0`} />
                  <div>
                    <p className={`text-2xl font-bold ${pc.color}`}>{hasil.nilaiTotal}/{hasil.nilaiMaksimum}</p>
                    <p className={`text-sm font-semibold ${pc.color}`}>{hasil.predikat} — {hasil.persentase}%</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm">{hasil.kesimpulan}</p>
              </div>

              {/* Per Soal */}
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-3">
                <p className="text-xs text-slate-400 font-semibold mb-3">Evaluasi per Soal</p>
                <div className="space-y-2">
                  {hasil.evaluasiPerSoal?.map((e, i) => {
                    const sc = { "Benar": "text-emerald-400", "Sebagian": "text-blue-400", "Perlu Review": "text-amber-400", "Salah": "text-red-400" }[e.status];
                    const icons = { "Benar": <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, "Sebagian": <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />, "Perlu Review": <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, "Salah": <XCircle className="h-3.5 w-3.5 text-red-400" /> }[e.status];
                    return (
                      <div key={i} className="rounded-lg bg-slate-900/40 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {icons}
                          <span className={`text-xs font-medium ${sc}`}>Soal {e.nomor} — {e.status}</span>
                          <span className="text-xs text-slate-500 ml-auto">{e.skorDapat}/{e.skorMaks} poin</span>
                        </div>
                        <p className="text-xs text-slate-400">{e.feedback}</p>
                        {e.pembahasanSingkat && <p className="text-xs text-slate-500 mt-1 italic">{e.pembahasanSingkat}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasil.unitLemah?.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-3">
                  <p className="text-amber-400 text-xs font-semibold mb-2">Unit Kompetensi yang Perlu Diperkuat</p>
                  <ul className="space-y-1">{hasil.unitLemah.map((u, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{u}</li>)}</ul>
                </div>
              )}
              {hasil.rekomendasiBelajar?.length > 0 && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
                  <p className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Rekomendasi Belajar</p>
                  <ul className="space-y-1">{hasil.rekomendasiBelajar.map((r, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{r}</li>)}</ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => { setPhase("setup"); setHasil(null); setSoalList([]); setJawaban([]); }} variant="outline" className="flex-1 text-xs">Uji Lagi</Button>
                <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
                  <Link href="/materi-belajar-skk">Materi Belajar →</Link>
                </Button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
