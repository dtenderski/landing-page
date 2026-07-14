import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ClipboardCheck, Send, RotateCcw, Bot, Star, Trophy } from "lucide-react";
import { Link } from "wouter";

const STANDAR_ISO = [
  "ISO 9001:2015 — SMM (Sistem Manajemen Mutu)",
  "ISO 14001:2015 — SML (Sistem Manajemen Lingkungan)",
  "ISO 45001:2018 — SMK3 (Keselamatan & Kesehatan Kerja)",
  "ISO 37001:2016 — SMAP (Anti-Penyuapan)",
  "ISO 19650 — BIM & Manajemen Informasi Konstruksi",
  "ISO 31000:2018 — Manajemen Risiko",
];

const JENIS_AUDIT = [
  "Audit Internal (First Party) — self-assessment",
  "Audit Sertifikasi Awal (Third Party) — tahap 1",
  "Audit Sertifikasi Penuh (Third Party) — tahap 2",
  "Audit Surveillance Tahunan",
  "Audit Re-Sertifikasi (3 tahun)",
];

const KLAUSUL_TERKAIT: Record<string, string[]> = {
  "ISO 9001:2015 — SMM (Sistem Manajemen Mutu)": ["Klausul 4 — Konteks Organisasi", "Klausul 5 — Kepemimpinan", "Klausul 6 — Perencanaan", "Klausul 7 — Dukungan", "Klausul 8 — Operasi", "Klausul 9 — Evaluasi Kinerja", "Klausul 10 — Peningkatan"],
  "ISO 14001:2015 — SML (Sistem Manajemen Lingkungan)": ["Klausul 4 — Konteks Organisasi", "Klausul 6 — Perencanaan (Aspek Lingkungan)", "Klausul 8 — Pengendalian Operasional", "Klausul 9 — Evaluasi Kepatuhan"],
  "ISO 45001:2018 — SMK3 (Keselamatan & Kesehatan Kerja)": ["Klausul 5 — Kepemimpinan & Partisipasi", "Klausul 6 — HIRADC & Manajemen Risiko", "Klausul 8 — Pengendalian Operasional K3", "Klausul 9 — Audit Internal K3"],
  "ISO 37001:2016 — SMAP (Anti-Penyuapan)": ["Klausul 5 — Kebijakan Anti-Penyuapan", "Klausul 6 — Penilaian Risiko Penyuapan", "Klausul 8 — Uji Tuntas & Kontrol"],
};

type Fase = "setup" | "audit" | "selesai";

interface Giliran {
  auditor: string;
  auditee?: string;
  feedback?: { temuan: string; level: "Conformance" | "Minor NCR" | "Major NCR" | "OFI"; skor: number; referensiKlausul: string };
}

interface HasilAudit {
  skor: number;
  status: string;
  rekapTemuan: { level: string; jumlah: number }[];
  ringkasan: string;
  kekuatan: string[];
  temuan: string[];
  rekomendasi: string[];
}

const TOTAL_PERTANYAAN = 5;
const TEMUAN_COLOR: Record<string, string> = {
  "Conformance": "bg-green-900/30 text-green-300",
  "Minor NCR": "bg-yellow-900/30 text-yellow-300",
  "Major NCR": "bg-red-900/30 text-red-300",
  "OFI": "bg-blue-900/30 text-blue-300",
};

