/**
 * ============================================================================
 * MAPPING ENGINE — Tahap 3
 * ============================================================================
 *
 * Mengubah sebuah Blueprint (lihat shared/blueprint/blueprint-schema.ts) menjadi
 * RENCANA penulisan ke Builder:
 *   - `agentPatch`  : objek partial kolom tabel `agents` (set langsung).
 *   - `children`    : baris untuk tabel anak (knowledge_bases, mini_apps, dll.).
 *
 * PENTING — fungsi ini MURNI (pure):
 *   - TIDAK menyentuh DB / storage / Builder. Tidak ada efek samping.
 *   - Hanya menghasilkan struktur data. Penulisan sebenarnya adalah tugas
 *     Configuration Engine (Tahap 4) yang akan memakai output ini.
 *
 * Karena nama field Blueprint = nama kolom `agents`, mayoritas pemetaan bersifat
 * 1:1 (copy by key). Hanya modul ber-entitas-anak yang butuh logika khusus.
 * ============================================================================
 */

import {
  type Blueprint,
  type BlueprintModuleName,
  BLUEPRINT_MODULE_NAMES,
  MODULE_DATA_SCHEMAS,
} from "@shared/blueprint/blueprint-schema";

/* ===========================================================================
 * Tipe hasil mapping
 * ======================================================================== */

export interface MappedKnowledgeBase {
  name?: string;
  type?: string;
  content?: string;
  description?: string;
  sourceUrl?: string;
  sourceAuthority?: string;
  knowledgeLayer?: string;
  taxonomyId?: number;
  status?: string;
}

export interface MappedMiniApp {
  name?: string;
  type?: string;
  description?: string;
  icon?: string;
  config?: Record<string, any>;
}

export interface MappedIntegration {
  type?: string;
  name?: string;
  config?: Record<string, any>;
  isEnabled?: boolean;
}

export interface MappedProjectBrainTemplate {
  name?: string;
  description?: string;
  fields?: any[];
}

export interface MappedVoucher {
  code?: string;
  name?: string;
  type?: string;
  durationDays?: number;
  maxRedemptions?: number;
}

export interface MappedDeliverable {
  type?: string;
  title?: string;
  content?: Record<string, any>;
}

export interface MappedChildren {
  knowledgeBases: MappedKnowledgeBase[];
  miniApps: MappedMiniApp[];
  integrations: MappedIntegration[];
  projectBrainTemplates: MappedProjectBrainTemplate[];
  vouchers: MappedVoucher[];
  agenticDeliverables: MappedDeliverable[];
}

export interface MappingResult {
  /** Kolom tabel `agents` yang akan di-set. */
  agentPatch: Record<string, any>;
  /** Baris untuk tabel anak. */
  children: MappedChildren;
  /** Field yang dilewati / tidak dikenal (untuk audit). */
  warnings: string[];
  stats: {
    fieldsMapped: number;
    fieldsSkipped: number;
    childRows: number;
  };
}

export interface MappingOptions {
  /** Hanya petakan field dengan confidence >= nilai ini (default 0 = semua). */
  minConfidence?: number;
  /** Sertakan field yang ditandai needsConfirmation (default true). */
  includeNeedsConfirmation?: boolean;
}

/* ===========================================================================
 * Konfigurasi pemetaan
 * ======================================================================== */

/**
 * Key per-modul yang BUKAN kolom `agents` melainkan entitas anak — dikecualikan
 * dari `agentPatch` dan ditangani terpisah. Modul yang seluruhnya entitas anak
 * (miniApps, projectBrain, integration) tidak punya kolom `agents` sama sekali.
 */
const CHILD_KEYS: Partial<Record<BlueprintModuleName, Set<string>>> = {
  knowledge: new Set(["sources"]),
  monetization: new Set(["vouchers"]),
  deliverables: new Set(["items"]),
  miniApps: new Set(["apps"]),
  projectBrain: new Set(["templates", "instances"]),
  integration: new Set(["integrations"]),
};

/**
 * Modul yang SAMA SEKALI bukan bagian dari agen — tidak dipetakan ke kolom
 * `agents` maupun ke tabel anak. `reflection` adalah "peta pemahaman" pribadi
 * user (bahan Profil Penguasaan atas Topik), bukan konfigurasi agen. Dilewati
 * total agar field-nya tidak bocor menjadi kolom `agents` yang tak ada.
 */
const NON_AGENT_MODULES = new Set<BlueprintModuleName>(["reflection"]);

/* ===========================================================================
 * Mapping Engine
 * ======================================================================== */

