/**
 * ============================================================================
 * GUSTAFTA AI BLUEPRINT SCHEMA — Tahap 2
 * ============================================================================
 *
 * "DNA" sebuah organisasi AI dalam bentuk JSON. Skema ini MEWAKILI seluruh
 * konfigurasi Builder (lihat docs/blueprint-engine/01-builder-audit.md) tetapi
 * BELUM tersambung ke Builder, DB, atau UI mana pun. Murni aditif.
 *
 * Prinsip kunci:
 *  - Confidence, bukan Completion. Tiap field punya metadata keyakinan + asal.
 *  - Partial by design. Blueprint bisa terisi sebagian (hasil dialog bertahap).
 *  - Field name mengikuti nama JS kolom tabel `agents` di shared/schema.ts agar
 *    Mapping Engine (Tahap 3) bisa memetakan 1:1 tanpa ambiguitas.
 *
 * RUANG LINGKUP (scope contract):
 *  - DI-COVER: seluruh field "desain/DNA" tabel `agents` + entitas anak yang
 *    DIKONFIGURASI (knowledge_bases, mini_apps, project_brain_*, integrations,
 *    vouchers, agentic_deliverables).
 *  - DIKECUALIKAN (system-managed, bukan didesain user): id, userId, accessToken,
 *    createdAt, archivedAt. (archived disertakan karena itu keputusan user.)
 *  - DIKECUALIKAN (data RUNTIME, bukan konfigurasi): analytics, agent_messages,
 *    conversations, leads, scoring_results, mini_app_results, knowledge_chunks.
 *    Yang masuk Blueprint hanya KONFIGURASI-nya (mis. scoringRubric &
 *    leadCaptureFields ada di modul `conversion`; ragChunkSize di `knowledge`).
 *  - DITUNDA: company_profiles (entitas klien BUJK, bukan DNA agen) — ditinjau
 *    pada tahap lanjutan bila diperlukan.
 *
 * TIDAK diimpor oleh kode aplikasi apa pun pada tahap ini.
 * ============================================================================
 */

import { z } from "zod";

/* ===========================================================================
 * 1. PRIMITIF CONFIDENCE
 * ======================================================================== */

/** Asal sebuah nilai field. */
export const fieldSourceSchema = z.enum([
  "user", // diisi/dikonfirmasi manusia
  "inferred", // disimpulkan AI (Inference Engine)
  "default", // nilai default sistem
  "unknown", // belum diketahui
]);
export type FieldSource = z.infer<typeof fieldSourceSchema>;

/** Metadata keyakinan untuk SATU field. */
export const fieldMetaSchema = z.object({
  /** 0..1 — seberapa yakin nilai ini benar. */
  confidence: z.number().min(0).max(1).default(0),
  source: fieldSourceSchema.default("unknown"),
  /** Alasan/jejak kenapa AI menyimpulkan nilai ini (Inference/Critic Engine). */
  evidence: z.string().optional(),
  /** True bila perlu dikonfirmasi user sebelum dipakai. */
  needsConfirmation: z.boolean().default(false),
});
export type FieldMeta = z.infer<typeof fieldMetaSchema>;

/** Status agregat sebuah modul Blueprint. */
export const moduleStatusSchema = z.enum([
  "empty", // belum ada data sama sekali
  "partial", // sebagian terisi
  "inferred", // terisi via inferensi, menunggu konfirmasi
  "confirmed", // sudah dikonfirmasi user
]);
export type ModuleStatus = z.infer<typeof moduleStatusSchema>;

/**
 * Bungkus generik sebuah modul: data + metadata per-field + agregat.
 * `fieldMeta` adalah map keyField -> FieldMeta (tidak semua field wajib ada).
 */
export function blueprintModule<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    fieldMeta: z.record(z.string(), fieldMetaSchema).default({}),
    /** Keyakinan agregat modul (0..1), dihitung Confidence Engine (Tahap 7). */
    confidence: z.number().min(0).max(1).default(0),
    status: moduleStatusSchema.default("empty"),
  });
}

