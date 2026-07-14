import type { Express } from "express";
import PDFDocument from "pdfkit";
import OpenAI from "openai";
import { db } from "./db";
import { legalChatSessions, legalChatMessages, legalKnowledgeBases, legalKnowledgeChunks, legalCases } from "@shared/schema";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";
import { LEGAL_AGENTS, LEX_ORCHESTRATOR_PROMPT, LEX_ORCHESTRATOR_GREETING, selectAgent, buildOrchestrationPrompt } from "./lib/legal-agents";
import { chunkText, createEmbedding, createEmbeddings, retrieveRelevantChunks } from "./lib/rag-service";

const isProduction = process.env.NODE_ENV === "production";
const rawBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const isLocalhostProxy = rawBaseURL?.includes("localhost");
let openaiApiKey: string | undefined;
let openaiBaseURL: string | undefined;
if (!isProduction && isLocalhostProxy && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  openaiBaseURL = rawBaseURL;
} else {
  openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  openaiBaseURL = undefined;
}

const openai = new OpenAI({
  apiKey: openaiApiKey || "missing-key",
  ...(openaiBaseURL ? { baseURL: openaiBaseURL } : {}),
});

const DISCLAIMER = "\n\n---\n⚠️ *Informasi ini bersifat edukatif dan bukan pendapat hukum yang mengikat. Untuk kasus hukum konkret, konsultasikan dengan advokat atau konsultan hukum berpengalaman.*";

const LEGAL_ADMIN_KEY = process.env.LEGAL_ADMIN_KEY;

function isLegalAdmin(req: any): boolean {
  if (!LEGAL_ADMIN_KEY) return false;
  const key = req.headers["x-legal-admin-key"] || req.body?.adminKey;
  return typeof key === "string" && key.length > 0 && key === LEGAL_ADMIN_KEY;
}

async function searchLegalCasesRAG(query: string, topK = 5): Promise<string> {
  try {
    const allCases = await db.select().from(legalCases).limit(500);
    if (allCases.length === 0) return "";

    const queryEmbedding = await createEmbedding(query);

    if (queryEmbedding.length > 0) {
      const casesWithEmbeddings = allCases.filter(c => c.embedding && (c.embedding as number[]).length > 0);
      if (casesWithEmbeddings.length > 0) {
        const fakeChunks = casesWithEmbeddings.map(c => ({
          id: c.id,
          knowledgeBaseId: 0,
          agentId: 0,
          chunkIndex: 0,
          content: `${c.caseNumber} — ${c.court}: ${c.legalIssue}\n${c.ratioDecidendi}`,
          tokenCount: 0,
          embedding: c.embedding as number[],
          metadata: {},
          createdAt: c.createdAt,
        })) as any[];
        const relevant = retrieveRelevantChunks(queryEmbedding, fakeChunks, topK, 0.25);
        if (relevant.length > 0) {
          const caseMap = new Map(allCases.map(c => [c.id, c]));
          return relevant.map(r => {
            const c = caseMap.get(r.chunk.id)!;
            return formatCaseCitation(c, r.score);
          }).join("\n\n---\n\n");
        }
      }
    }

    const keywordCases = allCases
      .filter(c => {
        const q = query.toLowerCase();
        return (
          c.caseNumber.toLowerCase().includes(q) ||
          (c.legalIssue || "").toLowerCase().includes(q) ||
          (c.parties || "").toLowerCase().includes(q) ||
          (c.keywords || []).some(k => k.toLowerCase().includes(q))
        );
      })
      .slice(0, topK);

    if (keywordCases.length === 0) return "";
    return keywordCases.map(c => formatCaseCitation(c, null)).join("\n\n---\n\n");
  } catch (err) {
    console.error("[Legal RAG] Case search error:", err);
    return "";
  }
}

function buildFormattedCitation(caseNumber: string, court: string): string {
  const suffix = court === "MA" ? "/MARI" : court === "MK" ? "/MKRI" : "";
  const hasSuffix = suffix && !caseNumber.includes(suffix.slice(1));
  return `Putusan ${court} No. ${caseNumber}${hasSuffix ? suffix : ""}`;
}

function formatCaseCitation(c: any, score: number | null): string {
  const citation = buildFormattedCitation(c.caseNumber, c.court);
  const lines: string[] = [];
  lines.push(`**${citation}** (${c.year || "N/A"})`);
  if (c.parties) lines.push(`Para Pihak: ${c.parties}`);
  if (c.domain) lines.push(`Domain: ${c.domain}`);
  if (c.legalIssue) lines.push(`Isu Hukum: ${c.legalIssue}`);
  lines.push(`Ratio Decidendi: ${c.ratioDecidendi}`);
  if (c.conclusion) lines.push(`Kesimpulan: ${c.conclusion}`);
  if (c.sourceUrl) lines.push(`Sumber: ${c.sourceUrl}`);
  if (score !== null) lines.push(`[Relevansi: ${(score * 100).toFixed(0)}%]`);
  return lines.join("\n");
}

