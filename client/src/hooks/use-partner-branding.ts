import { useQuery } from "@tanstack/react-query";

export interface PartnerBranding {
  slug: string;
  name: string;
  brandName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  tagline: string | null;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  defaultAgentId: string | null;
  hidePlatformBranding: boolean;
}

/**
 * Ubah link "share" Google Drive menjadi URL gambar langsung agar bisa
 * ditampilkan lewat <img>. Link seperti
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 * bukan gambar langsung — dikonversi ke format thumbnail yang bisa di-embed.
 * URL lain dikembalikan apa adanya.
 */
export function toDirectImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const u = url.trim();
  let m = u.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
  m = u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([^&]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
  return u;
}

/**
 * Whitelabel branding untuk host mitra (asosiasi/reseller).
 * Mengembalikan null bila host bukan mitra (host Gustafta biasa).
 */
export function usePartnerBranding() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  // Mode pratinjau: ?preview=<slug> di URL memaksa branding mitra tsb, abaikan host.
  const previewSlug = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview")?.trim() || ""
    : "";
  const { data, isLoading } = useQuery<PartnerBranding | null>({
    queryKey: ["/api/partner/by-host", previewSlug ? `preview:${previewSlug}` : host],
    queryFn: async () => {
      const url = previewSlug
        ? `/api/partner/by-host?preview=${encodeURIComponent(previewSlug)}`
        : `/api/partner/by-host?host=${encodeURIComponent(host)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  return { partner: data ?? null, isLoading };
}
