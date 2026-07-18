/**
 * Ruang Kelola — API Routes (Security-Hardened)
 * Modul pengelolaan legalitas, SBU, SKK, perizinan, dan tender untuk BUJK.
 *
 * SECURITY LAYERS:
 *  L1 — Zod input validation + allowlists (setiap endpoint)
 *  L2 — UUID format guard on :id params (prevent error info leak)
 *  L3 — Explicit userId null guard (prevent anonymous DB access)
 *  L4 — File magic-byte validation (prevent MIME spoofing on OCR upload)
 *  L5 — Per-user rate limiting (OCR: 10/hr, writes: 60/hr, biro: 5/hr)
 *  L6 — Ownership enforcement on every row-level op (SELECT before mutate)
 *  L7 — Sanitized error responses (no raw DB internals in prod)
 *  L8 — Audit log for all create/update/delete on legal documents
 *  L9 — WA message sanitisation (strip control chars, cap length)
 *  L10 — Strip user_id from all API responses
 */
import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// ── Constants & allowlists ─────────────────────────────────────────────────

const VALID_CATEGORIES = ["legalitas", "sbu", "skk", "perizinan", "tender"] as const;
const VALID_STATUSES   = ["active", "expiring_soon", "expired", "in_progress", "won", "lost", "cancelled"] as const;
const VALID_BUJK_CLASS = ["K1","K2","K3","M1","M2","M3","B1","B2","Tidak ada"];
const VALID_PROVINCES  = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Bengkulu","Lampung",
  "DKI Jakarta","Jawa Barat","Banten","Jawa Tengah","DI Yogyakarta","Jawa Timur",
  "Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
  "Sulawesi Utara","Sulawesi Tengah","Sulawesi Selatan","Sulawesi Tenggara","Gorontalo","Sulawesi Barat",
  "Maluku","Maluku Utara","Papua","Papua Barat","Papua Tengah","Papua Pegunungan","Papua Selatan",
];
const VALID_BIRO_SERVICES = [
  "Pengurusan SBU (Sertifikat Badan Usaha)",
  "Pengurusan SKK / Sertifikasi Kompetensi",
  "Pengurusan NIB / BUJK",
  "Pengurusan Perizinan Lingkungan",
  "Perpanjangan SBU / SKK yang Kedaluwarsa",
  "Pengurusan ISO 9001 / 14001 / 45001",
  "Pengurusan IMB / PBG",
  "Konsultasi & Bimbingan Tender",
  "Lainnya",
];

// ── L1: Zod Schemas ────────────────────────────────────────────────────────

const profileSchema = z.object({
  company_name: z.string().min(1).max(200).trim(),
  nib:          z.string().max(20).trim().optional().nullable(),
  npwp:         z.string().max(25).trim().optional().nullable(),
  bujk_class:   z.enum(VALID_BUJK_CLASS as [string, ...string[]]).optional().nullable(),
  province:     z.enum(VALID_PROVINCES as [string, ...string[]]).optional().nullable(),
  phone:        z.string().max(20).regex(/^[0-9+\s-]*$/, "Nomor telepon tidak valid").optional().nullable(),
  email:        z.string().email().max(100).optional().nullable(),
  address:      z.string().max(500).trim().optional().nullable(),
});

const documentSchema = z.object({
  category:     z.enum(VALID_CATEGORIES),
  doc_type:     z.string().min(1).max(150).trim(),
  doc_name:     z.string().min(1).max(300).trim(),
  doc_number:   z.string().max(100).trim().optional().nullable(),
  issued_by:    z.string().max(200).trim().optional().nullable(),
  issued_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expired_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status:       z.enum(VALID_STATUSES).optional(),
  notes:        z.string().max(2000).trim().optional().nullable(),
});

const biroRequestSchema = z.object({
  doc_id:       z.string().uuid().optional().nullable(),
  service_type: z.enum(VALID_BIRO_SERVICES as [string, ...string[]]),
  notes:        z.string().max(1000).trim().optional().nullable(),
});

// ── L2: UUID Guard ─────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidUUID(id: string, res: Response): boolean {
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "ID tidak valid" });
    return false;
  }
  return true;
}

