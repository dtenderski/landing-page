import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Handshake, Send,
  RefreshCw, Info, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

const JENIS_KONTRAK = [
  "Kontrak Pemerintah (Perpres 46/2025)", "Kontrak BUMN/BUMD",
  "Kontrak Swasta / Developer", "Kontrak EPC / Turnkey",
  "Kontrak Jasa Konsultansi (PPK–Konsultan)",
];

const PERAN_USER = [
  "Kontraktor / Penyedia Jasa",
  "Konsultan / Sub-Kontraktor",
  "Owner / Pemberi Kerja",
];

const TOPIK_NEGOSIASI = [
  "Pasal Keterlambatan & Denda (Penalty)", "Pasal Pembayaran & Termin",
  "Klausul Force Majeure", "Pasal Perubahan Lingkup (CCO/Addendum)",
  "Pasal Jaminan & Retensi", "Pasal Penyelesaian Sengketa (Arbitrase/PHI)",
  "Pasal Garansi & Masa Pemeliharaan",
];

interface Message { role: "user" | "ai"; text: string; tip?: string }
interface NegosiasiState { jenisKontrak: string; peranUser: string; topik: string; ronde: number; skorUser: number }

export default function SimulatorNegosiasiKontrak() {
  const [step, setStep] = useState<"setup" | "chat" | "selesai">("setup");
  const [jenisKontrak, setJenisKontrak] = useState("");
  const [peranUser, setPeranUser] = useState(PERAN_USER[0]);
  const [topik, setTopik] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [negState, setNegState] = useState<NegosiasiState | null>(null);
  const [hasilAkhir, setHasilAkhir] = useState<{ skorAkhir: number; predikat: string; evaluasi: string; tipsKunci: string[] } | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function mulaiSimulasi() {
    if (!jenisKontrak || !topik) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/simulator-negosiasi-kontrak/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKontrak, peranUser, topik }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([{ role: "ai", text: data.pembuka, tip: data.tip }]);
      setNegState({ jenisKontrak, peranUser, topik, ronde: 0, skorUser: 0 });
      setStep("chat");
    } catch (e: any) { setError(e.message || "Gagal memulai simulasi."); }
    finally { setLoading(false); }
  }

  async function kirimArgumen() {
    if (!input.trim() || loading || !negState) return;
    const userText = input.trim(); setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-negosiasi-kontrak/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...negState, argumenUser: userText, ronde: negState.ronde + 1, historiChat: messages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNegState(prev => prev ? { ...prev, ronde: prev.ronde + 1, skorUser: prev.skorUser + (data.skorRonde ?? 0) } : null);
      setMessages(prev => [...prev, { role: "ai", text: data.responLawan, tip: data.tipRonde }]);
      if (data.selesai) {
        setHasilAkhir({ skorAkhir: data.skorAkhir, predikat: data.predikat, evaluasi: data.evaluasi, tipsKunci: data.tipsKunci ?? [] });
        setStep("selesai");
      }
    } catch (e: any) { setMessages(prev => [...prev, { role: "ai", text: "Koneksi error. Coba kirim ulang." }]); }
    finally { setLoading(false); }
  }

  function reset() { setStep("setup"); setMessages([]); setNegState(null); setHasilAkhir(null); setJenisKontrak(""); setTopik(""); }

  const PREDIKAT_COLOR: Record<string, string> = {
    "Negosiator Andal": "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    "Negosiator Kompeten": "text-blue-400 border-blue-500/30 bg-blue-500/5",
    "Negosiator Pemula": "text-amber-400 border-amber-500/30 bg-amber-500/5",
    "Perlu Banyak Latihan": "text-red-400 border-red-500/30 bg-red-500/5",
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="h-5 w-5 text-violet-400" /> Simulator Negosiasi Kontrak
            </h1>
            <p className="text-xs text-slate-400">Latih kemampuan negosiasi pasal kontrak konstruksi — AI berperan sebagai pihak lawan yang realistis</p>
          </div>
          {step !== "setup" && <Button onClick={reset} variant="outline" size="sm" className="text-xs h-7 gap-1"><RefreshCw className="h-3 w-3" />Reset</Button>}
        </div>

        {step === "setup" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">AI akan berperan sebagai pihak lawan dalam negosiasi kontrak. Setiap argumen Anda dinilai berdasarkan kekuatan yuridis, logika bisnis, dan strategi negosiasi. Simulasi 4–5 ronde dengan skor akhir.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Kontrak *</label>
                <div className="space-y-1.5">
                  {JENIS_KONTRAK.map(s => (
                    <button key={s} onClick={() => setJenisKontrak(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisKontrak === s ? "bg-violet-500/10 border-violet-400/30 text-violet-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Peran Anda dalam Simulasi</label>
                <div className="flex gap-2 flex-wrap">
                  {PERAN_USER.map(p => (
                    <button key={p} onClick={() => setPeranUser(p)}
                      className={`rounded-lg border py-1.5 px-3 text-xs transition-all ${peranUser === p ? "bg-violet-500/15 border-violet-400/40 text-violet-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Topik Negosiasi *</label>
                <div className="space-y-1.5">
                  {TOPIK_NEGOSIASI.map(s => (
                    <button key={s} onClick={() => setTopik(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${topik === s ? "bg-violet-500/10 border-violet-400/30 text-violet-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={mulaiSimulasi} disabled={!jenisKontrak || !topik || loading} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyiapkan simulasi...</> : <><Sparkles className="h-4 w-4 mr-2" />Mulai Simulasi Negosiasi</>}
            </Button>
          </div>
        )}

        {(step === "chat" || step === "selesai") && (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-400/40">{jenisKontrak}</Badge>
              <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600">{topik}</Badge>
              <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">{peranUser}</Badge>
              {negState && <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">Ronde {negState.ronde}/5</Badge>}
            </div>

            <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[50vh] pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "ai" && <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5 text-xs">⚖️</div>}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${m.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white/5 border border-white/8 text-slate-300 rounded-bl-sm"}`}>
                    {m.text}
                    {m.tip && <div className="mt-2 pt-2 border-t border-white/10"><p className="text-[10px] text-violet-400">💡 {m.tip}</p></div>}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-xs">⚖️</div>
                  <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:"0ms"}} /><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:"150ms"}} /><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:"300ms"}} /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {step === "selesai" && hasilAkhir && (
              <div className={`rounded-2xl border p-4 mb-4 ${PREDIKAT_COLOR[hasilAkhir.predikat] ?? "border-white/10 bg-white/3"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-bold">{hasilAkhir.predikat}</p>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-violet-400">{hasilAkhir.skorAkhir}</p>
                    <p className="text-[9px] text-slate-500">/ 100</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mb-3">{hasilAkhir.evaluasi}</p>
                {hasilAkhir.tipsKunci.length > 0 && (
                  <div>
                    <p className="text-[10px] text-violet-400 font-semibold mb-1.5">Tips Negosiasi Kunci</p>
                    <ul className="space-y-1">{hasilAkhir.tipsKunci.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-violet-400 shrink-0">{i+1}.</span>{t}</li>)}</ul>
                  </div>
                )}
                <Button onClick={reset} className="w-full mt-3 bg-violet-600 hover:bg-violet-700 text-xs"><RefreshCw className="h-3 w-3 mr-1" />Coba Topik Lain</Button>
              </div>
            )}

            {step === "chat" && (
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && kirimArgumen()}
                  placeholder="Tulis argumen negosiasi Anda... (Enter untuk kirim)"
                  className="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40" />
                <Button onClick={kirimArgumen} disabled={!input.trim() || loading} className="bg-violet-600 hover:bg-violet-700 px-3">
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
