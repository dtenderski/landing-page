import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, Lock, Check, AlertTriangle,
  Brain, Target, ClipboardList, Rocket, RotateCcw, Info, Gauge, Download, Copy,
  FileJson, Share2, FileSignature, Megaphone, BookOpen, Upload,
} from "lucide-react";

/* ── Types (mirror server/blueprint-engine-routes.ts responses) ───────────── */
type InputType = "text" | "textarea" | "select" | "multiselect" | "boolean" | "number" | "list";

type DialogueGate = "dialog" | "kolaborasi" | "kreasi";
interface DialogueQuestion {
  id: string;
  module: string;
  field: string;
  priority: number;
  question: string;
  why?: string;
  inputType: InputType;
  options?: { value: string; label: string }[];
  gate?: DialogueGate;
}
interface GateProgress {
  gate: DialogueGate;
  label: string;
  total: number;
  answered: number;
}
interface DialogueState {
  totalEssential: number;
  answeredEssential: number;
  remainingEssential: number;
  essentialComplete: boolean;
  nextQuestions: DialogueQuestion[];
  gateProgress?: GateProgress[];
}
interface ConfidenceReport {
  overallConfidence: number;
  overallCompletion: number;
  coreReady: boolean;
  weakestFields: { module: string; field: string; confidence: number }[];
  missingRequired: { module: string; field: string }[];
}
interface GapReport {
  readyToApply: boolean;
  blockingCount: number;
  nextActions: string[];
}
interface CritiqueReport {
  overallScore: number;
  grade: string;
  summary: string;
  findings: { dimension: string; kind: string; message: string; recommendation?: string }[];
}
interface SimulationReport {
  coverage: number;
  readyCount: number;
  partialCount: number;
  unreadyCount: number;
  summary: string;
}
interface MasteryGateSummary {
  gate: DialogueGate;
  label: string;
  answered: number;
  total: number;
  completion: number;
}
interface MasteryProfile {
  topic: string | null;
  gates: MasteryGateSummary[];
  answeredFields: number;
  totalFields: number;
  completion: number;
  strengths: string[];
  growthAreas: string[];
  focus: string | null;
  role: string | null;
  narrative: string;
}
interface AnalyzeResponse {
  confidence: ConfidenceReport;
  gaps: GapReport;
  critique: CritiqueReport;
  simulation: SimulationReport;
  masteryProfile?: MasteryProfile;
}
interface ConfigureResult {
  applied: boolean;
  dryRun: boolean;
  mode: "create" | "update";
  agentId?: string;
  agentPatchKeys: string[];
  agentPatchPreview?: Record<string, string>;
  created: { knowledgeBases: number; miniApps: number; integrations: number; projectBrainTemplates: number };
  warnings: string[];
}

type Step = "intro" | "dialogue" | "analyze" | "done";

/* Label ramah untuk field agen yang ditampilkan di pratinjau (fallback: nama key). */
const FIELD_LABELS: Record<string, string> = {
  name: "Nama agen",
  description: "Deskripsi",
  category: "Kategori",
  subcategory: "Subkategori",
  aiModel: "Model AI",
  toneOfVoice: "Nada bicara",
  personality: "Kepribadian",
  communicationStyle: "Gaya komunikasi",
  chatStyle: "Gaya chat",
  language: "Bahasa",
  greetingMessage: "Pesan sambutan",
  systemPrompt: "Instruksi sistem",
  philosophy: "Filosofi",
  tagline: "Tagline",
  temperature: "Temperature",
  maxTokens: "Maks token",
  avatar: "Avatar",
  responseFormat: "Format respons",
  responseStyle: "Gaya respons",
  behaviorPreset: "Preset perilaku",
  autonomyLevel: "Level otonomi",
  responseDepth: "Kedalaman respons",
  outputFormat: "Format keluaran",
  interactionStyle: "Gaya interaksi",
  contextualEmpathy: "Empati kontekstual",
};

