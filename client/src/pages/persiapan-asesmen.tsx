import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, ClipboardList, BookOpen, FileText,
  MessageSquare, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Download, Target, User, Building2, Calendar
} from "lucide-react";
import { Link } from "wouter";

const SKK_POSITIONS = [
  "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Bangunan Gedung — Utama",
  "Ahli Manajemen Konstruksi — Muda",
  "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Konstruksi — Utama",
  "Ahli K3 Konstruksi — Muda",
  "Ahli K3 Konstruksi — Madya",
  "Ahli K3 Konstruksi — Utama",
  "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jalan — Madya",
  "Ahli Teknik Jembatan — Muda",
  "Ahli Teknik Geoteknik — Muda",
  "Ahli Teknik Sumber Daya Air — Muda",
  "Ahli Quantity Surveyor — Muda",
  "Ahli Quantity Surveyor — Madya",
  "Ahli Manajemen Proyek — Muda",
  "Ahli Manajemen Proyek — Madya",
  "Ahli Pengawas Konstruksi — Muda",
  "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Mekanikal — Muda",
  "Ahli Teknik Elektrikal — Muda",
  "Ahli Teknik Plumbing & Pompa Mekanik — Muda",
  "Ahli Arsitektur — Muda",
  "Ahli Perencana Tata Lingkungan — Muda",
];

const PATH_OPTIONS = [
  { id: "reguler", label: "Uji Kompetensi Reguler", desc: "Portofolio + wawancara + observasi" },
  { id: "rpl", label: "Rekognisi Pembelajaran Lampau (RPL)", desc: "Pengalaman kerja tanpa uji ulang" },
  { id: "bimtek", label: "Bimtek + Uji", desc: "Pelatihan teknis lalu langsung diuji" },
];

interface DocItem {
  category: string;
  items: { doc: string; format: string; notes: string; required: boolean }[];
}

interface StudyUnit {
  kode: string;
  nama: string;
  elemen: string[];
  referensi: string;
  bobot: "tinggi" | "sedang" | "rendah";
}

interface TipsSection {
  phase: string;
  tips: string[];
}

interface PrepResult {
  position: string;
  path: string;
  timeline: string;
  costEstimate: string;
  documents: DocItem[];
  studyUnits: StudyUnit[];
  assessorTips: TipsSection[];
  commonMistakes: string[];
  successRate: string;
}

