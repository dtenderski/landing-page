import { useState, useEffect } from "react";
import { Brain, Plus, Trash2, GripVertical, Settings, FileText, CheckCircle2, Archive, Pencil, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useProjectBrainTemplates,
  useCreateProjectBrainTemplate,
  useUpdateProjectBrainTemplate,
  useDeleteProjectBrainTemplate,
  useProjectBrainInstances,
  useCreateProjectBrainInstance,
  useUpdateProjectBrainInstance,
  useActivateProjectBrainInstance,
  useDeleteProjectBrainInstance,
} from "@/hooks/use-project-brain";
import type { Agent, ProjectBrainField, ProjectBrainFieldType, ProjectBrainTemplate, ProjectBrainInstance } from "@shared/schema";

interface ProjectBrainPanelProps {
  agent: Agent;
}

const fieldTypeLabels: Record<ProjectBrainFieldType, string> = {
  text: "Teks Singkat",
  textarea: "Teks Panjang",
  number: "Angka",
  select: "Pilihan Tunggal",
  multiselect: "Pilihan Ganda",
  boolean: "Ya/Tidak",
  date: "Tanggal",
  url: "URL",
  email: "Email",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  completed: "Selesai",
  archived: "Arsip",
};

const statusIcons: Record<string, typeof FileText> = {
  draft: FileText,
  active: Zap,
  completed: CheckCircle2,
  archived: Archive,
};

