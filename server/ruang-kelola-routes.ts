/**
 * Ruang Kelola — API Routes
 * Modul pengelolaan legalitas, SBU, SKK, perizinan, dan tender untuk BUJK.
 */
import type { Express } from "express";
import { db, pool } from "./db";
import { isAuthenticated } from "./replit_integrations/auth";

export function registerRuangKelolaRoutes(app: Express) {

  // ── GET /api/ruang-kelola/profile ──────────────────────────────────────
  app.get("/api/ruang-kelola/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { rows } = await pool.query(
        `SELECT * FROM ruang_kelola_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      res.json(rows[0] || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/ruang-kelola/profile (upsert) ────────────────────────────
  app.post("/api/ruang-kelola/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { company_name, nib, npwp, bujk_class, province, phone, email, address } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO ruang_kelola_profiles
           (user_id, company_name, nib, npwp, bujk_class, province, phone, email, address, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
         ON CONFLICT (user_id) DO UPDATE SET
           company_name  = EXCLUDED.company_name,
           nib           = EXCLUDED.nib,
           npwp          = EXCLUDED.npwp,
           bujk_class    = EXCLUDED.bujk_class,
           province      = EXCLUDED.province,
           phone         = EXCLUDED.phone,
           email         = EXCLUDED.email,
           address       = EXCLUDED.address,
           updated_at    = now()
         RETURNING *`,
        [userId, company_name || '', nib, npwp, bujk_class, province, phone, email, address]
      );
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/ruang-kelola/summary ──────────────────────────────────────
  app.get("/api/ruang-kelola/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { rows } = await pool.query(
        `SELECT
           category,
           COUNT(*) FILTER (WHERE expired_date IS NULL OR expired_date > now() + interval '30 days') AS aktif,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date > now() AND expired_date <= now() + interval '30 days') AS expiring_soon,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date <= now()) AS expired,
           COUNT(*) AS total
         FROM ruang_kelola_documents
         WHERE user_id = $1
         GROUP BY category`,
        [userId]
      );
      // Global totals
      const { rows: totals } = await pool.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date <= now()) AS total_expired,
           COUNT(*) FILTER (WHERE expired_date IS NOT NULL AND expired_date > now() AND expired_date <= now() + interval '30 days') AS total_expiring_soon
         FROM ruang_kelola_documents
         WHERE user_id = $1`,
        [userId]
      );
      res.json({ byCategory: rows, totals: totals[0] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/ruang-kelola/documents ────────────────────────────────────
  app.get("/api/ruang-kelola/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { category } = req.query;
      let query = `SELECT * FROM ruang_kelola_documents WHERE user_id = $1`;
      const params: any[] = [userId];
      if (category && category !== 'semua') {
        query += ` AND category = $2`;
        params.push(category);
      }
      query += ` ORDER BY
        CASE WHEN expired_date IS NOT NULL AND expired_date <= now() THEN 0
             WHEN expired_date IS NOT NULL AND expired_date <= now() + interval '30 days' THEN 1
             ELSE 2
        END, expired_date ASC NULLS LAST, created_at DESC`;
      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/ruang-kelola/documents ───────────────────────────────────
  app.post("/api/ruang-kelola/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const {
        category, doc_type, doc_name, doc_number, issued_by,
        issued_date, expired_date, status, notes, file_url, metadata
      } = req.body;
      if (!category || !doc_type || !doc_name) {
        return res.status(400).json({ error: "category, doc_type, doc_name wajib diisi" });
      }
      // Auto-compute status from date
      const computedStatus = computeStatus(expired_date, status);
      const { rows } = await pool.query(
        `INSERT INTO ruang_kelola_documents
           (user_id, category, doc_type, doc_name, doc_number, issued_by,
            issued_date, expired_date, status, notes, file_url, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [userId, category, doc_type, doc_name, doc_number || null, issued_by || null,
         issued_date || null, expired_date || null, computedStatus,
         notes || null, file_url || null, JSON.stringify(metadata || {})]
      );
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── PATCH /api/ruang-kelola/documents/:id ──────────────────────────────
  app.patch("/api/ruang-kelola/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { id } = req.params;
      // Ownership check
      const { rows: own } = await pool.query(
        `SELECT id FROM ruang_kelola_documents WHERE id = $1 AND user_id = $2`, [id, userId]
      );
      if (!own.length) return res.status(403).json({ error: "Tidak ditemukan atau akses ditolak" });

      const {
        category, doc_type, doc_name, doc_number, issued_by,
        issued_date, expired_date, status, notes, file_url, metadata
      } = req.body;
      const computedStatus = computeStatus(expired_date, status);
      const { rows } = await pool.query(
        `UPDATE ruang_kelola_documents SET
           category     = COALESCE($3, category),
           doc_type     = COALESCE($4, doc_type),
           doc_name     = COALESCE($5, doc_name),
           doc_number   = $6,
           issued_by    = $7,
           issued_date  = $8,
           expired_date = $9,
           status       = $10,
           notes        = $11,
           file_url     = $12,
           metadata     = COALESCE($13, metadata),
           updated_at   = now(),
           reminder_sent_30d = false,
           reminder_sent_7d  = false
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId, category, doc_type, doc_name,
         doc_number || null, issued_by || null,
         issued_date || null, expired_date || null, computedStatus,
         notes || null, file_url || null,
         metadata ? JSON.stringify(metadata) : null]
      );
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── DELETE /api/ruang-kelola/documents/:id ─────────────────────────────
  app.delete("/api/ruang-kelola/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { id } = req.params;
      const { rowCount } = await pool.query(
        `DELETE FROM ruang_kelola_documents WHERE id = $1 AND user_id = $2`, [id, userId]
      );
      if (!rowCount) return res.status(403).json({ error: "Tidak ditemukan atau akses ditolak" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

// ── Helper ─────────────────────────────────────────────────────────────────
function computeStatus(expiredDate: string | null | undefined, manualStatus?: string): string {
  // For tender / in_progress status keep manual
  if (manualStatus && ['in_progress', 'won', 'lost', 'cancelled'].includes(manualStatus)) {
    return manualStatus;
  }
  if (!expiredDate) return manualStatus || 'active';
  const exp = new Date(expiredDate);
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (exp <= now) return 'expired';
  if (exp <= in30) return 'expiring_soon';
  return 'active';
}
