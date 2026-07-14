import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, DollarSign, ChevronRight, Info, TrendingUp,
  Building2, Plus, Trash2, BarChart3, CheckCircle2, Zap
} from "lucide-react";
import { Link } from "wouter";

interface TenagaSKK {
  jabatan: string;
  jumlah: number;
}

const JABATAN_LIST = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya", "Ahli Manajemen Proyek — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Manajemen Kontrak — Muda",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Bangunan Gedung — Madya",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jembatan — Muda",
  "Ahli Arsitektur — Muda", "Ahli Teknik Mekanikal — Muda",
];

const POIN_JABATAN: Record<string, number> = {
  "Utama": 10, "Madya": 7, "Muda": 4,
};
function getPoin(jabatan: string): number {
  if (jabatan.includes("Utama")) return 10;
  if (jabatan.includes("Madya")) return 7;
  return 4;
}

const KLASIFIKASI_SBU: Record<string, number> = {
  "K3 Konstruksi": 2, "Manajemen Proyek": 3, "Manajemen Konstruksi": 2,
  "Quantity Surveyor": 2, "Pengawas Konstruksi": 2,
  "Teknik Bangunan Gedung": 2, "Teknik Jalan": 2, "Teknik Jembatan": 2,
};
function getKlasifikasi(jabatan: string): string {
  if (jabatan.includes("K3")) return "K3 Konstruksi";
  if (jabatan.includes("Manajemen Proyek")) return "Manajemen Proyek";
  if (jabatan.includes("Manajemen Konstruksi")) return "Manajemen Konstruksi";
  if (jabatan.includes("Quantity")) return "Quantity Surveyor";
  if (jabatan.includes("Pengawas")) return "Pengawas Konstruksi";
  if (jabatan.includes("Bangunan Gedung")) return "Teknik Bangunan Gedung";
  if (jabatan.includes("Jalan")) return "Teknik Jalan";
  if (jabatan.includes("Jembatan")) return "Teknik Jembatan";
  return "Teknik Konstruksi";
}

