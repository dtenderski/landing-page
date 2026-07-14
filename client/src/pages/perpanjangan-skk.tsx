import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Sparkles, RefreshCw, CalendarDays,
  CheckCircle2, AlertTriangle, XCircle, Clock, FileText,
  RotateCcw, ArrowRight, DollarSign, Info, ListChecks, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "wouter";

const SKK_LIST = [
  "Ahli K3 Konstruksi — Muda", "Ahli K3 Konstruksi — Madya", "Ahli K3 Konstruksi — Utama",
  "Ahli Teknik Bangunan Gedung — Muda", "Ahli Teknik Bangunan Gedung — Madya", "Ahli Teknik Bangunan Gedung — Utama",
  "Ahli Manajemen Konstruksi — Muda", "Ahli Manajemen Konstruksi — Madya", "Ahli Manajemen Konstruksi — Utama",
  "Ahli Quantity Surveyor — Muda", "Ahli Quantity Surveyor — Madya", "Ahli Quantity Surveyor — Utama",
  "Ahli Manajemen Proyek — Muda", "Ahli Manajemen Proyek — Madya", "Ahli Manajemen Proyek — Utama",
  "Ahli Pengawas Konstruksi — Muda", "Ahli Pengawas Konstruksi — Madya",
  "Ahli Manajemen Kontrak — Muda", "Ahli Manajemen Kontrak — Madya",
  "Ahli Teknik Jalan — Muda", "Ahli Teknik Jalan — Madya",
  "Ahli Teknik Jembatan — Muda", "Ahli Teknik Jembatan — Madya",
  "Ahli Teknik Geoteknik — Muda", "Ahli Teknik Geoteknik — Madya",
  "Ahli Teknik Mekanikal — Muda", "Ahli Teknik Mekanikal — Madya",
  "Ahli Teknik Elektrikal — Muda", "Ahli Teknik Elektrikal — Madya",
  "Ahli Arsitektur — Muda", "Ahli Arsitektur — Madya",
  "Ahli Desain Interior — Muda",
  "Teknisi/Analis — Pelaksana", "Teknisi/Analis — Pelaksana Muda", "Teknisi/Analis — Pelaksana Madya",
  "Operator — Kelas I", "Operator — Kelas II", "Operator — Kelas III",
];

interface JalurPerp {
  nama: string;
  cocokUntuk: string;
  prosedur: string[];
  estimasiWaktu: string;
  estimasiBiaya: string;
  kelebihan: string;
}

interface PanduanResult {
  jabatanSkk: string;
  tanggalTerbit: string;
  tanggalExpired: string;
  masaBerlaku: string;
  sisaHari: number;
  status: "aktif_aman" | "akan_expired" | "mendesak" | "sudah_expired";
  statusLabel: string;
  rekomendasiMulai: string;
  jalurPerpanjangan: JalurPerp[];
  dokumenUmum: string[];
  risikoTidakDiperpanjang: string[];
  tipsPersiapan: string[];
  catatanPenting: string;
}

function CollapseBox({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden mb-3">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-2">{icon}<span className="text-sm font-semibold text-white">{title}</span></div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

const STATUS_CONFIG = {
  aktif_aman: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2, label: "Aktif — Aman" },
  akan_expired: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle, label: "Segera Diperpanjang" },
  mendesak: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", icon: AlertTriangle, label: "MENDESAK" },
  sudah_expired: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle, label: "Sudah Expired" },
};

