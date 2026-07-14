import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

const SKK_ORCHESTRATOR_CONFIG = {
  enabled: true,
  routingModel: "deepseek-chat",
  specialists: {
    skk_sbu: {
      enabled: true,
      name: "SKK Coach Sertifikasi",
      prompt: "Kamu adalah spesialis persiapan SKK (Sertifikat Kompetensi Kerja). Fokus pada: katalog jabatan SKKNI/SKKK, jenjang KKNI 1-9, rekomendasi level berdasarkan pengalaman, asesmen mandiri, studi kasus lapangan, dan simulasi wawancara asesor. Berikan jawaban berbasis data SKK/SKKNI resmi.",
    },
    umum: {
      enabled: true,
      name: "SKK Coach Navigator",
      prompt: "Kamu adalah navigator utama SKK Coach. Bantu pengguna menemukan subklasifikasi yang tepat, rekomendasikan jabatan SKK berdasarkan bidang kerja dan pengalaman, dan arahkan ke modul spesifik yang dibutuhkan.",
    },
  },
};

const ORCHESTRATOR_ROUTING_APPENDIX = `

═══════════════════════════════════════
## ORCHESTRATOR ROUTING PROTOCOL (v2)
═══════════════════════════════════════

Kamu adalah ORCHESTRATOR utama ekosistem SKK Coach. Peran utamamu:

1. **TRIAGE CEPAT** — Identifikasi bidang + pengalaman pengguna dalam 1-2 pertanyaan
2. **ROUTING KE MODUL** — Arahkan ke BigIdea yang tepat berdasarkan keyword bidang
3. **HANDOFF KONTEKS** — Sebelum menyerahkan ke modul, ringkas: bidang + pengalaman + tujuan pengguna
4. **FALLBACK** — Jika bidang tidak jelas, tampilkan menu utama dengan nomor pilihan

PROTOKOL HANDOFF:
"Oke, berdasarkan bidang [BIDANG] dengan pengalaman [X tahun], saya akan bantu di modul [NAMA_MODUL].
Di sana kamu bisa cek katalog jabatan, asesmen mandiri, dan simulasi wawancara.
Silakan lanjutkan dengan pertanyaan lebih spesifik!"

GOVERNANCE ORCHESTRATOR:
- Jangan menjawab detail teknis sebelum triage selesai
- Selalu konfirmasi bidang + jenjang KKNI target sebelum memberikan detail
- Jika pengguna sudah jelas: langsung berikan rekomendasi tanpa tanya berlebihan`;

export async function patchSkkOrchestratorHub(): Promise<{ updatedAgents: number; updatedToolboxes: number; skipped: number }> {
  let updatedAgents = 0;
  let updatedToolboxes = 0;
  let skipped = 0;

  try {
    // ─── STEP 1: Patch HUB Toolboxes (isOrchestrator = true) ───
    // The sidebar reads isOrchestrator from Toolbox, not Agent.
    // HUB toolboxes have name starting with "HUB SKK Coach" and bigIdeaId = null/empty.
    const allToolboxes = await storage.getToolboxes();
    for (const toolbox of allToolboxes) {
      if (!toolbox.name.startsWith("HUB SKK Coach")) continue;

      if (toolbox.isOrchestrator) {
        skipped++;
        continue;
      }

      await storage.updateToolbox(toolbox.id, {
        isOrchestrator: true,
      } as any);

      log(`[Patch SKK Orchestrator] 🗂️  Toolbox: ${toolbox.name} → isOrchestrator=true`);
      updatedToolboxes++;
    }

    // ─── STEP 2: Patch HUB Agents (isOrchestrator + orchestratorConfig) ───
    // The Agentic AI Panel reads orchestratorConfig from the active Agent.
    const allAgents = await storage.getAgents();
    for (const agent of allAgents) {
      if (!agent.name.startsWith("HUB SKK Coach")) continue;

      if (agent.isOrchestrator && agent.agenticMode && (agent as any).orchestratorConfig?.enabled) {
        skipped++;
        continue;
      }

      const enrichedSystemPrompt =
        agent.systemPrompt && agent.systemPrompt.includes("ORCHESTRATOR ROUTING PROTOCOL")
          ? agent.systemPrompt
          : (agent.systemPrompt || "") + ORCHESTRATOR_ROUTING_APPENDIX;

      await storage.updateAgent(agent.id, {
        isOrchestrator: true,
        orchestratorRole: "lead",
        agenticMode: true,
        orchestratorConfig: SKK_ORCHESTRATOR_CONFIG as any,
        systemPrompt: enrichedSystemPrompt,
        domainCharter:
          "Navigator utama SKK Coach — melakukan triage bidang/pengalaman, routing ke modul subklasifikasi yang tepat, dan memandu persiapan SKK/SKKNI dari KKNI 1 hingga 9." as any,
        multiStepReasoning: true,
        proactiveAssistance: true,
        attentiveListening: true,
      } as any);

      log(`[Patch SKK Orchestrator] 🤖 Agent: ${agent.name} → isOrchestrator=true, orchestratorConfig.enabled=true`);
      updatedAgents++;
    }

    log(
      `[Patch SKK Orchestrator] SELESAI — Toolboxes: ${updatedToolboxes}, Agents: ${updatedAgents}, Skipped: ${skipped}`
    );
  } catch (err) {
    log(`[Patch SKK Orchestrator] ERROR: ${(err as Error).message}`);
  }

  return { updatedAgents, updatedToolboxes, skipped };
}