// ── L3: userId extractor with null guard ───────────────────────────────────

function extractUserId(req: any, res: Response): string | null {
  const uid = req.user?.id || req.user?.claims?.sub || null;
  if (!uid) {
    res.status(401).json({ error: "Sesi tidak valid. Silakan masuk kembali." });
    return null;
  }
  return uid;
}

// ── L4: File magic-byte validation ────────────────────────────────────────

// Supported signatures: JPEG, PNG, PDF, WEBP (RIFF header)
const MAGIC_BYTES: { mime: string; sig: number[]; offset?: number }[] = [
  { mime: "image/jpeg",       sig: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",        sig: [0x89, 0x50, 0x4E, 0x47] },
  { mime: "application/pdf",  sig: [0x25, 0x50, 0x44, 0x46] },  // %PDF
  { mime: "image/webp",       sig: [0x52, 0x49, 0x46, 0x46] },  // RIFF (check bytes 8-11 for WEBP separately)
  { mime: "image/gif",        sig: [0x47, 0x49, 0x46, 0x38] },  // GIF8
];

function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  for (const entry of MAGIC_BYTES) {
    if (entry.mime !== declaredMime) continue;
    const offset = entry.offset || 0;
    const match = entry.sig.every((byte, i) => buffer[offset + i] === byte);
    if (!match) return false;
    // Extra check for WEBP: bytes 8-11 must be 'W','E','B','P'
    if (declaredMime === "image/webp") {
      return buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    }
    return true;
  }
  return false; // Unknown type
}

// ── L5: Rate limiters (per-user key) ──────────────────────────────────────

function userKey(req: Request): string {
  const r = req as any;
  const uid = r.user?.id || r.user?.claims?.sub;
  return uid ? `rk-user:${uid}` : `rk-ip:${ipKeyGenerator(req.ip ?? "")}`;
}

const rkWriteLimit = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 jam
  limit: 60,
  keyGenerator: userKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan. Coba lagi dalam 1 jam." },
  skip: (req) => { const r = req as any; return r.user?.role === "superadmin"; },
});

const rkOcrLimit = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 jam
  limit: 10,                   // OCR mahal — batasi ketat
  keyGenerator: userKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Batas scan OCR (10/jam) tercapai. Coba lagi nanti." },
  skip: (req) => { const r = req as any; return r.user?.role === "superadmin"; },
});

const rkBiroLimit = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 jam
  limit: 5,                    // Biro Jasa request — batasi spam
  keyGenerator: userKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Batas permintaan Biro Jasa (5/jam) tercapai." },
  skip: (req) => { const r = req as any; return r.user?.role === "superadmin"; },
});

// ── L7: Safe error responder ───────────────────────────────────────────────

function safeError(res: Response, e: unknown, context: string): void {
  const msg = e instanceof Error ? e.message : String(e);
  // Log full detail server-side
  console.error(`[RuangKelola] ${context}:`, msg);
  // Never expose raw DB error details to the client
  if (process.env.NODE_ENV === "development") {
    res.status(500).json({ error: "Terjadi kesalahan server.", detail: msg });
  } else {
    res.status(500).json({ error: "Terjadi kesalahan server. Hubungi admin jika terus berlanjut." });
  }
}

// ── L8: Audit logger ──────────────────────────────────────────────────────

async function auditLog(
  userId: string,
  action: "create" | "update" | "delete",
  docId: string | null,
  detail: Record<string, unknown>,
  req: Request
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ruang_kelola_audit_log
         (user_id, action, doc_id, detail, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        action,
        docId,
        JSON.stringify(detail),
        req.ip ?? null,
        (req.headers["user-agent"] ?? "").slice(0, 300),
      ]
    );
  } catch {
    // Audit log failure must NEVER block the main operation
  }
}

// ── L10: Strip user_id from row before sending ─────────────────────────────

function safeRow(row: Record<string, any>): Record<string, any> {
  if (!row) return row;
  const { user_id, ...rest } = row;
  return rest;
}

// ── L9: WA message sanitizer ──────────────────────────────────────────────

