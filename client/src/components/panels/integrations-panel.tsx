import { useState, useEffect } from "react";
import { Plug, MessageCircle, Send, Hash, Slack, Globe, Code, Check, X, Settings, Loader2, Link2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from "@/hooks/use-integrations";
import { SiWhatsapp, SiTelegram, SiDiscord, SiSlack } from "react-icons/si";
import type { Agent, Integration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Generate a secure random token
function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

interface IntegrationsPanelProps {
  agent: Agent;
}

const integrationTypes = [
  {
    type: "whatsapp" as const,
    name: "WhatsApp",
    description: "Connect to WhatsApp Business API",
    icon: SiWhatsapp,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    type: "telegram" as const,
    name: "Telegram",
    description: "Deploy as a Telegram bot",
    icon: SiTelegram,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    type: "discord" as const,
    name: "Discord",
    description: "Add to Discord servers",
    icon: SiDiscord,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
  },
  {
    type: "slack" as const,
    name: "Slack",
    description: "Integrate with Slack workspaces",
    icon: SiSlack,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    type: "web" as const,
    name: "Web Widget",
    description: "Embed on your website",
    icon: Globe,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    type: "api" as const,
    name: "REST API",
    description: "Custom API integration",
    icon: Code,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function IntegrationsPanel({ agent }: IntegrationsPanelProps) {
  const { toast } = useToast();
  const { data: integrations = [], isLoading } = useIntegrations(agent.id);
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const [prodUrl, setProdUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config/app-url")
      .then((r) => r.json())
      .then((d) => { if (d.appUrl) setProdUrl(d.appUrl); })
      .catch(() => {});
  }, []);

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<typeof integrationTypes[0] | null>(null);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  // Mutation for generating access token
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const newToken = generateSecureToken(32);
      const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, {
        accessToken: newToken
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Token Digenerate!",
        description: "Access token baru sudah dibuat dan disimpan.",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal membuat token baru. Coba lagi.",
        variant: "destructive",
      });
    },
  });

  const getBaseUrl = () => {
    return prodUrl || window.location.origin;
  };

  const setupTelegramWebhook = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest("POST", `/api/telegram/setup-webhook/${agent.id}`);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Berhasil!",
          description: "Telegram bot sudah terhubung. Coba kirim pesan ke bot Anda.",
        });
        setConfigDialogOpen(false);
      } else {
        toast({
          title: "Gagal",
          description: result.error || "Gagal menghubungkan Telegram bot",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghubungkan Telegram bot. Pastikan Bot Token sudah benar.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const testFonnteConnection = async () => {
    setIsConnecting(true);
    try {
      const saved = await saveConfig();
      if (!saved) {
        setIsConnecting(false);
        return;
      }
      
      const response = await apiRequest("POST", `/api/whatsapp/test-connection/${agent.id}`);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Koneksi Berhasil!",
          description: result.message,
        });
      } else {
        toast({
          title: "Gagal",
          description: result.error || "Gagal menguji koneksi Fonnte",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menguji koneksi. Pastikan Token sudah benar.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getIntegration = (type: string): Integration | undefined => {
    return integrations.find((i) => i.type === type);
  };

  const handleToggle = async (type: typeof integrationTypes[0]["type"], enabled: boolean) => {
    const existing = getIntegration(type);

    if (existing) {
      updateIntegration.mutate({
        id: existing.id,
        agentId: agent.id,
        data: { isEnabled: enabled },
      });
    } else if (enabled) {
      const integrationInfo = integrationTypes.find((i) => i.type === type);
      createIntegration.mutate({
        agentId: agent.id,
        type,
        name: integrationInfo?.name || type,
        isEnabled: true,
        config: {},
      });
    }

    toast({
      title: enabled ? "Integration Enabled" : "Integration Disabled",
      description: `${integrationTypes.find((i) => i.type === type)?.name} has been ${enabled ? "enabled" : "disabled"}.`,
    });
  };

  const openConfig = (integration: typeof integrationTypes[0]) => {
    setSelectedIntegration(integration);
    const existing = getIntegration(integration.type);
    setConfigData(existing?.config || {});
    setConfigDialogOpen(true);
  };

  const saveConfig = async (): Promise<boolean> => {
    if (!selectedIntegration) return false;

    const existing = getIntegration(selectedIntegration.type);
    if (existing) {
      try {
        await updateIntegration.mutateAsync({
          id: existing.id,
          agentId: agent.id,
          data: { config: configData },
        });
        toast({
          title: "Configuration Saved",
          description: `${selectedIntegration.name} settings have been updated.`,
        });
        return true;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save configuration",
          variant: "destructive",
        });
        return false;
      }
    }
    return false;
  };
  
  const saveConfigAndClose = async () => {
    const success = await saveConfig();
    if (success) {
      setConfigDialogOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" />
          Integrations
        </h2>
        <p className="text-muted-foreground mt-1">
          Connect your chatbot to messaging platforms and services
        </p>
      </div>

      {/* Active Integrations Summary */}
      {integrations.filter((i) => i.isEnabled).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {integrations
                .filter((i) => i.isEnabled)
                .map((integration) => {
                  const info = integrationTypes.find((t) => t.type === integration.type);
                  if (!info) return null;
                  return (
                    <Badge key={integration.id} variant="secondary" className="gap-1.5 py-1">
                      <info.icon className={`w-3.5 h-3.5 ${info.color}`} />
                      {info.name}
                      <Check className="w-3 h-3 text-green-500" />
                    </Badge>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrationTypes.map((integration) => {
          const existing = getIntegration(integration.type);
          const isEnabled = existing?.isEnabled || false;

          return (
            <Card
              key={integration.type}
              className={isEnabled ? "ring-1 ring-primary/20" : ""}
             
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${integration.bgColor} flex items-center justify-center shrink-0`}>
                    <integration.icon className={`w-6 h-6 ${integration.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium">{integration.name}</h3>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggle(integration.type, checked)}
                       
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                    {isEnabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-2"
                        onClick={() => openConfig(integration)}
                       
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Configure
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Web Widget Embed Code */}
      {getIntegration("web")?.isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Web Widget / WordPress Embed</CardTitle>
            <CardDescription>Tambahkan chatbot ke website atau WordPress Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 text-sm">
              <p className="font-medium text-foreground mb-2">Cara Memasang di WordPress:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Masuk ke Dashboard WordPress Anda</li>
                <li>Pergi ke Appearance → Theme Editor atau gunakan plugin "Insert Headers and Footers"</li>
                <li>Tempel kode di bawah sebelum tag &lt;/body&gt;</li>
                <li>Simpan perubahan</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Label>Embed Code (tempel di website Anda)</Label>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">
{`<!-- Gustafta Chat Widget -->
<script>
  (function() {
    var w = document.createElement('script');
    w.type = 'text/javascript';
    w.async = true;
    w.src = '${getBaseUrl()}/widget.js';
    w.setAttribute('data-agent-id', '${agent.id}');
    document.body.appendChild(w);
  })();
</script>`}
              </div>
              <p className="text-xs text-muted-foreground">
                Widget ini akan bekerja jika agent di-set sebagai "Public" di panel Persona
              </p>
            </div>
            <div className="space-y-2">
              <Label>Atau gunakan iframe sederhana:</Label>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto break-all">
{`<iframe 
  src="${getBaseUrl()}/embed/${agent.id}" 
  width="400" 
  height="600" 
  frameborder="0">
</iframe>`}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const code = `<!-- Gustafta Chat Widget -->
<script>
  (function() {
    var w = document.createElement('script');
    w.type = 'text/javascript';
    w.async = true;
    w.src = '${getBaseUrl()}/widget.js';
    w.setAttribute('data-agent-id', '${agent.id}');
    document.body.appendChild(w);
  })();
</script>`;
                  navigator.clipboard.writeText(code);
                  toast({ title: "Tersalin!", description: "Kode embed sudah disalin." });
                }}
               
              >
                Salin Kode Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const code = `<iframe src="${getBaseUrl()}/embed/${agent.id}" width="400" height="600" frameborder="0"></iframe>`;
                  navigator.clipboard.writeText(code);
                  toast({ title: "Tersalin!", description: "Kode iframe sudah disalin." });
                }}
               
              >
                Salin Kode iFrame
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook/API Integration - Like Botika */}
      {getIntegration("api")?.isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhook/API Integration</CardTitle>
            <CardDescription>Gunakan webhook untuk menghubungkan aplikasi Anda ke Gustafta chatbot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm">
              <p className="text-muted-foreground">
                Webhook integration memungkinkan Anda menghubungkan aplikasi ke Gustafta chatbot secara otomatis dan real-time.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Unique ID</Label>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm flex justify-between items-center">
                <span className="break-all">{agent.id}</span>
                <Button size="icon" variant="ghost" onClick={() => {
                  navigator.clipboard.writeText(agent.id);
                  toast({ title: "Tersalin!", description: "Unique ID sudah disalin." });
                }}>
                  <Code className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">ID unik untuk webhook Anda</p>
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm flex justify-between items-center gap-2">
                <span className="break-all flex-1">{agent.accessToken || "Belum digenerate"}</span>
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => generateTokenMutation.mutate()}
                    disabled={generateTokenMutation.isPending}
                    title="Generate Token Baru"
                   
                  >
                    <RefreshCw className={`w-4 h-4 ${generateTokenMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (agent.accessToken) {
                      navigator.clipboard.writeText(agent.accessToken);
                      toast({ title: "Tersalin!", description: "Access Token sudah disalin." });
                    }
                  }} title="Salin Token">
                    <Code className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Klik ikon refresh untuk generate token baru</p>
            </div>

            <div className="space-y-2">
              <Label>Endpoint</Label>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs flex justify-between items-center">
                <span className="break-all">{`${getBaseUrl()}/api/webhook/chat/${agent.id}`}</span>
                <Button size="icon" variant="ghost" onClick={() => {
                  navigator.clipboard.writeText(`${getBaseUrl()}/api/webhook/chat/${agent.id}`);
                  toast({ title: "Tersalin!", description: "Endpoint sudah disalin." });
                }}>
                  <Code className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">URL endpoint Gustafta untuk menerima pesan</p>
            </div>

            <div className="space-y-2">
              <Label>Header (untuk autentikasi)</Label>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
{`{
  "Authorization": "Bearer ${agent.accessToken || "YOUR_ACCESS_TOKEN"}",
  "Content-Type": "application/json"
}`}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contoh JSON Request</Label>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto whitespace-pre">
{`{
  "app": {
    "id": "${agent.id}"
  },
  "time": 1768945705571,
  "data": {
    "sender": {
      "id": "628123456789"
    },
    "message": [
      {
        "id": "msg_unique_id",
        "time": 1768945705571,
        "type": "text",
        "value": "Hello World!"
      }
    ]
  }
}`}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contoh JSON Response</Label>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto whitespace-pre">
{`{
  "app": {
    "id": "${agent.id}"
  },
  "time": 1768945705571,
  "data": {
    "recipient": {
      "id": "628123456789"
    },
    "message": [
      {
        "time": "1768945705571",
        "type": "text",
        "value": "Hello! Saya adalah AI assistant."
      }
    ]
  }
}`}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const docs = `Gustafta Webhook/API Integration

Unique ID: ${agent.id}
Access Token: ${agent.accessToken || "YOUR_ACCESS_TOKEN"}
Endpoint: ${getBaseUrl()}/api/webhook/chat/${agent.id}

Header:
{
  "Authorization": "Bearer ${agent.accessToken || "YOUR_ACCESS_TOKEN"}",
  "Content-Type": "application/json"
}

Example Request:
POST ${getBaseUrl()}/api/webhook/chat/${agent.id}
{
  "sender_id": "user123",
  "message": "Hello!"
}

Response:
{
  "response": "AI response here",
  "agent_id": "${agent.id}"
}`;
                navigator.clipboard.writeText(docs);
                toast({ title: "Tersalin!", description: "Dokumentasi API sudah disalin." });
              }}
             
            >
              Salin Dokumentasi API
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <selectedIntegration.icon className={`w-5 h-5 ${selectedIntegration.color}`} />
                  {selectedIntegration.name} Configuration
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure the settings for this integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedIntegration?.type === "whatsapp" && (
              <>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm mb-2 space-y-3">
                  <p className="font-medium text-foreground">Pilih Layanan WhatsApp API:</p>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-xs text-foreground">Opsi 1: Fonnte (Rekomendasi - Mudah & Murah)</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                      <li>Daftar akun di <a href="https://md.fonnte.com/new/register.php" target="_blank" rel="noopener" className="text-primary underline">md.fonnte.com/new/register.php</a></li>
                      <li>Buat Device baru dan connect via scan QR code WhatsApp</li>
                      <li>Salin Token API dari dashboard Device</li>
                      <li>Paste token di field "Token" di bawah</li>
                      <li>Copy Webhook URL di bawah ke menu Webhook di dashboard Fonnte</li>
                    </ol>
                    <p className="text-xs text-green-600 dark:text-green-400">Mulai dari Rp 25.000/bulan - Tanpa verifikasi bisnis</p>
                    <p className="text-xs text-muted-foreground">Dokumentasi: <a href="https://docs.fonnte.com/make-whatsapp-bot-using-php-webhook/" target="_blank" rel="noopener" className="text-primary underline">docs.fonnte.com</a></p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-xs text-foreground">Opsi 2: Kirimi.id (Indonesia)</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                      <li>Daftar di <a href="https://kirimi.id" target="_blank" rel="noopener" className="text-primary underline">kirimi.id</a></li>
                      <li>Tambahkan device dan scan QR dengan WhatsApp</li>
                      <li>Salin API Token dari dashboard</li>
                      <li>Set Webhook URL di pengaturan device</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-xs text-foreground">Opsi 3: WhatsApp Cloud API (Gratis dari Meta)</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                      <li>Buka <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-primary underline">developers.facebook.com</a></li>
                      <li>Buat App baru → pilih Business → WhatsApp</li>
                      <li>Verifikasi bisnis Anda (butuh dokumen)</li>
                      <li>Dapatkan Access Token dan Phone Number ID</li>
                      <li>Set Webhook URL dengan verify token</li>
                    </ol>
                    <p className="text-xs text-muted-foreground">Gratis 1000 percakapan/bulan, tapi proses verifikasi lebih lama</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon WhatsApp</Label>
                  <Input
                    value={configData.phone || ""}
                    onChange={(e) => setConfigData({ ...configData, phone: e.target.value })}
                    placeholder="628123456789"
                   
                  />
                  <p className="text-xs text-muted-foreground">
                    Nomor WhatsApp Business Anda (dengan kode negara, tanpa +)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Input
                    type="password"
                    value={configData.apiToken || ""}
                    onChange={(e) => setConfigData({ ...configData, apiToken: e.target.value })}
                    placeholder="Masukkan token Anda"
                   
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all flex items-center justify-between gap-2">
                    <span>{`${getBaseUrl()}/api/webhook/whatsapp/${agent.id}`}</span>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`${getBaseUrl()}/api/webhook/whatsapp/${agent.id}`);
                        toast({ title: "Tersalin!", description: "Webhook URL sudah disalin." });
                      }}
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Salin URL ini ke menu Webhook di dashboard Fonnte
                  </p>
                </div>
                <Button 
                  onClick={testFonnteConnection}
                  disabled={!configData.apiToken || isConnecting}
                  className="w-full"
                 
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menguji Koneksi...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Test Koneksi Fonnte
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Klik tombol di atas untuk memverifikasi token dan menyimpan konfigurasi
                </p>
              </>
            )}
            {selectedIntegration?.type === "telegram" && (
              <>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm mb-2">
                  <p className="font-medium text-foreground mb-2">Langkah Menghubungkan Telegram:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Buka @BotFather di Telegram</li>
                    <li>Kirim /newbot dan ikuti petunjuk untuk membuat bot</li>
                    <li>Salin Bot Token yang diberikan</li>
                    <li>Tempel token di bawah dan klik "Hubungkan ke Telegram"</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <Label>Bot Token dari @BotFather</Label>
                  <Input
                    type="password"
                    value={configData.botToken || ""}
                    onChange={(e) => setConfigData({ ...configData, botToken: e.target.value })}
                    placeholder="Contoh: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                   
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all flex items-center justify-between gap-2">
                    <span>{`${getBaseUrl()}/api/webhook/telegram/${agent.id}`}</span>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`${getBaseUrl()}/api/webhook/telegram/${agent.id}`);
                        toast({ title: "Tersalin!", description: "Webhook URL sudah disalin." });
                      }}
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={async () => {
                    const saved = await saveConfig();
                    if (saved) {
                      await setupTelegramWebhook();
                    }
                  }}
                  disabled={!configData.botToken || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menghubungkan...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Hubungkan ke Telegram
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Klik tombol di atas untuk mendaftarkan atau memperbarui webhook
                </p>
              </>
            )}
            {selectedIntegration?.type === "discord" && (
              <div className="space-y-2">
                <Label>Bot Token</Label>
                <Input
                  type="password"
                  value={configData.botToken || ""}
                  onChange={(e) => setConfigData({ ...configData, botToken: e.target.value })}
                  placeholder="Enter your Discord Bot Token"
                />
              </div>
            )}
            {selectedIntegration?.type === "slack" && (
              <>
                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <Input
                    type="password"
                    value={configData.botToken || ""}
                    onChange={(e) => setConfigData({ ...configData, botToken: e.target.value })}
                    placeholder="xoxb-..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Signing Secret</Label>
                  <Input
                    type="password"
                    value={configData.signingSecret || ""}
                    onChange={(e) => setConfigData({ ...configData, signingSecret: e.target.value })}
                    placeholder="Enter your Slack Signing Secret"
                  />
                </div>
              </>
            )}
            {(selectedIntegration?.type === "web" || selectedIntegration?.type === "api") && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No additional configuration required for this integration.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfigAndClose}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
