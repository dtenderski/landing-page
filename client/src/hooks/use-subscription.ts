import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export interface SubscriptionPlan {
  key: string;
  name: string;
  duration: number;
  price: number;
  chatbotLimit: number;
  description: string;
}

export interface Subscription {
  id: number;
  userId: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  chatbotLimit: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  bank: string;
  noRek: string;
  atas: string;
}

export interface PaymentStatus {
  paymentConfigured: boolean;
  provider: string;
  bankAccounts?: BankAccount[];
  whatsapp?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription: Subscription;
  snapToken?: string;
  redirectUrl?: string;
  orderId?: string;
  amount?: number;
  planName?: string;
  message?: string;
  waUrl?: string;
  scalevCheckoutUrl?: string | null;
  itemName?: string;
  accessToken?: string;
}

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
  });
}

export function usePaymentStatus() {
  return useQuery<PaymentStatus>({
    queryKey: ["/api/subscriptions/status"],
  });
}

export function useUserSubscription(userId: string | undefined) {
  return useQuery<Subscription | null>({
    queryKey: ["/api/subscriptions/user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/subscriptions/user/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch subscription");
      }
      return response.json();
    },
    enabled: !!userId,
  });
}

export function useCreateSubscription() {
  return useMutation({
    mutationFn: async (data: { plan: string }) => {
      return await apiRequest("POST", "/api/subscriptions/create", data) as CreateSubscriptionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/user"] });
    },
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
