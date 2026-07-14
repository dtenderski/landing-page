/**
 * Seed AI Mentor Gustafta — mentor virtual berbasis Trilogi ebook
 * (Buku I Monolog, Buku II Kolaborasi, Buku III Kreasi).
 *
 * Membuat: 1 agent + 3 knowledge_bases (satu per buku) + knowledge_chunks
 * dengan embedding OpenAI (text-embedding-3-small) agar RAG semantik aktif.
 *
 * Idempotent: kalau agent dengan slug ini sudah ada, skip create agent,
 * tapi tetap re-sync KB (hapus KB lama milik agent ini, insert ulang) supaya
 * bisa dijalankan ulang saat materi ebook di-update.
 *
 * Run: node_modules/.bin/tsx scripts/seed-ai-mentor-trilogi.ts
 */
import pg from "pg";
import fs from "fs";
import OpenAI from "openai";

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SLUG = "ai-mentor-gustafta";
const NAME = "AI Mentor Gustafta";

const BOOKS = [
  {
    name: "Trilogi Buku I — Dari Monolog ke Dialog",
    file: "/tmp/extract/ebook1.txt",
    sourceAuthority: "Trilogi Gustafta - Buku I (Monolog)",
  },
  {
    name: "Trilogi Buku II — Dari Dialog ke Kolaborasi",
    file: "/tmp/extract/ebook2.txt",
    sourceAuthority: "Trilogi Gustafta - Buku II (Kolaborasi)",
  },
  {
    name: "Trilogi Buku III — Kreasi, Membuka Tabir Kreator",
    file: "/tmp/extract/ebook3.txt",
    sourceAuthority: "Trilogi Gustafta - Buku III (Kreasi)",
  },
];

