import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Users2, Send,
  RefreshCw, Info, ChevronDown
} from "lucide-react";
import { Link } from "wouter";

const JENIS_RAPAT = [
  "Rapat Evaluasi Bulanan (Monthly Progress Meeting)",
  "Rapat Evaluasi Mingguan Site (Weekly Site Meeting)",
  "Rapat Penyelesaian Masalah / Problem Solving",
  "Rapat Evaluasi Mutu (Quality Review)",
  "Rapat Evaluasi K3 (Safety Review Meeting)",
  "Rapat Evaluasi Keuangan & Cash Flow",
];

const PERAN_USER = [
  "Kontraktor Utama (Manajer Proyek / PM)",
  "Site Manager / Kepala Lapangan",
  "Konsultan MK / Pengawas",
  "Owner / PPK / Wakil Pemilik",
  "Sub-Kontraktor Spesialis",
];

const ISU_UTAMA = [
  "Keterlambatan progress dari kurva S",
  "Pembengkakan biaya / cost overrun",
  "Masalah kualitas material / workmanship",
  "Kekurangan tenaga kerja",
  "Keterlambatan suplai material",
  "Permasalahan K3 / incident di lapangan",
  "Permasalahan koordinasi antar sub-kon",
  "Perubahan lingkup pekerjaan (addendum)",
];

interface MessageRapat { role: "user" | "moderator"; text: string; label?: string }

