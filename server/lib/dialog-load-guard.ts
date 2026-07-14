// ─── Perlindungan Beban untuk Dialog Acara (Task: Kesiapan 1000 Peserta) ──────
//
// Endpoint publik /api/dialog-gustafta* adalah jalur kritis saat soft-launch acara
// (ratusan peserta memakainya serempak). Modul ini memberi dua lapis perlindungan:
//
//  1. GERBANG KONKURENSI (p-limit): batasi jumlah panggilan LLM yang jalan bersamaan
//     + antrean terbatas. Bila sistem sudah penuh, tolak CEPAT dengan pesan ramah
//     (503) alih-alih menumpuk request sampai time out beruntun.
//  2. FALLBACK LINTAS-PROVIDER: coba OpenAI (model cepat/hemat) lebih dulu, lalu
//     jatuh ke DeepSeek → Qwen → OpenRouter → Nvidia → Gemini sesuai kunci yang ada.
//     Satu provider down/limit tidak mematikan seluruh dialog.

import pLimit from "p-limit";

function intEnv(name: string, fallback: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}
const MAX_CONCURRENCY = Math.max(1, intEnv("DIALOG_MAX_CONCURRENCY", 12));
const MAX_QUEUE = Math.max(0, intEnv("DIALOG_MAX_QUEUE", 40));

const limit = pLimit(MAX_CONCURRENCY);

/** Dilempar saat sistem sedang penuh — endpoint harus balas 503 ramah. */
export class DialogBusyError extends Error {
  constructor() {
    super("dialog_busy");
    this.name = "DialogBusyError";
  }
}

/**
 * Jalankan fungsi LLM di bawah gerbang konkurensi. Bila total (jalan + antre)
 * sudah melewati kapasitas, langsung lempar DialogBusyError.
 */
export function runGuardedDialog<T>(fn: () => Promise<T>): Promise<T> {
  if (limit.activeCount + limit.pendingCount >= MAX_CONCURRENCY + MAX_QUEUE) {
    return Promise.reject(new DialogBusyError());
  }
  return limit(fn);
}

/** Snapshot beban untuk observasi/health. */
export function dialogLoadStats() {
  return {
    active: limit.activeCount,
    pending: limit.pendingCount,
    maxConcurrency: MAX_CONCURRENCY,
    maxQueue: MAX_QUEUE,
  };
}

// Model default untuk dialog acara: cepat & hemat (bisa dioverride via env).
export const DIALOG_MODEL = process.env.DIALOG_MODEL || "gpt-4o-mini";

type ChatMsg = { role: "user" | "assistant"; content: string };

interface DialogChatOptions {
  system?: string;
  messages: ChatMsg[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  model?: string;
}

interface OpenAICompatProvider {
  name: string;
  apiKey: string;
  baseURL?: string;
  model: string;
}

/** Susun daftar provider OpenAI-compatible yang tersedia (primary + fallback). */
function openaiCompatProviders(model: string): OpenAICompatProvider[] {
  const list: OpenAICompatProvider[] = [];

  const openaiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (openaiKey) {
    list.push({
      name: "openai",
      apiKey: openaiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
      model,
    });
  }
  if (process.env.DEEPSEEK_API_KEY) {
    list.push({
      name: "deepseek",
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
      model: "deepseek-chat",
    });
  }
  if (process.env.QWEN_API_KEY) {
    list.push({
      name: "qwen",
      apiKey: process.env.QWEN_API_KEY,
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      model: process.env.QWEN_MODEL || "qwen-plus",
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    list.push({
      name: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    });
  }
  if (process.env.NVIDIA_API_KEY) {
    list.push({
      name: "nvidia",
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
      model: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
    });
  }
  return list;
}

async function tryGemini(opts: DialogChatOptions): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 400,
      temperature: opts.temperature ?? 0.8,
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text || "")
      .join("");
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Panggil chat completion dengan fallback lintas-provider. Mengembalikan string
 * konten (untuk jsonMode, string JSON mentah). Lempar error hanya bila SEMUA
 * provider gagal.
 */
export async function dialogChatCompletion(opts: DialogChatOptions): Promise<string> {
  const model = opts.model || DIALOG_MODEL;
  const providers = openaiCompatProviders(model);

  const { OpenAI } = await import("openai");
  const messages = [
    ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
    ...opts.messages,
  ];

  let lastErr: unknown = null;
  for (const p of providers) {
    try {
      const client = new OpenAI({
        apiKey: p.apiKey,
        ...(p.baseURL ? { baseURL: p.baseURL } : {}),
        timeout: 25000,
        maxRetries: 0,
      });
      const completion = await client.chat.completions.create({
        model: p.model,
        messages: messages as any,
        max_tokens: opts.maxTokens ?? 400,
        temperature: opts.temperature ?? 0.8,
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      });
      const content = completion.choices[0]?.message?.content;
      if (content && content.trim()) return content;
    } catch (err) {
      lastErr = err;
      // lanjut ke provider berikutnya
    }
  }

  // Fallback terakhir: Gemini (REST langsung).
  const gem = await tryGemini(opts);
  if (gem && gem.trim()) return gem;

  throw lastErr instanceof Error
    ? lastErr
    : new Error("Semua provider LLM gagal merespons.");
}