/* ===========================================================================
 * 2. DATA SCHEMAS PER MODUL
 *    Semua field .optional() — Blueprint bersifat partial.
 *    Mengikuti pengelompokan audit B1–B17 + entitas anak.
 * ======================================================================== */

/* --- 2.1 identity (audit B1) ------------------------------------------- */
export const identityDataSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  tagline: z.string().optional(),
  philosophy: z.string().optional(),
  chatStyle: z.string().optional(),
  language: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  personality: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  communicationStyle: z.string().optional(),
  toneOfVoice: z.string().optional(),
  responseFormat: z.string().optional(),
  responseStyle: z.string().optional(),
  customResponseStyle: z.string().optional(),
  keyPhrases: z.array(z.string()).optional(),
  avoidTopics: z.array(z.string()).optional(),
  greetingMessage: z.string().optional(),
  conversationStarters: z.array(z.string()).optional(),
  offTopicHandling: z.string().optional(),
  offTopicResponse: z.string().optional(),
  offTopicBehavior: z.string().optional(),
});

/* --- 2.2 aiEngine (audit B2) ------------------------------------------- */
export const aiEngineDataSchema = z.object({
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().int().optional(),
  aiModel: z.string().optional(),
  customApiKey: z.string().optional(),
  customBaseUrl: z.string().optional(),
  customModelName: z.string().optional(),
});

