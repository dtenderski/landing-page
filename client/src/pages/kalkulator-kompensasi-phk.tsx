import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users2, Info, AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const ALASAN_PHK = [
  { value: "pensiun", label: "Pensiun (≥56 tahun)", up: 1.75, upmk: 1, uph: 0, desc: "PP 35/2021 Pasal 56" },
  { value: "efisiensi", label: "Efisiensi / Restrukturisasi (tdk tutup)", up: 0.5, upmk: 1, uph: 0, desc: "PP 35/2021 Pasal 48" },
  { value: "tutup_rugi", label: "Perusahaan Tutup — Rugi 2+ tahun", up: 0.5, upmk: 1, uph: 0, desc: "PP 35/2021 Pasal 44" },
  { value: "tutup_tidak_rugi", label: "Perusahaan Tutup — Bukan Rugi", up: 1, upmk: 1, uph: 0, desc: "PP 35/2021 Pasal 44" },
  { value: "pekerja_meninggal", label: "Pekerja Meninggal Dunia", up: 2, upmk: 1, uph: 0.15, desc: "PP 35/2021 Pasal 61" },
  { value: "sakit_berkelanjutan", label: "Sakit Berkelanjutan > 12 bulan", up: 2, upmk: 2, uph: 0.15, desc: "PP 35/2021 Pasal 60" },
  { value: "pekerja_resign", label: "Pengunduran Diri (Resign) Sukarela", up: 0, upmk: 1, uph: 0.15, desc: "PP 35/2021 Pasal 54" },
  { value: "pelanggaran_berat", label: "PHK — Pelanggaran Berat (SP3)", up: 0, upmk: 1, uph: 0.15, desc: "PP 35/2021 Pasal 52" },
];

function calcUP(masa: number): number {
  if (masa < 1) return 0;
  if (masa < 2) return 1;
  if (masa < 3) return 2;
  if (masa < 4) return 3;
  if (masa < 5) return 4;
  if (masa < 6) return 5;
  if (masa < 7) return 6;
  if (masa < 8) return 7;
  if (masa < 9) return 8;
  return 9; // cap 9 bulan
}

function calcUPMK(masa: number): number {
  if (masa < 3) return 0;
  if (masa < 6) return 2;
  if (masa < 9) return 3;
  if (masa < 12) return 4;
  if (masa < 15) return 5;
  if (masa < 18) return 6;
  if (masa < 21) return 7;
  if (masa < 24) return 8;
  return 10; // cap 10 bulan
}

function fmt(n: number) { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); }

