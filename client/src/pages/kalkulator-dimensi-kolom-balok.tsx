import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Columns, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const MUTU_BETON = [
  { label: "K-175 (fc' 14.5 MPa)", fc: 14.5 },
  { label: "K-225 (fc' 19.3 MPa)", fc: 19.3 },
  { label: "K-250 (fc' 21.7 MPa)", fc: 21.7 },
  { label: "K-300 (fc' 25.0 MPa)", fc: 25.0 },
  { label: "K-350 (fc' 29.0 MPa)", fc: 29.0 },
  { label: "K-400 (fc' 33.2 MPa)", fc: 33.2 },
  { label: "K-500 (fc' 41.5 MPa)", fc: 41.5 },
];

const MUTU_BAJA = [
  { label: "BJTP 24 (fy = 240 MPa)", fy: 240 },
  { label: "BJTD 32 (fy = 320 MPa)", fy: 320 },
  { label: "BJTD 40 (fy = 400 MPa)", fy: 400 },
  { label: "BJTD 48 (fy = 480 MPa)", fy: 480 },
];

const JENIS_ELEMEN = ["Kolom", "Balok"] as const;
type JenisElemen = (typeof JENIS_ELEMEN)[number];

interface HasilKolom {
  b: number; h: number;
  Agbrutto: number;
  tulLongMin: number; tulLongMax: number;
  jumlahTulLong: number; diamTulLong: number; asLong: number;
  diamSengkang: number; jarakSengkang: number;
  kapasitasAksial: number;
  status: string;
  catatan: string[];
}

interface HasilBalok {
  b: number; h: number;
  AsTarik: number; AsTekan: number;
  tulTarik: { n: number; d: number }; tulTekan: { n: number; d: number };
  sengkang: { d: number; s: number };
  Mn: number; kapasitasGeser: number;
  status: string;
  catatan: string[];
}

function hitungKolom(Pu: number, fc: number, fy: number, rasioTulangan = 0.02): HasilKolom {
  const phi = 0.65;
  const Ag = Pu * 1000 / (phi * (0.8 * (0.85 * fc * (1 - rasioTulangan) + fy * rasioTulangan)));
  const sisi = Math.ceil(Math.sqrt(Ag) / 50) * 50;
  const b = Math.max(300, sisi); const h = b;
  const AgAktual = b * h;
  const AstMin = 0.01 * AgAktual; const AstMax = 0.08 * AgAktual;
  const Ast = rasioTulangan * AgAktual;
  const diamOptions = [16, 19, 22, 25, 29, 32];
  let best = { n: 8, d: 16, as: 0 };
  for (const d of diamOptions) {
    const as1 = Math.PI * d * d / 4;
    const n = Math.max(4, Math.ceil(Ast / as1));
    const asTotal = n * as1;
    if (asTotal >= AstMin && asTotal <= AstMax) { best = { n, d, as: asTotal }; break; }
    if (asTotal >= AstMin) { best = { n, d, as: asTotal }; break; }
  }
  const kapasitas = phi * (0.85 * fc * (AgAktual - best.as) + fy * best.as) / 1000;
  const status = kapasitas >= Pu ? "MEMADAI ✓" : "PERLU DIPERBESAR ✗";
  const jarakSengkang = Math.min(b / 2, 8 * best.d, 200);
  return { b, h, Agbrutto: AgAktual, tulLongMin: AstMin, tulLongMax: AstMax, jumlahTulLong: best.n, diamTulLong: best.d, asLong: best.as, diamSengkang: 10, jarakSengkang, kapasitasAksial: kapasitas, status, catatan: ["Rasio tulangan 1–2% (rekomendasi ekonomis)", "Sengkang sesuai SNI 2847:2019 Pasal 18", "Selimut beton min 40mm untuk lingkungan normal"] };
}

