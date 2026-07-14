import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ClipboardList, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const JENIS_RAPAT = [
  "Rapat Koordinasi Proyek Mingguan",
  "Rapat Kick-Off Proyek",
  "Rapat Progress / Monthly Review",
  "Rapat Evaluasi Desain / Shop Drawing",
  "Rapat K3 / Safety Committee",
  "Rapat Serah Terima Pekerjaan (BAST)",
  "Rapat Evaluasi Mutu & NCR",
  "Rapat Klaim & Variation Order",
  "Rapat Subkontraktor & Supplier",
  "Rapat Manajemen Risiko Proyek",
  "Rapat Commissioning & Testing",
  "Rapat Lainnya",
];

const SAMPLE_AGENDA = [
  "Review progress minggu lalu, kendala, rencana minggu ini",
  "Pembahasan NCR & tindak lanjut temuan audit",
  "Update rencana pengadaan material & alat",
  "Evaluasi K3: insiden, near-miss, tindakan korektif",
  "Persetujuan shop drawing & RFI",
];

interface ActionItem {
  no: number;
  kegiatan: string;
  pic: string;
  deadline: string;
  status: string;
}

interface HasilRisalah {
  judulRapat: string;
  ringkasan: string;
  pembukaanRapat: string;
  notulensiPerAgenda: { agenda: string; pembahasan: string; keputusan: string }[];
  actionItems: ActionItem[];
  penutup: string;
  distribusiKepada: string[];
}

export default function GeneratorRisalahRapat() {
  const [jenisRapat, setJenisRapat] = useState(JENIS_RAPAT[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [tempat, setTempat] = useState("");
  const [peserta, setPeserta] = useState("");
  const [agendaList, setAgendaList] = useState(SAMPLE_AGENDA.slice(0, 3).join("\n"));
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilRisalah | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/risalah-rapat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisRapat, namaProyek, tanggal, tempat, peserta, agendaList, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch {
      setHasil(null);
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!hasil) return;
    const text = [
      `RISALAH RAPAT`,
      `${hasil.judulRapat}`,
      "",
      hasil.pembukaanRapat,
      "",
      "PEMBAHASAN",
      ...hasil.notulensiPerAgenda.map((a, i) => `${i + 1}. ${a.agenda}\n   Pembahasan: ${a.pembahasan}\n   Keputusan: ${a.keputusan}`),
      "",
      "ACTION ITEMS / TINDAK LANJUT",
      ...hasil.actionItems.map(a => `${a.no}. ${a.kegiatan} | PIC: ${a.pic} | Deadline: ${a.deadline}`),
      "",
      hasil.penutup,
      "",
      "Distribusi: " + hasil.distribusiKepada.join(", "),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <ClipboardList className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Risalah Rapat Proyek</h1>
              <p className="text-slate-400 text-sm">Input agenda & konteks → AI generate risalah rapat formal + action items</p>
            </div>
            <Badge className="ml-auto bg-indigo-500/15 text-indigo-400 border-indigo-500/30">Gelombang 20</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Rapat *</label>
              <select
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisRapat}
                onChange={e => setJenisRapat(e.target.value)}
              >
                {JENIS_RAPAT.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Proyek Pembangunan RSUD Tipe B Kab. X"
                value={namaProyek}
                onChange={e => setNamaProyek(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tanggal Rapat</label>
              <input
                type="date"
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tempat / Platform</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Direksi Keet / Zoom Meeting / Kantor Owner"
                value={tempat}
                onChange={e => setTempat(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Peserta Rapat</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: PM, Site Manager, QS, HSE, MK Owner, Subkon"
                value={peserta}
                onChange={e => setPeserta(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Agenda Rapat (satu per baris)</label>
              <textarea
                rows={4}
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 resize-none"
                placeholder="Tulis agenda, satu per baris..."
                value={agendaList}
                onChange={e => setAgendaList(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks / Isu yang Dibahas</label>
              <textarea
                rows={3}
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 resize-none"
                placeholder="cth: progress fisik 65%, ada keterlambatan pekerjaan pondasi 2 minggu, NCR bekisting belum ditutup, permintaan VO atap..."
                value={konteks}
                onChange={e => setKonteks(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-slate-500 mb-2">Contoh agenda cepat:</div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_AGENDA.map(a => (
                <button key={a} onClick={() => setAgendaList(prev => prev ? prev + "\n" + a : a)}
                  className="text-xs bg-slate-800 border border-slate-700 text-slate-400 rounded px-2 py-1 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors">
                  + {a.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={generate}
              disabled={loading || !namaProyek.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Risalah...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Risalah Rapat</>}
            </Button>
            {hasil && (
              <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun risalah rapat formal…</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">{hasil.judulRapat}</h2>
              <Button onClick={copyAll} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-slate-300 text-sm leading-relaxed">{hasil.pembukaanRapat}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-indigo-300 font-semibold mb-4">Notulensi per Agenda</h3>
              <div className="space-y-4">
                {hasil.notulensiPerAgenda.map((a, i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
                    <div className="flex gap-2 mb-2">
                      <span className="text-indigo-400 font-bold text-sm">{i + 1}.</span>
                      <span className="text-white font-medium text-sm">{a.agenda}</span>
                    </div>
                    <div className="ml-5 space-y-2">
                      <div>
                        <span className="text-slate-400 text-xs">Pembahasan: </span>
                        <span className="text-slate-300 text-sm">{a.pembahasan}</span>
                      </div>
                      <div className="bg-indigo-950/40 rounded p-2">
                        <span className="text-indigo-300 text-xs font-medium">Keputusan: </span>
                        <span className="text-slate-300 text-sm">{a.keputusan}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-indigo-300 font-semibold mb-4">Action Items / Tindak Lanjut</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="text-left py-2 pr-3">No</th>
                      <th className="text-left py-2 pr-3">Kegiatan</th>
                      <th className="text-left py-2 pr-3">PIC</th>
                      <th className="text-left py-2 pr-3">Deadline</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.actionItems.map(a => (
                      <tr key={a.no} className="border-b border-slate-800/60">
                        <td className="py-2 pr-3 text-indigo-400 font-bold">{a.no}</td>
                        <td className="py-2 pr-3 text-slate-300">{a.kegiatan}</td>
                        <td className="py-2 pr-3 text-slate-300">{a.pic}</td>
                        <td className="py-2 pr-3 text-orange-300">{a.deadline}</td>
                        <td className="py-2">
                          <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded px-2 py-0.5">{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <p className="text-slate-300 text-sm leading-relaxed">{hasil.penutup}</p>
              <div className="mt-3 pt-3 border-t border-slate-700/40">
                <span className="text-slate-400 text-xs">Distribusi: </span>
                <span className="text-slate-300 text-xs">{hasil.distribusiKepada.join(" · ")}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
