import { createHash, createHmac, timingSafeEqual } from "crypto";

const GRAPH_API_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }
  return digits;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Generic Meta Conversions API event (Purchase, Lead, InitiateCheckout, dll.). */
export interface MetaEventParams {
  /** Event Meta standar. Default "Purchase". */
  eventName?: string;
  /** Kunci dedup — HARUS sama dengan `eventID` yang dipakai pixel browser. */
  eventId: string;
  value?: number;
  currency?: string;
  email?: string;
  phone?: string;
  name?: string;
  contents?: Array<{ id: string; quantity: number }>;
  contentName?: string;
  contentCategory?: string;
  pixelId?: string;
  eventSourceUrl?: string;
  testEventCode?: string;
  /** Browser attribution cookies forwarded from checkout (sent to Meta as-is, NOT hashed). */
  fbp?: string;
  fbc?: string;
  /** Optional stable identifier for the buyer (hashed before send). */
  externalId?: string;
  /** IP & user-agent pengunjung (matching lebih akurat; TIDAK di-hash). */
  clientIpAddress?: string;
  clientUserAgent?: string;
  /** Default "website". */
  actionSource?: string;
}

export interface MetaPurchaseParams {
  orderId: string;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  name?: string;
  contents?: Array<{ id: string; quantity: number }>;
  contentName?: string;
  pixelId?: string;
  eventSourceUrl?: string;
  testEventCode?: string;
  eventName?: string;
  /** Browser attribution cookies forwarded from checkout (sent to Meta as-is, NOT hashed). */
  fbp?: string;
  fbc?: string;
  /** Optional stable identifier for the buyer (hashed before send). */
  externalId?: string;
}

export interface MetaCapiResult {
  sent: boolean;
  skippedReason?: string;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
}

function sanitizePixelId(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^0-9]/g, "");
  return digits || undefined;
}

function sanitizeToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.replace(/\s+/g, "");
  return trimmed || undefined;
}

export function isMetaCapiConfigured(): boolean {
  return !!(
    sanitizeToken(process.env.META_CAPI_ACCESS_TOKEN) &&
    sanitizePixelId(process.env.META_PIXEL_ID)
  );
}

function buildUserData(params: MetaEventParams): Record<string, string[] | string> {
  const userData: Record<string, string[] | string> = {};
  if (params.email) userData.em = [sha256(normalizeEmail(params.email))];
  if (params.phone) userData.ph = [sha256(normalizePhone(params.phone))];
  if (params.name) {
    const parts = params.name.trim().split(/\s+/);
    if (parts[0]) userData.fn = [sha256(normalizeName(parts[0]))];
    if (parts.length > 1) userData.ln = [sha256(normalizeName(parts[parts.length - 1]))];
  }
  if (params.externalId) userData.external_id = [sha256(params.externalId.trim().toLowerCase())];
  // Browser cookies are sent as-is (Meta requirement — do NOT hash fbp/fbc).
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;
  // IP & UA sent as-is (Meta requirement — do NOT hash).
  if (params.clientIpAddress) userData.client_ip_address = params.clientIpAddress;
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent;
  return userData;
}

/**
 * Kirim satu event ke Meta Conversions API. Dedup via `eventId` yang harus sama
 * dengan `eventID` pixel browser, jadi event server & browser DIGABUNG Meta (bukan dobel).
 */
