import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Building2, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_BANGUNAN = [
  "Rumah Tinggal Sederhana (≤ 36 m²)",
  "Rumah Tinggal Menengah (36–200 m²)",
  "Rumah Tinggal Mewah (> 200 m²)",
  "Bangunan Komersial / Ruko",
  "Gedung Perkantoran",
  "Gedung Industri / Pabrik",
  "Fasilitas Kesehatan (Klinik/RS)",
  "Fasilitas Pendidikan (Sekolah/Kampus)",
  "Fasilitas Ibadah (Masjid/Gereja/dll)",
  "Pergudangan & Logistik",
  "Hotel & Penginapan",
  "Bangunan Khusus (Menara/Silo/dll)",
];

const STATUS_LAHAN = [
  "Tanah milik sendiri (SHM)",
  "Tanah HGB (Hak Guna Bangunan)",
  "Tanah kaveling developer (SHGB perorangan)",
  "Tanah sewa jangka panjang",
  "Tanah negara (HPL/Hak Pakai)",
];

const WILAYAH = [
  "DKI Jakarta",
  "Kota Besar (Surabaya/Bandung/Medan/Makassar)",
  "Kota Sedang (Kabupaten/Kota di Pulau Jawa)",
  "Daerah Terpencil (luar Jawa)",
];

interface TahapPBG {
  urutan: number;
  nama: string;
  deskripsi: string;
  durasi: string;
  dokumen: string[];
  instansi: string;
  referensiPasal: string;
}

interface HasilPBG {
  judulPanduan: string;
  dasarHukum: string[];
  perbedaanIMBvsPBG: string;
  tahapan: TahapPBG[];
  dokumenTeknis: { nama: string; keterangan: string; wajib: boolean }[];
  biayaRetribusi: string;
  syaratKhusus: string[];
  kesalahanUmum: { kesalahan: string; akibat: string }[];
  estimasiWaktu: string;
  tips: string[];
}

export default function PanduanPBGIMB() {
  const [jenisBangunan, setJenisBangunan] = useState(JENIS_BANGUNAN[1]);
  const [statusLahan, setStatusLahan] = useState(STATUS_LAHAN[0]);
  const [wilayah, setWilayah] = useState(WILAYAH[1]);
  const [luasLantai, setLuasLantai] = useState("");
  const [jumlahLantai, setJumlahLantai] = useState("2");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilPBG | null>(null);
  const [expanded, setExpanded] = useState<string | null>("tahapan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-pbg-imb", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisBangunan, statusLahan, wilayah, luasLantai, jumlahLantai }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyDokumen() {
    if (!hasil) return;
    const txt = hasil.dokumenTeknis.map(d => `${d.wajib ? "[WAJIB]" : "[Opsional]"} ${d.nama}: ${d.keterangan}`).join("\n");
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><Building2 className="h-6 w-6 text-emerald-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan Persetujuan Bangunan Gedung (PBG) / IMB</h1>
              <p className="text-slate-400 text-sm">Tahapan pengajuan PBG sesuai PP 16/2021 — dokumen teknis, retribusi, estimasi waktu, tips & kesalahan umum</p>
            </div>
            <Badge className="ml-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Gelombang 27</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Bangunan *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={jenisBangunan} onChange={e => setJenisBangunan(e.target.value)}>
                {JENIS_BANGUNAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Status Lahan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={statusLahan} onChange={e => setStatusLahan(e.target.value)}>
                {STATUS_LAHAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Wilayah</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white" value={wilayah} onChange={e => setWilayah(e.target.value)}>
                {WILAYAH.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Luas Lantai Total (m²)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 150" value={luasLantai} onChange={e => setLuasLantai(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jumlah Lantai</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 2" value={jumlahLantai} onChange={e => setJumlahLantai(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun panduan PBG...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan PBG</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center"><Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-3" /><p className="text-slate-300">Menyusun panduan PBG...</p></div>}

        {hasil && (
          <div className="space-y-3">
            <div>
              <h2 className="text-white font-bold">{hasil.judulPanduan}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-300 text-xs font-medium">⏱ {hasil.estimasiWaktu}</span>
                <span className="text-slate-500 text-xs">|</span>
                <span className="text-amber-300 text-xs">💰 {hasil.biayaRetribusi}</span>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
              <div className="text-blue-300 text-xs font-medium mb-1">Catatan: PBG vs IMB</div>
              <p className="text-slate-300 text-xs">{hasil.perbedaanIMBvsPBG}</p>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="text-slate-300 text-xs font-medium mb-1">Dasar Hukum</div>
              <div className="flex flex-wrap gap-1">{hasil.dasarHukum.map((r, i) => <span key={i} className="bg-emerald-900/30 text-emerald-200 text-xs px-2 py-0.5 rounded">{r}</span>)}</div>
            </div>

            {[
              {
                key: "tahapan", label: "Tahapan Pengajuan PBG",
                content: (
                  <div className="space-y-2">
                    {hasil.tahapan.map((t, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.urutan}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-200 font-medium text-sm">{t.nama}</span>
                              <span className="text-slate-500 text-xs">{t.durasi}</span>
                            </div>
                            <p className="text-slate-300 text-xs mt-0.5">{t.deskripsi}</p>
                            <div className="text-slate-500 text-xs mt-0.5">Instansi: {t.instansi} | Ref: {t.referensiPasal}</div>
                            {t.dokumen.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{t.dokumen.map((d, j) => <span key={j} className="bg-slate-700/60 text-slate-300 text-xs px-1.5 py-0.5 rounded">📄 {d}</span>)}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "dokumen", label: "Dokumen Teknis yang Dibutuhkan",
                content: (
                  <div className="space-y-1.5">
                    <Button onClick={copyDokumen} variant="outline" size="sm" className="border-slate-600 text-slate-300 mb-2">
                      {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Tersalin!" : "Salin Daftar"}
                    </Button>
                    {hasil.dokumenTeknis.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-800/60 rounded p-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${d.wajib ? "bg-red-900/40 text-red-300" : "bg-slate-700/60 text-slate-400"}`}>{d.wajib ? "WAJIB" : "Opsional"}</span>
                        <div>
                          <div className="text-slate-200 text-sm font-medium">{d.nama}</div>
                          <div className="text-slate-400 text-xs">{d.keterangan}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "syarat", label: "Persyaratan Khusus",
                content: <ul className="space-y-1">{hasil.syaratKhusus.map((s, i) => <li key={i} className="text-slate-300 text-xs">• {s}</li>)}</ul>
              },
              {
                key: "kesalahan", label: "Kesalahan Umum & Akibatnya",
                content: (
                  <div className="space-y-2">
                    {hasil.kesalahanUmum.map((k, i) => (
                      <div key={i} className="bg-red-900/15 border border-red-500/20 rounded-lg p-2">
                        <div className="text-orange-300 text-xs font-medium">⚠ {k.kesalahan}</div>
                        <div className="text-red-300 text-xs">Akibat: {k.akibat}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "tips", label: "Tips & Strategi",
                content: <ul className="space-y-1">{hasil.tips.map((t, i) => <li key={i} className="text-slate-300 text-xs">💡 {t}</li>)}</ul>
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
