import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, CalendarDays, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK = [
  "Gedung Bertingkat (3–10 lantai)",
  "Gedung Bertingkat Tinggi (>10 lantai)",
  "Rumah Tinggal / Perumahan",
  "Jalan Aspal / Overlay",
  "Jembatan Beton",
  "Irigasi & Drainase",
  "Gedung Fasilitas Publik (RS/Sekolah/Kantor)",
  "Renovasi / Rehabilitasi Bangunan",
  "Instalasi MEP",
  "Tanggul & Bendung",
];

const DURASI_KONTRAK = [
  "60 hari kalender (2 bulan)",
  "90 hari kalender (3 bulan)",
  "120 hari kalender (4 bulan)",
  "150 hari kalender (5 bulan)",
  "180 hari kalender (6 bulan)",
  "270 hari kalender (9 bulan)",
  "360 hari kalender (12 bulan)",
  "540 hari kalender (18 bulan)",
  "720 hari kalender (24 bulan)",
];

const METODE_PENGERJAAN = [
  "Swakelola (oleh tim sendiri)",
  "Subkon penuh",
  "Campuran swakelola + subkon",
  "EPC (Engineering-Procurement-Construction)",
];

interface ItemJadwal {
  nomor: string;
  namaItem: string;
  kategori: string;
  durasiHari: number;
  startMinggu: number;
  endMinggu: number;
  bobot: number;
  predecessor: string;
  milestone: boolean;
  keterangan: string;
}

interface HasilJadwal {
  judulProyek: string;
  totalMinggu: number;
  itemJadwal: ItemJadwal[];
  milestone: { minggu: number; nama: string; keterangan: string }[];
  kurvaS: number[];
  catatanPenting: string[];
  asumssi: string[];
}

