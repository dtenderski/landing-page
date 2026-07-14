import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AgentTemplate } from "@shared/agent-templates";

interface TemplatesResponse {
  templates: AgentTemplate[];
  categories: { id: string; name: string; count: number }[];
}

export function useTemplates() {
  return useQuery<TemplatesResponse>({
    queryKey: ["/api/templates"],
    staleTime: 1000 * 60 * 10,
  });
}

export function useTemplate(id: string) {
  return useQuery<AgentTemplate>({
    queryKey: ["/api/templates", id],
    enabled: !!id,
  });
}

export function useCreateAgentFromTemplate() {
  return useMutation({
    mutationFn: async ({ 
      templateId, 
      customName, 
      toolboxId 
    }: { 
      templateId: string; 
      customName?: string; 
      toolboxId?: string; 
    }) => {
      return await apiRequest("POST", `/api/templates/${templateId}/create-agent`, {
        customName,
        toolboxId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      queryClient.invalidateQueries({ queryKey: ["/api/big-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/big-ideas/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toolboxes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/context/active"] });
    },
  });
}
