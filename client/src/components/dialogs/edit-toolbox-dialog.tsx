import { useState, useEffect } from "react";
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
import { useUpdateToolbox } from "@/hooks/use-toolboxes";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, X } from "lucide-react";
import type { Toolbox } from "@shared/schema";
import { AiConfigFill } from "@/components/ai-config-fill";

interface EditToolboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolbox: Toolbox;
}

export function EditToolboxDialog({ open, onOpenChange, toolbox }: EditToolboxDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([""]);
  const [limitations, setLimitations] = useState<string[]>([""]);

  const updateToolbox = useUpdateToolbox();
  const { toast } = useToast();

  useEffect(() => {
    if (open && toolbox) {
      setName(toolbox.name || "");
      setDescription(toolbox.description || "");
      setPurpose(toolbox.purpose || "");
      setCapabilities(
        Array.isArray(toolbox.capabilities) && (toolbox.capabilities as string[]).length > 0
          ? (toolbox.capabilities as string[])
          : [""]
      );
      setLimitations(
        Array.isArray(toolbox.limitations) && (toolbox.limitations as string[]).length > 0
          ? (toolbox.limitations as string[])
          : [""]
      );
    }
  }, [open, toolbox]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Nama chatbot wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateToolbox.mutateAsync({
        id: String(toolbox.id),
        data: {
          name: name.trim(),
          description: description.trim(),
          purpose: purpose.trim(),
          capabilities: capabilities.filter(c => c.trim()),
          limitations: limitations.filter(l => l.trim()),
        },
      });

      toast({
        title: "Berhasil",
        description: "Chatbot berhasil diperbarui",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memperbarui Chatbot",
        variant: "destructive",
      });
    }
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
    if (list.length > 1) setList(list.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-500" />
            Edit Chatbot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AiConfigFill
            level="toolbox"
            parentContext={{}}
            defaultTopic={toolbox.name}
            onFill={(result) => {
              if (result.name) setName(result.name);
              if (result.description) setDescription(result.description);
              if (result.purpose) setPurpose(result.purpose);
              if (Array.isArray(result.capabilities) && result.capabilities.length > 0) setCapabilities(result.capabilities);
              if (Array.isArray(result.limitations) && result.limitations.length > 0) setLimitations(result.limitations);
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="edit-tb-name">Nama Chatbot *</Label>
            <Input
              id="edit-tb-name"
              placeholder="Contoh: SBU & Klasifikasi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-edit-toolbox-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tb-description">Deskripsi</Label>
            <Textarea
              id="edit-tb-description"
              placeholder="Jelaskan tentang chatbot ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-edit-toolbox-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tb-purpose">Tujuan Chatbot</Label>
            <Textarea
              id="edit-tb-purpose"
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
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFromList(capabilities, setCapabilities, index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setCapabilities([...capabilities, ""])} className="w-full">
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
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFromList(limitations, setLimitations, index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLimitations([...limitations, ""])} className="w-full">
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
              disabled={updateToolbox.isPending}
              data-testid="button-save-toolbox"
            >
              {updateToolbox.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
