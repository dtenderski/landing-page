import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check, Lock, ArrowRight, KeyRound, MessageSquare, FileSignature,
  Star, Sparkles, Loader2, PartyPopper,
} from "lucide-react";

const JOURNEY_KEY = "gustafta_bonus_journey_v1";

interface JourneyState {
  step2Dialog?: boolean;
  step3AgentId?: string;
  step3AgentName?: string;
  step4Done?: boolean;
}

interface SubResponse {
  plan: string | null;
  status: string;
  tier: number;
  daysRemaining: number | null;
}

interface MyTestimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  quote: string;
  source: string;
}

function readJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function writeJourney(next: JourneyState) {
  try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(next)); } catch { /* abaikan */ }
}

export default function BonusIndobuildtechPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [journey, setJourney] = useState<JourneyState>({});

  // Inisialisasi jalur bonus (agar Dialog & Blueprint mengenali konteks event).
  useEffect(() => {
    const j = readJourney();
    setJourney(j);
    if (localStorage.getItem(JOURNEY_KEY) === null) writeJourney(j);
    const onFocus = () => setJourney(readJourney());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const { data: sub } = useQuery<SubResponse>({
    queryKey: ["/api/subscriptions/my"],
    enabled: isAuthenticated,
  });

  const { data: mine } = useQuery<MyTestimonial | null>({
    queryKey: ["/api/testimonials/mine"],
    enabled: isAuthenticated,
  });

  // Status langkah
  const step1Done = isAuthenticated && sub?.status === "active";
  const step2Done = !!journey.step2Dialog;
  const step3Done = !!journey.step3AgentId;
  const step4Done = !!mine || !!journey.step4Done;

  const steps = [step1Done, step2Done, step3Done, step4Done];
  const completedCount = steps.filter(Boolean).length;

  // Form testimoni
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    if (mine) {
      setName(mine.name || "");
      setRole(mine.role || "");
      setRating(mine.rating || 5);
      setQuote(mine.quote || "");
    }
  }, [mine]);

  const submitTestimonial = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/testimonials", {
        name: name.trim(),
        role: role.trim(),
        rating,
        quote: quote.trim(),
        agentId: journey.step3AgentId || undefined,
      });
    },
    onSuccess: () => {
      writeJourney({ ...readJourney(), step4Done: true });
      setJourney(readJourney());
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/mine"] });
      toast({ title: "Terima kasih! 🎉", description: "Testimoni Anda tersimpan." });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menyimpan", description: e?.message || "Coba lagi.", variant: "destructive" });
    },
  });

  const canSubmit = name.trim().length >= 2 && quote.trim().length >= 10 && !submitTestimonial.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/30">
      <SharedHeader />
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <Badge className="bg-indigo-600 text-white mb-3" data-testid="badge-event">
            ASDAMKINDO × Gustafta · Indobuildtech 2026
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white" data-testid="text-page-title">
            Jalur Bonus Peserta
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Empat langkah singkat untuk mengubah keahlian Anda menjadi chatbot AI profesional — gratis untuk peserta acara.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2" data-testid="progress-steps">
            {steps.map((done, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full transition-colors ${done ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" data-testid="text-progress-count">
            {completedCount} dari 4 langkah selesai
          </p>
        </div>

        <div className="space-y-4">
          <StepCard
            index={1}
            done={step1Done}
            locked={false}
            icon={<KeyRound className="h-5 w-5" />}
            title="Aktifkan Kode Akses"
            desc="Masukkan kode peserta acara untuk membuka langganan Profesional 90 hari."
            testid="step-1"
            action={
              step1Done ? (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium" data-testid="text-step1-status">
                  Aktif{sub?.daysRemaining != null ? ` · ${sub.daysRemaining} hari tersisa` : ""}
                </span>
              ) : !isAuthenticated ? (
                <Link href="/login">
                  <Button className="gap-2" data-testid="button-step1-login">Masuk dulu <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              ) : (
                <Link href="/kode-akses">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="button-step1-redeem">
                    Masukkan Kode <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )
            }
          />

          <StepCard
            index={2}
            done={step2Done}
            locked={!step1Done}
            icon={<MessageSquare className="h-5 w-5" />}
            title="Coba Dialog Gustafta"
            desc="Ngobrol dengan asisten AI untuk menggali ide, lalu susun blueprint chatbot Anda."
            testid="step-2"
            action={
              <Link href="/konsultasi">
                <Button
                  variant={step2Done ? "outline" : "default"}
                  className={step2Done ? "gap-2" : "bg-indigo-600 hover:bg-indigo-500 text-white gap-2"}
                  data-testid="button-step2-dialog"
                >
                  {step2Done ? "Buka Lagi" : "Mulai Dialog"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />

          <StepCard
            index={3}
            done={step3Done}
            locked={!step2Done}
            icon={<FileSignature className="h-5 w-5" />}
            title="Rancang & Unduh Blueprint Profesional"
            desc="Sempurnakan rancangan, unduh berkas Blueprint Profesional (PDF), lalu buat chatbot Anda."
            testid="step-3"
            action={
              step3Done ? (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium" data-testid="text-step3-status">
                  Chatbot dibuat: {journey.step3AgentName || "siap"}
                </span>
              ) : (
                <Link href="/blueprint-builder?journey=bonus">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="button-step3-blueprint">
                    Rancang Chatbot <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )
            }
          />

          {/* Langkah 4 — testimoni */}
          <div
            className={`rounded-2xl border p-5 transition-colors ${
              step3Done
                ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30"
                : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
            }`}
            data-testid="step-4"
          >
            <div className="flex items-start gap-4">
              <StepBullet index={4} done={step4Done} locked={!step3Done} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 mb-1">
                  <PartyPopper className="h-5 w-5" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Chatbot Siap — Bagikan Kesan Anda</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  {step4Done
                    ? "Terima kasih! Testimoni Anda sudah kami terima. Anda bisa memperbaruinya kapan saja."
                    : "Chatbot Anda sudah jadi. Ceritakan pengalaman Anda membuatnya di acara ini."}
                </p>

                {!step3Done ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Selesaikan langkah 3 dulu untuk membuka testimoni.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="t-name">Nama</Label>
                        <Input
                          id="t-name" value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="Nama Anda" data-testid="input-testimonial-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="t-role">Peran / Profesi (opsional)</Label>
                        <Input
                          id="t-role" value={role} onChange={(e) => setRole(e.target.value)}
                          placeholder="mis. Ahli K3 Konstruksi" data-testid="input-testimonial-role"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Penilaian</Label>
                      <div className="flex items-center gap-1 mt-1" data-testid="rating-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n} type="button" onClick={() => setRating(n)}
                            className="p-0.5" data-testid={`button-star-${n}`} aria-label={`${n} bintang`}
                          >
                            <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="t-quote">Testimoni</Label>
                      <Textarea
                        id="t-quote" value={quote} onChange={(e) => setQuote(e.target.value)}
                        rows={3} placeholder="Bagaimana pengalaman Anda merancang chatbot di Gustafta?"
                        data-testid="input-testimonial-quote"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Minimal 10 karakter.</p>
                    </div>
                    <Button
                      onClick={() => submitTestimonial.mutate()}
                      disabled={!canSubmit}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                      data-testid="button-submit-testimonial"
                    >
                      {submitTestimonial.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {mine ? "Perbarui Testimoni" : "Kirim Testimoni"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {completedCount === 4 && (
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 text-center" data-testid="banner-complete">
            <PartyPopper className="h-8 w-8 mx-auto mb-2" />
            <h3 className="text-lg font-bold">Semua langkah selesai! 🎉</h3>
            <p className="text-sm text-white/80 mt-1 mb-4">Chatbot Anda siap dipakai dan dikembangkan lebih lanjut.</p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="bg-white text-indigo-700 hover:bg-white/90 gap-2"
              data-testid="button-go-dashboard-final"
            >
              Buka Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepBullet({ index, done, locked }: { index: number; done: boolean; locked: boolean }) {
  return (
    <div
      className={`flex-shrink-0 h-9 w-9 rounded-full grid place-items-center font-bold text-sm ${
        done
          ? "bg-emerald-500 text-white"
          : locked
          ? "bg-slate-200 dark:bg-slate-700 text-slate-400"
          : "bg-indigo-600 text-white"
      }`}
    >
      {done ? <Check className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : index}
    </div>
  );
}

function StepCard({
  index, done, locked, icon, title, desc, action, testid,
}: {
  index: number; done: boolean; locked: boolean;
  icon: React.ReactNode; title: string; desc: string;
  action: React.ReactNode; testid: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        locked
          ? "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
          : "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30"
      }`}
      data-testid={testid}
    >
      <div className="flex items-start gap-4">
        <StepBullet index={index} done={done} locked={locked} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 mb-1">
            {icon}
            <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{desc}</p>
          {locked ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Selesaikan langkah sebelumnya dulu.
            </p>
          ) : (
            action
          )}
        </div>
      </div>
    </div>
  );
}
