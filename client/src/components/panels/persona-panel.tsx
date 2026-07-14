import { useState, useEffect, useRef } from "react";
import { Bot, Save, Sparkles, MessageCircle, AlertCircle, Globe, Key, Shield, Plus, X, Cpu, Settings2, Eye, EyeOff, Camera, Upload, ClipboardList, Trash2, Scale, BookOpen, FileText, Gavel, FileCheck, Info, CheckCircle2, TriangleAlert, Zap, MessagesSquare } from "lucide-react";
import { CHAT_STYLES, CHAT_STYLE_KEYS, type ChatStyleKey } from "@/lib/chat-styles";
import { AgentPresentationExport } from "@/components/agent-presentation-export";
import { AiConfigFill } from "@/components/ai-config-fill";
import { AiFieldRegen } from "@/components/ai-field-regen";
import { ConfigHealth } from "@/components/config-health";
import { TemplateDialog } from "@/components/dialogs/template-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAgent } from "@/hooks/use-agents";
import { getCategoryById, getSubcategoryLabel } from "@/lib/categories";
import type { InsertAgent } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Agent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface KBSourceRecommendation {
  title: string;
  description: string;
  category: "uu" | "pp" | "peraturan" | "putusan" | "internal";
}

interface LegalAgentInfo {
  id: string;
  personaName: string;
  domain: string;
  recommendedKBSources: KBSourceRecommendation[];
}

const LEXCOM_TEMPLATE_NAME_TO_AGENT_ID: Record<string, string> = {
  "Lex Kriminal": "pidana",
  "Lex Civil": "perdata",
  "Lex Corp": "korporasi",
  "Lex Labor": "ketenagakerjaan",
  "Lex Agraria": "pertanahan",
  "Lex Fiscus": "pajak",
  "Lex Praesidium": "yurisprudensi",
  "Lex Scriptor": "drafter",
  "Lex Advocatus": "litigasi",
  "Lex Insolventia": "kepailitan",
  "Lex Nexus": "multiclaw",
  "Lex Futura": "openclaw",
};

interface PersonaPanelProps {
  agent: Agent;
}

