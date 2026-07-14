import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ShieldAlert, Copy, CheckCircle2, RotateCcw, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const LEVEL_CSMS = [
  "Level 1 — Kontraktor Kecil (risiko rendah, nilai < Rp 10M)",
  "Level 2 — Kontraktor Menengah (risiko menengah, nilai Rp 10–100M)",
  "Level 3 — Kontraktor Besar/Kompleks (risiko tinggi, nilai > Rp 100M atau pekerjaan kritikal)",
];

const JENIS_PEKERJAAN_CSMS = [
  "Pekerjaan Sipil Umum (Gedung/Jalan)",
  "Pekerjaan Migas Onshore (Pipa/Tangki/Fasilitas Produksi)",
  "Pekerjaan Migas Offshore (Platform/FPSO/Subsea)",
  "Pekerjaan Ketenagalistrikan (Gardu/SUTT/Pembangkit)",
  "Pekerjaan Industri Petrokimia/Refinery",
  "Pekerjaan Pertambangan",
  "Pekerjaan Rekayasa Mekanik & Piping",
];

interface DokumenCSMS {
  kategori: string;
  dokumen: string[];
}

interface HasilCSMS {
  judul: string;
  ringkasan: string;
  elemenCSMS: { elemen: string; subElemen: string[]; targetSkor: string; buktiWajib: string[] }[];
  dokumenWajib: DokumenCSMS[];
  checklistPreAudit: { kategori: string; item: string; status: string }[];
  strategiAudit: string[];
  pertanyaanUmumAuditor: { pertanyaan: string; jawabanSampel: string }[];
  kesalahanUmum: { kesalahan: string; dampak: string; solusi: string }[];
}

export default function PanduanCSMS() {
  const [levelCSMS, setLevelCSMS] = useState(LEVEL_CSMS[1]);
  const [jenisPekerjaan, setJenisPekerjaan] = useState(JENIS_PEKERJAAN_CSMS[0]);
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [konteksKhusus, setKonteksKhusus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilCSMS | null>(null);
  const [expanded, setExpanded] = useState<string | null>("elemen");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/panduan-csms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelCSMS, jenisPekerjaan, namaPerusahaan, konteksKhusus }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch { /**/ } finally { setLoading(false); }
  }

  const toggle = (s: string) => setExpanded(expanded === s ? null : s);

  function copyChecklist() {
    if (!hasil) return;
    const text = hasil.checklistPreAudit.map(c => `[${c.status}] ${c.kategori}: ${c.item}`).join("\n");
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
              <ShieldAlert className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panduan Persiapan Audit CSMS</h1>
              <p className="text-slate-400 text-sm">Contractor Safety Management System — persiapan audit Level 1/2/3 komprehensif</p>
            </div>
            <Badge className="ml-auto bg-orange-500/15 text-orange-400 border-orange-500/30">Gelombang 23</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Level CSMS yang Dituju *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={levelCSMS} onChange={e => setLevelCSMS(e.target.value)}>
                {LEVEL_CSMS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Jenis Pekerjaan / Sektor</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={jenisPekerjaan} onChange={e => setJenisPekerjaan(e.target.value)}>
                {JENIS_PEKERJAAN_CSMS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Perusahaan</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="PT Nama Kontraktor (opsional)" value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Konteks Khusus / Klien/Owner</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: audit untuk Pertamina EP, klien PLN, dst (opsional)" value={konteksKhusus} onChange={e => setKonteksKhusus(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyusun Panduan CSMS...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Panduan CSMS</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun panduan persiapan audit CSMS...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-bold">{hasil.judul}</h2>
                <p className="text-slate-400 text-sm mt-1">{hasil.ringkasan}</p>
              </div>
            </div>

            {[
              {
                key: "elemen", label: "Elemen & Sub-Elemen CSMS",
                content: (
                  <div className="space-y-3">
                    {hasil.elemenCSMS.map((el, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-orange-300 font-medium text-sm">{el.elemen}</div>
                          <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/30 text-xs">{el.targetSkor}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Sub-Elemen:</div>
                            <ul className="space-y-0.5">{el.subElemen.map((s, j) => <li key={j} className="text-slate-300 text-xs">• {s}</li>)}</ul>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Bukti Wajib:</div>
                            <ul className="space-y-0.5">{el.buktiWajib.map((b, j) => <li key={j} className="text-blue-300 text-xs">📄 {b}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "dokumen", label: "Dokumen Wajib per Kategori",
                content: (
                  <div className="space-y-3">
                    {hasil.dokumenWajib.map((d, i) => (
                      <div key={i}>
                        <div className="text-orange-300 text-xs font-medium mb-1">{d.kategori}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {d.dokumen.map((doc, j) => <div key={j} className="flex gap-1.5 text-xs"><span className="text-orange-400">□</span><span className="text-slate-300">{doc}</span></div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "checklist", label: "Checklist Pre-Audit",
                content: (
                  <div>
                    <Button onClick={copyChecklist} variant="outline" size="sm" className="border-slate-600 text-slate-300 mb-3">
                      {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? "Tersalin!" : "Salin Checklist"}
                    </Button>
                    <div className="space-y-1">
                      {hasil.checklistPreAudit.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${c.status === "Wajib" ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"}`}>{c.status}</span>
                          <span className="text-slate-400 text-xs">{c.kategori}:</span>
                          <span className="text-slate-300 text-xs">{c.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              },
              {
                key: "pertanyaan", label: "Pertanyaan Umum Auditor & Contoh Jawaban",
                content: (
                  <div className="space-y-3">
                    {hasil.pertanyaanUmumAuditor.map((p, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-orange-300 text-sm font-medium mb-1">❓ {p.pertanyaan}</div>
                        <div className="text-slate-300 text-xs pl-4">✓ {p.jawabanSampel}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: "strategi", label: "Strategi & Tips Audit",
                content: <ul className="space-y-1">{hasil.strategiAudit.map((s, i) => <li key={i} className="text-slate-300 text-sm">• {s}</li>)}</ul>
              },
              {
                key: "kesalahan", label: "Kesalahan Umum Kontraktor",
                content: (
                  <div className="space-y-2">
                    {hasil.kesalahanUmum.map((k, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-red-400 text-xs font-medium">⚠ {k.kesalahan}</div>
                        <div className="text-orange-400 text-xs mt-0.5">Dampak: {k.dampak}</div>
                        <div className="text-green-300 text-xs mt-0.5">✓ {k.solusi}</div>
                      </div>
                    ))}
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