const defaultTemplateFields: ProjectBrainField[] = [
  // === Project Profile ===
  { key: "project_name", label: "Nama Proyek", type: "text", required: true, placeholder: "Contoh: Pembangunan Jembatan Kali Brantas", helpText: "Nama resmi proyek", defaultValue: "", options: [], order: 0 },
  { key: "project_type", label: "Tipe Proyek", type: "select", required: true, placeholder: "Pilih tipe proyek", helpText: "Kategori utama proyek", defaultValue: "", options: ["Gedung", "Jalan", "Jembatan", "Infrastruktur"], order: 1 },
  { key: "project_stage", label: "Tahap Proyek", type: "select", required: true, placeholder: "Pilih tahap proyek", helpText: "Fase proyek saat ini", defaultValue: "", options: ["Planning", "Execution", "Closeout"], order: 2 },
  { key: "location", label: "Lokasi", type: "text", required: false, placeholder: "Contoh: Surabaya, Jawa Timur", helpText: "Lokasi proyek", defaultValue: "", options: [], order: 3 },
  { key: "owner_client", label: "Owner / Client", type: "text", required: false, placeholder: "Contoh: PT Jasa Marga, Kementerian PUPR", helpText: "Pemilik proyek atau klien", defaultValue: "", options: [], order: 4 },
  // === Key Technical Parameters ===
  { key: "structural_system", label: "Sistem Struktur", type: "text", required: false, placeholder: "Contoh: Beton bertulang, Baja, Komposit", helpText: "Sistem struktur utama yang digunakan", defaultValue: "", options: [], order: 5 },
  { key: "concrete_grade", label: "Mutu Beton (fc')", type: "text", required: false, placeholder: "Contoh: fc' 30 MPa", helpText: "Grade beton yang digunakan", defaultValue: "", options: [], order: 6 },
  { key: "construction_method", label: "Metode Konstruksi Utama", type: "text", required: false, placeholder: "Contoh: Konvensional, Precast, Prestress", helpText: "Metode kerja konstruksi utama", defaultValue: "", options: [], order: 7 },
  // === Project Constraints ===
  { key: "time_constraint", label: "Batasan Waktu", type: "select", required: false, placeholder: "Pilih batasan waktu", helpText: "Tingkat urgensi waktu proyek", defaultValue: "", options: ["Normal", "Tight"], order: 8 },
  { key: "cost_constraint", label: "Batasan Biaya", type: "select", required: false, placeholder: "Pilih batasan biaya", helpText: "Tingkat keketatan anggaran proyek", defaultValue: "", options: ["Normal", "Tight"], order: 9 },
  { key: "site_access", label: "Akses Lokasi", type: "select", required: false, placeholder: "Pilih kondisi akses", helpText: "Kondisi akses menuju lokasi proyek", defaultValue: "", options: ["Easy", "Limited"], order: 10 },
  { key: "environmental_factors", label: "Faktor Lingkungan", type: "text", required: false, placeholder: "Contoh: Dekat sungai, area rawan banjir", helpText: "Faktor lingkungan yang mempengaruhi proyek", defaultValue: "", options: [], order: 11 },
  // === Active Issues (sub-fields) ===
  { key: "issue_type", label: "Tipe Isu", type: "select", required: false, placeholder: "Pilih tipe isu", helpText: "Jenis masalah yang terjadi", defaultValue: "", options: ["Structural", "Quality", "Safety", "Method", "Cost", "Schedule", "Environment"], order: 12 },
  { key: "issue_location", label: "Lokasi/Elemen Isu", type: "text", required: false, placeholder: "Contoh: Kolom Lt.3, Pondasi zona B", helpText: "Lokasi atau elemen yang terdampak", defaultValue: "", options: [], order: 13 },
  { key: "issue_status", label: "Status Isu", type: "select", required: false, placeholder: "Pilih status", helpText: "Status penanganan isu saat ini", defaultValue: "", options: ["Open", "Monitoring", "Closed"], order: 14 },
  { key: "issue_since", label: "Isu Sejak", type: "date", required: false, placeholder: "", helpText: "Sejak kapan isu ini muncul", defaultValue: "", options: [], order: 15 },
  // === Key Decisions Log ===
  { key: "decision_summary", label: "Ringkasan Keputusan", type: "textarea", required: false, placeholder: "Contoh: Ganti metode pondasi dari bored pile ke driven pile", helpText: "Ringkasan keputusan teknis yang diambil", defaultValue: "", options: [], order: 16 },
  { key: "decision_reason", label: "Alasan Keputusan", type: "textarea", required: false, placeholder: "Contoh: Kondisi tanah tidak sesuai hasil soil test", helpText: "Alasan di balik keputusan yang diambil", defaultValue: "", options: [], order: 17 },
  { key: "decision_risk_level", label: "Level Risiko Keputusan", type: "select", required: false, placeholder: "Pilih level risiko", helpText: "Tingkat risiko dari keputusan ini", defaultValue: "Medium", options: ["Low", "Medium", "High"], order: 18 },
  { key: "decision_date", label: "Tanggal Keputusan", type: "date", required: false, placeholder: "", helpText: "Kapan keputusan ini diambil", defaultValue: "", options: [], order: 19 },
  { key: "decision_impact", label: "Dampak Keputusan", type: "select", required: false, placeholder: "Pilih dampak", helpText: "Area yang paling terdampak oleh keputusan ini", defaultValue: "", options: ["Cost", "Time", "Quality", "Safety", "Multi"], order: 20 },
  { key: "assumption_used", label: "Asumsi Utama", type: "textarea", required: false, placeholder: "Contoh: Data soil test dianggap valid hingga kedalaman 30 m", helpText: "Asumsi utama yang mendasari keputusan (penting untuk audit trail)", defaultValue: "", options: [], order: 21 },
  // === Test Data Snapshot ===
  { key: "slump", label: "Slump", type: "text", required: false, placeholder: "Contoh: 12 ± 2 cm", helpText: "Hasil uji slump beton", defaultValue: "", options: [], order: 22 },
  { key: "concrete_strength", label: "Kuat Tekan Beton", type: "text", required: false, placeholder: "Contoh: 28 hari = 32 MPa (Umur / Nilai)", helpText: "Hasil uji kuat tekan beton", defaultValue: "", options: [], order: 23 },
  { key: "inspection_notes", label: "Catatan Inspeksi", type: "textarea", required: false, placeholder: "Contoh: Visual check OK, rebar spacing sesuai gambar", helpText: "Catatan dari hasil inspeksi lapangan", defaultValue: "", options: [], order: 24 },
  // === Project Brain Status ===
  { key: "completeness_level", label: "Tingkat Kelengkapan Data", type: "select", required: false, placeholder: "Pilih level", helpText: "Seberapa lengkap data proyek yang tersedia", defaultValue: "", options: ["Draft", "Partial", "Complete"], order: 25 },
  { key: "last_updated", label: "Terakhir Diperbarui", type: "date", required: false, placeholder: "", helpText: "Tanggal terakhir data proyek diperbarui", defaultValue: "", options: [], order: 26 },
];