export default function SimulatorAuditISO() {
  const [fase, setFase] = useState<Fase>("setup");
  const [standar, setStandar] = useState(STANDAR_ISO[0]);
  const [jenisAudit, setJenisAudit] = useState(JENIS_AUDIT[0]);
  const [loading, setLoading] = useState(false);
  const [giliran, setGiliran] = useState<Giliran[]>([]);
  const [inputAuditee, setInputAuditee] = useState("");
  const [nomorPertanyaan, setNomorPertanyaan] = useState(1);
  const [hasilAudit, setHasilAudit] = useState<HasilAudit | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [giliran, fase]);

  async function mulai() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/simulator-audit-iso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", standar, jenisAudit }),
      });
      const data = await res.json();
      setGiliran([{ auditor: data.pembukaan }, { auditor: data.pertanyaan }]);
      setNomorPertanyaan(1);
      setHasilAudit(null);
      setInputAuditee("");
      setFase("audit");
    } catch { } finally { setLoading(false); }
  }

  async function kirim() {
    if (!inputAuditee.trim()) return;
    const jawaban = inputAuditee.trim();
    setInputAuditee("");
    setLoading(true);
    const isLast = nomorPertanyaan >= TOTAL_PERTANYAAN;
    const newGiliran = [...giliran];
    newGiliran[newGiliran.length - 1] = { ...newGiliran[newGiliran.length - 1], auditee: jawaban };
    setGiliran(newGiliran);
    try {
      const res = await fetch("/api/tools/simulator-audit-iso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLast ? "finish" : "next",
          standar, jenisAudit, nomorPertanyaan,
          pertanyaan: giliran[giliran.length - 1].auditor,
          jawaban,
          riwayat: giliran.filter(g => g.auditee).map(g => ({ p: g.auditor, j: g.auditee })),
        }),
      });
      const data = await res.json();
      const updated = [...newGiliran];
      updated[updated.length - 1] = { ...updated[updated.length - 1], feedback: data.feedback };
      if (isLast) {
        setGiliran(updated);
        setHasilAudit(data.hasilAudit);
        setFase("selesai");
      } else {
        setGiliran([...updated, { auditor: data.pertanyaanBerikutnya }]);
        setNomorPertanyaan(n => n + 1);
      }
    } catch { } finally { setLoading(false); }
  }

  function reset() { setFase("setup"); setGiliran([]); setHasilAudit(null); setInputAuditee(""); setNomorPertanyaan(1); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950/20 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <ClipboardCheck className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulator Audit Internal ISO</h1>
              <p className="text-slate-400 text-sm">Simulasi sesi audit ISO 9001/14001/45001/37001 oleh Lead Auditor — 5 pertanyaan + temuan NCR</p>
            </div>
            <Badge className="ml-auto bg-sky-500/15 text-sky-400 border-sky-500/30">Gelombang 24</Badge>
          </div>
        </div>

        {fase === "setup" && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Pilih Standar & Jenis Audit</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Standar ISO</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={standar} onChange={e => setStandar(e.target.value)}>
                  {STANDAR_ISO.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Audit</label>
                <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                  value={jenisAudit} onChange={e => setJenisAudit(e.target.value)}>
                  {JENIS_AUDIT.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              {KLAUSUL_TERKAIT[standar] && (
                <div className="bg-sky-900/20 border border-sky-500/20 rounded-lg p-3">
                  <div className="text-sky-300 text-xs font-medium mb-1.5">Klausul yang Akan Diuji</div>
                  <div className="flex flex-wrap gap-1.5">{KLAUSUL_TERKAIT[standar].map(k => <span key={k} className="bg-sky-900/40 text-sky-200 text-xs px-2 py-0.5 rounded">{k}</span>)}</div>
                </div>
              )}
            </div>
            <div className="bg-sky-900/20 border border-sky-500/20 rounded-lg p-4 mb-5">
              <div className="text-sky-300 text-sm font-medium mb-2">📋 Format Simulasi</div>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• {TOTAL_PERTANYAAN} pertanyaan audit dari Lead Auditor</li>
                <li>• Setiap jawaban dinilai: Conformance / OFI / Minor NCR / Major NCR</li>
                <li>• Referensi klausul & poin improvement per temuan</li>
                <li>• Rekap temuan akhir + status kelulusan</li>
              </ul>
            </div>
            <Button onClick={mulai} disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyiapkan audit...</> : <><Sparkles className="h-4 w-4 mr-2" /> Mulai Simulasi Audit</>}
            </Button>
          </div>
        )}

        {(fase === "audit" || fase === "selesai") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">{standar.split("—")[0].trim()}</div>
              <div className="flex items-center gap-2">
                {fase === "audit" && <span className="text-slate-300 text-sm">Pertanyaan {nomorPertanyaan}/{TOTAL_PERTANYAAN}</span>}
                <Button onClick={reset} variant="ghost" size="sm" className="text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Ulang</Button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_PERTANYAAN }).map((_, i) => {
                const answered = giliran.filter(g => g.auditee);
                const g = answered[i];
                const level = g?.feedback?.level;
                return (
                  <div key={i} className={`flex-1 h-2 rounded-full ${g ? level === "Conformance" ? "bg-green-500" : level === "OFI" ? "bg-blue-500" : level === "Minor NCR" ? "bg-yellow-500" : "bg-red-500" : i === answered.length && fase === "audit" ? "bg-sky-500/50" : "bg-slate-700"}`} />
                );
              })}
            </div>

            <div className="space-y-4">
              {giliran[0] && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                    <div className="text-sky-300 text-xs font-medium mb-1">Lead Auditor</div>
                    <p className="text-slate-200 text-sm leading-relaxed">{giliran[0].auditor}</p>
                  </div>
                </div>
              )}

              {giliran.slice(1).map((g, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                    <div className="bg-slate-800/80 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                      <div className="text-sky-300 text-xs font-medium mb-1">Auditor — Pertanyaan {idx + 1}</div>
                      <p className="text-slate-200 text-sm leading-relaxed">{g.auditor}</p>
                    </div>
                  </div>
                  {g.auditee && (
                    <div className="flex gap-3 justify-end">
                      <div className="bg-sky-900/30 border border-sky-500/20 rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                        <div className="text-sky-400 text-xs font-medium mb-1">Auditee</div>
                        <p className="text-slate-200 text-sm leading-relaxed">{g.auditee}</p>
                      </div>
                    </div>
                  )}
                  {g.feedback && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl rounded-tl-sm px-4 py-3 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${TEMUAN_COLOR[g.feedback.level] || ""}`}>{g.feedback.level}</span>
                          <span className="text-slate-500 text-xs">{g.feedback.referensiKlausul}</span>
                        </div>
                        <p className="text-slate-300 text-xs">{g.feedback.temuan}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {fase === "audit" && (
              <div className="space-y-2">
                <textarea rows={3} value={inputAuditee} onChange={e => setInputAuditee(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) kirim(); }}
                  placeholder="Jelaskan kondisi/dokumen/proses yang tersedia (sebagai auditee)... Ctrl+Enter untuk kirim"
                  className="w-full bg-slate-800/80 border border-slate-600/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-sky-500/60" />
                <Button onClick={kirim} disabled={loading || !inputAuditee.trim()} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {loading ? "Evaluasi auditor..." : nomorPertanyaan >= TOTAL_PERTANYAAN ? "Kirim & Selesaikan Audit" : "Kirim Jawaban"}
                </Button>
              </div>
            )}

            {fase === "selesai" && hasilAudit && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="text-center mb-5">
                  <Trophy className={`h-12 w-12 mx-auto mb-2 ${hasilAudit.skor >= 70 ? "text-yellow-400" : "text-slate-400"}`} />
                  <div className="text-4xl font-bold text-white mb-1">{hasilAudit.skor}/100</div>
                  <div className={`text-xl font-bold ${hasilAudit.status.includes("Rekomendasi") || hasilAudit.status.includes("Lulus") ? "text-green-400" : "text-red-400"}`}>{hasilAudit.status}</div>
                </div>
                <p className="text-slate-300 text-sm text-center mb-4">{hasilAudit.ringkasan}</p>
                {hasilAudit.rekapTemuan.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {hasilAudit.rekapTemuan.map((r, i) => (
                      <div key={i} className={`rounded-lg p-3 text-center ${TEMUAN_COLOR[r.level] || "bg-slate-800 text-slate-300"}`}>
                        <div className="text-xl font-bold">{r.jumlah}</div>
                        <div className="text-xs">{r.level}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3">
                    <div className="text-green-400 text-xs font-medium mb-1">Kekuatan</div>
                    <ul className="space-y-0.5">{hasilAudit.kekuatan.map((k, i) => <li key={i} className="text-slate-300 text-xs">• {k}</li>)}</ul>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3">
                    <div className="text-orange-400 text-xs font-medium mb-1">Temuan yang Perlu Ditindaklanjuti</div>
                    <ul className="space-y-0.5">{hasilAudit.temuan.map((t, i) => <li key={i} className="text-slate-300 text-xs">• {t}</li>)}</ul>
                  </div>
                </div>
                <div className="bg-sky-900/20 border border-sky-500/20 rounded-lg p-3 mb-4">
                  <div className="text-sky-300 text-xs font-medium mb-1">Rekomendasi Tindakan Koreksi</div>
                  <ul className="space-y-0.5">{hasilAudit.rekomendasi.map((r, i) => <li key={i} className="text-slate-300 text-xs">• {r}</li>)}</ul>
                </div>
                <Button onClick={reset} className="w-full bg-sky-600 hover:bg-sky-700 text-white"><RotateCcw className="h-4 w-4 mr-2" /> Mulai Audit Baru</Button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
