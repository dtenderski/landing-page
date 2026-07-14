import { z } from "zod";
import { pgTable, text, boolean, timestamp, real, integer, bigint, jsonb, varchar, serial, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Export auth models (required for Replit Auth)
export * from "./models/auth";

// ==================== DRIZZLE TABLE DEFINITIONS ====================

// User Profiles Table
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url").default(""),
  bio: text("bio").default(""),
  company: text("company").default(""),
  position: text("position").default(""),
  email: text("email").default(""),
  phone: text("phone").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Series Table - Groups Big Ideas into cohesive topics/products
export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").default(""),
  tagline: text("tagline").default(""),
  coverImage: text("cover_image").default(""),
  color: text("color").default("#6366f1"),
  category: text("category").default(""),
  tags: jsonb("tags").default([]),
  language: text("language").default("id"),
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(false),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cores Table - Optional strategic umbrella between Series and Big Ideas
export const cores = pgTable("cores", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Big Ideas Table
export const bigIdeas = pgTable("big_ideas", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id"),
  coreId: integer("core_id"),
  name: text("name").notNull(),
  slug: text("slug"),
  type: text("type").notNull(),
  description: text("description").notNull(),
  goals: jsonb("goals").default([]),
  targetAudience: text("target_audience").default(""),
  expectedOutcome: text("expected_outcome").default(""),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(false),
  monthlyPrice: integer("monthly_price").default(0),
  trialEnabled: boolean("trial_enabled").default(true),
  trialDays: integer("trial_days").default(7),
  requireRegistration: boolean("require_registration").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Toolboxes Table
export const toolboxes = pgTable("toolboxes", {
  id: serial("id").primaryKey(),
  bigIdeaId: integer("big_idea_id"),
  seriesId: integer("series_id"),
  isOrchestrator: boolean("is_orchestrator").default(false),
  name: text("name").notNull(),
  description: text("description").default(""),
  purpose: text("purpose").default(""),
  capabilities: jsonb("capabilities").default([]),
  limitations: jsonb("limitations").default([]),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agents/Chatbots Table
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description").default(""),
  avatar: text("avatar").default(""),
  tagline: text("tagline").default(""),
  philosophy: text("philosophy").default(""),
  chatStyle: text("chat_style").default("direktif"),
  offTopicHandling: text("off_topic_handling").default("politely_redirect"),
  offTopicResponse: text("off_topic_response").default(""),
  systemPrompt: text("system_prompt").default("You are a helpful assistant."),
  temperature: real("temperature").default(0.7),
  maxTokens: integer("max_tokens").default(1024),
  aiModel: text("ai_model").default("gpt-4o-mini"),
  customApiKey: text("custom_api_key").default(""),
  customBaseUrl: text("custom_base_url").default(""),
  customModelName: text("custom_model_name").default(""),
  greetingMessage: text("greeting_message").default(""),
  conversationStarters: jsonb("conversation_starters").default([]),
  language: text("language").default("id"),
  category: text("category").default(""),
  subcategory: text("subcategory").default(""),
  accessToken: text("access_token").default(""),
  isPublic: boolean("is_public").default(false),
  allowedDomains: jsonb("allowed_domains").default([]),
  toolboxId: integer("toolbox_id"),
  bigIdeaId: integer("big_idea_id"),
  isOrchestrator: boolean("is_orchestrator").default(false),
  orchestratorRole: text("orchestrator_role").default("standalone"),
  parentAgentId: integer("parent_agent_id"),
  agenticMode: boolean("agentic_mode").default(false),
  attentiveListening: boolean("attentive_listening").default(true),
  contextRetention: integer("context_retention").default(10),
  proactiveAssistance: boolean("proactive_assistance").default(false),
  learningEnabled: boolean("learning_enabled").default(false),
  emotionalIntelligence: boolean("emotional_intelligence").default(true),
  multiStepReasoning: boolean("multi_step_reasoning").default(true),
  selfCorrection: boolean("self_correction").default(true),
  // AI Agents extended settings
  behaviorPreset: text("behavior_preset").default("Balanced"),
  autonomyLevel: text("autonomy_level").default("Terbatas"),
  responseDepth: text("response_depth").default("Terstruktur"),
  outputFormat: text("output_format").default("Ringkasan + langkah"),
  clarifyBeforeAnswer: boolean("clarify_before_answer").default(true),
  uncertaintyHandling: text("uncertainty_handling").default("Sarankan verifikasi ke sumber resmi"),
  showRiskWarnings: boolean("show_risk_warnings").default(true),
  contextPriority: jsonb("context_priority").default(["Pertanyaan terakhir", "Tujuan pengguna", "Riwayat percakapan"]),
  proactiveAssistanceLevel: text("proactive_assistance_level").default("Rendah"),
  proactiveHelpTypes: jsonb("proactive_help_types").default(["Saran langkah berikutnya", "Pertanyaan klarifikasi", "Checklist"]),
  interactionStyle: text("interaction_style").default("Konsultatif"),
  contextualEmpathy: text("contextual_empathy").default("Ringan"),
  actionBoundary: jsonb("action_boundary").default(["Hanya menjawab", "Boleh bertanya balik", "Boleh menyarankan"]),
  escalationRules: jsonb("escalation_rules").default(["Arahkan ke sumber resmi", "Tampilkan disclaimer"]),
  offTopicBehavior: text("off_topic_behavior").default("Jawab singkat lalu arahkan kembali"),
  adaptiveLearningMode: text("adaptive_learning_mode").default("Off"),
  storeInteractionSignals: boolean("store_interaction_signals").default(false),
  sourcePriority: jsonb("source_priority").default(["System Prompt", "Knowledge Engine", "Riwayat percakapan", "Mini Apps", "Integrations", "Sumber eksternal"]),
  personality: text("personality").default(""),
  expertise: jsonb("expertise").default([]),
  communicationStyle: text("communication_style").default("friendly"),
  toneOfVoice: text("tone_of_voice").default("professional"),
  responseFormat: text("response_format").default("conversational"),
  responseStyle: text("response_style").default("balanced"),
  customResponseStyle: text("custom_response_style").default(""),
  avoidTopics: jsonb("avoid_topics").default([]),
  keyPhrases: jsonb("key_phrases").default([]),
  // Widget Customization
  widgetColor: text("widget_color").default("#6366f1"),
  widgetPosition: text("widget_position").default("bottom-right"),
  widgetSize: text("widget_size").default("medium"),
  widgetBorderRadius: text("widget_border_radius").default("rounded"),
  widgetShowBranding: boolean("widget_show_branding").default(true),
  widgetWelcomeMessage: text("widget_welcome_message").default(""),
  widgetButtonIcon: text("widget_button_icon").default("chat"),
  // Product/Monetization Settings
  isListed: boolean("is_listed").default(false),
  // Status "Bersertifikat" — HANYA boleh dinaikkan admin setelah kreator lulus
  // workshop & sertifikasi Gustafta. Terpisah dari isListed ("terbit" ≠ "bersertifikat").
  isCertified: boolean("is_certified").default(false),
  productSummary: text("product_summary").default(""),
  productFeatures: jsonb("product_features").default([]),
  productUseCases: text("product_use_cases").default(""),
  productTargetUser: text("product_target_user").default(""),
  productProblem: text("product_problem").default(""),
  productPricing: jsonb("product_pricing").default({}),
  trialEnabled: boolean("trial_enabled").default(true),
  trialDays: integer("trial_days").default(7),
  monthlyPrice: integer("monthly_price").default(0),
  messageQuotaDaily: integer("message_quota_daily").default(50),
  messageQuotaMonthly: integer("message_quota_monthly").default(1000),
  guestMessageLimit: integer("guest_message_limit").default(10),
  requireRegistration: boolean("require_registration").default(false),
  // Premium product class: "standard" (satu bot bersama, dikurasi admin, pembeli tak bisa edit)
  //                        "private"  (tiap pembeli dapat salinan sendiri yang bisa ia perkuat)
  premiumClass: text("premium_class").default("standard"),
  // Kelas Premium 1–4 = band harga LISENSI (sekali bayar). Nullable: bila null,
  // produk tidak berkelas (perilaku harga lama). Bila 1–4, harga lisensi
  // OTORITATIF dari shared/premium-classes.ts (server override monthlyPrice).
  licenseClass: integer("license_class"),
  // Harga LISENSI (sekali bayar) untuk produk NON-berkelas yang mematok harga sendiri.
  // Sumbu TERPISAH dari monthlyPrice (biaya bulanan). Bila berkelas, harga efektif
  // selalu dari band kelas (kolom ini diabaikan). null → pakai DEFAULT_LICENSE_PRICE.
  licensePrice: integer("license_price"),
  // Jika agen ini salinan privat, menunjuk ke ID agen master sumbernya.
  clonedFromAgentId: integer("cloned_from_agent_id"),
  paymentUrl: text("payment_url").default(""),
  brandingName: text("branding_name").default(""),
  brandingLogo: text("branding_logo").default(""),
  contextQuestions: jsonb("context_questions").default([]),
  ragEnabled: boolean("rag_enabled").default(true),
  ragChunkSize: integer("rag_chunk_size").default(800),
  ragChunkOverlap: integer("rag_chunk_overlap").default(200),
  ragTopK: integer("rag_top_k").default(5),
  // Landing Page Settings
  landingPageEnabled: boolean("landing_page_enabled").default(false),
  landingPageUrl: text("landing_page_url").default(""),
  marketingKitUrl: text("marketing_kit_url").default(""),
  landingHeroHeadline: text("landing_hero_headline").default(""),
  landingHeroSubheadline: text("landing_hero_subheadline").default(""),
  landingHeroCtaText: text("landing_hero_cta_text").default("Mulai Sekarang"),
  landingPainPoints: jsonb("landing_pain_points").default([]),
  landingSolutionText: text("landing_solution_text").default(""),
  landingBenefits: jsonb("landing_benefits").default([]),
  landingDemoItems: jsonb("landing_demo_items").default([]),
  landingTestimonials: jsonb("landing_testimonials").default([]),
  landingFaq: jsonb("landing_faq").default([]),
  landingAuthority: jsonb("landing_authority").default({}),
  landingGuarantees: jsonb("landing_guarantees").default([]),
  // Conversion Layer Settings
  conversionEnabled: boolean("conversion_enabled").default(false),
  conversionGoal: text("conversion_goal").default("lead_capture"),
  conversionCta: jsonb("conversion_cta").default({}),
  conversionOffers: jsonb("conversion_offers").default([]),
  leadCaptureFields: jsonb("lead_capture_fields").default([]),
  scoringEnabled: boolean("scoring_enabled").default(false),
  scoringRubric: jsonb("scoring_rubric").default([]),
  scoringThresholds: jsonb("scoring_thresholds").default({}),
  ctaTriggerAfterMessages: integer("cta_trigger_after_messages").default(5),
  ctaTriggerOnScore: integer("cta_trigger_on_score").default(0),
  whatsappCta: text("whatsapp_cta").default(""),
  calendlyUrl: text("calendly_url").default(""),
  // Marketing Kit - Ad Copy & Prompts
  adCopies: jsonb("ad_copies").default({}),
  imageHookPrompts: jsonb("image_hook_prompts").default([]),
  videoReelPrompts: jsonb("video_reel_prompts").default([]),
  metaPixelId: text("meta_pixel_id").default(""),
  // Atentif Agentic AI — Multi-Agent Architecture
  agentRole: text("agent_role").default("Standalone"),
  workMode: text("work_mode").default("Answer Mode"),
  executionGatePolicy: text("execution_gate_policy").default("Konfirmasi untuk write"),
  clarificationTriggers: jsonb("clarification_triggers").default(["Output target tidak jelas", "Risiko salah tinggi", "Butuh data spesifik untuk eksekusi"]),
  // OpenClaw Execution Engine
  openClawTrustedActions: jsonb("open_claw_trusted_actions").default(["Cari di Knowledge Base", "Hitung formula", "Ringkas dokumen", "Sarankan langkah selanjutnya"]),
  openClawBlockedActions: jsonb("open_claw_blocked_actions").default(["Hapus data pengguna", "Kirim email massal", "Publish ke publik tanpa konfirmasi"]),
  openClawAuditLog: boolean("open_claw_audit_log").default(true),
  openClawNotifyOnGate: boolean("open_claw_notify_on_gate").default(false),
  openClawStepTrace: boolean("open_claw_step_trace").default(true),
  // OpenClaw — PBJ Track Routing
  openClawTrack: text("open_claw_track").default("Komersial"),
  openClawEntityOwner: text("open_claw_entity_owner").default(""),
  openClawRulebook: text("open_claw_rulebook").default(""),
  openClawRulebookCategory: jsonb("open_claw_rulebook_category").default([]),
  openClawRulebookStatus: text("open_claw_rulebook_status").default("Active"),
  openClawClauseRefRequired: boolean("open_claw_clause_ref_required").default(false),
  // Tujuan & KPI
  primaryOutcome: text("primary_outcome").default(""),
  conversationWinConditions: text("conversation_win_conditions").default(""),
  fallbackObjective: text("fallback_objective").default("Kumpulkan data untuk tindak lanjut"),
  // Kebijakan & Domain Charter
  brandVoiceSpec: text("brand_voice_spec").default(""),
  reasoningPolicy: text("reasoning_policy").default("Langkah demi langkah"),
  interactionPolicy: text("interaction_policy").default(""),
  domainCharter: text("domain_charter").default(""),
  qualityBar: text("quality_bar").default(""),
  riskCompliance: text("risk_compliance").default(""),
  deliverables: jsonb("deliverables").default([]),
  deliverableBundle: text("deliverable_bundle").default(""),
  orchestratorConfig: jsonb("orchestrator_config").default({}),
  agenticSubAgents: jsonb("agentic_sub_agents").default([]),
  agenticConfig: jsonb("agentic_config").default({}),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(false),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  folderName: text("folder_name"),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Premium Privat: jamin maksimal SATU salinan per (master, pemilik). Race-safe
  // di level DB — dua webhook/login bersamaan tak bisa membuat clone ganda.
  // Partial: hanya berlaku untuk baris salinan (cloned_from_agent_id NOT NULL),
  // agen sistem/master (NULL) tidak terpengaruh.
  uniqueIndex("agents_clone_owner_unique")
    .on(table.clonedFromAgentId, table.userId)
    .where(sql`${table.clonedFromAgentId} IS NOT NULL`),
  // Store catalog builder filters active agents by category, excludes child
  // agents (parent_agent_id NOT NULL) and counts children by parent. These
  // indexes keep the catalog rebuild cheap regardless of catalog size.
  index("agents_active_category_idx").on(table.isActive, table.category),
  index("agents_parent_agent_id_idx").on(table.parentAgentId),
]);

// Knowledge Taxonomy Table
// Hierarki 4-level: Sektor (root) → Subsektor → Topik → Klausul.
// Self-referencing parent_id; level konsisten dengan jenjang yang dipilih.
export const knowledgeTaxonomy = pgTable("knowledge_taxonomy", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  level: text("level").notNull().default("sektor"),
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Knowledge Bases Table
export const knowledgeBases = pgTable("knowledge_bases", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  description: text("description").default(""),
  fileType: text("file_type"),
  fileName: text("file_name").default(""),
  fileSize: integer("file_size").default(0),
  fileUrl: text("file_url").default(""),
  processingStatus: text("processing_status").default("completed"),
  extractedText: text("extracted_text").default(""),
  knowledgeLayer: text("knowledge_layer").default("operational"),
  // Hierarki & versioning
  taxonomyId: integer("taxonomy_id"),
  sourceUrl: text("source_url").default(""),
  sourceAuthority: text("source_authority").default(""),
  effectiveDate: timestamp("effective_date"),
  supersededById: integer("superseded_by_id"),
  status: text("status").notNull().default("active"),
  isShared: boolean("is_shared").default(false),
  sharedScope: text("shared_scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Knowledge Chunks Table - RAG system for large document retrieval
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: serial("id").primaryKey(),
  knowledgeBaseId: integer("knowledge_base_id").notNull(),
  agentId: integer("agent_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").default(0),
  embedding: jsonb("embedding").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Integrations Table
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  config: jsonb("config").default({}),
  isEnabled: boolean("is_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent Messages Table (for chat history)
export const agentMessages = pgTable("agent_messages", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  sessionId: text("session_id").default(""),
  role: text("role").notNull(),
  content: text("content").notNull(),
  reasoning: text("reasoning").default(""),
  confidence: real("confidence"),
  sources: jsonb("sources").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics Table
export const analyticsTable = pgTable("analytics", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client Subscriptions Table (end-users subscribing to chatbot products)
export const clientSubscriptions = pgTable("client_subscriptions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  bigIdeaId: integer("big_idea_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").default(""),
  plan: text("plan").notNull().default("trial"),
  status: text("status").default("active"),
  accessToken: text("access_token").notNull(),
  mayarOrderId: text("mayar_order_id"),
  mayarPaymentUrl: text("mayar_payment_url"),
  amount: integer("amount").default(0),
  currency: text("currency").default("IDR"),
  messageUsedToday: integer("message_used_today").default(0),
  messageUsedMonth: integer("message_used_month").default(0),
  lastMessageDate: text("last_message_date"),
  lastMonthReset: text("last_month_reset"),
  referralCode: text("referral_code"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blueprint Table (AI Organization Builder — persisted "DNA" JSON; ADDITIVE, not yet route-wired)
export const blueprints = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  name: text("name").notNull().default("Blueprint Tanpa Judul"),
  intent: text("intent").default(""),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlueprintSchema = createInsertSchema(blueprints).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type BlueprintRecord = typeof blueprints.$inferSelect;

// Organization Drafts (AI Organization Builder — saved TEAM designs, owner-scoped).
// `data` holds the client OrgDraft JSON ({ orgName, mission, members, maxSpecialists }).
// Persists the same shape the wizard exports/imports (Tahap 30), so a saved design can be
// reopened & edited later from any device. ADDITIVE; never writes agents (that stays /configure).
export const organizationDrafts = pgTable("organization_drafts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  name: text("name").notNull().default("Tim Tanpa Judul"),
  mission: text("mission").default(""),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationDraftSchema = createInsertSchema(organizationDrafts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganizationDraft = z.infer<typeof insertOrganizationDraftSchema>;
export type OrganizationDraftRecord = typeof organizationDrafts.$inferSelect;

// Shared Certificates (Sertifikat Pembelajaran Reflektif — tautan berbagi publik).
// Menyimpan SNAPSHOT beku dari Profil Penguasaan (MasteryProfile) saat user memilih
// membuat tautan berbagi. `profile` = MasteryProfile utuh; view publik (read-only,
// tanpa login) merender snapshot ini sehingga edit blueprint kemudian TIDAK mengubah
// apa yang sudah dibagikan. Ini peta pemahaman, BUKAN skor psikometri.
export const sharedCertificates = pgTable("shared_certificates", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  topic: text("topic"),
  profile: jsonb("profile").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSharedCertificateSchema = createInsertSchema(sharedCertificates).omit({ id: true, createdAt: true });
export type InsertSharedCertificate = z.infer<typeof insertSharedCertificateSchema>;
export type SharedCertificateRecord = typeof sharedCertificates.$inferSelect;

// Agent Collaboration — owner shares an agent with other users as editor/viewer.
// editor = boleh mengubah konfigurasi agen (kecuali hapus/aktivasi/kelola-share);
// viewer = hanya baca (lihat konfigurasi tersanitasi, tidak boleh mutasi).
export const agentCollaborators = pgTable("agent_collaborators", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("viewer"),
  invitedBy: varchar("invited_by", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("agent_collaborators_agent_user_unique").on(table.agentId, table.userId),
]);

export const collaboratorRoleSchema = z.enum(["editor", "viewer"]);
export type CollaboratorRole = z.infer<typeof collaboratorRoleSchema>;

// Returned by applyPendingInvitesForUser: the agent access grants that were
// just activated for a freshly-registered user, used to show a first-login notice.
export type AppliedInviteGrant = {
  agentId: string;
  agentName: string;
  role: CollaboratorRole;
};

export const insertAgentCollaboratorSchema = createInsertSchema(agentCollaborators)
  .omit({ id: true, createdAt: true })
  .extend({ role: collaboratorRoleSchema });
export type InsertAgentCollaborator = z.infer<typeof insertAgentCollaboratorSchema>;
export type AgentCollaborator = typeof agentCollaborators.$inferSelect;

// Pending agent invites — owner invites an email that has no Gustafta account yet.
// On successful registration with that email, the pending grant becomes a real
// collaborator row (see applyPendingInvitesForUser). Listed/revoked by the owner.
export const pendingAgentInvites = pgTable("pending_agent_invites", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("viewer"),
  invitedBy: varchar("invited_by", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("pending_agent_invites_agent_email_unique").on(table.agentId, table.email),
]);

export const insertPendingAgentInviteSchema = createInsertSchema(pendingAgentInvites)
  .omit({ id: true, createdAt: true })
  .extend({ role: collaboratorRoleSchema });
export type InsertPendingAgentInvite = z.infer<typeof insertPendingAgentInviteSchema>;
export type PendingAgentInvite = typeof pendingAgentInvites.$inferSelect;

// Jejak audit sertifikasi (grant/cabut "Bersertifikat") — bukti historis formal
// agar keputusan admin tercatat permanen di tabel, bukan hanya console.log yang
// hilang saat restart. Satu baris per aksi POST /api/admin/agents/:id/certification.
export const certificationAuditLog = pgTable("certification_audit_log", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  certified: boolean("certified").notNull(),
  adminId: varchar("admin_id", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCertificationAuditSchema = createInsertSchema(certificationAuditLog)
  .omit({ id: true, createdAt: true });
export type InsertCertificationAudit = z.infer<typeof insertCertificationAuditSchema>;
export type CertificationAudit = typeof certificationAuditLog.$inferSelect;

// Pending Premium Privat deliveries — a buyer pays (e.g. via Scalev) for a
// private premium chatbot but has no Gustafta account yet. We can't clone until
// we have an owner userId, so we persist the intent here. On the buyer's first
// signup with that email, applyPendingPremiumDeliveriesForUser clones the master
// agent to them (idempotent). Mirrors pending_agent_invites.
export const pendingPremiumDeliveries = pgTable("pending_premium_deliveries", {
  id: serial("id").primaryKey(),
  masterAgentId: integer("master_agent_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  source: varchar("source", { length: 40 }).notNull().default("scalev"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("pending_premium_deliveries_agent_email_unique").on(table.masterAgentId, table.email),
]);

export const insertPendingPremiumDeliverySchema = createInsertSchema(pendingPremiumDeliveries)
  .omit({ id: true, createdAt: true });
export type InsertPendingPremiumDelivery = z.infer<typeof insertPendingPremiumDeliverySchema>;
export type PendingPremiumDelivery = typeof pendingPremiumDeliveries.$inferSelect;

// In-app notifications (e.g. agent shared with you). Email-independent so
// collaborators reliably discover shares even when BREVO_API_KEY is absent.
// Sumber tunggal tipe notifikasi (Loop Publikasi #13). Server (emit), UI lonceng
// (pilih ikon), dan tes WAJIB pakai konstanta ini — cegah string-drift antar-lapis.
// `AGENT_CERTIFICATION_LEGACY` hanya untuk data lama sebelum tipe grant/revoke dipisah
// (Tahap 57); jangan dipakai untuk notifikasi baru. Panjang string harus ≤ 40 char
// (lihat kolom `type` di bawah).
export const NOTIFICATION_TYPES = {
  AGENT_SHARED: "agent_shared",
  AGENT_CERTIFICATION_GRANTED: "agent_certification_granted",
  AGENT_CERTIFICATION_REVOKED: "agent_certification_revoked",
  AGENT_CERTIFICATION_LEGACY: "agent_certification",
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 40 }).notNull().default(NOTIFICATION_TYPES.AGENT_SHARED),
  title: text("title").notNull(),
  message: text("message").notNull().default(""),
  link: text("link"),
  agentId: integer("agent_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notifications_user_created_idx").on(table.userId, table.createdAt),
]);

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true, read: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Affiliates/Partners Table — MLM 3-Level (Pusat L1 / Provinsi L2 / Kab-Kota L3)
export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").default(""),
  code: text("code").notNull(),
  // MLM hierarchy
  mlmLevel: integer("mlm_level").default(3),          // 1=Pusat, 2=Provinsi, 3=Kab/Kota
  parentId: integer("parent_id"),                     // upline affiliate id
  region: text("region").default(""),                 // nama wilayah (provinsi/kab-kota)
  // Legacy single rate (kept for compat)
  commissionRate: real("commission_rate").default(20),
  // Earnings breakdown
  totalEarningsLicense: integer("total_earnings_license").default(0),  // komisi dari lisensi
  totalEarningsRecurring: integer("total_earnings_recurring").default(0), // komisi dari berlangganan
  totalEarnings: integer("total_earnings").default(0),
  totalReferrals: integer("total_referrals").default(0),
  payoutInfo: text("payout_info").default(""),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MLM Commission Rate Config (per level, per type)
export const mlmCommissionRates = pgTable("mlm_commission_rates", {
  id: serial("id").primaryKey(),
  mlmLevel: integer("mlm_level").notNull(),           // 1, 2, or 3
  commissionType: text("commission_type").notNull(),  // "license" | "recurring"
  rate: real("rate").notNull(),                       // percentage, e.g. 20.0
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// MLM Commission Ledger — tracks every commission event
export const mlmCommissions = pgTable("mlm_commissions", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull(),     // who earns
  sourceAffiliateId: integer("source_affiliate_id"),  // who triggered (direct referrer)
  userId: varchar("user_id", { length: 255 }),        // the customer
  transactionType: text("transaction_type").notNull(),// "license" | "recurring"
  transactionRef: text("transaction_ref").default(""),// order id / subscription id
  grossAmount: integer("gross_amount").notNull(),     // original transaction amount
  commissionRate: real("commission_rate").notNull(),  // rate applied
  commissionAmount: integer("commission_amount").notNull(), // earned amount
  mlmLevel: integer("mlm_level").notNull(),           // level at time of commission
  status: text("status").default("pending"),          // pending | approved | paid | cancelled
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const insertAffiliateMLMSchema = createInsertSchema(affiliates).omit({ id: true, createdAt: true });
export type InsertAffiliateMLM = z.infer<typeof insertAffiliateMLMSchema>;
export type AffiliateMLM = typeof affiliates.$inferSelect;

export const insertMlmCommissionSchema = createInsertSchema(mlmCommissions).omit({ id: true, createdAt: true });
export type InsertMlmCommission = z.infer<typeof insertMlmCommissionSchema>;
export type MlmCommission = typeof mlmCommissions.$inferSelect;

// Subscriptions Table (builder-side platform subscriptions)
export const subscriptionsTable = pgTable("subscriptions_new", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  plan: text("plan").notNull(),
  status: text("status").default("pending"),
  mayarOrderId: text("mayar_order_id"),
  mayarPaymentUrl: text("mayar_payment_url"),
  amount: integer("amount").default(0),
  currency: text("currency").default("IDR"),
  chatbotLimit: integer("chatbot_limit").default(1),
  trialMessagesUsed: integer("trial_messages_used").default(0),
  partnerId: integer("partner_id"),                                // jika di-set: langganan seat yang disediakan mitra asosiasi (Model B)
  grantedBy: varchar("granted_by", { length: 255 }),               // jika di-set: userId admin/superadmin yang memberi akses manual (Early Adopter). null = via pembayaran normal. "kapan" = createdAt.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Durable per-owner monthly message usage counter (platform owner/plan path).
// Replaces the previous in-memory Map so counts survive server restarts and
// stay consistent across multiple instances (autoscale/deploy). Keyed by
// owner + calendar month ("2026-05").
export const ownerMonthlyUsageTable = pgTable("owner_monthly_usage", {
  id: serial("id").primaryKey(),
  ownerUserId: varchar("owner_user_id", { length: 255 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  count: integer("count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerMonthUnique: uniqueIndex("owner_monthly_usage_owner_month_idx").on(table.ownerUserId, table.month),
}));

export type OwnerMonthlyUsage = typeof ownerMonthlyUsageTable.$inferSelect;

// ==================== ZOD VALIDATION SCHEMAS ====================

// User Profile schema with avatar support
export const insertUserProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string().min(1, "Name is required"),
  avatarUrl: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  company: z.string().optional().default(""),
  position: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = InsertUserProfile & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

// Series schema - Groups Big Ideas into topics
export const insertSeriesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().default(""),
  tagline: z.string().optional().default(""),
  coverImage: z.string().optional().default(""),
  color: z.string().optional().default("#6366f1"),
  category: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  language: z.string().optional().default("id"),
  isPublic: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
});

export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Series = InsertSeries & {
  id: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
};

export type SeriesWithStats = Series & {
  totalBigIdeas: number;
  totalToolboxes: number;
  totalAgents: number;
  totalCores: number;
};

type AgentSummary = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  tagline: string;
  category: string;
  subcategory: string;
  isPublic: boolean;
  isActive: boolean;
  widgetColor: string;
  isOrchestrator: boolean;
  orchestratorRole: string;
};

type ToolboxWithAgents = Toolbox & { agents: AgentSummary[] };
type BigIdeaWithToolboxes = BigIdea & { toolboxes: ToolboxWithAgents[] };

export type SeriesWithHierarchy = SeriesWithStats & {
  cores: (Core & { bigIdeas: BigIdeaWithToolboxes[] })[];
  bigIdeas: BigIdeaWithToolboxes[];
  orchestratorToolboxes?: ToolboxWithAgents[];
};

// Core schema - Optional strategic umbrella under Series
export const insertCoreSchema = z.object({
  seriesId: z.string().min(1, "Series is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  sortOrder: z.number().optional().default(0),
});

export type InsertCore = z.infer<typeof insertCoreSchema>;
export type Core = InsertCore & {
  id: string;
  isActive: boolean;
  createdAt: string;
};

// Big Idea schema - Top level of hierarchy
export const insertBigIdeaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["problem", "idea", "inspiration", "mentoring"]),
  description: z.string().min(1, "Description is required"),
  goals: z.array(z.string()).optional().default([]),
  targetAudience: z.string().optional().default(""),
  expectedOutcome: z.string().optional().default(""),
  seriesId: z.string().optional(),
  coreId: z.string().optional(),
  sortOrder: z.number().optional().default(0),
  monthlyPrice: z.number().min(0).optional().default(0),
  trialEnabled: z.boolean().optional().default(true),
  trialDays: z.number().optional().default(7),
  requireRegistration: z.boolean().optional().default(false),
});

export type InsertBigIdea = z.infer<typeof insertBigIdeaSchema>;
export type BigIdea = InsertBigIdea & {
  id: string;
  slug?: string | null;
  isActive: boolean;
  createdAt: string;
};

// Toolbox schema - Created from Big Idea or directly under Series (for Orchestrator/HUB)
export const insertToolboxSchema = z.object({
  bigIdeaId: z.string().optional(),
  seriesId: z.string().optional(),
  isOrchestrator: z.boolean().optional().default(false),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  purpose: z.string().optional().default(""),
  capabilities: z.array(z.string()).optional().default([]),
  limitations: z.array(z.string()).optional().default([]),
  sortOrder: z.number().optional().default(0),
});

export type InsertToolbox = z.infer<typeof insertToolboxSchema>;
export type Toolbox = InsertToolbox & {
  id: string;
  isActive: boolean;
  isOrchestrator: boolean;
  createdAt: string;
};

// AI Model configuration
export const aiModelSchema = z.enum([
  // OpenAI
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  // DeepSeek
  "deepseek-chat",
  "deepseek-reasoner",
  // Qwen (Alibaba)
  "qwen-turbo",
  "qwen-plus",
  "qwen-max",
  // Google Gemini
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  // Anthropic (via proxy)
  "claude-3-haiku",
  "claude-3-sonnet",
  "claude-3-5-sonnet",
  // Custom
  "custom"
]);

export type AIModel = z.infer<typeof aiModelSchema>;

// Agent/Chatbot schema with enhanced features including Toolbox reference
// Note: userId is NOT included here - it must be set server-side from authenticated user
export const insertAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  avatar: z.string().optional().default(""),
  tagline: z.string().optional().default(""),
  philosophy: z.string().optional().default(""),
  offTopicHandling: z.string().optional().default("politely_redirect"),
  offTopicResponse: z.string().optional().default(""),
  systemPrompt: z.string().optional().default("You are a helpful assistant."),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(100).max(4096).optional().default(1024),
  // AI Model Configuration
  aiModel: aiModelSchema.optional().default("gpt-4o-mini"),
  customApiKey: z.string().optional().default(""),
  customBaseUrl: z.string().optional().default(""),
  customModelName: z.string().optional().default(""),
  // Enhanced features inspired by GPTs, Botika, KorinAI
  greetingMessage: z.string().optional().default(""),
  conversationStarters: z.array(z.string()).optional().default([]),
  language: z.string().optional().default("id"),
  // Business/Profession category
  category: z.string().optional().default(""),
  subcategory: z.string().optional().default(""),
  // Access control for monetization
  accessToken: z.string().optional().default(""),
  isPublic: z.boolean().optional().default(false),
  allowedDomains: z.array(z.string()).optional().default([]),
  // Hierarchy: Toolbox reference (required for module chatbots)
  toolboxId: z.string().optional(),
  // Hierarchy: Big Idea reference (required for orchestrators)
  bigIdeaId: z.string().optional(),
  // Is this an orchestrator chatbot?
  isOrchestrator: z.boolean().optional().default(false),
  // Role in orchestration
  orchestratorRole: z.enum(["orchestrator", "specialist", "standalone"]).optional().default("standalone"),
  parentAgentId: z.string().optional().default(""),
  // Attentive Agentic AI settings
  agenticMode: z.boolean().optional().default(false),
  attentiveListening: z.boolean().optional().default(true),
  contextRetention: z.number().min(1).max(50).optional().default(10),
  proactiveAssistance: z.boolean().optional().default(false),
  learningEnabled: z.boolean().optional().default(false),
  emotionalIntelligence: z.boolean().optional().default(true),
  multiStepReasoning: z.boolean().optional().default(true),
  selfCorrection: z.boolean().optional().default(true),
  // AI Agents extended settings
  behaviorPreset: z.string().optional().default("Balanced"),
  autonomyLevel: z.string().optional().default("Terbatas"),
  responseDepth: z.string().optional().default("Terstruktur"),
  outputFormat: z.string().optional().default("Ringkasan + langkah"),
  clarifyBeforeAnswer: z.boolean().optional().default(true),
  uncertaintyHandling: z.string().optional().default("Sarankan verifikasi ke sumber resmi"),
  showRiskWarnings: z.boolean().optional().default(true),
  contextPriority: z.array(z.string()).optional().default(["Pertanyaan terakhir", "Tujuan pengguna", "Riwayat percakapan"]),
  proactiveAssistanceLevel: z.string().optional().default("Rendah"),
  proactiveHelpTypes: z.array(z.string()).optional().default(["Saran langkah berikutnya", "Pertanyaan klarifikasi", "Checklist"]),
  interactionStyle: z.string().optional().default("Konsultatif"),
  contextualEmpathy: z.string().optional().default("Ringan"),
  actionBoundary: z.array(z.string()).optional().default(["Hanya menjawab", "Boleh bertanya balik", "Boleh menyarankan"]),
  escalationRules: z.array(z.string()).optional().default(["Arahkan ke sumber resmi", "Tampilkan disclaimer"]),
  offTopicBehavior: z.string().optional().default("Jawab singkat lalu arahkan kembali"),
  adaptiveLearningMode: z.string().optional().default("Off"),
  storeInteractionSignals: z.boolean().optional().default(false),
  sourcePriority: z.array(z.string()).optional().default(["System Prompt", "Knowledge Engine", "Riwayat percakapan", "Mini Apps", "Integrations", "Sumber eksternal"]),
  // Enhanced Persona fields for stronger AI personality
  chatStyle: z.enum(["socratic", "direktif", "kolaboratif", "coach", "fasilitator"]).optional().default("direktif"),
  personality: z.string().optional().default(""),
  expertise: z.array(z.string()).optional().default([]),
  communicationStyle: z.string().optional().default("friendly"),
  toneOfVoice: z.string().optional().default("professional"),
  responseFormat: z.string().optional().default("conversational"),
  responseStyle: z.enum(["creative", "structured", "balanced", "custom"]).optional().default("balanced"),
  customResponseStyle: z.string().optional().default(""),
  avoidTopics: z.array(z.string()).optional().default([]),
  keyPhrases: z.array(z.string()).optional().default([]),
  // Widget Customization
  widgetColor: z.string().optional().default("#6366f1"),
  widgetPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).optional().default("bottom-right"),
  widgetSize: z.enum(["small", "medium", "large"]).optional().default("medium"),
  widgetBorderRadius: z.enum(["rounded", "square", "pill"]).optional().default("rounded"),
  widgetShowBranding: z.boolean().optional().default(true),
  widgetWelcomeMessage: z.string().optional().default(""),
  widgetButtonIcon: z.enum(["chat", "message", "bot", "help"]).optional().default("chat"),
  // Product/Monetization Settings
  isListed: z.boolean().optional().default(false),
  isCertified: z.boolean().optional().default(false),
  productSummary: z.string().optional().default(""),
  productFeatures: z.array(z.string()).optional().default([]),
  productUseCases: z.string().optional().default(""),
  productTargetUser: z.string().optional().default(""),
  productProblem: z.string().optional().default(""),
  productPricing: z.record(z.any()).optional().default({}),
  trialEnabled: z.boolean().optional().default(true),
  trialDays: z.number().min(1).max(30).optional().default(7),
  monthlyPrice: z.number().min(0).optional().default(0),
  messageQuotaDaily: z.number().min(0).optional().default(50),
  messageQuotaMonthly: z.number().min(0).optional().default(1000),
  guestMessageLimit: z.number().min(0).optional().default(10),
  requireRegistration: z.boolean().optional().default(false),
  premiumClass: z.enum(["standard", "private"]).optional().default("standard"),
  licenseClass: z.number().int().min(1).max(4).nullable().optional(),
  licensePrice: z.number().int().min(0).nullable().optional(),
  brandingName: z.string().optional().default(""),
  brandingLogo: z.string().optional().default(""),
  contextQuestions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "select"]),
    options: z.array(z.string()).optional().default([]),
    required: z.boolean().optional().default(true),
  })).optional().default([]),
  ragEnabled: z.boolean().optional().default(true),
  ragChunkSize: z.number().min(200).max(2000).optional().default(800),
  ragChunkOverlap: z.number().min(0).max(500).optional().default(200),
  ragTopK: z.number().min(1).max(20).optional().default(5),
  // Landing Page Settings
  landingPageEnabled: z.boolean().optional().default(false),
  landingPageUrl: z.string().optional().default(""),
  marketingKitUrl: z.string().optional().default(""),
  landingHeroHeadline: z.string().optional().default(""),
  landingHeroSubheadline: z.string().optional().default(""),
  landingHeroCtaText: z.string().optional().default("Mulai Sekarang"),
  landingPainPoints: z.array(z.string()).optional().default([]),
  landingSolutionText: z.string().optional().default(""),
  landingBenefits: z.array(z.string()).optional().default([]),
  landingDemoItems: z.array(z.object({
    title: z.string(),
    description: z.string().optional().default(""),
    imageUrl: z.string().optional().default(""),
  })).optional().default([]),
  landingTestimonials: z.array(z.object({
    name: z.string(),
    role: z.string().optional().default(""),
    company: z.string().optional().default(""),
    quote: z.string(),
  })).optional().default([]),
  landingFaq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional().default([]),
  landingAuthority: z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
    credentials: z.array(z.string()).optional().default([]),
  }).optional().default({}),
  landingGuarantees: z.array(z.string()).optional().default([]),
  // Conversion Layer Settings
  conversionEnabled: z.boolean().optional().default(false),
  conversionGoal: z.enum(["lead_capture", "assessment", "consultation", "product_sale", "registration"]).optional().default("lead_capture"),
  conversionCta: z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
    buttonText: z.string().optional().default(""),
    buttonUrl: z.string().optional().default(""),
    style: z.enum(["banner", "card", "floating", "inline"]).optional().default("card"),
  }).optional().default({}),
  conversionOffers: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional().default(""),
    price: z.string().optional().default(""),
    features: z.array(z.string()).optional().default([]),
    ctaText: z.string().optional().default(""),
    ctaUrl: z.string().optional().default(""),
    isPopular: z.boolean().optional().default(false),
  })).optional().default([]),
  leadCaptureFields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "phone", "select", "textarea"]),
    required: z.boolean().optional().default(true),
    placeholder: z.string().optional().default(""),
    options: z.array(z.string()).optional().default([]),
  })).optional().default([]),
  scoringEnabled: z.boolean().optional().default(false),
  scoringRubric: z.array(z.object({
    id: z.string(),
    category: z.string(),
    maxScore: z.number().optional().default(100),
    weight: z.number().optional().default(1),
    description: z.string().optional().default(""),
  })).optional().default([]),
  scoringThresholds: z.object({
    low: z.number().optional().default(30),
    medium: z.number().optional().default(60),
    high: z.number().optional().default(80),
    lowLabel: z.string().optional().default("Perlu Peningkatan"),
    mediumLabel: z.string().optional().default("Cukup Baik"),
    highLabel: z.string().optional().default("Sangat Baik"),
    lowRecommendation: z.string().optional().default(""),
    mediumRecommendation: z.string().optional().default(""),
    highRecommendation: z.string().optional().default(""),
  }).optional().default({}),
  ctaTriggerAfterMessages: z.number().min(1).max(50).optional().default(5),
  ctaTriggerOnScore: z.number().min(0).max(100).optional().default(0),
  whatsappCta: z.string().optional().default(""),
  calendlyUrl: z.string().optional().default(""),
  // Marketing Kit
  adCopies: z.record(z.string(), z.object({
    headline: z.string().optional().default(""),
    primaryText: z.string().optional().default(""),
    description: z.string().optional().default(""),
    callToAction: z.string().optional().default(""),
    hashtags: z.string().optional().default(""),
  })).optional().default({}),
  imageHookPrompts: z.array(z.object({
    id: z.string(),
    title: z.string().optional().default(""),
    prompt: z.string(),
    platform: z.string().optional().default("general"),
    style: z.string().optional().default(""),
  })).optional().default([]),
  videoReelPrompts: z.array(z.object({
    id: z.string(),
    title: z.string().optional().default(""),
    prompt: z.string(),
    platform: z.string().optional().default("general"),
    duration: z.string().optional().default("15-30s"),
  })).optional().default([]),
  metaPixelId: z.string().optional().default(""),
  // Deliverables
  deliverables: z.array(z.string()).optional().default([]),
  deliverableBundle: z.string().optional().default(""),
  // OpenClaw Execution Engine
  openClawTrustedActions: z.array(z.string()).optional().default(["Cari di Knowledge Base", "Hitung formula", "Ringkas dokumen", "Sarankan langkah selanjutnya"]),
  openClawBlockedActions: z.array(z.string()).optional().default(["Hapus data pengguna", "Kirim email massal", "Publish ke publik tanpa konfirmasi"]),
  openClawAuditLog: z.boolean().optional().default(true),
  openClawNotifyOnGate: z.boolean().optional().default(false),
  openClawStepTrace: z.boolean().optional().default(true),
  // OpenClaw — PBJ Track Routing
  openClawTrack: z.string().optional().default("Komersial"),
  openClawEntityOwner: z.string().optional().default(""),
  openClawRulebook: z.string().optional().default(""),
  openClawRulebookCategory: z.array(z.string()).optional().default([]),
  openClawRulebookStatus: z.string().optional().default("Active"),
  openClawClauseRefRequired: z.boolean().optional().default(false),
  // Kebijakan Agen — 7 field yang harus selalu konsisten.
  // Auto-fill di storage.createAgent berdasarkan series jika kosong (lihat server/lib/agent-policies.ts).
  primaryOutcome: z.string().optional().default(""),
  conversationWinConditions: z.string().optional().default(""),
  brandVoiceSpec: z.string().optional().default(""),
  interactionPolicy: z.string().optional().default(""),
  domainCharter: z.string().optional().default(""),
  qualityBar: z.string().optional().default(""),
  riskCompliance: z.string().optional().default(""),
  // Inter-agent API — sub-agents that this orchestrator can call in parallel
  agenticSubAgents: z.array(z.object({
    agentId: z.number(),
    role: z.string().default(""),
    description: z.string().default(""),
    outputFormat: z.enum(["text", "json"]).optional().default("text"),
    tags: z.array(z.string()).optional().default([]),
    priority: z.number().optional().default(0),
  })).optional().default([]),
  agenticConfig: z.object({
    maxParallelSubAgents: z.number().optional().default(4),
    criticEnabled: z.boolean().optional().default(false),
    criticStrictness: z.enum(["fast", "strict"]).optional().default("fast"),
  }).optional().default({}),
}).refine(
  (data) => {
    // Orchestrator must have bigIdeaId, Module must have toolboxId
    if (data.isOrchestrator) {
      return !!data.bigIdeaId;
    }
    return true; // Module validation is optional - existing agents may not have toolboxId
  },
  {
    message: "Orchestrator membutuhkan Big Idea yang aktif",
    path: ["bigIdeaId"],
  }
);

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = InsertAgent & {
  id: string;
  slug?: string | null;
  userId?: string;
  agentRole?: string;
  workMode?: string;
  executionGatePolicy?: string;
  clarificationTriggers?: string[];
  fallbackObjective?: string;
  reasoningPolicy?: string;
  orchestratorConfig?: Record<string, any>;
  isActive: boolean;
  isEnabled: boolean;
  folderName: string | null;
  createdAt: string;
};

