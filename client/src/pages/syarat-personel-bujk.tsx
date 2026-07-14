import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, Building2, CheckCircle2,
  XCircle, AlertTriangle, RotateCcw, Download, Users,
  ShieldAlert, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { Link } from "wouter";

const KLASIFIKASI = [
  { value: "BG", label: "BG — Bangunan Gedung", desc: "Gedung komersial, hunian, fasilitas umum" },
  { value: "BS", label: "BS — Bangunan Sipil", desc: "Jalan, jembatan, bendungan, rel kereta" },
  { value: "IM", label: "IM — Instalasi MEP", desc: "Mekanikal, elektrikal, plumbing" },
  { value: "KO", label: "KO — Konstruksi Spesialis", desc: "Fondasi, struktur khusus, demolisi" },
  { value: "KK-R", label: "KK-R — Konsultansi Rekayasa", desc: "Perencana & pengawas rekayasa" },
  { value: "KK-NR", label: "KK-NR — Konsultansi Non-Rekayasa", desc: "Manajemen, kajian, pengembangan" },
];

const KUALIFIKASI = [
  { value: "K2", label: "K2 — Kecil Perorangan" },
  { value: "K3", label: "K3 — Kecil" },
  { value: "M1", label: "M1 — Menengah" },
  { value: "M2", label: "M2 — Menengah Atas" },
  { value: "B1", label: "B1 — Besar" },
  { value: "B2", label: "B2 — Besar Utama" },
];

interface PersonelReq {
  jabatan: string;
  levelSkk: string;
  jumlah: number;
  wajib: boolean;
  keterangan: string;
}

interface ComplianceItem {
  jabatan: string;
  levelSkk: string;
  status: "ada" | "kurang" | "tidak_ada";
  jumlahAda: number;
  jumlahDibutuhkan: number;
  catatan: string;
}

interface RequirementResult {
  klasifikasi: string;
  kualifikasi: string;
  namaPerusahaan: string;
  dasarHukum: string;
  syaratPersonel: PersonelReq[];
  syaratLain: string[];
  complianceCheck: ComplianceItem[] | null;
  skorKepatuhan: number | null;
  statusKepatuhan: "lulus" | "perlu_perbaikan" | "tidak_lulus" | null;
  risikoKetidakpatuhan: string[];
  rekomendasiGap: string[];
  estimasiBiayaGap: string | null;
  kesimpulan: string;
}

