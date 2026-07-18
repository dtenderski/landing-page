import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  HardDrive, Upload, Search, FolderOpen, File, FileText, Image,
  FileSpreadsheet, Loader2, Trash2, Download, Pencil, Plus, LogIn,
  Sparkles, CheckCircle2, Clock, AlertCircle, X, Shield, Wrench,
  Calculator, Award, BarChart3, Folder, ChevronRight, RefreshCw,
  Brain, Eye, Link2, Info, Check, ArrowRight, Zap, Lock,
  DatabaseZap, ScanSearch, BrainCircuit, ClipboardList, Star,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RUANG_SIMPAN_PLANS } from "@/data/pricing";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RSFolder { id: string; name: string; color: string; icon: string; is_default: boolean; file_count: number; folder_bytes: number; sort_order: number; }
interface RSFile {
  id: string; original_name: string; mime_type: string; size_bytes: number;
  description?: string; tags?: string[]; kb_status: string; kb_chunk_count?: number;
  folder_id?: string; folder_name?: string; folder_color?: string;
  kelola_doc_id?: string; created_at: string; snippet?: string;
}
interface RSOverview {
  folders: RSFolder[];
  usage: { used: number; quota: number; total_files: number; ai_ready: number };
  recent_files: RSFile[];
  stats: { pending: number; failed: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const FOLDER_ICONS: Record<string, any> = {
  shield: Shield, wrench: Wrench, calculator: Calculator, award: Award,
  "bar-chart": BarChart3, "folder-open": FolderOpen, folder: Folder,
};
const FOLDER_COLORS: Record<string, string> = {
  blue:   "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  slate:  "text-slate-600 bg-slate-100 dark:bg-slate-800/40",
  orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  red:    "text-red-600 bg-red-100 dark:bg-red-900/30",
  teal:   "text-teal-600 bg-teal-100 dark:bg-teal-900/30",
  gray:   "text-gray-500 bg-gray-100 dark:bg-gray-800/40",
  green:  "text-green-600 bg-green-100 dark:bg-green-900/30",
  pink:   "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(0)} KB`;
  return `${(b/1024/1024).toFixed(1)} MB`;
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}
function mimeIcon(mime: string) {
  if (mime.startsWith("image/"))        return <Image className="h-5 w-5 text-emerald-500" />;
  if (mime === "application/pdf")       return <FileText className="h-5 w-5 text-red-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (mime.includes("word") || mime.includes("document"))     return <FileText className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}
function mimeLabel(mime: string): string {
  if (mime.startsWith("image/"))        return mime.split("/")[1].toUpperCase();
  if (mime === "application/pdf")       return "PDF";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "XLSX";
  if (mime.includes("word") || mime.includes("document"))     return "DOCX";
  if (mime.startsWith("text/"))         return "TXT";
  return "FILE";
}
function kbBadge(status: string, count?: number) {
  switch (status) {
    case "ready":      return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><Sparkles className="h-2.5 w-2.5" /> AI Siap{count ? ` ·${count}` : ""}</Badge>;
    case "processing": return <Badge className="bg-blue-100 text-blue-600 text-[10px] gap-1 animate-pulse"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Memproses</Badge>;
    case "pending":    return <Badge className="bg-gray-100 text-gray-500 text-[10px] gap-1"><Clock className="h-2.5 w-2.5" /> Antrian</Badge>;
    case "failed":     return <Badge className="bg-red-100 text-red-600 text-[10px] gap-1"><AlertCircle className="h-2.5 w-2.5" /> Gagal</Badge>;
    case "skipped":    return <Badge className="bg-gray-100 text-gray-400 text-[10px]">Tidak Teks</Badge>;
    default:           return null;
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RuangSimpanPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<RSFile | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<RSOverview>({
    queryKey: ["/api/ruang-simpan/overview"],
    enabled: !!user,
    refetchInterval: 8000, // Poll for kb_status updates
  });

  const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery<RSFile[]>({
    queryKey: ["/api/ruang-simpan/files", activeFolder],
    queryFn: () => apiRequest("GET", `/api/ruang-simpan/files${activeFolder !== "all" ? `?folder_id=${activeFolder}` : ""}`).then(r => r.json()),
    enabled: !!user && !searchQuery,
    refetchInterval: 8000,
  });

  const { data: searchResults, isLoading: searching } = useQuery<{ results: RSFile[]; query: string }>({
    queryKey: ["/api/ruang-simpan/search", searchQuery],
    queryFn: () => apiRequest("GET", `/api/ruang-simpan/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
    enabled: !!user && searchQuery.length >= 2,
  });

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const file = fileList[0];
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (activeFolder !== "all") fd.append("folder_id", activeFolder);

      const res = await fetch("/api/ruang-simpan/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        if (json.quota_exceeded) {
          toast({ title: "Kuota storage penuh", description: json.error, variant: "destructive" });
        } else {
          toast({ title: "Upload gagal", description: json.error || "Coba lagi", variant: "destructive" });
        }
        return;
      }
      toast({ title: `${file.name} berhasil diunggah`, description: "AI sedang memproses dokumen…" });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [activeFolder, toast, qc]);

  const deleteFile = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/ruang-simpan/files/${id}`).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] });
      setSelectedFile(null);
      toast({ title: "File dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus file", variant: "destructive" }),
  });

  // ── Drag & drop ─────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const displayFiles = searchQuery.length >= 2 ? (searchResults?.results || []) : files;
  const usage = overview?.usage;
  const usagePct = usage ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0;

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <RuangSimpanLandingPage />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <SharedHeader />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-7">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="h-4 w-4 text-indigo-400" />
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Ruang Simpan</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Gudang Dokumen Cerdas</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Semua dokumen perusahaan — dapat dikurasi oleh seluruh fitur AI Gustafta.</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
            <div className="flex items-center gap-2 text-xs text-indigo-200 w-full justify-between">
              <span>{formatBytes(usage?.used || 0)}</span>
              <span className="text-white/40">/</span>
              <span>15 MB gratis</span>
              <span className={`font-bold ml-auto ${usagePct > 80 ? "text-red-400" : usagePct > 50 ? "text-amber-400" : "text-emerald-400"}`}>{usagePct}%</span>
            </div>
            <Progress value={usagePct} className="h-1.5 w-full bg-white/10" />
            <div className="flex gap-2 text-[10px] text-indigo-300">
              <span>{usage?.total_files || 0} file</span>
              <span>·</span>
              <span className="text-emerald-400">{usage?.ai_ready || 0} siap AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-5">

        {/* ── Sidebar ── */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden">
            {/* Upload button */}
            <div className="p-3 border-b border-border">
              <Button
                size="sm" className="w-full gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Mengunggah…" : "Upload File"}
              </Button>
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.jpg,.jpeg,.png,.webp"
                onChange={e => handleUpload(e.target.files)} />
            </div>
            {/* Folder list */}
            <div className="p-2">
              <button
                onClick={() => setActiveFolder("all")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${activeFolder === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
              >
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left truncate">Semua File</span>
                <span className="text-[10px] opacity-60">{usage?.total_files || 0}</span>
              </button>
              {overviewLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {overview?.folders.map(f => {
                    const Icon = FOLDER_ICONS[f.icon] || Folder;
                    const isActive = activeFolder === f.id;
                    return (
                      <button key={f.id}
                        onClick={() => setActiveFolder(f.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                          ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 text-left truncate">{f.name}</span>
                        <span className="text-[10px] opacity-60">{f.file_count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setShowNewFolder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Folder Baru
              </button>
            </div>

            {/* AI info box */}
            <div className="m-3 mt-1 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-bold text-violet-700 dark:text-violet-400">Konteks AI</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Dokumen dengan badge <span className="text-emerald-600 font-semibold">AI Siap</span> dapat digunakan sebagai konteks oleh fitur Klinik, Bedah Dokumen, Brain Project, dan lainnya.
              </p>
            </div>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 min-w-0">

          {/* Search + toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") setSearchQuery(search); }}
                placeholder="Cari file atau isi dokumen…"
                className="pl-9"
              />
            </div>
            {search && (
              <Button size="sm" onClick={() => setSearchQuery(search)} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
              </Button>
            )}
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSearchQuery(""); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { refetchFiles(); refetchOverview(); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {/* Mobile upload */}
            <Button size="sm" className="lg:hidden gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Search results hint */}
          {searchQuery && (
            <p className="text-xs text-muted-foreground mb-3">
              {searching ? "Mencari…" : `${searchResults?.results.length || 0} hasil untuk "${searchQuery}"`}
            </p>
          )}

          {/* Drop zone + files */}
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`min-h-[300px] rounded-2xl transition-all ${isDragging ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
          >
            {filesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayFiles.length === 0 ? (
              <EmptyState isDragging={isDragging} onUploadClick={() => fileInputRef.current?.click()} isSearch={!!searchQuery} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onClick={() => setSelectedFile(file)}
                    onDelete={() => { if (confirm(`Hapus "${file.original_name}"?`)) deleteFile.mutate(file.id); }}
                  />
                ))}
              </div>
            )}
            {isDragging && (
              <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-white dark:bg-card rounded-2xl p-10 shadow-2xl border-2 border-dashed border-primary text-center">
                  <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="font-bold text-lg">Lepas untuk upload</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── File detail dialog ── */}
      {selectedFile && (
        <FileDetailDialog
          file={selectedFile}
          folders={overview?.folders || []}
          onClose={() => setSelectedFile(null)}
          onDelete={() => { if (confirm(`Hapus "${selectedFile.original_name}"?`)) deleteFile.mutate(selectedFile.id); }}
          onUpdated={() => { qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] }); setSelectedFile(null); }}
        />
      )}

      {/* ── New folder dialog ── */}
      {showNewFolder && (
        <NewFolderDialog
          onClose={() => setShowNewFolder(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] }); setShowNewFolder(false); }}
        />
      )}
    </div>
  );
}

// ── File Card ──────────────────────────────────────────────────────────────────

function FileCard({ file, onClick, onDelete }: { file: RSFile; onClick: () => void; onDelete: () => void }) {
  const isImage = file.mime_type.startsWith("image/");
  return (
    <div className="bg-white dark:bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          {mimeIcon(file.mime_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{file.original_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{mimeLabel(file.mime_type)}</span>
            <span className="text-[10px] text-muted-foreground">{formatBytes(file.size_bytes)}</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Snippet from search */}
      {file.snippet && (
        <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1"
          dangerouslySetInnerHTML={{ __html: file.snippet }} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {kbBadge(file.kb_status, file.kb_chunk_count)}
          {file.folder_name && (
            <Badge variant="outline" className="text-[10px]">{file.folder_name}</Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{formatDate(file.created_at)}</span>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ isDragging, onUploadClick, isSearch }: { isDragging: boolean; onUploadClick: () => void; isSearch: boolean }) {
  if (isSearch) return (
    <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-border">
      <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="font-semibold text-foreground mb-1">Tidak ditemukan</p>
      <p className="text-sm text-muted-foreground">Coba kata kunci lain.</p>
    </div>
  );
  return (
    <div
      onClick={onUploadClick}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
    >
      <div className="flex justify-center mb-4 gap-3 opacity-60">
        <FileText className="h-8 w-8 text-blue-400" />
        <Image className="h-8 w-8 text-emerald-400" />
        <FileSpreadsheet className="h-8 w-8 text-green-500" />
      </div>
      <p className="font-bold text-foreground text-lg mb-1">Tambahkan Pengetahuan ke Memori Bisnis</p>
      <p className="text-sm text-muted-foreground mb-4">Drag & drop atau klik untuk pilih file<br />PDF · DOCX · XLSX · JPG · PNG · TXT · maks 20MB</p>
      <Button size="sm" className="gap-1.5" onClick={e => { e.stopPropagation(); onUploadClick(); }}>
        <Upload className="h-4 w-4" /> Pilih File
      </Button>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Brain className="h-3.5 w-3.5 text-violet-500" />
        <span>Setiap file yang ditambahkan memperkaya pengetahuan AI tentang perusahaan Anda</span>
      </div>
    </div>
  );
}

// ── File Detail Dialog ─────────────────────────────────────────────────────────

function FileDetailDialog({ file, folders, onClose, onDelete, onUpdated }: {
  file: RSFile; folders: RSFolder[]; onClose: () => void; onDelete: () => void; onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(file.description || "");
  const [folderId, setFolderId] = useState(file.folder_id || "");
  const [saving, setSaving] = useState(false);
  const isImage = file.mime_type.startsWith("image/");

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("PATCH", `/api/ruang-simpan/files/${file.id}`, {
        description: desc || null,
        folder_id: folderId || null,
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast({ title: "File diperbarui" });
      onUpdated();
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {mimeIcon(file.mime_type)}
            <span className="truncate">{file.original_name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image preview */}
          {isImage && (
            <div className="rounded-xl overflow-hidden bg-muted">
              <img
                src={`/api/ruang-simpan/files/${file.id}/preview`}
                alt={file.original_name}
                className="w-full max-h-64 object-contain"
              />
            </div>
          )}
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Ukuran</p>
              <p className="font-semibold">{formatBytes(file.size_bytes)}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Diunggah</p>
              <p className="font-semibold">{formatDate(file.created_at)}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Status AI</p>
              <div className="flex items-center gap-2">
                {kbBadge(file.kb_status, file.kb_chunk_count)}
                {file.kb_status === "ready" && (
                  <span className="text-xs text-muted-foreground">{file.kb_chunk_count} potongan teks siap untuk RAG</span>
                )}
                {file.kb_status === "skipped" && (
                  <span className="text-xs text-muted-foreground">File tidak mengandung teks yang bisa diekstrak</span>
                )}
              </div>
            </div>
          </div>

          {/* Edit fields */}
          {editing ? (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Folder</Label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger><SelectValue placeholder="Tanpa folder" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tanpa folder</SelectItem>
                    {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Deskripsi</Label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Keterangan singkat…" />
              </div>
            </div>
          ) : (
            file.description && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold text-foreground">Deskripsi</p>
                {file.description}
              </div>
            )
          )}

          {/* AI context info */}
          {file.kb_status === "ready" && (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-bold text-violet-700 dark:text-violet-400">Cara Gunakan di AI</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pergi ke <strong>Bedah Dokumen</strong> → pilih "Dari Ruang Simpan". Atau buka <strong>Klinik Konsultasi</strong> → tanya pertanyaan — AI otomatis mencari konteks dari dokumen ini.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="flex-row flex-wrap gap-2">
          <a href={`/api/ruang-simpan/files/${file.id}/download`} download={file.original_name}>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Download</Button>
          </a>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Batal</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Simpan</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          )}
          <Button variant="destructive" size="sm" className="gap-1.5 ml-auto" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /> Hapus</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New Folder Dialog ──────────────────────────────────────────────────────────

const FOLDER_COLOR_OPTIONS = ["blue","slate","orange","purple","red","teal","gray","green","pink"];
const FOLDER_ICON_OPTIONS  = [
  { value: "folder",      label: "Folder" },
  { value: "folder-open", label: "Folder Buka" },
  { value: "shield",      label: "Legalitas" },
  { value: "wrench",      label: "Teknis" },
  { value: "calculator",  label: "Keuangan" },
  { value: "award",       label: "Sertifikasi" },
  { value: "bar-chart",   label: "Tender" },
];

function NewFolderDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("folder");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/ruang-simpan/folders", { name, color, icon });
      if (!res.ok) throw new Error("Gagal");
      toast({ title: `Folder "${name}" dibuat` });
      onCreated();
    } catch { toast({ title: "Gagal membuat folder", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Folder Baru</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nama Folder *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="cth: Dokumen Proyek A" maxLength={100} />
          </div>
          <div className="grid gap-1.5">
            <Label>Warna</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`}
                  style={{ backgroundColor: { blue:"#3b82f6",slate:"#64748b",orange:"#f97316",purple:"#a855f7",red:"#ef4444",teal:"#14b8a6",gray:"#9ca3af",green:"#22c55e",pink:"#ec4899" }[c] }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Ikon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOLDER_ICON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={create} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Buat Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Landing Page (unauthenticated) ────────────────────────────────────────────

const PLAN_COLOR_MAP: Record<string, { badge: string; ring: string; btn: string; glow: string }> = {
  gray:   { badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", ring: "border-border", btn: "bg-gray-800 hover:bg-gray-700 text-white", glow: "" },
  blue:   { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", ring: "border-blue-300 dark:border-blue-700", btn: "bg-blue-600 hover:bg-blue-700 text-white", glow: "" },
  indigo: { badge: "bg-indigo-600 text-white", ring: "border-indigo-500 ring-2 ring-indigo-400/30", btn: "bg-indigo-600 hover:bg-indigo-700 text-white", glow: "shadow-indigo-200 dark:shadow-indigo-900/40 shadow-xl" },
  violet: { badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", ring: "border-violet-300 dark:border-violet-700", btn: "bg-violet-600 hover:bg-violet-700 text-white", glow: "" },
};

function RuangSimpanLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden">
        {/* grid accent */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(99,102,241,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.3) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-semibold mb-6">
            <HardDrive className="h-3.5 w-3.5" /> Ruang Simpan — Beta
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
            Bangun{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Memori Bisnis
            </span>{" "}
            perusahaan Anda.
          </h1>
          <p className="text-indigo-200 text-base sm:text-lg max-w-2xl mx-auto mb-3 leading-relaxed">
            Ruang Simpan bukan tempat menyimpan file. Ini adalah tempat AI Gustafta
            mengenal perusahaan Anda — agar setiap fitur bekerja dengan konteks yang nyata.
          </p>
          <p className="text-indigo-400/80 text-sm max-w-xl mx-auto mb-8 italic">
            "Karena bisnis yang baik tidak bergantung pada ingatan seseorang."
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/masuk">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                <LogIn className="h-4 w-4" /> Mulai Gratis — 15 MB
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                Lihat Tarif Sewa <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
          {/* social proof mini */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-indigo-300/70">
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Data terenkripsi</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Khusus pemilik akun</span>
            <span className="flex items-center gap-1.5"><Brain className="h-3 w-3" /> AI siap dalam menit</span>
          </div>
        </div>
      </section>

      {/* ── MASALAH ──────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl font-bold text-foreground mb-8">
            Google Drive menyimpan dokumen. Gustafta Ruang Simpan <em>mengaktifkannya.</em>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Google Drive column */}
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Folder className="h-4 w-4 text-gray-400" />
                </div>
                <span className="font-bold text-muted-foreground">Google Drive / OneDrive</span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Simpan file ✓  — tapi AI tidak tahu isinya",
                  "Cari nama file — tidak bisa cari isi dokumen",
                  "Buka manual setiap kali butuh",
                  "Tidak terhubung ke proses bisnis konstruksi",
                  "Storage besar, tapi dokumen mati",
                ].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            {/* Ruang Simpan column */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <HardDrive className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">Gustafta Ruang Simpan</span>
              </div>
              <ul className="space-y-2.5 text-sm text-foreground">
                {[
                  "Simpan file + AI baca & pahami isinya",
                  "Cari di dalam isi dokumen (full-text)",
                  "Konteks otomatis ke Klinik, Bedah Dokumen, Tender",
                  "Terintegrasi Ruang Kelola — link dokumen legal langsung",
                  "15 MB gratis, upgrade saat sudah butuh lebih",
                ].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Cara Kerja</p>
        <h2 className="text-center text-2xl font-bold text-foreground mb-2">Rapikan. Hubungkan. Gunakan Kembali.</h2>
        <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">Tiga langkah yang mengubah dokumen yang berserakan menjadi pengetahuan yang bekerja untuk Anda.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: "1", icon: Upload, title: "Tambahkan Pengetahuan", desc: "Drag & drop PDF, DOCX, XLSX, foto scan, atau PNG. Anda sedang mengisi Memori Bisnis perusahaan, bukan sekadar upload file.", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
            { step: "2", icon: BrainCircuit, title: "AI Memahami & Menghubungkan", desc: "Gustafta membaca isi dokumen, mengindeks maknanya, dan menghubungkannya ke seluruh konteks perusahaan Anda.", color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
            { step: "3", icon: Sparkles, title: "Gunakan di Semua Workroom", desc: "Buka Klinik, Bedah Dokumen, Brain Project — AI langsung punya konteks. Anda tidak perlu upload ulang.", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="relative text-center bg-white dark:bg-card border border-border rounded-2xl p-6">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">{step}</div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FITUR DETAIL ─────────────────────────────────────────────────────── */}
      <section className="bg-muted/20 border-y border-border py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Fitur Utama</p>
          <h2 className="text-center text-2xl font-bold text-foreground mb-10">Semuanya sudah terhubung</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: ScanSearch,    color:"text-blue-600 bg-blue-50 dark:bg-blue-900/20",    title:"Cari Isi Dokumen",        desc:"Full-text search ke dalam konten PDF, DOCX, dan TXT — bukan hanya nama file." },
              { icon: BrainCircuit,  color:"text-violet-600 bg-violet-50 dark:bg-violet-900/20", title:"Konteks AI Otomatis",    desc:"Semua fitur AI Gustafta otomatis membaca dokumen Anda saat Anda menggunakannya." },
              { icon: ClipboardList, color:"text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", title:"Link ke Ruang Kelola", desc:"Hubungkan file scan dengan catatan SBU, NIB, SKK — satu klik dari dashboard." },
              { icon: FolderOpen,    color:"text-orange-600 bg-orange-50 dark:bg-orange-900/20", title:"Folder Terstruktur",    desc:"7 kategori default: Legalitas, Teknis, Tender, SDM, dan lainnya. Buat folder sendiri." },
              { icon: Shield,        color:"text-red-600 bg-red-50 dark:bg-red-900/20",     title:"Aman & Privat",           desc:"Dokumen hanya bisa diakses pemilik akun. Terenkripsi, audit log lengkap." },
              { icon: DatabaseZap,   color:"text-teal-600 bg-teal-50 dark:bg-teal-900/20",  title:"Preview & Download",      desc:"Lihat gambar langsung di browser. Download kapan saja, tanpa batas." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white dark:bg-card border border-border rounded-xl p-5">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-4 max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Tarif Sewa</p>
        <h2 className="text-center text-2xl font-bold text-foreground mb-2">Mulai gratis, upgrade saat butuh</h2>
        <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          Harga terjangkau karena nilai utamanya bukan ukuran storage — melainkan integrasi AI
          yang membuat dokumen Anda bekerja untuk bisnis konstruksi Anda.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RUANG_SIMPAN_PLANS.map(plan => {
            const colors = PLAN_COLOR_MAP[plan.color] || PLAN_COLOR_MAP.gray;
            return (
              <div
                key={plan.key}
                className={`relative bg-white dark:bg-card border-2 rounded-2xl p-5 flex flex-col transition-transform hover:-translate-y-1 ${colors.ring} ${colors.glow}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold ${colors.badge}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-foreground">{plan.label}</p>
                  <div className="mt-1.5">
                    <span className="text-2xl font-black text-foreground">{plan.price}</span>
                    {plan.amount > 0 && <span className="text-xs text-muted-foreground ml-1">/bulan</span>}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs font-semibold text-foreground">
                    <HardDrive className="h-3 w-3" /> {plan.storage}
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-foreground mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.limits.map(l => (
                    <li key={l} className="flex items-start gap-1.5 text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>

                {plan.ctaHref.startsWith("http") ? (
                  <a href={plan.ctaHref} target="_blank" rel="noopener noreferrer">
                    <button className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${colors.btn}`}>
                      {plan.cta}
                    </button>
                  </a>
                ) : (
                  <Link href={plan.ctaHref}>
                    <button className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${colors.btn}`}>
                      {plan.cta}
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Cost transparency note */}
        <div className="mt-8 bg-muted/40 border border-border rounded-xl p-4 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          <span className="font-semibold text-foreground">Transparansi biaya:</span>{" "}
          Penyimpanan kami menggunakan infrastruktur cloud object storage dengan biaya
          ~Rp 200–Rp 5.700/bulan per pengguna. Selisih menutupi biaya AI processing,
          pengembangan fitur, dan dukungan teknis. Tidak ada biaya tersembunyi.
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-muted/20 border-t border-border py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-xl font-bold text-foreground mb-8">Pertanyaan Umum</h2>
          <div className="space-y-4">
            {[
              { q: "Apakah dokumen saya aman?", a: "Ya. Setiap dokumen hanya bisa diakses oleh pemilik akun. Kami tidak berbagi data Anda dengan siapapun. Semua akses tercatat di audit log." },
              { q: "Format file apa saja yang didukung?", a: "PDF, DOCX, XLSX (data tabel), JPG, PNG, TXT, CSV, dan Markdown. Maks 20 MB per file." },
              { q: "Berapa lama AI memproses dokumen saya?", a: "Biasanya kurang dari 1 menit untuk PDF dan TXT. File gambar memerlukan OCR — sekitar 1–3 menit tergantung kompleksitas." },
              { q: "Apakah 15 MB gratis cukup untuk mencoba?", a: "Cukup untuk 3–5 dokumen SBU, NIB, atau NIK ukuran standar. Tujuannya agar Anda bisa merasakan manfaat AI sebelum memutuskan upgrade." },
              { q: "Bisakah saya batalkan langganan kapan saja?", a: "Ya. Tidak ada kontrak jangka panjang. Batalkan kapan saja dan data Anda tetap aman selama 30 hari setelah pembatalan." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white dark:bg-card border border-border rounded-xl p-4">
                <p className="font-semibold text-sm text-foreground mb-1.5">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 py-16 px-4 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-black mb-3">Mulai gratis hari ini.</h2>
        <p className="text-indigo-200 mb-7 max-w-md mx-auto text-sm leading-relaxed">
          15 MB cukup untuk membuktikan bahwa dokumen Anda bisa bekerja lebih keras dari sekadar diarsipkan.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/masuk">
            <Button size="lg" className="gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8">
              <LogIn className="h-4 w-4" /> Buat Akun Gratis
            </Button>
          </Link>
          <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Ruang%20Simpan" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
              Tanya via WhatsApp
            </Button>
          </a>
        </div>
      </section>

      {/* footer gap */}
      <div className="h-12 bg-background" />
    </div>
  );
}
