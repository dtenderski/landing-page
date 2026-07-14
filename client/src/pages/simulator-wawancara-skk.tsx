import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Mic, Send, RotateCcw,
  Bot, User, CheckCircle2, XCircle, AlertTriangle, Trophy,
  BarChart2, ChevronRight, Star
} from "lucide-react";
import { Link } from "wouter";

const JABATAN_SKK = [
  "Manajer Proyek (SKK Level 9)",
  "Manajer Konstruksi (SKK Level 8)",
  "Pengawas Pekerjaan Gedung (SKK Level 6)",
  "Pelaksana Lapangan Konstruksi Gedung (SKK Level 4-5)",
  "Pelaksana K3 Konstruksi (SKK Level 6)",
  "Manajer Mutu Konstruksi (SKK Level 7-8)",
  "Pengawas Struktur Jembatan (SKK Level 6)",
  "Pelaksana Jalan (SKK Level 4-5)",
  "Quantity Surveyor (SKK Level 7)",
  "Manajer BIM (SKK Level 8-9)",
  "Kepala Pengawas Geoteknik (SKK Level 7)",
  "Manajer Lingkungan Konstruksi (SKK Level 7)",
];

const FOKUS_TOPIK = [
  "Semua kompetensi (acak)",
  "Perencanaan & pengendalian proyek",
  "Kontrak konstruksi & klaim",
  "K3 & lingkungan hidup",
  "Manajemen mutu & QC",
  "Koordinasi & kepemimpinan tim",
  "Regulasi & standar teknis terbaru",
  "Studi kasus & problem solving lapangan",
];

type FaseSimulator = "setup" | "intro" | "questioning" | "selesai";

interface Pertanyaan {
  nomor: number;
  pertanyaan: string;
  konteks: string;
  unitKompetensi: string;
}

interface EvaluasiJawaban {
  skor: number;
  predikat: string;
  kelebihan: string;
  kekurangan: string;
  jawabanIdeal: string;
  referensi: string;
}

interface HasilAkhir {
  totalSkor: number;
  predikat: "Kompeten" | "Kompeten Bersyarat" | "Belum Kompeten";
  ringkasan: string;
  rekomendasiPengembangan: string[];
  unitKompetensiKuat: string[];
  unitKompetensiPerluPerbaikan: string[];
}

interface TurnData {
  pertanyaan: Pertanyaan;
  jawaban: string;
  evaluasi: EvaluasiJawaban;
}

