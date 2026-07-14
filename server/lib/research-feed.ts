import * as cheerio from "cheerio";
import OpenAI from "openai";
import { storage } from "../storage";
import { processKnowledgeBaseForRAG } from "./rag-service";

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH FEED — memberi "mata" nyata kepada tim riset.
// Dua tujuan:
//   (1) MEMPERKUAT PRODUK: pantau isu/regulasi/pain point domain 80 claw premium.
//   (2) MEMPERKUAT PASAR:  pantau tren iklan & produk viral (TikTok/Facebook/e-commerce).
// Sumber feed: Google News RSS (agregasi berita publik, GRATIS, tanpa API key).
// Hasil di-ingest ke Knowledge Base agen riset sehingga terambil saat chat (RAG).
// Jujur-by-design: ini agregasi berita publik, BUKAN scraping sosmed real-time.
// Riset mendalam Facebook Ad Library / TikTok Shop = manual/tool berbayar → agen
// dibekali "Panduan Metode Riset" (playbook langkah demi langkah) sebagai KB statis.
// ─────────────────────────────────────────────────────────────────────────────

export const RESEARCH_LOCAL_SLUG = "riset-viral-lokal";
export const RESEARCH_GLOBAL_SLUG = "riset-tren-global";
export const RESEARCH_MARKET_SLUG = "riset-iklan-pasar";

const FEED_KB_PREFIX = "Feed Riset";
const METHOD_KB_PREFIX = "Panduan Metode Riset";
const AD_KB_PREFIX = "Materi Iklan Harian";
const AD_PLATFORM_KB_PREFIX = "Panduan Platform Iklan";
const RETENTION_KB_PREFIX = "Sequence Retensi Harian";
const FOUNDATION_KB_PREFIX = "Fondasi Gustafta";
const CLOSING_KB_PREFIX = "Amunisi Jualan Harian";
const SALES_PLAYBOOK_KB_PREFIX = "Fondasi Penjualan";

// Agen "Pembuat Materi Iklan" — mengubah temuan riset harian jadi materi iklan siap pakai.
export const AD_MATERIAL_SLUG = "mkt-materi-iklan";
// Agen "Perawatan Pelanggan" — susun email/WA sequence retensi dari output marketing + fondasi.
export const RETENTION_SLUG = "mkt-retensi-sequence";
// Agen "Asisten Closing" — bantu menutup penjualan: jawab keberatan + skrip WA + follow-up prospek.
export const CLOSING_SLUG = "mkt-closing-asisten";

// Client OpenAI lokal (pola sama dgn rag-service): dipakai untuk generate materi iklan.
let _adOpenai: OpenAI | null = null;
function getAdOpenAI(): OpenAI | null {
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_adOpenai) _adOpenai = new OpenAI({ apiKey: key });
  return _adOpenai;
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  snippet: string;
}

export interface TopicGroup {
  query: string;
  items: NewsItem[];
}

/** Topik boleh string sederhana, atau objek dengan locale sendiri (untuk campur nasional+global). */
export type TopicSpec = string | { q: string; hl?: string; gl?: string };

export interface FeedStream {
  slug: string;
  /** Label KB + judul dokumen. */
  docTitle: string;
  kbLabel: string;
  defaultHl: string;
  defaultGl: string;
  topics: TopicSpec[];
  perTopic?: number;
}

// ── Konfigurasi stream feed (sumber tunggal) ────────────────────────────────
export const FEED_STREAMS: FeedStream[] = [
  {
    // (1) PENGUATAN PRODUK — domain 80 claw premium (konstruksi/sertifikasi/legal/bisnis).
    slug: RESEARCH_LOCAL_SLUG,
    docTitle: "Isu & Pain Point Produk (Indonesia)",
    kbLabel: "Produk Lokal (Indonesia)",
    defaultHl: "id",
    defaultGl: "ID",
    topics: [
      "tender konstruksi pengadaan LKPP Indonesia",
      "sertifikasi badan usaha SBU konstruksi terbaru",
      "sertifikat kompetensi kerja SKK konstruksi",
      "regulasi K3 keselamatan konstruksi proyek",
      "perizinan berusaha OSS konstruksi PP 28 2025",
      "ISO 9001 14001 SMK3 SMAP sertifikasi perusahaan",
      "developer properti real estate Indonesia regulasi",
      "UMKM digitalisasi AI chatbot bisnis Indonesia",
    ],
  },
  {
    // (2) SINYAL GLOBAL — teknologi & AI yang bisa diadaptasi ke produk.
    slug: RESEARCH_GLOBAL_SLUG,
    docTitle: "Tren Global / Teknologi & AI",
    kbLabel: "Global (Luar Negeri)",
    defaultHl: "en",
    defaultGl: "US",
    topics: [
      "AI agents for small business",
      "vertical AI SaaS startup",
      "AI automation compliance certification",
      "construction technology AI",
      "no-code AI assistant builder",
      "AI chatbot customer service trends",
    ],
  },
  {
    // (3) PENGUATAN PASAR — riset iklan & produk viral (nasional + global).
    slug: RESEARCH_MARKET_SLUG,
    docTitle: "Riset Iklan, Viral & Pasar",
    kbLabel: "Iklan & Pasar (Nasional + Global)",
    defaultHl: "id",
    defaultGl: "ID",
    topics: [
      "produk viral TikTok Shop Indonesia",
      "tren iklan Facebook Ads Indonesia",
      "strategi konten viral pemasaran digital UMKM Indonesia",
      "tren jualan online marketplace Indonesia",
      { q: "viral marketing trends", hl: "en", gl: "US" },
      { q: "TikTok Shop trending products", hl: "en", gl: "US" },
      { q: "Facebook ad library winning ads", hl: "en", gl: "US" },
    ],
  },
];

/**
 * Ambil berita dari Google News RSS untuk sebuah query.
 * hl = bahasa, gl = negara, ceid = country:lang.
 */
