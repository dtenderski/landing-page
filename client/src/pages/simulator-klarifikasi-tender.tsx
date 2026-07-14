import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Send, RotateCcw, ChevronLeft, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { Link } from "wouter";

type Msg = { role: "panitia" | "user"; text: string; label?: string; selesai?: boolean; evaluasi?: { nilai?: number; predikat?: string; kekuatan?: string[]; kelemahan?: string[]; saran?: string } };

const JENIS_TENDER = ["Jasa Konstruksi Gedung","Jasa Konstruksi Jalan & Jembatan","Pengadaan Alat Berat & Material","Jasa Konsultansi Perencanaan","Jasa Konsultansi Pengawasan","Pekerjaan Mekanikal-Elektrikal (MEP)","Jasa EPC / Turnkey","Jasa Pengelolaan & Pemeliharaan Infrastruktur"];
const POSISI = ["Direktur / Wakil Direktur (Penanggungjawab Teknis)","Kepala Proyek / Site Manager","Estimator / Quantity Surveyor","Procurement Manager","Tenaga Ahli K3","Tenaga Ahli Manajemen Mutu"];

export default function SimulatorKlarifikasiTender() {
  const [step, setStep] = useState<"setup" | "chat" | "done">("setup");
  const [jenisTender, setJenisTender] = useState("");
  const [posisi, setPosisi] = useState("");
  const [nilaiPenawaran, setNilaiPenawaran] = useState("");
  const [namaProyek, setNamaProyek] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  async function startSim() {
    if (!jenisTender || !posisi || !namaProyek) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-klarifikasi-tender/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisTender, posisi, nilaiPenawaran, namaProyek }),
      });
      const d = await r.json();
      setMsgs([{ role: "panitia", text: d.pembuka, label: "Klarifikasi Dimulai" }]);
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
      const r = await fetch("/api/tools/simulator-klarifikasi-tender/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisTender, posisi, nilaiPenawaran, namaProyek, jawaban: userMsg, messageCount: nextCount }),
      });
      const d = await r.json();
      setMsgs(prev => [...prev, { role: "panitia", text: d.respons, label: d.label, selesai: d.selesai, evaluasi: d.evaluasi }]);
      if (d.selesai) setStep("done");
    } catch { }
    setLoading(false);
  }

  function reset() { setStep("setup"); setMsgs([]); setInput(""); setMsgCount(0); }

  const lastMsg = msgs[msgs.length - 1];
  const skor = lastMsg?.evaluasi?.nilai;
  const scoreColor = skor != null ? (skor >= 80 ? "text-emerald-400" : skor >= 60 ? "text-amber-400" : "text-red-400") : "";

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-violet-500/10"><Briefcase className="h-6 w-6 text-violet-400" /></div>
          <div><h1 className="text-2xl font-bold">Simulator Klarifikasi Teknis Tender</h1><p className="text-slate-400 text-sm">Latih menjawab pertanyaan panitia evaluasi tender — skor & feedback profesional</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-violet-400 border-violet-400/30">Gelombang 17</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {step === "setup" && (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="flex items-start gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">Simulator mereplikasi sesi klarifikasi teknis evaluasi tender. Panitia AI akan menguji metode kerja, jadwal, harga, kualifikasi, dan strategi Anda. Jawab seperti situasi nyata.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nama / Jenis Pekerjaan Tender</Label>
                <input className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm" placeholder="cth: Pembangunan Gedung RSUD Tipe B Kab. Bogor" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-slate-300">Jenis Tender</Label>
                <Select value={jenisTender} onValueChange={setJenisTender}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis..." /></SelectTrigger>
                  <SelectContent>{JENIS_TENDER.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Posisi Anda dalam Tim Tender</Label>
                <Select value={posisi} onValueChange={setPosisi}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih posisi..." /></SelectTrigger>
                  <SelectContent>{POSISI.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nilai Penawaran (opsional)</Label>
                <input className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm" placeholder="cth: Rp 78.500.000.000 (HPS Rp 82M)" value={nilaiPenawaran} onChange={e => setNilaiPenawaran(e.target.value)} /></div>
            </div>
            <Button onClick={startSim} disabled={loading || !jenisTender || !posisi || !namaProyek} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              {loading ? "Memulai klarifikasi..." : "Mulai Simulasi Klarifikasi Tender →"}
            </Button>
          </Card>
        )}

        {(step === "chat" || step === "done") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2"><Badge variant="outline" className="text-violet-400 border-violet-400/30 text-xs">{jenisTender}</Badge><Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">{posisi}</Badge></div>
              <Button size="sm" variant="outline" onClick={reset} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "panitia" && <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">P</div>}
                  <div className={`max-w-[85%] rounded-xl p-4 text-sm ${m.role === "user" ? "bg-slate-700/50 border border-slate-600 text-slate-200" : "bg-slate-800 border border-violet-500/20 text-slate-200"}`}>
                    {m.label && <div className="text-xs text-violet-400 font-semibold mb-2 uppercase tracking-wide">{m.label}</div>}
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    {m.evaluasi && (
                      <div className="mt-3 pt-3 border-t border-slate-600 space-y-3">
                        {m.evaluasi.nilai !== undefined && (
                          <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-400" />
                            <div><div className={`text-xl font-bold ${scoreColor}`}>{m.evaluasi.nilai}/100</div><div className="text-xs text-slate-400">{m.evaluasi.predikat}</div></div>
                          </div>
                        )}
                        {m.evaluasi.kekuatan && m.evaluasi.kekuatan.length > 0 && (
                          <div><div className="text-xs text-slate-400 mb-1">Kekuatan presentasi:</div>
                            <ul className="space-y-1">{m.evaluasi.kekuatan.map((k, j) => <li key={j} className="text-xs text-emerald-300 flex gap-1"><CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5 text-emerald-400" />{k}</li>)}</ul></div>
                        )}
                        {m.evaluasi.kelemahan && m.evaluasi.kelemahan.length > 0 && (
                          <div><div className="text-xs text-slate-400 mb-1">Area yang perlu diperkuat:</div>
                            <ul className="space-y-1">{m.evaluasi.kelemahan.map((k, j) => <li key={j} className="text-xs text-amber-300 flex gap-1"><AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5 text-amber-400" />{k}</li>)}</ul></div>
                        )}
                        {m.evaluasi.saran && <div className="bg-violet-500/10 border border-violet-500/20 rounded p-2 text-xs text-violet-200">💡 {m.evaluasi.saran}</div>}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">T</div>}
                </div>
              ))}
              {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold">P</div><div className="bg-slate-800 border border-violet-500/20 rounded-xl p-4 text-slate-400 text-sm animate-pulse">Panitia sedang menyiapkan pertanyaan berikutnya...</div></div>}
            </div>
            {step === "chat" && (
              <div className="flex gap-2 pt-2">
                <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} placeholder="Jawab pertanyaan panitia secara profesional... (Enter untuk kirim)" className="bg-slate-800 border-slate-600 text-white resize-none text-sm" rows={3} />
                <Button onClick={sendMsg} disabled={loading || !input.trim()} className="bg-violet-600 hover:bg-violet-700 self-end px-3"><Send className="h-4 w-4" /></Button>
              </div>
            )}
            {step === "done" && <div className="text-center py-4"><p className="text-slate-400 text-sm mb-3">Sesi klarifikasi selesai. Pelajari evaluasi dan tingkatkan kemampuan presentasi tender Anda.</p><Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">Mulai Sesi Baru</Button></div>}
          </div>
        )}
      </div>
    </div>
  );
}