function hitungBalok(Mu: number, Vu: number, bentang: number, fc: number, fy: number): HasilBalok {
  const phi = 0.9; const phiV = 0.75;
  const h = Math.ceil((bentang * 1000 / 12) / 50) * 50;
  const b = Math.ceil(h / 2 / 50) * 50;
  const d = h - 60;
  const Rn = Mu * 1e6 / (phi * b * d * d);
  const rho = (0.85 * fc / fy) * (1 - Math.sqrt(1 - 2 * Rn / (0.85 * fc)));
  const rhoMin = Math.max(1.4 / fy, 0.25 * Math.sqrt(fc) / fy);
  const rhoFinal = Math.max(rho, rhoMin);
  const As = rhoFinal * b * d;
  const AsTekan = 0.3 * As;
  const diamOptions = [16, 19, 22, 25];
  let bestT = { n: 2, d: 16 }, bestP = { n: 2, d: 12 };
  for (const diam of diamOptions) {
    const asBar = Math.PI * diam * diam / 4;
    const n = Math.ceil(As / asBar);
    if (n <= 6) { bestT = { n, d: diam }; break; }
  }
  for (const diam of [12, 16]) {
    const asBar = Math.PI * diam * diam / 4;
    const n = Math.ceil(AsTekan / asBar);
    if (n <= 4) { bestP = { n, d: diam }; break; }
  }
  const Vc = 0.17 * Math.sqrt(fc) * b * d / 1000;
  const Vs = Math.max(0, Vu / phiV - Vc);
  const Av = Math.PI * 10 * 10 / 4 * 2;
  const s = Vs > 0 ? Math.min(Math.floor(Av * fy * d / (Vs * 1000)), 200) : 200;
  const Mn = phi * bestT.n * Math.PI * bestT.d * bestT.d / 4 * fy * (d - bestT.n * Math.PI * bestT.d * bestT.d / 4 * fy / (2 * 0.85 * fc * b)) / 1e6;
  const status = Mn >= Mu ? "MEMADAI ✓" : "PERLU DIPERBESAR ✗";
  return { b, h, AsTarik: As, AsTekan, tulTarik: bestT, tulTekan: bestP, sengkang: { d: 10, s }, Mn, kapasitasGeser: phiV * (Vc + Vs), status, catatan: ["Selimut beton 40mm (dalam ruangan)", "d = h - 60mm (selimut + sengkang + ½D tulangan)", "Periksa lendutan dan retak sesuai SNI 2847:2019"] };
}

