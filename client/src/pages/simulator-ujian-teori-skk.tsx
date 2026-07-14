import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookOpen, RotateCcw, ChevronLeft, CheckCircle2, XCircle, Trophy, AlertCircle } from "lucide-react";
import { Link } from "wouter";

type Soal = { nomor: number; pertanyaan: string; pilihan: string[]; kunciJawaban: string; penjelasan: string; referensi: string };
type JawabanUser = { nomor: number; pilihan: string | null; benar: boolean | null };

const BIDANG = ["Manajemen Konstruksi — Level 5 (Pelaksana Lapangan)","Manajemen Konstruksi — Level 6 (Pengawas Pekerjaan)","Manajemen Konstruksi — Level 7 (Kepala Proyek)","Teknik Bangunan Gedung — Level 5","Teknik Bangunan Gedung — Level 7 (Ahli Muda)","Teknik Jalan & Jembatan — Level 6","K3 Konstruksi — Level 5 (Petugas K3)","K3 Konstruksi — Level 7 (Ahli K3 Muda)","K3 Konstruksi — Level 8 (Ahli K3 Madya)","Teknik Mekanikal-Elektrikal — Level 6","Geoteknik & Pondasi — Level 7","Manajemen Mutu Konstruksi — Level 6"];
const JUMLAH_SOAL = ["10 soal (±5 menit)","20 soal (±10 menit)","30 soal (±15 menit)","40 soal (±20 menit)"];