const languages = [
  { code: "id", name: "Bahasa Indonesia" },
  { code: "en", name: "English" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

const aiModels = [
  // OpenAI
  { value: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", description: "Cepat & hemat biaya — pilihan terbaik untuk penggunaan sehari-hari" },
  { value: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Paling canggih dari OpenAI — pemahaman mendalam & multibahasa" },
  { value: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", description: "Performa tinggi dengan konteks panjang (128K token)" },
  { value: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", description: "Model lama yang masih cepat dan ekonomis" },
  // DeepSeek
  { value: "deepseek-chat", name: "DeepSeek V3 Chat", provider: "DeepSeek", description: "Sangat hemat biaya — performa setara GPT-4 dengan harga lebih rendah" },
  { value: "deepseek-reasoner", name: "DeepSeek R1 Reasoner", provider: "DeepSeek", description: "Penalaran bertahap (chain-of-thought) — ideal untuk analisis kompleks & regulasi" },
  // Qwen (Alibaba)
  { value: "qwen-turbo", name: "Qwen Turbo", provider: "Alibaba Qwen", description: "Ringan & cepat — optimal untuk percakapan volume tinggi" },
  { value: "qwen-plus", name: "Qwen Plus", provider: "Alibaba Qwen", description: "Seimbang antara kecepatan dan kemampuan — pilihan umum untuk chatbot bisnis" },
  { value: "qwen-max", name: "Qwen Max", provider: "Alibaba Qwen", description: "Model terkuat Qwen — multi-bahasa Asia terbaik termasuk Bahasa Indonesia" },
  // Google Gemini
  { value: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google Gemini", description: "Sangat cepat — ideal untuk respons real-time dan konteks panjang" },
  { value: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google Gemini", description: "Kapabilitas penuh Gemini — konteks 1 juta token, multimodal" },
  { value: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google Gemini", description: "Generasi terbaru Gemini — kecepatan dan akurasi tinggi" },
  // Anthropic (via proxy)
  { value: "claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", description: "Respons cepat — cocok untuk tugas-tugas ringan dan chatbot customer service" },
  { value: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic", description: "Performa seimbang — analisis mendalam dengan nuansa bahasa yang baik" },
  { value: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", description: "Terkuat Claude saat ini — coding, analisis, dan penulisan profesional" },
  // Custom
  { value: "custom", name: "Model Kustom", provider: "Custom", description: "Gunakan API model Anda sendiri — kompatibel OpenAI API format" },
];

export function PersonaPanel({ agent }: PersonaPanelProps) {
  const { toast } = useToast();
  const updateAgent = useUpdateAgent();

  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar || "",
    tagline: agent.tagline,
    philosophy: agent.philosophy,
    offTopicHandling: agent.offTopicHandling,
    offTopicResponse: agent.offTopicResponse || "",
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    aiModel: agent.aiModel || "gpt-4o-mini",
    customApiKey: agent.customApiKey || "",
    customBaseUrl: agent.customBaseUrl || "",
    customModelName: agent.customModelName || "",
    greetingMessage: agent.greetingMessage || "",
    conversationStarters: agent.conversationStarters || [],
    language: agent.language || "id",
    isPublic: agent.isPublic || false,
    allowedDomains: agent.allowedDomains || [],
    contextQuestions: (agent as any).contextQuestions || [],
    responseStyle: ((agent as any).responseStyle || "balanced") as "creative" | "structured" | "balanced" | "custom",
    customResponseStyle: (agent as any).customResponseStyle || "",
    chatStyle: ((agent as any).chatStyle || "direktif") as ChatStyleKey,
  });

  const [newStarter, setNewStarter] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [lexcomTemplateOpen, setLexcomTemplateOpen] = useState(false);
  const [lexcomApplied, setLexcomApplied] = useState(false);
  const [appliedAgentSources, setAppliedAgentSources] = useState<KBSourceRecommendation[]>([]);
  const [appliedAgentDomain, setAppliedAgentDomain] = useState<string>("");

  const { data: legalAgents } = useQuery<LegalAgentInfo[]>({
    queryKey: ["/api/legal-agents"],
  });
  const [newContextLabel, setNewContextLabel] = useState("");
  const [newContextType, setNewContextType] = useState<"text" | "select">("select");
  const [newContextOptions, setNewContextOptions] = useState("");
  const [newContextRequired, setNewContextRequired] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form HANYA ketika berpindah ke agent berbeda (agent.id berubah)
    // Jangan reset saat data agent diperbarui (autoSave) agar field lain tidak hilang
    setFormData({
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar || "",
      tagline: agent.tagline,
      philosophy: agent.philosophy,
      offTopicHandling: agent.offTopicHandling,
      offTopicResponse: agent.offTopicResponse || "",
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      aiModel: agent.aiModel || "gpt-4o-mini",
      customApiKey: agent.customApiKey || "",
      customBaseUrl: agent.customBaseUrl || "",
      customModelName: agent.customModelName || "",
      greetingMessage: agent.greetingMessage || "",
      conversationStarters: agent.conversationStarters || [],
      language: agent.language || "id",
      isPublic: agent.isPublic || false,
      allowedDomains: agent.allowedDomains || [],
      contextQuestions: (agent as any).contextQuestions || [],
      responseStyle: ((agent as any).responseStyle || "balanced") as "creative" | "structured" | "balanced" | "custom",
      customResponseStyle: (agent as any).customResponseStyle || "",
      chatStyle: ((agent as any).chatStyle || "direktif") as ChatStyleKey,
    });
    setLexcomApplied(false);
    setAppliedAgentSources([]);
    setAppliedAgentDomain("");
  }, [agent.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Hanya file gambar yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const res = await fetch("/api/agents/avatar-upload", {
        method: "POST",
        body: formDataUpload,
      });
      
      if (!res.ok) throw new Error("Failed to upload avatar");
      const result = await res.json();
      
      setFormData({ ...formData, avatar: result.fileUrl });
      toast({
        title: "Berhasil",
        description: "Avatar berhasil diupload. Klik Save Changes untuk menyimpan.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengupload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    updateAgent.mutate(
      { id: agent.id, data: formData },
      {
        onSuccess: () => {
          toast({
            title: "Persona Updated",
            description: "Your chatbot persona has been saved successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update persona. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const autoSaveField = (field: string, value: unknown) => {
    updateAgent.mutate(
      { id: agent.id, data: { [field]: value } },
      {
        onError: () => {
          toast({
            title: "Error",
            description: "Gagal menyimpan perubahan otomatis.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const addConversationStarter = () => {
    if (newStarter.trim() && formData.conversationStarters.length < 5) {
      const updated = [...formData.conversationStarters, newStarter.trim()];
      setFormData({
        ...formData,
        conversationStarters: updated,
      });
      setNewStarter("");
      autoSaveField("conversationStarters", updated);
    }
  };

  const removeConversationStarter = (index: number) => {
    const updated = formData.conversationStarters.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      conversationStarters: updated,
    });
    autoSaveField("conversationStarters", updated);
  };

  const addAllowedDomain = () => {
    if (newDomain.trim() && formData.allowedDomains.length < 10) {
      const updated = [...formData.allowedDomains, newDomain.trim()];
      setFormData({
        ...formData,
        allowedDomains: updated,
      });
      setNewDomain("");
      autoSaveField("allowedDomains", updated);
    }
  };

  const removeAllowedDomain = (index: number) => {
    const updated = formData.allowedDomains.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      allowedDomains: updated,
    });
    autoSaveField("allowedDomains", updated);
  };

  const copyAccessToken = () => {
    if (agent.accessToken) {
      navigator.clipboard.writeText(agent.accessToken);
      toast({
        title: "Copied",
        description: "Access token copied to clipboard.",
      });
    }
  };

  const handleApplyLexcomTemplate = (template: Partial<InsertAgent>) => {
    const updated = {
      ...formData,
      ...(template.systemPrompt ? { systemPrompt: template.systemPrompt } : {}),
      ...(template.greetingMessage ? { greetingMessage: template.greetingMessage } : {}),
      ...(template.conversationStarters ? { conversationStarters: Array.isArray(template.conversationStarters) ? template.conversationStarters : [] } : {}),
      ...(template.name ? { name: template.name } : {}),
      ...(template.tagline ? { tagline: template.tagline } : {}),
      ...(template.description ? { description: template.description } : {}),
    };
    setFormData(updated);

    const agentId = template.name ? LEXCOM_TEMPLATE_NAME_TO_AGENT_ID[template.name] : undefined;
    const matchedAgent = agentId ? legalAgents?.find((a) => a.id === agentId) : undefined;
    if (matchedAgent) {
      setAppliedAgentSources(matchedAgent.recommendedKBSources);
      setAppliedAgentDomain(matchedAgent.domain);
    } else {
      setAppliedAgentSources([]);
      setAppliedAgentDomain("");
    }
    setLexcomApplied(true);

    toast({
      title: "Template LexCom Diterapkan",
      description: "System prompt, greeting, dan conversation starters telah diperbarui. Klik Save untuk menyimpan.",
    });
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg md:text-2xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
            <span className="truncate">Persona</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">
            Define your chatbot's personality and behavior
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AgentPresentationExport agent={agent} formData={formData} />
          <Button
            onClick={handleSave}
            disabled={updateAgent.isPending}
            size="sm"
            className="shrink-0"
          >
            <Save className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{updateAgent.isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Config Health */}
      <ConfigHealth
        label="Kelengkapan Persona"
        fields={[
          { field: "name", label: "Nama", value: formData.name, minLength: 2 },
          { field: "tagline", label: "Tagline", value: formData.tagline, minLength: 5 },
          { field: "description", label: "Deskripsi", value: formData.description, minLength: 20 },
          { field: "greetingMessage", label: "Pesan Sambutan", value: formData.greetingMessage, minLength: 20 },
          { field: "philosophy", label: "Filosofi Komunikasi", value: formData.philosophy, minLength: 30, weight: 2 },
          { field: "systemPrompt", label: "System Prompt", value: formData.systemPrompt, minLength: 100, weight: 3 },
          { field: "offTopicResponse", label: "Respons Off-Topic", value: formData.offTopicResponse, minLength: 20 },
        ]}
      />

      {/* AI Auto-Fill */}
      <AiConfigFill
        level="agent-persona"
        parentContext={{ agentName: agent.name }}
        defaultTopic={agent.description || agent.name}
        onFill={(result) => {
          const updated = { ...formData };
          if (result.name) updated.name = result.name;
          if (result.tagline) updated.tagline = result.tagline;
          if (result.description) updated.description = result.description;
          if (result.greetingMessage) updated.greetingMessage = result.greetingMessage;
          if (Array.isArray(result.conversationStarters) && result.conversationStarters.length > 0) {
            updated.conversationStarters = result.conversationStarters.slice(0, 5);
          }
          if (result.systemPrompt) updated.systemPrompt = result.systemPrompt;
          if (result.philosophy) updated.philosophy = result.philosophy;
          if (result.offTopicHandling) updated.offTopicHandling = result.offTopicHandling;
          if (result.offTopicResponse) updated.offTopicResponse = result.offTopicResponse;
          setFormData(updated);
          updateAgent.mutate({ id: agent.id, data: updated });
        }}
      />

      {/* Basic Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Identitas
          </CardTitle>
          <CardDescription>Informasi dasar tentang chatbot Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={formData.avatar} alt={formData.name} />
                <AvatarFallback className="text-xl bg-primary/10">
                  {formData.name ? formData.name.substring(0, 2).toUpperCase() : <Bot className="h-8 w-8 text-primary" />}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
               
              >
                {isUploadingAvatar ? (
                  <Upload className="h-3.5 w-3.5 animate-pulse" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
               
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-sm">Avatar Chatbot</Label>
              <p className="text-xs text-muted-foreground">
                Klik ikon kamera untuk upload gambar avatar. Format: JPG, PNG, GIF, WebP. Maksimal 5MB. Rekomendasi ukuran: 200x200 hingga 500x500 pixel (rasio 1:1).
              </p>
              {formData.avatar && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7 px-2"
                  onClick={() => setFormData({ ...formData, avatar: "" })}
                >
                  <X className="w-3 h-3 mr-1" />
                  Hapus Avatar
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <Label htmlFor="name" className="text-sm">Nama Chatbot</Label>
                <AiFieldRegen fieldName="name" fieldLabel="Chatbot Name" currentValue={formData.name} agentContext={{ agentName: formData.name, agentDescription: formData.description }} onApply={(v) => setFormData({ ...formData, name: v })} />
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Asisten Saya"
               
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <Label htmlFor="tagline" className="text-sm">Tagline</Label>
                <AiFieldRegen fieldName="tagline" fieldLabel="Tagline" currentValue={formData.tagline} agentContext={{ agentName: formData.name, agentDescription: formData.description }} onApply={(v) => setFormData({ ...formData, tagline: v })} />
              </div>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Asisten AI yang siap membantu Anda"
               
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Label htmlFor="description">Deskripsi</Label>
              <AiFieldRegen fieldName="description" fieldLabel="Description" currentValue={formData.description} agentContext={{ agentName: formData.name, agentDescription: formData.description }} onApply={(v) => setFormData({ ...formData, description: v })} />
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat apa yang dilakukan chatbot ini dan untuk siapa..."
              rows={3}
             
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Bahasa Utama</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Pilih bahasa" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {agent.category && (
            <div className="space-y-2">
              <Label>Kategori Bisnis</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {(() => {
                  const category = getCategoryById(agent.category);
                  if (!category) return null;
                  const IconComponent = category.icon;
                  return (
                    <>
                      <IconComponent className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">
                        {category.label}
                        {agent.subcategory && (
                          <span className="text-muted-foreground">
                            {" "}&gt; {getSubcategoryLabel(agent.category, agent.subcategory)}
                          </span>
                        )}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Greeting & Conversation Starters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Sambutan Pertama
          </CardTitle>
          <CardDescription>Kesan pertama saat pengguna membuka percakapan dengan chatbot Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Label htmlFor="greetingMessage">Pesan Sambutan</Label>
              <AiFieldRegen fieldName="greetingMessage" fieldLabel="Greeting Message" currentValue={formData.greetingMessage} agentContext={{ agentName: formData.name, agentDescription: formData.description, systemPromptSnippet: formData.systemPrompt }} onApply={(v) => setFormData({ ...formData, greetingMessage: v })} />
            </div>
            <Textarea
              id="greetingMessage"
              value={formData.greetingMessage}
              onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
              placeholder="Halo! Selamat datang. Ada yang bisa saya bantu hari ini?"
              rows={2}
             
            />
            <p className="text-xs text-muted-foreground">
              Pesan ini ditampilkan saat pengguna pertama kali membuka chat
            </p>
          </div>
          <div className="space-y-2">
            <Label>Pertanyaan Pembuka</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Tombol pintasan yang bisa diklik pengguna untuk memulai percakapan (maks 5)
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.conversationStarters.map((starter, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pl-3">
                  {starter}
                  <button
                    onClick={() => removeConversationStarter(index)}
                    className="ml-1 hover:text-destructive"
                   
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {formData.conversationStarters.length < 5 && (
              <div className="flex gap-2">
                <Input
                  value={newStarter}
                  onChange={(e) => setNewStarter(e.target.value)}
                  placeholder="Contoh: Bagaimana cara memulai?"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConversationStarter())}
                 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addConversationStarter}
                  disabled={!newStarter.trim()}
                 
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Context Questions / Konteks Proyek */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Konteks Proyek
          </CardTitle>
          <CardDescription>
            Pertanyaan yang ditanyakan chatbot di awal percakapan untuk memahami konteks pengguna. Jawaban akan digunakan chatbot untuk menyesuaikan responnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.contextQuestions.length > 0 && (
            <div className="space-y-2">
              {formData.contextQuestions.map((q: any, index: number) => (
                <div key={q.id} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{q.label}</span>
                      <Badge variant="secondary">{q.type === "select" ? "Pilihan" : "Teks Bebas"}</Badge>
                      {q.required && <Badge variant="outline" className="text-xs">Wajib</Badge>}
                    </div>
                    {q.type === "select" && q.options?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {q.options.map((opt: string, i: number) => (
                          <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{opt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = formData.contextQuestions.filter((_: any, i: number) => i !== index);
                      setFormData({ ...formData, contextQuestions: updated });
                    }}
                    data-testid={`button-remove-context-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {formData.contextQuestions.length < 10 && (
            <div className="space-y-3 p-4 rounded-lg border border-dashed">
              <p className="text-sm font-medium text-muted-foreground">Tambah Pertanyaan Konteks</p>
              <div className="space-y-2">
                <Input
                  value={newContextLabel}
                  onChange={(e) => setNewContextLabel(e.target.value)}
                  placeholder="Contoh: Jenis proyek apa yang Anda kelola?"
                  data-testid="input-context-label"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Tipe:</Label>
                  <Select
                    value={newContextType}
                    onValueChange={(v) => setNewContextType(v as "text" | "select")}
                  >
                    <SelectTrigger className="w-[140px]" data-testid="select-context-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Pilihan</SelectItem>
                      <SelectItem value="text">Teks Bebas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newContextRequired}
                    onCheckedChange={setNewContextRequired}
                    data-testid="switch-context-required"
                  />
                  <Label className="text-sm">Wajib</Label>
                </div>
              </div>
              {newContextType === "select" && (
                <div className="space-y-1">
                  <Input
                    value={newContextOptions}
                    onChange={(e) => setNewContextOptions(e.target.value)}
                    placeholder="Pilihan dipisah koma: Gedung, Jalan, Irigasi, Jembatan"
                    data-testid="input-context-options"
                  />
                  <p className="text-xs text-muted-foreground">Pisahkan setiap pilihan dengan tanda koma</p>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!newContextLabel.trim()) return;
                  const options = newContextType === "select"
                    ? newContextOptions.split(",").map(o => o.trim()).filter(Boolean)
                    : [];
                  if (newContextType === "select" && options.length === 0) return;
                  const newQuestion = {
                    id: `ctx_${Date.now()}`,
                    label: newContextLabel.trim(),
                    type: newContextType,
                    options,
                    required: newContextRequired,
                  };
                  setFormData({
                    ...formData,
                    contextQuestions: [...formData.contextQuestions, newQuestion],
                  });
                  setNewContextLabel("");
                  setNewContextOptions("");
                  setNewContextRequired(true);
                }}
                disabled={!newContextLabel.trim() || (newContextType === "select" && !newContextOptions.trim())}
                data-testid="button-add-context-question"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pertanyaan
              </Button>
            </div>
          )}

          {formData.contextQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Belum ada pertanyaan konteks. Tambahkan pertanyaan agar chatbot memahami kebutuhan pengguna di awal percakapan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Personality & Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Kepribadian & Perilaku
          </CardTitle>
          <CardDescription>Cara chatbot berinteraksi dan berkomunikasi dengan pengguna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Style Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MessagesSquare className="w-3.5 h-3.5 text-primary" />
              Karakter Dialog
            </Label>
            <p className="text-xs text-muted-foreground">Pilih gaya interaksi chatbot — mempengaruhi cara bot merespons dan membangun dialog</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {CHAT_STYLE_KEYS.map((key) => {
                const style = CHAT_STYLES[key];
                const isSelected = formData.chatStyle === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, chatStyle: key });
                      autoSaveField("chatStyle", key);
                    }}
                    data-testid={`button-chat-style-${key}`}
                    className={`
                      relative text-left rounded-lg border-2 p-3 transition-all cursor-pointer
                      ${isSelected
                        ? `${style.borderClass} ${style.bgClass}`
                        : "border-border bg-background hover:border-muted-foreground/40 hover:bg-muted/30"
                      }
                    `}
                  >
                    {isSelected && (
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${style.dotClass}`} />
                    )}
                    <div className="text-lg mb-1">{style.emoji}</div>
                    <div className={`font-semibold text-sm ${isSelected ? style.textClass : ""}`}>
                      {style.label}
                    </div>
                    <div className={`text-[10px] font-medium mb-1 ${isSelected ? style.textClass : "text-muted-foreground"}`}>
                      {style.tagline}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      {style.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Label htmlFor="philosophy">Filosofi Komunikasi</Label>
              <AiFieldRegen fieldName="philosophy" fieldLabel="Communication Philosophy" currentValue={formData.philosophy} agentContext={{ agentName: formData.name, agentDescription: formData.description, systemPromptSnippet: formData.systemPrompt }} onApply={(v) => setFormData({ ...formData, philosophy: v })} />
            </div>
            <Textarea
              id="philosophy"
              value={formData.philosophy}
              onChange={(e) => setFormData({ ...formData, philosophy: e.target.value })}
              placeholder="Contoh: Komunikasi direktif berbasis regulasi, hindari spekulasi, selalu kutip sumber hukum, gunakan bahasa formal namun mudah dipahami..."
              rows={3}
             
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <div className="flex items-center gap-1">
                <AiFieldRegen fieldName="systemPrompt" fieldLabel="System Prompt" currentValue={formData.systemPrompt} agentContext={{ agentName: formData.name, agentDescription: formData.description }} onApply={(v) => setFormData({ ...formData, systemPrompt: v })} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLexcomTemplateOpen(true)}
                  className="text-xs h-7 gap-1.5 border-amber-400/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  data-testid="button-apply-lexcom-template"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Template LexCom
                </Button>
              </div>
            </div>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Anda adalah asisten ahli yang membantu pengguna dengan..."
              rows={5}
              className="font-mono text-sm"
             
            />
            <p className="text-xs text-muted-foreground">
              The system prompt defines the core behavior and context for your chatbot. Gunakan tombol "Template LexCom" untuk menerapkan sistem prompt spesialis hukum Indonesia.
            </p>

            {/* ── Master Standar v2.0 Status Badge (Orchestrator only) ── */}
            {(agent as any).isOrchestrator && (() => {
              const prompt = formData.systemPrompt || "";
              const hasPolaKerja = prompt.includes("POLA KERJA v2.0");
              const hasStateMachine = prompt.includes("STATE_MACHINE_v2.0") || prompt.includes("STATE MACHINE") || prompt.includes("State Machine");
              const hasFallback = prompt.includes("FALLBACK MODE") || prompt.includes("FALLBACK");
              const isV2 = hasPolaKerja && hasStateMachine;
              const score = [hasPolaKerja, hasStateMachine, hasFallback].filter(Boolean).length;

              return (
                <div
                  className={`mt-2 rounded-lg border px-3 py-2.5 flex items-start gap-2.5 ${
                    isV2
                      ? "border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-700/40"
                      : "border-orange-300/70 bg-orange-50/70 dark:bg-orange-950/25 dark:border-orange-700/50"
                  }`}
                  data-testid="badge-orchestrator-v2-status"
                >
                  {isV2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <TriangleAlert className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${isV2 ? "text-emerald-800 dark:text-emerald-300" : "text-orange-800 dark:text-orange-300"}`}>
                        {isV2 ? "Master Standar v2.0 — Aktif" : "Perlu Upgrade ke Master Standar v2.0"}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                        isV2 ? "bg-emerald-200/60 text-emerald-800 dark:bg-emerald-800/30 dark:text-emerald-300" : "bg-orange-200/60 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300"
                      }`}>
                        {score}/3 blok
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {[
                        { label: "POLA KERJA v2.0", ok: hasPolaKerja },
                        { label: "STATE MACHINE", ok: hasStateMachine },
                        { label: "FALLBACK MODE", ok: hasFallback },
                      ].map(({ label, ok }) => (
                        <span key={label} className={`text-[10px] flex items-center gap-1 ${ok ? "text-emerald-700 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
                          {ok ? "✓" : "✗"} {label}
                        </span>
                      ))}
                    </div>
                    {!isV2 && (
                      <p className="text-[10px] text-orange-700/80 dark:text-orange-400/70 mt-1">
                        Klik ✨ di samping label System Prompt → AI akan generate ulang dengan standar v2.0 lengkap.
                      </p>
                    )}
                  </div>
                  {isV2 && (
                    <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })()}

            {lexcomApplied && (
              <div className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-700/40 p-4 space-y-3" data-testid="callout-lexcom-kb-guidance">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Tambahkan Dokumen Hukum ke Knowledge Base
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
                      {appliedAgentDomain
                        ? `Untuk agen ${appliedAgentDomain}, upload dokumen referensi berikut ke tab KB agar agen dapat menjawab berdasarkan materi spesifik Anda.`
                        : "Upload dokumen hukum relevan ke tab KB agar agen LexCom dapat menjawab berdasarkan materi spesifik Anda."}
                    </p>
                  </div>
                </div>

                {appliedAgentSources.length > 0 && (
                  <div className="space-y-1.5 pl-6">
                    {appliedAgentSources.map((src, idx) => {
                      const icons: Record<string, React.ReactNode> = {
                        uu: <FileText className="w-3 h-3 text-blue-500 shrink-0" />,
                        pp: <FileCheck className="w-3 h-3 text-green-500 shrink-0" />,
                        peraturan: <FileCheck className="w-3 h-3 text-emerald-500 shrink-0" />,
                        putusan: <Gavel className="w-3 h-3 text-purple-500 shrink-0" />,
                        internal: <Upload className="w-3 h-3 text-amber-600 shrink-0" />,
                      };
                      const categoryLabels: Record<string, string> = {
                        uu: "UU",
                        pp: "PP",
                        peraturan: "Peraturan",
                        putusan: "Putusan",
                        internal: "Dokumen Internal",
                      };
                      return (
                        <div key={idx} className="flex items-start gap-1.5" data-testid={`kb-source-item-${idx}`}>
                          {icons[src.category] ?? <Info className="w-3 h-3 shrink-0" />}
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground/80">{src.title}</span>
                            <span className="ml-1 text-xs text-muted-foreground">— {src.description}</span>
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 border-current opacity-60">
                              {categoryLabels[src.category] ?? src.category}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pl-6">
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/60 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    Buka tab <strong className="mx-0.5">KB</strong> di panel navigasi untuk upload file PDF atau DOCX.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Off-Topic Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Off-Topic Handling
          </CardTitle>
          <CardDescription>Bagaimana chatbot merespons pertanyaan di luar topik</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offTopicHandling">Strategi Respons</Label>
            <Select
              value={formData.offTopicHandling}
              onValueChange={(value) => setFormData({ ...formData, offTopicHandling: value })}
            >
              <SelectTrigger id="offTopicHandling">
                <SelectValue placeholder="Pilih strategi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="politely_redirect">Arahkan dengan Sopan</SelectItem>
                <SelectItem value="acknowledge_and_decline">Akui dan Tolak</SelectItem>
                <SelectItem value="attempt_to_help">Tetap Coba Bantu</SelectItem>
                <SelectItem value="strict_boundaries">Batasan Ketat</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Menentukan bagaimana chatbot menangani pertanyaan di luar cakupan yang ditentukan
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Label htmlFor="offTopicResponse">Respons Kustom (Opsional)</Label>
              <AiFieldRegen fieldName="offTopicResponse" fieldLabel="Respons Off-Topic" currentValue={formData.offTopicResponse} agentContext={{ agentName: formData.name, agentDescription: formData.description, systemPromptSnippet: formData.systemPrompt }} onApply={(v) => setFormData({ ...formData, offTopicResponse: v })} />
            </div>
            <Textarea
              id="offTopicResponse"
              value={formData.offTopicResponse}
              onChange={(e) => setFormData({ ...formData, offTopicResponse: e.target.value })}
              placeholder="Contoh: Maaf, saya hanya bisa membantu dengan pertanyaan seputar produk kami. Silakan hubungi customer service untuk pertanyaan lainnya."
              rows={3}
             
            />
            <p className="text-xs text-muted-foreground">
              Tulis respons kustom yang akan diberikan chatbot ketika menerima pertanyaan di luar topik. 
              Kosongkan untuk menggunakan respons otomatis berdasarkan strategi di atas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Konfigurasi Model AI
          </CardTitle>
          <CardDescription>Pilih model AI yang menggerakkan chatbot Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aiModel">Model AI</Label>
            <Select
              value={formData.aiModel}
              onValueChange={(value) => setFormData({ ...formData, aiModel: value as typeof formData.aiModel })}
            >
              <SelectTrigger id="aiModel">
                <SelectValue placeholder="Pilih model AI" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">OpenAI</SelectLabel>
                  {aiModels.filter(m => m.provider === "OpenAI").map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <span>{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">DeepSeek</SelectLabel>
                  {aiModels.filter(m => m.provider === "DeepSeek").map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <span>{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">Alibaba Qwen</SelectLabel>
                  {aiModels.filter(m => m.provider === "Alibaba Qwen").map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <span>{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">Google Gemini</SelectLabel>
                  {aiModels.filter(m => m.provider === "Google Gemini").map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <span>{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">Anthropic</SelectLabel>
                  {aiModels.filter(m => m.provider === "Anthropic").map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <span>{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">Lainnya</SelectLabel>
                  {aiModels.filter(m => m.provider === "Custom").map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <span>{model.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {aiModels.find(m => m.value === formData.aiModel)?.description || "Choose an AI model"}
            </p>
          </div>

          {/* Model-specific info badge */}
          {(formData.aiModel.startsWith("deepseek-") || formData.aiModel.startsWith("qwen-") || formData.aiModel.startsWith("gemini-") || formData.aiModel.startsWith("gpt-")) && (
            <div className="flex items-start gap-2 p-3 rounded-lg border bg-primary/5 border-primary/20">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                {formData.aiModel.startsWith("deepseek-") && (
                  <>API key DeepSeek sudah dikonfigurasi di server. Tidak perlu pengaturan tambahan. Untuk menggunakan API key pribadi, masukkan di kolom API Key di bawah. Dapatkan di <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.deepseek.com</a></>
                )}
                {formData.aiModel.startsWith("qwen-") && (
                  <>API key Qwen (Alibaba Cloud) sudah dikonfigurasi di server. Model Qwen unggul untuk Bahasa Indonesia & konten Asia Tenggara. Dapatkan API key di <a href="https://dashscope.aliyuncs.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">dashscope.aliyuncs.com</a></>
                )}
                {formData.aiModel.startsWith("gemini-") && (
                  <>API key Gemini (Google) sudah dikonfigurasi di server. Model Gemini mendukung konteks sangat panjang (hingga 1 juta token). Dapatkan API key di <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">aistudio.google.com</a></>
                )}
                {formData.aiModel.startsWith("gpt-") && (
                  <>Model OpenAI — API key sudah dikonfigurasi di server. Jika ingin menggunakan API key Anda sendiri, masukkan di bawah atau gunakan opsi "Model Kustom".</>
                )}
              </p>
            </div>
          )}

          {(formData.aiModel === "custom" || formData.aiModel.startsWith("claude-") || formData.aiModel.startsWith("deepseek-") || formData.aiModel.startsWith("qwen-") || formData.aiModel.startsWith("gemini-") || formData.aiModel.startsWith("gpt-")) && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Settings2 className="w-4 h-4" />
                {formData.aiModel.startsWith("claude-")
                  ? "Pengaturan Claude Proxy"
                  : formData.aiModel.startsWith("deepseek-")
                    ? "Pengaturan API DeepSeek (Opsional)"
                    : formData.aiModel.startsWith("qwen-")
                      ? "Pengaturan API Qwen (Opsional)"
                      : formData.aiModel.startsWith("gemini-")
                        ? "Pengaturan API Gemini (Opsional)"
                        : formData.aiModel.startsWith("gpt-")
                          ? "Pengaturan API OpenAI (Opsional)"
                          : "Pengaturan Model Kustom"}
              </div>
              {formData.aiModel.startsWith("claude-") && (
                <p className="text-xs text-muted-foreground">
                  Model Claude memerlukan proxy OpenAI-compatible (seperti OpenRouter atau LiteLLM). Isi endpoint proxy Anda di bawah.
                </p>
              )}
              {formData.aiModel === "custom" && (
                <p className="text-xs text-muted-foreground">
                  Gunakan model AI Anda sendiri dengan API yang kompatibel format OpenAI. Isi API Key, Base URL, dan nama model.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="customApiKey">
                  {formData.aiModel.startsWith("deepseek-") ? "API Key DeepSeek (Opsional)" :
                   formData.aiModel.startsWith("qwen-") ? "API Key Qwen (Opsional)" :
                   formData.aiModel.startsWith("gemini-") ? "API Key Gemini (Opsional)" :
                   formData.aiModel.startsWith("gpt-") ? "API Key OpenAI (Opsional)" :
                   "API Key"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="customApiKey"
                    type={showApiKey ? "text" : "password"}
                    value={formData.customApiKey}
                    onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
                    placeholder={
                      formData.aiModel.startsWith("deepseek-") ? "sk-..." :
                      formData.aiModel.startsWith("qwen-") ? "sk-..." :
                      formData.aiModel.startsWith("gemini-") ? "AIza..." :
                      "sk-..."
                    }
                    className="font-mono text-sm"
                    data-testid="input-custom-api-key"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    data-testid="button-toggle-api-key-visibility"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.aiModel.startsWith("deepseek-") || formData.aiModel.startsWith("qwen-") || formData.aiModel.startsWith("gemini-") || formData.aiModel.startsWith("gpt-")
                    ? "Biarkan kosong untuk menggunakan API key server default. Isi hanya jika ingin memakai key Anda sendiri."
                    : "API key untuk autentikasi ke layanan model"}
                </p>
              </div>
              {(formData.aiModel === "custom" || formData.aiModel.startsWith("claude-")) && (
                <div className="space-y-2">
                  <Label htmlFor="customBaseUrl">Base URL</Label>
                  <Input
                    id="customBaseUrl"
                    value={formData.customBaseUrl}
                    onChange={(e) => setFormData({ ...formData, customBaseUrl: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    data-testid="input-custom-base-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL endpoint API (contoh: https://openrouter.ai/api/v1)
                  </p>
                </div>
              )}
              {(formData.aiModel === "custom" || formData.aiModel.startsWith("claude-")) && (
                <div className="space-y-2">
                  <Label htmlFor="customModelName">Nama Model</Label>
                  <Input
                    id="customModelName"
                    value={formData.customModelName}
                    onChange={(e) => setFormData({ ...formData, customModelName: e.target.value })}
                    placeholder={formData.aiModel.startsWith("claude-") ? "claude-3-5-sonnet-20241022" : "gpt-4"}
                    data-testid="input-custom-model-name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Identifier model spesifik yang digunakan (sesuai dokumentasi provider)
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Style Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gaya Respons AI
          </CardTitle>
          <CardDescription>Pilih kepribadian dan format output chatbot Anda — seperti ChatGPT yang kreatif atau Claude yang terstruktur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              {
                value: "creative" as const,
                icon: "✨",
                title: "Kreatif",
                subtitle: "Seperti ChatGPT",
                color: "border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700",
                activeColor: "border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700",
                textColor: "text-orange-800 dark:text-orange-300",
                badgeColor: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
                desc: "Bahasa mengalir natural, eksplorasi ide kreatif, analogi & contoh nyata, engaging & hangat",
                examples: ["\"Bayangkan seperti ini...\"", "\"Menarik! Karena...\"", "\"Satu cara melihatnya...\""],
              },
              {
                value: "balanced" as const,
                icon: "⚖️",
                title: "Seimbang",
                subtitle: "Default",
                color: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700",
                activeColor: "border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700",
                textColor: "text-blue-800 dark:text-blue-300",
                badgeColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                desc: "Gabungan antara gaya percakapan dan format terstruktur sesuai konteks pertanyaan",
                examples: ["Jawab berdasarkan kebutuhan", "Format fleksibel", "Cocok untuk semua jenis pertanyaan"],
              },
              {
                value: "structured" as const,
                icon: "📋",
                title: "Terstruktur",
                subtitle: "Seperti Claude",
                color: "border-violet-300 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700",
                activeColor: "border-violet-500 ring-2 ring-violet-300 dark:ring-violet-700",
                textColor: "text-violet-800 dark:text-violet-300",
                badgeColor: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
                desc: "Heading & sub-heading, reasoning step-by-step eksplisit, checklist, tabel, kesimpulan jelas",
                examples: ["\"## Analisis\"", "\"**Langkah 1:**\"", "\"✅ Rekomendasi:\""],
              },
            ] as const).map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, responseStyle: style.value });
                  autoSaveField("responseStyle", style.value);
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  formData.responseStyle === style.value
                    ? `${style.color} ${style.activeColor}`
                    : "border-border bg-background hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{style.icon}</span>
                  <div>
                    <div className={`font-semibold text-sm ${formData.responseStyle === style.value ? style.textColor : "text-foreground"}`}>
                      {style.title}
                    </div>
                    <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-0.5 ${formData.responseStyle === style.value ? style.badgeColor : "bg-muted text-muted-foreground"}`}>
                      {style.subtitle}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{style.desc}</p>
                <div className="space-y-1">
                  {style.examples.map((ex, i) => (
                    <div key={i} className="text-[10px] font-mono text-muted-foreground/70 truncate">{ex}</div>
                  ))}
                </div>
                {formData.responseStyle === style.value && (
                  <div className={`mt-3 text-[10px] font-semibold flex items-center gap-1 ${style.textColor}`}>
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </div>
                )}
              </button>
            ))}

            {/* 4th card: Custom */}
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, responseStyle: "custom" });
                autoSaveField("responseStyle", "custom");
              }}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md col-span-full sm:col-span-1 ${
                formData.responseStyle === "custom"
                  ? "border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-border bg-background hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎨</span>
                <div>
                  <div className={`font-semibold text-sm ${formData.responseStyle === "custom" ? "text-emerald-800 dark:text-emerald-300" : "text-foreground"}`}>
                    Kustom
                  </div>
                  <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-0.5 ${formData.responseStyle === "custom" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                    Tulis sendiri
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">Definisikan panduan gaya respons sepenuhnya sesuai kebutuhan chatbot kamu</p>
              {formData.responseStyle === "custom" && (
                <div className="mt-2 text-[10px] font-semibold flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </div>
              )}
            </button>
          </div>

          {/* Custom style textarea — shown when "custom" is active */}
          {formData.responseStyle === "custom" && (
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>🎨</span> Panduan Gaya Kustom
              </label>
              <textarea
                className="w-full min-h-[120px] rounded-lg border border-border bg-background p-3 text-xs resize-y placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-colors"
                placeholder={"Contoh panduan gaya kustom:\n- Gunakan nada formal namun ramah, hindari jargon teknis berlebihan\n- Selalu awali jawaban dengan ringkasan 1 kalimat, lalu elaborasi detail\n- Gunakan analogi dari dunia konstruksi untuk menjelaskan konsep abstrak\n- Tutup setiap jawaban dengan 1 pertanyaan klarifikasi yang relevan"}
                value={formData.customResponseStyle}
                onChange={(e) => {
                  setFormData({ ...formData, customResponseStyle: e.target.value });
                }}
                onBlur={() => {
                  autoSaveField("customResponseStyle", formData.customResponseStyle);
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                Instruksi ini disuntikkan langsung ke awal system prompt sebagai panduan gaya. Simpan otomatis saat kamu pindah fokus dari kolom ini.
              </p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mt-3">
            Gaya respons disuntikkan ke awal system prompt — chatbot akan mempertahankan gaya ini di semua percakapan. Dapat dikombinasikan dengan System Prompt dan 7 Kebijakan Agen.
          </p>
        </CardContent>
      </Card>

      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parameter Model</CardTitle>
          <CardDescription>Sesuaikan parameter perilaku model AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Kreativitas: {formData.temperature.toFixed(1)}</Label>
              <span className="text-xs text-muted-foreground">
                {formData.temperature < 0.5 ? "Lebih fokus" : formData.temperature > 1 ? "Lebih kreatif" : "Seimbang"}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[formData.temperature]}
              onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
             
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens">Panjang Respons Maks: {formData.maxTokens}</Label>
              <span className="text-xs text-muted-foreground">
                Batas panjang respons
              </span>
            </div>
            <Slider
              id="maxTokens"
              min={100}
              max={4096}
              step={100}
              value={[formData.maxTokens]}
              onValueChange={([value]) => setFormData({ ...formData, maxTokens: value })}
             
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Control & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Kontrol Akses & Keamanan
          </CardTitle>
          <CardDescription>Atur siapa saja yang dapat mengakses chatbot Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Akses Publik</Label>
              <p className="text-xs text-muted-foreground">
                Izinkan siapa saja mengakses chatbot ini tanpa otentikasi
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
             
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Token (untuk Integrasi)
            </Label>
            <div className="flex gap-2">
              <Input
                value={agent.accessToken || ""}
                readOnly
                className="font-mono text-sm"
               
              />
              <Button variant="outline" onClick={copyAccessToken}>
                Salin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token ini digunakan untuk mengautentikasi permintaan API ke chatbot Anda. 
              Gunakan saat menyematkan chatbot di website Anda atau mengintegrasikan dengan aplikasi eksternal (WhatsApp, Telegram, dll).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Domain yang Diizinkan</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Batasi akses widget ke domain tertentu. Kosongkan untuk mengizinkan semua domain.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.allowedDomains.map((domain, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pl-3">
                  {domain}
                  <button
                    onClick={() => removeAllowedDomain(index)}
                    className="ml-1 hover:text-destructive"
                   
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {formData.allowedDomains.length < 10 && (
              <div className="flex gap-2">
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="contoh: namawebsite.com"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllowedDomain())}
                 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addAllowedDomain}
                  disabled={!newDomain.trim()}
                 
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TemplateDialog
        open={lexcomTemplateOpen}
        onOpenChange={setLexcomTemplateOpen}
        onSelectTemplate={handleApplyLexcomTemplate}
        initialCategory="LexCom Spesialis Hukum"
      />

    </div>
  );
}
