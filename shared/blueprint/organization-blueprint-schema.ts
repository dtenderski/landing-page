/**
 * ============================================================================
 * GUSTAFTA ORGANIZATION BLUEPRINT SCHEMA — Tahap 18 (Fase 3: AI Organization)
 * ============================================================================
 *
 * "DNA" sebuah ORGANISASI AI: bukan satu agen, melainkan SEKUMPULAN agen yang
 * saling bekerja sama (orchestrator + spesialis) beserta struktur kolaborasinya.
 *
 * Sama seperti Tahap 2 (single-agent Blueprint), file ini MURNI ADITIF:
 *  - TIDAK mengubah `blueprint-schema.ts` — malah MEMAKAI ULANG `blueprintSchema`
 *    untuk tiap anggota, supaya tidak ada duplikasi definisi field.
 *  - BELUM tersambung ke Builder, DB, API, atau UI mana pun.
 *  - TIDAK diimpor oleh kode aplikasi apa pun pada tahap ini.
 *
 * Prinsip kunci (warisan filosofi Blueprint):
 *  - Partial by design — organisasi bisa dirancang bertahap lewat dialog.
 *  - Confidence, bukan Completion — tiap anggota membawa Blueprint-nya sendiri
 *    yang sudah punya metadata keyakinan per-field.
 *  - localId, BUKAN agentId — pada saat DESAIN, agen belum punya ID database.
 *    Anggota dirujuk lewat `localId` (stabil dalam satu blueprint); Configuration
 *    Engine (tahap lanjutan) yang akan menerjemahkan localId → agentId hasil
 *    pembuatan, lalu menulis edge kolaborasi ke `agenticSubAgents` tiap
 *    orchestrator. Ini menghindari masalah ayam-dan-telur (edge butuh agentId,
 *    agentId baru ada setelah agen dibuat).
 * ============================================================================
 */

import { z } from "zod";
import {
  blueprintSchema,
  createEmptyBlueprint,
  type Blueprint,
} from "./blueprint-schema";

/* ===========================================================================
 * 1. PERAN ANGGOTA dalam organisasi AI
 * ======================================================================== */

/** Peran sebuah anggota (seat) di dalam organisasi AI. */
export const orgMemberRoleSchema = z.enum([
  "orchestrator", // koordinator/ketua: memanggil & mensintesis anggota lain
  "specialist", // pekerja fokus pada satu domain
  "support", // pembantu (intake, FAQ, administrasi, dll.)
]);
export type OrgMemberRole = z.infer<typeof orgMemberRoleSchema>;

/* ===========================================================================
 * 2. ANGGOTA (memakai ulang single-agent Blueprint)
 * ======================================================================== */

/**
 * Satu "kursi" di organisasi. `blueprint` adalah DNA agen lengkap (Tahap 2),
 * dipakai ulang apa adanya sehingga seluruh field/metadata/confidence berlaku.
 */
export const orgMemberSchema = z.object({
  /** ID stabil dalam SATU blueprint (mis. "m1"); BUKAN ID database. */
  localId: z.string().min(1),
  role: orgMemberRoleSchema.default("specialist"),
  /** Label manusiawi untuk kursi ini, mis. "Agen Marketing". */
  title: z.string().optional(),
  /** Ringkasan tanggung jawab kursi (untuk dialog/critic). */
  responsibility: z.string().optional(),
  /** DNA agen anggota — Blueprint single-agent yang dipakai ulang. */
  blueprint: blueprintSchema,
});
export type OrgMember = z.infer<typeof orgMemberSchema>;

/* ===========================================================================
 * 3. STRUKTUR KOLABORASI (graf berarah orchestrator → sub-agen)
 * ======================================================================== */

/**
 * Edge kolaborasi berarah: `fromLocalId` (orchestrator) memanggil `toLocalId`
 * (sub-agen). Saat konfigurasi, edge ini menjadi entri `agenticSubAgents` pada
 * agen orchestrator setelah localId di-resolve ke agentId.
 */
export const orgCollaborationEdgeSchema = z.object({
  fromLocalId: z.string().min(1),
  toLocalId: z.string().min(1),
  /** Kode peran yang ditulis ke agenticSubAgents (mis. "MARKETING"). */
  role: z.string().optional(),
  description: z.string().optional(),
});
export type OrgCollaborationEdge = z.infer<typeof orgCollaborationEdgeSchema>;

