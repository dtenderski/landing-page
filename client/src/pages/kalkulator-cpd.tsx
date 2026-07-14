import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle,
  Info, BookOpen, Users, Mic, Briefcase, PenLine, RotateCcw, ChevronRight, X
} from "lucide-react";
import { Link } from "wouter";

const KATEGORI_AKTIVITAS = [
  {
    id: "diklat_formal", label: "Diklat / Kursus Formal", icon: BookOpen,
    color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", badge: "text-blue-400 border-blue-400/30",
    subKategori: [
      { id: "diklat_lpjk", label: "Diklat terakreditasi LPJK/BNSP", poinPerUnit: 3, unit: "hari", maxPoin: 30 },
      { id: "diklat_umum", label: "Diklat/kursus umum relevan", poinPerUnit: 2, unit: "hari", maxPoin: 20 },
      { id: "s2", label: "Program S2 bidang konstruksi (lulus)", poinPerUnit: 15, unit: "ijazah", maxPoin: 15 },
      { id: "sertifikasi_lain", label: "Sertifikasi keahlian lain relevan", poinPerUnit: 5, unit: "sertifikat", maxPoin: 10 },
    ],
  },
  {
    id: "seminar", label: "Seminar & Workshop", icon: Mic,
    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", badge: "text-violet-400 border-violet-400/30",
    subKategori: [
      { id: "seminar_nasional", label: "Seminar/konferensi nasional (peserta)", poinPerUnit: 2, unit: "kegiatan", maxPoin: 10 },
      { id: "seminar_internasional", label: "Seminar/konferensi internasional (peserta)", poinPerUnit: 4, unit: "kegiatan", maxPoin: 12 },
      { id: "workshop", label: "Workshop / lokakarya teknis", poinPerUnit: 2, unit: "hari", maxPoin: 10 },
      { id: "webinar", label: "Webinar / e-learning terstruktur", poinPerUnit: 1, unit: "kegiatan", maxPoin: 6 },
    ],
  },
  {
    id: "proyek", label: "Pengalaman Proyek", icon: Briefcase,
    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", badge: "text-emerald-400 border-emerald-400/30",
    subKategori: [
      { id: "proyek_besar", label: "Proyek konstruksi > Rp 100 M", poinPerUnit: 8, unit: "proyek", maxPoin: 24 },
      { id: "proyek_menengah", label: "Proyek konstruksi Rp 10–100 M", poinPerUnit: 5, unit: "proyek", maxPoin: 20 },
      { id: "proyek_kecil", label: "Proyek konstruksi < Rp 10 M", poinPerUnit: 2, unit: "proyek", maxPoin: 10 },
      { id: "konsultan", label: "Konsultasi sebagai konsultan ahli", poinPerUnit: 3, unit: "proyek", maxPoin: 15 },
    ],
  },
  {
    id: "publikasi", label: "Publikasi & Mengajar", icon: PenLine,
    color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", badge: "text-amber-400 border-amber-400/30",
    subKategori: [
      { id: "jurnal_nasional", label: "Artikel jurnal nasional terakreditasi", poinPerUnit: 5, unit: "artikel", maxPoin: 15 },
      { id: "jurnal_internasional", label: "Artikel jurnal internasional terindeks", poinPerUnit: 10, unit: "artikel", maxPoin: 20 },
      { id: "buku", label: "Buku teknis diterbitkan", poinPerUnit: 8, unit: "buku", maxPoin: 16 },
      { id: "mengajar", label: "Dosen/instruktur konstruksi", poinPerUnit: 3, unit: "tahun", maxPoin: 9 },
      { id: "pembicara", label: "Pembicara seminar/workshop", poinPerUnit: 3, unit: "kegiatan", maxPoin: 9 },
    ],
  },
  {
    id: "organisasi", label: "Organisasi & Pengabdian", icon: Users,
    color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", badge: "text-rose-400 border-rose-400/30",
    subKategori: [
      { id: "pengurus_asosiasi", label: "Pengurus aktif asosiasi profesi konstruksi", poinPerUnit: 2, unit: "tahun", maxPoin: 6 },
      { id: "anggota_asosiasi", label: "Anggota aktif asosiasi profesi", poinPerUnit: 1, unit: "tahun", maxPoin: 3 },
      { id: "tim_ahli", label: "Anggota tim ahli / komite teknis pemerintah", poinPerUnit: 3, unit: "kegiatan", maxPoin: 9 },
      { id: "penyusun_standar", label: "Penyusun SNI / standar teknis", poinPerUnit: 5, unit: "dokumen", maxPoin: 10 },
    ],
  },
];

