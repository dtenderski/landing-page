import { useState, useRef, useEffect } from "react";
import { trackLead } from "@/lib/meta-pixel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Bot, Smartphone, ShoppingCart, CheckCircle2,
  ArrowRight, Star, Users, ChevronRight, Send, Lock, Sparkles,
  AlertTriangle, Clock, XCircle, TrendingUp, Zap, Shield, MousePointerClick,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

const CATEGORY_LABELS: Record<string, string> = {
  engineering: "Teknik & Engineering",
  certification: "Sertifikasi & Kompetensi",
  compliance: "Kepatuhan & Regulasi",
  legal: "Hukum",
  property: "Properti",
  digitalization: "Digitalisasi",
  finance: "Keuangan",
  business: "Bisnis",
  construction: "Konstruksi",
  tender: "Pengadaan & Tender",
  operasional: "Operasional",
  services: "Layanan",
};

interface AgentProduct {
  id: string | number;
  productId?: number;
  name: string;
  category: string;
  tagline: string;
  description: string;
  productSummary: string;
  productFeatures: string[];
  emoji: string;
  color: string;
  isGustafta?: boolean;
  price: number;
  originalPrice?: number | null;
  agentId?: number | null;
  agentCount?: number;
  type?: string;
}

interface FeaturedResponse {
  gustafta: AgentProduct[];
  mitra: AgentProduct[];
}

interface BuyFormData { name: string; email: string; phone: string; }

interface DemoMessage { role: "user" | "assistant"; content: string; }

const DEMO_MAX = 3;

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