export default function KalkulatorKompensasiPHK() {
  const [gajiPokok, setGajiPokok] = useState(0);
  const [tunjangan, setTunjangan] = useState(0);
  const [masaKerja, setMasaKerja] = useState(5);
  const [alasan, setAlasan] = useState(ALASAN_PHK[0]);
  const [calculated, setCalculated] = useState(false);

  const gajiTotal = gajiPokok + tunjangan;
  const upBase = calcUP(masaKerja);
  const upmkBase = calcUPMK(masaKerja);

  const upBulan = alasan ? upBase * alasan.up : 0;
  const upmkBulan = alasan ? upmkBase * alasan.upmk : 0;
  const uphBulan = alasan ? alasan.uph : 0;

  const upNominal = upBulan * gajiTotal;
  const upmkNominal = upmkBulan * gajiTotal;
  const uphNominal = uphBulan * gajiTotal;
  const total = upNominal + upmkNominal + uphNominal;

  const upakhirBulan = Math.min(masaKerja >= 3 ? 1 : 0, 1); // 1 bulan jika masa ≥ 3 bulan

  function selectAlasan(val: string) {
    const found = ALASAN_PHK.find(a => a.value === val);
    if (found) setAlasan(found);
    setCalculated(false);
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
              <Users2 className="h-5 w-5 text-teal-400" /> Kalkulator Kompensasi PHK
            </h1>
            <p className="text-xs text-slate-400">Hitung pesangon, UPMK, dan UPH sesuai UU Cipta Kerja + PP 35/2021</p>
          </div>
        </div>

        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 mb-4 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
          <p className="text-xs text-teal-300">Kalkulator ini mengacu pada PP 35/2021. Hasilnya adalah estimasi — konsultasikan dengan HRD atau konsultan hukum ketenagakerjaan untuk perhitungan final yang telah memperhitungkan PKWT, PKB, dan perjanjian perusahaan.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Alasan PHK</label>
            <select value={alasan.value} onChange={e => selectAlasan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
              {ALASAN_PHK.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <p className="text-[10px] text-teal-400 mt-1">{alasan.desc}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Masa Kerja (tahun): <span className="text-teal-400 font-bold">{masaKerja} tahun</span></label>
            <input type="range" min={0} max={30} value={masaKerja} onChange={e => { setMasaKerja(+e.target.value); setCalculated(false); }}
              className="w-full accent-teal-500" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-0.5"><span>0 thn</span><span>30 thn</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Gaji Pokok (Rp/bulan)</label>
              <input type="number" value={gajiPokok || ""} onChange={e => { setGajiPokok(+e.target.value); setCalculated(false); }}
                placeholder="cth: 5000000"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Tunjangan Tetap (Rp/bulan)</label>
              <input type="number" value={tunjangan || ""} onChange={e => { setTunjangan(+e.target.value); setCalculated(false); }}
                placeholder="cth: 1500000"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            </div>
          </div>
          <Button onClick={() => setCalculated(true)} disabled={gajiPokok <= 0 || masaKerja <= 0} className="w-full bg-teal-600 hover:bg-teal-700">
            Hitung Kompensasi PHK
          </Button>
        </div>

        {calculated && gajiPokok > 0 && (
          <>
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 mb-4">
              <p className="text-xs text-teal-400 font-semibold mb-3">Hasil Perhitungan</p>
              <div className="space-y-2 mb-4">
                {[
                  ["Upah Acuan (Gaji + Tunjangan)", fmt(gajiTotal), "text-white"],
                  [`Uang Pesangon (UP) — ${upBase} bln × ${alasan.up}×`, fmt(upNominal), upNominal > 0 ? "text-teal-400" : "text-slate-500"],
                  [`UPMK — ${upmkBase} bln × ${alasan.upmk}×`, fmt(upmkNominal), upmkNominal > 0 ? "text-teal-400" : "text-slate-500"],
                  [`Uang Pengganti Hak (UPH) — ${alasan.uph * 100}%`, fmt(uphNominal), uphNominal > 0 ? "text-teal-400" : "text-slate-500"],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-sm font-semibold ${color}`}>{val}</p>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                  <p className="text-sm text-white font-semibold">Total Kompensasi</p>
                  <p className="text-xl font-bold text-teal-400">{fmt(total)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["UP", `${upBulan} bln upah`, upNominal > 0 ? "text-teal-400" : "text-slate-600"],
                  ["UPMK", `${upmkBulan} bln upah`, upmkNominal > 0 ? "text-teal-400" : "text-slate-600"],
                  ["UPH", `${(alasan.uph * 100).toFixed(0)}% upah`, uphNominal > 0 ? "text-teal-400" : "text-slate-600"],
                ].map(([title, val, color]) => (
                  <div key={title} className="rounded-xl bg-white/5 border border-white/8 p-2">
                    <p className="text-[9px] text-slate-500">{title}</p>
                    <p className={`text-xs font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
              <p className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Catatan Penting</p>
              <ul className="space-y-1">
                {[
                  "Upah pesangon menggunakan upah terakhir (gaji pokok + tunjangan tetap).",
                  "Pekerja PKWT yang berakhir masa kontraknya mendapat Uang Kompensasi (bukan UP/UPMK).",
                  "Jika terdapat PKB/PP yang lebih menguntungkan, maka PKB/PP yang berlaku.",
                  "PHK tanpa prosedur SP dapat dianggap batal demi hukum oleh PHI.",
                ].map((c, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><ChevronRight className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />{c}</li>)}
              </ul>
            </div>

            <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-xs">
              <Link href="/hubungan-industrial-claw">Konsultasi HubIn AI →</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
