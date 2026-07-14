/**
 * ============================================================================
 * SIMULATION ENGINE — Tahap 9 (bagian 2/3)
 * ============================================================================
 *
 * "Uji kering" (dry-run) Blueprint TANPA LLM: menurunkan sekumpulan SKENARIO
 * percakapan customer yang representatif dari isi Blueprint, lalu menilai
 * apakah konfigurasi punya bekal untuk menangani tiap skenario.
 *
 * Bukan menjalankan percakapan sungguhan — melainkan memeriksa secara
 * deterministik: "untuk skenario X, apakah field-field pendukungnya ada?"
 *
 * PRINSIP (sama seperti engine lain — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tanpa efek samping.
 *   - DETERMINISTIK & idempoten. Hanya MEMBACA Blueprint.
 *   - Belum disambung ke route mana pun — aditif.
 * ============================================================================
 */

import { type Blueprint, type BlueprintModuleName } from "@shared/blueprint/blueprint-schema";

/* ===========================================================================
 * Tipe
 * ======================================================================== */

export type ScenarioStatus = "ready" | "partial" | "unready";

export interface CapabilityRef {
  module: BlueprintModuleName;
  field: string;
}

export interface SimScenario {
  id: string;
  title: string;
  /** Contoh ucapan customer (Bahasa Indonesia). */
  sampleUtterance: string;
  /** Field yang dibutuhkan agar skenario bisa ditangani (mode "any"/"all"). */
  requires: CapabilityRef[];
  /** "any" = cukup salah satu field ada; "all" = semua harus ada. */
  mode: "any" | "all";
}

export interface SimScenarioResult extends SimScenario {
  readiness: number; // 0..1
  status: ScenarioStatus;
  satisfied: CapabilityRef[];
  missing: CapabilityRef[];
}

export interface SimulationReport {
  scenarios: SimScenarioResult[];
  coverage: number; // rata-rata readiness 0..1
  readyCount: number;
  partialCount: number;
  unreadyCount: number;
  summary: string;
}

export interface SimulationOptions {
  /** Ambang readiness untuk status "ready" (default 0.99 ≈ semua terpenuhi). */
  readyThreshold?: number;
}

/* ===========================================================================
 * Utilitas
 * ======================================================================== */

function val(bp: Blueprint, module: BlueprintModuleName, field: string): any {
  return (bp.modules[module].data as any)[field];
}