function getChatbotTier(n: number = 2): { label: string; className: string } {
  if (n >= 11) return { label: "Enterprise",   className: "bg-purple-100 text-purple-700 border-purple-200" };
  if (n >= 6)  return { label: "Advanced",     className: "bg-blue-100 text-blue-700 border-blue-200" };
  if (n >= 4)  return { label: "Profesional",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  return       { label: "Basic",               className: "bg-gray-100 text-gray-600 border-gray-200" };
}

function DemoModal({
  agent,
  open,
  onClose,
  onBuy,
}: {
  agent: AgentProduct | null;
  open: boolean;
  onClose: () => void;
  onBuy: (a: AgentProduct) => void;
}) {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [sessionId] = useState(() => `demo_store_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && agent) {
      setMessages([{
        role: "assistant",
        content: `Halo! Saya **${agent.name}**. Coba tanyakan sesuatu — misalnya topik yang relevan dengan keahlian saya. (Demo gratis: ${DEMO_MAX} pertanyaan)`,
      }]);
      setInput("");
      setUserCount(0);
      setLoading(false);
    }
  }, [open, agent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!agent?.agentId || !input.trim() || loading || userCount >= DEMO_MAX) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    setUserCount(c => c + 1);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: String(agent.agentId),
          sessionId,
          role: "user",
          content: userMsg,
        }),
      });
      if (!res.ok) throw new Error("Gagal menghubungi AI");
      const data = await res.json();
      const reply: string = data.aiMessage?.content ?? "Maaf, tidak ada respons.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi gangguan. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  const demoUsed = userCount >= DEMO_MAX;

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${agent.color}18, ${agent.color}08)`, borderBottom: "1px solid #e5e7eb" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40` }}
          >
            {agent.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-bold text-gray-900 truncate">{agent.name}</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 truncate">{agent.tagline || "Demo gratis — coba sebelum beli"}</DialogDescription>
          </div>
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] shrink-0">
            DEMO
          </Badge>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50" style={{ minHeight: 240, maxHeight: 380 }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5"
                  style={{ background: `${agent.color}20` }}
                >
                  {agent.emoji}
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-violet-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
                }`}
              >
                {m.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5"
                style={{ background: `${agent.color}20` }}>
                {agent.emoji}
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Demo limit banner */}
        {demoUsed && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">Demo selesai ({DEMO_MAX}/{DEMO_MAX} pertanyaan)</p>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Suka dengan kemampuan AI ini? Dapatkan akses penuh — tanya tanpa batas, integrasi WhatsApp, dan lebih banyak fitur.
            </p>
            <Button
              onClick={() => { onClose(); onBuy(agent); }}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-10 font-semibold text-sm gap-2"
              data-testid="button-demo-buy-cta"
            >
              <ShoppingCart className="h-4 w-4" />Beli Akses Penuh — {formatPrice(agent.price)}
            </Button>
          </div>
        )}

        {/* Input area */}
        {!demoUsed && (
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-gray-400">
                Demo gratis — {DEMO_MAX - userCount} pertanyaan tersisa
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ketik pertanyaan Anda..."
                disabled={loading || demoUsed}
                className="flex-1 text-sm h-10"
                data-testid="input-demo-message"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim() || demoUsed}
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white h-10 px-3"
                data-testid="button-demo-send"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-[10px] text-gray-400">Tekan Enter untuk kirim</span>
              <button
                onClick={() => { onClose(); onBuy(agent); }}
                className="text-[10px] text-violet-600 hover:text-violet-800 font-medium underline underline-offset-2"
                data-testid="button-demo-buy-inline"
              >
                Beli sekarang →
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FeaturedCard({
  agent,
  onBuy,
  onDemo,
}: {
  agent: AgentProduct;
  onBuy: (a: AgentProduct) => void;
  onDemo: (a: AgentProduct) => void;
}) {
  const tier = getChatbotTier(agent.agentCount);
  const catLabel = CATEGORY_LABELS[agent.category] || agent.category;
  const detailUrl = agent.agentId ? `/product/${agent.agentId}` : null;
  return (
    <Link href={detailUrl ?? "#"}>
      <Card
        className="bg-white border-gray-200 hover:border-violet-400 hover:shadow-md transition-all group flex flex-col cursor-pointer h-full"
        data-testid={`card-featured-${agent.id}`}
      >
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
            >
              {agent.emoji}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary" className="text-xs px-2 py-0">{catLabel}</Badge>
              <Badge className={`text-xs px-2 py-0 border ${tier.className}`}>{tier.label}</Badge>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 group-hover:text-violet-700 transition-colors line-clamp-2">
            {agent.name}
          </h3>
          {agent.tagline && (
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-2">{agent.tagline}</p>
          )}

          {(agent.productFeatures ?? []).length > 0 && (
            <div className="space-y-1 mb-3 flex-1">
              {(agent.productFeatures ?? []).slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-violet-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 line-clamp-1">{f}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                {agent.originalPrice && agent.originalPrice > agent.price && (
                  <span className="text-xs text-gray-400 line-through leading-none mb-0.5">{formatPrice(agent.originalPrice)}</span>
                )}
                <span className="font-bold text-gray-900">{formatPrice(agent.price)}</span>
              </div>
              <Button
                size="sm"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuy(agent); }}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 px-3"
                data-testid={`button-buy-featured-${agent.id}`}
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Beli
              </Button>
            </div>
            {agent.agentId && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDemo(agent); }}
                className="w-full text-xs h-7 border-violet-200 text-violet-600 hover:bg-violet-50 hover:text-violet-700 gap-1.5"
                data-testid={`button-demo-featured-${agent.id}`}
              >
                <Sparkles className="h-3 w-3" />Coba Demo Gratis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function GroupEmptyState({ isGustafta }: { isGustafta: boolean }) {
  return (
    <div className="col-span-full py-10 text-center text-gray-400">
      <Bot className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm text-gray-500">
        {isGustafta ? "Produk Gustafta akan segera hadir." : "Produk mitra akan segera hadir."}
      </p>
      <a
        href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs hover:bg-violet-700 transition-colors"
      >
        <Smartphone className="h-3.5 w-3.5" />Hubungi via WhatsApp
      </a>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export default function StoreFeatured() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<AgentProduct | null>(null);
  const [buyForm, setBuyForm] = useState<BuyFormData>({ name: "", email: "", phone: "" });
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [demoAgent, setDemoAgent] = useState<AgentProduct | null>(null);
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  const { data: featured, isLoading } = useQuery<FeaturedResponse>({
    queryKey: ["/api/store/featured"],
    queryFn: async () => {
      const res = await fetch("/api/store/featured");
      return res.json();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { agentId?: number | null; productId?: number } & BuyFormData) =>
      apiRequest("POST", "/api/store/order", data),
    onSuccess: async (res: Response) => {
      const data = await res.json();
      setShowBuyDialog(false);
      toast({ title: "Pesanan dibuat!", description: "Tim kami akan menghubungi Anda untuk konfirmasi pembayaran via Scalev." });
      if (data.waUrl) window.open(data.waUrl, "_blank");
    },
    onError: (err: Error) => {
      toast({ title: "Gagal membuat pesanan", description: err.message, variant: "destructive" });
    },
  });

  const handleBuy = (agent: AgentProduct) => {
    setSelectedAgent(agent);
    setBuyForm({ name: "", email: "", phone: "" });
    setShowBuyDialog(true);
  };

  const handleDemo = (agent: AgentProduct) => {
    setDemoAgent(agent);
    setShowDemoDialog(true);
  };

  const handleSubmitOrder = () => {
    if (!selectedAgent) return;
    if (!buyForm.name.trim()) {
      toast({ title: "Lengkapi data", description: "Nama lengkap wajib diisi.", variant: "destructive" });
      return;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email.trim());
    if (!buyForm.email.trim() || !emailValid) {
      toast({ title: "Format email salah", description: "Contoh: nama@gmail.com", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({
      agentId: selectedAgent.agentId ?? undefined,
      productId: selectedAgent.productId,
      ...buyForm,
    });
  };

  const gustafta = featured?.gustafta ?? [];
  const mitra = featured?.mitra ?? [];

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ── */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-gray-900">Gustafta</span>
              <span className="ml-2 text-xs text-violet-600 font-medium">STORE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/6281287941900"
              onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              data-testid="link-wa-header"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">081287941900</span>
            </a>
            <Link href="/store/katalog">
              <Button variant="outline" size="sm" className="text-xs h-8" data-testid="link-katalog-header">
                Katalog Lengkap <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. HERO (ATTENTION) ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-violet-950 to-indigo-950 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 60%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <Badge className="mb-5 bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
            🏪 Gustafta Store — AI Spesialis Siap Pakai
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
            AI Spesialis Domain Anda —<br />
            <span className="text-violet-400">Aktif Dalam 5 Menit</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-base sm:text-lg leading-relaxed">
            Ratusan AI terlatih untuk konstruksi, hukum, keuangan, HR, dan properti —
            bukan AI generik. Pilih, bayar lisensi, langsung aktif. Tanpa satu baris kode pun.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <Link href="/store/katalog">
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 h-12 text-base gap-2"
                data-testid="button-hero-lihat-ai"
              >
                <ShoppingCart className="h-5 w-5" /> Lihat Semua AI Solutions
              </Button>
            </Link>
            <a
              href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20rekomendasi%20AI%20yang%20tepat%20untuk%20kebutuhan%20saya"
              onClick={() => trackLead({ content_name: "WhatsApp Hero CTA" })}
              target="_blank" rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12 text-base gap-2"
                data-testid="button-hero-konsultasi"
              >
                <Smartphone className="h-5 w-5" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          {/* Trust chips */}
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-400">
            {[
              { dot: "bg-violet-400", text: "0 konfigurasi teknis" },
              { dot: "bg-emerald-400", text: "Demo gratis sebelum beli" },
              { dot: "bg-blue-400",   text: "Dikurasi & diuji tim Gustafta" },
              { dot: "bg-amber-400",  text: "Aktif 24/7" },
            ].map(({ dot, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dot} inline-block shrink-0`} />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM (PAS) ── */}
      <section className="py-16 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2 block">Masalah yang Dirasakan</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Mengurus pekerjaan teknis sendiri itu melelahkan
            </h2>
            <p className="text-gray-500 mt-3 text-sm max-w-xl mx-auto">
              Bukan karena Anda tidak kompeten — tapi karena volumenya tidak manusiawi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Clock,
                color: "text-orange-500 bg-orange-50 border-orange-200",
                title: "Waktu habis untuk hal administratif",
                body: "Mengisi dokumen, menelusuri regulasi, menyusun laporan — semua manual, semua menyita jam kerja produktif.",
              },
              {
                icon: XCircle,
                color: "text-red-500 bg-red-50 border-red-200",
                title: "AI umum tidak paham konteks Indonesia",
                body: "ChatGPT tidak tahu Perpres 16/2018, SKK BNSP, atau format CSMS Pertamina. Jawaban generik = risiko di lapangan.",
              },
              {
                icon: AlertTriangle,
                color: "text-amber-500 bg-amber-50 border-amber-200",
                title: "Takut salah dokumen & ketinggalan regulasi",
                body: "Satu syarat yang terlewat bisa membuat tender gugur atau proses sertifikasi tertunda berbulan-bulan.",
              },
              {
                icon: TrendingUp,
                color: "text-blue-500 bg-blue-50 border-blue-200",
                title: "Kompetitor sudah pakai AI, Anda belum",
                body: "Kontraktor, konsultan, dan firma hukum yang lebih cepat mengadopsi AI akan memenangkan lebih banyak proyek.",
              },
            ].map(({ icon: Icon, color, title, body }) => (
              <Card key={title} className={`border ${color.split(" ").slice(1).join(" ")} bg-white`}>
                <CardContent className="p-5 flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${color.split(" ").slice(1).join(" ")}`}>
                    <Icon className={`h-5 w-5 ${color.split(" ")[0]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. AGITATE ── */}
      <section className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-2xl font-bold leading-snug text-gray-100">
            Setiap jam yang Anda habiskan untuk pekerjaan yang bisa diotomasi AI
            adalah <span className="text-orange-400">jam yang tidak menghasilkan</span> —
            dan jam yang tidak bisa dikembalikan.
          </p>
        </div>
      </section>

      {/* ── 4. SOLUTION / HOW IT WORKS (INTEREST) ── */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2 block">Solusi</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              AI spesialis, bukan AI generik
            </h2>
            <p className="text-gray-500 mt-3 text-sm max-w-xl mx-auto">
              Setiap produk di Gustafta Store dilatih untuk domain spesifik — bukan copy-paste ChatGPT.
              Tim kami kurasi, uji, dan perbarui secara berkala.
            </p>
          </div>

          {/* 3 langkah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                step: "01",
                icon: MousePointerClick,
                color: "text-violet-600 bg-violet-50 border-violet-200",
                title: "Pilih AI yang Tepat",
                body: "Browse ratusan AI spesialis per domain — konstruksi, hukum, keuangan, HR, properti. Coba demo gratis dulu.",
              },
              {
                step: "02",
                icon: ShoppingCart,
                color: "text-emerald-600 bg-emerald-50 border-emerald-200",
                title: "Beli Lisensi",
                body: "Bayar lisensi sekali + berlangganan hosting bulanan. Proses aman via Scalev.id. Konfirmasi dalam hitungan menit.",
              },
              {
                step: "03",
                icon: Zap,
                color: "text-amber-600 bg-amber-50 border-amber-200",
                title: "Langsung Aktif",
                body: "AI aktif tanpa instalasi teknis. Akses via browser atau WhatsApp. Tanya tanpa batas, 24/7.",
              },
            ].map(({ step, icon: Icon, color, title, body }) => (
              <div key={step} className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 ${color.split(" ").slice(1).join(" ")}`}>
                  <Icon className={`h-6 w-6 ${color.split(" ")[0]}`} />
                </div>
                <span className="absolute top-0 left-0 text-[10px] font-black text-gray-300 leading-none">{step}</span>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Keunggulan vs AI Generik */}
          <div className="rounded-2xl border border-violet-200 overflow-hidden bg-violet-50">
            <div className="grid grid-cols-3 text-center text-xs font-bold uppercase tracking-wide bg-violet-100 border-b border-violet-200">
              <div className="py-3 px-3 text-gray-500">Aspek</div>
              <div className="py-3 px-3 text-red-600">AI Generik</div>
              <div className="py-3 px-3 text-violet-700">Gustafta Store ✓</div>
            </div>
            {[
              ["Konteks regulasi Indonesia", "❌ Tidak tahu", "✅ Terlatih khusus"],
              ["Akurasi dokumen teknis", "❌ Rawan error", "✅ Dikurasi ahli domain"],
              ["Setup & mulai pakai", "❌ Perlu prompt rekayasa", "✅ Aktif langsung, 5 menit"],
              ["Dukungan & update", "❌ Mandiri", "✅ Tim Gustafta + berkala"],
              ["Integrasi WhatsApp", "❌ Tidak tersedia", "✅ Tersedia di semua produk"],
            ].map(([aspek, generik, gustafta]) => (
              <div key={aspek} className="grid grid-cols-3 text-center text-sm border-b border-violet-200 last:border-0">
                <div className="py-3 px-3 text-gray-700 font-medium text-left">{aspek}</div>
                <div className="py-3 px-3 text-gray-500">{generik}</div>
                <div className="py-3 px-3 text-violet-800 font-semibold">{gustafta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. DESIRE — Domain Coverage ── */}
      <section className="py-14 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2 block">Cakupan Domain</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Satu platform, semua kebutuhan profesional Anda
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "🏗️", label: "AI Konstruksi",   sub: "SBU, K3, Tender, RAB, SMKK" },
              { icon: "⚖️", label: "AI Hukum",        sub: "Kontrak, legalitas, sengketa" },
              { icon: "🎓", label: "AI Pendidikan",   sub: "Tutor, e-learning, SKK" },
              { icon: "👥", label: "AI HR",           sub: "Rekrutmen, kinerja, BNSP" },
              { icon: "💹", label: "AI Keuangan",     sub: "Pajak, cashflow, RAB" },
              { icon: "🏠", label: "AI Properti",     sub: "Developer, agen, KPR" },
              { icon: "📋", label: "Template",        sub: "Dokumen siap pakai" },
              { icon: "📚", label: "Knowledge Pack",  sub: "Pengetahuan domain mendalam" },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex flex-col gap-2 items-center text-center hover:border-violet-300 hover:shadow-sm transition-all">
                <span className="text-3xl leading-none">{item.icon}</span>
                <div className="text-sm font-bold text-gray-900 leading-tight">{item.label}</div>
                <div className="text-[11px] text-gray-500 leading-tight">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/store/katalog">
              <Button variant="outline" className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50" data-testid="button-domain-katalog">
                Jelajahi Semua Kategori <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. PRODUCT GRID — Gustafta (ACTION) ── */}
      <section className="py-14 px-4 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Produk Resmi Gustafta</h2>
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] font-bold">RESMI</Badge>
              </div>
              <p className="text-sm text-gray-500 ml-10">
                Dibuat dan dikurasi langsung oleh tim Gustafta — kualitas terjamin.{" "}
                <span className="text-violet-600 font-medium">Coba demo gratis sebelum beli.</span>
              </p>
            </div>
            <Link href="/store/katalog">
              <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 text-xs gap-1 shrink-0" data-testid="link-lihat-semua-gustafta">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {isLoading ? <SkeletonGrid /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gustafta.length > 0
                ? gustafta.map(agent => (
                    <FeaturedCard key={String(agent.id)} agent={agent} onBuy={handleBuy} onDemo={handleDemo} />
                  ))
                : <GroupEmptyState isGustafta={true} />}
            </div>
          )}
        </div>
      </section>

      {/* ── 7. PRODUCT GRID — Mitra ── */}
      <section className="py-14 px-4 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Produk Mitra Bersertifikat</h2>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold">BERSERTIFIKAT</Badge>
              </div>
              <p className="text-sm text-gray-500 ml-10">
                Dibuat oleh creator bersertifikat — lulus workshop Gustafta, direview tim, dikurasi sebelum tayang.
              </p>
            </div>
            <Link href="/store/katalog">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 text-xs gap-1 shrink-0" data-testid="link-lihat-semua-mitra">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {isLoading ? <SkeletonGrid /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mitra.length > 0
                ? mitra.map(agent => (
                    <FeaturedCard key={String(agent.id)} agent={agent} onBuy={handleBuy} onDemo={handleDemo} />
                  ))
                : <GroupEmptyState isGustafta={false} />}
            </div>
          )}
        </div>
      </section>

      {/* ── 8. FAQ ── */}
      <section className="py-16 px-4 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">FAQ</span>
            <h2 className="text-2xl font-bold text-gray-900">Pertanyaan yang Sering Ditanyakan</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Apakah perlu kemampuan teknis untuk menggunakannya?",
                a: "Tidak sama sekali. Tidak perlu coding, tidak perlu instalasi server. Setelah lisensi aktif, Anda langsung bisa menggunakan AI via browser atau WhatsApp.",
              },
              {
                q: "Seberapa akurat jawaban AI-nya?",
                a: "Setiap AI dilatih dengan basis pengetahuan domain spesifik dan diperbarui secara berkala. Namun untuk keputusan kritis (hukum, teknis struktural, medis), selalu verifikasi ke pihak berwenang atau profesional berlisensi.",
              },
              {
                q: "Apa bedanya lisensi sekali bayar dengan langganan bulanan?",
                a: "Lisensi adalah hak pakai produk AI. Langganan bulanan adalah biaya hosting agar AI Anda terus aktif dan bisa diakses. Keduanya terpisah dan transparan di halaman checkout.",
              },
              {
                q: "Bisa coba dulu sebelum beli?",
                a: "Bisa. Setiap produk Gustafta tersedia demo gratis — 3 pertanyaan tanpa daftar, langsung dari halaman ini. Klik tombol 'Coba Demo Gratis' di kartu produk mana saja.",
              },
              {
                q: "Bagaimana jika saya butuh AI yang belum ada di katalog?",
                a: "Hubungi tim kami via WhatsApp. Kami menerima permintaan custom dan memiliki tim yang bisa merakit AI sesuai kebutuhan spesifik bisnis atau industri Anda.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1.5">{q}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FINAL CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Mulai hari ini — sebelum kompetitor Anda melakukannya
          </h2>
          <p className="text-violet-200 mb-8 text-sm leading-relaxed">
            Pilih AI spesialis, aktif dalam 5 menit, bekerja 24/7 tanpa lelah.
            Tidak ada alasan untuk menundanya lagi.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/store/katalog">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-8 h-12 text-base gap-2" data-testid="button-final-cta-katalog">
                <Bot className="h-5 w-5" /> Buka Katalog Lengkap
              </Button>
            </Link>
            <a
              href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20konsultasi%20memilih%20AI%20yang%20tepat%20untuk%20saya"
              onClick={() => trackLead({ content_name: "WhatsApp Final CTA" })}
              target="_blank" rel="noopener noreferrer"
              data-testid="link-wa-final-cta"
            >
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold px-8 h-12 text-base gap-2">
                <Smartphone className="h-5 w-5" /> Konsultasi via WA
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400 bg-white">
        <div className="flex items-center justify-center gap-4 mb-2">
          <a href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-gray-700 transition-colors" data-testid="link-wa-footer-1">
            <Smartphone className="h-3.5 w-3.5" />081287941900
          </a>
          <span className="text-gray-300">·</span>
          <a href="https://wa.me/6282299417818" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-gray-700 transition-colors" data-testid="link-wa-footer-2">
            082299417818
          </a>
        </div>
        <p>© 2026 Gustafta. AI Platform Konstruksi Indonesia.</p>
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-400">
          <a href="/mitra" className="hover:text-gray-600 transition-colors">Mitra & Jaringan</a>
          <span className="text-gray-300">·</span>
          <a href="/syarat-ketentuan" className="hover:text-gray-600 transition-colors">Syarat & Ketentuan</a>
          <span className="text-gray-300">·</span>
          <a href="/kebijakan-privasi" className="hover:text-gray-600 transition-colors">Kebijakan Privasi</a>
        </div>
      </footer>

      {/* Demo Dialog */}
      <DemoModal
        agent={demoAgent}
        open={showDemoDialog}
        onClose={() => setShowDemoDialog(false)}
        onBuy={(a) => { setShowDemoDialog(false); handleBuy(a); }}
      />

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={(o) => !o && setShowBuyDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Beli — {selectedAgent?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedAgent?.tagline || "Chatbot AI siap pakai."}
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4 mt-1">
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm font-medium">Biaya Lisensi</p>
                  <p className="text-[11px] text-gray-400">Lisensi sekali bayar · langganan bulanan terpisah</p>
                </div>
                <span className="text-xl font-bold text-violet-600">{formatPrice(selectedAgent.price)}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sf-name" className="text-sm">Nama Lengkap *</Label>
                  <Input id="sf-name" value={buyForm.name}
                    onChange={(e) => setBuyForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nama Anda" className="mt-1" data-testid="input-buy-name" />
                </div>
                <div>
                  <Label htmlFor="sf-email" className="text-sm">
                    Email * <span className="text-gray-400 font-normal">(bukan nomor HP)</span>
                  </Label>
                  <Input id="sf-email" type="email" value={buyForm.email}
                    onChange={(e) => setBuyForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contoh: nama@gmail.com"
                    className={`mt-1 ${buyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email) ? "border-red-400" : ""}`}
                    data-testid="input-buy-email" />
                  {buyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email)
                    ? <p className="text-xs text-red-500 mt-1">Format email tidak valid. Contoh: nama@gmail.com</p>
                    : <p className="text-xs text-gray-400 mt-1">Link akses dikirim ke email ini</p>}
                </div>
                <div>
                  <Label htmlFor="sf-phone" className="text-sm">No. HP / WhatsApp</Label>
                  <Input id="sf-phone" value={buyForm.phone}
                    onChange={(e) => setBuyForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Contoh: 082299417818" className="mt-1" data-testid="input-buy-phone" />
                </div>
              </div>
              <Button onClick={handleSubmitOrder} disabled={createOrderMutation.isPending}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-semibold"
                data-testid="button-confirm-purchase">
                {createOrderMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
                  : <><ShoppingCart className="h-4 w-4 mr-2" />Bayar {formatPrice(selectedAgent.price)}</>}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Pembayaran aman via Scalev.id. Konfirmasi order via WhatsApp tim kami.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
