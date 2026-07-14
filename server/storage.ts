import { randomUUID } from "crypto";
import { applyDefaultPolicies } from "./lib/agent-policies";
import type {
  Agent,
  InsertAgent,
  KnowledgeBase,
  InsertKnowledgeBase,
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
  AgenticDeliverable,
  InsertAgenticDeliverable,
  Workroom,
  InsertWorkroom,
  WorkroomGate,
  InsertWorkroomGate,
  WorkroomLog,
  InsertWorkroomLog,
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
  KnowledgeTaxonomyNode,
  KnowledgeTaxonomyTreeNode,
  InsertKnowledgeTaxonomy,
  TenderDocumentCatalog,
  InsertTenderDocumentCatalog,
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
  ChatbotTemplate,
  InsertChatbotTemplate,
  StoreProduct,
  InsertStoreProduct,
  StoreOrder,
  InsertStoreOrder,
  ResearchReport,
  InsertResearchReport,
  ScalevMapping,
  InsertScalevMapping,
  TenderAlertProfile,
  InsertTenderAlertProfile,
  BlueprintRecord,
  InsertBlueprint,
  OrganizationDraftRecord,
  InsertOrganizationDraft,
  SharedCertificateRecord,
  InsertSharedCertificate,
  AgentCollaborator,
  CollaboratorRole,
  PendingAgentInvite,
  AppliedInviteGrant,
  Notification,
  InsertNotification,
  CertificationAudit,
} from "@shared/schema";
import { NOTIFICATION_TYPES } from "@shared/schema";

