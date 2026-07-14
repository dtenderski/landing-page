import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

/**
 * MODEL ROUTER — Smart-Standard Multi-Provider LLM Routing
 *
 * Kualitas diutamakan: setiap task memilih model CERDAS, dengan diversifikasi
 * provider agar beban token tersebar (bila OpenAI habis, ada DeepSeek/Qwen/Gemini).
 *   general       → gpt-4o → DeepSeek Chat → Qwen Plus
 *   orchestration → DeepSeek Chat → Qwen Plus → gpt-4o
 *   math_rab      → DeepSeek Chat → Qwen Plus → gpt-4o
 *   data_extract  → DeepSeek Chat → Qwen Plus → gpt-4o
 *   large_doc     → Gemini 2.5 Pro → Qwen Plus → gpt-4o
 *   vision        → gpt-4o
 *
 * SEMUA tier "cerdas" — TIDAK ada gpt-4o-mini / qwen-turbo / gemini-flash.
 */

export type TaskType =
  | "orchestration"
  | "vision"
  | "math_rab"
  | "data_extraction"
  | "large_doc"
  | "general";

export interface RouterChoice {
  provider: "openai" | "gemini" | "deepseek" | "qwen";
  model: string;
  reason: string;
}

const hasQwen     = () => !!process.env.QWEN_API_KEY;
const hasDeepSeek = () => !!process.env.DEEPSEEK_API_KEY;
const hasGemini   = () => !!(process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY);

export function chooseModel(task: TaskType): RouterChoice {
  switch (task) {

    case "vision":
      return { provider: "openai", model: "gpt-4o", reason: "GPT-4o Vision — satu-satunya yang handal untuk analisis gambar" };

    case "orchestration":
      if (hasDeepSeek())
        return { provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek Chat — reasoning kuat untuk orkestrasi" };
      if (hasQwen())
        return { provider: "qwen", model: "qwen-plus", reason: "Qwen Plus — orkestrasi multi-step yang solid" };
      return { provider: "openai", model: "gpt-4o", reason: "GPT-4o — orkestrasi cerdas" };

    case "math_rab":
      if (hasDeepSeek())
        return { provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek — chain-of-thought terbaik untuk perhitungan RAB & numerik" };
      if (hasQwen())
        return { provider: "qwen", model: "qwen-plus", reason: "Qwen Plus — perhitungan solid" };
      return { provider: "openai", model: "gpt-4o", reason: "GPT-4o — perhitungan cerdas" };

    case "data_extraction":
      if (hasDeepSeek())
        return { provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek Chat — ekstraksi terstruktur akurat" };
      if (hasQwen())
        return { provider: "qwen", model: "qwen-plus", reason: "Qwen Plus — ekstraksi solid" };
      return { provider: "openai", model: "gpt-4o", reason: "GPT-4o — ekstraksi cerdas" };

    case "large_doc":
      if (hasGemini())
        return { provider: "gemini", model: "gemini-2.5-pro", reason: "Gemini 2.5 Pro — context besar & cerdas untuk dokumen panjang" };
      if (hasQwen())
        return { provider: "qwen", model: "qwen-plus", reason: "Qwen Plus — dokumen panjang" };
      return { provider: "openai", model: "gpt-4o", reason: "GPT-4o — dokumen panjang cerdas" };

    case "general":
    default:
      if (process.env.OPENAI_API_KEY)
        return { provider: "openai", model: "gpt-4o", reason: "GPT-4o — general cerdas" };
      if (hasDeepSeek())
        return { provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek Chat — general cerdas" };
      return { provider: "qwen", model: "qwen-plus", reason: "Qwen Plus — general cerdas" };
  }
}

export async function callWithRouter(
  task: TaskType,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ text: string; choice: RouterChoice }> {
  const choice = chooseModel(task);
  const temperature = options?.temperature ?? 0.3;
  const maxTokens = options?.maxTokens ?? 2000;

  if (choice.provider === "openai" || choice.provider === "deepseek" || choice.provider === "qwen") {
    let client: OpenAI;
    if (choice.provider === "deepseek") {
      client = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        baseURL: "https://api.deepseek.com",
      });
    } else if (choice.provider === "qwen") {
      client = new OpenAI({
        apiKey: process.env.QWEN_API_KEY!,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      });
    } else {
      client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    }

    const resp = await client.chat.completions.create({
      model: choice.model,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    return { text: resp.choices[0]?.message?.content ?? "", choice };
  }

  if (choice.provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const genai = new GoogleGenAI({ apiKey: apiKey! });
    const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
    const userMsg = messages.filter(m => m.role !== "system").map(m => m.content).join("\n");
    const result = await genai.models.generateContent({
      model: choice.model,
      contents: `${systemMsg}\n\n${userMsg}`,
    });
    return { text: result.text ?? "", choice };
  }

  throw new Error(`Unknown provider: ${choice.provider}`);
}

/**
 * Ringkasan provider yang aktif — untuk logging / debug
 */
export function getActiveProviders(): Record<string, boolean> {
  return {
    openai:   !!process.env.OPENAI_API_KEY,
    deepseek: hasDeepSeek(),
    qwen:     hasQwen(),
    gemini:   hasGemini(),
  };
}
