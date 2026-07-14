import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight, BookOpen, Target } from "lucide-react";
import { Link } from "wouter";

const SKK_DOMAINS = [
  { label: "Teknik Bangunan Gedung — Ahli Muda", code: "602", level: "Muda" },
  { label: "Manajemen Pelaksanaan — Ahli Madya", code: "501", level: "Madya" },
  { label: "K3 Konstruksi — Ahli Muda", code: "601", level: "Muda" },
  { label: "Manajemen Proyek — Ahli Muda", code: "503", level: "Muda" },
  { label: "Quantity Surveyor — Ahli Muda", code: "604", level: "Muda" },
  { label: "Pengawas Konstruksi — Ahli Muda", code: "611", level: "Muda" },
  { label: "Jalan & Jembatan — Ahli Madya", code: "202", level: "Madya" },
  { label: "Geoteknik — Ahli Muda", code: "203", level: "Muda" },
  { label: "Mekanikal Elektrikal — Ahli Muda", code: "401", level: "Muda" },
  { label: "Manajemen Kontrak — Ahli Muda", code: "512", level: "Muda" },
];

interface Question {
  no: number;
  type: "pengetahuan" | "skenario";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reference: string;
}

interface AssessmentResult {
  questions: Question[];
  domain: string;
  totalQuestions: number;
}

interface AnswerState {
  [questionNo: number]: number | null;
}

type Phase = "select" | "loading" | "test" | "result";

