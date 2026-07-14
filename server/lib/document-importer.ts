import OpenAI from "openai";
import { extractDocumentContent } from "./file-processing";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}
const openai = new Proxy({} as OpenAI, { get(_t, p) { return (getOpenAI() as any)[p]; } });

export interface AgentFieldProposal {
  name?: string;
  tagline?: string;
  description?: string;
  philosophy?: string;
  systemPrompt?: string;
  greetingMessage?: string;
  conversationStarters?: string[];
  expertise?: string[];
  keyPhrases?: string[];
  avoidTopics?: string[];
  category?: string;
  subcategory?: string;
  language?: string;
  toneOfVoice?: string;
  responseFormat?: string;
}

export interface KnowledgeChunkProposal {
  name: string;
  type: "text";
  content: string;
  description?: string;
}

export interface ImportProposal {
  proposal: AgentFieldProposal;
  knowledgeChunks: KnowledgeChunkProposal[];
  confidence: number;
  sourceFile: string;
  rawTextLength: number;
  truncated: boolean;
  notes: string[];
}

const FIELD_MAP_SYSTEM = `Anda adalah asisten yang mem-parsing dokumen kompetensi (PDF/DOCX/XLSX) dan memetakan kontennya menjadi konfigurasi chatbot AI di platform Gustafta.

ATURAN KETAT (anti-halusinasi):
1. JANGAN mengarang field. Jika informasi tidak ada di dokumen sumber, biarkan field kosong/null/[].
2. Setiap field yang Anda isi HARUS bisa ditelusuri kembali ke teks dokumen.
3. Bahasa output: ikuti bahasa dokumen sumber (Indonesia jika Indonesia, English jika English).
4. Jangan menambahkan tanda kutip, emoji, atau markup berlebih. Plain text saja.
5. systemPrompt ditulis sebagai instruksi peran (mulai "Anda adalah ..." atau "You are ..."), bukan ringkasan dokumen.
6. conversationStarters adalah pertanyaan/perintah singkat (3-12 kata) yang relevan dengan topik dokumen, max 5 item.
7. knowledgeChunks: pecah konten panjang/referensi/lampiran menjadi 1-8 potongan tematik (judul + isi 200-1500 karakter).

OUTPUT FORMAT: JSON valid mengikuti schema yang diminta.`;

const FIELD_MAP_USER_TEMPLATE = (text: string, fileName: string) => `Dokumen sumber: ${fileName}

KONTEN DOKUMEN:
"""
${text}
"""

Tugas: Petakan dokumen di atas ke konfigurasi chatbot. Hanya isi field yang BENAR-BENAR ada/tersirat di dokumen. Sisanya biarkan null atau array kosong.

Skema field yang harus dipertimbangkan:
- name: Nama chatbot (judul utama dokumen, ringkas, max 80 karakter)
- tagline: Slogan satu baris (max 120 karakter)
- description: Deskripsi 1-3 kalimat tentang fungsi chatbot
- philosophy: Filosofi/prinsip kerja (1 paragraf)
- systemPrompt: Instruksi peran lengkap untuk LLM (boleh panjang, sertakan persona, ruang lingkup, alur kerja, larangan)
- greetingMessage: Sapaan pembuka chatbot (1-3 kalimat ramah, sebut peran)
- conversationStarters: Array pertanyaan pemicu (max 5)
- expertise: Array bidang keahlian (max 8)
- keyPhrases: Array kata kunci/jargon penting (max 10)
- avoidTopics: Array topik yang harus dihindari (jika dokumen menyebutkan)
- category: Kategori umum (mis. "engineering", "legal", "education", "business")
- subcategory: Sub-kategori spesifik (mis. "construction-safety", "tender-procurement")
- language: "id" untuk Indonesia, "en" untuk English, dll.
- toneOfVoice: Nada suara (mis. "profesional-tegas", "ramah-edukatif", "formal-akademik")
- responseFormat: Format respons default (mis. "markdown-list", "narrative-paragraph", "step-by-step")

Knowledge chunks (knowledgeChunks): Pecah materi referensi (peraturan, SOP, glosarium, studi kasus, data tabel) menjadi entry KB tematik. Setiap chunk: { name, type: "text", content, description }.

Tambahkan juga:
- confidence: Skor 0.0-1.0 seberapa yakin Anda dengan hasil mapping (rata-rata kekayaan informasi vs kekosongan).
- notes: Array catatan singkat (max 5) tentang field yang tidak bisa diisi atau ambiguitas yang Anda temui.

Balas dengan JSON murni saja.`;

