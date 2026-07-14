import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Megaphone, Loader2, Sparkles, Copy, Check, Download, Target, Hash, MessageSquare, Wand2 } from "lucide-react";
import { Link } from "wouter";

/** Kunci handoff Blueprint Builder → Generator Bahan Marketing (dibaca sekali lalu dihapus). */
const MARKETING_PREFILL_KEY = "gustafta_marketing_prefill_v1";

interface MarketingResult {
  produk: string;
  positioning: string;
  target_audiens: string;
  angle_iklan: { judul: string; deskripsi: string }[];
  hook: string[];
  caption: { platform: string; teks: string; hashtag: string[] }[];
  skrip_promosi: { kanal: string; isi: string }[];
  cta: string[];
  catatan: string;
}

const CONTOH = [
  "Chatbot WhatsApp untuk toko bahan bangunan: menjawab stok & harga, mencatat pesanan, dan follow-up pelanggan lama secara otomatis.",
  "Asisten AI klinik kecantikan untuk booking jadwal, menjawab FAQ perawatan, dan mengirim pengingat ke pasien.",
  "Tim AI untuk kontraktor: bantu cari info tender, siapkan dokumen SBU/SKK, dan susun estimasi RAB awal.",
];

function resultToText(r: MarketingResult): string {
  const lines: string[] = [];
  lines.push(`BAHAN MARKETING — ${r.produk || "Produk"}`);
  lines.push("");
  if (r.positioning) { lines.push("POSITIONING"); lines.push(r.positioning); lines.push(""); }
  if (r.target_audiens) { lines.push("TARGET AUDIENS"); lines.push(r.target_audiens); lines.push(""); }
  if (r.angle_iklan?.length) {
    lines.push("ANGLE IKLAN");
    r.angle_iklan.forEach((a) => lines.push(`• ${a.judul}: ${a.deskripsi}`));
    lines.push("");
  }
  if (r.hook?.length) {
    lines.push("HOOK");
    r.hook.forEach((h) => lines.push(`• ${h}`));
    lines.push("");
  }
  if (r.caption?.length) {
    lines.push("CAPTION");
    r.caption.forEach((c) => {
      lines.push(`[${c.platform}]`);
      lines.push(c.teks);
      if (c.hashtag?.length) lines.push(c.hashtag.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" "));
      lines.push("");
    });
  }
  if (r.skrip_promosi?.length) {
    lines.push("SKRIP PROMOSI");
    r.skrip_promosi.forEach((s) => { lines.push(`[${s.kanal}]`); lines.push(s.isi); lines.push(""); });
  }
  if (r.cta?.length) {
    lines.push("CALL TO ACTION");
    r.cta.forEach((c) => lines.push(`• ${c}`));
    lines.push("");
  }
  if (r.catatan) { lines.push("CATATAN"); lines.push(r.catatan); }
  return lines.join("\n");
}

