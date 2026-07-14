import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Users2, Send, RotateCcw,
  Bot, User, CheckCircle2, XCircle, AlertTriangle, Trophy,
  BarChart2, Lightbulb, ChevronRight, Info
} from "lucide-react";
import { Link } from "wouter";

const JABATAN_OPTIONS = [
  "Pelaksana Lapangan (Mandor Sipil)",
  "Pelaksana K3 / Safety Officer Lapangan",
  "Foreman Bekisting & Perancah",
  "Foreman Pembesian & Beton",
  "Foreman Finishing & Arsitektur",
  "Foreman MEP (Mekanikal-Elektrikal)",
  "Foreman Pondasi & Tanah",
  "Pelaksana Jalan & Perkerasan",
  "Pelaksana Jembatan",
  "Operator Alat Berat",
];

const TOPIK_OPTIONS = [
  "Seluruh kompetensi lapangan",
  "K3 dan keselamatan kerja harian",
  "Metode kerja & prosedur teknis",
  "Pengelolaan mandor & tenaga kerja",
  "Pembacaan gambar & shop drawing",
  "QC lapangan & pengujian material",
  "Administrasi harian & laporan",
];

const TOTAL_ROUNDS = 5;

type RoundStatus = "pending" | "answered";
interface Round {
  num: number; pertanyaan: string; topik: string;
  jawaban: string; feedback?: string; skor?: number;
  poin?: string[]; koreksi?: string; status: RoundStatus;
}
interface FinalResult {
  skorTotal: number; predikat: string;
  ringkasan: string; kekuatan: string[];
  perbaikan: string[]; rekomendasi: string[];
  hasilPerRound: { num: number; topik: string; skor: number; label: string }[];
}

const SKOR_CONFIG: Record<number, { color: string; label: string }> = {
  4: { color: "text-emerald-400", label: "Sangat Kompeten" },
  3: { color: "text-blue-400", label: "Kompeten" },
  2: { color: "text-amber-400", label: "Perlu Bimbingan" },
  1: { color: "text-red-400", label: "Perlu Pelatihan" },
};