export async function fetchGoogleNews(
  query: string,
  opts: { hl?: string; gl?: string; limit?: number } = {},
): Promise<NewsItem[]> {
  const hl = opts.hl ?? "id";
  const gl = opts.gl ?? "ID";
  const ceid = `${gl}:${hl}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=${hl}&gl=${gl}&ceid=${encodeURIComponent(ceid)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; GustaftaResearch/1.0; +https://gustafta.com)",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Google News RSS ${res.status}`);

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: NewsItem[] = [];

  $("item").each((_i, el) => {
    const $el = $(el);
    const title = $el.find("title").first().text().trim();
    const link = $el.find("link").first().text().trim();
    const pubDate = $el.find("pubDate").first().text().trim();
    const source = $el.find("source").first().text().trim();
    const descHtml = $el.find("description").first().text();
    let snippet = "";
    try {
      snippet = cheerio.load(descHtml || "").text().replace(/\s+/g, " ").trim();
    } catch {
      snippet = (descHtml || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    if (title) {
      items.push({ title, link, source, pubDate, snippet: snippet.slice(0, 280) });
    }
  });

  return items.slice(0, opts.limit ?? 8);
}

/** Susun dokumen teks terstruktur dari kumpulan grup topik. */
function formatNewsDoc(label: string, groups: TopicGroup[]): string {
  const stamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const lines: string[] = [];
  lines.push(`FEED RISET — ${label}`);
  lines.push(`Diperbarui: ${stamp} WIB`);
  lines.push(
    "Sumber: Google News RSS (agregasi berita publik). Ini BUKAN pemantauan sosmed real-time.",
  );
  lines.push(
    "Gunakan sebagai sinyal awal; tandai angka/klaim yang belum terverifikasi dengan [ASUMSI: ... | basis: ... | verifikasi-ke: ...].",
  );
  lines.push("");

  for (const g of groups) {
    lines.push(`## Topik: ${g.query}`);
    if (g.items.length === 0) {
      lines.push("(tidak ada hasil)");
      lines.push("");
      continue;
    }
    g.items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.title}`);
      const meta = [it.source, it.pubDate].filter(Boolean).join(" | ");
      if (meta) lines.push(`   Sumber: ${meta}`);
      if (it.snippet) lines.push(`   Ringkas: ${it.snippet}`);
      if (it.link) lines.push(`   Tautan: ${it.link}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Ingest dokumen feed ke KB milik satu agen.
 * Prune dulu feed lama (HANYA KB ber-prefix "Feed Riset") agar selalu segar & ringkas,
 * lalu buat KB baru + chunk (RAG). KB lain (mis. "Panduan Metode Riset" & unggahan user)
 * TIDAK tersentuh. Aman tanpa OPENAI (fallback concat di searchKnowledgeBase).
 */
export async function ingestNewsForAgent(
  agentId: number,
  label: string,
  doc: string,
): Promise<number> {
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");

  await db.execute(sql`
    DELETE FROM knowledge_chunks
    WHERE knowledge_base_id IN (
      SELECT id FROM knowledge_bases
      WHERE agent_id = ${agentId} AND name LIKE ${FEED_KB_PREFIX + "%"}
    )
  `);
  await db.execute(sql`
    DELETE FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${FEED_KB_PREFIX + "%"}
  `);

  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${FEED_KB_PREFIX} — ${label} (${new Date().toISOString().slice(0, 10)})`,
    type: "text",
    content: doc,
    description: "Auto-generated research feed (Google News RSS)",
    extractedText: doc,
    sourceUrl: "https://news.google.com",
    sourceAuthority: "Google News (agregator berita publik)",
    status: "active",
  });

  const chunks = await processKnowledgeBaseForRAG(
    parseInt(kb.id),
    agentId,
    doc,
    kb.name,
  );
  if (chunks.length > 0) {
    await storage.createChunks(chunks);
  }
  return chunks.length;
}

// ── Panduan Metode Riset (KB statis, playbook FB Ad Library + TikTok Shop) ────
function buildMethodLibraryDoc(): string {
  return `PANDUAN METODE RISET — Iklan, Produk Viral & Pasar
Dokumen ini adalah PLAYBOOK cara melakukan riset pasar mendalam. Dipakai bersama
Feed Riset harian (berita otomatis). Jujur: data langsung dari Facebook Ad Library &
TikTok umumnya via akses manual atau tool berbayar — bagian di bawah memandu langkahnya.

════════════════════════════════════════════════════════════════════
BAGIAN A — FACEBOOK / META AD LIBRARY (gratis, publik)
════════════════════════════════════════════════════════════════════
Apa: Perpustakaan iklan publik Meta — semua iklan aktif yang berjalan di Facebook &
Instagram bisa dilihat siapa saja. URL: https://www.facebook.com/ads/library
Referensi metode: https://www.revou.co/panduan-teknis/cara-melakukan-riset-untuk-facebook-ads-menggunakan-facebook-ad-library

Langkah riset kompetitor & iklan:
1. Buka Ad Library → pilih negara "Indonesia" → kategori "Semua iklan".
2. Cari nama kompetitor / kata kunci produk (mis. "sertifikasi SBU", "chatbot bisnis").
3. Lihat iklan yang AKTIF: makin lama sebuah iklan berjalan (cek tanggal mulai), makin
   besar kemungkinan iklan itu "menang" (profitable) → tiru pola angle/creative-nya.
4. Analisis: hook 3 detik pertama, format (video/gambar/carousel), penawaran (diskon/bonus),
   call-to-action, dan halaman tujuan (landing page).
5. Catat pola yang berulang antar kompetitor = formula pasar yang sudah terbukti.

Sinyal "iklan pemenang": banyak variasi creative dari 1 pengiklan, iklan berjalan >2-3
minggu, dan copy yang menyasar pain point spesifik.

Untuk otomasi penuh: butuh Meta Ad Library API (akses token + review aplikasi). Cakupan
iklan komersial non-politik di Indonesia terbatas lewat API → riset manual lebih andal.

════════════════════════════════════════════════════════════════════
BAGIAN B — TIKTOK: PRODUK & KONTEN VIRAL
════════════════════════════════════════════════════════════════════
Referensi tool riset produk TikTok Shop: https://www.bigseller.com/blog/articleDetails/4496/tools-tiktok-shop-riset-produk.htm

Sumber gratis:
1. TikTok Creative Center (https://ads.tiktok.com/business/creativecenter) — tren hashtag,
   lagu, dan iklan populer per negara (Indonesia). Gratis, tanpa iklan berbayar.
2. Pencarian TikTok: cari kata kunci niche → urutkan "Suka/Views" → catat video dengan
   engagement tertinggi (viral).
3. TikTok Shop: lihat kategori "Terlaris" / "Flash Sale" untuk produk yang sedang naik.

Yang dicatat: produk yang muncul berulang, hook video, gaya konten (review/demo/storytelling),
harga, dan volume komentar (indikasi minat).

Tool berbayar (opsional, lebih dalam): BigSeller, Kalodata, EchoTik, Shoplus — untuk data
penjualan/estimasi omzet. Bukan keharusan untuk mulai.

════════════════════════════════════════════════════════════════════
BAGIAN C — CARA PAKAI UNTUK GUSTAFTA
════════════════════════════════════════════════════════════════════
PENGUATAN PRODUK (80 claw premium): temuan pain point domain (konstruksi/sertifikasi/legal)
→ usulan claw mana yang perlu diperkuat / fitur baru / claw baru.
PENGUATAN PASAR: temuan angle iklan & produk viral → usulan sudut kampanye, hook konten,
dan penawaran untuk menjual chatbot premium & jasa Gustafta.

Selalu bedakan FAKTA (dari sumber) vs ASUMSI. Tandai asumsi:
[ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak}].`;
}

/**
 * Pastikan agen "riset-iklan-pasar" punya KB playbook metode riset (idempoten).
 * KB ini STATIS & TIDAK ikut ter-prune oleh sweep harian (prefix beda dari feed).
 * Embedding dibuat di sini (dijalankan di server env yang punya OpenAI key).
 */
export async function ensureResearchMethodLibrary(agentId: number): Promise<{ created: boolean; chunks: number }> {
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");

  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${METHOD_KB_PREFIX + "%"}
    LIMIT 1
  `);
  const rows = (existing as any).rows ?? existing;
  if (Array.isArray(rows) && rows.length > 0) {
    return { created: false, chunks: 0 };
  }

  const doc = buildMethodLibraryDoc();
  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${METHOD_KB_PREFIX} — Iklan & Pasar`,
    type: "text",
    content: doc,
    description: "Playbook riset FB Ad Library & TikTok (statis)",
    extractedText: doc,
    sourceUrl: "https://www.facebook.com/ads/library",
    sourceAuthority: "Playbook internal Gustafta (metode riset)",
    status: "active",
  });

  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) {
    await storage.createChunks(chunks);
  }
  return { created: true, chunks: chunks.length };
}

// ── Panduan Platform Iklan (spesifikasi format + cara beriklan per platform) ──
function buildAdPlatformLibraryDoc(): string {
  return `PANDUAN PLATFORM IKLAN — Spesifikasi Format & Cara Beriklan
Dokumen referensi untuk menyelaraskan materi iklan dengan tiap platform + langkah memasang
iklannya. Jujur: spesifikasi & antarmuka platform BISA BERUBAH sewaktu-waktu — selalu
verifikasi angka final di dashboard resmi masing-masing platform sebelum eksekusi.

════════════════════════════════════════════════════════════
BAGIAN A — SPESIFIKASI FORMAT (rasio, durasi, batas teks)
════════════════════════════════════════════════════════════
• TIKTOK — Video 9:16 vertikal (1080x1920). Durasi ideal 9-15 detik (boleh s/d 60 detik).
  Hook 3 detik pertama WAJIB kuat. Gaya native/UGC (seperti konten organik), bukan iklan kaku.
  Caption pendek + hashtag relevan. Suara/lagu tren menambah jangkauan.
• INSTAGRAM — Reels/Story: 9:16 (1080x1920), Reels s/d 90 detik. Feed: 1:1 (1080x1080) atau
  4:5 (1080x1350). Caption s/d 2200 karakter tetapi ~125 karakter pertama yang paling terlihat.
  Visual estetik + hook teks di frame pertama.
• FACEBOOK — Feed: gambar 1.91:1 (1200x628) atau 1:1 (1080x1080). Primary text ideal ~125
  karakter, headline ~40 karakter, deskripsi ~30 karakter. Reels/Story 9:16. Cocok untuk
  penawaran + tombol CTA (Pelajari/Kirim Pesan/WhatsApp).
• YOUTUBE — In-stream skippable 16:9 (hook WAJIB di 5 detik pertama sebelum tombol Skip
  muncul). Bumper 6 detik (tak bisa di-skip, untuk awareness singkat). Shorts 9:16. CTA jelas
  di akhir + deskripsi.
• (Opsional) GOOGLE SEARCH — Iklan teks: hingga 15 headline (30 karakter) + 4 deskripsi (90
  karakter). Menangkap orang yang SUDAH mencari (niat beli tinggi), mis. "jasa sertifikasi SBU".
• (Opsional) LINKEDIN — B2B, cocok untuk segmen profesional/kontraktor/perusahaan. Single
  image 1200x627, ~150 karakter teks yang terlihat. Targeting berbasis jabatan/industri.
• (Opsional) WHATSAPP — Bukan iklan mandiri; jadi TUJUAN klik dari FB/IG ("Click-to-WhatsApp").
  Siapkan pesan pembuka + katalog.

════════════════════════════════════════════════════════════
BAGIAN B — CARA BERIKLAN PER PLATFORM (langkah ringkas)
════════════════════════════════════════════════════════════
[TIKTOK] TikTok Ads Manager (ads.tiktok.com). Buat akun bisnis → Campaign (tujuan: Traffic/
  Lead) → Ad Group (targeting: lokasi Indonesia, usia, minat) → set budget harian kecil dulu
  untuk tes → unggah 3-5 variasi video (hook beda) → gunakan TikTok Creative Center untuk
  riset lagu/tren. Matikan yang boros, gandakan yang menang.
[INSTAGRAM + FACEBOOK] Keduanya satu pintu: Meta Ads Manager (business.facebook.com).
  Hubungkan Halaman FB + akun IG → Campaign (tujuan) → Ad Set (targeting rinci: lokasi, minat,
  perilaku; retargeting via Meta Pixel) → pilih penempatan (Feed/Reels/Story) → budget →
  pasang creative. Pasang Meta Pixel di landing page untuk melacak konversi. A/B test creative.
[YOUTUBE] Lewat Google Ads (ads.google.com); video diunggah ke YouTube dulu. Campaign tipe
  Video → targeting (demografi, minat, kata kunci, penempatan) → pilih format (skippable
  in-stream / bumper) → budget. Pastikan hook sebelum detik ke-5 + CTA di akhir.
[GOOGLE SEARCH] Google Ads → Search campaign → susun kata kunci niat beli → tulis headline/
  deskripsi → arahkan ke landing page yang relevan. Bagus untuk menangkap permintaan aktif.
[LINKEDIN] Campaign Manager LinkedIn → objective → targeting jabatan/industri/ukuran
  perusahaan → single image/video → budget. Biaya per klik cenderung lebih mahal, tetapi
  audiens profesional lebih tersasar.

════════════════════════════════════════════════════════════
BAGIAN C — ATURAN UNTUK GUSTAFTA
════════════════════════════════════════════════════════════
• JANGAN pakai 1 creative untuk semua platform — sesuaikan rasio, durasi, dan gaya per platform.
• Mulai budget kecil untuk menguji, skalakan hanya yang terbukti. Keputusan spend = FOUNDER
  (◆ gerbang manusia).
• Tandai klaim/angka yang belum terverifikasi dengan [ASUMSI: {nilai} | basis: {sumber} |
  verifikasi-ke: {pihak}].`;
}

/**
 * Pastikan agen Pembuat Materi Iklan punya KB panduan platform (idempoten, statis).
 * Prefix beda dari feed & materi harian → TIDAK ikut ter-prune.
 */
export async function ensureAdPlatformLibrary(agentId: number): Promise<{ created: boolean; chunks: number }> {
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");

  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${AD_PLATFORM_KB_PREFIX + "%"}
    LIMIT 1
  `);
  const rows = (existing as any).rows ?? existing;
  if (Array.isArray(rows) && rows.length > 0) {
    return { created: false, chunks: 0 };
  }

  const doc = buildAdPlatformLibraryDoc();
  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${AD_PLATFORM_KB_PREFIX} — Format & Cara Beriklan`,
    type: "text",
    content: doc,
    description: "Spesifikasi format + cara beriklan per platform (statis)",
    extractedText: doc,
    sourceUrl: "",
    sourceAuthority: "Playbook internal Gustafta (platform iklan)",
    status: "active",
  });

  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) {
    await storage.createChunks(chunks);
  }
  return { created: true, chunks: chunks.length };
}

/**
 * Ubah temuan riset harian menjadi MATERI IKLAN siap pakai (selaras format tiap platform),
 * lalu simpan sebagai KB (prefix "Materi Iklan Harian") pada agen Pembuat Materi Iklan →
 * terambil saat chat. Aman: bila tak ada OpenAI key, lewati tanpa error. Prune materi lama.
 */
export async function generateDailyAdMaterials(
  agentId: number,
  researchContext: string,
): Promise<{ generated: boolean; chunks: number; reason?: string; content?: string }> {
  const client = getAdOpenAI();
  if (!client) return { generated: false, chunks: 0, reason: "no-openai-key" };
  if (!researchContext.trim()) return { generated: false, chunks: 0, reason: "no-research" };

  const agent = await storage.getAgent(String(agentId));
  const persona = agent?.systemPrompt || "Kamu Pembuat Materi Iklan Gustafta.";
  const model =
    agent?.aiModel &&
    !agent.aiModel.startsWith("deepseek") &&
    !agent.aiModel.startsWith("qwen") &&
    !agent.aiModel.startsWith("gemini") &&
    agent.aiModel !== "custom"
      ? agent.aiModel
      : "gpt-4o";
  const today = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full" });

  const platformDoc = buildAdPlatformLibraryDoc();

  const userPrompt = `Tanggal: ${today}

Berikut TEMUAN RISET TERBARU hari ini (agregasi berita publik) dan PANDUAN PLATFORM IKLAN.
Ubah menjadi materi iklan siap pakai untuk produk Gustafta, DISELARASKAN dengan format tiap
platform. Tandai klaim belum terverifikasi dengan [ASUMSI: ... | basis: ... | verifikasi-ke: ...].

FORMAT KELUARAN (ikuti persis):
1) INTI KREATIF — 2-3 sudut (angle) iklan dari temuan riset. Tiap sudut: nama sudut + pain
   point/temuan yang jadi dasarnya + pesan utama.
