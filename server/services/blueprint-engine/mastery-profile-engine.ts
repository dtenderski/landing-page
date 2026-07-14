/**
 * ============================================================================
 * MASTERY PROFILE ENGINE — Dialog Reflektif (3 Gerbang)
 * ============================================================================
 *
 * Menyusun "Profil Penguasaan atas Topik" dari jawaban REFLEKTIF user (modul
 * `reflection`). Ini adalah SERTIFIKAT PEMBELAJARAN REFLEKTIF gaya baru — sebuah
 * PETA PEMAHAMAN, BUKAN tes psikometri/IQ dan BUKAN penilaian benar-salah.
 *
 * PRINSIP (sama seperti engine Blueprint lain — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tidak ada efek samping.
 *   - DETERMINISTIK & idempoten. Hanya MEMBACA blueprint.
 *   - Seluruh teks keluaran memakai Bahasa Indonesia sederhana.
 * ============================================================================
 */

import { type Blueprint } from "@shared/blueprint/blueprint-schema";

export type MasteryGate = "dialog" | "kolaborasi" | "kreasi";

export interface MasteryGateSummary {
  gate: MasteryGate;
  label: string;
  answered: number;
  total: number;
  /** 0..1 */
  completion: number;
}

export interface MasteryProfile {
  /** Topik peta pemahaman (dari ide besar / intent). */
  topic: string | null;
  gates: MasteryGateSummary[];
  /** Jumlah field refleksi yang benar-benar diisi user. */
  answeredFields: number;
  totalFields: number;
  /** 0..1 kelengkapan refleksi keseluruhan. */
  completion: number;
  /** Hal-hal yang sudah diuraikan cukup dalam (bukan skor benar/salah). */
  strengths: string[];
  /** Bagian yang masih bisa ditumbuhkan (belum diisi). */
  growthAreas: string[];
  /** Fokus perubahan utama (dari titik nyeri / karya yang diinginkan). */
  focus: string | null;
  /** Peran yang dipilih user (label ramah). */
  role: string | null;
  /** Narasi ramah 1 paragraf. */
  narrative: string;
}

/** Kelompok field per gerbang. */
const GATE_FIELDS: Record<MasteryGate, string[]> = {
  dialog: [
    "educationBackground",
    "knowledgeSource",
    "mastered",
    "uncertain",
    "vision",
    "desiredChange",
    "personalMeaning",
  ],
  kolaborasi: [
    "currentReality",
    "painPoint",
    "stakeholders",
    "pastAttempts",
    "successStory",
    "lessonsLearned",
    "repetitiveBurden",
    "riskIfIgnored",
  ],
  kreasi: [
    "desiredRole",
    "desiredCreation",
    "humanVsAiBoundary",
    "beneficiary",
    "successVision",
    "nonNegotiableValues",
    "biggestHope",
  ],
};

const GATE_LABELS: Record<MasteryGate, string> = {
  dialog: "Gerbang 1 — Dialog",
  kolaborasi: "Gerbang 2 — Kolaborasi",
  kreasi: "Gerbang 3 — Kreasi",
};

const FIELD_LABELS: Record<string, string> = {
  educationBackground: "latar belakang & pengalaman",
  knowledgeSource: "sumber pengetahuan",
  mastered: "hal yang sudah dikuasai",
  uncertain: "hal yang masih ingin didalami",
  vision: "visi besar",
  desiredChange: "perubahan yang diharapkan",
  personalMeaning: "makna pribadi",
  currentReality: "kondisi nyata saat ini",
  painPoint: "titik nyeri utama",
  stakeholders: "orang yang terlibat",
  pastAttempts: "upaya yang pernah dicoba",
  successStory: "kisah keberhasilan",
  lessonsLearned: "pelajaran berharga",
  repetitiveBurden: "beban berulang",
  riskIfIgnored: "risiko bila dibiarkan",
  desiredRole: "peran yang diinginkan",
  desiredCreation: "karya yang ingin diciptakan",
  humanVsAiBoundary: "batas manusia vs AI",
  beneficiary: "penerima manfaat",
  successVision: "gambaran berhasil",
  nonNegotiableValues: "nilai yang dijaga",
  biggestHope: "harapan terbesar",
};

