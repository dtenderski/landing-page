import { db } from "./db";
import { agents, toolboxes, series, bigIdeas } from "@shared/schema";
import { eq, isNull, and } from "drizzle-orm";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

export async function fixOrphanedOrchestrators() {
  const orphanedOrchestrators = await db
    .select()
    .from(agents)
    .where(and(eq(agents.isOrchestrator, true), isNull(agents.toolboxId)));

  if (orphanedOrchestrators.length === 0) {
    return;
  }

  log(`[Fix] Found ${orphanedOrchestrators.length} orphaned orchestrator agent(s), fixing...`);

  const allSeries = await db.select().from(series);

  for (const seriesRow of allSeries) {
    let existingHub = await db
      .select()
      .from(toolboxes)
      .where(and(eq(toolboxes.isOrchestrator, true), eq(toolboxes.seriesId, seriesRow.id)))
      .limit(1);

    let hubId: number;

    if (existingHub.length > 0) {
      hubId = existingHub[0].id;
    } else {
      const [newHub] = await db
        .insert(toolboxes)
        .values({
          name: `${seriesRow.name} HUB`,
          description: `Chatbot Orkestrator yang mengoordinasikan semua chatbot spesialis dalam ${seriesRow.name}.`,
          isOrchestrator: true,
          seriesId: seriesRow.id,
          bigIdeaId: null,
          isActive: true,
          sortOrder: 0,
          purpose: "",
          capabilities: [],
          limitations: [],
        })
        .returning();
      hubId = newHub.id;
      log(`[Fix] Created HUB toolbox "${newHub.name}" (id=${hubId}) for series "${seriesRow.name}"`);
    }

    const bigIdeasForSeries = await db
      .select({ id: bigIdeas.id })
      .from(bigIdeas)
      .where(eq(bigIdeas.seriesId, seriesRow.id));

    const bigIdeaIds = new Set(bigIdeasForSeries.map((bi) => bi.id));

    const hubAgents = await db
      .select()
      .from(agents)
      .where(and(eq(agents.isOrchestrator, true), eq(agents.toolboxId, hubId)));
    const hubAlreadyHasOrchestrator = hubAgents.length > 0;

    for (const agent of orphanedOrchestrators) {
      if (agent.bigIdeaId && bigIdeaIds.has(agent.bigIdeaId)) {
        if (hubAlreadyHasOrchestrator) {
          await db
            .update(agents)
            .set({ toolboxId: hubId, isOrchestrator: false, orchestratorRole: "standalone" })
            .where(eq(agents.id, agent.id));
          log(`[Fix] Linked orchestrator "${agent.name}" (id=${agent.id}) to HUB (id=${hubId}) as regular agent (max 1 orchestrator per HUB)`);
        } else {
          await db
            .update(agents)
            .set({ toolboxId: hubId })
            .where(eq(agents.id, agent.id));
          log(`[Fix] Linked orchestrator "${agent.name}" (id=${agent.id}) to HUB (id=${hubId})`);
        }
      }
    }
  }

  const stillOrphaned = await db
    .select()
    .from(agents)
    .where(and(eq(agents.isOrchestrator, true), isNull(agents.toolboxId)));

  for (const agent of stillOrphaned) {
    const firstSeries = await db.select().from(series).limit(1);
    if (firstSeries.length > 0) {
      const defaultHub = await db
        .select()
        .from(toolboxes)
        .where(and(eq(toolboxes.isOrchestrator, true), eq(toolboxes.seriesId, firstSeries[0].id)))
        .limit(1);

      if (defaultHub.length > 0) {
        await db
          .update(agents)
          .set({ toolboxId: defaultHub[0].id, isOrchestrator: false, orchestratorRole: "standalone" })
          .where(eq(agents.id, agent.id));
        log(`[Fix] Linked orphaned orchestrator "${agent.name}" (id=${agent.id}) to default HUB (id=${defaultHub[0].id}) as regular agent`);
      }
    }
  }

  log(`[Fix] Orphaned orchestrator fix complete`);

  await reactivateInactiveToolboxesAndAgents();
}

async function reactivateInactiveToolboxesAndAgents() {
  const inactiveToolboxes = await db
    .select({ id: toolboxes.id, name: toolboxes.name })
    .from(toolboxes)
    .where(eq(toolboxes.isActive, false));

  if (inactiveToolboxes.length === 0) return;

  let fixedTb = 0;
  let fixedAg = 0;

  for (const tb of inactiveToolboxes) {
    await db.update(toolboxes).set({ isActive: true }).where(eq(toolboxes.id, tb.id));
    fixedTb++;

    const inactiveAgents = await db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(and(eq(agents.toolboxId, tb.id), eq(agents.isActive, false)));

    for (const ag of inactiveAgents) {
      await db.update(agents).set({ isActive: true }).where(eq(agents.id, ag.id));
      fixedAg++;
    }
  }

  if (fixedTb > 0 || fixedAg > 0) {
    log(`[Fix] Reactivated ${fixedTb} toolbox(es) and ${fixedAg} agent(s)`);
  }
}
