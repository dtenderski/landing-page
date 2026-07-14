import { useState } from "react";
import { useLocation } from "wouter";
import {
  FileText, Download, ClipboardCopy, Check, Bot, Globe, ExternalLink, Link,
  Sparkles, Loader2, Eye, Code2, Palette, RefreshCw, Package, ChevronDown, ChevronUp,
  Zap, MessageSquare, Mic, Mail, Calendar, BarChart3, Star, Users, Copy,
  Share2, ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin!" });
  };
  return (
    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy} data-testid="button-copy-text">
      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Tersalin" : label}
    </Button>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium text-left"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

const TEMPLATE_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#2563eb", label: "Biru" },
  { value: "#16a34a", label: "Hijau" },
  { value: "#7c3aed", label: "Ungu" },
  { value: "#ea580c", label: "Oranye" },
  { value: "#0d9488", label: "Teal" },
  { value: "#dc2626", label: "Merah" },
  { value: "#d97706", label: "Amber" },
];

const TEMPLATE_CATEGORIES = [
  "Bisnis", "Konstruksi", "Pendidikan", "Hukum", "Teknologi",
  "Kesehatan", "Keuangan", "Perjalanan", "Umum",
];

export function LandingPagePanel({ agent }: { agent: any }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [landingPageUrl, setLandingPageUrl] = useState(agent.landingPageUrl || "");
  const [copied, setCopied] = useState(false);

  const [lpStyle, setLpStyle] = useState("modern");
  const [lpColor, setLpColor] = useState("blue");
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview");

  const [kitData, setKitData] = useState<any | null>(null);

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishCategory, setPublishCategory] = useState(agent.category || "Umum");
  const [publishColor, setPublishColor] = useState("#6366f1");
  const [publishDescription, setPublishDescription] = useState(agent.description || "");
  const [publishSuccess, setPublishSuccess] = useState(false);

  const { data: knowledgeBases = [] } = useQuery<any[]>({
    queryKey: [`/api/knowledge-base/${agent.id}`],
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/agents/${agent.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Tersimpan", description: "URL landing page berhasil disimpan" });
    },
  });

  const generateLpMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agents/${agent.id}/landing-page/generate`, {
        style: lpStyle, colorScheme: lpColor,
      }),
    onSuccess: (data: any) => {
      setGeneratedHtml(data.html || "");
      setPreviewMode("preview");
      toast({ title: "Landing page berhasil dibuat!", description: "Preview sudah tersedia di bawah." });
    },
    onError: () => toast({ title: "Gagal generate", description: "Coba beberapa saat lagi", variant: "destructive" }),
  });

  const generateKitMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agents/${agent.id}/marketing-kit/generate`, {}),
    onSuccess: (data: any) => {
      setKitData(data.kit || null);
      toast({ title: "Marketing Kit siap!", description: "Semua konten marketing sudah terbuat." });
    },
    onError: () => toast({ title: "Gagal generate Marketing Kit", variant: "destructive" }),
  });

  const publishTemplateMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agents/${agent.id}/publish-template`, {
        category: publishCategory,
        description: publishDescription,
        thumbnailColor: publishColor,
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot-templates"] });
      setPublishSuccess(true);
      toast({ title: "Template berhasil dipublish!", description: "Chatbot Anda kini tersedia di galeri template." });
    },
    onError: () => toast({ title: "Gagal publish template", variant: "destructive" }),
  });

  const downloadHtmlFile = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase();
    a.download = `landing-page-${slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "File HTML diunduh!" });
  };

  const downloadKitJson = () => {
    if (!kitData) return;
    const blob = new Blob([JSON.stringify(kitData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase();
    a.download = `marketing-kit-${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Marketing Kit JSON diunduh!" });
  };

  const buildSummary = () => {
    const lines: string[] = [];
    lines.push(`# Rangkuman Chatbot: ${agent.name || "(Tanpa Nama)"}\n---\n`);
    lines.push("## 1. IDENTITAS\n");
    if (agent.name) lines.push(`- **Nama:** ${agent.name}`);
    if (agent.tagline) lines.push(`- **Tagline:** ${agent.tagline}`);
    if (agent.description) lines.push(`- **Deskripsi:** ${agent.description}`);
    if (agent.category) lines.push(`- **Kategori:** ${agent.category}`);
    if (agent.language) lines.push(`- **Bahasa:** ${agent.language === "id" ? "Indonesia" : agent.language}`);
    lines.push(`- **URL Chat:** ${window.location.origin}/bot/${agent.id}`);
    lines.push("");
    if (agent.personality || agent.philosophy) {
      lines.push("## 2. PERSONA & KARAKTER\n");
      if (agent.personality) lines.push(`- **Personality:** ${agent.personality}`);
      if (agent.communicationStyle) lines.push(`- **Gaya Komunikasi:** ${agent.communicationStyle}`);
      if (agent.toneOfVoice) lines.push(`- **Tone:** ${agent.toneOfVoice}`);
      if (agent.philosophy) lines.push(`- **Filosofi:** ${agent.philosophy}`);
      lines.push("");
    }
    const expertise = agent.expertise || [];
    if (expertise.length > 0) {
      lines.push("## 3. KEAHLIAN\n");
      expertise.forEach((e: string) => lines.push(`- ${e}`));
      lines.push("");
    }
    if (knowledgeBases.length > 0) {
      lines.push("## 4. KNOWLEDGE BASE\n");
      knowledgeBases.forEach((kb: any) => lines.push(`- **${kb.name}** (${kb.type})`));
      lines.push("");
    }
    if (agent.monthlyPrice) {
      lines.push("## 5. MONETISASI\n");
      lines.push(`- **Harga:** Rp ${agent.monthlyPrice.toLocaleString("id-ID")}/bulan`);
      if (agent.trialEnabled) lines.push(`- **Trial:** ${agent.trialDays || 7} hari`);
      lines.push("");
    }
    lines.push("---");
    lines.push(`*Auto-generated oleh Gustafta AI*`);
    return lines.join("\n");
  };

  const slug = (agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase();

  const downloadSummaryMd = () => {
    const blob = new Blob([buildSummary()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rangkuman-${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "File Markdown diunduh!" });
  };

  const colorOptions = [
    { value: "blue", label: "Biru", hex: "#2563eb" },
    { value: "green", label: "Hijau", hex: "#16a34a" },
    { value: "purple", label: "Ungu", hex: "#7c3aed" },
    { value: "orange", label: "Oranye", hex: "#ea580c" },
    { value: "teal", label: "Teal", hex: "#0d9488" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl overflow-y-auto max-h-[calc(100vh-80px)]">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Landing Page & Marketing Kit</h2>
          <p className="text-sm text-muted-foreground">Generate landing page AI dan semua konten marketing dari konfigurasi chatbot</p>
        </div>
      </div>

      <Tabs defaultValue="generator">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="generator" data-testid="tab-landing-generator">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />AI Generator
          </TabsTrigger>
          <TabsTrigger value="marketing-kit" data-testid="tab-marketing-kit">
            <Package className="w-3.5 h-3.5 mr-1.5" />Marketing Kit
          </TabsTrigger>
          <TabsTrigger value="rangkuman" data-testid="tab-rangkuman">
            <FileText className="w-3.5 h-3.5 mr-1.5" />Rangkuman
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: AI LANDING PAGE GENERATOR ─── */}
        <TabsContent value="generator" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold">Generate Landing Page dengan AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI akan membaca seluruh konfigurasi chatbot ini — persona, fitur, harga, expertise — dan membuat landing page HTML siap publish lengkap dengan hero, fitur, demo chat, testimoni, dan FAQ.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gaya Desain</Label>
                  <Select value={lpStyle} onValueChange={setLpStyle}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-lp-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Clean</SelectItem>
                      <SelectItem value="professional">Professional & Corporate</SelectItem>
                      <SelectItem value="bold">Bold & Impactful</SelectItem>
                      <SelectItem value="minimal">Minimal & Elegant</SelectItem>
                      <SelectItem value="tech">Tech & Futuristic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Warna Aksen</Label>
                  <Select value={lpColor} onValueChange={setLpColor}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-lp-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => generateLpMutation.mutate()}
                disabled={generateLpMutation.isPending}
                data-testid="button-generate-landing-page"
              >
                {generateLpMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sedang Generate Landing Page (~30 detik)...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Generate Landing Page dengan AI</>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedHtml && (
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Hasil Landing Page</span>
                    <Badge variant="secondary" className="text-[10px]">Siap Download</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(previewMode === "preview" ? "code" : "preview")}
                      data-testid="button-toggle-preview-mode"
                    >
                      {previewMode === "preview" ? <><Code2 className="w-3.5 h-3.5 mr-1.5" />Lihat Kode</> : <><Eye className="w-3.5 h-3.5 mr-1.5" />Preview</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateLpMutation.mutate()}
                      disabled={generateLpMutation.isPending}
                      data-testid="button-regenerate-lp"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={downloadHtmlFile}
                      data-testid="button-download-landing-html"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />Download HTML
                    </Button>
                  </div>
                </div>

                {previewMode === "preview" ? (
                  <div className="border rounded-lg overflow-hidden bg-white" style={{ height: "600px" }}>
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-full"
                      title="Landing Page Preview"
                      sandbox="allow-same-origin"
                      data-testid="iframe-landing-preview"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <CopyButton text={generatedHtml} label="Salin Kode" />
                    </div>
                    <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-auto max-h-[500px] whitespace-pre-wrap text-foreground">
                      {generatedHtml}
                    </pre>
                  </div>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p className="font-medium">Cara Deploy Landing Page:</p>
                  <p>1. Download file HTML → upload ke hosting (Netlify, Vercel, GitHub Pages — semua gratis)</p>
                  <p>2. Atau buka file di browser → Ctrl+A, Ctrl+C → paste ke platform website (Webflow, Wix, dll)</p>
                  <p>3. Simpan URL landing page di tab "Rangkuman" untuk referensi</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Gustafta Landing Page URL ─── */}
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <Label className="text-base font-semibold text-indigo-800">Landing Page Gustafta</Label>
                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">BARU</span>
              </div>
              <p className="text-xs text-muted-foreground">
                URL landing page otomatis — langsung bisa dibagikan ke publik, tidak perlu deploy eksternal
              </p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-white border border-indigo-200 rounded-md px-3 py-2 text-sm font-mono text-indigo-700 truncate">
                  {window.location.origin}/landing/{agent.id}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/landing/${agent.id}`);
                  }}
                  data-testid="button-copy-gustafta-landing-url"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Salin
                </Button>
                <Button variant="outline" size="icon" className="shrink-0 border-indigo-300" asChild>
                  <a href={`/landing/${agent.id}`} target="_blank" rel="noopener noreferrer" data-testid="button-open-gustafta-landing">
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">URL Landing Page Eksternal</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Opsional: simpan URL landing page eksternal (Netlify, Carrd, dll) sebagai referensi
              </p>
              <div className="flex gap-2">
                <Input
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                  placeholder="https://chatbot-anda.netlify.app atau https://carrd.co/..."
                  data-testid="input-landing-page-url"
                />
                <Button onClick={() => updateMutation.mutate({ landingPageUrl: landingPageUrl.trim() })} disabled={updateMutation.isPending} data-testid="button-save-landing-url">
                  {updateMutation.isPending ? "..." : "Simpan"}
                </Button>
                {landingPageUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={landingPageUrl} target="_blank" rel="noopener noreferrer" data-testid="button-open-landing-url">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: MARKETING KIT ─── */}
        <TabsContent value="marketing-kit" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-semibold">Generate Marketing Kit Lengkap</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI akan generate semua konten marketing sekaligus: tagline, elevator pitch, WA broadcast, social posts, ad copy, email sequence, value proposition canvas, FAQ, content calendar, dan testimoni — semuanya disesuaikan dengan chatbot ini.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { icon: Mic, label: "Elevator Pitch" },
                  { icon: MessageSquare, label: "WA Broadcast" },
                  { icon: Zap, label: "Ad Copy" },
                  { icon: Mail, label: "Email Sequence" },
                  { icon: Calendar, label: "Content Calendar" },
                  { icon: BarChart3, label: "Value Proposition" },
                  { icon: Star, label: "Testimoni" },
                  { icon: Users, label: "FAQ" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() => generateKitMutation.mutate()}
                disabled={generateKitMutation.isPending}
                data-testid="button-generate-marketing-kit"
              >
                {generateKitMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sedang Generate Marketing Kit (~20 detik)...</>
                ) : (
                  <><Package className="w-4 h-4 mr-2" />{kitData ? "Regenerate" : "Generate"} Marketing Kit Lengkap</>
                )}
              </Button>
            </CardContent>
          </Card>

          {kitData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="text-xs">Marketing Kit Siap</Badge>
                  <span className="text-xs text-muted-foreground">Klik bagian untuk expand</span>
                </div>
                <Button variant="outline" size="sm" onClick={downloadKitJson} data-testid="button-download-kit-json">
                  <Download className="w-3.5 h-3.5 mr-1.5" />Download JSON
                </Button>
              </div>

              <CollapsibleSection title="🎯 Tagline (5 Variasi)" defaultOpen>
                <div className="space-y-2">
                  {(kitData.taglines || []).map((t: string, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 bg-muted/40 rounded text-sm">
                      <span className="font-medium">{t}</span>
                      <CopyButton text={t} />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="🎤 Elevator Pitch (3 Durasi)" defaultOpen>
                <div className="space-y-3">
                  {Object.entries(kitData.elevator_pitch || {}).map(([dur, text]) => (
                    <div key={dur} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dur === "30s" ? "30 Detik" : dur === "60s" ? "60 Detik" : "2 Menit"}</span>
                        <CopyButton text={text as string} />
                      </div>
                      <p className="text-sm bg-muted/30 rounded p-3">{text as string}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="💬 WA Broadcast (3 Versi)">
                <div className="space-y-3">
                  {Object.entries(kitData.wa_broadcasts || {}).map(([ver, text]) => (
                    <div key={ver} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{ver === "short" ? "Singkat" : ver === "medium" ? "Medium" : "Panjang"}</span>
                        <CopyButton text={text as string} />
                      </div>
                      <p className="text-sm bg-muted/30 rounded p-3 whitespace-pre-wrap">{text as string}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="📱 Social Media Posts">
                <div className="space-y-3">
                  {Object.entries(kitData.social_posts || {}).map(([platform, text]) => (
                    <div key={platform} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{platform === "linkedin" ? "LinkedIn" : platform === "instagram" ? "Instagram" : "Facebook"}</span>
                        <CopyButton text={text as string} />
                      </div>
                      <p className="text-sm bg-muted/30 rounded p-3 whitespace-pre-wrap">{text as string}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="⚡ Ad Copy (Google & Meta)">
                <div className="space-y-4">
                  {Object.entries(kitData.ad_copies || {}).map(([platform, copy]: [string, any]) => (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{platform === "google" ? "Google Ads" : "Meta Ads"}</span>
                        <CopyButton text={Object.entries(copy).map(([k, v]) => `${k}: ${v}`).join("\n")} />
                      </div>
                      <div className="bg-muted/30 rounded p-3 space-y-1.5">
                        {Object.entries(copy).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-xs">
                            <span className="text-muted-foreground capitalize min-w-[90px]">{k.replace(/_/g, " ")}:</span>
                            <span className="text-foreground">{v as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="📧 Email Sequence (3 Email)">
                <div className="space-y-4">
                  {(kitData.email_sequence || []).map((email: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">Email {i + 1} — Hari {email.day}</Badge>
                        <CopyButton text={`Subject: ${email.subject}\n\n${email.body}\n\nCTA: ${email.cta}`} />
                      </div>
                      <p className="text-sm font-medium">{email.subject}</p>
                      <p className="text-xs text-muted-foreground italic">{email.preview}</p>
                      <p className="text-sm text-muted-foreground">{email.body}</p>
                      <p className="text-xs font-medium text-primary">CTA: {email.cta}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="🎯 Value Proposition Canvas">
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-semibold text-primary">{kitData.value_proposition?.statement}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "jobs", label: "Jobs to be Done" },
                      { key: "pains", label: "Pains" },
                      { key: "gains", label: "Gains" },
                      { key: "pain_relievers", label: "Pain Relievers" },
                      { key: "gain_creators", label: "Gain Creators" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
                        <ul className="space-y-1">
                          {(kitData.value_proposition?.[key] || []).map((item: string, i: number) => (
                            <li key={i} className="text-xs bg-muted/40 rounded px-2 py-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="📅 Content Calendar (7 Hari)">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Hari</th>
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Platform</th>
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Tipe</th>
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Topik & Hook</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(kitData.content_calendar || []).map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="py-2 pr-3 font-medium">{item.day}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{item.platform}</td>
                          <td className="py-2 pr-3"><Badge variant="secondary" className="text-[10px]">{item.type}</Badge></td>
                          <td className="py-2"><span className="font-medium">{item.topic}</span><span className="text-muted-foreground"> — {item.hook}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="⭐ Testimoni">
                <div className="space-y-3">
                  {(kitData.testimonials || []).map((t: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1.5">
                      <p className="text-sm italic text-foreground">"{t.text}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                        </div>
                        <CopyButton text={`"${t.text}" — ${t.name}, ${t.role}, ${t.company}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="❓ FAQ">
                <div className="space-y-2">
                  {(kitData.faq || []).map((item: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <p className="text-sm font-medium">{item.q}</p>
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: RANGKUMAN ─── */}
        <TabsContent value="rangkuman" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-semibold">Rangkuman Konfigurasi Chatbot</span>
              <Badge variant="secondary" className="text-[10px]">Auto-generated</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(buildSummary());
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast({ title: "Disalin!" });
              }} data-testid="button-copy-summary">
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <ClipboardCopy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSummaryMd} data-testid="button-download-summary-md">
                <Download className="w-3.5 h-3.5 mr-1.5" />.md
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-5">
              <div className="bg-muted/50 rounded-md p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed" data-testid="text-summary-preview">
                  {buildSummary()}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">Link Landing Page Eksternal</Label>
              </div>
              <p className="text-xs text-muted-foreground">Simpan URL landing page eksternal (Carrd, Notion, dll)</p>
              <div className="flex gap-2">
                <Input
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-landing-page-url-rangkuman"
                />
                <Button onClick={() => updateMutation.mutate({ landingPageUrl: landingPageUrl.trim() })} disabled={updateMutation.isPending} data-testid="button-save-landing-url-rangkuman">
                  {updateMutation.isPending ? "..." : "Simpan"}
                </Button>
                {landingPageUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={landingPageUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── PUBLISH TEMPLATE BANNER ─── */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4 flex items-start gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Bagikan ke Komunitas sebagai Template</p>
            <p className="text-xs text-muted-foreground mt-0.5">Publish chatbot ini ke galeri template. Pengguna lain bisa pakai sebagai starting point.</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/templates")} data-testid="button-view-template-gallery">
              Lihat Galeri <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <Button size="sm" className="text-xs h-7" onClick={() => { setShowPublishDialog(true); setPublishSuccess(false); }} data-testid="button-open-publish-template">
              <Share2 className="w-3 h-3 mr-1" />Publish Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── PUBLISH DIALOG ─── */}
      <Dialog open={showPublishDialog} onOpenChange={(o) => { setShowPublishDialog(o); if (!o) setPublishSuccess(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{publishSuccess ? "Template Dipublish!" : "Publish sebagai Template Komunitas"}</DialogTitle>
          </DialogHeader>
          {publishSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">"{agent.name}" sudah tersedia di galeri!</p>
                <p className="text-sm text-muted-foreground mt-1">Pengguna lain bisa temukan dan gunakan chatbot ini sebagai template.</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setShowPublishDialog(false)}>Tutup</Button>
                <Button size="sm" onClick={() => navigate("/templates")}>
                  Lihat Galeri Template <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted/40 rounded-lg flex items-center gap-3">
                  <Bot className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.category || "Chatbot"}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Deskripsi untuk template</Label>
                  <Textarea
                    value={publishDescription}
                    onChange={(e) => setPublishDescription(e.target.value)}
                    placeholder="Jelaskan apa yang bisa dilakukan chatbot ini..."
                    rows={3}
                    className="text-sm resize-none"
                    data-testid="textarea-publish-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kategori</Label>
                    <Select value={publishCategory} onValueChange={setPublishCategory}>
                      <SelectTrigger className="h-8 text-xs" data-testid="select-publish-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Warna kartu</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setPublishColor(c.value)}
                          className={`w-6 h-6 rounded-full transition-all ${publishColor === c.value ? "ring-2 ring-offset-1 ring-foreground scale-110" : "opacity-70 hover:opacity-100"}`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                          data-testid={`button-color-${c.label.toLowerCase()}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2">
                  Config chatbot (nama, persona, keahlian, system prompt, KB) akan disalin ke template. Data percakapan tidak ikut dipublish.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Batal</Button>
                <Button onClick={() => publishTemplateMutation.mutate()} disabled={publishTemplateMutation.isPending} data-testid="button-confirm-publish-template">
                  {publishTemplateMutation.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Publishing...</>
                  ) : (
                    <><Share2 className="w-3.5 h-3.5 mr-1.5" />Publish ke Galeri</>
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
