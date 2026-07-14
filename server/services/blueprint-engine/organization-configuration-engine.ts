/**
 * ============================================================================
 * ORGANIZATION CONFIGURATION ENGINE — Tahap 20 (Fase 3: AI Organization)
 * ============================================================================
 *
 * Engine yang benar-benar MEWUJUDKAN sebuah tim agen dari `OrganizationBlueprint`.
 * Ia memakai rencana dari Organization Mapping Engine (Tahap 19) lalu menulis ke
 * Builder dalam DUA fase, di dalam SATU transaksi:
 *   Fase A — create tiap agen anggota (+ entitas anak), catat `localId → agentId`.
 *   Fase B — resolve `localId → agentId`, lalu set `isOrchestrator` + tulis
 *            `agenticSubAgents` (wiring) pada tiap orchestrator.
 *
 * PRINSIP & PELAJARAN (ditegaskan):
 *  - **Atomik wajib.** Membuat N agen harus all-or-nothing; tanpa transaksi,
 *    kegagalan di tengah meninggalkan organisasi parsial (sebagian agen tanpa
 *    pasangan/wiring). Karena itu penulisan nyata MENUNTUT `storage.runInTransaction`.
 *    Jika tidak tersedia → DIBATALKAN (bukan menulis parsial). `dryRun` tetap jalan.
 *  - **Stamp `ownerUserId` pada SETIAP agen.** `insertAgentSchema` tak punya field
 *    `userId` → safeParse membuangnya; tanpa suntik ulang, agen hilang dari
 *    dashboard pemilik & tak bisa di-"update". (Jebakan sama seperti single-agent.)
 *  - **`isOrchestrator` ditunda ke Fase B.** `insertAgentSchema` me-refine
 *    "orchestrator wajib bigIdeaId"; agen hasil blueprint biasanya belum punya
 *    bigIdeaId. Maka agen dibuat TANPA `isOrchestrator` (hindari refine), lalu
 *    di Fase B di-set via schema update parsial (tanpa refine) bersama wiring.
 *  - **Sumber-kebenaran wiring = `structure.edges`** (sudah dipaksa di Tahap 19);
 *    engine ini tidak pernah membaca linkage tingkat-anggota.
 *  - Belum dipanggil dari route mana pun — aditif, menunggu Tahap 21 (API/UI).
 * ============================================================================
 */