export default function KalkulatorDimensiKolomBalok() {
  const [jenis, setJenis] = useState<JenisElemen>("Kolom");
  const [Pu, setPu] = useState(800);
  const [Mu, setMu] = useState(120);
  const [Vu, setVu] = useState(80);
  const [bentang, setBentang] = useState(6);
  const [mutuBeton, setMutuBeton] = useState(MUTU_BETON[3].label);
  const [mutuBaja, setMutuBaja] = useState(MUTU_BAJA[2].label);
  const [rasioTul, setRasioTul] = useState(2);
  const [hasilKolom, setHasilKolom] = useState<HasilKolom | null>(null);
  const [hasilBalok, setHasilBalok] = useState<HasilBalok | null>(null);

  const fc = MUTU_BETON.find(m => m.label === mutuBeton)?.fc ?? 25;
  const fy = MUTU_BAJA.find(m => m.label === mutuBaja)?.fy ?? 400;

  function hitung() {
    if (jenis === "Kolom") setHasilKolom(hitungKolom(Pu, fc, fy, rasioTul / 100));
    else setHasilBalok(hitungBalok(Mu, Vu, bentang, fc, fy));
  }

  function reset() { setHasilKolom(null); setHasilBalok(null); }

  const idr = (n: number) => n.toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20"><Columns className="h-6 w-6 text-cyan-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kalkulator Dimensi Kolom & Balok Beton Bertulang</h1>
              <p className="text-slate-400 text-sm">Dimensi awal + kebutuhan tulangan longitudinal & geser — SNI 2847:2019 / ACI 318</p>
            </div>
            <Badge className="ml-auto bg-cyan-500/15 text-cyan-400 border-cyan-500/30">Gelombang 26</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="flex gap-2 mb-4">
            {JENIS_ELEMEN.map(e => (
              <button key={e} onClick={() => { setJenis(e); reset(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${jenis === e ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{e}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {jenis === "Kolom" ? (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Beban Aksial Pu (kN) *</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={Pu} onChange={e => setPu(Number(e.target.value))} />
                  <div className="text-slate-600 text-xs mt-0.5">1.2D + 1.6L (ultimate)</div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Rasio Tulangan (%)</label>
                  <select className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={rasioTul} onChange={e => setRasioTul(Number(e.target.value))}>
                    {[1, 1.5, 2, 2.5, 3, 4].map(v => <option key={v} value={v}>{v}% {v === 2 ? "(rekomendasi)" : ""}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Momen Lentur Mu (kN·m) *</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={Mu} onChange={e => setMu(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Gaya Geser Vu (kN)</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={Vu} onChange={e => setVu(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Bentang Balok (m)</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={bentang} onChange={e => setBentang(Number(e.target.value))} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Mutu Beton</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={mutuBeton} onChange={e => setMutuBeton(e.target.value)}>
                {MUTU_BETON.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Mutu Baja Tulangan</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white text-sm" value={mutuBaja} onChange={e => setMutuBaja(e.target.value)}>
                {MUTU_BAJA.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={hitung} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">Hitung Dimensi & Tulangan</Button>
            {(hasilKolom || hasilBalok) && <Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {hasilKolom && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${hasilKolom.status.includes("✓") ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"}`}>
              <div className={`text-lg font-bold mb-1 ${hasilKolom.status.includes("✓") ? "text-green-300" : "text-red-300"}`}>{hasilKolom.status}</div>
              <div className="text-white text-2xl font-bold">{hasilKolom.b} × {hasilKolom.h} mm</div>
              <div className="text-slate-400 text-sm">φPn = {hasilKolom.kapasitasAksial.toFixed(0)} kN vs Pu = {Pu} kN</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Dimensi Kolom", value: `${hasilKolom.b} × ${hasilKolom.h} mm` },
                { label: "Tulangan Longitudinal", value: `${hasilKolom.jumlahTulLong}D${hasilKolom.diamTulLong}` },
                { label: "As Longitudinal", value: `${hasilKolom.asLong.toFixed(0)} mm²` },
                { label: "Sengkang", value: `D${hasilKolom.diamSengkang}-${hasilKolom.jarakSengkang}` },
              ].map(i => (
                <div key={i.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                  <div className="text-cyan-300 font-bold">{i.value}</div>
                  <div className="text-xs text-slate-400">{i.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400 space-y-0.5">{hasilKolom.catatan.map((c, i) => <div key={i}>• {c}</div>)}</div>
          </div>
        )}

        {hasilBalok && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${hasilBalok.status.includes("✓") ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"}`}>
              <div className={`text-lg font-bold mb-1 ${hasilBalok.status.includes("✓") ? "text-green-300" : "text-red-300"}`}>{hasilBalok.status}</div>
              <div className="text-white text-2xl font-bold">{hasilBalok.b} × {hasilBalok.h} mm</div>
              <div className="text-slate-400 text-sm">φMn = {hasilBalok.Mn.toFixed(1)} kN·m vs Mu = {Mu} kN·m</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Dimensi Balok (b×h)", value: `${hasilBalok.b} × ${hasilBalok.h} mm` },
                { label: "Tul. Tarik", value: `${hasilBalok.tulTarik.n}D${hasilBalok.tulTarik.d}` },
                { label: "Tul. Tekan", value: `${hasilBalok.tulTekan.n}D${hasilBalok.tulTekan.d}` },
                { label: "Sengkang", value: `D${hasilBalok.sengkang.d}-${hasilBalok.sengkang.s}` },
              ].map(i => (
                <div key={i.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                  <div className="text-cyan-300 font-bold">{i.value}</div>
                  <div className="text-xs text-slate-400">{i.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400 space-y-0.5">{hasilBalok.catatan.map((c, i) => <div key={i}>• {c}</div>)}</div>
          </div>
        )}

        <div className="mt-6 bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300/70">
          ⚠ Hasil ini adalah estimasi preliminary design berdasarkan SNI 2847:2019. Desain akhir wajib dihitung oleh Insinyur Struktural berlisensi dan mempertimbangkan beban lengkap, kondisi tanah, dan persyaratan khusus proyek.
        </div>
      </div>
    </div>
  );
}
