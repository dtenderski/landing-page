import { useState } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, UploadCloud, Settings, Database, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Info, ExternalLink, BookOpen,
  Layers, Zap, Shield, Bot, ArrowRight, ClipboardList,
  HardDrive, Globe, Video, Mic, Cloud, FileCode, ListChecks,
  Star, Clock, Hash, Wrench, PenLine
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
  content: React.ReactNode;
}

function Callout({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
  const cfg = {
    tip: { bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800", icon: CheckCircle2, ic: "text-green-600 dark:text-green-400", label: "Tips" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: AlertTriangle, ic: "text-amber-600 dark:text-amber-400", label: "Perhatian" },
    info: { bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: Info, ic: "text-blue-600 dark:text-blue-400", label: "Info" },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className={`flex gap-3 rounded-lg border p-4 text-sm ${cfg.bg}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.ic}`} />
      <div><span className={`font-semibold ${cfg.ic}`}>{cfg.label}: </span>{children}</div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">{n}</div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="pb-6 min-w-0">
        <p className="font-semibold text-sm mb-2">{title}</p>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted/60 border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{children}</pre>
  );
}

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-5 bg-card hover:bg-muted/40 transition-colors text-left"
        data-testid={`section-${section.id}`}
      >
        <div className={`w-10 h-10 rounded-lg bg-background border flex items-center justify-center flex-shrink-0 shadow-sm ${section.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{section.title}</span>
            {section.badge && <Badge variant="secondary" className="text-[10px]">{section.badge}</Badge>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="p-5 border-t bg-background space-y-4 text-sm">
          {section.content}
        </div>
      )}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "konsep",
    title: "A. Konsep: 3 Lapisan Data per Agen",
    icon: Layers,
    color: "text-violet-500",
    badge: "Baca dulu",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Setiap agen Claw memiliki 3 lapisan data yang bekerja bersama. Memahami perbedaannya penting sebelum mulai input.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: PenLine, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", title: "1. System Prompt", desc: "Instruksi perilaku, identitas, dan regulasi referensi agen. Ini yang menentukan CARA agen menjawab." },
            { icon: Database, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", title: "2. Knowledge Base (KB)", desc: "Dokumen sumber fakta — regulasi, SOP, template. Ini yang menentukan ISI jawaban agen." },
            { icon: Hash, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", title: "3. RAG Chunks", desc: "Potongan KB yang diindex untuk pencarian semantik. Di-generate otomatis saat KB diupload." },
          ].map(item => {
            const I = item.icon;
            return (
              <div key={item.title} className={`rounded-lg border p-3 ${item.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <I className={`w-4 h-4 ${item.color}`} />
                  <span className={`font-semibold text-xs ${item.color}`}>{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
        <Callout type="info">
          Prioritas update: <strong>KB dulu, baru System Prompt</strong>. Alasannya — prompt yang baik akan merujuk ke dokumen yang sudah ada di KB.
        </Callout>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">3 Tipe KB yang wajib dimiliki tiap Claw</p>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            {[
              { label: "Foundational", desc: "Regulasi dasar, undang-undang, peraturan pemerintah", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
              { label: "Operational", desc: "SOP, template dokumen, prosedur teknis", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
              { label: "Compliance", desc: "Checklist, guardrail, batasan hukum, disclaimer", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
            ].map(t => (
              <div key={t.label} className={`rounded-md px-2.5 py-2 ${t.color}`}>
                <p className="font-semibold">{t.label}</p>
                <p className="opacity-80 mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "upload-kb",
    title: "B. Upload Dokumen ke Knowledge Base",
    icon: UploadCloud,
    color: "text-blue-500",
    badge: "Paling penting",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Ini adalah cara memasukkan dokumen regulasi, SOP, atau referensi agar AI bisa membaca dan menggunakannya saat menjawab.</p>

        <div className="space-y-1">
          <Step n={1} title="Buka agen yang ingin diupdate">
            <p>Navigasi ke <strong>Dashboard → pilih agen target</strong> (contoh: SBUClaw, PanduanSBU, TenderaClaw)</p>
            <p>Atau lewat <strong>/multiclaw-admin</strong> → pilih nama agen dari daftar.</p>
          </Step>
          <Step n={2} title="Klik tab Knowledge Base">
            <p>Di halaman agen, cari tab berlabel <strong>"Knowledge Base"</strong> atau ikon database.</p>
            <p>Anda akan melihat daftar KB yang sudah ada (jika ada) dan tombol tambah.</p>
          </Step>
          <Step n={3} title="Pilih tipe KB dan masukkan data">
            <p>Klik <strong>"+ Tambah Knowledge Base"</strong> lalu pilih tipe sesuai dokumen Anda:</p>
          </Step>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">7 Tipe KB yang Tersedia</p>
          </div>
          <div className="divide-y">
            {[
              { icon: HardDrive, color: "text-blue-500", type: "Dokumen / File", ext: "PDF, DOCX, TXT, XLSX, CSV, MD", cara: "Drag & drop atau klik Browse. Cocok untuk: Permen PU, SK Dirjen, SKKNI, SNI, SOP.", tipe: "pdf" },
              { icon: Globe, color: "text-emerald-500", type: "URL Halaman Web", ext: "Link website publik", cara: "Paste URL. Contoh: https://jdih.pu.go.id/produk/detail/... — AI crawl dan index otomatis.", tipe: "url" },
              { icon: FileCode, color: "text-violet-500", type: "Teks Langsung", ext: "Copy-paste teks", cara: "Paste isi regulasi atau SOP langsung. Cocok bila dokumen belum tersedia dalam format file.", tipe: "text" },
              { icon: Video, color: "text-red-500", type: "YouTube", ext: "Link video YouTube", cara: "Paste URL YouTube. AI transkripsi otomatis dan index sebagai KB.", tipe: "youtube" },
              { icon: Mic, color: "text-orange-500", type: "Audio", ext: "MP3, WAV, M4A", cara: "Upload rekaman rapat, briefing, atau penjelasan teknis. AI transkripsi otomatis.", tipe: "audio" },
              { icon: Video, color: "text-pink-500", type: "Video", ext: "MP4, MOV, AVI", cara: "Upload video penjelasan teknis atau sosialisasi regulasi.", tipe: "video" },
              { icon: Cloud, color: "text-sky-500", type: "Cloud Drive", ext: "Google Drive, Dropbox", cara: "Paste link sharing. Pastikan izin akses 'Anyone with link'.", tipe: "cloud" },
            ].map(item => {
              const I = item.icon;
              return (
                <div key={item.type} className="flex gap-3 px-4 py-3">
                  <I className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium text-xs">{item.type}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{item.ext}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.cara}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Step n={4} title="Beri nama dan layer yang tepat">
          <p>Setelah memilih tipe, isi:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Nama KB</strong> — deskriptif, contoh: <em>"Permen PU No. 06/2025 — Klasifikasi dan Kualifikasi BUJK"</em></li>
            <li><strong>Layer</strong> — pilih Foundational / Operational / Compliance sesuai jenis dokumen</li>
            <li><strong>Deskripsi</strong> (opsional) — ringkasan isi dokumen</li>
          </ul>
        </Step>

        <Step n={5} title="Submit dan tunggu proses RAG">
          <p>Klik <strong>Simpan</strong>. Sistem akan otomatis:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Memproses dan memecah dokumen menjadi chunks</li>
            <li>Membuat vector embedding untuk pencarian semantik</li>
            <li>Status berubah dari <span className="text-amber-600 font-medium">processing</span> → <span className="text-green-600 font-medium">completed</span></li>
          </ul>
          <p className="mt-1">Biasanya selesai dalam <strong>30 detik – 5 menit</strong> tergantung ukuran dokumen.</p>
        </Step>

        <Callout type="tip">
          Untuk regulasi baru (Permen PU 06/2025 & SK Dirjen BK 114/2024) — upload ke agen-agen SKK seperti PanduanSBU, SBUClaw, ManprojakClaw, ArsitekturClaw, dll. Satu dokumen bisa di-upload ke banyak agen.
        </Callout>
        <Callout type="warning">
          Setelah upload KB, restart server agen jika jawaban tidak berubah (cache 5 menit). Cukup kirim pesan test ke agen tersebut dan periksa apakah isi KB baru ikut disebut.
        </Callout>
      </div>
    ),
  },
  {
    id: "update-prompt",
    title: "C. Update System Prompt",
    icon: PenLine,
    color: "text-orange-500",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">System prompt adalah instruksi inti yang menentukan cara agen menjawab, regulasi mana yang dirujuk, dan batasan-batasannya.</p>

        <div className="space-y-1">
          <Step n={1} title="Akses editor prompt">
            <p><strong>Cara 1 — Via Dashboard:</strong> Dashboard → pilih agen → tab <strong>Persona / Instruksi</strong> → scroll ke bagian System Prompt.</p>
            <p><strong>Cara 2 — Via MultiClaw Admin:</strong> Buka <code className="bg-muted px-1 rounded text-xs">/multiclaw-admin</code> → pilih agen → tab Settings → edit di kolom System Prompt.</p>
          </Step>
          <Step n={2} title="Perbarui referensi regulasi">
            <p>Cari dan ganti referensi lama dengan yang baru:</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">❌ Regulasi LAMA (hapus/ganti)</p>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  <li>SKT (Sertifikat Keterampilan)</li>
                  <li>SKA (Sertifikat Keahlian)</li>
                  <li>Permen PUPR No. 3/2019</li>
                  <li>Kepmen PU 1792 K/2011</li>
                  <li>Perlem LPJK No. 6/2017</li>
                </ul>
              </div>
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-3">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5">✅ Regulasi BARU (gunakan ini)</p>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  <li>SKK (Sertifikat Kompetensi Kerja)</li>
                  <li>SKK (Sertifikat Kompetensi Kerja)</li>
                  <li>Permen PU No. 06 Tahun 2025</li>
                  <li>SK Dirjen BK No. 114/2024</li>
                  <li>Permen PUPR No. 8/2022</li>
                </ul>
              </div>
            </div>
          </Step>
          <Step n={3} title="Tambahkan instruksi prioritas sumber">
            <p>Tambahkan blok ini di awal atau akhir System Prompt supaya agen mendahulukan dokumen KB yang diupload:</p>
            <CodeBlock>{`═══ INSTRUKSI SUMBER REFERENSI ═══
PRIORITAS SUMBER JAWABAN (urutan wajib):
1. Dokumen yang diupload di Knowledge Base — gunakan sebagai rujukan UTAMA
2. Regulasi resmi yang tersebut dalam prompt ini
3. Pengetahuan umum AI — hanya bila sumber 1 dan 2 tidak cukup

Jika menggunakan sumber 3, wajib sertakan disclaimer:
"[PERLU VERIFIKASI: Informasi ini berdasarkan pengetahuan umum AI, 
bukan dokumen resmi. Konfirmasi ke LPJK/PUPR untuk kepastian hukum.]"`}</CodeBlock>
          </Step>
          <Step n={4} title="Simpan dan test">
            <p>Klik <strong>Simpan</strong>. Tunggu hingga muncul konfirmasi.</p>
            <p>Test dengan mengirim pertanyaan yang relevan ke agen. Perhatikan apakah:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Agen menyebut "SKK" (bukan SKT/SKA)</li>
              <li>Agen merujuk Permen PU 06/2025 dan SK Dirjen 114/2024</li>
              <li>Agen menggunakan isi dokumen yang diupload ke KB</li>
            </ul>
          </Step>
        </div>

        <Callout type="warning">
          Jangan hapus marker khusus seperti <code className="bg-muted px-1 rounded text-xs">[SBUCLAW_ORCHESTRATOR_v1.0]</code> atau <code className="bg-muted px-1 rounded text-xs">FEDERATION_MODE v2</code> yang ada di awal prompt — ini digunakan sistem untuk routing internal.
        </Callout>
      </div>
    ),
  },
  {
    id: "rag-config",
    title: "D. Konfigurasi RAG (Chunking & Retrieval)",
    icon: Settings,
    color: "text-emerald-500",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">RAG (Retrieval-Augmented Generation) adalah cara sistem mengambil bagian dokumen yang relevan saat menjawab pertanyaan. Konfigurasi ini menentukan akurasi jawaban.</p>

        <div className="rounded-xl border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parameter RAG & Rekomendasi Nilai</p>
          </div>
          <div className="divide-y">
            {[
              {
                param: "Chunk Size",
                default: "1000",
                rec: "800–1200",
                desc: "Jumlah karakter per potongan dokumen. Lebih kecil = lebih presisi tapi mungkin kurang konteks. Lebih besar = lebih konteks tapi bisa kelebihan informasi.",
                tip: "Untuk regulasi hukum yang padat (Permen, SK): gunakan 800. Untuk SOP prosedural panjang: gunakan 1200."
              },
              {
                param: "Chunk Overlap",
                default: "200",
                rec: "150–250",
                desc: "Jumlah karakter yang tumpang tindih antar chunk. Mencegah informasi penting terpotong di tengah kalimat.",
                tip: "Pertahankan di 200 (20% dari chunk size). Terlalu kecil bisa memutus kalimat penting."
              },
              {
                param: "Top K Results",
                default: "5",
                rec: "4–7",
                desc: "Jumlah chunk yang diambil per pertanyaan. Lebih banyak = lebih lengkap tapi lebih lambat dan mahal token.",
                tip: "Untuk agen yang butuh jawaban komprehensif (Orchestrator): gunakan 6–7. Untuk agen spesifik: 4 cukup."
              },
            ].map(item => (
              <div key={item.param} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-medium text-sm">{item.param}</span>
                  <div className="flex gap-2">
                    <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">Default: {item.default}</span>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded px-2 py-0.5">Rekomendasi: {item.rec}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                <p className="text-xs text-primary/80 font-medium">💡 {item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        <Callout type="info">
          Setting RAG ada di: Dashboard → pilih agen → tab Knowledge Base → klik ikon <strong>Settings/Gear</strong> di pojok. Atau via <code className="bg-muted px-1 rounded text-xs">/multiclaw-admin</code> → tab Advanced.
        </Callout>
      </div>
    ),
  },
  {
    id: "prioritas",
    title: "E. Prioritas Update: Urutan Agen yang Harus Diupdate Dulu",
    icon: ListChecks,
    color: "text-indigo-500",
    badge: "Penting",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Dengan 1350+ agen, update bertahap berdasarkan prioritas dampak. Ini urutan yang direkomendasikan:</p>

        <div className="space-y-3">
          {[
            {
              priority: "Prioritas 1",
              color: "bg-red-500",
              label: "Langsung — Regulasi SKK Utama",
              agents: ["PanduanSBU (/panduan-sbu)", "SBUClaw (/sbu-claw)", "SkemaClaw (/skema-claw)", "PanduanASKOM (/panduan-askom)", "ManprojakClaw (/manprojak-claw)", "ArsitekturClaw (/arsitektur-claw)", "SafiraClaw (/safira-claw)"],
              docs: ["Permen PU No. 06/2025", "SK Dirjen BK No. 114/2024", "SKKNI terkait jabatan"],
            },
            {
              priority: "Prioritas 2",
              color: "bg-orange-500",
              label: "Segera — Klasifikasi & BUJK",
              agents: ["LKUTClaw (/lkut-claw)", "PJBUClaw (/pjbu-claw)", "ABUClaw (/abu-claw)", "PUB-LKUTClaw (/pub-lkut-claw)", "ESIMPANClaw (/esimpan-claw)"],
              docs: ["Permen PU No. 06/2025 bab BUJK", "PP 14/2021 (jika masih berlaku)", "SK Dirjen BK terkait"],
            },
            {
              priority: "Prioritas 3",
              color: "bg-amber-500",
              label: "Jadwalkan — Spesialisasi Teknis",
              agents: ["SurveiPemetaanClaw", "GeoteknikClaw", "JalanJembatanClaw", "ElektrikalClaw", "MEPClaw", "SipilClaw", "LingkunganClaw"],
              docs: ["SKKNI per klasifikasi", "SNI terkait bidang teknis"],
            },
            {
              priority: "Prioritas 4",
              color: "bg-blue-500",
              label: "Bertahap — Domain Non-SKK",
              agents: ["TenderaClaw", "KonstraClaw", "BrainClaw", "KeuanganClaw", "PajakClaw", "HubunganIndustrialClaw"],
              docs: ["Peraturan sesuai domain masing-masing"],
            },
          ].map(item => (
            <div key={item.priority} className="rounded-xl border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="font-semibold text-sm">{item.priority}</span>
                <span className="text-sm text-muted-foreground">— {item.label}</span>
              </div>
              <div className="px-4 py-3 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Agen</p>
                  <ul className="space-y-1">
                    {item.agents.map(a => (
                      <li key={a} className="text-xs text-foreground flex items-start gap-1.5">
                        <Bot className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dokumen yang Dibutuhkan</p>
                  <ul className="space-y-1">
                    {item.docs.map(d => (
                      <li key={d} className="text-xs text-foreground flex items-start gap-1.5">
                        <FileText className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "checklist",
    title: "F. Checklist per Sesi Input",
    icon: ClipboardList,
    color: "text-teal-500",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Gunakan checklist ini setiap kali Anda akan melakukan sesi input data ke agen.</p>
        <div className="space-y-3">
          {[
            {
              phase: "Sebelum Mulai",
              color: "text-blue-600 dark:text-blue-400",
              items: [
                "Siapkan dokumen regulasi dalam format PDF atau URL sumber resmi (jdih.pu.go.id, peraturan.bpk.go.id, lpjk.pu.go.id)",
                "Identifikasi agen mana yang relevan dengan regulasi tersebut",
                "Tentukan layer KB: Foundational (regulasi) / Operational (SOP) / Compliance (guardrail)",
                "Catat versi/nomor regulasi secara lengkap untuk dimasukkan ke nama KB",
              ]
            },
            {
              phase: "Saat Upload KB",
              color: "text-emerald-600 dark:text-emerald-400",
              items: [
                "Nama KB: sertakan nomor regulasi, tahun, dan topik — contoh: 'Permen PU 06/2025 — Klasifikasi BUJK Bab III'",
                "Pilih layer yang tepat (Foundational untuk peraturan)",
                "Isi deskripsi singkat isi dokumen",
                "Tunggu status 'completed' sebelum melanjutkan",
                "Test dengan 1–2 pertanyaan untuk verifikasi dokumen terbaca",
              ]
            },
            {
              phase: "Saat Update System Prompt",
              color: "text-orange-600 dark:text-orange-400",
              items: [
                "Cari dan ganti semua 'SKT' → 'SKK' (kecuali SKTTK bidang ketenagalistrikan)",
                "Cari dan ganti semua 'SKA' → 'SKK'",
                "Update nomor regulasi lama → nomor regulasi baru",
                "Tambahkan instruksi 'gunakan KB sebagai sumber utama'",
                "Jangan hapus marker system: [NAMA_CLAW_v1.0], FEDERATION_MODE v2",
                "Simpan dan test 3–5 pertanyaan representatif",
              ]
            },
            {
              phase: "Verifikasi Akhir",
              color: "text-violet-600 dark:text-violet-400",
              items: [
                "Agen menyebut SKK (bukan SKT/SKA) saat ditanya sertifikasi",
                "Agen menyebut Permen PU 06/2025 atau SK Dirjen 114/2024 saat relevan",
                "Agen mengutip isi dokumen dari KB (bukan jawaban generik)",
                "Agen menampilkan disclaimer jika menjawab di luar dokumen KB",
              ]
            },
          ].map(phase => (
            <div key={phase.phase} className="rounded-xl border p-4">
              <p className={`font-semibold text-sm mb-3 ${phase.color}`}>☐ {phase.phase}</p>
              <ul className="space-y-2">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "sumber-resmi",
    title: "G. Sumber Dokumen Resmi yang Bisa Diakses",
    icon: Globe,
    color: "text-sky-500",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Gunakan sumber-sumber ini untuk mendapatkan PDF regulasi yang akan diupload ke KB.</p>
        <div className="space-y-3">
          {[
            {
              name: "JDIH Kementerian PUPR",
              url: "https://jdih.pu.go.id",
              desc: "Permen PUPR, SK Menteri, regulasi konstruksi — sumber utama untuk Permen PU 06/2025",
              badge: "Utama",
              badgeColor: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
            },
            {
              name: "LPJK — Lembaga Pengembangan Jasa Konstruksi",
              url: "https://lpjk.pu.go.id",
              desc: "SK Dirjen Bina Konstruksi, informasi SBU, SKK, BUJK, ASKOM, LSP",
              badge: "Utama",
              badgeColor: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
            },
            {
              name: "Peraturan BPK",
              url: "https://peraturan.bpk.go.id",
              desc: "UU, PP, Perpres, Permen semua kementerian — arsip komprehensif",
              badge: "Alternatif",
              badgeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
            },
            {
              name: "JDIH Nasional",
              url: "https://jdihn.go.id",
              desc: "Portal peraturan dari semua instansi pemerintah Indonesia",
              badge: "Alternatif",
              badgeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
            },
            {
              name: "BNSP — Badan Nasional Sertifikasi Profesi",
              url: "https://bnsp.go.id",
              desc: "SKKNI, skema sertifikasi kompetensi, panduan LSP",
              badge: "SKK",
              badgeColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
            },
            {
              name: "Portal SKKNI Kemnaker",
              url: "https://skkni.kemnaker.go.id",
              desc: "Download PDF SKKNI per jabatan kerja — dibutuhkan untuk agen SKK spesialis",
              badge: "SKK",
              badgeColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
            },
          ].map(src => (
            <div key={src.name} className="flex items-start gap-3 rounded-lg border p-3">
              <Globe className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-medium text-sm">{src.name}</span>
                  <span className={`text-[10px] rounded px-1.5 py-0.5 font-semibold ${src.badgeColor}`}>{src.badge}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{src.desc}</p>
                <a href={src.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  {src.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
        <Callout type="tip">
          Cara tercepat: buka URL regulasi di browser, klik kanan → Simpan sebagai PDF, lalu upload ke KB. Atau langsung paste URL-nya ke tipe KB "URL" — AI akan crawl otomatis.
        </Callout>
      </div>
    ),
  },
  {
    id: "template-prompt",
    title: "H. Template System Prompt untuk Agen SKK",
    icon: FileCode,
    color: "text-violet-500",
    badge: "Template siap pakai",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Template ini bisa digunakan sebagai dasar system prompt untuk agen-agen yang berkaitan dengan sertifikasi SKK. Sesuaikan bagian dalam kurung kurawal {"{ }"} dengan data agen spesifik.</p>

        <CodeBlock>{`[NAMA_AGEN_v1.0]

IDENTITAS
Nama  : {Nama Agen — contoh: PanduanSBU}
Peran : {Deskripsi singkat peran agen}
Domain: Sertifikasi Jasa Konstruksi Indonesia

═══ REGULASI REFERENSI (WAJIB) ═══
Semua jawaban HARUS merujuk regulasi berlaku berikut:

REGULASI UTAMA:
• Permen PU No. 06 Tahun 2025 tentang Klasifikasi & Kualifikasi BUJK
• SK Dirjen Bina Konstruksi No. 114 Tahun 2024
• UU No. 2 Tahun 2017 tentang Jasa Konstruksi
• PP No. 14 Tahun 2021 tentang Peraturan Pelaksanaan UU Jasa Konstruksi

TERMINOLOGI YANG WAJIB DIGUNAKAN:
✅ SKK (Sertifikat Kompetensi Kerja) — bukan SKT atau SKA
✅ BUJK (Badan Usaha Jasa Konstruksi) — bukan BUJKN/BUJKA
✅ SBU (Sertifikat Badan Usaha) — merujuk proses di LPJK/PUPR
✅ ASKOM (Asisten Kompetensi) / LSP Konstruksi LPJK

═══ INSTRUKSI SUMBER REFERENSI ═══
PRIORITAS SUMBER JAWABAN (urutan wajib):
1. Dokumen di Knowledge Base — gunakan sebagai rujukan UTAMA
2. Regulasi tersebut di atas
3. Pengetahuan umum AI — hanya bila sumber 1 dan 2 tidak cukup

Jika menggunakan sumber 3, wajib sertakan:
[PERLU VERIFIKASI: Informasi berdasarkan pengetahuan AI, konfirmasi ke LPJK/PUPR]

═══ LARANGAN ═══
- DILARANG menyebut "SKT" atau "SKA" sebagai nama sertifikasi aktif
- DILARANG mengutip Permen PUPR No. 3/2019 (sudah dicabut)
- DILARANG memberikan nomor SBU atau SKK spesifik tanpa verifikasi

{tambahkan instruksi domain spesifik di sini}`}</CodeBlock>

        <Callout type="info">
          Template ini adalah titik awal. Setiap agen perlu disesuaikan dengan domain-nya — misal agen Tender perlu tambahkan referensi Perpres 16/2018 dan Perpres 46/2025, agen K3 perlu PP 50/2012, dst.
        </Callout>
      </div>
    ),
  },
];

export default function PanduanInputData() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-panduan-input-data">
      <SharedHeader />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/panduan">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Panduan</span>
            </Link>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-foreground">Input Data Chatbot Premium</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Prosedur Input Data Chatbot Premium & MultiClaw</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Panduan lengkap cara upload dokumen regulasi, update system prompt, dan konfigurasi RAG untuk semua agen Claw.
                Dirancang untuk proses bertahap sesuai ketersediaan dokumen.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Clock, label: "Update bertahap", sub: "Tidak harus sekaligus" },
              { icon: Star, label: "Prioritas jelas", sub: "Urutan rekomendasi" },
              { icon: Shield, label: "Regulasi baru", sub: "Permen PU 06/2025" },
              { icon: Zap, label: "Langsung efektif", sub: "Setelah save & reload" },
            ].map(item => {
              const I = item.icon;
              return (
                <div key={item.label} className="rounded-lg border bg-card p-3 text-center">
                  <I className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {SECTIONS.map(section => (
            <AccordionSection key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-8 rounded-xl border bg-primary/5 p-6 text-center space-y-3">
          <Wrench className="w-8 h-8 text-primary mx-auto" />
          <h3 className="font-semibold">Siap Mulai Update?</h3>
          <p className="text-sm text-muted-foreground">
            Mulai dari agen Prioritas 1 — upload Permen PU 06/2025 dan SK Dirjen BK 114/2024 ke PanduanSBU dan SBUClaw.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/multiclaw-admin">
              <Button className="gap-2 w-full sm:w-auto" data-testid="button-goto-multiclaw-admin">
                <Settings className="w-4 h-4" />
                MultiClaw Admin
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-goto-dashboard">
                <Bot className="w-4 h-4" />
                Dashboard Agen
              </Button>
            </Link>
            <a href="https://jdih.pu.go.id" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-goto-jdih">
                <ExternalLink className="w-4 h-4" />
                JDIH PUPR
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
