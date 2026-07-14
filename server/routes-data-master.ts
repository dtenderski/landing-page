import type { Express } from "express";
import { db } from "./db";
import { bujkData, materialPrices, insertBujkDataSchema, insertMaterialPriceSchema } from "@shared/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { isAuthenticated } from "./replit_integrations/auth";

// ─────────────────────────────────────────────────────────────────────────────
// buildDataMasterContext — called by the OpenClaw orchestrator to inject real
// data (BUJK binaan + harga material + public NIB lookup) into context
// before sub-agents are dispatched.
// ─────────────────────────────────────────────────────────────────────────────
const COST_KEYWORDS = /\b(biaya|harga|rab|estimasi|anggaran|cost|budget|pagu|satuan|material|beton|baja|tanah|kayu)\b/i;
const BUJK_KEYWORDS = /\b(bujk|perusahaan|klien|nib|sbu|kualifikasi|kontraktor|konsultan|subklas)\b/i;
const NIB_PATTERN = /\b(\d{13})\b/g;

// ── In-memory NIB lookup cache (5-minute TTL) ──────────────────────────────
interface NibCacheEntry { result: string; ts: number; }
const nibCache = new Map<string, NibCacheEntry>();
const NIB_CACHE_TTL = 5 * 60 * 1000;

function getCachedNib(nib: string): string | null {
  const entry = nibCache.get(nib);
  if (!entry) return null;
  if (Date.now() - entry.ts > NIB_CACHE_TTL) { nibCache.delete(nib); return null; }
  return entry.result;
}
function setCachedNib(nib: string, result: string) {
  nibCache.set(nib, { result, ts: Date.now() });
}

// ── Helper: strip HTML tags and collapse whitespace ────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, " ")
    .replace(/\s{2,}/g, " ").trim();
}

// ── Helper: extract key fields from JSON response ──────────────────────────
function parseNibJson(data: any, nib: string): string | null {
  if (!data || typeof data !== "object") return null;
  // Flatten nested structures
  const flat = JSON.stringify(data).toLowerCase();
  if (!flat.includes(nib.slice(0, 8)) && !flat.includes("bujk") && !flat.includes("sbu") && !flat.includes("nib")) return null;

  const lines: string[] = [];
  const nama = data.nama_perusahaan || data.namaBujk || data.nama || data.company_name || data.namaUsaha || data.name;
  if (nama) lines.push(`Nama: ${nama}`);
  const nibVal = data.nib || data.NIB;
  if (nibVal) lines.push(`NIB: ${nibVal}`);
  const npwp = data.npwp || data.NPWP;
  if (npwp) lines.push(`NPWP: ${npwp}`);
  const alamat = data.alamat || data.address;
  if (alamat) lines.push(`Alamat: ${typeof alamat === "string" ? alamat : JSON.stringify(alamat)}`);
  const status = data.status || data.statusBujk || data.statusSbu;
  if (status) lines.push(`Status: ${status}`);
  const kbli = data.kbli || data.bidang_usaha;
  if (kbli) lines.push(`KBLI/Bidang: ${typeof kbli === "string" ? kbli : JSON.stringify(kbli)}`);
  // SBU list
  const sbuList = data.sbu || data.sertifikat_badan_usaha || data.daftarSbu;
  if (Array.isArray(sbuList) && sbuList.length > 0) {
    lines.push(`SBU (${sbuList.length} sertifikat):`);
    sbuList.slice(0, 5).forEach((s: any) => {
      const no = s.nomor || s.nomorSbu || s.no;
      const kat = s.kategori || s.subklasifikasi || s.kualifikasi || s.bidang;
      const exp = s.berlakuHingga || s.tanggalBerakhir || s.masaBerlaku;
      const sts = s.status || s.statusSbu;
      lines.push(`  - ${no || ""}${kat ? ` | ${kat}` : ""}${exp ? ` | s/d ${exp}` : ""}${sts ? ` | ${sts}` : ""}`);
    });
  }
  if (lines.length < 2) return null;
  return lines.join("\n");
}