export const orgStructureSchema = z.object({
  /** localId orchestrator puncak (titik masuk percakapan organisasi). */
  leadLocalId: z.string().optional(),
  edges: z.array(orgCollaborationEdgeSchema).default([]),
});
export type OrgStructure = z.infer<typeof orgStructureSchema>;

/* ===========================================================================
 * 4. META + BLUEPRINT ORGANISASI LENGKAP
 * ======================================================================== */

export const organizationMetaSchema = z.object({
  /** Versi skema, untuk migrasi forward-compatible. */
  schemaVersion: z.string().default("1.0.0"),
  organizationId: z.string().optional(),
  /** Diisi setelah Configuration Engine membuat agen: localId → agentId. */
  agentIds: z.record(z.string(), z.number().int()).optional(),
  name: z.string().optional(),
  /** Misi/Big Idea organisasi AI yang sedang dibangun. */
  mission: z.string().optional(),
  intent: z.string().optional(),
  status: z
    .enum(["draft", "in_dialogue", "ready", "applied", "evolving"])
    .default("draft"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type OrganizationMeta = z.infer<typeof organizationMetaSchema>;

export const organizationBlueprintSchema = z.object({
  meta: organizationMetaSchema,
  members: z.array(orgMemberSchema).default([]),
  structure: orgStructureSchema.default({ edges: [] }),
  /** Keyakinan keseluruhan organisasi (agregat antar-anggota + struktur). */
  overallConfidence: z.number().min(0).max(1).default(0),
});
export type OrganizationBlueprint = z.infer<typeof organizationBlueprintSchema>;

/* ===========================================================================
 * 5. HELPER — Organization Blueprint kosong
 * ======================================================================== */

/** Membuat OrganizationBlueprint kosong yang valid (tanpa anggota). */
export function createEmptyOrganizationBlueprint(
  intent?: string,
): OrganizationBlueprint {
  return organizationBlueprintSchema.parse({
    meta: { schemaVersion: "1.0.0", intent, status: "draft" },
    members: [],
    structure: { edges: [] },
    overallConfidence: 0,
  });
}

/**
 * Membuat satu anggota baru dengan Blueprint single-agent kosong.
 * `localId` HARUS unik dalam organisasi (lihat lint).
 */
export function createEmptyOrgMember(
  localId: string,
  role: OrgMemberRole = "specialist",
  title?: string,
): OrgMember {
  return orgMemberSchema.parse({
    localId,
    role,
    title,
    blueprint: createEmptyBlueprint(title),
  });
}

/* ===========================================================================
 * 6. LINT — validasi konsistensi struktur (cegah edge/lead menggantung)
 * ======================================================================== */

export interface OrganizationLintWarning {
  /** Lokasi masalah: "members" | "structure". */
  scope: "members" | "structure";
  /** localId / edge terkait bila ada. */
  ref?: string;
  message: string;
}

/**
 * Memeriksa konsistensi referensi dalam OrganizationBlueprint:
 *  - localId unik antar-anggota,
 *  - tiap edge merujuk localId anggota yang ADA,
 *  - `fromLocalId` sebuah edge harus anggota berperan "orchestrator",
 *  - tidak ada self-edge (from === to),
 *  - `leadLocalId` (bila diisi) merujuk anggota yang ada & berperan orchestrator.
 *
 * Mengembalikan daftar peringatan (kosong = bersih). Sengaja warning, bukan
 * throw, karena organisasi boleh partial selama dialog berlangsung.
 */
export function lintOrganizationBlueprint(
  org: OrganizationBlueprint,
): OrganizationLintWarning[] {
  const warnings: OrganizationLintWarning[] = [];

  // 6.1 localId unik
  const seen = new Set<string>();
  for (const m of org.members) {
    if (seen.has(m.localId)) {
      warnings.push({
        scope: "members",
        ref: m.localId,
        message: `localId anggota duplikat: "${m.localId}"`,
      });
    }
    seen.add(m.localId);
  }

  const byId = new Map(org.members.map((m) => [m.localId, m] as const));
  const isOrchestrator = (id: string) =>
    byId.get(id)?.role === "orchestrator";

  // 6.2 edges
  for (const e of org.structure.edges) {
    const tag = `${e.fromLocalId}→${e.toLocalId}`;
    if (e.fromLocalId === e.toLocalId) {
      warnings.push({
        scope: "structure",
        ref: tag,
        message: `edge self-reference: "${e.fromLocalId}" memanggil dirinya sendiri`,
      });
    }
    if (!byId.has(e.fromLocalId)) {
      warnings.push({
        scope: "structure",
        ref: tag,
        message: `edge fromLocalId tidak dikenal: "${e.fromLocalId}"`,
      });
    } else if (!isOrchestrator(e.fromLocalId)) {
      warnings.push({
        scope: "structure",
        ref: tag,
        message: `edge fromLocalId "${e.fromLocalId}" bukan orchestrator`,
      });
    }
    if (!byId.has(e.toLocalId)) {
      warnings.push({
        scope: "structure",
        ref: tag,
        message: `edge toLocalId tidak dikenal: "${e.toLocalId}"`,
      });
    }
  }

  // 6.3 lead
  const lead = org.structure.leadLocalId;
  if (lead) {
    if (!byId.has(lead)) {
      warnings.push({
        scope: "structure",
        ref: lead,
        message: `leadLocalId tidak dikenal: "${lead}"`,
      });
    } else if (!isOrchestrator(lead)) {
      warnings.push({
        scope: "structure",
        ref: lead,
        message: `leadLocalId "${lead}" bukan orchestrator`,
      });
    }
  }

  // 6.4 KONTRAK SUMBER-KEBENARAN: wiring antar-anggota HANYA boleh datang dari
  // `structure.edges` (level organisasi). Field linkage runtime di dalam
  // Blueprint anggota (agentId / agenticSubAgents / parentAgentId) menimbulkan
  // dua sumber kebenaran dan akan diabaikan/normalisasi oleh Mapping Engine
  // (Tahap 19). Peringatkan sejak desain agar authoring tetap bersih.
  for (const m of org.members) {
    const meta = m.blueprint?.meta;
    const orch = m.blueprint?.modules?.orchestration?.data;
    if (meta?.agentId != null) {
      warnings.push({
        scope: "members",
        ref: m.localId,
        message: `anggota "${m.localId}" menyetel blueprint.meta.agentId saat desain — abaikan; gunakan localId`,
      });
    }
    if (Array.isArray(orch?.agenticSubAgents) && orch.agenticSubAgents.length > 0) {
      warnings.push({
        scope: "members",
        ref: m.localId,
        message: `anggota "${m.localId}" menyetel orchestration.agenticSubAgents — wiring harus lewat structure.edges`,
      });
    }
    if (orch?.parentAgentId != null) {
      warnings.push({
        scope: "members",
        ref: m.localId,
        message: `anggota "${m.localId}" menyetel orchestration.parentAgentId — gunakan structure.edges`,
      });
    }
  }

  return warnings;
}

/* ===========================================================================
 * 7. HELPER turunan — daftar anggota per peran (untuk dialog/mapping nanti)
 * ======================================================================== */

/** Mengembalikan anggota orchestrator (lead diutamakan paling depan). */
export function getOrchestrators(org: OrganizationBlueprint): OrgMember[] {
  const orch = org.members.filter((m) => m.role === "orchestrator");
  const lead = org.structure.leadLocalId;
  if (!lead) return orch;
  return [...orch].sort((a, b) =>
    a.localId === lead ? -1 : b.localId === lead ? 1 : 0,
  );
}

/** Sub-anggota yang dipanggil oleh sebuah orchestrator (via edges). */
export function getSubMembers(
  org: OrganizationBlueprint,
  orchestratorLocalId: string,
): OrgMember[] {
  const ids = org.structure.edges
    .filter((e) => e.fromLocalId === orchestratorLocalId)
    .map((e) => e.toLocalId);
  return org.members.filter((m) => ids.includes(m.localId));
}

/** Re-export tipe single-agent untuk kemudahan konsumen organisasi. */
export type { Blueprint };
