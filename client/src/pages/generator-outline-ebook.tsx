import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Loader2, Sparkles, Copy, Check, Download, Target, ListChecks, Clock, Wand2 } from "lucide-react";
import { Link } from "wouter";

/** Kunci handoff Blueprint Builder → Generator Outline Ebook/Ecourse (dibaca sekali lalu dihapus). */
const EBOOK_PREFILL_KEY = "gustafta_ebook_prefill_v1";

interface OutlineResult {
  judul: string;
  format: string;
  ringkasan: string;
  target_pembaca: string;
  tujuan_pembelajaran: string[];
  outline: { nomor: number; judul: string; ringkasan: string; poin: string[]; durasi: string }[];
  cta: string;
  catatan: string;
}

const CONTOH = [
  "Panduan memakai chatbot AI untuk UMKM: dari setup, isi pengetahuan produk, sampai follow-up pelanggan otomatis di WhatsApp.",
  "Kursus dasar keselamatan kerja (K3) konstruksi untuk mandor: identifikasi bahaya, APD, izin kerja, dan penanganan insiden.",
  "Ebook strategi tender konstruksi untuk kontraktor kecil: syarat SBU/SKK, cara baca dokumen tender, hingga menyusun penawaran.",
];

function resultToText(r: OutlineResult): string {
  const lines: string[] = [];
  lines.push(`${(r.format || "Materi").toUpperCase()} — ${r.judul || "Materi Belajar"}`);
  lines.push("");
  if (r.ringkasan) { lines.push("RINGKASAN"); lines.push(r.ringkasan); lines.push(""); }
  if (r.target_pembaca) { lines.push("TARGET PEMBACA"); lines.push(r.target_pembaca); lines.push(""); }
  if (r.tujuan_pembelajaran?.length) {
    lines.push("TUJUAN PEMBELAJARAN");
    r.tujuan_pembelajaran.forEach((t) => lines.push(`• ${t}`));
    lines.push("");
  }
  if (r.outline?.length) {
    lines.push("OUTLINE");
    r.outline.forEach((o) => {
      lines.push(`${o.nomor}. ${o.judul}${o.durasi ? ` (${o.durasi})` : ""}`);
      if (o.ringkasan) lines.push(`   ${o.ringkasan}`);
      o.poin?.forEach((p) => lines.push(`   - ${p}`));
      lines.push("");
    });
  }
  if (r.cta) { lines.push("LANGKAH LANJUT"); lines.push(r.cta); lines.push(""); }
  if (r.catatan) { lines.push("CATATAN"); lines.push(r.catatan); }
  return lines.join("\n");
}

