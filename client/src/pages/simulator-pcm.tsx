import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Building2, Send,
  RefreshCw, Info, Users
} from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK_PCM = [
  "Gedung Bertingkat (High-Rise / Mid-Rise)",
  "Infrastruktur Jalan Nasional / Tol",
  "Jembatan & Flyover",
  "Bangunan Industri & Pabrik",
  "Rumah Sakit / Fasilitas Pemerintah",
  "Perumahan Skala Besar (100+ unit)",
  "Proyek EPC Migas / Energi",
];

const PERAN_PCM = [
  "Kontraktor Utama (Site Manager / PM)",
  "Konsultan Pengawas (MK / Supervisi)",
  "Sub-kontraktor Spesialis",
  "Wakil Owner / PPK",
];

const TOPIK_PCM = [
  "Jadwal & Milestone Proyek", "Metode Konstruksi Utama",
  "Alur Koordinasi & Komunikasi", "Prosedur K3 & HSE Plan",
  "Prosedur Quality Control (QC)", "Manajemen Sub-kontraktor",
  "Cash Flow & Sistem Pembayaran", "Prosedur Perubahan (CCO/Addendum)",
];

interface MessagePCM { role: "user" | "facilitator"; text: string; action?: string }

export default function SimulatorPCM() {
  const [step, setStep] = useState<"setup" | "chat" | "selesai">("setup");
  const [jenisProyek, setJenisProyek] = useState("");
  const [peran, setPeran] = useState(PERAN_PCM[0]);
  const [topikFokus, setTopikFokus] = useState<string[]>([]);
  const [messages, setMessages] = useState<MessagePCM[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [ringkasanAkhir, setRingkasanAkhir] = useState<{ poinDisepakati: string[]; tindakLanjut: string[]; evaluasi: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function toggleTopik(t: string) { setTopikFokus(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]); }

  async function mulaiPCM() {
    if (!jenisProyek || topikFokus.length === 0) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/simulator-pcm/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, peran, topikFokus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSessionId(data.sessionId || Date.now().toString());
      setMessages([{ role: "facilitator", text: data.pembuka }]);
      setStep("chat");
    } catch (e: any) { setError(e.message || "Gagal memulai PCM."); }
    finally { setLoading(false); }
  }

  async function kirimPendapat() {
    if (!input.trim() || loading) return;
    const userText = input.trim(); setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-pcm/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, peran, topikFokus, pendapatUser: userText, historiChat: messages, messageCount: messages.length }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "facilitator", text: data.responFasilitator, action: data.aksi }]);
      if (data.selesai) {
        setRingkasanAkhir({ poinDisepakati: data.poinDisepakati ?? [], tindakLanjut: data.tindakLanjut ?? [], evaluasi: data.evaluasi ?? "" });
        setStep("selesai");
      }
    } catch (e: any) { setMessages(prev => [...prev, { role: "facilitator", text: "Maaf, ada gangguan koneksi. Coba kirim ulang." }]); }
    finally { setLoading(false); }
  }

  function reset() { setStep("setup"); setMessages([]); setRingkasanAkhir(null); setJenisProyek(""); setTopikFokus([]); }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-rose-400" /> Simulator Pre-Construction Meeting (PCM)
            </h1>
            <p className="text-xs text-slate-400">Latih kemampuan PCM — AI berperan sebagai fasilitator rapat sebelum konstruksi dimulai</p>
          </div>
          {step !== "setup" && <Button onClick={reset} variant="outline" size="sm" className="text-xs h-7 gap-1"><RefreshCw className="h-3 w-3" />Reset</Button>}
        </div>

        {step === "setup" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300">PCM (Pre-Construction Meeting) adalah rapat wajib sebelum proyek mulai — memastikan semua pihak satu pemahaman tentang jadwal, metode kerja, K3, koordinasi, dan prosedur. AI akan menjadi fasilitator + peserta lain secara interaktif.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Proyek *</label>
                <div className="space-y-1.5">
                  {JENIS_PROYEK_PCM.map(s => (
                    <button key={s} onClick={() => setJenisProyek(s)}
                      className={`w-full rounded-lg border py-2 px-3 text-xs text-left transition-all ${jenisProyek === s ? "bg-rose-500/10 border-rose-400/30 text-rose-200" : "border-white/10 text-slate-400 hover:text-white"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Peran Anda dalam PCM</label>
                <div className="flex gap-2 flex-wrap">
                  {PERAN_PCM.map(p => (
                    <button key={p} onClick={() => setPeran(p)}
                      className={`rounded-lg border py-1.5 px-3 text-xs transition-all ${peran === p ? "bg-rose-500/15 border-rose-400/40 text-rose-300" : "border-white/10 text-slate-400 hover:text-white"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Topik PCM yang Akan Dibahas * <span className="text-slate-500">(pilih 2–4)</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TOPIK_PCM.map(t => (
                    <button key={t} onClick={() => toggleTopik(t)}
                      className={`rounded-lg border py-2 px-2 text-xs text-left transition-all ${topikFokus.includes(t) ? "bg-rose-500/10 border-rose-400/30 text-rose-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
                      {topikFokus.includes(t) && <span className="mr-1">✓</span>}{t}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{topikFokus.length} topik dipilih</p>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}
            <Button onClick={mulaiPCM} disabled={!jenisProyek || topikFokus.length === 0 || loading} className="w-full bg-rose-600 hover:bg-rose-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyiapkan rapat PCM...</> : <><Users className="h-4 w-4 mr-2" />Mulai Simulasi PCM</>}
            </Button>
          </div>
        )}

        {(step === "chat" || step === "selesai") && (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-400/40">{jenisProyek}</Badge>
              <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600">{peran}</Badge>
              {topikFokus.slice(0, 2).map(t => <Badge key={t} variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">{t}</Badge>)}
              {topikFokus.length > 2 && <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">+{topikFokus.length - 2} topik</Badge>}
            </div>

            <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[50vh] pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "facilitator" && <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5 text-xs">🏗️</div>}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${m.role === "user" ? "bg-rose-600 text-white rounded-br-sm" : "bg-white/5 border border-white/8 text-slate-300 rounded-bl-sm"}`}>
                    {m.role === "facilitator" && m.action && <p className="text-[10px] text-rose-400 font-semibold mb-1.5 uppercase tracking-wide">📋 {m.action}</p>}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-xs">🏗️</div>
                  <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{animationDelay:"0ms"}} /><div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{animationDelay:"150ms"}} /><div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{animationDelay:"300ms"}} /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {step === "selesai" && ringkasanAkhir && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 mb-4">
                <p className="text-sm text-white font-bold mb-2">📋 Notulensi PCM</p>
                {ringkasanAkhir.poinDisepakati.length > 0 && (
                  <>
                    <p className="text-[10px] text-rose-400 font-semibold mb-1.5">Poin Kesepakatan</p>
                    <ul className="space-y-1 mb-3">{ringkasanAkhir.poinDisepakati.map((p, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-rose-400 shrink-0">✓</span>{p}</li>)}</ul>
                  </>
                )}
                {ringkasanAkhir.tindakLanjut.length > 0 && (
                  <>
                    <p className="text-[10px] text-rose-400 font-semibold mb-1.5">Tindak Lanjut</p>
                    <ul className="space-y-1 mb-3">{ringkasanAkhir.tindakLanjut.map((p, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-amber-400 shrink-0">{i+1}.</span>{p}</li>)}</ul>
                  </>
                )}
                <p className="text-xs text-slate-400 italic">{ringkasanAkhir.evaluasi}</p>
                <Button onClick={reset} className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-xs"><RefreshCw className="h-3 w-3 mr-1" />PCM Proyek Lain</Button>
              </div>
            )}

            {step === "chat" && (
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && kirimPendapat()}
                  placeholder="Sampaikan pendapat, pertanyaan, atau usulan Anda... (Enter)"
                  className="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40" />
                <Button onClick={kirimPendapat} disabled={!input.trim() || loading} className="bg-rose-600 hover:bg-rose-700 px-3">
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
