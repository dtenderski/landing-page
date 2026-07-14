import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCreateBigIdea } from "@/hooks/use-big-ideas";
import { apiRequest } from "@/lib/queryClient";
import {
  Sparkles, Plus, X, Loader2, Lightbulb, Target, Users,
  ArrowLeft, CheckCircle2, Youtube, Link2, FileText,
  Upload, FileCheck, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  name: string;
  type: "idea" | "inspiration" | "problem" | "mentoring";
  description: string;
  goals: string[];
  targetAudience: string;
  reasoning: string;
  expectedOutcome: string;
}

interface UploadedFile {
  name: string;
  size: number;
  charCount: number;
  text: string;
}

interface GenerateBigIdeasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId?: number | null;
  onCreated?: () => void;
}

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  idea: { label: "Ide & Inovasi", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: Lightbulb },
  inspiration: { label: "Inspirasi", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", icon: Sparkles },
  problem: { label: "Problem Solving", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30", icon: Target },
  mentoring: { label: "Mentoring", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30", icon: Users },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GenerateBigIdeasDialog({ open, onOpenChange, seriesId, onCreated }: GenerateBigIdeasDialogProps) {
  const [step, setStep] = useState<"input" | "results">("input");
  const [topic, setTopic] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);
  const [count, setCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [extractingCount, setExtractingCount] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; size: number; charCount: number; text: string } | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const createBigIdea = useCreateBigIdea();

  const isExtracting = extractingCount > 0;

  const addUrl = () => setUrls(prev => [...prev, ""]);
  const removeUrl = (i: number) => setUrls(prev => prev.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, val: string) => setUrls(prev => prev.map((u, idx) => idx === i ? val : u));

  const extractSingleFile = async (file: File): Promise<UploadedFile | null> => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: `File terlalu besar: ${file.name}`,
        description: `${formatBytes(file.size)} — Maksimal 5 MB per file.`,
        variant: "destructive",
      });
      return null;
    }

    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".txt")) {
      toast({
        title: `Format tidak didukung: ${file.name}`,
        description: "Gunakan PDF, DOCX, atau TXT.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai/extract-file-text", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengekstrak teks");

      return { name: file.name, size: file.size, charCount: data.charCount, text: data.text };
    } catch (err: any) {
      toast({
        title: `Gagal membaca: ${file.name}`,
        description: err.message || "Gagal membaca file",
        variant: "destructive",
      });
      return null;
    }
  };

  const processFiles = async (fileList: File[]) => {
    const alreadyNames = new Set([
      ...uploadedFiles.map(f => f.name),
      ...(pendingFile ? [pendingFile.name] : []),
    ]);
    const newFiles = fileList.filter(f => {
      if (alreadyNames.has(f.name)) {
        toast({
          title: `File sudah ada: ${f.name}`,
          description: "File ini sudah ditambahkan sebelumnya.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (newFiles.length === 0) return;

    setExtractError(null);
    setExtractingCount(prev => prev + newFiles.length);

    const results = await Promise.all(newFiles.map(extractSingleFile));
    const successful = results.filter((r): r is UploadedFile => r !== null);

    setExtractingCount(prev => prev - newFiles.length);

    if (successful.length === 0) return;

    if (successful.length === 1) {
      setPendingFile(successful[0]);
    } else {
      const [first, ...rest] = successful;
      setPendingFile(first);
      setUploadedFiles(prev => [...prev, ...rest]);
      if (rest.length > 0) {
        toast({
          title: `${rest.length} file lain berhasil dibaca`,
          description: `Pratinjau file pertama ditampilkan di bawah.`,
        });
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (isExtracting) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    await processFiles(files);
  };

  const handleConfirmPending = () => {
    if (!pendingFile) return;
    setUploadedFiles(prev => [...prev, { name: pendingFile.name, size: pendingFile.size, charCount: pendingFile.charCount, text: pendingFile.text }]);
    setPendingFile(null);
    toast({ title: "File berhasil ditambahkan", description: `${pendingFile.charCount.toLocaleString()} karakter diekstrak dari ${pendingFile.name}` });
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const buildCombinedReferenceText = () => {
    const parts: string[] = [];
    if (referenceText.trim()) parts.push(referenceText.trim());
    for (const f of uploadedFiles) {
      parts.push(`--- Dari file: ${f.name} ---\n${f.text}`);
    }
    return parts.join("\n\n");
  };

  const totalCharsFromFiles = uploadedFiles.reduce((sum, f) => sum + f.charCount, 0);
  const totalReferenceChars = referenceText.length + totalCharsFromFiles;

  const handleGenerate = async () => {
    const hasContent = referenceText.trim() || uploadedFiles.length > 0 || urls.some(u => u.trim()) || topic.trim();
    if (!hasContent) {
      toast({ title: "Butuh referensi", description: "Isi minimal satu dari: topik, teks referensi, URL, atau upload file", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const combinedRef = buildCombinedReferenceText();
      const res = await apiRequest("POST", "/api/ai/generate-big-ideas", {
        topic: topic.trim() || undefined,
        referenceText: combinedRef || undefined,
        urls: urls.filter(u => u.trim()),
        count,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate");
      setSuggestions(data.suggestions || []);
      setSelected(new Set(data.suggestions.map((_: any, i: number) => i)));
      setStep("results");
    } catch (err: any) {
      toast({ title: "Gagal generate", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(suggestions.map((_, i) => i)));
  const clearAll = () => setSelected(new Set());

  const handleCreateSelected = async () => {
    if (selected.size === 0) {
      toast({ title: "Pilih minimal 1 Modul", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    const toCreate = suggestions.filter((_, i) => selected.has(i));
    let successCount = 0;
    for (const s of toCreate) {
      try {
        await createBigIdea.mutateAsync({
          name: s.name,
          type: s.type,
          description: s.description,
          goals: s.goals,
          targetAudience: s.targetAudience,
          expectedOutcome: s.expectedOutcome,
          sortOrder: 0,
          monthlyPrice: 0,
          trialEnabled: true,
          trialDays: 7,
          requireRegistration: false,
          seriesId: seriesId ? String(seriesId) : undefined,
        });
        successCount++;
      } catch (e) {
        console.error("Failed to create big idea:", s.name, e);
      }
    }
    setIsCreating(false);
    toast({ title: `${successCount} Modul berhasil dibuat!`, description: "Sekarang tambahkan Chatbot di setiap Modul." });
    onCreated?.();
    handleClose();
  };

  const handleClose = () => {
    setStep("input");
    setTopic("");
    setReferenceText("");
    setUrls([""]);
    setCount(6);
    setSuggestions([]);
    setSelected(new Set());
    setUploadedFiles([]);
    setExtractError(null);
    setPendingFile(null);
    setIsDragOver(false);
    dragCounter.current = 0;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === "input" ? "Generate Modul dari Referensi" : `${suggestions.length} Saran Modul Ditemukan`}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Masukkan referensi (upload file, teks, URL, atau topik) — AI akan menyarankan Modul chatbot terbaik."
              : "Pilih Modul yang ingin langsung dibuat di ekosistem Anda."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-orange-500" />
                Topik / Bidang
              </Label>
              <Input
                placeholder="Contoh: Konstruksi gedung, SKK Sipil, ISO 9001, UMKM retail..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                data-testid="input-topic"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Teks Referensi
                <span className="text-xs text-muted-foreground font-normal">(paste manual dari dokumen)</span>
              </Label>
              <Textarea
                placeholder="Paste teks dari PDF, dokumen Word, modul pelatihan, catatan kuliah, artikel, atau konten apapun yang ingin dijadikan dasar saran..."
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                rows={5}
                className="resize-none"
                data-testid="textarea-reference"
              />
              <p className="text-xs text-muted-foreground">
                AI membaca hingga 8.000 karakter pertama · {totalReferenceChars.toLocaleString()} karakter total
                {uploadedFiles.length > 0 && ` (termasuk ${uploadedFiles.length} file)`}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-violet-500" />
                Upload File Referensi
                <span className="text-xs text-muted-foreground font-normal">(PDF, DOCX, TXT — maks 5 MB/file)</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file-upload"
              />

              {!pendingFile && (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
                    isDragOver
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
                    isExtracting && "pointer-events-none opacity-60"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="dropzone-file"
                >
                  {isExtracting ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Mengekstrak teks dari file...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className={cn("w-6 h-6", isDragOver ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-sm font-medium">{isDragOver ? "Lepaskan file di sini" : "Klik atau seret beberapa file ke sini"}</p>
                      <p className="text-xs text-muted-foreground">PDF, DOCX, atau TXT (maks 5 MB per file)</p>
                    </div>
                  )}
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2" data-testid="list-uploaded-files">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-green-500/5 border-green-500/30"
                      data-testid={`uploaded-file-${index}`}
                    >
                      <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)} · {file.charCount.toLocaleString()} karakter diekstrak
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {pendingFile && (
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 overflow-hidden" data-testid="preview-panel">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-violet-500/20 bg-violet-500/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span className="text-xs font-medium truncate text-violet-800 dark:text-violet-200">{pendingFile.name}</span>
                      <span className="text-xs text-violet-600 dark:text-violet-400 shrink-0">· {pendingFile.charCount.toLocaleString()} karakter</span>
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Pratinjau konten:</p>
                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap break-words font-mono bg-background/60 rounded p-2 border border-border/50 max-h-28 overflow-y-auto" data-testid="preview-content">
                      {pendingFile.text.slice(0, 500)}{pendingFile.text.length > 500 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 px-3 pb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={handleCancelPending}
                      data-testid="button-cancel-file"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Batalkan
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={handleConfirmPending}
                      data-testid="button-confirm-file"
                    >
                      <FileCheck className="w-3 h-3 mr-1" />
                      Tambahkan
                    </Button>
                  </div>
                </div>
              )}

              {extractError && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {extractError}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-green-500" />
                URL Referensi
                <span className="text-xs text-muted-foreground font-normal">(link YouTube, artikel, website)</span>
              </Label>
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    {url.includes("youtube.com") || url.includes("youtu.be") ? (
                      <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <Input
                      placeholder="https://youtube.com/watch?v=... atau https://artikel.com/..."
                      value={url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      className="flex-1"
                      data-testid={`input-url-${i}`}
                    />
                  </div>
                  {urls.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeUrl(i)} className="shrink-0 h-9 w-9 text-destructive">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addUrl} className="gap-1.5 text-xs">
                <Plus className="w-3 h-3" />
                Tambah URL
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>Jumlah Saran yang Dihasilkan</Label>
              <div className="flex gap-2">
                {[4, 6, 8, 10].map(n => (
                  <Button
                    key={n}
                    variant={count === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCount(n)}
                    data-testid={`button-count-${n}`}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={isGenerating || isExtracting}
              data-testid="button-generate"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />AI sedang menganalisis referensi...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate Saran Modul</>
              )}
            </Button>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("input")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Ubah referensi
              </button>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-primary hover:underline">Pilih semua</button>
                <span className="text-muted-foreground">·</span>
                <button onClick={clearAll} className="text-muted-foreground hover:text-foreground hover:underline">Hapus pilihan</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((s, i) => {
                const cfg = typeConfig[s.type] || typeConfig.idea;
                const TypeIcon = cfg.icon;
                const isChecked = selected.has(i);
                return (
                  <Card
                    key={i}
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      isChecked ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border"
                    )}
                    onClick={() => toggleSelect(i)}
                    data-testid={`card-suggestion-${i}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelect(i)}
                          className="mt-0.5 shrink-0"
                          data-testid={`checkbox-suggestion-${i}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className="font-semibold text-sm leading-tight">{s.name}</h4>
                            <Badge variant="outline" className={cn("text-xs gap-1 shrink-0", cfg.color)}>
                              <TypeIcon className="w-3 h-3" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{s.description}</p>
                          <div className="flex items-start gap-1.5 mb-2">
                            <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground">{s.targetAudience}</span>
                          </div>
                          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              <span className="font-semibold">Kenapa menarik: </span>{s.reasoning}
                            </p>
                          </div>
                          {s.goals && s.goals.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {s.goals.slice(0, 3).map((g, gi) => (
                                <span key={gi} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setStep("input"); handleGenerate(); }}
                disabled={isGenerating || isCreating}
                className="gap-1.5"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Ulang
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleCreateSelected}
                disabled={selected.size === 0 || isCreating}
                data-testid="button-create-selected"
              >
                {isCreating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Membuat {selected.size} Modul...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />Buat {selected.size} Modul Terpilih</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
