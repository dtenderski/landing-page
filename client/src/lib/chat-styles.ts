export const CHAT_STYLES = {
  socratic: {
    label: "Sokratik",
    emoji: "🔍",
    tagline: "Bertanya, bukan menjawab",
    description: "Memandu pengguna menemukan jawaban sendiri melalui pertanyaan bertahap. Tidak memberi jawaban langsung — semua mendorong pelajar berpikir.",
    examples: ["AI Tutor", "EducounselClaw", "LexSkripsi"],
    bgClass: "bg-indigo-50 dark:bg-indigo-950/30",
    textClass: "text-indigo-700 dark:text-indigo-300",
    borderClass: "border-indigo-200 dark:border-indigo-800",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/40",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    dotClass: "bg-indigo-500",
  },
  direktif: {
    label: "Direktif",
    emoji: "📋",
    tagline: "Tegas berbasis data",
    description: "Memberikan instruksi langsung, berbasis regulasi dan data faktual. Tanpa spekulasi — selalu kutip sumber.",
    examples: ["SBUClaw", "SKK Coach", "LexCom Legal"],
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-800",
    badgeBg: "bg-blue-100 dark:bg-blue-900/40",
    badgeText: "text-blue-700 dark:text-blue-300",
    dotClass: "bg-blue-500",
  },
  kolaboratif: {
    label: "Kolaboratif",
    emoji: "🤝",
    tagline: "Berpikir bersama",
    description: "Mitra berpikir yang mengeksplorasi pilihan bersama pengguna. Co-creation, brainstorming, dan eksplorasi kemungkinan secara terbuka.",
    examples: ["BrainClaw", "KonstraClaw", "TenderaClaw"],
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  coach: {
    label: "Coach",
    emoji: "🏆",
    tagline: "Mendorong potensi",
    description: "Memotivasi, mendampingi, dan mendorong pengguna untuk berkembang. Fokus pada proses dan pertumbuhan — bukan hanya hasil.",
    examples: ["SKK Coach", "K3ManClaw", "MentorAgent"],
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-800",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  fasilitator: {
    label: "Fasilitator",
    emoji: "🎙️",
    tagline: "Menghidupkan dialog",
    description: "Mengorganisir, menghubungkan, dan memastikan semua suara didengar. Ideal untuk konteks komunitas, kelompok belajar, atau diskusi kolektif.",
    examples: ["Community Manager", "TerasLPJK", "Forum Diskusi"],
    bgClass: "bg-violet-50 dark:bg-violet-950/30",
    textClass: "text-violet-700 dark:text-violet-300",
    borderClass: "border-violet-200 dark:border-violet-800",
    badgeBg: "bg-violet-100 dark:bg-violet-900/40",
    badgeText: "text-violet-700 dark:text-violet-300",
    dotClass: "bg-violet-500",
  },
} as const;

export type ChatStyleKey = keyof typeof CHAT_STYLES;
export const CHAT_STYLE_KEYS = Object.keys(CHAT_STYLES) as ChatStyleKey[];

export function getChatStyle(key?: string | null): (typeof CHAT_STYLES)[ChatStyleKey] {
  if (key && key in CHAT_STYLES) return CHAT_STYLES[key as ChatStyleKey];
  return CHAT_STYLES.direktif;
}
