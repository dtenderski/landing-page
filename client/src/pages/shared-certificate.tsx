import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Brain, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Types (mirror MasteryProfile snapshot from server) ───────────────────── */
interface MasteryGateSummary {
  gate: string;
  label: string;
  answered: number;
  total: number;
  completion: number;
}
interface MasteryProfile {
  topic: string | null;
  gates: MasteryGateSummary[];
  answeredFields: number;
  totalFields: number;
  completion: number;
  strengths: string[];
  growthAreas: string[];
  focus: string | null;
  role: string | null;
  narrative: string;
}
interface SharedCertificateResponse {
  topic: string | null;
  profile: MasteryProfile;
  createdAt: string;
}

const pct = (n: number) => Math.round((n || 0) * 100);

export default function SharedCertificatePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, isError, error } = useQuery<SharedCertificateResponse>({
    queryKey: ["/api/blueprint/certificate", token],
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500" data-testid="cert-loading">
            <Loader2 className="h-6 w-6 animate-spin mb-3" />
            <p className="text-sm">Memuat peta pemahaman…</p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border bg-white dark:bg-card p-8 text-center" data-testid="cert-error">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sertifikat tidak ditemukan</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {(error as any)?.message?.replace(/^\d+:\s*/, "") || "Tautan mungkin salah atau sudah tidak berlaku."}
            </p>
            <Button asChild variant="outline" data-testid="link-home">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </div>
        )}

        {data && data.profile && (
          <div data-testid="cert-content">
            <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sertifikat Pembelajaran Reflektif</h1>
              </div>
              <p className="text-xs text-violet-700/80 dark:text-violet-300/80 mb-1">
                Profil Penguasaan atas Topik
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-5">
                Peta pemahaman dari refleksi — bukan tes atau penilaian benar-salah.
              </p>

              {data.profile.topic && (
                <div className="mb-4" data-testid="cert-topic">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Topik: </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{data.profile.topic}</span>
                </div>
              )}

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-5 leading-relaxed" data-testid="cert-narrative">
                {data.profile.narrative}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {data.profile.gates.map((g) => (
                  <div key={g.gate} className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-500/20 p-3 text-center" data-testid={`cert-gate-${g.gate}`}>
                    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight mb-1">{g.label}</div>
                    <div className="text-base font-bold text-violet-600 dark:text-violet-400">{pct(g.completion)}%</div>
                    <div className="text-[10px] text-gray-400">{g.answered}/{g.total}</div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Progres refleksi: </span>
                <span className="text-[11px] text-gray-700 dark:text-gray-300" data-testid="cert-progress">
                  {data.profile.answeredFields}/{data.profile.totalFields} sudut refleksi ({pct(data.profile.completion)}%)
                </span>
              </div>

              {data.profile.strengths.length > 0 && (
                <div className="mb-2" data-testid="cert-strengths">
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Sudah diuraikan jelas: </span>
                  <span className="text-[11px] text-gray-700 dark:text-gray-300">{data.profile.strengths.join(", ")}</span>
                </div>
              )}
              {data.profile.growthAreas.length > 0 && (
                <div data-testid="cert-growth">
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Masih bisa ditumbuhkan: </span>
                  <span className="text-[11px] text-gray-700 dark:text-gray-300">{data.profile.growthAreas.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border bg-white dark:bg-card p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Ingin membuat peta pemahaman Anda sendiri?</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Susun refleksi Anda lewat Gustafta Blueprint Builder.
              </p>
              <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white gap-2" data-testid="link-builder">
                <Link href="/blueprint-builder">Mulai <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
