import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Camera, Upload, Loader2, RefreshCw, ShieldAlert,
  AlertTriangle, CheckCircle2, XCircle, FileText, Eye
} from "lucide-react";
import { Link } from "wouter";

interface Temuan {
  kode: string;
  kategori: string;
  deskripsi: string;
  tingkat: "KRITIS" | "TINGGI" | "SEDANG" | "RENDAH";
  regulasi: string;
  rekomendasi: string;
}

interface K3Result {
  lokasi_estimasi: string;
  jenis_pekerjaan: string;
  ringkasan: string;
  skor_kepatuhan: number;
  temuan: Temuan[];
  tindakan_segera: string[];
  poin_positif: string[];
  catatan_inspektur: string;
}

const TINGKAT_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  KRITIS:  { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  TINGGI:  { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  SEDANG:  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  RENDAH:  { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
};

function SkorBadge({ skor }: { skor: number }) {
  const color = skor >= 80 ? "text-green-400 border-green-500/30 bg-green-500/10"
    : skor >= 60 ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
    : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <div className={`inline-flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 ${color}`}>
      <span className="text-2xl font-bold">{skor}</span>
      <span className="text-[10px] font-medium opacity-70">/ 100</span>
    </div>
  );
}

export default function K3Vision() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<K3Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5 MB");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/k3-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, catatan }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menganalisis foto");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setImageBase64(null);
    setImagePreview(null);
    setCatatan("");
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex-1" />
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          K3 Vision Inspector
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <Eye className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">AI Vision K3 Inspector</h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Upload foto lapangan konstruksi → GPT-4o Vision menganalisis potensi pelanggaran K3 dan menghasilkan laporan terstruktur sesuai regulasi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">
                Foto Lapangan
              </label>
              {!imagePreview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-[200px] border-2 border-dashed border-white/15 hover:border-red-500/40 rounded-xl flex flex-col items-center justify-center gap-3 text-white/40 hover:text-white/60 transition-all"
                  data-testid="button-upload-foto"
                >
                  <Camera className="h-10 w-10" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Klik untuk Upload Foto</p>
                    <p className="text-xs mt-0.5">JPG, PNG, WEBP · Maks. 5 MB</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Foto lapangan, scaffolding, APD, dll.</span>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Preview" className="w-full h-[200px] object-cover" />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white/80 rounded-lg p-1.5 transition-colors"
                    data-testid="button-hapus-foto"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file-foto"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">
                Konteks Tambahan <span className="text-white/30">(opsional)</span>
              </label>
              <Textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Misal: pekerjaan galian basement lantai -2, ada kegiatan las di dekat material mudah terbakar, pekerja tidak pakai APD lengkap..."
                className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none text-sm"
                data-testid="input-konteks-k3"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !imageBase64}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold gap-2"
              data-testid="button-analisis-k3"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menganalisis Foto...</>
              ) : (
                <><Eye className="h-4 w-4" /> Analisis K3 Sekarang</>
              )}
            </Button>

            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 space-y-2">
              <p className="text-xs text-red-400 font-medium">Regulasi Acuan</p>
              <div className="space-y-1 text-xs text-white/40">
                <p>· PP No. 50/2012 (SMK3)</p>
                <p>· PermenPUPR No. 10/2021 (SMKK)</p>
                <p>· ISO 45001:2018 (SMK3)</p>
                <p>· NFPA 10/13/72 (Kebakaran)</p>
                <p>· OSHA 1926 (Konstruksi)</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {!result && !loading && !error && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center border border-white/8 rounded-2xl bg-white/2">
                <ShieldAlert className="h-12 w-12 text-white/15 mb-3" />
                <p className="text-white/30 text-sm">Hasil analisis K3 akan muncul di sini</p>
                <p className="text-white/20 text-xs mt-1">Upload foto lapangan, lalu klik Analisis</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center border border-white/8 rounded-2xl bg-white/2">
                <div className="relative mb-4">
                  <Eye className="h-12 w-12 text-red-400/60" />
                  <Loader2 className="h-5 w-5 text-red-400 animate-spin absolute -bottom-1 -right-1" />
                </div>
                <p className="text-white/60 text-sm">AI Vision sedang menganalisis foto...</p>
                <p className="text-white/30 text-xs mt-1">Mendeteksi potensi bahaya & pelanggaran K3</p>
              </div>
            )}

            {error && (
              <div className="border border-red-500/20 rounded-2xl bg-red-500/5 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
                <Button onClick={handleAnalyze} variant="outline" size="sm" className="mt-3 gap-2 border-red-500/30 text-red-400">
                  <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
                </Button>
              </div>
            )}

            {result && (
              <div className="space-y-4" data-testid="result-k3">
                <div className="flex items-start gap-4 p-4 border border-white/8 rounded-xl bg-white/2">
                  <SkorBadge skor={result.skor_kepatuhan} />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-white">{result.lokasi_estimasi}</h2>
                    <p className="text-xs text-white/40 mt-0.5">{result.jenis_pekerjaan}</p>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed">{result.ringkasan}</p>
                  </div>
                </div>

                {result.tindakan_segera.length > 0 && (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                    <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> TINDAKAN SEGERA DIPERLUKAN
                    </p>
                    <ul className="space-y-1.5">
                      {result.tindakan_segera.map((t, i) => (
                        <li key={i} className="text-xs text-white/70 flex gap-2">
                          <span className="text-red-400 font-bold shrink-0">{i + 1}.</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.temuan.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Temuan ({result.temuan.length})
                    </p>
                    <div className="space-y-2">
                      {result.temuan.map((t, i) => {
                        const cfg = TINGKAT_CONFIG[t.tingkat] || TINGKAT_CONFIG.RENDAH;
                        return (
                          <div key={i} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/30">{t.kode}</span>
                                <span className="text-xs font-medium text-white/70">{t.kategori}</span>
                              </div>
                              <Badge className={`text-[10px] font-bold px-2 py-0 ${cfg.color} bg-transparent border-current/30`}>
                                {t.tingkat}
                              </Badge>
                            </div>
                            <p className="text-xs text-white/80 mb-1">{t.deskripsi}</p>
                            <p className="text-[10px] text-white/40 mb-1.5">📋 {t.regulasi}</p>
                            <p className="text-[10px] text-white/60 bg-white/5 rounded-lg px-2 py-1.5">
                              ✅ {t.rekomendasi}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.poin_positif.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                    <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Poin Positif
                    </p>
                    <ul className="space-y-1">
                      {result.poin_positif.map((p, i) => (
                        <li key={i} className="text-xs text-white/60 flex gap-2">
                          <span className="text-green-400/60 shrink-0">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.catatan_inspektur && (
                  <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                    <p className="text-xs text-white/40 font-medium mb-1.5 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Catatan Inspektur AI
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">{result.catatan_inspektur}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-white/25">Analisis berbasis AI · Verifikasi oleh AK3U/Pengawas K3 sebelum dijadikan laporan resmi</p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-white/10 text-white/50 hover:text-white text-xs"
                    data-testid="button-inspeksi-baru"
                  >
                    <RefreshCw className="h-3 w-3" /> Inspeksi Baru
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
