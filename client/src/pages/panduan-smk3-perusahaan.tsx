import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShieldCheck, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const SKALA_PERUSAHAAN = [
  "Kecil — < 100 pekerja",
  "Menengah — 100–500 pekerja",
  "Besar — 500–5.000 pekerja",
  "Sangat Besar — > 5.000 pekerja",
];

const BIDANG_USAHA = [
  "Kontraktor Jasa Konstruksi (Gedung)",
  "Kontraktor Jasa Konstruksi (Sipil/Jalan)",
  "Kontraktor Spesialis (MEP/Pondasi/Struktur Baja)",
  "Konsultan Pengawas / MK",
  "Developer / Pengembang Properti",
  "Industri Manufaktur",
  "Pertambangan & Energi",
  "Minyak & Gas (Migas)",
  "Ketenagalistrikan (PLN/IPP)",
  "Logistik & Pengiriman",
];

const TARGET_SERTIFIKASI = [
  "PP No. 50 Tahun 2012 (SMK3 Nasional)",
  "ISO 45001:2018 (OHSMS Internasional)",
  "PP 50 + ISO 45001 (keduanya)",
  "CSMS Pertamina Level 1/2/3",
];

interface Elemen {
  nomor: string;
  nama: string;
  subElemen: string[];
  dokumenWajib: string[];
  catatanImplementasi: string;
}

interface HasilSMK3 {
  judul: string;
  ringkasan: string;
  elemenUtama: Elemen[];
  jalurSertifikasi: { tahap: number; nama: string; deskripsi: string; durasi: string }[];
  checklistKesiapan: { kategori: string; item: string; bobot: string }[];
  sumberDayaDibutuhkan: { posisi: string; kualifikasi: string; jumlah: string }[];
  jadwalImplementasi: { bulan: string; kegiatan: string[] }[];
  biayaEstimasi: string;
}

export default function PanduanSMK3Perusahaan() {
  const [skala, setSkala] = useState(SKALA_PERUSAHAAN[1]);
  const [bidang, setBidang] = useState(BIDANG_USAHA[0]);
  const [target, setTarget] = useState(TARGET_SERTIFIKASI[0]);
  const [kondisi, setKondisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilSMK3 | null>(null);
  const [expanded, setExpanded] = useState<string | null>("elemen");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-smk3-perusahaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skala, bidang, target, kondisi }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  function copyChecklist() {
    if (!hasil) return;
    const text = hasil.checklistKesiapan.map(c => `□ [${c.bobot}] ${c.kategori}: ${c.item}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan Implementasi SMK3 Perusahaan</h1>
              <p className="text-slate-400 text-sm">Roadmap SMK3 PP 50/2012 & ISO 45001:2018 — elemen, dokumen wajib, jalur sertifikasi, SDM, jadwal, estimasi biaya</p>
            </div>
            <Badge className="ml-auto bg-purple-500/15 text-purple-400 border-purple-500/30">Gelombang 25</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Skala Perusahaan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={skala} onChange={e => setSkala(e.target.value)}>
                {SKALA_PERUSAHAAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Bidang Usaha *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={bidang} onChange={e => setBidang(e.target.value)}>
                {BIDANG_USAHA.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Target Sertifikasi</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={target} onChange={e => setTarget(e.target.value)}>
                {TARGET_SERTIFIKASI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kondisi SMK3 Saat Ini (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: belum ada P2K3, sudah ada SOP dasar, pernah audit internal" value={kondisi} onChange={e => setKondisi(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun panduan SMK3...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan SMK3</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun panduan implementasi SMK3...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <h2 className="text-white font-bold">{hasil.judul}</h2>
            <p className="text-slate-400 text-sm">{hasil.ringkasan}</p>

            {[
              {
                key: "elemen", label: "Elemen-Elemen SMK3 yang Harus Diimplementasikan",
                content: (
                  <div className="space-y-3">
                    {hasil.elemenUtama.map((e, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-purple-700 text-white text-xs font-bold px-1.5 py-0.5 rounded">{e.nomor}</span>
                          <span className="text-purple-200 font-medium text-sm">{e.nama}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {e.subElemen.map((s, j) => <span key={j} className="bg-slate-700/60 text-slate-300 text-xs px-2 py-0.5 rounded">• {s}</span>)}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {e.dokumenWajib.map((d, j) => <span key={j} className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded">📄 {d}</span>)}
                        </div>
                        <div className="text-slate-400 text-xs">{e.catatanImplementasi}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "jalur", label: "Jalur & Tahapan Sertifikasi",
                content: (
                  <div className="space-y-2">
                    {hasil.jalurSertifikasi.map((j, i) => (
                      <div key={i} className="flex gap-3 items-start bg-slate-800/60 rounded-lg p-3">
                        <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{j.tahap}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-purple-200 font-medium text-sm">{j.nama}</div>
                            <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/40 text-xs">{j.durasi}</Badge>
                          </div>
                          <p className="text-slate-300 text-xs mt-0.5">{j.deskripsi}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "checklist", label: "Checklist Kesiapan SMK3",
                content: (
                  <div>
                    <Button onClick={copyChecklist} variant="outline" size="sm" className="border-slate-600 text-slate-300 mb-3">
                      {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? "Tersalin!" : "Salin Checklist"}
                    </Button>
                    <div className="space-y-1.5">
                      {hasil.checklistKesiapan.map((c, i) => (
                        <div key={i} className="flex gap-2 items-start text-xs bg-slate-800/40 rounded p-2">
                          <span className="text-purple-400 shrink-0">□</span>
                          <div>
                            <span className="text-slate-400 text-xs">[{c.kategori}]</span>
                            <span className="text-slate-200 text-xs ml-1">{c.item}</span>
                            <Badge className={`ml-1 text-xs ${c.bobot === "Wajib" ? "bg-red-900/30 text-red-300 border-red-500/30" : "bg-yellow-900/30 text-yellow-300 border-yellow-500/30"}`}>{c.bobot}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              },
              {
                key: "sdm", label: "Sumber Daya Manusia yang Dibutuhkan",
                content: (
                  <div className="space-y-2">
                    {hasil.sumberDayaDibutuhkan.map((s, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-2 flex items-start gap-3 text-xs">
                        <div className="text-purple-300 font-medium w-32 shrink-0">{s.posisi}</div>
                        <div className="text-slate-400 flex-1">{s.kualifikasi}</div>
                        <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/30 shrink-0">{s.jumlah}</Badge>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "jadwal", label: "Jadwal Implementasi",
                content: (
                  <div className="space-y-2">
                    {hasil.jadwalImplementasi.map((j, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-2">
                        <div className="text-purple-300 text-xs font-medium mb-1">{j.bulan}</div>
                        <ul className="space-y-0.5">{j.kegiatan.map((k, j2) => <li key={j2} className="text-slate-300 text-xs">• {k}</li>)}</ul>
                      </div>
                    ))}
                    {hasil.biayaEstimasi && (
                      <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-3 mt-2">
                        <div className="text-amber-300 text-xs font-medium">💰 Estimasi Biaya Implementasi</div>
                        <div className="text-white text-sm font-bold mt-0.5">{hasil.biayaEstimasi}</div>
                      </div>
                    )}
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
