/**
 * ============================================================================
 * CONFIGURATION ENGINE — Tahap 4
 * ============================================================================
 *
 * Engine PERTAMA yang benar-benar MENULIS ke Builder. Ia mengambil hasil
 * Mapping Engine (Tahap 3) lalu:
 *   1. create / update baris di tabel `agents`.
 *   2. insert entitas anak (knowledge base, mini app, integration, project
 *      brain template) dengan `agentId` hasil langkah 1.
 *   3. resolusi `agentSlug` sub-agen → `agentId` sebelum simpan (sesuai catatan
 *      arsitek Tahap 3) dan buang `agentSlug` agar format `agenticSubAgents`
 *      tetap kanonik `{role, agentId, description}`.
 *
 * PRINSIP (ditegaskan owner):
 *   - TIDAK mengubah UI / komponen Builder. Hanya menulis DATA lewat storage.
 *   - Hasil auto-fill TETAP bisa diedit user di Builder seperti biasa.
 *   - Belum dipanggil dari route mana pun — masih aditif, menunggu fase lanjut.
 *
 * Mode aman:
 *   - `dryRun: true` → kembalikan rencana tanpa menulis apa pun.
 *   - Tiap insert anak divalidasi Zod & dibungkus try/catch; kegagalan satu
 *     baris jadi warning, bukan menggagalkan seluruh proses.
 *
 * Catatan keterbatasan (by design, di-defer):
 *   - `vouchers` (agentId numerik) & `agentic_deliverables` (agentId integer +
 *     dedupeKey unik) tidak kompatibel dengan agent ber-UUID string → di-skip
 *     dengan warning. Butuh enricher khusus di fase berikutnya.
 *   - `projectBrain.instances` butuh `templateId` hasil insert → di-defer.
 * ============================================================================
 */