2) ADAPTASI PER PLATFORM — untuk SETIAP platform berikut, adaptasikan sudut terkuat sesuai
   spesifikasinya (rasio, durasi, batas karakter):
   - TIKTOK (9:16, 9-15 dtk): hook 3 detik, skrip video singkat, caption + hashtag.
   - INSTAGRAM (Reels 9:16 & Feed 1:1/4:5): hook frame pertama, caption (~125 kar. pertama kuat), CTA.
   - FACEBOOK (Feed 1.91:1/1:1): primary text ~125 kar., headline ~40 kar., deskripsi ~30 kar., CTA.
   - YOUTUBE (in-stream 16:9 + Shorts 9:16): hook sebelum detik ke-5, skrip 15-20 dtk, CTA akhir.
   (Sebutkan juga konsep visual singkat per platform.)
3) CARA BERIKLAN — langkah ringkas memasang iklan di tiap platform (Ads Manager mana, targeting,
   budget tes kecil dulu) + pengingat bahwa keputusan spend = founder (◆ gerbang manusia).

===== TEMUAN RISET =====
${researchContext.slice(0, 6000)}
===== SELESAI =====

===== PANDUAN PLATFORM IKLAN (rujuk spesifikasi ini) =====
${platformDoc}
===== SELESAI =====`;

  let content = "";
  try {
    const resp = await client.chat.completions.create(
      {
        model,
        temperature: 0.7,
        max_tokens: 3500,
        messages: [
          { role: "system", content: persona },
          { role: "user", content: userPrompt },
        ],
      },
      { timeout: 60000 },
    );
    content = resp.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    return { generated: false, chunks: 0, reason: (e as Error).message };
  }
  if (!content) return { generated: false, chunks: 0, reason: "empty" };

  const stamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const doc = `MATERI IKLAN HARIAN — Gustafta
