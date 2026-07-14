import { storage } from "./storage";
import { LEGAL_AGENTS, LEX_ORCHESTRATOR_PROMPT, LEX_ORCHESTRATOR_GREETING } from "./lib/legal-agents";

const log = (msg: string) => console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const SERIES_NAME = "LexCom — AI Hukum Indonesia";
const SERIES_SLUG = "lexcom-ai-hukum-indonesia";

const BIGIDEAS = [
  {
    key: "pidana-perdata-litigasi",
    name: "Hukum Pidana, Perdata & Litigasi",
    type: "problem",
    description: "Domain hukum fundamental: analisis tindak pidana (KUHP 2023), sengketa perdata & wanprestasi (KUHPerdata), strategi beracara di pengadilan, serta HAM & perlindungan konsumen.",
    agentIds: ["pidana", "perdata", "litigasi", "ham"],
    sortOrder: 1,
  },
  {
    key: "bisnis-korporasi-pajak",
    name: "Hukum Bisnis, Korporasi & Pajak",
    type: "solution",
    description: "Domain hukum bisnis: korporasi (UUPT), pasar modal & OJK, ketenagakerjaan (UU Cipta Kerja), pertanahan (BPN/UUPA), perpajakan (DJP/UU HPP), dan kepailitan/PKPU.",
    agentIds: ["korporasi", "pasarmodal", "ketenagakerjaan", "pertanahan", "pajak", "kepailitan"],
    sortOrder: 2,
  },
  {
    key: "riset-drafting-digital",
    name: "Riset Hukum, Drafting & Hukum Digital",
    type: "process",
    description: "Domain lanjutan: riset yurisprudensi MA/MK, legal drafting kontrak & dokumen hukum, serta hukum digital (UU PDP, fintech, HKI, e-commerce).",
    agentIds: ["yurisprudensi", "drafter", "multiclaw", "openclaw"],
    sortOrder: 3,
  },
  {
    key: "keluarga-hki-imigrasi",
    name: "Hukum Keluarga, HKI & Imigrasi",
    type: "bigidea",
    description: "Tiga domain khusus: hukum keluarga & waris (perkawinan, perceraian, waris BW/KHI), hak kekayaan intelektual (merek, paten, hak cipta), dan imigrasi & kewarganegaraan (visa, KITAS/KITAP, TKA).",
    agentIds: ["keluarga", "hki", "imigrasi"],
    sortOrder: 4,
  },
];