import {
  insertAgentSchema,
  insertKnowledgeBaseSchema,
  insertMiniAppSchema,
  insertIntegrationSchema,
  insertProjectBrainTemplateSchema,
  type Agent,
  type InsertAgent,
  type InsertKnowledgeBase,
  type InsertMiniApp,
  type InsertIntegration,
  type InsertProjectBrainTemplate,
  type KnowledgeBase,
  type MiniApp,
  type Integration,
  type ProjectBrainTemplate,
  agents,
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { type Blueprint } from "@shared/blueprint/blueprint-schema";
import { storage as defaultStorage } from "../../storage";
import { mapBlueprintToBuilder, type MappingOptions } from "./mapping-engine";

/**
 * Schema validasi untuk mode "update". `insertAgentSchema` adalah ZodEffects
 * (punya refine "orchestrator wajib Big Idea") sehingga tidak bisa `.partial()`
 * dan refine-nya tidak relevan untuk update parsial. Pakai object schema murni
 * dari tabel `agents` lalu `.partial()` — memvalidasi tipe per-kolom tanpa refine.
 */
const agentUpdateSchema = createInsertSchema(agents).partial();

/* ===========================================================================
 * Tipe
 * ======================================================================== */

/** Subset storage yang dipakai engine (memudahkan injeksi & pengujian). */
export interface ConfigStorage {
  getAgentBySlug(slug: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined>;
  createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  createMiniApp(miniApp: InsertMiniApp): Promise<MiniApp>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  createProjectBrainTemplate(t: InsertProjectBrainTemplate): Promise<ProjectBrainTemplate>;
}

export interface ConfigurationOptions {
  mode: "create" | "update";
  /** Wajib untuk mode "update". */
  agentId?: string;
  /** Opsi diteruskan ke Mapping Engine (confidence gating, dll.). */
  mapping?: MappingOptions;
  /** Kembalikan rencana tanpa menulis (default false). */
  dryRun?: boolean;
  /** Jika diisi (khusus mode "create"), agen baru di-set kepemilikannya ke user ini. */
  ownerUserId?: string;
  /** Storage kustom (default: singleton aplikasi). */
  storage?: ConfigStorage;
}

export interface ConfigurationResult {
  applied: boolean;
  dryRun: boolean;
  mode: "create" | "update";
  agentId?: string;
  agentPatchKeys: string[];
  /**
   * Pratinjau nilai field yang AKAN ditulis ke agen (untuk "review-before-create"
   * di wizard). Hanya field primitif (string/number/boolean) yang ditampilkan,
   * string panjang dipotong, dan field rahasia (mis. customApiKey) DIBUANG.
   */
  agentPatchPreview: Record<string, string>;
  created: {
    knowledgeBases: number;
    miniApps: number;
    integrations: number;
    projectBrainTemplates: number;
  };
  warnings: string[];
}

/* ===========================================================================
 * Engine
 * ======================================================================== */

export async function applyBlueprintToBuilder(
  blueprint: Blueprint,
  options: ConfigurationOptions,
): Promise<ConfigurationResult> {
  const storage = options.storage ?? (defaultStorage as ConfigStorage);
  const dryRun = options.dryRun ?? false;

  const mapping = mapBlueprintToBuilder(blueprint, options.mapping);
  const warnings = [...mapping.warnings];
  const created = { knowledgeBases: 0, miniApps: 0, integrations: 0, projectBrainTemplates: 0 };

  // 1) Resolusi sub-agen by-slug → agentId (sebelum tulis agen).
  if (Array.isArray(mapping.agentPatch.agenticSubAgents)) {
    mapping.agentPatch.agenticSubAgents = await resolveSubAgents(
      mapping.agentPatch.agenticSubAgents,
      storage,
      warnings,
    );
  }

  // 2) Validasi patch agen.
  const patch = mapping.agentPatch;
  if (options.mode === "create") {
    const parsed = insertAgentSchema.safeParse(patch);
    if (!parsed.success) {
      warnings.push(`[agent.create] patch tidak valid: ${formatZod(parsed.error)}`);
      return finalize(false, dryRun, options.mode, undefined, patch, created, warnings);
    }
    if (dryRun) {
      return finalize(false, true, options.mode, undefined, patch, created, warnings);
    }
    let agent: Agent;
    try {
      // insertAgentSchema tidak punya field userId → safeParse membuangnya.
      // Suntik kepemilikan agar agen baru muncul di dashboard pemiliknya & bisa di-"update".
      const toCreate = options.ownerUserId
        ? ({ ...parsed.data, userId: options.ownerUserId } as InsertAgent)
        : parsed.data;
      agent = await storage.createAgent(toCreate);
    } catch (e) {
      warnings.push(`[agent.create] gagal menulis: ${errMsg(e)}`);
      return finalize(false, false, options.mode, undefined, patch, created, warnings);
    }
    const agentId = String(agent.id);
    await applyChildren(agentId, mapping.children, storage, created, warnings);
    return finalize(true, false, options.mode, agentId, patch, created, warnings);
  }

  // mode === "update"
  if (!options.agentId) {
    warnings.push(`[agent.update] agentId wajib untuk mode "update" (dibatalkan)`);
    return finalize(false, dryRun, options.mode, undefined, patch, created, warnings);
  }
  const parsed = agentUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    warnings.push(`[agent.update] patch tidak valid: ${formatZod(parsed.error)}`);
    return finalize(false, dryRun, options.mode, options.agentId, patch, created, warnings);
  }
  if (dryRun) {
    return finalize(false, true, options.mode, options.agentId, patch, created, warnings);
  }
  let updated: Agent | undefined;
  try {
    updated = await storage.updateAgent(options.agentId, parsed.data as Partial<InsertAgent>);
  } catch (e) {
    warnings.push(`[agent.update] gagal menulis: ${errMsg(e)}`);
    return finalize(false, false, options.mode, options.agentId, patch, created, warnings);
  }
  if (!updated) {
    warnings.push(`[agent.update] agen "${options.agentId}" tidak ditemukan (dibatalkan)`);
    return finalize(false, false, options.mode, options.agentId, patch, created, warnings);
  }
  const agentId = String(updated.id);
  await applyChildren(agentId, mapping.children, storage, created, warnings);
  return finalize(true, false, options.mode, agentId, patch, created, warnings);
}

/* ===========================================================================
 * Helper
 * ======================================================================== */

async function resolveSubAgents(
  subAgents: any[],
  storage: ConfigStorage,
  warnings: string[],
): Promise<Array<{ role: any; agentId: any; description: any }>> {
  const resolved: Array<{ role: any; agentId: any; description: any }> = [];
  for (const sa of subAgents) {
    let agentId = sa?.agentId;
    if (agentId === undefined && sa?.agentSlug) {
      const found = await storage.getAgentBySlug(sa.agentSlug);
      if (found) {
        agentId = found.id;
      } else {
        warnings.push(
          `[agenticSubAgents] slug "${sa.agentSlug}" (role ${sa?.role ?? "?"}) tak ditemukan → dilewati`,
        );
        continue;
      }
    }
    if (agentId === undefined) {
      warnings.push(`[agenticSubAgents] role ${sa?.role ?? "?"} tanpa agentId/agentSlug → dilewati`);
      continue;
    }
    // Format jsonb kanonik `agents.agenticSubAgents` mensyaratkan agentId NUMERIK
    // (kolom `agents.id` = serial). Paksa string numerik → number agar lolos validasi.
    if (typeof agentId === "string" && /^\d+$/.test(agentId)) {
      agentId = Number(agentId);
    }
    resolved.push({ role: sa?.role, agentId, description: sa?.description });
  }
  return resolved;
}

export async function applyChildren(
  agentId: string,
  children: ReturnType<typeof mapBlueprintToBuilder>["children"],
  storage: ConfigStorage,
  created: ConfigurationResult["created"],
  warnings: string[],
  /**
   * Mode ketat: bila true, kegagalan validasi/insert entitas anak DILEMPAR
   * (bukan jadi warning). Dipakai jalur ORGANISASI (Tahap 20) yang berjalan di
   * dalam transaksi — agar satu anak gagal me-rollback seluruh tim (atomik).
   * Default false menjaga perilaku best-effort single-agent (Tahap 4).
   */
  strict = false,
): Promise<void> {
  const fail = (msg: string) => {
    if (strict) throw new Error(msg);
    warnings.push(msg);
  };

  for (const kb of children.knowledgeBases) {
    const parsed = insertKnowledgeBaseSchema.safeParse({ ...kb, agentId });
    if (!parsed.success) {
      fail(`[knowledgeBase] "${kb.name ?? "?"}" invalid: ${formatZod(parsed.error)}`);
      continue;
    }
    try {
      await storage.createKnowledgeBase(parsed.data);
      created.knowledgeBases++;
    } catch (e) {
      fail(`[knowledgeBase] "${kb.name ?? "?"}" gagal: ${errMsg(e)}`);
    }
  }

  for (const app of children.miniApps) {
    const parsed = insertMiniAppSchema.safeParse({ ...app, agentId });
    if (!parsed.success) {
      fail(`[miniApp] "${app.name ?? "?"}" invalid: ${formatZod(parsed.error)}`);
      continue;
    }
    try {
      await storage.createMiniApp(parsed.data);
      created.miniApps++;
    } catch (e) {
      fail(`[miniApp] "${app.name ?? "?"}" gagal: ${errMsg(e)}`);
    }
  }

  for (const integ of children.integrations) {
    const parsed = insertIntegrationSchema.safeParse({ ...integ, agentId });
    if (!parsed.success) {
      fail(`[integration] "${integ.name ?? "?"}" invalid: ${formatZod(parsed.error)}`);
      continue;
    }
    try {
      await storage.createIntegration(parsed.data);
      created.integrations++;
    } catch (e) {
      fail(`[integration] "${integ.name ?? "?"}" gagal: ${errMsg(e)}`);
    }
  }

  for (const tpl of children.projectBrainTemplates) {
    const parsed = insertProjectBrainTemplateSchema.safeParse({ ...tpl, agentId });
    if (!parsed.success) {
      fail(`[projectBrainTemplate] "${tpl.name ?? "?"}" invalid: ${formatZod(parsed.error)}`);
      continue;
    }
    try {
      await storage.createProjectBrainTemplate(parsed.data);
      created.projectBrainTemplates++;
    } catch (e) {
      fail(`[projectBrainTemplate] "${tpl.name ?? "?"}" gagal: ${errMsg(e)}`);
    }
  }

  // Di-defer (tipe agentId tak kompatibel dengan agen ber-UUID string).
  if (children.vouchers.length > 0) {
    warnings.push(
      `[vouchers] ${children.vouchers.length} voucher di-defer (agentId numerik, butuh enricher fase lanjut)`,
    );
  }
  if (children.agenticDeliverables.length > 0) {
    warnings.push(
      `[agenticDeliverables] ${children.agenticDeliverables.length} item di-defer (agentId integer + dedupeKey unik)`,
    );
  }
}

function finalize(
  applied: boolean,
  dryRun: boolean,
  mode: "create" | "update",
  agentId: string | undefined,
  patch: Record<string, any>,
  created: ConfigurationResult["created"],
  warnings: string[],
): ConfigurationResult {
  return {
    applied,
    dryRun,
    mode,
    agentId,
    agentPatchKeys: Object.keys(patch),
    agentPatchPreview: buildPatchPreview(patch),
    created,
    warnings,
  };
}

/**
 * ALLOWLIST field yang AMAN ditampilkan di pratinjau klien.
 *
 * KEAMANAN: sengaja allowlist (bukan denylist) — kunci yang tidak dikenal
 * DIBUANG secara default. Ini mencegah kebocoran kredensial/endpoint sensitif
 * (mis. customApiKey, customBaseUrl, customModelName, accessToken) maupun field
 * baru di masa depan yang belum sempat ditinjau. Hanya field presentasional /
 * persona / parameter model yang masuk daftar ini.
 */
const PREVIEW_ALLOWLIST = new Set<string>([
  "name",
  "description",
  "avatar",
  "tagline",
  "philosophy",
  "chatStyle",
  "systemPrompt",
  "temperature",
  "maxTokens",
  "aiModel",
  "greetingMessage",
  "language",
  "category",
  "subcategory",
  "personality",
  "communicationStyle",
  "toneOfVoice",
  "responseFormat",
  "responseStyle",
  "behaviorPreset",
  "autonomyLevel",
  "responseDepth",
  "outputFormat",
  "interactionStyle",
  "contextualEmpathy",
]);

/**
 * buildPatchPreview — pratinjau JUJUR atas nilai yang akan ditulis, untuk
 * "review-before-create" di wizard.
 * - Hanya kunci di PREVIEW_ALLOWLIST (kunci tak dikenal dibuang → tak ada
 *   permukaan kebocoran).
 * - Hanya primitif (string/number/boolean) — array/objek dilewati (sudah
 *   tercermin di `created`/`agentPatchKeys`).
 * - String kosong/whitespace dilewati; string >200 char dipotong dengan "…".
 */
export function buildPatchPreview(patch: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!PREVIEW_ALLOWLIST.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      out[key] = trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = String(value);
    }
  }
  return out;
}

function formatZod(err: { issues: Array<{ path: (string | number)[]; message: string }> }): string {
  return err.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
