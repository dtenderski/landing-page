/**
 * GUSTAFTA — Paket MultiClaw per Bidang (Shared Config)
 * Sumber tunggal definisi paket bidang untuk MultiClaw Suite.
 *
 * Model akses:
 *   - Starter+        : claw dasar (BASE_CLAW_ROUTES) selalu terbuka, tanpa paket.
 *   - Profesional (2) : pilih PRO_PACKAGE_SLOTS paket bidang — hanya claw di paket terpilih yang terbuka.
 *   - Bisnis (3+)     : SEMUA paket terbuka otomatis.
 */

export interface ClawPackage {
  id: string;
  name: string;
  description: string;
  icon: string; // nama ikon lucide
  color: string;
  routes: string[];
}

/** Jumlah paket bidang yang boleh dipilih pelanggan tier Profesional */
export const PRO_PACKAGE_SLOTS = 2;

/** Claw dasar — terbuka untuk Starter ke atas, TIDAK termasuk paket bidang */
export const BASE_CLAW_ROUTES: string[] = [
  "/sbu-claw",
  "/skema-claw",
  "/lkut-claw",
  "/abu-claw",
  "/panduan-sbu",
  "/panduan-askom",
  "/tendera-claw",
  "/konstra-tender-claw",
  "/kontrak-claw",
  "/qs-claw",
  "/pengawas-claw",
  "/pjbu-claw",
  "/keuangan-claw",
];

export const CLAW_PACKAGES: ClawPackage[] = [
  {
    id: "skk-kompetensi",
    name: "SKK & Kompetensi",
    description: "7 claw pendamping SKK Konstruksi: Manajemen Pelaksanaan, Arsitektur, Survei, Geoteknik, Jalan & Jembatan, Tata Lingkungan, Elektrikal.",
    icon: "GraduationCap",
    color: "indigo",
    routes: [
      "/manprojak-claw",
      "/arsitektur-claw",
      "/surveipemetaan-claw",
      "/geoteknik-claw",
      "/jalanjembatan-claw",
      "/tatalingkungan-claw",
      "/elektrikal-claw",
    ],
  },
  {
    id: "teknik-konstruksi",
    name: "Teknik Konstruksi",
    description: "12 claw teknis: Bangunan Gedung, Sipil, MEP, BIM, Desain, Operasional Lapangan, Manajemen Proyek, Project Intelligence.",
    icon: "Building2",
    color: "sky",
    routes: [
      "/bg-claw",
      "/bs-claw",
      "/im-claw",
      "/ko-claw",
      "/kk-claw",
      "/sipil-claw",
      "/mep-claw",
      "/bim-claw",
      "/desain-claw",
      "/siteops-claw",
      "/konstra-claw",
      "/brain-claw",
    ],
  },
  {
    id: "k3-keselamatan",
    name: "K3 & Keselamatan",
    description: "6 claw K3: SKK K3, SMK3 & IMS, Manajemen K3, CSMS, K3 Migas Offshore, Lingkungan Hidup.",
    icon: "HardHat",
    color: "red",
    routes: [
      "/safira-claw",
      "/smk3-claw",
      "/k3man-claw",
      "/csms-claw",
      "/offshore-safety-claw",
      "/lingkungan-claw",
    ],
  },
  {
    id: "perizinan-regulasi",
    name: "Perizinan & Regulasi",
    description: "6 claw perizinan: OSS-RBA & NIB, LKPM BKPM, PUB & LKUT, E-SIMPAN, NSPK Navigator, Teras LPJK.",
    icon: "Globe",
    color: "teal",
    routes: [
      "/lkpm-claw",
      "/oss-claw",
      "/pub-lkut-claw",
      "/esimpan-claw",
      "/nspk-navigator-claw",
      "/teras-lpjk-1",
    ],
  },
  {
    id: "sistem-manajemen",
    name: "Sistem Manajemen & Compliance",
    description: "6 claw sistem manajemen: ISO 9001, ISO 14001, ISO 37001 Anti-Penyuapan, Anti-Korupsi KPK, ESG, HACCP & Halal.",
    icon: "Shield",
    color: "green",
    routes: [
      "/smap-claw",
      "/pancek-claw",
      "/iso-claw-9001",
      "/iso-claw-14001",
      "/esg-claw",
      "/haccp-claw",
    ],
  },
  {
    id: "properti",
    name: "Properti & Real Estate",
    description: "2 claw properti: Developer Real Estate dan Konsultan Properti Konsumen.",
    icon: "Home",
    color: "violet",
    routes: ["/dev-properti-claw", "/estate-care-claw"],
  },
  {
    id: "energi-industri",
    name: "Energi & Industri",
    description: "11 claw energi & industri: Migas, EBT & PLTS, Transisi Energi, Ketenagalistrikan, Transmisi PLN, Pertambangan, Geologi, Industri 4.0, Lean OpEx, Supply Chain.",
    icon: "Zap",
    color: "orange",
    routes: [
      "/migas-claw",
      "/energi-claw",
      "/ebt-solar-claw",
      "/transisi-energi-claw",
      "/ketenagalistrikan-claw",
      "/transmisi-claw",
      "/pertambangan-claw",
      "/geologi-claw",
      "/industri40-claw",
      "/lean-opex-claw",
      "/supply-chain-claw",
    ],
  },
  {
    id: "hr-bisnis",
    name: "SDM & Korporasi",
    description: "7 claw SDM & bisnis: Rekrutmen, Learning & Development, Manajemen Kinerja, Hubungan Industrial, Pajak, Korporasi, Cybersecurity & PDP.",
    icon: "Briefcase",
    color: "emerald",
    routes: [
      "/rekrutmen-claw",
      "/ld-kompetensi-claw",
      "/penilaian-kinerja-claw",
      "/hubungan-industrial-claw",
      "/pajak-claw",
      "/korporasi-claw",
      "/cybersecurity-claw",
    ],
  },
  {
    id: "marketing-digital",
    name: "Marketing & Digital",
    description: "9 claw pemasaran: Market Intelligence, Auto-Pilot Jualan, Riset Audiens, Funnel Otomatis, Agen Keputusan, Digital Marketing, CRM & Sales, Brand & Content, E-Commerce.",
    icon: "TrendingUp",
    color: "rose",
    routes: [
      "/market-intelligence-claw",
      "/autopilot-jualan",
      "/riset-audiens",
      "/funnel-otomatis",
      "/agen-keputusan",
      "/digital-marketing-claw",
      "/crm-sales-claw",
      "/brand-content-claw",
      "/ecommerce-claw",
    ],
  },
  {
    id: "pendidikan-riset",
    name: "Pendidikan & Riset",
    description: "6 claw edukasi: Konseling Akademik, IB Testing, ETLO Academy & BizDev, Tutor Teknik, Riset & Skripsi.",
    icon: "BookOpen",
    color: "cyan",
    routes: [
      "/educounsel-claw",
      "/ibtu-claw",
      "/etlo-academy-claw",
      "/etlo-bizdev-claw",
      "/tutor-teknik-claw",
      "/riset-skripsi-claw",
    ],
  },
];

