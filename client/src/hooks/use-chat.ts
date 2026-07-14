import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message, InsertMessage } from "@shared/schema";

export function useMessages(agentId: string) {
  return useQuery<Message[]>({
    queryKey: ["/api/messages", agentId],
    enabled: !!agentId,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (data: InsertMessage) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics", variables.agentId, "summary"] });
    },
  });
}

export function useClearMessages() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      await apiRequest("DELETE", `/api/messages/${agentId}`);
      return { agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", data.agentId] });
    },
  });
}
