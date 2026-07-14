/**
 * ============================================================================
 * BLUEPRINT ENGINE — ROUTES (Fase Penyambungan / Tahap 10)
 * ============================================================================
 *
 * Lapisan tipis yang MENYAMBUNGKAN engine Blueprint (Tahap 1–9, pure) ke HTTP
 * API. Tidak mengubah UI/Builder; semua endpoint stateless — klien membawa
 * Blueprint JSON di setiap panggilan. Hanya `/configure` yang MENULIS ke DB.
 *
 * Alur:
 *   start  → blueprint kosong + dialog awal
 *   answer → terapkan jawaban → inference → confidence → dialog berikutnya
 *   state  → dialog berikutnya (read-only)
 *   analyze→ confidence + gap + critique + simulation (read-only)
 *   configure → tulis Blueprint ke Builder (default dryRun, aman)
 * ============================================================================
 */

import type { Express, Request, Response } from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/models/auth";
import {
  blueprintSchema,
  createEmptyBlueprint,
  lintBlueprintFieldMeta,
  type Blueprint,
} from "@shared/blueprint/blueprint-schema";
import {
  selectNextQuestions,
  getDialogueState,
  applyAnswers,
  inferBlueprint,
  applyConfidence,
  scoreBlueprint,
  analyzeGaps,
  critiqueBlueprint,
  simulateBlueprint,
  buildMasteryProfile,
  applyBlueprintToBuilder,
} from "./services/blueprint-engine";

/* ===========================================================================
 * Helper
 * ======================================================================== */

/** Validasi body.blueprint → Blueprint terketik. Lempar pesan ramah bila gagal. */
function parseBlueprint(raw: unknown): Blueprint {
  const parsed = blueprintSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new HttpError(400, `Blueprint tidak valid: ${issues}`);
  }
  return parsed.data;
}

/**
 * Pipeline pengayaan: inference (simpulkan field) → confidence (skor per modul).
 * Dipakai setelah setiap perubahan agar dialog berikutnya akurat.
 */
function enrich(blueprint: Blueprint) {
  const inferred = inferBlueprint(blueprint);
  const { blueprint: scored, report } = applyConfidence(inferred.blueprint);
  return { blueprint: scored, confidence: report, inferences: inferred.inferences };
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Ambil id user dari sesi (pola sama dengan route agen existing). */
function sessionUserId(req: Request): string {
  const u = req.user as any;
  return u?.claims?.sub || u?.id || "";
}

/** Apakah user adalah admin/superadmin (env allowlist + role di DB)? */
async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (adminIds.includes(userId)) return true;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const superEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  try {
    const [dbUser] = await db
      .select({ role: users.role, email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    if (!dbUser) return false;
    const email = (dbUser.email || "").toLowerCase();
    if (superEmails.includes(email) || adminEmails.includes(email)) return true;
    return dbUser.role === "admin" || dbUser.role === "superadmin";
  } catch {
    return false;
  }
}

/** Bungkus handler async → tangani HttpError & error tak terduga jadi JSON. */
function handler(fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof HttpError) {
        res.status(e.status).json({ error: e.message });
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: `Blueprint engine error: ${message}` });
    }
  };
}

/* ===========================================================================
 * Registrasi route
 * ======================================================================== */

