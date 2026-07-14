import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Copy, Check, Printer, RotateCcw, Sparkles, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  color: string;
  fields: Array<{ id: string; label: string; type: "text" | "textarea" | "date"; placeholder?: string; required?: boolean }>;
  promptHint: string;
}

const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "surat_permohonan",
    name: "Surat Permohonan",
    emoji: "📝",
    description: "Surat permohonan formal untuk SBU, izin, atau keperluan resmi lainnya",
    category: "Surat Resmi",
    color: "blue",
    fields: [
      { id: "tujuan", label: "Ditujukan Kepada (Instansi/Pejabat)", type: "text", placeholder: "Ketua LPJK / Direktur Jenderal...", required: true },
      { id: "perihal", label: "Perihal / Judul Surat", type: "text", placeholder: "Permohonan Sertifikasi SBU Konstruksi", required: true },
      { id: "nama_perusahaan", label: "Nama Perusahaan Pemohon", type: "text", placeholder: "PT. Cipta Karya Nusantara", required: true },
      { id: "no_npwp", label: "No. NPWP / NIB", type: "text", placeholder: "01.234.567.8-901.000" },
      { id: "isi_permohonan", label: "Uraian Permohonan", type: "textarea", placeholder: "Jelaskan keperluan dan latar belakang permohonan...", required: true },
      { id: "dokumen_pendukung", label: "Dokumen Pendukung (opsional)", type: "textarea", placeholder: "1. Akta pendirian\n2. NPWP perusahaan\n3. ..." },
    ],
    promptHint: "surat permohonan formal resmi sesuai format standar surat dinas Indonesia dengan kop surat dan nomor surat",
  },
  {
    id: "laporan_k3",
    name: "Laporan K3 Lapangan",
    emoji: "⛑️",
    description: "Laporan inspeksi keselamatan & kesehatan kerja di lapangan konstruksi",
    category: "K3 & Safety",
    color: "orange",
    fields: [
      { id: "nama_proyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung Kantor...", required: true },
      { id: "lokasi", label: "Lokasi Proyek", type: "text", placeholder: "Jl. Sudirman No. 10, Jakarta" },
      { id: "tanggal_inspeksi", label: "Tanggal Inspeksi", type: "date", required: true },
      { id: "inspektor", label: "Nama Inspektor / Petugas K3", type: "text", placeholder: "Ir. Budi Santoso, SKK K3 Konstruksi", required: true },
      { id: "temuan", label: "Temuan & Observasi", type: "textarea", placeholder: "Deskripsikan temuan di lapangan, kondisi tidak aman, near miss...", required: true },
      { id: "tindakan", label: "Tindakan Korektif yang Diperlukan", type: "textarea", placeholder: "Tindakan yang harus segera dilakukan..." },
      { id: "skor_kepatuhan", label: "Estimasi Skor Kepatuhan (%)", type: "text", placeholder: "75" },
    ],
    promptHint: "laporan inspeksi K3 konstruksi profesional dengan format standar ISO 45001",
  },
  {
    id: "rab_sederhana",
    name: "RAB Sederhana",
    emoji: "🧮",
    description: "Rencana Anggaran Biaya konstruksi dalam format tabel terstruktur",
    category: "Keuangan & Estimasi",
    color: "emerald",
    fields: [
      { id: "nama_proyek", label: "Nama Proyek", type: "text", placeholder: "Renovasi Gedung Kantor Lantai 3", required: true },
      { id: "lokasi", label: "Lokasi", type: "text", placeholder: "Jakarta Selatan" },
      { id: "pemilik", label: "Owner / Pemberi Tugas", type: "text", placeholder: "PT. ABC Indonesia" },
      { id: "lingkup", label: "Lingkup Pekerjaan", type: "textarea", placeholder: "Deskripsikan item pekerjaan: sipil, arsitektur, MEP, dll...", required: true },
      { id: "catatan", label: "Asumsi & Catatan Estimasi", type: "textarea", placeholder: "Harga material per wilayah, eskalasi, overhead, dll..." },
    ],
    promptHint: "RAB konstruksi dengan tabel item pekerjaan, volume, satuan, harga satuan, dan total biaya",
  },
  {
    id: "proposal_teknis",
    name: "Proposal Teknis",
    emoji: "📋",
    description: "Proposal teknis untuk tender konstruksi atau konsultansi",
    category: "Tender & Pengadaan",
    color: "indigo",
    fields: [
      { id: "nama_proyek", label: "Nama / Judul Proyek", type: "text", placeholder: "Perencanaan Jembatan Kali Brantas Paket 2", required: true },
      { id: "pemberi_tugas", label: "Pemberi Tugas / Pengguna Jasa", type: "text", placeholder: "Dinas PUPR Provinsi Jawa Timur" },
      { id: "nama_perusahaan", label: "Nama Perusahaan Penawar", type: "text", placeholder: "PT. Konstruksi Maju Bersama", required: true },
      { id: "lingkup_pekerjaan", label: "Lingkup Pekerjaan", type: "textarea", placeholder: "Deskripsikan ruang lingkup pekerjaan teknis...", required: true },
      { id: "metodologi", label: "Pendekatan & Metodologi", type: "textarea", placeholder: "Bagaimana proyek akan dilaksanakan, tahapan, metode..." },
      { id: "timeline", label: "Estimasi Waktu Pelaksanaan", type: "text", placeholder: "6 bulan (180 hari kalender)" },
      { id: "nilai_penawaran", label: "Nilai Penawaran (opsional)", type: "text", placeholder: "Rp 2.500.000.000" },
    ],
    promptHint: "proposal teknis tender profesional sesuai standar Perpres 46/2025 dan Permen PUPR",
  },
  {
    id: "checklist_iso",
    name: "Checklist Kepatuhan ISO",
    emoji: "✅",
    description: "Checklist audit kepatuhan ISO 9001, 14001, atau 45001",
    category: "Sistem Manajemen",
    color: "teal",
    fields: [
      { id: "standar_iso", label: "Standar ISO", type: "text", placeholder: "ISO 9001:2015 / ISO 14001:2015 / ISO 45001:2018", required: true },
      { id: "nama_perusahaan", label: "Nama Perusahaan / Unit Kerja", type: "text", placeholder: "PT. Aman Konstruksi", required: true },
      { id: "lingkup_audit", label: "Lingkup Audit", type: "textarea", placeholder: "Klausul yang akan diaudit, departemen yang terlibat...", required: true },
      { id: "temuan_sebelumnya", label: "Temuan Audit Sebelumnya (opsional)", type: "textarea", placeholder: "NCR / observasi dari audit sebelumnya yang perlu ditindaklanjuti..." },
    ],
    promptHint: "checklist audit ISO komprehensif dalam format tabel dengan kolom klausul, kriteria, status, dan temuan",
  },
  {
    id: "assessment_skk",
    name: "Laporan Assessment SKK",
    emoji: "🎓",
    description: "Laporan penilaian kompetensi persiapan Sertifikasi Kompetensi Kerja",
    category: "Kompetensi & SKK",
    color: "violet",
    fields: [
      { id: "nama_peserta", label: "Nama Peserta Uji", type: "text", placeholder: "Ahmad Fauzi, S.T.", required: true },
      { id: "jabatan_skk", label: "Jabatan / Kualifikasi SKK", type: "text", placeholder: "Ahli Teknik Bangunan Gedung Madya (SKK Level 7)", required: true },
      { id: "pengalaman", label: "Ringkasan Pengalaman Kerja", type: "textarea", placeholder: "Deskripsikan pengalaman kerja relevan...", required: true },
      { id: "unit_kompetensi", label: "Unit Kompetensi yang Diuji", type: "textarea", placeholder: "Daftar unit kompetensi sesuai SKKNI..." },
      { id: "catatan_asesor", label: "Catatan & Rekomendasi", type: "textarea", placeholder: "Rekomendasi peningkatan kompetensi, gap yang perlu ditutup..." },
    ],
    promptHint: "laporan assessment kompetensi SKK dengan format standar BNSP dan skema LPJK",
  },
  {
    id: "notulen_rapat",
    name: "Notulen Rapat",
    emoji: "📌",
    description: "Notulensi rapat proyek, koordinasi, atau rapat teknis",
    category: "Manajemen Proyek",
    color: "slate",
    fields: [
      { id: "judul_rapat", label: "Judul / Agenda Rapat", type: "text", placeholder: "Rapat Koordinasi Mingguan Proyek XYZ", required: true },
      { id: "tanggal", label: "Tanggal & Waktu", type: "date", required: true },
      { id: "lokasi_rapat", label: "Tempat / Media Rapat", type: "text", placeholder: "Ruang Rapat Direksi / Zoom Meeting" },
      { id: "peserta", label: "Peserta Rapat", type: "textarea", placeholder: "Nama - Jabatan\nBudi Santoso - Project Manager\n...", required: true },
      { id: "pembahasan", label: "Pokok Pembahasan & Keputusan", type: "textarea", placeholder: "Ringkasan diskusi, keputusan yang diambil, action items...", required: true },
      { id: "tindak_lanjut", label: "Tindak Lanjut & PIC", type: "textarea", placeholder: "Item - PIC - Deadline\n..." },
    ],
    promptHint: "notulensi rapat profesional dengan format resmi termasuk daftar hadir, pembahasan, keputusan, dan action items",
  },
  {
    id: "rencana_belajar",
    name: "Rencana Belajar",
    emoji: "📚",
    description: "Program belajar terstruktur untuk persiapan SKK, sertifikasi, atau peningkatan kompetensi",
    category: "Pembelajaran",
    color: "cyan",
    fields: [
      { id: "nama_peserta", label: "Nama Peserta / Pelajar", type: "text", placeholder: "Nama lengkap", required: true },
      { id: "tujuan_belajar", label: "Tujuan Pembelajaran", type: "text", placeholder: "Lulus uji SKK Ahli K3 Madya / Menguasai ISO 9001", required: true },
      { id: "durasi", label: "Durasi Program", type: "text", placeholder: "3 bulan (12 minggu)" },
      { id: "topik", label: "Topik & Materi yang Perlu Dikuasai", type: "textarea", placeholder: "Deskripsikan materi atau unit kompetensi yang perlu dipelajari...", required: true },
      { id: "kondisi_saat_ini", label: "Kondisi Kompetensi Saat Ini", type: "textarea", placeholder: "Apa yang sudah dikuasai, gap kompetensi yang perlu ditutup..." },
    ],
    promptHint: "rencana belajar mingguan terstruktur dengan milestone, materi, dan indikator keberhasilan",
  },
  {
    id: "laporan_audit",
    name: "Laporan Audit Internal",
    emoji: "🔍",
    description: "Laporan audit internal untuk sistem manajemen (ISO, SMAP, SMK3)",
    category: "Audit & Kepatuhan",
    color: "red",
    fields: [
      { id: "jenis_audit", label: "Jenis Audit", type: "text", placeholder: "Audit Internal ISO 9001 / Audit SMAP / Audit K3", required: true },
      { id: "nama_organisasi", label: "Nama Organisasi / Departemen", type: "text", placeholder: "PT. XYZ — Divisi Operasional", required: true },
      { id: "tanggal_audit", label: "Tanggal Audit", type: "date", required: true },
      { id: "auditor", label: "Tim Auditor", type: "text", placeholder: "Lead Auditor: ..., Auditor Anggota: ..." },
      { id: "temuan", label: "Temuan Audit (NCR / Observasi / OFI)", type: "textarea", placeholder: "Deskripsikan semua temuan, kategori, dan bukti objektif...", required: true },
      { id: "rekomendasi", label: "Rekomendasi & Tindakan Perbaikan", type: "textarea", placeholder: "Rekomendasi untuk setiap temuan..." },
    ],
    promptHint: "laporan audit formal dengan klasifikasi temuan Major NC, Minor NC, Observasi, OFI dan rekomendasi",
  },
  {
    id: "surat_penawaran",
    name: "Surat Penawaran",
    emoji: "💼",
    description: "Surat penawaran harga untuk paket pekerjaan atau layanan konstruksi",
    category: "Tender & Pengadaan",
    color: "amber",
    fields: [
      { id: "tujuan", label: "Ditujukan Kepada", type: "text", placeholder: "Panitia Pengadaan / Pengguna Jasa", required: true },
      { id: "nama_paket", label: "Nama Paket Pekerjaan", type: "text", placeholder: "Pekerjaan Pembangunan ...", required: true },
      { id: "nama_perusahaan", label: "Nama Perusahaan Penawar", type: "text", placeholder: "PT. Konstruksi Jaya", required: true },
      { id: "nilai_penawaran", label: "Nilai Penawaran", type: "text", placeholder: "Rp 4.750.000.000", required: true },
      { id: "masa_berlaku", label: "Masa Berlaku Penawaran", type: "text", placeholder: "30 hari kalender sejak tanggal surat" },
      { id: "catatan", label: "Catatan / Syarat Khusus (opsional)", type: "textarea", placeholder: "Syarat pembayaran, scope exclusion, dll..." },
    ],
    promptHint: "surat penawaran formal sesuai format standar pengadaan barang/jasa pemerintah Indonesia",
  },
  {
    id: "laporan_kemajuan",
    name: "Laporan Kemajuan Proyek",
    emoji: "📊",
    description: "Laporan progres bulanan/mingguan proyek konstruksi untuk owner",
    category: "Manajemen Proyek",
    color: "sky",
    fields: [
      { id: "nama_proyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung Kantor Pusat", required: true },
      { id: "periode", label: "Periode Laporan", type: "text", placeholder: "Minggu ke-12 / Bulan Maret 2025", required: true },
      { id: "progres_fisik", label: "Progres Fisik (%)", type: "text", placeholder: "67.5%", required: true },
      { id: "progres_keuangan", label: "Progres Keuangan / Realisasi Biaya", type: "text", placeholder: "Rp 12.5 Miliar dari total Rp 25 Miliar" },
      { id: "pekerjaan_selesai", label: "Pekerjaan yang Telah Selesai", type: "textarea", placeholder: "Item pekerjaan yang telah diselesaikan periode ini...", required: true },
      { id: "kendala", label: "Kendala & Risiko", type: "textarea", placeholder: "Hambatan yang dihadapi, risiko yang muncul..." },
      { id: "rencana_berikut", label: "Rencana Periode Berikutnya", type: "textarea", placeholder: "Target dan kegiatan yang akan dikerjakan..." },
    ],
    promptHint: "laporan kemajuan proyek konstruksi profesional dengan ringkasan progres, kendala, dan rencana ke depan",
  },
  {
    id: "executive_summary",
    name: "Executive Summary",
    emoji: "🏆",
    description: "Ringkasan eksekutif untuk laporan, proposal, atau hasil analisis AI",
    category: "Umum",
    color: "gray",
    fields: [
      { id: "judul", label: "Judul Dokumen / Proyek", type: "text", placeholder: "Analisis Kelayakan Proyek / Hasil Audit Q1 2025", required: true },
      { id: "konteks", label: "Konteks & Latar Belakang", type: "textarea", placeholder: "Situasi, tantangan, atau pertanyaan yang ingin dijawab...", required: true },
      { id: "temuan_utama", label: "Temuan / Poin Utama", type: "textarea", placeholder: "3-5 poin kunci yang perlu disampaikan ke manajemen...", required: true },
      { id: "rekomendasi", label: "Rekomendasi Utama", type: "textarea", placeholder: "Tindakan yang direkomendasikan berdasarkan temuan..." },
      { id: "audiens", label: "Target Audiens", type: "text", placeholder: "Direksi / Board / Manajemen Senior" },
    ],
    promptHint: "executive summary padat dan profesional yang mudah dibaca pengambil keputusan senior",
  },
];

