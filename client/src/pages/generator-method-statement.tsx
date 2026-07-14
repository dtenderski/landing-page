import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, FileText, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PEKERJAAN = [
  "Pekerjaan Pondasi Dalam (Bored Pile / Sheet Pile)",
  "Pekerjaan Galian & Dewatering",
  "Pekerjaan Beton Struktural (Kolom, Balok, Pelat)",
  "Pekerjaan Bekisting & Perancah",
  "Pekerjaan Pembesian & Beton Pratekan",
  "Pekerjaan Dinding Penahan Tanah",
  "Pekerjaan Perkerasan Jalan (AC-WC/BC/Base)",
  "Pekerjaan Jembatan (Girder Precast / CIP)",
  "Pekerjaan Instalasi MEP (Mekanikal-Elektrikal)",
  "Pekerjaan Fasad & Curtain Wall",
  "Pekerjaan Waterproofing & Insulasi",
  "Pekerjaan Demolisi & Pembongkaran",
  "Pekerjaan Commissioning & Testing",
  "Pekerjaan Lainnya",
];

const RISIKO_OPTIONS = [
  "Risiko tinggi (adjacent to existing structure/utilities)",
  "Risiko sedang (general site conditions)",
  "Risiko rendah (open site, no constraints)",
];

interface HasilMethodStatement {
  judul: string;
  lingkupPekerjaan: string;
  tujuanDanAcuan: string[];
  personelDanPeralatan: { jabatan: string; tugas: string }[];
  tahapanPekerjaan: { urutan: number; aktivitas: string; durasi: string; pic: string; catatan: string }[];
  k3DanLingkungan: string[];
  qcDanInspeksi: { tahap: string; parameter: string; alat: string; frekuensi: string }[];
  contingency: string[];
  kesimpulan: string;
}