Dibuat otomatis: ${stamp} WIB
Dasar: temuan riset harian (Google News RSS, agregasi berita publik). Tandai [ASUMSI:...] untuk klaim belum terverifikasi. Publikasi/spend iklan = keputusan founder (gerbang manusia).

${content}`;

  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`
    DELETE FROM knowledge_chunks
    WHERE knowledge_base_id IN (
      SELECT id FROM knowledge_bases
      WHERE agent_id = ${agentId} AND name LIKE ${AD_KB_PREFIX + "%"}
    )
  `);
  await db.execute(sql`
    DELETE FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${AD_KB_PREFIX + "%"}
  `);

  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${AD_KB_PREFIX} — ${new Date().toISOString().slice(0, 10)}`,
    type: "text",
    content: doc,
    description: "Materi iklan harian dari temuan riset (auto-generated)",
    extractedText: doc,
    sourceUrl: "",
    sourceAuthority: "Pembuat Materi Iklan Gustafta (AI, dari feed riset)",
    status: "active",
  });

  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) {
    await storage.createChunks(chunks);
  }
  return { generated: true, chunks: chunks.length, content: doc };
}

/**
 * Dokumen FONDASI GUSTAFTA — visi (AI Organization Builder), Trilogi "Dari Monolog
 * ke Dialog", serta produk & jasa. Jadi sumber kebenaran agar setiap sequence retensi
 * selaras dengan positioning & penawaran. Statis (bukan LLM); spesifik & jujur.
 */
