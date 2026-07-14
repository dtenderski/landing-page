import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTemplates, useCreateAgentFromTemplate } from "@/hooks/use-templates";
import { useToast } from "@/hooks/use-toast";
import {
  Headphones,
  ShoppingBag,
  GraduationCap,
  HeartPulse,
  PenTool,
  Users,
  Settings,
  Scale,
  Plane,
  Wallet,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const iconMap: Record<string, any> = {
  headphones: Headphones,
  "shopping-bag": ShoppingBag,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  "pen-tool": PenTool,
  users: Users,
  settings: Settings,
  scale: Scale,
  plane: Plane,
  wallet: Wallet,
};

interface TemplateShowcaseProps {
  onCreateFromTemplate?: (agentId: string) => void;
  showCreateButton?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export function TemplateShowcase({ 
  onCreateFromTemplate, 
  showCreateButton = true, 
  maxItems,
  compact = false 
}: TemplateShowcaseProps) {
  const { data, isLoading } = useTemplates();
  const createFromTemplate = useCreateAgentFromTemplate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customName, setCustomName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-muted mb-4" />
              <div className="h-5 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredTemplates = data.templates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const displayTemplates = maxItems ? filteredTemplates.slice(0, maxItems) : filteredTemplates;

  const handleCreateAgent = async () => {
    if (!selectedTemplate) return;

    try {
      const result = await createFromTemplate.mutateAsync({
        templateId: selectedTemplate.id,
        customName: customName || selectedTemplate.name,
      });
      
      toast({
        title: "Alat Bantu Dibuat",
        description: `${customName || selectedTemplate.name} berhasil dibuat dari template.`,
      });

      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      setCustomName("");

      if (onCreateFromTemplate) {
        onCreateFromTemplate(result.id);
      }
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Gagal membuat alat bantu dari template.",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = (template: any) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {!compact && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
               
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
               
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </>
      )}

      <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {displayTemplates.map((template) => {
          const IconComponent = iconMap[template.icon] || Sparkles;
          
          return (
            <Card 
              key={template.id} 
              className="hover-elevate group cursor-pointer transition-all"
              onClick={() => showCreateButton && openCreateDialog(template)}
             
            >
              <CardContent className={compact ? "p-4" : "p-6"}>
                <div 
                  className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-lg flex items-center justify-center mb-4`}
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <IconComponent 
                    className={`${compact ? 'h-5 w-5' : 'h-6 w-6'}`} 
                    style={{ color: template.color }} 
                  />
                </div>
                <h3 
                  className={`${compact ? 'text-base' : 'text-lg'} font-semibold mb-1 group-hover:text-primary transition-colors`}
                 
                >
                  {template.name}
                </h3>
                <p 
                  className={`text-muted-foreground ${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'} mb-3`}
                 
                >
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, compact ? 2 : 3).map((tag, index) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {showCreateButton && (
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="w-full gap-2">
                      <Sparkles className="h-4 w-4" />
                      Gunakan Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {maxItems && filteredTemplates.length > maxItems && (
        <div className="text-center">
          <Button variant="outline" className="gap-2">
            Lihat Semua {filteredTemplates.length} Template
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  {(() => {
                    const IconComponent = iconMap[selectedTemplate.icon] || Sparkles;
                    return (
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${selectedTemplate.color}20` }}
                      >
                        <IconComponent className="h-4 w-4" style={{ color: selectedTemplate.color }} />
                      </div>
                    );
                  })()}
                  Buat dari Template
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Nama Alat Bantu</Label>
              <Input
                id="agent-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Masukkan nama alat bantu"
               
              />
            </div>

            {selectedTemplate && (
              <div className="space-y-2">
                <Label>Fitur Template</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Persona: {selectedTemplate.agent.personality}</p>
                  <p>Gaya Komunikasi: {selectedTemplate.agent.communicationStyle}</p>
                  <p>Model AI: {selectedTemplate.agent.aiModel || "gpt-4o-mini"}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleCreateAgent} 
              disabled={createFromTemplate.isPending}
             
            >
              {createFromTemplate.isPending ? "Membuat..." : "Buat Alat Bantu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
