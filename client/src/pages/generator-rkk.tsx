import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShieldCheck, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_KONTRAK = [
  "Pekerjaan Konstruksi Gedung (APBN/APBD)",
  "Pekerjaan Konstruksi Infrastruktur Jalan & Jembatan",
  "Pekerjaan Konstruksi Irigasi & Sumber Daya Air",
  "Pekerjaan Konstruksi Bangunan Gedung Swasta",
  "Pekerjaan Konstruksi Industri & Pabrik",
  "Pekerjaan Konstruksi EPC (Engineering Procurement Construction)",
  "Pekerjaan Konstruksi Khusus (Terowongan/Pondasi Dalam)",
  "Jasa Konsultansi Konstruksi",
];

const RISIKO_LEVEL = [
  "Rendah — Proyek sederhana < Rp 10 Miliar",
  "Menengah — Proyek sedang Rp 10–100 Miliar",
  "Tinggi — Proyek besar > Rp 100 Miliar atau berisiko tinggi",
];

interface HasilRKK {
  judulRKK: string;
  nomorRKK: string;
  dasarHukum: string[];
  kebijakan: string;
  sasaranK3: string[];
  identifikasiRisiko: { pekerjaan: string; bahaya: string; risiko: string; pengendalian: string; picFrekuensi: string }[];
  rencanaKeselamatan: { program: string; kegiatan: string; target: string; waktu: string; picAnggaran: string }[];
  apd: { item: string; standar: string; jumlah: string; periode: string }[];
  komunikasiK3: string[];
  emergencyResponse: string[];
  dokumenWajib: string[];
}

