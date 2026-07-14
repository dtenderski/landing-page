import { eq, desc, and, sql, isNull, inArray, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { randomUUID } from "crypto";
import {
  agents,
  bigIdeas,
  toolboxes,
  knowledgeBases,
  knowledgeChunks,
  knowledgeTaxonomy,
  integrations,
  agentMessages,
  analyticsTable,
  subscriptionsTable,
  accessCodes,
  accessCodeRedemptions,
  eventTestimonials,
  klinikFeedback,
  ownerMonthlyUsageTable,
  userProfiles,
  projectBrainTemplates,
  projectBrainInstances,
  miniApps,
  miniAppResults,
  clientSubscriptions,
  affiliates,
  series,
  cores,
  vouchers,
  voucherRedemptions,
  userMemories,
  waContacts,
  waBroadcasts,
  waBroadcastRuns,
  tenderSources,
  tenders,
  tenderDocumentCatalog,
  tenderAlertProfiles,
  leads,
  scoringResults,
  companyProfiles,
  tenderSessions,
  chatbotTemplates,
  userOnboarding,
  storeProducts,
  storeOrders,
  researchReports,
  scalevMappings,
  agenticDeliverables,
  workrooms,
  workroomGates,
  workroomLogs,
  blueprints,
  organizationDrafts,
  sharedCertificates,
  agentCollaborators,
  pendingAgentInvites,
  certificationAuditLog,
  pendingPremiumDeliveries,
  notifications,
  partners,
} from "@shared/schema";
import { users } from "@shared/models/auth";
import type {
  TenderDocumentCatalog,
  InsertTenderDocumentCatalog,
  TenderAlertProfile,
  InsertTenderAlertProfile,
  ChatbotTemplate,
  InsertChatbotTemplate,
  StoreProduct,
  InsertStoreProduct,
  StoreOrder,
  InsertStoreOrder,
  ScalevMapping,
  InsertScalevMapping,
  AgenticDeliverable,
  InsertAgenticDeliverable,
  Workroom,
  InsertWorkroom,
  WorkroomGate,
  InsertWorkroomGate,
  WorkroomLog,
  InsertWorkroomLog,
  BlueprintRecord,
  InsertBlueprint,
  OrganizationDraftRecord,
  InsertOrganizationDraft,
  SharedCertificateRecord,
  InsertSharedCertificate,
} from "@shared/schema";
import { applyDefaultPolicies } from "./lib/agent-policies";
import { isPremiumClass, priceForClass } from "@shared/premium-classes";
import type { IStorage, CollaboratorView } from "./storage";

// Normalisasi agenticSubAgents: nilai bisa tersimpan sebagai jsonb array asli
// ATAU string JSON ganda (double-encoded) dari seed lama. Tanpa parse defensif,
// Array.isArray() gagal dan orkestrasi MultiClaw diam-diam tidak jalan.
export function parseSubAgentsValue(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* bukan JSON valid — jatuhkan ke [] */ }
  }
  return [];
}
import type { ConfigStorage } from "./services/blueprint-engine/configuration-engine";
import type { AgentCollaborator, CollaboratorRole, PendingAgentInvite, AppliedInviteGrant, Notification, InsertNotification, CertificationAudit } from "@shared/schema";
import type {
  Agent,
  InsertAgent,
  KnowledgeBase,
  InsertKnowledgeBase,
  KnowledgeTaxonomyNode,
  KnowledgeTaxonomyTreeNode,
  InsertKnowledgeTaxonomy,
  Integration,
  InsertIntegration,
  Message,
  InsertMessage,
  User,
  InsertUser,
  Analytics,
  InsertAnalytics,
  BigIdea,
  InsertBigIdea,
  Toolbox,
  InsertToolbox,
  UserProfile,
  InsertUserProfile,
  Subscription,
  InsertSubscription,
  ProjectBrainTemplate,
  InsertProjectBrainTemplate,
  ProjectBrainInstance,
  InsertProjectBrainInstance,
  MiniApp,
  InsertMiniApp,
  MiniAppResult,
  InsertMiniAppResult,
  ClientSubscription,
  InsertClientSubscription,
  Affiliate,
  InsertAffiliate,
  Series,
  InsertSeries,
  SeriesWithStats,
  SeriesWithHierarchy,
  Core,
  InsertCore,
  Voucher,
  InsertVoucher,
  VoucherRedemption,
  KnowledgeChunk,
  InsertKnowledgeChunk,
  UserMemory,
  InsertUserMemory,
  WaContact,
  InsertWaContact,
  WaBroadcast,
  InsertWaBroadcast,
  WaBroadcastRun,
  TenderSource,
  InsertTenderSource,
  Tender,
  InsertTender,
  Lead,
  InsertLead,
  ScoringResult,
  InsertScoringResult,
  CompanyProfile,
  InsertCompanyProfile,
  TenderSession,
  InsertTenderSession,
} from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

/**
 * Executor = koneksi DB normal (`db`) ATAU transaksi (`tx`) yang dilewatkan
 * `db.transaction(...)`. Metode tulis di bawah menerima parameter `exec` opsional
 * (default `db`) supaya bisa dijalankan di dalam SATU transaksi atomik (mis. Tahap
 * 21 — pembuatan organisasi/tim). Param trailing opsional → pemanggil lama aman.
 */
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Simple TTL In-Memory Cache ───────────────────────────────────────────────
class TtlCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void { this.store.delete(key); }

  deletePrefix(prefix: string): void {
    for (const k of Array.from(this.store.keys())) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  clear(): void { this.store.clear(); }

  size(): number { return this.store.size; }
}

// Cache instances — 5 menit TTL untuk agen, 3 menit untuk KB & chunks
const agentCache = new TtlCache<any>(5 * 60 * 1000);
const agentListCache = new TtlCache<any[]>(2 * 60 * 1000);
const kbCache = new TtlCache<any[]>(3 * 60 * 1000);
const chunkCache = new TtlCache<KnowledgeChunk[]>(3 * 60 * 1000);

export class DatabaseStorage implements IStorage {
  