const pct = (n: number) => Math.round((n || 0) * 100);

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function BlueprintBuilderPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("intro");
  const [intent, setIntent] = useState("");
  const [blueprint, setBlueprint] = useState<any>(null);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceReport | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [preview, setPreview] = useState<ConfigureResult | null>(null);
  const [created, setCreated] = useState<ConfigureResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [certBusy, setCertBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [presetLabel, setPresetLabel] = useState<string | null>(null);
  const [journeyBonus, setJourneyBonus] = useState(false);
  const [profBusy, setProfBusy] = useState(false);
  const [, setLocation] = useLocation();

  /* Preset via ?preset= — mis. tautan bonus event mengarahkan ke mode reflektif konstruksi.
     Prefill via localStorage `gustafta_blueprint_prefill_v1` (dari Dialog Gustafta).
     Keduanya hanya mengisi awal intent (bisa diedit), tidak memaksa mulai. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("preset");
    if (params.get("journey") === "bonus") setJourneyBonus(true);

    // Prefill dari Dialog Gustafta (menang atas preset bila ada).
    let usedPrefill = false;
    try {
      const raw = localStorage.getItem("gustafta_blueprint_prefill_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.intent === "string" && parsed.intent.trim()) {
          setIntent(parsed.intent.trim());
          setPresetLabel("Dari Dialog Gustafta");
          usedPrefill = true;
        }
        localStorage.removeItem("gustafta_blueprint_prefill_v1");
      }
    } catch { /* storage diblokir — abaikan */ }

    if (!usedPrefill && preset === "konstruksi") {
      setIntent(
        "Saya tenaga ahli konstruksi. Saya ingin mengubah pengalaman lapangan saya menjadi AI asisten profesional " +
        "yang dapat menjawab pertanyaan teknis, menyusun SOP/checklist/lesson learned, dan mendampingi pekerjaan " +
        "sesuai bidang keahlian saya (mis. geoteknik, struktur, K3, SKK, SBU, atau tender).",
      );
      setPresetLabel("Blueprint Reflektif Konstruksi");
    }
  }, []);

  /* ── Sertifikat pembelajaran reflektif (unduh PDF) ── */
  const downloadCertificate = async () => {
    const mp = analysis?.masteryProfile;
    if (!mp) return;
    setCertBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const W = 210, H = 297, M = 18;
      const violet: [number, number, number] = [124, 58, 237];
      const ink: [number, number, number] = [31, 41, 55];
      const soft: [number, number, number] = [107, 114, 128];

      // Latar & bingkai dekoratif
      doc.setFillColor(250, 249, 255);
      doc.rect(0, 0, W, H, "F");
      doc.setDrawColor(...violet);
      doc.setLineWidth(1.2);
      doc.rect(M - 6, M - 6, W - 2 * (M - 6), H - 2 * (M - 6));
      doc.setLineWidth(0.4);
      doc.rect(M - 3.5, M - 3.5, W - 2 * (M - 3.5), H - 2 * (M - 3.5));

      let y = M + 6;
      // Kop
      doc.setTextColor(...violet);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GUSTAFTA · PETA PEMAHAMAN", W / 2, y, { align: "center" });
      y += 10;
      doc.setTextColor(...ink);
      doc.setFontSize(22);
      doc.text("Sertifikat Pembelajaran Reflektif", W / 2, y, { align: "center" });
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...soft);
      doc.text(
        "Peta pemahaman dari refleksi Anda — bukan tes atau penilaian benar-salah.",
        W / 2, y, { align: "center" },
      );
      y += 5;
      const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      doc.text(`Disusun pada ${tanggal}`, W / 2, y, { align: "center" });
      y += 10;

      // Topik
      doc.setDrawColor(...violet);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...soft);
      doc.text("TOPIK PEMAHAMAN", M, y);
      y += 6;
      doc.setFontSize(15);
      doc.setTextColor(...ink);
      const topikLines = doc.splitTextToSize(mp.topic || "Topik belum diberi judul", W - 2 * M);
      doc.text(topikLines, M, y);
      y += topikLines.length * 7 + 4;

      // Tiga gerbang
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...soft);
      doc.text("PROGRES TIGA GERBANG", M, y);
      y += 5;
      const boxW = (W - 2 * M - 2 * 6) / 3;
      const boxH = 22;
      mp.gates.forEach((g, i) => {
        const x = M + i * (boxW + 6);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(221, 214, 254);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...soft);
        const lbl = doc.splitTextToSize(g.label, boxW - 4);
        doc.text(lbl, x + boxW / 2, y + 5, { align: "center" });
        doc.setFontSize(15);
        doc.setTextColor(...violet);
        doc.text(`${pct(g.completion)}%`, x + boxW / 2, y + 14.5, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...soft);
        doc.text(`${g.answered}/${g.total} sudut`, x + boxW / 2, y + 19, { align: "center" });
      });
      y += boxH + 10;

      const section = (title: string, body: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...soft);
        doc.text(title, M, y);
        y += 5.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...ink);
        const lines = doc.splitTextToSize(body, W - 2 * M);
        doc.text(lines, M, y);
        y += lines.length * 5 + 7;
      };

      section("NARASI", mp.narrative);
      if (mp.strengths.length > 0) section("SUDAH DIURAIKAN JELAS", mp.strengths.join(" · "));
      if (mp.growthAreas.length > 0) section("MASIH BISA DITUMBUHKAN", mp.growthAreas.join(" · "));

      // Footer
      doc.setDrawColor(...violet);
      doc.setLineWidth(0.3);
      doc.line(M, H - M - 4, W - M, H - M - 4);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...soft);
      doc.text(
        "Dibuat dengan Gustafta Blueprint Agen AI — mengubah pengetahuan manusia menjadi organisasi AI.",
        W / 2, H - M + 1, { align: "center" },
      );

      const slug = (mp.topic || "sertifikat").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "sertifikat";
      doc.save(`sertifikat-reflektif-${slug}.pdf`);
    } catch (e: any) {
      toast({ title: "Gagal mengunduh sertifikat", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally {
      setCertBusy(false);
    }
  };

  /* ── Salin ringkasan sertifikat sebagai teks ── */
  const copyCertificateText = async () => {
    const mp = analysis?.masteryProfile;
    if (!mp) return;
    const lines: string[] = [];
    lines.push("SERTIFIKAT PEMBELAJARAN REFLEKTIF");
    lines.push("Peta pemahaman dari refleksi Anda — bukan tes atau penilaian benar-salah.");
    lines.push("");
    if (mp.topic) lines.push(`Topik: ${mp.topic}`);
    lines.push(`Progres: ${mp.answeredFields}/${mp.totalFields} sudut refleksi (${pct(mp.completion)}%)`);
    lines.push(mp.gates.map((g) => `${g.label}: ${pct(g.completion)}% (${g.answered}/${g.total})`).join(" | "));
    lines.push("");
    lines.push(mp.narrative);
    if (mp.strengths.length > 0) { lines.push(""); lines.push(`Sudah diuraikan jelas: ${mp.strengths.join(", ")}`); }
    if (mp.growthAreas.length > 0) { lines.push(""); lines.push(`Masih bisa ditumbuhkan: ${mp.growthAreas.join(", ")}`); }
    lines.push("");
    lines.push("Dibuat dengan Gustafta Blueprint Agen AI.");
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast({ title: "Tersalin", description: "Ringkasan sertifikat siap dibagikan." });
    } catch {
      toast({ title: "Gagal menyalin", description: "Browser menolak akses papan klip.", variant: "destructive" });
    }
  };

  /* ── Ekspor Blueprint (spesifikasi chatbot) agar bisa dipakai di tool lain ── */
  const bpVal = (module: string, field: string): any =>
    blueprint?.modules?.[module]?.data?.[field];

  const bpText = (v: any): string => {
    if (v === undefined || v === null || v === "") return "";
    if (Array.isArray(v)) return v.filter(Boolean).join(", ");
    if (typeof v === "boolean") return v ? "Ya" : "Tidak";
    return String(v);
  };

  const blueprintFileName = () => {
    const name = bpText(bpVal("identity", "name")) || "chatbot";
    return `gustafta-blueprint-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chatbot"}`;
  };

  /* Unduh JSON mentah blueprint — format terstruktur untuk ditransfer/impor ke tool lain. */
  const downloadBlueprintJSON = () => {
    if (!blueprint) return;
    try {
      const envelope = {
        type: "gustafta-blueprint",
        version: 1,
        exportedAt: new Date().toISOString(),
        blueprint,
      };
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${blueprintFileName()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Blueprint diunduh", description: "File JSON siap diimpor ke tool lain." });
    } catch {
      toast({ title: "Gagal mengunduh", description: "Coba lagi sebentar.", variant: "destructive" });
    }
  };

  /* Muat kembali blueprint dari file JSON hasil unduhan (envelope "gustafta-blueprint"
     ATAU objek blueprint langsung). Rehidrasi dialog via /state lalu masuk tahap dialog. */
  const importBlueprintJSON = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      let parsed: any;
      try { parsed = JSON.parse(text); } catch { throw new Error("File bukan JSON yang valid."); }
      const bp = parsed?.type === "gustafta-blueprint" && parsed?.blueprint ? parsed.blueprint : parsed;
      if (!bp || typeof bp !== "object" || typeof bp.modules !== "object") {
        throw new Error("Ini bukan file blueprint Gustafta. Gunakan file JSON hasil unduhan dari Blueprint.");
      }
      // Validasi struktur di server (parseBlueprint) sekaligus rehidrasi dialog.
      // 4xx = file blueprint memang tidak valid → GAGALKAN impor (jangan pura-pura sukses).
      let partialRestore = false;
      let dialogueState: DialogueState;
      try {
        const st = await apiRequest("POST", "/api/blueprint/state", { blueprint: bp });
        dialogueState = {
          ...(st.dialogue ?? {}),
          nextQuestions: st.nextQuestions ?? st.dialogue?.nextQuestions ?? [],
        } as DialogueState;
      } catch (stErr: any) {
        const msg = String(stErr?.message || "");
        if (/^40[13]:/.test(msg)) {
          // Sesi habis / tidak berwenang.
          throw new Error("Sesi Anda berakhir. Silakan masuk lagi, lalu ulangi impor.");
        }
        if (/^4\d\d:/.test(msg)) {
          // Ditolak server: format blueprint tidak valid.
          throw new Error("File blueprint tidak dikenali server. Gunakan file JSON hasil unduhan dari Blueprint.");
        }
        // Kegagalan sementara (jaringan) — muat blueprint apa adanya, dialog dipulihkan sebagian.
        partialRestore = true;
        dialogueState = {
          totalEssential: 0, answeredEssential: 0, remainingEssential: 0,
          essentialComplete: true, nextQuestions: [],
        };
      }
      setBlueprint(bp);
      setIntent(typeof bp?.meta?.intent === "string" ? bp.meta.intent : "");
      setAnswers({}); setAnalysis(null); setPreview(null); setCreated(null); setConfidence(null);
      setDialogue(dialogueState);
      setStep("dialogue");
      toast(
        partialRestore
          ? { title: "Blueprint dimuat (sebagian)", description: "Koneksi bermasalah — progres dialog belum pulih penuh, tapi Anda bisa lanjut ke Analisis." }
          : { title: "Blueprint dimuat", description: "Lanjutkan tanya-jawab atau langsung ke Analisis." },
      );
    } catch (e: any) {
      toast({ title: "Gagal memuat", description: e?.message || "File tidak dikenali.", variant: "destructive" });
    } finally {
      setBusy(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  /* Susun brief teks rapi dari blueprint — untuk ditempel ke tool Marketing / Ebook / Ecourse / Generator Dokumen. */
  const buildBlueprintBrief = (): string => {
    const lines: string[] = [];
    const name = bpText(bpVal("identity", "name")) || "Chatbot";
    lines.push(`BRIEF BLUEPRINT — ${name}`);
    lines.push("Spesifikasi chatbot hasil Dialog Gustafta. Bisa dipakai ulang di tool Gustafta lain (Marketing, Ebook, Ecourse, Mini Apps, Generator Dokumen).");
    lines.push("");
    const rows: [string, any][] = [
      ["Tujuan / niat awal", blueprint?.meta?.intent],
      ["Nama", bpVal("identity", "name")],
      ["Deskripsi", bpVal("identity", "description")],
      ["Keahlian utama", bpVal("identity", "expertise")],
      ["Nada bicara", bpVal("identity", "toneOfVoice")],
      ["Bahasa", bpVal("identity", "language")],
      ["Pesan sambutan", bpVal("identity", "greetingMessage")],
      ["Hindari topik", bpVal("identity", "avoidTopics")],
      ["Tujuan utama", bpVal("goals", "primaryOutcome")],
      ["Sasaran pengguna", bpVal("monetization", "productTargetUser")],
      ["Piagam domain / batasan", bpVal("policy", "domainCharter")],
      ["Kepatuhan / risiko", bpVal("policy", "riskCompliance")],
    ];
    for (const [label, raw] of rows) {
      const val = bpText(raw);
      if (val) lines.push(`${label}: ${val}`);
    }
    lines.push("");
    lines.push("Dibuat dengan Gustafta Blueprint Agen AI.");
    return lines.join("\n");
  };

  const copyBlueprintBrief = async () => {
    if (!blueprint) return;
    try {
      await navigator.clipboard.writeText(buildBlueprintBrief());
      toast({ title: "Brief tersalin", description: "Tempel ke tool lain (Marketing, Ebook, Ecourse, Generator Dokumen)." });
    } catch {
      toast({ title: "Gagal menyalin", description: "Browser menolak akses papan klip.", variant: "destructive" });
    }
  };

  /* Kirim brief ke Generator Proposal Jasa — prefill kolom "Kebutuhan klien" lalu pindah halaman. */
  const sendToProposal = () => {
    if (!blueprint) return;
    try {
      localStorage.setItem(
        "gustafta_proposal_prefill_v1",
        JSON.stringify({ kebutuhan: buildBlueprintBrief(), source: "blueprint" }),
      );
      setLocation("/proposal-jasa");
    } catch {
      toast({ title: "Gagal membuka Generator Proposal", description: "Coba lagi sebentar.", variant: "destructive" });
    }
  };

  /* Kirim brief ke Generator Bahan Marketing — prefill kolom "brief" lalu pindah halaman. */
  const sendToMarketing = () => {
    if (!blueprint) return;
    try {
      localStorage.setItem(
        "gustafta_marketing_prefill_v1",
        JSON.stringify({ brief: buildBlueprintBrief(), source: "blueprint" }),
      );
      setLocation("/generator-bahan-marketing");
    } catch {
      toast({ title: "Gagal membuka Generator Marketing", description: "Coba lagi sebentar.", variant: "destructive" });
    }
  };

  /* Kirim brief ke Generator Outline Ebook/Ecourse — prefill kolom "brief" lalu pindah halaman. */
  const sendToEbook = () => {
    if (!blueprint) return;
    try {
      localStorage.setItem(
        "gustafta_ebook_prefill_v1",
        JSON.stringify({ brief: buildBlueprintBrief(), source: "blueprint" }),
      );
      setLocation("/generator-outline-ebook");
    } catch {
      toast({ title: "Gagal membuka Generator Outline", description: "Coba lagi sebentar.", variant: "destructive" });
    }
  };

  /* ── Unduh "Blueprint Profesional" (PDF) — profil diri + saran rancangan chatbot ──
     Menggabungkan Profil Penguasaan (masteryProfile) dengan spesifikasi chatbot
     dari blueprint. Branding acara (ASDAMKINDO × Gustafta) saat jalur bonus. */
  const downloadBlueprintProfesional = async () => {
    if (!blueprint) return;
    setProfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const W = 210, M = 18;
      const indigo: [number, number, number] = [67, 56, 202];
      const ink: [number, number, number] = [31, 41, 55];
      const soft: [number, number, number] = [107, 114, 128];
      const line: [number, number, number] = [224, 231, 255];
      let y = 0;

      // Header band
      doc.setFillColor(...indigo);
      doc.rect(0, 0, W, 34, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Blueprint Profesional", M, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        journeyBonus ? "Bonus Peserta Indobuildtech 2026 — ASDAMKINDO x Gustafta" : "Gustafta Blueprint Agen AI",
        M, 24,
      );
      doc.setFontSize(8);
      doc.text(`Dibuat: ${new Date().toLocaleString("id-ID")}`, M, 30);
      y = 44;

      const ensure = (need: number) => { if (y + need > 282) { doc.addPage(); y = 20; } };
      const heading = (t: string) => {
        ensure(14);
        doc.setTextColor(...indigo);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t, M, y);
        y += 3;
        doc.setDrawColor(...line);
        doc.setLineWidth(0.4);
        doc.line(M, y, W - M, y);
        y += 6;
      };
      const para = (label: string, value: string) => {
        const v = (value || "").trim();
        if (!v) return;
        ensure(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...ink);
        doc.text(label, M, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...soft);
        const lines = doc.splitTextToSize(v, W - M * 2);
        for (const ln of lines) { ensure(6); doc.text(ln, M, y); y += 5; }
        y += 2;
      };

      // Bagian 1 — Profil Profesional (dari refleksi)
      const mp = analysis?.masteryProfile;
      heading("1. Profil Profesional Anda");
      if (mp) {
        if (mp.role) para("Peran / bidang", mp.role);
        if (mp.topic) para("Fokus topik", mp.topic);
        para("Ringkasan pemahaman", mp.narrative);
        if (mp.strengths.length > 0) para("Kekuatan yang sudah jelas", mp.strengths.join(", "));
        if (mp.growthAreas.length > 0) para("Area yang masih bisa ditumbuhkan", mp.growthAreas.join(", "));
        ensure(8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...soft);
        doc.text(
          `Kelengkapan refleksi: ${pct(mp.completion)}% (${mp.answeredFields}/${mp.totalFields} sudut).`,
          M, y,
        );
        y += 8;
      } else {
        para("Catatan", "Jalankan Analisis untuk memunculkan profil penguasaan dari refleksi Anda.");
      }

      // Bagian 2 — Saran Rancangan Chatbot (dari blueprint)
      heading("2. Chatbot yang Disarankan");
      para("Nama", bpText(bpVal("identity", "name")));
      para("Deskripsi", bpText(bpVal("identity", "description")));
      para("Keahlian utama", bpText(bpVal("identity", "expertise")));
      para("Nada bicara", bpText(bpVal("identity", "toneOfVoice")));
      para("Pesan sambutan", bpText(bpVal("identity", "greetingMessage")));
      para("Tujuan utama", bpText(bpVal("goals", "primaryOutcome")));
      para("Sasaran pengguna", bpText(bpVal("monetization", "productTargetUser")));
      para("Batasan / piagam domain", bpText(bpVal("policy", "domainCharter")));
      if (blueprint?.meta?.intent) para("Niat awal", bpText(blueprint.meta.intent));

      // Footer
      ensure(16);
      y += 4;
      doc.setDrawColor(...line);
      doc.line(M, y, W - M, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...soft);
      doc.text(
        "Dokumen ini adalah draf. Tinjau & sunting sebelum menyetujui pembuatan chatbot. Dibuat dengan Gustafta.",
        M, y,
      );

      doc.save(`blueprint-profesional-${blueprintFileName().replace(/^gustafta-blueprint-/, "")}.pdf`);
      toast({ title: "Blueprint Profesional diunduh", description: "Berkas PDF siap Anda tinjau atau bagikan." });
    } catch {
      toast({ title: "Gagal mengunduh", description: "Coba lagi sebentar.", variant: "destructive" });
    } finally {
      setProfBusy(false);
    }
  };

  /* ── Buat tautan berbagi publik (snapshot beku) ── */
  const shareCertificateLink = async () => {
    const mp = analysis?.masteryProfile;
    if (!mp || !blueprint) return;
    setShareBusy(true);
    try {
      const res = await apiRequest("POST", "/api/blueprint/certificate/share", { blueprint });
      const url = `${window.location.origin}${res.path}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "Tautan siap dibagikan", description: "Tautan sudah disalin ke papan klip." });
      } catch {
        toast({ title: "Tautan berbagi dibuat", description: "Salin tautan di bawah untuk membagikannya." });
      }
    } catch (e: any) {
      toast({ title: "Gagal membuat tautan", description: e?.message || "Coba lagi sebentar.", variant: "destructive" });
    } finally {
      setShareBusy(false);
    }
  };

  /* Buka agen yang baru dibuat langsung di Builder (Dashboard): aktifkan lalu navigasi. */
  const openInBuilder = async () => {
    const agentId = created?.agentId;
    if (!agentId) { setLocation("/dashboard"); return; }
    setBusy(true);
    try {
      await apiRequest("POST", `/api/agents/${agentId}/activate`);
      setLocation("/dashboard");
    } catch (e: any) {
      toast({ title: "Gagal membuka Builder", description: e?.message || "Buka manual dari Dashboard.", variant: "destructive" });
      setLocation("/dashboard");
    } finally { setBusy(false); }
  };

  /* ── API helpers ── */
  const start = async () => {
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/blueprint/start", { intent: intent.trim() || undefined });
      setBlueprint(data.blueprint);
      setDialogue(data.dialogue);
      setConfidence(data.confidence);
      setAnswers({});
      setStep("dialogue");
    } catch (e: any) {
      toast({ title: "Gagal memulai", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const submitAnswers = async () => {
    if (!blueprint || !dialogue) return;
    const payload: Record<string, any> = {};
    for (const q of dialogue.nextQuestions) {
      const v = answers[q.id];
      // Boolean: only submit if the user actually toggled it (untouched stays undefined).
      if (q.inputType === "boolean") { if (typeof v === "boolean") payload[q.id] = v; continue; }
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      payload[q.id] = v;
    }
    if (Object.keys(payload).length === 0) {
      toast({ title: "Belum ada jawaban", description: "Isi minimal satu pertanyaan atau lanjut ke analisis.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/blueprint/answer", { blueprint, answers: payload });
      setBlueprint(data.blueprint);
      setDialogue(data.dialogue);
      setConfidence(data.confidence);
      setAnswers({});
      if (data.warnings?.length) {
        toast({ title: "Catatan", description: data.warnings.slice(0, 2).join(" · ") });
      }
    } catch (e: any) {
      toast({ title: "Gagal menyimpan jawaban", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const runAnalyze = async () => {
    if (!blueprint) return;
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/blueprint/analyze", { blueprint });
      setAnalysis(data);
      setPreview(null);
      setStep("analyze");
    } catch (e: any) {
      toast({ title: "Gagal menganalisis", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const previewConfigure = async () => {
    if (!blueprint) return;
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/blueprint/configure", { blueprint, mode: "create", dryRun: true });
      setPreview(data);
    } catch (e: any) {
      toast({ title: "Gagal pratinjau", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const confirmCreate = async () => {
    if (!blueprint) return;
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/blueprint/configure", { blueprint, mode: "create", dryRun: false });
      setCreated(data);
      setStep("done");
      // Jalur Bonus: catat chatbot yang dibuat agar langkah testimoni terbuka.
      if (journeyBonus && data?.agentId) {
        try {
          const raw = localStorage.getItem("gustafta_bonus_journey_v1");
          const j = raw ? JSON.parse(raw) : {};
          j.step3AgentId = String(data.agentId);
          j.step3AgentName = bpText(bpVal("identity", "name")) || "Chatbot Anda";
          localStorage.setItem("gustafta_bonus_journey_v1", JSON.stringify(j));
        } catch { /* storage diblokir — abaikan */ }
      }
    } catch (e: any) {
      toast({ title: "Gagal membuat agen", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const reset = () => {
    setStep("intro"); setIntent(""); setBlueprint(null); setDialogue(null);
    setConfidence(null); setAnswers({}); setAnalysis(null); setPreview(null); setCreated(null);
  };

  /* ── Auth gate ── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="max-w-md mx-auto text-center py-24 px-4" data-testid="gate-login">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Masuk untuk Merancang Agen</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Blueprint Agen AI membuat & mengonfigurasi agen di akun Anda, jadi perlu login dulu.</p>
          <Link href="/login">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="btn-login">
              Masuk <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Header progress ── */
  const dPct = dialogue ? Math.round((dialogue.answeredEssential / Math.max(1, dialogue.totalEssential)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-blueprint-builder">
      <SharedHeader />

      {/* Hero strip */}
      <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Blueprint Agen AI
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Rancang Agen AI lewat Dialog Terpandu</h1>
          <p className="text-sm text-blue-100">Jawab beberapa pertanyaan inti — Blueprint Agen AI menyimpulkan sisanya, menilai keyakinan, lalu menyiapkan konfigurasi agen Anda.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── STEP: INTRO ── */}
        {step === "intro" && (
          <div className="rounded-2xl border bg-white dark:bg-card p-6 space-y-4" data-testid="step-intro">
            <div className="flex items-center gap-2 flex-wrap">
              <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Mulai dari Ide Besar</h2>
              {presetLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5" data-testid="badge-preset">
                  <Sparkles className="h-3 w-3" /> {presetLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {presetLabel
                ? "Mode reflektif: kolom sudah terisi contoh untuk tenaga ahli konstruksi. Sunting sesuai bidang & pengalaman Anda, lalu mulai."
                : "Tuliskan tujuan utama asisten yang ingin Anda bangun. Boleh dikosongkan — Anda tetap bisa lanjut."}
            </p>
            <Textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Contoh: Asisten yang membantu pemilik UMKM menyusun proposal pengajuan KUR ke bank."
              className="min-h-28"
              data-testid="input-intent"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={start} disabled={busy} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="btn-start">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Mulai Merancang
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importBlueprintJSON(f); }}
                data-testid="input-import-blueprint"
              />
              <Button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={busy}
                variant="outline"
                className="gap-2"
                data-testid="btn-import-blueprint"
              >
                <Upload className="h-4 w-4" /> Impor Blueprint (.json)
              </Button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Punya file blueprint yang pernah diunduh? Impor di sini untuk melanjutkan atau membuat agennya kembali — tanpa mengulang tanya-jawab.
            </p>
          </div>
        )}

        {/* ── STEP: DIALOGUE ── */}
        {step === "dialogue" && dialogue && (
          <>
            {/* Progress card */}
            <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-progress">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Progres Esensial</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400" data-testid="text-progress-count">
                  {dialogue.answeredEssential}/{dialogue.totalEssential}
                </span>
              </div>
              <Progress value={dPct} className="h-2" />
              {dialogue.gateProgress && dialogue.gateProgress.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3" data-testid="gate-progress">
                  {dialogue.gateProgress.map((g) => (
                    <div key={g.gate} className="rounded-lg border border-gray-100 dark:border-gray-800 p-2" data-testid={`gate-${g.gate}`}>
                      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight mb-1">{g.label}</div>
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{g.answered}/{g.total}</div>
                    </div>
                  ))}
                </div>
              )}
              {confidence && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <Gauge className="h-3.5 w-3.5 text-emerald-500" />
                  Keyakinan keseluruhan: <span className="font-bold text-gray-900 dark:text-white" data-testid="text-overall-confidence">{pct(confidence.overallConfidence)}%</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  Kelengkapan: {pct(confidence.overallCompletion)}%
                </div>
              )}
            </div>

            {/* Questions */}
            {dialogue.nextQuestions.length > 0 ? (
              <div className="rounded-2xl border bg-white dark:bg-card p-6 space-y-5" data-testid="card-questions">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {dialogue.essentialComplete ? "Pertanyaan Lanjutan (opsional)" : "Pertanyaan Inti"}
                  </h2>
                </div>
                {dialogue.nextQuestions.map((q) => (
                  <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
                ))}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={submitAnswers} disabled={busy} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="btn-submit-answers">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan & Lanjut
                  </Button>
                  <Button onClick={runAnalyze} disabled={busy} variant="outline" className="gap-2" data-testid="btn-to-analyze">
                    <ClipboardList className="h-4 w-4" /> Selesai & Lihat Analisis
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 p-6 text-center" data-testid="card-dialogue-done">
                <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Cukup untuk dianalisis</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Semua pertanyaan terpandu sudah terjawab. Lanjut ke analisis & konfigurasi.</p>
                <Button onClick={runAnalyze} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2" data-testid="btn-to-analyze-2">
                  <ClipboardList className="h-4 w-4" /> Lihat Analisis
                </Button>
              </div>
            )}

            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1" data-testid="btn-reset">
              <RotateCcw className="h-3 w-3" /> Mulai ulang
            </button>
          </>
        )}

        {/* ── STEP: ANALYZE ── */}
        {step === "analyze" && analysis && (
          <div className="space-y-5" data-testid="step-analyze">
            {/* Scorecard */}
            <div className="grid sm:grid-cols-3 gap-3">
              <ScoreCard label="Keyakinan" value={`${pct(analysis.confidence.overallConfidence)}%`} sub={analysis.confidence.coreReady ? "Inti siap" : "Inti belum lengkap"} ok={analysis.confidence.coreReady} />
              <ScoreCard label="Mutu (Kritik)" value={`${pct(analysis.critique.overallScore)}%`} sub={`Grade ${analysis.critique.grade}`} ok={analysis.critique.overallScore >= 0.7} />
              <ScoreCard label="Simulasi" value={`${pct(analysis.simulation.coverage)}%`} sub={`${analysis.simulation.readyCount} skenario siap`} ok={analysis.simulation.coverage >= 0.7} />
            </div>

            {/* Profil Penguasaan atas Topik (sertifikat pembelajaran reflektif) */}
            {analysis.masteryProfile && analysis.masteryProfile.answeredFields > 0 && (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-950/20 p-5" data-testid="card-mastery-profile">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Profil Penguasaan atas Topik</h3>
                </div>
                <p className="text-[11px] text-violet-700/80 dark:text-violet-300/80 mb-3">
                  Peta pemahaman dari refleksi Anda — bukan tes atau penilaian benar-salah.
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" data-testid="text-mastery-narrative">
                  {analysis.masteryProfile.narrative}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {analysis.masteryProfile.gates.map((g) => (
                    <div key={g.gate} className="rounded-lg bg-white dark:bg-card border p-2 text-center" data-testid={`mastery-gate-${g.gate}`}>
                      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight mb-1">{g.label}</div>
                      <div className="text-sm font-bold text-violet-600 dark:text-violet-400">{pct(g.completion)}%</div>
                      <div className="text-[10px] text-gray-400">{g.answered}/{g.total}</div>
                    </div>
                  ))}
                </div>
                {analysis.masteryProfile.strengths.length > 0 && (
                  <div className="mb-2" data-testid="mastery-strengths">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Sudah diuraikan jelas: </span>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300">{analysis.masteryProfile.strengths.slice(0, 6).join(", ")}</span>
                  </div>
                )}
                {analysis.masteryProfile.growthAreas.length > 0 && (
                  <div data-testid="mastery-growth">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Masih bisa ditumbuhkan: </span>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300">{analysis.masteryProfile.growthAreas.slice(0, 6).join(", ")}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-violet-200/70 dark:border-violet-500/20">
                  <Button
                    onClick={downloadCertificate}
                    disabled={certBusy}
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
                    data-testid="btn-download-certificate"
                  >
                    {certBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Unduh Sertifikat (PDF)
                  </Button>
                  <Button
                    onClick={copyCertificateText}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300"
                    data-testid="btn-copy-certificate"
                  >
                    <Copy className="h-3.5 w-3.5" /> Salin ringkasan
                  </Button>
                  <Button
                    onClick={shareCertificateLink}
                    disabled={shareBusy}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300"
                    data-testid="btn-share-certificate"
                  >
                    {shareBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                    Buat tautan berbagi
                  </Button>
                </div>
                {shareUrl && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center" data-testid="share-link-box">
                    <Input
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="text-[11px] bg-white dark:bg-card"
                      data-testid="input-share-url"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-2 shrink-0"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          toast({ title: "Tersalin", description: "Tautan siap dibagikan." });
                        } catch {
                          toast({ title: "Gagal menyalin", description: "Salin manual tautannya.", variant: "destructive" });
                        }
                      }}
                      data-testid="btn-copy-share-url"
                    >
                      <Copy className="h-3.5 w-3.5" /> Salin
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-violet-700/70 dark:text-violet-300/70 mt-2">
                  Simpan atau bagikan peta pemahaman ini sebagai kenangan proses belajar Anda. Tautan berbagi menampilkan salinan beku — perubahan berikutnya tidak mengubah yang sudah dibagikan.
                </p>
              </div>
            )}

            {/* Gaps */}
            <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-gaps">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`h-5 w-5 ${analysis.gaps.readyToApply ? "text-emerald-500" : "text-amber-500"}`} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {analysis.gaps.readyToApply ? "Siap dikonfigurasi" : `${analysis.gaps.blockingCount} hal perlu dilengkapi`}
                </h3>
              </div>
              {analysis.gaps.nextActions.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.gaps.nextActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400" data-testid={`gap-action-${i}`}>
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-500 dark:text-gray-400">Tidak ada rekomendasi tersisa.</p>}
            </div>

            {/* Critique summary */}
            <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-critique">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Catatan Kritik</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{analysis.critique.summary}</p>
              {analysis.critique.findings.slice(0, 4).map((f, i) => (
                <div key={i} className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{f.dimension}</Badge>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{f.message}</span>
                  </div>
                  {f.recommendation && <p className="text-[11px] text-gray-400 mt-1 pl-1">→ {f.recommendation}</p>}
                </div>
              ))}
            </div>

            {/* Ekspor Blueprint — untuk ditransfer ke tool Gustafta lain */}
            <div className="rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 p-5" data-testid="card-export-blueprint">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Ekspor Blueprint (spesifikasi chatbot)</h3>
              </div>
              <p className="text-[11px] text-sky-700/80 dark:text-sky-300/80 mb-3">
                Simpan atau pindahkan blueprint ini untuk dipakai ulang di tool Gustafta lain — Marketing, Ebook, Ecourse, Mini Apps, dan Generator Dokumen.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={downloadBlueprintProfesional}
                  disabled={profBusy}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                  data-testid="btn-download-blueprint-profesional"
                >
                  {profBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Unduh Blueprint Profesional (PDF)
                </Button>
                <Button
                  onClick={downloadBlueprintJSON}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
                  data-testid="btn-download-blueprint-json"
                >
                  <FileJson className="h-3.5 w-3.5" /> Unduh Blueprint (JSON)
                </Button>
                <Button
                  onClick={copyBlueprintBrief}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
                  data-testid="btn-copy-blueprint-brief"
                >
                  <Copy className="h-3.5 w-3.5" /> Salin Brief
                </Button>
                <Button
                  onClick={sendToProposal}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
                  data-testid="btn-send-to-proposal"
                >
                  <FileSignature className="h-3.5 w-3.5" /> Kirim ke Generator Proposal
                </Button>
                <Button
                  onClick={sendToMarketing}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
                  data-testid="btn-send-to-marketing"
                >
                  <Megaphone className="h-3.5 w-3.5" /> Kirim ke Generator Marketing
                </Button>
                <Button
                  onClick={sendToEbook}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
                  data-testid="btn-send-to-ebook"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Kirim ke Generator Outline
                </Button>
              </div>
              <p className="text-[10px] text-sky-700/70 dark:text-sky-300/70 mt-2">
                JSON = format terstruktur untuk diimpor. Brief = teks rapi untuk ditempel langsung ke tool lain. Tombol "Kirim ke..." langsung mengisi brief di generator tujuan (Proposal, Marketing, atau Outline Ebook/Ecourse).
              </p>
            </div>

            {/* Configure preview / create */}
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/20 p-5" data-testid="card-configure">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Buat Agen dari Blueprint</h3>
              </div>
              {!preview ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Lihat pratinjau dulu (tanpa menyimpan apa pun) sebelum benar-benar membuat agen.</p>
                  <Button onClick={previewConfigure} disabled={busy} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="btn-preview-configure">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />} Pratinjau Konfigurasi
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-white dark:bg-card border p-4 mb-3 text-xs space-y-1.5" data-testid="preview-result">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold"><Check className="h-3.5 w-3.5" /> Pratinjau berhasil (belum disimpan)</div>
                    <p className="text-gray-600 dark:text-gray-400">Field agen yang akan diisi: <span className="font-semibold text-gray-900 dark:text-white">{preview.agentPatchKeys.length}</span></p>
                    {preview.agentPatchPreview && Object.keys(preview.agentPatchPreview).length > 0 && (
                      <dl className="mt-1 border-t pt-2 space-y-1" data-testid="preview-values">
                        {Object.entries(preview.agentPatchPreview).map(([key, value]) => (
                          <div key={key} className="flex gap-2" data-testid={`preview-field-${key}`}>
                            <dt className="shrink-0 w-32 text-gray-500 dark:text-gray-400">{FIELD_LABELS[key] || key}</dt>
                            <dd className="flex-1 font-medium text-gray-900 dark:text-white break-words">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 border-t pt-2">Akan dibuat: {preview.created.knowledgeBases} basis pengetahuan · {preview.created.miniApps} mini app · {preview.created.integrations} integrasi</p>
                    {preview.warnings.length > 0 && (
                      <div className="text-amber-600 dark:text-amber-400 pt-1">⚠ {preview.warnings.slice(0, 3).join(" · ")}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={confirmCreate} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2" data-testid="btn-confirm-create">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Buat Agen Sekarang
                    </Button>
                    <Button onClick={() => setPreview(null)} variant="outline" disabled={busy} data-testid="btn-cancel-preview">Batal</Button>
                  </div>
                </>
              )}
            </div>

            <Button onClick={() => setStep("dialogue")} variant="ghost" className="gap-2 text-gray-500" data-testid="btn-back-dialogue">
              <ArrowLeft className="h-4 w-4" /> Kembali ke pertanyaan
            </Button>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && created && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center" data-testid="step-done">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Agen Berhasil Dibuat 🎉</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{created.agentPatchKeys.length} field dikonfigurasi otomatis dari Blueprint Anda.</p>
            {(created.created.knowledgeBases + created.created.miniApps + created.created.integrations) > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{created.created.knowledgeBases} basis pengetahuan · {created.created.miniApps} mini app · {created.created.integrations} integrasi dibuat.</p>
            )}
            {created.warnings.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">⚠ {created.warnings.slice(0, 3).join(" · ")}</p>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {journeyBonus && (
                <Button onClick={() => setLocation("/bonus-indobuildtech")} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2" data-testid="btn-back-to-journey">
                  <ArrowLeft className="h-4 w-4" /> Kembali ke Jalur Bonus (isi testimoni)
                </Button>
              )}
              {created.agentId && (
                <Button onClick={openInBuilder} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2" data-testid="btn-open-in-builder">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Buka di Builder
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2" data-testid="btn-to-dashboard">
                  Buka Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button onClick={reset} variant="outline" className="gap-2" data-testid="btn-build-another">
                <RotateCcw className="h-4 w-4" /> Rancang Agen Lain
              </Button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">"Buka di Builder" mengaktifkan agen ini & membawa Anda ke editor — field sudah terisi otomatis dari Blueprint.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */
function ScoreCard({ label, value, sub, ok }: { label: string; value: string; sub: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-card p-4 text-center" data-testid={`scorecard-${label}`}>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
      <div className={`text-[11px] font-medium mt-1 ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{sub}</div>
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: DialogueQuestion; value: any; onChange: (v: any) => void }) {
  return (
    <div className="space-y-1.5" data-testid={`field-${q.id}`}>
      <Label className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</Label>
      {q.why && <p className="text-[11px] text-gray-400">{q.why}</p>}

      {q.inputType === "textarea" && (
        <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="min-h-20" data-testid={`q-input-${q.id}`} />
      )}
      {q.inputType === "text" && (
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} data-testid={`q-input-${q.id}`} />
      )}
      {q.inputType === "number" && (
        <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} data-testid={`q-input-${q.id}`} />
      )}
      {q.inputType === "list" && (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pisahkan dengan koma atau baris baru"
          className="min-h-16"
          data-testid={`q-input-${q.id}`}
        />
      )}
      {q.inputType === "boolean" && (
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={value === true} onCheckedChange={(c) => onChange(c)} data-testid={`q-switch-${q.id}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{value === true ? "Ya" : "Tidak"}</span>
        </div>
      )}
      {q.inputType === "select" && q.options && (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger data-testid={`q-select-${q.id}`}><SelectValue placeholder="Pilih..." /></SelectTrigger>
          <SelectContent>
            {q.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {q.inputType === "multiselect" && q.options && (
        <div className="flex flex-wrap gap-2 pt-1" data-testid={`q-multiselect-${q.id}`}>
          {q.options.map((o) => {
            const arr: string[] = Array.isArray(value) ? value : [];
            const active = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(active ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-card border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-400"}`}
                data-testid={`q-option-${q.id}-${o.value}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