/* --- 2.3 access (audit B3) --------------------------------------------- */
export const accessDataSchema = z.object({
  isPublic: z.boolean().optional(),
  allowedDomains: z.array(z.string()).optional(),
  isListed: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  archived: z.boolean().optional(),
  folderName: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/* --- 2.4 orchestration (audit B4) -------------------------------------- */
export const subAgentRefSchema = z.object({
  role: z.string(),
  agentId: z.number().int().optional(),
  /** Alternatif resolusi by-slug bila agentId belum diketahui Blueprint. */
  agentSlug: z.string().optional(),
  description: z.string().optional(),
});
export const orchestrationDataSchema = z.object({
  isOrchestrator: z.boolean().optional(),
  orchestratorRole: z.string().optional(),
  agentRole: z.string().optional(),
  parentAgentId: z.number().int().optional(),
  toolboxId: z.number().int().optional(),
  bigIdeaId: z.number().int().optional(),
  orchestratorConfig: z.record(z.any()).optional(),
  agenticSubAgents: z.array(subAgentRefSchema).optional(),
  agenticConfig: z.record(z.any()).optional(),
});

/* --- 2.5 agentic (audit B5+B6+B7) -------------------------------------- */
export const agenticDataSchema = z.object({
  // inti (B5)
  agenticMode: z.boolean().optional(),
  attentiveListening: z.boolean().optional(),
  contextRetention: z.number().int().optional(),
  proactiveAssistance: z.boolean().optional(),
  learningEnabled: z.boolean().optional(),
  emotionalIntelligence: z.boolean().optional(),
  multiStepReasoning: z.boolean().optional(),
  selfCorrection: z.boolean().optional(),
  // lanjutan (B6)
  behaviorPreset: z.string().optional(),
  autonomyLevel: z.string().optional(),
  responseDepth: z.string().optional(),
  outputFormat: z.string().optional(),
  clarifyBeforeAnswer: z.boolean().optional(),
  uncertaintyHandling: z.string().optional(),
  showRiskWarnings: z.boolean().optional(),
  contextPriority: z.array(z.string()).optional(),
  sourcePriority: z.array(z.string()).optional(),
  proactiveAssistanceLevel: z.string().optional(),
  proactiveHelpTypes: z.array(z.string()).optional(),
  interactionStyle: z.string().optional(),
  contextualEmpathy: z.string().optional(),
  actionBoundary: z.array(z.string()).optional(),
  escalationRules: z.array(z.string()).optional(),
  adaptiveLearningMode: z.string().optional(),
  storeInteractionSignals: z.boolean().optional(),
  // work mode & gate (B7)
  workMode: z.string().optional(),
  executionGatePolicy: z.string().optional(),
  clarificationTriggers: z.array(z.string()).optional(),
});

/* --- 2.6 openClaw (audit B8) ------------------------------------------- */
export const openClawDataSchema = z.object({
  openClawTrustedActions: z.array(z.string()).optional(),
  openClawBlockedActions: z.array(z.string()).optional(),
  openClawAuditLog: z.boolean().optional(),
  openClawNotifyOnGate: z.boolean().optional(),
  openClawStepTrace: z.boolean().optional(),
  openClawTrack: z.string().optional(),
  openClawEntityOwner: z.string().optional(),
  openClawRulebook: z.string().optional(),
  openClawRulebookCategory: z.array(z.string()).optional(),
  openClawRulebookStatus: z.string().optional(),
  openClawClauseRefRequired: z.boolean().optional(),
});

/* --- 2.7 goals (audit B9) ---------------------------------------------- */
export const goalsDataSchema = z.object({
  primaryOutcome: z.string().optional(),
  conversationWinConditions: z.string().optional(),
  fallbackObjective: z.string().optional(),
});

/* --- 2.8 policy (audit B10) -------------------------------------------- */
export const policyDataSchema = z.object({
  brandVoiceSpec: z.string().optional(),
  reasoningPolicy: z.string().optional(),
  interactionPolicy: z.string().optional(),
  domainCharter: z.string().optional(),
  qualityBar: z.string().optional(),
  riskCompliance: z.string().optional(),
});

/* --- 2.9 deliverables (audit B11 + agentic_deliverables) --------------- */
export const deliverableItemSchema = z.object({
  type: z.string().optional(), // CLARIFYING_QUESTIONS | CHECKLIST | TIMELINE | ANSWER_SUMMARY | ...
  title: z.string().optional(),
  content: z.record(z.any()).optional(),
});
export const deliverablesDataSchema = z.object({
  deliverables: z.array(z.any()).optional(),
  deliverableBundle: z.string().optional(),
  items: z.array(deliverableItemSchema).optional(),
});

/* --- 2.10 knowledge (audit B12 + knowledge_bases) --------------------- */
export const knowledgeSourceSchema = z.object({
  name: z.string().optional(),
  type: z.enum(["file", "url", "text", "youtube"]).optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  sourceUrl: z.string().optional(),
  sourceAuthority: z.string().optional(),
  knowledgeLayer: z.string().optional(),
  taxonomyId: z.number().int().optional(),
  status: z.string().optional(),
});
export const knowledgeDataSchema = z.object({
  ragEnabled: z.boolean().optional(),
  ragChunkSize: z.number().int().optional(),
  ragChunkOverlap: z.number().int().optional(),
  ragTopK: z.number().int().optional(),
  contextQuestions: z.array(z.string()).optional(),
  sources: z.array(knowledgeSourceSchema).optional(),
});

/* --- 2.11 projectBrain (project_brain_*) ------------------------------ */
export const projectBrainFieldSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  type: z.string().optional(), // text | select | date | boolean | number | ...
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});
export const projectBrainTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(projectBrainFieldSchema).optional(),
});
export const projectBrainDataSchema = z.object({
  templates: z.array(projectBrainTemplateSchema).optional(),
  /** Nilai instance awal (opsional): templateName -> { key: value }. */
  instances: z.record(z.record(z.any())).optional(),
});

/* --- 2.12 miniApps (mini_apps) ---------------------------------------- */
export const miniAppRefSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  config: z.record(z.any()).optional(),
});
export const miniAppsDataSchema = z.object({
  apps: z.array(miniAppRefSchema).optional(),
});