// Knowledge Taxonomy schema (4-level: sektor → subsektor → topik → klausul)
export const TAXONOMY_LEVELS = ["sektor", "subsektor", "topik", "klausul"] as const;
export const insertKnowledgeTaxonomySchema = z.object({
  parentId: z.number().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  level: z.enum(TAXONOMY_LEVELS).default("sektor"),
  description: z.string().optional().default(""),
  sortOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});
export type InsertKnowledgeTaxonomy = z.infer<typeof insertKnowledgeTaxonomySchema>;
export type KnowledgeTaxonomyNode = InsertKnowledgeTaxonomy & {
  id: number;
  createdAt: string;
};
export type KnowledgeTaxonomyTreeNode = KnowledgeTaxonomyNode & {
  children: KnowledgeTaxonomyTreeNode[];
};

// Source authorities resmi yang umum dipakai industri jasa konstruksi Indonesia.
// Open-ended: nilai lain tetap diizinkan via "lainnya".
export const KB_SOURCE_AUTHORITIES = [
  "PUPR", "LKPP", "DJP", "BNSP", "LPJK", "BSN", "DJBC",
  "Kemnaker", "BPJS_Ketenagakerjaan", "JDIH", "internal", "lainnya",
] as const;

export const KB_STATUSES = ["active", "superseded", "draft"] as const;
export const KB_SHARED_SCOPES = ["series", "global"] as const;

