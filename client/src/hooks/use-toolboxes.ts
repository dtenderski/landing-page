import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Toolbox, InsertToolbox } from "@shared/schema";

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

export function useToolboxes(bigIdeaId?: number | string) {
  const queryKey = bigIdeaId 
    ? ["/api/toolboxes", { bigIdeaId: String(bigIdeaId) }]
    : ["/api/toolboxes"];
  
  return useQuery<Toolbox[]>({
    queryKey,
    queryFn: async () => {
      const url = bigIdeaId 
        ? `/api/toolboxes?bigIdeaId=${bigIdeaId}` 
        : "/api/toolboxes";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch toolboxes");
      return res.json();
    },
  });
}

export function useOrchestratorToolbox(seriesId?: string | null) {
  return useQuery<Toolbox | null>({
    queryKey: ["/api/toolboxes/orchestrator", seriesId],
    queryFn: async () => {
      if (!seriesId) return null;
      const res = await fetch(`/api/toolboxes/orchestrator/${seriesId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orchestrator");
      return res.json();
    },
    enabled: !!seriesId,
  });
}

export function useActiveToolbox() {
  return useQuery<Toolbox | null>({
    queryKey: ["/api/toolboxes/active"],
  });
}

export function useToolbox(id: string) {
  return useQuery<Toolbox>({
    queryKey: ["/api/toolboxes", id],
    enabled: !!id,
  });
}

export function useCreateToolbox() {
  return useMutation({
    mutationFn: async (data: InsertToolbox) => {
      return await apiRequest("POST", "/api/toolboxes", data);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}

export function useUpdateToolbox() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertToolbox> }) => {
      return await apiRequest("PATCH", `/api/toolboxes/${id}`, data);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}

export function useActivateToolbox() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/toolboxes/${id}/activate`);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}

export function useDeleteToolbox() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/toolboxes/${id}`);
    },
    onSuccess: () => {
      invalidateHierarchy();
    },
  });
}