async function searchLegalKBChunks(query: string, topK = 5): Promise<string> {
  try {
    const allChunks = await db.select({
      id: legalKnowledgeChunks.id,
      legalKbId: legalKnowledgeChunks.legalKbId,
      chunkIndex: legalKnowledgeChunks.chunkIndex,
      content: legalKnowledgeChunks.content,
      tokenCount: legalKnowledgeChunks.tokenCount,
      embedding: legalKnowledgeChunks.embedding,
      metadata: legalKnowledgeChunks.metadata,
      createdAt: legalKnowledgeChunks.createdAt,
      kbName: legalKnowledgeBases.name,
      kbSourceAuthority: legalKnowledgeBases.sourceAuthority,
    })
      .from(legalKnowledgeChunks)
      .innerJoin(legalKnowledgeBases, eq(legalKnowledgeChunks.legalKbId, legalKnowledgeBases.id))
      .where(eq(legalKnowledgeBases.status, "active"))
      .limit(2000);

    if (allChunks.length === 0) return "";

    const queryEmbedding = await createEmbedding(query);
    if (queryEmbedding.length === 0) return allChunks.slice(0, 3).map(c => c.content).join("\n\n");

    const fakeChunks = allChunks.map(c => ({
      id: c.id,
      knowledgeBaseId: c.legalKbId,
      agentId: 0,
      chunkIndex: c.chunkIndex,
      content: c.content,
      tokenCount: c.tokenCount,
      embedding: c.embedding as number[],
      metadata: { sourceName: c.kbName, sourceAuthority: c.kbSourceAuthority },
      createdAt: c.createdAt,
    })) as any[];

    const relevant = retrieveRelevantChunks(queryEmbedding, fakeChunks, topK, 0.3);
    if (relevant.length === 0) return allChunks.slice(0, 3).map(c => c.content).join("\n\n");

    const chunkMap = new Map(allChunks.map(c => [c.id, c]));
    return relevant.map(r => {
      const orig = chunkMap.get(r.chunk.id);
      const source = orig?.kbName || "Legal KB";
      const authority = orig?.kbSourceAuthority ? ` [${orig.kbSourceAuthority}]` : "";
      return `[${source}${authority}] (relevansi: ${(r.score * 100).toFixed(0)}%):\n${r.chunk.content}`;
    }).join("\n\n---\n\n");
  } catch (err) {
    console.error("[Legal RAG] KB chunk search error:", err);
    return "";
  }
}

function detectTier(message: string): string {
  const T3_SIGNALS = /\b(eksepsi|ratio decidendi|kasasi|pk |peninjauan kembali|legal opinion|due diligence|dakwaan|pledoi|requisitor|in dubio pro reo|lex specialis|pasal \d+|putusan no|yurisprudensi|actio pauliana|concursus|homologasi|boedel|debt to equity)\b/i;
  const T2_SIGNALS = /\b(perusahaan|direksi|karyawan|kontrak komersial|risiko bisnis|due diligence|perjanjian kerja|mou|nda|sha|compliance|gcg|in-house|merger|akuisisi)\b/i;
  if (T3_SIGNALS.test(message)) return "T3 (Advokat/Profesional) — gunakan bahasa hukum teknis penuh, sitasi pasal lengkap, format IRAC+.";
  if (T2_SIGNALS.test(message)) return "T2 (Korporat) — bahasa bisnis-legal, focus pada risiko dan opsi, risk matrix jika relevan.";
  return "T1 (Awam) — gunakan bahasa sederhana, hindari jargon berlebihan, jelaskan istilah teknis.";
}

const GUEST_MESSAGE_LIMIT = 5;
const guestLegalTracker = new Map<string, { count: number; lastReset: string }>();