function CollapseSection({ title, icon, count, children }: { title: string; icon: React.ReactNode; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden mb-3">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-white">{title}</span>
          {count !== undefined && <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{count}</Badge>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function PersiapanAsesmen() {
  const [position, setPosition] = useState("");
  const [path, setPath] = useState("reguler");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrepResult | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!position) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/persiapan-asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, path }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal membuat paket persiapan.");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!result) return;
    const text = [
      `PAKET PERSIAPAN ASESMEN SKK`,
      `Jabatan: ${result.position}`,
      `Jalur: ${result.path}`,
      `Estimasi Timeline: ${result.timeline}`,
      `Estimasi Biaya: ${result.costEstimate}`,
      ``,
      `=== DOKUMEN YANG DIBUTUHKAN ===`,
      ...result.documents.flatMap(cat =>
        [`${cat.category}:`, ...cat.items.map(i => `  - ${i.doc} [${i.format}] ${i.required ? "(WAJIB)" : "(opsional)"} — ${i.notes}`)]
      ),
      ``,
      `=== UNIT KOMPETENSI PRIORITAS ===`,
      ...result.studyUnits.map(u => `  ${u.kode} — ${u.nama} [bobot: ${u.bobot}]\n  Ref: ${u.referensi}`),
      ``,
      `=== TIPS ASESOR ===`,
      ...result.assessorTips.flatMap(t => [`${t.phase}:`, ...t.tips.map(tip => `  - ${tip}`)]),
      ``,
      `=== KESALAHAN UMUM ===`,
      ...result.commonMistakes.map(m => `  ✗ ${m}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
  }

  const bobot = { tinggi: "text-red-400 border-red-400/30 bg-red-500/10", sedang: "text-amber-400 border-amber-400/30 bg-amber-500/10", rendah: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10" };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setResult(null)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white">Paket Persiapan Asesmen SKK</h1>
                <p className="text-xs text-slate-400">{result.position}</p>
              </div>
            </div>
            <Button onClick={copyAll} size="sm" variant="outline" className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Salin Semua
            </Button>
          </div>

          {/* Summary Banner */}
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Target className="h-3 w-3" /> Jabatan</p>
              <p className="text-white text-xs font-medium leading-tight">{result.position}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Jalur</p>
              <p className="text-white text-xs font-medium">{result.path}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> Timeline</p>
              <p className="text-white text-xs font-medium">{result.timeline}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Building2 className="h-3 w-3" /> Est. Biaya</p>
              <p className="text-white text-xs font-medium">{result.costEstimate}</p>
            </div>
          </div>

          {/* Documents */}
          <CollapseSection title="Dokumen yang Dibutuhkan" icon={<FileText className="h-4 w-4 text-amber-400" />} count={result.documents.reduce((a, c) => a + c.items.length, 0)}>
            <div className="space-y-3 pt-1">
              {result.documents.map((cat, i) => (
                <div key={i}>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">{cat.category}</p>
                  <div className="space-y-1.5">
                    {cat.items.map((item, j) => (
                      <div key={j} className={`rounded-lg border px-3 py-2 flex items-start justify-between gap-2 ${item.required ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-white/3"}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-xs font-medium">{item.doc}</span>
                            {item.required && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-400/30">WAJIB</Badge>}
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5">{item.notes}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600 shrink-0">{item.format}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapseSection>

          {/* Study Units */}
          <CollapseSection title="Unit Kompetensi Prioritas Studi" icon={<BookOpen className="h-4 w-4 text-blue-400" />} count={result.studyUnits.length}>
            <div className="space-y-2 pt-1">
              {result.studyUnits.map((unit, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/3 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-slate-400 text-xs font-mono">{unit.kode}</p>
                      <p className="text-white text-sm font-medium">{unit.nama}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${bobot[unit.bobot]}`}>{unit.bobot}</Badge>
                  </div>
                  {unit.elemen.length > 0 && (
                    <ul className="mb-2">
                      {unit.elemen.map((e, ei) => (
                        <li key={ei} className="text-slate-400 text-xs flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5 shrink-0">›</span>{e}
                        </li>
                      ))}
                    </ul>
                  )}
                  {unit.referensi && <p className="text-slate-500 text-xs border-t border-white/5 pt-1.5 mt-1.5">Ref: {unit.referensi}</p>}
                </div>
              ))}
            </div>
          </CollapseSection>

          {/* Assessor Tips */}
          <CollapseSection title="Tips Menghadapi Asesor" icon={<MessageSquare className="h-4 w-4 text-violet-400" />}>
            <div className="space-y-3 pt-1">
              {result.assessorTips.map((section, i) => (
                <div key={i}>
                  <p className="text-violet-400 text-xs font-semibold mb-1.5">{section.phase}</p>
                  <ul className="space-y-1.5">
                    {section.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2 text-slate-300 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CollapseSection>

          {/* Common Mistakes */}
          {result.commonMistakes.length > 0 && (
            <CollapseSection title="Kesalahan Umum yang Harus Dihindari" icon={<AlertCircle className="h-4 w-4 text-red-400" />} count={result.commonMistakes.length}>
              <ul className="space-y-1.5 pt-1">
                {result.commonMistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-xs rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    {m}
                  </li>
                ))}
              </ul>
            </CollapseSection>
          )}

          <div className="flex gap-3 mt-4">
            <Button onClick={() => setResult(null)} variant="outline" className="flex-1">
              Jabatan Lain
            </Button>
            <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700">
              <Link href="/mock-asesmen">Latihan Mock Asesmen →</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-400" /> Persiapan Asesmen SKK
            </h1>
            <p className="text-xs text-slate-400">Paket persiapan lengkap: dokumen, unit studi, tips asesor</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-5">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Jabatan SKK yang Akan Diuji *</label>
            <select value={position} onChange={e => setPosition(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50 transition-colors">
              <option value="">Pilih jabatan...</option>
              {SKK_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Jalur Sertifikasi *</label>
            <div className="space-y-2">
              {PATH_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setPath(opt.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${path === opt.id ? "bg-teal-500/15 border-teal-400/40 text-teal-300" : "border-white/10 text-slate-300 hover:border-white/20 hover:text-white"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={generate} disabled={!position || loading} className="w-full bg-teal-600 hover:bg-teal-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Menyiapkan Paket...</>
              : <><Sparkles className="h-4 w-4 mr-2" />Generate Paket Persiapan</>
            }
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-500 leading-relaxed">
              <p className="mb-1">Paket yang dihasilkan mencakup:</p>
              <ul className="space-y-0.5">
                <li>• Daftar lengkap dokumen yang diperlukan (APL-01, APL-02, portofolio, dll.)</li>
                <li>• Unit kompetensi SKKNI yang perlu dipelajari + referensi regulasi</li>
                <li>• Tips menghadapi asesor: persiapan, wawancara, observasi</li>
                <li>• Estimasi biaya & timeline proses sertifikasi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
