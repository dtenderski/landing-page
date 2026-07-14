import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, FileText, Sparkles, Copy, Download, Building2,
  CheckCircle, Loader2, RefreshCw, FileSignature,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BjClient {
  id: number;
  companyName: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
}

interface DocField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface DocType {
  id: string;
  label: string;
  desc: string;
  fields: DocField[];
}

// ─── Document Types ───────────────────────────────────────────────────────────
const DOC_TYPES: DocType[] = [
  {
    id: "surat_kuasa",
    label: "Surat Kuasa",
    desc: "Kuasa dari klien kepada biro jasa untuk mengurus sertifikasi",
    fields: [
      { key: "jabatan_pemberi", label: "Jabatan Pemberi Kuasa", type: "text", placeholder: "Direktur Utama / Direktur", required: true },
      { key: "penerima_kuasa", label: "Nama Penerima Kuasa (Biro Jasa / PIC)", type: "text", placeholder: "Nama PIC biro jasa", required: true },
      { key: "jabatan_penerima", label: "Jabatan Penerima Kuasa", type: "text", placeholder: "Konsultan Sertifikasi" },
      { key: "keperluan", label: "Keperluan / Tujuan Kuasa", type: "textarea", placeholder: "Mis: mengurus dan menyelesaikan proses pengajuan SBU Konstruksi klasifikasi Bangunan Gedung di LPJK / OSS-RBA", required: true },
      { key: "kota", label: "Kota Penandatanganan", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "permohonan_sbu",
    label: "Surat Permohonan SBU",
    desc: "Surat formal permohonan penerbitan Sertifikat Badan Usaha",
    fields: [
      { key: "jenis_sbu", label: "Jenis SBU", type: "select", options: ["SBU Konstruksi (BUJK)", "SBU Konsultansi Konstruksi (BUJKK)", "SBU Instalasi Listrik", "SBU Mekanikal", "SBU Elektrikal"], required: true },
      { key: "subklasifikasi", label: "Subklasifikasi / Bidang", type: "text", placeholder: "BG001 - Bangunan Gedung / BS009 - Jalan Raya", required: true },
      { key: "kualifikasi", label: "Kualifikasi", type: "select", options: ["Kecil (K1/K2/K3)", "Menengah (M1/M2)", "Besar (B1/B2)"], required: true },
      { key: "kepada", label: "Kepada (Lembaga Tujuan)", type: "text", placeholder: "Ketua LPJK Nasional / Kepala DPMPTSP", required: true },
      { key: "catatan_tambahan", label: "Informasi Tambahan (opsional)", type: "textarea", placeholder: "Mis: permohonan perpanjangan, upgrade kualifikasi, dll" },
      { key: "kota", label: "Kota", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "permohonan_skk",
    label: "Surat Permohonan SKK",
    desc: "Surat pengantar permohonan Sertifikat Kompetensi Kerja konstruksi",
    fields: [
      { key: "nama_pemegang", label: "Nama Calon Pemegang SKK", type: "text", placeholder: "Nama lengkap tenaga kerja", required: true },
      { key: "jabatan_kerja", label: "Jabatan Kerja / Skema SKK", type: "text", placeholder: "Ahli Madya Manajemen Konstruksi / Pelaksana Lapangan", required: true },
      { key: "level", label: "Level Kualifikasi", type: "select", options: ["Level 3 (Operator)", "Level 4 (Teknisi/Analis)", "Level 5 (Teknisi Senior)", "Level 6 (Ahli Muda)", "Level 7 (Ahli Madya)", "Level 8 (Ahli Utama)", "Level 9 (Ahli Utama Senior)"], required: true },
      { key: "lsp", label: "Nama LSP / Lembaga Sertifikasi", type: "text", placeholder: "LSP Konstruksi / BNSP / LPJK", required: true },
      { key: "kota", label: "Kota", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "cover_letter",
    label: "Cover Letter Pengajuan",
    desc: "Surat pengantar umum untuk berbagai keperluan pengajuan dokumen",
    fields: [
      { key: "perihal", label: "Perihal / Subjek Surat", type: "text", placeholder: "Pengajuan Perpanjangan SBU Konstruksi", required: true },
      { key: "kepada", label: "Kepada / Ditujukan ke", type: "text", placeholder: "Yth. Kepala DPMPTSP Provinsi DKI Jakarta", required: true },
      { key: "isi_singkat", label: "Poin-poin Isi Surat", type: "textarea", placeholder: "Tulis poin-poin utama yang ingin disampaikan...\nMis:\n- Masa berlaku SBU berakhir 31 Agustus 2026\n- Seluruh dokumen persyaratan telah disiapkan\n- Mohon arahan proses selanjutnya", required: true },
      { key: "kota", label: "Kota", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "pakta_integritas",
    label: "Pakta Integritas",
    desc: "Pernyataan integritas untuk pengajuan tender atau sertifikasi",
    fields: [
      { key: "nama_penandatangan", label: "Nama Penandatangan", type: "text", placeholder: "Nama direktur / pimpinan", required: true },
      { key: "jabatan", label: "Jabatan", type: "text", placeholder: "Direktur Utama", required: true },
      { key: "konteks", label: "Konteks / Keperluan Pakta", type: "select", options: ["Pengajuan SBU Konstruksi", "Pengajuan SKK Tenaga Kerja", "Pengajuan ISO", "Penawaran Tender Pemerintah", "Pengajuan CSMS", "Lainnya"], required: true },
      { key: "detail_konteks", label: "Detail Spesifik (opsional)", type: "text", placeholder: "Mis: Paket Pekerjaan Jalan Provinsi Jawa Barat" },
      { key: "kota", label: "Kota", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "pernyataan_kebenaran",
    label: "Pernyataan Kebenaran Dokumen",
    desc: "Surat pernyataan bahwa seluruh dokumen yang diserahkan adalah benar dan sah",
    fields: [
      { key: "nama_penandatangan", label: "Nama Penandatangan", type: "text", placeholder: "Nama direktur", required: true },
      { key: "jabatan", label: "Jabatan", type: "text", placeholder: "Direktur Utama", required: true },
      { key: "jenis_pengajuan", label: "Jenis Pengajuan Dokumen", type: "text", placeholder: "pengajuan SBU Konstruksi subklasifikasi BG001", required: true },
      { key: "kota", label: "Kota", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "pengantar_dokumen",
    label: "Surat Pengantar Dokumen",
    desc: "Surat yang mengiringi paket dokumen yang diserahkan",
    fields: [
      { key: "perihal", label: "Perihal", type: "text", placeholder: "Penyerahan Dokumen Persyaratan SBU", required: true },
      { key: "kepada", label: "Kepada / Ditujukan ke", type: "text", placeholder: "Yth. Kepala LPJK / DPMPTSP", required: true },
      { key: "daftar_lampiran", label: "Daftar Lampiran / Dokumen", type: "textarea", placeholder: "1. Akta Pendirian Perusahaan\n2. SK Kemenkumham\n3. NIB\n4. NPWP Perusahaan\n5. Laporan Keuangan 2 tahun terakhir\n...", required: true },
      { key: "kota", label: "Kota", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
  {
    id: "perjanjian_biro_jasa",
    label: "Perjanjian Layanan Biro Jasa",
    desc: "Kontrak sederhana antara biro jasa dan klien BUJK",
    fields: [
      { key: "nama_biro_jasa", label: "Nama Biro Jasa (Pihak Pertama)", type: "text", placeholder: "PT / CV nama biro jasa Anda", required: true },
      { key: "pimpinan_biro", label: "Nama Pimpinan Biro Jasa", type: "text", placeholder: "Nama direktur biro jasa" },
      { key: "scope_pekerjaan", label: "Lingkup Pekerjaan / Layanan", type: "textarea", placeholder: "Mis:\n- Pengurusan SBU Konstruksi subklasifikasi BG001 Kualifikasi Menengah\n- Pengumpulan dan verifikasi dokumen\n- Pendampingan proses di LPJK / OSS\n- Monitoring status pengajuan", required: true },
      { key: "biaya", label: "Biaya Layanan (Rp)", type: "text", placeholder: "Mis: 5.000.000 (Lima Juta Rupiah)" },
      { key: "timeline", label: "Estimasi Waktu Penyelesaian", type: "text", placeholder: "Mis: 30-60 hari kerja sejak dokumen lengkap" },
      { key: "kota", label: "Kota Penandatanganan", type: "text", placeholder: "Jakarta" },
      { key: "tanggal", label: "Tanggal", type: "text", placeholder: "15 Juni 2026" },
    ],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocuGen() {
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState<string>("manual");
  const [manualCompany, setManualCompany] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: clients = [] } = useQuery<BjClient[]>({
    queryKey: ["/api/cert-tracker/clients"],
  });

  const docType = DOC_TYPES.find(d => d.id === selectedDocType);

  const selectedClient = clients.find(c => String(c.id) === selectedClientId);
  const companyName = selectedClientId === "manual"
    ? manualCompany
    : (selectedClient?.companyName ?? "");

  const setField = (key: string, val: string) => setFields(f => ({ ...f, [key]: val }));

  const canGenerate = !!companyName.trim() && !!selectedDocType &&
    (docType?.fields.filter(f => f.required).every(f => fields[f.key]?.trim()) ?? false);

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/docu-gen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, docTypeId: selectedDocType, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate dokumen");
      setResult(data.document);
    } catch (err: any) {
      toast({ title: "Gagal generate dokumen", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin ke clipboard!" });
  }

  async function handleDownloadPdf() {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;
      const lines = doc.splitTextToSize(result, maxWidth);
      let y = margin;
      const lineHeight = 6;
      lines.forEach((line: string) => {
        if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(11);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      const fileName = `${docType?.label ?? "Dokumen"}_${companyName.replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);
      toast({ title: "PDF berhasil diunduh!" });
    } catch {
      toast({ title: "Gagal buat PDF", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-sm">DocuGen — AI Document Generator</span>
            </div>
          </div>
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs gap-1.5">
            <Sparkles className="w-3 h-3" /> GPT-4o
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ minHeight: "75vh" }}>

          {/* LEFT — Config Panel */}
          <div className="lg:col-span-2 space-y-4">

            {/* Client Selector */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">Nama Perusahaan Klien</span>
              </div>

              <Select value={selectedClientId} onValueChange={v => { setSelectedClientId(v); setFields({}); }}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-client">
                  <SelectValue placeholder="Pilih klien atau input manual..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="manual" className="text-white hover:bg-slate-700">
                    ✏️ Input manual...
                  </SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-white hover:bg-slate-700">
                      🏢 {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClientId === "manual" ? (
                <Input
                  value={manualCompany}
                  onChange={e => setManualCompany(e.target.value)}
                  placeholder="Nama perusahaan klien..."
                  className="bg-slate-800 border-slate-600 text-white"
                  data-testid="input-manual-company"
                />
              ) : selectedClient && (
                <div className="text-xs text-slate-400 bg-slate-800/60 rounded-lg p-2 space-y-0.5">
                  {selectedClient.picName && <div>👤 {selectedClient.picName}</div>}
                  {selectedClient.phone && <div>📞 {selectedClient.phone}</div>}
                  {selectedClient.email && <div>📧 {selectedClient.email}</div>}
                  {selectedClient.address && <div>📍 {selectedClient.address}</div>}
                </div>
              )}
            </div>

            {/* Doc Type Selector */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">Jenis Dokumen</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {DOC_TYPES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDocType(d.id); setFields({}); setResult(""); }}
                    data-testid={`select-doctype-${d.id}`}
                    className={`text-left rounded-lg border p-2.5 transition-all
                      ${selectedDocType === d.id
                        ? "border-blue-500/60 bg-blue-900/20"
                        : "border-slate-700/60 hover:border-blue-700/40 hover:bg-slate-800/60 bg-slate-800/30"}`}
                  >
                    <div className="text-xs font-semibold text-white">{d.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields */}
            {docType && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-slate-200">Detail Dokumen</span>
                </div>

                {docType.fields.map(f => (
                  <div key={f.key}>
                    <Label className="text-slate-300 text-xs mb-1 flex items-center gap-1">
                      {f.label}
                      {f.required && <span className="text-orange-400">*</span>}
                    </Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        value={fields[f.key] ?? ""}
                        onChange={e => setField(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={3}
                        className="bg-slate-800 border-slate-600 text-white text-xs resize-none"
                        data-testid={`input-field-${f.key}`}
                      />
                    ) : f.type === "select" ? (
                      <Select value={fields[f.key] ?? ""} onValueChange={v => setField(f.key, v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-xs" data-testid={`select-field-${f.key}`}>
                          <SelectValue placeholder="Pilih..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {f.options?.map(o => (
                            <SelectItem key={o} value={o} className="text-white hover:bg-slate-700 text-xs">{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={fields[f.key] ?? ""}
                        onChange={e => setField(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="bg-slate-800 border-slate-600 text-white text-xs"
                        data-testid={`input-field-${f.key}`}
                      />
                    )}
                  </div>
                ))}

                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-2 gap-2"
                  data-testid="button-generate"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sedang generate...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Dokumen</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT — Document Preview */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200 flex-1">Preview Dokumen</span>
              {result && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
                    data-testid="button-copy"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Disalin!" : "Salin"}
                  </Button>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-blue-700/50 text-blue-400 hover:bg-blue-900/30 gap-1.5"
                    data-testid="button-download-pdf"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                  <Button
                    onClick={() => { setResult(""); setFields({}); }}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-500 hover:text-slate-300 gap-1"
                    data-testid="button-reset"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  <div>
                    <div className="text-sm font-medium text-slate-300">Sedang membuat dokumen...</div>
                    <div className="text-xs text-slate-500 mt-1">AI menyusun bahasa formal & struktur yang tepat</div>
                  </div>
                </div>
              ) : result ? (
                <div className="bg-white rounded-lg p-6 md:p-8 shadow-lg">
                  <pre className="whitespace-pre-wrap text-slate-900 text-sm leading-relaxed font-sans">
                    {result}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-slate-500">
                  <FileSignature className="w-16 h-16 text-slate-700" />
                  <div>
                    <div className="text-sm font-medium text-slate-400 mb-1">Dokumen akan muncul di sini</div>
                    <div className="text-xs leading-relaxed max-w-xs">
                      Pilih klien, jenis dokumen, isi detail di sebelah kiri,<br />
                      lalu klik <span className="text-blue-400 font-medium">Generate Dokumen</span>
                    </div>
                  </div>

                  {/* Quick tips */}
                  <div className="mt-4 space-y-2 text-left max-w-sm">
                    {[
                      "Surat Kuasa — kuasa pengurusan SBU/SKK dari klien ke biro jasa",
                      "Pakta Integritas — untuk tender atau pengajuan sertifikasi",
                      "Perjanjian Layanan — kontrak biro jasa dengan klien BUJK",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="text-blue-600/50 shrink-0">→</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="p-3 border-t border-slate-800 text-xs text-slate-600 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-600/50" />
                Dokumen digenerate oleh AI — harap review sebelum ditandatangani. Sesuaikan nama, tanggal, dan detail spesifik.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
