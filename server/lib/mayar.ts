const MAYAR_API_URL = "https://api.mayar.id/hl/v1";

interface MayarPaymentRequest {
  name: string;
  email: string;
  mobile?: string;
  amount: number;
  description: string;
  redirectUrl?: string;
}

interface MayarPaymentResponse {
  statusCode: number;
  messages: string;
  data: {
    id: string;
    link: string;
    status: string;
    amount: number;
    createdAt: string;
  };
}

interface MayarWebhookPayload {
  event: string;
  id: string;
  amount: number;
  status: string;
  customerEmail: string;
  customerName: string;
  description: string;
  paidAt?: string;
  metadata?: Record<string, any>;
}

export const subscriptionPlans = {
  free_trial: {
    name: "Free Trial",
    duration: 7,
    price: 0,
    chatbotLimit: 1,
    description: "7 hari gratis, 75 pesan, 1 chatbot — via Dialog Gustafta",
  },
  monthly_1: {
    name: "1 Bulan",
    duration: 30,
    price: 199000,
    chatbotLimit: 3,
    description: "Langganan bulanan dengan akses penuh",
  },
  monthly_3: {
    name: "3 Bulan",
    duration: 90,
    price: 499000,
    chatbotLimit: 5,
    description: "Hemat 16% dibanding bulanan",
  },
  monthly_6: {
    name: "6 Bulan",
    duration: 180,
    price: 999000,
    chatbotLimit: 10,
    description: "Hemat 17% dibanding bulanan",
  },
  monthly_12: {
    name: "12 Bulan",
    duration: 365,
    price: 1999000,
    chatbotLimit: 25,
    description: "Hemat 16% dibanding bulanan",
  },
};

export type SubscriptionPlanKey = keyof typeof subscriptionPlans;

export async function createPaymentLink(
  apiKey: string,
  data: MayarPaymentRequest
): Promise<MayarPaymentResponse> {
  const response = await fetch(`${MAYAR_API_URL}/payment`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      mobile: data.mobile || "",
      amount: data.amount,
      description: data.description,
      redirectUrl: data.redirectUrl || "",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mayar API error: ${error}`);
  }

  return response.json();
}

export function parseWebhookPayload(payload: any): MayarWebhookPayload {
  return {
    event: payload.event || "unknown",
    id: payload.id || payload.transactionId,
    amount: payload.amount || 0,
    status: payload.status || "unknown",
    customerEmail: payload.customer_email || payload.customerEmail || "",
    customerName: payload.customer_name || payload.customerName || "",
    description: payload.description || "",
    paidAt: payload.paid_at || payload.paidAt,
    metadata: payload.metadata || {},
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Encode agentId into description so webhook can identify which chatbot to unlock
export function buildChatbotDescription(agentId: number | string, agentName: string): string {
  return `CHATBOT_AKSES-${agentId}-${agentName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}`;
}

// Parse agentId from description — returns null if not a chatbot payment
export function parseChatbotAgentId(description: string): number | null {
  const match = description.match(/CHATBOT_AKSES-(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Verify Mayar webhook HMAC-SHA256 signature
export async function verifyMayarSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const { createHmac } = await import("crypto");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}
