import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Globe, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PERIZINAN = [
  "NIB — Nomor Induk Berusaha (baru/pertama kali)",
  "SBU Jasa Konstruksi (Sertifikat Badan Usaha)",
  "IUJK — Izin Usaha Jasa Konstruksi (perpanjangan)",
  "LKUT — Laporan Keuangan Usaha Tahunan",
  "SIUJK Nasional (tender proyek pemerintah)",
  "Perizinan Berusaha Berbasis Risiko (PB UMKU)",
  "Izin Lingkungan (UKL-UPL / SPPL / AMDAL)",
  "Izin Mendirikan Bangunan (IMB/PBG)",
  "Pengembang Real Estate / Developer",
  "Kontraktor Spesialis / Subkontraktor",
];

const BENTUK_BADAN_USAHA = [
  "PT — Perseroan Terbatas",
  "CV — Commanditaire Vennootschap",
  "Firma",
  "Koperasi",
  "Badan Usaha Milik Daerah (BUMD)",
];

const KBLI_KONSTRUKSI = [
  "41011 — Konstruksi Gedung Hunian",
  "41012 — Konstruksi Gedung Perkantoran",
  "41019 — Konstruksi Gedung Lainnya",
  "42101 — Konstruksi Jalan Raya",
  "42201 — Konstruksi Jaringan Irigasi",
  "42913 — Konstruksi Bangunan Pelabuhan",
  "43291 — Instalasi Kelistrikan Konstruksi",
  "71101 — Jasa Arsitektur",
  "71102 — Jasa Rekayasa",
  "71103 — Jasa Konsultansi Manajemen Konstruksi",
];

interface HasilOSS {
  judul: string;
  ringkasan: string;
  prasyarat: string[];
  tahapan: { nomor: number; nama: string; platform: string; deskripsi: string; dokumen: string[]; estimasiWaktu: string; tips: string }[];
  dokumenDibutuhkan: { kategori: string; dokumen: string[] }[];
  checklistVerifikasi: { item: string; keterangan: string }[];
  masalahUmum: { masalah: string; solusi: string }[];
  kontakDukungan: string[];
}

export default function PanduanOSSPerizinan() {
  const [jenisPerizinan, setJenisPerizinan] = useState(JENIS_PERIZINAN[0]);
  const [bentukBU, setBentukBU] = useState(BENTUK_BADAN_USAHA[0]);
  const [kbli, setKbli] = useState(KBLI_KONSTRUKSI[0]);
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilOSS | null>(null);
  const [expanded, setExpanded] = useState<string | null>("tahapan");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-oss-perizinan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisPerizinan, bentukBU, kbli, namaPerusahaan }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  const toggle = (s: string) => setExpanded(expanded === s ? null : s);

  function copyChecklist() {
    if (!hasil) return;
    const text = hasil.checklistVerifikasi.map(c => `□ ${c.item} — ${c.keterangan}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sections = [
    {
      key: "tahapan", label: "Tahapan Proses Perizinan",
      content: (
        <div className="space-y-3">
          {hasil?.tahapan.map((t, i) => (
            <div key={i} className="bg-slate-800/60 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.nomor}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-emerald-300 font-medium text-sm">{t.nama}</div>
                    <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/40 text-xs">{t.platform}</Badge>
                    <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/30 text-xs">{t.estimasiWaktu}</Badge>
                  </div>
                  <p className="text-slate-300 text-xs mb-2">{t.deskripsi}</p>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {t.dokumen.map((d, j) => <span key={j} className="bg-slate-700/60 text-slate-300 text-xs px-2 py-0.5 rounded">📄 {d}</span>)}
                  </div>
                  {t.tips && <div className="text-yellow-400 text-xs mt-1">💡 {t.tips}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      key: "dokumen", label: "Dokumen yang Dibutuhkan",
      content: (
        <div className="space-y-3">
          {hasil?.dokumenDibutuhkan.map((d, i) => (
            <div key={i}>
              <div className="text-emerald-300 text-xs font-medium mb-1">{d.kategori}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {d.dokumen.map((doc, j) => <div key={j} className="flex gap-1.5 text-xs"><span className="text-emerald-400">□</span><span className="text-slate-300">{doc}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      key: "checklist", label: "Checklist Verifikasi Mandiri",
      content: (
        <div>
          <Button onClick={copyChecklist} variant="outline" size="sm" className="border-slate-600 text-slate-300 mb-3">
            {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Tersalin!" : "Salin Checklist"}
          </Button>
          <div className="space-y-1.5">
            {hasil?.checklistVerifikasi.map((c, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-emerald-400 text-xs mt-0.5">□</span>
                <div>
                  <span className="text-slate-200 text-xs font-medium">{c.item}</span>
                  <span className="text-slate-400 text-xs ml-1">— {c.keterangan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      key: "masalah", label: "Masalah Umum & Solusi",
      content: (
        <div className="space-y-2">
          {hasil?.masalahUmum.map((m, i) => (
            <div key={i} className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-orange-400 text-xs font-medium">⚠ {m.masalah}</div>
              <div className="text-green-300 text-xs mt-0.5">✓ {m.solusi}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      key: "kontak", label: "Kontak & Dukungan",
      content: <ul className="space-y-1">{hasil?.kontakDukungan.map((k, i) => <li key={i} className="text-slate-300 text-sm">• {k}</li>)}</ul>
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Globe className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan OSS-RBA & Perizinan Usaha Konstruksi</h1>
              <p className="text-slate-400 text-sm">Panduan lengkap: NIB, SBU, IUJK, LKUT, PBG/IMB — melalui sistem OSS-RBA BKPM</p>
            </div>
            <Badge className="ml-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Gelombang 24</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Perizinan yang Dituju *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPerizinan} onChange={e => setJenisPerizinan(e.target.value)}>
                {JENIS_PERIZINAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Bentuk Badan Usaha</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={bentukBU} onChange={e => setBentukBU(e.target.value)}>
                {BENTUK_BADAN_USAHA.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Kode KBLI Utama</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={kbli} onChange={e => setKbli(e.target.value)}>
                {KBLI_KONSTRUKSI.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Perusahaan (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="PT Nama Perusahaan" value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun panduan perizinan...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan Perizinan</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun panduan perizinan OSS-RBA...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <div>
              <h2 className="text-white font-bold">{hasil.judul}</h2>
              <p className="text-slate-400 text-sm mt-1">{hasil.ringkasan}</p>
            </div>
            {hasil.prasyarat.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                <div className="text-blue-300 text-sm font-medium mb-2">📋 Prasyarat Utama</div>
                <ul className="space-y-1">{hasil.prasyarat.map((p, i) => <li key={i} className="text-slate-300 text-sm">• {p}</li>)}</ul>
              </div>
            )}
            {sections.map(s => (
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