// Knowledge Base schema with file upload support
export const insertKnowledgeBaseSchema = z.object({
  agentId: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["text", "file", "url"]),
  content: z.string(),
  description: z.string().optional().default(""),
  // File upload fields
  fileType: z.enum(["pdf", "ppt", "pptx", "xls", "xlsx", "doc", "docx", "txt", "other"]).optional(),
  fileName: z.string().optional().default(""),
  fileSize: z.number().optional().default(0),
  fileUrl: z.string().optional().default(""),
  // Processing status
  processingStatus: z.enum(["pending", "processing", "completed", "failed"]).optional().default("completed"),
  extractedText: z.string().optional().default(""),
  knowledgeLayer: z.enum(["foundational", "operational", "case_memory"]).optional().default("operational"),
  // Hierarki & versioning (semua opsional supaya backward-compat)
  taxonomyId: z.number().nullable().optional(),
  sourceUrl: z.string().optional().default(""),
  sourceAuthority: z.string().optional().default(""),
  effectiveDate: z.union([z.string(), z.date()]).nullable().optional(),
  supersededById: z.number().nullable().optional(),
  status: z.enum(KB_STATUSES).optional().default("active"),
  isShared: z.boolean().optional().default(false),
  sharedScope: z.enum(KB_SHARED_SCOPES).nullable().optional(),
});

