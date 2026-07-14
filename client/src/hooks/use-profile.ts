import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile, InsertUserProfile } from "@shared/schema";

export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  return useQuery<UserProfile | null>({
    queryKey: ["/api/profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/profile/${userId}`, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: isAuthenticated && !!userId,
  });
}

export function useSaveProfile() {
  return useMutation({
    mutationFn: async (data: Omit<InsertUserProfile, "userId">) => {
      return apiRequest("POST", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to upload avatar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });
}