export async function seedLexComInSeries(userId: string, seriesId: string): Promise<{ created: number; skipped: boolean }> {
  const allBigIdeas = await storage.getBigIdeas();
  const existingInSeries = allBigIdeas.filter((bi: any) => String(bi.seriesId) === String(seriesId));
  const alreadySeeded = existingInSeries.some((bi: any) =>
    bi.name === "LEX-ORCHESTRATOR — Hub 17 Spesialis Hukum" ||
    bi.name === "LEX-ORCHESTRATOR — Hub 12 Spesialis Hukum"
  );
  if (alreadySeeded) {
    log("[Seed LexCom] Ekosistem LexCom sudah ada di series ini, skip.");
    return { created: 0, skipped: true };
  }

  log("[Seed LexCom] Membuat ekosistem LexCom di series yang dipilih...");

  let totalCreated = 0;

  // ── HUB: LEX-ORCHESTRATOR BigIdea + Toolbox + Agent ────────────────────────
  const hubBigIdea = await storage.createBigIdea({
    seriesId: parseInt(seriesId),
    name: "LEX-ORCHESTRATOR — Hub 17 Spesialis Hukum",
    type: "solution",
    description:
      "Hub utama LexCom. LEX-ORCHESTRATOR (persona: Lex) menerima pertanyaan hukum, mendeteksi domain, merutekan ke agen spesialis yang tepat, dan mengkomposisi respons terstruktur format IRAC+ dengan sitasi pasal.",
    goals: [
      "Routing otomatis ke 17 agen spesialis berdasarkan domain pertanyaan",
      "Deteksi user tier (T1 awam / T2 korporat / T3 profesional) dan sesuaikan kedalaman jawaban",
      "Menjamin format IRAC+ konsisten di seluruh respons",
      "Sitasi pasal eksplisit [UU No.X/Tahun, Pasal Y] di setiap analisis",
    ],
    targetAudience: "Individu, profesional hukum, korporat, dan instansi yang membutuhkan riset hukum Indonesia",
    expectedOutcome: "Pengguna mendapat analisis hukum terstruktur dengan sitasi regulasi yang tepat, dalam bahasa yang sesuai level keahlian mereka",
    sortOrder: 0,
    isActive: true,
  } as any);

  const hubToolbox = await storage.createToolbox({
    bigIdeaId: hubBigIdea.id,
    seriesId: parseInt(seriesId),
    name: "LEX-ORCHESTRATOR — Pintu Masuk LexCom",
    description: "Orchestrator utama LexCom. Mendeteksi domain hukum, merutekan ke 17 spesialis, menjaga konteks percakapan, dan menjamin format IRAC+ di setiap respons.",
    isOrchestrator: true,
    isActive: true,
    sortOrder: 0,
    purpose: "Routing intent hukum & manajemen konteks percakapan multi-agent",
    capabilities: [
      "Klasifikasi domain dari 12 cabang hukum Indonesia",
      "Deteksi user tier T1/T2/T3 untuk kedalaman jawaban adaptif",
      "Routing ke agen spesialis dengan weighted scoring",
      "Komposisi respons format IRAC+ dengan sitasi pasal",
      "Disclaimer otomatis di setiap respons",
    ],
    limitations: [
      "Tidak menggantikan saran advokat berlisensi untuk kasus konkret",
      "Tidak mewakili klien di pengadilan",
    ],
  } as any);
  totalCreated++;

  await storage.createAgent({
    userId,
    toolboxId: parseInt(hubToolbox.id),
    name: "LEX-ORCHESTRATOR",
    description: "Lex — orchestrator 17 spesialis hukum Indonesia. Routing otomatis, format IRAC+, tier-adaptive.",
    tagline: "Routing otomatis ke 17 spesialis hukum — pidana, perdata, korporasi & lebih.",
    category: "legal",
    subcategory: "orchestrator",
    isPublic: true,
    isOrchestrator: true,
    aiModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 3500,
    systemPrompt: LEX_ORCHESTRATOR_PROMPT,
    greetingMessage: LEX_ORCHESTRATOR_GREETING,
    conversationStarters: [
      "Saya kena somasi atas wanprestasi kontrak — apa langkah saya?",
      "Bantu saya analisis risiko hukum sebelum tanda tangan MoU dengan vendor.",
      "Tolong cari yurisprudensi MA tentang PMH terkait kebocoran data pribadi.",
      "Saya butuh draft gugatan perdata wanprestasi senilai Rp 500 juta.",
    ],
    personality: "Profesional, akurat, terstruktur, adaptif terhadap level keahlian pengguna",
    communicationStyle: "formal",
    toneOfVoice: "professional",
    language: "id",
    widgetColor: "#7c3aed",
    widgetPosition: "bottom-right",
    widgetSize: "large",
    widgetBorderRadius: "rounded",
    widgetShowBranding: true,
    widgetWelcomeMessage: "Selamat datang di LexCom! Tanyakan tentang hukum Indonesia.",
    widgetButtonIcon: "scale",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;

  // ── 3 BIG IDEAS + 12 SPECIALIST AGENTS ─────────────────────────────────────
  for (const biDef of BIGIDEAS) {
    const bigIdea = await storage.createBigIdea({
      seriesId: parseInt(seriesId),
      name: biDef.name,
      type: biDef.type,
      description: biDef.description,
      goals: [
        "Memberikan analisis hukum mendalam berbasis regulasi Indonesia terkini",
        "Sitasi pasal eksplisit [UU No.X/Tahun, Pasal Y] di setiap respons",
        "Format IRAC+ (Issue, Rule, Analysis, Conclusion) + rekomendasi langkah",
      ],
      targetAudience: "Individu, profesional hukum, perusahaan, dan instansi",
      expectedOutcome: "Pemahaman hukum terstruktur dan actionable untuk pengambilan keputusan",
      sortOrder: biDef.sortOrder,
      isActive: true,
    } as any);

    const agentsInGroup = LEGAL_AGENTS.filter(a => biDef.agentIds.includes(a.id));
    for (let i = 0; i < agentsInGroup.length; i++) {
      const agent = agentsInGroup[i];

      const toolbox = await storage.createToolbox({
        bigIdeaId: bigIdea.id,
        seriesId: parseInt(seriesId),
        name: `${agent.emoji} ${agent.name} — ${agent.domain}`,
        description: agent.tagline,
        isOrchestrator: false,
        isActive: true,
        sortOrder: i + 1,
        purpose: `Spesialis ${agent.domain} berbasis hukum positif Indonesia`,
        capabilities: [
          `Analisis mendalam ${agent.domain}`,
          "Format IRAC+ dengan sitasi pasal",
          "Adaptif untuk T1 (awam), T2 (korporat), T3 (profesional hukum)",
        ],
        limitations: [
          "Tidak menggantikan konsultasi advokat untuk kasus konkret",
        ],
      } as any);
      totalCreated++;

      await storage.createAgent({
        userId,
        toolboxId: parseInt(toolbox.id),
        name: agent.name,
        description: agent.tagline,
        tagline: agent.tagline,
        category: "legal",
        subcategory: agent.id,
        isPublic: true,
        isOrchestrator: false,
        aiModel: "gpt-4o",
        temperature: 0.2,
        maxTokens: 3500,
        systemPrompt: agent.systemPrompt,
        greetingMessage: agent.greetingMessage,
        conversationStarters: agent.starters,
        personality: `${agent.personaName} — ${agent.domain} specialist`,
        communicationStyle: "formal",
        toneOfVoice: "professional",
        language: "id",
        widgetColor: "#7c3aed",
        widgetPosition: "bottom-right",
        widgetSize: "large",
        widgetBorderRadius: "rounded",
        widgetShowBranding: true,
        widgetWelcomeMessage: agent.greetingMessage.slice(0, 120),
        widgetButtonIcon: "scale",
        isActive: true,
        requireRegistration: true,
      } as any);
      totalCreated++;

      log(`[Seed LexCom InSeries] ✅ ${agent.name} (${agent.domain}) seeded`);
    }
  }

  log(`[Seed LexCom InSeries] SELESAI — ${totalCreated} items created in series ${seriesId}`);
  return { created: totalCreated, skipped: false };
}

export async function seedLexCom(userId: string): Promise<{ created: number; skipped: boolean }> {
  const allSeries = await storage.getSeries();
  const existingSeries = allSeries.find((s: any) => s.slug === SERIES_SLUG || s.name === SERIES_NAME);

  if (existingSeries) {
    // Additive patch: add missing BigIdeas/agents for newly added specialists
    const existingBigIdeas = await storage.getBigIdeas();
    const seriesBigIdeas = existingBigIdeas.filter((bi: any) => String(bi.seriesId) === String(existingSeries.id));
    const existingBigIdeaNames = seriesBigIdeas.map((bi: any) => bi.name);

    let patchCount = 0;
    for (const biDef of BIGIDEAS) {
      const exists = existingBigIdeaNames.includes(biDef.name);
      if (exists) {
        // Check if any agents from this group are missing
        const matchingBi = seriesBigIdeas.find((bi: any) => bi.name === biDef.name);
        if (!matchingBi) continue;
        const existingToolboxes = await storage.getToolboxes(String(matchingBi.id));
        const existingAgentNames = new Set<string>();
        for (const tb of existingToolboxes) {
          const agents = await storage.getAgents(tb.id);
          agents.forEach((a: any) => existingAgentNames.add(a.name));
        }
        const agentsInGroup = LEGAL_AGENTS.filter(a => biDef.agentIds.includes(a.id));
        for (let i = 0; i < agentsInGroup.length; i++) {
          const agent = agentsInGroup[i];
          if (existingAgentNames.has(agent.name)) continue;
          const toolbox = await storage.createToolbox({
            bigIdeaId: matchingBi.id,
            seriesId: parseInt(String(existingSeries.id)),
            name: `${agent.emoji} ${agent.name} — ${agent.domain}`,
            description: agent.tagline,
            isOrchestrator: false,
            isActive: true,
            sortOrder: existingToolboxes.length + i + 1,
            purpose: `Spesialis ${agent.domain} berbasis hukum positif Indonesia`,
            capabilities: [`Analisis mendalam ${agent.domain}`, "Format IRAC+ dengan sitasi pasal", "Adaptif untuk T1/T2/T3"],
            limitations: ["Tidak menggantikan konsultasi advokat untuk kasus konkret"],
          } as any);
          await storage.createAgent({
            userId,
            toolboxId: parseInt(toolbox.id),
            name: agent.name,
            description: agent.tagline,
            tagline: agent.tagline,
            category: "legal",
            subcategory: agent.id,
            isPublic: true,
            isOrchestrator: false,
            aiModel: "gpt-4o",
            temperature: 0.2,
            maxTokens: 3500,
            systemPrompt: agent.systemPrompt,
            greetingMessage: agent.greetingMessage,
            conversationStarters: agent.starters,
            personality: `${agent.personaName} — ${agent.domain} specialist`,
            communicationStyle: "formal",
            toneOfVoice: "professional",
            language: "id",
            widgetColor: "#7c3aed",
            widgetPosition: "bottom-right",
            widgetSize: "large",
            widgetBorderRadius: "rounded",
            widgetShowBranding: true,
            widgetWelcomeMessage: agent.greetingMessage.slice(0, 120),
            widgetButtonIcon: "scale",
            isActive: true,
            requireRegistration: true,
          } as any);
          patchCount++;
          log(`[Patch LexCom] ✅ ${agent.name} ditambahkan ke ${matchingBi.name}`);
        }
      } else {
        // New BigIdea group, create it entirely
        const bigIdea = await storage.createBigIdea({
          seriesId: parseInt(String(existingSeries.id)),
          name: biDef.name,
          type: biDef.type,
          description: biDef.description,
          goals: [
            "Memberikan analisis hukum mendalam berbasis regulasi Indonesia terkini",
            "Sitasi pasal eksplisit [UU No.X/Tahun, Pasal Y] di setiap respons",
            "Format IRAC+ (Issue, Rule, Analysis, Conclusion) + rekomendasi langkah",
          ],
          targetAudience: "Individu, profesional hukum, perusahaan, dan instansi",
          expectedOutcome: "Pemahaman hukum terstruktur dan actionable untuk pengambilan keputusan",
          sortOrder: biDef.sortOrder,
          isActive: true,
        } as any);
        const agentsInGroup = LEGAL_AGENTS.filter(a => biDef.agentIds.includes(a.id));
        for (let i = 0; i < agentsInGroup.length; i++) {
          const agent = agentsInGroup[i];
          const toolbox = await storage.createToolbox({
            bigIdeaId: bigIdea.id,
            seriesId: parseInt(String(existingSeries.id)),
            name: `${agent.emoji} ${agent.name} — ${agent.domain}`,
            description: agent.tagline,
            isOrchestrator: false,
            isActive: true,
            sortOrder: i + 1,
            purpose: `Spesialis ${agent.domain} berbasis hukum positif Indonesia`,
            capabilities: [`Analisis mendalam ${agent.domain}`, "Format IRAC+ dengan sitasi pasal", "Adaptif untuk T1/T2/T3"],
            limitations: ["Tidak menggantikan konsultasi advokat untuk kasus konkret"],
          } as any);
          await storage.createAgent({
            userId,
            toolboxId: parseInt(toolbox.id),
            name: agent.name,
            description: agent.tagline,
            tagline: agent.tagline,
            category: "legal",
            subcategory: agent.id,
            isPublic: true,
            isOrchestrator: false,
            aiModel: "gpt-4o",
            temperature: 0.2,
            maxTokens: 3500,
            systemPrompt: agent.systemPrompt,
            greetingMessage: agent.greetingMessage,
            conversationStarters: agent.starters,
            personality: `${agent.personaName} — ${agent.domain} specialist`,
            communicationStyle: "formal",
            toneOfVoice: "professional",
            language: "id",
            widgetColor: "#7c3aed",
            widgetPosition: "bottom-right",
            widgetSize: "large",
            widgetBorderRadius: "rounded",
            widgetShowBranding: true,
            widgetWelcomeMessage: agent.greetingMessage.slice(0, 120),
            widgetButtonIcon: "scale",
            isActive: true,
            requireRegistration: true,
          } as any);
          patchCount++;
          log(`[Patch LexCom] ✅ ${agent.name} (${agent.domain}) seeded in new BigIdea`);
        }
      }
    }

    if (patchCount > 0) {
      log(`[Patch LexCom] SELESAI — ${patchCount} agen baru ditambahkan ke LexCom yang sudah ada`);
      return { created: patchCount, skipped: false };
    }

    log("[Seed LexCom] Series sudah ada dan lengkap, skip.");
    return { created: 0, skipped: true };
  }

  log("[Seed LexCom] Membuat Series LexCom...");

  const series = await storage.createSeries(
    {
      name: SERIES_NAME,
      slug: SERIES_SLUG,
      description:
        "Ekosistem AI Hukum Indonesia — **1 Orchestrator (Lex) + 17 Agen Spesialis** yang mencakup seluruh cabang hukum: Pidana (KUHP 2023), Perdata, Korporasi, Pasar Modal & OJK, Ketenagakerjaan (UU Cipta Kerja), Pertanahan (BPN), Pajak (DJP/UU HPP), Kepailitan/PKPU, Yurisprudensi MA/MK, Legal Drafting, HAM & Perlindungan Konsumen, HKI (Merek/Paten/Hak Cipta), Imigrasi & TKA, Hukum Keluarga & Waris, MultiClaw, dan OpenClaw (hukum digital). Setiap respons menggunakan format IRAC+ dengan sitasi pasal eksplisit dan disclaimer otomatis.",
      tagline: "17 Agen Spesialis Hukum Indonesia — dari Pidana hingga Hukum Digital",
      coverImage: "",
      color: "#7c3aed",
      category: "legal",
      tags: [
        "hukum", "legal", "lexcom", "ai hukum", "kuhp 2023", "perdata", "pidana",
        "korporasi", "pasar modal", "ojk", "pajak", "ketenagakerjaan", "pertanahan",
        "yurisprudensi", "litigasi", "kepailitan", "hukum keluarga", "waris",
        "hki", "merek", "paten", "hak cipta", "imigrasi", "tka", "ham",
        "perlindungan konsumen", "hukum digital", "multi-agent", "irac",
      ],
      language: "id",
      isPublic: true,
      isFeatured: true,
      sortOrder: 99,
    } as any,
    userId,
  );

  let totalCreated = 0;

  // ── HUB: LEX-ORCHESTRATOR ──────────────────────────────────────────────────
  const hubBigIdea = await storage.createBigIdea({
    seriesId: series.id,
    name: "LEX-ORCHESTRATOR — Hub 17 Spesialis Hukum",
    type: "solution",
    description:
      "Hub utama LexCom. LEX-ORCHESTRATOR (persona: Lex) menerima pertanyaan hukum, mendeteksi domain, merutekan ke agen spesialis yang tepat, dan mengkomposisi respons terstruktur format IRAC+ dengan sitasi pasal.",
    goals: [
      "Routing otomatis ke 17 agen spesialis berdasarkan domain pertanyaan",
      "Deteksi user tier (T1 awam / T2 korporat / T3 profesional) dan sesuaikan kedalaman jawaban",
      "Menjamin format IRAC+ konsisten di seluruh respons",
      "Sitasi pasal eksplisit [UU No.X/Tahun, Pasal Y] di setiap analisis",
    ],
    targetAudience: "Individu, profesional hukum, korporat, dan instansi yang membutuhkan riset hukum Indonesia",
    expectedOutcome: "Pengguna mendapat analisis hukum terstruktur dengan sitasi regulasi yang tepat, dalam bahasa yang sesuai level keahlian mereka",
    sortOrder: 0,
    isActive: true,
  } as any);

  const hubToolbox = await storage.createToolbox({
    bigIdeaId: hubBigIdea.id,
    seriesId: series.id,
    name: "LEX-ORCHESTRATOR — Pintu Masuk LexCom",
    description: "Orchestrator utama LexCom. Mendeteksi domain hukum, merutekan ke 17 spesialis, menjaga konteks percakapan, dan menjamin format IRAC+ di setiap respons.",
    isOrchestrator: true,
    isActive: true,
    sortOrder: 0,
    purpose: "Routing intent hukum & manajemen konteks percakapan multi-agent",
    capabilities: [
      "Klasifikasi domain dari 12 cabang hukum Indonesia",
      "Deteksi user tier T1/T2/T3 untuk kedalaman jawaban adaptif",
      "Routing ke agen spesialis dengan weighted scoring",
      "Komposisi respons format IRAC+ dengan sitasi pasal",
      "Disclaimer otomatis di setiap respons",
    ],
    limitations: [
      "Tidak menggantikan saran advokat berlisensi untuk kasus konkret",
      "Tidak mewakili klien di pengadilan",
    ],
  } as any);
  totalCreated++;

  await storage.createAgent({
    userId,
    toolboxId: parseInt(hubToolbox.id),
    name: "LEX-ORCHESTRATOR",
    description: "Lex — orchestrator 17 spesialis hukum Indonesia. Routing otomatis, format IRAC+, tier-adaptive.",
    tagline: "Routing otomatis ke 17 spesialis hukum — pidana, perdata, korporasi & lebih.",
    category: "legal",
    subcategory: "orchestrator",
    isPublic: true,
    isOrchestrator: true,
    aiModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 3500,
    systemPrompt: LEX_ORCHESTRATOR_PROMPT,
    greetingMessage: LEX_ORCHESTRATOR_GREETING,
    conversationStarters: [
      "Saya kena somasi atas wanprestasi kontrak — apa langkah saya?",
      "Bantu saya analisis risiko hukum sebelum tanda tangan MoU dengan vendor.",
      "Tolong cari yurisprudensi MA tentang PMH terkait kebocoran data pribadi.",
      "Saya butuh draft gugatan perdata wanprestasi senilai Rp 500 juta.",
    ],
    personality: "Profesional, akurat, terstruktur, adaptif terhadap level keahlian pengguna",
    communicationStyle: "formal",
    toneOfVoice: "professional",
    language: "id",
    widgetColor: "#7c3aed",
    widgetPosition: "bottom-right",
    widgetSize: "large",
    widgetBorderRadius: "rounded",
    widgetShowBranding: true,
    widgetWelcomeMessage: "Selamat datang di LexCom! Tanyakan tentang hukum Indonesia.",
    widgetButtonIcon: "scale",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;

  // ── 3 BIG IDEAS + SPECIALIST AGENTS ────────────────────────────────────────
  for (const biDef of BIGIDEAS) {
    const bigIdea = await storage.createBigIdea({
      seriesId: series.id,
      name: biDef.name,
      type: biDef.type,
      description: biDef.description,
      goals: [
        "Memberikan analisis hukum mendalam berbasis regulasi Indonesia terkini",
        "Sitasi pasal eksplisit [UU No.X/Tahun, Pasal Y] di setiap respons",
        "Format IRAC+ (Issue, Rule, Analysis, Conclusion) + rekomendasi langkah",
      ],
      targetAudience: "Individu, profesional hukum, perusahaan, dan instansi",
      expectedOutcome: "Pemahaman hukum terstruktur dan actionable untuk pengambilan keputusan",
      sortOrder: biDef.sortOrder,
      isActive: true,
    } as any);

    const agentsInGroup = LEGAL_AGENTS.filter(a => biDef.agentIds.includes(a.id));
    for (let i = 0; i < agentsInGroup.length; i++) {
      const agent = agentsInGroup[i];

      const toolbox = await storage.createToolbox({
        bigIdeaId: bigIdea.id,
        seriesId: series.id,
        name: `${agent.emoji} ${agent.name} — ${agent.domain}`,
        description: agent.tagline,
        isOrchestrator: false,
        isActive: true,
        sortOrder: i + 1,
        purpose: `Spesialis ${agent.domain} berbasis hukum positif Indonesia`,
        capabilities: [
          `Analisis mendalam ${agent.domain}`,
          "Format IRAC+ dengan sitasi pasal",
          "Adaptif untuk T1 (awam), T2 (korporat), T3 (profesional hukum)",
        ],
        limitations: [
          "Tidak menggantikan konsultasi advokat untuk kasus konkret",
        ],
      } as any);
      totalCreated++;

      await storage.createAgent({
        userId,
        toolboxId: parseInt(toolbox.id),
        name: agent.name,
        description: agent.tagline,
        tagline: agent.tagline,
        category: "legal",
        subcategory: agent.id,
        isPublic: true,
        isOrchestrator: false,
        aiModel: "gpt-4o",
        temperature: 0.2,
        maxTokens: 3500,
        systemPrompt: agent.systemPrompt,
        greetingMessage: agent.greetingMessage,
        conversationStarters: agent.starters,
        personality: `${agent.personaName} — ${agent.domain} specialist`,
        communicationStyle: "formal",
        toneOfVoice: "professional",
        language: "id",
        widgetColor: "#7c3aed",
        widgetPosition: "bottom-right",
        widgetSize: "large",
        widgetBorderRadius: "rounded",
        widgetShowBranding: true,
        widgetWelcomeMessage: agent.greetingMessage.slice(0, 120),
        widgetButtonIcon: "scale",
        isActive: true,
        requireRegistration: true,
      } as any);
      totalCreated++;

      log(`[Seed LexCom] ✅ ${agent.name} (${agent.domain}) seeded`);
    }
  }

  log(`[Seed LexCom] SELESAI — ${totalCreated} items created (1 series + ${totalCreated - 1} toolboxes + agents)`);
  return { created: totalCreated, skipped: false };
}
