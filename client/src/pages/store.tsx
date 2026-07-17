import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Bot, ShoppingCart, Smartphone, Search,
  ChevronLeft, ChevronRight, Layers, CheckCircle2, Info, X, MessageCircle,
  Wrench, Sparkles, ShieldAlert, ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { trackLead, trackViewContent, trackInitiateCheckout } from "@/lib/meta-pixel";
import { PRICING } from "@/data/pricing";

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

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

interface AgentProduct {
  id: string | number;
  productId?: number;
  name: string;
  category: string;
  tagline: string;
  description: string;
  productSummary: string;
  productFeatures: string[];
  productUseCases?: string;
  productTargetUser?: string;
  productProblem?: string;
  emoji: string;
  color: string;
  isOrchestrator?: boolean;
  price: number;
  originalPrice?: number | null;
  agentId?: number | null;
  agentCount?: number;
  isCreatorMade?: boolean;
  isCertified?: boolean;
  licenseClass?: number | null;
  type?: string;
}

interface CatalogResponse {
  items: AgentProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface BuyFormData {
  name: string;
  email: string;
  phone: string;
}

const LIMIT = 18;

export default function Store() {
  const { toast } = useToast();
  const initialParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
  const initialSearch = initialParams.get("q") ?? "";
  const initialCategory = initialParams.get("cat")
    ?? (typeof window !== "undefined" ? localStorage.getItem("store_last_category") ?? "" : "");
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchInput) params.set("q", searchInput);
    if (selectedCategory) params.set("cat", selectedCategory);
    const newUrl = params.toString() ? `/store?${params.toString()}` : "/store";
    window.history.replaceState(null, "", newUrl);
    if (selectedCategory) {
      localStorage.setItem("store_last_category", selectedCategory);
    } else {
      localStorage.removeItem("store_last_category");
    }
  }, [searchInput, selectedCategory]);
  const [page, setPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<AgentProduct | null>(null);
  const [buyForm, setBuyForm] = useState<BuyFormData>({ name: "", email: "", phone: "" });
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [detailAgent, setDetailAgent] = useState<AgentProduct | null>(null);

  const { data: paymentConfig } = useQuery<{ clientKey: string; paymentConfigured: boolean; isSandbox: boolean }>({
    queryKey: ["/api/subscriptions/status"],
    queryFn: async () => { const res = await fetch("/api/subscriptions/status"); return res.json(); },
  });


  const catalogParams = new URLSearchParams({
    page: String(page), limit: String(LIMIT),
    ...(search ? { search } : {}),
    ...(selectedCategory ? { category: selectedCategory } : {}),
  }).toString();

  const { data: catalog, isLoading } = useQuery<CatalogResponse>({
    queryKey: ["/api/store/catalog", page, search, selectedCategory],
    queryFn: async () => { const res = await fetch(`/api/store/catalog?${catalogParams}`); return res.json(); },
  });

  const { data: categories = [] } = useQuery<CategoryCount[]>({
    queryKey: ["/api/store/catalog/categories"],
    queryFn: async () => { const res = await fetch("/api/store/catalog/categories"); return res.json(); },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { agentId?: number | null; productId?: number } & BuyFormData) => {
      return apiRequest("POST", "/api/store/order", data);
    },
    onSuccess: async (res: Response) => {
      const data = await res.json();
      const { waUrl } = data;
      setShowBuyDialog(false);
      trackInitiateCheckout({ content_name: selectedAgent?.name ?? "Store Product", currency: "IDR" });
      toast({ title: "Pesanan dibuat!", description: "Tim kami akan menghubungi Anda untuk konfirmasi pembayaran via Scalev." });
      if (waUrl) window.open(waUrl, "_blank");
    },
    onError: (err: Error) => {
      toast({ title: "Gagal membuat pesanan", description: err.message, variant: "destructive" });
    },
  });

  const handleSearch = useCallback(() => { setSearch(searchInput); setPage(1); }, [searchInput]);
  const handleCategoryChange = (cat: string) => { setSelectedCategory(cat); setPage(1); };

  const handleBuy = (agent: AgentProduct) => {
    setSelectedAgent(agent);
    setBuyForm({ name: "", email: "", phone: "" });
    setShowBuyDialog(true);
    setDetailAgent(null);
    trackViewContent({ content_name: agent.name, content_category: agent.category ?? "chatbot" });
  };

  const handleDetail = (agent: AgentProduct) => setDetailAgent(agent);

  const handleSubmitOrder = () => {
    if (!selectedAgent) return;
    if (!buyForm.name.trim()) { toast({ title: "Lengkapi data", description: "Nama lengkap wajib diisi.", variant: "destructive" }); return; }
    if (!buyForm.email.trim()) { toast({ title: "Lengkapi data", description: "Email wajib diisi.", variant: "destructive" }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyForm.email.trim())) {
      toast({ title: "Format email salah", description: "Masukkan alamat email yang valid, contoh: nama@email.com", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({
      agentId: selectedAgent.agentId ?? undefined,
      productId: selectedAgent.productId,
      ...buyForm,
    });
  };

  const items = catalog?.items || [];
  const total = catalog?.total || 0;
  const pages = catalog?.pages || 1;

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
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <a href="/store" className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors" data-testid="link-back-store">
              ← Store Pilihan
            </a>
            <span className="text-gray-300">·</span>
            <a href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-gray-900 transition-colors" data-testid="link-wa-header-1">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">081287941900</span>
            </a>
            <span className="hidden sm:inline text-gray-300">·</span>
            <a href="https://wa.me/6282299417818" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 hover:text-gray-900 transition-colors" data-testid="link-wa-header-2">
              082299417818
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-10 px-4 text-center border-b border-gray-200 bg-white">
        <Badge className="mb-3 bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
          🏪 Store Creator — Marketplace Chatbot Gustafta
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">
          Chatbot dari Mitra Creator Gustafta
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-4">
          Chatbot di Store ini dibuat oleh <strong className="text-gray-900">kreator independen</strong> — bukan produk Gustafta sendiri. Program workshop &amp; sertifikasi kreator <strong className="text-gray-900">sedang kami siapkan</strong>. Untuk saat ini, sebagian kreator masih dalam tahap <strong className="text-gray-900">pra-sertifikasi</strong>, dan kualitasnya akan terus kami tingkatkan seiring program berjalan.
        </p>
        <div className="max-w-2xl mx-auto mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left" data-testid="notice-pra-sertifikasi">
          <span className="text-base leading-none mt-0.5">🔎</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Catatan transparansi:</strong> Store dibuka lebih awal agar kreator yang sudah diminati bisa mulai menawarkan karyanya. Periksa dulu setiap chatbot sebelum membeli — status <strong>Bersertifikat</strong> akan diberikan bertahap setelah kreator mengikuti workshop &amp; lulus sertifikasi Gustafta.
          </p>
        </div>

        {/* Alur Sertifikasi Creator */}
        <div className="max-w-3xl mx-auto mb-7">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Alur Sertifikasi Creator — Segera Hadir</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { step: "1", label: "Ikuti Workshop Gustafta Builder", icon: "🎓", color: "bg-blue-50 border-blue-200 text-blue-800" },
              { step: "→", label: "", icon: "", color: "" },
              { step: "2", label: "Lulus & Dapat Sertifikat", icon: "📜", color: "bg-green-50 border-green-200 text-green-800" },
              { step: "→", label: "", icon: "", color: "" },
              { step: "3", label: "Submit chatbot untuk review tim", icon: "🔍", color: "bg-amber-50 border-amber-200 text-amber-800" },
              { step: "→", label: "", icon: "", color: "" },
              { step: "4", label: "Disetujui → Tayang di Store", icon: "✅", color: "bg-violet-50 border-violet-200 text-violet-800" },
            ].map((s, i) =>
              s.label ? (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${s.color}`}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              ) : (
                <span key={i} className="text-gray-400 font-bold text-lg">→</span>
              )
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>Kurasi kerapian konfigurasi — bagian dari program sertifikasi</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>Pendampingan creator — hadir bersama workshop</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block"></span>Quality check untuk naik status Bersertifikat</div>
          </div>
          <div className="mt-4">
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20info%20Workshop%20Gustafta%20Builder%20untuk%20jadi%20Creator" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-300 bg-green-50 text-green-800 text-xs font-semibold hover:bg-green-100 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              Tanya info Workshop Gustafta Builder →
            </a>
          </div>
        </div>

        <p className="text-gray-600 max-w-xl mx-auto mb-5">
          Seperti domain dan hosting — chatbot dari Store dan Paket Berlangganan adalah dua hal yang <strong className="text-gray-900">saling melengkapi dan keduanya wajib</strong>.
        </p>

        {/* Domain-Hosting analogy cards */}
        <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-6">
          <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-left shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏷️</span>
              <span className="text-orange-800 font-semibold text-sm">Produk = Domain Anda</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">Beli sekali — ini yang Anda "miliki". Tanpa produk, tidak ada yang bisa dijalankan. Pilih dari Store di bawah.</p>
            <p className="text-xs text-orange-700 mt-2 font-semibold">↓ Biaya Aktivasi (sekali bayar)</p>
          </div>
          <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-left shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <span className="text-green-800 font-semibold text-sm">Berlangganan = Hosting-nya</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">Bayar rutin — ini yang "menjalankan" produk Anda. Tanpa berlangganan, produk tidak bisa aktif.</p>
            <p className="text-xs text-green-700 mt-2 font-semibold">→ <a href="/pricing" className="underline underline-offset-2 hover:text-green-800">Paket Berlangganan</a> (bulanan)</p>
          </div>
        </div>

        {/* Flow — tegas keduanya wajib */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 border border-gray-700 text-sm mb-7 shadow-sm">
          <span className="text-orange-300 font-medium">🏷️ Pilih Produk</span>
          <span className="text-gray-400">+</span>
          <span className="text-green-300 font-medium">⚡ Pilih Berlangganan</span>
          <span className="text-gray-400">=</span>
          <span className="text-white font-bold">✓ Platform Aktif</span>
        </div>

        {/* Featured product cards — Paket Bisnis AI & Series Modul */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-7">
          <a href="/pricing" className="group block text-left rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-100 p-5 hover:border-violet-500 hover:shadow-lg transition-all shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🔧</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-sm">Paket Bisnis AI</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-200 text-violet-800 border border-violet-300 font-medium">DIY — Anda Admin</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">Anda yang build & kelola sendiri. Beli chatbot di Store, pasang di dashboard, konfigurasi sesuai kebutuhan.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-violet-700 group-hover:text-violet-800 transition-colors font-semibold">
              Lihat Paket Bisnis AI <span>→</span>
            </div>
          </a>

          <a href="/packs" className="group block text-left rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-100 p-5 hover:border-blue-500 hover:shadow-lg transition-all shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-sm">Paket Series Modul</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 border border-blue-300 font-medium">Done-for-You</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">Pesan modul, kami yang setup & konfigurasi semuanya. Langsung pakai tanpa perlu urus teknisnya.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 group-hover:text-blue-800 transition-colors font-semibold">
              Lihat Series Modul <span>→</span>
            </div>
          </a>
        </div>

        {/* Harga chatbot bundle — 4 tier */}
        <div className="max-w-2xl mx-auto mb-7">
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-3 text-center">💡 Struktur Biaya Gustafta</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white border border-violet-200 px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-700">Biaya Aktivasi</p>
                  <p className="text-[11px] text-gray-400">Hak pakai chatbot — sekali bayar, install mandiri</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 line-through">{PRICING.license.normal}</p>
                  <p className="text-base font-bold text-violet-700">{PRICING.license.price}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white border border-orange-200 px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-700">Biaya Setup <span className="font-normal text-gray-400">(opsional)</span></p>
                  <p className="text-[11px] text-gray-400">Jasa konfigurasi oleh tim — lisensi sudah dihitung terpisah di atas</p>
                </div>
                <p className="text-base font-bold text-orange-600">{PRICING.setup.price}</p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white border border-emerald-200 px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-700">Biaya Berlangganan</p>
                  <p className="text-[11px] text-gray-400">Hosting & akses platform — bulanan</p>
                </div>
                <p className="text-base font-bold text-emerald-600">mulai {PRICING.subscription.starter.perMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider ke katalog chatbot */}
        <div className="flex items-center gap-3 max-w-2xl mx-auto mb-1">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">pilih chatbot bundle</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>
        <p className="text-xs text-gray-500 font-medium mb-6">{total > 0 ? `${total.toLocaleString("id-ID")} chatbot AI tersedia` : "Katalog chatbot AI siap pakai"}</p>

        <div className="flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Cari chatbot..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 shadow-sm"
              data-testid="input-search-store" />
          </div>
          <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 shadow-sm" data-testid="button-search">Cari</Button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 bg-gray-50 rounded-none">
        {/* Sidebar kategori */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Kategori</p>
          <div className="space-y-1">
            <button onClick={() => handleCategoryChange("")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${selectedCategory === "" ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              data-testid="filter-all">
              <span>Semua</span>
              <span className="text-xs opacity-60">{total.toLocaleString("id-ID")}</span>
            </button>
            {categories.map((cat) => (
              <button key={cat.category} onClick={() => handleCategoryChange(cat.category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${selectedCategory === cat.category ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                data-testid={`filter-cat-${cat.category}`}>
                <span className="truncate">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                <span className="text-xs opacity-60 ml-1 flex-shrink-0">{cat.count.toLocaleString("id-ID")}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Mobile category pills */}
        <div className="lg:hidden w-full">
          <div className="flex gap-2 flex-wrap mb-4">
            <button onClick={() => handleCategoryChange("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === "" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              Semua
            </button>
            {categories.map((cat) => (
              <button key={cat.category} onClick={() => handleCategoryChange(cat.category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.category ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {CATEGORY_LABELS[cat.category] || cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Grid utama */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {isLoading ? "Memuat..." : `${total.toLocaleString("id-ID")} chatbot`}
              {selectedCategory ? ` · ${CATEGORY_LABELS[selectedCategory] || selectedCategory}` : ""}
              {search ? ` · "${search}"` : ""}
            </p>
            <p className="text-xs text-gray-400">Hal. {page} / {pages}</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-20" />
              {search || selectedCategory ? (
                <>
                  <p className="text-lg font-medium text-gray-500 mb-1">Tidak ada chatbot yang cocok</p>
                  <p className="text-sm">Coba kata kunci atau kategori lain</p>
                  <Button variant="outline" size="sm" className="mt-4"
                    onClick={() => { setSearch(""); setSearchInput(""); setSelectedCategory(""); setPage(1); }}>
                    Reset Filter
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-500 mb-1">Belum ada produk yang tersedia</p>
                  <p className="text-sm">Produk chatbot akan segera hadir.</p>
                  <a href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors">
                    <Smartphone className="h-4 w-4" />Hubungi via WhatsApp
                  </a>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onBuy={handleBuy} onDetail={handleDetail} />
              ))}
              {page === 1 && !search && !selectedCategory && <CustomChatbotCard />}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="disabled:opacity-30" data-testid="button-prev-page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  let p = i + 1;
                  if (pages > 5) {
                    if (page <= 3) p = i + 1;
                    else if (page >= pages - 2) p = pages - 4 + i;
                    else p = page - 2 + i;
                  }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-violet-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                      data-testid={`button-page-${p}`}>{p}</button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="disabled:opacity-30" data-testid="button-next-page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400 mt-4 bg-white">
        <div className="flex items-center justify-center gap-4 mb-2">
          <a href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors" data-testid="link-wa-footer-1">
            <Smartphone className="h-3.5 w-3.5" />081287941900
          </a>
          <span className="text-gray-300">·</span>
          <a href="https://wa.me/6282299417818" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors" data-testid="link-wa-footer-2">
            082299417818
          </a>
        </div>
        <p>© 2026 Gustafta. AI Platform Konstruksi Indonesia.</p>
      </footer>

      {/* Detail Dialog */}
      <Dialog open={!!detailAgent} onOpenChange={(o) => !o && setDetailAgent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailAgent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `${detailAgent.color}18`, border: `1px solid ${detailAgent.color}35` }}>
                    {detailAgent.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-bold leading-snug mb-1">{detailAgent.name}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {CATEGORY_LABELS[detailAgent.category] || detailAgent.category}
                      </Badge>
                      {detailAgent.isOrchestrator && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-2 py-0 flex items-center gap-1">
                          <Layers className="h-2.5 w-2.5" />Multi-Agent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DialogDescription className="text-sm mt-2">
                  {detailAgent.tagline}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {(detailAgent.productSummary || detailAgent.description) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />Tentang Chatbot Ini
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {detailAgent.productSummary || detailAgent.description}
                    </p>
                  </div>
                )}

                {detailAgent.productProblem && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      🎯 Masalah yang Diselesaikan
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{detailAgent.productProblem}</p>
                  </div>
                )}

                {detailAgent.productUseCases && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      💡 Contoh Penggunaan
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{detailAgent.productUseCases}</p>
                  </div>
                )}

                {detailAgent.productTargetUser && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="flex-shrink-0 text-base">👥</span>
                    <span><span className="font-medium text-gray-600">Cocok untuk:</span> {detailAgent.productTargetUser}</span>
                  </div>
                )}

                {(detailAgent.productFeatures ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />Yang Bisa Dilakukan
                    </p>
                    <div className="space-y-2">
                      {(detailAgent.productFeatures ?? []).map((f, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-gray-400">Biaya Aktivasi</p>
                      {detailAgent.licenseClass ? (
                        <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                          data-testid={`badge-detail-kelas-premium-${detailAgent.id}`}>
                          <Sparkles className="h-2.5 w-2.5" />Kelas Premium {detailAgent.licenseClass}
                        </Badge>
                      ) : null}
                    </div>
                    {detailAgent.originalPrice && detailAgent.originalPrice > detailAgent.price && (
                      <p className="text-sm text-gray-400 line-through leading-none mb-0.5">{formatPrice(detailAgent.originalPrice)}</p>
                    )}
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(detailAgent.price)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Sekali bayar · install mandiri</p>
                  </div>
                  <Button onClick={() => handleBuy(detailAgent)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6"
                    data-testid={`button-buy-detail-${detailAgent.id}`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />Beli Sekarang
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base leading-snug">
              <span className="text-2xl flex-shrink-0">{selectedAgent?.emoji}</span>
              <span className="line-clamp-2">{selectedAgent?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedAgent?.tagline || "Chatbot AI siap pakai untuk industri konstruksi Indonesia."}
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4 mt-1">
              <div className="space-y-2">
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Biaya Aktivasi</p>
                    <p className="text-[11px] text-gray-400">Sekali bayar · install mandiri</p>
                  </div>
                  <span className="text-xl font-bold text-violet-600">{formatPrice(selectedAgent.price)}</span>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Biaya Setup <span className="font-normal text-gray-400">(opsional)</span></p>
                    <p className="text-[11px] text-gray-400">Jasa konfigurasi oleh tim — lisensi sudah dihitung terpisah di atas</p>
                  </div>
                  <span className="text-base font-bold text-orange-600">{PRICING.setup.price}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="buy-name" className="text-sm">Nama Lengkap *</Label>
                  <Input id="buy-name" value={buyForm.name}
                    onChange={(e) => setBuyForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nama Anda"
                    className="mt-1"
                    data-testid="input-buy-name" />
                </div>
                <div>
                  <Label htmlFor="buy-email" className="text-sm">
                    Email * <span className="text-gray-400 font-normal">(bukan nomor HP)</span>
                  </Label>
                  <Input id="buy-email" type="email" value={buyForm.email}
                    onChange={(e) => setBuyForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="contoh: nama@gmail.com"
                    className={`mt-1 ${
                      buyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email)
                        ? "border-red-400 focus-visible:ring-red-400"
                        : ""
                    }`}
                    data-testid="input-buy-email" />
                  {buyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email) ? (
                    <p className="text-xs text-red-500 mt-1">Format email tidak valid. Contoh: nama@gmail.com</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Link akses chatbot akan dikirim ke email ini</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="buy-phone" className="text-sm">No. HP / WhatsApp</Label>
                  <Input id="buy-phone" value={buyForm.phone}
                    onChange={(e) => setBuyForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Contoh: 082299417818"
                    className="mt-1"
                    data-testid="input-buy-phone" />
                </div>
              </div>

              <Button onClick={handleSubmitOrder} disabled={createOrderMutation.isPending}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-semibold"
                data-testid="button-confirm-purchase">
                {createOrderMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
                ) : (
                  <><ShoppingCart className="h-4 w-4 mr-2" />Bayar {formatPrice(selectedAgent.price)}</>
                )}
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

function CustomChatbotCard() {
  const WA_NUMBER = "6282299417818";
  const waMsg = encodeURIComponent(
    "Halo, saya ingin memesan *Chatbot Custom* sesuai kebutuhan bisnis saya.\n\nMohon informasi lebih lanjut mengenai proses dan harga."
  );
  return (
    <Card className="bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border-violet-500/30 hover:border-violet-400/60 hover:from-violet-900/50 hover:to-indigo-900/50 transition-all group flex flex-col"
      data-testid="card-custom-chatbot">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-violet-500/20 border border-violet-500/30">
            🛠️
          </div>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs px-2 py-0 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />Kustom
          </Badge>
        </div>

        <h3 className="font-semibold text-white text-sm leading-snug mb-1 group-hover:text-violet-300 transition-colors">
          Chatbot Kustom — Sesuai Kebutuhan Anda
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed mb-3">
          Chatbot yang tidak ada di katalog? Tim kami siap membangun, mengkonfigurasi, dan menginstal chatbot AI sepenuhnya sesuai alur bisnis Anda.
        </p>

        <div className="space-y-1.5 mb-3 flex-1">
          {[
            "Topik & domain bebas sesuai permintaan",
            "Setup & instalasi dikerjakan tim Gustafta",
            "Knowledge Base diisi dari dokumen Anda",
            "Siap pakai tanpa perlu keahlian teknis",
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-violet-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-400">{f}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-violet-500/15 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500">Harga</p>
            <p className="text-sm font-bold text-violet-300">Sesuai Kebutuhan</p>
          </div>
          <a href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`} onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
            <Button size="sm"
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-3 flex-shrink-0 gap-1.5"
              data-testid="button-custom-chatbot-wa">
              <MessageCircle className="h-3.5 w-3.5" />Hubungi Kami
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function getChatbotTier(agentCount?: number): { label: string; className: string } {
  const n = agentCount ?? 2;
  if (n >= 11) return { label: "Enterprise",   className: "bg-purple-100 text-purple-700 border-purple-200" };
  if (n >= 6)  return { label: "Advanced",     className: "bg-blue-100 text-blue-700 border-blue-200" };
  if (n >= 4)  return { label: "Profesional",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  return       { label: "Basic",               className: "bg-gray-100 text-gray-600 border-gray-200" };
}

function AgentCard({ agent, onBuy, onDetail }: { agent: AgentProduct; onBuy: (a: AgentProduct) => void; onDetail: (a: AgentProduct) => void }) {
  const categoryLabel = CATEGORY_LABELS[agent.category] || agent.category;
  const hasDetail = !!(agent.productSummary || agent.description || (agent.productFeatures ?? []).length > 0);
  const tier = getChatbotTier(agent.agentCount);

  return (
    <Card className="bg-white border-gray-200 hover:border-violet-400 hover:shadow-md transition-all group flex flex-col"
      data-testid={`card-agent-${agent.id}`}>
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}>
            {agent.emoji}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs px-2 py-0">{categoryLabel}</Badge>
            <Badge className={`text-xs px-2 py-0 border ${tier.className}`}>
              {tier.label}
            </Badge>
            {agent.isCertified ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-0 flex items-center gap-1"
                data-testid={`badge-bersertifikat-${agent.id}`} title="Kreator telah lulus workshop & sertifikasi Gustafta.">
                <ShieldCheck className="h-2.5 w-2.5" />Bersertifikat
              </Badge>
            ) : agent.isCreatorMade && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-2 py-0 flex items-center gap-1"
                data-testid={`badge-pra-sertifikasi-${agent.id}`} title="Dibuat kreator independen — belum bersertifikat. Periksa dulu sebelum membeli.">
                <ShieldAlert className="h-2.5 w-2.5" />Pra-Sertifikasi
              </Badge>
            )}
            {agent.licenseClass ? (
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs px-2 py-0 flex items-center gap-1"
                data-testid={`badge-kelas-premium-${agent.id}`} title="Band harga lisensi premium (sekali bayar).">
                <Sparkles className="h-2.5 w-2.5" />Kelas Premium {agent.licenseClass}
              </Badge>
            ) : null}
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
                <CheckCircle2 className="h-3 w-3 text-violet-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600 line-clamp-1">{f}</span>
              </div>
            ))}
            {(agent.productFeatures ?? []).length > 3 && (
              <p className="text-xs text-gray-500 pl-4">+{(agent.productFeatures ?? []).length - 3} lainnya</p>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              {agent.originalPrice && agent.originalPrice > agent.price && (
                <span className="text-xs text-gray-400 line-through leading-none mb-0.5">{formatPrice(agent.originalPrice)}</span>
              )}
              <span className="font-bold text-gray-900 text-base">{formatPrice(agent.price)}</span>
            </div>
            <div className="flex gap-1.5">
              {hasDetail && (
                agent.agentId ? (
                  <a href={`/product/${agent.agentId}`} data-testid={`link-detail-${agent.id}`}>
                    <Button size="sm" variant="ghost"
                      className="text-gray-400 hover:text-violet-700 text-xs h-8 px-2.5">
                      Detail
                    </Button>
                  </a>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => onDetail(agent)}
                    className="text-gray-400 hover:text-gray-700 text-xs h-8 px-2.5"
                    data-testid={`button-detail-${agent.id}`}>
                    Detail
                  </Button>
                )
              )}
              <Button size="sm" onClick={() => onBuy(agent)}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 px-3 flex-shrink-0"
                data-testid={`button-buy-${agent.id}`}>
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Beli
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
