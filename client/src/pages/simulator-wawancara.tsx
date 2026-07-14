import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Mic, Send, RotateCcw,
  ChevronRight, User, Bot, Star, CheckCircle2, XCircle,
  AlertTriangle, BarChart2, Trophy, Lightbulb, Info, MessageSquare
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda",
  "Ahli K3 Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Muda",
  "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya",
  "Ahli Quantity Surveyor — Muda",
  "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda",
  "Ahli Teknik Geoteknik — Muda",
  "Ahli Teknik Mekanikal — Muda",
  "Ahli Teknik Elektrikal — Muda",
  "Ahli Arsitektur — Muda",
];

const FOKUS_OPTIONS = [
  "Unit kompetensi inti (semua)",
  "Aspek keselamatan kerja",
  "Aspek perencanaan & pengelolaan",
  "Aspek teknis & metode",
  "Aspek regulasi & standar",
  "Aspek dokumentasi & pelaporan",
];

type RoundStatus = "answered" | "pending";

interface Round {
  roundNum: number;
  pertanyaan: string;
  unitKompetensi: string;
  jawabanUser: string;
  feedback?: string;
  skor?: number; // 1-4
  aspekKuat?: string[];
  aspekLemah?: string[];
  status: RoundStatus;
}

interface FinalResult {
  skorTotal: number;
  predikat: "Kompeten" | "Kompeten Bersyarat" | "Belum Kompeten";
  ringkasan: string;
  kekuatan: string[];
  areaImprovement: string[];
  rekomendasiPersiapan: string[];
  hasilPerRound: { roundNum: number; unitKompetensi: string; skor: number; label: string }[];
}

const SKOR_CONFIG = {
  4: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Sangat Baik" },
  3: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", label: "Baik" },
  2: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Cukup" },
  1: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Perlu Peningkatan" },
};

const PREDIKAT_CONFIG = {
  "Kompeten": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: Trophy },
  "Kompeten Bersyarat": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle },
  "Belum Kompeten": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle },
};

const TOTAL_ROUNDS = 4;

