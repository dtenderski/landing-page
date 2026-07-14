import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BigIdea, Toolbox, Agent } from "@shared/schema";

interface ActiveContext {
  bigIdea: BigIdea | null;
  toolbox: Toolbox | null;
  agent: Agent | null;
  chain: {
    isValid: boolean;
    hasOrphanedToolbox: boolean;
    hasOrphanedAgent: boolean;
  };
}

export function useActiveContext() {
  return useQuery<ActiveContext>({
    queryKey: ["/api/context/active"],
    staleTime: 1000 * 30,
  });
}

export function useActivateContext() {
  return useMutation({
    mutationFn: async ({
      bigIdeaId,
      toolboxId,
      agentId,
    }: {
      bigIdeaId?: string;
      toolboxId?: string;
      agentId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/context/activate", {
        bigIdeaId,
        toolboxId,
        agentId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      queryClient.invalidateQueries({ queryKey: ["/api/context/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/big-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/big-ideas/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/active"] });
    },
  });
}
