/**
 * Seed knowledge_chunks dari knowledge_bases yang sudah ada
 * — Text chunking TANPA embedding (embedding = null)
 * — Embedding akan di-generate on-demand saat RAG query
 * — Idempotent: skip KB yang sudah punya chunks
 *
 * Cara pakai: npx tsx scripts/seed-knowledge-chunks.ts
 */
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const RAG_CHUNK_SIZE = 512;   // tokens (~2048 chars)
const RAG_CHUNK_OVERLAP = 64; // tokens (~256 chars)

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function chunkText(text: string, chunkSize = RAG_CHUNK_SIZE, overlap = RAG_CHUNK_OVERLAP): string[] {
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

async function main() {
  const client = await pool.connect();

  try {
    // Get KB entries that don't have chunks yet
    const { rows: kbEntries } = await client.query<{
      id: number; agent_id: number; name: string; content: string;
    }>(`
      SELECT kb.id, kb.agent_id, kb.name, kb.content
      FROM knowledge_bases kb
      WHERE kb.status = 'active'
        AND kb.content IS NOT NULL
        AND length(kb.content) > 50
        AND NOT EXISTS (
          SELECT 1 FROM knowledge_chunks kc WHERE kc.knowledge_base_id = kb.id
        )
      ORDER BY kb.id
    `);

    console.log(`\n🔪 Mulai chunking ${kbEntries.length} KB entries...\n`);

    let totalChunks = 0;
    let processed = 0;
    let failed = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < kbEntries.length; i += BATCH_SIZE) {
      const batch = kbEntries.slice(i, i + BATCH_SIZE);
      const allChunks: {
        kb_id: number; agent_id: number; chunk_index: number;
        content: string; token_count: number; source_name: string;
      }[] = [];

      for (const kb of batch) {
        const chunks = chunkText(kb.content);
        chunks.forEach((chunk, idx) => {
          allChunks.push({
            kb_id: kb.id,
            agent_id: kb.agent_id,
            chunk_index: idx,
            content: chunk,
            token_count: estimateTokens(chunk),
            source_name: kb.name,
          });
        });
      }

      if (allChunks.length === 0) continue;

      // Bulk insert
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIdx = 1;

      for (const c of allChunks) {
        placeholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, NOW())`
        );
        values.push(
          c.kb_id, c.agent_id, c.chunk_index, c.content, c.token_count,
          JSON.stringify({ sourceName: c.source_name, totalChunks: 0 })
        );
      }

      try {
        await client.query(`
          INSERT INTO knowledge_chunks
            (knowledge_base_id, agent_id, chunk_index, content, token_count, metadata, created_at)
          VALUES ${placeholders.join(", ")}
        `, values);

        totalChunks += allChunks.length;
        processed += batch.length;

        const pct = Math.round((i + BATCH_SIZE) / kbEntries.length * 100);
        console.log(`  ✅ KB #${batch[0].id}-#${batch[batch.length-1].id}: +${allChunks.length} chunks (${Math.min(pct, 100)}%)`);
      } catch (err: any) {
        console.error(`  ❌ Batch gagal:`, err.message);
        failed += batch.length;
      }
    }

    // Final stats
    const { rows: stats } = await client.query(`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT agent_id) as agents_covered,
        AVG(token_count) as avg_tokens,
        MAX(token_count) as max_tokens,
        COUNT(*) FILTER (WHERE embedding IS NULL OR embedding = 'null'::jsonb) as no_embedding
      FROM knowledge_chunks
    `);

    const { rows: kbCount } = await client.query('SELECT COUNT(*) as total FROM knowledge_bases');

    console.log("\n═══════════════════════════════════════════════════");
    console.log("✅ SELESAI — Knowledge Chunks Seeding");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Total KB entries      : ${kbCount[0].total}`);
    console.log(`KB entries diproses   : ${processed}`);
    console.log(`Total chunks created  : ${totalChunks}`);
    console.log(`Total chunks di DB    : ${stats[0].total_chunks}`);
    console.log(`Agen tercakup chunks  : ${stats[0].agents_covered}`);
    console.log(`Avg token per chunk   : ${Math.round(Number(stats[0].avg_tokens))}`);
    console.log(`Max token per chunk   : ${stats[0].max_tokens}`);
    console.log(`Chunks tanpa embedding: ${stats[0].no_embedding} (akan di-generate on-demand)`);
    if (failed > 0) console.log(`KB gagal diproses     : ${failed}`);
    console.log("═══════════════════════════════════════════════════\n");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
