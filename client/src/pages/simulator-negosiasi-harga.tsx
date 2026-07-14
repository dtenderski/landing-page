import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Scale, Send, RotateCcw, ChevronLeft, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

type Msg = { role: "moderator" | "user"; text: string; label?: string; selesai?: boolean; hasil?: { nilaiDisepakati?: string; diskon?: string; kondisi?: string[]; evaluasi?: string } };

export default function SimulatorNegosiasiHarga() {
  const [step, setStep] = useState<"setup" | "chat" | "done">("setup");
  const [posisi, setPosisi] = useState("Kontraktor Utama");
  const [lawan, setLawan] = useState("Owner / Pemberi Kerja");
  const [jenisKontrak, setJenisKontrak] = useState("Lump Sum");
  const [nilaiAwal, setNilaiAwal] = useState("");
  const [targetDiskon, setTargetDiskon] = useState("5");
  const [namaProyek, setNamaProyek] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  async function startSim() {
    if (!nilaiAwal || !namaProyek) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-negosiasi-harga/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posisi, lawan, jenisKontrak, nilaiAwal, targetDiskon, namaProyek }),
      });
      const d = await r.json();
      setMsgs([{ role: "moderator", text: d.pembuka, label: "Negosiasi Dimulai" }]);
      setStep("chat");
      setMsgCount(0);
    } catch { }
    setLoading(false);
  }

  async function sendMsg() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const nextCount = msgCount + 1;
    setMsgCount(nextCount);
    setMsgs(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-negosiasi-harga/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posisi, lawan, jenisKontrak, nilaiAwal, targetDiskon, namaProyek, tawaran: userMsg, messageCount: nextCount }),
      });
      const d = await r.json();
      setMsgs(prev => [...prev, { role: "moderator", text: d.respons, label: d.label, selesai: d.selesai, hasil: d.hasil }]);
      if (d.selesai) setStep("done");
    } catch { }
    setLoading(false);
  }

  function reset() { setStep("setup"); setMsgs([]); setInput(""); setMsgCount(0); }

  const lastMsg = msgs[msgs.length - 1];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10"><Scale className="h-6 w-6 text-blue-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">Simulator Negosiasi Harga Kontrak</h1>
            <p className="text-slate-400 text-sm">Latih skill negosiasi kontrak vs AI — summary hasil negosiasi</p>
          </div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-blue-400 border-blue-400/30">Gelombang 15</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {step === "setup" && (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <h2 className="font-semibold text-white">Konfigurasi Sesi Negosiasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Posisi Anda</Label>
                <Select value={posisi} onValueChange={setPosisi}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Kontraktor Utama","Subkontraktor","Supplier Material","Jasa Konsultansi"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Lawan Negosiasi</Label>
                <Select value={lawan} onValueChange={setLawan}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Owner / Pemberi Kerja","Project Manager Owner","Procurement Manager","Manajemen Konstruksi (MK)"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Jenis Kontrak</Label>
                <Select value={jenisKontrak} onValueChange={setJenisKontrak}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Lump Sum","Unit Price / Harga Satuan","Turnkey","Cost Plus Fee","GMP (Guaranteed Maximum Price)"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Target Penekanan Harga (%)</Label>
                <Select value={targetDiskon} onValueChange={setTargetDiskon}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["3","5","7","10","15","20"].map(v=><SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Nama Proyek</Label>
                <Input placeholder="cth: Gedung Perkantoran Sudirman" value={namaProyek} onChange={e=>setNamaProyek(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Nilai Penawaran Awal</Label>
                <Input placeholder="cth: Rp 45.000.000.000" value={nilaiAwal} onChange={e=>setNilaiAwal(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
            </div>
            <Button onClick={startSim} disabled={loading || !nilaiAwal || !namaProyek} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Memulai sesi..." : "Mulai Negosiasi →"}
            </Button>
          </Card>
        )}

        {(step === "chat" || step === "done") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">Sesi: {posisi} vs {lawan} | {namaProyek} | {nilaiAwal}</div>
              <Button size="sm" variant="outline" onClick={reset} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "moderator" && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">N</div>}
                  <div className={`max-w-[85%] rounded-xl p-4 text-sm ${m.role === "user" ? "bg-blue-600/20 border border-blue-500/30 text-blue-100" : "bg-slate-800 border border-slate-700 text-slate-200"}`}>
                    {m.label && <div className="text-xs text-blue-400 font-semibold mb-2 uppercase tracking-wide">{m.label}</div>}
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    {m.hasil && (
                      <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
                        {m.hasil.nilaiDisepakati && <div className="flex items-center gap-2 text-emerald-400 font-semibold"><CheckCircle2 className="h-4 w-4"/>{m.hasil.nilaiDisepakati}</div>}
                        {m.hasil.diskon && <div className="text-slate-300 text-xs flex items-center gap-1"><TrendingDown className="h-3 w-3 text-rose-400"/>Diskon tercapai: {m.hasil.diskon}</div>}
                        {m.hasil.kondisi && m.hasil.kondisi.length > 0 && <div><div className="text-xs text-slate-400 mb-1">Kondisi disepakati:</div><ul className="space-y-1">{m.hasil.kondisi.map((k,j)=><li key={j} className="text-xs text-slate-300 flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span>{k}</li>)}</ul></div>}
                        {m.hasil.evaluasi && <div className="bg-blue-500/10 rounded p-2 text-xs text-blue-300 border border-blue-500/20"><AlertCircle className="h-3 w-3 inline mr-1"/>Evaluasi: {m.hasil.evaluasi}</div>}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">U</div>}
                </div>
              ))}
              {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">N</div><div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-400 text-sm animate-pulse">Lawan negosiasi sedang merespons...</div></div>}
            </div>
            {step === "chat" && (
              <div className="flex gap-2 pt-2">
                <Textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Sampaikan tawaran atau argumen Anda... (Enter untuk kirim)" className="bg-slate-800 border-slate-600 text-white resize-none text-sm" rows={2} />
                <Button onClick={sendMsg} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 self-end px-3"><Send className="h-4 w-4" /></Button>
              </div>
            )}
            {step === "done" && <div className="text-center py-4"><p className="text-slate-400 text-sm mb-3">Sesi negosiasi selesai.</p><Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">Mulai Sesi Baru</Button></div>}
          </div>
        )}
      </div>
    </div>
  );
}
