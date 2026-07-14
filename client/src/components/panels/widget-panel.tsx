import { useState, useEffect } from "react";
import { Palette, Move, Maximize, Square, Eye, MessageCircle, Bot, HelpCircle, MessageSquare, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Agent } from "@shared/schema";

interface WidgetPanelProps {
  agent: Agent;
  bigIdeaId?: string;
}

const positionOptions = [
  { value: "bottom-right", label: "Kanan Bawah" },
  { value: "bottom-left", label: "Kiri Bawah" },
  { value: "top-right", label: "Kanan Atas" },
  { value: "top-left", label: "Kiri Atas" },
];

const sizeOptions = [
  { value: "small", label: "Kecil" },
  { value: "medium", label: "Sedang" },
  { value: "large", label: "Besar" },
];

const borderRadiusOptions = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Kotak" },
  { value: "pill", label: "Pill" },
];

const iconOptions = [
  { value: "chat", label: "Chat", icon: MessageCircle },
  { value: "message", label: "Message", icon: MessageSquare },
  { value: "bot", label: "Bot", icon: Bot },
  { value: "help", label: "Help", icon: HelpCircle },
];

const colorPresets = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", 
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#1e293b", "#0f172a"
];

export function WidgetPanel({ agent, bigIdeaId }: WidgetPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [prodUrl, setProdUrl] = useState<string | null>(null);
  const [modulSlug, setModulSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config/app-url")
      .then((r) => r.json())
      .then((d) => { if (d.appUrl) setProdUrl(d.appUrl); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!bigIdeaId) return;
    fetch(`/api/public/modul/${bigIdeaId}`)
      .then((r) => r.json())
      .then((d) => { if (d.slug) setModulSlug(d.slug); })
      .catch(() => {});
  }, [bigIdeaId]);

  const [settings, setSettings] = useState({
    widgetColor: agent.widgetColor || "#6366f1",
    widgetPosition: agent.widgetPosition || "bottom-right",
    widgetSize: agent.widgetSize || "medium",
    widgetBorderRadius: agent.widgetBorderRadius || "rounded",
    widgetShowBranding: agent.widgetShowBranding ?? true,
    widgetWelcomeMessage: agent.widgetWelcomeMessage || "",
    widgetButtonIcon: agent.widgetButtonIcon || "chat",
  });

  useEffect(() => {
    setSettings({
      widgetColor: agent.widgetColor || "#6366f1",
      widgetPosition: agent.widgetPosition || "bottom-right",
      widgetSize: agent.widgetSize || "medium",
      widgetBorderRadius: agent.widgetBorderRadius || "rounded",
      widgetShowBranding: agent.widgetShowBranding ?? true,
      widgetWelcomeMessage: agent.widgetWelcomeMessage || "",
      widgetButtonIcon: agent.widgetButtonIcon || "chat",
    });
  }, [agent.id]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Berhasil",
        description: "Pengaturan widget berhasil disimpan",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menyimpan pengaturan widget",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const getBaseUrl = () => {
    // In production the server returns the .replit.app domain via /api/config/app-url.
    // In dev, prodUrl is null so we fall back to window.location.origin (still useful for testing).
    return prodUrl || window.location.origin;
  };

  // Prefer slug over numeric ID for stable links (slug is preserved across re-seeds; ID can drift)
  const agentRef = (agent as any).slug || agent.id;

  // Dynamic embed code - just a loader script that fetches config from backend
  const generateDynamicEmbedCode = () => {
    return `<!-- Gustafta Chat Widget (Dynamic) -->
<script src="${getBaseUrl()}/widget/loader.js" data-agent-id="${agentRef}"></script>
<!-- End Gustafta Chat Widget -->`;
  };

  const [chatLinkCopied, setChatLinkCopied] = useState(false);

  const getPublicChatUrl = () => `${getBaseUrl()}/bot/${agentRef}`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateDynamicEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Disalin!",
      description: "Kode embed berhasil disalin ke clipboard",
    });
  };

  const copyChatLink = () => {
    navigator.clipboard.writeText(getPublicChatUrl());
    setChatLinkCopied(true);
    setTimeout(() => setChatLinkCopied(false), 2000);
    toast({
      title: "Disalin!",
      description: "Link chat publik berhasil disalin ke clipboard",
    });
  };

  const IconComponent = iconOptions.find(i => i.value === settings.widgetButtonIcon)?.icon || MessageCircle;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Widget Customization</h2>
          <p className="text-muted-foreground">Sesuaikan tampilan chat widget</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Warna & Tampilan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Warna Utama</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={settings.widgetColor}
                    onChange={(e) => setSettings({ ...settings, widgetColor: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                   
                  />
                  <Input
                    value={settings.widgetColor}
                    onChange={(e) => setSettings({ ...settings, widgetColor: e.target.value })}
                    className="flex-1"
                    placeholder="#6366f1"
                   
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => setSettings({ ...settings, widgetColor: color })}
                     
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ikon Tombol</Label>
                <Select
                  value={settings.widgetButtonIcon}
                  onValueChange={(v) => setSettings({ ...settings, widgetButtonIcon: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bentuk Sudut</Label>
                <Select
                  value={settings.widgetBorderRadius}
                  onValueChange={(v) => setSettings({ ...settings, widgetBorderRadius: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {borderRadiusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Move className="w-4 h-4" />
                Posisi & Ukuran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Posisi Widget</Label>
                <Select
                  value={settings.widgetPosition}
                  onValueChange={(v) => setSettings({ ...settings, widgetPosition: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ukuran Chat Window</Label>
                <Select
                  value={settings.widgetSize}
                  onValueChange={(v) => setSettings({ ...settings, widgetSize: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Pesan & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pesan Selamat Datang (opsional)</Label>
                <Textarea
                  value={settings.widgetWelcomeMessage}
                  onChange={(e) => setSettings({ ...settings, widgetWelcomeMessage: e.target.value })}
                  placeholder="Halo! Ada yang bisa saya bantu hari ini?"
                  rows={2}
                 
                />
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk menggunakan greeting message dari persona
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Tampilkan Branding</Label>
                  <p className="text-xs text-muted-foreground">Powered by Gustafta</p>
                </div>
                <Switch
                  checked={settings.widgetShowBranding}
                  onCheckedChange={(v) => setSettings({ ...settings, widgetShowBranding: v })}
                 
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Widget
              </CardTitle>
              <CardDescription>Tampilan widget di website Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg h-80 overflow-hidden">
                <div className="absolute inset-4 bg-background/80 rounded-lg backdrop-blur-sm border">
                  <div className="p-4 text-sm text-muted-foreground">
                    <div className="h-2 w-24 bg-muted rounded mb-2" />
                    <div className="h-2 w-full bg-muted rounded mb-2" />
                    <div className="h-2 w-3/4 bg-muted rounded" />
                  </div>
                </div>
                
                <div
                  className="absolute flex items-center justify-center w-14 h-14 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: settings.widgetColor,
                    ...(settings.widgetPosition === "bottom-right" ? { bottom: 16, right: 16 } : {}),
                    ...(settings.widgetPosition === "bottom-left" ? { bottom: 16, left: 16 } : {}),
                    ...(settings.widgetPosition === "top-right" ? { top: 16, right: 16 } : {}),
                    ...(settings.widgetPosition === "top-left" ? { top: 16, left: 16 } : {}),
                  }}
                 
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Link Chat Publik</CardTitle>
              <CardDescription>
                Halaman chat khusus untuk chatbot ini. Bagikan link ini agar user bisa langsung chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  value={getPublicChatUrl()}
                  readOnly
                  className="text-sm font-mono"
                 
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyChatLink}
                 
                >
                  {chatLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={`/bot/${agent.id}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Halaman ini adalah "rumah" chatbot Anda. User dapat membuka link ini langsung di browser 
                  untuk berkomunikasi dengan chatbot tanpa perlu masuk ke dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <ExternalLink className="w-4 h-4" />
                Demo Page untuk Customer
              </CardTitle>
              <CardDescription>
                Halaman siap kirim ke calon customer — widget langsung aktif, lengkap embed code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  value={`${getBaseUrl()}/demo/${agentRef}`}
                  readOnly
                  className="text-sm font-mono"
                  data-testid="input-demo-link"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${getBaseUrl()}/demo/${agentRef}`);
                    toast({ title: "Disalin!", description: "Link demo berhasil disalin" });
                  }}
                  data-testid="button-copy-demo-link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <a href={`/demo/${agentRef}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" data-testid="button-open-demo">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Kirim link ini ke customer. Mereka bisa langsung coba chatbot, lihat cara embed, dan salin kode untuk pasang di website mereka — tanpa login apapun.
                </p>
              </div>
            </CardContent>
          </Card>

          {bigIdeaId && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-1">Link Modul (Multi-Chatbot)</h3>
                  <p className="text-xs text-muted-foreground">
                    Bagikan satu link untuk semua chatbot dalam Modul ini.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${getBaseUrl()}/modul/${modulSlug || bigIdeaId}`}
                    readOnly
                    className="text-sm font-mono"
                    data-testid="input-modul-link"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${getBaseUrl()}/modul/${modulSlug || bigIdeaId}`);
                      toast({ title: "Disalin!", description: "Link Modul berhasil disalin ke clipboard" });
                    }}
                    data-testid="button-copy-modul-link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={`/modul/${modulSlug || bigIdeaId}`} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" data-testid="button-open-modul">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kode Embed (Dinamis)</CardTitle>
              <CardDescription>
                Salin kode ini ke website Anda. Widget akan otomatis mengambil konfigurasi terbaru dari server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                  <code>{generateDynamicEmbedCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={copyEmbedCode}
                 
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Kode embed ini bersifat dinamis. Semua perubahan warna, posisi, ukuran, dan pesan akan 
                  otomatis diterapkan tanpa perlu mengganti kode embed di website Anda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