export async function sendMetaEvent(params: MetaEventParams): Promise<MetaCapiResult> {
  const accessToken = sanitizeToken(process.env.META_CAPI_ACCESS_TOKEN);
  const pixelId = sanitizePixelId(params.pixelId) || sanitizePixelId(process.env.META_PIXEL_ID);

  if (!accessToken) {
    return { sent: false, skippedReason: "META_CAPI_ACCESS_TOKEN belum diset" };
  }
  if (!pixelId) {
    return { sent: false, skippedReason: "META_PIXEL_ID belum diset (dan tidak ada pixel per-agen)" };
  }

  const userData = buildUserData(params);

  // Butuh minimal satu sinyal matching kuat (IP/UA saja tidak cukup untuk Meta).
  if (!userData.em && !userData.ph && !userData.fbp && !userData.fbc && !userData.external_id) {
    return { sent: false, skippedReason: "Tidak ada sinyal matching (email/telepon/fbp/fbc/external_id)" };
  }

  const customData: Record<string, any> = {
    currency: params.currency || "IDR",
  };
  if (typeof params.value === "number") customData.value = params.value;
  if (params.contentName) customData.content_name = params.contentName;
  if (params.contentCategory) customData.content_category = params.contentCategory;
  if (params.contents?.length) {
    customData.contents = params.contents;
    customData.content_type = "product";
  }

  const event: Record<string, any> = {
    event_name: params.eventName || "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: params.actionSource || "website",
    user_data: userData,
    custom_data: customData,
  };
  if (params.eventSourceUrl) event.event_source_url = params.eventSourceUrl;

  const body: Record<string, any> = { data: [event] };
  const testCode = params.testEventCode || process.env.META_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;

  body.access_token = accessToken;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = json?.error?.message || `HTTP ${resp.status}`;
      console.error(`[Meta CAPI] Gagal kirim ${event.event_name} (pixel ${pixelId}):`, msg);
      return { sent: false, error: msg, fbtraceId: json?.error?.fbtrace_id };
    }
    console.log(
      `[Meta CAPI] ${event.event_name} terkirim (pixel ${pixelId}, event_id ${params.eventId}): events_received=${json.events_received}`,
    );
    return { sent: true, eventsReceived: json.events_received, fbtraceId: json.fbtrace_id };
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Timeout 10 detik" : err?.message || String(err);
    console.error("[Meta CAPI] Error:", msg);
    return { sent: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendMetaPurchaseEvent(params: MetaPurchaseParams): Promise<MetaCapiResult> {
  return sendMetaEvent({
    eventName: params.eventName || "Purchase",
    eventId: `scalev_${params.orderId}`,
    value: params.value,
    currency: params.currency,
    email: params.email,
    phone: params.phone,
    name: params.name,
    contents: params.contents,
    contentName: params.contentName,
    pixelId: params.pixelId,
    eventSourceUrl: params.eventSourceUrl,
    testEventCode: params.testEventCode,
    fbp: params.fbp,
    fbc: params.fbc,
    externalId: params.externalId,
  });
}

// ── Verifikasi keaslian webhook Scalev ───────────────────────────────────────
// Berlapis & aman-secara-default:
//   1. Tanda tangan HMAC-SHA256 (SCALEV_SIGNING_SECRET) atas body mentah — cara
//      "signing secret" Scalev. Coba beberapa nama header umum + hex/base64.
//   2. Secret bersama (SCALEV_WEBHOOK_SECRET) lewat header atau query `?secret=`.
//   3. Bila TIDAK ada secret sama sekali → terima (perilaku lama, non-breaking).
// Format signature Scalev tidak terdokumentasi resmi, jadi tanda tangan hanya
// MENERIMA bila cocok — TIDAK pernah jadi satu-satunya penolak. Selama secret
// bersama diset (mis. `?secret=` di URL), order asli tetap lolos walau format
// signature berbeda. Diagnostik di handler mencatat NAMA header (bukan nilai)
// saat ditolak, supaya format asli Scalev bisa dikenali dari order pertama.
export interface ScalevAuthResult {
  authorized: boolean;
  method: "signature" | "shared-secret" | "none-configured" | "observe" | "rejected";
  sigPresent: boolean;
  sigValid: boolean;
  sigHeader?: string;
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const SIGNATURE_HEADER_CANDIDATES = [
  "x-scalev-signature",
  "x-signature",
  "x-webhook-signature",
  "x-hub-signature-256",
  "scalev-signature",
];

export function verifyScalevWebhookAuth(
  rawBody: Buffer | string | undefined,
  headers: Record<string, any>,
  query: Record<string, any>,
): ScalevAuthResult {
  const sharedSecret = process.env.SCALEV_WEBHOOK_SECRET;
  const signingSecret = process.env.SCALEV_SIGNING_SECRET;

  let sigPresent = false;
  let sigValid = false;
  let sigHeader: string | undefined;

  // 1. Tanda tangan HMAC-SHA256
  if (signingSecret && rawBody) {
    const raw = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody));
    const hex = createHmac("sha256", signingSecret).update(raw).digest("hex");
    const b64 = createHmac("sha256", signingSecret).update(raw).digest("base64");
    for (const h of SIGNATURE_HEADER_CANDIDATES) {
      const v = headers[h];
      if (typeof v === "string" && v.length) {
        sigPresent = true;
        sigHeader = h;
        const cleaned = v.replace(/^sha256=/i, "").trim();
        if (safeEq(cleaned, hex) || safeEq(cleaned.toLowerCase(), hex) || safeEq(cleaned, b64)) {
          sigValid = true;
          break;
        }
      }
    }
    if (sigValid) {
      return { authorized: true, method: "signature", sigPresent, sigValid, sigHeader };
    }
  }

  // 2. Secret bersama (header atau query)
  if (sharedSecret) {
    const provided =
      (headers["x-scalev-secret"] as string) ||
      (headers["x-webhook-secret"] as string) ||
      (query?.secret as string) ||
      "";
    if (provided && safeEq(String(provided), sharedSecret)) {
      return { authorized: true, method: "shared-secret", sigPresent, sigValid, sigHeader };
    }
  }

  // 3. Tidak ada secret dikonfigurasi sama sekali → terima (legacy, non-breaking)
  if (!sharedSecret && !signingSecret) {
    return { authorized: true, method: "none-configured", sigPresent, sigValid, sigHeader };
  }

  // Shared secret diset = gerbang WAJIB & otoritatif. Sampai sini berarti tidak
  // lolos (signature tak cocok DAN shared secret salah/absen) → tolak.
  if (sharedSecret) {
    return { authorized: false, method: "rejected", sigPresent, sigValid, sigHeader };
  }

  // HANYA signing secret yang diset (tanpa shared secret). Format signature Scalev
  // TIDAK terdokumentasi resmi, jadi default AMAN = mode observasi: TERIMA + tandai
  // untuk di-log, supaya order asli tak pernah di-drop hanya karena tebakan format
  // salah. Setelah format signature dikonfirmasi dari log, set
  // SCALEV_SIGNATURE_STRICT=true untuk mengubahnya jadi penolak tegas.
  const strict = /^(1|true|yes)$/i.test(process.env.SCALEV_SIGNATURE_STRICT || "");
  if (strict) {
    return { authorized: false, method: "rejected", sigPresent, sigValid, sigHeader };
  }
  return { authorized: true, method: "observe", sigPresent, sigValid, sigHeader };
}
