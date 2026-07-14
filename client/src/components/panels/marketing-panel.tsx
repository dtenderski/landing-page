import { useState, useEffect, useRef } from "react";
import {
  Megaphone, Download, ClipboardCopy, Check, Target, MessageSquare,
  Sparkles, Globe, Users, ExternalLink, Link, Eye, Zap, Mail,
  Calendar, Instagram, Linkedin, FileText, BarChart3, Mic,
  ChevronDown, ChevronUp, Loader2, Copy, RefreshCw,
  Scan, PenLine, Newspaper, Share2, Printer, Bot,
  Phone, Star, ArrowRight, Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// ─── AI Tool definitions ───────────────────────────────────────────────
interface AiTool {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  options?: { key: string; label: string; choices: string[] }[];
}

const AI_TOOLS: AiTool[] = [
  {
    id: "ad-copy",
    label: "Ad Copy Generator",
    description: "Headline & deskripsi iklan siap pakai untuk Meta, Google, LinkedIn, TikTok",
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    options: [{ key: "platform", label: "Platform", choices: ["Meta Ads", "Google Ads", "LinkedIn Ads", "TikTok Ads"] }],
  },
  {
    id: "wa-broadcast",
    label: "WA Broadcast Script",
    description: "3 versi script WhatsApp (singkat/medium/panjang) siap kirim ke calon klien",
    icon: MessageSquare,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    options: [{ key: "tone", label: "Tone", choices: ["Profesional", "Kasual", "Formal & Resmi", "Antusias"] }],
  },
  {
    id: "elevator-pitch",
    label: "Elevator Pitch",
    description: "Script presentasi singkat verbal untuk meeting, pameran, atau demo",
    icon: Mic,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    options: [{ key: "duration", label: "Durasi", choices: ["30 detik", "60 detik", "2 menit"] }],
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    description: "Postingan thought leadership untuk menarik perhatian profesional konstruksi",
    icon: Linkedin,
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
  },
  {
    id: "email-sequence",
    label: "Email Sequence (3 Email)",
    description: "Drip campaign 3 email: perkenalan → value → closing untuk leads B2B",
    icon: Mail,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    id: "content-calendar",
    label: "Content Calendar 7 Hari",
    description: "Jadwal posting media sosial lengkap dengan topik & format selama seminggu",
    icon: Calendar,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "instagram-caption",
    label: "Caption Instagram",
    description: "3 variasi caption + hashtag Indonesia untuk feed, Reels, atau Story",
    icon: Instagram,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
  },
  {
    id: "proposal-exec",
    label: "Executive Summary Proposal",
    description: "Ringkasan 1 halaman untuk proposal klien konstruksi: BUJK, kontraktor, konsultan",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    id: "value-proposition",
    label: "Value Proposition Canvas",
    description: "Customer profile, pain relievers, gain creators, dan fit statement lengkap",
    icon: BarChart3,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
  },
];

// ─── AI Tool Card ─────────────────────────────────────────────────────
function AiToolCard({ tool, agent }: { tool: AiTool; agent: any }) {
  const { toast } = useToast();
  const [result, setResult] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optValues, setOptValues] = useState<Record<string, string>>({});

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agents/${agent.id}/marketing/generate`, {
        tool: tool.id,
        ...optValues,
      }),
    onSuccess: (data: any) => {
      setResult(data.content || "");
      setExpanded(true);
    },
    onError: () => {
      toast({ title: "Gagal", description: "Tidak bisa generate konten saat ini", variant: "destructive" });
    },
  });

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin!", description: "Konten berhasil disalin ke clipboard" });
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase();
    a.download = `${tool.id}-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Icon = tool.icon;

  return (
    <Card className={`border transition-all duration-200 ${expanded ? "ring-2 ring-primary/20" : ""}`}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.bgColor}`}>
            <Icon className={`w-5 h-5 ${tool.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">{tool.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tool.description}</p>
          </div>
        </div>

        {tool.options && (
          <div className="flex gap-2 flex-wrap">
            {tool.options.map((opt) => (
              <div key={opt.key} className="flex-1 min-w-[140px]">
                <Select
                  value={optValues[opt.key] || opt.choices[0]}
                  onValueChange={(v) => setOptValues((prev) => ({ ...prev, [opt.key]: v }))}
                >
                  <SelectTrigger className="h-8 text-xs" data-testid={`select-${tool.id}-${opt.key}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opt.choices.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full h-8 text-xs"
          data-testid={`button-generate-${tool.id}`}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
          ) : result ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Buat Ulang</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate AI</>
          )}
        </Button>

        {result && (
          <div className="space-y-2">
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              data-testid={`button-toggle-${tool.id}`}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Sembunyikan" : "Tampilkan"} hasil
            </button>
            {expanded && (
              <div className="space-y-2">
                <div className="bg-muted/60 rounded-md p-3 max-h-[280px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-foreground leading-relaxed font-mono" data-testid={`text-result-${tool.id}`}>
                    {result}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={copyResult}
                    data-testid={`button-copy-${tool.id}`}
                  >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "Tersalin" : "Salin"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={downloadResult}
                    data-testid={`button-download-${tool.id}`}
                  >
                    <Download className="w-3 h-3 mr-1" /> Unduh .txt
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Platform Tools ───────────────────────────────────────────────────
interface Platform {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
  Icon: React.ElementType;
  tools: AiTool[];
}

const PLATFORMS: Platform[] = [
  {
    id: "facebook",
    label: "Facebook",
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    ringColor: "ring-[#1877F2]/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1877F2]">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
    tools: [
      { id: "facebook-post", label: "Facebook Feed Post", description: "3 variasi post: edukasi, promo, dan engagement untuk algoritma organik Facebook", icon: Globe, color: "text-[#1877F2]", bgColor: "bg-[#1877F2]/10" },
      { id: "facebook-ad", label: "Facebook Ad Copy", description: "Single image, carousel 3 kartu, dan video ad script 30 detik siap upload ke Ads Manager", icon: Zap, color: "text-[#1877F2]", bgColor: "bg-[#1877F2]/10" },
      { id: "facebook-group", label: "Facebook Group Post", description: "2 post organik komunitas — story autentik & diskusi — tidak terasa seperti iklan", icon: Users, color: "text-[#1877F2]", bgColor: "bg-[#1877F2]/10" },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "text-[#E1306C]",
    bgColor: "bg-[#E1306C]/10",
    ringColor: "ring-[#E1306C]/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E1306C]">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    tools: [
      { id: "instagram-reel", label: "Instagram Reels Script", description: "Script lengkap per detik — hook, body, CTA, caption, dan 20 hashtag untuk Reels viral", icon: Mic, color: "text-[#E1306C]", bgColor: "bg-[#E1306C]/10", options: [{ key: "duration", label: "Durasi", choices: ["30 detik", "60 detik", "90 detik"] }] },
      { id: "instagram-story", label: "Instagram Story Sequence", description: "5 slide story berurutan: hook → problem → solution → proof → CTA dengan elemen interaktif", icon: Globe, color: "text-[#E1306C]", bgColor: "bg-[#E1306C]/10" },
      { id: "instagram-bio", label: "Instagram Bio Optimizer", description: "Bio 150 karakter, username saran, 5 highlights, content pillars, dan strategi link in bio", icon: Target, color: "text-[#E1306C]", bgColor: "bg-[#E1306C]/10" },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "text-foreground",
    bgColor: "bg-black/10 dark:bg-white/10",
    ringColor: "ring-foreground/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.17 8.17 0 004.77 1.53V6.93a4.86 4.86 0 01-1-.24z"/>
      </svg>
    ),
    tools: [
      { id: "tiktok-script", label: "TikTok Video Script", description: "Script per detik — hook kuat, body, CTA, caption, saran audio & efek untuk konten viral", icon: Mic, color: "text-foreground", bgColor: "bg-black/10 dark:bg-white/10" },
      { id: "tiktok-hooks", label: "10 Hook Generator", description: "10 hook pembuka TikTok yang kuat: pertanyaan provokatif, fakta mengejutkan, rahasia, transformasi", icon: Zap, color: "text-foreground", bgColor: "bg-black/10 dark:bg-white/10" },
      { id: "tiktok-caption", label: "Caption + Hashtag Kit", description: "3 set caption + 30 hashtag per set (mega + mid + niche konstruksi) dengan waktu posting terbaik", icon: Target, color: "text-foreground", bgColor: "bg-black/10 dark:bg-white/10" },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    color: "text-[#FF0000]",
    bgColor: "bg-[#FF0000]/10",
    ringColor: "ring-[#FF0000]/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#FF0000]">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    tools: [
      { id: "youtube-script", label: "YouTube Video Script", description: "Script lengkap dengan timestamp, intro, segmen isi, demo chatbot, outro, dan deskripsi SEO", icon: Mic, color: "text-[#FF0000]", bgColor: "bg-[#FF0000]/10", options: [{ key: "duration", label: "Durasi", choices: ["3 menit", "5 menit", "10 menit", "15 menit"] }] },
      { id: "youtube-seo", label: "YouTube SEO Package", description: "5 judul optimized, deskripsi 500 kata, 30 tags, chapter/timestamp, dan tips thumbnail", icon: BarChart3, color: "text-[#FF0000]", bgColor: "bg-[#FF0000]/10" },
      { id: "youtube-shorts", label: "YouTube Shorts Script", description: "Script 60 detik per detik — hook, problem, solution, proof, CTA — siap rekam & edit", icon: Zap, color: "text-[#FF0000]", bgColor: "bg-[#FF0000]/10" },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    ringColor: "ring-[#0A66C2]/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0A66C2]">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    tools: [
      { id: "linkedin-article", label: "LinkedIn Article Outline", description: "Outline thought leadership 5 bab dengan key points, SEO keywords, dan saran banner — langsung tulis di LinkedIn", icon: FileText, color: "text-[#0A66C2]", bgColor: "bg-[#0A66C2]/10" },
      { id: "linkedin-dm", label: "LinkedIn DM / InMail", description: "3 template outreach (cold, after event, after viewed profile) + saran follow-up timed sequence", icon: Mail, color: "text-[#0A66C2]", bgColor: "bg-[#0A66C2]/10" },
      { id: "linkedin-company", label: "Company Page Post", description: "3 post perusahaan: announcement produk, edukasi industri, dan success story/case study", icon: Users, color: "text-[#0A66C2]", bgColor: "bg-[#0A66C2]/10" },
    ],
  },
  {
    id: "google",
    label: "Google",
    color: "text-[#4285F4]",
    bgColor: "bg-[#4285F4]/10",
    ringColor: "ring-[#4285F4]/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    tools: [
      { id: "google-search-ad", label: "Google Search Ad (RSA)", description: "15 headline + 4 deskripsi format RSA, 20 keyword saran, negative keywords, sitelink & callout extension", icon: Zap, color: "text-[#4285F4]", bgColor: "bg-[#4285F4]/10" },
      { id: "google-display", label: "Google Display Ad", description: "Responsive display ad: 5 short + 5 long headline, 5 deskripsi, saran gambar, dan audience targeting", icon: Globe, color: "text-[#4285F4]", bgColor: "bg-[#4285F4]/10" },
      { id: "google-gmb", label: "Google My Business", description: "Deskripsi bisnis GMB, 5 jenis post GMB, FAQ 5 Q&A, dan template respons review bintang 5 & kritik", icon: Star, color: "text-[#4285F4]", bgColor: "bg-[#4285F4]/10" },
    ],
  },
];

function PlatformToolsTab({ agent }: { agent: any }) {
  const [activePlatform, setActivePlatform] = useState("facebook");
  const platform = PLATFORMS.find(p => p.id === activePlatform)!;
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Pilih platform lalu generate konten AI yang disesuaikan dengan format dan algoritma masing-masing.
      </p>
      {/* Platform picker */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PLATFORMS.map(p => {
          const PIcon = p.Icon;
          const active = p.id === activePlatform;
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              data-testid={`button-platform-${p.id}`}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all
                ${active ? `${p.bgColor} ring-2 ${p.ringColor} border-transparent shadow-sm` : "bg-background border-border hover:bg-muted/60"}`}
            >
              <PIcon />
              <span className={active ? p.color : "text-muted-foreground"}>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Platform tools */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <platform.Icon />
          <span className={`font-semibold text-sm ${platform.color}`}>{platform.label} Tools</span>
          <Badge variant="secondary" className="text-xs ml-auto">{platform.tools.length} tools</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {platform.tools.map(tool => (
            <AiToolCard key={tool.id} tool={tool} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Storytelling Tab ─────────────────────────────────────────────────
const STORY_PRODUCTS = [
  { id: "chatbot",   label: "Chatbot AI",       emoji: "🤖", color: "from-violet-500 to-purple-600",   ring: "ring-violet-400/50",  bg: "bg-violet-50 dark:bg-violet-950/30",  text: "text-violet-700 dark:text-violet-300" },
  { id: "ebook",     label: "Panduan Digital",   emoji: "📘", color: "from-amber-500 to-orange-600",    ring: "ring-amber-400/50",   bg: "bg-amber-50 dark:bg-amber-950/30",    text: "text-amber-700 dark:text-amber-300" },
  { id: "ecourse",   label: "eCourse",           emoji: "🎓", color: "from-indigo-500 to-blue-600",     ring: "ring-indigo-400/50",  bg: "bg-indigo-50 dark:bg-indigo-950/30",  text: "text-indigo-700 dark:text-indigo-300" },
  { id: "mini-apps", label: "Mini Apps",         emoji: "⚡", color: "from-emerald-500 to-teal-600",   ring: "ring-emerald-400/50", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
  { id: "docgen",    label: "Generator Dokumen", emoji: "📄", color: "from-blue-500 to-cyan-600",      ring: "ring-blue-400/50",    bg: "bg-blue-50 dark:bg-blue-950/30",      text: "text-blue-700 dark:text-blue-300" },
];

const STORY_FRAMEWORKS = [
  { id: "origin",          label: "Kisah Asal Usul",    desc: "Mengapa produk ini diciptakan — momen aha!, visi founder", emoji: "🌱", color: "text-green-600" },
  { id: "hero-journey",    label: "Perjalanan Pahlawan", desc: "Pelanggan adalah hero, produk adalah pemandu (StoryBrand)", emoji: "⚔️", color: "text-yellow-600" },
  { id: "problem-solution",label: "Masalah & Solusi",   desc: "3-act story: dunia sebelumnya → krisis → transformasi",    emoji: "🔄", color: "text-blue-600" },
  { id: "before-after",    label: "Sebelum & Sesudah",  desc: "Kontras emosional kuat: kehidupan lama vs kehidupan baru", emoji: "✨", color: "text-purple-600" },
  { id: "social-proof",    label: "Kisah Sukses",       desc: "Testimonial story gaya majalah bisnis — kredibel & nyata",  emoji: "🏆", color: "text-amber-600" },
];

interface SavedStory {
  content: string;
  product: string;
  framework: string;
  productLabel: string;
  frameworkLabel: string;
  savedAt: string;
}

function useStoryLibrary(agentId: string | number) {
  const key = `gustafta-stories-${agentId}`;

  const load = (): Record<string, SavedStory> => {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  };
  const save = (storyKey: string, story: SavedStory) => {
    const lib = load();
    lib[storyKey] = story;
    localStorage.setItem(key, JSON.stringify(lib));
  };
  const remove = (storyKey: string) => {
    const lib = load();
    delete lib[storyKey];
    localStorage.setItem(key, JSON.stringify(lib));
  };
  return { load, save, remove };
}

function StorytellingTab({ agent }: { agent: any }) {
  const { toast } = useToast();
  const [activeProduct, setActiveProduct] = useState("chatbot");
  const [activeFramework, setActiveFramework] = useState("origin");
  const [storyText, setStoryText] = useState("");
  const [library, setLibrary] = useState<Record<string, SavedStory>>({});
  const [showLibrary, setShowLibrary] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const lib = useStoryLibrary(agent.id);

  useEffect(() => { setLibrary(lib.load()); }, []);

  const storyKey = `${activeProduct}-${activeFramework}`;
  const existingStory = library[storyKey];

  // Load saved story when switching product/framework
  const handleSelectProduct = (pid: string) => {
    setActiveProduct(pid);
    const k = `${pid}-${activeFramework}`;
    setStoryText(library[k]?.content || "");
  };
  const handleSelectFramework = (fid: string) => {
    setActiveFramework(fid);
    const k = `${activeProduct}-${fid}`;
    setStoryText(library[k]?.content || "");
  };

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agents/${agent.id}/storytelling/generate`, {
        product: activeProduct,
        framework: activeFramework,
      }),
    onSuccess: (data: any) => {
      setStoryText(data.content || "");
      toast({ title: "Cerita berhasil dibuat!", description: "Simpan ke perpustakaan untuk digunakan kembali" });
    },
    onError: () => {
      toast({ title: "Gagal generate cerita", variant: "destructive" });
    },
  });

  const saveStory = () => {
    if (!storyText.trim()) return;
    const product = STORY_PRODUCTS.find(p => p.id === activeProduct)!;
    const framework = STORY_FRAMEWORKS.find(f => f.id === activeFramework)!;
    const story: SavedStory = {
      content: storyText,
      product: activeProduct,
      framework: activeFramework,
      productLabel: product.label,
      frameworkLabel: framework.label,
      savedAt: new Date().toLocaleString("id-ID"),
    };
    lib.save(storyKey, story);
    setLibrary(lib.load());
    toast({ title: "✓ Cerita disimpan!", description: `${product.label} · ${framework.label} tersimpan di perpustakaan` });
  };

  const copyStory = (text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    const k = key || "current";
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(""), 2000);
    toast({ title: "Disalin!", description: "Gunakan sebagai basis konten marketing Anda" });
  };

  const deleteStory = (key: string) => {
    lib.remove(key);
    const updated = lib.load();
    setLibrary(updated);
    if (key === storyKey) setStoryText("");
    toast({ title: "Cerita dihapus" });
  };

  const downloadStory = () => {
    if (!storyText) return;
    const product = STORY_PRODUCTS.find(p => p.id === activeProduct)!;
    const framework = STORY_FRAMEWORKS.find(f => f.id === activeFramework)!;
    const blob = new Blob([storyText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `story-${product.id}-${framework.id}-${(agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const savedCount = Object.keys(library).length;
  const currentProduct = STORY_PRODUCTS.find(p => p.id === activeProduct)!;
  const currentFramework = STORY_FRAMEWORKS.find(f => f.id === activeFramework)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Generate 25 cerita unik (5 produk × 5 framework) yang menjadi fondasi semua konten marketing Anda.
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => { setLibrary(lib.load()); setShowLibrary(v => !v); }}
          className="gap-1.5 text-xs flex-shrink-0"
          data-testid="button-toggle-library"
        >
          <FileText className="w-3.5 h-3.5" />
          Perpustakaan {savedCount > 0 && <Badge className="h-4 px-1 text-xs ml-0.5">{savedCount}</Badge>}
        </Button>
      </div>

      {/* Story Library Panel */}
      {showLibrary && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Perpustakaan Story</span>
              <span className="text-xs text-muted-foreground ml-auto">{savedCount} cerita tersimpan</span>
            </div>
            {savedCount === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Belum ada cerita tersimpan. Generate dan simpan cerita untuk mulai membangun perpustakaan.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {Object.entries(library).map(([key, story]) => {
                  const prod = STORY_PRODUCTS.find(p => p.id === story.product);
                  const fw = STORY_FRAMEWORKS.find(f => f.id === story.framework);
                  return (
                    <div key={key} className="bg-background border rounded-lg p-3 space-y-2" data-testid={`story-card-${key}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{prod?.emoji}</span>
                        <span className="text-xs font-semibold">{story.productLabel}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs">{fw?.emoji}</span>
                        <span className="text-xs font-medium">{story.frameworkLabel}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{story.savedAt}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{story.content.substring(0, 150)}…</p>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1"
                          onClick={() => { setActiveProduct(story.product); setActiveFramework(story.framework); setStoryText(story.content); setShowLibrary(false); }}
                          data-testid={`button-load-story-${key}`}
                        >
                          <ArrowRight className="w-3 h-3" /> Buka & Edit
                        </Button>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1"
                          onClick={() => copyStory(story.content, key)}
                          data-testid={`button-copy-story-${key}`}
                        >
                          {copiedKey === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === key ? "Tersalin" : "Salin"}
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteStory(key)}
                          data-testid={`button-delete-story-${key}`}
                        >×</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Product Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
          <span className="text-xs font-semibold text-foreground">Pilih Produk Ekosistem</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {STORY_PRODUCTS.map(p => {
            const active = p.id === activeProduct;
            const hasSaved = Object.keys(library).some(k => k.startsWith(p.id));
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p.id)}
                data-testid={`button-story-product-${p.id}`}
                className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-xs font-semibold transition-all
                  ${active ? `${p.bg} ring-2 ${p.ring} border-transparent shadow-sm` : "bg-background border-border hover:bg-muted/60"}`}
              >
                {hasSaved && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center text-[8px] text-primary-foreground font-bold">
                    {Object.keys(library).filter(k => k.startsWith(p.id)).length}
                  </span>
                )}
                <span className="text-lg leading-none">{p.emoji}</span>
                <span className={`text-center leading-tight ${active ? p.text : "text-muted-foreground"}`} style={{ fontSize: "10px" }}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Framework Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
          <span className="text-xs font-semibold text-foreground">Pilih Framework Cerita</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {STORY_FRAMEWORKS.map(f => {
            const active = f.id === activeFramework;
            const saved = library[`${activeProduct}-${f.id}`];
            return (
              <button
                key={f.id}
                onClick={() => handleSelectFramework(f.id)}
                data-testid={`button-story-framework-${f.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all
                  ${active ? "bg-primary/10 ring-2 ring-primary/30 border-transparent" : "bg-background border-border hover:bg-muted/50"}`}
              >
                <span className="text-base flex-shrink-0">{f.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{f.label}</div>
                  <div className="text-xs text-muted-foreground leading-tight line-clamp-1">{f.desc}</div>
                </div>
                {saved && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0 gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Tersimpan
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Generate + Editor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
          <span className="text-xs font-semibold text-foreground">Generate & Edit Cerita</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentProduct.bg} ${currentProduct.text}`}>
              {currentProduct.emoji} {currentProduct.label}
            </span>
            <span className="text-xs text-muted-foreground">{currentFramework.emoji} {currentFramework.label}</span>
          </div>
        </div>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full gap-2"
          data-testid="button-generate-story"
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menulis cerita…</>
          ) : storyText ? (
            <><RefreshCw className="w-4 h-4" /> Generate Ulang Cerita</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Cerita AI</>
          )}
        </Button>

        {(storyText || existingStory) && (
          <div className="space-y-2">
            <Textarea
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              className="min-h-[280px] text-sm leading-relaxed resize-y font-normal"
              placeholder="Cerita akan muncul di sini — Anda bisa mengeditnya sebelum menyimpan…"
              data-testid="textarea-story"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                onClick={saveStory}
                disabled={!storyText.trim()}
                className="h-8 text-xs gap-1.5 col-span-2 sm:col-span-1"
                data-testid="button-save-story"
              >
                <Check className="w-3 h-3" /> Simpan ke Perpustakaan
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => copyStory(storyText, "current")}
                disabled={!storyText.trim()}
                className="h-8 text-xs gap-1.5"
                data-testid="button-copy-current-story"
              >
                {copiedKey === "current" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedKey === "current" ? "Tersalin!" : "Salin"}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={downloadStory}
                disabled={!storyText.trim()}
                className="h-8 text-xs gap-1.5"
                data-testid="button-download-story"
              >
                <Download className="w-3 h-3" /> Unduh .txt
              </Button>
              <Button
                variant="ghost" size="sm"
                onClick={() => { setStoryText(""); }}
                disabled={!storyText.trim()}
                className="h-8 text-xs text-muted-foreground"
                data-testid="button-clear-story"
              >
                Hapus Teks
              </Button>
            </div>
          </div>
        )}

        {!storyText && !existingStory && (
          <div className="rounded-lg border-2 border-dashed border-border py-10 text-center space-y-2">
            <div className="text-3xl">{currentProduct.emoji}</div>
            <p className="text-sm font-medium text-foreground">{currentProduct.label} · {currentFramework.label}</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">{currentFramework.desc}</p>
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold">Cara Menggunakan Story</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 leading-relaxed">
                <li>• Salin story → paste sebagai referensi saat generate konten di tab <strong>AI Tools</strong> atau <strong>Platforms</strong></li>
                <li>• Gunakan <strong>Kisah Asal Usul</strong> untuk About Us, Press Release, profil LinkedIn</li>
                <li>• Gunakan <strong>Perjalanan Pahlawan</strong> untuk landing page, email sequence, video script</li>
                <li>• Gunakan <strong>Sebelum & Sesudah</strong> untuk Facebook/Instagram ad, TikTok, testimonial</li>
                <li>• Gunakan <strong>Kisah Sukses</strong> untuk proposal klien, Google My Business, LinkedIn Company Post</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── WA Template Builder ──────────────────────────────────────────────
const WA_VARIABLES = ["{{nama}}", "{{produk}}", "{{link}}", "{{harga}}", "{{tanggal}}", "{{fitur}}"];

const WA_PRESETS: Record<string, { label: string; template: string }> = {
  promo: {
    label: "Promo / Penawaran",
    template: `Halo {{nama}} 👋

Kabar baik! {{produk}} kini hadir untuk membantu Anda bekerja lebih cepat dan efisien di industri konstruksi.

✅ Hemat waktu hingga 50%
✅ Tersedia 24/7 tanpa biaya tambahan
✅ Mudah digunakan — cukup chat

🔗 Coba sekarang: {{link}}

Ada pertanyaan? Balas pesan ini. Kami siap membantu! 🙌`,
  },
  followup: {
    label: "Follow-up Prospek",
    template: `Halo {{nama}},

Saya ingin menindaklanjuti percakapan kita sebelumnya tentang {{produk}}.

Saya paham Anda mungkin sedang sibuk — namun saya ingin memastikan Anda tidak melewatkan manfaat yang bisa langsung dirasakan oleh tim Anda.

Boleh saya jadwalkan 15 menit untuk demo singkat?

📅 Silakan pilih waktu yang sesuai atau langsung kunjungi: {{link}}

Terima kasih atas waktunya 🙏`,
  },
  broadcast: {
    label: "Broadcast Massal",
    template: `Halo {{nama}} 👋

*[PENGUMUMAN]* {{produk}} kini resmi tersedia!

Khusus minggu ini, dapatkan akses eksklusif dengan harga spesial {{harga}}.

🚀 Apa yang Anda dapatkan:
• Asisten AI 24 jam
• Integrasi mudah
• Support langsung

⏰ Penawaran berakhir {{tanggal}}.

Daftar sekarang 👉 {{link}}`,
  },
  reminder: {
    label: "Pengingat / Reminder",
    template: `Halo {{nama}},

Ini adalah pengingat bahwa akses trial {{produk}} Anda akan berakhir pada {{tanggal}}.

Jangan sampai Anda kehilangan semua kemudahan yang sudah Anda rasakan!

Perpanjang sekarang di: {{link}}

Butuh bantuan? Balas pesan ini 💬`,
  },
  event: {
    label: "Undangan Event / Webinar",
    template: `Halo {{nama}} 👋

Anda diundang ke *webinar eksklusif* kami!

📌 Topik: Cara Menggunakan {{produk}} untuk Efisiensi Kerja Konstruksi
📅 Tanggal: {{tanggal}}
🎯 Gratis & terbatas untuk {{nama}} dan rekan

Daftar sekarang sebelum penuh:
👉 {{link}}

Sampai jumpa! 🙌`,
  },
};

function WaEmailTab({ agent }: { agent: any }) {
  const { toast } = useToast();

  // ── WA Builder state ──
  const [waTab, setWaTab] = useState<"builder" | "sequence">("builder");
  const [waPreset, setWaPreset] = useState("promo");
  const [waText, setWaText] = useState(WA_PRESETS.promo.template);
  const [waCopied, setWaCopied] = useState(false);
  const waTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Preview: replace variables with agent data
  const chatUrl = `${window.location.origin}/bot/${agent.id}`;
  const waPreview = waText
    .replace(/\{\{nama\}\}/g, "Pak Budi")
    .replace(/\{\{produk\}\}/g, agent.name || "AI Chatbot")
    .replace(/\{\{link\}\}/g, chatUrl)
    .replace(/\{\{harga\}\}/g, (agent as any).monthlyPrice ? `Rp ${Number((agent as any).monthlyPrice).toLocaleString("id-ID")}/bln` : "harga terjangkau")
    .replace(/\{\{tanggal\}\}/g, "Jumat, 2 Mei 2025")
    .replace(/\{\{fitur\}\}/g, ((agent as any).productFeatures as string[] || []).slice(0, 2).join(", ") || "AI 24 jam");

  const insertVariable = (v: string) => {
    const el = waTextareaRef.current;
    if (!el) { setWaText(t => t + v); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = waText.substring(0, start) + v + waText.substring(end);
    setWaText(newText);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + v.length; el.focus(); }, 0);
  };

  const copyWa = () => {
    navigator.clipboard.writeText(waPreview);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2000);
    toast({ title: "Pesan WA disalin!", description: "Siap paste ke WhatsApp atau Blast Tool" });
  };

  const downloadWa = () => {
    const blob = new Blob([waPreview], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wa-template-${waPreset}-${(agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Email Sequence state ──
  interface EmailStep { day: string; subject: string; preview: string; body: string; }
  const defaultSteps: EmailStep[] = [
    { day: "Hari 1", subject: `Selamat datang di ${agent.name || "Platform Kami"}!`, preview: "Mulai perjalanan Anda hari ini...", body: "" },
    { day: "Hari 3", subject: `Sudahkah Anda mencoba fitur utama ${agent.name}?`, preview: "Kami ingin memastikan Anda mendapatkan manfaat maksimal...", body: "" },
    { day: "Hari 7", subject: "Tips Eksklusif untuk Hasil Terbaik", preview: "Rahasia pengguna terbaik kami...", body: "" },
    { day: "Hari 14", subject: "Studi Kasus: Berhasil Hemat 40% Waktu", preview: "Bagaimana kontraktor di Jakarta mengubah cara kerja mereka...", body: "" },
    { day: "Hari 30", subject: "Penawaran Spesial — Hanya untuk Anda", preview: "Kami menghargai kesetiaan Anda selama ini...", body: "" },
  ];
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>(defaultSteps);
  const [activeStep, setActiveStep] = useState(0);
  const [seqGenerating, setSeqGenerating] = useState(false);
  const [seqType, setSeqType] = useState("nurture");

  const seqTypes = [
    { id: "nurture", label: "Lead Nurturing" },
    { id: "onboarding", label: "Onboarding Pengguna Baru" },
    { id: "reengagement", label: "Re-engagement" },
    { id: "promo", label: "Promosi / Launch" },
  ];

  const generateSequenceMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/agents/${agent.id}/marketing/generate`, {
        tool: "email-sequence",
        tone: seqType,
      }),
    onSuccess: (data: any) => {
      const raw: string = data.content || "";
      // Parse the raw output into steps
      const updated = emailSteps.map((step, i) => {
        const markers = ["Email 1", "Email 2", "Email 3"];
        const idx = raw.indexOf(markers[i] || `Email ${i + 1}`);
        if (idx === -1) return step;
        const nextIdx = raw.indexOf(`Email ${i + 2}`, idx + 1);
        const chunk = nextIdx === -1 ? raw.substring(idx) : raw.substring(idx, nextIdx);
        const subjectMatch = chunk.match(/Subject Line:\s*(.+)/);
        const bodyStart = chunk.indexOf("Body");
        const bodyEnd = chunk.indexOf("CTA:", bodyStart);
        const body = bodyStart !== -1 ? chunk.substring(bodyStart + 5, bodyEnd !== -1 ? bodyEnd : undefined).trim() : "";
        return {
          ...step,
          subject: subjectMatch ? subjectMatch[1].trim() : step.subject,
          body: body || chunk.substring(0, 400),
        };
      });
      setEmailSteps(updated.length ? updated : emailSteps);
      toast({ title: "Sequence email dibuat!", description: "Edit setiap email sesuai kebutuhan" });
    },
    onError: () => toast({ title: "Gagal generate sequence", variant: "destructive" }),
  });

  const updateStep = (i: number, field: keyof EmailStep, val: string) => {
    setEmailSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const copyAllEmails = () => {
    const all = emailSteps.map(s =>
      `═══ ${s.day} ═══\nSubject: ${s.subject}\nPreview: ${s.preview}\n\n${s.body}`
    ).join("\n\n");
    navigator.clipboard.writeText(all);
    toast({ title: "Semua email disalin!", description: `${emailSteps.length} email sequence tersalin` });
  };

  const copyOneEmail = (i: number) => {
    const s = emailSteps[i];
    navigator.clipboard.writeText(`Subject: ${s.subject}\nPreview: ${s.preview}\n\n${s.body}`);
    toast({ title: `${s.day} disalin!` });
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab picker */}
      <div className="flex gap-2">
        <Button
          size="sm" variant={waTab === "builder" ? "default" : "outline"}
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => setWaTab("builder")}
          data-testid="button-subtab-wa"
        >
          <MessageSquare className="w-3.5 h-3.5" /> WA Template Builder
        </Button>
        <Button
          size="sm" variant={waTab === "sequence" ? "default" : "outline"}
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => setWaTab("sequence")}
          data-testid="button-subtab-email"
        >
          <Mail className="w-3.5 h-3.5" /> Email Sequence Builder
        </Button>
      </div>

      {/* ── WA BUILDER ── */}
      {waTab === "builder" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Buat template pesan WhatsApp dengan variabel dinamis. Preview langsung menampilkan versi final siap kirim.
          </p>

          {/* Preset selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Template Dasar</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {Object.entries(WA_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => { setWaPreset(key); setWaText(preset.template); }}
                  data-testid={`button-wa-preset-${key}`}
                  className={`text-xs py-1.5 px-2 rounded-lg border transition-all text-left font-medium
                    ${waPreset === key ? "bg-green-50 dark:bg-green-950/30 border-green-400 text-green-700 dark:text-green-300" : "border-border hover:bg-muted/60"}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variable chips */}
          <div className="space-y-1.5">
            <Label className="text-xs">Sisipkan Variabel (klik untuk insert di kursor)</Label>
            <div className="flex flex-wrap gap-1.5">
              {WA_VARIABLES.map(v => (
                <button
                  key={v}
                  onClick={() => insertVariable(v)}
                  data-testid={`button-wa-var-${v}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-200 font-mono transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Template Pesan</Label>
              <span className="text-xs text-muted-foreground">{waText.length} karakter</span>
            </div>
            <Textarea
              ref={waTextareaRef}
              value={waText}
              onChange={e => setWaText(e.target.value)}
              className="min-h-[180px] text-xs font-mono leading-relaxed resize-y"
              placeholder="Tulis template pesan WhatsApp di sini..."
              data-testid="textarea-wa-template"
            />
          </div>

          {/* Live Preview */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Preview (variabel sudah diisi)</Label>
            <div className="rounded-xl overflow-hidden border" style={{ background: "#111b21" }}>
              <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: "#202c33" }}>
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400">W</div>
                <span className="text-xs text-green-400 font-semibold">WhatsApp Preview</span>
              </div>
              <div className="p-3">
                <div
                  className="rounded-lg p-3 max-w-xs text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ background: "#005c4b", color: "#e9edef", fontSize: "12px", lineHeight: "1.55" }}
                  data-testid="text-wa-preview"
                >
                  {waPreview}
                </div>
                <div className="text-right mt-1" style={{ fontSize: "10px", color: "#8696a0" }}>
                  {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} ✓✓
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700" onClick={copyWa} data-testid="button-copy-wa">
              {waCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {waCopied ? "Tersalin!" : "Salin Pesan Final"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={downloadWa} data-testid="button-download-wa">
              <Download className="w-3 h-3" /> .txt
            </Button>
          </div>
        </div>
      )}

      {/* ── EMAIL SEQUENCE BUILDER ── */}
      {waTab === "sequence" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Buat email drip sequence multi-langkah. Generate otomatis dengan AI atau tulis manual setiap email.
          </p>

          {/* Sequence type + Generate */}
          <div className="flex gap-2">
            <Select value={seqType} onValueChange={setSeqType}>
              <SelectTrigger className="h-8 text-xs flex-1" data-testid="select-seq-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seqTypes.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm" className="h-8 text-xs gap-1.5 flex-shrink-0"
              onClick={() => generateSequenceMutation.mutate()}
              disabled={generateSequenceMutation.isPending}
              data-testid="button-generate-sequence"
            >
              {generateSequenceMutation.isPending
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                : <><Sparkles className="w-3 h-3" /> Generate AI</>}
            </Button>
          </div>

          {/* Step selectors */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {emailSteps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                data-testid={`button-email-step-${i}`}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                  ${activeStep === i
                    ? "bg-primary text-primary-foreground border-transparent"
                    : step.body ? "bg-muted border-primary/30 text-foreground" : "border-border text-muted-foreground hover:bg-muted/60"}`}
              >
                {step.day}
                {step.body && activeStep !== i && <span className="ml-1 text-green-500">●</span>}
              </button>
            ))}
          </div>

          {/* Active step editor */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold">{emailSteps[activeStep].day}</Badge>
                <button
                  onClick={() => copyOneEmail(activeStep)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  data-testid={`button-copy-email-${activeStep}`}
                >
                  <Copy className="w-3 h-3" /> Salin email ini
                </button>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Subject Line</Label>
                <Input
                  value={emailSteps[activeStep].subject}
                  onChange={e => updateStep(activeStep, "subject", e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Subject email..."
                  data-testid={`input-email-subject-${activeStep}`}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Preview Text (di bawah subject)</Label>
                <Input
                  value={emailSteps[activeStep].preview}
                  onChange={e => updateStep(activeStep, "preview", e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Teks preview singkat..."
                  data-testid={`input-email-preview-${activeStep}`}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Body Email</Label>
                <Textarea
                  value={emailSteps[activeStep].body}
                  onChange={e => updateStep(activeStep, "body", e.target.value)}
                  className="min-h-[200px] text-xs leading-relaxed resize-y"
                  placeholder={generateSequenceMutation.isPending
                    ? "AI sedang menulis..."
                    : "Tulis body email di sini, atau klik Generate AI untuk mengisi otomatis..."}
                  data-testid={`textarea-email-body-${activeStep}`}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                >
                  ← Email sebelumnya
                </Button>
                <Button
                  variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto"
                  onClick={() => setActiveStep(Math.min(emailSteps.length - 1, activeStep + 1))}
                  disabled={activeStep === emailSteps.length - 1}
                >
                  Email berikutnya →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export all */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={copyAllEmails} data-testid="button-copy-all-emails">
              <Copy className="w-3 h-3" /> Salin Semua Email ({emailSteps.length} step)
            </Button>
            <Button
              size="sm" variant="outline" className="h-8 text-xs gap-1.5"
              onClick={() => {
                const all = emailSteps.map(s => `═══ ${s.day} ═══\nSubject: ${s.subject}\nPreview: ${s.preview}\n\n${s.body}`).join("\n\n");
                const blob = new Blob([all], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `email-sequence-${(agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Email sequence diunduh!" });
              }}
              data-testid="button-download-sequence"
            >
              <Download className="w-3 h-3" /> .txt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QR Code Tool ─────────────────────────────────────────────────────
function QrCodeTool({ agent }: { agent: any }) {
  const { toast } = useToast();
  const [selectedUrl, setSelectedUrl] = useState("chatbot");
  const urls: Record<string, { label: string; url: string }> = {
    chatbot: { label: "Chatbot", url: `${window.location.origin}/bot/${agent.id}` },
    ecourse: { label: "Landing eCourse", url: `${window.location.origin}/product/${agent.id}/ecourse` },
    ebook: { label: "Landing Panduan Digital", url: `${window.location.origin}/product/${agent.id}/ebook` },
    docgen: { label: "Landing Generator Dokumen", url: `${window.location.origin}/product/${agent.id}/docgen` },
    miniapps: { label: "Landing Mini Apps", url: `${window.location.origin}/product/${agent.id}/mini-apps` },
    product: { label: "Landing Chatbot", url: `${window.location.origin}/product/${agent.id}` },
  };
  const current = urls[selectedUrl];
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(current.url)}&bgcolor=ffffff&color=1a1a2e&margin=12`;

  const downloadQr = async () => {
    try {
      const resp = await fetch(qrSrc);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${agent.name?.replace(/\s+/g, "-").toLowerCase() || "chatbot"}-${selectedUrl}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "QR Code diunduh!" });
    } catch {
      toast({ title: "Gagal mengunduh", description: "Klik kanan gambar → Simpan gambar", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">QR Code Generator</span>
          <Badge variant="secondary" className="text-xs ml-auto">Instan</Badge>
        </div>
        <p className="text-xs text-muted-foreground">QR code untuk banner, kartu nama, presentasi, dan materi cetak event konstruksi.</p>
        <Select value={selectedUrl} onValueChange={setSelectedUrl}>
          <SelectTrigger className="h-8 text-xs" data-testid="select-qr-url">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(urls).map(([key, val]) => (
              <SelectItem key={key} value={key} className="text-xs">{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <img src={qrSrc} alt="QR Code" className="w-40 h-40 block" data-testid="img-qr-code" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[200px] break-all">{current.url}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={downloadQr} data-testid="button-download-qr">
            <Download className="w-3 h-3 mr-1.5" /> Unduh PNG
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => { navigator.clipboard.writeText(current.url); toast({ title: "Link disalin!" }); }} data-testid="button-copy-qr-url">
            <Copy className="w-3 h-3 mr-1.5" /> Salin Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Email Signature Tool ─────────────────────────────────────────────
function EmailSignatureTool({ agent }: { agent: any }) {
  const { toast } = useToast();
  const [name, setName] = useState(agent.name || "");
  const [title, setTitle] = useState((agent as any).tagline || "Asisten AI Konstruksi");
  const [wa, setWa] = useState((agent as any).whatsappCta || "");
  const [copied, setCopied] = useState(false);

  const chatUrl = `${window.location.origin}/bot/${agent.id}`;
  const productUrl = `${window.location.origin}/product/${agent.id}`;
  const initials = (name || "AI").substring(0, 2).toUpperCase();

  const sigHtml = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#333;border-left:4px solid #4361ee;padding-left:16px;margin-top:8px">
  <tr><td><strong style="font-size:15px;color:#1a1a2e">${name}</strong></td></tr>
  <tr><td style="color:#4361ee;font-size:12px">${title}</td></tr>
  <tr><td style="padding-top:6px;font-size:12px">
    💬 <a href="${chatUrl}" style="color:#4361ee;text-decoration:none">Chat dengan AI</a>
    ${wa ? `&nbsp;·&nbsp; 📱 <a href="https://wa.me/${wa.replace(/\D/g, '')}" style="color:#25D366;text-decoration:none">WhatsApp</a>` : ""}
    &nbsp;·&nbsp; 🌐 <a href="${productUrl}" style="color:#4361ee;text-decoration:none">Landing Page</a>
  </td></tr>
  <tr><td style="padding-top:4px;font-size:11px;color:#888">Powered by Gustafta AI · Platform Chatbot Konstruksi Indonesia</td></tr>
</table>`;

  const copy = () => {
    navigator.clipboard.writeText(sigHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "HTML tanda tangan disalin!", description: "Paste di pengaturan tanda tangan email Anda" });
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Email Signature</span>
          <Badge variant="secondary" className="text-xs ml-auto">Instan</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Tanda tangan email HTML profesional dengan link chatbot dan WhatsApp.</p>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label className="text-xs mb-1 block">Nama Pengirim</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs" placeholder="Nama Anda / Chatbot" data-testid="input-sig-name" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Jabatan / Tagline</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-xs" placeholder="Asisten AI Konstruksi" data-testid="input-sig-title" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Nomor WhatsApp (opsional)</Label>
            <Input value={wa} onChange={e => setWa(e.target.value)} className="h-8 text-xs" placeholder="6281234567890" data-testid="input-sig-wa" />
          </div>
        </div>
        {/* Preview */}
        <div className="bg-muted/40 rounded-lg p-3 border text-xs" style={{ borderLeft: "4px solid #4361ee", paddingLeft: "12px" }}>
          <div className="font-bold text-sm" style={{ color: "#1a1a2e" }}>{name || "Nama Anda"}</div>
          <div style={{ color: "#4361ee", fontSize: "11px" }}>{title || "Jabatan"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            💬 <span className="text-blue-600 underline">Chat dengan AI</span>
            {wa && <> · 📱 <span className="text-green-600 underline">WhatsApp</span></>}
            {" "}· 🌐 <span className="text-blue-600 underline">Landing Page</span>
          </div>
          <div className="mt-0.5 text-muted-foreground" style={{ fontSize: "10px" }}>Powered by Gustafta AI</div>
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={copy} data-testid="button-copy-sig">
          {copied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
          {copied ? "Tersalin!" : "Salin HTML Tanda Tangan"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Paste di: Gmail → Pengaturan → Tanda Tangan</p>
      </CardContent>
    </Card>
  );
}

// ─── Digital Flyer Tool ───────────────────────────────────────────────
function FlyerTool({ agent }: { agent: any }) {
  const { toast } = useToast();
  const chatUrl = `${window.location.origin}/bot/${agent.id}`;
  const productUrl = `${window.location.origin}/product/${agent.id}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(chatUrl)}&bgcolor=ffffff&color=1a1a2e&margin=8`;
  const expertise: string[] = agent.expertise || [];
  const features: string[] = agent.productFeatures || agent.landingBenefits || [];
  const points = [...expertise.slice(0, 3), ...features.slice(0, 3)].slice(0, 5);
  const wa = (agent as any).whatsappCta || "";

  const flyerHtml = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Flyer — ${agent.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#f0f4ff; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
  .flyer { width:420px; background:linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%); border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
  .top-bar { background:linear-gradient(90deg,#4361ee,#7209b7); padding:10px 24px; font-size:11px; color:white; letter-spacing:2px; font-weight:700; text-transform:uppercase; }
  .hero { padding:32px 28px 24px; text-align:center; }
  .badge { display:inline-block; background:rgba(255,255,255,0.1); color:#a0b4ff; border:1px solid rgba(255,255,255,0.15); border-radius:20px; font-size:11px; padding:4px 14px; letter-spacing:1px; margin-bottom:14px; }
  .title { font-size:26px; font-weight:900; color:white; line-height:1.2; margin-bottom:10px; }
  .subtitle { font-size:13px; color:#a0b4ff; line-height:1.5; max-width:340px; margin:0 auto; }
  .divider { height:1px; background:rgba(255,255,255,0.1); margin:0 28px; }
  .features { padding:20px 28px; }
  .features-title { font-size:11px; color:#4361ee; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px; }
  .feature { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
  .dot { width:8px; height:8px; background:#4361ee; border-radius:50%; flex-shrink:0; margin-top:4px; }
  .feature-text { font-size:12.5px; color:#c8d6f0; line-height:1.4; }
  .cta-section { background:rgba(255,255,255,0.05); margin:0 20px 20px; border-radius:12px; padding:20px; display:flex; gap:16px; align-items:center; }
  .qr-wrap { flex-shrink:0; background:white; border-radius:10px; padding:6px; }
  .qr-wrap img { width:90px; height:90px; display:block; }
  .cta-text h3 { font-size:14px; font-weight:700; color:white; margin-bottom:4px; }
  .cta-text p { font-size:11px; color:#a0b4ff; line-height:1.4; word-break:break-all; }
  ${wa ? `.wa { background:#25D366; color:white; border-radius:8px; padding:6px 12px; font-size:11px; font-weight:700; display:inline-block; margin-top:8px; text-decoration:none; }` : ""}
  .footer { text-align:center; padding:12px; font-size:10px; color:rgba(255,255,255,0.3); letter-spacing:1px; }
  @media print { body { background:white; padding:0; } .flyer { box-shadow:none; width:100%; border-radius:0; } }
</style>
</head>
<body>
<div class="flyer">
  <div class="top-bar">Powered by Gustafta AI · Platform Chatbot Konstruksi Indonesia</div>
  <div class="hero">
    <div class="badge">✦ Asisten AI Konstruksi</div>
    <div class="title">${agent.name || "AI Chatbot"}</div>
    <div class="subtitle">${(agent.description || agent.tagline || "Asisten AI cerdas untuk industri konstruksi Indonesia.").substring(0, 120)}</div>
  </div>
  <div class="divider"></div>
  ${points.length > 0 ? `<div class="features">
    <div class="features-title">Keunggulan Utama</div>
    ${points.map(p => `<div class="feature"><div class="dot"></div><div class="feature-text">${p}</div></div>`).join("")}
  </div>
  <div class="divider"></div>` : ""}
  <div class="cta-section">
    <div class="qr-wrap"><img src="${qrSrc}" alt="QR Code" /></div>
    <div class="cta-text">
      <h3>Scan untuk Mulai Chat</h3>
      <p>${chatUrl}</p>
      ${wa ? `<a href="https://wa.me/${wa.replace(/\D/g, '')}" class="wa">📱 WhatsApp</a>` : ""}
    </div>
  </div>
  <div class="footer">GUSTAFTA.AI · CHATBOT AI KONSTRUKSI INDONESIA</div>
</div>
<script>window.onload = function() { document.title = "Flyer — ${agent.name}"; }</script>
</body>
</html>`;

  const openFlyer = () => {
    const blob = new Blob([flyerHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast({ title: "Flyer terbuka!", description: "Gunakan Ctrl+P / Cmd+P untuk cetak atau simpan PDF" });
  };

  const downloadFlyer = () => {
    const blob = new Blob([flyerHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flyer-${(agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Flyer diunduh!" });
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Digital Flyer / Poster</span>
          <Badge variant="secondary" className="text-xs ml-auto">Instan</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Poster promosi digital berisi nama, keunggulan, dan QR code chatbot — siap cetak / bagikan.</p>

        {/* Mini preview */}
        <div className="rounded-lg overflow-hidden border" style={{ background: "linear-gradient(135deg,#1a1a2e,#0f3460)", padding: "12px" }}>
          <div className="text-center space-y-1.5">
            <div className="text-xs font-bold text-blue-400 tracking-widest uppercase">✦ Asisten AI Konstruksi</div>
            <div className="text-white font-black text-sm leading-tight">{agent.name || "AI Chatbot"}</div>
            <div className="text-blue-200 text-xs leading-relaxed line-clamp-2">{(agent.description || agent.tagline || "").substring(0, 80)}</div>
          </div>
          {points.slice(0, 2).length > 0 && (
            <div className="mt-3 space-y-1">
              {points.slice(0, 2).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-blue-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="line-clamp-1">{p}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-white rounded p-1 flex-shrink-0">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(chatUrl)}&margin=2`} className="w-10 h-10 block" alt="QR" />
            </div>
            <div className="text-xs text-blue-200 break-all line-clamp-2">{chatUrl}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={openFlyer} data-testid="button-open-flyer">
            <Printer className="w-3 h-3 mr-1.5" /> Buka & Cetak
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={downloadFlyer} data-testid="button-download-flyer">
            <Download className="w-3 h-3 mr-1.5" /> Unduh .html
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Tekan Ctrl+P / Cmd+P di tab baru untuk cetak atau simpan sebagai PDF</p>
      </CardContent>
    </Card>
  );
}

// ─── Social Preview Card Tool ─────────────────────────────────────────
function SocialPreviewTool({ agent }: { agent: any }) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<"whatsapp" | "linkedin">("whatsapp");
  const chatUrl = `${window.location.origin}/bot/${agent.id}`;
  const productUrl = `${window.location.origin}/product/${agent.id}`;
  const [selectedLink, setSelectedLink] = useState("chatbot");
  const linkMap: Record<string, string> = {
    chatbot: chatUrl,
    product: productUrl,
    ecourse: `${window.location.origin}/product/${agent.id}/ecourse`,
    ebook: `${window.location.origin}/product/${agent.id}/ebook`,
  };
  const activeLink = linkMap[selectedLink];
  const domain = window.location.hostname;
  const initials = (agent.name || "AI").substring(0, 2).toUpperCase();

  const copyLink = () => {
    navigator.clipboard.writeText(activeLink);
    toast({ title: "Link disalin!", description: activeLink });
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Social Share Preview</span>
          <Badge variant="secondary" className="text-xs ml-auto">Preview</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Preview tampilan link saat dibagikan di WhatsApp atau LinkedIn.</p>

        <div className="flex gap-2">
          <Button
            size="sm" variant={platform === "whatsapp" ? "default" : "outline"}
            className="flex-1 h-8 text-xs gap-1" onClick={() => setPlatform("whatsapp")}
            data-testid="button-preview-wa"
          >
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </Button>
          <Button
            size="sm" variant={platform === "linkedin" ? "default" : "outline"}
            className="flex-1 h-8 text-xs gap-1" onClick={() => setPlatform("linkedin")}
            data-testid="button-preview-linkedin"
          >
            <Linkedin className="w-3 h-3" /> LinkedIn
          </Button>
        </div>

        <Select value={selectedLink} onValueChange={setSelectedLink}>
          <SelectTrigger className="h-8 text-xs" data-testid="select-preview-link">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chatbot" className="text-xs">Link Chatbot</SelectItem>
            <SelectItem value="product" className="text-xs">Landing Chatbot</SelectItem>
            <SelectItem value="ecourse" className="text-xs">Landing eCourse</SelectItem>
            <SelectItem value="ebook" className="text-xs">Landing Panduan Digital</SelectItem>
          </SelectContent>
        </Select>

        {/* WhatsApp Preview */}
        {platform === "whatsapp" && (
          <div className="rounded-xl overflow-hidden border" style={{ background: "#111b21" }}>
            <div className="px-3 py-2" style={{ background: "#202c33" }}>
              <div className="text-xs text-green-400 font-semibold mb-0.5">WhatsApp</div>
            </div>
            <div className="p-3">
              <div className="rounded-lg overflow-hidden border border-white/10 max-w-xs" style={{ background: "#1f2c34" }}>
                <div className="h-24 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1a2e,#4361ee)" }}>
                  <div className="text-white font-black text-2xl opacity-80">{initials}</div>
                </div>
                <div className="p-3 border-l-4 border-green-500">
                  <div className="text-white font-semibold text-sm leading-tight">{agent.name}</div>
                  <div className="text-gray-400 text-xs mt-1 line-clamp-2">{agent.description?.substring(0, 80) || agent.tagline || "Asisten AI Konstruksi Indonesia"}</div>
                  <div className="text-gray-500 text-xs mt-1.5">{domain}</div>
                </div>
              </div>
              <div className="text-gray-500 text-xs mt-1.5 pl-1">{activeLink.substring(0, 45)}…</div>
            </div>
          </div>
        )}

        {/* LinkedIn Preview */}
        {platform === "linkedin" && (
          <div className="rounded-xl overflow-hidden border bg-white dark:bg-gray-900 shadow-sm">
            <div className="h-20 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1a2e,#4361ee)" }}>
              <div className="text-white font-black text-3xl opacity-80">{initials}</div>
            </div>
            <div className="p-3 border border-t-0 rounded-b-xl border-border">
              <div className="font-semibold text-sm text-foreground leading-tight">{agent.name}</div>
              <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{agent.description?.substring(0, 100) || "Asisten AI Konstruksi Indonesia"}</div>
              <div className="text-muted-foreground text-xs mt-1.5 uppercase tracking-wide">{domain}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={copyLink} data-testid="button-copy-share-link">
            <Copy className="w-3 h-3 mr-1.5" /> Salin Link
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs px-3" asChild>
            <a href={activeLink} target="_blank" rel="noopener noreferrer" data-testid="button-open-share-link">
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Preview ini menunjukkan bagaimana link akan tampil saat dibagikan</p>
      </CardContent>
    </Card>
  );
}

// ─── ROI Calculator ───────────────────────────────────────────────────
function RoiCalculatorTool({ agent }: { agent: any }) {
  const { toast } = useToast();
  const [staff, setStaff] = useState(3);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [ratePerHour, setRatePerHour] = useState(50000);
  const [copied, setCopied] = useState(false);

  const monthlyCostManual = staff * hoursPerDay * 22 * ratePerHour;
  const chatbotCost = (agent.monthlyPrice || 299000);
  const moneySaved = monthlyCostManual - chatbotCost;
  const roiPercent = chatbotCost > 0 ? Math.round((moneySaved / chatbotCost) * 100) : 0;
  const paybackDays = moneySaved > 0 ? Math.round(chatbotCost / (moneySaved / 30)) : 0;

  const resultText = `ROI Kalkulator — ${agent.name}
==============================
Asumsi Input:
- Staf yang ditangani chatbot: ${staff} orang
- Waktu per hari: ${hoursPerDay} jam
- Rate per jam: Rp ${ratePerHour.toLocaleString("id-ID")}
- Hari kerja per bulan: 22 hari

Hasil Kalkulasi:
- Biaya manual/bulan: Rp ${monthlyCostManual.toLocaleString("id-ID")}
- Biaya chatbot/bulan: Rp ${chatbotCost.toLocaleString("id-ID")}
- Penghematan/bulan: Rp ${moneySaved.toLocaleString("id-ID")}
- ROI: ${roiPercent}%
- Payback period: ${paybackDays} hari

Gunakan kalkulator ini sebagai bahan presentasi ke klien/manajemen.
Generated by Gustafta AI`;

  const copy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Hasil disalin!", description: "Gunakan sebagai bahan proposal ke klien" });
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">ROI Calculator</span>
          <Badge variant="secondary" className="text-xs ml-auto">Sales Tool</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Hitung penghematan biaya vs proses manual — untuk presentasi ke klien & manajemen.</p>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs mb-1 block">Staf yang ditangani chatbot</Label>
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={20} value={staff} onChange={e => setStaff(Number(e.target.value))} className="flex-1 h-1.5 accent-primary" />
              <span className="text-xs font-bold w-8 text-right">{staff}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Jam layanan per hari</Label>
            <div className="flex items-center gap-2">
              <input type="range" min={0.5} max={8} step={0.5} value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))} className="flex-1 h-1.5 accent-primary" />
              <span className="text-xs font-bold w-10 text-right">{hoursPerDay}j</span>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Rate tenaga per jam</Label>
            <div className="flex items-center gap-2">
              <input type="range" min={25000} max={200000} step={5000} value={ratePerHour} onChange={e => setRatePerHour(Number(e.target.value))} className="flex-1 h-1.5 accent-primary" />
              <span className="text-xs font-bold w-24 text-right">Rp {(ratePerHour/1000).toFixed(0)}rb/j</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Biaya Manual/Bln</div>
            <div className="font-bold text-sm text-red-600">Rp {monthlyCostManual.toLocaleString("id-ID")}</div>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Biaya Chatbot/Bln</div>
            <div className="font-bold text-sm text-green-600">Rp {chatbotCost.toLocaleString("id-ID")}</div>
          </div>
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Penghematan per Bulan</div>
            <div className="font-black text-lg text-primary">Rp {Math.max(moneySaved, 0).toLocaleString("id-ID")}</div>
            <div className="text-xs text-muted-foreground">ROI {roiPercent}% · Balik modal dalam {paybackDays} hari</div>
          </div>
        </div>

        <Button size="sm" className="w-full h-8 text-xs" onClick={copy} data-testid="button-copy-roi">
          {copied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
          {copied ? "Tersalin!" : "Salin Hasil untuk Proposal"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Marketing Brief helpers (unchanged) ──────────────────────────────
function buildMarketingBrief(agent: any): string {
  const lines: string[] = [];
  lines.push(`# Marketing Brief: ${agent.name || "(Tanpa Nama)"}`);
  lines.push(""); lines.push("---"); lines.push("");
  lines.push("## 1. PROFIL PRODUK"); lines.push("");
  if (agent.name) lines.push(`- **Nama Produk:** ${agent.name}`);
  if (agent.tagline) lines.push(`- **Tagline:** ${agent.tagline}`);
  if (agent.description) lines.push(`- **Deskripsi:** ${agent.description}`);
  if (agent.productSummary) lines.push(`- **Ringkasan Produk:** ${agent.productSummary}`);
  if (agent.category) lines.push(`- **Kategori:** ${agent.category}`);
  lines.push(`- **Link Chat:** ${window.location.origin}/bot/${agent.id}`);
  lines.push("");
  lines.push("## 2. USP (Unique Selling Proposition)"); lines.push("");
  if (agent.philosophy) lines.push(`**Filosofi:** ${agent.philosophy}`);
  lines.push("");
  const expertise = agent.expertise || [];
  if (expertise.length > 0) {
    lines.push("**Keunggulan/Keahlian:**");
    expertise.forEach((e: string) => lines.push(`- ${e}`));
    lines.push("");
  }
  const features = agent.productFeatures || [];
  if (features.length > 0) {
    lines.push("**Fitur Utama:**");
    features.forEach((f: string) => lines.push(`- ${f}`));
    lines.push("");
  }
  const keyPhrases = agent.keyPhrases || [];
  if (keyPhrases.length > 0) {
    lines.push("## 3. KEY MESSAGES / KATA KUNCI"); lines.push("");
    keyPhrases.forEach((p: string) => lines.push(`- ${p}`));
    lines.push("");
  }
  lines.push("## 4. BRAND VOICE"); lines.push("");
  if (agent.personality) lines.push(`- **Personality:** ${agent.personality}`);
  if (agent.communicationStyle) lines.push(`- **Gaya Komunikasi:** ${agent.communicationStyle}`);
  if (agent.toneOfVoice) lines.push(`- **Tone of Voice:** ${agent.toneOfVoice}`);
  if (agent.language) lines.push(`- **Bahasa:** ${agent.language === "id" ? "Indonesia" : agent.language === "en" ? "English" : agent.language}`);
  lines.push("");
  const starters = agent.conversationStarters || [];
  if (starters.length > 0 || agent.greetingMessage) {
    lines.push("## 5. CONTOH INTERAKSI"); lines.push("");
    if (agent.greetingMessage) {
      lines.push("**Sapaan Pembuka:**");
      lines.push(`> ${agent.greetingMessage}`);
      lines.push("");
    }
    if (starters.length > 0) {
      lines.push("**Topik Percakapan yang Bisa Dimulai:**");
      starters.forEach((s: string) => lines.push(`- "${s}"`));
      lines.push("");
    }
  }
  if (agent.monthlyPrice || agent.trialEnabled) {
    lines.push("## 6. PRICING & PENAWARAN"); lines.push("");
    if (agent.monthlyPrice) lines.push(`- **Harga Bulanan:** Rp ${agent.monthlyPrice.toLocaleString("id-ID")}`);
    if (agent.trialEnabled) lines.push(`- **Masa Trial:** ${agent.trialDays || 7} hari gratis`);
    if (agent.guestMessageLimit) lines.push(`- **Akses Tamu:** ${agent.guestMessageLimit} pesan gratis`);
    lines.push("");
  }
  const conversionOffers = agent.conversionOffers || [];
  if (conversionOffers.length > 0) {
    lines.push("## 7. PAKET PENAWARAN"); lines.push("");
    conversionOffers.forEach((offer: any, i: number) => {
      lines.push(`### Paket ${i + 1}: ${offer.title || "(Tanpa Judul)"}`);
      if (offer.description) lines.push(offer.description);
      if (offer.price) lines.push(`**Harga:** ${offer.price}`);
      if (offer.features && offer.features.length > 0) offer.features.forEach((f: string) => lines.push(`- ${f}`));
      lines.push("");
    });
  }
  if (agent.whatsappCta || agent.calendlyUrl) {
    lines.push("## 8. CHANNEL KONTAK"); lines.push("");
    if (agent.whatsappCta) lines.push(`- **WhatsApp:** ${agent.whatsappCta}`);
    if (agent.calendlyUrl) lines.push(`- **Calendly:** ${agent.calendlyUrl}`);
    lines.push("");
  }
  const landingPainPoints = agent.landingPainPoints || [];
  const landingBenefits = agent.landingBenefits || [];
  const landingTestimonials = agent.landingTestimonials || [];
  const landingFaq = agent.landingFaq || [];
  if (landingPainPoints.length > 0) {
    lines.push("## 9. PAIN POINTS TARGET MARKET"); lines.push("");
    landingPainPoints.forEach((p: string) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (landingBenefits.length > 0) {
    lines.push("## 10. MANFAAT / BENEFITS"); lines.push("");
    landingBenefits.forEach((b: string) => lines.push(`- ${b}`));
    lines.push("");
  }
  if (landingTestimonials.length > 0) {
    lines.push("## 11. TESTIMONI"); lines.push("");
    landingTestimonials.forEach((t: any) => {
      lines.push(`> "${t.quote}"`);
      lines.push(`> — **${t.name}**${t.role ? `, ${t.role}` : ""}${t.company ? `, ${t.company}` : ""}`);
      lines.push("");
    });
  }
  if (landingFaq.length > 0) {
    lines.push("## 12. FAQ"); lines.push("");
    landingFaq.forEach((f: any) => {
      lines.push(`**Q: ${f.question}**`);
      lines.push(`A: ${f.answer}`);
      lines.push("");
    });
  }
  lines.push("---");
  lines.push(`*Brief ini di-generate otomatis oleh Gustafta AI dari data chatbot "${agent.name || ""}"*`);
  lines.push(`*Gunakan sebagai panduan untuk membuat ad copy, konten sosial media, dan materi promosi di platform lain.*`);
  return lines.join("\n");
}

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inList = false;
  const closePendingList = () => { if (inList) { result.push("</ul>"); inList = false; } };
  const fmt = (t: string) => escHtml(t).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
  for (const line of lines) {
    if (line.startsWith("- ")) {
      if (!inList) { result.push("<ul>"); inList = true; }
      result.push(`<li>${fmt(line.slice(2))}</li>`);
      continue;
    }
    closePendingList();
    if (line.startsWith("# ")) { result.push(`<h1>${fmt(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("## ")) { result.push(`<h2>${fmt(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("### ")) { result.push(`<h3>${fmt(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("> ")) { result.push(`<blockquote>${fmt(line.slice(2))}</blockquote>`); continue; }
    if (line === "---") { result.push("<hr>"); continue; }
    if (line === "") continue;
    result.push(`<p>${fmt(line)}</p>`);
  }
  closePendingList();
  return result.join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function MarketingPanel({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [marketingKitUrl, setMarketingKitUrl] = useState(agent.marketingKitUrl || "");
  const [metaPixelId, setMetaPixelId] = useState(agent.metaPixelId || "");

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/agents/${agent.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Tersimpan", description: "Pengaturan berhasil disimpan" });
    },
  });

  const brief = buildMarketingBrief(agent);
  const sectionCount = (brief.match(/^## /gm) || []).length;
  const slug = (agent.name || "chatbot").replace(/\s+/g, "-").toLowerCase();

  const copyAll = () => {
    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin!", description: "Brief marketing berhasil disalin ke clipboard" });
  };
  const downloadMarkdown = () => {
    downloadFile(brief, `brief-marketing-${slug}.md`, "text/markdown");
    toast({ title: "Berhasil", description: "File Markdown berhasil diunduh" });
  };
  const downloadHtml = () => {
    const body = mdToHtml(brief);
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Marketing Brief - ${agent.name || "Chatbot"}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#333}h1{color:#1a1a2e;border-bottom:3px solid #4361ee;padding-bottom:.5rem}h2{color:#3a0ca3;margin-top:2rem}h3{color:#4361ee}blockquote{border-left:4px solid #4361ee;margin:1rem 0;padding:.5rem 1rem;background:#f8f9fa;font-style:italic}ul{margin:.5rem 0;padding-left:1.5rem}li{margin:.3rem 0}hr{border:none;border-top:2px solid #eee;margin:2rem 0}strong{color:#1a1a2e}</style></head><body>${body}</body></html>`;
    downloadFile(html, `brief-marketing-${slug}.html`, "text/html");
    toast({ title: "Berhasil", description: "File HTML berhasil diunduh" });
  };

  return (
    <div className="space-y-0 max-h-[calc(100vh-80px)] overflow-y-auto">
      {/* Hero */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground" data-testid="text-marketing-title">
                Marketing Suite
              </h2>
              <p className="text-sm text-muted-foreground">
                25 story · 27 AI tools · WA & Email Builder · 5 alat instan untuk <span className="font-medium text-foreground">{agent.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" /> Powered by GPT-4o
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ai-tools" className="w-full">
        <div className="px-4 md:px-6 pt-3 border-b sticky top-0 bg-background z-10">
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
            <TabsList className="h-9 min-w-max w-full flex">
              <TabsTrigger value="ai-tools" className="text-xs gap-1 flex-shrink-0" data-testid="tab-ai-tools">
                <Sparkles className="w-3 h-3" /> AI Tools
              </TabsTrigger>
              <TabsTrigger value="storytelling" className="text-xs gap-1 flex-shrink-0" data-testid="tab-storytelling">
                <Mic className="w-3 h-3" /> Story
              </TabsTrigger>
              <TabsTrigger value="platforms" className="text-xs gap-1 flex-shrink-0" data-testid="tab-platforms">
                <Globe className="w-3 h-3" /> Platform
              </TabsTrigger>
              <TabsTrigger value="wa-email" className="text-xs gap-1 flex-shrink-0" data-testid="tab-wa-email">
                <MessageSquare className="w-3 h-3" /> WA & Email
              </TabsTrigger>
              <TabsTrigger value="instant" className="text-xs gap-1 flex-shrink-0" data-testid="tab-instant">
                <Zap className="w-3 h-3" /> Instan
              </TabsTrigger>
              <TabsTrigger value="brief" className="text-xs gap-1 flex-shrink-0" data-testid="tab-brief">
                <FileText className="w-3 h-3" /> Brief
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs gap-1 flex-shrink-0" data-testid="tab-settings">
                <Eye className="w-3 h-3" /> Setting
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* ── AI TOOLS TAB ── */}
        <TabsContent value="ai-tools" className="m-0 px-4 md:px-6 py-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            Klik <strong>Generate AI</strong> pada tools yang Anda butuhkan. Konten dibuat khusus berdasarkan data chatbot <strong>{agent.name}</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AI_TOOLS.map((tool) => (
              <AiToolCard key={tool.id} tool={tool} agent={agent} />
            ))}
          </div>
        </TabsContent>

        {/* ── STORYTELLING TAB ── */}
        <TabsContent value="storytelling" className="m-0 px-4 md:px-6 py-5">
          <StorytellingTab agent={agent} />
        </TabsContent>

        {/* ── PLATFORMS TAB ── */}
        <TabsContent value="platforms" className="m-0 px-4 md:px-6 py-5">
          <PlatformToolsTab agent={agent} />
        </TabsContent>

        {/* ── WA & EMAIL TAB ── */}
        <TabsContent value="wa-email" className="m-0 px-4 md:px-6 py-5">
          <WaEmailTab agent={agent} />
        </TabsContent>

        {/* ── ALAT INSTAN TAB ── */}
        <TabsContent value="instant" className="m-0 px-4 md:px-6 py-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            5 alat marketing yang bekerja <strong>instan tanpa AI</strong> — QR code, tanda tangan email, flyer, social preview, dan kalkulator ROI untuk presentasi ke klien.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QrCodeTool agent={agent} />
            <EmailSignatureTool agent={agent} />
            <FlyerTool agent={agent} />
            <SocialPreviewTool agent={agent} />
            <div className="md:col-span-2">
              <RoiCalculatorTool agent={agent} />
            </div>
          </div>
        </TabsContent>

        {/* ── BRIEF TAB ── */}
        <TabsContent value="brief" className="m-0 px-4 md:px-6 py-5 space-y-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">
                Ringkasan lengkap data chatbot untuk panduan copywriting & promosi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyAll} data-testid="button-copy-all-marketing">
                {copied ? <Check className="w-4 h-4 mr-1.5" /> : <ClipboardCopy className="w-4 h-4 mr-1.5" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadMarkdown} data-testid="button-download-md-marketing">
                <Download className="w-4 h-4 mr-1.5" /> .md
              </Button>
              <Button variant="outline" size="sm" onClick={downloadHtml} data-testid="button-download-html-marketing">
                <Download className="w-4 h-4 mr-1.5" /> .html
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Preview Brief</span>
                </div>
                <Badge variant="secondary">{sectionCount} bagian</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Brief ini otomatis diambil dari konfigurasi chatbot. Edit data di panel lain untuk memperbarui.
              </p>
              <div className="bg-muted/50 rounded-md p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed" data-testid="text-brief-preview">
                  {brief}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Cara Pakai</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Download brief (.md / .html) atau gunakan AI Tools di tab pertama</p>
                <p>2. Gunakan untuk: Meta Ads, Google Ads, email marketing, proposal klien</p>
                <p>3. Simpan URL materi marketing di tab Pengaturan</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="m-0 px-4 md:px-6 py-5 space-y-5">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">Link Marketing Kit Eksternal</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Jika Anda sudah membuat materi marketing di platform lain (Google Drive, Canva, Notion, dll), masukkan URL-nya di sini
              </p>
              <div className="flex gap-2">
                <Input
                  value={marketingKitUrl}
                  onChange={(e) => setMarketingKitUrl(e.target.value)}
                  placeholder="https://drive.google.com/... atau https://canva.com/..."
                  data-testid="input-marketing-kit-url"
                />
                {marketingKitUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={marketingKitUrl} target="_blank" rel="noopener noreferrer" data-testid="button-open-marketing-url">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">Meta Pixel ID</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan Meta Pixel ID untuk tracking konversi di halaman chat publik
              </p>
              <div className="flex gap-2">
                <Input
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="Contoh: 123456789012345"
                  data-testid="input-meta-pixel-id"
                />
                <Button
                  onClick={() => updateMutation.mutate({ marketingKitUrl: marketingKitUrl.trim(), metaPixelId: metaPixelId.trim() })}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-marketing-settings"
                >
                  {updateMutation.isPending ? "..." : "Simpan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