export default function SimulatorForemanK3() {
  const [jabatan, setJabatan] = useState("");
  const [topik, setTopik] = useState("Seluruh kompetensi lapangan");
  const [pengalaman, setPengalaman] = useState("");
  const [phase, setPhase] = useState<"setup" | "session" | "result">("setup");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [rounds, loading]);

  async function startSession() {
    if (!jabatan) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/simulator-foreman-k3", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", jabatan, topik, pengalaman }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRounds([{ num: 1, pertanyaan: data.pertanyaan, topik: data.topik, jawaban: "", status: "pending" }]);
      setPhase("session");
    } catch (e: any) { setError(e.message || "Gagal memulai sesi."); }
    finally { setLoading(false); }
  }

  async function submitAnswer() {
    if (!currentAnswer.trim() || loading) return;
    const cur = rounds[rounds.length - 1];
    if (!cur || cur.status === "answered") return;
    setLoading(true); setError("");
    const ans = currentAnswer.trim(); setCurrentAnswer("");
    setRounds(prev => prev.map(r => r.num === cur.num ? { ...r, jawaban: ans } : r));
    try {
      const isLast = cur.num === TOTAL_ROUNDS;
      const res = await fetch("/api/tools/simulator-foreman-k3", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLast ? "finish" : "answer",
          jabatan, topik, pengalaman,
          rounds: rounds.map(r => ({ ...r, jawaban: r.num === cur.num ? ans : r.jawaban })),
          currentRoundNum: cur.num,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRounds(prev => prev.map(r =>
        r.num === cur.num ? { ...r, jawaban: ans, feedback: data.feedback, skor: data.skor, poin: data.poin, koreksi: data.koreksi, status: "answered" } : r
      ));
      if (isLast) { setFinalResult(data.finalResult); setPhase("result"); }
      else { setRounds(prev => [...prev, { num: data.nextNum, pertanyaan: data.nextPertanyaan, topik: data.nextTopik, jawaban: "", status: "pending" }]); }
    } catch (e: any) { setError(e.message || "Gagal proses jawaban."); }
    finally { setLoading(false); }
  }

  function restart() { setRounds([]); setCurrentAnswer(""); setFinalResult(null); setError(""); setPhase("setup"); }

  // SETUP
  if (phase === "setup") return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2"><Users2 className="h-5 w-5 text-violet-400" /> Simulator Uji Pelaksana Lapangan K3</h1>
            <p className="text-xs text-slate-400">AI menguji foreman/pelaksana lapangan — kompetensi K3, metode kerja, administrasi proyek</p>
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <Badge variant="outline" className="text-violet-400 border-violet-400/30">Gelombang 19</Badge>
          <Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-5 flex items-start gap-3">
          <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-violet-300 leading-relaxed">AI akan menguji dengan <strong>{TOTAL_ROUNDS} pertanyaan praktikal</strong> — situasi lapangan nyata, prosedur K3, metode kerja teknis, pengelolaan tenaga kerja. Setiap jawaban dinilai 1–4 dan diberi umpan balik koreksi.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Jabatan / Posisi yang Diuji *</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Pilih jabatan...</option>
              {JABATAN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Fokus Topik Uji</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TOPIK_OPTIONS.map(t => (
                <button key={t} onClick={() => setTopik(t)}
                  className={`rounded-lg border px-3 py-2 text-xs text-left transition-all ${topik === t ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Pengalaman Kerja <span className="text-slate-600">(opsional)</span></label>
            <textarea value={pengalaman} onChange={e => setPengalaman(e.target.value)} rows={2}
              placeholder="cth: 8 tahun sebagai mandor sipil proyek gedung bertingkat, pernah menangani bekisting table form & slip form"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none" />
          </div>
          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
          <Button onClick={startSession} disabled={!jabatan || loading} className="w-full bg-violet-600 hover:bg-violet-700">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Penguji sedang bersiap...</> : <><Sparkles className="h-4 w-4 mr-2" />Mulai Sesi Uji ({TOTAL_ROUNDS} Pertanyaan)</>}
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[{ num: String(TOTAL_ROUNDS), label: "Pertanyaan", sub: "per sesi" }, { num: "4", label: "Skor max", sub: "per jawaban" }, { num: "K/NK", label: "Predikat", sub: "akhir sesi" }, { num: "~15", label: "Menit", sub: "estimasi" }].map(({ num, label, sub }, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/2 p-3 text-center">
              <p className="text-violet-400 text-sm font-bold">{num}</p>
              <p className="text-white text-xs font-medium">{label}</p>
              <p className="text-slate-500 text-[10px]">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // RESULT
  if (phase === "result" && finalResult) {
    const avgSkor = rounds.reduce((s, r) => s + (r.skor ?? 0), 0) / TOTAL_ROUNDS;
    const isKompeten = finalResult.predikat?.includes("Kompeten") && !finalResult.predikat?.includes("Belum");
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={restart} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-4 w-4" /></button>
              <div><p className="text-base font-bold text-white">Hasil Uji Pelaksana Lapangan</p><p className="text-xs text-slate-400">{jabatan}</p></div>
            </div>
            <Button onClick={restart} size="sm" variant="outline" className="text-xs gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Ulangi</Button>
          </div>
          <div className={`rounded-2xl border p-5 mb-4 ${isKompeten ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <div className="flex items-center gap-4 mb-3">
              <div className="rounded-xl p-3 bg-white/5">
                {isKompeten ? <Trophy className="h-8 w-8 text-emerald-400" /> : <XCircle className="h-8 w-8 text-red-400" />}
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Hasil Simulasi</p>
                <p className={`text-2xl font-bold ${isKompeten ? "text-emerald-400" : "text-red-400"}`}>{finalResult.predikat}</p>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4].map(s => <div key={s} className={`h-2 w-8 rounded-full ${s <= Math.round(avgSkor) ? (avgSkor >= 3 ? "bg-emerald-500" : avgSkor >= 2 ? "bg-amber-500" : "bg-red-500") : "bg-slate-800"}`} />)}
                  <span className="text-xs text-slate-400">{avgSkor.toFixed(1)}/4.0</span>
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-sm">{finalResult.ringkasan}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-4 mb-3">
            <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5"><BarChart2 className="h-3.5 w-3.5" /> Skor per Pertanyaan</p>
            <div className="space-y-2">
              {finalResult.hasilPerRound?.map(h => {
                const sc = SKOR_CONFIG[h.skor] || SKOR_CONFIG[1];
                return (
                  <div key={h.num} className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs w-6">P{h.num}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${h.skor >= 3 ? "bg-emerald-500" : h.skor >= 2 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${(h.skor / 4) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${sc.color} w-6 text-right`}>{h.skor}/4</span>
                    <Badge variant="outline" className={`text-[9px] ${sc.color} border-current/30 shrink-0`}>{h.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {finalResult.kekuatan?.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Kekuatan</p>
                <ul className="space-y-1">{finalResult.kekuatan.map((k, i) => <li key={i} className="text-slate-300 text-xs flex gap-1.5"><span className="text-emerald-400">•</span>{k}</li>)}</ul>
              </div>
            )}
            {finalResult.perbaikan?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Perlu Ditingkatkan</p>
                <ul className="space-y-1">{finalResult.perbaikan.map((p, i) => <li key={i} className="text-slate-300 text-xs flex gap-1.5"><span className="text-amber-400">•</span>{p}</li>)}</ul>
              </div>
            )}
          </div>

          {finalResult.rekomendasi?.length > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
              <p className="text-violet-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Rekomendasi Pengembangan</p>
              <ul className="space-y-1.5">
                {finalResult.rekomendasi.map((r, i) => (
                  <li key={i} className="text-slate-300 text-xs flex gap-2"><ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={restart} variant="outline" className="flex-1 text-xs gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Ulangi</Button>
            <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs">
              <Link href="/k3man-claw">K3ManClaw AI →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // SESSION
  const cur = rounds[rounds.length - 1];
  const answered = rounds.filter(r => r.status === "answered");
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="border-b border-white/10 bg-slate-950/90 backdrop-blur sticky top-0 z-10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={restart} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><ArrowLeft className="h-4 w-4" /></button>
            <div><p className="text-sm font-semibold text-white">{jabatan}</p><p className="text-xs text-slate-500">Uji Lapangan · {topik}</p></div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const r = rounds[i]; const isCur = i === rounds.length - 1 && cur?.status === "pending"; const isDone = r?.status === "answered";
              return <div key={i} className={`h-2 w-8 rounded-full transition-all ${isDone ? (r.skor! >= 3 ? "bg-emerald-500" : r.skor! >= 2 ? "bg-amber-500" : "bg-red-400") : isCur ? "bg-violet-400 animate-pulse" : "bg-slate-800"}`} />;
            })}
            <span className="text-xs text-slate-400 ml-1">{answered.length}/{TOTAL_ROUNDS}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-violet-500/20 p-2 shrink-0"><Bot className="h-4 w-4 text-violet-400" /></div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/8 p-4 max-w-lg">
              <p className="text-xs text-violet-400 font-semibold mb-1">Penguji AI</p>
              <p className="text-slate-200 text-sm leading-relaxed">Selamat datang di sesi uji kompetensi untuk <strong className="text-white">{jabatan}</strong>. Saya akan mengajukan {TOTAL_ROUNDS} pertanyaan situasi lapangan nyata. Jawab berdasarkan pengalaman dan pengetahuan teknis Anda.</p>
            </div>
          </div>

          {rounds.map((round) => (
            <div key={round.num}>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-violet-500/20 p-2 shrink-0"><Bot className="h-4 w-4 text-violet-400" /></div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/8 p-4 max-w-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-violet-400 font-semibold">Pertanyaan {round.num}</p>
                    <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{round.topik}</Badge>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">{round.pertanyaan}</p>
                </div>
              </div>
              {round.jawaban && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-violet-600/20 border border-violet-500/20 p-4 max-w-lg">
                    <p className="text-xs text-violet-300 font-semibold mb-1 text-right">Jawaban Anda</p>
                    <p className="text-slate-200 text-sm leading-relaxed">{round.jawaban}</p>
                  </div>
                  <div className="rounded-full bg-slate-700 p-2 shrink-0"><User className="h-4 w-4 text-slate-300" /></div>
                </div>
              )}
              {round.feedback && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-violet-500/20 p-2 shrink-0"><Bot className="h-4 w-4 text-violet-400" /></div>
                  <div className={`rounded-2xl rounded-tl-sm border p-4 max-w-lg ${round.skor && round.skor >= 3 ? "bg-emerald-500/8 border-emerald-500/25" : round.skor === 2 ? "bg-amber-500/8 border-amber-500/25" : "bg-red-500/8 border-red-500/25"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-slate-400 font-semibold">Feedback Penguji</p>
                      {round.skor && <Badge variant="outline" className={`text-[9px] ${SKOR_CONFIG[round.skor]?.color} border-current/30`}>{round.skor}/4 — {SKOR_CONFIG[round.skor]?.label}</Badge>}
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed mb-2">{round.feedback}</p>
                    {round.koreksi && <p className="text-xs text-amber-300 italic border-t border-white/8 pt-2">{round.koreksi}</p>}
                    {round.poin && round.poin.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">{round.poin.map((p, i) => <Badge key={i} variant="outline" className="text-[9px] text-violet-400 border-violet-400/30">{p}</Badge>)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-violet-500/20 p-2 shrink-0"><Bot className="h-4 w-4 text-violet-400" /></div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/8 p-4">
                <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" /><span className="text-sm text-slate-400">Mengevaluasi jawaban...</span></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {cur?.status === "pending" && !loading && (
        <div className="border-t border-white/10 bg-slate-950/90 backdrop-blur p-4">
          <div className="max-w-2xl mx-auto">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 mb-2 text-red-400 text-xs">{error}</div>}
            <div className="flex gap-2">
              <textarea value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
                placeholder="Ketik jawaban Anda... (Enter untuk kirim)"
                className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none max-h-32"
                rows={2} />
              <Button onClick={submitAnswer} disabled={!currentAnswer.trim()} className="bg-violet-600 hover:bg-violet-700 self-end h-12 w-12 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