export type CollaboratorView = AgentCollaborator & {
  email?: string | null;
  displayName?: string | null;
};

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Profile methods
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  // Series methods
  getSeries(): Promise<Series[]>;
  getSeriesById(id: string): Promise<Series | undefined>;
  getSeriesBySlug(slug: string): Promise<Series | undefined>;
  getPublicSeries(): Promise<SeriesWithStats[]>;
  getSeriesWithHierarchy(id: string): Promise<SeriesWithHierarchy | undefined>;
  createSeries(data: InsertSeries, userId: string): Promise<Series>;
  updateSeries(id: string, data: Partial<InsertSeries>): Promise<Series | undefined>;
  deleteSeries(id: string): Promise<boolean>;

  // Core methods
  getCores(seriesId?: string): Promise<Core[]>;
  getCore(id: string): Promise<Core | undefined>;
  createCore(data: InsertCore): Promise<Core>;
  updateCore(id: string, data: Partial<InsertCore>): Promise<Core | undefined>;
  deleteCore(id: string): Promise<boolean>;

  // Big Idea methods
  getBigIdeas(seriesId?: string): Promise<BigIdea[]>;
  getBigIdea(id: string): Promise<BigIdea | undefined>;
  getActiveBigIdea(): Promise<BigIdea | null>;
  createBigIdea(bigIdea: InsertBigIdea): Promise<BigIdea>;
  updateBigIdea(id: string, data: Partial<InsertBigIdea>): Promise<BigIdea | undefined>;
  setActiveBigIdea(id: string): Promise<BigIdea | undefined>;
  deleteBigIdea(id: string): Promise<boolean>;

  // Toolbox methods
  getToolboxes(bigIdeaId?: string, seriesId?: string): Promise<Toolbox[]>;
  getToolbox(id: string): Promise<Toolbox | undefined>;
  getActiveToolbox(): Promise<Toolbox | null>;
  getOrchestratorToolbox(seriesId: string): Promise<Toolbox | null>;
  createToolbox(toolbox: InsertToolbox): Promise<Toolbox>;
  updateToolbox(id: string, data: Partial<InsertToolbox>): Promise<Toolbox | undefined>;
  setActiveToolbox(id: string): Promise<Toolbox | undefined>;
  deleteToolbox(id: string): Promise<boolean>;

  // Agent methods
  getAgents(toolboxId?: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentBySlug(slug: string): Promise<Agent | undefined>;
  getActiveAgent(): Promise<Agent | null>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined>;
  cloneAgentForOwner(masterAgentId: number, ownerUserId: string): Promise<Agent>;
  setActiveAgent(id: string): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;

  // Agent Collaborator methods (sharing editor/viewer access)
  getCollaboratorRole(agentId: string, userId: string): Promise<CollaboratorRole | null>;
  listCollaboratorsForAgent(agentId: string): Promise<CollaboratorView[]>;
  listAgentIdsForCollaborator(userId: string): Promise<string[]>;
  addOrUpdateCollaborator(data: { agentId: string; userId: string; role: CollaboratorRole; invitedBy: string }): Promise<AgentCollaborator>;
  removeCollaborator(agentId: string, userId: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<{ id: string; email: string; firstName?: string | null; lastName?: string | null } | undefined>;
  getAgentsByIds(ids: string[]): Promise<Agent[]>;

  // Pending agent invites (share with email that has no account yet)
  addOrUpdatePendingInvite(data: { agentId: string; email: string; role: CollaboratorRole; invitedBy: string }): Promise<PendingAgentInvite>;
  listPendingInvitesForAgent(agentId: string): Promise<PendingAgentInvite[]>;
  addCertificationAudit(data: { agentId: string; certified: boolean; adminId: string }): Promise<CertificationAudit>;
  listCertificationAudits(agentId: string): Promise<CertificationAudit[]>;
  removePendingInvite(agentId: string, email: string): Promise<boolean>;
  applyPendingInvitesForUser(userId: string, email: string): Promise<AppliedInviteGrant[]>;

  // Pending Premium Privat deliveries (buyer paid, no account yet → clone at signup)
  addPendingPremiumDelivery(data: { masterAgentId: number; email: string; source?: string }): Promise<void>;
  getCloneForOwner(masterAgentId: number, ownerUserId: string): Promise<Agent | undefined>;
  applyPendingPremiumDeliveriesForUser(userId: string, email: string): Promise<Agent[]>;

  // Notification methods (in-app notices, e.g. agent shared)
  createNotification(data: InsertNotification): Promise<Notification>;
  listNotificationsForUser(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: number, userId: string): Promise<boolean>;
  markAllNotificationsRead(userId: string): Promise<number>;

  // Blueprint methods (AI Organization Builder — additive, not yet route-wired)
  getBlueprints(userId?: string): Promise<BlueprintRecord[]>;
  getBlueprint(id: number): Promise<BlueprintRecord | undefined>;
  createBlueprint(data: InsertBlueprint): Promise<BlueprintRecord>;
  updateBlueprint(id: number, data: Partial<InsertBlueprint>): Promise<BlueprintRecord | undefined>;
  deleteBlueprint(id: number): Promise<boolean>;
  // Owner-scoped variants (guard against cross-user access once routes are wired)
  getBlueprintForUser(id: number, userId: string): Promise<BlueprintRecord | undefined>;
  updateBlueprintForUser(id: number, userId: string, data: Partial<InsertBlueprint>): Promise<BlueprintRecord | undefined>;
  deleteBlueprintForUser(id: number, userId: string): Promise<boolean>;

  // Organization Draft methods (saved team designs — STRICTLY owner-scoped, no global getById)
  listOrganizationDraftsForUser(userId: string): Promise<OrganizationDraftRecord[]>;
  getOrganizationDraftForUser(id: number, userId: string): Promise<OrganizationDraftRecord | undefined>;
  createOrganizationDraft(data: InsertOrganizationDraft): Promise<OrganizationDraftRecord>;
  updateOrganizationDraftForUser(id: number, userId: string, data: Partial<InsertOrganizationDraft>): Promise<OrganizationDraftRecord | undefined>;
  deleteOrganizationDraftForUser(id: number, userId: string): Promise<boolean>;

  // Shared Certificate methods (Sertifikat Pembelajaran Reflektif — public share links)
  createSharedCertificate(data: InsertSharedCertificate): Promise<SharedCertificateRecord>;
  getSharedCertificateByToken(token: string): Promise<SharedCertificateRecord | undefined>;

  // Knowledge Base methods
  getKnowledgeBases(agentId: string): Promise<KnowledgeBase[]>;
  createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: string, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeBase(id: string): Promise<boolean>;

  // Knowledge Taxonomy methods
  getTaxonomyTree(): Promise<KnowledgeTaxonomyTreeNode[]>;
  getTaxonomyNode(id: number): Promise<KnowledgeTaxonomyNode | undefined>;
  createTaxonomyNode(node: InsertKnowledgeTaxonomy): Promise<KnowledgeTaxonomyNode>;
  updateTaxonomyNode(id: number, data: Partial<InsertKnowledgeTaxonomy>): Promise<KnowledgeTaxonomyNode | undefined>;
  deleteTaxonomyNode(id: number): Promise<boolean>;

  // Knowledge Base versioning methods
  getKBVersionHistory(kbId: string): Promise<KnowledgeBase[]>;
  supersedeKnowledgeBase(oldKbId: string, newKbId: string): Promise<KnowledgeBase | undefined>;
  getKnowledgeBasesByTaxonomy(taxonomyId: number, includeSuperseded?: boolean): Promise<KnowledgeBase[]>;

  // Tender Document Catalog (Perpres 46/2025)
  getTenderDocumentCatalog(filters?: { sisi?: string; jenisTender?: string; kelompok?: string; priority?: string }): Promise<TenderDocumentCatalog[]>;
  getTenderDocumentByCode(code: string): Promise<TenderDocumentCatalog | undefined>;
  upsertTenderDocumentCatalog(doc: InsertTenderDocumentCatalog): Promise<TenderDocumentCatalog>;
  deleteTenderDocumentCatalog(code: string): Promise<boolean>;

  // Knowledge Chunks methods (RAG)
  getChunksByKnowledgeBase(knowledgeBaseId: string): Promise<KnowledgeChunk[]>;
  getChunksByAgent(agentId: string): Promise<KnowledgeChunk[]>;
  createChunks(chunks: InsertKnowledgeChunk[]): Promise<KnowledgeChunk[]>;
  deleteChunksByKnowledgeBase(knowledgeBaseId: string): Promise<boolean>;
  deleteChunksByAgent(agentId: string): Promise<boolean>;

  // Integration methods
  getIntegrations(agentId: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: string): Promise<boolean>;

  // Message methods
  getMessages(agentId: string): Promise<Message[]>;
  getMessagesBySession(agentId: string, sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(agentId: string): Promise<boolean>;

  // Analytics methods
  getAnalytics(agentId: string): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsSummary(agentId: string): Promise<{
    totalMessages: number;
    totalSessions: number;
    totalIntegrationCalls: number;
    messagesLast7Days: number[];
    topHours: { hour: number; count: number }[];
  }>;

  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByMayarOrderId(mayarOrderId: string): Promise<Subscription | undefined>;
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  getLatestPendingSubscription(userId: string): Promise<Subscription | undefined>;
  provisionPartnerSeatSubscription(userId: string, partnerId: number): Promise<void>;
  deactivatePartnerSeatSubscription(userId: string, partnerId: number): Promise<void>;
  countPartnerSeatSubscriptions(partnerId: number): Promise<number>;
  claimPartnerSeat(params: { partnerId: number; agentId: string; seatCapacity: number; email: string; role: CollaboratorRole; invitedBy: string }): Promise<{ status: "granted" | "pending"; reason?: "seat_capacity_full"; seatsUsed?: number }>;
  revokePartnerSeat(params: { partnerId: number; agentId: string; userId?: string; email?: string }): Promise<void>;
  expireSubscriptions(): Promise<number>;
  incrementTrialMessages(subscriptionId: string): Promise<number>;

  // Durable platform-owner monthly message usage (survives restarts, shared across instances)
  getOwnerMonthlyUsage(ownerUserId: string, month: string): Promise<number>;
  incrementOwnerMonthlyUsage(ownerUserId: string, month: string): Promise<number>;
  deleteOwnerMonthlyUsageBefore(month: string): Promise<number>;

  // User dialog completion methods
  getUserDialogCompleted(userId: string): Promise<boolean>;
  setUserDialogCompleted(userId: string): Promise<void>;
  getUserClawPackages(userId: string): Promise<string[]>;
  updateUserClawPackages(userId: string, packages: string[]): Promise<void>;
  claimUserClawPackages(userId: string, packages: string[]): Promise<boolean>;
  
  // Agent count for subscription limits
  countUserAgents(userId: string): Promise<number>;

  // Project Brain Template methods
  getProjectBrainTemplates(agentId: string): Promise<ProjectBrainTemplate[]>;
  getProjectBrainTemplate(id: string): Promise<ProjectBrainTemplate | undefined>;
  createProjectBrainTemplate(template: InsertProjectBrainTemplate): Promise<ProjectBrainTemplate>;
  updateProjectBrainTemplate(id: string, data: Partial<InsertProjectBrainTemplate>): Promise<ProjectBrainTemplate | undefined>;
  deleteProjectBrainTemplate(id: string): Promise<boolean>;

  // Project Brain Instance methods
  getProjectBrainInstances(agentId: string): Promise<ProjectBrainInstance[]>;
  getProjectBrainInstance(id: string): Promise<ProjectBrainInstance | undefined>;
  getActiveProjectBrainInstance(agentId: string): Promise<ProjectBrainInstance | null>;
  createProjectBrainInstance(instance: InsertProjectBrainInstance): Promise<ProjectBrainInstance>;
  updateProjectBrainInstance(id: string, data: Partial<InsertProjectBrainInstance>): Promise<ProjectBrainInstance | undefined>;
  setActiveProjectBrainInstance(id: string): Promise<ProjectBrainInstance | undefined>;
  deleteProjectBrainInstance(id: string): Promise<boolean>;

  // Agentic Deliverables methods
  getAgenticDeliverables(agentId: string): Promise<AgenticDeliverable[]>;
  upsertAgenticDeliverable(data: InsertAgenticDeliverable): Promise<AgenticDeliverable>;
  updateAgenticDeliverableStatus(id: string, status: string): Promise<AgenticDeliverable | undefined>;
  deleteAgenticDeliverable(id: string): Promise<boolean>;

  // Workroom methods (Fase 1)
  getWorkrooms(userId: string): Promise<Workroom[]>;
  getWorkroom(id: number): Promise<Workroom | undefined>;
  createWorkroom(data: InsertWorkroom): Promise<Workroom>;
  updateWorkroom(id: number, data: Partial<InsertWorkroom>): Promise<Workroom | undefined>;
  deleteWorkroom(id: number): Promise<boolean>;
  getWorkroomGates(workroomId: number): Promise<WorkroomGate[]>;
  createWorkroomGate(data: InsertWorkroomGate): Promise<WorkroomGate>;
  decideWorkroomGate(id: number, status: string, note: string): Promise<WorkroomGate | undefined>;
  getWorkroomLogs(workroomId: number): Promise<WorkroomLog[]>;
  createWorkroomLog(data: InsertWorkroomLog): Promise<WorkroomLog>;

  // Mini App methods
  getMiniApps(agentId: string): Promise<MiniApp[]>;
  getMiniApp(id: string): Promise<MiniApp | undefined>;
  getMiniAppBySlug(slug: string): Promise<MiniApp | undefined>;
  createMiniApp(miniApp: InsertMiniApp): Promise<MiniApp>;
  updateMiniApp(id: string, data: Partial<InsertMiniApp>): Promise<MiniApp | undefined>;
  deleteMiniApp(id: string): Promise<boolean>;

  // Mini App Result methods
  getMiniAppResults(miniAppId: string): Promise<MiniAppResult[]>;
  createMiniAppResult(result: InsertMiniAppResult): Promise<MiniAppResult>;

  // Client Subscription methods
  getClientSubscriptions(agentId: string): Promise<ClientSubscription[]>;
  getClientSubscription(id: string): Promise<ClientSubscription | undefined>;
  getClientSubscriptionByToken(token: string): Promise<ClientSubscription | undefined>;
  getClientSubscriptionByEmail(agentId: string, email: string): Promise<ClientSubscription | undefined>;
  getClientSubscriptionByBigIdea(bigIdeaId: string, email: string): Promise<ClientSubscription | undefined>;
  createClientSubscription(sub: InsertClientSubscription): Promise<ClientSubscription>;
  updateClientSubscription(id: string, data: Partial<InsertClientSubscription & { messageUsedToday: number; messageUsedMonth: number; lastMessageDate: string; lastMonthReset: string }>): Promise<ClientSubscription | undefined>;
  deleteClientSubscription(id: string): Promise<boolean>;
  incrementClientMessageUsage(id: string): Promise<ClientSubscription | undefined>;
  getClientSubscriptionStats(agentId: string): Promise<{ totalClients: number; activeClients: number; totalRevenue: number }>;

  // Affiliate methods
  getAffiliates(): Promise<Affiliate[]>;
  getAffiliate(id: string): Promise<Affiliate | undefined>;
  getAffiliateByCode(code: string): Promise<Affiliate | undefined>;
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  updateAffiliate(id: string, data: Partial<InsertAffiliate>): Promise<Affiliate | undefined>;
  deleteAffiliate(id: string): Promise<boolean>;
  incrementAffiliateReferral(code: string, amount: number): Promise<Affiliate | undefined>;

  // Voucher methods
  getVouchers(agentId?: string): Promise<Voucher[]>;
  getVoucher(id: string): Promise<Voucher | undefined>;
  getVoucherByCode(code: string): Promise<Voucher | undefined>;
  createVoucher(voucher: InsertVoucher): Promise<Voucher>;
  updateVoucher(id: string, data: Partial<InsertVoucher>): Promise<Voucher | undefined>;
  deleteVoucher(id: string): Promise<boolean>;
  redeemVoucher(voucherId: number, clientSubscriptionId: number): Promise<VoucherRedemption>;
  getVoucherRedemptions(voucherId: string): Promise<VoucherRedemption[]>;
  getClientVoucherRedemptions(clientSubscriptionId: number): Promise<(VoucherRedemption & { voucher?: Voucher })[]>;

  // User Memory methods
  getUserMemories(agentId: string, sessionId?: string): Promise<UserMemory[]>;
  createUserMemory(memory: InsertUserMemory): Promise<UserMemory>;
  deleteUserMemory(id: string): Promise<boolean>;
  deleteUserMemoriesByAgent(agentId: string, sessionId?: string): Promise<boolean>;

  // Product listing methods
  getListedAgents(): Promise<Agent[]>;

  // WA Contact methods
  getWaContacts(agentId: string): Promise<WaContact[]>;
  getWaContact(id: string): Promise<WaContact | undefined>;
  upsertWaContact(contact: InsertWaContact): Promise<WaContact>;
  updateWaContact(id: string, data: Partial<InsertWaContact>): Promise<WaContact | undefined>;
  deleteWaContact(id: string): Promise<boolean>;

  // WA Broadcast methods
  getWaBroadcasts(agentId?: string): Promise<WaBroadcast[]>;
  getWaBroadcast(id: string): Promise<WaBroadcast | undefined>;
  getDueBroadcasts(): Promise<WaBroadcast[]>;
  createWaBroadcast(broadcast: InsertWaBroadcast): Promise<WaBroadcast>;
  updateWaBroadcast(id: string, data: Partial<InsertWaBroadcast>): Promise<WaBroadcast | undefined>;
  deleteWaBroadcast(id: string): Promise<boolean>;

  // WA Broadcast Run methods
  createBroadcastRun(run: Partial<WaBroadcastRun>): Promise<WaBroadcastRun>;
  updateBroadcastRun(id: string, data: Partial<WaBroadcastRun>): Promise<WaBroadcastRun | undefined>;
  getBroadcastRuns(broadcastId: string): Promise<WaBroadcastRun[]>;

  // Tender Source methods
  getTenderSources(): Promise<TenderSource[]>;
  getTenderSource(id: string): Promise<TenderSource | undefined>;
  createTenderSource(source: InsertTenderSource): Promise<TenderSource>;
  updateTenderSource(id: string, data: Partial<InsertTenderSource>): Promise<TenderSource | undefined>;
  deleteTenderSource(id: string): Promise<boolean>;

  // Tender methods
  getTenders(sourceId?: string, limit?: number): Promise<Tender[]>;
  getTender(id: string): Promise<Tender | undefined>;
  upsertTender(tender: InsertTender): Promise<Tender>;
  getLatestTenders(limit?: number): Promise<Tender[]>;
  deleteTender(id: string): Promise<boolean>;

  // Lead methods (Conversion Layer)
  getLeads(agentId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  getLeadsBySession(agentId: string, sessionId: string): Promise<Lead[]>;

  // Scoring Result methods (Conversion Layer)
  getScoringResults(agentId: string): Promise<ScoringResult[]>;
  getScoringResult(id: string): Promise<ScoringResult | undefined>;
  createScoringResult(result: InsertScoringResult): Promise<ScoringResult>;
  getScoringResultsBySession(agentId: string, sessionId: string): Promise<ScoringResult[]>;

  // Tender Alert Profile methods
  getTenderAlertProfile(userId: string): Promise<TenderAlertProfile | undefined>;
  upsertTenderAlertProfile(data: InsertTenderAlertProfile): Promise<TenderAlertProfile>;
  getAllActiveTenderAlertProfiles(): Promise<TenderAlertProfile[]>;
  getTendersMatchingProfile(profile: TenderAlertProfile, limit?: number): Promise<Tender[]>;
  markAlertProfileNotified(userId: string): Promise<void>;

  // Company Profile methods (Tender LPSE Pack)
  getCompanyProfiles(userId: string): Promise<CompanyProfile[]>;
  getCompanyProfile(id: number): Promise<CompanyProfile | undefined>;
  createCompanyProfile(data: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: number, data: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined>;
  deleteCompanyProfile(id: number): Promise<boolean>;

  // Tender Session methods (Tender LPSE Pack)
  getTenderSessions(userId: string): Promise<TenderSession[]>;
  getTenderSession(id: number): Promise<TenderSession | undefined>;
  createTenderSession(data: InsertTenderSession): Promise<TenderSession>;
  updateTenderSession(id: number, data: Partial<InsertTenderSession>): Promise<TenderSession | undefined>;
  deleteTenderSession(id: number): Promise<boolean>;

  // Chatbot Template methods
  getChatbotTemplates(category?: string): Promise<ChatbotTemplate[]>;
  getChatbotTemplate(id: number): Promise<ChatbotTemplate | undefined>;
  createChatbotTemplate(data: InsertChatbotTemplate): Promise<ChatbotTemplate>;
  deleteChatbotTemplate(id: number): Promise<boolean>;
  incrementTemplateUsage(id: number): Promise<void>;

  // User Onboarding methods
  getUserOnboarding(userId: string): Promise<{ starterCreated: boolean } | undefined>;
  markStarterCreated(userId: string): Promise<void>;

  // Store Product methods
  getStoreProducts(): Promise<StoreProduct[]>;
  getStoreProduct(id: number): Promise<StoreProduct | undefined>;
  createStoreProduct(data: InsertStoreProduct): Promise<StoreProduct>;
  updateStoreProduct(id: number, data: Partial<InsertStoreProduct>): Promise<StoreProduct | undefined>;
  deleteStoreProduct(id: number): Promise<boolean>;

  // Store Order methods
  getStoreOrders(): Promise<StoreOrder[]>;
  getStoreOrder(id: number): Promise<StoreOrder | undefined>;
  getStoreOrderByMidtransId(orderId: string): Promise<StoreOrder | undefined>;
  getStoreOrderByAccessToken(token: string): Promise<StoreOrder | undefined>;
  createStoreOrder(data: InsertStoreOrder): Promise<StoreOrder>;
  updateStoreOrderStatus(id: number, status: string): Promise<StoreOrder | undefined>;

  // Research Report (arsip laporan war-room) methods
  getResearchReports(userId: string, agentSlug: string): Promise<ResearchReport[]>;
  getResearchReport(id: number): Promise<ResearchReport | undefined>;
  createResearchReport(data: InsertResearchReport): Promise<ResearchReport>;
  deleteResearchReport(id: number): Promise<void>;

  // Scalev Mapping methods
  getScalevMappings(): Promise<ScalevMapping[]>;
  getScalevMappingByProductName(name: string): Promise<ScalevMapping | undefined>;
  createScalevMapping(data: InsertScalevMapping): Promise<ScalevMapping>;
  updateScalevMapping(id: number, data: Partial<InsertScalevMapping>): Promise<ScalevMapping | undefined>;
  deleteScalevMapping(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userProfiles: Map<string, UserProfile>;
  private seriesMap: Map<string, Series>;
  private bigIdeas: Map<string, BigIdea>;
  private toolboxes: Map<string, Toolbox>;
  private agents: Map<string, Agent>;
  private knowledgeBases: Map<string, KnowledgeBase>;
  private integrations: Map<string, Integration>;
  private messages: Map<string, Message>;
  private analytics: Map<string, Analytics>;
  private subscriptions: Map<string, Subscription>;
  private projectBrainTemplates: Map<string, ProjectBrainTemplate>;
  private projectBrainInstances: Map<string, ProjectBrainInstance>;
  private miniApps: Map<string, MiniApp>;
  private miniAppResults: Map<string, MiniAppResult>;
  private clientSubscriptions: Map<string, ClientSubscription>;
  private affiliatesMap: Map<string, Affiliate>;
  private vouchersMap: Map<string, Voucher>;
  private voucherRedemptionsMap: Map<string, VoucherRedemption>;
  private userMemoriesMap: Map<string, UserMemory>;
  private coresMap: Map<string, Core>;
  private leadsMap: Map<string, Lead>;
  private scoringResultsMap: Map<string, ScoringResult>;
  // Kolaborator agen: key = `${agentId}::${userId}` (agentId disimpan apa adanya
  // sebagai string agar cocok dengan id UUID MemStorage). DatabaseStorage pakai
  // integer agentId; di sini cukup string supaya lookup konsisten.
  private agentCollaboratorsMap: Map<string, AgentCollaborator & { rawAgentId: string }>;
  private collaboratorIdSeq = 0;
  private pendingInvitesMap: Map<string, PendingAgentInvite & { rawAgentId: string }> = new Map();
  private pendingInviteIdSeq = 0;
  private certificationAuditList: (CertificationAudit & { rawAgentId: string })[] = [];
  private certificationAuditIdSeq = 0;
  private notificationsMap: Map<number, Notification> = new Map();
  private notificationIdSeq = 0;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.seriesMap = new Map();
    this.coresMap = new Map();
    this.bigIdeas = new Map();
    this.toolboxes = new Map();
    this.agents = new Map();
    this.knowledgeBases = new Map();
    this.integrations = new Map();
    this.messages = new Map();
    this.analytics = new Map();
    this.subscriptions = new Map();
    this.projectBrainTemplates = new Map();
    this.projectBrainInstances = new Map();
    this.miniApps = new Map();
    this.miniAppResults = new Map();
    this.clientSubscriptions = new Map();
    this.affiliatesMap = new Map();
    this.vouchersMap = new Map();
    this.voucherRedemptionsMap = new Map();
    this.userMemoriesMap = new Map();
    this.leadsMap = new Map();
    this.scoringResultsMap = new Map();
    this.agentCollaboratorsMap = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date().toISOString() };
    this.users.set(id, user);
    return user;
  }

  // User Profile methods
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(p => p.userId === userId);
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const profile: UserProfile = {
      ...insertProfile,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.userProfiles.set(id, profile);
    return profile;
  }

  async updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return undefined;
    
    const updated: UserProfile = {
      ...profile,
      displayName: data.displayName !== undefined ? data.displayName : profile.displayName,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : profile.avatarUrl,
      bio: data.bio !== undefined ? data.bio : profile.bio,
      company: data.company !== undefined ? data.company : profile.company,
      position: data.position !== undefined ? data.position : profile.position,
      email: data.email !== undefined ? data.email : profile.email,
      phone: data.phone !== undefined ? data.phone : profile.phone,
      updatedAt: new Date().toISOString(),
    };
    this.userProfiles.set(profile.id, updated);
    return updated;
  }

  // Series methods
  async getSeries(): Promise<Series[]> {
    return Array.from(this.seriesMap.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getSeriesById(id: string): Promise<Series | undefined> {
    return this.seriesMap.get(id);
  }

  async getSeriesBySlug(slug: string): Promise<Series | undefined> {
    return Array.from(this.seriesMap.values()).find(s => s.slug === slug);
  }

  async getPublicSeries(): Promise<SeriesWithStats[]> {
    return Array.from(this.seriesMap.values())
      .filter(s => s.isPublic && s.isActive)
      .map(s => ({ ...s, totalBigIdeas: 0, totalToolboxes: 0, totalAgents: 0, totalCores: 0 }));
  }

  async getSeriesWithHierarchy(id: string): Promise<SeriesWithHierarchy | undefined> {
    const s = this.seriesMap.get(id);
    if (!s) return undefined;
    return { ...s, totalBigIdeas: 0, totalToolboxes: 0, totalAgents: 0, totalCores: 0, cores: [], bigIdeas: [] };
  }

  async createSeries(data: InsertSeries, userId: string): Promise<Series> {
    const id = randomUUID();
    const s: Series = { ...data, id, userId, isActive: true, createdAt: new Date().toISOString() };
    this.seriesMap.set(id, s);
    return s;
  }

  async updateSeries(id: string, data: Partial<InsertSeries>): Promise<Series | undefined> {
    const s = this.seriesMap.get(id);
    if (!s) return undefined;
    const updated: Series = { ...s, ...data };
    this.seriesMap.set(id, updated);
    return updated;
  }

  async deleteSeries(id: string): Promise<boolean> {
    return this.seriesMap.delete(id);
  }

  // Core methods
  async getCores(seriesId?: string): Promise<Core[]> {
    const all = Array.from(this.coresMap.values());
    if (seriesId) return all.filter(c => c.seriesId === seriesId);
    return all.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getCore(id: string): Promise<Core | undefined> {
    return this.coresMap.get(id);
  }

  async createCore(data: InsertCore): Promise<Core> {
    const id = randomUUID();
    const core: Core = {
      id,
      seriesId: data.seriesId,
      name: data.name,
      description: data.description || "",
      sortOrder: data.sortOrder || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.coresMap.set(id, core);
    return core;
  }

  async updateCore(id: string, data: Partial<InsertCore>): Promise<Core | undefined> {
    const core = this.coresMap.get(id);
    if (!core) return undefined;
    const updated = { ...core, ...data };
    this.coresMap.set(id, updated);
    return updated;
  }

  async deleteCore(id: string): Promise<boolean> {
    return this.coresMap.delete(id);
  }

  // Big Idea methods
  async getBigIdeas(): Promise<BigIdea[]> {
    return Array.from(this.bigIdeas.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getBigIdea(id: string): Promise<BigIdea | undefined> {
    return this.bigIdeas.get(id);
  }

  async getActiveBigIdea(): Promise<BigIdea | null> {
    const bigIdea = Array.from(this.bigIdeas.values()).find((b) => b.isActive);
    return bigIdea || null;
  }

  async createBigIdea(insertBigIdea: InsertBigIdea): Promise<BigIdea> {
    const id = randomUUID();
    
    const bigIdea: BigIdea = {
      id,
      name: insertBigIdea.name,
      type: insertBigIdea.type,
      description: insertBigIdea.description,
      goals: insertBigIdea.goals || [],
      targetAudience: insertBigIdea.targetAudience || "",
      expectedOutcome: insertBigIdea.expectedOutcome || "",
      seriesId: insertBigIdea.seriesId || undefined,
      coreId: insertBigIdea.coreId || undefined,
      sortOrder: insertBigIdea.sortOrder || 0,
      isActive: true,
      monthlyPrice: insertBigIdea.monthlyPrice ?? 0,
      trialEnabled: insertBigIdea.trialEnabled ?? true,
      trialDays: insertBigIdea.trialDays ?? 7,
      requireRegistration: insertBigIdea.requireRegistration ?? false,
      createdAt: new Date().toISOString(),
    };
    
    this.bigIdeas.set(id, bigIdea);
    return bigIdea;
  }

  async updateBigIdea(id: string, data: Partial<InsertBigIdea>): Promise<BigIdea | undefined> {
    const bigIdea = this.bigIdeas.get(id);
    if (!bigIdea) return undefined;

    const updated: BigIdea = {
      ...bigIdea,
      name: data.name !== undefined ? data.name : bigIdea.name,
      type: data.type !== undefined ? data.type : bigIdea.type,
      description: data.description !== undefined ? data.description : bigIdea.description,
      goals: data.goals !== undefined ? data.goals : bigIdea.goals,
      targetAudience: data.targetAudience !== undefined ? data.targetAudience : bigIdea.targetAudience,
      expectedOutcome: data.expectedOutcome !== undefined ? data.expectedOutcome : bigIdea.expectedOutcome,
      seriesId: data.seriesId !== undefined ? data.seriesId : bigIdea.seriesId,
      coreId: data.coreId !== undefined ? data.coreId : bigIdea.coreId,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : bigIdea.sortOrder,
    };
    
    this.bigIdeas.set(id, updated);
    return updated;
  }

  async setActiveBigIdea(id: string): Promise<BigIdea | undefined> {
    const bigIdea = this.bigIdeas.get(id);
    if (!bigIdea) return undefined;

    const updated: BigIdea = { ...bigIdea, isActive: true };
    this.bigIdeas.set(id, updated);
    return updated;
  }

  async deleteBigIdea(id: string): Promise<boolean> {
    const bigIdea = this.bigIdeas.get(id);
    if (!bigIdea) return false;
    
    const wasActive = bigIdea.isActive;
    const deleted = this.bigIdeas.delete(id);
    
    if (deleted && wasActive) {
      const remaining = Array.from(this.bigIdeas.values());
      if (remaining.length > 0) {
        this.bigIdeas.set(remaining[0].id, { ...remaining[0], isActive: true });
      }
    }
    
    // Delete related toolboxes
    Array.from(this.toolboxes.entries()).forEach(([toolboxId, t]) => {
      if (t.bigIdeaId === id) {
        this.deleteToolbox(toolboxId);
      }
    });
    
    return deleted;
  }

  // Toolbox methods
  async getToolboxes(bigIdeaId?: string, seriesId?: string): Promise<Toolbox[]> {
    let toolboxes = Array.from(this.toolboxes.values());
    if (bigIdeaId) {
      toolboxes = toolboxes.filter(t => t.bigIdeaId === bigIdeaId);
    } else if (seriesId) {
      toolboxes = toolboxes.filter(t => t.seriesId === seriesId);
    }
    return toolboxes.sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
  }

  async getToolbox(id: string): Promise<Toolbox | undefined> {
    return this.toolboxes.get(id);
  }

  async getActiveToolbox(): Promise<Toolbox | null> {
    const toolbox = Array.from(this.toolboxes.values()).find((t) => t.isActive);
    return toolbox || null;
  }

  async getOrchestratorToolbox(seriesId: string): Promise<Toolbox | null> {
    const toolbox = Array.from(this.toolboxes.values()).find(
      (t) => t.seriesId === seriesId && t.isOrchestrator === true
    );
    return toolbox || null;
  }

  async createToolbox(insertToolbox: InsertToolbox): Promise<Toolbox> {
    const id = randomUUID();
    
    const toolbox: Toolbox = {
      id,
      bigIdeaId: insertToolbox.bigIdeaId,
      seriesId: insertToolbox.seriesId,
      isOrchestrator: insertToolbox.isOrchestrator || false,
      name: insertToolbox.name,
      description: insertToolbox.description || "",
      purpose: insertToolbox.purpose || "",
      capabilities: insertToolbox.capabilities || [],
      limitations: insertToolbox.limitations || [],
      sortOrder: insertToolbox.sortOrder || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    this.toolboxes.set(id, toolbox);
    return toolbox;
  }

  async updateToolbox(id: string, data: Partial<InsertToolbox>): Promise<Toolbox | undefined> {
    const toolbox = this.toolboxes.get(id);
    if (!toolbox) return undefined;

    const updated: Toolbox = {
      ...toolbox,
      name: data.name !== undefined ? data.name : toolbox.name,
      description: data.description !== undefined ? data.description : toolbox.description,
      purpose: data.purpose !== undefined ? data.purpose : toolbox.purpose,
      capabilities: data.capabilities !== undefined ? data.capabilities : toolbox.capabilities,
      limitations: data.limitations !== undefined ? data.limitations : toolbox.limitations,
    };
    
    this.toolboxes.set(id, updated);
    return updated;
  }

  async setActiveToolbox(id: string): Promise<Toolbox | undefined> {
    const toolbox = this.toolboxes.get(id);
    if (!toolbox) return undefined;

    const updated: Toolbox = { ...toolbox, isActive: true };
    this.toolboxes.set(id, updated);
    return updated;
  }

  async deleteToolbox(id: string): Promise<boolean> {
    const toolbox = this.toolboxes.get(id);
    if (!toolbox) return false;
    
    const wasActive = toolbox.isActive;
    const deleted = this.toolboxes.delete(id);
    
    if (deleted && wasActive) {
      const remaining = Array.from(this.toolboxes.values());
      if (remaining.length > 0) {
        this.toolboxes.set(remaining[0].id, { ...remaining[0], isActive: true });
      }
    }
    
    // Delete related agents
    Array.from(this.agents.entries()).forEach(([agentId, a]) => {
      if (a.toolboxId === id) {
        this.deleteAgent(agentId);
      }
    });
    
    return deleted;
  }

  // Agent methods
  async getAgents(toolboxId?: string): Promise<Agent[]> {
    let agents = Array.from(this.agents.values());
    if (toolboxId) {
      agents = agents.filter(a => a.toolboxId === toolboxId);
    }
    return agents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentBySlug(slug: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(a => (a as any).slug === slug);
  }

  async getActiveAgent(): Promise<Agent | null> {
    const agent = Array.from(this.agents.values()).find((a) => a.isActive);
    return agent || null;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    
    const accessToken = `gus_${randomUUID().replace(/-/g, "")}`;

    // Auto-fill 7 field Kebijakan Agen. MemStorage tidak menyimpan series,
    // jadi pakai default kategori (helper akan fallback ke "regulasi").
    const filled = applyDefaultPolicies(insertAgent, null);

    const agent: Agent = ({
      id,
      name: insertAgent.name,
      description: insertAgent.description || "",
      avatar: insertAgent.avatar || "",
      tagline: insertAgent.tagline || "",
      philosophy: insertAgent.philosophy || "",
      offTopicHandling: insertAgent.offTopicHandling || "politely_redirect",
      offTopicResponse: insertAgent.offTopicResponse || "",
      systemPrompt: insertAgent.systemPrompt || "You are a helpful assistant.",
      temperature: insertAgent.temperature ?? 0.7,
      maxTokens: insertAgent.maxTokens ?? 1024,
      aiModel: insertAgent.aiModel || (insertAgent as any).model || "gpt-4o",
      customApiKey: insertAgent.customApiKey || "",
      customBaseUrl: insertAgent.customBaseUrl || "",
      customModelName: insertAgent.customModelName || "",
      greetingMessage: insertAgent.greetingMessage || "",
      conversationStarters: insertAgent.conversationStarters || [],
      language: insertAgent.language || "id",
      category: insertAgent.category || "",
      subcategory: insertAgent.subcategory || "",
      accessToken,
      isPublic: insertAgent.isPublic ?? false,
      allowedDomains: insertAgent.allowedDomains || [],
      toolboxId: insertAgent.toolboxId || "",
      bigIdeaId: insertAgent.bigIdeaId || "",
      isOrchestrator: insertAgent.isOrchestrator ?? false,
      orchestratorRole: insertAgent.orchestratorRole || "standalone",
      parentAgentId: insertAgent.parentAgentId || "",
      agenticMode: insertAgent.agenticMode ?? false,
      attentiveListening: insertAgent.attentiveListening ?? true,
      contextRetention: insertAgent.contextRetention ?? 10,
      proactiveAssistance: insertAgent.proactiveAssistance ?? false,
      learningEnabled: insertAgent.learningEnabled ?? false,
      emotionalIntelligence: insertAgent.emotionalIntelligence ?? true,
      multiStepReasoning: insertAgent.multiStepReasoning ?? true,
      selfCorrection: insertAgent.selfCorrection ?? true,
      behaviorPreset: (insertAgent as any).behaviorPreset || "Balanced",
      autonomyLevel: (insertAgent as any).autonomyLevel || "Terbatas",
      responseDepth: (insertAgent as any).responseDepth || "Terstruktur",
      outputFormat: (insertAgent as any).outputFormat || "Ringkasan + langkah",
      clarifyBeforeAnswer: (insertAgent as any).clarifyBeforeAnswer ?? true,
      uncertaintyHandling: (insertAgent as any).uncertaintyHandling || "Sarankan verifikasi ke sumber resmi",
      showRiskWarnings: (insertAgent as any).showRiskWarnings ?? true,
      contextPriority: (insertAgent as any).contextPriority || ["Pertanyaan terakhir", "Tujuan pengguna", "Riwayat percakapan"],
      proactiveAssistanceLevel: (insertAgent as any).proactiveAssistanceLevel || "Rendah",
      proactiveHelpTypes: (insertAgent as any).proactiveHelpTypes || ["Saran langkah berikutnya", "Pertanyaan klarifikasi", "Checklist"],
      interactionStyle: (insertAgent as any).interactionStyle || "Konsultatif",
      contextualEmpathy: (insertAgent as any).contextualEmpathy || "Ringan",
      actionBoundary: (insertAgent as any).actionBoundary || ["Hanya menjawab", "Boleh bertanya balik", "Boleh menyarankan"],
      escalationRules: (insertAgent as any).escalationRules || ["Arahkan ke sumber resmi", "Tampilkan disclaimer"],
      offTopicBehavior: (insertAgent as any).offTopicBehavior || "Jawab singkat lalu arahkan kembali",
      adaptiveLearningMode: (insertAgent as any).adaptiveLearningMode || "Off",
      storeInteractionSignals: (insertAgent as any).storeInteractionSignals ?? false,
      sourcePriority: (insertAgent as any).sourcePriority || ["System Prompt", "Knowledge Engine", "Riwayat percakapan", "Mini Apps", "Integrations", "Sumber eksternal"],
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
      isListed: insertAgent.isListed ?? false,
      isCertified: (insertAgent as any).isCertified ?? false,
      productSummary: insertAgent.productSummary || "",
      productFeatures: insertAgent.productFeatures || [],
      productPricing: insertAgent.productPricing || {},
      monthlyPrice: insertAgent.monthlyPrice ?? 0,
      trialEnabled: insertAgent.trialEnabled ?? true,
      trialDays: insertAgent.trialDays ?? 7,
      messageQuotaDaily: insertAgent.messageQuotaDaily ?? 50,
      messageQuotaMonthly: insertAgent.messageQuotaMonthly ?? 1000,
      requireRegistration: insertAgent.requireRegistration ?? false,
      brandingName: insertAgent.brandingName || "",
      brandingLogo: insertAgent.brandingLogo || "",
      userId: (insertAgent as any).userId || "",
      // Kebijakan Agen — auto-filled by applyDefaultPolicies above.
      primaryOutcome: filled.primaryOutcome,
      conversationWinConditions: filled.conversationWinConditions,
      brandVoiceSpec: filled.brandVoiceSpec,
      interactionPolicy: filled.interactionPolicy,
      domainCharter: filled.domainCharter,
      qualityBar: filled.qualityBar,
      riskCompliance: filled.riskCompliance,
      isActive: true,
      createdAt: new Date().toISOString(),
    } as unknown as Agent);
    
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updated: Agent = {
      ...agent,
      name: data.name !== undefined ? data.name : agent.name,
      description: data.description !== undefined ? data.description : agent.description,
      avatar: data.avatar !== undefined ? data.avatar : agent.avatar,
      tagline: data.tagline !== undefined ? data.tagline : agent.tagline,
      philosophy: data.philosophy !== undefined ? data.philosophy : agent.philosophy,
      offTopicHandling: data.offTopicHandling !== undefined ? data.offTopicHandling : agent.offTopicHandling,
      systemPrompt: data.systemPrompt !== undefined ? data.systemPrompt : agent.systemPrompt,
      temperature: data.temperature !== undefined ? Math.max(0, Math.min(2, data.temperature)) : agent.temperature,
      maxTokens: data.maxTokens !== undefined ? Math.max(100, Math.min(4096, data.maxTokens)) : agent.maxTokens,
      aiModel: data.aiModel !== undefined ? data.aiModel : agent.aiModel,
      customApiKey: data.customApiKey !== undefined ? data.customApiKey : agent.customApiKey,
      customBaseUrl: data.customBaseUrl !== undefined ? data.customBaseUrl : agent.customBaseUrl,
      customModelName: data.customModelName !== undefined ? data.customModelName : agent.customModelName,
      greetingMessage: data.greetingMessage !== undefined ? data.greetingMessage : agent.greetingMessage,
      conversationStarters: data.conversationStarters !== undefined ? data.conversationStarters : agent.conversationStarters,
      language: data.language !== undefined ? data.language : agent.language,
      category: data.category !== undefined ? data.category : agent.category,
      subcategory: data.subcategory !== undefined ? data.subcategory : agent.subcategory,
      isPublic: data.isPublic !== undefined ? data.isPublic : agent.isPublic,
      allowedDomains: data.allowedDomains !== undefined ? data.allowedDomains : agent.allowedDomains,
      toolboxId: data.toolboxId !== undefined ? data.toolboxId : agent.toolboxId,
      orchestratorRole: data.orchestratorRole !== undefined ? data.orchestratorRole : agent.orchestratorRole,
      parentAgentId: data.parentAgentId !== undefined ? data.parentAgentId : agent.parentAgentId,
      agenticMode: data.agenticMode !== undefined ? data.agenticMode : agent.agenticMode,
      attentiveListening: data.attentiveListening !== undefined ? data.attentiveListening : agent.attentiveListening,
      contextRetention: data.contextRetention !== undefined ? data.contextRetention : agent.contextRetention,
      proactiveAssistance: data.proactiveAssistance !== undefined ? data.proactiveAssistance : agent.proactiveAssistance,
      learningEnabled: data.learningEnabled !== undefined ? data.learningEnabled : agent.learningEnabled,
      emotionalIntelligence: data.emotionalIntelligence !== undefined ? data.emotionalIntelligence : agent.emotionalIntelligence,
      multiStepReasoning: data.multiStepReasoning !== undefined ? data.multiStepReasoning : agent.multiStepReasoning,
      selfCorrection: data.selfCorrection !== undefined ? data.selfCorrection : agent.selfCorrection,
      behaviorPreset: (data as any).behaviorPreset !== undefined ? (data as any).behaviorPreset : (agent as any).behaviorPreset,
      autonomyLevel: (data as any).autonomyLevel !== undefined ? (data as any).autonomyLevel : (agent as any).autonomyLevel,
      responseDepth: (data as any).responseDepth !== undefined ? (data as any).responseDepth : (agent as any).responseDepth,
      outputFormat: (data as any).outputFormat !== undefined ? (data as any).outputFormat : (agent as any).outputFormat,
      clarifyBeforeAnswer: (data as any).clarifyBeforeAnswer !== undefined ? (data as any).clarifyBeforeAnswer : (agent as any).clarifyBeforeAnswer,
      uncertaintyHandling: (data as any).uncertaintyHandling !== undefined ? (data as any).uncertaintyHandling : (agent as any).uncertaintyHandling,
      showRiskWarnings: (data as any).showRiskWarnings !== undefined ? (data as any).showRiskWarnings : (agent as any).showRiskWarnings,
      contextPriority: (data as any).contextPriority !== undefined ? (data as any).contextPriority : (agent as any).contextPriority,
      proactiveAssistanceLevel: (data as any).proactiveAssistanceLevel !== undefined ? (data as any).proactiveAssistanceLevel : (agent as any).proactiveAssistanceLevel,
      proactiveHelpTypes: (data as any).proactiveHelpTypes !== undefined ? (data as any).proactiveHelpTypes : (agent as any).proactiveHelpTypes,
      interactionStyle: (data as any).interactionStyle !== undefined ? (data as any).interactionStyle : (agent as any).interactionStyle,
      contextualEmpathy: (data as any).contextualEmpathy !== undefined ? (data as any).contextualEmpathy : (agent as any).contextualEmpathy,
      actionBoundary: (data as any).actionBoundary !== undefined ? (data as any).actionBoundary : (agent as any).actionBoundary,
      escalationRules: (data as any).escalationRules !== undefined ? (data as any).escalationRules : (agent as any).escalationRules,
      offTopicBehavior: (data as any).offTopicBehavior !== undefined ? (data as any).offTopicBehavior : (agent as any).offTopicBehavior,
      adaptiveLearningMode: (data as any).adaptiveLearningMode !== undefined ? (data as any).adaptiveLearningMode : (agent as any).adaptiveLearningMode,
      storeInteractionSignals: (data as any).storeInteractionSignals !== undefined ? (data as any).storeInteractionSignals : (agent as any).storeInteractionSignals,
      sourcePriority: (data as any).sourcePriority !== undefined ? (data as any).sourcePriority : (agent as any).sourcePriority,
      personality: data.personality !== undefined ? data.personality : agent.personality,
      expertise: data.expertise !== undefined ? data.expertise : agent.expertise,
      communicationStyle: data.communicationStyle !== undefined ? data.communicationStyle : agent.communicationStyle,
      toneOfVoice: data.toneOfVoice !== undefined ? data.toneOfVoice : agent.toneOfVoice,
      responseFormat: data.responseFormat !== undefined ? data.responseFormat : agent.responseFormat,
      avoidTopics: data.avoidTopics !== undefined ? data.avoidTopics : agent.avoidTopics,
      keyPhrases: data.keyPhrases !== undefined ? data.keyPhrases : agent.keyPhrases,
      widgetColor: data.widgetColor !== undefined ? data.widgetColor : agent.widgetColor,
      widgetPosition: data.widgetPosition !== undefined ? data.widgetPosition : agent.widgetPosition,
      widgetSize: data.widgetSize !== undefined ? data.widgetSize : agent.widgetSize,
      widgetBorderRadius: data.widgetBorderRadius !== undefined ? data.widgetBorderRadius : agent.widgetBorderRadius,
      widgetShowBranding: data.widgetShowBranding !== undefined ? data.widgetShowBranding : agent.widgetShowBranding,
      widgetWelcomeMessage: data.widgetWelcomeMessage !== undefined ? data.widgetWelcomeMessage : agent.widgetWelcomeMessage,
      widgetButtonIcon: data.widgetButtonIcon !== undefined ? data.widgetButtonIcon : agent.widgetButtonIcon,
      adCopies: (data as any).adCopies !== undefined ? (data as any).adCopies : (agent as any).adCopies,
      imageHookPrompts: (data as any).imageHookPrompts !== undefined ? (data as any).imageHookPrompts : (agent as any).imageHookPrompts,
      videoReelPrompts: (data as any).videoReelPrompts !== undefined ? (data as any).videoReelPrompts : (agent as any).videoReelPrompts,
      metaPixelId: (data as any).metaPixelId !== undefined ? (data as any).metaPixelId : (agent as any).metaPixelId,
      isCertified: (data as any).isCertified !== undefined ? (data as any).isCertified : (agent as any).isCertified,
    };
    
    this.agents.set(id, updated);
    return updated;
  }

  async setActiveAgent(id: string): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updated: Agent = { ...agent, isActive: true };
    this.agents.set(id, updated);
    return updated;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const agent = this.agents.get(id);
    if (!agent) return false;
    
    const wasActive = agent.isActive;
    const deleted = this.agents.delete(id);
    
    if (deleted && wasActive) {
      const remainingAgents = Array.from(this.agents.values());
      if (remainingAgents.length > 0) {
        const firstAgent = remainingAgents[0];
        this.agents.set(firstAgent.id, { ...firstAgent, isActive: true });
      }
    }
    
    // Delete related data
    Array.from(this.knowledgeBases.entries()).forEach(([kbId, kb]) => {
      if (kb.agentId === id) this.knowledgeBases.delete(kbId);
    });
    Array.from(this.integrations.entries()).forEach(([intId, integration]) => {
      if (integration.agentId === id) this.integrations.delete(intId);
    });
    Array.from(this.messages.entries()).forEach(([msgId, msg]) => {
      if (msg.agentId === id) this.messages.delete(msgId);
    });

    return deleted;
  }

  // Agent Collaborator methods (in-memory — paritas perilaku dengan DatabaseStorage).
  private collaboratorKey(agentId: string, userId: string): string {
    return `${agentId}::${userId}`;
  }

  async getCollaboratorRole(agentId: string, userId: string): Promise<CollaboratorRole | null> {
    if (!agentId || !userId) return null;
    const rec = this.agentCollaboratorsMap.get(this.collaboratorKey(agentId, userId));
    if (!rec) return null;
    return rec.role === "editor" || rec.role === "viewer" ? rec.role : null;
  }

  async listCollaboratorsForAgent(agentId: string): Promise<CollaboratorView[]> {
    return Array.from(this.agentCollaboratorsMap.values())
      .filter((c) => c.rawAgentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => {
        const u = this.users.get(c.userId);
        const displayName = u
          ? [(u as any).firstName, (u as any).lastName].filter(Boolean).join(" ") || null
          : null;
        return {
          id: c.id,
          agentId: c.agentId,
          userId: c.userId,
          role: c.role,
          invitedBy: c.invitedBy,
          createdAt: c.createdAt,
          email: (u as any)?.email ?? null,
          displayName,
        };
      });
  }

  async listAgentIdsForCollaborator(userId: string): Promise<string[]> {
    if (!userId) return [];
    return Array.from(this.agentCollaboratorsMap.values())
      .filter((c) => c.userId === userId)
      .map((c) => c.rawAgentId);
  }

  async addOrUpdateCollaborator(data: { agentId: string; userId: string; role: CollaboratorRole; invitedBy: string }): Promise<AgentCollaborator> {
    const key = this.collaboratorKey(data.agentId, data.userId);
    const existing = this.agentCollaboratorsMap.get(key);
    const rec: AgentCollaborator & { rawAgentId: string } = existing
      ? { ...existing, role: data.role, invitedBy: data.invitedBy }
      : {
          id: ++this.collaboratorIdSeq,
          // Numeric agentId hanya bermakna bila id agen memang integer (paritas
          // DatabaseStorage). Untuk id UUID (MemStorage) → 0; JANGAN parseInt
          // mentah karena UUID berawalan digit (mis. "8e4f…") menghasilkan angka
          // sampah (8) yang non-deterministik. Sumber kebenaran authz = rawAgentId.
          agentId: /^\d+$/.test(data.agentId) ? parseInt(data.agentId, 10) : 0,
          rawAgentId: data.agentId,
          userId: data.userId,
          role: data.role,
          invitedBy: data.invitedBy,
          createdAt: new Date(),
        };
    this.agentCollaboratorsMap.set(key, rec);
    const { rawAgentId: _omit, ...out } = rec;
    return out as AgentCollaborator;
  }

  async removeCollaborator(agentId: string, userId: string): Promise<boolean> {
    if (!agentId || !userId) return false;
    return this.agentCollaboratorsMap.delete(this.collaboratorKey(agentId, userId));
  }

  async getUserByEmail(email: string): Promise<{ id: string; email: string; firstName?: string | null; lastName?: string | null } | undefined> {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized) return undefined;
    const u = Array.from(this.users.values()).find(
      (x) => ((x as any).email || "").trim().toLowerCase() === normalized,
    );
    if (!u) return undefined;
    return {
      id: u.id,
      email: (u as any).email || "",
      firstName: (u as any).firstName ?? null,
      lastName: (u as any).lastName ?? null,
    };
  }

  async getAgentsByIds(ids: string[]): Promise<Agent[]> {
    return ids.map((id) => this.agents.get(id)).filter((a): a is Agent => !!a);
  }

  // ─── Pending agent invites ────────────────────────────────────────────────
  private pendingInviteKey(agentId: string, email: string): string {
    return `${agentId}::${(email || "").trim().toLowerCase()}`;
  }

  async addOrUpdatePendingInvite(data: { agentId: string; email: string; role: CollaboratorRole; invitedBy: string }): Promise<PendingAgentInvite> {
    const email = (data.email || "").trim().toLowerCase();
    const key = this.pendingInviteKey(data.agentId, email);
    const existing = this.pendingInvitesMap.get(key);
    const rec: PendingAgentInvite & { rawAgentId: string } = existing
      ? { ...existing, role: data.role, invitedBy: data.invitedBy }
      : {
          id: ++this.pendingInviteIdSeq,
          // Sama seperti addOrUpdateCollaborator: numerik hanya bermakna bila id
          // agen integer; UUID → 0 deterministik (parseInt(uuid) mentah = sampah).
          agentId: /^\d+$/.test(data.agentId) ? parseInt(data.agentId, 10) : 0,
          rawAgentId: data.agentId,
          email,
          role: data.role,
          invitedBy: data.invitedBy,
          createdAt: new Date(),
        };
    this.pendingInvitesMap.set(key, rec);
    const { rawAgentId: _omit, ...out } = rec;
    return out as PendingAgentInvite;
  }

  async listPendingInvitesForAgent(agentId: string): Promise<PendingAgentInvite[]> {
    return Array.from(this.pendingInvitesMap.values())
      .filter((p) => p.rawAgentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(({ rawAgentId: _omit, ...out }) => out as PendingAgentInvite);
  }

  async removePendingInvite(agentId: string, email: string): Promise<boolean> {
    return this.pendingInvitesMap.delete(this.pendingInviteKey(agentId, email));
  }

  async addCertificationAudit(data: { agentId: string; certified: boolean; adminId: string }): Promise<CertificationAudit> {
    const rec: CertificationAudit & { rawAgentId: string } = {
      id: ++this.certificationAuditIdSeq,
      // Numerik hanya bermakna bila id agen integer; UUID → 0 deterministik.
      agentId: /^\d+$/.test(data.agentId) ? parseInt(data.agentId, 10) : 0,
      rawAgentId: data.agentId,
      certified: data.certified === true,
      adminId: data.adminId || "",
      createdAt: new Date(),
    };
    this.certificationAuditList.push(rec);
    const { rawAgentId: _omit, ...out } = rec;
    return out as CertificationAudit;
  }

  async listCertificationAudits(agentId: string): Promise<CertificationAudit[]> {
    return this.certificationAuditList
      .filter((r) => r.rawAgentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(({ rawAgentId: _omit, ...out }) => out as CertificationAudit);
  }

  async applyPendingInvitesForUser(userId: string, email: string): Promise<AppliedInviteGrant[]> {
    const normalized = (email || "").trim().toLowerCase();
    if (!userId || !normalized) return [];
    const matches = Array.from(this.pendingInvitesMap.values()).filter(
      (p) => p.email === normalized,
    );
    const grants: AppliedInviteGrant[] = [];
    for (const inv of matches) {
      const role = inv.role === "editor" || inv.role === "viewer" ? inv.role : "viewer";
      await this.addOrUpdateCollaborator({
        agentId: inv.rawAgentId,
        userId,
        role,
        invitedBy: inv.invitedBy,
      });
      this.pendingInvitesMap.delete(this.pendingInviteKey(inv.rawAgentId, inv.email));
      const agent = this.agents.get(inv.rawAgentId);
      grants.push({
        agentId: inv.rawAgentId,
        agentName: agent?.name || "agen bersama",
        role,
      });
    }
    return grants;
  }

  // Pending Premium Privat deliveries — MemStorage stubs (DB-backed in prod).
  async addPendingPremiumDelivery(_data: { masterAgentId: number; email: string; source?: string }): Promise<void> {
    return;
  }

  async getCloneForOwner(_masterAgentId: number, _ownerUserId: string): Promise<Agent | undefined> {
    return undefined;
  }

  async applyPendingPremiumDeliveriesForUser(_userId: string, _email: string): Promise<Agent[]> {
    return [];
  }

  // Notification methods
  async createNotification(data: InsertNotification): Promise<Notification> {
    const rec: Notification = {
      id: ++this.notificationIdSeq,
      userId: data.userId,
      type: data.type ?? NOTIFICATION_TYPES.AGENT_SHARED,
      title: data.title,
      message: data.message ?? "",
      link: data.link ?? null,
      agentId: data.agentId ?? null,
      read: false,
      createdAt: new Date(),
    };
    this.notificationsMap.set(rec.id, rec);
    return rec;
  }

  async listNotificationsForUser(userId: string, limit = 30): Promise<Notification[]> {
    if (!userId) return [];
    return Array.from(this.notificationsMap.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) return 0;
    return Array.from(this.notificationsMap.values())
      .filter((n) => n.userId === userId && !n.read).length;
  }

  async markNotificationRead(id: number, userId: string): Promise<boolean> {
    const rec = this.notificationsMap.get(id);
    if (!rec || rec.userId !== userId) return false;
    rec.read = true;
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    let count = 0;
    for (const rec of this.notificationsMap.values()) {
      if (rec.userId === userId && !rec.read) {
        rec.read = true;
        count++;
      }
    }
    return count;
  }

  // Knowledge Base methods
  async getKnowledgeBases(agentId: string): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBases.values())
      .filter((kb) => kb.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createKnowledgeBase(insertKb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = randomUUID();
    const kb: KnowledgeBase = {
      id,
      agentId: insertKb.agentId,
      name: insertKb.name,
      type: insertKb.type,
      content: insertKb.content,
      description: insertKb.description || "",
      fileType: insertKb.fileType,
      fileName: insertKb.fileName || "",
      fileSize: insertKb.fileSize || 0,
      fileUrl: insertKb.fileUrl || "",
      processingStatus: insertKb.processingStatus || "completed",
      extractedText: insertKb.extractedText || "",
      createdAt: new Date().toISOString(),
      // Field hierarki + versioning + atribusi sumber.
      knowledgeLayer: (insertKb as Partial<KnowledgeBase>).knowledgeLayer ?? "operational",
      taxonomyId: insertKb.taxonomyId ?? null,
      sourceUrl: insertKb.sourceUrl ?? null,
      sourceAuthority: insertKb.sourceAuthority ?? null,
      effectiveDate: insertKb.effectiveDate
        ? (insertKb.effectiveDate instanceof Date ? insertKb.effectiveDate.toISOString() : String(insertKb.effectiveDate))
        : null,
      supersededById: insertKb.supersededById ?? null,
      status: insertKb.status || "active",
      isShared: insertKb.isShared ?? false,
      sharedScope: insertKb.sharedScope ?? null,
    };
    this.knowledgeBases.set(id, kb);
    return kb;
  }

  async updateKnowledgeBase(id: string, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | undefined> {
    const kb = this.knowledgeBases.get(id);
    if (!kb) return undefined;

    const updated: KnowledgeBase = {
      ...kb,
      name: data.name !== undefined ? data.name : kb.name,
      content: data.content !== undefined ? data.content : kb.content,
      description: data.description !== undefined ? data.description : kb.description,
      processingStatus: data.processingStatus !== undefined ? data.processingStatus : kb.processingStatus,
      extractedText: data.extractedText !== undefined ? data.extractedText : kb.extractedText,
    };
    this.knowledgeBases.set(id, updated);
    return updated;
  }

  async deleteKnowledgeBase(id: string): Promise<boolean> {
    return this.knowledgeBases.delete(id);
  }

  // ===== Knowledge Taxonomy (in-memory stub: fitur ini hanya jalan di DB-storage) =====
  private taxonomyStore: Map<number, KnowledgeTaxonomyNode> = new Map();
  private taxonomyIdCounter = 1;

  async getTaxonomyTree(): Promise<KnowledgeTaxonomyTreeNode[]> {
    const all: KnowledgeTaxonomyTreeNode[] = Array.from(this.taxonomyStore.values()).map(n => ({ ...n, children: [] }));
    const byId = new Map<number, KnowledgeTaxonomyTreeNode>();
    all.forEach(n => byId.set(n.id, n));
    const roots: KnowledgeTaxonomyTreeNode[] = [];
    for (const node of all) {
      if (node.parentId == null) roots.push(node);
      else (byId.get(node.parentId)?.children ?? roots).push(node);
    }
    return roots;
  }

  async getTaxonomyNode(id: number): Promise<KnowledgeTaxonomyNode | undefined> {
    return this.taxonomyStore.get(id);
  }

  async createTaxonomyNode(node: InsertKnowledgeTaxonomy): Promise<KnowledgeTaxonomyNode> {
    const id = this.taxonomyIdCounter++;
    const created: KnowledgeTaxonomyNode = {
      id,
      parentId: node.parentId ?? null,
      name: node.name,
      slug: node.slug,
      level: node.level || "sektor",
      description: node.description ?? "",
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    this.taxonomyStore.set(id, created);
    return created;
  }

  async updateTaxonomyNode(id: number, data: Partial<InsertKnowledgeTaxonomy>): Promise<KnowledgeTaxonomyNode | undefined> {
    const existing = this.taxonomyStore.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data } as KnowledgeTaxonomyNode;
    this.taxonomyStore.set(id, updated);
    return updated;
  }

  async deleteTaxonomyNode(id: number): Promise<boolean> {
    return this.taxonomyStore.delete(id);
  }

  // ===== Knowledge Base Versioning (in-memory stub) =====
  async getKBVersionHistory(kbId: string): Promise<KnowledgeBase[]> {
    const kb = this.knowledgeBases.get(kbId);
    return kb ? [kb] : [];
  }

  async supersedeKnowledgeBase(oldKbId: string, _newKbId: string): Promise<KnowledgeBase | undefined> {
    const kb = this.knowledgeBases.get(oldKbId);
    if (!kb) return undefined;
    const updated: KnowledgeBase = { ...kb, status: "superseded" };
    this.knowledgeBases.set(oldKbId, updated);
    return updated;
  }

  async getKnowledgeBasesByTaxonomy(taxonomyId: number, _includeSuperseded?: boolean): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBases.values()).filter(kb => kb.taxonomyId === taxonomyId);
  }

  // Tender Document Catalog stubs (DB-only feature)
  async getTenderDocumentCatalog(): Promise<any[]> { return []; }
  async getTenderDocumentByCode(): Promise<any> { return undefined; }
  async upsertTenderDocumentCatalog(doc: any): Promise<any> { return doc; }
  async deleteTenderDocumentCatalog(): Promise<boolean> { return false; }

  // Knowledge Chunks methods (RAG)
  private knowledgeChunksStore: Map<number, KnowledgeChunk> = new Map();
  private chunkIdCounter = 1;

  async getChunksByKnowledgeBase(knowledgeBaseId: string): Promise<KnowledgeChunk[]> {
    return Array.from(this.knowledgeChunksStore.values())
      .filter(c => c.knowledgeBaseId === parseInt(knowledgeBaseId))
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async getChunksByAgent(agentId: string): Promise<KnowledgeChunk[]> {
    return Array.from(this.knowledgeChunksStore.values())
      .filter(c => c.agentId === parseInt(agentId))
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async createChunks(chunks: InsertKnowledgeChunk[]): Promise<KnowledgeChunk[]> {
    const created: KnowledgeChunk[] = [];
    for (const chunk of chunks) {
      const id = this.chunkIdCounter++;
      const kc: KnowledgeChunk = {
        ...chunk,
        id,
        createdAt: new Date().toISOString(),
      };
      this.knowledgeChunksStore.set(id, kc);
      created.push(kc);
    }
    return created;
  }

  async deleteChunksByKnowledgeBase(knowledgeBaseId: string): Promise<boolean> {
    const kbId = parseInt(knowledgeBaseId);
    for (const [id, chunk] of Array.from(this.knowledgeChunksStore)) {
      if (chunk.knowledgeBaseId === kbId) this.knowledgeChunksStore.delete(id);
    }
    return true;
  }

  async deleteChunksByAgent(agentId: string): Promise<boolean> {
    const aId = parseInt(agentId);
    for (const [id, chunk] of Array.from(this.knowledgeChunksStore)) {
      if (chunk.agentId === aId) this.knowledgeChunksStore.delete(id);
    }
    return true;
  }

  // Integration methods
  async getIntegrations(agentId: string): Promise<Integration[]> {
    return Array.from(this.integrations.values())
      .filter((int) => int.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createIntegration(insertInt: InsertIntegration): Promise<Integration> {
    const id = randomUUID();
    const integration: Integration = {
      id,
      agentId: insertInt.agentId,
      type: insertInt.type,
      name: insertInt.name,
      config: insertInt.config || {},
      isEnabled: insertInt.isEnabled ?? false,
      createdAt: new Date().toISOString(),
    };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;

    const updated: Integration = {
      ...integration,
      name: data.name !== undefined ? data.name : integration.name,
      config: data.config !== undefined ? data.config : integration.config,
      isEnabled: data.isEnabled !== undefined ? data.isEnabled : integration.isEnabled,
    };
    this.integrations.set(id, updated);
    return updated;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    return this.integrations.delete(id);
  }

  // Message methods
  async getMessages(agentId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.agentId === agentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getMessagesBySession(agentId: string, sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.agentId === agentId && msg.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMsg: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      agentId: insertMsg.agentId,
      role: insertMsg.role,
      content: insertMsg.content,
      reasoning: insertMsg.reasoning || "",
      sources: insertMsg.sources || [],
      confidence: insertMsg.confidence,
      createdAt: new Date().toISOString(),
    };
    this.messages.set(id, message);

    // If user message, simulate bot response
    if (insertMsg.role === "user") {
      const agent = await this.getAgent(insertMsg.agentId);
      const botId = randomUUID();
      const botMessage: Message = {
        id: botId,
        agentId: insertMsg.agentId,
        role: "assistant",
        content: this.generateBotResponse(insertMsg.content, agent),
        reasoning: agent?.agenticMode ? "Analyzed user query and formulated response based on context and knowledge." : "",
        sources: [],
        createdAt: new Date().toISOString(),
      };
      this.messages.set(botId, botMessage);
    }

    return message;
  }

  private generateBotResponse(userMessage: string, agent?: Agent): string {
    const greetings = ["hello", "hi", "hey", "greetings", "halo", "hai"];
    const lowerMessage = userMessage.toLowerCase();

    if (greetings.some((g) => lowerMessage.includes(g))) {
      return `Hello! I'm ${agent?.name || "your assistant"}. ${agent?.tagline || "How can I help you today?"}`;
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("bantu")) {
      return `I'd be happy to help! ${agent?.description || "I'm here to assist you with any questions you may have."}`;
    }

    if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you") || lowerMessage.includes("siapa kamu")) {
      return `I'm ${agent?.name || "an AI assistant"}. ${agent?.philosophy || "I'm designed to be helpful, harmless, and honest."}`;
    }

    const responses = [
      "That's an interesting point. Could you tell me more about what you're looking for?",
      "I understand. Let me help you with that.",
      "Great question! Based on my knowledge, I can provide some insights on this topic.",
      "Thank you for sharing that. Is there anything specific you'd like to know?",
      "I'm here to assist you. What would you like to explore further?",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  async clearMessages(agentId: string): Promise<boolean> {
    Array.from(this.messages.entries()).forEach(([msgId, msg]) => {
      if (msg.agentId === agentId) {
        this.messages.delete(msgId);
      }
    });
    return true;
  }

  // Analytics methods
  async getAnalytics(agentId: string): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter((a) => a.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const analytics: Analytics = {
      id,
      agentId: insertAnalytics.agentId,
      eventType: insertAnalytics.eventType,
      metadata: insertAnalytics.metadata || {},
      createdAt: new Date().toISOString(),
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async getAnalyticsSummary(agentId: string): Promise<{
    totalMessages: number;
    totalSessions: number;
    totalIntegrationCalls: number;
    messagesLast7Days: number[];
    topHours: { hour: number; count: number }[];
  }> {
    const agentAnalytics = Array.from(this.analytics.values()).filter(
      (a) => a.agentId === agentId
    );
    const agentMessages = Array.from(this.messages.values()).filter(
      (m) => m.agentId === agentId
    );

    const totalMessages = agentMessages.length;
    const sessionEvents = agentAnalytics.filter((a) => a.eventType === "session").length;
    const totalSessions = sessionEvents > 0 ? sessionEvents : (agentMessages.length > 0 ? 1 : 0);
    const totalIntegrationCalls = agentAnalytics.filter((a) => a.eventType === "integration_call").length;

    const now = new Date();
    const messagesLast7Days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = agentMessages.filter((m) => {
        const msgDate = new Date(m.createdAt);
        return msgDate >= dayStart && msgDate <= dayEnd;
      }).length;
      messagesLast7Days.push(count);
    }

    const hourCounts: Record<number, number> = {};
    agentMessages.forEach((m) => {
      const hour = new Date(m.createdAt).getHours();
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
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const subscription: Subscription = {
      id,
      userId: insertSubscription.userId,
      plan: insertSubscription.plan,
      status: insertSubscription.status || "pending",
      mayarOrderId: insertSubscription.mayarOrderId,
      mayarPaymentUrl: insertSubscription.mayarPaymentUrl,
      amount: insertSubscription.amount,
      currency: insertSubscription.currency || "IDR",
      chatbotLimit: insertSubscription.chatbotLimit || 1,
      startDate: insertSubscription.startDate,
      endDate: insertSubscription.endDate,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getSubscriptionByMayarOrderId(mayarOrderId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.mayarOrderId === mayarOrderId
    );
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const now = new Date();
    return Array.from(this.subscriptions.values()).find((sub) => {
      if (sub.userId !== userId || sub.status !== "active") return false;
      if (sub.endDate) {
        return new Date(sub.endDate) > now;
      }
      return true;
    });
  }

  async getLatestPendingSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .filter((sub) => sub.userId === userId && sub.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updated: Subscription = {
      ...subscription,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async provisionPartnerSeatSubscription(userId: string, partnerId: number): Promise<void> {
    if (!userId || !partnerId) return;
    const existing = Array.from(this.subscriptions.values())
      .find((s) => s.userId === userId && s.partnerId === partnerId && s.status === "active");
    if (existing) return;
    const id = randomUUID();
    const now = new Date().toISOString();
    const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5).toISOString();
    this.subscriptions.set(id, {
      id, userId, plan: "starter" as any, status: "active", amount: 0, currency: "IDR",
      chatbotLimit: 3, trialMessagesUsed: 0, partnerId, startDate: now, endDate: farFuture,
      createdAt: now, updatedAt: now,
    });
  }

  async deactivatePartnerSeatSubscription(userId: string, partnerId: number): Promise<void> {
    if (!userId || !partnerId) return;
    for (const [id, s] of this.subscriptions.entries()) {
      if (s.userId === userId && s.partnerId === partnerId && s.status === "active") {
        this.subscriptions.set(id, { ...s, status: "cancelled", updatedAt: new Date().toISOString() });
      }
    }
  }

  async countPartnerSeatSubscriptions(partnerId: number): Promise<number> {
    if (!partnerId) return 0;
    return Array.from(this.subscriptions.values())
      .filter((s) => s.partnerId === partnerId && s.status === "active").length;
  }

  async claimPartnerSeat(params: { partnerId: number; agentId: string; seatCapacity: number; email: string; role: CollaboratorRole; invitedBy: string }): Promise<{ status: "granted" | "pending"; reason?: "seat_capacity_full"; seatsUsed?: number }> {
    const email = (params.email || "").trim().toLowerCase();
    const capacity = params.seatCapacity ?? 0;
    const existingUser = await this.getUserByEmail(email);
    const collaborators = await this.listCollaboratorsForAgent(params.agentId);
    const pending = await this.listPendingInvitesForAgent(params.agentId);
    const alreadySeated = existingUser
      ? collaborators.some((c) => c.userId === existingUser.id)
      : pending.some((p) => p.email === email);
    if (capacity > 0 && !alreadySeated && collaborators.length + pending.length >= capacity) {
      return { status: "granted", reason: "seat_capacity_full", seatsUsed: collaborators.length + pending.length };
    }
    if (existingUser) {
      await this.addOrUpdateCollaborator({ agentId: params.agentId, userId: existingUser.id, role: params.role, invitedBy: params.invitedBy });
      if (capacity > 0) await this.provisionPartnerSeatSubscription(existingUser.id, params.partnerId);
      return { status: "granted" };
    }
    await this.addOrUpdatePendingInvite({ agentId: params.agentId, email, role: params.role, invitedBy: params.invitedBy });
    return { status: "pending" };
  }

  async revokePartnerSeat(params: { partnerId: number; agentId: string; userId?: string; email?: string }): Promise<void> {
    if (params.userId) {
      await this.deactivatePartnerSeatSubscription(params.userId, params.partnerId);
      await this.removeCollaborator(params.agentId, params.userId);
    } else if (params.email) {
      await this.removePendingInvite(params.agentId, params.email.trim().toLowerCase());
    }
  }

  async expireSubscriptions(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;
    
    this.subscriptions.forEach((subscription, id) => {
      if (subscription.status === "active" && subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        if (endDate < now) {
          this.subscriptions.set(id, {
            ...subscription,
            status: "expired",
            updatedAt: new Date().toISOString(),
          });
          expiredCount++;
        }
      }
    });
    
    return expiredCount;
  }

  async countUserAgents(userId: string): Promise<number> {
    let count = 0;
    this.agents.forEach((agent) => {
      if ((agent as any).userId === userId) {
        count++;
      }
    });
    return count;
  }

  async incrementTrialMessages(_subscriptionId: string): Promise<number> { return 0; }
  private ownerMonthlyUsage = new Map<string, number>();
  async getOwnerMonthlyUsage(ownerUserId: string, month: string): Promise<number> {
    return this.ownerMonthlyUsage.get(`${ownerUserId}:${month}`) ?? 0;
  }
  async incrementOwnerMonthlyUsage(ownerUserId: string, month: string): Promise<number> {
    const key = `${ownerUserId}:${month}`;
    const next = (this.ownerMonthlyUsage.get(key) ?? 0) + 1;
    this.ownerMonthlyUsage.set(key, next);
    return next;
  }
  async deleteOwnerMonthlyUsageBefore(month: string): Promise<number> {
    let deleted = 0;
    for (const key of Array.from(this.ownerMonthlyUsage.keys())) {
      const rowMonth = key.slice(key.lastIndexOf(":") + 1);
      if (rowMonth < month) {
        this.ownerMonthlyUsage.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
  async getUserDialogCompleted(_userId: string): Promise<boolean> { return false; }
  async setUserDialogCompleted(_userId: string): Promise<void> {}
  private userClawPackages = new Map<string, string[]>();
  async getUserClawPackages(userId: string): Promise<string[]> {
    return this.userClawPackages.get(userId) ?? [];
  }
  async updateUserClawPackages(userId: string, packages: string[]): Promise<void> {
    this.userClawPackages.set(userId, packages);
  }
  async claimUserClawPackages(userId: string, packages: string[]): Promise<boolean> {
    if ((this.userClawPackages.get(userId) ?? []).length > 0) return false;
    this.userClawPackages.set(userId, packages);
    return true;
  }

  // Project Brain Template methods
  async getProjectBrainTemplates(agentId: string): Promise<ProjectBrainTemplate[]> {
    return Array.from(this.projectBrainTemplates.values())
      .filter((t) => t.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProjectBrainTemplate(id: string): Promise<ProjectBrainTemplate | undefined> {
    return this.projectBrainTemplates.get(id);
  }

  async createProjectBrainTemplate(insertTemplate: InsertProjectBrainTemplate): Promise<ProjectBrainTemplate> {
    const id = randomUUID();
    const template: ProjectBrainTemplate = {
      id,
      agentId: insertTemplate.agentId,
      name: insertTemplate.name,
      description: insertTemplate.description || "",
      fields: insertTemplate.fields || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.projectBrainTemplates.set(id, template);
    return template;
  }

  async updateProjectBrainTemplate(id: string, data: Partial<InsertProjectBrainTemplate>): Promise<ProjectBrainTemplate | undefined> {
    const template = this.projectBrainTemplates.get(id);
    if (!template) return undefined;

    const updated: ProjectBrainTemplate = {
      ...template,
      name: data.name !== undefined ? data.name : template.name,
      description: data.description !== undefined ? data.description : template.description,
      fields: data.fields !== undefined ? data.fields : template.fields,
    };
    this.projectBrainTemplates.set(id, updated);
    return updated;
  }

  async deleteProjectBrainTemplate(id: string): Promise<boolean> {
    return this.projectBrainTemplates.delete(id);
  }

  // Project Brain Instance methods
  async getProjectBrainInstances(agentId: string): Promise<ProjectBrainInstance[]> {
    return Array.from(this.projectBrainInstances.values())
      .filter((i) => i.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProjectBrainInstance(id: string): Promise<ProjectBrainInstance | undefined> {
    return this.projectBrainInstances.get(id);
  }

  async getActiveProjectBrainInstance(agentId: string): Promise<ProjectBrainInstance | null> {
    const instance = Array.from(this.projectBrainInstances.values()).find(
      (i) => i.agentId === agentId && i.isActive
    );
    return instance || null;
  }

  async createProjectBrainInstance(insertInstance: InsertProjectBrainInstance): Promise<ProjectBrainInstance> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const instance: ProjectBrainInstance = {
      id,
      agentId: insertInstance.agentId,
      templateId: insertInstance.templateId,
      name: insertInstance.name,
      values: insertInstance.values || {},
      status: insertInstance.status || "active",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.projectBrainInstances.set(id, instance);
    return instance;
  }

  async updateProjectBrainInstance(id: string, data: Partial<InsertProjectBrainInstance>): Promise<ProjectBrainInstance | undefined> {
    const instance = this.projectBrainInstances.get(id);
    if (!instance) return undefined;

    const updated: ProjectBrainInstance = {
      ...instance,
      name: data.name !== undefined ? data.name : instance.name,
      values: data.values !== undefined ? data.values : instance.values,
      status: data.status !== undefined ? data.status : instance.status,
      updatedAt: new Date().toISOString(),
    };
    this.projectBrainInstances.set(id, updated);
    return updated;
  }

  async setActiveProjectBrainInstance(id: string): Promise<ProjectBrainInstance | undefined> {
    const instance = this.projectBrainInstances.get(id);
    if (!instance) return undefined;

    Array.from(this.projectBrainInstances.entries()).forEach(([instId, inst]) => {
      if (inst.agentId === instance.agentId) {
        this.projectBrainInstances.set(instId, { ...inst, isActive: false });
      }
    });

    const updated: ProjectBrainInstance = { ...instance, isActive: true, updatedAt: new Date().toISOString() };
    this.projectBrainInstances.set(id, updated);
    return updated;
  }

  async deleteProjectBrainInstance(id: string): Promise<boolean> {
    return this.projectBrainInstances.delete(id);
  }

  // Mini App methods
  async getMiniApps(agentId: string): Promise<MiniApp[]> {
    return Array.from(this.miniApps.values())
      .filter((app) => app.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMiniApp(id: string): Promise<MiniApp | undefined> {
    return this.miniApps.get(id);
  }

  async getMiniAppBySlug(slug: string): Promise<MiniApp | undefined> {
    return Array.from(this.miniApps.values()).find(app => app.publicSlug === slug);
  }

  async createMiniApp(insertMiniApp: InsertMiniApp): Promise<MiniApp> {
    const id = randomUUID();
    const slug = insertMiniApp.publicSlug || insertMiniApp.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 40) + "-" + id.substring(0, 8);
    const miniApp: MiniApp = {
      id,
      agentId: insertMiniApp.agentId,
      name: insertMiniApp.name,
      description: insertMiniApp.description || "",
      type: insertMiniApp.type,
      config: insertMiniApp.config || {},
      icon: insertMiniApp.icon || "app",
      isActive: true,
      publicSlug: slug,
      createdAt: new Date().toISOString(),
    };
    this.miniApps.set(id, miniApp);
    return miniApp;
  }

  async updateMiniApp(id: string, data: Partial<InsertMiniApp>): Promise<MiniApp | undefined> {
    const miniApp = this.miniApps.get(id);
    if (!miniApp) return undefined;

    const resolvedSlug = data.publicSlug !== undefined
      ? data.publicSlug
      : miniApp.publicSlug || (
          miniApp.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").substring(0, 40)
          + "-" + id.substring(0, 8)
        );
    const updated: MiniApp = {
      ...miniApp,
      name: data.name !== undefined ? data.name : miniApp.name,
      description: data.description !== undefined ? data.description : miniApp.description,
      type: data.type !== undefined ? data.type : miniApp.type,
      config: data.config !== undefined ? data.config : miniApp.config,
      icon: data.icon !== undefined ? data.icon : miniApp.icon,
      publicSlug: resolvedSlug,
    };
    this.miniApps.set(id, updated);
    return updated;
  }

  async deleteMiniApp(id: string): Promise<boolean> {
    return this.miniApps.delete(id);
  }

  // Mini App Result methods
  async getMiniAppResults(miniAppId: string): Promise<MiniAppResult[]> {
    return Array.from(this.miniAppResults.values())
      .filter((r) => r.miniAppId === miniAppId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createMiniAppResult(insertResult: InsertMiniAppResult): Promise<MiniAppResult> {
    const id = randomUUID();
    const result: MiniAppResult = {
      id,
      miniAppId: insertResult.miniAppId,
      agentId: insertResult.agentId,
      projectInstanceId: insertResult.projectInstanceId,
      input: insertResult.input || {},
      output: insertResult.output || {},
      status: insertResult.status || "completed",
      source: insertResult.source || "owner",
      createdAt: new Date().toISOString(),
    };
    this.miniAppResults.set(id, result);
    return result;
  }

  // Client Subscription methods
  async getClientSubscriptions(agentId: string): Promise<ClientSubscription[]> {
    return Array.from(this.clientSubscriptions.values())
      .filter((sub) => sub.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getClientSubscription(id: string): Promise<ClientSubscription | undefined> {
    return this.clientSubscriptions.get(id);
  }

  async getClientSubscriptionByToken(token: string): Promise<ClientSubscription | undefined> {
    return Array.from(this.clientSubscriptions.values()).find(
      (sub) => sub.accessToken === token
    );
  }

  async getClientSubscriptionByEmail(agentId: string, email: string): Promise<ClientSubscription | undefined> {
    return Array.from(this.clientSubscriptions.values()).find(
      (sub) => sub.agentId === agentId && sub.customerEmail === email
    );
  }

  async getClientSubscriptionByBigIdea(bigIdeaId: string, email: string): Promise<ClientSubscription | undefined> {
    return undefined;
  }

  async createClientSubscription(insertSub: InsertClientSubscription): Promise<ClientSubscription> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const sub: ClientSubscription = {
      ...insertSub,
      id,
      messageUsedToday: 0,
      messageUsedMonth: 0,
      lastMessageDate: null,
      lastMonthReset: null,
      createdAt: now,
      updatedAt: now,
    };
    this.clientSubscriptions.set(id, sub);
    return sub;
  }

  async updateClientSubscription(id: string, data: Partial<InsertClientSubscription & { messageUsedToday: number; messageUsedMonth: number; lastMessageDate: string; lastMonthReset: string }>): Promise<ClientSubscription | undefined> {
    const sub = this.clientSubscriptions.get(id);
    if (!sub) return undefined;

    const updated: ClientSubscription = {
      ...sub,
      ...data,
      id: sub.id,
      createdAt: sub.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.clientSubscriptions.set(id, updated);
    return updated;
  }

  async deleteClientSubscription(id: string): Promise<boolean> {
    return this.clientSubscriptions.delete(id);
  }

  async incrementClientMessageUsage(id: string): Promise<ClientSubscription | undefined> {
    const sub = this.clientSubscriptions.get(id);
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

    const updated: ClientSubscription = {
      ...sub,
      messageUsedToday,
      messageUsedMonth,
      lastMessageDate: today,
      lastMonthReset: today,
      updatedAt: new Date().toISOString(),
    };
    this.clientSubscriptions.set(id, updated);
    return updated;
  }

  async getClientSubscriptionStats(agentId: string): Promise<{ totalClients: number; activeClients: number; totalRevenue: number }> {
    const subs = Array.from(this.clientSubscriptions.values()).filter(
      (sub) => sub.agentId === agentId
    );
    const totalClients = subs.length;
    const activeClients = subs.filter((sub) => sub.status === "active").length;
    const totalRevenue = subs.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    return { totalClients, activeClients, totalRevenue };
  }

  // Affiliate methods
  async getAffiliates(): Promise<Affiliate[]> {
    return Array.from(this.affiliatesMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    return this.affiliatesMap.get(id);
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    return Array.from(this.affiliatesMap.values()).find(
      (aff) => aff.code === code
    );
  }

  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const id = randomUUID();
    const affiliate: Affiliate = {
      ...insertAffiliate,
      id,
      totalEarnings: 0,
      totalReferrals: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.affiliatesMap.set(id, affiliate);
    return affiliate;
  }

  async updateAffiliate(id: string, data: Partial<InsertAffiliate>): Promise<Affiliate | undefined> {
    const affiliate = this.affiliatesMap.get(id);
    if (!affiliate) return undefined;

    const updated: Affiliate = {
      ...affiliate,
      ...data,
      id: affiliate.id,
      totalEarnings: affiliate.totalEarnings,
      totalReferrals: affiliate.totalReferrals,
      isActive: affiliate.isActive,
      createdAt: affiliate.createdAt,
    };
    this.affiliatesMap.set(id, updated);
    return updated;
  }

  async deleteAffiliate(id: string): Promise<boolean> {
    return this.affiliatesMap.delete(id);
  }

  async incrementAffiliateReferral(code: string, amount: number): Promise<Affiliate | undefined> {
    const affiliate = await this.getAffiliateByCode(code);
    if (!affiliate) return undefined;

    const commission = amount * (affiliate.commissionRate / 100);
    const updated: Affiliate = {
      ...affiliate,
      totalReferrals: affiliate.totalReferrals + 1,
      totalEarnings: affiliate.totalEarnings + commission,
    };
    this.affiliatesMap.set(affiliate.id, updated);
    return updated;
  }

  // Voucher methods
  async getVouchers(agentId?: string): Promise<Voucher[]> {
    let result = Array.from(this.vouchersMap.values());
    if (agentId) result = result.filter((v) => v.agentId === parseInt(agentId));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getVoucher(id: string): Promise<Voucher | undefined> {
    return this.vouchersMap.get(id);
  }

  async getVoucherByCode(code: string): Promise<Voucher | undefined> {
    return Array.from(this.vouchersMap.values()).find((v) => v.code === code.toUpperCase());
  }

  async createVoucher(voucher: InsertVoucher): Promise<Voucher> {
    const id = String(this.vouchersMap.size + 1);
    const v: Voucher = {
      id: parseInt(id),
      agentId: voucher.agentId || null,
      code: voucher.code.toUpperCase(),
      name: voucher.name,
      type: voucher.type || "unlimited",
      extraMessages: voucher.extraMessages || 0,
      durationDays: voucher.durationDays || 30,
      maxRedemptions: voucher.maxRedemptions || 0,
      totalRedeemed: 0,
      isActive: voucher.isActive ?? true,
      expiresAt: voucher.expiresAt || null,
      createdAt: new Date().toISOString(),
    };
    this.vouchersMap.set(id, v);
    return v;
  }

  async updateVoucher(id: string, data: Partial<InsertVoucher>): Promise<Voucher | undefined> {
    const existing = this.vouchersMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data } as Voucher;
    if (data.code) updated.code = data.code.toUpperCase();
    this.vouchersMap.set(id, updated);
    return updated;
  }

  async deleteVoucher(id: string): Promise<boolean> {
    return this.vouchersMap.delete(id);
  }

  async redeemVoucher(voucherId: number, clientSubscriptionId: number): Promise<VoucherRedemption> {
    const voucher = this.vouchersMap.get(String(voucherId));
    if (voucher) {
      voucher.totalRedeemed += 1;
      this.vouchersMap.set(String(voucherId), voucher);
    }
    const id = String(this.voucherRedemptionsMap.size + 1);
    const redemption: VoucherRedemption = {
      id: parseInt(id),
      voucherId,
      clientSubscriptionId,
      redeemedAt: new Date().toISOString(),
    };
    this.voucherRedemptionsMap.set(id, redemption);
    return redemption;
  }

  async getVoucherRedemptions(voucherId: string): Promise<VoucherRedemption[]> {
    return Array.from(this.voucherRedemptionsMap.values())
      .filter((r) => r.voucherId === parseInt(voucherId));
  }

  async getClientVoucherRedemptions(clientSubscriptionId: number): Promise<(VoucherRedemption & { voucher?: Voucher })[]> {
    const redemptions = Array.from(this.voucherRedemptionsMap.values())
      .filter((r) => r.clientSubscriptionId === clientSubscriptionId);
    return redemptions.map((r) => ({
      ...r,
      voucher: this.vouchersMap.get(String(r.voucherId)),
    }));
  }

  // User Memory methods
  async getUserMemories(agentId: string, sessionId?: string): Promise<UserMemory[]> {
    const all = Array.from(this.userMemoriesMap.values()).filter(m => m.agentId === Number(agentId));
    if (sessionId) return all.filter(m => m.sessionId === sessionId);
    return all;
  }

  async createUserMemory(memory: InsertUserMemory): Promise<UserMemory> {
    const id = this.userMemoriesMap.size + 1;
    const item: UserMemory = { ...memory, id, category: memory.category || "memory", sessionId: memory.sessionId || "", createdAt: new Date() };
    this.userMemoriesMap.set(String(id), item);
    return item;
  }

  async deleteUserMemory(id: string): Promise<boolean> {
    return this.userMemoriesMap.delete(id);
  }

  async deleteUserMemoriesByAgent(agentId: string, sessionId?: string): Promise<boolean> {
    const toDelete = Array.from(this.userMemoriesMap.entries()).filter(([, m]) => {
      if (m.agentId !== Number(agentId)) return false;
      if (sessionId && m.sessionId !== sessionId) return false;
      return true;
    });
    for (const [key] of toDelete) this.userMemoriesMap.delete(key);
    return true;
  }

  // Product listing methods
  async getListedAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter((agent) => agent.isListed === true);
  }

  async getWaContacts(_agentId: string): Promise<WaContact[]> { return []; }
  async getWaContact(_id: string): Promise<WaContact | undefined> { return undefined; }
  async upsertWaContact(contact: InsertWaContact): Promise<WaContact> { return { id: 1, ...contact, createdAt: new Date() } as any; }
  async updateWaContact(_id: string, _data: Partial<InsertWaContact>): Promise<WaContact | undefined> { return undefined; }
  async deleteWaContact(_id: string): Promise<boolean> { return false; }

  async getWaBroadcasts(_agentId?: string): Promise<WaBroadcast[]> { return []; }
  async getWaBroadcast(_id: string): Promise<WaBroadcast | undefined> { return undefined; }
  async getDueBroadcasts(): Promise<WaBroadcast[]> { return []; }
  async createWaBroadcast(broadcast: InsertWaBroadcast): Promise<WaBroadcast> { return { id: 1, ...broadcast, createdAt: new Date() } as any; }
  async updateWaBroadcast(_id: string, _data: Partial<InsertWaBroadcast>): Promise<WaBroadcast | undefined> { return undefined; }
  async deleteWaBroadcast(_id: string): Promise<boolean> { return false; }

  async createBroadcastRun(run: Partial<WaBroadcastRun>): Promise<WaBroadcastRun> { return { id: 1, ...run } as any; }
  async updateBroadcastRun(_id: string, _data: Partial<WaBroadcastRun>): Promise<WaBroadcastRun | undefined> { return undefined; }
  async getBroadcastRuns(_broadcastId: string): Promise<WaBroadcastRun[]> { return []; }

  async getTenderSources(): Promise<TenderSource[]> { return []; }
  async getTenderSource(_id: string): Promise<TenderSource | undefined> { return undefined; }
  async createTenderSource(source: InsertTenderSource): Promise<TenderSource> { return { id: 1, ...source, createdAt: new Date() } as any; }
  async updateTenderSource(_id: string, _data: Partial<InsertTenderSource>): Promise<TenderSource | undefined> { return undefined; }
  async deleteTenderSource(_id: string): Promise<boolean> { return false; }

  async getTenders(_sourceId?: string, _limit?: number): Promise<Tender[]> { return []; }
  async getTender(_id: string): Promise<Tender | undefined> { return undefined; }
  async upsertTender(tender: InsertTender): Promise<Tender> { return { id: 1, ...tender, createdAt: new Date(), updatedAt: new Date() } as any; }
  async getLatestTenders(_limit?: number): Promise<Tender[]> { return []; }
  async deleteTender(_id: string): Promise<boolean> { return false; }

  // Lead methods
  async getLeads(agentId: string): Promise<Lead[]> {
    return Array.from(this.leadsMap.values())
      .filter((l) => l.agentId === parseInt(agentId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leadsMap.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.leadsMap.size + 1;
    const created: Lead = {
      ...lead,
      id,
      convertedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.leadsMap.set(String(id), created);
    return created;
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leadsMap.get(id);
    if (!lead) return undefined;
    const updated: Lead = { ...lead, ...data, id: lead.id, createdAt: lead.createdAt, convertedAt: lead.convertedAt };
    this.leadsMap.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leadsMap.delete(id);
  }

  async getLeadsBySession(agentId: string, sessionId: string): Promise<Lead[]> {
    return Array.from(this.leadsMap.values())
      .filter((l) => l.agentId === parseInt(agentId) && l.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Scoring Result methods
  async getScoringResults(agentId: string): Promise<ScoringResult[]> {
    return Array.from(this.scoringResultsMap.values())
      .filter((r) => r.agentId === parseInt(agentId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getScoringResult(id: string): Promise<ScoringResult | undefined> {
    return this.scoringResultsMap.get(id);
  }

  async createScoringResult(result: InsertScoringResult): Promise<ScoringResult> {
    const id = this.scoringResultsMap.size + 1;
    const created: ScoringResult = {
      ...result,
      id,
      createdAt: new Date().toISOString(),
    };
    this.scoringResultsMap.set(String(id), created);
    return created;
  }

  async getScoringResultsBySession(agentId: string, sessionId: string): Promise<ScoringResult[]> {
    return Array.from(this.scoringResultsMap.values())
      .filter((r) => r.agentId === parseInt(agentId) && r.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Tender Alert Profile stubs (MemStorage)
  async getTenderAlertProfile(_userId: string): Promise<TenderAlertProfile | undefined> { return undefined; }
  async upsertTenderAlertProfile(data: InsertTenderAlertProfile): Promise<TenderAlertProfile> {
    return { id: 1, ...data, notifEnabled: data.notifEnabled ?? true, waPhone: data.waPhone ?? "", email: data.email ?? "", companyName: data.companyName ?? "", sectors: data.sectors ?? ["konstruksi"], kualifikasi: data.kualifikasi ?? [], wilayah: data.wilayah ?? [], keywords: data.keywords ?? [], minBudgetJuta: data.minBudgetJuta ?? null, maxBudgetJuta: data.maxBudgetJuta ?? null, lastNotifiedAt: null, createdAt: new Date(), updatedAt: new Date() } as TenderAlertProfile;
  }
  async getAllActiveTenderAlertProfiles(): Promise<TenderAlertProfile[]> { return []; }
  async getTendersMatchingProfile(_profile: TenderAlertProfile, _limit?: number): Promise<Tender[]> { return []; }
  async markAlertProfileNotified(_userId: string): Promise<void> {}

  // Company Profile stubs (MemStorage)
  async getCompanyProfiles(_userId: string): Promise<CompanyProfile[]> { return []; }
  async getCompanyProfile(_id: number): Promise<CompanyProfile | undefined> { return undefined; }
  async createCompanyProfile(data: InsertCompanyProfile): Promise<CompanyProfile> {
    return { id: 1, ...data, createdAt: new Date(), updatedAt: new Date() } as CompanyProfile;
  }
  async updateCompanyProfile(_id: number, _data: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> { return undefined; }
  async deleteCompanyProfile(_id: number): Promise<boolean> { return false; }

  // Tender Session stubs (MemStorage)
  async getTenderSessions(_userId: string): Promise<TenderSession[]> { return []; }
  async getTenderSession(_id: number): Promise<TenderSession | undefined> { return undefined; }
  async createTenderSession(data: InsertTenderSession): Promise<TenderSession> {
    return { id: 1, ...data, createdAt: new Date(), updatedAt: new Date() } as TenderSession;
  }
  async updateTenderSession(_id: number, _data: Partial<InsertTenderSession>): Promise<TenderSession | undefined> { return undefined; }
  async deleteTenderSession(_id: number): Promise<boolean> { return false; }

  // Chatbot Template stubs (MemStorage)
  async getChatbotTemplates(_category?: string): Promise<ChatbotTemplate[]> { return []; }
  async getChatbotTemplate(_id: number): Promise<ChatbotTemplate | undefined> { return undefined; }
  async createChatbotTemplate(data: InsertChatbotTemplate): Promise<ChatbotTemplate> {
    return { id: 1, ...data, usageCount: 0, createdAt: new Date() } as ChatbotTemplate;
  }
  async deleteChatbotTemplate(_id: number): Promise<boolean> { return false; }
  async incrementTemplateUsage(_id: number): Promise<void> {}

  // User Onboarding stubs (MemStorage)
  async getUserOnboarding(_userId: string): Promise<{ starterCreated: boolean } | undefined> { return undefined; }
  async markStarterCreated(_userId: string): Promise<void> {}

  // Store Product stubs (MemStorage)
  async getStoreProducts(): Promise<StoreProduct[]> { return []; }
  async getStoreProduct(_id: number): Promise<StoreProduct | undefined> { return undefined; }
  async createStoreProduct(data: InsertStoreProduct): Promise<StoreProduct> {
    return { id: 1, ...data, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0, createdAt: new Date() } as StoreProduct;
  }
  async updateStoreProduct(_id: number, _data: Partial<InsertStoreProduct>): Promise<StoreProduct | undefined> { return undefined; }
  async deleteStoreProduct(_id: number): Promise<boolean> { return false; }

  // Store Order stubs (MemStorage)
  async getStoreOrders(): Promise<StoreOrder[]> { return []; }
  async getStoreOrder(_id: number): Promise<StoreOrder | undefined> { return undefined; }
  async getStoreOrderByMidtransId(_orderId: string): Promise<StoreOrder | undefined> { return undefined; }
  async getStoreOrderByAccessToken(_token: string): Promise<StoreOrder | undefined> { return undefined; }
  // Research Report stubs (MemStorage)
  async getResearchReports(_userId: string, _agentSlug: string): Promise<ResearchReport[]> { return []; }
  async getResearchReport(_id: number): Promise<ResearchReport | undefined> { return undefined; }
  async createResearchReport(data: InsertResearchReport): Promise<ResearchReport> {
    return { id: 1, ...data, createdAt: new Date() } as ResearchReport;
  }
  async deleteResearchReport(_id: number): Promise<void> { return; }

  async createStoreOrder(data: InsertStoreOrder): Promise<StoreOrder> {
    return { id: 1, ...data, createdAt: new Date() } as StoreOrder;
  }
  async updateStoreOrderStatus(_id: number, _status: string): Promise<StoreOrder | undefined> { return undefined; }

  // Scalev Mapping stubs (MemStorage)
  async getScalevMappings(): Promise<ScalevMapping[]> { return []; }
  async getScalevMappingByProductName(_name: string): Promise<ScalevMapping | undefined> { return undefined; }
  async createScalevMapping(data: InsertScalevMapping): Promise<ScalevMapping> {
    return { id: 1, ...data, type: data.type ?? "chatbot", agentId: data.agentId ?? null, bigIdeaId: data.bigIdeaId ?? null, label: data.label ?? "", createdAt: new Date() } as ScalevMapping;
  }
  async updateScalevMapping(_id: number, _data: Partial<InsertScalevMapping>): Promise<ScalevMapping | undefined> { return undefined; }
  async deleteScalevMapping(_id: number): Promise<boolean> { return false; }

  // Agentic Deliverables stubs (MemStorage)
  async getAgenticDeliverables(_agentId: string): Promise<AgenticDeliverable[]> { return []; }
  async upsertAgenticDeliverable(data: InsertAgenticDeliverable): Promise<AgenticDeliverable> {
    return { id: 1, ...data, status: data.status ?? "open", createdAt: new Date(), updatedAt: new Date() } as AgenticDeliverable;
  }
  async updateAgenticDeliverableStatus(_id: string, _status: string): Promise<AgenticDeliverable | undefined> { return undefined; }
  async deleteAgenticDeliverable(_id: string): Promise<boolean> { return false; }

  // Workroom methods (MemStorage — stub; real impl in DatabaseStorage)
  async getWorkrooms(_userId: string): Promise<Workroom[]> { return []; }
  async getWorkroom(_id: number): Promise<Workroom | undefined> { return undefined; }
  async createWorkroom(data: InsertWorkroom): Promise<Workroom> {
    return { id: 1, ...data, createdAt: new Date(), updatedAt: new Date() } as Workroom;
  }
  async updateWorkroom(_id: number, _data: Partial<InsertWorkroom>): Promise<Workroom | undefined> { return undefined; }
  async deleteWorkroom(_id: number): Promise<boolean> { return false; }
  async getWorkroomGates(_workroomId: number): Promise<WorkroomGate[]> { return []; }
  async createWorkroomGate(data: InsertWorkroomGate): Promise<WorkroomGate> {
    return { id: 1, ...data, createdAt: new Date(), decidedAt: null } as WorkroomGate;
  }
  async decideWorkroomGate(_id: number, _status: string, _note: string): Promise<WorkroomGate | undefined> { return undefined; }
  async getWorkroomLogs(_workroomId: number): Promise<WorkroomLog[]> { return []; }
  async createWorkroomLog(data: InsertWorkroomLog): Promise<WorkroomLog> {
    return { id: 1, ...data, createdAt: new Date() } as WorkroomLog;
  }

  // Blueprint methods (MemStorage — in-memory)
  private blueprintsMem: Map<number, BlueprintRecord> = new Map();
  private blueprintSeq = 1;
  async getBlueprints(userId?: string): Promise<BlueprintRecord[]> {
    const all = Array.from(this.blueprintsMem.values());
    return userId ? all.filter((b) => b.userId === userId) : all;
  }
  async getBlueprint(id: number): Promise<BlueprintRecord | undefined> {
    return this.blueprintsMem.get(id);
  }
  async createBlueprint(data: InsertBlueprint): Promise<BlueprintRecord> {
    const now = new Date();
    const rec = {
      id: this.blueprintSeq++,
      userId: data.userId ?? "",
      name: data.name ?? "Blueprint Tanpa Judul",
      intent: data.intent ?? "",
      data: data.data,
      createdAt: now,
      updatedAt: now,
    } as BlueprintRecord;
    this.blueprintsMem.set(rec.id, rec);
    return rec;
  }
  async updateBlueprint(id: number, data: Partial<InsertBlueprint>): Promise<BlueprintRecord | undefined> {
    const existing = this.blueprintsMem.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() } as BlueprintRecord;
    this.blueprintsMem.set(id, updated);
    return updated;
  }
  async deleteBlueprint(id: number): Promise<boolean> {
    return this.blueprintsMem.delete(id);
  }
  async getBlueprintForUser(id: number, userId: string): Promise<BlueprintRecord | undefined> {
    const rec = this.blueprintsMem.get(id);
    return rec && rec.userId === userId ? rec : undefined;
  }
  async updateBlueprintForUser(id: number, userId: string, data: Partial<InsertBlueprint>): Promise<BlueprintRecord | undefined> {
    const existing = this.blueprintsMem.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() } as BlueprintRecord;
    this.blueprintsMem.set(id, updated);
    return updated;
  }
  async deleteBlueprintForUser(id: number, userId: string): Promise<boolean> {
    const existing = this.blueprintsMem.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.blueprintsMem.delete(id);
  }

  // Organization Draft methods (MemStorage — in-memory, owner-scoped)
  private orgDraftsMem: Map<number, OrganizationDraftRecord> = new Map();
  private orgDraftSeq = 1;

  async listOrganizationDraftsForUser(userId: string): Promise<OrganizationDraftRecord[]> {
    return Array.from(this.orgDraftsMem.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0));
  }

  async getOrganizationDraftForUser(id: number, userId: string): Promise<OrganizationDraftRecord | undefined> {
    const rec = this.orgDraftsMem.get(id);
    return rec && rec.userId === userId ? rec : undefined;
  }

  async createOrganizationDraft(data: InsertOrganizationDraft): Promise<OrganizationDraftRecord> {
    const now = new Date();
    const rec = {
      id: this.orgDraftSeq++,
      userId: data.userId ?? "",
      name: data.name ?? "Tim Tanpa Judul",
      mission: data.mission ?? "",
      data: data.data,
      createdAt: now,
      updatedAt: now,
    } as OrganizationDraftRecord;
    this.orgDraftsMem.set(rec.id, rec);
    return rec;
  }

  async updateOrganizationDraftForUser(id: number, userId: string, data: Partial<InsertOrganizationDraft>): Promise<OrganizationDraftRecord | undefined> {
    const existing = this.orgDraftsMem.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated = { ...existing, ...data, userId, updatedAt: new Date() } as OrganizationDraftRecord;
    this.orgDraftsMem.set(id, updated);
    return updated;
  }

  async deleteOrganizationDraftForUser(id: number, userId: string): Promise<boolean> {
    const existing = this.orgDraftsMem.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.orgDraftsMem.delete(id);
  }

  // Shared Certificate methods (MemStorage — in-memory)
  private sharedCertsMem: Map<string, SharedCertificateRecord> = new Map();
  private sharedCertSeq = 1;

  async createSharedCertificate(data: InsertSharedCertificate): Promise<SharedCertificateRecord> {
    const rec = {
      id: this.sharedCertSeq++,
      token: data.token,
      userId: data.userId ?? "",
      topic: data.topic ?? null,
      profile: data.profile,
      createdAt: new Date(),
    } as SharedCertificateRecord;
    this.sharedCertsMem.set(rec.token, rec);
    return rec;
  }

  async getSharedCertificateByToken(token: string): Promise<SharedCertificateRecord | undefined> {
    return this.sharedCertsMem.get(token);
  }

  async cloneAgentForOwner(_masterAgentId: number, _ownerUserId: string): Promise<Agent> {
    throw new Error("cloneAgentForOwner not implemented in MemStorage");
  }
}

import { dbStorage } from "./db-storage";

// Use DatabaseStorage for persistence
export const storage: IStorage = dbStorage;