export default function GeneratorMethodStatement() {
  const [jenisPekerjaan, setJenisPekerjaan] = useState(JENIS_PEKERJAAN[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [volume, setVolume] = useState("");
  const [durasi, setDurasi] = useState("");
  const [risikoLevel, setRisikoLevel] = useState(RISIKO_OPTIONS[1]);
  const [spesifikasi, setSpesifikasi] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilMethodStatement | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("tahapan");

  async function generate() {
    if (!namaProyek.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/method-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPekerjaan, namaProyek, lokasi, volume, durasi, risikoLevel, spesifikasi }),
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
    const text = `METHOD STATEMENT: ${hasil.judul}\n\nLINGKUP PEKERJAAN\n${hasil.lingkupPekerjaan}\n\nTAHAPAN PELAKSANAAN\n${hasil.tahapanPekerjaan.map(t => `${t.urutan}. ${t.aktivitas} (${t.durasi}) - PIC: ${t.pic}\n   ${t.catatan}`).join("\n")}\n\nK3 & LINGKUNGAN\n${hasil.k3DanLingkungan.map(k => `• ${k}`).join("\n")}\n\nQC & INSPEKSI\n${hasil.qcDanInspeksi.map(q => `• ${q.tahap}: ${q.parameter} (${q.frekuensi})`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator Metode Kerja (Method Statement)</h1>
              <p className="text-slate-400 text-sm">Pilih jenis pekerjaan → AI generate method statement formal sesuai standar konstruksi</p>
            </div>
            <Badge className="ml-auto bg-blue-500/15 text-blue-400 border-blue-500/30">Gelombang 20</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pekerjaan *</label>
              <select
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPekerjaan}
                onChange={e => setJenisPekerjaan(e.target.value)}
              >
                {JENIS_PEKERJAAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Kantor PT XYZ"
                value={namaProyek}
                onChange={e => setNamaProyek(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Lokasi Proyek</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Jl. Gatot Subroto, Jakarta Selatan"
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Volume / Kuantitas</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 450 m³ beton, 120 titik bored pile"
                value={volume}
                onChange={e => setVolume(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Durasi Pelaksanaan</label>
              <input
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 45 hari kalender"
                value={durasi}
                onChange={e => setDurasi(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Level Risiko Site</label>
              <select
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={risikoLevel}
                onChange={e => setRisikoLevel(e.target.value)}
              >
                {RISIKO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Spesifikasi / Catatan Khusus</label>
              <textarea
                rows={2}
                className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 resize-none"
                placeholder="cth: mutu beton fc'30, tebal pelat 15cm, ada existing pile cap, dekat jalan utama..."
                value={spesifikasi}
                onChange={e => setSpesifikasi(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={generate}
              disabled={loading || !namaProyek.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Method Statement...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Method Statement</>}
            </Button>
            {hasil && (
              <Button onClick={() => { setHasil(null); }} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {!hasil && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {[
              { label: "Pekerjaan Galian", sub: "Galian & Dewatering", jp: JENIS_PEKERJAAN[1] },
              { label: "Beton Struktural", sub: "Kolom, Balok, Pelat", jp: JENIS_PEKERJAAN[2] },
              { label: "Bekisting & Perancah", sub: "Formwork & Scaffolding", jp: JENIS_PEKERJAAN[3] },
              { label: "Perkerasan Jalan", sub: "AC-WC/BC/Base", jp: JENIS_PEKERJAAN[6] },
              { label: "Demolisi", sub: "Bongkar existing", jp: JENIS_PEKERJAAN[11] },
              { label: "Commissioning", sub: "Testing & trial run", jp: JENIS_PEKERJAAN[12] },
            ].map(s => (
              <button key={s.label} onClick={() => setJenisPekerjaan(s.jp)}
                className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3 text-left hover:border-blue-500/50 transition-colors">
                <div className="text-white text-sm font-medium">{s.label}</div>
                <div className="text-slate-500 text-xs">{s.sub}</div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun method statement formal…</p>
            <p className="text-slate-500 text-sm mt-1">Tahapan, K3, QC & contingency plan</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">{hasil.judul}</h2>
              <Button onClick={copyAll} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-blue-300 font-semibold mb-2">Lingkup Pekerjaan</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{hasil.lingkupPekerjaan}</p>
            </div>

            {[
              {
                key: "acuan", label: "Tujuan & Acuan Regulasi",
                content: <ul className="space-y-1">{hasil.tujuanDanAcuan.map((a, i) => <li key={i} className="text-slate-300 text-sm">• {a}</li>)}</ul>
              },
              {
                key: "personel", label: "Personel & Peralatan",
                content: (
                  <div className="space-y-2">
                    {hasil.personelDanPeralatan.map((p, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-blue-300 font-medium min-w-[180px]">{p.jabatan}</span>
                        <span className="text-slate-300">{p.tugas}</span>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "tahapan", label: "Tahapan Pelaksanaan",
                content: (
                  <div className="space-y-3">
                    {hasil.tahapanPekerjaan.map(t => (
                      <div key={t.urutan} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs text-blue-300 font-bold shrink-0">{t.urutan}</div>
                        <div>
                          <div className="text-white text-sm font-medium">{t.aktivitas}</div>
                          <div className="text-slate-400 text-xs mt-0.5">Durasi: {t.durasi} · PIC: {t.pic}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{t.catatan}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "k3", label: "K3 & Pengelolaan Lingkungan",
                content: <ul className="space-y-1">{hasil.k3DanLingkungan.map((k, i) => <li key={i} className="text-slate-300 text-sm">• {k}</li>)}</ul>
              },
              {
                key: "qc", label: "Rencana QC & Inspeksi",
                content: (
                  <div className="space-y-2">
                    {hasil.qcDanInspeksi.map((q, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-white text-sm font-medium">{q.tahap}</div>
                        <div className="text-slate-400 text-xs mt-1">Parameter: {q.parameter} · Alat: {q.alat} · {q.frekuensi}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "contingency", label: "Contingency Plan",
                content: <ul className="space-y-1">{hasil.contingency.map((c, i) => <li key={i} className="text-slate-300 text-sm">• {c}</li>)}</ul>
              },
            ].map(section => (
              <div key={section.key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggle(section.key)} className="w-full flex items-center justify-between px-5 py-3 text-white font-semibold hover:bg-slate-800/40 transition-colors">
                  <span>{section.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSection === section.key ? "rotate-180" : ""}`} />
                </button>
                {expandedSection === section.key && (
                  <div className="px-5 pb-4">{section.content}</div>
                )}
              </div>
            ))}

            <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-300 text-sm">{hasil.kesimpulan}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
