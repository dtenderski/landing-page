import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreateSubscription } from "@/hooks/use-subscription";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, MessageCircle, ArrowRight, Loader2, ShieldCheck, Clock,
  Sparkles, Crown, Zap, Bot, Wrench, ChevronRight, Lock, User, Phone,
  CreditCard, ExternalLink,
} from "lucide-react";
import { HOSTING_PERIODS, SERVICE_TIERS } from "@/data/pricing";
import { trackLead } from "@/lib/meta-pixel";

const WA_NUMBER = "6282299417818";

function waLink(msg: string) {
  trackLead({ content_name: "WhatsApp CTA" });
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

const SUBSCRIPTION_PLANS: Record<string, {
  key: string; name: string; price: string; priceNum: number;
  period: string; duration: string; savings?: string;
  icon: typeof Sparkles; popular?: boolean;
  features: string[];
}> = {
  monthly_1: {
    key: HOSTING_PERIODS[0].key, name: "Paket 1 Bulan", price: HOSTING_PERIODS[0].price, priceNum: HOSTING_PERIODS[0].priceNum,
    period: HOSTING_PERIODS[0].period, duration: HOSTING_PERIODS[0].duration, icon: Sparkles,
    features: [
      "1 Chatbot aktif", "5.000 pesan/bulan", "Knowledge Base: 20 dokumen",
      "Web Widget (No Branding)", "WhatsApp & Telegram", "Agentic AI + Mini Apps (45 Tipe)",
      "Orchestrator Multi-Agent (7 Specialist)", "Analytics Dashboard", "Email Support",
    ],
  },
  monthly_3: {
    key: HOSTING_PERIODS[1].key, name: "Paket 3 Bulan", price: HOSTING_PERIODS[1].price, priceNum: HOSTING_PERIODS[1].priceNum,
    period: HOSTING_PERIODS[1].period, duration: HOSTING_PERIODS[1].duration, savings: HOSTING_PERIODS[1].savings,
    icon: Sparkles, popular: true,
    features: [
      "1 Chatbot aktif", "5.000 pesan/bulan", "Knowledge Base: 20 dokumen",
      "Web Widget (No Branding)", "WhatsApp & Telegram", "Agentic AI + Mini Apps (45 Tipe)",
      "Orchestrator Multi-Agent (7 Specialist)", "Analytics Dashboard", "Priority Email Support",
    ],
  },
  monthly_6: {
    key: HOSTING_PERIODS[2].key, name: "Paket 6 Bulan", price: HOSTING_PERIODS[2].price, priceNum: HOSTING_PERIODS[2].priceNum,
    period: HOSTING_PERIODS[2].period, duration: HOSTING_PERIODS[2].duration, savings: HOSTING_PERIODS[2].savings,
    icon: Crown,
    features: [
      "1 Chatbot aktif", "5.000 pesan/bulan", "Knowledge Base: 30 dokumen",
      "Web Widget (No Branding)", "WhatsApp, Telegram, Discord",
      "Agentic AI + Mini Apps + Master Standar v2.0",
      "Orchestrator Multi-Agent + Custom Specialist",
      "SCORECARD + Win Probability (131 Hub)", "Advanced Analytics", "Priority Support",
    ],
  },
  monthly_12: {
    key: HOSTING_PERIODS[3].key, name: "Paket 12 Bulan", price: HOSTING_PERIODS[3].price, priceNum: HOSTING_PERIODS[3].priceNum,
    period: HOSTING_PERIODS[3].period, duration: HOSTING_PERIODS[3].duration, savings: HOSTING_PERIODS[3].savings,
    icon: Crown,
    features: [
      "1 Chatbot aktif", "5.000 pesan/bulan", "Knowledge Base: 50 dokumen",
      "Web Widget (Custom Branding)", "Semua Multi-channel",
      "Agentic AI + Mini Apps + Master Standar v2.0",
      "Orchestrator Multi-Agent + Custom Specialist Unlimited",
      "SCORECARD + Win Probability + Export Aspekindo LLM",
      "Advanced Analytics", "Priority Support + WhatsApp",
    ],
  },
};

const SCALEV_BASE = "https://app.scalev.com/checkout";

const JASA_PLANS: Record<string, {
  key: string; name: string; price: string; priceNum: number;
  scope: string; tag: string; popular?: boolean;
  description: string; features: string[]; scalevSlug: string;
}> = {
  tier1: {
    key: SERVICE_TIERS[0].jasaKey, name: "Jasa Chatbot — Tier 1", price: SERVICE_TIERS[0].price, priceNum: SERVICE_TIERS[0].amount,
    scope: SERVICE_TIERS[0].scope, tag: SERVICE_TIERS[0].tag, scalevSlug: "gustafta-jasa-tier1",
    description: "Chatbot ringan untuk FAQ, info produk, dan layanan dasar.",
    features: [
      "Konfigurasi dasar chatbot", "Setup knowledge base FAQ",
      "Integrasi web widget", "Training & onboarding",
      "1x revisi konten", "Panduan penggunaan",
    ],
  },
  tier2: {
    key: SERVICE_TIERS[1].jasaKey, name: "Jasa Chatbot — Tier 2", price: SERVICE_TIERS[1].price, priceNum: SERVICE_TIERS[1].amount,
    scope: SERVICE_TIERS[1].scope, tag: SERVICE_TIERS[1].tag, popular: true, scalevSlug: "gustafta-jasa-tier2",
    description: "Chatbot multi-fungsi untuk lead gen, sales assist, dan layanan pelanggan.",
    features: [
      "Konfigurasi lengkap chatbot", "Setup knowledge base komprehensif",
      "Integrasi WhatsApp & Telegram", "Agentic AI configuration",
      "Mini Apps setup (hingga 5 tipe)", "3x revisi konten",
      "Training & onboarding tim", "1 bulan support pasca-launch",
    ],
  },
  tier3: {
    key: SERVICE_TIERS[2].jasaKey, name: "Jasa Chatbot — Tier 3", price: SERVICE_TIERS[2].price, priceNum: SERVICE_TIERS[2].amount,
    scope: SERVICE_TIERS[2].scope, tag: SERVICE_TIERS[2].tag, scalevSlug: "gustafta-jasa-tier3",
    description: "Chatbot kompleks dengan orkestrasi multi-agen dan knowledge base luas.",
    features: [
      "Konfigurasi advanced chatbot", "Knowledge base skala besar (30+ dok)",
      "Orchestrator Multi-Agent (7 specialist)", "Semua multi-channel integration",
      "Mini Apps setup (hingga 15 tipe)", "SCORECARD + Analytics setup",
      "5x revisi & optimasi", "Training tim + dokumentasi",
      "2 bulan support pasca-launch",
    ],
  },
  tier4: {
    key: SERVICE_TIERS[3].jasaKey, name: "Jasa Chatbot — Tier 4", price: SERVICE_TIERS[3].price, priceNum: SERVICE_TIERS[3].amount,
    scope: SERVICE_TIERS[3].scope, tag: SERVICE_TIERS[3].tag, scalevSlug: "gustafta-jasa-tier4",
    description: "Chatbot enterprise multi-domain, agentic penuh, custom branding.",
    features: [
      "Full enterprise configuration", "Knowledge base unlimited",
      "Custom Specialist Agents (unlimited)", "Multi-domain & Custom Domain",
      "Semua 45 tipe Mini Apps", "Custom branding widget",
      "SCORECARD + Win Probability + Export", "Dedicated project manager",
      "Revisi unlimited 30 hari", "3 bulan support prioritas",
    ],
  },
};

function parseQueryParams(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const qs = search.startsWith("?") ? search.slice(1) : search;
  qs.split("&").forEach(part => {
    const [k, v] = part.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  });
  return params;
}

export default function CheckoutPage() {
  const [location] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = parseQueryParams(search);

  const planKey = params.plan || "";
  const jasaKey = params.jasa || "";

  const plan = SUBSCRIPTION_PLANS[planKey] || null;
  const jasa = JASA_PLANS[jasaKey] || null;

  // ── Agent (Store Chatbot) checkout ─────────────────────────────────────────────
  const agentId = params.agent || "";
  const agentName = agentId ? decodeURIComponent(params.agentName || "Chatbot Premium") : "";
  const agentPriceNum = parseInt(params.agentPrice || "99000") || 99000;
  const agentPrice = `Rp ${agentPriceNum.toLocaleString("id-ID")}`;
  const isAgent = !!(agentId && !plan && !jasa);
  const [agentForm, setAgentForm] = useState({ name: "", email: "", phone: "" });
  const [agentOrderLoading, setAgentOrderLoading] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────────

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const createSubscription = useCreateSubscription();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValid = !!(plan || jasa || isAgent);
  const productName = plan?.name || jasa?.name || (isAgent ? agentName : "Produk tidak ditemukan");
  const productPrice = plan?.price || jasa?.price || (isAgent ? agentPrice : "");
  const productFeatures = plan?.features || jasa?.features || (isAgent ? [
    "Chatbot AI siap pakai untuk domain spesifik",
    "Lisensi hak pakai — sekali bayar, tanpa biaya berulang",
    "Install mandiri di dashboard Gustafta",
    "Knowledge base terlatih untuk industri/domain",
    "Update konten gratis selamanya",
    "Support via WhatsApp tim Gustafta",
  ] : []);

  const handleAgentOrder = async () => {
    if (!agentForm.name.trim()) {
      toast({ title: "Lengkapi data", description: "Nama lengkap wajib diisi.", variant: "destructive" }); return;
    }
    if (!agentForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentForm.email.trim())) {
      toast({ title: "Format email salah", description: "Gunakan email yang valid, contoh: nama@gmail.com", variant: "destructive" }); return;
    }
    setAgentOrderLoading(true);
    try {
      const res = await fetch("/api/store/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: parseInt(agentId),
          name: agentForm.name.trim(),
          email: agentForm.email.trim(),
          phone: agentForm.phone.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat pesanan");
      }
      const data = await res.json();
      if (data.scalevUrl) {
        window.open(data.scalevUrl, "_blank");
        setDone(true);
      } else if (data.waUrl) {
        window.open(data.waUrl, "_blank");
        setDone(true);
      }
    } catch (e: any) {
      toast({ title: "Gagal memproses", description: e.message || "Coba lagi.", variant: "destructive" });
    } finally {
      setAgentOrderLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    setLoading(true);
    try {
      if (plan) {
        const result = await createSubscription.mutateAsync({ plan: plan.key });
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/user"] });
        if (result.scalevCheckoutUrl) {
          window.open(result.scalevCheckoutUrl, "_blank");
          setDone(true);
        } else if (result.waUrl) {
          trackLead({ content_name: "WhatsApp CTA" });
          window.open(result.waUrl, "_blank");
          setDone(true);
        } else {
          toast({ title: "Berhasil!", description: "Langganan sudah diproses." });
          setDone(true);
        }
      } else if (jasa) {
        const scalevUrl = `${SCALEV_BASE}/${jasa.scalevSlug}`;
        window.open(scalevUrl, "_blank");
        setDone(true);
      }
    } catch (err: any) {
      toast({
        title: "Gagal Memproses",
        description: err?.message || "Terjadi kesalahan. Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const PlanIcon = plan?.icon || Bot;

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Produk Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Link checkout tidak valid. Pilih produk dari halaman harga.</p>
          <Link href="/pricing">
            <Button>Lihat Daftar Harga</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Diarahkan ke Pembayaran!
          </h1>
          <p className="text-muted-foreground max-w-sm mb-2">
            Halaman pembayaran Scalev sudah terbuka di tab baru. Selesaikan pembayaran untuk melanjutkan proses.
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Gunakan email Gustafta Anda saat checkout di Scalev agar kami bisa memproses pesanan Anda dengan cepat.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            Butuh bantuan? Hubungi tim kami via WhatsApp.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/dashboard">
              <Button data-testid="button-go-dashboard">
                <Bot className="h-4 w-4 mr-2" /> Ke Dashboard
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline">Lihat Paket Lain</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/pricing" className="hover:text-foreground transition-colors">Harga</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Checkout</span>
        </nav>

        <h1 className="text-2xl font-bold mb-1">Konfirmasi Pesanan</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Periksa detail pesanan Anda sebelum melanjutkan ke pembayaran.
        </p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT — Product detail */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product card */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  plan?.popular || jasa?.popular
                    ? "bg-primary/10"
                    : "bg-muted"
                }`}>
                  {plan
                    ? <PlanIcon className={`h-6 w-6 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                    : isAgent ? <Bot className="h-6 w-6 text-violet-600" />
                    : <Wrench className="h-6 w-6 text-violet-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-bold text-lg leading-tight">{productName}</h2>
                    {(plan?.popular || jasa?.popular) && (
                      <Badge className="text-[10px] bg-primary text-white">POPULER</Badge>
                    )}
                    {jasa && (
                      <Badge variant="outline" className="text-[10px]">{jasa.scope}</Badge>
                    )}
                    {plan?.savings && (
                      <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">
                        {plan.savings}
                      </Badge>
                    )}
                  </div>
                  {plan && (
                    <p className="text-sm text-muted-foreground">Durasi: {plan.duration}</p>
                  )}
                  {jasa && (
                    <p className="text-sm text-muted-foreground">{jasa.description}</p>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {plan ? "Yang Anda dapatkan:" : isAgent ? "Yang Anda dapatkan:" : "Termasuk dalam paket jasa:"}
                </p>
                {productFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              {plan && (
                <div className="mt-5 pt-4 border-t text-xs text-muted-foreground">
                  * Biaya berlangganan — terpisah dari biaya setup chatbot jika ada.
                </div>
              )}
              {jasa && (
                <div className="mt-5 pt-4 border-t text-xs text-muted-foreground">
                  * Biaya setup dibayar sekali, sudah termasuk lisensi + Starter Kit. Hosting berlangganan dibayar terpisah sesuai durasi yang dipilih.
                </div>
              )}
              {isAgent && (
                <div className="mt-5 pt-4 border-t text-xs text-muted-foreground">
                  * Biaya aktivasi dibayar sekali. Hosting bulanan dibayar terpisah di halaman <a href="/pricing" className="underline underline-offset-2">Harga</a> sesuai durasi yang dipilih.
                </div>
              )}
            </div>

            {/* Payment process steps */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-semibold text-sm mb-4">Cara Pembayaran</h3>
              <div className="space-y-4">
                {(isAgent ? [
                  {
                    step: "1", icon: User, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30",
                    title: "Isi Data Pembeli",
                    desc: "Masukkan nama, email, dan nomor WhatsApp Anda di formulir di sebelah kanan.",
                  },
                  {
                    step: "2", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30",
                    title: "Bayar via Scalev",
                    desc: "Klik tombol bayar — halaman Scalev terbuka di tab baru. Pilih metode: transfer bank, QRIS, kartu kredit, dll.",
                  },
                  {
                    step: "3", icon: Zap, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30",
                    title: "Chatbot Aktif Otomatis",
                    desc: "Setelah bayar dikonfirmasi Scalev, chatbot langsung tersedia di dashboard Anda tanpa konfirmasi manual.",
                  },
                ] : plan ? [
                  {
                    step: "1", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30",
                    title: "Klik Bayar via Scalev",
                    desc: "Klik tombol — sistem membuat pesanan & membuka halaman pembayaran Scalev di tab baru.",
                  },
                  {
                    step: "2", icon: User, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30",
                    title: "Isi Data & Pilih Metode Bayar",
                    desc: "Gunakan email Gustafta Anda. Scalev mendukung transfer bank, QRIS, kartu kredit, dll.",
                  },
                  {
                    step: "3", icon: Zap, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30",
                    title: "Akun Aktif Otomatis",
                    desc: "Setelah pembayaran terkonfirmasi Scalev, akun Gustafta Anda aktif otomatis — tidak perlu konfirmasi manual.",
                  },
                ] : [
                  {
                    step: "1", icon: CreditCard, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30",
                    title: "Bayar via Scalev",
                    desc: "Klik tombol — Anda diarahkan ke halaman pembayaran Scalev. Selesaikan pembayaran di sana.",
                  },
                  {
                    step: "2", icon: Phone, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30",
                    title: "Konfirmasi & Brief",
                    desc: "Tim kami menghubungi Anda dalam 1x24 jam untuk brief kebutuhan dan detail pengerjaan.",
                  },
                  {
                    step: "3", icon: Zap, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30",
                    title: "Pengerjaan Dimulai",
                    desc: "Setelah brief selesai, tim kami langsung mengerjakan chatbot Anda sesuai spesifikasi.",
                  },
                ]).map(({ step, icon: Icon, color, bg, title, desc }) => (
                  <div key={step} className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step}. {title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Order summary + CTA */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              {/* Order summary box */}
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold text-sm mb-4">Ringkasan Pesanan</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Produk</span>
                    <span className="font-medium text-right max-w-[180px]">{productName}</span>
                  </div>
                  {plan && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durasi</span>
                      <span className="font-medium">{plan.duration}</span>
                    </div>
                  )}
                  {jasa && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipe</span>
                      <span className="font-medium">{jasa.scope}</span>
                    </div>
                  )}
                  {isAgent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jenis</span>
                      <span className="font-medium">Lisensi (sekali bayar)</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between items-baseline">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">{productPrice}</span>
                  </div>
                  {plan?.savings && (
                    <div className="text-xs text-green-700 dark:text-green-400 text-right">{plan.savings}</div>
                  )}
                  {plan && (
                    <div className="text-xs text-muted-foreground text-right">{plan.period}</div>
                  )}
                  {jasa && (
                    <div className="text-xs text-muted-foreground text-right">Biaya setup (bayar sekali)</div>
                  )}
                  {isAgent && (
                    <div className="text-xs text-muted-foreground text-right">Aktivasi (bayar sekali) + hosting terpisah</div>
                  )}
                </div>
              </div>

              {/* Agent form — hanya untuk pembelian chatbot store */}
              {isAgent && (
                <div className="rounded-2xl border bg-card p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Informasi Pembeli</p>
                  <div>
                    <label className="text-xs font-medium block mb-1">Nama Lengkap <span className="text-destructive">*</span></label>
                    <input type="text" value={agentForm.name}
                      onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nama Anda"
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Email <span className="text-destructive">*</span> <span className="font-normal text-muted-foreground">(bukan nomor HP)</span></label>
                    <input type="email" value={agentForm.email}
                      onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="nama@gmail.com"
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Link akses chatbot dikirim ke email ini</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">No. WhatsApp <span className="font-normal text-muted-foreground">(opsional)</span></label>
                    <input type="tel" value={agentForm.phone}
                      onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="082299417818"
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                  </div>
                </div>
              )}

              {/* Customer info — untuk berlangganan/jasa saja */}
              {!isAgent && isAuthenticated && user && (
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Info Akun</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login notice — untuk berlangganan/jasa saja */}
              {!isAgent && !isAuthenticated && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Login diperlukan
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Silakan login atau daftar terlebih dahulu untuk melanjutkan pesanan.
                  </p>
                </div>
              )}

              {/* CTA */}
              <Button
                size="lg"
                className="w-full gap-2 h-12 text-base font-semibold"
                onClick={isAgent ? handleAgentOrder : handleOrder}
                disabled={isAgent ? agentOrderLoading : loading}
                data-testid="button-checkout-confirm"
              >
                {(isAgent ? agentOrderLoading : loading)
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                  : isAgent
                  ? <><CreditCard className="h-4 w-4" /> Bayar {agentPrice} via Scalev<ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" /></>
                  : !isAuthenticated
                  ? <><Lock className="h-4 w-4" /> Login & Pesan</>
                  : <><CreditCard className="h-4 w-4" /> Bayar via Scalev<ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" /></>
                }
              </Button>

              <p className="text-xs text-center text-muted-foreground -mt-1">
                {isAgent ? "Isi data di atas lalu klik bayar — proses 1–2 menit" : "Terbuka di tab baru — gunakan email Gustafta Anda"}
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.history.back()}
                data-testid="button-checkout-back"
              >
                ← Kembali
              </Button>

              {/* Trust badges */}
              <div className="space-y-2 pt-1">
                {(isAgent ? [
                  { icon: ShieldCheck, text: "Pembayaran aman via Scalev (bank, QRIS, kartu)" },
                  { icon: Zap, text: "Chatbot aktif otomatis setelah bayar dikonfirmasi" },
                  { icon: MessageCircle, text: "Support WhatsApp siap membantu" },
                ] : plan ? [
                  { icon: ShieldCheck, text: "Pembayaran aman via Scalev (bank, QRIS, kartu)" },
                  { icon: Zap, text: "Aktivasi otomatis setelah pembayaran dikonfirmasi" },
                  { icon: MessageCircle, text: "Support WhatsApp siap membantu" },
                ] : [
                  { icon: ShieldCheck, text: "Pembayaran aman via Scalev" },
                  { icon: Clock, text: "Pengerjaan dimulai setelah pembayaran" },
                  { icon: MessageCircle, text: "Support WhatsApp siap membantu" },
                ]).map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