function sanitizeWA(text: string, maxLen = 300): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, " ")  // strip control chars
    .replace(/[`*_~[\]()]/g, "")        // strip WA markdown injection chars
    .trim()
    .slice(0, maxLen);
}

// ── multer (OCR upload — memory only, never persisted) ────────────────────

const ocrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }, // 8 MB, 1 file max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF."));
    }
  },
});

// ── Boot-time DDL (called once at registration) ────────────────────────────

async function ensureRuangKelolaTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ruang_kelola_audit_log (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     text NOT NULL,
      action      text NOT NULL CHECK (action IN ('create','update','delete')),
      doc_id      uuid,
      detail      jsonb,
      ip_address  text,
      user_agent  text,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ruang_kelola_biro_requests (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      text NOT NULL,
      doc_id       uuid REFERENCES ruang_kelola_documents(id) ON DELETE SET NULL,
      service_type text NOT NULL,
      notes        text,
      status       text NOT NULL DEFAULT 'pending',
      created_at   timestamptz NOT NULL DEFAULT now()
    )
  `);
  // Indexes for audit log (filter by user, time)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rk_audit_user_time ON ruang_kelola_audit_log (user_id, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rk_biro_user ON ruang_kelola_biro_requests (user_id, created_at DESC)`);
}

// ── Main registration ──────────────────────────────────────────────────────

