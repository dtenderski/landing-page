import { storage } from "./storage";

/**
 * Seed idempoten dua kode akses event Indobuildtech 2026 dengan label BERBEDA
 * (hadir/offline vs online) sehingga data penukaran & testimoni bisa dibedakan
 * asalnya. Aman dijalankan berulang: lewati kode yang sudah ada.
 *
 * Label mengandung kata kunci ("Hadir"/"Online") yang dibaca `getUserEventSource`
 * untuk menurunkan sumber testimoni.
 */
export async function seedEventAccessCodes(): Promise<void> {
  const codes = [
    {
      code: "INDOBUILDTECH-HADIR",
      label: "Indobuildtech 2026 · Hadir (Offline)",
      plan: "profesional",
      durationDays: 90,
      maxRedemptions: 500,
    },
    {
      code: "INDOBUILDTECH-ONLINE",
      label: "Indobuildtech 2026 · Online",
      plan: "profesional",
      durationDays: 90,
      maxRedemptions: 2000,
    },
  ];

  const existing = await (storage as any).listAccessCodes();
  const existingCodes = new Set(
    (existing as Array<{ code: string }>).map((c) => String(c.code).toUpperCase()),
  );

  for (const c of codes) {
    if (existingCodes.has(c.code.toUpperCase())) continue;
    await (storage as any).createAccessCode({
      code: c.code,
      plan: c.plan,
      durationDays: c.durationDays,
      label: c.label,
      maxRedemptions: c.maxRedemptions,
      createdBy: null,
    });
  }
}
