/**
 * ============================================================================
 * ORGANIZATION MAPPING ENGINE — Tahap 19 (Fase 3: AI Organization)
 * ============================================================================
 *
 * Mengubah sebuah `OrganizationBlueprint` (Tahap 18) menjadi RENCANA pembuatan
 * sebuah TIM agen:
 *   - `members[]` : untuk tiap anggota, hasil `mapBlueprintToBuilder` (Tahap 3)
 *                   yaitu agentPatch + entitas anak — DIPAKAI ULANG, tanpa
 *                   menduplikasi logika single-agent.
 *   - `wiring[]`  : daftar sambungan orchestrator → sub-agen, MASIH dalam bentuk
 *                   `localId` (resolusi localId → agentId adalah tugas
 *                   Configuration Engine / Tahap 20, setelah agen dibuat).
 *
 * PENTING — fungsi ini MURNI (pure): TIDAK menyentuh DB/storage/Builder.
 *
 * KONTRAK SUMBER-KEBENARAN (wajib, sesuai desain Tahap 18):
 *   Sambungan antar-anggota HANYA berasal dari `structure.edges` level
 *   organisasi. Field linkage runtime di Blueprint anggota
 *   (`orchestration.agenticSubAgents`, `parentAgentId`, `meta.agentId`)
 *   DIBUANG di sini agar tidak ada dua sumber kebenaran. Pelanggaran dicatat
 *   sebagai warning.
 * ============================================================================
 */

import {
  type OrganizationBlueprint,
  type OrgMemberRole,
  lintOrganizationBlueprint,
} from "@shared/blueprint/organization-blueprint-schema";
import {
  mapBlueprintToBuilder,
  type MappingResult,
  type MappingOptions,
} from "./mapping-engine";

/* ===========================================================================
 * Tipe hasil
 * ======================================================================== */

/** Rencana satu anggota tim. */
export interface MappedOrgMember {
  localId: string;
  role: OrgMemberRole;
  title?: string;
  responsibility?: string;
  /** Hasil mapping single-agent (agentPatch + children). */
  mapping: MappingResult;
}

/** Satu sub-agen yang dipanggil orchestrator (masih by localId). */
export interface MappedWiringSubAgent {
  /** localId anggota sub-agen (di-resolve ke agentId pada Tahap 20). */
  localId: string;
  /** Kode peran yang akan ditulis ke agenticSubAgents (mis. "MARKETING"). */
  role?: string;
  description?: string;
}

/** Sambungan untuk satu orchestrator. */
export interface MappedWiring {
  orchestratorLocalId: string;
  subAgents: MappedWiringSubAgent[];
}

export interface OrganizationMappingResult {
  members: MappedOrgMember[];
  /** Sambungan orchestrator → sub-agen (by localId). */
  wiring: MappedWiring[];
  /** localId orchestrator puncak (titik masuk), bila ditentukan. */
  leadLocalId?: string;
  warnings: string[];
  stats: {
    memberCount: number;
    orchestratorCount: number;
    edgeCount: number;
    totalChildRows: number;
  };
}

/** Field di agentPatch anggota yang HARUS dibuang (wiring = otoritas org). */
const FORBIDDEN_MEMBER_PATCH_KEYS = ["agenticSubAgents", "parentAgentId"];

/* ===========================================================================
 * Engine
 * ======================================================================== */

export function mapOrganizationToBuilder(
  org: OrganizationBlueprint,
  options: MappingOptions = {},
): OrganizationMappingResult {
  const warnings: string[] = [];

  // 1) Tarik peringatan struktur dari lint skema (referensi menggantung, dll.).
  for (const w of lintOrganizationBlueprint(org)) {
    warnings.push(`[lint:${w.scope}${w.ref ? ":" + w.ref : ""}] ${w.message}`);
  }

  const knownIds = new Set(org.members.map((m) => m.localId));
  const roleById = new Map(org.members.map((m) => [m.localId, m.role] as const));

  // 2) Petakan tiap anggota lewat single-agent mapping engine (dipakai ulang).
  const members: MappedOrgMember[] = [];
  let totalChildRows = 0;
  let orchestratorCount = 0;

  for (const m of org.members) {
    const mapping = mapBlueprintToBuilder(m.blueprint, options);

    // Buang field wiring tingkat-anggota → otoritas ada di structure.edges.
    for (const key of FORBIDDEN_MEMBER_PATCH_KEYS) {
      if (key in mapping.agentPatch) {
        delete mapping.agentPatch[key];
        warnings.push(
          `[member:${m.localId}] "${key}" di agentPatch dibuang — wiring hanya dari structure.edges`,
        );
      }
    }

    // Peran adalah OTORITAS: selalu set isOrchestrator dari `m.role`, tidak
    // hanya untuk orchestrator. Tanpa ini, anggota specialist/support yang
    // membawa isOrchestrator:true di Blueprint-nya bisa lolos → sumber
    // kebenaran ganda untuk topologi tim.
    const isOrch = m.role === "orchestrator";
    if (!isOrch && mapping.agentPatch.isOrchestrator) {
      warnings.push(
        `[member:${m.localId}] isOrchestrator:true dipaksa false — peran "${m.role}" bukan orchestrator`,
      );
    }
    mapping.agentPatch.isOrchestrator = isOrch;
    if (isOrch) orchestratorCount++;

    totalChildRows += mapping.stats.childRows;
    members.push({
      localId: m.localId,
      role: m.role,
      title: m.title,
      responsibility: m.responsibility,
      mapping,
    });
  }

  // 3) Bangun wiring dari edges (otoritatif). Lewati edge yang menggantung /
  //    bukan-orchestrator (lint sudah memperingatkan); jaga determinisme.
  const wiringMap = new Map<string, MappedWiringSubAgent[]>();
  for (const e of org.structure.edges) {
    if (e.fromLocalId === e.toLocalId) continue; // self-edge: diabaikan
    if (!knownIds.has(e.fromLocalId) || !knownIds.has(e.toLocalId)) continue;
    if (roleById.get(e.fromLocalId) !== "orchestrator") continue;

    const list = wiringMap.get(e.fromLocalId) ?? [];
    if (list.some((s) => s.localId === e.toLocalId)) {
      warnings.push(
        `[wiring:${e.fromLocalId}] edge duplikat ke "${e.toLocalId}" (diabaikan)`,
      );
      continue;
    }
    list.push({ localId: e.toLocalId, role: e.role, description: e.description });
    wiringMap.set(e.fromLocalId, list);
  }

  const wiring: MappedWiring[] = Array.from(wiringMap.entries()).map(
    ([orchestratorLocalId, subAgents]) => ({ orchestratorLocalId, subAgents }),
  );

  // 4) Orchestrator tanpa sub-agen apa pun → kemungkinan desain belum lengkap.
  for (const m of org.members) {
    if (m.role === "orchestrator" && !wiringMap.has(m.localId)) {
      warnings.push(
        `[wiring:${m.localId}] orchestrator tanpa sub-agen (belum ada edge keluar)`,
      );
    }
  }

  return {
    members,
    wiring,
    leadLocalId: org.structure.leadLocalId,
    warnings,
    stats: {
      memberCount: org.members.length,
      orchestratorCount,
      edgeCount: org.structure.edges.length,
      totalChildRows,
    },
  };
}