export function buildGustaftaFoundationDoc(): string {
  return `FONDASI GUSTAFTA — Visi, Trilogi, Produk & Jasa
Sumber kebenaran untuk menyusun komunikasi ke pelanggan. Selaraskan setiap pesan dengan ini.

═══ VISI: AI ORGANIZATION BUILDER ═══
Gustafta mengubah PENGETAHUAN MANUSIA menjadi ORGANISASI AI yang mampu BERPIKIR, BERKOLABORASI,
MENGHASILKAN KARYA, dan MEMBANGUN BISNIS BERKELANJUTAN. Bukan sekadar "alat bikin chatbot" —
tapi cara merakit tim AI Anda sendiri.
Positioning "arms dealer": Gustafta MEMPERSENJATAI pelaku usaha (kontraktor, konsultan, biro jasa,
asosiasi, profesional, UMKM) dengan AI — BUKAN menggantikan atau menyaingi mereka. Konten domain
(legalitas, tender/LKPP, SBU/SKK, K3, ISO) = BUKTI/contoh, BUKAN lini jasa yang kita jual.

═══ TRILOGI "DARI MONOLOG KE DIALOG" ═══
Buku edukasi yang jadi jembatan pemikiran menuju platform. Untuk karyawan, profesional, &
calon pensiunan. Inti: berhenti bekerja sendirian (monolog), mulai berkolaborasi dengan AI (dialog).
- Buku I — fondasi berpikir bersama AI; individu naik level dari operator menjadi pengarah.
- Buku II — KOLABORASI: model tim hybrid manusia+AI. Pola inti: Manusia beri niat & batas → Tim Agen
  kerjakan yang repetitif → kembalikan waktu → ◆ GERBANG MANUSIA untuk keputusan → hasil berlipat.
  7 prinsip: mulai dari yang repetitif; agen harus punya "suara" yang mengenal Anda; gerbang manusia
  wajib untuk keputusan soal manusia/uang besar/aksi tak-terbalikkan; 3 agen cukup di awal; log +
  ringkasan otomatis; eskalasi jujur; metrik baru = waktu kembali & penilaian naik (bukan jam kerja).
- Buku III — penerapan/keberlanjutan: dari kolaborasi ke membangun bisnis/organisasi AI.
Harga: Buku I Rp245.000 · Bundle 3 buku Rp499.000 (early bird; normal Rp945.000).

═══ PRODUK & JASA ═══
3 jalur dapat chatbot: (a) Chatbot Biasa (rakit sendiri) = lisensi standar + bulanan ·
(b) Chatbot Premium (siap pakai) = lisensi premium + bulanan · (c) Jasa Order (custom) = setup
sekali (termasuk lisensi) + bulanan. Biaya bulanan hosting+token berlaku untuk SEMUA produk.
4 tier langganan: Starter → Profesional → Bisnis → Enterprise (naik tier = naik kuota + chatbot
premium + Mini Apps). Starter Kit Rp245.000 (sekali) = onboarding lintas-tier (lisensi + panduan +
trial 7 hari), BUKAN tier. Kelas Premium lisensi: K1 Rp1jt · K2 Rp2,5jt · K3 Rp5jt · K4 Rp10jt.
Program Creator (marketplace): bagi hasil 80% Creator / 20% Gustafta dihitung dari biaya LISENSI saja.
Kemampuan platform: 900+ agen, tim AI kolaboratif (orkestrasi sub-agen), Mini Apps, AI Tools
(RAB Kalkulator, K3 Vision), Store/template.

═══ ATURAN KOMUNIKASI ═══
- Bahasa Indonesia hangat & personal — seperti mengenal pelanggan, bukan korporat kaku.
- Jangan janji hasil pasti / ROI fiktif. Statistik hanya konteks umum bersumber, bukan janji produk.
- ◆ GERBANG MANUSIA: pengiriman email/WA final diputuskan founder. Agen hanya menyiapkan draf.
- Tandai klaim belum terverifikasi: [ASUMSI: ... | basis: ... | verifikasi-ke: ...].`;
}

/**
 * Seed FONDASI GUSTAFTA sebagai KB pada agen retensi (idempoten by prefix).
 * Prune-scope terpisah — tidak tersentuh cleanup feed/materi iklan/sequence harian.
 */
export async function ensureRetentionFoundationLibrary(
  agentId: number,
): Promise<{ created: boolean; chunks: number }> {
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${FOUNDATION_KB_PREFIX + "%"}
    LIMIT 1
  `);
  if ((existing.rows?.length ?? 0) > 0) return { created: false, chunks: 0 };

  const doc = buildGustaftaFoundationDoc();
  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${FOUNDATION_KB_PREFIX} — Visi, Trilogi, Produk & Jasa`,
    type: "text",
    content: doc,
    description: "Fondasi kanonik Gustafta (visi, Trilogi, produk/jasa) untuk komunikasi pelanggan",
    extractedText: doc,
    sourceUrl: "",
    sourceAuthority: "Gustafta (kanonik)",
    status: "active",
  });
  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) await storage.createChunks(chunks);
  return { created: true, chunks: chunks.length };
}

/**
 * Agen "Perawatan Pelanggan" menyusun SEQUENCE RETENSI harian (email + WhatsApp) untuk
 * memelihara hubungan berkelanjutan dgn pelanggan. Bahan: konteks marketing hari ini
 * (materi iklan/riset) + FONDASI GUSTAFTA (visi, Trilogi, produk/jasa). Disimpan sebagai KB
 * dgn prune-scope sendiri. Pengiriman = ◆ gerbang manusia (founder), bukan auto-kirim.
 */
