import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { PremiumPageGuard } from "@/components/premium-page-guard";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, MessageSquare, CheckSquare, Trash2,
  AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight,
  Send, Loader2, FileSearch, Lock, Sparkles, RotateCcw,
  ListChecks, BookOpen, ShieldAlert, Lightbulb, Download, Package,
  Scale, Copy, RefreshCw, TrendingUp,
} from "lucide-react";

interface RegulasiNote {
  status_regulasi: string;
  ringkasan_satu_kalimat: string;
  regulasi_berlaku: { nama: string; nomor: string; relevansi: string }[];
  perubahan_kritis: { aspek: string; perubahan: string; dampak_ke_dokumen: string; urgensi: "tinggi" | "sedang" | "rendah" }[];
  risiko_ketidakpatuhan: string[];
  rekomendasi_tindak_lanjut: string[];
  catatan_konsultan: string;
  generated_at: string;
}

interface DocAnalysis {
  id: number;
  original_name: string;
  doc_type: string;
  status: "pending" | "analyzing" | "done" | "error";
  summary: string | null;
  checklist: ChecklistCategory[] | null;
  chat_history: ChatMessage[] | null;
  regulasi_note: RegulasiNote | null;
  file_size: number;
  error_msg: string | null;
  created_at: string;
}

