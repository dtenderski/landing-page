import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Plus, Trash2, Download,
  User, Briefcase, GraduationCap, Award, ChevronRight,
  Copy, CheckCheck, Info, FileText, X, Building2
} from "lucide-react";
import { Link } from "wouter";

const SKK_OPTIONS = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Pengawas Konstruksi — Madya",
  "Ahli Manajemen Kontrak — Muda", "Ahli Teknik Bangunan Gedung — Muda",
  "Ahli Teknik Bangunan Gedung — Madya", "Ahli Teknik Jalan — Muda",
  "Ahli Teknik Jembatan — Muda", "Ahli Teknik Geoteknik — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Elektrikal — Muda",
];

const BIDANG_OPTIONS = [
  "K3 Konstruksi", "Manajemen Proyek", "Manajemen Konstruksi", "Quantity Surveying",
  "Pengawasan Konstruksi", "Struktur Bangunan Gedung", "Teknik Jalan & Jembatan",
  "Geoteknik", "Arsitektur", "MEP (Mekanikal-Elektrikal)", "Manajemen Kontrak",
];

interface ProyekCV {
  id: string; nama: string; klien: string; nilai: string;
  tahun: string; peran: string; deskripsi: string;
}

interface HasilCV {
  namaLengkap: string;
  profilProfesional: string;
  kompetensiUtama: string[];
  pengalamanProyekFormatted: {
    nama: string; klien: string; nilai: string; tahun: string;
    peran: string; kontribusiKompetensi: string[];
  }[];
  kualifikasi: string[];
  kalimatPenutup: string;
  tipsCV: string[];
}

