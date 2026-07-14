import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileSignature, Loader2, Sparkles, Copy, Check, Download, Users, ListChecks, CalendarDays, AlertTriangle, Wand2, PackageCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { proposalTeamToOrgMembers } from "@shared/proposal-to-org";

/** Kunci handoff Proposal → Organization Builder (dibaca sekali lalu dihapus). */
const ORG_PREFILL_KEY = "gustafta_org_prefill_v1";
/** Kunci handoff Blueprint Builder → Proposal (dibaca sekali lalu dihapus). */
const PROPOSAL_PREFILL_KEY = "gustafta_proposal_prefill_v1";

interface ProposalResult {
  judul: string;
  klien: string;
  ringkasan_kebutuhan: string;
  solusi: string;
  lingkup_kerja: string[];
  tim_agen: { tim?: string; peran: string; tugas: string; gerbang?: string }[];
  claw_rekomendasi?: { nama: string; sebagai?: string; kenapa_cocok?: string }[];
  tahapan: { fase: string; durasi: string; hasil: string }[];
  rekomendasi_tier: string;
  estimasi: { setup: number; bulanan: number; catatan: string };
  syarat_ketentuan: string[];
  asumsi: string[];
  penutup: string;
}

const CONTOH = [
  "Toko bahan bangunan di Bekasi, ingin chatbot WhatsApp yang jawab stok & harga, catat pesanan, dan follow-up pelanggan lama.",
  "Kontraktor kecil butuh asisten AI untuk bantu cari info tender, siapkan dokumen SBU/SKK, dan estimasi RAB awal.",
  "Klinik kecantikan mau chatbot untuk booking jadwal, jawab FAQ perawatan, dan kirim pengingat ke pasien.",
];

