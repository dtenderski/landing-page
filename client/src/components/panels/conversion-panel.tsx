import { useState, useEffect } from "react";
import { Target, Users, Phone, Mail, BarChart3, Gift, Zap, Plus, Trash2, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LeadField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required: boolean;
  placeholder: string;
}

interface ScoringRubricItem {
  id: string;
  category: string;
  maxScore: number;
  weight: number;
  description: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  ctaText: string;
  ctaUrl: string;
  isPopular: boolean;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  score: number;
  status: string;
  source: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  qualified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  converted: "bg-primary/20 text-primary",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusOptions = ["new", "contacted", "qualified", "converted", "lost"];

export function ConversionPanel({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    conversionEnabled: agent.conversionEnabled ?? false,
    conversionGoal: agent.conversionGoal || "lead_capture",
    whatsappCta: agent.whatsappCta || "",
    calendlyUrl: agent.calendlyUrl || "",
    ctaTriggerAfterMessages: agent.ctaTriggerAfterMessages ?? 5,
    conversionCta: {
      title: (agent.conversionCta as any)?.title || "",
      description: (agent.conversionCta as any)?.description || "",
      buttonText: (agent.conversionCta as any)?.buttonText || "",
      buttonUrl: (agent.conversionCta as any)?.buttonUrl || "",
      style: (agent.conversionCta as any)?.style || "card",
    },
    leadCaptureFields: ((agent.leadCaptureFields as LeadField[]) || []).length > 0
      ? (agent.leadCaptureFields as LeadField[])
      : [
          { id: Date.now().toString() + "-1", label: "Nama", type: "text" as const, required: true, placeholder: "Masukkan nama Anda" },
          { id: Date.now().toString() + "-2", label: "Email", type: "email" as const, required: true, placeholder: "email@contoh.com" },
          { id: Date.now().toString() + "-3", label: "Telepon", type: "phone" as const, required: false, placeholder: "+62..." },
        ],
    scoringEnabled: agent.scoringEnabled ?? false,
    scoringRubric: (agent.scoringRubric as ScoringRubricItem[]) || [],
    scoringThresholds: {
      low: (agent.scoringThresholds as any)?.low ?? 30,
      medium: (agent.scoringThresholds as any)?.medium ?? 60,
      high: (agent.scoringThresholds as any)?.high ?? 80,
      lowLabel: (agent.scoringThresholds as any)?.lowLabel || "Perlu Peningkatan",
      mediumLabel: (agent.scoringThresholds as any)?.mediumLabel || "Cukup Baik",
      highLabel: (agent.scoringThresholds as any)?.highLabel || "Sangat Baik",
      lowRecommendation: (agent.scoringThresholds as any)?.lowRecommendation || "",
      mediumRecommendation: (agent.scoringThresholds as any)?.mediumRecommendation || "",
      highRecommendation: (agent.scoringThresholds as any)?.highRecommendation || "",
    },
    ctaTriggerOnScore: agent.ctaTriggerOnScore ?? 0,
    conversionOffers: (agent.conversionOffers as Offer[]) || [],
  });

