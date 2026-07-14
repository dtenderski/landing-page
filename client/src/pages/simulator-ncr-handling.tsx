import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, AlertOctagon, Send, RotateCcw,
  Bot, User, CheckCircle2, Star, Trophy, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

const JENIS_TEMUAN = [
  "NCR Major ISO 9001 — Ketidaksesuaian Sistem Mutu",
  "NCR Minor ISO 9001 — Peluang Perbaikan Prosedur",
  "NCR Major ISO 14001 — Ketidaksesuaian Lingkungan",
  "NCR Major ISO 45001 / SMK3 — Ketidaksesuaian K3",
  "OFI (Opportunity for Improvement) — Pengembangan Sistem",
  "Temuan Audit CSMS Level 3 — Elemen Kritis",
  "Temuan Audit Internal Proyek — QC & Mutu Pekerjaan",
  "NCR dari Pengawas / MK Owner",
  "Temuan Inspeksi Pihak Ketiga / Badan Sertifikasi",
];

const STANDAR_ACUAN = [
  "ISO 9001:2015 — SMM",
  "ISO 14001:2015 — SML",
  "ISO 45001:2018 / SMK3",
  "CSMS Pertamina/SKK Migas",
  "Spesifikasi Teknis Kontrak",
  "Standar Internal Perusahaan",
];

type FaseSimulator = "setup" | "intro" | "questioning" | "selesai";

interface Skenario {
  judulNCR: string;
  deskripsiTemuan: string;
  klausulAcuan: string;
  buktiObjektif: string[];
  tingkatKeparahan: string;
}

interface EvaluasiJawaban {
  skor: number;
  aspekBaik: string;
  aspekKurang: string;
  jawabanIdeal: string;
  referensi: string;
}

interface TurnData {
  pertanyaan: string;
  konteks: string;
  jawaban: string;
  evaluasi: EvaluasiJawaban;
}

interface HasilAkhir {
  totalSkor: number;
  predikat: string;
  ringkasan: string;
  kekuatan: string[];
  areaPerbaikan: string[];
  rekomendasiPelatihan: string[];
}