export async function generateDailyRetentionSequence(
  agentId: number,
  marketingContext: string,
): Promise<{ generated: boolean; chunks: number; reason?: string }> {
  const client = getAdOpenAI();
  if (!client) return { generated: false, chunks: 0, reason: "no-openai-key" };

  const agent = await storage.getAgent(String(agentId));
  const persona = agent?.systemPrompt || "Kamu Perawatan Pelanggan Gustafta.";
  const model =
    agent?.aiModel &&
    !agent.aiModel.startsWith("deepseek") &&
    !agent.aiModel.startsWith("qwen") &&
    !agent.aiModel.startsWith("gemini") &&
    agent.aiModel !== "custom"
      ? agent.aiModel
      : "gpt-4o";
  const today = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full" });
  const foundation = buildGustaftaFoundationDoc();

  const userPrompt = `Tanggal: ${today}

Susun SEQUENCE PERAWATAN PELANGGAN (email + WhatsApp) untuk memelihara hubungan berkelanjutan
dengan pelanggan Gustafta yang SUDAH ada (retensi & nurture). Ambil bahan dari FONDASI GUSTAFTA
(visi, Trilogi, produk & jasa) + KONTEKS MARKETING HARI INI (sudut/materi terbaru) di bawah.

FORMAT KELUARAN (ikuti persis):
A) SEQUENCE EMAIL (4-5 email bertahap). Tiap email: Tujuan · Kirim di (Hari ke-) · Subject line ·
   Preview text · Isi (personal, hangat, nilai dulu) · CTA. Sisipkan minimal satu email yang
   mengangkat VISI/Trilogi (dari monolog ke dialog) agar hubungan terasa bermakna, bukan jualan terus.
B) SEQUENCE WHATSAPP (4-5 pesan pendek). Tiap pesan: Kirim di (Hari ke-) · Isi (santai, value-first,
   maksimal beberapa kalimat, boleh emoji secukupnya) · CTA lembut.
C) CATATAN OPERASIONAL: variabel personalisasi ({nama}, {produk}, dll.) + di titik mana ◆ gerbang
   manusia (founder menyetujui sebelum kirim).

Aturan: bahasa Indonesia hangat & personal. Jangan janji hasil pasti/ROI. Tandai klaim belum
terverifikasi dengan [ASUMSI: ... | basis: ... | verifikasi-ke: ...].

===== KONTEKS MARKETING HARI INI =====
${(marketingContext || "(tidak ada materi marketing hari ini — gunakan fondasi saja)").slice(0, 4500)}
===== SELESAI =====

===== FONDASI GUSTAFTA (rujuk ini) =====
${foundation}
===== SELESAI =====`;

  let content = "";
  try {
    const resp = await client.chat.completions.create(
      {
        model,
        temperature: 0.7,
        max_tokens: 3500,
        messages: [
          { role: "system", content: persona },
          { role: "user", content: userPrompt },
        ],
      },
      { timeout: 60000 },
    );
    content = resp.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    return { generated: false, chunks: 0, reason: (e as Error).message };
  }
  if (!content) return { generated: false, chunks: 0, reason: "empty" };

  const stamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const doc = `SEQUENCE RETENSI HARIAN — Gustafta
Dibuat otomatis: ${stamp} WIB
Dasar: output tim marketing hari ini + Fondasi Gustafta (visi, Trilogi, produk/jasa). Draf untuk
memelihara hubungan dengan pelanggan. Pengiriman final = keputusan founder (◆ gerbang manusia).

${content}`;

  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`
    DELETE FROM knowledge_chunks
    WHERE knowledge_base_id IN (
      SELECT id FROM knowledge_bases
      WHERE agent_id = ${agentId} AND name LIKE ${RETENTION_KB_PREFIX + "%"}
    )
  `);
  await db.execute(sql`
    DELETE FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${RETENTION_KB_PREFIX + "%"}
  `);

  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${RETENTION_KB_PREFIX} — ${new Date().toISOString().slice(0, 10)}`,
    type: "text",
    content: doc,
    description: "Sequence email/WA retensi harian (auto-generated)",
    extractedText: doc,
    sourceUrl: "",
    sourceAuthority: "Perawatan Pelanggan Gustafta (AI, dari output marketing + fondasi)",
    status: "active",
  });

  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) {
    await storage.createChunks(chunks);
  }
  return { generated: true, chunks: chunks.length };
}

/**
 * Dokumen FONDASI PENJUALAN — playbook jualan statis: cara menutup penjualan Gustafta
 * dengan jujur. Kerangka menjawab keberatan + prinsip skrip closing. Jadi grounding
 * agen Asisten Closing & generator amunisi jualan harian. Bukan LLM; spesifik & jujur.
 */
export function buildSalesPlaybookDoc(): string {
  return `FONDASI PENJUALAN GUSTAFTA — Playbook menutup penjualan (jujur)
Rujukan untuk melayani calon pembeli & menyusun skrip closing. Selalu selaras dengan Fondasi Gustafta
(visi, Trilogi, produk & jasa). JANGAN memakai urgensi palsu, klaim hasil pasti, atau ROI fiktif.

═══ 3 JALUR JUALAN (arahkan sesuai kebutuhan calon pembeli) ═══
- Chatbot Biasa (rakit sendiri, no-code) = lisensi standar + bulanan → untuk yang mau hemat & suka utak-atik.
- Chatbot Premium (siap pakai) = lisensi premium (K1 Rp1jt · K2 Rp2,5jt · K3 Rp5jt · K4 Rp10jt) + bulanan
  → untuk yang mau langsung jalan tanpa merakit.
- Jasa Order (custom, dibuatkan Gustafta) = setup sekali (termasuk lisensi) + bulanan → untuk kebutuhan khusus.
Pintu masuk termurah: Starter Kit Rp245.000 (sekali) + trial 7 hari. Trilogi (Buku I Rp245rb / bundle Rp499rb)
= langkah kecil bagi yang "masih mikir". Biaya bulanan (hosting+token) berlaku SEMUA produk.

═══ KERANGKA MENJAWAB KEBERATAN (dengar → akui → jelaskan → ajak langkah kecil) ═══
- "Mahal": bandingkan dengan biaya merekrut orang; mulai dari Starter Kit Rp245rb atau Trilogi dulu; naik tier bertahap.
- "Ribet / gaptek": Chatbot Biasa no-code; kalau tetap enggan, ada Premium siap pakai atau Jasa Order (dibuatkan).
- "Beda apa sama ChatGPT / chatbot lain": Gustafta bukan 1 bot, tapi merakit TIM AI (organisasi AI) yang
  grounded pada pengetahuan Anda sendiri. Positioning: mempersenjatai usaha Anda, bukan menyaingi.
- "Untungnya apa buat usaha saya": kaitkan ke domain nyata (kontraktor→tender/SBU, UMKM→konten harian);
  metrik = waktu kembali & fokus ke hal strategis.
- "Nanti dulu / masih mikir": tawarkan langkah kecil (Starter Kit / Trilogi / trial 7 hari), bukan tekanan.
- "Hasilnya pasti?": JUJUR — tidak menjanjikan hasil pasti; ada ◆ gerbang manusia; bukti = tools nyata (RAB, K3 Vision).
- "Bulanan buat apa": hosting + token model AI; berlaku untuk semua produk.

═══ PRINSIP SKRIP CLOSING (WhatsApp) ═══
- Hangat & personal, pakai {nama}. Nilai/empati dulu, ajakan belakangan.
- Satu ajakan jelas (link checkout / jadwal ngobrol / ambil Starter Kit). Jangan bertumpuk.
- Sediakan opsi langkah kecil supaya mudah bilang "ya".
- ◆ GERBANG MANUSIA: jangan janjikan harga khusus/diskon/garansi di luar wewenang; jika ragu, eskalasi ke founder.
- Tandai klaim belum terverifikasi: [ASUMSI: ... | basis: ... | verifikasi-ke: ...].`;
}

/**
 * Seed FONDASI PENJUALAN sebagai KB pada agen closing (idempoten by prefix). Prune-scope terpisah.
 */
export async function ensureSalesPlaybookLibrary(
  agentId: number,
): Promise<{ created: boolean; chunks: number }> {
  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const existing = await db.execute(sql`
    SELECT id FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${SALES_PLAYBOOK_KB_PREFIX + "%"}
    LIMIT 1
  `);
  if ((existing.rows?.length ?? 0) > 0) return { created: false, chunks: 0 };

  const doc = buildSalesPlaybookDoc();
  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${SALES_PLAYBOOK_KB_PREFIX} — Playbook Menutup Penjualan`,
    type: "text",
    content: doc,
    description: "Playbook jualan kanonik Gustafta (jalur jualan, keberatan, prinsip closing)",
    extractedText: doc,
    sourceUrl: "",
    sourceAuthority: "Gustafta (kanonik)",
    status: "active",
  });
  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) await storage.createChunks(chunks);
  return { created: true, chunks: chunks.length };
}

