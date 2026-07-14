import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AiConfigFill } from "@/components/ai-config-fill";
import { AiFieldRegen } from "@/components/ai-field-regen";
import { ConfigHealth } from "@/components/config-health";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Eye,
  MessageCircle,
  RefreshCcw,
  RotateCcw,
  Scale,
  Shield,
  Sparkles,
  Target,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAgent } from "@/hooks/use-agents";
import type { Agent, InsertAgent } from "@shared/schema";

interface PolicyPanelProps {
  agent: Agent;
}

type PolicyField =
  | "primaryOutcome"
  | "conversationWinConditions"
  | "brandVoiceSpec"
  | "interactionPolicy"
  | "domainCharter"
  | "qualityBar"
  | "riskCompliance";

type PolicyForm = Record<PolicyField, string>;

const EMPTY_FORM: PolicyForm = {
  primaryOutcome: "",
  conversationWinConditions: "",
  brandVoiceSpec: "",
  interactionPolicy: "",
  domainCharter: "",
  qualityBar: "",
  riskCompliance: "",
};

const PRIMARY_OUTCOME_OPTIONS: { value: string; label: string }[] = [
  { value: "user_education", label: "Mendidik & onboard pengguna" },
  { value: "Menyelesaikan tiket", label: "Menyelesaikan tiket / dukungan pelanggan" },
  { value: "Menghasilkan dokumen", label: "Menghasilkan dokumen / laporan" },
  { value: "Menutup penjualan", label: "Menutup penjualan / konversi leads" },
  { value: "Mendidik pengguna", label: "Mendidik pengguna" },
  { value: "Mengumpulkan data", label: "Mengumpulkan data / requirement" },
  { value: "Audit & compliance", label: "Audit & kepatuhan regulasi" },
  { value: "Lainnya", label: "Lainnya" },
];

function readField(agent: Agent, field: PolicyField): string {
  const raw = agent[field];
  return typeof raw === "string" ? raw : "";
}

function readPolicyForm(agent: Agent): PolicyForm {
  return {
    primaryOutcome: readField(agent, "primaryOutcome"),
    conversationWinConditions: readField(agent, "conversationWinConditions"),
    brandVoiceSpec: readField(agent, "brandVoiceSpec"),
    interactionPolicy: readField(agent, "interactionPolicy"),
    domainCharter: readField(agent, "domainCharter"),
    qualityBar: readField(agent, "qualityBar"),
    riskCompliance: readField(agent, "riskCompliance"),
  };
}

