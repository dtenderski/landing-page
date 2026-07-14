// Logika keputusan otorisasi MUTASI agen — murni (pure), tanpa akses DB/req,
// supaya bisa diuji menyeluruh (owner/admin/non-owner/agen-sistem/anonim).
//
// Pemanggil (route layer) bertanggung jawab menghitung `userId`, `isAdmin`
// (via DB role / ADMIN_USER_IDS), dan `agentOwnerId`, lalu menyerahkan
// keputusan akhir ke sini. Urutan cabang TIDAK boleh diubah:
//   1) belum login        → 401
//   2) admin              → boleh (apa pun, termasuk agen sistem/orang lain)
//   3) agen sistem (tanpa pemilik) & bukan admin → 403 admin-only
//   4) bukan pemilik      → 403
//   5) pemilik            → boleh

export type AgentAuthzResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Peran kolaborator yang di-share ke user (selain pemilik/admin). */
export type CollaboratorRole = "editor" | "viewer";

export interface AgentMutationContext {
  /** ID user dari sesi; string kosong berarti belum login. */
  userId: string;
  /** Sudah dihitung pemanggil dari DB role + ADMIN_USER_IDS. */
  isAdmin: boolean;
  /** Pemilik agen target; string kosong = agen sistem/seeded tanpa pemilik. */
  agentOwnerId: string;
  /**
   * Peran kolaborasi user pada agen ini (hasil lookup tabel agent_collaborators),
   * atau null/undefined bila user bukan kolaborator. Editor boleh memutasi
   * KONFIGURASI agen (mengikuti owner); viewer hanya boleh baca.
   */
  collaboratorRole?: CollaboratorRole | null;
}

export function decideAgentMutation(ctx: AgentMutationContext): AgentAuthzResult {
  const { userId, isAdmin, agentOwnerId, collaboratorRole } = ctx;

  // 1) Belum login — diprioritaskan di atas segalanya (defense-in-depth:
  //    tanpa identitas, klaim admin pun tidak dipercaya).
  if (!userId) return { ok: false, status: 401, error: "Unauthorized" };

  // 2) Admin boleh memutasi agen mana pun.
  if (isAdmin) return { ok: true };

  // 3) Agen sistem/seeded (tanpa pemilik) hanya boleh diubah admin.
  if (!agentOwnerId) {
    return { ok: false, status: 403, error: "Forbidden: agen sistem hanya bisa diubah admin" };
  }

  // 4) Pemilik agen.
  if (agentOwnerId === userId) return { ok: true };

  // 5) Kolaborator Editor — boleh memutasi konfigurasi (bukan pemilik tetapi
  //    diberi hak edit eksplisit). Viewer TIDAK lolos (jatuh ke 403 di bawah).
  if (collaboratorRole === "editor") return { ok: true };

  // 6) Bukan pemilik, bukan editor.
  return { ok: false, status: 403, error: "Forbidden: bukan pemilik agen" };
}

export interface AgentReadContext {
  /** ID user dari sesi; string kosong berarti belum login. */
  userId: string;
  /** Sudah dihitung pemanggil dari DB role + ADMIN_USER_IDS. */
  isAdmin: boolean;
  /** Pemilik agen target; string kosong = agen sistem/seeded tanpa pemilik. */
  agentOwnerId: string;
  /** Peran kolaborasi user pada agen ini, atau null bila bukan kolaborator. */
  collaboratorRole?: CollaboratorRole | null;
}

/**
 * Keputusan AKSES BACA konfigurasi privat agen (lihat detail di builder).
 * Owner, admin, dan kolaborator (editor ATAU viewer) boleh membaca. Agen sistem
 * (tanpa pemilik) hanya boleh dibaca admin. Konten sensitif tetap disanitasi di
 * route layer untuk non-admin.
 */
export function decideAgentReadAccess(ctx: AgentReadContext): AgentAuthzResult {
  const { userId, isAdmin, agentOwnerId, collaboratorRole } = ctx;

  if (!userId) return { ok: false, status: 401, error: "Unauthorized" };
  if (isAdmin) return { ok: true };
  if (!agentOwnerId) {
    return { ok: false, status: 403, error: "Forbidden: agen sistem hanya bisa dibuka admin" };
  }
  if (agentOwnerId === userId) return { ok: true };
  if (collaboratorRole === "editor" || collaboratorRole === "viewer") return { ok: true };
  return { ok: false, status: 403, error: "Forbidden" };
}

export interface SubAgentInvocationContext {
  /**
   * Pemilik orkestrator PEMANGGIL:
   *  - `undefined` → konteks server tepercaya (mis. pipeline marketing terjadwal) → lewati cek.
   *  - `null`/"" → orkestrator sistem tanpa pemilik.
   *  - string → user pemilik orkestrator.
   */
  callerOwnerId?: string | null;
  /** Pemilik sub-agen target; null/"" = agen sistem/bersama (divisi siap-jual). */
  subAgentOwnerId?: string | null;
  /** Apakah sub-agen publik. */
  subAgentIsPublic?: boolean | null;
}

/**
 * Keputusan INTER-AGEN: bolehkah orkestrator memanggil sebuah sub-agen?
 * Mencegah orkestrator milik satu user memanggil agen PRIVAT milik user lain
 * (IDOR: kebocoran perilaku + Basis Pengetahuan + biaya token). Izinkan bila:
 *   1) konteks server tepercaya (callerOwnerId === undefined), ATAU
 *   2) sub-agen sistem/bersama tanpa pemilik (divisi siap-jual tetap bisa dipanggil
 *      salinan pembeli — model jual tidak rusak), ATAU
 *   3) sub-agen publik, ATAU
 *   4) pemilik sub-agen == pemilik orkestrator (creator merangkai timnya sendiri).
 */
export function canInvokeSubAgent(ctx: SubAgentInvocationContext): boolean {
  const { callerOwnerId, subAgentOwnerId, subAgentIsPublic } = ctx;
  if (callerOwnerId === undefined) return true;
  if (!subAgentOwnerId) return true;
  if (subAgentIsPublic === true) return true;
  return subAgentOwnerId === callerOwnerId;
}
