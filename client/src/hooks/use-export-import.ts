import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useExportAgent(agentId: string) {
  return useQuery({
    queryKey: ["/api/agents", agentId, "export"],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/export`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export agent");
      return response.json();
    },
    enabled: false,
  });
}

export function useImportAgent() {
  return useMutation({
    mutationFn: async ({
      config,
      customName,
      toolboxId,
    }: {
      config: any;
      customName?: string;
      toolboxId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/agents/import", {
        config,
        customName,
        toolboxId,
      });
      return await response.json();
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

export function downloadAgentConfig(agentId: string, agentName: string) {
  return async () => {
    const response = await fetch(`/api/agents/${agentId}/export`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to export agent");
    
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentName.toLowerCase().replace(/\s+/g, "-")}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}