function getGuestKey(req: any): string {
  const ip = req.headers["x-forwarded-for"] || req.ip || "unknown";
  const ua = (req.headers["user-agent"] || "").substring(0, 50);
  const raw = `legal_${ip}_${ua}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `guest_legal_${Math.abs(hash).toString(36)}`;
}

function getGuestCount(key: string): number {
  const today = new Date().toISOString().split("T")[0];
  const entry = guestLegalTracker.get(key);
  if (!entry || entry.lastReset !== today) return 0;
  return entry.count;
}

function incrementGuestCount(key: string): number {
  const today = new Date().toISOString().split("T")[0];
  const entry = guestLegalTracker.get(key);
  if (!entry || entry.lastReset !== today) {
    guestLegalTracker.set(key, { count: 1, lastReset: today });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

// .unref(): jangan tahan event loop (lihat catatan di server/routes.ts).
setInterval(() => {
  const today = new Date().toISOString().split("T")[0];
  for (const [key, val] of Array.from(guestLegalTracker.entries())) {
    if (val.lastReset !== today) guestLegalTracker.delete(key);
  }
}, 60 * 60 * 1000).unref();

function getUserId(req: any): string | null {
  return req.user?.claims?.sub || req.user?.id || null;
}

function isGuest(req: any): boolean {
  return !getUserId(req);
}

export function registerLegalRoutes(app: Express) {

  app.get("/api/legal-agents", (_req: any, res: any) => {
    const agents = LEGAL_AGENTS.map(({ id, name, personaName, emoji, domain, tagline, recommendedKBSources }) => ({
      id,
      name,
      personaName,
      emoji,
      domain,
      tagline,
      recommendedKBSources,
    }));
    res.json(agents);
  });

  app.post("/api/legal/chat", async (req: any, res: any) => {
    try {
      const { sessionId, message } = req.body;
      let agentType: string = req.body.agentType || "auto";
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }
      if (message.length > 4000) {
        return res.status(400).json({ error: "Message too long (max 4000 characters)" });
      }

      const userId = getUserId(req);
      const guest = !userId;

      if (guest) {
        const guestKey = getGuestKey(req);
        const count = getGuestCount(guestKey);
        if (count >= GUEST_MESSAGE_LIMIT) {
          return res.status(429).json({
            error: "Batas pesan tamu tercapai",
            limitReached: true,
            message: `Mode tamu dibatasi ${GUEST_MESSAGE_LIMIT} pesan per hari. Silakan login untuk akses penuh.`
          });
        }
        incrementGuestCount(guestKey);
      }

      const validAgentIds = ["auto", ...LEGAL_AGENTS.map(a => a.id)];
      if (!validAgentIds.includes(agentType)) {
        agentType = "auto";
      }

      let selectedAgentId: string;
      let systemPrompt: string;

      if (agentType === "auto") {
        const orchestrated = buildOrchestrationPrompt(message);
        selectedAgentId = orchestrated.agentId;
        systemPrompt = orchestrated.systemPrompt;
      } else {
        selectedAgentId = agentType;
        const agentConfig = LEGAL_AGENTS.find(a => a.id === selectedAgentId);
        systemPrompt = agentConfig
          ? agentConfig.systemPrompt
          : LEX_ORCHESTRATOR_PROMPT;
      }

      const tierHint = detectTier(message);
      systemPrompt = `${systemPrompt}\n\nUSER TIER (detected): ${tierHint}. Sesuaikan kedalaman jawaban.`;

      const [caseContext, kbContext] = await Promise.all([
        searchLegalCasesRAG(message, 4).catch(() => ""),
        searchLegalKBChunks(message, 4).catch(() => ""),
      ]);

      if (caseContext) {
        systemPrompt += `\n\n=== YURISPRUDENSI RELEVAN (dari database putusan MA/MK) ===\nGunakan putusan berikut untuk mendukung analisis Anda. Format sitasi: "Putusan MA No. XXX/Pid/YYYY/MARI".\n\n${caseContext}\n\nPENTING: Selalu tambahkan "⚠️ Verifikasi nomor putusan di sipp.mahkamahagung.go.id sebelum digunakan dalam dokumen formal." setelah menyitir putusan.`;
      }

      if (kbContext) {
        systemPrompt += `\n\n=== REGULASI RELEVAN (dari knowledge base hukum) ===\nGunakan referensi peraturan berikut untuk mendukung analisis Anda dengan sitasi pasal yang akurat:\n\n${kbContext}`;
      }

      let dbSessionId: number | null = null;
      let history: { role: "user" | "assistant"; content: string }[] = [];

      if (userId) {
        if (sessionId && !isNaN(Number(sessionId))) {
          const parsedSessionId = Number(sessionId);
          try {
            const [session] = await db
              .select()
              .from(legalChatSessions)
              .where(and(
                eq(legalChatSessions.id, parsedSessionId),
                eq(legalChatSessions.userId, userId)
              ));

            if (session) {
              dbSessionId = session.id;
              const msgs = await db
                .select()
                .from(legalChatMessages)
                .where(eq(legalChatMessages.sessionId, dbSessionId))
                .orderBy(legalChatMessages.createdAt)
                .limit(24);
              history = msgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
            }
          } catch (err) {
            console.error("[Legal Chat] Failed to load session history:", err);
          }
        }

        if (!dbSessionId) {
          try {
            const title = message.trim().slice(0, 60) + (message.trim().length > 60 ? "..." : "");
            const [newSession] = await db.insert(legalChatSessions).values({
              userId,
              agentType: selectedAgentId,
              title,
              messageCount: 0,
            }).returning();
            dbSessionId = newSession.id;
          } catch (err) {
            console.error("[Legal Chat] Failed to create session:", err);
          }
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Agent-Selected", selectedAgentId);

      const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...history.slice(-16),
        { role: "user", content: message.trim() },
      ];

      let fullResponse = "";
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          stream: true,
          max_tokens: 3500,
          temperature: 0.2,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ text, agentId: selectedAgentId })}\n\n`);
          }
        }

        if (!fullResponse.includes("⚠️")) {
          fullResponse += DISCLAIMER;
          res.write(`data: ${JSON.stringify({ text: DISCLAIMER, agentId: selectedAgentId })}\n\n`);
        }
      } catch (err: any) {
        const errMsg = `Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.`;
        fullResponse = errMsg;
        res.write(`data: ${JSON.stringify({ text: errMsg, agentId: selectedAgentId })}\n\n`);
      }

      if (userId && dbSessionId) {
        try {
          await db.insert(legalChatMessages).values([
            {
              sessionId: dbSessionId,
              userId,
              role: "user",
              content: message.trim(),
              agentType: selectedAgentId,
            },
            {
              sessionId: dbSessionId,
              userId,
              role: "assistant",
              content: fullResponse,
              agentType: selectedAgentId,
              agentSelected: selectedAgentId,
            },
          ]);
          await db
            .update(legalChatSessions)
            .set({ messageCount: sql`${legalChatSessions.messageCount} + 2`, updatedAt: new Date() })
            .where(and(
              eq(legalChatSessions.id, dbSessionId),
              eq(legalChatSessions.userId, userId)
            ));
        } catch (err) {
          console.error("[Legal Chat] Failed to persist messages:", err);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, sessionId: dbSessionId, agentId: selectedAgentId })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("[Legal Chat] Unhandled error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Server error", done: true })}\n\n`);
        res.end();
      }
    }
  });

  app.get("/api/legal/sessions", async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.json([]);
      const sessions = await db
        .select()
        .from(legalChatSessions)
        .where(eq(legalChatSessions.userId, userId))
        .orderBy(desc(legalChatSessions.updatedAt))
        .limit(50);
      res.json(sessions);
    } catch (error) {
      console.error("[Legal Sessions] Error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/legal/sessions/:id", async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const sessionId = Number(req.params.id);
      if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session ID" });

      const [session] = await db
        .select()
        .from(legalChatSessions)
        .where(and(eq(legalChatSessions.id, sessionId), eq(legalChatSessions.userId, userId)));

      if (!session) return res.status(404).json({ error: "Session not found" });

      const messages = await db
        .select()
        .from(legalChatMessages)
        .where(and(
          eq(legalChatMessages.sessionId, sessionId),
          eq(legalChatMessages.userId, userId)
        ))
        .orderBy(legalChatMessages.createdAt);

      res.json({ ...session, messages });
    } catch (error) {
      console.error("[Legal Session] Error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.delete("/api/legal/sessions/:id", async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const sessionId = Number(req.params.id);
      if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session ID" });

      const [session] = await db
        .select({ id: legalChatSessions.id })
        .from(legalChatSessions)
        .where(and(eq(legalChatSessions.id, sessionId), eq(legalChatSessions.userId, userId)));

      if (!session) return res.status(404).json({ error: "Session not found" });

      await db.delete(legalChatMessages).where(
        and(
          eq(legalChatMessages.sessionId, sessionId),
          eq(legalChatMessages.userId, userId)
        )
      );
      await db
        .delete(legalChatSessions)
        .where(and(eq(legalChatSessions.id, sessionId), eq(legalChatSessions.userId, userId)));

      res.json({ success: true });
    } catch (error) {
      console.error("[Legal Session Delete] Error:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.get("/api/legal/agents", (_req: any, res: any) => {
    res.json(LEGAL_AGENTS.map(a => ({
      id: a.id,
      name: a.name,
      personaName: a.personaName,
      emoji: a.emoji,
      domain: a.domain,
      tagline: a.tagline,
      greetingMessage: a.greetingMessage ?? null,
      starters: a.starters,
    })));
  });

  app.post("/api/legal/export-pdf", (req: any, res: any) => {
    try {
      const { content, agentName, agentId } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Content is required" });
      }
      if (content.length > 50000) {
        return res.status(413).json({ error: "Content too large for PDF export (max 50,000 characters)" });
      }

      const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const safeAgentName = String(agentName || "LexCom AI").replace(/[^\w\s\-.,()]/g, "");

      const filename = `LexCom-${(agentId || "legal").replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, bottom: 60, left: 72, right: 72 },
        info: {
          Title: `LexCom Legal Document - ${safeAgentName}`,
          Author: "LexCom AI Legal Research Platform",
          Subject: "Legal Analysis Document",
          Creator: "LexCom AI",
        },
      });

      doc.pipe(res);

      const PX = 72;
      const pageWidth = doc.page.width - 144;

      doc.rect(PX, 48, pageWidth, 2).fill("#4f46e5");
      doc.fillColor("#1e1b4b").fontSize(18).font("Helvetica-Bold")
        .text("LexCom AI Legal Research Platform", PX, 58, { width: pageWidth });
      doc.fillColor("#6b7280").fontSize(9).font("Helvetica")
        .text(`Agen: ${safeAgentName}  |  Tanggal: ${today}  |  Bersifat edukatif — bukan pendapat hukum mengikat`, PX, 80, { width: pageWidth });
      doc.rect(PX, 96, pageWidth, 1).fill("#e5e7eb");
      doc.moveDown(2);

      const stripInline = (s: string) =>
        s.replace(/\*\*\*(.+?)\*\*\*/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1").trim();

      const isTableRow = (l: string) => /^\|.+\|/.test(l.trim());
      const isSeparatorRow = (l: string) => /^\|[\s|:\-]+\|$/.test(l.trim());

      type Block =
        | { type: "line"; content: string }
        | { type: "table"; rows: string[][] };

      const rawLines = content.split("\n");
      const blocks: Block[] = [];
      let idx = 0;
      while (idx < rawLines.length) {
        if (isTableRow(rawLines[idx])) {
          const tableLines: string[] = [];
          while (idx < rawLines.length && isTableRow(rawLines[idx])) {
            tableLines.push(rawLines[idx]);
            idx++;
          }
          const tableRows = tableLines
            .filter(l => !isSeparatorRow(l))
            .map(l =>
              l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => stripInline(c))
            );
          if (tableRows.length > 0) {
            blocks.push({ type: "table", rows: tableRows });
          }
        } else {
          blocks.push({ type: "line", content: rawLines[idx] });
          idx++;
        }
      }

      for (const block of blocks) {
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
        }

        if (block.type === "table") {
          const rows = block.rows;
          if (rows.length === 0) continue;
          const colCount = rows[0].length;
          if (colCount === 0) continue;

          doc.moveDown(0.4);
          const colWidth = pageWidth / colCount;
          const cellPadX = 4;
          const cellPadY = 4;
          const fontSize = 9;
          doc.fontSize(fontSize);

          const rowHeights: number[] = rows.map((row, ri) => {
            let maxH = 0;
            for (const cell of row) {
              const textH = doc.heightOfString(cell, { width: colWidth - cellPadX * 2 });
              if (textH + cellPadY * 2 > maxH) maxH = textH + cellPadY * 2;
            }
            return Math.max(maxH, ri === 0 ? 20 : 18);
          });

          let tableY = doc.y;
          for (let ri = 0; ri < rows.length; ri++) {
            if (tableY + rowHeights[ri] > doc.page.height - 60) {
              doc.addPage();
              tableY = doc.y;
            }
            const isHeader = ri === 0;
            if (isHeader) {
              doc.rect(PX, tableY, pageWidth, rowHeights[ri]).fill("#ede9fe");
            } else if (ri % 2 === 0) {
              doc.rect(PX, tableY, pageWidth, rowHeights[ri]).fill("#f9f8ff");
            } else {
              doc.rect(PX, tableY, pageWidth, rowHeights[ri]).fill("#ffffff");
            }
            doc.rect(PX, tableY, pageWidth, rowHeights[ri]).stroke("#c4b5fd");

            for (let ci = 0; ci < colCount; ci++) {
              const cellX = PX + ci * colWidth;
              if (ci > 0) {
                doc.moveTo(cellX, tableY).lineTo(cellX, tableY + rowHeights[ri]).stroke("#c4b5fd");
              }
              const cellText = rows[ri][ci] || "";
              doc
                .fillColor(isHeader ? "#312e81" : "#1a1a1a")
                .font(isHeader ? "Helvetica-Bold" : "Helvetica")
                .fontSize(fontSize)
                .text(cellText, cellX + cellPadX, tableY + cellPadY, {
                  width: colWidth - cellPadX * 2,
                  lineBreak: true,
                  ellipsis: false,
                });
            }
            tableY += rowHeights[ri];
          }
          doc.y = tableY;
          doc.moveDown(0.5);
          continue;
        }

        const line = block.content;

        if (/^#{3}\s+/.test(line)) {
          const text = stripInline(line.replace(/^###\s+/, ""));
          doc.fillColor("#4338ca").fontSize(11).font("Helvetica-Bold").text(text, PX, undefined, { width: pageWidth });
          doc.moveDown(0.3);
        } else if (/^#{2}\s+/.test(line)) {
          const text = stripInline(line.replace(/^##\s+/, ""));
          doc.moveDown(0.4);
          doc.fillColor("#312e81").fontSize(13).font("Helvetica-Bold").text(text, PX, undefined, { width: pageWidth });
          doc.moveDown(0.3);
        } else if (/^#{1}\s+/.test(line)) {
          const text = stripInline(line.replace(/^#\s+/, ""));
          doc.moveDown(0.6);
          doc.fillColor("#1e1b4b").fontSize(14).font("Helvetica-Bold").text(text.toUpperCase(), PX, undefined, { width: pageWidth });
          doc.rect(PX, doc.y, pageWidth, 0.5).fill("#e5e7eb");
          doc.moveDown(0.4);
        } else if (/^---+$/.test(line.trim())) {
          doc.moveDown(0.3);
          doc.rect(PX, doc.y, pageWidth, 0.5).fill("#d1d5db");
          doc.moveDown(0.5);
        } else if (/^\d+\.\s+/.test(line)) {
          const text = stripInline(line.replace(/^\d+\.\s+/, ""));
          const num = line.match(/^(\d+)\./)?.[1] || "•";
          doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica")
            .text(`${num}.  ${text}`, PX + 8, undefined, { width: pageWidth - 8 });
          doc.moveDown(0.2);
        } else if (/^[-*]\s+/.test(line)) {
          const text = stripInline(line.replace(/^[-*]\s+/, ""));
          doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica")
            .text(`\u2022  ${text}`, PX + 8, undefined, { width: pageWidth - 8 });
          doc.moveDown(0.2);
        } else if (line.trim() === "") {
          doc.moveDown(0.5);
        } else {
          const plainText = stripInline(line);
          if (plainText) {
            doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica")
              .text(plainText, PX, undefined, { width: pageWidth, align: "justify" });
            doc.moveDown(0.25);
          }
        }
      }

      doc.moveDown(1.5);
      doc.rect(PX, doc.y, pageWidth, 1).fill("#e5e7eb");
      doc.moveDown(0.5);
      doc.fillColor("#9ca3af").fontSize(8).font("Helvetica-Oblique")
        .text("⚠ Dokumen ini dihasilkan oleh LexCom AI dan bersifat edukatif semata. Bukan merupakan pendapat hukum profesional yang mengikat secara hukum. Untuk keputusan hukum konkret, konsultasikan dengan advokat atau konsultan hukum berlisensi PERADI/KAI.", PX, undefined, { width: pageWidth, align: "center" });

      doc.end();
    } catch (error) {
      console.error("[Legal Export PDF] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });

  app.get("/api/legal/guest-status", (req: any, res: any) => {
    if (!isGuest(req)) {
      return res.json({ isGuest: false, messagesUsed: 0, limit: GUEST_MESSAGE_LIMIT });
    }
    const guestKey = getGuestKey(req);
    const count = getGuestCount(guestKey);
    res.json({ isGuest: true, messagesUsed: count, limit: GUEST_MESSAGE_LIMIT, limitReached: count >= GUEST_MESSAGE_LIMIT });
  });

  app.get("/api/legal/cases/search", async (req: any, res: any) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q) return res.json([]);

      const allCases = await db.select().from(legalCases).limit(500);
      if (allCases.length === 0) return res.json([]);

      const queryEmbedding = await createEmbedding(q).catch(() => []);
      let results: any[] = [];

      if (queryEmbedding.length > 0) {
        const casesWithEmb = allCases.filter(c => c.embedding && (c.embedding as number[]).length > 0);
        if (casesWithEmb.length > 0) {
          const fakeChunks = casesWithEmb.map(c => ({
            id: c.id,
            knowledgeBaseId: 0,
            agentId: 0,
            chunkIndex: 0,
            content: `${c.caseNumber} ${c.court} ${c.legalIssue} ${c.ratioDecidendi}`,
            tokenCount: 0,
            embedding: c.embedding as number[],
            metadata: {},
            createdAt: c.createdAt,
          })) as any[];
          const relevant = retrieveRelevantChunks(queryEmbedding, fakeChunks, 10, 0.2);
          if (relevant.length > 0) {
            const caseMap = new Map(allCases.map(c => [c.id, c]));
            results = relevant.map(r => ({ ...caseMap.get(r.chunk.id), relevanceScore: r.score }));
          }
        }
      }

      if (results.length === 0) {
        const ql = q.toLowerCase();
        results = allCases
          .filter(c =>
            c.caseNumber.toLowerCase().includes(ql) ||
            (c.legalIssue || "").toLowerCase().includes(ql) ||
            (c.parties || "").toLowerCase().includes(ql) ||
            (c.ratioDecidendi || "").toLowerCase().includes(ql) ||
            (c.keywords || []).some(k => k.toLowerCase().includes(ql))
          )
          .slice(0, 10)
          .map(c => ({ ...c, relevanceScore: null }));
      }

      res.json(results.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        court: c.court,
        year: c.year,
        domain: c.domain,
        parties: c.parties,
        legalIssue: c.legalIssue,
        ratioDecidendi: c.ratioDecidendi,
        conclusion: c.conclusion,
        keywords: c.keywords,
        sourceUrl: c.sourceUrl,
        relevanceScore: c.relevanceScore,
        formattedCitation: buildFormattedCitation(c.caseNumber, c.court),
      })));
    } catch (err) {
      console.error("[Legal Cases Search] Error:", err);
      res.status(500).json({ error: "Failed to search cases" });
    }
  });

  app.get("/api/legal/cases", async (_req: any, res: any) => {
    try {
      const cases = await db.select({
        id: legalCases.id,
        caseNumber: legalCases.caseNumber,
        court: legalCases.court,
        year: legalCases.year,
        domain: legalCases.domain,
        parties: legalCases.parties,
        legalIssue: legalCases.legalIssue,
        conclusion: legalCases.conclusion,
        keywords: legalCases.keywords,
        sourceUrl: legalCases.sourceUrl,
        createdAt: legalCases.createdAt,
      }).from(legalCases).orderBy(desc(legalCases.createdAt)).limit(200);
      res.json(cases);
    } catch (err) {
      console.error("[Legal Cases] Error:", err);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  app.post("/api/legal/cases", async (req: any, res: any) => {
    try {
      if (!isLegalAdmin(req)) return res.status(403).json({ error: "Forbidden" });
      const { caseNumber, court, year, domain, parties, legalIssue, ratioDecidendi, conclusion, keywords, sourceUrl } = req.body;
      if (!caseNumber || !court || !ratioDecidendi) {
        return res.status(400).json({ error: "caseNumber, court, ratioDecidendi are required" });
      }
      const textForEmbedding = `${caseNumber} ${court} ${domain || ""} ${legalIssue || ""} ${ratioDecidendi}`;
      const embedding = await createEmbedding(textForEmbedding).catch(() => []);
      const [newCase] = await db.insert(legalCases).values({
        caseNumber: caseNumber.trim(),
        court: court.trim(),
        year: year ? Number(year) : null,
        domain: domain || "umum",
        parties: parties || "",
        legalIssue: legalIssue || "",
        ratioDecidendi: ratioDecidendi.trim(),
        conclusion: conclusion || "",
        keywords: Array.isArray(keywords) ? keywords : [],
        sourceUrl: sourceUrl || "",
        embedding,
      }).returning();
      res.json(newCase);
    } catch (err) {
      console.error("[Legal Cases Add] Error:", err);
      res.status(500).json({ error: "Failed to add case" });
    }
  });

  app.delete("/api/legal/cases/:id", async (req: any, res: any) => {
    try {
      if (!isLegalAdmin(req)) return res.status(403).json({ error: "Forbidden" });
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await db.delete(legalCases).where(eq(legalCases.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("[Legal Cases Delete] Error:", err);
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  app.get("/api/legal/kb", async (req: any, res: any) => {
    try {
      if (!isLegalAdmin(req)) return res.status(403).json({ error: "Forbidden" });
      const kbs = await db.select({
        id: legalKnowledgeBases.id,
        name: legalKnowledgeBases.name,
        category: legalKnowledgeBases.category,
        sourceAuthority: legalKnowledgeBases.sourceAuthority,
        sourceUrl: legalKnowledgeBases.sourceUrl,
        effectiveDate: legalKnowledgeBases.effectiveDate,
        status: legalKnowledgeBases.status,
        contentSummary: legalKnowledgeBases.contentSummary,
        chunkCount: legalKnowledgeBases.chunkCount,
        createdAt: legalKnowledgeBases.createdAt,
        updatedAt: legalKnowledgeBases.updatedAt,
      }).from(legalKnowledgeBases).orderBy(desc(legalKnowledgeBases.createdAt));
      res.json(kbs);
    } catch (err) {
      console.error("[Legal KB] Error:", err);
      res.status(500).json({ error: "Failed to fetch knowledge bases" });
    }
  });

  app.post("/api/legal/kb", async (req: any, res: any) => {
    try {
      if (!isLegalAdmin(req)) return res.status(403).json({ error: "Forbidden" });
      const { name, category, sourceAuthority, sourceUrl, effectiveDate, content, contentSummary } = req.body;
      if (!name || !content || typeof content !== "string") {
        return res.status(400).json({ error: "name and content are required" });
      }
      if (content.length > 500000) {
        return res.status(413).json({ error: "Content too large (max 500,000 chars)" });
      }

      const [newKB] = await db.insert(legalKnowledgeBases).values({
        name: name.trim(),
        category: category || "regulasi",
        sourceAuthority: sourceAuthority || "",
        sourceUrl: sourceUrl || "",
        effectiveDate: effectiveDate || "",
        status: "active",
        contentSummary: contentSummary || content.slice(0, 300),
        chunkCount: 0,
      }).returning();

      const chunks = chunkText(content, 800, 200);
      if (chunks.length > 0) {
        const embeddings = await createEmbeddings(chunks);
        const chunkRows = chunks.map((chunkContent, idx) => ({
          legalKbId: newKB.id,
          chunkIndex: idx,
          content: chunkContent,
          tokenCount: Math.ceil(chunkContent.length / 4),
          embedding: embeddings[idx] || [],
          metadata: { sourceName: name, sourceAuthority: sourceAuthority || "", totalChunks: chunks.length },
        }));

        const batchSize = 50;
        for (let i = 0; i < chunkRows.length; i += batchSize) {
          await db.insert(legalKnowledgeChunks).values(chunkRows.slice(i, i + batchSize));
        }

        await db.update(legalKnowledgeBases)
          .set({ chunkCount: chunks.length, updatedAt: new Date() })
          .where(eq(legalKnowledgeBases.id, newKB.id));
        newKB.chunkCount = chunks.length;
      }

      res.json({ ...newKB, chunksCreated: chunks.length });
    } catch (err) {
      console.error("[Legal KB Upload] Error:", err);
      res.status(500).json({ error: "Failed to upload knowledge base" });
    }
  });

  app.delete("/api/legal/kb/:id", async (req: any, res: any) => {
    try {
      if (!isLegalAdmin(req)) return res.status(403).json({ error: "Forbidden" });
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await db.delete(legalKnowledgeChunks).where(eq(legalKnowledgeChunks.legalKbId, id));
      await db.delete(legalKnowledgeBases).where(eq(legalKnowledgeBases.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("[Legal KB Delete] Error:", err);
      res.status(500).json({ error: "Failed to delete knowledge base" });
    }
  });

  app.post("/api/legal/legal-opinion", async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      const guest = !userId;

      if (guest) {
        const guestKey = getGuestKey(req);
        const count = getGuestCount(guestKey);
        if (count >= GUEST_MESSAGE_LIMIT) {
          return res.status(429).json({
            error: "Batas pesan tamu tercapai",
            limitReached: true,
            message: `Mode tamu dibatasi ${GUEST_MESSAGE_LIMIT} pesan per hari. Silakan login untuk akses penuh.`
          });
        }
        incrementGuestCount(guestKey);
      }

      const { clientName, facts, legalIssues, requestedBy } = req.body;
      if (!facts || typeof facts !== "string" || facts.trim().length === 0) {
        return res.status(400).json({ error: "Facts are required" });
      }

      const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const docNumber = `LO-${Date.now().toString(36).toUpperCase()}`;

      const systemPrompt = `${LEGAL_AGENTS.find(a => a.id === "drafter")!.systemPrompt}`;

      const userPrompt = `Buat LEGAL OPINION (Pendapat Hukum) formal dengan struktur lengkap sesuai standar PERADI/HKLI.

Data yang tersedia:
- Nomor Dokumen: ${docNumber}
- Tanggal: ${today}
- Klien / Pemohon: ${clientName || "[Nama Klien]"}
- Dibuat oleh: ${requestedBy || "LexCom AI Legal Research Platform"}
- Fakta & Kronologi: ${facts.trim()}
- Permasalahan Hukum yang Diminta: ${legalIssues || "Sesuai fakta yang disampaikan"}

Gunakan struktur berikut secara lengkap:
1. **KETERANGAN DOKUMEN** (Nomor, Tanggal, Kepada, Perihal, Dasar Penugasan)
2. **FAKTA-FAKTA KLIEN** (Kronologi berdasarkan input, jangan mengarang)
3. **PERMASALAHAN HUKUM** (Daftar bernomor isu yang dianalisis)
4. **DASAR HUKUM** (Peraturan perundang-undangan & yurisprudensi relevan dengan citation lengkap)
5. **ANALISIS HUKUM** (IRAC per isu: Issue → Rule → Application → Conclusion)
6. **KESIMPULAN** (Ringkasan pendapat hukum yang tegas dan terukur)
7. **REKOMENDASI** (Langkah konkret yang disarankan)
8. **DISCLAIMER** (Batasan formal pendapat hukum ini)

Sertakan header: "DRAFT — UNTUK REVIEW ADVOKAT" di awal dokumen.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Agent-Selected", "drafter");

      let fullResponse = "";
      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
          max_tokens: 3000,
          temperature: 0.2,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ text, agentId: "drafter" })}\n\n`);
          }
        }

        if (!fullResponse.includes("⚠️")) {
          const disclaimer = "\n\n---\n⚠️ *Draft ini bersifat referensi edukatif. Setiap dokumen hukum resmi harus direvisi dan ditandatangani di hadapan advokat berlisensi.*";
          fullResponse += disclaimer;
          res.write(`data: ${JSON.stringify({ text: disclaimer, agentId: "drafter" })}\n\n`);
        }
      } catch (err: any) {
        const errMsg = "Maaf, terjadi kesalahan saat membuat legal opinion. Silakan coba lagi.";
        fullResponse = errMsg;
        res.write(`data: ${JSON.stringify({ text: errMsg, agentId: "drafter" })}\n\n`);
      }

      if (userId) {
        try {
          const title = `Legal Opinion — ${clientName || "Klien"} (${today})`;
          const [newSession] = await db.insert(legalChatSessions).values({
            userId,
            agentType: "drafter",
            sessionType: "legal_opinion",
            title: title.slice(0, 60),
            messageCount: 0,
          }).returning();

          const sessionPrompt = `[Legal Opinion] Klien: ${clientName || "N/A"} | Fakta: ${facts.trim().slice(0, 200)}`;
          await db.insert(legalChatMessages).values([
            { sessionId: newSession.id, userId, role: "user", content: sessionPrompt, agentType: "drafter" },
            { sessionId: newSession.id, userId, role: "assistant", content: fullResponse, agentType: "drafter", agentSelected: "drafter" },
          ]);
          await db.update(legalChatSessions)
            .set({ messageCount: 2, updatedAt: new Date() })
            .where(eq(legalChatSessions.id, newSession.id));

          res.write(`data: ${JSON.stringify({ done: true, sessionId: newSession.id, agentId: "drafter" })}\n\n`);
        } catch {
          res.write(`data: ${JSON.stringify({ done: true, agentId: "drafter" })}\n\n`);
        }
      } else {
        res.write(`data: ${JSON.stringify({ done: true, agentId: "drafter" })}\n\n`);
      }

      res.end();
    } catch (error: any) {
      console.error("[Legal Opinion] Unhandled error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Server error", done: true })}\n\n`);
        res.end();
      }
    }
  });
}
