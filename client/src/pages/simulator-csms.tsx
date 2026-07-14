import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, HardHat, Send,
  CheckCircle2, AlertTriangle, Info, RotateCcw, ThumbsUp
} from "lucide-react";
import { Link } from "wouter";

const JENIS_EVALUASI = [
  "Safety Pre-Qualification (PQ) — CSMS",
  "Vendor Assessment K3 — Oil & Gas",
  "Safety Audit Kontraktor — Infrastruktur",
  "Pre-Mobilization Safety Review",
  "Annual Contractor Safety Evaluation",
];

const PROFIL_PERUSAHAAN = [
  "Kontraktor Sipil (gedung/infrastruktur)",
  "Kontraktor Mekanikal-Elektrikal",
  "Kontraktor Scaffolding & Perancah",
  "Kontraktor Excavation & Piling",
  "Kontraktor Spesialis K3 / Demolisi",
];

interface Message { role: "user" | "ai"; content: string; score?: number; feedback?: string }
interface SessionInfo { jenisEvaluasi: string; profilPerusahaan: string; pertanyaanKe: number; totalPertanyaan: number; skorTotal: number }

export default function SimulatorCSMS() {
  const [jenisEvaluasi, setJenisEvaluasi] = useState("");
  const [profilPerusahaan, setProfilPerusahaan] = useState(PROFIL_PERUSAHAAN[0]);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function startSession() {
    if (!jenisEvaluasi) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/simulator-csms/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisEvaluasi, profilPerusahaan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([{ role: "ai", content: data.pertanyaanPertama }]);
      setSessionInfo({ jenisEvaluasi, profilPerusahaan, pertanyaanKe: 1, totalPertanyaan: data.totalPertanyaan ?? 6, skorTotal: 0 });
      setStarted(true);
    } catch (e: any) { setError(e.message || "Gagal memulai sesi."); }
    finally { setLoading(false); }
  }

  async function sendAnswer() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-csms/answer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisEvaluasi, profilPerusahaan,
          riwayat: [...messages, userMsg],
          pertanyaanKe: sessionInfo?.pertanyaanKe ?? 1,
          totalPertanyaan: sessionInfo?.totalPertanyaan ?? 6,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "ai", content: data.feedback + (data.pertanyaanBerikut ? "\n\n" + data.pertanyaanBerikut : ""), score: data.skor, feedback: data.feedback }]);
      if (data.selesai) {
        setFinished(true);
        setFinalScore(data.skorAkhir ?? 0);
      } else {
        setSessionInfo(prev => prev ? { ...prev, pertanyaanKe: prev.pertanyaanKe + 1, skorTotal: prev.skorTotal + (data.skor ?? 0) } : prev);
      }
    } catch (e: any) { setError(e.message || "Gagal memproses jawaban."); }
    finally { setLoading(false); }
  }

  function reset() {
    setStarted(false); setMessages([]); setInput(""); setSessionInfo(null);
    setFinished(false); setFinalScore(0); setError("");
  }

  const finalColor = finalScore >= 80 ? "text-emerald-400" : finalScore >= 60 ? "text-blue-400" : finalScore >= 40 ? "text-amber-400" : "text-red-400";
  const finalLabel = finalScore >= 80 ? "LULUS — Layak Disetujui" : finalScore >= 60 ? "KONDISIONAL — Perlu Perbaikan Minor" : "BELUM LULUS — Perlu Perbaikan Signifikan";

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <HardHat className="h-5 w-5 text-red-400" /> Simulator CSMS / Safety Pre-Qualification
            </h1>
            <p className="text-xs text-slate-400">Latihan menjawab pertanyaan evaluasi keselamatan dari Owner / Principal sebelum masuk ke proyek</p>
          </div>
        </div>

        {!started && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-2">
              <HardHat className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">Simulator ini meniru sesi Safety Pre-Qualification / CSMS yang dilakukan owner/principal sebelum menyetujui kontraktor bekerja. Latih tim K3 Anda menjawab pertanyaan dengan tepat dan meyakinkan.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Evaluasi yang Disimulasikan *</label>
                <div className="space-y-1.5">
                  {JENIS_EVALUASI.map(j => (
                    <button key={j} onClick={() => setJenisEvaluasi(j)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisEvaluasi === j ? "bg-red-500/10 border-red-400/30 text-red-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{j}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Profil Perusahaan Kontraktor</label>
                <div className="space-y-1.5">
                  {PROFIL_PERUSAHAAN.map(p => (
                    <button key={p} onClick={() => setProfilPerusahaan(p)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${profilPerusahaan === p ? "bg-red-500/10 border-red-400/30 text-red-200" : "border-white/8 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={startSession} disabled={!jenisEvaluasi || loading} className="w-full bg-red-600 hover:bg-red-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memulai sesi evaluasi...</> : <><Sparkles className="h-4 w-4 mr-2" />Mulai Simulasi CSMS</>}
            </Button>
          </div>
        )}

        {started && (
          <>
            {sessionInfo && !finished && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-white/8 bg-white/2">
                <div className="flex-1">
                  <p className="text-xs text-slate-400">{sessionInfo.jenisEvaluasi}</p>
                  <p className="text-[10px] text-slate-500">{sessionInfo.profilPerusahaan}</p>
                </div>
                <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">
                  Pertanyaan {sessionInfo.pertanyaanKe}/{sessionInfo.totalPertanyaan}
                </Badge>
              </div>
            )}

            {finished && (
              <div className={`rounded-2xl border p-5 mb-4 ${finalScore >= 80 ? "border-emerald-500/30 bg-emerald-500/5" : finalScore >= 60 ? "border-blue-500/30 bg-blue-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <p className="text-xs text-slate-400 mb-1">Hasil Akhir Simulasi</p>
                <p className={`text-3xl font-bold ${finalColor} mb-0.5`}>{finalScore}<span className="text-sm text-slate-500">/100</span></p>
                <p className={`text-sm font-semibold ${finalColor}`}>{finalLabel}</p>
              </div>
            )}

            <div className="space-y-3 mb-4 max-h-[480px] overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-xl px-4 py-3 max-w-[85%] ${m.role === "user" ? "bg-red-600/20 border border-red-500/30 text-right" : "bg-white/3 border border-white/8"}`}>
                    {m.role === "ai" && m.score !== undefined && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className={`text-[9px] border ${m.score >= 7 ? "text-emerald-400 border-emerald-400/30" : m.score >= 4 ? "text-amber-400 border-amber-400/30" : "text-red-400 border-red-400/30"}`}>Skor: {m.score}/10</Badge>
                      </div>
                    )}
                    <p className="text-xs text-slate-200 whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {!finished ? (
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAnswer()}
                  placeholder="Tulis jawaban Anda sebagai perwakilan perusahaan kontraktor..."
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400/50" />
                <Button onClick={sendAnswer} disabled={!input.trim() || loading} className="bg-red-600 hover:bg-red-700 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button onClick={reset} variant="outline" className="flex-1 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Ulang Simulasi</Button>
                <Button asChild className="flex-1 bg-red-600 hover:bg-red-700 text-xs">
                  <Link href="/generator-sop-k3-proyek">Generator SOP K3 →</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