export function PolicyPanel({ agent }: PolicyPanelProps) {
  const { toast } = useToast();
  const updateAgent = useUpdateAgent();
  const [form, setForm] = useState<PolicyForm>(() => readPolicyForm(agent));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resettingField, setResettingField] = useState<PolicyField | null>(null);

  useEffect(() => {
    setForm(readPolicyForm(agent));
    // Sinkronkan ulang state lokal saat agent berganti ATAU saat salah satu
    // field policy di server berubah (mis. diedit dari panel lain / refresh
    // query). Tidak boleh hanya bergantung pada agent.id karena edge case
    // itu akan menyebabkan UI menampilkan data basi.
  }, [
    agent.id,
    agent.primaryOutcome,
    agent.conversationWinConditions,
    agent.brandVoiceSpec,
    agent.interactionPolicy,
    agent.domainCharter,
    agent.qualityBar,
    agent.riskCompliance,
  ]);

  const setField = (field: PolicyField, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const saveField = async (field: PolicyField, value: string) => {
    try {
      const data: Partial<InsertAgent> = { [field]: value };
      await updateAgent.mutateAsync({ id: String(agent.id), data });
    } catch {
      toast({
        title: "Gagal menyimpan",
        description: `Field ${field} tidak tersimpan. Coba lagi.`,
        variant: "destructive",
      });
      // rollback to last known value from agent
      setField(field, readField(agent, field));
    }
  };

  const defaultsQuery = useQuery<{ seriesName: string | null; defaults: PolicyForm }>({
    queryKey: ["/api/agents", String(agent.id), "policy-defaults"],
  });

  const previewQuery = useQuery<{ prompt: string; length: number }>({
    queryKey: ["/api/agents", String(agent.id), "policy-preview"],
    enabled: previewOpen,
  });

  const resetField = async (field: PolicyField) => {
    if (!defaultsQuery.data) {
      toast({
        title: "Template belum dimuat",
        description: "Tunggu beberapa detik lalu coba lagi.",
        variant: "destructive",
      });
      return;
    }
    const fallback = defaultsQuery.data.defaults[field] ?? "";
    setResettingField(field);
    setField(field, fallback);
    try {
      const data: Partial<InsertAgent> = { [field]: fallback };
      await updateAgent.mutateAsync({
        id: String(agent.id),
        data,
      });
      toast({
        title: "Direset ke template series",
        description: defaultsQuery.data.seriesName
          ? `Field dipulihkan ke template "${defaultsQuery.data.seriesName}".`
          : "Field dipulihkan ke template kategori default.",
      });
    } catch {
      toast({
        title: "Gagal mereset",
        description: "Reset tidak tersimpan. Coba lagi.",
        variant: "destructive",
      });
      setField(field, readField(agent, field));
    } finally {
      setResettingField(null);
    }
  };

  const renderResetButton = (field: PolicyField) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => resetField(field)}
      disabled={resettingField === field || defaultsQuery.isLoading}
      data-testid={`button-reset-${field}`}
    >
      {resettingField === field ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RotateCcw className="h-3 w-3" />
      )}
      Reset ke template series
    </Button>
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-violet-500" />
            Kebijakan Agen
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            7 aturan tetap yang disuntikkan langsung ke system prompt setiap kali agen
            menjawab. Edit per field, atau pulihkan ke template default series-nya.
          </p>
          {defaultsQuery.data?.seriesName && (
            <p className="text-xs text-muted-foreground mt-2">
              Template series:{" "}
              <Badge variant="outline" className="font-normal">
                {defaultsQuery.data.seriesName}
              </Badge>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => setPreviewOpen(true)}
          data-testid="button-preview-policy-prompt"
        >
          <Eye className="h-4 w-4" />
          Pratinjau System Prompt
        </Button>
      </div>

      {/* Config Health */}
      <ConfigHealth
        label="Kelengkapan Kebijakan Agen"
        fields={[
          { field: "conversationWinConditions", label: "Win Conditions", value: form.conversationWinConditions, minLength: 30, weight: 2 },
          { field: "brandVoiceSpec", label: "Brand Voice", value: form.brandVoiceSpec, minLength: 30, weight: 2 },
          { field: "interactionPolicy", label: "Interaction Policy", value: form.interactionPolicy, minLength: 30, weight: 2 },
          { field: "domainCharter", label: "Domain Charter", value: form.domainCharter, minLength: 40, weight: 3 },
          { field: "qualityBar", label: "Quality Bar", value: form.qualityBar, minLength: 30, weight: 2 },
          { field: "riskCompliance", label: "Risk & Compliance", value: form.riskCompliance, minLength: 30, weight: 2 },
          { field: "primaryOutcome", label: "Primary Outcome", value: form.primaryOutcome, minLength: 2 },
        ]}
      />

      {/* AI Auto-Fill Kebijakan */}
      <AiConfigFill
        level="agent-policy"
        parentContext={{ agentName: agent.name }}
        defaultTopic={agent.description || agent.name}
        onFill={async (result) => {
          const fields: PolicyForm = {
            primaryOutcome: result.primaryOutcome || form.primaryOutcome || "",
            conversationWinConditions: result.conversationWinConditions || form.conversationWinConditions || "",
            brandVoiceSpec: result.brandVoiceSpec || form.brandVoiceSpec || "",
            interactionPolicy: result.interactionPolicy || form.interactionPolicy || "",
            domainCharter: result.domainCharter || form.domainCharter || "",
            qualityBar: result.qualityBar || form.qualityBar || "",
            riskCompliance: result.riskCompliance || form.riskCompliance || "",
          };
          setForm(fields);
          try {
            await updateAgent.mutateAsync({ id: String(agent.id), data: fields });
          } catch {
            /* errors handled by mutation */
          }
        }}
      />

      {/* 1. Tujuan & KPI */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-emerald-500" />
            Tujuan & KPI Agen
          </CardTitle>
          <CardDescription>
            Outcome utama yang diburu agen dan kondisi percakapan dianggap berhasil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Primary Outcome
              </Label>
              {renderResetButton("primaryOutcome")}
            </div>
            <p className="text-xs text-muted-foreground">
              Tujuan bisnis utama yang harus dicapai agen.
            </p>
            <Select
              value={form.primaryOutcome || ""}
              onValueChange={(v) => {
                setField("primaryOutcome", v);
                saveField("primaryOutcome", v);
              }}
            >
              <SelectTrigger data-testid="select-policy-primary-outcome">
                <SelectValue placeholder="Pilih outcome utama…" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_OUTCOME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                {form.primaryOutcome &&
                  !PRIMARY_OUTCOME_OPTIONS.some((o) => o.value === form.primaryOutcome) && (
                    <SelectItem value={form.primaryOutcome}>
                      {form.primaryOutcome}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Conversation Win Conditions</Label>
              <div className="flex items-center gap-1">
                <AiFieldRegen fieldName="conversationWinConditions" fieldLabel="Conversation Win Conditions" currentValue={form.conversationWinConditions} agentContext={{ agentName: agent.name, agentDescription: agent.description || "" }} level="agent-policy" onApply={(v) => { setField("conversationWinConditions", v); saveField("conversationWinConditions", v); }} />
                {renderResetButton("conversationWinConditions")}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Kapan percakapan dianggap berhasil. Contoh: "Pengguna memahami pasal yang
              dipertanyakan dan tahu langkah praktis berikutnya."
            </p>
            <Textarea
              value={form.conversationWinConditions}
              onChange={(e) => setField("conversationWinConditions", e.target.value)}
              onBlur={(e) => saveField("conversationWinConditions", e.target.value)}
              placeholder="Contoh: Pengguna menerima jawaban definitif dan tidak perlu eskalasi…"
              rows={3}
              data-testid="textarea-policy-win-conditions"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Brand Voice */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-violet-500" />
            Brand Voice
          </CardTitle>
          <CardDescription>
            Gaya bahasa, formalitas, dan karakter komunikasi yang harus dipertahankan
            di SETIAP respons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <AiFieldRegen fieldName="brandVoiceSpec" fieldLabel="Brand Voice" currentValue={form.brandVoiceSpec} agentContext={{ agentName: agent.name, agentDescription: agent.description || "" }} level="agent-policy" onApply={(v) => { setField("brandVoiceSpec", v); saveField("brandVoiceSpec", v); }} />
            {renderResetButton("brandVoiceSpec")}
          </div>
          <Textarea
            value={form.brandVoiceSpec}
            onChange={(e) => setField("brandVoiceSpec", e.target.value)}
            onBlur={(e) => saveField("brandVoiceSpec", e.target.value)}
            placeholder="Contoh: Gunakan bahasa formal namun ramah. Hindari jargon teknis. Selalu sapa Bapak/Ibu…"
            rows={4}
            data-testid="textarea-policy-brand-voice"
          />
        </CardContent>
      </Card>

      {/* 3. Interaction Policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Interaction Policy
          </CardTitle>
          <CardDescription>
            Aturan kapan agen bertanya balik, berapa banyak pertanyaan sekaligus, dan
            kapan menyimpulkan sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <AiFieldRegen fieldName="interactionPolicy" fieldLabel="Interaction Policy" currentValue={form.interactionPolicy} agentContext={{ agentName: agent.name, agentDescription: agent.description || "" }} level="agent-policy" onApply={(v) => { setField("interactionPolicy", v); saveField("interactionPolicy", v); }} />
            {renderResetButton("interactionPolicy")}
          </div>
          <Textarea
            value={form.interactionPolicy}
            onChange={(e) => setField("interactionPolicy", e.target.value)}
            onBlur={(e) => saveField("interactionPolicy", e.target.value)}
            placeholder="Contoh: Tanya kembali jika ada lebih dari satu interpretasi. Jangan bertanya lebih dari 2 hal sekaligus…"
            rows={4}
            data-testid="textarea-policy-interaction"
          />
        </CardContent>
      </Card>

      {/* 4. Domain Charter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-amber-500" />
            Domain Charter
          </CardTitle>
          <CardDescription>
            Topik dan tindakan yang BOLEH dan TIDAK BOLEH dilakukan agen. Akan
            disuntikkan sebagai batas eksplisit ke prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <AiFieldRegen fieldName="domainCharter" fieldLabel="Domain Charter" currentValue={form.domainCharter} agentContext={{ agentName: agent.name, agentDescription: agent.description || "" }} level="agent-policy" onApply={(v) => { setField("domainCharter", v); saveField("domainCharter", v); }} />
            {renderResetButton("domainCharter")}
          </div>
          <Textarea
            value={form.domainCharter}
            onChange={(e) => setField("domainCharter", e.target.value)}
            onBlur={(e) => saveField("domainCharter", e.target.value)}
            placeholder="Contoh: Agen HANYA membahas topik X. Dilarang memberi opini hukum personal…"
            rows={4}
            data-testid="textarea-policy-domain-charter"
          />
        </CardContent>
      </Card>

      {/* 5. Quality Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Quality Bar
          </CardTitle>
          <CardDescription>
            Standar minimum kualitas jawaban (referensi, struktur, ringkasan, dsb).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <AiFieldRegen fieldName="qualityBar" fieldLabel="Quality Bar" currentValue={form.qualityBar} agentContext={{ agentName: agent.name, agentDescription: agent.description || "" }} level="agent-policy" onApply={(v) => { setField("qualityBar", v); saveField("qualityBar", v); }} />
            {renderResetButton("qualityBar")}
          </div>
          <Textarea
            value={form.qualityBar}
            onChange={(e) => setField("qualityBar", e.target.value)}
            onBlur={(e) => saveField("qualityBar", e.target.value)}
            placeholder="Contoh: Setiap jawaban harus berdasarkan info terverifikasi. Jangan beri angka tanpa konteks…"
            rows={4}
            data-testid="textarea-policy-quality-bar"
          />
        </CardContent>
      </Card>

      {/* 6. Risk & Compliance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-red-500" />
            Risk &amp; Compliance
          </CardTitle>
          <CardDescription>
            Aturan regulasi, disclaimer wajib, dan batasan risiko yang TIDAK boleh
            dikompromikan oleh permintaan pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <AiFieldRegen fieldName="riskCompliance" fieldLabel="Risk & Compliance" currentValue={form.riskCompliance} agentContext={{ agentName: agent.name, agentDescription: agent.description || "" }} level="agent-policy" onApply={(v) => { setField("riskCompliance", v); saveField("riskCompliance", v); }} />
            {renderResetButton("riskCompliance")}
          </div>
          <Textarea
            value={form.riskCompliance}
            onChange={(e) => setField("riskCompliance", e.target.value)}
            onBlur={(e) => saveField("riskCompliance", e.target.value)}
            placeholder="Contoh: Tambahkan disclaimer 'BUKAN saran hukum mengikat'. Jangan simpan data sensitif…"
            rows={4}
            data-testid="textarea-policy-risk-compliance"
          />
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-500" />
              Pratinjau System Prompt (Persona + Kebijakan Agen)
            </DialogTitle>
            <DialogDescription>
              Beginilah cara 7 field Kebijakan Agen kamu disuntikkan ke system prompt
              saat agen menjawab. Knowledge Base, Project Brain, dan memori pengguna
              ditambahkan saat runtime dan tidak ditampilkan di sini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {previewQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat pratinjau…
              </div>
            )}
            {previewQuery.isError && (
              <div className="text-sm text-destructive py-4">
                Gagal memuat pratinjau. Coba tutup dialog lalu buka kembali.
              </div>
            )}
            {previewQuery.data && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Panjang prompt: {previewQuery.data.length} karakter</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => previewQuery.refetch()}
                    data-testid="button-refresh-preview"
                  >
                    <RefreshCcw className="h-3 w-3" />
                    Refresh
                  </Button>
                </div>
                <pre
                  className="bg-muted/40 border rounded-md p-4 text-xs whitespace-pre-wrap break-words max-h-[55vh] overflow-y-auto"
                  data-testid="text-policy-preview"
                >
                  {previewQuery.data.prompt || "(Prompt kosong — isi dulu field di atas.)"}
                </pre>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
