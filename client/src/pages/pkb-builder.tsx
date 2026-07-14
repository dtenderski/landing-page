/**
 * PKB Builder — Alur step-by-step:
 * Step 1: Upload screenshot E-SIMPAN → Vision ekstrak data proyek
 * Step 2: Review & lengkapi form data proyek
 * Step 3: AI susun Executive Summary PKB (streaming)
 * Step 4: Tampilkan hasil + screenshot sebagai lampiran
 */
import { useState, useRef } from "react";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, CheckCircle, Loader2,
  Camera, Edit3, Sparkles, Download, AlertTriangle, X,
  GraduationCap, Building2, User,
  Eye, Info, ArrowLeft, ArrowRight, RefreshCw,
} from "lucide-react";

interface ProyekData {
  namaPeserta: string;
  nomorSKK: string;
  jabatanKerja: string;
  institusi: string;
  namaProyek: string;
  nilaiKontrak: string;
  lokasiProyek: string;
  tahunProyek: string;
  posisiDiProyek: string;
  durasiKeterlibatan: string;
  deskripsiSingkat: string;
  sumberBelajar: string;
  namaKegiatan: string;
  penyelenggara: string;
  tanggalKegiatan: string;
  durasiKegiatan: string;
}

const EMPTY_DATA: ProyekData = {
  namaPeserta: "", nomorSKK: "", jabatanKerja: "", institusi: "",
  namaProyek: "", nilaiKontrak: "", lokasiProyek: "", tahunProyek: "",
  posisiDiProyek: "", durasiKeterlibatan: "", deskripsiSingkat: "",
  sumberBelajar: "Pengalaman Lapangan / Proyek E-SIMPAN",
  namaKegiatan: "", penyelenggara: "", tanggalKegiatan: "", durasiKegiatan: "",
};

type Step = 1 | 2 | 3 | 4;

