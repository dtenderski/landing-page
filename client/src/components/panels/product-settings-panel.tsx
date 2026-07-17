import { useState, useEffect } from "react";
import { ShoppingBag, Globe, DollarSign, Shield, ShieldAlert, ShieldCheck, Tag, Copy, ExternalLink, Check, Plus, Trash2, Target, Lightbulb, CreditCard, Link2, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PREMIUM_CLASSES, PREMIUM_CLASS_IDS, priceForClass, resolveLicensePrice } from "@shared/premium-classes";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function ProductSettingsPanel({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    isListed: agent.isListed ?? false,
    productSummary: agent.productSummary || "",
    productFeatures: (agent.productFeatures as string[]) || [],
    productUseCases: agent.productUseCases || "",
    productTargetUser: agent.productTargetUser || "",
    productProblem: agent.productProblem || "",
    licenseClass: (agent.licenseClass ?? null) as number | null,
    licensePrice: (agent.licensePrice ?? 0) as number,
    monthlyPrice: agent.monthlyPrice ?? 0,
    paymentUrl: agent.paymentUrl || "",
    trialEnabled: agent.trialEnabled ?? true,
    trialDays: agent.trialDays ?? 7,
    messageQuotaDaily: agent.messageQuotaDaily ?? 50,
    messageQuotaMonthly: agent.messageQuotaMonthly ?? 1000,
    guestMessageLimit: agent.guestMessageLimit ?? 10,
    requireRegistration: agent.requireRegistration ?? false,
    brandingName: agent.brandingName || "",
    brandingLogo: agent.brandingLogo || "",
  });

  const set = (key: string, val: any) => setSettings(s => ({ ...s, [key]: val }));

  // Harga LISENSI efektif (sekali bayar): band kelas bila premium, jika tidak harga bebas.
  // Sumbu ini TERPISAH dari monthlyPrice (biaya bulanan hosting/token).
  const salePrice = resolveLicensePrice(settings.licenseClass, settings.licensePrice);

  // Kelas Premium menentukan harga lisensi. Pilih kelas → harga otomatis; "Bukan Premium" → harga bebas.
  const setLicenseClass = (val: string) => {
    if (val === "none") {
      setSettings(s => ({ ...s, licenseClass: null }));
    } else {
      const n = parseInt(val, 10);
      setSettings(s => ({ ...s, licenseClass: n }));
    }
  };

  const [newFeature, setNewFeature] = useState("");
  const [copiedMarketplace, setCopiedMarketplace] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const [generatingMayar, setGeneratingMayar] = useState(false);

  const generateMayarLinkMutation = useMutation({
    mutationFn: async () => {
      const amount = resolveLicensePrice(settings.licenseClass, settings.licensePrice);
      if (!amount || amount <= 0) throw new Error("Isi harga dulu sebelum generate link.");
      const res = await apiRequest("POST", "/api/mayar/create-chatbot-link", {
        agentId: agent.id,
        agentName: agent.name,
        amount,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.paymentUrl) {
        set("paymentUrl", data.paymentUrl);
        toast({ title: "✅ Link Mayar berhasil dibuat!", description: "Link sudah otomatis terisi. Klik Simpan untuk menyimpan." });
      } else {
        toast({ title: "Gagal", description: data.error || "Tidak ada link dari Mayar.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      const msg = err?.message || "Gagal generate link Mayar.";
      if (msg.includes("MAYAR_API_KEY")) {
        toast({ title: "API Key Mayar belum diset", description: "Masukkan MAYAR_API_KEY di Secrets / Environment Variables.", variant: "destructive" });
      } else {
        toast({ title: "Gagal", description: msg, variant: "destructive" });
      }
    },
  });

  useEffect(() => {
    setSettings({
      isListed: agent.isListed ?? false,
      productSummary: agent.productSummary || "",
      productFeatures: (agent.productFeatures as string[]) || [],
      productUseCases: agent.productUseCases || "",
      productTargetUser: agent.productTargetUser || "",
      productProblem: agent.productProblem || "",
      licenseClass: (agent.licenseClass ?? null) as number | null,
      licensePrice: (agent.licensePrice ?? 0) as number,
      monthlyPrice: agent.monthlyPrice ?? 0,
      paymentUrl: agent.paymentUrl || "",
      trialEnabled: agent.trialEnabled ?? true,
      trialDays: agent.trialDays ?? 7,
      messageQuotaDaily: agent.messageQuotaDaily ?? 50,
      messageQuotaMonthly: agent.messageQuotaMonthly ?? 1000,
      guestMessageLimit: agent.guestMessageLimit ?? 10,
      requireRegistration: agent.requireRegistration ?? false,
      brandingName: agent.brandingName || "",
      brandingLogo: agent.brandingLogo || "",
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
        description: "Pengaturan produk berhasil disimpan",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menyimpan pengaturan produk",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setSettings({
        ...settings,
        productFeatures: [...settings.productFeatures, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setSettings({
      ...settings,
      productFeatures: settings.productFeatures.filter((_, i) => i !== index),
    });
  };

  const getBaseUrl = () => window.location.origin;

  const getMarketplaceUrl = () => `${getBaseUrl()}/bot/${agent.id}`;
  const getChatUrl = () => `${getBaseUrl()}/bot/${agent.id}`;

  const copyMarketplaceUrl = () => {
    navigator.clipboard.writeText(getMarketplaceUrl());
    setCopiedMarketplace(true);
    setTimeout(() => setCopiedMarketplace(false), 2000);
    toast({ title: "Disalin!", description: "URL marketplace berhasil disalin ke clipboard" });
  };

  const copyChatUrl = () => {
    navigator.clipboard.writeText(getChatUrl());
    setCopiedChat(true);
    setTimeout(() => setCopiedChat(false), 2000);
    toast({ title: "Disalin!", description: "URL chat berhasil disalin ke clipboard" });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Pengaturan Produk
            </h2>
            <p className="text-muted-foreground">Konfigurasi monetisasi chatbot Anda</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
         
        >
          {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Pengaturan Publikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Terbitkan ke Store</Label>
                  <p className="text-xs text-muted-foreground">Chatbot akan muncul di katalog Store publik</p>
                </div>
                <Switch
                  checked={settings.isListed}
                  onCheckedChange={(checked) => setSettings({ ...settings, isListed: checked })}
                  data-testid="switch-terbitkan-store"
                />
              </div>

              {settings.isListed && !agent.isCertified && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-2.5" data-testid="notice-terbitkan-pra-sertifikasi">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Saat tayang, chatbot Anda muncul di Store dengan label <strong>"Pra-Sertifikasi"</strong> sampai Anda mengikuti workshop &amp; lulus sertifikasi Gustafta. Pastikan chatbot sudah Anda uji dan siap dipakai — Anda bertanggung jawab atas isinya.
                  </p>
                </div>
              )}

              {agent.isCertified && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 px-3 py-2.5" data-testid="status-bersertifikat">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Chatbot ini sudah <strong>Bersertifikat</strong> — Anda telah lulus workshop &amp; sertifikasi Gustafta. Badge hijau "Bersertifikat" tampil di Store.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Ringkasan Produk</Label>
                <Textarea
                  value={settings.productSummary}
                  onChange={(e) => setSettings({ ...settings, productSummary: e.target.value })}
                  placeholder="Deskripsi singkat tentang chatbot Anda untuk calon pelanggan..."
                  rows={3}
                 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" />Masalah yang Diselesaikan</Label>
                <Textarea
                  value={settings.productProblem}
                  onChange={(e) => set("productProblem", e.target.value)}
                  placeholder="Contoh: Banyak kontraktor kesulitan memahami persyaratan dokumen tender yang kompleks..."
                  rows={2}
                  data-testid="textarea-product-problem"
                />
                <p className="text-xs text-muted-foreground">Masalah utama yang diselesaikan chatbot ini</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-primary" />Contoh Use Case</Label>
                <Textarea
                  value={settings.productUseCases}
                  onChange={(e) => set("productUseCases", e.target.value)}
                  placeholder="Contoh: Analisis dokumen RKS, cek kelengkapan berkas, hitung estimasi biaya tender..."
                  rows={2}
                  data-testid="textarea-product-use-cases"
                />
                <p className="text-xs text-muted-foreground">Skenario penggunaan nyata chatbot ini</p>
              </div>

              <div className="space-y-2">
                <Label>Target Pengguna</Label>
                <Input
                  value={settings.productTargetUser}
                  onChange={(e) => set("productTargetUser", e.target.value)}
                  placeholder="Contoh: Kontraktor, konsultan pengadaan, staf procurement BUMN"
                  data-testid="input-product-target-user"
                />
                <p className="text-xs text-muted-foreground">Siapa yang paling cocok menggunakan chatbot ini</p>
              </div>

              <div className="space-y-2">
                <Label>Fitur Produk</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Tambahkan fitur..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                   
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={addFeature}
                    disabled={!newFeature.trim()}
                   
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {settings.productFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.productFeatures.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {feature}
                        <button
                          onClick={() => removeFeature(index)}
                          className="ml-1 hover:text-destructive"
                         
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pengaturan Harga & Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kelas Premium (harga lisensi sekali bayar)</Label>
                <Select
                  value={settings.licenseClass != null ? String(settings.licenseClass) : "none"}
                  onValueChange={setLicenseClass}
                >
                  <SelectTrigger data-testid="select-license-class">
                    <SelectValue placeholder="Pilih kelas premium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bukan Premium (harga bebas)</SelectItem>
                    {PREMIUM_CLASS_IDS.map((id) => (
                      <SelectItem key={id} value={String(id)} data-testid={`option-license-class-${id}`}>
                        {PREMIUM_CLASSES[id].label} — {formatCurrency(PREMIUM_CLASSES[id].price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {settings.licenseClass != null ? (
                  <p className="text-xs text-muted-foreground" data-testid="text-license-class-price">
                    Aktivasi (sekali bayar): <strong>{formatCurrency(priceForClass(settings.licenseClass) ?? 0)}</strong> — otomatis dari kelas. Biaya bulanan tetap terpisah.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      type="number"
                      value={settings.licensePrice}
                      onChange={(e) => setSettings({ ...settings, licensePrice: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min={0}
                      data-testid="input-license-price"
                    />
                    <p className="text-xs text-muted-foreground">
                      Harga lisensi (sekali bayar): {formatCurrency(salePrice)}. Pilih Kelas Premium di atas untuk harga seragam. Biaya bulanan tetap terpisah.
                    </p>
                  </div>
                )}
              </div>

              {salePrice > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    Link Pembayaran
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.paymentUrl}
                      onChange={(e) => set("paymentUrl", e.target.value)}
                      placeholder="https://mayar.id/checkout/... atau tempel link manual"
                      data-testid="input-payment-url"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 text-xs border-green-500 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-950/30"
                      onClick={() => generateMayarLinkMutation.mutate()}
                      disabled={generateMayarLinkMutation.isPending || !salePrice}
                      data-testid="button-generate-mayar-link"
                      title="Generate link pembayaran Mayar otomatis dari harga di atas"
                    >
                      {generateMayarLinkMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Generate Mayar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tempel link manual dari Scalev / Midtrans / dll, <strong>atau</strong> klik <em>Generate Mayar</em> untuk buat link otomatis via Mayar.id (butuh MAYAR_API_KEY di Secrets).
                  </p>
                  {settings.paymentUrl && (
                    <a href={settings.paymentUrl} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" /> Test Link Pembayaran
                      </Button>
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Aktifkan Masa Percobaan</Label>
                  <p className="text-xs text-muted-foreground">Pelanggan dapat mencoba sebelum berlangganan</p>
                </div>
                <Switch
                  checked={settings.trialEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, trialEnabled: checked })}
                  data-testid="switch-trial-enabled"
                />
              </div>

              {settings.trialEnabled && (
                <div className="space-y-2">
                  <Label>Durasi Trial (hari)</Label>
                  <Input
                    type="number"
                    value={settings.trialDays}
                    onChange={(e) => setSettings({ ...settings, trialDays: parseInt(e.target.value) || 0 })}
                    placeholder="7"
                    min={1}
                    data-testid="input-trial-days"
                  />
                </div>
              )}

              {settings.monthlyPrice > 0 && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Alur Penjualan via Mayar.id
                  </p>
                  <ol className="text-xs text-green-700 dark:text-green-400 space-y-1 list-decimal list-inside">
                    <li>Isi harga di atas → klik <strong>Generate Mayar</strong> → link otomatis terisi</li>
                    <li>Klik <strong>Simpan Perubahan</strong> agar link tersimpan ke chatbot</li>
                    <li>Customer klik "Bayar Sekarang" di chatbot → redirect ke Mayar → bayar</li>
                    <li>Mayar kirim webhook ke <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded">/api/webhooks/mayar</code> → akses aktif otomatis 30 hari</li>
                    <li>Customer kembali ke chatbot → "Sudah bayar?" → masukkan email → langsung chat</li>
                  </ol>
                  <p className="text-xs text-green-600 dark:text-green-500 pt-1 border-t border-green-200 dark:border-green-800">
                    Butuh: <strong>MAYAR_API_KEY</strong> + <strong>MAYAR_WEBHOOK_SECRET</strong> di Secrets, dan set webhook URL di dashboard Mayar.id
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quota Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Pengaturan Kuota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kuota Pesan Harian</Label>
                <Input
                  type="number"
                  value={settings.messageQuotaDaily}
                  onChange={(e) => setSettings({ ...settings, messageQuotaDaily: parseInt(e.target.value) || 0 })}
                  placeholder="50"
                  min={0}
                 
                />
              </div>

              <div className="space-y-2">
                <Label>Kuota Pesan Bulanan</Label>
                <Input
                  type="number"
                  value={settings.messageQuotaMonthly}
                  onChange={(e) => setSettings({ ...settings, messageQuotaMonthly: parseInt(e.target.value) || 0 })}
                  placeholder="1000"
                  min={0}
                 
                />
              </div>

              <div className="space-y-2">
                <Label>Batas Pesan Gratis (Guest)</Label>
                <Input
                  type="number"
                  value={settings.guestMessageLimit}
                  onChange={(e) => setSettings({ ...settings, guestMessageLimit: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  min={0}
                  data-testid="input-guest-message-limit"
                />
                <p className="text-xs text-muted-foreground">Jumlah pesan gratis sebelum pengguna diminta mendaftar. Set 0 untuk tanpa batas.</p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Wajib Registrasi</Label>
                  <p className="text-xs text-muted-foreground">Pengguna akhir harus mendaftar untuk menggunakan chatbot</p>
                </div>
                <Switch
                  checked={settings.requireRegistration}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireRegistration: checked })}
                 
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Brand</Label>
                <Input
                  value={settings.brandingName}
                  onChange={(e) => setSettings({ ...settings, brandingName: e.target.value })}
                  placeholder="Nama brand chatbot Anda"
                 
                />
              </div>

              <div className="space-y-2">
                <Label>URL Logo Brand</Label>
                <Input
                  value={settings.brandingLogo}
                  onChange={(e) => setSettings({ ...settings, brandingLogo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                 
                />
                {settings.brandingLogo && (
                  <div className="mt-2 p-2 border rounded-md inline-block">
                    <img
                      src={settings.brandingLogo}
                      alt="Logo preview"
                      className="h-10 w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                     
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Public Link Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Preview Link Publik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL Marketplace</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={getMarketplaceUrl()}
                    readOnly
                    className="text-sm"
                   
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyMarketplaceUrl}
                   
                  >
                    {copiedMarketplace ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL Chat</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={getChatUrl()}
                    readOnly
                    className="text-sm"
                   
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyChatUrl}
                   
                  >
                    {copiedChat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