export default function SimulatorRapatEvaluasi() {
  const [step, setStep] = useState<"setup" | "chat" | "selesai">("setup");
  const [jenisRapat, setJenisRapat] = useState("");
  const [peran, setPeran] = useState(PERAN_USER[0]);
  const [isu, setIsu] = useState<string[]>([]);
  const [namaProyek, setNamaProyek] = useState("");
  const [messages, setMessages] = useState<MessageRapat[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ringkasan, setRingkasan] = useState<{ keputusan: string[]; actionItem: string[]; nilaiEvaluasi: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function toggleIsu(i: string) { setIsu(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]); }

  async function mulaiRapat() {
    if (!jenisRapat || isu.length === 0) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/simulator-rapat-evaluasi/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisRapat, peran, isu, namaProyek }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([{ role: "moderator", text: data.pembuka, label: "MODERATOR" }]);
      setStep("chat");
    } catch (e: any) { setError(e.message || "Gagal memulai rapat."); }
    finally { setLoading(false); }
  }

  async function kirim() {
    if (!input.trim() || loading) return;
    const userText = input.trim(); setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-rapat-evaluasi/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisRapat, peran, isu, namaProyek, pendapat: userText, messageCount: messages.length }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "moderator", text: data.respons, label: data.label }]);
      if (data.selesai) {
        setRingkasan({ keputusan: data.keputusan ?? [], actionItem: data.actionItem ?? [], nilaiEvaluasi: data.nilaiEvaluasi ?? "" });
        setStep("selesai");
      }
    } catch { setMessages(prev => [...prev, { role: "moderator", text: "Koneksi terganggu. Silakan kirim ulang." }]); }
    finally { setLoading(false); }
  }

  function reset() { setStep("setup"); setMessages([]); setRingkasan(null); setJenisRapat(""); setIsu([]); setNamaProyek(""); }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Users2 className="h-5 w-5 text-violet-400" /> Simulator Rapat Evaluasi Proyek
            </h1>
            <p className="text-xs text-slate-400">Latih kemampuan rapat evaluasi proyek konstruksi — AI jadi moderator + peserta, hasilkan notulensi & action item</p>
          </div>
          {step !== "setup" && <Button onClick={reset} variant="outline" size="sm" className="text-xs h-7 gap-1"><RefreshCw className="h-3 w-3" />Reset</Button>}
        </div>

        {step === "setup" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">Rapat evaluasi proyek yang efektif adalah kunci kesuksesan proyek konstruksi. Latih kemampuan: menyampaikan progress, mengidentifikasi masalah, mengusulkan solusi, dan menyepakati action item dalam format rapat formal.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Rapat *</label>
                <div className="space-y-1.5">
                  {JENIS_RAPAT.map(s => (
                    <button key={s} onClick={() => setJenisRapat(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisRapat === s ? "bg-violet-500/10 border-violet-400/30 text-violet-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Nama Proyek <span className="text-slate-600">(opsional)</span></label>
                <input value={namaProyek} onChange={e => setNamaProyek(e.target.value)}
                  placeholder="cth: Pembangunan Jalan Tol Seksi 3"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Peran Anda</label>
                <div className="flex gap-2 flex-wrap">
                  {PERAN_USER.map(p => (
                    <button key={p} onClick={() => setPeran(p)}
                      className={`rounded-lg border py-1.5 px-2.5 text-xs transition-all ${peran === p ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Isu yang Akan Dibahas * <span className="text-slate-500">(pilih 2–4)</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ISU_UTAMA.map(i => (
                    <button key={i} onClick={() => toggleIsu(i)}
                      className={`rounded-lg border py-2 px-2 text-xs text-left transition-all ${isu.includes(i) ? "bg-violet-500/10 border-violet-400/30 text-violet-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {isu.includes(i) && <span className="mr-1">✓</span>}{i}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{isu.length} isu dipilih</p>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={mulaiRapat} disabled={!jenisRapat || isu.length === 0 || loading} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyiapkan rapat...</> : <><Users2 className="h-4 w-4 mr-2" />Mulai Simulasi Rapat</>}
            </Button>
          </div>
        )}

        {(step === "chat" || step === "selesai") && (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-400/40">{jenisRapat}</Badge>
              <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600">{peran}</Badge>
              {isu.slice(0, 2).map(i => <Badge key={i} variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">{i}</Badge>)}
              {isu.length > 2 && <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">+{isu.length - 2}</Badge>}
            </div>

            <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[50vh] pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "moderator" && <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5 text-xs">🏛️</div>}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${m.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white/5 border border-white/8 text-slate-300 rounded-bl-sm"}`}>
                    {m.role === "moderator" && m.label && <p className="text-[10px] text-violet-400 font-semibold mb-1.5 uppercase tracking-wide">📋 {m.label}</p>}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-xs">🏛️</div>
                  <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:"0ms"}} /><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:"150ms"}} /><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:"300ms"}} /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {step === "selesai" && ringkasan && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 mb-4">
                <p className="text-sm text-white font-bold mb-3">📋 Notulensi & Action Item</p>
                {ringkasan.keputusan.length > 0 && (
                  <>
                    <p className="text-[10px] text-violet-400 font-semibold mb-1.5">Keputusan Rapat</p>
                    <ul className="space-y-1 mb-3">{ringkasan.keputusan.map((k, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-violet-400 shrink-0">✓</span>{k}</li>)}</ul>
                  </>
                )}
                {ringkasan.actionItem.length > 0 && (
                  <>
                    <p className="text-[10px] text-violet-400 font-semibold mb-1.5">Action Item</p>
                    <ul className="space-y-1 mb-3">{ringkasan.actionItem.map((a, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-amber-400 shrink-0">{i+1}.</span>{a}</li>)}</ul>
                  </>
                )}
                <p className="text-xs text-slate-400 italic">{ringkasan.nilaiEvaluasi}</p>
                <Button onClick={reset} className="w-full mt-3 bg-violet-600 hover:bg-violet-700 text-xs"><RefreshCw className="h-3 w-3 mr-1" />Rapat Lain</Button>
              </div>
            )}

            {step === "chat" && (
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && kirim()}
                  placeholder="Sampaikan laporan, tanggapan, atau solusi Anda... (Enter)"
                  className="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40" />
                <Button onClick={kirim} disabled={!input.trim() || loading} className="bg-violet-600 hover:bg-violet-700 px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
