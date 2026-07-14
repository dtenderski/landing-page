/**
 * ============================================================================
 * ORGANIZATION ENGINE — ROUTES (Fase 3 / Tahap 21)
 * ============================================================================
 *
 * Lapisan tipis yang MENYAMBUNGKAN engine Organisasi (Tahap 18–20, pure) ke
 * HTTP API. Sejajar dengan `blueprint-engine-routes.ts` (single-agent), tetapi
 * untuk merancang & mewujudkan SEBUAH TIM agen (orchestrator + spesialis).
 *
 * Semua endpoint stateless — klien membawa OrganizationBlueprint JSON di setiap
 * panggilan. Hanya `/configure` yang MENULIS ke DB, dan itupun:
 *   - default `dryRun:true` (aman; klien WAJIB kirim dryRun:false untuk menulis),
 *   - penulisan nyata berjalan ATOMIK di dalam satu transaksi (lihat engine),
 *   - SETIAP agen di-stamp `ownerUserId` = user sesi (muncul di dashboard-nya).
 *
 * Alur:
 *   analyze   → lint + validasi (read-only)
 *   configure → materialisasi tim lewat Organization Configuration Engine
 * ============================================================================
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import {
  organizationBlueprintSchema,
  lintOrganizationBlueprint,
  createEmptyOrganizationBlueprint,
  type OrganizationBlueprint,
} from "@shared/blueprint/organization-blueprint-schema";
import { mapOrganizationToBuilder } from "./services/blueprint-engine/organization-mapping-engine";
import { applyOrganizationToBuilder } from "./services/blueprint-engine/organization-configuration-engine";
import {
  suggestTeamComposition,
  inferOrganization,
  getOrgDialogueState,
} from "./services/blueprint-engine/organization-dialogue-engine";

/* ===========================================================================
 * Helper
 * ======================================================================== */

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Validasi body.organization → OrganizationBlueprint terketik. */
function parseOrganization(raw: unknown): OrganizationBlueprint {
  const parsed = organizationBlueprintSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new HttpError(400, `Organisasi tidak valid: ${issues}`);
  }
  return parsed.data;
}

/** Ambil id user dari sesi (pola sama dengan route existing). */
function sessionUserId(req: Request): string {
  const u = req.user as any;
  return u?.claims?.sub || u?.id || "";
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
      res.status(500).json({ error: `Organization engine error: ${message}` });
    }
  };
}

/* ===========================================================================
 * Registrasi route
 * ======================================================================== */