const ROLE_LABELS: Record<string, string> = {
  pelaku: "Pelaku langsung",
  pengarah: "Pengarah",
  "pengambil-keputusan": "Pengambil keputusan",
  kombinasi: "Kombinasi peran",
};

/** Ambang panjang jawaban agar dianggap "diuraikan cukup dalam". */
const SUBSTANTIAL_MIN_CHARS = 40;

function str(v: any): string {
  return typeof v === "string" ? v.trim() : "";
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Bangun Profil Penguasaan atas Topik dari modul refleksi Blueprint.
 * Aman terhadap blueprint parsial (field kosong → dilewati, tidak error).
 */
export function buildMasteryProfile(blueprint: Blueprint): MasteryProfile {
  const data = (blueprint.modules.reflection?.data ?? {}) as Record<string, any>;
  const topic = str(blueprint.meta?.intent) || null;

  const gates: MasteryGateSummary[] = (Object.keys(GATE_FIELDS) as MasteryGate[]).map((gate) => {
    const fields = GATE_FIELDS[gate];
    const answered = fields.filter((f) => str(data[f]).length > 0).length;
    return {
      gate,
      label: GATE_LABELS[gate],
      answered,
      total: fields.length,
      completion: fields.length === 0 ? 0 : round3(answered / fields.length),
    };
  });

  const allFields = Object.values(GATE_FIELDS).flat();
  const answeredFields = allFields.filter((f) => str(data[f]).length > 0).length;
  const totalFields = allFields.length;

  const strengths: string[] = [];
  const growthAreas: string[] = [];
  for (const f of allFields) {
    const val = str(data[f]);
    if (val.length === 0) {
      growthAreas.push(FIELD_LABELS[f] ?? f);
    } else if (val.length >= SUBSTANTIAL_MIN_CHARS || f === "desiredRole") {
      strengths.push(FIELD_LABELS[f] ?? f);
    }
  }

  const focus = str(data.painPoint) || str(data.desiredCreation) || str(data.desiredChange) || null;
  const roleRaw = str(data.desiredRole);
  const role = roleRaw ? ROLE_LABELS[roleRaw] ?? roleRaw : null;

  return {
    topic,
    gates,
    answeredFields,
    totalFields,
    completion: totalFields === 0 ? 0 : round3(answeredFields / totalFields),
    strengths,
    growthAreas,
    focus,
    role,
    narrative: buildNarrative({ topic, answeredFields, totalFields, strengths, growthAreas, focus, role }),
  };
}

function buildNarrative(args: {
  topic: string | null;
  answeredFields: number;
  totalFields: number;
  strengths: string[];
  growthAreas: string[];
  focus: string | null;
  role: string | null;
}): string {
  const { topic, answeredFields, totalFields, strengths, growthAreas, focus, role } = args;

  if (answeredFields === 0) {
    return "Peta pemahaman Anda belum terisi. Jawab pertanyaan reflektif di ketiga gerbang untuk mulai menyusun profil ini.";
  }

  const parts: string[] = [];
  parts.push(
    topic
      ? `Ini peta pemahaman Anda tentang "${topic}" — bukan tes atau penilaian benar-salah, melainkan cermin dari cara Anda memaknai topik ini.`
      : "Ini peta pemahaman Anda — bukan tes atau penilaian benar-salah, melainkan cermin dari cara Anda memaknai topik ini.",
  );
  parts.push(`Anda telah menuangkan ${answeredFields} dari ${totalFields} sudut refleksi.`);

  if (strengths.length > 0) {
    parts.push(`Bagian yang sudah Anda uraikan dengan jelas: ${listToText(strengths.slice(0, 4))}.`);
  }
  if (focus) {
    parts.push(`Fokus perubahan Anda tampak pada: ${trimText(focus, 160)}`);
  }
  if (role) {
    parts.push(`Peran yang Anda pilih dalam perjalanan ini: ${role}.`);
  }
  if (growthAreas.length > 0) {
    parts.push(
      `Bagian yang masih bisa ditumbuhkan bila Anda mau melengkapinya: ${listToText(growthAreas.slice(0, 4))}.`,
    );
  }
  return parts.join(" ");
}

function listToText(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " & " + items[items.length - 1];
}

function trimText(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}