function CollapseSection({ title, icon, children, defaultOpen = true, badge }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden mb-3">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge && <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">{badge}</Badge>}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function SyaratPersonelBUJK() {
  const [klasifikasi, setKlasifikasi] = useState("");
  const [kualifikasi, setKualifikasi] = useState("");
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [mode, setMode] = useState<"lihat" | "cek">("lihat");
  const [personelAda, setPersonelAda] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RequirementResult | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!klasifikasi || !kualifikasi) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/syarat-personel-bujk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ klasifikasi, kualifikasi, namaPerusahaan, mode, personelAda }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal menganalisis. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    const text = [
      `SYARAT PERSONEL BUJK — Permen PUPR 6/2025`,
      `Klasifikasi: ${result.klasifikasi} | Kualifikasi: ${result.kualifikasi}`,
      result.namaPerusahaan ? `Perusahaan: ${result.namaPerusahaan}` : "",
      `Dasar Hukum: ${result.dasarHukum}`,
      ``,
      `=== SYARAT PERSONEL ===`,
      ...result.syaratPersonel.map(p =>
        `${p.wajib ? "[WAJIB]" : "[disarankan]"} ${p.jabatan} — ${p.levelSkk} (${p.jumlah} orang)\n  ${p.keterangan}`
      ),
      ``,
      ...(result.complianceCheck ? [
        `=== COMPLIANCE CHECK ===`,
        `Skor Kepatuhan: ${result.skorKepatuhan}% — ${result.statusKepatuhan}`,
        ...result.complianceCheck.map(c =>
          `${c.status === "ada" ? "✓" : c.status === "kurang" ? "⚠" : "✗"} ${c.jabatan} (${c.jumlahAda}/${c.jumlahDibutuhkan}): ${c.catatan}`
        ),
        ``,
        `Risiko: ${result.risikoKetidakpatuhan.join("; ")}`,
        `Rekomendasi: ${result.rekomendasiGap.join("; ")}`,
      ] : []),
      ``,
      `Kesimpulan: ${result.kesimpulan}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
  }

  const statusConfig = {
    lulus: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Lulus ✓" },
    perlu_perbaikan: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Perlu Perbaikan ⚠" },
    tidak_lulus: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Tidak Lulus ✗" },
  };
  const complianceIcon = { ada: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />, kurang: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />, tidak_ada: <XCircle className="h-4 w-4 text-red-400 shrink-0" /> };
  const complianceBg = { ada: "border-emerald-500/20 bg-emerald-500/5", kurang: "border-amber-500/20 bg-amber-500/5", tidak_ada: "border-red-500/20 bg-red-500/5" };

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
                <h1 className="text-base font-bold text-white">Syarat Personel BUJK</h1>
                <p className="text-xs text-slate-400">{result.klasifikasi} · {result.kualifikasi}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyResult} size="sm" variant="outline" className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Salin
              </Button>
              <Button onClick={() => setResult(null)} size="sm" variant="outline" className="text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Ulang
              </Button>
            </div>
          </div>

          {/* Summary Banner */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 mb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-white font-semibold text-sm">{result.namaPerusahaan || "Analisis BUJK"}</p>
                <p className="text-slate-400 text-xs">{result.klasifikasi} — {result.kualifikasi}</p>
              </div>
              {result.statusKepatuhan && (
                <div className={`rounded-lg px-3 py-1.5 border ${statusConfig[result.statusKepatuhan].bg}`}>
                  <p className={`text-sm font-bold ${statusConfig[result.statusKepatuhan].color}`}>
                    {statusConfig[result.statusKepatuhan].label}
                  </p>
                  {result.skorKepatuhan !== null && (
                    <p className="text-xs text-slate-400 text-center">{result.skorKepatuhan}% patuh</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">{result.dasarHukum}</p>
            </div>
          </div>

          {/* Syarat Personel */}
          <CollapseSection title="Syarat Personel Wajib" icon={<Users className="h-4 w-4 text-amber-400" />} badge={`${result.syaratPersonel.length} jabatan`}>
            <div className="space-y-2 pt-1">
              {result.syaratPersonel.map((p, i) => (
                <div key={i} className={`rounded-lg border p-3 ${p.wajib ? "border-amber-500/20 bg-amber-500/5" : "border-white/8 bg-white/2"}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{p.jabatan}</p>
                        {p.wajib && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-400/30">WAJIB</Badge>}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{p.keterangan}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">{p.levelSkk}</Badge>
                      <p className="text-slate-500 text-[10px] mt-0.5">{p.jumlah} orang</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {result.syaratLain.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-slate-500 text-xs font-medium mb-1.5">Syarat Lainnya</p>
                <ul className="space-y-1">
                  {result.syaratLain.map((s, i) => (
                    <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                      <span className="text-slate-500 shrink-0">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapseSection>

          {/* Compliance Check */}
          {result.complianceCheck && result.complianceCheck.length > 0 && (
            <CollapseSection title="Hasil Compliance Check" icon={<ShieldAlert className="h-4 w-4 text-blue-400" />}>
              <div className="space-y-2 pt-1">
                {result.complianceCheck.map((c, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${complianceBg[c.status]}`}>
                    <div className="flex items-start gap-2">
                      {complianceIcon[c.status]}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-xs font-medium">{c.jabatan}</p>
                          <span className="text-xs text-slate-400">{c.jumlahAda}/{c.jumlahDibutuhkan} orang</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{c.catatan}</p>
                        <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-700 mt-1">{c.levelSkk}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {result.risikoKetidakpatuhan.length > 0 && (
                <div className="mt-3 rounded-lg bg-red-500/5 border border-red-500/15 p-3">
                  <p className="text-red-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" /> Risiko Ketidakpatuhan
                  </p>
                  <ul className="space-y-1">
                    {result.risikoKetidakpatuhan.map((r, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.rekomendasiGap.length > 0 && (
                <div className="mt-2 rounded-lg bg-violet-500/5 border border-violet-500/15 p-3">
                  <p className="text-violet-400 text-xs font-semibold mb-1.5">Rekomendasi Penutupan Gap</p>
                  <ul className="space-y-1">
                    {result.rekomendasiGap.map((r, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                  {result.estimasiBiayaGap && (
                    <p className="text-amber-400 text-xs mt-2 border-t border-white/5 pt-2">
                      Estimasi biaya sertifikasi gap: <span className="font-semibold">{result.estimasiBiayaGap}</span>
                    </p>
                  )}
                </div>
              )}
            </CollapseSection>
          )}

          {/* Kesimpulan */}
          {result.kesimpulan && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 mb-4 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs leading-relaxed">{result.kesimpulan}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/cek-kelayakan-skk">Cek Kelayakan SKK Individu →</Link>
            </Button>
            <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs">
              <Link href="/sbu-claw">SBUClaw — Konsultan SBU →</Link>
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
              <Building2 className="h-5 w-5 text-orange-400" /> Syarat Personel BUJK
            </h1>
            <p className="text-xs text-slate-400">Permen PUPR 6/2025 — Kebutuhan SKK per klasifikasi & kualifikasi</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-5">
          <button onClick={() => setMode("lihat")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "lihat" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
            Lihat Syarat
          </button>
          <button onClick={() => setMode("cek")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "cek" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
            Cek Compliance
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
          {mode === "cek" && (
            <div>
              <label className="text-xs text-slate-400 block mb-2">Nama Perusahaan (opsional)</label>
              <input type="text" value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)}
                placeholder="PT. ABC Konstruksi"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-400/50 transition-colors" />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-2">Klasifikasi Usaha *</label>
            <div className="space-y-1.5">
              {KLASIFIKASI.map(k => (
                <button key={k.value} onClick={() => setKlasifikasi(k.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${klasifikasi === k.value ? "bg-orange-500/15 border-orange-400/40" : "border-white/10 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${klasifikasi === k.value ? "text-orange-300" : "text-slate-300"}`}>{k.label}</span>
                    <span className="text-xs text-slate-500">{k.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Kualifikasi / Grade *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KUALIFIKASI.map(k => (
                <button key={k.value} onClick={() => setKualifikasi(k.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium text-center transition-all ${kualifikasi === k.value ? "bg-orange-500/15 border-orange-400/40 text-orange-300" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "cek" && (
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Personel SKK yang Sudah Dimiliki <span className="text-slate-600">(deskripsikan jabatan + SKK + jumlah)</span>
              </label>
              <textarea value={personelAda} onChange={e => setPersonelAda(e.target.value)}
                rows={4}
                placeholder={`Contoh:\n- 1 orang Ahli Teknik Bangunan Gedung Madya (SKK aktif)\n- 2 orang Ahli K3 Konstruksi Muda (SKK aktif)\n- 1 orang Ahli Manajemen Konstruksi Muda (sedang proses)`}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-400/50 transition-colors resize-none" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={generate} disabled={!klasifikasi || !kualifikasi || loading} className="w-full bg-orange-600 hover:bg-orange-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Menganalisis Regulasi...</>
              : mode === "lihat"
                ? <><Sparkles className="h-4 w-4 mr-2" />Lihat Syarat Personel</>
                : <><ShieldAlert className="h-4 w-4 mr-2" />Cek Compliance BUJK</>
            }
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
          <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-500 leading-relaxed">
            <p className="font-medium text-slate-400 mb-1">Berdasarkan Permen PUPR No. 6 Tahun 2025:</p>
            <p>Setiap BUJK wajib memiliki tenaga ahli bersertifikat (PJT/PJK) sesuai klasifikasi dan kualifikasinya. Kekurangan personel SKK dapat menyebabkan SBU tidak diterbitkan/diperbarui dan BUJK tidak bisa mengikuti tender proyek pemerintah.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