export default function GeneratorBahanMarketing() {
  const [namaProduk, setNamaProduk] = useState("");
  const [audiens, setAudiens] = useState("");
  const [platform, setPlatform] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fromBlueprint, setFromBlueprint] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MARKETING_PREFILL_KEY);
      if (!raw) return;
      localStorage.removeItem(MARKETING_PREFILL_KEY);
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
      const res = await fetch("/api/tools/generator-bahan-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaProduk, audiens, platform, brief }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat bahan marketing");
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
    a.download = `Marketing_${(result.produk || "Produk").replace(/\s+/g, "_")}_${Date.now()}.txt`;
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
        <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 gap-1.5">
          <Megaphone className="h-3.5 w-3.5" />
          Generator Bahan Marketing
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 mb-4">
            <Megaphone className="h-8 w-8 text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Generator Bahan Marketing</h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Ceritakan produk/chatbot Anda → AI menyusun angle iklan, hook, caption per platform,
            skrip promosi, dan call-to-action siap sunting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Nama produk / chatbot</label>
                <Input value={namaProduk} onChange={(e) => setNamaProduk(e.target.value)} placeholder="Mis. BengkelBot"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-nama-produk" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Target audiens (opsional)</label>
                <Input value={audiens} onChange={(e) => setAudiens(e.target.value)} placeholder="Mis. pemilik UMKM"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-audiens" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Platform fokus (opsional)</label>
              <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Mis. Instagram, TikTok, WhatsApp"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-platform" />
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Deskripsi / brief produk</label>
              {fromBlueprint && (
                <div className="flex items-center gap-2 mb-2 text-xs text-pink-300 bg-pink-500/10 border border-pink-500/30 rounded-lg px-3 py-2" data-testid="notice-from-blueprint">
                  <Wand2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Diisi otomatis dari Blueprint chatbot Anda. Silakan sunting bila perlu.
                </div>
              )}
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Ceritakan produk/chatbot: apa manfaatnya, untuk siapa, apa yang membuatnya berguna..."
                className="min-h-[160px] bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                data-testid="input-brief"
              />
              <p className="text-xs text-white/30 mt-1">{brief.length} karakter</p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || brief.trim().length < 15}
              className="w-full bg-pink-500 hover:bg-pink-600 text-black font-semibold gap-2"
              data-testid="button-generate-marketing"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menyusun bahan marketing...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Buat Bahan Marketing</>
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
                <Megaphone className="h-10 w-10 text-white/15 mb-3" />
                <p className="text-white/40 text-sm max-w-xs">
                  Hasil bahan marketing akan muncul di sini setelah Anda menekan "Buat Bahan Marketing".
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center" data-testid="loading-state">
                <Loader2 className="h-8 w-8 text-pink-400 animate-spin mb-3" />
                <p className="text-white/50 text-sm">AI sedang menyusun bahan marketing Anda...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4" data-testid="result-marketing">
                <div className="flex items-center gap-2">
                  <Button onClick={handleCopy} size="sm" variant="outline" className="gap-1.5 border-white/15 text-white/70 hover:text-white" data-testid="button-copy">
                    {copied ? <><Check className="h-3.5 w-3.5" /> Tersalin</> : <><Copy className="h-3.5 w-3.5" /> Salin</>}
                  </Button>
                  <Button onClick={handleDownload} size="sm" variant="outline" className="gap-1.5 border-white/15 text-white/70 hover:text-white" data-testid="button-download">
                    <Download className="h-3.5 w-3.5" /> Unduh .txt
                  </Button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h2 className="text-lg font-bold text-white mb-1" data-testid="text-produk">{result.produk}</h2>
                  {result.positioning && <p className="text-sm text-pink-300 mb-2">{result.positioning}</p>}
                  {result.target_audiens && (
                    <p className="text-xs text-white/50 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {result.target_audiens}</p>
                  )}
                </div>

                {result.angle_iklan?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-pink-400" /> Angle Iklan</h3>
                    <div className="space-y-2">
                      {result.angle_iklan.map((a, i) => (
                        <div key={i} className="border-l-2 border-pink-500/40 pl-3" data-testid={`angle-${i}`}>
                          <p className="text-sm font-medium text-white">{a.judul}</p>
                          <p className="text-xs text-white/50">{a.deskripsi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.hook?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Hook</h3>
                    <ul className="space-y-1.5">
                      {result.hook.map((h, i) => (
                        <li key={i} className="text-sm text-white/70 flex items-start gap-2" data-testid={`hook-${i}`}>
                          <span className="text-pink-400">“</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.caption?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Caption per Platform</h3>
                    <div className="space-y-3">
                      {result.caption.map((c, i) => (
                        <div key={i} className="bg-white/[0.03] rounded-xl p-3" data-testid={`caption-${i}`}>
                          <Badge className="bg-pink-500/15 text-pink-300 border-pink-500/30 mb-2">{c.platform}</Badge>
                          <p className="text-sm text-white/80 whitespace-pre-wrap">{c.teks}</p>
                          {c.hashtag?.length > 0 && (
                            <p className="text-xs text-sky-400 mt-2 flex items-center gap-1 flex-wrap">
                              <Hash className="h-3 w-3" />
                              {c.hashtag.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.skrip_promosi?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-pink-400" /> Skrip Promosi</h3>
                    <div className="space-y-3">
                      {result.skrip_promosi.map((s, i) => (
                        <div key={i} data-testid={`skrip-${i}`}>
                          <p className="text-xs font-semibold text-pink-300 mb-1">{s.kanal}</p>
                          <p className="text-sm text-white/70 whitespace-pre-wrap">{s.isi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.cta?.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Call to Action</h3>
                    <ul className="space-y-1.5">
                      {result.cta.map((c, i) => (
                        <li key={i} className="text-sm text-white/70 flex items-start gap-2" data-testid={`cta-${i}`}>
                          <span className="text-pink-400">→</span>{c}
                        </li>
                      ))}
                    </ul>
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