export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = InsertKnowledgeBase & {
  id: string;
  createdAt: string;
};

// Knowledge Chunk schema - RAG
export const insertKnowledgeChunkSchema = z.object({
  knowledgeBaseId: z.number(),
  agentId: z.number(),
  chunkIndex: z.number(),
  content: z.string(),
  tokenCount: z.number().optional().default(0),
  embedding: z.array(z.number()).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
});

export type InsertKnowledgeChunk = z.infer<typeof insertKnowledgeChunkSchema>;
export type KnowledgeChunk = InsertKnowledgeChunk & {
  id: number;
  createdAt: string;
};

// Integration schema
export const insertIntegrationSchema = z.object({
  agentId: z.string(),
  type: z.enum(["whatsapp", "telegram", "discord", "slack", "web", "api"]),
  name: z.string(),
  config: z.record(z.string()).optional().default({}),
  isEnabled: z.boolean().optional().default(false),
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = InsertIntegration & {
  id: string;
  createdAt: string;
};

// Chat Message schema
export const insertMessageSchema = z.object({
  agentId: z.string(),
  sessionId: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  // Agentic AI metadata
  reasoning: z.string().optional().default(""),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(z.string()).optional().default([]),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = InsertMessage & {
  id: string;
  createdAt: string;
};

// User schema with admin role for access control
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  email: z.string().email().optional(),
  role: z.enum(["admin", "user"]).optional().default("admin"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & {
  id: string;
  createdAt: string;
};

// Analytics schema for tracking usage
export const insertAnalyticsSchema = z.object({
  agentId: z.string(),
  eventType: z.enum(["message", "session", "integration_call"]),
  metadata: z.record(z.any()).optional().default({}),
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = InsertAnalytics & {
  id: string;
  createdAt: string;
};

// Subscription schema for payment/monetization
export const subscriptionPlanSchema = z.enum([
  "free_trial",
  "monthly_1",
  "monthly_3", 
  "monthly_6",
  "monthly_12"
]);

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionPricing: Record<SubscriptionPlan, { price: number; duration: number; label: string }> = {
  free_trial: { price: 0, duration: 7, label: "Free Trial 7 Hari" },
  monthly_1: { price: 199000, duration: 30, label: "1 Bulan" },
  monthly_3: { price: 499000, duration: 90, label: "3 Bulan" },
  monthly_6: { price: 999000, duration: 180, label: "6 Bulan" },
  monthly_12: { price: 1999000, duration: 365, label: "12 Bulan" },
};

export const insertSubscriptionSchema = z.object({
  userId: z.string(),
  plan: subscriptionPlanSchema,
  status: z.enum(["pending", "active", "expired", "cancelled"]).default("pending"),
  mayarOrderId: z.string().optional(),
  mayarPaymentUrl: z.string().optional(),
  amount: z.number(),
  currency: z.string().default("IDR"),
  chatbotLimit: z.number().default(1),
  trialMessagesUsed: z.number().default(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = InsertSubscription & {
  id: string;
  trialMessagesUsed: number;
  partnerId?: number | null;
  createdAt: string;
  updatedAt: string;
};

// ==================== CLIENT SUBSCRIPTIONS ====================

export const clientSubscriptionPlanSchema = z.enum([
  "trial", "monthly", "yearly", "lifetime", "voucher"
]);
export type ClientSubscriptionPlan = z.infer<typeof clientSubscriptionPlanSchema>;

export const insertClientSubscriptionSchema = z.object({
  agentId: z.string(),
  bigIdeaId: z.string().optional(),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional().default(""),
  plan: clientSubscriptionPlanSchema.default("trial"),
  status: z.enum(["active", "expired", "cancelled", "pending"]).default("active"),
  accessToken: z.string(),
  mayarOrderId: z.string().optional(),
  mayarPaymentUrl: z.string().optional(),
  amount: z.number().default(0),
  currency: z.string().default("IDR"),
  referralCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type InsertClientSubscription = z.infer<typeof insertClientSubscriptionSchema>;
export type ClientSubscription = InsertClientSubscription & {
  id: string;
  messageUsedToday: number;
  messageUsedMonth: number;
  lastMessageDate: string | null;
  lastMonthReset: string | null;
  createdAt: string;
  updatedAt: string;
};

// ==================== AFFILIATES ====================

export const insertAffiliateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().default(""),
  code: z.string().min(3, "Code must be at least 3 characters"),
  commissionRate: z.number().min(0).max(100).default(10),
  payoutInfo: z.string().optional().default(""),
});

export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = InsertAffiliate & {
  id: string;
  totalEarnings: number;
  totalReferrals: number;
  isActive: boolean;
  createdAt: string;
};

// ==================== PROJECT BRAIN ====================

// Project Brain field type enum
export const projectBrainFieldTypeSchema = z.enum([
  "text", "textarea", "number", "select", "multiselect", "boolean", "date", "url", "email"
]);
export type ProjectBrainFieldType = z.infer<typeof projectBrainFieldTypeSchema>;

// Project Brain field definition
export const projectBrainFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: projectBrainFieldTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().optional().default(""),
  helpText: z.string().optional().default(""),
  defaultValue: z.string().optional().default(""),
  options: z.array(z.string()).optional().default([]),
  order: z.number().optional().default(0),
});
export type ProjectBrainField = z.infer<typeof projectBrainFieldSchema>;

// Project Brain Templates Table
export const projectBrainTemplates = pgTable("project_brain_templates", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  fields: jsonb("fields").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project Brain Instances Table (filled project data)
export const projectBrainInstances = pgTable("project_brain_instances", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  templateId: integer("template_id").notNull(),
  name: text("name").notNull(),
  values: jsonb("values").default({}),
  status: text("status").default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project Brain Template Zod schema
export const insertProjectBrainTemplateSchema = z.object({
  agentId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  fields: z.array(projectBrainFieldSchema).optional().default([]),
});

export type InsertProjectBrainTemplate = z.infer<typeof insertProjectBrainTemplateSchema>;
export type ProjectBrainTemplate = InsertProjectBrainTemplate & {
  id: string;
  isActive: boolean;
  createdAt: string;
};

// Project Brain Instance Zod schema
export const insertProjectBrainInstanceSchema = z.object({
  agentId: z.string(),
  templateId: z.string(),
  name: z.string().min(1, "Project name is required"),
  values: z.record(z.any()).optional().default({}),
  status: z.enum(["draft", "active", "completed", "archived"]).optional().default("active"),
});

export type InsertProjectBrainInstance = z.infer<typeof insertProjectBrainInstanceSchema>;
export type ProjectBrainInstance = InsertProjectBrainInstance & {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ==================== LEADS (Conversion Layer) ====================

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  sessionId: text("session_id").default(""),
  name: text("name").default(""),
  email: text("email").default(""),
  phone: text("phone").default(""),
  company: text("company").default(""),
  source: text("source").default("chat"),
  status: text("status").default("new"),
  score: integer("score").default(0),
  scoreBreakdown: jsonb("score_breakdown").default({}),
  metadata: jsonb("metadata").default({}),
  notes: text("notes").default(""),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = z.object({
  agentId: z.number(),
  sessionId: z.string().optional().default(""),
  name: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  source: z.enum(["chat", "widget", "whatsapp", "form", "mini_app"]).optional().default("chat"),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional().default("new"),
  score: z.number().optional().default(0),
  scoreBreakdown: z.record(z.any()).optional().default({}),
  metadata: z.record(z.any()).optional().default({}),
  notes: z.string().optional().default(""),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = InsertLead & {
  id: number;
  convertedAt: string | null;
  createdAt: string;
};

// ==================== SCORING RESULTS (Conversion Layer) ====================

export const scoringResults = pgTable("scoring_results", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  sessionId: text("session_id").default(""),
  leadId: integer("lead_id"),
  totalScore: integer("total_score").default(0),
  maxScore: integer("max_score").default(100),
  level: text("level").default("low"),
  breakdown: jsonb("breakdown").default([]),
  recommendations: jsonb("recommendations").default([]),
  gapAnalysis: jsonb("gap_analysis").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScoringResultSchema = z.object({
  agentId: z.number(),
  sessionId: z.string().optional().default(""),
  leadId: z.number().optional(),
  totalScore: z.number().optional().default(0),
  maxScore: z.number().optional().default(100),
  level: z.enum(["low", "medium", "high"]).optional().default("low"),
  breakdown: z.array(z.object({
    category: z.string(),
    score: z.number(),
    maxScore: z.number(),
    notes: z.string().optional().default(""),
  })).optional().default([]),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string().optional().default(""),
    priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
    actionUrl: z.string().optional().default(""),
  })).optional().default([]),
  gapAnalysis: z.array(z.object({
    area: z.string(),
    current: z.string().optional().default(""),
    target: z.string().optional().default(""),
    gap: z.string().optional().default(""),
    recommendation: z.string().optional().default(""),
  })).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
});

export type InsertScoringResult = z.infer<typeof insertScoringResultSchema>;
export type ScoringResult = InsertScoringResult & {
  id: number;
  createdAt: string;
};

// ==================== MINI APPS ====================

export const miniAppTypeSchema = z.enum([
  "checklist", "calculator", "risk_assessment", "progress_tracker", "document_generator", "custom",
  "issue_log", "action_tracker", "change_log",
  "project_snapshot", "decision_summary", "risk_radar",
  "scoring_assessment", "gap_analysis", "recommendation_engine", "lead_capture_form",
  "nib_status_report", "whatsapp_status_update", "internal_project_report",
  // Tender/Pengadaan — OpenClaw Document Types
  "compliance_matrix", "tender_audit_report", "go_no_go_checklist",
  "pqp_document", "hse_plan", "executive_summary_penawaran", "metode_pelaksanaan",
  // Claude Opus Master Document Additions
  "rubric_scoring", "risk_register", "work_mode_selector",
  // MultiAgen Agentic AI Completion
  "mentoring_plan",
  // Master Standar Gustafta v1.0 — Final Completion
  "brief_intake", "studio_kompetensi",
  // Bekerja & Berusaha — Content Creation Hub
  "meeting_notes", "contract_drafter", "rab_estimator", "kpi_report",
  "social_media_copy", "sales_script", "cashflow_report", "customer_feedback",
  // Kreator Hub — Content Creator Toolkit
  "content_calendar", "video_script", "brand_deal_proposal", "content_analytics",
  // Ekosistem Kompetensi — Penulis Cerdas & PKB
  "executive_summary_pkb", "penulis_cerdas"
]);
export type MiniAppType = z.infer<typeof miniAppTypeSchema>;

// Mini Apps Table
export const miniApps = pgTable("mini_apps", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  type: text("type").notNull(),
  config: jsonb("config").default({}),
  icon: text("icon").default("app"),
  isActive: boolean("is_active").default(true),
  publicSlug: text("public_slug").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mini App Results Table
export const miniAppResults = pgTable("mini_app_results", {
  id: serial("id").primaryKey(),
  miniAppId: integer("mini_app_id").notNull(),
  agentId: integer("agent_id").notNull(),
  projectInstanceId: integer("project_instance_id"),
  input: jsonb("input").default({}),
  output: jsonb("output").default({}),
  status: text("status").default("completed"),
  source: text("source").default("owner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mini App Zod schema
export const insertMiniAppSchema = z.object({
  agentId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  type: miniAppTypeSchema,
  config: z.record(z.any()).optional().default({}),
  icon: z.string().optional().default("app"),
  publicSlug: z.string().optional(),
});

export type InsertMiniApp = z.infer<typeof insertMiniAppSchema>;
export type MiniApp = InsertMiniApp & {
  id: string;
  isActive: boolean;
  publicSlug?: string;
  createdAt: string;
};

// Mini App Result Zod schema
export const insertMiniAppResultSchema = z.object({
  miniAppId: z.string(),
  agentId: z.string(),
  projectInstanceId: z.string().optional(),
  input: z.record(z.any()).optional().default({}),
  output: z.record(z.any()).optional().default({}),
  status: z.enum(["pending", "completed", "error"]).optional().default("completed"),
  source: z.enum(["owner", "public"]).optional().default("owner"),
});

export type InsertMiniAppResult = z.infer<typeof insertMiniAppResultSchema>;
export type MiniAppResult = InsertMiniAppResult & {
  id: string;
  source: "owner" | "public";
  createdAt: string;
};

// ==================== VOUCHERS ====================

export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id"),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("unlimited"),
  extraMessages: integer("extra_messages").default(0),
  durationDays: integer("duration_days").default(30),
  maxRedemptions: integer("max_redemptions").default(0),
  totalRedeemed: integer("total_redeemed").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voucherRedemptions = pgTable("voucher_redemptions", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull(),
  clientSubscriptionId: integer("client_subscription_id").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

export const insertVoucherSchema = z.object({
  agentId: z.number().nullable().optional(),
  code: z.string().min(1, "Kode voucher wajib diisi"),
  name: z.string().min(1, "Nama voucher wajib diisi"),
  type: z.enum(["unlimited", "extra_quota"]).optional().default("unlimited"),
  extraMessages: z.number().optional().default(0),
  durationDays: z.number().optional().default(30),
  maxRedemptions: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
  expiresAt: z.string().nullable().optional(),
});

export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = {
  id: number;
  agentId: number | null;
  code: string;
  name: string;
  type: string;
  extraMessages: number;
  durationDays: number;
  maxRedemptions: number;
  totalRedeemed: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type VoucherRedemption = {
  id: number;
  voucherId: number;
  clientSubscriptionId: number;
  redeemedAt: string;
};

// ==================== USER MEMORIES ====================

export const userMemories = pgTable("user_memories", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  sessionId: text("session_id").default(""),
  category: text("category").notNull().default("memory"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserMemorySchema = createInsertSchema(userMemories).omit({ id: true, createdAt: true });
export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemories.$inferSelect;

// ==================== VOICE CHAT CONVERSATIONS ====================

// ==================== WA CONTACTS ====================

export const waContacts = pgTable("wa_contacts", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  phone: text("phone").notNull(),
  name: text("name").default(""),
  source: text("source").default("webhook"),
  isOptedOut: boolean("is_opted_out").default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWaContactSchema = createInsertSchema(waContacts).omit({ id: true, createdAt: true });
export type InsertWaContact = z.infer<typeof insertWaContactSchema>;
export type WaContact = typeof waContacts.$inferSelect;

// ==================== WA BROADCASTS ====================

export const waBroadcasts = pgTable("wa_broadcasts", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  name: text("name").notNull(),
  messageTemplate: text("message_template").notNull(),
  scheduleType: text("schedule_type").notNull().default("once"),
  scheduleTime: text("schedule_time").default("08:00"),
  scheduleDays: jsonb("schedule_days").default([]),
  timezone: text("timezone").default("Asia/Jakarta"),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  dataSource: text("data_source").default(""),
  dataSourceConfig: jsonb("data_source_config").default({}),
  isEnabled: boolean("is_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWaBroadcastSchema = createInsertSchema(waBroadcasts).omit({ id: true, createdAt: true, lastRunAt: true });
export type InsertWaBroadcast = z.infer<typeof insertWaBroadcastSchema>;
export type WaBroadcast = typeof waBroadcasts.$inferSelect;

// ==================== WA BROADCAST RUNS ====================

export const waBroadcastRuns = pgTable("wa_broadcast_runs", {
  id: serial("id").primaryKey(),
  broadcastId: integer("broadcast_id").notNull(),
  status: text("status").notNull().default("pending"),
  totalRecipients: integer("total_recipients").default(0),
  totalSent: integer("total_sent").default(0),
  totalFailed: integer("total_failed").default(0),
  runAt: timestamp("run_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorLog: text("error_log").default(""),
});

export type WaBroadcastRun = typeof waBroadcastRuns.$inferSelect;

// ==================== TENDER SOURCES ====================

export const tenderSources = pgTable("tender_sources", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  sourceType: text("source_type").default("lpse_pusat"),  // lpse_pusat | lpse_provinsi | lpse_kabkota | bumn | asing
  sector: text("sector").default("konstruksi"),           // konstruksi | oil_gas | pertambangan | energi | umum | multiple
  region: text("region").default(""),                     // Nama provinsi/kab/kota/negara
  logoUrl: text("logo_url").default(""),                  // URL logo instansi
  scrapeStatus: text("scrape_status").default("idle"),    // idle | running | success | error | demo
  lastError: text("last_error").default(""),
  isEnabled: boolean("is_enabled").default(true),
  lastScrapedAt: timestamp("last_scraped_at"),
  totalTenders: integer("total_tenders").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTenderSourceSchema = createInsertSchema(tenderSources).omit({ id: true, createdAt: true, lastScrapedAt: true, totalTenders: true });
export type InsertTenderSource = z.infer<typeof insertTenderSourceSchema>;
export type TenderSource = typeof tenderSources.$inferSelect;

// ==================== TENDERS ====================

export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  tenderId: text("tender_id").notNull(),
  name: text("name").notNull(),
  agency: text("agency").default(""),
  budget: text("budget").default(""),
  type: text("type").default(""),
  sector: text("sector").default("konstruksi"),           // konstruksi | oil_gas | pertambangan | energi | umum
  sourceType: text("source_type").default("lpse_pusat"),  // lpse_pusat | lpse_provinsi | lpse_kabkota | bumn | asing
  status: text("status").default(""),
  stage: text("stage").default(""),
  location: text("location").default(""),
  publishDate: text("publish_date").default(""),
  deadlineDate: text("deadline_date").default(""),
  url: text("url").default(""),
  rawData: jsonb("raw_data").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tenders_source_tender_unique").on(table.sourceId, table.tenderId),
]);

export const insertTenderSchema = createInsertSchema(tenders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type Tender = typeof tenders.$inferSelect;

// ==================== TENDER DOCUMENT CATALOG (Perpres 46/2025) ====================
// Katalog referensi dokumen tender pemerintah. Bukan dokumen real per-user (itu di
// tenderSessions), melainkan daftar template/jenis dokumen yang harus disiapkan
// penyedia/Pokja, dipakai sebagai data referensi oleh Agent Tender Document Generator.
export const tenderDocumentCatalog = pgTable("tender_document_catalog", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),             // PWR-06, ADM-05, KUL-02, dst — UNIQUE
  name: text("name").notNull(),                      // "Bukti Kinerja Penyedia (SIKaP)"
  kelompok: text("kelompok").notNull(),              // administrasi | kualifikasi | teknis | personel | pengalaman | peralatan | keuangan | penawaran | penjaminan
  jenisTender: text("jenis_tender").notNull().default("semua"), // pekerjaan_konstruksi | konsultansi_konstruksi | semua
  sisi: text("sisi").notNull().default("penyedia"),  // penyedia | pokja | keduanya
  wajibStatus: text("wajib_status").notNull().default("wajib"), // wajib | opsional | wajib_perpres_46
  formatOutput: text("format_output").default("PDF"), // PDF | DOCX | XLSX | JSON
  priority: text("priority").notNull().default("P1"), // P0 | P1 | P2
  templateStatus: text("template_status").notNull().default("placeholder"), // template_filled | placeholder | draft
  dasarHukum: text("dasar_hukum").default(""),       // "Perpres 46/2025 Pasal X" / "Permen PU 14/2020"
  sumberAutoFill: text("source_auto_fill").default(""), // JSON path: "company.nib", "personel[*].cv"
  openClawAgentRef: text("openclaw_agent_ref").default(""), // slug agent yg generate
  taxonomyId: integer("taxonomy_id"),                // FK opsional ke knowledge_taxonomy
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTenderDocumentCatalogSchema = createInsertSchema(tenderDocumentCatalog).omit({ id: true, createdAt: true });
export type InsertTenderDocumentCatalog = z.infer<typeof insertTenderDocumentCatalogSchema>;
export type TenderDocumentCatalog = typeof tenderDocumentCatalog.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceMessages = pgTable("voice_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Tender LPSE Pack: Company Profile (reusable entity per user) ──────────
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  businessType: text("business_type").notNull().default("PT"),
  nib: text("nib").notNull().default(""),
  nibStatus: text("nib_status").notNull().default("Ada"),
  npwp: text("npwp").notNull().default(""),
  npwpStatus: text("npwp_status").notNull().default("Ada"),
  address: text("address").notNull().default(""),
  picName: text("pic_name").notNull().default(""),
  picContact: text("pic_contact").notNull().default(""),
  experiences: jsonb("experiences").notNull().$type<Array<{
    projectName: string;
    year: string;
    role: string;
    summary: string;
    value?: string;
  }>>().default([]),
  personnel: jsonb("personnel").notNull().$type<Array<{
    name: string;
    position: string;
    education: string;
    certifications: Array<{ name: string; number?: string; issuer: string; validUntil?: string }>;
    experiences: Array<{ project: string; role: string; tasks: string; output: string; year: string }>;
    competencies: string[];
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;

// ─── Tender LPSE Pack: Session (per-tender wizard run) ────────────────────
export const tenderPackTypeSchema = z.enum(["pelaksana_konstruksi", "konsultansi_mk"]);
export type TenderPackType = z.infer<typeof tenderPackTypeSchema>;

export const tenderSessions = pgTable("tender_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  packType: text("pack_type").notNull().default("pelaksana_konstruksi"),
  companyProfileId: integer("company_profile_id"),
  status: text("status").notNull().default("draft"),
  selectedOutputs: text("selected_outputs").array().notNull().default([]),
  tenderProfile: jsonb("tender_profile").$type<Record<string, string>>().default({}),
  requirements: jsonb("requirements").$type<Record<string, string>>().default({}),
  technicalApproach: jsonb("technical_approach").$type<Record<string, string>>().default({}),
  complianceAnswers: jsonb("compliance_answers").$type<Record<string, string>>().default({}),
  scoreKelengkapan: integer("score_kelengkapan"),
  scoreTeknis: integer("score_teknis"),
  generatedChecklist: jsonb("generated_checklist").$type<Array<{
    code: string; section: string; item: string;
    status: "Ada" | "Belum" | "Perlu revisi"; note?: string;
  }>>(),
  generatedRiskReview: jsonb("generated_risk_review").$type<Array<{
    level: "red" | "yellow" | "green";
    finding: string; impact: string; recommendation: string;
  }>>(),
  generatedDrafts: jsonb("generated_drafts").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTenderSessionSchema = createInsertSchema(tenderSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenderSession = z.infer<typeof insertTenderSessionSchema>;
export type TenderSession = typeof tenderSessions.$inferSelect;

// ==================== Custom Domain Table ====================
export const customDomains = pgTable("custom_domains", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  agentId: text("agent_id"),
  domain: text("domain").notNull(),
  status: text("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomDomainSchema = createInsertSchema(customDomains).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true });
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;
export type CustomDomain = typeof customDomains.$inferSelect;

// ==================== Whitelabel Partner (Asosiasi/Reseller) Table ====================
// Config layer per mitra reseller (mis. ASPEKINDO) di atas harga Gustafta yang TIDAK berubah.
// Satu host = satu mitra. Kuota bulanan di-pool per mitra (durable di DB, bukan in-memory).
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),        // "aspekindo"
  name: text("name").notNull(),                                     // "ASPEKINDO"
  host: text("host").notNull().unique(),                            // "chat.aspekindo-pub.com"
  brandName: text("brand_name").notNull(),                          // teks brand yang tampil
  logoUrl: text("logo_url"),                                        // logo whitelabel
  primaryColor: varchar("primary_color", { length: 32 }),           // aksen hex, mis. "#0f766e"
  tagline: text("tagline"),
  description: text("description"),                                 // deskripsi singkat untuk landing mitra
  contactPhone: varchar("contact_phone", { length: 32 }),           // WA/telepon mitra (menggantikan kontak Gustafta)
  contactEmail: text("contact_email"),                              // email kontak mitra
  defaultAgentId: text("default_agent_id"),                         // chatbot konstruksi default
  cheapModel: varchar("cheap_model", { length: 64 }).default("gpt-4o-mini").notNull(), // model hemat default
  seatsPerUnit: integer("seats_per_unit").default(3).notNull(),     // ASPEKINDO=3/unit, lainnya=2
  seatCapacity: integer("seat_capacity").default(0).notNull(),      // total seat Starter berbayar (kelipatan 25). >0 = mode Lisensi Seat (Model B); 0 = mode pooled lama (Model A)
  monthlyQuota: integer("monthly_quota").default(0).notNull(),      // pool pesan/bulan; 0 = tak terbatas
  quotaMonth: varchar("quota_month", { length: 7 }),               // "2026-07"
  quotaUsed: integer("quota_used").default(0).notNull(),
  adminEmails: text("admin_emails").array(),                        // email pengurus asosiasi (partner-admin) yang boleh kelola kuota/kursi mandiri
  hidePlatformBranding: boolean("hide_platform_branding").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, createdAt: true, updatedAt: true, quotaMonth: true, quotaUsed: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// ==================== Partner Top-Up Requests Table ====================
// Permintaan self-service dari partner-admin (pengurus asosiasi) untuk menambah kursi/kuota.
// Awalnya hanya menotifikasi admin Gustafta; admin yang mengeksekusi penambahan.
export const partnerTopupRequests = pgTable("partner_topup_requests", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull(),
  requestedByEmail: text("requested_by_email").notNull(),          // email partner-admin yang meminta
  kind: varchar("kind", { length: 16 }).notNull(),                 // "seats" | "quota"
  amount: integer("amount").notNull(),                             // jumlah tambahan yang diminta
  note: text("note"),                                             // catatan opsional dari peminta
  status: varchar("status", { length: 16 }).default("pending").notNull(), // pending | resolved | rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertPartnerTopupRequestSchema = createInsertSchema(partnerTopupRequests).omit({ id: true, createdAt: true, resolvedAt: true, status: true });
export type InsertPartnerTopupRequest = z.infer<typeof insertPartnerTopupRequestSchema>;
export type PartnerTopupRequest = typeof partnerTopupRequests.$inferSelect;

// ==================== Trial Requests Table ====================
export const trialRequests = pgTable("trial_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  useCase: text("use_case"),
  status: text("status").notNull().default("pending"),
  voucherCode: text("voucher_code"),
  voucherId: integer("voucher_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrialRequestSchema = createInsertSchema(trialRequests).omit({ id: true, createdAt: true, updatedAt: true, status: true, voucherCode: true, voucherId: true, notes: true });
export type InsertTrialRequest = z.infer<typeof insertTrialRequestSchema>;
export type TrialRequest = typeof trialRequests.$inferSelect;

// ==================== LexCom Legal Knowledge Base & Case Registry ====================

export const legalKnowledgeBases = pgTable("legal_knowledge_bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("regulasi"),
  sourceAuthority: text("source_authority").default(""),
  sourceUrl: text("source_url").default(""),
  effectiveDate: text("effective_date").default(""),
  status: text("status").notNull().default("active"),
  contentSummary: text("content_summary").default(""),
  chunkCount: integer("chunk_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLegalKnowledgeBaseSchema = createInsertSchema(legalKnowledgeBases).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLegalKnowledgeBase = z.infer<typeof insertLegalKnowledgeBaseSchema>;
export type LegalKnowledgeBase = typeof legalKnowledgeBases.$inferSelect;

export const legalKnowledgeChunks = pgTable("legal_knowledge_chunks", {
  id: serial("id").primaryKey(),
  legalKbId: integer("legal_kb_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").default(0),
  embedding: jsonb("embedding").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLegalKnowledgeChunkSchema = createInsertSchema(legalKnowledgeChunks).omit({ id: true, createdAt: true });
export type InsertLegalKnowledgeChunk = z.infer<typeof insertLegalKnowledgeChunkSchema>;
export type LegalKnowledgeChunk = typeof legalKnowledgeChunks.$inferSelect;

export const legalCases = pgTable("legal_cases", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull(),
  court: text("court").notNull(),
  year: integer("year"),
  domain: text("domain").notNull().default("perdata"),
  parties: text("parties").default(""),
  legalIssue: text("legal_issue").default(""),
  ratioDecidendi: text("ratio_decidendi").notNull(),
  conclusion: text("conclusion").default(""),
  keywords: text("keywords").array().default([]),
  sourceUrl: text("source_url").default(""),
  embedding: jsonb("embedding").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLegalCaseSchema = createInsertSchema(legalCases).omit({ id: true, createdAt: true });
export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type LegalCase = typeof legalCases.$inferSelect;

// ==================== LexCom Legal Chat Tables ====================

export const legalChatSessions = pgTable("legal_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  agentType: text("agent_type").notNull().default("auto"),
  sessionType: text("session_type").notNull().default("chat"),
  title: text("title").notNull().default("New Chat"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLegalChatSessionSchema = createInsertSchema(legalChatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLegalChatSession = z.infer<typeof insertLegalChatSessionSchema>;
export type LegalChatSession = typeof legalChatSessions.$inferSelect;

export const legalChatMessages = pgTable("legal_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  agentType: text("agent_type").notNull().default("auto"),
  agentSelected: text("agent_selected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLegalChatMessageSchema = createInsertSchema(legalChatMessages).omit({ id: true, createdAt: true });
export type InsertLegalChatMessage = z.infer<typeof insertLegalChatMessageSchema>;
export type LegalChatMessage = typeof legalChatMessages.$inferSelect;

// ==================== CHATBOT TEMPLATES ====================

export const chatbotTemplates = pgTable("chatbot_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").default("Umum"),
  tags: jsonb("tags").default([]),
  agentConfig: jsonb("agent_config").notNull(),
  thumbnailColor: text("thumbnail_color").default("#6366f1"),
  isFeatured: boolean("is_featured").default(false),
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  createdByUserId: varchar("created_by_user_id", { length: 255 }),
  createdByName: text("created_by_name").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatbotTemplateSchema = createInsertSchema(chatbotTemplates).omit({ id: true, createdAt: true, usageCount: true });
export type InsertChatbotTemplate = z.infer<typeof insertChatbotTemplateSchema>;
export type ChatbotTemplate = typeof chatbotTemplates.$inferSelect;

// ==================== USER ONBOARDING FLAGS ====================

export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  starterCreated: boolean("starter_created").default(false),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== STORE (MARKETPLACE PRODUK CHATBOT) ====================

export const storeProducts = pgTable("store_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").default("Konstruksi"),
  price: integer("price").notNull().default(0),
  agentId: integer("agent_id"),
  features: jsonb("features").default([]),
  emoji: text("emoji").default("🤖"),
  color: text("color").default("#6366f1"),
  isActive: boolean("is_active").default(true),
  isGustafta: boolean("is_gustafta").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Store catalog builder filters active products by category.
  activeCategoryIdx: index("store_products_active_category_idx").on(table.isActive, table.category),
}));

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({ id: true, createdAt: true });
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;
export type StoreProduct = typeof storeProducts.$inferSelect;

export const storeOrders = pgTable("store_orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  // Agen sumber pesanan (bila beli per-agen). Nullable untuk pesanan produk katalog.
  agentId: integer("agent_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").default(""),
  amount: integer("amount").notNull(),
  // Bagi hasil marketplace 80/20 dari LISENSI (bulanan tetap 100% platform, tak di sini).
  // creatorUserId diisi hanya bila produk buatan kreator (agent.userId non-kosong).
  creatorUserId: text("creator_user_id"),
  creatorShare: integer("creator_share").default(0),
  platformShare: integer("platform_share").default(0),
  midtransOrderId: text("midtrans_order_id").notNull().unique(),
  accessToken: text("access_token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStoreOrderSchema = createInsertSchema(storeOrders).omit({ id: true, createdAt: true });
export type InsertStoreOrder = z.infer<typeof insertStoreOrderSchema>;
export type StoreOrder = typeof storeOrders.$inferSelect;

// Arsip Laporan Riset (Fase 2 war-room claw marketing) — tiap laporan yang
// disimpan pengguna menumpuk jadi riwayat per (userId, agentSlug), bisa
// dibuka/diekspor/dihapus. Milik pengguna (bukan agen sistem bersama).
export const researchReports = pgTable("research_reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  agentSlug: text("agent_slug").notNull(),
  agentName: text("agent_name").default(""),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userSlugIdx: index("research_reports_user_slug_idx").on(t.userId, t.agentSlug),
}));

export const insertResearchReportSchema = createInsertSchema(researchReports).omit({ id: true, createdAt: true });
export type InsertResearchReport = z.infer<typeof insertResearchReportSchema>;
export type ResearchReport = typeof researchReports.$inferSelect;

// ── Scalev Product Mappings ──────────────────────────────────────────────────
export const scalevMappings = pgTable("scalev_mappings", {
  id: serial("id").primaryKey(),
  scalevProductName: text("scalev_product_name").notNull(),
  type: text("type").notNull().default("chatbot"), // "chatbot" | "modul" | "bundle" | "ebook"
  agentId: integer("agent_id"),
  bigIdeaId: integer("big_idea_id"),
  agentIds: jsonb("agent_ids").$type<number[]>(), // for "bundle" type
  label: text("label").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScalevMappingSchema = createInsertSchema(scalevMappings).omit({ id: true, createdAt: true });
export type InsertScalevMapping = z.infer<typeof insertScalevMappingSchema>;
export type ScalevMapping = typeof scalevMappings.$inferSelect;

// ==================== LMS (Learning Management System) ====================

export const lmsCourses = pgTable("lms_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  shortDesc: text("short_desc").default(""),
  description: text("description").default(""),
  category: text("category").notNull().default("onboarding"), // onboarding | konstruksi | demo
  subcategory: text("subcategory").default(""),
  thumbnail: text("thumbnail").default(""),
  color: text("color").default("#6366f1"),
  emoji: text("emoji").default("📚"),
  instructor: text("instructor").default("Tim Gustafta"),
  durationMinutes: integer("duration_minutes").default(0),
  price: integer("price").notNull().default(0),
  level: text("level").default("beginner"),
  tags: jsonb("tags").default([]),
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLmsCourseSchema = createInsertSchema(lmsCourses).omit({ id: true, createdAt: true });
export type InsertLmsCourse = z.infer<typeof insertLmsCourseSchema>;
export type LmsCourse = typeof lmsCourses.$inferSelect;

export const lmsLessons = pgTable("lms_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").default(""),
  videoUrl: text("video_url").default(""),
  type: text("type").default("article"),
  durationMinutes: integer("duration_minutes").default(5),
  sortOrder: integer("sort_order").default(0),
  isPreview: boolean("is_preview").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLmsLessonSchema = createInsertSchema(lmsLessons).omit({ id: true, createdAt: true });
export type InsertLmsLesson = z.infer<typeof insertLmsLessonSchema>;
export type LmsLesson = typeof lmsLessons.$inferSelect;

export const lmsEnrollments = pgTable("lms_enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").default(0),
  completedAt: timestamp("completed_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const insertLmsEnrollmentSchema = createInsertSchema(lmsEnrollments).omit({ id: true, enrolledAt: true });
export type InsertLmsEnrollment = z.infer<typeof insertLmsEnrollmentSchema>;
export type LmsEnrollment = typeof lmsEnrollments.$inferSelect;

export const lmsLessonProgress = pgTable("lms_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  courseId: integer("course_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertLmsLessonProgressSchema = createInsertSchema(lmsLessonProgress).omit({ id: true, completedAt: true });
export type InsertLmsLessonProgress = z.infer<typeof insertLmsLessonProgressSchema>;
export type LmsLessonProgress = typeof lmsLessonProgress.$inferSelect;

// ==================== TENDER ALERT PROFILES ====================
// Profil bisnis BUJK untuk notifikasi tender harian (WA/Email jam 08:00 WIB)
export const tenderAlertProfiles = pgTable("tender_alert_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  companyName: text("company_name").default(""),
  // Filter preferensi tender
  sectors:      text("sectors").array().notNull().default(["konstruksi"]),  // konstruksi | oil_gas | pertambangan | energi
  kualifikasi:  text("kualifikasi").array().notNull().default([]),           // Kecil | Menengah | Besar
  wilayah:      text("wilayah").array().notNull().default([]),               // provinsi/kab/kota
  keywords:     text("keywords").array().notNull().default([]),              // kata kunci paket
  minBudgetJuta: integer("min_budget_juta"),                                 // min pagu (juta Rp)
  maxBudgetJuta: integer("max_budget_juta"),                                 // max pagu (juta Rp)
  // Saluran notifikasi
  waPhone:       text("wa_phone").default(""),    // no WA (format: 628xxx)
  email:         text("email").default(""),
  notifEnabled:  boolean("notif_enabled").default(true),
  // Meta
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTenderAlertProfileSchema = createInsertSchema(tenderAlertProfiles).omit({
  id: true, createdAt: true, updatedAt: true, lastNotifiedAt: true,
});
export type InsertTenderAlertProfile = z.infer<typeof insertTenderAlertProfileSchema>;
export type TenderAlertProfile = typeof tenderAlertProfiles.$inferSelect;

// ==================== SYSTEM CONFIG ====================
// Simple key-value store for platform-level settings (e.g. production URL)
export const systemConfig = pgTable("system_config", {
  key:       text("key").primaryKey(),
  value:     text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== AGENTIC DELIVERABLES ====================
// Structured artifacts produced by MultiClaw L4 orchestration (per agent/session)
export const agenticDeliverables = pgTable("agentic_deliverables", {
  id:        serial("id").primaryKey(),
  agentId:   integer("agent_id").notNull(),
  type:      text("type").notNull(),         // CLARIFYING_QUESTIONS | CHECKLIST | TIMELINE | ANSWER_SUMMARY
  title:     text("title").notNull().default(""),
  content:   jsonb("content").notNull().default({}),  // structured payload (jsonb)
  status:    text("status").notNull().default("open"), // open | needs_input | resolved | archived
  dedupeKey: text("dedupe_key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgenticDeliverableSchema = createInsertSchema(agenticDeliverables).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertAgenticDeliverable = z.infer<typeof insertAgenticDeliverableSchema>;
export type AgenticDeliverable = typeof agenticDeliverables.$inferSelect;

// ==================== WORKROOMS (Fase 1 — ruang kerja manusia + agen) ====================
// Ruang kerja: workflow bertahap → Human Gate ◆ → log → deliverable pack.
export const workrooms = pgTable("workrooms", {
  id:           serial("id").primaryKey(),
  userId:       varchar("user_id", { length: 255 }).notNull(),
  title:        text("title").notNull(),
  domain:       text("domain").notNull().default("tender"), // tender | (future domains)
  status:       text("status").notNull().default("active"),  // active | done | archived
  currentStage: integer("current_stage").notNull().default(0),
  stages:       jsonb("stages").notNull().default([]),  // [{key,label,status}]
  context:      jsonb("context").notNull().default({}), // data domain (mis. detail tender)
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("workrooms_user_idx").on(t.userId),
}));

export const insertWorkroomSchema = createInsertSchema(workrooms).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertWorkroom = z.infer<typeof insertWorkroomSchema>;
export type Workroom = typeof workrooms.$inferSelect;

// Gerbang persetujuan manusia ◆ (mis. sebelum submit tender)
export const workroomGates = pgTable("workroom_gates", {
  id:         serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  stageKey:   text("stage_key").notNull().default(""),
  question:   text("question").notNull(),
  status:     text("status").notNull().default("pending"), // pending | approved | rejected
  note:       text("note").notNull().default(""),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  decidedAt:  timestamp("decided_at"),
}, (t) => ({
  wrIdx: index("workroom_gates_wr_idx").on(t.workroomId),
}));

export const insertWorkroomGateSchema = createInsertSchema(workroomGates).omit({
  id: true, createdAt: true, decidedAt: true,
});
export type InsertWorkroomGate = z.infer<typeof insertWorkroomGateSchema>;
export type WorkroomGate = typeof workroomGates.$inferSelect;

// Catatan kerja: keputusan / asumsi / risiko / perubahan / deliverable
export const workroomLogs = pgTable("workroom_logs", {
  id:         serial("id").primaryKey(),
  workroomId: integer("workroom_id").notNull(),
  type:       text("type").notNull().default("note"), // decision | assumption | risk | change | note | deliverable
  content:    text("content").notNull(),
  meta:       jsonb("meta").notNull().default({}),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  wrIdx: index("workroom_logs_wr_idx").on(t.workroomId),
}));

export const insertWorkroomLogSchema = createInsertSchema(workroomLogs).omit({
  id: true, createdAt: true,
});
export type InsertWorkroomLog = z.infer<typeof insertWorkroomLogSchema>;
export type WorkroomLog = typeof workroomLogs.$inferSelect;

// ==================== DATA MASTER ====================

// Tabel Data BUJK Binaan — data perusahaan klien yang ditangani
export const bujkData = pgTable("bujk_data", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  namaPerusahaan: text("nama_perusahaan").notNull(),
  nib: text("nib").default(""),
  npwp: text("npwp").default(""),
  alamat: text("alamat").default(""),
  kabKota: text("kab_kota").default(""),
  provinsi: text("provinsi").default(""),
  picNama: text("pic_nama").default(""),
  picPhone: text("pic_phone").default(""),
  picEmail: text("pic_email").default(""),
  kualifikasi: text("kualifikasi").default(""),
  subklasifikasi: text("subklasifikasi").default(""),
  nomorSbu: text("nomor_sbu").default(""),
  statusSbu: text("status_sbu").default("aktif"),
  masaBerlakuSbu: text("masa_berlaku_sbu").default(""),
  catatan: text("catatan").default(""),
  tags: jsonb("tags").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBujkDataSchema = createInsertSchema(bujkData).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBujkData = z.infer<typeof insertBujkDataSchema>;
export type BujkData = typeof bujkData.$inferSelect;

// Tabel Harga Material & RAB — referensi harga internal
export const materialPrices = pgTable("material_prices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().default(""),
  kategori: text("kategori").notNull(),
  namaItem: text("nama_item").notNull(),
  satuan: text("satuan").default(""),
  hargaMin: integer("harga_min").default(0),
  hargaMax: integer("harga_max").default(0),
  hargaAcuan: integer("harga_acuan").default(0),
  sumber: text("sumber").default(""),
  wilayah: text("wilayah").default(""),
  tahunAnggaran: text("tahun_anggaran").default(""),
  catatan: text("catatan").default(""),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMaterialPriceSchema = createInsertSchema(materialPrices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaterialPrice = z.infer<typeof insertMaterialPriceSchema>;
export type MaterialPrice = typeof materialPrices.$inferSelect;

// ─── CertTracker: Biro Jasa Client & Certificate Management ──────────────────

export const bjClients = pgTable("bj_clients", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  companyName: text("company_name").notNull(),
  picName: text("pic_name").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  address: text("address").default(""),
  notes: text("notes").default(""),
  status: text("status").default("aktif"),
  contractValue: text("contract_value").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bjCertificates = pgTable("bj_certificates", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  certType: text("cert_type").notNull(),
  subType: text("sub_type").default(""),
  certNumber: text("cert_number").default(""),
  issuer: text("issuer").default(""),
  issuedDate: text("issued_date").default(""),
  expiryDate: text("expiry_date").notNull(),
  holderName: text("holder_name").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBjClientSchema = createInsertSchema(bjClients).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBjClient = z.infer<typeof insertBjClientSchema>;
export type BjClient = typeof bjClients.$inferSelect;

export const insertBjCertificateSchema = createInsertSchema(bjCertificates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBjCertificate = z.infer<typeof insertBjCertificateSchema>;
export type BjCertificate = typeof bjCertificates.$inferSelect;

// ─── TenderMate: Pipeline Tender Biro Jasa ───────────────────────────────────

export const bjTenders = pgTable("bj_tenders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clientId: integer("client_id"),
  tenderName: text("tender_name").notNull(),
  instansi: text("instansi").default(""),
  paguAnggaran: text("pagu_anggaran").default(""),
  lokasi: text("lokasi").default(""),
  kategori: text("kategori").default(""),
  metodePengadaan: text("metode_pengadaan").default(""),
  tanggalTender: text("tanggal_tender").default(""),
  deadlinePenawaran: text("deadline_penawaran").default(""),
  status: text("status").default("teridentifikasi"),
  nilaiKontrak: text("nilai_kontrak").default(""),
  sumberInfo: text("sumber_info").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBjTenderSchema = createInsertSchema(bjTenders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBjTender = z.infer<typeof insertBjTenderSchema>;
export type BjTender = typeof bjTenders.$inferSelect;

// ─── ClientHub: Aktivitas & Follow-up per Klien ───────────────────────────────

export const bjActivities = pgTable("bj_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clientId: integer("client_id").notNull(),
  type: text("type").default("catatan"),
  date: text("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bjFollowups = pgTable("bj_followups", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clientId: integer("client_id").notNull(),
  task: text("task").notNull(),
  dueDate: text("due_date").default(""),
  priority: text("priority").default("normal"),
  isDone: boolean("is_done").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBjActivitySchema = createInsertSchema(bjActivities).omit({ id: true, createdAt: true });
export type InsertBjActivity = z.infer<typeof insertBjActivitySchema>;
export type BjActivity = typeof bjActivities.$inferSelect;

export const insertBjFollowupSchema = createInsertSchema(bjFollowups).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBjFollowup = z.infer<typeof insertBjFollowupSchema>;
export type BjFollowup = typeof bjFollowups.$inferSelect;

// ─── SERTIVA: Digital Certificates ──────────────────────────────────────────
export const digitalCertificates = pgTable("digital_certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  verifyToken: varchar("verify_token", { length: 64 }).notNull().unique(),
  title: text("title").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientTitle: text("recipient_title").default(""),
  issuedBy: text("issued_by").notNull(),
  issuedByTitle: text("issued_by_title").default(""),
  competencyDomain: text("competency_domain").default(""),
  competencyUnit: text("competency_unit").default(""),
  level: text("level").default(""),
  description: text("description").default(""),
  template: text("template").default("standard"),
  status: text("status").default("active"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDigitalCertificateSchema = createInsertSchema(digitalCertificates).omit({ id: true, createdAt: true });
export type InsertDigitalCertificate = z.infer<typeof insertDigitalCertificateSchema>;
export type DigitalCertificate = typeof digitalCertificates.$inferSelect;

// ─── Access Codes: voucher akses peserta (mis. bonus seminar offline) ─────────
export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  plan: text("plan").notNull().default("profesional"),          // tier Gustafta yang diberikan
  durationDays: integer("duration_days").notNull().default(30),
  label: text("label").default(""),                              // mis. "Indobuildtech 2026"
  maxRedemptions: integer("max_redemptions").notNull().default(1),
  redemptionCount: integer("redemption_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdBy: varchar("created_by", { length: 255 }),            // userId admin pembuat
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accessCodeRedemptions = pgTable("access_code_redemptions", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  subscriptionId: varchar("subscription_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqRedemption: uniqueIndex("uniq_access_code_redemption").on(t.codeId, t.userId),
}));

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({ id: true, createdAt: true, redemptionCount: true });
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;
export type AccessCodeRedemption = typeof accessCodeRedemptions.$inferSelect;

// ─── Event Testimonials: testimoni peserta setelah membuat chatbot ────────────
// Dipakai pada Jalur Bonus (mis. Indobuildtech). source dibedakan hadir/online
// dari label kode akses yang ditukarkan (diturunkan di server, bukan dari klien).
export const eventTestimonials = pgTable("event_testimonials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: text("name").notNull(),                                 // nama tampil
  role: text("role").default(""),                               // profesi/peran
  rating: integer("rating").notNull().default(5),               // 1–5 bintang
  quote: text("quote").notNull(),                               // isi testimoni
  agentId: integer("agent_id"),                                 // chatbot yang dibuat (opsional)
  source: varchar("source", { length: 32 }).notNull().default("lainnya"), // hadir/online/lainnya
  featured: boolean("featured").notNull().default(false),       // tampil sebagai unggulan
  approved: boolean("approved").notNull().default(false),       // lolos moderasi (publik)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqUserTestimonial: uniqueIndex("uniq_event_testimonial_user").on(t.userId),
}));

export const insertEventTestimonialSchema = createInsertSchema(eventTestimonials).omit({
  id: true, createdAt: true, userId: true, source: true, featured: true, approved: true,
});
export type InsertEventTestimonial = z.infer<typeof insertEventTestimonialSchema>;
export type EventTestimonial = typeof eventTestimonials.$inferSelect;

// ─── Klinik Feedback: kesan & harapan pengunjung Klinik Konsultasi (publik) ────
// Form "pintu keluar" sederhana. Publik (tanpa login) — hanya menampung kesan
// terhadap platform Gustafta + harapan ke depan. Terpisah dari eventTestimonials
// (yang auth-gated & terikat jalur bonus acara).
export const klinikFeedback = pgTable("klinik_feedback", {
  id: serial("id").primaryKey(),
  name: text("name").default(""),         // nama (opsional)
  role: text("role").default(""),         // profesi/peran (opsional)
  rating: integer("rating").notNull().default(5), // 1–5 bintang
  kesan: text("kesan").notNull(),         // kesan terhadap platform
  harapan: text("harapan").default(""),   // harapan ke depan (opsional)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertKlinikFeedbackSchema = createInsertSchema(klinikFeedback).omit({
  id: true, createdAt: true,
});
export type InsertKlinikFeedback = z.infer<typeof insertKlinikFeedbackSchema>;
export type KlinikFeedback = typeof klinikFeedback.$inferSelect;

// ─── Rate-limit buckets (SHARED store, cross-instance) ────────────────────────
// Penghitung sliding-window bersama untuk rate limiter yang HARUS konsisten di
// banyak instance autoscale (mis. batas per-agen per jam untuk pemanggil anonim
// di `chatAgentIdRateLimiter`). Map in-memory hanya melindungi 1 proses; tabel
// ini menjadikan hitungan tunggal untuk semua instance. resetAt = epoch ms.
export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  bucketKey: varchar("bucket_key", { length: 255 }).primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: bigint("reset_at", { mode: "number" }).notNull(),
});

export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
