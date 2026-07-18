/**
 * Ruang Simpan — Company Document Vault API
 * Penyimpanan dokumen perusahaan + otomatis diproses jadi konteks AI.
 *
 * Phase 2: Replit Object Storage untuk file binary (menggantikan bytea di DB).
 *          DB hanya menyimpan metadata + extracted text chunks untuk RAG.
 *
 * SECURITY: Zod validation · UUID guard · userId null guard · ownership check
 *           · Rate limiting · Sanitized errors · Audit log · user_id stripped
 */
import type { Express, Request, Response } from "express";
import { pool } from "./db";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import { z } from "zod";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { uploadFile, downloadFile, deleteFile } from "./lib/object-storage";

// ── Constants ──────────────────────────────────────────────────────────────

const FREE_QUOTA_BYTES  = 15 * 1024 * 1024;  // 15 MB (free tier)
const MAX_FILE_BYTES    = 20 * 1024 * 1024;  // 20 MB per file
const CHUNK_SIZE        = 600;               // chars per KB chunk
const CHUNK_OVERLAP     = 80;

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain","text/markdown","text/csv",
  "image/jpeg","image/png","image/webp",
];

const DEFAULT_FOLDERS = [
  { name: "Legalitas",       color: "blue",   icon: "shield",     sort_order: 0 },
  { name: "Teknis",          color: "slate",  icon: "wrench",     sort_order: 1 },
  { name: "Penawaran & RAB", color: "orange", icon: "calculator", sort_order: 2 },
  { name: "SDM & Sertifikasi", color: "purple", icon: "award",   sort_order: 3 },
  { name: "Tender",          color: "red",    icon: "bar-chart",  sort_order: 4 },
  { name: "Proyek",          color: "teal",   icon: "folder-open",sort_order: 5 },
  { name: "Umum",            color: "gray",   icon: "folder",     sort_order: 6 },
];

// ── Zod schemas ─────────────────────────────────────────────────────────────

const folderSchema = z.object({
  name:  z.string().min(1).max(100).trim(),
  color: z.enum(["blue","slate","orange","purple","red","teal","gray","green","pink"]).optional(),
  icon:  z.string().max(30).optional(),
});

const fileMetaSchema = z.object({
  description: z.string().max(500).trim().optional().nullable(),
  tags:        z.array(z.string().max(50)).max(10).optional(),
  folder_id:   z.string().uuid().optional().nullable(),
  kelola_doc_id: z.string().uuid().optional().nullable(),
});

// ── Multer ──────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipe file tidak didukung: ${file.mimetype}`));
  },
});

// ── Rate limiters ────────────────────────────────────────────────────────────

