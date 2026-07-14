import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Building2, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PERMOHONAN = [
  "PBG Baru — Bangunan Gedung Fungsi Hunian",
  "PBG Baru — Bangunan Gedung Fungsi Komersial/Perkantoran",
  "PBG Baru — Bangunan Gedung Industri/Gudang",
  "PBG Baru — Bangunan Gedung Campuran (Mixed Use)",
  "PBG Renovasi / Perubahan Fungsi",
  "PBG Prasarana (Tower Telekomunikasi/SPBU/PLTS)",
  "SLF Pertama (Bangunan Baru Selesai Dibangun)",
  "SLF Perpanjangan / Pembaruan",
  "SLF Pasca Renovasi",
  "Konsultasi: Kedua-duanya PBG + SLF",
];

const LOKASI_PERUNTUKAN = [
  "DKI Jakarta",
  "Kota Besar Lainnya (Surabaya/Bandung/Medan/Makassar/dll)",
  "Kabupaten/Kota Menengah",
  "Kawasan Industri / KEK",
  "Daerah Khusus / Cagar Budaya",
];

interface TahapanPerizinan {
  tahap: string;
  kegiatan: string;
  dokumenDibutuhkan: string[];
  instansi: string;
  estimasiWaktu: string;
  catatan: string;
}

interface HasilPanduan {
  judul: string;
  ringkasan: string;
  dasarHukum: string[];
  prasyarat: string[];
  tahapan: TahapanPerizinan[];
  dokumenLengkap: string[];
  biayaRetribusi: string;
  tipsPercepatan: string[];
  masalahUmum: { masalah: string; solusi: string }[];
  totalEstimasiWaktu: string;
}

export default function PanduanPBGSLF() {
  const [jenisPermohonan, setJenisPermohonan] = useState(JENIS_PERMOHONAN[0]);
  const [lokasiPeruntukan, setLokasiPeruntukan] = useState(LOKASI_PERUNTUKAN[0]);
  const [luasBangunan, setLuasBangunan] = useState("");
  const [jumlahLantai, setJumlahLantai] = useState("");
  const [kondisiSite, setKondisiSite] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilPanduan | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("tahapan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-pbg-slf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPermohonan, lokasiPeruntukan, luasBangunan, jumlahLantai, kondisiSite }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch {
      setHasil(null);
    } finally {
      setLoading(false);
    }
  }

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  function copyAll() {
    if (!hasil) return;
    const text = [
      hasil.judul,
      hasil.ringkasan,
      "",
      "DASAR HUKUM",
      ...hasil.dasarHukum.map(d => `• ${d}`),
      "",
      "TAHAPAN PERIZINAN",
      ...hasil.tahapan.map((t, i) => `${i + 1}. ${t.tahap}\n   Instansi: ${t.instansi}\n   Waktu: ${t.estimasiWaktu}\n   Dokumen: ${t.dokumenDibutuhkan.join(", ")}`),
      "",
      `Total Estimasi Waktu: ${hasil.totalEstimasiWaktu}`,
      "",
      "TIPS PERCEPATAN",
      ...hasil.tipsPercepatan.map(t => `• ${t}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Building2 className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan PBG & SLF</h1>
              <p className="text-slate-400 text-sm">Panduan lengkap proses Persetujuan Bangunan Gedung & Sertifikat Laik Fungsi</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 21</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Permohonan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPermohonan} onChange={e => setJenisPermohonan(e.target.value)}>
                {JENIS_PERMOHONAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Lokasi / Daerah</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={lokasiPeruntukan} onChange={e => setLokasiPeruntukan(e.target.value)}>
                {LOKASI_PERUNTUKAN.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Luas Bangunan (m²)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 3500 m²" value={luasBangunan} onChange={e => setLuasBangunan(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jumlah Lantai</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 8 lantai + 2 basement" value={jumlahLantai} onChange={e => setJumlahLantai(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kondisi / Catatan Khusus</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: dekat SUTT, zona gempa tinggi, tanah rawa, dll" value={kondisiSite} onChange={e => setKondisiSite(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat Panduan...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan PBG/SLF</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun panduan perizinan PBG/SLF...</p>
            <p className="text-slate-500 text-sm mt-1">Sesuai PP 16/2021 dan Permen PUPR 12/2021</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{hasil.judul}</h2>
                <p className="text-slate-400 text-sm mt-1">{hasil.ringkasan}</p>
              </div>
              <Button onClick={copyAll} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-3 text-center">
                <div className="text-orange-300 font-bold text-lg">{hasil.totalEstimasiWaktu}</div>
                <div className="text-slate-400 text-xs">Estimasi Total Waktu</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
                <div className="text-white font-bold text-lg">{hasil.tahapan.length} Tahap</div>
                <div className="text-slate-400 text-xs">Tahapan Proses</div>
              </div>
            </div>

            {[
              {
                key: "hukum", label: "Dasar Hukum & Regulasi",
                content: <ul className="space-y-1">{hasil.dasarHukum.map((d, i) => <li key={i} className="text-slate-300 text-sm">• {d}</li>)}</ul>
              },
              {
                key: "prasyarat", label: "Prasyarat Sebelum Mengajukan",
                content: <ul className="space-y-1">{hasil.prasyarat.map((p, i) => <li key={i} className="text-slate-300 text-sm flex gap-2"><CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
              },
              {
                key: "tahapan", label: "Tahapan Perizinan",
                content: (
                  <div className="space-y-3">
                    {hasil.tahapan.map((t, i) => (
                      <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-6 h-6 rounded-full bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-xs text-orange-300 font-bold shrink-0">{i + 1}</div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{t.tahap}</div>
                            <div className="text-slate-400 text-xs mt-0.5">Instansi: {t.instansi} · Waktu: {t.estimasiWaktu}</div>
                            {t.catatan && <div className="text-orange-300 text-xs mt-1">ℹ {t.catatan}</div>}
                          </div>
                        </div>
                        <div className="ml-9">
                          <div className="text-slate-400 text-xs font-medium mb-1">Dokumen Dibutuhkan:</div>
                          <ul className="space-y-0.5">{t.dokumenDibutuhkan.map((d, j) => <li key={j} className="text-slate-300 text-xs">• {d}</li>)}</ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "dokumen", label: "Checklist Dokumen Lengkap",
                content: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {hasil.dokumenLengkap.map((d, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-orange-400 shrink-0">□</span>
                        <span className="text-slate-300">{d}</span>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "tips", label: "Tips Percepatan Proses",
                content: <ul className="space-y-1">{hasil.tipsPercepatan.map((t, i) => <li key={i} className="text-slate-300 text-sm">• {t}</li>)}</ul>
              },
              {
                key: "masalah", label: "Masalah Umum & Solusi",
                content: (
                  <div className="space-y-2">
                    {hasil.masalahUmum.map((m, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-red-400 text-xs font-medium mb-1">⚠ {m.masalah}</div>
                        <div className="text-green-300 text-xs">✓ {m.solusi}</div>
                      </div>
                    ))}
                  </div>
                )
              },
            ].map(section => (
              <div key={section.key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggle(section.key)} className="w-full flex items-center justify-between px-5 py-3 text-white font-semibold hover:bg-slate-800/40 transition-colors">
                  <span>{section.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSection === section.key ? "rotate-180" : ""}`} />
                </button>
                {expandedSection === section.key && <div className="px-5 pb-4">{section.content}</div>}
              </div>
            ))}

            <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-4">
              <h3 className="text-orange-300 font-semibold mb-1">Estimasi Retribusi</h3>
              <p className="text-slate-300 text-sm">{hasil.biayaRetribusi}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
