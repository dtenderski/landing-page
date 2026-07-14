import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckSquare, Calculator, AlertTriangle, TrendingUp, FileOutput, Wrench, MessageSquare, ExternalLink, ArrowRight, Sparkles, BarChart2, ClipboardList, Save, Copy, Check, ChevronDown, ChevronUp, Clock, Download, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { usePublicMiniApp, usePublicMiniAppResult, usePublicMiniAppResults, usePublicSubmitResult, usePublicGenerateDocument } from "@/hooks/use-mini-apps";
import type { MiniAppType, MiniApp, MiniAppResult } from "@shared/schema";
import { cn } from "@/lib/utils";

const typeIcons: Partial<Record<MiniAppType, typeof CheckSquare>> = {
  checklist: CheckSquare,
  calculator: Calculator,
  risk_assessment: AlertTriangle,
  progress_tracker: TrendingUp,
  document_generator: FileOutput,
  lead_capture_form: MessageSquare,
  scoring_assessment: BarChart2,
  gap_analysis: ClipboardList,
  recommendation_engine: Sparkles,
  rubric_scoring: BarChart2,
  risk_register: AlertTriangle,
  work_mode_selector: Sparkles,
};

const typeLabels: Partial<Record<MiniAppType, string>> = {
  checklist: "Checklist",
  calculator: "Kalkulator",
  risk_assessment: "Penilaian Risiko",
  progress_tracker: "Pelacak Progres",
  document_generator: "Generator Dokumen",
  lead_capture_form: "Formulir",
  scoring_assessment: "Penilaian & Scoring",
  gap_analysis: "Gap Analysis",
  recommendation_engine: "Rekomendasi",
  rubric_scoring: "Review & Rubric Scoring",
  risk_register: "Risk Register",
  work_mode_selector: "4 Work Modes",
};

const AI_TYPES: MiniAppType[] = [
  "project_snapshot", "decision_summary", "risk_radar", "issue_log", "action_tracker",
  "change_log", "scoring_assessment", "gap_analysis", "recommendation_engine",
  "nib_status_report", "whatsapp_status_update", "internal_project_report",
  "compliance_matrix", "tender_audit_report", "go_no_go_checklist",
  "pqp_document", "hse_plan", "executive_summary_penawaran", "metode_pelaksanaan",
  "rubric_scoring", "risk_register",
];

function SaveSuccessBadge({ savedAt }: { savedAt: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400" data-testid="save-success-badge">
      <Check className="w-3.5 h-3.5" />
      <span>Tersimpan {new Date(savedAt).toLocaleString("id-ID")}</span>
    </div>
  );
}

function ChecklistRunner({ config, name, slug, agentColor }: { config: Record<string, unknown>; name: string; slug: string; agentColor?: string }) {
  const items = ((config?.items ?? config?.checklist_items) as string[] | undefined) ?? [];
  const storageKey = `checklist-${slug}`;

  const [checked, setChecked] = useState<Record<number, boolean>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const submitResult = usePublicSubmitResult(slug);

  const total = items.length;
  const done = Object.values(checked).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggleItem = (idx: number, val: boolean) => {
    const next = { ...checked, [idx]: val };
    setChecked(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const handleSave = () => {
    const checkedItems = items.filter((_, idx) => checked[idx]);
    const uncheckedItems = items.filter((_, idx) => !checked[idx]);
    submitResult.mutate(
      {
        input: { checklist: items },
        output: {
          checked_items: checkedItems,
          unchecked_items: uncheckedItems,
          completion_percentage: pct,
          done,
          total,
          summary: `${done}/${total} item selesai (${pct}%)`,
        },
      },
      {
        onSuccess: () => {
          setSavedAt(new Date().toISOString());
        },
      }
    );
  };

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada item dalam checklist ini.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{done}/{total} selesai</span>
          <span className="text-sm font-medium">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <label key={idx} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`checklist-item-${idx}`}>
            <Checkbox
              checked={!!checked[idx]}
              onCheckedChange={(v) => toggleItem(idx, !!v)}
              className="mt-0.5"
            />
            <span className={cn("text-sm", checked[idx] && "line-through text-muted-foreground")}>{item}</span>
          </label>
        ))}
      </div>
      {pct === 100 && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Semua item selesai! ✓</p>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t">
        {savedAt ? (
          <SaveSuccessBadge savedAt={savedAt} />
        ) : (
          <span className="text-xs text-muted-foreground">Progress disimpan otomatis di browser ini</span>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={submitResult.isPending || done === 0}
          data-testid="button-save-checklist"
          style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
        >
          {submitResult.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-1.5" />
          )}
          Simpan Progress
        </Button>
      </div>
    </div>
  );
}