const COLOR_CLASS: Record<string, { card: string; badge: string; ring: string }> = {
  blue: { card: "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", ring: "ring-blue-400" },
  orange: { card: "hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", ring: "ring-orange-400" },
  emerald: { card: "hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", ring: "ring-emerald-400" },
  indigo: { card: "hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", ring: "ring-indigo-400" },
  teal: { card: "hover:border-teal-300 hover:bg-teal-50/50 dark:hover:bg-teal-950/20", badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300", ring: "ring-teal-400" },
  violet: { card: "hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", ring: "ring-violet-400" },
  slate: { card: "hover:border-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-950/20", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300", ring: "ring-slate-400" },
  cyan: { card: "hover:border-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", ring: "ring-cyan-400" },
  red: { card: "hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", ring: "ring-red-400" },
  amber: { card: "hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", ring: "ring-amber-400" },
  sky: { card: "hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/20", badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", ring: "ring-sky-400" },
  gray: { card: "hover:border-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-950/20", badge: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300", ring: "ring-gray-400" },
};

export default function DocGenerator() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [chatContext, setChatContext] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("type");
    const miniappParam = params.get("miniapp");
    const ctxParam = params.get("ctx");
    const labelParam = params.get("label");

    if (ctxParam) {
      try { setChatContext(decodeURIComponent(ctxParam)); } catch { /* ignore */ }
    }

    const resolvedType = typeParam || miniappParam;
    if (resolvedType) {
      const template = DOC_TEMPLATES.find(t => t.id === resolvedType);
      if (template) {
        setSelectedTemplate(template);
      } else if (labelParam) {
        const matched = DOC_TEMPLATES.find(t =>
          t.name.toLowerCase().includes(decodeURIComponent(labelParam).toLowerCase().slice(0, 8)) ||
          decodeURIComponent(labelParam).toLowerCase().includes(t.name.toLowerCase().slice(0, 6))
        );
        if (matched) setSelectedTemplate(matched);
      }
    }
  }, []);

  function setField(id: string, value: string) {
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  async function handleGenerate() {
    if (!selectedTemplate) return;
    const missing = selectedTemplate.fields.filter(f => f.required && !formData[f.id]?.trim());
    if (missing.length > 0) {
      toast({ title: "Lengkapi data", description: `Kolom wajib: ${missing.map(f => f.label).join(", ")}`, variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedDoc("");

    try {
      const resp = await fetch("/api/doc-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          promptHint: selectedTemplate.promptHint,
          fields: formData,
          chatContext,
        }),
      });

      if (!resp.ok) throw new Error("Gagal generate dokumen");

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Streaming tidak tersedia");

      const decoder = new TextDecoder();
      let buffer = "";
      let docText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (delta) { docText += delta; setGeneratedDoc(docText); }
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Terjadi kesalahan saat generate dokumen", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin!", description: "Dokumen berhasil disalin ke clipboard" });
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${selectedTemplate?.name ?? "Dokumen"}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 2.5cm; color: #000; }
      h1,h2,h3 { margin-top: 1em; } table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #000; padding: 6px 10px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      pre { white-space: pre-wrap; font-family: inherit; }
    </style></head><body><pre>${generatedDoc.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
    win.document.close();
    win.print();
  }

  const categories = [...new Set(DOC_TEMPLATES.map(t => t.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="btn-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Gustafta Doc Generator</h1>
              <p className="text-[10px] text-muted-foreground">Generate dokumen profesional dari obrolan AI</p>
            </div>
          </div>
          {selectedTemplate && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {selectedTemplate.emoji} {selectedTemplate.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Context chip (from chat) */}
        {chatContext && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-700 dark:text-blue-300">Konteks dari obrolan AI:</span>
              <span className="text-blue-600 dark:text-blue-400 ml-1 line-clamp-2">{chatContext}</span>
            </div>
          </div>
        )}

        {/* Template Selector */}
        {!selectedTemplate ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Pilih Template Dokumen</h2>
              <p className="text-xs text-muted-foreground mt-0.5">12 template dokumen profesional siap AI — klik untuk memulai</p>
            </div>
            {categories.map(cat => (
              <div key={cat} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DOC_TEMPLATES.filter(t => t.category === cat).map(template => {
                    const cc = COLOR_CLASS[template.color] ?? COLOR_CLASS.gray;
                    return (
                      <button
                        key={template.id}
                        onClick={() => { setSelectedTemplate(template); setFormData({}); setGeneratedDoc(""); }}
                        data-testid={`template-card-${template.id}`}
                        className={`
                          text-left p-3.5 rounded-xl border border-border bg-card transition-all duration-150
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer
                          ${cc.card}
                        `}
                      >
                        <div className="text-2xl mb-1.5">{template.emoji}</div>
                        <div className="text-xs font-semibold leading-tight mb-1">{template.name}</div>
                        <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{template.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedTemplate(null); setGeneratedDoc(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  data-testid="btn-change-template"
                >
                  ← Ganti template
                </button>
              </div>

              <div className={`p-4 rounded-xl border space-y-4 ${COLOR_CLASS[selectedTemplate.color]?.card.replace("hover:", "")}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedTemplate.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold">{selectedTemplate.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                </div>

                {selectedTemplate.fields.map(field => (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-xs font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        data-testid={`field-${field.id}`}
                        value={formData[field.id] ?? ""}
                        onChange={e => setField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="text-xs min-h-[80px] resize-none"
                      />
                    ) : (
                      <Input
                        data-testid={`field-${field.id}`}
                        type={field.type}
                        value={formData[field.id] ?? ""}
                        onChange={e => setField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="text-xs"
                      />
                    )}
                  </div>
                ))}

                {chatContext && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Konteks Tambahan dari Chat AI</Label>
                    <Textarea
                      data-testid="field-chat-context"
                      value={chatContext}
                      onChange={e => setChatContext(e.target.value)}
                      className="text-xs min-h-[60px] resize-none bg-blue-50/50 dark:bg-blue-950/20"
                    />
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                  data-testid="btn-generate"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang generate...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Dokumen</>
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Output */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Hasil Dokumen</h3>
                {generatedDoc && (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={handleCopy} data-testid="btn-copy" className="h-7 text-xs gap-1">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Tersalin" : "Salin"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handlePrint} data-testid="btn-print" className="h-7 text-xs gap-1">
                      <Printer className="w-3 h-3" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setGeneratedDoc("")}
                      data-testid="btn-reset"
                      className="h-7 text-xs gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div
                className="min-h-[400px] rounded-xl border bg-card p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-auto"
                data-testid="doc-output"
              >
                {isGenerating && !generatedDoc && (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-xs">AI sedang menyusun dokumen...</p>
                  </div>
                )}
                {!isGenerating && !generatedDoc && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <FileText className="w-8 h-8 opacity-30" />
                    <p className="text-xs">Isi formulir dan klik Generate Dokumen</p>
                  </div>
                )}
                {generatedDoc && (
                  <span>{generatedDoc}{isGenerating && <span className="animate-pulse">▊</span>}</span>
                )}
              </div>

              {generatedDoc && !isGenerating && (
                <p className="text-[10px] text-muted-foreground text-center">
                  💡 Dokumen siap. Salin ke Word/Google Docs untuk editing dan finalisasi.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