  // User methods (placeholder - using Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return { ...insertUser, id: "", createdAt: new Date().toISOString() };
  }

  // User Profile methods
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      userId: row.userId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl || "",
      bio: row.bio || "",
      company: row.company || "",
      position: row.position || "",
      email: (row as any).email || "",
      phone: (row as any).phone || "",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const result = await db.insert(userProfiles).values({
      userId: insertProfile.userId,
      displayName: insertProfile.displayName,
      avatarUrl: insertProfile.avatarUrl || "",
      bio: insertProfile.bio || "",
      company: insertProfile.company || "",
      position: insertProfile.position || "",
      email: insertProfile.email || "",
      phone: insertProfile.phone || "",
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      userId: row.userId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl || "",
      bio: row.bio || "",
      company: row.company || "",
      position: row.position || "",
      email: (row as any).email || "",
      phone: (row as any).phone || "",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const result = await db.update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.userId, userId))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      userId: row.userId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl || "",
      bio: row.bio || "",
      company: row.company || "",
      position: row.position || "",
      email: (row as any).email || "",
      phone: (row as any).phone || "",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // Series methods
  private mapSeriesRow(row: any): Series {
    return {
      id: String(row.id),
      userId: row.userId || "",
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      tagline: row.tagline || "",
      coverImage: row.coverImage || "",
      color: row.color || "#6366f1",
      category: row.category || "",
      tags: (row.tags as string[]) || [],
      language: row.language || "id",
      isPublic: row.isPublic || false,
      isActive: row.isActive || false,
      isFeatured: row.isFeatured || false,
      sortOrder: row.sortOrder || 0,
      createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async getSeries(): Promise<Series[]> {
    const result = await db.select().from(series).orderBy(series.sortOrder);
    return result.map(row => this.mapSeriesRow(row));
  }

  async getSeriesById(id: string): Promise<Series | undefined> {
    const result = await db.select().from(series).where(eq(series.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapSeriesRow(result[0]);
  }

  async getSeriesBySlug(slug: string): Promise<Series | undefined> {
    const result = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
    if (result.length === 0) return undefined;
    return this.mapSeriesRow(result[0]);
  }

  async getPublicSeries(): Promise<SeriesWithStats[]> {
    const allSeries = await db.select().from(series)
      .where(and(eq(series.isPublic, true), eq(series.isActive, true)))
      .orderBy(series.sortOrder);

    const result: SeriesWithStats[] = [];
    for (const s of allSeries) {
      const mapped = this.mapSeriesRow(s);
      const biRows = await db.select().from(bigIdeas).where(eq(bigIdeas.seriesId, s.id));
      const biIds = biRows.map(b => b.id);
      let totalToolboxes = 0;
      let totalAgents = 0;
      for (const biId of biIds) {
        const tbRows = await db.select().from(toolboxes).where(eq(toolboxes.bigIdeaId, biId));
        totalToolboxes += tbRows.length;
        for (const tb of tbRows) {
          const agentRows = await db.select({ id: agents.id }).from(agents).where(eq(agents.toolboxId, tb.id));
          totalAgents += agentRows.length;
        }
      }
      const coreCount = await db.select({ id: cores.id }).from(cores).where(eq(cores.seriesId, s.id));
      result.push({ ...mapped, totalBigIdeas: biIds.length, totalToolboxes, totalAgents, totalCores: coreCount.length });
    }
    return result;
  }

  async getSeriesWithHierarchy(id: string): Promise<SeriesWithHierarchy | undefined> {
    const sid = parseInt(id);
    if (isNaN(sid)) {
      const bySlug = await db.select().from(series).where(eq(series.slug, id)).limit(1);
      if (bySlug.length === 0) return undefined;
      return this.getSeriesWithHierarchy(String(bySlug[0].id));
    }

    const sRows = await db.select().from(series).where(eq(series.id, sid)).limit(1);
    if (sRows.length === 0) return undefined;
    const mapped = this.mapSeriesRow(sRows[0]);

    const coreRows = await db.select().from(cores)
      .where(eq(cores.seriesId, sid))
      .orderBy(cores.sortOrder);

    const biRows = await db.select().from(bigIdeas)
      .where(eq(bigIdeas.seriesId, sid))
      .orderBy(bigIdeas.sortOrder);

    let totalToolboxes = 0;
    let totalAgents = 0;

    const buildBigIdeaWithToolboxes = async (bi: any) => {
      const tbRows = await db.select().from(toolboxes)
        .where(eq(toolboxes.bigIdeaId, bi.id))
        .orderBy(toolboxes.sortOrder);

      const toolboxesWithAgents = [];
      for (const tb of tbRows) {
        totalToolboxes++;
        const agentRows = await db.select().from(agents).where(eq(agents.toolboxId, tb.id));
        totalAgents += agentRows.length;
        toolboxesWithAgents.push({
          id: String(tb.id),
          bigIdeaId: tb.bigIdeaId ? String(tb.bigIdeaId) : undefined,
          seriesId: tb.seriesId ? String(tb.seriesId) : undefined,
          isOrchestrator: tb.isOrchestrator || false,
          name: tb.name,
          description: tb.description || "",
          purpose: tb.purpose || "",
          capabilities: (tb.capabilities as string[]) || [],
          limitations: (tb.limitations as string[]) || [],
          sortOrder: tb.sortOrder || 0,
          isActive: tb.isActive || false,
          createdAt: tb.createdAt.toISOString(),
          agents: agentRows.map(a => ({
            id: String(a.id),
            name: a.name,
            description: a.description || "",
            avatar: a.avatar || "",
            tagline: a.tagline || "",
            category: a.category || "",
            subcategory: a.subcategory || "",
            isPublic: a.isPublic || false,
            isActive: a.isActive || false,
            widgetColor: a.widgetColor || "#6366f1",
            isOrchestrator: a.isOrchestrator || false,
            orchestratorRole: a.orchestratorRole || "standalone",
          })),
        });
      }

      return {
        ...this.mapBigIdeaRow(bi),
        toolboxes: toolboxesWithAgents,
      };
    };

    const coresWithBigIdeas = [];
    for (const c of coreRows) {
      const coreBigIdeas = biRows.filter(bi => bi.coreId === c.id);
      const coreBigIdeasMapped = [];
      for (const bi of coreBigIdeas) {
        coreBigIdeasMapped.push(await buildBigIdeaWithToolboxes(bi));
      }
      coresWithBigIdeas.push({
        ...this.mapCoreRow(c),
        bigIdeas: coreBigIdeasMapped,
      });
    }

    const ungroupedBigIdeas = biRows.filter(bi => !bi.coreId);
    const ungroupedMapped = [];
    for (const bi of ungroupedBigIdeas) {
      ungroupedMapped.push(await buildBigIdeaWithToolboxes(bi));
    }

    // === FIX: Fetch orchestrator toolboxes that bypass BigIdea (seriesId-only, no bigIdeaId) ===
    const seriesOrchestratorTbRows = await db.select().from(toolboxes)
      .where(and(
        eq(toolboxes.seriesId, sid),
        eq(toolboxes.isOrchestrator, true),
        isNull(toolboxes.bigIdeaId)
      ))
      .orderBy(toolboxes.sortOrder);

    const orchestratorToolboxes = [];
    for (const tb of seriesOrchestratorTbRows) {
      totalToolboxes++;
      const agentRows = await db.select().from(agents).where(eq(agents.toolboxId, tb.id));
      totalAgents += agentRows.length;
      orchestratorToolboxes.push({
        id: String(tb.id),
        bigIdeaId: undefined,
        seriesId: String(sid),
        isOrchestrator: true,
        name: tb.name,
        description: tb.description || "",
        purpose: tb.purpose || "",
        capabilities: (tb.capabilities as string[]) || [],
        limitations: (tb.limitations as string[]) || [],
        sortOrder: tb.sortOrder || 0,
        isActive: tb.isActive || false,
        createdAt: tb.createdAt.toISOString(),
        agents: agentRows.map(a => ({
          id: String(a.id),
          name: a.name,
          description: a.description || "",
          avatar: a.avatar || "",
          tagline: a.tagline || "",
          category: a.category || "",
          subcategory: a.subcategory || "",
          isPublic: a.isPublic || false,
          isActive: a.isActive || false,
          widgetColor: a.widgetColor || "#6366f1",
          isOrchestrator: a.isOrchestrator || false,
          orchestratorRole: a.orchestratorRole || "orchestrator",
        })),
      });
    }

    return {
      ...mapped,
      totalBigIdeas: biRows.length,
      totalToolboxes,
      totalAgents,
      totalCores: coreRows.length,
      cores: coresWithBigIdeas,
      bigIdeas: ungroupedMapped,
      orchestratorToolboxes, // Series-level orchestrators that bypass BigIdea
    };
  }

  async createSeries(data: InsertSeries, userId: string): Promise<Series> {
    const result = await db.insert(series).values({
      userId,
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      tagline: data.tagline || "",
      coverImage: data.coverImage || "",
      color: data.color || "#6366f1",
      category: data.category || "",
      tags: data.tags || [],
      language: data.language || "id",
      isPublic: data.isPublic || false,
      isFeatured: data.isFeatured || false,
      sortOrder: data.sortOrder || 0,
      isActive: true,
    }).returning();
    return this.mapSeriesRow(result[0]);
  }

  async updateSeries(id: string, data: Partial<InsertSeries>): Promise<Series | undefined> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const result = await db.update(series)
      .set(updateData)
      .where(eq(series.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapSeriesRow(result[0]);
  }

  async deleteSeries(id: string): Promise<boolean> {
    // Cascade: hapus semua bigIdeas (yang akan cascade ke toolboxes & agents),
    // lalu toolboxes yang langsung tertaut ke series (orchestrator level series).
    const sid = parseInt(id);
    const childBigIdeas = await db.select().from(bigIdeas).where(eq(bigIdeas.seriesId, sid));
    for (const bi of childBigIdeas) {
      await this.deleteBigIdea(String(bi.id));
    }
    const directToolboxes = await db.select().from(toolboxes).where(eq(toolboxes.seriesId, sid));
    for (const tb of directToolboxes) {
      await this.deleteToolbox(String(tb.id));
    }
    const result = await db.delete(series).where(eq(series.id, sid)).returning();
    return result.length > 0;
  }

  // Core methods
  private mapCoreRow(row: any): Core {
    return {
      id: String(row.id),
      seriesId: String(row.seriesId),
      name: row.name,
      description: row.description || "",
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getCores(seriesId?: string): Promise<Core[]> {
    const query = seriesId
      ? db.select().from(cores).where(eq(cores.seriesId, parseInt(seriesId))).orderBy(cores.sortOrder)
      : db.select().from(cores).orderBy(cores.sortOrder);
    const result = await query;
    return result.map(r => this.mapCoreRow(r));
  }

  async getCore(id: string): Promise<Core | undefined> {
    const result = await db.select().from(cores).where(eq(cores.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapCoreRow(result[0]);
  }

  async createCore(data: InsertCore): Promise<Core> {
    const result = await db.insert(cores).values({
      seriesId: parseInt(data.seriesId),
      name: data.name,
      description: data.description || "",
      sortOrder: data.sortOrder || 0,
      isActive: true,
    }).returning();
    return this.mapCoreRow(result[0]);
  }

  async updateCore(id: string, data: Partial<InsertCore>): Promise<Core | undefined> {
    const updateData: any = { ...data };
    if ('seriesId' in updateData && updateData.seriesId) {
      updateData.seriesId = parseInt(updateData.seriesId);
    }
    const result = await db.update(cores).set(updateData).where(eq(cores.id, parseInt(id))).returning();
    if (result.length === 0) return undefined;
    return this.mapCoreRow(result[0]);
  }

  async deleteCore(id: string): Promise<boolean> {
    await db.update(bigIdeas).set({ coreId: null }).where(eq(bigIdeas.coreId, parseInt(id)));
    const result = await db.delete(cores).where(eq(cores.id, parseInt(id))).returning();
    return result.length > 0;
  }

  // Big Idea methods
  private mapBigIdeaRow(row: any): BigIdea {
    return {
      id: String(row.id),
      name: row.name,
      slug: (row as any).slug || null,
      type: row.type as "problem" | "idea" | "inspiration" | "mentoring",
      description: row.description,
      goals: (row.goals as string[]) || [],
      targetAudience: row.targetAudience || "",
      expectedOutcome: row.expectedOutcome || "",
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      coreId: row.coreId ? String(row.coreId) : undefined,
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      monthlyPrice: row.monthlyPrice ?? 0,
      trialEnabled: row.trialEnabled ?? true,
      trialDays: row.trialDays ?? 7,
      requireRegistration: row.requireRegistration ?? false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getBigIdeas(seriesId?: string): Promise<BigIdea[]> {
    const query = seriesId
      ? db.select().from(bigIdeas).where(eq(bigIdeas.seriesId, parseInt(seriesId))).orderBy(desc(bigIdeas.createdAt))
      : db.select().from(bigIdeas).orderBy(desc(bigIdeas.createdAt));
    const result = await query;
    return result.map(row => this.mapBigIdeaRow(row));
  }

  async getBigIdea(id: string): Promise<BigIdea | undefined> {
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      const result = await db.select().from(bigIdeas).where(eq(bigIdeas.id, numId)).limit(1);
      if (result.length > 0) return this.mapBigIdeaRow(result[0]);
    }
    // Fallback: slug lookup
    const bySlug = await db.select().from(bigIdeas).where(eq(bigIdeas.slug, id)).limit(1);
    if (bySlug.length > 0) return this.mapBigIdeaRow(bySlug[0]);
    return undefined;
  }

  async getActiveBigIdea(): Promise<BigIdea | null> {
    const result = await db.select().from(bigIdeas).where(eq(bigIdeas.isActive, true)).limit(1);
    if (result.length === 0) return null;
    return this.mapBigIdeaRow(result[0]);
  }

  async createBigIdea(insertBigIdea: InsertBigIdea): Promise<BigIdea> {
    const result = await db.insert(bigIdeas).values({
      name: insertBigIdea.name,
      type: insertBigIdea.type,
      description: insertBigIdea.description,
      goals: insertBigIdea.goals || [],
      targetAudience: insertBigIdea.targetAudience || "",
      expectedOutcome: insertBigIdea.expectedOutcome || "",
      seriesId: insertBigIdea.seriesId ? parseInt(insertBigIdea.seriesId) : null,
      coreId: insertBigIdea.coreId ? parseInt(insertBigIdea.coreId) : null,
      sortOrder: insertBigIdea.sortOrder || 0,
      isActive: true,
      monthlyPrice: insertBigIdea.monthlyPrice ?? 0,
      trialEnabled: insertBigIdea.trialEnabled ?? true,
      trialDays: insertBigIdea.trialDays ?? 7,
      requireRegistration: insertBigIdea.requireRegistration ?? false,
    }).returning();
    return this.mapBigIdeaRow(result[0]);
  }

  async updateBigIdea(id: string, data: Partial<InsertBigIdea>): Promise<BigIdea | undefined> {
    const updateData: any = { ...data };
    if ('seriesId' in updateData) {
      if (updateData.seriesId && typeof updateData.seriesId === 'string' && updateData.seriesId.trim() !== '') {
        updateData.seriesId = parseInt(updateData.seriesId);
      } else {
        updateData.seriesId = null;
      }
    }
    if ('coreId' in updateData) {
      if (updateData.coreId && typeof updateData.coreId === 'string' && updateData.coreId.trim() !== '') {
        updateData.coreId = parseInt(updateData.coreId);
      } else {
        updateData.coreId = null;
      }
    }
    const result = await db.update(bigIdeas)
      .set(updateData)
      .where(eq(bigIdeas.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapBigIdeaRow(result[0]);
  }

  async setActiveBigIdea(id: string): Promise<BigIdea | undefined> {
    const result = await db.update(bigIdeas)
      .set({ isActive: true })
      .where(eq(bigIdeas.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapBigIdeaRow(result[0]);
  }

  async deleteBigIdea(id: string): Promise<boolean> {
    // Cascade: hapus semua toolboxes anak (yang akan cascade ke agents).
    const bid = parseInt(id);
    const childToolboxes = await db.select().from(toolboxes).where(eq(toolboxes.bigIdeaId, bid));
    for (const tb of childToolboxes) {
      await this.deleteToolbox(String(tb.id));
    }
    const result = await db.delete(bigIdeas).where(eq(bigIdeas.id, bid)).returning();
    return result.length > 0;
  }

  // Toolbox methods
  async getToolboxes(bigIdeaId?: string, seriesId?: string): Promise<Toolbox[]> {
    const query = bigIdeaId 
      ? db.select().from(toolboxes).where(eq(toolboxes.bigIdeaId, parseInt(bigIdeaId))).orderBy(toolboxes.sortOrder)
      : seriesId
        ? db.select().from(toolboxes).where(eq(toolboxes.seriesId, parseInt(seriesId))).orderBy(toolboxes.sortOrder)
        : db.select().from(toolboxes).orderBy(toolboxes.sortOrder);
    const result = await query;
    return result.map(row => ({
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getToolbox(id: string): Promise<Toolbox | undefined> {
    const result = await db.select().from(toolboxes).where(eq(toolboxes.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getActiveToolbox(): Promise<Toolbox | null> {
    const result = await db.select().from(toolboxes).where(eq(toolboxes.isActive, true)).limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return {
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createToolbox(insertToolbox: InsertToolbox): Promise<Toolbox> {
    const result = await db.insert(toolboxes).values({
      bigIdeaId: insertToolbox.bigIdeaId ? parseInt(insertToolbox.bigIdeaId) : null,
      seriesId: insertToolbox.seriesId ? parseInt(insertToolbox.seriesId) : null,
      isOrchestrator: insertToolbox.isOrchestrator || false,
      name: insertToolbox.name,
      description: insertToolbox.description || "",
      purpose: insertToolbox.purpose || "",
      capabilities: insertToolbox.capabilities || [],
      limitations: insertToolbox.limitations || [],
      sortOrder: insertToolbox.sortOrder || 0,
      isActive: true,
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateToolbox(id: string, data: Partial<InsertToolbox>): Promise<Toolbox | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.capabilities !== undefined) updateData.capabilities = data.capabilities;
    if (data.limitations !== undefined) updateData.limitations = data.limitations;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isOrchestrator !== undefined) updateData.isOrchestrator = data.isOrchestrator;
    if (data.seriesId !== undefined) updateData.seriesId = data.seriesId ? parseInt(data.seriesId) : null;
    if (data.bigIdeaId !== undefined) {
      updateData.bigIdeaId = data.bigIdeaId ? parseInt(data.bigIdeaId) : null;
      // === FIX: Auto-sync seriesId when bigIdeaId changes ===
      if (data.bigIdeaId && data.seriesId === undefined) {
        const biRows = await db.select().from(bigIdeas).where(eq(bigIdeas.id, parseInt(data.bigIdeaId))).limit(1);
        if (biRows.length > 0 && biRows[0].seriesId) {
          updateData.seriesId = biRows[0].seriesId;
        }
      }
    }
    
    const result = await db.update(toolboxes)
      .set(updateData)
      .where(eq(toolboxes.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async setActiveToolbox(id: string): Promise<Toolbox | undefined> {
    const result = await db.update(toolboxes)
      .set({ isActive: true })
      .where(eq(toolboxes.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getOrchestratorToolbox(seriesId: string): Promise<Toolbox | null> {
    const result = await db.select().from(toolboxes)
      .where(and(eq(toolboxes.seriesId, parseInt(seriesId)), eq(toolboxes.isOrchestrator, true)))
      .limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return {
      id: String(row.id),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      seriesId: row.seriesId ? String(row.seriesId) : undefined,
      isOrchestrator: row.isOrchestrator || false,
      name: row.name,
      description: row.description || "",
      purpose: row.purpose || "",
      capabilities: (row.capabilities as string[]) || [],
      limitations: (row.limitations as string[]) || [],
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteToolbox(id: string): Promise<boolean> {
    // Cascade: hapus semua agents anak.
    const tid = parseInt(id);
    const childAgents = await db.select().from(agents).where(eq(agents.toolboxId, tid));
    for (const ag of childAgents) {
      await this.deleteAgent(String(ag.id));
    }
    const result = await db.delete(toolboxes).where(eq(toolboxes.id, tid)).returning();
    return result.length > 0;
  }

  // Agent methods
  async getAgents(toolboxId?: string): Promise<Agent[]> {
    const cacheKey = `list:${toolboxId ?? "all"}`;
    const cached = agentListCache.get(cacheKey);
    if (cached) return cached;

    const query = toolboxId 
      ? db.select().from(agents).where(eq(agents.toolboxId, parseInt(toolboxId))).orderBy(desc(agents.createdAt))
      : db.select().from(agents).orderBy(desc(agents.createdAt));
    const result = await query;
    const mapped = result.map(row => this.mapAgentRow(row));
    agentListCache.set(cacheKey, mapped);
    // Populate individual cache entries while we have the data
    for (const a of mapped) agentCache.set(String(a.id), a);
    return mapped;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const cached = agentCache.get(id);
    if (cached) return cached;

    const result = await db.select().from(agents).where(eq(agents.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    const mapped = this.mapAgentRow(result[0]);
    agentCache.set(id, mapped);
    return mapped;
  }

  async getActiveAgent(): Promise<Agent | null> {
    const cached = agentCache.get("__active__");
    if (cached) return cached;

    const result = await db.select().from(agents).where(eq(agents.isActive, true)).limit(1);
    if (result.length === 0) return null;
    const mapped = this.mapAgentRow(result[0]);
    agentCache.set("__active__", mapped);
    return mapped;
  }

  async createAgent(insertAgent: InsertAgent, execOrUserId: Executor | string = db): Promise<Agent> {
    // Kompatibilitas argumen kedua:
    //  - Executor (mis. `tx` transaksi) → dipakai sebagai executor DB.
    //  - string → PENINGGALAN signature lama `(insert, userId)`. ~40 seed lama
    //    masih mengirim userId (mis. "49465846") sebagai arg kedua. Kita HANYA
    //    memakainya untuk cegah crash (pakai `db`), TAPI TIDAK menyetelnya sebagai
    //    pemilik: agen seed resmi Gustafta harus tetap user_id="" agar tidak salah
    //    diklasifikasi sebagai produk kreator (gerbang Store + bagi hasil 80/20).
    const exec: Executor = typeof execOrUserId === "string" ? db : execOrUserId;
    // Kepemilikan HANYA dari insertAgent.userId (jalur blueprint/kreator), else "".
    const ownerUserId =
      (insertAgent as any).userId != null && (insertAgent as any).userId !== ""
        ? String((insertAgent as any).userId)
        : "";

    // Auto-generate access token if not provided
    const accessToken = insertAgent.accessToken || `gus_${randomUUID().replace(/-/g, "")}`;

    // Auto-fill 7 field Kebijakan Agen berdasarkan series chatbot.
    // Lookup series via toolboxId → (seriesId | bigIdeaId.seriesId).
    const seriesName = await this.lookupSeriesNameForAgent(insertAgent, exec);
    const filled = applyDefaultPolicies(insertAgent, seriesName);

    const result = await exec.insert(agents).values({
      userId: ownerUserId,
      name: insertAgent.name,
      description: insertAgent.description || "",
      avatar: insertAgent.avatar || "",
      tagline: insertAgent.tagline || "",
      philosophy: insertAgent.philosophy || "",
      offTopicHandling: insertAgent.offTopicHandling || "politely_redirect",
      systemPrompt: insertAgent.systemPrompt || "You are a helpful assistant.",
      temperature: insertAgent.temperature || 0.7,
      maxTokens: insertAgent.maxTokens || 1024,
      aiModel: insertAgent.aiModel || (insertAgent as any).model || "gpt-4o",
      customApiKey: insertAgent.customApiKey || "",
      customBaseUrl: insertAgent.customBaseUrl || "",
      customModelName: insertAgent.customModelName || "",
      greetingMessage: insertAgent.greetingMessage || "",
      conversationStarters: insertAgent.conversationStarters || [],
      language: insertAgent.language || "id",
      category: insertAgent.category || "",
      subcategory: insertAgent.subcategory || "",
      accessToken: accessToken,
      isPublic: insertAgent.isPublic || false,
      allowedDomains: insertAgent.allowedDomains || [],
      toolboxId: insertAgent.toolboxId ? parseInt(insertAgent.toolboxId) : null,
      bigIdeaId: insertAgent.bigIdeaId ? parseInt(insertAgent.bigIdeaId) : null,
      isOrchestrator: insertAgent.isOrchestrator || false,
      orchestratorRole: insertAgent.isOrchestrator ? "orchestrator" : (insertAgent.orchestratorRole || "standalone"),
      parentAgentId: insertAgent.parentAgentId ? parseInt(insertAgent.parentAgentId) : null,
      agenticMode: insertAgent.agenticMode || false,
      attentiveListening: insertAgent.attentiveListening ?? true,
      contextRetention: insertAgent.contextRetention || 10,
      proactiveAssistance: insertAgent.proactiveAssistance || false,
      learningEnabled: insertAgent.learningEnabled || false,
      emotionalIntelligence: insertAgent.emotionalIntelligence ?? true,
      multiStepReasoning: insertAgent.multiStepReasoning ?? true,
      selfCorrection: insertAgent.selfCorrection ?? true,
      personality: insertAgent.personality || "",
      expertise: insertAgent.expertise || [],
      communicationStyle: insertAgent.communicationStyle || "friendly",
      toneOfVoice: insertAgent.toneOfVoice || "professional",
      responseFormat: insertAgent.responseFormat || "conversational",
      avoidTopics: insertAgent.avoidTopics || [],
      keyPhrases: insertAgent.keyPhrases || [],
      widgetColor: insertAgent.widgetColor || "#6366f1",
      widgetPosition: insertAgent.widgetPosition || "bottom-right",
      widgetSize: insertAgent.widgetSize || "medium",
      widgetBorderRadius: insertAgent.widgetBorderRadius || "rounded",
      widgetShowBranding: insertAgent.widgetShowBranding ?? true,
      widgetWelcomeMessage: insertAgent.widgetWelcomeMessage || "",
      widgetButtonIcon: insertAgent.widgetButtonIcon || "chat",
      // Kebijakan Agen — auto-filled by applyDefaultPolicies above based on series.
      primaryOutcome: filled.primaryOutcome,
      conversationWinConditions: filled.conversationWinConditions,
      brandVoiceSpec: filled.brandVoiceSpec,
      interactionPolicy: filled.interactionPolicy,
      domainCharter: filled.domainCharter,
      qualityBar: filled.qualityBar,
      riskCompliance: filled.riskCompliance,
      orchestratorConfig: (filled as any).orchestratorConfig ?? {},
      // Sumbu harga TERPISAH: licenseClass/licensePrice (lisensi sekali bayar) vs monthlyPrice
      // (bulanan hosting/token). Bila berkelas premium, licensePrice DIIKAT ke band kelas.
      licenseClass: insertAgent.licenseClass ?? null,
      licensePrice: isPremiumClass(insertAgent.licenseClass ?? null)
        ? priceForClass(insertAgent.licenseClass as number)
        : (insertAgent.licensePrice ?? null),
      monthlyPrice: insertAgent.monthlyPrice ?? 0,
      paymentUrl: insertAgent.paymentUrl ?? "",
      isActive: true,
      slug: (insertAgent as any).slug || null,
      // Normalisasi tulis: seed lama sering mengirim JSON.stringify(cfg) —
      // tanpa parse, kolom jsonb menyimpan string ganda dan orkestrasi mati.
      agenticSubAgents: parseSubAgentsValue((insertAgent as any).agenticSubAgents),
    }).returning();
    const mapped = this.mapAgentRow(result[0]);
    // Hindari menyetel cache dengan baris yang BELUM commit (di dalam transaksi).
    // runInTransaction membersihkan cache setelah commit sukses.
    if (exec === db) {
      agentCache.set(String(mapped.id), mapped);
      agentListCache.clear();
    }
    return mapped;
  }

  /**
   * Resolve nama series untuk agen yang akan dibuat — dipakai untuk
   * memilih template Kebijakan Agen. Lookup chain:
   *   1. toolboxId → toolboxes.seriesId atau toolboxes.bigIdeaId → bigIdeas.seriesId
   *   2. bigIdeaId → bigIdeas.seriesId (untuk orchestrator)
   * Mengembalikan null jika tidak bisa di-resolve (helper akan fallback ke kategori default).
   */
  private async lookupSeriesNameForAgent(insertAgent: InsertAgent, exec: Executor = db): Promise<string | null> {
    try {
      let seriesId: number | null = null;

      const toolboxIdRaw = insertAgent.toolboxId ? parseInt(insertAgent.toolboxId) : null;
      if (toolboxIdRaw && !Number.isNaN(toolboxIdRaw)) {
        const tb = await exec.select().from(toolboxes).where(eq(toolboxes.id, toolboxIdRaw)).limit(1);
        if (tb.length > 0) {
          if (tb[0].seriesId) {
            seriesId = tb[0].seriesId;
          } else if (tb[0].bigIdeaId) {
            const bi = await exec.select().from(bigIdeas).where(eq(bigIdeas.id, tb[0].bigIdeaId)).limit(1);
            if (bi.length > 0 && bi[0].seriesId) seriesId = bi[0].seriesId;
          }
        }
      }

      if (!seriesId) {
        const bigIdeaIdRaw = insertAgent.bigIdeaId ? parseInt(insertAgent.bigIdeaId) : null;
        if (bigIdeaIdRaw && !Number.isNaN(bigIdeaIdRaw)) {
          const bi = await exec.select().from(bigIdeas).where(eq(bigIdeas.id, bigIdeaIdRaw)).limit(1);
          if (bi.length > 0 && bi[0].seriesId) seriesId = bi[0].seriesId;
        }
      }

      if (!seriesId) return null;
      const s = await exec.select().from(series).where(eq(series.id, seriesId)).limit(1);
      return s.length > 0 ? s[0].name : null;
    } catch (err) {
      console.error("[agent-policies] series lookup failed, falling back to default category:", err);
      return null;
    }
  }

  async updateAgent(id: string, data: Partial<InsertAgent>, exec: Executor = db): Promise<Agent | undefined> {
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "toolboxId" || key === "parentAgentId") {
          updateData[key] = value ? parseInt(value as string) : null;
        } else if (key === "agenticSubAgents") {
          // Backstop tulis: normalisasi string JSON ganda dari seed/admin
          // menjadi array asli agar kolom jsonb tidak menyimpan string.
          updateData[key] = parseSubAgentsValue(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    // Backstop harga lisensi (cover seed/admin/jalur langsung). Pakai kelas EFEKTIF:
    // kelas dari patch bila ada, jika tidak baca kelas tersimpan agen. Ini mencegah
    // pemanggil non-route mengubah HANYA licensePrice pada agen berkelas untuk melewati band.
    const touchesPricing = updateData.licenseClass !== undefined || updateData.licensePrice !== undefined;
    if (touchesPricing) {
      let effectiveClass = updateData.licenseClass;
      if (effectiveClass === undefined) {
        const existing = await exec.select({ licenseClass: agents.licenseClass })
          .from(agents).where(eq(agents.id, parseInt(id))).limit(1);
        effectiveClass = existing[0]?.licenseClass ?? null;
      }
      if (isPremiumClass(effectiveClass)) {
        updateData.licensePrice = priceForClass(effectiveClass as number);
      }
    }

    const result = await exec.update(agents)
      .set(updateData)
      .where(eq(agents.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const mapped = this.mapAgentRow(result[0]);
    // Di dalam transaksi: jangan sentuh cache (data belum commit) — runInTransaction
    // membersihkannya setelah commit sukses.
    if (exec === db) {
      agentCache.delete(id);
      agentCache.delete("__active__");
      agentListCache.clear();
      agentCache.set(id, mapped);
    }
    return mapped;
  }

  // Buat salinan privat sebuah agen master untuk seorang pemilik (pembeli).
  // Menyalin seluruh kolom agen + semua baris Knowledge Base-nya, lalu menandai
  // userId = pembeli sehingga authz (decideAgentMutation) otomatis mengizinkan
  // pemilik mengedit/menyegarkan pengetahuannya sendiri.
  async cloneAgentForOwner(masterAgentId: number, ownerUserId: string): Promise<Agent> {
    const [master] = await db.select().from(agents).where(eq(agents.id, masterAgentId));
    if (!master) throw new Error(`Agen master ${masterAgentId} tidak ditemukan`);

    const {
      id: _omitId,
      createdAt: _omitCreated,
      slug: _omitSlug,
      accessToken: _omitToken,
      ...rest
    } = master as any;

    const newToken = `gus_${randomUUID().replace(/-/g, "")}`;

    // ATOMIK: agen + KB + chunk dalam satu transaksi. Kalau ada langkah yang
    // gagal, SEMUA di-rollback — tidak ada salinan parsial (mis. agen tanpa KB)
    // yang bisa salah dianggap "sudah terkirim" oleh getCloneForOwner.
    const clone = await db.transaction(async (tx) => {
      const [created] = await tx.insert(agents).values({
        ...rest,
        userId: ownerUserId,
        isListed: false,
        isPublic: false,        // salinan privat: TIDAK boleh tampil/embed publik
        isActive: false,        // hindari bentrok dengan singleton active-agent global
        isEnabled: true,
        archived: false,
        slug: null,
        accessToken: newToken,
        // Jangan wariskan kredensial/endpoint milik penjual ke runtime pembeli.
        customApiKey: "",
        customBaseUrl: "",
        customModelName: "",
        premiumClass: "private",
        clonedFromAgentId: masterAgentId,
      }).returning();

      // Salin Knowledge Base milik master + chunk RAG-nya agar retrieval tetap jalan.
      const kbRows = await tx.select().from(knowledgeBases).where(eq(knowledgeBases.agentId, masterAgentId));
      for (const row of kbRows) {
        const { id: oldKbId, createdAt: _kcreated, ...kbRest } = row as any;
        const [newKb] = await tx.insert(knowledgeBases).values({ ...kbRest, agentId: created.id }).returning();
        const chunkRows = await tx.select().from(knowledgeChunks).where(eq(knowledgeChunks.knowledgeBaseId, oldKbId));
        for (const chunk of chunkRows) {
          const { id: _cid, createdAt: _ccreated, ...chunkRest } = chunk as any;
          await tx.insert(knowledgeChunks).values({
            ...chunkRest,
            knowledgeBaseId: newKb.id,
            agentId: created.id,
          });
        }
      }
      return created;
    });

    agentCache.delete("__active__");
    agentListCache.clear();
    kbCache.delete(String(clone.id));
    return this.mapAgentRow(clone);
  }

  /**
   * Jalankan `fn` dalam SATU transaksi DB atomik (Tahap 21 — materialisasi
   * organisasi/tim). `fn` menerima `ConfigStorage` ber-scope transaksi: setiap
   * create/update di dalamnya memakai koneksi transaksi `tx`. Bila `fn` melempar,
   * SELURUH penulisan di-rollback (tidak ada tim parsial).
   *
   * Cache in-memory TIDAK disentuh selama transaksi (data belum commit); setelah
   * commit sukses, cache agen dibersihkan agar pembacaan berikutnya segar.
   */
  async runInTransaction<T>(fn: (txStorage: ConfigStorage) => Promise<T>): Promise<T> {
    const result = await db.transaction(async (tx) => {
      const txStorage: ConfigStorage = {
        // Baca by-slug: tidak dipakai jalur organisasi, delegasi apa adanya.
        getAgentBySlug: (slug) => this.getAgentBySlug(slug),
        createAgent: (a) => this.createAgent(a, tx),
        updateAgent: (id, d) => this.updateAgent(id, d, tx),
        createKnowledgeBase: (kb) => this.createKnowledgeBase(kb, tx),
        createMiniApp: (m) => this.createMiniApp(m, tx),
        createIntegration: (i) => this.createIntegration(i, tx),
        createProjectBrainTemplate: (t) => this.createProjectBrainTemplate(t, tx),
      };
      return fn(txStorage);
    });
    // Commit sukses → segarkan cache (baris baru sudah permanen di DB).
    agentCache.delete("__active__");
    agentListCache.clear();
    return result;
  }

  async setActiveAgent(id: string): Promise<Agent | undefined> {
    // Hanya deaktivasi agent dashboard (tanpa toolboxId = bukan seeded series agent)
    // agar series page tidak ikut terpengaruh
    await db.update(agents).set({ isActive: false }).where(
      and(eq(agents.isActive, true), isNull(agents.toolboxId))
    );
    const result = await db.update(agents)
      .set({ isActive: true })
      .where(eq(agents.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    agentCache.delete("__active__");
    agentListCache.clear();
    return this.mapAgentRow(result[0]);
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, parseInt(id))).returning();
    // Cascade: hapus semua entri kolaborator agen ini agar tidak menggantung.
    await db.delete(agentCollaborators).where(eq(agentCollaborators.agentId, parseInt(id)));
    agentCache.delete(id);
    agentCache.delete("__active__");
    agentListCache.clear();
    return result.length > 0;
  }

  // ─── Agent Collaborator methods ───────────────────────────────────────────
  async getCollaboratorRole(agentId: string, userId: string): Promise<CollaboratorRole | null> {
    const aId = parseInt(agentId);
    if (Number.isNaN(aId) || !userId) return null;
    const rows = await db.select({ role: agentCollaborators.role })
      .from(agentCollaborators)
      .where(and(eq(agentCollaborators.agentId, aId), eq(agentCollaborators.userId, userId)))
      .limit(1);
    if (rows.length === 0) return null;
    const role = rows[0].role;
    return role === "editor" || role === "viewer" ? role : null;
  }

  async listCollaboratorsForAgent(agentId: string): Promise<CollaboratorView[]> {
    const aId = parseInt(agentId);
    if (Number.isNaN(aId)) return [];
    const rows = await db
      .select({
        id: agentCollaborators.id,
        agentId: agentCollaborators.agentId,
        userId: agentCollaborators.userId,
        role: agentCollaborators.role,
        invitedBy: agentCollaborators.invitedBy,
        createdAt: agentCollaborators.createdAt,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(agentCollaborators)
      .leftJoin(users, eq(agentCollaborators.userId, users.id))
      .where(eq(agentCollaborators.agentId, aId))
      .orderBy(desc(agentCollaborators.createdAt));
    return rows.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      userId: r.userId,
      role: r.role,
      invitedBy: r.invitedBy,
      createdAt: r.createdAt,
      email: r.email,
      displayName: [r.firstName, r.lastName].filter(Boolean).join(" ") || null,
    }));
  }

  async listAgentIdsForCollaborator(userId: string): Promise<string[]> {
    if (!userId) return [];
    const rows = await db.select({ agentId: agentCollaborators.agentId })
      .from(agentCollaborators)
      .where(eq(agentCollaborators.userId, userId));
    return rows.map((r) => String(r.agentId));
  }

  async addOrUpdateCollaborator(data: { agentId: string; userId: string; role: CollaboratorRole; invitedBy: string }): Promise<AgentCollaborator> {
    const aId = parseInt(data.agentId);
    const result = await db.insert(agentCollaborators)
      .values({ agentId: aId, userId: data.userId, role: data.role, invitedBy: data.invitedBy })
      .onConflictDoUpdate({
        target: [agentCollaborators.agentId, agentCollaborators.userId],
        set: { role: data.role, invitedBy: data.invitedBy },
      })
      .returning();
    // Daftar agen yang terlihat user berubah → bersihkan list cache.
    agentListCache.clear();
    return result[0] as AgentCollaborator;
  }

  async removeCollaborator(agentId: string, userId: string): Promise<boolean> {
    const aId = parseInt(agentId);
    if (Number.isNaN(aId) || !userId) return false;
    const result = await db.delete(agentCollaborators)
      .where(and(eq(agentCollaborators.agentId, aId), eq(agentCollaborators.userId, userId)))
      .returning();
    agentListCache.clear();
    return result.length > 0;
  }

  async getUserByEmail(email: string): Promise<{ id: string; email: string; firstName?: string | null; lastName?: string | null } | undefined> {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized) return undefined;
    const rows = await db
      .select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalized}`)
      .limit(1);
    if (rows.length === 0) return undefined;
    return { id: rows[0].id, email: rows[0].email || "", firstName: rows[0].firstName, lastName: rows[0].lastName };
  }

  async getAgentsByIds(ids: string[]): Promise<Agent[]> {
    const numericIds = ids.map((i) => parseInt(i)).filter((n) => !Number.isNaN(n));
    if (numericIds.length === 0) return [];
    const result = await db.select().from(agents).where(inArray(agents.id, numericIds));
    return result.map((row) => this.mapAgentRow(row));
  }

  // ─── Pending agent invites (email tanpa akun) ─────────────────────────────
  async addOrUpdatePendingInvite(data: { agentId: string; email: string; role: CollaboratorRole; invitedBy: string }): Promise<PendingAgentInvite> {
    const aId = parseInt(data.agentId);
    const email = (data.email || "").trim().toLowerCase();
    const result = await db.insert(pendingAgentInvites)
      .values({ agentId: aId, email, role: data.role, invitedBy: data.invitedBy })
      .onConflictDoUpdate({
        target: [pendingAgentInvites.agentId, pendingAgentInvites.email],
        set: { role: data.role, invitedBy: data.invitedBy },
      })
      .returning();
    return result[0] as PendingAgentInvite;
  }

  async listPendingInvitesForAgent(agentId: string): Promise<PendingAgentInvite[]> {
    const aId = parseInt(agentId);
    if (Number.isNaN(aId)) return [];
    const rows = await db.select()
      .from(pendingAgentInvites)
      .where(eq(pendingAgentInvites.agentId, aId))
      .orderBy(desc(pendingAgentInvites.createdAt));
    return rows as PendingAgentInvite[];
  }

  async removePendingInvite(agentId: string, email: string): Promise<boolean> {
    const aId = parseInt(agentId);
    const normalized = (email || "").trim().toLowerCase();
    if (Number.isNaN(aId) || !normalized) return false;
    const result = await db.delete(pendingAgentInvites)
      .where(and(eq(pendingAgentInvites.agentId, aId), eq(pendingAgentInvites.email, normalized)))
      .returning();
    return result.length > 0;
  }

  async addCertificationAudit(data: { agentId: string; certified: boolean; adminId: string }): Promise<CertificationAudit> {
    const aId = parseInt(data.agentId);
    const result = await db.insert(certificationAuditLog)
      .values({
        agentId: Number.isNaN(aId) ? 0 : aId,
        certified: data.certified === true,
        adminId: data.adminId || "",
      })
      .returning();
    return result[0] as CertificationAudit;
  }

  async listCertificationAudits(agentId: string): Promise<CertificationAudit[]> {
    const aId = parseInt(agentId);
    if (Number.isNaN(aId)) return [];
    const rows = await db.select()
      .from(certificationAuditLog)
      .where(eq(certificationAuditLog.agentId, aId))
      .orderBy(desc(certificationAuditLog.createdAt));
    return rows as CertificationAudit[];
  }

  async applyPendingInvitesForUser(userId: string, email: string): Promise<AppliedInviteGrant[]> {
    const normalized = (email || "").trim().toLowerCase();
    if (!userId || !normalized) return [];
    const invites = await db.select()
      .from(pendingAgentInvites)
      .where(eq(pendingAgentInvites.email, normalized));
    if (invites.length === 0) return [];
    const grants: AppliedInviteGrant[] = [];
    for (const inv of invites) {
      const role = inv.role === "editor" || inv.role === "viewer" ? inv.role : "viewer";
      await db.insert(agentCollaborators)
        .values({ agentId: inv.agentId, userId, role, invitedBy: inv.invitedBy })
        .onConflictDoUpdate({
          target: [agentCollaborators.agentId, agentCollaborators.userId],
          set: { role, invitedBy: inv.invitedBy },
        });
      const [agentRow] = await db.select({ name: agents.name })
        .from(agents)
        .where(eq(agents.id, inv.agentId))
        .limit(1);
      grants.push({
        agentId: String(inv.agentId),
        agentName: agentRow?.name || "agen bersama",
        role,
      });
    }
    await db.delete(pendingAgentInvites).where(eq(pendingAgentInvites.email, normalized));

    // Lisensi Seat Asosiasi (Model B): jika undangan ini adalah seat mitra
    // (agen default mitra ber-seatCapacity>0), sediakan langganan starter untuk
    // anggota baru. Fire-and-forget; kegagalan tidak boleh membatalkan grant.
    try {
      const partnerRows = await db.select({
        id: partners.id,
        defaultAgentId: partners.defaultAgentId,
        seatCapacity: partners.seatCapacity,
      }).from(partners).where(eq(partners.active, true));
      const agentToPartner = new Map<string, number>();
      for (const p of partnerRows) {
        if (p.defaultAgentId && (p.seatCapacity ?? 0) > 0) {
          agentToPartner.set(String(p.defaultAgentId), p.id);
        }
      }
      const seenPartners = new Set<number>();
      for (const inv of invites) {
        const pid = agentToPartner.get(String(inv.agentId));
        if (pid && !seenPartners.has(pid)) {
          seenPartners.add(pid);
          await this.provisionPartnerSeatSubscription(userId, pid).catch((e) =>
            console.error(`[partner-seat] provision gagal user=${userId} partner=${pid}:`, (e as any)?.message));
        }
      }
    } catch (e) {
      console.error("[partner-seat] cek seat undangan gagal:", (e as any)?.message || e);
    }

    agentListCache.clear();
    return grants;
  }

  // ─── Pending Premium Privat deliveries (beli tanpa akun → clone saat daftar) ──
  async addPendingPremiumDelivery(data: { masterAgentId: number; email: string; source?: string }): Promise<void> {
    const email = (data.email || "").trim().toLowerCase();
    if (!data.masterAgentId || !email) return;
    await db.insert(pendingPremiumDeliveries)
      .values({ masterAgentId: data.masterAgentId, email, source: data.source || "scalev" })
      .onConflictDoNothing({
        target: [pendingPremiumDeliveries.masterAgentId, pendingPremiumDeliveries.email],
      });
  }

  // Idempotency: cek apakah user sudah punya salinan privat dari master ini.
  async getCloneForOwner(masterAgentId: number, ownerUserId: string): Promise<Agent | undefined> {
    if (!masterAgentId || !ownerUserId) return undefined;
    const [row] = await db.select().from(agents)
      .where(and(eq(agents.clonedFromAgentId, masterAgentId), eq(agents.userId, ownerUserId)))
      .limit(1);
    return row ? this.mapAgentRow(row) : undefined;
  }

  async applyPendingPremiumDeliveriesForUser(userId: string, email: string): Promise<Agent[]> {
    const normalized = (email || "").trim().toLowerCase();
    if (!userId || !normalized) return [];
    const pending = await db.select()
      .from(pendingPremiumDeliveries)
      .where(eq(pendingPremiumDeliveries.email, normalized));
    if (pending.length === 0) return [];
    const delivered: Agent[] = [];
    const doneMasterIds: number[] = [];
    for (const p of pending) {
      try {
        // Idempotent: jangan clone dua kali kalau salinan sudah ada.
        const existing = await this.getCloneForOwner(p.masterAgentId, userId);
        const clone = existing || await this.cloneAgentForOwner(p.masterAgentId, userId);
        delivered.push(clone);
        doneMasterIds.push(p.masterAgentId);
      } catch (err: any) {
        // Hapus HANYA baris yang berhasil — yang gagal tetap antri untuk retry.
        console.error(`[pending-premium] Gagal clone master #${p.masterAgentId} untuk ${normalized}:`, err?.message);
      }
    }
    if (doneMasterIds.length > 0) {
      await db.delete(pendingPremiumDeliveries).where(and(
        eq(pendingPremiumDeliveries.email, normalized),
        inArray(pendingPremiumDeliveries.masterAgentId, doneMasterIds),
      ));
    }
    agentListCache.clear();
    return delivered;
  }

  // ─── Notification methods ──────────────────────────────────────────────────
  async createNotification(data: InsertNotification): Promise<Notification> {
    const rows = await db.insert(notifications).values(data).returning();
    return rows[0];
  }

  async listNotificationsForUser(userId: string, limit = 30): Promise<Notification[]> {
    if (!userId) return [];
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const rows = await db.select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return rows[0]?.count ?? 0;
  }

  async markNotificationRead(id: number, userId: string): Promise<boolean> {
    if (!userId || Number.isNaN(id)) return false;
    const result = await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    if (!userId) return 0;
    const result = await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .returning();
    return result.length;
  }

  private parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  private mapAgentRow(row: typeof agents.$inferSelect): Agent {
    return ({
      id: String(row.id),
      // userId = pemilik agen. WAJIB diekspos: seluruh otorisasi kepemilikan
      // (assertCanMutateAgent / assertOwnerOrAdminAgent / decideAgentReadAccess)
      // dan filter daftar agen non-admin membaca agent.userId. Tanpa ini,
      // agentOwnerId selalu kosong → pemilik diperlakukan seperti agen sistem
      // (admin-only) dan agen miliknya tak muncul di dashboard. Disanitasi
      // keluar untuk response non-admin oleh sanitizeAgentForPublic.
      userId: (row as any).userId || "",
      name: row.name,
      description: row.description || "",
      avatar: row.avatar || "",
      tagline: row.tagline || "",
      philosophy: row.philosophy || "",
      offTopicHandling: row.offTopicHandling || "politely_redirect",
      offTopicResponse: row.offTopicResponse || "",
      systemPrompt: row.systemPrompt || "You are a helpful assistant.",
      temperature: row.temperature || 0.7,
      maxTokens: row.maxTokens || 1024,
      aiModel: (row.aiModel || "gpt-4o") as Agent["aiModel"],
      customApiKey: row.customApiKey || "",
      customBaseUrl: row.customBaseUrl || "",
      customModelName: row.customModelName || "",
      greetingMessage: row.greetingMessage || "",
      conversationStarters: this.parseJsonArray(row.conversationStarters) as string[],
      language: row.language || "id",
      category: row.category || "",
      subcategory: row.subcategory || "",
      accessToken: row.accessToken || "",
      isPublic: row.isPublic || false,
      allowedDomains: (row.allowedDomains as string[]) || [],
      toolboxId: row.toolboxId ? String(row.toolboxId) : "",
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : "",
      isOrchestrator: row.isOrchestrator || false,
      orchestratorRole: (row.orchestratorRole || "standalone") as Agent["orchestratorRole"],
      parentAgentId: row.parentAgentId ? String(row.parentAgentId) : "",
      agenticMode: row.agenticMode || false,
      attentiveListening: row.attentiveListening ?? true,
      contextRetention: row.contextRetention || 10,
      proactiveAssistance: row.proactiveAssistance || false,
      learningEnabled: row.learningEnabled || false,
      emotionalIntelligence: row.emotionalIntelligence ?? true,
      multiStepReasoning: row.multiStepReasoning ?? true,
      selfCorrection: row.selfCorrection ?? true,
      behaviorPreset: (row as any).behaviorPreset || "Balanced",
      autonomyLevel: (row as any).autonomyLevel || "Terbatas",
      responseDepth: (row as any).responseDepth || "Terstruktur",
      outputFormat: (row as any).outputFormat || "Ringkasan + langkah",
      clarifyBeforeAnswer: (row as any).clarifyBeforeAnswer ?? true,
      uncertaintyHandling: (row as any).uncertaintyHandling || "Sarankan verifikasi ke sumber resmi",
      showRiskWarnings: (row as any).showRiskWarnings ?? true,
      contextPriority: ((row as any).contextPriority as string[]) || ["Pertanyaan terakhir", "Tujuan pengguna", "Riwayat percakapan"],
      proactiveAssistanceLevel: (row as any).proactiveAssistanceLevel || "Rendah",
      proactiveHelpTypes: ((row as any).proactiveHelpTypes as string[]) || ["Saran langkah berikutnya", "Pertanyaan klarifikasi", "Checklist"],
      interactionStyle: (row as any).interactionStyle || "Konsultatif",
      contextualEmpathy: (row as any).contextualEmpathy || "Ringan",
      actionBoundary: ((row as any).actionBoundary as string[]) || ["Hanya menjawab", "Boleh bertanya balik", "Boleh menyarankan"],
      escalationRules: ((row as any).escalationRules as string[]) || ["Arahkan ke sumber resmi", "Tampilkan disclaimer"],
      offTopicBehavior: (row as any).offTopicBehavior || "Jawab singkat lalu arahkan kembali",
      adaptiveLearningMode: (row as any).adaptiveLearningMode || "Off",
      storeInteractionSignals: (row as any).storeInteractionSignals ?? false,
      sourcePriority: ((row as any).sourcePriority as string[]) || ["System Prompt", "Knowledge Engine", "Riwayat percakapan", "Mini Apps", "Integrations", "Sumber eksternal"],
      personality: row.personality || "",
      expertise: (row.expertise as string[]) || [],
      communicationStyle: row.communicationStyle || "friendly",
      toneOfVoice: row.toneOfVoice || "professional",
      responseFormat: row.responseFormat || "conversational",
      avoidTopics: (row.avoidTopics as string[]) || [],
      keyPhrases: (row.keyPhrases as string[]) || [],
      widgetColor: row.widgetColor || "#6366f1",
      widgetPosition: (row.widgetPosition || "bottom-right") as Agent["widgetPosition"],
      widgetSize: (row.widgetSize || "medium") as Agent["widgetSize"],
      widgetBorderRadius: (row.widgetBorderRadius || "rounded") as Agent["widgetBorderRadius"],
      widgetShowBranding: row.widgetShowBranding ?? true,
      widgetWelcomeMessage: row.widgetWelcomeMessage || "",
      widgetButtonIcon: (row.widgetButtonIcon || "chat") as Agent["widgetButtonIcon"],
      isListed: row.isListed ?? false,
      productSummary: row.productSummary || "",
      productFeatures: (row.productFeatures as string[]) || [],
      productPricing: (row.productPricing as Record<string, any>) || {},
      trialEnabled: row.trialEnabled ?? true,
      trialDays: row.trialDays ?? 7,
      monthlyPrice: row.monthlyPrice ?? 0,
      licenseClass: (row as any).licenseClass ?? null,
      licensePrice: (row as any).licensePrice ?? null,
      messageQuotaDaily: row.messageQuotaDaily ?? 50,
      messageQuotaMonthly: row.messageQuotaMonthly ?? 1000,
      requireRegistration: row.requireRegistration ?? false,
      brandingName: row.brandingName || "",
      brandingLogo: row.brandingLogo || "",
      contextQuestions: (row.contextQuestions as any[]) || [],
      guestMessageLimit: row.guestMessageLimit ?? 10,
      ragEnabled: row.ragEnabled ?? true,
      ragChunkSize: row.ragChunkSize ?? 800,
      ragChunkOverlap: row.ragChunkOverlap ?? 200,
      ragTopK: row.ragTopK ?? 5,
      landingPageEnabled: row.landingPageEnabled ?? false,
      landingPageUrl: row.landingPageUrl || "",
      marketingKitUrl: row.marketingKitUrl || "",
      landingHeroHeadline: row.landingHeroHeadline || "",
      landingHeroSubheadline: row.landingHeroSubheadline || "",
      landingHeroCtaText: row.landingHeroCtaText || "Mulai Sekarang",
      landingPainPoints: (row.landingPainPoints as any[]) || [],
      landingSolutionText: row.landingSolutionText || "",
      landingBenefits: (row.landingBenefits as any[]) || [],
      landingDemoItems: (row.landingDemoItems as any[]) || [],
      landingTestimonials: (row.landingTestimonials as any[]) || [],
      landingFaq: (row.landingFaq as any[]) || [],
      landingAuthority: (row.landingAuthority || { title: "", description: "", credentials: [] }) as Agent["landingAuthority"],
      landingGuarantees: (row.landingGuarantees as any[]) || [],
      conversionEnabled: row.conversionEnabled ?? false,
      conversionGoal: (row.conversionGoal || "lead_capture") as Agent["conversionGoal"],
      conversionCta: (row.conversionCta || { title: "", description: "", buttonText: "", buttonUrl: "", style: "banner" }) as Agent["conversionCta"],
      conversionOffers: (row.conversionOffers as any[]) || [],
      leadCaptureFields: (row.leadCaptureFields as any[]) || [],
      scoringEnabled: row.scoringEnabled ?? false,
      scoringRubric: (row.scoringRubric as any[]) || [],
      scoringThresholds: (row.scoringThresholds || { low: 30, medium: 60, high: 80, lowLabel: "", mediumLabel: "", highLabel: "", lowRecommendation: "", mediumRecommendation: "", highRecommendation: "" }) as Agent["scoringThresholds"],
      ctaTriggerAfterMessages: row.ctaTriggerAfterMessages ?? 5,
      ctaTriggerOnScore: row.ctaTriggerOnScore ?? 0,
      whatsappCta: row.whatsappCta || "",
      calendlyUrl: row.calendlyUrl || "",
      adCopies: (row.adCopies as Record<string, any>) || {},
      imageHookPrompts: (row.imageHookPrompts as any[]) || [],
      videoReelPrompts: (row.videoReelPrompts as any[]) || [],
      metaPixelId: row.metaPixelId || "",
      // Atentif Agentic AI — Multi-Agent Architecture
      agentRole: (row as any).agentRole || "Standalone",
      workMode: (row as any).workMode || "Answer Mode",
      executionGatePolicy: (row as any).executionGatePolicy || "Konfirmasi untuk write",
      clarificationTriggers: ((row as any).clarificationTriggers as string[]) || ["Output target tidak jelas", "Risiko salah tinggi", "Butuh data spesifik untuk eksekusi"],
      // Tujuan & KPI
      primaryOutcome: (row as any).primaryOutcome || "",
      conversationWinConditions: (row as any).conversationWinConditions || "",
      fallbackObjective: (row as any).fallbackObjective || "Kumpulkan data untuk tindak lanjut",
      // Kebijakan & Domain Charter
      brandVoiceSpec: (row as any).brandVoiceSpec || "",
      reasoningPolicy: (row as any).reasoningPolicy || "Langkah demi langkah",
      interactionPolicy: (row as any).interactionPolicy || "",
      domainCharter: (row as any).domainCharter || "",
      qualityBar: (row as any).qualityBar || "",
      riskCompliance: (row as any).riskCompliance || "",
      orchestratorConfig: (row as any).orchestratorConfig ?? {},
      isActive: row.isActive || false,
      isEnabled: (row as any).isEnabled !== false,
      folderName: (row as any).folderName ?? null,
      agenticSubAgents: parseSubAgentsValue(row.agenticSubAgents),
      slug: (row as any).slug || null,
      createdAt: row.createdAt.toISOString(),
    } as unknown as Agent);
  }

  async getAgentBySlug(slug: string): Promise<Agent | undefined> {
    const result = await db.select().from(agents)
      .where(eq(agents.slug, slug))
      .limit(1);
    if (result.length > 0) return this.mapAgentRow(result[0]);
    return undefined;
  }

  // Knowledge Base methods
  async getKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    const cached = kbCache.get(agentId);
    if (cached) return cached;

    const result = await db.select().from(knowledgeBases)
      .where(eq(knowledgeBases.agentId, parseInt(agentId)))
      .orderBy(desc(knowledgeBases.createdAt));
    const mapped = result.map(row => this.mapKBRow(row));
    kbCache.set(agentId, mapped);
    return mapped;
  }

  async createKnowledgeBase(kb: InsertKnowledgeBase, exec: Executor = db): Promise<KnowledgeBase> {
    const result = await exec.insert(knowledgeBases).values({
      agentId: parseInt(kb.agentId),
      name: kb.name,
      type: kb.type,
      content: kb.content,
      description: kb.description || "",
      fileType: kb.fileType,
      fileName: kb.fileName || "",
      fileSize: kb.fileSize || 0,
      fileUrl: kb.fileUrl || "",
      processingStatus: kb.processingStatus || "completed",
      extractedText: kb.extractedText || "",
      // Kolom baru hierarki + versioning + atribusi sumber.
      taxonomyId: kb.taxonomyId ?? null,
      sourceUrl: kb.sourceUrl ?? null,
      sourceAuthority: kb.sourceAuthority ?? null,
      effectiveDate: kb.effectiveDate
        ? (kb.effectiveDate instanceof Date ? kb.effectiveDate : new Date(kb.effectiveDate))
        : null,
      supersededById: kb.supersededById ?? null,
      status: kb.status || "active",
      isShared: kb.isShared ?? false,
      sharedScope: kb.sharedScope ?? null,
    }).returning();
    const mapped = this.mapKBRow(result[0]);
    // Invalidate KB cache for this agent (lewati saat di dalam transaksi).
    if (exec === db) kbCache.delete(String(mapped.agentId));
    return mapped;
  }

  async updateKnowledgeBase(id: string, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined> {
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== "agentId") {
        updateData[key] = value;
      }
    });

    const result = await db.update(knowledgeBases)
      .set(updateData)
      .where(eq(knowledgeBases.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const mapped = this.mapKBRow(result[0]);
    kbCache.delete(String(mapped.agentId));
    return mapped;
  }

  async deleteKnowledgeBase(id: string): Promise<boolean> {
    // Fetch agentId before deletion for cache invalidation
    const existing = await db.select({ agentId: knowledgeBases.agentId })
      .from(knowledgeBases).where(eq(knowledgeBases.id, parseInt(id))).limit(1);
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.knowledgeBaseId, parseInt(id)));
    const result = await db.delete(knowledgeBases).where(eq(knowledgeBases.id, parseInt(id))).returning();
    if (existing.length > 0) {
      kbCache.delete(String(existing[0].agentId));
      chunkCache.delete(String(existing[0].agentId));
    }
    return result.length > 0;
  }

  // ===== Knowledge Taxonomy =====
  private mapTaxonomyRow(row: typeof knowledgeTaxonomy.$inferSelect): KnowledgeTaxonomyNode {
    return {
      id: row.id,
      parentId: row.parentId ?? null,
      name: row.name,
      slug: row.slug,
      level: (row.level || "sektor") as KnowledgeTaxonomyNode["level"],
      description: row.description ?? "",
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getTaxonomyTree(): Promise<KnowledgeTaxonomyTreeNode[]> {
    const rows = await db.select().from(knowledgeTaxonomy)
      .orderBy(knowledgeTaxonomy.level, knowledgeTaxonomy.sortOrder, knowledgeTaxonomy.name);
    const all: KnowledgeTaxonomyTreeNode[] = rows.map(r => ({ ...this.mapTaxonomyRow(r), children: [] }));
    const byId = new Map<number, KnowledgeTaxonomyTreeNode>();
    all.forEach(n => byId.set(n.id, n));
    const roots: KnowledgeTaxonomyTreeNode[] = [];
    for (const node of all) {
      if (node.parentId == null) {
        roots.push(node);
      } else {
        const parent = byId.get(node.parentId);
        if (parent) parent.children.push(node);
        else roots.push(node); // orphan: tampilkan di root agar tidak hilang
      }
    }
    return roots;
  }

  async getTaxonomyNode(id: number): Promise<KnowledgeTaxonomyNode | undefined> {
    const result = await db.select().from(knowledgeTaxonomy).where(eq(knowledgeTaxonomy.id, id));
    if (result.length === 0) return undefined;
    return this.mapTaxonomyRow(result[0]);
  }

  async createTaxonomyNode(node: InsertKnowledgeTaxonomy): Promise<KnowledgeTaxonomyNode> {
    const result = await db.insert(knowledgeTaxonomy).values({
      parentId: node.parentId ?? null,
      name: node.name,
      slug: node.slug,
      level: node.level || "sektor",
      description: node.description ?? "",
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
    }).returning();
    return this.mapTaxonomyRow(result[0]);
  }

  async updateTaxonomyNode(id: number, data: Partial<InsertKnowledgeTaxonomy>): Promise<KnowledgeTaxonomyNode | undefined> {
    const updates: Record<string, unknown> = {};
    if (data.parentId !== undefined) updates.parentId = data.parentId;
    if (data.name !== undefined) updates.name = data.name;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.level !== undefined) updates.level = data.level;
    if (data.description !== undefined) updates.description = data.description;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (Object.keys(updates).length === 0) {
      return this.getTaxonomyNode(id);
    }
    const result = await db.update(knowledgeTaxonomy).set(updates).where(eq(knowledgeTaxonomy.id, id)).returning();
    if (result.length === 0) return undefined;
    return this.mapTaxonomyRow(result[0]);
  }

  async deleteTaxonomyNode(id: number): Promise<boolean> {
    // Cegah hapus jika punya anak — minta admin pindahkan/hapus anak dulu.
    const children = await db.select().from(knowledgeTaxonomy).where(eq(knowledgeTaxonomy.parentId, id));
    if (children.length > 0) {
      throw new Error(`Tidak bisa menghapus node taxonomy yang masih punya ${children.length} anak. Pindahkan/hapus anak dulu.`);
    }
    // Lepaskan referensi taxonomy_id di KB sebelum delete.
    await db.update(knowledgeBases)
      .set({ taxonomyId: null })
      .where(eq(knowledgeBases.taxonomyId, id));
    const result = await db.delete(knowledgeTaxonomy).where(eq(knowledgeTaxonomy.id, id)).returning();
    return result.length > 0;
  }

  // ===== Knowledge Base Versioning =====
  async getKBVersionHistory(kbId: string): Promise<KnowledgeBase[]> {
    // Telusuri rantai supersededBy: mulai dari KB ini, ikuti supersededById sampai habis.
    // Lalu juga telusuri pendahulu: KB yang supersededBy = kbId (rekursif mundur).
    const numericId = parseInt(kbId);
    const visited = new Set<number>();
    const chain: KnowledgeBase[] = [];

    // Mundur: cari semua KB yang superseded_by_id mengarah ke kbId (predecessor chain)
    const collectPredecessors = async (targetId: number): Promise<void> => {
      const preds = await db.select().from(knowledgeBases)
        .where(eq(knowledgeBases.supersededById, targetId));
      for (const p of preds) {
        if (visited.has(p.id)) continue;
        visited.add(p.id);
        await collectPredecessors(p.id);
        chain.push(this.mapKBRow(p));
      }
    };

    await collectPredecessors(numericId);

    // KB tengah (input)
    const self = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, numericId));
    if (self.length === 0) return chain;
    if (!visited.has(self[0].id)) {
      visited.add(self[0].id);
      chain.push(this.mapKBRow(self[0]));
    }

    // Maju: ikuti supersededById
    let current = self[0];
    while (current.supersededById && !visited.has(current.supersededById)) {
      const next = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, current.supersededById));
      if (next.length === 0) break;
      visited.add(next[0].id);
      chain.push(this.mapKBRow(next[0]));
      current = next[0];
    }

    return chain;
  }

  async supersedeKnowledgeBase(oldKbId: string, newKbId: string): Promise<KnowledgeBase | undefined> {
    const oldId = parseInt(oldKbId);
    const newId = parseInt(newKbId);
    if (oldId === newId) {
      throw new Error("KB lama dan baru tidak boleh sama.");
    }
    // Cegah cycle sederhana: pastikan newKbId tidak superseded oleh oldKbId di rantai langsung.
    const newKb = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, newId));
    if (newKb.length === 0) {
      throw new Error("KB pengganti tidak ditemukan.");
    }
    let cursor: number | null = newKb[0].supersededById ?? null;
    const seen = new Set<number>([newId]);
    while (cursor != null) {
      if (cursor === oldId) {
        throw new Error("Tidak bisa menetapkan supersedence yang membentuk siklus.");
      }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const r = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, cursor));
      cursor = r[0]?.supersededById ?? null;
    }
    const result = await db.update(knowledgeBases)
      .set({ supersededById: newId, status: "superseded" })
      .where(eq(knowledgeBases.id, oldId))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapKBRow(result[0]);
  }

  async getKnowledgeBasesByTaxonomy(taxonomyId: number, includeSuperseded: boolean = false): Promise<KnowledgeBase[]> {
    const rows = includeSuperseded
      ? await db.select().from(knowledgeBases).where(eq(knowledgeBases.taxonomyId, taxonomyId))
      : await db.select().from(knowledgeBases).where(and(
          eq(knowledgeBases.taxonomyId, taxonomyId),
          eq(knowledgeBases.status, "active"),
        ));
    return rows.map(r => this.mapKBRow(r));
  }

  // Helper umum untuk map row KB → KnowledgeBase (dipakai versioning method di atas).
  private mapKBRow(row: typeof knowledgeBases.$inferSelect): KnowledgeBase {
    return {
      id: row.id.toString(),
      agentId: row.agentId.toString(),
      name: row.name,
      type: row.type as KnowledgeBase["type"],
      content: row.content,
      description: row.description ?? "",
      fileType: row.fileType as KnowledgeBase["fileType"],
      fileName: row.fileName ?? "",
      fileSize: row.fileSize ?? 0,
      fileUrl: row.fileUrl ?? "",
      processingStatus: (row.processingStatus || "completed") as KnowledgeBase["processingStatus"],
      extractedText: row.extractedText ?? "",
      knowledgeLayer: (row.knowledgeLayer || "operational") as KnowledgeBase["knowledgeLayer"],
      taxonomyId: row.taxonomyId ?? null,
      sourceUrl: row.sourceUrl ?? "",
      sourceAuthority: row.sourceAuthority ?? "",
      effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString() : null,
      supersededById: row.supersededById ?? null,
      status: (row.status || "active") as KnowledgeBase["status"],
      isShared: row.isShared ?? false,
      sharedScope: (row.sharedScope ?? null) as KnowledgeBase["sharedScope"],
      createdAt: row.createdAt.toISOString(),
    };
  }

  // Knowledge Chunks methods (RAG)
  async getChunksByKnowledgeBase(knowledgeBaseId: string): Promise<KnowledgeChunk[]> {
    const result = await db.select().from(knowledgeChunks)
      .where(eq(knowledgeChunks.knowledgeBaseId, parseInt(knowledgeBaseId)))
      .orderBy(knowledgeChunks.chunkIndex);
    return result.map(row => ({
      id: row.id as unknown as number,
      knowledgeBaseId: row.knowledgeBaseId as unknown as number,
      agentId: row.agentId as unknown as number,
      chunkIndex: row.chunkIndex,
      content: row.content,
      tokenCount: row.tokenCount || 0,
      embedding: (row.embedding as number[]) || [],
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getChunksByAgent(agentId: string): Promise<KnowledgeChunk[]> {
    const cached = chunkCache.get(agentId);
    if (cached) return cached;

    const result = await db.select().from(knowledgeChunks)
      .where(eq(knowledgeChunks.agentId, parseInt(agentId)))
      .orderBy(knowledgeChunks.chunkIndex);
    const mapped = result.map(row => ({
      id: row.id as unknown as number,
      knowledgeBaseId: row.knowledgeBaseId as unknown as number,
      agentId: row.agentId as unknown as number,
      chunkIndex: row.chunkIndex,
      content: row.content,
      tokenCount: row.tokenCount || 0,
      embedding: (row.embedding as number[]) || [],
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.createdAt.toISOString(),
    }));
    chunkCache.set(agentId, mapped);
    return mapped;
  }

  async createChunks(chunks: InsertKnowledgeChunk[]): Promise<KnowledgeChunk[]> {
    if (chunks.length === 0) return [];
    const created: KnowledgeChunk[] = [];
    for (const chunk of chunks) {
      const result = await db.insert(knowledgeChunks).values({
        knowledgeBaseId: chunk.knowledgeBaseId as any,
        agentId: chunk.agentId as any,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount || 0,
        embedding: chunk.embedding || [],
        metadata: chunk.metadata || {},
      }).returning();
      if (result[0]) {
        created.push({
          id: result[0].id as unknown as number,
          knowledgeBaseId: result[0].knowledgeBaseId as unknown as number,
          agentId: result[0].agentId as unknown as number,
          chunkIndex: result[0].chunkIndex,
          content: result[0].content,
          tokenCount: result[0].tokenCount || 0,
          embedding: (result[0].embedding as number[]) || [],
          metadata: (result[0].metadata as Record<string, any>) || {},
          createdAt: result[0].createdAt.toISOString(),
        });
      }
    }
    // Invalidate chunk cache for the agent(s) that were created
    const agentIds = new Set(chunks.map(c => String(c.agentId)));
    agentIds.forEach(aid => chunkCache.delete(aid));
    return created;
  }

  async deleteChunksByKnowledgeBase(knowledgeBaseId: string): Promise<boolean> {
    // Fetch agentId before deletion for cache invalidation
    const existing = await db.select({ agentId: knowledgeChunks.agentId })
      .from(knowledgeChunks).where(eq(knowledgeChunks.knowledgeBaseId, parseInt(knowledgeBaseId))).limit(1);
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.knowledgeBaseId, parseInt(knowledgeBaseId)));
    if (existing.length > 0) chunkCache.delete(String(existing[0].agentId));
    return true;
  }

  async deleteChunksByAgent(agentId: string): Promise<boolean> {
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.agentId, parseInt(agentId)));
    chunkCache.delete(agentId);
    return true;
  }

  // Integration methods
  async getIntegrations(agentId: string): Promise<Integration[]> {
    const result = await db.select().from(integrations)
      .where(eq(integrations.agentId, parseInt(agentId)))
      .orderBy(desc(integrations.createdAt));
    return result.map(row => ({
      id: String(row.id),
      agentId: String(row.agentId),
      type: row.type as Integration["type"],
      name: row.name,
      config: (row.config as Record<string, string>) || {},
      isEnabled: row.isEnabled || false,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createIntegration(integration: InsertIntegration, exec: Executor = db): Promise<Integration> {
    const result = await exec.insert(integrations).values({
      agentId: parseInt(integration.agentId),
      type: integration.type,
      name: integration.name,
      config: integration.config || {},
      isEnabled: integration.isEnabled || false,
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      type: row.type as Integration["type"],
      name: row.name,
      config: (row.config as Record<string, string>) || {},
      isEnabled: row.isEnabled || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== "agentId") {
        updateData[key] = value;
      }
    });
    
    const result = await db.update(integrations)
      .set(updateData)
      .where(eq(integrations.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      type: row.type as Integration["type"],
      name: row.name,
      config: (row.config as Record<string, string>) || {},
      isEnabled: row.isEnabled || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, parseInt(id))).returning();
    return result.length > 0;
  }

  // Message methods
  async getMessages(agentId: string): Promise<Message[]> {
    const result = await db.select().from(agentMessages)
      .where(eq(agentMessages.agentId, parseInt(agentId)))
      .orderBy(agentMessages.createdAt);
    return result.map(row => ({
      id: String(row.id),
      agentId: String(row.agentId),
      sessionId: row.sessionId || "",
      role: row.role as "user" | "assistant",
      content: row.content,
      reasoning: row.reasoning || "",
      confidence: row.confidence || undefined,
      sources: (row.sources as string[]) || [],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getMessagesBySession(agentId: string, sessionId: string): Promise<Message[]> {
    const result = await db.select().from(agentMessages)
      .where(and(
        eq(agentMessages.agentId, parseInt(agentId)),
        eq(agentMessages.sessionId, sessionId)
      ))
      .orderBy(agentMessages.createdAt);
    return result.map(row => ({
      id: String(row.id),
      agentId: String(row.agentId),
      sessionId: row.sessionId || "",
      role: row.role as "user" | "assistant",
      content: row.content,
      reasoning: row.reasoning || "",
      confidence: row.confidence || undefined,
      sources: (row.sources as string[]) || [],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const sourcesArray = Array.isArray(message.sources) ? message.sources : [];
    const agentIdNum = parseInt(message.agentId);
    const reasoningVal = message.reasoning || "";
    const confidenceVal = message.confidence || 0;
    const sourcesJson = JSON.stringify(sourcesArray);
    const sessionId = message.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const result = await db.execute(sql`
      INSERT INTO agent_messages (agent_id, session_id, role, content, reasoning, confidence, sources)
      VALUES (${agentIdNum}, ${sessionId}, ${message.role}, ${message.content}, ${reasoningVal}, ${confidenceVal}, ${sourcesJson}::jsonb)
      RETURNING *
    `);
    const rows = result.rows as any[];
    const row = rows[0];
    return {
      id: String(row.id),
      agentId: String(row.agent_id),
      role: row.role as "user" | "assistant",
      content: row.content,
      reasoning: row.reasoning || "",
      confidence: row.confidence || undefined,
      sources: (row.sources as string[]) || [],
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async clearMessages(agentId: string): Promise<boolean> {
    await db.delete(agentMessages).where(eq(agentMessages.agentId, parseInt(agentId)));
    return true;
  }

  // Analytics methods
  async getAnalytics(agentId: string): Promise<Analytics[]> {
    const result = await db.select().from(analyticsTable)
      .where(eq(analyticsTable.agentId, parseInt(agentId)))
      .orderBy(desc(analyticsTable.createdAt));
    return result.map(row => ({
      id: String(row.id),
      agentId: String(row.agentId),
      eventType: row.eventType as Analytics["eventType"],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createAnalytics(analytics: InsertAnalytics): Promise<Analytics> {
    const result = await db.insert(analyticsTable).values({
      agentId: parseInt(analytics.agentId),
      eventType: analytics.eventType,
      metadata: analytics.metadata || {},
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      eventType: row.eventType as Analytics["eventType"],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getAnalyticsSummary(agentId: string): Promise<{
    totalMessages: number;
    totalSessions: number;
    totalIntegrationCalls: number;
    messagesLast7Days: number[];
    topHours: { hour: number; count: number }[];
  }> {
    const analytics = await this.getAnalytics(agentId);
    
    const totalMessages = analytics.filter(a => a.eventType === "message").length;
    const totalSessions = analytics.filter(a => a.eventType === "session").length;
    const totalIntegrationCalls = analytics.filter(a => a.eventType === "integration_call").length;
    
    const now = new Date();
    const messagesLast7Days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      const count = analytics.filter(a => {
        const eventDate = new Date(a.createdAt);
        return a.eventType === "message" && eventDate >= dayStart && eventDate <= dayEnd;
      }).length;
      messagesLast7Days.push(count);
    }
    
    const hourCounts: Record<number, number> = {};
    analytics.forEach(a => {
      const hour = new Date(a.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const topHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalMessages,
      totalSessions,
      totalIntegrationCalls,
      messagesLast7Days,
      topHours,
    };
  }

  // Subscription methods
  private mapSubscriptionRow(row: typeof subscriptionsTable.$inferSelect): Subscription {
    return {
      id: String(row.id),
      userId: row.userId,
      plan: row.plan as Subscription["plan"],
      status: (row.status || "pending") as Subscription["status"],
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      chatbotLimit: row.chatbotLimit || 1,
      trialMessagesUsed: row.trialMessagesUsed || 0,
      partnerId: row.partnerId ?? null,
      startDate: row.startDate?.toISOString(),
      endDate: row.endDate?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptionsTable).values({
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status || "pending",
      mayarOrderId: subscription.mayarOrderId,
      mayarPaymentUrl: subscription.mayarPaymentUrl,
      amount: subscription.amount || 0,
      currency: subscription.currency || "IDR",
      chatbotLimit: subscription.chatbotLimit || 1,
      startDate: subscription.startDate ? new Date(subscription.startDate) : null,
      endDate: subscription.endDate ? new Date(subscription.endDate) : null,
    }).returning();
    return this.mapSubscriptionRow(result[0]);
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapSubscriptionRow(result[0]);
  }

  async getSubscriptionByMayarOrderId(mayarOrderId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.mayarOrderId, mayarOrderId))
      .limit(1);
    if (result.length === 0) return undefined;
    return this.mapSubscriptionRow(result[0]);
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptionsTable)
      .where(and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active")
      ))
      .orderBy(desc(subscriptionsTable.endDate))
      .limit(1);
    if (result.length === 0) return undefined;
    return this.mapSubscriptionRow(result[0]);
  }

  // ─── Access Codes: voucher akses peserta (mis. bonus seminar offline) ─────
  async createAccessCode(data: {
    code: string; plan?: string; durationDays?: number; label?: string;
    maxRedemptions?: number; createdBy?: string | null;
  }): Promise<typeof accessCodes.$inferSelect> {
    const [row] = await db.insert(accessCodes).values({
      code: data.code.trim().toUpperCase(),
      plan: data.plan || "profesional",
      durationDays: data.durationDays ?? 30,
      label: data.label ?? "",
      maxRedemptions: data.maxRedemptions ?? 1,
      createdBy: data.createdBy ?? null,
    }).returning();
    return row;
  }

  async listAccessCodes(): Promise<Array<typeof accessCodes.$inferSelect>> {
    return await db.select().from(accessCodes).orderBy(desc(accessCodes.createdAt));
  }

  async setAccessCodeActive(id: number, active: boolean): Promise<void> {
    await db.update(accessCodes).set({ active }).where(eq(accessCodes.id, id));
  }

  /**
   * Daftar peserta yang menukarkan sebuah kode (roster panitia acara).
   * Join ke users untuk nama/email bila akun sudah ada; user_id tetap
   * dikembalikan sebagai jejak walau baris user belum tersedia.
   */
  async listAccessCodeRedemptions(codeId: number): Promise<Array<{
    id: number; userId: string; email: string | null; firstName: string | null;
    lastName: string | null; subscriptionId: string | null; createdAt: Date;
  }>> {
    return await db
      .select({
        id: accessCodeRedemptions.id,
        userId: accessCodeRedemptions.userId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        subscriptionId: accessCodeRedemptions.subscriptionId,
        createdAt: accessCodeRedemptions.createdAt,
      })
      .from(accessCodeRedemptions)
      .leftJoin(users, eq(users.id, accessCodeRedemptions.userId))
      .where(eq(accessCodeRedemptions.codeId, codeId))
      .orderBy(desc(accessCodeRedemptions.createdAt));
  }

  /**
   * Redeem sebuah kode akses secara ATOMIK (transaksi):
   *  - kode wajib ada & aktif
   *  - user tidak boleh redeem kode yang sama dua kali (unique index)
   *  - increment terkunci `redemption_count < max_redemptions` (cegah race)
   *  - nonaktifkan langganan aktif lama lalu insert 1 grant baru (1 baris "active")
   *  - grantedBy diisi pembuat kode (jejak audit)
   * Return: { ok, reason, plan?, endDate? }
   */
  async redeemAccessCode(codeStr: string, userId: string): Promise<{
    ok: boolean; reason: "ok" | "invalid" | "already" | "exhausted"; plan?: string; endDate?: string;
  }> {
    const normalized = (codeStr || "").trim().toUpperCase();
    if (!normalized || !userId) return { ok: false, reason: "invalid" };

    const { PLAN_CONFIGS } = await import("@shared/feature-plans");

    return await db.transaction(async (tx) => {
      const [code] = await tx.select().from(accessCodes)
        .where(and(eq(accessCodes.code, normalized), eq(accessCodes.active, true)))
        .limit(1);
      if (!code) return { ok: false, reason: "invalid" as const };

      const [existing] = await tx.select({ id: accessCodeRedemptions.id }).from(accessCodeRedemptions)
        .where(and(eq(accessCodeRedemptions.codeId, code.id), eq(accessCodeRedemptions.userId, userId)))
        .limit(1);
      if (existing) return { ok: false, reason: "already" as const };

      const inc = await tx.update(accessCodes)
        .set({ redemptionCount: sql`${accessCodes.redemptionCount} + 1` })
        .where(and(
          eq(accessCodes.id, code.id),
          sql`${accessCodes.redemptionCount} < ${accessCodes.maxRedemptions}`,
        ))
        .returning({ id: accessCodes.id });
      if (inc.length === 0) return { ok: false, reason: "exhausted" as const };

      const planConfig = (PLAN_CONFIGS as any)[code.plan];
      const chatbotLimit = Math.min(planConfig?.maxAgents ?? 3, 200);
      const now = new Date();
      const endDate = new Date(now.getTime() + code.durationDays * 24 * 60 * 60 * 1000);

      await tx.update(subscriptionsTable)
        .set({ status: "expired", updatedAt: new Date() })
        .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")));

      const [sub] = await tx.insert(subscriptionsTable).values({
        userId,
        plan: code.plan,
        status: "active",
        amount: 0,
        currency: "IDR",
        chatbotLimit,
        grantedBy: code.createdBy ?? null,
        mayarOrderId: `CODE-${normalized}-${userId.slice(0, 8)}-${Date.now()}`,
        startDate: now,
        endDate,
      }).returning();

      await tx.insert(accessCodeRedemptions).values({
        codeId: code.id,
        userId,
        subscriptionId: String(sub.id),
      });

      return { ok: true, reason: "ok" as const, plan: code.plan, endDate: endDate.toISOString() };
    }).catch((err: any) => {
      // Race: dua permintaan user+kode sama lolos pre-check lalu bentrok di unique
      // index (codeId,userId). Transaksi yang kalah di-rollback → perlakukan sbagai
      // "sudah pernah ditukarkan", jangan bocor sebagai 500.
      const msg = String(err?.message || "");
      if (err?.code === "23505" || msg.includes("uniq_access_code_redemption") || msg.includes("duplicate key")) {
        return { ok: false, reason: "already" as const };
      }
      throw err;
    });
  }

  // ─── Event Testimonials (Jalur Bonus) ────────────────────────────────────
  /**
   * Turunkan asal peserta (hadir/online) dari label kode akses yang pernah
   * ditukarkan user. Cocokkan kata kunci pada label; default "lainnya".
   */
  async getUserEventSource(userId: string): Promise<"hadir" | "online" | "lainnya"> {
    if (!userId) return "lainnya";
    const rows = await db
      .select({ label: accessCodes.label })
      .from(accessCodeRedemptions)
      .innerJoin(accessCodes, eq(accessCodes.id, accessCodeRedemptions.codeId))
      .where(eq(accessCodeRedemptions.userId, userId));
    const labels = rows.map((r) => String(r.label || "").toLowerCase());
    if (labels.some((l) => /hadir|offline|onsite|luring/.test(l))) return "hadir";
    if (labels.some((l) => /online|daring|webinar|virtual/.test(l))) return "online";
    return "lainnya";
  }

  /**
   * Simpan/perbarui testimoni user (1 per user — upsert by user_id).
   * source diturunkan di server, moderasi (approved/featured) tetap default.
   */
  async upsertEventTestimonial(data: {
    userId: string; name: string; role?: string; rating?: number;
    quote: string; agentId?: number | null; source: string;
  }): Promise<typeof eventTestimonials.$inferSelect> {
    const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));
    const [row] = await db.insert(eventTestimonials).values({
      userId: data.userId,
      name: data.name.slice(0, 200),
      role: (data.role ?? "").slice(0, 200),
      rating,
      quote: data.quote.slice(0, 2000),
      agentId: data.agentId ?? null,
      source: data.source,
    }).onConflictDoUpdate({
      target: eventTestimonials.userId,
      set: {
        name: data.name.slice(0, 200),
        role: (data.role ?? "").slice(0, 200),
        rating,
        quote: data.quote.slice(0, 2000),
        agentId: data.agentId ?? null,
        source: data.source,
      },
    }).returning();
    return row;
  }

  async getEventTestimonialByUser(userId: string): Promise<typeof eventTestimonials.$inferSelect | undefined> {
    const [row] = await db.select().from(eventTestimonials)
      .where(eq(eventTestimonials.userId, userId)).limit(1);
    return row;
  }

  async listEventTestimonials(): Promise<Array<typeof eventTestimonials.$inferSelect>> {
    return await db.select().from(eventTestimonials).orderBy(desc(eventTestimonials.createdAt));
  }

  /** Testimoni publik: hanya yang disetujui admin (approved). featured di depan. */
  async listPublicEventTestimonials(limit = 12): Promise<Array<typeof eventTestimonials.$inferSelect>> {
    return await db.select().from(eventTestimonials)
      .where(eq(eventTestimonials.approved, true))
      .orderBy(desc(eventTestimonials.featured), desc(eventTestimonials.createdAt))
      .limit(Math.max(1, Math.min(100, limit)));
  }

  async setEventTestimonialFlags(id: number, flags: { featured?: boolean; approved?: boolean }): Promise<void> {
    const patch: Record<string, boolean> = {};
    if (typeof flags.featured === "boolean") patch.featured = flags.featured;
    if (typeof flags.approved === "boolean") patch.approved = flags.approved;
    if (Object.keys(patch).length === 0) return;
    await db.update(eventTestimonials).set(patch).where(eq(eventTestimonials.id, id));
  }

  // ─── Klinik Feedback (kesan & harapan, publik) ───────────────────────────────
  async createKlinikFeedback(data: {
    name?: string; role?: string; rating?: number; kesan: string; harapan?: string;
  }): Promise<typeof klinikFeedback.$inferSelect> {
    const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));
    const [row] = await db.insert(klinikFeedback).values({
      name: (data.name ?? "").slice(0, 200),
      role: (data.role ?? "").slice(0, 200),
      rating,
      kesan: data.kesan.slice(0, 2000),
      harapan: (data.harapan ?? "").slice(0, 2000),
    }).returning();
    return row;
  }

  async listKlinikFeedback(limit = 100): Promise<Array<typeof klinikFeedback.$inferSelect>> {
    return await db.select().from(klinikFeedback)
      .orderBy(desc(klinikFeedback.createdAt))
      .limit(Math.max(1, Math.min(500, limit)));
  }

  // ─── Lisensi Seat Asosiasi (Model B) ─────────────────────────────────────
  // Sediakan langganan "starter" untuk 1 seat anggota yang dibiayai mitra.
  // Idempotent: kalau anggota sudah punya seat aktif di mitra ini, tidak dobel.
  async provisionPartnerSeatSubscription(userId: string, partnerId: number): Promise<void> {
    if (!userId || !partnerId) return;
    const existing = await db.select({ id: subscriptionsTable.id }).from(subscriptionsTable)
      .where(and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.partnerId, partnerId),
        eq(subscriptionsTable.status, "active"),
      ))
      .limit(1);
    if (existing.length > 0) return;
    // endDate jauh ke depan: seat dikelola manual oleh mitra (bukan expiry otomatis),
    // dan getActiveSubscription memilih status="active" dengan endDate terbaru.
    const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
    await db.insert(subscriptionsTable).values({
      userId,
      plan: "starter",
      status: "active",
      amount: 0,
      currency: "IDR",
      chatbotLimit: 3,
      partnerId,
      startDate: new Date(),
      endDate: farFuture,
    });
  }

  // Cabut seat: nonaktifkan langganan seat aktif anggota di mitra ini.
  async deactivatePartnerSeatSubscription(userId: string, partnerId: number): Promise<void> {
    if (!userId || !partnerId) return;
    await db.update(subscriptionsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.partnerId, partnerId),
        eq(subscriptionsTable.status, "active"),
      ));
  }

  // Jumlah seat aktif (langganan) yang dibiayai mitra ini.
  async countPartnerSeatSubscriptions(partnerId: number): Promise<number> {
    if (!partnerId) return 0;
    const [row] = await db.select({ count: sql<number>`count(*)` })
      .from(subscriptionsTable)
      .where(and(
        eq(subscriptionsTable.partnerId, partnerId),
        eq(subscriptionsTable.status, "active"),
      ));
    return Number(row?.count ?? 0);
  }

  // Klaim 1 seat secara ATOMIK: cek kapasitas + beri akses + sediakan langganan
  // dalam satu transaksi. Advisory lock per-mitra menyerialkan klaim serentak
  // sehingga kapasitas berbayar tidak bisa dilampaui (race-safe). Bila langganan
  // gagal disediakan, seluruh transaksi di-rollback (fail-closed, tanpa drift).
  // seatCapacity=0 → mode pooled lama: tanpa lock/kuota/langganan (backward-compatible).
  async claimPartnerSeat(params: {
    partnerId: number;
    agentId: string;
    seatCapacity: number;
    email: string;
    role: CollaboratorRole;
    invitedBy: string;
  }): Promise<{ status: "granted" | "pending"; reason?: "seat_capacity_full"; seatsUsed?: number }> {
    const aId = parseInt(params.agentId);
    const email = (params.email || "").trim().toLowerCase();
    const capacity = params.seatCapacity ?? 0;
    if (Number.isNaN(aId) || !email) throw new Error("agentId/email tidak valid");

    const result = await db.transaction(async (tx) => {
      // Serialkan klaim seat untuk mitra ini (namespace SEAT=0x53454154).
      if (capacity > 0) {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(1397051220, ${params.partnerId})`);
      }
      const existingUser = (await tx.select({ id: users.id }).from(users)
        .where(sql`lower(${users.email}) = ${email}`).limit(1))[0];

      // Apakah email ini sudah menempati seat? (update peran, bukan seat baru)
      let alreadySeated = false;
      if (existingUser) {
        alreadySeated = (await tx.select({ id: agentCollaborators.id }).from(agentCollaborators)
          .where(and(eq(agentCollaborators.agentId, aId), eq(agentCollaborators.userId, existingUser.id)))
          .limit(1)).length > 0;
      } else {
        alreadySeated = (await tx.select({ id: pendingAgentInvites.id }).from(pendingAgentInvites)
          .where(and(eq(pendingAgentInvites.agentId, aId), eq(pendingAgentInvites.email, email)))
          .limit(1)).length > 0;
      }

      // Enforce kapasitas hanya untuk seat BARU (Model B).
      if (capacity > 0 && !alreadySeated) {
        const [{ c: activeCount }] = await tx.select({ c: sql<number>`count(*)::int` })
          .from(agentCollaborators).where(eq(agentCollaborators.agentId, aId));
        const [{ c: pendingCount }] = await tx.select({ c: sql<number>`count(*)::int` })
          .from(pendingAgentInvites).where(eq(pendingAgentInvites.agentId, aId));
        const used = Number(activeCount) + Number(pendingCount);
        if (used >= capacity) {
          return { status: "granted" as const, reason: "seat_capacity_full" as const, seatsUsed: used, _full: true };
        }
      }

      if (existingUser) {
        await tx.insert(agentCollaborators)
          .values({ agentId: aId, userId: existingUser.id, role: params.role, invitedBy: params.invitedBy })
          .onConflictDoUpdate({
            target: [agentCollaborators.agentId, agentCollaborators.userId],
            set: { role: params.role, invitedBy: params.invitedBy },
          });
        // Sediakan langganan seat (idempotent) dalam transaksi yang sama.
        if (capacity > 0) {
          const existingSub = await tx.select({ id: subscriptionsTable.id }).from(subscriptionsTable)
            .where(and(
              eq(subscriptionsTable.userId, existingUser.id),
              eq(subscriptionsTable.partnerId, params.partnerId),
              eq(subscriptionsTable.status, "active"),
            )).limit(1);
          if (existingSub.length === 0) {
            const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
            await tx.insert(subscriptionsTable).values({
              userId: existingUser.id,
              plan: "starter",
              status: "active",
              amount: 0,
              currency: "IDR",
              chatbotLimit: 3,
              partnerId: params.partnerId,
              startDate: new Date(),
              endDate: farFuture,
            });
          }
        }
        return { status: "granted" as const };
      }

      // Belum punya akun → simpan undangan pending (langganan disediakan saat signup).
      await tx.insert(pendingAgentInvites)
        .values({ agentId: aId, email, role: params.role, invitedBy: params.invitedBy })
        .onConflictDoUpdate({
          target: [pendingAgentInvites.agentId, pendingAgentInvites.email],
          set: { role: params.role, invitedBy: params.invitedBy },
        });
      return { status: "pending" as const };
    });

    agentListCache.clear();
    if ((result as any)._full) {
      return { status: "granted", reason: "seat_capacity_full", seatsUsed: result.seatsUsed };
    }
    return result as { status: "granted" | "pending" };
  }

  // Cabut 1 seat secara ATOMIK: nonaktifkan langganan + hapus akses dalam satu
  // transaksi (fail-closed, tanpa drift). Untuk undangan pending (belum ada akun),
  // cukup hapus barisnya (belum ada langganan).
  async revokePartnerSeat(params: {
    partnerId: number;
    agentId: string;
    userId?: string;
    email?: string;
  }): Promise<void> {
    const aId = parseInt(params.agentId);
    if (Number.isNaN(aId)) return;
    await db.transaction(async (tx) => {
      if (params.userId) {
        await tx.update(subscriptionsTable)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(and(
            eq(subscriptionsTable.userId, params.userId),
            eq(subscriptionsTable.partnerId, params.partnerId),
            eq(subscriptionsTable.status, "active"),
          ));
        await tx.delete(agentCollaborators)
          .where(and(eq(agentCollaborators.agentId, aId), eq(agentCollaborators.userId, params.userId)));
      } else if (params.email) {
        const email = params.email.trim().toLowerCase();
        await tx.delete(pendingAgentInvites)
          .where(and(eq(pendingAgentInvites.agentId, aId), eq(pendingAgentInvites.email, email)));
      }
    });
    agentListCache.clear();
  }

  async getLatestPendingSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptionsTable)
      .where(and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "pending")
      ))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);
    if (result.length === 0) return undefined;
    return this.mapSubscriptionRow(result[0]);
  }

  async updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "startDate" || key === "endDate") {
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = value;
        }
      }
    });
    
    const result = await db.update(subscriptionsTable)
      .set(updateData)
      .where(eq(subscriptionsTable.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapSubscriptionRow(result[0]);
  }

  async expireSubscriptions(): Promise<number> {
    const now = new Date();
    const expired = await db.update(subscriptionsTable)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(subscriptionsTable.status, "active"),
          sql`${subscriptionsTable.endDate} < ${now}`
        )
      )
      .returning();

    // Pause agents belonging to users whose trial just expired
    const trialExpiredUserIds = expired
      .filter((s: any) => s.plan === "free_trial")
      .map((s: any) => s.userId)
      .filter(Boolean) as string[];

    if (trialExpiredUserIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      await db.update(agents)
        .set({ isEnabled: false })
        .where(
          and(
            inArray(agents.userId, trialExpiredUserIds),
            eq(agents.isEnabled, true)
          )
        )
        .catch((err: any) => console.warn("[expireSubscriptions] pause agents:", err));
    }

    return expired.length;
  }

  async countUserAgents(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(agents)
      .where(eq(agents.userId, userId));
    return Number(result[0]?.count || 0);
  }

  async incrementTrialMessages(subscriptionId: string): Promise<number> {
    const result = await db.update(subscriptionsTable)
      .set({
        trialMessagesUsed: sql`${subscriptionsTable.trialMessagesUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, parseInt(subscriptionId)))
      .returning();
    return result[0]?.trialMessagesUsed || 0;
  }

  async getOwnerMonthlyUsage(ownerUserId: string, month: string): Promise<number> {
    const result = await db.select({ count: ownerMonthlyUsageTable.count })
      .from(ownerMonthlyUsageTable)
      .where(and(
        eq(ownerMonthlyUsageTable.ownerUserId, ownerUserId),
        eq(ownerMonthlyUsageTable.month, month),
      ))
      .limit(1);
    return result[0]?.count ?? 0;
  }

  async incrementOwnerMonthlyUsage(ownerUserId: string, month: string): Promise<number> {
    // Atomic durable increment: insert the (owner, month) row or bump the
    // existing count. Safe across concurrent requests/instances thanks to the
    // unique index on (owner_user_id, month).
    const result = await db.insert(ownerMonthlyUsageTable)
      .values({ ownerUserId, month, count: 1 })
      .onConflictDoUpdate({
        target: [ownerMonthlyUsageTable.ownerUserId, ownerMonthlyUsageTable.month],
        set: {
          count: sql`${ownerMonthlyUsageTable.count} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ count: ownerMonthlyUsageTable.count });
    return result[0]?.count ?? 0;
  }

  async deleteOwnerMonthlyUsageBefore(month: string): Promise<number> {
    // Prune stale usage rows for calendar months strictly before `month`
    // (format "YYYY-MM"). String comparison is safe for zero-padded months.
    const result = await db.delete(ownerMonthlyUsageTable)
      .where(lt(ownerMonthlyUsageTable.month, month))
      .returning({ id: ownerMonthlyUsageTable.id });
    return result.length;
  }

  async getUserDialogCompleted(userId: string): Promise<boolean> {
    const result = await db.select({ dialogCompleted: users.dialogCompleted })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return result[0]?.dialogCompleted || false;
  }

  async setUserDialogCompleted(userId: string): Promise<void> {
    await db.update(users)
      .set({ dialogCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserClawPackages(userId: string): Promise<string[]> {
    const result = await db.select({ selectedClawPackages: users.selectedClawPackages })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return result[0]?.selectedClawPackages ?? [];
  }

  async updateUserClawPackages(userId: string, packages: string[]): Promise<void> {
    await db.update(users)
      .set({ selectedClawPackages: packages, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Atomic: hanya berhasil jika user belum punya pilihan (lock sekali-pilih, race-safe)
  async claimUserClawPackages(userId: string, packages: string[]): Promise<boolean> {
    const result = await db.update(users)
      .set({ selectedClawPackages: packages, updatedAt: new Date() })
      .where(sql`${users.id} = ${userId} AND (${users.selectedClawPackages} IS NULL OR cardinality(${users.selectedClawPackages}) = 0)`)
      .returning({ id: users.id });
    return result.length > 0;
  }

  // Project Brain Template methods
  async getProjectBrainTemplates(agentId: string): Promise<ProjectBrainTemplate[]> {
    const result = await db.select().from(projectBrainTemplates)
      .where(eq(projectBrainTemplates.agentId, parseInt(agentId)))
      .orderBy(desc(projectBrainTemplates.createdAt));
    return result.map(row => ({
      id: String(row.id),
      agentId: String(row.agentId),
      name: row.name,
      description: row.description || "",
      fields: (row.fields as any[]) || [],
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getProjectBrainTemplate(id: string): Promise<ProjectBrainTemplate | undefined> {
    const result = await db.select().from(projectBrainTemplates)
      .where(eq(projectBrainTemplates.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      name: row.name,
      description: row.description || "",
      fields: (row.fields as any[]) || [],
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createProjectBrainTemplate(template: InsertProjectBrainTemplate, exec: Executor = db): Promise<ProjectBrainTemplate> {
    const result = await exec.insert(projectBrainTemplates).values({
      agentId: parseInt(template.agentId),
      name: template.name,
      description: template.description || "",
      fields: template.fields || [],
      isActive: true,
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      name: row.name,
      description: row.description || "",
      fields: (row.fields as any[]) || [],
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateProjectBrainTemplate(id: string, data: Partial<InsertProjectBrainTemplate>): Promise<ProjectBrainTemplate | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.fields !== undefined) updateData.fields = data.fields;

    const result = await db.update(projectBrainTemplates)
      .set(updateData)
      .where(eq(projectBrainTemplates.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      name: row.name,
      description: row.description || "",
      fields: (row.fields as any[]) || [],
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteProjectBrainTemplate(id: string): Promise<boolean> {
    const result = await db.delete(projectBrainTemplates)
      .where(eq(projectBrainTemplates.id, parseInt(id))).returning();
    return result.length > 0;
  }

  // Project Brain Instance methods
  async getProjectBrainInstances(agentId: string): Promise<ProjectBrainInstance[]> {
    const result = await db.select().from(projectBrainInstances)
      .where(eq(projectBrainInstances.agentId, parseInt(agentId)))
      .orderBy(desc(projectBrainInstances.createdAt));
    return result.map(row => ({
      id: String(row.id),
      agentId: String(row.agentId),
      templateId: String(row.templateId),
      name: row.name,
      values: (row.values as Record<string, any>) || {},
      status: (row.status || "active") as "draft" | "active" | "completed" | "archived",
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async getProjectBrainInstance(id: string): Promise<ProjectBrainInstance | undefined> {
    const result = await db.select().from(projectBrainInstances)
      .where(eq(projectBrainInstances.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      templateId: String(row.templateId),
      name: row.name,
      values: (row.values as Record<string, any>) || {},
      status: (row.status || "active") as "draft" | "active" | "completed" | "archived",
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getActiveProjectBrainInstance(agentId: string): Promise<ProjectBrainInstance | null> {
    const result = await db.select().from(projectBrainInstances)
      .where(and(
        eq(projectBrainInstances.agentId, parseInt(agentId)),
        eq(projectBrainInstances.isActive, true)
      ))
      .limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      templateId: String(row.templateId),
      name: row.name,
      values: (row.values as Record<string, any>) || {},
      status: (row.status || "active") as "draft" | "active" | "completed" | "archived",
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createProjectBrainInstance(instance: InsertProjectBrainInstance): Promise<ProjectBrainInstance> {
    const result = await db.insert(projectBrainInstances).values({
      agentId: parseInt(instance.agentId),
      templateId: parseInt(instance.templateId),
      name: instance.name,
      values: instance.values || {},
      status: instance.status || "active",
      isActive: true,
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      templateId: String(row.templateId),
      name: row.name,
      values: (row.values as Record<string, any>) || {},
      status: (row.status || "active") as "draft" | "active" | "completed" | "archived",
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateProjectBrainInstance(id: string, data: Partial<InsertProjectBrainInstance>): Promise<ProjectBrainInstance | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.values !== undefined) updateData.values = data.values;
    if (data.status !== undefined) updateData.status = data.status;

    const result = await db.update(projectBrainInstances)
      .set(updateData)
      .where(eq(projectBrainInstances.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      templateId: String(row.templateId),
      name: row.name,
      values: (row.values as Record<string, any>) || {},
      status: (row.status || "active") as "draft" | "active" | "completed" | "archived",
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async setActiveProjectBrainInstance(id: string): Promise<ProjectBrainInstance | undefined> {
    const instance = await this.getProjectBrainInstance(id);
    if (!instance) return undefined;

    await db.update(projectBrainInstances)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(projectBrainInstances.agentId, parseInt(instance.agentId)));

    const result = await db.update(projectBrainInstances)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(projectBrainInstances.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      templateId: String(row.templateId),
      name: row.name,
      values: (row.values as Record<string, any>) || {},
      status: (row.status || "active") as "draft" | "active" | "completed" | "archived",
      isActive: row.isActive || false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteProjectBrainInstance(id: string): Promise<boolean> {
    const result = await db.delete(projectBrainInstances)
      .where(eq(projectBrainInstances.id, parseInt(id))).returning();
    return result.length > 0;
  }

  // Mini App methods
  private mapMiniAppRow(row: typeof miniApps.$inferSelect): MiniApp {
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      name: row.name,
      description: row.description || "",
      type: row.type as MiniApp["type"],
      config: (row.config as Record<string, any>) || {},
      icon: row.icon || "app",
      isActive: row.isActive || false,
      publicSlug: row.publicSlug || undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private generateMiniAppSlug(name: string, id?: number): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 40);
    const suffix = (id ?? Math.floor(Math.random() * 99999)).toString(36);
    return `${base}-${suffix}`;
  }

  async getMiniApps(agentId: string): Promise<MiniApp[]> {
    const result = await db.select().from(miniApps)
      .where(eq(miniApps.agentId, parseInt(agentId)))
      .orderBy(desc(miniApps.createdAt));
    const mapped = result.map(row => this.mapMiniAppRow(row));
    // Auto-backfill publicSlug for apps that don't have one
    const needsSlug = mapped.filter(app => !app.publicSlug);
    for (const app of needsSlug) {
      const slug = this.generateMiniAppSlug(app.name, parseInt(app.id));
      try {
        await db.update(miniApps).set({ publicSlug: slug }).where(eq(miniApps.id, parseInt(app.id)));
        app.publicSlug = slug;
      } catch (err) {
        console.warn(`[MiniApp] Failed to backfill publicSlug for app ${app.id}:`, err);
      }
    }
    return mapped;
  }

  async getMiniApp(id: string): Promise<MiniApp | undefined> {
    const result = await db.select().from(miniApps)
      .where(eq(miniApps.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapMiniAppRow(result[0]);
  }

  async getMiniAppBySlug(slug: string): Promise<MiniApp | undefined> {
    const result = await db.select().from(miniApps)
      .where(eq(miniApps.publicSlug, slug)).limit(1);
    if (result.length === 0) return undefined;
    return this.mapMiniAppRow(result[0]);
  }

  async createMiniApp(miniApp: InsertMiniApp, exec: Executor = db): Promise<MiniApp> {
    const result = await exec.insert(miniApps).values({
      agentId: parseInt(miniApp.agentId),
      name: miniApp.name,
      description: miniApp.description || "",
      type: miniApp.type,
      config: miniApp.config || {},
      icon: miniApp.icon || "app",
      isActive: true,
      publicSlug: miniApp.publicSlug || null,
    }).returning();
    const row = result[0];
    if (!row.publicSlug) {
      const slug = this.generateMiniAppSlug(row.name, row.id);
      try {
        await exec.update(miniApps).set({ publicSlug: slug }).where(eq(miniApps.id, row.id));
        return { ...this.mapMiniAppRow(row), publicSlug: slug };
      } catch (err) {
        console.warn(`[MiniApp] Failed to assign publicSlug to new mini app ${row.id}:`, err);
        return this.mapMiniAppRow(row);
      }
    }
    return this.mapMiniAppRow(row);
  }

  async updateMiniApp(id: string, data: Partial<InsertMiniApp>): Promise<MiniApp | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.publicSlug !== undefined) updateData.publicSlug = data.publicSlug;

    const result = await db.update(miniApps)
      .set(updateData)
      .where(eq(miniApps.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    if (!row.publicSlug) {
      const slug = this.generateMiniAppSlug(row.name, row.id);
      try {
        await db.update(miniApps).set({ publicSlug: slug }).where(eq(miniApps.id, row.id));
        return { ...this.mapMiniAppRow(row), publicSlug: slug };
      } catch (err) {
        console.warn(`[MiniApp] Failed to assign publicSlug during update of app ${row.id}:`, err);
        return this.mapMiniAppRow(row);
      }
    }
    return this.mapMiniAppRow(row);
  }

  async deleteMiniApp(id: string): Promise<boolean> {
    const result = await db.delete(miniApps)
      .where(eq(miniApps.id, parseInt(id))).returning();
    return result.length > 0;
  }

  // Mini App Result methods
  async getMiniAppResults(miniAppId: string): Promise<MiniAppResult[]> {
    const result = await db.select().from(miniAppResults)
      .where(eq(miniAppResults.miniAppId, parseInt(miniAppId)))
      .orderBy(desc(miniAppResults.createdAt));
    return result.map(row => ({
      id: String(row.id),
      miniAppId: String(row.miniAppId),
      agentId: String(row.agentId),
      projectInstanceId: row.projectInstanceId ? String(row.projectInstanceId) : undefined,
      input: (row.input as Record<string, any>) || {},
      output: (row.output as Record<string, any>) || {},
      status: (row.status || "completed") as "pending" | "completed" | "error",
      source: ((row.source || "owner") as "owner" | "public"),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createMiniAppResult(resultData: InsertMiniAppResult): Promise<MiniAppResult> {
    const result = await db.insert(miniAppResults).values({
      miniAppId: parseInt(resultData.miniAppId),
      agentId: parseInt(resultData.agentId),
      projectInstanceId: resultData.projectInstanceId ? parseInt(resultData.projectInstanceId) : null,
      input: resultData.input || {},
      output: resultData.output || {},
      status: resultData.status || "completed",
      source: resultData.source || "owner",
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      miniAppId: String(row.miniAppId),
      agentId: String(row.agentId),
      projectInstanceId: row.projectInstanceId ? String(row.projectInstanceId) : undefined,
      input: (row.input as Record<string, any>) || {},
      output: (row.output as Record<string, any>) || {},
      status: (row.status || "completed") as "pending" | "completed" | "error",
      source: ((row.source || "owner") as "owner" | "public"),
      createdAt: row.createdAt.toISOString(),
    };
  }

  // Client Subscription methods
  async getClientSubscriptions(agentId: string): Promise<ClientSubscription[]> {
    const result = await db.select().from(clientSubscriptions)
      .where(eq(clientSubscriptions.agentId, parseInt(agentId)))
      .orderBy(desc(clientSubscriptions.createdAt));
    return result.map((row) => ({
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async getClientSubscription(id: string): Promise<ClientSubscription | undefined> {
    const result = await db.select().from(clientSubscriptions)
      .where(eq(clientSubscriptions.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getClientSubscriptionByToken(token: string): Promise<ClientSubscription | undefined> {
    const result = await db.select().from(clientSubscriptions)
      .where(eq(clientSubscriptions.accessToken, token)).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getClientSubscriptionByEmail(agentId: string, email: string): Promise<ClientSubscription | undefined> {
    const result = await db.select().from(clientSubscriptions)
      .where(and(
        eq(clientSubscriptions.agentId, parseInt(agentId)),
        eq(clientSubscriptions.customerEmail, email)
      )).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getClientSubscriptionByBigIdea(bigIdeaId: string, email: string): Promise<ClientSubscription | undefined> {
    const result = await db.select().from(clientSubscriptions)
      .where(and(
        eq(clientSubscriptions.bigIdeaId, parseInt(bigIdeaId)),
        eq(clientSubscriptions.customerEmail, email),
        eq(clientSubscriptions.status, "active")
      )).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createClientSubscription(insertSub: InsertClientSubscription): Promise<ClientSubscription> {
    const result = await db.insert(clientSubscriptions).values({
      agentId: parseInt(insertSub.agentId),
      bigIdeaId: insertSub.bigIdeaId ? parseInt(insertSub.bigIdeaId) : null,
      customerName: insertSub.customerName,
      customerEmail: insertSub.customerEmail,
      customerPhone: insertSub.customerPhone || "",
      plan: insertSub.plan || "trial",
      status: insertSub.status || "active",
      accessToken: insertSub.accessToken,
      mayarOrderId: insertSub.mayarOrderId || null,
      mayarPaymentUrl: insertSub.mayarPaymentUrl || null,
      amount: insertSub.amount || 0,
      currency: insertSub.currency || "IDR",
      referralCode: insertSub.referralCode || null,
      startDate: insertSub.startDate ? new Date(insertSub.startDate) : null,
      endDate: insertSub.endDate ? new Date(insertSub.endDate) : null,
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateClientSubscription(id: string, data: Partial<InsertClientSubscription & { messageUsedToday: number; messageUsedMonth: number; lastMessageDate: string; lastMonthReset: string }>): Promise<ClientSubscription | undefined> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.accessToken !== undefined) updateData.accessToken = data.accessToken;
    if (data.mayarOrderId !== undefined) updateData.mayarOrderId = data.mayarOrderId;
    if (data.mayarPaymentUrl !== undefined) updateData.mayarPaymentUrl = data.mayarPaymentUrl;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.referralCode !== undefined) updateData.referralCode = data.referralCode;
    if (data.messageUsedToday !== undefined) updateData.messageUsedToday = data.messageUsedToday;
    if (data.messageUsedMonth !== undefined) updateData.messageUsedMonth = data.messageUsedMonth;
    if (data.lastMessageDate !== undefined) updateData.lastMessageDate = data.lastMessageDate;
    if (data.lastMonthReset !== undefined) updateData.lastMonthReset = data.lastMonthReset;

    const result = await db.update(clientSubscriptions).set(updateData)
      .where(eq(clientSubscriptions.id, parseInt(id))).returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      agentId: String(row.agentId),
      bigIdeaId: row.bigIdeaId ? String(row.bigIdeaId) : undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone || "",
      plan: row.plan as "trial" | "monthly" | "yearly" | "lifetime",
      status: (row.status || "active") as "active" | "expired" | "cancelled" | "pending",
      accessToken: row.accessToken,
      mayarOrderId: row.mayarOrderId || undefined,
      mayarPaymentUrl: row.mayarPaymentUrl || undefined,
      amount: row.amount || 0,
      currency: row.currency || "IDR",
      referralCode: row.referralCode || undefined,
      startDate: row.startDate ? row.startDate.toISOString() : undefined,
      endDate: row.endDate ? row.endDate.toISOString() : undefined,
      messageUsedToday: row.messageUsedToday || 0,
      messageUsedMonth: row.messageUsedMonth || 0,
      lastMessageDate: row.lastMessageDate || null,
      lastMonthReset: row.lastMonthReset || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteClientSubscription(id: string): Promise<boolean> {
    const result = await db.delete(clientSubscriptions)
      .where(eq(clientSubscriptions.id, parseInt(id))).returning();
    return result.length > 0;
  }

  async incrementClientMessageUsage(id: string): Promise<ClientSubscription | undefined> {
    const sub = await this.getClientSubscription(id);
    if (!sub) return undefined;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = today.substring(0, 7);

    let messageUsedToday = sub.messageUsedToday;
    let messageUsedMonth = sub.messageUsedMonth;

    if (sub.lastMessageDate !== today) {
      messageUsedToday = 0;
    }
    if (!sub.lastMonthReset || sub.lastMonthReset.substring(0, 7) !== currentMonth) {
      messageUsedMonth = 0;
    }

    messageUsedToday += 1;
    messageUsedMonth += 1;

    return this.updateClientSubscription(id, {
      messageUsedToday,
      messageUsedMonth,
      lastMessageDate: today,
      lastMonthReset: today,
    });
  }

  async getClientSubscriptionStats(agentId: string): Promise<{ totalClients: number; activeClients: number; totalRevenue: number }> {
    const subs = await this.getClientSubscriptions(agentId);
    const totalClients = subs.length;
    const activeClients = subs.filter((sub) => sub.status === "active").length;
    const totalRevenue = subs.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    return { totalClients, activeClients, totalRevenue };
  }

  // Affiliate methods
  async getAffiliates(): Promise<Affiliate[]> {
    const result = await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
    return result.map((row) => ({
      id: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      code: row.code,
      commissionRate: row.commissionRate || 10,
      payoutInfo: row.payoutInfo || "",
      totalEarnings: row.totalEarnings || 0,
      totalReferrals: row.totalReferrals || 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    const result = await db.select().from(affiliates)
      .where(eq(affiliates.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      code: row.code,
      commissionRate: row.commissionRate || 10,
      payoutInfo: row.payoutInfo || "",
      totalEarnings: row.totalEarnings || 0,
      totalReferrals: row.totalReferrals || 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    const result = await db.select().from(affiliates)
      .where(eq(affiliates.code, code)).limit(1);
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      code: row.code,
      commissionRate: row.commissionRate || 10,
      payoutInfo: row.payoutInfo || "",
      totalEarnings: row.totalEarnings || 0,
      totalReferrals: row.totalReferrals || 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const result = await db.insert(affiliates).values({
      name: insertAffiliate.name,
      email: insertAffiliate.email,
      phone: insertAffiliate.phone || "",
      code: insertAffiliate.code,
      commissionRate: insertAffiliate.commissionRate ?? 10,
      payoutInfo: insertAffiliate.payoutInfo || "",
    }).returning();
    const row = result[0];
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      code: row.code,
      commissionRate: row.commissionRate || 10,
      payoutInfo: row.payoutInfo || "",
      totalEarnings: row.totalEarnings || 0,
      totalReferrals: row.totalReferrals || 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateAffiliate(id: string, data: Partial<InsertAffiliate>): Promise<Affiliate | undefined> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate;
    if (data.payoutInfo !== undefined) updateData.payoutInfo = data.payoutInfo;

    const result = await db.update(affiliates).set(updateData)
      .where(eq(affiliates.id, parseInt(id))).returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      code: row.code,
      commissionRate: row.commissionRate || 10,
      payoutInfo: row.payoutInfo || "",
      totalEarnings: row.totalEarnings || 0,
      totalReferrals: row.totalReferrals || 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteAffiliate(id: string): Promise<boolean> {
    const result = await db.delete(affiliates)
      .where(eq(affiliates.id, parseInt(id))).returning();
    return result.length > 0;
  }

  async incrementAffiliateReferral(code: string, amount: number): Promise<Affiliate | undefined> {
    const affiliate = await this.getAffiliateByCode(code);
    if (!affiliate) return undefined;

    const commission = amount * (affiliate.commissionRate / 100);
    const result = await db.update(affiliates).set({
      totalReferrals: (affiliate.totalReferrals || 0) + 1,
      totalEarnings: (affiliate.totalEarnings || 0) + commission,
    }).where(eq(affiliates.code, code)).returning();
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      code: row.code,
      commissionRate: row.commissionRate || 10,
      payoutInfo: row.payoutInfo || "",
      totalEarnings: row.totalEarnings || 0,
      totalReferrals: row.totalReferrals || 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  // Product listing methods
  async getListedAgents(): Promise<Agent[]> {
    const result = await db.select().from(agents).where(eq(agents.isListed, true));
    return result.map((row) => this.mapAgentRow(row));
  }

  private mapVoucherRow(row: any): Voucher {
    return {
      id: row.id,
      agentId: row.agentId,
      code: row.code,
      name: row.name,
      type: row.type || "unlimited",
      extraMessages: row.extraMessages || 0,
      durationDays: row.durationDays || 30,
      maxRedemptions: row.maxRedemptions || 0,
      totalRedeemed: row.totalRedeemed || 0,
      isActive: row.isActive ?? true,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getVouchers(agentId?: string): Promise<Voucher[]> {
    let result;
    if (agentId) {
      result = await db.select().from(vouchers)
        .where(eq(vouchers.agentId, parseInt(agentId)))
        .orderBy(desc(vouchers.createdAt));
    } else {
      result = await db.select().from(vouchers)
        .orderBy(desc(vouchers.createdAt));
    }
    return result.map((row) => this.mapVoucherRow(row));
  }

  async getVoucher(id: string): Promise<Voucher | undefined> {
    const result = await db.select().from(vouchers)
      .where(eq(vouchers.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapVoucherRow(result[0]);
  }

  async getVoucherByCode(code: string): Promise<Voucher | undefined> {
    const result = await db.select().from(vouchers)
      .where(eq(vouchers.code, code.toUpperCase())).limit(1);
    if (result.length === 0) return undefined;
    return this.mapVoucherRow(result[0]);
  }

  async createVoucher(voucher: InsertVoucher): Promise<Voucher> {
    const result = await db.insert(vouchers).values({
      agentId: voucher.agentId || null,
      code: voucher.code.toUpperCase(),
      name: voucher.name,
      type: voucher.type || "unlimited",
      extraMessages: voucher.extraMessages || 0,
      durationDays: voucher.durationDays || 30,
      maxRedemptions: voucher.maxRedemptions || 0,
      isActive: voucher.isActive ?? true,
      expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt) : null,
    }).returning();
    return this.mapVoucherRow(result[0]);
  }

  async updateVoucher(id: string, data: Partial<InsertVoucher>): Promise<Voucher | undefined> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.extraMessages !== undefined) updateData.extraMessages = data.extraMessages;
    if (data.durationDays !== undefined) updateData.durationDays = data.durationDays;
    if (data.maxRedemptions !== undefined) updateData.maxRedemptions = data.maxRedemptions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.agentId !== undefined) updateData.agentId = data.agentId;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    const result = await db.update(vouchers)
      .set(updateData)
      .where(eq(vouchers.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapVoucherRow(result[0]);
  }

  async deleteVoucher(id: string): Promise<boolean> {
    await db.delete(voucherRedemptions).where(eq(voucherRedemptions.voucherId, parseInt(id)));
    const result = await db.delete(vouchers).where(eq(vouchers.id, parseInt(id))).returning();
    return result.length > 0;
  }

  async redeemVoucher(voucherId: number, clientSubscriptionId: number): Promise<VoucherRedemption> {
    await db.update(vouchers)
      .set({ totalRedeemed: sql`${vouchers.totalRedeemed} + 1` })
      .where(eq(vouchers.id, voucherId));

    const result = await db.insert(voucherRedemptions).values({
      voucherId,
      clientSubscriptionId,
    }).returning();

    return {
      id: result[0].id,
      voucherId: result[0].voucherId,
      clientSubscriptionId: result[0].clientSubscriptionId,
      redeemedAt: result[0].redeemedAt.toISOString(),
    };
  }

  async getVoucherRedemptions(voucherId: string): Promise<VoucherRedemption[]> {
    const result = await db.select().from(voucherRedemptions)
      .where(eq(voucherRedemptions.voucherId, parseInt(voucherId)))
      .orderBy(desc(voucherRedemptions.redeemedAt));
    return result.map((row) => ({
      id: row.id,
      voucherId: row.voucherId,
      clientSubscriptionId: row.clientSubscriptionId,
      redeemedAt: row.redeemedAt.toISOString(),
    }));
  }

  async getClientVoucherRedemptions(clientSubscriptionId: number): Promise<(VoucherRedemption & { voucher?: Voucher })[]> {
    const result = await db.select().from(voucherRedemptions)
      .where(eq(voucherRedemptions.clientSubscriptionId, clientSubscriptionId))
      .orderBy(desc(voucherRedemptions.redeemedAt));

    const redemptions: (VoucherRedemption & { voucher?: Voucher })[] = [];
    for (const row of result) {
      const voucherResult = await db.select().from(vouchers)
        .where(eq(vouchers.id, row.voucherId)).limit(1);
      redemptions.push({
        id: row.id,
        voucherId: row.voucherId,
        clientSubscriptionId: row.clientSubscriptionId,
        redeemedAt: row.redeemedAt.toISOString(),
        voucher: voucherResult.length > 0 ? this.mapVoucherRow(voucherResult[0]) : undefined,
      });
    }
    return redemptions;
  }
  // User Memory methods
  async getUserMemories(agentId: string, sessionId?: string): Promise<UserMemory[]> {
    const conditions = [eq(userMemories.agentId, Number(agentId))];
    if (sessionId) conditions.push(eq(userMemories.sessionId, sessionId));
    const result = await db.select().from(userMemories)
      .where(and(...conditions))
      .orderBy(desc(userMemories.createdAt));
    return result;
  }

  async createUserMemory(memory: InsertUserMemory): Promise<UserMemory> {
    const [result] = await db.insert(userMemories).values({
      agentId: memory.agentId,
      sessionId: memory.sessionId || "",
      category: memory.category || "memory",
      content: memory.content,
    }).returning();
    return result;
  }

  async deleteUserMemory(id: string): Promise<boolean> {
    const result = await db.delete(userMemories).where(eq(userMemories.id, Number(id)));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteUserMemoriesByAgent(agentId: string, sessionId?: string): Promise<boolean> {
    const conditions = [eq(userMemories.agentId, Number(agentId))];
    if (sessionId) conditions.push(eq(userMemories.sessionId, sessionId));
    await db.delete(userMemories).where(and(...conditions));
    return true;
  }

  async getWaContacts(agentId: string): Promise<WaContact[]> {
    return db.select().from(waContacts)
      .where(eq(waContacts.agentId, Number(agentId)))
      .orderBy(desc(waContacts.lastSeenAt));
  }

  async getWaContact(id: string): Promise<WaContact | undefined> {
    const [result] = await db.select().from(waContacts).where(eq(waContacts.id, Number(id)));
    return result;
  }

  async upsertWaContact(contact: InsertWaContact): Promise<WaContact> {
    const existing = await db.select().from(waContacts)
      .where(and(
        eq(waContacts.agentId, contact.agentId),
        eq(waContacts.phone, contact.phone)
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(waContacts)
        .set({ lastSeenAt: new Date(), name: contact.name || existing[0].name })
        .where(eq(waContacts.id, existing[0].id))
        .returning();
      return updated;
    }
    const [result] = await db.insert(waContacts).values({
      agentId: contact.agentId,
      phone: contact.phone,
      name: contact.name || "",
      source: contact.source || "webhook",
    }).returning();
    return result;
  }

  async updateWaContact(id: string, data: Partial<InsertWaContact>): Promise<WaContact | undefined> {
    const [result] = await db.update(waContacts).set(data).where(eq(waContacts.id, Number(id))).returning();
    return result;
  }

  async deleteWaContact(id: string): Promise<boolean> {
    const result = await db.delete(waContacts).where(eq(waContacts.id, Number(id)));
    return (result.rowCount ?? 0) > 0;
  }

  async getWaBroadcasts(agentId?: string): Promise<WaBroadcast[]> {
    if (agentId) {
      return db.select().from(waBroadcasts)
        .where(eq(waBroadcasts.agentId, Number(agentId)))
        .orderBy(desc(waBroadcasts.createdAt));
    }
    return db.select().from(waBroadcasts).orderBy(desc(waBroadcasts.createdAt));
  }

  async getWaBroadcast(id: string): Promise<WaBroadcast | undefined> {
    const [result] = await db.select().from(waBroadcasts).where(eq(waBroadcasts.id, Number(id)));
    return result;
  }

  async getDueBroadcasts(): Promise<WaBroadcast[]> {
    return db.select().from(waBroadcasts)
      .where(and(
        eq(waBroadcasts.isEnabled, true),
        sql`${waBroadcasts.nextRunAt} <= NOW()`
      ));
  }

  async createWaBroadcast(broadcast: InsertWaBroadcast): Promise<WaBroadcast> {
    const [result] = await db.insert(waBroadcasts).values(broadcast as any).returning();
    return result;
  }

  async updateWaBroadcast(id: string, data: Partial<InsertWaBroadcast>): Promise<WaBroadcast | undefined> {
    const [result] = await db.update(waBroadcasts).set(data as any).where(eq(waBroadcasts.id, Number(id))).returning();
    return result;
  }

  async deleteWaBroadcast(id: string): Promise<boolean> {
    const result = await db.delete(waBroadcasts).where(eq(waBroadcasts.id, Number(id)));
    return (result.rowCount ?? 0) > 0;
  }

  async createBroadcastRun(run: Partial<WaBroadcastRun>): Promise<WaBroadcastRun> {
    const [result] = await db.insert(waBroadcastRuns).values(run as any).returning();
    return result;
  }

  async updateBroadcastRun(id: string, data: Partial<WaBroadcastRun>): Promise<WaBroadcastRun | undefined> {
    const [result] = await db.update(waBroadcastRuns).set(data as any).where(eq(waBroadcastRuns.id, Number(id))).returning();
    return result;
  }

  async getBroadcastRuns(broadcastId: string): Promise<WaBroadcastRun[]> {
    return db.select().from(waBroadcastRuns)
      .where(eq(waBroadcastRuns.broadcastId, Number(broadcastId)))
      .orderBy(desc(waBroadcastRuns.runAt));
  }

  async getTenderSources(): Promise<TenderSource[]> {
    return db.select().from(tenderSources).orderBy(desc(tenderSources.createdAt));
  }

  async getTenderSource(id: string): Promise<TenderSource | undefined> {
    const [result] = await db.select().from(tenderSources).where(eq(tenderSources.id, Number(id)));
    return result;
  }

  async createTenderSource(source: InsertTenderSource): Promise<TenderSource> {
    const [result] = await db.insert(tenderSources).values(source as any).returning();
    return result;
  }

  async updateTenderSource(id: string, data: Partial<InsertTenderSource>): Promise<TenderSource | undefined> {
    const [result] = await db.update(tenderSources).set(data as any).where(eq(tenderSources.id, Number(id))).returning();
    return result;
  }

  async deleteTenderSource(id: string): Promise<boolean> {
    const result = await db.delete(tenderSources).where(eq(tenderSources.id, Number(id)));
    return (result.rowCount ?? 0) > 0;
  }

  async getTenders(sourceId?: string, limit?: number): Promise<Tender[]> {
    let query = db.select().from(tenders);
    if (sourceId) {
      query = query.where(eq(tenders.sourceId, Number(sourceId))) as any;
    }
    query = query.orderBy(desc(tenders.createdAt)) as any;
    if (limit) {
      query = query.limit(limit) as any;
    }
    return query;
  }

  async getTender(id: string): Promise<Tender | undefined> {
    const [result] = await db.select().from(tenders).where(eq(tenders.id, Number(id)));
    return result;
  }

  async upsertTender(tender: InsertTender): Promise<Tender> {
    // Atomic upsert — race-safe berkat unique index (source_id, tender_id)
    const [result] = await db.insert(tenders)
      .values(tender as any)
      .onConflictDoUpdate({
        target: [tenders.sourceId, tenders.tenderId],
        set: { ...tender, updatedAt: new Date() } as any,
      })
      .returning();
    return result;
  }

  async getLatestTenders(limit: number = 20): Promise<Tender[]> {
    return db.select().from(tenders)
      .orderBy(desc(tenders.createdAt))
      .limit(limit);
  }

  async deleteTender(id: string): Promise<boolean> {
    const result = await db.delete(tenders).where(eq(tenders.id, Number(id)));
    return (result.rowCount ?? 0) > 0;
  }

  // Lead methods
  private mapLeadRow(row: any): Lead {
    return {
      id: row.id,
      agentId: row.agentId,
      sessionId: row.sessionId || "",
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      company: row.company || "",
      source: (row.source || "chat") as Lead["source"],
      status: (row.status || "new") as Lead["status"],
      score: row.score || 0,
      scoreBreakdown: (row.scoreBreakdown as Record<string, any>) || {},
      metadata: (row.metadata as Record<string, any>) || {},
      notes: row.notes || "",
      convertedAt: row.convertedAt ? row.convertedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getLeads(agentId: string): Promise<Lead[]> {
    const result = await db.select().from(leads)
      .where(eq(leads.agentId, parseInt(agentId)))
      .orderBy(desc(leads.createdAt));
    return result.map(row => this.mapLeadRow(row));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const result = await db.select().from(leads)
      .where(eq(leads.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapLeadRow(result[0]);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values({
      agentId: lead.agentId,
      sessionId: lead.sessionId || "",
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "chat",
      status: lead.status || "new",
      score: lead.score || 0,
      scoreBreakdown: lead.scoreBreakdown || {},
      metadata: lead.metadata || {},
      notes: lead.notes || "",
    }).returning();
    return this.mapLeadRow(result[0]);
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.scoreBreakdown !== undefined) updateData.scoreBreakdown = data.scoreBreakdown;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const result = await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, parseInt(id)))
      .returning();
    if (result.length === 0) return undefined;
    return this.mapLeadRow(result[0]);
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, parseInt(id)));
    return (result.rowCount ?? 0) > 0;
  }

  async getLeadsBySession(agentId: string, sessionId: string): Promise<Lead[]> {
    const result = await db.select().from(leads)
      .where(and(
        eq(leads.agentId, parseInt(agentId)),
        eq(leads.sessionId, sessionId)
      ))
      .orderBy(desc(leads.createdAt));
    return result.map(row => this.mapLeadRow(row));
  }

  // Scoring Result methods
  private mapScoringResultRow(row: any): ScoringResult {
    return {
      id: row.id,
      agentId: row.agentId,
      sessionId: row.sessionId || "",
      leadId: row.leadId || undefined,
      totalScore: row.totalScore || 0,
      maxScore: row.maxScore || 100,
      level: (row.level || "low") as ScoringResult["level"],
      breakdown: (row.breakdown as any[]) || [],
      recommendations: (row.recommendations as any[]) || [],
      gapAnalysis: (row.gapAnalysis as any[]) || [],
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getScoringResults(agentId: string): Promise<ScoringResult[]> {
    const result = await db.select().from(scoringResults)
      .where(eq(scoringResults.agentId, parseInt(agentId)))
      .orderBy(desc(scoringResults.createdAt));
    return result.map(row => this.mapScoringResultRow(row));
  }

  async getScoringResult(id: string): Promise<ScoringResult | undefined> {
    const result = await db.select().from(scoringResults)
      .where(eq(scoringResults.id, parseInt(id))).limit(1);
    if (result.length === 0) return undefined;
    return this.mapScoringResultRow(result[0]);
  }

  async createScoringResult(resultData: InsertScoringResult): Promise<ScoringResult> {
    const result = await db.insert(scoringResults).values({
      agentId: resultData.agentId,
      sessionId: resultData.sessionId || "",
      leadId: resultData.leadId || null,
      totalScore: resultData.totalScore || 0,
      maxScore: resultData.maxScore || 100,
      level: resultData.level || "low",
      breakdown: resultData.breakdown || [],
      recommendations: resultData.recommendations || [],
      gapAnalysis: resultData.gapAnalysis || [],
      metadata: resultData.metadata || {},
    }).returning();
    return this.mapScoringResultRow(result[0]);
  }

  async getScoringResultsBySession(agentId: string, sessionId: string): Promise<ScoringResult[]> {
    const result = await db.select().from(scoringResults)
      .where(and(
        eq(scoringResults.agentId, parseInt(agentId)),
        eq(scoringResults.sessionId, sessionId)
      ))
      .orderBy(desc(scoringResults.createdAt));
    return result.map(row => this.mapScoringResultRow(row));
  }

  // ─── Company Profile methods ───────────────────────────────────────────────
  private mapCompanyProfile(row: any): CompanyProfile {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      businessType: row.businessType || "PT",
      nib: row.nib || "",
      nibStatus: row.nibStatus || "Ada",
      npwp: row.npwp || "",
      npwpStatus: row.npwpStatus || "Ada",
      address: row.address || "",
      picName: row.picName || "",
      picContact: row.picContact || "",
      experiences: (row.experiences as any) || [],
      personnel: (row.personnel as any) || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getCompanyProfiles(userId: string): Promise<CompanyProfile[]> {
    const rows = await db.select().from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .orderBy(desc(companyProfiles.updatedAt));
    return rows.map(r => this.mapCompanyProfile(r));
  }

  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    const rows = await db.select().from(companyProfiles)
      .where(eq(companyProfiles.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    return this.mapCompanyProfile(rows[0]);
  }

  async createCompanyProfile(data: InsertCompanyProfile): Promise<CompanyProfile> {
    const rows = await db.insert(companyProfiles).values({
      userId: data.userId,
      name: data.name,
      businessType: data.businessType || "PT",
      nib: data.nib || "",
      nibStatus: data.nibStatus || "Ada",
      npwp: data.npwp || "",
      npwpStatus: data.npwpStatus || "Ada",
      address: data.address || "",
      picName: data.picName || "",
      picContact: data.picContact || "",
      experiences: (data.experiences as any) || [],
      personnel: (data.personnel as any) || [],
    }).returning();
    return this.mapCompanyProfile(rows[0]);
  }

  async updateCompanyProfile(id: number, data: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const rows = await db.update(companyProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyProfiles.id, id))
      .returning();
    if (rows.length === 0) return undefined;
    return this.mapCompanyProfile(rows[0]);
  }

  async deleteCompanyProfile(id: number): Promise<boolean> {
    const result = await db.delete(companyProfiles).where(eq(companyProfiles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ─── Tender Session methods ─────────────────────────────────────────────────
  private mapTenderSession(row: any): TenderSession {
    return {
      id: row.id,
      userId: row.userId,
      packType: row.packType || "pelaksana_konstruksi",
      companyProfileId: row.companyProfileId || null,
      status: row.status || "draft",
      selectedOutputs: (row.selectedOutputs as string[]) || [],
      tenderProfile: (row.tenderProfile as any) || {},
      requirements: (row.requirements as any) || {},
      technicalApproach: (row.technicalApproach as any) || {},
      complianceAnswers: (row.complianceAnswers as any) || {},
      scoreKelengkapan: row.scoreKelengkapan || null,
      scoreTeknis: row.scoreTeknis || null,
      generatedChecklist: (row.generatedChecklist as any) || null,
      generatedRiskReview: (row.generatedRiskReview as any) || null,
      generatedDrafts: (row.generatedDrafts as any) || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getTenderSessions(userId: string): Promise<TenderSession[]> {
    const rows = await db.select().from(tenderSessions)
      .where(eq(tenderSessions.userId, userId))
      .orderBy(desc(tenderSessions.updatedAt));
    return rows.map(r => this.mapTenderSession(r));
  }

  async getTenderSession(id: number): Promise<TenderSession | undefined> {
    const rows = await db.select().from(tenderSessions)
      .where(eq(tenderSessions.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    return this.mapTenderSession(rows[0]);
  }

  async createTenderSession(data: InsertTenderSession): Promise<TenderSession> {
    const rows = await db.insert(tenderSessions).values({
      userId: data.userId,
      packType: data.packType || "pelaksana_konstruksi",
      companyProfileId: data.companyProfileId || null,
      status: data.status || "draft",
      selectedOutputs: (data.selectedOutputs as any) || [],
      tenderProfile: (data.tenderProfile as any) || {},
      requirements: (data.requirements as any) || {},
      technicalApproach: (data.technicalApproach as any) || {},
      complianceAnswers: (data.complianceAnswers as any) || {},
    }).returning();
    return this.mapTenderSession(rows[0]);
  }

  async updateTenderSession(id: number, data: Partial<InsertTenderSession>): Promise<TenderSession | undefined> {
    const rows = await db.update(tenderSessions)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(tenderSessions.id, id))
      .returning();
    if (rows.length === 0) return undefined;
    return this.mapTenderSession(rows[0]);
  }

  async deleteTenderSession(id: number): Promise<boolean> {
    const result = await db.delete(tenderSessions).where(eq(tenderSessions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== Tender Document Catalog (Perpres 46/2025) ====================

  async getTenderDocumentCatalog(filters?: { sisi?: string; jenisTender?: string; kelompok?: string; priority?: string }): Promise<TenderDocumentCatalog[]> {
    const conds: any[] = [eq(tenderDocumentCatalog.isActive, true)];
    if (filters?.sisi && filters.sisi !== "semua") {
      // sisi penyedia/pokja juga match "keduanya"
      conds.push(sql`(${tenderDocumentCatalog.sisi} = ${filters.sisi} OR ${tenderDocumentCatalog.sisi} = 'keduanya')`);
    }
    if (filters?.jenisTender && filters.jenisTender !== "semua") {
      conds.push(sql`(${tenderDocumentCatalog.jenisTender} = ${filters.jenisTender} OR ${tenderDocumentCatalog.jenisTender} = 'semua')`);
    }
    if (filters?.kelompok) conds.push(eq(tenderDocumentCatalog.kelompok, filters.kelompok));
    if (filters?.priority) conds.push(eq(tenderDocumentCatalog.priority, filters.priority));
    const rows = await db.select().from(tenderDocumentCatalog)
      .where(conds.length > 1 ? and(...conds) : conds[0])
      .orderBy(tenderDocumentCatalog.kelompok, tenderDocumentCatalog.sortOrder, tenderDocumentCatalog.code);
    return rows;
  }

  async getTenderDocumentByCode(code: string): Promise<TenderDocumentCatalog | undefined> {
    const rows = await db.select().from(tenderDocumentCatalog).where(eq(tenderDocumentCatalog.code, code)).limit(1);
    return rows[0];
  }

  async upsertTenderDocumentCatalog(doc: InsertTenderDocumentCatalog): Promise<TenderDocumentCatalog> {
    // Atomic upsert berbasis unique constraint pada `code` — aman dari race condition
    // saat seed paralel atau update bersamaan.
    const rows = await db.insert(tenderDocumentCatalog)
      .values(doc as any)
      .onConflictDoUpdate({
        target: tenderDocumentCatalog.code,
        set: { ...doc, code: doc.code } as any,
      })
      .returning();
    return rows[0];
  }

  async deleteTenderDocumentCatalog(code: string): Promise<boolean> {
    const result = await db.delete(tenderDocumentCatalog).where(eq(tenderDocumentCatalog.code, code));
    return (result.rowCount ?? 0) > 0;
  }

  // ─── Chatbot Templates ──────────────────────────────────────────────────────

  async getChatbotTemplates(category?: string): Promise<ChatbotTemplate[]> {
    if (category && category !== "Semua") {
      return db.select().from(chatbotTemplates)
        .where(and(eq(chatbotTemplates.isPublic, true), eq(chatbotTemplates.category, category)))
        .orderBy(desc(chatbotTemplates.isFeatured), desc(chatbotTemplates.usageCount));
    }
    return db.select().from(chatbotTemplates)
      .where(eq(chatbotTemplates.isPublic, true))
      .orderBy(desc(chatbotTemplates.isFeatured), desc(chatbotTemplates.usageCount));
  }

  async getChatbotTemplate(id: number): Promise<ChatbotTemplate | undefined> {
    const rows = await db.select().from(chatbotTemplates).where(eq(chatbotTemplates.id, id)).limit(1);
    return rows[0];
  }

  async createChatbotTemplate(data: InsertChatbotTemplate): Promise<ChatbotTemplate> {
    const rows = await db.insert(chatbotTemplates).values(data as any).returning();
    return rows[0];
  }

  async deleteChatbotTemplate(id: number): Promise<boolean> {
    const result = await db.delete(chatbotTemplates).where(eq(chatbotTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    await db.update(chatbotTemplates)
      .set({ usageCount: sql`${chatbotTemplates.usageCount} + 1` })
      .where(eq(chatbotTemplates.id, id));
  }

  // ─── User Onboarding ────────────────────────────────────────────────────────

  async getUserOnboarding(userId: string): Promise<{ starterCreated: boolean } | undefined> {
    const rows = await db.select().from(userOnboarding).where(eq(userOnboarding.userId, userId)).limit(1);
    if (!rows[0]) return undefined;
    return { starterCreated: rows[0].starterCreated ?? false };
  }

  async markStarterCreated(userId: string): Promise<void> {
    await db.insert(userOnboarding)
      .values({ userId, starterCreated: true, onboardingCompletedAt: new Date() })
      .onConflictDoUpdate({
        target: userOnboarding.userId,
        set: { starterCreated: true, onboardingCompletedAt: new Date() },
      });
  }

  // ─── Store Products ──────────────────────────────────────────────────────────

  async getStoreProducts(): Promise<StoreProduct[]> {
    return db.select().from(storeProducts).where(eq(storeProducts.isActive, true)).orderBy(storeProducts.sortOrder, storeProducts.id);
  }

  async getStoreProduct(id: number): Promise<StoreProduct | undefined> {
    const rows = await db.select().from(storeProducts).where(eq(storeProducts.id, id)).limit(1);
    return rows[0];
  }

  async createStoreProduct(data: InsertStoreProduct): Promise<StoreProduct> {
    const rows = await db.insert(storeProducts).values(data as any).returning();
    return rows[0];
  }

  async updateStoreProduct(id: number, data: Partial<InsertStoreProduct>): Promise<StoreProduct | undefined> {
    const rows = await db.update(storeProducts).set(data as any).where(eq(storeProducts.id, id)).returning();
    return rows[0];
  }

  async deleteStoreProduct(id: number): Promise<boolean> {
    const result = await db.delete(storeProducts).where(eq(storeProducts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ─── Store Orders ────────────────────────────────────────────────────────────

  async getStoreOrders(): Promise<StoreOrder[]> {
    return db.select().from(storeOrders).orderBy(desc(storeOrders.createdAt));
  }

  async getStoreOrder(id: number): Promise<StoreOrder | undefined> {
    const rows = await db.select().from(storeOrders).where(eq(storeOrders.id, id)).limit(1);
    return rows[0];
  }

  async getStoreOrderByMidtransId(orderId: string): Promise<StoreOrder | undefined> {
    const rows = await db.select().from(storeOrders).where(eq(storeOrders.midtransOrderId, orderId)).limit(1);
    return rows[0];
  }

  async getStoreOrderByAccessToken(token: string): Promise<StoreOrder | undefined> {
    const rows = await db.select().from(storeOrders).where(eq(storeOrders.accessToken, token)).limit(1);
    return rows[0];
  }

  async createStoreOrder(data: InsertStoreOrder): Promise<StoreOrder> {
    const rows = await db.insert(storeOrders).values(data as any).returning();
    return rows[0];
  }

  async updateStoreOrderStatus(id: number, status: string): Promise<StoreOrder | undefined> {
    const rows = await db.update(storeOrders).set({ status }).where(eq(storeOrders.id, id)).returning();
    return rows[0];
  }

  // ── Research Report (arsip laporan war-room) methods ───────────────────────
  async getResearchReports(userId: string, agentSlug: string): Promise<ResearchReport[]> {
    return await db.select().from(researchReports)
      .where(and(eq(researchReports.userId, userId), eq(researchReports.agentSlug, agentSlug)))
      .orderBy(desc(researchReports.createdAt));
  }

  async getResearchReport(id: number): Promise<ResearchReport | undefined> {
    const rows = await db.select().from(researchReports).where(eq(researchReports.id, id)).limit(1);
    return rows[0];
  }

  async createResearchReport(data: InsertResearchReport): Promise<ResearchReport> {
    const rows = await db.insert(researchReports).values(data as any).returning();
    return rows[0];
  }

  async deleteResearchReport(id: number): Promise<void> {
    await db.delete(researchReports).where(eq(researchReports.id, id));
  }

  // ── Scalev Mapping methods ─────────────────────────────────────────────────
  async getScalevMappings(): Promise<ScalevMapping[]> {
    return await db.select().from(scalevMappings).orderBy(desc(scalevMappings.createdAt));
  }

  async getScalevMappingByProductName(name: string): Promise<ScalevMapping | undefined> {
    const rows = await db.select().from(scalevMappings).where(eq(scalevMappings.scalevProductName, name));
    return rows[0];
  }

  async createScalevMapping(data: InsertScalevMapping): Promise<ScalevMapping> {
    const rows = await db.insert(scalevMappings).values(data as any).returning();
    return rows[0];
  }

  async updateScalevMapping(id: number, data: Partial<InsertScalevMapping>): Promise<ScalevMapping | undefined> {
    const rows = await db.update(scalevMappings).set(data as any).where(eq(scalevMappings.id, id)).returning();
    return rows[0];
  }

  async deleteScalevMapping(id: number): Promise<boolean> {
    const rows = await db.delete(scalevMappings).where(eq(scalevMappings.id, id)).returning();
    return rows.length > 0;
  }

  // ── Tender Alert Profiles ─────────────────────────────────────────────────

  async getTenderAlertProfile(userId: string): Promise<TenderAlertProfile | undefined> {
    const [row] = await db.select().from(tenderAlertProfiles).where(eq(tenderAlertProfiles.userId, userId));
    return row;
  }

  async upsertTenderAlertProfile(data: InsertTenderAlertProfile): Promise<TenderAlertProfile> {
    const existing = await this.getTenderAlertProfile(data.userId);
    if (existing) {
      const [row] = await db
        .update(tenderAlertProfiles)
        .set({ ...data, updatedAt: new Date() } as any)
        .where(eq(tenderAlertProfiles.userId, data.userId))
        .returning();
      return row;
    }
    const [row] = await db.insert(tenderAlertProfiles).values(data as any).returning();
    return row;
  }

  async getAllActiveTenderAlertProfiles(): Promise<TenderAlertProfile[]> {
    return db
      .select()
      .from(tenderAlertProfiles)
      .where(eq(tenderAlertProfiles.notifEnabled, true));
  }

  async getTendersMatchingProfile(profile: TenderAlertProfile, limit = 30): Promise<Tender[]> {
    const all = await db
      .select()
      .from(tenders)
      .orderBy(desc(tenders.createdAt))
      .limit(500);

    return all
      .filter((t) => {
        // Sektor filter
        if (profile.sectors?.length > 0) {
          if (!profile.sectors.includes(t.sector ?? "konstruksi")) return false;
        }
        // Kualifikasi filter (dari rawData SIRUP)
        if (profile.kualifikasi?.length > 0) {
          const k = ((t.rawData as any)?.kualifikasi ?? "").toLowerCase();
          if (k && !profile.kualifikasi.some((q) => k.includes(q.toLowerCase()))) return false;
        }
        // Wilayah filter
        if (profile.wilayah?.length > 0) {
          const loc = (t.location ?? "").toLowerCase();
          if (loc && !profile.wilayah.some((w) => loc.includes(w.toLowerCase()))) return false;
        }
        // Keyword filter
        if (profile.keywords?.length > 0) {
          const name = (t.name ?? "").toLowerCase();
          if (!profile.keywords.some((kw) => name.includes(kw.toLowerCase()))) return false;
        }
        return true;
      })
      .slice(0, limit);
  }

  async markAlertProfileNotified(userId: string): Promise<void> {
    await db
      .update(tenderAlertProfiles)
      .set({ lastNotifiedAt: new Date() })
      .where(eq(tenderAlertProfiles.userId, userId));
  }

  // ── Agentic Deliverables ─────────────────────────────────────────────────
  async getAgenticDeliverables(agentId: string): Promise<AgenticDeliverable[]> {
    return db.select().from(agenticDeliverables)
      .where(eq(agenticDeliverables.agentId, parseInt(agentId)))
      .orderBy(desc(agenticDeliverables.updatedAt));
  }

  async upsertAgenticDeliverable(data: InsertAgenticDeliverable): Promise<AgenticDeliverable> {
    const now = new Date();
    const existing = await db.select().from(agenticDeliverables)
      .where(eq(agenticDeliverables.dedupeKey, data.dedupeKey)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(agenticDeliverables)
        .set({ title: data.title, content: data.content, status: data.status ?? existing[0].status, updatedAt: now })
        .where(eq(agenticDeliverables.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(agenticDeliverables)
      .values({ ...data, status: data.status ?? "open", createdAt: now, updatedAt: now })
      .returning();
    return created;
  }

  async updateAgenticDeliverableStatus(id: string, status: string): Promise<AgenticDeliverable | undefined> {
    const [updated] = await db.update(agenticDeliverables)
      .set({ status, updatedAt: new Date() })
      .where(eq(agenticDeliverables.id, parseInt(id)))
      .returning();
    return updated;
  }

  async deleteAgenticDeliverable(id: string): Promise<boolean> {
    const result = await db.delete(agenticDeliverables)
      .where(eq(agenticDeliverables.id, parseInt(id)));
    return (result.rowCount ?? 0) > 0;
  }

  // Workroom methods (Fase 1 — ruang kerja manusia + agen)
  async getWorkrooms(userId: string): Promise<Workroom[]> {
    return db.select().from(workrooms)
      .where(eq(workrooms.userId, userId))
      .orderBy(desc(workrooms.updatedAt));
  }

  async getWorkroom(id: number): Promise<Workroom | undefined> {
    const result = await db.select().from(workrooms).where(eq(workrooms.id, id)).limit(1);
    return result[0];
  }

  async createWorkroom(data: InsertWorkroom): Promise<Workroom> {
    const now = new Date();
    const [created] = await db.insert(workrooms)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning();
    return created;
  }

  async updateWorkroom(id: number, data: Partial<InsertWorkroom>): Promise<Workroom | undefined> {
    const [updated] = await db.update(workrooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workrooms.id, id))
      .returning();
    return updated;
  }

  async deleteWorkroom(id: number): Promise<boolean> {
    await db.delete(workroomLogs).where(eq(workroomLogs.workroomId, id));
    await db.delete(workroomGates).where(eq(workroomGates.workroomId, id));
    const result = await db.delete(workrooms).where(eq(workrooms.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getWorkroomGates(workroomId: number): Promise<WorkroomGate[]> {
    return db.select().from(workroomGates)
      .where(eq(workroomGates.workroomId, workroomId))
      .orderBy(desc(workroomGates.createdAt));
  }

  async createWorkroomGate(data: InsertWorkroomGate): Promise<WorkroomGate> {
    const [created] = await db.insert(workroomGates)
      .values({ ...data, createdAt: new Date() })
      .returning();
    return created;
  }

  async decideWorkroomGate(id: number, status: string, note: string): Promise<WorkroomGate | undefined> {
    const [updated] = await db.update(workroomGates)
      .set({ status, note, decidedAt: new Date() })
      .where(eq(workroomGates.id, id))
      .returning();
    return updated;
  }

  async getWorkroomLogs(workroomId: number): Promise<WorkroomLog[]> {
    return db.select().from(workroomLogs)
      .where(eq(workroomLogs.workroomId, workroomId))
      .orderBy(desc(workroomLogs.createdAt));
  }

  async createWorkroomLog(data: InsertWorkroomLog): Promise<WorkroomLog> {
    const [created] = await db.insert(workroomLogs)
      .values({ ...data, createdAt: new Date() })
      .returning();
    return created;
  }

  // Blueprint methods (AI Organization Builder — additive, not yet route-wired)
  async getBlueprints(userId?: string): Promise<BlueprintRecord[]> {
    const query = userId
      ? db.select().from(blueprints).where(eq(blueprints.userId, userId)).orderBy(desc(blueprints.updatedAt))
      : db.select().from(blueprints).orderBy(desc(blueprints.updatedAt));
    return await query;
  }

  async getBlueprint(id: number): Promise<BlueprintRecord | undefined> {
    const result = await db.select().from(blueprints).where(eq(blueprints.id, id)).limit(1);
    return result[0];
  }

  async createBlueprint(data: InsertBlueprint): Promise<BlueprintRecord> {
    const [created] = await db.insert(blueprints).values(data).returning();
    return created;
  }

  async updateBlueprint(id: number, data: Partial<InsertBlueprint>): Promise<BlueprintRecord | undefined> {
    const [updated] = await db.update(blueprints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blueprints.id, id))
      .returning();
    return updated;
  }

  async deleteBlueprint(id: number): Promise<boolean> {
    const result = await db.delete(blueprints).where(eq(blueprints.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getBlueprintForUser(id: number, userId: string): Promise<BlueprintRecord | undefined> {
    const result = await db.select().from(blueprints)
      .where(and(eq(blueprints.id, id), eq(blueprints.userId, userId))).limit(1);
    return result[0];
  }

  async updateBlueprintForUser(id: number, userId: string, data: Partial<InsertBlueprint>): Promise<BlueprintRecord | undefined> {
    const [updated] = await db.update(blueprints)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(blueprints.id, id), eq(blueprints.userId, userId)))
      .returning();
    return updated;
  }

  async deleteBlueprintForUser(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(blueprints)
      .where(and(eq(blueprints.id, id), eq(blueprints.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Organization Draft methods (saved team designs — owner-scoped)
  async listOrganizationDraftsForUser(userId: string): Promise<OrganizationDraftRecord[]> {
    return await db.select().from(organizationDrafts)
      .where(eq(organizationDrafts.userId, userId))
      .orderBy(desc(organizationDrafts.updatedAt));
  }

  async getOrganizationDraftForUser(id: number, userId: string): Promise<OrganizationDraftRecord | undefined> {
    const result = await db.select().from(organizationDrafts)
      .where(and(eq(organizationDrafts.id, id), eq(organizationDrafts.userId, userId))).limit(1);
    return result[0];
  }

  async createOrganizationDraft(data: InsertOrganizationDraft): Promise<OrganizationDraftRecord> {
    const [created] = await db.insert(organizationDrafts).values(data).returning();
    return created;
  }

  async updateOrganizationDraftForUser(id: number, userId: string, data: Partial<InsertOrganizationDraft>): Promise<OrganizationDraftRecord | undefined> {
    const [updated] = await db.update(organizationDrafts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(organizationDrafts.id, id), eq(organizationDrafts.userId, userId)))
      .returning();
    return updated;
  }

  async deleteOrganizationDraftForUser(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(organizationDrafts)
      .where(and(eq(organizationDrafts.id, id), eq(organizationDrafts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Shared Certificate methods (public share links — immutable snapshot)
  async createSharedCertificate(data: InsertSharedCertificate): Promise<SharedCertificateRecord> {
    const [created] = await db.insert(sharedCertificates).values(data).returning();
    return created;
  }

  async getSharedCertificateByToken(token: string): Promise<SharedCertificateRecord | undefined> {
    const result = await db.select().from(sharedCertificates)
      .where(eq(sharedCertificates.token, token)).limit(1);
    return result[0];
  }
}

export const dbStorage = new DatabaseStorage();