function safeEvalFormula(formula: string, scope: Record<string, number>): number | null {
  const substituted = formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) =>
    scope[match] !== undefined ? String(scope[match]) : "0"
  );
  if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(substituted)) return null;
  const tokens = substituted.match(/\d+\.?\d*|\+|-|\*|\/|\(|\)/g);
  if (!tokens) return null;
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  function parseExpr(): number {
    let left = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = consume();
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }
  function parseTerm(): number {
    let left = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = consume();
      const right = parseFactor();
      left = op === "*" ? left * right : right !== 0 ? left / right : 0;
    }
    return left;
  }
  function parseFactor(): number {
    const t = peek();
    if (t === "(") {
      consume();
      const val = parseExpr();
      consume();
      return val;
    }
    if (t === "-") { consume(); return -parseFactor(); }
    return parseFloat(consume() ?? "0");
  }
  try { return parseExpr(); } catch { return null; }
}

type CalcPreset = { name: string; inputs: string[]; formula: string; unit?: string };

function CalculatorRunner({ config, agentColor, slug }: { config: Record<string, unknown>; agentColor?: string; slug: string }) {
  const presets = (config?.presets as CalcPreset[] | undefined) ?? [];
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const submitResult = usePublicSubmitResult(slug);
  const preset = presets[selectedPreset];

  const calculate = () => {
    if (!preset) return;
    try {
      const scope: Record<string, number> = {};
      for (const key of (preset.inputs || [])) {
        scope[key] = parseFloat(inputs[key] || "0");
      }
      const val = safeEvalFormula(preset.formula, scope);
      if (val === null) { setResult(null); return; }
      const rules = config?.rules as { round_result?: number } | undefined;
      const rounded = rules?.round_result ? parseFloat(val.toFixed(rules.round_result)) : val;
      setResult(rounded);
      setSavedAt(null);
    } catch {
      setResult(null);
    }
  };

  const handleCopy = async () => {
    if (result === null || !preset) return;
    const text = `${preset.name}: ${result.toLocaleString("id-ID")}${preset.unit ? " " + preset.unit : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = () => {
    if (result === null || !preset) return;
    const scope: Record<string, number> = {};
    for (const key of (preset.inputs || [])) {
      scope[key] = parseFloat(inputs[key] || "0");
    }
    submitResult.mutate(
      {
        input: { preset: preset.name, values: scope },
        output: {
          preset: preset.name,
          result,
          unit: preset.unit || "",
          formula: preset.formula,
          summary: `${preset.name}: ${result.toLocaleString("id-ID")}${preset.unit ? " " + preset.unit : ""}`,
        },
      },
      {
        onSuccess: () => setSavedAt(new Date().toISOString()),
      }
    );
  };

  if (presets.length === 0) {
    return <p className="text-muted-foreground text-sm">Kalkulator belum dikonfigurasi.</p>;
  }

  return (
    <div className="space-y-4">
      {presets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <Button
              key={idx}
              variant={selectedPreset === idx ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectedPreset(idx); setInputs({}); setResult(null); setSavedAt(null); }}
              data-testid={`calc-preset-${idx}`}
            >
              {p.name}
            </Button>
          ))}
        </div>
      )}
      {preset && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{preset.name}</h4>
          {(preset.inputs || []).map((inputKey: string) => (
            <div key={inputKey} className="space-y-1">
              <Label>{inputKey.replace(/_/g, " ")}</Label>
              <Input
                type="number"
                value={inputs[inputKey] || ""}
                onChange={e => setInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                placeholder="0"
                data-testid={`calc-input-${inputKey}`}
              />
            </div>
          ))}
          <Button onClick={calculate} className="w-full" data-testid="button-calculate">
            Hitung
          </Button>
          {result !== null && (
            <div className="space-y-2">
              <div className="p-4 rounded-lg text-center border" style={{ backgroundColor: `${agentColor || "#6366f1"}0d`, borderColor: `${agentColor || "#6366f1"}33` }}>
                <p className="text-2xl font-bold">{result.toLocaleString("id-ID")}</p>
                {preset.unit && <p className="text-sm text-muted-foreground mt-1">{preset.unit}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCopy}
                  data-testid="button-copy-result"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copied ? "Disalin!" : "Salin Hasil"}
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={submitResult.isPending}
                  data-testid="button-save-result"
                  style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
                >
                  {submitResult.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Simpan Hasil
                </Button>
              </div>
              {savedAt && <SaveSuccessBadge savedAt={savedAt} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RiskAssessmentRunner({ config, slug, agentColor }: { config: Record<string, unknown>; slug: string; agentColor?: string }) {
  const categories = (config?.risk_categories as string[] | undefined) ?? ["Safety", "Quality", "Cost", "Schedule"];
  const [likelihood, setLikelihood] = useState(1);
  const [impact, setImpact] = useState(1);
  const [category, setCategory] = useState(categories[0] || "");
  const [description, setDescription] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submitResult = usePublicSubmitResult(slug);

  const score = likelihood * impact;
  const scoring = config?.scoring as { thresholds?: { low_max: number; medium_max: number; high_min: number } } | undefined;
  const thresholds = scoring?.thresholds ?? { low_max: 6, medium_max: 14, high_min: 15 };
  const level = score <= thresholds.low_max ? "Rendah" : score <= thresholds.medium_max ? "Sedang" : "Tinggi";
  const levelColor = score <= thresholds.low_max ? "text-green-600" : score <= thresholds.medium_max ? "text-yellow-600" : "text-red-600";
  const levelBg = score <= thresholds.low_max ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : score <= thresholds.medium_max ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";

  const getSummaryText = () =>
    `[${category}] ${description || "Tanpa deskripsi"} — Likelihood: ${likelihood}, Impact: ${impact}, Skor: ${score} (${level})`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = () => {
    submitResult.mutate(
      {
        input: { category, description, likelihood, impact },
        output: {
          score,
          level,
          category,
          description,
          likelihood,
          impact,
          summary: getSummaryText(),
        },
      },
      {
        onSuccess: () => setSavedAt(new Date().toISOString()),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Kategori Risiko</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: string) => (
            <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => { setCategory(cat); setSavedAt(null); }} data-testid={`risk-cat-${cat}`}>{cat}</Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Deskripsi Risiko</Label>
        <Input value={description} onChange={e => { setDescription(e.target.value); setSavedAt(null); }} placeholder="Deskripsi singkat risiko..." data-testid="risk-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Likelihood (1-5)</Label>
          <Input type="number" min={1} max={5} value={likelihood} onChange={e => { setLikelihood(Math.min(5, Math.max(1, parseInt(e.target.value) || 1))); setSavedAt(null); }} data-testid="risk-likelihood" />
        </div>
        <div className="space-y-2">
          <Label>Impact (1-5)</Label>
          <Input type="number" min={1} max={5} value={impact} onChange={e => { setImpact(Math.min(5, Math.max(1, parseInt(e.target.value) || 1))); setSavedAt(null); }} data-testid="risk-impact" />
        </div>
      </div>
      <div className={cn("p-4 rounded-lg border", levelBg)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Skor Risiko (L × I)</p>
            <p className="text-2xl font-bold mt-0.5">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Level</p>
            <p className={cn("text-xl font-bold mt-0.5", levelColor)}>{level}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleCopy}
          data-testid="button-copy-risk"
        >
          {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
          {copied ? "Disalin!" : "Salin Ringkasan"}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={handleSave}
          disabled={submitResult.isPending}
          data-testid="button-save-risk"
          style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
        >
          {submitResult.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          Simpan Penilaian
        </Button>
      </div>
      {savedAt && <SaveSuccessBadge savedAt={savedAt} />}
    </div>
  );
}

type Milestone = { name?: string };

function ProgressTrackerRunner({ config, slug, agentColor }: { config: Record<string, unknown>; slug: string; agentColor?: string }) {
  const milestones = (config?.milestones as Milestone[] | undefined) ?? [];
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const submitResult = usePublicSubmitResult(slug);

  const defaultItems = milestones.length > 0
    ? milestones.map((m, idx) => ({ key: String(idx), label: m.name || `Milestone ${idx + 1}` }))
    : ["Persiapan", "Pekerjaan Utama", "Finishing", "Serah Terima"].map(label => ({ key: label, label }));

  const average = defaultItems.length > 0
    ? Math.round(defaultItems.reduce((sum, item) => sum + (progress[item.key] || 0), 0) / defaultItems.length)
    : 0;

  const handleSave = () => {
    const progressData: Record<string, number> = {};
    defaultItems.forEach(item => { progressData[item.label] = progress[item.key] || 0; });
    submitResult.mutate(
      {
        input: { milestones: defaultItems.map(i => i.label) },
        output: {
          progress: progressData,
          average_progress: average,
          summary: `Rata-rata progres: ${average}%`,
        },
      },
      {
        onSuccess: () => setSavedAt(new Date().toISOString()),
      }
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Masukkan progres paket pekerjaan (0-100%):</p>
      {defaultItems.map((item) => (
        <div key={item.key} className={milestones.length > 0 ? "p-3 rounded-lg border space-y-2" : "space-y-1"}>
          <div className="flex justify-between items-center">
            <Label className="text-sm">{item.label}</Label>
            <span className="text-sm font-medium">{progress[item.key] || 0}%</span>
          </div>
          <Input
            type="range"
            min={0}
            max={100}
            value={progress[item.key] || 0}
            onChange={e => { setProgress(prev => ({ ...prev, [item.key]: parseInt(e.target.value) })); setSavedAt(null); }}
            data-testid={`progress-${item.key}`}
          />
        </div>
      ))}
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Rata-rata progres</p>
        <p className="text-2xl font-bold mt-0.5">{average}%</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        {savedAt ? <SaveSuccessBadge savedAt={savedAt} /> : <span className="text-xs text-muted-foreground">Simpan snapshot progres saat ini</span>}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={submitResult.isPending}
          data-testid="button-save-progress"
          style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
        >
          {submitResult.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          Simpan Progress
        </Button>
      </div>
    </div>
  );
}

function DocumentGeneratorRunner({ config, name, slug, agentColor }: { config: Record<string, unknown>; name: string; slug: string; agentColor?: string }) {
  const configFields = (config?.fields as string[] | undefined);
  const defaultFields = ["judul_dokumen", "konteks_proyek", "kebutuhan_spesifik"];
  const formFields = configFields && configFields.length > 0 ? configFields : defaultFields;

  const [values, setValues] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = usePublicGenerateDocument(slug);

  const isMultiline = (field: string) =>
    ["konteks_proyek", "kebutuhan_spesifik", "deskripsi", "isi", "konteks", "detail", "catatan", "requirements"].some(k => field.toLowerCase().includes(k));

  const handleGenerate = () => {
    setError(null);
    const isEmpty = formFields.every(f => !values[f]?.trim());
    if (isEmpty) { setError("Isi minimal satu field sebelum generate."); return; }
    generateMutation.mutate(values, {
      onSuccess: (data) => setGeneratedDoc(data.content),
      onError: (err: any) => setError(err.message || "Terjadi kesalahan"),
    });
  };

  const handleCopy = async () => {
    if (!generatedDoc) return;
    try {
      await navigator.clipboard.writeText(generatedDoc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Form fields */}
      {!generatedDoc && (
        <>
          {formFields.map((field: string) => (
            <div key={field} className="space-y-1.5">
              <Label className="capitalize text-sm font-medium">{field.replace(/_/g, " ")}</Label>
              {isMultiline(field) ? (
                <Textarea
                  value={values[field] || ""}
                  onChange={e => setValues(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={`Masukkan ${field.replace(/_/g, " ")}...`}
                  rows={3}
                  data-testid={`docgen-input-${field}`}
                />
              ) : (
                <Input
                  value={values[field] || ""}
                  onChange={e => setValues(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={`Masukkan ${field.replace(/_/g, " ")}...`}
                  data-testid={`docgen-input-${field}`}
                />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            data-testid="button-generate-document"
            style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
          >
            {generateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sedang membuat dokumen...</>
              : <><FileOutput className="w-4 h-4" /> Generate Dokumen</>
            }
          </Button>
        </>
      )}

      {/* Generated document result */}
      {generatedDoc && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Dokumen berhasil dibuat
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setGeneratedDoc(null); setValues({}); }}
              className="gap-1 text-xs text-muted-foreground"
              data-testid="button-reset-docgen"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Buat Ulang
            </Button>
          </div>
          <div
            className="p-4 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-mono text-xs"
            style={{ backgroundColor: `${agentColor || "#6366f1"}08`, borderColor: `${agentColor || "#6366f1"}30` }}
            data-testid="docgen-result"
          >
            {generatedDoc}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleCopy}
              data-testid="button-copy-document"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Disalin!" : "Salin Teks"}
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleDownload}
              data-testid="button-download-document"
              style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
            >
              <Download className="w-3.5 h-3.5" /> Download .txt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleFormRunner({ config, name, slug, agentColor }: { config: Record<string, unknown>; name: string; slug: string; agentColor?: string }) {
  const fields = (config?.fields as string[] | undefined) ?? ["nama", "email", "pesan"];
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const submitResult = usePublicSubmitResult(slug);

  const handleSubmit = () => {
    submitResult.mutate(
      {
        input: values,
        output: { form_name: name, submitted: true, summary: `Form "${name}" berhasil dikirim` },
      },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckSquare className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-semibold">Terima kasih!</h3>
        <p className="text-sm text-muted-foreground mt-1">Data Anda telah diterima.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field: string) => (
        <div key={field} className="space-y-1">
          <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
          <Input value={values[field] || ""} onChange={e => setValues(prev => ({ ...prev, [field]: e.target.value }))} placeholder={`Masukkan ${field.replace(/_/g, " ")}...`} data-testid={`form-input-${field}`} />
        </div>
      ))}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={submitResult.isPending}
        data-testid="button-submit-form"
        style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }}
      >
        {submitResult.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Kirim
      </Button>
    </div>
  );
}

function WorkModeRunner({ config, agentId, agentColor }: { config: Record<string, unknown>; agentId: string; agentColor?: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const modes = (config?.modes as Array<{ id: string; label: string; emoji: string; description: string; prompt_template: string }>) ?? [];

  const handleCopy = (modeId: string, promptTemplate: string) => {
    navigator.clipboard.writeText(promptTemplate).then(() => {
      setCopied(modeId);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const colorMap: Record<string, string> = {
    quick_help: "#f59e0b",
    build: "#3b82f6",
    review: "#8b5cf6",
    coach: "#10b981",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground text-center mb-4">Pilih mode kerja — klik untuk menyalin prompt ke chatbot</p>
      {modes.map((mode) => {
        const modeColor = colorMap[mode.id] || agentColor || "#6366f1";
        const isCopied = copied === mode.id;
        return (
          <button
            key={mode.id}
            className="w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md active:scale-[0.99]"
            style={{ borderColor: `${modeColor}33`, backgroundColor: `${modeColor}0a` }}
            onClick={() => handleCopy(mode.id, mode.prompt_template)}
            data-testid={`button-work-mode-${mode.id}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{mode.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm" style={{ color: modeColor }}>{mode.label}</span>
                  {isCopied ? (
                    <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Tersalin!</span>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Copy className="w-3 h-3" />Salin prompt</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
              </div>
            </div>
          </button>
        );
      })}
      <div className="mt-4 p-3 rounded-lg bg-muted/40 border text-center">
        <p className="text-xs text-muted-foreground mb-2">Setelah menyalin prompt, tempel ke chatbot</p>
        <Button asChild size="sm" className="text-xs" style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }} data-testid="button-open-chatbot-modes">
          <a href={`/bot/${agentId}`} target="_blank" rel="noopener noreferrer">
            <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
            Buka Chatbot
          </a>
        </Button>
      </div>
    </div>
  );
}

