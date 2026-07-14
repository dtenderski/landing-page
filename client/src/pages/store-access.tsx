import { useParams } from "wouter";
import { trackLead } from "@/lib/meta-pixel";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Bot, MessageSquare, Copy, CheckCircle2, ExternalLink,
  Smartphone, Code2, Globe, Zap, Package, BookOpen, AlertTriangle
} from "lucide-react";
import { useState } from "react";

interface StoreAccessData {
  order: {
    id: number;
    customerName: string;
    status: string;
    amount: number;
  };
  product: {
    id: number;
    name: string;
    emoji: string;
    color: string;
    description: string;
    agentId: number | null;
  };
  chatUrl: string | null;
  embedCode: string | null;
  widgetScript: string | null;
  baseUrl: string | null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

function CopyBox({ label, value, testId }: { label: string; value: string; testId: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <pre className="flex-1 bg-gray-900 rounded-lg px-3 py-2.5 text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {value}
        </pre>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 flex-shrink-0 self-start mt-0"
          onClick={handleCopy}
          data-testid={testId}
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/**
 * Rewrite a full URL to use the current browser's origin.
 * Example: "https://xxx.replit.dev/chatbot/slug" → "https://myapp.replit.app/chatbot/slug"
 * This ensures delivery links always reflect the domain the customer is actually using.
 */
function rewriteToCurrentOrigin(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/**
 * Replace the domain inside a code snippet (embedCode / widgetScript).
 * Replaces any http(s)://xxx domain with the current browser origin.
 */
function rewriteDomainInCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.replace(/https?:\/\/[^\s"']+\.replit\.(dev|app)/g, window.location.origin)
             .replace(/https?:\/\/localhost:\d+/g, window.location.origin);
}

export default function StoreAccess() {
  const { token } = useParams<{ token: string }>();
  const [activeFormat, setActiveFormat] = useState<"chat" | "iframe" | "widget">("chat");

  const { data, isLoading, isError } = useQuery<StoreAccessData>({
    queryKey: ["/api/store/access", token],
    queryFn: async () => {
      const res = await fetch(`/api/store/access/${token}`);
      if (!res.ok) throw new Error("Akses tidak valid");
      return res.json();
    },
    enabled: !!token,
  });

  // Rewrite all delivery URLs to use the current browser's domain.
  // When customer opens this page from the deployed .replit.app link, all
  // chatbot links will automatically use the production domain — no config needed.
  const chatUrl = rewriteToCurrentOrigin(data?.chatUrl);
  const embedCode = rewriteDomainInCode(data?.embedCode);
  const widgetScript = rewriteDomainInCode(data?.widgetScript);

  const currentOrigin = window.location.origin;
  const isDevUrl = currentOrigin.includes(".replit.dev") || currentOrigin.includes("localhost");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Gustafta</span>
              <span className="ml-2 text-xs text-violet-400 font-medium">STORE</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <a href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">081287941900</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3 bg-white/10" />
            <Skeleton className="h-48 w-full bg-white/10" />
            <Skeleton className="h-32 w-full bg-white/10" />
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2 text-red-400">Akses Tidak Valid</h1>
            <p className="text-gray-400 mb-6">Link akses tidak ditemukan atau sudah kadaluarsa.</p>
            <a href="/store">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Kembali ke Toko
              </Button>
            </a>
          </div>
        ) : data && data.order.status !== "paid" ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold mb-2 text-yellow-400">Pembayaran Diproses</h1>
            <p className="text-gray-400 mb-6">
              Pembayaran Anda sedang diverifikasi. Halaman ini akan aktif setelah pembayaran berhasil dikonfirmasi.
            </p>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.location.reload()}
            >
              Cek Lagi
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-6">

            {/* ── Dev URL Warning ── */}
            {isDevUrl && (
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-amber-300">Anda membuka halaman ini dari URL development</p>
                  <p className="text-xs text-amber-200/80">
                    Link di bawah menggunakan domain <code className="bg-white/10 px-1 rounded">.replit.dev</code> yang tidak stabil dan bisa berubah.
                    <strong className="block mt-1 text-amber-200">
                      Solusi: Kirim link halaman ini ke customer melalui URL deployed (bukan preview dev).
                      Ketika customer membuka dari domain production, semua link otomatis menggunakan domain yang benar.
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* ── Success Banner ── */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Chatbot Anda Siap!</h1>
              <p className="text-gray-400">
                Halo <strong>{data.order.customerName}</strong>, berikut semua format akses chatbot Anda.
              </p>
            </div>

            {/* ── Product Card ── */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `${data.product.color}25`, border: `1px solid ${data.product.color}40` }}
                >
                  {data.product.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold">{data.product.name}</h2>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">✓ Lunas</Badge>
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">{data.product.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatPrice(data.order.amount)}</p>
                </div>
              </CardContent>
            </Card>

            {/* ── Kemasan Produk: 4 Format ── */}
            {chatUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-violet-400" />
                  <h3 className="font-bold text-base">Kemasan Produk — Pilih Format Akses</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Chatbot Anda bisa diakses dalam 3 format berbeda. Pilih sesuai kebutuhan.
                </p>

                {/* Format selector tabs */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveFormat("chat")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeFormat === "chat"
                        ? "bg-violet-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                    }`}
                    data-testid="tab-format-chat"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Link Halaman Chat
                  </button>
                  <button
                    onClick={() => setActiveFormat("iframe")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeFormat === "iframe"
                        ? "bg-violet-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                    }`}
                    data-testid="tab-format-iframe"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Embed di Website (iFrame)
                  </button>
                  <button
                    onClick={() => setActiveFormat("widget")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeFormat === "widget"
                        ? "bg-violet-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                    }`}
                    data-testid="tab-format-widget"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Widget Floating (Tombol Chat)
                  </button>
                </div>

                {/* Format: Link Chat */}
                {activeFormat === "chat" && (
                  <Card className="bg-violet-500/10 border-violet-500/30">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-4 w-4 text-violet-400" />
                          <h4 className="font-semibold">Format 1 — Link Halaman Chat</h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          Berikan link ini ke customer. Customer bisa langsung chat dengan AI tanpa perlu login.
                          Cocok untuk dibagikan via WA, email, atau QR code.
                        </p>
                        <CopyBox
                          label="Link Chatbot (bagikan ke customer)"
                          value={chatUrl!}
                          testId="button-copy-chat-url"
                        />
                      </div>
                      <a href={chatUrl!} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-violet-600 hover:bg-violet-700" data-testid="button-open-chat">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Buka Chatbot Sekarang (Test)
                        </Button>
                      </a>
                      <div className="rounded-lg bg-white/5 p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-300">Cara bagikan:</p>
                        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                          <li>Salin link → kirim via WhatsApp ke customer</li>
                          <li>Buat QR code dari link ini (pakai qr-code-generator.com)</li>
                          <li>Tambahkan sebagai link di bio Instagram/profil bisnis</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Format: iFrame Embed */}
                {activeFormat === "iframe" && embedCode && (
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Code2 className="h-4 w-4 text-blue-400" />
                          <h4 className="font-semibold">Format 2 — Embed iFrame di Website</h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          Salin kode ini dan paste di halaman HTML website Anda. Chatbot akan tampil
                          sebagai kotak chat langsung di dalam halaman — cocok untuk halaman layanan atau FAQ.
                        </p>
                        <CopyBox
                          label="Kode iFrame (paste di HTML website)"
                          value={embedCode}
                          testId="button-copy-embed"
                        />
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-300">Cara pasang:</p>
                        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                          <li>Buka editor HTML website Anda (WordPress, Webflow, custom, dll)</li>
                          <li>Paste kode ini di posisi di mana chatbot ingin ditampilkan</li>
                          <li>Ganti <code className="bg-white/10 px-1 rounded">width="100%"</code> dan <code className="bg-white/10 px-1 rounded">height="600"</code> sesuai kebutuhan layout</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Format: Widget Floating */}
                {activeFormat === "widget" && widgetScript && (
                  <Card className="bg-emerald-500/10 border-emerald-500/30">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-emerald-400" />
                          <h4 className="font-semibold">Format 3 — Widget Floating (Tombol Chat Sudut Halaman)</h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          Salin kode ini dan paste sebelum tag <code className="bg-white/10 px-1 rounded">&lt;/body&gt;</code> di semua halaman website.
                          Tombol chat akan muncul mengambang di sudut kanan bawah — seperti tombol chat WhatsApp yang sudah umum.
                        </p>
                        <CopyBox
                          label="Kode Widget (paste sebelum </body>)"
                          value={widgetScript}
                          testId="button-copy-widget"
                        />
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-300">Cara pasang:</p>
                        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                          <li>Buka template/header website Anda</li>
                          <li>Paste kode ini tepat sebelum tag <code className="bg-white/10 px-1 rounded">&lt;/body&gt;</code></li>
                          <li>Refresh website → tombol chat akan muncul di sudut kanan bawah</li>
                          <li>Ganti <code className="bg-white/10 px-1 rounded">data-color</code> jika ingin ubah warna tombol</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── Panduan Singkat ── */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold">Ringkasan Kemasan Produk</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-center">
                    <Globe className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-violet-300 mb-1">Link Chat</p>
                    <p className="text-xs text-gray-400">Bagikan via WA/email. Customer buka langsung di browser.</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                    <Code2 className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-blue-300 mb-1">Embed iFrame</p>
                    <p className="text-xs text-gray-400">Pasang di halaman website. Chatbot tampil di dalam halaman.</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                    <MessageSquare className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-300 mb-1">Widget Floating</p>
                    <p className="text-xs text-gray-400">Tombol chat mengambang di sudut website — paling populer.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Support ── */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5 text-center">
                <Zap className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                <p className="text-gray-300 text-sm font-medium mb-1">Butuh bantuan pasang atau setup?</p>
                <p className="text-gray-500 text-xs mb-3">Tim Gustafta siap bantu melalui WhatsApp.</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <a href="https://wa.me/6281287941900?text=Halo%2C%20saya%20baru%20beli%20chatbot%20dari%20Gustafta%20Store%20dan%20butuh%20bantuan%20pasang." onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto" data-testid="button-wa-support-1">
                      <Smartphone className="h-4 w-4 mr-2" />
                      WA 081287941900
                    </Button>
                  </a>
                  <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20baru%20beli%20chatbot%20dari%20Gustafta%20Store%20dan%20butuh%20bantuan%20pasang." onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto" data-testid="button-wa-support-2">
                      <Smartphone className="h-4 w-4 mr-2" />
                      WA 082299417818
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <a href="/store" className="text-sm text-violet-400 hover:underline">
                ← Kembali ke Toko
              </a>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-600">
        © 2026 Gustafta. AI Platform Konstruksi Indonesia.
      </footer>
    </div>
  );
}
