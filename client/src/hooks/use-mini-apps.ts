import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MiniApp, InsertMiniApp, MiniAppResult, InsertMiniAppResult } from "@shared/schema";

export function useMiniApps(agentId: string) {
  return useQuery<MiniApp[]>({
    queryKey: ["/api/mini-apps", agentId],
    enabled: !!agentId,
  });
}

export function useCreateMiniApp() {
  return useMutation({
    mutationFn: async (data: InsertMiniApp) => {
      return await apiRequest("POST", `/api/mini-apps/${data.agentId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-apps", variables.agentId] });
    },
  });
}

export function useUpdateMiniApp() {
  return useMutation({
    mutationFn: async ({ id, agentId, data }: { id: string; agentId: string; data: Partial<InsertMiniApp> }) => {
      const result = await apiRequest("PATCH", `/api/mini-app/${id}`, data);
      return { result, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-apps", data.agentId] });
    },
  });
}

export function useDeleteMiniApp() {
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      await apiRequest("DELETE", `/api/mini-app/${id}`);
      return { agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-apps", data.agentId] });
    },
  });
}

export function useMiniAppResults(miniAppId: string) {
  return useQuery<MiniAppResult[]>({
    queryKey: ["/api/mini-app-results", miniAppId],
    enabled: !!miniAppId,
  });
}

export function useCreateMiniAppResult() {
  return useMutation({
    mutationFn: async (data: InsertMiniAppResult) => {
      return await apiRequest("POST", `/api/mini-app-results/${data.miniAppId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-app-results", variables.miniAppId] });
    },
  });
}

export function useRunAIMiniApp() {
  return useMutation({
    mutationFn: async ({ id, agentId, extraParams }: { id: string; agentId: string; extraParams?: Record<string, any> }) => {
      const data = await apiRequest("POST", `/api/mini-app/${id}/run`, extraParams || {});
      return { data, agentId, miniAppId: id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-app-results", result.miniAppId] });
    },
  });
}

export function useAutoGenerateMiniApps() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      const data = await apiRequest("POST", `/api/mini-apps/${agentId}/auto-generate`, {});
      return { data, agentId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-apps", result.agentId] });
    },
  });
}

export function usePublicMiniApp(slug: string) {
  return useQuery<{ miniApp: MiniApp; agent: { id: string; name: string; avatar: string; tagline: string; description: string } | null }>({
    queryKey: ["/api/public/mini-app", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/mini-app/${slug}`);
      if (!res.ok) throw new Error("Mini app not found");
      return res.json();
    },
    enabled: !!slug,
  });
}

export function usePublicMiniAppResult(slug: string) {
  return useQuery<{ result: MiniAppResult | null }>({
    queryKey: ["/api/public/mini-app-result", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/mini-app/${slug}/result`);
      if (!res.ok) throw new Error("Failed to fetch result");
      return res.json();
    },
    enabled: !!slug,
  });
}

export function usePublicMiniAppResults(slug: string) {
  return useQuery<{ results: MiniAppResult[] }>({
    queryKey: ["/api/public/mini-app-results", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/mini-app/${slug}/results`);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    enabled: !!slug,
  });
}

export function usePublicGenerateDocument(slug: string) {
  return useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`/api/public/mini-app/${slug}/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Gagal membuat dokumen");
      }
      return res.json() as Promise<{ content: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/mini-app-results", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/mini-app-result", slug] });
    },
  });
}

export function usePublicSubmitResult(slug: string) {
  return useMutation({
    mutationFn: async (data: { input: Record<string, unknown>; output: Record<string, unknown> }) => {
      const res = await fetch(`/api/public/mini-app/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit result");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/mini-app-results", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/mini-app-result", slug] });
    },
  });
}