export function ProjectBrainPanel({ agent }: ProjectBrainPanelProps) {
  const { toast } = useToast();
  const agentId = String(agent.id);

  const { data: templates = [], isLoading: templatesLoading } = useProjectBrainTemplates(agentId);
  const { data: instances = [], isLoading: instancesLoading } = useProjectBrainInstances(agentId);

  const createTemplate = useCreateProjectBrainTemplate();
  const updateTemplate = useUpdateProjectBrainTemplate();
  const deleteTemplate = useDeleteProjectBrainTemplate();
  const createInstance = useCreateProjectBrainInstance();
  const updateInstance = useUpdateProjectBrainInstance();
  const activateInstance = useActivateProjectBrainInstance();
  const deleteInstance = useDeleteProjectBrainInstance();

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [fillInstanceDialogOpen, setFillInstanceDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectBrainTemplate | null>(null);
  const [fillingInstance, setFillingInstance] = useState<ProjectBrainInstance | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    fields: [...defaultTemplateFields] as ProjectBrainField[],
  });

  const [newInstance, setNewInstance] = useState({
    name: "",
    templateId: "",
    values: {} as Record<string, any>,
  });

  const [editFields, setEditFields] = useState<ProjectBrainField[]>([]);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateDesc, setEditTemplateDesc] = useState("");

  const [instanceValues, setInstanceValues] = useState<Record<string, any>>({});

  const addField = (fields: ProjectBrainField[], setFields: (f: ProjectBrainField[]) => void) => {
    setFields([
      ...fields,
      {
        key: `field_${fields.length + 1}`,
        label: "",
        type: "text" as ProjectBrainFieldType,
        required: false,
        placeholder: "",
        helpText: "",
        defaultValue: "",
        options: [],
        order: fields.length,
      },
    ]);
  };

  const updateField = (
    index: number,
    field: Partial<ProjectBrainField>,
    fields: ProjectBrainField[],
    setFields: (f: ProjectBrainField[]) => void
  ) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...field };
    setFields(updated);
  };

  const removeField = (index: number, fields: ProjectBrainField[], setFields: (f: ProjectBrainField[]) => void) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name) {
      toast({ title: "Error", description: "Nama template wajib diisi.", variant: "destructive" });
      return;
    }
    if (newTemplate.fields.length === 0) {
      toast({ title: "Error", description: "Tambahkan minimal satu field.", variant: "destructive" });
      return;
    }
    createTemplate.mutate(
      { agentId, name: newTemplate.name, description: newTemplate.description, fields: newTemplate.fields },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Template berhasil dibuat." });
          setTemplateDialogOpen(false);
          setNewTemplate({ name: "", description: "", fields: [...defaultTemplateFields] });
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal membuat template.", variant: "destructive" });
        },
      }
    );
  };

  const handleEditTemplate = (template: ProjectBrainTemplate) => {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateDesc(template.description || "");
    setEditFields(Array.isArray(template.fields) ? (template.fields as ProjectBrainField[]) : []);
    setEditTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    updateTemplate.mutate(
      { id: String(editingTemplate.id), agentId, data: { name: editTemplateName, description: editTemplateDesc, fields: editFields } },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Template berhasil diperbarui." });
          setEditTemplateDialogOpen(false);
          setEditingTemplate(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal memperbarui template.", variant: "destructive" });
        },
      }
    );
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate.mutate(
      { id, agentId },
      {
        onSuccess: () => toast({ title: "Berhasil", description: "Template berhasil dihapus." }),
      }
    );
  };

  const handleCreateInstance = () => {
    if (!newInstance.name || !newInstance.templateId) {
      toast({ title: "Error", description: "Nama proyek dan template wajib dipilih.", variant: "destructive" });
      return;
    }
    createInstance.mutate(
      { agentId, templateId: newInstance.templateId, name: newInstance.name, values: newInstance.values, status: "draft" as const },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Proyek berhasil dibuat." });
          setInstanceDialogOpen(false);
          setNewInstance({ name: "", templateId: "", values: {} });
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal membuat proyek.", variant: "destructive" });
        },
      }
    );
  };

  const handleFillInstance = (instance: ProjectBrainInstance) => {
    setFillingInstance(instance);
    setInstanceValues(
      typeof instance.values === "object" && instance.values ? { ...(instance.values as Record<string, any>) } : {}
    );
    setFillInstanceDialogOpen(true);
  };

  const handleSaveInstanceValues = () => {
    if (!fillingInstance) return;
    updateInstance.mutate(
      { id: String(fillingInstance.id), agentId, data: { values: instanceValues } },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Data proyek berhasil disimpan." });
          setFillInstanceDialogOpen(false);
          setFillingInstance(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive" });
        },
      }
    );
  };

  const handleActivateInstance = (id: string) => {
    activateInstance.mutate(
      { id, agentId },
      {
        onSuccess: () => toast({ title: "Berhasil", description: "Proyek diaktifkan sebagai konteks chatbot." }),
      }
    );
  };

  const handleDeleteInstance = (id: string) => {
    deleteInstance.mutate(
      { id, agentId },
      {
        onSuccess: () => toast({ title: "Berhasil", description: "Proyek berhasil dihapus." }),
      }
    );
  };

  const getTemplateForInstance = (instance: ProjectBrainInstance) => {
    return templates.find((t) => String(t.id) === String(instance.templateId));
  };

  const renderFieldInput = (
    field: ProjectBrainField,
    value: any,
    onChange: (val: any) => void
  ) => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
           
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
           
          />
        );
      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Pilih..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value === true || value === "true"}
              onCheckedChange={(checked) => onChange(checked)}
             
            />
            <span className="text-sm text-muted-foreground">{value ? "Ya" : "Tidak"}</span>
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
           
          />
        );
      case "url":
        return (
          <Input
            type="url"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "https://..."}
           
          />
        );
      case "email":
        return (
          <Input
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
           
          />
        );
      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
           
          />
        );
    }
  };

  const renderFieldEditor = (
    fields: ProjectBrainField[],
    setFields: (f: ProjectBrainField[]) => void
  ) => (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <Card key={index}>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">Field {index + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeField(index, fields, setFields)}
               
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Key</Label>
                <Input
                  value={field.key}
                  onChange={(e) => updateField(index, { key: e.target.value.replace(/\s/g, "_").toLowerCase() }, fields, setFields)}
                  placeholder="nama_field"
                 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value }, fields, setFields)}
                  placeholder="Nama Field"
                 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipe</Label>
                <Select
                  value={field.type}
                  onValueChange={(val: ProjectBrainFieldType) => updateField(index, { type: val }, fields, setFields)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypeLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => updateField(index, { placeholder: e.target.value }, fields, setFields)}
                  placeholder="Placeholder teks..."
                 
                />
              </div>
            </div>
            {(field.type === "select" || field.type === "multiselect") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Opsi (pisahkan dengan koma)</Label>
                <Input
                  value={(field.options || []).join(", ")}
                  onChange={(e) =>
                    updateField(index, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }, fields, setFields)
                  }
                  placeholder="Opsi 1, Opsi 2, Opsi 3"
                 
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => updateField(index, { required: checked }, fields, setFields)}
               
              />
              <Label className="text-xs">Wajib diisi</Label>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={() => addField(fields, setFields)}
        className="w-full"
       
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Field
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          Otak Proyek
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Definisikan data proyek yang menjadi konteks chatbot Anda
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="templates">
            Template ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="instances">
            Proyek ({instances.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Template mendefinisikan field data yang bisa diisi per proyek.
            </p>
            <Button onClick={() => setTemplateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4"><div className="h-5 bg-muted rounded w-1/3 mb-2" /><div className="h-4 bg-muted rounded w-2/3" /></CardContent>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-1">Belum Ada Template</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Buat template untuk mendefinisikan data proyek chatbot Anda
                </p>
                <Button onClick={() => setTemplateDialogOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Template Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const fields = Array.isArray(template.fields) ? (template.fields as ProjectBrainField[]) : [];
                const isExpanded = expandedTemplate === String(template.id);
                return (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="secondary">{fields.length} field</Badge>
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedTemplate(isExpanded ? null : String(template.id))}
                           
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTemplate(template)}
                           
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(String(template.id))}
                           
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      {isExpanded && fields.length > 0 && (
                        <div className="mt-3 border-t pt-3 space-y-2">
                          {fields.map((field, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="shrink-0">{fieldTypeLabels[field.type]}</Badge>
                              <span className="font-medium">{field.label || field.key}</span>
                              {field.required && <Badge variant="secondary" className="text-xs">Wajib</Badge>}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Proyek berisi data aktual yang digunakan chatbot sebagai konteks.
            </p>
            <Button
              onClick={() => setInstanceDialogOpen(true)}
              disabled={templates.length === 0}
             
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Proyek
            </Button>
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Buat template terlebih dahulu sebelum membuat proyek.</p>
              </CardContent>
            </Card>
          )}

          {instancesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4"><div className="h-5 bg-muted rounded w-1/3 mb-2" /><div className="h-4 bg-muted rounded w-2/3" /></CardContent>
                </Card>
              ))}
            </div>
          ) : instances.length === 0 && templates.length > 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-1">Belum Ada Proyek</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Buat proyek untuk mengisi data dan mengaktifkan konteks chatbot
                </p>
                <Button onClick={() => setInstanceDialogOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Proyek Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => {
                const template = getTemplateForInstance(instance);
                const StatusIcon = statusIcons[instance.status || "active"] || Zap;
                const valuesObj = typeof instance.values === "object" && instance.values ? instance.values as Record<string, any> : {};
                const filledCount = Object.values(valuesObj).filter((v) => v !== "" && v !== null && v !== undefined).length;
                const templateFields = template && Array.isArray(template.fields) ? (template.fields as ProjectBrainField[]) : [];
                const totalFields = templateFields.length;

                return (
                  <Card
                    key={instance.id}
                    className={instance.isActive ? "border-primary/50" : ""}
                   
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium">{instance.name}</h4>
                            {instance.isActive && <Badge className="bg-primary/20 text-primary border-primary/30">Konteks Aktif</Badge>}
                            <Badge variant="outline">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusLabels[instance.status || "active"]}
                            </Badge>
                          </div>
                          {template && (
                            <p className="text-xs text-muted-foreground">
                              Template: {template.name} | Data terisi: {filledCount}/{totalFields}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!instance.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateInstance(String(instance.id))}
                             
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Aktifkan
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFillInstance(instance)}
                           
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInstance(String(instance.id))}
                           
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Template Baru</DialogTitle>
            <DialogDescription>Definisikan field data untuk proyek chatbot Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Template</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Contoh: Data Properti, Info Produk"
               
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Deskripsi singkat template ini..."
                rows={2}
               
              />
            </div>
            <div className="space-y-2">
              <Label>Fields</Label>
              {renderFieldEditor(newTemplate.fields, (fields) => setNewTemplate({ ...newTemplate, fields }))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={createTemplate.isPending}
             
            >
              {createTemplate.isPending ? "Membuat..." : "Buat Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTemplateDialogOpen} onOpenChange={setEditTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Perbarui field dan konfigurasi template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Template</Label>
              <Input
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
               
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editTemplateDesc}
                onChange={(e) => setEditTemplateDesc(e.target.value)}
                rows={2}
               
              />
            </div>
            <div className="space-y-2">
              <Label>Fields</Label>
              {renderFieldEditor(editFields, setEditFields)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplateDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={updateTemplate.isPending}
             
            >
              {updateTemplate.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={instanceDialogOpen} onOpenChange={setInstanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Proyek Baru</DialogTitle>
            <DialogDescription>Pilih template dan beri nama proyek Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={newInstance.templateId}
                onValueChange={(val) => setNewInstance({ ...newInstance, templateId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Proyek</Label>
              <Input
                value={newInstance.name}
                onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                placeholder="Contoh: Rumah Tipe 36 Serpong"
               
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstanceDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleCreateInstance}
              disabled={createInstance.isPending}
             
            >
              {createInstance.isPending ? "Membuat..." : "Buat Proyek"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fillInstanceDialogOpen} onOpenChange={setFillInstanceDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Isi Data Proyek: {fillingInstance?.name}</DialogTitle>
            <DialogDescription>Data ini akan digunakan sebagai konteks chatbot</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fillingInstance && (() => {
              const template = getTemplateForInstance(fillingInstance);
              const fields = template && Array.isArray(template.fields) ? (template.fields as ProjectBrainField[]) : [];
              if (fields.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-4">Template tidak memiliki field.</p>;
              }
              return fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    {field.label || field.key}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                  {renderFieldInput(field, instanceValues[field.key], (val) =>
                    setInstanceValues({ ...instanceValues, [field.key]: val })
                  )}
                </div>
              ));
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFillInstanceDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSaveInstanceValues}
              disabled={updateInstance.isPending}
             
            >
              {updateInstance.isPending ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