export default function GeneratorCVSKK() {
  const [form, setForm] = useState({
    nama: "", jabatanTarget: "", bidang: "", tahunPengalaman: "",
    pendidikan: "", skkDimiliki: "", organisasi: "",
  });
  const [proyekList, setProyekList] = useState<ProyekCV[]>([
    { id: "1", nama: "", klien: "", nilai: "", tahun: "", peran: "", deskripsi: "" }
  ]);
  const [result, setResult] = useState<HasilCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function updateProyek(id: string, field: keyof ProyekCV, val: string) {
    setProyekList(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));
  }
  const addProyek = () => setProyekList(p => [...p, { id: Date.now().toString(), nama: "", klien: "", nilai: "", tahun: "", peran: "", deskripsi: "" }]);
  const removeProyek = (id: string) => setProyekList(p => p.filter(x => x.id !== id));

  const isValid = form.nama && form.jabatanTarget && form.tahunPengalaman && proyekList.some(p => p.nama && p.peran);

  async function generate() {
    if (!isValid) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/tools/generator-cv-skk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, proyekList }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message || "Gagal generate. Coba lagi."); }
    finally { setLoading(false); }
  }

  function copyToClipboard() {
    if (!result) return;
    const text = [
      `CURRICULUM VITAE KOMPETENSI`,
      ``,
      `${result.namaLengkap}`,
      `${form.jabatanTarget} | ${form.bidang}`,
      ``,
      `PROFIL PROFESIONAL`,
      result.profilProfesional,
      ``,
      `KOMPETENSI UTAMA`,
      result.kompetensiUtama.map((k, i) => `${i + 1}. ${k}`).join("\n"),
      ``,
      `PENGALAMAN PROYEK KONSTRUKSI`,
      ...result.pengalamanProyekFormatted.flatMap(p => [
        ``,
        `${p.nama}`,
        `Klien: ${p.klien} | Nilai Kontrak: ${p.nilai} | Tahun: ${p.tahun}`,
        `Peran: ${p.peran}`,
        `Kontribusi Kompetensi:`,
        ...p.kontribusiKompetensi.map(k => `  • ${k}`),
      ]),
      ``,
      `KUALIFIKASI & SERTIFIKASI`,
      result.kualifikasi.map(k => `• ${k}`).join("\n"),
      ``,
      result.kalimatPenutup,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" /> Generator CV Kompetensi SKK
            </h1>
            <p className="text-xs text-slate-400">AI buat CV profesional yang menonjolkan kompetensi untuk SKK & tender</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            {/* Profil Dasar */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Profil Anda</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1.5">Nama Lengkap *</label>
                  <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    placeholder="cth: Ir. Budi Santoso, ST., MT."
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Jabatan SKK yang Dituju *</label>
                  <select value={form.jabatanTarget} onChange={e => setForm(f => ({ ...f, jabatanTarget: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                    <option value="">Pilih jabatan...</option>
                    {SKK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Bidang Keahlian Utama</label>
                  <select value={form.bidang} onChange={e => setForm(f => ({ ...f, bidang: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                    <option value="">Pilih bidang...</option>
                    {BIDANG_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Total Pengalaman Kerja *</label>
                  <select value={form.tahunPengalaman} onChange={e => setForm(f => ({ ...f, tahunPengalaman: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                    <option value="">Pilih...</option>
                    {["2–3 tahun", "4–5 tahun", "6–9 tahun", "10–15 tahun", "> 15 tahun"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Pendidikan Terakhir</label>
                  <select value={form.pendidikan} onChange={e => setForm(f => ({ ...f, pendidikan: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                    <option value="">Pilih...</option>
                    {["SMA/SMK Teknik", "D3 Teknik", "S1 Teknik / D4", "S2 Teknik", "S3"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">SKK / Sertifikasi yang Sudah Dimiliki <span className="text-slate-600">(opsional)</span></label>
                <input value={form.skkDimiliki} onChange={e => setForm(f => ({ ...f, skkDimiliki: e.target.value }))}
                  placeholder="cth: Ahli K3 Konstruksi Muda (2022), Sertifikat AK3U Kemenaker (2020)"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Organisasi Profesi / Asosiasi <span className="text-slate-600">(opsional)</span></label>
                <input value={form.organisasi} onChange={e => setForm(f => ({ ...f, organisasi: e.target.value }))}
                  placeholder="cth: Anggota PII, IAKI, HAKI"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
              </div>
            </div>

            {/* Pengalaman Proyek */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Pengalaman Proyek *</p>
                <button onClick={addProyek} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Tambah</button>
              </div>
              <div className="space-y-4">
                {proyekList.map((p, idx) => (
                  <div key={p.id} className="rounded-xl border border-white/8 bg-slate-900/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cyan-400 font-semibold">Proyek {idx + 1}</span>
                      {proyekList.length > 1 && <button onClick={() => removeProyek(p.id)} className="text-slate-600 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={p.nama} onChange={e => updateProyek(p.id, "nama", e.target.value)} placeholder="Nama proyek *"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      <input value={p.klien} onChange={e => updateProyek(p.id, "klien", e.target.value)} placeholder="Klien / pemberi kerja"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      <input value={p.nilai} onChange={e => updateProyek(p.id, "nilai", e.target.value)} placeholder="Nilai (cth: Rp 45 M)"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      <input value={p.tahun} onChange={e => updateProyek(p.id, "tahun", e.target.value)} placeholder="Tahun (cth: 2022–2023)"
                        className="rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      <div className="col-span-2">
                        <input value={p.peran} onChange={e => updateProyek(p.id, "peran", e.target.value)} placeholder="Peran/jabatan Anda di proyek ini *"
                          className="w-full rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      </div>
                      <div className="col-span-2">
                        <textarea value={p.deskripsi} onChange={e => updateProyek(p.id, "deskripsi", e.target.value)} rows={2}
                          placeholder="Tanggung jawab & pencapaian utama di proyek ini"
                          className="w-full rounded-lg border border-white/8 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 resize-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>}

            <Button onClick={generate} disabled={!isValid || loading} className="w-full bg-cyan-600 hover:bg-cyan-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI menyusun CV...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate CV Kompetensi</>}
            </Button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/40">CV Kompetensi SKK</Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="text-xs gap-1.5">
                  {copied ? <><CheckCheck className="h-3.5 w-3.5 text-emerald-400" />Tersalin!</> : <><Copy className="h-3.5 w-3.5" />Salin Teks</>}
                </Button>
                <Button onClick={() => setResult(null)} variant="outline" size="sm" className="text-xs">Edit Ulang</Button>
              </div>
            </div>

            {/* CV Preview */}
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6 space-y-5 font-mono text-sm">
              {/* Header */}
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-white text-lg font-bold">{result.namaLengkap}</h2>
                <p className="text-cyan-400 text-sm">{form.jabatanTarget} · {form.bidang}</p>
                {form.pendidikan && <p className="text-slate-400 text-xs mt-1">{form.pendidikan} · Pengalaman {form.tahunPengalaman}</p>}
              </div>

              {/* Profil */}
              <div>
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">PROFIL PROFESIONAL</p>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">{result.profilProfesional}</p>
              </div>

              {/* Kompetensi Utama */}
              <div>
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">KOMPETENSI UTAMA</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {result.kompetensiUtama.map((k, i) => (
                    <div key={i} className="flex items-start gap-2 font-sans">
                      <span className="text-cyan-400 shrink-0 text-xs">▸</span>
                      <span className="text-slate-300 text-xs">{k}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proyek */}
              <div>
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">PENGALAMAN PROYEK</p>
                <div className="space-y-4">
                  {result.pengalamanProyekFormatted.map((p, i) => (
                    <div key={i} className="border-l-2 border-cyan-500/30 pl-3">
                      <p className="text-white text-sm font-semibold font-sans">{p.nama}</p>
                      <p className="text-slate-400 text-xs font-sans">{p.klien && `${p.klien} · `}{p.nilai && `${p.nilai} · `}{p.tahun}</p>
                      <p className="text-cyan-300 text-xs font-sans mt-0.5">{p.peran}</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {p.kontribusiKompetensi.map((k, ki) => (
                          <li key={ki} className="text-slate-400 text-xs font-sans flex items-start gap-1.5">
                            <span className="text-slate-600 shrink-0">•</span>{k}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kualifikasi */}
              <div>
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">KUALIFIKASI & SERTIFIKASI</p>
                <ul className="space-y-1">
                  {result.kualifikasi.map((k, i) => (
                    <li key={i} className="text-slate-300 text-xs font-sans flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0">✓</span>{k}
                    </li>
                  ))}
                </ul>
              </div>

              {result.kalimatPenutup && (
                <p className="text-slate-400 text-xs font-sans italic border-t border-white/8 pt-3">{result.kalimatPenutup}</p>
              )}
            </div>

            {/* CV Tips */}
            {result.tipsCV?.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-amber-400 text-xs font-semibold mb-2">Tips Mengoptimalkan CV Ini</p>
                <ul className="space-y-1">
                  {result.tipsCV.map((t, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{t}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 text-xs">Edit & Generate Ulang</Button>
              <Button asChild className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs">
                <Link href="/generator-dokumen-skk">Generator Surat SKK →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