function ResultHistoryList({ results }: { results: MiniAppResult[] }) {
  const [expanded, setExpanded] = useState(false);
  if (results.length === 0) return null;

  const displayResults = expanded ? results : results.slice(0, 3);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Riwayat Hasil ({results.length})</span>
      </div>
      <div className="space-y-2">
        {displayResults.map((r, idx) => {
          const out = r.output as Record<string, unknown> | null | undefined;
          const summary = String(out?.summary || out?.result || out?.output || out?.content || "—");
          const ts = r.createdAt ? new Date(r.createdAt).toLocaleString("id-ID") : "";
          return (
            <div key={r.id || idx} className="p-3 rounded-lg border bg-muted/30 text-sm" data-testid={`result-history-${idx}`}>
              <p className="text-xs text-muted-foreground mb-1">{ts}</p>
              <p className="line-clamp-2">{summary}</p>
            </div>
          );
        })}
      </div>
      {results.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setExpanded(!expanded)}
          data-testid="button-toggle-history"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5 mr-1" />Sembunyikan</> : <><ChevronDown className="w-3.5 h-3.5 mr-1" />Tampilkan semua {results.length} hasil</>}
        </Button>
      )}
    </div>
  );
}

function AIOutputRunner({ miniApp, result, agentId, agentColor, slug }: { miniApp: MiniApp; result: MiniAppResult | null; agentId: string; agentColor?: string; slug: string }) {
  const output = result?.output as Record<string, unknown> | null | undefined;
  const hasOutput = output && (output.result || output.output || output.content);
  const outputText = String(output?.result ?? output?.output ?? output?.content ?? "");

  const { data: resultsData } = usePublicMiniAppResults(slug);
  const allResults = resultsData?.results ?? [];

  return (
    <div className="space-y-4">
      {hasOutput ? (
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            Hasil terakhir — {result?.createdAt ? new Date(result.createdAt).toLocaleString("id-ID") : ""}
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
            {outputText}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada hasil analisis untuk mini app ini.</p>
        </div>
      )}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: `${agentColor || "#6366f1"}0d`, borderColor: `${agentColor || "#6366f1"}33` }}>
        <p className="text-sm font-medium mb-1">Minta Analisis Baru</p>
        <p className="text-xs text-muted-foreground mb-3">
          Untuk mendapatkan analisis terbaru, chat dengan chatbot dan minta analisis {miniApp.name}.
        </p>
        <Button asChild size="sm" className="w-full" style={{ backgroundColor: agentColor || "#6366f1", color: "#fff" }} data-testid="button-go-to-chatbot">
          <a href={`/bot/${agentId}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Chat dengan Chatbot
          </a>
        </Button>
      </div>
      {allResults.length > 1 && <ResultHistoryList results={allResults} />}
    </div>
  );
}

function AppRunner({ miniApp, result, agentId, agentColor, slug }: { miniApp: MiniApp; result: MiniAppResult | null; agentId: string; agentColor?: string; slug: string }) {
  const type = miniApp.type;
  const config = (miniApp.config as Record<string, unknown>) || {};

  if (AI_TYPES.includes(type)) {
    return <AIOutputRunner miniApp={miniApp} result={result} agentId={agentId} agentColor={agentColor} slug={slug} />;
  }

  switch (type) {
    case "checklist":
    case "go_no_go_checklist":
      return <ChecklistRunner config={{ ...config, items: (config.items as string[] | undefined) ?? [] }} name={miniApp.name} slug={slug} agentColor={agentColor} />;
    case "calculator":
      return <CalculatorRunner config={config} agentColor={agentColor} slug={slug} />;
    case "risk_assessment":
      return <RiskAssessmentRunner config={config} slug={slug} agentColor={agentColor} />;
    case "progress_tracker":
      return <ProgressTrackerRunner config={config} slug={slug} agentColor={agentColor} />;
    case "document_generator":
      return <DocumentGeneratorRunner config={config} name={miniApp.name} slug={slug} agentColor={agentColor} />;
    case "work_mode_selector":
      return <WorkModeRunner config={config} agentId={agentId} agentColor={agentColor} />;
    case "lead_capture_form":
    case "custom":
    default:
      return <SimpleFormRunner config={config} name={miniApp.name} slug={slug} agentColor={agentColor} />;
  }
}

export default function MiniAppPublic() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, isLoading, error } = usePublicMiniApp(slug);
  const { data: resultData } = usePublicMiniAppResult(slug);

  const miniAppData = data ? (data as { miniApp: MiniApp; agent: { id: string; name: string; avatar?: string; tagline?: string; description?: string; color?: string } | null }) : null;

  useEffect(() => {
    if (!miniAppData) return;
    const { miniApp, agent } = miniAppData;
    const title = `${miniApp.name} — ${agent?.name ?? "Mini App"}`;
    const description = miniApp.description || `Mini app: ${miniApp.name}`;
    document.title = title;
    const setMeta = (attr: string, value: string, content: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, value); document.head.appendChild(tag); }
      tag.setAttribute("content", content);
    };
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    return () => { document.title = ""; };
  }, [miniAppData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-4">
          <h2 className="text-xl font-semibold mb-2">Mini App Tidak Ditemukan</h2>
          <p className="text-muted-foreground text-sm">Link ini mungkin sudah tidak aktif atau tidak valid.</p>
        </div>
      </div>
    );
  }

  const { miniApp, agent } = miniAppData!;
  const TypeIcon = typeIcons[miniApp.type] || Wrench;
  const typeLabel = typeLabels[miniApp.type] || miniApp.type;

  const rawColor = agent?.color;
  const agentColor = (rawColor && /^#[0-9a-fA-F]{6}$/.test(rawColor)) ? rawColor : "#6366f1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {agent && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-background/80 rounded-xl border shadow-sm">
            <Avatar className="w-10 h-10 border-2" style={{ borderColor: `${agentColor}40` }}>
              {agent.avatar ? <AvatarImage src={agent.avatar} alt={agent.name} /> : null}
              <AvatarFallback style={{ backgroundColor: `${agentColor}15`, color: agentColor }}>
                {agent.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{agent.name}</p>
              {agent.tagline && <p className="text-xs text-muted-foreground truncate">{agent.tagline}</p>}
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0" data-testid="button-visit-chatbot">
              <a href={`/bot/${agent.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Chat
              </a>
            </Button>
          </div>
        )}

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${agentColor}1a` }}>
                <TypeIcon className="w-6 h-6" style={{ color: agentColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg leading-tight">{miniApp.name}</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">{typeLabel}</Badge>
              </div>
            </div>
            {miniApp.description && (
              <p className="text-sm text-muted-foreground mt-2">{miniApp.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <AppRunner miniApp={miniApp} result={(resultData?.result as MiniAppResult | null) ?? null} agentId={miniApp.agentId} agentColor={agentColor} slug={slug} />
          </CardContent>
        </Card>

        {agent && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Punya pertanyaan lebih lanjut?</p>
            <Button asChild variant="outline" style={{ borderColor: agentColor, color: agentColor }} data-testid="button-ask-chatbot">
              <a href={`/bot/${agent.id}`} target="_blank" rel="noopener noreferrer">
                <ArrowRight className="w-4 h-4 mr-2" />
                Tanya Lebih Lanjut ke {agent.name}
              </a>
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <span className="font-medium">Gustafta</span>
        </p>
      </div>
    </div>
  );
}
