/**
 * Gustafta — Sumber Data Tunggal untuk Harga & Produk
 *
 * Semua angka harga, tier layanan jasa, dan kredit pesan didefinisikan DI SINI.
 * Halaman /produk, /packs, /store, /store-featured, /pricing, /checkout WAJIB
 * mengambil dari file ini agar harga & penamaan selalu konsisten di seluruh aplikasi.
 *
 * Aturan kanonik (jangan dilanggar):
 * - Setiap pengguna WAJIB punya lisensi (hak pakai). Yang berbeda hanya cara mendapatnya.
 * - Biaya BULANAN (hosting + token) dikenakan ke SEMUA produk chatbot — biasa maupun premium.
 *   Bulanan mengikuti 4 tier platform (Starter/Profesional/Bisnis/Enterprise); 100% ke Gustafta.
 * - 3 cara mendapatkan chatbot:
 *     1. Chatbot Biasa (kosongan, user merakit)           = lisensi STANDAR + bulanan.
 *     2. Chatbot Premium (siap pakai, Gustafta/Creator)   = lisensi PREMIUM (lebih tinggi) + bulanan.
 *     3. Jasa Order (custom, belum ada di katalog)        = biaya SETUP sekali (termasuk lisensi) + bulanan.
 *   Beda chatbot biasa vs premium HANYA di biaya lisensi (premium tidak dirakit sendiri).
 * - Marketplace/Creator: bagi hasil 80% Creator / 20% Gustafta, dihitung HANYA dari biaya LISENSI premium.
 *   Biaya bulanan (hosting) pembeli tetap 100% ke Gustafta.
 * - Starter Kit = pintu masuk murah (lisensi Rp 0) untuk jalur Chatbot Biasa; juga dibundel GRATIS di jalur Jasa.
 * - Tidak ada paket "Gratis" permanen — gratis hanya bonus trial 7 hari.
 */

// ─── Harga inti ────────────────────────────────────────────────────────────────
export const PRICING = {
  /** Aktivasi = biaya sekali bayar untuk mengaktifkan hak pakai chatbot (menggantikan "Lisensi") */
  license: {
    /** Harga coret (anchor) sebelum diskon */
    normal: "Rp 299.000",
    /** Harga aktivasi sekali bayar */
    price: "Rp 99.000",
    /** Bentuk singkat untuk badge/CTA */
    short: "Rp 99rb",
    amount: 99000,
  },
  starterKit: {
    price: "Rp 245.000",
    /** Bentuk singkat untuk badge/CTA */
    short: "Rp 245rb",
    amount: 245000,
    trialDays: 7,
  },
  setup: {
    price: "Rp 999.000",
    amount: 999000,
  },
  subscription: {
    starter: { label: "Rp 199.000", perMonth: "Rp 199rb/bln", amount: 199000 },
    profesional: { label: "Rp 499.000", perMonth: "Rp 499rb/bln", amount: 499000 },
    bisnis: { label: "Rp 999.000", perMonth: "Rp 999rb/bln", amount: 999000 },
  },
} as const;

