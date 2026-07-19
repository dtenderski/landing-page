/**
 * /bergabung — Halaman onboarding tim tester / early adopter.
 * Mendukung ?code=KODE agar link bisa pre-filled (share langsung ke tester).
 * Contoh link: gustafta.my.id/bergabung?code=GUSTESTER-INTERNAL
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Ticket, Lock, ArrowRight, CheckCircle2, Loader2,
  BrainCircuit, FolderOpen, Search, Shield, Zap, Users,
} from "lucide-react";

// ── Fitur yang dapat dari akses Early Access (Profesional) ──────────────────

const PERKS = [
  {
    icon: BrainCircuit,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    title: "AI Builder",
    desc: "Bangun dan latih agen AI sendiri — chatbot, asisten, tim AI.",
  },
  {
    icon: FolderOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    title: "Ruang Simpan 5 GB",
    desc: "Simpan, indeks, dan cari dokumen perusahaan pakai AI — PDF, Excel, gambar teknis.",
  },
  {
    icon: Search,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    title: "AI Search + RAG",
    desc: "Dokumen Anda jadi konteks AI — jawaban instan dari arsip internal.",
  },
  {
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
    title: "Semua Fitur Profesional",
    desc: "Akses penuh ke seluruh modul — Bedah Dokumen, Claw AI, Tender Bot, dan lebih banyak.",
  },
  {
    icon: Shield,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    title: "Prioritas Support",
    desc: "Laporan bug & feedback Anda diprioritaskan langsung ke tim developer.",
  },
  {
    icon: Users,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    title: "Akses Early, Pengaruh Nyata",
    desc: "Anda bukan sekedar pengguna — feedback Anda membentuk arah produk.",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getQueryCode(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("code") ?? "";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BergabungPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ plan?: string; endDate?: string } | null>(null);

  // Pre-fill code dari query param
  useEffect(() => {
    const qc = getQueryCode();
    if (qc) setCode(qc.toUpperCase());
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Bergabung ke Gustafta Early Access";
    return () => { document.title = prev; };
  }, []);

  const redeem = async () => {
    const c = code.trim();
    if (!c) {
      toast({ title: "Kode belum diisi", description: "Masukkan kode undangan yang Anda terima.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/access-codes/redeem", { code: c });
      setDone({ plan: data.plan, endDate: data.endDate });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
    } catch (e: any) {
      toast({
        title: "Kode tidak dapat digunakan",
        description: e?.message || "Pastikan kode sudah benar atau tanyakan ke pengirim undangan.",
        variant: "destructive",
      });
    } finally { setBusy(false); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  // ── Belum login ──────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    const qc = getQueryCode();
    const redirectTarget = qc ? `/bergabung?code=${qc}` : "/bergabung";
    const loginHref = `/login?redirect=${encodeURIComponent(redirectTarget)}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background">
        <SharedHeader />

        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center px-4 pt-16 pb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Ticket className="h-3.5 w-3.5" />
            EARLY ACCESS · UNDANGAN KHUSUS
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
            Anda Diundang ke<br />
            <span className="text-indigo-600 dark:text-indigo-400">Gustafta Early Access</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto mb-8">
            Akses penuh ke platform AI untuk profesional konstruksi. Bangun agen AI, simpan dokumen, dan coba semua fitur Profesional — gratis selama masa uji coba.
          </p>

          {/* Gate: harus login dulu */}
          <Card className="max-w-sm mx-auto border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto">
                <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Masuk atau Daftar Dulu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kode akses terikat ke akun Anda. Daftar gratis, tidak perlu kartu kredit.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                >
                  <Link href={loginHref}>
                    Masuk / Daftar Sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Setelah masuk, Anda langsung diarahkan kembali ke halaman ini.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Perks */}
        <PerkGrid />
      </div>
    );
  }

  // ── Sudah login ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background">
      <SharedHeader />

      <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Ticket className="h-3.5 w-3.5" />
            EARLY ACCESS · UNDANGAN KHUSUS
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
            Aktifkan Akses Anda
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            Masukkan kode undangan yang Anda terima untuk mengaktifkan akses Profesional.
          </p>
        </div>

        {/* Form / Success */}
        <div className="max-w-sm mx-auto mb-14">
          {done ? (
            <SuccessCard plan={done.plan} endDate={done.endDate} />
          ) : (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Kode Undangan
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") redeem(); }}
                  placeholder="Mis. GUSTESTER-INTERNAL"
                  className="text-center font-mono tracking-widest text-lg h-12 uppercase"
                  data-testid="input-access-code"
                />
                <Button
                  onClick={redeem}
                  disabled={busy}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-semibold"
                  data-testid="button-redeem"
                >
                  {busy
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...</>
                    : <><Ticket className="h-4 w-4" /> Aktifkan Akses</>
                  }
                </Button>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Setiap kode hanya bisa ditukarkan sekali per akun.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Perks — hanya tampil jika belum redeem */}
        {!done && <PerkGrid />}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PerkGrid() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
      <h2 className="text-center text-lg font-bold text-gray-900 dark:text-white mb-6">
        Yang Anda Dapatkan
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERKS.map((p) => (
          <div
            key={p.title}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center mb-3`}>
              <p.icon className={`h-4.5 w-4.5 ${p.color}`} strokeWidth={2} />
            </div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{p.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessCard({ plan, endDate }: { plan?: string; endDate?: string }) {
  return (
    <Card className="border-2 border-emerald-300 dark:border-emerald-700 shadow-lg" data-testid="card-redeem-success">
      <CardContent className="pt-8 pb-6 text-center space-y-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>

        {/* Text */}
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Selamat Bergabung! 🎉</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Akses <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-400">{plan ?? "Profesional"}</span> Anda sudah aktif
            {endDate ? ` sampai ${new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            asChild
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            data-testid="button-go-dashboard"
          >
            <Link href="/dashboard">
              Buka Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full gap-2"
            data-testid="button-go-ruang-simpan"
          >
            <Link href="/ruang-simpan">
              <FolderOpen className="h-4 w-4" /> Coba Ruang Simpan
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ada kendala? Hubungi tim Gustafta via WhatsApp atau Helpdesk.
        </p>
      </CardContent>
    </Card>
  );
}
