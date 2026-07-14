import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Info, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); }
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }

const KATEGORI_BIAYA = [
  { key: "material", label: "Biaya Material", color: "bg-blue-500", pct: 40 },
  { key: "upah", label: "Biaya Upah Tenaga Kerja", color: "bg-emerald-500", pct: 25 },
  { key: "alat", label: "Biaya Alat & Sewa", color: "bg-amber-500", pct: 10 },
  { key: "subkon", label: "Biaya Sub-kontraktor", color: "bg-violet-500", pct: 15 },
  { key: "overhead", label: "Overhead & Administrasi", color: "bg-rose-500", pct: 5 },
  { key: "lain", label: "Biaya Lain-lain", color: "bg-slate-500", pct: 5 },
];

interface BiayaItem { key: string; label: string; color: string; nilai: number }

export default function KalkulatorBEPProyek() {
  const [nilaiKontrak, setNilaiKontrak] = useState(0);
  const [biaya, setBiaya] = useState<Record<string, number>>({});
  const [profitTarget, setProfitTarget] = useState(10);
  const [contingency, setContingency] = useState(5);
  const [calculated, setCalculated] = useState(false);

  function updateBiaya(key: string, val: number) { setBiaya(prev => ({ ...prev, [key]: val })); setCalculated(false); }

  const totalBiayaLangsung = Object.values(biaya).reduce((a, b) => a + b, 0);
  const biayaContingency = totalBiayaLangsung * (contingency / 100);
  const totalBiaya = totalBiayaLangsung + biayaContingency;
  const profitTargetRp = nilaiKontrak * (profitTarget / 100);
  const breakEvenPoint = totalBiaya;
  const profitAktual = nilaiKontrak - totalBiaya;
  const marginAktual = nilaiKontrak > 0 ? (profitAktual / nilaiKontrak) * 100 : 0;
  const bepPersen = nilaiKontrak > 0 ? (breakEvenPoint / nilaiKontrak) * 100 : 0;
  const sudahBEP = nilaiKontrak >= breakEvenPoint;

  const biayaItems: BiayaItem[] = KATEGORI_BIAYA.map(k => ({
    key: k.key, label: k.label, color: k.color,
    nilai: biaya[k.key] || (nilaiKontrak * k.pct / 100),
  }));

  function autofill() {
    if (nilaiKontrak <= 0) return;
    const filled: Record<string, number> = {};
    KATEGORI_BIAYA.forEach(k => { filled[k.key] = Math.round(nilaiKontrak * k.pct / 100); });
    setBiaya(filled); setCalculated(false);
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
              <TrendingUp className="h-5 w-5 text-cyan-400" /> Kalkulator BEP Proyek Konstruksi
            </h1>
            <p className="text-xs text-slate-400">Hitung Break Even Point, margin profit aktual, dan analisis biaya proyek konstruksi secara instan</p>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-300">BEP (Break Even Point) adalah titik di mana nilai kontrak sama persis dengan total biaya proyek — tidak untung, tidak rugi. Penting untuk analisis keekonomian proyek sebelum penawaran dan selama eksekusi.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Nilai Kontrak / Harga Penawaran (Rp)</label>
            <input type="number" value={nilaiKontrak || ""} onChange={e => { setNilaiKontrak(+e.target.value); setCalculated(false); }}
              placeholder="cth: 10000000000 (10 miliar)"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            {nilaiKontrak > 0 && (
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-slate-500">{fmt(nilaiKontrak)}</p>
                <button onClick={autofill} className="text-[10px] text-cyan-400 hover:text-cyan-300">Auto-isi estimasi biaya →</button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Rincian Biaya Proyek (Rp)</label>
            <div className="space-y-2">
              {KATEGORI_BIAYA.map(k => (
                <div key={k.key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${k.color}`} />
                  <label className="text-xs text-slate-400 w-44 shrink-0">{k.label}</label>
                  <input type="number" value={biaya[k.key] || ""}
                    onChange={e => updateBiaya(k.key, +e.target.value)}
                    placeholder={nilaiKontrak > 0 ? `~${k.pct}% = ${fmt(nilaiKontrak * k.pct / 100)}` : "Rp 0"}
                    className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8">
              <p className="text-xs text-slate-400">Total Biaya Langsung</p>
              <p className="text-xs text-white font-semibold">{fmt(totalBiayaLangsung)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Contingency: <span className="text-cyan-400 font-bold">{contingency}%</span></label>
              <input type="range" min={0} max={20} step={0.5} value={contingency} onChange={e => { setContingency(+e.target.value); setCalculated(false); }} className="w-full accent-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Target Profit: <span className="text-emerald-400 font-bold">{profitTarget}%</span></label>
              <input type="range" min={0} max={30} step={0.5} value={profitTarget} onChange={e => { setProfitTarget(+e.target.value); setCalculated(false); }} className="w-full accent-emerald-500" />
            </div>
          </div>

          <Button onClick={() => setCalculated(true)} disabled={nilaiKontrak <= 0 || totalBiayaLangsung <= 0} className="w-full bg-cyan-600 hover:bg-cyan-700">
            <BarChart3 className="h-4 w-4 mr-2" />Hitung BEP & Analisis Margin
          </Button>
        </div>

        {calculated && nilaiKontrak > 0 && (
          <>
            <div className={`rounded-2xl border p-5 mb-4 ${sudahBEP ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="text-center mb-4">
                <p className="text-[10px] text-slate-500 mb-1">Status BEP</p>
                <p className={`text-2xl font-bold ${sudahBEP ? "text-emerald-400" : "text-red-400"}`}>
                  {sudahBEP ? "✓ DI ATAS BEP" : "✗ DI BAWAH BEP"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{sudahBEP ? "Proyek menguntungkan pada nilai kontrak ini" : "Nilai kontrak di bawah total biaya — proyek rugi!"}</p>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Progress ke BEP</span>
                  <span className="text-xs text-white font-semibold">{fmtPct(Math.min(bepPersen, 100))} dari kontrak</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${sudahBEP ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(bepPersen, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500"><span>Rp 0</span><span>BEP: {fmt(breakEvenPoint)}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Nilai Kontrak", fmt(nilaiKontrak), "text-white"],
                  ["Total Biaya (+ contingency)", fmt(totalBiaya), "text-red-400"],
                  ["Profit Aktual", fmt(profitAktual), profitAktual >= 0 ? "text-emerald-400" : "text-red-400"],
                  ["Margin Aktual", fmtPct(marginAktual), marginAktual >= profitTarget ? "text-emerald-400" : "text-amber-400"],
                  ["Target Profit", fmt(profitTargetRp), "text-blue-400"],
                  ["Biaya Contingency", fmt(biayaContingency), "text-amber-400"],
                ].map(([l, v, c]) => (
                  <div key={l} className="rounded-lg bg-white/3 border border-white/8 p-2.5">
                    <p className="text-[9px] text-slate-500 mb-0.5">{l}</p>
                    <p className={`text-xs font-bold ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
              <p className="text-xs text-white font-semibold mb-3">Komposisi Biaya</p>
              <div className="space-y-2">
                {KATEGORI_BIAYA.map((k, i) => {
                  const nilaiItem = biaya[k.key] || 0;
                  const pctAktual = totalBiaya > 0 ? (nilaiItem / totalBiaya) * 100 : 0;
                  return (
                    <div key={k.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${k.color}`} /><span className="text-slate-400">{k.label}</span></div>
                        <span className="text-white">{fmt(nilaiItem)} <span className="text-slate-500">({fmtPct(pctAktual)})</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className={`h-full rounded-full ${k.color}`} style={{ width: `${pctAktual}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button onClick={() => setCalculated(false)} variant="outline" className="w-full text-xs">Hitung Ulang</Button>
          </>
        )}
      </div>
    </div>
  );
}
