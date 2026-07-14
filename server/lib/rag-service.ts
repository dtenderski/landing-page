import OpenAI from "openai";
import type { InsertKnowledgeChunk, KnowledgeChunk, KnowledgeBase } from "@shared/schema";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

export const RAG_DEFAULTS = {
  chunkSize: 800,
  chunkOverlap: 200,
  topK: 5,
};
const EMBEDDING_MODEL = "text-embedding-3-small";
const SIMILARITY_THRESHOLD = 0.3;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkText(text: string, chunkSize = RAG_DEFAULTS.chunkSize, overlap = RAG_DEFAULTS.chunkOverlap): string[] {
  if (!text || text.trim().length === 0) return [];

  const cleanText = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const sentences = cleanText.split(/(?<=[.!?\n])\s+/);

  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());

      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(overlap / 4));
      currentChunk = overlapWords.join(" ") + " " + sentence;
      currentTokens = estimateTokens(currentChunk);
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    return [];
  }
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const truncated = texts.map(t => t.slice(0, 8000));
    const batchSize = 20;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < truncated.length; i += batchSize) {
      const batch = truncated.slice(i, i + batchSize);
      const response = await getOpenAI().embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });
      allEmbeddings.push(...response.data.map(d => d.embedding));
    }

    return allEmbeddings;
  } catch (error) {
    console.error("Error creating embeddings:", error);
    return texts.map(() => []);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

export function retrieveRelevantChunks(
  queryEmbedding: number[],
  chunks: KnowledgeChunk[],
  topK = RAG_DEFAULTS.topK,
  threshold = SIMILARITY_THRESHOLD
): { chunk: KnowledgeChunk; score: number }[] {
  if (queryEmbedding.length === 0 || chunks.length === 0) return [];

  const scored = chunks
    .filter(c => c.embedding && (c.embedding as number[]).length > 0)
    .map(chunk => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
    }))
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

export async function processKnowledgeBaseForRAG(
  knowledgeBaseId: number,
  agentId: number,
  content: string,
  name: string,
  chunkSize = RAG_DEFAULTS.chunkSize,
  chunkOverlap = RAG_DEFAULTS.chunkOverlap
): Promise<InsertKnowledgeChunk[]> {
  const textContent = content.trim();
  if (!textContent) return [];

  const chunks = chunkText(textContent, chunkSize, chunkOverlap);
  if (chunks.length === 0) return [];

  console.log(`[RAG] Processing "${name}": ${chunks.length} chunks created`);

  const embeddings = await createEmbeddings(chunks);

  const knowledgeChunks: InsertKnowledgeChunk[] = chunks.map((chunkContent, index) => ({
    knowledgeBaseId,
    agentId,
    chunkIndex: index,
    content: chunkContent,
    tokenCount: estimateTokens(chunkContent),
    embedding: embeddings[index] || [],
    metadata: { sourceName: name, totalChunks: chunks.length },
  }));

  console.log(`[RAG] Embeddings created for "${name}": ${embeddings.filter(e => e.length > 0).length}/${chunks.length} successful`);

  return knowledgeChunks;
}

/**
 * Format atribusi sumber primer untuk satu KB sebagai header sitir
 * di dalam context yg dikirim ke LLM. Membantu agen menyitir Pasal/Pasal/PerLem
 * dengan tepat sesuai sumber resmi (PUPR/LKPP/DJP/BNSP/dst).
 */
function formatKBAttribution(kb: KnowledgeBase | undefined): string {
  if (!kb) return "";
  const parts: string[] = [];
  if (kb.sourceAuthority) parts.push(`Sumber Resmi: ${kb.sourceAuthority.toUpperCase()}`);
  if (kb.effectiveDate) {
    const d = typeof kb.effectiveDate === "string" ? kb.effectiveDate : new Date(kb.effectiveDate as any).toISOString();
    parts.push(`Berlaku: ${d.slice(0, 10)}`);
  }
  if (kb.sourceUrl) parts.push(`URL: ${kb.sourceUrl}`);
  if (kb.status && kb.status !== "active") parts.push(`Status: ${kb.status}`);
  return parts.length > 0 ? `[${parts.join(" | ")}]` : "";
}

export async function searchKnowledgeBase(
  query: string,
  allChunks: KnowledgeChunk[],
  topK = RAG_DEFAULTS.topK,
  kbMetadata?: Map<number, KnowledgeBase>
): Promise<string> {
  if (allChunks.length === 0) return "";

  // Filter chunks dari KB yg sudah dicabut (status='superseded') jika metadata tersedia.
  // KB tanpa metadata atau status='active'/'draft' tetap di-include (backward-compat untuk KB lama).
  const filteredChunks = kbMetadata
    ? allChunks.filter(c => {
        const kb = kbMetadata.get(c.knowledgeBaseId);
        return !kb || kb.status !== "superseded";
      })
    : allChunks;

  if (filteredChunks.length === 0) return "";

  const chunksWithEmbeddings = filteredChunks.filter(c => c.embedding && (c.embedding as number[]).length > 0);

  if (chunksWithEmbeddings.length === 0) {
    return filteredChunks.map(c => c.content).join("\n\n");
  }

  const queryEmbedding = await createEmbedding(query);
  if (queryEmbedding.length === 0) {
    return chunksWithEmbeddings.slice(0, topK).map(c => c.content).join("\n\n");
  }

  const relevant = retrieveRelevantChunks(queryEmbedding, chunksWithEmbeddings, topK);

  if (relevant.length === 0) {
    return chunksWithEmbeddings.slice(0, 3).map(c => c.content).join("\n\n");
  }

  return relevant
    .map(r => {
      const meta = r.chunk.metadata as Record<string, any>;
      const source = meta?.sourceName || "Knowledge Base";
      const kb = kbMetadata?.get(r.chunk.knowledgeBaseId);
      const attribution = formatKBAttribution(kb);
      const header = attribution
        ? `[${source}] ${attribution} (relevance: ${(r.score * 100).toFixed(0)}%):`
        : `[${source}] (relevance: ${(r.score * 100).toFixed(0)}%):`;
      return `${header}\n${r.chunk.content}`;
    })
    .join("\n\n---\n\n");
}