function has(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function present(bp: Blueprint, c: CapabilityRef): boolean {
  return has(val(bp, c.module, c.field));
}

/* ===========================================================================
 * Penurunan skenario (deterministik, bergantung isi Blueprint)
 * ======================================================================== */

function deriveScenarios(bp: Blueprint): SimScenario[] {
  const scenarios: SimScenario[] = [];

  // Selalu ada — dasar percakapan apa pun.
  scenarios.push({
    id: "greeting",
    title: "Sapaan pembuka",
    sampleUtterance: "Halo, ini siapa ya?",
    mode: "any",
    requires: [
      { module: "identity", field: "greetingMessage" },
      { module: "identity", field: "name" },
    ],
  });

  scenarios.push({
    id: "core-question",
    title: "Pertanyaan inti sesuai peran",
    sampleUtterance: "Bisa bantu saya soal yang jadi keahlianmu?",
    mode: "all",
    requires: [
      { module: "aiEngine", field: "systemPrompt" },
      { module: "goals", field: "primaryOutcome" },
    ],
  });

  scenarios.push({
    id: "off-topic",
    title: "Pertanyaan di luar topik",
    sampleUtterance: "Ngomong-ngomong, ramalan cuaca besok gimana?",
    mode: "any",
    requires: [
      { module: "identity", field: "offTopicHandling" },
      { module: "identity", field: "offTopicResponse" },
      { module: "identity", field: "offTopicBehavior" },
      { module: "identity", field: "avoidTopics" },
      { module: "policy", field: "interactionPolicy" },
    ],
  });

  scenarios.push({
    id: "escalation",
    title: "Customer kesulitan / minta bantuan manusia",
    sampleUtterance: "Saya bingung dan kesal, bisa hubungkan ke orang?",
    mode: "any",
    requires: [
      { module: "agentic", field: "escalationRules" },
      { module: "agentic", field: "actionBoundary" },
      { module: "policy", field: "interactionPolicy" },
    ],
  });

  // Bersyarat — hanya jika fitur terkait dipakai.
  const knowledgeOn = val(bp, "knowledge", "ragEnabled") === true || has(val(bp, "knowledge", "sources"));
  if (knowledgeOn) {
    scenarios.push({
      id: "factual-domain",
      title: "Pertanyaan faktual seputar domain",
      sampleUtterance: "Menurut dokumenmu, bagaimana prosedur resminya?",
      mode: "any",
      requires: [{ module: "knowledge", field: "sources" }],
    });
  }

  const hasProduct =
    has(val(bp, "monetization", "productSummary")) ||
    has(val(bp, "monetization", "productPricing")) ||
    has(val(bp, "monetization", "monthlyPrice"));
  if (hasProduct) {
    scenarios.push({
      id: "pricing",
      title: "Pertanyaan harga",
      sampleUtterance: "Berapa harganya? Ada paket apa saja?",
      mode: "any",
      requires: [
        { module: "monetization", field: "productPricing" },
        { module: "monetization", field: "monthlyPrice" },
        { module: "monetization", field: "productSummary" },
      ],
    });
  }

  const conversionOn = val(bp, "conversion", "conversionEnabled") === true || hasProduct;
  if (conversionOn) {
    scenarios.push({
      id: "purchase-intent",
      title: "Niat membeli / lanjut ke konversi",
      sampleUtterance: "Oke saya tertarik, gimana cara lanjutnya?",
      mode: "any",
      requires: [
        { module: "conversion", field: "conversionGoal" },
        { module: "conversion", field: "conversionCta" },
        { module: "conversion", field: "whatsappCta" },
        { module: "conversion", field: "calendlyUrl" },
        { module: "monetization", field: "paymentUrl" },
      ],
    });
  }

  return scenarios;
}

/* ===========================================================================
 * Engine
 * ======================================================================== */

export function simulateBlueprint(blueprint: Blueprint, options: SimulationOptions = {}): SimulationReport {
  const readyThreshold = options.readyThreshold ?? 0.99;
  const scenarios = deriveScenarios(blueprint);

  const results: SimScenarioResult[] = scenarios.map((s) => {
    const satisfied: CapabilityRef[] = [];
    const missing: CapabilityRef[] = [];
    for (const c of s.requires) {
      (present(blueprint, c) ? satisfied : missing).push(c);
    }

    let readiness: number;
    if (s.mode === "any") {
      readiness = satisfied.length > 0 ? 1 : 0;
    } else {
      readiness = s.requires.length === 0 ? 1 : satisfied.length / s.requires.length;
    }

    const status: ScenarioStatus =
      readiness >= readyThreshold ? "ready" : readiness > 0 ? "partial" : "unready";

    return { ...s, readiness: Math.round(readiness * 100) / 100, status, satisfied, missing };
  });

  const coverage =
    results.length === 0
      ? 1
      : Math.round((results.reduce((sum, r) => sum + r.readiness, 0) / results.length) * 100) / 100;

  const readyCount = results.filter((r) => r.status === "ready").length;
  const partialCount = results.filter((r) => r.status === "partial").length;
  const unreadyCount = results.filter((r) => r.status === "unready").length;

  const summary = `Simulasi ${results.length} skenario: ${readyCount} siap, ${partialCount} sebagian, ${unreadyCount} belum. Cakupan ${coverage}.`;

  return { scenarios: results, coverage, readyCount, partialCount, unreadyCount, summary };
}
