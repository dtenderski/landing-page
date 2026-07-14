import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, Send, RotateCcw, ChevronLeft, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

type Msg = { role: "ketua" | "user"; text: string; label?: string; selesai?: boolean; vonis?: { putusan?: string; sanksi?: string[]; rekomendasi?: string[]; pelajaran?: string } };

export default function SimulatorSidangK3() {
  const [step, setStep] = useState<"setup" | "chat" | "done">("setup");
  const [posisi, setPosisi] = useState("Kontraktor / Perusahaan Pelaksana");
  const [jenisPerlanggaran, setJenisPelanggaran] = useState("");
  const [tingkat, setTingkat] = useState("Serius");
  const [namaProyek, setNamaProyek] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  async function startSim() {
    if (!jenisPerlanggaran || !namaProyek) return;
    setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-sidang-k3/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posisi, jenisPerlanggaran, tingkat, namaProyek }),
      });
      const d = await r.json();
      setMsgs([{ role: "ketua", text: d.pembuka, label: "Sidang K3 Dibuka" }]);
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
      const r = await fetch("/api/tools/simulator-sidang-k3/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posisi, jenisPerlanggaran, tingkat, namaProyek, pernyataan: userMsg, messageCount: nextCount }),
      });
      const d = await r.json();
      setMsgs(prev => [...prev, { role: "ketua", text: d.respons, label: d.label, selesai: d.selesai, vonis: d.vonis }]);
      if (d.selesai) setStep("done");
    } catch { }
    setLoading(false);
  }

  function reset() { setStep("setup"); setMsgs([]); setInput(""); setMsgCount(0); }

  const PELANGGARAN = [
    "Tidak pakai APD (helm/safety shoes/harness) di area kerja",
    "Bekerja di ketinggian tanpa pengaman / scaffolding tidak layak",
    "Kecelakaan kerja — pekerja jatuh dari ketinggian",
    "Kebakaran akibat kelalaian penanganan material mudah terbakar",
    "Galian terbuka tanpa proteksi / longsor yang melukai pekerja",
    "Crane overload / sling putus / alat tidak bersertifikat",
    "Pelanggaran izin kerja (permit-to-work) hot work / confined space",
    "Pekerja terpapar B3 tanpa perlindungan / ventilasi tidak memadai",
    "Kecelakaan alat berat (dump truck, excavator) di area proyek",
    "Ledakan akibat kelalaian dalam penanganan gas / bahan peledak",
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-500/10"><Gavel className="h-6 w-6 text-red-400" /></div>
          <div>
            <h1 className="text-2xl font-bold">Simulator Sidang Pelanggaran K3</h1>
            <p className="text-slate-400 text-sm">Latih menghadapi sidang K3 vs AI majelis — vonis + rekomendasi perbaikan</p>
          </div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-red-400 border-red-400/30">Gelombang 15</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {step === "setup" && (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0"/>
              <p className="text-xs text-red-300">Simulator ini melatih kesiapan menghadapi sidang K3/HSE. Skenario berbasis regulasi K3 konstruksi Indonesia yang berlaku.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Posisi / Peran Anda</Label>
                <Select value={posisi} onValueChange={setPosisi}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Kontraktor / Perusahaan Pelaksana","HSE Officer / Safety Manager","Site Manager / Pelaksana Lapangan","Subkontraktor","Pemilik / Mandor"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Tingkat Pelanggaran</Label>
                <Select value={tingkat} onValueChange={setTingkat}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Ringan","Sedang","Serius","Sangat Serius / Fatal"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Jenis Pelanggaran K3</Label>
                <Select value={jenisPerlanggaran} onValueChange={setJenisPelanggaran}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih jenis pelanggaran..." /></SelectTrigger>
                  <SelectContent>{PELANGGARAN.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label className="text-slate-300">Nama Proyek</Label>
                <input className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm" placeholder="cth: Proyek Pembangunan Gedung Serbaguna Kota Bandung" value={namaProyek} onChange={e=>setNamaProyek(e.target.value)} /></div>
            </div>
            <Button onClick={startSim} disabled={loading || !jenisPerlanggaran || !namaProyek} className="w-full bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Memulai sidang..." : "Hadapi Sidang K3 →"}
            </Button>
          </Card>
        )}

        {(step === "chat" || step === "done") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">{posisi} | {jenisPerlanggaran} | Tingkat: {tingkat}</div>
              <Button size="sm" variant="outline" onClick={reset} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ketua" && <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">⚖️</div>}
                  <div className={`max-w-[85%] rounded-xl p-4 text-sm ${m.role === "user" ? "bg-slate-700/50 border border-slate-600 text-slate-200" : "bg-slate-800 border border-red-500/20 text-slate-200"}`}>
                    {m.label && <div className="text-xs text-red-400 font-semibold mb-2 uppercase tracking-wide">{m.label}</div>}
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    {m.vonis && (
                      <div className="mt-3 pt-3 border-t border-slate-600 space-y-3">
                        {m.vonis.putusan && <div className="flex items-start gap-2"><ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"/><div className="font-semibold text-red-300">{m.vonis.putusan}</div></div>}
                        {m.vonis.sanksi && m.vonis.sanksi.length > 0 && <div><div className="text-xs text-slate-400 mb-1">Sanksi yang dijatuhkan:</div><ul className="space-y-1">{m.vonis.sanksi.map((s,j)=><li key={j} className="text-xs text-red-200 flex gap-1"><span className="flex-shrink-0">•</span>{s}</li>)}</ul></div>}
                        {m.vonis.rekomendasi && m.vonis.rekomendasi.length > 0 && <div><div className="text-xs text-slate-400 mb-1">Rekomendasi perbaikan:</div><ul className="space-y-1">{m.vonis.rekomendasi.map((r,j)=><li key={j} className="text-xs text-emerald-300 flex gap-1"><CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5 text-emerald-400"/>{r}</li>)}</ul></div>}
                        {m.vonis.pelajaran && <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2 text-xs text-amber-200">💡 {m.vonis.pelajaran}</div>}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">U</div>}
                </div>
              ))}
              {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-xs">⚖️</div><div className="bg-slate-800 border border-red-500/20 rounded-xl p-4 text-slate-400 text-sm animate-pulse">Majelis sidang sedang mempertimbangkan...</div></div>}
            </div>
            {step === "chat" && (
              <div className="flex gap-2 pt-2">
                <Textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Sampaikan pembelaan, klarifikasi, atau penjelasan Anda... (Enter untuk kirim)" className="bg-slate-800 border-slate-600 text-white resize-none text-sm" rows={2} />
                <Button onClick={sendMsg} disabled={loading || !input.trim()} className="bg-red-600 hover:bg-red-700 self-end px-3"><Send className="h-4 w-4" /></Button>
              </div>
            )}
            {step === "done" && <div className="text-center py-4"><p className="text-slate-400 text-sm mb-3">Sidang K3 selesai. Pelajari vonis dan rekomendasi di atas.</p><Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">Mulai Sesi Baru</Button></div>}
          </div>
        )}
      </div>
    </div>
  );
}