/* --- 2.13 widget (audit B13) ------------------------------------------ */
export const widgetDataSchema = z.object({
  widgetColor: z.string().optional(),
  widgetPosition: z.string().optional(),
  widgetSize: z.string().optional(),
  widgetBorderRadius: z.string().optional(),
  widgetShowBranding: z.boolean().optional(),
  widgetWelcomeMessage: z.string().optional(),
  widgetButtonIcon: z.string().optional(),
  brandingName: z.string().optional(),
  brandingLogo: z.string().optional(),
});

/* --- 2.14 monetization (audit B14 + vouchers) ------------------------- */
export const voucherRefSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  durationDays: z.number().int().optional(),
  maxRedemptions: z.number().int().optional(),
});
export const monetizationDataSchema = z.object({
  productSummary: z.string().optional(),
  productFeatures: z.array(z.string()).optional(),
  productUseCases: z.string().optional(),
  productTargetUser: z.string().optional(),
  productProblem: z.string().optional(),
  productPricing: z.record(z.any()).optional(),
  trialEnabled: z.boolean().optional(),
  trialDays: z.number().int().optional(),
  monthlyPrice: z.number().int().optional(),
  messageQuotaDaily: z.number().int().optional(),
  messageQuotaMonthly: z.number().int().optional(),
  guestMessageLimit: z.number().int().optional(),
  requireRegistration: z.boolean().optional(),
  paymentUrl: z.string().optional(),
  vouchers: z.array(voucherRefSchema).optional(),
});

/* --- 2.15 landingPage (audit B15) ------------------------------------- */
export const landingPageDataSchema = z.object({
  landingPageEnabled: z.boolean().optional(),
  landingPageUrl: z.string().optional(),
  marketingKitUrl: z.string().optional(),
  landingHeroHeadline: z.string().optional(),
  landingHeroSubheadline: z.string().optional(),
  landingHeroCtaText: z.string().optional(),
  landingPainPoints: z.array(z.any()).optional(),
  landingSolutionText: z.string().optional(),
  landingBenefits: z.array(z.any()).optional(),
  landingDemoItems: z.array(z.any()).optional(),
  landingTestimonials: z.array(z.any()).optional(),
  landingFaq: z.array(z.any()).optional(),
  landingAuthority: z.record(z.any()).optional(),
  landingGuarantees: z.array(z.any()).optional(),
});

/* --- 2.16 conversion (audit B16 + leads/scoring) ---------------------- */
export const conversionDataSchema = z.object({
  conversionEnabled: z.boolean().optional(),
  conversionGoal: z.string().optional(),
  conversionCta: z.record(z.any()).optional(),
  conversionOffers: z.array(z.any()).optional(),
  leadCaptureFields: z.array(z.any()).optional(),
  scoringEnabled: z.boolean().optional(),
  scoringRubric: z.array(z.any()).optional(),
  scoringThresholds: z.record(z.any()).optional(),
  ctaTriggerAfterMessages: z.number().int().optional(),
  ctaTriggerOnScore: z.number().int().optional(),
  whatsappCta: z.string().optional(),
  calendlyUrl: z.string().optional(),
});

/* --- 2.17 marketing (audit B17) --------------------------------------- */
export const marketingDataSchema = z.object({
  adCopies: z.record(z.any()).optional(),
  imageHookPrompts: z.array(z.string()).optional(),
  videoReelPrompts: z.array(z.string()).optional(),
  metaPixelId: z.string().optional(),
});

/* --- 2.18 integration (integrations) ---------------------------------- */
export const integrationRefSchema = z.object({
  type: z.string().optional(), // whatsapp | telegram | slack | ...
  name: z.string().optional(),
  config: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
});
export const integrationDataSchema = z.object({
  integrations: z.array(integrationRefSchema).optional(),
});

