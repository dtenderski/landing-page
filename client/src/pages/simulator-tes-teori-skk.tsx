import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Brain, RefreshCw, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const JABATAN_SKK = [
  "Tukang Batu / Mason (SKK Operator-1)",
  "Tukang Besi Beton / Bar Bender (SKK Operator-1)",
  "Tukang Las SMAW / Welder (SKK Operator-1)",
  "Tukang Bekisting / Formwork Carpenter (SKK Operator-1)",
  "Operator Alat Berat Excavator (SKK Operator-2)",
  "Operator Tower Crane (SKK Operator-2)",
  "Mandor Pekerjaan Beton (SKK Teknisi-3)",
  "Mandor Pekerjaan Pasangan & Finishing (SKK Teknisi-3)",
  "Pelaksana Lapangan Gedung Muda (SKK Teknisi-4)",
  "Pelaksana Lapangan Jalan Muda (SKK Teknisi-4)",
  "Ahli Muda Teknik Bangunan Gedung (SKK Ahli-6)",
  "Ahli Muda Manajemen Konstruksi (SKK Ahli-6)",
  "Ahli Muda K3 Konstruksi (SKK Ahli-6)",
  "Ahli Madya Manajemen Proyek (SKK Ahli-7)",
  "Ahli Utama Teknik Sipil (SKK Ahli-9)",
  "Pengawas Pekerjaan Beton Muda (SKK Teknisi-5)",
];

const TOPIK_MATERI = [
  "Semua topik (campuran)",
  "Gambar Teknik & Shop Drawing",
  "Beton & Material Konstruksi",
  "Keselamatan Kerja (K3) Konstruksi",
  "Metode Pelaksanaan & Teknik",
  "Kontrak & Administrasi Proyek",
  "Alat Berat & Peralatan",
  "Peraturan & Standar (SNI/Perlem)",
];

interface Soal {
  nomor: number;
  pertanyaan: string;
  pilihan: { a: string; b: string; c: string; d: string };
  kunciJawaban: "a" | "b" | "c" | "d";
  penjelasan: string;
  topik: string;
  tingkatKesulitan: string;
}

interface JawabanUser {
  soalNomor: number;
  jawaban: "a" | "b" | "c" | "d" | null;
  benar: boolean;
}