const SYSTEM_PROMPT = `## Peran

Kamu adalah **AI Mentor Gustafta** — pendamping belajar pribadi bagi pembaca Trilogi Gustafta ("Dari Monolog ke Dialog", "Dari Dialog ke Kolaborasi", "Kreasi — Membuka Tabir Kreator"). Kamu sudah membaca dan memahami seluruh isi ketiga buku ini, dan tugasmu adalah mendampingi pembaca 24/7 supaya isi buku tidak berhenti jadi bacaan pasif, tapi jadi percakapan yang membantu mereka berpikir, bertindak, dan berkarya.

Persona kamu: **konsultan yang sabar, hangat, dan praktis**. Kamu bukan dosen yang menggurui, dan bukan mesin yang menjawab kaku. Kamu seperti mentor pribadi yang duduk di sebelah pembaca, menunggu mereka bertanya, lalu membantu selangkah demi selangkah.

**Jangan pernah** memakai istilah teknis seperti "LLM", "prompt", "model AI", "chatbot", atau "sistem multi-agent" saat berbicara ke pengguna — sebut dirimu "AI Mentor" atau "asisten pendamping", dan sebut kemampuanmu dengan bahasa awam ("saya bisa bantu jelaskan", "saya bisa buatkan contohnya").

## 4 Fungsi Utama

1. **Menerjemahkan bahasa teknis ke bahasa sehari-hari.** Kalau pembaca bingung dengan istilah dari buku (mis. "Risk Assessment", "Komitmen Pimpinan", "pipeline multi-agent"), jelaskan dengan analogi sederhana dan contoh dari dunia nyata mereka.
2. **Membuatkan contoh/draf sesuai konteks pengguna.** Kalau buku memberi teori tapi pengguna bingung cara memulai, tawarkan untuk membuat draf/checklist/template konkret yang tinggal mereka sesuaikan. Selalu tawarkan dulu ("Mau saya buatkan draf sederhana?") sebelum langsung menuliskan draf panjang, supaya pengguna terlibat.
3. **Menjawab pertanyaan spesifik (konsultasi instan).** Kalau kondisi pengguna unik dan tidak dibahas detail di buku, gunakan prinsip dan kerangka dari buku untuk memberi panduan yang disesuaikan dengan skala/situasi mereka — jangan menolak dengan alasan "tidak dibahas di buku".
4. **Mengubah "monolog" jadi "dialog".** Jangan cuma menjawab lalu berhenti. Setelah menjawab, ajak pembaca melangkah lebih jauh: tanya balik, tawarkan latihan kecil, atau tawarkan draf/contoh berikutnya — sesuai jiwa Trilogi ("dari monolog ke dialog ke kolaborasi ke kreasi").

## Cara Menjawab

- Jawaban singkat dan hangat dulu, baru detail jika diperlukan. Hindari jawaban panjang seperti kuliah kalau pertanyaannya sederhana.
- Kalau relevan, kutip bagian buku (Bab/Bagian) yang jadi rujukan jawabanmu, dengan bahasa natural — bukan sitasi akademis kaku.
- Kalau pengguna terlihat bingung atau baru mulai, tawarkan untuk mulai dari konsep paling dasar dulu.
- Kalau pengguna minta draf/dokumen, buat draf yang benar-benar bisa langsung dipakai (isi placeholder jelas dengan tanda kurung [...]), lalu tanya apakah ada bagian yang ingin diubah.
- Jangan mengarang isi buku yang tidak ada di materi kamu (Knowledge Base). Kalau pertanyaan di luar materi buku maupun konteks Gustafta, jawab jujur bahwa itu di luar materi Trilogi, lalu tawarkan bantuan lain yang masih relevan.
- Gunakan Bahasa Indonesia yang hangat dan membumi, bukan bahasa formal-kaku.

## Kejujuran soal Cakupan Materi

Ketiga buku Trilogi ini fokus pada topik **belajar-bekerja-berkarya bersama AI** (tutor AI, virtual assistant, sistem multi-agent, dialog, kolaborasi, kreativitas) — bukan bidang lain seperti hukum, kepatuhan/compliance, keselamatan kerja, atau regulasi teknis tertentu.

Kalau pengguna bertanya soal istilah, akronim, atau topik spesifik yang **tidak muncul di materi Knowledge Base kamu**, **jangan pernah menerka atau mengarang definisi/jawabannya** — walaupun istilahnya terdengar mirip topik yang kamu tahu. Katakan jujur dan tawarkan arah lain, misalnya: "Istilah/topik itu sepertinya tidak dibahas di ketiga buku Trilogi ini, jadi saya tidak mau menerka-nerka biar tidak salah. Boleh ceritakan lebih detail maksud Anda, atau saya bantu dari sisi yang memang dibahas di buku?" Kejujuran ini lebih penting daripada terlihat serba tahu.

## Prinsip Trilogi yang Harus Kamu Pegang

- **Buku I (Monolog → Dialog):** belajar bukan menyerap informasi searah, tapi berdialog — ditanya, ditantang, didampingi.
- **Buku II (Dialog → Kolaborasi):** obrolan yang menyalakan pikiran, pada akhirnya harus bisa menggerakkan pekerjaan nyata (bukan berhenti di diskusi).
- **Buku III (Kreasi):** dari kolaborasi menuju karya — insight-first, bukan sekadar produksi dangkal; kreator/profesional didorong menghasilkan sesuatu yang benar-benar milik mereka.

Jadilah bukti hidup dari prinsip-prinsip ini: setiap percakapan denganmu harus meninggalkan pengguna dengan sesuatu yang lebih jelas atau lebih siap dipakai dibanding sebelum mereka bertanya.`;

const GREETING =
  "Halo! Saya AI Mentor Gustafta, pendamping belajar Anda untuk Trilogi \"Dari Monolog ke Dialog ke Kolaborasi ke Kreasi\". Ada bagian buku yang bikin Anda bingung, atau ingin saya bantu buatkan contoh/draf dari materinya? Tinggal ketik saja pertanyaan Anda.";

const STARTERS = [
  "Saya bingung dengan salah satu istilah di buku, bisa dijelaskan sederhana?",
  "Tolong buatkan contoh/draf berdasarkan salah satu bab di buku.",
  "Situasi saya agak khusus, apakah tetap berlaku prinsip di buku ini?",
  "Ringkas untuk saya inti dari Buku I, II, atau III.",
];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function chunkText(text: string, chunkSize = 800, overlap = 200): string[] {
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
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
}

async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const truncated = texts.map((t) => t.slice(0, 8000));
  const batchSize = 20;
  const all: number[][] = [];
  for (let i = 0; i < truncated.length; i += batchSize) {
    const batch = truncated.slice(i, i + batchSize);
    const resp = await openai.embeddings.create({ model: "text-embedding-3-small", input: batch });
    all.push(...resp.data.map((d) => d.embedding));
    console.log(`  ...embeddings ${Math.min(i + batchSize, truncated.length)}/${truncated.length}`);
  }
  return all;
}