export function registerOrganizationEngineRoutes(app: Express): void {
  /**
   * POST /api/organization/analyze  (read-only)
   * Body: { organization }
   * → lint organisasi + ringkasan rencana (jumlah agen, wiring) tanpa menulis.
   */
  app.post(
    "/api/organization/analyze",
    isAuthenticated,
    handler(async (req, res) => {
      const org = parseOrganization(req.body?.organization);
      const plan = mapOrganizationToBuilder(org);
      res.json({
        lint: lintOrganizationBlueprint(org),
        plan: {
          memberCount: plan.members.length,
          orchestratorCount: plan.members.filter((m) => m.role === "orchestrator").length,
          wiring: plan.wiring.map((w) => ({
            orchestratorLocalId: w.orchestratorLocalId,
            subAgentCount: w.subAgents.length,
          })),
          warnings: plan.warnings,
        },
      });
    }),
  );

  /**
   * POST /api/organization/configure
   * Body: { organization, dryRun?, mapping? }
   * → Wujudkan tim lewat Organization Configuration Engine.
   *
   * KEAMANAN: dryRun DEFAULT true. Klien WAJIB mengirim dryRun:false secara
   * eksplisit untuk benar-benar menulis ke DB. Penulisan nyata berjalan ATOMIK
   * (semua-atau-tidak) dan men-stamp kepemilikan ke user sesi.
   */
  app.post(
    "/api/organization/configure",
    isAuthenticated,
    handler(async (req, res) => {
      const org = parseOrganization(req.body?.organization);

      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");

      // Default aman: tidak menulis kecuali klien minta eksplisit dryRun:false.
      const dryRun = req.body?.dryRun !== false;

      const result = await applyOrganizationToBuilder(org, {
        dryRun,
        mapping: req.body?.mapping,
        // Setiap agen tim dimiliki user pembuat (agar muncul di dashboard-nya).
        ownerUserId: userId,
      });

      res.json(result);
    }),
  );

  /**
   * POST /api/organization/suggest  (read-only)
   * Body: { mission, maxSpecialists? }
   * → Saran komposisi tim deterministik dari teks misi (Tahap 23 engine).
   *   Mengembalikan { domain, members } untuk diisi ke wizard — TIDAK menulis
   *   apa pun & tidak membangun OrganizationBlueprint penuh (klien yang merakit).
   */
  app.post(
    "/api/organization/suggest",
    isAuthenticated,
    handler(async (req, res) => {
      const mission = typeof req.body?.mission === "string" ? req.body.mission : "";
      if (!mission.trim()) throw new HttpError(400, "Misi tim belum diisi.");

      const raw = Number(req.body?.maxSpecialists);
      const maxSpecialists = Number.isFinite(raw)
        ? Math.max(1, Math.min(5, Math.floor(raw)))
        : 3;

      res.json(suggestTeamComposition(mission, { maxSpecialists }));
    }),
  );

  /**
   * POST /api/organization/dialogue  (read-only)
   * Body: { name?, mission? }
   * → Wawancara org-level terpandu (Tahap 23 engine): kembalikan pertanyaan
   *   berikutnya yang perlu ditanyakan (misi → nama) + status kesiapan menyusun
   *   tim. TIDAK menulis apa pun & tidak membangun OrganizationBlueprint penuh —
   *   klien mengisi jawaban ke field nama/misi yang sama dengan jalur manual.
   */
  app.post(
    "/api/organization/dialogue",
    isAuthenticated,
    handler(async (req, res) => {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const mission = typeof req.body?.mission === "string" ? req.body.mission.trim() : "";

      const org = createEmptyOrganizationBlueprint();
      if (name) org.meta.name = name;
      if (mission) org.meta.mission = mission;

      res.json(getOrgDialogueState(org));
    }),
  );

  /**
   * POST /api/organization/infer  (read-only)
   * Body: { organization }
   * → Jalankan Organization Inference Engine (Tahap 23): isi field anggota yang
   *   kosong (deskripsi/tugas + systemPrompt) via inferensi single-agent, sarankan
   *   struktur bila kosong, lalu hitung kesiapan tim. TIDAK menulis ke DB.
   *
   *   Mengembalikan ringkasan per-anggota (field hasil inferensi) agar wizard bisa
   *   mengisi HANYA bagian yang masih kosong — input pengguna tak pernah ditimpa.
   */
  app.post(
    "/api/organization/infer",
    isAuthenticated,
    handler(async (req, res) => {
      const org = parseOrganization(req.body?.organization);
      const result = inferOrganization(org);

      const members = result.organization.members.map((m) => {
        const id = m.blueprint.modules.identity.data as Record<string, any>;
        const ai = m.blueprint.modules.aiEngine.data as Record<string, any>;
        return {
          localId: m.localId,
          role: m.role,
          title: (m.title || id.name || "") as string,
          responsibility: (m.responsibility || id.description || m.blueprint.meta.intent || "") as string,
          systemPrompt: (ai.systemPrompt || "") as string,
        };
      });

      res.json({
        overallConfidence: result.overallConfidence,
        edgesAdded: result.edgesAdded.length,
        memberInferences: result.memberInferences,
        warnings: result.warnings,
        members,
      });
    }),
  );

  /* =========================================================================
   * Rancangan Tim Tersimpan (Tahap 37) — simpan/kelola desain tim di akun.
   *
   * KEAMANAN: SEMUA endpoint STRICTLY owner-scoped — id selalu dipasangkan
   * dengan userId sesi di lapisan storage (no global getById), jadi tidak ada
   * jalur IDOR untuk membaca/ubah/hapus rancangan milik user lain. Murni
   * penyimpanan desain (JSON wizard) — TIDAK pernah membuat agen (itu tetap
   * lewat /configure).
   * ====================================================================== */

  /** Validasi body simpan/perbarui rancangan → { name, mission, data }. */
  function parseDraftBody(raw: any): { name: string; mission: string; data: any } {
    const data = raw?.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new HttpError(400, "Rancangan tidak valid: 'data' harus objek.");
    }
    if (!Array.isArray((data as any).members)) {
      throw new HttpError(400, "Rancangan tidak valid: 'data.members' harus array.");
    }
    const rawName = typeof raw?.name === "string" ? raw.name.trim() : "";
    const name = (rawName || "Tim Tanpa Judul").slice(0, 120);
    const mission = (typeof raw?.mission === "string" ? raw.mission : "").slice(0, 2000);
    return { name, mission, data };
  }

  /** Ringkasan ringan untuk daftar (tanpa payload penuh). */
  function summarizeDraft(d: { id: number; name: string; mission: string | null; data: any; updatedAt: Date }) {
    const members = Array.isArray(d.data?.members) ? d.data.members : [];
    return {
      id: d.id,
      name: d.name,
      mission: d.mission ?? "",
      memberCount: members.length,
      updatedAt: d.updatedAt,
    };
  }

  // GET /api/organization/drafts → daftar ringkas milik user sesi.
  app.get(
    "/api/organization/drafts",
    isAuthenticated,
    handler(async (req, res) => {
      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");
      const rows = await storage.listOrganizationDraftsForUser(userId);
      res.json({ drafts: rows.map(summarizeDraft) });
    }),
  );

  // GET /api/organization/drafts/:id → rancangan penuh (owner saja).
  app.get(
    "/api/organization/drafts/:id",
    isAuthenticated,
    handler(async (req, res) => {
      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw new HttpError(400, "ID tidak valid.");
      const row = await storage.getOrganizationDraftForUser(id, userId);
      if (!row) throw new HttpError(404, "Rancangan tidak ditemukan.");
      res.json({ draft: row });
    }),
  );

  // POST /api/organization/drafts → simpan rancangan baru (di-stamp owner sesi).
  app.post(
    "/api/organization/drafts",
    isAuthenticated,
    handler(async (req, res) => {
      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");
      const { name, mission, data } = parseDraftBody(req.body);
      const created = await storage.createOrganizationDraft({ userId, name, mission, data });
      res.json({ draft: created });
    }),
  );

  // PUT /api/organization/drafts/:id → perbarui rancangan (owner saja).
  app.put(
    "/api/organization/drafts/:id",
    isAuthenticated,
    handler(async (req, res) => {
      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw new HttpError(400, "ID tidak valid.");
      const { name, mission, data } = parseDraftBody(req.body);
      const updated = await storage.updateOrganizationDraftForUser(id, userId, { name, mission, data });
      if (!updated) throw new HttpError(404, "Rancangan tidak ditemukan.");
      res.json({ draft: updated });
    }),
  );

  // DELETE /api/organization/drafts/:id → hapus rancangan (owner saja).
  app.delete(
    "/api/organization/drafts/:id",
    isAuthenticated,
    handler(async (req, res) => {
      const userId = sessionUserId(req);
      if (!userId) throw new HttpError(401, "Sesi tidak valid.");
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw new HttpError(400, "ID tidak valid.");
      const ok = await storage.deleteOrganizationDraftForUser(id, userId);
      if (!ok) throw new HttpError(404, "Rancangan tidak ditemukan.");
      res.json({ ok: true });
    }),
  );
}