export default function SimulatorUjianTeoriSKK() {
  const [step, setStep] = useState<"setup" | "loading" | "kerjakan" | "selesai">("setup");
  const [bidang, setBidang] = useState("");
  const [jumlahSoal, setJumlahSoal] = useState("20 soal (±10 menit)");
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [jawaban, setJawaban] = useState<JawabanUser[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const numSoal = parseInt(jumlahSoal.split(" ")[0]);

  async function startUjian() {
    if (!bidang) return;
    setStep("loading"); setLoading(true);
    try {
      const r = await fetch("/api/tools/simulator-ujian-teori-skk/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidang, jumlahSoal: numSoal }),
      });
      const d = await r.json();
      setSoalList(d.soal ?? []);
      setJawaban((d.soal ?? []).map((s: Soal) => ({ nomor: s.nomor, pilihan: null, benar: null })));
      setCurrentIdx(0);
      setStep("kerjakan");
    } catch { setStep("setup"); }
    setLoading(false);
  }

  function pilihJawaban(soalNomor: number, pilihan: string) {
    setJawaban(prev => prev.map(j => j.nomor === soalNomor ? { ...j, pilihan } : j));
  }

  function nextSoal() { if (currentIdx < soalList.length - 1) setCurrentIdx(currentIdx + 1); }
  function prevSoal() { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); }

  function selesaikanUjian() {
    const dinilai = jawaban.map(j => {
      const soal = soalList.find(s => s.nomor === j.nomor);
      return { ...j, benar: j.pilihan === soal?.kunciJawaban };
    });
    setJawaban(dinilai);
    setStep("selesai");
  }

  function reset() { setStep("setup"); setSoalList([]); setJawaban([]); setCurrentIdx(0); setShowReview(false); }

  const dijawab = jawaban.filter(j => j.pilihan !== null).length;
  const benar = jawaban.filter(j => j.benar === true).length;
  const skor = soalList.length > 0 ? Math.round((benar / soalList.length) * 100) : 0;
  const lulus = skor >= 70;
  const scoreColor = skor >= 80 ? "text-emerald-400" : skor >= 70 ? "text-amber-400" : "text-red-400";

  const currentSoal = soalList[currentIdx];
  const currentJawaban = jawaban.find(j => j.nomor === currentSoal?.nomor);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/kompetensi-hub"><button className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"><ChevronLeft className="h-4 w-4" />Kembali ke Hub</button></Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-violet-500/10"><BookOpen className="h-6 w-6 text-violet-400" /></div>
          <div><h1 className="text-2xl font-bold">Simulator Ujian Teori SKK</h1><p className="text-slate-400 text-sm">Latih soal pilihan ganda asesmen SKK — bidang, level, kunci & penjelasan per soal</p></div>
        </div>
        <div className="flex gap-2 mb-8"><Badge variant="outline" className="text-violet-400 border-violet-400/30">Gelombang 18</Badge><Badge variant="outline" className="text-slate-400 border-slate-600">GPT-4o-mini</Badge></div>

        {step === "setup" && (
          <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
            <div className="flex items-start gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">AI akan generate bank soal pilihan ganda (A/B/C/D) berdasarkan SKKNI dan materi asesmen SKK LPJK. Setelah selesai, lihat kunci jawaban dan penjelasan tiap soal.</p>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Bidang & Level SKK</Label>
              <Select value={bidang} onValueChange={setBidang}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Pilih bidang & level..." /></SelectTrigger>
                <SelectContent>{BIDANG.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-slate-300">Jumlah Soal</Label>
              <Select value={jumlahSoal} onValueChange={setJumlahSoal}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>{JUMLAH_SOAL.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={startUjian} disabled={!bidang} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              Mulai Ujian Teori SKK →
            </Button>
          </Card>
        )}

        {step === "loading" && (
          <Card className="bg-slate-900 border-slate-700 p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Menyiapkan {numSoal} soal untuk <strong className="text-white">{bidang}</strong>...</p>
            <p className="text-xs text-slate-500 mt-2">Ini mungkin memerlukan 10–20 detik</p>
          </Card>
        )}

        {step === "kerjakan" && currentSoal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Soal {currentIdx + 1}/{soalList.length}</span>
                <div className="w-40 h-2 bg-slate-700 rounded-full"><div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / soalList.length) * 100}%` }} /></div>
                <span className="text-xs text-slate-500">{dijawab} dijawab</span>
              </div>
              <Button size="sm" variant="outline" onClick={reset} className="border-slate-600 text-slate-300"><RotateCcw className="h-3 w-3 mr-1" />Ulang</Button>
            </div>

            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="text-xs text-violet-400 font-semibold mb-3">SOAL {currentSoal.nomor}</div>
              <p className="text-white font-medium leading-relaxed mb-5">{currentSoal.pertanyaan}</p>
              <div className="space-y-2">{currentSoal.pilihan.map((p, i) => {
                const huruf = ["A", "B", "C", "D"][i];
                const dipilih = currentJawaban?.pilihan === huruf;
                return (
                  <button key={i} onClick={() => pilihJawaban(currentSoal.nomor, huruf)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${dipilih ? "bg-violet-500/20 border-violet-500/50 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500/30"}`}>
                    <span className={`font-bold mr-2 ${dipilih ? "text-violet-400" : "text-slate-400"}`}>{huruf}.</span>{p}
                  </button>
                );
              })}</div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={prevSoal} disabled={currentIdx === 0} className="border-slate-600 text-slate-300">← Sebelumnya</Button>
              {currentIdx < soalList.length - 1
                ? <Button onClick={nextSoal} className="bg-violet-600 hover:bg-violet-700 flex-1">Selanjutnya →</Button>
                : <Button onClick={selesaikanUjian} disabled={dijawab < soalList.length} className="bg-emerald-600 hover:bg-emerald-700 flex-1">{dijawab < soalList.length ? `Jawab ${soalList.length - dijawab} soal lagi` : "Selesaikan & Lihat Nilai →"}</Button>
              }
            </div>

            <div className="grid grid-cols-10 gap-1">{soalList.map((s, i) => {
              const j = jawaban.find(jj => jj.nomor === s.nomor);
              return (
                <button key={i} onClick={() => setCurrentIdx(i)} className={`h-7 w-full rounded text-xs font-bold transition-colors ${i === currentIdx ? "bg-violet-600 text-white" : j?.pilihan ? "bg-violet-500/30 text-violet-300" : "bg-slate-800 text-slate-500 hover:bg-slate-700"}`}>{s.nomor}</button>
              );
            })}</div>
          </div>
        )}

        {step === "selesai" && (
          <div className="space-y-5">
            <Card className={`border p-8 text-center ${lulus ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
              <Trophy className={`h-12 w-12 mx-auto mb-3 ${lulus ? "text-amber-400" : "text-slate-500"}`} />
              <div className={`text-5xl font-bold mb-2 ${scoreColor}`}>{skor}</div>
              <div className="text-slate-400 mb-2">dari 100 poin</div>
              <div className={`text-lg font-semibold mb-4 ${lulus ? "text-emerald-400" : "text-red-400"}`}>{lulus ? "✓ LULUS" : "✗ TIDAK LULUS"}</div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div><div className="text-2xl font-bold text-emerald-400">{benar}</div><div className="text-xs text-slate-400">Benar</div></div>
                <div><div className="text-2xl font-bold text-red-400">{soalList.length - benar}</div><div className="text-xs text-slate-400">Salah</div></div>
                <div><div className="text-2xl font-bold text-blue-400">{soalList.length}</div><div className="text-xs text-slate-400">Total Soal</div></div>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={() => setShowReview(!showReview)} variant="outline" className="border-slate-600 text-slate-300">{showReview ? "Sembunyikan" : "Lihat"} Pembahasan</Button>
                <Button onClick={reset} className="bg-violet-600 hover:bg-violet-700">Coba Lagi</Button>
              </div>
            </Card>

            {showReview && soalList.map((s, i) => {
              const j = jawaban.find(jj => jj.nomor === s.nomor);
              const benarSoal = j?.benar;
              return (
                <Card key={i} className={`border p-5 ${benarSoal ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <div className="flex items-start gap-2 mb-3">
                    {benarSoal ? <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />}
                    <div><div className="text-xs text-slate-400 mb-1">Soal {s.nomor}</div><p className="text-sm text-white font-medium">{s.pertanyaan}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">{s.pilihan.map((p, pi) => {
                    const huruf = ["A", "B", "C", "D"][pi];
                    const isKunci = huruf === s.kunciJawaban;
                    const isDipilih = huruf === j?.pilihan;
                    return (
                      <div key={pi} className={`text-xs p-2 rounded border ${isKunci ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : isDipilih && !isKunci ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                        <span className="font-bold mr-1">{huruf}.</span>{p}
                        {isKunci && <span className="ml-1 text-emerald-400">✓</span>}
                        {isDipilih && !isKunci && <span className="ml-1 text-red-400">✗</span>}
                      </div>
                    );
                  })}</div>
                  <div className="bg-slate-800/60 rounded p-3 text-xs text-slate-300 mb-1"><strong className="text-white">Penjelasan:</strong> {s.penjelasan}</div>
                  <div className="text-xs text-slate-500">📖 {s.referensi}</div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
