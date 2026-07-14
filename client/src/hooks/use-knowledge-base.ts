import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { KnowledgeBase, InsertKnowledgeBase } from "@shared/schema";

interface RagStats {
  totalChunks: number;
  totalKnowledgeBases: number;
  ragEnabled: boolean;
  chunksByKb: Array<{
    kbId: string;
    kbName: string;
    chunkCount: number;
    processingStatus: string;
  }>;
}

export function useKnowledgeBases(agentId: string) {
  return useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge-base", agentId],
    enabled: !!agentId,
  });
}

export function useCreateKnowledgeBase() {
  return useMutation({
    mutationFn: async (data: InsertKnowledgeBase) => {
      return await apiRequest("POST", "/api/knowledge-base", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", variables.agentId, "rag-stats"] });
    },
  });
}

export function useUploadKnowledgeFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    },
  });
}

export function useDeleteKnowledgeBase() {
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      await apiRequest("DELETE", `/api/knowledge-base/${id}`);
      return { agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", data.agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", data.agentId, "rag-stats"] });
    },
  });
}

export function useUpdateKnowledgeBase() {
  return useMutation({
    mutationFn: async ({ id, agentId, data }: { id: string; agentId: string; data: Partial<InsertKnowledgeBase> }) => {
      const result = await apiRequest("PATCH", `/api/knowledge-base/${id}`, data);
      return { result, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", data.agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", data.agentId, "rag-stats"] });
    },
  });
}

export function useRagStats(agentId: string) {
  return useQuery<RagStats>({
    queryKey: ["/api/knowledge-base", agentId, "rag-stats"],
    enabled: !!agentId,
  });
}

export function useReprocessRag() {
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const result = await apiRequest("POST", `/api/knowledge-base/${id}/reprocess`, { agentId });
      return { result, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", data.agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", data.agentId, "rag-stats"] });
    },
  });
}