function StepBar({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Upload E-SIMPAN", icon: Camera },
    { n: 2, label: "Lengkapi Data", icon: Edit3 },
    { n: 3, label: "AI Susun PKB", icon: Sparkles },
    { n: 4, label: "Hasil & Unduh", icon: Download },
  ];
  return (
    <div className="flex items-center justify-center mb-8 max-w-2xl mx-auto">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const Icon = s.icon;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-emerald-500 border-emerald-500 text-white"
                : active ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400"
              }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                active ? "text-indigo-600 dark:text-indigo-400"
                : done ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-400"
              }`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 md:w-14 h-0.5 mb-4 mx-1 ${done ? "bg-emerald-400" : "bg-gray-200 dark:bg-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1Upload({
  onExtracted, onSkip,
}: {
  onExtracted: (data: Partial<ProyekData>, files: File[], previews: string[]) => void;
  onSkip: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).filter(f => f.type.startsWith("image/"));
    if (!arr.length) { toast({ title: "Hanya file gambar yang diterima", variant: "destructive" }); return; }
    const total = [...files, ...arr].slice(0, 5);
    setFiles(total);
    Promise.all(total.map(f => new Promise<string>(res => {
      const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(f);
    }))).then(setPreviews);
  };

  const removeFile = (i: number) => {
    setFiles(f => f.filter((_, j) => j !== i));
    setPreviews(p => p.filter((_, j) => j !== i));
  };

  const handleExtract = async () => {
    if (!files.length) { onSkip(); return; }
    setExtracting(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append("screenshots", f));
      const res = await fetch("/api/pkb-builder/extract", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal ekstrak");
      onExtracted(json.data || {}, files, previews);
    } catch (e: any) {
      toast({ title: "Gagal membaca screenshot", description: e.message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-3">
          <Camera className="w-7 h-7 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Screenshot E-SIMPAN</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          Ambil screenshot dari halaman proyek di{" "}
          <span className="font-medium text-indigo-500">simpan.pu.go.id</span> —
          AI akan membaca data proyek Anda secara otomatis.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-400">
          <div className="font-semibold mb-1.5">Yang sebaiknya ada di screenshot:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {["Nama & nomor proyek", "Nilai kontrak", "Posisi/jabatan di proyek", "Lokasi & tahun", "Nama perusahaan/BUJK", "Durasi keterlibatan"].map((t, i) => (
              <span key={i} className="flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5 text-blue-400 shrink-0" />{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Klik atau drag screenshot ke sini</div>
        <div className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Maks 5 gambar</div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((src, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 aspect-video bg-gray-100 dark:bg-slate-800">
              <img src={src} alt={`ss-${i + 1}`} className="w-full h-full object-cover" />
              <button onClick={() => removeFile(i)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                {files[i]?.name.slice(0, 20)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 text-sm" onClick={onSkip} disabled={extracting}>
          Isi Manual
        </Button>
        <Button
          className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={handleExtract} disabled={extracting}
          data-testid="btn-extract-esimpan"
        >
          {extracting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membaca Screenshot…</>
            : files.length > 0
              ? <><Sparkles className="w-4 h-4 mr-2" />Baca dengan AI</>
              : <>Lanjut Isi Manual <ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
}

function Step2Form({
  data, onChange, onBack, onNext, uploadedFiles,
}: {
  data: ProyekData;
  onChange: (d: ProyekData) => void;
  onBack: () => void;
  onNext: () => void;
  uploadedFiles: File[];
}) {
  const set = (k: keyof ProyekData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ ...data, [k]: e.target.value });

  const canNext = data.namaPeserta.trim() && data.namaKegiatan.trim() && data.namaProyek.trim();

  const identitasFields: [string, keyof ProyekData, string][] = [
    ["Nama Lengkap *", "namaPeserta", "Ir. Budi Santoso, ST, MT"],
    ["Nomor SKK / SBU", "nomorSKK", "SKK-2024-XXXXX"],
    ["Jabatan Kerja SKK", "jabatanKerja", "Ahli Muda Teknik Bangunan Gedung"],
    ["Instansi / Perusahaan", "institusi", "PT Konstruksi Mandiri"],
  ];
  const proyekFields: [string, keyof ProyekData, string][] = [
    ["Nama Proyek *", "namaProyek", "Pembangunan Gedung Kantor Dinas…"],
    ["Nilai Kontrak", "nilaiKontrak", "Rp 15.500.000.000"],
    ["Lokasi Proyek", "lokasiProyek", "Jakarta Selatan, DKI Jakarta"],
    ["Tahun Proyek", "tahunProyek", "2023"],
    ["Posisi di Proyek", "posisiDiProyek", "Site Engineer / MK / Pengawas"],
    ["Durasi Keterlibatan", "durasiKeterlibatan", "8 bulan (Maret–Oktober 2023)"],
  ];
  const pkbFields: [string, keyof ProyekData, string][] = [
    ["Nama Kegiatan PKB *", "namaKegiatan", "Pengalaman Proyek: Pembangunan Gedung…"],
    ["Penyelenggara / Platform", "penyelenggara", "PT Konstruksi Mandiri / LPJK / YouTube"],
    ["Tanggal / Periode", "tanggalKegiatan", "Maret–Oktober 2023"],
    ["Durasi Kegiatan", "durasiKegiatan", "8 bulan / 40 jam"],
  ];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <Edit3 className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review & Lengkapi Data</h2>
          <p className="text-xs text-gray-500">
            {uploadedFiles.length > 0
              ? `${uploadedFiles.length} screenshot terbaca — periksa dan lengkapi data di bawah`
              : "Isi data proyek dan kegiatan PKB Anda"}
          </p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            Screenshot akan otomatis dilampirkan di dokumen PKB sebagai bukti proyek E-SIMPAN.
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <User className="w-3.5 h-3.5" /> Identitas Peserta
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {identitasFields.map(([label, k, ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={ph} value={data[k]} onChange={set(k)} data-testid={`input-${k}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" /> Data Proyek (E-SIMPAN)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proyekFields.map(([label, k, ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={ph} value={data[k]} onChange={set(k)} data-testid={`input-${k}`} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Singkat Proyek</label>
          <textarea className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3} placeholder="Jelaskan ruang lingkup, tantangan teknis, dan pencapaian utama di proyek…"
            value={data.deskripsiSingkat} onChange={set("deskripsiSingkat")} data-testid="input-deskripsiSingkat" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5" /> Kegiatan PKB
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Jenis / Sumber Belajar *</label>
          <select className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={data.sumberBelajar} onChange={set("sumberBelajar")} data-testid="select-sumber-belajar">
            <option>Pengalaman Lapangan / Proyek E-SIMPAN</option>
            <option>Pelatihan / Diklat (tatap muka)</option>
            <option>Webinar / Pelatihan Online</option>
            <option>Video YouTube / Platform Digital</option>
            <option>Seminar / Konferensi Nasional</option>
            <option>Workshop Teknis</option>
            <option>Studi Mandiri (Buku/Jurnal)</option>
            <option>Sharing Knowledge Teras LPJK</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pkbFields.map(([label, k, ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={ph} value={data[k]} onChange={set(k)} data-testid={`input-${k}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="text-sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali
        </Button>
        <Button className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={onNext} disabled={!canNext} data-testid="btn-generate-pkb">
          <Sparkles className="w-4 h-4 mr-2" /> Susun Executive Summary PKB
        </Button>
      </div>
    </div>
  );
}

function Step3Generating({ progress }: { progress: string }) {
  const bullets = [
    "Menyusun identitas & header dokumen…",
    "BAB I — Pendahuluan (5 poin SKP)…",
    "BAB II — Deskripsi Kegiatan PKB (5 poin)…",
    "BAB III — Pokok Materi & Pembelajaran (8 poin)…",
    "BAB IV — Manfaat & Rencana Implementasi (5 poin)…",
    "BAB V — Penutup & Refleksi (2 poin)…",
    "Finalisasi dokumen…",
  ];
  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto">
        <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Sedang Menyusun PKB…</h2>
        <p className="text-sm text-gray-500 mt-1">Target: 8–10 halaman · 25 Poin SKP · Standar LPJK</p>
      </div>
      <div className="space-y-2 text-left">
        {bullets.map((b, i) => {
          const threshold = i * 350;
          const done = progress.length > threshold + 350;
          const active = !done && progress.length > threshold;
          return (
            <div key={i} className={`flex items-center gap-2 text-xs transition-all ${
              done ? "text-emerald-600 dark:text-emerald-400"
              : active ? "text-indigo-600 dark:text-indigo-400"
              : "text-gray-400"
            }`}>
              {done ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
               : active ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
               : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 shrink-0" />}
              {b}
            </div>
          );
        })}
      </div>
      {progress.length > 0 && (
        <div className="bg-gray-100 dark:bg-slate-800 rounded-xl p-3 text-left">
          <div className="text-[10px] text-gray-500 mb-1">Preview:</div>
          <div className="text-xs text-gray-700 dark:text-gray-300 font-mono leading-relaxed max-h-20 overflow-hidden">
            {progress.slice(-280)}
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Result({
  result, data, uploadedFiles, previewUrls, onReset,
}: {
  result: string;
  data: ProyekData;
  uploadedFiles: File[];
  previewUrls: string[];
  onReset: () => void;
}) {
  const [showLampiran, setShowLampiran] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PKB-ExecutiveSummary-${(data.namaPeserta || "peserta").replace(/\s+/g, "-")}-${data.tahunProyek || new Date().getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = result.split(/\s+/).filter(Boolean).length;
  const pageEst = Math.max(1, Math.round(wordCount / 300));

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Executive Summary PKB Selesai</h2>
            <p className="text-xs text-gray-500">~{wordCount.toLocaleString()} kata · est. {pageEst} hal A4 · 25 Poin SKP</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onReset}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Buat Baru
          </Button>
          <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={handleDownload} data-testid="btn-download-pkb">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh .txt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Target SKP", value: "25 SKP", color: "text-indigo-500" },
          { label: "Struktur BAB", value: "5 BAB", color: "text-violet-500" },
          { label: "Lampiran", value: `${uploadedFiles.length} file`, color: "text-emerald-500" },
        ].map((s, i) => (
          <div key={i} className="bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-xl p-3">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Penting:</strong> Bagian bertanda{" "}
          <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">[MASUKKAN DATA]</code>{" "}
          perlu dilengkapi secara manual. Refleksi di BAB V harus dari sudut pandang Anda sendiri.
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <FileText className="w-4 h-4 text-indigo-500" /> Dokumen Executive Summary PKB
          </div>
          <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Draft</Badge>
        </div>
        <pre className="p-4 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[480px] overflow-y-auto">
          {result}
        </pre>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-900/60 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setShowLampiran(v => !v)}
            data-testid="btn-toggle-lampiran"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-500" />
              Lampiran — {uploadedFiles.length} Screenshot E-SIMPAN
            </div>
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
          {showLampiran && (
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {previewUrls.map((src, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                  <img src={src} alt={`Lampiran ${i + 1}`} className="w-full object-cover" />
                  <div className="px-2 py-1 text-[10px] text-gray-500 bg-gray-50 dark:bg-slate-800">
                    Lampiran {i + 1} — {uploadedFiles[i]?.name.slice(0, 25)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-xs text-indigo-700 dark:text-indigo-400">
        <div className="font-semibold mb-1.5">Langkah selanjutnya:</div>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Lengkapi semua bagian <code>[MASUKKAN DATA]</code></li>
          <li>Tambahkan refleksi pribadi yang autentik di BAB V</li>
          <li>Sertakan screenshot E-SIMPAN sebagai lampiran resmi</li>
          <li>Upload & klaim SKP melalui portal LPJK / SIMPKb</li>
        </ol>
      </div>
    </div>
  );
}

export default function PkbBuilderPage() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ProyekData>(EMPTY_DATA);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const handleExtracted = (extracted: Partial<ProyekData>, files: File[], previews: string[]) => {
    setFormData(prev => ({ ...prev, ...extracted }));
    setUploadedFiles(files);
    setPreviewUrls(previews);
    setStep(2);
  };

  const handleGenerate = async () => {
    setStep(3);
    setResult("");
    try {
      const resp = await fetch("/api/pkb-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
      });
      if (!resp.ok) throw new Error("Gagal generate");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Stream tidak tersedia");
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.content) { full += json.content; setResult(full); }
            } catch { /* skip */ }
          }
        }
      }
      setResult(full);
      setStep(4);
    } catch (e: any) {
      toast({ title: "Gagal menyusun dokumen", description: e.message, variant: "destructive" });
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(1); setFormData(EMPTY_DATA);
    setUploadedFiles([]); setPreviewUrls([]); setResult("");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <SharedHeader />
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            Ekosistem Kompetensi PKB
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">PKB Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
            Upload screenshot E-SIMPAN → AI baca data proyek → susun Executive Summary PKB 25 Poin SKP siap klaim LPJK
          </p>
        </div>
        <StepBar step={step} />
        {step === 1 && <Step1Upload onExtracted={handleExtracted} onSkip={() => setStep(2)} />}
        {step === 2 && <Step2Form data={formData} onChange={setFormData} onBack={() => setStep(1)} onNext={handleGenerate} uploadedFiles={uploadedFiles} />}
        {step === 3 && <Step3Generating progress={result} />}
        {step === 4 && <Step4Result result={result} data={formData} uploadedFiles={uploadedFiles} previewUrls={previewUrls} onReset={handleReset} />}
      </div>
    </div>
  );
}
