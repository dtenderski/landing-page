import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Zap, Info } from "lucide-react";
import { Link } from "wouter";

interface Dimension {
  code: string;
  label: string;
  weight: number;
  score: number;
  desc: string;
  source: string;
  levers: { code: string; label: string; delta: number; effort: string }[];
}

const INITIAL_DIMS: Dimension[] = [
  {
    code: "D1",
    label: "Eligibility Fit",
    weight: 0.20,
    score: 75,
    desc: "% persyaratan terpenuhi: SBU, SKK, kualifikasi, KBLI, modal, pengalaman",
    source: "AGENT-ELIGIBILITY (8 checklist)",
    levers: [
      { code: "L01", label: "Rekrut/MoU SKK Ahli yang kurang", delta: 6, effort: "3–14 hari" },
      { code: "L02", label: "KSO/JV dengan BUJK lebih besar", delta: 10, effort: "7–21 hari" },
      { code: "L09", label: "Tambah Dukungan Bank/KMK", delta: 3, effort: "3–7 hari" },
    ],
  },
  {
    code: "D2",
    label: "Technical Fit",
    weight: 0.20,
    score: 70,
    desc: "Kelengkapan & kualitas metode, schedule, personel, peralatan, RKK vs bobot RKS",
    source: "AGENT-TEKNIS (8 deliverable)",
    levers: [
      { code: "L06", label: "Upgrade metode (BIM/prefabrikasi)", delta: 5, effort: "3–10 hari" },
      { code: "L01", label: "Tambah personel berSKK Ahli", delta: 4, effort: "3–14 hari" },
      { code: "L10", label: "Refine BoQ item dominan", delta: 4, effort: "1–3 hari" },
    ],
  },
  {
    code: "D3",
    label: "Price Competitiveness",
    weight: 0.20,
    score: 65,
    desc: "Posisi bid vs sweet-spot historis pemenang (88–92% HPS). Bid > HPS = 0",
    source: "AGENT-HPS (AHSP + KB-MARKET)",
    levers: [
      { code: "L03", label: "Adjust bid ke sweet-spot 88–92% HPS", delta: 8, effort: "≤1 hari" },
      { code: "L10", label: "Refine BoQ untuk margin lebih baik", delta: 4, effort: "1–3 hari" },
    ],
  },
  {
    code: "D4",
    label: "Track Record",
    weight: 0.15,
    score: 60,
    desc: "Pengalaman sejenis 5/10 tahun, nilai kontrak terbesar, performa PPK",
    source: "Profil BUJK + KB-MARKET",
    levers: [
      { code: "L05", label: "Tambah 2 referensi proyek sejenis", delta: 4, effort: "1–3 hari" },
      { code: "L02", label: "KSO/JV untuk leverage track record", delta: 8, effort: "7–21 hari" },
    ],
  },
  {
    code: "D5",
    label: "Risk Exposure",
    weight: 0.10,
    score: 70,
    desc: "Inverse risk score: makin banyak klausul merah/kuning, makin rendah skor ini",
    source: "AGENT-RISKSCAN + AGENT-KONTRAK",
    levers: [
      { code: "L04", label: "Sanggah/negosiasi turunkan retensi/denda", delta: 5, effort: "3–7 hari" },
      { code: "L04", label: "Minta klarifikasi force majeure di Aanwijzing", delta: 3, effort: "1 hari" },
    ],
  },
  {
    code: "D6",
    label: "Admin Completeness",
    weight: 0.10,
    score: 80,
    desc: "% dari 12 dokumen administrasi LKPP yang valid & ter-tandatangan",
    source: "AGENT-ADMIN (12 dokumen standar)",
    levers: [
      { code: "L07", label: "Lengkapi 12 dokumen admin + e-meterai", delta: 4, effort: "1–3 hari" },
      { code: "L09", label: "Siapkan Dukungan Bank/KMK", delta: 2, effort: "3–7 hari" },
    ],
  },
  {
    code: "D7",
    label: "Integrity & Compliance",
    weight: 0.05,
    score: 100,
    desc: "Tidak ada flag SMAP, tidak di-blacklist LKPP, tidak ada sanksi PUPR",
    source: "AGENT-INTEGRITY (ISO 37001)",
    levers: [
      { code: "L08", label: "Audit internal SMAP sebelum submit", delta: 0, effort: "1–2 hari" },
    ],
  },
];

