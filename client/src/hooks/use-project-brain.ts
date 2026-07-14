import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ProjectBrainTemplate, InsertProjectBrainTemplate, ProjectBrainInstance, InsertProjectBrainInstance } from "@shared/schema";

export function useProjectBrainTemplates(agentId: string) {
  return useQuery<ProjectBrainTemplate[]>({
    queryKey: ["/api/project-brain/templates", agentId],
    enabled: !!agentId,
  });
}

export function useProjectBrainTemplate(id: string) {
  return useQuery<ProjectBrainTemplate>({
    queryKey: ["/api/project-brain/template", id],
    enabled: !!id,
  });
}

export function useCreateProjectBrainTemplate() {
  return useMutation({
    mutationFn: async (data: InsertProjectBrainTemplate) => {
      return await apiRequest("POST", `/api/project-brain/templates/${data.agentId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/templates", variables.agentId] });
    },
  });
}

export function useUpdateProjectBrainTemplate() {
  return useMutation({
    mutationFn: async ({ id, agentId, data }: { id: string; agentId: string; data: Partial<InsertProjectBrainTemplate> }) => {
      const result = await apiRequest("PATCH", `/api/project-brain/template/${id}`, data);
      return { result, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/templates", data.agentId] });
    },
  });
}

export function useDeleteProjectBrainTemplate() {
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      await apiRequest("DELETE", `/api/project-brain/template/${id}`);
      return { agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/templates", data.agentId] });
    },
  });
}

export function useProjectBrainInstances(agentId: string) {
  return useQuery<ProjectBrainInstance[]>({
    queryKey: ["/api/project-brain/instances", agentId],
    enabled: !!agentId,
  });
}

export function useActiveProjectBrainInstance(agentId: string) {
  return useQuery<ProjectBrainInstance>({
    queryKey: ["/api/project-brain/instances", agentId, "active"],
    enabled: !!agentId,
  });
}

export function useCreateProjectBrainInstance() {
  return useMutation({
    mutationFn: async (data: InsertProjectBrainInstance) => {
      return await apiRequest("POST", `/api/project-brain/instances/${data.agentId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/instances", variables.agentId] });
    },
  });
}

export function useUpdateProjectBrainInstance() {
  return useMutation({
    mutationFn: async ({ id, agentId, data }: { id: string; agentId: string; data: Record<string, any> }) => {
      const result = await apiRequest("PATCH", `/api/project-brain/instance/${id}`, data);
      return { result, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/instances", data.agentId] });
    },
  });
}

export function useActivateProjectBrainInstance() {
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const result = await apiRequest("POST", `/api/project-brain/instance/${id}/activate`);
      return { result, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/instances", data.agentId] });
    },
  });
}

export function useDeleteProjectBrainInstance() {
  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      await apiRequest("DELETE", `/api/project-brain/instance/${id}`);
      return { agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-brain/instances", data.agentId] });
    },
  });
}
