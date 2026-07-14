import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, HardHat, Send, RotateCcw,
  Bot, User, Star, Trophy, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

const TOPIK_K3 = [
  "Peraturan K3 Konstruksi (Permenaker & PP 50/2012)",
  "Manajemen Risiko & HIRADC di Proyek Konstruksi",
  "Working at Height & Fall Protection",
  "Confined Space Entry & Izin Masuk",
  "Hot Work & LOTO (Lock Out Tag Out)",
  "Alat Pelindung Diri (APD) Konstruksi",
  "Keselamatan Penggunaan Alat Berat",
  "Pengelolaan Limbah B3 di Proyek",
  "Penanganan Material Berbahaya",
  "Investigasi Kecelakaan Kerja (P2K3)",
  "Emergency Response Plan & Evakuasi",
  "K3 Pekerjaan Listrik & Instalasi",
];

const LEVEL_KOMPETENSI = [
  "Pemula — Pekerja/Operator",
  "Menengah — Foreman/Mandor",
  "Mahir — Supervisor/Pelaksana K3",
  "Expert — Ahli K3 Konstruksi/HSE Manager",
];

type Fase = "setup" | "soal" | "selesai";

interface EvaluasiSoal {
  benar: boolean;
  skor: number;
  penjelasan: string;
  referensi: string;
  jawabanBenar: string;
}

interface TurnData {
  soal: string;
  opsiJawaban: string[];
  jawabanUser: string;
  evaluasi: EvaluasiSoal;
}

interface HasilAkhir {
  skor: number;
  totalBenar: number;
  predikat: string;
  ringkasan: string;
  topikLemah: string[];
  rekomendasiPelatihan: string[];
}

const TOTAL_SOAL = 5;

