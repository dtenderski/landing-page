/**
 * Ruang Kelola — API Routes
 * Modul pengelolaan legalitas, SBU, SKK, perizinan, dan tender untuk BUJK.
 * Phase 2: OCR via Gemini Vision + Biro Jasa request system.
 */
import type { Express } from "express";
import { pool } from "./db";
import { isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const ocrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

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
  // ── POST /api/ruang-kelola/ocr ─────────────────────────────────────────────
  // Upload gambar/PDF dokumen → Gemini Vision mengekstrak field secara otomatis.
  app.post("/api/ruang-kelola/ocr", isAuthenticated, ocrUpload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diunggah" });

    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    if (!geminiKey) return res.status(503).json({ error: "Layanan OCR belum terkonfigurasi" });

    try {
      const genai = new GoogleGenAI({ apiKey: geminiKey, httpOptions: { apiVersion: "v1" } });
      const base64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

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
  "expired_date": "YYYY-MM-DD atau null (cari: berlaku sampai / masa berlaku / valid until / exp)",
  "detected_category": "satu dari: legalitas | sbu | skk | perizinan | tender",
  "subklasifikasi": "subklasifikasi/bidang keahlian/subbidang jika ada, atau null",
  "confidence": "high | medium | low",
  "notes": "info penting lain yang tertera di dokumen, atau null"
}`;

      const result = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ],
        }],
      });

      const raw = (result.text ?? "").trim();
      // Strip markdown code fences if Gemini adds them
      const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(422).json({ error: "Gagal membaca hasil OCR. Coba foto lebih jelas.", raw });
      }
      res.json({ ok: true, data: parsed });
    } catch (e: any) {
      res.status(500).json({ error: `OCR gagal: ${e.message}` });
    }
  });

  // ── POST /api/ruang-kelola/biro-request ────────────────────────────────────
  // Simpan permintaan bantuan biro jasa ke DB, lalu kirim notif WA ke admin.
  app.post("/api/ruang-kelola/biro-request", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { doc_id, service_type, notes } = req.body;
    if (!service_type) return res.status(400).json({ error: "service_type wajib diisi" });

    try {
      // Buat tabel jika belum ada (idempotent)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ruang_kelola_biro_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id text NOT NULL,
          doc_id uuid REFERENCES ruang_kelola_documents(id) ON DELETE SET NULL,
          service_type text NOT NULL,
          notes text,
          status text NOT NULL DEFAULT 'pending',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const { rows } = await pool.query(
        `INSERT INTO ruang_kelola_biro_requests (user_id, doc_id, service_type, notes)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, doc_id || null, service_type, notes || null]
      );

      // Ambil profil perusahaan + dokumen untuk notif WA ke admin
      const adminPhone = process.env.SUPERADMIN_PHONE || "6282299417818";
      const waToken = process.env.FONNTE_API_KEY;
      if (waToken) {
        const { rows: profileRows } = await pool.query(
          `SELECT company_name, phone FROM ruang_kelola_profiles WHERE user_id = $1`, [userId]
        );
        let docName = service_type;
        if (doc_id) {
          const { rows: docRows } = await pool.query(`SELECT doc_name, doc_type FROM ruang_kelola_documents WHERE id = $1`, [doc_id]);
          if (docRows[0]) docName = `${docRows[0].doc_name} (${docRows[0].doc_type})`;
        }
        const co = profileRows[0]?.company_name || "Tidak diketahui";
        const hp = profileRows[0]?.phone || "Tidak ada";
        const msg = `📋 *PERMINTAAN BIRO JASA — RUANG KELOLA*\n\n`
          + `🏢 Perusahaan: *${co}*\n`
          + `📱 Kontak: ${hp}\n`
          + `📄 Layanan: *${service_type}*\n`
          + `📑 Dokumen: ${docName}\n`
          + (notes ? `💬 Catatan: ${notes}\n` : "")
          + `\n🔗 ID Request: ${rows[0].id}\n`
          + `_Segera hubungi klien untuk tindak lanjut._`;

        fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: { Authorization: waToken },
          body: new URLSearchParams({ target: adminPhone, message: msg }),
        }).catch(() => {});
      }

      res.json({ ok: true, request: rows[0] });
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
