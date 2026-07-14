import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, FileEdit, Copy, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "wouter";

const TIPE_SPK = [
  "SPK Subkontraktor (Pekerjaan Sipil/Struktur)",
  "SPK Subkontraktor (Pekerjaan MEP)",
  "SPK Subkontraktor (Pekerjaan Finishing)",
  "SPK Mandor Borong (Borongan Pekerjaan Harian)",
  "SPK Pengadaan Material",
  "SPK Sewa Alat Berat",
  "SPK Jasa Laboratorium & Pengujian",
  "SPK Konsultan / Tenaga Ahli Harian",
  "SPK Pekerjaan Tambah / Addendum",
  "SPK Lainnya",
];

const METODE_BAYAR = [
  "Termin berdasarkan progress pekerjaan (bobot %)",
  "Pembayaran setelah pekerjaan selesai & disetujui",
  "Termin mingguan berdasarkan volume terpasang",
  "DP 20% + termin 60% + retention 20%",
  "Pembayaran bulanan sesuai kemajuan",
];

interface HasilSPK {
  nomorSPK: string;
  judul: string;
  narasiLingkupPekerjaan: string;
  ketentuanUmum: string[];
  ketentuanTeknis: string[];
  ketentuanK3: string[];
  ketentuanPembayaran: string;
  sanksiDanDenda: string[];
  ketentuanPengakhiran: string[];
  ketentuanLainnya: string[];
  pasal_tandatangan: string;
}