// ─── Trilogi GUSTAFTA (produk buku/ebook — sumber tunggal harga Trilogi) ──────────
// Dipakai di /trilogi (landing) & /konstruksi. JANGAN tulis ulang angka di halaman.
// Sinkron dengan produk Scalev "Gustafta Ebook Trilogy" (slug: gustafta-ebook-trilogy,
// varian "basic" id 533205 & "Bundling" id 533206) — harga di sini WAJIB sama persis
// dengan harga varian aktif di Scalev, atau checkout akan menampilkan harga berbeda.
export const TRILOGI = {
  /** PAKET PREMIUM (Bundling Lengkap) — varian Scalev "Bundling" (id 533206) */
  bundle: {
    price: "Rp 245.000",
    normal: "Rp 445.000",
    amount: 245000,
    savings: "Hemat Rp 200.000",
    bonuses: [
      "Buku 1: DIALOG (PDF, 166 halaman) — Akses Segera",
      "Buku 2: KOLABORASI (PDF) — Dikirim saat rilis",
      "Buku 3: KREASI (PDF) — Dikirim saat rilis",
      "Akses AI Mentor Gustafta — Tanya jawab langsung soal isi ke-3 buku, kapan saja",
      "Prompt Trilogi Lengkap — Panduan siap pakai: Dialog → Kolaborasi → Kreasi",
      "Trial Gustafta Builder 7 Hari — Bonus eksklusif senilai Rp 150.000",
    ],
    guarantee: "Garansi 30 Hari Bersyarat — uang kembali 100% jika sudah membaca min. 2 dari 3 buku, mencoba min. 1 latihan per buku, dan disertai dokumentasi singkat.",
    cocokUntuk: [
      "Pensiunan/Senior yang ingin mewariskan keahlian bertahun-tahun",
      "Konsultan, Guru, Dokter, Pakar Domain yang ingin menjangkau lebih banyak orang",
      "Profesional transisi karier yang ingin membangun aset pengetahuan mandiri",
      "Kreator & Pengusaha yang ingin sistematisasi visi besar menjadi produk digital",
    ],
  },
  /** PAKET BASIC — varian Scalev "basic" (id 533205) */
  bukuSatu: {
    price: "Rp 87.000",
    normal: "Rp 245.000",
    amount: 87000,
    savings: "Hemat Rp 158.000",
    bonuses: [
      "Buku 1: DIALOG (PDF, 166 halaman) — Akses Segera",
      "Akses AI Mentor Gustafta — Tanya jawab langsung soal isi Buku 1",
      "Prompt Dasar Trilogi — Panduan bertanya yang efektif untuk menggali pengetahuan",
      "Akses Lifetime — Sekali beli, miliki selamanya",
      "Update Konten Minor — Gratis update konten",
    ],
    cocokUntuk: [
      "Profesional yang ingin segera mempraktikkan AI untuk dokumentasi pengetahuan",
      "Pencari kerja yang ingin merapikan portofolio kompetensi",
      "Siapa pun yang ingin memulai perjalanan transformasi digital dengan risiko minimal",
    ],
  },
} as const;

// ─── Ebook Buku I — DIALOG (produk satuan, entry-level, TERPISAH dari TRILOGI.bukuSatu) ──
// Dipakai di /ebook-dialog. Harga sengaja lebih murah dari TRILOGI.bukuSatu (Rp245rb) sebagai
// produk pintu-masuk berdiri sendiri — JANGAN timpa/gabung dengan entry TRILOGI di atas.
export const EBOOK_DIALOG = {
  price: "Rp 79.000",
  normal: "Rp 149.000",
  amount: 79000,
  bonuses: [
    "Ebook Buku I — DIALOG (PDF, 160+ halaman) — download langsung",
    "Prompt Khusus Buku I (menyusul via email)",
    "Modul pendamping Buku I (menyusul via email)",
    "Video pembelajaran NotebookLM (menyusul via email)",
    "Trial 7 Hari coba merakit chatbot AI pertamamu — aktif otomatis bila kamu sudah punya akun Gustafta",
  ],
} as const;

/** Kalimat info skema aktivasi (dipakai berulang di kartu paket bisnis) */
export const LICENSE_INFO = `Dengan Starter Kit ${PRICING.starterKit.price} (sekali) → aktivasi Rp 0 · Tanpa Starter Kit → aktivasi ${PRICING.license.price} (sekali)`;
/** @deprecated alias — gunakan LICENSE_INFO */
export const AKTIVASI_INFO = LICENSE_INFO;

// ─── Marketplace / Program Creator ───────────────────────────────────────────────
// Bagi hasil chatbot premium yang dibuat Creator & dijual di toko Gustafta.
// PENTING: split dihitung HANYA dari biaya LISENSI premium.
// Biaya bulanan (hosting + token) pembeli tetap 100% ke Gustafta (bukan bagian Creator).
export const MARKETPLACE = {
  creatorSharePct: 80,
  gustaftaSharePct: 20,
  /** Dasar bagi hasil: 'license' saja — TIDAK termasuk biaya bulanan. */
  splitBasis: "license" as const,
} as const;

/** Kalimat info bagi hasil Creator (dipakai di halaman store/creator) */
export const MARKETPLACE_INFO = `Bagi hasil ${MARKETPLACE.creatorSharePct}% Creator / ${MARKETPLACE.gustaftaSharePct}% Gustafta — dihitung dari biaya lisensi. Biaya bulanan (hosting) 100% ke Gustafta.`;

// ─── Hosting / Paket Berlangganan ────────────────────────────────────────────────
export const HOSTING = {
  monthly: "Rp 199.000/bln",
  quarterly: "Rp 299.000/3bln",
  semiannual: "Rp 999.000/6bln",
  annual: "Rp 1.999.000/thn",
} as const;