const ROUTE_TO_PACKAGE: Record<string, string> = {};
for (const pkg of CLAW_PACKAGES) {
  for (const r of pkg.routes) ROUTE_TO_PACKAGE[r] = pkg.id;
}

/** Cari paket pemilik sebuah route claw. undefined = bukan claw paket (mis. claw dasar / halaman lain). */
export function packageForRoute(pathname: string): ClawPackage | undefined {
  const id = ROUTE_TO_PACKAGE[pathname];
  return id ? CLAW_PACKAGES.find((p) => p.id === id) : undefined;
}

export function isBaseClawRoute(pathname: string): boolean {
  return BASE_CLAW_ROUTES.includes(pathname);
}

export function isValidPackageId(id: string): boolean {
  return CLAW_PACKAGES.some((p) => p.id === id);
}

/** Jatah paket berdasarkan tier langganan (angka tier dari PLAN_CONFIGS) */
export function packageAllowanceForTier(tier: number): "all" | number {
  if (tier >= 3) return "all";
  if (tier === 2) return PRO_PACKAGE_SLOTS;
  return 0;
}

/**
 * Format katalog paket claw jadi teks ringkas untuk prompt AI.
 * Dipakai Generator Proposal agar bisa merekomendasikan claw SIAP PAKAI sebagai
 * "departemen manajemen AI" perusahaan (bukan hanya merakit tim dari nol).
 * Deterministik dari CLAW_PACKAGES — tiap claw = tim AI multi-agen satu bidang.
 */
export function formatClawCatalogForPrompt(): string {
  return CLAW_PACKAGES.map((p) => `- ${p.name}: ${p.description}`).join("\n");
}

/** Daftar nama paket claw yang valid (untuk validasi rekomendasi AI). */
export function clawPackageNames(): string[] {
  return CLAW_PACKAGES.map((p) => p.name);
}

/**
 * Petakan input bebas (dari AI) ke NAMA PAKET kanonik di CLAW_PACKAGES.
 * Mencegah rekomendasi claw yang mengarang/di luar katalog: hanya nama paket
 * yang benar-benar ada yang lolos. Toleran — cocokkan via nama paket persis,
 * substring nama, lalu isi deskripsi (mis. "SKK K3" → "K3 & Keselamatan").
 * Kembalikan null bila tak ada padanan.
 */
export function resolveClawPackageName(input: string): string | null {
  const q = (input || "").trim().toLowerCase();
  if (!q) return null;
  const exact = CLAW_PACKAGES.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact.name;
  const byName = CLAW_PACKAGES.find(
    (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()),
  );
  if (byName) return byName.name;
  const byDesc = CLAW_PACKAGES.find((p) => p.description.toLowerCase().includes(q));
  if (byDesc) return byDesc.name;
  return null;
}