import {
  insertAgentSchema,
  agents,
  type Agent,
  type InsertAgent,
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import {
  type OrganizationBlueprint,
  type OrgMemberRole,
} from "@shared/blueprint/organization-blueprint-schema";
import { type MappingOptions } from "./mapping-engine";
import { mapOrganizationToBuilder } from "./organization-mapping-engine";
import {
  applyChildren,
  buildPatchPreview,
  type ConfigStorage,
} from "./configuration-engine";
import { storage as defaultStorage } from "../../storage";

/** Schema update parsial (tanpa refine orchestrator→bigIdeaId). */
const agentUpdateSchema = createInsertSchema(agents).partial();

/** orchestratorRole kolom `agents` per peran organisasi. */
const ROLE_TO_ORCHESTRATOR_ROLE: Record<OrgMemberRole, "orchestrator" | "specialist" | "standalone"> = {
  orchestrator: "orchestrator",
  specialist: "specialist",
  support: "standalone",
};

/* ===========================================================================
 * Tipe
 * ======================================================================== */

/** Storage org: ConfigStorage + transaksi atomik (wajib untuk penulisan nyata). */
export interface OrgConfigStorage extends ConfigStorage {
  /**
   * Jalankan `fn` dalam satu transaksi DB; bila `fn` melempar, SEMUA di-rollback.
   * `txStorage` adalah storage ber-scope transaksi (semua tulis lewat dia).
   */
  runInTransaction?<T>(fn: (txStorage: ConfigStorage) => Promise<T>): Promise<T>;
}

export interface OrganizationConfigurationOptions {
  /** Diisi ke SETIAP agen yang dibuat (kepemilikan). Sangat disarankan. */
  ownerUserId?: string;
  /** Opsi diteruskan ke Mapping Engine (confidence gating, dll.). */
  mapping?: MappingOptions;
  /** Kembalikan rencana tanpa menulis (default false). */
  dryRun?: boolean;
  /** Storage kustom (default: singleton aplikasi). */
  storage?: OrgConfigStorage;
}

export interface OrgMemberConfigResult {
  localId: string;
  role: OrgMemberRole;
  title?: string;
  agentId?: string;
  agentPatchKeys: string[];
  agentPatchPreview: Record<string, string>;
}

export interface OrgWiringConfigResult {
  orchestratorLocalId: string;
  orchestratorAgentId?: string;
  subAgentCount: number;
}

export interface OrganizationConfigurationResult {
  applied: boolean;
  dryRun: boolean;
  /** true bila ditulis di dalam transaksi atomik. */
  atomic: boolean;
  organizationName?: string;
  members: OrgMemberConfigResult[];
  /** Peta localId → agentId hasil pembuatan (kosong saat dryRun/batal). */
  idMap: Record<string, string>;
  wiring: OrgWiringConfigResult[];
  created: {
    agents: number;
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

export async function applyOrganizationToBuilder(
  org: OrganizationBlueprint,
  options: OrganizationConfigurationOptions = {},
): Promise<OrganizationConfigurationResult> {
  const storage = options.storage ?? (defaultStorage as OrgConfigStorage);
  const dryRun = options.dryRun ?? false;

  const plan = mapOrganizationToBuilder(org, options.mapping);
  const warnings = [...plan.warnings];
  const created = { agents: 0, knowledgeBases: 0, miniApps: 0, integrations: 0, projectBrainTemplates: 0 };

  // 1) Validasi SEMUA patch agen lebih dulu (validate-all-before-write). Bila ada
  //    yang invalid, batalkan SELURUH organisasi — jangan menulis sebagian.
  const prepared: Array<{
    localId: string;
    role: OrgMemberRole;
    title?: string;
    createPatch: InsertAgent;
    children: (typeof plan.members)[number]["mapping"]["children"];
    deferOrchestrator: boolean;
    patchKeys: string[];
    preview: Record<string, string>;
  }> = [];
  let anyInvalid = false;

  for (const m of plan.members) {
    const patch = m.mapping.agentPatch;
    const preview = buildPatchPreview(patch);
    const patchKeys = Object.keys(patch);

    // Tunda isOrchestrator (refine wajib bigIdeaId) → buat tanpa flag, set di Fase B.
    const deferOrchestrator = patch.isOrchestrator === true;
    const createCandidate: Record<string, any> = { ...patch };
    if (deferOrchestrator) {
      delete createCandidate.isOrchestrator;
      if (!patch.bigIdeaId) {
        warnings.push(
          `[member:${m.localId}] orchestrator tanpa bigIdeaId — isOrchestrator di-set saat wiring (Fase B)`,
        );
      }
    }

    const parsed = insertAgentSchema.safeParse(createCandidate);
    if (!parsed.success) {
      anyInvalid = true;
      warnings.push(
        `[member:${m.localId}] patch agen tidak valid: ${formatZod(parsed.error)}`,
      );
      prepared.push({
        localId: m.localId, role: m.role, title: m.title,
        createPatch: createCandidate as InsertAgent, children: m.mapping.children,
        deferOrchestrator, patchKeys, preview,
      });
      continue;
    }
    prepared.push({
      localId: m.localId, role: m.role, title: m.title,
      createPatch: parsed.data, children: m.mapping.children,
      deferOrchestrator, patchKeys, preview,
    });
  }

  const memberResults: OrgMemberConfigResult[] = prepared.map((p) => ({
    localId: p.localId, role: p.role, title: p.title,
    agentPatchKeys: p.patchKeys, agentPatchPreview: p.preview,
  }));

  const baseResult = (): OrganizationConfigurationResult => ({
    applied: false,
    dryRun,
    atomic: false,
    organizationName: org.meta.name,
    members: memberResults,
    idMap: {},
    wiring: [],
    created,
    warnings,
  });

  // 2) dryRun → kembalikan rencana + pratinjau, tanpa menulis.
  if (dryRun) {
    return baseResult();
  }

  // 3) Ada patch invalid → batalkan seluruh organisasi (tak ada tulisan).
  if (anyInvalid) {
    warnings.push(`[org] dibatalkan: ada anggota dengan patch tidak valid (tidak ada yang ditulis)`);
    return baseResult();
  }

  // 4) Atomik wajib untuk penulisan nyata.
  if (!storage.runInTransaction) {
    warnings.push(
      `[org] storage tidak mendukung transaksi atomik — penulisan dibatalkan. Gunakan dryRun atau sediakan runInTransaction.`,
    );
    return baseResult();
  }

  // 5) Materialisasi atomik.
  try {
    const tx = await storage.runInTransaction(async (s) => {
      const idMap: Record<string, string> = {};

      // Fase A — create tiap agen + entitas anak.
      for (const p of prepared) {
        const toCreate = options.ownerUserId
          ? ({ ...p.createPatch, userId: options.ownerUserId } as InsertAgent)
          : p.createPatch;
        const agent = await s.createAgent(toCreate);
        const agentId = String(agent.id);
        idMap[p.localId] = agentId;
        created.agents++;
        // strict=true: kegagalan anak melempar → rollback seluruh tim (atomik).
        await applyChildren(agentId, p.children, s, created, warnings, true);
      }

      // Fase B — set isOrchestrator + wiring pada tiap orchestrator.
      const wiringByOrch = new Map(plan.wiring.map((w) => [w.orchestratorLocalId, w.subAgents]));
      const wiringResults: OrgWiringConfigResult[] = [];

      for (const p of prepared) {
        if (p.role !== "orchestrator") continue;
        const orchAgentId = idMap[p.localId];
        const subs = wiringByOrch.get(p.localId) ?? [];

        const agenticSubAgents = subs
          .map((sa) => {
            const subAgentId = idMap[sa.localId];
            if (!subAgentId) {
              warnings.push(
                `[wiring:${p.localId}] sub-agen "${sa.localId}" tak punya agentId (dilewati)`,
              );
              return null;
            }
            return { role: sa.role, agentId: toNumericId(subAgentId), description: sa.description };
          })
          .filter((x): x is { role: any; agentId: any; description: any } => x !== null);

        const updatePatch = agentUpdateSchema.safeParse({
          isOrchestrator: true,
          orchestratorRole: ROLE_TO_ORCHESTRATOR_ROLE.orchestrator,
          agenticSubAgents,
        });
        if (!updatePatch.success) {
          // Lempar → rollback seluruh transaksi (atomik).
          throw new Error(
            `wiring orchestrator "${p.localId}" tidak valid: ${formatZod(updatePatch.error)}`,
          );
        }
        const updated = await s.updateAgent(orchAgentId, updatePatch.data as Partial<InsertAgent>);
        if (!updated) {
          throw new Error(`orchestrator "${p.localId}" (agentId ${orchAgentId}) tidak ditemukan saat wiring`);
        }
        wiringResults.push({
          orchestratorLocalId: p.localId,
          orchestratorAgentId: orchAgentId,
          subAgentCount: agenticSubAgents.length,
        });
      }

      return { idMap, wiringResults };
    });

    return {
      applied: true,
      dryRun: false,
      atomic: true,
      organizationName: org.meta.name,
      members: memberResults.map((mr) => ({ ...mr, agentId: tx.idMap[mr.localId] })),
      idMap: tx.idMap,
      wiring: tx.wiringResults,
      created,
      warnings,
    };
  } catch (e) {
    warnings.push(`[org] materialisasi gagal & di-rollback (tidak ada agen tersisa): ${errMsg(e)}`);
    // created counter mungkin sempat naik di memori; reset agar jujur (DB sudah rollback).
    created.agents = 0;
    created.knowledgeBases = 0;
    created.miniApps = 0;
    created.integrations = 0;
    created.projectBrainTemplates = 0;
    return baseResult();
  }
}

/* ===========================================================================
 * Helper
 * ======================================================================== */

/** agenticSubAgents.agentId wajib numerik (kolom agents.id = serial). */
function toNumericId(id: string): number | string {
  return /^\d+$/.test(id) ? Number(id) : id;
}

function formatZod(err: { issues: Array<{ path: (string | number)[]; message: string }> }): string {
  return err.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