export async function registerRuangKelolaRoutes(app: Express): Promise<void> {
  // Create supporting tables at startup (idempotent)
  await ensureRuangKelolaTables().catch(e =>
    console.error("[RuangKelola] DDL init error:", e.message)
  );

  // ── GET /api/ruang-kelola/profile ────────────────────────────────────────
  app.get("/api/ruang-kelola/profile", isAuthenticated, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;
    try {
      const { rows } = await pool.query(
        `SELECT id, company_name, nib, npwp, bujk_class, province, phone, email, address, updated_at
         FROM ruang_kelola_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      res.json(rows[0] || null);
    } catch (e) { safeError(res, e, "GET profile"); }
  });

  // ── POST /api/ruang-kelola/profile ─────────────────────────────────── L1,L3,L5
  app.post("/api/ruang-kelola/profile", isAuthenticated, rkWriteLimit, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;

    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors });
    }
    const d = parsed.data;
    try {
      const { rows } = await pool.query(
        `INSERT INTO ruang_kelola_profiles
           (user_id, company_name, nib, npwp, bujk_class, province, phone, email, address, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
         ON CONFLICT (user_id) DO UPDATE SET
           company_name = EXCLUDED.company_name,
           nib          = EXCLUDED.nib,
           npwp         = EXCLUDED.npwp,
           bujk_class   = EXCLUDED.bujk_class,
           province     = EXCLUDED.province,
           phone        = EXCLUDED.phone,
           email        = EXCLUDED.email,
           address      = EXCLUDED.address,
           updated_at   = now()
         RETURNING id, company_name, nib, npwp, bujk_class, province, phone, email, address, updated_at`,
        [userId, d.company_name, d.nib ?? null, d.npwp ?? null, d.bujk_class ?? null,
         d.province ?? null, d.phone ?? null, d.email ?? null, d.address ?? null]
      );
      res.json(rows[0]);
    } catch (e) { safeError(res, e, "POST profile"); }
  });

  // ── GET /api/ruang-kelola/summary ──────────────────────────────────── L3
  app.get("/api/ruang-kelola/summary", isAuthenticated, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;
    try {
      const { rows } = await pool.query(
        `SELECT category,
           COUNT(*) FILTER (WHERE expired_date IS NULL OR expired_date > now() + interval '30 days') AS aktif,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date > now() AND expired_date <= now() + interval '30 days') AS expiring_soon,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date <= now()) AS expired,
           COUNT(*) AS total
         FROM ruang_kelola_documents WHERE user_id = $1 GROUP BY category`,
        [userId]
      );
      const { rows: totals } = await pool.query(
        `SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date <= now()) AS total_expired,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date > now() AND expired_date <= now() + interval '30 days') AS total_expiring_soon
         FROM ruang_kelola_documents WHERE user_id = $1`,
        [userId]
      );
      res.json({ byCategory: rows, totals: totals[0] });
    } catch (e) { safeError(res, e, "GET summary"); }
  });

  // ── GET /api/ruang-kelola/documents ──────────────────────────────── L1,L3
  app.get("/api/ruang-kelola/documents", isAuthenticated, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;

    // L1: Validate category param against allowlist
    const rawCat = req.query.category as string | undefined;
    const category = rawCat && rawCat !== "semua" ? rawCat : null;
    if (category && !VALID_CATEGORIES.includes(category as any)) {
      return res.status(400).json({ error: "Kategori tidak valid" });
    }

    try {
      let query = `SELECT id, category, doc_type, doc_name, doc_number, issued_by,
                          issued_date, expired_date, status, notes, created_at, updated_at
                   FROM ruang_kelola_documents WHERE user_id = $1`;
      const params: any[] = [userId];
      if (category) { query += ` AND category = $2`; params.push(category); }
      query += ` ORDER BY
        CASE WHEN expired_date IS NOT NULL AND expired_date <= now() THEN 0
             WHEN expired_date IS NOT NULL AND expired_date <= now() + interval '30 days' THEN 1
             ELSE 2
        END, expired_date ASC NULLS LAST, created_at DESC`;
      const { rows } = await pool.query(query, params);
      res.json(rows);  // user_id never selected → L10 implicit
    } catch (e) { safeError(res, e, "GET documents"); }
  });

  // ── POST /api/ruang-kelola/documents ────────────────────────────── L1,L3,L5,L8
  app.post("/api/ruang-kelola/documents", isAuthenticated, rkWriteLimit, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;

    const parsed = documentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors });
    }
    const d = parsed.data;
    const computedStatus = computeDocStatus(d.expired_date, d.status);
    try {
      const { rows } = await pool.query(
        `INSERT INTO ruang_kelola_documents
           (user_id, category, doc_type, doc_name, doc_number, issued_by,
            issued_date, expired_date, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id, category, doc_type, doc_name, doc_number, issued_by,
                   issued_date, expired_date, status, notes, created_at, updated_at`,
        [userId, d.category, d.doc_type, d.doc_name, d.doc_number ?? null,
         d.issued_by ?? null, d.issued_date ?? null, d.expired_date ?? null,
         computedStatus, d.notes ?? null]
      );
      // L8: Audit log
      await auditLog(userId, "create", rows[0].id, { category: d.category, doc_name: d.doc_name }, req);
      res.json(rows[0]);
    } catch (e) { safeError(res, e, "POST documents"); }
  });

  // ── PATCH /api/ruang-kelola/documents/:id ──────────────── L1,L2,L3,L5,L6,L8
  app.patch("/api/ruang-kelola/documents/:id", isAuthenticated, rkWriteLimit, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;

    // L2: UUID guard
    if (!assertValidUUID(req.params.id, res)) return;
    const { id } = req.params;

    const parsed = documentSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors });
    }
    const d = parsed.data;

    try {
      // L6: Ownership check — one round-trip, atomic with update
      const { rows: own } = await pool.query(
        `SELECT id, doc_name, category FROM ruang_kelola_documents WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (!own.length) return res.status(403).json({ error: "Dokumen tidak ditemukan atau akses ditolak" });

      const computedStatus = computeDocStatus(d.expired_date, d.status);
      const { rows } = await pool.query(
        `UPDATE ruang_kelola_documents SET
           category          = COALESCE($3, category),
           doc_type          = COALESCE($4, doc_type),
           doc_name          = COALESCE($5, doc_name),
           doc_number        = $6,
           issued_by         = $7,
           issued_date       = $8,
           expired_date      = $9,
           status            = $10,
           notes             = $11,
           updated_at        = now(),
           reminder_sent_30d = false,
           reminder_sent_7d  = false
         WHERE id = $1 AND user_id = $2
         RETURNING id, category, doc_type, doc_name, doc_number, issued_by,
                   issued_date, expired_date, status, notes, created_at, updated_at`,
        [id, userId, d.category, d.doc_type, d.doc_name,
         d.doc_number ?? null, d.issued_by ?? null,
         d.issued_date ?? null, d.expired_date ?? null, computedStatus,
         d.notes ?? null]
      );
      // L8: Audit
      await auditLog(userId, "update", id, { doc_name: own[0].doc_name, changes: Object.keys(d) }, req);
      res.json(rows[0]);
    } catch (e) { safeError(res, e, "PATCH documents/:id"); }
  });

  // ── DELETE /api/ruang-kelola/documents/:id ─────────────── L2,L3,L5,L6,L8
  app.delete("/api/ruang-kelola/documents/:id", isAuthenticated, rkWriteLimit, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;
    if (!assertValidUUID(req.params.id, res)) return;
    const { id } = req.params;

    try {
      // L6: Capture name before delete for audit
      const { rows: pre } = await pool.query(
        `SELECT doc_name, category FROM ruang_kelola_documents WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (!pre.length) return res.status(403).json({ error: "Dokumen tidak ditemukan atau akses ditolak" });

      await pool.query(`DELETE FROM ruang_kelola_documents WHERE id = $1 AND user_id = $2`, [id, userId]);

      // L8: Audit (log before data is gone)
      await auditLog(userId, "delete", id, { doc_name: pre[0].doc_name, category: pre[0].category }, req);
      res.json({ ok: true });
    } catch (e) { safeError(res, e, "DELETE documents/:id"); }
  });

  // ── POST /api/ruang-kelola/ocr ─────────────────────── L1,L3,L4,L5,L7
  app.post(
    "/api/ruang-kelola/ocr",
    isAuthenticated,
    rkOcrLimit,
    ocrUpload.single("file"),
    async (req: any, res) => {
      const userId = extractUserId(req, res);
      if (!userId) return;
      if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diunggah" });

      // L4: Magic-byte validation (cannot trust Content-Type header alone)
      if (req.file.buffer.length < 8) {
        return res.status(422).json({ error: "File terlalu kecil atau rusak" });
      }
      if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
        // Log potential bypass attempt
        console.warn(`[RuangKelola] Magic-byte mismatch from user ${userId}: declared=${req.file.mimetype}`);
        return res.status(422).json({ error: "Tipe file tidak sesuai isi. Upload ulang dengan file asli." });
      }

      const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
      if (!geminiKey) return res.status(503).json({ error: "Layanan OCR belum terkonfigurasi" });

      try {
        const genai = new GoogleGenAI({ apiKey: geminiKey, httpOptions: { apiVersion: "v1" } });
        const base64  = req.file.buffer.toString("base64");
        const mime    = req.file.mimetype;

        const prompt = `Kamu adalah sistem OCR dokumen resmi Indonesia, khusus bidang konstruksi, sertifikasi, dan perizinan.
Analisa gambar/dokumen berikut lalu ekstrak informasi dalam format JSON berikut.
Isi HANYA berdasarkan yang tertera di dokumen. Jika tidak terlihat, isi null.
Kembalikan HANYA JSON valid (tanpa markdown/backtick/penjelasan apapun):

{
  "doc_name": "nama lengkap dokumen atau nama pemegang sertifikat",
  "doc_number": "nomor dokumen/sertifikat/NIB/NPP",
  "doc_type": "satu dari: NIB (Nomor Induk Berusaha) | SBU (Sertifikat Badan Usaha) | SKK Ahli Muda | SKK Ahli Madya | SKK Ahli Utama | SKTK | Akte Pendirian Perusahaan | SK Kemenkumham | NPWP Perusahaan | BUJK | PKP | IMB / PBG | ISO 9001 | ISO 14001 | ISO 45001 | CSMS | Lainnya",
  "issued_by": "nama lembaga/badan yang menerbitkan",
  "issued_date": "YYYY-MM-DD atau null",
  "expired_date": "YYYY-MM-DD atau null",
  "detected_category": "satu dari: legalitas | sbu | skk | perizinan | tender",
  "subklasifikasi": "subklasifikasi atau null",
  "confidence": "high | medium | low",
  "notes": "info penting lain atau null"
}`;

        const result = await genai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{
            role: "user",
            parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: base64 } }],
          }],
        });

        const raw     = (result.text ?? "").trim();
        const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        let parsed: Record<string, any>;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // Don't return raw LLM output — could contain injected content
          return res.status(422).json({ error: "Gagal membaca hasil OCR. Coba foto lebih jelas atau dengan resolusi lebih tinggi." });
        }

        // L10: Sanitize OCR output before reflecting to client
        const safe: Record<string, any> = {};
        const textFields = ["doc_name","doc_number","doc_type","issued_by","issued_date","expired_date","detected_category","subklasifikasi","confidence","notes"];
        for (const k of textFields) {
          const v = parsed[k];
          safe[k] = typeof v === "string" ? v.slice(0, 500) : (v ?? null);
        }

        res.json({ ok: true, data: safe });
      } catch (e) { safeError(res, e, "POST ocr"); }
    }
  );

  // ── POST /api/ruang-kelola/biro-request ──────────────── L1,L3,L5,L6,L9
  app.post("/api/ruang-kelola/biro-request", isAuthenticated, rkBiroLimit, async (req: any, res) => {
    const userId = extractUserId(req, res);
    if (!userId) return;

    // L1: Zod validation (service_type strictly allowlisted)
    const parsed = biroRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors });
    }
    const { doc_id, service_type, notes } = parsed.data;

    try {
      // L6: If doc_id provided, verify it belongs to this user
      let docName = service_type;
      let docType = "";
      if (doc_id) {
        const { rows: docRows } = await pool.query(
          `SELECT doc_name, doc_type FROM ruang_kelola_documents WHERE id = $1 AND user_id = $2`,
          [doc_id, userId]
        );
        if (!docRows.length) return res.status(403).json({ error: "Dokumen tidak ditemukan atau akses ditolak" });
        docName = docRows[0].doc_name;
        docType = docRows[0].doc_type;
      }

      const { rows } = await pool.query(
        `INSERT INTO ruang_kelola_biro_requests (user_id, doc_id, service_type, notes)
         VALUES ($1, $2, $3, $4) RETURNING id, service_type, status, created_at`,
        [userId, doc_id || null, service_type, notes || null]
      );

      // Notify admin via WA — L9: sanitize all user-supplied content
      const adminPhone = process.env.SUPERADMIN_PHONE || "6282299417818";
      const waToken    = process.env.FONNTE_API_KEY;
      if (waToken) {
        const { rows: profileRows } = await pool.query(
          `SELECT company_name, phone FROM ruang_kelola_profiles WHERE user_id = $1`, [userId]
        );
        const co  = sanitizeWA(profileRows[0]?.company_name || "Tidak diketahui");
        const hp  = sanitizeWA(profileRows[0]?.phone || "Tidak ada", 20);
        const svc = sanitizeWA(service_type);
        const dn  = sanitizeWA(docName);
        const nt  = notes ? sanitizeWA(notes, 300) : "";

        const msg = `📋 PERMINTAAN BIRO JASA — RUANG KELOLA\n\n`
          + `Perusahaan: ${co}\n`
          + `Kontak: ${hp}\n`
          + `Layanan: ${svc}\n`
          + (docType ? `Dokumen: ${dn} (${sanitizeWA(docType)})\n` : `Layanan: ${dn}\n`)
          + (nt ? `Catatan: ${nt}\n` : "")
          + `\nID Request: ${rows[0].id}`;

        fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: { Authorization: waToken },
          body: new URLSearchParams({ target: adminPhone, message: msg }),
        }).catch(() => {});
      }

      res.json({ ok: true, request: rows[0] });
    } catch (e) { safeError(res, e, "POST biro-request"); }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function computeDocStatus(expiredDate?: string | null, manualStatus?: string): string {
  if (manualStatus && ["in_progress","won","lost","cancelled"].includes(manualStatus)) return manualStatus;
  if (!expiredDate) return manualStatus || "active";
  const exp  = new Date(expiredDate);
  const now  = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (exp <= now)  return "expired";
  if (exp <= in30) return "expiring_soon";
  return "active";
}
