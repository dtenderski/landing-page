import { Link } from "wouter";
import { trackLead } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useUserSubscription, formatCurrency, formatDate, getDaysRemaining } from "@/hooks/use-subscription";
import { useGustaftaAssistant } from "@/hooks/use-agents";
import { ChatPopup } from "@/components/chat-popup";
import { SharedHeader } from "@/components/shared-header";
import { 
  Bot, Crown, Zap, Calendar, CreditCard, Clock, 
  MessageSquare, FileText, ArrowRight, AlertCircle,
  CheckCircle2, XCircle, RefreshCw
} from "lucide-react";

const planDetails: Record<string, { name: string; icon: typeof Zap; color: string }> = {
  free_trial: { name: "Free Trial", icon: Zap, color: "text-yellow-500" },
  monthly_1: { name: "1 Bulan", icon: Crown, color: "text-blue-500" },
  monthly_3: { name: "3 Bulan", icon: Crown, color: "text-purple-500" },
  monthly_6: { name: "6 Bulan", icon: Crown, color: "text-indigo-500" },
  monthly_12: { name: "12 Bulan", icon: Crown, color: "text-primary" },
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Aktif
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 gap-1">
          <Clock className="h-3 w-3" />
          Menunggu Pembayaran
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 gap-1">
          <XCircle className="h-3 w-3" />
          Kadaluarsa
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Dibatalkan
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Subscription() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: subscription, isLoading: subLoading } = useUserSubscription(user?.id);
  const { data: gustaftaAssistant } = useGustaftaAssistant();

  const isLoading = authLoading || subLoading;
  const planInfo = subscription ? planDetails[subscription.plan] || planDetails.free_trial : null;
  const daysRemaining = subscription?.endDate ? getDaysRemaining(subscription.endDate) : 0;
  const totalDays = subscription?.startDate && subscription?.endDate 
    ? Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const progressPercent = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Login Diperlukan</CardTitle>
            <CardDescription>
              Silakan login untuk melihat status langganan Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.href = "/login"}>
              Login dengan Replit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Langganan Saya</h1>
          <p className="text-muted-foreground">
            Kelola paket langganan dan lihat status pembayaran Anda.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Memuat data langganan...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : subscription ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {planInfo && (
                      <div className={`h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ${planInfo.color}`}>
                        <planInfo.icon className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">
                        Paket {planInfo?.name || subscription.plan}
                      </CardTitle>
                      <CardDescription>
                        {subscription.chatbotLimit} Chatbot
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={subscription.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscription.status === "active" && subscription.endDate && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Masa berlaku</span>
                      <span className="font-medium">{daysRemaining} hari tersisa</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mulai</p>
                      <p className="font-medium">
                        {subscription.startDate 
                          ? formatDate(subscription.startDate) 
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Berakhir</p>
                      <p className="font-medium">
                        {subscription.endDate 
                          ? formatDate(subscription.endDate) 
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                      <p className="font-medium">
                        {formatCurrency(subscription.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Limit Chatbot</p>
                      <p className="font-medium">
                        {subscription.chatbotLimit} chatbot
                      </p>
                    </div>
                  </div>
                </div>

                {subscription.status === "pending" && (
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-600 dark:text-yellow-400">
                          Menunggu Konfirmasi Pembayaran
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Silakan transfer ke salah satu rekening di bawah ini lalu konfirmasi via WhatsApp.
                        </p>
                        <div className="mt-3 space-y-2">
                          {[
                            { bank: "BCA", noRek: "1234567890", atas: "PT Gustafta Teknologi" },
                            { bank: "Mandiri", noRek: "0987654321", atas: "PT Gustafta Teknologi" },
                            { bank: "BRI", noRek: "1122334455", atas: "PT Gustafta Teknologi" },
                          ].map((b) => (
                            <div key={b.bank} className="text-sm bg-background/60 rounded px-3 py-2 border">
                              <span className="font-semibold">{b.bank}</span>: {b.noRek} a/n {b.atas}
                            </div>
                          ))}
                        </div>
                        <a
                          href="https://wa.me/628123456789?text=Konfirmasi%20Pembayaran%20Gustafta" onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="mt-3" size="sm" variant="outline">
                            Konfirmasi via WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {(subscription.status === "expired" || (daysRemaining <= 7 && subscription.status === "active")) && (
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          {subscription.status === "expired" 
                            ? "Langganan Kadaluarsa" 
                            : "Langganan Akan Segera Berakhir"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {subscription.status === "expired"
                            ? "Perpanjang langganan untuk terus menggunakan Gustafta."
                            : `Langganan Anda akan berakhir dalam ${daysRemaining} hari. Perpanjang sekarang untuk tetap aktif.`}
                        </p>
                        <Link href="/pricing">
                          <Button className="mt-3" size="sm">
                            Perpanjang Langganan
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Transaksi</CardTitle>
                <CardDescription>
                  Daftar pembayaran yang telah dilakukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{planInfo?.name || subscription.plan}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(subscription.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(subscription.amount)}</p>
                      <StatusBadge status={subscription.status} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Paket
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto">
                  <Bot className="mr-2 h-4 w-4" />
                  Ke Dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Belum Ada Langganan</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Anda belum memiliki langganan aktif. Mulai dengan free trial 7 hari atau pilih paket yang sesuai kebutuhan Anda.
              </p>
              <Link href="/pricing">
                <Button size="lg">
                  <Zap className="mr-2 h-4 w-4" />
                  Lihat Paket Langganan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-8 border-t mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold">Gustafta</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Gustafta. AI Project Intelligence Platform.
            </p>
          </div>
        </div>
      </footer>

      {gustaftaAssistant && (
        <ChatPopup agent={gustaftaAssistant} />
      )}
    </div>
  );
}