  useEffect(() => {
    setSettings({
      conversionEnabled: agent.conversionEnabled ?? false,
      conversionGoal: agent.conversionGoal || "lead_capture",
      whatsappCta: agent.whatsappCta || "",
      calendlyUrl: agent.calendlyUrl || "",
      ctaTriggerAfterMessages: agent.ctaTriggerAfterMessages ?? 5,
      conversionCta: {
        title: (agent.conversionCta as any)?.title || "",
        description: (agent.conversionCta as any)?.description || "",
        buttonText: (agent.conversionCta as any)?.buttonText || "",
        buttonUrl: (agent.conversionCta as any)?.buttonUrl || "",
        style: (agent.conversionCta as any)?.style || "card",
      },
      leadCaptureFields: ((agent.leadCaptureFields as LeadField[]) || []).length > 0
        ? (agent.leadCaptureFields as LeadField[])
        : [
            { id: Date.now().toString() + "-1", label: "Nama", type: "text" as const, required: true, placeholder: "Masukkan nama Anda" },
            { id: Date.now().toString() + "-2", label: "Email", type: "email" as const, required: true, placeholder: "email@contoh.com" },
            { id: Date.now().toString() + "-3", label: "Telepon", type: "phone" as const, required: false, placeholder: "+62..." },
          ],
      scoringEnabled: agent.scoringEnabled ?? false,
      scoringRubric: (agent.scoringRubric as ScoringRubricItem[]) || [],
      scoringThresholds: {
        low: (agent.scoringThresholds as any)?.low ?? 30,
        medium: (agent.scoringThresholds as any)?.medium ?? 60,
        high: (agent.scoringThresholds as any)?.high ?? 80,
        lowLabel: (agent.scoringThresholds as any)?.lowLabel || "Perlu Peningkatan",
        mediumLabel: (agent.scoringThresholds as any)?.mediumLabel || "Cukup Baik",
        highLabel: (agent.scoringThresholds as any)?.highLabel || "Sangat Baik",
        lowRecommendation: (agent.scoringThresholds as any)?.lowRecommendation || "",
        mediumRecommendation: (agent.scoringThresholds as any)?.mediumRecommendation || "",
        highRecommendation: (agent.scoringThresholds as any)?.highRecommendation || "",
      },
      ctaTriggerOnScore: agent.ctaTriggerOnScore ?? 0,
      conversionOffers: (agent.conversionOffers as Offer[]) || [],
    });
  }, [agent.id]);

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", agent.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/leads/${agent.id}`);
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Berhasil", description: "Pengaturan konversi berhasil disimpan" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menyimpan pengaturan konversi", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/lead/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", agent.id] });
      toast({ title: "Berhasil", description: "Status lead berhasil diperbarui" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal memperbarui status lead", variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/lead/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", agent.id] });
      toast({ title: "Berhasil", description: "Lead berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus lead", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const addLeadField = () => {
    setSettings({
      ...settings,
      leadCaptureFields: [
        ...settings.leadCaptureFields,
        { id: Date.now().toString(), label: "", type: "text", required: false, placeholder: "" },
      ],
    });
  };

  const removeLeadField = (id: string) => {
    setSettings({
      ...settings,
      leadCaptureFields: settings.leadCaptureFields.filter((f) => f.id !== id),
    });
  };

  const updateLeadField = (id: string, updates: Partial<LeadField>) => {
    setSettings({
      ...settings,
      leadCaptureFields: settings.leadCaptureFields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  };

  const addRubricItem = () => {
    setSettings({
      ...settings,
      scoringRubric: [
        ...settings.scoringRubric,
        { id: Date.now().toString(), category: "", maxScore: 100, weight: 1, description: "" },
      ],
    });
  };

  const removeRubricItem = (id: string) => {
    setSettings({
      ...settings,
      scoringRubric: settings.scoringRubric.filter((r) => r.id !== id),
    });
  };

  const updateRubricItem = (id: string, updates: Partial<ScoringRubricItem>) => {
    setSettings({
      ...settings,
      scoringRubric: settings.scoringRubric.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const addOffer = () => {
    setSettings({
      ...settings,
      conversionOffers: [
        ...settings.conversionOffers,
        { id: Date.now().toString(), title: "", description: "", price: "", features: [], ctaText: "", ctaUrl: "", isPopular: false },
      ],
    });
  };

  const removeOffer = (id: string) => {
    setSettings({
      ...settings,
      conversionOffers: settings.conversionOffers.filter((o) => o.id !== id),
    });
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setSettings({
      ...settings,
      conversionOffers: settings.conversionOffers.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Conversion Layer</h2>
            <p className="text-muted-foreground">Ubah chatbot menjadi mesin konversi & revenue</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          data-testid="button-save-conversion"
        >
          {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Section 1: Conversion Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Tujuan Konversi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label>Aktifkan Conversion Layer</Label>
                <p className="text-xs text-muted-foreground">Mengubah chatbot menjadi mesin konversi</p>
              </div>
              <Switch
                checked={settings.conversionEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, conversionEnabled: checked })}
                data-testid="switch-conversion-enabled"
              />
            </div>

            <div className="space-y-2">
              <Label>Tujuan Konversi</Label>
              <Select
                value={settings.conversionGoal}
                onValueChange={(value) => setSettings({ ...settings, conversionGoal: value })}
              >
                <SelectTrigger data-testid="select-conversion-goal">
                  <SelectValue placeholder="Pilih tujuan konversi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_capture">Tangkap Lead</SelectItem>
                  <SelectItem value="assessment">Assessment / Scoring</SelectItem>
                  <SelectItem value="consultation">Konsultasi</SelectItem>
                  <SelectItem value="product_sale">Penjualan Produk</SelectItem>
                  <SelectItem value="registration">Registrasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nomor WhatsApp untuk CTA</Label>
              <Input
                value={settings.whatsappCta}
                onChange={(e) => setSettings({ ...settings, whatsappCta: e.target.value })}
                placeholder="+6281234567890"
                data-testid="input-whatsapp-cta"
              />
            </div>

            <div className="space-y-2">
              <Label>URL Calendly untuk Booking</Label>
              <Input
                value={settings.calendlyUrl}
                onChange={(e) => setSettings({ ...settings, calendlyUrl: e.target.value })}
                placeholder="https://calendly.com/username"
                data-testid="input-calendly-url"
              />
            </div>

            <div className="space-y-2">
              <Label>Tampilkan CTA setelah X pesan</Label>
              <Input
                type="number"
                value={settings.ctaTriggerAfterMessages}
                onChange={(e) => setSettings({ ...settings, ctaTriggerAfterMessages: parseInt(e.target.value) || 1 })}
                min={1}
                max={50}
                data-testid="input-cta-trigger-messages"
              />
              <p className="text-xs text-muted-foreground">CTA akan ditampilkan setelah pengguna mengirim sejumlah pesan (1-50)</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: CTA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Konfigurasi CTA (Call to Action)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Judul CTA</Label>
              <Input
                value={settings.conversionCta.title}
                onChange={(e) => setSettings({ ...settings, conversionCta: { ...settings.conversionCta, title: e.target.value } })}
                placeholder="Tertarik? Hubungi kami sekarang!"
                data-testid="input-cta-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi CTA</Label>
              <Textarea
                value={settings.conversionCta.description}
                onChange={(e) => setSettings({ ...settings, conversionCta: { ...settings.conversionCta, description: e.target.value } })}
                placeholder="Jelaskan manfaat yang akan didapat pengguna..."
                rows={3}
                data-testid="input-cta-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Teks Tombol</Label>
              <Input
                value={settings.conversionCta.buttonText}
                onChange={(e) => setSettings({ ...settings, conversionCta: { ...settings.conversionCta, buttonText: e.target.value } })}
                placeholder="Hubungi Sekarang"
                data-testid="input-cta-button-text"
              />
            </div>

            <div className="space-y-2">
              <Label>URL Tombol</Label>
              <Input
                value={settings.conversionCta.buttonUrl}
                onChange={(e) => setSettings({ ...settings, conversionCta: { ...settings.conversionCta, buttonUrl: e.target.value } })}
                placeholder="https://wa.me/6281234567890"
                data-testid="input-cta-button-url"
              />
            </div>

            <div className="space-y-2">
              <Label>Gaya Tampilan CTA</Label>
              <Select
                value={settings.conversionCta.style}
                onValueChange={(value) => setSettings({ ...settings, conversionCta: { ...settings.conversionCta, style: value } })}
              >
                <SelectTrigger data-testid="select-cta-style">
                  <SelectValue placeholder="Pilih gaya tampilan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="floating">Floating</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Lead Capture Fields */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-4 h-4" />
              Lead Capture Fields
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addLeadField} data-testid="button-add-lead-field">
              <Plus className="w-4 h-4 mr-1" />
              Tambah Field
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Konfigurasi field yang akan ditanyakan chatbot kepada pengguna untuk menangkap data lead.</p>
            {settings.leadCaptureFields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 space-y-3" data-testid={`lead-field-${field.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Field #{index + 1}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeLeadField(field.id)}
                    data-testid={`button-remove-lead-field-${field.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateLeadField(field.id, { label: e.target.value })}
                      placeholder="Nama field"
                      data-testid={`input-lead-field-label-${field.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipe</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateLeadField(field.id, { type: value as LeadField["type"] })}
                    >
                      <SelectTrigger data-testid={`select-lead-field-type-${field.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={field.placeholder}
                      onChange={(e) => updateLeadField(field.id, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                      data-testid={`input-lead-field-placeholder-${field.id}`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-4">
                    <Label className="text-xs">Wajib diisi</Label>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => updateLeadField(field.id, { required: checked })}
                      data-testid={`switch-lead-field-required-${field.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section 4: Scoring & Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Scoring & Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label>Aktifkan Scoring</Label>
                <p className="text-xs text-muted-foreground">Chatbot akan memberikan skor berdasarkan rubrik penilaian</p>
              </div>
              <Switch
                checked={settings.scoringEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, scoringEnabled: checked })}
                data-testid="switch-scoring-enabled"
              />
            </div>

            {settings.scoringEnabled && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-medium">Rubrik Penilaian</Label>
                  <Button size="sm" variant="outline" onClick={addRubricItem} data-testid="button-add-rubric">
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Rubrik
                  </Button>
                </div>

                {settings.scoringRubric.map((item, index) => (
                  <div key={item.id} className="border rounded-md p-4 space-y-3" data-testid={`rubric-item-${item.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Rubrik #{index + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeRubricItem(item.id)}
                        data-testid={`button-remove-rubric-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Kategori</Label>
                        <Input
                          value={item.category}
                          onChange={(e) => updateRubricItem(item.id, { category: e.target.value })}
                          placeholder="Nama kategori"
                          data-testid={`input-rubric-category-${item.id}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Skor Maksimal</Label>
                        <Input
                          type="number"
                          value={item.maxScore}
                          onChange={(e) => updateRubricItem(item.id, { maxScore: parseInt(e.target.value) || 0 })}
                          min={0}
                          data-testid={`input-rubric-max-score-${item.id}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bobot</Label>
                        <Input
                          type="number"
                          value={item.weight}
                          onChange={(e) => updateRubricItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
                          min={0}
                          step={0.1}
                          data-testid={`input-rubric-weight-${item.id}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Deskripsi</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateRubricItem(item.id, { description: e.target.value })}
                          placeholder="Deskripsi rubrik"
                          data-testid={`input-rubric-description-${item.id}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border rounded-md p-4 space-y-4">
                  <Label className="font-medium">Ambang Batas Skor</Label>

                  {(["low", "medium", "high"] as const).map((level) => {
                    const labelKey = `${level}Label` as keyof typeof settings.scoringThresholds;
                    const recKey = `${level}Recommendation` as keyof typeof settings.scoringThresholds;
                    const levelLabels = { low: "Rendah", medium: "Sedang", high: "Tinggi" };
                    return (
                      <div key={level} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Skor {levelLabels[level]}</Label>
                            <Input
                              type="number"
                              value={settings.scoringThresholds[level] as number}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  scoringThresholds: { ...settings.scoringThresholds, [level]: parseInt(e.target.value) || 0 },
                                })
                              }
                              min={0}
                              max={100}
                              data-testid={`input-threshold-${level}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={settings.scoringThresholds[labelKey] as string}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  scoringThresholds: { ...settings.scoringThresholds, [labelKey]: e.target.value },
                                })
                              }
                              placeholder="Label level"
                              data-testid={`input-threshold-${level}-label`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rekomendasi</Label>
                            <Input
                              value={settings.scoringThresholds[recKey] as string}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  scoringThresholds: { ...settings.scoringThresholds, [recKey]: e.target.value },
                                })
                              }
                              placeholder="Rekomendasi untuk level ini"
                              data-testid={`input-threshold-${level}-recommendation`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label>Tampilkan CTA saat skor di bawah X</Label>
                  <Input
                    type="number"
                    value={settings.ctaTriggerOnScore}
                    onChange={(e) => setSettings({ ...settings, ctaTriggerOnScore: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    data-testid="input-cta-trigger-score"
                  />
                  <p className="text-xs text-muted-foreground">CTA akan ditampilkan ketika skor pengguna di bawah nilai ini</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Paket Penawaran */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Paket Penawaran
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addOffer} data-testid="button-add-offer">
              <Plus className="w-4 h-4 mr-1" />
              Tambah Paket
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Konfigurasi paket penawaran yang akan ditampilkan kepada pengguna.</p>
            {settings.conversionOffers.map((offer, index) => (
              <div key={offer.id} className="border rounded-md p-4 space-y-3" data-testid={`offer-item-${offer.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Paket #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Populer</Label>
                      <Switch
                        checked={offer.isPopular}
                        onCheckedChange={(checked) => updateOffer(offer.id, { isPopular: checked })}
                        data-testid={`switch-offer-popular-${offer.id}`}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeOffer(offer.id)}
                      data-testid={`button-remove-offer-${offer.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Judul Paket</Label>
                    <Input
                      value={offer.title}
                      onChange={(e) => updateOffer(offer.id, { title: e.target.value })}
                      placeholder="Nama paket"
                      data-testid={`input-offer-title-${offer.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Harga</Label>
                    <Input
                      value={offer.price}
                      onChange={(e) => updateOffer(offer.id, { price: e.target.value })}
                      placeholder="Rp 500.000"
                      data-testid={`input-offer-price-${offer.id}`}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Deskripsi</Label>
                    <Textarea
                      value={offer.description}
                      onChange={(e) => updateOffer(offer.id, { description: e.target.value })}
                      placeholder="Deskripsi paket penawaran"
                      rows={2}
                      data-testid={`input-offer-description-${offer.id}`}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Fitur (pisahkan dengan koma)</Label>
                    <Input
                      value={offer.features.join(", ")}
                      onChange={(e) =>
                        updateOffer(offer.id, {
                          features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Fitur 1, Fitur 2, Fitur 3"
                      data-testid={`input-offer-features-${offer.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teks Tombol CTA</Label>
                    <Input
                      value={offer.ctaText}
                      onChange={(e) => updateOffer(offer.id, { ctaText: e.target.value })}
                      placeholder="Pilih Paket Ini"
                      data-testid={`input-offer-cta-text-${offer.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">URL Tombol CTA</Label>
                    <Input
                      value={offer.ctaUrl}
                      onChange={(e) => updateOffer(offer.id, { ctaUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid={`input-offer-cta-url-${offer.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
            {settings.conversionOffers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada paket penawaran. Klik "Tambah Paket" untuk menambahkan.</p>
            )}
          </CardContent>
        </Card>

        {/* Section 6: Lead Data (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Data Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leadsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Memuat data lead...</p>
            ) : leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data lead yang masuk.</p>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="border rounded-md p-4 space-y-2" data-testid={`lead-item-${lead.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm" data-testid={`text-lead-name-${lead.id}`}>{lead.name || "-"}</span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusColors[lead.status] || ""}`}
                            data-testid={`badge-lead-status-${lead.id}`}
                          >
                            {lead.status}
                          </Badge>
                          {lead.score > 0 && (
                            <Badge variant="outline" className="text-xs" data-testid={`badge-lead-score-${lead.id}`}>
                              Skor: {lead.score}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.company && <span>{lead.company}</span>}
                          {lead.source && <span>Sumber: {lead.source}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadMutation.mutate({ id: lead.id, status: value })}
                        >
                          <SelectTrigger className="w-[130px]" data-testid={`select-lead-status-${lead.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteLeadMutation.mutate(lead.id)}
                          data-testid={`button-delete-lead-${lead.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}