export default function SimulatorWawancara() {
  const [jabatan, setJabatan] = useState("");
  const [fokus, setFokus] = useState("Unit kompetensi inti (semua)");
  const [pengalaman, setPengalaman] = useState("");
  const [phase, setPhase] = useState<"setup" | "session" | "result">("setup");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rounds, loading]);

  async function startSession() {
    if (!jabatan) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/simulator-wawancara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", jabatan, fokus, pengalaman }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRounds([{ roundNum: 1, pertanyaan: data.pertanyaan, unitKompetensi: data.unitKompetensi, jawabanUser: "", status: "pending" }]);
      setPhase("session");
    } catch (e: any) {
      setError(e.message || "Gagal memulai sesi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!currentAnswer.trim() || loading) return;
    const currentRound = rounds[rounds.length - 1];
    if (!currentRound || currentRound.status === "answered") return;

    setLoading(true);
    setError("");
    const answerText = currentAnswer.trim();
    setCurrentAnswer("");

    // Optimistically mark answer
    setRounds(prev => prev.map(r => r.roundNum === currentRound.roundNum ? { ...r, jawabanUser: answerText } : r));

    try {
      const isLast = currentRound.roundNum === TOTAL_ROUNDS;
      const res = await fetch("/api/tools/simulator-wawancara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLast ? "finish" : "answer",
          jabatan, fokus, pengalaman,
          rounds: rounds.map(r => ({ ...r, jawabanUser: r.roundNum === currentRound.roundNum ? answerText : r.jawabanUser })),
          currentRoundNum: currentRound.roundNum,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update current round with feedback
      setRounds(prev => prev.map(r =>
        r.roundNum === currentRound.roundNum
          ? { ...r, jawabanUser: answerText, feedback: data.feedback, skor: data.skor, aspekKuat: data.aspekKuat, aspekLemah: data.aspekLemah, status: "answered" }
          : r
      ));

      if (isLast) {
        setFinalResult(data.finalResult);
        setPhase("result");
      } else {
        // Add next round
        setRounds(prev => [...prev, {
          roundNum: data.nextRoundNum,
          pertanyaan: data.nextPertanyaan,
          unitKompetensi: data.nextUnitKompetensi,
          jawabanUser: "",
          status: "pending",
        }]);
      }
    } catch (e: any) {
      setError(e.message || "Gagal memproses jawaban. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setRounds([]);
    setCurrentAnswer("");
    setFinalResult(null);
    setError("");
    setPhase("setup");
  }

  // ===== SETUP PHASE =====
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-rose-400" /> Simulator Wawancara Asesmen
              </h1>
              <p className="text-xs text-slate-400">AI berperan sebagai asesor BNSP — latihan wawancara kompetensi SKK</p>
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 mb-5 flex items-start gap-3">
            <Info className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 leading-relaxed">
              <p className="font-semibold mb-1">Cara kerja simulator ini:</p>
              <p>AI akan mengajukan <strong>{TOTAL_ROUNDS} pertanyaan wawancara kompetensi</strong> seperti asesor BNSP sungguhan — mulai dari pengetahuan teknis, pengalaman proyek, situasi nyata, hingga regulasi. Setiap jawaban dinilai dan diberi feedback.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Jabatan SKK yang Akan Diasesmen *</label>
              <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400/50">
                <option value="">Pilih jabatan SKK...</option>
                {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-2">Fokus Area Wawancara</label>
              <div className="grid grid-cols-2 gap-1.5">
                {FOKUS_OPTIONS.map(f => (
                  <button key={f} onClick={() => setFokus(f)}
                    className={`rounded-lg border px-3 py-2 text-xs text-left transition-all ${fokus === f ? "bg-rose-500/15 border-rose-400/40 text-rose-300" : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Latar Belakang Singkat Anda <span className="text-slate-600">(opsional — membantu AI menyesuaikan pertanyaan)</span>
              </label>
              <textarea value={pengalaman} onChange={e => setPengalaman(e.target.value)} rows={3}
                placeholder="cth: 5 tahun sebagai Safety Officer di BUJK menengah, fokus proyek gedung bertingkat di Jakarta"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50 resize-none" />
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}

            <Button onClick={startSession} disabled={!jabatan || loading} className="w-full bg-rose-600 hover:bg-rose-700">
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Asesor sedang bersiap...</>
                : <><Sparkles className="h-4 w-4 mr-2" />Mulai Sesi Wawancara ({TOTAL_ROUNDS} Pertanyaan)</>
              }
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { num: "1–4", label: "Pertanyaan", sub: "per sesi" },
              { num: "4", label: "Skor max", sub: "per jawaban" },
              { num: "K/BK", label: "Predikat", sub: "akhir sesi" },
              { num: "~10", label: "Menit", sub: "estimasi" },
            ].map(({ num, label, sub }, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/2 p-3 text-center">
                <p className="text-rose-400 text-sm font-bold">{num}</p>
                <p className="text-white text-xs font-medium">{label}</p>
                <p className="text-slate-500 text-[10px]">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== RESULT PHASE =====
  if (phase === "result" && finalResult) {
    const pc = PREDIKAT_CONFIG[finalResult.predikat];
    const PIcon = pc.icon;
    const avgSkor = rounds.reduce((s, r) => s + (r.skor ?? 0), 0) / TOTAL_ROUNDS;
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={restart} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white">Hasil Wawancara Asesmen</h1>
                <p className="text-xs text-slate-400">{jabatan}</p>
              </div>
            </div>
            <Button onClick={restart} size="sm" variant="outline" className="text-xs gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Ulangi
            </Button>
          </div>

          {/* Predikat Banner */}
          <div className={`rounded-2xl border p-5 mb-4 ${pc.bg}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`rounded-xl p-3 bg-white/5`}>
                <PIcon className={`h-8 w-8 ${pc.color}`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Hasil Simulasi</p>
                <p className={`text-2xl font-bold ${pc.color}`}>{finalResult.predikat}</p>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-2 w-8 rounded-full ${s <= Math.round(avgSkor) ? (avgSkor >= 3 ? "bg-emerald-500" : avgSkor >= 2 ? "bg-amber-500" : "bg-red-500") : "bg-slate-800"}`} />
                  ))}
                  <span className="text-xs text-slate-400">{avgSkor.toFixed(1)}/4.0</span>
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{finalResult.ringkasan}</p>
          </div>

          {/* Skor per Round */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
            <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" /> Skor per Pertanyaan
            </p>
            <div className="space-y-2">
              {finalResult.hasilPerRound.map(h => {
                const sc = SKOR_CONFIG[h.skor as 1 | 2 | 3 | 4] || SKOR_CONFIG[1];
                return (
                  <div key={h.roundNum} className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs w-8">P{h.roundNum}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${h.skor >= 3 ? "bg-emerald-500" : h.skor >= 2 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${(h.skor / 4) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${sc.color} w-6 text-right`}>{h.skor}/4</span>
                    <Badge variant="outline" className={`text-[9px] ${sc.color} border-current/30 shrink-0`}>{h.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {finalResult.kekuatan.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Kekuatan
                </p>
                <ul className="space-y-1">
                  {finalResult.kekuatan.map((k, i) => <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-emerald-400 shrink-0">•</span>{k}</li>)}
                </ul>
              </div>
            )}
            {finalResult.areaImprovement.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Area Perbaikan
                </p>
                <ul className="space-y-1">
                  {finalResult.areaImprovement.map((a, i) => <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-amber-400 shrink-0">•</span>{a}</li>)}
                </ul>
              </div>
            )}
          </div>

          {finalResult.rekomendasiPersiapan.length > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
              <p className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Rekomendasi Persiapan Lebih Lanjut
              </p>
              <ul className="space-y-1.5">
                {finalResult.rekomendasiPersiapan.map((r, i) => (
                  <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={restart} variant="outline" className="flex-1 text-xs gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Ulangi Sesi
            </Button>
            <Button asChild className="flex-1 bg-rose-600 hover:bg-rose-700 text-xs">
              <Link href="/mock-asesmen">Lanjut Mock Asesmen Tertulis →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== SESSION PHASE =====
  const currentRound = rounds[rounds.length - 1];
  const answeredRounds = rounds.filter(r => r.status === "answered");
  const isWaitingAnswer = currentRound?.status === "pending";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/90 backdrop-blur sticky top-0 z-10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={restart} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-white">{jabatan}</p>
              <p className="text-xs text-slate-500">Wawancara Asesmen · {fokus}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const r = rounds[i];
              const isCurrent = i === rounds.length - 1 && isWaitingAnswer;
              const isDone = r?.status === "answered";
              return (
                <div key={i} className={`h-2 w-8 rounded-full transition-all ${isDone ? (r.skor! >= 3 ? "bg-emerald-500" : r.skor! >= 2 ? "bg-amber-500" : "bg-red-400") : isCurrent ? "bg-rose-400 animate-pulse" : "bg-slate-800"}`} />
              );
            })}
            <span className="text-xs text-slate-400 ml-1">{answeredRounds.length}/{TOTAL_ROUNDS}</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Opening message */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-rose-500/20 p-2 shrink-0">
              <Bot className="h-4 w-4 text-rose-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/8 p-4 max-w-lg">
              <p className="text-xs text-rose-400 font-semibold mb-1">Asesor BNSP</p>
              <p className="text-slate-200 text-sm leading-relaxed">
                Selamat datang di sesi wawancara asesmen kompetensi untuk jabatan <strong className="text-white">{jabatan}</strong>. Saya akan mengajukan {TOTAL_ROUNDS} pertanyaan untuk menilai kompetensi Anda. Jawablah dengan spesifik — sebutkan pengalaman nyata, metode yang Anda gunakan, dan hasil yang dicapai. Siap?
              </p>
            </div>
          </div>

          {rounds.map((round) => (
            <div key={round.roundNum}>
              {/* Pertanyaan */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-rose-500/20 p-2 shrink-0">
                  <Bot className="h-4 w-4 text-rose-400" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/8 p-4 max-w-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-rose-400 font-semibold">Pertanyaan {round.roundNum}</p>
                    <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{round.unitKompetensi}</Badge>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">{round.pertanyaan}</p>
                </div>
              </div>

              {/* Jawaban User */}
              {round.jawabanUser && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-rose-600/20 border border-rose-500/20 p-4 max-w-lg">
                    <p className="text-xs text-rose-300 font-semibold mb-1 text-right">Jawaban Anda</p>
                    <p className="text-slate-200 text-sm leading-relaxed">{round.jawabanUser}</p>
                  </div>
                  <div className="rounded-full bg-slate-700 p-2 shrink-0">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              )}

              {/* Feedback */}
              {round.feedback && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-rose-500/20 p-2 shrink-0">
                    <Bot className="h-4 w-4 text-rose-400" />
                  </div>
                  <div className={`rounded-2xl rounded-tl-sm border p-4 max-w-lg ${SKOR_CONFIG[round.skor as 1 | 2 | 3 | 4]?.bg || "bg-slate-800/50 border-white/8"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-slate-400 font-semibold">Feedback Asesor</p>
                      {round.skor && (
                        <Badge variant="outline" className={`text-[9px] ${SKOR_CONFIG[round.skor as 1 | 2 | 3 | 4]?.color} border-current/30`}>
                          {round.skor}/4 — {SKOR_CONFIG[round.skor as 1 | 2 | 3 | 4]?.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed mb-2">{round.feedback}</p>
                    {round.aspekKuat && round.aspekKuat.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {round.aspekKuat.map((a, i) => <Badge key={i} variant="outline" className="text-[9px] text-emerald-400 border-emerald-400/30">✓ {a}</Badge>)}
                        {(round.aspekLemah ?? []).map((a, i) => <Badge key={i} variant="outline" className="text-[9px] text-amber-400 border-amber-400/30">⚠ {a}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-500/20 p-2 shrink-0">
                <Bot className="h-4 w-4 text-rose-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/8 p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                  <span className="text-sm text-slate-400">Asesor mengevaluasi jawaban...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      {isWaitingAnswer && !loading && (
        <div className="border-t border-white/10 bg-slate-950/90 backdrop-blur px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-400 text-xs mb-2">{error}</div>}
            <div className="flex gap-2 items-end">
              <textarea
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
                rows={3}
                placeholder="Jawab dengan detail — sebutkan pengalaman nyata, metode, dan hasil konkret... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50 resize-none"
              />
              <Button onClick={submitAnswer} disabled={!currentAnswer.trim()} className="bg-rose-600 hover:bg-rose-700 shrink-0 h-[72px] px-4">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-2">
              Pertanyaan {currentRound?.roundNum}/{TOTAL_ROUNDS} · Shift+Enter = baris baru
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