export function registerBlueprintEngineRoutes(app: Express): void {
  /**
   * POST /api/blueprint/start
   * Body: { intent?: string }
   * → Blueprint kosong (di-enrich) + state dialog awal.
   */
  app.post(
    "/api/blueprint/start",
    isAuthenticated,
    handler(async (req, res) => {
      const intent = typeof req.body?.intent === "string" ? req.body.intent : undefined;
      const base = createEmptyBlueprint(intent);
      const { blueprint, confidence, inferences } = enrich(base);
      res.json({
        blueprint,
        dialogue: getDialogueState(blueprint),
        confidence,
        inferences,
      });
    }),
  );

  /**
   * POST /api/blueprint/answer
   * Body: { blueprint, answers: Record<nodeId, value>, options? }
   * → Terapkan jawaban → inference → confidence → state dialog berikutnya.
   */
  app.post(
    "/api/blueprint/answer",
    isAuthenticated,
    handler(async (req, res) => {
      const blueprint = parseBlueprint(req.body?.blueprint);
      const answersSchema = z.record(z.string(), z.any());
      const answers = answersSchema.safeParse(req.body?.answers);
      if (!answers.success || Object.keys(answers.data).length === 0) {
        throw new HttpError(400, "Body 'answers' wajib berupa objek { nodeId: nilai } tidak kosong.");
      }

      const applied = applyAnswers(blueprint, answers.data);
      const { blueprint: enriched, confidence, inferences } = enrich(applied.blueprint);

      res.json({
        blueprint: enriched,
        applied: applied.applied,
        warnings: applied.warnings,
        dialogue: getDialogueState(enriched),
        confidence,
        inferences,
      });
    }),
  );

  /**
   * POST /api/blueprint/state
   * Body: { blueprint, options? }  (read-only)
   * → Pertanyaan berikutnya & progres esensial.
   */
  app.post(
    "/api/blueprint/state",
    isAuthenticated,
    handler(async (req, res) => {
      const blueprint = parseBlueprint(req.body?.blueprint);
      const options = req.body?.options ?? {};
      res.json({
        dialogue: getDialogueState(blueprint, options),
        nextQuestions: selectNextQuestions(blueprint, options),
      });
    }),
  );

  /**
   * POST /api/blueprint/analyze
   * Body: { blueprint }  (read-only)
   * → confidence + gap + critique + simulation + lint.
   */
  app.post(
    "/api/blueprint/analyze",
    isAuthenticated,
    handler(async (req, res) => {
      const blueprint = parseBlueprint(req.body?.blueprint);
      res.json({
        confidence: scoreBlueprint(blueprint),
        gaps: analyzeGaps(blueprint),
        critique: critiqueBlueprint(blueprint),
        simulation: simulateBlueprint(blueprint),
        masteryProfile: buildMasteryProfile(blueprint),
        lint: lintBlueprintFieldMeta(blueprint),
      });
    }),
  );

  /**
   * POST /api/blueprint/configure
   * Body: { blueprint, mode: "create"|"update", agentId?, dryRun? }
   * → Tulis Blueprint ke Builder lewat Configuration Engine.
   *
   * KEAMANAN: dryRun DEFAULT true. Klien WAJIB mengirim dryRun:false secara
   * eksplisit untuk benar-benar menulis ke DB.
   */
  app.post(
    "/api/blueprint/configure",
    isAuthenticated,
    handler(async (req, res) => {
      const blueprint = parseBlueprint(req.body?.blueprint);
      const mode = req.body?.mode;
      if (mode !== "create" && mode !== "update") {
        throw new HttpError(400, "Field 'mode' wajib 'create' atau 'update'.");
      }

      // agentId boleh string ATAU number (agents.id = serial) → kanonik ke string.
      const rawId = req.body?.agentId;
      const agentId =
        typeof rawId === "number" ? String(rawId) : typeof rawId === "string" ? rawId : "";

      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");

      if (mode === "update") {
        if (!agentId) {
          throw new HttpError(400, "Field 'agentId' wajib untuk mode 'update'.");
        }
        // Otorisasi kepemilikan: hanya pemilik agen atau admin yang boleh menulis.
        const target = await storage.getAgent(agentId);
        if (!target) {
          throw new HttpError(404, `Agen "${agentId}" tidak ditemukan.`);
        }
        const owns = target.userId && target.userId === userId;
        if (!owns && !(await isAdminUser(userId))) {
          throw new HttpError(403, "Anda tidak berhak mengubah agen ini.");
        }
      }

      // Default aman: tidak menulis kecuali klien minta eksplisit dryRun:false.
      const dryRun = req.body?.dryRun !== false;

      const result = await applyBlueprintToBuilder(blueprint, {
        mode,
        agentId: mode === "update" ? agentId : undefined,
        dryRun,
        mapping: req.body?.mapping,
        // Mode create: set kepemilikan agen ke user pembuat (agar muncul di dashboard-nya).
        ownerUserId: mode === "create" ? userId : undefined,
      });

      res.json(result);
    }),
  );

  /**
   * POST /api/blueprint/certificate/share
   * Body: { blueprint }
   * → Bangun MasteryProfile → simpan SNAPSHOT beku + token → kembalikan token & path.
   *
   * Snapshot bersifat immutable: edit blueprint kemudian TIDAK mengubah apa yang
   * sudah dibagikan. Hanya user login yang boleh membuat tautan.
   */
  app.post(
    "/api/blueprint/certificate/share",
    isAuthenticated,
    handler(async (req, res) => {
      const blueprint = parseBlueprint(req.body?.blueprint);
      const profile = buildMasteryProfile(blueprint);
      if (!profile || profile.answeredFields <= 0) {
        throw new HttpError(
          400,
          "Peta pemahaman masih kosong. Isi refleksi Anda dulu sebelum membuat tautan berbagi.",
        );
      }

      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");

      // Token URL-friendly (base64url), acak & sulit ditebak.
      const token = randomBytes(12).toString("base64url");

      const record = await storage.createSharedCertificate({
        token,
        userId,
        topic: profile.topic ?? null,
        profile: profile as unknown as Record<string, unknown>,
      });

      res.json({ token: record.token, path: `/sertifikat/${record.token}` });
    }),
  );

  /**
   * GET /api/blueprint/certificate/:token
   * PUBLIK (tanpa login) — kembalikan snapshot MasteryProfile read-only.
   * Hanya membaca; tidak pernah menulis. Tidak membocorkan pemilik/identitas.
   */
  app.get(
    "/api/blueprint/certificate/:token",
    handler(async (req, res) => {
      const token = String(req.params.token || "");
      if (!token || token.length > 32) {
        throw new HttpError(400, "Token tautan tidak valid.");
      }
      const record = await storage.getSharedCertificateByToken(token);
      if (!record) {
        throw new HttpError(404, "Sertifikat tidak ditemukan atau tautan sudah tidak berlaku.");
      }
      res.json({
        topic: record.topic ?? null,
        profile: record.profile,
        createdAt: record.createdAt,
      });
    }),
  );
}