function rsKey(req: Request): string {
  const r = req as any;
  const uid = r.user?.id || r.user?.claims?.sub;
  return uid ? `rs-user:${uid}` : `rs-ip:${ipKeyGenerator(req.ip ?? "")}`;
}
const rsWriteLimit  = rateLimit({ windowMs: 60*60*1000, limit: 100, keyGenerator: rsKey, standardHeaders: "draft-7", legacyHeaders: false });
const rsUploadLimit = rateLimit({ windowMs: 60*60*1000, limit: 20,  keyGenerator: rsKey, standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Batas upload (20 file/jam) tercapai." } });
const rsSearchLimit = rateLimit({ windowMs: 60*1000,   limit: 30,  keyGenerator: rsKey, standardHeaders: "draft-7", legacyHeaders: false });

// ── Helpers ──────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractUid(req: any, res: Response): string | null {
  const uid = req.user?.id || req.user?.claims?.sub || null;
  if (!uid) { res.status(401).json({ error: "Sesi tidak valid. Masuk kembali." }); return null; }
  return uid;
}
function guardUUID(id: string, res: Response): boolean {
  if (!UUID_RE.test(id)) { res.status(400).json({ error: "ID tidak valid" }); return false; }
  return true;
}
function safeErr(res: Response, e: unknown, ctx: string): void {
  console.error(`[RuangSimpan] ${ctx}:`, e instanceof Error ? e.message : e);
  if (process.env.NODE_ENV === "development") {
    res.status(500).json({ error: "Server error", detail: String(e) });
  } else {
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
}

/** Ekstrak teks plain dari buffer. Hanya untuk text/* dan PDF sederhana. */
async function extractText(buffer: Buffer, mime: string, filename: string): Promise<string | null> {
  // Plain text / markdown / CSV — langsung decode
  if (mime.startsWith("text/")) {
    return buffer.toString("utf-8").slice(0, 200_000);
  }
  // PDF — coba gunakan extractDocumentContent jika tersedia
  if (mime === "application/pdf") {
    try {
      const path = await import("path");
      const fs   = await import("fs/promises");
      const os   = await import("os");
      // Tulis ke temp file, proses, hapus
      const tmp = path.join(os.tmpdir(), `rs-${Date.now()}-${filename}`);
      await fs.writeFile(tmp, buffer);
      try {
        const { extractDocumentContent } = await import("./lib/file-processing");
        const result = await extractDocumentContent(tmp);
        return result.content?.slice(0, 200_000) ?? null;
      } finally {
        await fs.unlink(tmp).catch(() => {});
      }
    } catch { return null; }
  }
  // Gambar teknis — analisis via GPT-4o Vision
  if (mime.startsWith("image/")) {
    try {
      const { default: OpenAI } = await import("openai");
      const oai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      const { TECHNICAL_VISION_SYSTEM_PROMPT } = await import("./lib/technical-vision-prompt");
      const base64 = buffer.toString("base64");
      const resp = await oai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `${TECHNICAL_VISION_SYSTEM_PROMPT}\n\nFile: ${filename}\n\nAnalisis gambar ini secara komprehensif dan ekstrak semua informasi yang terlihat: jenis gambar, judul/title block, skala, dimensi, label ruang/komponen, notasi struktural, spesifikasi material, catatan teknis (general notes), dan nama proyek/perusahaan. Format hasilnya sebagai teks terstruktur lengkap yang bisa digunakan sebagai memori bisnis dan referensi dialog AI.`,
            },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}`, detail: "high" } },
          ],
        }],
        max_tokens: 2500,
        temperature: 0.2,
      });
      const content = resp.choices[0]?.message?.content ?? null;
      return content ? content.slice(0, 200_000) : null;
    } catch (e) {
      console.error("[Ruang Simpan] Vision analysis failed:", (e as any)?.message);
      return null;
    }
  }
  return null; // office formats (docx, xlsx, dll) belum didukung di Phase 1
}

/** Potong teks jadi chunks untuk pencarian. */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    chunks.push(text.slice(pos, pos + CHUNK_SIZE));
    pos += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/** Seed folder default untuk user baru (idempotent). */
async function seedDefaultFolders(userId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS cnt FROM ruang_simpan_folders WHERE user_id = $1 AND is_default = true`,
    [userId]
  );
  if (parseInt(rows[0].cnt) > 0) return;
  for (const f of DEFAULT_FOLDERS) {
    await pool.query(
      `INSERT INTO ruang_simpan_folders (user_id, name, color, icon, is_default, sort_order)
       VALUES ($1,$2,$3,$4,true,$5) ON CONFLICT DO NOTHING`,
      [userId, f.name, f.color, f.icon, f.sort_order]
    );
  }
}

/** Cek sisa kuota storage user (bytes). */
async function getUsedBytes(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(size_bytes),0)::bigint AS used FROM ruang_simpan_files WHERE user_id = $1`,
    [userId]
  );
  return parseInt(rows[0].used);
}

// ── Route registration ───────────────────────────────────────────────────────

export function registerRuangSimpanRoutes(app: Express): void {

  // ── GET /api/ruang-simpan/overview ────────────────────────────────────────
  app.get("/api/ruang-simpan/overview", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    try {
      await seedDefaultFolders(userId);
      const [foldersRes, usageRes, recentRes, statsRes] = await Promise.all([
        pool.query(
          `SELECT f.id, f.name, f.color, f.icon, f.is_default, f.sort_order,
                  COUNT(fi.id)::int AS file_count,
                  COALESCE(SUM(fi.size_bytes),0)::bigint AS folder_bytes
           FROM ruang_simpan_folders f
           LEFT JOIN ruang_simpan_files fi ON fi.folder_id = f.id AND fi.user_id = f.user_id
           WHERE f.user_id = $1
           GROUP BY f.id ORDER BY f.sort_order, f.name`,
          [userId]
        ),
        pool.query(
          `SELECT COALESCE(SUM(size_bytes),0)::bigint AS used,
                  COUNT(*)::int AS total_files,
                  COUNT(*) FILTER (WHERE kb_status='ready')::int AS ai_ready
           FROM ruang_simpan_files WHERE user_id = $1`,
          [userId]
        ),
        pool.query(
          `SELECT id, original_name, mime_type, size_bytes, kb_status, folder_id, created_at
           FROM ruang_simpan_files WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 6`,
          [userId]
        ),
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE kb_status='pending')::int AS pending,
                  COUNT(*) FILTER (WHERE kb_status='failed')::int AS failed
           FROM ruang_simpan_files WHERE user_id = $1`,
          [userId]
        ),
      ]);
      res.json({
        folders:     foldersRes.rows,
        usage:       { used: parseInt(usageRes.rows[0].used), quota: FREE_QUOTA_BYTES,
                       total_files: usageRes.rows[0].total_files, ai_ready: usageRes.rows[0].ai_ready },
        recent_files: recentRes.rows,
        stats:       statsRes.rows[0],
      });
    } catch (e) { safeErr(res, e, "GET overview"); }
  });

  // ── GET /api/ruang-simpan/files ──────────────────────────────────────────
  app.get("/api/ruang-simpan/files", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    const folderId = req.query.folder_id as string | undefined;
    if (folderId && folderId !== "all" && !UUID_RE.test(folderId)) {
      return res.status(400).json({ error: "folder_id tidak valid" });
    }
    try {
      let q = `SELECT f.id, f.original_name, f.mime_type, f.size_bytes, f.description,
                      f.tags, f.kb_status, f.kb_chunk_count, f.folder_id, f.kelola_doc_id,
                      f.created_at, f.updated_at,
                      fo.name AS folder_name, fo.color AS folder_color
               FROM ruang_simpan_files f
               LEFT JOIN ruang_simpan_folders fo ON fo.id = f.folder_id
               WHERE f.user_id = $1`;
      const params: any[] = [userId];
      if (folderId && folderId !== "all") { q += ` AND f.folder_id = $2`; params.push(folderId); }
      q += ` ORDER BY f.created_at DESC`;
      const { rows } = await pool.query(q, params);
      res.json(rows);
    } catch (e) { safeErr(res, e, "GET files"); }
  });

  // ── POST /api/ruang-simpan/upload ─────────────────────────────────────────
  app.post("/api/ruang-simpan/upload", isAuthenticated, rsUploadLimit, upload.single("file"), async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diunggah" });

    const { folder_id, description } = req.body;
    if (folder_id && !UUID_RE.test(folder_id)) return res.status(400).json({ error: "folder_id tidak valid" });

    // Quota check
    const used = await getUsedBytes(userId);
    if (used + req.file.size > FREE_QUOTA_BYTES) {
      const remaining = Math.max(0, FREE_QUOTA_BYTES - used);
      return res.status(402).json({
        error: `Kuota storage hampir penuh. Tersisa ${(remaining / 1024 / 1024).toFixed(1)} MB dari 50 MB gratis.`,
        quota_exceeded: true,
        used_bytes: used,
        quota_bytes: FREE_QUOTA_BYTES,
      });
    }

    // Validate folder ownership (if provided)
    if (folder_id) {
      const { rows } = await pool.query(
        `SELECT id FROM ruang_simpan_folders WHERE id = $1 AND user_id = $2`, [folder_id, userId]
      );
      if (!rows.length) return res.status(403).json({ error: "Folder tidak ditemukan" });
    }

    try {
      // 1. Insert file metadata
      const { rows: [file] } = await pool.query(
        `INSERT INTO ruang_simpan_files
           (user_id, folder_id, original_name, mime_type, size_bytes, description, kb_status)
         VALUES ($1,$2,$3,$4,$5,$6,'pending')
         RETURNING id, original_name, mime_type, size_bytes, kb_status, folder_id, created_at`,
        [userId, folder_id || null, req.file.originalname, req.file.mimetype,
         req.file.size, description?.slice(0, 500) || null]
      );

      // 2. Store binary content di Object Storage
      const storageKey = await uploadFile(userId, file.id, req.file.originalname, req.file.buffer, req.file.mimetype);
      await pool.query(
        `UPDATE ruang_simpan_files SET storage_key = $1 WHERE id = $2`,
        [storageKey, file.id]
      );

      // 3. Extract text + chunk (async — don't block response)
      processFileAsync(file.id, userId, req.file.buffer, req.file.mimetype, req.file.originalname).catch(console.error);

      res.status(201).json(file);
    } catch (e) { safeErr(res, e, "POST upload"); }
  });

  // ── PATCH /api/ruang-simpan/files/:id ────────────────────────────────────
  app.patch("/api/ruang-simpan/files/:id", isAuthenticated, rsWriteLimit, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!guardUUID(req.params.id, res)) return;

    const parsed = fileMetaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors });

    const { description, tags, folder_id, kelola_doc_id } = parsed.data;
    try {
      // Ownership + optional folder ownership
      const { rows: own } = await pool.query(
        `SELECT id FROM ruang_simpan_files WHERE id = $1 AND user_id = $2`, [req.params.id, userId]
      );
      if (!own.length) return res.status(403).json({ error: "File tidak ditemukan atau akses ditolak" });
      if (folder_id) {
        const { rows } = await pool.query(
          `SELECT id FROM ruang_simpan_folders WHERE id = $1 AND user_id = $2`, [folder_id, userId]
        );
        if (!rows.length) return res.status(403).json({ error: "Folder tidak ditemukan" });
      }

      const { rows } = await pool.query(
        `UPDATE ruang_simpan_files SET
           description    = COALESCE($3, description),
           tags           = COALESCE($4, tags),
           folder_id      = $5,
           kelola_doc_id  = $6,
           updated_at     = now()
         WHERE id = $1 AND user_id = $2
         RETURNING id, original_name, mime_type, size_bytes, description, tags,
                   kb_status, kb_chunk_count, folder_id, kelola_doc_id, updated_at`,
        [req.params.id, userId, description ?? null, tags ? `{${tags.map(t => `"${t.replace(/"/g, '')}"`).join(",")}}` : null,
         folder_id ?? null, kelola_doc_id ?? null]
      );
      res.json(rows[0]);
    } catch (e) { safeErr(res, e, "PATCH files/:id"); }
  });

  // ── DELETE /api/ruang-simpan/files/:id ───────────────────────────────────
  app.delete("/api/ruang-simpan/files/:id", isAuthenticated, rsWriteLimit, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!guardUUID(req.params.id, res)) return;
    try {
      // Ambil storage_key sebelum delete agar bisa hapus dari Object Storage
      const { rows } = await pool.query(
        `DELETE FROM ruang_simpan_files WHERE id = $1 AND user_id = $2 RETURNING storage_key`,
        [req.params.id, userId]
      );
      if (!rows.length) return res.status(403).json({ error: "File tidak ditemukan atau akses ditolak" });
      // Hapus dari Object Storage (fire-and-forget, tidak block response)
      const { storage_key } = rows[0];
      if (storage_key) deleteFile(storage_key).catch(console.error);
      res.json({ ok: true });
    } catch (e) { safeErr(res, e, "DELETE files/:id"); }
  });

  // ── GET /api/ruang-simpan/files/:id/download ─────────────────────────────
  app.get("/api/ruang-simpan/files/:id/download", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!guardUUID(req.params.id, res)) return;
    try {
      const { rows } = await pool.query(
        `SELECT f.original_name, f.mime_type, f.storage_key
         FROM ruang_simpan_files f
         WHERE f.id = $1 AND f.user_id = $2`,
        [req.params.id, userId]
      );
      if (!rows.length) return res.status(404).json({ error: "File tidak ditemukan" });
      const { original_name, mime_type, storage_key } = rows[0];
      if (!storage_key) return res.status(410).json({ error: "File tidak tersedia (storage_key kosong)" });
      const buffer = await downloadFile(storage_key);
      res.setHeader("Content-Type", mime_type);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(original_name)}"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(buffer);
    } catch (e) { safeErr(res, e, "GET files/:id/download"); }
  });

  // ── GET /api/ruang-simpan/files/:id/preview ──────────────────────────────
  app.get("/api/ruang-simpan/files/:id/preview", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!guardUUID(req.params.id, res)) return;
    try {
      const { rows } = await pool.query(
        `SELECT f.original_name, f.mime_type, f.storage_key
         FROM ruang_simpan_files f
         WHERE f.id = $1 AND f.user_id = $2`,
        [req.params.id, userId]
      );
      if (!rows.length) return res.status(404).json({ error: "File tidak ditemukan" });
      const { original_name, mime_type, storage_key } = rows[0];
      if (!storage_key) return res.status(410).json({ error: "File tidak tersedia (storage_key kosong)" });
      const buffer = await downloadFile(storage_key);
      res.setHeader("Content-Type", mime_type);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(original_name)}"`);
      res.setHeader("Cache-Control", "private, max-age=300");
      res.send(buffer);
    } catch (e) { safeErr(res, e, "GET files/:id/preview"); }
  });

  // ── POST /api/ruang-simpan/folders ───────────────────────────────────────
  app.post("/api/ruang-simpan/folders", isAuthenticated, rsWriteLimit, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    const parsed = folderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors });
    try {
      const { rows } = await pool.query(
        `INSERT INTO ruang_simpan_folders (user_id, name, color, icon, is_default)
         VALUES ($1,$2,$3,$4,false)
         RETURNING id, name, color, icon, is_default, sort_order, created_at`,
        [userId, parsed.data.name, parsed.data.color || "gray", parsed.data.icon || "folder"]
      );
      res.json(rows[0]);
    } catch (e) { safeErr(res, e, "POST folders"); }
  });

  // ── DELETE /api/ruang-simpan/folders/:id ─────────────────────────────────
  app.delete("/api/ruang-simpan/folders/:id", isAuthenticated, rsWriteLimit, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!guardUUID(req.params.id, res)) return;
    try {
      const { rows: own } = await pool.query(
        `SELECT id, is_default FROM ruang_simpan_folders WHERE id = $1 AND user_id = $2`,
        [req.params.id, userId]
      );
      if (!own.length) return res.status(403).json({ error: "Folder tidak ditemukan" });
      if (own[0].is_default) return res.status(400).json({ error: "Folder default tidak bisa dihapus" });
      // Move files to null (Semua)
      await pool.query(`UPDATE ruang_simpan_files SET folder_id = NULL WHERE folder_id = $1`, [req.params.id]);
      await pool.query(`DELETE FROM ruang_simpan_folders WHERE id = $1 AND user_id = $2`, [req.params.id, userId]);
      res.json({ ok: true });
    } catch (e) { safeErr(res, e, "DELETE folders/:id"); }
  });

  // ── GET /api/ruang-simpan/search ─────────────────────────────────────────
  app.get("/api/ruang-simpan/search", isAuthenticated, rsSearchLimit, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    const q = (req.query.q as string || "").trim().slice(0, 200);
    if (!q || q.length < 2) return res.status(400).json({ error: "Query minimal 2 karakter" });
    try {
      // Search by filename + description
      const { rows: metaHits } = await pool.query(
        `SELECT f.id, f.original_name, f.mime_type, f.size_bytes, f.kb_status,
                f.folder_id, f.created_at,
                fo.name AS folder_name
         FROM ruang_simpan_files f
         LEFT JOIN ruang_simpan_folders fo ON fo.id = f.folder_id
         WHERE f.user_id = $1
           AND (f.original_name ILIKE $2 OR f.description ILIKE $2
                OR EXISTS (SELECT 1 FROM unnest(f.tags) t WHERE t ILIKE $2))
         ORDER BY f.created_at DESC LIMIT 10`,
        [userId, `%${q}%`]
      );
      // Search in KB chunks (full-text)
      const { rows: chunkHits } = await pool.query(
        `SELECT DISTINCT ON (c.file_id)
                f.id, f.original_name, f.mime_type, f.size_bytes, f.kb_status, f.folder_id, f.created_at,
                fo.name AS folder_name,
                ts_headline('indonesian', c.content, plainto_tsquery('indonesian',$2),
                  'MaxWords=20, MinWords=5, StartSel=<mark>, StopSel=</mark>') AS snippet
         FROM ruang_simpan_chunks c
         JOIN ruang_simpan_files f ON f.id = c.file_id
         LEFT JOIN ruang_simpan_folders fo ON fo.id = f.folder_id
         WHERE c.user_id = $1
           AND to_tsvector('indonesian', c.content) @@ plainto_tsquery('indonesian', $2)
         ORDER BY c.file_id, ts_rank(to_tsvector('indonesian', c.content), plainto_tsquery('indonesian',$2)) DESC
         LIMIT 10`,
        [userId, q]
      );
      // Merge, deduplicate by id
      const seen = new Set<string>();
      const results: any[] = [];
      for (const r of [...metaHits, ...chunkHits]) {
        if (!seen.has(r.id)) { seen.add(r.id); results.push(r); }
      }
      res.json({ results: results.slice(0, 15), query: q });
    } catch (e) { safeErr(res, e, "GET search"); }
  });

  // ── GET /api/ruang-simpan/context (used by AI features) ──────────────────
  // Returns top KB chunks for a query — used by Bedah Dokumen, Klinik, dll.
  app.get("/api/ruang-simpan/context", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    const q = (req.query.q as string || "").trim().slice(0, 500);
    const limit = Math.min(parseInt(req.query.limit as string || "5"), 10);
    if (!q) return res.json({ chunks: [] });
    try {
      const { rows } = await pool.query(
        `SELECT c.content, f.original_name, fo.name AS folder_name
         FROM ruang_simpan_chunks c
         JOIN ruang_simpan_files f ON f.id = c.file_id
         LEFT JOIN ruang_simpan_folders fo ON fo.id = f.folder_id
         WHERE c.user_id = $1
           AND to_tsvector('indonesian', c.content) @@ plainto_tsquery('indonesian', $2)
         ORDER BY ts_rank(to_tsvector('indonesian', c.content), plainto_tsquery('indonesian', $2)) DESC
         LIMIT $3`,
        [userId, q, limit]
      );
      res.json({ chunks: rows });
    } catch (e) { safeErr(res, e, "GET context"); }
  });

  // ── GET /api/ruang-simpan/usage ───────────────────────────────────────────
  app.get("/api/ruang-simpan/usage", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    try {
      const used = await getUsedBytes(userId);
      res.json({ used_bytes: used, quota_bytes: FREE_QUOTA_BYTES,
                 used_mb: (used / 1024 / 1024).toFixed(2),
                 quota_mb: (FREE_QUOTA_BYTES / 1024 / 1024).toFixed(0),
                 pct: Math.min(100, Math.round((used / FREE_QUOTA_BYTES) * 100)) });
    } catch (e) { safeErr(res, e, "GET usage"); }
  });
}

