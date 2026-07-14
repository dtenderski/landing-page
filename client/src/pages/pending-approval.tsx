import { useEffect } from "react";
import { trackLead } from "@/lib/meta-pixel";
import { Bot, ShieldOff, MessageSquare, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
  useEffect(() => {
    document.title = "Akun Dinonaktifkan — Gustafta";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-indigo-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">Gustafta</span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-5">
            <ShieldOff className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Akun Tidak Dapat Diakses
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Akun Anda saat ini tidak aktif. Ini bisa terjadi karena pelanggaran
            ketentuan layanan atau permintaan admin. Hubungi tim Gustafta untuk
            informasi lebih lanjut.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20akun%20saya%20tidak%20bisa%20diakses.%20Mohon%20bantuannya." onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-wa-blocked"
            >
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                <MessageSquare className="h-4 w-4" />
                Hubungi via WhatsApp
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a
              href="mailto:admin@gustafta.my.id?subject=Akun%20Gustafta%20Tidak%20Aktif"
              data-testid="link-email-blocked"
            >
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Kirim Email ke Admin
              </Button>
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Akun sudah dipulihkan?{" "}
          <a href="/login" className="text-primary hover:underline">
            Coba login ulang
          </a>{" "}
          atau{" "}
          <a href="/api/logout" className="text-muted-foreground hover:text-foreground hover:underline">
            keluar
          </a>
        </p>
      </div>
    </div>
  );
}
