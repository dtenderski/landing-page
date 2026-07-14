import { useQuery } from "@tanstack/react-query";

interface AnalyticsSummary {
  totalMessages: number;
  totalSessions: number;
  totalIntegrationCalls: number;
  messagesLast7Days: number[];
  topHours: { hour: number; count: number }[];
}

export function useAnalyticsSummary(agentId: string) {
  return useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics", agentId, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/${agentId}/summary`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!agentId,
    staleTime: 0,
    refetchOnMount: true,
  });
}