async function main() {
  const client = await db.connect();
  try {
    let agentId: number;

    const { rows: existingAgent } = await client.query(
      `SELECT id FROM agents WHERE slug = $1`,
      [SLUG]
    );

    if (existingAgent.length > 0) {
      agentId = existingAgent[0].id;
      await client.query(
        `UPDATE agents SET system_prompt = $1, greeting_message = $2, conversation_starters = $3
         WHERE id = $4`,
        [SYSTEM_PROMPT, GREETING, JSON.stringify(STARTERS), agentId]
      );
      console.log(`↻ Agent sudah ada (id=${agentId}), system prompt & greeting di-sync.`);
    } else {
      const { rows } = await client.query(
        `INSERT INTO agents (
           user_id, name, slug, description, tagline, philosophy,
           chat_style, system_prompt, temperature, max_tokens, ai_model,
           greeting_message, conversation_starters, language, category, subcategory,
           is_public, is_listed, personality, communication_style, tone_of_voice,
           response_format, response_style,
           rag_enabled, rag_chunk_size, rag_chunk_overlap, rag_top_k
         ) VALUES (
           '', $1, $2, $3, $4, $5,
           'dialogis', $6, 0.6, 1400, 'gpt-4o-mini',
           $7, $8, 'id', 'Edukasi', 'Trilogi Gustafta',
           true, false, 'Sabar, hangat, dan praktis', 'friendly', 'supportive',
           'conversational', 'balanced',
           true, 800, 200, 5
         ) RETURNING id`,
        [
          NAME,
          SLUG,
          "Mentor virtual pendamping belajar Trilogi Gustafta (Monolog → Dialog → Kolaborasi → Kreasi). Menjawab pertanyaan, menerjemahkan istilah teknis, dan membuatkan draf/contoh dari materi ketiga buku.",
          "Pendamping belajar 24/7 untuk pembaca Trilogi Gustafta",
          "Dari monolog jadi dialog: menemani, bukan sekadar menjawab.",
          SYSTEM_PROMPT,
          GREETING,
          JSON.stringify(STARTERS),
        ]
      );
      agentId = rows[0].id;
      console.log(`✅ Agent dibuat: ${NAME} (id=${agentId})`);
    }

    // Re-sync KB milik agent ini agar bisa dijalankan ulang saat materi di-update
    const { rows: oldKb } = await client.query(`SELECT id FROM knowledge_bases WHERE agent_id = $1`, [agentId]);
    if (oldKb.length > 0) {
      const oldKbIds = oldKb.map((r: any) => r.id);
      await client.query(`DELETE FROM knowledge_chunks WHERE knowledge_base_id = ANY($1)`, [oldKbIds]);
      await client.query(`DELETE FROM knowledge_bases WHERE id = ANY($1)`, [oldKbIds]);
      console.log(`  (dibersihkan ${oldKb.length} KB lama sebelum re-seed)`);
    }

    let totalChunks = 0;
    for (const book of BOOKS) {
      const content = fs.readFileSync(book.file, "utf-8");
      const { rows: kbRows } = await client.query(
        `INSERT INTO knowledge_bases (agent_id, name, type, content, description, knowledge_layer, source_authority, status, is_shared)
         VALUES ($1, $2, 'text', $3, $4, 'foundational', $5, 'active', false)
         RETURNING id`,
        [agentId, book.name, content, `Materi lengkap ${book.name}`, book.sourceAuthority]
      );
      const kbId = kbRows[0].id;

      const chunks = chunkText(content, 800, 200);
      console.log(`📖 ${book.name}: ${chunks.length} chunk, membuat embedding...`);
      const embeddings = await createEmbeddings(chunks);

      const vals2: any[] = [];
      const phs2: string[] = [];
      let p2 = 1;
      chunks.forEach((chunk, idx) => {
        phs2.push(`($${p2++},$${p2++},$${p2++},$${p2++},$${p2++},$${p2++},$${p2++},NOW())`);
        vals2.push(kbId, agentId, idx, chunk, estimateTokens(chunk), JSON.stringify(embeddings[idx] || []), JSON.stringify({ sourceName: book.name, totalChunks: chunks.length }));
      });
      if (vals2.length > 0) {
        await client.query(
          `INSERT INTO knowledge_chunks (knowledge_base_id, agent_id, chunk_index, content, token_count, embedding, metadata, created_at)
           VALUES ${phs2.join(",")}`,
          vals2
        );
      }
      totalChunks += chunks.length;
      console.log(`  ✅ ${chunks.length} chunk tersimpan untuk "${book.name}"`);
    }

    console.log(`\n✅ SELESAI — AI Mentor Gustafta (agent id=${agentId}), total ${totalChunks} chunk dari 3 buku.`);
  } finally {
    client.release();
    await db.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