export default function GeneratorOutlineEbook() {
  const [judul, setJudul] = useState("");
  const [audiens, setAudiens] = useState("");
  const [format, setFormat] = useState<"Ebook" | "Ecourse">("Ebook");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutlineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fromBlueprint, setFromBlueprint] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EBOOK_PREFILL_KEY);
      if (!raw) return;
      localStorage.removeItem(EBOOK_PREFILL_KEY);
      const data = JSON.parse(raw) as { brief?: string; source?: string };
      if (data?.brief && typeof data.brief === "string") {
        setBrief(data.brief);
        if (data.source === "blueprint") setFromBlueprint(true);
      }
    } catch {
      /* prefill rusak — abaikan */
    }
  }, []);

  async function handleGenerate() {
    if (brief.trim().length < 15) {
      setError("Isi deskripsi/brief minimal 15 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/generator-outline-ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, audiens, format, brief }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat outline");
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(resultToText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob(["\uFEFF" + resultToText(result)], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Outline_${(result.judul || "Materi").replace(/\s+/g, "_")}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <Link href="/ai-tools">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1.5 -ml-2" data-testid="link-back">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex-1" />
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Generator Outline Ebook/Ecourse
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <BookOpen className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Generator Outline Ebook/Ecourse</h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Dari brief/pengetahuan Anda → AI menyusun kerangka bab (Ebook) atau modul (Ecourse)
            lengkap dengan tujuan pembelajaran & poin bahasan, siap dikembangkan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Judul (usulan, opsional)</label>
              <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Mis. Panduan Chatbot AI untuk UMKM"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-judul" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Target pembaca (opsional)</label>
              <Input value={audiens} onChange={(e) => setAudiens(e.target.value)} placeholder="Mis. pemilik toko online pemula"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-audiens" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat("Ebook")}
                  className={`text-sm rounded-lg px-3 py-2 border transition ${format === "Ebook" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}
                  data-testid="button-format-ebook"
                >
                  Ebook (bab)
                </button>
                <button
                  onClick={() => setFormat("Ecourse")}
                  className={`text-sm rounded-lg px-3 py-2 border transition ${format === "Ecourse" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}
                  data-testid="button-format-ecourse"
                >
                  Ecourse (modul)
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Deskripsi / brief materi</label>
              {fromBlueprint && (
                <div className="flex items-center gap-2 mb-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2" data-testid="notice-from-blueprint">
                  <Wand2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Diisi otomatis dari Blueprint chatbot Anda. Silakan sunting bila perlu.
                </div>
              )}
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Ceritakan topik/pengetahuan yang ingin dijadikan materi: untuk siapa, apa yang mereka pelajari, poin penting..."
                className="min-h-[160px] bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                data-testid="input-brief"
              />
              <p className="text-xs text-white/30 mt-1">{brief.length} karakter</p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || brief.trim().length < 15}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2"
              data-testid="button-generate-outline"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menyusun outline...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Buat Outline</>
              )}
            </Button>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2" data-testid="text-error">
                {error}
              </div>
            )}

            {!result && !loading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-white/40">Contoh brief:</p>
                {CONTOH.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setBrief(c)}
                    className="text-left text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 w-full transition"
                    data-testid={`button-contoh-${i}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Result */}
          <div className="lg:col-span-3">
            {!result && !loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-2xl p-8" data-testid="empty-state">
                <BookOpen className="h-10 w-10 text-white/15 mb-3" />
                <p className="text-white/40 text-sm max-w-xs">
                  Outline akan muncul di sini setelah Anda menekan "Buat Outline".
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center" data-testid="loading-state">
                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-white/50 text-sm">AI sedang menyusun outline Anda...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4" data-testid="result-outline">
                <div className="flex items-center gap-2">
                  <Button onClick={handleCopy} size="sm" variant="outline" className="gap-1.5 border-white/15 text-white/70 hover:text-white" data-testid="button-copy">
                    {copied ? <><Check className="h-3.5 w-3.5" /> Tersalin</> : <><Copy className="h-3.5 w-3.5" /> Salin</>}
                  </Button>
                  <Button onClick={handleDownload} size="sm" variant="outline" className="gap-1.5 border-white/15 text-white/70 hover:text-white" data-testid="button-download">
                    <Download className="h-3.5 w-3.5" /> Unduh .txt
                  </Button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{result.format}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1" data-testid="text-judul">{result.judul}</h2>
                  {result.ringkasan && <p className="text-sm text-white/60 mb-2">{result.ringkasan}</p>}
                  {result.target_pembaca && (
                    <p className="text-xs text-white/50 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {result.target_pembaca}</p>
                  )}
                </div>

                {result.tujuan_pembelajaran?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4 text-emerald-400" /> Tujuan Pembelajaran</h3>
                    <ul className="space-y-1.5">
                      {result.tujuan_pembelajaran.map((t, i) => (
                        <li key={i} className="text-sm text-white/70 flex items-start gap-2" data-testid={`tujuan-${i}`}>
                          <span className="text-emerald-400">✓</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.outline?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Outline {result.format === "Ecourse" ? "Modul" : "Bab"}</h3>
                    <div className="space-y-3">
                      {result.outline.map((o, i) => (
                        <div key={i} className="bg-white/[0.03] rounded-xl p-3" data-testid={`outline-${i}`}>
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold flex items-center justify-center">{o.nomor}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-white">{o.judul}</p>
                                {o.durasi && (
                                  <span className="text-xs text-white/40 flex items-center gap-1"><Clock className="h-3 w-3" /> {o.durasi}</span>
                                )}
                              </div>
                              {o.ringkasan && <p className="text-xs text-white/50 mt-0.5">{o.ringkasan}</p>}
                              {o.poin?.length > 0 && (
                                <ul className="mt-1.5 space-y-1">
                                  {o.poin.map((p, j) => (
                                    <li key={j} className="text-xs text-white/60 flex items-start gap-1.5">
                                      <span className="text-emerald-400/60">•</span>{p}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.cta && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-2">Langkah Lanjut</h3>
                    <p className="text-sm text-white/70">{result.cta}</p>
                  </div>
                )}

                {result.catatan && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                    <p className="text-xs text-amber-300/80">{result.catatan}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
