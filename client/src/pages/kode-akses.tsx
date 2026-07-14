import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Ticket, Lock, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function KodeAksesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ plan?: string; endDate?: string } | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Aktivasi Kode Akses Peserta | Gustafta";
    return () => { document.title = prev; };
  }, []);

  const redeem = async () => {
    const c = code.trim();
    if (!c) {
      toast({ title: "Masukkan kode", description: "Isi kode akses peserta Anda.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/access-codes/redeem", { code: c });
      setDone({ plan: data.plan, endDate: data.endDate });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      toast({ title: "Kode berhasil ditukarkan", description: data.message });
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message || "Kode tidak dapat digunakan.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="max-w-md mx-auto text-center py-24 px-4" data-testid="gate-login">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Masuk untuk Aktivasi Kode</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Kode akses peserta mengaktifkan langganan di akun Anda, jadi masuk dulu ya.</p>
          <Link href="/login">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="btn-login">
              Masuk <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-kode-akses">
      <SharedHeader />
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mx-auto mb-5">
            <Ticket className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Aktivasi Kode Akses Peserta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Punya kode bonus dari seminar/acara? Masukkan di sini untuk membuka akses Gustafta.
          </p>
        </div>

        {done ? (
          <Card className="border-2 border-emerald-300 dark:border-emerald-700" data-testid="card-redeem-success">
            <CardContent className="pt-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Akses Aktif!</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Paket <span className="font-semibold capitalize">{done.plan}</span> Anda sudah aktif
                {done.endDate ? ` sampai ${new Date(done.endDate).toLocaleDateString("id-ID")}` : ""}.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="button-go-dashboard">
                  <Link href="/dashboard">Buka Dashboard <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="gap-2" data-testid="button-go-konstruksi">
                  <Link href="/paket-konstruksi"><Sparkles className="h-4 w-4" /> Paket Konstruksi</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") redeem(); }}
                placeholder="Mis. INDOBUILDTECH2026"
                className="text-center font-mono tracking-wider uppercase"
                data-testid="input-access-code"
              />
              <Button onClick={redeem} disabled={busy} className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-redeem">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />} Aktifkan Kode
              </Button>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Setiap kode hanya bisa ditukarkan sekali per akun. Butuh bantuan? Hubungi panitia acara.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