export default function MockAsesmen() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function startAssessment() {
    if (!selectedDomain) return;
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/tools/mock-asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAssessment(data);
      setAnswers({});
      setCurrentQ(0);
      setSubmitted(false);
      setPhase("test");
    } catch (e: any) {
      setError(e.message || "Gagal memuat soal.");
      setPhase("select");
    }
  }

  function selectAnswer(qNo: number, idx: number) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qNo]: idx }));
  }

  function submit() {
    if (!assessment) return;
    const allAnswered = assessment.questions.every(q => answers[q.no] !== undefined && answers[q.no] !== null);
    if (!allAnswered) return;
    setSubmitted(true);
    setPhase("result");
  }

  function reset() {
    setPhase("select");
    setAssessment(null);
    setAnswers({});
    setCurrentQ(0);
    setSubmitted(false);
    setError("");
  }

  if (phase === "select") {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-400" /> Mock Asesmen SKK
              </h1>
              <p className="text-xs text-slate-400">Simulasi ujian kompetensi berbasis AI · 5 soal per sesi</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-5 mb-4">
            <h2 className="font-semibold text-white text-sm mb-3">Pilih Domain SKK untuk Diuji</h2>
            <div className="space-y-2">
              {SKK_DOMAINS.map(d => (
                <button key={d.code} onClick={() => setSelectedDomain(d.label)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${selectedDomain === d.label ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-300 hover:border-white/20 hover:text-white"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${d.level === "Muda" ? "text-blue-400 border-blue-400/30" : d.level === "Madya" ? "text-amber-400 border-amber-400/30" : "text-red-400 border-red-400/30"}`}>
                        {d.level}
                      </Badge>
                      <span className="text-slate-500 text-xs font-mono">SKK-{d.code}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm mb-4">{error}</div>
          )}

          <Button onClick={startAssessment} disabled={!selectedDomain} className="w-full bg-violet-600 hover:bg-violet-700">
            <Sparkles className="h-4 w-4 mr-2" /> Mulai Asesmen
          </Button>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-3">
            <p className="text-slate-500 text-xs leading-relaxed flex gap-2">
              <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Soal dihasilkan oleh AI berdasarkan SKKNI dan standar BNSP. Terdiri dari 3 soal pengetahuan + 2 soal skenario lapangan. Bukan soal resmi BNSP.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
          <p className="text-sm">AI sedang menyiapkan soal...</p>
          <p className="text-xs text-slate-500">{selectedDomain}</p>
        </div>
      </div>
    );
  }

  if (phase === "test" && assessment) {
    const q = assessment.questions[currentQ];
    const answered = answers[q.no] !== undefined && answers[q.no] !== null;
    const totalAnswered = Object.values(answers).filter(a => a !== null).length;

    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={reset} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-xs text-slate-400">{assessment.domain}</p>
              <p className="text-xs text-slate-500">{totalAnswered}/{assessment.totalQuestions} dijawab</p>
            </div>
            <Badge variant="outline" className={`${q.type === "skenario" ? "text-amber-400 border-amber-400/30" : "text-blue-400 border-blue-400/30"}`}>
              {q.type}
            </Badge>
          </div>

          <div className="flex gap-1 mb-5">
            {assessment.questions.map((aq, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`flex-1 h-1.5 rounded-full transition-all ${i === currentQ ? "bg-violet-400" : answers[aq.no] !== undefined ? "bg-emerald-500/60" : "bg-white/10"}`} />
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
                <span className="text-violet-300 text-xs font-bold">{q.no}</span>
              </div>
              <p className="text-white text-sm leading-relaxed">{q.question}</p>
            </div>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => selectAnswer(q.no, i)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${answers[q.no] === i ? "bg-violet-500/20 border-violet-400/50 text-violet-200" : "border-white/10 text-slate-300 hover:border-white/20 hover:text-white"}`}>
                  <span className="font-mono text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} variant="outline" disabled={currentQ === 0} className="flex-1">← Sebelumnya</Button>
            {currentQ < assessment.questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!answered} className="flex-1 bg-violet-600 hover:bg-violet-700">
                Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={totalAnswered < assessment.totalQuestions} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Trophy className="h-4 w-4 mr-2" /> Selesai & Nilai
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && assessment) {
    const correct = assessment.questions.filter(q => answers[q.no] === q.correctIndex).length;
    const score = Math.round((correct / assessment.totalQuestions) * 100);
    const passed = score >= 70;

    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={reset} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-bold text-white">Hasil Asesmen</h1>
          </div>

          <div className={`rounded-2xl border p-5 mb-5 text-center ${passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            {passed ? <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-3" /> : <RotateCcw className="h-12 w-12 text-red-400 mx-auto mb-3" />}
            <p className={`text-4xl font-bold mb-1 ${passed ? "text-emerald-400" : "text-red-400"}`}>{score}%</p>
            <p className={`text-sm font-medium mb-1 ${passed ? "text-emerald-300" : "text-red-300"}`}>
              {passed ? "LULUS — Kesiapan Baik" : "BELUM LULUS — Perlu Persiapan"}
            </p>
            <p className="text-slate-400 text-xs">{correct}/{assessment.totalQuestions} jawaban benar · {assessment.domain}</p>
          </div>

          <div className="space-y-3 mb-5">
            {assessment.questions.map((q, i) => {
              const userAns = answers[q.no];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div key={i} className={`rounded-xl border p-4 ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className="flex items-start gap-2 mb-3">
                    {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                    <p className="text-white text-sm">{q.question}</p>
                  </div>
                  {!isCorrect && (
                    <div className="ml-6 mb-2 space-y-1">
                      <p className="text-red-400 text-xs">✗ Jawaban Anda: {q.options[userAns!]}</p>
                      <p className="text-emerald-400 text-xs">✓ Jawaban Benar: {q.options[q.correctIndex]}</p>
                    </div>
                  )}
                  <div className="ml-6 rounded-lg bg-white/5 border border-white/10 p-2 mt-2">
                    <p className="text-slate-300 text-xs">{q.explanation}</p>
                    {q.reference && <p className="text-slate-500 text-xs mt-1">Referensi: {q.reference}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button onClick={startAssessment} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" /> Ulangi
            </Button>
            <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700">
              <Link href="/diagnostik-kompetensi">Cek Gap Kompetensi →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