export default function GeneratorJadwalPelaksanaan() {
  const [jenisProyek, setJenisProyek] = useState(JENIS_PROYEK[0]);
  const [durasiKontrak, setDurasiKontrak] = useState(DURASI_KONTRAK[4]);
  const [metode, setMetode] = useState(METODE_PENGERJAAN[2]);
  const [namaProyek, setNamaProyek] = useState("");
  const [catatanKhusus, setCatatanKhusus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilJadwal | null>(null);
  const [expanded, setExpanded] = useState<string | null>("jadwal");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-jadwal-pelaksanaan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, durasiKontrak, metode, namaProyek, catatanKhusus }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyJadwal() {
    if (!hasil) return;
    const txt = hasil.itemJadwal.map(i => `${i.nomor}\t${i.namaItem}\t${i.durasiHari} hari\tMinggu ${i.startMinggu}–${i.endMinggu}\t${i.bobot}%`).join("\n");
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  const WARNA_KAT: Record<string, string> = {
    "Persiapan": "bg-slate-700/60 text-slate-300",
    "Sipil": "bg-blue-900/30 text-blue-300",
    "Struktur": "bg-indigo-900/30 text-indigo-300",
    "Arsitektur": "bg-violet-900/30 text-violet-300",
    "MEP": "bg-emerald-900/30 text-emerald-300",
    "Finishing": "bg-amber-900/30 text-amber-300",
    "Commissioning": "bg-green-900/30 text-green-300",
    "Administrasi": "bg-slate-700/60 text-slate-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"><CalendarDays className="h-6 w-6 text-blue-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Jadwal Pelaksanaan Proyek</h1>
              <p className="text-slate-400 text-sm">Generate Bar Chart / jadwal induk proyek — item pekerjaan, durasi, bobot, milestone, Kurva S</p>
            </div>
            <Badge className="ml-auto bg-blue-500/15 text-blue-400 border-blue-500/30">Gelombang 27</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Proyek *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}>
                {JENIS_PROYEK.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Durasi Kontrak</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={durasiKontrak} onChange={e => setDurasiKontrak(e.target.value)}>
                {DURASI_KONTRAK.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Metode Pengerjaan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={metode} onChange={e => setMetode(e.target.value)}>
                {METODE_PENGERJAAN.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Kantor PT XYZ" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Catatan Khusus (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: ada pekerjaan bor pile, 2 tower crane, struktur precast" value={catatanKhusus} onChange={e => setCatatanKhusus(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun jadwal...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Jadwal Pelaksanaan</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center"><Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" /><p className="text-slate-300">Menyusun jadwal pelaksanaan...</p></div>}

        {hasil && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white font-bold">{hasil.judulProyek}</h2>
                <p className="text-slate-400 text-sm">Total: {hasil.totalMinggu} minggu · {hasil.itemJadwal.length} item pekerjaan</p>
              </div>
              <Button onClick={copyJadwal} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Tersalin!" : "Salin TSV"}
              </Button>
            </div>

            {[
              {
                key: "jadwal", label: "Bar Chart — Jadwal Item Pekerjaan",
                content: (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-max">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-700/50">
                            {["No", "Item Pekerjaan", "Kategori", "Durasi", "Mulai", "Selesai", "Bobot %", "Predecessor", ""].map(h => <th key={h} className="text-left px-2 py-1.5 whitespace-nowrap">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {hasil.itemJadwal.map((item, i) => (
                            <tr key={i} className={`border-b border-slate-800/40 ${item.milestone ? "bg-blue-900/10" : ""}`}>
                              <td className="px-2 py-1.5 text-slate-400">{item.nomor}</td>
                              <td className="px-2 py-1.5 text-slate-200 font-medium">{item.namaItem}</td>
                              <td className="px-2 py-1.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${WARNA_KAT[item.kategori] ?? "bg-slate-700/60 text-slate-400"}`}>{item.kategori}</span>
                              </td>
                              <td className="px-2 py-1.5 text-slate-300">{item.durasiHari}H</td>
                              <td className="px-2 py-1.5 text-blue-300">M{item.startMinggu}</td>
                              <td className="px-2 py-1.5 text-blue-300">M{item.endMinggu}</td>
                              <td className="px-2 py-1.5 text-orange-300">{item.bobot}%</td>
                              <td className="px-2 py-1.5 text-slate-500">{item.predecessor || "—"}</td>
                              <td className="px-2 py-1.5">{item.milestone && <span className="text-yellow-400 text-xs">★ Milestone</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">H = hari kalender. M = minggu ke-</p>
                  </div>
                )
              },
              {
                key: "milestone", label: "Milestone Proyek",
                content: (
                  <div className="space-y-2">
                    {hasil.milestone.map((m, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-800/60 rounded-lg p-2">
                        <div className="bg-yellow-600/30 border border-yellow-500/40 rounded px-2 py-1 text-yellow-300 text-xs font-bold shrink-0">M{m.minggu}</div>
                        <div>
                          <div className="text-white text-sm font-medium">★ {m.nama}</div>
                          <div className="text-slate-400 text-xs">{m.keterangan}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "kurvas", label: "Kurva S — Bobot Kumulatif (%)",
                content: (
                  <div>
                    <div className="flex gap-1 flex-wrap mb-2">
                      {hasil.kurvaS.map((v, i) => (
                        <div key={i} className="text-center">
                          <div className="text-xs text-slate-500">M{i + 1}</div>
                          <div className="text-xs text-blue-300 font-mono">{v}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="h-16 bg-slate-800/40 rounded-lg relative overflow-hidden">
                      <svg className="w-full h-full" viewBox={`0 0 ${hasil.kurvaS.length * 30} 60`} preserveAspectRatio="none">
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="2"
                          points={hasil.kurvaS.map((v, i) => `${i * 30 + 15},${60 - (v / 100) * 55}`).join(" ")} />
                        <polyline fill="rgba(59,130,246,0.1)" stroke="none"
                          points={`15,60 ${hasil.kurvaS.map((v, i) => `${i * 30 + 15},${60 - (v / 100) * 55}`).join(" ")} ${(hasil.kurvaS.length - 1) * 30 + 15},60`} />
                      </svg>
                    </div>
                  </div>
                )
              },
              {
                key: "catatan", label: "Catatan & Asumsi",
                content: (
                  <div className="space-y-3">
                    <div>
                      <div className="text-slate-300 text-xs font-medium mb-1">Catatan Penting</div>
                      <ul className="space-y-0.5">{hasil.catatanPenting.map((c, i) => <li key={i} className="text-slate-400 text-xs">• {c}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-slate-300 text-xs font-medium mb-1">Asumsi</div>
                      <ul className="space-y-0.5">{hasil.asumssi.map((a, i) => <li key={i} className="text-slate-400 text-xs">• {a}</li>)}</ul>
                    </div>
                  </div>
                )
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
          </div>
        )}
      </div>
    </div>
  );
}