// ── Helper: extract BUJK info from HTML page text ─────────────────────────
function extractBujkFromHtml(text: string, nib: string): string | null {
  // Look for context window around the NIB
  const idx = text.indexOf(nib);
  if (idx === -1) return null;
  const snippet = text.slice(Math.max(0, idx - 300), idx + 600);
  // Extract meaningful lines (non-trivial, length > 5)
  const lines = snippet.split(/[\n|,;]/)
    .map(l => l.trim())
    .filter(l => l.length > 5 && l.length < 200 && !/^[\d\s\-\/]+$/.test(l))
    .slice(0, 12);
  if (lines.length < 2) return null;
  return lines.join("\n");
}

// ── Public NIB Lookup — tries 4 strategies ─────────────────────────────────
export async function lookupNibPublic(nib: string): Promise<string> {
  const cached = getCachedNib(nib);
  if (cached) return cached;

  const TIMEOUT = 7000;
  const headers = {
    "Accept": "application/json, text/html, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  };

  async function tryFetch(url: string, expectJson = true): Promise<any> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const resp = await fetch(url, { signal: ctrl.signal, headers });
      clearTimeout(t);
      if (!resp.ok) return null;
      return expectJson ? await resp.json().catch(() => null) : await resp.text().catch(() => null);
    } catch { clearTimeout(t); return null; }
  }

  // Strategy 1: OSS API
  const ossData = await tryFetch(`https://oss.go.id/api/nib/${nib}`);
  if (ossData) {
    const parsed = parseNibJson(ossData, nib);
    if (parsed) {
      const result = `🌐 DATA PUBLIK OSS-RBA (NIB: ${nib}):\n${parsed}\nSumber: oss.go.id`;
      setCachedNib(nib, result);
      return result;
    }
  }

  // Strategy 2: SIKI LPJK JSON API
  const lpjkData = await tryFetch(`https://siki.lpjk.pu.go.id/api/bujk?nib=${nib}`);
  if (lpjkData) {
    const arr = Array.isArray(lpjkData) ? lpjkData : (lpjkData?.data ?? [lpjkData]);
    const parsed = parseNibJson(arr[0] ?? lpjkData, nib);
    if (parsed) {
      const result = `🌐 DATA PUBLIK SIKI LPJK (NIB: ${nib}):\n${parsed}\nSumber: siki.lpjk.pu.go.id`;
      setCachedNib(nib, result);
      return result;
    }
  }

  // Strategy 3: OSS portal verifikasi API
  const ossPortal = await tryFetch(`https://oss.go.id/portal/api/v1/nib/verifikasi?nib=${nib}`);
  if (ossPortal) {
    const parsed = parseNibJson(ossPortal?.data ?? ossPortal, nib);
    if (parsed) {
      const result = `🌐 DATA PUBLIK OSS Portal (NIB: ${nib}):\n${parsed}\nSumber: oss.go.id/portal`;
      setCachedNib(nib, result);
      return result;
    }
  }

  // Strategy 4: HTML scraping SIKI LPJK search page
  const htmlRaw = await tryFetch(`https://siki.lpjk.pu.go.id/bujk?search=${nib}`, false);
  if (htmlRaw && typeof htmlRaw === "string") {
    const text = stripHtml(htmlRaw);
    const snippet = extractBujkFromHtml(text, nib);
    if (snippet) {
      const result = `🌐 DATA PUBLIK SIKI LPJK — Web (NIB: ${nib}):\n${snippet}\nSumber: siki.lpjk.pu.go.id (halaman web)`;
      setCachedNib(nib, result);
      return result;
    }
  }

  // Strategy 5: OSS HTML fallback
  const ossHtml = await tryFetch(`https://oss.go.id/portal/api/nib/${nib}`, false);
  if (ossHtml && typeof ossHtml === "string") {
    const text = stripHtml(ossHtml);
    const snippet = extractBujkFromHtml(text, nib);
    if (snippet) {
      const result = `🌐 DATA PUBLIK OSS — Web (NIB: ${nib}):\n${snippet}\nSumber: oss.go.id`;
      setCachedNib(nib, result);
      return result;
    }
  }

  // All failed — return informational message so AI can guide user
  const fallback = `🔍 CEK MANUAL NIB ${nib}:\nSistem pemerintah tidak dapat diakses otomatis saat ini.\nSilakan verifikasi secara manual di:\n  • OSS-RBA: https://oss.go.id\n  • SIKI LPJK: https://siki.lpjk.pu.go.id\n[ASUMSI: data NIB ${nib} belum terverifikasi dari sumber publik | verifikasi-ke: OSS/LPJK]`;
  setCachedNib(nib, fallback);
  return fallback;
}

