import { Link } from "wouter";
import { Lock, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialLockOverlayProps {
  feature?: string;
  description?: string;
}

export function TrialLockOverlay({ feature, description }: TrialLockOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-background/80 rounded-xl p-6 text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-foreground">
          {feature ? `${feature} — Fitur Berbayar` : "Fitur Berbayar"}
        </div>
        <div className="text-sm text-muted-foreground max-w-xs">
          {description ?? "Upgrade ke paket berbayar untuk mengakses fitur ini."}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href="/onboarding">
          <Button size="sm" className="gap-2">
            <Rocket className="w-4 h-4" /> Lihat Paket
          </Button>
        </Link>
        <Link href="/konsultasi">
          <Button size="sm" variant="outline" className="gap-2">
            <MessageCircle className="w-4 h-4" /> Coba Trial Gratis
          </Button>
        </Link>
      </div>
    </div>
  );
}
