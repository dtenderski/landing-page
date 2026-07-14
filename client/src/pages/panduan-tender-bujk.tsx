import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Gavel, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_TENDER = [
  "Tender Pemerintah — Pengadaan Barang/Jasa (LPSE/SIKAP)",
  "Tender Pemerintah — Pekerjaan Konstruksi (APBN/APBD)",
  "Tender Pemerintah — Jasa Konsultansi Konstruksi",
  "Tender Swasta — Bangunan Gedung Komersial",
  "Tender Swasta — Infrastruktur / Industri",
  "Tender BUMN/BUMD",
  "Penunjukan Langsung (PL) / Negosiasi",
  "Tender EPC (Engineering Procurement Construction)",
  "Tender Design & Build",
];

const NILAI_PEKERJAAN = [
  "< Rp 200 Juta (Pengadaan Langsung)",
  "Rp 200 Juta – Rp 2,5 Miliar",
  "Rp 2,5 Miliar – Rp 50 Miliar",
  "Rp 50 Miliar – Rp 100 Miliar",
  "> Rp 100 Miliar (Besar)",
];

interface TahapanTender {
  tahap: string;
  deskripsi: string;
  dokumenDibutuhkan: string[];
  tipsPenting: string;
  waktu: string;
}

interface HasilPanduanTender {
  judul: string;
  ringkasan: string;
  dasarHukum: string[];
  prasyaratPeserta: string[];
  tahapan: TahapanTender[];
  dokumenAdministrasi: string[];
  dokumenTeknis: string[];
  strategiPemenangan: string[];
  kesalahanUmum: { kesalahan: string; solusi: string }[];
  totalEstimasiWaktu: string;
}

export default function PanduanTenderBUJK() {
  const [jenisTender, setJenisTender] = useState(JENIS_TENDER[0]);
  const [nilaiPekerjaan, setNilaiPekerjaan] = useState(NILAI_PEKERJAAN[1]);
  const [klasifikasiBUJK, setKlasifikasiBUJK] = useState("");
  const [kondisiKhusus, setKondisiKhusus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilPanduanTender | null>(null);
  const [expanded, setExpanded] = useState<string | null>("tahapan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-tender-bujk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisTender, nilaiPekerjaan, klasifikasiBUJK, kondisiKhusus }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { /**/ } finally { setLoading(false); }
  }

  const toggle = (s: string) => setExpanded(expanded === s ? null : s);

  function copyAll() {
    if (!hasil) return;
    const text = [hasil.judul, hasil.ringkasan, "", "TAHAPAN:", ...hasil.tahapan.map((t, i) => `${i+1}. ${t.tahap} (${t.waktu})\n   ${t.deskripsi}`)].join("\n");
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
              <Gavel className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan Proses Tender BUJK</h1>
              <p className="text-slate-400 text-sm">Panduan lengkap mengikuti tender konstruksi: tahapan, dokumen, strategi, kesalahan umum</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 22</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Tender *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisTender} onChange={e => setJenisTender(e.target.value)}>
                {JENIS_TENDER.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Pekerjaan</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={nilaiPekerjaan} onChange={e => setNilaiPekerjaan(e.target.value)}>
                {NILAI_PEKERJAAN.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Klasifikasi BUJK / SBU</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: BG001 Gedung, BS001 Jalan, K2 Kualifikasi" value={klasifikasiBUJK} onChange={e => setKlasifikasiBUJK(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kondisi / Persyaratan Khusus</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: tender cepat 7 hari, wajib KD tertentu, joint operation, dsb" value={kondisiKhusus} onChange={e => setKondisiKhusus(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun Panduan...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan Tender</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun panduan tender BUJK...</p>
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
                key: "prasyarat", label: "Prasyarat Peserta Tender",
                content: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {hasil.prasyaratPeserta.map((p, i) => <div key={i} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" /><span className="text-slate-300">{p}</span></div>)}
                  </div>
                )
              },
              {
                key: "tahapan", label: "Tahapan Proses Tender",
                content: (
                  <div className="space-y-3">
                    {hasil.tahapan.map((t, i) => (
                      <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-xs text-orange-300 font-bold shrink-0">{i+1}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium text-sm">{t.tahap}</span>
                              <span className="text-orange-300 text-xs">{t.waktu}</span>
                            </div>
                            <p className="text-slate-300 text-xs mb-2">{t.deskripsi}</p>
                            {t.tipsPenting && <div className="text-amber-300 text-xs mb-2">💡 {t.tipsPenting}</div>}
                            <div>
                              <div className="text-slate-400 text-xs mb-1">Dokumen dibutuhkan:</div>
                              <ul className="space-y-0.5">{t.dokumenDibutuhkan.map((d, j) => <li key={j} className="text-slate-300 text-xs">• {d}</li>)}</ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "dokumen", label: "Checklist Dokumen",
                content: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-orange-300 text-xs font-medium mb-2">DOKUMEN ADMINISTRASI</div>
                      {hasil.dokumenAdministrasi.map((d, i) => <div key={i} className="flex gap-1.5 text-sm mb-1"><span className="text-orange-400">□</span><span className="text-slate-300 text-xs">{d}</span></div>)}
                    </div>
                    <div>
                      <div className="text-blue-300 text-xs font-medium mb-2">DOKUMEN TEKNIS</div>
                      {hasil.dokumenTeknis.map((d, i) => <div key={i} className="flex gap-1.5 text-sm mb-1"><span className="text-blue-400">□</span><span className="text-slate-300 text-xs">{d}</span></div>)}
                    </div>
                  </div>
                )
              },
              {
                key: "strategi", label: "Strategi Pemenangan Tender",
                content: <ul className="space-y-1">{hasil.strategiPemenangan.map((s, i) => <li key={i} className="text-slate-300 text-sm">• {s}</li>)}</ul>
              },
              {
                key: "kesalahan", label: "Kesalahan Umum & Cara Menghindari",
                content: (
                  <div className="space-y-2">
                    {hasil.kesalahanUmum.map((k, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-red-400 text-xs font-medium mb-1">⚠ {k.kesalahan}</div>
                        <div className="text-green-300 text-xs">✓ {k.solusi}</div>
                      </div>
                    ))}
                  </div>
                )
              },
            ].map(section => (
              <div key={section.key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => toggle(section.key)} className="w-full flex items-center justify-between px-5 py-3 text-white font-semibold hover:bg-slate-800/40 transition-colors">
                  <span>{section.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded === section.key ? "rotate-180" : ""}`} />
                </button>
                {expanded === section.key && <div className="px-5 pb-4">{section.content}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