function formatRupiah(val: number) {
  if (!val || isNaN(val)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function proposalToText(r: ProposalResult): string {
  const lines: string[] = [];
  lines.push(r.judul || "Proposal Jasa Order — Gustafta");
  lines.push(`Klien: ${r.klien || "-"}`);
  lines.push("");
  lines.push("RINGKASAN KEBUTUHAN");
  lines.push(r.ringkasan_kebutuhan || "-");
  lines.push("");
  lines.push("SOLUSI GUSTAFTA");
  lines.push(r.solusi || "-");
  lines.push("");
  if (r.lingkup_kerja?.length) {
    lines.push("LINGKUP KERJA");
    r.lingkup_kerja.forEach((s) => lines.push(`• ${s}`));
    lines.push("");
  }
  if (r.tim_agen?.length) {
    lines.push("TIM AGEN YANG DIRAKIT");
    const byTeam = new Map<string, typeof r.tim_agen>();
    r.tim_agen.forEach((a) => {
      const key = (a.tim || "").trim() || "Tim";
      if (!byTeam.has(key)) byTeam.set(key, [] as any);
      byTeam.get(key)!.push(a);
    });
    const multi = byTeam.size > 1;
    byTeam.forEach((anggota, tim) => {
      if (multi) lines.push(`[${tim}]`);
      anggota.forEach((a) => {
        const g = (a.gerbang || "").trim();
        const gate = g && g !== "-" ? ` (◆ ${g})` : "";
        lines.push(`• ${a.peran}: ${a.tugas}${gate}`);
      });
    });
    lines.push("");
  }
  if (r.claw_rekomendasi?.length) {
    lines.push("MANAJEMEN AI SIAP PAKAI (CLAW)");
    r.claw_rekomendasi.forEach((c) => {
      const sebagai = (c.sebagai || "").trim();
      lines.push(`• ${c.nama}${sebagai ? ` → ${sebagai}` : ""}`);
      if ((c.kenapa_cocok || "").trim()) lines.push(`  ${c.kenapa_cocok!.trim()}`);
    });
    lines.push("");
  }
  if (r.tahapan?.length) {
    lines.push("TAHAPAN PENGERJAAN");
    r.tahapan.forEach((t) => lines.push(`• ${t.fase} (${t.durasi}) → ${t.hasil}`));
    lines.push("");
  }
  lines.push("ESTIMASI BIAYA");
  lines.push(`Rekomendasi: ${r.rekomendasi_tier || "-"}`);
  lines.push(`Setup (sekali): ${formatRupiah(r.estimasi?.setup)}`);
  lines.push(`Bulanan (hosting+token): ${formatRupiah(r.estimasi?.bulanan)}`);
  if (r.estimasi?.catatan) lines.push(`Catatan: ${r.estimasi.catatan}`);
  lines.push("");
  if (r.syarat_ketentuan?.length) {
    lines.push("SYARAT & KETENTUAN");
    r.syarat_ketentuan.forEach((s) => lines.push(`• ${s}`));
    lines.push("");
  }
  if (r.asumsi?.length) {
    lines.push("ASUMSI");
    r.asumsi.forEach((s) => lines.push(`• ${s}`));
    lines.push("");
  }
  if (r.penutup) {
    lines.push("PENUTUP");
    lines.push(r.penutup);
  }
  return lines.join("\n");
}

export default function ProposalJasa() {
  const [namaKlien, setNamaKlien] = useState("");
  const [kontak, setKontak] = useState("");
  const [tenggat, setTenggat] = useState("");
  const [budget, setBudget] = useState("");
  const [kebutuhan, setKebutuhan] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fromBlueprint, setFromBlueprint] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROPOSAL_PREFILL_KEY);
      if (!raw) return;
      localStorage.removeItem(PROPOSAL_PREFILL_KEY);
      const data = JSON.parse(raw) as { kebutuhan?: string; source?: string };
      if (data?.kebutuhan && typeof data.kebutuhan === "string") {
        setKebutuhan(data.kebutuhan);
        if (data.source === "blueprint") setFromBlueprint(true);
      }
    } catch {
      /* prefill rusak — abaikan */
    }
  }, []);

  function handleRakitTim() {
    if (!result) return;
    const seeds = proposalTeamToOrgMembers(result.tim_agen || []);
    if (seeds.length === 0) return;
    const payload = {
      orgName: (result.klien ? `Tim untuk ${result.klien}` : result.judul || "Tim dari Proposal").slice(0, 120),
      mission: result.ringkasan_kebutuhan || result.solusi || "",
      members: seeds.map((s) => ({ ...s, systemPrompt: "" })),
      maxSpecialists: 3,
    };
    try { sessionStorage.setItem(ORG_PREFILL_KEY, JSON.stringify(payload)); } catch { /* storage diblokir — abaikan */ }
    setLocation("/organization-builder");
  }

  async function handleGenerate() {
    if (kebutuhan.trim().length < 15) {
      setError("Isi deskripsi kebutuhan minimal 15 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/proposal-jasa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaKlien, kontak, tenggat, budget, kebutuhan }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat proposal");
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
    navigator.clipboard.writeText(proposalToText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob(["\uFEFF" + proposalToText(result)], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Proposal_${(result.klien || "Klien").replace(/\s+/g, "_")}_${Date.now()}.txt`;
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
        <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30 gap-1.5">
          <FileSignature className="h-3.5 w-3.5" />
          Generator Penawaran Jasa
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-4">
            <FileSignature className="h-8 w-8 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Generator Penawaran / Proposal Jasa</h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Ceritakan kebutuhan calon klien Jasa Order → AI menyusun draf proposal profesional lengkap
            dengan lingkup kerja, tim agen, tahapan, dan estimasi biaya (setup + bulanan).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Nama klien</label>
                <Input value={namaKlien} onChange={(e) => setNamaKlien(e.target.value)} placeholder="Mis. Toko Berkah Jaya"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-nama-klien" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Kontak (opsional)</label>
                <Input value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="WA / email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-kontak" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Target tenggat (opsional)</label>
                <Input value={tenggat} onChange={(e) => setTenggat(e.target.value)} placeholder="Mis. 2 minggu"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-tenggat" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Perkiraan budget (opsional)</label>
                <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Mis. Rp 3 juta"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" data-testid="input-budget" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 block mb-1.5">Kebutuhan klien</label>
              {fromBlueprint && (
                <div className="flex items-center gap-2 mb-2 text-xs text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-lg px-3 py-2" data-testid="notice-from-blueprint">
                  <Wand2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Diisi otomatis dari Blueprint chatbot Anda. Silakan sunting bila perlu.
                </div>
              )}
              <Textarea
                value={kebutuhan}
                onChange={(e) => setKebutuhan(e.target.value)}
                placeholder="Ceritakan usaha klien & apa yang mereka butuhkan dari chatbot/AI..."
                className="min-h-[160px] bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                data-testid="input-kebutuhan"
              />
              <p className="text-xs text-white/30 mt-1">{kebutuhan.length} karakter</p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || kebutuhan.trim().length < 15}
              className="w-full bg-sky-500 hover:bg-sky-600 text-black font-semibold gap-2"
              data-testid="button-generate-proposal"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menyusun proposal...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Buat Proposal</>
              )}
            </Button>

            <div>
              <p className="text-xs text-white/40 mb-2">Contoh kebutuhan:</p>
              <div className="space-y-2">
                {CONTOH.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setKebutuhan(c)}
                    className="w-full text-left text-xs bg-white/3 hover:bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-white/50 hover:text-white/70 transition-colors"
                    data-testid={`button-contoh-${i}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" data-testid="text-error">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="lg:col-span-3">
            {!result && !loading && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center border border-dashed border-white/10 rounded-2xl p-8">
                <p className="text-white/30 text-sm">Draf proposal akan muncul di sini setelah Anda menekan "Buat Proposal".</p>
              </div>
            )}
            {loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 border border-white/10 rounded-2xl p-8">
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                <p className="text-white/40 text-sm">AI sedang menyusun proposal...</p>
              </div>
            )}
            {result && (
              <div className="space-y-4" data-testid="result-proposal">
                <div className="flex items-center gap-2">
                  <Button onClick={handleCopy} size="sm" variant="outline" className="border-white/15 text-white/80 gap-1.5" data-testid="button-copy">
                    {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Tersalin</> : <><Copy className="h-3.5 w-3.5" /> Salin teks</>}
                  </Button>
                  <Button onClick={handleDownload} size="sm" variant="outline" className="border-white/15 text-white/80 gap-1.5" data-testid="button-download">
                    <Download className="h-3.5 w-3.5" /> Unduh .txt
                  </Button>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-white" data-testid="text-judul">{result.judul}</h2>
                    <p className="text-sm text-white/40">Klien: {result.klien}</p>
                  </div>

                  <Section title="Ringkasan Kebutuhan">
                    <p className="text-sm text-white/70 leading-relaxed">{result.ringkasan_kebutuhan}</p>
                  </Section>

                  <Section title="Solusi Gustafta">
                    <p className="text-sm text-white/70 leading-relaxed">{result.solusi}</p>
                  </Section>

                  {result.lingkup_kerja.length > 0 && (
                    <Section title="Lingkup Kerja" icon={<ListChecks className="h-4 w-4 text-sky-400" />}>
                      <ul className="space-y-1.5">
                        {result.lingkup_kerja.map((s, i) => (
                          <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-sky-400">•</span>{s}</li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {result.tim_agen.length > 0 && (() => {
                    const byTeam = new Map<string, typeof result.tim_agen>();
                    result.tim_agen.forEach((a) => {
                      const key = (a.tim || "").trim() || "Tim";
                      if (!byTeam.has(key)) byTeam.set(key, [] as any);
                      byTeam.get(key)!.push(a);
                    });
                    const multi = byTeam.size > 1;
                    return (
                      <Section title="Tim Agen yang Dirakit" icon={<Users className="h-4 w-4 text-violet-400" />}>
                        <div className="space-y-3">
                          {Array.from(byTeam.entries()).map(([tim, anggota], ti) => (
                            <div key={ti} className="space-y-1.5" data-testid={`group-tim-${ti}`}>
                              {multi && (
                                <p className="text-xs font-semibold text-violet-300 uppercase tracking-wide">{tim}</p>
                              )}
                              {anggota.map((a, i) => {
                                const g = (a.gerbang || "").trim();
                                const hasGate = g && g !== "-";
                                return (
                                  <div key={i} className="text-sm">
                                    <span className="text-white font-medium">{a.peran}</span>
                                    <span className="text-white/50"> — {a.tugas}</span>
                                    {hasGate && (
                                      <div className="text-xs text-amber-300/80 mt-0.5">◆ {g}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                          <div className="pt-2">
                            <Button
                              onClick={handleRakitTim}
                              variant="outline"
                              className="w-full gap-2 border-violet-500/40 text-violet-200 hover:bg-violet-500/10"
                              data-testid="btn-rakit-tim"
                            >
                              <Wand2 className="h-4 w-4" />
                              Rakit Tim Ini di Organization Builder
                            </Button>
                            <p className="text-[11px] text-white/30 mt-1.5 text-center">
                              Prefill anggota tim ke perakit — Anda tetap meninjau &amp; menyesuaikan sebelum dibuat.
                            </p>
                          </div>
                        </div>
                      </Section>
                    );
                  })()}

                  {(result.claw_rekomendasi?.length ?? 0) > 0 && (
                    <Section title="Manajemen AI Siap Pakai (Claw)" icon={<PackageCheck className="h-4 w-4 text-amber-400" />}>
                      <p className="text-[11px] text-white/40 mb-2.5">
                        Paket claw siap pakai yang cocok jadi departemen manajemen AI di perusahaan klien — lebih cepat &amp; teruji dibanding merakit dari nol. Ini produk premium berlisensi (biaya lisensi + bulanan tersendiri); harga final &amp; keputusan berisiko tetap di tangan manusia (◆).
                      </p>
                      <div className="space-y-2.5">
                        {result.claw_rekomendasi!.map((c, i) => (
                          <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3" data-testid={`card-claw-${i}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-white font-medium" data-testid={`text-claw-nama-${i}`}>{c.nama}</span>
                              {(c.sebagai || "").trim() && (
                                <Badge variant="outline" className="border-amber-500/40 text-amber-200 text-[10px]">
                                  {c.sebagai}
                                </Badge>
                              )}
                            </div>
                            {(c.kenapa_cocok || "").trim() && (
                              <p className="text-xs text-white/50 mt-1">{c.kenapa_cocok}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {result.tahapan.length > 0 && (
                    <Section title="Tahapan Pengerjaan" icon={<CalendarDays className="h-4 w-4 text-emerald-400" />}>
                      <div className="space-y-2">
                        {result.tahapan.map((t, i) => (
                          <div key={i} className="text-sm text-white/70">
                            <span className="text-white font-medium">{t.fase}</span>
                            <span className="text-white/40"> · {t.durasi}</span>
                            <div className="text-white/50">{t.hasil}</div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title="Estimasi Biaya">
                    <p className="text-sm text-sky-300 font-medium mb-2">{result.rekomendasi_tier}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-white/40">Setup (sekali)</p>
                        <p className="text-lg font-bold text-white" data-testid="text-setup">{formatRupiah(result.estimasi.setup)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-white/40">Bulanan (hosting+token)</p>
                        <p className="text-lg font-bold text-white" data-testid="text-bulanan">{formatRupiah(result.estimasi.bulanan)}</p>
                      </div>
                    </div>
                    {result.estimasi.catatan && <p className="text-xs text-white/40 mt-2">{result.estimasi.catatan}</p>}
                  </Section>

                  {result.syarat_ketentuan.length > 0 && (
                    <Section title="Syarat & Ketentuan">
                      <ul className="space-y-1">
                        {result.syarat_ketentuan.map((s, i) => (
                          <li key={i} className="text-xs text-white/50 flex gap-2"><span>•</span>{s}</li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {result.asumsi.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-400 mb-1.5">Asumsi (perlu verifikasi)</p>
                      <ul className="space-y-1">
                        {result.asumsi.map((s, i) => (
                          <li key={i} className="text-xs text-amber-200/70 flex gap-2"><span>•</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.penutup && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-sm text-white/60 leading-relaxed">{result.penutup}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-white/30 text-center">
                  Ini draf bantu. Harga & lingkup final serta pengiriman ke klien = keputusan Anda (◆ gerbang manusia).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-1.5">{icon}{title}</h3>
      {children}
    </div>
  );
}