export default function SimulatorTesToriSKK() {
  const [jabatan, setJabatan] = useState(JABATAN_SKK[10]);
  const [topik, setTopik] = useState(TOPIK_MATERI[0]);
  const [jumlahSoal, setJumlahSoal] = useState(10);
  const [step, setStep] = useState<"setup" | "tes" | "hasil">("setup");
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [jawabanUser, setJawabanUser] = useState<JawabanUser[]>([]);
  const [currentSoal, setCurrentSoal] = useState(0);
  const [selectedJawaban, setSelectedJawaban] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [showKunci, setShowKunci] = useState(false);
  const [loading, setLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentSoal]);

  async function mulaiTes() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-tes-teori-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, topik, jumlahSoal }),
      });
      const data = await res.json();
      setSoalList(data.soalList);
      setJawabanUser([]);
      setCurrentSoal(0);
      setSelectedJawaban(null);
      setShowKunci(false);
      setStep("tes");
    } catch { } finally { setLoading(false); }
  }

  function konfirmasi() {
    if (selectedJawaban === null) return;
    const soal = soalList[currentSoal];
    const benar = selectedJawaban === soal.kunciJawaban;
    setJawabanUser(prev => [...prev, { soalNomor: soal.nomor, jawaban: selectedJawaban, benar }]);
    setShowKunci(true);
  }

  function lanjut() {
    if (currentSoal + 1 >= soalList.length) { setStep("hasil"); return; }
    setCurrentSoal(prev => prev + 1);
    setSelectedJawaban(null);
    setShowKunci(false);
  }

  function reset() { setStep("setup"); setSoalList([]); setJawabanUser([]); setCurrentSoal(0); setSelectedJawaban(null); setShowKunci(false); }

  const soal = soalList[currentSoal];
  const nilaiBenar = jawabanUser.filter(j => j.benar).length;
  const nilaiAkhir = soalList.length > 0 ? Math.round((nilaiBenar / soalList.length) * 100) : 0;
  const LULUS_MIN = 60;
  const status = nilaiAkhir >= LULUS_MIN ? "LULUS" : "BELUM LULUS";
  const pilNamaMap: Record<string, string> = { a: "A", b: "B", c: "C", d: "D" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950/20 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8" ref={topRef}>
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20"><Brain className="h-6 w-6 text-sky-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulator Tes Teori SKK Konstruksi</h1>
              <p className="text-slate-400 text-sm">Latihan soal ujian teori SKK per jabatan kerja — pilihan ganda + pembahasan jawaban</p>
            </div>
            <Badge className="ml-auto bg-sky-500/15 text-sky-400 border-sky-500/30">Gelombang 26</Badge>
          </div>
        </div>

        {step === "setup" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jabatan Kerja SKK *</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jabatan} onChange={e => setJabatan(e.target.value)}>
                  {JABATAN_SKK.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Topik Materi</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={topik} onChange={e => setTopik(e.target.value)}>
                  {TOPIK_MATERI.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jumlah Soal</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jumlahSoal} onChange={e => setJumlahSoal(Number(e.target.value))}>
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} soal</option>)}
                </select>
              </div>
            </div>
            <Button onClick={mulaiTes} disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat soal ujian...</> : <><Brain className="h-4 w-4 mr-2" /> Mulai Tes Teori SKK</>}
            </Button>
          </div>
        )}

        {step === "tes" && soal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge className="bg-sky-600/20 text-sky-300 border-sky-500/30">Soal {currentSoal + 1} / {soalList.length}</Badge>
                <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/30 text-xs">{soal.topik}</Badge>
                <Badge className={`text-xs ${soal.tingkatKesulitan === "Mudah" ? "bg-green-900/30 text-green-300 border-green-500/30" : soal.tingkatKesulitan === "Sedang" ? "bg-yellow-900/30 text-yellow-300 border-yellow-500/30" : "bg-red-900/30 text-red-300 border-red-500/30"}`}>{soal.tingkatKesulitan}</Badge>
              </div>
              <Button onClick={reset} variant="outline" size="sm" className="text-xs h-7 gap-1 border-slate-600 text-slate-400"><RefreshCw className="h-3 w-3" /> Reset</Button>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <p className="text-white text-sm font-medium leading-relaxed mb-5">{soal.pertanyaan}</p>
              <div className="space-y-2">
                {(["a", "b", "c", "d"] as const).map(pil => {
                  let cls = "bg-slate-800/60 border-slate-700/40 text-slate-300 hover:border-sky-500/50 hover:bg-slate-700/60";
                  if (showKunci) {
                    if (pil === soal.kunciJawaban) cls = "bg-green-900/30 border-green-500/40 text-green-200";
                    else if (pil === selectedJawaban && pil !== soal.kunciJawaban) cls = "bg-red-900/30 border-red-500/40 text-red-200";
                    else cls = "bg-slate-800/40 border-slate-700/30 text-slate-400";
                  } else if (selectedJawaban === pil) {
                    cls = "bg-sky-900/30 border-sky-500/50 text-sky-200";
                  }
                  return (
                    <button key={pil} disabled={showKunci} onClick={() => setSelectedJawaban(pil)} className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-all ${cls}`}>
                      <span className="font-bold mr-2">{pilNamaMap[pil]}.</span>{soal.pilihan[pil]}
                    </button>
                  );
                })}
              </div>

              {!showKunci && (
                <Button onClick={konfirmasi} disabled={!selectedJawaban} className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white">Konfirmasi Jawaban</Button>
              )}

              {showKunci && (
                <div className="mt-4 space-y-3">
                  <div className={`rounded-lg p-3 ${selectedJawaban === soal.kunciJawaban ? "bg-green-900/20 border border-green-500/30" : "bg-red-900/20 border border-red-500/30"}`}>
                    <div className={`flex items-center gap-2 font-medium text-sm mb-1 ${selectedJawaban === soal.kunciJawaban ? "text-green-300" : "text-red-300"}`}>
                      {selectedJawaban === soal.kunciJawaban ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {selectedJawaban === soal.kunciJawaban ? "Benar!" : `Salah. Jawaban benar: ${pilNamaMap[soal.kunciJawaban]}`}
                    </div>
                    <p className="text-slate-300 text-xs">{soal.penjelasan}</p>
                  </div>
                  <Button onClick={lanjut} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
                    {currentSoal + 1 >= soalList.length ? "Lihat Hasil Akhir" : <><ChevronRight className="h-4 w-4 mr-1" /> Soal Berikutnya</>}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-1 flex-wrap">
              {soalList.map((_, i) => {
                const jaw = jawabanUser.find(j => j.soalNomor === i + 1);
                return (
                  <div key={i} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${i === currentSoal ? "bg-sky-600 text-white" : jaw ? (jaw.benar ? "bg-green-700 text-white" : "bg-red-700 text-white") : "bg-slate-700 text-slate-400"}`}>{i + 1}</div>
                );
              })}
            </div>
          </div>
        )}

        {step === "hasil" && (
          <div className="space-y-4">
            <div className={`rounded-xl p-6 border text-center ${nilaiAkhir >= LULUS_MIN ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"}`}>
              <div className={`text-5xl font-bold mb-2 ${nilaiAkhir >= LULUS_MIN ? "text-green-300" : "text-red-300"}`}>{nilaiAkhir}</div>
              <div className={`text-xl font-bold mb-1 ${nilaiAkhir >= LULUS_MIN ? "text-green-200" : "text-red-200"}`}>{status}</div>
              <div className="text-slate-300 text-sm">{nilaiBenar} benar dari {soalList.length} soal · Batas lulus {LULUS_MIN}</div>
              <div className="text-slate-400 text-xs mt-1">{jabatan}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-900/20 rounded-lg p-3 text-center"><div className="text-green-300 text-xl font-bold">{nilaiBenar}</div><div className="text-xs text-slate-400">Benar</div></div>
              <div className="bg-red-900/20 rounded-lg p-3 text-center"><div className="text-red-300 text-xl font-bold">{soalList.length - nilaiBenar}</div><div className="text-xs text-slate-400">Salah</div></div>
              <div className="bg-sky-900/20 rounded-lg p-3 text-center"><div className="text-sky-300 text-xl font-bold">{soalList.length}</div><div className="text-xs text-slate-400">Total Soal</div></div>
            </div>
            <div className="space-y-2">
              {soalList.map((s, i) => {
                const jaw = jawabanUser.find(j => j.soalNomor === s.nomor);
                return (
                  <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      {jaw?.benar ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-slate-200 text-xs font-medium">{s.pertanyaan}</p>
                        <div className="text-xs mt-0.5">
                          <span className="text-slate-500">Jawaban Anda: </span>
                          <span className={jaw?.benar ? "text-green-400" : "text-red-400"}>{jaw?.jawaban ? pilNamaMap[jaw.jawaban] : "—"}. {jaw?.jawaban ? s.pilihan[jaw.jawaban] : ""}</span>
                        </div>
                        {!jaw?.benar && <div className="text-xs text-green-400 mt-0.5">Benar: {pilNamaMap[s.kunciJawaban]}. {s.pilihan[s.kunciJawaban]}</div>}
                        <p className="text-slate-500 text-xs mt-0.5">{s.penjelasan}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={reset} className="w-full bg-sky-600 hover:bg-sky-700 text-white"><RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi / Jabatan Lain</Button>
          </div>
        )}
      </div>
    </div>
  );
}
