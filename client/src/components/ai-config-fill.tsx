import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Wand2, Search, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export type AiConfigLevel = "bigidea" | "toolbox" | "agent-persona" | "agent-policy";

interface AiConfigFillProps {
  level: AiConfigLevel;
  parentContext?: {
    seriesName?: string;
    bigIdeaName?: string;
    toolboxName?: string;
    agentName?: string;
  };
  onFill: (result: Record<string, any>) => void;
  compact?: boolean;
  defaultTopic?: string;
  placeholder?: string;
}

const LEVEL_LABELS: Record<AiConfigLevel, string> = {
  bigidea: "Modul (BigIdea)",
  toolbox: "Chatbot (Toolbox)",
  "agent-persona": "Persona Agen",
  "agent-policy": "Kebijakan Agen",
};

const LEVEL_PLACEHOLDERS: Record<AiConfigLevel, string> = {
  bigidea: "Contoh: Kepatuhan SBU & Klasifikasi Jasa Konstruksi",
  toolbox: "Contoh: Asisten Perizinan SKK Tenaga Ahli",
  "agent-persona": "Contoh: Spesialis hukum konstruksi untuk kontraktor",
  "agent-policy": "Contoh: Chatbot kepatuhan regulasi perusahaan konstruksi",
};

type Stage = "idle" | "openclaw" | "multiclaw" | "done";

export function AiConfigFill({
  level,
  parentContext = {},
  onFill,
  compact = false,
  defaultTopic = "",
  placeholder,
}: AiConfigFillProps) {
  const [expanded, setExpanded] = useState(false);
  const [topic, setTopic] = useState(defaultTopic);
  const [stage, setStage] = useState<Stage>("idle");
  const [domainInfo, setDomainInfo] = useState<{ label?: string; subdomains?: string[] } | null>(null);
  const { toast } = useToast();

  const isGenerating = stage === "openclaw" || stage === "multiclaw";

  const stageLabel: Record<Stage, string> = {
    idle: "",
    openclaw: "OpenClaw: memetakan domain...",
    multiclaw: "MultiClaw: menyintesis semua field...",
    done: "Selesai!",
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topik diperlukan",
        description: "Masukkan topik atau deskripsi singkat tentang chatbot ini.",
        variant: "destructive",
      });
      return;
    }
    setStage("openclaw");
    setDomainInfo(null);
    try {
      setStage("multiclaw");
      const data = await apiRequest("POST", "/api/ai/generate-config", {
        level,
        topic: topic.trim(),
        parentContext,
      });

      if (data?.domainAnalysis) {
        setDomainInfo({
          label: data.domainAnalysis.domainLabel,
          subdomains: data.domainAnalysis.coreSubdomains,
        });
      }

      if (data?.result && Object.keys(data.result).length > 0) {
        setStage("done");
        onFill(data.result);

        const fieldCount = Object.values(data.result).filter((v) =>
          v !== null && v !== undefined && v !== "" && (!Array.isArray(v) || v.length > 0)
        ).length;

        toast({
          title: "✨ Semua field berhasil diisi!",
          description: `${fieldCount} field ${LEVEL_LABELS[level]} terisi oleh AI. Periksa dan sesuaikan seperlunya.`,
        });
        setTimeout(() => {
          setStage("idle");
          if (!compact) setExpanded(false);
        }, 2500);
      } else {
        throw new Error("Hasil generate kosong");
      }
    } catch (err: any) {
      setStage("idle");
      toast({
        title: "Gagal generate",
        description: err?.message || "Coba lagi atau isi field secara manual.",
        variant: "destructive",
      });
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={placeholder || LEVEL_PLACEHOLDERS[level]}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          disabled={isGenerating}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="gap-1.5 shrink-0 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
          data-testid="button-ai-config-fill"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {isGenerating ? "Proses..." : "AI Fill"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        expanded || stage !== "idle"
          ? "border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-950/20"
          : "border-dashed border-violet-200 dark:border-violet-800 bg-transparent"
      )}
    >
      <button
        type="button"
        onClick={() => !isGenerating && setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
            {stage === "done" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : isGenerating ? (
              <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
              ✨ Isi dengan AI — OpenClaw/MultiClaw
            </p>
            {isGenerating ? (
              <p className="text-xs text-violet-600 dark:text-violet-400 animate-pulse">
                {stageLabel[stage]}
              </p>
            ) : stage === "done" ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Semua field berhasil diisi otomatis ✓
              </p>
            ) : (
              <p className="text-xs text-violet-600 dark:text-violet-400">
                Generate semua field {LEVEL_LABELS[level]} otomatis dari satu topik
              </p>
            )}
          </div>
        </div>
        {!isGenerating && (
          expanded ? (
            <ChevronUp className="h-4 w-4 text-violet-500 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-violet-500 shrink-0" />
          )
        )}
      </button>

      {(expanded || isGenerating) && (
        <div className="px-4 pb-4 space-y-3 border-t border-violet-200 dark:border-violet-700 pt-3">
          {/* Hierarchy context chip */}
          {Object.values(parentContext).some(Boolean) && (
            <div className="text-xs text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-900/30 rounded px-2 py-1.5">
              <span className="font-medium">Konteks:</span>{" "}
              {[
                parentContext.seriesName && `Series: ${parentContext.seriesName}`,
                parentContext.bigIdeaName && `Modul: ${parentContext.bigIdeaName}`,
                parentContext.toolboxName && `Chatbot: ${parentContext.toolboxName}`,
                parentContext.agentName && `Agen: ${parentContext.agentName}`,
              ].filter(Boolean).join(" → ")}
            </div>
          )}

          {/* Topic input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-violet-700 dark:text-violet-300 font-medium">
              Topik / Deskripsi Domain
            </Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={placeholder || LEVEL_PLACEHOLDERS[level]}
              className="border-violet-200 dark:border-violet-700 focus-visible:ring-violet-400"
              onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleGenerate()}
              disabled={isGenerating}
              data-testid="input-ai-topic"
            />
          </div>

          {/* Stage progress indicator */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
                  stage === "openclaw"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                )}>
                  {stage === "openclaw" ? (
                    <><Search className="h-3 w-3 animate-pulse" /> OpenClaw: Memetakan domain...</>
                  ) : (
                    <><CheckCircle2 className="h-3 w-3" /> OpenClaw: Domain terpetakan</>
                  )}
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
                  stage === "multiclaw"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    : "bg-muted text-muted-foreground"
                )}>
                  {stage === "multiclaw" ? (
                    <><Zap className="h-3 w-3 animate-pulse" /> MultiClaw: Sintesis field...</>
                  ) : (
                    <><Zap className="h-3 w-3" /> MultiClaw: Menunggu...</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Domain analysis result preview */}
          {domainInfo && !isGenerating && (
            <div className="text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded px-2.5 py-2 space-y-1">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">Domain dipetakan: {domainInfo.label}</p>
              {domainInfo.subdomains && domainInfo.subdomains.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {domainInfo.subdomains.map((sd, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] h-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0">
                      {sd}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How it works description */}
          {!isGenerating && (
            <p className="text-xs text-muted-foreground">
              <strong>Tahap 1 — OpenClaw:</strong> AI memetakan sub-domain, stakeholder, pain points & regulasi. <strong>Tahap 2 — MultiClaw:</strong> AI mensintesis peta domain menjadi isian lengkap semua field.
            </p>
          )}

          {/* Generate button */}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60"
            data-testid="button-ai-generate-config"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {stage === "openclaw" ? "OpenClaw memetakan domain..." : "MultiClaw mensintesis field..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate &amp; Isi Semua Field Otomatis
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
