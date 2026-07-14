import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useClawPackages, type ClawPackage } from "@/hooks/use-claw-packages";
import {
  ArrowLeft, CheckCircle2, Lock, Crown, LayoutGrid, Zap,
  GraduationCap, Building2, HardHat, Globe, Shield, Home,
  Briefcase, TrendingUp, BookOpen, LogIn, ArrowRight, Cpu,
} from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Building2: <Building2 className="h-6 w-6" />,
  HardHat: <HardHat className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Home: <Home className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
};

const COLOR_CARD: Record<string, string> = {
  indigo:  "border-indigo-500/30 hover:border-indigo-500/60",
  sky:     "border-sky-500/30 hover:border-sky-500/60",
  red:     "border-red-500/30 hover:border-red-500/60",
  teal:    "border-teal-500/30 hover:border-teal-500/60",
  green:   "border-green-500/30 hover:border-green-500/60",
  violet:  "border-violet-500/30 hover:border-violet-500/60",
  orange:  "border-orange-500/30 hover:border-orange-500/60",
  emerald: "border-emerald-500/30 hover:border-emerald-500/60",
  rose:    "border-rose-500/30 hover:border-rose-500/60",
  cyan:    "border-cyan-500/30 hover:border-cyan-500/60",
};

const COLOR_ICON: Record<string, string> = {
  indigo:  "bg-indigo-500/15 text-indigo-300",
  sky:     "bg-sky-500/15 text-sky-300",
  red:     "bg-red-500/15 text-red-300",
  teal:    "bg-teal-500/15 text-teal-300",
  green:   "bg-green-500/15 text-green-300",
  violet:  "bg-violet-500/15 text-violet-300",
  orange:  "bg-orange-500/15 text-orange-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  rose:    "bg-rose-500/15 text-rose-300",
  cyan:    "bg-cyan-500/15 text-cyan-300",
};