// ── Background file processor ─────────────────────────────────────────────

async function processFileAsync(
  fileId: string, userId: string,
  buffer: Buffer, mime: string, filename: string
): Promise<void> {
  try {
    await pool.query(`UPDATE ruang_simpan_files SET kb_status='processing' WHERE id=$1`, [fileId]);
    const text = await extractText(buffer, mime, filename);
    if (!text || text.trim().length < 10) {
      await pool.query(
        `UPDATE ruang_simpan_files SET kb_status='skipped', extracted_text=NULL WHERE id=$1`, [fileId]
      );
      return;
    }
    // Store chunks
    const chunks = chunkText(text.trim());
    await pool.query(`DELETE FROM ruang_simpan_chunks WHERE file_id=$1`, [fileId]);
    for (let i = 0; i < chunks.length; i++) {
      await pool.query(
        `INSERT INTO ruang_simpan_chunks (file_id, user_id, chunk_index, content)
         VALUES ($1,$2,$3,$4)`,
        [fileId, userId, i, chunks[i]]
      );
    }
    await pool.query(
      `UPDATE ruang_simpan_files SET
         kb_status='ready', extracted_text=$2, kb_chunk_count=$3, updated_at=now()
       WHERE id=$1`,
      [fileId, text.slice(0, 50_000), chunks.length]
    );
  } catch (e) {
    console.error("[RuangSimpan] processFileAsync error:", e);
    await pool.query(`UPDATE ruang_simpan_files SET kb_status='failed' WHERE id=$1`, [fileId]).catch(() => {});
  }
}