/* --- 2.19 reflection (Dialog Reflektif 3 Gerbang — Trilogi Gustafta) ---
 *
 * Modul KHUSUS berisi jawaban REFLEKTIF user atas sebuah topik. Berbeda dari
 * modul lain, isi modul ini BUKAN konfigurasi kolom `agents` — melainkan "peta
 * pemahaman" pribadi user (bahan Profil Penguasaan atas Topik). Karena itu modul
 * ini TIDAK dipetakan ke tabel `agents` (lihat mapping-engine NON_AGENT_MODULES)
 * dan seluruh field-nya diisi LANGSUNG oleh user (source="user"), bukan inferensi.
 *
 * Tiga gerbang mengikuti Trilogi Gustafta:
 *   - Gerbang 1 DIALOG     : latar belakang, pengetahuan, visi.
 *   - Gerbang 2 KOLABORASI : realita, pain point, kisah keberhasilan.
 *   - Gerbang 3 KREASI     : peran, karya, harapan.
 */
export const reflectionDataSchema = z.object({
  // Gerbang 1 — DIALOG
  educationBackground: z.string().optional(),
  knowledgeSource: z.string().optional(),
  mastered: z.string().optional(),
  uncertain: z.string().optional(),
  vision: z.string().optional(),
  desiredChange: z.string().optional(),
  personalMeaning: z.string().optional(),
  // Gerbang 2 — KOLABORASI
  currentReality: z.string().optional(),
  painPoint: z.string().optional(),
  stakeholders: z.string().optional(),
  pastAttempts: z.string().optional(),
  successStory: z.string().optional(),
  lessonsLearned: z.string().optional(),
  repetitiveBurden: z.string().optional(),
  riskIfIgnored: z.string().optional(),
  // Gerbang 3 — KREASI
  desiredRole: z.string().optional(),
  desiredCreation: z.string().optional(),
  humanVsAiBoundary: z.string().optional(),
  beneficiary: z.string().optional(),
  successVision: z.string().optional(),
  nonNegotiableValues: z.string().optional(),
  biggestHope: z.string().optional(),
});

/* ===========================================================================
 * 3. BLUEPRINT LENGKAP
 * ======================================================================== */

