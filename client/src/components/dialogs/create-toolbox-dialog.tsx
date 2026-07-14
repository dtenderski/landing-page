import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateToolbox } from "@/hooks/use-toolboxes";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, X, AlertCircle, Lightbulb } from "lucide-react";
import type { BigIdea } from "@shared/schema";
import { AiConfigFill } from "@/components/ai-config-fill";

interface CreateToolboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bigIdea: BigIdea | undefined;
  activeSeriesId?: string | null;
  onCreateModule?: () => void;
  onCreated?: () => void;
}

export function CreateToolboxDialog({ open, onOpenChange, bigIdea, activeSeriesId, onCreateModule, onCreated }: CreateToolboxDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([""]);
  const [limitations, setLimitations] = useState<string[]>([""]);
  
  const createToolbox = useCreateToolbox();
  const { toast } = useToast();

  // Detect if the bigIdea belongs to a DIFFERENT series than the current one
  const hasModuleMismatch = bigIdea && activeSeriesId
    ? String(bigIdea.seriesId) !== String(activeSeriesId)
    : false;
  const noModuleForSeries = !bigIdea || hasModuleMismatch;

  const handleSubmit = async () => {
    if (!bigIdea || noModuleForSeries) {
      toast({
        title: "Modul belum dipilih",
        description: "Buat Modul terlebih dahulu untuk series ini.",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Nama chatbot wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      await createToolbox.mutateAsync({
        bigIdeaId: bigIdea.id,
        isOrchestrator: false,
        name: name.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        capabilities: capabilities.filter(c => c.trim()),
        limitations: limitations.filter(l => l.trim()),
        sortOrder: 0,
      });
      onCreated?.();
      
      toast({
        title: "Berhasil",
        description: "Chatbot berhasil dibuat",
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat Chatbot",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPurpose("");
    setCapabilities([""]);
    setLimitations([""]);
  };

  const updateList = (
    list: string[],
    setList: (list: string[]) => void,
    index: number,
    value: string
  ) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const removeFromList = (
    list: string[],
    setList: (list: string[]) => void,
    index: number
  ) => {
    if (list.length > 1) {
      setList(list.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-500" />
            Buat Chatbot Baru
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Apa itu Chatbot?</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Chatbot adalah unit utuh yang menangani satu area operasional di bawah suatu Modul.
              Setiap Chatbot memiliki Alat Bantu (modul spesifik) di dalamnya.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Contoh: Dari Modul "Kepatuhan & Compliance", Anda bisa membuat Chatbot untuk
              "SBU & Klasifikasi", "SKK & Tenaga Ahli", atau "Perijinan Usaha".
            </p>
          </div>

          {noModuleForSeries ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Belum ada Modul untuk Series ini</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Chatbot harus dibuat di bawah sebuah Modul. Buat Modul terlebih dahulu untuk
                    series ini, kemudian Anda bisa menambahkan Chatbot di dalamnya.
                  </p>
                </div>
              </div>
              {onCreateModule && (
                <Button
                  variant="outline"
                  className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
                  onClick={() => { onOpenChange(false); onCreateModule(); }}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Buat Modul Baru Sekarang
                </Button>
              )}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Dari Modul:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{bigIdea?.type}</Badge>
                  <span className="font-medium">{bigIdea?.name}</span>
                </div>
                {bigIdea?.description && (
                  <p className="text-sm text-muted-foreground mt-2">{bigIdea.description}</p>
                )}
              </div>

              <AiConfigFill
                level="toolbox"
                parentContext={{ bigIdeaName: bigIdea?.name || "" }}
                onFill={(result) => {
                  if (result.name) setName(result.name);
                  if (result.description) setDescription(result.description);
                  if (result.purpose) setPurpose(result.purpose);
                  if (Array.isArray(result.capabilities) && result.capabilities.length > 0) setCapabilities(result.capabilities);
                  if (Array.isArray(result.limitations) && result.limitations.length > 0) setLimitations(result.limitations);
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="name">Nama Chatbot *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: SBU & Klasifikasi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan tentang chatbot ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Tujuan Chatbot</Label>
                <Textarea
                  id="purpose"
                  placeholder="Tujuan utama dari chatbot ini..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Kapabilitas</Label>
                {capabilities.map((cap, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Kapabilitas ${index + 1}`}
                      value={cap}
                      onChange={(e) => updateList(capabilities, setCapabilities, index, e.target.value)}
                    />
                    {capabilities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromList(capabilities, setCapabilities, index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCapabilities([...capabilities, ""])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kapabilitas
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Batasan</Label>
                {limitations.map((lim, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Batasan ${index + 1}`}
                      value={lim}
                      onChange={(e) => updateList(limitations, setLimitations, index, e.target.value)}
                    />
                    {limitations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromList(limitations, setLimitations, index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLimitations([...limitations, ""])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Batasan
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createToolbox.isPending}
                >
                  {createToolbox.isPending ? "Membuat..." : "Buat Chatbot"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