export default function GeneratorRKK() {
  const [jenisKontrak, setJenisKontrak] = useState(JENIS_KONTRAK[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [risikoLevel, setRisikoLevel] = useState(RISIKO_LEVEL[1]);
  const [jumlahPekerja, setJumlahPekerja] = useState("50");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilRKK | null>(null);
  const [expanded, setExpanded] = useState<string | null>("sasaran");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-rkk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKontrak, namaProyek, nilaiKontrak, risikoLevel, jumlahPekerja }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { /**/ } finally { setLoading(false); }
  }

  const toggle = (s: string) => setExpanded(expanded === s ? null : s);

  function copyAll() {
    if (!hasil) return;
    const text = [hasil.judulRKK, `No. ${hasil.nomorRKK}`, "", "SASARAN K3:", ...hasil.sasaranK3.map(s => `• ${s}`)].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sections = [
    {
      key: "hukum", label: "Dasar Hukum & Regulasi",
      content: <ul className="space-y-1">{hasil?.dasarHukum.map((d, i) => <li key={i} className="text-slate-300 text-sm">• {d}</li>)}</ul>
    },
    {
      key: "sasaran", label: "Sasaran & Kebijakan K3",
      content: (
        <div className="space-y-3">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="text-blue-300 text-xs font-medium mb-1">Kebijakan K3</div>
            <p className="text-slate-300 text-sm">{hasil?.kebijakan}</p>
          </div>
          <div>
            <div className="text-green-300 text-xs font-medium mb-2">Sasaran K3 Proyek</div>
            <ul className="space-y-1">{hasil?.sasaranK3.map((s, i) => <li key={i} className="text-slate-300 text-sm flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />{s}</li>)}</ul>
          </div>
        </div>
      )
    },
    {
      key: "risiko", label: "Identifikasi Bahaya & Pengendalian Risiko",
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="text-slate-400 border-b border-slate-700/50">
              <th className="text-left px-3 py-2">Pekerjaan</th>
              <th className="text-left px-3 py-2">Potensi Bahaya</th>
              <th className="text-left px-3 py-2">Risiko</th>
              <th className="text-left px-3 py-2">Pengendalian</th>
              <th className="text-left px-3 py-2">PIC/Frekuensi</th>
            </tr></thead>
            <tbody>
              {hasil?.identifikasiRisiko.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="px-3 py-2 text-blue-300 font-medium">{r.pekerjaan}</td>
                  <td className="px-3 py-2 text-slate-300">{r.bahaya}</td>
                  <td className="px-3 py-2 text-orange-300">{r.risiko}</td>
                  <td className="px-3 py-2 text-green-300">{r.pengendalian}</td>
                  <td className="px-3 py-2 text-slate-400">{r.picFrekuensi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    {
      key: "program", label: "Program Keselamatan Konstruksi",
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="text-slate-400 border-b border-slate-700/50">
              <th className="text-left px-3 py-2">Program</th>
              <th className="text-left px-3 py-2">Kegiatan</th>
              <th className="text-left px-3 py-2">Target</th>
              <th className="text-left px-3 py-2">Waktu</th>
              <th className="text-left px-3 py-2">PIC & Anggaran</th>
            </tr></thead>
            <tbody>
              {hasil?.rencanaKeselamatan.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="px-3 py-2 text-blue-300 font-medium">{r.program}</td>
                  <td className="px-3 py-2 text-slate-300">{r.kegiatan}</td>
                  <td className="px-3 py-2 text-green-300">{r.target}</td>
                  <td className="px-3 py-2 text-slate-400">{r.waktu}</td>
                  <td className="px-3 py-2 text-slate-400">{r.picAnggaran}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    {
      key: "apd", label: "Daftar APD & Perlengkapan K3",
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="text-slate-400 border-b border-slate-700/50">
              <th className="text-left px-3 py-2">Item APD/Perlengkapan</th>
              <th className="text-left px-3 py-2">Standar/Spesifikasi</th>
              <th className="text-right px-3 py-2">Jumlah</th>
              <th className="text-left px-3 py-2">Periode Penggantian</th>
            </tr></thead>
            <tbody>
              {hasil?.apd.map((a, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="px-3 py-2 text-slate-200 font-medium">{a.item}</td>
                  <td className="px-3 py-2 text-slate-400">{a.standar}</td>
                  <td className="text-right px-3 py-2 text-orange-300">{a.jumlah}</td>
                  <td className="px-3 py-2 text-slate-400">{a.periode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    {
      key: "emergency", label: "Emergency Response & Komunikasi K3",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-red-400 text-xs font-medium mb-2">Emergency Response Plan</div>
            <ul className="space-y-1">{hasil?.emergencyResponse.map((e, i) => <li key={i} className="text-slate-300 text-sm">• {e}</li>)}</ul>
          </div>
          <div>
            <div className="text-blue-400 text-xs font-medium mb-2">Program Komunikasi K3</div>
            <ul className="space-y-1">{hasil?.komunikasiK3.map((k, i) => <li key={i} className="text-slate-300 text-sm">• {k}</li>)}</ul>
          </div>
        </div>
      )
    },
    {
      key: "dokumen", label: "Dokumen K3 Wajib",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {hasil?.dokumenWajib.map((d, i) => <div key={i} className="flex gap-1.5 text-sm"><span className="text-blue-400">□</span><span className="text-slate-300 text-xs">{d}</span></div>)}
        </div>
      )
    },
  ];

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
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator RKK — Rencana Keselamatan Konstruksi</h1>
              <p className="text-slate-400 text-sm">Generate RKK sesuai Permen PUPR No. 10 Tahun 2021 & Permenaker No. 5 Tahun 1996</p>
            </div>
            <Badge className="ml-auto bg-blue-500/15 text-blue-400 border-blue-500/30">Gelombang 23</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Kontrak *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisKontrak} onChange={e => setJenisKontrak(e.target.value)}>
                {JENIS_KONTRAK.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Proyek Jalan Nasional Trans-Java" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai Kontrak</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Rp 45 Miliar" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Level Risiko</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={risikoLevel} onChange={e => setRisikoLevel(e.target.value)}>
                {RISIKO_LEVEL.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Estimasi Jumlah Pekerja</label>
              <input type="number" className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jumlahPekerja} onChange={e => setJumlahPekerja(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat RKK...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate RKK</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun Rencana Keselamatan Konstruksi...</p>
            <p className="text-slate-500 text-sm mt-1">Identifikasi risiko, program K3, APD, emergency response</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-300 text-xs font-mono mb-1">No. {hasil.nomorRKK}</div>
                <h2 className="text-white font-bold">{hasil.judulRKK}</h2>
              </div>
              <Button onClick={copyAll} variant="outline" size="sm" className="border-slate-600 text-slate-300 shrink-0 ml-4">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>
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
