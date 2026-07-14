/**
 * GUSTAFTA — Paket MultiClaw per Bidang (Client Hook)
 * Membaca /api/claw-packages/my: daftar paket, pilihan user, jatah slot.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { ClawPackage } from "@shared/claw-packages";
import { CLAW_PACKAGES, packageForRoute, isBaseClawRoute, PRO_PACKAGE_SLOTS } from "@shared/claw-packages";

export { packageForRoute, isBaseClawRoute, PRO_PACKAGE_SLOTS };
export type { ClawPackage };

export interface ClawPackagesInfo {
  packages: ClawPackage[];
  selected: string[];
  allowance: "all" | number;
  slots: number;
  tier: number;
  locked: boolean;
}

export function useClawPackages() {
  const { isAuthenticated } = useAuth();

  const query = useQuery<ClawPackagesInfo>({
    queryKey: ["/api/claw-packages/my"],
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const info: ClawPackagesInfo = query.data ?? {
    packages: CLAW_PACKAGES,
    selected: [],
    allowance: 0,
    slots: PRO_PACKAGE_SLOTS,
    tier: 0,
    locked: false,
  };

  /** Apakah user boleh akses claw pada route paket tsb (khusus route milik paket bidang) */
  function canAccessPackageRoute(pathname: string): boolean {
    const pkg = packageForRoute(pathname);
    if (!pkg) return true; // bukan route paket — bukan urusan hook ini
    if (info.allowance === "all") return true;
    if (info.allowance > 0) return info.selected.includes(pkg.id);
    return false;
  }

  return { ...query, info, canAccessPackageRoute };
}
