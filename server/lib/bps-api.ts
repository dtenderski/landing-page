/**
 * BPS WebAPI Integration — IHPB Bahan Bangunan/Konstruksi
 *
 * Mengakses data Indeks Harga Perdagangan Besar (IHPB)
 * Bahan Bangunan/Konstruksi dari BPS Indonesia.
 *
 * Registrasi API key gratis: https://webapi.bps.go.id/developer/
 * Dokumentasi: https://webapi.bps.go.id/documentation/
 */

const BPS_API_BASE = "https://webapi.bps.go.id/v1/api";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 jam cache

interface BpsCache {
  data: any;
  fetchedAt: number;
}

const cache: Record<string, BpsCache> = {};

function getApiKey(): string | null {
  return process.env.BPS_API_KEY || null;
}

async function bpsFetch(endpoint: string): Promise<any> {
  const key = getApiKey();
  if (!key) throw new Error("BPS_API_KEY belum dikonfigurasi");

  const url = `${BPS_API_BASE}/${endpoint}/key/${key}`;
  const cacheEntry = cache[url];
  if (cacheEntry && Date.now() - cacheEntry.fetchedAt < CACHE_TTL_MS) {
    return cacheEntry.data;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`BPS API HTTP ${res.status}`);
    const json = await res.json();
    cache[url] = { data: json, fetchedAt: Date.now() };
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

// ── IHPB Bahan Bangunan/Konstruksi ──────────────────────────────────────────

export interface IhpbData {
  period: string;
  overallIndex: number | null;
  categories: { name: string; index: number | null }[];
  source: string;
  note: string;
  fetchedAt: string;
}

export async function getIhpbKonstruksi(): Promise<IhpbData> {
  const key = getApiKey();
  if (!key) {
    return getMockIhpbData();
  }

  try {
    // Endpoint: tabel statis IHPB Bahan Bangunan domain nasional
    const data = await bpsFetch("statictable/id/1018/domain/0000");
    return parseIhpbResponse(data);
  } catch (err) {
    console.error("[BPS API] IHPB fetch error:", err);
    return getMockIhpbData();
  }
}

function parseIhpbResponse(raw: any): IhpbData {
  try {
    const rows = raw?.data?.data || [];
    // Ambil baris terakhir (periode terbaru)
    const latest = rows[rows.length - 1] || {};
    return {
      period: latest.label || "Data tidak tersedia",
      overallIndex: parseFloat(latest.val) || null,
      categories: [],
      source: "BPS WebAPI",
      note: "Indeks Harga Perdagangan Besar Bahan Bangunan/Konstruksi",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return getMockIhpbData();
  }
}

// ── Mock data ketika API key belum dikonfigurasi ─────────────────────────────
function getMockIhpbData(): IhpbData {
  return {
    period: "Estimasi 2025 (data statis)",
    overallIndex: null,
    categories: [
      { name: "Kayu & Barang dari Kayu", index: 198.5 },
      { name: "Semen & Barang Galian Non Logam", index: 145.3 },
      { name: "Besi, Baja & Produk Logam", index: 167.8 },
      { name: "Pasir, Batu & Kerikil", index: 138.2 },
      { name: "Cat & Vernis", index: 152.6 },
      { name: "Pipa & Fitting PVC/Besi", index: 160.1 },
      { name: "Keramik & Granit", index: 128.9 },
      { name: "Kabel & Instalasi Listrik", index: 175.4 },
    ],
    source: "Estimasi (BPS API key belum dikonfigurasi)",
    note: "Data di atas adalah ESTIMASI. Aktifkan BPS_API_KEY untuk data real-time dari BPS.",
    fetchedAt: new Date().toISOString(),
  };
}

// ── Trend IHPB 12 bulan terakhir ─────────────────────────────────────────────
export interface IhpbTrend {
  months: string[];
  indices: (number | null)[];
  source: string;
  fetchedAt: string;
}

export async function getIhpbTrend(): Promise<IhpbTrend> {
  const key = getApiKey();
  if (!key) {
    return getMockTrendData();
  }

  try {
    const data = await bpsFetch("statictable/id/1018/domain/0000");
    return parseTrendResponse(data);
  } catch (err) {
    console.error("[BPS API] IHPB trend fetch error:", err);
    return getMockTrendData();
  }
}

function parseTrendResponse(raw: any): IhpbTrend {
  try {
    const rows = (raw?.data?.data || []).slice(-12);
    return {
      months: rows.map((r: any) => r.label || ""),
      indices: rows.map((r: any) => parseFloat(r.val) || null),
      source: "BPS WebAPI",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return getMockTrendData();
  }
}

function getMockTrendData(): IhpbTrend {
  const months = ["Jun'24", "Jul'24", "Agu'24", "Sep'24", "Okt'24", "Nov'24",
    "Des'24", "Jan'25", "Feb'25", "Mar'25", "Apr'25", "Mei'25"];
  const base = 158.0;
  return {
    months,
    indices: months.map((_, i) => parseFloat((base + i * 0.6 + Math.random() * 0.8).toFixed(1))),
    source: "Estimasi (BPS API key belum dikonfigurasi)",
    fetchedAt: new Date().toISOString(),
  };
}

export function isBpsConfigured(): boolean {
  return !!getApiKey();
}
