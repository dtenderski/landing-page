import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, Info, TrendingUp, Award, X, RotateCcw
} from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "gustafta_rpl_calc_v1";

const JENIS_PENGALAMAN = [
  { label: "Proyek Konstruksi sebagai Pimpinan / Penanggung Jawab", bobot: 5, satuan: "per proyek" },
  { label: "Proyek Konstruksi sebagai Anggota Tim / Pelaksana", bobot: 2, satuan: "per proyek" },
  { label: "Pelatihan / Diklat Konstruksi Relevan", bobot: 3, satuan: "per kegiatan" },
  { label: "Seminar / Workshop / Konferensi", bobot: 1, satuan: "per kegiatan" },
  { label: "Penyusunan Dokumen Teknis / Spesifikasi", bobot: 2, satuan: "per dokumen" },
  { label: "Penelitian / Kajian Teknis Bidang Konstruksi", bobot: 3, satuan: "per studi" },
  { label: "Pengajar / Instruktur Bidang Konstruksi", bobot: 4, satuan: "per tahun" },
  { label: "Anggota Asosiasi Profesi Aktif", bobot: 1, satuan: "per tahun" },
  { label: "Pengalaman Kerja Reguler di Bidang Konstruksi", bobot: 1, satuan: "per tahun" },
];

const SKK_THRESHOLDS = [
  { jabatan: "Ahli Muda (Umum)", minPoin: 20, minTahun: 2, jalur: "RPL" },
  { jabatan: "Ahli Madya (Umum)", minPoin: 40, minTahun: 5, jalur: "RPL" },
  { jabatan: "Ahli Utama (Umum)", minPoin: 70, minTahun: 10, jalur: "RPL" },
];

interface ItemPengalaman {
  id: string; jenis: string; jumlah: number; bobot: number; satuan: string; keterangan: string;
}

