/**
 * useTrialCTA — centralized hook for "Coba Gratis" CTA routing.
 *
 * Branching:
 *  1. Unauthenticated                        → /login?return=%2Fdialog-gustafta
 *  2. Active trial                           → /dashboard
 *  3. Authenticated + dialogCompleted + no trial → /dialog-gustafta (activation step shown)
 *  4. Authenticated + not dialogCompleted    → /dialog-gustafta (complete dialog first)
 */
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface TrialStatus {
  hasActiveTrial: boolean;
  dialogCompleted: boolean;
}

export function useTrialCTA(): { ctaUrl: string; isLoading: boolean } {
  const { isAuthenticated } = useAuth();

  const { data: trialStatus, isLoading } = useQuery<TrialStatus>({
    queryKey: ["/api/trial/status"],
    enabled: isAuthenticated,
    retry: 1,
    staleTime: 60_000,
  });

  if (!isAuthenticated) {
    return { ctaUrl: "/login?return=%2Fdialog-gustafta", isLoading: false };
  }

  if (isLoading) {
    return { ctaUrl: "/dialog-gustafta", isLoading: true };
  }

  if (trialStatus?.hasActiveTrial) {
    return { ctaUrl: "/dashboard", isLoading: false };
  }

  if (trialStatus?.dialogCompleted) {
    return { ctaUrl: "/dialog-gustafta", isLoading: false };
  }

  return { ctaUrl: "/dialog-gustafta", isLoading: false };
}