export default function SimulatorNCRHandling() {
  const [fase, setFase] = useState<FaseSimulator>("setup");
  const [jenisTemuan, setJenisTemuan] = useState(JENIS_TEMUAN[0]);
  const [standarAcuan, setStandarAcuan] = useState(STANDAR_ACUAN[0]);
  const [jabatanAuditee, setJabatanAuditee] = useState("");
  const [loading, setLoading] = useState(false);
  const [skenario, setSkenario] = useState<Skenario | null>(null);
  const [intro, setIntro] = useState("");
  const [pertanyaanSaatIni, setPertanyaanSaatIni] = useState("");
  const [konteksSoal, setKonteksSoal] = useState("");
  const [jawaban, setJawaban] = useState("");
  const [turns, setTurns] = useState<TurnData[]>([]);
  const [nomorSoal, setNomorSoal] = useState(1);
  const [hasilAkhir, setHasilAkhir] = useState<HasilAkhir | null>(null);
  const totalSoal = 5;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, pertanyaanSaatIni, hasilAkhir]);

  async function mulai() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-ncr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", jenisTemuan, standarAcuan, jabatanAuditee: jabatanAuditee || "Wakil Manajemen Mutu", totalSoal }),
      });
      const data = await res.json();
      setIntro(data.intro);
      setSkenario(data.skenario);
      setPertanyaanSaatIni(data.pertanyaan);
      setKonteksSoal(data.konteks || "");
      setNomorSoal(1);
      setTurns([]);
      setHasilAkhir(null);
      setFase("intro");
    } catch { /**/ } finally { setLoading(false); }
  }

  async function kirimJawaban() {
    if (!jawaban.trim()) return;
    setLoading(true);
    const jawabanUser = jawaban;
    setJawaban("");
    try {
      const res = await fetch("/api/tools/simulator-ncr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: nomorSoal >= totalSoal ? "finish" : "answer",
          jenisTemuan, standarAcuan, jabatanAuditee, totalSoal, nomorSoal,
          skenario, pertanyaan: pertanyaanSaatIni, jawaban: jawabanUser,
          riwayat: turns.map(t => ({ pertanyaan: t.pertanyaan, jawaban: t.jawaban, skor: t.evaluasi.skor })),
        }),
      });
      const data = await res.json();
      const newTurn: TurnData = { pertanyaan: pertanyaanSaatIni, konteks: konteksSoal, jawaban: jawabanUser, evaluasi: data.evaluasi };
      const newTurns = [...turns, newTurn];
      setTurns(newTurns);
      if (nomorSoal >= totalSoal) {
        setHasilAkhir(data.hasilAkhir);
        setPertanyaanSaatIni("");
        setFase("selesai");
      } else {
        setPertanyaanSaatIni(data.pertanyaanBerikutnya);
        setKonteksSoal(data.konteksBerikutnya || "");
        setNomorSoal(n => n + 1);
      }
    } catch { /**/ } finally { setLoading(false); }
  }

  function reset() { setFase("setup"); setTurns([]); setPertanyaanSaatIni(""); setHasilAkhir(null); setJawaban(""); setNomorSoal(1); setSkenario(null); }

  const skorColor = (s: number) => s >= 4 ? "text-green-400" : s >= 3 ? "text-yellow-400" : s >= 2 ? "text-orange-400" : "text-red-400";
  const predikatColor = (p: string) => p.includes("Sangat") ? "text-green-400" : p.includes("Cukup") ? "text-yellow-400" : "text-red-400";

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
              <AlertOctagon className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulator Penanganan NCR</h1>
              <p className="text-slate-400 text-sm">Latih kemampuan merespons & menangani temuan NCR dari auditor ISO/CSMS</p>
            </div>
            <Badge className="ml-auto bg-violet-500/15 text-violet-400 border-violet-500/30">Gelombang 21</Badge>
          </div>
        </div>

        {fase === "setup" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Pilih Skenario NCR</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Temuan / NCR</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={jenisTemuan} onChange={e => setJenisTemuan(e.target.value)}>
                  {JENIS_TEMUAN.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Standar Acuan</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={standarAcuan} onChange={e => setStandarAcuan(e.target.value)}>
                  {STANDAR_ACUAN.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jabatan Auditee (yang diuji)</label>
                <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                  placeholder="cth: Wakil Manajemen Mutu / QC Manager / HSE Officer"
                  value={jabatanAuditee} onChange={e => setJabatanAuditee(e.target.value)} />
              </div>
            </div>
            <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-4 mb-5">
              <div className="text-violet-300 text-sm font-medium mb-2">📋 Format Simulasi</div>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• AI generate skenario NCR nyata dengan bukti objektif</li>
                <li>• {totalSoal} pertanyaan: akar masalah, korektif, preventif, dokumentasi, komunikasi</li>
                <li>• Setiap jawaban dinilai 1–5 + feedback langsung + jawaban ideal</li>
                <li>• Predikat akhir: Sangat Kompeten / Cukup / Perlu Peningkatan</li>
              </ul>
            </div>
            <Button onClick={mulai} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat skenario NCR...</> : <><Sparkles className="h-4 w-4 mr-2" /> Mulai Simulator NCR</>}
            </Button>
          </div>
        )}

        {fase === "intro" && skenario && (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertOctagon className="h-5 w-5 text-red-400" />
                <h3 className="text-red-300 font-bold">TEMUAN NCR — {skenario.tingkatKeparahan}</h3>
              </div>
              <h4 className="text-white font-semibold mb-2">{skenario.judulNCR}</h4>
              <p className="text-slate-300 text-sm mb-3">{skenario.deskripsiTemuan}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-400 text-xs mb-1">Klausul / Acuan:</div>
                  <div className="text-orange-300 text-sm">{skenario.klausulAcuan}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-1">Bukti Objektif:</div>
                  <ul className="space-y-0.5">{skenario.buktiObjektif.map((b, i) => <li key={i} className="text-slate-300 text-xs">• {b}</li>)}</ul>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4">
              <p className="text-slate-300 text-sm leading-relaxed">{intro}</p>
            </div>
            <Button onClick={() => setFase("questioning")} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              <ChevronRight className="h-4 w-4 mr-2" /> Siap — Mulai Menjawab
            </Button>
          </div>
        )}

        {(fase === "questioning" || fase === "selesai") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">{jenisTemuan.split(" — ")[0]}</div>
              <div className="flex items-center gap-2">
                {fase !== "selesai" && <span className="text-slate-300 text-sm">Soal {Math.min(nomorSoal, totalSoal)}/{totalSoal}</span>}
                <Button onClick={reset} variant="ghost" size="sm" className="text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Ulang</Button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {Array.from({ length: totalSoal }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${
                  i < turns.length ? (turns[i].evaluasi.skor >= 4 ? "bg-green-500" : turns[i].evaluasi.skor >= 3 ? "bg-yellow-500" : "bg-red-500")
                  : i === turns.length && fase === "questioning" ? "bg-violet-500/50" : "bg-slate-700"
                }`} />
              ))}
            </div>

            {turns.map((turn, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <div className="text-xs text-violet-300 mb-1 font-medium">Pertanyaan {idx + 1}</div>
                    <p className="text-slate-200 text-sm leading-relaxed">{turn.pertanyaan}</p>
                    {turn.konteks && <p className="text-slate-400 text-xs mt-1 italic">{turn.konteks}</p>}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-lg">
                    <div className="bg-violet-900/30 border border-violet-500/20 rounded-xl rounded-tr-sm px-4 py-3">
                      <p className="text-slate-200 text-sm">{turn.jawaban}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-white" /></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold text-lg ${skorColor(turn.evaluasi.skor)}`}>{turn.evaluasi.skor}/5</span>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.round(turn.evaluasi.skor) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />)}</div>
                    </div>
                    {turn.evaluasi.aspekBaik && <div className="text-green-400 text-xs mb-1">✓ {turn.evaluasi.aspekBaik}</div>}
                    {turn.evaluasi.aspekKurang && <div className="text-orange-400 text-xs mb-2">⚠ {turn.evaluasi.aspekKurang}</div>}
                    <div className="bg-slate-700/40 rounded p-2 mt-2">
                      <div className="text-xs text-slate-400 mb-1">Jawaban ideal:</div>
                      <p className="text-slate-300 text-xs leading-relaxed">{turn.evaluasi.jawabanIdeal}</p>
                      {turn.evaluasi.referensi && <p className="text-slate-500 text-xs mt-1">📑 {turn.evaluasi.referensi}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {fase === "questioning" && pertanyaanSaatIni && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <div className="text-xs text-violet-300 mb-1 font-medium">Pertanyaan {nomorSoal}</div>
                    <p className="text-slate-200 text-sm leading-relaxed">{pertanyaanSaatIni}</p>
                    {konteksSoal && <p className="text-slate-400 text-xs mt-1 italic">{konteksSoal}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <textarea rows={3} className="flex-1 bg-slate-800/80 border border-slate-600/60 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 resize-none text-sm"
                    placeholder="Ketik jawaban Anda..." value={jawaban} onChange={e => setJawaban(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) kirimJawaban(); }} disabled={loading} />
                  <Button onClick={kirimJawaban} disabled={loading || !jawaban.trim()} className="bg-violet-600 hover:bg-violet-700 text-white self-end px-4 py-2.5">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-slate-600 text-xs">Ctrl+Enter untuk kirim</p>
              </div>
            )}

            {fase === "selesai" && hasilAkhir && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="text-center mb-5">
                  <Trophy className={`h-12 w-12 mx-auto mb-2 ${hasilAkhir.predikat.includes("Sangat") ? "text-yellow-400" : "text-slate-400"}`} />
                  <div className="text-4xl font-bold text-white mb-1">{hasilAkhir.totalSkor.toFixed(1)}/5.0</div>
                  <div className={`text-xl font-bold ${predikatColor(hasilAkhir.predikat)}`}>{hasilAkhir.predikat}</div>
                </div>
                <p className="text-slate-300 text-sm text-center mb-5">{hasilAkhir.ringkasan}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3">
                    <div className="text-green-400 text-xs font-medium mb-2">Kekuatan</div>
                    <ul className="space-y-1">{hasilAkhir.kekuatan.map((k, i) => <li key={i} className="text-slate-300 text-xs">• {k}</li>)}</ul>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3">
                    <div className="text-orange-400 text-xs font-medium mb-2">Area Perbaikan</div>
                    <ul className="space-y-1">{hasilAkhir.areaPerbaikan.map((a, i) => <li key={i} className="text-slate-300 text-xs">• {a}</li>)}</ul>
                  </div>
                </div>
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-3 mb-4">
                  <div className="text-violet-300 text-xs font-medium mb-2">Rekomendasi Pelatihan</div>
                  <ul className="space-y-1">{hasilAkhir.rekomendasiPelatihan.map((r, i) => <li key={i} className="text-slate-300 text-xs">• {r}</li>)}</ul>
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
