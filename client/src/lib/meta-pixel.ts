declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[][];
      loaded: boolean;
      version: string;
      push: (...args: unknown[]) => void;
    };
    _fbq: unknown;
  }
}

// Pixel ID resolution order:
//   1. Build-time VITE_META_PIXEL_ID (optional override)
//   2. Runtime fetch from /api/config/meta-pixel (backed by server META_PIXEL_ID)
// This keeps a single source of truth (the server secret) and avoids needing a
// rebuild whenever the pixel changes.
const ENV_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let runtimePixelId: string | null | undefined; // undefined = not fetched yet, null = none

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Meta's _fbc cookie encodes the last ad click (fbclid). fbevents.js normally
 * sets it, but we set it explicitly on landing so it survives even if the pixel
 * loads late or the user navigates before it initializes.
 */
function captureFbclid(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (fbclid && !readCookie("_fbc")) {
      writeCookie("_fbc", `fb.1.${Date.now()}.${fbclid}`, 90);
    }
  } catch {
    /* ignore */
  }
}

/** First-party browser pixel cookie (Meta match key). */
export function getFbp(): string | undefined {
  return readCookie("_fbp");
}

/** Ad-click cookie derived from fbclid (Meta match key, strongest for attribution). */
export function getFbc(): string | undefined {
  return readCookie("_fbc");
}

/**
 * Append fbp/fbc to an (external) checkout URL so the browser attribution can
 * ride along to the payment processor and, if it forwards them, back to our
 * Conversions API Purchase event. Safe to call even when cookies are absent.
 */
export function withMetaAttribution(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    const fbp = getFbp();
    const fbc = getFbc();
    if (fbp) u.searchParams.set("fbp", fbp);
    if (fbc) u.searchParams.set("fbc", fbc);
    u.searchParams.set("esu", window.location.href);
    return u.toString();
  } catch {
    return url;
  }
}

function sanitizePixelId(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9]/g, "");
  return digits || null;
}

/** ID unik untuk dedup event browser ↔ server (Meta menggabungkan yang ber-ID sama). */
function genEventId(): string {
  try {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Kirim event yang sama ke Conversions API server-side (fire-and-forget) memakai
 * `eventId` yang identik dengan pixel browser, plus fbp/fbc untuk matching. Tahan
 * terhadap ad-blocker/iOS yang memblokir pixel browser.
 */
function relayServerEvent(
  eventName: string,
  eventId: string,
  data?: { content_name?: string; content_category?: string; value?: number; currency?: string },
): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      eventName,
      eventId,
      value: typeof data?.value === "number" ? data.value : undefined,
      currency: data?.currency || "IDR",
      contentName: data?.content_name,
      contentCategory: data?.content_category,
      fbp: getFbp(),
      fbc: getFbc(),
      eventSourceUrl: window.location.href,
    });
    void fetch("/api/track/meta-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {
      /* tracking beacon — abaikan error */
    });
  } catch {
    /* ignore */
  }
}

async function resolvePixelId(): Promise<string | null> {
  const envId = sanitizePixelId(ENV_PIXEL_ID);
  if (envId) return envId;
  if (runtimePixelId !== undefined) return runtimePixelId ?? null;
  try {
    const resp = await fetch("/api/config/meta-pixel", { credentials: "omit" });
    const json = await resp.json().catch(() => ({}));
    runtimePixelId = sanitizePixelId(json?.pixelId);
  } catch {
    runtimePixelId = null;
  }
  return runtimePixelId;
}

function injectPixelScript(): void {
  if (typeof window === "undefined" || (window as any).fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args);
    } else {
      fbq.queue.push(args);
    }
  } as Window["fbq"];

  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
}

export function initMetaPixel(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (isInitialized || typeof window === "undefined") return;
    captureFbclid();
    const pixelId = await resolvePixelId();
    if (!pixelId) return;
    injectPixelScript();
    if (typeof window.fbq === "function") {
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
      isInitialized = true;
    }
  })();
  return initPromise;
}

export function trackPageView(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
}

export function trackLead(data?: { content_name?: string; value?: number; currency?: string }): void {
  const eventId = genEventId();
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Lead", data, { eventID: eventId });
  }
  relayServerEvent("Lead", eventId, data);
}

export function trackCompleteRegistration(data?: { content_name?: string; value?: number; currency?: string }): void {
  const eventId = genEventId();
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "CompleteRegistration", data, { eventID: eventId });
  }
  relayServerEvent("CompleteRegistration", eventId, data);
}

export function trackInitiateCheckout(data?: { content_name?: string; value?: number; currency?: string; num_items?: number }): void {
  const eventId = genEventId();
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", data, { eventID: eventId });
  }
  relayServerEvent("InitiateCheckout", eventId, data);
}

/**
 * Fire a browser-side Purchase. Pass `eventID` = `scalev_{orderId}` so Meta
 * deduplicates it against the server CAPI Purchase (they merge, not double).
 */
export function trackPurchase(
  data: { value: number; currency: string; content_name?: string },
  eventID?: string,
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventID) {
    window.fbq("track", "Purchase", data, { eventID });
  } else {
    window.fbq("track", "Purchase", data);
  }
}

export function trackViewContent(data?: { content_name?: string; content_category?: string; value?: number; currency?: string }): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "ViewContent", data);
}

export function trackContact(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "Contact");
}

export function trackSearch(data?: { search_string?: string; content_category?: string }): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "Search", data);
}

export function trackCustomEvent(eventName: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", eventName, data);
}
