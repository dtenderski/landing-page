import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, Clock, AlertTriangle,
  CheckCircle2, Info, Users, RotateCcw, RefreshCw
} from "lucide-react";
import { Link } from "wouter";

interface Pekerja {
  id: string;
  nama: string;
  jabatan: string;
  jamKerjaMingguIni: number;
  hariLilin: number; // hari tanpa libur berturut-turut
  shiftMalam: number; // jumlah shift malam dalam 2 minggu terakhir
}

const JABATAN_LIST = ["Mandor", "Tukang / Pekerja Terampil", "Pekerja Harian", "Operator Alat Berat", "HSE Officer", "Supervisor Lapangan", "Insinyur Lapangan", "Welder / Fitter", "Electrician"];
const JAM_STANDAR = 40; // jam kerja normal per minggu
const JAM_MAKSIMUM_PERMENAKER = 56; // batas PP/Permenaker (40 + 18 lembur)
const HARI_TANPA_LIBUR_MAX = 6;
const SHIFT_MALAM_MAX = 4;

function getRisikoLevel(pekerja: Pekerja): { level: "Aman" | "Waspada" | "Berbahaya" | "Kritis"; warna: string; pesan: string } {
  const faktor = [];
  if (pekerja.jamKerjaMingguIni > JAM_MAKSIMUM_PERMENAKER) faktor.push("jam kerja melampaui batas legal");
  if (pekerja.hariLilin > HARI_TANPA_LIBUR_MAX) faktor.push("hari berturut tanpa libur terlalu panjang");
  if (pekerja.shiftMalam > SHIFT_MALAM_MAX) faktor.push("shift malam terlalu banyak");

  if (faktor.length >= 2 || pekerja.jamKerjaMingguIni > 70) return { level: "Kritis", warna: "text-red-400 border-red-500/40 bg-red-500/10", pesan: `Risiko tinggi: ${faktor.join(", ")}. Rotasi SEGERA.` };
  if (faktor.length === 1 || pekerja.jamKerjaMingguIni > 56) return { level: "Berbahaya", warna: "text-orange-400 border-orange-500/40 bg-orange-500/10", pesan: `Perhatian: ${faktor.join(", ")}. Evaluasi segera.` };
  if (pekerja.jamKerjaMingguIni > 48 || pekerja.hariLilin >= 5) return { level: "Waspada", warna: "text-amber-400 border-amber-500/40 bg-amber-500/10", pesan: "Mendekati batas — pantau ketat minggu ini." };
  return { level: "Aman", warna: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", pesan: "Jam kerja dalam batas aman." };
}

function getJamLembur(jam: number) { return Math.max(0, jam - JAM_STANDAR); }
function pctBar(jam: number) { return Math.min(100, Math.round((jam / JAM_MAKSIMUM_PERMENAKER) * 100)); }

export default function KalkulatorJamKerjaProyek() {
  const [pekerjList, setPekerjList] = useState<Pekerja[]>([
    { id: "1", nama: "Budi Santoso", jabatan: "Mandor", jamKerjaMingguIni: 52, hariLilin: 7, shiftMalam: 0 },
    { id: "2", nama: "Ahmad Fauzi", jabatan: "Operator Alat Berat", jamKerjaMingguIni: 48, hariLilin: 5, shiftMalam: 2 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: "", jabatan: "Mandor", jamKerjaMingguIni: 40, hariLilin: 5, shiftMalam: 0 });

  function addPekerja() {
    if (!form.nama) return;
    setPekerjList(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm({ nama: "", jabatan: "Mandor", jamKerjaMingguIni: 40, hariLilin: 5, shiftMalam: 0 });
    setShowForm(false);
  }
  function removePekerja(id: string) { setPekerjList(prev => prev.filter(p => p.id !== id)); }
  function updatePekerja(id: string, field: keyof Pekerja, val: any) {
    setPekerjList(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  }

  const risikoPekerja = pekerjList.map(p => ({ ...p, risiko: getRisikoLevel(p) }));
  const kritis = risikoPekerja.filter(p => p.risiko.level === "Kritis").length;
  const berbahaya = risikoPekerja.filter(p => p.risiko.level === "Berbahaya").length;
  const totalLembur = pekerjList.reduce((acc, p) => acc + getJamLembur(p.jamKerjaMingguIni), 0);
  const avgJam = pekerjList.length > 0 ? Math.round(pekerjList.reduce((acc, p) => acc + p.jamKerjaMingguIni, 0) / pekerjList.length) : 0;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-400" /> Kalkulator Jam Kerja & Fatigue Risk
            </h1>
            <p className="text-xs text-slate-400">Monitor jam kerja kumulatif, deteksi risiko kelelahan, dan rekomendasi rotasi pekerja proyek</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700 text-xs h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />Tambah
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-xl border border-white/8 bg-white/2 p-3 text-center">
            <p className="text-lg font-bold text-white">{pekerjList.length}</p>
            <p className="text-[9px] text-slate-500">Total Pekerja</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${kritis > 0 ? "border-red-500/30 bg-red-500/5" : "border-white/8 bg-white/2"}`}>
            <p className={`text-lg font-bold ${kritis > 0 ? "text-red-400" : "text-slate-400"}`}>{kritis}</p>
            <p className="text-[9px] text-slate-500">Kritis</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${berbahaya > 0 ? "border-orange-500/30 bg-orange-500/5" : "border-white/8 bg-white/2"}`}>
            <p className={`text-lg font-bold ${berbahaya > 0 ? "text-orange-400" : "text-slate-400"}`}>{berbahaya}</p>
            <p className="text-[9px] text-slate-500">Berbahaya</p>
          </div>
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-center">
            <p className="text-lg font-bold text-teal-400">{avgJam}j</p>
            <p className="text-[9px] text-slate-500">Rata-rata/mg</p>
          </div>
        </div>

        {/* Form tambah */}
        {showForm && (
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 mb-4 space-y-3">
            <p className="text-xs text-teal-400 font-semibold">Data Pekerja Baru</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Nama Pekerja *</label>
                <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  placeholder="cth: Budi Santoso"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Jabatan</label>
                <select value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none">
                  {JABATAN_LIST.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Jam Kerja Minggu Ini</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(f => ({ ...f, jamKerjaMingguIni: Math.max(0, f.jamKerjaMingguIni - 1) }))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">−</button>
                  <span className="flex-1 text-center text-sm text-white font-medium">{form.jamKerjaMingguIni}</span>
                  <button onClick={() => setForm(f => ({ ...f, jamKerjaMingguIni: f.jamKerjaMingguIni + 1 }))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">+</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Hari Berturut Tanpa Libur</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(f => ({ ...f, hariLilin: Math.max(0, f.hariLilin - 1) }))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">−</button>
                  <span className="flex-1 text-center text-sm text-white font-medium">{form.hariLilin}</span>
                  <button onClick={() => setForm(f => ({ ...f, hariLilin: f.hariLilin + 1 }))} className="w-7 h-7 rounded border border-white/10 text-slate-400 hover:text-white">+</button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addPekerja} disabled={!form.nama} className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs h-8">Simpan</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="text-xs h-8">Batal</Button>
            </div>
          </div>
        )}

        {/* Daftar pekerja */}
        {kritis > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300"><span className="font-semibold">{kritis} pekerja berisiko KRITIS</span> — jam kerja melampaui batas aman. Perlu rotasi atau istirahat segera.</p>
          </div>
        )}

        <div className="space-y-3">
          {risikoPekerja.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/8 bg-white/2 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-white font-medium">{p.nama}</p>
                  <p className="text-[10px] text-slate-500">{p.jabatan}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] border ${p.risiko.warna}`}>{p.risiko.level}</Badge>
                  <button onClick={() => removePekerja(p.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <p className="text-[9px] text-slate-500 mb-0.5">Jam/minggu</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updatePekerja(p.id, "jamKerjaMingguIni", Math.max(0, p.jamKerjaMingguIni - 1))} className="w-5 h-5 rounded border border-white/10 text-slate-500 hover:text-white text-xs">−</button>
                    <span className={`text-sm font-bold ${p.jamKerjaMingguIni > JAM_MAKSIMUM_PERMENAKER ? "text-red-400" : p.jamKerjaMingguIni > JAM_STANDAR ? "text-amber-400" : "text-emerald-400"}`}>{p.jamKerjaMingguIni}j</span>
                    <button onClick={() => updatePekerja(p.id, "jamKerjaMingguIni", p.jamKerjaMingguIni + 1)} className="w-5 h-5 rounded border border-white/10 text-slate-500 hover:text-white text-xs">+</button>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 mb-0.5">Hari berturut</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updatePekerja(p.id, "hariLilin", Math.max(0, p.hariLilin - 1))} className="w-5 h-5 rounded border border-white/10 text-slate-500 hover:text-white text-xs">−</button>
                    <span className={`text-sm font-bold ${p.hariLilin > HARI_TANPA_LIBUR_MAX ? "text-red-400" : "text-slate-200"}`}>{p.hariLilin}h</span>
                    <button onClick={() => updatePekerja(p.id, "hariLilin", p.hariLilin + 1)} className="w-5 h-5 rounded border border-white/10 text-slate-500 hover:text-white text-xs">+</button>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 mb-0.5">Lembur</p>
                  <span className="text-sm font-bold text-amber-400">{getJamLembur(p.jamKerjaMingguIni)}j</span>
                </div>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all ${p.risiko.level === "Kritis" ? "bg-red-400" : p.risiko.level === "Berbahaya" ? "bg-orange-400" : p.risiko.level === "Waspada" ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${pctBar(p.jamKerjaMingguIni)}%` }} />
              </div>
              <p className={`text-[10px] ${p.risiko.level === "Kritis" ? "text-red-400" : p.risiko.level === "Berbahaya" ? "text-orange-400" : p.risiko.level === "Waspada" ? "text-amber-400" : "text-emerald-400"}`}>{p.risiko.pesan}</p>
            </div>
          ))}
        </div>

        {pekerjList.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center">
            <Clock className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 text-sm mb-1">Belum ada data pekerja</p>
            <p className="text-xs text-slate-600">Tekan "+ Tambah" untuk memasukkan data pekerja</p>
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 mt-4 mb-3 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600">Batas lembur sesuai PP No. 35/2021: maks. 4 jam/hari dan 18 jam/minggu. Pekerjaan berbahaya tidak boleh lembur. Data tidak tersimpan saat refresh.</p>
        </div>

        <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-xs">
          <Link href="/generator-sop-k3-proyek">Generator SOP K3 →</Link>
        </Button>
      </div>
    </div>
  );
}