export default function PaketBidangPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { info, isLoading } = useClawPackages();
  const { toast } = useToast();
  const [picked, setPicked] = useState<string[]>([]);

  const saveMutation = useMutation({
    mutationFn: async (packages: string[]) => {
      const res = await apiRequest("POST", "/api/claw-packages/select", { packages });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claw-packages/my"] });
      toast({ title: "Paket bidang tersimpan", description: "Claw di paket pilihan Anda sudah terbuka." });
    },
    onError: (err: any) => {
      toast({
        title: "Gagal menyimpan",
        description: err?.message?.replace(/^\d+:\s*/, "") || "Coba lagi atau hubungi admin.",
        variant: "destructive",
      });
    },
  });

  const allowance = info.allowance;
  const isAllAccess = allowance === "all";
  const slots = typeof allowance === "number" && allowance > 0 ? allowance : info.slots;
  const hasSelection = info.selected.length > 0;
  const canPick = isAuthenticated && typeof allowance === "number" && allowance > 0 && !hasSelection;

  const togglePick = (id: string) => {
    if (!canPick) return;
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < slots ? [...prev, id] : prev
    );
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 bg-[#080810]/90 backdrop-blur">
        <Link href="/multiclaw">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white gap-1.5 -ml-2" data-testid="button-back-multiclaw">
            <ArrowLeft className="h-4 w-4" />Direktori
          </Button>
        </Link>
        <div className="flex-1" />
        <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25 gap-1.5">
          <LayoutGrid className="h-3 w-3" />{info.packages.length} Paket Bidang
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12 pb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 mb-5">
            <LayoutGrid className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Paket MultiClaw per Bidang
          </h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Paket Profesional memberi jatah memilih {info.slots} paket bidang. Paket Bisnis & Enterprise membuka semua bidang otomatis. Claw dasar (SBU, Tender, dll.) selalu terbuka mulai Starter.
          </p>
        </div>

        {/* Status strip */}
        <div className="max-w-2xl mx-auto mb-8">
          {!isAuthenticated ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center space-y-3">
              <p className="text-sm text-white/60">Masuk untuk melihat jatah paket bidang Anda.</p>
              <a href="/login">
                <Button className="gap-2" data-testid="button-login-paket">
                  <LogIn className="h-4 w-4" />Masuk<ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          ) : isAllAccess ? (
            <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-5 text-center flex items-center justify-center gap-3">
              <Crown className="h-5 w-5 text-violet-300 shrink-0" />
              <p className="text-sm text-violet-200" data-testid="text-status-all-access">
                Paket Anda membuka <span className="font-semibold">semua bidang</span> — tidak perlu memilih.
              </p>
            </div>
          ) : allowance === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center space-y-3">
              <p className="text-sm text-white/60" data-testid="text-status-no-allowance">
                Pemilihan paket bidang tersedia mulai paket <span className="font-semibold text-indigo-300">Profesional</span>. Claw dasar tetap bisa diakses dari paket Starter.
              </p>
              <Link href="/onboarding">
                <Button className="gap-2" data-testid="button-upgrade-paket">
                  <Zap className="h-4 w-4" />Upgrade Paket
                </Button>
              </Link>
            </div>
          ) : hasSelection ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center flex items-center justify-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
              <p className="text-sm text-emerald-200" data-testid="text-status-locked">
                Pilihan Anda tersimpan & terkunci. Hubungi admin jika ingin mengganti paket bidang.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-5 text-center">
              <p className="text-sm text-indigo-200" data-testid="text-status-pick">
                Pilih <span className="font-semibold">{slots} paket bidang</span> ({picked.length}/{slots} dipilih). Pilihan terkunci setelah disimpan — pilih dengan cermat.
              </p>
            </div>
          )}
        </div>

        {/* Package grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {info.packages.map((pkg: ClawPackage) => {
            const isPicked = picked.includes(pkg.id);
            const isOwned = info.selected.includes(pkg.id) || isAllAccess;
            return (
              <button
                key={pkg.id}
                onClick={() => togglePick(pkg.id)}
                disabled={!canPick}
                data-testid={`card-paket-${pkg.id}`}
                className={`text-left rounded-2xl border bg-white/[0.03] p-5 transition-all ${
                  isOwned
                    ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                    : isPicked
                    ? "border-indigo-400 bg-indigo-500/[0.08] ring-1 ring-indigo-400/50"
                    : COLOR_CARD[pkg.color] ?? "border-white/10"
                } ${canPick ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${COLOR_ICON[pkg.color] ?? "bg-white/10 text-white/70"}`}>
                    {ICONS[pkg.icon] ?? <Cpu className="h-6 w-6" />}
                  </div>
                  {isOwned ? (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 gap-1">
                      <CheckCircle2 className="h-3 w-3" />Terbuka
                    </Badge>
                  ) : isPicked ? (
                    <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25 gap-1">
                      <CheckCircle2 className="h-3 w-3" />Dipilih
                    </Badge>
                  ) : (
                    <Badge className="bg-white/5 text-white/40 border-white/10 gap-1">
                      <Lock className="h-3 w-3" />{pkg.routes.length} claw
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1.5">{pkg.name}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{pkg.description}</p>
              </button>
            );
          })}
        </div>

        {/* Save bar */}
        {canPick && (
          <div className="sticky bottom-4 mt-8 max-w-md mx-auto">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d1a]/95 backdrop-blur p-4 flex items-center gap-3 shadow-2xl">
              <p className="text-sm text-white/60 flex-1">
                {picked.length}/{slots} paket dipilih
              </p>
              <Button
                onClick={() => saveMutation.mutate(picked)}
                disabled={picked.length === 0 || saveMutation.isPending}
                className="gap-2"
                data-testid="button-simpan-paket"
              >
                {saveMutation.isPending ? "Menyimpan…" : "Simpan Pilihan"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
