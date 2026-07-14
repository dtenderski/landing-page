import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search, Bot, Sparkles, Star, Users, Download, ArrowLeft, Filter,
  ChevronRight, Package, Loader2, Check, Globe, Layers, Zap, BookOpen,
  Briefcase, Building2, Scale, Heart, Plane, DollarSign, Cpu
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CATEGORIES = [
  { value: "Semua", label: "Semua Template", icon: Layers },
  { value: "Konstruksi", label: "Konstruksi", icon: Building2 },
  { value: "Bisnis", label: "Bisnis & Sales", icon: Briefcase },
  { value: "Pendidikan", label: "Pendidikan", icon: BookOpen },
  { value: "Hukum", label: "Hukum & Legal", icon: Scale },
  { value: "Teknologi", label: "Teknologi", icon: Cpu },
  { value: "Kesehatan", label: "Kesehatan", icon: Heart },
  { value: "Keuangan", label: "Keuangan", icon: DollarSign },
  { value: "Perjalanan", label: "Perjalanan", icon: Plane },
  { value: "Umum", label: "Umum", icon: Globe },
];

const COLOR_PALETTE: Record<string, string> = {
  "#6366f1": "bg-indigo-500",
  "#2563eb": "bg-blue-600",
  "#16a34a": "bg-green-600",
  "#7c3aed": "bg-violet-600",
  "#ea580c": "bg-orange-600",
  "#0d9488": "bg-teal-600",
  "#dc2626": "bg-red-600",
  "#d97706": "bg-amber-600",
  "#0891b2": "bg-cyan-600",
  "#4f46e5": "bg-indigo-700",
};

function getColorClass(color: string): string {
  return COLOR_PALETTE[color] || "bg-indigo-500";
}