export default function SimulatorWawancaraSKK() {
  const [fase, setFase] = useState<FaseSimulator>("setup");
  const [jabatan, setJabatan] = useState(JABATAN_SKK[0]);
  const [fokus, setFokus] = useState(FOKUS_TOPIK[0]);
  const [loading, setLoading] = useState(false);
  const [pertanyaanSaatIni, setPertanyaanSaatIni] = useState<Pertanyaan | null>(null);
  const [jawaban, setJawaban] = useState("");
  const [turns, setTurns] = useState<TurnData[]>([]);
  const [nomorSoal, setNomorSoal] = useState(1);
  const [hasilAkhir, setHasilAkhir] = useState<HasilAkhir | null>(null);
  const [intro, setIntro] = useState("");
  const totalSoal = 5;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, pertanyaanSaatIni, hasilAkhir]);

  async function mulaiSimulasi() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/wawancara-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", jabatan, fokus, totalSoal }),
      });
      const data = await res.json();
      setIntro(data.intro);
      setPertanyaanSaatIni(data.pertanyaan);
      setNomorSoal(1);
      setTurns([]);
      setHasilAkhir(null);
      setFase("intro");
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  function lanjutDariIntro() {
    setFase("questioning");
  }

  async function kirimJawaban() {
    if (!jawaban.trim() || !pertanyaanSaatIni) return;
    setLoading(true);
    const jawabanUser = jawaban;
    setJawaban("");
    try {
      const res = await fetch("/api/tools/wawancara-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: nomorSoal >= totalSoal ? "finish" : "answer",
          jabatan,
          fokus,
          totalSoal,
          nomorSoal,
          pertanyaan: pertanyaanSaatIni,
          jawaban: jawabanUser,
          riwayat: turns.map(t => ({ nomor: t.pertanyaan.nomor, pertanyaan: t.pertanyaan.pertanyaan, jawaban: t.jawaban, skor: t.evaluasi.skor })),
        }),
      });
      const data = await res.json();
      const newTurn: TurnData = {
        pertanyaan: pertanyaanSaatIni,
        jawaban: jawabanUser,
        evaluasi: data.evaluasi,
      };
      const newTurns = [...turns, newTurn];
      setTurns(newTurns);
      if (nomorSoal >= totalSoal) {
        setHasilAkhir(data.hasilAkhir);
        setPertanyaanSaatIni(null);
        setFase("selesai");
      } else {
        setPertanyaanSaatIni(data.pertanyaanBerikutnya);
        setNomorSoal(n => n + 1);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFase("setup");
    setTurns([]);
    setPertanyaanSaatIni(null);
    setHasilAkhir(null);
    setJawaban("");
    setNomorSoal(1);
    setIntro("");
  }

  const predikatColor = (p: string) => {
    if (p.includes("Kompeten Bersyarat")) return "text-yellow-400";
    if (p.includes("Belum")) return "text-red-400";
    return "text-green-400";
  };

  const skorColor = (s: number) => {
    if (s >= 3.5) return "text-green-400";
    if (s >= 2.5) return "text-yellow-400";
    if (s >= 1.5) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Mic className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulator Wawancara SKK</h1>
              <p className="text-slate-400 text-sm">Simulasi uji wawancara asesmen SKK — {totalSoal} pertanyaan kompetensi, feedback real-time</p>
            </div>
            <Badge className="ml-auto bg-violet-500/15 text-violet-400 border-violet-500/30">Gelombang 20</Badge>
          </div>
        </div>

        {fase === "setup" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Pilih Jabatan & Fokus Uji</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jabatan SKK yang Diuji</label>
                <select
                  className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={jabatan}
                  onChange={e => setJabatan(e.target.value)}
                >
                  {JABATAN_SKK.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Fokus Topik Uji</label>
                <select
                  className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={fokus}
                  onChange={e => setFokus(e.target.value)}
                >
                  {FOKUS_TOPIK.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-4 mb-5">
              <div className="text-violet-300 text-sm font-medium mb-2">📋 Cara Simulasi</div>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• AI akan bertindak sebagai assesor SKK berlisensi BNSP</li>
                <li>• {totalSoal} pertanyaan situasional berdasarkan SKKNI dan standar LPJK</li>
                <li>• Setiap jawaban dinilai 1–4 dengan feedback + jawaban ideal</li>
                <li>• Predikat akhir: Kompeten / Kompeten Bersyarat / Belum Kompeten</li>
              </ul>
            </div>
            <Button
              onClick={mulaiSimulasi}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3"
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyiapkan...</> : <><Sparkles className="h-4 w-4 mr-2" /> Mulai Simulasi Wawancara</>}
            </Button>
          </div>
        )}

        {fase === "intro" && intro && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{intro}</p>
              </div>
            </div>
            <Button onClick={lanjutDariIntro} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              <ChevronRight className="h-4 w-4 mr-2" /> Siap — Mulai Wawancara
            </Button>
          </div>
        )}

        {(fase === "questioning" || fase === "selesai") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">{jabatan}</div>
              <div className="flex items-center gap-2">
                {fase !== "selesai" && (
                  <span className="text-slate-300 text-sm">
                    Soal {Math.min(nomorSoal, totalSoal)}/{totalSoal}
                  </span>
                )}
                <Button onClick={reset} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Ulang
                </Button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-500">Progress</div>
                <div className="text-xs text-violet-400">{turns.length}/{totalSoal} selesai</div>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: totalSoal }).map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${
                    i < turns.length
                      ? turns[i].evaluasi.skor >= 3 ? "bg-green-500" : turns[i].evaluasi.skor >= 2 ? "bg-yellow-500" : "bg-red-500"
                      : i === turns.length && fase === "questioning" ? "bg-violet-500/50" : "bg-slate-700"
                  }`} />
                ))}
              </div>
            </div>

            {turns.map((turn, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 mb-1">
                      <div className="text-xs text-violet-300 mb-1 font-medium">Pertanyaan {turn.pertanyaan.nomor} · {turn.pertanyaan.unitKompetensi}</div>
                      <p className="text-slate-200 text-sm leading-relaxed">{turn.pertanyaan.pertanyaan}</p>
                      {turn.pertanyaan.konteks && (
                        <p className="text-slate-400 text-xs mt-1 italic">{turn.pertanyaan.konteks}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-lg">
                    <div className="bg-violet-900/30 border border-violet-500/20 rounded-xl rounded-tr-sm px-4 py-3">
                      <p className="text-slate-200 text-sm leading-relaxed">{turn.jawaban}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold text-lg ${skorColor(turn.evaluasi.skor)}`}>{turn.evaluasi.skor}/4</span>
                      <span className={`text-sm font-medium ${skorColor(turn.evaluasi.skor)}`}>{turn.evaluasi.predikat}</span>
                      <div className="flex gap-0.5 ml-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.round(turn.evaluasi.skor) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                        ))}
                      </div>
                    </div>
                    {turn.evaluasi.kelebihan && (
                      <div className="text-green-400 text-xs mb-1">✓ {turn.evaluasi.kelebihan}</div>
                    )}
                    {turn.evaluasi.kekurangan && (
                      <div className="text-orange-400 text-xs mb-2">⚠ {turn.evaluasi.kekurangan}</div>
                    )}
                    <div className="bg-slate-700/40 rounded p-2 mt-2">
                      <div className="text-xs text-slate-400 mb-1">Jawaban ideal:</div>
                      <p className="text-slate-300 text-xs leading-relaxed">{turn.evaluasi.jawabanIdeal}</p>
                      {turn.evaluasi.referensi && (
                        <p className="text-slate-500 text-xs mt-1">📑 {turn.evaluasi.referensi}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {fase === "questioning" && pertanyaanSaatIni && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <div className="text-xs text-violet-300 mb-1 font-medium">Pertanyaan {pertanyaanSaatIni.nomor} · {pertanyaanSaatIni.unitKompetensi}</div>
                    <p className="text-slate-200 text-sm leading-relaxed">{pertanyaanSaatIni.pertanyaan}</p>
                    {pertanyaanSaatIni.konteks && (
                      <p className="text-slate-400 text-xs mt-1 italic">{pertanyaanSaatIni.konteks}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    className="flex-1 bg-slate-800/80 border border-slate-600/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 resize-none text-sm"
                    placeholder="Ketik jawaban Anda di sini..."
                    value={jawaban}
                    onChange={e => setJawaban(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) kirimJawaban(); }}
                    disabled={loading}
                  />
                  <Button
                    onClick={kirimJawaban}
                    disabled={loading || !jawaban.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white self-end px-4 py-2.5"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-slate-600 text-xs">Ctrl+Enter untuk kirim</p>
              </div>
            )}

            {fase === "selesai" && hasilAkhir && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="text-center mb-5">
                  <Trophy className={`h-12 w-12 mx-auto mb-2 ${hasilAkhir.predikat === "Kompeten" ? "text-yellow-400" : hasilAkhir.predikat === "Kompeten Bersyarat" ? "text-orange-400" : "text-slate-500"}`} />
                  <div className="text-4xl font-bold text-white mb-1">{hasilAkhir.totalSkor.toFixed(1)}/4.0</div>
                  <div className={`text-xl font-bold ${predikatColor(hasilAkhir.predikat)}`}>{hasilAkhir.predikat}</div>
                </div>
                <p className="text-slate-300 text-sm text-center mb-5 leading-relaxed">{hasilAkhir.ringkasan}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3">
                    <div className="text-green-400 text-xs font-medium mb-2">Unit Kompetensi Kuat</div>
                    <ul className="space-y-1">{hasilAkhir.unitKompetensiKuat.map((u, i) => <li key={i} className="text-slate-300 text-xs">• {u}</li>)}</ul>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3">
                    <div className="text-orange-400 text-xs font-medium mb-2">Perlu Ditingkatkan</div>
                    <ul className="space-y-1">{hasilAkhir.unitKompetensiPerluPerbaikan.map((u, i) => <li key={i} className="text-slate-300 text-xs">• {u}</li>)}</ul>
                  </div>
                </div>
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-3 mb-4">
                  <div className="text-violet-300 text-xs font-medium mb-2">Rekomendasi Pengembangan</div>
                  <ul className="space-y-1">{hasilAkhir.rekomendasiPengembangan.map((r, i) => <li key={i} className="text-slate-300 text-xs">• {r}</li>)}</ul>
                </div>
                <Button onClick={reset} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  <RotateCcw className="h-4 w-4 mr-2" /> Coba Lagi
                </Button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