export async function buildDataMasterContext(userId: string, userMessage: string): Promise<string> {
  if (!userId) return "";
  try {
    const parts: string[] = [];

    // ── 1. BUJK Data internal ──────────────────────────────────────────────
    const hasBujkKeyword = BUJK_KEYWORDS.test(userMessage);
    const bujkRows = await db
      .select()
      .from(bujkData)
      .where(eq(bujkData.userId, userId))
      .orderBy(desc(bujkData.updatedAt))
      .limit(hasBujkKeyword ? 10 : 5);

    const internalNibs = new Set(bujkRows.map(r => r.nib).filter(Boolean));

    if (bujkRows.length > 0) {
      const bujkLines = bujkRows.map(r =>
        `• ${r.namaPerusahaan}${r.nib ? ` | NIB: ${r.nib}` : ""}${r.kualifikasi ? ` | Kualifikasi: ${r.kualifikasi}` : ""}${r.subklasifikasi ? ` | Subklas: ${r.subklasifikasi}` : ""}${r.nomorSbu ? ` | SBU: ${r.nomorSbu}` : ""} | Status SBU: ${r.statusSbu || "—"}${r.masaBerlakuSbu ? ` s/d ${r.masaBerlakuSbu}` : ""}${r.picNama ? ` | PIC: ${r.picNama}${r.picPhone ? ` (${r.picPhone})` : ""}` : ""}${r.catatan ? `\n  Catatan: ${r.catatan}` : ""}`
      ).join("\n");
      parts.push(`📋 DATA BUJK BINAAN (${bujkRows.length} perusahaan):\n${bujkLines}`);
    }

    // ── 2. NIB auto-detect → public lookup (skip if already in internal) ───
    const nibsInMessage = Array.from(userMessage.matchAll(NIB_PATTERN)).map(m => m[1]);
    const nibsToLookup = Array.from(new Set(nibsInMessage)).filter(n => !internalNibs.has(n));

    if (nibsToLookup.length > 0) {
      // Lookup up to 2 NIBs in parallel (avoid too many concurrent requests)
      const lookupResults = await Promise.allSettled(
        nibsToLookup.slice(0, 2).map(nib => lookupNibPublic(nib))
      );
      for (const r of lookupResults) {
        if (r.status === "fulfilled" && r.value) parts.push(r.value);
      }
    }

    // ── 3. Harga Material (only if message has cost/price keywords) ─────────
    if (COST_KEYWORDS.test(userMessage)) {
      const priceRows = await db
        .select()
        .from(materialPrices)
        .where(eq(materialPrices.userId, userId))
        .orderBy(desc(materialPrices.updatedAt))
        .limit(20);

      if (priceRows.length > 0) {
        const grouped: Record<string, typeof priceRows> = {};
        for (const r of priceRows) {
          if (!grouped[r.kategori]) grouped[r.kategori] = [];
          grouped[r.kategori].push(r);
        }
        const priceLines = Object.entries(grouped).map(([kat, items]) => {
          const itemLines = items.map(r =>
            `  - ${r.namaItem}${r.satuan ? ` (${r.satuan})` : ""}: ${r.hargaAcuan ? `Rp ${r.hargaAcuan.toLocaleString("id-ID")}` : ""}${r.hargaMin && r.hargaMax ? ` [${r.hargaMin.toLocaleString("id-ID")}–${r.hargaMax.toLocaleString("id-ID")}]` : ""}${r.sumber ? ` | Sumber: ${r.sumber}` : ""}${r.wilayah ? ` | ${r.wilayah}` : ""}${r.tahunAnggaran ? ` | TA ${r.tahunAnggaran}` : ""}`
          ).join("\n");
          return `[${kat}]\n${itemLines}`;
        }).join("\n");
        parts.push(`💰 REFERENSI HARGA MATERIAL INTERNAL:\n${priceLines}`);
      }
    }

    if (parts.length === 0) return "";

    const hasPublicData = parts.some(p => p.startsWith("🌐") || p.startsWith("🔍"));
    const header = hasPublicData
      ? `DATA MASTER OPENCLAW — DATA NYATA + DATA PUBLIK\nPrioritaskan data internal di atas data publik. Data publik sebagai referensi tambahan.`
      : `DATA MASTER OPENCLAW — DATA NYATA PENGGUNA\nGunakan data ini sebagai referensi utama. Prioritaskan di atas estimasi umum.`;

    return `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${header}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${parts.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } catch (err) {
    console.warn("[DataMaster] buildDataMasterContext error:", err);
    return "";
  }
}

export function registerDataMasterRoutes(app: Express) {

  // ─────────────────────────────────────────────────────────────
  // BUJK DATA — CRUD
  // ─────────────────────────────────────────────────────────────

  app.get("/api/data-master/bujk", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const search = req.query.search as string | undefined;
      let rows;
      if (search) {
        rows = await db.select().from(bujkData)
          .where(and(
            eq(bujkData.userId, userId),
            or(
              ilike(bujkData.namaPerusahaan, `%${search}%`),
              ilike(bujkData.nib, `%${search}%`),
              ilike(bujkData.picNama, `%${search}%`)
            )
          ))
          .orderBy(desc(bujkData.createdAt));
      } else {
        rows = await db.select().from(bujkData)
          .where(eq(bujkData.userId, userId))
          .orderBy(desc(bujkData.createdAt));
      }
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/data-master/bujk", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = insertBujkDataSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [row] = await db.insert(bujkData).values(parsed.data).returning();
      res.json(row);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/data-master/bujk/:id", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      const [row] = await db.update(bujkData)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(bujkData.id, id), eq(bujkData.userId, userId)))
        .returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/data-master/bujk/:id", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      await db.delete(bujkData)
        .where(and(eq(bujkData.id, id), eq(bujkData.userId, userId)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // MATERIAL PRICES — CRUD
  // ─────────────────────────────────────────────────────────────

  app.get("/api/data-master/harga", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const search = req.query.search as string | undefined;
      const kategori = req.query.kategori as string | undefined;
      let query = db.select().from(materialPrices)
        .where(eq(materialPrices.userId, userId))
        .$dynamic();

      if (search) {
        query = db.select().from(materialPrices)
          .where(and(
            eq(materialPrices.userId, userId),
            or(
              ilike(materialPrices.namaItem, `%${search}%`),
              ilike(materialPrices.kategori, `%${search}%`)
            )
          ))
          .$dynamic();
      } else if (kategori) {
        query = db.select().from(materialPrices)
          .where(and(eq(materialPrices.userId, userId), eq(materialPrices.kategori, kategori)))
          .$dynamic();
      }

      const rows = await query.orderBy(desc(materialPrices.createdAt));
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/data-master/harga", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = insertMaterialPriceSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [row] = await db.insert(materialPrices).values(parsed.data).returning();
      res.json(row);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/data-master/harga/:id", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      const [row] = await db.update(materialPrices)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(materialPrices.id, id), eq(materialPrices.userId, userId)))
        .returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/data-master/harga/:id", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      await db.delete(materialPrices)
        .where(and(eq(materialPrices.id, id), eq(materialPrices.userId, userId)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // STATS — counts for summary cards
  // ─────────────────────────────────────────────────────────────

  app.get("/api/data-master/stats", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const [bujkRows, matRows] = await Promise.all([
        db.select().from(bujkData).where(eq(bujkData.userId, userId)),
        db.select().from(materialPrices).where(eq(materialPrices.userId, userId)),
      ]);
      res.json({ bujkCount: bujkRows.length, materialCount: matRows.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // CEK OSS-RBA — real-time NIB/SBU lookup
  // ─────────────────────────────────────────────────────────────

  app.get("/api/data-master/cek-oss", isAuthenticated, async (req: any, res: any) => {
    const nib = (req.query.nib as string || "").trim();
    if (!nib || nib.length < 5) {
      return res.status(400).json({ error: "NIB tidak valid. Masukkan minimal 5 karakter." });
    }
    try {
      const text = await lookupNibPublic(nib);
      const found = !text.includes("CEK MANUAL NIB") && !text.includes("tidak dapat diakses");
      res.json({ nib, text, found });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