function getCategory(wp: number) {
  if (wp >= 80) return { label: "STRONG BID", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", emoji: "🟢" };
  if (wp >= 60) return { label: "CONDITIONAL", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", emoji: "🟡" };
  if (wp >= 40) return { label: "LONG-SHOT", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", emoji: "🟠" };
  return { label: "NO-BID", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", emoji: "🔴" };
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : value >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function WinProbability() {
  const [dims, setDims] = useState<Dimension[]>(INITIAL_DIMS);
  const [showLevers, setShowLevers] = useState(false);

  const wp = dims.reduce((sum, d) => sum + d.weight * d.score, 0);
  const wpRounded = Math.round(wp);
  const cat = getCategory(wpRounded);

  function updateScore(code: string, value: number) {
    setDims((prev) =>
      prev.map((d) => (d.code === code ? { ...d, score: value } : d))
    );
  }

  const allLevers = dims
    .flatMap((d) =>
      d.levers.map((l) => ({
        ...l,
        dimCode: d.code,
        dimLabel: d.label,
        currentScore: d.score,
        projectedScore: Math.min(100, d.score + l.delta),
        wpDelta: d.weight * l.delta,
      }))
    )
    .filter((l) => l.currentScore < 95)
    .sort((a, b) => b.wpDelta - a.wpDelta)
    .slice(0, 5);

  const projectedWp = allLevers.slice(0, 3).reduce((sum, l) => sum + l.wpDelta, wpRounded);
  const projectedCat = getCategory(Math.min(100, Math.round(projectedWp)));

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1328]/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Link href="/tender-monitor">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <BarChart3 className="h-5 w-5 text-purple-400" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Win Probability Calculator</div>
          <div className="text-xs text-white/40">7 Dimensi Berbobot · Formula TENDERA v1.0</div>
        </div>
        <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-300 hidden sm:flex">
          Real-time · No AI
        </Badge>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Score card */}
        <Card className={`border ${cat.bg}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/40 mb-1">WIN PROBABILITY</div>
                <div className={`text-5xl font-bold ${cat.color}`}>{wpRounded}</div>
                <div className="text-xs text-white/40 mt-1">/ 100</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-semibold ${cat.color}`}>
                  {cat.emoji} {cat.label}
                </div>
                <div className="text-xs text-white/40 mt-2 max-w-[200px] text-right">
                  {wpRounded >= 80 && "Submit penawaran — posisi kuat"}
                  {wpRounded >= 60 && wpRounded < 80 && "Tutup 2–3 gap prioritas sebelum submit"}
                  {wpRounded >= 40 && wpRounded < 60 && "Pertimbangkan KSO atau paket lain"}
                  {wpRounded < 40 && "Tidak direkomendasikan — cari paket yang lebih sesuai"}
                </div>
              </div>
            </div>

            {/* WP bar */}
            <div className="mt-4 w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-red-500/40" style={{ width: "40%" }} />
                <div className="h-full bg-orange-500/40" style={{ width: "20%" }} />
                <div className="h-full bg-yellow-500/40" style={{ width: "20%" }} />
                <div className="h-full bg-green-500/40" style={{ width: "20%" }} />
              </div>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  wpRounded >= 80 ? "bg-green-500" : wpRounded >= 60 ? "bg-yellow-500" : wpRounded >= 40 ? "bg-orange-500" : "bg-red-500"
                }`}
                style={{ width: `${wpRounded}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/20 mt-1">
              <span>0</span><span>40 NO-BID</span><span>60 COND</span><span>80 STRONG</span><span>100</span>
            </div>
          </CardContent>
        </Card>

        {/* Dimension sliders */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              Atur Skor Per Dimensi
              <span className="text-xs text-white/30 font-normal">(geser slider untuk simulasi)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dims.map((d) => (
              <div key={d.code} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/40">{d.code}</span>
                    <span className="text-sm font-medium">{d.label}</span>
                    <span className="text-xs text-white/30">({(d.weight * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${scoreColor(d.score)}`}>{d.score}</span>
                    <span className="text-xs text-white/20">× {d.weight} = <span className={scoreColor(d.score)}>{(d.weight * d.score).toFixed(1)}</span></span>
                  </div>
                </div>
                <Slider
                  value={[d.score]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => updateScore(d.code, v)}
                  className="cursor-pointer"
                  data-testid={`slider-${d.code}`}
                />
                <div className="flex items-start gap-1">
                  <Info className="h-2.5 w-2.5 text-white/20 mt-0.5 shrink-0" />
                  <span className="text-xs text-white/30">{d.desc}</span>
                </div>
                <ScoreBar value={d.score} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action levers */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>🔧 Top-5 Action Levers</span>
              <button
                onClick={() => setShowLevers(!showLevers)}
                className="text-xs text-white/40 hover:text-white transition-colors"
                data-testid="button-toggle-levers"
              >
                {showLevers ? "Sembunyikan" : "Tampilkan"}
              </button>
            </CardTitle>
          </CardHeader>
          {showLevers && (
            <CardContent className="space-y-2">
              <p className="text-xs text-white/40 mb-3">
                Aksi yang paling efektif menaikkan Win Probability sebelum deadline:
              </p>
              {allLevers.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded border border-white/5 bg-white/3"
                  data-testid={`lever-${i}`}
                >
                  <div className="shrink-0 w-6 h-6 rounded-full bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-xs font-bold text-purple-300">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{l.label}</div>
                    <div className="text-xs text-white/30">{l.dimLabel} · effort {l.effort}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-bold text-green-400">+{(l.wpDelta).toFixed(1)} WP</div>
                    <div className="text-xs text-white/30">{l.dimCode}: {l.currentScore}→{l.projectedScore}</div>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 rounded-lg border border-purple-700/30 bg-purple-900/10">
                <div className="text-xs text-purple-300 font-medium mb-1">
                  Proyeksi setelah Top-3 Levers dieksekusi:
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${cat.color}`}>{wpRounded}</span>
                  <span className="text-white/40">→</span>
                  <span className={`text-2xl font-bold ${projectedCat.color}`}>
                    {Math.min(100, Math.round(projectedWp))}
                  </span>
                  <Badge variant="outline" className={`text-xs ${projectedCat.bg}`}>
                    {projectedCat.emoji} {projectedCat.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Score table */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tabel Skor Lengkap</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40">
                    <th className="text-left px-3 py-2 font-normal">Dimensi</th>
                    <th className="text-center px-2 py-2 font-normal">Bobot</th>
                    <th className="text-center px-2 py-2 font-normal">Skor</th>
                    <th className="text-center px-2 py-2 font-normal">Kontribusi</th>
                  </tr>
                </thead>
                <tbody>
                  {dims.map((d) => (
                    <tr key={d.code} className="border-b border-white/5 hover:bg-white/3">
                      <td className="px-3 py-2">
                        <span className="font-mono text-white/30 mr-1">{d.code}</span>
                        {d.label}
                      </td>
                      <td className="text-center px-2 py-2 text-white/50">{(d.weight * 100).toFixed(0)}%</td>
                      <td className={`text-center px-2 py-2 font-bold ${scoreColor(d.score)}`}>{d.score}</td>
                      <td className={`text-center px-2 py-2 font-bold ${scoreColor(d.score)}`}>{(d.weight * d.score).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20 bg-white/5">
                    <td className="px-3 py-2 font-bold" colSpan={3}>WIN PROBABILITY</td>
                    <td className={`text-center px-2 py-2 text-lg font-bold ${cat.color}`}>{wpRounded}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          <Link href="/tender-ai">
            <Button className="w-full bg-blue-700 hover:bg-blue-600 text-white text-sm">
              🎯 Chat TENDERA AI
            </Button>
          </Link>
          <Link href="/bujk-profile">
            <Button variant="outline" className="w-full border-white/20 text-white/70 hover:text-white text-sm">
              🏢 Edit Profil BUJK
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
