import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShieldCheck, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_AUDIT = [
  "Audit Internal K3 Rutin (Bulanan)",
  "Audit Internal K3 Komprehensif (Tahunan)",
  "Audit Pra-Sertifikasi ISO 45001",
  "Audit Pra-Sertifikasi PP 50/2012",
  "Audit CSMS (Contractor Safety Management System)",
  "Audit K3 Pasca-Insiden",
  "Audit K3 Area Spesifik (Galian/Ketinggian/Listrik)",
  "Audit K3 Sub-Kontraktor",
];

const JENIS_PROYEK_AUDIT = [
  "Proyek Gedung Bertingkat",
  "Proyek Infrastruktur Jalan/Jembatan",
  "Proyek Instalasi MEP",
  "Proyek Industri / Migas",
  "Proyek Pertambangan",
  "Proyek Renovasi / Rehabilitasi",
];

const SKALA_TEMUAN = [
  "Banyak temuan critical (>5 major)",
  "Beberapa temuan (2–5 major, 5–10 minor)",
  "Sedikit temuan (0–1 major, <5 minor)",
  "Bersih / Tidak ada temuan",
];

interface TemuanAudit {
  nomor: string;
  klausul: string;
  lokasi: string;
  deskripsiTemuan: string;
  tingkat: "Critical" | "Major" | "Minor" | "OFI";
  rekomendasi: string;
  deadline: string;
  picJabatan: string;
}

interface HasilLaporanAudit {
  nomorLaporan: string;
  tanggal: string;
  judulLaporan: string;
  auditor: string;
  auditee: string;
  lingkupAudit: string;
  ringkasanEksekutif: string;
  skorKepatuhan: number;
  statusKeseluruhan: string;
  elemen: { elemen: string; status: "Sesuai" | "Perlu Perbaikan" | "Tidak Sesuai"; persentase: number }[];
  temuanUtama: TemuanAudit[];
  positifFindings: string[];
  rekomendasiStrategis: string[];
  rencanaFollowUp: string;
  penutup: string;
}

