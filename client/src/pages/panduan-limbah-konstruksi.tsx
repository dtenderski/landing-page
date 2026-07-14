import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, Recycle, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const JENIS_PROYEK_LIMBAH = [
  "Gedung Bertingkat / High-Rise Building",
  "Gedung Komersial / Mall / Perkantoran",
  "Perumahan / Real Estate",
  "Jalan Raya / Jalan Tol",
  "Jembatan",
  "Proyek Migas (Onshore)",
  "Proyek Migas (Offshore / Platform)",
  "Industri / Pabrik",
  "Pembangkit Listrik (PLTU/PLTG)",
  "Proyek Renovasi / Retrofit Bangunan",
  "Proyek Demolisi / Pembongkaran",
];

const SKALA_PROYEK = [
  "Kecil (< Rp 1 M)",
  "Menengah (Rp 1–50 M)",
  "Besar (Rp 50–500 M)",
  "Sangat Besar (> Rp 500 M)",
];

interface KategoriLimbah {
  nama: string;
  jenisB3: boolean;
  contoh: string[];
  regulasi: string;
  caraPengelolaan: string;
  tempoPenyimpanan: string;
  dokumenWajib: string[];
  vendorTipikal: string;
}

interface HasilLimbah {
  judul: string;
  ringkasan: string;
  regulasiUtama: string[];
  kategoriLimbah: KategoriLimbah[];
  prosedurB3: string[];
  checklistPengelolaan: { item: string; frekuensi: string; picJabatan: string }[];
  manifesWajib: string[];
  dendaPelanggaran: { pelanggaran: string; sanksi: string }[];
  kontakInstansi: string[];
}

const WARNA_B3: Record<string, string> = {
  true: "bg-red-900/30 border-red-500/30 text-red-300",
  false: "bg-slate-800/50 border-slate-600/30 text-slate-300",
};

export default function PanduanLimbahKonstruksi() {
  const [jenisProyek, setJenisProyek] = useState(JENIS_PROYEK_LIMBAH[0]);
  const [skala, setSkala] = useState(SKALA_PROYEK[2]);
  const [konteks, setKonteks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilLimbah | null>(null);
  const [expanded, setExpanded] = useState<string | null>("kategori");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-limbah-konstruksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisProyek, skala, konteks }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { } finally { setLoading(false); }
  }

  function copyChecklist() {
    if (!hasil) return;
    const text = hasil.checklistPengelolaan.map(c => `□ ${c.item} (${c.frekuensi}) — ${c.picJabatan}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  const sections = hasil ? [
    {
      key: "kategori", label: "Kategori & Jenis Limbah",
      content: (
        <div className="space-y-3">
          {hasil.kategoriLimbah.map((k, i) => (
            <div key={i} className={`rounded-lg p-3 border ${k.jenisB3 ? "bg-red-900/20 border-red-500/20" : "bg-slate-800/40 border-slate-700/30"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${k.jenisB3 ? "bg-red-600 text-white" : "bg-slate-600 text-slate-200"}`}>{k.jenisB3 ? "LIMBAH B3" : "Non-B3"}</span>
                <span className={`font-medium text-sm ${k.jenisB3 ? "text-red-200" : "text-slate-200"}`}>{k.nama}</span>
              </div>
              <div className="text-slate-400 text-xs mb-1">Contoh: {k.contoh.join(", ")}</div>
              <div className="text-xs text-slate-300 mb-1"><span className="text-slate-500">Regulasi:</span> {k.regulasi}</div>
              <div className="text-xs text-green-300"><span className="text-slate-500">Pengelolaan:</span> {k.caraPengelolaan}</div>
              <div className="text-xs text-yellow-300"><span className="text-slate-500">Penyimpanan maks:</span> {k.tempoPenyimpanan}</div>
              {k.dokumenWajib.length > 0 && <div className="text-xs text-slate-400 mt-1">📄 {k.dokumenWajib.join(" · ")}</div>}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "prosedurB3", label: "Prosedur Penanganan Limbah B3",
      content: <ol className="space-y-1">{hasil.prosedurB3.map((p, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-red-400 font-bold shrink-0">{i + 1}.</span><span className="text-slate-300">{p}</span></li>)}</ol>
    },
    {
      key: "checklist", label: "Checklist Pengelolaan Limbah",
      content: (
        <div>
          <Button onClick={copyChecklist} variant="outline" size="sm" className="border-slate-600 text-slate-300 mb-3">
            {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Tersalin!" : "Salin Checklist"}
          </Button>
          <div className="space-y-1.5">
            {hasil.checklistPengelolaan.map((c, i) => (
              <div key={i} className="flex gap-2 items-start text-sm bg-slate-800/40 rounded p-2">
                <span className="text-emerald-400 shrink-0">□</span>
                <div>
                  <span className="text-slate-200 text-xs font-medium">{c.item}</span>
                  <span className="text-slate-500 text-xs ml-1">— {c.frekuensi}</span>
                  <span className="text-blue-400 text-xs ml-1">({c.picJabatan})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "manifes", label: "Dokumen & Manifes Wajib B3",
      content: <ul className="space-y-1">{hasil.manifesWajib.map((m, i) => <li key={i} className="text-slate-300 text-sm">📄 {m}</li>)}</ul>
    },
    {
      key: "denda", label: "Potensi Sanksi & Denda Pelanggaran",
      content: (
        <div className="space-y-2">
          {hasil.dendaPelanggaran.map((d, i) => (
            <div key={i} className="bg-red-900/15 border border-red-500/20 rounded p-3">
              <div className="text-orange-300 text-xs font-medium">⚠ {d.pelanggaran}</div>
              <div className="text-red-300 text-xs mt-0.5">Sanksi: {d.sanksi}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "kontak", label: "Instansi & Kontak Terkait",
      content: <ul className="space-y-1">{hasil.kontakInstansi.map((k, i) => <li key={i} className="text-slate-300 text-sm">• {k}</li>)}</ul>
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Recycle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan Pengelolaan Limbah Konstruksi & B3</h1>
              <p className="text-slate-400 text-sm">Klasifikasi limbah, prosedur B3, manifest, checklist, dan sanksi — sesuai PP 22/2021 & PermenLHK</p>
            </div>
            <Badge className="ml-auto bg-green-500/15 text-green-400 border-green-500/30">Gelombang 25</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Proyek *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisProyek} onChange={e => setJenisProyek(e.target.value)}>
                {JENIS_PROYEK_LIMBAH.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Skala Proyek</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={skala} onChange={e => setSkala(e.target.value)}>
                {SKALA_PROYEK.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks / Lokasi Khusus (opsional)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: area konservasi, dekat sungai, kawasan industri" value={konteks} onChange={e => setKonteks(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun panduan limbah...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan Limbah</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-green-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun panduan pengelolaan limbah konstruksi...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <h2 className="text-white font-bold">{hasil.judul}</h2>
            <p className="text-slate-400 text-sm">{hasil.ringkasan}</p>
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
              <div className="text-blue-300 text-xs font-medium mb-1">Regulasi Utama</div>
              <div className="flex flex-wrap gap-1">{hasil.regulasiUtama.map((r, i) => <span key={i} className="bg-blue-900/40 text-blue-200 text-xs px-2 py-0.5 rounded">{r}</span>)}</div>
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
