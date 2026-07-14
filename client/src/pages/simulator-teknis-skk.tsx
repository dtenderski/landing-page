import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, GraduationCap, Send, RotateCcw, Bot, Star, Trophy } from "lucide-react";
import { Link } from "wouter";

const BIDANG_SKK = [
  "Manajemen Konstruksi / Pengawasan (MK)",
  "Pelaksana Bangunan Gedung",
  "Pelaksana Jalan & Jembatan",
  "Quantity Surveyor / Estimator Biaya",
  "Ahli K3 Konstruksi",
  "Ahli Struktur Beton",
  "Ahli Geoteknik / Pondasi",
  "Ahli Mekanikal Elektrikal Plumbing (MEP)",
  "Ahli Manajemen Proyek Konstruksi",
  "Ahli Lingkungan Konstruksi (AMDAL/UKL-UPL)",
  "Ahli Jalan (Perkerasan & Geometrik)",
  "Ahli Irigasi & Sumber Daya Air",
];

const JENJANG_SKK = [
  "SKK Jenjang 4 — Teknisi/Analis",
  "SKK Jenjang 5 — Teknisi Senior / Supervisor",
  "SKK Jenjang 6 — Ahli Muda",
  "SKK Jenjang 7 — Ahli Madya",
  "SKK Jenjang 8 — Ahli Utama",
  "SKK Jenjang 9 — Ahli Utama Senior",
];

type Fase = "setup" | "wawancara" | "selesai";

interface Giliran {
  pewawancara: string;
  peserta?: string;
  feedback?: { skor: number; feedback: string; poin: string };
}

interface HasilAkhir {
  nilaiTotal: number;
  predikat: string;
  ringkasan: string;
  kekuatan: string[];
  perluDiperkuat: string[];
  rekomendasi: string[];
}

const TOTAL_PERTANYAAN = 5;

