import { db } from "./db";
import { agents, knowledgeBases } from "./db/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(agents).where(inArray(agents.id, [1362,1363,1364,1365,1376]));
  rows.forEach((r: any) => {
    console.log("=== ID:", r.id, "|", r.name);
    console.log("  desc:", r.description ? r.description.substring(0,80) : "(EMPTY)");
    console.log("  maxTokens:", r.maxTokens, "| temp:", r.temperature, "| model:", r.model);
    console.log("  isOrchestrator:", r.isOrchestrator, "| isActive:", r.isActive, "| isPublic:", r.isPublic);
    console.log("  agenticSubAgents:", r.agenticSubAgents ? JSON.stringify(r.agenticSubAgents).substring(0,150) : "(EMPTY)");
    console.log("  welcomeMsg:", r.welcomeMessage ? r.welcomeMessage.substring(0,80) : "(EMPTY)");
    console.log("  fallback:", r.fallbackMessage ? r.fallbackMessage.substring(0,80) : "(EMPTY)");
    console.log("  suggestedQ:", r.suggestedQuestions ? JSON.stringify(r.suggestedQuestions).substring(0,150) : "(EMPTY)");
    console.log("  toolboxId:", r.toolboxId || "(EMPTY)");
  });

  const kbs = await db.select({ agentId: knowledgeBases.agentId, name: knowledgeBases.name, type: knowledgeBases.type })
    .from(knowledgeBases).where(inArray(knowledgeBases.agentId, ["1362","1363","1364","1365","1376"]));
  console.log("\n=== KB ENTRIES ===");
  kbs.forEach((k: any) => console.log(" KB", k.agentId, "|", k.type, "|", k.name.substring(0,70)));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