export const blueprintMetaSchema = z.object({
  /** Versi skema, untuk migrasi forward-compatible. */
  schemaVersion: z.string().default("1.0.0"),
  blueprintId: z.string().optional(),
  /** Diisi setelah Configuration Engine (Tahap 4) menulis ke Builder. */
  agentId: z.number().int().optional(),
  title: z.string().optional(),
  /** Ringkasan/Big Idea organisasi AI yang sedang dibangun. */
  intent: z.string().optional(),
  status: z.enum(["draft", "in_dialogue", "ready", "applied", "evolving"]).default("draft"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type BlueprintMeta = z.infer<typeof blueprintMetaSchema>;

export const blueprintModulesSchema = z.object({
  identity: blueprintModule(identityDataSchema),
  aiEngine: blueprintModule(aiEngineDataSchema),
  access: blueprintModule(accessDataSchema),
  orchestration: blueprintModule(orchestrationDataSchema),
  agentic: blueprintModule(agenticDataSchema),
  openClaw: blueprintModule(openClawDataSchema),
  goals: blueprintModule(goalsDataSchema),
  policy: blueprintModule(policyDataSchema),
  deliverables: blueprintModule(deliverablesDataSchema),
  knowledge: blueprintModule(knowledgeDataSchema),
  projectBrain: blueprintModule(projectBrainDataSchema),
  miniApps: blueprintModule(miniAppsDataSchema),
  widget: blueprintModule(widgetDataSchema),
  monetization: blueprintModule(monetizationDataSchema),
  landingPage: blueprintModule(landingPageDataSchema),
  conversion: blueprintModule(conversionDataSchema),
  marketing: blueprintModule(marketingDataSchema),
  integration: blueprintModule(integrationDataSchema),
  reflection: blueprintModule(reflectionDataSchema),
});

export const blueprintSchema = z.object({
  meta: blueprintMetaSchema,
  modules: blueprintModulesSchema,
  /** Keyakinan keseluruhan Blueprint (rata-rata tertimbang antar modul). */
  overallConfidence: z.number().min(0).max(1).default(0),
});

export type Blueprint = z.infer<typeof blueprintSchema>;
export type BlueprintModules = z.infer<typeof blueprintModulesSchema>;
export type BlueprintModuleName = keyof BlueprintModules;

/** Daftar nama modul (urutan kanonik untuk UI/iterasi). */
export const BLUEPRINT_MODULE_NAMES: BlueprintModuleName[] = [
  "identity",
  "aiEngine",
  "access",
  "orchestration",
  "agentic",
  "openClaw",
  "goals",
  "policy",
  "deliverables",
  "knowledge",
  "projectBrain",
  "miniApps",
  "widget",
  "monetization",
  "landingPage",
  "conversion",
  "marketing",
  "integration",
  "reflection",
];

/** Registry nama modul → schema data-nya (untuk validasi & mapping nanti). */
export const MODULE_DATA_SCHEMAS: Record<BlueprintModuleName, z.ZodObject<any>> = {
  identity: identityDataSchema,
  aiEngine: aiEngineDataSchema,
  access: accessDataSchema,
  orchestration: orchestrationDataSchema,
  agentic: agenticDataSchema,
  openClaw: openClawDataSchema,
  goals: goalsDataSchema,
  policy: policyDataSchema,
  deliverables: deliverablesDataSchema,
  knowledge: knowledgeDataSchema,
  projectBrain: projectBrainDataSchema,
  miniApps: miniAppsDataSchema,
  widget: widgetDataSchema,
  monetization: monetizationDataSchema,
  landingPage: landingPageDataSchema,
  conversion: conversionDataSchema,
  marketing: marketingDataSchema,
  integration: integrationDataSchema,
  reflection: reflectionDataSchema,
};

/* ===========================================================================
 * 4. HELPER — Blueprint kosong
 * ======================================================================== */

/** Membuat Blueprint kosong yang valid (semua modul empty). */
export function createEmptyBlueprint(intent?: string): Blueprint {
  const emptyModule = { data: {}, fieldMeta: {}, confidence: 0, status: "empty" as const };
  return blueprintSchema.parse({
    meta: { schemaVersion: "1.0.0", intent, status: "draft" },
    modules: {
      identity: emptyModule,
      aiEngine: emptyModule,
      access: emptyModule,
      orchestration: emptyModule,
      agentic: emptyModule,
      openClaw: emptyModule,
      goals: emptyModule,
      policy: emptyModule,
      deliverables: emptyModule,
      knowledge: emptyModule,
      projectBrain: emptyModule,
      miniApps: emptyModule,
      widget: emptyModule,
      monetization: emptyModule,
      landingPage: emptyModule,
      conversion: emptyModule,
      marketing: emptyModule,
      integration: emptyModule,
      reflection: emptyModule,
    },
    overallConfidence: 0,
  });
}

/* ===========================================================================
 * 5. LINT — deteksi key fieldMeta yang tak dikenal (cegah typo sebelum mapping)
 * ======================================================================== */

export interface BlueprintLintWarning {
  module: BlueprintModuleName;
  key: string;
  message: string;
}

/**
 * Memeriksa setiap `fieldMeta` agar key-nya benar-benar ada di schema data modul
 * terkait. Mencegah drift/typo (mis. `taglinee`) yang akan menggagalkan mapping
 * 1:1 di Tahap 3. Mengembalikan daftar peringatan (kosong = bersih).
 */
export function lintBlueprintFieldMeta(blueprint: Blueprint): BlueprintLintWarning[] {
  const warnings: BlueprintLintWarning[] = [];
  for (const name of BLUEPRINT_MODULE_NAMES) {
    const allowed = new Set(Object.keys(MODULE_DATA_SCHEMAS[name].shape));
    const fieldMeta = blueprint.modules[name].fieldMeta ?? {};
    for (const key of Object.keys(fieldMeta)) {
      if (!allowed.has(key)) {
        warnings.push({
          module: name,
          key,
          message: `fieldMeta key "${key}" tidak dikenal di modul "${name}"`,
        });
      }
    }
  }
  return warnings;
}