export default function SimulatorTeknisKKK() {
  const [fase, setFase] = useState<Fase>("setup");
  const [bidang, setBidang] = useState(BIDANG_SKK[0]);
  const [jenjang, setJenjang] = useState(JENJANG_SKK[2]);
  const [loading, setLoading] = useState(false);
  const [giliran, setGiliran] = useState<Giliran[]>([]);
  const [inputPeserta, setInputPeserta] = useState("");
  const [nomorPertanyaan, setNomorPertanyaan] = useState(1);
  const [hasilAkhir, setHasilAkhir] = useState<HasilAkhir | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [giliran, fase]);

  async function mulaiWawancara() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-teknis-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", bidang, jenjang }),
      });
      const data = await res.json();
      setGiliran([{ pewawancara: data.intro }, { pewawancara: data.pertanyaan }]);
      setNomorPertanyaan(1);
      setHasilAkhir(null);
      setInputPeserta("");
      setFase("wawancara");
    } catch { /**/ } finally { setLoading(false); }
  }

  async function kirimJawaban() {
    if (!inputPeserta.trim()) return;
    const jawabanPeserta = inputPeserta.trim();
    setInputPeserta("");
    setLoading(true);
    const isLast = nomorPertanyaan >= TOTAL_PERTANYAAN;
    const newGiliran: Giliran[] = [...giliran, { pewawancara: giliran[giliran.length - 1].pewawancara, peserta: jawabanPeserta }];
    newGiliran[newGiliran.length - 1] = { ...newGiliran[newGiliran.length - 1], peserta: jawabanPeserta };
    setGiliran(newGiliran);
    try {
      const res = await fetch("/api/tools/simulator-teknis-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLast ? "finish" : "next",
          bidang, jenjang, nomorPertanyaan,
          pertanyaan: giliran[giliran.length - 1].pewawancara,
          jawaban: jawabanPeserta,
          totalPertanyaan: TOTAL_PERTANYAAN,
          riwayat: giliran.filter(g => g.peserta).map(g => ({ p: g.pewawancara, j: g.peserta })),
        }),
      });
      const data = await res.json();
      const updated = [...newGiliran];
      updated[updated.length - 1] = { ...updated[updated.length - 1], feedback: data.feedback };
      if (isLast) {
        setGiliran(updated);
        setHasilAkhir(data.hasilAkhir);
        setFase("selesai");
      } else {
        setGiliran([...updated, { pewawancara: data.pertanyaanBerikutnya }]);
        setNomorPertanyaan(n => n + 1);
      }
    } catch { /**/ } finally { setLoading(false); }
  }

  function reset() { setFase("setup"); setGiliran([]); setHasilAkhir(null); setInputPeserta(""); setNomorPertanyaan(1); }

  const predikatColor = (p: string) => p.includes("Sangat") || p.includes("Lulus") ? "text-green-400" : p.includes("Cukup") ? "text-yellow-400" : "text-red-400";

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
              <GraduationCap className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulator Wawancara Teknis SKK</h1>
              <p className="text-slate-400 text-sm">Simulasi uji wawancara teknis Sertifikasi Kompetensi Kerja (SKK) konstruksi oleh asesor BNSP</p>
            </div>
            <Badge className="ml-auto bg-violet-500/15 text-violet-400 border-violet-500/30">Gelombang 23</Badge>
          </div>
        </div>

        {fase === "setup" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Pilih Bidang & Jenjang SKK</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Bidang SKK</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={bidang} onChange={e => setBidang(e.target.value)}>
                  {BIDANG_SKK.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenjang SKK</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={jenjang} onChange={e => setJenjang(e.target.value)}>
                  {JENJANG_SKK.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-4 mb-5">
              <div className="text-violet-300 text-sm font-medium mb-2">📋 Format Simulasi</div>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• {TOTAL_PERTANYAAN} pertanyaan wawancara teknis dari asesor BNSP</li>
                <li>• Pertanyaan berbasis SKKNI & unit kompetensi SKK</li>
                <li>• Feedback & skor bintang per jawaban</li>
                <li>• Penilaian akhir: Kompeten / Belum Kompeten + rekomendasi</li>
              </ul>
            </div>
            <Button onClick={mulaiWawancara} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyiapkan wawancara...</> : <><Sparkles className="h-4 w-4 mr-2" /> Mulai Simulasi Wawancara</>}
            </Button>
          </div>
        )}

        {(fase === "wawancara" || fase === "selesai") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">{bidang.split("(")[0].trim()} · {jenjang.split("—")[0].trim()}</div>
              <div className="flex items-center gap-2">
                {fase === "wawancara" && <span className="text-slate-300 text-sm">Pertanyaan {nomorPertanyaan}/{TOTAL_PERTANYAAN}</span>}
                <Button onClick={reset} variant="ghost" size="sm" className="text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Ulang</Button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_PERTANYAAN }).map((_, i) => {
                const answered = giliran.filter(g => g.peserta);
                const g = answered[i];
                const skor = g?.feedback?.skor ?? 0;
                return (
                  <div key={i} className={`flex-1 h-2 rounded-full ${g ? skor >= 4 ? "bg-green-500" : skor >= 3 ? "bg-yellow-500" : "bg-red-500" : i === answered.length && fase === "wawancara" ? "bg-violet-500/50" : "bg-slate-700"}`} />
                );
              })}
            </div>

            <div className="space-y-4">
              {giliran[0] && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <div className="text-violet-300 text-xs font-medium mb-1">Asesor BNSP</div>
                    <p className="text-slate-200 text-sm leading-relaxed">{giliran[0].pewawancara}</p>
                  </div>
                </div>
              )}

              {giliran.slice(1).map((g, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                    <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                      <div className="text-violet-300 text-xs font-medium mb-1">Asesor — Pertanyaan {idx + 1}</div>
                      <p className="text-slate-200 text-sm leading-relaxed">{g.pewawancara}</p>
                    </div>
                  </div>
                  {g.peserta && (
                    <div className="flex gap-3 justify-end">
                      <div className="bg-violet-900/30 border border-violet-500/20 rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                        <div className="text-violet-400 text-xs font-medium mb-1">Peserta</div>
                        <p className="text-slate-200 text-sm leading-relaxed">{g.peserta}</p>
                      </div>
                    </div>
                  )}
                  {g.feedback && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < g.feedback!.skor ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />)}</div>
                          <span className={`text-xs font-medium ${g.feedback.skor >= 4 ? "text-green-400" : g.feedback.skor >= 3 ? "text-yellow-400" : "text-red-400"}`}>{g.feedback.skor}/5</span>
                        </div>
                        <p className="text-slate-300 text-xs mb-1">{g.feedback.feedback}</p>
                        {g.feedback.poin && <p className="text-violet-300 text-xs italic">💡 {g.feedback.poin}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {fase === "wawancara" && (
              <div className="space-y-2">
                <textarea rows={3} value={inputPeserta} onChange={e => setInputPeserta(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) kirimJawaban(); }}
                  placeholder="Ketik jawaban Anda di sini... (Ctrl+Enter untuk kirim)"
                  className="w-full bg-slate-800/80 border border-slate-600/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/60" />
                <Button onClick={kirimJawaban} disabled={loading || !inputPeserta.trim()} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {loading ? "Mengevaluasi..." : nomorPertanyaan >= TOTAL_PERTANYAAN ? "Kirim & Selesaikan" : "Kirim Jawaban"}
                </Button>
              </div>
            )}

            {fase === "selesai" && hasilAkhir && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="text-center mb-5">
                  <Trophy className={`h-12 w-12 mx-auto mb-2 ${hasilAkhir.nilaiTotal >= 70 ? "text-yellow-400" : "text-slate-400"}`} />
                  <div className="text-4xl font-bold text-white mb-1">{hasilAkhir.nilaiTotal}/100</div>
                  <div className={`text-xl font-bold ${predikatColor(hasilAkhir.predikat)}`}>{hasilAkhir.predikat}</div>
                </div>
                <p className="text-slate-300 text-sm text-center mb-5">{hasilAkhir.ringkasan}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3">
                    <div className="text-green-400 text-xs font-medium mb-2">Kekuatan</div>
                    <ul className="space-y-1">{hasilAkhir.kekuatan.map((k, i) => <li key={i} className="text-slate-300 text-xs">• {k}</li>)}</ul>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3">
                    <div className="text-orange-400 text-xs font-medium mb-2">Perlu Diperkuat</div>
                    <ul className="space-y-1">{hasilAkhir.perluDiperkuat.map((k, i) => <li key={i} className="text-slate-300 text-xs">• {k}</li>)}</ul>
                  </div>
                </div>
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-3 mb-4">
                  <div className="text-violet-300 text-xs font-medium mb-2">Rekomendasi</div>
                  <ul className="space-y-1">{hasilAkhir.rekomendasi.map((r, i) => <li key={i} className="text-slate-300 text-xs">• {r}</li>)}</ul>
                </div>
                <Button onClick={reset} className="w-full bg-violet-600 hover:bg-violet-700 text-white"><RotateCcw className="h-4 w-4 mr-2" /> Coba Lagi</Button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
