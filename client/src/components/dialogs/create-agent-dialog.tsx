import { useState, useEffect } from "react";
import { Bot, ChevronLeft, ChevronRight, Sparkles, PenLine, Wrench, Lightbulb, Network, Scale, Loader2, CheckCircle2, FileDown, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCreateAgent } from "@/hooks/use-agents";
import { useActiveToolbox } from "@/hooks/use-toolboxes";
import { useActiveBigIdea } from "@/hooks/use-big-ideas";
import { categories, getCategoryById } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { TemplateDialog } from "./template-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertAgent } from "@shared/schema";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forceOrchestrator?: boolean;
  onCreated?: () => void;
  bigIdea?: { id: number | string; name: string } | null;
  toolbox?: { id: number | string; name: string } | null;
  series?: { id: number | string; name: string } | null;
}

type Step = "start" | "category" | "subcategory" | "details";

export function CreateAgentDialog({ open, onOpenChange, forceOrchestrator, onCreated, bigIdea: bigIdeaProp, toolbox: toolboxProp, series: seriesProp }: CreateAgentDialogProps) {
  const { toast } = useToast();
  const createAgent = useCreateAgent();
  const { data: activeToolboxFromApi } = useActiveToolbox();
  const { data: activeBigIdeaFromApi } = useActiveBigIdea();

  // Gunakan props dari parent (sudah divalidasi konteks series) jika tersedia
  const activeToolbox = toolboxProp !== undefined ? toolboxProp : activeToolboxFromApi;
  const activeBigIdea = bigIdeaProp !== undefined ? bigIdeaProp : activeBigIdeaFromApi;

  const [step, setStep] = useState<Step>(forceOrchestrator ? "category" : "start");
  const [lexcomSeedDone, setLexcomSeedDone] = useState(false);

  const seedLexComMutation = useMutation({
    mutationFn: async (seriesId: string | number) => {
      const res = await apiRequest("POST", "/api/lexcom/seed", { seriesId });
      return res.json();
    },
    onSuccess: (data) => {
      setLexcomSeedDone(true);
      queryClient.invalidateQueries({ queryKey: ["/api/big-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      if (data.skipped) {
        toast({ title: "Sudah Ada", description: "Ekosistem LexCom sudah ada di series ini." });
      } else {
        toast({
          title: "LexCom Berhasil Ditambahkan! ⚖️",
          description: data.message || "13 agen hukum siap digunakan.",
        });
      }
      onCreated?.();
    },
    onError: (error: any) => {
      const msg = error?.message || "Gagal membuat ekosistem LexCom.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateInitialCategory, setTemplateInitialCategory] = useState<string | undefined>(undefined);
  const [savedBlueprint, setSavedBlueprint] = useState<{
    namaAI: string; domain: string; persona: string; sasaranPengguna: string;
    fiturUtama: string[]; systemPromptHint: string; langkahSelanjutnya: string[];
    status?: string; createdAt?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem("gustafta_blueprint_pending");
        if (raw) {
          const parsed = JSON.parse(raw);
          setSavedBlueprint(parsed);
        }
      } catch { setSavedBlueprint(null); }
    }
  }, [open]);

  const handleImportBlueprint = () => {
    if (!savedBlueprint) return;
    setIsOrchestrator(false);
    setFormData({
      name: savedBlueprint.namaAI,
      tagline: savedBlueprint.domain,
      description: `${savedBlueprint.persona}\n\nSasaran pengguna: ${savedBlueprint.sasaranPengguna}`,
      category: "",
      subcategory: "",
      systemPrompt: savedBlueprint.systemPromptHint,
    });
    setStep("details");
  };
  const [isOrchestrator, setIsOrchestrator] = useState(forceOrchestrator || false);

  useEffect(() => {
    if (open && forceOrchestrator) {
      setIsOrchestrator(true);
      setStep("category");
    }
  }, [open, forceOrchestrator]);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    tagline: string;
    category: string;
    subcategory: string;
  } & Partial<InsertAgent>>({
    name: "",
    description: "",
    tagline: "",
    category: "",
    subcategory: "",
  });

  const selectedCategory = getCategoryById(formData.category);

  const handleCategorySelect = (categoryId: string) => {
    setFormData({ ...formData, category: categoryId, subcategory: "" });
    setStep("subcategory");
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setFormData({ ...formData, subcategory: subcategoryId });
    setStep("details");
  };

  const handleBack = () => {
    if (step === "category") {
      if (forceOrchestrator) {
        handleClose(false);
      } else {
        setStep("start");
      }
    } else if (step === "subcategory") {
      setStep("category");
    } else if (step === "details") {
      setStep("subcategory");
    }
  };

  const handleTemplateSelect = (template: Partial<InsertAgent>) => {
    setFormData({
      ...formData,
      ...template,
      name: template.name || "",
      description: template.description || "",
      tagline: template.tagline || "",
    });
    setStep("details");
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Masukkan nama untuk alat bantu Anda.",
        variant: "destructive",
      });
      return;
    }

    if (!activeToolbox) {
      toast({
        title: "Validation Error",
        description: isOrchestrator 
          ? "Chatbot belum dipilih. Silakan masuk ke Chatbot terlebih dahulu."
          : "Alat Bantu membutuhkan Chatbot yang aktif. Silakan pilih Chatbot terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    const agentData: Partial<InsertAgent> = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      tagline: formData.tagline.trim(),
      toolboxId: activeToolbox?.id ? String(activeToolbox.id) : undefined,
      bigIdeaId: activeBigIdea?.id ? String(activeBigIdea.id) : undefined,
      isOrchestrator: isOrchestrator,
    };

    createAgent.mutate(
      agentData as InsertAgent,
      {
        onSuccess: () => {
          onCreated?.();
          // Mark Blueprint as imported if it was used
          try {
            const raw = localStorage.getItem("gustafta_blueprint_pending");
            if (raw) {
              const bp = JSON.parse(raw);
              if (bp.namaAI === formData.name) {
                localStorage.setItem("gustafta_blueprint_pending", JSON.stringify({ ...bp, status: "imported" }));
              }
            }
          } catch { /* ignore */ }
          toast({
            title: "Alat Bantu Dibuat",
            description: `${formData.name} berhasil dibuat.`,
          });
          onOpenChange(false);
          setFormData({ name: "", description: "", tagline: "", category: "", subcategory: "" });
          setStep("start");
        },
        onError: (error: any) => {
          let title = "Error";
          let description = "Gagal membuat alat bantu. Silakan coba lagi.";
          
          try {
            const errorData = error?.response?.data || error?.data || error;
            if (errorData?.code === "NO_SUBSCRIPTION") {
              title = "Langganan Diperlukan";
              description = "Silakan berlangganan terlebih dahulu untuk membuat alat bantu.";
            } else if (errorData?.code === "SUBSCRIPTION_EXPIRED") {
              title = "Langganan Habis";
              description = "Langganan Anda sudah habis. Silakan perpanjang untuk membuat alat bantu baru.";
            } else if (errorData?.code === "LIMIT_REACHED") {
              title = "Batas Alat Bantu Tercapai";
              description = errorData?.message || "Upgrade paket untuk menambah alat bantu.";
            } else if (errorData?.message) {
              description = errorData.message;
            }
          } catch (e) {
            // Use default error message
          }
          
          toast({
            title,
            description,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("start");
      setIsOrchestrator(false);
      setFormData({ name: "", description: "", tagline: "", category: "", subcategory: "" });
      setLexcomSeedDone(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isOrchestrator ? "bg-purple-500/10" : "bg-primary/10"
            )}>
              {isOrchestrator ? (
                <Network className="w-4 h-4 text-purple-500" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
              )}
            </div>
            {step === "start" && "Buat Alat Bantu Baru"}
            {step === "category" && (isOrchestrator ? "Kategori Orkestrator" : "Pilih Kategori")}
            {step === "subcategory" && selectedCategory?.label}
            {step === "details" && (isOrchestrator ? "Detail Orkestrator" : "Detail Alat Bantu")}
          </DialogTitle>
          <DialogDescription>
            {step === "start" && "Pilih cara untuk memulai pembuatan alat bantu"}
            {step === "category" && (isOrchestrator ? "Pilih kategori untuk Orkestrator Anda" : "Pilih kategori untuk alat bantu Anda")}
            {step === "subcategory" && "Pilih peran atau profesi spesifik"}
            {step === "details" && (isOrchestrator ? "Konfigurasi Orkestrator Anda" : "Konfigurasi informasi dasar alat bantu Anda")}
          </DialogDescription>
        </DialogHeader>

        {step === "start" && (
          <div className="space-y-4 py-4">
            {(activeToolbox || activeBigIdea) && (
              <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                <p className="text-xs text-muted-foreground">Alat Bantu akan dibuat dalam konteks:</p>
                <div className="flex flex-wrap gap-2">
                  {activeBigIdea && (
                    <Badge variant="outline" className="gap-1">
                      <Lightbulb className="h-3 w-3" />
                      {activeBigIdea.name}
                    </Badge>
                  )}
                  {activeToolbox && (
                    <Badge variant="secondary" className="gap-1">
                      <Wrench className="h-3 w-3" />
                      {activeToolbox.name}
                    </Badge>
                  )}
                  {isOrchestrator && (
                    <Badge className="gap-1 bg-purple-500/20 text-purple-600 border-purple-500/30">
                      <Network className="h-3 w-3" />
                      Orkestrator
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Orchestrator Option - Only show when Big Idea is active */}
            {activeBigIdea && (
              <Card
                className={cn(
                  "cursor-pointer transition-all hover-elevate border-2",
                  isOrchestrator ? "border-purple-500 bg-purple-500/5" : "border-transparent"
                )}
                onClick={() => {
                  setIsOrchestrator(true);
                  setStep("category");
                }}
               
              >
                <CardHeader className="pb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 w-fit">
                    <Network className="w-5 h-5 text-purple-500" />
                  </div>
                  <CardTitle className="text-base mt-2">Buat Orkestrator</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Orkestrator utama untuk Modul "{activeBigIdea.name}". Berfungsi sebagai pintu masuk dan pengarah ke chatbot-chatbot lainnya.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
            
            {/* ── BLUEPRINT IMPORT BANNER ── */}
            {savedBlueprint && (
              <Card
                className="cursor-pointer transition-all hover-elevate border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
                onClick={handleImportBlueprint}
                data-testid="card-import-blueprint"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 w-fit">
                        <FileDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-amber-800 dark:text-amber-300">✨ Import Blueprint AI Anda</CardTitle>
                        <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">{savedBlueprint.namaAI} · {savedBlueprint.domain}</p>
                      </div>
                    </div>
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-amber-700 dark:text-amber-400">
                    Blueprint dari sesi Socratic Dialog siap diimport. Nama, persona, dan system prompt akan terisi otomatis — tinggal lengkapi detail dan rakit chatbot Anda.
                  </CardDescription>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(savedBlueprint.fiturUtama ?? []).slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">{f}</span>
                    ))}
                    {(savedBlueprint.fiturUtama ?? []).length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700">+{(savedBlueprint.fiturUtama ?? []).length - 3} lainnya</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className="cursor-pointer transition-all hover-elevate"
                onClick={() => {
                  setIsOrchestrator(false);
                  setTemplateInitialCategory(undefined);
                  setTemplateDialogOpen(true);
                }}
                data-testid="card-use-template"
              >
                <CardHeader className="pb-2">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base mt-2">Gunakan Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {activeToolbox 
                      ? `Buat alat bantu untuk Chatbot "${activeToolbox.name}" dengan template siap pakai.`
                      : "Mulai dengan template siap pakai untuk berbagai industri."}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover-elevate"
                onClick={() => {
                  setIsOrchestrator(false);
                  setStep("category");
                }}
                data-testid="card-start-from-scratch"
              >
                <CardHeader className="pb-2">
                  <div className="p-2 rounded-lg bg-muted w-fit">
                    <PenLine className="w-5 h-5 text-foreground" />
                  </div>
                  <CardTitle className="text-base mt-2">Mulai dari Awal</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {activeToolbox 
                      ? `Buat alat bantu untuk Chatbot "${activeToolbox.name}" dari awal.`
                      : "Buat alat bantu custom dengan konfigurasi sendiri."}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Card
              className="cursor-pointer transition-all hover-elevate border-amber-200 dark:border-amber-800/40 hover:border-amber-400"
              onClick={() => {
                setIsOrchestrator(false);
                setTemplateInitialCategory("LexCom Spesialis Hukum");
                setTemplateDialogOpen(true);
              }}
              data-testid="card-lexcom-specialist"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 w-fit">
                    <Scale className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">⚖️ LexCom — Spesialis Hukum Indonesia</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tambahkan agen spesialis hukum dari sistem LexCom: Hukum Pidana, Perdata, Korporasi, Pajak, Pertanahan, Ketenagakerjaan, Litigasi, Kepailitan, dan lainnya. Tersedia 12 template siap pakai dengan sistem prompt lengkap berbasis hukum Indonesia.
                </CardDescription>
              </CardContent>
            </Card>

            {seriesProp && (
              <Card
                className={cn(
                  "transition-all border-2",
                  lexcomSeedDone
                    ? "border-green-500 bg-green-500/5 cursor-default"
                    : seedLexComMutation.isPending
                    ? "border-purple-400 bg-purple-500/5 cursor-default opacity-80"
                    : "cursor-pointer hover-elevate border-purple-200 dark:border-purple-800/40 hover:border-purple-500"
                )}
                onClick={() => {
                  if (!lexcomSeedDone && !seedLexComMutation.isPending) {
                    seedLexComMutation.mutate(seriesProp.id);
                  }
                }}
                data-testid="card-setup-lexcom-ecosystem"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 w-fit">
                      {lexcomSeedDone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : seedLexComMutation.isPending ? (
                        <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
                      ) : (
                        <Network className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {lexcomSeedDone
                          ? "✅ Ekosistem LexCom Ditambahkan"
                          : seedLexComMutation.isPending
                          ? "Menyiapkan ekosistem..."
                          : "🚀 Setup Ekosistem LexCom Lengkap"}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {lexcomSeedDone
                      ? `Ekosistem LexCom berhasil ditambahkan ke series "${seriesProp.name}". 1 Orchestrator + 17 agen spesialis hukum siap digunakan.`
                      : seedLexComMutation.isPending
                      ? "Sedang membuat LEX-ORCHESTRATOR dan 17 agen spesialis hukum..."
                      : `Tambahkan LEX-ORCHESTRATOR + 17 agen spesialis hukum sekaligus ke series "${seriesProp.name}". Satu klik, siap pakai.`}
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <TemplateDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          onSelectTemplate={handleTemplateSelect}
          initialCategory={templateInitialCategory}
        />

        {step === "category" && (
          <ScrollArea className="h-[400px] pr-4">
            {forceOrchestrator && activeBigIdea && (
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-1 mb-3">
                <p className="text-xs text-muted-foreground">Orkestrator untuk Modul:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Lightbulb className="h-3 w-3" />
                    {activeBigIdea.name}
                  </Badge>
                  <Badge className="gap-1 bg-purple-500/20 text-purple-600 border-purple-500/30">
                    <Network className="h-3 w-3" />
                    Orkestrator (di atas semua Chatbot)
                  </Badge>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors hover-elevate",
                      "text-center"
                    )}
                   
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {step === "subcategory" && selectedCategory && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {selectedCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategorySelect(sub.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border transition-colors hover-elevate text-left"
                  )}
                 
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{sub.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4 py-4">
            {/* Blueprint import indicator */}
            {savedBlueprint && formData.name === savedBlueprint.namaAI && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                <FileDown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Diimport dari Blueprint AI</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">Nama, tagline, deskripsi, dan system prompt sudah terisi dari Blueprint Anda. Lengkapi field dan simpan untuk mulai merakit chatbot.</p>
                  {(savedBlueprint.fiturUtama ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(savedBlueprint.fiturUtama ?? []).map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedCategory && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <selectedCategory.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">
                  {selectedCategory.label} &gt; {selectedCategory.subcategories.find(s => s.id === formData.subcategory)?.label}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Assistant"
               
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-tagline">Tagline</Label>
              <Input
                id="create-tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Your helpful AI companion"
               
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan fungsi alat bantu ini..."
                rows={3}
               
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== "start" && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Batal
          </Button>
          {step === "details" && (
            <Button
              onClick={handleCreate}
              disabled={createAgent.isPending}
             
            >
              {createAgent.isPending ? "Membuat..." : "Buat Alat Bantu"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