export default function SimulatorK3Konstruksi() {
  const [fase, setFase] = useState<Fase>("setup");
  const [topik, setTopik] = useState(TOPIK_K3[0]);
  const [level, setLevel] = useState(LEVEL_KOMPETENSI[1]);
  const [loading, setLoading] = useState(false);
  const [intro, setIntro] = useState("");
  const [soalSaatIni, setSoalSaatIni] = useState("");
  const [opsiJawaban, setOpsiJawaban] = useState<string[]>([]);
  const [turns, setTurns] = useState<TurnData[]>([]);
  const [nomorSoal, setNomorSoal] = useState(1);
  const [hasilAkhir, setHasilAkhir] = useState<HasilAkhir | null>(null);
  const [jawabanPilihan, setJawabanPilihan] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, soalSaatIni, hasilAkhir]);

  async function mulai() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-k3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", topik, level, totalSoal: TOTAL_SOAL }),
      });
      const data = await res.json();
      setIntro(data.intro);
      setSoalSaatIni(data.soal);
      setOpsiJawaban(data.opsiJawaban || []);
      setNomorSoal(1);
      setTurns([]);
      setHasilAkhir(null);
      setJawabanPilihan("");
      setFase("soal");
    } catch { /**/ } finally { setLoading(false); }
  }

  async function kirimJawaban() {
    if (!jawabanPilihan) return;
    setLoading(true);
    const jawabanUser = jawabanPilihan;
    setJawabanPilihan("");
    const isLast = nomorSoal >= TOTAL_SOAL;
    try {
      const res = await fetch("/api/tools/simulator-k3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLast ? "finish" : "answer",
          topik, level, totalSoal: TOTAL_SOAL, nomorSoal,
          soal: soalSaatIni, jawaban: jawabanUser, opsiJawaban,
          riwayat: turns.map(t => ({ soal: t.soal, jawaban: t.jawabanUser, benar: t.evaluasi.benar })),
        }),
      });
      const data = await res.json();
      const newTurn: TurnData = { soal: soalSaatIni, opsiJawaban, jawabanUser, evaluasi: data.evaluasi };
      setTurns(prev => [...prev, newTurn]);
      if (isLast) {
        setHasilAkhir(data.hasilAkhir);
        setFase("selesai");
      } else {
        setSoalSaatIni(data.soalBerikutnya);
        setOpsiJawaban(data.opsiBerikutnya || []);
        setNomorSoal(n => n + 1);
      }
    } catch { /**/ } finally { setLoading(false); }
  }

  function reset() { setFase("setup"); setTurns([]); setSoalSaatIni(""); setHasilAkhir(null); setJawabanPilihan(""); setNomorSoal(1); }

  const OPSI_LABEL = ["A", "B", "C", "D"];
  const predikatColor = (p: string) => p.includes("Sangat") || p.includes("Excellent") ? "text-green-400" : p.includes("Baik") ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <HardHat className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulator Uji K3 Konstruksi</h1>
              <p className="text-slate-400 text-sm">Quiz teori K3 konstruksi berbasis Permenaker, PP 50/2012, dan standar internasional OHSAS/ISO 45001</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 22</Badge>
          </div>
        </div>

        {fase === "setup" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Pilih Topik & Level</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Topik K3</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={topik} onChange={e => setTopik(e.target.value)}>
                  {TOPIK_K3.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Level Kompetensi</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={level} onChange={e => setLevel(e.target.value)}>
                  {LEVEL_KOMPETENSI.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-4 mb-5">
              <div className="text-orange-300 text-sm font-medium mb-2">📋 Format Quiz</div>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• {TOTAL_SOAL} soal pilihan ganda (A/B/C/D)</li>
                <li>• Soal berbasis kasus nyata di lapangan</li>
                <li>• Penjelasan lengkap + referensi regulasi per soal</li>
                <li>• Predikat akhir + rekomendasi pelatihan lanjutan</li>
              </ul>
            </div>
            <Button onClick={mulai} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyiapkan soal...</> : <><Sparkles className="h-4 w-4 mr-2" /> Mulai Quiz K3</>}
            </Button>
          </div>
        )}

        {(fase === "soal" || fase === "selesai") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">{topik.split("(")[0].trim()}</div>
              <div className="flex items-center gap-2">
                {fase === "soal" && <span className="text-slate-300 text-sm">Soal {nomorSoal}/{TOTAL_SOAL}</span>}
                <Button onClick={reset} variant="ghost" size="sm" className="text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Ulang</Button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_SOAL }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${
                  i < turns.length ? (turns[i].evaluasi.benar ? "bg-green-500" : "bg-red-500")
                  : i === turns.length && fase === "soal" ? "bg-orange-500/50" : "bg-slate-700"
                }`} />
              ))}
            </div>

            {intro && turns.length === 0 && (
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-slate-300 text-sm leading-relaxed">{intro}</p>
              </div>
            )}

            {turns.map((turn, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">{idx + 1}</div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <p className="text-slate-200 text-sm leading-relaxed mb-2">{turn.soal}</p>
                    <div className="space-y-1">
                      {turn.opsiJawaban.map((opsi, i) => (
                        <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${turn.jawabanUser === OPSI_LABEL[i]
                          ? turn.evaluasi.benar ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                          : turn.evaluasi.jawabanBenar === OPSI_LABEL[i] && !turn.evaluasi.benar ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-slate-700/40 text-slate-400"}`}>
                          <span className="font-bold mr-1">{OPSI_LABEL[i]}.</span> {opsi}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold ${turn.evaluasi.benar ? "text-green-400" : "text-red-400"}`}>
                        {turn.evaluasi.benar ? "✓ BENAR" : "✗ SALAH"}
                      </span>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < turn.evaluasi.skor ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />)}</div>
                    </div>
                    <p className="text-slate-300 text-xs mb-1">{turn.evaluasi.penjelasan}</p>
                    {turn.evaluasi.referensi && <p className="text-slate-500 text-xs">📑 {turn.evaluasi.referensi}</p>}
                  </div>
                </div>
              </div>
            ))}

            {fase === "soal" && soalSaatIni && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">{nomorSoal}</div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <p className="text-slate-200 text-sm leading-relaxed mb-3">{soalSaatIni}</p>
                    <div className="space-y-2">
                      {opsiJawaban.map((opsi, i) => (
                        <button key={i} onClick={() => setJawabanPilihan(OPSI_LABEL[i])}
                          disabled={loading}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${jawabanPilihan === OPSI_LABEL[i]
                            ? "bg-orange-600/30 border-2 border-orange-500 text-orange-100"
                            : "bg-slate-700/40 border border-slate-600/50 text-slate-300 hover:bg-slate-700/70"}`}>
                          <span className="font-bold mr-2">{OPSI_LABEL[i]}.</span> {opsi}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={kirimJawaban} disabled={loading || !jawabanPilihan} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {loading ? "Menilai..." : nomorSoal >= TOTAL_SOAL ? "Kirim & Lihat Hasil" : "Kirim Jawaban"}
                </Button>
              </div>
            )}

            {fase === "selesai" && hasilAkhir && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="text-center mb-5">
                  <Trophy className={`h-12 w-12 mx-auto mb-2 ${hasilAkhir.predikat.includes("Sangat") || hasilAkhir.predikat.includes("Excellent") ? "text-yellow-400" : "text-slate-400"}`} />
                  <div className="text-4xl font-bold text-white mb-1">{hasilAkhir.totalBenar}/{TOTAL_SOAL}</div>
                  <div className="text-slate-400 text-sm mb-1">Skor: {hasilAkhir.skor}/100</div>
                  <div className={`text-xl font-bold ${predikatColor(hasilAkhir.predikat)}`}>{hasilAkhir.predikat}</div>
                </div>
                <p className="text-slate-300 text-sm text-center mb-5">{hasilAkhir.ringkasan}</p>
                {hasilAkhir.topikLemah.length > 0 && (
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3 mb-3">
                    <div className="text-orange-400 text-xs font-medium mb-2">Topik Perlu Diperdalam</div>
                    <ul className="space-y-1">{hasilAkhir.topikLemah.map((t, i) => <li key={i} className="text-slate-300 text-xs">• {t}</li>)}</ul>
                  </div>
                )}
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <div className="text-blue-300 text-xs font-medium mb-2">Rekomendasi Pelatihan</div>
                  <ul className="space-y-1">{hasilAkhir.rekomendasiPelatihan.map((r, i) => <li key={i} className="text-slate-300 text-xs">• {r}</li>)}</ul>
                </div>
                <Button onClick={reset} className="w-full bg-orange-600 hover:bg-orange-700 text-white"><RotateCcw className="h-4 w-4 mr-2" /> Coba Lagi</Button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