const POIN_MINIMUM = 30;
const STORAGE_KEY = "gustafta_cpd_v1";

interface EntriAktivitas {
  id: string; kategoriId: string; subKategoriId: string;
  jumlah: number; deskripsi: string; tahun: string;
}

export default function KalkulatorCPD() {
  const [entri, setEntri] = useState<EntriAktivitas[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kategoriId: "", subKategoriId: "", jumlah: 1, deskripsi: "", tahun: new Date().getFullYear().toString() });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setEntri(JSON.parse(s)); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(entri)); }, [entri, loaded]);

  function getSub(katId: string, subId: string) {
    return KATEGORI_AKTIVITAS.find(k => k.id === katId)?.subKategori.find(s => s.id === subId);
  }
  function calcPoin(e: EntriAktivitas) {
    const sub = getSub(e.kategoriId, e.subKategoriId);
    if (!sub) return 0;
    return Math.min(sub.poinPerUnit * e.jumlah, sub.maxPoin);
  }

  const totalPoin = entri.reduce((s, e) => s + calcPoin(e), 0);
  const persen = Math.min(100, Math.round((totalPoin / POIN_MINIMUM) * 100));
  const status = totalPoin >= POIN_MINIMUM ? "cukup" : totalPoin >= POIN_MINIMUM * 0.7 ? "hampir" : "kurang";
  const SC = {
    cukup: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Cukup untuk Perpanjangan SKK", Icon: CheckCircle2 },
    hampir: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Hampir Cukup", Icon: AlertTriangle },
    kurang: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Belum Cukup", Icon: XCircle },
  }[status];
  const kurang = Math.max(0, POIN_MINIMUM - totalPoin);

  const selectedKat = KATEGORI_AKTIVITAS.find(k => k.id === form.kategoriId);
  const selectedSub = getSub(form.kategoriId, form.subKategoriId);

  function addEntri() {
    if (!selectedSub || form.jumlah < 1) return;
    setEntri(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm(f => ({ ...f, subKategoriId: "", jumlah: 1, deskripsi: "" }));
    setShowForm(false);
  }

  const entriesByKat = KATEGORI_AKTIVITAS.map(kat => ({
    ...kat,
    items: entri.filter(e => e.kategoriId === kat.id),
    totalPoin: entri.filter(e => e.kategoriId === kat.id).reduce((s, e) => s + calcPoin(e), 0),
  })).filter(k => k.items.length > 0);

  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Kalkulator Poin CPD SKK</h1>
              <p className="text-xs text-slate-400">Hitung poin Continuing Professional Development untuk perpanjangan SKK</p>
            </div>
          </div>
          {entri.length > 0 && (
            <button onClick={() => setEntri([])} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors" title="Reset semua">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl border p-5 mb-4 ${SC.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <SC.Icon className={`h-6 w-6 ${SC.color}`} />
              <div>
                <p className={`text-lg font-bold ${SC.color}`}>{totalPoin} / {POIN_MINIMUM} Poin CPD</p>
                <p className={`text-xs ${SC.color} opacity-80`}>{SC.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${SC.color}`}>{persen}%</p>
              {kurang > 0 && <p className="text-xs text-slate-400">Kurang {kurang} poin</p>}
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${status === "cukup" ? "bg-emerald-500" : status === "hampir" ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${persen}%` }} />
          </div>
          {status === "cukup" && (
            <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Poin CPD Anda sudah memenuhi syarat minimum perpanjangan SKK (30 poin/3 tahun)
            </p>
          )}
          {kurang > 0 && (
            <p className={`text-xs mt-2 ${SC.color}`}>
              Perlu tambah {kurang} poin lagi. Cth: {kurang <= 6 ? `${Math.ceil(kurang / 2)} webinar` : kurang <= 15 ? `${Math.ceil(kurang / 3)} hari diklat` : `${Math.ceil(kurang / 5)} proyek menengah`} untuk mencukupi.
            </p>
          )}
        </div>

        {/* Add Activity Button */}
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 bg-teal-600 hover:bg-teal-700 gap-2">
          <Plus className="h-4 w-4" /> Tambah Aktivitas CPD
        </Button>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-teal-300">Tambah Aktivitas</p>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Kategori Aktivitas</label>
              <select value={form.kategoriId} onChange={e => setForm(f => ({ ...f, kategoriId: e.target.value, subKategoriId: "" }))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50">
                <option value="">Pilih kategori...</option>
                {KATEGORI_AKTIVITAS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>

            {form.kategoriId && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Jenis Aktivitas</label>
                <select value={form.subKategoriId} onChange={e => setForm(f => ({ ...f, subKategoriId: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50">
                  <option value="">Pilih jenis...</option>
                  {selectedKat?.subKategori.map(s => (
                    <option key={s.id} value={s.id}>{s.label} ({s.poinPerUnit} poin/{s.unit}, maks {s.maxPoin})</option>
                  ))}
                </select>
              </div>
            )}

            {form.subKategoriId && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Jumlah ({selectedSub?.unit})</label>
                    <input type="number" min={1} value={form.jumlah}
                      onChange={e => setForm(f => ({ ...f, jumlah: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Tahun</label>
                    <select value={form.tahun} onChange={e => setForm(f => ({ ...f, tahun: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400/50">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Keterangan <span className="text-slate-600">(opsional)</span></label>
                  <input value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    placeholder="cth: Diklat K3 Konstruksi LPJK Jakarta, 3 hari"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
                  <span className="text-xs text-slate-400">Poin yang akan ditambahkan:</span>
                  <span className="text-sm font-bold text-teal-400">
                    +{Math.min(selectedSub!.poinPerUnit * form.jumlah, selectedSub!.maxPoin)} poin
                    {selectedSub!.poinPerUnit * form.jumlah > selectedSub!.maxPoin && <span className="text-xs text-slate-500 ml-1">(maks {selectedSub!.maxPoin})</span>}
                  </span>
                </div>
              </>
            )}

            <Button onClick={addEntri} disabled={!form.subKategoriId} className="w-full bg-teal-600 hover:bg-teal-700 gap-2 text-sm">
              <Plus className="h-4 w-4" /> Tambahkan
            </Button>
          </div>
        )}

        {/* Empty State */}
        {entri.length === 0 && !showForm && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
            <p className="text-slate-400 text-sm mb-1">Belum ada aktivitas CPD</p>
            <p className="text-slate-600 text-xs">Tambahkan diklat, seminar, proyek, atau aktivitas lain untuk menghitung poin CPD Anda</p>
          </div>
        )}

        {/* Activities by Category */}
        {entriesByKat.map(kat => {
          const Icon = kat.icon;
          return (
            <div key={kat.id} className={`rounded-xl border p-4 mb-3 ${kat.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${kat.color}`} />
                  <span className={`text-sm font-semibold ${kat.color}`}>{kat.label}</span>
                </div>
                <Badge variant="outline" className={`text-xs ${kat.badge}`}>{kat.totalPoin} poin</Badge>
              </div>
              <div className="space-y-2">
                {kat.items.map(item => {
                  const sub = getSub(item.kategoriId, item.subKategoriId);
                  const poin = calcPoin(item);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-900/50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 truncate">{sub?.label}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.jumlah} {sub?.unit} · {item.tahun}
                          {item.deskripsi && ` · ${item.deskripsi}`}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${kat.color} shrink-0`}>+{poin}</span>
                      <button onClick={() => setEntri(prev => prev.filter(e => e.id !== item.id))}
                        className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Info & Links */}
        <div className="mt-2 space-y-2">
          <div className="rounded-xl border border-white/5 bg-white/2 p-4 flex items-start gap-3">
            <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Standar minimum <strong className="text-slate-400">30 poin CPD per periode 3 tahun</strong> untuk perpanjangan SKK (berdasarkan regulasi LPJK). Poin per kategori dibatasi maksimum agar tidak terlalu mengandalkan satu jenis aktivitas. Data tersimpan di browser.
            </p>
          </div>
          {kurang > 0 && (
            <Link href="/perpanjangan-skk">
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 flex items-center justify-between hover:bg-teal-500/10 transition-all cursor-pointer">
                <p className="text-teal-400 text-xs font-medium">Panduan Perpanjangan SKK →</p>
                <ChevronRight className="h-4 w-4 text-teal-400" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