interface ChecklistCategory {
  kategori: string;
  items: { item: string; status: "ada" | "tidak_ada" | "perlu_dicek"; catatan?: string }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── KTK PDF Generator ─────────────────────────────────────────────────────────
function computeTrafficLight(checklist: ChecklistCategory[]) {
  let ada = 0, tidakAda = 0, perluDicek = 0;
  checklist.forEach(cat => cat.items?.forEach(item => {
    if (item.status === "ada") ada++;
    else if (item.status === "tidak_ada") tidakAda++;
    else perluDicek++;
  }));
  const total = ada + tidakAda + perluDicek;
  const score = total > 0 ? Math.round(((ada + perluDicek * 0.5) / total) * 100) : 0;
  const color = tidakAda > 0 ? "red" : perluDicek > 0 ? "yellow" : "green";
  const label = tidakAda > 0 ? "🔴 Perlu Perbaikan Segera" : perluDicek > 0 ? "🟡 Ada Catatan Minor" : "🟢 Siap Diajukan";
  return { ada, tidakAda, perluDicek, score, color, label };
}

function getActionItems(checklist: ChecklistCategory[]) {
  const actions: { kategori: string; item: string; status: string; catatan?: string }[] = [];
  checklist.forEach(cat => cat.items?.forEach(item => {
    if (item.status !== "ada") {
      actions.push({ kategori: cat.kategori, item: item.item, status: item.status, catatan: item.catatan });
    }
  }));
  return actions;
}

function generateKTKHTML(doc: DocAnalysis, bureauName: string) {
  const checklist = Array.isArray(doc.checklist) ? doc.checklist : [];
  const tl = computeTrafficLight(checklist);
  const actions = getActionItems(checklist);
  let meta: { key_points?: string[]; risiko?: string[]; rekomendasi?: string[] } = {};
  try { meta = doc.error_msg ? JSON.parse(doc.error_msg) : {}; } catch {}
  const docTypeLabel = DOC_TYPE_LABELS[doc.doc_type]?.label ?? "Dokumen";
  const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const tlBg = tl.color === "red" ? "#FEE2E2" : tl.color === "yellow" ? "#FEF9C3" : "#DCFCE7";
  const tlBorder = tl.color === "red" ? "#EF4444" : tl.color === "yellow" ? "#EAB308" : "#22C55E";

  const actionRows = actions.map((a, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${a.item}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;color:${a.status === "tidak_ada" ? "#dc2626" : "#d97706"}">${a.status === "tidak_ada" ? "Tidak Ada" : "Perlu Dicek"}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${a.catatan ?? "-"}</td>
    </tr>`).join("");

  const risikoRows = (meta.risiko ?? []).map(r => `<li style="margin:4px 0;font-size:13px;">⚠️ ${r}</li>`).join("");
  const rekomenRows = (meta.rekomendasi ?? []).map(r => `<li style="margin:4px 0;font-size:13px;">→ ${r}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Knowledge Transfer Kit — ${doc.original_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, Arial, sans-serif; color: #111827; background: #fff; padding: 40px; max-width: 820px; margin: 0 auto; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
    @page { margin: 20mm 15mm; size: A4; }
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 24px; }
  .logo-area h1 { font-size: 20px; font-weight: 700; color: #1d4ed8; }
  .logo-area p { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .kit-title { text-align: right; }
  .kit-title .badge { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 4px; }
  .kit-title h2 { font-size: 15px; font-weight: 700; color: #111827; }
  .kit-title p { font-size: 12px; color: #6b7280; }
  .tl-box { border: 2px solid ${tlBorder}; background: ${tlBg}; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
  .tl-label { font-size: 22px; font-weight: 700; }
  .tl-score { text-align: right; }
  .tl-score .score { font-size: 36px; font-weight: 700; color: ${tlBorder}; }
  .tl-score .score-sub { font-size: 12px; color: #6b7280; }
  .tl-stats { display: flex; gap: 16px; margin-top: 8px; }
  .tl-stat { font-size: 12px; }
  section { margin-bottom: 24px; }
  section h3 { font-size: 14px; font-weight: 700; color: #1d4ed8; border-left: 4px solid #1d4ed8; padding-left: 10px; margin-bottom: 12px; }
  .summary-text { font-size: 13px; line-height: 1.7; color: #374151; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1d4ed8; color: #fff; padding: 8px 12px; font-size: 12px; text-align: left; border: 1px solid #1e40af; }
  .footer { border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 32px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af; }
  .footer strong { color: #374151; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1d4ed8; color: #fff; border: none; border-radius: 10px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(29,78,216,0.4); }
</style>
</head>
<body>
<div class="header">
  <div class="logo-area">
    <h1>${bureauName || "Biro Jasa Anda"}</h1>
    <p>Dokumen Analisis Profesional</p>
  </div>
  <div class="kit-title">
    <span class="badge">📦 Knowledge Transfer Kit</span>
    <h2>${docTypeLabel}</h2>
    <p>${tanggal}</p>
  </div>
</div>

<div class="tl-box">
  <div>
    <div class="tl-label">${tl.label}</div>
    <div class="tl-stats">
      <span class="tl-stat">✅ Terpenuhi: <strong>${tl.ada}</strong></span>
      <span class="tl-stat">🟡 Perlu Dicek: <strong>${tl.perluDicek}</strong></span>
      <span class="tl-stat">❌ Tidak Ada: <strong>${tl.tidakAda}</strong></span>
    </div>
    <div style="font-size:12px;color:#6b7280;margin-top:6px;">Dokumen: ${doc.original_name}</div>
  </div>
  <div class="tl-score">
    <div class="score">${tl.score}%</div>
    <div class="score-sub">Tingkat Kesiapan</div>
  </div>
</div>

${doc.summary ? `
<section>
  <h3>📋 Ringkasan Eksekutif</h3>
  <p class="summary-text">${doc.summary.substring(0, 800)}${doc.summary.length > 800 ? "…" : ""}</p>
</section>` : ""}

${(meta.risiko ?? []).length > 0 ? `
<section>
  <h3>⚠️ Catatan Risiko & Regulasi Terbaru</h3>
  <ul style="padding-left:8px;list-style:none;">${risikoRows}</ul>
</section>` : ""}

${actions.length > 0 ? `
<section>
  <h3>✅ Action Plan — Langkah yang Perlu Dilakukan Klien</h3>
  <table>
    <tr>
      <th style="width:40px">#</th>
      <th>Item Dokumen</th>
      <th style="width:110px">Status</th>
      <th>Catatan</th>
    </tr>
    ${actionRows}
  </table>
</section>` : `
<section>
  <h3>✅ Action Plan</h3>
  <p style="font-size:13px;color:#16a34a;">Semua item terpenuhi — dokumen siap untuk diajukan.</p>
</section>`}

${(meta.rekomendasi ?? []).length > 0 ? `
<section>
  <h3>💡 Rekomendasi Tindak Lanjut</h3>
  <ul style="padding-left:8px;list-style:none;">${rekomenRows}</ul>
</section>` : ""}

<div class="footer">
  <div>Dibuat oleh: <strong>${bureauName || "Biro Jasa Anda"}</strong></div>
  <div>Didukung teknologi <strong>Gustafta AI</strong> &nbsp;|&nbsp; gustafta.com</div>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Simpan / Cetak PDF</button>
</body>
</html>`;
}

function KTKExportModal({ doc, onClose }: { doc: DocAnalysis; onClose: () => void }) {
  const [bureauName, setBureauName] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setGenerating(true);
    try {
      const html = generateKTKHTML(doc, bureauName);
      const win = window.open("", "_blank");
      if (!win) {
        toast({ title: "Popup diblokir", description: "Izinkan popup di browser Anda lalu coba lagi.", variant: "destructive" });
        return;
      }
      win.document.write(html);
      win.document.close();
      onClose();
    } catch (e) {
      toast({ title: "Gagal membuat KTK", description: "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Generate Knowledge Transfer Kit
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">
          KTK adalah PDF ringkasan siap kirim ke klien — berisi status kesiapan, risiko, dan action plan dalam bahasa yang mudah dipahami.
        </p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nama Biro Jasa / Konsultan Anda</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Contoh: CV Maju Konsultan Konstruksi"
            value={bureauName}
            onChange={e => setBureauName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleGenerate(); }}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Akan tercetak di header dan footer PDF.</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground border border-border/50">
          <p className="font-semibold text-foreground text-sm">PDF akan berisi:</p>
          <p>🟢🟡🔴 Status kesiapan dokumen (traffic light)</p>
          <p>📋 Ringkasan eksekutif singkat</p>
          <p>⚠️ Catatan risiko & regulasi relevan</p>
          <p>✅ Action plan langkah-langkah yang perlu klien lakukan</p>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Generate PDF
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ── Regulatory Impact Note Component ─────────────────────────────────────────
function DocRegulasiNote({ doc, isPremium }: { doc: DocAnalysis; isPremium: boolean }) {
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState<RegulasiNote | null>(doc.regulasi_note ?? null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generate = async () => {
    if (!isPremium) {
      toast({ title: "Fitur Premium", description: "Regulatory Impact Note tersedia di paket Starter ke atas.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const r = await fetch(`/api/bedah-dokumen/${doc.id}/regulasi-note`, { method: "POST", credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Gagal generate");
      setNote(data);
      queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen", doc.id] });
      toast({ title: "Regulatory Impact Note siap!" });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!note) return;
    const text = `📋 REGULATORY IMPACT NOTE
${note.status_regulasi}
📄 Dokumen: ${doc.original_name}
📅 Tanggal: ${note.generated_at}

${note.ringkasan_satu_kalimat}

⚖️ REGULASI BERLAKU:
${note.regulasi_berlaku.map(r => `• ${r.nama} (${r.nomor}) — ${r.relevansi}`).join("\n")}

⚠️ PERUBAHAN KRITIS:
${note.perubahan_kritis.map(p => `• ${p.aspek}: ${p.perubahan}\n  Dampak: ${p.dampak_ke_dokumen}`).join("\n")}

✅ REKOMENDASI:
${note.rekomendasi_tindak_lanjut.map((r, i) => `${i + 1}. ${r}`).join("\n")}

💬 CATATAN KONSULTAN:
${note.catatan_konsultan}

—
Dibuat oleh Gustafta AI | gustafta.my.id`;
    navigator.clipboard.writeText(text);
    toast({ title: "Disalin!", description: "Siap di-paste ke WhatsApp klien." });
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Scale className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <p className="font-semibold">Regulatory Impact Note — Paket Starter</p>
          <p className="text-sm text-muted-foreground mt-1">Catatan dampak regulasi terkini siap forward ke klien.</p>
        </div>
        <a href="/onboarding"><Button size="sm" className="gap-2"><Sparkles className="h-3.5 w-3.5" />Upgrade Sekarang</Button></a>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Scale className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <p className="font-semibold">Regulatory Impact Note</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">AI akan analisis regulasi terkini yang berlaku untuk dokumen ini dan dampaknya — siap di-forward ke klien.</p>
        </div>
        <Button onClick={generate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
          {generating ? "Menganalisis regulasi…" : "Generate Regulatory Impact Note"}
        </Button>
        {generating && (
          <p className="text-xs text-muted-foreground animate-pulse">AI sedang memeriksa regulasi terkini yang relevan…</p>
        )}
      </div>
    );
  }

  const urgensiColor = { tinggi: "text-red-600 bg-red-500/10 border-red-500/20", sedang: "text-amber-600 bg-amber-500/10 border-amber-500/20", rendah: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" };

  return (
    <div className="space-y-5">
      {/* Status + Actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-lg font-bold">{note.status_regulasi}</p>
          <p className="text-sm text-muted-foreground">{note.ringkasan_satu_kalimat}</p>
          <p className="text-xs text-muted-foreground">Dianalisis: {note.generated_at}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={copyToClipboard}>
            <Copy className="h-3.5 w-3.5" />Salin ke WA
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Perbarui
          </Button>
        </div>
      </div>

      {/* Regulasi berlaku */}
      {note.regulasi_berlaku?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Scale className="h-4 w-4 text-blue-500" />Regulasi Yang Berlaku</h3>
          <div className="space-y-2">
            {note.regulasi_berlaku.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-blue-600 shrink-0 mt-0.5">{r.nomor}</span>
                  <div>
                    <p className="text-sm font-medium">{r.nama}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.relevansi}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perubahan kritis */}
      {note.perubahan_kritis?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-500" />Perubahan Regulasi Kritis</h3>
          <div className="space-y-2">
            {note.perubahan_kritis.map((p, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/50 bg-background">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold">{p.aspek}</p>
                  <Badge variant="outline" className={`text-xs shrink-0 ${urgensiColor[p.urgensi] ?? urgensiColor.sedang}`}>{p.urgensi}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.perubahan}</p>
                <p className="text-xs mt-1.5 text-amber-600 dark:text-amber-400 flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{p.dampak_ke_dokumen}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risiko */}
      {note.risiko_ketidakpatuhan?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" />Risiko Jika Tidak Dipatuhi</h3>
          <ul className="space-y-1.5">
            {note.risiko_ketidakpatuhan.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rekomendasi */}
      {note.rekomendasi_tindak_lanjut?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" />Rekomendasi Tindak Lanjut</h3>
          <ol className="space-y-1.5">
            {note.rekomendasi_tindak_lanjut.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <span className="font-bold text-amber-600 shrink-0">{i + 1}.</span>{r}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Catatan konsultan */}
      {note.catatan_konsultan && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Catatan untuk Klien (siap forward)</h3>
          <p className="text-sm leading-relaxed text-foreground/90 italic">"{note.catatan_konsultan}"</p>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 mt-1" onClick={copyToClipboard}>
            <Copy className="h-3 w-3" />Salin semua ke clipboard
          </Button>
        </div>
      )}
    </div>
  );
}

const DOC_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  tender: { label: "Dokumen Tender", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: "📋" },
  skk_sbu: { label: "SKK / SBU", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: "🏗️" },
  kontrak: { label: "Kontrak", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: "📜" },
  lainnya: { label: "Dokumen Lainnya", color: "bg-gray-500/10 text-gray-600 border-gray-500/30", icon: "📄" },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Chat Component ────────────────────────────────────────────────────────────
function DocChat({ doc, isPremium }: { doc: DocAnalysis; isPremium: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>(doc.chat_history ?? []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    if (!isPremium) {
      toast({ title: "Fitur Premium", description: "Chat dokumen tersedia di paket Starter ke atas.", variant: "destructive" });
      return;
    }
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    let assistantMsg = "";
    setMessages(prev => [...prev, { role: "assistant", content: "…" }]);

    try {
      const resp = await fetch(`/api/bedah-dokumen/${doc.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg }),
      });

      if (!resp.body) throw new Error("No stream");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              assistantMsg += data.chunk;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantMsg };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 rounded-xl border border-border/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 py-8">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <div>
              <p className="font-medium">Tanya tentang isi dokumen ini</p>
              <p className="text-sm mt-1">Contoh: "Apa persyaratan SBU yang dibutuhkan?" atau "Jelaskan pasal tentang denda keterlambatan."</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-background border border-border/60 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isPremium && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Chat dokumen tersedia di paket Starter ke atas.
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          placeholder={isPremium ? "Tanya tentang dokumen ini…" : "Upgrade untuk chat dokumen"}
          value={input}
          disabled={!isPremium || streaming}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <Button size="icon" onClick={sendMessage} disabled={!isPremium || streaming || !input.trim()} className="rounded-xl shrink-0">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ── Checklist Component ───────────────────────────────────────────────────────
function DocChecklist({ doc, isPremium }: { doc: DocAnalysis; isPremium: boolean }) {
  const checklist: ChecklistCategory[] = Array.isArray(doc.checklist) ? doc.checklist : [];

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold">Checklist Kelengkapan — Paket Starter</p>
          <p className="text-sm text-muted-foreground mt-1">Upgrade untuk mendapatkan checklist otomatis dari setiap dokumen.</p>
        </div>
        <a href="/onboarding">
          <Button size="sm" className="gap-2"><Sparkles className="h-3.5 w-3.5" />Upgrade Sekarang</Button>
        </a>
      </div>
    );
  }

  if (!checklist.length) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Checklist belum tersedia untuk dokumen ini.</p>;
  }

  // Parse metadata (key_points, risiko, rekomendasi) stored in error_msg field
  let meta: { key_points?: string[]; risiko?: string[]; rekomendasi?: string[] } = {};
  try { meta = doc.error_msg ? JSON.parse(doc.error_msg) : {}; } catch {}

  const statusConfig = {
    ada: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />, badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Ada" },
    tidak_ada: { icon: <XCircle className="h-4 w-4 text-red-500 shrink-0" />, badge: "bg-red-500/10 text-red-600 border-red-500/20", label: "Tidak Ada" },
    perlu_dicek: { icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />, badge: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Perlu Dicek" },
  };

  return (
    <div className="space-y-6">
      {checklist.map((cat, ci) => (
        <div key={ci} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />{cat.kategori}
          </h3>
          <div className="space-y-1.5">
            {cat.items?.map((item, ii) => {
              const cfg = statusConfig[item.status] ?? statusConfig.perlu_dicek;
              return (
                <div key={ii} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background">
                  {cfg.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.item}</p>
                    {item.catatan && <p className="text-xs text-muted-foreground mt-0.5">{item.catatan}</p>}
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${cfg.badge}`}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {meta.risiko && meta.risiko.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />Catatan Risiko
          </h3>
          <ul className="space-y-1.5">
            {meta.risiko.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta.rekomendasi && meta.rekomendasi.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />Rekomendasi Tindak Lanjut
          </h3>
          <ul className="space-y-1.5">
            {meta.rekomendasi.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <ChevronRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Summary Component ─────────────────────────────────────────────────────────
function DocSummary({ doc }: { doc: DocAnalysis }) {
  let meta: { key_points?: string[] } = {};
  try { meta = doc.error_msg ? JSON.parse(doc.error_msg) : {}; } catch {}

  return (
    <div className="space-y-5">
      {doc.summary ? (
        <>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{doc.summary}</div>
          </div>
          {meta.key_points && meta.key_points.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />Poin-Poin Kunci
              </h3>
              <ul className="space-y-1.5">
                {meta.key_points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Ringkasan belum tersedia.</p>
      )}
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUploaded, isFree, docCount }: {
  onUploaded: (id: number) => void;
  isFree: boolean;
  docCount: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFile = async (file: File) => {
    if (isFree && docCount >= 1) {
      toast({ title: "Batas Gratis", description: "Hapus dokumen lama atau upgrade ke Starter untuk upload lebih.", variant: "destructive" });
      return;
    }
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".txt")) {
      toast({ title: "Format tidak didukung", description: "Gunakan file PDF atau TXT.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/bedah-dokumen/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload gagal");
      queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen/my"] });
      onUploaded(data.id);
      toast({ title: "Dokumen diunggah", description: "Analisis sedang diproses…" });
    } catch (err: any) {
      toast({ title: "Gagal upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [docCount, isFree]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
      } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onInputChange} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium">Mengunggah & menganalisis…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Seret file ke sini atau klik untuk pilih</p>
            <p className="text-sm text-muted-foreground mt-1">PDF atau TXT • Maks. 50 MB</p>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground flex-wrap justify-center">
            {["📋 Dokumen Tender", "🏗️ SKK/SBU", "📜 Kontrak"].map(t => (
              <span key={t} className="bg-muted/60 rounded-full px-2.5 py-1 border border-border/50">{t}</span>
            ))}
          </div>
          {isFree && docCount >= 1 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <Lock className="h-3 w-3" />Hapus dokumen lama atau upgrade untuk upload lebih
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function BedahDokumenContent() {
  const { hasFeature } = useFeatureAccess();
  const isPremium = hasFeature("ai_tools");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ktkModal, setKtkModal] = useState(false);

  const { data: docs = [], isLoading } = useQuery<DocAnalysis[]>({
    queryKey: ["/api/bedah-dokumen/my"],
    queryFn: async () => {
      const r = await fetch("/api/bedah-dokumen/my", { credentials: "include" });
      if (!r.ok) throw new Error("Gagal memuat daftar dokumen");
      return r.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as DocAnalysis[] | undefined;
      return data?.some(d => d.status === "analyzing") ? 3000 : false;
    },
  });

  const { data: selectedDoc } = useQuery<DocAnalysis>({
    queryKey: ["/api/bedah-dokumen", selectedId],
    queryFn: async () => {
      const r = await fetch(`/api/bedah-dokumen/${selectedId}`, { credentials: "include" });
      if (!r.ok) throw new Error("Tidak ditemukan");
      return r.json();
    },
    enabled: !!selectedId,
    refetchInterval: (query) => {
      const data = query.state.data as DocAnalysis | undefined;
      return data?.status === "analyzing" ? 2000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/bedah-dokumen/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen/my"] });
      setSelectedId(null);
      toast({ title: "Dokumen dihapus" });
    },
  });

  // Auto-select first doc
  useEffect(() => {
    if (!selectedId && docs.length > 0) setSelectedId(docs[0].id);
  }, [docs]);

  const isFree = !isPremium;
  const docCount = docs.length;

  return (
    <>
    <Dialog open={ktkModal} onOpenChange={setKtkModal}>
      {selectedDoc && ktkModal && (
        <KTKExportModal doc={selectedDoc} onClose={() => setKtkModal(false)} />
      )}
    </Dialog>
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bedah Dokumen</h1>
            <p className="text-sm text-muted-foreground">Upload dokumen konstruksi — AI analisis otomatis dalam detik</p>
          </div>
          {isFree && (
            <Badge variant="outline" className="ml-auto text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              <Lock className="h-3 w-3 mr-1" />Gratis: 1 dok, ringkasan saja
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + List */}
        <div className="lg:col-span-1 space-y-4">
          <UploadZone
            onUploaded={(id) => { setSelectedId(id); }}
            isFree={isFree}
            docCount={docCount}
          />

          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Memuat…</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Belum ada dokumen diunggah
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Dokumen Saya</p>
              {docs.map(doc => {
                const typeInfo = DOC_TYPE_LABELS[doc.doc_type] ?? DOC_TYPE_LABELS.lainnya;
                const isSelected = selectedId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 mt-0.5">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.original_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {doc.status === "analyzing" && (
                            <span className="flex items-center gap-1 text-xs text-blue-500">
                              <Loader2 className="h-3 w-3 animate-spin" />Menganalisis…
                            </span>
                          )}
                          {doc.status === "done" && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500">
                              <CheckCircle2 className="h-3 w-3" />Selesai
                            </span>
                          )}
                          {doc.status === "error" && (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <XCircle className="h-3 w-3" />Error
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                        className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-2">
          {!selectedDoc ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground gap-4 border-2 border-dashed border-border/40 rounded-2xl">
              <FileSearch className="h-12 w-12 opacity-20" />
              <div>
                <p className="font-medium">Pilih atau upload dokumen</p>
                <p className="text-sm mt-1">Hasil analisis akan tampil di sini</p>
              </div>
            </div>
          ) : selectedDoc.status === "analyzing" ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border border-border/50 rounded-2xl bg-muted/20">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold">AI sedang menganalisis dokumen…</p>
                <p className="text-sm text-muted-foreground mt-1">Biasanya selesai dalam 10–30 detik</p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {["Membaca isi", "Identifikasi jenis", "Buat ringkasan", "Susun checklist"].map((s, i) => (
                  <span key={i} className="flex items-center gap-1 bg-background border border-border/50 rounded-full px-2.5 py-1">
                    <Clock className="h-3 w-3" />{s}
                  </span>
                ))}
              </div>
            </div>
          ) : selectedDoc.status === "error" ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border border-red-500/20 rounded-2xl bg-red-500/5">
              <XCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="font-semibold">Analisis gagal</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedDoc.error_msg || "Terjadi kesalahan saat menganalisis."}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen", selectedId] })}>
                <RotateCcw className="h-3.5 w-3.5" />Coba lagi
              </Button>
            </div>
          ) : (
            <div className="border border-border/50 rounded-2xl overflow-hidden bg-background">
              {/* Doc header */}
              <div className="px-5 py-4 border-b border-border/50 flex items-start gap-3">
                <div className="text-2xl">{DOC_TYPE_LABELS[selectedDoc.doc_type]?.icon ?? "📄"}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{selectedDoc.original_name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${DOC_TYPE_LABELS[selectedDoc.doc_type]?.color}`}>
                      {DOC_TYPE_LABELS[selectedDoc.doc_type]?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatFileSize(selectedDoc.file_size)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(selectedDoc.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {isPremium && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setKtkModal(true)}
                    >
                      <Package className="h-3.5 w-3.5" />
                      Export KTK
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="p-5">
                <Tabs defaultValue="ringkasan">
                  <TabsList className="mb-5 w-full sm:w-auto flex-wrap h-auto gap-1">
                    <TabsTrigger value="ringkasan" className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />Ringkasan
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" />Checklist
                      {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                    <TabsTrigger value="regulasi" className="gap-1.5">
                      <Scale className="h-3.5 w-3.5" />Regulasi
                      {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />Chat
                      {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ringkasan">
                    <DocSummary doc={selectedDoc} />
                  </TabsContent>
                  <TabsContent value="checklist">
                    <DocChecklist doc={selectedDoc} isPremium={isPremium} />
                  </TabsContent>
                  <TabsContent value="regulasi">
                    <DocRegulasiNote doc={selectedDoc} isPremium={isPremium} />
                  </TabsContent>
                  <TabsContent value="chat">
                    <DocChat doc={selectedDoc} isPremium={isPremium} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default function BedahDokumenPage() {
  return (
    <PremiumPageGuard
      feature="chatbot"
      requiredPlan="free"
      title="Bedah Dokumen Konstruksi"
      description="Upload dokumen tender, SKK/SBU, atau kontrak — AI analisis otomatis dalam detik."
      highlights={[
        "Ringkasan eksekutif otomatis dari dokumen apapun",
        "Checklist kelengkapan & deteksi poin kritis",
        "Chat tanya-jawab langsung tentang isi dokumen",
        "Mendukung PDF dokumen tender, kontrak, & SKK/SBU",
      ]}
      icon={<FileSearch className="h-10 w-10 text-primary" />}
    >
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <BedahDokumenContent />
      </div>
    </PremiumPageGuard>
  );
}
