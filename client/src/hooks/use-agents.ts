import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Agent, InsertAgent } from "@shared/schema";

function invalidateHierarchy() {
  queryClient.invalidateQueries({ queryKey: ["/api/series"] });
  queryClient.invalidateQueries({ queryKey: ["/api/big-ideas"] });
  queryClient.invalidateQueries({ queryKey: ["/api/big-ideas/active"] });
  queryClient.invalidateQueries({ queryKey: ["/api/toolboxes"] });
  queryClient.invalidateQueries({ queryKey: ["/api/toolboxes/active"] });
  queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
  queryClient.invalidateQueries({ queryKey: ["/api/agents/active"] });
  queryClient.invalidateQueries({ queryKey: ["/api/context/active"] });
}

// Invalidasi khusus untuk update properties agent — tidak menyentuh active agent
// agar tidak memicu race condition ganti agent aktif saat form disimpan
function invalidateAgentProperties(id: string) {
  queryClient.invalidateQueries({ queryKey: ["/api/agents", id] });
  queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
}

export function useAgents(toolboxId?: number | string) {
  const queryKey = toolboxId
    ? ["/api/agents", { toolboxId: String(toolboxId) }]
    : ["/api/agents"];

  return useQuery<Agent[]>({
    queryKey,
    queryFn: async () => {
      const url = toolboxId
        ? `/api/agents?toolboxId=${toolboxId}`
        : "/api/agents";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });
}

export function useActiveAgent() {
  return useQuery<Agent | null>({
    queryKey: ["/api/agents/active"],
  });
}

export function useAgent(id: string) {
  return useQuery<Agent>({
    queryKey: ["/api/agents", id],
    enabled: !!id,
  });
}

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (data: Partial<InsertAgent> & { name: string }) => {
      return await apiRequest("POST", "/api/agents", data);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}

export function useUpdateAgent() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAgent> }) => {
      return await apiRequest("PATCH", `/api/agents/${id}`, data);
    },
    onSuccess: (updatedAgent, { id }) => {
      // Gunakan hasil PATCH langsung untuk update cache — menghindari re-fetch
      // yang bisa memicu race condition penggantian active agent
      if (updatedAgent) {
        queryClient.setQueryData(["/api/agents", id], updatedAgent);
      }
      invalidateAgentProperties(id);
    },
  });
}

export function useSetActiveAgent() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/agents/${id}/activate`);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}

export function useDeleteAgent() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/agents/${id}`);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}

export function useGustaftaAssistant() {
  return useQuery<Agent | null>({
    queryKey: ["/api/agents/gustafta-assistant"],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