export default function KalkulatorRPL() {
  const [items, setItems] = useState<ItemPengalaman[]>([]);
  const [tahunKerja, setTahunKerja] = useState(0);
  const [jabatanTarget, setJabatanTarget] = useState("Ahli Muda (Umum)");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ jenis: JENIS_PENGALAMAN[0].label, jumlah: 1, keterangan: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const d = JSON.parse(s); setItems(d.items || []); setTahunKerja(d.tahunKerja || 0); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, tahunKerja }));
  }, [items, tahunKerja, loaded]);

  function addItem() {
    const jenisObj = JENIS_PENGALAMAN.find(j => j.label === form.jenis);
    if (!jenisObj) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(), jenis: form.jenis,
      jumlah: form.jumlah, bobot: jenisObj.bobot, satuan: jenisObj.satuan, keterangan: form.keterangan,
    }]);
    setForm({ jenis: JENIS_PENGALAMAN[0].label, jumlah: 1, keterangan: "" });
    setShowForm(false);
  }

  const totalPoin = items.reduce((s, item) => s + item.bobot * item.jumlah, 0);
  const threshold = SKK_THRESHOLDS.find(t => t.jabatan === jabatanTarget);
  const poinDibutuhkan = threshold?.minPoin ?? 20;
  const tahunDibutuhkan = threshold?.minTahun ?? 2;
  const persenPoin = Math.min(100, Math.round((totalPoin / poinDibutuhkan) * 100));
  const persenTahun = Math.min(100, Math.round((tahunKerja / tahunDibutuhkan) * 100));
  const kelulusanPoin = totalPoin >= poinDibutuhkan;
  const kelulusanTahun = tahunKerja >= tahunDibutuhkan;
  const kelulusanOverall = kelulusanPoin && kelulusanTahun;

  const statusLabel = kelulusanOverall ? "Memenuhi Syarat RPL" : kelulusanPoin ? "Poin Cukup, Tahun Kurang" : kelulusanTahun ? "Tahun Cukup, Poin Kurang" : "Belum Memenuhi Syarat";
  const statusColor = kelulusanOverall ? "text-emerald-400" : (kelulusanPoin || kelulusanTahun) ? "text-amber-400" : "text-red-400";
  const statusBg = kelulusanOverall ? "bg-emerald-500/10 border-emerald-500/30" : (kelulusanPoin || kelulusanTahun) ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" /> Kalkulator Kelayakan RPL / Portofolio
              </h1>
              <p className="text-xs text-slate-400">Hitung poin pengalaman & kelayakan jalur Rekognisi Pembelajaran Lampau</p>
            </div>
          </div>
          {items.length > 0 && <button onClick={() => setItems([])} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"><RotateCcw className="h-4 w-4" /></button>}
        </div>

        {/* Target + Tahun Kerja */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Target Jabatan SKK</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SKK_THRESHOLDS.map(t => (
                <button key={t.jabatan} onClick={() => setJabatanTarget(t.jabatan)}
                  className={`rounded-lg border py-2 text-xs transition-all ${jabatanTarget === t.jabatan ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "border-white/10 text-slate-400 hover:text-white"}`}>
                  {t.jabatan.split(" (")[0]}
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">{t.minPoin}p · {t.minTahun}th</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Total Tahun Pengalaman Kerja di Bidang Konstruksi</label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={30} value={tahunKerja} onChange={e => setTahunKerja(parseInt(e.target.value))}
                className="flex-1 accent-emerald-500" />
              <span className="text-lg font-bold text-emerald-400 w-16 text-right">{tahunKerja} tahun</span>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl border p-5 mb-4 ${statusBg}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`text-lg font-bold ${statusColor}`}>{statusLabel}</p>
              <p className="text-slate-400 text-xs">{jabatanTarget} — Jalur RPL/Portofolio</p>
            </div>
            {kelulusanOverall ? <Award className="h-8 w-8 text-emerald-400" /> : <AlertTriangle className="h-8 w-8 text-amber-400" />}
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Poin Pengalaman</span>
                <span className={`text-xs font-bold ${kelulusanPoin ? "text-emerald-400" : "text-amber-400"}`}>{totalPoin} / {poinDibutuhkan} poin {kelulusanPoin ? "✓" : ""}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${kelulusanPoin ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${persenPoin}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Tahun Pengalaman</span>
                <span className={`text-xs font-bold ${kelulusanTahun ? "text-emerald-400" : "text-red-400"}`}>{tahunKerja} / {tahunDibutuhkan} tahun {kelulusanTahun ? "✓" : ""}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${kelulusanTahun ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${persenTahun}%` }} />
              </div>
            </div>
          </div>
          {!kelulusanOverall && (
            <div className="mt-3 space-y-1">
              {!kelulusanPoin && <p className="text-xs text-amber-300">• Butuh {poinDibutuhkan - totalPoin} poin lagi — tambahkan kegiatan pengalaman</p>}
              {!kelulusanTahun && <p className="text-xs text-red-300">• Butuh {tahunDibutuhkan - tahunKerja} tahun pengalaman lagi</p>}
            </div>
          )}
        </div>

        {/* Add Button */}
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Pengalaman
        </Button>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-300">Tambah Pengalaman</p>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Jenis Pengalaman</label>
              <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                {JENIS_PENGALAMAN.map(j => <option key={j.label} value={j.label}>{j.label} ({j.bobot} poin/{j.satuan.replace("per ", "")})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jumlah ({JENIS_PENGALAMAN.find(j => j.label === form.jenis)?.satuan.replace("per ", "") || "item"})</label>
                <input type="number" min={1} max={50} value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: parseInt(e.target.value) || 1 }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none" />
              </div>
              <div className="rounded-lg bg-slate-900/60 px-3 py-2 flex flex-col justify-center">
                <p className="text-xs text-slate-500">Subtotal poin</p>
                <p className="text-lg font-bold text-emerald-400">
                  {(JENIS_PENGALAMAN.find(j => j.label === form.jenis)?.bobot ?? 0) * form.jumlah} poin
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Keterangan <span className="text-slate-600">(opsional)</span></label>
              <input value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                placeholder="cth: Proyek Jembatan Cipamingkis, 2022"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            </div>
            <Button onClick={addItem} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm">
              <Plus className="h-4 w-4" /> Tambahkan
            </Button>
          </div>
        )}

        {/* Item List */}
        {items.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center mb-4">
            <p className="text-slate-400 text-sm mb-1">Belum ada pengalaman ditambahkan</p>
            <p className="text-slate-600 text-xs">Tambahkan berbagai jenis pengalaman untuk menghitung total poin RPL</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-slate-400 font-semibold">Rincian Poin ({items.length} item)</p>
            {items.map(item => (
              <div key={item.id} className="rounded-xl border border-white/8 bg-white/2 px-3 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 font-medium truncate">{item.jenis}</p>
                  {item.keterangan && <p className="text-[10px] text-slate-500 truncate">{item.keterangan}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-400">{item.bobot * item.jumlah} poin</p>
                  <p className="text-[10px] text-slate-500">{item.jumlah}x {item.bobot} poin</p>
                </div>
                <button onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-white/2 p-3 flex items-start gap-2 mb-4">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">Sistem poin ini adalah estimasi berdasarkan pedoman umum RPL BNSP. Setiap LSP memiliki kriteria spesifik. Konsultasikan dengan LSP terkait sebelum mendaftar. Data tersimpan di browser.</p>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1 text-xs">
            <Link href="/jalur-sertifikasi">Lihat Jalur Lain →</Link>
          </Button>
          <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs">
            <Link href="/panduan-apl01">Panduan APL-01 →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