export default function GeneratorSPK() {
  const [tipeSPK, setTipeSPK] = useState(TIPE_SPK[0]);
  const [namaProyek, setNamaProyek] = useState("");
  const [namaPemberiKerja, setNamaPemberiKerja] = useState("");
  const [namaPenerima, setNamaPenerima] = useState("");
  const [lingkupPekerjaan, setLingkupPekerjaan] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [durasiPekerjaan, setDurasiPekerjaan] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [metodeBayar, setMetodeBayar] = useState(METODE_BAYAR[0]);
  const [retensi, setRetensi] = useState("5");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilSPK | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!namaProyek.trim() || !lingkupPekerjaan.trim()) return;
    setLoading(true);
    setHasil(null);
    try {
      const res = await fetch("/api/tools/generator-spk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipeSPK, namaProyek, namaPemberiKerja, namaPenerima, lingkupPekerjaan, nilaiKontrak, durasiPekerjaan, tanggalMulai, metodeBayar, retensi }),
      });
      const data = await res.json();
      setHasil(data.hasil);
    } catch {
      setHasil(null);
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!hasil) return;
    const text = [
      hasil.judul,
      `No. ${hasil.nomorSPK}`,
      "",
      "LINGKUP PEKERJAAN",
      hasil.narasiLingkupPekerjaan,
      "",
      "KETENTUAN UMUM",
      ...hasil.ketentuanUmum.map(k => `• ${k}`),
      "",
      "KETENTUAN TEKNIS",
      ...hasil.ketentuanTeknis.map(k => `• ${k}`),
      "",
      "KETENTUAN K3",
      ...hasil.ketentuanK3.map(k => `• ${k}`),
      "",
      "PEMBAYARAN",
      hasil.ketentuanPembayaran,
      "",
      "SANKSI & DENDA",
      ...hasil.sanksiDanDenda.map(k => `• ${k}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/kompetensi-hub">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <FileEdit className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generator SPK Konstruksi</h1>
              <p className="text-slate-400 text-sm">Buat Surat Perintah Kerja formal untuk subkontraktor, mandor, pengadaan, dan sewa alat</p>
            </div>
            <Badge className="ml-auto bg-blue-500/15 text-blue-400 border-blue-500/30">Gelombang 21</Badge>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tipe SPK *</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tipeSPK} onChange={e => setTipeSPK(e.target.value)}>
                {TIPE_SPK.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nama Proyek *</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Pembangunan Gedung Kantor 8 Lt" value={namaProyek} onChange={e => setNamaProyek(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Pemberi Kerja (PT/Kontraktor)</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: PT Konstruksi Maju Jaya" value={namaPemberiKerja} onChange={e => setNamaPemberiKerja(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Penerima SPK</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: CV Pondasi Jaya / Mandor Sutrisno" value={namaPenerima} onChange={e => setNamaPenerima(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Nilai SPK / Borongan</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: Rp 245.000.000 atau Rp 850.000/m²" value={nilaiKontrak} onChange={e => setNilaiKontrak(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Durasi Pekerjaan</label>
              <input className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500"
                placeholder="cth: 60 hari kalender" value={durasiPekerjaan} onChange={e => setDurasiPekerjaan(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Tanggal Mulai</label>
              <input type="date" className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Retensi (%)</label>
              <input type="number" min={0} max={10} className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={retensi} onChange={e => setRetensi(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Metode Pembayaran</label>
              <select className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white"
                value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
                {METODE_BAYAR.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 mb-1.5 block font-medium">Lingkup Pekerjaan *</label>
              <textarea rows={3} className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 resize-none"
                placeholder="cth: Pekerjaan pemancangan 120 titik bored pile Ø60cm kedalaman 18m, termasuk mobilisasi alat, beton mutu fc'30, tulangan D16, dan pembersihan area..."
                value={lingkupPekerjaan} onChange={e => setLingkupPekerjaan(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generate} disabled={loading || !namaProyek.trim() || !lingkupPekerjaan.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat SPK...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate SPK</>}
            </Button>
            {hasil && <Button onClick={() => setHasil(null)} variant="outline" className="border-slate-600 text-slate-300"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>}
          </div>
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300">Menyusun SPK formal...</p>
          </div>
        )}

        {hasil && (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-blue-300 text-xs font-mono mb-1">No. {hasil.nomorSPK}</div>
                  <h2 className="text-white font-bold text-lg">{hasil.judul}</h2>
                </div>
                <Button onClick={copyAll} variant="outline" size="sm" className="border-blue-500/40 text-blue-300 shrink-0">
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{hasil.narasiLingkupPekerjaan}</p>
            </div>

            {[
              { title: "Ketentuan Umum", items: hasil.ketentuanUmum, color: "text-blue-300" },
              { title: "Ketentuan Teknis", items: hasil.ketentuanTeknis, color: "text-teal-300" },
              { title: "Ketentuan K3", items: hasil.ketentuanK3, color: "text-orange-300" },
              { title: "Sanksi & Denda Keterlambatan", items: hasil.sanksiDanDenda, color: "text-red-300" },
              { title: "Ketentuan Pengakhiran SPK", items: hasil.ketentuanPengakhiran, color: "text-slate-300" },
              { title: "Ketentuan Lainnya", items: hasil.ketentuanLainnya, color: "text-slate-300" },
            ].map(section => (
              <div key={section.title} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className={`${section.color} font-semibold mb-3`}>{section.title}</h3>
                <ul className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-slate-500 shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Ketentuan Pembayaran</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{hasil.ketentuanPembayaran}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4">Persetujuan & Tandatangan</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="h-12 border-b border-slate-600 mb-2"></div>
                  <div className="text-white text-sm font-medium">{namaPemberiKerja || "Pemberi Kerja"}</div>
                  <div className="text-slate-400 text-xs">Project Manager</div>
                  <div className="text-slate-500 text-xs mt-1">Tanggal: _______________</div>
                </div>
                <div className="text-center">
                  <div className="h-12 border-b border-slate-600 mb-2"></div>
                  <div className="text-white text-sm font-medium">{namaPenerima || "Penerima SPK"}</div>
                  <div className="text-slate-400 text-xs">Pelaksana Pekerjaan</div>
                  <div className="text-slate-500 text-xs mt-1">Tanggal: _______________</div>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-3 italic">{hasil.pasal_tandatangan}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
