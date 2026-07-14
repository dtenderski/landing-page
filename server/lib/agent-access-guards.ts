// Guard AKSES agen (mutasi / kepemilikan / chat-baca) — diekstrak dari routes.ts
// agar bisa diuji lewat request HTTP nyata (lihat tests/agent-access-guards-http.test.ts)
// SEKALIGUS dipakai apa adanya oleh route layer. Logika keputusan akhir tetap
// di fungsi murni server/lib/agent-authz.ts; modul ini hanya mengumpulkan input
// (userId sesi, status admin via DB role / ADMIN_USER_IDS, peran kolaborator).
//
// Dependensi disuntik (storage.getCollaboratorRole + getDbRole) supaya test bisa
// memakai MemStorage nyata tanpa DB/sesi, dan supaya route layer tetap memakai
// implementasi produksi yang sama persis.

import {
  decideAgentMutation,
  decideAgentReadAccess,
  type AgentAuthzResult,
  type CollaboratorRole,
} from "./agent-authz";

export interface AgentAccessGuardDeps {
  /** Lookup peran kolaborator (hasil tabel agent_collaborators), null bila bukan kolaborator. */
  getCollaboratorRole: (agentId: string, userId: string) => Promise<CollaboratorRole | null>;
  /** Role dari DB (mis. "admin"/"superadmin"/"") untuk req sesi. */
  getDbRole: (req: any) => Promise<string>;
  /** Override sumber admin id (default: env ADMIN_USER_IDS). Untuk test. */
  adminUserIds?: () => string[];
}

function userIdOf(req: any): string {
  // Kenali DUA jalur login: passport OIDC (req.user) DAN email-session
  // (req.session.emailUser). Route chat (/api/messages*) SENGAJA tanpa middleware
  // isAuthenticated (agar chat publik/anonim tetap jalan), jadi req.user TIDAK
  // terisi untuk user login-email — tanpa fallback ini guard salah balas 401.
  // Cermin pola rate-limiter (server/lib/rate-limiter.ts).
  return (
    (req?.user as any)?.claims?.sub ||
    (req?.user as any)?.id ||
    (req?.session as any)?.emailUser?.id ||
    ""
  );
}

function adminIdsFromEnv(): string[] {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
}

export interface AgentAccessGuards {
  assertCanMutateAgent: (req: any, agent: any) => Promise<AgentAuthzResult>;
  assertOwnerOrAdminAgent: (req: any, agent: any) => Promise<AgentAuthzResult>;
  assertCanAccessAgentChat: (req: any, agent: any) => Promise<AgentAuthzResult>;
}

export function makeAgentAccessGuards(deps: AgentAccessGuardDeps): AgentAccessGuards {
  const adminIds = deps.adminUserIds ?? adminIdsFromEnv;

  async function isAdminFor(req: any, userId: string): Promise<boolean> {
    // getDbRole hanya dipanggil bila ada userId (hindari query DB untuk anonim).
    const dbRole = userId ? await deps.getDbRole(req) : "";
    return dbRole === "admin" || dbRole === "superadmin" || adminIds().includes(userId);
  }

  // Mutasi KONFIGURASI agen: owner, admin, ATAU kolaborator Editor.
  async function assertCanMutateAgent(req: any, agent: any): Promise<AgentAuthzResult> {
    const userId = userIdOf(req);
    const isAdmin = await isAdminFor(req, userId);
    const agentOwnerId = (agent && agent.userId) || "";
    let collaboratorRole: CollaboratorRole | null = null;
    if (userId && !isAdmin && agentOwnerId && agentOwnerId !== userId && agent?.id != null) {
      collaboratorRole = await deps.getCollaboratorRole(String(agent.id), userId);
    }
    return decideAgentMutation({ userId, isAdmin, agentOwnerId, collaboratorRole });
  }

  // Aksi DESTRUKTIF/KEPEMILIKAN (delete, archive, toggle-enabled): HANYA owner/admin.
  // Peran kolaborator SENGAJA tidak di-lookup → Editor jatuh ke 403.
  async function assertOwnerOrAdminAgent(req: any, agent: any): Promise<AgentAuthzResult> {
    const userId = userIdOf(req);
    const isAdmin = await isAdminFor(req, userId);
    const agentOwnerId = (agent && agent.userId) || "";
    return decideAgentMutation({ userId, isAdmin, agentOwnerId, collaboratorRole: null });
  }

  // Akses BACA/CHAT. Menutup IDOR pada endpoint pesan:
  //   1) agent.isPublic                       → siapa pun (termasuk anonim/widget)
  //   2) privat & belum login                 → 401
  //   3) privat & agen sistem (tanpa pemilik)  → boleh (platform bersama; entitlement di UI)
  //   4) privat & ada pemilik                 → owner/admin/kolaborator (decideAgentReadAccess)
  async function assertCanAccessAgentChat(req: any, agent: any): Promise<AgentAuthzResult> {
    if (agent && agent.isPublic) return { ok: true };
    const userId = userIdOf(req);
    if (!userId) return { ok: false, status: 401, error: "Unauthorized" };
    const agentOwnerId = (agent && agent.userId) || "";
    if (!agentOwnerId) return { ok: true }; // agen sistem/seeded bersama
    const isAdmin = await isAdminFor(req, userId);
    let collaboratorRole: CollaboratorRole | null = null;
    if (!isAdmin && agentOwnerId !== userId && agent?.id != null) {
      collaboratorRole = await deps.getCollaboratorRole(String(agent.id), userId);
    }
    return decideAgentReadAccess({ userId, isAdmin, agentOwnerId, collaboratorRole });
  }

  return { assertCanMutateAgent, assertOwnerOrAdminAgent, assertCanAccessAgentChat };
}
