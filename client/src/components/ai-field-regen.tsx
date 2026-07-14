import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Check, X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface AiFieldRegenProps {
  fieldName: string;
  fieldLabel?: string;
  currentValue?: string;
  agentContext?: {
    agentName?: string;
    agentDescription?: string;
    systemPromptSnippet?: string;
    toolboxName?: string;
    bigIdeaName?: string;
  };
  level?: "agent-persona" | "agent-policy";
  onApply: (value: string) => void;
  className?: string;
}

export function AiFieldRegen({
  fieldName,
  fieldLabel,
  currentValue = "",
  agentContext = {},
  level = "agent-persona",
  onApply,
  className,
}: AiFieldRegenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<{ value: string; rationale: string } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverOpen]);

  const handleRegen = async () => {
    setIsGenerating(true);
    setPreview(null);
    setPopoverOpen(false);
    try {
      const data = await apiRequest("POST", "/api/ai/regen-field", {
        fieldName,
        fieldLabel,
        currentValue,
        agentContext,
        level,
      });
      if (data?.value) {
        setPreview({ value: data.value, rationale: data.rationale || "" });
        setPopoverOpen(true);
      } else {
        throw new Error("Hasil kosong");
      }
    } catch (err: any) {
      toast({
        title: "Gagal regenerasi",
        description: err?.message || "Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (preview) {
      onApply(preview.value);
      setPreview(null);
      setPopoverOpen(false);
      toast({
        title: "Diterapkan ✓",
        description: `"${fieldLabel || fieldName}" diperbarui oleh AI.`,
      });
    }
  };

  const handleDismiss = () => {
    setPreview(null);
    setPopoverOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-flex shrink-0", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={preview && popoverOpen ? () => setPopoverOpen(!popoverOpen) : handleRegen}
        disabled={isGenerating}
        className="h-6 w-6 p-0 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
        title={`Regenerasi "${fieldLabel || fieldName}" dengan AI`}
        data-testid={`button-ai-regen-${fieldName}`}
      >
        {isGenerating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : preview ? (
          <Wand2 className="h-3.5 w-3.5 text-violet-600" />
        ) : (
          <Wand2 className="h-3.5 w-3.5" />
        )}
      </Button>

      {preview && popoverOpen && (
        <div className="absolute right-0 top-7 z-50 w-80 rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-card shadow-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
              <Wand2 className="h-3 w-3" />
              AI Suggestion
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {preview.rationale && (
            <p className="text-[11px] text-violet-600 dark:text-violet-400 italic border-b border-violet-100 dark:border-violet-800 pb-2">
              💡 {preview.rationale}
            </p>
          )}
          <p className="text-sm text-foreground leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap">
            {preview.value}
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="flex-1 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1"
            >
              <Check className="h-3 w-3" />
              Terapkan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => { handleDismiss(); handleRegen(); }}
              disabled={isGenerating}
              className="h-7 text-xs gap-1 text-muted-foreground"
              title="Buat ulang"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