export default function GeneratorLaporanAuditK3() {
  const [jenisAudit, setJenisAudit] = useState(JENIS_AUDIT[0]);
  const [jenisProyek, setJenisProyek] = useState(JENIS_PROYEK_AUDIT[0]);
  const [skalaTemuan, setSkalaTemuan] = useState(SKALA_TEMUAN[1]);
  const [namaProyek, setNamaProyek] = useState("");
  const [periodeAudit, setPeriodeAudit] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilLaporanAudit | null>(null);
  const [expanded, setExpanded] = useState<string | null>("temuan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-laporan-audit-k3", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisAudit, jenisProyek, skalaTemuan, namaProyek, periodeAudit }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyLaporan() {
    if (!hasil) return;
    const txt = [`${hasil.judulLaporan}`, `${hasil.nomorLaporan} · ${hasil.tanggal}`, "", hasil.ringkasanEksekutif, "", "TEMUAN UTAMA:", ...hasil.temuanUtama.map(t => `[${t.tingkat}] ${t.deskripsiTemuan} → ${t.rekomendasi}`)].join("\n");
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);
  const TINGKAT_COLOR: Record<string, string> = { Critical: "bg-red-900/40 text-red-300 border-red-500/30", Major: "bg-orange-900/40 text-orange-300 border-orange-500/30", Minor: "bg-yellow-900/40 text-yellow-300 border-yellow-500/30", OFI: "bg-blue-900/40 text-blue-300 border-blue-500/30" };
  const STATUS_COLOR: Record<string, string> = { Sesuai: "text-green-400", "Perlu Perbaikan": "text-yellow-400", "Tidak Sesuai": "text-red-400" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20"><ShieldCheck className="h-6 w-6 text-teal-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Laporan Audit Internal K3</h1>
              <p className="text-slate-400 text-sm">Generate laporan audit K3 formal — ringkasan eksekutif, skor kepatuhan, temuan, rekomendasi, rencana follow-up</p>
            </div>
            <Badge className="ml-auto bg-teal-500/15 text-teal-400 border-teal-500/30">Gelombang 27</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Audit *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisAudit} onChange={e => setJenisAudit(e.target.value)}>
                {JENIS_AUDIT.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Proyek</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}>
                {JENIS_PROYEK_AUDIT.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Skala Temuan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={skalaTemuan} onChange={e => setSkalaTemuan(e.target.value)}>
                {SKALA_TEMUAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Proyek Gedung Tower ABC" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Periode Audit (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Juni 2026 / Triwulan II 2026" value={periodeAudit} onChange={e => setPeriodeAudit(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun laporan audit...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Laporan Audit K3</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center"><Loader2 className="h-8 w-8 text-teal-400 animate-spin mx-auto mb-3" /><p className="text-slate-300">Menyusun laporan audit K3...</p></div>}

        {hasil && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-teal-300 text-xs font-mono">{hasil.nomorLaporan} · {hasil.tanggal}</div>
                <h2 className="text-white font-bold">{hasil.judulLaporan}</h2>
              </div>
              <Button onClick={copyLaporan} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-4 text-center border ${hasil.skorKepatuhan >= 80 ? "bg-green-900/20 border-green-500/30" : hasil.skorKepatuhan >= 60 ? "bg-yellow-900/20 border-yellow-500/30" : "bg-red-900/20 border-red-500/30"}`}>
                <div className={`text-3xl font-bold ${hasil.skorKepatuhan >= 80 ? "text-green-300" : hasil.skorKepatuhan >= 60 ? "text-yellow-300" : "text-red-300"}`}>{hasil.skorKepatuhan}%</div>
                <div className="text-xs text-slate-400">Skor Kepatuhan K3</div>
                <div className={`text-xs font-medium mt-0.5 ${hasil.skorKepatuhan >= 80 ? "text-green-400" : hasil.skorKepatuhan >= 60 ? "text-yellow-400" : "text-red-400"}`}>{hasil.statusKeseluruhan}</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 col-span-2">
                <div className="text-xs text-slate-500 mb-1">Auditor: {hasil.auditor}</div>
                <div className="text-xs text-slate-500 mb-1">Auditee: {hasil.auditee}</div>
                <div className="text-xs text-slate-500">Lingkup: {hasil.lingkupAudit}</div>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4">
              <div className="text-teal-300 text-xs font-medium mb-1">Ringkasan Eksekutif</div>
              <p className="text-slate-300 text-sm">{hasil.ringkasanEksekutif}</p>
            </div>

            {[
              {
                key: "elemen", label: "Status Kepatuhan per Elemen",
                content: (
                  <div className="space-y-2">
                    {hasil.elemen.map((e, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 text-sm text-slate-200">{e.elemen}</div>
                        <div className="w-24 bg-slate-700/40 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${e.persentase >= 80 ? "bg-green-500" : e.persentase >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${e.persentase}%` }} />
                        </div>
                        <div className={`text-xs w-16 text-right ${STATUS_COLOR[e.status] ?? "text-slate-400"}`}>{e.persentase}% — {e.status}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "temuan", label: "Temuan Utama",
                content: (
                  <div className="space-y-2">
                    {hasil.temuanUtama.map((t, i) => (
                      <div key={i} className={`rounded-lg border p-3 ${TINGKAT_COLOR[t.tingkat] ? TINGKAT_COLOR[t.tingkat].replace(/text-\S+/g, "").trim() : "bg-slate-800/60 border-slate-700/40"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${TINGKAT_COLOR[t.tingkat]}`}>{t.tingkat}</span>
                          <span className="text-slate-400 text-xs">{t.nomor} | {t.klausul}</span>
                          <span className="text-slate-500 text-xs ml-auto">{t.lokasi}</span>
                        </div>
                        <p className="text-slate-200 text-sm">{t.deskripsiTemuan}</p>
                        <div className="text-green-300 text-xs mt-1">→ {t.rekomendasi}</div>
                        <div className="text-slate-500 text-xs mt-0.5">PIC: {t.picJabatan} | Deadline: {t.deadline}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "positif", label: "Temuan Positif (Good Practice)",
                content: <ul className="space-y-1">{hasil.positifFindings.map((p, i) => <li key={i} className="text-slate-300 text-xs">✓ {p}</li>)}</ul>
              },
              {
                key: "rekomendasi", label: "Rekomendasi Strategis",
                content: <ul className="space-y-1">{hasil.rekomendasiStrategis.map((r, i) => <li key={i} className="text-slate-300 text-xs">{i + 1}. {r}</li>)}</ul>
              },
            ].map(s => (
              <div key={s.key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggle(s.key)} className="w-full flex items-center justify-between px-5 py-3 text-white font-semibold hover:bg-slate-800/40 transition-colors">
                  <span>{s.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded === s.key ? "rotate-180" : ""}`} />
                </button>
                {expanded === s.key && <div className="px-5 pb-4">{s.content}</div>}
              </div>
            ))}
            <div className="bg-green-900/15 border border-green-500/20 rounded-lg p-3 text-xs text-green-300">{hasil.rencanaFollowUp}</div>
          </div>
        )}
      </div>
    </div>
  );
}