export function mapBlueprintToBuilder(
  blueprint: Blueprint,
  options: MappingOptions = {},
): MappingResult {
  const minConfidence = options.minConfidence ?? 0;
  const includeNeedsConfirmation = options.includeNeedsConfirmation ?? true;

  const agentPatch: Record<string, any> = {};
  const children: MappedChildren = {
    knowledgeBases: [],
    miniApps: [],
    integrations: [],
    projectBrainTemplates: [],
    vouchers: [],
    agenticDeliverables: [],
  };
  const warnings: string[] = [];
  let fieldsMapped = 0;
  let fieldsSkipped = 0;

  for (const moduleName of BLUEPRINT_MODULE_NAMES) {
    if (NON_AGENT_MODULES.has(moduleName)) continue;
    const module = blueprint.modules[moduleName];
    if (!module) continue;
    const data = (module.data ?? {}) as Record<string, any>;
    const fieldMeta = module.fieldMeta ?? {};
    const allowedKeys = new Set(Object.keys(MODULE_DATA_SCHEMAS[moduleName].shape));
    const childKeys = CHILD_KEYS[moduleName];

    for (const key of Object.keys(data)) {
      const value = data[key];
      if (value === undefined || value === null) continue;

      // 1) Key tak dikenal di schema modul → drift/typo.
      if (!allowedKeys.has(key)) {
        warnings.push(`[${moduleName}] field tak dikenal di schema: "${key}" (dilewati)`);
        fieldsSkipped++;
        continue;
      }

      // 2) Entitas anak → tangani khusus (tidak masuk agentPatch).
      if (childKeys?.has(key)) {
        const before = countChildRows(children);
        routeChildEntity(moduleName, key, value, children, warnings);
        const added = countChildRows(children) - before;
        fieldsMapped += added > 0 ? 1 : 0;
        continue;
      }

      // 3) Gating confidence (hanya berlaku untuk field datar `agents`).
      const meta = fieldMeta[key];
      if (meta) {
        if (meta.confidence < minConfidence) {
          warnings.push(
            `[${moduleName}.${key}] confidence ${meta.confidence} < ${minConfidence} (dilewati)`,
          );
          fieldsSkipped++;
          continue;
        }
        if (meta.needsConfirmation && !includeNeedsConfirmation) {
          warnings.push(`[${moduleName}.${key}] needsConfirmation (dilewati)`);
          fieldsSkipped++;
          continue;
        }
      }

      // 4) Field datar → kolom `agents` bernama sama, kecuali transform khusus.
      agentPatch[key] = transformAgentValue(moduleName, key, value, warnings);
      fieldsMapped++;
    }
  }

  return {
    agentPatch,
    children,
    warnings,
    stats: { fieldsMapped, fieldsSkipped, childRows: countChildRows(children) },
  };
}

/* ===========================================================================
 * Helper
 * ======================================================================== */

function countChildRows(children: MappedChildren): number {
  return (
    children.knowledgeBases.length +
    children.miniApps.length +
    children.integrations.length +
    children.projectBrainTemplates.length +
    children.vouchers.length +
    children.agenticDeliverables.length
  );
}

/** Transform nilai untuk kolom `agents` tertentu (sebagian besar identitas). */
function transformAgentValue(
  moduleName: BlueprintModuleName,
  key: string,
  value: any,
  warnings: string[],
): any {
  // orchestration.agenticSubAgents → format jsonb agents: {role, agentId, description}
  if (moduleName === "orchestration" && key === "agenticSubAgents" && Array.isArray(value)) {
    return value.map((sa: any) => {
      if (sa && sa.agentId === undefined && sa.agentSlug) {
        warnings.push(
          `[orchestration.agenticSubAgents] sub-agen "${sa.role ?? "?"}" hanya punya agentSlug; agentId perlu diresolusi di Tahap 4`,
        );
      }
      return {
        role: sa?.role,
        agentId: sa?.agentId,
        ...(sa?.agentSlug ? { agentSlug: sa.agentSlug } : {}),
        description: sa?.description,
      };
    });
  }
  return value;
}

/** Arahkan nilai entitas-anak ke koleksi yang tepat. */
function routeChildEntity(
  moduleName: BlueprintModuleName,
  key: string,
  value: any,
  children: MappedChildren,
  warnings: string[],
): void {
  const arr = Array.isArray(value) ? value : [];

  if (moduleName === "knowledge" && key === "sources") {
    children.knowledgeBases.push(...arr.map(mapKnowledgeSource));
  } else if (moduleName === "miniApps" && key === "apps") {
    children.miniApps.push(...arr.map(mapMiniApp));
  } else if (moduleName === "integration" && key === "integrations") {
    children.integrations.push(...arr.map(mapIntegration));
  } else if (moduleName === "projectBrain" && key === "templates") {
    children.projectBrainTemplates.push(...arr.map(mapProjectBrainTemplate));
  } else if (moduleName === "projectBrain" && key === "instances") {
    // Instance values dipetakan saat penerapan (Tahap 4) setelah template dibuat.
    warnings.push(`[projectBrain.instances] ditunda ke Tahap 4 (butuh templateId hasil insert)`);
  } else if (moduleName === "monetization" && key === "vouchers") {
    children.vouchers.push(...arr.map(mapVoucher));
  } else if (moduleName === "deliverables" && key === "items") {
    children.agenticDeliverables.push(...arr.map(mapDeliverable));
  } else {
    warnings.push(`[${moduleName}.${key}] entitas anak tak ada handler (dilewati)`);
  }
}

function mapKnowledgeSource(s: any): MappedKnowledgeBase {
  return {
    name: s?.name,
    type: s?.type,
    content: s?.content,
    description: s?.description,
    sourceUrl: s?.sourceUrl,
    sourceAuthority: s?.sourceAuthority,
    knowledgeLayer: s?.knowledgeLayer,
    taxonomyId: s?.taxonomyId,
    status: s?.status,
  };
}

function mapMiniApp(a: any): MappedMiniApp {
  return { name: a?.name, type: a?.type, description: a?.description, icon: a?.icon, config: a?.config };
}

function mapIntegration(i: any): MappedIntegration {
  return { type: i?.type, name: i?.name, config: i?.config, isEnabled: i?.isEnabled };
}

function mapProjectBrainTemplate(t: any): MappedProjectBrainTemplate {
  return { name: t?.name, description: t?.description, fields: t?.fields };
}

function mapVoucher(v: any): MappedVoucher {
  return {
    code: v?.code,
    name: v?.name,
    type: v?.type,
    durationDays: v?.durationDays,
    maxRedemptions: v?.maxRedemptions,
  };
}

function mapDeliverable(d: any): MappedDeliverable {
  return { type: d?.type, title: d?.title, content: d?.content };
}