export default function KalkulatorManfaatSKKBUJK() {
  const [tenagaList, setTenagaList] = useState<TenagaSKK[]>([{ jabatan: "", jumlah: 1 }]);
  const [skalaBUJK, setSkalaBUJK] = useState<"Kecil" | "Menengah" | "Besar">("Menengah");

  function addRow() { setTenagaList(prev => [...prev, { jabatan: "", jumlah: 1 }]); }
  function removeRow(i: number) { setTenagaList(prev => prev.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: keyof TenagaSKK, val: any) {
    setTenagaList(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  const validRows = tenagaList.filter(r => r.jabatan && r.jumlah > 0);

  // Kalkulasi
  const totalPoin = validRows.reduce((acc, r) => acc + getPoin(r.jabatan) * r.jumlah, 0);
  const totalTenaga = validRows.reduce((acc, r) => acc + r.jumlah, 0);

  // Estimasi kualifikasi SBU
  const kualifikasiSBU = totalPoin >= 200 ? "B2 (Besar)" : totalPoin >= 100 ? "B1 (Besar)" : totalPoin >= 50 ? "M2 (Menengah)" : totalPoin >= 25 ? "M1 (Menengah)" : "K2 (Kecil)";
  const nilaiProyekMaks = totalPoin >= 200 ? "Tanpa Batas" : totalPoin >= 100 ? "Rp 250 M+" : totalPoin >= 50 ? "Rp 50–250 M" : totalPoin >= 25 ? "Rp 10–50 M" : "s/d Rp 10 M";

  // Klasifikasi coverage
  const klasifikasiCovered = new Set(validRows.map(r => getKlasifikasi(r.jabatan)));
  const sbuCount = klasifikasiCovered.size;

  // Estimasi biaya K3 compliance
  const hasK3 = validRows.some(r => r.jabatan.includes("K3"));
  const totalK3 = validRows.filter(r => r.jabatan.includes("K3")).reduce((a, r) => a + r.jumlah, 0);
  const k3Compliance = hasK3 ? (totalK3 >= 3 ? "Memenuhi proyek skala besar" : totalK3 >= 1 ? "Memenuhi proyek menengah" : "Perlu tambahan tenaga K3") : "Belum ada tenaga K3";

  // Estimasi nilai lelang peningkatan
  const biayaRekrutTotal = validRows.reduce((acc, r) => {
    const baseGaji = getPoin(r.jabatan) >= 10 ? 22000000 : getPoin(r.jabatan) >= 7 ? 12000000 : 7000000;
    return acc + (baseGaji * r.jumlah);
  }, 0);

  function formatRp(n: number) {
    if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(1)} miliar`;
    if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(0)} juta`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  }

  const hasData = validRows.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" /> Kalkulator Manfaat SKK untuk BUJK
            </h1>
            <p className="text-xs text-slate-400">Hitung manfaat komposisi tenaga SKK: kualifikasi SBU, cakupan klasifikasi, estimasi kapasitas tender</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">Estimasi berdasarkan regulasi Permen PUPR tentang persyaratan tenaga ahli SKK untuk kualifikasi SBU. Untuk keputusan bisnis resmi, konsultasikan ke LPJK/asosiasi.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Skala BUJK</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Kecil", "Menengah", "Besar"] as const).map(s => (
                <button key={s} onClick={() => setSkalaBUJK(s)}
                  className={`rounded-lg border py-2 text-xs transition-all ${skalaBUJK === s ? "bg-orange-500/15 border-orange-400/40 text-orange-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Komposisi Tenaga SKK</label>
            <div className="space-y-2">
              {tenagaList.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={row.jabatan} onChange={e => updateRow(i, "jabatan", e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="">Pilih jabatan SKK...</option>
                    {JABATAN_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateRow(i, "jumlah", Math.max(1, row.jumlah - 1))} className="w-7 h-7 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm">−</button>
                    <span className="w-6 text-center text-xs text-white font-medium">{row.jumlah}</span>
                    <button onClick={() => updateRow(i, "jumlah", row.jumlah + 1)} className="w-7 h-7 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm">+</button>
                  </div>
                  {tenagaList.length > 1 && (
                    <button onClick={() => removeRow(i)} className="w-7 h-7 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addRow} className="mt-2 text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors">
              <Plus className="h-3.5 w-3.5" />Tambah jabatan SKK
            </button>
          </div>
        </div>

        {hasData ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                <p className="text-[10px] text-slate-500 mb-1">Total Poin SKK</p>
                <p className="text-2xl font-bold text-orange-400">{totalPoin}</p>
                <p className="text-[10px] text-slate-500">dari {totalTenaga} tenaga ahli</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="text-[10px] text-slate-500 mb-1">Estimasi Kualifikasi SBU</p>
                <p className="text-lg font-bold text-blue-400">{kualifikasiSBU}</p>
                <p className="text-[10px] text-slate-500">maks. {nilaiProyekMaks}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 mb-4 space-y-3">
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-orange-400" /> Analisis Komposisi SKK</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-white/8">
                  <span className="text-xs text-slate-400">Klasifikasi yang tercakup</span>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">{sbuCount} klasifikasi</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/8">
                  <span className="text-xs text-slate-400">Status K3 Compliance</span>
                  <span className={`text-xs font-medium ${hasK3 ? "text-emerald-400" : "text-red-400"}`}>{k3Compliance}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/8">
                  <span className="text-xs text-slate-400">Est. biaya gaji bulanan</span>
                  <span className="text-xs font-medium text-white">{formatRp(biayaRekrutTotal)}/bulan</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-400">Kapasitas nilai proyek</span>
                  <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">{nilaiProyekMaks}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-4">
              <p className="text-xs text-slate-400 font-semibold mb-3">Breakdown per Jabatan</p>
              <div className="space-y-1.5">
                {validRows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white">{r.jabatan}</span>
                      <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-700">{r.jumlah} orang</Badge>
                    </div>
                    <span className="text-xs text-orange-400 font-medium">{getPoin(r.jabatan) * r.jumlah} poin</span>
                  </div>
                ))}
              </div>
            </div>

            {!hasK3 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Belum ada Ahli K3 Konstruksi. Untuk mengikuti tender konstruksi pemerintah, umumnya diwajibkan memiliki minimal 1 Ahli K3 Konstruksi bersertifikat.</p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center mb-4">
            <Building2 className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Masukkan komposisi tenaga SKK untuk melihat analisis</p>
          </div>
        )}

        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-xs">
          <Link href="/planner-skk-bujk">Planner SKK BUJK →</Link>
        </Button>
      </div>
    </div>
  );
}