function TemplateCard({ template, onUse }: { template: any; onUse: (t: any) => void }) {
  const colorClass = getColorClass(template.thumbnailColor || "#6366f1");
  const tags = Array.isArray(template.tags) ? template.tags : [];
  const usageCount = template.usageCount || 0;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col" data-testid={`card-template-${template.id}`}>
      <div className={`${colorClass} h-24 flex items-center justify-center relative overflow-hidden`}>
        <Bot className="w-10 h-10 text-white/80" />
        {template.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-400/90 text-yellow-900 text-[10px] font-bold border-0 gap-0.5">
              <Star className="w-2.5 h-2.5" />Unggulan
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="pt-4 pb-4 flex flex-col flex-1 gap-2">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground leading-tight">{template.name}</h3>
            <Badge variant="outline" className="text-[10px] shrink-0">{template.category}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description || "Template chatbot siap pakai"}</p>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="text-[10px] bg-muted/60 rounded px-1.5 py-0.5 text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{usageCount > 0 ? `${usageCount} dipakai` : "Baru"}</span>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => onUse(template)}
            data-testid={`button-use-template-${template.id}`}
          >
            <Download className="w-3 h-3 mr-1" />Pakai
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TemplatesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [customName, setCustomName] = useState("");
  const [useSuccess, setUseSuccess] = useState(false);

  const { data: templates = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/chatbot-templates", selectedCategory],
    queryFn: async () => {
      const param = selectedCategory !== "Semua" ? `?category=${encodeURIComponent(selectedCategory)}` : "";
      const res = await fetch(`/api/chatbot-templates${param}`);
      return res.json();
    },
  });

  const useMutationFn = useMutation({
    mutationFn: (templateId: number) =>
      apiRequest("POST", `/api/chatbot-templates/${templateId}/use`, {
        customName: customName.trim() || undefined,
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot-templates"] });
      setUseSuccess(true);
      toast({
        title: "Chatbot berhasil dibuat!",
        description: `"${customName || selectedTemplate?.name}" sudah tersedia di dashboard Anda.`,
      });
    },
    onError: () => toast({ title: "Gagal membuat chatbot dari template", variant: "destructive" }),
  });

  const filtered = templates.filter((t) =>
    search.trim() === "" ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(t.tags) && t.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase())))
  );

  const featured = filtered.filter((t) => t.isFeatured);
  const regular = filtered.filter((t) => !t.isFeatured);

  const handleOpenUse = (template: any) => {
    setSelectedTemplate(template);
    setCustomName(template.name || "");
    setUseSuccess(false);
  };

  const handleUse = () => {
    if (!selectedTemplate) return;
    useMutationFn.mutate(selectedTemplate.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back-to-dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">Template Chatbot</span>
          </div>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            {templates.length} template tersedia
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />Mulai dari template, hemat waktu setup
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Pilih Template, Langsung Aktif
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Template chatbot sudah dilengkapi persona, keahlian, dan knowledge base. Kustomisasi nama lalu langsung deploy.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, deskripsi, atau tag..."
              className="pl-9"
              data-testid="input-search-templates"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]" data-testid="select-template-category">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedCategory === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
              data-testid={`button-category-${cat.value}`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground text-sm">Memuat template...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Bot className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              {search ? `Tidak ada template yang cocok dengan "${search}"` : "Belum ada template di kategori ini"}
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedCategory("Semua"); }}>
              Lihat semua template
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <h2 className="font-semibold text-foreground">Template Unggulan</h2>
                  <Badge variant="secondary" className="text-xs">{featured.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {featured.map((template) => (
                    <TemplateCard key={template.id} template={template} onUse={handleOpenUse} />
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-semibold text-foreground">Semua Template</h2>
                    <Badge variant="secondary" className="text-xs">{regular.length}</Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {regular.map((template) => (
                    <TemplateCard key={template.id} template={template} onUse={handleOpenUse} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Info banner */}
        <div className="mt-8 p-4 bg-muted/40 border rounded-xl flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Punya chatbot bagus? Bagikan ke komunitas!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Di dashboard, buka chatbot Anda → Landing Page & Marketing Kit → klik "Publish sebagai Template". Chatbot Anda akan tersedia untuk semua pengguna.
            </p>
          </div>
        </div>
      </div>

      {/* Use Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => { if (!open) { setSelectedTemplate(null); setUseSuccess(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {useSuccess ? "Chatbot Berhasil Dibuat!" : "Pakai Template Ini"}
            </DialogTitle>
          </DialogHeader>
          {useSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">"{customName || selectedTemplate?.name}" siap digunakan!</p>
                <p className="text-sm text-muted-foreground mt-1">Chatbot sudah masuk ke dashboard Anda. Bisa langsung dikustomisasi.</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => { setSelectedTemplate(null); setUseSuccess(false); }}>
                  Pilih Template Lain
                </Button>
                <Button onClick={() => navigate("/dashboard")}>
                  Ke Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {selectedTemplate && (
                <div className="space-y-4">
                  <div className={`${getColorClass(selectedTemplate.thumbnailColor || "#6366f1")} rounded-lg p-4 flex items-center gap-3`}>
                    <Bot className="w-8 h-8 text-white/80" />
                    <div>
                      <p className="font-semibold text-white">{selectedTemplate.name}</p>
                      <p className="text-xs text-white/70">{selectedTemplate.category}</p>
                    </div>
                    {selectedTemplate.isFeatured && <Star className="w-4 h-4 text-yellow-300 ml-auto" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama chatbot Anda (opsional)</Label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={selectedTemplate.name}
                      data-testid="input-template-custom-name"
                    />
                    <p className="text-[11px] text-muted-foreground">Kosongkan untuk pakai nama template asli</p>
                  </div>
                  {Array.isArray(selectedTemplate.tags) && selectedTemplate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Batal</Button>
                <Button onClick={handleUse} disabled={useMutationFn.isPending} data-testid="button-confirm-use-template">
                  {useMutationFn.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" />Pakai Template</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
