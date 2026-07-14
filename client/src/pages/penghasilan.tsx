import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet, Coins, Clock, Store, ShoppingBag, TrendingUp,
  ArrowRight, Handshake, Package,
} from "lucide-react";

interface Earnings {
  stats: {
    totalOrders: number;
    paidCount: number;
    pendingCount: number;
    paidEarned: number;
    pendingEarned: number;
    listedCount: number;
  };
  recentOrders: {
    id: number;
    itemName: string;
    amount: number;
    creatorShare: number;
    status: string;
    createdAt: string;
  }[];
}

function rupiah(n: number) {
  return "Rp " + (n ?? 0).toLocaleString("id-ID");
}

function fmtDate(s: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Cair",
  completed: "Cair",
  pending: "Menunggu",
};

export default function Penghasilan() {
  const { data, isLoading, isError } = useQuery<Earnings>({ queryKey: ["/api/earnings"] });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-500/30 border-t-rose-400 animate-spin" />
        <p className="text-slate-400 text-sm">Memuat penghasilan…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-400" data-testid="text-earnings-error">
          Gagal memuat penghasilan. Silakan login terlebih dahulu untuk melihat pendapatan Anda.
        </p>
        <Button asChild variant="outline"><Link href="/os">Kembali ke Gustafta OS</Link></Button>
      </div>
    );
  }

  const { stats, recentOrders } = data;
  const isEmpty = stats.totalOrders === 0 && stats.listedCount === 0;

  const statCards = [
    { label: "Penghasilan Cair", value: rupiah(stats.paidEarned), icon: <Coins className="h-4 w-4" />, testid: "stat-paid-earned" },
    { label: "Menunggu Cair", value: rupiah(stats.pendingEarned), icon: <Clock className="h-4 w-4" />, testid: "stat-pending-earned" },
    { label: "Total Penjualan", value: String(stats.totalOrders), icon: <ShoppingBag className="h-4 w-4" />, testid: "stat-total-orders" },
    { label: "Produk di Toko", value: String(stats.listedCount), icon: <Store className="h-4 w-4" />, testid: "stat-listed" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" data-testid="text-page-title">Penghasilan Kreator</h1>
            <p className="text-slate-400 text-sm">Bagi hasil 80/20 dari lisensi produk Anda di marketplace — terkumpul otomatis.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-slate-700">
            <Link href="/os">Gustafta OS</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="bg-slate-900 border-slate-800" data-testid={s.testid}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">{s.icon}{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isEmpty && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center space-y-4">
              <Wallet className="h-10 w-10 text-rose-400 mx-auto" />
              <div>
                <p className="font-semibold text-lg">Belum ada penghasilan</p>
                <p className="text-slate-400 text-sm mt-1">
                  Terbitkan chatbot buatan Anda di Gustafta Store. Setiap lisensi yang terjual memberi Anda 80% — dan muncul otomatis di sini.
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button asChild className="bg-rose-600 hover:bg-rose-700"><Link href="/store" data-testid="button-goto-store">Buka Gustafta Store</Link></Button>
                <Button asChild variant="outline" className="border-slate-700"><Link href="/dashboard" data-testid="button-goto-dashboard">Kelola Chatbot</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info bagi hasil */}
        {!isEmpty && (
          <Card className="bg-gradient-to-br from-rose-500/10 to-slate-900 border-rose-500/20">
            <CardContent className="p-4 flex items-start gap-3 text-sm text-slate-300">
              <Coins className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <p>
                Anda menerima <span className="font-semibold text-rose-300">80% dari biaya lisensi</span> setiap produk yang terjual.
                Biaya bulanan (hosting &amp; token) sepenuhnya dikelola Gustafta dan tidak termasuk di sini.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-rose-400" /> Penjualan Terbaru</h2>
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <Card key={o.id} className="bg-slate-900 border-slate-800" data-testid={`order-item-${o.id}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug truncate">{o.itemName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{fmtDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm text-rose-300" data-testid={`order-share-${o.id}`}>{rupiah(o.creatorShare)}</p>
                      <Badge className={`${STATUS_TONE[o.status] || "bg-slate-700 text-slate-300 border-slate-600"} text-xs mt-1`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Next steps */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-rose-400" /> Tingkatkan Penghasilan</CardTitle></CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Button asChild variant="outline" className="border-slate-700"><Link href="/store" data-testid="button-more-store"><Store className="h-4 w-4 mr-2" /> Terbitkan Produk Baru <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
            <Button asChild variant="outline" className="border-slate-700"><Link href="/affiliate" data-testid="button-goto-affiliate"><Handshake className="h-4 w-4 mr-2" /> Program Afiliasi <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