export default function PerpanjanganSKK() {
  const [jabatan, setJabatan] = useState("");
  const [tanggalTerbit, setTanggalTerbit] = useState("");
  const [nomorSkk, setNomorSkk] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PanduanResult | null>(null);
  const [error, setError] = useState("");

  // Calculate expiry preview in real-time (SKK berlaku 3 tahun)
  const expiryPreview = useMemo(() => {
    if (!tanggalTerbit) return null;
    const terbit = new Date(tanggalTerbit);
    const expired = new Date(terbit);
    expired.setFullYear(expired.getFullYear() + 3);
    const today = new Date();
    const diffMs = expired.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { expired, diffDays };
  }, [tanggalTerbit]);

  async function generate() {
    if (!jabatan || !tanggalTerbit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/perpanjangan-skk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan, tanggalTerbit, nomorSkk }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal memuat panduan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const sc = STATUS_CONFIG[result.status];
    const StatusIcon = sc.icon;
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setResult(null)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white">Panduan Perpanjangan SKK</h1>
                <p className="text-xs text-slate-400">{result.jabatanSkk}</p>
              </div>
            </div>
            <Button onClick={() => setResult(null)} size="sm" variant="outline" className="text-xs gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Cek Lagi
            </Button>
          </div>

          {/* Status Hero */}
          <div className={`rounded-2xl border p-5 mb-4 ${sc.bg}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`h-5 w-5 ${sc.color}`} />
                  <span className={`text-lg font-bold ${sc.color}`}>{sc.label}</span>
                </div>
                <p className="text-slate-300 text-sm">{result.jabatanSkk}</p>
                {result.catatanPenting && (
                  <p className="text-slate-400 text-xs mt-1">{result.catatanPenting}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-slate-500 text-xs">Sisa masa berlaku</p>
                <p className={`text-3xl font-bold ${result.sisaHari < 0 ? "text-red-400" : result.sisaHari < 90 ? "text-amber-400" : "text-emerald-400"}`}>
                  {result.sisaHari < 0 ? Math.abs(result.sisaHari) : result.sisaHari}
                </p>
                <p className="text-slate-500 text-xs">{result.sisaHari < 0 ? "hari expired" : "hari lagi"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-slate-500 text-xs">Terbit</p>
                <p className="text-white text-sm font-medium">{result.tanggalTerbit}</p>
              </div>
              <div className="border-x border-white/10 text-center">
                <p className="text-slate-500 text-xs">Expired</p>
                <p className={`text-sm font-medium ${result.sisaHari < 0 ? "text-red-400" : "text-white"}`}>{result.tanggalExpired}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs">Mulai proses</p>
                <p className="text-amber-400 text-sm font-medium">{result.rekomendasiMulai}</p>
              </div>
            </div>
          </div>

          {/* Jalur Perpanjangan */}
          <CollapseBox title={`Jalur Perpanjangan (${result.jalurPerpanjangan.length} opsi)`} icon={<RefreshCw className="h-4 w-4 text-blue-400" />}>
            <div className="space-y-3 pt-1">
              {result.jalurPerpanjangan.map((j, i) => (
                <div key={i} className="rounded-lg border border-white/8 bg-white/2 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold">{j.nama}</p>
                      <p className="text-slate-400 text-xs">{j.cocokUntuk}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-500 text-[10px]">{j.estimasiWaktu}</p>
                      <p className="text-amber-400 text-xs font-medium">{j.estimasiBiaya}</p>
                    </div>
                  </div>
                  <p className="text-emerald-400 text-xs mb-2">✓ {j.kelebihan}</p>
                  <ul className="space-y-1">
                    {j.prosedur.map((p, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-slate-400 text-xs">
                        <span className="text-slate-600 shrink-0">{pi + 1}.</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CollapseBox>

          {/* Dokumen */}
          {result.dokumenUmum.length > 0 && (
            <CollapseBox title="Dokumen yang Dibutuhkan" icon={<FileText className="h-4 w-4 text-amber-400" />}>
              <ul className="space-y-1.5 pt-1">
                {result.dokumenUmum.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />{d}
                  </li>
                ))}
              </ul>
            </CollapseBox>
          )}

          {/* Risiko */}
          {result.risikoTidakDiperpanjang.length > 0 && result.status !== "aktif_aman" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-3">
              <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Risiko Jika Tidak Diperpanjang
              </p>
              <ul className="space-y-1">
                {result.risikoTidakDiperpanjang.map((r, i) => (
                  <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                    <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {result.tipsPersiapan.length > 0 && (
            <CollapseBox title="Tips Persiapan Perpanjangan" icon={<ListChecks className="h-4 w-4 text-violet-400" />} defaultOpen={false}>
              <ul className="space-y-1.5 pt-1">
                {result.tipsPersiapan.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                    <span className="text-violet-400 shrink-0">•</span>{t}
                  </li>
                ))}
              </ul>
            </CollapseBox>
          )}

          <div className="flex gap-3 mt-4">
            <Button asChild variant="outline" className="flex-1 text-xs">
              <Link href="/persiapan-asesmen">Checklist Dokumen Lengkap →</Link>
            </Button>
            <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
              <Link href="/generator-dokumen-skk">Generator Surat SKK →</Link>
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
              <RefreshCw className="h-5 w-5 text-indigo-400" /> Panduan Perpanjangan SKK
            </h1>
            <p className="text-xs text-slate-400">Status SKK · Jalur perpanjangan · Dokumen · Timeline</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Jabatan SKK *</label>
            <select value={jabatan} onChange={e => setJabatan(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400/50 transition-colors">
              <option value="">Pilih jabatan SKK...</option>
              {SKK_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="lainnya">Jabatan SKK lainnya...</option>
            </select>
            {jabatan === "lainnya" && (
              <input type="text" onChange={e => setJabatan(e.target.value)}
                placeholder="Tulis jabatan SKK Anda"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/50 mt-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Tanggal Terbit SKK *</label>
              <input type="date" value={tanggalTerbit} onChange={e => setTanggalTerbit(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Expired Otomatis (3 tahun)
              </label>
              <div className={`rounded-lg border px-3 py-2.5 text-sm ${expiryPreview
                ? expiryPreview.diffDays < 0
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : expiryPreview.diffDays < 90
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-white/10 bg-slate-900 text-slate-600"}`}>
                {expiryPreview
                  ? `${expiryPreview.expired.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · ${Math.abs(expiryPreview.diffDays)}h ${expiryPreview.diffDays < 0 ? "lalu" : "lagi"}`
                  : "—"}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Nomor SKK (opsional)</label>
            <input type="text" value={nomorSkk} onChange={e => setNomorSkk(e.target.value)}
              placeholder="cth: 1-xxx/SKK/BNSP/XII/2023"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/50" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <Button onClick={generate} disabled={!jabatan || !tanggalTerbit || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI Menyusun Panduan...</>
              : <><Sparkles className="h-4 w-4 mr-2" />Cek Status & Panduan Perpanjangan</>
            }
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: Clock, color: "text-indigo-400", title: "Status Real-Time", desc: "Sisa hari aktif / expired" },
            { icon: RefreshCw, color: "text-blue-400", title: "3 Jalur Perpanjangan", desc: "Asesmen ulang · Portofolio · Diklat" },
            { icon: FileText, color: "text-amber-400", title: "Dokumen & Biaya", desc: "Apa saja yang dibutuhkan" },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/2 p-3 text-center">
              <Icon className={`h-4 w-4 ${color} mx-auto mb-1.5`} />
              <p className="text-white text-xs font-medium">{title}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
