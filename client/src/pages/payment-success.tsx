import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Bot, ArrowRight, Sparkles } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pembayaran Berhasil!</CardTitle>
          <CardDescription className="text-base">
            Terima kasih! Langganan Anda sudah aktif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">Yang bisa Anda lakukan sekarang:</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Buat chatbot AI untuk bisnis Anda
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Upload knowledge base untuk melatih chatbot
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Integrasikan dengan WhatsApp, Telegram, dan lainnya
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pantau performa dengan analytics dashboard
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                <Bot className="mr-2 h-4 w-4" />
                Mulai Buat Chatbot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline" className="w-full">
                Lihat Status Langganan
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Anda akan diarahkan ke dashboard dalam 10 detik...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