/**
 * Agen "Asisten Closing" menyusun AMUNISI JUALAN harian: (A) keberatan umum + jawaban terbaik,
 * (B) skrip closing WhatsApp siap salin-tempel per situasi, (C) pesan follow-up prospek (belum beli).
 * Bahan: konteks marketing hari ini + Fondasi Penjualan + Fondasi Gustafta. Disimpan KB prune-scope
 * sendiri. Semua = draf bantu jualan; keputusan & pengiriman = founder (◆ gerbang manusia).
 */
export async function generateDailyClosingKit(
  agentId: number,
  marketingContext: string,
): Promise<{ generated: boolean; chunks: number; reason?: string }> {
  const client = getAdOpenAI();
  if (!client) return { generated: false, chunks: 0, reason: "no-openai-key" };

  const agent = await storage.getAgent(String(agentId));
  const persona = agent?.systemPrompt || "Kamu Asisten Closing Gustafta.";
  const model =
    agent?.aiModel &&
    !agent.aiModel.startsWith("deepseek") &&
    !agent.aiModel.startsWith("qwen") &&
    !agent.aiModel.startsWith("gemini") &&
    agent.aiModel !== "custom"
      ? agent.aiModel
      : "gpt-4o";
  const today = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full" });
  const foundation = buildGustaftaFoundationDoc();
  const playbook = buildSalesPlaybookDoc();

  const userPrompt = `Tanggal: ${today}

Susun AMUNISI JUALAN hari ini untuk membantu founder MENUTUP PENJUALAN. Ambil bahan dari FONDASI
PENJUALAN + FONDASI GUSTAFTA + KONTEKS MARKETING HARI INI (sudut/materi terbaru) di bawah.

FORMAT KELUARAN (ikuti persis):
A) KEBERATAN & JAWABAN — 5-7 keberatan umum calon pembeli. Tiap butir: Keberatan · Jawaban terbaik
   (empati dulu, jujur, kaitkan ke jalur produk yang pas).
B) SKRIP CLOSING WHATSAPP (siap salin-tempel) — 4 situasi: (1) baru tanya-tanya, (2) ragu harga,
   (3) membandingkan / masih mikir, (4) sudah tertarik (arahkan ke langkah beli). Pakai {nama},
   hangat, satu ajakan jelas.
C) FOLLOW-UP PROSPEK (belum beli) — 3 pesan pendek bertahap (mis. Hari ke-1/3/7), value-first,
   ajakan lembut, sertakan langkah kecil (Starter Kit / Trilogi / trial).

Aturan: bahasa Indonesia hangat & personal. JANGAN urgensi palsu / janji hasil pasti / ROI fiktif.
Jangan janjikan diskon/garansi di luar wewenang → tandai "◆ konfirmasi founder". Tandai klaim belum
terverifikasi dengan [ASUMSI: ... | basis: ... | verifikasi-ke: ...].

===== KONTEKS MARKETING HARI INI =====
${(marketingContext || "(tidak ada materi marketing hari ini — gunakan fondasi saja)").slice(0, 4000)}
===== SELESAI =====

===== FONDASI PENJUALAN (rujuk ini) =====
${playbook}
===== SELESAI =====

===== FONDASI GUSTAFTA (rujuk ini) =====
${foundation}
===== SELESAI =====`;

  let content = "";
  try {
    const resp = await client.chat.completions.create(
      {
        model,
        temperature: 0.7,
        max_tokens: 3500,
        messages: [
          { role: "system", content: persona },
          { role: "user", content: userPrompt },
        ],
      },
      { timeout: 60000 },
    );
    content = resp.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    return { generated: false, chunks: 0, reason: (e as Error).message };
  }
  if (!content) return { generated: false, chunks: 0, reason: "empty" };

  const stamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const doc = `AMUNISI JUALAN HARIAN — Gustafta
Dibuat otomatis: ${stamp} WIB
Dasar: output tim marketing hari ini + Fondasi Penjualan + Fondasi Gustafta. Alat bantu founder untuk
melayani calon pembeli & menutup penjualan. Keputusan & pengiriman final = founder (◆ gerbang manusia).

${content}`;

  const { db } = await import("../db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`
    DELETE FROM knowledge_chunks
    WHERE knowledge_base_id IN (
      SELECT id FROM knowledge_bases
      WHERE agent_id = ${agentId} AND name LIKE ${CLOSING_KB_PREFIX + "%"}
    )
  `);
  await db.execute(sql`
    DELETE FROM knowledge_bases
    WHERE agent_id = ${agentId} AND name LIKE ${CLOSING_KB_PREFIX + "%"}
  `);

  const kb = await storage.createKnowledgeBase({
    agentId: String(agentId),
    name: `${CLOSING_KB_PREFIX} — ${new Date().toISOString().slice(0, 10)}`,
    type: "text",
    content: doc,
    description: "Amunisi jualan harian: keberatan+jawaban, skrip closing WA, follow-up prospek (auto-generated)",
    extractedText: doc,
    sourceUrl: "",
    sourceAuthority: "Asisten Closing Gustafta (AI, dari output marketing + fondasi penjualan)",
    status: "active",
  });

  const chunks = await processKnowledgeBaseForRAG(parseInt(kb.id), agentId, doc, kb.name);
  if (chunks.length > 0) {
    await storage.createChunks(chunks);
  }
  return { generated: true, chunks: chunks.length };
}

export interface StreamResult {
  slug: string;
  agentId: number;
  topics: number;
  items: number;
  chunks: number;
}

export interface SweepResult {
  streams: StreamResult[];
  methodLibrary?: { agentId: number; created: boolean; chunks: number };
  adMaterials?: { agentId: number; generated: boolean; chunks: number; reason?: string; content?: string };
  foundationLibrary?: { agentId: number; created: boolean; chunks: number };
  retention?: { agentId: number; generated: boolean; chunks: number; reason?: string };
  salesPlaybook?: { agentId: number; created: boolean; chunks: number };
  closingKit?: { agentId: number; generated: boolean; chunks: number; reason?: string };
  skipped: string[];
  // Kompatibilitas mundur (kode/UI lama yang membaca .local / .global).
  local?: StreamResult;
  global?: StreamResult;
}

/**
 * Jalankan satu putaran riset untuk SEMUA stream feed. Resolusi agen via SLUG
 * (bukan ID hardcoded). Juga memastikan playbook metode riset ter-seed sekali.
 */
export async function runResearchSweep(): Promise<SweepResult> {
  const result: SweepResult = { streams: [], skipped: [] };
  const docsBySlug: Record<string, string> = {};

  for (const stream of FEED_STREAMS) {
    const agent = await storage.getAgentBySlug(stream.slug);
    if (!agent) {
      result.skipped.push(stream.slug);
      continue;
    }
    const agentId = Number(agent.id);
    const groups: TopicGroup[] = [];
    for (const t of stream.topics) {
      const q = typeof t === "string" ? t : t.q;
      const hl = typeof t === "string" ? stream.defaultHl : t.hl ?? stream.defaultHl;
      const gl = typeof t === "string" ? stream.defaultGl : t.gl ?? stream.defaultGl;
      try {
        groups.push({ query: q, items: await fetchGoogleNews(q, { hl, gl, limit: stream.perTopic ?? 8 }) });
      } catch (e) {
        console.error(`[ResearchFeed] "${stream.slug}" topik "${q}" gagal:`, (e as Error).message);
        groups.push({ query: q, items: [] });
      }
    }
    const doc = formatNewsDoc(stream.docTitle, groups);
    docsBySlug[stream.slug] = doc;
    const chunks = await ingestNewsForAgent(agentId, stream.kbLabel, doc);
    const sr: StreamResult = {
      slug: stream.slug,
      agentId,
      topics: stream.topics.length,
      items: groups.reduce((a, g) => a + g.items.length, 0),
      chunks,
    };
    result.streams.push(sr);
    if (stream.slug === RESEARCH_LOCAL_SLUG) result.local = sr;
    if (stream.slug === RESEARCH_GLOBAL_SLUG) result.global = sr;

    // Seed playbook metode riset pada agen iklan-pasar (idempoten).
    if (stream.slug === RESEARCH_MARKET_SLUG) {
      try {
        result.methodLibrary = { agentId, ...(await ensureResearchMethodLibrary(agentId)) };
      } catch (e) {
        console.error(`[ResearchFeed] seed method library gagal:`, (e as Error).message);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PIPELINE MARKETING GUSTAFTA — tahap lanjutan (berjalan berurutan tiap hari).
  // Tahap 1 (di atas): RISET pasar/lokal/global → feed KB.
  // Tahap 2: MATERI IKLAN per platform (dari temuan riset).
  // Tahap 3: SEQUENCE RETENSI email/WA (dari output marketing + Fondasi Gustafta).
  // Tahap 4: AMUNISI JUALAN (keberatan+jawaban, skrip closing WA, follow-up prospek).
  // Semua fire-and-forget: kegagalan satu tahap tidak menggagalkan tahap lain / sweep.
  // ══════════════════════════════════════════════════════════════════════════

  // ── TAHAP 2 — MATERI IKLAN ──
  try {
    const adAgent = await storage.getAgentBySlug(AD_MATERIAL_SLUG);
    if (adAgent) {
      // Seed panduan platform (idempoten) agar tersedia untuk chat & jadi rujukan spesifikasi.
      try {
        await ensureAdPlatformLibrary(Number(adAgent.id));
      } catch (e) {
        console.error(`[Pipeline] seed panduan platform gagal:`, (e as Error).message);
      }
      const ctx = [docsBySlug[RESEARCH_MARKET_SLUG], docsBySlug[RESEARCH_LOCAL_SLUG]]
        .filter(Boolean)
        .join("\n\n");
      result.adMaterials = {
        agentId: Number(adAgent.id),
        ...(await generateDailyAdMaterials(Number(adAgent.id), ctx)),
      };
    } else {
      result.skipped.push(AD_MATERIAL_SLUG);
    }
  } catch (e) {
    console.error(`[Pipeline] generate materi iklan gagal:`, (e as Error).message);
  }

  // ── TAHAP 3 — SEQUENCE RETENSI (email/WA) ──
  // Konteks = materi iklan hari ini (sudah mensintesis riset) + temuan pasar; fondasi
  // (visi/Trilogi/produk-jasa) di-inject di dalam generator. Retensi tidak auto-kirim.
  try {
    const retAgent = await storage.getAgentBySlug(RETENTION_SLUG);
    if (retAgent) {
      const retAgentId = Number(retAgent.id);
      // Seed Fondasi Gustafta (idempoten) — jadi rujukan chat & grounding sequence.
      try {
        result.foundationLibrary = {
          agentId: retAgentId,
          ...(await ensureRetentionFoundationLibrary(retAgentId)),
        };
      } catch (e) {
        console.error(`[Pipeline] seed fondasi gustafta gagal:`, (e as Error).message);
      }
      const retCtx = [result.adMaterials?.content, docsBySlug[RESEARCH_MARKET_SLUG]]
        .filter(Boolean)
        .join("\n\n");
      result.retention = {
        agentId: retAgentId,
        ...(await generateDailyRetentionSequence(retAgentId, retCtx)),
      };
    } else {
      result.skipped.push(RETENTION_SLUG);
    }
  } catch (e) {
    console.error(`[Pipeline] generate sequence retensi gagal:`, (e as Error).message);
  }

  // ── TAHAP 4 — AMUNISI JUALAN (bantu closing) ──
  // Konteks = materi iklan hari ini (sudut segar) + temuan pasar; Fondasi Penjualan & Fondasi
  // Gustafta di-inject di dalam generator. Semua = draf bantu jualan, bukan auto-kirim.
  try {
    const closeAgent = await storage.getAgentBySlug(CLOSING_SLUG);
    if (closeAgent) {
      const closeAgentId = Number(closeAgent.id);
      // Seed Fondasi Penjualan + Fondasi Gustafta (idempoten) → grounding chat & generator.
      try {
        result.salesPlaybook = {
          agentId: closeAgentId,
          ...(await ensureSalesPlaybookLibrary(closeAgentId)),
        };
        await ensureRetentionFoundationLibrary(closeAgentId);
      } catch (e) {
        console.error(`[Pipeline] seed fondasi penjualan gagal:`, (e as Error).message);
      }
      const closeCtx = [result.adMaterials?.content, docsBySlug[RESEARCH_MARKET_SLUG]]
        .filter(Boolean)
        .join("\n\n");
      result.closingKit = {
        agentId: closeAgentId,
        ...(await generateDailyClosingKit(closeAgentId, closeCtx)),
      };
    } else {
      result.skipped.push(CLOSING_SLUG);
    }
  } catch (e) {
    console.error(`[Pipeline] generate amunisi jualan gagal:`, (e as Error).message);
  }

  return result;
}
