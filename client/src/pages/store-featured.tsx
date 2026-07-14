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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
              target="_blank"
              rel="noopener noreferrer"
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

      {/* ── Journey Context: MENGGUNAKAN AI ── */}
      <section className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
            {["Belajar", "Merakit AI"].map((s) => (
              <span key={s} className="flex items-center gap-1 text-gray-500">
                {s}<ChevronRight className="h-3 w-3" />
              </span>
            ))}
            <span className="font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white">TAHAP 3</span>
            <span className="font-semibold text-blue-800">Menggunakan AI</span>
            {["Menghasilkan Nilai", "Berkembang"].map((s) => (
              <span key={s} className="flex items-center gap-1 text-gray-500">
                <ChevronRight className="h-3 w-3" />{s}
              </span>
            ))}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-1.5">
            Tidak ingin merakit sendiri? Pilih dan langsung pakai
          </h2>
          <p className="text-sm text-blue-700 mb-5 max-w-3xl leading-relaxed">
            Ratusan AI spesialis siap digunakan — dari domain Konstruksi, Hukum, Pendidikan, HR, Keuangan, hingga Properti. Pilih sesuai kebutuhan, aktif dalam hitungan menit.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
            {[
              { icon: "🏗️", label: "AI Konstruksi", sub: "SBU, K3, Tender, RAB" },
              { icon: "⚖️", label: "AI Hukum", sub: "Kontrak, legalitas" },
              { icon: "🎓", label: "AI Pendidikan", sub: "Tutor & e-learning" },
              { icon: "👥", label: "AI HR", sub: "Rekrutmen, kinerja" },
              { icon: "💹", label: "AI Keuangan", sub: "Pajak, cashflow" },
              { icon: "🏠", label: "AI Properti", sub: "Developer, agen" },
              { icon: "📋", label: "Template", sub: "Paket siap pakai" },
              { icon: "📚", label: "Knowledge Pack", sub: "Pengetahuan domain" },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-blue-200 rounded-xl px-2.5 py-2 flex flex-col gap-1 text-center items-center">
                <span className="text-xl leading-none">{item.icon}</span>
                <div className="text-[11px] font-semibold text-blue-900 leading-tight">{item.label}</div>
                <div className="text-[10px] text-blue-500">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/store/katalog">
              <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <ShoppingCart className="h-3.5 w-3.5" /> Lihat Semua AI Solutions
              </button>
            </Link>
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20rekomendasi%20AI%20yang%20tepat%20untuk%20kebutuhan%20saya" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 border border-blue-400 text-blue-700 hover:bg-blue-50 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                Minta Rekomendasi <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="py-10 px-4 text-center border-b border-gray-200 bg-white">
        <Badge className="mb-3 bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
          🏪 Gustafta Store — AI Solutions Siap Pakai
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">
          Pilih AI-mu, Langsung Aktif
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto mb-6 text-sm leading-relaxed">
          Dua sumber produk — <strong className="text-gray-900">AI resmi Gustafta</strong> dan{" "}
          <strong className="text-gray-900">AI dari creator bersertifikat</strong>.
          Semua siap pakai — lisensi sekali bayar + langganan bulanan (hosting).
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 border border-gray-700 text-sm mb-6 shadow-sm">
          <span className="text-orange-300 font-medium">🏷️ Pilih AI</span>
          <span className="text-gray-400">→</span>
          <span className="text-green-300 font-medium">💳 Lisensi + Langganan</span>
          <span className="text-gray-400">→</span>
          <span className="text-white font-bold">✓ Langsung Aktif</span>
        </div>

        <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Aktif tanpa konfigurasi teknis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Lisensi sekali + langganan bulanan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Dikurasi & diuji tim
          </span>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">

        {/* Section 1 — Produk Gustafta */}
        <section>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Produk Chatbot Gustafta</h2>
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] font-bold">RESMI</Badge>
              </div>
              <p className="text-sm text-gray-500 ml-9">
                Dibuat dan dikurasi langsung oleh tim Gustafta — kualitas terjamin. <span className="text-violet-600 font-medium">Coba demo gratis sebelum beli.</span>
              </p>
            </div>
            <Link href="/store/katalog">
              <Button
                variant="ghost"
                size="sm"
                className="text-violet-600 hover:text-violet-700 text-xs gap-1 shrink-0"
                data-testid="link-lihat-semua-gustafta"
              >
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
        </section>

        {/* Section 2 — Produk Mitra */}
        <section>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Produk Chatbot Mitra</h2>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold">BERSERTIFIKAT</Badge>
              </div>
              <p className="text-sm text-gray-500 ml-9">
                Dibuat oleh creator bersertifikat — lulus workshop Gustafta, direview tim, dikurasi sebelum tayang.
              </p>
            </div>
            <Link href="/store/katalog">
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 text-xs gap-1 shrink-0"
                data-testid="link-lihat-semua-mitra"
              >
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
        </section>

        {/* CTA — full catalog */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">Jelajahi semua chatbot yang tersedia</p>
          <Link href="/store/katalog">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2" data-testid="button-ke-katalog">
              <Bot className="h-4 w-4" />Buka Katalog Lengkap
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
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
