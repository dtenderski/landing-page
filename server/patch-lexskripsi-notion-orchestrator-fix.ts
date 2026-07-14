/**
 * patch-lexskripsi-notion-orchestrator-fix.ts
 * Fix: tambah AGENT-NOTION (1447) ke agenticSubAgents orchestrator (1362)
 */

import { db } from "./db";
import { agents as agentsTable, knowledgeBases } from "./db/schema";
import { eq, like } from "drizzle-orm";
import { storage } from "./storage";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-NOTION-ORCH-FIX-v1";
const AGENT_NOTION_ID = 1447;
const ORCHESTRATOR_ID = 1362;

export async function patchLexSkripsiNotionOrchFix(): Promise<{ done: boolean; skipped: boolean }> {
  const existing = await db.select().from(knowledgeBases)
    .where(like(knowledgeBases.name, `%${PATCH_MARKER}%`)).limit(1);
  if (existing.length > 0) {
    log("[Patch NOTION-ORCH-FIX] Sudah dijalankan, skip.");
    return { done: false, skipped: true };
  }

  log("[Patch NOTION-ORCH-FIX] Menambah AGENT-NOTION ke agenticSubAgents orchestrator...");

  const orch = await db.select({
    id: agentsTable.id,
    agenticSubAgents: agentsTable.agenticSubAgents,
  }).from(agentsTable).where(eq(agentsTable.id, ORCHESTRATOR_ID)).limit(1);

  if (orch.length === 0) {
    log("[Patch NOTION-ORCH-FIX] Orchestrator 1362 tidak ditemukan, skip.");
    return { done: false, skipped: true };
  }

  const currentSubAgents = (orch[0].agenticSubAgents as any[]) || [];
  const alreadyIn = currentSubAgents.some((s: any) => Number(s.agentId) === AGENT_NOTION_ID);

  if (!alreadyIn) {
    const newSubAgents = [
      ...currentSubAgents,
      {
        agentId: AGENT_NOTION_ID,
        role: "AGENT-NOTION",
        description: "Manajemen workspace Notion: simpan catatan bimbingan, buat database tracker bab, update progress, cari dokumen skripsi",
      },
    ];

    await db.update(agentsTable)
      .set({ agenticSubAgents: newSubAgents } as any)
      .where(eq(agentsTable.id, ORCHESTRATOR_ID));

    log(`[Patch NOTION-ORCH-FIX] ✅ Orchestrator (1362) — agenticSubAgents sekarang ${newSubAgents.length} sub-agent`);
  } else {
    log("[Patch NOTION-ORCH-FIX] AGENT-NOTION sudah ada di agenticSubAgents, skip.");
  }

  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. AGENT-NOTION (${AGENT_NOTION_ID}) ditambahkan ke orchestrator ${ORCHESTRATOR_ID}.`,
    description: "Patch marker otomatis",
    processingStatus: "completed",
    status: "active",
  } as any);

  log("[Patch NOTION-ORCH-FIX] SELESAI");
  return { done: true, skipped: false };
}