export async function importDocumentToProposal(
  filePath: string,
  fileName: string,
  modelOverride?: string
): Promise<ImportProposal> {
  const extracted = await extractDocumentContent(filePath);
  const text = extracted.content || "";
  const truncated = !!extracted.truncated;

  if (!text || text.trim().length < 50 || text.startsWith("[Format file") || text.startsWith("[File PowerPoint")) {
    return {
      proposal: {},
      knowledgeChunks: [],
      confidence: 0,
      sourceFile: fileName,
      rawTextLength: text.length,
      truncated,
      notes: [
        "Dokumen tidak menghasilkan teks yang dapat dibaca.",
        "Pastikan PDF bukan hasil scan tanpa OCR, atau format file didukung (PDF, DOCX, XLSX, TXT, CSV).",
      ],
    };
  }

  const model = modelOverride || "gpt-4o";

  let parsed: any;
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: FIELD_MAP_SYSTEM },
        { role: "user", content: FIELD_MAP_USER_TEMPLATE(text, fileName) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch (err: any) {
    console.error("[document-importer] AI mapping error:", err?.message || err);
    return {
      proposal: {},
      knowledgeChunks: [],
      confidence: 0,
      sourceFile: fileName,
      rawTextLength: text.length,
      truncated,
      notes: [
        "Gagal memproses dokumen melalui AI.",
        err?.message ? `Detail: ${String(err.message).slice(0, 200)}` : "",
      ].filter(Boolean),
    };
  }

  const proposal: AgentFieldProposal = {
    name: clipString(parsed.name, 200),
    tagline: clipString(parsed.tagline, 250),
    description: clipString(parsed.description, 1500),
    philosophy: clipString(parsed.philosophy, 2000),
    systemPrompt: clipString(parsed.systemPrompt, 12000),
    greetingMessage: clipString(parsed.greetingMessage, 800),
    conversationStarters: clipArray(parsed.conversationStarters, 5, 200),
    expertise: clipArray(parsed.expertise, 8, 100),
    keyPhrases: clipArray(parsed.keyPhrases, 10, 80),
    avoidTopics: clipArray(parsed.avoidTopics, 8, 200),
    category: clipString(parsed.category, 60),
    subcategory: clipString(parsed.subcategory, 80),
    language: clipString(parsed.language, 5),
    toneOfVoice: clipString(parsed.toneOfVoice, 80),
    responseFormat: clipString(parsed.responseFormat, 80),
  };

  const knowledgeChunks: KnowledgeChunkProposal[] = Array.isArray(parsed.knowledgeChunks)
    ? parsed.knowledgeChunks
        .slice(0, 12)
        .map((kb: any) => ({
          name: clipString(kb?.name, 200) || "Materi",
          type: "text" as const,
          content: clipString(kb?.content, 8000) || "",
          description: clipString(kb?.description, 500) || undefined,
        }))
        .filter((kb: KnowledgeChunkProposal) => kb.content && kb.content.length > 30)
    : [];

  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
  const notes = Array.isArray(parsed.notes)
    ? parsed.notes.slice(0, 5).map((n: any) => clipString(String(n), 300) || "").filter(Boolean)
    : [];

  if (truncated) {
    notes.unshift("Konten dokumen dipotong karena melebihi batas. Sebagian materi mungkin tidak terbaca.");
  }

  return {
    proposal,
    knowledgeChunks,
    confidence,
    sourceFile: fileName,
    rawTextLength: text.length,
    truncated,
    notes,
  };
}

function clipString(v: any, maxLen: number): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === "string" ? v.trim() : String(v).trim();
  if (!s) return undefined;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function clipArray(v: any, maxItems: number, itemMaxLen: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const arr = v
    .slice(0, maxItems)
    .map((x) => clipString(x, itemMaxLen))
    .filter((x): x is string => !!x);
  return arr.length > 0 ? arr : undefined;
}

export type ApplyMode = "fill_empty_only" | "overwrite_all";

const FIELD_KEYS: (keyof AgentFieldProposal)[] = [
  "name", "tagline", "description", "philosophy", "systemPrompt",
  "greetingMessage", "conversationStarters", "expertise", "keyPhrases",
  "avoidTopics", "category", "subcategory", "language", "toneOfVoice", "responseFormat",
];

export function mergeProposalIntoAgent(
  existingAgent: any,
  proposal: AgentFieldProposal,
  mode: ApplyMode
): Record<string, any> {
  const patch: Record<string, any> = {};

  for (const key of FIELD_KEYS) {
    const incoming = proposal[key];
    if (incoming === undefined || incoming === null) continue;
    if (Array.isArray(incoming) && incoming.length === 0) continue;
    if (typeof incoming === "string" && !incoming.trim()) continue;

    if (mode === "overwrite_all") {
      patch[key] = incoming;
    } else {
      const current = existingAgent?.[key];
      const isEmpty =
        current === null ||
        current === undefined ||
        (typeof current === "string" && current.trim() === "") ||
        (Array.isArray(current) && current.length === 0);
      if (isEmpty) {
        patch[key] = incoming;
      }
    }
  }

  return patch;
}
