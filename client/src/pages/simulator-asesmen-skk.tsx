import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Send, RotateCcw, ChevronLeft, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { Link } from "wouter";

type Msg = { role: "asesor" | "user"; text: string; label?: string; selesai?: boolean; nilai?: { skor?: number; predikat?: string; ukKompeten?: string[]; ukBelumKompeten?: string[]; rekomendasi?: string; umpanBalik?: string } };

const SKEMA_SKK = [
  "Ahli Teknik Bangunan Gedung (Madya)","Ahli Teknik Jalan (Muda)","Ahli Teknik Jembatan (Utama)","Ahli Manajemen Proyek Konstruksi (Madya)","Ahli K3 Konstruksi (Muda)","Ahli K3 Konstruksi (Madya)","Ahli K3 Konstruksi (Utama)","Ahli Sistem Manajemen Mutu Konstruksi","Ahli Geoteknik (Madya)","Ahli Teknik Mekanikal (Muda)","Ahli Teknik Plumbing & Pompa Mekanik","Pengawas Pekerjaan Gedung","Pelaksana Lapangan Pekerjaan Jalan","Teknisi Jembatan","Juru Ukur / Surveyor Konstruksi","Mandor Besi & Cor Beton","Teknisi Perawatan Bangunan Gedung",
];

export default function SimulatorAsesmenSKK() {
  const [step, setStep] = useState<"setup" | "chat" | "done">("setup");
  const [skema, setSkema] = useState("");
  const [namaPeserta, setNamaPeserta] = useState("");
  const [pengalaman, setPengalaman] = useState("3–5 tahun");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  async function startSim() {
    if (!skema) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-asesmen-skk/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skema, namaPeserta, pengalaman }),
      });
      const d = await r.json();
      setMsgs([{ role: "asesor", text: d.pembuka, label: "Asesmen Dimulai" }]);
      setStep("chat"); setMsgCount(0);
    } catch { }
    setLoading(false);
  }

  async function sendMsg() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    const nextCount = msgCount + 1; setMsgCount(nextCount);
    setMsgs(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-asesmen-skk/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skema, namaPeserta, pengalaman, jawaban: userMsg, messageCount: nextCount }),
      });
      const d = await r.json();
      setMsgs(prev => [...prev, { role: "asesor", text: d.respons, label: d.label, selesai: d.selesai, nilai: d.nilai }]);
      if (d.selesai && d.nilai?.skor) setScore(d.nilai.skor);
      if (d.selesai) setStep("done");
    } catch { }
    setLoading(false);
  }

  function reset() { setStep("setup"); setMsgs([]); setInput(""); setMsgCount(0); setScore(null); }

  const scoreColor = score !== null ? (score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400") : "";

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-violet-500/10"><GraduationCap className="h-6 w-6 text-violet-400" /></div>
          <div><h1 className="text-2xl font-bold">Simulator Asesmen Kompetensi SKK</h1><p className="text-slate-400 text-sm">Latih asesmen SKK LPJK vs AI asesor — feedback unit kompetensi & skor</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-violet-400 border-violet-400/30">Gelombang 16</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {step === "setup" && (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="flex items-start gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">Simulator ini mereplikasi sesi asesmen kompetensi SKK LPJK. Asesor AI akan mengajukan pertanyaan berbasis unit kompetensi, observasi, dan portofolio. Jawab dengan pengalaman nyata Anda.</p>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Skema Sertifikasi SKK</Label>
              <Select value={skema} onValueChange={setSkema}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih skema SKK..." /></SelectTrigger>
                <SelectContent>{SKEMA_SKK.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Nama Peserta (opsional)</Label>
                <input className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm" placeholder="cth: Ir. Budi Santoso" value={namaPeserta} onChange={e => setNamaPeserta(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-slate-300">Pengalaman Kerja</Label>
                <Select value={pengalaman} onValueChange={setPengalaman}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["< 1 tahun","1–2 tahun","3–5 tahun","5–10 tahun","> 10 tahun"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button onClick={startSim} disabled={loading || !skema} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              {loading ? "Memulai asesmen..." : "Mulai Simulasi Asesmen SKK →"}
            </Button>
          </Card>
        )}

        {(step === "chat" || step === "done") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-violet-400 border-violet-400/30 text-xs">{skema}</Badge>
                {score !== null && <Badge variant="outline" className={`${scoreColor} border-current text-xs`}>Skor: {score}/100</Badge>}
              </div>
              <Button size="sm" variant="outline" onClick={reset} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "asesor" && <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">A</div>}
                  <div className={`max-w-[85%] rounded-xl p-4 text-sm ${m.role === "user" ? "bg-slate-700/50 border border-slate-600 text-slate-200" : "bg-slate-800 border border-violet-500/20 text-slate-200"}`}>
                    {m.label && <div className="text-xs text-violet-400 font-semibold mb-2 uppercase tracking-wide">{m.label}</div>}
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    {m.nilai && (
                      <div className="mt-3 pt-3 border-t border-slate-600 space-y-3">
                        {m.nilai.skor !== undefined && (
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-amber-400" />
                            <div>
                              <div className={`text-xl font-bold ${scoreColor}`}>{m.nilai.skor}/100</div>
                              <div className="text-xs text-slate-400">{m.nilai.predikat}</div>
                            </div>
                          </div>
                        )}
                        {m.nilai.ukKompeten && m.nilai.ukKompeten.length > 0 && (
                          <div><div className="text-xs text-slate-400 mb-1">Unit Kompetensi — Kompeten:</div>
                            <ul className="space-y-1">{m.nilai.ukKompeten.map((u, j) => <li key={j} className="text-xs text-emerald-300 flex gap-1"><CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5 text-emerald-400" />{u}</li>)}</ul></div>
                        )}
                        {m.nilai.ukBelumKompeten && m.nilai.ukBelumKompeten.length > 0 && (
                          <div><div className="text-xs text-slate-400 mb-1">Unit Kompetensi — Perlu Ditingkatkan:</div>
                            <ul className="space-y-1">{m.nilai.ukBelumKompeten.map((u, j) => <li key={j} className="text-xs text-amber-300 flex gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5 text-amber-400" />{u}</li>)}</ul></div>
                        )}
                        {m.nilai.umpanBalik && <div className="bg-violet-500/10 border border-violet-500/20 rounded p-2 text-xs text-violet-200">{m.nilai.umpanBalik}</div>}
                        {m.nilai.rekomendasi && <div className="text-xs text-slate-300"><strong className="text-white">Rekomendasi:</strong> {m.nilai.rekomendasi}</div>}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">P</div>}
                </div>
              ))}
              {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold">A</div><div className="bg-slate-800 border border-violet-500/20 rounded-xl p-4 text-slate-400 text-sm animate-pulse">Asesor sedang mengevaluasi jawaban...</div></div>}
            </div>

            {step === "chat" && (
              <div className="flex gap-2 pt-2">
                <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} placeholder="Jawab pertanyaan asesor dengan pengalaman nyata Anda... (Enter untuk kirim)" className="bg-slate-800 border-slate-600 text-white resize-none text-sm" rows={3} />
                <Button onClick={sendMsg} disabled={loading || !input.trim()} className="bg-violet-600 hover:bg-violet-700 self-end px-3"><Send className="h-4 w-4" /></Button>
              </div>
            )}
            {step === "done" && <div className="text-center py-4"><p className="text-slate-400 text-sm mb-3">Sesi asesmen selesai. Pelajari feedback dan perbaiki unit kompetensi yang perlu ditingkatkan.</p><Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">Mulai Sesi Baru</Button></div>}
          </div>
        )}
      </div>
    </div>
  );
}
