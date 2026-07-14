import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Archive, Save, Upload, Copy, Download, Trash2, Loader2, FileText, Eye,
} from "lucide-react";

interface ToolbarMessage { role: string; content: string; isStreaming?: boolean; }
interface ResearchReport { id: number; agentSlug: string; agentName: string | null; title: string; content: string; createdAt: string; }

interface Props {
  agentSlug: string;
  agentName: string;
  accentClass?: string;      // tailwind bg for primary buttons, e.g. "bg-emerald-600 hover:bg-emerald-500"
  messages: ToolbarMessage[];
  streaming: boolean;
  onRun: (text: string) => void;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return iso; }
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function slugifyFile(s: string) {
  return (s || "laporan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "laporan";
}

export function WarRoomToolbar({ agentSlug, agentName, accentClass = "bg-emerald-600 hover:bg-emerald-500", messages, streaming, onRun }: Props) {
  const { toast } = useToast();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<ResearchReport | null>(null);

  const { data: reports = [], isLoading } = useQuery<ResearchReport[]>({
    queryKey: ["/api/research-reports", agentSlug],
    queryFn: async () => {
      const r = await fetch(`/api/research-reports?agentSlug=${encodeURIComponent(agentSlug)}`, { credentials: "include" });
      if (!r.ok) throw new Error("Gagal memuat arsip");
      return r.json();
    },
    enabled: archiveOpen,
  });

  // Laporan terakhir yang selesai (assistant, tidak streaming, ada isi)
  let lastReport: string | null = null;
  let lastTitle = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && !m.isStreaming && m.content.trim()) {
      lastReport = m.content;
      for (let j = i - 1; j >= 0; j--) {
        if (messages[j].role === "user") { lastTitle = messages[j].content.slice(0, 80); break; }
      }
      break;
    }
  }
  const hasReport = !!lastReport && !streaming;

  async function saveLast() {
    if (!lastReport) return;
    setSaving(true);
    try {
      await apiRequest("POST", "/api/research-reports", {
        agentSlug, agentName,
        title: lastTitle || `Laporan ${agentName}`,
        content: lastReport,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/research-reports", agentSlug] });
      toast({ title: "Tersimpan ke arsip", description: "Laporan bisa dibuka lagi kapan saja." });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    try {
      await apiRequest("DELETE", `/api/research-reports/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/research-reports", agentSlug] });
      if (viewing?.id === id) setViewing(null);
      toast({ title: "Laporan dihapus" });
    } catch (e: any) {
      toast({ title: "Gagal menghapus", description: e?.message || "Coba lagi.", variant: "destructive" });
    }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); toast({ title: "Disalin ke clipboard" }); }
    catch { toast({ title: "Gagal menyalin", variant: "destructive" }); }
  }

  function runImport() {
    const t = importText.trim();
    if (!t) return;
    onRun(`Berikut MATERI IKLAN yang sudah ada. Tolong analisis dan tingkatkan (jangan mulai dari nol): identifikasi angle & hook yang dipakai, kelemahan/kebocoran pesan, lalu beri versi perbaikan + 3 variasi hook baru siap uji.\n\n"""${t}"""`);
    setImportText("");
    setImportOpen(false);
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Simpan laporan terakhir */}
      <Button
        variant="ghost" size="sm"
        className="h-8 gap-1.5 text-white/70 hover:text-white text-xs px-2"
        onClick={saveLast} disabled={!hasReport || saving}
        data-testid="button-save-report"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Simpan</span>
      </Button>

      {/* Impor materi iklan */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/70 hover:text-white text-xs px-2" disabled={streaming} data-testid="button-import-material">
            <Upload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Impor</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#0a1410] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white"><Upload className="h-4 w-4" />Impor materi iklan</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-white/50 -mt-1">Tempel iklan/copy yang sudah Anda punya. Tim akan menganalisis dan memberi versi perbaikan + hook baru. Ini penempelan teks, bukan tarik otomatis dari platform iklan.</p>
          <Textarea
            value={importText} onChange={(e) => setImportText(e.target.value)}
            placeholder="Tempel teks iklan / caption / script yang sudah ada di sini…"
            className="min-h-[160px] bg-black/30 border-white/10 text-sm text-white placeholder:text-white/30"
            data-testid="input-import-material"
          />
          <DialogFooter>
            <Button className={`${accentClass} text-white`} onClick={runImport} disabled={!importText.trim() || streaming} data-testid="button-run-import">
              <Upload className="h-4 w-4 mr-1.5" />Analisis materi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Arsip laporan */}
      <Sheet open={archiveOpen} onOpenChange={setArchiveOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/70 hover:text-white text-xs px-2" data-testid="button-open-archive">
            <Archive className="h-3.5 w-3.5" /><span className="hidden sm:inline">Arsip</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-[#0a1410] border-white/10 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white"><Archive className="h-4 w-4" />Arsip Laporan</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-white/40"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-white/40 text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Belum ada laporan tersimpan.<br />Jalankan riset lalu tekan <strong className="text-white/60">Simpan</strong>.
              </div>
            ) : reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3" data-testid={`archive-item-${r.id}`}>
                <div className="text-sm text-white/90 font-medium line-clamp-2">{r.title}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{fmtDate(r.createdAt)}</div>
                <div className="flex items-center gap-1 mt-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/60 hover:text-white" onClick={() => setViewing(r)} data-testid={`button-view-${r.id}`}><Eye className="h-3.5 w-3.5 mr-1" />Buka</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/60 hover:text-white" onClick={() => copyText(r.content)} data-testid={`button-copy-${r.id}`}><Copy className="h-3.5 w-3.5 mr-1" />Salin</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/60 hover:text-white" onClick={() => download(`${slugifyFile(r.title)}.md`, r.content)} data-testid={`button-download-${r.id}`}><Download className="h-3.5 w-3.5 mr-1" />Unduh</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-400/70 hover:text-red-400 ml-auto" onClick={() => del(r.id)} data-testid={`button-delete-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog baca laporan tersimpan */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="bg-[#0a1410] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-base pr-6">{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing && <div className="text-[11px] text-white/40 -mt-2">{fmtDate(viewing.createdAt)}</div>}
          <div className="whitespace-pre-wrap text-sm text-white/85 leading-relaxed">{viewing?.content}</div>
          <DialogFooter className="gap-2">
            {viewing && (
              <>
                <Button variant="outline" size="sm" className="border-white/15 text-white/80" onClick={() => copyText(viewing.content)} data-testid="button-view-copy"><Copy className="h-4 w-4 mr-1.5" />Salin</Button>
                <Button variant="outline" size="sm" className="border-white/15 text-white/80" onClick={() => download(`${slugifyFile(viewing.title)}.md`, viewing.content)} data-testid="button-view-download"><Download className="h-4 w-4 mr-1.5" />Unduh .md</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