/** Ringkasan periode hosting untuk strip info, mis. di /packs */
export const HOSTING_SUMMARY = `${HOSTING.monthly} · ${HOSTING.quarterly} · ${HOSTING.semiannual} · ${HOSTING.annual}`;

/** Rentang singkat hosting untuk kartu tier */
export const HOSTING_RANGE = "Rp 199rb–1.999rb/periode";

/** Periode berlangganan hosting (durasi) — sumber tunggal untuk /pricing & /checkout */
export interface HostingPeriod {
  key: string;
  name: string;
  price: string;
  priceNum: number;
  period: string;
  duration: string;
  savings?: string;
}

export const HOSTING_PERIODS: HostingPeriod[] = [
  { key: "monthly_1",  name: "1 Bulan",  price: "Rp 199.000",   priceNum: 199000,  period: "/bulan",   duration: "1 Bulan" },
  { key: "monthly_3",  name: "3 Bulan",  price: "Rp 299.000",   priceNum: 299000,  period: "/3 bulan", duration: "3 Bulan",  savings: "Hemat Rp 298.000" },
  { key: "monthly_6",  name: "6 Bulan",  price: "Rp 999.000",   priceNum: 999000,  period: "/6 bulan", duration: "6 Bulan",  savings: "Hemat Rp 195.000" },
  { key: "monthly_12", name: "12 Bulan", price: "Rp 1.999.000", priceNum: 1999000, period: "/tahun",   duration: "12 Bulan", savings: "Hemat Rp 389.000" },
];

// ─── Tier Layanan Jasa (dirakit tim Gustafta) ────────────────────────────────────
// CANONICAL: 4 tier. Dipakai di /packs (dan halaman manapun yang menampilkan harga jasa).
export interface ServiceTier {
  tier: string;
  jasaKey: string;
  price: string;
  amount: number;
  scope: string;
  desc: string;
  tag: string;
  tagClass: string;
  highlight: boolean;
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    tier: "Tier 1",
    jasaKey: "tier1",
    price: "Rp 1.499.000",
    amount: 1499000,
    scope: "Chatbot Dasar",
    desc: "Chatbot ringan — FAQ, info produk, layanan dasar",
    tag: "Mulai",
    tagClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    highlight: false,
  },
  {
    tier: "Tier 2",
    jasaKey: "tier2",
    price: "Rp 2.499.000",
    amount: 2499000,
    scope: "Chatbot Menengah",
    desc: "Chatbot menengah — multi-fungsi, lead gen, sales assist",
    tag: "Populer",
    tagClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    highlight: true,
  },
  {
    tier: "Tier 3",
    jasaKey: "tier3",
    price: "Rp 4.900.000",
    amount: 4900000,
    scope: "Chatbot Kompleks",
    desc: "Chatbot kompleks — orkestrasi, knowledge base luas",
    tag: "Bisnis",
    tagClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    highlight: false,
  },
  {
    tier: "Tier 4",
    jasaKey: "tier4",
    price: "Rp 7.490.000",
    amount: 7490000,
    scope: "Chatbot Enterprise",
    desc: "Chatbot enterprise — multi-domain, agentic penuh",
    tag: "Enterprise",
    tagClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    highlight: false,
  },
];

// ─── Kredit Pesan Ekstra (top-up) ────────────────────────────────────────────────
export interface CreditPack {
  label: string;
  pesan: string;
  price: string;
  perPesan: string;
  color: string;
  border: string;
  bg: string;
  badge: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    label: "Pack S",
    pesan: "500 pesan",
    price: "Rp 49.000",
    perPesan: "Rp 98/pesan",
    color: "text-blue-500",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    badge: "",
  },
  {
    label: "Pack M",
    pesan: "1.500 pesan",
    price: "Rp 129.000",
    perPesan: "Rp 86/pesan",
    color: "text-indigo-500",
    border: "border-indigo-200 dark:border-indigo-800",
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    badge: "PALING LAKU",
  },
  {
    label: "Pack L",
    pesan: "3.000 pesan",
    price: "Rp 229.000",
    perPesan: "Rp 76/pesan",
    color: "text-violet-500",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50/50 dark:bg-violet-950/20",
    badge: "",
  },
  {
    label: "Pack XL",
    pesan: "5.000 pesan",
    price: "Rp 349.000",
    perPesan: "Rp 70/pesan",
    color: "text-purple-500",
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    badge: "TERBAIK",
  },
];

/** Format angka rupiah penuh, mis. 299000 → "Rp 299.000" */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
